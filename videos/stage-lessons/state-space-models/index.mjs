// Full-bleed dark-cinema 15-scene State-Space Models & Mamba stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySsmInvariants } from './parts.mjs';
import checkpoint from './scenes/checkpoint.mjs';
import collision from './scenes/collision.mjs';
import completeBuffers from './scenes/complete-buffers.mjs';
import delta from './scenes/delta.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import heldInput from './scenes/held-input.mjs';
import intro from './scenes/intro.mjs';
import kernel from './scenes/kernel.mjs';
import prefixConstruction from './scenes/prefix-construction.mjs';
import recurrence from './scenes/recurrence.mjs';
import releaseGate from './scenes/release-gate.mjs';
import scan from './scenes/scan.mjs';
import selection from './scenes/selection.mjs';
import ssdAndRefinement from './scenes/ssd-and-refinement.mjs';
import structuredBlock from './scenes/structured-block.mjs';

export default cinematicLesson({
  id: 'state-space-models',
  accent: COSMOS.emerald,
  invariants: verifySsmInvariants,
  scenes: {
    intro,
    collision,
    recurrence,
    kernel,
    delta,
    'held-input': heldInput,
    'structured-block': structuredBlock,
    selection,
    scan,
    'prefix-construction': prefixConstruction,
    'ssd-and-refinement': ssdAndRefinement,
    checkpoint,
    'complete-buffers': completeBuffers,
    'earned-transfer': earnedTransfer,
    'release-gate': releaseGate,
  },
});
