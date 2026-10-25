/**
 * Provisional internal RIASEC profiles for broad study sectors.
 * These are not O*NET occupational norms and have not been validated against
 * Vietnamese students or incumbent workers. Keep that limitation visible in UI.
 * Order: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.
 */
export type RiasecVector = readonly [number, number, number, number, number, number];

export const SECTOR_RIASEC_VECTORS: Record<string, RiasecVector> = {
  CNTT_BAN_DAN_AI: [35, 48, 25, 20, 30, 42],
  KY_THUAT_CONG_NGHE: [48, 45, 20, 18, 25, 38],
  KINH_TE_QUAN_TRI: [18, 35, 25, 38, 48, 45],
  Y_DUOC_SUC_KHOE: [30, 48, 18, 46, 22, 36],
  SU_PHAM_GIAO_DUC: [18, 40, 32, 50, 32, 30],
  LUAT_HANH_CHINH: [15, 42, 25, 40, 46, 45],
  XA_HOI_NHAN_VAN: [15, 42, 45, 45, 30, 25],
  KIEN_TRUC_NGHE_THUAT_TDTT: [38, 30, 50, 25, 28, 20],
  NONG_LAM_NGU_SINH_HOC: [48, 42, 20, 25, 22, 30],
  CONG_AN_QUAN_DOI: [46, 36, 15, 35, 42, 45]
};

export const SECTOR_RIASEC_PROFILE_NOTE =
  'Hồ sơ mục tiêu theo lĩnh vực do NEXORA biên tập; chưa được chuẩn hóa bằng mẫu người lao động Việt Nam.';
