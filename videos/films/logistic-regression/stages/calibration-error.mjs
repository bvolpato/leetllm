import { auditProbabilities, validation } from '../fixtures.mjs';
import { calibrationAudit } from '../model.mjs';
import { axes, cueAmount, equation, rectangle, segment, text } from '../defaults.mjs';
export function drawCalibrationError(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-calibration-error-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-calibration-error-mechanism', () => {
    const flipped = currentBeat === 2 && cueAmount(ctx, api, 'lr-flipped-label') > 0.5,
      labels = validation.map((r) => r[2]);
    if (flipped) labels[3] = 1;
    const eight = currentBeat === 1 && cueAmount(ctx, api, 'lr-eight-bin-answer') > 0,
      a = calibrationAudit({
        labels,
        binCount: eight ? 8 : 4,
      });
    if (currentBeat < 2) {
      const q = axes(
        ctx,
        api,
        230,
        360,
        830,
        460,
        [0, 1],
        [0, 1],
        'mean predicted probability',
        'observed positive fraction',
      );
      const aa = q.point(0, 0),
        zz = q.point(1, 1);
      segment(ctx, api, aa.x, aa.y, zz.x, zz.y, themeColors.muted, 2);
      const amount = currentBeat === 0 ? op : 1;
      a.bins
        .filter((x) => x.n)
        .forEach((bin, i) => {
          const pt = q.point(bin.forecast, bin.observed),
            onLine = q.point(bin.forecast, bin.forecast);
          if (amount > (i + 0.3) / a.bins.length) {
            segment(ctx, api, pt.x, pt.y, onLine.x, onLine.y, themeColors.yellow, 5);
            api.circle(ctx, pt.x, pt.y, 9 + bin.n * 2, themeColors.cyan);
            const y = 370 + i * 69;
            text(
              ctx,
              api,
              'n=' + bin.n + ' · gap ' + bin.gap.toFixed(3),
              1450,
              y,
              29,
              themeColors.muted,
            );
            if (currentBeat > 0 || resultComplete('lr-bin-contribution'))
              text(
                ctx,
                api,
                (bin.n / 8).toFixed(3) +
                  ' × ' +
                  bin.gap.toFixed(3) +
                  ' = ' +
                  bin.contribution.toFixed(4),
                1450,
                y + 37,
                28,
                themeColors.yellow,
              );
          }
        });
      if (currentBeat === 1) {
        if (resultComplete('lr-ece-answer'))
          text(
            ctx,
            api,
            eight && !resultComplete('lr-eight-bin-answer')
              ? 'Eight-bin ECE pending'
              : (eight ? '8' : '4') + '-bin ECE ' + a.ece.toFixed(4),
            560,
            945,
            38,
            themeColors.yellow,
          );
        if (resultComplete('lr-brier-answer'))
          text(ctx, api, 'Brier ' + a.brier.toFixed(4), 1430, 945, 38, themeColors.pink);
        text(
          ctx,
          api,
          'Same displayed three-decimal probabilities; empty bins contribute zero',
          960,
          1010,
          28,
          themeColors.muted,
        );
      } else
        equation(
          ctx,
          api,
          'ECE=\\sum_b\\frac{n_b}{N}|\\bar p_b-\\bar y_b|',
          960,
          960,
          46,
          themeColors.yellow,
        );
    } else {
      auditProbabilities.forEach((p, i) => {
        const x = 250 + i * 200;
        text(ctx, api, 'V' + (i + 1), x, 360, 30, themeColors.muted);
        rectangle(ctx, api, x - 45, 440, 90, 330 * p, themeColors.cyan);
        text(ctx, api, p.toFixed(3), x, 850, 29, themeColors.cyan);
        api.circle(ctx, x, 940, 28, labels[i] ? themeColors.pink : themeColors.blue);
        if (i === 3) api.circle(ctx, x, 940, 40, '#00000000', themeColors.yellow, 4);
      });
      text(ctx, api, "Only V4's label changes", 960, 280, 35, themeColors.muted);
      const original = calibrationAudit();
      const bin = a.bins[Math.floor(auditProbabilities[3] * 4)];
      text(
        ctx,
        api,
        'F1   ' +
          original.f1.toFixed(3) +
          (resultComplete('lr-flip-metrics') ? ' → ' + a.f1.toFixed(3) : ''),
        530,
        1020,
        33,
        themeColors.green,
      );
      text(
        ctx,
        api,
        'ECE   ' +
          original.ece.toFixed(3) +
          (resultComplete('disputed-ece') ? ' → ' + a.ece.toFixed(3) : ''),
        1390,
        1020,
        33,
        themeColors.yellow,
      );
      if (resultComplete('lr-flip-metrics'))
        text(
          ctx,
          api,
          'V3 and V4   ·   mean score ' +
            bin.forecast.toFixed(2) +
            '   ·   ' +
            Math.round(bin.n * bin.observed) +
            ' of ' +
            bin.n +
            ' required review',
          960,
          205,
          31,
          themeColors.ink,
        );
    }
  });
}
export default {
  id: 'calibration-error',
  draw: drawCalibrationError,
  cues: [
    'lr-calibration-error-step-0',
    'lr-bin-contribution',
    'lr-calibration-error-step-1',
    'lr-ece-answer',
    'lr-brier-answer',
    'lr-eight-bin-answer',
    'lr-calibration-error-step-2',
    'lr-flipped-label',
    'lr-flip-metrics',
    'disputed-ece',
  ],
};
