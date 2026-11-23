import { anchors } from '../fixtures.mjs';
import { cueProgress, cueVisible, equation, panel, text, withFocus } from '../defaults.mjs';
export function drawEvaluationFormats(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  {
    if (currentBeat === 0) {
      text(ctx, api, 'One answer → one anchored judgment', 130, 280, 32, themeColors.ink);
      anchors.forEach((a, i) => {
        if (cueVisible(ctx, api, ['pointwise-anchors', 'pointwise-one', 'pointwise-two'][i]))
          panel(
            ctx,
            api,
            'pointwise-anchors',
            String(a.level) + ' · ' + a.description,
            a.example,
            150 + i * 570,
            390,
            530,
            215,
            [themeColors.pink, themeColors.yellow, themeColors.green][i],
          );
      });
      if (cueVisible(ctx, api, 'ordinal-limit'))
        withFocus(ctx, api, 'ordinal-limit', () => {
          text(ctx, api, '0        1        2', 960, 750, 48, themeColors.yellow, 'center');
          text(
            ctx,
            api,
            'Ordered levels do not establish equal distance.',
            960,
            835,
            33,
            themeColors.ink,
            'center',
          );
          text(ctx, api, 'N answers → N calls', 960, 925, 34, themeColors.cyan, 'center');
        });
    } else if (currentBeat === 1) {
      const points = Array.from(
        {
          length: 6,
        },
        (_, i) => ({
          x: 490 + 250 * Math.cos(-Math.PI / 2 + (i * Math.PI) / 3),
          y: 570 + 250 * Math.sin(-Math.PI / 2 + (i * Math.PI) / 3),
        }),
      );
      const pairs = [];
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) pairs.push([i, j]);
      const edge = (i, j, color, width) => {
        const from = points[i],
          to = points[j],
          dx = to.x - from.x,
          dy = to.y - from.y,
          d = Math.hypot(dx, dy),
          gap = 40;
        api.line(
          ctx,
          from.x + (dx * gap) / d,
          from.y + (dy * gap) / d,
          to.x - (dx * gap) / d,
          to.y - (dy * gap) / d,
          color,
          width,
        );
      };
      withFocus(ctx, api, 'pair-lattice', () => {
        const n = cueVisible(ctx, api, 'pair-lattice')
          ? Math.ceil(cueProgress(ctx, api, 'pair-lattice') * 15)
          : 0;
        const baselineProgress = cueProgress(ctx, api, 'baseline-count');
        pairs
          .slice(0, n)
          .filter(([i], index) => i === 0 || index < pairs.length * (1 - baselineProgress))
          .forEach(([i, j]) => edge(i, j, themeColors.muted, 2));
        if (cueVisible(ctx, api, 'baseline-count')) {
          const star = Math.ceil(5 * cueProgress(ctx, api, 'baseline-count'));
          for (let j = 1; j <= star; j++) edge(0, j, themeColors.green, 4);
        }
        points.forEach((p, i) => {
          api.circle(ctx, p.x, p.y, 35, themeColors.panel, themeColors.cyan, 2);
          text(ctx, api, String(i + 1), p.x, p.y + 11, 31, themeColors.ink, 'center');
        });
      });
      text(ctx, api, 'Six candidate revisions', 490, 925, 31, themeColors.cyan, 'center');
      withFocus(ctx, api, 'pair-count', () => {
        equation(ctx, api, 'N(N-1)/2', 1330, 365, 48, themeColors.cyan);
        if (resultComplete('pair-count'))
          equation(ctx, api, '6\\cdot5/2=15', 1330, 460, 46, themeColors.yellow);
        else if (cueVisible(ctx, api, 'pair-count'))
          text(ctx, api, 'Pair count pending', 1330, 460, 31, themeColors.muted, 'center');
        if (resultComplete('pair-calls'))
          text(
            ctx,
            api,
            '15 pairs × 2 orders = 30 calls',
            1330,
            555,
            33,
            themeColors.ink,
            'center',
          );
        if (resultComplete('baseline-result')) {
          equation(ctx, api, 'N-1=5', 1330, 670, 44, themeColors.green);
          text(
            ctx,
            api,
            'One fixed baseline: 5 × 2 = 10 calls',
            1330,
            750,
            30,
            themeColors.green,
            'center',
          );
        } else if (cueVisible(ctx, api, 'baseline-count'))
          text(
            ctx,
            api,
            'Baseline graph and call count pending',
            1330,
            670,
            28,
            themeColors.muted,
            'center',
          );
      });
      if (cueVisible(ctx, api, 'longer-input'))
        withFocus(ctx, api, 'input-budget', () => {
          const calls = (points.length - 1) * 2;
          const sizes = [200, 800];
          sizes.forEach((tokens, i) => {
            const y = 830 + 86 * i;
            text(ctx, api, tokens + ' input tokens/call', 956, y, 28, themeColors.cyan);
            api.line(
              ctx,
              960,
              y + 20,
              960 + (tokens / sizes[1]) * 360,
              y + 20,
              themeColors.cyan,
              6,
            );
            if (resultComplete('input-total'))
              text(ctx, api, calls * tokens + ' tokens in all', 1500, y, 29, themeColors.ink);
          });
        });
      if (cueVisible(ctx, api, 'preference-cycle'))
        withFocus(ctx, api, 'preference-cycle', () =>
          text(
            ctx,
            api,
            'A > B    B > C    C > A  ·  preferences can cycle',
            960,
            1010,
            31,
            themeColors.pink,
            'center',
          ),
        );
    } else {
      panel(
        ctx,
        api,
        'reference-guidance',
        'TASK + SOURCE',
        'DEP-27 requires both actions in order.',
        140,
        330,
        760,
        190,
        themeColors.blue,
      );
      panel(
        ctx,
        api,
        'reference-guidance',
        'REFERENCE ANSWER',
        'Stop rollout, then run rollback.',
        1030,
        330,
        750,
        190,
        themeColors.cyan,
      );
      withFocus(ctx, api, 'reference-guidance', () => {
        text(
          ctx,
          api,
          'Valid paraphrases and alternative solutions still need checking.',
          960,
          650,
          32,
          themeColors.ink,
          'center',
        );
        text(
          ctx,
          api,
          'Prometheus: custom rubrics + reference answers',
          160,
          755,
          29,
          themeColors.cyan,
        );
        text(ctx, api, 'G-Eval: criteria + forms', 160, 820, 29, themeColors.cyan);
        text(
          ctx,
          api,
          'JudgeLM: teacher labels + swap augmentation',
          160,
          885,
          29,
          themeColors.cyan,
        );
      });
      if (cueVisible(ctx, api, 'teacher-boundary'))
        withFocus(ctx, api, 'teacher-boundary', () =>
          text(
            ctx,
            api,
            'Check factual claims against the policy.',
            960,
            980,
            32,
            themeColors.yellow,
            'center',
          ),
        );
    }
  }
}
export default {
  id: 'evaluation-formats',
  draw: drawEvaluationFormats,
  cues: [
    'pointwise-anchors',
    'ordinal-limit',
    'pointwise-one',
    'pointwise-two',
    'pair-lattice',
    'pair-count',
    'pair-calls',
    'preference-cycle',
    'baseline-count',
    'baseline-result',
    'longer-input',
    'input-total',
    'reference-guidance',
    'teacher-boundary',
  ],
};
