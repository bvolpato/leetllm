import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import {
  createClosedPathCapture,
  auditArrowheadClosedPaths,
} from '../lib/arrowhead-path-intersections.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';
import { drawFrame } from '../lib/scene.mjs';

const head = [
  { x: 4, y: 0 },
  { x: -4, y: 3 },
  { x: -4, y: -3 },
];
const square = (left, top, right, bottom) => [
  { x: left, y: top },
  { x: right, y: top },
  { x: right, y: bottom },
  { x: left, y: bottom },
];
const matrices = [
  [1, 0, 0, 1, 500, 400],
  [0, 2, -2, 0, 500, 400],
  [2, 0.5, -0.7, 1.3, 500, 400],
  [-1.1, 0.4, 0.5, 1.6, 500, 400],
  [4, 0, 0, 0.25, 500, 400],
  [0.01, 0, 0, 0.02, 500, 400],
];

function nativeFixture({
  points = square(-1, -1, 1, 1),
  triangle = head,
  width = 0.4,
  matrix = matrices[0],
  closed = true,
  alpha = 1,
  arrowAlpha = 1,
  before,
  after,
  order = 1,
} = {}) {
  const canvas = createCanvas(1920, 1080),
    capture = createClosedPathCapture(canvas.getContext('2d')),
    ctx = capture.context;
  ctx.setTransform(...matrix);
  before?.(ctx);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  if (closed) ctx.closePath();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff';
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  after?.(ctx);
  ctx.stroke();
  const stroke = capture.strokes[0],
    m = stroke.matrix;
  const map = (p) => ({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f });
  const arrow = {
    kind: 'arrow',
    id: 'head',
    from: map({ x: -10, y: 0 }),
    to: map(triangle[0]),
    head: triangle.map(map),
    alpha: arrowAlpha,
    order: 2,
  };
  const path = {
    kind: 'path',
    id: 'loop',
    points: stroke.points.map((p) => ({ ...p })),
    closed,
    strokeAlpha: alpha,
    order,
  };
  return {
    canvas,
    capture,
    audit: { connectors: [arrow], paths: [path], shapes: [] },
    result: () =>
      auditArrowheadClosedPaths({ connectors: [arrow], paths: [path] }, capture.strokes),
  };
}

test('the measured Linear inverse head crosses an earlier-painted 81-point closed curve', () => {
  // Native frame10266, source65b4ff28/runtime5a: plot center(485,615), radius11.4, width4.
  const points = Array.from({ length: 81 }, (_, i) => ({
    x: 485 + 11.4 * Math.cos((i / 80) * Math.PI * 2),
    y: 615 - 11.4 * Math.sin((i / 80) * Math.PI * 2),
  }));
  const triangle = [
    { x: 485, y: 600.1939024390244 },
    { x: 492, y: 610.5581707317074 },
    { x: 478, y: 610.5581707317074 },
  ];
  const frame = nativeFixture({
    points,
    triangle,
    width: 4,
    closed: false,
    matrix: [1, 0, 0, 1, 0, 0],
    alpha: 0.6941176470588235,
    arrowAlpha: 0.6941176470588235,
    order: 11,
    before: (ctx) => {
      ctx.beginPath();
      ctx.rect(200, 330, 570, 570);
      ctx.clip();
    },
  });
  frame.audit.connectors[0].order = 12;
  assert.deepEqual(
    findArrowheadOcclusions(frame.audit),
    [],
    'the existing circle audit correctly has no registered circle to inspect',
  );
  const original = structuredClone(frame.audit),
    result = auditArrowheadClosedPaths(frame.audit, frame.capture.strokes);
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.unsupported, []);
  assert.equal(result.candidates[0].pathOrder, 11);
  assert.equal(result.candidates[0].arrowOrder, 12);
  assert.equal(result.candidates[0].overlap.nativeDistance, 0);
  assert.equal(result.candidates[0].clipping, 'entire-stroke-contained');
  assert.deepEqual(frame.audit, original);
});

