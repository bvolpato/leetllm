import { sigmoid } from '../arithmetic.mjs';
import { fittedWeights, penalizedWeights } from '../fixtures.mjs';
import { gradientTrajectory } from '../model.mjs';
import { axes, cueAmount, labelPoint, rectangle, segment, text } from '../defaults.mjs';
import { dotProduct } from 'vizmatic';
export function drawImplementationParity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-implementation-parity-step-' + currentBeat, 0);
  api.focus.target('lr-implementation-parity-mechanism', () => {
    if (currentBeat === 0) {
      const ours = fittedWeights,
        library = [-4.914, 3.414, -0.964],
        amount = cueAmount(ctx, api, 'lr-library-coefficients');
      text(ctx, api, 'Same eight rows and one intercept column', 960, 285, 35, themeColors.muted);
      ['intercept', 'ambiguity', 'support'].forEach((name, i) => {
        const y = 390 + i * 165;
        text(ctx, api, name, 400, y, 32, themeColors.muted);
        text(ctx, api, ours[i].toFixed(3), 850, y, 42, themeColors.cyan);
        if (amount > (i + 0.2) / 3)
          text(ctx, api, library[i].toFixed(3), 1450, y, 42, themeColors.yellow);
        segment(ctx, api, 1030, y - 15, 1270, y - 15, themeColors.muted, 3);
      });
      text(ctx, api, '3000 full-batch updates', 850, 930, 30, themeColors.cyan);
      text(ctx, api, 'scikit-learn 1.9.1 · L-BFGS', 1450, 930, 30, themeColors.yellow);
      text(
        ctx,
        api,
        'NumPy 2.5.3   ·   No extra intercept   ·   No weight penalty',
        960,
        1005,
        31,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const amount = cueAmount(ctx, api, 'lr-parity-penalty'),
        from = sigmoid(dotProduct(fittedWeights, [1, 2, 3])),
        to = sigmoid(dotProduct(penalizedWeights, [1, 2, 3]));
      text(ctx, api, 'Hold rows, features and labels fixed', 960, 270, 34, themeColors.muted);
      text(ctx, api, 'Unpenalized fit', 850, 350, 31, themeColors.cyan);
      text(ctx, api, 'C = 1 · L2 fit', 1450, 350, 31, themeColors.yellow);
      ['intercept', 'ambiguity', 'support'].forEach((name, i) => {
        const y = 435 + i * 115;
        text(ctx, api, name, 400, y, 31, themeColors.muted);
        text(ctx, api, fittedWeights[i].toFixed(3), 850, y, 40, themeColors.cyan);
        if (amount > (i + 0.2) / 3) {
          segment(ctx, api, 1040, y - 14, 1260, y - 14, themeColors.yellow, 3);
          text(ctx, api, penalizedWeights[i].toFixed(3), 1450, y, 40, themeColors.yellow);
        } else text(ctx, api, '?', 1450, y, 40, themeColors.muted);
      });
      text(ctx, api, 'R3 · same ambiguity 2 / support 3', 440, 820, 29, themeColors.muted);
      rectangle(ctx, api, 750, 760, 380, 45, themeColors.panel, themeColors.muted);
      rectangle(ctx, api, 750, 760, 380 * from, 45, themeColors.cyan);
      text(ctx, api, from.toFixed(3), 1220, 795, 30, themeColors.cyan);
      const shift = cueAmount(ctx, api, 'r3-score');
      if (shift > 0) {
        rectangle(ctx, api, 750, 870, 380, 45, themeColors.panel, themeColors.muted);
        rectangle(ctx, api, 750, 870, 380 * (from + (to - from) * shift), 45, themeColors.yellow);
      }
      segment(ctx, api, 940, 751, 940, 923, themeColors.ink, 3);
      text(ctx, api, 'Cut 0.50', 940, 737, 27, themeColors.ink);
      if (shift === 1) text(ctx, api, to.toFixed(3), 1220, 905, 30, themeColors.yellow);
      text(
        ctx,
        api,
        cueAmount(ctx, api, 'r3-review') === 1
          ? 'R3 now goes to review'
          : 'Same request · same review cut',
        960,
        1000,
        31,
        themeColors.muted,
      );
    } else {
      const a = gradientTrajectory(0.2, 10),
        z = gradientTrajectory(2, 10),
        q = axes(
          ctx,
          api,
          230,
          365,
          1050,
          450,
          [0, 10],
          [0, Math.ceil(Math.max(...z.map((r) => r.loss)) * 1.05)],
          'completed update',
          'mean loss',
        );
      const firstStep = cueAmount(ctx, api, 'lr-diagnose-first-update');
      const lastStep = Math.min(
        z.length - 1,
        1 + Math.floor((z.length - 2) * cueAmount(ctx, api, 'remaining-updates')),
      );
      const visibleSteps = (rows) =>
        firstStep < 1
          ? [
              rows[0],
              { step: firstStep, loss: rows[0].loss + (rows[1].loss - rows[0].loss) * firstStep },
            ]
          : rows.slice(0, lastStep + 1);
      api.teaching.curve({
        plot: q,
        points: visibleSteps(a).map((r) => ({
          x: r.step,
          y: r.loss,
        })),
        color: themeColors.cyan,
        width: 4,
      });
      api.teaching.curve({
        plot: q,
        points: visibleSteps(z).map((r) => ({
          x: r.step,
          y: r.loss,
        })),
        color: themeColors.pink,
        width: 4,
      });
      const point = visibleSteps(z).at(-1);
      labelPoint(ctx, api, q, point.step, point.loss, themeColors.yellow);
      text(ctx, api, 'Loss after one update', 1540, 350, 31, themeColors.muted);
      text(
        ctx,
        api,
        'Step 0.2    ' + (firstStep === 1 ? a[1].loss.toFixed(3) : '?'),
        1540,
        500,
        37,
        themeColors.cyan,
      );
      text(
        ctx,
        api,
        'Step 2.0    ' + (firstStep === 1 ? z[1].loss.toFixed(3) : '?'),
        1540,
        650,
        37,
        themeColors.pink,
      );
      text(ctx, api, 'Starting loss   ' + z[0].loss.toFixed(3), 1510, 820, 29, themeColors.yellow);
      text(ctx, api, 'Both runs start at the same weights', 960, 995, 32, themeColors.muted);
    }
  });
}
export default {
  id: 'implementation-parity',
  draw: drawImplementationParity,
  cues: [
    'lr-implementation-parity-step-0',
    'lr-library-coefficients',
    'lr-implementation-parity-step-1',
    'lr-parity-penalty',
    'r3-score',
    'r3-review',
    'lr-implementation-parity-step-2',
    'lr-diagnose-first-update',
    'remaining-updates',
  ],
};
