import { MESSAGES, QUERY } from '../fixtures.mjs';
import { clamp, mix, scoreRows, terms } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCaption, drawMessage, drawText, withFocus } from '../defaults.mjs';
export function drawScan(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const scan = progress('scan-run', 0),
      done = currentBeat > 0 ? 4 : Math.floor(scan * 4 + 1e-8),
      scores = scoreRows();
    withFocus(ctx, api, 'scan-records', () =>
      MESSAGES.forEach((r, i) => {
        const local = currentBeat > 0 ? 1 : clamp(scan * 4 - i),
          matches = terms(QUERY).filter((term) => terms(r.text).includes(term)),
          arrived = matches.filter((_, j) => local >= (j + 1) / (matches.length + 1)).length;
        drawMessage(
          ctx,
          api,
          r,
          180,
          330 + i * 135,
          1270,
          i < done ? (scores[i].score ? themeColors.green : themeColors.muted) : themeColors.blue,
        );
        drawText(
          ctx,
          api,
          local > 0 ? arrived : '?',
          1610,
          402 + i * 135,
          52,
          arrived ? themeColors.green : themeColors.muted,
          'center',
        );
        const at = matches.findIndex(
          (_, j) => local > j / (matches.length + 1) && local < (j + 1) / (matches.length + 1),
        );
        if (at >= 0) {
          const q = (local - at / (matches.length + 1)) * (matches.length + 1);
          drawText(ctx, api, matches[at], 1610, 355 + i * 135, 21, themeColors.cyan, 'center');
          drawText(
            ctx,
            api,
            '+1',
            mix(1465, 1550, q),
            405 + i * 135,
            24,
            themeColors.yellow,
            'center',
          );
        }
      }),
    );
    drawCaption(
      ctx,
      api,
      done + ' / 4 records read · each matched query word deposits one point',
      themeColors.yellow,
    );
  }
}
export default {
  id: 'scan',
  draw: drawScan,
  cues: ['scan-run', 'scan-cost'],
};
