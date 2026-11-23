import { clamp, mix, motion } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawClockRefresh(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-clock-refresh-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-clock-refresh-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-clock-refresh-mechanism', () => {
    const sync = currentBeat > 0 || resultComplete('sync', 0),
      q = cueProgress('sync', 0),
      gen = currentBeat === 2 && resultComplete('generation', 2);
    drawCell(
      ctx,
      api,
      'Saved wall clock',
      sync ? 'current after sync' : 'snapshot moment',
      180,
      345,
      690,
      sync ? themeColors.green : themeColors.yellow,
    );
    drawCell(
      ctx,
      api,
      'Application timer',
      currentBeat === 1 ? 'rebuild / validate deadline' : 'copied timer state',
      1010,
      345,
      700,
      themeColors.blue,
    );
    drawRectangle(ctx, api, 190, 600, 1500, 150, themeColors.muted);
    drawLine(ctx, api, 250, 705, 1620, 705);
    const x = mix(320, 1510, q);
    drawLine(ctx, api, x, 625, x, 735, themeColors.green);
    drawText(
      ctx,
      api,
      sync ? 'wall time repaired' : 'saved wall time',
      x,
      590,
      27,
      themeColors.green,
      'center',
    );
    if (currentBeat === 1) {
      drawText(ctx, api, 'Certificate / token wall time', 240, 830, 30, themeColors.green);
      drawText(ctx, api, 'Monotonic / application semantics', 1030, 830, 29, themeColors.yellow);
      drawText(
        ctx,
        api,
        'Each required check controls admission',
        350,
        930,
        30,
        themeColors.yellow,
      );
    }
    if (currentBeat === 2) {
      drawCell(
        ctx,
        api,
        'VMClock generation',
        'g3 → g4 notification',
        190,
        810,
        660,
        themeColors.cyan,
      );
      drawCell(
        ctx,
        api,
        'Compatible application',
        gen ? 'copied state rebuilt' : 'notification alone',
        1000,
        810,
        700,
        gen ? themeColors.green : themeColors.yellow,
      );
    }
    drawFooter(ctx, api, 'A clock notification does not rewrite every timer or application value.');
  });
}
export default {
  id: 'clock-refresh',
  draw: drawClockRefresh,
  cues: [
    'sp-clock-refresh-0',
    'sp-clock-refresh-sync',
    'sp-clock-refresh-1',
    'sp-clock-refresh-separate',
    'sp-clock-refresh-2',
    'sp-clock-refresh-generation',
  ],
};
