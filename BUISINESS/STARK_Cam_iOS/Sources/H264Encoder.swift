import Foundation
import VideoToolbox
import CoreMedia

public protocol H264EncoderDelegate: AnyObject {
    func h264Encoder(_ encoder: H264Encoder, didEncodeNALU data: Data, isKeyFrame: Bool, pose: STARKPose6DoF?)
}

private final class PoseBox {
    let pose: STARKPose6DoF?
    init(_ pose: STARKPose6DoF?) { self.pose = pose }
}

public class H264Encoder {
    public weak var delegate: H264EncoderDelegate?
    
    private var compressionSession: VTCompressionSession?
    private var width: Int32 = 1920
    private var height: Int32 = 1080
    private var fps: Int32 = 60
    private var bitrate: Int32 = 20_000_000 // 20 Mbps default for 1080p60
    
    // NALU start codes
    private let naluStartCode = Data([0x00, 0x00, 0x00, 0x01])
    
    public init() {}
    
    public func configure(width: Int32, height: Int32, fps: Int32) {
        self.width = width
        self.height = height
        self.fps = fps
        
        // Optimal USB 2.0 half-duplex bitrate: 8-10 Mbps keeps upstream fast without starving return frames!
        if width > 1920 {
            self.bitrate = 24_000_000
        } else if width >= 1920 && fps >= 60 {
            self.bitrate = 11_000_000
        } else if fps >= 60 {
            self.bitrate = 8_000_000
        } else {
            self.bitrate = 6_000_000
        }
        
        teardown()
        setupCompressionSession()
    }
    
    private func setupCompressionSession() {
        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: width,
            height: height,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: compressionCallback,
            refcon: Unmanaged.passUnretained(self).toOpaque(),
            compressionSessionOut: &compressionSession
        )
        
        guard status == noErr, let session = compressionSession else {
            print("[STARK Encoder] Khong the khoi tao VTCompressionSession: \(status)")
            return
        }
        
        // Configure low-latency real-time video streaming (Baseline profile = 0 B-frames, instant decode)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Baseline_AutoLevel)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: bitrate as CFTypeRef)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ExpectedFrameRate, value: fps as CFTypeRef)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_MaxKeyFrameInterval, value: fps as CFTypeRef) // Keyframe every 1 second
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse) // Zero B-frames for zero latency
        
        VTCompressionSessionPrepareToEncodeFrames(session)
        print("[STARK Encoder] VideoToolbox Hardware H.264 San sang: \(width)x\(height) @ \(fps) FPS, Bitrate: \(bitrate / 1_000_000) Mbps")
    }
    
    public func encode(sampleBuffer: CMSampleBuffer, pose: STARKPose6DoF? = nil) {
        guard let session = compressionSession,
              let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
        let duration = CMSampleBufferGetDuration(sampleBuffer)
        let refCon = Unmanaged.passRetained(PoseBox(pose)).toOpaque()
        
        var flags: VTEncodeInfoFlags = []
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: imageBuffer,
            presentationTimeStamp: pts,
            duration: duration,
            frameProperties: nil,
            sourceFrameRefcon: refCon,
            infoFlagsOut: &flags
        )
        if status != noErr {
            _ = Unmanaged<PoseBox>.fromOpaque(refCon).takeRetainedValue()
        }
    }

    public func encode(pixelBuffer: CVPixelBuffer, presentationTimeStamp pts: CMTime, duration: CMTime = .invalid, pose: STARKPose6DoF? = nil) {
        let bufW = Int32(CVPixelBufferGetWidth(pixelBuffer))
        let bufH = Int32(CVPixelBufferGetHeight(pixelBuffer))
        if bufW > 0 && bufH > 0 && (bufW != self.width || bufH != self.height) {
            configure(width: bufW, height: bufH, fps: self.fps)
        }
        guard let session = compressionSession else { return }
        
        let refCon = Unmanaged.passRetained(PoseBox(pose)).toOpaque()
        var flags: VTEncodeInfoFlags = []
        let status = VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: pixelBuffer,
            presentationTimeStamp: pts,
            duration: duration,
            frameProperties: nil,
            sourceFrameRefcon: refCon,
            infoFlagsOut: &flags
        )
        if status != noErr {
            _ = Unmanaged<PoseBox>.fromOpaque(refCon).takeRetainedValue()
        }
    }
    
    public func teardown() {
        if let session = compressionSession {
            VTCompressionSessionInvalidate(session)
            compressionSession = nil
        }
    }
    
    deinit {
        teardown()
    }
}

