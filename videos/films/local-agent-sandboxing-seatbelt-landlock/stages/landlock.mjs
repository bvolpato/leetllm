import { sampleModel } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawLandlock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('landlock', state),
    { b: currentBeat, q } = modelState;
  {
    const stages = [
      'Probe ABI',
      'Build ruleset',
      'Narrow grants',
      'No new privileges',
      'Restrict self',
    ];
    stages.forEach((name, i) => {
      const y = 320 + i * 125;
      api.focus.target('landlock-stages', () =>
        card(
          ctx,
          api,
          name,
          190,
          y,
          730,
          !modelState.requiredAvailable
            ? i === 0
              ? themeColors.pink
              : themeColors.muted
            : i <= (currentBeat ? 3 + Math.floor(q * 2) : Math.min(2, Math.floor(q * 3)))
              ? themeColors.cyan
              : themeColors.muted,
          90,
          34,
        ),
      );
    });
    api.focus.target('kernel-features', () =>
      card(
        ctx,
        api,
        modelState.requiredAvailable
          ? 'Required coverage available'
          : 'Alternate host: feature unavailable',
        1100,
        370,
        640,
        modelState.requiredAvailable ? themeColors.green : themeColors.pink,
        110,
        33,
      ),
    );
    text(
      ctx,
      api,
      modelState.requiredAvailable ? 'Launch after enforcement' : 'LAUNCH BLOCKED',
      1420,
      650,
      38,
      modelState.requiredAvailable ? themeColors.green : themeColors.pink,
      'center',
    );
    api.focus.target('restriction-relation', () =>
      equation(ctx, api, 'R_{child}\\subseteq R_{parent}', 1420, 850, 48),
    );
  }
}
export default {
  id: 'landlock',
  draw: drawLandlock,
  cues: ['landlock-b1-1', 'landlock-b1-2', 'landlock-b2-1', 'landlock-b2-2'],
};
