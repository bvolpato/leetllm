import { drawLegacyCard, drawLegacyFooter, drawLegacyText, withLegacyFocus } from '../defaults.mjs';
export function drawChooseTheController(ctx, scene, state, api) {
  api.focus.target('choose-the-controller-mechanism', () => {
    const { C: themeColors, phase, teaching: teaching } = api;
    const beat = state.beat ?? 0,
      progress2 = state.beatP ?? 0,
      q = phase(progress2, 0.05, 0.9);
    const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 6) =>
      teaching.transfer({
        source: {
          shape: from,
          opacity,
        },
        target: {
          shape: to,
          opacity,
        },
        color,
        progress,
        width: 3,
        gap: 12,
        margin: 2,
        particle: {
          radius,
          fill: color,
        },
      });
    {
      const strategies = [
        ['Structured facts', 'policy code', themeColors.blue],
        ['Dependent questions', 'linear steps', themeColors.cyan],
        ['Canonical short answers', 'sample + vote', themeColors.yellow],
        ['Verifiable branches', 'bounded search', themeColors.green],
      ];
      withLegacyFocus(ctx, api, 'choose-the-controller-simulation-48', () =>
        strategies.forEach(([task, method, color], index) => {
          const y = 300 + index * 145;
          const left = drawLegacyCard(ctx, api, task, 180, y, 650, color, 100, 29);
          const right = drawLegacyCard(ctx, api, method, 1110, y, 650, color, 100, 29);
          route(left, right, color, q);
        }),
      );
      drawLegacyText(
        ctx,
        api,
        'Compare on held-out cases with one trusted task evaluator',
        960,
        905,
        31,
        themeColors.ink,
        'center',
      );
      drawLegacyFooter(
        ctx,
        api,
        'Track correctness, abstention, latency, and the cost of each method',
      );
    }
  });
}
export default {
  id: 'choose-the-controller',
  draw: drawChooseTheController,
  cues: [
    'choose-the-controller-beat-1-focus-1',
    'choose-the-controller-beat-2-focus-1',
    'choose-the-controller-beat-3-focus-1',
  ],
};
