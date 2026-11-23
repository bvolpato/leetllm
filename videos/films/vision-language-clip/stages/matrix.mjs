import { FIXTURE } from '../observations.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawClipText } from '../defaults.mjs';

const captionNames = ['Blocked vent', 'Taped tag', 'Clear door'];
const imageNames = ['Photo 17', 'Photo 08', 'Photo 42'];

// The loss scene uses these same cells. Row is always an image, column is always a caption.
export function drawBatch(ctx, api, { values, digits, diagonal = false, row, column }) {
  const { C } = api;
  const left = 420,
    top = 398,
    width = 242,
    height = 128;
  drawClipText(ctx, api, 'Captions', left + 1.5 * width, 275, 32, C.muted);
  captionNames.forEach((label, j) =>
    drawClipText(ctx, api, label, left + (j + 0.5) * width, 359, 31, C.ink),
  );
  values.forEach((scores, i) => {
    const y = top + i * height;
    api.text(ctx, imageNames[i], left - 39, y + 80, 37, C.ink, 'right');
    scores.forEach((value, j) => {
      const x = left + j * width;
      const active = i === row || j === column;
      api.rect(
        ctx,
        x + 3,
        y + 3,
        width - 6,
        height - 6,
        active ? C.blue : C.panel,
        active ? C.blue : C.line,
        5,
      );
      drawClipText(
        ctx,
        api,
        value.toFixed(digits),
        x + width / 2,
        y + 80,
        43,
        active ? C.bg : C.ink,
      );
      if (diagonal && i === j) api.circle(ctx, x + 24, y + 24, 8, active ? C.bg : C.yellow);
    });
  });
}

export function drawMatrix(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const scaled = spokenProgress(state, 'matrix-scale', 1) > 0;
  const paired = spokenProgress(state, 'matrix-pairs', 0) > 0;
  api.focus.target('batch-grid', () =>
    drawBatch(ctx, api, {
      values: scaled ? FIXTURE.logits : FIXTURE.cosine,
      digits: scaled ? 2 : 3,
      diagonal: paired,
    }),
  );
  const left = 1250;
  api.text(ctx, 'Photo 17 × blocked vent', left, 472, 31, C.muted);
  api.text(ctx, scaled ? '0.9993 ÷ 0.2' : 'Cosine   0.9993', left, 566, 45, C.ink);
  if (scaled) api.text(ctx, '= ' + FIXTURE.logits[0][0].toFixed(4), left, 650, 53, C.yellow);
  drawClipText(
    ctx,
    api,
    beat === 2
      ? '3 paired cells     ·     6 alternatives'
      : scaled
        ? 'One temperature for all nine comparisons'
        : 'Each cell compares one photo with one caption',
    960,
    956,
    36,
    C.muted,
  );
}

export default { id: 'matrix', draw: drawMatrix, cues: ['matrix-pairs', 'matrix-scale'] };
