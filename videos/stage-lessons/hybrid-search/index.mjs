import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import eligibleCorpus from './scenes/eligible-corpus.mjs';
import lexicalLane from './scenes/lexical-lane.mjs';
import bm25Open from './scenes/bm25-open.mjs';
import sparseExpansion from './scenes/sparse-expansion.mjs';
import denseLane from './scenes/dense-lane.mjs';
import embeddingContract from './scenes/embedding-contract.mjs';
import ivfBorder from './scenes/ivf-border.mjs';
import hnswWalk from './scenes/hnsw-walk.mjs';
import rankFusion from './scenes/rank-fusion.mjs';
import consensusTrap from './scenes/consensus-trap.mjs';
import weightedFusion from './scenes/weighted-fusion.mjs';
import mmrChoice from './scenes/mmr-choice.mjs';
import latencyContract from './scenes/latency-contract.mjs';
import newQuery from './scenes/new-query.mjs';
import policyTransfer from './scenes/policy-transfer.mjs';

export default narratedLesson({
  id: 'hybrid-search',
  scenes: {
    'subject-intro': subjectIntro,
    'eligible-corpus': eligibleCorpus,
    'lexical-lane': lexicalLane,
    'bm25-open': bm25Open,
    'sparse-expansion': sparseExpansion,
    'dense-lane': denseLane,
    'embedding-contract': embeddingContract,
    'ivf-border': ivfBorder,
    'hnsw-walk': hnswWalk,
    'rank-fusion': rankFusion,
    'consensus-trap': consensusTrap,
    'weighted-fusion': weightedFusion,
    'mmr-choice': mmrChoice,
    'latency-contract': latencyContract,
    'new-query': newQuery,
    'policy-transfer': policyTransfer,
  },
});
