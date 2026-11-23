import { thermalTraces } from '../fixtures.mjs';
import { edgeState } from '../model.mjs';
import { drawEdgeL, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawThermalTelemetry(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = edgeState('thermal-telemetry', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const heading = (v) => (edgeHeading = v);
  api.focus.target('edge-thermal-telemetry-mechanism', () => {
    heading('Which readings share the slowdown’s timestamp?');
    const plot = teaching.axes({
        x: 250,
        y: 365,
        width: 1260,
        height: 300,
        xDomain: [0, 10],
        yDomain: [14, 25],
        xTicks: [0, 1.5, 10],
        yTicks: [15, 18, 21, 24],
        xLabel: 'elapsed minutes',
        yLabel: 'tokens/s',
      }),
      trace = thermalTraces[0].map(({ minute, rate }) => ({ x: minute, y: rate })),
      minute = currentBeat === 0 ? q * 10 : 10,
      seen = trace.filter((p) => p.x <= minute);
    teaching.scatter({
      plot,
      points: seen.map((p) => ({
        ...p,
        radius: 8,
        color: themeColors.yellow,
      })),
    });
    teaching.curve({
      plot,
      points: [
        {
          x: 0,
          y: 18,
        },
        {
          x: 10,
          y: 18,
        },
      ],
      color: themeColors.pink,
      width: 2,
    });
    if (currentBeat > 0)
      drawEdgeL(ctx, api, 250 + q * 1260, 365, 250 + q * 1260, 665, themeColors.yellow, 1);
    const rows =
      currentBeat === 0
        ? [
            ['power / clocks', 'record at same time'],
            ['ambient / workload', 'record at same time'],
          ]
        : currentBeat === 1
          ? [
              ['status NONE', 'support age: unknown'],
              ['headroom missing', 'cannot prove healthy thermals'],
            ]
          : [
              ['between samples', 'unobserved intervals'],
              ['exact device + runtime', 'charging + output + duty cycle'],
            ];
    rows.forEach((r, i) =>
      drawEdgeRow(
        ctx,
        api,
        r,
        150,
        765 + i * 100,
        1600,
        75,
        i ? themeColors.yellow : themeColors.blue,
      ),
    );
    if (currentBeat === 1 && done('unsupported'))
      drawEdgeText(
        ctx,
        api,
        'NONE + missing support cannot prove healthy thermals',
        960,
        990,
        28,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 2 && done('between'))
      drawEdgeText(
        ctx,
        api,
        'Three samples leave unobserved intervals',
        960,
        990,
        29,
        themeColors.yellow,
        'center',
      );
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'thermal-telemetry',
  draw: drawThermalTelemetry,
  cues: [
    'edge-thermal-telemetry-op-0',
    'edge-thermal-telemetry-op-1',
    'edge-thermal-telemetry-unsupported',
    'edge-thermal-telemetry-op-2',
    'edge-thermal-telemetry-between',
  ],
};
