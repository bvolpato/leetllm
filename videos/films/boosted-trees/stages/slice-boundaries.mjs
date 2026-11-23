import { sliceResult } from '../arithmetic.mjs';
import { boostCue } from '../construction.mjs';
import { APRIL_POLICY } from '../model.mjs';
import {
  cellText,
  chapterText,
  footer,
  heading,
  line,
  outlineBox,
  valueBar,
} from '../defaults.mjs';
export function drawSliceBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  api.focus.target('slice-boundaries-model', () => {
    heading(ctx, api, 'Recall needs both a numerator and a supported denominator');
    if (currentBeat === 0) {
      const rows = [
        {
          n: 0,
          caught: 0,
        },
        {
          n: 9,
          caught: 9,
        },
        {
          n: 36,
          caught: 36,
        },
      ];
      rows.forEach((r, i) => {
        const x = 450 + i * 510,
          result = sliceResult(r.n, r.caught, 0.9);
        cellText(ctx, api, 'positives ' + r.n, x, 430, themeColors.ink);
        for (let j = 0; j < Math.max(10, r.n); j++) {
          const xx = x - 160 + (j % 10) * 35,
            yy = 540 + Math.floor(j / 10) * 55;
          outlineBox(ctx, api, xx, yy, 22, 28, j < r.n ? themeColors.blue : themeColors.muted);
        }
        if (S('support-failure', 0)) {
          cellText(
            ctx,
            api,
            'recall ' + (result.recall === null ? 'undefined' : result.recall.toFixed(2)),
            x,
            830,
            result.passed ? themeColors.green : themeColors.pink,
            28,
          );
          cellText(
            ctx,
            api,
            result.passed ? 'support passes' : 'support fails',
            x,
            930,
            result.passed ? themeColors.green : themeColors.pink,
            29,
          );
        }
      });
      footer(
        ctx,
        api,
        'Priority requires 10 misses and recall ≥ 0.90. A large priority job counts in both groups.',
      );
    } else if (currentBeat === 1) {
      const changed = S('slice-threshold-change', 1),
        verdict = K('gbt-slice-verdict', 1);
      cellText(ctx, api, 'trees: fixed', 480, 400, themeColors.cyan, 34);
      cellText(
        ctx,
        api,
        'threshold: ' + (changed ? '0.50' : APRIL_POLICY.threshold),
        1350,
        400,
        themeColors.yellow,
        34,
      );
      const rows = [
        {
          name: 'priority',
          n: 36,
          caught: 26,
          min: 0.9,
        },
        {
          name: 'large-input proxy',
          n: 31,
          caught: 20,
          min: 0.85,
        },
      ];
      rows.forEach((r, i) => {
        const y = 570 + i * 245;
        chapterText(ctx, api, r.name, 270, y, 31, themeColors.ink);
        valueBar(ctx, api, 730, y - 30, 840, 1, 1, themeColors.grid, 44);
        line(ctx, api, 730 + 840 * r.min, y - 55, 730 + 840 * r.min, y + 45, themeColors.yellow, 3);
        if (K(i ? 'gbt-slice-large-result' : 'slice-recall-result', 1)) {
          const score = sliceResult(r.n, r.caught, r.min),
            color = verdict ? themeColors.pink : themeColors.cyan;
          valueBar(ctx, api, 730, y - 30, 840, score.recall, 1, color, 44);
          chapterText(
            ctx,
            api,
            `${r.caught}/${r.n} = ${score.recall.toFixed(3)}`,
            730,
            y + 90,
            29,
            color,
          );
        } else
          chapterText(ctx, api, 'rescore the changed policy', 730, y + 90, 28, themeColors.muted);
      });
      footer(ctx, api, 'Each recall compares caught misses with all misses in that group.');
    } else {
      cellText(ctx, api, 'saved candidate', 500, 450, themeColors.blue, 35);
      cellText(ctx, api, 't = ' + APRIL_POLICY.threshold, 500, 570, themeColors.cyan, 33);
      cellText(ctx, api, 'restore the exact recipe', 500, 740, themeColors.green, 31);
      cellText(ctx, api, 'search May for a cutoff', 1370, 450, themeColors.pink, 33);
      line(ctx, api, 1110, 510, 1650, 675, themeColors.pink, 5);
      line(ctx, api, 1650, 510, 1110, 675, themeColors.pink, 5);
      cellText(ctx, api, 'needs fresh final evidence', 1370, 790, themeColors.pink, 31);
      footer(ctx, api, 'Review recall together with mistake costs and the number of alerts.');
    }
  });
}
export default {
  id: 'slice-boundaries',
  draw: drawSliceBoundaries,
  cues: [
    'slice-boundaries-step-1',
    'support-failure',
    'slice-boundaries-step-2',
    'slice-threshold-change',
    'slice-recall-result',
    'gbt-slice-large-result',
    'gbt-slice-verdict',
    'slice-boundaries-step-3',
  ],
};
