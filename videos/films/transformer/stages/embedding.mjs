import { EMBED } from '../fixtures.mjs';
import { done, position } from '../arithmetic.mjs';
import { INPUT, embeddingFrame } from '../model.mjs';
import { caption, equation, row, target, text, withTransformerLegacyFrame } from '../defaults.mjs';
export function paintEmbedding(ctx, scene, state, api, C, b, P, f) {
  const current = embeddingFrame(state);
  text(ctx, api, C, 'the · ID 2', 180, 320, 38, C.yellow);
  target(ctx, api, 'embedding-row', () => {
    text(ctx, api, C, 'embedding lookup', 180, 410, 30, C.blue);
    row(
      ctx,
      api,
      C,
      f,
      done(current.lookup) ? EMBED[2] : Array(4).fill(null),
      570,
      355,
      1050,
      C.blue,
    );
  });
  text(ctx, api, C, '+ position 2', 180, 575, 30, C.pink);
  row(ctx, api, C, f, position(2), 570, 520, 1050, C.pink);
  target(ctx, api, 'positioned-row', () => {
    text(ctx, api, C, 'input state', 180, 740, 30, C.cyan);
    row(
      ctx,
      api,
      C,
      f,
      INPUT[2].map((v, j) => (j < current.coordinates ? v : null)),
      570,
      685,
      1050,
      C.cyan,
    );
  });
  if (current.added > 0 && current.coordinates < 4) {
    const j = Math.min(3, current.coordinates),
      q = current.added * 4 - j,
      home = 570 + ((j + 0.5) * 1050) / 4 - 4;
    if (q < 0.4) {
      const blueX = q < 0.2 ? home + ((1660 - home) * q) / 0.2 : 1660,
        blueY = q < 0.2 ? 455 : 455 + (165 * (q - 0.2)) / 0.2;
      api.circle(ctx, blueX, blueY, 9, C.blue);
      if (q > 0.2) api.circle(ctx, home + ((1660 - home) * (q - 0.2)) / 0.2, 620, 9, C.pink);
    } else {
      const xx = q < 0.7 ? 1660 : q < 0.95 ? 1660 + ((home - 1660) * (q - 0.7)) / 0.25 : home,
        yy =
          q < 0.7 ? 620 + (40 * (q - 0.4)) / 0.3 : q < 0.95 ? 660 : 660 + (15 * (q - 0.95)) / 0.05;
      api.circle(ctx, xx, yy, 9, C.yellow);
      text(ctx, api, C, f(INPUT[2][j]), 1740, 650, 28, C.yellow, 'center');
    }
    equation(
      ctx,
      api,
      C,
      f(EMBED[2][j]) + '+' + f(position(2)[j]) + '=' + f(INPUT[2][j]),
      1100,
      860,
      42,
      C.yellow,
    );
  }
  if (b === 2)
    target(ctx, api, 'original-branch', () =>
      text(
        ctx,
        api,
        C,
        'original input retained for the residual addition',
        960,
        900,
        32,
        C.blue,
        'center',
      ),
    );
  caption(ctx, api, C, 'Positioned row = embedding + additive position vector');
}
export function drawEmbeddingStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintEmbedding);
}
export default {
  id: 'embedding',
  draw: drawEmbeddingStage,
  cues: ['embedding-lookup', 'position-add', 'preserve-input'],
};
