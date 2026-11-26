// Cinematic Vizmatic 0.10.0 stage film for `rope` (How Position Changes Attention).
// All 32 scenes in canonical lesson.yaml order, powered by cinematic-kit.mjs and verified against films/rope/model.mjs.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyRopeInvariants } from './parts.mjs';
import intro from './scenes/intro.mjs';
import permutation from './scenes/permutation.mjs';
import maskAndPrefill from './scenes/mask-and-prefill.mjs';
import insertion from './scenes/insertion.mjs';
import absoluteWaves from './scenes/absolute-waves.mjs';
import absoluteMixture from './scenes/absolute-mixture.mjs';
import finiteTable from './scenes/finite-table.mjs';
import rotation from './scenes/rotation.mjs';
import matrix from './scenes/matrix.mjs';
import dotProduct from './scenes/dot-product.mjs';
import sharedShift from './scenes/shared-shift.mjs';
import frequencies from './scenes/frequencies.mjs';
import fullHeadContract from './scenes/full-head-contract.mjs';
import pairSum from './scenes/pair-sum.mjs';
import pairingContract from './scenes/pairing-contract.mjs';
import routing from './scenes/routing.mjs';
import phaseWrap from './scenes/phase-wrap.mjs';
import axialCoordinates from './scenes/axial-coordinates.mjs';
import alibi from './scenes/alibi.mjs';
import alibiSpectrum from './scenes/alibi-spectrum.mjs';
import farContent from './scenes/far-content.mjs';
import interpolation from './scenes/interpolation.mjs';
import positionPrecision from './scenes/position-precision.mjs';
import ntkSchedule from './scenes/ntk-schedule.mjs';
import yarnBands from './scenes/yarn-bands.mjs';
import yarnTemperature from './scenes/yarn-temperature.mjs';
import checkpointContract from './scenes/checkpoint-contract.mjs';
import cachedLayer from './scenes/cached-layer.mjs';
import cachedChunk from './scenes/cached-chunk.mjs';
import changingSchedule from './scenes/changing-schedule.mjs';
import evaluation from './scenes/evaluation.mjs';
import freshPositionContract from './scenes/fresh-position-contract.mjs';

export default cinematicLesson({
  id: 'rope',
  accent: COSMOS.cyan,
  backdrop: { stars: 0, nebulaRadius: 1350, nebulaInner: '#1b28552e', nebulaMid: '#11163318' },
  invariants: verifyRopeInvariants,
  scenes: {
    intro,
    permutation,
    'mask-and-prefill': maskAndPrefill,
    insertion,
    'absolute-waves': absoluteWaves,
    'absolute-mixture': absoluteMixture,
    'finite-table': finiteTable,
    rotation,
    matrix,
    'dot-product': dotProduct,
    'shared-shift': sharedShift,
    frequencies,
    'full-head-contract': fullHeadContract,
    'pair-sum': pairSum,
    'pairing-contract': pairingContract,
    routing,
    'phase-wrap': phaseWrap,
    'axial-coordinates': axialCoordinates,
    alibi,
    'alibi-spectrum': alibiSpectrum,
    'far-content': farContent,
    interpolation,
    'position-precision': positionPrecision,
    'ntk-schedule': ntkSchedule,
    'yarn-bands': yarnBands,
    'yarn-temperature': yarnTemperature,
    'checkpoint-contract': checkpointContract,
    'cached-layer': cachedLayer,
    'cached-chunk': cachedChunk,
    'changing-schedule': changingSchedule,
    evaluation,
    'fresh-position-contract': freshPositionContract,
  },
});
