import { xy } from '../fixtures.mjs';
import { unit } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import {
  originalFocus,
  originalFooter,
  originalLine,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  return api.focus.target('intro-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const phase = (id, beat) => directed(state, id, beat);
      const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      const labelOffsets = [
        [-28, 30],
        [-28, -22],
        [-25, -25],
        [28, 35],
        [-28, 35],
        [28, -24],
      ];
      let labelExclusions = [];
      {
        const q = originalPlot(ctx, api);
        originalFocus(ctx, api, 'message-cloud', () =>
          xy.forEach((p, i) =>
            originalPoint(
              ctx,
              api,
              ids,
              labelOffsets,
              q,
              i,
              p,
              themeColors.cyan,
              unit(6 * phase('messages-arrive', 0) - i),
            ),
          ),
        );
        originalFocus(ctx, api, 'message-pair', () => {
          originalText(ctx, api, 'A · I was charged twice.', 1280, 430, 32, themeColors.blue);
          originalText(ctx, api, 'B · Please undo this', 1280, 515, 32, themeColors.blue);
          originalText(ctx, api, 'duplicate payment.', 1320, 562, 32, themeColors.blue);
          if (currentBeat > 0)
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              xy[0],
              xy[1],
              phase('read-pair', 1),
              themeColors.blue,
              5,
            );
        });
        originalFocus(ctx, api, 'query-prompt', () => {
          originalText(ctx, api, 'Please undo my', 1500, 730, 35, themeColors.yellow, 'center');
          originalText(ctx, api, 'duplicate charge.', 1500, 780, 35, themeColors.yellow, 'center');
          originalText(ctx, api, 'Retrieved reply: ?', 1500, 875, 36, themeColors.yellow, 'center');
        });
        originalFooter(
          ctx,
          api,
          'Constructed two-coordinate vectors · reviewed wording supplies topic meaning.',
        );
      }
    }
    {
      const { C } = api;
      [
        'A · charged twice',
        'B · duplicate payment',
        'C · reset link',
        'D · two-factor code',
        'E · release runbook',
        'F · release approval',
      ].forEach((v, i) => api.text(ctx, v, 130 + i * 282, 196, 22, C.muted, 'left'));
    }
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'messages-arrive',
    'query-arrive',
    'cp-intro-0-0',
    'cp-intro-0-1',
    'cp-intro-0-2',
    'cp-intro-0-3',
    'read-pair',
    'cp-intro-1-0',
    'cp-intro-1-1',
    'cp-intro-1-2',
    'cp-intro-1-3',
  ],
};
