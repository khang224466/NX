/**
 * STARK CARDBOARDXR // ZERO-PYTHON NATIVE NODE.JS USB & GPU SERVER (v10.4.01 PRO)
 * ================================================================================
 * - 100% Native Node.js (ZERO Python in runtime):
 *   1. Speaks directly to Apple's native `usbmuxd` daemon (127.0.0.1:27015) using
 *      binary/XML plist packets to auto-discover the iPhone 13 over USB Lightning
 *      and open a direct 480Mbps pipe to port 23456 (`STARK XR Cam`).
 *   2. Demultiplexes incoming [4B BigEndian Length][Optional 36B '6DOF' ARKit Pose][H.264 NALU]
 *      packets at zero-copy speed, broadcasts 28B 6DoF poses over UDP 127.0.0.1:23457
 *      to Unity C# (`NetworkPoseSource.cs`), and streams H.264 + 6DoF over binary WebSocket
 *      to the NVIDIA RTX 4060 WebGL2/Three.js + WebCodecs NVDEC GPU Engine.
 *   3. Receives 60 FPS hardware-rendered Three.js JPEG frames from the GPU Engine and
 *      streams them back over USB port 23456 to the iPhone display with zero bufferbloat.
 *   4. Simultaneously serves HTTP (127.0.0.1:8787) for the local RTX 4060 Edge GPU App
 *      and HTTPS (0.0.0.0:8443) for direct iOS Safari WebGL2 + 120Hz Gyroscope execution.
 */

const net = require("net");
const dgram = require("dgram");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

// Resolve `ws` from workspace root or current folder
let WebSocketServer;
try {
  ({ WebSocketServer } = require("ws"));
} catch {
  ({ WebSocketServer } = require(path.join("d:\\BUISINESS\\node_modules\\ws")));
}

const HTTP_PORT = 8787;
const HTTPS_PORT = 8443;
const USBMUXD_PORT = 27015;
const IPHONE_CAM_PORT = 23456;
const UNITY_UDP_PORT = 23457;

const APP_DIR = __dirname;
const WORKSPACE_ROOT = path.resolve(APP_DIR, "..");

// MIME types for static asset serving (WASM, MJS, Three.js, Task models, MP4)
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".task": "application/octet-stream",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// -----------------------------------------------------------------------------
// 1. Native Apple `usbmuxd` Protocol Client (127.0.0.1:27015 -> iPhone:23456)
// -----------------------------------------------------------------------------
function htons(port) {
  return ((port & 0xff) << 8) | ((port >> 8) & 0xff);
}

function buildUsbmuxPacket(plistXml, tag = 1) {
  const body = Buffer.from(plistXml, "utf8");
  const hdr = Buffer.alloc(16);
  hdr.writeUInt32LE(16 + body.length, 0);
  hdr.writeUInt32LE(1, 4); // version 1
  hdr.writeUInt32LE(8, 8); // messageType 8 = XML plist
  hdr.writeUInt32LE(tag, 12);
  return Buffer.concat([hdr, body]);
}

function queryUsbmuxDevices() {
  return new Promise((resolve) => {
    const sock = net.connect(USBMUXD_PORT, "127.0.0.1");
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      sock.destroy();
      resolve([]);
    }, 1000);

    sock.on("connect", () => {
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<plist version="1.0"><dict>' +
        "<key>MessageType</key><string>ListDevices</string>" +
        "<key>ClientVersionString</key><string>stark-native-node</string>" +
        "<key>ProgName</key><string>stark-xr</string>" +
        "</dict></plist>";
      sock.write(buildUsbmuxPacket(xml, 1));
    });

    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length >= 4) {
        const totalLen = buf.readUInt32LE(0);
        if (buf.length >= totalLen) {
          clearTimeout(timer);
          const xmlStr = buf.slice(16, totalLen).toString("utf8");
          sock.destroy();
          // Extract USB DeviceIDs
          const ids = [];
          const regex =
            /<key>DeviceID<\/key>\s*<integer>(\d+)<\/integer>[\s\S]*?<key>ConnectionType<\/key>\s*<string>USB<\/string>/g;
          let m;
          while ((m = regex.exec(xmlStr)) !== null) {
            ids.push(parseInt(m[1], 10));
          }
          if (ids.length === 0) {
            const fallback = /<key>DeviceID<\/key>\s*<integer>(\d+)<\/integer>/g;
            while ((m = fallback.exec(xmlStr)) !== null) {
              const id = parseInt(m[1], 10);
              if (!ids.includes(id)) ids.push(id);
            }
          }
          resolve(ids);
        }
      }
    });

    sock.on("error", () => {
      clearTimeout(timer);
      resolve([]);
    });
  });
}

