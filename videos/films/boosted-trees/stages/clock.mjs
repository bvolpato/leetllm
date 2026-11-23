import { MONTHS } from '../fixtures.mjs';
import { boostCue } from '../construction.mjs';
import { cellText, footer, line } from '../defaults.mjs';
export function drawClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const cueProgress = (id, beat = currentBeat) => boostCue(state, id, beat);
  api.focus.target('clock-model', () => {
    const x = [420, 960, 1500],
      colors = [themeColors.blue, themeColors.yellow, themeColors.cyan];
    api.focus.target('clock-object--5', () =>
      MONTHS.forEach((m, i) => {
        cellText(ctx, api, m.name, x[i], 410, colors[i], 35);
        cellText(ctx, api, m.role, x[i], 485, colors[i], 25);
        for (let j = 0; j < m.rows; j++) {
          const xx = x[i] - 158 + (j % 36) * 9,
            yy = 550 + Math.floor(j / 36) * 13;
          api.rect(
            ctx,
            xx,
            yy,
            6,
            8,
            i <= currentBeat
              ? j < m.misses
                ? themeColors.pink
                : themeColors.blue
              : themeColors.grid,
          );
        }
        api.focus.target('clock-object-rows-missed-deadlines-6', () =>
          cellText(
            ctx,
            api,
            i <= currentBeat ? `${m.rows} jobs · ${m.misses} misses` : 'held for later',
            x[i],
            740,
            i <= currentBeat ? colors[i] : themeColors.muted,
            27,
          ),
        );
      }),
    );
    line(ctx, api, 280, 860, 1650, 860, themeColors.muted, 3);
    const move = currentBeat === 2 ? cueProgress('clock-beat-3-focus-1', 2) : 0,
      candidateX =
        currentBeat === 0 ? x[0] : currentBeat === 1 ? x[1] : x[1] + (x[2] - x[1]) * move;
    api.rect(
      ctx,
      candidateX - 210,
      805,
      420,
      112,
      themeColors.panel,
      currentBeat === 2 ? themeColors.cyan : themeColors.yellow,
      3,
    );
    cellText(
      ctx,
      api,
      currentBeat === 0
        ? 'Fit the trees'
        : currentBeat === 1
          ? 'Choose tree count and cutoff'
          : 'Test the frozen pair',
      candidateX,
      850,
      currentBeat === 2 ? themeColors.cyan : themeColors.yellow,
      25,
    );
    cellText(
      ctx,
      api,
      ['January–March', 'April validation', 'May evaluation'][currentBeat],
      candidateX,
      890,
      themeColors.muted,
      22,
    );
    footer(ctx, api, 'Each tile is one job. Pink marks a missed deadline.');
  });
}
export default {
  id: 'clock',
  draw: drawClock,
  cues: [
    'clock-beat-1-focus-1',
    'clock-beat-1-focus-2',
    'clock-beat-2-focus-1',
    'clock-beat-3-focus-1',
  ],
};
