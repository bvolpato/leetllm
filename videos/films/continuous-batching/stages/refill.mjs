import { schedule, scheduleSnapshot } from '../model.mjs';
import { cueProgress, drawEstablishedBatchingGrid, drawEstablishedBatchingColor as requestColor } from '../defaults.mjs';

const fixed = schedule(false);
const refill = schedule(true);

function drawFinishes(ctx, state, api) {
  const { C } = api;
  const moving = cueProgress(state, 'refill-end', 0.36, 0.48);
  const fixedTail = cueProgress(state, 'static-end', 0.72, 0.8);
  const x = tick => 620 + (tick - 6) * 201;
  api.focus.target('decode-grid', () => {
    api.text(ctx, 'Decode step', 200, 283, 34, C.muted);
    for (let tick = 6; tick <= fixed.length; tick++)
      api.text(ctx, String(tick), x(tick), 283, 37, C.ink, 'center');
    for (const [row, trace] of [refill, fixed].entries()) {
      const base = 390 + row * 268;
      const end = 6 + Math.ceil((trace.length - 6) * (row === 0 ? moving : fixedTail));
      api.text(ctx, row === 0 ? 'Refill' : 'Fixed groups', 200, base + 67, 40, C.ink);
      for (const [lane, id] of ['D', 'E'].entries()) {
        const y = base + lane * 95;
        api.line(ctx, x(6) - 82, y + 43, x(11) + 82, y + 43, C.muted, 1);
        for (let tick = 6; tick <= end; tick++) {
          const entry = trace[tick - 1].slots.find(r => r?.id === id);
          if (!entry) continue;
          const color = requestColor(ctx, api, id);
          api.rect(ctx, x(tick) - 71, y - 38, 142, 69, C.panel, color, 6);
          api.text(ctx, id + ' · ' + entry.generated, x(tick), y + 9, 31, color, 'center');
        }
      }
    }
    api.focus.target('refill-finish', () => {
      const text = fixedTail >= 1 ? 'Last reply   ·   refill at ' + refill.length + '   ·   fixed groups at ' + fixed.length
        : moving >= 1 ? 'Refill   ·   last reply at step ' + refill.length : 'Same five replies, just past step six';
      api.text(ctx, text, 960, 955, 43, C.ink, 'center');
    });
  });
}
export function drawRefill(ctx, scene, state, api) {
  if (state.beat === 2) return drawFinishes(ctx, state, api);
  let reveal = 6;
  if (!state.beat) {
    reveal = 2;
    if (cueProgress(state, 'refill-seat', 0.15, 0.28) > 0) reveal = 3;
    if (cueProgress(state, 'refill-b-ends', 0.46, 0.54) > 0) reveal = 4;
    if (cueProgress(state, 'refill-e-starts', 0.55, 0.62) > 0) reveal = 5;
    if (cueProgress(state, 'continuing-identity', 0.77, 0.92) > 0) reveal = 6;
  }
  drawEstablishedBatchingGrid(ctx, api, refill, reveal);
  const snapshot = scheduleSnapshot(true, reveal);
  api.focus.target('static-readout', () =>
    api.text(ctx, snapshot.tokens + ' useful tokens / ' + snapshot.reserved + ' reserved seat-steps',
      960, 285, 39, api.C.green, 'center'));
}
export default {
  id: 'refill',
  draw: drawRefill,
  cues: ['refill-seat', 'refill-b-ends', 'refill-e-starts', 'continuing-identity', 'full-seats',
    'useful-token-count', 'request-trace', 'finished-once', 'refill-end', 'static-end'],
};
