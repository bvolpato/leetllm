import { timedForecastScene } from '../construction.mjs';
import { alertErrorValues } from '../fixtures.mjs';
import { monitorStrip } from '../monitor-strip.mjs';

const steps = ['first', 'entry', 'missing', 'clean', 'clear'];
const scene = timedForecastScene('alert-state', (ctx, api, clock) => {
  monitorStrip(ctx, api, {
    values: alertErrorValues,
    steps,
    clock,
    available: steps.filter((key) => clock.progress(key) > 0).length,
    question: clock.after('clear')
      ? 'One entry requested a review. Delivery needs its own record.'
      : clock.after('missing')
        ? 'A missing count interrupts the run. The open review carries forward.'
        : 'One cluster  ·  one check every five minutes',
  });
});

export const drawAlertState = scene.draw;
export default scene;
