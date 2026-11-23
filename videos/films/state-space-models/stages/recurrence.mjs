import { hs, xs } from '../fixtures.mjs';
import { cueDone, cueMotion, text } from '../defaults.mjs';

export function drawRecurrence(ctx, scene, state, api) {
  const { C } = api;
  const cues = ['first-update', 'second-update', 'third-update', 'fourth-update'];
  const windows = [
    [0, 0.22, 0.52],
    [0, 0.56, 0.82],
    [1, 0.18, 0.62],
    [1, 0.65, 0.91],
  ];
  const origin = 405,
    scale = 525;
  api.focus.target('state-bars', () => {
    text(ctx, api, 'Carry  0.9 × old state', 405, 294, 40, C.blue);
    text(ctx, api, 'Write  0.2 × input', 1040, 294, 40, C.pink);
    text(ctx, api, 'State', 1680, 294, 40, C.green, 'center');
    xs.forEach((input, i) => {
      const [beat, start, end] = windows[i];
      const q = cueMotion(state, cues[i], beat, start, end);
      const old = i ? hs[i - 1] : 0,
        carry = 0.9 * old,
        write = 0.2 * input;
      const y = 384 + i * 132;
      text(ctx, api, 'input  ' + input, 150, y + 56, 42, q > 0 ? C.ink : C.muted);
      api.line(ctx, origin, y + 80, origin + scale * 2, y + 80, C.muted, 2);
      const kept = scale * carry * Math.min(1, 2 * q);
      const added = scale * write * Math.max(0, 2 * q - 1);
      if (kept > 0) api.rect(ctx, origin, y, kept, 60, C.blue);
      if (added > 0) api.rect(ctx, origin + kept, y, added, 60, C.pink);
      text(
        ctx,
        api,
        cueDone(state, cues[i], beat, end) ? String(Number(hs[i].toFixed(4))) : '?',
        1680,
        y + 53,
        52,
        q > 0 ? C.green : C.muted,
        'center',
      );
    });
  });
  api.focus.target('state-equation', () => {
    const t = xs.findLastIndex((x, i) => cueMotion(state, cues[i], ...windows[i]) > 0);
    const old = t > 0 ? hs[t - 1] : 0;
    const caption =
      state.beat === 0 && cueDone(state, 'second-update', 0, 0.82)
        ? 'Input 4. How much does the write add?     0.2 × 4 = ?'
        : t < 0
          ? 'Start with h = 0'
          : 'h = 0.9 × ' + Number(old.toFixed(4)) + ' + 0.2 × ' + xs[t];
    text(ctx, api, caption, 960, 984, 45, C.ink, 'center');
  });
}
export default { id: 'recurrence', draw: drawRecurrence };
