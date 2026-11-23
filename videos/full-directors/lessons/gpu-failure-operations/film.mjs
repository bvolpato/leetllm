import {allocation,fragments,ownership} from './memory.mjs';
import {containment,diagnostics} from './operations.mjs';
import {burnIn,readmit} from './recovery.mjs';
import {checkModel} from './incident.mjs';
import {C, rect} from './bench.mjs';

const painters = {c01:allocation,c02:fragments,c03:ownership,c04:containment,c05:diagnostics,c06:burnIn,c07:readmit};

export default {
  title: 'Read the Evidence Before Restarting a GPU Worker',
  draw(ctx,clock) {
    ctx.save();
    try {
      ctx.scale(2,2);
      rect(ctx,0,0,960,540,C.paper);
      ctx.translate(0,-27);
      painters[clock.beat.chapterId](ctx,clock);
    } finally {
      ctx.restore();
    }
  },
  check() {
    checkModel();
    return true;
  }
};

