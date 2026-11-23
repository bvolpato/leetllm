import { checkpointLayout } from '../construction.mjs';
import { spokenProgress } from '../defaults.mjs';
import { trackedColumn } from '../fixtures.mjs';
import { drawProbe, drawShardMap } from '../shard-map.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { beat } = state;
  const { C } = api;
  const row = checkpointLayout();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const leaving = Math.min(1, (state.t ?? 0) / 1.6);
  const waiting = 0.12 + 0.44 * (1 - (1 - leaving) ** 2);
  const move = spokenProgress(state, api, 'intro-move', 2, 0, 0.19);
  const indexed = spokenProgress(state, api, 'intro-local-index', 2, 0.42, 0.72) >= 1;
  drawShardMap(ctx, api, {
    showNew: true,
    markColumn: true,
    followLastWeight: true,
    copies: row.source.map((_, i) => (i === trackedColumn ? waiting + (1 - waiting) * move : 1)),
  });
  if (beat === 0 && spokenProgress(state, api, 'intro-find-six', 0, 0, 0.45) >= 1) {
    const savedRank = Math.floor(trackedColumn / row.savedWidth);
    api.text(
      ctx,
      'Column ' +
        trackedColumn +
        '   ·   saved rank ' +
        savedRank +
        '   ·   local index ' +
        (trackedColumn % row.savedWidth),
      730,
      600,
      43,
      C.yellow,
      'center',
    );
  } else if (beat < 2) {
    api.text(ctx, 'Which rank and slot get column six?', 730, 600, 46, C.ink, 'center');
  } else if (beat === 2) {
    const rank = Math.floor(trackedColumn / row.newWidth);
    const start = rank * row.newWidth;
    api.focus.target('new-address', () =>
      api.text(
        ctx,
        indexed
          ? 'Rank ' +
              rank +
              '     ·     Local index = ' +
              trackedColumn +
              ' - ' +
              start +
              ' = ' +
              (trackedColumn - start)
          : 'Global column ' + trackedColumn,
        730,
        600,
        43,
        C.yellow,
        'center',
      ),
    );
  } else if (beat === 3) {
    drawProbe(ctx, api, spokenProgress(state, api, 'intro-score', 3, 0.32, 0.46) >= 1);
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-saved-pairs',
    'intro-find-six',
    'intro-new-layout',
    'intro-choose-owner',
    'intro-move',
    'intro-local-index',
    'intro-probe',
    'intro-score',
  ],
};
