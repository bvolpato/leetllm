import { visionFrame } from '../model.mjs';
import { visionCard, visionLine, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawDevelopmentThreshold(ctx, scene, state, api) {
  const frameState = visionFrame('development-threshold', state);
  return api.focus.target('dv-development-threshold-mechanism', () => {
    const { C: themeColors } = api;
    {
      const plot = api.teaching.axes({
        x: 250,
        y: 370,
        width: 1120,
        height: 310,
        xDomain: [0, 1],
        yDomain: [0, 6],
        xTicks: [0, 0.3, 0.7, 0.8, 1],
        yTicks: [],
        fontSize: 26,
      });
      frameState.rows.forEach((row, i) => {
        const at = plot.point(row.score, 5.5 - i);
        visionText(ctx, api, row.id, 180, at.y + 9, 25, themeColors.muted, 'right');
        api.circle(
          ctx,
          at.x,
          at.y,
          12,
          frameState.showInputs
            ? row.gold
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
        );
        visionText(ctx, api, row.score.toFixed(2), 1710, at.y + 9, 27, themeColors.ink, 'right');
        if (frameState.showInputs)
          visionText(
            ctx,
            api,
            row.gold ? 'damaged' : 'clear',
            1420,
            at.y + 9,
            27,
            row.gold ? themeColors.green : themeColors.pink,
          );
      });
      const x = plot.point(frameState.result.threshold, 0).x;
      visionText(ctx, api, 'Supplied validation score', 960, 754, 26, themeColors.muted, 'center');
      visionLine(ctx, api, x, 350, x, 695, themeColors.yellow, 4);
      visionText(
        ctx,
        api,
        'τ = ' + frameState.result.threshold.toFixed(2),
        x,
        315,
        31,
        themeColors.yellow,
        'center',
      );
      visionValue(
        ctx,
        api,
        'Priority slots',
        frameState.result.slots,
        230,
        815,
        frameState.showCounts,
        themeColors.cyan,
      );
      visionValue(
        ctx,
        api,
        'TP / FP',
        `${frameState.result.TP} / ${frameState.result.FP}`,
        650,
        815,
        frameState.showCounts,
        themeColors.green,
      );
      visionValue(
        ctx,
        api,
        'FN · precision / recall',
        `${frameState.result.FN} · ${frameState.result.precision.toFixed(2)} / ${frameState.result.recall.toFixed(2)}`,
        1170,
        815,
        frameState.showMetrics,
        themeColors.yellow,
      );
      if (frameState.choice)
        visionCard(
          ctx,
          api,
          'Choose .70 · four slots · recall .75',
          1090,
          235,
          650,
          65,
          themeColors.green,
        );
      visionNote(
        ctx,
        api,
        'Separate invented development worksheet. Fixed requirements: at most four slots and recall at least .75.',
      );
    }
  });
}
export default {
  id: 'development-threshold',
  draw: drawDevelopmentThreshold,
  cues: [
    'dv-development-threshold-0',
    'dv-development-threshold-operation-0',
    'dv-development-inputs',
    'dv-development-threshold-1',
    'dv-development-threshold-operation-1',
    'dv-threshold-eight-counts',
    'dv-threshold-eight-recall',
    'dv-threshold-seven-counts',
    'dv-threshold-seven-metrics',
    'dv-development-threshold-2',
    'dv-development-threshold-operation-2',
    'dv-threshold-three-counts',
    'dv-threshold-choice',
  ],
};
