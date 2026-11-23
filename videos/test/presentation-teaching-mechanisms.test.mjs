import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

import {
  sourceWaitBudget,
  interruptedBudget,
  freshEvidence,
  draw,
} from '../animations/ai-lab-technical-presentation.mjs';

registerLessonFonts();
const lesson = await readRepositoryLesson(
  'videos/lessons/ai-lab-technical-presentation.lesson.yaml',
);
function paint(id, beat, phases = {}, beatP = 0.5) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = {};
  scene.beats.forEach((b, i) =>
    (b.visual_cues ?? []).forEach((c) => {
      const setting = phases[c.id] ?? (i < beat ? 'after' : 'before'),
        phase = typeof setting === 'number' ? 'during' : setting;
      cues[c.id] = {
        ...c,
        phase,
        progress:
          typeof setting === 'number'
            ? setting
            : phase === 'before'
              ? 0
              : phase === 'during'
                ? 0.5
                : 1,
        strength: 0,
        active: false,
      };
    }),
  );
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { beat, beatP, t: 10, duration: 70, opacity: 1, cueTiming: 'synthetic-test-phases', cues },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return frame;
}
const words = (frame) => frame.labels.map((x) => x.text);

test('the repaired fresh identities conserve the population and leave the baseline unchanged', () => {
  const before = freshEvidence(false),
    after = freshEvidence(true);
  assert.equal(before.n, 40);
  assert.equal(after.n, 40);
  assert.equal(before.baselineHits, 21);
  assert.equal(after.baselineHits, 21);
  assert.equal(before.candidateHits, 24);
  assert.equal(after.candidateHits, 26);
  const changed = before.rows
    .filter((r, i) => r.candidate !== after.rows[i].candidate)
    .map((r) => r.id);
  assert.deepEqual(changed, ['new-18', 'new-19']);
  assert.deepEqual(after.counts, { both: 20, baselineOnly: 1, candidateOnly: 6, neither: 13 });
  assert.equal(after.percentagePointChange, 12.5);
  assert(!after.service.passes);
  assert.equal(after.service.successFraction, 0.975);
});

test('the fresh result is withheld until its own spoken calculation, after the two identities move', () => {
  const held = paint('fresh-evidence', 1, { 'fresh-repair': 'after' });
  assert(words(held).includes('Both: 20'));
  assert(!words(held).some((x) => x.includes('candidate 26/40') || x.includes('+12.5')));
  const total = paint('fresh-evidence', 1, { 'fresh-repair': 'after', 'fresh-candidate': 'after' });
  assert(words(total).includes('Baseline 21/40 → candidate 26/40'));
  assert(!words(total).some((x) => x.includes('+12.5')));
  const complete = paint('fresh-evidence', 1, {
    'fresh-repair': 'after',
    'fresh-candidate': 'after',
    'fresh-points': 'after',
  });
  assert(words(complete).includes('+12.5 percentage points · one regression remains'));
});

test('moving both repaired query tiles through the aisle never hides another retained identity', () => {
  for (const progress of [0, 0.1, 1 / 3, 0.5, 0.7, 1])
    paint('fresh-evidence', 1, { 'fresh-repair': progress });
});

test('a repeated cursor is compared with the set rather than inserted as a second owned identity', () => {
  const first = paint('failure-invariant', 1, { 'cursor-first': 'after' });
  assert(words(first).includes('page 1 → C-17'));
  assert(!words(first).includes('Candidate repeats · not inserted'));
  const repeated = paint('failure-invariant', 1, {
    'cursor-first': 'after',
    'cursor-repeat': 'after',
    'cursor-stop': 'after',
  });
  assert(words(repeated).includes('Candidate repeats · not inserted'));
  assert(words(repeated).includes('INCOMPLETE · stop before request 3'));
  for (const phase of ['before', 'during', 'after'])
    paint('failure-invariant', 1, { 'cursor-first': phase });
});

test('an added service boundary preserves both old components and adds exactly its own hop', () => {
  const s = sourceWaitBudget();
  assert.equal(s.after - s.before, s.hop);
  assert.equal(s.wait, 1000);
  assert.equal(s.before, 1200);
  assert.equal(s.after, 1220);
  const frame = paint('source-wait', 0, {
    'wait-other': 'after',
    'wait-before': 'after',
    'wait-hop': 'after',
    'wait-after': 'after',
  });
  assert(words(frame).includes('1200 ms total'));
  assert(words(frame).includes('1220 ms total'));
  assert.equal(
    frame.shapes.filter(
      (s) =>
        s.kind === 'rect' && Math.abs(s.width - (1450 * 1000) / 1300) < 1e-6 && s.height === 70,
    ).length,
    2,
  );
});

test('the question consumes three real minutes and the repaired continuation fits the six that remain', () => {
  const b = interruptedBudget();
  assert.equal(b.remaining, 6);
  assert(b.oldContinuation > b.remaining);
  assert.equal(b.newContinuation, b.remaining);
  const frame = paint('interrupted-rehearsal', 0, {
    'talk-question': 'after',
    'talk-remaining': 'after',
    'talk-overflow': 'after',
  });
  assert(
    frame.shapes.some(
      (s) => s.kind === 'rect' && s.x === 820 && s.width === 281 && s.height === 75,
    ),
  );
  assert(words(frame).includes('Original 3 + 3 + 1 = 7 · exceeds remaining 6'));
  assert(
    words(paint('interrupted-rehearsal', 1, { 'talk-repair': 'after' })).includes(
      '2 + 3 + 1 = 6 · fits the remaining slot',
    ),
  );
});

test('a numeric hit fails after the same ID join that accepts reversed dictionary order', () => {
  const valid = paint('typed-comparison', 0, { 'typed-order': 'after' });
  assert(words(valid).some((x) => x.startsWith('Same IDs · literal Booleans')));
  const invalid = paint('typed-comparison', 1, { 'typed-reject': 'after' });
  assert(words(invalid).includes('REJECT · numeric 1 is not a Boolean hit'));
});

test('a retrieval improvement leaves the independently failed availability gate held', () => {
  const before = paint('fresh-evidence', 2, { 'fresh-service': 'before', 'fresh-hold': 'before' });
  assert(!words(before).some((x) => x.startsWith('HOLD')));
  const after = paint('fresh-evidence', 2, { 'fresh-service': 'after', 'fresh-hold': 'after' });
  assert(words(after).includes('p95 780 ms PASS · 39/40 = 97.5% FAIL'));
  assert(words(after).includes('HOLD · retrieval gain cannot repair availability'));
});
