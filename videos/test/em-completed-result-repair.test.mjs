import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { draw } = await import(
  process.env.EM_REPAIR_SOURCE
    ? pathToFileURL(process.env.EM_REPAIR_SOURCE)
    : new URL('../animations/expectation-maximization.mjs', import.meta.url)
);
const Y = createRequire(import.meta.url)('yaml'),
  lesson = Y.parse(
    fs.readFileSync(
      new URL('../lessons/expectation-maximization.lesson.yaml', import.meta.url),
      'utf8',
    ),
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
    rects = [],
    C = new Proxy({}, { get: (_, k) => String(k) }),
    api = {
      C,
      clamp: (p) => Math.max(0, Math.min(1, p)),
      phase: (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a))),
      lerp: (a, b, p) => a + (b - a) * p,
      text: (_c, s) => labels.push(String(s)),
      math: (_c, s) => maths.push(String(s)),
      rect: (_c, x, y, width, height, ...style) => {
        rects.push({ x, y, width, height, style });
        return { x, y, width, height };
      },
      line: (_c, ...a) => lines.push(a),
      arrow() {},
      circle: (_c, ...a) => circles.push(a),
      focus: {
        target: (_id, fn) => fn(),
        reveal: (_id, fn) => fn(),
        progress: (id) => cues[id]?.progress ?? 0,
      },
      components: { card: (o) => o },
      teaching: {
        axes: (o) => ({
          bounds: { x: o.x, y: o.y, width: o.width, height: o.height },
          point: (x, y) => ({
            x: o.x + ((x - o.xDomain[0]) / (o.xDomain[1] - o.xDomain[0])) * o.width,
            y: o.y + o.height - ((y - o.yDomain[0]) / (o.yDomain[1] - o.yDomain[0])) * o.height,
          }),
        }),
        curve() {},
      },
    };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, maths, circles, lines, rects };
}
test('mean label and its solved geometric marker wait for the full average clause', () => {
  const a = paint('intro', 2, { 'intro-mean-result': during }),
    z = paint('intro', 2, { 'intro-mean-result': after });
  assert(!a.maths.some((s) => s.includes('=60')));
  assert(z.maths.some((s) => s.includes('=60')));
  assert.equal(z.lines.length, a.lines.length + 1);
});
test('Jensen bound, evidence, gap and posterior-touching heading have separate completed gates', () => {
  const a = paint('jensen-construction', 1, {
    'em-jensen-bound-result': during,
    'em-jensen-evidence-result': during,
    'jensen-gap': during,
  });
  assert(!a.labels.some((s) => s === '-5.164671' || s === '-4.906405' || s.includes('0.258266')));
  const z = paint('jensen-construction', 1, {
    'em-jensen-bound-result': after,
    'em-jensen-evidence-result': after,
    'jensen-gap': after,
  });
  assert(z.labels.includes('-5.164671'));
  assert(z.labels.includes('-4.906405'));
  assert(z.labels.some((s) => s.includes('0.258266')));
  assert(z.circles.length > a.circles.length);
  assert(
    !paint('jensen-construction', 2, { 'jensen-posterior': during }).labels.some(
      (s) => s === 'Posterior q makes the two joint-over-q ratios coincide',
    ),
  );
  assert(
    paint('jensen-construction', 2, { 'jensen-posterior': after }).labels.some(
      (s) => s === 'Posterior q makes the two joint-over-q ratios coincide',
    ),
  );
});
test('normalized log-space shares and constrained clamp/ridge markers wait for their clauses', () => {
  const a = paint('stable-responsibilities', 0, {
      'stable-shift': after,
      'stable-normalize': during,
    }),
    z = paint('stable-responsibilities', 0, { 'stable-shift': after, 'stable-normalize': after });
  assert(!a.labels.includes('0.8808'));
  assert(z.labels.includes('0.8808'));
  assert(z.rects.length > a.rects.length);
  const v = paint('variance-constraint', 1, { 'variance-floor': during, 'variance-ridge': during });
  assert(!v.labels.includes('clamp = 1.00'));
  assert(!v.labels.includes('add ridge = 1.25'));
  const w = paint('variance-constraint', 1, { 'variance-floor': after, 'variance-ridge': after });
  assert(w.labels.includes('clamp = 1.00'));
  assert(w.labels.includes('add ridge = 1.25'));
  assert(w.circles.length >= v.circles.length + 2);
});
test('validation scores reveal independently after their numeric clauses', () => {
  const a = paint('model-checks', 1, {
    'em-validation-separated': during,
    'em-validation-symmetric': during,
  });
  assert(!a.labels.includes('-2.64'));
  assert(!a.labels.includes('-4.82'));
  assert(
    paint('model-checks', 1, { 'em-validation-separated': after }).labels.includes('-2.64'),
  );
  assert(
    paint('model-checks', 1, { 'em-validation-symmetric': after }).labels.includes('-4.82'),
  );
});
test('fixed-noise sample, reconstruction loss and each gradient have distinct complete-clause permissions', () => {
  const a = paint('reparameterized-encoder', 2, {
    'em-encoder-sample-result': during,
    'encoder-reconstruction-loss': during,
    'encoder-reconstruction-gradients': during,
    'em-encoder-deviation-gradient': during,
    'em-encoder-weight-gradient': during,
  });
  assert(!a.maths.some((s) => s.includes('=2.000')));
  assert(!a.labels.includes('reconstruction L 0.500000'));
  assert(!a.labels.some((s) => s.includes('∂L/∂') && s.includes('-')));
  assert.equal(a.circles.length, 0);
  const m = paint('reparameterized-encoder', 2, {
    'em-encoder-sample-result': after,
    'encoder-reconstruction-loss': after,
    'encoder-reconstruction-gradients': after,
  });
  assert(m.maths.some((s) => s.includes('=2.000')));
  assert(m.labels.includes('reconstruction L 0.500000'));
  assert(m.labels.includes('∂L/∂μ -1.000'));
  assert(!m.labels.includes('∂L/∂σ -0.500'));
  assert(!m.labels.includes('∂L/∂w -2.000'));
  const z = paint('reparameterized-encoder', 2, {
    'em-encoder-sample-result': after,
    'encoder-reconstruction-loss': after,
    'encoder-reconstruction-gradients': after,
    'em-encoder-deviation-gradient': after,
    'em-encoder-weight-gradient': after,
  });
  assert(z.labels.includes('∂L/∂σ -0.500'));
  assert(z.labels.includes('∂L/∂w -2.000'));
});
test('fresh first and reversed memberships withhold actual share widths until each completed result', () => {
  const a = paint('earned-transfer', 1, { 'em-fresh-first': during });
  assert(!a.labels.includes('0.5584'));
  assert(!a.rects.some((r) => r.y === 830));
  const z = paint('earned-transfer', 1, { 'em-fresh-first': after });
  assert(z.labels.includes('0.5584'));
  const moving = paint('earned-transfer', 1, {
    'em-fresh-first': after,
    'em-fresh-prior': after,
    'em-fresh-flip': during,
  });
  assert(!moving.rects.some((r) => r.y === 830));
  const end = paint('earned-transfer', 1, {
    'em-fresh-first': after,
    'em-fresh-prior': after,
    'em-fresh-flip': after,
  });
  assert(end.labels.includes('0.2965'));
  assert.equal(
    end.rects.filter((r) => r.y === 830).reduce((sum, r) => sum + r.width, 0),
    1100,
  );
});
