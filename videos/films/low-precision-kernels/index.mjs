import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { drawUnrecognizedScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import formatBudgetStage from './stages/format-budget.mjs';
import numberGridStage from './stages/number-grid.mjs';
import subnormalGridStage from './stages/subnormal-grid.mjs';
import overflowModeStage from './stages/overflow-mode.mjs';
import roundingProbabilityStage from './stages/rounding-probability.mjs';
import staleScaleStage from './stages/stale-scale.mjs';
import scaleConventionsStage from './stages/scale-conventions.mjs';
import scaleTimelineStage from './stages/scale-timeline.mjs';
import onlineQuantizationStage from './stages/online-quantization.mjs';
import localScalesStage from './stages/local-scales.mjs';
import cpuContractStage from './stages/cpu-contract.mjs';
import projectionStage from './stages/projection.mjs';
import blockScalesStage from './stages/block-scales.mjs';
import accumulationStage from './stages/accumulation.mjs';
import trafficStage from './stages/traffic.mjs';
import scaleBytesStage from './stages/scale-bytes.mjs';
import subeightFormatsStage from './stages/subeight-formats.mjs';
import orientationStage from './stages/orientation.mjs';
import contractStage from './stages/contract.mjs';
import abiDispatchStage from './stages/abi-dispatch.mjs';
import referenceLadderStage from './stages/reference-ladder.mjs';
import freshGroupStage from './stages/fresh-group.mjs';
export {
  additions,
  decode8,
  encode8,
  roundHalf,
  roundTrip,
  roundedOverflow,
  stochasticNeighbor,
} from './encoding.mjs';
export {
  blockContraction,
  freshGroupWorksheet,
  orientationWorksheet,
  projection,
  scaleExperiment,
} from './model.mjs';
export { delayedScaleReplay, sampleModel } from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'low-precision-kernels',
  validateModel,
  scenes: [
    introStage,
    staleScaleStage,
    formatBudgetStage,
    numberGridStage,
    subnormalGridStage,
    overflowModeStage,
    roundingProbabilityStage,
    scaleConventionsStage,
    scaleTimelineStage,
    onlineQuantizationStage,
    localScalesStage,
    cpuContractStage,
    projectionStage,
    blockScalesStage,
    accumulationStage,
    trafficStage,
    scaleBytesStage,
    subeightFormatsStage,
    orientationStage,
    contractStage,
    abiDispatchStage,
    referenceLadderStage,
    freshGroupStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
