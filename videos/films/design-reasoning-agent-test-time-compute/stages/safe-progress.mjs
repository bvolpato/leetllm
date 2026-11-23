import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawSafeProgress(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('safe-progress', state),
    progress = (beat, n) => sentence(state, 'safe-progress', beat, n);
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat
        ? 'A trusted status channel needs completed observations'
        : 'One request has three latency boundaries',
    );
    const times = [
        ['gateway status', 0.1],
        ['first model token', 0.8],
        ['verified final advisory', 2.5],
      ],
      x0 = 300,
      scale = 530,
      events = currentBeat ? 3 : Math.min(3, Math.floor(progress(0, 0) * 3 + 1e-8));
    api.line(ctx, x0, 560, 1700, 560, themeColors.muted, 4);
    times.forEach((v, i) => {
      if (i >= events) return;
      const x = x0 + v[1] * scale;
      api.line(ctx, x, 530, x, 590, themeColors.blue, 4);
      drawConstructionText(ctx, api, v[1] + ' s', x, 650, 33, themeColors.cyan, 'center');
      drawConstructionText(ctx, api, v[0], x, 462, 29, themeColors.blue, 'center');
    });
    if (currentBeat) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['internal source', 'public projection'],
          ['strategy / budget / evidence', 'compact allowed fields'],
          ['internal score / scratchpad', 'removed'],
          ['model text: verified', 'blocked without observation'],
        ],
        200,
        700,
        1520,
        290,
        themeColors.cyan,
        27,
      );
    } else
      drawConstructionFoot(
        ctx,
        api,
        'Illustrative timestamps are separate metrics, not observed service p95 targets.',
      );
  }
}
export default {
  id: 'safe-progress',
  draw: drawSafeProgress,
  cues: [
    'ra-safe-progress-0-0',
    'ra-safe-progress-0-1',
    'ra-safe-progress-0-2',
    'ra-safe-progress-1-0',
    'ra-safe-progress-1-1',
    'ra-safe-progress-1-2',
    'ra-safe-progress-1-3',
  ],
};
