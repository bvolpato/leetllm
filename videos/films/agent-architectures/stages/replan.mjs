import { cueAmount, cueDone } from '../defaults.mjs';
import { visitMap } from '../visit-map.mjs';
import { BUS_ROUTE } from '../fixtures.mjs';
import { clock } from '../arithmetic.mjs';

export function drawReplan(ctx, scene, state, api) {
  const cancelled = cueDone(state, 'replan-cancel');
  const ask = cueAmount(state, 'replan-predict') > 0;
  const refresh = cueDone(state, 'replan-refresh');
  const bus = cueAmount(state, 'replan-bus-route');
  const routeLabel = cancelled ? 'train-22   /   cancelled' : 'train-22   /   feasible today';
  const busLabel = cueDone(state, 'replan-bus')
    ? BUS_ROUTE.id + '   /   bus ' + clock(BUS_ROUTE.depart)
    : '';
  let question = 'One visit supported by a museum lookup and a transit lookup';
  if (ask) question = 'One lookup left. Hours or journey?';
  if (refresh) question = 'Find a new journey. The train recommendation needs to be checked again.';
  if (cueDone(state, 'replan-recheck'))
    question = 'Use the bus timetable to calculate a new finish.';
  visitMap(ctx, api, {
    hoursKnown: true,
    artLabel: 'Earlier route to Art',
    trainAmount: 1,
    busAmount: bus,
    busLabel,
    cancelled,
    retainHours: cueDone(state, 'replan-keep'),
    routeLabel,
    question,
  });
}
export default {
  id: 'replan',
  draw: drawReplan,
  cues: [
    'replan-hours',
    'replan-train',
    'replan-cancel',
    'replan-predict',
    'replan-refresh',
    'replan-keep',
    'replan-bus',
    'replan-bus-route',
    'replan-recheck',
  ],
};
