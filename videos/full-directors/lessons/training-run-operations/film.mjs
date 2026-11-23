import { background } from './recorder.mjs';
import { check } from './run.mjs';
import { opening, accumulation, replicas, cursor, snapshot, durable } from './checkpoints.mjs';
import { warning, intervals, trajectory, adam, reshard, readerMemory } from './measurements.mjs';
import { schedule, tokens, overflow, diagnosis, memory } from './optimization.mjs';
import { rehearsal } from './drill.mjs';

const chapters = [
  opening,
  accumulation,
  replicas,
  cursor,
  snapshot,
  durable,
  warning,
  intervals,
  trajectory,
  adam,
  reshard,
  readerMemory,
  schedule,
  tokens,
  overflow,
  diagnosis,
  memory,
  rehearsal,
];

export default {
  title: 'Keep a Training Run Recoverable',
  check,
  draw(ctx, clock) {
    background(ctx);
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
};
