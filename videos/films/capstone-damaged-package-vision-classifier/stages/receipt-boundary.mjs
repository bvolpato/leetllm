import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText } from '../defaults.mjs';
export function drawReceiptBoundary(ctx, scene, state, api) {
  const frameState = visionFrame('receipt-boundary', state);
  return api.focus.target('dv-receipt-boundary-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 0) {
        [
          'Identity + split',
          'Complete routes',
          'Quality abstention',
          'Exact replay',
          'Eligible outcomes',
          'Defined metrics',
        ].forEach((v, i) =>
          visionCard(
            ctx,
            api,
            v,
            180 + (i % 3) * 550,
            350 + Math.floor(i / 3) * 165,
            500,
            105,
            themeColors.cyan,
          ),
        );
        visionCard(
          ctx,
          api,
          resultComplete('synthetic-hold', 0)
            ? 'Checks pass · HOLD SYNTHETIC FIXTURE'
            : 'Local contract checks',
          400,
          800,
          1120,
          110,
          resultComplete('synthetic-hold', 0) ? themeColors.yellow : themeColors.muted,
        );
        visionNote(
          ctx,
          api,
          'Photographs, learned weights, and real model performance remain absent.',
        );
      } else {
        const names = [
          'Locate retained artifacts',
          'Load exact bundle',
          'Demonstrate restored behavior',
        ];
        names.forEach((v, i) => {
          const a = visionCard(
            ctx,
            api,
            v,
            150 + i * 550,
            480,
            500,
            135,
            resultComplete('restoration-required', 1) ? themeColors.cyan : themeColors.muted,
          );
          if (i < 2)
            api.arrow(ctx, a.x + a.width + 8, 548, a.x + 550 - 8, 548, themeColors.muted, 3);
        });
        visionText(
          ctx,
          api,
          resultComplete('pointer-limit', 1)
            ? 'A nonblank previous-bundle name is only a pointer'
            : 'Previous bundle: synthetic-policy-v0',
          960,
          340,
          35,
          themeColors.yellow,
          'center',
        );
        visionText(
          ctx,
          api,
          currentBeat === 2
            ? 'Shadow comparison needs permission, representative cases and predeclared acceptance criteria'
            : 'Code · transforms · weights · policy',
          960,
          840,
          31,
          themeColors.ink,
          'center',
        );
        visionNote(
          ctx,
          api,
          'A tested recovery path requires an actual runnable package. The proposed layout has not created one.',
        );
      }
    }
  });
}
export default {
  id: 'receipt-boundary',
  draw: drawReceiptBoundary,
  cues: [
    'dv-receipt-boundary-0',
    'dv-receipt-boundary-operation-0',
    'dv-synthetic-hold',
    'dv-receipt-boundary-1',
    'dv-receipt-boundary-operation-1',
    'dv-pointer-limit',
    'dv-restoration-required',
    'dv-receipt-boundary-2',
    'dv-receipt-boundary-operation-2',
  ],
};