test('actual native affine strokes preserve crossing, off-tip, enclosing-hole, outside and contact results', () => {
  const cases = [
    { points: square(-1, -1, 1, 1), expected: 1 },
    { points: square(0, 1.5, 1, 2.5), expected: 1 },
    { points: square(-10, -10, 10, 10), expected: 0 },
    { points: square(20, 20, 22, 22), expected: 0 },
    { points: square(-8, -5, -5, 5), width: 2, expected: 0 },
    { points: square(-8, -5, -5 + 1e-6, 5), width: 2, expected: 1 },
  ];
  for (const matrix of matrices)
    for (const c of cases) {
      const { candidates, unsupported } = nativeFixture({ ...c, matrix }).result();
      assert.deepEqual(unsupported, [], JSON.stringify({ matrix, c }));
      assert.equal(candidates.length, c.expected, JSON.stringify({ matrix, c }));
    }
});

test('paint order is independent while effective faint paint is excluded', () => {
  for (const order of [1, 2, 3])
    assert.equal(nativeFixture({ order }).result().candidates.length, 1);
  for (const alpha of [0, 0.1])
    assert.deepEqual(nativeFixture({ alpha }).result(), { candidates: [], unsupported: [] });
  for (const arrowAlpha of [0, 0.1])
    assert.deepEqual(nativeFixture({ arrowAlpha }).result(), { candidates: [], unsupported: [] });
});

test('open paths, self-intersecting loops and degenerate heads or loops do not create candidates', () => {
  for (const config of [
    { closed: false },
    {
      points: [
        { x: -2, y: -2 },
        { x: 2, y: 2 },
        { x: -2, y: 2 },
        { x: 2, y: -2 },
      ],
    },
    {
      points: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
    {
      triangle: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
  ])
    assert.deepEqual(nativeFixture(config).result(), { candidates: [], unsupported: [] });
  const frame = nativeFixture();
  frame.audit.connectors[0].kind = 'line';
  assert.deepEqual(auditArrowheadClosedPaths(frame.audit, frame.capture.strokes), {
    candidates: [],
    unsupported: [],
  });
});

test('unknown and partial clips, curved clips and unsupported paint cannot yield an all-clear', () => {
  for (const config of [
    {
      before: (ctx) => {
        ctx.beginPath();
        ctx.rect(0, 0, 2, 2);
        ctx.clip();
      },
    },
    {
      before: (ctx) => {
        ctx.beginPath();
        ctx.arc(0, 0, 100, 0, 2 * Math.PI);
        ctx.clip();
      },
    },
    {
      after: (ctx) => {
        ctx.lineJoin = 'miter';
      },
    },
    {
      after: (ctx) => {
        ctx.setLineDash([1, 1]);
      },
    },
    {
      after: (ctx) => {
        ctx.scale(2, 1);
      },
    },
    {
      after: (ctx) => {
        ctx.globalCompositeOperation = 'copy';
      },
    },
    {
      after: (ctx) => {
        ctx.bezierCurveTo(2, 3, 4, 5, -1, -1);
      },
    },
  ]) {
    const result = nativeFixture(config).result();
    assert.equal(result.candidates.length, 0);
    assert.equal(result.unsupported.length, 1);
  }
  const frame = nativeFixture();
  assert.match(
    auditArrowheadClosedPaths(frame.audit, []).unsupported[0].reason,
    /no matching native linear stroke/,
  );
});

test('convex clips contain complete affine strokes while concave clips remain unsupported', () => {
  for (const matrix of matrices) {
    const result = nativeFixture({
      matrix,
      before: (ctx) => {
        ctx.beginPath();
        ctx.rect(-20, -20, 40, 40);
        ctx.clip();
      },
    }).result();
    assert.deepEqual(result.unsupported, []);
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0].clipping, 'entire-stroke-contained');
  }
  const result = nativeFixture({
    before: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.lineTo(0, 0);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.clip();
    },
  }).result();
  assert.equal(result.candidates.length, 0);
  assert.match(result.unsupported[0].reason, /clip/);
});

