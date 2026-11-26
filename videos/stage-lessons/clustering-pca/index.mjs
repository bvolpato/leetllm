// Full-bleed dark-cinema 23-scene Clustering & PCA stage lesson (vizmatic@0.10.0).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyClusteringPcaInvariants } from './parts.mjs';
import algorithmContract from './scenes/algorithm-contract.mjs';
import auditLabels from './scenes/audit-labels.mjs';
import centeredCosine from './scenes/centered-cosine.mjs';
import chooseK from './scenes/choose-k.mjs';
import compression from './scenes/compression.mjs';
import freshSeedRepair from './scenes/fresh-seed-repair.mjs';
import initialization from './scenes/initialization.mjs';
import intro from './scenes/intro.mjs';
import ivfWork from './scenes/ivf-work.mjs';
import ivf from './scenes/ivf.mjs';
import kmeans from './scenes/kmeans.mjs';
import metricChoice from './scenes/metric-choice.mjs';
import neighbors from './scenes/neighbors.mjs';
import objectiveTies from './scenes/objective-ties.mjs';
import pca from './scenes/pca.mjs';
import scaleBoundary from './scenes/scale-boundary.mjs';
import scale from './scenes/scale.mjs';
import seedingMass from './scenes/seeding-mass.mjs';
import silhouetteLedger from './scenes/silhouette-ledger.mjs';
import solverContract from './scenes/solver-contract.mjs';
import sphericalCenters from './scenes/spherical-centers.mjs';
import takeaway from './scenes/takeaway.mjs';
import varianceLedger from './scenes/variance-ledger.mjs';

export default cinematicLesson({
  id: 'clustering-pca',
  accent: COSMOS.cyan,
  invariants: verifyClusteringPcaInvariants,
  scenes: {
    intro,
    neighbors,
    'algorithm-contract': algorithmContract,
    kmeans,
    initialization,
    'seeding-mass': seedingMass,
    'choose-k': chooseK,
    'silhouette-ledger': silhouetteLedger,
    'objective-ties': objectiveTies,
    'fresh-seed-repair': freshSeedRepair,
    scale,
    'scale-boundary': scaleBoundary,
    pca,
    'solver-contract': solverContract,
    compression,
    'variance-ledger': varianceLedger,
    'metric-choice': metricChoice,
    'spherical-centers': sphericalCenters,
    'centered-cosine': centeredCosine,
    ivf,
    'ivf-work': ivfWork,
    'audit-labels': auditLabels,
    takeaway,
  },
});
