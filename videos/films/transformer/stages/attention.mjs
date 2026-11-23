import { WORDS } from '../fixtures.mjs';
import { slice14 } from '../arithmetic.mjs';
import { MODEL, attentionMixFrame } from '../model.mjs';
import {
  caption,
  plane,
  plotPoint,
  pointReference,
  row,
  target,
  text,
  vectorArrow,
  withTransformerLegacyFrame,
} from '../defaults.mjs';
export function paintAttention(ctx, scene, state, api, C, b, P, f) {
  const current = attentionMixFrame(b, P, state.cues),
    colors = [C.blue, C.pink, C.green],
    plot = plane(
      ctx,
      api,
      [-1.7, 1.8],
      [-1.5, 2],
      [
        [-1, 0, 1],
        [-1, 0, 1],
      ],
    ),
    origin = plotPoint(ctx, api, plot, [0, 0]);
  text(
    ctx,
    api,
    C,
    'the query · two coordinates of each four-number value',
    960,
    242,
    30,
    C.yellow,
    'center',
  );
  const vertices = MODEL.V.map((v) => plotPoint(ctx, api, plot, slice14(v)));
  api.path(ctx, vertices, {
    closed: true,
    color: '#8d9cb960',
    width: 2,
  });
  api.circle(ctx, origin.x, origin.y, 5, C.muted);
  vertices.forEach((p, i) => {
    api.circle(ctx, p.x, p.y, 12, colors[i]);
    text(
      ctx,
      api,
      C,
      WORDS[i],
      p.x + (i === 0 ? 26 : -26),
      p.y + 9,
      28,
      colors[i],
      i === 0 ? 'left' : 'right',
    );
  });
  let previous = [0, 0];
  for (let i = 0; i < current.selected; i++) {
    const next = previous.map((v, j) => v + current.products[i][j === 0 ? 0 : 3]);
    vectorArrow(ctx, api, plot, previous, next, colors[i]);
    previous = next;
  }
  target(ctx, api, 'weighted-contribution', () => {
    vectorArrow(ctx, api, plot, current.from, current.to, colors[current.selected]);
    text(
      ctx,
      api,
      C,
      current.scaled < 1
        ? 'scale ' + WORDS[current.selected] + ' by its weight'
        : 'place the weighted arrow at the previous tip',
      1420,
      630,
      28,
      colors[current.selected],
      'center',
    );
  });
  target(ctx, api, 'attention-sum', () => {
    if (current.count > 0) {
      const previousSum = current.sum.map((v, j) => v - current.products[current.count - 1][j]);
      pointReference(
        ctx,
        api,
        C,
        plot,
        slice14(current.sum),
        slice14(previousSum),
        current.count === 3 ? 'read' : ['s₁', 's₂'][current.count - 1],
        C.yellow,
        'attention-sum-reference',
      );
    }
    text(
      ctx,
      api,
      C,
      current.count === 3
        ? 'complete blend · inside the triangle'
        : current.count + ' completed contribution' + (current.count === 1 ? '' : 's'),
      1420,
      700,
      29,
      C.yellow,
      'center',
    );
    row(ctx, api, C, f, current.sum, 1080, 735, 700, C.yellow, 78, 3);
  });
  WORDS.forEach((word, i) => {
    text(ctx, api, C, word, 1100, 370 + i * 75, 32, colors[i]);
    text(
      ctx,
      api,
      C,
      'weight ' + f(MODEL.weights[2][i], 3),
      1740,
      370 + i * 75,
      30,
      colors[i],
      'right',
    );
  });
  text(
    ctx,
    api,
    C,
    'full accumulated row · coordinates 1, 2, 3, 4',
    1420,
    870,
    26,
    C.muted,
    'center',
  );
  [0, 3].forEach((j, i) => {
    const xx = 1080 + j * 175 + 82;
    api.circle(ctx, xx, 840, 8, C.yellow);
    text(
      ctx,
      api,
      C,
      i ? 'vertical slice' : 'horizontal slice',
      i ? 1600 : 1200,
      918,
      25,
      C.muted,
      'center',
    );
  });
  caption(
    ctx,
    api,
    C,
    'Equal axis units · slice uses coordinates 1 and 4 · all arithmetic keeps full precision',
  );
}
export function drawAttentionStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintAttention);
}
export default {
  id: 'attention',
  draw: drawAttentionStage,
  cues: ['mix-function', 'mix-returns', 'mix-the'],
};
