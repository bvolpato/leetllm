import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import * as model from '../animations/bayes.mjs';
const reference = JSON.parse(
  await fs.readFile(new URL('./fixtures/bayes-teaching-reference.json', import.meta.url)),
);
const close = (a, b, tolerance = 1e-8) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
});

test('beta area, quantiles and tails agree with independent SciPy cases including the uniform endpoints', () => {
  assert.equal(model.betaDensity(1, 1, 0), 1);
  assert.equal(model.betaDensity(1, 1, 1), 1);
  for (const row of reference.posteriors) {
    close(
      model.integrate((p) => model.betaDensity(row.a, row.b, p)),
      1,
    );
    close(model.betaTailProbability(row.a, row.b), row.tail);
    for (const [i, p] of [0.05, 0.95].entries())
      close(model.betaQuantile(row.a, row.b, p), row.interval90[i]);
  }
});
test('the two-family rate propagates both posterior uncertainties instead of treating the weighted mean as a beta parameter', () => {
  for (const row of reference.familyMixtures) {
    close(model.familyTail(row.easyWeight), row.tailAbovePointSeven);
    close((row.easyWeight * 74) / 84 + ((1 - row.easyWeight) * 10) / 24, row.mean);
  }
  for (const row of reference.familyProjectionDensity)
    close(model.familyDensity(row.rate), row.density, 2e-8);
  close(
    model.integrate((x) => model.familyDensity(x)),
    1,
    1e-7,
  );
  close(
    model.integrate((x) => x * model.familyDensity(x)),
    reference.familyMixtures[1].mean,
    1e-7,
  );
  const current = model.populationFrame({ beat: 1, cues: { 'change-traffic-mix': cue(0.5) } });
  close(current.weight, 0.5);
  close(current.tail, reference.familyMixtures[2].tailAbovePointSeven);
});
test('joint contours follow actual independent family posterior density rather than a fabricated ellipse', () => {
  for (const weight of [0.2, 0.5, 0.8])
    for (const point of model.passingRegion(weight)) {
      assert(point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
      assert(weight * point.x + (1 - weight) * point.y >= 0.7 - 1e-12);
    }
  for (const contour of model.jointContours())
    for (const point of contour.points.filter((_, i) => i % 13 === 0))
      close(
        model.betaDensity(74, 10, point.x) * model.betaDensity(10, 14, point.y),
        contour.level,
        1e-7,
      );
});
test('five-task counts match the beta-binomial while the frozen-rate comparison preserves the mean and loses dispersion', () => {
  const rows = model.predictiveCountDistribution(),
    frozen = model.frozenCountDistribution();
  for (const r of reference.fiveTaskCounts) {
    close(rows[r.passes].probability, r.predictive, 1e-11);
    close(frozen[r.passes].probability, r.frozenMean, 1e-11);
  }
  const mean = (5 * 10) / 14,
    variance = (a) => a.reduce((n, r) => n + (r.passes - mean) ** 2 * r.probability, 0);
  close(
    rows.reduce((n, r) => n + r.passes * r.probability, 0),
    mean,
  );
  close(
    frozen.reduce((n, r) => n + r.passes * r.probability, 0),
    mean,
  );
  assert(variance(rows) > variance(frozen));
});
test('product normalization receipts track the displayed product area at every partial rescaling', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const v = model.productFrame({
      beat: 0,
      cues: { 'same-rate-probe': cue(0.5), 'normalize-product': cue(p) },
    });
    close(v.current, v.prior * v.likelihood * v.scale, 1e-12);
    close(
      model.integrate((x) => model.betaDensity(2, 2, x) * x ** 8 * (1 - x) ** 2 * v.scale),
      v.area,
      1e-10,
    );
    if (p < 1) assert(v.area < 1);
    else close(v.area, 1);
  }
});
test('the forecast area paints the rate-weighted contribution that its running integral reports', () => {
  const paths = [],
    C = {
      bg: '#000',
      panel: '#111',
      muted: '#999',
      ink: '#fff',
      blue: '#79aaff',
      green: '#8cdeb5',
      red: '#ff988d',
      yellow: '#f4d477',
      pink: '#ef9ac8',
      cyan: '#63deec',
    };
  const api = {
    C,
    clamp: (v) => Math.max(0, Math.min(1, v)),
    phase: (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a))),
    lerp: (a, b, p) => a + (b - a) * p,
    text() {},
    math() {},
    circle() {},
    line() {},
    arrow() {},
    rect() {},
    path: (_ctx, points, style) => {
      if (style.fill) paths.push(points);
    },
    components: { card: (opts) => opts, fade: (_p, paint) => paint() },
    focus: {
      target: (_id, paint) => paint(),
      reveal: (_id, paint) => paint(),
      progress: (_id, fallback) => fallback,
    },
    teaching: {
      axes: () => ({ point: (x, y) => ({ x, y }), bounds: { x: 0, y: 0, width: 1, height: 4 } }),
      curve() {},
    },
  };
  model.draw(
    {},
    { id: 'predictive' },
    { beat: 0, beatP: 0.6, cues: { 'weighted-contribution': cue(0.7) } },
    api,
  );
  const points = paths.flatMap((p) => p).filter((p) => p.x > 0.2 && p.x < 0.65 && p.y > 1e-8);
  assert(points.length > 10);
  for (const p of points) close(p.y, p.x * model.betaDensity(10, 4, p.x), 1e-10);
});
test('fresh calibration outcomes never alter forecasts saved before them and release choices use the intended distributions', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const c = model.calibrationFrame({ beat: 0, cues: { 'reveal-validation-outcomes': cue(p) } });
    assert.equal(c.processed, Math.floor(100 * p));
    assert.equal(c.forecast, 10 / 14);
    assert.equal(
      c.passes,
      model.validationOutcomes.slice(0, c.processed).filter((r) => r.pass).length,
    );
  }
  assert.equal(model.validationOutcomes.filter((r) => r.pass).length, 72);
  assert(model.validationOutcomes.every((r) => r.forecast === 10 / 14));
  assert.deepEqual(
    model.releaseCases().map((r) => r.meetsRule),
    [false, true, false],
  );
});

