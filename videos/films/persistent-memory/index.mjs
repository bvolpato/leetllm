import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import contextAndMemoryStage from './stages/context-and-memory.mjs';
import slidingWindowStage from './stages/sliding-window.mjs';
import retrievalRankingStage from './stages/retrieval-ranking.mjs';
import scopeAndProvenanceStage from './stages/scope-and-provenance.mjs';
import pagingAndAdmissionStage from './stages/paging-and-admission.mjs';
import supersessionAndRevocationStage from './stages/supersession-and-revocation.mjs';
import compressionLineageStage from './stages/compression-lineage.mjs';
import tenantBoundaryStage from './stages/tenant-boundary.mjs';
import memoryAndExecutionStateStage from './stages/memory-and-execution-state.mjs';
import returnSessionStage from './stages/return-session.mjs';
export {
  admitMemoryWrite,
  eligibleMemories,
  memoryAccessFixture,
  memoryWriteSnapshot,
  projectionLifecycle,
  retrievalCandidates,
  retrievalScoreSnapshot,
  sourceProjectionState,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'persistent-memory',
  validateModel,
  scenes: [
    subjectIntroStage,
    contextAndMemoryStage,
    slidingWindowStage,
    scopeAndProvenanceStage,
    retrievalRankingStage,
    pagingAndAdmissionStage,
    supersessionAndRevocationStage,
    compressionLineageStage,
    tenantBoundaryStage,
    memoryAndExecutionStateStage,
    returnSessionStage,
  ],
});
export const draw = definition.draw;
export default definition;
