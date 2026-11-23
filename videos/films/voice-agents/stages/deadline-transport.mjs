import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawCell, drawFooter, drawText } from '../defaults.mjs';
export function drawDeadlineTransport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-deadline-transport-${i}-${j}`;
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
  const withStageFocus = (name, paint) => api.focus.target(`va-deadline-transport-${name}`, paint);
  {
    const xs = [340, 660, 980, 1300],
      labels = ['P1', 'P2 missing', 'P3 arrived', 'P4 arrived'];
    withStageFocus('packets', () => {
      drawText(
        ctx,
        api,
        'Same media units / later arrivals preserved',
        150,
        295,
        30,
        themeColors.cyan,
      );
      labels.forEach((s, i) => {
        drawCell(ctx, api, s, xs[i] - 130, 350, 270, i === 1 ? themeColors.pink : themeColors.cyan);
      });
    });
    withStageFocus('udp-slots', () => {
      drawText(ctx, api, 'deadline-aware media', 150, 530, 30, themeColors.green);
      xs.forEach((x, i) => {
        drawBox(ctx, api, x - 130, 570, 270, 70, i === 1 ? themeColors.yellow : themeColors.green);
        const q = cueProgress(0, 0);
        if (q > i / 4)
          drawText(
            ctx,
            api,
            i === 1 ? 'conceal' : 'play',
            x,
            615,
            28,
            i === 1 ? themeColors.yellow : themeColors.green,
            'center',
          );
      });
    });
    withStageFocus('ordered-bytes', () => {
      if (!cueVisible(1, 0)) return;
      drawText(ctx, api, 'article TCP byte stream', 150, 755, 30, themeColors.blue);
      xs.forEach((x, i) => {
        drawBox(ctx, api, x - 130, 795, 270, 70, themeColors.blue);
        if (i < 2 || cueVisible(1, 1))
          drawText(
            ctx,
            api,
            i === 0 ? 'deliver' : i === 1 ? 'lost range' : 'held behind gap',
            x,
            840,
            26,
            i === 0 ? themeColors.green : themeColors.yellow,
            'center',
          );
      });
    });
    drawFooter(
      ctx,
      api,
      'Inspect negotiated transport and recovery deadline; names alone do not specify loss behavior.',
    );
  }
}
export default {
  id: 'deadline-transport',
  draw: drawDeadlineTransport,
  cues: [
    'va-deadline-transport-0-0',
    'va-deadline-transport-0-1',
    'va-deadline-transport-0-2',
    'va-deadline-transport-1-0',
    'va-deadline-transport-1-1',
    'va-deadline-transport-1-2',
    'va-deadline-transport-1-3',
    'va-deadline-transport-2-0',
    'va-deadline-transport-2-1',
    'va-deadline-transport-2-2',
    'va-deadline-transport-2-3',
  ],
};
