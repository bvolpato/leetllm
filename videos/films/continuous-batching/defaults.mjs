export function drawEstablishedBatchingText(
  ctx,
  api,
  v,
  x,
  y,
  z = 32,
  col = api.C.ink,
  a = 'left',
) {
  return api.text(ctx, v, x, y, z, col, a);
}
export function drawEstablishedBatchingColor(ctx, api, id) {
  return (
    {
      A: api.C.blue,
      B: api.C.cyan,
      C: api.C.pink,
      D: api.C.yellow,
      E: api.C.green,
      U: api.C.yellow,
    }[id] ?? api.C.muted
  );
}
export function drawEstablishedBatchingCard(ctx, api, v, x, y, w = 340, col = api.C.cyan) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: 90,
    fontSize: 31,
    fill: api.C.panel,
    stroke: col,
    textColor: col,
  });
}
export function drawEstablishedBatchingGrid(ctx, api, trace, reveal = 6) {
  return api.focus.target('decode-grid', () => {
    for (let iteration = 0; iteration < 6; iteration++) {
      drawEstablishedBatchingText(
        ctx,
        api,
        String(iteration + 1),
        440 + iteration * 210,
        355,
        30,
        api.C.muted,
        'center',
      );
      for (let slot = 0; slot < 3; slot++) {
        const entry = iteration < reveal ? trace[iteration]?.slots[slot] : null;
        api.components.card({
          label: entry ? `${entry.id} · ${entry.generated}` : '',
          x: 350 + iteration * 210,
          y: 420 + slot * 145,
          width: 180,
          height: 95,
          fontSize: 33,
          fill: entry ? drawEstablishedBatchingColor(ctx, api, entry.id) + '28' : api.C.panel,
          stroke: entry ? drawEstablishedBatchingColor(ctx, api, entry.id) : api.C.muted,
          textColor: entry ? drawEstablishedBatchingColor(ctx, api, entry.id) : api.C.muted,
        });
      }
    }
    [1, 2, 3].forEach((v, i) =>
      drawEstablishedBatchingText(
        ctx,
        api,
        'Seat ' + v,
        220,
        480 + i * 145,
        30,
        api.C.muted,
        'center',
      ),
    );
    drawEstablishedBatchingText(ctx, api, 'Decode iteration', 960, 925, 32, api.C.muted, 'center');
  });
}
export function drawBatchingUpgradeText(
  ctx,
  api,
  v,
  x,
  y,
  z = 30,
  col = api.C.ink,
  align = 'left',
) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    z,
    col,
    align,
    String(v).includes('_') ? 'mono' : undefined,
  );
}
export function drawBatchingUpgradeColor(ctx, api, id) {
  return (
    {
      A: api.C.blue,
      B: api.C.cyan,
      C: api.C.pink,
      D: api.C.yellow,
      E: api.C.green,
    }[id] ?? api.C.muted
  );
}
export function drawBatchingUpgradeBox(ctx, api, label, x, y, w, h = 90, col = api.C.blue, z = 30) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: col,
    textColor: api.C.ink,
    fontSize: z,
    padding: 12,
    labelBaselineY: y + h / 2 + z * (0.34 - 0.7 * (String(label).split('\n').length - 1)),
  });
}
export function drawBatchingUpgradeFoot(ctx, api, v) {
  return drawBatchingUpgradeText(ctx, api, v, 960, 1020, 24, api.C.muted, 'center');
}
export function drawBatchingUpgradeArrow(ctx, api, x, y, u, v, col = api.C.cyan) {
  api.line(ctx, x, y, u, v, col, 3);
  const a = Math.atan2(v - y, u - x);
  api.line(ctx, u, v, u - 13 * Math.cos(a - 0.4), v - 13 * Math.sin(a - 0.4), col, 3);
  api.line(ctx, u, v, u - 13 * Math.cos(a + 0.4), v - 13 * Math.sin(a + 0.4), col, 3);
}
export function drawBatchingUpgradeTable(ctx, api, rows, x = 150, y = 330, w = 1620, h = 105) {
  return rows.forEach((row, i) =>
    row.forEach((v, j) => {
      const cw = w / row.length;
      api.rect(ctx, x + j * cw, y + i * h, cw, h, api.C.panel, api.C.muted, 0);
      drawBatchingUpgradeText(
        ctx,
        api,
        v,
        x + (j + 0.5) * cw,
        y + (i + 0.62) * h,
        Math.min(29, cw / 8),
        api.C.ink,
        'center',
      );
    }),
  );
}
export function drawBatchingUpgradePagePool(ctx, api, owners, x = 240, y = 460, cell = 160) {
  for (let i = 0; i < owners.length; i++) {
    const col = owners[i] ? drawBatchingUpgradeColor(ctx, api, owners[i]) : api.C.muted;
    drawBatchingUpgradeBox(
      ctx,
      api,
      String(i) + (owners[i] ? ' · ' + owners[i] : ' · free'),
      x + i * cell,
      y,
      cell - 14,
      110,
      col,
      28,
    );
  }
}

// The canvas storyboard has beat fractions. The delivered film has word timings.
export function cueProgress(state, id, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}
