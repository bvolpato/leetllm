// Retrieval & Indexing: Full-bleed dark cinema stage lesson (25 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyRetrievalIndexingInvariants } from './parts.mjs';
import opening from './scenes/opening.mjs';
import postings from './scenes/postings.mjs';
import query from './scenes/query.mjs';
import bm25Scene from './scenes/bm25.mjs';
import ranking from './scenes/ranking.mjs';
import topK from './scenes/top-k.mjs';
import storage from './scenes/storage.mjs';
import evaluation from './scenes/evaluation.mjs';
import analyzerContract from './scenes/analyzer-contract.mjs';
import bm25Controls from './scenes/bm25-controls.mjs';
import denseEncoding from './scenes/dense-encoding.mjs';
import similarityContract from './scenes/similarity-contract.mjs';
import fusionRanks from './scenes/fusion-ranks.mjs';
import fusionScale from './scenes/fusion-scale.mjs';
import jointReranker from './scenes/joint-reranker.mjs';
import metricEvaluation from './scenes/metric-evaluation.mjs';
import denseScan from './scenes/dense-scan.mjs';
import ivfProbes from './scenes/ivf-probes.mjs';
import hnswLayers from './scenes/hnsw-layers.mjs';
import pqCode from './scenes/pq-code.mjs';
import indexComposition from './scenes/index-composition.mjs';
import filterScope from './scenes/filter-scope.mjs';
import annComparison from './scenes/ann-comparison.mjs';
import retrievalReview from './scenes/retrieval-review.mjs';
import freshProbe from './scenes/fresh-probe.mjs';

export default cinematicLesson({
  id: 'retrieval-indexing',
  accent: COSMOS.cyan,
  invariants: verifyRetrievalIndexingInvariants,
  scenes: {
    opening,
    postings,
    query,
    bm25: bm25Scene,
    ranking,
    'top-k': topK,
    storage,
    evaluation,
    'analyzer-contract': analyzerContract,
    'bm25-controls': bm25Controls,
    'dense-encoding': denseEncoding,
    'similarity-contract': similarityContract,
    'fusion-ranks': fusionRanks,
    'fusion-scale': fusionScale,
    'joint-reranker': jointReranker,
    'metric-evaluation': metricEvaluation,
    'dense-scan': denseScan,
    'ivf-probes': ivfProbes,
    'hnsw-layers': hnswLayers,
    'pq-code': pqCode,
    'index-composition': indexComposition,
    'filter-scope': filterScope,
    'ann-comparison': annComparison,
    'retrieval-review': retrievalReview,
    'fresh-probe': freshProbe,
  },
});
