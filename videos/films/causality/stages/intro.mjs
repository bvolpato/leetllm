import { weighted } from '../arithmetic.mjs';
import { rates } from '../fixtures.mjs';
import { bars, equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    optionalFocusTarget(ctx, api, 'intro-object-distribution-intro-1', () =>
      bars(
        ctx,
        api,
        [weighted(rates.assistant, 0.1), weighted(rates.control, 0.9)],
        ['assistant', 'control'],
        250,
        850,
        [themeColors.cyan, themeColors.pink],
        phaseForBeat(0),
      ),
    );
    equation(ctx, api, '54\\%\\quad vs\\quad76\\%', 1220, 610, 54, themeColors.ink);
    F(phaseForBeat(1), () => {
      text(
        ctx,
        api,
        'assistant: 10 easy + 90 difficult',
        1460,
        460,
        28,
        themeColors.cyan,
        'center',
      );
      api.rect(ctx, 1250, 490, 44, 40, themeColors.green, undefined, 4);
      api.rect(ctx, 1294, 490, 396, 40, themeColors.red, undefined, 4);
    });
    F(phaseForBeat(2), () => {
      text(ctx, api, 'control: 90 easy + 10 difficult', 1460, 740, 28, themeColors.pink, 'center');
      api.rect(ctx, 1250, 770, 396, 40, themeColors.green, undefined, 4);
      api.rect(ctx, 1646, 770, 44, 40, themeColors.red, undefined, 4);
    });
    optionalFocusTarget(ctx, api, 'intro-object-easy-cases-green-difficult-cases-red-9', () =>
      text(
        ctx,
        api,
        'Easy cases: green. Difficult cases: red.',
        960,
        965,
        32,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-beat-1-focus-1', 'intro-beat-2-focus-1', 'intro-beat-3-focus-1'],
};
