import { handleDossierAnalysisRequest } from './counselor_backend.mjs';

const res = await handleDossierAnalysisRequest({
  body: {
    scores: { literature: 10, english: 10, history: 10, geography: 10 },
    riasec: { R: 0, I: 0, A: 50, S: 0, E: 19, C: 17 },
    personalQuestion: 'Em thích nghệ thuật, viết lách và truyền thông thì nên học ngành nào?'
  }
});

console.log('Status:', res.status);
console.log('Success:', res.data.success);
console.log('Model Used:', res.data.modelUsed);
console.log('Provider:', res.data.provider);
console.log('Headline:', res.data.analysis.headline);
console.log('Direct Answer:', res.data.analysis.directAnswer);
console.log('Top 6 Recommended Majors:');
res.data.analysis.recommendedMajors.slice(0, 6).forEach((m, i) => {
  console.log(`  ${i + 1}. [${m.codeTT09}] ${m.name} (${m.sector}) - Fit: ${m.fitPercent}% - Combo: ${m.bestCombo} (${m.bestComboScore}đ)`);
});