test('the release-answer receipt waits for the posterior-area construction', () => {
  const paint = (p) => {
    const math = [],
      texts = [],
      C = {
        panel: '#111',
        muted: '#999',
        ink: '#fff',
        blue: '#79aaff',
        green: '#8cdeb5',
        red: '#ff988d',
        yellow: '#f4d477',
        pink: '#ef9ac8',
        cyan: '#63deec',
      },
      api = {
        C,
        text: (_c, t) => texts.push(t),
        math: (_c, t) => math.push(t),
        circle() {},
        line() {},
        arrow() {},
        rect() {},
        path() {},
        focus: { target: (_id, fn) => fn() },
        teaching: {
          axes: () => ({
            point: (x, y) => ({ x, y }),
            bounds: { x: 0, y: 0, width: 1, height: 4 },
          }),
          curve() {},
        },
      };
    model.draw(
      {},
      { id: 'threshold' },
      { beat: 0, beatP: 0.5, cues: { 'threshold-area': cue(p) } },
      api,
    );
    return { math, texts };
  };
  for (const p of [0, 0.5, 0.98]) {
    const drawn = paint(p);
    assert(
      !drawn.math.some((t) => t.includes('0.579')),
      'The numerical release answer leaked before the shaded area finished',
    );
    assert(!drawn.texts.some((t) => String(t).includes('57.9')));
  }
  const final = paint(1);
  assert(final.math.some((t) => t.includes('0.579')));
  assert(final.texts.some((t) => String(t).includes('57.9')));
});

test('a zero-width prior range retains a visible focus reference while its probability reaches zero', () => {
  registerLessonFonts();
  const canvas = createCanvas(1920, 1080),
    scene = { id: 'prior', title: 'Give possible rates their starting weight' };
  for (const [beat, id, progress] of [
    [1, 'prior-area-sweep', 0],
    [2, 'prior-area-contract', 1],
  ]) {
    const cue = {
      id,
      phase: 'during',
      progress,
      strength: 1,
      targets: ['prior-area'],
      color: 'blue',
    };
    const audit = drawFrame(
      canvas.getContext('2d'),
      {},
      scene,
      { beat, beatP: progress, opacity: 1, cueTiming: 'provider-words', cues: { [id]: cue } },
      model.draw,
    );
    assert.deepEqual(
      audit.issues.filter((issue) => issue.type === 'missing-focus-target'),
      [],
    );
    const reference = audit.targets.find((target) => target.id === 'prior-area');
    assert(reference && reference.height > 1);
    close(model.priorIntervalSnapshot(beat, progress).probability, 0);
  }
});

