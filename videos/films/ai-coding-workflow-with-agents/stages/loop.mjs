import { replay, replayEvidence, sampleModel } from '../model.mjs';
import { shortInvoice } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

export function drawLoop(ctx, scene, state, api) {
  const { C } = api;
  const { time, attempts } = sampleModel('loop', state);
  const runs = [
    { name: 'Base', patch: 'Original handler', start: 0, end: 2, fixed: false },
    { name: 'Repair 1', patch: 'Button change only', start: 3, end: 5, fixed: false },
    { name: 'Repair 2', patch: 'Handler looks up key', start: 6, end: 8, fixed: true },
  ];
  text(ctx, api, 'Sequential replay   ·   same test on each patch', 120, 286, 43, C.ink);
  const cols = [120, 430, 980, 1470];
  ['Run', 'Change tested', 'Returned IDs', 'Stored rows'].forEach((label, i) =>
    text(ctx, api, label, cols[i], 401, 35, C.muted),
  );
  runs.forEach(({ name, patch, start, end, fixed }, i) => {
    const y = 528 + i * 149;
    const count = Math.min(3, Math.floor(3 * Math.max(0, (time - start) / (end - start))));
    const store = replay(fixed, count);
    api.line(ctx, 120, y - 84, 1800, y - 84, C.muted, 1);
    api.focus.target('verification-trace', () => {
      text(ctx, api, name, cols[0], y, 39, time >= start ? C.ink : C.muted);
      if (time < start) return;
      text(ctx, api, patch, cols[1], y, 37, C.ink);
      text(
        ctx,
        api,
        store.deliveries.map((row) => shortInvoice(row.invoice)).join('    ') || 'Running',
        cols[2],
        y,
        40,
        C.blue,
      );
      text(ctx, api, store.count, cols[3], y, 43, C.ink);
      if (time >= end) {
        const passed = replayEvidence(store).every((check) => check.passed);
        text(
          ctx,
          api,
          passed ? 'pass' : i === 0 ? 'expected fail' : 'retry differs',
          cols[1],
          y + 48,
          29,
          passed ? C.green : C.pink,
        );
      }
    });
  });
  api.focus.target('attempt-budget', () =>
    text(ctx, api, 'Repair attempts: ' + attempts + ' / 3', 120, 978, 41, C.yellow),
  );
  api.focus.target('candidate-outcome', () =>
    text(
      ctx,
      api,
      time >= 8 ? 'Candidate verifier PASS' : 'Base run is outside the repair budget',
      940,
      978,
      36,
      time >= 8 ? C.green : C.ink,
    ),
  );
}

export default {
  id: 'loop',
  draw: drawLoop,
  cues: ['loop-b1-1', 'loop-second-repair-build', 'loop-b2-1', 'loop-b2-2'],
};
