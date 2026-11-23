import { spokenProgress } from '../construction.mjs';
import { drawClipText } from '../defaults.mjs';

const relevant = ['17', '08', '42'];
const retrieved = ['17', '08', '35'];
const tags = [
  ['RACK-17', 'RACK-17'],
  ['RACK-08', 'RACK-O8'],
];
const gates = [
  { label: 'Retrieval recall', score: 0.93, floor: 0.9 },
  { label: 'OCR exact match', score: 0.89, floor: 0.92 },
  { label: 'Grounding IoU', score: 0.73, floor: 0.7 },
];

export function drawRouteEvaluation(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  if (beat === 0) {
    const hit = relevant.filter((id) => retrieved.includes(id)).length;
    const exact = tags.filter(([truth, prediction]) => truth === prediction).length;
    const showOCR = spokenProgress(state, 'metric-ocr', 0) > 0;
    api.text(ctx, 'Archive search', 180, 326, 47, C.ink);
    api.text(ctx, 'Reviewed as relevant', 180, 476, 33, C.muted);
    api.text(ctx, 'First three results', 180, 603, 33, C.muted);
    relevant.forEach((id, i) => {
      const x = 290 + 135 * i;
      drawClipText(ctx, api, id, x, 544, 45, retrieved.includes(id) ? C.cyan : C.yellow);
      drawClipText(
        ctx,
        api,
        retrieved[i],
        x,
        670,
        45,
        relevant.includes(retrieved[i]) ? C.cyan : C.muted,
      );
    });
    drawClipText(ctx, api, 'Recall at 3    ' + hit + ' / ' + relevant.length, 435, 846, 39, C.cyan);
    api.line(ctx, 880, 283, 880, 895, C.line, 2);
    api.focus.target('metric-tags', () => {
      api.text(ctx, 'Printed tags', 1000, 326, 47, C.ink);
      if (!showOCR) return;
      for (const [x, label] of [
        [1000, 'Reviewed text'],
        [1440, 'OCR output'],
      ])
        api.text(ctx, label, x, 474, 33, C.muted);
      tags.forEach(([truth, prediction], i) => {
        api.text(ctx, truth, 1000, 569 + i * 100, 44, C.ink, 'left', 'mono');
        api.text(
          ctx,
          prediction,
          1440,
          569 + i * 100,
          44,
          truth === prediction ? C.cyan : C.yellow,
          'left',
          'mono',
        );
      });
      drawClipText(
        ctx,
        api,
        'Exact matches    ' + exact + ' / ' + tags.length,
        1370,
        846,
        39,
        C.yellow,
      );
    });
    drawClipText(
      ctx,
      api,
      'Supplied predictions   ·   technician-reviewed references',
      960,
      986,
      32,
      C.muted,
    );
    return;
  }
  if (beat === 1) {
    const size = 0.6,
      offset = 0.2 * spokenProgress(state, 'metric-shift', 1),
      intersection = (size - offset) ** 2,
      union = 2 * size ** 2 - intersection;
    const square = 630,
      x = 270,
      y = 367;
    const fill = spokenProgress(state, 'metric-intersection', 1);
    api.rect(ctx, x, y, square * size, square * size, 'transparent', C.blue, 1);
    api.rect(
      ctx,
      x + square * offset,
      y + square * offset,
      square * size,
      square * size,
      'transparent',
      C.pink,
      1,
    );
    if (fill > 0)
      api.rect(
        ctx,
        x + square * offset,
        y + square * offset,
        square * (size - offset) * fill,
        square * (size - offset),
        C.cyan,
        undefined,
        1,
      );
    api.text(ctx, 'Reviewed box', x, y - 37, 32, C.blue);
    api.text(
      ctx,
      'Predicted box',
      x + square * offset,
      y + square * (size + offset) + 64,
      32,
      C.pink,
    );
    api.focus.target('metric-area', () => {
      api.text(ctx, 'Two boxes, each 0.6 × 0.6', 997, 386, 37, C.ink);
      api.text(ctx, 'Offset ' + offset.toFixed(2) + ' on both axes', 997, 480, 35, C.muted);
      if (fill > 0) {
        api.text(ctx, 'Overlap    0.4 × 0.4 = ' + intersection.toFixed(2), 997, 611, 39, C.cyan);
        api.text(ctx, 'Union    0.36 + 0.36 - 0.16 = ' + union.toFixed(2), 997, 706, 35, C.ink);
      }
      if (spokenProgress(state, 'metric-iou', 1) > 0)
        api.text(
          ctx,
          'IoU    0.16 / 0.56 ≈ ' + (intersection / union).toFixed(3),
          997,
          837,
          41,
          C.cyan,
        );
    });
    drawClipText(
      ctx,
      api,
      'Coordinates measured as fractions of image width and height',
      960,
      1002,
      30,
      C.muted,
    );
    return;
  }
  const reveal = spokenProgress(state, 'release-diagnosis', 3) === 1;
  const misses = gates.filter((g) => g.score < g.floor);
  const headings = ['Capability', 'Held-out score', 'Required minimum'];
  [230, 900, 1390].forEach((x, i) => api.text(ctx, headings[i], x, 326, 34, C.muted));
  api.focus.target('release-bars', () => {
    gates.forEach(({ label, score, floor }, i) => {
      const y = 487 + i * 135;
      const color = reveal && score < floor ? C.yellow : C.ink;
      api.text(ctx, label, 230, y, 45, color);
      api.text(ctx, score.toFixed(2), 900, y, 49, color);
      api.text(ctx, floor.toFixed(2), 1390, y, 49, color);
    });
  });
  drawClipText(
    ctx,
    api,
    reveal
      ? 'Hold the full workflow    ·    ' +
          misses.map((g) => g.label).join(', ') +
          ' misses its bar'
      : 'Can the full inspection workflow ship?',
    960,
    965,
    43,
    reveal ? C.yellow : C.ink,
  );
}

export default {
  id: 'route-evaluation',
  draw: drawRouteEvaluation,
  cues: ['metric-ocr', 'metric-shift', 'metric-intersection', 'metric-iou', 'release-diagnosis'],
};
