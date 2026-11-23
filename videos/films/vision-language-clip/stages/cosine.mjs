import { dotProduct, normalizeVector } from 'vizmatic';
import { spokenProgress } from '../construction.mjs';
import { drawClipText } from '../defaults.mjs';

const image = [1, 0];
const captions = [
  [0.8, 0.6],
  [9, 12],
];
const rawDots = captions.map((v) => dotProduct(image, v));
const cosines = captions.map((v) => dotProduct(image, normalizeVector(v)));

export function drawCosine(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const amount = spokenProgress(state, 'norm-shorten', 1);
  const unitView = beat >= 2;
  const end = unitView ? 1 : 10;
  const left = 368,
    right = 1648;
  const point = (score) => left + ((right - left) * score) / end;
  const colors = [C.cyan, C.yellow];
  drawClipText(
    ctx,
    api,
    unitView
      ? 'Unit-length detail   ·   scores from 0 to 1'
      : 'Image [1, 0] reads the horizontal component',
    960,
    296,
    39,
  );
  const ticks = unitView ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 2, 4, 6, 8, 10];
  const scoreRows = [520, 710];
  ticks.forEach((v) => {
    for (const y of scoreRows) api.line(ctx, point(v), y - 22, point(v), y + 65, C.line, 2);
    drawClipText(ctx, api, v.toString(), point(v), 842, 33, C.muted);
  });
  api.focus.target('norm-ruler', () => {
    captions.forEach((vector, i) => {
      const y = scoreRows[i];
      const dot = rawDots[i] + (cosines[i] - rawDots[i]) * amount;
      const x = point(dot);
      api.text(ctx, 'Caption ' + (i ? 'B' : 'A'), left - 52, y + 15, 36, colors[i], 'right');
      api.line(ctx, left, y, x, y, colors[i], 12);
      api.circle(ctx, x, y, 15, colors[i]);
      if (!unitView && i === 1 && amount > 0) {
        api.circle(ctx, point(rawDots[i]), y, 15, 'transparent', C.muted, 3);
        api.line(ctx, x + 18, y, point(rawDots[i]) - 18, y, C.muted, 2);
      }
      drawClipText(ctx, api, dot.toFixed(2), x, y - 43, 40, colors[i]);
    });
  });
  let detail = 'At unit length, which caption leads?';
  if (beat === 1) detail = 'A   ÷ 1        B   ÷ 15';
  if (beat === 2) detail = 'A   [0.8, 0.6]        B   [0.6, 0.8]';
  if (beat === 3) detail = 'Check each norm, including the norm of a prompt average.';
  drawClipText(ctx, api, detail, 960, 974, 39);
  if (beat === 0) {
    api.text(ctx, '[0.8, 0.6]', left - 52, 589, 29, C.muted, 'right');
    api.text(ctx, '[9, 12]', left - 52, 779, 29, C.muted, 'right');
  }
}

export default {
  id: 'cosine',
  draw: drawCosine,
  cues: ['norm-raw', 'norm-shorten', 'norm-detail'],
};
