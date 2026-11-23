import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import answerableUnits from './stages/answerable-units.mjs';
import fixedWindowsStage from './stages/fixed-windows.mjs';
import overlapLimit from './stages/overlap-limit.mjs';
import structureAndTables from './stages/structure-and-tables.mjs';
import parentChildContext from './stages/parent-child-context.mjs';
import semanticAndLate from './stages/semantic-and-late.mjs';
import evaluateAndRelease from './stages/evaluate-and-release.mjs';
import tokenOffsets from './stages/token-offsets.mjs';
import tailBalancing from './stages/tail-balancing.mjs';
import labeledRetrieval from './stages/labeled-retrieval.mjs';
import checkedParent from './stages/checked-parent.mjs';
import semanticCosine from './stages/semantic-cosine.mjs';
import lateBoundaries from './stages/late-boundaries.mjs';
import manifestRelease from './stages/manifest-release.mjs';
import evaluationLimits from './stages/evaluation-limits.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export {
  balancedChildren,
  cosine,
  fixedWindows,
  parentRevealProgress,
  requiredPhrasesPresent,
  topicVector,
} from './arithmetic.mjs';
export {
  extendedFrame,
  lateChunkSnapshot,
  overlapBars,
  overlapSnapshot,
  releaseSnapshot,
} from './construction.mjs';
export { RELEASE_QUERY, RELEASE_WORD_CAP, RUNBOOK, RUNBOOK_WORDS } from './fixtures.mjs';
export {
  answerabilityFixture,
  checkedParents,
  freshEvidence,
  headedSection,
  lateChunkFixture,
  manifestChecksums,
  overlapExperiment,
  parentExpansion,
  releaseComparison,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'document-chunking',
  validateModel,
  scenes: [
    subjectIntro,
    answerableUnits,
    fixedWindowsStage,
    overlapLimit,
    structureAndTables,
    tailBalancing,
    tokenOffsets,
    evaluateAndRelease,
    labeledRetrieval,
    parentChildContext,
    checkedParent,
    semanticCosine,
    semanticAndLate,
    lateBoundaries,
    evaluationLimits,
    manifestRelease,
    earnedTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Unknown document-chunking scene: ' + scene.id);
}
export default Object.freeze({ ...definition, draw });
