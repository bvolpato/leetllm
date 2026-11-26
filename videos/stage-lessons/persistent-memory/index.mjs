// Pure-cinema stage film for persistent-memory (11 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPersistentMemoryInvariants } from './parts.mjs';
import compressionLineage from './scenes/compression-lineage.mjs';
import contextAndMemory from './scenes/context-and-memory.mjs';
import memoryAndExecutionState from './scenes/memory-and-execution-state.mjs';
import pagingAndAdmission from './scenes/paging-and-admission.mjs';
import retrievalRanking from './scenes/retrieval-ranking.mjs';
import returnSession from './scenes/return-session.mjs';
import scopeAndProvenance from './scenes/scope-and-provenance.mjs';
import slidingWindow from './scenes/sliding-window.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import supersessionAndRevocation from './scenes/supersession-and-revocation.mjs';
import tenantBoundary from './scenes/tenant-boundary.mjs';

export default cinematicLesson({
  id: 'persistent-memory',
  accent: COSMOS.cyan,
  invariants: verifyPersistentMemoryInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'context-and-memory': contextAndMemory,
    'sliding-window': slidingWindow,
    'scope-and-provenance': scopeAndProvenance,
    'retrieval-ranking': retrievalRanking,
    'paging-and-admission': pagingAndAdmission,
    'supersession-and-revocation': supersessionAndRevocation,
    'compression-lineage': compressionLineage,
    'tenant-boundary': tenantBoundary,
    'memory-and-execution-state': memoryAndExecutionState,
    'return-session': returnSession,
  },
});
