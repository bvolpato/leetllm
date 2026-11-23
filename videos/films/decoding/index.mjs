import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import treeStage from './stages/tree.mjs';
import greedyStage from './stages/greedy.mjs';
import beamStage from './stages/beam.mjs';
import statusModelStage from './stages/status-model.mjs';
import prunedPrefixStage from './stages/pruned-prefix.mjs';
import completedScoreStage from './stages/completed-score.mjs';
import lengthObjectiveStage from './stages/length-objective.mjs';
import normalizedStopStage from './stages/normalized-stop.mjs';
import searchQualityStage from './stages/search-quality.mjs';
import temperatureStage from './stages/temperature.mjs';
import temperatureOddsStage from './stages/temperature-odds.mjs';
import temperatureTailStage from './stages/temperature-tail.mjs';
import stableEligibilityStage from './stages/stable-eligibility.mjs';
import topKStage from './stages/top-k.mjs';
import tieContractStage from './stages/tie-contract.mjs';
import nucleusStage from './stages/nucleus.mjs';
import adaptiveSupportStage from './stages/adaptive-support.mjs';
import minpRelativeStage from './stages/minp-relative.mjs';
import minpEvidenceStage from './stages/minp-evidence.mjs';
import signAwareStage from './stages/sign-aware.mjs';
import centeringOrderStage from './stages/centering-order.mjs';
import countPenaltiesStage from './stages/count-penalties.mjs';
import orderedFiltersStage from './stages/ordered-filters.mjs';
import grammarFirstStage from './stages/grammar-first.mjs';
import actualSamplerStage from './stages/actual-sampler.mjs';
import drawStage from './stages/draw.mjs';
import stopContractStage from './stages/stop-contract.mjs';
import replayContractStage from './stages/replay-contract.mjs';
import hostedContractStage from './stages/hosted-contract.mjs';
import evaluationProtocolStage from './stages/evaluation-protocol.mjs';
import transferStage from './stages/transfer.mjs';
import freshPolicyStage from './stages/fresh-policy.mjs';
export { BASE, BRANCHES, LEAVES, STATUS_IDS, STATUS_ROW, WORDS } from './fixtures.mjs';
export {
  decodeLengthScore,
  decodeNormalize,
  decodeRepetition,
  decodeSoftmax,
  decodeSupport,
  nucleus,
} from './arithmetic.mjs';
export { categoricalDraws } from './construction.mjs';
export {
  decodingFreshModel,
  drawSnapshot,
  searchTrace,
  transferExperiment,
  treeDistribution,
  truncationState,
  validateDecodingCore,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'decoding',
  validateModel,
  scenes: [
    introStage,
    treeStage,
    greedyStage,
    beamStage,
    statusModelStage,
    prunedPrefixStage,
    completedScoreStage,
    lengthObjectiveStage,
    normalizedStopStage,
    searchQualityStage,
    temperatureStage,
    temperatureOddsStage,
    temperatureTailStage,
    stableEligibilityStage,
    topKStage,
    tieContractStage,
    nucleusStage,
    adaptiveSupportStage,
    minpRelativeStage,
    minpEvidenceStage,
    signAwareStage,
    centeringOrderStage,
    countPenaltiesStage,
    orderedFiltersStage,
    grammarFirstStage,
    actualSamplerStage,
    drawStage,
    stopContractStage,
    replayContractStage,
    hostedContractStage,
    evaluationProtocolStage,
    transferStage,
    freshPolicyStage,
  ],
});
const stages = new Map(orderedDefinition.scenes.map((stage) => [stage.id, stage]));
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
