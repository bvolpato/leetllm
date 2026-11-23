import { dynamicTree } from '../model.mjs';
import { cueStarted, dot, footer, line, panel, text } from '../defaults.mjs';
export function drawDynamicSelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('dynamic-selection-mechanism', () => {
    if (currentBeat >= 1 && currentBeat <= 3) {
      const changed = state.cues?.['dynamic-selection-parent-change']?.phase === 'after',
        settled = state.cues?.['dynamic-selection-no-leaves']?.phase === 'after',
        m = dynamicTree(changed ? 0.2 : 0.9),
        xs = {
          Serving: 550,
          Eval: 1390,
          Cache: 300,
          Queue: 800,
          Metric: 1390,
        },
        ys = {
          Serving: 365,
          Eval: 365,
          Cache: 680,
          Queue: 680,
          Metric: 680,
        };
      [
        ['Serving', 'Cache'],
        ['Serving', 'Queue'],
        ['Eval', 'Metric'],
      ].forEach(([a, z]) => {
        const visited =
          m.visited.includes(z) &&
          cueStarted(ctx, api, 'dynamic-selection', 'rate-' + z.toLowerCase());
        line(
          ctx,
          api,
          xs[a],
          ys[a] + 85,
          xs[z],
          ys[z] - 85,
          visited ? themeColors.cyan : themeColors.muted,
          3,
        );
      });
      ['Serving', 'Eval', 'Cache', 'Queue', 'Metric'].forEach((id) => {
        const visited =
          (id === 'Serving' && cueStarted(ctx, api, 'dynamic-selection', 'rate-serving')) ||
          (id === 'Eval' && cueStarted(ctx, api, 'dynamic-selection', 'prune-eval')) ||
          (!changed &&
            (id === 'Cache'
              ? cueStarted(ctx, api, 'dynamic-selection', 'rate-cache')
              : id === 'Queue'
                ? cueStarted(ctx, api, 'dynamic-selection', 'rate-queue')
                : false));
        const root = id === 'Serving' || id === 'Eval',
          score = m.scores[id];
        dot(
          ctx,
          api,
          'dynamic-selection',
          id,
          xs[id],
          ys[id],
          visited ? (score >= 0.5 ? themeColors.green : themeColors.pink) : themeColors.muted,
          85,
        );
        text(
          ctx,
          api,
          'dynamic-selection',
          visited ? String(score) : changed && !settled ? '?' : 'unrated',
          xs[id] + (root ? 150 : 0),
          ys[id] + (root ? 12 : 140),
          31,
          visited ? (score >= 0.5 ? themeColors.green : themeColors.pink) : themeColors.muted,
          'center',
        );
      });
      text(
        ctx,
        api,
        'dynamic-selection',
        'Threshold ≥ 0.5',
        960,
        250,
        37,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        'dynamic-selection',
        changed
          ? settled
            ? 'No leaves visited on this pass'
            : 'Which leaves will be visited on this pass?'
          : 'Rate children only if the parent passes.',
        960,
        905,
        34,
        changed ? themeColors.pink : themeColors.cyan,
        'center',
      );
      footer(
        ctx,
        api,
        'dynamic-selection',
        changed ? 'Previous pass: Cache 0.8 and Queue 0.7' : 'Example selector with no fallback',
      );
    } else if (currentBeat === 0) {
      panel(ctx, api, 'dynamic-selection', 135, 285, 765, 300, themeColors.yellow, themeColors.bg);
      panel(ctx, api, 'dynamic-selection', 885, 285, 765, 300, themeColors.yellow, themeColors.bg);
      const reports = Array.from(
        {
          length: 12,
        },
        (_, i) => i,
      );
      reports.forEach((_, i) => {
        const x = 170 + (i % 6) * 245,
          y = 310 + Math.floor(i / 6) * 150;
        panel(ctx, api, 'dynamic-selection', x, y, 195, 95, themeColors.blue);
        text(
          ctx,
          api,
          'dynamic-selection',
          'R' + (i + 1),
          x + 97,
          y + 60,
          32,
          themeColors.blue,
          'center',
        );
      });
      text(ctx, api, 'dynamic-selection', 'Batch 1', 510, 675, 34, themeColors.yellow, 'center');
      text(ctx, api, 'dynamic-selection', 'Batch 2', 1270, 675, 34, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'dynamic-selection',
        'Pack by token length → map rated points → filtered reduction',
        960,
        840,
        33,
        themeColors.ink,
        'center',
      );
      footer(
        ctx,
        api,
        'dynamic-selection',
        'Twelve reports fit into two map calls at these lengths.',
      );
    } else {
      text(
        ctx,
        api,
        'dynamic-selection',
        'AP News dynamic-selection study · Nov 2024',
        960,
        280,
        38,
        themeColors.ink,
        'center',
      );
      const x = 330,
        y = 500,
        w = 1250;
      panel(ctx, api, 'dynamic-selection', x, y, w, 90, themeColors.blue, themeColors.blue);
      panel(
        ctx,
        api,
        'dynamic-selection',
        x,
        y + 180,
        w * 0.23,
        90,
        themeColors.green,
        themeColors.green,
      );
      text(
        ctx,
        api,
        'dynamic-selection',
        'Static Level 1   ·   100 units',
        960,
        y + 58,
        31,
        themeColors.bg,
        'center',
      );
      text(
        ctx,
        api,
        'dynamic-selection',
        'Dynamic   ·   23',
        x + w * 0.115,
        y + 238,
        29,
        themeColors.bg,
        'center',
      );
      text(
        ctx,
        api,
        'dynamic-selection',
        '50 global questions · average token cost −77%',
        960,
        850,
        35,
        themeColors.green,
        'center',
      );
      footer(
        ctx,
        api,
        'dynamic-selection',
        'Level 3 comparison: 29 selected questions, 34% higher average cost.',
      );
    }
  });
}
export default {
  id: 'dynamic-selection',
  draw: drawDynamicSelection,
  cues: [
    'batches',
    'rate-serving',
    'rate-cache',
    'rate-queue',
    'prune-eval',
    'parent-change',
    'no-leaves',
    'study',
  ].map((name) => 'dynamic-selection-' + name),
};
