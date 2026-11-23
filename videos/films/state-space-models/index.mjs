import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import recurrence from './stages/recurrence.mjs';
import kernel from './stages/kernel.mjs';
import delta from './stages/delta.mjs';
import selection from './stages/selection.mjs';
import scan from './stages/scan.mjs';
import collision from './stages/collision.mjs';
import checkpoint from './stages/checkpoint.mjs';
import heldInput from './stages/held-input.mjs';
import structuredBlock from './stages/structured-block.mjs';
import prefixConstruction from './stages/prefix-construction.mjs';
import ssdAndRefinement from './stages/ssd-and-refinement.mjs';
import completeBuffers from './stages/complete-buffers.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
import releaseGate from './stages/release-gate.mjs';
export { affineScanLevels } from './model.mjs';
export { bufferConstruction } from './model.mjs';
export { bufferFixture } from './model.mjs';
export { checkpointSnapshot } from './model.mjs';
export { chunkStateFixture } from './model.mjs';
export { collisionSnapshot } from './model.mjs';
export { contentWriteFixture } from './model.mjs';
export { deltaSnapshot } from './model.mjs';
export { kernelInterventionSnapshot } from './model.mjs';
export { multiDirectionFixture } from './model.mjs';
export { orderedAffineFixture } from './model.mjs';
export { orderedPrefixTree } from './model.mjs';
export { recurrenceSnapshot } from './model.mjs';
export { runningSummary } from './model.mjs';
export { scanSnapshot } from './model.mjs';
export { selectionSnapshot } from './model.mjs';
export { selectiveCoefficients } from './arithmetic.mjs';
export { timingFixture } from './model.mjs';
export { trapezoidWriteFixture } from './model.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'state-space-models',
  validateModel,
  scenes: [
    intro,
    collision,
    recurrence,
    kernel,
    delta,
    heldInput,
    structuredBlock,
    selection,
    scan,
    prefixConstruction,
    ssdAndRefinement,
    checkpoint,
    completeBuffers,
    earnedTransfer,
    releaseGate,
  ],
});
export const draw = definition.draw;
export default definition;
