import Foundation
import Network
import simd

public struct STARKPose6DoF {
    public var position: simd_float3 // x, y, z in meters
    public var orientation: simd_quatf // qx, qy, qz, qw
    public var timestamp: TimeInterval
    public var verticalFovDeg: Float

    public init(
        position: simd_float3,
        orientation: simd_quatf,
        timestamp: TimeInterval = ProcessInfo.processInfo.systemUptime,
        verticalFovDeg: Float = 45.0
    ) {
        self.position = position
        self.orientation = orientation
        self.timestamp = timestamp
        self.verticalFovDeg = verticalFovDeg
    }

    // 28 bytes binary data (Little Endian: 3f pos + 4f quat)
    public var binaryData: Data {
        var data = Data(capacity: 28)
        var px = position.x
        var py = position.y
        var pz = position.z
        var qx = orientation.vector.x
        var qy = orientation.vector.y
        var qz = orientation.vector.z
        var qw = orientation.vector.w

        withUnsafeBytes(of: &px) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &py) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &pz) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &qx) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &qy) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &qz) { data.append(contentsOf: $0) }
        withUnsafeBytes(of: &qw) { data.append(contentsOf: $0) }
        return data
    }

    // 32 bytes binary data (28B Pose + 4B ARKit Vertical FOV in degrees)
    public var binaryDataWithFov: Data {
        var data = binaryData
        var fov = verticalFovDeg
        withUnsafeBytes(of: &fov) { data.append(contentsOf: $0) }
        return data
    }
}

public protocol USBTunnelDelegate: AnyObject {
    func usbTunnelDidConnectClient(_ tunnel: USBTunnel)
    func usbTunnelDidDisconnectClient(_ tunnel: USBTunnel)
    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnFrame data: Data)
    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnH264 data: Data)
    func usbTunnel(_ tunnel: USBTunnel, didChangeState state: NWListener.State)
}

public class USBTunnel {
    public weak var delegate: USBTunnelDelegate?
    
    private var listener: NWListener?
    private var activeConnection: NWConnection?
    public let port: NWEndpoint.Port = 23456
    
    private let tunnelQueue = DispatchQueue(label: "com.stark.usb.tunnel", qos: .userInteractive)
    public private(set) var isClientConnected: Bool = false
    
    // Accumulation buffer & cursor for incoming TCP stream chunks (zero O(N) shifting + latest-frame mailbox)
    private var incomingBuffer = Data()
    private var incomingReadOffset: Int = 0
    
    public init() {}
    
    public func startServer() {
        do {
            let tcpOptions = NWProtocolTCP.Options()
            tcpOptions.noDelay = true // TCP_NODELAY: Disable Nagle algorithm for zero USB latency
            let parameters = NWParameters(tls: nil, tcp: tcpOptions)
            parameters.allowLocalEndpointReuse = true
            
            // Prefer IPv4 for local usbmuxd tunnel
            let ipOptions = parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options
            ipOptions?.version = .v4
            
            listener = try NWListener(using: parameters, on: port)
            
            listener?.stateUpdateHandler = { [weak self] state in
                guard let self = self else { return }
                self.delegate?.usbTunnel(self, didChangeState: state)
                switch state {
                case .ready:
                    print("[STARK USB Tunnel] May chu cong USB san sang tai Port \(self.port)")
                case .failed(let error):
                    print("[STARK USB Tunnel] Loi May chu: \(error)")
                default:
                    break
                }
            }
            
            listener?.newConnectionHandler = { [weak self] newConn in
                guard let self = self else { return }
                self.handleNewConnection(newConn)
            }
            
            listener?.start(queue: tunnelQueue)
        } catch {
            print("[STARK USB Tunnel] Khong khoi tao duoc NWListener: \(error)")
        }
    }
    
