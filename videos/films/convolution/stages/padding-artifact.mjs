import { paddedUniform } from '../model.mjs';
import { correlate } from '../arithmetic.mjs';
import { cueClock, footprint } from '../footprint.mjs';
import {
  chapterEquation,
  chapterText,
  constructionFocus,
  formatChapterValue,
  valueGrid,
} from '../defaults.mjs';

function compareTopWindows(ctx, api, cue) {
  const surface = paddedUniform();
  const gray = surface.image[0][0];
  const lit = Math.floor(3 * cue('padding-artifact-b3'));
  const copied = cue('stripe-reflect');
  const y = 358;
  const pitch = 124;
  const row = (value) => [value, value, value];
  const stripe = row(gray).map((v, col) => col < lit ? 1 : v);
  for (const [i, name] of ['Zero padding', 'Reflection'].entries()) {
    const x = 350 + i * 835;
    const center = x + (3 * pitch - 7) / 2;
    const padding = i === 0 ? row(0) : stripe;
    const patch = [padding, row(gray), stripe];
    const pending = i === 1 && lit > 0 && copied < 1;
    chapterText(ctx, api, name, center, 291, 43, api.C.ink, 'center');
    valueGrid(ctx, api, pending ? [row('?'), ...patch.slice(1)] : patch, x, y, pitch, {
      kind: 'image',
      font: 38,
    });
    footprint(ctx, api, x, y, pitch, 0, 0, 1, 3, api.C.cyan);
    if (lit > 0) footprint(ctx, api, x, y, pitch, 2, 0, 1, 3, api.C.yellow);
    if (i === 1 && copied > 0) {
      const right = x + 3 * pitch;
      const bottom = y + 2.5 * pitch;
      const top = y + 0.5 * pitch;
      const lane = right + 65;
      api.line(ctx, right, bottom, lane, bottom, api.C.cyan, 3);
      api.line(ctx, lane, bottom, lane, api.lerp(bottom, top, copied), api.C.cyan, 3);
      if (copied === 1) api.arrow(ctx, lane, top, right + 5, top, api.C.cyan, 3);
    }
    const ready = i === 0 ? cue('stripe-zero') === 1 : cue('stripe-result') === 1;
    const result = ready ? formatChapterValue(correlate(patch, surface.kernel)[0][0]) : '?';
    chapterText(ctx, api, 'Response  ' + result, center, 850, 43, api.C.ink, 'center');
  }
  for (const [i, label] of ['Added row', 'Edge of panel', 'One row in'].entries()) {
    chapterText(ctx, api, label, 950, y + pitch * i + 73, 32, [api.C.cyan, api.C.ink, api.C.yellow][i], 'center');
  }
  chapterText(ctx, api, 'Sum of top row − sum of bottom row', 950, 961, 35, api.C.ink, 'center');
}

export function drawPaddingArtifact(ctx, scene, state, api) {
  ctx.save();

  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = cueClock(scene, state, api);
  constructionFocus(ctx, api, 'padding-artifact', () => {
    if (currentBeat === 2) return compareTopWindows(ctx, api, cue);
    const q = currentBeat === 0 ? 0 : cue('reflect-padding'),
      mode = q > 0 ? 'reflect' : 'zero',
      f = paddedUniform(mode),
      answer = mode === 'zero' ? cue('false-edge') === 1 : cue('reflect-result') === 1;
    chapterText(
      ctx,
      api,
      'Uniform gray panel · brightness 0.6',
      960,
      285,
      31,
      themeColors.blue,
      'center',
    );
    valueGrid(ctx, api, f.padded, 235, 340, 70, {
      kind: 'image',
      font: 24,
    });
    const windowRow = currentBeat === 0 ? 2 - Math.round(2 * cue('padding-artifact-b1')) : 0;
    footprint(ctx, api, 235, 340, 70, windowRow, 2, 3, 3);
    valueGrid(ctx, api, f.kernel, 905, 370, 85, {
      kind: 'kernel',
      font: 30,
    });
    chapterText(
      ctx,
      api,
      mode + ' padding',
      490,
      930,
      35,
      mode === 'zero' ? themeColors.pink : themeColors.green,
      'center',
    );
    const hidden = f.result.map((row) => row.map((v) => (answer ? v : '?')));
    valueGrid(ctx, api, hidden, 1350, 350, 70, {
      kind: 'gradient',
      font: 25,
    });
    if (answer) {
      chapterText(
        ctx,
        api,
        'max |response| = ' + formatChapterValue(f.maxAbs),
        1510,
        910,
        37,
        mode === 'zero' ? themeColors.pink : themeColors.green,
        'center',
      );
      chapterEquation(
        ctx,
        api,
        mode === 'zero' ? '0+0-1.8=-1.8' : '1.8+0-1.8=0',
        995,
        850,
        36,
        mode === 'zero' ? themeColors.pink : themeColors.green,
      );
    }
    return;
  });

  ctx.restore();
}
export default {
  id: 'padding-artifact',
  draw: drawPaddingArtifact,
  cues: [
    'padding-artifact-b1',
    'false-edge',
    'padding-artifact-b2',
    'reflect-padding',
    'reflect-result',
    'padding-artifact-b3',
    'stripe-zero',
    'stripe-reflect',
    'stripe-result',
  ],
};
