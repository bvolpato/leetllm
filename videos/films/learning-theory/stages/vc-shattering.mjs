import { triangleFixture } from '../fixtures.mjs';
import { separatorForMask } from '../model.mjs';
import { cueEnded, cueProgress, focusOn, line, text } from '../defaults.mjs';

function triangle(ctx, api, cx, cy, mask) {
  const { C } = api;
  const { a, b, threshold } = separatorForMask(mask);
  const scale = 1.45;
  const edges = [];
  if (b)
    for (const x of [-94, 94]) {
      const y = (threshold - a * x) / b;
      if (Math.abs(y) <= 76) edges.push([x, y]);
    }
  if (a)
    for (const y of [-76, 76]) {
      const x = (threshold - b * y) / a;
      if (Math.abs(x) <= 94) edges.push([x, y]);
    }
  if (edges.length >= 2) {
    const [p, q] = edges;
    line(
      ctx,
      api,
      cx + scale * p[0],
      cy + scale * p[1],
      cx + scale * q[0],
      cy + scale * q[1],
      C.yellow,
      4,
    );
  }
  triangleFixture.forEach(([x, y], i) => {
    const plus = Boolean(mask & (1 << i));
    api.circle(ctx, cx + scale * x, cy + scale * y, 19, plus ? C.blue : C.pink);
    text(ctx, api, plus ? '+' : '−', cx + scale * x, cy + scale * y + 9, 29, C.bg, 'center');
  });
}

export function drawVcShattering(ctx, scene, state, api) {
  const { C } = api;
  focusOn(api, 'label-geometry', () => {
    if (state.beat === 4) {
      text(ctx, api, 'Line through the origin', 520, 325, 43, C.ink, 'center');
      line(ctx, api, 205, 592, 835, 592, C.muted, 3);
      line(ctx, api, 520, 385, 520, 800, C.muted, 3);
      line(ctx, api, 306, 753, 734, 431, C.yellow, 6);
      api.circle(ctx, 520, 592, 10, C.yellow);
      text(ctx, api, 'VC dimension 2', 520, 905, 40, C.ink, 'center');
      text(ctx, api, 'Right threshold', 1400, 325, 43, C.ink, 'center');
      const markerY = 602;
      const markerRadius = 31;
      const axisY = markerY + markerRadius + 22;
      line(ctx, api, 1050, axisY, 1730, axisY, C.muted, 3);
      for (const [x, sign, color] of [
        [1250, '+', C.blue],
        [1570, '−', C.pink],
      ]) {
        line(ctx, api, x, axisY, x, markerY + markerRadius, C.muted, 3);
        api.circle(ctx, x, markerY, markerRadius, color);
        text(ctx, api, sign, x, markerY + 13, 39, C.bg, 'center');
      }
      text(ctx, api, 'Missing labeling on two ordered inputs', 1400, 747, 31, C.muted, 'center');
      text(ctx, api, 'VC dimension 1', 1400, 905, 40, C.ink, 'center');
      return;
    }
    if (state.beat === 0) {
      const n = 1 + Math.floor(7 * cueProgress(state, 'triangle-gallery'));
      for (let mask = 0; mask < n; mask++)
        triangle(ctx, api, 320 + (mask % 4) * 420, 442 + Math.floor(mask / 4) * 305, mask);
      text(ctx, api, n + ' of 8 binary labelings', 960, 967, 43, C.ink, 'center');
      return;
    }
    const move = cueProgress(state, 'move-inside');
    const interior = state.beat >= 3;
    const corners = [
      [408, 345],
      [958, 345],
      [958, 835],
    ];
    const inside = [
      corners.reduce((s, p) => s + p[0], 0) / 3,
      corners.reduce((s, p) => s + p[1], 0) / 3,
    ];
    const fourth = [408 + (inside[0] - 408) * move, 835 + (inside[1] - 835) * move];
    const points = [...corners, fourth];
    const sides = interior ? 3 : 4;
    for (let i = 0; i < sides; i++) {
      const [a, b] = [points[i], points[(i + 1) % sides]];
      line(ctx, api, ...a, ...b, interior ? C.blue : C.muted, 3);
    }
    if (!interior) {
      for (const [i, j, id, color] of [
        [0, 2, 'join-plus', C.blue],
        [1, 3, 'join-minus', C.pink],
      ]) {
        const p = cueProgress(state, id),
          a = points[i],
          b = points[j];
        if (p) line(ctx, api, ...a, a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, color, 8);
      }
      if (cueEnded(state, 'join-minus')) api.circle(ctx, 683, 590, 13, C.yellow);
    }
    points.forEach(([x, y], i) => {
      const plus = interior ? i < 3 : i % 2 === 0;
      api.circle(ctx, x, y, 31, plus ? C.blue : C.pink);
      text(ctx, api, plus ? '+' : '−', x, y + 13, 39, C.bg, 'center');
    });
    const lines =
      state.beat === 1
        ? ['Can one straight line', 'separate the two pairs?']
        : !interior
          ? ['The segments meet.', 'One point cannot be', 'on both sides of a line.']
          : ['Three positive vertices', 'put their whole triangle', 'on the positive side.'];
    if (state.beat !== 2 || cueEnded(state, 'join-minus'))
      lines.forEach((v, i) => text(ctx, api, v, 1420, 465 + 70 * i, 43, C.ink, 'center'));
    else text(ctx, api, 'Join each same-sign pair.', 1420, 535, 39, C.ink, 'center');
    let bottom = 'Four fixed points   ·   alternating labels';
    if (state.beat === 2 && cueEnded(state, 'square-count'))
      bottom = '14 of 16 patterns work on the square. Both alternating patterns fail.';
    if (interior)
      bottom = cueEnded(state, 'vc-dimension')
        ? 'Affine halfspaces in the plane   ·   VC dimension 3'
        : 'A second four-point configuration';
    text(ctx, api, bottom, 960, 974, 39, C.yellow, 'center');
  });
}
export default {
  id: 'vc-shattering',
  draw: drawVcShattering,
  cues: [
    'triangle-gallery',
    'square-prediction',
    'join-plus',
    'join-minus',
    'square-count',
    'move-inside',
    'vc-dimension',
  ],
};
