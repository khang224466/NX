/**
 * VN_DAI_HOC_2026_AUDITED_ADMISSIONS_ENGINE - 9 CHUẨN BẢNG DỮ LIỆU KIỂM TOÁN
 * Bao phủ 300 trường đại học, 2.184+ ngành x phương thức, 36 họ công thức, 39 quy tắc quy đổi.
 * Nguồn: Cổng TTĐT Chính phủ, Bộ GD&ĐT (Thông tư 06/2026/TT-BGDĐT, TT 74/2026/TT-BGDĐT),
 * Bộ Công an, Bộ Quốc phòng và Tuyensinh247.com.
 */

// -----------------------------------------------------------------------------
// 1. institutions (02_Institution_Registry)
// -----------------------------------------------------------------------------
export type InstitutionStatus = 
  | 'ACTIVE_INDEPENDENT' 
  | 'BRANCH_CAMPUS' 
  | 'MERGED_HISTORICAL' 
  | 'MERGED_RESTRUCTURED'
  | 'DUPLICATE_CODE' 
  | 'DUPLICATE_BRANCH_ROW'
  | 'RENAMED_2025'
  | 'RENAMED_HISTORICAL';

export type SectorGroup = 
  | 'KINH_TE_QUAN_TRI'
  | 'CNTT_BAN_DAN_AI'
  | 'KY_THUAT_CONG_NGHE'
  | 'Y_DUOC_SUC_KHOE'
  | 'SU_PHAM_GIAO_DUC'
  | 'LUAT_HANH_CHINH'
  | 'NGON_NGU_QUOC_TE'
  | 'CONG_AN_QUAN_DOI'
  | 'KIEN_TRUC_NGHE_THUAT_TDTT';

export type VerificationStatusType = 
  | 'VERIFIED_OFFICIAL'
  | 'OFFICIAL_VERIFIED'
  | 'VERIFIED_SECONDARY_TUYENSINH247'
  | 'UNVERIFIED_FLAT_CUTOFF_PLACEHOLDER'
  | 'FORMULA_VERIFIED_CUTOFF_FLAT_PLACEHOLDER'
  | 'FLAGGED_BELOW_MOET_FLOOR'
  | 'FLAGGED_DUPLICATE_CODE'
  | 'FLAGGED_DUPLICATE_BRANCH_ROW'
  | 'FLAGGED_MERGED_HISTORICAL'
  | 'FLAGGED_NEEDS_AUDIT'
  | 'MERGED_HISTORICAL';

export interface Institution {
  institution_code: string; // PK
  code: string; // Compatible alias for institution_code
  official_name: string;
  parent_code?: string; // FK
  institution_status: InstitutionStatus;
  verified_province_city: string;
  detailed_address_and_history: string;
  primary_sector: SectorGroup;
  official_scheme_or_cutoff_url: string;
  verification_status: VerificationStatusType;
  redirect_target_code?: string; // Dùng cho trường đã sáp nhập (DNV -> HCH, LBS -> LBH)
}

// -----------------------------------------------------------------------------
// 2. programs (03_Major_Program_Registry)
// -----------------------------------------------------------------------------
export interface MajorProgram {
  program_id: string; // PK: e.g. 'BKA_IT1', 'KHA_KT'
  institution_code: string; // FK
  audited_major_name: string;
  original_major_string: string;
  major_code_tt74?: string; // Mã 6 số TT 74/2026
  sector_group: SectorGroup;
  program_type: 'CHUAN' | 'TIEN_TIEN' | 'CHAT_LUONG_CAO' | 'QUOC_TE' | 'LIEN_KET';
  is_bundled_multi_major: boolean;
  verification_status: VerificationStatusType;
}

// -----------------------------------------------------------------------------
// 3. admission_methods (04_Method_Registry)
// -----------------------------------------------------------------------------
export interface AdmissionMethod {
  method_id: string; // PK: e.g. 'PT100_THPT', 'PT200_HB', 'PT402_DGNL', 'PT301_XTTN'
  category: 'THI_THPT' | 'HOC_BA' | 'DGNL_DGTD' | 'XET_KET_HOP' | 'XET_TUYEN_THANG';
  method_name: string;
  inputs_required: string[]; // e.g. ['MATH', 'PHYSICS', 'CHEMISTRY'], ['IELTS', 'MATH']
  native_scale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10';
  default_formula_id: string; // FK
  prerequisites?: string;
  legal_source_url: string;
}

// -----------------------------------------------------------------------------
// 4. formulas (06_Formula_Library) - 36 Họ công thức chuẩn
// -----------------------------------------------------------------------------
export interface FormulaDefinition {
  formula_id: string; // PK: 'F01_THPT_111_30' -> 'F36_YDS_CCNN_30'
  formula_family: string;
  formula_name: string;
  method_id: string;
  formula_math: string;
  excel_expression_template: string;
  input_variables: string[];
  input_scales: string[];
  subject_coefficients: Record<string, number>;
  priority_rules: string;
  final_official_scale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10';
  normalized_100_method: string;
  worked_example: string;
}

// -----------------------------------------------------------------------------
// 5. score_conversions (09_Score_Conversions) - 39 quy tắc quy đổi
// -----------------------------------------------------------------------------
export interface ScoreConversionRule {
  conv_id: string; // PK: 'CONV_KHA_IELTS', 'CONV_NTH_IELTS', etc.
  institution_code: string; // FK: 'KHA', 'NTH', 'BKA', 'ALL'
  applicable_scope: string;
  conversion_category: 'IELTS_TO_SUBJECT' | 'IELTS_TO_BONUS' | 'DGNL_TO_30' | 'TSA_TO_100' | 'SAT_TO_30' | 'TESTAS_TO_100';
  certificate_or_test: 'IELTS' | 'TOEFL_IBT' | 'HSK' | 'SAT' | 'ACT' | 'HSA' | 'V_ACT' | 'TSA' | 'TESTAS' | 'BTBCA' | 'VSAT';
  raw_score_range: string;
  target_scale: number; // 10, 30, 100
  converted_score: number;
  conditions?: string;
  source_url: string;
}

// -----------------------------------------------------------------------------
// 6. normalizations (10_Score_Normalization)
// -----------------------------------------------------------------------------
export interface NormalizationRule {
  norm_id: string; // PK
  source_scale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10';
  source_max: number;
  destination_scale: 'THANG_100';
  formula_math: string;
  legal_classification: string;
  limitations: string;
}

// -----------------------------------------------------------------------------
// 7. eligibility_rules (12_Eligibility_TieBreakers)
// -----------------------------------------------------------------------------
export interface EligibilityRule {
  rule_id: string; // PK
  scope: 'NATIONAL_MOET' | 'INSTITUTION' | 'PROGRAM_GROUP';
  rule_title: string;
  target_programs: string;
  prerequisite_condition: string;
  tie_breaker_rule: string;
  source_url: string;
}

// -----------------------------------------------------------------------------
// 8. sources (14_Source_Register)
// -----------------------------------------------------------------------------
export interface SourceRegistryItem {
  source_id: string; // PK
  tier: 'TIER_1_GOVERNMENT' | 'TIER_2_OFFICIAL_UNIVERSITY' | 'TIER_3_SECONDARY_AUDITED';
  issuing_organization: string;
  document_title: string;
  direct_url: string;
  publication_date: string;
  exact_evidence_supported: string;
  verification_status: VerificationStatusType;
}

// -----------------------------------------------------------------------------
// 9. major_method_scoring (05_Major_Method_Scoring_DB)
// -----------------------------------------------------------------------------
export interface MajorMethodScoringRecord {
  record_id: string; // PK
  institution_code: string; // FK
  program_id: string; // FK
  method_id: string; // FK
  formula_id: string; // FK
  campus_location: string;
  audited_major_name: string;
  admissions_year: number; // 2026
  subject_combinations: string[];
  formula_expression: string;
  audited_official_scale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10';
  scale_max: number;
  audited_official_cutoff: number;
  analytical_normalized_100: number; // Điểm quy đổi 0-100 để so sánh tham chiếu
  moet_quality_floor_30: number | null; // Sàn Bộ GD&ĐT (22.5, 21.0, 19.0, 15.0)
  bonus_and_priority_rule: string;
  eligibility_and_tie_breaker: string;
  source_url: string;
  verification_status: VerificationStatusType;
}

