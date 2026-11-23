import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import ownership from './scenes/ownership.mjs';
import dtypeLedger from './scenes/dtype-ledger.mjs';
import reduce from './scenes/reduce.mjs';
import tokenObjective from './scenes/token-objective.mjs';
import accumulation from './scenes/accumulation.mjs';
import managedUnmanaged from './scenes/managed-unmanaged.mjs';
import bucketUnits from './scenes/bucket-units.mjs';
import gather from './scenes/gather.mjs';
import paddedGather from './scenes/padded-gather.mjs';
import parameterCoordination from './scenes/parameter-coordination.mjs';
import ringVolume from './scenes/ring-volume.mjs';
import coalescedReduction from './scenes/coalesced-reduction.mjs';
import offload from './scenes/offload.mjs';
import offloadDomains from './scenes/offload-domains.mjs';
import engineSource from './scenes/engine-source.mjs';
import checkpoint from './scenes/checkpoint.mjs';
import checkpointContract from './scenes/checkpoint-contract.mjs';
import topologyConversion from './scenes/topology-conversion.mjs';
import projectContext from './scenes/project-context.mjs';
import synthesis from './scenes/synthesis.mjs';
import lateGradient from './scenes/late-gradient.mjs';
import freshPlan from './scenes/fresh-plan.mjs';

export default narratedLesson({
  id: 'deep-dive-deepspeed',
  scenes: {
    'intro': intro,
    'ownership': ownership,
    'dtype-ledger': dtypeLedger,
    'reduce': reduce,
    'token-objective': tokenObjective,
    'accumulation': accumulation,
    'managed-unmanaged': managedUnmanaged,
    'bucket-units': bucketUnits,
    'gather': gather,
    'padded-gather': paddedGather,
    'parameter-coordination': parameterCoordination,
    'ring-volume': ringVolume,
    'coalesced-reduction': coalescedReduction,
    'offload': offload,
    'offload-domains': offloadDomains,
    'engine-source': engineSource,
    'checkpoint': checkpoint,
    'checkpoint-contract': checkpointContract,
    'topology-conversion': topologyConversion,
    'project-context': projectContext,
    'synthesis': synthesis,
    'late-gradient': lateGradient,
    'fresh-plan': freshPlan,
  },
});
