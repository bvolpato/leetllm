import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, prefixPriceConstruction } from '../animations/token-economics.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { timelineFromMeasuredFixture } from './helpers/measured-narration.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredWrap() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/token-economics.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'wrap');
  // These measured words cover the two unchanged receipt-return/grouping beats.
  // The new prediction/reveal split has no measured speech fixture yet.
  const scene = {
    ...lesson.scenes[sceneIndex],
    beats: lesson.scenes[sceneIndex].beats.slice(0, 2),
  };
  const fixture = JSON.parse(
    await readFile(
      new URL('./fixtures/measured-narration/token-economics.json', import.meta.url),
      'utf8',
    ),
  );
  fixture.scenes = fixture.scenes
    .filter((s) => s.id === 'wrap')
    .map((s) => ({ ...s, beats: s.beats.slice(0, 2), sounds: s.sounds.slice(0, 2) }));
  const measured = timelineFromMeasuredFixture(fixture, { ...lesson, scenes: [scene] }).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((cue) => cue.id === 'payoff-receipts');
  assert(cue, 'the receipt-return clause must resolve from measured words');
  const canvas = createCanvas(1920, 1080);
  const paint = (time) =>
    drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, sceneIndex, lesson.scenes.length),
      draw,
    );
  return { cue, paint };
}

const visibleLabels = (audit) =>
  audit.labels.filter((label) => label.alpha > 0.8).map((label) => label.text);

test('all three real receipt records are visible throughout their measured return clause', async () => {
  const { cue, paint } = await measuredWrap();
  for (const time of [3.3, 4.166666666666667, 4.8, 5.033333333333333, 5.233333333333333, cue.end]) {
    const audit = paint(time);
    assert.deepEqual(
      layoutIssues(audit),
      [],
      `measured receipt return at ${time}s must have visible focus targets`,
    );
    const labels = visibleLabels(audit);
    for (const [index, id] of ['C-A1', 'C-B1', 'C-B2'].entries()) {
      assert(
        labels.some((label) => label.startsWith(id + ' · ')),
        `${id} must be an actual labeled receipt`,
      );
      assert(
        audit.targets.some(
          (target) =>
            target.id === 'payoff-receipt-' + index &&
            target.alpha > 0.8 &&
            target.width > 389.9 &&
            target.height > 79.9 &&
            target.markCounts.shapes > 0 &&
            target.markCounts.labels > 0,
        ),
        `${id} must have a visible painted receipt boundary`,
      );
    }
  }
});

test('receipt payloads and spend accumulate in order, complete by clause end, and hold', async () => {
  const { cue, paint } = await measuredWrap();
  const before = visibleLabels(paint(cue.start - 0.05));
  assert(
    !before.some((label) => /^C-[AB][12] · /.test(label)),
    'receipts must wait for their return clause',
  );
  for (const [progress, count] of [
    [0.1, 0],
    [0.5, 1],
    [0.9, 2],
    [1, 3],
  ]) {
    const labels = visibleLabels(paint(cue.start + (cue.end - cue.start) * progress));
    for (const [index, id] of ['C-A1', 'C-B1', 'C-B2'].entries()) {
      const outcome = index === 1 ? 'FAIL' : 'ACCEPT';
      assert.equal(
        labels.includes(id + ' · ' + outcome),
        index < count,
        `${id} outcome must wait until its receipt has arrived`,
      );
    }
    const expected =
      count === 3
        ? 'All 3 receipts remain in spend · $0.01371'
        : `${count} / 3 receipts added to spend · $${(count * 0.00457).toFixed(5)}`;
    assert(
      labels.includes(expected),
      'spend must contain exactly the completed receipts, including the failure',
    );
    assert(
      !labels.some((label) => label.startsWith('Task B · one accepted result')),
      'task grouping belongs to the next spoken clause',
    );
  }
  const held = visibleLabels(paint(cue.end + 0.8));
  assert(held.includes('C-A1 · ACCEPT'));
  assert(held.includes('C-B1 · FAIL'));
  assert(held.includes('C-B2 · ACCEPT'));
  assert(held.includes('All 3 receipts remain in spend · $0.01371'));
});

test('revealing a supplied prefix receipt preserves its exact billing categories', () => {
  const frames = [0, 0.25, 0.5, 0.75, 1].map((beatP) =>
    prefixPriceConstruction({ beat: 0, beatP }),
  );
  assert(frames[0].progress < frames.at(-1).progress);
  for (const frame of frames) {
    assert.equal(frame.ordinary, 520);
    assert.equal(frame.cached, 1280);
    assert.equal(frame.ordinary + frame.cached, 1800);
    assert.equal(frame.output, 180);
    assert.equal(frame.charge, 0.00432);
  }
});

test('the separate prediction beat holds the per-accepted-task reversal', async () => {
  const lesson = await readLesson(
      path.join(root, 'videos/lessons/token-economics.lesson.yaml'),
      root,
    ),
    scene = lesson.scenes.find((s) => s.id === 'wrap');
  const canvas = createCanvas(1920, 1080),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          {
            ...c,
            progress: i < 3 ? 1 : 0,
            phase: i < 3 ? 'after' : 'before',
            active: false,
            strength: 0,
          },
        ]),
      ),
    );
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { t: 40, duration: 60, beat: 2, beatP: 1, opacity: 1, cues, cueTiming: 'provider-words' },
    draw,
  );
  assert.deepEqual(layoutIssues(audit), []);
  const labels = visibleLabels(audit);
  assert(labels.includes('All 3 receipts remain in spend · $0.01371'));
  assert(
    !labels.some(
      (s) => s.includes('0.006855') || s.includes('retry makes accepted work more expensive'),
    ),
  );
});
