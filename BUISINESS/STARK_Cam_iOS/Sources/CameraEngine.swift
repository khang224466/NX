import Foundation
import AVFoundation
import UIKit
import ARKit
import simd

public enum STARKResolution: String, CaseIterable {
    case hd1080p = "HD 1080p"
    case uhd4K   = "4K UHD"
    
    var dimensions: CMVideoDimensions {
        switch self {
        case .hd1080p:
            return CMVideoDimensions(width: 1920, height: 1080)
        case .uhd4K:
            return CMVideoDimensions(width: 3840, height: 2160)
        }
    }
}

public protocol CameraEngineDelegate: AnyObject {
    func cameraEngine(_ engine: CameraEngine, didOutput pixelBuffer: CVPixelBuffer, timestamp: CMTime, pose: STARKPose6DoF?)
    func cameraEngine(_ engine: CameraEngine, didUpdateTrackingState status: String)
    func cameraEngine(_ engine: CameraEngine, didUpdateActualFPS fps: Double)
    func cameraEngine(_ engine: CameraEngine, didEncounterError error: Error)
}

public class CameraEngine: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate, ARSessionDelegate {
    public weak var delegate: CameraEngineDelegate?
    
    private let captureSession = AVCaptureSession()
    private var videoDevice: AVCaptureDevice?
    private var videoInput: AVCaptureDeviceInput?
    private let videoOutput = AVCaptureVideoDataOutput()
    private let sessionQueue = DispatchQueue(label: "com.stark.camera.session", qos: .userInteractive)
    
    // ARKit 6DoF World Tracking Engine
    public let arSession = ARSession()
    public private(set) var useARKit: Bool = true
    public private(set) var latestPose: STARKPose6DoF? = nil
    
    public private(set) var currentResolution: STARKResolution = .hd1080p
    public private(set) var currentFPS: Int = 60
    public private(set) var isRunning: Bool = false
    
    // FPS measurement
    private var frameCount = 0
    private var lastFPSCheckTime = CFAbsoluteTimeGetCurrent()
    
    public override init() {
        super.init()
    }
    
    public var previewSession: AVCaptureSession {
        return captureSession
    }
    
    public func setTrackingMode(useARKit: Bool) {
        self.useARKit = useARKit
        if isRunning {
            stop()
            start()
        }
    }
    
