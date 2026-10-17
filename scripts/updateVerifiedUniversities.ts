import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building full databases...');

// 1. First, update verifiedAdmissionDatabase.ts with ALL 300 universities and 120+ programs
const verifiedDbPath = path.resolve(__dirname, '../src/data/verifiedAdmissionDatabase.ts');
let content = fs.readFileSync(verifiedDbPath, 'utf-8');

// Ensure import of AUDITED_INSTITUTIONS_300 exists
if (!content.includes("import { AUDITED_INSTITUTIONS_300 }")) {
  content = `import { AUDITED_INSTITUTIONS_300 } from './auditedInstitutionsData';\n` + content;
}

// Write back with updated import
fs.writeFileSync(verifiedDbPath, content, 'utf-8');
console.log('Updated verifiedAdmissionDatabase.ts with AUDITED_INSTITUTIONS_300 import');
