import { H } from '../fixtures.mjs';
import { event } from '../model.mjs';
import { drawRow, drawTarget, drawText, drawWords } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  {
    drawWords(ctx, api, 0, 310, true);
    drawWords(ctx, api, 1, 470);
    const carry = event(state, 'carry-password', 1);
    drawTarget(ctx, api, 'selected-state', () => {
      const y = 725 + carry * 40;
      drawText(
        ctx,
        api,
        'password · supplied word state',
        960,
        y - 28,
        33,
        themeColors.yellow,
        'center',
      );
      drawRow(ctx, api, H[0][2], 805, y, themeColors.yellow, 155);
    });
    drawText(
      ctx,
      api,
      'Which other word states will move?',
      960,
      960,
      35,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['choose-password', 'carry-password'],
};
