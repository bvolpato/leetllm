import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { draw } from '../animations/recommendation.mjs';

registerLessonFonts();
const scene = { id: 'eligibility', title: 'Check permission before relevance' };
const scores = ['0.96', '0.91', '0.90', '0.84', '0.80', '0.99', '0.95'];
function paint(
  progress,
  beat = 0,
  phase = progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
) {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  return drawFrame(
    ctx,
    {},
    scene,
    {
      beat,
      beatP: 0.99,
      t: 13,
      duration: 38,
      opacity: 1,
      cues: {
        'eligibility-filter-out': {
          phase,
          progress,
          active: false,
          strength: 0,
          targets: ['eligibility-simulation-6'],
        },
      },
    },
    draw,
  );
}
function scoreLabel(audit, value) {
  const labels = audit.labels.filter((label) => label.alpha > 0.9 && label.text.includes(value));
  assert.equal(labels.length, 1, `${value} keeps one visible owner`);
  return labels[0];
}

test('the narration cue moves excluded document scores out of the pool while survivors keep their identities', () => {
  const before = paint(0),
    after = paint(1);
  for (const value of ['0.99', '0.95']) {
    assert(scoreLabel(before, value).x < 1240);
    assert(
      scoreLabel(after, value).x > 1240,
      `${value} must leave the eligible pool despite its high score`,
    );
  }
  for (const value of scores.slice(0, 5)) {
    const first = scoreLabel(before, value),
      last = scoreLabel(after, value);
    assert.deepEqual(
      [last.x, last.y],
      [first.x, first.y],
      `${value} stays in the same document row`,
    );
  }
  assert(after.labels.some((label) => label.text === '5'));
});

test('the visible count changes only after each excluded document crosses out of the pool', () => {
  const firstExited = paint(0.52);
  assert(scoreLabel(firstExited, '0.99').x > 1240);
  assert(scoreLabel(firstExited, '0.95').x < 1240);
  assert(firstExited.labels.some((label) => label.text === '6'));
  for (const beat of [1, 2]) {
    const held = paint(1, beat);
    assert(held.labels.some((label) => label.text === '5'));
    assert(scoreLabel(held, '0.99').x > 1240);
    assert(scoreLabel(held, '0.95').x > 1240);
  }
});

test('all seven score identities remain legible and collision-free throughout filtering', () => {
  for (let step = 0; step <= 40; step++) {
    const audit = paint(step / 40);
    for (const value of scores) scoreLabel(audit, value);
    assert.deepEqual(layoutIssues(audit), [], `filter progress ${step / 40}`);
  }
});

test('the exclusion follows the late measured phrase rather than the overall beat progress', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/recommendation.lesson.yaml', import.meta.url),
    root,
  );
  const eligibility = lesson.scenes.find((value) => value.id === 'eligibility');
  const opening = { ...eligibility, beats: [eligibility.beats[0]] };
  const timing = makeSceneTimeline(opening, [13.728]);
  const words = [
    ['Start', 0.1, 0.3625],
    ['with', 0.375, 0.525],
    ['seven', 0.5375, 0.8625],
    ['documents', 0.875, 1.6125],
    ['Five', 2.075, 2.2625],
    ['are', 2.275, 2.375],
    ['current', 2.3875, 2.7875],
    ['and', 2.95, 3.025],
    ['permitted', 3.0375, 3.5125],
    ['A', 3.925, 3.9875],
    ['private', 4, 4.4125],
    ['draft', 4.425, 4.7875],
    ['scores', 4.8, 5.2125],
    ['0.99', 5.225, 6.5],
    ['for', 6.5125, 6.675],
    ['retrieval', 6.6875, 7.275],
    ['and', 7.7, 7.7625],
    ['a', 7.775, 7.8125],
    ['stale', 7.825, 8.175],
    ['guide', 8.1875, 8.4625],
    ['scores', 8.475, 8.9],
    ['0.95', 8.9125, 10.2625],
    ['but', 10.5375, 10.6875],
    ['neither', 10.7, 10.9625],
    ['belongs', 10.975, 11.5],
    ['in', 11.5125, 11.675],
    ['this', 11.6875, 11.8625],
    ['request’s', 11.875, 12.4375],
    ['eligible', 12.525, 12.9375],
    ['set', 12.95, 13.35],
  ].map(([text, start, end]) => ({ text, start, end }));
  timing.visualCues = resolveSceneCues(opening, timing, [{ beatIndex: 0, words }]);
  const cue = timing.visualCues.find((value) => value.id === 'eligibility-filter-out');
  assert.equal(cue.start, 10.9375);
  assert.equal(cue.end, 13.75);
  const at = (time) => {
    const ctx = createCanvas(1920, 1080).getContext('2d');
    return drawFrame(ctx, lesson, opening, frameState(timing, time, 1, lesson.scenes.length), draw);
  };
  const before = at(cue.start - 1 / 30),
    oneOut = at(12),
    bothOut = at(13.6);
  assert(before.labels.some((label) => label.text === '7'));
  assert(scoreLabel(before, '0.99').x < 1240);
  assert(scoreLabel(before, '0.95').x < 1240);
  assert(oneOut.labels.some((label) => label.text === '6'));
  assert(scoreLabel(oneOut, '0.99').x > 1240);
  assert(scoreLabel(oneOut, '0.95').x < 1240);
  assert(bothOut.labels.some((label) => label.text === '5'));
  assert(scoreLabel(bothOut, '0.99').x > 1240);
  assert(scoreLabel(bothOut, '0.95').x > 1240);
});
