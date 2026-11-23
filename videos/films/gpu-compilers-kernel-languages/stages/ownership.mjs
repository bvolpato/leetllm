import { coverage } from '../arithmetic.mjs';
import { after, arrow, text } from '../defaults.mjs';

const block = 4;
const length = 10;
const programs = coverage(length, block);
const pitch = 132;
const cell = 114;
const left = (i) => 175 + i * pitch;

export function drawOwnership(ctx, scene, state, api) {
  const { C, focus } = api;
  const single = focus.visible('thread-index');
  const selected = after(api, 'index-nine');
  const grouped = focus.visible('program-span');
  const classified = after(api, 'valid-tail');
  const travel = focus.progress('trace-stores');
  text(ctx, api, '10 outputs   /   4 offsets per block', 175, 237, 36);
  focus.target('owners', () => {
    programs.forEach((row, program) => {
      const x = left(row[0].index);
      const right = left(row.at(-1).index) + cell;
      const color = program === 2 ? C.cyan : C.muted;
      if (grouped) {
        text(ctx, api, 'Triton program ' + program, (x + right) / 2, 319, 29, color, 'center');
        api.line(ctx, x, 347, right, 347, color, 3);
        api.line(ctx, x, 347, x, 371, color, 3);
        api.line(ctx, right, 347, right, 371, color, 3);
      }
      row.forEach(({ index }, thread) => {
        const cx = left(index) + cell / 2;
        const marked = selected && !grouped && index === 9;
        if (single)
          text(ctx, api, 't' + thread, cx, 420, 28, marked ? C.yellow : C.muted, 'center');
        api.rect(ctx, left(index), 446, cell, 85, C.panel, marked ? C.yellow : color, 5);
        text(ctx, api, index, cx, 505, 43, marked ? C.yellow : color, 'center');
      });
    });
    if (single && !grouped)
      text(
        ctx,
        api,
        selected ? 'Block 2, thread 1   →   2 × 4 + 1 = 9' : 'CUDA C++   ·   one index per thread',
        175,
        610,
        31,
        C.yellow,
      );
    if (grouped && !classified)
      text(
        ctx,
        api,
        'Last program   ·   Which offsets may read and write?',
        175,
        610,
        31,
        C.yellow,
      );
    if (classified)
      text(ctx, api, 'Mask both loads and the store   ·   offset < 10', 175, 610, 31, C.cyan);
  });

  focus.target('addresses', () => {
    text(ctx, api, 'Output address', 175, 745, 29, C.ink);
    const boundary = left(length) - 9;
    api.line(ctx, boundary, 716, boundary, 899, C.yellow, 4);
    text(ctx, api, 'End of output', boundary + 18, 885, 25, C.yellow);
    for (const { index, valid } of programs.flat()) {
      const x = left(index);
      const cx = x + cell / 2;
      if (valid) {
        const written = index >= 8 && travel === 1;
        api.rect(ctx, x, 777, cell, 83, C.panel, written ? C.green : C.muted, 3);
        text(
          ctx,
          api,
          written ? 'write' : '·',
          cx,
          833,
          written ? 30 : 39,
          written ? C.green : C.muted,
          'center',
        );
        text(ctx, api, '[' + index + ']', cx, 914, 26, C.muted, 'center');
      }
      if (!classified || index < 8) continue;
      if (valid && travel > 0) {
        arrow(ctx, api, cx, 637, cx, 637 + 121 * travel, C.green);
      } else if (!valid) {
        api.line(ctx, cx - 15, 690, cx + 15, 690, C.pink, 5);
        text(ctx, api, 'skip', cx, 662, 26, C.pink, 'center');
      }
    }
  });
  if (single)
    text(
      ctx,
      api,
      grouped
        ? 'Each bracket groups the offsets owned by one Triton program.'
        : 'Each t is a thread index within its CUDA block.',
      175,
      1009,
      26,
      C.muted,
    );
}

export default {
  id: 'ownership',
  draw: drawOwnership,
  cues: [
    'thread-index',
    'index-nine',
    'program-span',
    'valid-tail',
    'trace-stores',
    'blocked-mask',
  ],
};
