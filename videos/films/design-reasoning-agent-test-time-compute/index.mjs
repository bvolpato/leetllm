import { drawUnknownConstruction } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import apiControlsStage from './stages/api-controls.mjs';
import xmlContractStage from './stages/xml-contract.mjs';
import evidenceStage from './stages/evidence.mjs';
import candidatesStage from './stages/candidates.mjs';
import coverageOperationStage from './stages/coverage-operation.mjs';
import votingBaselineStage from './stages/voting-baseline.mjs';
import treeStage from './stages/tree.mjs';
import treeContractStage from './stages/tree-contract.mjs';
import puctAllocationStage from './stages/puct-allocation.mjs';
import processStage from './stages/process.mjs';
import verifierEvidenceStage from './stages/verifier-evidence.mjs';
import answerBiasStage from './stages/answer-bias.mjs';
import trainedPolicyStage from './stages/trained-policy.mjs';
import routerEvaluationStage from './stages/router-evaluation.mjs';
import budgetStage from './stages/budget.mjs';
import reservationReconcileStage from './stages/reservation-reconcile.mjs';
import incompleteAdvisoryStage from './stages/incomplete-advisory.mjs';
import memoryStage from './stages/memory.mjs';
import kvByteModelStage from './stages/kv-byte-model.mjs';
import prefixLeaseStage from './stages/prefix-lease.mjs';
import evictionArchitectureStage from './stages/eviction-architecture.mjs';
import stoppingStage from './stages/stopping.mjs';
import safeProgressStage from './stages/safe-progress.mjs';
import evaluationReleaseStage from './stages/evaluation-release.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshDeadlineStage from './stages/fresh-deadline.mjs';
export { advise, coverage, eligible, memory, puctWorksheet, stopReason } from './arithmetic.mjs';
export {
  budgetTrace,
  constructionModel,
  freshDeadline,
  inspect,
  sampleModel,
  search,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'design-reasoning-agent-test-time-compute',
  validateModel,
  scenes: [
    introStage,
    apiControlsStage,
    xmlContractStage,
    evidenceStage,
    candidatesStage,
    coverageOperationStage,
    votingBaselineStage,
    treeStage,
    treeContractStage,
    puctAllocationStage,
    processStage,
    verifierEvidenceStage,
    answerBiasStage,
    trainedPolicyStage,
    routerEvaluationStage,
    budgetStage,
    reservationReconcileStage,
    incompleteAdvisoryStage,
    memoryStage,
    kvByteModelStage,
    prefixLeaseStage,
    evictionArchitectureStage,
    stoppingStage,
    safeProgressStage,
    evaluationReleaseStage,
    freshDeadlineStage,
    synthesisStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  return api.focus.target(`ra-${scene.id}-trace`, () => {
    const painter = stageDraws.get(scene.id);
    return painter
      ? painter(ctx, scene, state, api)
      : drawUnknownConstruction(ctx, scene, state, api);
  });
}
export default Object.freeze({ ...definition, draw });
