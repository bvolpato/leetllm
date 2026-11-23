import { cueMotion } from '../construction.mjs';
import { visionPrefixBudget } from '../arithmetic.mjs';

export function drawPrefixKvBudget(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('prefix-account', () => {
    if (state.beat === 3) {
      api.text(ctx, 'Same screenshot and native crop', 140, 305, 47, C.ink);
      const change = cueMotion(state, 3, 'prefix-prompt', 0.2, 0.6) > 0;
      const rows = [
        ['Vision pass', 'Image + crop + processor + encoder', 'Reuse features', C.green],
        [
          'Decoder prefix',
          change ? 'New system prompt + same features' : 'Original system prompt + features',
          change ? 'Recompute from change' : 'Matching prefix',
          change ? C.yellow : C.green,
        ],
      ];
      rows.forEach(([name, inputs, result, color], i) => {
        const y = 470 + 215 * i;
        api.text(ctx, name, 145, y, 40, C.ink);
        api.text(ctx, inputs, 570, y, 35, C.ink);
        api.text(ctx, result, 570, y + 77, 42, color);
      });
      return;
    }
    const multi = state.beat === 2;
    const show = [
      true,
      cueMotion(state, 1, 'prefix-double', 0.05, 0.32) > 0,
      cueMotion(state, 1, 'prefix-largest', 0.6, 0.77) > 0,
    ];
    const merged = cueMotion(state, 2, 'prefix-merge', 0.4, 0.6) > 0;
    const rows = multi
      ? [
          ['Four images', visionPrefixBudget(448, 512, 4)],
          ['With 2 × 2 merger', visionPrefixBudget(448, 512, 4, 4)],
        ]
      : [224, 448, 896].map((side) => [side + ' × ' + side, visionPrefixBudget(side)]);
    api.text(ctx, '512 text slots', 540, 290, 36, C.blue);
    api.text(ctx, 'Visual slots', 825, 290, 36, C.pink);
    api.text(ctx, 'Raw KV cache', 1700, 290, 36, C.ink, 'center');
    rows.forEach(([name, r], i) => {
      if (multi && i === 1 && !merged) return;
      if (!multi && i === 2 && !show[2]) return;
      const y = 415 + i * 161,
        x = 540,
        unit = 942 / 4608;
      api.text(ctx, name, 105, y + 26, 39, C.ink);
      api.rect(ctx, x, y - 29, r.text * unit, 63, C.blue, undefined, 0);
      api.rect(ctx, x + r.text * unit, y - 29, r.visual * unit, 63, C.pink, undefined, 0);
      api.text(ctx, r.text + ' + ' + r.visual + ' = ' + r.total + ' slots', x, y + 91, 34, C.ink);
      api.text(
        ctx,
        !multi && !show[i] ? '?' : r.mib + ' MiB',
        1700,
        y + 30,
        50,
        !multi && !show[i] ? C.yellow : C.green,
        'center',
      );
    });
    api.text(
      ctx,
      multi
        ? 'Four 448 × 448 images   ·   14 × 14 pixels per patch'
        : 'Per retained slot    2 × 32 layers × 8 KV heads × 128 values × 2 bytes = 128 KiB',
      960,
      930,
      36,
      C.ink,
      'center',
    );
    if (state.beat === 0)
      api.text(
        ctx,
        'How much cache does the 448-pixel image need with the same text?',
        960,
        1008,
        34,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'prefix-kv-budget',
  draw: drawPrefixKvBudget,
  cues: [
    'prefix-baseline',
    'prefix-double',
    'prefix-largest',
    'prefix-four',
    'prefix-merge',
    'prefix-prompt',
  ],
};
