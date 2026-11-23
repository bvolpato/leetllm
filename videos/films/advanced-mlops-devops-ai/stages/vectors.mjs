import { mix } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawVectors(ctx, scene, state, api) {
  return api.focus.target('vectors-construction', () => paintVectors(ctx, scene, state, api));
}
function paintVectors(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('vectors', state),
    currentBeat = modelState.step;
  void state.cues;
  if (state.cues) {
    const u = api.focus.progress('normalize-vectors', 0);
    modelState.a = [mix(3, 0.6, u), mix(4, 0.8, u)];
    modelState.z = [mix(2, 1, u), 0];
    modelState.scores = [modelState.a[0], modelState.z[0]];
    modelState.winner =
      modelState.scores[0] > modelState.scores[1]
        ? 'A'
        : modelState.scores[0] < modelState.scores[1]
          ? 'B'
          : 'TIE';
  }
  void state.cues;
  void state.cues;
  void state.cues;
  {
    const plot = teaching.axes({
      x: 350,
      y: 290,
      width: 560,
      height: 560,
      equalUnits: true,
      xDomain: [0, 5],
      yDomain: [0, 5],
      xTicks: [0, 1, 2, 3, 4, 5],
      yTicks: [0, 1, 2, 3, 4, 5],
      xLabel: 'query-aligned component',
      yLabel: 'other component',
      fontSize: 27,
    });
    const normalizing = state.cues
      ? api.focus.progress('normalize-vectors', 0)
      : currentBeat === 0
        ? 0
        : modelState.q;
    if (normalizing > 0) {
      for (const v of [
        [3, 4],
        [2, 0],
      ]) {
        const at = plot.point(...v),
          origin = plot.point(0, 0);
        api.arrow(ctx, origin.x, origin.y, at.x, at.y, themeColors.muted, 2);
      }
      const raw = plot.point(3, 4);
      drawOriginalText(ctx, api, 'A raw [3, 4]', raw.x + 25, raw.y - 25, 26, themeColors.muted);
    }
    const projected = plot.point(modelState.a[0], 0),
      current = plot.point(...modelState.a);
    api.line(ctx, current.x, current.y + 15, projected.x, projected.y - 15, themeColors.blue, 2);
    [
      [modelState.a, themeColors.blue, 'A'],
      [modelState.z, themeColors.cyan, 'B'],
    ].forEach(([v, color, name]) => {
      const at = plot.point(...v),
        origin = plot.point(0, 0);
      api.focus.target('document-vectors', () =>
        api.arrow(ctx, origin.x, origin.y, at.x, at.y, color, 5),
      );
      api.focus.target('vectors-readout', () =>
        drawOriginalText(
          ctx,
          api,
          name,
          at.x + (name === 'A' ? -45 : modelState.a[0] > modelState.z[0] ? -45 : 25),
          at.y + (name === 'A' ? 15 : -25),
          35,
          color,
        ),
      );
    });
    api.focus.target('vectors-query-1-0', () =>
      drawOriginalText(ctx, api, 'Query [1, 0]', 1250, 410, 35, themeColors.yellow),
    );
    api.focus.target('vectors-readout-2', () =>
      drawOriginalText(
        ctx,
        api,
        'A score ' + modelState.scores[0].toFixed(2),
        1250,
        535,
        35,
        themeColors.blue,
      ),
    );
    api.focus.target('vectors-readout-3', () =>
      drawOriginalText(
        ctx,
        api,
        'B score ' + modelState.scores[1].toFixed(2),
        1250,
        635,
        35,
        themeColors.cyan,
      ),
    );
    api.focus.target('vectors-readout-4', () =>
      drawOriginalText(ctx, api, 'Winner ' + modelState.winner, 1250, 780, 44, themeColors.green),
    );
    api.focus.target('vectors-raw-dot-product-unit-vector-dot-product-same-current-coo', () =>
      drawOriginalText(
        ctx,
        api,
        'Raw dot product → unit-vector dot product · same current coordinates drive scores',
        960,
        975,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'vectors',
  draw: drawVectors,
  cues: [
    'raw-vectors',
    'raw-winner',
    'vectors-s0-0',
    'vectors-s0-1',
    'vectors-s0-2',
    'vectors-s0-3',
    'vectors-s0-4',
    'vectors-s0-5',
    'normalize-vectors',
    'winner-reversal',
    'vectors-s1-0',
    'vectors-s1-1',
    'vectors-s1-2',
    'vectors-s1-3',
  ],
};