function connectUsbmuxPort(deviceId, port) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(USBMUXD_PORT, "127.0.0.1");
    sock.setNoDelay(true);
    let buf = Buffer.alloc(0);
    let handshakeDone = false;

    const timer = setTimeout(() => {
      if (!handshakeDone) {
        sock.destroy();
        reject(new Error("usbmuxd Connect timeout"));
      }
    }, 1500);

    sock.on("connect", () => {
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<plist version="1.0"><dict>' +
        "<key>MessageType</key><string>Connect</string>" +
        `<key>DeviceID</key><integer>${deviceId}</integer>` +
        `<key>PortNumber</key><integer>${htons(port)}</integer>` +
        "<key>ClientVersionString</key><string>stark-native-node</string>" +
        "<key>ProgName</key><string>stark-xr</string>" +
        "</dict></plist>";
      sock.write(buildUsbmuxPacket(xml, 2));
    });

    const onHandshakeData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length >= 4) {
        const totalLen = buf.readUInt32LE(0);
        if (buf.length >= totalLen) {
          clearTimeout(timer);
          const xmlStr = buf.slice(16, totalLen).toString("utf8");
          const remainder = buf.slice(totalLen);
          const m = /<key>Number<\/key>\s*<integer>(\d+)<\/integer>/.exec(xmlStr);
          const code = m ? parseInt(m[1], 10) : -1;
          if (code === 0) {
            handshakeDone = true;
            sock.removeListener("data", onHandshakeData);
            resolve({ sock, remainder });
          } else {
            sock.destroy();
            reject(new Error(`usbmuxd Connect result=${code}`));
          }
        }
      }
    };

    sock.on("data", onHandshakeData);
    sock.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// -----------------------------------------------------------------------------
