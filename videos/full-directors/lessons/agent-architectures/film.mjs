import { brush, cues } from './studio.mjs';
import { museum, checkMuseum } from './museum.mjs';
import { measurement, checkMeasurements } from './measurements.mjs';
import { investigation, checkInvestigation } from './investigation.mjs';
import { dependency, checkDependency } from './dependencies.mjs';
import { runtime, checkRuntime } from './runtime.mjs';

const painters = [
  museum,
  museum,
  museum,
  museum,
  measurement,
  investigation,
  investigation,
  museum,
  measurement,
  measurement,
  investigation,
  investigation,
  investigation,
  measurement,
  museum,
  dependency,
  measurement,
  museum,
  dependency,
  dependency,
  dependency,
  dependency,
  measurement,
  measurement,
  runtime,
  runtime,
  runtime,
  measurement,
  runtime,
  runtime,
  runtime,
  investigation,
  museum,
  museum,
];
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  try {
    const chapter = clock.beat.chapterIndex;
    painters[chapter](brush(ctx), clock, cues(clock), chapter + 1);
  } finally {
    ctx.restore();
  }
}
function check() {
  checkMuseum();
  checkMeasurements();
  checkInvestigation();
  checkDependency();
  checkRuntime();
}
export default { title: 'Building an Agent Around Observations', draw, check };
