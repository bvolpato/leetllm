import { clamp, cueDone } from '../construction.mjs';
import { intervalState } from '../model.mjs';
import { arrow, axis, caption, equation, intervalRow, line, text } from '../defaults.mjs';
export function drawInterval(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const s = intervalState(currentBeat, progress, cues),
      pl = axis(ctx, api, [20, 65], 675, 'response latency · milliseconds', [20, 30, 40, 50, 60]);
    text(
      ctx,
      api,
      Number.isFinite(s.radius)
        ? 'center 40 · calibrated q = 8 ms'
        : 'center 40 · unavailable rank 10 · q = ∞',
      960,
      345,
      34,
      themeColors.yellow,
      'center',
    );
    if (Number.isFinite(s.radius)) {
      intervalRow(ctx, api, pl, 580, 40, s.radius, s.future, {
        showEndpoints: done('cf-endpoints', 0, 0.4),
        showOutcome:
          s.future !== null &&
          (s.future === 44
            ? done('cf-outcome-hit', 0, 0.58)
            : s.future === 53
              ? done('cf-outcome-miss', 0, 0.84)
              : done('cf-inclusive-boundary', 1, 0.4)),
      });
      equation(ctx, api, String.raw`|y-40|\le8`, 960, 900, 47, themeColors.cyan);
      caption(
        ctx,
        api,
        currentBeat === 1
          ? done('cf-inclusive-boundary', 1, 0.4)
            ? '48 is included at the boundary.'
            : 'Test the boundary using the same inclusive score rule.'
          : done('cf-endpoints', 0, 0.4)
            ? '[32, 48] ms · width 16 ms'
            : 'Construct each endpoint from the same center.',
      );
    } else {
      line(ctx, api, 300, 580, 1620, 580, themeColors.pink, 12);
      arrow(ctx, api, 340, 580, 300, 580, themeColors.pink, 4);
      arrow(ctx, api, 1580, 580, 1620, 580, themeColors.pink, 4);
      equation(
        ctx,
        api,
        String.raw`q=+\infty\quad\Rightarrow\quad C(x)=\mathbb R`,
        960,
        900,
        47,
        themeColors.pink,
      );
      caption(ctx, api, 'No finite outcome is excluded · no useful 50 ms upper bound.');
    }
  };
  if (api.focus) api.focus.target(`${'interval'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'interval',
  draw: drawInterval,
  cues: [
    'interval-b1',
    'interval-endpoints',
    'interval-hit',
    'interval-miss',
    'cf-endpoints',
    'cf-outcome-hit',
    'cf-outcome-miss',
    'interval-b2',
    'cf-inclusive-boundary',
    'interval-b3',
  ],
};
