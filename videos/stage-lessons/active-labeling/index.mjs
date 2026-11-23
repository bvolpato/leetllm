import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import recordTypes from './scenes/record-types.mjs';
import preferenceLoss from './scenes/preference-loss.mjs';
import redactAndProvenance from './scenes/redact-and-provenance.mjs';
import writeRubric from './scenes/write-rubric.mjs';
import reviewerAgreement from './scenes/reviewer-agreement.mjs';
import agreementModels from './scenes/agreement-models.mjs';
import uncertaintySelection from './scenes/uncertainty-selection.mjs';
import diversitySelection from './scenes/diversity-selection.mjs';
import selectionScore from './scenes/selection-score.mjs';
import selectorTrial from './scenes/selector-trial.mjs';
import evaluationBoundary from './scenes/evaluation-boundary.mjs';
import lineageAudit from './scenes/lineage-audit.mjs';
import datasetRelease from './scenes/dataset-release.mjs';
import freshRelease from './scenes/fresh-release.mjs';
export default narratedLesson({
  id: 'active-labeling',
  scenes: {
    'subject-intro': subjectIntro,
    'record-types': recordTypes,
    'preference-loss': preferenceLoss,
    'redact-and-provenance': redactAndProvenance,
    'write-rubric': writeRubric,
    'reviewer-agreement': reviewerAgreement,
    'agreement-models': agreementModels,
    'uncertainty-selection': uncertaintySelection,
    'diversity-selection': diversitySelection,
    'selection-score': selectionScore,
    'selector-trial': selectorTrial,
    'evaluation-boundary': evaluationBoundary,
    'lineage-audit': lineageAudit,
    'dataset-release': datasetRelease,
    'fresh-release': freshRelease,
  },
});
