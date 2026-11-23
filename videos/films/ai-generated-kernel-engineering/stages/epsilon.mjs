import { sampleModel } from '../construction.mjs';
import { drawCard, drawEquation, drawText } from '../defaults.mjs';
export function drawEpsilon(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('epsilon', state),
    currentBeat = modelState.step;
  {
    drawText(ctx, api, 'Small-input RMS normalization · weights = 1', 150, 285, 35);
    drawText(ctx, api, 'Target relation', 960, 350, 29, themeColors.muted, 'center');
    api.focus.target('epsilon-math-f-ax-a-2epsilon-f-x-epsilon-quad-a-0', () =>
      drawEquation(
        ctx,
        api,
        currentBeat === 2
          ? String.raw`f(ax,a^2\epsilon)=\operatorname{sign}(a)f(x,\epsilon)\quad(a\ne0)`
          : String.raw`f(ax,a^2\epsilon)=f(x,\epsilon)\quad(a>0)`,
        960,
        425,
        45,
      ),
    );
    const square = (0.001 * modelState.a) ** 2,
      total = square + modelState.eps,
      share = total > 0 ? square / total : 0;
    api.rect(ctx, 320, 470, 1280 * share, 40, themeColors.blue);
    api.rect(
      ctx,
      320 + 1280 * share,
      470,
      1280 * (total > 0 ? 1 - share : 0),
      40,
      themeColors.yellow,
    );
    drawText(ctx, api, 'x² = ' + square.toExponential(6), 500, 550, 27, themeColors.blue, 'center');
    drawText(
      ctx,
      api,
      'ε = ' + modelState.eps.toExponential(6),
      1400,
      550,
      27,
      themeColors.yellow,
      'center',
    );
    api.focus.target('epsilon-input-scale-s-a-tofixed-1', () =>
      drawCard(
        ctx,
        api,
        'Input scale ' + modelState.a.toFixed(1),
        170,
        580,
        650,
        themeColors.blue,
        105,
        38,
      ),
    );
    api.focus.target('epsilon-epsilon-s-eps-toexponential-2', () =>
      drawCard(
        ctx,
        api,
        'Epsilon ' + modelState.eps.toExponential(6),
        1100,
        580,
        650,
        themeColors.yellow,
        105,
        38,
      ),
    );
    api.focus.target('epsilon-output', () =>
      drawText(
        ctx,
        api,
        modelState.invalid
          ? 'Reject    ε = 0'
          : 'Output ' + (modelState.value === null ? 'undefined' : modelState.value.toFixed(6)),
        500,
        825,
        49,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('epsilon-original-s-reference-tofixed-6', () =>
      drawText(
        ctx,
        api,
        'Original ' + modelState.reference.toFixed(6),
        1410,
        825,
        49,
        themeColors.green,
        'center',
      ),
    );
    drawText(
      ctx,
      api,
      currentBeat === 2
        ? modelState.invalid
          ? 'Zero scale leaves the declared domain'
          : modelState.a < 0
            ? 'The denominator stays positive. The numerator changes sign.'
            : 'Both terms under the square root scale with the input squared.'
        : currentBeat === 0
          ? 'Current state: fixed epsilon'
          : modelState.epsilonProgress < 1
            ? 'Current state: scaling epsilon toward the squared-scale target'
            : 'Target reached: epsilon and squared input share the same scale',
      960,
      975,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'epsilon',
  draw: drawEpsilon,
  cues: [
    'epsilon-beat-1-focus-1',
    'epsilon-beat-1-focus-2',
    'epsilon-beat-2-focus-1',
    'epsilon-restored-relation',
    'epsilon-beat-2-focus-2',
    'kg-epsilon-base',
    'kg-epsilon-negative',
    'kg-epsilon-zero',
  ],
};
