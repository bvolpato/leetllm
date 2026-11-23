import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyEquation, drawPolicyText } from '../defaults.mjs';
export function drawLocalConditioning(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('local-conditioning', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'local-conditioning'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'local-conditioning',
      beat = state.beat ?? 0;
    {
      const local = [0.4, 0.6],
        masses = [0.4 * 0.1, 0.6 * 0.9],
        valid = masses.reduce((a, b) => a + b, 0),
        conditional = masses.map((v) => v / valid);
      drawPolicyText(
        ctx,
        api,
        'Only A→x and B→y are valid complete strings',
        960,
        300,
        34,
        C.ink,
        'center',
      );
      ['A → x', 'B → y'].forEach((label, i) => {
        const y = 415 + i * 210;
        drawPolicyText(ctx, api, label, 180, y + 38, 36, colors[i]);
        drawPolicyText(
          ctx,
          api,
          `${local[i].toFixed(1)} × ${[0.1, 0.9][i].toFixed(1)}`,
          620,
          y + 38,
          35,
          colors[i],
          'center',
        );
        if (beat > 0)
          drawPolicyText(
            ctx,
            api,
            `joint ${masses[i].toFixed(2)}`,
            1030,
            y + 38,
            34,
            colors[i],
            'center',
          );
        target(() =>
          drawPolicyText(
            ctx,
            api,
            beat === 0
              ? `first token ${local[i].toFixed(3)}`
              : beat === 1
                ? `local ${local[i].toFixed(3)}`
                : progress === 1
                  ? `conditioned ${conditional[i].toFixed(3)}`
                  : 'conditioned ?',
            1560,
            y + 38,
            33,
            beat < 2 || progress === 1 ? colors[i] : C.muted,
            'center',
          ),
        );
      });
      if (beat > 0)
        drawPolicyEquation(
          ctx,
          api,
          String.raw`P(\mathrm{valid})=.04+.54=${valid.toFixed(2)}`,
          960,
          850,
          42,
          C.yellow,
          'center',
        );
      drawCaption(
        ctx,
        api,
        'Local masking renormalizes each next-token row. Whole-string conditioning includes future valid mass.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'local-conditioning',
  draw: drawLocalConditioning,
  cues: ['local-conditioning-build-0', 'local-conditioning-build-1', 'local-conditioning-build-2'],
};
