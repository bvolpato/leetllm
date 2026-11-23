import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routeF1,
  zeroFailureUpper,
  requestExposure,
  replayRecordedTool,
  validMetric,
  freshDecision,
  draw,
} from '../animations/model-versioning-continuous-deployment.mjs';

test('route quality cannot compensate for a positive critical count', () => {
  const r = routeF1(72, 3, 9);
  assert.equal(r.numerator, 144);
  assert.equal(r.denominator, 156);
  assert(r.f1 > 0.92);
  assert.equal(r.criticalPass, false);
  assert.throws(() => routeF1(2, true, 1));
  assert.throws(() => routeF1(0, 0, 0));
  const common = {
    releaseMatches: true,
    attemptMatches: true,
    reviewed: 499,
    requests: 500,
    unsafe: 1,
    latencyComplete: false,
  };
  assert.equal(freshDecision(common), 'ABORT');
  assert.equal(freshDecision({ ...common, attemptMatches: false }), 'HOLD');
  assert.equal(freshDecision({ ...common, unsafe: 0 }), 'HOLD');
});

test('fixed-trial upper bounds and exposure preserve their separate denominators', () => {
  const upper = zeroFailureUpper(1200);
  assert(Math.abs(Math.pow(1 - upper, 1200) - 0.05) < 1e-13);
  assert(zeroFailureUpper(2400) < upper);
  assert.throws(() => zeroFailureUpper(0));
  const exposure = requestExposure([20, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0);
  assert.equal(exposure.conversationShare, 0.1);
  assert.equal(exposure.total, 29);
  assert.equal(exposure.requestShare, 20 / 29);
});

test('tool replay matches nested arguments rather than supplying a result to a changed call', () => {
  const saved = {
    name: 'read_policy',
    args: { version: 7, scope: { tenant: 'A', fields: ['policy', 'owner'] } },
    result: 'retained bytes',
  };
  assert.equal(
    replayRecordedTool(saved, {
      name: 'read_policy',
      args: { scope: { fields: ['policy', 'owner'], tenant: 'A' }, version: 7 },
    }).result,
    'retained bytes',
  );
  for (const actual of [
    { name: 'read_policy', args: { ...saved.args, version: 8 } },
    { name: 'read_policy', args: { ...saved.args, scope: { ...saved.args.scope, tenant: 'B' } } },
    {
      name: 'read_policy',
      args: { ...saved.args, scope: { ...saved.args.scope, fields: ['owner', 'policy'] } },
    },
  ])
    assert.equal(replayRecordedTool(saved, actual).matched, false);
  for (const value of [undefined, true, '0.93', -1, NaN, Infinity])
    assert.equal(validMetric(value), false);
  assert(validMetric(0.93, { rate: true }));
  assert.equal(validMetric(1.1, { rate: true }), false);
});

const painted = async (id, beat, cues) => {
  const { createCanvas } = await import('@napi-rs/canvas'),
    { drawFrame } = await import('../lib/scene.mjs');
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Supplied release case' },
    { beat, beatP: 0.5, t: 1, duration: 60, opacity: 1, cues },
    draw,
  );
};
const phase = (value, progress = 0.99) => ({
  phase: value,
  progress: value === 'after' ? 1 : progress,
});
const strings = (f) => f.labels.map((x) => x.text);

test('F1 denominator and result wait for their separate complete spoken clauses', async () => {
  const base = {
    'mv-gate-arithmetic-counts': phase('after'),
    'mv-gate-arithmetic-numerator': phase('after'),
    'mv-gate-arithmetic-denominator': phase('during'),
    'mv-gate-arithmetic-f1': phase('before'),
  };
  let f = await painted('gate-arithmetic', 1, base);
  assert(strings(f).includes('2 × 90 = 180'));
  assert(!strings(f).some((x) => x.includes('= 195')));
  assert(!strings(f).some((x) => x.includes('0.923')));
  f = await painted('gate-arithmetic', 1, {
    ...base,
    'mv-gate-arithmetic-denominator': phase('after'),
    'mv-gate-arithmetic-f1': phase('during'),
  });
  assert(strings(f).includes('180 + 5 + 10 = 195'));
  assert(!strings(f).some((x) => x.includes('0.923')));
});

test('the third comparison remains outside the committed queue until its drop reveal', async () => {
  const cues = {
    'queue-arrivals': phase('after'),
    'mv-shadow-two': phase('after'),
    'mv-shadow-third': phase('during'),
  };
  let f = await painted('shadow', 1, cues);
  assert(!strings(f).some((x) => x.includes('shadow-3')));
  assert(strings(f).includes('2 submitted · 2 admitted · 0 missing'));
  f = await painted('shadow', 1, { ...cues, 'mv-shadow-third': phase('after') });
  assert(strings(f).includes('shadow-3 · DROP'));
  assert(strings(f).includes('3 submitted · 2 admitted · 1 missing'));
});

test('the new rollout prediction holds the verdict and later attributed failure separately', async () => {
  let f = await painted('fresh-release', 0, {});
  assert(!strings(f).some((x) => /HOLD|ABORT|75%/.test(x)));
  f = await painted('fresh-release', 1, { 'mv-fresh-release-hold': phase('during') });
  assert(!strings(f).some((x) => x.startsWith('HOLD exposure')));
  f = await painted('fresh-release', 1, {
    'mv-fresh-release-hold': phase('after'),
    'mv-fresh-release-unsafe': phase('during'),
  });
  assert(strings(f).includes('HOLD exposure · repair coverage'));
  assert(!strings(f).some((x) => x === 'attributed unsupported = 1'));
});

test('an incomplete legitimate inventory holds for coverage rather than invented useful outcomes', async () => {
  const { liveGate, liveInventory } =
    await import('../animations/model-versioning-continuous-deployment.mjs');
  const result = liveGate(liveInventory('incomplete'));
  assert.equal(result.status, 'HOLD');
  assert.equal(result.reason, 'coverage or volume incomplete');
});

test('the fourth conversation turn is held independently of its saved assignment premise', async () => {
  const before = await painted('sticky', 1, {
    'widen-threshold': phase('after'),
    'new-conversation': phase('before'),
    'sticky-existing': phase('before'),
  });
  assert(strings(before).includes('Predict the next existing turn → ?'));
  assert(!strings(before).includes('Next existing turn → STABLE'));
  const after = await painted('sticky', 2, {
    'widen-threshold': phase('after'),
    'new-conversation': phase('before'),
    'sticky-existing': phase('after'),
  });
  assert(strings(after).includes('Next existing turn → STABLE'));
});

test('an arrived critical review retires HOLD before the separately completed recovery action', async () => {
  const cues = {
    'mv-fresh-release-hold': phase('after'),
    'mv-fresh-release-unsafe': phase('after'),
    'mv-fresh-release-abort-now': phase('during'),
    'mv-fresh-release-abort': phase('before'),
  };
  let f = await painted('fresh-release', 1, cues);
  assert(!strings(f).includes('HOLD exposure · repair coverage'));
  assert(!strings(f).some((x) => x.startsWith('ABORT traffic')));
  f = await painted('fresh-release', 1, { ...cues, 'mv-fresh-release-abort-now': phase('after') });
  assert(strings(f).includes('ABORT traffic · recovery in progress'));
  assert(!strings(f).includes('canary → STABLE'));
});
