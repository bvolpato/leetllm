import { recommend } from '../arithmetic.mjs';
import { cueProgress, afterClause } from '../timing.mjs';

const ready = 4;
const slots = 5;
const demand = { at: 0, running: ready * slots, waiting: 30 };
const first = recommend(demand, ready, ready, 0);
const repeat = recommend(demand, first.target, ready, 1);
const missing = recommend(null, repeat.target, ready, 2);
const spacing = 158;
const x = (i) => 165 + i * spacing;

export function drawController(ctx, scene, state, api) {
  const { C } = api;
  const total = demand.running + demand.waiting;
  const gotQueue = cueProgress(state, 'waiting-snapshot', 0, 0.28, 0.45);
  const waitingShown = Math.floor(demand.waiting * gotQueue);
  const hasTarget = afterClause(state, 'desired-replicas', 1, 0.12);
  const ordered = Math.floor(
    (first.target - ready) * cueProgress(state, 'place-order', 1, 0.3, 0.58),
  );
  const secondPoll = cueProgress(state, 'next-poll', 2, 0.01, 0.15) > 0;
  const hold = afterClause(state, 'pending-counted', 3, 0.15);
  const noSample = afterClause(state, 'missing-telemetry', 3, 0.64);
  api.focus.target('demand-sample', () => {
    api.text(
      ctx,
      noSample ? 'Demand sample unavailable' : secondPoll ? 'Second poll' : 'First poll',
      x(0),
      255,
      40,
      noSample ? C.yellow : C.ink,
    );
    if (!noSample) {
      api.text(ctx, demand.running + ' running', x(0), 354, 36, C.cyan);
      if (waitingShown) api.text(ctx, waitingShown + ' waiting', x(ready), 354, 36, C.yellow);
      for (let i = 0; i < demand.running + waitingShown; i++) {
        const col = Math.floor(i / slots);
        api.rect(
          ctx,
          x(col) + 8 + (i % slots) * 27,
          377,
          22,
          67,
          i < demand.running ? C.cyan : C.yellow,
          undefined,
          3,
        );
      }
    } else {
      api.line(ctx, x(0), 409, x(first.target) - 25, 409, C.muted, 2);
      api.text(ctx, 'Last known order below', x(0), 365, 34, C.muted);
    }
  });
  api.focus.target('worker-order', () => {
    api.text(ctx, 'One replica serves five matching requests', x(0), 529, 34, C.ink);
    for (let i = 0; i < ready + ordered; i++) {
      const filled = i < ready;
      api.rect(ctx, x(i), 570, 142, 145, C.panel, filled ? C.cyan : C.blue, 6);
      api.text(ctx, 'GPU ' + (i + 1), x(i) + 71, 623, 30, C.ink, 'center');
      for (let slot = 0; slot < slots; slot++) {
        const col = filled ? C.cyan : C.blue;
        api.rect(ctx, x(i) + 8 + slot * 26, 651, 20, 37, filled ? col : C.panel, col, 2);
      }
    }
    api.text(ctx, ready + ' ready', x(0), 777, 38, C.cyan);
    if (ordered > 0) api.text(ctx, ordered + ' starting', x(ready), 777, 38, C.blue);
  });
  api.focus.target('poll-decision', () => {
    const message = noSample
      ? 'Hold ' + missing.target + ' desired and alert on the missing sample'
      : hold
        ? repeat.target + ' desired  ·  ' + (repeat.target - first.target) + ' additional workers'
        : secondPoll
          ? 'How many additional workers should this poll request?'
          : hasTarget
            ? total + ' requests ÷ ' + slots + ' slots = ' + first.target + ' replicas in total'
            : gotQueue === 1
              ? 'How many replicas should the controller request in total?'
              : 'Four ready workers own the running streams';
    api.text(ctx, message, 960, 932, 43, noSample ? C.yellow : C.ink, 'center');
  });
}

export default {
  id: 'controller',
  draw: drawController,
  cues: [
    'waiting-snapshot',
    'desired-replicas',
    'place-order',
    'next-poll',
    'pending-counted',
    'missing-telemetry',
  ],
};
