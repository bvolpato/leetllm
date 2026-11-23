import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import sessionAdmission from './stages/session-admission.mjs';
import observeProposeAct from './stages/observe-propose-act.mjs';
import observationRepresentations from './stages/observation-representations.mjs';
import groundingCoordinates from './stages/grounding-coordinates.mjs';
import observationFreshness from './stages/observation-freshness.mjs';
import adapterRuntime from './stages/adapter-runtime.mjs';
import verifyAfterAction from './stages/verify-after-action.mjs';
import policyAndApproval from './stages/policy-and-approval.mjs';
import untrustedObservation from './stages/untrusted-observation.mjs';
import evaluationContract from './stages/evaluation-contract.mjs';
import chooseAndMeasure from './stages/choose-and-measure.mjs';
export {
  coordinateStage,
  delayedSubmit,
  freshnessSnapshot,
  submissionFrame,
} from './construction.mjs';
export { delayedWriteBranches } from './validation.mjs';
export {
  applyNoteEvent,
  applyPortalAction,
  coordinatePipeline,
  evaluationEpisode,
  freshScopedControls,
  observeNoteReceipt,
  policyDecision,
  portalTrace,
  resolveMark,
  routeSurface,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gui-agent-loop',
  validateModel,
  scenes: [
    subjectIntro,
    sessionAdmission,
    observeProposeAct,
    observationRepresentations,
    groundingCoordinates,
    observationFreshness,
    adapterRuntime,
    verifyAfterAction,
    policyAndApproval,
    untrustedObservation,
    evaluationContract,
    chooseAndMeasure,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error(`Unknown gui-agent-loop scene: ${scene.id}`);
}
export default Object.freeze({
  ...definition,
  draw,
});
