import { LOGITS, WORDS } from '../fixtures.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function paintSoftmaxCompleteGradientChain(
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
  if (b === 0) {
    const n = progress('jacobian-nudge') * 0.15,
      z = LOGITS.map((v, i) => v + Number(i === 1) * n),
      q = stableSoftmax(z);
    drawCompleteHead(ctx, api, C, 'Raise only slept · the shared denominator moves every share');
    WORDS.forEach((w, i) => {
      drawCompleteText(ctx, api, C, w, xs[i], 355, 34, colors[i], 'center');
      drawCompleteBox(ctx, api, C, z[i].toFixed(3), xs[i], 435, 290, 80, colors[i]);
      if (i === 1 && n > 0)
        drawCompleteText(ctx, api, C, '+' + n.toFixed(3), xs[i] + 185, 445, 27, C.yellow);
    });
    drawCompleteRow(ctx, api, C, colors, xs, q, 540, WORDS, 160);
    drawCompleteText(
      ctx,
      api,
      C,
      'sum = ' + q.reduce((a, v) => a + v, 0).toFixed(6),
      960,
      815,
      30,
      C.cyan,
      'center',
    );
    if (started('jacobian-formula'))
      drawCompleteEquation(ctx, api, C, 'J_{ij}=p_i(\u03b4_{ij}-p_j)', 960, 910, 43, C.yellow);
    if (started('jacobian-column'))
      drawCompleteText(
        ctx,
        api,
        C,
        'For each changed logit: gains + losses = 0',
        960,
        980,
        30,
        C.cyan,
        'center',
      );
  } else if (b === 1) {
    drawCompleteHead(ctx, api, C, 'Three routes into the same slept probability');
    drawCompleteText(ctx, api, C, 'change a score', 245, 370, 29, C.muted);
    drawCompleteText(ctx, api, C, 'local slope of p(slept)', 960, 370, 29, C.muted, 'center');
    drawCompleteText(ctx, api, C, 'loss slope', 1590, 370, 29, C.muted, 'center');
    const ids = ['jacobian-ran', 'jacobian-self', 'jacobian-ate'];
    WORDS.forEach((w, i) => {
      const y = 480 + i * 160;
      drawCompleteBox(ctx, api, C, w, 370, y, 300, 78, colors[i]);
      if (started(ids[i])) {
        drawCompleteArrow(ctx, api, C, 540, y, 750, y, colors[i]);
        drawCompleteBox(ctx, api, C, m.jacobian[1][i].toFixed(6), 960, y, 340, 78, colors[i]);
      }
    });
    if (started('jacobian-loss-slope')) {
      drawCompleteArrow(ctx, api, C, 1170, 640, 1390, 640, C.yellow);
      drawCompleteEquation(ctx, api, C, '-1/p_{slept}', 1590, 590, 38, C.yellow);
      drawCompleteText(ctx, api, C, m.targetSlope.toFixed(4), 1590, 700, 36, C.yellow, 'center');
    }
    drawCompleteNote(
      ctx,
      api,
      C,
      'These derivatives are local slopes at [3, 1, 0], not a finite +1 change.',
    );
  } else {
    drawCompleteHead(ctx, api, C, 'Multiply each probability route by the same loss slope');
    WORDS.forEach((w, i) => {
      const y = 415 + i * 175;
      drawCompleteText(ctx, api, C, w, 240, y + 12, 33, colors[i]);
      drawCompleteEquation(ctx, api, C, m.jacobian[1][i].toFixed(6), 570, y + 12, 34, colors[i]);
      drawCompleteText(ctx, api, C, '×', 820, y + 12, 38, C.ink, 'center');
      drawCompleteEquation(ctx, api, C, m.targetSlope.toFixed(4), 1030, y + 12, 34, C.yellow);
      if (started(i === 1 ? 'chain-target' : 'chain-competitor')) {
        drawCompleteArrow(ctx, api, C, 1210, y, 1350, y, colors[i]);
        drawCompleteBox(
          ctx,
          api,
          C,
          (m.chain[i] >= 0 ? '+' : '') + m.chain[i].toFixed(6),
          1550,
          y,
          330,
          80,
          colors[i],
        );
      }
    });
    if (started('chain-normalized'))
      drawCompleteEquation(
        ctx,
        api,
        C,
        '\u2207_z L=p-y\\quad(\u2211_i y_i=1)',
        960,
        950,
        42,
        C.cyan,
      );
    drawCompleteNote(
      ctx,
      api,
      C,
      'The independently checked finite difference follows this same logit-to-loss function.',
    );
  }
}
export function drawGradientChainStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteGradientChain);
}
export default {
  id: 'gradient-chain',
  draw: drawGradientChainStage,
  cues: [
    'gradient-chain-0',
    'jacobian-nudge',
    'jacobian-formula',
    'jacobian-column',
    'gradient-chain-1',
    'jacobian-self',
    'jacobian-ran',
    'jacobian-ate',
    'jacobian-loss-slope',
    'gradient-chain-2',
    'chain-target',
    'chain-competitor',
    'chain-normalized',
  ],
};
