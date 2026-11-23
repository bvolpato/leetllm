import { stablePolicy, widerBeamTrace } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText } from '../defaults.mjs';
export function drawWiderCounterexample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('wider-counterexample', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'wider-counterexample'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const depth = Math.min(2, beat),
      traces = [widerBeamTrace(2), widerBeamTrace(3)];
    traces.forEach((run, column) => {
      const x = 150 + column * 900,
        active = run.history[depth].active;
      drawPolicyText(
        ctx,
        api,
        `Width ${run.width} · after step ${depth + 1}`,
        x + 360,
        315,
        32,
        colors[column],
        'center',
      );
      target(() =>
        active.forEach((row, i) => {
          const y = 420 + i * 130,
            name = row.tokens.join(' → ');
          drawPolicyCard(
            ctx,
            api,
            'wider-counterexample',
            name,
            x,
            y,
            480,
            85,
            row.tokens.join('') === 'A2' ? themeColors.yellow : colors[column],
            27,
          );
          drawPolicyText(
            ctx,
            api,
            row.probability.toFixed(3),
            x + 650,
            y + 54,
            40,
            row.tokens.join('') === 'A2' ? themeColors.yellow : colors[column],
            'center',
          );
        }),
      );
      if (depth === 2 && progress === 1)
        drawPolicyText(
          ctx,
          api,
          `Final winner ${run.winner.probability.toFixed(2)}`,
          x + 360,
          865,
          36,
          themeColors.green,
          'center',
        );
    });
    if (depth === 1)
      drawPolicyText(
        ctx,
        api,
        'Width 3 admits both C branches and displaces A2 before its certain last step.',
        960,
        925,
        28,
        themeColors.yellow,
        'center',
      );
    drawCaption(
      ctx,
      api,
      'All rows come from the same fixed tree. Retained frontiers need not be nested.',
    );
  }
  return;
}
export default {
  id: 'wider-counterexample',
  draw: drawWiderCounterexample,
  cues: [
    'wider-counterexample-build-0',
    'wider-counterexample-build-1',
    'wider-counterexample-build-2',
  ],
};
