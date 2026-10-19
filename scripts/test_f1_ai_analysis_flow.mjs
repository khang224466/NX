import { handleDossierAnalysisRequest } from './counselor_backend.mjs';

async function testF1AiAnalysis() {
  console.log('Testing F1 AI Analysis Pipeline...\n');

  const testPayload = {
    scores: {
      math: 8.8,
      literature: 7.0,
      english: 8.5,
      physics: 8.2,
      chemistry: 7.5,
      biology: 7.0,
      history: 6.5,
      geography: 6.5,
      informatics: 9.0,
      economicLegal: 7.5
    },
    hsaScore: 95,
    riasec: { R: 35, I: 48, A: 25, S: 22, E: 28, C: 40 },
    maxTuition: 35,
    priorityRegion: 'KV2',
    priorityObject: 'DT_0',
    targetRegionFilter: 'ALL',
    personalQuestion: 'Em sợ học CNTT sau này khó cạnh tranh với AI'
  };

  const startTime = Date.now();
  const result = await handleDossierAnalysisRequest({
    body: testPayload,
    headers: { 'x-forwarded-for': 'test_runner_1' }
  });
  const elapsed = Date.now() - startTime;

  console.log(`Status: ${result.status} (elapsed: ${elapsed}ms)`);
  console.log(`Success: ${result.data?.success}`);
  console.log(`Model Used: ${result.data?.modelUsed}`);
  console.log(`Provider: ${result.data?.provider}`);

  if (!result.data?.success || !result.data?.analysis) {
    throw new Error('Analysis request failed: ' + JSON.stringify(result));
  }

  const analysis = result.data.analysis;
  console.log('\n--- AI ANALYSIS DOSSIER REPORT ---');
  console.log('Headline:', analysis.headline);
  console.log('Direct Answer Snippet:', analysis.directAnswer?.slice(0, 150) + '...');
  console.log('Strengths:', analysis.strengthsEvaluation?.slice(0, 100) + '...');
  console.log('Risks & Bottlenecks:', analysis.risksAndBottlenecks?.slice(0, 100) + '...');
  console.log('Tuition Feasibility:', analysis.tuitionFeasibility?.slice(0, 100) + '...');
  console.log('Recommended Majors Count:', analysis.recommendedMajors?.length);
  if (analysis.recommendedMajors?.[0]) {
    const top = analysis.recommendedMajors[0];
    console.log(`Top Major: ${top.name} (${top.codeTT09}) - Fit: ${top.fitPercent}%`);
    console.log(`Fit Reason: ${top.fitReason}`);
    console.log(`Target Jobs: ${top.targetJobs?.join(', ')}`);
    console.log(`AI Risk: ${top.aiRisk} (${top.aiRiskPercent}%)`);
  }
  console.log('Optimal Combo Advice:', analysis.optimalComboAdvice);
  console.log('University Advice:', analysis.universityAdvice);

  // Assertions
  if (!analysis.headline || typeof analysis.headline !== 'string') throw new Error('Missing headline');
  if (!analysis.directAnswer || typeof analysis.directAnswer !== 'string') throw new Error('Missing directAnswer');
  if (!Array.isArray(analysis.recommendedMajors) || analysis.recommendedMajors.length === 0) throw new Error('Missing recommendedMajors');

  console.log('\n[PASS] All F1 AI Dossier Analysis assertions succeeded!');
}

testF1AiAnalysis().catch(err => {
  console.error('\n[FAIL] Test error:', err);
  process.exit(1);
});
