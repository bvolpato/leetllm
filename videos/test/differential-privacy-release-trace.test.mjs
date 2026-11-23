import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { draw, releaseTraceSnapshot } from '../animations/differential-privacy.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };
const cueIds = [
  'select-checkpoint',
  'account-selection',
  'compose-releases',
  'matching-accountant',
  'other-data-paths',
  'dp-result-audit-selection',
  'dp-result-audit-composition',
];
const auditFrame = (overrides) => {
  const cues = Object.fromEntries(cueIds.map((id) => [id, overrides?.[id] ?? before]));
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'audit', title: 'Trace clipping through a checkpoint release' },
    { beat: 2, beatP: 0.9, t: 18, duration: 20, opacity: 1, cues },
    draw,
  );
};

registerLessonFonts();

test('the release trace gates aggregate, noise, and selector accounting on their inputs', () => {
  const raw = releaseTraceSnapshot({
    beat: 0,
    cues: { 'trace-clip': before, 'trace-clip-result': before },
  });
  assert.equal(raw.clipProgress, 0);
  assert.equal(raw.clipOutcomeProgress, 0);
  assert.deepEqual(raw.clipped, [0.6000000000000001, 0.8]);
  const clipped = releaseTraceSnapshot({
    beat: 0,
    cues: { 'trace-clip': after, 'trace-clip-result': before },
  });
  assert.equal(clipped.clipProgress, 1);
  assert.equal(clipped.clipOutcomeProgress, 0);
  const revealed = releaseTraceSnapshot({
    beat: 0,
    cues: { 'trace-clip': after, 'trace-clip-result': after },
  });
  assert.equal(revealed.clipOutcomeProgress, 1);

  const partial = releaseTraceSnapshot({
    beat: 1,
    cues: {
      'trace-add': { phase: 'during', progress: 0.5 },
      'trace-aggregate': after,
      'trace-noise': after,
    },
  });
  assert.equal(partial.completedContributions, 1);
  assert.equal(partial.aggregateProgress, 0);
  assert.equal(partial.noiseProgress, 0);

  const summed = releaseTraceSnapshot({
    beat: 1,
    cues: {
      'trace-add': after,
      'trace-aggregate': after,
      'trace-noise': before,
    },
  });
  assert(Math.abs(summed.aggregate[0] - 1.6) < 1e-12);
  assert(Math.abs(summed.aggregate[1] - 1.9) < 1e-12);
  assert.equal(summed.noiseProgress, 0);
  const noised = releaseTraceSnapshot({
    beat: 1,
    cues: {
      'trace-add': after,
      'trace-aggregate': after,
      'trace-noise': after,
    },
  });
  assert(Math.abs(noised.noisy[0] - 1.8) < 1e-12);
  assert(Math.abs(noised.noisy[1] - 1.6) < 1e-12);

  const prematureLedger = releaseTraceSnapshot({
    beat: 2,
    cues: {
      'select-checkpoint': before,
      'account-selection': after,
    },
  });
  assert.equal(prematureLedger.ledgerProgress, 0);
  const selected = releaseTraceSnapshot({
    beat: 2,
    cues: {
      'select-checkpoint': after,
      'account-selection': after,
    },
  });
  assert.equal(selected.selectionProgress, 1);
  assert.equal(selected.ledgerProgress, 1);
});

