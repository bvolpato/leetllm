import { text } from '../defaults.mjs';

export function drawRunReceipt(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('run-receipt-mechanism', () => {
    if (state.beat === 0) {
      text(ctx, api, 'incident-router.pt', 240, 343, 62, C.ink);
      const entries = [
        ['Model', 'Architecture and optimizer settings'],
        ['Feature order', '["urgency", "severity_language"]'],
        ['Output columns', '0 = standard     1 = escalate'],
        ['Selection', 'Data source, split IDs, loss curves, selection metric'],
      ];
      entries.forEach(([key, value], index) => {
        const y = 495 + 119 * index;
        api.line(ctx, 240, y - 66, 1680, y - 66, C.muted, 2);
        text(ctx, api, key, 250, y, 39, C.cyan);
        api.text(ctx, value, 690, y, 39, C.ink, 'left', key === 'Feature order' ? 'mono' : 'sans');
      });
      return;
    }
    if (state.beat === 1) {
      const xs = [740, 1120, 1500];
      text(ctx, api, 'Weights used to score each batch', 960, 338, 54, C.ink, 'center');
      for (const [row, label] of ['During training', 'Checkpoint evaluation'].entries()) {
        const y = 565 + row * 230;
        text(ctx, api, label, 190, y, 36, row ? C.green : C.cyan);
        xs.forEach((x, i) => {
          text(ctx, api, 'batch ' + (i + 1), x, y - 62, 32, C.muted, 'center');
          text(
            ctx,
            api,
            row ? 'saved W' : 'W' + ['₀', '₁', '₂'][i],
            x,
            y + 28,
            54,
            row ? C.green : C.cyan,
            'center',
          );
        });
      }
      return;
    }
    const cue = state.cues?.['receipt-next'];
    const next = cue ? cue.phase !== 'before' : state.beatP >= 0.55;
    text(
      ctx,
      api,
      next ? 'Resume both copies on the same next batch' : 'Score the same ticket in both copies',
      960,
      353,
      54,
      C.ink,
      'center',
    );
    for (const [i, name] of ['Uninterrupted router', 'Reloaded router'].entries()) {
      const x = i ? 1370 : 550;
      const color = i ? C.green : C.cyan;
      text(ctx, api, name, x, 560, 47, color, 'center');
      api.line(ctx, x - 290, 606, x + 290, 606, color, 4);
      text(
        ctx,
        api,
        next ? 'updated weights' : '[standard, escalate]',
        x,
        720,
        50,
        C.ink,
        'center',
      );
    }
    text(
      ctx,
      api,
      next
        ? 'Compare each parameter after the step.'
        : 'Compare both route scores before another step.',
      960,
      944,
      42,
      C.ink,
      'center',
    );
  });
}

export default {
  id: 'run-receipt',
  draw: drawRunReceipt,
  cues: ['run-receipt-beat-0', 'run-receipt-beat-1', 'run-receipt-beat-2', 'receipt-next'],
};
