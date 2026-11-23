import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import pairwiseReduction from './stages/pairwise-reduction.mjs';
import warpCommunication from './stages/warp-communication.mjs';
import fullWarpContract from './stages/full-warp-contract.mjs';
import blockBarrier from './stages/block-barrier.mjs';
import gridReduction from './stages/grid-reduction.mjs';
import floatingPointOrder from './stages/floating-point-order.mjs';
import partialRange from './stages/partial-range.mjs';
import inclusiveScan from './stages/inclusive-scan.mjs';
import prefixContract from './stages/prefix-contract.mjs';
import blelloch from './stages/blelloch.mjs';
import scanWorkStage from './stages/scan-work.mjs';
import blockOffsets from './stages/block-offsets.mjs';
import lookback from './stages/lookback.mjs';
import selectionContracts from './stages/selection-contracts.mjs';
import onlineSoftmaxStage from './stages/online-softmax.mjs';
import normalizerOutput from './stages/normalizer-output.mjs';
import attentionState from './stages/attention-state.mjs';
import hazardProof from './stages/hazard-proof.mjs';
import libraryBaseline from './stages/library-baseline.mjs';
import benchmarkEvidence from './stages/benchmark-evidence.mjs';
import transfer from './stages/transfer.mjs';
import freshOddRow from './stages/fresh-odd-row.mjs';
export {
  blellochTrace,
  exclusive,
  hierarchyCounts,
  onlineSoftmax,
  reductionLevels,
  scanLevels,
  scanWork,
  shuffleLevels,
  shuffleRead,
} from './arithmetic.mjs';
export {
  ALL,
  ARTICLE_INPUT,
  ARTICLE_PREFIX,
  ATTENTION,
  BLELLOCH,
  FIRST,
  INPUT,
  LEFT,
  REDUCTION,
  RIGHT,
  SCAN,
  SHUFFLE,
} from './fixtures.mjs';
export { freshPrefixSnapshot, onlineRescale, scanTeachingSnapshot } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gpu-primitives',
  validateModel,
  scenes: [
    subjectIntro,
    pairwiseReduction,
    warpCommunication,
    fullWarpContract,
    blockBarrier,
    gridReduction,
    floatingPointOrder,
    partialRange,
    inclusiveScan,
    prefixContract,
    blelloch,
    scanWorkStage,
    blockOffsets,
    lookback,
    selectionContracts,
    onlineSoftmaxStage,
    normalizerOutput,
    attentionState,
    hazardProof,
    libraryBaseline,
    benchmarkEvidence,
    transfer,
    freshOddRow,
  ],
});
export const draw = definition.draw;
export default definition;
