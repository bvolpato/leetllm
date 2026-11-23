import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import prefill from './stages/prefill.mjs';
import decode from './stages/decode.mjs';
import firstClock from './stages/first-clock.mjs';
import cadence from './stages/cadence.mjs';
import delivery from './stages/delivery.mjs';
import roofline from './stages/roofline.mjs';
import synthesis from './stages/synthesis.mjs';
import hardwareCeilings from './stages/hardware-ceilings.mjs';
import cachePayload from './stages/cache-payload.mjs';
import pageAdmission from './stages/page-admission.mjs';
import chunkAndHandoff from './stages/chunk-and-handoff.mjs';
import quantizeCapacity from './stages/quantize-capacity.mjs';
import earnedTransfer from './stages/earned-transfer.mjs';
export { capacityFixture, deliveryState, metrics } from './arithmetic.mjs';
export { tokenTimes } from './fixtures.mjs';
export {
  inferenceCapacityAnswerVisible,
  quantizedCapacityFrame,
  sampleModel,
  synthesisState,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'inference-clocks',
  validateModel,
  scenes: [
    intro,
    prefill,
    decode,
    firstClock,
    cadence,
    delivery,
    synthesis,
    roofline,
    hardwareCeilings,
    cachePayload,
    pageAdmission,
    chunkAndHandoff,
    quantizeCapacity,
    earnedTransfer,
  ],
});
export const draw = definition.draw;
export default definition;
