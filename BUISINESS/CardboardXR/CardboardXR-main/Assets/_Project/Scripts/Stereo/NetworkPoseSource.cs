using System;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading;
using UnityEngine;
using UnityEngine.InputSystem;
using Debug = UnityEngine.Debug;

namespace CardboardXR.Stereo
{
    /// <summary>
    /// STARK CARDBOARDXR // NETWORK 6DOF POSE SOURCE (Hybrid Architecture v10.3.03 PRO)
    /// ==============================================================================
    /// - Nhận dữ liệu 6DoF Pose nhị phân (28 bytes) từ iPhone 13 qua UDP Port 23457 (Python Tethered Bridge).
    /// - Định dạng gói tin: 3 float (X, Y, Z) + 4 float Quaternion (Qx, Qy, Qz, Qw) từ ARKit VIO.
    /// - Chuyển đổi chính xác tuyệt đối từ hệ trục Right-Handed của ARKit (-Z forward)
    ///   sang Left-Handed của Unity (+Z forward) qua phép liên hợp ma trận S*R*S với S = diag(1, 1, -1):
    ///   P_unity = (X, Y, -Z), Q_unity = (-Qx, -Qy, Qz, Qw).
    /// - Thread-safe 100% (dùng Stopwatch.GetTimestamp() thay vì Time.* trong luồng nền).
    /// - Tương thích Unity InputSystem mới và tích hợp gọi Roamies J.A.R.V.I.S. AI (Ctrl+Shift+A).
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
        [SerializeField] Quaternion m_RotationOffset = Quaternion.identity;

        [Header("Coordinate Conversion (iOS ARKit -> Unity Left-Handed)")]
        [Tooltip("Đảo trục Z để chuyển đổi hệ trục tọa độ Right-Handed (iOS ARKit) sang Left-Handed (Unity)")]
        [SerializeField] bool m_InvertZ = true;
        [SerializeField] bool m_InvertX = false;

        [Header("Interpolation & Smoothing")]
        [SerializeField] bool m_EnableSmoothing = true;
        [SerializeField] float m_PositionSmoothing = 35f;
        [SerializeField] float m_RotationSmoothing = 40f;

        [Header("Live Telemetry")]
        [SerializeField] bool m_IsConnected = false;
        [SerializeField] Vector3 m_LatestRawPosition;
        [SerializeField] Quaternion m_LatestRawRotation = Quaternion.identity;
        [SerializeField] float m_PacketsPerSecond = 0f;

        UdpClient m_UdpClient;
        Thread m_ReceiveThread;
        volatile bool m_IsRunning = false;
        readonly object m_Lock = new();

        Vector3 m_TargetPos;
        Quaternion m_TargetRot = Quaternion.identity;
        long m_LatestTimestampNs = 0;
        long m_LastPacketStopwatchTicks = 0;
        bool m_HasSample = false;
        int m_PacketCount = 0;
        float m_LastFpsTime = 0f;

        Sample m_Sample;

        /// <summary>
        /// Khi HeadPoseFusion điều khiển transform, cờ này được đặt = false để tránh 2 script cùng ghi đè transform.
        /// </summary>
        public bool DrivesTransform { get; set; } = true;

        public bool IsConnected
        {
            get
            {
                lock (m_Lock)
                {
                    if (!m_IsConnected) return false;
                    // Timeout 500ms nếu ngừng nhận gói UDP
                    double elapsedSec = (Stopwatch.GetTimestamp() - m_LastPacketStopwatchTicks) / (double)Stopwatch.Frequency;
                    return elapsedSec < 0.5;
                }
            }
        }

        public bool HasSample => m_HasSample;
        public Vector3 CurrentPosition => m_TargetPos;
        public Quaternion CurrentRotation => m_TargetRot;

        // Win32 SendInput cho Roamies JARVIS AI trên Windows 11
        #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        const byte VK_CONTROL = 0x11;
        const byte VK_SHIFT = 0x10;
        const byte VK_A = 0x41;
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
                if (!m_HasSample || !m_IsConnected) return false;
                double elapsedSec = (Stopwatch.GetTimestamp() - m_LastPacketStopwatchTicks) / (double)Stopwatch.Frequency;
                return elapsedSec < 0.5;
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
                try { m_ReceiveThread.Join(150); } catch { }
                m_ReceiveThread = null;
            }
            m_IsConnected = false;
        }

        void ReceiveWorker()
        {
            IPEndPoint remoteEndPoint = new(IPAddress.Any, 0);
            double tickToNs = 1_000_000_000.0 / Stopwatch.Frequency;

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

                        // Chuyển đổi hệ tọa độ iOS ARKit Right-Handed (-Z forward) -> Unity Left-Handed (+Z forward)
                        // Phép liên hợp phản xạ trục Z: S = diag(1, 1, -1) => S * R(qx, qy, qz, qw) * S = R(-qx, -qy, qz, qw)
                        float x = m_InvertX ? -px : px;
                        float y = py;
                        float z = m_InvertZ ? -pz : pz;

                        float rx = m_InvertZ ? -qx : qx;
                        float ry = m_InvertZ ? -qy : qy;
                        float rz = m_InvertX ? -qz : qz;
                        float rw = qw;

                        Vector3 rawPos = new(x * m_PositionScale, y * m_PositionScale, z * m_PositionScale);
                        Quaternion rawRot = new(rx, ry, rz, rw);
                        long nowTicks = Stopwatch.GetTimestamp();
                        long nowNs = (long)(nowTicks * tickToNs);

                        lock (m_Lock)
                        {
                            m_LatestRawPosition = rawPos;
                            m_LatestRawRotation = rawRot;
                            m_TargetPos = m_RotationOffset * (rawPos + m_PositionOffset);
                            m_TargetRot = m_RotationOffset * rawRot;
                            m_HasSample = true;
                            m_IsConnected = true;
                            m_LastPacketStopwatchTicks = nowTicks;
                            m_LatestTimestampNs = nowNs;

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
                catch (ObjectDisposedException)
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

            // Phím tắt Recenter (R) và gọi Roamies JARVIS (J) qua Unity InputSystem mới
            var kb = Keyboard.current;
            if (kb != null)
            {
                if (kb.rKey.wasPressedThisFrame)
                {
                    Recenter();
                }
                if (kb.jKey.wasPressedThisFrame)
                {
                    TriggerJarvisSnap();
                }
            }

            if (!DrivesTransform || !m_HasSample || m_TargetTransform == null) return;

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
                m_TargetTransform.localPosition = Vector3.Lerp(m_TargetTransform.localPosition, targetP, Mathf.Clamp01(dt * m_PositionSmoothing));
                m_TargetTransform.localRotation = Quaternion.Slerp(m_TargetTransform.localRotation, targetR, Mathf.Clamp01(dt * m_RotationSmoothing));
            }
            else
            {
                m_TargetTransform.localPosition = targetP;
                m_TargetTransform.localRotation = targetR;
            }
        }

        /// <summary>
        /// Đặt lại tâm tọa độ và hướng nhìn hiện tại về gốc không gian (0, 0, 0)
        /// </summary>
        public void Recenter()
        {
            lock (m_Lock)
            {
                m_PositionOffset = -m_LatestRawPosition;
                m_RotationOffset = Quaternion.Euler(0f, -m_LatestRawRotation.eulerAngles.y, 0f);
                m_TargetPos = Vector3.zero;
                m_TargetRot = m_RotationOffset * m_LatestRawRotation;
            }
            Debug.Log("[STARK 6DoF] Da Recenter toa do va goc nhin 6DoF ve (0, 0, 0)");
        }
    }
}
