import {check} from './experiments.mjs';
import {opening, reduction} from './reduction.mjs';
import {dispatchScene, evaluator} from './evaluation.mjs';
import {epsilon, performance} from './measurement.mjs';
import {releaseScene} from './release.mjs';

const chapters = [opening, reduction, dispatchScene, evaluator, epsilon, performance, releaseScene];

export default {
  title: 'Turn a Generated Kernel into a Trusted Operator',
  check,
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
};
