import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import s0 from './scenes/intro.mjs';
import s1 from './scenes/neighbors.mjs';
import s2 from './scenes/algorithm-contract.mjs';
import s3 from './scenes/kmeans.mjs';
import s4 from './scenes/initialization.mjs';
import s5 from './scenes/seeding-mass.mjs';
import s6 from './scenes/choose-k.mjs';
import s7 from './scenes/silhouette-ledger.mjs';
import s8 from './scenes/objective-ties.mjs';
import rectangle from './scenes/fresh-seed-repair.mjs';
import s9 from './scenes/scale.mjs';
import s10 from './scenes/scale-boundary.mjs';
import s11 from './scenes/pca.mjs';
import s12 from './scenes/solver-contract.mjs';
import s13 from './scenes/compression.mjs';
import s14 from './scenes/variance-ledger.mjs';
import s15 from './scenes/metric-choice.mjs';
import s16 from './scenes/spherical-centers.mjs';
import s17 from './scenes/centered-cosine.mjs';
import s18 from './scenes/ivf.mjs';
import s19 from './scenes/ivf-work.mjs';
import s21 from './scenes/audit-labels.mjs';
import signInSearch from './scenes/takeaway.mjs';
export default narratedLesson({
  id: 'clustering-pca',
  scenes: {
    'intro': s0,
    'neighbors': s1,
    'algorithm-contract': s2,
    'kmeans': s3,
    'initialization': s4,
    'seeding-mass': s5,
    'choose-k': s6,
    'silhouette-ledger': s7,
    'objective-ties': s8,
    'fresh-seed-repair': rectangle,
    'scale': s9,
    'scale-boundary': s10,
    'pca': s11,
    'solver-contract': s12,
    'compression': s13,
    'variance-ledger': s14,
    'metric-choice': s15,
    'spherical-centers': s16,
    'centered-cosine': s17,
    'ivf': s18,
    'ivf-work': s19,
    'audit-labels': s21,
    'takeaway': signInSearch,
  },
});
