import { LOGITS, WORDS } from '../fixtures.mjs';
import { drawText, header, target, withSoftmaxOriginalFrame } from '../defaults.mjs';
export function paintSoftmaxOriginalScores(
  ctx,
  scene,
  state,
  api,
  C,
  b,
  p,
  cues,
  colors,
  xs,
  amount,
  starts,
) {
  const offset =
    b === 0 ? 0 : b === 1 ? 1000 * amount('score-offset') : 1000 * (1 - amount('score-restore'));
  header(ctx, api, C, 'Same gaps, a different shared baseline');
  const left = 620,
    scale = 270,
    top = 420;
  for (let i = 0; i <= 3; i++) {
    const x = left + i * scale;
    api.line(ctx, x, top - 15, x, top + 15, C.muted, 2);
    drawText(ctx, api, C, (offset + i).toFixed(1), x, top - 45, 31, C.muted, 'center');
  }
  api.line(ctx, left, top, left + 3 * scale, top, C.muted, 3);
  WORDS.forEach((word, i) => {
    const y = 530 + i * 115,
      x = left + LOGITS[i] * scale;
    drawText(ctx, api, C, word, 360, y + 12, 39, colors[i]);
    api.circle(ctx, x, y, 13, colors[i]);
    drawText(ctx, api, C, (LOGITS[i] + offset).toFixed(1), x + 30, y + 12, 33, colors[i]);
  });
  if (b > 0 || starts('score-gaps'))
    target(ctx, api, 'score-gaps', () => {
      api.line(ctx, left + scale, 870, left + 3 * scale, 870, C.yellow, 6);
      api.line(ctx, left, 915, left + scale, 915, C.pink, 6);
      drawText(ctx, api, C, 'ran − slept = 2', left + 2 * scale, 850, 30, C.yellow, 'center');
      drawText(ctx, api, C, 'slept − ate = 1', left + 0.5 * scale, 965, 29, C.pink, 'center');
    });
  target(ctx, api, 'shared-logit-offset', () =>
    drawText(ctx, api, C, 'Shared offset: +' + offset.toFixed(1), 960, 1040, 31, C.cyan, 'center'),
  );
}
export function drawScoresStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalScores);
}
export default {
  id: 'scores',
  draw: drawScoresStage,
  cues: ['score-gaps', 'score-offset', 'score-restore'],
};
