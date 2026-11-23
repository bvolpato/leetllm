import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import shapeStage from './stages/shape.mjs';
import index from './stages/index.mjs';
import broadcast from './stages/broadcast.mjs';
import reduce from './stages/reduce.mjs';
import reshapeTranspose from './stages/reshape-transpose.mjs';
import views from './stages/views.mjs';
import precision from './stages/precision.mjs';
import attention from './stages/attention.mjs';
import contracts from './stages/contracts.mjs';
import takeaway from './stages/takeaway.mjs';
import heads from './stages/heads.mjs';
export {
  attentionScores,
  bias,
  centeredWhitePixel,
  featureBiasContract,
  featureMean,
  headOneTokenOne,
  headZeroTokenOne,
  imageChannelMeans,
  numberedEntries,
  reshapeBatch0,
  rightSquare,
  sentenceWords,
  sequence0,
  sequence1,
  shape,
  shifted,
  squareInput,
  tensor,
  tokenMean,
  tokenOffsets,
  tokenShifted,
  transposeBatch0,
  wrongSquare,
} from './fixtures.mjs';
export {
  attentionPairConstruction,
  attentionSlicePrediction,
  boundaryCheck,
  broadcastFrame,
  headFrame,
  indexFrame,
  indexSelection,
  layoutConstruction,
  layoutFrame,
  memoryFrame,
  precisionFrame,
  reductionConstruction,
  reductionFrame,
  teachingSnapshot,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'tensor-shapes',
  validateModel,
  scenes: [
    intro,
    shapeStage,
    index,
    broadcast,
    contracts,
    reduce,
    precision,
    reshapeTranspose,
    views,
    attention,
    takeaway,
    heads,
  ],
});
export const draw = definition.draw;
export default definition;