test('identical centerlines with different native stroke geometry are explicitly ambiguous', () => {
  const frame = nativeFixture();
  frame.capture.context.lineWidth = 2;
  frame.capture.context.stroke();
  const result = frame.result();
  assert.equal(result.candidates.length, 0);
  assert.match(result.unsupported[0].reason, /ambiguous stroke geometry/);
});

test('closed-path capture leaves complete renderer pixels, audit geometry and native methods unchanged', () => {
  for (const size of [
    [1920, 1080],
    [960, 540],
  ]) {
    const plain = createCanvas(...size),
      wrapped = createCanvas(...size),
      native = wrapped.getContext('2d');
    const methods = Object.fromEntries(
      ['beginPath', 'moveTo', 'lineTo', 'stroke', 'save', 'restore'].map((key) => [
        key,
        native[key],
      ]),
    );
    const capture = createClosedPathCapture(native),
      scene = { title: 'Closed path geometry' },
      state = { t: 1, duration: 3, opacity: 0.7 };
    const draw = (ctx, _scene, _state, api) => {
      ctx.save();
      ctx.transform(1.3, 0.2, -0.1, 0.8, 400, 400);
      api.path(ctx, square(-20, -20, 20, 20), {
        id: 'loop',
        closed: true,
        color: '#63deec80',
        width: 4,
      });
      api.arrow(ctx, -40, 0, 25, 0, '#ff988d', 7);
      ctx.restore();
    };
    const before = drawFrame(plain.getContext('2d'), {}, scene, state, draw);
    const after = drawFrame(capture.context, {}, scene, state, draw);
    assert.deepEqual(wrapped.data(), plain.data());
    assert.deepEqual(after, before);
    assert.equal(auditArrowheadClosedPaths(after, capture.strokes).candidates.length, 1);
    capture.dispose();
    for (const [key, method] of Object.entries(methods)) assert.equal(native[key], method);
    assert.equal(native.globalAlpha, 1);
    assert.deepEqual(native.getTransform(), plain.getContext('2d').getTransform());
  }
});

test('save/restore and a failed draw leave captured clipping isolated from the next frame', () => {
  const canvas = createCanvas(1920, 1080),
    native = canvas.getContext('2d'),
    capture = createClosedPathCapture(native);
  const state = { t: 1, duration: 3, opacity: 1 };
  try {
    assert.throws(
      () =>
        drawFrame(capture.context, {}, {}, state, (ctx) => {
          ctx.beginPath();
          ctx.rect(0, 0, 1, 1);
          ctx.clip();
          throw new Error('deliberate draw failure');
        }),
      /deliberate draw failure/,
    );
  } finally {
    capture.reset();
  }
  const audit = drawFrame(capture.context, {}, {}, state, (ctx, _scene, _state, api) => {
    api.path(ctx, square(480, 380, 520, 420), { id: 'loop', closed: true, width: 4 });
    api.arrow(ctx, 460, 400, 525, 400, '#fff', 7);
  });
  assert.equal(auditArrowheadClosedPaths(audit, capture.strokes).candidates.length, 1);
  assert.deepEqual(capture.strokes.at(-1).clips, []);
});

test('missing native/registered geometry and invalid thresholds fail explicitly', () => {
  assert.throws(() => auditArrowheadClosedPaths({}, []), /connectors, paths/);
  const frame = nativeFixture();
  assert.throws(
    () =>
      auditArrowheadClosedPaths(frame.audit, frame.capture.strokes, {
        minimumArrowAlpha: -1,
        minimumStrokeAlpha: 0.25,
      }),
    /thresholds/,
  );
  frame.audit.connectors[0].head = undefined;
  assert.throws(() => frame.result(), /finite triangular head/);
});
