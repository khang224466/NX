import UIKit
import AVFoundation
import CoreMedia
import Network
import ImageIO

class ViewController: UIViewController, CameraEngineDelegate, H264EncoderDelegate, USBTunnelDelegate {
    
    // Core Modules
    private let cameraEngine = CameraEngine()
    private let h264Encoder = H264Encoder()
    private let usbTunnel = USBTunnel()
    
    // UI Elements
    private let cameraPreviewView = UIView()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let vrDisplayImageView = UIImageView()
    private let vrH264View = UIView()
    private let h264DisplayLayer = AVSampleBufferDisplayLayer()
    private let permissionButton = UIButton(type: .system)
    
    // Off-main-thread JPEG Decode Pipeline + Latest-Frame Mailbox (Zero UI lag!)
    private let decodeQueue = DispatchQueue(label: "com.stark.vr.decode", qos: .userInteractive)
    private let decodeLock = NSLock()
    private var pendingReturnFrame: Data?
    private var isDecodingReturn = false
    private var hasAutoSwitchedToXR = false
    private var isUsingH264Return = false

    // Hardware H.264 Annex-B Display Pipeline (AVSampleBufferDisplayLayer -> 60FPS Crisp Retina!)
    private let h264ReturnQueue = DispatchQueue(label: "com.stark.vr.h264return", qos: .userInteractive)
    private var returnSPS: Data?
    private var returnPPS: Data?
    private var returnFormatDesc: CMVideoFormatDescription?
    
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
    private let modeSegment = UISegmentedControl(items: ["Camera Thuc", "Hien Thi XR"])
    
