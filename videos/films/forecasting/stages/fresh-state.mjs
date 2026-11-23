import { timedForecastScene } from '../construction.mjs';
import { monitorStrip } from '../monitor-strip.mjs';
import { stateTrace } from '../model.mjs';

const forecast = 150,
  observed = 155;
const values = [observed - forecast, null, 6, 7, 1, null, 0, -2];
const steps = ['first', 'missing', 'ten', 'entry', 'twenty', 'reset', 'thirty', 'clear'];
const transitions = stateTrace(values).filter((row) => row.transition);

const scene = timedForecastScene('fresh-state', (ctx, api, clock) => {
  const seen = clock.progress('inputs') > 0;
  let question = 'At which minute does the review open? At which minute does it clear?';
  if (!seen) question = 'First error   =   observed jobs − forecast jobs';
  else if (clock.after('entry'))
    question = 'Review opens at minute ' + transitions[0].minute + '. When does it clear?';
  if (clock.after('clear'))
    question =
      'Review opens at ' +
      transitions[0].minute +
      ' min   ·   clears at ' +
      transitions[1].minute +
      ' min';
  if (clock.progress('ask') > 0)
    question = 'One review request. Did a notification reach the owner?';
  if (clock.after('receipt'))
    question = 'Delivery unknown   ·   look for an acknowledgment for this request';
  monitorStrip(ctx, api, {
    values,
    steps,
    clock,
    question,
    firstCount: 'Minute 0   ·   forecast ' + forecast + '   ·   observed ' + observed,
    available: seen ? values.length : clock.after('first-error') ? 1 : 0,
  });
});

export const drawFreshState = scene.draw;
export default scene;
