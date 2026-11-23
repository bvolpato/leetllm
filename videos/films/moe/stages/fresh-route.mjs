import { queueExample, spokenProgress } from '../construction.mjs';
import { MOE_FRESH_ROUTES } from '../fixtures.mjs';
import { drawQueues, drawReturn, queueCaption } from '../queues.mjs';

export function drawFreshRoute(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const gates = [0.25, 0.75];
  const first = queueExample(MOE_FRESH_ROUTES, 3, gates);
  const second = queueExample(MOE_FRESH_ROUTES, 3, gates, 1.5);
  const fill = spokenProgress(api, state, 'fresh-arrivals', 0, 0.05, 0.55);
  const cut = spokenProgress(api, state, 'locate-limit', 1, 0.05, 0.34);
  const one = spokenProgress(api, state, 'fresh-survivor', 1, 0.36, 0.68) === 1;
  const firstVector = spokenProgress(api, state, 'fresh-first-vector', 1, 0.68, 0.9) === 1;
  const wider = spokenProgress(api, state, 'raise-factor', 2, 0.06, 0.32) === 1;
  const sized = spokenProgress(api, state, 'extend-limit', 3, 0.05, 0.26) === 1;
  const fitCue = state.cues?.['mo-fresh-fit'];
  const expand = fitCue
    ? api.phase(state.t, fitCue.end, fitCue.end + 0.5)
    : spokenProgress(api, state, 'mo-fresh-fit', 3, 0.33, 0.42);
  const both = expand === 1 && spokenProgress(api, state, 'fresh-pair', 3, 0.42, 0.74) === 1;
  const secondVector = spokenProgress(api, state, 'fresh-second-vector', 3, 0.75, 0.96) === 1;
  const model = expand === 1 ? second : first;
  const factor = wider ? second.factor : first.factor;
  const expression =
    'Slots per expert = ceil(' +
    first.tokens +
    ' × ' +
    first.k +
    ' ÷ ' +
    first.experts +
    ' × ' +
    factor +
    ')' +
    (sized ? ' = ' + second.slots : '');
  let question = '';
  if (beat === 0) question = 'How many slots per expert? Which of t3’s routes fits?';
  if (beat === 1 && one)
    question = first.totalOverflow + ' dropped assignments in E1  ·  surviving gates kept';
  if (beat === 2 && wider) question = 'With the larger buffer, what routed vector will t3 receive?';
  if (expand === 1)
    question = second.assignments + ' assignments fit  ·  ' + second.totalOverflow + ' overflow';
  queueCaption(ctx, api, expression, question);
  drawQueues(ctx, api, model, {
    arrivals: fill,
    showLoads: true,
    boundary: cut === 1 ? api.lerp(first.slots, second.slots, expand) : undefined,
    boundaryLabel:
      expand > 0 && expand < 1
        ? 'Resizing'
        : (wider && expand === 0 ? 'Previous limit: ' : '') + model.slots + ' slots',
    markOverflow: one && expand === 0,
  });
  drawReturn(ctx, api, model, {
    resolved: wider ? both : one,
    showOutput: wider ? both && secondVector : one && firstVector,
    previousOutput: wider ? first.output : undefined,
  });
}

export default {
  id: 'fresh-route',
  draw: drawFreshRoute,
  cues: [
    'fresh-arrivals',
    'fresh-question',
    'locate-limit',
    'fresh-survivor',
    'fresh-first-vector',
    'raise-factor',
    'extend-limit',
    'mo-fresh-fit',
    'fresh-pair',
    'fresh-second-vector',
  ],
};
