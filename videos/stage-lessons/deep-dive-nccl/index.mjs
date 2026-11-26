// Deep Dive - NCCL: Full-bleed cinematic Vizmatic 0.10.0 stage film (26 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyNcclInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import ownershipContract from './scenes/ownership-contract.mjs';
import rankBootstrap from './scenes/rank-bootstrap.mjs';
import agreement from './scenes/agreement.mjs';
import alltoallLayout from './scenes/alltoall-layout.mjs';
import ring from './scenes/ring.mjs';
import gather from './scenes/gather.mjs';
import trafficBound from './scenes/traffic-bound.mjs';
import doubleTree from './scenes/double-tree.mjs';
import cost from './scenes/cost.mjs';
import groupEnqueue from './scenes/group-enqueue.mjs';
import launchEvent from './scenes/launch-event.mjs';
import streams from './scenes/streams.mjs';
import bufferLifetime from './scenes/buffer-lifetime.mjs';
import topologyMatrix from './scenes/topology-matrix.mjs';
import networkPath from './scenes/network-path.mjs';
import sourceTour from './scenes/source-tour.mjs';
import systemShapes from './scenes/system-shapes.mjs';
import receipt from './scenes/receipt.mjs';
import benchmarkContract from './scenes/benchmark-contract.mjs';
import inplaceOffset from './scenes/inplace-offset.mjs';
import diagnosticEvidence from './scenes/diagnostic-evidence.mjs';
import platformScope from './scenes/platform-scope.mjs';
import projectEvidence from './scenes/project-evidence.mjs';
import synthesis from './scenes/synthesis.mjs';
import freshFirstEvent from './scenes/fresh-first-event.mjs';

export default cinematicLesson({
  id: 'deep-dive-nccl',
  accent: COSMOS.cyan,
  invariants: verifyNcclInvariants,
  scenes: {
    intro,
    'ownership-contract': ownershipContract,
    'rank-bootstrap': rankBootstrap,
    agreement,
    'alltoall-layout': alltoallLayout,
    ring,
    gather,
    'traffic-bound': trafficBound,
    'double-tree': doubleTree,
    cost,
    'group-enqueue': groupEnqueue,
    'launch-event': launchEvent,
    streams,
    'buffer-lifetime': bufferLifetime,
    'topology-matrix': topologyMatrix,
    'network-path': networkPath,
    'source-tour': sourceTour,
    'system-shapes': systemShapes,
    receipt,
    'benchmark-contract': benchmarkContract,
    'inplace-offset': inplaceOffset,
    'diagnostic-evidence': diagnosticEvidence,
    'platform-scope': platformScope,
    'project-evidence': projectEvidence,
    synthesis,
    'fresh-first-event': freshFirstEvent,
  },
});
