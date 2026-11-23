const left = 325;
const width = 358;
const top = 503;
const gap = 8;

function rangeLabel(batch) {
  return batch.length === 1 ? batch[0].id : batch[0].id + '–' + batch.at(-1).id;
}

export function requestStrip(ctx, api, { rows, now, deadline, pin, detail }) {
  const { C } = api;
  const start = 145;
  const step = 1630 / rows.length;
  api.focus.target('arrival-order', () => {
    api.text(ctx, rows.length + ' requests in arrival order', start, 240, 35, C.ink);
    api.text(ctx, detail, 1775, 240, 32, C.muted, 'right');
    for (const [i, row] of rows.entries()) {
      const started = row.start !== null && row.start <= now;
      const color = started ? C.cyan : row.expired && now > deadline ? C.pink : C.muted + '55';
      api.rect(ctx, start + i * step, 265, step - 2, 45, color, undefined, 1);
    }
    if (pin) {
      const i = rows.findIndex((row) => row.id === pin);
      const x = start + (i + 0.5) * step;
      api.line(ctx, x, 311, x, 330, C.yellow, 4);
      api.text(ctx, pin, x, 363, 30, C.yellow, 'center');
    }
  });
}

// Each column opens at its time tick. Its width is one full service interval.
export function startBoard(
  ctx,
  api,
  {
    rows,
    slots,
    warm,
    service,
    deadline,
    now,
    slotDetail = false,
    previousRows,
    showLost = false,
    trackedId,
  },
) {
  const { C } = api;
  const count = slotDetail ? slots : warm;
  const pitch = slotDetail ? 72 : 66;
  const firstY = top;
  const bottom = firstY + count * pitch;
  const group = (entries, lane) =>
    entries.filter((row) => (slotDetail ? row.slot : row.worker) === lane + 1);

  api.focus.target('start-grid', () => {
    api.text(ctx, slotDetail ? 'One warm GPU' : 'Warm replicas', 145, 406, 32, C.ink);
    for (let lane = 0; lane < count; lane++) {
      const y = firstY + lane * pitch;
      api.text(ctx, (slotDetail ? 'Slot ' : 'GPU ') + (lane + 1), 150, y + 39, 32, C.ink);
    }
    for (let col = 0; col < 4; col++) {
      const start = col * service;
      const x = left + col * width;
      const entries = rows.filter((row) => row.start === start);
      const old = previousRows?.filter((row) => row.start === start) ?? [];
      for (let lane = 0; lane < count; lane++) {
        const y = firstY + lane * pitch;
        const batch = group(entries, lane);
        const late = start > deadline && showLost ? group(old, lane) : [];
        const visible = batch.length > 0 && now >= start;
        const fill = visible ? C.cyan + '29' : late.length ? C.pink + '18' : C.panel;
        const displayed = visible ? batch : late;
        const tracked = displayed.some((row) => row.id === trackedId);
        api.rect(
          ctx,
          x + gap,
          y,
          width - 2 * gap,
          pitch - gap,
          fill,
          tracked ? C.yellow : undefined,
          4,
        );
        if (visible || late.length) {
          const color = visible ? C.cyan : C.pink;
          api.rect(ctx, x + gap, y + 3, 5, pitch - gap - 6, color, undefined, 1);
          api.text(
            ctx,
            rangeLabel(displayed),
            x + width / 2,
            y + 39,
            35,
            tracked ? C.ink : color,
            'center',
          );
        }
      }
    }
  });
  api.focus.target('start-gate', () => {
    for (let col = 0; col <= 4; col++) {
      const time = service * col;
      const x = left + col * width;
      const isDeadline = time === deadline;
      const color = isDeadline ? C.yellow : C.muted;
      api.text(ctx, time + ' s', x, 455, 32, color, 'center');
      api.line(ctx, x, 469, x, bottom, color + (isDeadline ? 'ff' : '55'), isDeadline ? 4 : 2);
    }
    const gateX = left + (deadline / service) * width;
    if (deadline % service !== 0) api.line(ctx, gateX, 469, gateX, firstY - 3, C.yellow, 4);
    api.text(ctx, 'Last legal start', gateX, 406, 30, C.yellow, 'center');
  });
}

export function decision(ctx, api, message, color = api.C.ink) {
  api.focus.target('queue-decision', () => api.text(ctx, message, 960, 992, 40, color, 'center'));
}

export function markStartChange(ctx, api, previous, current, service, shift, repaired) {
  api.focus.target('last-request', () => {
    const from = left + (previous / service) * width;
    const to = left + (current / service) * width;
    const x = from + (to - from) * shift;
    api.text(
      ctx,
      repaired
        ? `R72 starts at ${current} s instead of ${previous} s`
        : `R72 loses its start at ${previous} s`,
      145,
      931,
      31,
      api.C.ink,
    );
    if (repaired) api.arrow(ctx, from - 14, 921, to + 14, 921, api.C.cyan, 3);
    api.circle(ctx, from, 921, 8, api.C.pink);
    if (repaired) {
      api.circle(ctx, to, 921, 8, api.C.cyan);
      if (shift > 0 && shift < 1) api.circle(ctx, x, 921, 9, api.C.ink);
    }
  });
}
