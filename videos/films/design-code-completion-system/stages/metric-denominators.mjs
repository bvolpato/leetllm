import { completionCue } from '../construction.mjs';
import { completionFooter, completionHeading, completionText } from '../defaults.mjs';
export function drawMetricDenominators(ctx, scene, state, api) {
  api.focus.target('cc-metric-denominators-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      completionHeading(
        ctx,
        api,
        'One observed suggestion ID can contain several acceptance actions',
      );
      const rows = [
        ['A', 18, 0],
        ['B', 4, 4],
        ['C', 42, 35],
        ['D', 0, 0],
      ];
      ['ID', 'Inserted original characters', 'Retained original characters'].forEach((v, i) =>
        completionText(ctx, api, v, [300, 900, 1500][i], 370, 28, themeColors.muted, 'center'),
      );
      rows.forEach(([id, inserted, retained], i) => {
        completionText(ctx, api, id, 300, 480 + i * 115, 35, themeColors.yellow, 'center');
        api.rect(ctx, 650, 425 + i * 115, inserted * 10 || 6, 65, themeColors.blue);
        completionText(ctx, api, inserted, 1130, 475 + i * 115, 32, themeColors.blue);
        api.rect(ctx, 1250, 425 + i * 115, retained * 10 || 6, 65, themeColors.green);
        completionText(ctx, api, retained, 1710, 475 + i * 115, 32, themeColors.green);
      });
      if (done('cc-retain39-64') || currentBeat > 0)
        completionText(
          ctx,
          api,
          'Accepted 3 / 4 = 75% · retained originals 39 / 64 = 60.9%',
          960,
          960,
          35,
          themeColors.yellow,
          'center',
        );
      completionFooter(
        ctx,
        api,
        currentBeat === 1
          ? 'Two partial accepts on C still count one accepted ID · absent observation windows stay censored'
          : currentBeat === 2
            ? 'The study compared editing signals with developers’ reported productivity'
            : 'C keeps 35 of its 42 inserted characters',
      );
    }
    return true;
  });
}
export default {
  id: 'metric-denominators',
  draw: drawMetricDenominators,
  cues: [
    'cc-metric-denominators-0',
    'cc-accept75',
    'cc-retain39-64',
    'cc-metric-denominators-1',
    'cc-partial-distinct',
    'cc-metric-denominators-2',
  ],
};
