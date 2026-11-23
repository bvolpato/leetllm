import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findArrowheadOcclusions,
  findArrowheadRingOcclusions,
} from '../lib/arrowhead-occlusion.mjs';

const arrow = (options = {}) => ({
  kind: 'arrow',
  id: 'vector',
  from: { x: 0, y: 0 },
  to: { x: 20, y: 10 },
  order: 2,
  alpha: 1,
  ...options,
});
const circle = (options = {}) => ({
  kind: 'circle',
  id: 'state',
  center: { x: 20, y: 10 },
  axisX: { x: 8, y: 0 },
  axisY: { x: 0, y: 8 },
  order: 3,
  fillAlpha: 1,
  ...options,
});
const audit = (a = arrow(), s = circle()) => ({ connectors: [a], shapes: [s] });

test('a measured Reward hollow ring reports side overlap while its endpoint stays clear', () => {
  // Reward frame 1252, likelihood-first-piece: immutable 5a native geometry.
  const vector = arrow({
    from: { x: 604, y: 490 },
    to: { x: 662, y: 490 },
    order: 9,
    head: [
      { x: 662, y: 490 },
      { x: 650.2941876694152, y: 495.654551943446 },
      { x: 650.2941876694152, y: 484.345448056554 },
    ],
  });
  const ring = circle({
    center: { x: 661.1278195488723, y: 490 },
    order: 10,
    fillAlpha: 0,
    strokeAlpha: 1,
    strokeWidth: 2,
  });
  assert(
    Math.hypot(vector.to.x - ring.center.x, vector.to.y - ring.center.y) < 7,
    'The endpoint is inside the transparent hole, away from the stroke',
  );
  const frame = audit(vector, ring),
    before = structuredClone(frame);
  const issues = findArrowheadOcclusions(frame);
  assert.equal(
    issues.filter((issue) => issue.type === 'arrowhead-overlapped-by-circle-stroke').length,
    1,
  );
  assert.deepEqual(frame, before);
});

test('a later filled state marker reports the true arrow endpoint without mutating geometry', () => {
  const frame = audit(),
    before = structuredClone(frame),
    [issue] = findArrowheadOcclusions(frame);
  assert.equal(issue.type, 'arrowhead-covered-by-circle');
  assert.equal(issue.arrowId, 'vector');
  assert.equal(issue.circleId, 'state');
  assert.deepEqual(issue.endpoint, { x: 20, y: 10 });
  assert.deepEqual(frame, before);
});

test('hollow comparisons and markers painted before the arrow keep its tip visible', () => {
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ fillAlpha: 0 }))), []);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ order: 1 }))), []);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ order: 2 }))), []);
  assert.deepEqual(
    findArrowheadOcclusions(audit(arrow(), circle({ fillAlpha: 0 })), {
      minimumArrowAlpha: 0,
      minimumFillAlpha: 0,
    }),
    [],
  );
});

test('the true ellipse excludes outside endpoints even inside its bounding box', () => {
  const shape = circle({ center: { x: 0, y: 0 }, axisX: { x: 10, y: 0 }, axisY: { x: 0, y: 2 } });
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ to: { x: 9, y: 1.9 } }), shape)), []);
  assert.equal(findArrowheadOcclusions(audit(arrow({ to: { x: 3, y: 1 } }), shape)).length, 1);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ to: { x: 10, y: 0 } }), shape)), []);
});

test('rotated and sheared circle axes preserve endpoint containment', () => {
  const shape = circle({ center: { x: 0, y: 0 }, axisX: { x: 4, y: 4 }, axisY: { x: 2, y: -1 } });
  assert.equal(findArrowheadOcclusions(audit(arrow({ to: { x: 3, y: 1.5 } }), shape)).length, 1);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ to: { x: 5, y: -2 } }), shape)), []);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ axisY: { x: 16, y: 0 } }))), []);
});

test('a computed node-boundary attachment tolerates roundoff while a truly inset tip remains covered', () => {
  const shape = circle({
    center: { x: 850, y: 540 },
    axisX: { x: 78, y: 0 },
    axisY: { x: 0, y: 78 },
  });
  const endpoint = { x: 790.5687332147621, y: 489.4834232325479 };
  assert.deepEqual(
    findArrowheadOcclusions(audit(arrow({ to: endpoint }), shape)),
    [],
    'the measured Gradients attachment meets the node border without entering its fill',
  );
  for (const axes of [
    [
      { x: 78, y: 0 },
      { x: 0, y: 78 },
    ],
    [
      { x: 48, y: 16 },
      { x: -12, y: 40 },
    ],
    [
      { x: 7, y: -3 },
      { x: 2, y: 5 },
    ],
  ]) {
    const affine = circle({ center: { x: 0, y: 0 }, axisX: axes[0], axisY: axes[1] });
    for (let step = 0; step < 64; step++) {
      const angle = (step * Math.PI) / 32,
        u = Math.cos(angle),
        v = Math.sin(angle);
      const at = (scale) => ({
        x: scale * (axes[0].x * u + axes[1].x * v),
        y: scale * (axes[0].y * u + axes[1].y * v),
      });
      assert.deepEqual(
        findArrowheadOcclusions(audit(arrow({ to: at(1) }), affine)),
        [],
        'boundary contact',
      );
      assert.equal(
        findArrowheadOcclusions(audit(arrow({ to: at(1 - 1e-9) }), affine)).length,
        1,
        'a small real inset is still reported',
      );
      assert.deepEqual(
        findArrowheadOcclusions(audit(arrow({ to: at(1 + 1e-9) }), affine)),
        [],
        'outside the fill',
      );
    }
  }
});

