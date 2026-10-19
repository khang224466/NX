// @ts-nocheck
import { handleCounselorChatRequest } from '../../src/services/counselorBackend';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      hasServerKey: Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY),
      provider: process.env.GEMINI_API_KEY ? 'gemini' : (process.env.GROQ_API_KEY ? 'groq' : 'none'),
      model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'none')
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await handleCounselorChatRequest({
      body: req.body,
      headers: req.headers,
      env: process.env
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      error: err.message || 'Lỗi xử lý yêu cầu hội thoại AI'
    });
  }
}
