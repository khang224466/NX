
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
