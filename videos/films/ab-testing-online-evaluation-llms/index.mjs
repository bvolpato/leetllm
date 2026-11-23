import { ONLINE_AB_NEW_IDS } from './fixtures.mjs';
import { drawUnrecognizedOriginal, drawUnrecognizedConstruction } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import pointEstimateStage from './stages/point-estimate.mjs';
import measurementContract from './stages/measurement-contract.mjs';
import treatmentIdentity from './stages/treatment-identity.mjs';
import screen from './stages/screen.mjs';
import rubricEvidence from './stages/rubric-evidence.mjs';
import tokenClock from './stages/token-clock.mjs';
import feedbackJoin from './stages/feedback-join.mjs';
import power from './stages/power.mjs';
import powerConstruction from './stages/power-construction.mjs';
import assignment from './stages/assignment.mjs';
import unitsAndSpillover from './stages/units-and-spillover.mjs';
import routerRamp from './stages/router-ramp.mjs';
import shadowResource from './stages/shadow-resource.mjs';
import teamDraft from './stages/team-draft.mjs';
import metricFamily from './stages/metric-family.mjs';
import looks from './stages/looks.mjs';
import validLooking from './stages/valid-looking.mjs';
import ratio from './stages/ratio.mjs';
import srmResidual from './stages/srm-residual.mjs';
import uncertainty from './stages/uncertainty.mjs';
import intervalConstruction from './stages/interval-construction.mjs';
import windowController from './stages/window-controller.mjs';
import ship from './stages/ship.mjs';
import safetyGeometry from './stages/safety-geometry.mjs';
import zeroIncidents from './stages/zero-incidents.mjs';
import posteriorRouting from './stages/posterior-routing.mjs';
import mixReweight from './stages/mix-reweight.mjs';
import judgeData from './stages/judge-data.mjs';
import calibrationAudit from './stages/calibration-audit.mjs';
import inlineAsynchronous from './stages/inline-asynchronous.mjs';
import releaseContract from './stages/release-contract.mjs';
import freshRelease from './stages/fresh-release.mjs';
export { betaDensity } from './arithmetic.mjs';
export {
  assignmentSnapshot,
  freshExperimentSnapshot,
  onlineCueProgress,
  sampleModel,
  servedSelectionSnapshot,
  uncertaintySnapshot,
} from './construction.mjs';
export { ONLINE_AB_NEW_IDS, ONLINE_RUBRIC, observedUserRows } from './fixtures.mjs';
export {
  PersistedExperiment,
  adjustedFamily,
  agreementReadout,
  assignmentResidual,
  binaryPowerTerms,
  draftClicks,
  draftConstruction,
  experimentRequirements,
  guardrailSequence,
  interval,
  mixtureReadout,
  plannedLooks,
  pointEstimate,
  posteriorCounts,
  rates,
  repeatTelemetry,
  rubricReadout,
  sampleSize,
  tokenClocks,
  userReadout,
  zeroFailureUpper,
} from './model.mjs';
export { validateModel, validateOnlineABModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'ab-testing-online-evaluation-llms',
  validateModel,
  scenes: [
    intro,
    pointEstimateStage,
    measurementContract,
    treatmentIdentity,
    screen,
    rubricEvidence,
    tokenClock,
    feedbackJoin,
    power,
    powerConstruction,
    assignment,
    unitsAndSpillover,
    routerRamp,
    shadowResource,
    teamDraft,
    metricFamily,
    looks,
    validLooking,
    ratio,
    srmResidual,
    uncertainty,
    intervalConstruction,
    windowController,
    ship,
    safetyGeometry,
    zeroIncidents,
    posteriorRouting,
    mixReweight,
    judgeData,
    calibrationAudit,
    inlineAsynchronous,
    releaseContract,
    freshRelease,
  ],
});
const originalSceneIds = Object.freeze([
  'intro',
  'screen',
  'power',
  'assignment',
  'looks',
  'ratio',
  'uncertainty',
  'ship',
]);
const constructionSceneIds = Object.freeze([
  'point-estimate',
  'measurement-contract',
  'treatment-identity',
  'rubric-evidence',
  'token-clock',
  'feedback-join',
  'power-construction',
  'units-and-spillover',
  'router-ramp',
  'shadow-resource',
  'team-draft',
  'metric-family',
  'valid-looking',
  'srm-residual',
  'interval-construction',
  'window-controller',
  'safety-geometry',
  'zero-incidents',
  'posterior-routing',
  'mix-reweight',
  'judge-data',
  'calibration-audit',
  'inline-asynchronous',
  'release-contract',
  'fresh-release',
]);
export function draw(ctx, scene, state, api) {
  if (ONLINE_AB_NEW_IDS.has(scene.id)) {
    if (constructionSceneIds.includes(scene.id)) return definition.draw(ctx, scene, state, api);
    return drawUnrecognizedConstruction(ctx, scene, state, api);
  }
  if (originalSceneIds.includes(scene.id)) return definition.draw(ctx, scene, state, api);
  return drawUnrecognizedOriginal(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
