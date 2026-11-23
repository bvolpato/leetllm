import { check } from './lab.mjs';
import { opening, clocks, fitScene } from './deliveries.mjs';
import { packageScene, loaderScene, gatesScene, bindingScene } from './registry.mjs';
import { canaryScene, windowScene, recovery, productionDates } from './monitor.mjs';
import { promotion, generation, compareModels, finale } from './switchboard.mjs';
import { products } from './products.mjs';

const chapters = [
  opening,
  clocks,
  fitScene,
  packageScene,
  loaderScene,
  gatesScene,
  bindingScene,
  canaryScene,
  windowScene,
  promotion,
  generation,
  recovery,
  productionDates,
  products,
  compareModels,
  finale,
];

export default {
  title: 'Build a Model Release You Can Recover',
  check,
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.6, 1.6);
    chapters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
};
