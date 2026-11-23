import { rng } from '../arithmetic.mjs';
import { nextLogits, nextProbabilities, tokenDraws } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

const names = ['result', 'value', 'None', 'banana'];
const colors = ['blue', 'pink', 'cyan', 'green'];
const firstDraw = rng(7);
const draws = [firstDraw(), firstDraw()];
const left = 185, width = 1550;
const largest = Math.max(...nextLogits);

function strip(ctx, api, y, reveal = 1) {
  const edge = left + width * reveal;
  rectangle(ctx, api, left, y, width, 95, api.C.panel);
  let x = left;
  nextProbabilities.forEach((p, i) => {
    const length = width * p;
    const visible = Math.min(length, edge - x);
    if (visible > 0) rectangle(ctx, api, x, y, visible, 95, api.C[colors[i]]);
    x += length;
  });
}

export function drawSoftmaxSampling(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b) => cueProgress(state, id, b);
  text(ctx, api, 'Prefix   “function returns the”', 185, 255, 42, C.ink, 'left');
  if (beat < 2) {
    focus(api, 'softmax-normalization', () => {
      const shift = largest * q('softmax-shift', 1);
      const weights = nextLogits.map(v => Math.exp(v - shift));
      const denom = weights.reduce((a, b) => a + b);
      const normalized = q('softmax-mass', 0);
      text(ctx, api, 'Next token', 190, 378, 38, C.muted, 'left');
      text(ctx, api, shift ? 'Shifted logit' : 'Logit', 190, 482, 37, C.muted, 'left');
      if (normalized > 0) text(ctx, api, 'Exponential', 190, 580, 37, C.muted, 'left');
      names.forEach((token, i) => {
        const x = 630 + i * 330;
        text(ctx, api, token, x, 378, 50, C[colors[i]]);
        text(ctx, api, (nextLogits[i] - shift).toFixed(2), x, 482, 45);
        if (normalized > 0) text(ctx, api, weights[i].toFixed(3), x, 580, 42);
      });
      strip(ctx, api, 730, normalized);
      if (normalized > 0) text(ctx, api, 'Divide each weight by their sum   ' + denom.toFixed(3), left, 686, 39, C.yellow, 'left');
      if (normalized === 1) {
        const proportions = nextProbabilities.map((p, i) => names[i] + '   ' + p.toFixed(3));
        proportions.forEach((label, i) => text(ctx, api, label, 320 + i * 430, 918, 38, C[colors[i]]));
      }
      if (shift === largest) text(ctx, api, 'Odds of result vs. value   exp(0.8) ≈ 2.23 to 1', 960, 1008, 39, C.yellow);
    });
    return;
  }
  focus(api, 'sampling-counts', () => {
    const stripY = 495;
    strip(ctx, api, stripY);
    let start = left;
    names.forEach((name, i) => {
      const w = width * nextProbabilities[i];
      const mid = start + w / 2;
      if (w >= 100) {
        text(ctx, api, name, mid, stripY + 63, 40, C.bg);
      } else {
        text(ctx, api, name, mid, 415, 40, C[colors[i]], 'right');
        line(ctx, api, mid, 436, mid, stripY - 8, C[colors[i]], 3);
      }
      start += w;
    });
    const second = q('second-draw', 2) === 1;
    if (q('first-draw', 2) === 1) {
      const i = second ? 1 : 0;
      const u = draws[i], x = left + width * u;
      line(ctx, api, x, stripY + 85, x, stripY + 132, C.ink, 5);
      api.circle(ctx, x, stripY + 86, 7, C.ink);
      const align = u > 0.8 ? 'right' : 'left';
      text(ctx, api, 'Draw ' + (i + 1) + '   ' + u.toFixed(3) + ' → ' + names[tokenDraws[i]], x, 685, 43, C.ink, align);
    }
    const n = beat < 3 ? 0 : 2 + Math.floor(998 * q('sampling-draws', 3));
    if (n) {
      const counts = [0, 0, 0, 0];
      for (let j = 0; j < n; j++) counts[tokenDraws[j]]++;
      names.forEach((name, i) => text(ctx, api, name + '   ' + counts[i], 322 + i * 425, 850, 39, C[colors[i]]));
      text(ctx, api, n + ' draws from the same distribution', 960, 950, 44, C.yellow);
    } else {
      text(ctx, api, 'Greedy choice   result', left, 870, 45, C.blue, 'left');
      text(ctx, api, 'Sample   draw uniformly on [0, 1)', left, 950, 41, C.ink, 'left');
    }
  });
}
export default {
  id: 'softmax-sampling', draw: drawSoftmaxSampling,
  cues: ['softmax-mass', 'softmax-shift', 'first-draw', 'second-draw', 'sampling-draws'],
};
