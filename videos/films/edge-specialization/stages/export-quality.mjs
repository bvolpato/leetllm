import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeL, drawEdgeText } from '../defaults.mjs';
export function drawExportQuality(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = edgeState('export-quality', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-export-quality-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Repeat the same tickets on the exported weights'
        : 'Quality ≥ 0.92   and   p95 latency ≤ 120 ms',
    );
    const plot = teaching.axes({
      x: 260,
      y: 400,
      width: 1120,
      height: 400,
      xDomain: [50, 150],
      yDomain: [0.86, 0.96],
      xTicks: [60, 90, 120, 150],
      yTicks: [0.88, 0.9, 0.92, 0.94, 0.96],
      xLabel: 'p95 latency (ms)',
      yLabel: 'task quality',
    });
    teaching.curve({
      plot,
      points: [
        {
          x: 50,
          y: 0.92,
        },
        {
          x: 150,
          y: 0.92,
        },
      ],
      color: themeColors.pink,
      width: 2,
    });
    drawEdgeL(ctx, api, 1044, 400, 1044, 800, themeColors.pink, 3);
    drawEdgeText(ctx, api, '≤120 ms', 1044, 365, 27, themeColors.pink, 'center');
    const points = [
      ['baseline', 132, 0.94, 'baseline'],
      ['INT8', 104, 0.938, 'int8'],
      ['INT4', 71, 0.887, 'int4'],
    ];
    points.forEach(([name, x, y, k], i) => {
      if (currentBeat === 0 || (currentBeat === 1 && !done(k))) return;
      const passed = x <= 120 && y >= 0.92;
      const color = i === 0 ? themeColors.blue : passed ? themeColors.green : themeColors.pink;
      teaching.scatter({
        plot,
        points: [
          {
            x,
            y,
            color,
            radius: 10,
          },
        ],
      });
      drawEdgeText(ctx, api, `${name}   ${x} ms / ${y}`, 1430, 440 + i * 145, 26, color);
      if (i)
        drawEdgeText(
          ctx,
          api,
          'Quality drop ' + (0.94 - y).toFixed(3),
          1430,
          489 + i * 145,
          29,
          color,
        );
    });
    if (currentBeat === 0) {
      const items = ['tokenizer', 'retrieval', 'template', 'sampling', 'paired outputs'];
      items.forEach((name, i) =>
        drawEdgeCard(
          ctx,
          api,
          (q * 5 > i ? '✓ ' : '') + name,
          1430,
          365 + i * 112,
          330,
          q * 5 > i ? themeColors.green : themeColors.muted,
          75,
        ),
      );
    }
    if (currentBeat === 2 && done('feasible'))
      drawEdgeText(
        ctx,
        api,
        'INT8 qualifies in this worksheet; INT4 fails quality',
        960,
        970,
        31,
        themeColors.green,
        'center',
      );
    note(
      'Point estimates only; paired uncertainty and exact exported artifact checks remain required',
    );
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'export-quality',
  draw: drawExportQuality,
  cues: [
    'edge-export-quality-op-0',
    'edge-export-quality-op-1',
    'edge-export-quality-baseline',
    'edge-export-quality-int8',
    'edge-export-quality-int4',
    'edge-export-quality-op-2',
    'edge-export-quality-feasible',
  ],
};
