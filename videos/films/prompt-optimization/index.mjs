import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import programParts from './stages/program-parts.mjs';
import metric from './stages/metric.mjs';
import dataSplits from './stages/data-splits.mjs';
import localContract from './stages/local-contract.mjs';
import bootstrap from './stages/bootstrap.mjs';
import optimizerFamilies from './stages/optimizer-families.mjs';
import searchConfiguration from './stages/search-configuration.mjs';
import searchBudget from './stages/search-budget.mjs';
import engineRequests from './stages/engine-requests.mjs';
import freshBudget from './stages/fresh-budget.mjs';
import search from './stages/search.mjs';
import sealedTest from './stages/sealed-test.mjs';
import artifact from './stages/artifact.mjs';
import artifactSafety from './stages/artifact-safety.mjs';
import releaseDecision from './stages/release-decision.mjs';

export { plannedPromptRequests } from './arithmetic.mjs';
export {
  bootstrapMetricAccept,
  buildSplitPlan,
  promptSearchSnapshot,
  scorePair,
  selectValidationWinner,
  testReversal,
} from './model.mjs';
export { validateModel };
const definition = defineCanvasLesson({
  id: 'prompt-optimization',
  validateModel,
  scenes: [
    subjectIntro,
    programParts,
    metric,
    dataSplits,
    localContract,
    bootstrap,
    optimizerFamilies,
    searchConfiguration,
    searchBudget,
    engineRequests,
    freshBudget,
    search,
    sealedTest,
    artifact,
    artifactSafety,
    releaseDecision,
  ],
});
export const draw = definition.draw;
export default definition;
