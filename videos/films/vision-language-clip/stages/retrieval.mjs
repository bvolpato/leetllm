import { IMAGE_NAMES } from '../fixtures.mjs';
import { FIXTURE } from '../observations.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawClipText, withClipFocus } from '../defaults.mjs';
export function drawRetrieval(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    drawClipText(ctx, api, 'Three stored photos and one incoming query', 960, 280, 36);
    const plot = teaching.axes({
      x: 250,
      y: 370,
      width: 1000,
      height: 500,
      equalUnits: true,
      xDomain: [-0.1, 1.1],
      yDomain: [-0.1, 1.1],
      xTicks: [0, 1],
      yTicks: [0, 1],
      xLabel: 'unit feature 1',
      yLabel: 'unit feature 2',
      fontSize: 25,
    });
    const q = clauseProgress('query-enter', 1);
    FIXTURE.images.forEach((v, i) => {
      const p = plot.point(v[0], v[1]);
      withClipFocus(ctx, api, 'retrieval-index', () =>
        api.circle(ctx, p.x, p.y, 14, [themeColors.green, themeColors.blue, themeColors.pink][i]),
      );
      drawClipText(
        ctx,
        api,
        IMAGE_NAMES[i],
        p.x + (i === 0 ? -65 : 90),
        p.y - 35,
        25,
        [themeColors.green, themeColors.blue, themeColors.pink][i],
      );
    });
    const at = plot.point(FIXTURE.texts[0][0] * q, FIXTURE.texts[0][1] * q);
    if (q > 0) {
      api.circle(ctx, at.x, at.y, 10, themeColors.yellow);
      drawClipText(ctx, api, 'Cosine with the query', 1490, 340, 29, themeColors.yellow);
    }
    withClipFocus(ctx, api, 'retrieval-query', () =>
      drawClipText(
        ctx,
        api,
        '“Blocked vent on rack door”',
        960,
        975,
        32,
        themeColors.yellow,
      ),
    );
    FIXTURE.retrievalScores.forEach((v, i) =>
      drawClipText(
        ctx,
        api,
        q >= 0.98 ? IMAGE_NAMES[i] + ': ' + v.toFixed(3) : IMAGE_NAMES[i] + ' stored',
        1510,
        450 + i * 150,
        29,
        i === 0 ? themeColors.green : themeColors.muted,
      ),
    );
    drawClipText(
      ctx,
      api,
      'Two coordinates shown   ·   all three used for retrieval',
      960,
      1040,
      27,
      themeColors.muted,
    );
  }
}
export default {
  id: 'retrieval',
  draw: drawRetrieval,
  cues: [
    'retrieval-beat-1-focus-1',
    'retrieval-beat-2-focus-1',
    'retrieval-beat-2-focus-2',
    'query-enter',
    'retrieval-beat-3-focus-1',
  ],
};
