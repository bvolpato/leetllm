import { PRESCRIBED } from '../fixtures.mjs';
import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';

export function drawRmsprop(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b, from, to) => cueProgress(state, id, b, from, to);
  const next = q('rms-second', 1, 0.49, 0.61);
  const record = PRESCRIBED[next > 0 ? 1 : 0];
  const stored = q('rms-store-second', 1, 0.61, 0.68);
  const history = stored === 1 ? PRESCRIBED[1] : PRESCRIBED[0];
  const first = q('rms-first', 1, 0.05, 0.27);
  const second = q('rms-second-result', 1, 0.68, 0.91);
  const root = q('rms-root', 0, 0.52, 0.66);
  const square = q('rms-square', 0, 0.26, 0.5);
  const x = (value) => 1240 + value * 12600;
  api.text(
    ctx,
    'Basic RMSProp    ·    ρ = 0.9    ·    η = 0.01    ·    ε = 10⁻⁸',
    160,
    239,
    34,
    C.muted,
  );
  api.text(ctx, 'Amount subtracted', 1240, 354, 37, C.ink, 'center');
  for (const [j, g] of record.gradient.entries()) {
    const y = 488 + 224 * j;
    const color = j ? C.green : C.cyan;
    api.focus.target('rms-input', () =>
      api.text(ctx, (j ? 'b' : 'a') + '     g = ' + fmt(g), 160, y - 19, 44, color),
    );
    api.focus.target('rms-square', () =>
      api.text(
        ctx,
        square === 1 ? 's = ' + fmt(history.rms[j], 5) : 's starts at 0',
        160,
        y + 48,
        33,
        C.ink,
      ),
    );
    api.focus.target('rms-root', () =>
      api.text(
        ctx,
        root === 1 ? '√s ≈ ' + fmt(Math.sqrt(history.rms[j])) : '√s = ?',
        465,
        y + 48,
        33,
        C.ink,
      ),
    );
    api.focus.target('rms-update', () => {
      api.line(ctx, x(-0.04), y, x(0.04), y, C.muted, 3);
      for (const tick of [-0.04, 0, 0.04]) {
        api.line(ctx, x(tick), y - 12, x(tick), y + 12, C.muted, 3);
        api.text(ctx, fmt(tick), x(tick), y + 54, 29, C.muted, 'center');
      }
      const previous = PRESCRIBED[0].rmsUpdate[j];
      const amount =
        next === 0 ? previous * first : previous + (record.rmsUpdate[j] - previous) * second;
      if (next > 0) api.circle(ctx, x(previous), y, 10, C.bg, C.muted, 3);
      api.line(ctx, x(0), y, x(amount), y, color, 7);
      if (first > 0) api.circle(ctx, x(amount), y, 10, color);
      const done = next === 0 ? first === 1 : second === 1;
      if (done)
        api.text(ctx, '≈ ' + fmt(record.rmsUpdate[j], 5), x(amount), y - 31, 35, color, 'center');
    });
  }
  if (beat < 2) {
    api.focus.target('rms-predict', () =>
      api.text(
        ctx,
        beat === 0 && root === 1
          ? 'Will a still take a hundred times the step?'
          : 's = 0.9 × previous s + 0.1 × g²',
        960,
        929,
        44,
        C.ink,
        'center',
      ),
    );
  } else {
    api.focus.target('rms-no-correction', () =>
      api.text(ctx, 'Subtract  η × g / (√s + ε)', 180, 918, 41, C.ink),
    );
    api.focus.target('rms-epsilon', () =>
      api.text(
        ctx,
        'Inside-root variant   √(s + ε)',
        1715,
        918,
        37,
        q('rms-epsilon', 2, 0.6, 0.83) > 0 ? C.yellow : C.muted,
        'right',
      ),
    );
  }
}
export default {
  id: 'rmsprop',
  draw: drawRmsprop,
  cues: [
    'rms-input',
    'rms-square',
    'rms-root',
    'rms-predict',
    'rms-first',
    'rms-second',
    'rms-store-second',
    'rms-second-result',
    'rms-sign',
    'rms-no-correction',
    'rms-epsilon',
  ],
};
