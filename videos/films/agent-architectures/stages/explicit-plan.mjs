import { cueAmount, cueDone } from '../defaults.mjs';
import { visitMap } from '../visit-map.mjs';
import { VISIT_HOURS } from '../fixtures.mjs';
import { ready } from '../model.mjs';

export function drawExplicitPlan(ctx, scene, state, api) {
  const train = cueAmount(state, 'plan-match');
  const returned = cueDone(state, 'plan-return');
  const hours = { ...VISIT_HOURS, status: 'open' };
  const journey = { venue: returned ? 'History' : 'Art', day: hours.day, feasible: true };
  const matched = ready({ hours, journey });
  let question = 'Plan   /   Check opening hours, then find a journey to that venue';
  if (cueAmount(state, 'plan-question') > 0)
    question = 'Do these two results support the same visit?';
  if (cueDone(state, 'plan-mismatch')) question = 'Hours for History   ≠   Train to Art';
  if (cueAmount(state, 'plan-new-train') > 0) question = 'Looking up a train to History';
  if (matched) question = 'Train result received. Trace its destination.';
  if (matched && train === 1) question = 'Both results name History Museum';
  if (matched && cueDone(state, 'plan-unlock')) question = 'Ready to calculate the History visit';
  visitMap(ctx, api, {
    hoursKnown: true,
    artQuiet: cueDone(state, 'plan-mismatch'),
    routeLabel: returned
      ? 'train-22   /   today'
      : cueAmount(state, 'plan-new-train') > 0
        ? 'History train   /   lookup in flight'
        : 'Journey to History   /   no receipt',
    trainAmount: train,
    retainHours: matched && cueDone(state, 'plan-unlock'),
    question,
  });
}
export default {
  id: 'explicit-plan',
  draw: drawExplicitPlan,
  cues: [
    'plan-hours',
    'plan-journey',
    'plan-hours-in',
    'plan-art',
    'plan-question',
    'plan-mismatch',
    'plan-new-train',
    'plan-return',
    'plan-match',
    'plan-unlock',
    'plan-hybrid',
  ],
};
