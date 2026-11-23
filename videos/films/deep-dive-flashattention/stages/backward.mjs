import { gradientFixture } from '../arithmetic.mjs';
import { complete, sampleModel } from '../construction.mjs';
import { drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawBackward(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('backward', state),
      currentBeat = modelState.b;
    {
      api.focus.target('backward-math-p-j-exp-s-j-mathrm-lse-quadmathrm-lse-approx', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`P_j=\exp(s_j-\mathrm{LSE}),\quad\mathrm{LSE}\approx${modelState.lse.toFixed(4)}`,
          960,
          320,
          48,
        ),
      );
      api.focus.target('backward-s-probabilities-map-p-i-i-s-count-p-tofixed-4-rebuild', () =>
        teaching.grid({
          x: 180,
          y: 465,
          width: 1520,
          height: 140,
          rows: 1,
          columns: 4,
          labels: [
            modelState.probabilities.map((p, i) =>
              currentBeat === 2 && complete(state, 'fa-backward-deposit', modelState.q)
                ? 'discarded'
                : i < modelState.count
                  ? p.toFixed(4)
                  : 'rebuild',
            ),
          ],
          fontSize: 34,
          textColor: themeColors.ink,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
        }),
      );
      drawOriginalText(
        ctx,
        api,
        `${currentBeat === 2 ? 'Prior reconstructed mass' : 'Reconstructed mass'} ≈ ${modelState.mass.toFixed(4)}`,
        960,
        745,
        38,
        themeColors.yellow,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        `${currentBeat === 2 ? 'Retained forward O' : 'Value contribution'} ≈ [${modelState.partial.map((v) => v.toFixed(3)).join(', ')}]`,
        960,
        845,
        36,
        themeColors.green,
        'center',
      );
      if (currentBeat === 2) {
        const deposited = complete(state, 'fa-backward-deposit', modelState.q),
          g = gradientFixture();
        drawOriginalText(
          ctx,
          api,
          deposited
            ? 'dV₀ [' + g.p.map((v) => v.toFixed(3)).join(', ') + '] · dV₁ = −dV₀'
            : 'Deposit each temporary P into dV = P × [1,−1]',
          960,
          945,
          29,
          deposited ? themeColors.green : themeColors.yellow,
          'center',
        );
      } else
        drawOriginalText(
          ctx,
          api,
          'Saved Q, K, V, O and row LSE · temporary probabilities',
          960,
          985,
          28,
          themeColors.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'backward',
  draw: drawBackward,
  cues: [
    'backward-beat-1-focus-1',
    'backward-beat-1-focus-2',
    'fa-backward-0',
    'backward-beat-2-focus-1',
    'backward-beat-2-focus-2',
    'fa-backward-1',
    'fa-backward-first',
    'fa-backward-second',
    'fa-backward-output',
    'backward-beat-3-focus-1',
    'fa-backward-2',
    'fa-backward-deposit',
  ],
};
