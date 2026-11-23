import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import targetLeakStage from './stages/target-leak.mjs';
import riskStage from './stages/risk.mjs';
import rolesStage from './stages/roles.mjs';
import foldsStage from './stages/folds.mjs';
import foldCalculationStage from './stages/fold-calculation.mjs';
import usersStage from './stages/users.mjs';
import pipelineStage from './stages/pipeline.mjs';
import featureSelectionStage from './stages/feature-selection.mjs';
import timeStage from './stages/time.mjs';
import asOfHistoryStage from './stages/as-of-history.mjs';
import nestedSelectionStage from './stages/nested-selection.mjs';
import selectionStage from './stages/selection.mjs';
import selectiveLabelsStage from './stages/selective-labels.mjs';
import documentsStage from './stages/documents.mjs';
import benchmarkScreenStage from './stages/benchmark-screen.mjs';
import counterfactualStage from './stages/counterfactual.mjs';
import sourceTransferStage from './stages/source-transfer.mjs';
export { LEAK_ROWS, SELECTOR } from './fixtures.mjs';
export {
  availableHistory,
  foldFrame,
  oneFoldModel,
  pipelineFrame,
  selectorState,
  sourceLookup,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'validation',
  validateModel,
  scenes: [
    introStage,
    targetLeakStage,
    riskStage,
    rolesStage,
    foldsStage,
    foldCalculationStage,
    usersStage,
    pipelineStage,
    featureSelectionStage,
    timeStage,
    asOfHistoryStage,
    nestedSelectionStage,
    selectionStage,
    selectiveLabelsStage,
    documentsStage,
    benchmarkScreenStage,
    counterfactualStage,
    sourceTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;
