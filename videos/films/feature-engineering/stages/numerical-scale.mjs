import { robustFortyTwo, scaleRows, standardFortyTwo } from '../construction.mjs';
import { scalingSnapshot } from '../model.mjs';
import { retainedFocus, retainedMath, retainedText } from '../defaults.mjs';
export function drawNumericalScale(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const done = (id, beat) =>
    currentBeat > beat ||
    (currentBeat === beat && (state.cues ? state.cues[id]?.progress === 1 : progress >= 0.94));
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    retainedText(
      ctx,
      api,
      'Eight jobs · preserve every identity through both transforms',
      960,
      275,
      32,
      themeColors.ink,
    );
    retainedText(ctx, api, 'Queue wait · minutes', 300, 340, 27, themeColors.blue);
    retainedMath(ctx, api, String.raw`z=\frac{x-1523.25}{3959.90}`, 880, 350, 35, themeColors.cyan);
    retainedMath(ctx, api, String.raw`r=\frac{x-27}{28.75}`, 1480, 350, 35, themeColors.green);
    const standard = api.teaching.axes({
      x: 650,
      y: 420,
      width: 460,
      height: 405,
      xDomain: [-0.5, 3],
      yDomain: [0, 8],
      xTicks: [0, 1, 2, 3],
      yTicks: [],
      fontSize: 22,
      xLabel: 'standard score',
    });
    const robust = api.teaching.axes({
      x: 1240,
      y: 420,
      width: 460,
      height: 405,
      xDomain: [-1, 2],
      yDomain: [0, 8],
      xTicks: [-1, 0, 1, 2],
      yTicks: [],
      fontSize: 22,
      xLabel: 'robust score · tail outside view',
    });
    const rows = scalingSnapshot(
      currentBeat,
      progress,
      currentBeat === 1 ? api.focus.progress('feature-robust-map', phaseForBeat(1)) : undefined,
    );
    retainedFocus(ctx, api, 'numerical-scale-simulation-16', () =>
      rows.forEach((row, index) => {
        const y = 447 + index * 49,
          color =
            row.wait === 12000
              ? themeColors.red
              : row.wait === 42
                ? themeColors.yellow
                : themeColors.cyan;
        api.components.card({
          label: `${row.id} · ${row.wait.toLocaleString('en-US')} min`,
          x: 170,
          y: y - 24,
          width: 270,
          height: 43,
          fontSize: 23,
          padding: 4,
          fill: themeColors.panel,
          stroke: color,
          textColor: color,
        });
        const target = standard.point(row.standard, 0).x;
        const robustX = robust.point(Math.min(2, row.robust), 0).x;
        const copyX = api.lerp(target, robustX, row.robustProgress);
        const copyDistance = copyX - target;
        if (row.standardProgress > 0) {
          const x = api.lerp(480, target, row.standardProgress);
          if (row.robustProgress === 0 || copyDistance > 40) {
            api.circle(ctx, x, y, 17, color);
            {
              const nearAxis = [standard.bounds.x, robust.bounds.x].some(
                (axis) => Math.abs(x - axis) < 50,
              );
              retainedText(
                ctx,
                api,
                row.id,
                nearAxis ? x - 70 : x,
                y + 6,
                16,
                nearAxis ? color : themeColors.bg,
              );
            }
          }
          if (row.standardProgress === 1 && (row.robustProgress === 0 || copyDistance > 130))
            retainedText(ctx, api, row.standard.toFixed(3), target + 27, y + 8, 22, color, 'left');
        }
        if (row.robustProgress > 0) {
          api.circle(ctx, copyX, y, 17, color);
          {
            const nearStandard = Math.abs(copyX - standard.bounds.x) < 50,
              nearRobust = Math.abs(copyX - robust.bounds.x) < 50,
              nearAxis = nearStandard || nearRobust,
              offset = nearRobust && row.robustProgress < 1 ? 70 : -70;
            retainedText(
              ctx,
              api,
              row.id,
              nearAxis ? copyX + offset : copyX,
              y + 6,
              16,
              nearAxis ? color : themeColors.bg,
            );
          }
          if (row.robustProgress === 1)
            retainedText(
              ctx,
              api,
              row.robust.toFixed(3) + (row.robust > 2 ? ' →' : ''),
              robustX + 27,
              y + 8,
              22,
              color,
              'left',
            );
        }
      }),
    );
    retainedFocus(ctx, api, 'feature-standard-separation', () =>
      retainedText(
        ctx,
        api,
        done('feature-standard-separation', 0)
          ? `J1 → J6 · standard separation ${(scaleRows[5].standard - scaleRows[0].standard).toFixed(3)}`
          : 'Standard-score separation pending',
        880,
        930,
        26,
        done('feature-standard-separation', 0) ? themeColors.yellow : themeColors.muted,
      ),
    );
    if (rows[5].robustProgress === 1)
      retainedText(
        ctx,
        api,
        `J6 · ${standardFortyTwo.toFixed(3)} standard → ${robustFortyTwo.toFixed(3)} robust`,
        1480,
        930,
        25,
        themeColors.yellow,
      );
    retainedText(
      ctx,
      api,
      currentBeat < 2
        ? 'Each arriving label is computed from the same eight training values.'
        : 'J8 stays extreme: robust scaling preserves its 416.452 score; clipping would change the value.',
      960,
      1000,
      27,
      themeColors.muted,
    );
  }
}
export default {
  id: 'numerical-scale',
  draw: drawNumericalScale,
  cues: [
    'numerical-scale-beat-1-focus-1',
    'feature-standard-separation',
    'numerical-scale-beat-2-focus-1',
    'feature-robust-map',
    'numerical-scale-beat-3-focus-1',
  ],
};
