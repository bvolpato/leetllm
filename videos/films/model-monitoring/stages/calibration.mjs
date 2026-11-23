import { scoredMature } from '../fixtures.mjs';
import { confusion } from '../model.mjs';
import { cueVisible, dot, footer, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (key) => state.cues?.[`m-${'calibration'}-${key}`]?.phase === 'after';
  const countTokens = (n, x, y, color, cols = 10, gap = 22, r = 6) => {
    for (let i = 0; i < n; i++)
      dot(ctx, api, x + (i % cols) * gap, y + Math.floor(i / cols) * gap, color, r);
  };
  {
    if (currentBeat === 0) {
      text(
        ctx,
        api,
        'Historical policy   /   review at 0.50 or higher',
        960,
        282,
        33,
        themeColors.blue,
      );
      const results = confusion(scoredMature),
        names = [
          ['TP', results.tp, themeColors.cyan],
          ['FP', results.fp, themeColors.pink],
          ['FN', results.fn, themeColors.red],
          ['TN', results.tn, themeColors.green],
        ];
      scoresToBins();
      function scoresToBins() {
        names.forEach(([name, n, col], i) => {
          const x = 180 + i * 440;
          panel(ctx, api, x, 370, 390, 270, col);
          text(ctx, api, name, x + 195, 425, 33, col);
          if (cueVisible(ctx, api, 'calibration', 'counts')) {
            countTokens(n, x + 145, 495, col, 5, 45, 14);
            text(ctx, api, n, x + 195, 590, 42, col);
          }
        });
      }
      if (cueVisible(ctx, api, 'calibration', 'precision'))
        text(ctx, api, 'precision = TP / (TP+FP)', 580, 745, 34, themeColors.cyan);
      if (cueVisible(ctx, api, 'calibration', 'recall'))
        text(ctx, api, 'recall = TP / (TP+FN)', 1360, 745, 34, themeColors.green);
      if (cueVisible(ctx, api, 'calibration', 'normalize'))
        text(
          ctx,
          api,
          'cost / 1,000 = (2 FP + 10 FN) × 1,000 / n',
          960,
          850,
          36,
          themeColors.yellow,
        );
      footer(ctx, api, 'An empty precision or recall denominator is undefined.');
    } else {
      const extra = state.cues?.['calibration-beat-2'];
      const groups = [
        {
          x: 210,
          rows: scoredMature.filter((row) => !row.decision),
          key: 'low',
          color: themeColors.cyan,
        },
        {
          x: 1050,
          rows: scoredMature.filter((row) => row.decision),
          key: 'high',
          color: themeColors.pink,
        },
      ];
      for (const { x, rows, key, color } of groups) {
        const mean = rows.reduce((sum, row) => sum + row.score, 0) / rows.length;
        const hits = rows.filter((row) => row.label).length;
        const added = key === 'high' && extra && extra.phase !== 'before';
        panel(ctx, api, x, 320, 660, 430, color);
        rows.forEach((row, i) => {
          const cx = x + (key === 'low' ? 245 : 108) + 148 * i;
          text(ctx, api, row.score.toFixed(2), cx, 400, 39, color);
          dot(ctx, api, cx, 467, row.label ? themeColors.red : themeColors.muted, 18);
          text(ctx, api, row.label ? 'Missed' : 'Met', cx, 535, 30, themeColors.ink);
        });
        if (added) {
          const cx = x + 552;
          text(ctx, api, 'New job', cx, 400, 32, color);
          dot(ctx, api, cx + 52 * (1 - extra.progress), 467, themeColors.red, 18);
          text(ctx, api, 'Missed', cx, 535, 30, themeColors.ink);
        }
        if (done(key) || currentBeat > 1) {
          const original = `misses ${hits} / ${rows.length} = ${(hits / rows.length).toFixed(3)}`;
          text(
            ctx,
            api,
            `${added ? 'mean of first 3 scores' : 'mean score'} ${mean.toFixed(3)}`,
            x + 330,
            621,
            35,
            color,
          );
          const rate =
            key === 'high' && done('extra')
              ? `misses ${hits + 1} / ${rows.length + 1} = ${((hits + 1) / (rows.length + 1)).toFixed(3)}`
              : original;
          text(ctx, api, rate, x + 330, 700, 35, themeColors.ink);
        }
      }
      if (cueVisible(ctx, api, 'calibration', 'treatment')) {
        text(
          ctx,
          api,
          'If a reviewer moves a job to a free runner…',
          960,
          836,
          42,
          themeColors.yellow,
        );
        footer(ctx, api, 'Its recorded outcome tells us what happened with help.');
      } else if (done('extra')) {
        text(ctx, api, 'One more miss:   2 of 3   →   3 of 4', 960, 868, 42, themeColors.ink);
      }
    }
  }
}
export function drawCalibration(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('calibration-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'calibration',
  draw: drawCalibration,
  cues: [
    'calibration-beat-0',
    'm-calibration-counts',
    'm-calibration-precision',
    'm-calibration-recall',
    'm-calibration-normalize',
    'calibration-beat-1',
    'm-calibration-low',
    'm-calibration-high',
    'calibration-beat-2',
    'm-calibration-extra',
    'm-calibration-treatment',
  ],
};