test('effective paint alpha excludes fades and transparent fills while keeping visible covers', () => {
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ alpha: 0.1 }))), []);
  assert.deepEqual(
    findArrowheadOcclusions(audit(arrow({ alpha: 0 })), {
      minimumArrowAlpha: 0,
      minimumFillAlpha: 0,
    }),
    [],
  );
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ fillAlpha: 0.1 }))), []);
  assert.equal(
    findArrowheadOcclusions(audit(arrow({ alpha: 0.5 }), circle({ fillAlpha: 0.5 }))).length,
    1,
  );
});

test('arrowed attachments are checked while lines, rectangles and zero-length vectors are excluded', () => {
  assert.equal(findArrowheadOcclusions(audit(arrow({ kind: 'connect' }))).length, 1);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ kind: 'line' }))), []);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow(), circle({ kind: 'rect' }))), []);
  assert.deepEqual(findArrowheadOcclusions(audit(arrow({ from: { x: 20, y: 10 } }))), []);
});

test('missing painted geometry fails explicitly rather than passing as a clean frame', () => {
  assert.throws(() => findArrowheadOcclusions({}), /connectors and shapes/);
  assert.throws(() => findArrowheadOcclusions(audit(arrow({ order: undefined }))), /paint order/);
  assert.throws(
    () => findArrowheadOcclusions(audit(arrow(), circle({ axisX: undefined }))),
    /affine axes/,
  );
});

const triangle = (
  head = [
    { x: 4, y: 0 },
    { x: -4, y: 3 },
    { x: -4, y: -3 },
  ],
) => arrow({ from: { x: -10, y: 0 }, to: head[0], head });
const ring = (options = {}) =>
  circle({
    center: { x: 0, y: 0 },
    axisX: { x: 1, y: 0 },
    axisY: { x: 0, y: 1 },
    fillAlpha: 0,
    strokeAlpha: 1,
    strokeWidth: 0.4,
    ...options,
  });

test('ring overlap uses the triangle area, including a ring partly outside the head', () => {
  assert.equal(
    findArrowheadRingOcclusions(audit(triangle(), ring({ center: { x: 0, y: 1.8 } }))).length,
    1,
    'The ring center and endpoint are outside each other, but the stroke cuts a sloping head side',
  );
  assert.equal(
    findArrowheadRingOcclusions(audit(triangle(), ring({ center: { x: -2, y: 0 } }))).length,
    1,
    'A ring inside the triangle still paints over part of its filled area',
  );
  assert.deepEqual(
    findArrowheadRingOcclusions(audit(triangle(), ring({ center: { x: 20, y: 20 } }))),
    [],
  );
  assert.deepEqual(
    findArrowheadRingOcclusions(
      audit(triangle(), ring({ axisX: { x: 10, y: 0 }, axisY: { x: 0, y: 10 }, strokeWidth: 2 })),
    ),
    [],
    'A large enclosing ring leaves the whole head inside its transparent hole',
  );
});

