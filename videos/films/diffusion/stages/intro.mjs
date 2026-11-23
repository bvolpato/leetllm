import { drawPixelTile } from '../defaults.mjs';
import { TOP_PIXEL } from '../fixtures.mjs';
import { image } from '../model.mjs';
import {
  afterPhrase,
  blend,
  cueProgress,
  decimal,
  drawPair,
  exposure,
  worksheet,
} from '../pixel-study.mjs';

const jump = worksheet(0.5, 0.9);

function showTable(ctx, state, api) {
  const clearTime = state.cues?.['table-clear']?.end ?? 2.4;
  const progress = api.clamp(state.t / clearTime);
  const alpha = api.lerp(0.36, 1, progress);
  const pixels = exposure(alpha);
  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('pixel-working', () =>
    drawPixelTile(ctx, api, 190, 220, 710, pixels, TOP_PIXEL),
  );
  api.focus.target('pixel-brightness', () => {
    api.text(ctx, 'Brightness of the marked pixel', 1045, 420, 41, api.C.ink);
    api.text(ctx, decimal(pixels[TOP_PIXEL]), 1035, 565, 122, api.C.yellow);
    api.text(ctx, 'Retained signal variance', 1045, 730, 32, api.C.muted);
    api.rect(ctx, 1045, 770, 525, 18, api.C.panel, undefined, 4);
    api.rect(ctx, 1045, 770, 525 * alpha, 18, api.C.cyan, undefined, 4);
    api.text(ctx, Math.round(alpha * 100) + '%', 1605, 795, 38, api.C.cyan);
  });
  ctx.restore();
}

export function drawIntro(ctx, scene, state, api) {
  if (state.beat === 0) return showTable(ctx, state, api);
  const first = cueProgress(state, 'table-first-exposure', 1);
  const next = cueProgress(state, 'table-second-exposure', 2);
  const saved = afterPhrase(state, 'table-save', 2);
  const returning = state.beat === 3;
  const travel = cueProgress(state, 'table-return', 3);
  const alpha = 1 - 0.1 * first - 0.4 * next;
  const landed = returning && travel === 1;
  drawPair(ctx, api, {
    left: {
      title: saved ? 'Saved exposure' : 'Clean reference',
      subtitle: saved ? 'Retained variance  0.90' : '16 × 16 pixels',
      pixels: saved ? jump.reference : image,
    },
    right: {
      title: returning ? 'Sampler output' : 'Working copy',
      subtitle: returning ? 'Jump from 0.50 to 0.90' : `Retained variance  ${alpha.toFixed(2)}`,
      pixels: returning ? blend(jump.input, jump.destination, travel) : exposure(alpha),
    },
    notes: landed
      ? ['Same pixel', 'Readings match']
      : next === 1
        ? ['Return to 0.90', 'Which reading?']
        : ['Noise at this pixel', 'ε = −0.400', 'Same noise field'],
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'table-clear',
    'table-edge',
    'table-first-exposure',
    'table-save',
    'table-second-exposure',
    'table-question',
    'table-return',
  ],
};
