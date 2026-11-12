import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/data/cases.js';
import { getCaseDetails } from '../src/data/caseCatalog.js';
import { CASE_META, CASE_IDS } from '../src/data/linkedSkills.js';
import { getInvestigationReview } from '../src/utils/investigationReport.js';
import { readRoute, getBlackBoxLearningLink } from '../src/utils/routes.js';

const newIds = Array.from({ length: 12 }, (_, index) => `INC-${1201 + index}`);
const legacyIds = ['INC-0417', 'INC-0512', 'INC-0633', 'INC-0701', 'INC-0755', 'INC-0812', 'INC-0890', 'INC-0944', 'INC-1002', 'INC-1055', 'INC-1101', 'INC-1102', 'INC-1103', 'INC-1104', 'INC-1105', 'INC-1106'];
const batch = () => newIds.map(id => CASES.find(item => item.id === id));

test('the expansion adds twelve distinct cases while retaining every existing case and receipt identifier', () => {
  assert.equal(CASES.length, 28);
  assert.equal(new Set(CASES.map(item => item.id)).size, CASES.length);
  assert.deepEqual(CASES.map(item => item.id), [...legacyIds, ...newIds]);
  assert.deepEqual(CASE_IDS, CASES.map(item => item.id));
});

test('new cases span eight skills with six intermediate and six advanced investigations', () => {
  const details = batch().map(getCaseDetails);
  assert.equal(details.filter(item => item.difficulty === 'intermediate').length, 6);
  assert.equal(details.filter(item => item.difficulty === 'advanced').length, 6);
  assert.equal(new Set(details.map(item => item.category)).size, 8);
  for (const item of batch()) {
    const label = getCaseDetails(item);
    assert.equal(CASE_META[item.id].title, label.title);
    assert.equal(CASE_META[item.id].skillId, label.category);
    assert(/[\u0600-\u06ff]/.test(label.title));
  }
});

test('each new investigation can render all stages and has exactly one strongest evidence and highest response', () => {
  for (const item of batch()) {
    assert(item, 'missing new case');
    for (const key of ['id', 'incidentTitle', 'severity', 'meta', 'brief', 'logCommand', 'evidenceQuestion', 'evidenceFeedbackCorrect', 'evidenceFeedbackIncorrect', 'decisionQuestion']) {
      assert.equal(typeof item[key], 'string', `${item.id}: ${key}`);
      assert(item[key].trim().length > 0, `${item.id}: empty ${key}`);
    }
    assert(item.logLines.length >= 6, `${item.id}: sufficient correlated events`);
    assert(item.logLines.every(line => typeof line === 'string' && line.trim()));
    assert.equal(item.evidenceOptions.length, 3);
    assert.equal(item.evidenceOptions.filter(option => option.correct === true).length, 1);
    assert.equal(new Set(item.evidenceOptions.map(option => option.id)).size, item.evidenceOptions.length);
    assert(item.evidenceOptions.every(option => typeof option.correct === 'boolean' && option.label.trim()));
    assert.equal(item.decisions.length, 4);
    assert.equal(item.decisions.filter(option => option.points === 40).length, 1);
    assert.equal(new Set(item.decisions.map(option => option.id)).size, item.decisions.length);
    assert(item.decisions.every(option => Number.isInteger(option.points) && option.points >= 0 && option.points <= 40 && option.label.trim() && option.outcome.trim()));
    assert.deepEqual(readRoute(`https://cybertracelab.dev/?case=${item.id}`, CASES), { view: 'investigation', caseId: item.id });
    const practice = new URL(getBlackBoxLearningLink(item.id).url);
    assert.equal(practice.origin, 'https://blackboxlab.dev');
    assert.equal(practice.searchParams.get('track'), CASE_META[item.id].trackIds[0] ?? null, `${item.id}: practical follow-up agrees with the linked catalogue`);
  }
});

test('all possible new-case choices produce valid scored reviews and preserve the seventy-point ceiling', () => {
  const at = '2026-11-12T12:00:00.000Z';
  for (const item of batch()) {
    for (const evidence of item.evidenceOptions) for (const decision of item.decisions) {
      const score = (evidence.correct ? 30 : 10) + decision.points;
      const result = { attempts: 1, lastScore: score, bestScore: score, lastCompletedAt: at };
      const review = getInvestigationReview(item, evidence.id, decision.id, result);
      assert(review, `${item.id}: ${evidence.id}/${decision.id}`);
      assert.equal(review.totalScore, score);
      assert.equal(review.completedAt, at);
      assert(score <= 70);
    }
  }
});
