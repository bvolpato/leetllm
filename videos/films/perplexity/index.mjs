import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro, { coveredWord } from './stages/intro.mjs';
import surprise from './stages/surprise.mjs';
import mean from './stages/mean.mjs';
import lossScale from './stages/loss-scale.mjs';
import objectiveBoundary from './stages/objective-boundary.mjs';
import stable from './stages/stable.mjs';
import aggregation from './stages/aggregation.mjs';
import tokenizers from './stages/tokenizers.mjs';
import normalization from './stages/normalization.mjs';
import windows from './stages/windows.mjs';
import shiftCount from './stages/shift-count.mjs';
import protocol from './stages/protocol.mjs';
import contamination from './stages/contamination.mjs';
import report from './stages/report.mjs';
import behavior from './stages/behavior.mjs';
import freshCase from './stages/fresh-case.mjs';
import exportJob from './stages/export-job.mjs';
export { answerChecks, corpusLoss, freshReport, shiftedTargetCount } from './arithmetic.mjs';
export {
  ANSWERS,
  ANSWER_CONTRACT,
  FRESH_ANSWERS,
  FRESH_CONTRACT,
  FRESH_PROBABILITIES,
} from './fixtures.mjs';
export {
  aggregationSnapshot,
  introSnapshot,
  logSpaceSnapshot,
  meanSnapshot,
  surpriseSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'perplexity',
  validateModel,
  scenes: [
    coveredWord,
    intro,
    surprise,
    mean,
    lossScale,
    objectiveBoundary,
    stable,
    aggregation,
    freshCase,
    normalization,
    windows,
    shiftCount,
    protocol,
    contamination,
    report,
    behavior,
    exportJob,
    tokenizers,
  ],
});
export const draw = definition.draw;
export default definition;
