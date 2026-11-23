import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import {
  weightWorksheet,
  transformedLaw,
  correctionCounterexample,
  isolationFixture,
  visibility,
  verificationBudget,
  freshStateFrame,
  samplerBoundary,
  draw,
} from '../animations/speculative-decoding.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-12);
const cue = (phase) => ({ phase, progress: phase === 'after' ? 1 : phase === 'before' ? 0 : 0.99 });
test('target truncation changes acceptance without changing the proposer', () => {
  const law = transformedLaw();
  assert.deepEqual(law.proposal, [0.4, 0.35, 0.25]);
  near(law.target[0], 11 / 17);
  near(law.target[1], 6 / 17);
  assert.equal(law.target[2], 0);
  near(0.3 / 0.35, 6 / 7);
  assert.equal(law.acceptance[1], 1);
  assert.equal(law.acceptance[2], 0);
});
test('resampling raw target after overlap adds the wrong probability mass', () => {
  const f = correctionCounterexample();
  f.correct.forEach((v, i) => near(v, f.p[i]));
  [0.48, 0.4, 0.12].forEach((v, i) => near(v, f.wrong[i]));
  near(
    f.wrong.reduce((a, v) => a + v, 0),
    1,
  );
});
test('off-branch values have zero influence under the ancestry mask', () => {
  assert.deepEqual(visibility([null, null, 0, 1], 2), [1, 0, 1, 0]);
  const a = isolationFixture(100),
    b = isolationFixture(10000);
  near(a.tree.result, 1.7310585786300048);
  assert.equal(a.tree.result, b.tree.result);
  near(a.tree.weights[1], 0);
  assert(b.flat.result > a.flat.result * 90);
});
test('verification admission counts evaluated positions before output acceptance', () => {
  const high = verificationBudget(16, 4, 64, 1),
    ordinary = verificationBudget(16, 4, 64, 0.8);
  assert.equal(high.inputs, 80);
  assert.equal(ordinary.inputs, 80);
  assert.equal(high.fits, false);
  assert.equal(verificationBudget(16, 2).inputs, 48);
  assert.equal(verificationBudget(16, 2).fits, true);
  near(ordinary.expectedOutput, 53.7856);
});
test('fresh correction retains the original prefix and processes the repeated ID anew', () => {
  const ids = ['sd-fresh-provisional', 'sd-fresh-rollback', 'sd-fresh-pending', 'sd-fresh-process'];
  const at = (phases) => ({
    beat: 2,
    beatP: 0.99,
    cues: Object.fromEntries(ids.map((id, i) => [id, cue(phases[i])])),
  });
  const firstInput = at(['before', 'before', 'before', 'before']);
  firstInput.cues['sd-fresh-82'] = cue('after');
  const first = freshStateFrame(firstInput);
  assert.equal(first.provisionalCache, 82);
  assert.equal(first.cache, 8);
  const provisional = freshStateFrame(at(['after', 'before', 'before', 'before']));
  assert.equal(provisional.provisionalCache, 823);
  assert.equal(provisional.cache, 8);
  const pendingInput = at(['after', 'after', 'after', 'during']),
    pending = freshStateFrame(pendingInput);
  assert.equal(pending.cache, 8);
  assert.equal(pending.pending, true);
  assert.deepEqual(pending.committed, [3]);
  const complete = freshStateFrame(at(['after', 'after', 'after', 'after']));
  assert.equal(complete.cache, 83);
  assert.equal(complete.pending, false);
  assert.notEqual(complete.cache, provisional.provisionalCache);
  assert.deepEqual(freshStateFrame(pendingInput), pending);
});
test('the painted prediction and pending state withhold the completed 83 result', () => {
  function labels(state) {
    const text = [];
    const noop = () => {};
    const api = {
      C: {
        ink: '#fff',
        muted: '#aaa',
        blue: '#acf',
        cyan: '#aff',
        green: '#afa',
        pink: '#faf',
        yellow: '#ff8',
        panel: '#222',
      },
      clamp: (v) => Math.max(0, Math.min(1, v)),
      text: (_, v) => text.push(String(v)),
      math: noop,
      line: noop,
      rect: noop,
      circle: noop,
      arrow: noop,
      components: { card: (o) => text.push(o.label) },
      teaching: { bars: noop },
      focus: { target: (_, paint) => paint() },
    };
    draw({}, { id: 'fresh-state' }, state, api);
    return text;
  }
  const question = labels({ beat: 0, beatP: 0.99, cues: {} });
  assert(!question.some((s) => /reject 2|newly commit ID 3|state: 83/.test(s)));
  const early = labels({
    beat: 2,
    beatP: 0.99,
    cues: Object.fromEntries(
      [
        'sd-fresh-82',
        'sd-fresh-provisional',
        'sd-fresh-rollback',
        'sd-fresh-pending',
        'sd-fresh-process',
      ].map((id) => [id, cue('before')]),
    ),
  });
  assert(!early.some((s) => /\b82\b|\b823\b/.test(s)));
  const pending = {
    beat: 2,
    beatP: 0.99,
    cues: Object.fromEntries(
      ['sd-fresh-provisional', 'sd-fresh-rollback', 'sd-fresh-pending'].map((id) => [
        id,
        cue('after'),
      ]),
    ),
  };
  pending.cues['sd-fresh-process'] = cue('during');
  assert(labels(pending).includes('Current reusable state: 8'));
  assert(!labels(pending).some((s) => /state: 83|= 83/.test(s)));
  pending.cues['sd-fresh-process'] = cue('after');
  assert(labels(pending).includes('Current reusable state: 83'));
  assert(labels(pending).includes('Process 3 on 8: 8 × 10 + 3 = 83'));
});

