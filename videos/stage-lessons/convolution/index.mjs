import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyConvolutionInvariants } from './shared.mjs';
import {
  articleCrop,
  intro,
  kernel,
  patch,
  pixels,
  slide,
} from './scenes/act1-edge-and-kernel.mjs';
import {
  channels,
  groupedConnectivity,
  shapeDilation,
  sharingBudget,
  stridePadding,
  translation,
} from './scenes/act2-sharing-translation-geometry.mjs';
import {
  fieldJump,
  globalAverageHead,
  overlapRepair,
  poolBackward,
  poolWinners,
} from './scenes/act3-receptive-field-and-pooling.mjs';
import {
  borderCounts,
  forwardPass,
  identityGradient,
  paddingArtifact,
  residualBlock,
} from './scenes/act4-borders-forward-residual.mjs';
import {
  architectureChoice,
  earnedCnnTransfer,
  patchProjectionScene,
  transfer,
} from './scenes/act5-vit-and-transfer.mjs';

export default cinematicLesson({
  id: 'convolution',
  accent: COSMOS.cyan,
  invariants: verifyConvolutionInvariants,
  scenes: {
    intro,
    pixels,
    kernel,
    patch,
    slide,
    'article-crop': articleCrop,
    'sharing-budget': sharingBudget,
    translation,
    'stride-padding': stridePadding,
    'shape-dilation': shapeDilation,
    channels,
    'grouped-connectivity': groupedConnectivity,
    'field-jump': fieldJump,
    'pool-winners': poolWinners,
    'pool-backward': poolBackward,
    'overlap-repair': overlapRepair,
    'global-average-head': globalAverageHead,
    'border-counts': borderCounts,
    'padding-artifact': paddingArtifact,
    'forward-pass': forwardPass,
    'residual-block': residualBlock,
    'identity-gradient': identityGradient,
    'patch-projection': patchProjectionScene,
    'architecture-choice': architectureChoice,
    transfer,
    'earned-cnn-transfer': earnedCnnTransfer,
  },
});
