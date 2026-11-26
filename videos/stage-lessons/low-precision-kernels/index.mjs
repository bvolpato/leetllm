// Cinematic Vizmatic 0.10.0 stage film for Low-Precision Kernels (23 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLowPrecisionInvariants } from './parts.mjs';
import abiDispatch from './scenes/abi-dispatch.mjs';
import accumulation from './scenes/accumulation.mjs';
import blockScales from './scenes/block-scales.mjs';
import contract from './scenes/contract.mjs';
import cpuContract from './scenes/cpu-contract.mjs';
import formatBudget from './scenes/format-budget.mjs';
import freshGroup from './scenes/fresh-group.mjs';
import intro from './scenes/intro.mjs';
import localScales from './scenes/local-scales.mjs';
import numberGrid from './scenes/number-grid.mjs';
import onlineQuantization from './scenes/online-quantization.mjs';
import orientation from './scenes/orientation.mjs';
import overflowMode from './scenes/overflow-mode.mjs';
import projection from './scenes/projection.mjs';
import referenceLadder from './scenes/reference-ladder.mjs';
import roundingProbability from './scenes/rounding-probability.mjs';
import scaleBytes from './scenes/scale-bytes.mjs';
import scaleConventions from './scenes/scale-conventions.mjs';
import scaleTimeline from './scenes/scale-timeline.mjs';
import staleScale from './scenes/stale-scale.mjs';
import subeightFormats from './scenes/subeight-formats.mjs';
import subnormalGrid from './scenes/subnormal-grid.mjs';
import traffic from './scenes/traffic.mjs';

export default cinematicLesson({
  id: 'low-precision-kernels',
  accent: COSMOS.gold,
  invariants: verifyLowPrecisionInvariants,
  scenes: {
    intro,
    'stale-scale': staleScale,
    'format-budget': formatBudget,
    'number-grid': numberGrid,
    'subnormal-grid': subnormalGrid,
    'overflow-mode': overflowMode,
    'rounding-probability': roundingProbability,
    'scale-conventions': scaleConventions,
    'scale-timeline': scaleTimeline,
    'online-quantization': onlineQuantization,
    'local-scales': localScales,
    'cpu-contract': cpuContract,
    projection,
    'block-scales': blockScales,
    accumulation,
    traffic,
    'scale-bytes': scaleBytes,
    'subeight-formats': subeightFormats,
    orientation,
    contract,
    'abi-dispatch': abiDispatch,
    'reference-ladder': referenceLadder,
    'fresh-group': freshGroup,
  },
});
