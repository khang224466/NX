export interface InstitutionAdmissionMethod {
  name: string;
  description: string;
  sourceUrl: string;
  additionalSourceUrls?: string[];
}

export interface InstitutionScholarshipPolicy {
  name: string;
  description: string;
  academicYear: string;
  sourceUrl: string;
  additionalSourceUrls?: string[];
}

export interface InstitutionTuitionFact {
  programName: string;
  programCode?: string;
  academicYear: string;
  annualVnd?: number;
  annualMinVnd?: number;
  annualMaxVnd?: number;
  creditVnd?: number;
  amount?: number;
  currency?: 'VND' | 'USD';
  note: string;
  sourceUrl: string;
}

export interface InstitutionFinancialNote {
  description: string;
  sourceUrl: string;
  additionalSourceUrls?: string[];
}

export interface InstitutionPolicyProfile {
  sourceId: string;
  name: string;
  institutionCode: string;
  officialCodeAliases?: string[];
  officialHomepage: string | null;
  academicYear: string;
  admissionMethods: InstitutionAdmissionMethod[];
  scholarships: InstitutionScholarshipPolicy[];
  tuition: InstitutionTuitionFact[];
  financialNotes: InstitutionFinancialNote[];
  verificationStatus: 'OFFICIAL_PARTIAL' | 'NEEDS_SOURCE';
}

export const INSTITUTION_POLICY_DIRECTORY: InstitutionPolicyProfile[];
export function getInstitutionPolicyByCode(code: string): InstitutionPolicyProfile | null;
export function getInstitutionPolicyContext(
  query: string,
  options?: { maxCharacters?: number; maxInstitutions?: number }
): string;
