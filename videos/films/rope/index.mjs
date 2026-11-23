import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownRotaryScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import permutationStage from './stages/permutation.mjs';
import maskAndPrefillStage from './stages/mask-and-prefill.mjs';
import insertionStage from './stages/insertion.mjs';
import absoluteWavesStage from './stages/absolute-waves.mjs';
import absoluteMixtureStage from './stages/absolute-mixture.mjs';
import finiteTableStage from './stages/finite-table.mjs';
import rotationStage from './stages/rotation.mjs';
import matrixStage from './stages/matrix.mjs';
import dotProductStage from './stages/dot-product.mjs';
import sharedShiftStage from './stages/shared-shift.mjs';
import frequenciesStage from './stages/frequencies.mjs';
import fullHeadContractStage from './stages/full-head-contract.mjs';
import pairSumStage from './stages/pair-sum.mjs';
import pairingContractStage from './stages/pairing-contract.mjs';
import routingStage from './stages/routing.mjs';
import phaseWrapStage from './stages/phase-wrap.mjs';
import axialCoordinatesStage from './stages/axial-coordinates.mjs';
import alibiStage from './stages/alibi.mjs';
import alibiSpectrumStage from './stages/alibi-spectrum.mjs';
import farContentStage from './stages/far-content.mjs';
import interpolationStage from './stages/interpolation.mjs';
import positionPrecisionStage from './stages/position-precision.mjs';
import ntkScheduleStage from './stages/ntk-schedule.mjs';
import yarnBandsStage from './stages/yarn-bands.mjs';
import yarnTemperatureStage from './stages/yarn-temperature.mjs';
import checkpointContractStage from './stages/checkpoint-contract.mjs';
import cachedLayerStage from './stages/cached-layer.mjs';
import cachedChunkStage from './stages/cached-chunk.mjs';
import changingScheduleStage from './stages/changing-schedule.mjs';
import evaluationStage from './stages/evaluation.mjs';
import freshPositionContractStage from './stages/fresh-position-contract.mjs';
export { CACHE_K, CACHE_POSITIONS, CACHE_Q, CLOCK_FREQUENCIES } from './fixtures.mjs';
export {
  absoluteExpansion,
  absoluteRow,
  alibiSlopes,
  frequencySchedules,
  permissionMask,
  rotaryScore,
  rotateHead,
  rotatePair,
  softmax,
  toBfloat16,
} from './arithmetic.mjs';
export { directedCue, freshPositionFrame } from './construction.mjs';
export { cacheFixture, cachePositionFrame, pairingTrace } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'rope',
  validateModel,
  scenes: [
    introStage,
    permutationStage,
    maskAndPrefillStage,
    insertionStage,
    absoluteWavesStage,
    absoluteMixtureStage,
    finiteTableStage,
    rotationStage,
    matrixStage,
    dotProductStage,
    sharedShiftStage,
    frequenciesStage,
    fullHeadContractStage,
    pairSumStage,
    pairingContractStage,
    routingStage,
    phaseWrapStage,
    axialCoordinatesStage,
    alibiStage,
    alibiSpectrumStage,
    farContentStage,
    interpolationStage,
    positionPrecisionStage,
    ntkScheduleStage,
    yarnBandsStage,
    yarnTemperatureStage,
    checkpointContractStage,
    cachedLayerStage,
    cachedChunkStage,
    changingScheduleStage,
    evaluationStage,
    freshPositionContractStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter ? painter(ctx, scene, state, api) : drawUnknownRotaryScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
