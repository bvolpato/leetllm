import { comparisonRow } from '../arithmetic.mjs';
import { drawCells, drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawLossNumerics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-loss-numerics-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('loss-numerics-mechanism', () => {
    if (currentBeat === 0) {
      const rows = [
        ['cosines', ['0.90', '0.20'], true],
        ['÷ .05', ['18', '4'], resultComplete('logits')],
        ['− max', ['0', '−14'], resultComplete('center')],
        ['exp', ['1', '8.315e−7'], resultComplete('mass')],
      ];
      rows.forEach(([label, v, show], i) => {
        const y = 340 + i * 145;
        drawText(ctx, api, label, 360, y + 45, 31, themeColors.muted);
        drawCells(
          ctx,
          api,
          v,
          650,
          y,
          330,
          75,
          i === 3 ? themeColors.cyan : themeColors.blue,
          show,
        );
      });
      if (resultComplete('prob'))
        drawText(ctx, api, 'p+ = 0.99999917', 1460, 535, 32, themeColors.green);
      if (resultComplete('loss'))
        drawText(ctx, api, 'loss = 8.315e−7', 1460, 685, 32, themeColors.green);
      if (resultComplete('swap'))
        drawText(ctx, api, 'Swap labels/scores: loss ≈ 14', 960, 960, 35, themeColors.pink);
      drawNote(ctx, api, 'Centered exponential masses preserve the exact row probabilities');
    } else if (currentBeat === 1) {
      drawText(
        ctx,
        api,
        'Finite logits first · stable positive-gap arithmetic',
        960,
        290,
        35,
        themeColors.yellow,
      );
      drawPill(ctx, api, 'log Σ exp(logit − max)', 960, 455, 1300, themeColors.blue);
      if (B('gap'))
        drawPill(ctx, api, '+ (max − positive logit)', 960, 610, 1300, themeColors.cyan);
      if (resultComplete('tied')) {
        drawCells(ctx, api, ['1e308', '1e308'], 300, 780, 330, 75, themeColors.blue);
        drawPill(ctx, api, 'loss = log 2', 1400, 815, 520, themeColors.green);
      }
      if (resultComplete('tiny'))
        drawText(
          ctx,
          api,
          'Scale by max |coordinate| before norm · reject zero',
          960,
          935,
          31,
          themeColors.yellow,
        );
      drawNote(
        ctx,
        api,
        'A stable reducer cannot rescue overflow that already occurred during division',
      );
    } else {
      const r = comparisonRow([0.9, 0.2], 0.05);
      drawText(ctx, api, 'One query row · one declared positive', 960, 320, 36, themeColors.blue);
      drawCells(ctx, api, ['p+ − 1', 'p− − 0'], 330, 445, 630, 90, themeColors.cyan);
      if (resultComplete('gradient')) {
        drawCells(ctx, api, r.gradients, 330, 650, 630, 100, themeColors.yellow);
        drawText(
          ctx,
          api,
          '÷ τ before shared encoder backpropagation',
          960,
          875,
          35,
          themeColors.yellow,
        );
      }
      drawNote(
        ctx,
        api,
        'Reverse-direction CE requires a valid passage-to-query labeling contract',
      );
    }
  });
}
export default {
  id: 'loss-numerics',
  draw: drawLossNumerics,
  cues: [
    'cl-loss-numerics-scores',
    'cl-loss-numerics-logits',
    'cl-loss-numerics-center',
    'cl-loss-numerics-mass',
    'cl-loss-numerics-prob',
    'cl-loss-numerics-loss',
    'cl-loss-numerics-swap',
    'cl-loss-numerics-finite',
    'cl-loss-numerics-gap',
    'cl-loss-numerics-tied',
    'cl-loss-numerics-tiny',
    'cl-loss-numerics-gradient',
  ],
};
