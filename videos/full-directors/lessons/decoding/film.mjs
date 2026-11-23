import { drawDogFutures, checkDogFutures } from './dog-futures.mjs';
import { start } from './press.mjs';
import { checkModel } from './model.mjs';
import { searchPainters } from './search.mjs';
import { samplingPainters } from './sampling.mjs';
import { processorPainters } from './processors.mjs';
import { deliveryPainters } from './delivery.mjs';

const painters = {
  ...searchPainters,
  ...samplingPainters,
  ...processorPainters,
  ...deliveryPainters,
};

export default {
  title: 'Choosing the Next Token',
  draw(ctx, clock) {
    if (clock.beat.chapterIndex < 3) return drawDogFutures(ctx, clock);
    ctx.save();
    try {
      start(ctx);
      painters[clock.beat.chapterId](ctx, clock);
    } finally {
      ctx.restore();
    }
  },
  check() {
    checkDogFutures();
    checkModel();
    return true;
  },
};
