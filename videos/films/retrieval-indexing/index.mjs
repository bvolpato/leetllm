import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnknownRetrievalScene } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import postingsStage from './stages/postings.mjs';
import queryStage from './stages/query.mjs';
import bm25Stage from './stages/bm25.mjs';
import rankingStage from './stages/ranking.mjs';
import topKStage from './stages/top-k.mjs';
import storageStage from './stages/storage.mjs';
import evaluationStage from './stages/evaluation.mjs';
import analyzerContractStage from './stages/analyzer-contract.mjs';
import bm25ControlsStage from './stages/bm25-controls.mjs';
import denseEncodingStage from './stages/dense-encoding.mjs';
import similarityContractStage from './stages/similarity-contract.mjs';
import fusionRanksStage from './stages/fusion-ranks.mjs';
import fusionScaleStage from './stages/fusion-scale.mjs';
import jointRerankerStage from './stages/joint-reranker.mjs';
import metricEvaluationStage from './stages/metric-evaluation.mjs';
import denseScanStage from './stages/dense-scan.mjs';
import ivfProbesStage from './stages/ivf-probes.mjs';
import hnswLayersStage from './stages/hnsw-layers.mjs';
import pqCodeStage from './stages/pq-code.mjs';
import indexCompositionStage from './stages/index-composition.mjs';
import filterScopeStage from './stages/filter-scope.mjs';
import annComparisonStage from './stages/ann-comparison.mjs';
import retrievalReviewStage from './stages/retrieval-review.mjs';
import freshProbeStage from './stages/fresh-probe.mjs';
export { DOCS, FIXTURE_RERANK_SCORES, GAP_IDS, QUERY, RELEVANT } from './fixtures.mjs';
export { POSTINGS, SOUP_POSITIONS, TERMS, TOKENS, tokenize } from './analysis.mjs';
export {
  AVERAGE_LENGTH,
  DOC_FREQUENCY,
  RANKING,
  SCORES,
  bm25,
  idf,
  termFrequencyScore,
} from './scoring.mjs';
export {
  LEXICAL_TOP_TWO,
  RECALL_AT_TWO,
  SECOND_LANE_UNION,
  TOP_K_TRACE,
  rerankFixture,
  topKTrace,
} from './selection.mjs';
export { GAP_VALUES, decodeGapValues, storageDisplay } from './storage.mjs';
export {
  frontierSearch,
  ivfRoute,
  reciprocalFusion,
  vectorCosine,
  vectorDot,
} from './vector-search.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'retrieval-indexing',
  validateModel,
  scenes: [
    openingStage,
    postingsStage,
    queryStage,
    bm25Stage,
    rankingStage,
    topKStage,
    storageStage,
    evaluationStage,
    analyzerContractStage,
    bm25ControlsStage,
    denseEncodingStage,
    similarityContractStage,
    fusionRanksStage,
    fusionScaleStage,
    jointRerankerStage,
    metricEvaluationStage,
    denseScanStage,
    ivfProbesStage,
    hnswLayersStage,
    pqCodeStage,
    indexCompositionStage,
    filterScopeStage,
    annComparisonStage,
    retrievalReviewStage,
    freshProbeStage,
  ],
});
const stageDraws = new Map(definition.scenes.map((stage) => [stage.id, stage.draw]));
export function draw(ctx, scene, state, api) {
  const painter = stageDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnknownRetrievalScene(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
