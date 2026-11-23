import {
  arrow,
  cueProgress,
  cueStarted,
  detailText,
  focusTarget,
  footer,
  heading,
  line,
  recordField,
  rectangle,
  sourcePage,
} from '../defaults.mjs';
export function drawParserBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Bound parser work before checking text quality');
      focusTarget(ctx, api, 'parser-limits', () => {
        sourcePage(
          ctx,
          api,
          180,
          350,
          650,
          445,
          'Restricted parser process',
          [
            'allowed type + compressed bytes',
            'page count + expanded size',
            'processing deadline + memory cap',
            'no unnecessary capabilities',
          ],
          themeColors.blue,
        );
      });
      const amount = cueProgress(ctx, api, 'expanded-size');
      focusTarget(ctx, api, 'expanded-size', () => {
        rectangle(ctx, api, 1040, 380, 660, 385, themeColors.pink, null);
        detailText(
          ctx,
          api,
          'Illustrative expansion · potential 1 GiB',
          1370,
          430,
          28,
          themeColors.yellow,
          'center',
        );
        rectangle(ctx, api, 1090, 490, 512, 100, themeColors.muted, null);
        api.rect(
          ctx,
          1090,
          490,
          64 * amount,
          100,
          themeColors.pink,
          undefined,
          0,
        );
        detailText(ctx, api, '4 MiB compressed input', 1110, 640, 29, themeColors.blue);
        detailText(
          ctx,
          api,
          amount === 1 ? 'Decoder stops at 128 MiB' : Math.floor(128 * amount) + ' MiB expanded so far',
          1110,
          699,
          27,
          themeColors.pink,
        );
        line(ctx, api, 1154, 470, 1154, 600, themeColors.yellow, 4);
        detailText(ctx, api, '128 MiB cap', 1170, 837, 28, themeColors.yellow, 'center');
      });
      if (cueStarted(ctx, api, 'parser-reject'))
        focusTarget(ctx, api, 'parser-reject', () => {
          detailText(
            ctx,
            api,
            'Stop expansion at cap · retain structured rejection',
            960,
            956,
            31,
            themeColors.pink,
            'center',
          );
        });
    } else {
      heading(ctx, api, 'Check the actual network destination, including redirects');
      focusTarget(ctx, api, 'fetch-boundary', () => {
        recordField(
          ctx,
          api,
          'Requested URL',
          'approved.example/page',
          230,
          365,
          1460,
          themeColors.blue,
        );
        recordField(
          ctx,
          api,
          'Proposed redirect destination',
          'internal service address',
          1060,
          535,
          650,
          themeColors.pink,
        );
        arrow(ctx, api, 750, 448, 980, 490, themeColors.pink);
        line(ctx, api, 1010, 450, 1010, 735, themeColors.pink, 7);
        detailText(ctx, api, 'Host + address policy', 560, 634, 31, themeColors.yellow, 'center');
        detailText(
          ctx,
          api,
          'Reject forbidden destination',
          1385,
          710,
          29,
          themeColors.pink,
          'center',
        );
      });
      if (cueStarted(ctx, api, 'separate-gates'))
        focusTarget(ctx, api, 'separate-gates', () => {
          ['Quality', 'Trust', 'Access', 'Version', 'Complete evidence'].forEach((s, i) => {
            const x = 170 + i * 323;
            rectangle(ctx, api, x, 825, 285, 90, i === 2 ? themeColors.pink : themeColors.cyan);
            detailText(
              ctx,
              api,
              s,
              x + 142,
              880,
              27,
              i === 2 ? themeColors.pink : themeColors.cyan,
              'center',
            );
          });
        });
      footer(
        ctx,
        api,
        'Isolation limits capabilities; source labels do not authorize network requests.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'parser-boundary',
  draw: drawParserBoundary,
  cues: ['parser-limits', 'expanded-size', 'parser-reject', 'fetch-boundary', 'separate-gates'],
};
