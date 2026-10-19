import 'dotenv/config';

console.log('--- 1. Testing GET /api/ai/counselor/status ---');
const statusRes = await fetch('http://localhost:8443/api/ai/counselor/status');
const statusData = await statusRes.json();
console.log('Status code:', statusRes.status, statusData);

console.log('\n--- 2. Testing POST /api/ai/counselor/chat with user query ---');
const query = 'tôi chỉ thích chơi game, nói chuyện bạn bè, và đi dạo';
const start = Date.now();
const chatRes = await fetch('http://localhost:8443/api/ai/counselor/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: query,
    history: []
  })
});
const chatData = await chatRes.json();
console.log('Chat code:', chatRes.status, 'Time:', Date.now() - start, 'ms');
console.log('AI Reply:', chatData.replyText);
console.log('AI Model Used:', chatData.modelUsed);
console.log('Quick Replies:', chatData.quickReplies);
console.log('Detected Updates:', chatData.detectedUpdates);
