import { fittedWeights } from '../fixtures.mjs';
import { likelihoodRows, trainingLoss } from '../model.mjs';
import { cueAmount, equation, rectangle, segment, text } from '../defaults.mjs';
export function drawBernoulliLikelihood(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-bernoulli-likelihood-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-bernoulli-likelihood-mechanism', () => {
    const rows = likelihoodRows(),
      reveal = currentBeat > 0 ? 1 : cueAmount(ctx, api, 'lr-label-selection'),
      count = currentBeat > 0 ? 8 : Math.min(8, Math.floor(reveal * 8.01));
    text(ctx, api, 'Same eight completed training requests', 960, 270, 33, themeColors.muted);
    if (currentBeat < 2) {
      rows.forEach((r, i) => {
        const y = 350 + i * 60;
        text(ctx, api, r.id, 230, y + 25, 28, r.y ? themeColors.pink : themeColors.blue);
        text(ctx, api, 'y=' + r.y, 360, y + 25, 28, r.y ? themeColors.pink : themeColors.blue);
        rectangle(ctx, api, 470, y, 650 * r.p, 27, themeColors.pink);
        rectangle(ctx, api, 470 + 650 * r.p, y, 650 * (1 - r.p), 27, themeColors.blue);
        if (i < count) {
          const chosen = r.y ? r.p : 1 - r.p;
          segment(
            ctx,
            api,
            470 + (r.y ? 0 : 650 * r.p),
            y + 40,
            470 + (r.y ? 650 * r.p : 650),
            y + 40,
            themeColors.yellow,
            4,
          );
          text(ctx, api, chosen.toFixed(3), 1270, y + 25, 29, themeColors.yellow);
          if (currentBeat === 1 && op > i / 8)
            text(ctx, api, r.loss.toFixed(3), 1560, y + 25, 29, themeColors.cyan);
        }
      });
      text(ctx, api, 'Selected label probability', 1260, 310, 28, themeColors.yellow);
      if (currentBeat === 1) text(ctx, api, '−log likelihood', 1560, 310, 28, themeColors.cyan);
      const product = rows.slice(0, count).reduce((s, r) => s * r.selected, 1);
      if (currentBeat === 0)
        equation(
          ctx,
          api,
          resultComplete('lr-complete-likelihood')
            ? '\\mathcal{L}=' + product.toFixed(5)
            : '\\mathcal{L}=\\prod_i P(y_i\\mid x_i)',
          960,
          950,
          44,
          themeColors.yellow,
        );
      else if (resultComplete('lr-mean-likelihood'))
        equation(
          ctx,
          api,
          'L=-\\frac18\\sum_i\\log P(y_i\\mid x_i)=' + trainingLoss(fittedWeights).toFixed(4),
          960,
          950,
          44,
          themeColors.cyan,
        );
      else text(ctx, api, 'Multiply probabilities, then add their negative logs', 960, 950, 34);
    } else {
      const r = rows[2];
      text(ctx, api, 'R3 observed label: positive', 530, 350, 35, themeColors.pink);
      rectangle(ctx, api, 280, 470, 480, 150, themeColors.panel, themeColors.muted);
      rectangle(ctx, api, 280, 470, 480 * r.p, 150, themeColors.pink);
      text(ctx, api, 'prediction p = ' + r.p.toFixed(3), 530, 700, 32, themeColors.pink);
      text(ctx, api, 'Hard target [0, 1]', 530, 800, 33);
      text(ctx, api, 'Population: four positives / eight', 1410, 350, 33, themeColors.muted);
      for (let i = 0; i < 8; i++) {
        rectangle(
          ctx,
          api,
          1120 + (i % 4) * 135,
          470 + Math.floor(i / 4) * 105,
          90,
          70,
          i < 4 ? themeColors.pink : themeColors.blue,
        );
      }
      if (resultComplete('lr-zero-target-entropy')) {
        equation(ctx, api, 'H(y_{R3})=0', 530, 940, 45, themeColors.yellow);
        equation(ctx, api, 'H(Y)=\\log2>0', 1410, 940, 45, themeColors.yellow);
      } else
        text(
          ctx,
          api,
          'A row target and population uncertainty are different objects',
          960,
          950,
          33,
        );
    }
  });
}
export default {
  id: 'bernoulli-likelihood',
  draw: drawBernoulliLikelihood,
  cues: [
    'lr-bernoulli-likelihood-step-0',
    'lr-label-selection',
    'lr-complete-likelihood',
    'lr-bernoulli-likelihood-step-1',
    'lr-mean-likelihood',
    'lr-bernoulli-likelihood-step-2',
    'lr-zero-target-entropy',
  ],
};
