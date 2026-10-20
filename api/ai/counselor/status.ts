// @ts-nocheck
import { handleCounselorStatusRequest } from '../../../scripts/counselor_backend.mjs';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const result = handleCounselorStatusRequest(process.env);
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      error: err.message || 'Lỗi kiểm tra trạng thái AI'
    });
  }
}
