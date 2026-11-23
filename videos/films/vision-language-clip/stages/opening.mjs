import { CAPTIONS, IMAGE_NAMES } from '../fixtures.mjs';
import { FIXTURE } from '../observations.mjs';
import { bounded, spokenProgress } from '../construction.mjs';
import { drawClipText, rackPhoto, drawVent } from '../defaults.mjs';

const centers = [1540, 380, 960];
const width = 520,
  height = 426,
  top = 330;

function archivePhoto(ctx, api, index, pullback) {
  const { C } = api;
  const x = centers[index] - width / 2;
  api.rect(ctx, x, top, width, height, C.panel, C.muted, 2);
  ctx.save();
  try {
    ctx.globalAlpha *= bounded((pullback - 0.92) / 0.08);
    rackPhoto(ctx, api, x, top, width, height, {
      vent: false,
      taped: index === 1,
      tagText: ['RACK-17', 'RACK-08', 'RACK-42'][index],
    });
  } finally {
    ctx.restore();
  }
  // The close-up settles exactly on the grille in the full rack drawing.
  const left = 0.045 + 0.205 * pullback;
  const y = 0.22 + 0.05 * pullback;
  drawVent(
    ctx,
    api,
    x + left * width,
    top + y * height,
    (1 - 2 * left) * width,
    (0.54 - 0.38 * pullback) * height,
    index === 0,
  );
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const beat = state.beat ?? 0;
  const queryEnd = state.cues?.['archive-query']?.end ?? 2.6;
  const travel = bounded((state.t ?? 0) / queryEnd);
  const pullback = beat > 0 ? 1 : 1 - (1 - travel) ** 2;
  const scores = spokenProgress(state, 'archive-scores', 0);
  const selected = spokenProgress(state, 'archive-pick', 1);
  api.focus.target('archive-search', () => {
    api.circle(ctx, 243, 245, 22, 'transparent', C.cyan, 5);
    api.line(ctx, 260, 262, 281, 283, C.cyan, 5);
    api.text(ctx, 'Which photo matches “' + CAPTIONS[0].toLowerCase() + '”?', 320, 269, 53, C.ink);
  });

  IMAGE_NAMES.forEach((name, i) => {
    const x = centers[i];
    const paint = () => {
      archivePhoto(ctx, api, i, pullback);
      if (i === 0 && selected > 0) {
        const l = x - width / 2 - 8,
          r = x + width / 2 + 8;
        const t = top - 8,
          b = top + height + 8;
        api.trace(
          ctx,
          [
            { x: l, y: b },
            { x: l, y: t },
            { x: r, y: t },
            { x: r, y: b },
            { x: l, y: b },
          ],
          selected,
          C.cyan,
          6,
        );
      }
      drawClipText(ctx, api, name, x, 825, 41);
    };
    if (i === 0) api.focus.target('archive-hit', paint);
    else paint();
  });
  api.focus.target('archive-numbers', () => {
    FIXTURE.retrievalScores.forEach((score, i) => {
      const left = centers[i] - 203;
      if (scores > 0) {
        api.line(ctx, left, 876, left + 406, 876, C.muted, 4);
        api.line(ctx, left, 876, left + 406 * score * scores, 876, C.yellow, 8);
      }
      if (scores === 1)
        drawClipText(ctx, api, 'constructed cosine ' + score.toFixed(3), centers[i], 938, 32);
    });
  });
  if (selected > 0) {
    drawClipText(
      ctx,
      api,
      beat === 1 ? 'Search hit    Photo 17' : 'Photo 17     Vent box   [   ,   ,   ,   ]',
      960,
      1024,
      37,
      C.cyan,
    );
  }
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['archive-query', 'archive-scores', 'archive-pick'],
};
