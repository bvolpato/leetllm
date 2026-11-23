import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import processorEvidence from './stages/processor-evidence.mjs';
import patches from './stages/patches.mjs';
import convolutionEquivalence from './stages/convolution-equivalence.mjs';
import projection from './stages/projection.mjs';
import projectionRank from './stages/projection-rank.mjs';
import positions from './stages/positions.mjs';
import resolutionGrid from './stages/resolution-grid.mjs';
import rotaryGrid from './stages/rotary-grid.mjs';
import attention from './stages/attention.mjs';
import prelnBlock from './stages/preln-block.mjs';
import inductiveBias from './stages/inductive-bias.mjs';
import budget from './stages/budget.mjs';
import alignment from './stages/alignment.mjs';
import candidateRanking from './stages/candidate-ranking.mjs';
import siglipPairs from './stages/siglip-pairs.mjs';
import variableResolution from './stages/variable-resolution.mjs';
import paddingReadout from './stages/padding-readout.mjs';
import denseFeatureLearning from './stages/dense-feature-learning.mjs';
import bridgeFamilies from './stages/bridge-families.mjs';
import prefixKvBudget from './stages/prefix-kv-budget.mjs';
import bridge from './stages/bridge.mjs';
import freshDetailBoundary from './stages/fresh-detail-boundary.mjs';
export {
  visionCandidateRanking,
  visionPadding,
  visionPrefixBudget,
  visionPreln,
  visionProject,
  visionRotary,
  visionSiglip,
} from './arithmetic.mjs';
export {
  alignmentSnapshot,
  attentionSnapshot,
  budgetSnapshot,
  contributionSnapshot,
  projectionSnapshot,
  visionFreshState,
  visionMixture,
} from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'vision-transformers',
  validateModel,
  scenes: [
    intro,
    processorEvidence,
    patches,
    convolutionEquivalence,
    projection,
    projectionRank,
    positions,
    resolutionGrid,
    rotaryGrid,
    attention,
    prelnBlock,
    inductiveBias,
    budget,
    alignment,
    candidateRanking,
    siglipPairs,
    variableResolution,
    paddingReadout,
    denseFeatureLearning,
    bridgeFamilies,
    prefixKvBudget,
    bridge,
    freshDetailBoundary,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
