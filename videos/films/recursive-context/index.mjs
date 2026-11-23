import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import externalSource from './stages/external-source.mjs';
import inspectSource from './stages/inspect-source.mjs';
import splitMerge from './stages/split-merge.mjs';
import completion from './stages/completion.mjs';
import sharedBudget from './stages/shared-budget.mjs';
import sourceLineage from './stages/source-lineage.mjs';
import complexityAndChoice from './stages/complexity-and-choice.mjs';
import environmentContract from './stages/environment-contract.mjs';
import baselineContract from './stages/baseline-contract.mjs';
import historyCap from './stages/history-cap.mjs';
import runtimeStop from './stages/runtime-stop.mjs';
import requestWaves from './stages/request-waves.mjs';
import executorBoundary from './stages/executor-boundary.mjs';
import historicalEvidence from './stages/historical-evidence.mjs';
import freshException from './stages/fresh-exception.mjs';
export { callPlan, characterPlan, previewForHistory } from './arithmetic.mjs';
export { pages, routes } from './fixtures.mjs';
export {
  adjudicate,
  boundedSlice,
  budgetEventCount,
  budgetTrace,
  chooseRoute,
  complete,
  inspectFor,
  retainedFacts,
  sampleModel,
  validateModel,
  visitedFacts,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'recursive-context',
  validateModel,
  scenes: [
    subjectIntro,
    externalSource,
    inspectSource,
    environmentContract,
    splitMerge,
    baselineContract,
    completion,
    sourceLineage,
    runtimeStop,
    historyCap,
    requestWaves,
    sharedBudget,
    executorBoundary,
    historicalEvidence,
    complexityAndChoice,
    freshException,
  ],
});
export const draw = definition.draw;
export default definition;
