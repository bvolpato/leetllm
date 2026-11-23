import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { draw } = await import(
  process.env.NEURAL_REPAIR_SOURCE
    ? pathToFileURL(process.env.NEURAL_REPAIR_SOURCE)
    : new URL('../animations/neural-networks.mjs', import.meta.url)
);
const Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(new URL('../lessons/neural-networks.lesson.yaml', import.meta.url), 'utf8'),
  ),
  during = { phase: 'during', progress: 0.999 },
  after = { phase: 'after', progress: 1 };
function paint(id, beat, override = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { phase: i < beat ? 'after' : 'before', progress: i < beat ? 1 : 0 },
        ]),
      ),
    );
  Object.assign(cues, override);
  const labels = [],
    maths = [],
    circles = [],
    rects = [],
    C = new Proxy({}, { get: (_, k) => String(k) }),
    ctx = { globalAlpha: 1, save() {}, restore() {} },
    api = {
      C,
      clamp: (p) => Math.max(0, Math.min(1, p)),
      phase: (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a))),
      lerp: (a, b, p) => a + (b - a) * p,
      text: (_c, s) => labels.push(String(s)),
      math: (_c, s) => maths.push(String(s)),
      rect: (_c, x, y, width, height, ...style) => {
        const o = { x, y, width, height, style };
        rects.push(o);
        return o;
      },
      path() {},
      line() {},
      arrow() {},
      circle: (_c, ...a) => circles.push(a),
      focus: {
        target: (_id, fn) => fn(),
        reveal: (_id, fn) => fn(),
        progress: (id) => cues[id]?.progress ?? 0,
      },
      teaching: {
        axes: (o) => ({
          bounds: { x: o.x, y: o.y, width: o.width, height: o.height },
          point: (x, y) => ({
            x: o.x + ((x - o.xDomain[0]) / (o.xDomain[1] - o.xDomain[0])) * o.width,
            y: o.y + o.height - ((y - o.yDomain[0]) / (o.yDomain[1] - o.yDomain[0])) * o.height,
          }),
        }),
        curve() {},
        routedTransfer() {},
        vectorAccumulation() {},
      },
    };
  draw(ctx, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, maths, circles, rects };
}
test('each opposite-input witness and the failed identity wait for their own completed result', () => {
  const a = paint('affine-identity', 1, {
    'affine-witness-values': during,
    'nn-affine-negative': during,
    'nn-affine-zero': during,
  });
  assert(!a.labels.includes('F(x) = -0.25'));
  assert(!a.labels.includes('F(x) = -0.46'));
  const z = paint('affine-identity', 1, {
    'affine-witness-values': after,
    'nn-affine-negative': after,
    'nn-affine-zero': after,
  });
  assert(z.labels.includes('F(x) = -0.25'));
  assert(z.labels.includes('F(x) = -0.46'));
  assert(
    !paint('affine-identity', 2, { 'affine-identity-beat-2': during }).maths.some((x) =>
      x.includes('=-0.71'),
    ),
  );
  assert(
    paint('affine-identity', 2, { 'affine-identity-beat-2': after }).maths.some((x) =>
      x.includes('=-0.71'),
    ),
  );
});
test('SwiGLU activation, products and output projection have separate result permissions', () => {
  const a = paint('activation-products', 3, {
    'nn-swiglu-activation': during,
    'swiglu-product-values': during,
    'nn-swiglu-output': during,
  });
  assert(!a.labels.includes('[0.731, −0.238]'));
  assert(!a.labels.includes('[2.193, 0.238]'));
  assert(!a.maths.some((x) => x.includes('0.858')));
  const z = paint('activation-products', 3, {
    'nn-swiglu-activation': after,
    'swiglu-product-values': after,
    'nn-swiglu-output': after,
  });
  assert(z.labels.includes('[0.731, −0.238]'));
  assert(z.labels.includes('[2.193, 0.238]'));
  assert(z.maths.some((x) => x.includes('0.858')));
});
test('layer counts and their total are earned independently', () => {
  const a = paint('parameter-scale', 1, {
    'nn-dense-first': during,
    'nn-dense-second': during,
    'nn-dense-third': during,
    'dense-count-values': during,
  });
  assert(!a.labels.includes('200960'));
  assert(!a.maths.some((x) => x.includes('235146')));
  const first = paint('parameter-scale', 1, { 'nn-dense-first': after });
  assert(first.labels.includes('200960'));
  assert(!first.labels.includes('32896'));
  const z = paint('parameter-scale', 1, {
    'nn-dense-first': after,
    'nn-dense-second': after,
    'nn-dense-third': after,
    'dense-count-values': after,
  });
  assert(z.maths.some((x) => x.includes('235146')));
});
test('BCE derivatives, corner secant and finite loss wait for their full clauses', () => {
  const prediction = paint('output-denominator', 1);
  assert(!prediction.labels.includes('2 requests × 3 labels = 6 loss terms'));
  assert(!paint('output-denominator', 2, { 'bce-six-products': during }).labels.includes('−1/12'));
  assert(paint('output-denominator', 2, { 'bce-six-products': after }).labels.includes('−1/12'));
  assert(
    !paint('output-denominator', 3, {
      'timeout-box': after,
      'bce-positive-weight': during,
    }).labels.includes('3 × (−0.5) = −1.5'),
  );
  assert(
    paint('output-denominator', 3, {
      'timeout-box': after,
      'bce-positive-weight': after,
    }).labels.includes('3 × (−0.5) = −1.5'),
  );
  assert(
    !paint('corner-check', 1, { 'corner-secant-result': during }).labels.includes('secant 0.5'),
  );
  assert(
    !paint('stable', 2, { 'stable-logit-loss': during }).maths.some((x) =>
      x.includes('approx1000'),
    ),
  );
  assert(
    paint('stable', 2, { 'stable-logit-loss': after }).maths.some((x) => x.includes('approx1000')),
  );
});
test('route outcomes and completed calibration statistic wait while observation construction is identified', () => {
  const a = paint('checked-risk-report', 0, { 'route-policy-result': during });
  assert(!a.labels.includes('slow path'));
  assert(
    paint('checked-risk-report', 0, { 'route-policy-result': after }).labels.includes('slow path'),
  );
  const p = paint('checked-risk-report', 1, { 'calibration-bucket-result': during });
  assert(!p.labels.includes('93 verified timeouts'));
  assert(p.labels.some((x) => x.startsWith('Current verification:')));
  assert(
    paint('checked-risk-report', 1, { 'calibration-bucket-result': after }).maths.includes(
      '93/100=0.93',
    ),
  );
});
test('fixed lamp geometry and fixed hidden values appear together after the complete answer', () => {
  const a = paint('payoff', 0, { 'final-lamp-reveal': during });
  assert(!a.labels.includes('h₁ = 1.3'));
  assert.equal(a.circles.length, 0);
  const z = paint('payoff', 0, { 'final-lamp-reveal': after });
  assert(z.labels.includes('h₁ = 1.3'));
  assert(z.labels.includes('lamp = 0.7'));
  assert.equal(z.circles.length, 1);
  assert(Math.abs(z.circles[0][0] - (300 + (980 * 1.4) / 2.2)) < 1e-9);
  assert(Math.abs(z.circles[0][1] - (800 - (420 * 0.8) / 1.3)) < 1e-9);
});
test('fresh logit, positive owner, negative owner and updated score have distinct complete clauses', () => {
  assert(
    !paint('earned-gradient-transfer', 0, {
      'fresh-forward-values': after,
      'nn-fresh-logit': during,
    }).labels.includes('-0.39'),
  );
  assert(
    paint('earned-gradient-transfer', 0, {
      'fresh-forward-values': after,
      'nn-fresh-logit': after,
    }).labels.includes('-0.39'),
  );
  const p = paint('earned-gradient-transfer', 1, {
    'fresh-gradient-products': after,
    'nn-fresh-negative': during,
  });
  assert(p.labels.includes('∇ 0.0596'));
  assert(!p.labels.includes('∇ -0.1193'));
  assert(
    paint('earned-gradient-transfer', 1, {
      'fresh-gradient-products': after,
      'nn-fresh-negative': after,
    }).labels.includes('∇ -0.1193'),
  );
  assert(
    !paint('earned-gradient-transfer', 2, {
      'fresh-gradient-step': after,
      'fresh-gradient-result': during,
    }).labels.some((x) => x.includes('same request: score')),
  );
  assert(
    paint('earned-gradient-transfer', 2, {
      'fresh-gradient-step': after,
      'fresh-gradient-result': after,
    }).labels.some((x) => x.includes('same request: score')),
  );
});
