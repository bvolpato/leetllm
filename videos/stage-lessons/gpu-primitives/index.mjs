// Cinematic Vizmatic 0.10.0 stage film for GPU Parallel Primitives (23 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGpuPrimitivesInvariants } from './parts.mjs';
import attentionState from './scenes/attention-state.mjs';
import benchmarkEvidence from './scenes/benchmark-evidence.mjs';
import blelloch from './scenes/blelloch.mjs';
import blockBarrier from './scenes/block-barrier.mjs';
import blockOffsets from './scenes/block-offsets.mjs';
import floatingPointOrder from './scenes/floating-point-order.mjs';
import freshOddRow from './scenes/fresh-odd-row.mjs';
import fullWarpContract from './scenes/full-warp-contract.mjs';
import gridReduction from './scenes/grid-reduction.mjs';
import hazardProof from './scenes/hazard-proof.mjs';
import inclusiveScan from './scenes/inclusive-scan.mjs';
import libraryBaseline from './scenes/library-baseline.mjs';
import lookback from './scenes/lookback.mjs';
import normalizerOutput from './scenes/normalizer-output.mjs';
import onlineSoftmax from './scenes/online-softmax.mjs';
import pairwiseReduction from './scenes/pairwise-reduction.mjs';
import partialRange from './scenes/partial-range.mjs';
import prefixContract from './scenes/prefix-contract.mjs';
import scanWork from './scenes/scan-work.mjs';
import selectionContracts from './scenes/selection-contracts.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import transfer from './scenes/transfer.mjs';
import warpCommunication from './scenes/warp-communication.mjs';

export default cinematicLesson({
  id: 'gpu-primitives',
  accent: COSMOS.cyan,
  invariants: verifyGpuPrimitivesInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'pairwise-reduction': pairwiseReduction,
    'warp-communication': warpCommunication,
    'full-warp-contract': fullWarpContract,
    'block-barrier': blockBarrier,
    'grid-reduction': gridReduction,
    'floating-point-order': floatingPointOrder,
    'partial-range': partialRange,
    'inclusive-scan': inclusiveScan,
    'prefix-contract': prefixContract,
    blelloch,
    'scan-work': scanWork,
    'block-offsets': blockOffsets,
    lookback,
    'selection-contracts': selectionContracts,
    'online-softmax': onlineSoftmax,
    'normalizer-output': normalizerOutput,
    'attention-state': attentionState,
    'hazard-proof': hazardProof,
    'library-baseline': libraryBaseline,
    'benchmark-evidence': benchmarkEvidence,
    transfer,
    'fresh-odd-row': freshOddRow,
  },
});
