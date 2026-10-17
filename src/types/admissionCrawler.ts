export interface LiveDiemChuanEntry {
  nam: number;
  nganh: string;
  to_hop: string;
  diem: number;
  thang_diem?: string;
  ghi_chu?: string;
}

export interface LiveChangeRecord {
  thoi_gian: string;
  noi_dung: string;
  gia_tri_cu?: string;
  gia_tri_moi?: string;
  nguon_url: string;
}

export interface LiveAdmissionRecord {
  id: string;
  truong: string;
  ma_truong: string;
  loai_truong: string; // 'Đại học Quốc gia' | 'Đại học Công lập tự chủ' | 'Đại học Công lập' | 'Đại học Tư thục' | 'Trường Sư phạm' | 'Trường Y Dược'
  khu_vuc: 'Bắc' | 'Trung' | 'Nam' | 'ĐBSCL';
  nam: number;
  chi_tieu: number;
  chi_tieu_nam_truoc?: number;
  diem_chuan: LiveDiemChuanEntry[];
  phuong_thuc_xet_tuyen: string[];
  hoc_phi: string;
  dieu_kien: string;
  lich_tuyen_sinh: string;
  nguon: string[];
  cap_nhat_luc: string;
  trang_thai: 'chinh_thuc' | 'du_kien' | 'can_kiem_tra';
  canh_bao_thay_doi?: string;
  lich_su_thay_doi?: LiveChangeRecord[];
  is_newly_updated?: boolean;
}
