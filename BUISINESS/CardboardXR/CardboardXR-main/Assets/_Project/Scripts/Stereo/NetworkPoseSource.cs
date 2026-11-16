using System;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading;
using UnityEngine;

namespace CardboardXR.Stereo
{
    /// <summary>
    /// STARK CARDBOARDXR // NETWORK 6DOF POSE SOURCE (Hybrid Architecture v10.3.01 PRO)
    /// ==============================================================================
    /// - Nhận dữ liệu 6DoF Pose nhị phân (28 bytes) từ iPhone 13 qua UDP Port 23457 (Python Tethered Bridge).
    /// - Định dạng gói tin: 3 float (X, Y, Z) + 4 float Quaternion (Qx, Qy, Qz, Qw) từ ARKit VIO.
    /// - Tự động điều khiển StereoRig / Head Camera Rig trên Unity Windows (RTX 4060 GPU).
    /// - Hỗ trợ gán trực tiếp hoặc cung cấp dữ liệu cho HeadPoseFusion qua TryGetLatest.
    /// - Tích hợp gọi Roamies J.A.R.V.I.S. AI (Ctrl+Shift+A) cấp hệ điều hành qua Win32 SendInput.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class NetworkPoseSource : MonoBehaviour
    {
        public struct Sample
        {
            public Vector3 position;
            public Quaternion rotation;
            public long timestampNs;
        }

        [Header("Network Connection")]
        [Tooltip("Cổng UDP nhận 6DoF pose từ stark_tethered_bridge.py")]
        [SerializeField] int m_Port = 23457;
        [SerializeField] bool m_AutoStart = true;

        [Header("Target & Calibration")]
        [Tooltip("Transform đầu cần di chuyển (mặc định là chính transform này nếu để trống)")]
        [SerializeField] Transform m_TargetTransform;
        [Tooltip("Hệ số tỉ lệ di chuyển không gian (1.0 = mét thực tế)")]
        [SerializeField] float m_PositionScale = 1.0f;
        [Tooltip("Độ lệch vị trí sau khi Recenter")]
        [SerializeField] Vector3 m_PositionOffset = Vector3.zero;

        [Header("Coordinate Conversion (iOS ARKit -> Unity)")]
        [Tooltip("Đảo trục Z để chuyển đổi hệ trục tọa độ Right-Handed (iOS) sang Left-Handed (Unity)")]
        [SerializeField] bool m_InvertZ = true;
        [SerializeField] bool m_InvertX = false;

        [Header("Interpolation & Smoothing")]
        [SerializeField] bool m_EnableSmoothing = true;
        [SerializeField] float m_PositionSmoothing = 30f;
        [SerializeField] float m_RotationSmoothing = 35f;

        [Header("J.A.R.V.I.S. Roamies Integration")]
        [SerializeField] KeyCode m_JarvisHotkey = KeyCode.J;
        [SerializeField] KeyCode m_RecenterHotkey = KeyCode.R;

        [Header("Live Telemetry")]
        [SerializeField] bool m_IsConnected = false;
        [SerializeField] Vector3 m_LatestRawPosition;
        [SerializeField] Quaternion m_LatestRawRotation = Quaternion.identity;
        [SerializeField] float m_PacketsPerSecond = 0f;

        UdpClient m_UdpClient;
        Thread m_ReceiveThread;
        bool m_IsRunning = false;
        readonly object m_Lock = new();

        Vector3 m_TargetPos;
        Quaternion m_TargetRot = Quaternion.identity;
        long m_LatestTimestampNs = 0;
        bool m_HasSample = false;
        int m_PacketCount = 0;
        float m_LastFpsTime = 0f;

        Sample m_Sample;

        public bool IsConnected => m_IsConnected;
        public bool HasSample => m_HasSample;
        public Vector3 CurrentPosition => m_TargetPos;
        public Quaternion CurrentRotation => m_TargetRot;

        // Win32 SendInput cho Roamies JARVIS AI trên Windows 11
        #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        const int VK_CONTROL = 0x11;
        const int VK_SHIFT = 0x10;
        const int VK_A = 0x41;
        const uint KEYEVENTF_KEYUP = 0x0002;

        public static void TriggerJarvisSnap()
        {
            keybd_event(VK_CONTROL, 0, 0, 0);
            keybd_event(VK_SHIFT, 0, 0, 0);
            keybd_event(VK_A, 0, 0, 0);
            keybd_event(VK_A, 0, KEYEVENTF_KEYUP, 0);
            keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0);
            keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
            Debug.Log("[STARK-JARVIS] >>> Kich hoat Roamies AI Vision Snap qua Win32 keybd_event!");
        }
        #else
        public static void TriggerJarvisSnap() {}
        #endif

        public bool TryGetLatest(out Sample sample)
        {
            lock (m_Lock)
            {
                sample = m_Sample;
                return m_HasSample && m_IsConnected;
            }
        }

        void Awake()
        {
            if (m_TargetTransform == null)
            {
                m_TargetTransform = transform;
            }
        }

        void OnEnable()
        {
            if (m_AutoStart)
            {
                StartReceiver();
            }
        }

        void OnDisable()
        {
            StopReceiver();
        }

