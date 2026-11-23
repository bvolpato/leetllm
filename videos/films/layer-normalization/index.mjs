import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import centerStage from './stages/center.mjs';
import scaleStage from './stages/scale.mjs';
import affineStage from './stages/affine.mjs';
import axesStage from './stages/axes.mjs';
import placementStage from './stages/placement.mjs';
import gradientsStage from './stages/gradients.mjs';
import rmsStage from './stages/rms.mjs';
import normBackwardStage from './stages/norm-backward.mjs';
import depthDiagnosisStage from './stages/depth-diagnosis.mjs';
import deepnormStage from './stages/deepnorm.mjs';
import qkPeriStage from './stages/qk-peri.mjs';
import normalizationTransferStage from './stages/normalization-transfer.mjs';
import precisionStage from './stages/precision.mjs';
export {
  affineState,
  alignedWriteState,
  backwardTrace,
  deepNormTrace,
  normalizationTransfer,
  placementTrace,
  placementTravel,
  scaleProgress,
  scaleTrace,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'layer-normalization',
  validateModel,
  scenes: [
    introStage,
    centerStage,
    scaleStage,
    affineStage,
    axesStage,
    placementStage,
    gradientsStage,
    rmsStage,
    normBackwardStage,
    depthDiagnosisStage,
    deepnormStage,
    qkPeriStage,
    precisionStage,
    normalizationTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;