// 2. HTTP / HTTPS Static & Asset Server (Serves Three.js, MediaPipe GPU WASM, Models)
// -----------------------------------------------------------------------------
function resolveStaticFile(urlPath) {
  const cleanUrl = urlPath.split("?")[0];
  if (cleanUrl === "/" || cleanUrl === "/index.html") {
    return path.join(APP_DIR, "stark_xr_gpu_engine.html");
  }
  if (cleanUrl === "/phone" || cleanUrl === "/phone/") {
    return path.join(APP_DIR, "stark_xr_phone_mirror.html");
  }
  if (cleanUrl === "/three.min.js") {
    const candidates = [
      path.join(APP_DIR, "three.min.js"),
      path.join(WORKSPACE_ROOT, "CardboardXR_Windows", "public", "js", "three.min.js"),
      "d:\\BUISINESS\\CardboardXR_Windows\\public\\js\\three.min.js",
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  if (cleanUrl === "/hand_landmarker.task") {
    const candidates = [
      path.join(APP_DIR, "hand_landmarker.task"),
      "d:\\BUISINESS\\Stark_Air_Mouse_App\\hand_landmarker.task",
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  if (cleanUrl.startsWith("/mediapipe/")) {
    const rel = cleanUrl.replace("/mediapipe/", "");
    const bases = [
      path.join(APP_DIR, "mediapipe"),
      path.join(WORKSPACE_ROOT, "node_modules", "@mediapipe", "tasks-vision"),
      "d:\\BUISINESS\\node_modules\\@mediapipe\\tasks-vision",
    ];
    for (const b of bases) {
      const candidate = path.join(b, rel);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  if (cleanUrl.startsWith("/videos/")) {
    const rel = cleanUrl.replace("/videos/", "");
    const candidates = [
      path.join(APP_DIR, "videos", rel),
      path.join("d:\\BUISINESS\\Stark_Air_Mouse_App\\videos", rel),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  const localCandidate = path.join(APP_DIR, cleanUrl);
  if (fs.existsSync(localCandidate) && fs.statSync(localCandidate).isFile()) {
    return localCandidate;
  }
  return null;
}

function handleHttpRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (req.url === "/manifest.json") {
    const manifest = JSON.stringify({
      name: "STARK CardboardXR Pro",
      short_name: "CardboardXR",
      start_url: "/",
      display: "fullscreen",
      orientation: "landscape",
      background_color: "#000000",
      theme_color: "#000000",
    });
    res.writeHead(200, { "Content-Type": "application/manifest+json" });
    res.end(manifest);
    return;
  }

  const filePath = resolveStaticFile(req.url || "/");
  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found: " + req.url);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);

  // Support Range requests for MP4 video streaming
  if (ext === ".mp4" && req.headers.range) {
    const parts = req.headers.range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(filePath).pipe(res);
}

// -----------------------------------------------------------------------------
// 3. Main USB-to-WebSocket Bridge & Return Frame Streamer
// -----------------------------------------------------------------------------
class StarkNativeXRServer {
  constructor() {
    this.usbSock = null;
    this.usbConnected = false;
    this.usbWriting = false;
    this.latestPendingJpeg = null;
    this.wsClients = new Set();
    this.udpSock = dgram.createSocket("udp4");
    this.rxFrames = 0;
    this.lastFpsTime = Date.now();
    this.iphoneFps = 0;
    this.returnFrames = 0;
    this.lastReturnFpsTime = Date.now();
    this.phoneReturnFps = 0;
  }

  hasPhoneMirrorClients() {
    for (const client of this.wsClients) {
      if (client.readyState === 1 && client.clientRole === "phone_mirror") return true;
    }
    return false;
  }

  broadcastBinary(opcode, payloadBuf) {
    if (this.wsClients.size === 0) return;
    const msg = Buffer.allocUnsafe(1 + payloadBuf.length);
    msg[0] = opcode;
    payloadBuf.copy(msg, 1);
    for (const client of this.wsClients) {
      if (client.readyState === 1 && client.clientRole !== "phone_mirror" && client.bufferedAmount < 1_500_000) {
        client.send(msg, { binary: true });
      }
    }
  }

  broadcastPhoneMirror(rawMsg) {
    for (const client of this.wsClients) {
      if (client.readyState === 1 && client.clientRole === "phone_mirror" && client.bufferedAmount < 262144) {
        client.send(rawMsg, { binary: true });
      }
    }
  }

  sendWireAckToEngines() {
    const ack = Buffer.from([0x05]);
    for (const client of this.wsClients) {
      if (client.readyState === 1 && client.clientRole !== "phone_mirror") {
        client.send(ack, { binary: true });
      }
    }
  }

  broadcastStatus() {
    const msg = JSON.stringify({
      type: "usb_status",
      connected: this.usbConnected,
      fps: Math.round(this.iphoneFps),
      phoneFps: Math.round(this.phoneReturnFps),
      mirrorConnected: this.hasPhoneMirrorClients(),
    });
    for (const client of this.wsClients) {
      if (client.readyState === 1 && client.clientRole !== "phone_mirror") {
        client.send(msg);
      }
    }
  }

  sendFrameBackToIphone(jpegBuf) {
    if (!this.usbConnected || !this.usbSock) {
      this.sendWireAckToEngines();
      return;
    }
    // Latest-Frame-Only Mailbox: Luon gui duy nhat frame moi nhat, khong bao gio xep hang gay tre (Zero Queue Lag)!
    if (this.usbWriting) {
      this.latestPendingJpeg = jpegBuf;
      return;
    }
    this._flushJpegToUsb(jpegBuf);
  }

  _flushJpegToUsb(jpegBuf) {
    if (!this.usbConnected || !this.usbSock) {
      this.usbWriting = false;
      this.latestPendingJpeg = null;
      this.sendWireAckToEngines();
      return;
    }
    this.usbWriting = true;
    const hdr = Buffer.allocUnsafe(4);
    hdr.writeUInt32BE(jpegBuf.length, 0);
    const pkt = Buffer.concat([hdr, jpegBuf]);
    this.usbSock.write(pkt, () => {
      this.returnFrames++;
      const now = Date.now();
      if (now - this.lastReturnFpsTime >= 1000) {
        this.phoneReturnFps = (this.returnFrames * 1000) / (now - this.lastReturnFpsTime);
        this.returnFrames = 0;
        this.lastReturnFpsTime = now;
      }
      if (this.latestPendingJpeg) {
        const nextBuf = this.latestPendingJpeg;
        this.latestPendingJpeg = null;
        this._flushJpegToUsb(nextBuf);
      } else {
        this.usbWriting = false;
        this.sendWireAckToEngines();
      }
    });
  }

  attachUsbStream(sock, initialRemainder = Buffer.alloc(0)) {
    sock.setNoDelay(true);
    this.usbSock = sock;
    this.usbConnected = true;
    this.usbWriting = false;
    this.latestPendingJpeg = null;
    console.log("\n[V] KET NOI THANH CONG VOI IPHONE 13 QUA CAP USB LIGHTNING (NATIVE NODE.JS)!");
    this.broadcastStatus();
    this.sendWireAckToEngines();

    let accum = initialRemainder;

    const processAccum = () => {
      while (accum.length >= 4) {
        const len = accum.readUInt32BE(0);
        if (len <= 0 || len > 10_000_000) {
          accum = Buffer.alloc(0);
          break;
        }
        if (accum.length < 4 + len) break;

        const payload = accum.subarray(4, 4 + len);
        accum = accum.subarray(4 + len);

        let h264Data = payload;
        // Check for 36-byte Multiplexed ARKit 6DoF Header: '6DOF' + 4B type + 28B (7 floats)
        if (
          payload.length >= 36 &&
          payload[0] === 0x36 && // '6'
          payload[1] === 0x44 && // 'D'
          payload[2] === 0x4f && // 'O'
          payload[3] === 0x46    // 'F'
        ) {
          const pose28 = payload.subarray(8, 36);
          h264Data = payload.subarray(36);
          // Forward 28B 6DoF pose to GPU Engine (Opcode 0x02) and Unity C# UDP 23457
          this.broadcastBinary(0x02, pose28);
          this.udpSock.send(pose28, UNITY_UDP_PORT, "127.0.0.1");
        }

        // Forward H.264 NALU access unit to GPU Engine (Opcode 0x01)
        if (h264Data.length > 0) {
          this.broadcastBinary(0x01, h264Data);
          this.rxFrames++;
          const now = Date.now();
          if (now - this.lastFpsTime >= 1000) {
            this.iphoneFps = (this.rxFrames * 1000) / (now - this.lastFpsTime);
            this.rxFrames = 0;
            this.lastFpsTime = now;
            this.broadcastStatus();
          }
        }
      }
    };

    if (accum.length > 0) processAccum();

    sock.on("data", (chunk) => {
      accum = accum.length === 0 ? chunk : Buffer.concat([accum, chunk]);
      processAccum();
    });

    const onDisconnect = () => {
      if (this.usbSock === sock) {
        this.usbConnected = false;
        this.usbSock = null;
        this.usbWriting = false;
        this.latestPendingJpeg = null;
        this.iphoneFps = 0;
        this.phoneReturnFps = 0;
        console.log("[!] Tam ngat ket noi USB iPhone. Dang tu dong tim kiem lai...");
        this.broadcastStatus();
        this.sendWireAckToEngines();
      }
    };

    sock.on("close", onDisconnect);
    sock.on("error", onDisconnect);
  }

  startUsbAutoConnector() {
    const loop = async () => {
      if (!this.usbConnected) {
        try {
          const deviceIds = await queryUsbmuxDevices();
          for (const id of deviceIds) {
            try {
              const { sock, remainder } = await connectUsbmuxPort(id, IPHONE_CAM_PORT);
              this.attachUsbStream(sock, remainder);
              break;
            } catch {
              // STARK XR Cam app on iPhone may not be open yet
            }
          }
        } catch {
          // Ignore and retry
        }
      }
      setTimeout(loop, this.usbConnected ? 1000 : 750);
    };
    loop();
  }

  start() {
    // 1. Start HTTP Server (for local RTX 4060 Edge App window)
    const httpServer = http.createServer(handleHttpRequest);
    const wss = new WebSocketServer({ server: httpServer });

    const bindWs = (ws) => {
      ws.clientRole = "gpu_engine";
      if (ws._socket && typeof ws._socket.setNoDelay === "function") {
        ws._socket.setNoDelay(true);
      }
      this.wsClients.add(ws);
      ws.send(
        JSON.stringify({
          type: "usb_status",
          connected: this.usbConnected,
          fps: Math.round(this.iphoneFps),
          phoneFps: Math.round(this.phoneReturnFps),
          mirrorConnected: this.hasPhoneMirrorClients(),
        })
      );

      ws.on("message", (data, isBinary) => {
        if (!isBinary) {
          try {
            const parsed = JSON.parse(data.toString("utf8"));
            if (parsed.type === "role" && parsed.role) {
              ws.clientRole = parsed.role;
              this.broadcastStatus();
            } else if (parsed.type === "gyro") {
              const fwd = JSON.stringify(parsed);
              for (const c of this.wsClients) {
                if (c.readyState === 1 && c.clientRole !== "phone_mirror") c.send(fwd);
              }
            }
          } catch {}
          return;
        }
        if (isBinary && data.length > 1) {
          const opcode = data[0];
          if (opcode === 0x03) {
            // Opcode 0x03: Rendered JPEG frame from RTX 4060 Three.js Canvas -> Send back to iPhone USB + Fullscreen Web Mirror!
            if (this.hasPhoneMirrorClients()) {
              this.broadcastPhoneMirror(data);
            }
            this.sendFrameBackToIphone(data.subarray(1));
          } else if (opcode === 0x04 && data.length >= 29) {
            // Opcode 0x04: Visual/Gyro 6DoF Pose from GPU Engine -> Forward to Unity UDP 23457
            this.udpSock.send(data.subarray(1, 29), UNITY_UDP_PORT, "127.0.0.1");
          }
        }
      });

      ws.on("close", () => {
        const wasMirror = ws.clientRole === "phone_mirror";
        this.wsClients.delete(ws);
        if (wasMirror) this.broadcastStatus();
      });
      ws.on("error", () => this.wsClients.delete(ws));
    };

    wss.on("connection", bindWs);

    httpServer.listen(HTTP_PORT, "127.0.0.1", () => {
      console.log("=========================================================================");
      console.log("  STARK CARDBOARDXR // NATIVE GPU ENGINE v10.4.01 PRO (ZERO PYTHON)");
      console.log(`  [+] Local RTX 4060 GPU Engine : http://127.0.0.1:${HTTP_PORT}`);
    });

    // 2. Start HTTPS Server on 8443 (for direct iOS Safari WebGL2 + 120Hz Gyroscope)
    const certPath = path.join(APP_DIR, "server_cert.pem");
    const keyPath = path.join(APP_DIR, "server_key.pem");
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      try {
        const httpsServer = https.createServer(
          {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
          },
          handleHttpRequest
        );
        const wssSecure = new WebSocketServer({ server: httpsServer });
        wssSecure.on("connection", bindWs);
        httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
          const nets = os.networkInterfaces();
          let lanIp = "127.0.0.1";
          for (const name of Object.keys(nets)) {
            for (const netInfo of nets[name]) {
              if (netInfo.family === "IPv4" && !netInfo.internal) {
                lanIp = netInfo.address;
                break;
              }
            }
          }
          console.log("=========================================================================");
          console.log("  STARK CARDBOARDXR // NATIVE GPU ENGINE v10.4.01 PRO (ZERO PYTHON)");
          console.log(`  [+] Local RTX 4060 GPU Engine    : http://127.0.0.1:${HTTP_PORT}`);
          console.log(`  [+] iPhone Fullscreen 60FPS Mirror: https://${lanIp}:${HTTPS_PORT}/phone`);
          console.log(`  [+] iPhone Safari Native WebXR   : https://${lanIp}:${HTTPS_PORT}`);
          console.log("=========================================================================");
        });
      } catch (e) {
        console.log("  [!] HTTPS 8443 skipped:", e.message);
      }
    }

    // 3. Start Native Apple usbmuxd Auto-Connector
    this.startUsbAutoConnector();

    // 4. Auto-Launch Microsoft Edge Chromium in Native GPU App Mode (unless --no-browser)
    if (!process.argv.includes("--no-browser")) {
      this.launchEdgeGpuApp();
    }
  }

  launchEdgeGpuApp() {
    const edgePaths = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ];
    const edgeExe = edgePaths.find((p) => fs.existsSync(p));
    if (edgeExe) {
      console.log("[+] Dang khoi chay Cua so Do hoa RTX 4060 WebGL2 + MediaPipe GPU...");
      spawn(
        edgeExe,
        [
          `--app=http://127.0.0.1:${HTTP_PORT}`,
          "--window-size=1280,720",
          "--enable-gpu-rasterization",
          "--enable-zero-copy",
          "--ignore-gpu-blocklist",
          "--autoplay-policy=no-user-gesture-required",
        ],
        { detached: true, stdio: "ignore" }
      ).unref();
    }
  }
}

if (require.main === module) {
  const server = new StarkNativeXRServer();
  server.start();
}

module.exports = { StarkNativeXRServer, queryUsbmuxDevices };
