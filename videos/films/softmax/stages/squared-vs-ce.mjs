import { WORDS } from '../fixtures.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteHead,
  drawCompleteLine,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteSquaredVsCe(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  drawCompleteHead(ctx, api, C, 'Same logits [8, 0, 0] · middle class is correct');
  if (b === 0) {
    drawCompleteRow(ctx, api, C, colors, xs, m.certain, 400, WORDS, 270);
    drawCompleteText(ctx, api, C, 'target: slept', 960, 875, 38, C.green, 'center');
    if (started('brier-jacobian'))
      drawCompleteText(
        ctx,
        api,
        C,
        'small softmax factors remain near this confident wrong prediction',
        960,
        970,
        31,
        C.yellow,
        'center',
      );
  } else {
    drawCompleteText(ctx, api, C, 'probability-space slope', 430, 365, 29, C.muted, 'center');
    drawCompleteText(ctx, api, C, 'softmax route', 1000, 365, 29, C.muted, 'center');
    drawCompleteText(ctx, api, C, 'target logit gradient', 1510, 365, 29, C.muted, 'center');
    drawCompleteText(ctx, api, C, 'cross-entropy', 300, 470, 34, C.green);
    drawCompleteText(ctx, api, C, '−1 / p(target)', 470, 560, 35, C.green, 'center');
    drawCompleteArrow(ctx, api, C, 690, 550, 850, 550, C.green);
    drawCompleteBox(ctx, api, C, 'target Jacobian', 1030, 550, 320, 95, C.muted, 28);
    if (started('brier-ce-result') || b === 2) {
      drawCompleteArrow(ctx, api, C, 1230, 550, 1330, 550, C.green);
      drawCompleteBox(ctx, api, C, (m.certain[1] - 1).toFixed(6), 1530, 550, 330, 95, C.green, 35);
    }
    drawCompleteText(ctx, api, C, '½ squared probability error', 300, 690, 32, C.blue);
    drawCompleteText(ctx, api, C, 'p − y', 470, 790, 35, C.blue, 'center');
    drawCompleteArrow(ctx, api, C, 690, 780, 850, 780, C.blue);
    drawCompleteBox(ctx, api, C, 'full Jacobian', 1030, 780, 320, 95, C.muted, 28);
    if (started('brier-squared-result') || b === 2) {
      drawCompleteArrow(ctx, api, C, 1230, 780, 1330, 780, C.blue);
      drawCompleteBox(ctx, api, C, m.squared[1].toFixed(6), 1530, 780, 330, 95, C.blue, 35);
    }
    if (b === 2) {
      const factor = progress('brier-network');
      drawCompleteLine(ctx, api, C, 240, 930, 1680, 930, C.muted);
      drawCompleteText(
        ctx,
        api,
        C,
        'both then pass through the network Jacobians',
        960,
        985,
        31,
        C.yellow,
        'center',
      );
      if (factor > 0) drawCompleteArrow(ctx, api, C, 960, 870, 960, 930, C.yellow, 3);
    } else
      drawCompleteNote(
        ctx,
        api,
        C,
        'Actual computed derivatives; Brier includes the stated factor ½.',
      );
  }
}
export function drawSquaredVsCeStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteSquaredVsCe);
}
export default {
  id: 'squared-vs-ce',
  draw: drawSquaredVsCeStage,
  cues: [
    'squared-vs-ce-0',
    'brier-jacobian',
    'squared-vs-ce-1',
    'brier-ce-result',
    'brier-squared-result',
    'squared-vs-ce-2',
    'brier-network',
  ],
};
