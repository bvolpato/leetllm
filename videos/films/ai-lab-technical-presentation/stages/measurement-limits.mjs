import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawMeasurementLimits(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('measurement-limits', state);
  {
    const rows = [
      ['earlier quarter', '5 / 5,000,000 requests', `${modelState.incidentRates.prior} / million`],
      ['later quarter', '1 / 500,000 requests', `${modelState.incidentRates.candidate} / million`],
    ];
    teaching.grid({
      x: 180,
      y: 275,
      width: 1560,
      height: 190,
      rows: 2,
      columns: 3,
      labels: rows,
      cellFocusTarget: (row, column) => [
        row ? 'incident-later' : 'incident-prior',
        ...(column === 2 ? ['incident-rates'] : []),
      ],
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
      fontSize: 28,
      highlights: [
        {
          row: 0,
          column: 2,
          fill: '#8cdeb52b',
          stroke: themeColors.green,
        },
        {
          row: 1,
          column: 2,
          fill: '#ef9ac82b',
          stroke: themeColors.pink,
        },
      ],
    });
    if ((state.beat ?? 0) === 0) {
      api.focus.target('incident-counts', () => {
        text(ctx, api, 'Incident count', 540, 570, 31, themeColors.ink, 'center');
        teaching.bars({
          x: 220,
          y: 620,
          width: 640,
          height: 210,
          values: [5, 1],
          labels: ['earlier', 'later'],
          colors: [themeColors.blue, themeColors.pink],
          max: 5,
          showValues: true,
          fontSize: 28,
        });
      });
      api.focus.target('incident-rates', () => {
        text(ctx, api, 'Incidents per million requests', 1370, 570, 31, themeColors.ink, 'center');
        teaching.bars({
          x: 1050,
          y: 620,
          width: 640,
          height: 210,
          values: [modelState.incidentRates.prior, modelState.incidentRates.candidate],
          labels: ['earlier', 'later'],
          colors: [themeColors.blue, themeColors.pink],
          max: 2,
          showValues: true,
          fontSize: 28,
        });
      });
    } else {
      const laneX = 470,
        laneW = 1000;
      text(ctx, api, 'Separate service check', 220, 575, 29, themeColors.muted);
      api.focus.target('service-latency', () => {
        text(
          ctx,
          api,
          `successful-request p95  ${modelState.service.successfulP95Ms} ms`,
          laneX,
          610,
          29,
          themeColors.green,
        );
        text(
          ctx,
          api,
          `limit ${modelState.service.latencyLimitMs} ms`,
          laneX + (laneW * modelState.service.latencyLimitMs) / 1000,
          610,
          26,
          themeColors.yellow,
          'center',
        );
        api.rect(
          ctx,
          laneX,
          660,
          (laneW * modelState.service.successfulP95Ms) / 1000,
          48,
          themeColors.green,
          undefined,
          0,
        );
        api.line(
          ctx,
          laneX + (laneW * modelState.service.latencyLimitMs) / 1000,
          640,
          laneX + (laneW * modelState.service.latencyLimitMs) / 1000,
          725,
          themeColors.yellow,
          4,
        );
      });
      api.focus.reveal('service-success', () =>
        api.focus.target('service-success', () => {
          text(
            ctx,
            api,
            `${modelState.service.attempts - modelState.service.timeouts}/${modelState.service.attempts} successful = ${(100 * modelState.service.successFraction).toFixed(0)}% · ${modelState.service.timeouts} timeouts`,
            laneX,
            755,
            29,
            themeColors.pink,
          );
          text(
            ctx,
            api,
            `minimum ${(100 * modelState.service.minimumSuccess).toFixed(0)}%`,
            laneX + laneW * modelState.service.minimumSuccess,
            755,
            26,
            themeColors.yellow,
            'center',
          );
          api.rect(
            ctx,
            laneX,
            785,
            laneW * modelState.service.successFraction,
            48,
            themeColors.pink,
            undefined,
            0,
          );
          api.line(
            ctx,
            laneX + laneW * modelState.service.minimumSuccess,
            770,
            laneX + laneW * modelState.service.minimumSuccess,
            850,
            themeColors.yellow,
            4,
          );
        }),
      );
      api.focus.reveal('service-gate', () =>
        api.focus.target('service-gate', () =>
          text(
            ctx,
            api,
            `p95 ${modelState.service.latencyPasses ? 'PASS' : 'FAIL'} · success ${modelState.service.successPasses ? 'PASS' : 'FAIL'} → ${modelState.service.passes ? 'RELEASE' : 'HOLD'}`,
            960,
            940,
            32,
            modelState.service.passes ? themeColors.green : themeColors.pink,
            'center',
          ),
        ),
      );
    }
  }
}
export default {
  id: 'measurement-limits',
  draw: drawMeasurementLimits,
  cues: [
    'incident-prior',
    'incident-later',
    'incident-rate-change',
    'service-latency',
    'service-success',
    'service-ratio',
    'service-gate',
  ],
};
