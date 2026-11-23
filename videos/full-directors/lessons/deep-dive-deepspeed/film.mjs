import { opening, ownership, dtype, gather, padded, plan, checkMemory } from './memory.mjs';
import { reduction, objective, accumulation, contracts, groups, checkpoint, save, late, checkUpdates } from './updates.mjs';
import { access, collectives, coalescing, transfer, domains, checkSchedules } from './schedules.mjs';
import { engine, convert, investigate, synthesis, checkTraces } from './traces.mjs';

const painters = {
  c01: opening, c02: ownership, c03: dtype, c04: reduction, c05: objective,
  c06: accumulation, c07: contracts, c08: groups, c09: gather, c10: padded,
  c11: access, c12: collectives, c13: coalescing, c14: transfer, c15: domains,
  c16: engine, c17: checkpoint, c18: save, c19: convert, c20: investigate,
  c21: synthesis, c22: late, c23: plan,
};

export default {
  title: 'DeepSpeed and the State Behind a Training Step',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkMemory();
    checkUpdates();
    checkSchedules();
    checkTraces();
  },
};
