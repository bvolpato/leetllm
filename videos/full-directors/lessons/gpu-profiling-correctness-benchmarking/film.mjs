import { drawTrace, drawTail, drawTolerance, checkBoundaries } from './boundaries.mjs';
import { drawRuns, drawPool, drawTraffic, drawRoof, checkMeasurements } from './measurements.mjs';
import { drawRounds, drawDistribution, checkComparisons } from './comparison.mjs';
import { drawReplay, drawReceipt, drawRequest, checkEvidence } from './evidence.mjs';

const chapters = {
  c01: drawTrace,
  c02: drawTail,
  c03: drawTolerance,
  c04: drawRuns,
  pool: drawPool,
  c05: drawTraffic,
  roof: drawRoof,
  distribution: drawDistribution,
  c06: drawRounds,
  replay: drawReplay,
  receipt: drawReceipt,
  c07: drawRequest,
};

export default {
  title: 'How to Trust a GPU Speedup',
  draw(ctx, clock) {
    chapters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    const clock = (beatIndex, amount) => ({
      beat: { beatIndex },
      elapsed: 2,
      wordCue: () => ({ start: 0, end: 0 }),
      reveal: typeof amount === 'function' ? amount : () => amount,
    });
    checkBoundaries(clock);
    checkMeasurements(clock);
    checkComparisons(clock);
    checkEvidence(clock);
  },
};