// Global C-style callback for VideoToolbox
private func compressionCallback(
    outputCallbackRefCon: UnsafeMutableRawPointer?,
    sourceFrameRefCon: UnsafeMutableRawPointer?,
    status: OSStatus,
    infoFlags: VTEncodeInfoFlags,
    sampleBuffer: CMSampleBuffer?
) {
    var framePose: STARKPose6DoF? = nil
    if let sourceFrameRefCon = sourceFrameRefCon {
        let box = Unmanaged<PoseBox>.fromOpaque(sourceFrameRefCon).takeRetainedValue()
        framePose = box.pose
    }

    guard status == noErr, let sampleBuffer = sampleBuffer, let refCon = outputCallbackRefCon else { return }
    let encoder = Unmanaged<H264Encoder>.fromOpaque(refCon).takeUnretainedValue()
    
    // Check if keyframe
    var isKeyFrame = false
    if let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false) as? [[CFString: Any]],
       let first = attachments.first {
        let dependsOnOthers = (first[kCMSampleAttachmentKey_DependsOnOthers] as? Bool) ?? true
        isKeyFrame = !dependsOnOthers
    }
    
    // Combine all NALUs of this Access Unit (SPS + PPS + Slices) into a single buffer
    // so that each video frame emits exactly ONE multiplexed 6DoF + H.264 packet over USB.
    var frameNALUData = Data()

    // If keyframe, extract SPS and PPS parameters first
    if isKeyFrame {
        if let formatDesc = CMSampleBufferGetFormatDescription(sampleBuffer) {
            var spsSize: Int = 0
            var spsCount: Int = 0
            var spsPointer: UnsafePointer<UInt8>?
            
            var status = CMVideoFormatDescriptionGetH264ParameterSetAtIndex(
                formatDesc,
                parameterSetIndex: 0,
                parameterSetPointerOut: &spsPointer,
                parameterSetSizeOut: &spsSize,
                parameterSetCountOut: &spsCount,
                nalUnitHeaderLengthOut: nil
            )
            
            if status == noErr, let sps = spsPointer {
                frameNALUData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
                frameNALUData.append(sps, count: spsSize)
            }
            
            var ppsSize: Int = 0
            var ppsPointer: UnsafePointer<UInt8>?
            status = CMVideoFormatDescriptionGetH264ParameterSetAtIndex(
                formatDesc,
                parameterSetIndex: 1,
                parameterSetPointerOut: &ppsPointer,
                parameterSetSizeOut: &ppsSize,
                parameterSetCountOut: nil,
                nalUnitHeaderLengthOut: nil
            )
            
            if status == noErr, let pps = ppsPointer {
                frameNALUData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
                frameNALUData.append(pps, count: ppsSize)
            }
        }
    }
    
    // Extract slice NALUs
    guard let dataBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }
    
    var totalLength: Int = 0
    var dataPointer: UnsafeMutablePointer<Int8>?
    let blockStatus = CMBlockBufferGetDataPointer(dataBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &totalLength, dataPointerOut: &dataPointer)
    
    guard blockStatus == noErr, let rawBytes = dataPointer else { return }
    
    var bufferOffset: Int = 0
    let avccHeaderLength = 4 // AVCC 4-byte big-endian length prefix
    
    while bufferOffset < totalLength - avccHeaderLength {
        var naluLength: UInt32 = 0
        memcpy(&naluLength, rawBytes + bufferOffset, avccHeaderLength)
        naluLength = CFSwapInt32BigToHost(naluLength)
        
        let slicePointer = rawBytes + bufferOffset + avccHeaderLength
        frameNALUData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
        frameNALUData.append(UnsafePointer<UInt8>(OpaquePointer(slicePointer)), count: Int(naluLength))
        
        bufferOffset += avccHeaderLength + Int(naluLength)
    }

    if !frameNALUData.isEmpty {
        encoder.delegate?.h264Encoder(encoder, didEncodeNALU: frameNALUData, isKeyFrame: isKeyFrame, pose: framePose)
    }
}
