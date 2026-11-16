import UIKit
import AVFoundation
import Network

class ViewController: UIViewController, CameraEngineDelegate, H264EncoderDelegate, USBTunnelDelegate {
    
    // Core Modules
    private let cameraEngine = CameraEngine()
    private let h264Encoder = H264Encoder()
    private let usbTunnel = USBTunnel()
    
    // UI Elements
    private let cameraPreviewView = UIView()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let vrDisplayImageView = UIImageView()
    private let permissionButton = UIButton(type: .system)
    
    // Futuristic HUD
    private let hudOverlay = UIView()
    private let statusCard = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    private let statusDot = UIView()
    private let statusLabel = UILabel()
    private let fpsLabel = UILabel()
    private let statsLabel = UILabel()
    
    // Controls
    private let controlCard = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    private let resSegment = UISegmentedControl(items: ["1080p HD", "4K UHD"])
    private let fpsSegment = UISegmentedControl(items: ["30 FPS", "60 FPS", "120 FPS"])
    private let modeSegment = UISegmentedControl(items: ["Camera Thuc", "Kinh VR SBS"])
    
    private var isHUDHidden = false
    private var hudDismissTimer: Timer?
    
    override var prefersStatusBarHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscapeRight }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        
        setupPreview()
        setupVRDisplay()
        setupHUD()
        setupGestures()
        
        // Wire delegates
        cameraEngine.delegate = self
        h264Encoder.delegate = self
        usbTunnel.delegate = self
        
        // Request Camera Permission & Init pipeline
        checkAndRequestCamera()
        
        // Start USB Tunnel Server on Port 23456
        usbTunnel.startServer()
        startHUDTimer()
    }
    
    private func checkAndRequestCamera() {
        cameraEngine.requestCameraAccess { [weak self] granted in
            guard let self = self else { return }
            DispatchQueue.main.async {
                if granted {
                    self.permissionButton.isHidden = true
                    self.attachPreviewLayer()
                    self.cameraEngine.start()
                    self.h264Encoder.configure(width: 1920, height: 1080, fps: 60)
                } else {
                    self.permissionButton.isHidden = false
                    self.statusLabel.text = "CAN CAP QUYEN CAMERA!"
                    self.statusDot.backgroundColor = .systemRed
                }
            }
        }
    }
    
    private func attachPreviewLayer() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let layer = AVCaptureVideoPreviewLayer(session: self.cameraEngine.previewSession)
            layer.videoGravity = .resizeAspectFill
            layer.frame = self.cameraPreviewView.bounds
            if let connection = layer.connection, connection.isVideoOrientationSupported {
                connection.videoOrientation = .landscapeRight
            }
            self.cameraPreviewView.layer.sublayers?.forEach { $0.removeFromSuperlayer() }
            self.cameraPreviewView.layer.addSublayer(layer)
            self.previewLayer = layer
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = cameraPreviewView.bounds
    }
    
    // MARK: - UI Setup
    private func setupPreview() {
        cameraPreviewView.frame = view.bounds
        cameraPreviewView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(cameraPreviewView)
        
        permissionButton.setTitle("📷 BẤM ĐỂ BẬT CAMERA CHO STARK", for: .normal)
        permissionButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .bold)
        permissionButton.setTitleColor(.white, for: .normal)
        permissionButton.backgroundColor = UIColor(red: 0.0, green: 0.48, blue: 1.0, alpha: 0.95)
        permissionButton.layer.cornerRadius = 14
        permissionButton.translatesAutoresizingMaskIntoConstraints = false
        permissionButton.addTarget(self, action: #selector(permissionButtonTapped), for: .touchUpInside)
        permissionButton.isHidden = true // hidden initially until permission check completes
        view.addSubview(permissionButton)
        
        NSLayoutConstraint.activate([
            permissionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            permissionButton.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            permissionButton.widthAnchor.constraint(equalToConstant: 340),
            permissionButton.heightAnchor.constraint(equalToConstant: 54)
        ])
    }
    
    @objc private func permissionButtonTapped() {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .denied || status == .restricted {
            if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsURL)
            }
        } else {
            checkAndRequestCamera()
        }
    }
    
    private func setupVRDisplay() {
        vrDisplayImageView.frame = view.bounds
        vrDisplayImageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vrDisplayImageView.contentMode = .scaleToFill // Khop 100% 2 nua man hinh vao 2 thau kinh Shinecon G10
        vrDisplayImageView.backgroundColor = .black
        vrDisplayImageView.isHidden = true
        view.addSubview(vrDisplayImageView)
    }
    
    private func setupHUD() {
        hudOverlay.frame = view.bounds
        hudOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(hudOverlay)
        
        // Status Card (Top Left)
        statusCard.layer.cornerRadius = 14
        statusCard.layer.masksToBounds = true
        statusCard.layer.borderWidth = 1
        statusCard.layer.borderColor = UIColor.white.withAlphaComponent(0.15).cgColor
        statusCard.translatesAutoresizingMaskIntoConstraints = false
        hudOverlay.addSubview(statusCard)
        
        statusDot.backgroundColor = .systemRed
        statusDot.layer.cornerRadius = 5
        statusDot.translatesAutoresizingMaskIntoConstraints = false
        statusCard.contentView.addSubview(statusDot)
        
        statusLabel.text = "CHO CAP USB LAPTOP..."
        statusLabel.font = .systemFont(ofSize: 13, weight: .bold)
        statusLabel.textColor = .white
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusCard.contentView.addSubview(statusLabel)
        
        fpsLabel.text = "FPS: 0.0"
        fpsLabel.font = .monospacedSystemFont(ofSize: 13, weight: .bold)
        fpsLabel.textColor = .systemGreen
        fpsLabel.translatesAutoresizingMaskIntoConstraints = false
        statusCard.contentView.addSubview(fpsLabel)
        
        statsLabel.text = "1080p @ 60 FPS // A15 H.264 HW"
        statsLabel.font = .systemFont(ofSize: 11, weight: .medium)
        statsLabel.textColor = UIColor.white.withAlphaComponent(0.7)
        statsLabel.translatesAutoresizingMaskIntoConstraints = false
        statusCard.contentView.addSubview(statsLabel)
        
        // Control Card (Bottom Center)
        controlCard.layer.cornerRadius = 16
        controlCard.layer.masksToBounds = true
        controlCard.layer.borderWidth = 1
        controlCard.layer.borderColor = UIColor.white.withAlphaComponent(0.15).cgColor
        controlCard.translatesAutoresizingMaskIntoConstraints = false
        hudOverlay.addSubview(controlCard)
        
        // Segments styling
        let segments = [resSegment, fpsSegment, modeSegment]
        for seg in segments {
            seg.selectedSegmentTintColor = UIColor(red: 0.1, green: 0.5, blue: 1.0, alpha: 0.8)
            seg.setTitleTextAttributes([.foregroundColor: UIColor.white, .font: UIFont.systemFont(ofSize: 12, weight: .semibold)], for: .normal)
            seg.setTitleTextAttributes([.foregroundColor: UIColor.white, .font: UIFont.systemFont(ofSize: 12, weight: .bold)], for: .selected)
            seg.translatesAutoresizingMaskIntoConstraints = false
            controlCard.contentView.addSubview(seg)
        }
        
        resSegment.selectedSegmentIndex = 0 // 1080p
        fpsSegment.selectedSegmentIndex = 1 // 60 FPS
        modeSegment.selectedSegmentIndex = 0 // Camera
        
        resSegment.addTarget(self, action: #selector(configChanged), for: .valueChanged)
        fpsSegment.addTarget(self, action: #selector(configChanged), for: .valueChanged)
        modeSegment.addTarget(self, action: #selector(modeChanged), for: .valueChanged)
        
        // Layout Constraints
        NSLayoutConstraint.activate([
            // Status Card
            statusCard.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            statusCard.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            statusCard.widthAnchor.constraint(equalToConstant: 320),
            statusCard.heightAnchor.constraint(equalToConstant: 64),
            
            statusDot.leadingAnchor.constraint(equalTo: statusCard.contentView.leadingAnchor, constant: 14),
            statusDot.topAnchor.constraint(equalTo: statusCard.contentView.topAnchor, constant: 16),
            statusDot.widthAnchor.constraint(equalToConstant: 10),
            statusDot.heightAnchor.constraint(equalToConstant: 10),
            
            statusLabel.leadingAnchor.constraint(equalTo: statusDot.trailingAnchor, constant: 8),
            statusLabel.centerYAnchor.constraint(equalTo: statusDot.centerYAnchor),
            
            fpsLabel.trailingAnchor.constraint(equalTo: statusCard.contentView.trailingAnchor, constant: -14),
            fpsLabel.centerYAnchor.constraint(equalTo: statusDot.centerYAnchor),
            
            statsLabel.leadingAnchor.constraint(equalTo: statusDot.leadingAnchor),
            statsLabel.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 6),
            
            // Control Card
            controlCard.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
            controlCard.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            controlCard.heightAnchor.constraint(equalToConstant: 52),
            
            resSegment.leadingAnchor.constraint(equalTo: controlCard.contentView.leadingAnchor, constant: 12),
            resSegment.centerYAnchor.constraint(equalTo: controlCard.contentView.centerYAnchor),
            
            fpsSegment.leadingAnchor.constraint(equalTo: resSegment.trailingAnchor, constant: 12),
            fpsSegment.centerYAnchor.constraint(equalTo: controlCard.contentView.centerYAnchor),
            
            modeSegment.leadingAnchor.constraint(equalTo: fpsSegment.trailingAnchor, constant: 12),
            modeSegment.trailingAnchor.constraint(equalTo: controlCard.contentView.trailingAnchor, constant: -12),
            modeSegment.centerYAnchor.constraint(equalTo: controlCard.contentView.centerYAnchor)
        ])
    }
    
    private func setupGestures() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(toggleHUD))
        view.addGestureRecognizer(tap)
    }
    
    @objc private func toggleHUD() {
        isHUDHidden.toggle()
        UIView.animate(withDuration: 0.25) {
            self.hudOverlay.alpha = self.isHUDHidden ? 0.0 : 1.0
        }
        if !isHUDHidden {
            startHUDTimer()
        }
    }
    
    private func startHUDTimer() {
        hudDismissTimer?.invalidate()
        hudDismissTimer = Timer.scheduledTimer(withTimeInterval: 6.0, repeats: false) { [weak self] _ in
            guard let self = self, !self.isHUDHidden else { return }
            self.toggleHUD()
        }
    }
    
    @objc private func configChanged() {
        startHUDTimer()
        let res: STARKResolution = (resSegment.selectedSegmentIndex == 0) ? .hd1080p : .uhd4K
        let fpsOptions = [30, 60, 120]
        let fps = fpsOptions[fpsSegment.selectedSegmentIndex]
        
        let dims = res.dimensions
        cameraEngine.switchConfiguration(resolution: res, fps: fps)
        h264Encoder.configure(width: dims.width, height: dims.height, fps: Int32(fps))
        statsLabel.text = "\(res.rawValue) @ \(fps) FPS // A15 H.264 HW"
    }
    
    @objc private func modeChanged() {
        startHUDTimer()
        let isVR = (modeSegment.selectedSegmentIndex == 1)
        vrDisplayImageView.isHidden = !isVR
        cameraPreviewView.isHidden = isVR
    }
    
    // MARK: - CameraEngineDelegate
    func cameraEngine(_ engine: CameraEngine, didOutput pixelBuffer: CVPixelBuffer, timestamp: CMTime, pose: STARKPose6DoF?) {
        // Feed frame to Apple A15 Bionic hardware H.264 encoder with 6DoF Pose
        h264Encoder.encode(pixelBuffer: pixelBuffer, presentationTimeStamp: timestamp, pose: pose)
        
        if let p = pose {
            DispatchQueue.main.async { [weak self] in
                self?.statsLabel.text = String(format: "6DoF (%.2f, %.2f, %.2f) // A15 HW", p.position.x, p.position.y, p.position.z)
            }
        }
    }
    
    func cameraEngine(_ engine: CameraEngine, didUpdateTrackingState status: String) {
        DispatchQueue.main.async { [weak self] in
            self?.statusLabel.text = "ARKit: \(status)"
        }
    }
    
    func cameraEngine(_ engine: CameraEngine, didUpdateActualFPS fps: Double) {
        DispatchQueue.main.async { [weak self] in
            self?.fpsLabel.text = String(format: "FPS: %.1f", fps)
        }
    }
    
    func cameraEngine(_ engine: CameraEngine, didEncounterError error: Error) {
        print("[STARK VC] Camera loi: \(error)")
    }
    
    // MARK: - H264EncoderDelegate
    func h264Encoder(_ encoder: H264Encoder, didEncodeNALU data: Data, isKeyFrame: Bool, pose: STARKPose6DoF?) {
        // Send compressed NALU + synchronized 28B 6DoF Pose over USB Lightning wire to Laptop
        usbTunnel.sendFrameData(data, pose: pose)
    }
    
    // MARK: - USBTunnelDelegate
    func usbTunnelDidConnectClient(_ tunnel: USBTunnel) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.statusDot.backgroundColor = .systemGreen
            self.statusLabel.text = "DA KET NOI USB LAPTOP (480Mbps)"
        }
    }
    
    func usbTunnelDidDisconnectClient(_ tunnel: USBTunnel) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.statusDot.backgroundColor = .systemRed
            self.statusLabel.text = "CHO CAP USB LAPTOP..."
        }
    }
    
    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnFrame data: Data) {
        // Render 3D Stereo SBS frame sent back from Laptop RTX 4060
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let image = UIImage(data: data) {
                self.vrDisplayImageView.image = image
            }
        }
    }
    
    func usbTunnel(_ tunnel: USBTunnel, didChangeState state: NWListener.State) {}
}
