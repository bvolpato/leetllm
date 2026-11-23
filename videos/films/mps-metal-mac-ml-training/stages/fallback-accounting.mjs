import { foot, target, text, withMpsExtensionFrame, withMpsRootFrame } from '../defaults.mjs';

export function paintFallbackAccounting(ctx, scene, state, api, C, c, t, s) {
  const x = (ms) => 420 + 80 * ms;
  const origin = x(0);
  text(ctx, api, C, 'Same ticket  /  same three serial operations', 960, 265, 41, C.ink, 'center');
  text(ctx, api, C, 'CPU prep', 220, 396, 32, C.blue, 'center');
  text(ctx, api, C, 'tokenizer', 220, 448, 30, C.blue, 'center');
  api.arrow(ctx, 320, 426, origin - 14, 426, C.blue, 4);
  api.line(ctx, origin, 360, origin, 824, C.muted, 2);

  const segment = (v, limit, y) => {
    const end = Math.min(v.end, limit);
    if (end <= v.start) return;
    const col = v.device === 'cpu' ? C.blue : C.cyan;
    const width = x(end) - x(v.start);
    api.rect(ctx, x(v.start), y - 29, width, 58, C.panel, col, 4);
    if (width > 50) text(ctx, api, C, v.id, x(v.start) + width / 2, y + 12, 34, col, 'center');
  };

  target(ctx, api, 'mps-detour-schedule', () => {
    text(ctx, api, C, 'MPS kernel for U', origin + 12, 355, 31, C.cyan);
    for (const v of s.supported.intervals) segment(v, s.supportedTime, 427);
    if (s.step > 0 || s.totalReady)
      text(ctx, api, C, s.supported.total + ' ms', x(s.supported.total) + 20, 438, 31, C.cyan);
    if (s.step > 0) {
      text(ctx, api, C, 'MPS', 337, 598, 30, C.cyan, 'right');
      text(ctx, api, C, 'CPU', 337, 748, 30, C.blue, 'right');
      for (const v of s.detour.intervals) {
        if (s.detourTime <= v.start) break;
        if (v.device !== 'boundary') {
          segment(v, s.detourTime, v.device === 'cpu' ? 737 : 587);
        } else {
          const frac = Math.min(1, (s.detourTime - v.start) / v.duration);
          const outward = v.id === 'out';
          const y = outward ? 587 : 737;
          api.line(
            ctx,
            x(v.start),
            y,
            x(v.start + frac * v.duration),
            y + (outward ? 150 : -150) * frac,
            C.yellow,
            6,
          );
        }
      }
    }
    api.line(ctx, origin, 825, x(16), 825, C.muted, 2);
    for (let tick = 0; tick <= 16; tick++) {
      api.line(ctx, x(tick), 818, x(tick), 834, C.muted, 2);
      if (tick % 2 === 0) text(ctx, api, C, String(tick), x(tick), 871, 28, C.muted, 'center');
    }
    text(ctx, api, C, 'elapsed ms', 337, 868, 28, C.muted, 'right');
  });

  target(ctx, api, 'mps-fallback-total', () => {
    if (s.step === 0 || !s.totalReady) {
      text(
        ctx,
        api,
        C,
        s.step === 0 ? 'Time the chain from A through B' : 'How much later can B finish?',
        960,
        953,
        41,
        C.yellow,
        'center',
      );
    } else {
      const a = x(s.supported.total),
        b = x(s.detour.total);
      api.line(ctx, a, 527, b, 527, C.yellow, 4);
      for (const end of [a, b]) api.line(ctx, end, 514, end, 540, C.yellow, 4);
      text(
        ctx,
        api,
        C,
        '+' + (s.detour.total - s.supported.total) + ' ms',
        (a + b) / 2,
        496,
        35,
        C.yellow,
        'center',
      );
      text(ctx, api, C, s.detour.total + ' ms', b + 16, 599, 30, C.cyan);
      text(ctx, api, C, 'U costs 4 ms more  +  two 1 ms crossings', 960, 953, 40, C.ink, 'center');
    }
  });
  foot(ctx, api, C, 'Illustrative serial timings');
}
export function drawFallbackAccountingStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, (ctx, scene, state, api, C, c, t, s) =>
    withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintFallbackAccounting),
  );
}
export default {
  id: 'fallback-accounting',
  draw: drawFallbackAccountingStage,
  cues: [
    'fallback-accounting-b1',
    'mps-supported-total',
    'fallback-accounting-b2',
    'mps-detour-schedule',
    'mps-detour-cpu',
    'mps-detour-return',
    'mps-detour-finish',
    'mps-detour-total',
    'fallback-accounting-b3',
  ],
};
