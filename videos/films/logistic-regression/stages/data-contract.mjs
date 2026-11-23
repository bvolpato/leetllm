import { fitSteps, fittedWeights, training } from '../fixtures.mjs';
import { trainingLoss } from '../model.mjs';
import { cueAmount, rectangle, text } from '../defaults.mjs';
export function drawDataContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-data-contract-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-data-contract-mechanism', () => {
    if (currentBeat === 0) {
      const p = cueAmount(ctx, api, 'lr-shape-broadcast');
      text(ctx, api, 'Eight labels must pair with eight logits', 960, 270, 36);
      text(ctx, api, 'Correct (8,) × (8,): 8 pairs', 530, 350, 31, themeColors.green);
      text(ctx, api, 'Mistaken (8,1) × (8,): 64 pairs', 1410, 350, 31, themeColors.pink);
      for (let i = 0; i < 8; i++) {
        rectangle(ctx, api, 260 + i * 68, 470, 48, 48, themeColors.green);
        for (let j = 0; j < 8; j++) {
          const fraction = (i * 8 + j) / 64;
          if (p > fraction)
            rectangle(
              ctx,
              api,
              1140 + j * 60,
              430 + i * 56,
              40,
              38,
              i === j ? themeColors.green : themeColors.pink,
            );
        }
      }
      if (resultComplete('lr-shape-reject'))
        text(ctx, api, 'Reject the broadcast before fitting', 960, 985, 37, themeColors.pink);
      else
        text(
          ctx,
          api,
          'Every off-diagonal cell pairs a label with another request',
          960,
          985,
          31,
          themeColors.muted,
        );
    } else if (currentBeat === 1) {
      const count = Math.min(4, Math.floor(op * 4.001)),
        positive = training.filter((r) => r[2]).slice(0, count),
        negative = training.filter((r) => !r[2]).slice(0, count),
        means = (rows) =>
          [0, 1].map((j) => (rows.length ? rows.reduce((s, r) => s + r[j], 0) / rows.length : 0));
      text(
        ctx,
        api,
        'First update: collected ' + count + ' / 4 rows per class',
        960,
        275,
        34,
        themeColors.muted,
      );
      ['ambiguity', 'support'].forEach((name, j) => {
        const pos = means(positive)[j],
          neg = means(negative)[j],
          x = 340 + j * 850;
        text(ctx, api, name, x + 200, 370, 34, j ? themeColors.green : themeColors.pink);
        rectangle(ctx, api, x, 800 - pos * 48, 170, Math.max(1, pos * 48), themeColors.pink);
        rectangle(ctx, api, x + 240, 800 - neg * 48, 170, Math.max(1, neg * 48), themeColors.blue);
        text(ctx, api, count ? pos.toFixed(2) : 'pending', x + 85, 860, 34, themeColors.pink);
        text(ctx, api, count ? neg.toFixed(2) : 'pending', x + 325, 860, 34, themeColors.blue);
      });
      text(ctx, api, 'pink: positive rows · blue: negative rows', 960, 930, 31, themeColors.muted);
      if (resultComplete('lr-sign-conditional'))
        text(
          ctx,
          api,
          'Later joint fit: support coefficient ' + fittedWeights[2].toFixed(3),
          960,
          1000,
          35,
          themeColors.green,
        );
    } else {
      const steps = [1, 201, 501, 1001, 3000],
        shown = Math.max(1, Math.ceil(op * steps.length));
      text(
        ctx,
        api,
        'Each row is evaluated AFTER its own update',
        960,
        280,
        36,
        themeColors.yellow,
      );
      text(ctx, api, 'step', 280, 370, 31, themeColors.muted);
      text(ctx, api, 'weights', 960, 370, 31, themeColors.cyan);
      text(ctx, api, 'mean loss', 1570, 370, 31, themeColors.pink);
      steps.slice(0, shown).forEach((i, j) => {
        const w = fitSteps[i],
          y = 460 + j * 95;
        text(ctx, api, i, 280, y, 34);
        text(
          ctx,
          api,
          '[' + w.map((v) => v.toFixed(3)).join(', ') + ']',
          960,
          y,
          34,
          themeColors.cyan,
        );
        text(ctx, api, trainingLoss(w).toFixed(4), 1570, y, 34, themeColors.pink);
      });
      text(
        ctx,
        api,
        'Match reduction, penalty, intercept and stopping boundary',
        960,
        990,
        33,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'data-contract',
  draw: drawDataContract,
  cues: [
    'lr-data-contract-step-0',
    'lr-shape-broadcast',
    'lr-shape-reject',
    'lr-data-contract-step-1',
    'lr-sign-conditional',
    'lr-data-contract-step-2',
    'lr-snapshot-boundary',
  ],
};
