import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBracket, drawLine, drawText } from '../defaults.mjs';
export function drawVadWorksheet(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-vad-worksheet-${i}-${j}`;
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
  const withStageFocus = (name, paint) => api.focus.target(`va-vad-worksheet-${name}`, paint);
  {
    const x0 = 210,
      w = 175,
      base = 615,
      top = 345;
    withStageFocus('frames', () => {
      drawText(ctx, api, 'supplied probability · threshold 0.50', 180, 290, 27, themeColors.cyan);
      drawLine(
        ctx,
        api,
        180,
        base - (base - top) * 0.5,
        1720,
        base - (base - top) * 0.5,
        themeColors.yellow,
        2,
      );
      m.probabilities.forEach((v, i) => {
        const x = x0 + i * w;
        drawText(ctx, api, i, x + 55, 665, 26, themeColors.muted, 'center');
        if (cueVisible(1, 0)) {
          const h = v * (base - top) * Math.max(0, Math.min(1, cueProgress(1, 0) * 8 - i + 1));
          api.rect(
            ctx,
            x,
            base - Math.max(0, h),
            110,
            Math.max(1, h),
            v >= 0.5 ? themeColors.green : themeColors.panel,
            undefined,
            6,
          );
          drawText(
            ctx,
            api,
            v.toFixed(2),
            x + 55,
            325,
            25,
            v >= 0.5 ? themeColors.green : themeColors.muted,
            'center',
          );
        }
      });
      drawText(ctx, api, '20 ms / frame', 1710, 290, 27, themeColors.cyan, 'right');
    });
    withStageFocus('rounding', () => {
      if (currentBeat >= 2) return;
      drawText(ctx, api, 'requested silence / frame duration', 180, 795, 28);
      if (cueVisible(0, 3)) {
        drawText(ctx, api, 'ceil(60 / 20)', 180, 850, 29, themeColors.yellow);
        drawText(ctx, api, 'ceil(61 / 20)', 1020, 850, 29, themeColors.yellow);
      }
      if (cueComplete(0, 4)) {
        drawText(ctx, api, '3 frames = 60 ms', 180, 910, 32, themeColors.green);
        drawText(ctx, api, '4 frames = 80 ms', 1020, 910, 32, themeColors.green);
      }
    });
    withStageFocus('endpoint', () => {
      if (!cueVisible(1, 3)) return;
      drawBracket(
        ctx,
        api,
        x0 + 5 * w,
        x0 + 7 * w + 110,
        695,
        'trailing silence: frames 5–7',
        currentBeat >= 2 ? themeColors.muted : themeColors.yellow,
      );
      if (cueComplete(1, 3))
        drawText(ctx, api, 'end after frame 7', 1330, 785, 28, themeColors.yellow);
    });
    withStageFocus('retained', () => {
      if (cueVisible(1, 1))
        drawBracket(
          ctx,
          api,
          x0 + 2 * w,
          x0 + 4 * w + 110,
          700,
          'speech begins at frame 2',
          themeColors.green,
        );
      if (cueVisible(1, 2)) {
        drawLine(ctx, api, x0, 710, x0 + 110 + w, 710, themeColors.blue, 6);
        drawText(ctx, api, 'pre-roll 0–1', x0, 740, 25, themeColors.blue);
      }
      if (cueVisible(2, 0)) {
        m.trailingFrames.forEach((i) => {
          drawLine(
            ctx,
            api,
            x0 + i * w,
            base + 12,
            x0 + i * w + 110,
            base + 12,
            themeColors.pink,
            5,
          );
        });
      }
      if (cueComplete(2, 1))
        drawText(
          ctx,
          api,
          'Retained 0…4: 5 × 20 = 100 ms',
          960,
          920,
          32,
          themeColors.green,
          'center',
        );
    });
  }
}
export default {
  id: 'vad-worksheet',
  draw: drawVadWorksheet,
  cues: [
    'va-vad-worksheet-0-0',
    'va-vad-worksheet-0-1',
    'va-vad-worksheet-0-2',
    'va-vad-worksheet-0-3',
    'va-vad-worksheet-0-4',
    'va-vad-worksheet-1-0',
    'va-vad-worksheet-1-1',
    'va-vad-worksheet-1-2',
    'va-vad-worksheet-1-3',
    'va-vad-worksheet-2-0',
    'va-vad-worksheet-2-1',
    'va-vad-worksheet-2-2',
    'va-vad-worksheet-2-3',
    'va-vad-worksheet-3-0',
    'va-vad-worksheet-3-1',
    'va-vad-worksheet-3-2',
    'va-vad-worksheet-3-3',
  ],
};
