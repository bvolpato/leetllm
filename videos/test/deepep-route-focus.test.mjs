import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as deep from '../animations/deep-dive-deepep.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const cue = (
  progress,
  phase = progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
) => ({ phase, progress, reveal: progress, strength: 0, active: false, targets: [] });
const paint = (id, beat, beatP, cues = {}) => {
  const state = { t: 8, duration: 60, opacity: 1, beat, beatP, cueTiming: 'provider-words', cues };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'DeepEP' },
    state,
    deep.draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { frame, model: deep.sampleModel(id, state) };
};

test('the narrated rail and local hops use distinct actual paths and retain their completed route', () => {
  const direct = paint('topology', 0, 0.9, {
    'topology-beat-1-focus-2': cue(0),
    'topology-direct-domain': cue(0.7),
  });
  assert.equal(direct.model.hybrid, false);
  assert(direct.frame.targets.some((target) => target.id === 'topology-direct-link'));
  const hybrid = paint('topology', 0, 0.1, {
    'topology-beat-1-focus-2': cue(1),
    'topology-rail-hop': cue(0.5),
    'topology-beat-1-focus-1': cue(0),
  });
  assert.equal(hybrid.model.hybrid, true);
  assert.equal(hybrid.model.railProgress, 0.5);
  assert.equal(hybrid.model.localProgress, 0);
  for (const id of ['topology-rail-link', 'topology-local-link'])
    assert(
      hybrid.frame.targets.some((target) => target.id === id && target.markCounts.connectors > 0),
    );
  const local = paint('topology', 0, 0.1, {
    'topology-beat-1-focus-2': cue(1),
    'topology-rail-hop': cue(1),
    'topology-beat-1-focus-1': cue(0.6),
  });
  assert.equal(local.model.localProgress, 0.6);
  const held = paint('topology', 1, 0);
  assert.equal(held.model.railProgress, 1);
  assert.equal(held.model.localProgress, 1);
});

test('FP32 and BF16 operation scopes include their own computed result, not the opposite heading', () => {
  const earlier = { 'dep-result-round-cast': cue(1), 'dep-result-round-zero': cue(1) };
  const pending = paint('rounding', 2, 0.2, { ...earlier, 'dep-result-round-one': cue(0.5) });
  assert(!pending.frame.labels.some((label) => label.text === '257 − 256 = 1 → final BF16 1'));
  const { frame, model } = paint('rounding', 2, 0.2, {
    ...earlier,
    'dep-result-round-one': cue(1),
  });
  assert.equal(model.single, 1);
  assert.equal(model.staged, 0);
  const fp32 = frame.targets.find((target) => target.id === 'rounding-fp32-operation');
  assert(fp32 && fp32.x >= 1000 && fp32.y + fp32.height > 850 && fp32.markCounts.labels >= 3);
  const bf16 = frame.targets.find((target) => target.id === 'rounding-bf16-operation');
  assert(bf16 && bf16.x < 200 && bf16.markCounts.connectors > 0);
  assert(frame.labels.some((label) => label.text === '257 − 256 = 1 → final BF16 1'));
});

test('the supplied QP budget derives distinct request and allocation bars from the same clamp', () => {
  const resources = deep.sampleModel('resources', { beat: 1, beatP: 0 });
  assert.equal(resources.hybridRequested, resources.sms * 16 + 1);
  assert.equal(resources.hybrid, Math.min(resources.hybridRequested, resources.allocated));
  assert.equal(resources.direct, 9);
  for (const progress of [0, 0.5, 1]) {
    const { frame } = paint('resources', 1, 0.1, {
      'resources-beat-2-focus-2': cue(progress),
      'dep-result-resources-pool': cue(progress),
    });
    assert(
      frame.targets.some(
        (target) =>
          target.id === 'resources-qp-cap' && target.markCounts.shapes >= (progress === 1 ? 4 : 2),
      ),
    );
    assert(
      frame.targets.some(
        (target) => target.id === 'resources-qp-requests' && target.markCounts.math === 2,
      ),
    );
    assert.equal(
      frame.labels.some((label) => label.text === 'Allocated: min(193, 128) = 128'),
      progress === 1,
    );
    const fill = frame.shapes.find(
      (shape) =>
        Math.abs(shape.x - 1065) < 0.01 &&
        Math.abs(shape.y - 775) < 0.01 &&
        Math.abs(shape.width - (650 * resources.hybrid) / resources.hybridRequested) < 0.01,
    );
    assert.equal(
      Boolean(fill),
      progress === 1,
      'the computed allocation is painted only after its result clause',
    );
  }
});

test('combine and bandwidth focus include actual computed quantities and retain identities', () => {
  const pending = paint('combine', 1, 0.25, { 'dep-result-combine-once': cue(0.5) });
  assert(pending.frame.labels.some((label) => label.text === 'Source a sum pending'));
  assert(
    !pending.frame.targets.some(
      (target) => target.id === 'combine-weighted-sum' && target.markCounts.math > 0,
    ),
  );
  const { frame, model } = paint('combine', 1, 0.25, { 'dep-result-combine-once': cue(1) });
  assert.equal(model.output.a[0], 1.9);
  assert.equal(
    frame.targets.filter(
      (target) => target.id === 'combine-weighted-contributions' && target.markCounts.shapes >= 2,
    ).length,
    2,
  );
  assert(
    frame.targets.some(
      (target) => target.id === 'combine-weighted-sum' && target.markCounts.math > 0,
    ),
  );
  const pendingBandwidth = paint('topology', 2, 0.5, { 'dep-result-topology-rates': cue(0.5) });
  assert(!pendingBandwidth.frame.labels.some((label) => label.text.includes('104.86 GB/s')));
  const bandwidth = paint('topology', 2, 0.5, { 'dep-result-topology-rates': cue(1) });
  assert.equal(bandwidth.model.logicalRate / bandwidth.model.remoteRate, 2);
  assert(
    bandwidth.frame.targets.some(
      (target) => target.id === 'topology-byte-ledger' && target.markCounts.labels === 2,
    ),
  );
  assert.equal(deep.completeLayerReceipt().referenceMatches, true);
});
