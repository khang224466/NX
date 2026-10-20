// @ts-nocheck
import { handleDossierAnalysisRequest } from '../../../scripts/counselor_backend.mjs';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await handleDossierAnalysisRequest({
      body: req.body,
      headers: req.headers,
      env: process.env
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      error: err.message || 'Lỗi xử lý phân tích hồ sơ AI'
    });
  }
}
