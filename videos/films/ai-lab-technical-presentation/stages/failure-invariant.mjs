import { cueDone, cueProgress } from '../construction.mjs';
import { chapterText, focusTargets, footer, panel } from '../defaults.mjs';
export function drawFailureInvariant(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    chapterText(
      ctx,
      api,
      'req-42 · source-8 · tenant authorization retained',
      960,
      285,
      29,
      themeColors.blue,
      'center',
    );
    const first = cueProgress(state, 'cursor-first', 1, 0.1),
      repeat = cueProgress(state, 'cursor-repeat', 1, 0.35),
      stop = cueDone(state, 'cursor-stop', 1, 0.65);
    chapterText(ctx, api, 'Source responses', 160, 415, 30, themeColors.blue);
    chapterText(ctx, api, 'Seen set', 1120, 415, 30, themeColors.cyan);
    api.line(ctx, 140, 445, 860, 445, themeColors.muted, 2);
    api.line(ctx, 1100, 445, 1770, 445, themeColors.muted, 2);
    if (first >= 0.999) panel(ctx, api, 1100, 465, 670, 175, themeColors.cyan);
    focusTargets(ctx, api, ['cursor-empty', 'cursor-first', 'cursor-repeat'], () => {
      chapterText(
        ctx,
        api,
        first > 0 ? 'page 1 → C-17' : 'page 1 awaiting response',
        190,
        520,
        32,
        first ? themeColors.blue : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        repeat > 0 ? 'page 2 → C-17' : 'page 2 awaiting response',
        190,
        670,
        32,
        repeat ? themeColors.pink : themeColors.muted,
      );
      if (first > 0) {
        const x = api.lerp(620, 1190, first),
          y = api.lerp(495, 550, first);
        panel(ctx, api, x, y, 260, 75, themeColors.cyan);
        chapterText(ctx, api, 'C-17', x + 130, y + 48, 32, themeColors.cyan, 'center');
      } else chapterText(ctx, api, '{}', 1420, 610, 52, themeColors.muted, 'center');
      if (repeat > 0) {
        const x = api.lerp(620, 1190, repeat),
          y = api.lerp(645, 690, repeat);
        panel(ctx, api, x, y, 260, 75, themeColors.pink);
        chapterText(ctx, api, 'C-17', x + 130, y + 48, 32, themeColors.pink, 'center');
        chapterText(
          ctx,
          api,
          'Candidate repeats · not inserted',
          1435,
          810,
          28,
          themeColors.pink,
          'center',
        );
      }
    });
    focusTargets(ctx, api, ['cursor-stop'], () =>
      chapterText(
        ctx,
        api,
        stop
          ? 'INCOMPLETE · stop before request 3'
          : 'Each returned nonterminal cursor must be new',
        960,
        920,
        34,
        stop ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Specific regression fixture + captured trace · workload reliability remains separate'
        : 'Terminal null completes · a repeated earlier identity stops with incomplete status',
    );
  }
}
export default {
  id: 'failure-invariant',
  draw: drawFailureInvariant,
  cues: ['cursor-empty', 'cursor-first', 'cursor-repeat', 'cursor-stop'],
};
