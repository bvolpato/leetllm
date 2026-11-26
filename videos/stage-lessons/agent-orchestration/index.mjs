// Full-bleed dark-cinema 11-scene Agent Orchestration stage lesson (vizmatic@0.10.0).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyOrchestrationInvariants } from './parts.mjs';
import checkpointRetry from './scenes/checkpoint-retry.mjs';
import dependencyGraph from './scenes/dependency-graph.mjs';
import parallelClock from './scenes/parallel-clock.mjs';
import singleWriter from './scenes/single-writer.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import superstepJoin from './scenes/superstep-join.mjs';
import topologyOwnership from './scenes/topology-ownership.mjs';
import transfer from './scenes/transfer.mjs';
import typedReceipts from './scenes/typed-receipts.mjs';
import validatedJoin from './scenes/validated-join.mjs';
import wireProtocols from './scenes/wire-protocols.mjs';

export default cinematicLesson({
  id: 'agent-orchestration',
  accent: COSMOS.cyan,
  invariants: verifyOrchestrationInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'dependency-graph': dependencyGraph,
    'parallel-clock': parallelClock,
    'typed-receipts': typedReceipts,
    'superstep-join': superstepJoin,
    'validated-join': validatedJoin,
    'checkpoint-retry': checkpointRetry,
    'single-writer': singleWriter,
    'topology-ownership': topologyOwnership,
    'wire-protocols': wireProtocols,
    transfer,
  },
});
