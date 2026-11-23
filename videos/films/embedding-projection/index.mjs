import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import budget from './stages/budget.mjs';
import projection from './stages/projection.mjs';
import methods from './stages/methods.mjs';
import tsne from './stages/tsne.mjs';
import umap from './stages/umap.mjs';
import verify from './stages/verify.mjs';
import serving from './stages/serving.mjs';
import policyBaseline from './stages/policy-baseline.mjs';
import geometryBudget from './stages/geometry-budget.mjs';
import pcaFit from './stages/pca-fit.mjs';
import pcaQuery from './stages/pca-query.mjs';
import recallSweep from './stages/recall-sweep.mjs';
import tsneContract from './stages/tsne-contract.mjs';
import umapContract from './stages/umap-contract.mjs';
import randomProjection from './stages/random-projection.mjs';
import scalarBinary from './stages/scalar-binary.mjs';
import productQuantization from './stages/product-quantization.mjs';
import nativePrefix from './stages/native-prefix.mjs';
import releaseExperiment from './stages/release-experiment.mjs';
import freshProjection from './stages/fresh-projection.mjs';
export {
  cauchyMap,
  mapPairFixture,
  nearest,
  pairDistanceFor,
  savedCoordinates,
  tsneTerm,
  unitFinite,
} from './arithmetic.mjs';
export { methodsState, projectionState, storageTransition, umapState } from './construction.mjs';
export {
  DROP_FIXTURE,
  FRESH_BASIS,
  NEIGHBOR_MAP,
  NEIGHBOR_SOURCE,
  NEIGHBOR_Z,
  PCA_POINTS,
  TSNE_PAIR,
  UMAP_DIRECTIONS,
  VECTOR_BYTES,
} from './fixtures.mjs';
export {
  MAP_NEIGHBORS,
  NEIGHBOR_MATCHES,
  NEIGHBOR_PCA,
  NEIGHBOR_PCA_EIGENVALUES,
  NEIGHBOR_SOURCE_3D,
  PCA_AXIS,
  PCA_EXPLAINED,
  PCA_LAMBDA_1,
  PCA_MATCHES,
  PCA_NEIGHBORS,
  PCA_PROJECTION,
  POLICY_SCORES,
  SOURCE_NEIGHBORS,
  UMAP_UNION,
  freshCoordinates,
  originalBytes,
  projectedDrop,
  reducedBytes,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'embedding-projection',
  validateModel,
  scenes: [
    opening,
    budget,
    projection,
    methods,
    tsne,
    umap,
    verify,
    serving,
    policyBaseline,
    geometryBudget,
    pcaFit,
    pcaQuery,
    recallSweep,
    tsneContract,
    umapContract,
    randomProjection,
    scalarBinary,
    productQuantization,
    nativePrefix,
    releaseExperiment,
    freshProjection,
  ],
});
export function draw(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    if (definition.scenes.some((stage) => stage.id === scene.id))
      definition.draw(ctx, scene, state, api);
    else api.clamp(state.beatP ?? 0);
  });
}
export default Object.freeze({ ...definition, draw });
