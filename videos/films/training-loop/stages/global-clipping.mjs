import { loopBound } from '../arithmetic.mjs';
import { loopCueStarted } from '../construction.mjs';
import { arrow, constructionText, footer, heading, matrix, vectorLabel } from '../defaults.mjs';
export function drawGlobalClipping(ctx, scene, state, api) {
  api.focus.target('global-clipping-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    const cueStarted = (name, fallback = progress > 0.4) =>
      loopCueStarted(state.cues, name, fallback);
    {
      heading(ctx, api, 'Clip the concatenated gradient with one common scale');
      const clipped =
          currentBeat > 1 || (currentBeat === 1 && cueStarted('loop-clip-rescale', progress > 0.4)),
        g = clipped ? [3, 4] : [6, 8],
        plot = teaching.axes({
          x: 250,
          y: 335,
          width: 600,
          height: 600,
          xDomain: [-10, 10],
          yDomain: [-10, 10],
          xTicks: [-10, 0, 10],
          yTicks: [-10, 0, 10],
          equalUnits: true,
          fontSize: 24,
        }),
        o = plot.point(0, 0),
        tip = plot.point(...g);
      api.circle(ctx, o.x, o.y, 5 * 30, 'transparent', themeColors.yellow, 3);
      arrow(ctx, api, o.x, o.y, tip.x, tip.y, clipped ? themeColors.green : themeColors.pink);
      constructionText(
        ctx,
        api,
        'max norm 5',
        o.x + 200,
        o.y + 170,
        28,
        themeColors.yellow,
        'center',
      );
      matrix(
        ctx,
        api,
        [
          [6, 8],
          [g[0], g[1]],
        ],
        1150,
        420,
        clipped ? themeColors.green : themeColors.pink,
        140,
      );
      constructionText(
        ctx,
        api,
        'stored gradient ' + vectorLabel(g),
        1430,
        800,
        32,
        clipped ? themeColors.green : themeColors.pink,
        'center',
      );
      constructionText(
        ctx,
        api,
        'reported original norm: 10',
        1430,
        900,
        31,
        themeColors.yellow,
        'center',
      );
      footer(
        ctx,
        api,
        'One scalar multiplier preserves direction; per-coordinate clamping gives a different vector',
      );
    }
    return true;
  });
}
export default {
  id: 'global-clipping',
  draw: drawGlobalClipping,
  cues: [
    'global-clipping-beat-0',
    'global-clipping-beat-1',
    'loop-clip-rescale',
    'global-clipping-beat-2',
  ],
};
