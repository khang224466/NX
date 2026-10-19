// @ts-nocheck
import { handleCounselorChatRequest } from '../../../src/services/counselorBackend';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
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
