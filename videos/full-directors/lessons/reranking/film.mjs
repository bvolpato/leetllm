import { Plate } from './paint.mjs';
import { check } from './evidence.mjs';
import { joint, scalar, rank, reply } from './library.mjs';
import { access, points, spans, ledger, learned, receipt } from './policy.mjs';
import { losses, tokenScore, listwise, cache, maxsim } from './models.mjs';
import { calibration, metrics, depthCost, serving } from './evaluation.mjs';
import { overnight } from './locker.mjs';

import { drawSundayWindows, checkSundayWindows } from './sunday-windows.mjs';

const windows = (p) => drawSundayWindows(p.c, p.clock);
const chapters = [
  windows,
  windows,
  joint,
  scalar,
  rank,
  access,
  points,
  spans,
  ledger,
  learned,
  losses,
  tokenScore,
  listwise,
  cache,
  maxsim,
  calibration,
  metrics,
  depthCost,
  serving,
  receipt,
  reply,
  overnight,
];

export default {
  title: 'Giving Retrieved Passages a Second Look',
  check() {
    check();
    checkSundayWindows();
  },
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](new Plate(ctx, clock));
  },
};