    private var isHUDHidden = false
    private var hudDismissTimer: Timer?
    private var hudFrameCounter: Int = 0
    
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        view.insetsLayoutMarginsFromSafeArea = false
        
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
        cameraPreviewView.frame = view.bounds
        previewLayer?.frame = cameraPreviewView.bounds
        vrDisplayImageView.frame = view.bounds
        vrH264View.frame = view.bounds
        h264DisplayLayer.frame = vrH264View.bounds
    }
    
    // MARK: - UI Setup
    private func setupPreview() {
        cameraPreviewView.frame = view.bounds
        cameraPreviewView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cameraPreviewView.clipsToBounds = true
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
        vrDisplayImageView.contentMode = .scaleAspectFill // Full man hinh edge-to-edge 19.5:9 khong meo hinh, khong vien den
        vrDisplayImageView.clipsToBounds = true
        vrDisplayImageView.backgroundColor = .black
        vrDisplayImageView.isHidden = true
        view.addSubview(vrDisplayImageView)

        vrH264View.frame = view.bounds
        vrH264View.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vrH264View.clipsToBounds = true
        vrH264View.backgroundColor = .black
        vrH264View.isHidden = true
        h264DisplayLayer.videoGravity = .resizeAspectFill
        h264DisplayLayer.backgroundColor = UIColor.black.cgColor
        h264DisplayLayer.frame = vrH264View.bounds
        vrH264View.layer.addSublayer(h264DisplayLayer)
        view.addSubview(vrH264View)
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
        if !isVR {
            vrDisplayImageView.isHidden = true
            vrH264View.isHidden = true
            cameraPreviewView.isHidden = false
        } else {
            vrDisplayImageView.isHidden = isUsingH264Return
            vrH264View.isHidden = !isUsingH264Return
            cameraPreviewView.isHidden = true
        }
    }
    
    // MARK: - CameraEngineDelegate
    func cameraEngine(_ engine: CameraEngine, didOutput pixelBuffer: CVPixelBuffer, timestamp: CMTime, pose: STARKPose6DoF?) {
        // Feed frame to Apple A15 Bionic hardware H.264 encoder with 6DoF Pose
        h264Encoder.encode(pixelBuffer: pixelBuffer, presentationTimeStamp: timestamp, pose: pose)
        
        hudFrameCounter &+= 1
        if let p = pose, !isHUDHidden, (hudFrameCounter % 10 == 0) {
            DispatchQueue.main.async { [weak self] in
                guard let self = self, !self.isHUDHidden else { return }
                self.statsLabel.text = String(format: "6DoF (%.2f, %.2f, %.2f) // A15 HW", p.position.x, p.position.y, p.position.z)
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
        h264ReturnQueue.async { [weak self] in
            self?.returnSPS = nil
            self?.returnPPS = nil
            self?.returnFormatDesc = nil
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.hasAutoSwitchedToXR = false
            self.isUsingH264Return = false
            self.h264DisplayLayer.flush()
            self.statusDot.backgroundColor = .systemGreen
            self.statusLabel.text = "DA KET NOI USB LAPTOP (480Mbps)"
        }
    }
    
    func usbTunnelDidDisconnectClient(_ tunnel: USBTunnel) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.hasAutoSwitchedToXR = false
            self.isUsingH264Return = false
            self.h264DisplayLayer.flushAndRemoveImage()
            self.statusDot.backgroundColor = .systemRed
            self.statusLabel.text = "CHO CAP USB LAPTOP..."
        }
    }

    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnH264 data: Data) {
        h264ReturnQueue.async { [weak self] in
            guard let self = self else { return }
            let nalus = self.splitAnnexBNALUs(data)
            guard !nalus.isEmpty else { return }

            var avccData = Data()
            for nalu in nalus {
                guard let firstByte = nalu.first else { continue }
                let nalType = firstByte & 0x1F
                if nalType == 7 {
                    if self.returnSPS != nalu {
                        self.returnSPS = nalu
                        self.returnFormatDesc = nil
                    }
                } else if nalType == 8 {
                    if self.returnPPS != nalu {
                        self.returnPPS = nalu
                        self.returnFormatDesc = nil
                    }
                } else if nalType == 1 || nalType == 5 {
                    var beLen = UInt32(nalu.count).bigEndian
                    withUnsafeBytes(of: &beLen) { avccData.append(contentsOf: $0) }
                    avccData.append(nalu)
                }
            }

            if self.returnFormatDesc == nil, let sps = self.returnSPS, let pps = self.returnPPS {
                sps.withUnsafeBytes { spsRaw in
                    pps.withUnsafeBytes { ppsRaw in
                        guard let spsPtr = spsRaw.baseAddress?.assumingMemoryBound(to: UInt8.self),
                              let ppsPtr = ppsRaw.baseAddress?.assumingMemoryBound(to: UInt8.self) else { return }
                        let ptrs: [UnsafePointer<UInt8>] = [spsPtr, ppsPtr]
                        let sizes: [Int] = [sps.count, pps.count]
                        var desc: CMVideoFormatDescription?
                        let st = CMVideoFormatDescriptionCreateFromH264ParameterSets(
                            allocator: kCFAllocatorDefault,
                            parameterSetCount: 2,
                            parameterSetPointers: ptrs,
                            parameterSetSizes: sizes,
                            nalUnitHeaderLength: 4,
                            formatDescriptionOut: &desc
                        )
                        if st == noErr {
                            self.returnFormatDesc = desc
                        }
                    }
                }
            }

            guard !avccData.isEmpty, let formatDesc = self.returnFormatDesc else { return }

            var blockBuffer: CMBlockBuffer?
            let allocStatus = CMBlockBufferCreateWithMemoryBlock(
                allocator: kCFAllocatorDefault,
                memoryBlock: nil,
                blockLength: avccData.count,
                blockAllocator: kCFAllocatorDefault,
                customBlockSource: nil,
                offsetToData: 0,
                dataLength: avccData.count,
                flags: 0,
                blockBufferOut: &blockBuffer
            )
            guard allocStatus == kCMBlockBufferNoErr, let blockBuf = blockBuffer else { return }

            let copyStatus = avccData.withUnsafeBytes { rawBuf -> OSStatus in
                guard let base = rawBuf.baseAddress else { return OSStatus(-1) }
                return CMBlockBufferReplaceDataBytes(with: base, blockBuffer: blockBuf, offsetIntoDestination: 0, dataLength: avccData.count)
            }
            guard copyStatus == kCMBlockBufferNoErr else { return }

            var sampleBuffer: CMSampleBuffer?
            var sampleSize = avccData.count
            var timing = CMSampleTimingInfo(
                duration: CMTime.invalid,
                presentationTimeStamp: CMClockGetTime(CMClockGetHostTimeClock()),
                decodeTimeStamp: CMTime.invalid
            )
            let sbStatus = CMSampleBufferCreateReady(
                allocator: kCFAllocatorDefault,
                dataBuffer: blockBuf,
                formatDescription: formatDesc,
                sampleCount: 1,
                sampleTimingEntryCount: 1,
                sampleTimingArray: &timing,
                sampleSizeEntryCount: 1,
                sampleSizeArray: &sampleSize,
                sampleBufferOut: &sampleBuffer
            )
            guard sbStatus == noErr, let sbuf = sampleBuffer else { return }

            if let attachments = CMSampleBufferGetSampleAttachmentsArray(sbuf, createIfNecessary: true) {
                let dict = unsafeBitCast(CFArrayGetValueAtIndex(attachments, 0), to: CFMutableDictionary.self)
                CFDictionarySetValue(
                    dict,
                    Unmanaged.passUnretained(kCMSampleAttachmentKey_DisplayImmediately).toOpaque(),
                    Unmanaged.passUnretained(kCFBooleanTrue).toOpaque()
                )
            }

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.isUsingH264Return = true
                if self.h264DisplayLayer.status == .failed {
                    self.h264DisplayLayer.flush()
                }
                if !self.hasAutoSwitchedToXR || self.vrH264View.isHidden {
                    self.hasAutoSwitchedToXR = true
                    self.modeSegment.selectedSegmentIndex = 1
                    self.vrH264View.isHidden = false
                    self.vrDisplayImageView.isHidden = true
                    self.cameraPreviewView.isHidden = true
                }
                self.h264DisplayLayer.enqueue(sbuf)
            }
        }
    }

    private func splitAnnexBNALUs(_ data: Data) -> [Data] {
        var result: [Data] = []
        let count = data.count
        guard count > 4 else { return result }
        data.withUnsafeBytes { rawBuf in
            guard let bytes = rawBuf.baseAddress?.assumingMemoryBound(to: UInt8.self) else { return }
            var i = 0
            var nalStart = -1
            while i < count {
                var scLen = 0
                if i + 3 < count && bytes[i] == 0 && bytes[i + 1] == 0 && bytes[i + 2] == 0 && bytes[i + 3] == 1 {
                    scLen = 4
                } else if i + 2 < count && bytes[i] == 0 && bytes[i + 1] == 0 && bytes[i + 2] == 1 {
                    scLen = 3
                }
                if scLen > 0 {
                    if nalStart >= 0 && i > nalStart {
                        result.append(Data(bytes: bytes + nalStart, count: i - nalStart))
                    }
                    nalStart = i + scLen
                    i += scLen
                } else {
                    i += 1
                }
            }
            if nalStart >= 0 && count > nalStart {
                result.append(Data(bytes: bytes + nalStart, count: count - nalStart))
            }
        }
        return result
    }
    
    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnFrame data: Data) {
        // Off-main-thread JPEG decoding + latest-frame mailbox (0 queue lag!)
        decodeLock.lock()
        pendingReturnFrame = data
        let shouldStart = !isDecodingReturn
        if shouldStart { isDecodingReturn = true }
        decodeLock.unlock()

        guard shouldStart else { return }
        decodeQueue.async { [weak self] in
            guard let self = self else { return }
            while true {
                self.decodeLock.lock()
                let nextData = self.pendingReturnFrame
                self.pendingReturnFrame = nil
                guard let frameBytes = nextData else {
                    self.isDecodingReturn = false
                    self.decodeLock.unlock()
                    return
                }
                self.decodeLock.unlock()

                let decodedCG: CGImage? = autoreleasepool {
                    let srcOpts = [kCGImageSourceShouldCache: false] as CFDictionary
                    guard let src = CGImageSourceCreateWithData(frameBytes as CFData, srcOpts) else { return nil }
                    let decOpts = [kCGImageSourceShouldCacheImmediately: true] as CFDictionary
                    return CGImageSourceCreateImageAtIndex(src, 0, decOpts)
                }

                if let cgImage = decodedCG {
                    let img = UIImage(cgImage: cgImage)
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else { return }
                        self.isUsingH264Return = false
                        if !self.hasAutoSwitchedToXR || self.vrDisplayImageView.isHidden {
                            self.hasAutoSwitchedToXR = true
                            self.modeSegment.selectedSegmentIndex = 1
                            self.vrH264View.isHidden = true
                            self.vrDisplayImageView.isHidden = false
                            self.cameraPreviewView.isHidden = true
                        }
                        self.vrDisplayImageView.image = img
                    }
                }
            }
        }
    }
    
    func usbTunnel(_ tunnel: USBTunnel, didChangeState state: NWListener.State) {}
}
