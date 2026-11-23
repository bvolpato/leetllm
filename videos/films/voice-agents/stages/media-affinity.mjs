import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawFooter, drawText } from '../defaults.mjs';
export function drawMediaAffinity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-media-affinity-${i}-${j}`;
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
  const withStageFocus = (name, paint) => api.focus.target(`va-media-affinity-${name}`, paint);
  {
    withStageFocus('owner', () => {
      drawText(ctx, api, 'call-alex-4219 · fixed three-worker set', 150, 290, 30, themeColors.blue);
      ['media-a', 'media-b', 'media-c'].forEach((s, i) => {
        drawBox(
          ctx,
          api,
          150 + i * 540,
          500,
          450,
          220,
          i === 2 ? themeColors.green : themeColors.muted,
        );
        drawText(
          ctx,
          api,
          s,
          175 + i * 540,
          555,
          31,
          i === 2 ? themeColors.green : themeColors.muted,
        );
        if (i === 2) {
          drawText(
            ctx,
            api,
            cueVisible(2, 0) ? 'DTLS / SRTP unavailable' : 'DTLS / SRTP',
            175 + i * 540,
            615,
            26,
            cueVisible(2, 0) ? themeColors.pink : themeColors.cyan,
          );
          drawText(
            ctx,
            api,
            cueVisible(2, 0) ? 'buffer / cursor: recover' : 'jitter buffer / cursor',
            175 + i * 540,
            670,
            26,
            cueVisible(2, 0) ? themeColors.pink : themeColors.cyan,
          );
        }
      });
    });
    withStageFocus('packet-routing', () => {
      for (let i = 0; i < 4; i++) {
        const q = Math.min(1, Math.max(0, cueProgress(1, 0) * 4 - i));
        const x = 220 + (1410 - 220) * q,
          y = 360 + i * 20;
        drawBox(ctx, api, x, y, 55, 35, themeColors.cyan, themeColors.cyan);
      }
      if (cueComplete(1, 0))
        drawText(ctx, api, 'P1, P2, P3, P4 → media-c', 960, 815, 36, themeColors.green, 'center');
    });
    withStageFocus('recovery', () => {
      if (cueVisible(2, 0)) {
        drawBox(
          ctx,
          api,
          1218,
          488,
          474,
          244,
          themeColors.pink,
          themeColors.transparent ?? '#00000000',
        );
        drawText(
          ctx,
          api,
          'owner lost → reconnect + rebuild',
          960,
          900,
          34,
          themeColors.pink,
          'center',
        );
      }
    });
    drawFooter(
      ctx,
      api,
      'Fixed-set affinity demonstration · transcript text does not recreate media cryptographic state.',
    );
  }
}
export default {
  id: 'media-affinity',
  draw: drawMediaAffinity,
  cues: [
    'va-media-affinity-0-0',
    'va-media-affinity-0-1',
    'va-media-affinity-0-2',
    'va-media-affinity-1-0',
    'va-media-affinity-1-1',
    'va-media-affinity-1-2',
    'va-media-affinity-1-3',
    'va-media-affinity-2-0',
    'va-media-affinity-2-1',
    'va-media-affinity-2-2',
  ],
};
