import { decoderMiniature } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { bracket, tile } from '../prompt.mjs';

export function drawMask(ctx, scene, state, api) {
  const { C } = api;
  const restore = spoken(state, 'restore-mask', 2);
  const open = ended(state, 'open-key', 2) && restore < 1;
  const opening = spoken(state, 'open-key', 2) * (1 - restore);
  const swapped = ended(state, 'swap-future', 1);
  const original = decoderMiniature({ causal: !open });
  const changed = decoderMiniature({ fourth: '·sir', causal: !open });
  const x = (i) => 508 + 316 * i;
  api.text(
    ctx,
    'One head · first coordinate of each value shown under its token',
    960,
    265,
    36,
    C.ink,
    'center',
  );
  api.text(ctx, 'Source', 140, 432, 35, C.muted);
  api.text(ctx, 'Test copy', 140, 640, 35, C.blue);
  for (let i = 0; i < 4; i++) {
    const col = i === 3 ? C.pink : i === 2 ? C.cyan : C.blue;
    api.focus.target(i === 3 ? 'last-input' : 'read-keys', () => {
      tile(ctx, api, original.tokens[i], x(i), 349, col);
      tile(ctx, api, swapped ? changed.tokens[i] : original.tokens[i], x(i), 557, col);
      api.text(ctx, String(original.inputs[i][0]), x(i), 506, 38, col, 'center');
      api.text(
        ctx,
        String((swapped ? changed : original).inputs[i][0]),
        x(i),
        714,
        38,
        col,
        'center',
      );
    });
  }
  const end = open ? 3 : 2;
  api.focus.target('read-keys', () => {
    bracket(ctx, api, x(0) - 110, x(2 + opening) + 110, 751, open ? C.pink : C.cyan);
    api.text(
      ctx,
      open ? 'All four keys admitted' : 'Readable at position 2',
      (x(0) + x(2 + opening)) / 2,
      802,
      32,
      open ? C.pink : C.cyan,
      'center',
    );
  });
  const before = original.rows[2].logits[1],
    after = changed.rows[2].logits[1];
  const compare =
    state.beat === 1
      ? ended(state, 'causal-reading', 1)
      : state.beat === 2
        ? ended(state, 'open-reading', 2) && (restore === 0 || restore === 1)
        : false;
  api.focus.target('readout', () => {
    api.text(ctx, 'Line-break score at the comma', 170, 884, 36, C.yellow);
    api.text(ctx, 'source   ' + before.toFixed(2), 979, 884, 42, C.ink, 'center');
    api.text(
      ctx,
      'copy   ' + (swapped && compare ? after.toFixed(2) : '?'),
      1490,
      884,
      42,
      C.ink,
      'center',
    );
  });
  if (compare) {
    const values = (model) =>
      model.inputs
        .slice(0, end + 1)
        .map((v) => v[0])
        .join(' + ');
    api.text(ctx, '(' + values(original) + ') / ' + (end + 1), 980, 945, 32, C.muted, 'center');
    api.text(ctx, '(' + values(changed) + ') / ' + (end + 1), 1490, 945, 32, C.muted, 'center');
  }
  api.text(ctx, 'Reference label stays ↵ in both passes', 170, 1011, 31, C.yellow);
}
export default {
  id: 'mask',
  draw: drawMask,
  cues: ['mask-keys', 'swap-future', 'causal-reading', 'open-key', 'open-reading', 'restore-mask'],
};
