import { constructedFrame } from '../construction.mjs';
import { fitted, likelihoodTraceState } from '../model.mjs';
import { axes, equation, text, visualFocus } from '../defaults.mjs';
export function drawLikelihood(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  {
    const hist = fitted.history;
    const plot = axes(
      ctx,
      api,
      245,
      370,
      990,
      410,
      [0, hist.length - 1],
      [-32, -16],
      'EM iteration',
      'log likelihood',
      [0, 2, 4, 6, 8],
      [-30, -25, -20, -15],
    );
    const progress =
      currentBeat === 0
        ? api.focus
          ? api.focus.progress('likelihood-first-update', api.phase(progress2, 0.66, 0.96))
          : api.phase(progress2, 0.66, 0.96)
        : currentBeat === 1
          ? 1
          : api.focus
            ? api.focus.progress('likelihood-eight-updates', api.phase(progress2, 0.02, 0.24))
            : api.phase(progress2, 0.02, 0.24);
    const current = likelihoodTraceState(currentBeat, progress),
      stepProgress = current.index,
      trace = current.trace;
    visualFocus(ctx, api, 'likelihood-simulation-51', () => {
      if (trace.length > 1)
        api.teaching.curve({
          plot,
          points: trace,
          color: themeColors.green,
          width: 6,
          progress: 1,
        });
      trace.forEach((point) => {
        const q = plot.point(point.x, point.y);
        visualFocus(ctx, api, 'likelihood-object-q-x-q-y-8-c-yellow-52', () =>
          api.circle(ctx, q.x, q.y, 8, themeColors.yellow),
        );
      });
    });
    const firstUpdateComplete = currentBeat === 0 && stepProgress >= 0.999;
    const fitComplete = currentBeat === 2 && stepProgress >= 8;
    const endpointKnown = fitComplete && constructedFrame(state).completed('likelihood-endpoint', 2);
    if (currentBeat === 0)
      equation(
        ctx,
        api,
        firstUpdateComplete
          ? String.raw`\ell_0=${hist[0].toFixed(3)}\quad\ell_1=${hist[1].toFixed(3)}`
          : String.raw`\ell_0=${hist[0].toFixed(3)}`,
        1470,
        545,
        36,
        themeColors.yellow,
        'center',
      );
    else if (currentBeat === 1)
      equation(
        ctx,
        api,
        String.raw`\ell(\theta^{t+1})\geq\ell(\theta^t)`,
        1460,
        545,
        43,
        themeColors.yellow,
        'center',
      );
    else if (endpointKnown)
      equation(
        ctx,
        api,
        String.raw`\ell^{(8)}=${hist[8].toFixed(3)}`,
        1460,
        545,
        43,
        themeColors.yellow,
        'center',
      );
    else
      equation(
        ctx,
        api,
        String.raw`\ell(\theta^{t+1})\geq\ell(\theta^t)`,
        1460,
        545,
        43,
        themeColors.yellow,
        'center',
      );
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'first E-step + M-step'
        : currentBeat === 1
          ? 'exact E-step + maximizing M-step'
          : fitComplete
            ? 'eight updates · separated initialization'
            : 'One dot per update',
      1460,
      645,
      27,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      currentBeat === 0
        ? firstUpdateComplete
          ? 'One exact update raises the observed-data likelihood.'
          : 'Starting fit before the first update'
        : currentBeat === 1
          ? 'Each exact update preserves or raises likelihood.'
          : fitComplete
            ? 'Final means: 30 and 90 ms'
            : 'Observed-data likelihood through successive fits',
      1460,
      740,
      27,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'likelihood',
  draw: drawLikelihood,
  cues: [
    'likelihood-beat-1-focus-1',
    'likelihood-beat-1-focus-2',
    'likelihood-first-update',
    'likelihood-first-update-value',
    'likelihood-beat-2-focus-1',
    'likelihood-beat-2-focus-2',
    'likelihood-eight-updates',
    'likelihood-endpoint',
  ],
};
