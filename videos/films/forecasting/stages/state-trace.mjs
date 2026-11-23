import { timedForecastScene } from '../construction.mjs';
import { monitorStrip } from '../monitor-strip.mjs';

const values = [4, 5, null, 4, 2, 4, 0, -1];
const steps = ['first', 'entry', 'missing', 'fifteen', 'twenty', 'twenty-five', 'thirty', 'clear'];
const scene = timedForecastScene('state-trace', (ctx, api, clock) => {
  monitorStrip(ctx, api, {
    values,
    steps,
    clock,
    question: clock.after('clear')
      ? 'Review opens at minute 5 and clears at minute 35.'
      : clock.after('twenty-five')
        ? 'The breach at 25 breaks the clean run.'
        : clock.after('twenty')
          ? 'Will the review clear at minute 25?'
          : 'Track the current run and whether the review is open.',
  });
});

export const drawStateTrace = scene.draw;
export default scene;
