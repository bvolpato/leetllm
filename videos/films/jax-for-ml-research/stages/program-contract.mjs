import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress } from '../../../lib/lesson-definition.mjs';

export function drawProgramContract(ctx, scene, state, api) {
  const { C } = api;
  const returned = operationProgress(state, 'program-return') > 0;
  api.text(ctx, 'train_step(params, velocity, batch, key)', 110, 277, 56, C.ink, 'left', 'mono');
  api.focus.target('program-state', () => {
    const names = ['Parameters', 'Momentum', 'Random key'];
    const old = ['w₀, b₀', 'v₀', 'K₀'];
    const next = ['w₁, b₁', 'v₁', 'K₁'];
    drawLeftText(ctx, api, 'Into this step', 555, 390, 32, C.muted);
    drawLeftText(ctx, api, 'Into the next step', 1265, 390, 32, C.muted);
    names.forEach((name, i) => {
      const y = 500 + 130 * i;
      drawLeftText(ctx, api, name, 112, y, 41, C.muted);
      drawLeftText(ctx, api, old[i], 560, y, 52, C.blue);
      api.arrow(ctx, 810, y - 15, 1190, y - 15, returned ? C.cyan : C.muted, 4);
      drawLeftText(ctx, api, returned ? next[i] : '?', 1270, y, 52, returned ? C.green : C.muted);
    });
  });
  drawText(
    ctx,
    api,
    returned
      ? 'The caller keeps the returned state and records the loss.'
      : 'The batch supplies the examples for this step.',
    960,
    933,
    38,
    C.ink,
  );
}
export default {
  id: 'program-contract',
  draw: drawProgramContract,
  cues: ['program-call', 'program-return'],
};
