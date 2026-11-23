import { checkForecasts } from './forecast.mjs';
import { opening, target, cost, horizons, origin, copyDay, fitScene, campaign } from './dock.mjs';
import { ledger, mature, peak, signals, acceptance, gates } from './evaluation.mjs';
import { feed, experiments, practiceScene } from './audit.mjs';

const painters = [
  opening,
  target,
  cost,
  horizons,
  origin,
  copyDay,
  fitScene,
  campaign,
  ledger,
  mature,
  peak,
  signals,
  acceptance,
  gates,
  feed,
  experiments,
  practiceScene,
];

export default {
  title: 'Forecast Tomorrow and Judge It Later',
  draw(g, clock) {
    g.save();
    g.scale(2, 2);
    painters[clock.beat.chapterIndex](g, clock);
    g.restore();
  },
  check: checkForecasts,
};
