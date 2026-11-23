import { DENSE_VECTORS } from '../fixtures.mjs';
import { equation, footer, text } from '../defaults.mjs';
import { normalizeVector, dotProduct } from 'vizmatic';
export function drawDenseLane(ctx, scene, state, api) {
  const { C: themeColors, teaching, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85),
    reveal = (step) => (beat > step ? 1 : beat < step ? 0 : q);
  {
    const plot = teaching.axes({
      x: 260,
      y: 350,
      width: 770,
      height: 440,
      xDomain: [0, 1.2],
      yDomain: [0, 1.2],
      equalUnits: true,
      xTicks: [0, 0.5, 1],
      yTicks: [0.5, 1],
      fontSize: 26,
    });
    const normalization = api.focus.progress('normalize-vectors', reveal(1)),
      encoding = api.focus.progress('encode-vectors', reveal(0));
    const vectors = DENSE_VECTORS.map(normalizeVector),
      labels = ['Garden guide', 'tomato query', 'Cooking'];
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 65,
        },
        (_, i) => ({
          x: Math.cos((i * Math.PI) / 128),
          y: Math.sin((i * Math.PI) / 128),
        }),
      ),
      color: '#8d9cb955',
      width: 2,
      progress: normalization,
    });
    vectors.forEach((v, i) => {
      const shown = v.map(
          (value, j) => api.lerp(DENSE_VECTORS[i][j], value, normalization) * encoding,
        ),
        end = plot.point(...shown),
        origin = plot.point(0, 0);
      api.focus.target('query-passage-vectors', () =>
        api.arrow(
          ctx,
          origin.x,
          origin.y,
          end.x,
          end.y,
          [themeColors.green, themeColors.yellow, themeColors.pink][i],
          4,
        ),
      );
      text(
        ctx,
        api,
        labels[i],
        [250, 625, 980][i],
        285,
        30,
        [themeColors.green, themeColors.yellow, themeColors.pink][i],
      );
    });
    const cosine = dotProduct(vectors[0], vectors[1]);
    text(
      ctx,
      api,
      beat === 0 ? 'Supplied 2D vectors' : 'Normalize to unit length',
      1380,
      350,
      32,
      themeColors.muted,
      'center',
    );
    api.focus.target('cosine-rule', () =>
      equation(ctx, api, String.raw`\cos(q,d)=\frac{q\cdot d}{\|q\|\|d\|}`, 1380, 550, 42),
    );
    api.focus.target('cosine-score', () =>
      text(ctx, api, cosine.toFixed(3), 1380, 700, 64, themeColors.green, 'center'),
    );
    footer(ctx, api, 'Embedding quality and approximate-index recovery are separate questions');
  }
}
export default {
  id: 'dense-lane',
  draw: drawDenseLane,
  cues: ['encode-vectors', 'normalize-vectors', 'cosine-match', 'embedding-limit'],
};
