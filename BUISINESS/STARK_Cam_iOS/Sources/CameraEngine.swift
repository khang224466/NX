import Foundation
import AVFoundation
import UIKit

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
    func cameraEngine(_ engine: CameraEngine, didOutput sampleBuffer: CMSampleBuffer)
    func cameraEngine(_ engine: CameraEngine, didUpdateActualFPS fps: Double)
    func cameraEngine(_ engine: CameraEngine, didEncounterError error: Error)
}

public class CameraEngine: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    public weak var delegate: CameraEngineDelegate?
    
    private let captureSession = AVCaptureSession()
    private var videoDevice: AVCaptureDevice?
    private var videoInput: AVCaptureDeviceInput?
    private let videoOutput = AVCaptureVideoDataOutput()
    private let sessionQueue = DispatchQueue(label: "com.stark.camera.session", qos: .userInteractive)
    
    public private(set) var currentResolution: STARKResolution = .hd1080p
    public private(set) var currentFPS: Int = 60
    public private(set) var isRunning: Bool = false
    
    // FPS counter
    private var frameCount = 0
    private var lastFPSCheckTime = CFAbsoluteTimeGetCurrent()
    
    public override init() {
        super.init()
    }
    
    public var previewSession: AVCaptureSession {
        return captureSession
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
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            self.configureSession()
        }
    }
    
    private func configureSession() {
        captureSession.beginConfiguration()
        captureSession.sessionPreset = .inputPriority // Let activeFormat control resolution & FPS
        
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            print("[STARK Camera] Khong tim thay Back Camera tren iPhone")
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
        
        videoOutput.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)
        ]
        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.setSampleBufferDelegate(self, queue: sessionQueue)
        
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }
        
        // Orientation
        if let connection = videoOutput.connection(with: .video) {
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = .landscapeRight
            }
            if connection.isVideoMirroringSupported {
                connection.isVideoMirrored = false
            }
        }
        
        captureSession.commitConfiguration()
        
        // Apply default format (1080p 60fps)
        self.applyFormat(resolution: self.currentResolution, fps: self.currentFPS)
    }
    
    public func start() {
        sessionQueue.async { [weak self] in
            guard let self = self, !self.captureSession.isRunning else { return }
            self.captureSession.startRunning()
            self.isRunning = true
            print("[STARK Camera] Da khoi dong camera phan giai: \(self.currentResolution.rawValue), FPS: \(self.currentFPS)")
        }
    }
    
    public func stop() {
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
        var selectedFormat: AVCaptureDevice.Format?
        var maxSupportedFPS: Double = 30.0
        
        // Search through available formats on this iPhone sensor
        for format in device.formats {
            let desc = format.formatDescription
            let dims = CMVideoFormatDescriptionGetDimensions(desc)
            
            // Match dimensions
            if dims.width == targetDims.width && dims.height == targetDims.height {
                for range in format.videoSupportedFrameRateRanges {
                    if Double(fps) <= range.maxFrameRate && Double(fps) >= range.minFrameRate {
                        selectedFormat = format
                        maxSupportedFPS = range.maxFrameRate
                        break
                    }
                }
                if selectedFormat != nil { break }
            }
        }
        
        // Fallback: if exact 120fps is not supported for 4K (iPhone 13 4K max is 60fps), pick best match
        if selectedFormat == nil {
            for format in device.formats {
                let dims = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
                if dims.width == targetDims.width && dims.height == targetDims.height {
                    selectedFormat = format
                    break
                }
            }
        }
        
        guard let format = selectedFormat else {
            print("[STARK Camera] Khong tim thay format phu hop cho \(resolution.rawValue) @ \(fps) FPS")
            return
        }
        
        do {
            try device.lockForConfiguration()
            device.activeFormat = format
            
            let targetFrameDuration = CMTime(value: 1, timescale: CMTimeScale(min(fps, Int(maxSupportedFPS))))
            device.activeVideoMinFrameDuration = targetFrameDuration
            device.activeVideoMaxFrameDuration = targetFrameDuration
            
            // Enable continuous autofocus & auto exposure
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
            print("[STARK Camera] Thiet lap thanh cong: \(targetDims.width)x\(targetDims.height) @ \(min(fps, Int(maxSupportedFPS))) FPS (Sensor Max: \(maxSupportedFPS) FPS)")
        } catch {
            print("[STARK Camera] Loi khoa thiet bi: \(error)")
        }
    }
    
    // MARK: - AVCaptureVideoDataOutputSampleBufferDelegate
    public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        // Measure real framerate
        frameCount += 1
        let now = CFAbsoluteTimeGetCurrent()
        if now - lastFPSCheckTime >= 1.0 {
            let actualFPS = Double(frameCount) / (now - lastFPSCheckTime)
            delegate?.cameraEngine(self, didUpdateActualFPS: actualFPS)
            frameCount = 0
            lastFPSCheckTime = now
        }
        
        delegate?.cameraEngine(self, didOutput: sampleBuffer)
    }
}
