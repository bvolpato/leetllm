import { clamp, cueDone, cueProgress, phase } from '../construction.mjs';
import { quantileSortState } from '../model.mjs';
import { caption, equation, panel, text } from '../defaults.mjs';
export function drawQuantile(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress, a, z));
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const sort = reveal('rank-sort', 1, 0.01, 0.3),
      cards = quantileSortState(sort),
      rankShown = done('rank-eight', 0, 0.8),
      valueShown = done('rank-value', 1, 0.65);
    text(
      ctx,
      api,
      'records in a different display order',
      960,
      345,
      29,
      themeColors.muted,
      'center',
    );
    text(
      ctx,
      api,
      'ordered residuals · stable tie order',
      960,
      910,
      29,
      themeColors.cyan,
      'center',
    );
    for (const card of cards) {
      const active = valueShown && card.rank === 8;
      panel(
        ctx,
        api,
        card.x,
        card.y,
        145,
        95,
        () => {
          text(ctx, api, card.id, card.x + 72.5, card.y + 31, 22, themeColors.muted, 'center');
          text(
            ctx,
            api,
            card.value,
            card.x + 72.5,
            card.y + 79,
            39,
            active ? themeColors.yellow : themeColors.cyan,
            'center',
          );
        },
        active ? themeColors.yellow : themeColors.border,
      );
    }
    for (let i = 0; i < 9; i++)
      text(
        ctx,
        api,
        i + 1,
        222.5 + i * 180,
        875,
        24,
        rankShown && i === 7 ? themeColors.yellow : themeColors.muted,
        'center',
      );
    equation(
      ctx,
      api,
      rankShown
        ? String.raw`k=\lceil(9+1)\cdot0.8\rceil=8`
        : String.raw`k=\lceil(n+1)(1-\alpha)\rceil`,
      960,
      275,
      43,
      themeColors.yellow,
    );
    caption(
      ctx,
      api,
      valueShown
        ? 'rank 8 · observed value 8 ms · center 40 ms · predict the endpoints'
        : 'The rank and the score value are different quantities.',
      valueShown ? themeColors.yellow : themeColors.muted,
    );
  };
  if (api.focus) api.focus.target(`${'quantile'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'quantile',
  draw: drawQuantile,
  cues: [
    'quantile-b1',
    'rank-eight',
    'cf-rank-eight',
    'quantile-b2',
    'rank-sort',
    'rank-value',
    'cf-rank-value',
    'quantile-b3',
  ],
};
