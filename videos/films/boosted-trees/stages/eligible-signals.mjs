import { boostCue } from '../construction.mjs';
import { arrow, cellText, chapterText, dot, footer, heading, line } from '../defaults.mjs';
export function drawEligibleSignals(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const cueProgress = (id, beat = currentBeat) => boostCue(state, id, beat);
  api.focus.target('eligible-signals-model', () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'A candidate baseline has a defined population');
      const ys = [400, 585, 775];
      [
        ['2022 benchmark', '~10k-row medium tables', themeColors.blue],
        ['2025 TabPFN study', 'defined small-data regime', themeColors.cyan],
        ['This fixture', 'SLA decisions on later jobs', themeColors.yellow],
      ].forEach(([label, detail, col], i) => {
        chapterText(ctx, api, label, 250, ys[i], 32, col);
        line(ctx, api, 630, ys[i] - 12, 1600, ys[i] - 12, col, 3);
        chapterText(ctx, api, detail, 740, ys[i] + 40, 29, themeColors.ink);
      });
      footer(ctx, api, 'Large-model flag turns on at 900 GB of input.');
    } else if (currentBeat === 1) {
      heading(ctx, api, 'A historical row must pass two availability clocks');
      line(ctx, api, 270, 460, 1700, 460, themeColors.muted, 4);
      const decision = 650,
        cutoff = 1200;
      line(ctx, api, decision, 350, decision, 820, themeColors.yellow, 3);
      line(ctx, api, cutoff, 350, cutoff, 820, themeColors.cyan, 3);
      cellText(ctx, api, 'job decision', decision, 315, themeColors.yellow, 27);
      cellText(ctx, api, 'fit cutoff', cutoff, 315, themeColors.cyan, 27);
      [
        ['heartbeat', 470, 575, true],
        ['late diagnostic', 900, 680, false],
        ['final job label', 1460, 785, false],
      ].forEach(([name, arrival, yy, valid]) => {
        const t = cueProgress('eligibility-cutoff', 1),
          x = valid ? arrival : arrival + 90 * t;
        dot(ctx, api, arrival, 460, valid ? themeColors.blue : themeColors.pink, 13);
        line(ctx, api, arrival, 475, x, yy - 28, valid ? themeColors.blue : themeColors.pink, 2);
        chapterText(
          ctx,
          api,
          name,
          x,
          yy,
          28,
          valid ? themeColors.blue : themeColors.pink,
          'center',
        );
        if (!valid && t > 0.5) cellText(ctx, api, 'unavailable', x, yy + 70, themeColors.pink, 25);
      });
      footer(
        ctx,
        api,
        'Match each feature to the decision time and each label to the training cutoff.',
      );
    } else {
      heading(ctx, api, 'Estimator support and outage quality are different checks');
      const x = 950,
        yy = 450,
        route = cueProgress('eligibility-nan', 2);
      dot(ctx, api, x, yy, themeColors.yellow, 20);
      cellText(ctx, api, 'NaN heartbeat', x, 370, themeColors.yellow);
      arrow(ctx, api, x, yy + 25, 500, 700, themeColors.blue);
      arrow(ctx, api, x, yy + 25, 1400, 700, themeColors.muted);
      cellText(ctx, api, '12 training rows', 500, 775, themeColors.blue);
      cellText(ctx, api, '5 training rows', 1400, 775, themeColors.muted);
      cellText(ctx, api, 'left', 500, 845, themeColors.blue);
      cellText(ctx, api, 'right', 1400, 845, themeColors.muted);
      if (route > 0) dot(ctx, api, x + (500 - x) * route, yy + 245 * route, themeColors.yellow, 15);
      cellText(
        ctx,
        api,
        'scikit-learn HistGradientBoostingClassifier',
        960,
        950,
        themeColors.cyan,
        27,
      );
      footer(
        ctx,
        api,
        'No missing values in training → documented majority-child fallback. Classic GradientBoostingClassifier rejects NaNs.',
      );
    }
  });
}
export default {
  id: 'eligible-signals',
  draw: drawEligibleSignals,
  cues: [
    'eligible-signals-step-1',
    'eligible-signals-step-2',
    'eligibility-cutoff',
    'eligible-signals-step-3',
    'eligibility-nan',
  ],
};
