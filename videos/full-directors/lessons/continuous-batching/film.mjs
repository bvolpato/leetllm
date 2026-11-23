import {
  departures,
  tokenHistory,
  fixedBoard,
  refillBoard,
  safeBoundary,
  queue,
  checkDepartures,
} from './departures.mjs';
import { prefill, verify, memory, resume, practice, checkResources } from './resources.mjs';
import { latency, handoff, windowScene, loadScene, checkDelivery } from './delivery.mjs';

const painters = {
  c01: departures,
  c02: tokenHistory,
  c03: fixedBoard,
  c04: refillBoard,
  c05: safeBoundary,
  policy: queue,
  c06: prefill,
  verify,
  c07: memory,
  resume,
  c08: latency,
  handoff,
  c09: windowScene,
  load: loadScene,
  practice,
};
export default {
  title: 'Keeping a Model Server Busy',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkDepartures();
    checkResources();
    checkDelivery();
    return true;
  },
};