test('the new task result never covers either posterior density during delivery', () => {
  const canvas = createCanvas(1920, 1080),
    scene = { id: 'predictive', title: 'Let every plausible rate make its forecast' };
  for (const progress of [0, 0.25, 0.5, 0.75, 0.9, 1]) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      {},
      scene,
      {
        beat: 1,
        beatP: progress,
        opacity: 1,
        cues: { 'new-pass-arrival': { phase: 'during', progress, strength: 0 } },
      },
      model.draw,
    );
    const tile = audit.targets.find((target) => target.id === 'new-pass'),
      covered = audit.paths
        .flatMap((path) => path.points)
        .filter(
          (point) =>
            point.x > tile.x &&
            point.x < tile.x + tile.width &&
            point.y > tile.y &&
            point.y < tile.y + tile.height,
        );
    assert.equal(
      covered.length,
      0,
      'The arriving result card obscures a posterior curve at progress ' + progress,
    );
  }
});

test('the credible interval moves both equal-tail endpoints while constructing its central probability', () => {
  const C = { muted: '#999', ink: '#fff', blue: '#79aaff', green: '#8cdeb5', yellow: '#f4d477' };
  for (const progress of [0.25, 0.5, 0.75, 1]) {
    const fills = [],
      texts = [],
      api = {
        C,
        text: (_ctx, value) => texts.push(value),
        math() {},
        line() {},
        circle() {},
        path: (_ctx, points, style) => {
          if (style.fill) fills.push(points);
        },
        focus: { target: (_id, paint) => paint() },
        teaching: {
          axes: () => ({
            point: (x, y) => ({ x, y }),
            bounds: { x: 0, y: 0, width: 1, height: 4 },
          }),
          curve() {},
        },
      };
    model.draw(
      {},
      { id: 'threshold' },
      { beat: 1, beatP: progress, cues: { 'credible-range': cue(progress) } },
      api,
    );
    assert.equal(fills.length, 1);
    const low = Math.min(...fills[0].map((point) => point.x)),
      high = Math.max(...fills[0].map((point) => point.x)),
      tail = (1 - 0.9 * progress) / 2;
    close(1 - model.betaTailProbability(10, 4, low), tail);
    close(model.betaTailProbability(10, 4, high), tail);
    if (progress < 1)
      assert(
        !texts.some((text) => text.includes('contains 90%')),
        'The partial interval is described as containing the completed90%',
      );
  }
});
test('all prior-sensitivity density curves fit their shared scale throughout the update', () => {
  const canvas = createCanvas(1920, 1080),
    scene = { id: 'sensitivity', title: 'Hold the outcomes fixed and change the assumption' };
  for (let step = 0; step <= 20; step++) {
    const progress = step / 20,
      audit = drawFrame(
        canvas.getContext('2d'),
        {},
        scene,
        {
          beat: 1,
          beatP: progress,
          opacity: 1,
          cues: { 'same-data-three-priors': { phase: 'during', progress, strength: 0 } },
        },
        model.draw,
      );
    for (const path of audit.paths.filter((path) => path.clip))
      for (const point of path.points)
        assert(
          point.y >= path.clip.y - 1e-6,
          'A prior-sensitivity curve clips above its density scale at progress ' + progress,
        );
  }
});

test('the first likelihood card visibly arrives before its integer factor is recorded', () => {
  const canvas = createCanvas(1920, 1080),
    scene = { id: 'likelihood', title: 'Ask each candidate rate to explain the outcomes' };
  for (const progress of [0.025, 0.05, 0.1]) {
    const cues = {
      'likelihood-pass-arrivals': {
        phase: 'during',
        progress,
        strength: 1,
        targets: ['likelihood-outcomes', 'likelihood-curve', 'likelihood-powers'],
        color: 'green',
      },
    };
    const state = { beat: 0, beatP: progress, opacity: 1, cueTiming: 'provider-words', cues },
      audit = drawFrame(canvas.getContext('2d'), {}, scene, state, model.draw);
    assert.equal(model.likelihoodFrame(state).processed, 0);
    assert.deepEqual(
      audit.issues.filter((issue) => issue.type === 'missing-focus-target'),
      [],
    );
    assert(audit.targets.some((target) => target.id === 'likelihood-outcomes' && target.alpha > 0));
  }
});
