import Foundation
import Network

public protocol USBTunnelDelegate: AnyObject {
    func usbTunnelDidConnectClient(_ tunnel: USBTunnel)
    func usbTunnelDidDisconnectClient(_ tunnel: USBTunnel)
    func usbTunnel(_ tunnel: USBTunnel, didReceiveReturnFrame data: Data)
    func usbTunnel(_ tunnel: USBTunnel, didChangeState state: NWListener.State)
}

public class USBTunnel {
    public weak var delegate: USBTunnelDelegate?
    
    private var listener: NWListener?
    private var activeConnection: NWConnection?
    public let port: NWEndpoint.Port = 23456
    
    private let tunnelQueue = DispatchQueue(label: "com.stark.usb.tunnel", qos: .userInteractive)
    public private(set) var isClientConnected: Bool = false
    
    public init() {}
    
    public func startServer() {
        do {
            let parameters = NWParameters.tcp
            parameters.allowLocalEndpointReuse = true
            
            // Prefer wired USB interface
            let tcpOptions = parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options
            tcpOptions?.version = .v4
            
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
        connection.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                print("[STARK USB Tunnel] PC Laptop Legion RTX 4060 da ket noi qua cap USB!")
                self.isClientConnected = true
                self.delegate?.usbTunnelDidConnectClient(self)
                self.receiveNextPacket()
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
    
    // Send NALU frame over USB to PC
    public func sendFrameData(_ data: Data) {
        guard let connection = activeConnection, isClientConnected else { return }
        
        // Prefix with 4-byte big-endian payload length for streaming TCP packet framing
        var length = UInt32(data.count).bigEndian
        var packet = Data(bytes: &length, count: 4)
        packet.append(data)
        
        connection.send(content: packet, completion: .contentProcessed({ error in
            if let error = error {
                print("[STARK USB Tunnel] Loi truyen frame qua USB: \(error)")
            }
        }))
    }
    
    // Receive return stream (SBS Stereo VR render) from PC Laptop
    private func receiveNextPacket() {
        guard let connection = activeConnection, isClientConnected else { return }
        
        // Read 4-byte length prefix
        connection.receive(minimumIncompleteLength: 4, maximumLength: 4) { [weak self] content, _, isComplete, error in
            guard let self = self else { return }
            
            if let data = content, data.count == 4 {
                let length = data.withUnsafeBytes { $0.load(as: UInt32.self).bigEndian }
                self.receivePayload(length: Int(length))
            } else if isComplete || error != nil {
                self.isClientConnected = false
                self.delegate?.usbTunnelDidDisconnectClient(self)
            }
        }
    }
    
    private func receivePayload(length: Int) {
        guard let connection = activeConnection, isClientConnected else { return }
        
        connection.receive(minimumIncompleteLength: length, maximumLength: length) { [weak self] content, _, isComplete, error in
            guard let self = self else { return }
            
            if let payload = content, payload.count == length {
                self.delegate?.usbTunnel(self, didReceiveReturnFrame: payload)
                // Continue reading next incoming SBS frame
                self.receiveNextPacket()
            } else if isComplete || error != nil {
                self.isClientConnected = false
                self.delegate?.usbTunnelDidDisconnectClient(self)
            }
        }
    }
    
    public func stop() {
        activeConnection?.cancel()
        activeConnection = nil
        listener?.cancel()
        listener = nil
        isClientConnected = false
    }
    
    deinit {
        stop()
    }
}
