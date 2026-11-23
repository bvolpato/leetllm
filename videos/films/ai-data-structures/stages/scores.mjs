import { MESSAGES } from '../fixtures.mjs';
import { clamp, mix } from '../arithmetic.mjs';
import { q, scoreState } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawPanel,
  drawReference,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawScores(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat;
  {
    const model = scoreState(state),
      term = currentBeat === 0 ? 'charged' : 'twice',
      ids = currentBeat === 0 ? [0, 2, 3] : [0, 2],
      p = currentBeat === 0 ? model.first : model.second;
    withFocus(ctx, api, 'score-postings', () => {
      drawCard(ctx, api, term, 725, 240, 470, 76, themeColors.cyan);
      ids.forEach((id) =>
        drawReference(ctx, api, id, 180 + id * 410, 390, themeColors.cyan, 1, 260),
      );
    });
    withFocus(ctx, api, 'score-lanes', () =>
      MESSAGES.forEach((r, i) => {
        if (model.counts[i])
          drawPanel(ctx, api, 180 + i * 410, 750, 320, 190, themeColors.blue, () => {
            drawText(ctx, api, 'key M' + r.id, 340 + i * 410, 800, 31, themeColors.blue, 'center');
            drawText(
              ctx,
              api,
              model.counts[i],
              340 + i * 410,
              890,
              65,
              themeColors.green,
              'center',
            );
          });
        else {
          drawText(ctx, api, 'M' + r.id, 340 + i * 410, 810, 30, themeColors.muted, 'center');
          if (q(state, 'score-absent', 1, 0.03, 0.13) === 1)
            drawText(ctx, api, 'No entry', 340 + i * 410, 880, 29, themeColors.muted, 'center');
        }
        const at = ids.indexOf(i);
        if (at >= 0) {
          const local = clamp(p * ids.length - at);
          if (local > 0 && local < 0.99)
            drawReference(
              ctx,
              api,
              i,
              210 + i * 410,
              mix(500, 670, local),
              themeColors.yellow,
              1,
              260,
            );
        }
      }),
    );
    drawCaption(
      ctx,
      api,
      model.visited.length + ' posting IDs visited · one increment per distinct query term',
      themeColors.yellow,
    );
  }
}
export default {
  id: 'scores',
  draw: drawScores,
  cues: ['score-charged', 'score-absent', 'score-twice'],
};
