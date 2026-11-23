import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownTinkerScene } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import capabilityReceiptStage from './stages/capability-receipt.mjs';
import boundaryStage from './stages/boundary.mjs';
import primitiveReceiptsStage from './stages/primitive-receipts.mjs';
import asyncContractStage from './stages/async-contract.mjs';
import chunkOrderStage from './stages/chunk-order.mjs';
import sftStage from './stages/sft.mjs';
import datumValidationStage from './stages/datum-validation.mjs';
import groupCreditStage from './stages/group-credit.mjs';
import uniformGroupsStage from './stages/uniform-groups.mjs';
import trajectoryDatumStage from './stages/trajectory-datum.mjs';
import trajectoryBranchStage from './stages/trajectory-branch.mjs';
import lossBoundaryStage from './stages/loss-boundary.mjs';
import loraPathStage from './stages/lora-path.mjs';
import loraGeometryStage from './stages/lora-geometry.mjs';
import loraEvidenceStage from './stages/lora-evidence.mjs';
import clockStage from './stages/clock.mjs';
import queueRecoveryStage from './stages/queue-recovery.mjs';
import snapshotsStage from './stages/snapshots.mjs';
import artifactContractStage from './stages/artifact-contract.mjs';
import dataTermsStage from './stages/data-terms.mjs';
import sourceResponsibilityStage from './stages/source-responsibility.mjs';
import localEvidenceStage from './stages/local-evidence.mjs';
import transportComparisonStage from './stages/transport-comparison.mjs';
import freshRunStage from './stages/fresh-run.mjs';
export { ADVANTAGES, REWARDS, loraWorksheet, sharedCreditUpdate } from './arithmetic.mjs';
export {
  groupCreditConstruction,
  tinkerConstruction,
  trajectoryConstruction,
} from './construction.mjs';
export { sampleModel, trajectoryTrace } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-tinker',
  validateModel,
  scenes: [
    openingStage,
    capabilityReceiptStage,
    boundaryStage,
    primitiveReceiptsStage,
    asyncContractStage,
    chunkOrderStage,
    sftStage,
    groupCreditStage,
    uniformGroupsStage,
    trajectoryDatumStage,
    datumValidationStage,
    trajectoryBranchStage,
    lossBoundaryStage,
    loraPathStage,
    loraGeometryStage,
    loraEvidenceStage,
    clockStage,
    queueRecoveryStage,
    artifactContractStage,
    dataTermsStage,
    sourceResponsibilityStage,
    localEvidenceStage,
    transportComparisonStage,
    snapshotsStage,
    freshRunStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownTinkerScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
