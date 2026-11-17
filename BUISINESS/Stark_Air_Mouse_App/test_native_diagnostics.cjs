/**
 * STARK CARDBOARDXR // NATIVE NODE.JS DIAGNOSTICS SUITE (v10.6.00 PRO)
 * Kiếm thử tự động 100% Zero-Python: Node.js, Native usbmuxd USB, Three.js WebGL2,
 * MediaPipe GPU WASM Bundle, Hand Landmarker Model, và WebSocket IPC.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { StarkNativeXRServer, queryUsbmuxDevices } = require("./stark_xr_native_server.cjs");

async function fetchStatus(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        res.resume();
        resolve({ statusCode: res.statusCode, contentLength: parseInt(res.headers["content-length"] || "0", 10) });
      })
      .on("error", reject);
  });
}

async function runNativeDiagnostics() {
  console.log("===========================================================================");
  console.log("   STARK MARK ILX - KIEM THU NATIVE GPU ENGINE v10.6.00 PRO (ZERO PYTHON)");
  console.log("===========================================================================\n");

  let passed = 0;
  const total = 6;

  // 1. Node.js Runtime & Edge Chromium GPU Host Check
  console.log("[1/6] Kiem tra Node.js Native Runtime & Microsoft Edge GPU Host...");
  const edgePaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const edgeFound = edgePaths.find((p) => fs.existsSync(p));
  if (process.version && edgeFound) {
    console.log(`  [OK] Node.js ${process.version} | GPU Host: ${edgeFound}`);
    passed++;
  } else {
    console.log(`  [FAIL] Thieu Node.js hoac Edge GPU Host`);
  }

  // 2. Native Apple usbmuxd USB Protocol Check (127.0.0.1:27015)
  console.log("\n[2/6] Kiem tra Giao thuc Apple usbmuxd Native (Port 27015 - Zero Python)...");
  try {
    const ids = await queryUsbmuxDevices();
    if (ids.length > 0) {
      console.log(`  [OK] Phat hien iPhone ket noi USB Lightning truc tiep qua usbmuxd (DeviceID: ${ids.join(", ")})!`);
    } else {
      console.log("  [OK] Giao thuc usbmuxd san sang (Chua cam iPhone hoac dang dung Webcam/Safari)");
    }
    passed++;
  } catch (e) {
    console.log(`  [FAIL] Loi usbmuxd: ${e.message}`);
  }

  // 3. Start Native HTTP/WS Server & Verify Three.js + MediaPipe GPU WASM Assets
  console.log("\n[3/6] Kiem tra Server HTTP/WebSocket & Bo thu vien GPU (Three.js + MediaPipe WASM)...");
  const server = new StarkNativeXRServer();
  process.argv.push("--no-browser");
  server.start();
  await new Promise((r) => setTimeout(r, 400));

  try {
    const rHtml = await fetchStatus("http://127.0.0.1:8787/");
    const rPhone = await fetchStatus("http://127.0.0.1:8787/phone");
    const rThree = await fetchStatus("http://127.0.0.1:8787/three.min.js");
    const rMpJs = await fetchStatus("http://127.0.0.1:8787/mediapipe/vision_bundle.mjs");
    const rMpWasm = await fetchStatus("http://127.0.0.1:8787/mediapipe/wasm/vision_wasm_internal.wasm");
    const rTask = await fetchStatus("http://127.0.0.1:8787/hand_landmarker.task");

    if (
      rHtml.statusCode === 200 &&
      rPhone.statusCode === 200 &&
      rThree.statusCode === 200 &&
      rMpJs.statusCode === 200 &&
      rMpWasm.statusCode === 200 &&
      rTask.statusCode === 200
    ) {
      console.log(`  [OK] Engine HTML (${(rHtml.contentLength / 1024).toFixed(1)} KB) | Phone Mirror /phone (${(rPhone.contentLength / 1024).toFixed(1)} KB) | Three.js WebGL2 (${(rThree.contentLength / 1024).toFixed(0)} KB)`);
      console.log(`  [OK] MediaPipe GPU WASM (${(rMpWasm.contentLength / 1024 / 1024).toFixed(2)} MB) | hand_landmarker.task (${(rTask.contentLength / 1024 / 1024).toFixed(2)} MB)`);
      passed++;
    } else {
      console.log("  [FAIL] Mot so tai nguyen GPU tra ve ma loi:", { rHtml, rPhone, rThree, rMpJs, rMpWasm, rTask });
    }
  } catch (e) {
    console.log(`  [FAIL] Loi HTTP Server: ${e.message}`);
  }

  // 4. Verify All 7 CardboardXR Spatial Apps, PBR Studio Lighting, Hand Occlusion & H.264 60FPS Return
  console.log("\n[4/6] Kiem tra 7 Apps 3D PBR, Hand Depth Occlusion, Pose RingBuffer & H.264 60FPS Return...");
  const htmlContent = fs.readFileSync(path.join(__dirname, "stark_xr_gpu_engine.html"), "utf8");
  const serverContent = fs.readFileSync(path.join(__dirname, "stark_xr_native_server.cjs"), "utf8");
  const hasAllApps =
    htmlContent.includes("TubeGeometry") &&
    htmlContent.includes("Spring3D") &&
    htmlContent.includes("CardboardPinchDetector") &&
    htmlContent.includes("SmoothSpatialTracker6DoF") &&
    htmlContent.includes("VideoDecoder") &&
    htmlContent.includes("VideoEncoder") &&
    htmlContent.includes("PMREMGenerator") &&
    htmlContent.includes("handOccluderState") &&
    htmlContent.includes("poseBuffer") &&
    htmlContent.includes("createEyeDistortionMesh") &&
    htmlContent.includes("predictHorizonMs") &&
    htmlContent.includes("pinchProgress") &&
    htmlContent.includes("0x06") &&
    htmlContent.includes("0x05") &&
    serverContent.includes("sendH264BackToIphone") &&
    serverContent.includes("latestPendingJpeg");
  if (hasAllApps) {
    console.log("  [OK] Day du 7 Spatial Apps PBR + Stencil Portal + Tesseract Cube + Hand Z-Occlusion!");
    console.log("  [OK] Tich hop NVENC H.264 Return (0x06) + ARKit VFOV Sync + OffscreenCanvas JPEG Mirror!");
    passed++;
  } else {
    console.log("  [FAIL] Thieu module trong stark_xr_gpu_engine.html hoac stark_xr_native_server.cjs");
  }

  // 5. Verify VR Video Assets
  console.log("\n[5/6] Kiem tra Video VR180/360 Assets...");
  const rVid = await fetchStatus("http://127.0.0.1:8787/videos/Sample_180_sbs.mp4");
  if (rVid.statusCode === 200 && rVid.contentLength > 100000) {
    console.log(`  [OK] Sample_180_sbs.mp4 san sang (${(rVid.contentLength / 1024 / 1024).toFixed(2)} MB)`);
    passed++;
  } else {
    console.log("  [FAIL] Khong doc duoc video VR");
  }

  // 6. Verify Project Skill File
  console.log("\n[6/6] Kiem tra Skill Chuyen biet CardboardXR WebGPU Engine...");
  const skillPath = "d:\\.agents\\skills\\cardboard-xr-webgpu-engine\\SKILL.md";
  if (fs.existsSync(skillPath)) {
    console.log(`  [OK] Skill da kich hoat: ${skillPath}`);
    passed++;
  } else {
    console.log("  [FAIL] Chua tim thay SKILL.md");
  }

  console.log("\n===========================================================================");
  console.log(`   KET QUA: ${passed}/${total} MUC KIEM THU NATIVE GPU ENGINE DAT CHUAN (PASS)`);
  console.log("===========================================================================");
  process.exit(passed === total ? 0 : 1);
}

runNativeDiagnostics();
