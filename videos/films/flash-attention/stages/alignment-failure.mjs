import { cachedBlend } from '../model.mjs';
import { rowClock } from '../row-workspace.mjs';

const values = [10, 20, 40, 80],
  query = 3;
export function drawAlignmentFailure(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const repaired = clock.done('fa-absolute-repair');
  const showingAbsolute = repaired || clock.started('match-absolute');
  const open = clock.started('valid-here');
  const row = cachedBlend(
    query,
    values,
    values.length,
    showingAbsolute ? 'absolute' : 'upper-left',
  );
  const showMask = state.beat > 0;
  api.focus.target('decode-keys', () => {
    api.text(ctx, 'Cached key position', 124, 307, 32, C.muted);
    for (const [i, v] of values.entries()) {
      const x = 581 + i * 304,
        color = showMask && !row.allowed[i] ? C.muted : C.blue;
      api.text(ctx, i, x, 307, 39, color, 'center');
      api.rect(ctx, x - 119, 358, 238, 116, C.panel, color, 7);
      api.text(ctx, v, x, 431, 48, C.ink, 'center');
      if (showMask) {
        api.text(ctx, row.allowed[i] ? 'allowed' : 'masked', x, 554, 34, color, 'center');
        api.text(
          ctx,
          row.allowed[i] ? (showingAbsolute ? '¼' : '1') : '0',
          x,
          642,
          45,
          row.allowed[i] ? C.yellow : C.muted,
          'center',
        );
      }
    }
    api.text(ctx, 'Value', 124, 435, 32, C.muted);
    api.text(ctx, 'Query at 3', 124, 554, 40, C.yellow);
    if (showMask) api.text(ctx, 'Weight', 124, 642, 32, C.muted);
  });
  api.focus.target('decode-call', () => {
    const args = open
      ? 'is_causal=False'
      : showingAbsolute
        ? 'attn_mask=allowed'
        : 'is_causal=True';
    api.text(
      ctx,
      'F.scaled_dot_product_attention(q, k, v, ' + args + ', dropout_p=0.0)',
      960,
      773,
      34,
      C.ink,
      'center',
      'mono',
    );
    const replaced = showingAbsolute && !repaired;
    const answer = repaired
      ? 'Absolute valid-mask output ' + row.output
      : state.beat > 0 && !replaced
        ? 'Upper-left output ' + row.output
        : clock.done('ten-returned') && !replaced
          ? 'Output ' + row.output
          : 'Output  ?';
    api.text(ctx, answer, 960, 911, 52, repaired ? C.cyan : C.pink, 'center');
  });
}

export default {
  id: 'alignment-failure',
  draw: drawAlignmentFailure,
  cues: [
    'cache-inputs',
    'ten-returned',
    'upper-corner',
    'match-absolute',
    'fa-absolute-repair',
    'valid-here',
    'mask-contract',
    'zero-dropout',
    'package-alignment',
  ],
};
