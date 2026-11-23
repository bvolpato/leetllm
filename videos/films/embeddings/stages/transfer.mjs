import { FINANCE, RIVER, V } from '../fixtures.mjs';
import { substitutionState } from '../construction.mjs';
import { equation, focusTarget, originalAxes, text, vector } from '../defaults.mjs';
import { lerpArray, smoothstep } from 'vizmatic';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const a = originalAxes(ctx, api);
    vector(ctx, api, a, V.bank, '#8d9cb966');
    vector(ctx, api, a, RIVER, themeColors.cyan);
    vector(ctx, api, a, FINANCE, themeColors.green);
    if (currentBeat === 0) {
      focusTarget(ctx, api, 'transfer-object-river-bank-occurrence-33', () =>
        text(ctx, api, 'river-bank occurrence', 1460, 400, 34, themeColors.cyan, 'center'),
      );
      text(ctx, api, 'financial occurrence', 1460, 570, 34, themeColors.green, 'center');
      text(ctx, api, 'Same bank lookup', 1460, 740, 34, themeColors.blue, 'center');
    } else {
      const current = substitutionState(currentBeat, progress);
      if (current.amount > 0) vector(ctx, api, a, current.current, themeColors.yellow);
      if (current.showNormalization) {
        const amount = currentBeat > 1 ? 1 : smoothstep((progress * 15.792 - 9.375) / 0.625),
          unit = lerpArray(current.current, current.normalized, amount),
          cx = 330,
          cy = 650,
          r = 130;
        api.circle(ctx, cx, cy, r, null, themeColors.muted, 2);
        api.arrow(ctx, cx, cy, cx + unit[0] * r, cy - unit[1] * r, themeColors.yellow, 5);
        text(
          ctx,
          api,
          amount === 1 ? 'Unit length 1' : 'Normalize the same direction',
          330,
          450,
          25,
          themeColors.yellow,
          'center',
        );
      }
      text(
        ctx,
        api,
        'Same rule · replace only the clue',
        1450,
        290,
        30,
        themeColors.yellow,
        'center',
      );
      focusTarget(
        ctx,
        api,
        'transfer-equation-string-raw-0-5-mathrm-bank-0-4-mathrm-clue-0-1-mat-36',
        () =>
          equation(
            ctx,
            api,
            String.raw`0.5\,\mathrm{bank}+0.4\,\mathrm{clue}+0.1\,\mathrm{water}`,
            1450,
            365,
            29,
            themeColors.yellow,
            'center',
          ),
      );
      text(
        ctx,
        api,
        current.amount === 0
          ? 'Predict: river → money'
          : current.amount === 1
            ? 'Clue: money'
            : 'Clue: river → money',
        1450,
        460,
        30,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        `Current state [${current.current.map((value) => value.toFixed(3)).join(', ')}]`,
        1450,
        540,
        29,
        themeColors.ink,
        'center',
      );
      text(ctx, api, 'Bank lookup stays [0.500, 0.500]', 1450, 620, 26, themeColors.blue, 'center');
      if (current.showNormalization && (currentBeat > 1 || progress * 15.792 >= 10))
        text(
          ctx,
          api,
          `Unit state [${current.normalized.map((value) => value.toFixed(3)).join(', ')}]`,
          1450,
          710,
          27,
          themeColors.yellow,
          'center',
        );
      if (current.showPooling) {
        text(
          ctx,
          api,
          'Mean of bank, current state, water',
          1450,
          790,
          25,
          themeColors.green,
          'center',
        );
        text(
          ctx,
          api,
          `[${current.pooled.map((value) => value.toFixed(3)).join(', ')}] · 3 valid states`,
          1450,
          845,
          27,
          themeColors.green,
          'center',
        );
      }
      text(
        ctx,
        api,
        'Cyan/green: original occurrence references',
        960,
        985,
        27,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['transfer-beat-1-focus-1', 'transfer-beat-2-focus-1', 'transfer-beat-3-focus-1'],
};
