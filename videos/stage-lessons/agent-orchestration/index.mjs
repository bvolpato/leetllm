// The lesson `agent-orchestration` as a narrated film. One file for each scene, in the order of lesson.yaml.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
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

export default narratedLesson({
  id: 'agent-orchestration',
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
