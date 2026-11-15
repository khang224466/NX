// Run: node --test test_web_regressions.cjs
// Execute the real inline application with a simulated DOM/camera/socket.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'stark_air_mouse_web_app.html'), 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim()).join('\n');

function harness() {
    let now = 1000, resultsCallback, activeElement = null;
    const handlers = new Map(), elements = new Map(), intervals = [], sockets = [];
    function element(id = '') {
        const classes = new Set();
        return {
            id, style: {}, children: [], clicks: 0, value: '', textContent: '',
            width: 640, height: 480,
            classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), toggle() {} },
            appendChild(child) { this.children.push(child); },
            click() { this.clicks++; }, focus() {}, closest() { return this; },
            getContext() { return new Proxy({}, { get: () => () => {} }); },
            getBoundingClientRect() { return { left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100 }; }
        };
    }
    const document = {
        getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
        querySelectorAll: () => [], elementFromPoint: () => activeElement,
        createElement: () => element()
    };
    class Hands {
        setOptions() {}
        onResults(callback) { resultsCallback = callback; }
        async send() {}
    }
    class Camera {
        constructor(video, options) { this.options = options; this.starts = 0; this.stops = 0; }
        async start() { this.starts++; }
        stop() { this.stops++; }
    }
    class WebSocket {
        static OPEN = 1;
        constructor(url) { this.url = url; this.readyState = 1; this.bufferedAmount = 0; this.messages = []; sockets.push(this); }
        send(payload) { this.messages.push(JSON.parse(payload)); }
        close() { this.readyState = 3; }
    }
    const context = vm.createContext({
        window: { innerWidth: 1000, innerHeight: 800, location: { search: '?token=test-secret' }, AudioContext: class {},
            addEventListener(name, callback) { if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(callback); } },
        document, performance: { now: () => now }, WebSocket, Hands, Camera,
        URLSearchParams, localStorage: { getItem: () => null }, console,
        setInterval(callback) { intervals.push(callback); }, setTimeout() {},
        drawConnectors() {}, drawLandmarks() {}, HAND_CONNECTIONS: []
    });
    vm.runInContext(source, context);
    const run = code => vm.runInContext(code, context);
    run('playHudSound=()=>{}; updateReticleVisuals=()=>{}; processSpatialInteractions=()=>{}; magneticSnapping.enabled=false;');
    return {
        run, document, sockets, intervals,
        advance: ms => { now += ms; },
        setActive: el => { activeElement = el; },
        fire(name, event = {}) { for (const callback of handlers.get(name) || []) callback(event); },
        result(value) { assert.ok(resultsCallback); resultsCallback(value); },
        connect(mode = 'ABSOLUTE') {
            run(`desktopBridgeEnabled=true; bridgeSocket=new WebSocket('ws://test'); state.cameraActive=true; state.clutchLifted=false; state.pointingMode='${mode}';`);
            return sockets.at(-1);
        },
        drag() {
            run('updateSpatialCursor(.5,.6,true,.02,{x:.5,y:.5})');
            now += 50;
            run('updateSpatialCursor(.5,.6,true,.02,{x:.6,y:.5})');
            assert.equal(run('state.pinchState'), 'DRAGGING');
        }
    };
}

test('physical mouse click is not synthesized again after moving', () => {
    const h = harness(), button = h.document.getElementById('button');
    h.setActive(button);
    h.fire('mousedown', { button: 0, clientX: 500, clientY: 400 });
    h.advance(100); h.fire('mouseup'); button.click(); // Browser's own click.
    h.fire('mousemove', { clientX: 500, clientY: 400 });
    assert.equal(button.clicks, 1);
    assert.equal(h.run('state.pinchState'), 'IDLE');
});

test('physical simulation never feeds mouse movement back to Windows', () => {
    const h = harness(), socket = h.connect();
    h.run('state.cameraActive=false');
    h.fire('mousedown', { button: 0, clientX: 550, clientY: 400 });
    h.fire('mousemove', { clientX: 650, clientY: 450 });
    h.fire('mouseup');
    assert.equal(socket.messages.length, 0);
});

test('camera pinch still produces exactly one UI click', () => {
    const h = harness(), button = h.document.getElementById('button');
    h.setActive(button); h.run('state.cameraActive=true');
    h.run('updateSpatialCursor(.5,.6,true,.02)');
    h.advance(100); h.run('updateSpatialCursor(.5,.6,false,.1)');
    h.run('updateSpatialCursor(.5,.6,false,.1)');
    assert.equal(button.clicks, 1);
});

test('desktop click ignores local HUD buttons', () => {
    const h = harness(), socket = h.connect(), button = h.document.getElementById('button');
    h.setActive(button);
    h.run('updateSpatialCursor(.5,.6,true,.02)'); h.advance(100);
    h.run('updateSpatialCursor(.5,.6,false,.1)');
    assert.equal(button.clicks, 0);
    assert.equal(socket.messages.filter(m => m.type === 'click').length, 1);
});

