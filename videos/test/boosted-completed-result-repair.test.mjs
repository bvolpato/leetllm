import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { draw, freshSplitState } = await import(
    process.env.BOOSTED_REPAIR_SOURCE
      ? pathToFileURL(process.env.BOOSTED_REPAIR_SOURCE)
      : new URL('../animations/boosted-trees.mjs', import.meta.url)
  ),
  Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(new URL('../lessons/boosted-trees.lesson.yaml', import.meta.url), 'utf8'),
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
      text: (_c, s, x, y, size, color) => labels.push({ text: String(s), color }),
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
      components: {
        card: (o) => {
          if ((o.opacity ?? 1) >= 0.25) labels.push({ text: o.label, color: o.textColor });
          return o;
        },
        fade: (_o, fn) => fn(),
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
        transfer() {},
        vectorAccumulation() {},
      },
    };
  const state = { beat, beatP: 0.6, cues };
  draw(ctx, scene, state, api);
  return {
    labels,
    maths,
    circles,
    rects,
    state,
    has: (s) => labels.some((x) => x.text.includes(s)),
  };
}
test('residual list and frozen leaf means wait for their own clauses while current MSE stays available', () => {
  const a = paint('residual', 1, {
    'residual-beat-2-focus-1': during,
    'gbt-residual-leaf-means': during,
  });
  assert(!a.has('Residuals · -4, 2, 14'));
  assert(!a.has('Mean residual · -1'));
  assert(a.has('MSE 72.000'));
  const z = paint('residual', 1, {
    'residual-beat-2-focus-1': after,
    'gbt-residual-leaf-means': after,
  });
  assert(z.has('Residuals · -4, 2, 14'));
  assert(z.has('Mean residual · -1'));
});
test('leaf optimum and the isolated100/.98curvature columns wait for complete clauses', () => {
  assert(
    !paint('curvature-split', 1, { 'leaf-optimum': during }).maths.some((x) => x.includes('w^*')),
  );
  assert(
    paint('curvature-split', 1, { 'leaf-optimum': after }).maths.some((x) => x.includes('w^*')),
  );
  const a = paint('curvature-split', 3, {
    'gbt-curvature-hundred': during,
    'curvature-regularize': during,
  });
  assert(!a.labels.some((x) => x.text === '100' || x.text === '0.98'));
  const z = paint('curvature-split', 3, {
    'gbt-curvature-hundred': after,
    'curvature-regularize': after,
  });
  assert(z.labels.some((x) => x.text === '100'));
  assert(z.labels.some((x) => x.text === '0.98'));
});
test('histogram gain, leaf weights and final winning summary are distinct', () => {
  const a = paint('histogram-scan', 1, {
    'histogram-gain-one': during,
    'gbt-histogram-one-weights': during,
  });
  assert(!a.has('gain 0.171429'));
  const g = paint('histogram-scan', 1, { 'histogram-gain-one': after });
  assert(g.has('gain 0.171429'));
  assert(!g.has('leaf weights 0.4'));
  const z = paint('histogram-scan', 2, {
    'histogram-gain-two': after,
    'gbt-histogram-two-weights': after,
    'gbt-histogram-winner': during,
  });
  assert(z.has('leaf weights 0.6667'));
  assert(!z.has('center cut separates'));
  assert(paint('histogram-scan', 2, { 'gbt-histogram-winner': after }).has('center cut separates'));
});
test('ordered statistic values remain pending through the complete supplied list', () => {
  const a = paint('sampling-categorical', 2, { 'ordered-statistic': during });
  assert(!a.has('stat = 0.75'));
  assert(paint('sampling-categorical', 2, { 'ordered-statistic': after }).has('stat = 0.75'));
});
test('all-alert cost and the first-minimum tie conclusion have completed permissions', () => {
  assert(!paint('cost-policy', 2, { 'baseline-hurdle': during }).has('656 units'));
  assert(paint('cost-policy', 2, { 'baseline-hurdle': after }).has('656 units'));
  assert(!paint('selection-contract', 1, { 'gbt-selection-tie': during }).has('first minimum'));
  assert(paint('selection-contract', 1, { 'gbt-selection-tie': after }).has('first minimum'));
});
test('new May savings and each release slice wait without concealing already earned counts', () => {
  assert(
    !paint('threshold-boundary', 2, { 'gbt-may-savings': during }).has('saves 12 false alerts'),
  );
  assert(paint('threshold-boundary', 2, { 'gbt-may-savings': after }).has('saves 12 false alerts'));
  const a = paint('release', 0, { 'release-priority': during, 'release-large': during });
  assert(!a.has('36 of 36'));
  assert(!a.has('31 of 31'));
  const z = paint('release', 0, { 'release-priority': after, 'release-large': after });
  assert(z.has('36 of 36'));
  assert(z.has('31 of 31'));
});
test('each changed-policy recall is earned separately and failure colors wait for verdict', () => {
  const a = paint('slice-boundaries', 1, {
    'slice-recall-result': after,
    'gbt-slice-large-result': during,
    'gbt-slice-verdict': during,
  });
  assert(a.has('26/36'));
  assert(!a.has('20/31'));
  assert.equal(a.labels.find((x) => x.text.startsWith('26/36')).color, 'cyan');
  const z = paint('slice-boundaries', 1, {
    'slice-recall-result': after,
    'gbt-slice-large-result': after,
    'gbt-slice-verdict': after,
  });
  assert(z.has('20/31'));
  assert.equal(z.labels.find((x) => x.text.startsWith('26/36')).color, 'pink');
});
test('Shapley averages and raw-score versus sigmoid answers are independently earned', () => {
  const a = paint('attribution-game', 1, { 'shap-average': after, 'gbt-shap-b': during });
  assert(a.has('φA ='));
  assert(!a.has('φB ='));
  const z = paint('attribution-game', 3, { 'shap-logit': after, 'gbt-shap-probability': during });
  assert(z.has('raw score = -0.32'));
  assert(!z.has('sigmoid ='));
  assert(
    paint('attribution-game', 3, { 'shap-logit': after, 'gbt-shap-probability': after }).has(
      'sigmoid = 0.420676',
    ),
  );
});
test('request reduction holds the changed scoring segment and19ms/5%result together', () => {
  const a = paint('serving-work', 1, { 'request-clock-after': during });
  assert(!a.has('19 ms'));
  assert(!a.has('5% lower'));
  const z = paint('serving-work', 1, { 'request-clock-after': after });
  assert(z.has('19 ms'));
  assert(z.has('5% lower'));
});
test('fresh current gains stay mathematical while parent/cut/weight/logit/probability/action verdicts wait', () => {
  assert(!paint('earned-split-transfer', 1, { 'fresh-block': during }).has('retain parent'));
  assert(paint('earned-split-transfer', 1, { 'fresh-block': after }).has('retain parent'));
  const a = paint('earned-split-transfer', 2, {
    'fresh-gamma': after,
    'fresh-cut': during,
    'fresh-logits': during,
  });
  assert.equal(freshSplitState(a.state).selected, null);
  const c = paint('earned-split-transfer', 2, {
    'fresh-gamma': after,
    'fresh-cut': after,
    'gbt-fresh-weights': during,
  });
  assert(c.has('earliest positive tie'));
  assert(!c.has('wL = .4'));
  const p = paint('earned-split-transfer', 3, {
    'fresh-probabilities': during,
    'fresh-actions': during,
  });
  assert(!p.has('p = 0.524979'));
  assert(!p.has('positive missed'));
  const z = paint('earned-split-transfer', 3, {
    'fresh-probabilities': after,
    'fresh-actions': after,
  });
  assert(z.has('p = 0.524979'));
  assert(z.has('positive missed'));
});
