import { cueProgress } from '../construction.mjs';
import { drawForecastCalendar, usd } from '../forecast-calendar.mjs';
import { coldNightExtraMicro, monthlyMicro } from '../fixtures.mjs';

export default {
  id: 'twelfth-night',
  cues: ['eleven-nights', 'post-twelfth'],
  draw(ctx, scene, state, api) {
    const beat = state.beat ?? 0;
    const eleven = beat > 0 ? 1 : cueProgress(state, 'eleven-nights', state.beatP ?? 0);
    const last = beat < 2 ? 0 : cueProgress(state, 'post-twelfth', state.beatP ?? 0);
    const cold = Math.floor(11 * eleven) + Number(last === 1);
    const marked = beat > 0 ? 12 : cold;
    const expression = usd(monthlyMicro) + ' + ' + cold + ' × ' + usd(coldNightExtraMicro);
    drawForecastCalendar(ctx, api, {
      cold,
      marked,
      calculation:
        beat === 1 || (beat === 2 && last < 1)
          ? '$1.14 left. Can it cover another $2.88?'
          : expression + ' = ' + usd(monthlyMicro + cold * coldNightExtraMicro),
      note:
        cold === 12
          ? 'Check recent cache reads before scheduling the next run.'
          : 'Only the nightly input price changes. Support and evaluation volume stay fixed.',
    });
  },
};
