import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import dependencyGraphStage from './stages/dependency-graph.mjs';
import parallelClockStage from './stages/parallel-clock.mjs';
import typedReceiptsStage from './stages/typed-receipts.mjs';
import superstepJoinStage from './stages/superstep-join.mjs';
import validatedJoinStage from './stages/validated-join.mjs';
import checkpointRetryStage from './stages/checkpoint-retry.mjs';
import singleWriterStage from './stages/single-writer.mjs';
import topologyOwnershipStage from './stages/topology-ownership.mjs';
import wireProtocolsStage from './stages/wire-protocols.mjs';
import transferStage from './stages/transfer.mjs';
export { readSchedule, waitingJoinTrace } from './arithmetic.mjs';
export { RECEIPTS, REQUEST } from './fixtures.mjs';
export { canWrite, merge, operationTarget, proposal, validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'agent-orchestration',
  validateModel,
  scenes: [
    subjectIntroStage,
    dependencyGraphStage,
    parallelClockStage,
    typedReceiptsStage,
    superstepJoinStage,
    validatedJoinStage,
    checkpointRetryStage,
    singleWriterStage,
    topologyOwnershipStage,
    wireProtocolsStage,
    transferStage,
  ],
});
export const draw = definition.draw;
export default definition;