test('the selector ledger shows a symbolic basic-composition bound only after both entries', () => {
  const unselected = auditFrame().labels.map((label) => label.text);
  assert(!unselected.some((text) => text.includes('ε₁')));
  assert(unselected.includes('C7'));

  const selecting = auditFrame({
    'select-checkpoint': after,
    'dp-result-audit-selection': { phase: 'during', progress: 0.99 },
  }).labels.map((label) => label.text);
  assert(!selecting.includes('C7 selected'));

  const selected = auditFrame({
    'select-checkpoint': after,
    'dp-result-audit-selection': after,
  }).labels.map((label) => label.text);
  assert(selected.includes('C7 selected'));
  assert(!selected.some((text) => text.includes('ε₁')));

  const ledger = auditFrame({ 'select-checkpoint': after, 'account-selection': after }).labels.map(
    (label) => label.text,
  );
  assert(ledger.includes('Training · (ε₁, δ₁)'));
  assert(ledger.includes('Private selector · (ε₂, δ₂)'));
  assert(ledger.includes('Same protected unit · same adjacency'));
  assert(!ledger.some((text) => text.includes('ε₁ + ε₂')));

  const premature = releaseTraceSnapshot({
    beat: 2,
    cues: {
      'select-checkpoint': after,
      'account-selection': before,
      'compose-releases': after,
      'matching-accountant': after,
    },
  });
  assert.equal(premature.compositionProgress, 0);
  assert.equal(premature.accountantProgress, 0);

  const during = auditFrame({
    'select-checkpoint': after,
    'account-selection': after,
    'compose-releases': { phase: 'during', progress: 0.5 },
  }).labels.map((label) => label.text);
  assert(during.includes('(ε₁ + …, δ₁ + …)'));
  assert(!during.includes('(ε₁ + ε₂, δ₁ + δ₂)'));

  const composed = auditFrame({
    'select-checkpoint': after,
    'account-selection': after,
    'compose-releases': after,
    'dp-result-audit-composition': after,
  }).labels.map((label) => label.text);
  assert(composed.includes('Sequential basic-composition bound'));
  assert(composed.includes('(ε₁ + ε₂, δ₁ + δ₂)'));
  assert(!composed.includes('Sampler · noise scale · step count'));

  const accounted = auditFrame({
    'select-checkpoint': after,
    'account-selection': after,
    'compose-releases': after,
    'dp-result-audit-composition': after,
    'matching-accountant': after,
  }).labels.map((label) => label.text);
  assert(accounted.includes('Sampler · noise scale · step count'));
});

test('measured record additions are visible when spoken and retain their chained endpoints', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/differential-privacy.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'audit');
  const scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('differential-privacy')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = (id) => timing.visualCues.find((cue) => cue.id === id);
  const add = cue('trace-add'),
    aggregate = cue('trace-aggregate'),
    noise = cue('trace-noise');
  const aggregateResult = cue('dp-result-audit-aggregate'),
    noiseResult = cue('dp-result-audit-noise');
  const adjacentFrames = (result) => {
    const firstComplete = Math.ceil(result.end * 30 - 1e-7) / 30;
    return [
      [firstComplete - 1 / 30, 3],
      [firstComplete, 3],
    ];
  };
  const beat = measured.beats[1],
    words = measured.sounds[1].words;
  const r2 = words.findIndex((word) => word.text === 'R2');
  const clipped = words.findIndex((word) => word.text === 'clipped');
  const samples = [
    [add.start - 0.04, 0],
    [add.start, 1],
    [431 / 30, 1],
    [452 / 30, 1],
    [beat.start + words[r2 - 1].end + 0.04, 1],
    [beat.start + words[r2].start + 0.1, 2],
    [beat.start + words[clipped - 2].end + 0.04, 2],
    [beat.start + words[clipped].start + 0.1, 3],
    [add.end + 0.1, 3],
    [aggregate.start + 0.1, 3],
    [noise.start + 0.1, 3],
    [beat.end + 0.3, 3],
    ...adjacentFrames(aggregateResult),
    ...adjacentFrames(noiseResult),
  ];
  const canvas = createCanvas(1920, 1080);
  const endpoints = [
    [245, 790],
    [335, 728.5],
    [470, 564.5],
    [605, 400.5],
  ];
  const labels = ['R1 [0.4,0.3]', 'R2 [0.6,0.8]', 'R4 [0.6,0.8]'];
  for (const [time, count] of samples) {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `measured trace at ${time}s`);
    const text = audit.labels.map((label) => label.text);
    assert.deepEqual(
      text.filter((value) => labels.includes(value)),
      labels.slice(0, count),
      `spoken records at ${time}s`,
    );
    const arrows = audit.connectors.filter((connector) => connector.kind === 'arrow');
    assert.equal(
      arrows.length,
      count + Number(time > noise.start),
      `visible contributions at ${time}s`,
    );
    for (let i = 0; i < count; i++) {
      assert.deepEqual(arrows[i].from, { x: endpoints[i][0], y: endpoints[i][1] });
      assert(Math.abs(arrows[i].to.x - endpoints[i + 1][0]) < 1e-9);
      assert(Math.abs(arrows[i].to.y - endpoints[i + 1][1]) < 1e-9);
    }
    assert.equal(
      text.includes('Aggregate [1.6, 1.9]'),
      time >= aggregateResult.end,
      'aggregate waits for its complete result clause',
    );
    assert.equal(
      text.includes('After authored draw: [1.8, 1.6]'),
      time >= noiseResult.end,
      'noise waits for its complete result clause',
    );
    if (time < add.end) {
      const snapshot = releaseTraceSnapshot(state);
      assert.equal(snapshot.aggregateProgress, 0);
      assert.equal(snapshot.noiseProgress, 0);
    }
  }
});
