import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header } from '../defaults.mjs';
export function drawCanaryController(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('canary-controller', state),
    currentBeat = modelState.beat;
  return api.focus.target('sd-canary-controller-mechanism', () => {
    if (currentBeat === 2) {
      header(ctx, api, 'What did the error-rate field actually contain?');
      chapterCard(ctx, api, 'False', 235, 409, 650, themeColors.yellow, 130, 48);
      chapterCard(ctx, api, '0.011', 1035, 409, 650, themeColors.blue, 130, 48);
      chapterText(ctx, api, 'Boolean', 560, 624, 40, themeColors.yellow, 'center');
      chapterText(ctx, api, 'Measured rate · 1.1%', 1360, 624, 40, themeColors.blue, 'center');
      chapterText(ctx, api, 'Reject the field', 560, 720, 34, themeColors.ink, 'center');
      chapterText(ctx, api, 'Hold · exceeds 1% limit', 1360, 720, 34, themeColors.ink, 'center');
      footer(ctx, api, 'Record the candidate, time window and sample count');
      return;
    }
    header(ctx, api, 'Each row is a separate fresh candidate window');
    modelState.cases.forEach((r, i) => {
      const selected = i === modelState.index,
        color = selected
          ? i === 0
            ? themeColors.pink
            : i === 1
              ? themeColors.green
              : themeColors.yellow
          : themeColors.muted;
      chapterCard(
        ctx,
        api,
        `Window ${i + 1}: error ${r.error ?? '?'} · p95 ${r.latency ?? '?'} ms · leaks ${r.leaks}`,
        200,
        390 + i * 160,
        1520,
        color,
        100,
        29,
      );
      if (selected && modelState.done)
        chapterText(ctx, api, modelState.decision.toUpperCase(), 960, 900, 40, color, 'center');
    });
    footer(ctx, api, 'Error limit · 1%     Latency limit · 900 ms at p95');
  });
}
export default {
  id: 'canary-controller',
  draw: drawCanaryController,
  cues: [
    'sd-canary-controller-0-operation',
    'sd-canary-controller-0-result',
    'sd-canary-controller-1-operation',
    'sd-canary-controller-1-result',
    'sd-canary-controller-2-operation',
    'sd-canary-controller-2-result',
  ],
};
