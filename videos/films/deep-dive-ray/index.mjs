import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import primitiveContract from './stages/primitive-contract.mjs';
import dependencies from './stages/dependencies.mjs';
import argumentInspection from './stages/argument-inspection.mjs';
import localLab from './stages/local-lab.mjs';
import schedulerOwners from './stages/scheduler-owners.mjs';
import actorResource from './stages/actor-resource.mjs';
import references from './stages/references.mjs';
import lostResult from './stages/lost-result.mjs';
import memoryLifetime from './stages/memory-lifetime.mjs';
import placement from './stages/placement.mjs';
import bundleMembership from './stages/bundle-membership.mjs';
import window from './stages/window.mjs';
import granularityPressure from './stages/granularity-pressure.mjs';
import restart from './stages/restart.mjs';
import durableRestore from './stages/durable-restore.mjs';
import retry from './stages/retry.mjs';
import retryControls from './stages/retry-controls.mjs';
import libraryOwners from './stages/library-owners.mjs';
import synthesis from './stages/synthesis.mjs';
import engineBoundary from './stages/engine-boundary.mjs';
import gcsRecovery from './stages/gcs-recovery.mjs';
import failureEvidence from './stages/failure-evidence.mjs';
import sourceHistory from './stages/source-history.mjs';
import freshOwner from './stages/fresh-owner.mjs';
export { rayFeature } from './arithmetic.mjs';
export { rayChapterState, rayProgress, retryTrace, sampleModel } from './construction.mjs';
export {
  rayApplyBatch,
  rayBackpressure,
  rayObjectLoss,
  rayPlacement,
  rayResources,
  windowTrace,
} from './model.mjs';
export { validateModel, validateRayNew } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-ray',
  validateModel,
  scenes: [
    intro,
    primitiveContract,
    dependencies,
    argumentInspection,
    localLab,
    schedulerOwners,
    actorResource,
    references,
    lostResult,
    memoryLifetime,
    placement,
    bundleMembership,
    window,
    granularityPressure,
    restart,
    retry,
    durableRestore,
    retryControls,
    libraryOwners,
    synthesis,
    engineBoundary,
    gcsRecovery,
    failureEvidence,
    sourceHistory,
    freshOwner,
  ],
});
export const draw = definition.draw;
export default definition;
