// Keep each version and probe attached to the server that supplied it.
export function drawFleet(
  ctx,
  api,
  { x, y, width, versions, target, finished, probes, readings = versions.length },
) {
  const { C } = api;
  const gap = 20;
  const cell = (width - 2 * gap) / versions.length;
  api.text(ctx, 'Sampler target   v' + target, x, y, 38, C.ink, 'left', 'serif');
  versions.forEach((v, i) => {
    const left = x + i * (cell + gap);
    const center = left + cell / 2;
    api.rect(ctx, left, y + 45, cell, 215, C.panel, C.muted, 12);
    api.text(ctx, 'Replica ' + i, center, y + 98, 32, C.ink, 'center');
    api.text(ctx, i < readings ? 'v' + v : '…', center, y + 173, 58, C.blue, 'center');
    if (i < readings)
      api.text(
        ctx,
        probes[i] ? 'probe passed' : 'probe pending',
        center,
        y + 230,
        27,
        probes[i] ? C.cyan : C.muted,
        'center',
      );
  });
  api.text(
    ctx,
    finished ? 'Finish-update complete' : 'Finish-update pending',
    x,
    y + 332,
    33,
    finished ? C.cyan : C.muted,
  );
}

export function drawDispatch(ctx, api, { label, ready, progress, status }) {
  const { C } = api;
  const gate = 1000,
    y = 847,
    halfWidth = 215;
  const x = 735 + (ready ? progress : 0) * 805;
  const rail = (start, stop) => {
    if (stop > start) api.line(ctx, start, y, stop, y, C.muted, 3);
  };
  rail(130, x - halfWidth - 9);
  rail(x + halfWidth + 9, 1785);
  api.line(ctx, gate, y - 108, gate, ready ? y - 62 : y, ready ? C.cyan : C.yellow, 9);
  api.line(ctx, gate, ready ? y + 62 : y, gate, y + 108, ready ? C.cyan : C.yellow, 9);
  api.rect(ctx, x - halfWidth, y - 42, halfWidth * 2, 84, C.panel, C.blue, 16);
  api.text(ctx, label, x, y + 13, 29, C.ink, 'center', 'mono');
  api.text(ctx, status, 960, 1023, 38, ready ? C.green : C.ink, 'center');
}