test('annulus tangency is contact while a real crossing is reported', () => {
  const outer = ring({ strokeWidth: 2 }); // Outer radius 2.
  assert.deepEqual(
    findArrowheadRingOcclusions(
      audit(
        triangle([
          { x: 2, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: -1 },
        ]),
        outer,
      ),
    ),
    [],
  );
  assert.equal(
    findArrowheadRingOcclusions(
      audit(
        triangle([
          { x: 2 - 1e-8, y: 0 },
          { x: 3, y: 1 },
          { x: 3, y: -1 },
        ]),
        outer,
      ),
    ).length,
    1,
  );
  const inner = ring({ axisX: { x: 3, y: 0 }, axisY: { x: 0, y: 3 }, strokeWidth: 2 }); // Inner radius 2.
  assert.deepEqual(
    findArrowheadRingOcclusions(
      audit(
        triangle([
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ]),
        inner,
      ),
    ),
    [],
  );
  assert.equal(
    findArrowheadRingOcclusions(
      audit(
        triangle([
          { x: 2 + 1e-8, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ]),
        inner,
      ),
    ).length,
    1,
  );
});

test('a measured tiny affine ring tolerates recorder subtraction error at inner contact', () => {
  // Native scale(.01,.02), translate(500,400), radius14/width2 at exact head contact.
  const head = [
    { x: 500.19999999552965, y: 400 },
    { x: 500.08294187484023, y: 400.11309103634113 },
    { x: 500.08294187484023, y: 399.88690896365887 },
  ];
  const vector = arrow({ from: { x: 500, y: 400 }, to: head[0], head });
  const shape = ring({
    center: head[0],
    axisX: { x: 0.13999999687075615, y: 0 },
    axisY: { x: 0, y: 0.2799999937415123 },
    strokeWidth: 0.03999999910593033,
  });
  assert.deepEqual(findArrowheadRingOcclusions(audit(vector, shape)), []);
  const crossing = { ...vector, head: head.map((p, i) => ({ x: p.x - (i ? 1e-7 : 0), y: p.y })) };
  assert.equal(findArrowheadRingOcclusions(audit(crossing, shape)).length, 1);
});

test('rotation, shear, nonuniform scale and reflection preserve ring classifications', () => {
  const fixtures = [
    [triangle(), ring({ center: { x: 0, y: 1.8 } }), 1],
    [triangle(), ring({ axisX: { x: 10, y: 0 }, axisY: { x: 0, y: 10 }, strokeWidth: 2 }), 0],
    [
      triangle([
        { x: 2, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: -1 },
      ]),
      ring({ strokeWidth: 2 }),
      0,
    ],
    [triangle(), ring({ center: { x: 20, y: 20 } }), 0],
  ];
  for (const [a, b, c, d] of [
    [0, 2, -2, 0],
    [2, 0.5, -0.7, 1.3],
    [-1.1, 0.4, 0.5, 1.6],
    [4, 0, 0, 0.25],
  ]) {
    const vector = (p) => ({ x: a * p.x + c * p.y, y: b * p.x + d * p.y });
    const point = (p) => {
      const q = vector(p);
      return { x: q.x + 10, y: q.y - 7 };
    };
    for (const [head, shape, expected] of fixtures) {
      const oldScale = Math.max(
        Math.hypot(shape.axisX.x, shape.axisX.y),
        Math.hypot(shape.axisY.x, shape.axisY.y),
      );
      const axisX = vector(shape.axisX),
        axisY = vector(shape.axisY);
      const newScale = Math.max(Math.hypot(axisX.x, axisX.y), Math.hypot(axisY.x, axisY.y));
      const transformed = audit(
        { ...head, from: point(head.from), to: point(head.to), head: head.head.map(point) },
        {
          ...shape,
          center: point(shape.center),
          axisX,
          axisY,
          strokeWidth: (shape.strokeWidth * newScale) / oldScale,
        },
      );
      assert.equal(findArrowheadRingOcclusions(transformed).length, expected);
    }
  }
});

test('ring checks respect effective alpha, paint order and filled-node attachment conventions', () => {
  for (const shape of [
    ring({ strokeAlpha: 0 }),
    ring({ strokeAlpha: 0.1 }),
    ring({ order: 1 }),
    ring({ order: 2 }),
    ring({ fillAlpha: 1 }),
  ]) {
    assert.deepEqual(findArrowheadRingOcclusions(audit(triangle(), shape)), []);
  }
  assert.deepEqual(findArrowheadRingOcclusions(audit({ ...triangle(), alpha: 0.1 }, ring())), []);
  assert.equal(
    findArrowheadRingOcclusions(
      audit(
        { ...triangle(), kind: 'connect', alpha: 0.5 },
        ring({ strokeAlpha: 0.5, fillAlpha: 0.1 }),
      ),
    ).length,
    1,
  );
  assert.deepEqual(findArrowheadRingOcclusions(audit({ ...triangle(), kind: 'line' }, ring())), []);
  const node = circle({
    center: { x: 850, y: 540 },
    axisX: { x: 78, y: 0 },
    axisY: { x: 0, y: 78 },
    strokeAlpha: 1,
    strokeWidth: 3,
  });
  assert.deepEqual(
    findArrowheadOcclusions(
      audit(arrow({ to: { x: 790.5687332147621, y: 489.4834232325479 } }), node),
    ),
    [],
    'The existing measured filled-node boundary remains contact, even with its visible border',
  );
});

test('visible rings require supported head and stroke geometry', () => {
  assert.throws(() => findArrowheadRingOcclusions(audit(arrow(), ring())), /triangular arrow head/);
  assert.throws(
    () => findArrowheadRingOcclusions(audit(triangle(), ring({ strokeWidth: 0 }))),
    /positive registered stroke width/,
  );
  assert.throws(
    () => findArrowheadRingOcclusions(audit(triangle(), ring({ axisY: { x: 2, y: 0 } }))),
    /nonsingular affine/,
  );
  assert.throws(
    () =>
      findArrowheadRingOcclusions(
        audit(
          triangle([
            { x: 1e200, y: 0 },
            { x: 0, y: 1e200 },
            { x: -1e200, y: 0 },
          ]),
          ring(),
        ),
      ),
    /finite normalized triangle/,
  );
  assert.throws(
    () => findArrowheadRingOcclusions(audit(triangle(), ring({ strokeWidth: 1e200 }))),
    /finite normalized stroke/,
  );
  assert.throws(
    () =>
      findArrowheadRingOcclusions(audit(triangle(), ring()), {
        minimumArrowAlpha: 0.25,
        minimumFillAlpha: 0.25,
        minimumStrokeAlpha: 2,
      }),
    /alpha thresholds/,
  );
});
