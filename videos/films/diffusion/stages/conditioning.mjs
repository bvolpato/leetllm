import { drawPixelTile } from '../defaults.mjs';
import { TOP_PIXEL, SHADOW_PIXEL } from '../fixtures.mjs';
import { image } from '../model.mjs';
import { cueProgress } from '../pixel-study.mjs';

export function drawConditioning(ctx, scene, state, api) {
  const move = cueProgress(state, 'conditioning-weights', 1);
  const update = cueProgress(state, 'conditioning-next-step', 2);
  const col = Math.round(api.lerp(TOP_PIXEL % 16, SHADOW_PIXEL % 16, move));
  const row = Math.round(api.lerp(Math.floor(TOP_PIXEL / 16), Math.floor(SHADOW_PIXEL / 16), move));
  const transfer = Math.round(40 * move - 8 * update);
  const shares = [55 - transfer, 25, 15, 5 + transfer];
  const words = ['wooden', 'table', 'soft', 'light'];
  api.focus.target('conditioning-query', () => {
    api.text(ctx, 'Location of the image query', 450, 257, 39, api.C.ink, 'center');
    drawPixelTile(ctx, api, 175, 308, 550, image, 16 * row + col);
    const location = move === 0 ? 'Tabletop' : move < 1 ? 'Moving into the shadow' : 'Shadow';
    api.text(ctx, location, 450, 936, 39, api.C.yellow, 'center');
  });
  api.focus.target('conditioning-prompt', () => {
    api.text(ctx, 'Prompt words', 875, 275, 34, api.C.cyan);
    words.forEach((word, i) => api.text(ctx, word, 875, 400 + 119 * i, 46, api.C.cyan));
  });
  api.focus.target('conditioning-attention', () => {
    api.text(ctx, 'Example attention weights', 1132, 275, 34, api.C.ink);
    for (const [i, share] of shares.entries()) {
      const y = 367 + 119 * i;
      api.rect(ctx, 1132, y, 480, 32, api.C.panel, undefined, 5);
      api.rect(ctx, 1132, y, (480 * share) / 100, 32, api.C.yellow, undefined, 5);
      api.text(ctx, share + '%', 1650, y + 34, 38, api.C.yellow);
    }
    api.text(
      ctx,
      update > 0 ? 'Next denoising step' : 'Current denoising step',
      1170,
      936,
      36,
      api.C.muted,
    );
  });
}
export default {
  id: 'conditioning',
  draw: drawConditioning,
  cues: [
    'conditioning-prompt',
    'conditioning-query',
    'conditioning-weights',
    'conditioning-next-step',
  ],
};
