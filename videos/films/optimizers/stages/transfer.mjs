import { SETTINGS, pair } from '../arithmetic.mjs';
import { transferState } from '../construction.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const steps = transferState(state);
  const start = steps.sgd.start;
  const x = (a) => 850 + 805 * a;
  const colors = [C.blue, C.yellow, C.green];

  api.text(ctx, 'Initial errors  ' + pair(start) + '     ·     empty buffers', 145, 238, 38, C.ink);
  api.text(ctx, 'Error a', x(0), 344, 37, C.ink, 'center');
  api.line(ctx, x(0), 380, x(0), 844, C.muted, 3);
  for (const [value, label] of [
    [start[0], 'start −0.5'],
    [0, 'target 0'],
    [0.5, '+0.5'],
  ]) {
    api.text(ctx, label, x(value), 909, 32, C.muted, 'center');
  }
  for (const [i, kind] of ['sgd', 'momentum', 'adam'].entries()) {
    const r = steps[kind];
    const y = 460 + i * 171;
    const color = colors[i];
    api.focus.target('transfer-' + kind, () => {
      api.text(ctx, ['SGD', 'Momentum', 'Adam'][i], 145, y, 44, color);
      api.text(ctx, 'η = ' + SETTINGS[kind], 145, y + 51, 30, C.muted);
      api.line(ctx, x(-0.55), y, x(0.5), y, C.muted, 3);
      api.circle(ctx, x(start[0]), y, 10, C.bg, color, 3);
      if (r.progress > 0) {
        const tip = x(start[0] + r.update[0] * r.progress);
        api.arrow(ctx, x(start[0]), y, tip, y, color, 8);
      }
      api.text(ctx, r.revealed ? 'Next ≈ ' + pair(r.next, 4) : 'Next = (?, ?)', 1360, y, 35, color);
      if (r.revealed) api.text(ctx, 'Δw ≈ ' + pair(r.update, 4), 1360, y + 57, 30, C.muted);
    });
  }
  if (beat === 0)
    api.focus.target('transfer-question', () =>
      api.text(ctx, 'Which update will cross the target?', 960, 1012, 42, C.ink, 'center'),
    );
  if (beat === 2)
    api.focus.target('transfer-receipts', () =>
      api.text(
        ctx,
        'Same first gradient  ' + pair(steps.sgd.gradient),
        960,
        1012,
        39,
        C.ink,
        'center',
      ),
    );
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-prediction',
    'transfer-sgd',
    'transfer-momentum',
    'transfer-adam',
    'transfer-receipts',
  ],
};