test('sampler exactness and target checkpoint identity are separate axes', () => {
  const frozenExact = samplerBoundary(false, true),
    jointExact = samplerBoundary(true, true),
    frozenTypical = samplerBoundary(false, false);
  assert.equal(frozenExact.baselineLawEstablished, true);
  assert.equal(jointExact.targetLawEstablished, true);
  assert.equal(jointExact.target, 'W1');
  assert.equal(jointExact.baselineLawEstablished, false);
  assert.equal(frozenTypical.targetLawEstablished, false);
  assert.equal(frozenTypical.baselineLawEstablished, false);
});

test('one reused weight stream increases work without multiplying its traffic', () => {
  const one = weightWorksheet(1),
    six = weightWorksheet(6);
  assert.equal(one.bytes, 60e9);
  assert.equal(six.bytes, one.bytes);
  assert.equal(six.flops, 6 * one.flops);
  assert.equal(six.intensity, 6);
  near(six.memoryMs, one.memoryMs);
  near(six.computeMs, 6 * one.computeMs);
  near(one.memoryMs, 17.91044776119403);
  near(one.ridge, 295.3731343283582);
});

const { createCanvas } = createRequire(new URL('../package.json', import.meta.url))(
  '@napi-rs/canvas',
);
const lesson = await readRepositoryLesson('videos/lessons/speculative-decoding.lesson.yaml');
registerLessonFonts();
function nativeLabels(id, beat, cueProgress) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats
        .flatMap((b) => b.visual_cues ?? [])
        .map((c) => {
          const progress = cueProgress[c.id] ?? 0;
          return [
            c.id,
            {
              ...c,
              progress,
              phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
              active: false,
              strength: 0,
              reveal: 0,
            },
          ];
        }),
    );
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    {
      beat,
      beatP: 0.5,
      t: 10,
      duration: 50,
      opacity: 1,
      sceneIndex: lesson.scenes.indexOf(scene),
      sceneCount: lesson.scenes.length,
      cues,
    },
    draw,
  );
  return audit.labels.map((label) => ({ text: label.text, x: label.x + label.width / 2 }));
}
test('native pending lookup correction never presents an all-zero probability law', () => {
  for (const progress of [0, 0.5, 0.999]) {
    const right = nativeLabels('lookup-methods', 1, { 'sd-lookup-residual': progress }).filter(
      (l) => l.x > 1090,
    );
    assert(right.some((l) => l.text === 'Residual calculation pending'));
    assert(!right.some((l) => /^0\.000$/.test(l.text)));
  }
  const ready = nativeLabels('lookup-methods', 1, { 'sd-lookup-residual': 1 }).filter(
    (l) => l.x > 1090,
  );
  assert(!ready.some((l) => l.text === 'Residual calculation pending'));
  for (const value of ['0.400', '0.600', '0.000']) assert(ready.some((l) => l.text === value));
});
test('native proof labels partial bar mass as accounted and the complete target mass as emitted', () => {
  const partial = nativeLabels('proof', 0, { 'correction-path': 0.4 });
  assert(partial.some((l) => l.text === 'Accounted mass 0.32'));
  assert(!partial.some((l) => l.text.startsWith('Emitted mass')));
  const complete = nativeLabels('proof', 0, { 'correction-path': 1 });
  for (const value of ['0.50', '0.30', '0.20'])
    assert(complete.some((l) => l.text === 'Emitted mass ' + value));
  assert(!complete.some((l) => l.text.startsWith('Accounted mass')));
});