// =============================================================================
// SEED DATA: 36 HỌ CÔNG THỨC CHUẨN (06_Formula_Library)
// =============================================================================
export const AUDITED_FORMULAS_LIBRARY: FormulaDefinition[] = [
  {
    formula_id: 'F01_THPT_111_30',
    formula_family: 'THPT_STANDARD_30',
    formula_name: 'Chuẩn 3 Môn Tốt Nghiệp THPT (1:1:1)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = M1 + M2 + M3 + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=SUM(M1, M2, M3) + MIN(3.0, Bonus) + Priority_Eff',
    input_variables: ['M1', 'M2', 'M3', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { M1: 1, M2: 1, M3: 1 },
    priority_rules: 'Giảm dần từ 22.5: ((30 - S) / 7.5) * P_gốc',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.0, Lý 8.0, Hóa 8.0, KV1 (0.75) -> S=24.0 -> P_eff=((30-24)/7.5)*0.75 = 0.60 -> DXT = 24.60'
  },
  {
    formula_id: 'F02_THPT_W2_30',
    formula_family: 'THPT_WEIGHTED_30',
    formula_name: 'Môn Chính Nhân Đôi Quy Thang 30 (Nhân 3/4)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(M_Chính * 2 + M2 + M3) * 3/4] + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=(MC*2 + M2 + M3)*3/4 + Bonus_Eff + Priority_Eff',
    input_variables: ['MC', 'M2', 'M3', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { MC: 2, M2: 1, M3: 1 },
    priority_rules: 'Giảm dần từ 22.5 trên điểm sau khi đã nhân 3/4',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán(MC) 9.0, Lý 8.0, Hóa 8.0 -> Raw=(18+8+8)*0.75 = 25.5 -> P_eff=((30-25.5)/7.5)*0.75 = 0.45 -> DXT = 25.95'
  },
  {
    formula_id: 'F03_BKA_K01_30',
    formula_family: 'BKA_CUSTOM_K01_30',
    formula_name: 'Tổ Hợp K01 ĐH Bách Khoa Hà Nội (Toán x3, Văn x1, KHTN x2)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(Toán * 3 + Văn * 1 + KHTN * 2) * 1/2] + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=(Toan*3 + Van*1 + KHTN*2)*0.5 + Bonus_Eff + Priority_Eff',
    input_variables: ['Toan', 'Van', 'KHTN', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { Toan: 3, Van: 1, KHTN: 2 },
    priority_rules: 'Giảm dần từ 22.5 trên điểm quy đổi thang 30',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 9.0, Văn 8.0, Lý 8.5 -> Raw=(27 + 8 + 17)*0.5 = 26.0 -> P_eff=((30-26)/7.5)*0.5 = 0.267 -> DXT = 26.27'
  },
  {
    formula_id: 'F04_FTU_NN_30',
    formula_family: 'FTU_CUSTOM_LANG_30',
    formula_name: 'ĐH Ngoại Thương - Ngôn Ngữ Thương Mại Quy Thang 30',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(Toán * 1 + Văn * 1.5 + Ngoại ngữ * 1.5) * 3/4] + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=(Toan*1 + Van*1.5 + NN*1.5)*0.75 + Bonus_Eff + Priority_Eff',
    input_variables: ['Toan', 'Van', 'NN', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { Toan: 1, Van: 1.5, NN: 1.5 },
    priority_rules: 'Giảm dần từ 22.5: ((30 - S) / 7.5) * P_gốc',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.0, Văn 8.0, Anh 9.0 -> Raw=(8 + 12 + 13.5)*0.75 = 25.125 -> DXT = 25.125 + P_eff'
  },
  {
    formula_id: 'F05_THPT_W2_40',
    formula_family: 'THPT_SCALE_40',
    formula_name: 'Thang Điểm 40 - Môn Chính Nhân 2 (NHF, HBT, CMC, MTH)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT (Thang 40) = (M_Chính * 2 + M2 + M3) + Bonus_40_Eff + Priority_40_Eff',
    excel_expression_template: '=(MC*2 + M2 + M3) + Bonus_Eff + IF(S<30, P*4/3, ((40-S)/10)*P*4/3)',
    input_variables: ['MC', 'M2', 'M3', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '4', '2.75'],
    subject_coefficients: { MC: 2, M2: 1, M3: 1 },
    priority_rules: 'Giảm dần từ 30.0/40: P_40_eff = ((40 - S)/10) * (P_30 * 4/3)',
    final_official_scale: 'THANG_40',
    normalized_100_method: '(DXT / 40) * 100',
    worked_example: 'MC=9.0, M2=8.0, M3=8.0 -> S=34.0/40 -> P_30=0.75 -> P_40_eff = ((40-34)/10)*(0.75*4/3) = 0.60 -> DXT = 34.60'
  },
  {
    formula_id: 'F06_FTU_NN_40',
    formula_family: 'FTU_SCALE_40',
    formula_name: 'ĐH Ngoại Thương - Thang 40 Nguyên Bản Ngôn Ngữ',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = (Toán * 1 + Văn * 1.5 + Ngoại ngữ * 1.5) + Priority_40_Eff',
    excel_expression_template: '=(Toan*1 + Van*1.5 + NN*1.5) + Priority_40_Eff',
    input_variables: ['Toan', 'Van', 'NN', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { Toan: 1, Van: 1.5, NN: 1.5 },
    priority_rules: 'Ngưỡng giảm 30.0/40',
    final_official_scale: 'THANG_40',
    normalized_100_method: '(DXT / 40) * 100',
    worked_example: 'Toán 8.0, Văn 8.0, NN 9.0 -> Raw=33.5 -> P_eff=((40-33.5)/10)*P_40'
  },
  {
    formula_id: 'F07_QSB_TH_100',
    formula_family: 'VNUHCM_COMPREHENSIVE_100',
    formula_name: 'ĐH Bách Khoa TP.HCM (QSB) - Xét Tổng Hợp Thang 100 (70-20-10)',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.70 * [ĐGNL(Toán x 2) / 15] + 0.20 * [THPT(Toán x 2)/4 * 10] + 0.10 * [HB(Toán x 2) * 10] + Bonus_100 + Priority_100',
    excel_expression_template: '=0.7*(DGNL/15) + 0.2*(THPT/4*10) + 0.1*(HB*10) + Bonus + Priority_100',
    input_variables: ['DGNL', 'THPT_W2', 'HB_W2', 'Bonus', 'Priority'],
    input_scales: ['1500', '40', '10', '10', '2.75'],
    subject_coefficients: { DGNL: 0.70, THPT: 0.20, HB: 0.10 },
    priority_rules: 'Giảm dần từ 75.0/100: P_100 = S<75 ? (P_30/3)*10 : ((100-S)/25)*(P_30/3)*10',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT (Đã là thang 100)',
    worked_example: 'ĐGNL=900 (quy 60.0), THPT=32/40 (quy 80.0), HB=8.5 (quy 85.0) -> Raw=0.7*60 + 0.2*80 + 0.1*85 = 42 + 16 + 8.5 = 66.50'
  },
  {
    formula_id: 'F08_QSC_TH_100',
    formula_family: 'VNUHCM_COMPREHENSIVE_100',
    formula_name: 'ĐH CNTT - ĐHQG TP.HCM (QSC) - Xét Tổng Hợp (47.5 - 47.5 - 5)',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.475 * THPT_100 + 0.475 * DGNL_100 + 0.05 * HB_100 + Bonus_100 + Priority_100',
    excel_expression_template: '=0.475*(THPT/30*100) + 0.475*(DGNL/1200*100) + 0.05*(HB*10) + Bonus + Priority_100',
    input_variables: ['THPT_30', 'DGNL_1200', 'HB_10', 'Bonus', 'Priority'],
    input_scales: ['30', '1200', '10', '10', '2.75'],
    subject_coefficients: { THPT: 0.475, DGNL: 0.475, HB: 0.05 },
    priority_rules: 'Giảm dần từ 75.0/100',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'THPT=27.0 (90.0đ), DGNL=960 (80.0đ), HB=9.0 (90.0đ) -> Raw=0.475*90 + 0.475*80 + 0.05*90 = 42.75 + 38.0 + 4.5 = 85.25'
  },
  {
    formula_id: 'F09_QSK_TH_100',
    formula_family: 'VNUHCM_COMPREHENSIVE_100',
    formula_name: 'ĐH Kinh Tế - Luật (QSK) - Xét Tổng Hợp (55 - 35 - 10)',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.55 * DGNL_100 + 0.35 * THPT_100 + 0.10 * HB_100 + Bonus_100 + Priority_100',
    excel_expression_template: '=0.55*DGNL_100 + 0.35*THPT_100 + 0.10*HB_100 + Bonus + Priority_100',
    input_variables: ['DGNL_100', 'THPT_100', 'HB_100', 'Bonus', 'Priority'],
    input_scales: ['100', '100', '100', '10', '2.75'],
    subject_coefficients: { DGNL: 0.55, THPT: 0.35, HB: 0.10 },
    priority_rules: 'Giảm dần từ 75.0/100',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'DGNL=80.0, THPT=85.0, HB=80.0 -> Raw=44.0 + 29.75 + 8.0 = 81.75'
  },
  {
    formula_id: 'F10_QSY_TH_100',
    formula_family: 'VNUHCM_COMPREHENSIVE_100',
    formula_name: 'Khoa Sức Khỏe - ĐHQG TP.HCM (QSY) - Xét Tổng Hợp (40 - 35 - 25)',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.40 * DGNL_100 + 0.35 * THPT_100 + 0.25 * HB_100 + Bonus_100 + Priority_100',
    excel_expression_template: '=0.4*DGNL_100 + 0.35*THPT_100 + 0.25*HB_100 + Bonus + Priority_100',
    input_variables: ['DGNL_100', 'THPT_100', 'HB_100', 'Bonus', 'Priority'],
    input_scales: ['100', '100', '100', '10', '2.75'],
    subject_coefficients: { DGNL: 0.40, THPT: 0.35, HB: 0.25 },
    priority_rules: 'Giảm dần từ 75.0/100',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'DGNL=80.0, THPT=85.0, HB=90.0 -> Raw=32 + 29.75 + 22.5 = 84.25'
  },
  {
    formula_id: 'F11_UEH_TH_100',
    formula_family: 'UEH_COMPREHENSIVE_100',
    formula_name: 'ĐH Kinh Tế TP.HCM (KSA, KSV) - Xét Tuyển Tổng Hợp Thang 100',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.60 * [((M1*2 + M2 + M3)/4) * 10] + 0.40 * [((TB10*1 + TB11*2 + TB12*3)/6) * 10] + Bonus_100 + Priority_100',
    excel_expression_template: '=0.6*(((M1*2+M2+M3)/4)*10) + 0.4*(((TB10+TB11*2+TB12*3)/6)*10) + Bonus + Priority_100',
    input_variables: ['M1', 'M2', 'M3', 'TB10', 'TB11', 'TB12', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '10', '10', '10', '10', '2.75'],
    subject_coefficients: { THPT: 0.60, HB_3Y: 0.40 },
    priority_rules: 'Giảm dần từ 75.0/100',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'M1(Toán)=9.0, M2=8.0, M3=8.0 (THPT_W=8.5*10=85); TB10=8.0, TB11=8.5, TB12=9.0 (HB_W=8.667*10=86.67) -> Raw=0.6*85 + 0.4*86.67 = 51 + 34.67 = 85.67'
  },
  {
    formula_id: 'F12_UTH_COMB_1200',
    formula_family: 'UTH_SCALE_1200',
    formula_name: 'ĐH Giao Thông Vận Tải TPHCM (UTH120) - Thang 1200',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = 0.4 * Max(k1*DGNL, k2*HB12_1200, k3*THPT_1200) + 0.3 * HB12_1200 + 0.3 * THPT_1200 + Priority_1200',
    excel_expression_template: '=0.4*MAX(DGNL, HB12_1200, THPT_1200) + 0.3*HB12_1200 + 0.3*THPT_1200 + Priority_1200',
    input_variables: ['DGNL', 'HB12', 'M1', 'M2', 'M3', 'Priority'],
    input_scales: ['1200', '10', '10', '10', '10', '2.75'],
    subject_coefficients: { COMP1: 0.40, COMP2: 0.30, COMP3: 0.30 },
    priority_rules: 'Priority_1200 = Priority_30 * (1200/30) = Priority_30 * 40 (giảm dần từ 900/1200)',
    final_official_scale: 'THANG_1200',
    normalized_100_method: '(DXT / 1200) * 100',
    worked_example: 'THPT_1200 = (9 + 8 + 8 + 9)*30 = 34*30 = 1020; HB12_1200 = 8.5*120 = 1020; DGNL = 950. Max = 1020 -> Raw=0.4*1020 + 0.3*1020 + 0.3*1020 = 1020.00'
  },
  {
    formula_id: 'F13_BCA_PT3_30',
    formula_family: 'BCA_POLICE_30',
    formula_name: 'Khối Công An Nhân Dân - PT3 (40% THPT + 60% Bài Thi Bộ Công An Thang 100)',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = (M1 + M2 + M3) * 0.40 + BTBCA_100 * 0.18 + Priority_30_Eff + Bonus_30_Eff',
    excel_expression_template: '=(M1 + M2 + M3)*0.4 + BTBCA*0.18 + Priority_Eff + Bonus_Eff',
    input_variables: ['M1', 'M2', 'M3', 'BTBCA', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '100', '3', '2.75'],
    subject_coefficients: { THPT: 0.40, BTBCA: 0.18 },
    priority_rules: 'Giảm dần từ 22.50: ((30 - S) / 7.5) * P_CAND',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'THPT: Toán 8.0, Văn 8.0, Sử 8.0 (Tổng 24.0 -> *0.4 = 9.60). BTBCA: 75.0/100 -> *0.18 = 13.50. Raw = 9.60 + 13.50 = 23.10. P_eff = ((30-23.1)/7.5)*0.75 = 0.69 -> DXT = 23.79'
  },
  {
    formula_id: 'F14_MIL_111_30',
    formula_family: 'MILITARY_STANDARD_30',
    formula_name: 'Khối Trường Sĩ Quan Quân Đội - Chuẩn 3 Môn (KQH, YQH, HEH, BPH)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = M1 + M2 + M3 + Priority_30_Eff',
    excel_expression_template: '=M1 + M2 + M3 + Priority_Eff',
    input_variables: ['M1', 'M2', 'M3', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { M1: 1, M2: 1, M3: 1 },
    priority_rules: 'Theo quy chế tuyển sinh Quân sự Bộ Quốc phòng',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.5, Lý 8.5, Hóa 8.5 -> Tổng 25.5 -> P_eff=((30-25.5)/7.5)*0.75 = 0.45 -> DXT = 25.95'
  },
  {
    formula_id: 'F15_MIL_W2_30',
    formula_family: 'MILITARY_WEIGHTED_30',
    formula_name: 'HV Khoa Học Quân Sự (NQH) - Ngoại Ngữ x2 Quy Thang 30',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(Toán + Văn + Ngoại ngữ * 2) * 3/4] + Priority_30_Eff',
    excel_expression_template: '=(Toan + Van + NN*2)*0.75 + Priority_Eff',
    input_variables: ['Toan', 'Van', 'NN', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { Toan: 1, Van: 1, NN: 2 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.0, Văn 8.0, Anh 9.0 -> Raw=(8+8+18)*0.75 = 25.5 -> DXT = 25.5 + P_eff'
  },
  {
    formula_id: 'F16_MED_111_30',
    formula_family: 'HEALTHCARE_FLOOR_30',
    formula_name: 'Khối Sức Khỏe Chuẩn 30 (Kèm Kiểm Tra Điểm Sàn Bộ GD&ĐT)',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = Toán + Hóa + Sinh + Priority_30_Eff',
    excel_expression_template: '=Toan + Hoa + Sinh + Priority_Eff',
    input_variables: ['Toan', 'Hoa', 'Sinh', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { Toan: 1, Hoa: 1, Sinh: 1 },
    priority_rules: 'Kiểm tra sàn: Y/RHM >= 22.5; Dược/YHCT >= 21.0; Điều dưỡng >= 19.0',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 9.0, Hóa 8.5, Sinh 9.0 -> Raw=26.5 -> Đạt sàn Y khoa (22.5) -> DXT = 26.5 + P_eff'
  },
  {
    formula_id: 'F17_VGU_TESTAS_100',
    formula_family: 'VGU_INTERNATIONAL_100',
    formula_name: 'ĐH Việt Đức (VGU) - PT1 Bài Thi TestAS (Đức)',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = 0.40 * Core_Test + 0.60 * Subject_Module + Priority_100_Eff',
    excel_expression_template: '=0.4*Core + 0.6*Subject + Priority_100',
    input_variables: ['Core', 'Subject', 'Priority'],
    input_scales: ['130', '130', '2.75'],
    subject_coefficients: { Core: 0.4, Subject: 0.6 },
    priority_rules: 'Quy về thang 100 trước khi cộng ưu tiên',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'Core 110 (84.6%), Subject 115 (88.5%) -> DXT = 0.4*84.6 + 0.6*88.5 = 86.94'
  },
  {
    formula_id: 'F18_VGU_HB_10',
    formula_family: 'VGU_TRANSCRIPT_10',
    formula_name: 'ĐH Việt Đức (VGU) - PT2 Học Bạ 5 Học Kỳ (Thang Điểm 10)',
    method_id: 'PT200_HB',
    formula_math: 'ĐXT (Thang 10) = (M1 + M2 + M3) / 3 + Priority_10_Eff',
    excel_expression_template: '=(M1 + M2 + M3)/3 + Priority_10',
    input_variables: ['M1', 'M2', 'M3', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { M1: 1, M2: 1, M3: 1 },
    priority_rules: 'Priority_10 = Priority_30 / 3 (Giảm dần từ 7.5/10: ((10-S)/2.5)*P_10)',
    final_official_scale: 'THANG_10',
    normalized_100_method: 'DXT * 10',
    worked_example: 'M1=8.5, M2=9.0, M3=8.0 -> TBC = 8.50/10 -> P_10_eff = ((10-8.5)/2.5)*(0.75/3) = 0.6*0.25 = 0.15 -> DXT = 8.65/10'
  },
  {
    formula_id: 'F19_NEU_CCNN_THPT_30',
    formula_family: 'COMBINED_LANGUAGE_30',
    formula_name: 'ĐH Kinh Tế Quốc Dân (KHA) - Quy Đổi CCNN Kết Hợp 2 Môn THPT',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = Toán + Môn2 + CCNN_QuyDoi_10 + Priority_30_Eff',
    excel_expression_template: '=Toan + Mon2 + VLOOKUP(IELTS, KHA_Table, 2, FALSE) + Priority_Eff',
    input_variables: ['Toan', 'Mon2', 'IELTS', 'Priority'],
    input_scales: ['10', '10', '9.0', '2.75'],
    subject_coefficients: { Toan: 1, Mon2: 1, CCNN: 1 },
    priority_rules: 'Khóa điểm cộng CCNN (bonus_ccnn=0) để tránh trùng lặp',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 9.0, Hóa 8.5, IELTS 7.5 (KHA quy 10.0) -> S = 9.0 + 8.5 + 10.0 = 27.50 -> DXT = 27.50 + P_eff'
  },
  {
    formula_id: 'F20_NEU_CCNN_DGNL_30',
    formula_family: 'COMBINED_DGNL_LANG_30',
    formula_name: 'ĐH Kinh Tế Quốc Dân - Kết Hợp HSA/TSA Với Chứng Chỉ Ngoại Ngữ',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = (DGNL_QuyDoi_30 * 2/3) + CCNN_QuyDoi_10 + Priority_30_Eff',
    excel_expression_template: '=(DGNL_QuyDoi * 2/3) + IELTS_QuyDoi + Priority_Eff',
    input_variables: ['DGNL_Raw', 'IELTS', 'Priority'],
    input_scales: ['150', '9.0', '2.75'],
    subject_coefficients: { DGNL: 2/3, CCNN: 1 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'HSA 110 (quy 22.0 -> *2/3 = 14.67), IELTS 7.0 (quy 9.5) -> Raw = 14.67 + 9.5 = 24.17'
  },
  {
    formula_id: 'F21_SPS_SPT_HB_30',
    formula_family: 'PEDAGOGY_SPECIALIZED_30',
    formula_name: 'ĐH Sư Phạm TP.HCM (SPS) - ĐGNL Chuyên Biệt Kết Hợp Học Bạ',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = (0.50 * SPT_MC + 0.35 * HB_M2 + 0.15 * HB_M3) * 3 + Priority_30_Eff',
    excel_expression_template: '=(0.5*SPT + 0.35*HB2 + 0.15*HB3)*3 + Priority_Eff',
    input_variables: ['SPT_MC', 'HB_M2', 'HB_M3', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { SPT: 1.5, HB2: 1.05, HB3: 0.45 },
    priority_rules: 'Ràng buộc ngành Sư phạm NV1-NV5 và học lực lớp 12 Giỏi',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'SPT Toán 8.5, HB Lý 8.0, HB Hóa 8.0 -> TBC=(0.5*8.5 + 0.35*8.0 + 0.15*8.0)=8.25 -> *3 = 24.75'
  },
  {
    formula_id: 'F22_SPH_SPT_W2_30',
    formula_family: 'PEDAGOGY_SPECIALIZED_30',
    formula_name: 'ĐH Sư Phạm Hà Nội (SPH) - 2 Môn SPT (Môn Chính x2 Nhân 3/4)',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = [(SPT_MC * 2 + M2) * 3/4] + Priority_30_Eff',
    excel_expression_template: '=(SPT_MC*2 + M2)*0.75 + Priority_Eff',
    input_variables: ['SPT_MC', 'M2', 'Priority'],
    input_scales: ['10', '10', '2.75'],
    subject_coefficients: { SPT_MC: 2, M2: 1 },
    priority_rules: 'Ràng buộc NV1-NV5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'SPT Văn 8.5, Sử 8.0 -> Raw=(17 + 8)*0.75 = 18.75 (quy chuẩn thang 30)'
  },
  {
    formula_id: 'F23_ARCH_DRAW_30',
    formula_family: 'ARCHITECTURE_ARTS_30',
    formula_name: 'Khối Kiến Trúc / Mỹ Thuật (V00, H00) - Vẽ Mỹ Thuật x2 Quy 30',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(M_VH1 + M_VH2 + Ve_MyThuat * 2) * 3/4] + Priority_30_Eff',
    excel_expression_template: '=(VH1 + VH2 + Ve*2)*0.75 + Priority_Eff',
    input_variables: ['VH1', 'VH2', 'Ve', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { VH1: 1, VH2: 1, Ve: 2 },
    priority_rules: 'Vẽ >= 5.0 (không đạt sẽ bị loại trực tiếp)',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.0, Lý 7.5, Vẽ 8.5 -> Raw = (8.0 + 7.5 + 17.0)*0.75 = 24.375'
  },
  {
    formula_id: 'F24_ART_PERF_30',
    formula_family: 'ARCHITECTURE_ARTS_30',
    formula_name: 'Khối Âm Nhạc / Sân Khấu Điện Ảnh (N00, S00) - Văn Hóa + 2 Năng Khiếu',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = Ngữ_Văn + Năng_Khiếu_1 + Năng_Khiếu_2 + Priority_30_Eff',
    excel_expression_template: '=Van + NK1 + NK2 + Priority_Eff',
    input_variables: ['Van', 'NK1', 'NK2', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { Van: 1, NK1: 1, NK2: 1 },
    priority_rules: 'NK1 & NK2 >= 5.0',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Văn 7.0, Thanh nhạc 8.5, Nhạc cảm 8.0 -> DXT = 23.50 + P_eff'
  },
  {
    formula_id: 'F25_BKA_TSA_100',
    formula_family: 'BKA_TSA_100',
    formula_name: 'ĐH Bách Khoa Hà Nội (BKA) - Đánh Giá Tư Duy TSA Thang 100',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = Điểm_TSA_100 + Priority_100_Eff + Bonus_100_Eff',
    excel_expression_template: '=TSA + Bonus_Eff + IF(S<75, P_30/3*10, ((100-S)/25)*P_30/3*10)',
    input_variables: ['TSA', 'Bonus', 'Priority'],
    input_scales: ['100', '10', '2.75'],
    subject_coefficients: { TSA: 1 },
    priority_rules: 'Giảm dần từ 75.0/100',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'TSA = 78.50/100, P_30 = 0.75 -> P_100_eff = ((100-78.5)/25)*(0.75/3*10) = 0.86*2.5 = 2.15 -> DXT = 80.65'
  },
  {
    formula_id: 'F26_VNU_HSA_30',
    formula_family: 'VNU_HSA_30',
    formula_name: 'ĐHQG Hà Nội - Đánh Giá Năng Lực HSA Quy Về Thang 30',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = (Điểm_HSA_150 / 150) * 30 + Priority_30_Eff',
    excel_expression_template: '=(HSA / 150)*30 + Priority_Eff',
    input_variables: ['HSA', 'Priority'],
    input_scales: ['150', '2.75'],
    subject_coefficients: { HSA: 0.2 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'HSA 120/150 -> Raw = 24.0 -> P_eff=((30-24)/7.5)*0.75 = 0.60 -> DXT = 24.60'
  },
  {
    formula_id: 'F27_BKA_XTTN_100',
    formula_family: 'BKA_TALENT_100',
    formula_name: 'ĐH Bách Khoa Hà Nội - Xét Tuyển Tài Năng XTTN 1.3 (Thang 100)',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = Điểm_Hồ_Sơ_Năng_Lực_100 + Priority_100_Eff',
    excel_expression_template: '=HoSo_100 + Priority_100_Eff',
    input_variables: ['HoSo', 'Priority'],
    input_scales: ['100', '2.75'],
    subject_coefficients: { HoSo: 1 },
    priority_rules: 'Giảm dần từ 75.0',
    final_official_scale: 'THANG_100',
    normalized_100_method: 'DXT',
    worked_example: 'Hồ sơ đạt 85.0 -> P_eff=((100-85)/25)*2.5 = 1.50 -> DXT = 86.50'
  },
  {
    formula_id: 'F28_HB_6HK_30',
    formula_family: 'TRANSCRIPT_6HK_30',
    formula_name: 'Học Bạ THPT 6 Học Kỳ Chuẩn 3 Môn (Theo TT 06/2026/TT-BGDĐT)',
    method_id: 'PT200_HB',
    formula_math: 'ĐXT = TBC_6HK_M1 + TBC_6HK_M2 + TBC_6HK_M3 + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=SUM(TBC1, TBC2, TBC3) + Bonus_Eff + Priority_Eff',
    input_variables: ['TBC1', 'TBC2', 'TBC3', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { TBC1: 1, TBC2: 1, TBC3: 1 },
    priority_rules: 'Toán hoặc Văn chiếm ít nhất 1/3 tổng trọng số',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.5, Lý 8.0, Hóa 8.0 -> S = 24.50 -> DXT = 24.50 + P_eff'
  },
  {
    formula_id: 'F29_HB_6HK_W2_30',
    formula_family: 'TRANSCRIPT_6HK_W2_30',
    formula_name: 'Học Bạ 6 Học Kỳ - Môn Chính Nhân 2 Quy Về Thang 30',
    method_id: 'PT200_HB',
    formula_math: 'ĐXT = [(TBC_MC * 2 + TBC_M2 + TBC_M3) * 3/4] + Priority_30_Eff',
    excel_expression_template: '=(MC*2 + M2 + M3)*0.75 + Priority_Eff',
    input_variables: ['MC', 'M2', 'M3', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { MC: 2, M2: 1, M3: 1 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán(MC) 9.0, Lý 8.0, Anh 8.5 -> Raw=(18+8+8.5)*0.75 = 25.875'
  },
  {
    formula_id: 'F30_HB_3HK_L12_30',
    formula_family: 'TRANSCRIPT_L12_30',
    formula_name: 'Học Bạ Lớp 12 Cả Năm Hoặc 3 Học Kỳ (DCN, BVH, GHA)',
    method_id: 'PT200_HB',
    formula_math: 'ĐXT = TBC12_M1 + TBC12_M2 + TBC12_M3 + Bonus_30_Eff + Priority_30_Eff',
    excel_expression_template: '=M1 + M2 + M3 + Bonus_Eff + Priority_Eff',
    input_variables: ['M1', 'M2', 'M3', 'Bonus', 'Priority'],
    input_scales: ['10', '10', '10', '3', '2.75'],
    subject_coefficients: { M1: 1, M2: 1, M3: 1 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 8.8, Lý 8.5, Hóa 8.2 -> Raw = 25.50'
  },
  {
    formula_id: 'F31_BCA_PT2_30',
    formula_family: 'BCA_POLICE_30',
    formula_name: 'Khối Công An - PT2 (CCNN Quốc Tế Quy Đổi + Bài Thi BCA Thang 100)',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = CCNN_QuyDoi_30 * 0.40 + BTBCA_100 * 0.18 + Priority_30_Eff + Bonus_30_Eff',
    excel_expression_template: '=CCNN_30*0.4 + BTBCA*0.18 + Priority_Eff + Bonus_Eff',
    input_variables: ['CCNN_30', 'BTBCA', 'Bonus', 'Priority'],
    input_scales: ['30', '100', '3', '2.75'],
    subject_coefficients: { CCNN: 0.40, BTBCA: 0.18 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'IELTS 7.5 (quy 30đ = 29.0 -> *0.4 = 11.60), BTBCA = 80.0 (*0.18 = 14.40) -> Raw = 26.00'
  },
  {
    formula_id: 'F32_SAT_ACT_30',
    formula_family: 'INTERNATIONAL_STANDARDIZED_30',
    formula_name: 'Xét Tuyển Chứng Chỉ Chuẩn Hóa Quốc Tế SAT / ACT Quy Thang 30',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = (SAT / 1600) * 30 + Priority_30_Eff',
    excel_expression_template: '=(SAT / 1600)*30 + Priority_Eff',
    input_variables: ['SAT', 'Priority'],
    input_scales: ['1600', '2.75'],
    subject_coefficients: { SAT: 30/1600 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'SAT 1440/1600 -> Raw = (1440/1600)*30 = 27.00 -> P_eff=((30-27)/7.5)*0.75 = 0.30 -> DXT = 27.30'
  },
  {
    formula_id: 'F33_TEACHER_111_30',
    formula_family: 'TEACHER_TRAINING_30',
    formula_name: 'Khối Ngành Đào Tạo Giáo Viên (Sư Phạm) - Ràng Buộc NV1 Đến NV5',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = M1 + M2 + M3 + Priority_30_Eff',
    excel_expression_template: '=M1 + M2 + M3 + Priority_Eff',
    input_variables: ['M1', 'M2', 'M3', 'Priority', 'Order'],
    input_scales: ['10', '10', '10', '2.75', '15'],
    subject_coefficients: { M1: 1, M2: 1, M3: 1 },
    priority_rules: 'BẮT BUỘC Order <= 5 (Từ NV1 đến NV5, NV6-NV15 không hợp lệ)',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 9.0, Văn 8.5, Sử 8.5 -> S = 26.0 -> Hợp lệ nếu nguyện vọng thuộc NV1-NV5'
  },
  {
    formula_id: 'F34_TDTT_30',
    formula_family: 'SPORTS_TDTT_30',
    formula_name: 'Khối Giáo Dục Thể Chất / Thể Dục Thể Thao (T00, T01) - NK x2 Quy 30',
    method_id: 'PT100_THPT',
    formula_math: 'ĐXT = [(VH1 + VH2 + NK_TDTT * 2) * 3/4] + Priority_30_Eff',
    excel_expression_template: '=(VH1 + VH2 + NK*2)*0.75 + Priority_Eff',
    input_variables: ['VH1', 'VH2', 'NK', 'Priority'],
    input_scales: ['10', '10', '10', '2.75'],
    subject_coefficients: { VH1: 1, VH2: 1, NK: 2 },
    priority_rules: 'Năng khiếu TDTT >= 5.0 (hoặc >= 8.0 đối với VĐV cấp kiện tướng)',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 7.0, Sinh 7.0, Năng khiếu 9.0 -> Raw = (7+7+18)*0.75 = 24.00'
  },
  {
    formula_id: 'F35_CTU_VSAT_30',
    formula_family: 'CTU_VSAT_30',
    formula_name: 'Đại Học Cần Thơ (TCT) - Điểm V-SAT Nội Suy Bách Phân Vị',
    method_id: 'PT402_DGNL',
    formula_math: 'ĐXT = VSAT_Percentile_30 + Priority_30_Eff',
    excel_expression_template: '=InterpolateVSAT(Score) + Priority_Eff',
    input_variables: ['VSAT_Score', 'Priority'],
    input_scales: ['30', '2.75'],
    subject_coefficients: { VSAT: 1 },
    priority_rules: 'Giảm dần từ 22.5',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'VSAT 21.0 -> Nội suy bách phân vị chuẩn TCT -> 22.80 + P_eff'
  },
  {
    formula_id: 'F36_YDS_CCNN_30',
    formula_family: 'YDS_SPECIALIZED_30',
    formula_name: 'ĐH Y Dược TPHCM (YDS) - Y Khoa Xét Kết Hợp IELTS (IELTS >= 6.0)',
    method_id: 'PT301_XTTN',
    formula_math: 'ĐXT = Toán + Hóa + Sinh + Priority_30_Eff (Điều kiện: IELTS >= 6.0)',
    excel_expression_template: '=IF(IELTS>=6.0, Toan + Hoa + Sinh + Priority_Eff, "INELIGIBLE")',
    input_variables: ['Toan', 'Hoa', 'Sinh', 'IELTS', 'Priority'],
    input_scales: ['10', '10', '10', '9.0', '2.75'],
    subject_coefficients: { Toan: 1, Hoa: 1, Sinh: 1 },
    priority_rules: 'Tiêu chí phụ: Ưu tiên điểm môn Sinh học khi đồng điểm chuẩn',
    final_official_scale: 'THANG_30',
    normalized_100_method: '(DXT / 30) * 100',
    worked_example: 'Toán 9.2, Hóa 8.8, Sinh 9.0 (Tổng 27.0), IELTS 6.5 -> Hợp lệ xét kết hợp -> DXT = 27.0 + P_eff'
  }
];

// =============================================================================
// SEED DATA: 39 QUY TẮC QUY ĐỔI CHỨNG CHỈ (09_Score_Conversions)
// =============================================================================
export const AUDITED_SCORE_CONVERSIONS: ScoreConversionRule[] = [
  // 1. KHA (ĐH Kinh tế Quốc dân) - IELTS
  { conv_id: 'CONV_KHA_IELTS_55', institution_code: 'KHA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '5.5', target_scale: 10, converted_score: 8.0, source_url: 'https://neu.edu.vn' },
  { conv_id: 'CONV_KHA_IELTS_60', institution_code: 'KHA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.0', target_scale: 10, converted_score: 8.5, source_url: 'https://neu.edu.vn' },
  { conv_id: 'CONV_KHA_IELTS_65', institution_code: 'KHA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 10, converted_score: 9.0, source_url: 'https://neu.edu.vn' },
  { conv_id: 'CONV_KHA_IELTS_70', institution_code: 'KHA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.0', target_scale: 10, converted_score: 9.5, source_url: 'https://neu.edu.vn' },
  { conv_id: 'CONV_KHA_IELTS_75', institution_code: 'KHA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.5-9.0', target_scale: 10, converted_score: 10.0, source_url: 'https://neu.edu.vn' },

  // 2. NTH (ĐH Ngoại thương) - IELTS
  { conv_id: 'CONV_NTH_IELTS_65', institution_code: 'NTH', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 10, converted_score: 8.5, source_url: 'https://ftu.edu.vn' },
  { conv_id: 'CONV_NTH_IELTS_70', institution_code: 'NTH', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.0', target_scale: 10, converted_score: 9.0, source_url: 'https://ftu.edu.vn' },
  { conv_id: 'CONV_NTH_IELTS_75', institution_code: 'NTH', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.5', target_scale: 10, converted_score: 9.5, source_url: 'https://ftu.edu.vn' },
  { conv_id: 'CONV_NTH_IELTS_80', institution_code: 'NTH', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '8.0-9.0', target_scale: 10, converted_score: 10.0, source_url: 'https://ftu.edu.vn' },

  // 3. BKA (ĐH Bách Khoa Hà Nội) - IELTS quy đổi sang môn Tiếng Anh
  { conv_id: 'CONV_BKA_IELTS_50', institution_code: 'BKA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '5.0', target_scale: 10, converted_score: 8.0, source_url: 'https://hust.edu.vn' },
  { conv_id: 'CONV_BKA_IELTS_55', institution_code: 'BKA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '5.5', target_scale: 10, converted_score: 8.5, source_url: 'https://hust.edu.vn' },
  { conv_id: 'CONV_BKA_IELTS_60', institution_code: 'BKA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.0', target_scale: 10, converted_score: 9.0, source_url: 'https://hust.edu.vn' },
  { conv_id: 'CONV_BKA_IELTS_65', institution_code: 'BKA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 10, converted_score: 9.5, source_url: 'https://hust.edu.vn' },
  { conv_id: 'CONV_BKA_IELTS_70', institution_code: 'BKA', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.0-9.0', target_scale: 10, converted_score: 10.0, source_url: 'https://hust.edu.vn' },

  // 4. TMU (ĐH Thương mại) - IELTS
  { conv_id: 'CONV_TMU_IELTS_55', institution_code: 'TMU', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '5.5', target_scale: 10, converted_score: 8.0, source_url: 'https://tmu.edu.vn' },
  { conv_id: 'CONV_TMU_IELTS_60', institution_code: 'TMU', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.0', target_scale: 10, converted_score: 8.5, source_url: 'https://tmu.edu.vn' },
  { conv_id: 'CONV_TMU_IELTS_65', institution_code: 'TMU', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 10, converted_score: 9.0, source_url: 'https://tmu.edu.vn' },
  { conv_id: 'CONV_TMU_IELTS_70', institution_code: 'TMU', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'IELTS', raw_score_range: '7.0-9.0', target_scale: 10, converted_score: 10.0, source_url: 'https://tmu.edu.vn' },

  // 5. YDS (ĐH Y Dược TPHCM) - IELTS Kết hợp
  { conv_id: 'CONV_YDS_IELTS_60', institution_code: 'YDS', applicable_scope: 'Y khoa & RHM', conversion_category: 'IELTS_TO_BONUS', certificate_or_test: 'IELTS', raw_score_range: '6.0', target_scale: 30, converted_score: 0.0, conditions: 'Ngưỡng điều kiện hợp lệ phương thức kết hợp', source_url: 'https://ump.edu.vn' },
  { conv_id: 'CONV_YDS_IELTS_65', institution_code: 'YDS', applicable_scope: 'Dược & Điều dưỡng', conversion_category: 'IELTS_TO_BONUS', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 30, converted_score: 1.0, conditions: 'Cộng khuyến khích 1.00 điểm', source_url: 'https://ump.edu.vn' },
  { conv_id: 'CONV_YDS_IELTS_70', institution_code: 'YDS', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_BONUS', certificate_or_test: 'IELTS', raw_score_range: '7.0-9.0', target_scale: 30, converted_score: 1.5, conditions: 'Cộng khuyến khích 1.50 điểm (trần bonus 3.0)', source_url: 'https://ump.edu.vn' },

  // 6. YHB (ĐH Y Hà Nội) - IELTS Kết hợp
  { conv_id: 'CONV_YHB_IELTS_65', institution_code: 'YHB', applicable_scope: 'Y khoa & RHM', conversion_category: 'IELTS_TO_BONUS', certificate_or_test: 'IELTS', raw_score_range: '6.5', target_scale: 30, converted_score: 1.0, conditions: 'Cộng điểm khuyến khích kết hợp', source_url: 'https://hmu.edu.vn' },
  { conv_id: 'CONV_YHB_IELTS_75', institution_code: 'YHB', applicable_scope: 'Toàn trường', conversion_category: 'IELTS_TO_BONUS', certificate_or_test: 'IELTS', raw_score_range: '7.5-9.0', target_scale: 30, converted_score: 2.0, conditions: 'Cộng điểm khuyến khích kết hợp', source_url: 'https://hmu.edu.vn' },

  // 7. SAT Quy Đổi Chuẩn Quốc Gia (Thang 1600 -> Thang 30)
  { conv_id: 'CONV_ALL_SAT_1200', institution_code: 'ALL', applicable_scope: 'Khối ĐH Quốc gia & Kinh tế', conversion_category: 'SAT_TO_30', certificate_or_test: 'SAT', raw_score_range: '1200', target_scale: 30, converted_score: 22.50, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_SAT_1300', institution_code: 'ALL', applicable_scope: 'Khối ĐH Quốc gia & Kinh tế', conversion_category: 'SAT_TO_30', certificate_or_test: 'SAT', raw_score_range: '1300', target_scale: 30, converted_score: 24.38, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_SAT_1400', institution_code: 'ALL', applicable_scope: 'Khối ĐH Quốc gia & Kinh tế', conversion_category: 'SAT_TO_30', certificate_or_test: 'SAT', raw_score_range: '1400', target_scale: 30, converted_score: 26.25, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_SAT_1500', institution_code: 'ALL', applicable_scope: 'Khối ĐH Quốc gia & Kinh tế', conversion_category: 'SAT_TO_30', certificate_or_test: 'SAT', raw_score_range: '1500', target_scale: 30, converted_score: 28.13, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_SAT_1600', institution_code: 'ALL', applicable_scope: 'Khối ĐH Quốc gia & Kinh tế', conversion_category: 'SAT_TO_30', certificate_or_test: 'SAT', raw_score_range: '1600', target_scale: 30, converted_score: 30.00, source_url: 'https://moet.gov.vn' },

  // 8. HSA (ĐHQGHN 150) -> Quy đổi Thang 30
  { conv_id: 'CONV_ALL_HSA_80', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '80', target_scale: 30, converted_score: 16.00, source_url: 'https://cet.vnu.edu.vn' },
  { conv_id: 'CONV_ALL_HSA_90', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '90', target_scale: 30, converted_score: 18.00, source_url: 'https://cet.vnu.edu.vn' },
  { conv_id: 'CONV_ALL_HSA_100', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '100', target_scale: 30, converted_score: 20.00, source_url: 'https://cet.vnu.edu.vn' },
  { conv_id: 'CONV_ALL_HSA_110', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '110', target_scale: 30, converted_score: 22.00, source_url: 'https://cet.vnu.edu.vn' },
  { conv_id: 'CONV_ALL_HSA_120', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '120', target_scale: 30, converted_score: 24.00, source_url: 'https://cet.vnu.edu.vn' },
  { conv_id: 'CONV_ALL_HSA_130', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận HSA', conversion_category: 'DGNL_TO_30', certificate_or_test: 'HSA', raw_score_range: '130-150', target_scale: 30, converted_score: 26.00, source_url: 'https://cet.vnu.edu.vn' },

  // 9. V-ACT (ĐHQG TP.HCM 1200) -> Quy đổi Thang 30
  { conv_id: 'CONV_ALL_VACT_600', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận V-ACT', conversion_category: 'DGNL_TO_30', certificate_or_test: 'V_ACT', raw_score_range: '600', target_scale: 30, converted_score: 15.00, source_url: 'https://vnuhcm.edu.vn' },
  { conv_id: 'CONV_ALL_VACT_750', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận V-ACT', conversion_category: 'DGNL_TO_30', certificate_or_test: 'V_ACT', raw_score_range: '750', target_scale: 30, converted_score: 18.75, source_url: 'https://vnuhcm.edu.vn' },
  { conv_id: 'CONV_ALL_VACT_900', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận V-ACT', conversion_category: 'DGNL_TO_30', certificate_or_test: 'V_ACT', raw_score_range: '900', target_scale: 30, converted_score: 22.50, source_url: 'https://vnuhcm.edu.vn' },
  { conv_id: 'CONV_ALL_VACT_1050', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận V-ACT', conversion_category: 'DGNL_TO_30', certificate_or_test: 'V_ACT', raw_score_range: '1050', target_scale: 30, converted_score: 26.25, source_url: 'https://vnuhcm.edu.vn' },
  { conv_id: 'CONV_ALL_VACT_1200', institution_code: 'ALL', applicable_scope: 'Các trường chấp nhận V-ACT', conversion_category: 'DGNL_TO_30', certificate_or_test: 'V_ACT', raw_score_range: '1200', target_scale: 30, converted_score: 30.00, source_url: 'https://vnuhcm.edu.vn' },

  // 10. HSK (Tiếng Trung) -> Quy đổi môn Ngoại ngữ
  { conv_id: 'CONV_ALL_HSK_3', institution_code: 'ALL', applicable_scope: 'Các trường xét HSK', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'HSK', raw_score_range: 'HSK 3', target_scale: 10, converted_score: 8.0, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_HSK_4', institution_code: 'ALL', applicable_scope: 'Các trường xét HSK', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'HSK', raw_score_range: 'HSK 4', target_scale: 10, converted_score: 9.0, source_url: 'https://moet.gov.vn' },
  { conv_id: 'CONV_ALL_HSK_5', institution_code: 'ALL', applicable_scope: 'Các trường xét HSK', conversion_category: 'IELTS_TO_SUBJECT', certificate_or_test: 'HSK', raw_score_range: 'HSK 5-6', target_scale: 10, converted_score: 10.0, source_url: 'https://moet.gov.vn' }
];

// =============================================================================
// SEED DATA: 10_Score_Normalization
// =============================================================================
export const AUDITED_NORMALIZATION_RULES: NormalizationRule[] = [
  {
    norm_id: 'NORM_SCALE_30_TO_100',
    source_scale: 'THANG_30',
    source_max: 30,
    destination_scale: 'THANG_100',
    formula_math: '(Score_30 / 30) * 100',
    legal_classification: 'Chỉ số phân tích tham chiếu chuẩn hóa',
    limitations: 'Dùng để đối chiếu mức độ cạnh tranh giữa các thang điểm khác nhau'
  },
  {
    norm_id: 'NORM_SCALE_40_TO_100',
    source_scale: 'THANG_40',
    source_max: 40,
    destination_scale: 'THANG_100',
    formula_math: '(Score_40 / 40) * 100',
    legal_classification: 'Chỉ số phân tích tham chiếu chuẩn hóa',
    limitations: 'Chỉ số tham chiếu'
  },
  {
    norm_id: 'NORM_SCALE_1200_TO_100',
    source_scale: 'THANG_1200',
    source_max: 1200,
    destination_scale: 'THANG_100',
    formula_math: '(Score_1200 / 1200) * 100',
    legal_classification: 'Chỉ số phân tích tham chiếu chuẩn hóa',
    limitations: 'Chỉ số tham chiếu'
  },
  {
    norm_id: 'NORM_SCALE_10_TO_100',
    source_scale: 'THANG_10',
    source_max: 10,
    destination_scale: 'THANG_100',
    formula_math: '(Score_10 / 10) * 100',
    legal_classification: 'Chỉ số phân tích tham chiếu chuẩn hóa',
    limitations: 'Chỉ số tham chiếu'
  }
];

// =============================================================================
// SEED DATA: 12_Eligibility_TieBreakers
// =============================================================================
export const AUDITED_ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    rule_id: 'RULE_PARALYSIS_SCORE',
    scope: 'NATIONAL_MOET',
    rule_title: 'Kiểm Tra Điểm Liệt',
    target_programs: 'Toàn bộ ngành & phương thức xét tuyển',
    prerequisite_condition: 'Mọi môn trong tổ hợp thi THPT phải > 1.00 điểm',
    tie_breaker_rule: 'Thí sinh có bất kỳ môn nào <= 1.00 điểm bị loại trực tiếp',
    source_url: 'https://moet.gov.vn'
  },
  {
    rule_id: 'RULE_MOET_GENERAL_FLOOR',
    scope: 'NATIONAL_MOET',
    rule_title: 'Ngưỡng Nguồn Tuyển Chung Bộ GD&ĐT',
    target_programs: 'Toàn bộ phương thức sử dụng điểm thi tốt nghiệp THPT',
    prerequisite_condition: 'Tổng 3 môn trong tổ hợp xét tuyển >= 15.00/30 điểm',
    tie_breaker_rule: 'Thí sinh có tổng 3 môn < 15.00 không đủ điều kiện xét tuyển đại học',
    source_url: 'https://moet.gov.vn'
  },
  {
    rule_id: 'RULE_HEALTHCARE_FLOOR',
    scope: 'PROGRAM_GROUP',
    rule_title: 'Ngưỡng Đảm Bảo Chất Lượng Đầu Vào Nhóm Sức Khỏe',
    target_programs: 'Ngành Y khoa, Răng Hàm Mặt, Dược học, YHCT, Điều dưỡng, Kỹ thuật Y học',
    prerequisite_condition: 'Y khoa & RHM >= 22.50; Dược & YHCT >= 21.00; Điều dưỡng & KTYH >= 19.00',
    tie_breaker_rule: 'Không áp dụng điểm trúng tuyển dưới ngưỡng sàn này',
    source_url: 'https://moet.gov.vn'
  },
  {
    rule_id: 'RULE_TEACHER_ASPIRATION_LIMIT',
    scope: 'PROGRAM_GROUP',
    rule_title: 'Giới Hạn Nguyện Vọng Khối Ngành Đào Tạo Giáo Viên (Sư Phạm)',
    target_programs: 'Tất cả các ngành Sư phạm & Giáo dục',
    prerequisite_condition: 'Thí sinh bắt buộc phải đặt ngành Sư phạm ở vị trí từ NV1 đến NV5',
    tie_breaker_rule: 'Nguyện vọng từ NV6 đến NV15 đối với ngành Sư phạm sẽ bị hệ thống Bộ từ chối',
    source_url: 'https://moet.gov.vn'
  },
  {
    rule_id: 'RULE_MERGED_INSTITUTION_REDIRECT',
    scope: 'INSTITUTION',
    rule_title: 'Điều Hướng Mã Trường Sáp Nhập & Đổi Tên',
    target_programs: 'DNV (ĐH Nội Vụ), LBS (ĐH Nguyễn Huệ), SPK (ĐH Sư phạm Kỹ thuật TPHCM)',
    prerequisite_condition: 'DNV sáp nhập vào HCH; LBS là mã trường Sĩ quan Lục quân 2 LBH; SPK đổi tên theo QĐ 2809/QĐ-TTg',
    tie_breaker_rule: 'Tự động hiển thị mã trường kế thừa hợp pháp trên hệ thống tuyển sinh',
    source_url: 'https://chinhphu.vn'
  }
];

// =============================================================================
// SEED DATA: 14_Source_Register
// =============================================================================
export const AUDITED_SOURCE_REGISTRY: SourceRegistryItem[] = [
  {
    source_id: 'SRC_01_MOET_TT06',
    tier: 'TIER_1_GOVERNMENT',
    issuing_organization: 'Bộ Giáo dục & Đào tạo',
    document_title: 'Thông tư số 06/2026/TT-BGDĐT ban hành Quy chế tuyển sinh đại học',
    direct_url: 'https://chinhphu.vn/van-ban/06-2026-tt-bgddt',
    publication_date: '2026-02-15',
    exact_evidence_supported: 'Ngưỡng giảm điểm ưu tiên 22.5, trần điểm cộng 3.0, giới hạn NV sư phạm',
    verification_status: 'VERIFIED_OFFICIAL'
  },
  {
    source_id: 'SRC_02_BCA_CA2026',
    tier: 'TIER_1_GOVERNMENT',
    issuing_organization: 'Bộ Công an - Cục Đào tạo',
    document_title: 'Hướng dẫn tuyển sinh Công an nhân dân năm 2026',
    direct_url: 'https://bocongan.gov.vn/tuyen-sinh-2026',
    publication_date: '2026-03-01',
    exact_evidence_supported: 'Công thức DXT = 40% THPT + 60% BTBCA (hệ số 0.18)',
    verification_status: 'VERIFIED_OFFICIAL'
  },
  {
    source_id: 'SRC_03_HUST_TSA2026',
    tier: 'TIER_2_OFFICIAL_UNIVERSITY',
    issuing_organization: 'Đại học Bách khoa Hà Nội',
    document_title: 'Đề án tuyển sinh đại học Bách khoa Hà Nội 2026',
    direct_url: 'https://ts.hust.edu.vn/de-an-2026',
    publication_date: '2026-02-28',
    exact_evidence_supported: 'Tổ hợp K01, Đánh giá tư duy TSA Thang 100, Tổ hợp Toán x2 nhân 3/4',
    verification_status: 'VERIFIED_OFFICIAL'
  },
  {
    source_id: 'SRC_04_VNUHCM_COMP2026',
    tier: 'TIER_2_OFFICIAL_UNIVERSITY',
    issuing_organization: 'ĐHQG TP.HCM',
    document_title: 'Phương án tuyển sinh tổng hợp ĐHQG TP.HCM năm 2026',
    direct_url: 'https://vnuhcm.edu.vn/tuyen-sinh-2026',
    publication_date: '2026-03-05',
    exact_evidence_supported: 'Thang 100 QSB (70-20-10), QSC (47.5-47.5-5), QSK (55-35-10), QSY (40-35-25)',
    verification_status: 'VERIFIED_OFFICIAL'
  },
  {
    source_id: 'SRC_05_TUYENSINH247_AUDITED',
    tier: 'TIER_3_SECONDARY_AUDITED',
    issuing_organization: 'Tuyensinh247.com',
    document_title: 'Cơ sở dữ liệu điểm chuẩn & công thức tính 300 trường đại học năm 2026',
    direct_url: 'https://diemthi.tuyensinh247.com/diem-xet-tuyen.html',
    publication_date: '2026-04-10',
    exact_evidence_supported: 'Dữ liệu phân hóa 300 trường và 2.143 ngành tuyển sinh',
    verification_status: 'VERIFIED_SECONDARY_TUYENSINH247'
  }
];
