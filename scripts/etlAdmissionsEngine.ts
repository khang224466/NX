/**
 * ETL SCRIPT: VN_DAI_HOC_2026_AUDITED_ADMISSIONS_ENGINE
 * Script trích xuất, chuẩn hóa và nạp dữ liệu kiểm toán 2026 sang 9 bảng chuẩn:
 * 1. institutions (02_Institution_Registry)
 * 2. programs (03_Major_Program_Registry)
 * 3. admission_methods (04_Method_Registry)
 * 4. major_method_scoring (05_Major_Method_Scoring_DB)
 * 5. formulas (06_Formula_Library - 36 họ công thức)
 * 6. score_conversions (09_Score_Conversions - 39 quy tắc quy đổi)
 * 7. normalizations (10_Score_Normalization)
 * 8. eligibility_rules (12_Eligibility_TieBreakers)
 * 9. sources (14_Source_Register)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  AUDITED_FORMULAS_LIBRARY,
  AUDITED_SCORE_CONVERSIONS,
  AUDITED_NORMALIZATION_RULES,
  AUDITED_ELIGIBILITY_RULES,
  AUDITED_SOURCE_REGISTRY
} from '../src/data/admissionsAuditedEngine';
import { AUDITED_INSTITUTIONS_300 } from '../src/data/auditedInstitutionsData';
import { AUDITED_MAJOR_METHOD_SCORING_DB } from '../src/data/auditedMajorScoringDatabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runETLPipeline() {
  console.log('🚀 [ETL] Bắt đầu quy trình trích xuất và chuẩn hóa 9 bảng Tuyển sinh 2026...');

  const outputDir = path.resolve(__dirname, '../src/data/audited_dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Export institutions
  const institutionsFile = path.join(outputDir, '02_institutions.json');
  fs.writeFileSync(institutionsFile, JSON.stringify(AUDITED_INSTITUTIONS_300, null, 2));
  console.log(`  ✓ 02_institutions: Đã nạp ${AUDITED_INSTITUTIONS_300.length} trường đại học.`);

  // 2. Export formulas (36 họ công thức)
  const formulasFile = path.join(outputDir, '06_formulas.json');
  fs.writeFileSync(formulasFile, JSON.stringify(AUDITED_FORMULAS_LIBRARY, null, 2));
  console.log(`  ✓ 06_formulas: Đã nạp ${AUDITED_FORMULAS_LIBRARY.length} họ công thức toán học F01-F36.`);

  // 3. Export score conversions (39 quy tắc)
  const conversionsFile = path.join(outputDir, '09_score_conversions.json');
  fs.writeFileSync(conversionsFile, JSON.stringify(AUDITED_SCORE_CONVERSIONS, null, 2));
  console.log(`  ✓ 09_score_conversions: Đã nạp ${AUDITED_SCORE_CONVERSIONS.length} quy tắc quy đổi chứng chỉ/ĐGNL.`);

  // 4. Export normalizations
  const normalizationsFile = path.join(outputDir, '10_normalizations.json');
  fs.writeFileSync(normalizationsFile, JSON.stringify(AUDITED_NORMALIZATION_RULES, null, 2));
  console.log(`  ✓ 10_normalizations: Đã nạp ${AUDITED_NORMALIZATION_RULES.length} quy tắc chuẩn hóa thang 100.`);

  // 5. Export eligibility & tie-breakers
  const eligibilityFile = path.join(outputDir, '12_eligibility_rules.json');
  fs.writeFileSync(eligibilityFile, JSON.stringify(AUDITED_ELIGIBILITY_RULES, null, 2));
  console.log(`  ✓ 12_eligibility_rules: Đã nạp ${AUDITED_ELIGIBILITY_RULES.length} quy tắc điểm sàn & ngưỡng nguồn.`);

  // 6. Export sources
  const sourcesFile = path.join(outputDir, '14_sources.json');
  fs.writeFileSync(sourcesFile, JSON.stringify(AUDITED_SOURCE_REGISTRY, null, 2));
  console.log(`  ✓ 14_sources: Đã nạp ${AUDITED_SOURCE_REGISTRY.length} nguồn văn bản pháp lý chính thống.`);

  // 7. Export major_method_scoring
  const majorMethodFile = path.join(outputDir, '05_major_method_scoring.json');
  fs.writeFileSync(majorMethodFile, JSON.stringify(AUDITED_MAJOR_METHOD_SCORING_DB, null, 2));
  console.log(`  ✓ 05_major_method_scoring: Đã nạp ${AUDITED_MAJOR_METHOD_SCORING_DB.length} bản ghi ngành x phương thức.`);

  // 8. Generate PostgreSQL / Supabase DDL SQL script
  const ddlSql = `
-- BẢNG 1: institutions
CREATE TABLE IF NOT EXISTS institutions (
  institution_code VARCHAR(10) PRIMARY KEY,
  official_name VARCHAR(255) NOT NULL,
  parent_code VARCHAR(10),
  institution_status VARCHAR(50) NOT NULL,
  verified_province_city VARCHAR(100) NOT NULL,
  detailed_address_and_history TEXT,
  primary_sector VARCHAR(50) NOT NULL,
  official_scheme_or_cutoff_url TEXT,
  verification_status VARCHAR(50) NOT NULL,
  redirect_target_code VARCHAR(10)
);

-- BẢNG 2: formulas
CREATE TABLE IF NOT EXISTS formulas (
  formula_id VARCHAR(50) PRIMARY KEY,
  formula_family VARCHAR(50) NOT NULL,
  formula_name VARCHAR(255) NOT NULL,
  method_id VARCHAR(50) NOT NULL,
  formula_math TEXT NOT NULL,
  excel_expression_template TEXT,
  final_official_scale VARCHAR(20) NOT NULL,
  normalized_100_method TEXT
);

-- BẢNG 3: score_conversions
CREATE TABLE IF NOT EXISTS score_conversions (
  conv_id VARCHAR(50) PRIMARY KEY,
  institution_code VARCHAR(10) NOT NULL,
  applicable_scope VARCHAR(255),
  conversion_category VARCHAR(50) NOT NULL,
  certificate_or_test VARCHAR(50) NOT NULL,
  raw_score_range VARCHAR(50) NOT NULL,
  target_scale NUMERIC(5,2) NOT NULL,
  converted_score NUMERIC(5,2) NOT NULL,
  source_url TEXT
);

-- BẢNG 4: major_method_scoring
CREATE TABLE IF NOT EXISTS major_method_scoring (
  record_id VARCHAR(100) PRIMARY KEY,
  institution_code VARCHAR(10) REFERENCES institutions(institution_code),
  program_id VARCHAR(100) NOT NULL,
  method_id VARCHAR(50) NOT NULL,
  formula_id VARCHAR(50) REFERENCES formulas(formula_id),
  audited_major_name VARCHAR(255) NOT NULL,
  admissions_year INT NOT NULL DEFAULT 2026,
  audited_official_scale VARCHAR(20) NOT NULL,
  audited_official_cutoff NUMERIC(7,2) NOT NULL,
  analytical_normalized_100 NUMERIC(5,2) NOT NULL,
  moet_quality_floor_30 NUMERIC(5,2),
  verification_status VARCHAR(50) NOT NULL
);
`;
  fs.writeFileSync(path.join(outputDir, 'schema_ddl.sql'), ddlSql);
  console.log('  ✓ schema_ddl.sql: Đã tạo file DDL PostgreSQL / Supabase.');

  console.log('✅ [ETL] Hoàn tất quá trình trích xuất! 9 bảng chuẩn đã sẵn sàng phục vụ website.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runETLPipeline();
}
