import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import openingStage from './stages/opening.mjs';
import coordinatesStage from './stages/coordinates.mjs';
import rulersStage from './stages/rulers.mjs';
import magnitudeStage from './stages/magnitude.mjs';
import normalizeStage from './stages/normalize.mjs';
import normContractStage from './stages/norm-contract.mjs';
import prefixStage from './stages/prefix.mjs';
import payloadStage from './stages/payload.mjs';
import quantizationStage from './stages/quantization.mjs';
import scalarCodecStage from './stages/scalar-codec.mjs';
import scalarScalesStage from './stages/scalar-scales.mjs';
import calibrationStage from './stages/calibration.mjs';
import wideArithmeticStage from './stages/wide-arithmetic.mjs';
import pqCodebooksStage from './stages/pq-codebooks.mjs';
import pqDistanceStage from './stages/pq-distance.mjs';
import pqTransformStage from './stages/pq-transform.mjs';
import binaryPackStage from './stages/binary-pack.mjs';
import signAngleStage from './stages/sign-angle.mjs';
import graphStage from './stages/graph.mjs';
import indexMemoryStage from './stages/index-memory.mjs';
import authorizedFunnelStage from './stages/authorized-funnel.mjs';
import deploymentStage from './stages/deployment.mjs';
import synthesisStage from './stages/synthesis.mjs';
import freshQueryStage from './stages/fresh-query.mjs';
export {
  cosine,
  dot,
  l2,
  norm,
  normalized,
  quantize,
  robustUnit,
  scalarEncode,
  signCode,
} from './arithmetic.mjs';
export {
  AUTH,
  GRAPH,
  METRICS,
  PASSAGES,
  PQ_PAIRS,
  PQ_QUERY,
  PREFIX_DOCS,
  QUANTIZATION_FIXTURE,
  QUANTIZATION_RESULT,
  QUERY,
  SCALED_A,
  UNIT_METRICS,
} from './fixtures.mjs';
export {
  authorizedSearch,
  calibrationRanking,
  calibrationRankingFrame,
  calibrationResult,
  deploymentFrame,
  freshMetricVisibility,
  graphSearch,
  magnitudeScale,
  normalizationFrame,
  openingCandidates,
  pqTables,
  prefixResults,
  quantizationFrame,
  quantizationProgress,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'embedding-geometry',
  validateModel,
  scenes: [
    openingStage,
    coordinatesStage,
    rulersStage,
    magnitudeStage,
    normalizeStage,
    normContractStage,
    prefixStage,
    payloadStage,
    quantizationStage,
    scalarCodecStage,
    scalarScalesStage,
    calibrationStage,
    wideArithmeticStage,
    pqCodebooksStage,
    pqDistanceStage,
    pqTransformStage,
    binaryPackStage,
    signAngleStage,
    graphStage,
    indexMemoryStage,
    authorizedFunnelStage,
    deploymentStage,
    synthesisStage,
    freshQueryStage,
  ],
});
export const draw = definition.draw;
export default definition;
