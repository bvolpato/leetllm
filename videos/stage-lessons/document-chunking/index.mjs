// Document Chunking & Processing: Full-bleed dark cinema stage lesson (17 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDocumentChunkingInvariants } from './parts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import answerableUnits from './scenes/answerable-units.mjs';
import fixedWindows from './scenes/fixed-windows.mjs';
import overlapLimit from './scenes/overlap-limit.mjs';
import structureAndTables from './scenes/structure-and-tables.mjs';
import tailBalancing from './scenes/tail-balancing.mjs';
import tokenOffsets from './scenes/token-offsets.mjs';
import evaluateAndRelease from './scenes/evaluate-and-release.mjs';
import labeledRetrieval from './scenes/labeled-retrieval.mjs';
import parentChildContext from './scenes/parent-child-context.mjs';
import checkedParent from './scenes/checked-parent.mjs';
import semanticCosine from './scenes/semantic-cosine.mjs';
import semanticAndLate from './scenes/semantic-and-late.mjs';
import lateBoundaries from './scenes/late-boundaries.mjs';
import evaluationLimits from './scenes/evaluation-limits.mjs';
import manifestRelease from './scenes/manifest-release.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';

export default cinematicLesson({
  id: 'document-chunking',
  accent: COSMOS.gold,
  invariants: verifyDocumentChunkingInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'answerable-units': answerableUnits,
    'fixed-windows': fixedWindows,
    'overlap-limit': overlapLimit,
    'structure-and-tables': structureAndTables,
    'tail-balancing': tailBalancing,
    'token-offsets': tokenOffsets,
    'evaluate-and-release': evaluateAndRelease,
    'labeled-retrieval': labeledRetrieval,
    'parent-child-context': parentChildContext,
    'checked-parent': checkedParent,
    'semantic-cosine': semanticCosine,
    'semantic-and-late': semanticAndLate,
    'late-boundaries': lateBoundaries,
    'evaluation-limits': evaluationLimits,
    'manifest-release': manifestRelease,
    'earned-transfer': earnedTransfer,
  },
});
