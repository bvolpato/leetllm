import { decoderMiniature } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { bracket, tile } from '../prompt.mjs';

export function drawForward(ctx, scene, state, api) {
  const { C } = api;
  const m = decoderMiniature();
  const vector = (values) => '[' + values.join(', ') + ']';
  const count = Math.ceil(3 * spoken(state, 'collect-values', 0));
  const combined = ended(state, 'mean-vector', 0);
  const scores = spoken(state, 'score-rows', 1);
  const x = (i) => 260 + 326 * i;
  api.text(ctx, 'Four-piece teaching head · two coordinates per token', 150, 270, 35, C.muted);
  m.tokens.forEach((token, i) => {
    const c = i === 3 ? C.muted : C.blue;
    tile(ctx, api, token, x(i), 350, c, 230);
    api.focus.target('values', () => {
      api.text(
        ctx,
        i === 3 ? 'masked' : i < count ? vector(m.inputs[i]) : 'value',
        x(i),
        545,
        41,
        c,
        'center',
      );
    });
  });
  api.focus.target('values', () => {
    bracket(ctx, api, x(0) - 112, x(2) + 112, 598, C.cyan);
    api.text(
      ctx,
      state.beat === 0 && !combined
        ? 'comma embedding [0, 1] + position [2, 2]'
        : 'Average of three values',
      (x(0) + x(2)) / 2,
      675,
      32,
      C.cyan,
      'center',
    );
  });
  api.focus.target('hidden', () => {
    api.text(ctx, 'At the comma', 1550, 373, 36, C.cyan, 'center');
    tile(ctx, api, combined ? vector(m.hidden) : '[?, ?]', 1550, 429, C.cyan, 310);
  });
  if (state.beat > 0) {
    m.outputPieces.forEach((piece, i) => {
      const col = 344 + i * 409;
      const scored = scores >= (i + 1) / 4;
      const c = i === 1 ? C.yellow : C.ink;
      api.focus.target('scores', () => {
        api.text(ctx, piece + '   ' + vector(m.outputRows[i]), col, 807, 39, c, 'center');
        api.text(ctx, scored ? String(m.logits[i]) : '?', col, 920, 67, c, 'center');
      });
    });
    api.text(
      ctx,
      'Score = [1, 2] dotted with the piece’s embedding row',
      960,
      1016,
      32,
      C.muted,
      'center',
    );
  } else {
    if (count === 3) {
      for (let j = 0; j < 2; j++) {
        const values = m.inputs.slice(0, 3).map((value) => value[j]);
        api.text(
          ctx,
          '(' + values.join(' + ') + ') / 3 = ' + (combined ? m.hidden[j] : '?'),
          560 + 800 * j,
          862,
          49,
          j === 0 ? C.blue : C.cyan,
          'center',
        );
      }
    } else {
      api.text(
        ctx,
        'Equal attention weights on positions 0, 1 and 2',
        960,
        875,
        38,
        C.ink,
        'center',
      );
    }
    api.text(ctx, 'Identity value projection in this miniature', 960, 984, 30, C.muted, 'center');
  }
}
export default {
  id: 'forward',
  draw: drawForward,
  cues: ['collect-values', 'mean-vector', 'score-rows'],
};
