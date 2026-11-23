import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import pixels from './stages/pixels.mjs';
import kernel from './stages/kernel.mjs';
import patch from './stages/patch.mjs';
import slide from './stages/slide.mjs';
import articleCrop from './stages/article-crop.mjs';
import sharingBudget from './stages/sharing-budget.mjs';
import translation from './stages/translation.mjs';
import stridePadding from './stages/stride-padding.mjs';
import shapeDilation from './stages/shape-dilation.mjs';
import channels from './stages/channels.mjs';
import groupedConnectivity from './stages/grouped-connectivity.mjs';
import fieldJump from './stages/field-jump.mjs';
import poolWinners from './stages/pool-winners.mjs';
import poolBackward from './stages/pool-backward.mjs';
import overlapRepair from './stages/overlap-repair.mjs';
import globalAverageHead from './stages/global-average-head.mjs';
import borderCounts from './stages/border-counts.mjs';
import paddingArtifact from './stages/padding-artifact.mjs';
import forwardPass from './stages/forward-pass.mjs';
import residualBlock from './stages/residual-block.mjs';
import identityGradient from './stages/identity-gradient.mjs';
import patchProjectionStage from './stages/patch-projection.mjs';
import architectureChoice from './stages/architecture-choice.mjs';
import transfer from './stages/transfer.mjs';
import earnedCnnTransfer from './stages/earned-cnn-transfer.mjs';
export {
  convolutionShape,
  correlate,
  parameterCount,
  poolSnapshot,
  residualSlice,
} from './arithmetic.mjs';
export {
  channelSnapshot,
  patchSnapshot,
  scanSnapshot,
  stridePaddingFrame,
} from './construction.mjs';
export {
  ARTICLE_CROP,
  HORIZONTAL,
  IMAGE,
  KERNEL,
  OVERLAP_MAP,
  POOL_INCOMING,
  POOL_MAP,
  RIDGE,
} from './fixtures.mjs';
export {
  MAP,
  cropForward,
  fieldTrace,
  paddedUniform,
  patchProjection,
  signalParticipation,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'convolution',
  validateModel,
  scenes: [
    intro,
    pixels,
    kernel,
    patch,
    slide,
    articleCrop,
    sharingBudget,
    translation,
    stridePadding,
    shapeDilation,
    channels,
    groupedConnectivity,
    fieldJump,
    poolWinners,
    poolBackward,
    overlapRepair,
    globalAverageHead,
    borderCounts,
    paddingArtifact,
    forwardPass,
    residualBlock,
    identityGradient,
    patchProjectionStage,
    architectureChoice,
    transfer,
    earnedCnnTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  ctx.save();
  api.focus.target(scene.id + '-construction', () => {
    throw new Error('Unknown convolution scene ' + scene.id);
  });
}
export default Object.freeze({ ...definition, draw });
