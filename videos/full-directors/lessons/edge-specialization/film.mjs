import { manual, fit } from './manual.mjs';
import { training, objective } from './training.mjs';
import { graph, exportTests } from './export-path.mjs';
import { thermal, energy, field } from './shift.mjs';
import { privacy, hybrid, updates, receipt } from './lifecycle.mjs';
import { checkExamples } from './examples.mjs';

const scenes = {
  c01: manual,
  c02: manual,
  fit,
  c03: training,
  objective,
  c04: graph,
  export: exportTests,
  c05: thermal,
  c06: energy,
  c07: privacy,
  hybrid,
  c08: updates,
  receipts: receipt,
  field,
};
export default {
  title: 'Teaching a Small Model a Focused Skill',
  draw(ctx, clock) {
    scenes[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkExamples();
    return true;
  },
};
