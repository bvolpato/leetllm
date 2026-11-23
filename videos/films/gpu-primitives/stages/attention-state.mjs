import { ATTENTION, FIRST } from '../fixtures.mjs';
import {
  drawExtendedFooter,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawAttentionState(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = api.components.fade;
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress, a, z);
  };
  const started = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat < 2) {
      drawExtendedTitle(ctx, api, 'Same four logits · values [1,0], [1,0], [0,1], [0,1]');
      const scale = currentBeat === 0 ? q('attention-state-step-1', 0.4, 0.85) : 1,
        old = FIRST.denominator * (1 + (Math.exp(-2) - 1) * scale),
        fresh = currentBeat === 1 && started('attention-new-mass', 0.3) ? ATTENTION.fresh : 0;
      drawExtendedTarget(ctx, api, 'attention-rescale', () => {
        drawExtendedText(
          ctx,
          api,
          'Old d and old Oₓ use the same scale',
          960,
          365,
          32,
          themeColors.yellow,
        );
        [
          ['d', old, fresh],
          ['Oₓ', old, 0],
          ['Oᵧ', 0, fresh],
        ].forEach(([name, a, z], i) => {
          const y = 450 + i * 145;
          drawExtendedText(ctx, api, name, 310, y + 45, 39, themeColors.ink);
          api.rect(ctx, 450, y, 1000, 75, themeColors.panel, themeColors.muted, 3);
          if (a) api.rect(ctx, 450, y, (a / 1.5) * 1000, 75, themeColors.blue, undefined, 3);
          if (z)
            api.rect(
              ctx,
              450 + (a / 1.5) * 1000,
              y,
              (z / 1.5) * 1000,
              75,
              themeColors.cyan,
              undefined,
              3,
            );
          drawExtendedText(ctx, api, (a + z).toFixed(6), 1630, y + 45, 32, themeColors.yellow);
        });
      });
      drawExtendedTarget(ctx, api, 'attention-output', () => {
        if (currentBeat === 1 && started('attention-normalize', 0.5))
          drawExtendedText(
            ctx,
            api,
            'O / d = [' + ATTENTION.output.map((v) => v.toFixed(6)).join(', ') + ']',
            960,
            960,
            39,
            themeColors.green,
          );
      });
    } else {
      drawExtendedTitle(ctx, api, 'Tiled attention retains linear state at fixed head dimension');
      drawExtendedTarget(ctx, api, 'attention-storage', () => {
        const grow = q('attention-linear', 0.1, 0.5);
        for (let i = 0; i < 6; i++)
          for (let j = 0; j < 6; j++)
            api.rect(ctx, 230 + j * 65, 400 + i * 65, 52, 52, themeColors.muted);
        drawExtendedText(ctx, api, 'Scores: N × N arithmetic', 430, 900, 29, themeColors.muted);
        for (let i = 0; i < 6; i++) {
          api.rect(ctx, 1060, 400 + i * 65, 90, 52, themeColors.blue);
          api.rect(ctx, 1210, 400 + i * 65, 260 * grow, 52, themeColors.cyan);
        }
        drawExtendedText(
          ctx,
          api,
          'Stats + output: N × fixed width',
          1300,
          900,
          29,
          themeColors.cyan,
        );
        if (started('attention-state-step-3', 0.65))
          drawExtendedText(
            ctx,
            api,
            'Quadratic arithmetic remains · quadratic stored score matrix avoided',
            960,
            1000,
            31,
            themeColors.yellow,
          );
      });
    }
    drawExtendedFooter(
      ctx,
      api,
      'A repaired denominator with an unscaled old weighted accumulator still produces the wrong output.',
    );
    return;
  }
  return;
}
export default {
  id: 'attention-state',
  draw: drawAttentionState,
  cues: [
    'attention-state-step-1',
    'attention-state-step-2',
    'attention-new-mass',
    'attention-normalize',
    'attention-state-step-3',
    'attention-linear',
  ],
};
