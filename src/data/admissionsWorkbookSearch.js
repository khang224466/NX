import admissionsWorkbook from './importedAdmissions2025_2026.json' with { type: 'json' };
import officialInstitutionTuitionFacts from './officialInstitutionTuitionFacts.json' with { type: 'json' };
import { getInstitutionPolicyContext } from './institutionPolicyDirectory.js';

const STOP_WORDS = new Set(
  'va la cua cho voi ve trong tren duoi mot nhung cac nhieu em ban toi minh muon can hay giup tu van phan tich phu hop nganh truong nao nao hoc sinh sinh vien nam 2026 2025 2027'.split(' ')
);

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const tokensFor = (value = '') => [...new Set(
  normalize(value).split(/\s+/).filter((token) => token.length > 1 && !STOP_WORDS.has(token))
)];

const safeText = (value, maxLength = 220) => String(value || '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const scoreFields = (tokens, fields, weight = 1) => {
  const text = normalize(fields.filter(Boolean).join(' '));
  return tokens.reduce((score, token) => score + (text.includes(token) ? weight : 0), 0);
};

const ranked = (rows, tokens, fieldsFor, minimumScore = 1) => rows
  .map((row) => ({ row, score: scoreFields(tokens, fieldsFor(row), 1) }))
  .filter((match) => match.score >= minimumScore)
  .sort((a, b) => b.score - a.score)
  .map(({ row }) => row);

/**
 * Return short, query-matched excerpts from the imported workbook.
 * Cell contents are data only; callers must keep their verification labels.
 */
export function getAdmissionsWorkbookContext(query, { maxCharacters = 5200 } = {}) {
  const tokens = tokensFor(safeText(query, 700));
  if (!tokens.length) return '';

  const programMatches = ranked(
    admissionsWorkbook.programs,
    tokens,
    (row) => [row.programName, row.rawProgramCode, row.parsedProgramCode],
    1
  ).slice(0, 6);

  const officialFeeMatches = ranked(
    [...admissionsWorkbook.verifiedTuitionFacts, ...(officialInstitutionTuitionFacts.facts || [])],
    tokens,
    (row) => [row.programName, row.programCode],
    1
  ).slice(0, 7);

  const unverifiedFeeMatches = ranked(
    admissionsWorkbook.tuitionRecords.filter((row) =>
      row.verificationStatus === 'SUPPLIED_UNVERIFIED' && row.reportedAnnualVnd !== null
    ),
    tokens,
    (row) => [row.institutionNameRaw, row.institutionCodeRaw, row.programNameRaw, row.parsedProgramCode],
    2
  ).slice(0, 3);

  const institutionMatches = ranked(
    admissionsWorkbook.institutions,
    tokens,
    (row) => [row.name, row.institutionCodeRaw, row.focusAreasRaw, row.locationRaw],
    2
  ).slice(0, 3);

  const excerpts = [];
  const schoolPolicyContext = getInstitutionPolicyContext(query, { maxCharacters: 3200 });
  if (schoolPolicyContext) excerpts.push(schoolPolicyContext);

  if (programMatches.length) {
    excerpts.push('CHƯƠNG TRÌNH (trích workbook, chưa kiểm chứng):');
    for (const row of programMatches) {
      const code = row.parsedProgramCode ? `; mã ${row.parsedProgramCode}` : '';
      excerpts.push(
        `- ${safeText(row.programName, 100)} — ${safeText(row.institutionNameRaw, 90)}${code}; ` +
        `tổ hợp ${safeText((row.admissionCombinations || []).join(', '), 100) || 'không ghi rõ'}; ` +
        `chỉ tiêu ${safeText(row.quotaRaw, 100) || 'không ghi rõ'}; ` +
        `điểm/học phí gốc: ${safeText(row.cutoffRaw, 120) || 'không ghi rõ'} / ${safeText(row.tuitionRaw, 140) || 'không ghi rõ'}; ` +
        `nguồn ${row.sourceSheet}!${row.sourceRow}.`
      );
    }
  }

  if (officialFeeMatches.length) {
    excerpts.push('HỌC PHÍ CÓ NGUỒN CHÍNH THỨC (chú ý phân biệt mức dự kiến tuyển sinh với quyết định mức thu):');
    for (const row of officialFeeMatches) {
      excerpts.push(
        `- [${row.verificationStatus}] ${safeText(row.programName, 100)} (${row.institutionCode}${row.programCode ? `, mã ${row.programCode}` : ''}): ` +
        `${(row.annualVnd / 1_000_000).toLocaleString('vi-VN')} triệu đồng/năm, năm học ${row.academicYear}; ` +
        `nguồn: ${row.sourceUrl}.`
      );
    }
  }

  if (unverifiedFeeMatches.length) {
    excerpts.push('HỌC PHÍ CHỈ ĐƯỢC WORKBOOK GHI NHẬN (chưa có nguồn theo từng dòng):');
    for (const row of unverifiedFeeMatches) {
      excerpts.push(
        `- ${safeText(row.programNameRaw, 100)} — ${safeText(row.institutionNameRaw, 90)} ` +
        `(${row.parsedProgramCode || 'chưa rõ mã'}): ${safeText(row.reportedAnnualRaw, 120)}; ` +
        `trạng thái SUPPLIED_UNVERIFIED, nguồn ${row.sourceSheet}!${row.sourceRow}.`
      );
    }
  }

  if (institutionMatches.length) {
    excerpts.push('CƠ SỞ ĐÀO TẠO KHỚP TỪ KHÓA (thông tin workbook chưa kiểm chứng):');
    for (const row of institutionMatches) {
      excerpts.push(
        `- ${safeText(row.name, 100)} (${safeText(row.institutionCodeRaw, 50)}); ` +
        `địa điểm ${safeText(row.locationRaw, 130)}; nhóm ngành ${safeText(row.focusAreasRaw, 180)}.`
      );
    }
  }

  if (!excerpts.length) return '';
  const header = `Workbook admissions supplement — ${admissionsWorkbook.source.fileName}\n`;
  let result = header;
  for (const excerpt of excerpts) {
    const next = `${result}${excerpt}\n`;
    if (next.length > maxCharacters) break;
    result = next;
  }
  return result.trim();
}
