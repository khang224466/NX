import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { AUDITED_MAJOR_METHOD_SCORING_DB } from '../data/auditedMajorScoringDatabase';
import type { Institution, MajorMethodScoringRecord } from '../data/admissionsAuditedEngine';
import { MAJORS_DATA } from '../data/mockData';

export interface CareerCatalogEntry {
  id: string;
  codeTT09: string;
  codeTT74?: string;
  isOfficialCode: boolean;
  name: string;
  sector: string;
  admissionsCombos: string[];
  targetJobs: string[];
  institutionCodes: string[];
  programCount: number;
  admissionRecordCount: number;
}

interface SeedMajor {
  codeTT09: string;
  codeTT74?: string;
  name: string;
  sector?: string;
  admissionsCombos?: string[];
  targetJobs?: string[];
}

const normalizeName = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const slugify = (value: string): string => normalizeName(value)
  .replace(/\s+/g, '-')
  .replace(/^-|-$/g, '');

const seedMajors = ((seedData as any).majorCatalogLevelIV || []) as SeedMajor[];
const institutionsByCode = new Map<string, Institution>(
  AUDITED_INSTITUTIONS_300.map((institution) => [institution.institution_code, institution])
);
const admissionsByMajor = new Map<string, MajorMethodScoringRecord[]>();

for (const record of AUDITED_MAJOR_METHOD_SCORING_DB) {
  const nameKey = normalizeName(record.audited_major_name);
  const records = admissionsByMajor.get(nameKey) || [];
  records.push(record);
  admissionsByMajor.set(nameKey, records);
}

const catalogByName = new Map<string, CareerCatalogEntry>();
const programIdsByName = new Map<string, Set<string>>();

for (const major of seedMajors) {
  const nameKey = normalizeName(major.name);
  catalogByName.set(nameKey, {
    id: major.codeTT09,
    codeTT09: major.codeTT09,
    codeTT74: major.codeTT74,
    isOfficialCode: true,
    name: major.name,
    sector: major.sector || 'NGANH_KHAC',
    admissionsCombos: [...new Set(major.admissionsCombos || [])],
    targetJobs: [...new Set(major.targetJobs || [])],
    institutionCodes: [],
    programCount: 0,
    admissionRecordCount: 0
  });
}

for (const [nameKey, records] of admissionsByMajor) {
  const name = records[0]?.audited_major_name;
  if (!name) continue;

  let major = catalogByName.get(nameKey);
  if (!major) {
    const id = 'DATA-' + slugify(name);
    major = {
      id,
      codeTT09: id,
      isOfficialCode: false,
      name,
      sector: 'NGANH_KHAC',
      admissionsCombos: [],
      targetJobs: [],
      institutionCodes: [],
      programCount: 0,
      admissionRecordCount: 0
    };
    catalogByName.set(nameKey, major);
  }

  const comboSet = new Set(major.admissionsCombos);
  const institutionSet = new Set(major.institutionCodes);
  const programIds = new Set<string>();
  const sectorVotes = new Map<string, number>();

  for (const record of records) {
    record.subject_combinations?.forEach((combo) => comboSet.add(combo));
    institutionSet.add(record.institution_code);
    programIds.add(record.program_id);

    const sector = institutionsByCode.get(record.institution_code)?.primary_sector;
    if (sector) sectorVotes.set(sector, (sectorVotes.get(sector) || 0) + 1);
  }

  major.admissionsCombos = [...comboSet].sort();
  major.institutionCodes = [...institutionSet].sort();
  major.admissionRecordCount = records.length;

  const previousProgramIds = programIdsByName.get(nameKey) || new Set<string>();
  programIds.forEach((programId) => previousProgramIds.add(programId));
  programIdsByName.set(nameKey, previousProgramIds);
  major.programCount = previousProgramIds.size;

  if (!major.isOfficialCode && sectorVotes.size > 0) {
    major.sector = [...sectorVotes.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  }
}

for (const major of catalogByName.values()) {
  const nameKey = normalizeName(major.name);
  const pathways = MAJORS_DATA.filter((pathway) => {
    if (pathway.code === major.codeTT09 || pathway.code === major.codeTT74) return true;
    const pathwayName = normalizeName(pathway.name.replace(/\s*\([^)]*\)/g, ' '));
    return pathwayName.length >= 10 && (pathwayName === nameKey || pathwayName.startsWith(nameKey) || nameKey.startsWith(pathwayName));
  });
  if (pathways.length > 0) {
    major.targetJobs = [...new Set([
      ...major.targetJobs,
      ...pathways.flatMap((pathway) => pathway.directlyRelatedJobs || [])
    ])].slice(0, 5);
  }
}

export const CAREER_CATALOG: CareerCatalogEntry[] = [...catalogByName.values()]
  .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

export const CAREER_CATALOG_COUNTS = {
  uniqueMajors: CAREER_CATALOG.length,
  admissionRecords: AUDITED_MAJOR_METHOD_SCORING_DB.length
};

export function getMajorAdmissionRecords(
  majorName: string,
  comboCode?: string | null
): MajorMethodScoringRecord[] {
  const records = admissionsByMajor.get(normalizeName(majorName)) || [];
  if (!comboCode) return records;
  const normalizedCombo = comboCode.trim().toUpperCase();
  return records.filter((record) =>
    record.subject_combinations?.some((combo) => combo.trim().toUpperCase() === normalizedCombo)
  );
}

export function getSectorTuitionBenchmark(sector: string) {
  const benchmarks = ((seedData as any).sectorTuitionBenchmarks?.sectors || []) as Array<{
    id: string;
    name: string;
    avg2026_2027: number;
    note?: string;
  }>;
  const benchmark = benchmarks.find((item) => item.id === sector);
  if (benchmark) return benchmark;

  const nationalAverage = (seedData as any).sectorTuitionBenchmarks?.nationalAverageMlnYear;
  return typeof nationalAverage === 'number'
    ? {
      id: 'NATIONAL_AVERAGE',
      name: 'Bình quân toàn quốc',
      avg2026_2027: nationalAverage,
      note: 'Mức bình quân tham khảo, không phải học phí của một trường cụ thể.'
    }
    : null;
}
