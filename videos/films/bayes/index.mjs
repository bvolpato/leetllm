import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import prior from './stages/prior.mjs';
import likelihood from './stages/likelihood.mjs';
import update from './stages/update.mjs';
import predictive from './stages/predictive.mjs';
import threshold from './stages/threshold.mjs';
import evidence from './stages/evidence.mjs';
import sensitivity from './stages/sensitivity.mjs';
import population from './stages/population.mjs';
import calibration from './stages/calibration.mjs';
import lastTask from './stages/last-task.mjs';
export {
  betaDensity,
  betaQuantile,
  betaTailProbability,
  betaVariance,
  integrate,
} from './arithmetic.mjs';
export { family, observed, validationOutcomes } from './fixtures.mjs';
export {
  alternativeSample,
  calibrationFrame,
  countFrame,
  credibleRangeFrame,
  evidenceSnapshot,
  familyDensity,
  familyTail,
  frozenCountDistribution,
  jointContours,
  likelihoodFrame,
  passingRegion,
  populationFrame,
  predictiveCountDistribution,
  predictiveFrame,
  predictiveSnapshot,
  priorIntervalSnapshot,
  productFrame,
  productSnapshot,
  releaseCases,
  sensitivityFrame,
  updateSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'bayes',
  validateModel,
  scenes: [
    intro,
    prior,
    likelihood,
    update,
    predictive,
    threshold,
    evidence,
    sensitivity,
    population,
    calibration,
    lastTask,
  ],
});
export const draw = definition.draw;
export default definition;
