// Full-bleed dark-cinema 14-scene Inference Clocks stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyInferenceClocksInvariants } from './parts.mjs';
import cachePayload from './scenes/cache-payload.mjs';
import cadence from './scenes/cadence.mjs';
import chunkAndHandoff from './scenes/chunk-and-handoff.mjs';
import decode from './scenes/decode.mjs';
import delivery from './scenes/delivery.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import firstClock from './scenes/first-clock.mjs';
import hardwareCeilings from './scenes/hardware-ceilings.mjs';
import intro from './scenes/intro.mjs';
import pageAdmission from './scenes/page-admission.mjs';
import prefill from './scenes/prefill.mjs';
import quantizeCapacity from './scenes/quantize-capacity.mjs';
import roofline from './scenes/roofline.mjs';
import synthesis from './scenes/synthesis.mjs';

export default cinematicLesson({
  id: 'inference-clocks',
  accent: COSMOS.cyan,
  invariants: verifyInferenceClocksInvariants,
  scenes: {
    intro,
    prefill,
    decode,
    'first-clock': firstClock,
    cadence,
    delivery,
    synthesis,
    roofline,
    'hardware-ceilings': hardwareCeilings,
    'cache-payload': cachePayload,
    'page-admission': pageAdmission,
    'chunk-and-handoff': chunkAndHandoff,
    'quantize-capacity': quantizeCapacity,
    'earned-transfer': earnedTransfer,
  },
});