    private func handleNewConnection(_ connection: NWConnection) {
        // Disconnect previous if any
        if let existing = activeConnection {
            existing.cancel()
        }
        
        activeConnection = connection
        incomingBuffer.removeAll(keepingCapacity: true)
        incomingReadOffset = 0
        
        connection.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                print("[STARK USB Tunnel] PC Laptop Legion RTX 4060 da ket noi qua cap USB!")
                self.isClientConnected = true
                self.delegate?.usbTunnelDidConnectClient(self)
                self.startReceiving()
            case .failed(let err):
                print("[STARK USB Tunnel] Ket noi bi ngat: \(err)")
                self.isClientConnected = false
                self.delegate?.usbTunnelDidDisconnectClient(self)
            case .cancelled:
                self.isClientConnected = false
                self.delegate?.usbTunnelDidDisconnectClient(self)
            default:
                break
            }
        }
        
        connection.start(queue: tunnelQueue)
    }
    
    // Send NALU frame over USB to PC (supports optional 6DoF Pose multiplexing)
    public func sendFrameData(_ data: Data, pose: STARKPose6DoF? = nil) {
        guard let connection = activeConnection, isClientConnected else { return }
        
        var packet: Data
        if let pose = pose {
            // Multiplexed 6DoF Packet:
            // [4B Magic '6DOF'] + [4B Type 0x02] + [32B Pose+VFov] + [H.264 Payload]
            let magic = "6DOF".data(using: .ascii)!
            var packetType = UInt32(2).littleEndian
            let typeData = Data(bytes: &packetType, count: 4)
            let poseBytes = pose.binaryDataWithFov
            
            let totalPayloadLength = magic.count + typeData.count + poseBytes.count + data.count
            var length = UInt32(totalPayloadLength).bigEndian
            
            packet = Data(bytes: &length, count: 4)
            packet.append(magic)
            packet.append(typeData)
            packet.append(poseBytes)
            packet.append(data)
        } else {
            // Standard NALU video packet
            var length = UInt32(data.count).bigEndian
            packet = Data(bytes: &length, count: 4)
            packet.append(data)
        }
        
        connection.send(content: packet, completion: .contentProcessed({ error in
            if let error = error {
                print("[STARK USB Tunnel] Loi truyen frame qua USB: \(error)")
            }
        }))
    }
    
    // Continuous TCP Stream chunk receiver (solves partial chunk delivery & fragmentation)
    private func startReceiving() {
        guard let connection = activeConnection, isClientConnected else { return }
        
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] content, _, isComplete, error in
            guard let self = self else { return }
            
            if let data = content, !data.isEmpty {
                self.incomingBuffer.append(data)
                self.processIncomingBuffer()
            }
            
            if isComplete || error != nil {
                print("[STARK USB Tunnel] Client ngat ket noi hoac co loi: \(String(describing: error))")
                self.isClientConnected = false
                self.delegate?.usbTunnelDidDisconnectClient(self)
                return
            }
            
            // Loop for next chunk in TCP stream
            self.startReceiving()
        }
    }
    
    private func processIncomingBuffer() {
        // TCP Stream Framing: [4 bytes BigEndian Length] + [Payload Data (H.264 Annex-B or JPEG)]
        // H.264 frames (00 00 00 01 ...) are delivered in strict sequence so P-frames never break.
        // JPEG frames use latest-frame mailbox to skip any intermediate buffered stills.
        var h264Queue: [Data] = []
        var latestJpegData: Data? = nil
        while (incomingBuffer.count - incomingReadOffset) >= 4 {
            let lenOffset = incomingReadOffset
            let length: UInt32 = incomingBuffer.withUnsafeBytes { rawBuf in
                guard let base = rawBuf.baseAddress else { return 0 }
                var val: UInt32 = 0
                memcpy(&val, base.advanced(by: lenOffset), 4)
                return UInt32(bigEndian: val)
            }
            if length == 0 || length > 10_000_000 {
                print("[STARK USB Tunnel] Goi tin khong hop le (\(length) bytes), xoa buffer")
                incomingBuffer.removeAll(keepingCapacity: false)
                incomingReadOffset = 0
                break
            }
            let totalFrameSize = 4 + Int(length)
            if (incomingBuffer.count - incomingReadOffset) >= totalFrameSize {
                let start = incomingReadOffset + 4
                let end = incomingReadOffset + totalFrameSize
                let payload = incomingBuffer.subdata(in: start..<end)
                incomingReadOffset = end
                if payload.count >= 4,
                   payload[payload.startIndex] == 0x00,
                   payload[payload.startIndex + 1] == 0x00,
                   payload[payload.startIndex + 2] == 0x00,
                   payload[payload.startIndex + 3] == 0x01 {
                    h264Queue.append(payload)
                } else {
                    latestJpegData = payload
                }
            } else {
                break
            }
        }

        if incomingReadOffset > 0 {
            if incomingReadOffset >= incomingBuffer.count {
                incomingBuffer.removeAll(keepingCapacity: true)
                incomingReadOffset = 0
            } else if incomingReadOffset >= 65536 {
                incomingBuffer.removeSubrange(0..<incomingReadOffset)
                incomingReadOffset = 0
            }
        }

        for au in h264Queue {
            self.delegate?.usbTunnel(self, didReceiveReturnH264: au)
        }
        if let frameData = latestJpegData {
            self.delegate?.usbTunnel(self, didReceiveReturnFrame: frameData)
        }
    }
    
    public func stop() {
        activeConnection?.cancel()
        activeConnection = nil
        listener?.cancel()
        listener = nil
        isClientConnected = false
        incomingBuffer.removeAll(keepingCapacity: false)
        incomingReadOffset = 0
    }
    
    deinit {
        stop()
    }
}
