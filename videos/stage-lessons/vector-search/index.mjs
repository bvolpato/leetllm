// Vector Search for a Rollback Runbook: Full-bleed dark cinema stage lesson (15 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyVectorSearchInvariants } from './parts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import exactBaseline from './scenes/exact-baseline.mjs';
import greedyHops from './scenes/greedy-hops.mjs';
import hierarchyBeam from './scenes/hierarchy-beam.mjs';
import insertGraph from './scenes/insert-graph.mjs';
import centroidPartitions from './scenes/centroid-partitions.mjs';
import probeBoundary from './scenes/probe-boundary.mjs';
import recallLedger from './scenes/recall-ledger.mjs';
import scaleBudget from './scenes/scale-budget.mjs';
import pqEncode from './scenes/pq-encode.mjs';
import adcLookup from './scenes/adc-lookup.mjs';
import transfer from './scenes/transfer.mjs';
import filteredDistributed from './scenes/filtered-distributed.mjs';
import metricReplay from './scenes/metric-replay.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';

export default cinematicLesson({
  id: 'vector-search',
  accent: COSMOS.cyan,
  invariants: verifyVectorSearchInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'exact-baseline': exactBaseline,
    'greedy-hops': greedyHops,
    'hierarchy-beam': hierarchyBeam,
    'insert-graph': insertGraph,
    'centroid-partitions': centroidPartitions,
    'probe-boundary': probeBoundary,
    'recall-ledger': recallLedger,
    'scale-budget': scaleBudget,
    'pq-encode': pqEncode,
    'adc-lookup': adcLookup,
    transfer,
    'filtered-distributed': filteredDistributed,
    'metric-replay': metricReplay,
    'earned-transfer': earnedTransfer,
  },
});
