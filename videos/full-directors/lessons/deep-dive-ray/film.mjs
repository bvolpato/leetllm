import { opening, schedule, argumentsScene, copies, checkResults } from './results.mjs';
import { placement, cpu, windowScene, memory, checkResources } from './resources.mjs';
import { restart, control, retry, retryPolicy, checkRecovery } from './recovery.mjs';
import { serving, replicas, practice, checkServing } from './serving.mjs';
import { lab, checkLab } from './lab.mjs';

const painters = {
  c01: opening,
  c02: schedule,
  arguments: argumentsScene,
  c03: copies,
  c04: placement,
  cpu,
  c05: windowScene,
  memory,
  c06: restart,
  control,
  c07: retry,
  'retry-policy': retryPolicy,
  'local-lab': lab,
  c08: serving,
  replicas,
  practice,
};

export default {
  title: 'Ray and the Life of a Remote Result',
  draw(ctx, clock) {
    painters[clock.beat.chapterId](ctx, clock);
  },
  check() {
    checkResults();
    checkResources();
    checkRecovery();
    checkServing();
    checkLab();
  },
};
