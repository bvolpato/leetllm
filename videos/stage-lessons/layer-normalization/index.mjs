// Full-bleed dark-cinema 14-scene Layer Normalization (Pre-LN vs Post-LN) stage lesson.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLayerNormModel } from './parts.mjs';
import intro from './scenes/intro.mjs';
import center from './scenes/center.mjs';
import scale from './scenes/scale.mjs';
import affine from './scenes/affine.mjs';
import axes from './scenes/axes.mjs';
import placement from './scenes/placement.mjs';
import gradients from './scenes/gradients.mjs';
import rms from './scenes/rms.mjs';
import normBackward from './scenes/norm-backward.mjs';
import depthDiagnosis from './scenes/depth-diagnosis.mjs';
import deepnorm from './scenes/deepnorm.mjs';
import qkPeri from './scenes/qk-peri.mjs';
import precision from './scenes/precision.mjs';
import normalizationTransfer from './scenes/normalization-transfer.mjs';

export default cinematicLesson({
  id: 'layer-normalization',
  accent: COSMOS.cyan,
  invariants: verifyLayerNormModel,
  scenes: {
    intro,
    center,
    scale,
    affine,
    axes,
    placement,
    gradients,
    rms,
    'norm-backward': normBackward,
    'depth-diagnosis': depthDiagnosis,
    deepnorm,
    'qk-peri': qkPeri,
    precision,
    'normalization-transfer': normalizationTransfer,
  },
});
