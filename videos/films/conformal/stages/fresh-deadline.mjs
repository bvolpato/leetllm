import { clamp } from '../construction.mjs';
import { freshDeadlineState } from '../model.mjs';
import { axis, caption, dot, equation, intervalRow, line, panel, text } from '../defaults.mjs';
export function drawFreshDeadline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const s = freshDeadlineState(currentBeat, progress, cues),
      pl = axis(
        ctx,
        api,
        [35, 65],
        690,
        'fresh response · milliseconds',
        [35, 40, 45, 50, 55, 60, 65],
      );
    for (let i = 0; i < 19; i++) {
      const x = 190 + i * 80;
      panel(ctx, api, x, 290, 66, 77, () => {
        text(ctx, api, i + 1, x + 33, 316, 18, themeColors.muted, 'center');
        text(
          ctx,
          api,
          i < 17 ? '≤6' : i === 17 ? s.threshold : 12,
          x + 33,
          352,
          25,
          i === 17 ? themeColors.yellow : themeColors.cyan,
          'center',
        );
      });
    }
    line(ctx, api, pl.point(55, 0.5).x, 425, pl.point(55, 0.5).x, 630, themeColors.pink, 3);
    text(ctx, api, 'deadline 55', pl.point(55, 0.5).x, 405, 29, themeColors.pink, 'center');
    dot(ctx, api, pl.point(52, 0.5).x, 580, themeColors.yellow, 13);
    if (s.intervalVisible)
      intervalRow(ctx, api, pl, 580, 52, s.threshold, 59, {
        showOutcome: s.outcomeVisible,
        color: themeColors.cyan,
      });
    else text(ctx, api, '52 ms · compute the interval', 820, 505, 32, themeColors.yellow, 'center');
    if (s.rankVisible)
      equation(ctx, api, String.raw`k=\lceil20\cdot0.9\rceil=18`, 960, 900, 43, themeColors.yellow);
    else
      equation(
        ctx,
        api,
        String.raw`k=\lceil(19+1)\cdot0.9\rceil\;?`,
        960,
        900,
        43,
        themeColors.muted,
      );
    caption(
      ctx,
      api,
      s.outcomeVisible
        ? `59 is covered${s.deadlineVisible ? ' · deadline missed' : ''}${s.changed ? ' · same rank, wider interval' : ''}`
        : 'New calibration set · hold the answer until the calculation.',
      s.outcomeVisible ? themeColors.pink : themeColors.muted,
    );
  };
  if (api.focus) api.focus.target(`${'fresh-deadline'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'fresh-deadline',
  draw: drawFreshDeadline,
  cues: [
    'fresh-deadline-b1',
    'fresh-deadline-b2',
    'fresh-rank',
    'fresh-interval',
    'fresh-outcome',
    'cf-fresh-rank',
    'cf-fresh-interval',
    'cf-fresh-covered',
    'cf-fresh-deadline',
    'cf-fresh-value',
    'fresh-deadline-b3',
    'fresh-change-score',
    'cf-fresh-change',
    'cf-fresh-wider',
  ],
};
