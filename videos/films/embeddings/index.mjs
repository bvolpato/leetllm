import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import lookup from './stages/lookup.mjs';
import tableContract from './stages/table-contract.mjs';
import neighbors from './stages/neighbors.mjs';
import countPpmi from './stages/count-ppmi.mjs';
import factorization from './stages/factorization.mjs';
import predictiveWindow from './stages/predictive-window.mjs';
import negativeStep from './stages/negative-step.mjs';
import shiftedPmi from './stages/shifted-pmi.mjs';
import gloveFit from './stages/glove-fit.mjs';
import subwordComponents from './stages/subword-components.mjs';
import geometry from './stages/geometry.mjs';
import context from './stages/context.mjs';
import articleContext from './stages/article-context.mjs';
import elmoLayers from './stages/elmo-layers.mjs';
import visibilityTest from './stages/visibility-test.mjs';
import contrast from './stages/contrast.mjs';
import pooling from './stages/pooling.mjs';
import limits from './stages/limits.mjs';
import anisotropyCheck from './stages/anisotropy-check.mjs';
import spaceContract from './stages/space-contract.mjs';
import transfer from './stages/transfer.mjs';
import freshRepresentation from './stages/fresh-representation.mjs';
export {
  centerPopulation,
  cosine,
  gloveResidual,
  maskedMean,
  occurrenceVisibility,
  rotateEmbedding,
  subwordComposition,
} from './arithmetic.mjs';
export {
  contextCountTrace,
  extendedEmbeddingState,
  limitsGeometry,
  limitsState,
  poolingState,
  substitutionState,
} from './construction.mjs';
export { EMBEDDING_COUNTS, FINANCE, LIMITS_CUES, NEGATIVE_OUTPUTS, RIVER, V } from './fixtures.mjs';
export { countRepresentation, negativeSamplingState } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'embeddings',
  validateModel,
  scenes: [
    intro,
    lookup,
    tableContract,
    neighbors,
    countPpmi,
    factorization,
    predictiveWindow,
    negativeStep,
    shiftedPmi,
    gloveFit,
    subwordComponents,
    geometry,
    context,
    articleContext,
    elmoLayers,
    visibilityTest,
    contrast,
    pooling,
    limits,
    anisotropyCheck,
    spaceContract,
    transfer,
    freshRepresentation,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
