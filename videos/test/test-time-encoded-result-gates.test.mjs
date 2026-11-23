import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { draw, selectorCueSnapshot } from '../animations/test-time-compute.mjs';
const Y = createRequire(import.meta.url)('yaml');
const lesson = Y.parse(
  fs.readFileSync(new URL('../lessons/test-time-compute.lesson.yaml', import.meta.url), 'utf8'),
);
const during = { phase: 'during', progress: 0.999 },
  after = { phase: 'after', progress: 1 };
function paint(id, beat, override = {}) {
  const scene = lesson.scenes.find((s) => s.id === id),
    labels = [],
    circles = [],
    colors = [],
    curves = [];
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      (b.visual_cues ?? []).map((c) => [
        c.id,
        { phase: i < beat ? 'after' : 'before', progress: i < beat ? 1 : 0 },
      ]),
    ),
  );
  Object.assign(cues, override);
  const add = (s, color) => {
    labels.push(String(s));
    colors.push({ text: String(s), color });
  };
  const api = {
    C: new Proxy({}, { get: (_, k) => String(k) }),
    clamp: (n) => Math.max(0, Math.min(1, n)),
    phase: (p, a, z) => Math.max(0, Math.min(1, (p - a) / (z - a))),
    lerp: (a, z, p) => a + (z - a) * p,
    text: (_ctx, s, _x, _y, _n, color) => add(s, color),
    math: (_ctx, s) => add(s),
    rect() {},
    line() {},
    arrow() {},
    circle: (_ctx, ...args) => circles.push(args),
    path() {},
    focus: {
      target: (_id, f) => f(),
      progress: (id, fallback = 0) => cues[id]?.progress ?? fallback,
      reveal: (id, f) => {
        if (cues[id]?.progress > 0) f();
      },
    },
    components: {
      fade: (p, f) => {
        if (p > 0) f();
      },
      card: ({ label, ...r }) => {
        add(label, r.textColor);
        return r;
      },
    },
    teaching: {
      axes: () => ({
        point: (x, y) => ({ x, y }),
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      }),
      flowGraph: ({ nodes }) => nodes.forEach((n) => add(n.label, n.color)),
      bars() {},
      scatter() {},
      curve: (q) => curves.push(q.points),
    },
  };
  draw({}, scene, { beat, beatP: 0.5, cues }, api);
  return { labels, colors, circles, curves };
}
test('candidate results and correctness colors wait for complete independent selectors', () => {
  const p = paint('candidates', 0, { 'plurality-vote': during, 'arithmetic-check': during });
  assert(!p.labels.some((x) => x.startsWith('plurality:') || x.startsWith('calculator accepts:')));
  assert.equal(p.colors.find((x) => x.text === '44').color, 'blue');
  const q = paint('candidates', 0, { 'plurality-vote': after, 'arithmetic-check': after });
  assert(q.labels.includes('plurality: 32'));
  assert(q.labels.includes('calculator accepts: 44'));
  assert.equal(q.colors.find((x) => x.text === '44').color, 'green');
});
test('new overrated score remains in pool while returned winner waits for its complete clause', () => {
  const p = selectorCueSnapshot(0, 1, 1, 0.999);
  assert.equal(p.rows.length, 3);
  assert.equal(p.winner.answer, 44);
  assert(p.pending);
  const q = selectorCueSnapshot(0, 1, 1, 1);
  assert.equal(q.winner.answer, 48);
  assert(!q.pending);
});
test('a repair attempt is charged before its external check and retained answer complete', () => {
  const p = paint('revision', 0, { 'draft-check': after, 'repair-candidate': during });
  assert(p.labels.includes('rounds charged: 2'));
  assert(p.labels.includes('generation calls: 3'));
  assert(p.labels.some((x) => x.startsWith('D2') && x.includes('pending')));
  assert(!p.labels.some((x) => x.includes('Retained D2') || x.includes('D2 · answer 44')));
  const q = paint('revision', 0, { 'draft-check': after, 'repair-candidate': after });
  assert(q.labels.some((x) => x.includes('D2 · answer 44') && x.includes('External PASS')));
  assert(q.labels.some((x) => x.includes('Retained D2')));
});
test('later damage preserves the checked receipt while the new attempt remains pending', () => {
  const p = paint('revision', 0, {
    'draft-check': after,
    'repair-candidate': after,
    'damaged-revision': during,
  });
  assert(p.labels.includes('rounds charged: 3'));
  assert(p.labels.includes('generation calls: 5'));
  assert(p.labels.some((x) => x.startsWith('D3') && x.includes('pending')));
  assert(!p.labels.some((x) => x.startsWith('D3 · answer 48')));
  assert(p.labels.some((x) => x.includes('Retained D2') && x.includes('Latest D3: pending')));
  const q = paint('revision', 0, {
    'draft-check': after,
    'repair-candidate': after,
    'damaged-revision': after,
  });
  assert(q.labels.some((x) => x.startsWith('D3 · answer 48') && x.includes('External FAIL')));
  assert(q.labels.some((x) => x.includes('Retained D2') && x.includes('Latest D3: FAIL')));
});
test('selected budget label and selection ring use the same complete-result permission', () => {
  const p = paint('budget', 1, { 'chosen-budget': during });
  assert(!p.labels.some((x) => x.includes('chosen budget')));
  assert(!p.circles.some((x) => x[2] === 24));
  const q = paint('budget', 1, { 'chosen-budget': after });
  assert(q.labels.includes('chosen budget: 512'));
  assert(q.circles.some((x) => x[2] === 24));
});
test('raw GiB comparison waits while the current retained-position equation stays visible', () => {
  const p = paint('memory', 1, { 'kv-volume': during });
  assert(!p.labels.some((x) => x.includes('raw KV')));
  assert(p.labels.some((x) => x.includes('4000+8(1000)=12000')));
  const q = paint('memory', 1, { 'kv-volume': after });
  assert(q.labels.some((x) => x.includes('1.46 GiB') && x.includes('4.88 GiB')));
});
