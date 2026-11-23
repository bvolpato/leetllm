import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import scene0 from './scenes/intro.mjs';
import scene1 from './scenes/lookup.mjs';
import scene2 from './scenes/table-contract.mjs';
import scene3 from './scenes/neighbors.mjs';
import scene4 from './scenes/count-ppmi.mjs';
import scene5 from './scenes/factorization.mjs';
import scene6 from './scenes/predictive-window.mjs';
import scene7 from './scenes/negative-step.mjs';
import scene8 from './scenes/shifted-pmi.mjs';
import scene9 from './scenes/glove-fit.mjs';
import scene10 from './scenes/subword-components.mjs';
import scene11 from './scenes/geometry.mjs';
import scene12 from './scenes/context.mjs';
import scene13 from './scenes/article-context.mjs';
import scene14 from './scenes/elmo-layers.mjs';
import scene15 from './scenes/visibility-test.mjs';
import scene16 from './scenes/contrast.mjs';
import scene17 from './scenes/pooling.mjs';
import scene18 from './scenes/limits.mjs';
import scene19 from './scenes/anisotropy-check.mjs';
import scene20 from './scenes/space-contract.mjs';
import scene21 from './scenes/transfer.mjs';
import scene22 from './scenes/fresh-representation.mjs';
const scenes = {
  'intro': scene0,
  'lookup': scene1,
  'table-contract': scene2,
  'neighbors': scene3,
  'count-ppmi': scene4,
  'factorization': scene5,
  'predictive-window': scene6,
  'negative-step': scene7,
  'shifted-pmi': scene8,
  'glove-fit': scene9,
  'subword-components': scene10,
  'geometry': scene11,
  'context': scene12,
  'article-context': scene13,
  'elmo-layers': scene14,
  'visibility-test': scene15,
  'contrast': scene16,
  'pooling': scene17,
  'limits': scene18,
  'anisotropy-check': scene19,
  'space-contract': scene20,
  'transfer': scene21,
  'fresh-representation': scene22,
};
export default narratedLesson({ id: 'embeddings', scenes });
