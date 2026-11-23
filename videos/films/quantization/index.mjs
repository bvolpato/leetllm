import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import payloadStage from './stages/payload.mjs';
import budgetInventoryStage from './stages/budget-inventory.mjs';
import gridStage from './stages/grid.mjs';
import affineRangeStage from './stages/affine-range.mjs';
import packStage from './stages/pack.mjs';
import codecContractStage from './stages/codec-contract.mjs';
import granularityStage from './stages/granularity.mjs';
import groupSumStage from './stages/group-sum.mjs';
import outputStage from './stages/output.mjs';
import curvatureStage from './stages/curvature.mjs';
import gptqStage from './stages/gptq.mjs';
import factorOrderStage from './stages/factor-order.mjs';
import gptqLayoutStage from './stages/gptq-layout.mjs';
import awqStage from './stages/awq.mjs';
import awqSearchStage from './stages/awq-search.mjs';
import heldOutStage from './stages/held-out.mjs';
import precisionSweepStage from './stages/precision-sweep.mjs';
import kernelPathStage from './stages/kernel-path.mjs';
import rooflineStage from './stages/roofline.mjs';
import precisionRolesStage from './stages/precision-roles.mjs';
import poolSubtractionStage from './stages/pool-subtraction.mjs';
import ggufStage from './stages/gguf.mjs';
import containerLayoutStage from './stages/container-layout.mjs';
import q4kUnpackStage from './stages/q4k-unpack.mjs';
import offloadCountStage from './stages/offload-count.mjs';
import artifactLineageStage from './stages/artifact-lineage.mjs';
import benchmarkStage from './stages/benchmark.mjs';
import pairedEvaluationStage from './stages/paired-evaluation.mjs';
import diagnoseStage from './stages/diagnose.mjs';
import freshQuantizationStage from './stages/fresh-quantization.mjs';
import { DETAIL_SCENES } from './fixtures.mjs';
import { rejectUnknownOriginalScene, rejectUnknownDetail } from './compatibility.mjs';
export { CALIBRATION, DETAIL_SCENES, HELD_OUT, QUANT_WEIGHTS } from './fixtures.mjs';
export {
  affineGrid,
  awqReconstruct,
  cachePool,
  calibrationHessian,
  decodeTeachingCodec,
  deferredBlockUpdate,
  freshQuantizationBudget,
  gptqFrame,
  groupedReduction,
  introLayer,
  nominalRoofline,
  precisionExperiment,
  quantizationMemory,
  roundEven,
  squaredOutputError,
  teachingCodec,
  trailingPlacement,
} from './arithmetic.mjs';
export { contextBudgetState } from './construction.mjs';
export { validateModel } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'quantization',
  validateModel,
  scenes: [
    introStage,
    payloadStage,
    budgetInventoryStage,
    gridStage,
    affineRangeStage,
    packStage,
    codecContractStage,
    granularityStage,
    groupSumStage,
    outputStage,
    curvatureStage,
    gptqStage,
    heldOutStage,
    factorOrderStage,
    gptqLayoutStage,
    awqStage,
    awqSearchStage,
    precisionSweepStage,
    kernelPathStage,
    rooflineStage,
    precisionRolesStage,
    poolSubtractionStage,
    ggufStage,
    containerLayoutStage,
    q4kUnpackStage,
    offloadCountStage,
    artifactLineageStage,
    benchmarkStage,
    pairedEvaluationStage,
    diagnoseStage,
    freshQuantizationStage,
  ],
});
const originalStages = new Map([
  ['intro', introStage],
  ['payload', payloadStage],
  ['grid', gridStage],
  ['pack', packStage],
  ['granularity', granularityStage],
  ['output', outputStage],
  ['curvature', curvatureStage],
  ['gptq', gptqStage],
  ['awq', awqStage],
  ['held-out', heldOutStage],
  ['gguf', ggufStage],
  ['benchmark', benchmarkStage],
]);
const detailStages = new Map([
  ['budget-inventory', budgetInventoryStage],
  ['affine-range', affineRangeStage],
  ['codec-contract', codecContractStage],
  ['group-sum', groupSumStage],
  ['factor-order', factorOrderStage],
  ['gptq-layout', gptqLayoutStage],
  ['awq-search', awqSearchStage],
  ['precision-sweep', precisionSweepStage],
  ['kernel-path', kernelPathStage],
  ['roofline', rooflineStage],
  ['precision-roles', precisionRolesStage],
  ['pool-subtraction', poolSubtractionStage],
  ['container-layout', containerLayoutStage],
  ['q4k-unpack', q4kUnpackStage],
  ['offload-count', offloadCountStage],
  ['artifact-lineage', artifactLineageStage],
  ['paired-evaluation', pairedEvaluationStage],
  ['diagnose', diagnoseStage],
  ['fresh-quantization', freshQuantizationStage],
]);
export function draw(ctx, scene, state, api) {
  if (DETAIL_SCENES.has(scene.id)) {
    const stage = detailStages.get(scene.id);
    return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownDetail(ctx, scene, state, api);
  }
  const stage = originalStages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : rejectUnknownOriginalScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
