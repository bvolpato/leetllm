import { voiceWorksheet } from '../arithmetic.mjs';
import { drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawPcmContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-pcm-contract-${i}-${j}`;
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
  const withStageFocus = (name, paint) => api.focus.target(`va-pcm-contract-${name}`, paint);
  {
    const wrong = cueVisible(1, 2),
      duration = wrong ? 20 + 10 * cueProgress(1, 2) : 20;
    withStageFocus('samples', () => {
      drawText(ctx, api, '480 actual mono sample frames', 150, 300, 31, themeColors.cyan);
      for (let i = 0; i < 480; i++) {
        const x = 160 + i * 3.1;
        const h = (0.35 + 0.65 * Math.abs(Math.sin(i * 0.07))) * 90;
        drawLine(ctx, api, x, 470 - h / 2, x, 470 + h / 2, themeColors.cyan, 1.2);
      }
      drawText(ctx, api, 'sample values stay fixed', 150, 565, 29, themeColors.muted);
    });
    withStageFocus('rate-duration', () => {
      drawText(
        ctx,
        api,
        wrong && !cueComplete(1, 2)
          ? 'change 24,000 → 16,000 Hz'
          : wrong
            ? 'read at 16,000 Hz'
            : 'read at 24,000 Hz',
        150,
        650,
        32,
        wrong ? themeColors.pink : themeColors.green,
      );
      drawLine(
        ctx,
        api,
        150,
        720,
        150 + duration * 45,
        720,
        wrong ? themeColors.pink : themeColors.green,
        7,
      );
      if (cueComplete(1, 1))
        drawText(
          ctx,
          api,
          wrong && !cueComplete(1, 2)
            ? 'changing playback rate…'
            : wrong
              ? '480 / 16,000 × 1000 = 30 ms'
              : '480 / 24,000 × 1000 = 20 ms',
          150,
          785,
          33,
          wrong ? themeColors.pink : themeColors.green,
        );
    });
    withStageFocus('bytes', () => {
      if (cueVisible(2, 0)) {
        drawText(ctx, api, '16-bit mono → 2 bytes / sample', 150, 885, 30, themeColors.yellow);
      }
      if (cueComplete(2, 2))
        drawText(
          ctx,
          api,
          '320 → 640 bytes     480 → 960 bytes',
          1720,
          885,
          30,
          themeColors.yellow,
          'right',
        );
    });
    drawFooter(
      ctx,
      api,
      'Relabeling sample rate changes interpretation; resampling changes actual samples.',
    );
  }
}
export default {
  id: 'pcm-contract',
  draw: drawPcmContract,
  cues: [
    'va-pcm-contract-0-0',
    'va-pcm-contract-0-1',
    'va-pcm-contract-0-2',
    'va-pcm-contract-0-3',
    'va-pcm-contract-1-0',
    'va-pcm-contract-1-1',
    'va-pcm-contract-1-2',
    'va-pcm-contract-1-3',
    'va-pcm-contract-2-0',
    'va-pcm-contract-2-1',
    'va-pcm-contract-2-2',
    'va-pcm-contract-2-3',
  ],
};
