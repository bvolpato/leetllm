import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawRounding(ctx, scene, state, api) {
  const { C } = api;
  const { b, rawSubtotal, rounded, staged, single } = sampleModel('rounding', state);
  const p = (id) => state.cues?.[id]?.progress ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const addition = b > 0 ? 1 : p('de-round-add');
  const store = b === 0 ? 0 : b === 1 ? p('dep-result-round-cast') : 1;
  const zero = b > 1 || done('dep-result-round-zero');
  const one = done('dep-result-round-one');
  const subtotal = 256 + addition * (rawSubtotal - 256);

  text(ctx, api, 'Weighted returns to one source row', 960, 250, 33, C.muted, 'center');
  text(ctx, api, '(256 + 1) − 256', 960, 335, 65, C.yellow, 'center');

  function ruler(left, target, label, color, mark, ticks, caption, answer) {
    api.focus.target(target, () => {
      const at = (v) => left + (v - 255) * 178;
      text(ctx, api, label, left + 356, 457, 40, color, 'center');
      api.line(ctx, at(255), 620, at(259), 620, C.muted, 4);
      for (const v of ticks) {
        api.line(ctx, at(v), 605, at(v), 637, color, 4);
        text(ctx, api, String(v), at(v), 687, 32, C.ink, 'center');
      }
      const showBits =
        target === 'rounding-bf16-operation' && (b > 0 || p('de-round-question') > 0);
      if (showBits) {
        for (const [value, bit] of [
          [256, 0],
          [258, 1],
        ])
          text(ctx, api, 'last bit ' + bit, at(value), 742, 26, color, 'center');
      }
      api.circle(ctx, at(mark), 620, 14, color);
      if (Number.isInteger(mark)) text(ctx, api, String(mark), at(mark), 561, 37, color, 'center');
      text(ctx, api, caption, left + 356, 788, 29, C.muted, 'center');
      text(ctx, api, answer, left + 356, 915, 39, color, 'center');
    });
  }
  ruler(
    156,
    'rounding-bf16-operation',
    'Store the subtotal in BF16',
    C.pink,
    subtotal + (rounded - rawSubtotal) * store,
    [255, 256, 258],
    b > 0 || p('de-round-question') > 0
      ? 'At a tie, keep a zero low bit'
      : 'Ticks mark representable BF16 values',
    b === 0
      ? 'Which BF16 neighbor gets stored?'
      : zero
        ? 'Stored ' + rounded + ' − 256 = ' + staged
        : 'Stored subtotal − 256 = ?',
  );
  ruler(
    1051,
    'rounding-fp32-operation',
    'Keep the subtotal in FP32',
    C.blue,
    subtotal,
    [255, 256, 257, 258, 259],
    'Integer marks shown',
    one
      ? rawSubtotal + ' − 256 = ' + single + ' → final BF16 ' + single
      : b < 2
        ? 'Keep the exact subtotal'
        : 'FP32 subtotal − 256 = ?',
  );
}
export default {
  id: 'rounding',
  draw: drawRounding,
  cues: [
    'de-round-add',
    'de-round-question',
    'dep-result-round-cast',
    'dep-result-round-zero',
    'dep-result-round-one',
  ],
};
