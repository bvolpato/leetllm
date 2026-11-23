import { validationScores } from '../fixtures.mjs';
import { prevalenceFixture } from '../model.mjs';
import { cueAmount, rectangle, text } from '../defaults.mjs';
export function drawRareEventPopulation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-rare-event-population-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-rare-event-population-mechanism', () => {
    if (currentBeat === 0) {
      for (let i = 0; i < 100; i++)
        rectangle(
          ctx,
          api,
          240 + (i % 20) * 72,
          350 + Math.floor(i / 20) * 70,
          45,
          45,
          i < 4 ? themeColors.pink : themeColors.blue,
        );
      text(ctx, api, 'Automatic for every request', 960, 780, 36);
      if (resultComplete('automatic-accuracy'))
        text(ctx, api, '96% accuracy', 560, 930, 44, themeColors.blue);
      if (resultComplete('lr-majority-baseline'))
        text(ctx, api, '0% review recall', 1400, 930, 44, themeColors.pink);
    } else {
      const mode = currentBeat === 1 ? 'repeat' : 'easy',
        result = prevalenceFixture(mode),
        base = prevalenceFixture(),
        amount =
          currentBeat === 1
            ? cueAmount(ctx, api, 'lr-repeat-negatives')
            : cueAmount(ctx, api, 'lr-easy-negatives'),
        n = Math.round(100 * amount);
      text(
        ctx,
        api,
        currentBeat === 1
          ? '25 copies per original negative, including the original'
          : '100 additional easy zero-score negatives',
        960,
        275,
        33,
        themeColors.muted,
      );
      validationScores.forEach((v, i) => {
        const x = 230 + i * 195;
        api.circle(ctx, x, 390, 22, v.label ? themeColors.pink : themeColors.blue);
        text(ctx, api, v.id, x, 445, 28, v.label ? themeColors.pink : themeColors.blue);
        text(ctx, api, v.p.toFixed(3), x, 500, 28, themeColors.muted);
      });
      if (currentBeat === 1) {
        const negatives = validationScores.filter((v) => !v.label);
        negatives.forEach((v, g) =>
          text(
            ctx,
            api,
            v.id + ' × 25 · p ' + v.p.toFixed(3),
            360 + g * 350,
            555,
            26,
            themeColors.blue,
          ),
        );
        for (let i = 0; i < n; i++) {
          const g = Math.floor(i / 25),
            j = i % 25;
          rectangle(
            ctx,
            api,
            250 + g * 350 + (j % 5) * 48,
            600 + Math.floor(j / 5) * 35,
            32,
            25,
            themeColors.blue,
          );
        }
      } else
        for (let i = 0; i < n; i++)
          rectangle(
            ctx,
            api,
            250 + (i % 20) * 70,
            560 + Math.floor(i / 20) * 53,
            43,
            30,
            themeColors.blue,
          );
      text(
        ctx,
        api,
        currentBeat === 1
          ? 'Upper row: score reference · lower pool: all 100 negatives'
          : 'Upper row: original eight · lower pool: 100 additional negatives',
        960,
        850,
        28,
        themeColors.muted,
      );
      text(
        ctx,
        api,
        'Original ROC point (' + base.fpr.toFixed(1) + ', 1.0)',
        570,
        935,
        31,
        themeColors.muted,
      );
      const done =
        currentBeat === 1
          ? resultComplete('lr-repeat-negatives')
          : resultComplete('lr-easy-negatives');
      if (done) {
        text(
          ctx,
          api,
          'FPR ' + result.fpr.toFixed(4) + ' · AUC ' + result.auc.toFixed(4),
          1350,
          900,
          33,
          themeColors.yellow,
        );
        text(
          ctx,
          api,
          'Selected precision ' + result.precision.toFixed(4),
          1350,
          975,
          33,
          themeColors.cyan,
        );
      } else
        text(ctx, api, 'Class-conditional score mix is visible', 1350, 955, 31, themeColors.muted);
    }
  });
}
export default {
  id: 'rare-event-population',
  draw: drawRareEventPopulation,
  cues: [
    'lr-rare-event-population-step-0',
    'automatic-accuracy',
    'lr-majority-baseline',
    'lr-rare-event-population-step-1',
    'lr-repeat-negatives',
    'lr-rare-event-population-step-2',
    'lr-easy-negatives',
  ],
};
