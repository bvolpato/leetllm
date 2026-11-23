import { MESSAGES } from '../fixtures.mjs';
import { mix } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import {
  drawCaption,
  drawCard,
  drawMessage,
  drawPanel,
  drawReference,
  drawText,
  drawTransfer,
  withFocus,
} from '../defaults.mjs';
export function drawMembership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const first = progress('membership-first', 0),
      second = progress('membership-second', 1);
    drawMessage(ctx, api, MESSAGES[0], 180, 245, 1550);
    const tokens = [
        withFocus(ctx, api, 'membership-token-0', () =>
          drawCard(ctx, api, 'twice', 230, 450, 350, 90, themeColors.cyan),
        ),
        withFocus(ctx, api, 'membership-token-1', () =>
          drawCard(ctx, api, 'twice.', 230, 650, 350, 90, themeColors.cyan),
        ),
      ],
      count = Number(first >= 0.98) + Number(second >= 0.98);
    const target = withFocus(ctx, api, 'membership-set', () =>
      drawPanel(ctx, api, 1110, 460, 580, 140, themeColors.green, () => {
        drawText(ctx, api, 'Posting set', 1140, 510, 28, themeColors.green);
        drawText(
          ctx,
          api,
          count ? '{ M0 }' : '{ }',
          1400,
          548,
          36,
          themeColors.ink,
          'center',
          'mono',
        );
      }),
    );
    [first, second].forEach((p, i) => {
      if (p > 0 && p < 0.98) {
        const moving = drawReference(
          ctx,
          api,
          0,
          mix(610, 880, p),
          mix(i ? 650 : 450, 490, p),
          themeColors.yellow,
          1,
          160,
        );
        drawTransfer(ctx, api, tokens[i], moving, themeColors.cyan);
        drawTransfer(ctx, api, moving, target, themeColors.cyan);
        const countCopy = drawCard(
          ctx,
          api,
          'occurrence +1',
          mix(610, 950, p),
          830,
          230,
          64,
          themeColors.yellow,
          1,
          24,
        );
        api.line(ctx, 1030, 800, 1030, 790, themeColors.yellow, 3);
      }
    });
    withFocus(ctx, api, 'membership-frequency', () =>
      drawCard(ctx, api, 'Frequency: ' + count, 1110, 680, 580, 95, themeColors.yellow, 1, 34),
    );
    drawText(ctx, api, 'Dictionary lookup key: twice', 1380, 390, 28, themeColors.cyan, 'center');
    drawCaption(
      ctx,
      api,
      count === 2
        ? 'Two occurrences · one document membership'
        : 'One message identity enters at most once',
      themeColors.green,
    );
  }
}
export default {
  id: 'membership',
  draw: drawMembership,
  cues: ['membership-first', 'membership-second'],
};
