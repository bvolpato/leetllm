import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findLabelCollisions } from '../lib/label-collisions.mjs';

const model = await import(
  process.env.PROBABILITY_ANIMATION
    ? pathToFileURL(process.env.PROBABILITY_ANIMATION).href
    : new URL('../animations/probability.mjs', import.meta.url).href
);
registerLessonFonts();

const cue = (progress) => ({
  progress,
  reveal: progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  active: false,
  strength: 0,
  targets: [],
});
function paint(id, beat, cues = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'Would you trust this flag?' },
    { beat, beatP: 0.5, t: 10, duration: 30, opacity: 1, cueTiming: 'provider-words', cues },
    model.draw,
  );
  assert.deepEqual(
    [...audit.issues, ...layoutIssues(audit), ...findLabelCollisions(audit.labels)],
    [],
    id + ' native geometry',
  );
  return {
    ...audit,
    canvas,
    pixels: (x, y, w, h) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, w, h).data)
        .digest('hex'),
  };
}
const has = (frame, value) => frame.labels.some((label) => label.text === value);
const ids = (frame) => frame.labels.filter((label) => /^[AC]\d+–\d+$/.test(label.text));
const at = (frame, id) => {
  const rows = ids(frame).filter((label) => label.text === id);
  assert.equal(rows.length, 1, id + ' has one visible identity');
  return { x: rows[0].x, y: rows[0].y };
};

test('conditioning retains the actual intersection while selecting two different denominators', () => {
  const before = paint('conditional', 0, { 'select-flagged': cue(0), 'reverse-condition': cue(0) });
  const flagged = paint('conditional', 1, {
    'conditional-result': cue(1),
    'reverse-condition': cue(0),
  });
  const reversed = paint('conditional', 2, { 'reverse-condition': cue(1) });
  assert(has(before, 'Eligible: all 10,000 rows'));
  assert(has(flagged, 'P(abuse | flag) = 95 / 590 ≈ 16.1%'));
  assert(has(reversed, 'P(flag | abuse) = 95 / 100 = 95%'));
  assert.equal(
    ids(flagged).length,
    13,
    'the eligible flagged cohort contains all actual packet identities',
  );
  assert(ids(flagged).some((label) => label.text === 'C1–50'));
  assert(
    !ids(reversed).some((label) => label.text.startsWith('C')),
    'reversing the condition removes every clean packet',
  );
  assert.deepEqual(
    at(reversed, 'A1–50'),
    at(flagged, 'A1–50'),
    'the same abusive intersection stays fixed',
  );
  assert.notEqual(
    before.pixels(260, 780, 1450, 130),
    flagged.pixels(260, 780, 1450, 130),
    'passed cohorts physically leave the eligible region',
  );
});

test('a copied clean packet survives both checks without creating new evidence', () => {
  const before = paint('copied-evidence', 0, { 'copied-pass': cue(0) });
  assert(!has(before, 'C200–249 · clean'));
  assert(!has(before, 'Copied selection: 95 / 590 ≈ 16.1%'));
  const after = paint('copied-evidence', 1, { 'copied-pass': cue(1), 'copied-result': cue(1) });
  assert(
    at(after, 'C200–249').x > at(before, 'C200–249').x + 800,
    'the same clean source members pass the copied check',
  );
  assert.equal(ids(before).length, ids(after).length);
  assert(has(after, 'Copied selection: 95 / 590 ≈ 16.1%'));
  const different = paint('copied-evidence', 2, { 'independent-counterfactual': cue(1), 'independent-risk': cue(1) });
  assert(has(different, '100 × 0.95² = 90.25 abuse · 9,900 × 0.05² = 24.75 clean'));
  assert(has(different, 'Expected joint-flag risk: 90.25 / (90.25 + 24.75) ≈ 78.5%'));
  assert(has(different, 'Two independent tests within each class'));
});

test('a strict threshold releases original members and the improved detector recovers that same abusive packet', () => {
  const broad = paint('decisions', 0, { 'strict-removal': cue(0) });
  const strict = paint('decisions', 2, { 'policy-choice': cue(1) });
  assert(has(strict, 'Queue: 179 · abusive: 80 · clean: 99'));
  assert(has(strict, '15 added misses'));
  assert(has(strict, '396 clean released'));
  assert(has(strict, 'Total abuse missed: 20'));
  assert(has(broad, 'A81–95') && !has(strict, 'A81–95'));
  assert(has(strict, 'C51–99') && !has(strict, 'C100–149'));
  const prediction = paint('payoff', 0, { 'improved-prediction': cue(1) });
  assert(!has(prediction, 'A81–95'), 'the answer stays withheld during the final prediction hold');
  assert(!has(prediction, '194 ≤ 200 · 5 missed · improved detector'));
  const recovered = paint('payoff', 2, { 'improved-result': cue(1) });
  assert(has(recovered, 'A81–95'));
  assert.deepEqual(
    at(recovered, 'A81–95'),
    at(broad, 'A81–95'),
    'recovery restores the original cohort identity and position',
  );
  assert(has(recovered, 'Queue: 194 · abusive: 95 · clean: 99'));
  assert(has(recovered, 'Total abuse missed: 5'));
  assert(has(recovered, '194 ≤ 200 · 5 missed · improved detector'));
});

