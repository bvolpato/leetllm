import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import recordTypes from './stages/record-types.mjs';
import preferenceLoss from './stages/preference-loss.mjs';
import redactAndProvenance from './stages/redact-and-provenance.mjs';
import writeRubric from './stages/write-rubric.mjs';
import reviewerAgreement from './stages/reviewer-agreement.mjs';
import agreementModels from './stages/agreement-models.mjs';
import uncertaintySelection from './stages/uncertainty-selection.mjs';
import diversitySelection from './stages/diversity-selection.mjs';
import selectionScore from './stages/selection-score.mjs';
import selectorTrial from './stages/selector-trial.mjs';
import evaluationBoundary from './stages/evaluation-boundary.mjs';
import lineageAudit from './stages/lineage-audit.mjs';
import datasetRelease from './stages/dataset-release.mjs';
import freshRelease from './stages/fresh-release.mjs';
export { agreementConstruction, mappedJudgeConstruction, sampleModel } from './construction.mjs';
export { selectionItems } from './fixtures.mjs';
export {
  auditRelease,
  binaryMeasures,
  cohenKappa,
  fleissFixture,
  hybridSelect,
  hybridSteps,
  judgePair,
  overlapFindings,
  preferenceFixture,
  redact,
  releaseSummaryGate,
  reviewJudgeOrder,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'active-labeling',
  validateModel,
  scenes: [
    subjectIntro,
    recordTypes,
    preferenceLoss,
    redactAndProvenance,
    writeRubric,
    reviewerAgreement,
    agreementModels,
    uncertaintySelection,
    diversitySelection,
    selectionScore,
    selectorTrial,
    evaluationBoundary,
    lineageAudit,
    datasetRelease,
    freshRelease,
  ],
});
export const draw = definition.draw;
export default definition;
