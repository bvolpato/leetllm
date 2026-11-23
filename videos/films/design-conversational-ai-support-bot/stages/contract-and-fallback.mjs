import {
  drawSupportArrow,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportRow,
  drawSupportText,
  supportCueVisible,
  withSupportFocus,
} from '../defaults.mjs';
export function drawContractAndFallback(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      drawSupportHeading(ctx, api, 'Compile one current contract before retrieval and drafting');
      const active = supportCueVisible(ctx, api, 'compile-contract');
      const fields = [
        ['Ticket / customer', '48291 / Alex'],
        ['Gateway policy', 'gateway-policy-v1'],
        ['Action policy', 'US-v3 · reviewed content'],
        ['Data class', 'Private billing'],
        ['Required output', 'Cited / review / typed'],
        ['Generation ceiling', '$0.005 · declared stub'],
      ];
      fields.forEach(([k, v], i) => {
        const y = 360 + i * 88;
        withSupportFocus(ctx, api, 'compile-contract', () => {
          drawSupportRectangle(ctx, api, 180, y, 530, 70, themeColors.muted);
          drawSupportText(ctx, api, k, 210, y + 46, 28, themeColors.muted);
          drawSupportRectangle(
            ctx,
            api,
            740,
            y,
            1000,
            70,
            active ? themeColors.blue : themeColors.muted,
          );
          if (active) drawSupportText(ctx, api, v, 770, y + 46, 29, themeColors.blue);
        });
      });
      withSupportFocus(ctx, api, 'version-content', () => {
        if (supportCueVisible(ctx, api, 'version-content')) {
          drawSupportArrow(ctx, api, 1260, 580, 1260, 650, themeColors.yellow);
          drawSupportText(
            ctx,
            api,
            'ID + exact content + executable rule',
            960,
            940,
            29,
            themeColors.yellow,
            'center',
          );
        }
      });
      drawSupportFooter(
        ctx,
        api,
        'Hash equality identifies bytes; publication and review establish appropriateness.',
      );
    } else if (currentBeat === 1) {
      drawSupportHeading(ctx, api, 'Fallback stays inside the same private contract');
      const ceiling = supportCueVisible(ctx, api, 'stub-ceiling'),
        kept = supportCueVisible(ctx, api, 'fallback-contract');
      drawSupportText(
        ctx,
        api,
        'Reference routing stub',
        470,
        365,
        29,
        themeColors.muted,
        'center',
      );
      drawSupportRectangle(ctx, api, 160, 410, 620, 320, themeColors.blue);
      drawSupportText(
        ctx,
        api,
        'No model call in this lab',
        470,
        485,
        31,
        themeColors.blue,
        'center',
      );
      withSupportFocus(ctx, api, 'stub-ceiling', () => {
        if (ceiling) {
          drawSupportText(
            ctx,
            api,
            'Declared ceiling: $0.005',
            470,
            565,
            36,
            themeColors.yellow,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            'Lane metadata ≠ a paid receipt',
            470,
            660,
            27,
            themeColors.muted,
            'center',
          );
        }
      });
      const fields = [
        'PRIVATE data processor',
        'Published citation',
        'Review disposition',
        'Shared attempts / spend / deadline',
      ];
      fields.forEach((s, i) =>
        withSupportFocus(ctx, api, 'fallback-contract', () =>
          drawSupportRow(
            ctx,
            api,
            s,
            1090,
            415 + i * 100,
            680,
            kept ? themeColors.green : themeColors.muted,
          ),
        ),
      );
      drawSupportArrow(ctx, api, 805, 570, 1060, 570, kept ? themeColors.green : themeColors.muted);
      drawSupportText(
        ctx,
        api,
        kept ? 'Retained restrictions' : 'Fallback must satisfy the contract',
        1430,
        895,
        30,
        kept ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawSupportFooter(
        ctx,
        api,
        'A real adapter verifies eligibility, output, actual usage and bounded recovery.',
      );
    } else {
      drawSupportHeading(
        ctx,
        api,
        'A public cache and a detector do not authorize a billing write',
      );
      const bypass = supportCueVisible(ctx, api, 'private-cache'),
        changed = supportCueVisible(ctx, api, 'cache-version'),
        limit = supportCueVisible(ctx, api, 'screen-authority');
      withSupportFocus(ctx, api, 'private-cache', () => {
        drawSupportRow(
          ctx,
          api,
          'Private credit request · Alex / A10234',
          140,
          370,
          680,
          themeColors.blue,
        );
        drawSupportRow(
          ctx,
          api,
          bypass ? 'BYPASS PUBLIC ANSWER CACHE' : 'Private state admission',
          140,
          475,
          680,
          bypass ? themeColors.pink : themeColors.muted,
        );
      });
      drawSupportText(
        ctx,
        api,
        'Public policy cache key',
        1350,
        365,
        30,
        themeColors.cyan,
        'center',
      );
      withSupportFocus(ctx, api, 'cache-version', () => {
        drawSupportRectangle(
          ctx,
          api,
          970,
          405,
          800,
          200,
          changed ? themeColors.pink : themeColors.cyan,
        );
        drawSupportText(
          ctx,
          api,
          'Region US · access PUBLIC',
          1370,
          465,
          31,
          themeColors.cyan,
          'center',
        );
        drawSupportText(
          ctx,
          api,
          changed ? 'US-v4 requested ≠ cached US-v3' : 'Effective policy US-v3',
          1370,
          550,
          29,
          changed ? themeColors.pink : themeColors.cyan,
          'center',
        );
        if (changed)
          drawSupportText(
            ctx,
            api,
            'Invalidate old entry',
            1370,
            675,
            32,
            themeColors.pink,
            'center',
          );
      });
      ['Detector accepts', 'Citation ID exists', 'JSON shape valid'].forEach((s, i) =>
        drawSupportRow(ctx, api, s, 180 + i * 550, 790, 480, themeColors.muted),
      );
      withSupportFocus(ctx, api, 'screen-authority', () => {
        if (limit)
          drawSupportText(
            ctx,
            api,
            'Still check permissions, evidence support and business rules',
            960,
            950,
            34,
            themeColors.yellow,
            'center',
          );
      });
      drawSupportFooter(
        ctx,
        api,
        'Minimize private input and protect the reversible redaction map.',
      );
    }
  }
}
export default {
  id: 'contract-and-fallback',
  draw: drawContractAndFallback,
  cues: [
    'compile-contract',
    'version-content',
    'stub-ceiling',
    'fallback-contract',
    'private-cache',
    'cache-version',
    'screen-authority',
  ],
};