test('returning and leaving abusive cohorts use the cleared lower lane through intermediate native states', () => {
  for (let i = 1; i < 100; i++) {
    paint('payoff', 1, { 'improved-recovery': cue(i / 100) });
    paint('decisions', 0, { 'strict-removal': cue(i / 100) });
  }
});

test('counts and probabilities come from disjoint exact row memberships', () => {
  assert.equal(model.validateModel(), true);
  assert.equal(model.queuePackets.length, 13);
  const all = new Set();
  for (const packet of model.queuePackets)
    for (let row = packet.first; row < packet.first + packet.count; row++) {
      const id = (packet.abusive ? 'A' : 'C') + row;
      assert(!all.has(id));
      all.add(id);
    }
  assert.equal(all.size, 590);
  const completed = model.queueSnapshot(2, 0);
  assert.deepEqual([completed.abusive, completed.clean, completed.total], [95, 495, 590]);
  const firstOnly = model.queueSnapshot(1, 0.5, {
    'queue-abuse-arrivals': cue(1),
    'queue-clean-arrivals': cue(0),
  });
  assert.deepEqual([firstOnly.abusive, firstOnly.clean, firstOnly.total], [95, 0, 95]);
  assert.equal(firstOnly.totalReady, false);
  assert.equal(model.posterior(0.01, 0, 0), null);
  assert(Math.abs(model.posterior(0.01, 0.2, 0.2) - 0.01) < 1e-12);
  assert(Math.abs(model.posterior(0.1) - 950 / 1400) < 1e-12);
});

test('the likelihood varies the candidate while keeping all observed labels and products coherent', () => {
  for (const p of [0, 0.17, 0.5, 0.8, 1]) {
    const state = model.likelihoodSnapshot(1, 0.5, { 'likelihood-candidate': cue(p) });
    assert.deepEqual(state.factors, [state.p, 1 - state.p, state.p]);
    assert(Math.abs(state.product - state.p ** 2 * (1 - state.p)) < 1e-12);
  }
  const partial = model.likelihoodSnapshot(0, 0, { 'likelihood-factors': cue(0.5) });
  assert.equal(partial.count, 1);
  assert.equal(partial.product, 0.2);
  const peak = model.likelihoodSnapshot(2, 0.5, { 'likelihood-maximum': cue(1) });
  assert(Math.abs(peak.p - 2 / 3) < 1e-12);
  assert(Math.abs(peak.product - 4 / 27) < 1e-12);
});

test('provider-word windows stage each source count and keep the final recovery answer withheld', async () => {
  const [{ readLesson, frameState }, { resolveSceneCues }, { timelineFromMeasuredFixture }] =
    await Promise.all([
      import('../lib/lesson.mjs'),
      import('../lib/narration-cues.mjs'),
      import('./helpers/measured-narration.mjs'),
    ]);
  const lesson = await readLesson(
    new URL('../lessons/probability.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  );
  const fixture = JSON.parse(
    await readFile(
      new URL('./fixtures/measured-narration/probability.json', import.meta.url),
      'utf8',
    ),
  );
  // These unchanged chapters retain their actual provider words. New chapters await new audio.
  const measured = timelineFromMeasuredFixture(
    {
      ...fixture,
      scenes: fixture.scenes.filter((scene) => ['filter', 'payoff'].includes(scene.id)),
    },
    lesson,
  );
  const inspect = (sceneId, cueId, offset = 1 / 30) => {
    const index = lesson.scenes.findIndex((scene) => scene.id === sceneId),
      scene = lesson.scenes[index];
    const data = measured.scenes.find((scene) => scene.id === sceneId);
    assert.deepEqual(
      data.beats.map((beat) => [beat.say, beat.hold]),
      scene.beats.map((beat) => [beat.say, beat.hold]),
    );
    const timing = {
      ...data,
      cueTiming: 'provider-words',
      visualCues: resolveSceneCues(scene, data),
    };
    const cue = timing.visualCues.find((cue) => cue.id === cueId);
    assert(cue);
    const state = frameState(timing, cue.end + offset, index, lesson.scenes.length);
    const canvas = createCanvas(1920, 1080);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, model.draw);
    assert.deepEqual(
      [...audit.issues, ...layoutIssues(audit), ...findLabelCollisions(audit.labels)],
      [],
    );
    return { audit, state };
  };
  const abuse = inspect('filter', 'queue-abuse-arrivals');
  const first = model.queueSnapshot(abuse.state.beat, abuse.state.beatP, abuse.state.cues);
  assert.deepEqual([first.abusive, first.clean], [95, 0]);
  const clean = inspect('filter', 'queue-clean-arrivals');
  const both = model.queueSnapshot(clean.state.beat, clean.state.beatP, clean.state.cues);
  assert.deepEqual([both.abusive, both.clean, both.totalReady], [95, 495, false]);
  assert(has(inspect('filter', 'queue-total').audit, 'Queue = 95 + 495 = 590 rows'));
  const prediction = inspect('payoff', 'improved-prediction');
  assert(!has(prediction.audit, 'A81–95'));
  assert(!has(prediction.audit, '194 ≤ 200 · 5 missed · improved detector'));
  const held = inspect('payoff', 'improved-result').audit;
  assert(has(held, 'A81–95'));
  assert(has(held, '194 ≤ 200 · 5 missed · improved detector'));
});
