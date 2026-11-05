export interface AdmissionsWorkbookContextOptions {
  maxCharacters?: number;
}

export function getAdmissionsWorkbookContext(
  query: string,
  options?: AdmissionsWorkbookContextOptions
): string;
