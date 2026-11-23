import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import eligibleCorpus from './stages/eligible-corpus.mjs';
import lexicalLane from './stages/lexical-lane.mjs';
import denseLane from './stages/dense-lane.mjs';
import rankFusion from './stages/rank-fusion.mjs';
import consensusTrap from './stages/consensus-trap.mjs';
import newQuery from './stages/new-query.mjs';
import bm25Open from './stages/bm25-open.mjs';
import sparseExpansion from './stages/sparse-expansion.mjs';
import embeddingContract from './stages/embedding-contract.mjs';
import ivfBorder from './stages/ivf-border.mjs';
import hnswWalk from './stages/hnsw-walk.mjs';
import weightedFusion from './stages/weighted-fusion.mjs';
import mmrChoice from './stages/mmr-choice.mjs';
import latencyContract from './stages/latency-contract.mjs';
import policyTransfer from './stages/policy-transfer.mjs';
export {
  consensusSnapshot,
  coordinateFrame,
  fusionSnapshot,
  newQuerySnapshot,
} from './construction.mjs';
export { LIBRARY_RECORD } from './fixtures.mjs';
export {
  bm25Term,
  coordinateGeneration,
  fuse,
  libraryEvidence,
  lowerLayerSearch,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'hybrid-search',
  validateModel,
  scenes: [
    subjectIntro,
    eligibleCorpus,
    lexicalLane,
    denseLane,
    rankFusion,
    consensusTrap,
    newQuery,
    bm25Open,
    sparseExpansion,
    embeddingContract,
    ivfBorder,
    hnswWalk,
    weightedFusion,
    mmrChoice,
    latencyContract,
    policyTransfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error(`Unknown hybrid-search scene: ${scene.id}`);
}
export default Object.freeze({ ...definition, draw });
