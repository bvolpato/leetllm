import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import requestFields from './stages/request-fields.mjs';
import massAndSupport from './stages/mass-and-support.mjs';
import shape from './stages/shape.mjs';
import area from './stages/area.mjs';
import inverse from './stages/inverse.mjs';
import inverseContract from './stages/inverse-contract.mjs';
import resolutionCount from './stages/resolution-count.mjs';
import routeCount from './stages/route-count.mjs';
import poissonCount from './stages/poisson-count.mjs';
import burstyMixture from './stages/bursty-mixture.mjs';
import normalFailure from './stages/normal-failure.mjs';
import serviceRate from './stages/service-rate.mjs';
import sample from './stages/sample.mjs';
import monteCarlo from './stages/monte-carlo.mjs';
import rareBudget from './stages/rare-budget.mjs';
import replayStreams from './stages/replay-streams.mjs';
import metropolisDecision from './stages/metropolis-decision.mjs';
import posteriorChain from './stages/posterior-chain.mjs';
import chainDiagnostics from './stages/chain-diagnostics.mjs';
import queueBurst from './stages/queue-burst.mjs';
import queueStationary from './stages/queue-stationary.mjs';
import tail from './stages/tail.mjs';
import audit from './stages/audit.mjs';
import ksGeometryStage from './stages/ks-geometry.mjs';
import launchReport from './stages/launch-report.mjs';
import jointRelationship from './stages/joint-relationship.mjs';
import tokenSample from './stages/token-sample.mjs';
import temperature from './stages/temperature.mjs';
import gumbelRace from './stages/gumbel-race.mjs';
import takeaway from './stages/takeaway.mjs';
import freshPlan from './stages/fresh-plan.mjs';
export {
  binomialMass,
  ksGeometry,
  metropolisAcceptance,
  mm1Means,
  normalCdf,
  normalQuantile,
  poissonMass,
  queuePlan,
  rareEventBudget,
  tokenProbabilities,
} from './arithmetic.mjs';
export { samplingExtensionModel } from './construction.mjs';
export { parameters } from './fixtures.mjs';
export {
  auditFrame,
  batchFrame,
  durationCdf,
  durationDensity,
  durationFromRank,
  inverseFrame,
  lateProbability,
  requests,
  sampleFrame,
  tailFrame,
  transferFrame,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'sampling',
  validateModel,
  scenes: [
    intro,
    requestFields,
    massAndSupport,
    shape,
    area,
    inverse,
    inverseContract,
    resolutionCount,
    routeCount,
    poissonCount,
    burstyMixture,
    normalFailure,
    serviceRate,
    sample,
    monteCarlo,
    rareBudget,
    replayStreams,
    metropolisDecision,
    posteriorChain,
    chainDiagnostics,
    queueBurst,
    queueStationary,
    freshPlan,
    tokenSample,
    temperature,
    gumbelRace,
    launchReport,
    jointRelationship,
    ksGeometryStage,
    tail,
    audit,
    takeaway,
  ],
});
export const draw = definition.draw;
export default definition;
