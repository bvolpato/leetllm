import { overflowReroute, queueExample, spokenProgress } from '../construction.mjs';
import { drawQueues, drawReturn, queueCaption } from '../queues.mjs';

export function drawCapacityLimit(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { routes, token, gates } = overflowReroute(0);
  const batch = queueExample(routes, token, gates);
  const fill = spokenProgress(api, state, 'arrange-arrivals', 0, 0.1, 0.62);
  const cutoff = spokenProgress(api, state, 'four-slots', 0, 0.65, 0.92);
  const answered = spokenProgress(api, state, 'third-returns', 2, 0.04, 0.3) === 1;
  const counted = spokenProgress(api, state, 'overflow-assignments', 2, 0.55, 0.74) === 1;
  const residual = spokenProgress(api, state, 'residual-positions', 2, 0.75, 0.83) === 1;
  const formula =
    batch.tokens + ' tokens × ' + batch.k + ' routes ÷ ' + batch.experts + ' experts  ·  factor 1';
  let question = '';
  if (beat === 1) question = 'Which of t4’s two expert outputs reaches the sum?';
  if (residual)
    question =
      batch.totalOverflow +
      ' of ' +
      batch.assignments +
      ' assignments dropped  ·  all ' +
      batch.tokens +
      ' residual positions remain';
  queueCaption(ctx, api, formula, question);
  drawQueues(ctx, api, batch, {
    arrivals: fill,
    boundary: cutoff === 1 ? batch.slots : undefined,
    boundaryLabel: batch.slots + ' slots',
    markOverflow: counted,
    labelOverflow: true,
  });
  drawReturn(ctx, api, batch, { resolved: answered });
}

export default {
  id: 'capacity-limit',
  draw: drawCapacityLimit,
  cues: [
    'arrange-arrivals',
    'four-slots',
    'find-four',
    'third-returns',
    'retained-gate',
    'overflow-assignments',
    'residual-positions',
  ],
};
