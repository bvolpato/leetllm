import { sampleSlimeChapter } from '../construction.mjs';
import { drawSlimeNote, drawSlimeRule, drawSlimeText, drawSlimeTitle } from '../defaults.mjs';
export function drawRoundBoundaries(ctx, scene, state, api) {
  return api.focus.target('sl-round-boundaries-mechanism', () =>
    paintRoundBoundaries(ctx, scene, state, api),
  );
}
function paintRoundBoundaries(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('round-boundaries', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'When can the next round start?');
    const x = 420,
      scale = 70,
      intervals = [
        {
          start: 0,
          end: modelState.grade,
          y: 410,
          color: themeColors.blue,
          name: 'generate + grade',
        },
        {
          start: modelState.grade,
          end: modelState.grade + 3,
          y: 570,
          color: themeColors.cyan,
          name: 'train',
        },
        {
          start: modelState.grade + 3,
          end: modelState.total,
          y: 730,
          color: themeColors.green,
          name: 'sync',
        },
      ];
    intervals.forEach((v) => {
      drawSlimeText(ctx, api, v.name, 145, v.y + 45, 28, v.color);
      const start = x + v.start * scale,
        width = (v.end - v.start) * scale;
      api.rect(ctx, start, v.y, width, 70, themeColors.panel, v.color, 2);
      const shown = Math.max(0, Math.min(modelState.elapsed, v.end) - v.start);
      if (shown > 0) api.rect(ctx, start + 3, v.y + 3, Math.max(1, shown * scale - 6), 64, v.color);
      drawSlimeText(
        ctx,
        api,
        `${v.end - v.start}s`,
        start + width / 2,
        v.y + 117,
        28,
        v.color,
        'center',
      );
    });
    drawSlimeRule(
      ctx,
      api,
      modelState.totalReady
        ? `${modelState.grade} + 3 + 1 = ${modelState.total} seconds before the next round`
        : `Current dependency clock: ${Math.min(modelState.elapsed, modelState.total).toFixed(1)} s`,
      945,
      themeColors.yellow,
      34,
    );
    drawSlimeNote(
      ctx,
      api,
      currentBeat === 1 && modelState.grade === 14
        ? 'The longer test moves the start of training from 8 s to 14 s.'
        : 'Training waits for the graded batch. Weight sync waits for training.',
    );
    return;
  }
}
export default {
  id: 'round-boundaries',
  draw: drawRoundBoundaries,
  cues: [
    'sl-round-boundaries-b0-operation',
    'sl-round-boundaries-b0-s0',
    'sl-round-boundaries-b0-s1',
    'sl-round-boundaries-b0-s2',
    'sl-round-boundaries-b1-operation',
    'sl-round-boundaries-b1-s0',
    'sl-round-boundaries-b1-s1',
    'sl-round-boundaries-b1-s2',
    'sl-round-boundaries-b1-s3',
    'sl-round-boundaries-b2-operation',
    'sl-round-boundaries-b2-s0',
    'sl-round-boundaries-b2-s1',
    'sl-round-boundaries-b2-s2',
  ],
};
