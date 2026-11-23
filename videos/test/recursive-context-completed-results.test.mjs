import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { timelineFromMeasuredFixture } from './helpers/measured-narration.mjs';

const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/recursive-context.lesson.yaml', root);
const { draw } = await import(
  process.env.RC_DRAW_MODULE
    ? pathToFileURL(process.env.RC_DRAW_MODULE)
    : new URL('../animations/recursive-context.mjs', import.meta.url)
);
const fixture = JSON.parse(
  await fs.readFile(
    new URL(
      './fixtures/measured-narration/recursive-context.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const timeline = timelineFromMeasuredFixture(fixture, lesson);
function paint(id, cueId, phase) {
  const scene = lesson.scenes.find((s) => s.id === id),
    i = lesson.scenes.indexOf(scene),
    timing = structuredClone(timeline.scenes.find((s) => s.id === id));
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const c = timing.visualCues.find((c) => c.id === cueId);
  assert(c);
  const time = phase === 'after' ? c.end + 0.01 : c.start + (c.end - c.start) * 0.6,
    canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d'),
    paints = [],
    fillText = ctx.fillText.bind(ctx);
  ctx.fillText = (text, ...args) => {
    paints.push({ text: String(text), fill: ctx.fillStyle, alpha: ctx.globalAlpha });
    return fillText(text, ...args);
  };
  return {
    ...drawFrame(ctx, lesson, scene, frameState(timing, time, i, lesson.scenes.length), draw),
    paints,
  };
}
const has = (a, s) => a.labels.some((l) => l.alpha > 0.1 && l.text.includes(s));

test('typed validation keeps its candidate pending until the complete shape-and-pointer result', () => {
  const during = paint('completion', 'typed-result', 'during'),
    after = paint('completion', 'typed-result', 'after');
  assert(!has(during, 'Accepted candidate'));
  assert(has(during, 'validation pending'));
  assert(has(after, 'Accepted candidate'));
  assert(has(after, '2026-09-30 [page 6]'));
});
test('root settlement retains charged capacity until the completed reconciliation', () => {
  const during = paint('shared-budget', 'settle-root', 'during'),
    after = paint('shared-budget', 'settle-root', 'after');
  assert(has(during, 'in flight'));
  assert(has(during, '8.0 cost units'));
  assert(!has(during, 'settled'));
  assert(has(after, 'settled'));
  assert(has(after, '8.5 cost units'));
});
test('an applicable conflicting input precedes the computed conflict verdict', () => {
  const during = paint('source-lineage', 'computed-conflict', 'during'),
    after = paint('source-lineage', 'computed-conflict', 'after');
  assert(has(during, 'bulletin-v13/p2'));
  assert(has(during, 'Comparison pending'));
  assert(!has(during, 'conflict'));
  assert(has(after, 'conflict'));
});
test('each supplied route is evaluated before the selected route is revealed', () => {
  for (const cue of ['direct-recall-result', 'recursive-limit-result', 'eligible-route']) {
    const during = paint('complexity-and-choice', cue, 'during'),
      after = paint('complexity-and-choice', cue, 'after');
    assert(!has(during, 'Selected: REPL only'));
    assert(during.targets.some((t) => t.id === 'selected-route'));
    if (cue === 'eligible-route') assert(has(after, 'Selected: REPL only'));
    else assert(!has(after, 'Selected: REPL only'));
  }
  const before = paint('complexity-and-choice', 'direct-recall-result', 'during'),
    values = before.paints.filter(
      (l) => l.alpha > 0.1 && ['0.73', '0.92', '0.58'].includes(l.text),
    );
  assert.equal(values.length, 3);
  assert.equal(
    new Set(values.map((x) => x.fill)).size,
    1,
    'supplied numbers retain neutral ink before their predicates',
  );
});
test('the complete character plan earns the leaf/request summary', () => {
  assert(!has(paint('baseline-contract', 'character-plan', 'during'), '16 leaves · 31 requests'));
  assert(has(paint('baseline-contract', 'character-plan', 'after'), '16 leaves · 31 requests'));
});
test('the outer-loop candidate follows its demonstrated two-step result', () => {
  assert(
    !has(paint('history-cap', 'history-candidate', 'during'), 'Two steps produce a candidate'),
  );
  assert(has(paint('history-cap', 'history-candidate', 'after'), 'Two steps produce a candidate'));
});
test('both fresh questions have a neutral prediction hold before their answers', () => {
  const s = lesson.scenes.find((s) => s.id === 'fresh-exception');
  for (const [cue, questionEnd, answerStart] of [
    ['fresh-fact-half', 'predict exact recall.', 'It is one half.'],
    ['fresh-route', 'Predict the lowest-cost eligible choice.', 'Direct qualifies'],
  ]) {
    const answerIndex = s.beats.findIndex((beat) =>
      beat.visual_cues?.some((item) => item.id === cue),
    );
    assert(answerIndex > 0);
    const prediction = s.beats[answerIndex - 1];
    assert(prediction.say.trim().endsWith(questionEnd));
    assert(prediction.hold >= 1.5);
    assert.equal(prediction.visual_cues, undefined);
    assert(s.beats[answerIndex].say.startsWith(answerStart));
  }
});
