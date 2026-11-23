const phases = [
  { name: 'Input', color: 'blue' },
  { name: 'Queue', color: 'pink' },
  { name: 'Prefill', color: 'cyan' },
  { name: 'Deliver', color: 'green' },
];

export function firstTokenRuler(ctx, api, durations, elapsed, y) {
  const { C } = api;
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  const x = (ms) => 175 + (1570 * ms) / total;
  let start = 0;
  durations.forEach((duration, index) => {
    const { name, color } = phases[index];
    const width = x(start + duration) - x(start);
    const completed = Math.max(0, Math.min(duration, elapsed - start));
    api.rect(ctx, x(start), y, width - 3, 100, C.panel, C.muted, 4);
    if (completed > 0) {
      api.rect(
        ctx,
        x(start),
        y,
        Math.max(1, (width * completed) / duration - 3),
        100,
        C[color],
        null,
        3,
      );
    }
    if (completed >= duration - 1e-7) {
      api.text(ctx, duration + ' ms', x(start) + width / 2, y + 64, 32, C.bg, 'center');
    }
    api.text(ctx, name, x(start) + width / 2, y - 24, 34, C[color], 'center');
    start += duration;
  });
  api.line(ctx, x(elapsed), y + 108, x(elapsed), y + 134, C.yellow, 5);
  api.text(ctx, Math.round(elapsed) + ' ms', x(elapsed), y + 183, 36, C.yellow, 'center');
}
