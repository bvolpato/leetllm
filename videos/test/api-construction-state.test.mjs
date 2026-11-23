import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { draw, apiChapterState } from '../animations/calling-llm-apis-production.mjs';
registerLessonFonts();
const paint = (id, beat, p, cues = {}, opacity = 1) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'API construction' },
    {
      t: 1,
      duration: 30,
      opacity,
      beat,
      beatP: p,
      cues: {
        ['ap-' + id + '-' + beat]: { phase: p === 1 ? 'after' : 'during', progress: p },
        ...cues,
      },
    },
    draw,
  );
test('restarting the process removes the displayed dictionary entry', () => {
  const before = paint('write-uncertainty', 0, 0.5),
    after = paint('write-uncertainty', 0, 1);
  assert(before.labels.some((l) => l.text === '7e3b → JOB-001'));
  assert(!after.labels.some((l) => l.text === '7e3b → JOB-001'));
  assert(after.labels.some((l) => l.text.includes('empty after restart')));
});
test('the normalized stream retains its exact account bytes', () => {
  const frame = paint('stream-failures', 0, 1);
  assert(frame.labels.some((l) => l.text === 'acct_10234 '));
  assert.equal('Account acct_10234 is eligible under P-7.'.length, 41);
  assert.equal(apiChapterState('stream-failures', { beat: 0, beatP: 1 }).length, 41);
});
test('a job is displayed only after the dispatched intent reaches the destination', () => {
  const early = paint('idempotency', 1, 0.1),
    created = paint('idempotency', 1, 0.65);
  assert(!early.labels.some((l) => l.text === 'JOB-001 · count 1'));
  assert(created.labels.some((l) => l.text === 'JOB-001 · count 1'));
});
test('the unknown-outcome receipt does not display a successful validation step', () => {
  const frame = paint('failure-receipt', 2, 1);
  assert(!frame.labels.some((l) => l.text === 'validate → okay'));
  assert(frame.labels.some((l) => l.text === 'named failure'));
});
test('the admitted recovery probe stays clear of both breaker return paths', () => {
  for (const opacity of [1, 0.95, 0.5, 0.26])
    for (let i = 0; i <= 20; i++) {
      const frame = paint('circuit-breaker', 2, i / 20, {}, opacity);
      assert.deepEqual(layoutIssues(frame), [], `probe progress ${i / 20}, opacity ${opacity}`);
    }
});

test('a fresh candidate stays neutral until its rejection clause completes', () => {
  const painted = (beat, candidatePhase, candidateProgress, paragraphProgress) => {
    const canvas = createCanvas(1920, 1080),
      ctx = canvas.getContext('2d');
    const audit = drawFrame(
      ctx,
      {},
      { id: 'fresh-request', title: 'Changed policy and budget' },
      {
        t: 1,
        duration: 30,
        opacity: 1,
        beat,
        beatP: 0.5,
        cues: {
          ['ap-fresh-request-' + beat]: { phase: 'during', progress: paragraphProgress },
          'ap-fresh-candidate-rejected': { phase: candidatePhase, progress: candidateProgress },
        },
      },
      draw,
    );
    return { audit, border: [...ctx.getImageData(220, 435, 1, 1).data] };
  };
  const neutral = painted(0, 'before', 0, 0.8),
    rejected = painted(2, 'after', 1, 0.8);
  assert.notDeepEqual(neutral.border, rejected.border, 'positive color endpoints differ');
  for (const [phase, progress] of [
    ['before', 0],
    ['during', 0],
    ['during', 0.5],
    ['during', 0.999999],
  ]) {
    const current = painted(1, phase, progress, 0.4);
    assert.deepEqual(
      current.border,
      neutral.border,
      'candidate remains neutral before completed rejection',
    );
    assert(current.audit.labels.some((l) => l.text === 'returned threshold: 30'));
    assert(!current.audit.labels.some((l) => l.text === 'REJECT: invented threshold'));
  }
  const complete = painted(1, 'after', 1, 0.4);
  assert.deepEqual(
    complete.border,
    rejected.border,
    'completed rejection earns actual pink border',
  );
  assert(
    !complete.audit.labels.some((l) => l.text === '4.2 > 4 → STOP'),
    'independent budget verdict keeps its existing guard',
  );
});
