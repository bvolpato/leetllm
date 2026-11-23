import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import projectionContract from './stages/projection-contract.mjs';
import reuse from './stages/reuse.mjs';
import rooflineNumbers from './stages/roofline-numbers.mjs';
import memoryOwners from './stages/memory-owners.mjs';
import offload from './stages/offload.mjs';
import systolicDataflow from './stages/systolic-dataflow.mjs';
import tileDensity from './stages/tile-density.mjs';
import cudaCompatibility from './stages/cuda-compatibility.mjs';
import lanes from './stages/lanes.mjs';
import targetBuild from './stages/target-build.mjs';
import pallasContract from './stages/pallas-contract.mjs';
import tileOrder from './stages/tile-order.mjs';
import nkiLifetimes from './stages/nki-lifetimes.mjs';
import mpsBoundary from './stages/mps-boundary.mjs';
import topology from './stages/topology.mjs';
import collectiveBytes from './stages/collective-bytes.mjs';
import programmingDepth from './stages/programming-depth.mjs';
import gates from './stages/gates.mjs';
import goodputContract from './stages/goodput-contract.mjs';
import freshHardware from './stages/fresh-hardware.mjs';
export {
  hardwareDecision,
  localMemorySpills,
  nearestRank,
  pallasOwnershipTrace,
  product2x2State,
  projection,
  ringTraffic,
  sharedBound,
  traversal,
} from './arithmetic.mjs';
export { sampleModel, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'accelerator-architecture-field-guide',
  validateModel,
  scenes: [
    intro,
    projectionContract,
    reuse,
    rooflineNumbers,
    memoryOwners,
    offload,
    systolicDataflow,
    tileDensity,
    cudaCompatibility,
    lanes,
    targetBuild,
    pallasContract,
    tileOrder,
    nkiLifetimes,
    mpsBoundary,
    topology,
    collectiveBytes,
    programmingDepth,
    gates,
    goodputContract,
    freshHardware,
  ],
});
export const draw = definition.draw;
export default definition;
