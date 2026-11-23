import { phases } from '../fixtures.mjs';
import { cueProgress, afterClause } from '../timing.mjs';

const total = phases.reduce((sum, [, duration]) => sum + duration, 0);
const x = (seconds) => 395 + (240 + seconds) * 2.96;

export function drawColdpath(ctx, scene, state, api) {
  const { C } = api;
  const lead =
    120 * cueProgress(state, 'two-minute-lead', 1, 0.03, 0.55) +
    120 * cueProgress(state, 'four-minute-lead', 3, 0.04, 0.55);
  const now = -lead + total * cueProgress(state, 'startup-chain', 0, 0.15, 0.77);
  const readyAt = total - lead;
  const late = afterClause(state, 'late-readiness', 2, 0.55);
  const early = afterClause(state, 'ready-margin', 4, 0.47);
  const onTime = afterClause(state, 'ready-boundary', 0, 0.98);
  api.focus.target('burst-boundaries', () => {
    api.text(ctx, 'Nine o’clock', x(0) - 15, 287, 35, C.ink, 'right');
    api.text(ctx, 'Last start', x(30) + 12, 287, 35, C.yellow);
    api.text(ctx, '0 s', x(0) - 15, 336, 32, C.ink, 'right');
    api.text(ctx, '+30 s', x(30) + 12, 336, 32, C.yellow);
    api.line(ctx, x(0), 310, x(0), 810, C.muted, 3);
    api.line(ctx, x(30), 310, x(30), 810, C.yellow, 4);
  });
  api.focus.target('startup-phases', () => {
    let start = -lead;
    for (const [i, [name, duration]] of phases.entries()) {
      const end = start + duration;
      const y = 408 + i * 92;
      api.text(ctx, name, 140, y + 36, 32, C.ink);
      api.text(ctx, duration + ' s', 373, y + 36, 31, C.muted, 'right');
      const filled = Math.max(0, Math.min(duration, now - start));
      api.rect(ctx, x(start), y, x(end) - x(start), 45, C.panel, C.muted, 4);
      if (filled > 0)
        api.rect(ctx, x(start), y, x(start + filled) - x(start), 45, C.cyan, undefined, 4);
      start = end;
    }
    api.circle(ctx, x(now), 793, 9, C.cyan);
  });
  api.focus.target('startup-result', () => {
    let message = 'One worker starts from a cold node';
    if (onTime) message = '207 s from requesting a node to serving traffic';
    if (state.beat === 1 || state.beat === 2)
      message = late
        ? 'Ready at +' +
          Math.round(readyAt) +
          ' s  ·  ' +
          Math.round(readyAt - 30) +
          ' s past the last start'
        : 'Start two minutes early. Can this worker serve the burst?';
    if (state.beat >= 3)
      message = early
        ? 'Ready ' + Math.round(-readyAt) + ' s before the requests arrive'
        : 'Start four minutes early. Where does warmup finish?';
    api.text(ctx, message, 960, 942, 42, early ? C.cyan : C.ink, 'center');
  });
}
export default {
  id: 'coldpath',
  draw: drawColdpath,
  cues: [
    'startup-chain',
    'ready-boundary',
    'two-minute-lead',
    'late-readiness',
    'four-minute-lead',
    'ready-margin',
  ],
};
