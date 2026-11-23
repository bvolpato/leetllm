import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import populationRisk from './stages/population-risk.mjs';
import onePredictor from './stages/one-predictor.mjs';
import payForSearch from './stages/pay-for-search.mjs';
import vcShattering from './stages/vc-shattering.mjs';
import excessRisk from './stages/excess-risk.mjs';
import growthFunction from './stages/growth-function.mjs';
import noiseCorrelation from './stages/noise-correlation.mjs';
import interpolationRisk from './stages/interpolation-risk.mjs';
import optimizerGeometry from './stages/optimizer-geometry.mjs';
import samplePlan from './stages/sample-plan.mjs';
import holdout from './stages/holdout.mjs';
import limits from './stages/limits.mjs';
import takeaway from './stages/takeaway.mjs';
export {
  choose,
  growthCeiling,
  noiseAssignment,
  noiseFit,
  predictsMask,
  riskAtRatio,
} from './arithmetic.mjs';
export { shatteringCueState } from './construction.mjs';
export {
  bounds,
  delta,
  empiricalRisk,
  errors,
  fixedSampleLosses,
  hoeffdingRadius,
  n,
  repeatedErrors,
  searchCounts,
  triangleFixture,
  unionRadius,
} from './fixtures.mjs';
export { fixedSampleCollection, searchSnapshot, separatorForMask } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'learning-theory',
  validateModel,
  scenes: [
    intro,
    populationRisk,
    onePredictor,
    payForSearch,
    vcShattering,
    excessRisk,
    growthFunction,
    noiseCorrelation,
    interpolationRisk,
    optimizerGeometry,
    samplePlan,
    holdout,
    limits,
    takeaway,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id)) {
    if (api.focus) api.focus.target(`${scene.id}-construction`, () => {});
    return;
  }
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
