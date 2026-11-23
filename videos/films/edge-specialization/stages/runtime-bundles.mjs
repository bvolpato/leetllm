import { operations } from '../fixtures.mjs';
import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeL, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawRuntimeBundles(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('runtime-bundles', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-runtime-bundles-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Inspect the generated partition and its required files'
        : currentBeat === 1
          ? 'A compute plan names the owner of each actual operation'
          : 'Keep every runtime’s complete asset set together',
    );
    if (currentBeat === 0) {
      const owners = ['backend', 'CPU fallback', 'backend'];
      operations.forEach((op, i) => {
        const x = 180 + i * 540;
        drawEdgeCard(ctx, api, op.name, x, 395, 400, themeColors.blue, 100);
        drawEdgeCard(
          ctx,
          api,
          owners[i],
          x,
          545,
          400,
          i === 1 ? themeColors.pink : themeColors.green,
          85,
        );
        if (i < 2) drawEdgeL(ctx, api, x + 400, 445, x + 540, 445, themeColors.cyan, 3);
        if (q * 3 > i)
          drawEdgeText(
            ctx,
            api,
            'partition ' + (i + 1),
            x + 200,
            700,
            28,
            themeColors.yellow,
            'center',
          );
      });
      drawEdgeRow(
        ctx,
        api,
        ['graph.pte', 'weight assets', 'backend library / CPU kernels'],
        150,
        845,
        1600,
        90,
        themeColors.cyan,
      );
    } else if (currentBeat === 1) {
      drawEdgeRow(
        ctx,
        api,
        ['model package', 'compiled model', 'selected configuration'],
        150,
        355,
        1600,
        90,
        themeColors.blue,
      );
      drawEdgeRow(
        ctx,
        api,
        ['Operation', 'compute owner', 'supported in this illustrated plan'],
        150,
        510,
        1600,
        80,
        themeColors.cyan,
      );
      operations.forEach((op, i) => {
        if (q * 3 >= i)
          drawEdgeRow(
            ctx,
            api,
            [op.name, i === 1 ? 'CPU' : 'GPU', 'inspect actual plan'],
            150,
            620 + i * 100,
            1600,
            75,
            i === 1 ? themeColors.yellow : themeColors.green,
          );
      });
    } else {
      const packs = [
        ['MLC', 'converted weights', 'configuration', 'compiled model library'],
        ['ONNX Mobile', 'compatible model', 'platform runtime', 'GenAI orchestration'],
        ['llama.cpp', 'supported GGUF', 'architecture code', 'selected backend kernels'],
      ];
      packs.forEach((r, i) => {
        const y = 375 + i * 190;
        drawEdgeText(ctx, api, r[0], 160, y, 31, themeColors.blue);
        r.slice(1).forEach((v, j) => {
          if (q * 3 >= j)
            drawEdgeCard(
              ctx,
              api,
              v,
              490 + j * 425,
              y - 45,
              400,
              [themeColors.blue, themeColors.cyan, themeColors.green][j],
              95,
            );
        });
      });
    }
    note(
      'Illustrative inventory and partition; no mobile bundle or compute plan was generated here',
    );
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'runtime-bundles',
  draw: drawRuntimeBundles,
  cues: [
    'edge-runtime-bundles-op-0',
    'edge-runtime-bundles-pte',
    'edge-runtime-bundles-op-1',
    'edge-runtime-bundles-compute',
    'edge-runtime-bundles-op-2',
    'edge-runtime-bundles-mlc',
    'edge-runtime-bundles-assets',
  ],
};
