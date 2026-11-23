import { clamp, motion } from '../arithmetic.mjs';
import { drawFooter, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawGroupBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-group-budget-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-group-budget-' + name);
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
  api.focus.target('sp-group-budget-mechanism', () => {
    const q =
        currentBeat === 0
          ? cueProgress('shared', 0)
          : currentBeat === 1
            ? cueProgress('spend', 1)
            : 1,
      spent = currentBeat === 0 ? Math.round(100000 * q) : Math.round(60000 * q);
    drawText(
      ctx,
      api,
      currentBeat === 0
        ? 'One cgroup period / one shared CPU-time quota'
        : 'New supplied period / same shared group quota',
      180,
      290,
      32,
      themeColors.yellow,
    );
    drawText(
      ctx,
      api,
      'cpu.max = 100000 100000 microseconds',
      180,
      370,
      32,
      themeColors.cyan,
      'left',
      'mono',
    );
    drawRectangle(ctx, api, 180, 480, 1500, 110, themeColors.cyan);
    if (currentBeat === 0) {
      for (let i = 0; i < 4; i++) {
        const v = clamp(q * 4 - i);
        if (v > 0)
          drawRectangle(
            ctx,
            api,
            180 + i * 375,
            480,
            375 * v,
            110,
            [themeColors.blue, themeColors.green, themeColors.yellow, themeColors.pink][i],
            [themeColors.blue, themeColors.green, themeColors.yellow, themeColors.pink][i],
          );
      }
      drawText(
        ctx,
        api,
        'All thread spending sums in one group allowance',
        190,
        665,
        32,
        themeColors.blue,
      );
    } else {
      drawRectangle(
        ctx,
        api,
        180,
        480,
        (1500 * spent) / 100000,
        110,
        themeColors.blue,
        themeColors.blue,
      );
      drawText(ctx, api, 'Thread A spent ' + spent + ' μs', 190, 665, 32, themeColors.blue);
      if (currentBeat > 1 || resultComplete('spend', 1))
        drawText(
          ctx,
          api,
          'Group remaining ' + (100000 - spent) + ' μs',
          1030,
          665,
          32,
          themeColors.green,
        );
    }
    ['A', 'B', 'C', 'D'].forEach((n, i) => {
      drawRectangle(ctx, api, 220 + i * 390, 765, 260, 100, themeColors.blue);
      drawText(ctx, api, 'Thread ' + n, 250 + i * 390, 830, 30, themeColors.blue);
      drawLine(ctx, api, 350 + i * 390, 750, 350 + i * 390, 720, themeColors.muted);
    });
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        'memory.max → guest + VMM; host and guest task limits differ',
        180,
        935,
        29,
        themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Four threads spend this one allowance; each does not receive another quota.',
    );
  });
}
export default {
  id: 'group-budget',
  draw: drawGroupBudget,
  cues: [
    'sp-group-budget-0',
    'sp-group-budget-shared',
    'sp-group-budget-1',
    'sp-group-budget-spend',
    'sp-group-budget-2',
    'sp-group-budget-memory',
  ],
};
