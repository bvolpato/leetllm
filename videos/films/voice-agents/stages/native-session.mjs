import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawTag, drawText } from '../defaults.mjs';
export function drawNativeSession(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-native-session-${i}-${j}`;
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
  const withStageFocus = (name, paint) => api.focus.target(`va-native-session-${name}`, paint);
  {
    withStageFocus('event-stream', () => {
      drawText(ctx, api, 'Supplied event replay', 150, 300, 30, themeColors.blue);
      ['audio +160 ms', 'ACK 160 ms', 'audio +220 ms', 'tool proposal'].forEach((s, i) => {
        const q = Math.max(0, Math.min(1, cueProgress(0, 1) * 4 - i));
        if (i === 3) {
          withStageFocus('tool-proposal', () => {
            if (cueVisible(1, 1)) {
              drawTag(ctx, api, 'send_incident_link', 150 + i * 390, 350, 365, themeColors.yellow);
              if (!cueVisible(2, 3))
                drawText(ctx, api, 'proposal only', 1450, 470, 24, themeColors.yellow);
            }
          });
        } else if (q > 0)
          drawTag(
            ctx,
            api,
            s,
            150 + i * 390,
            350,
            365,
            i === 1 ? themeColors.green : themeColors.cyan,
          );
      });
    });
    withStageFocus('audio-counters', () => {
      drawText(ctx, api, 'received', 150, 540, 30, themeColors.cyan);
      drawBox(ctx, api, 150, 575, 1140, 74, themeColors.cyan);
      api.rect(
        ctx,
        150,
        575,
        (160 + 220 * cueProgress(0, 2)) * 3,
        74,
        themeColors.cyan,
        undefined,
        8,
      );
      drawText(ctx, api, 'confirmed', 150, 720, 30, themeColors.green);
      drawBox(ctx, api, 150, 755, 1140, 74, themeColors.green);
      api.rect(ctx, 150, 755, 480, 74, themeColors.green, undefined, 8);
      if (cueComplete(0, 2)) {
        drawText(ctx, api, '380 ms', 1400, 625, 34, themeColors.cyan);
        drawText(ctx, api, '160 ms', 1400, 805, 34, themeColors.green);
      }
      if (cueComplete(0, 3))
        drawText(ctx, api, '220 ms not yet confirmed', 1400, 900, 29, themeColors.yellow, 'center');
    });
    withStageFocus('parts', () => {
      if (cueVisible(1, 0)) {
        drawText(ctx, api, 'transcript ≠ confirmed shared speech', 150, 910, 28, themeColors.muted);
      }
      if (cueVisible(2, 1) && !cueVisible(2, 3)) {
        drawTag(
          ctx,
          api,
          'multipart: audio + transcript + control',
          150,
          445,
          1250,
          themeColors.yellow,
        );
      }
    });
    withStageFocus('documentation-date', () => {
      if (cueVisible(2, 0))
        drawText(ctx, api, 'Docs: 2026-11-07', 1700, 300, 25, themeColors.blue, 'right');
    });
    withStageFocus('scheduling', () => {
      if (cueVisible(2, 3)) {
        drawTag(ctx, api, '3.8 Live: nonblocking', 150, 445, 650, themeColors.cyan);
        drawTag(
          ctx,
          api,
          '3.1 Flash Live Preview: waits for tool',
          850,
          445,
          850,
          themeColors.yellow,
        );
      }
    });
  }
}
export default {
  id: 'native-session',
  draw: drawNativeSession,
  cues: [
    'va-native-session-0-0',
    'va-native-session-0-1',
    'va-native-session-0-2',
    'va-native-session-0-3',
    'va-native-session-1-0',
    'va-native-session-1-1',
    'va-native-session-1-2',
    'va-native-session-2-0',
    'va-native-session-2-1',
    'va-native-session-2-2',
    'va-native-session-2-3',
  ],
};
