// Full-bleed dark-cinema 23-scene Vision Transformers stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyVitInvariants } from './parts.mjs';
import alignment from './scenes/alignment.mjs';
import attention from './scenes/attention.mjs';
import bridgeFamilies from './scenes/bridge-families.mjs';
import bridge from './scenes/bridge.mjs';
import budget from './scenes/budget.mjs';
import candidateRanking from './scenes/candidate-ranking.mjs';
import convolutionEquivalence from './scenes/convolution-equivalence.mjs';
import denseFeatureLearning from './scenes/dense-feature-learning.mjs';
import freshDetailBoundary from './scenes/fresh-detail-boundary.mjs';
import inductiveBias from './scenes/inductive-bias.mjs';
import intro from './scenes/intro.mjs';
import paddingReadout from './scenes/padding-readout.mjs';
import patches from './scenes/patches.mjs';
import positions from './scenes/positions.mjs';
import prefixKvBudget from './scenes/prefix-kv-budget.mjs';
import prelnBlock from './scenes/preln-block.mjs';
import processorEvidence from './scenes/processor-evidence.mjs';
import projectionRank from './scenes/projection-rank.mjs';
import projection from './scenes/projection.mjs';
import resolutionGrid from './scenes/resolution-grid.mjs';
import rotaryGrid from './scenes/rotary-grid.mjs';
import siglipPairs from './scenes/siglip-pairs.mjs';
import variableResolution from './scenes/variable-resolution.mjs';

export default cinematicLesson({
  id: 'vision-transformers',
  accent: COSMOS.cyan,
  invariants: verifyVitInvariants,
  scenes: {
    intro,
    'processor-evidence': processorEvidence,
    patches,
    'convolution-equivalence': convolutionEquivalence,
    projection,
    'projection-rank': projectionRank,
    positions,
    'resolution-grid': resolutionGrid,
    'rotary-grid': rotaryGrid,
    attention,
    'preln-block': prelnBlock,
    'inductive-bias': inductiveBias,
    budget,
    alignment,
    'candidate-ranking': candidateRanking,
    'siglip-pairs': siglipPairs,
    'variable-resolution': variableResolution,
    'padding-readout': paddingReadout,
    'dense-feature-learning': denseFeatureLearning,
    'bridge-families': bridgeFamilies,
    'prefix-kv-budget': prefixKvBudget,
    bridge,
    'fresh-detail-boundary': freshDetailBoundary,
  },
});
