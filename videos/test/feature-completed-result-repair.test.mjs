import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { draw } from '../animations/feature-engineering.mjs';
const Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(new URL('../lessons/feature-engineering.lesson.yaml', import.meta.url), 'utf8'),
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
    lines = [],
    C = new Proxy({}, { get: (_, k) => String(k) });
  const api = {
    C,
    clamp: (p) => Math.max(0, Math.min(1, p)),
    phase: (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a))),
    lerp: (a, b, p) => a + (b - a) * p,
    text: (_c, s) => labels.push(String(s)),
    math: (_c, s) => maths.push(String(s)),
    rect: (_c, x, y, width, height) => ({ x, y, width, height }),
    line: (_c, ...a) => lines.push(a),
    arrow() {},
    circle: (_c, ...a) => circles.push(a),
    focus: {
      target: (_id, fn) => fn(),
      reveal: (_id, fn) => fn(),
      progress: (id) => cues[id]?.progress ?? 0,
    },
    components: {
      card: (o) => {
        if ((o.opacity ?? 1) > 0) labels.push(o.label);
        return o;
      },
      matrix() {},
    },
    teaching: {
      axes: (o) => ({
        bounds: { x: o.x, y: o.y, width: o.width, height: o.height },
        xDomain: o.xDomain,
        yDomain: o.yDomain,
        point: (x, y) => ({
          x: o.x + ((x - o.xDomain[0]) / (o.xDomain[1] - o.xDomain[0])) * o.width,
          y: o.y + o.height - ((y - o.yDomain[0]) / (o.yDomain[1] - o.yDomain[0])) * o.height,
        }),
      }),
      curve() {},
      transfer() {},
      changeCue: (o, f) => f({ value: o.from + (o.to - o.from) * o.progress, color: o.color }),
    },
  };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, maths, circles, lines };
}
test('eligible age and full-data target mean wait for completed clauses', () => {
  assert(
    !paint('decision-time', 1, { 'decision-time-beat-2-focus-2': during }).maths.some((s) =>
      s.includes('0.5'),
    ),
  );
  assert(
    paint('decision-time', 1, { 'decision-time-beat-2-focus-2': after }).maths.some((s) =>
      s.includes('0.5'),
    ),
  );
  assert(
    !paint('crossfit-construction', 0, { 'feature-target-full': during }).maths.some((s) =>
      s.includes('11/16'),
    ),
  );
  assert(
    paint('crossfit-construction', 0, { 'feature-target-full': after }).maths.some((s) =>
      s.includes('11/16'),
    ),
  );
});
test('correct and swapped aggregate geometry is withheld independently of the supplied products', () => {
  const a = paint('vector-construction', 1, {
    'feature-vector-products': after,
    'feature-product-queued': after,
    'feature-product-heartbeat': after,
    'feature-product-backlog': after,
    'feature-vector-result': during,
  });
  assert(a.labels.includes('= 0.42'));
  assert(!a.labels.includes('Score 0.61'));
  assert.equal(a.circles.length, 0);
  const z = paint('vector-construction', 1, { 'feature-vector-result': after });
  assert(z.labels.includes('Score 0.61'));
  const exchange = { 'vector-construction-2': after, 'feature-swapped-heartbeat': after };
  const before = paint('vector-construction', 2, { ...exchange, 'feature-layout-swap': during });
  assert(before.labels.includes('= 0.84'));
  assert(!before.labels.includes('Score 1.025'));
  assert.equal(before.circles.length, 0);
  const swapped = paint('vector-construction', 2, { ...exchange, 'feature-layout-swap': after });
  assert(swapped.labels.includes('Score 1.025'));
  assert(swapped.circles[0][0] > z.circles[0][0]);
  const restored = paint('vector-construction', 2, {
    ...exchange,
    'feature-layout-restore': after,
  });
  assert(restored.labels.includes('Score 0.61'));
  assert.equal(restored.circles[0][0], z.circles[0][0]);
});
test('new heartbeat and full vector wait for their separate completed clauses', () => {
  const a = paint('earned-feature-transfer', 1, {
    'feature-fresh-heartbeat': during,
    'feature-fresh-vector': during,
  });
  assert(!a.labels.some((s) => s.includes('5/6 h')));
  assert(!a.labels.includes('0.833'));
  const z = paint('earned-feature-transfer', 1, {
    'feature-fresh-heartbeat': after,
    'feature-fresh-vector': after,
  });
  assert(z.labels.some((s) => s.includes('5/6 h')));
  assert(z.labels.includes('0.833'));
});
test('final score markers and action colors have separate permissions', () => {
  const pending = paint('earned-feature-transfer', 2, { 'feature-fresh-stale': during });
  assert.equal(pending.circles.length, 0);
  const scores = paint('earned-feature-transfer', 2, {
    'feature-fresh-stale': after,
    'feature-fresh-correct': after,
    'feature-fresh-threshold': during,
  });
  assert(scores.circles.length >= 2);
  assert.equal(scores.circles.find((c) => c[2] === 19)[3], 'cyan');
  assert(!scores.labels.some((s) => s.includes('threshold 0.25 separates')));
  const decision = paint('earned-feature-transfer', 2, {
    'feature-fresh-stale': after,
    'feature-fresh-correct': after,
    'feature-fresh-threshold': after,
  });
  assert.equal(decision.circles.find((c) => c[2] === 19)[3], 'pink');
  assert(decision.labels.some((s) => s.includes('threshold 0.25 separates')));
});
test('performed source restoration commits only after the full repair clause and retains captured evidence', () => {
  const common = {
      'feature-fresh-stale': after,
      'feature-fresh-correct': after,
      'feature-fresh-threshold': after,
    },
    a = paint('earned-feature-transfer', 2, { ...common, 'feature-fresh-repair': during }),
    z = paint('earned-feature-transfer', 2, { ...common, 'feature-fresh-repair': after });
  assert(a.labels.includes('Reconstruction: backlog 0'));
  assert(z.labels.includes('Reconstruction: backlog 7'));
  assert(a.labels.some((s) => s.includes('captured backlog 0: 0.216667')));
  assert(z.labels.some((s) => s.includes('captured backlog 0: 0.216667')));
  assert(a.circles.find((c) => c[2] === 19)[0] < z.circles.find((c) => c[2] === 19)[0]);
  assert.equal(z.circles.find((c) => c[2] === 19)[3], 'green');
});
test('preprocessing score comparison and its plotted markers wait for the completed numeric and threshold clause', () => {
  const a = paint('preprocessing-change', 1, { 'feature-preprocess-score-pair': during });
  assert(!a.labels.some((s) => s.includes('0.545')));
  assert.equal(a.circles.filter((c) => c[2] === 14).length, 0);
  const z = paint('preprocessing-change', 1, { 'feature-preprocess-score-pair': after });
  assert(z.labels.some((s) => s.includes('0.545')));
  assert.equal(z.circles.filter((c) => c[2] === 14).length, 2);
});
