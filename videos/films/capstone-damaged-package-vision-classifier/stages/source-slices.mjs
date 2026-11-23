import { visionOutcomes } from '../fixtures.mjs';
import { visionJoin } from '../arithmetic.mjs';
import { visionServed, visionTestRows } from '../construction.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawSourceSlices(ctx, scene, state, api) {
  const frameState = visionFrame('source-slices', state);
  return api.focus.target('dv-source-slices-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const reports = ['customer_phone', 'warehouse_camera'].map((source) => {
        const rows = visionTestRows.filter((r) => r.photo.source === source),
          traces = visionServed.filter((r) => r.source === source);
        return {
          source,
          ...visionJoin(rows, traces, visionOutcomes, 12),
        };
      });
      reports.forEach((report, i) => {
        const x = 180 + i * 880,
          show = resultComplete(i === 0 ? 'phone-metrics' : 'warehouse-metrics', 0);
        visionCard(
          ctx,
          api,
          i === 0 ? 'Customer phone · 2 cases' : 'Warehouse camera · 2 cases',
          x,
          330,
          780,
          100,
          i === 0 ? themeColors.blue : themeColors.cyan,
        );
        const cells =
          i === 0
            ? [
                ['TP', 1],
                ['FP', 1],
              ]
            : [
                ['TN', 1],
                ['FN', 1],
              ];
        cells.forEach(([cell, count], j) => {
          visionText(
            ctx,
            api,
            show ? cell + ' ' + count : 'pending',
            x + 120 + j * 330,
            580,
            43,
            show ? themeColors.ink : themeColors.muted,
          );
        });
        visionValue(
          ctx,
          api,
          'Precision',
          report.precision === null ? 'undefined' : report.precision.toFixed(2),
          x + 50,
          705,
          show,
          themeColors.yellow,
        );
        visionValue(
          ctx,
          api,
          'Recall',
          report.recall === null ? 'undefined' : report.recall.toFixed(2),
          x + 430,
          705,
          show,
          themeColors.pink,
        );
        if (show)
          visionText(
            ctx,
            api,
            i === 0 ? 'TP / (TP + FP) = 1 / 2' : 'No priority cases → precision denominator 0',
            x + 390,
            875,
            27,
            themeColors.muted,
            'center',
          );
      });
      visionNote(
        ctx,
        api,
        currentBeat === 1 && resultComplete('slice-overlap', 1)
          ? 'A multi-source case may belong to both reports. Slice counts need not sum to the total.'
          : 'Two cases per source demonstrate arithmetic. They establish no camera-quality ranking.',
      );
    }
  });
}
export default {
  id: 'source-slices',
  draw: drawSourceSlices,
  cues: [
    'dv-source-slices-0',
    'dv-source-slices-operation-0',
    'dv-phone-metrics',
    'dv-warehouse-metrics',
    'dv-source-slices-1',
    'dv-source-slices-operation-1',
    'dv-slice-overlap',
    'dv-source-slices-2',
    'dv-source-slices-operation-2',
  ],
};