        public void StartReceiver()
        {
            if (m_IsRunning) return;

            try
            {
                m_UdpClient = new UdpClient();
                m_UdpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                m_UdpClient.Client.Bind(new IPEndPoint(IPAddress.Any, m_Port));

                m_IsRunning = true;
                m_ReceiveThread = new Thread(ReceiveWorker)
                {
                    IsBackground = true,
                    Name = "STARK_NetworkPose_Receiver"
                };
                m_ReceiveThread.Start();
                Debug.Log($"[STARK 6DoF] NetworkPoseSource da san sang tren UDP Port {m_Port} (RTX 4060 GPU Mode)");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[STARK 6DoF] Loi khoi tao UDP Port {m_Port}: {ex.Message}");
            }
        }

        public void StopReceiver()
        {
            m_IsRunning = false;
            try
            {
                m_UdpClient?.Close();
                m_UdpClient = null;
            }
            catch { }

            if (m_ReceiveThread != null && m_ReceiveThread.IsAlive)
            {
                m_ReceiveThread.Abort();
                m_ReceiveThread = null;
            }
            m_IsConnected = false;
        }

        void ReceiveWorker()
        {
            IPEndPoint remoteEndPoint = new(IPAddress.Any, 0);

            while (m_IsRunning && m_UdpClient != null)
            {
                try
                {
                    byte[] bytes = m_UdpClient.Receive(ref remoteEndPoint);
                    if (bytes != null && bytes.Length >= 28)
                    {
                        // 28 bytes Little-Endian:
                        // px (0..3), py (4..7), pz (8..11)
                        // qx (12..15), qy (16..19), qz (20..23), qw (24..27)
                        float px = BitConverter.ToSingle(bytes, 0);
                        float py = BitConverter.ToSingle(bytes, 4);
                        float pz = BitConverter.ToSingle(bytes, 8);

                        float qx = BitConverter.ToSingle(bytes, 12);
                        float qy = BitConverter.ToSingle(bytes, 16);
                        float qz = BitConverter.ToSingle(bytes, 20);
                        float qw = BitConverter.ToSingle(bytes, 24);

                        // Chuyển đổi hệ tọa độ iOS ARKit -> Unity Left-Handed
                        float x = m_InvertX ? -px : px;
                        float y = py;
                        float z = m_InvertZ ? -pz : pz;

                        float rx = qx;
                        float ry = -qy;
                        float rz = m_InvertZ ? -qz : qz;
                        float rw = qw;

                        Vector3 rawPos = new(x * m_PositionScale, y * m_PositionScale, z * m_PositionScale);
                        Quaternion rawRot = new(rx, ry, rz, rw);

                        lock (m_Lock)
                        {
                            m_TargetPos = rawPos + m_PositionOffset;
                            m_TargetRot = rawRot;
                            m_LatestRawPosition = rawPos;
                            m_LatestRawRotation = rawRot;
                            m_HasSample = true;
                            m_IsConnected = true;
                            m_LatestTimestampNs = (long)(Time.realtimeSinceStartupAsDouble * 1e9);

                            m_Sample = new Sample
                            {
                                position = m_TargetPos,
                                rotation = m_TargetRot,
                                timestampNs = m_LatestTimestampNs
                            };
                            m_PacketCount++;
                        }
                    }
                }
                catch (SocketException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[STARK 6DoF] Loi parse packet: {ex.Message}");
                }
            }
            m_IsConnected = false;
        }

        void Update()
        {
            // Đo tần số gói tin mỗi giây
            if (Time.unscaledTime - m_LastFpsTime >= 1.0f)
            {
                m_PacketsPerSecond = m_PacketCount / (Time.unscaledTime - m_LastFpsTime);
                m_PacketCount = 0;
                m_LastFpsTime = Time.unscaledTime;
            }

            // Phím tắt Recenter và gọi Roamies JARVIS
            if (Input.GetKeyDown(m_RecenterHotkey))
            {
                Recenter();
            }

            if (Input.GetKeyDown(m_JarvisHotkey))
            {
                TriggerJarvisSnap();
            }

            if (!m_HasSample || m_TargetTransform == null) return;

            Vector3 targetP;
            Quaternion targetR;
            lock (m_Lock)
            {
                targetP = m_TargetPos;
                targetR = m_TargetRot;
            }

            // Nội suy mượt mà 6DoF để triệt tiêu micro-jitter
            if (m_EnableSmoothing)
            {
                float dt = Time.unscaledDeltaTime;
                m_TargetTransform.localPosition = Vector3.Lerp(m_TargetTransform.localPosition, targetP, dt * m_PositionSmoothing);
                m_TargetTransform.localRotation = Quaternion.Slerp(m_TargetTransform.localRotation, targetR, dt * m_RotationSmoothing);
            }
            else
            {
                m_TargetTransform.localPosition = targetP;
                m_TargetTransform.localRotation = targetR;
            }
        }

        /// <summary>
        /// Đặt lại tâm tọa độ hiện tại về gốc không gian (0, 0, 0)
        /// </summary>
        public void Recenter()
        {
            lock (m_Lock)
            {
                m_PositionOffset = -m_LatestRawPosition;
            }
            Debug.Log("[STARK 6DoF] Da Recenter toa do ve (0, 0, 0)");
        }
    }
}
