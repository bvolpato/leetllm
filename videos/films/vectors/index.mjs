import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { EXTENDED_SCENES, validateModel } from './model.mjs';
import { rejectUnknownOriginalScene, rejectUnknownExtendedScene } from './compatibility.mjs';
import intro from './stages/intro.mjs';
import coordinates from './stages/coordinates.mjs';
import directions from './stages/directions.mjs';
import mixture from './stages/mixture.mjs';
import dot from './stages/dot.mjs';
import composition from './stages/composition.mjs';
import rows from './stages/rows.mjs';
import tensor from './stages/tensor.mjs';
import localEdit from './stages/local-edit.mjs';
import latencyGradient from './stages/latency-gradient.mjs';
import latencyDot from './stages/latency-dot.mjs';
import requestBatch from './stages/request-batch.mjs';
import manyOutputs from './stages/many-outputs.mjs';
import shapeGuard from './stages/shape-guard.mjs';
import broadcasting from './stages/broadcasting.mjs';
import pairwiseScores from './stages/pairwise-scores.mjs';
import normalizedScores from './stages/normalized-scores.mjs';
import batchedTranspose from './stages/batched-transpose.mjs';
import pooling from './stages/pooling.mjs';
import paddingMask from './stages/padding-mask.mjs';
import inputGuards from './stages/input-guards.mjs';
import linearApi from './stages/linear-api.mjs';
import freshCase from './stages/fresh-case.mjs';
export { AXIS_TRAP, FRESH_H, H, P, R, REQUEST_W, REQUEST_X, WORDS } from './fixtures.mjs';
export {
  BASE_OUTPUT,
  COMPOSED,
  EXTENDED_SCENES,
  REQUEST_Y,
  SCORE_H,
  batchedScoreState,
  compositionFrame,
  coordinateFrame,
  directionFrame,
  dotFrame,
  event,
  extendedFrame,
  localEditFrame,
  mixtureFrame,
  rowsFrame,
  tensorFrame,
  transform,
  transformBatch,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'vectors',
  validateModel,
  scenes: [
    intro,
    coordinates,
    directions,
    mixture,
    dot,
    composition,
    rows,
    tensor,
    localEdit,
    latencyGradient,
    latencyDot,
    requestBatch,
    manyOutputs,
    shapeGuard,
    broadcasting,
    pairwiseScores,
    normalizedScores,
    batchedTranspose,
    pooling,
    paddingMask,
    inputGuards,
    linearApi,
    freshCase,
  ],
});
const originalStages = new Map([
  ['intro', intro],
  ['coordinates', coordinates],
  ['directions', directions],
  ['mixture', mixture],
  ['dot', dot],
  ['composition', composition],
  ['rows', rows],
  ['tensor', tensor],
  ['local-edit', localEdit],
]);
const extendedStages = new Map([
  ['latency-gradient', latencyGradient],
  ['latency-dot', latencyDot],
  ['request-batch', requestBatch],
  ['many-outputs', manyOutputs],
  ['shape-guard', shapeGuard],
  ['broadcasting', broadcasting],
  ['pairwise-scores', pairwiseScores],
  ['normalized-scores', normalizedScores],
  ['batched-transpose', batchedTranspose],
  ['pooling', pooling],
  ['padding-mask', paddingMask],
  ['input-guards', inputGuards],
  ['linear-api', linearApi],
  ['fresh-case', freshCase],
]);

export function draw(ctx, scene, state, api) {
  if (EXTENDED_SCENES.has(scene.id)) {
    const stage = extendedStages.get(scene.id);
    return stage
      ? stage.draw(ctx, scene, state, api)
      : rejectUnknownExtendedScene(ctx, scene, state, api);
  }
  const stage = originalStages.get(scene.id);
  return stage
    ? stage.draw(ctx, scene, state, api)
    : rejectUnknownOriginalScene(ctx, scene, state, api);
}

const definition = Object.freeze({ ...orderedDefinition, draw });
export default definition;
