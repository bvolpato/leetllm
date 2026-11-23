import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import recurrence from './stages/recurrence.mjs';
import shared from './stages/shared.mjs';
import eventOrder from './stages/event-order.mjs';
import vectorBuild from './stages/vector-build.mjs';
import actionHead from './stages/action-head.mjs';
import actualCredit from './stages/actual-credit.mjs';
import gradients from './stages/gradients.mjs';
import matrixBound from './stages/matrix-bound.mjs';
import truncation from './stages/truncation.mjs';
import lstm from './stages/lstm.mjs';
import learnedLstm from './stages/learned-lstm.mjs';
import retention from './stages/retention.mjs';
import gru from './stages/gru.mjs';
import learnedGru from './stages/learned-gru.mjs';
import parameterGeometry from './stages/parameter-geometry.mjs';
import padding from './stages/padding.mjs';
import batchBoundaries from './stages/batch-boundaries.mjs';
import compressionAttention from './stages/compression-attention.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export {
  gruComparisonFrame,
  incidentFrame,
  lstmJoinFrame,
  recurrenceFrame,
  retentionFrame,
} from './construction.mjs';
export { actorMemoryTrace, gruResetComparison, incidentModel } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'rnn-memory',
  validateModel,
  scenes: [
    intro,
    recurrence,
    shared,
    eventOrder,
    vectorBuild,
    actionHead,
    actualCredit,
    gradients,
    matrixBound,
    truncation,
    lstm,
    learnedLstm,
    retention,
    gru,
    learnedGru,
    parameterGeometry,
    padding,
    batchBoundaries,
    compressionAttention,
    earnedTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
