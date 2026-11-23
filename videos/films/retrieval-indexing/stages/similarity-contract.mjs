import {
  drawExtensionArrow,
  drawExtensionBox,
  drawExtensionEquation,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawSimilarityContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('similarity-contract-construction', () => {
    if (currentBeat === 0) {
      drawExtensionEquation(
        ctx,
        api,
        String.raw`q\cdot d=\sum_i q_i d_i`,
        960,
        410,
        57,
        themeColors.cyan,
      );
      if (resultComplete('cosine-denominator'))
        drawExtensionEquation(
          ctx,
          api,
          String.raw`\cos(q,d)=\frac{q\cdot d}{\|q\|_2\|d\|_2}`,
          960,
          610,
          58,
          themeColors.green,
        );
      if (resultComplete('unit-dot'))
        drawExtensionText(
          ctx,
          api,
          'Nonzero unit vectors: dot = cosine',
          960,
          810,
          36,
          themeColors.green,
          'center',
        );
      if (cueVisible('zero-vector'))
        drawExtensionBox(
          ctx,
          api,
          '‖d‖=0 → undefined direction → declared guard',
          200,
          910,
          1500,
          80,
          themeColors.pink,
          30,
        );
    } else if (currentBeat === 1) {
      const plot = api.teaching.axes({
        x: 190,
        y: 430,
        width: 1040,
        height: 320,
        xDomain: [0, 6.5],
        yDomain: [0, 2],
        xTicks: [0, 1, 3, 6],
        yTicks: [0, 0.8, 2],
        xLabel: 'coordinate 1',
        yLabel: 'coordinate 2',
        equalUnits: true,
        fontSize: 23,
      });
      const start = plot.point(0, 0),
        a = plot.point(1, 0.8),
        z = plot.point(6, 0);
      drawExtensionArrow(ctx, api, start.x, start.y, a.x, a.y, themeColors.green);
      drawExtensionText(ctx, api, 'q = A = [1,0.8,0]', a.x + 20, a.y - 35, 28, themeColors.green);
      drawExtensionArrow(
        ctx,
        api,
        start.x,
        start.y,
        z.x,
        z.y,
        themeColors.pink,
        progress('scaled-b'),
      );
      drawExtensionText(ctx, api, 'B = [6,0,0]', z.x - 40, z.y + 75, 28, themeColors.pink, 'right');
      if (resultComplete('aligned-a')) {
        drawExtensionText(ctx, api, 'A · dot 1.64', 1380, 410, 31, themeColors.green);
        drawExtensionText(ctx, api, 'A · cosine 1', 1380, 480, 31, themeColors.green);
      }
      if (resultComplete('scaled-b')) {
        drawExtensionText(ctx, api, 'B · dot 6 wins', 1380, 640, 31, themeColors.pink);
        drawExtensionText(ctx, api, 'B · cosine 0.781 loses', 1380, 710, 29, themeColors.pink);
      }
      drawExtensionNote(
        ctx,
        api,
        'Same direction versus larger norm: the intended metric determines the winner.',
      );
    } else {
      drawExtensionText(ctx, api, 'One stored vector contract', 150, 300, 35, themeColors.cyan);
      [
        ['model version', 'DPR-style inner product'],
        ['normalization', 'model-defined norm information'],
        ['query metric', 'must match the indexed objective'],
      ].forEach(([a, z], i) => {
        drawExtensionText(ctx, api, a, 180, 455 + i * 170, 29, themeColors.muted);
        drawExtensionBox(ctx, api, z, 650, 410 + i * 170, 1080, 85, themeColors.blue, 31);
      });
      if (cueVisible('metric-contract'))
        drawExtensionNote(
          ctx,
          api,
          'Changing to cosine changes the model contract; evaluate the intended retrieval quality.',
        );
    }
  });
  return true;
}
export default {
  id: 'similarity-contract',
  draw: drawSimilarityContract,
  cues: [
    'cosine-denominator',
    'unit-dot',
    'zero-vector',
    'aligned-a',
    'scaled-b',
    'direction-scale',
    'metric-contract',
  ],
};
