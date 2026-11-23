import { reductionPrecisionFixture } from '../fixtures.mjs';
import { completed, operation } from '../construction.mjs';
import { text, valueBox, movingValue } from '../defaults.mjs';

export function drawCommunication(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('communication-mechanism', () => {
    if (beat === 0) {
      text(ctx, api, 'One training step across workers', 960, 280, 35, C.cyan, 'center');
      const rows = [
        ['Compute operands', 'BF16', C.blue],
        ['Parameter gradient buffer', 'FP32', C.green],
        ['Sum across workers', 'Which precision?', C.pink],
      ];
      rows.forEach(([name, dtype, color], i) => {
        const y = 405 + i * 215;
        text(ctx, api, name, 240, y + 50, 32, color);
        api.arrow(ctx, 900, y + 35, 1100, y + 35, color, 3);
        movingValue(
          ctx,
          api,
          [900, y + 35],
          [1100, y + 35],
          Math.max(0, Math.min(1, operation(state, 'communication-b1') * 3 - i)),
          color,
        );
        valueBox(ctx, api, dtype, 1130, y - 10, 600, color, 30);
      });
      text(
        ctx,
        api,
        'Check the reduction dtype and the order of addition',
        960,
        1040,
        29,
        C.muted,
        'center',
      );
    } else if (beat === 1) {
      const fixture = reductionPrecisionFixture();
      text(
        ctx,
        api,
        'Same represented inputs: 256, +1, −256 · fixed addition order',
        960,
        280,
        35,
        C.yellow,
        'center',
      );
      fixture.values.forEach((v, i) =>
        valueBox(ctx, api, v > 0 ? `+${v}` : String(v), 600 + i * 370, 345, 250, C.blue, 35),
      );
      const first = completed(state, 'communication-b2');
      const rounded = completed(state, 'reduction-bf16-round');
      const bfFinal = completed(state, 'reduction-bf16-final');
      const fpFinal = completed(state, 'reduction-fp32-final');
      const rows = [
        ['BF16', C.pink, [first ? 256 : null, rounded ? 256 : null, bfFinal ? 0 : null]],
        ['FP32', C.green, [first ? 256 : null, rounded ? 257 : null, fpFinal ? 1 : null]],
      ];
      rows.forEach(([name, color, values], r) => {
        const y = 530 + r * 240;
        text(ctx, api, name, 250, y + 65, 34, color);
        values.forEach((v, i) => {
          const x = 610 + i * 370;
          valueBox(
            ctx,
            api,
            v === null ? 'Sum pending' : String(v),
            x,
            y,
            250,
            v === null ? C.muted : color,
            v === null ? 27 : 42,
          );
          if (i) {
            api.arrow(ctx, x - 100, y + 45, x - 20, y + 45, C.muted, 3);
            const cue =
              i === 1
                ? 'reduction-bf16-round'
                : r
                  ? 'reduction-fp32-final'
                  : 'reduction-bf16-final';
            movingValue(
              ctx,
              api,
              [x - 100, y + 45],
              [x - 20, y + 45],
              operation(state, cue),
              color,
            );
          }
        });
      });
      text(
        ctx,
        api,
        rounded
          ? '257 is halfway between BF16 points 256 and 258; nearest even keeps 256'
          : 'Follow each addition before its stored partial sum is revealed',
        960,
        1040,
        28,
        C.muted,
        'center',
      );
    } else {
      const progress = operation(state, 'payload-bytes');
      const ready = completed(state, 'payload-bytes');
      text(
        ctx,
        api,
        'Size of one gradient tensor   ·   100 million values',
        960,
        280,
        38,
        C.cyan,
        'center',
      );
      [
        ['FP32', 4, C.green],
        ['BF16', 2, C.pink],
      ].forEach(([name, bytes, color], i) => {
        const y = 365 + i * 135;
        const width = bytes * 200;
        text(ctx, api, `${name} · ${bytes} B/value`, 180, y + 49, 34, color);
        api.rect(ctx, 600, y, width, 66, C.panel, C.muted, 2);
        if (progress > 0) api.rect(ctx, 600, y, width * progress, 66, color);
        const mb = 100 * bytes * progress;
        text(ctx, api, `${Math.round(mb)} MB`, 1460, y + 49, 38, ready ? color : C.muted);
      });
    }
  });
  if (beat === 2 && operation(state, 'exchange-tensors') > 0) {
    api.focus.target('worker-exchange', () => {
      const travel = operation(state, 'exchange-tensors');
      text(ctx, api, 'Two-worker BF16 all-reduce', 960, 683, 40, C.ink, 'center');
      valueBox(ctx, api, 'Worker A', 200, 790, 345, C.blue, 42);
      valueBox(ctx, api, 'Worker B', 1375, 790, 345, C.cyan, 42);
      for (const [from, to, y, color] of [
        [565, 1355, 796, C.blue],
        [1355, 565, 873, C.cyan],
      ]) {
        api.arrow(ctx, from, y, to, y, color, 4);
        movingValue(ctx, api, [from, y], [to, y], travel, color);
      }
      text(ctx, api, '200 MB', 960, 770, 33, C.blue, 'center');
      text(ctx, api, '200 MB', 960, 934, 33, C.cyan, 'center');
      if (completed(state, 'exchange-tensors'))
        text(
          ctx,
          api,
          'Each worker adds its local tensor to the one it received.',
          960,
          1030,
          33,
          C.ink,
          'center',
        );
    });
  }
}
export default {
  id: 'communication',
  draw: drawCommunication,
  cues: [
    'communication-b1',
    'communication-b2',
    'reduction-bf16-round',
    'reduction-bf16-final',
    'reduction-fp32-final',
    'communication-b3',
    'payload-bytes',
    'exchange-tensors',
  ],
};
