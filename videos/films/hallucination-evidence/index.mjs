import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { drawUnknownHallucinationScene } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import atomicClaimsStage from './stages/atomic-claims.mjs';
import verdictsStage from './stages/verdicts.mjs';
import supportVersusTruthStage from './stages/support-versus-truth.mjs';
import guessingIncentivesStage from './stages/guessing-incentives.mjs';
import evidenceVersionStage from './stages/evidence-version.mjs';
import strictClaimContractStage from './stages/strict-claim-contract.mjs';
import safeRenderingStage from './stages/safe-rendering.mjs';
import tokenConfidenceStage from './stages/token-confidence.mjs';
import meaningEntropyStage from './stages/meaning-entropy.mjs';
import consistencySignalStage from './stages/consistency-signal.mjs';
import consistencyMethodsStage from './stages/consistency-methods.mjs';
import contrastiveDecodingStage from './stages/contrastive-decoding.mjs';
import measuredAbstentionStage from './stages/measured-abstention.mjs';
import scoreTheGateStage from './stages/score-the-gate.mjs';
import payloadAndReleaseStage from './stages/payload-and-release.mjs';
import verificationPlansStage from './stages/verification-plans.mjs';
import traceAndMeasureStage from './stages/trace-and-measure.mjs';
import freshRecordRepairStage from './stages/fresh-record-repair.mjs';
export { CURRENT_RECORD, EVIDENCE, draftClaims, resolvedClaim } from './fixtures.mjs';
export {
  cadDistribution,
  checkedIncidentClaim,
  dolaDistribution,
  releaseEvidence,
  renderIncident,
  safeAnswer,
  semanticSampleStats,
  verifyClaim,
} from './arithmetic.mjs';
export {
  consistencyFrame,
  freshIncidentFrame,
  gateSuiteFrame,
  safeRenderFrame,
  scoreGate,
  validateHallucinationUpgrade,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'hallucination-evidence',
  validateModel,
  scenes: [
    subjectIntroStage,
    atomicClaimsStage,
    verdictsStage,
    supportVersusTruthStage,
    guessingIncentivesStage,
    evidenceVersionStage,
    strictClaimContractStage,
    safeRenderingStage,
    tokenConfidenceStage,
    meaningEntropyStage,
    consistencySignalStage,
    consistencyMethodsStage,
    contrastiveDecodingStage,
    measuredAbstentionStage,
    scoreTheGateStage,
    payloadAndReleaseStage,
    verificationPlansStage,
    traceAndMeasureStage,
    freshRecordRepairStage,
  ],
});
const stages = new Map(orderedDefinition.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const stage = stages.get(scene.id);
    if (stage) stage.draw(ctx, scene, state, api);
    else drawUnknownHallucinationScene(ctx, scene, state, api);
  });
}
export default Object.freeze({
  ...orderedDefinition,
  draw,
});
