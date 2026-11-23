import { clamp } from '../arithmetic.mjs';
import { arrow, drawText, footer, line, mark, pill, tokenRail } from '../defaults.mjs';
export function drawHostedBoundaries(ctx, scene, state, api) {
  return api.focus.target('hosted-boundaries-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const markerVisible =
        currentBeat === 0
          ? cueVisible('host-marker')
          : currentBeat === 1
            ? cueVisible('host-endpoint')
            : true;
      const none = currentBeat === 1 && cueVisible('host-none') && !cueVisible('host-min'),
        minimum = currentBeat === 1 && cueVisible('host-min');
      const guide = minimum ? 900 : 6000;
      drawText(
        ctx,
        api,
        'Select an eligible endpoint; retain the separate entry state',
        150,
        270,
        31,
      );
      tokenRail(
        ctx,
        api,
        180,
        415,
        1520,
        [guide, 48],
        guide + 48,
        [themeColors.blue, themeColors.cyan],
        90,
      );
      drawText(ctx, api, 'Stable guide · ' + guide + ' tokens', 180, 390, 31, themeColors.blue);
      drawText(ctx, api, 'Changing suffix', 1490, 620, 27, themeColors.cyan, 'center');
      if (markerVisible && !none) {
        const x = 180 + (1520 * guide) / (guide + 48);
        mark(ctx, api, 'host-marker', () => {
          line(ctx, api, x, 380, x, 555, themeColors.yellow, 4);
          drawText(ctx, api, 'marked endpoint', x - 20, 330, 27, themeColors.yellow, 'right');
        });
      }
      if (currentBeat === 0) {
        pill(
          ctx,
          api,
          'Endpoint selected',
          180,
          745,
          460,
          markerVisible ? themeColors.yellow : themeColors.muted,
        );
        pill(ctx, api, 'Entry availability: separate check', 1000, 745, 700, themeColors.muted);
        arrow(ctx, api, 680, 778, 950, 778, themeColors.yellow, cueProgress('host-marker'));
      } else if (currentBeat === 1) {
        mark(ctx, api, 'host-none', () =>
          drawText(
            ctx,
            api,
            none
              ? 'No markers · explicit-only → 0 reads / 0 writes'
              : 'Explicit-only: suffix remains outside the selected write',
            960,
            745,
            32,
            none ? themeColors.pink : themeColors.green,
            'center',
          ),
        );
        mark(ctx, api, 'host-min', () => {
          if (minimum) {
            drawText(
              ctx,
              api,
              'Marked 900 < supplied minimum 1,024',
              960,
              850,
              35,
              themeColors.pink,
              'center',
            );
            drawText(
              ctx,
              api,
              'More unmarked suffix cannot repair this endpoint',
              960,
              915,
              28,
              themeColors.yellow,
              'center',
            );
          }
        });
      } else {
        mark(ctx, api, 'host-minimum', () =>
          pill(
            ctx,
            api,
            'Newer-family minimum: 1,024 visible tokens',
            180,
            670,
            950,
            themeColors.yellow,
          ),
        );
        mark(ctx, api, 'host-prewarm', () => {
          if (cueVisible('host-prewarm'))
            pill(
              ctx,
              api,
              'Prewarm → write charge · no answer generation',
              180,
              760,
              950,
              themeColors.blue,
            );
        });
        mark(ctx, api, 'host-refresh', () => {
          if (cueVisible('host-refresh')) {
            drawText(
              ctx,
              api,
              '30m read of valid 12h coverage',
              1480,
              720,
              24,
              themeColors.cyan,
              'center',
            );
            drawText(
              ctx,
              api,
              'max(existing, read + 30m)',
              1480,
              795,
              24,
              themeColors.cyan,
              'center',
            );
            drawText(ctx, api, 'Does not restart 12h', 1480, 875, 26, themeColors.yellow, 'center');
          }
        });
      }
      footer(
        ctx,
        api,
        'Current service contracts were checked on 2026-11-06; this film makes no provider call.',
      );
    }
  });
}
export default {
  id: 'hosted-boundaries',
  draw: drawHostedBoundaries,
  cues: [
    'host-marker',
    'host-endpoint',
    'host-none',
    'host-min',
    'host-minimum',
    'host-prewarm',
    'host-refresh',
  ],
};
