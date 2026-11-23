import { interruptedBudget } from '../arithmetic.mjs';
import { cueDone, cueProgress } from '../construction.mjs';
import { chapterText, focusTargets, footer, panel } from '../defaults.mjs';
export function drawInterruptedRehearsal(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const z = interruptedBudget(),
      x = 250,
      scale = 95,
      y = 430,
      question = cueProgress(state, 'talk-question', 0, 0.25),
      repaired = cueDone(state, 'talk-repair', 1, 0.5),
      parts = currentBeat === 0 ? z.old : z.replacement;
    chapterText(
      ctx,
      api,
      '15-minute rehearsal fixture · questions share the slot',
      960,
      285,
      32,
      themeColors.blue,
      'center',
    );
    api.line(ctx, x, y + 100, x + 15 * scale, y + 100, themeColors.muted, 2);
    focusTargets(ctx, api, ['talk-question'], () =>
      [
        [0, 2, 'context', themeColors.blue],
        [2, 6, 'path', themeColors.cyan],
        [6, 6 + 3 * question, 'questions', themeColors.purple],
      ].forEach(([start, end, label, color]) => {
        if (end > start) {
          api.rect(ctx, x + start * scale, y, (end - start) * scale - 4, 75, color, undefined, 0);
          chapterText(
            ctx,
            api,
            label,
            x + ((start + end) * scale) / 2,
            y + 125,
            26,
            color,
            'center',
          );
        }
      }),
    );
    api.line(ctx, x + 15 * scale, y - 25, x + 15 * scale, y + 170, themeColors.yellow, 3);
    chapterText(ctx, api, '15', x + 15 * scale, y - 45, 28, themeColors.yellow, 'center');
    focusTargets(ctx, api, ['talk-remaining', 'talk-overflow', 'talk-repair'], () => {
      const start = 9;
      let offset = start;
      const colors = [themeColors.cyan, themeColors.green, themeColors.muted];
      parts.forEach((value, i) => {
        panel(ctx, api, x + offset * scale, 710, value * scale - 4, 85, colors[i]);
        chapterText(
          ctx,
          api,
          String(value),
          x + (offset + value / 2) * scale,
          765,
          32,
          colors[i],
          'center',
        );
        offset += value;
      });
      if (currentBeat === 0) {
        chapterText(
          ctx,
          api,
          cueDone(state, 'talk-remaining', 0, 0.4) ? '6 minutes remain' : 'remaining time?',
          960,
          640,
          35,
          themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          cueDone(state, 'talk-overflow', 0, 0.6)
            ? 'Original 3 + 3 + 1 = 7 · exceeds remaining 6'
            : 'Original continuation: decision + evidence + limits',
          960,
          900,
          33,
          themeColors.pink,
          'center',
        );
      } else {
        chapterText(
          ctx,
          api,
          repaired
            ? '2 + 3 + 1 = 6 · fits the remaining slot'
            : 'Reallocate decision, evidence and limits',
          960,
          900,
          35,
          repaired ? themeColors.green : themeColors.yellow,
          'center',
        );
      }
    });
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'The 90-second version retains the same argument · appendix follows the actual question'
        : 'A question changes the order and budget; it does not require speaking faster',
    );
  }
}
export default {
  id: 'interrupted-rehearsal',
  draw: drawInterruptedRehearsal,
  cues: ['talk-question', 'talk-remaining', 'talk-overflow', 'talk-repair'],
};
