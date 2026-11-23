import { residency } from '../arithmetic.mjs';
import { after, text } from '../defaults.mjs';

const unit = 256;
const threads = 32;
const budget = 65536;
const units = (value) => value.toLocaleString('en-US');

export function drawRegisters(ctx, scene, state, api) {
  const { C, focus } = api;
  let demand = 32;
  if (after(api, 'register-add-one')) demand = 33;
  if (after(api, 'register-forty')) demand = 40;
  if (after(api, 'register-next')) demand = 41;
  const row = residency(demand);
  const requested = demand * threads;
  const allocated = demand === 33 && !after(api, 'round-unit') ? 1024 : row.perWarp;
  const start = 180;
  const step = 250;

  focus.target('warp-allocation', () => {
    text(ctx, api, 'One warp', start, 240, 38, C.ink);
    text(ctx, api, '256 registers per allocation unit', 1690, 240, 29, C.muted, 'right');
    text(
      ctx,
      api,
      '32 threads × ' + demand + ' registers = ' + units(requested) + ' requested',
      start,
      323,
      39,
      C.cyan,
    );
    for (let i = 0; i < 6; i++) {
      const x = start + i * step;
      const filled = Math.min(unit, Math.max(0, requested - i * unit));
      const reserved = i * unit < allocated;
      api.rect(ctx, x, 370, step - 5, 85, C.panel, reserved ? C.yellow : C.muted, 3);
      if (filled)
        api.rect(ctx, x + 4, 378, ((step - 13) * filled) / unit, 69, C.cyan, undefined, 1);
      if (reserved) api.line(ctx, x, 475, x + step - 5, 475, C.yellow, 6);
    }
    const reservation =
      requested > allocated ? 'Crosses the fourth unit' : units(allocated) + ' reserved per warp';
    text(ctx, api, reservation, start, 537, 31, C.yellow);
    const ready = demand !== 33 || after(api, 'block-footprint');
    if (ready)
      text(
        ctx,
        api,
        '× 8 warps = ' + units(row.perBlock) + ' registers per block',
        1690,
        537,
        31,
        C.ink,
        'right',
      );
  });

  focus.target('register-file', () => {
    const fileWidth = 1360;
    const edge = start + fileWidth;
    const pending = demand === 33 && !after(api, 'register-fewer-blocks');
    const previous = demand === 40 && !after(api, 'same-step');
    const packing = previous ? residency(33) : row;
    const blockWidth = (fileWidth * packing.perBlock) / budget;
    const shown = pending || (demand === 41 && !after(api, 'five-blocks')) ? 0 : packing.blocks;
    text(ctx, api, 'One SM  ·  65,536 registers  ·  64-warp limit', start, 650, 36, C.ink);
    api.rect(ctx, start, 701, fileWidth, 90, C.panel, C.muted, 2);
    for (let i = 0; i < shown; i++) {
      const x = start + i * blockWidth;
      api.rect(ctx, x + 1, 703, blockWidth - 2, 86, '#21433f', C.green, 3);
      text(ctx, api, 'B' + (i + 1), x + blockWidth / 2, 758, 32, C.green, 'center');
    }
    api.line(ctx, edge, 677, edge, 810, C.yellow, 3);
    if (shown === 0 && (demand !== 33 || after(api, 'block-footprint'))) {
      api.rect(ctx, start, 703, blockWidth, 86, C.panel, C.cyan, 3);
      text(ctx, api, '1 block', start + blockWidth / 2, 758, 30, C.cyan, 'center');
    }

    const trying = demand === 33 && focus.visible('try-seventh');
    if (trying) {
      const x = start + packing.blocks * blockWidth;
      const y = 701 + 80 * (1 - focus.progress('try-seventh'));
      api.rect(ctx, x + 1, y + 2, blockWidth - 2, 86, null, C.pink, 4);
      text(ctx, api, 'B7', x + blockWidth / 2, y + 57, 32, C.pink, 'center');
    }
    let note = shown
      ? shown + ' complete blocks  ·  ' + packing.warps + ' resident warps'
      : 'How many whole blocks fit?';
    if (pending && after(api, 'block-footprint')) note = 'Can the seventh block fit?';
    if (trying && after(api, 'free-registers')) {
      const free = budget - packing.blocks * packing.perBlock;
      note = units(free) + ' free  <  ' + units(packing.perBlock) + ' needed for block 7';
    }
    if (previous) note = 'At 33 registers per thread, six blocks fit. Must one leave at 40?';
    text(ctx, api, note, start, 914, 37, trying ? C.pink : C.ink);
    text(
      ctx,
      api,
      'Theoretical capacity  ·  shared memory and other hardware limits omitted',
      start,
      1005,
      26,
      C.muted,
    );
  });
}

export default {
  id: 'registers',
  draw: drawRegisters,
  cues: [
    'register-initial-allocation',
    'register-add-one',
    'round-unit',
    'block-footprint',
    'register-fewer-blocks',
    'try-seventh',
    'free-registers',
    'register-forty',
    'same-step',
    'register-next',
    'five-blocks',
    'register-resource-reports',
  ],
};
