import { LINEAR_STATES } from '../fixtures.mjs';
import { drawLegacyCard, drawLegacyFooter, drawLegacyText, withLegacyFocus } from '../defaults.mjs';
export function drawLinearState(ctx, scene, state, api) {
  api.focus.target('linear-state-mechanism', () => {
    const finished = (key) => api.focus.progress('reason-result-' + key, 0) === 1;
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
      const sampledIndex = Math.min(
        3,
        beat + Number(finished(['linear-subtract', 'linear-add', 'linear-final'][beat])),
      );
      const sampled = LINEAR_STATES[sampledIndex];
      const states = [
        withLegacyFocus(ctx, api, 'linear-state-object-start-4-5-6-7-8', () =>
          drawLegacyCard(
            ctx,
            api,
            'Start\n4 · 5 · 6 · 7',
            130,
            430,
            370,
            sampledIndex === 0
              ? themeColors.yellow
              : sampledIndex > 0
                ? themeColors.green
                : themeColors.blue,
            145,
            31,
          ),
        ),
        withLegacyFocus(ctx, api, 'linear-after-subtraction', () =>
          drawLegacyCard(
            ctx,
            api,
            sampledIndex >= 1 ? 'After 6 − 4\n2 · 5 · 7' : 'After 6 − 4\nResult pending',
            575,
            430,
            370,
            sampledIndex === 1
              ? themeColors.yellow
              : sampledIndex > 1
                ? themeColors.green
                : themeColors.muted,
            145,
            31,
          ),
        ),
        withLegacyFocus(ctx, api, 'linear-after-addition', () =>
          drawLegacyCard(
            ctx,
            api,
            sampledIndex >= 2 ? 'After 5 + 7\n2 · 12' : 'After 5 + 7\nResult pending',
            1020,
            430,
            370,
            sampledIndex === 2
              ? themeColors.yellow
              : sampledIndex > 2
                ? themeColors.green
                : themeColors.muted,
            145,
            31,
          ),
        ),
        withLegacyFocus(ctx, api, 'linear-final-product', () =>
          drawLegacyCard(
            ctx,
            api,
            sampledIndex >= 3
              ? 'After 2 × 12\n24'
              : sampledIndex >= 2
                ? 'After 2 × 12\nResult pending'
                : 'Final multiplication\nResult pending',
            1465,
            430,
            330,
            sampledIndex === 3 ? themeColors.green : themeColors.muted,
            145,
            31,
          ),
        ),
      ];
      states.forEach((shape, index) => {
        const complete = index < sampledIndex;
        if (index < states.length - 1)
          route(
            shape,
            states[index + 1],
            [themeColors.cyan, themeColors.yellow, themeColors.green][index],
            complete ? 1 : index === sampledIndex ? q : 0,
            complete || index === sampledIndex ? 1 : 0,
          );
      });
      drawLegacyText(ctx, api, sampled.move, 960, 700, 39, themeColors.yellow, 'center');
      drawLegacyText(
        ctx,
        api,
        `Checked values remaining: ${sampled.remaining.join(' · ')}`,
        960,
        790,
        34,
        themeColors.ink,
        'center',
      );
      drawLegacyFooter(
        ctx,
        api,
        'The written state exposes both the useful subtotal and its lineage',
      );
    }
  });
}
export default {
  id: 'linear-state',
  draw: drawLinearState,
  cues: [
    'linear-first-subtraction',
    'linear-state-beat-1-focus-1',
    'reason-result-linear-subtract',
    'linear-state-beat-2-focus-1',
    'reason-result-linear-add',
    'linear-state-beat-3-focus-1',
    'reason-result-linear-final',
  ],
};
