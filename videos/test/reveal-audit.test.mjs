import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import {
  auditSceneReveals,
  captureFillText,
  summarizeRevealSamples,
} from '../lib/reveal-audit.mjs';
import { revealAuditExitCode } from '../audit-reveals.mjs';

registerLessonFonts();

function fixture() {
  const scene = {
    id: 'trace',
    title: 'Reveal the next card',
    beats: [
      { say: 'Inspect the first cards.', hold: 0.4 },
      { say: 'Reveal the third card.', hold: 0.4 },
      { say: 'Check the completed sequence.', hold: 0.4 },
    ],
  };
  const lesson = { id: 'reveal-fixture', scenes: [scene] };
  const timing = makeSceneTimeline(scene, [1, 1, 1], 30);
  const draw = (ctx, _scene, state, api) => {
    const cards = ['Card one', 'Card two', 'Card three', 'Card four'];
    for (const [index, label] of cards.entries()) {
      ctx.save();
      if (index === 2) ctx.globalAlpha = state.beat >= 1 && state.beatP >= 0.5 ? 1 : 0;
      if (index === 3) ctx.globalAlpha = 0;
      api.rect(ctx, 120 + index * 390, 250, 330, 250, '#111d34', '#63deec');
      api.text(ctx, label, 150 + index * 390, 390, 34, '#e9efff');
      ctx.restore();
    }
  };
  return { lesson, scene, timing, draw };
}

test('stable zero-alpha card across multiple beats is reported while a revealed card is not', () => {
  const { lesson, scene, timing, draw } = fixture();
  const result = auditSceneReveals({
    canvas: createCanvas(1920, 1080),
    lesson,
    scene,
    timing,
    draw,
    sceneIndex: 0,
    sceneCount: 1,
  });
  assert.equal(result.sampledFrames, 9);
  assert.ok(result.fillTextCalls > 9);
  assert.deepEqual(
    result.warnings.map((warning) => warning.text),
    ['Card four'],
  );
  assert.equal(result.warnings[0].sampledFrames, 9);
  assert.equal(result.warnings[0].sampledBeats, 3);
  assert.ok(result.samples.every((sample) => sample.fillTextCalls > 0));
});

test('native-context instrumentation preserves drawFrame pixels and captures fillText alpha', () => {
  const { lesson, scene, timing, draw } = fixture();
  const state = frameState(
    timing,
    timing.beats[1].start + (timing.beats[1].until - timing.beats[1].start) * 0.5,
    0,
    1,
  );
  const plain = createCanvas(1920, 1080),
    observed = createCanvas(1920, 1080);
  drawFrame(plain.getContext('2d'), lesson, scene, state, draw);
  const capture = captureFillText(observed.getContext('2d'));
  capture.beginFrame();
  drawFrame(capture.ctx, lesson, scene, state, draw);
  const calls = capture.finishFrame();
  assert.deepEqual(observed.data(), plain.data());
  assert.ok(calls.some((call) => call.text === 'Card three' && call.globalAlpha === 1));
  assert.ok(calls.some((call) => call.text === 'Card four' && call.globalAlpha === 0));
});

test('reveal threshold requires repeated stable text across multiple beats', () => {
  const oneBeat = [
    { sampleId: 'a', beat: 0, calls: [{ text: 'Brief fade', globalAlpha: 0 }] },
    { sampleId: 'b', beat: 0, calls: [{ text: 'Brief fade', globalAlpha: 0 }] },
    { sampleId: 'c', beat: 0, calls: [{ text: 'Brief fade', globalAlpha: 0 }] },
  ];
  assert.deepEqual(summarizeRevealSamples(oneBeat).warnings, []);
});

test('warning findings stay diagnostic by default and can fail an explicit strict run', () => {
  const report = { errorCount: 0, warningCount: 2 };
  assert.equal(revealAuditExitCode(report), 0);
  assert.equal(revealAuditExitCode(report, true), 1);
  assert.equal(revealAuditExitCode({ errorCount: 1, warningCount: 0 }), 1);
});

test('a dim explanatory text cluster is a review candidate while brief and isolated fades remain separate', () => {
  const labels = ['first corner', 'second corner', 'capacity'].map((text) => ({
    text,
    globalAlpha: 0.08,
  }));
  const result = summarizeRevealSamples([
    { sampleId: 'early', beat: 0, progress: 0.12, time: 1, calls: labels },
    { sampleId: 'middle', beat: 0, progress: 0.5, time: 4, calls: labels },
    {
      sampleId: 'late',
      beat: 0,
      progress: 0.88,
      time: 7,
      calls: [{ text: 'transition hint', globalAlpha: 0.1 }],
    },
    {
      sampleId: 'visible',
      beat: 1,
      progress: 0.5,
      time: 10,
      calls: labels.map((call) => ({ ...call, globalAlpha: 1 })),
    },
  ]);
  assert.deepEqual(
    result.lowAlphaCandidates.map((candidate) => candidate.sampleId),
    ['middle'],
  );
  assert.equal(result.lowAlphaCandidates[0].labels.length, 3);
  assert.deepEqual(result.warnings, []);
});
