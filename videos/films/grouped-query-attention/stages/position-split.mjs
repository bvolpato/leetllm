import { chapterModel } from '../construction.mjs';
import { chapterText, note, operation } from '../defaults.mjs';
export function drawPositionSplit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('position-split', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    const visible = state.cues
      ? api.focus.progress('position-rotated-result', 0) > 0.8
      : progress > 0.85;
    const turn = state.cues ? api.focus.progress('position-rotate', 0) : progress,
      angle = currentBeat === 0 ? 0 : currentBeat === 1 ? (turn * Math.PI) / 2 : Math.PI / 2,
      cx = 590,
      cy = 625,
      scale = 48,
      x = 5 * Math.cos(angle) - 2 * Math.sin(angle),
      yy = 5 * Math.sin(angle) + 2 * Math.cos(angle);
    api.line(ctx, cx - 300, cy, cx + 300, cy, themeColors.muted, 2);
    api.line(ctx, cx, cy - 300, cx, cy + 280, themeColors.muted, 2);
    api.circle(ctx, cx, cy, Math.hypot(5, 2) * scale, 'transparent', themeColors.muted, 2);
    api.arrow(ctx, cx, cy, cx + x * scale, cy - yy * scale, themeColors.blue, 6);
    api.arrow(ctx, cx, cy, cx + scale, cy, themeColors.yellow, 5);
    chapterText(ctx, api, 'fixed query [1, 0]', 1390, 390, 36, themeColors.yellow);
    chapterText(ctx, api, 'same latent [1, 2]', 1390, 500, 34, themeColors.blue);
    operation(ctx, api, 'position-split', () =>
      chapterText(
        ctx,
        api,
        currentBeat === 0
          ? 'identity score: 5'
          : visible || currentBeat === 2
            ? 'rotated score: −2'
            : 'Predict the rotated score',
        1390,
        660,
        44,
        currentBeat === 0 ? themeColors.ink : themeColors.green,
      ),
    );
    chapterText(
      ctx,
      api,
      currentBeat === 0
        ? 'absorbed query [1, 2]'
        : visible || currentBeat === 2
          ? 'absorbed query [0, −1]'
          : 'cached position changes the rotation',
      1390,
      800,
      31,
      themeColors.muted,
    );
    if (currentBeat === 2) {
      api.rect(ctx, 1110, 865, 210, 55, themeColors.panel, themeColors.blue, 2);
      api.rect(ctx, 1380, 865, 210, 55, themeColors.panel, themeColors.yellow, 2);
      chapterText(ctx, api, 'content', 1215, 902, 28, themeColors.blue);
      chapterText(ctx, api, 'position', 1485, 902, 28, themeColors.yellow);
    }
    note(
      ctx,
      api,
      'Associativity holds; history-position dependence prevents one absorbed query for rotated expanded keys',
    );
  }
}
export default {
  id: 'position-split',
  draw: drawPositionSplit,
  cues: [
    'position-split-0',
    'position-split-1',
    'position-rotated-result',
    'position-rotate',
    'position-split-2',
  ],
};
