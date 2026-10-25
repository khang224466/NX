import assert from 'node:assert/strict';
import {
  RIASEC_QUESTIONS,
  createRiasecProfileFromNormalizedScores,
  correlateRiasecProfiles,
  rankMajorsByEvidence,
  scoreRiasecAnswers
} from './recommendationEngine';
import type { RiasecAnswers } from './recommendationEngine';
import { SECTOR_RIASEC_VECTORS } from '../../data/riasecSectorProfiles';

const allOneAnswers = Object.fromEntries(RIASEC_QUESTIONS.map((question) => [question.id, 1])) as RiasecAnswers;
const allFiveAnswers = Object.fromEntries(RIASEC_QUESTIONS.map((question) => [question.id, 5])) as RiasecAnswers;

const minimumProfile = scoreRiasecAnswers(allOneAnswers);
assert.equal(minimumProfile.isComplete, true);
assert.deepEqual(minimumProfile.scores, { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
assert.deepEqual(minimumProfile.dominantDimensions, []);

const maximumProfile = scoreRiasecAnswers(allFiveAnswers);
assert.deepEqual(maximumProfile.scores, { R: 100, I: 100, A: 100, S: 100, E: 100, C: 100 });
assert.deepEqual(maximumProfile.dominantDimensions, []);

const differentiatedAnswers = Object.fromEntries(RIASEC_QUESTIONS.map((question) => [
  question.id,
  question.dimension === 'R' ? 5 : 1
])) as RiasecAnswers;
const differentiatedProfile = scoreRiasecAnswers(differentiatedAnswers);
assert.deepEqual(differentiatedProfile.dominantDimensions, ['R']);

const target = SECTOR_RIASEC_VECTORS.CNTT_BAN_DAN_AI;
const targetScores = Object.fromEntries(
  (['R', 'I', 'A', 'S', 'E', 'C'] as const).map((code, index) => [code, target[index]])
) as Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number>;
assert.ok(Math.abs((correlateRiasecProfiles(targetScores, target) || 0) - 1) < 1e-10);

const major = {
  codeTT09: '7480201',
  name: 'Công nghệ thông tin',
  sector: 'CNTT_BAN_DAN_AI'
};
const noEvidence = rankMajorsByEvidence([major], null, '');
assert.equal(noEvidence.length, 0);

const textPreview = rankMajorsByEvidence([major], null, 'Tôi thích lập trình và máy tính');
assert.equal(textPreview.length, 1);
assert.equal(textPreview[0].interestSimilarityIndex, null);
assert.equal(textPreview[0].recommendationBasis, 'TEXT_EXPLORATION');

const completeProfile = createRiasecProfileFromNormalizedScores(targetScores);
assert.ok(completeProfile);
const measuredSuggestion = rankMajorsByEvidence([major], completeProfile, '');
assert.equal(measuredSuggestion[0].interestSimilarityIndex, 100);
assert.equal(measuredSuggestion[0].recommendationBasis, 'RIASEC_PROFILE');

console.log('recommendationEngine: 7 checks passed');
