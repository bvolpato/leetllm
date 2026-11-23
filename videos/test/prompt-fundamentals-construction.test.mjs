import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  maskedProbabilities,
  freshIncidentContract,
  validateModel,
  draw,
} from '../animations/prompt-engineering-fundamentals.mjs';
registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  active: progress > 0 && progress < 1,
  reveal: 1,
  strength: 0,
});
function paint(id, beat, progress, extra = {}) {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  const values = { ['pf-' + id + '-b' + beat]: progress, ...extra };
  const state = {
    beat,
    beatP: progress,
    t: 30,
    duration: 70,
    opacity: 1,
    cues: Object.fromEntries(Object.entries(values).map(([key, p]) => [key, cue(p)])),
  };
  const audit = drawFrame(
    ctx,
    { id: 'prompt-engineering-fundamentals' },
    { id, title: 'Inspect the prompt contract' },
    state,
    draw,
  );
  assert.deepEqual(layoutIssues(audit), [], id + ' native geometry');
  return audit.labels.map((label) => label.text);
}
test('mask preserves legal ratios under a common shift and rejects an empty or invalid legal set', () => {
  const expected = [Math.exp(1) / (Math.exp(1) + 1), 1 / (Math.exp(1) + 1), 0];
  assert.deepEqual(maskedProbabilities([1, 0, 1000], [true, true, false]), expected);
  assert.deepEqual(maskedProbabilities([1001, 1000, -1000], [true, true, false]), expected);
  assert.deepEqual(maskedProbabilities([2, 1, 0, -0.5], [true, false, false, false]), [1, 0, 0, 0]);
  assert.throws(() => maskedProbabilities([1, 0], [false, false]));
  assert.throws(() => maskedProbabilities([NaN, 0], [true, true]));
  assert.deepEqual(maskedProbabilities([0, -Infinity], [true, true]), [1, 0]);
  assert.throws(() => maskedProbabilities([-Infinity, -Infinity], [true, true]));
});
test('fresh recommendation changes every governed field when only the applicable rule is removed', () => {
  const present = freshIncidentContract(true),
    absent = freshIncidentContract(false);
  assert.equal(present.incident, absent.incident);
  assert.deepEqual(present.facts, { ...absent.facts, ruleAvailable: true });
  assert.deepEqual(present.fields, {
    action: 'page_on_call',
    deadline_minutes: 30,
    overdue: true,
    source_line_ids: ['IR-7'],
  });
  assert.deepEqual(absent.fields, {
    action: 'needs_review',
    deadline_minutes: null,
    overdue: null,
    source_line_ids: [],
  });
  assert(validateModel(), 'preserved clock, response and paired-case contracts');
});
test('prediction and rule-removal states hold results until their complete numerical cues', () => {
  const prediction = paint('fresh-boundary', 0, 1);
  assert(prediction.includes('action: ?'));
  assert(!prediction.includes('page_on_call'));
  const result = paint('fresh-boundary', 1, 0.5, {
    'pf-fresh-present': 1,
    'pf-fresh-remove': 0,
    'pf-fresh-fallback': 0,
  });
  assert(result.includes('page_on_call'));
  const removing = paint('fresh-boundary', 1, 0.7, {
    'pf-fresh-present': 1,
    'pf-fresh-remove': 1,
    'pf-fresh-fallback': 0,
  });
  assert(removing.includes('action: ?'));
  assert(!removing.includes('needs_review'));
  const repaired = paint('fresh-boundary', 1, 1, {
    'pf-fresh-present': 1,
    'pf-fresh-remove': 1,
    'pf-fresh-fallback': 1,
  });
  assert(repaired.includes('needs_review'));
  assert(repaired.includes('deadline: null'));
  assert(repaired.includes('overdue: null'));
  assert(repaired.includes('sources: []'));
  assert(paint('grammar-mask', 2, 0.98, { 'pf-mask-result': 0.98 }).includes('P = ?'));
  assert(paint('grammar-mask', 2, 1, { 'pf-mask-result': 1 }).includes('0.731'));
});
test('fresh footers wait for the same complete results as their main fields', () => {
  const presentFooter = '37 > 30 → overdue; accepted recommendation only';
  const fallbackFooter = 'Missing evidence → needs review; no page is dispatched';
  for (const progress of [0, 0.25, 0.5, 0.98]) {
    const present = paint('fresh-boundary', 1, 0.3, {
      'pf-fresh-present': progress,
      'pf-fresh-remove': 0,
      'pf-fresh-fallback': 0,
    });
    assert(present.includes('action: ?'));
    assert(!present.includes(presentFooter));
    const fallback = paint('fresh-boundary', 1, 0.8, {
      'pf-fresh-present': 1,
      'pf-fresh-remove': 1,
      'pf-fresh-fallback': progress,
    });
    assert(fallback.includes('action: ?'));
    assert(!fallback.includes(fallbackFooter));
  }
  assert(
    paint('fresh-boundary', 1, 0.5, {
      'pf-fresh-present': 1,
      'pf-fresh-remove': 0,
      'pf-fresh-fallback': 0,
    }).includes(presentFooter),
  );
  assert(
    paint('fresh-boundary', 1, 1, {
      'pf-fresh-present': 1,
      'pf-fresh-remove': 1,
      'pf-fresh-fallback': 1,
    }).includes(fallbackFooter),
  );
});
test('one decoded closing token pops array before object while retaining the live stack count', () => {
  for (let step = 0; step <= 120; step++) paint('grammar-mask', 3, step / 120);
  assert(paint('grammar-mask', 3, 0).includes('Live stack depth: 2'));
  assert(paint('grammar-mask', 3, 0.7).includes('Live stack depth: 1'));
  const complete = paint('grammar-mask', 3, 1);
  assert(complete.includes('Live stack depth: 0'));
  assert(complete.includes('Combined: {"a":[]}'));
});
