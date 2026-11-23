import { cueFraction } from '../cues.mjs';
import { original, transposed } from '../storage.mjs';

function matrix(ctx, api, left, label, order, columns, active, color) {
  const { C } = api;
  api.text(ctx, label, left, 642, 38, color);
  order.forEach((value, i) => {
    const x = left + (i % columns) * 115;
    const y = 675 + Math.floor(i / columns) * 86;
    api.rect(ctx, x, y, 103, 75, i === active ? color : C.panel, color, 7);
    api.text(ctx, String(value), x + 52, y + 54, 47, i === active ? C.bg : C.ink, 'center');
  });
}

const cellCenter = (i) => 345 + 245 * i;

// Trace only the distance already read. The six stored values stay in place.
function traceRead(ctx, api, from, to, fraction, color) {
  const point = (t) => ({
    x: cellCenter(from + (to - from) * t),
    y: 372 - (to < from ? 70 : to - from > 1 ? 125 : 52) * Math.sin(Math.PI * t),
  });
  const points = Array.from({ length: 33 }, (_, i) => point((fraction * i) / 32));
  if (fraction > 0) api.path(ctx, points, { color, width: 7 });
  return points.at(-1);
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const fraction = (id, beat, start, end) => cueFraction(state, id, beat, start, end);
  // The first hop is already underway during the short lead before the first spoken word.
  const lead = 0.36 * (1 - Math.exp(-((state.t ?? 0) + 0.22) / 0.7));
  const firstHop = lead + (1 - lead) * fraction('jump-out', 0, 0, 0.19);
  const returnHop = fraction('jump-back', 0, 0.46, 0.66);
  const blue = fraction('blue-walk', 1, 0.06, 0.48) * (original.length - 1);
  const goldIndex = (firstHop >= 1 ? 1 : 0) + (returnHop >= 1 ? 1 : 0);
  const blueIndex = Math.floor(blue);
  const readingGold = state.beat === 0;
  const color = readingGold ? C.yellow : C.blue;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  api.focus.target('storage-readers', () => {
    let head;
    if (readingGold) {
      head = traceRead(ctx, api, transposed[0], transposed[1], firstHop, color);
      if (returnHop > 0) head = traceRead(ctx, api, transposed[1], transposed[2], returnHop, color);
    } else {
      for (let i = 0; i < original.length - 1 && i <= blueIndex; i++) {
        head = traceRead(ctx, api, original[i], original[i + 1], Math.min(1, blue - i), color);
      }
    }
    api.circle(ctx, head.x, head.y, 19, color, C.bg, 4);
    api.text(ctx, 'Storage', 85, 462, 36, C.ink);
    const active = readingGold ? transposed[goldIndex] : original[blueIndex];
    original.forEach((value, i) => {
      const x = cellCenter(i);
      api.rect(ctx, x - 106, 393, 212, 119, i === active ? color : C.panel, color, 9);
      api.text(ctx, String(value), x, 477, 70, i === active ? C.bg : C.ink, 'center');
    });
    matrix(ctx, api, 150, 'Original  x', original, 3, readingGold ? -1 : blueIndex, C.blue);
    matrix(ctx, api, 680, 'Transpose  x.T', transposed, 2, goldIndex, C.yellow);
  });

  api.focus.target('stride-test', () => {
    if (firstHop >= 1) api.text(ctx, 'Memory steps', 1110, 642, 38, C.ink);
    const delta = (a, b) => {
      const d = b - a;
      return d > 0 ? '+' + d : '−' + Math.abs(d);
    };
    const hop = (a, b) => a + ' → ' + b + '   (' + delta(a, b) + ')';
    if (firstHop >= 1) api.text(ctx, hop(transposed[0], transposed[1]), 1110, 733, 44, C.yellow);
    if (returnHop >= 1) api.text(ctx, hop(transposed[1], transposed[2]), 1470, 733, 44, C.yellow);
    if (blueIndex >= 1)
      api.text(
        ctx,
        'Original   ' + delta(original[0], original[1]) + ' per step',
        1110,
        836,
        41,
        C.blue,
      );
    if (state.beat === 2) {
      const blueOK = fraction('view-blue', 2, 0.05, 0.28) >= 1;
      const goldFails = fraction('view-gold', 2, 0.3, 0.52) >= 1;
      api.text(ctx, 'x.view(-1)     ' + (blueOK ? 'stride (1,)' : '?'), 150, 1004, 38, C.blue);
      api.text(
        ctx,
        'x.T.view(-1)     ' + (goldFails ? 'RuntimeError' : '?'),
        680,
        1004,
        38,
        C.yellow,
      );
    }
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['jump-out', 'jump-back', 'blue-walk', 'view-blue', 'view-gold'],
};
