import { pct } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { auditFocusApi, text, visualFocus } from '../defaults.mjs';
export function drawGates(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('gates', state),
    currentBeat = modelState.step,
    progress = modelState.p;
  {
    text(
      ctx,
      api,
      'Separate candidate measurements · same release contract',
      960,
      265,
      30,
      themeColors.muted,
      'center',
    );
    const plot = teaching.axes({
      x: 170,
      y: 350,
      width: 970,
      height: 470,
      xDomain: [0.88, 1.01],
      yDomain: [0, 2100],
      xTicks: [0.9, 0.94, 0.98, 1],
      yTicks: [0, 900, 1800],
      xLabel: 'quality pass rate',
      yLabel: 'p95 latency (ms)',
      fontSize: 25,
    });
    const q = plot.point(0.98, 0).x,
      latencyY = plot.point(0.88, 900).y;
    api.line(ctx, q, 350, q, 820, themeColors.yellow, 3);
    text(ctx, api, 'quality ≥ 98%', q + 10, 315, 27, themeColors.yellow);
    if (currentBeat > 0) {
      api.line(ctx, 170, latencyY, 1140, latencyY, themeColors.pink, 3);
      text(ctx, api, 'latency ≤ 900 ms', 200, latencyY - 20, 27, themeColors.pink);
    }
    visualFocus(ctx, api, 'gates-simulation-39', () =>
      modelState.rows.slice(0, modelState.visibleRows).forEach((row, i) => {
        const point = plot.point(row.quality, row.ms),
          color = row.eligible ? themeColors.green : themeColors.pink;
        visualFocus(ctx, api, 'gates-object-point-x-point-y-11-color-40', () =>
          api.circle(ctx, point.x, point.y, 11, color),
        );
        text(
          ctx,
          api,
          row.id,
          row.id === 'Balanced' ? point.x + 30 : point.x - 40,
          point.y + (row.id === 'Specialist' ? -30 : 55),
          28,
          color,
          row.id === 'Balanced' ? 'left' : 'center',
        );
        const y = 375 + i * 195;
        text(ctx, api, row.id, 1280, y, 33, color);
        text(
          ctx,
          api,
          `Quality ${pct(row.quality)} · ${row.ms} ms`,
          1280,
          y + 45,
          27,
          themeColors.ink,
        );
        text(
          ctx,
          api,
          `$${row.cost.toFixed(3)} / case · schema 100%`,
          1280,
          y + 90,
          26,
          themeColors.muted,
        );
        text(
          ctx,
          api,
          row.eligible
            ? currentBeat === 2
              ? 'Clears four supplied checks'
              : 'Continue checks'
            : !row.qualityPass
              ? 'Quality miss'
              : 'Operational miss',
          1280,
          y + 130,
          26,
          color,
        );
        if (currentBeat === 2) {
          text(
            ctx,
            api,
            `schema ${row.schemaPass ? 'PASS' : 'FAIL'} · cost ${row.costPass ? 'PASS' : 'FAIL'}`,
            1690,
            y + 155,
            24,
            row.schemaPass && row.costPass ? themeColors.green : themeColors.pink,
            'right',
          );
        }
      }),
    );
    text(
      ctx,
      api,
      currentBeat === 2
        ? 'Cost ≤ $0.015 per case · schema pass rate = 100%'
        : 'Quality and latency limits are independent',
      960,
      975,
      29,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'gates',
  draw: drawGates,
  cues: [
    'gates-beat-1-focus-1',
    'gates-beat-1-focus-2',
    'gates-beat-2-focus-1',
    'gates-beat-2-focus-2',
    'gates-beat-3-focus-1',
    'gates-beat-3-focus-2',
    'ba-gates-cost',
  ],
};
