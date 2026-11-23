import { cueProgress } from '../arithmetic.mjs';

export function drawDiagnosticRepair(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (str, x, y, size, color = C.ink) => api.text(ctx, str, x, y, size, color);
  const repair = state.beat === 1;
  const reached = (beat, id, start, end) => cueProgress(state, beat, id, start, end);

  focus.target('sc-diagnostic-repair-mechanism', () => {
    text('Request', 130, 270, 32, C.cyan);
    text('Can I restore a revoked API key?', 130, 350, 54);
    text('Saved reply', 1125, 270, 32, C.blue);
    text('30 days', 1120, 375, 100, C.blue);
    api.line(ctx, 130, 440, 1790, 440, C.muted, 2);
  });

  if (!repair) {
    focus.target('missing-fact', () => {
      if (reached(0, 'pair-diagnosis', 0.2, 0.42) > 0) {
        text('Needed', 130, 535, 31, C.muted);
        text('Restoration rule', 130, 612, 54, C.yellow);
        text('Supplied', 1125, 535, 31, C.muted);
        text('Audit retention period', 1125, 612, 54, C.blue);
      }
    });
    const rows = [
      ['trace-bypasses', 'More bypasses', 'Inspect the route and release.', C.cyan],
      ['trace-savings', 'Lower savings', 'Price the lookups and the misses.', C.blue],
      ['trace-tail', 'Slower p95', 'Sort all request times.', C.yellow],
    ];
    rows.forEach(([cue, label, action, color], i) => {
      if (reached(0, cue, 0.5 + i * 0.16, 0.61 + i * 0.16) === 0) return;
      focus.target(cue, () => {
        const y = 747 + i * 95;
        text(label, 134, y, 39, color);
        api.arrow(ctx, 578, y - 11, 700, y - 11, color, 3);
        text(action, 746, y, 42);
      });
    });
    return;
  }

  const divert = reached(1, 'route-restoration', 0.44, 0.68);
  text('Evaluated retention route', 130, 555, 40, C.cyan);
  text('Fresh policy read', 1285, 555, 40, C.yellow);
  for (let i = 0; i < 4; i++) {
    const x = 132 + i * 176;
    api.rect(ctx, x, 643, 142, 95, C.panel, C.cyan, 15);
    text('P' + (i + 1), x + 43, 705, 38, C.cyan);
  }
  focus.target('restoration-case', () => {
    const x = api.lerp(835, 1285, api.ease(divert));
    api.rect(ctx, x, 643, 142, 95, C.panel, C.pink, 15);
    text('P5', x + 43, 705, 38, C.pink);
    text('Restoration', x, 804, 32, C.pink);
  });
  text('Four questions about duration', 132, 804, 32, C.muted);
  if (divert === 1) text('Keep P5 in the next evaluation.', 130, 953, 44);
}

export default {
  id: 'diagnostic-repair',
  draw: drawDiagnosticRepair,
  cues: [
    'sc-diagnostic-repair-b0',
    'pair-diagnosis',
    'trace-bypasses',
    'trace-savings',
    'trace-tail',
    'sc-diagnostic-repair-b1',
    'route-restoration',
  ],
};