test('drag releases immediately when hand results become empty', async () => {
    const h = harness(), socket = h.connect();
    await h.run('initMediaPipeHands()'); h.drag();
    h.result({ image: {}, multiHandLandmarks: [] });
    assert.equal(h.run('state.pinchState'), 'IDLE');
    assert.equal(socket.messages.filter(m => m.type === 'cancel').length, 1);
    assert.equal(socket.messages.filter(m => m.type === 'click').length, 0);
});

test('camera-off releases held drag and stops camera', async () => {
    const h = harness(), socket = h.connect();
    await h.run('initMediaPipeHands()'); h.drag();
    await h.run('toggleWebcamTracking()');
    assert.equal(h.run('state.cameraActive'), false);
    assert.equal(h.run('state.pinchState'), 'IDLE');
    assert.equal(h.run('cameraFeed.stops'), 1);
    assert.ok(socket.messages.some(m => m.type === 'cancel'));
});

test('stalled results cancel drag and keep a heartbeat alive', () => {
    const h = harness(), socket = h.connect(); h.drag();
    h.run('state.trackingHasHand=true; state.lastHandResultTime=performance.now()');
    h.advance(400); h.intervals.forEach(callback => callback());
    assert.equal(h.run('state.pinchState'), 'IDLE');
    assert.ok(socket.messages.some(m => m.type === 'cancel'));
    assert.equal(socket.messages.at(-1).type, 'heartbeat');
});

test('Hybrid buttons omit absolute coordinates and release never repositions', () => {
    const h = harness(), socket = h.connect('HYBRID_CLUTCH'); h.drag();
    const down = socket.messages.find(m => m.type === 'down');
    assert.equal(down.pointing_mode, 'HYBRID_CLUTCH');
    assert.equal(down.norm_x, undefined); assert.equal(down.norm_y, undefined);
    h.run('updateSpatialCursor(.5,.6,false,.1)');
    const up = socket.messages.find(m => m.type === 'up');
    assert.ok(up); assert.equal(up.norm_x, undefined);
});

test('pre-pinch brake actually reduces movement across both speed branches', () => {
    for (const normX of [.51, .55]) {
        const h = harness();
        h.run(`state.sensitivity=1;state.centerOffsetY=.5;state.cursorX=500;state.cursorY=400;updateSpatialCursor(${normX},.5,false,.029)`);
        const braked = h.run('state.cursorX');
        h.run(`state.cursorX=500;state.cursorY=400;updateSpatialCursor(${normX},.5,false,.1)`);
        assert.ok(braked < h.run('state.cursorX'));
        assert.ok(braked > 500);
    }
});

test('chat renders model and user HTML as literal text', () => {
    const h = harness(), payload = '<img src=x onerror="window.auditFlag=1">';
    h.run(`appendJarvisMessage('J.A.R.V.I.S.',${JSON.stringify(payload)})`);
    const row = h.document.getElementById('jarvis-chat-log').children[0];
    assert.equal(row.children[1].textContent, payload);
    assert.equal(row.innerHTML, undefined);
});

test('finger extension classification is invariant to camera distance', () => {
    const h = harness();
    h.run('globalThis.hand=Array.from({length:21},()=>({x:.5,y:.7}));hand[9]={x:.5,y:.6};hand[5]={x:.5,y:.61};hand[6]={x:.5,y:.55};hand[8]={x:.5,y:.5};');
    assert.equal(h.run('fingerExtended(hand,8,6,5)'), true);
    h.run('globalThis.small=hand.map(p=>({x:.5+(p.x-.5)*.25,y:.7+(p.y-.7)*.25}))');
    assert.equal(h.run('fingerExtended(small,8,6,5)'), true);
});

test('page shutdown cancels held input before closing socket', () => {
    const h = harness(), socket = h.connect(); h.drag(); h.fire('pagehide');
    assert.equal(socket.messages.at(-1).type, 'cancel');
    assert.equal(socket.readyState, 3);
});

test('bridge disconnect and mode switch discard gesture state', () => {
    const h = harness(); h.run('toggleDesktopBridge()');
    const socket = h.sockets.at(-1);
    h.run('state.pinchState="DRAGGING"'); socket.onclose();
    assert.equal(h.run('state.pinchState'), 'IDLE');
    h.connect(); h.drag(); h.run('togglePointingMode()');
    assert.equal(h.run('state.pinchState'), 'IDLE');
});

test('backpressure closes socket so the bridge can release input', () => {
    const h = harness(), socket = h.connect();
    socket.bufferedAmount = 100000;
    assert.equal(h.run('sendBridgeButton("down")'), false);
    assert.equal(socket.readyState, 3);
    assert.equal(socket.messages.length, 0);
});

test('manual HTML without launcher token does not use a public fallback', () => {
    const h = harness(); h.run('window.location.search=""; toggleDesktopBridge()');
    assert.equal(h.sockets.length, 0);
    assert.equal(h.run('desktopBridgeEnabled'), false);
});
