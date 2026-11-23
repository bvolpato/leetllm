import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import scene0 from './scenes/intro.mjs';
import scene1 from './scenes/coordinates.mjs';
import scene2 from './scenes/directions.mjs';
import scene3 from './scenes/mixture.mjs';
import scene4 from './scenes/dot.mjs';
import scene5 from './scenes/composition.mjs';
import scene6 from './scenes/rows.mjs';
import scene7 from './scenes/tensor.mjs';
import scene8 from './scenes/local-edit.mjs';
import scene9 from './scenes/latency-gradient.mjs';
import scene10 from './scenes/latency-dot.mjs';
import scene11 from './scenes/request-batch.mjs';
import scene12 from './scenes/many-outputs.mjs';
import scene13 from './scenes/shape-guard.mjs';
import scene14 from './scenes/broadcasting.mjs';
import scene15 from './scenes/pairwise-scores.mjs';
import scene16 from './scenes/normalized-scores.mjs';
import scene17 from './scenes/batched-transpose.mjs';
import scene18 from './scenes/pooling.mjs';
import scene19 from './scenes/padding-mask.mjs';
import scene20 from './scenes/input-guards.mjs';
import scene21 from './scenes/linear-api.mjs';
import scene22 from './scenes/fresh-case.mjs';
export default narratedLesson({
  id: 'vectors',
  scenes: {
    'intro': scene0,
    'coordinates': scene1,
    'directions': scene2,
    'mixture': scene3,
    'dot': scene4,
    'composition': scene5,
    'rows': scene6,
    'tensor': scene7,
    'local-edit': scene8,
    'latency-gradient': scene9,
    'latency-dot': scene10,
    'request-batch': scene11,
    'many-outputs': scene12,
    'shape-guard': scene13,
    'broadcasting': scene14,
    'pairwise-scores': scene15,
    'normalized-scores': scene16,
    'batched-transpose': scene17,
    'pooling': scene18,
    'padding-mask': scene19,
    'input-guards': scene20,
    'linear-api': scene21,
    'fresh-case': scene22,
  },
});
