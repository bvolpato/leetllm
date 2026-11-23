import { sigmoid } from '../arithmetic.mjs';
import { APRIL_TREE_TRACE } from '../fixtures.mjs';
import { boostCue } from '../construction.mjs';
import { APRIL_POLICY } from '../model.mjs';
import { cellText, chapterText, dot, footer, heading } from '../defaults.mjs';
export function drawServingWork(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  api.focus.target('serving-work-model', () => {
    if (currentBeat === 0) {
      const trace = [
        {
          tree: 0,
          raw: APRIL_TREE_TRACE.initialLogit,
          probability: sigmoid(APRIL_TREE_TRACE.initialLogit),
        },
        ...APRIL_TREE_TRACE.stages,
      ];
      const n = Math.floor(
        APRIL_TREE_TRACE.stages.length * boostCue(state, 'serving-additions', 0),
      );
      const current = trace[n];
      chapterText(
        ctx,
        api,
        'Job 0   ·   208 GB   ·   heartbeat 4 h   ·   backlog 15   ·   priority',
        225,
        285,
        32,
      );
      const plot = api.teaching.axes({
        x: 255,
        y: 420,
        width: 815,
        height: 360,
        xDomain: [0, 50],
        yDomain: [-2.5, -0.6],
        xTicks: [0, 10, 20, 30, 40, 50],
        yTicks: [-2, -1.5, -1],
        xLabel: 'Tree additions for this job',
        yLabel: 'Logit',
        fontSize: 28,
      });
      if (n > 0)
        api.teaching.curve({
          plot,
          points: trace.slice(0, n + 1).map((s) => ({ x: s.tree, y: s.raw })),
          color: themeColors.cyan,
          width: 4,
          progress: 1,
        });
      const at = plot.point(current.tree, current.raw);
      dot(ctx, api, at.x, at.y, themeColors.yellow, 11);
      cellText(
        ctx,
        api,
        'Trees applied  ' + n + ' / 50     ·     score  ' + current.probability.toFixed(6),
        664,
        952,
        themeColors.cyan,
        32,
      );
      chapterText(ctx, api, 'Work per model', 1180, 397, 32);
      cellText(ctx, api, 'Search', 1510, 468, themeColors.blue, 28);
      cellText(ctx, api, 'Selected', 1680, 468, themeColors.yellow, 28);
      const metrics = [
        ['Trees', 160, 50],
        ['Stored nodes', 1100, 350],
        ['Max. splits / job', 320, 100],
      ];
      metrics.forEach(([name, before, after], i) => {
        const y = 556 + 102 * i;
        chapterText(ctx, api, name, 1150, y, 28);
        cellText(ctx, api, before, 1510, y, themeColors.blue, 32);
        cellText(ctx, api, after, 1680, y, themeColors.yellow, 32);
      });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'One request keeps its unchanged feature work');
      const after = K('request-clock-after', 1),
        width = 1180,
        unit = width / 20,
        xx = 320;
      ['before', 'after'].forEach((label, i) => {
        const y = 490 + i * 260;
        chapterText(ctx, api, label, 230, y + 35, 29, themeColors.ink);
        api.rect(ctx, xx, y, 18 * unit, 90, themeColors.blue);
        cellText(ctx, api, 'feature work · 18 ms', xx + 9 * unit, y + 56, themeColors.ink, 29);
        const score = i && after ? 1 : 2;
        api.rect(ctx, xx + 18 * unit, y, score * unit, 90, themeColors.yellow);
        cellText(
          ctx,
          api,
          score + ' ms',
          xx + 18 * unit + (score * unit) / 2,
          y + 145,
          themeColors.yellow,
          28,
        );
        chapterText(ctx, api, 18 + score + ' ms', 1680, y + 55, 30, themeColors.ink);
      });
      if (after)
        cellText(ctx, api, '(20 − 19) / 20 = 5% lower latency', 960, 965, themeColors.green, 31);
      footer(ctx, api, 'Time real requests under load to see which operations overlap.');
    } else {
      heading(ctx, api, 'A new runtime is a changed candidate requiring parity and load evidence');
      const threshold = APRIL_POLICY.threshold,
        probes = [threshold - 1e-9, threshold, threshold + 1e-9];
      probes.forEach((v, i) => {
        const y = 440 + i * 170;
        chapterText(
          ctx,
          api,
          ['just below t', 'exactly t', 'just above t'][i],
          250,
          y,
          29,
          themeColors.ink,
        );
        cellText(
          ctx,
          api,
          v >= threshold ? 'reference alert' : 'reference quiet',
          900,
          y,
          v >= threshold ? themeColors.blue : themeColors.muted,
          29,
        );
        cellText(ctx, api, 'converted action ?', 1480, y, themeColors.yellow, 29);
      });
      cellText(
        ctx,
        api,
        'also: missing routing · feature order · supported schema',
        960,
        970,
        themeColors.cyan,
        30,
      );
      footer(ctx, api, 'Treelite → TL2cgen. Check the converted model on the same inputs.');
    }
  });
}
export default {
  id: 'serving-work',
  draw: drawServingWork,
  cues: [
    'serving-work-step-1',
    'serving-additions',
    'serving-work-step-2',
    'request-clock-before',
    'request-clock-after',
    'serving-work-step-3',
  ],
};