    public func requestCameraAccess(completion: @escaping (Bool) -> Void) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            self.setupCamera()
            DispatchQueue.main.async {
                completion(true)
            }
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    self?.setupCamera()
                }
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        default:
            DispatchQueue.main.async {
                completion(false)
            }
        }
    }
    
    public func setupCamera() {
        if useARKit && ARWorldTrackingConfiguration.isSupported {
            return
        }
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            self.configureSession()
        }
    }
    
    private func configureSession() {
        captureSession.beginConfiguration()
        
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            print("[STARK Camera] Khong tim thay Back Wide Camera tren iPhone")
            captureSession.commitConfiguration()
            return
        }
        self.videoDevice = device
        
        do {
            let input = try AVCaptureDeviceInput(device: device)
            if captureSession.canAddInput(input) {
                captureSession.addInput(input)
                self.videoInput = input
            }
        } catch {
            print("[STARK Camera] Loi tao Camera Input: \(error)")
            captureSession.commitConfiguration()
            return
        }
        
        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.setSampleBufferDelegate(self, queue: sessionQueue)
        
        if videoOutput.availableVideoPixelFormatTypes.contains(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange) {
            videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)]
        } else if videoOutput.availableVideoPixelFormatTypes.contains(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange) {
            videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)]
        }
        
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }
        
        if let connection = videoOutput.connection(with: .video) {
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = .landscapeRight
            }
            if connection.isVideoMirroringSupported {
                connection.isVideoMirrored = false
            }
        }
        
        captureSession.commitConfiguration()
        self.applyFormat(resolution: self.currentResolution, fps: self.currentFPS)
    }
    
    public func start() {
        if useARKit && ARWorldTrackingConfiguration.isSupported {
            let config = ARWorldTrackingConfiguration()
            config.providesAudioData = false
            if let format = ARWorldTrackingConfiguration.supportedVideoFormats.first(where: {
                Int($0.imageResolution.width) == 1280 && Int($0.imageResolution.height) == 720 && $0.framesPerSecond >= 60
            }) ?? ARWorldTrackingConfiguration.supportedVideoFormats.first(where: {
                Int($0.imageResolution.width) == 1920 && Int($0.imageResolution.height) == 1080 && $0.framesPerSecond >= 60
            }) ?? ARWorldTrackingConfiguration.supportedVideoFormats.first {
                config.videoFormat = format
            }
            config.worldAlignment = .gravity
            arSession.delegate = self
            arSession.run(config, options: [.resetTracking, .removeExistingAnchors])
            isRunning = true
            print("[STARK Camera] Da kich hoat ARKit 6DoF World Tracking Engine!")
        } else {
            sessionQueue.async { [weak self] in
                guard let self = self, !self.captureSession.isRunning else { return }
                self.captureSession.startRunning()
                self.isRunning = true
                print("[STARK Camera] Da khoi dong AVCaptureSession: \(self.currentResolution.rawValue), FPS: \(self.currentFPS)")
            }
        }
    }
    
    public func stop() {
        if useARKit {
            arSession.pause()
            isRunning = false
        }
        sessionQueue.async { [weak self] in
            guard let self = self, self.captureSession.isRunning else { return }
            self.captureSession.stopRunning()
            self.isRunning = false
        }
    }
    
    public func switchConfiguration(resolution: STARKResolution, fps: Int) {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            self.currentResolution = resolution
            self.currentFPS = fps
            self.applyFormat(resolution: resolution, fps: fps)
        }
    }
    
    private func applyFormat(resolution: STARKResolution, fps: Int) {
        guard let device = self.videoDevice else { return }
        let targetDims = resolution.dimensions
        
        var bestFormat: AVCaptureDevice.Format?
        var bestRange: AVFrameRateRange?
        
        for format in device.formats {
            let dims = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            if dims.width == targetDims.width && dims.height == targetDims.height {
                for range in format.videoSupportedFrameRateRanges {
                    if Double(fps) <= range.maxFrameRate && Double(fps) >= range.minFrameRate {
                        bestFormat = format
                        bestRange = range
                        break
                    }
                }
                if bestFormat != nil { break }
            }
        }
        
        if bestFormat == nil {
            for format in device.formats {
                let dims = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
                if dims.width == targetDims.width && dims.height == targetDims.height {
                    bestFormat = format
                    bestRange = format.videoSupportedFrameRateRanges.first
                    break
                }
            }
        }
        
        guard let format = bestFormat else { return }
        
        do {
            try device.lockForConfiguration()
            device.activeFormat = format
            
            let maxFps = bestRange?.maxFrameRate ?? 30.0
            let targetFps = min(Double(fps), maxFps)
            let duration = CMTime(value: 1, timescale: CMTimeScale(targetFps))
            device.activeVideoMinFrameDuration = duration
            device.activeVideoMaxFrameDuration = duration
            
            if device.isFocusModeSupported(.continuousAutoFocus) {
                device.focusMode = .continuousAutoFocus
            }
            if device.isExposureModeSupported(.continuousAutoExposure) {
                device.exposureMode = .continuousAutoExposure
            }
            if device.isLowLightBoostSupported {
                device.automaticallyEnablesLowLightBoostWhenAvailable = true
            }
            
            device.unlockForConfiguration()
        } catch {
            print("[STARK Camera] Loi khoa thiet bi: \(error)")
        }
    }
    
    // MARK: - ARSessionDelegate (6DoF Tracking & Video Frame)
    public func session(_ session: ARSession, didUpdate frame: ARFrame) {
        guard useARKit else { return }
        
        frameCount += 1
        let now = CFAbsoluteTimeGetCurrent()
        if now - lastFPSCheckTime >= 1.0 {
            let actualFPS = Double(frameCount) / (now - lastFPSCheckTime)
            delegate?.cameraEngine(self, didUpdateActualFPS: actualFPS)
            frameCount = 0
            lastFPSCheckTime = now
        }
        
        // Trích xuất vị trí, góc quay 6DoF & FOV thật của ống kính từ ARKit VIO
        let transform = frame.camera.transform
        let pos = simd_make_float3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
        let quat = simd_quatf(transform)
        let fy = frame.camera.intrinsics.columns.1.y
        let imgH = Float(frame.camera.imageResolution.height)
        let vFovDeg: Float = (fy > 1.0 && imgH > 1.0) ? (2.0 * atan((imgH * 0.5) / fy) * 180.0 / .pi) : 45.0
        let pose = STARKPose6DoF(position: pos, orientation: quat, timestamp: frame.timestamp, verticalFovDeg: vFovDeg)
        self.latestPose = pose
        
        let pts = CMTime(seconds: frame.timestamp, preferredTimescale: 1_000_000)
        delegate?.cameraEngine(self, didOutput: frame.capturedImage, timestamp: pts, pose: pose)
    }

    public func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
        var statusStr = "Tracking"
        switch camera.trackingState {
        case .normal:
            statusStr = "6DoF (Normal)"
        case .limited(let reason):
            switch reason {
            case .initializing: statusStr = "Khoi tao ARKit..."
            case .excessiveMotion: statusStr = "Dau quay nhanh"
            case .insufficientFeatures: statusStr = "Thieu diem phong"
            case .relocalizing: statusStr = "Dinh vi lai..."
            @unknown default: statusStr = "Limited"
            }
        case .notAvailable:
            statusStr = "ARKit khong kha dung"
        }
        delegate?.cameraEngine(self, didUpdateTrackingState: statusStr)
    }
    
    // MARK: - AVCaptureVideoDataOutputSampleBufferDelegate (Fallback Mode)
    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard !useARKit else { return }
        
        frameCount += 1
        let now = CFAbsoluteTimeGetCurrent()
        if now - lastFPSCheckTime >= 1.0 {
            let actualFPS = Double(frameCount) / (now - lastFPSCheckTime)
            delegate?.cameraEngine(self, didUpdateActualFPS: actualFPS)
            frameCount = 0
            lastFPSCheckTime = now
        }
        
        if let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
            let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
            delegate?.cameraEngine(self, didOutput: imageBuffer, timestamp: pts, pose: nil)
        }
    }
}
