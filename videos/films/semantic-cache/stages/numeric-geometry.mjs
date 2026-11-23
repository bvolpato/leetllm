import { scaledCosine } from '../arithmetic.mjs';
import {
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsTable,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintNumericGeometry(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Toy coordinates · dot product divided by both vector lengths',
    245,
  );
  if (currentBeat === 0) {
    const vectors = [
        [0.99, 0.04],
        [0.94, 0.1],
      ],
      labels = ['retention paraphrase', 'restore-key exception'];
    vectors.forEach((v, i) => {
      const x = 170 + i * 870,
        score = scaledCosine([1, 0], v),
        color = i ? themeColors.pink : themeColors.cyan;
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        labels[i],
        x + 360,
        345,
        32,
        color,
        'center',
      );
      const axes = t.axes({
        x: x + 20,
        y: 410,
        width: 650,
        height: 340,
        xDomain: [0, 1.1],
        yDomain: [0, 0.55],
        equalUnits: true,
        xTicks: [0, 1],
        yTicks: [0, 0.5],
      });
      const o = axes.point(0, 0),
        a = axes.point(1, 0),
        q = axes.point(...v);
      drawSemanticConstructionsLine(ctx, api, themeColors, o.x, o.y, a.x, a.y, themeColors.blue, 5);
      drawSemanticConstructionsLine(ctx, api, themeColors, o.x, o.y, q.x, q.y, color, 5);
      api.circle(ctx, q.x, q.y, 9, color);
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'v = [' + v.join(', ') + ']',
        x + 360,
        820,
        30,
        color,
        'center',
      );
      const reveal = done(0, i ? 'sc-cosine-exception' : 'sc-cosine-paraphrase');
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        v[0].toFixed(2) +
          ' / ' +
          Math.hypot(...v).toFixed(4) +
          ' ≈ ' +
          (reveal ? score.toFixed(4) : '?'),
        x + 360,
        930,
        34,
        reveal ? color : themeColors.muted,
        'center',
      );
    });
  } else {
    const x = [1e308, 1e308],
      scaled = x.map((v) => v / 1e308);
    drawSemanticConstructionsTable(
      ctx,
      api,
      themeColors,
      [
        ['Operation', 'First vector', 'Second vector'],
        ['Large finite input', '[1e308, 1e308]', '[1e308, −1e308]'],
        ['Divide by max |coordinate|', '[' + scaled.join(', ') + ']', '[1, −1]'],
        ['Normalize', '[1/√2, 1/√2]', '[1/√2, −1/√2]'],
        ['Normalized dot', '1/2 − 1/2', '0'],
      ],
      140,
      315,
      1640,
      116,
    );
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Reject dimension mismatch, zero vectors, NaN, infinity and Boolean coordinates',
      955,
      themeColors.pink,
      28,
    );
  }
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Scale before normalization to avoid overflow; numerical validity does not establish answer equivalence',
  );
}
export function drawNumericGeometry(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintNumericGeometry);
}
export default {
  id: 'numeric-geometry',
  draw: drawNumericGeometry,
  cues: [
    'sc-numeric-geometry-b0',
    'sc-cosine-paraphrase',
    'sc-cosine-exception',
    'sc-numeric-geometry-b1',
  ],
};
