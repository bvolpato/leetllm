export function requestTrace(ctx, api, { original, cpu, kernel, bottomLabel, totalLabel, pending = false }) {
  const { C, text, rect, line } = api;
  const x = (ms) => 370 + ms * 13.3;
  text(ctx, 'Constructed serial request', 140, 253, 37, C.ink);
  text(ctx, 'milliseconds', x(100), 253, 31, C.muted, 'right');
  for (const tick of [0, 25, 50, 75, 100]) {
    line(ctx, x(tick), 346, x(tick), 480, C.muted, 1);
    line(ctx, x(tick), 592, x(tick), 723, C.muted, 1);
    text(ctx, String(tick), x(tick), 324, 31, C.muted, 'center');
  }
  for (const [label, host, gpu, top] of [
    ['Original', original.cpu, original.kernel, 390],
    [bottomLabel, cpu, kernel, 633],
  ]) {
    text(ctx, label, 145, top + 59, 35, C.ink);
    rect(ctx, x(0), top, x(host) - x(0), 85, C.blue);
    text(ctx, 'CPU prep   ' + Number(host.toFixed(1)) + ' ms', x(host / 2), top + 55, 35, C.bg, 'center');
    if (pending && label === bottomLabel) {
      line(ctx, x(host), top + 87, x(host), top + 109, C.cyan, 3);
      text(ctx, 'Kernel   ? ms', x(host), top + 154, 33, C.cyan, 'right');
      continue;
    }
    rect(ctx, x(host), top, x(host + gpu) - x(host), 85, C.cyan);
    line(ctx, x(host + gpu / 2), top + 87, x(host + gpu / 2), top + 109, C.cyan, 3);
    text(ctx, 'Kernel   ' + Number(gpu.toFixed(1)) + ' ms', x(host + gpu / 2), top + 154, 33, C.cyan, 'right');
  }
  text(ctx, totalLabel, 960, 956, 43, C.yellow, 'center');
}
