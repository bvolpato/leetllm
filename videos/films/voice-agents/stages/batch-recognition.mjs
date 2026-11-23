import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBracket, drawFooter, drawLine, drawTag, drawText } from '../defaults.mjs';
export function drawBatchRecognition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-batch-recognition-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueProgress = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after'
        ? 1
        : c.phase === 'before'
          ? 0
          : c.progress
      : currentBeat > i
        ? 1
        : currentBeat < i
          ? 0
          : beatProgress;
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-batch-recognition-${name}`, paint);
  {
    const x = (t) => 200 + t * 0.72;
    withStageFocus('batch', () => {
      drawLine(ctx, api, x(0), 470, x(2000), 470);
      const spans = [
        ['utterance', 0, 1200, themeColors.blue],
        ['endpoint wait', 1200, 1500, themeColors.yellow],
        ['recognize', 1500, 1950, themeColors.cyan],
      ];
      spans.forEach(([s, a, z, c], i) => {
        const q = Math.max(0, Math.min(1, cueProgress(0, 1) * 3 - i));
        api.rect(ctx, x(a), 385, Math.max(1, (z - a) * 0.72 * q), 60, c, undefined, 8);
        drawText(ctx, api, s, (x(a) + x(z)) / 2, 350, 27, c, 'center');
        drawText(ctx, api, a, x(a), 520, 25, themeColors.muted, 'center');
      });
      if (cueComplete(0, 2))
        drawText(ctx, api, 'transcript at 1950 ms', x(1950), 595, 30, themeColors.green, 'right');
    });
    withStageFocus('post-speech', () => {
      if (cueVisible(0, 2))
        drawBracket(
          ctx,
          api,
          x(1200),
          x(1950),
          660,
          cueComplete(0, 2) ? '1950 − 1200 = 750 ms' : 'post-speech transcript wait',
          themeColors.yellow,
        );
    });
    withStageFocus('downstream', () => {
      if (cueVisible(1, 1)) {
        drawTag(ctx, api, 'generation', 250, 810, 360, themeColors.yellow);
        drawTag(ctx, api, 'synthesis', 740, 810, 360, themeColors.green);
        drawTag(ctx, api, 'playback', 1230, 810, 360, themeColors.pink);
      }
    });
    drawFooter(ctx, api, 'Transcript ready ≠ first assistant sound played.');
  }
}
export default {
  id: 'batch-recognition',
  draw: drawBatchRecognition,
  cues: [
    'va-batch-recognition-0-0',
    'va-batch-recognition-0-1',
    'va-batch-recognition-0-2',
    'va-batch-recognition-1-0',
    'va-batch-recognition-1-1',
    'va-batch-recognition-1-2',
    'va-batch-recognition-1-3',
  ],
};
