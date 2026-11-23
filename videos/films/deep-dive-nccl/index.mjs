import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawSynthesis } from './stages/synthesis.mjs';
import intro from './stages/intro.mjs';
import ownershipContract from './stages/ownership-contract.mjs';
import rankBootstrap from './stages/rank-bootstrap.mjs';
import agreement from './stages/agreement.mjs';
import alltoallLayout from './stages/alltoall-layout.mjs';
import ring from './stages/ring.mjs';
import gather from './stages/gather.mjs';
import trafficBound from './stages/traffic-bound.mjs';
import doubleTree from './stages/double-tree.mjs';
import costStage from './stages/cost.mjs';
import groupEnqueue from './stages/group-enqueue.mjs';
import launchEvent from './stages/launch-event.mjs';
import streams from './stages/streams.mjs';
import bufferLifetime from './stages/buffer-lifetime.mjs';
import topologyMatrix from './stages/topology-matrix.mjs';
import networkPath from './stages/network-path.mjs';
import sourceTour from './stages/source-tour.mjs';
import systemShapes from './stages/system-shapes.mjs';
import receipt from './stages/receipt.mjs';
import benchmarkContract from './stages/benchmark-contract.mjs';
import inplaceOffset from './stages/inplace-offset.mjs';
import diagnosticEvidence from './stages/diagnostic-evidence.mjs';
import platformScope from './stages/platform-scope.mjs';
import projectEvidence from './stages/project-evidence.mjs';
import synthesis from './stages/synthesis.mjs';
import freshFirstEvent from './stages/fresh-first-event.mjs';
export {
  byteOffset,
  cost,
  dependencyTrace,
  overlapTime,
  ringTraffic,
  transposeExchange,
} from './arithmetic.mjs';
export { sampleModel } from './construction.mjs';
export { partial } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-nccl',
  validateModel,
  scenes: [
    intro,
    ownershipContract,
    rankBootstrap,
    agreement,
    alltoallLayout,
    ring,
    gather,
    trafficBound,
    doubleTree,
    costStage,
    groupEnqueue,
    launchEvent,
    streams,
    bufferLifetime,
    topologyMatrix,
    networkPath,
    sourceTour,
    systemShapes,
    receipt,
    benchmarkContract,
    inplaceOffset,
    diagnosticEvidence,
    platformScope,
    projectEvidence,
    synthesis,
    freshFirstEvent,
  ],
});
const sceneIds = new Set(definition.scenes.map((scene) => scene.id));
export function draw(ctx, scene, state, api) {
  if (!sceneIds.has(scene.id)) return drawSynthesis(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
