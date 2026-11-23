import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import grid from './stages/grid.mjs';
import formats from './stages/formats.mjs';
import rangeCheck from './stages/range-check.mjs';
import underflow from './stages/underflow.mjs';
import update from './stages/update.mjs';
import controller from './stages/controller.mjs';
import ordering from './stages/ordering.mjs';
import memory from './stages/memory.mjs';
import transfer from './stages/transfer.mjs';
import communication from './stages/communication.mjs';
import policyMismatch from './stages/policy-mismatch.mjs';
import fp8Contract from './stages/fp8-contract.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export { accumulationState } from './model.mjs';
export { bf16 } from './arithmetic.mjs';
export { fp16 } from './arithmetic.mjs';
export { memoryInventory } from './model.mjs';
export { overflowControllerState } from './model.mjs';
export { policyPrecisionFixture } from './fixtures.mjs';
export { precisionBoundaryFixture } from './fixtures.mjs';
export { reductionPrecisionFixture } from './fixtures.mjs';
export { roundBinary } from './arithmetic.mjs';
export { underflowState } from './model.mjs';
export { underflowTraceSnapshot } from './model.mjs';
export { unequalTokenFixture } from './fixtures.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'mixed-precision',
  validateModel,
  scenes: [
    intro,
    grid,
    formats,
    rangeCheck,
    underflow,
    update,
    controller,
    ordering,
    memory,
    transfer,
    communication,
    policyMismatch,
    fp8Contract,
    earnedTransfer,
  ],
});
export const draw = definition.draw;
export default definition;
