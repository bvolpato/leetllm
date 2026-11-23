import { edgeNumeric } from '../arithmetic.mjs';
import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawCpuExport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('cpu-export', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-cpu-export-mechanism', () => {
    heading(
      currentBeat === 2
        ? 'Try an extra feature, then an extra row'
        : 'Run the same rows through the saved router',
    );
    const rows = [
        [-0.5, -0.2, 0.1],
        [0.8, 0.7, 0.6],
      ],
      out = rows.map(edgeNumeric);
    if (currentBeat === 0) {
      drawEdgeRow(ctx, api, ['x₀', 'x₁', 'x₂'], 200, 350, 1050, 75, themeColors.cyan);
      rows.forEach((r, i) =>
        drawEdgeRow(
          ctx,
          api,
          (done('clamp') ? out[i].clamped : r).map((v) => v.toFixed(1)),
          200,
          465 + i * 130,
          1050,
          95,
          themeColors.blue,
        ),
      );
      if (done('matrix')) {
        drawEdgeRow(ctx, api, ['−1', '−1', '−1'], 1360, 465, 410, 95, themeColors.pink);
        drawEdgeRow(ctx, api, ['1', '1', '1'], 1360, 595, 410, 95, themeColors.green);
      }
      drawEdgeText(
        ctx,
        api,
        'clamp each coordinate to [−1, 1], then apply the same matrix',
        960,
        850,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      rows.forEach((r, i) => {
        const y = 365 + i * 200;
        drawEdgeRow(ctx, api, r, 150, y, 600, 95, themeColors.blue);
        if (done('logits'))
          drawEdgeRow(
            ctx,
            api,
            out[i].logits.map((v) => v.toFixed(1)),
            950,
            y,
            550,
            95,
            themeColors.green,
          );
        if (done('logits'))
          drawEdgeCard(ctx, api, `class ${out[i].class}`, 1580, y, 200, themeColors.yellow, 95);
      });
      if (done('roundtrip'))
        drawEdgeRow(
          ctx,
          api,
          ['batch 1 PASS', 'batch 2 PASS', 'batch 5 PASS', 'batch 8 PASS'],
          150,
          850,
          1600,
          95,
          themeColors.green,
        );
    } else {
      drawEdgeRow(
        ctx,
        api,
        ['shape', 'reloaded export', 'eager'],
        150,
        350,
        1600,
        90,
        themeColors.cyan,
      );
      drawEdgeRow(
        ctx,
        api,
        ['2 rows × 4 features', done('reject') ? 'REJECT' : 'pending', 'matrix needs 3 features'],
        150,
        500,
        1600,
        95,
        themeColors.pink,
      );
      drawEdgeRow(
        ctx,
        api,
        [
          '9 rows × 3 features',
          done('reject') ? 'REJECT' : 'pending',
          done('eager') ? 'ACCEPT' : 'pending',
        ],
        150,
        665,
        1600,
        95,
        themeColors.yellow,
      );
      drawEdgeText(
        ctx,
        api,
        'Captured: feature width 3 · dynamic batch 1…8',
        960,
        900,
        32,
        themeColors.blue,
        'center',
      );
    }
    note('PyTorch 2.14   /   CPU export and reload');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'cpu-export',
  draw: drawCpuExport,
  cues: [
    'edge-cpu-export-op-0',
    'edge-cpu-export-clamp',
    'edge-cpu-export-matrix',
    'edge-cpu-export-op-1',
    'edge-cpu-export-logits',
    'edge-cpu-export-roundtrip',
    'edge-cpu-export-op-2',
    'edge-cpu-export-reject',
    'edge-cpu-export-eager',
  ],
};
