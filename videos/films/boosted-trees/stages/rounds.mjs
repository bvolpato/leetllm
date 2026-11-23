import { STAGE_SERIES } from '../fixtures.mjs';
import { boostCue } from '../construction.mjs';
import { cellText, dot, footer, heading, line, outlineBox } from '../defaults.mjs';
export function drawRounds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const cueProgress = (id, beat = currentBeat) => boostCue(state, id, beat);
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  api.focus.target('rounds-model', () => {
    heading(ctx, api, 'All 160 actual stages were trained; April selects the retained candidate');
    const count =
        currentBeat === 0
          ? Math.max(
              1,
              Math.min(160, 1 + Math.floor(159 * cueProgress('rounds-beat-1-focus-1', 0))),
            )
          : 160,
      points = STAGE_SERIES.slice(0, count),
      chosen = currentBeat > 1 || (currentBeat === 1 && S('rounds-beat-2-focus-2', 1));
    const plot = api.teaching.axes({
      x: 250,
      y: 390,
      width: 1120,
      height: 410,
      xDomain: [0, 165],
      yDomain: [0.22, 0.72],
      xTicks: [1, 50, 100, 160],
      yTicks: [0.3, 0.45, 0.6],
      xLabel: 'boosting stage',
      yLabel: 'log loss',
      fontSize: 24,
    });
    api.focus.target('rounds-simulation-36', () => {
      for (const [key, col] of [
        ['train', themeColors.cyan],
        ['validation', themeColors.pink],
      ])
        api.teaching.curve({
          plot,
          points: points.map((r) => ({
            x: r.round,
            y: r[key],
          })),
          color: col,
          progress: 1,
          width: key === 'validation' ? 4 : 2,
          opacity: key === 'validation' ? 1 : 0.55,
        });
      const latest = points.at(-1);
      cellText(
        ctx,
        api,
        `${count} actual staged predictions · latest April ${latest.validation.toFixed(4)}`,
        960,
        1000,
        themeColors.muted,
        27,
      );
    });
    if (chosen) {
      const r = STAGE_SERIES[49],
        at = plot.point(50, r.validation);
      dot(ctx, api, at.x, at.y, themeColors.yellow, 14);
      line(ctx, api, at.x, at.y + 20, at.x, 800, themeColors.yellow, 2);
      api.focus.target('rounds-object-april-minimum-50-trees-42', () => {
        outlineBox(ctx, api, 1430, 470, 330, 245, themeColors.yellow);
        cellText(ctx, api, 'candidate C1', 1595, 540, themeColors.yellow, 28);
        cellText(ctx, api, '50 trees', 1595, 620, themeColors.ink, 35);
        cellText(ctx, api, r.validation.toFixed(4), 1595, 680, themeColors.pink, 27);
      });
    }
    for (let i = 0; i < 160; i++)
      api.rect(
        ctx,
        280 + i * 8.2,
        920,
        5.5,
        30,
        chosen && i >= 50 ? themeColors.grid : themeColors.blue,
      );
    footer(
      ctx,
      api,
      'Blue trace: Jan–Mar · pink trace: April · the selected 50-tree object is refitted on the original fitting rows.',
    );
  });
}
export default {
  id: 'rounds',
  draw: drawRounds,
  cues: [
    'rounds-beat-1-focus-1',
    'rounds-beat-2-focus-1',
    'rounds-beat-2-focus-2',
    'rounds-beat-3-focus-1',
  ],
};
