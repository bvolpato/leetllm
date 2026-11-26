// Cinematic Vizmatic 0.10.0 stage film for `tensor-shapes` (Keep Tensor Values Attached to Their Words: 12 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTensorShapesInvariants } from './shared.mjs';
import { broadcast, contracts, index, intro, shape } from './scenes/act1-axes-broadcast.mjs';
import { precision, reduce, reshapeTranspose, views } from './scenes/act2-reduce-strides.mjs';
import { attention, heads, takeaway } from './scenes/act3-attention-heads.mjs';

export default cinematicLesson({
  id: 'tensor-shapes',
  accent: COSMOS.cyan,
  invariants: verifyTensorShapesInvariants,
  scenes: {
    intro,
    shape,
    index,
    broadcast,
    contracts,
    reduce,
    precision,
    'reshape-transpose': reshapeTranspose,
    views,
    attention,
    takeaway,
    heads,
  },
});
