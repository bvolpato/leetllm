import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import generativeBoundaryStage from './stages/generative-boundary.mjs';
import mixtureStage from './stages/mixture.mjs';
import responsibilityStage from './stages/responsibility.mjs';
import nearestLimitStage from './stages/nearest-limit.mjs';
import eStepStage from './stages/e-step.mjs';
import mStepStage from './stages/m-step.mjs';
import jensenConstructionStage from './stages/jensen-construction.mjs';
import touchingBoundStage from './stages/touching-bound.mjs';
import likelihoodStage from './stages/likelihood.mjs';
import stableResponsibilitiesStage from './stages/stable-responsibilities.mjs';
import varianceConstraintStage from './stages/variance-constraint.mjs';
import initializationStage from './stages/initialization.mjs';
import modelChecksStage from './stages/model-checks.mjs';
import vaeStage from './stages/vae.mjs';
import reparameterizedEncoderStage from './stages/reparameterized-encoder.mjs';
import takeawayStage from './stages/takeaway.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export {
  evidenceBound,
  gammaDensity,
  logLikelihood,
  mStep,
  mixtureDensity,
  posterior,
  reconstructionTrace,
  restrictedModel,
  scalarEncoder,
  varianceObjective,
} from './arithmetic.mjs';
export { constructedFrame } from './construction.mjs';
export { VAE_COMPARISON_ROUTES, initialModel, observations } from './fixtures.mjs';
export {
  boundGeometry,
  firstResponsibilities,
  firstUpdate,
  fitMixture,
  fitted,
  jensenConstruction,
  likelihoodTraceState,
  priorTransfer,
  responsibilitiesAt50,
  symmetricFit,
  totalVarianceMle,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'expectation-maximization',
  validateModel,
  scenes: [
    introStage,
    generativeBoundaryStage,
    mixtureStage,
    responsibilityStage,
    nearestLimitStage,
    eStepStage,
    mStepStage,
    jensenConstructionStage,
    touchingBoundStage,
    likelihoodStage,
    stableResponsibilitiesStage,
    varianceConstraintStage,
    initializationStage,
    modelChecksStage,
    vaeStage,
    reparameterizedEncoderStage,
    takeawayStage,
    earnedTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;
