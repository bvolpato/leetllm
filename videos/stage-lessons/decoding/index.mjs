// Full-bleed dark-cinema 33-scene Decoding Strategies stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyDecodingModel } from './parts.mjs';
import intro from './scenes/intro.mjs';
import tree from './scenes/tree.mjs';
import greedy from './scenes/greedy.mjs';
import beam from './scenes/beam.mjs';
import statusModel from './scenes/status-model.mjs';
import prunedPrefix from './scenes/pruned-prefix.mjs';
import completedScore from './scenes/completed-score.mjs';
import lengthObjective from './scenes/length-objective.mjs';
import normalizedStop from './scenes/normalized-stop.mjs';
import searchQuality from './scenes/search-quality.mjs';
import temperature from './scenes/temperature.mjs';
import temperatureOdds from './scenes/temperature-odds.mjs';
import temperatureTail from './scenes/temperature-tail.mjs';
import stableEligibility from './scenes/stable-eligibility.mjs';
import topK from './scenes/top-k.mjs';
import tieContract from './scenes/tie-contract.mjs';
import nucleusScene from './scenes/nucleus.mjs';
import adaptiveSupport from './scenes/adaptive-support.mjs';
import minpRelative from './scenes/minp-relative.mjs';
import minpEvidence from './scenes/minp-evidence.mjs';
import signAware from './scenes/sign-aware.mjs';
import centeringOrder from './scenes/centering-order.mjs';
import countPenalties from './scenes/count-penalties.mjs';
import orderedFilters from './scenes/ordered-filters.mjs';
import grammarFirst from './scenes/grammar-first.mjs';
import actualSampler from './scenes/actual-sampler.mjs';
import draw from './scenes/draw.mjs';
import stopContract from './scenes/stop-contract.mjs';
import replayContract from './scenes/replay-contract.mjs';
import hostedContract from './scenes/hosted-contract.mjs';
import evaluationProtocol from './scenes/evaluation-protocol.mjs';
import transfer from './scenes/transfer.mjs';
import freshPolicy from './scenes/fresh-policy.mjs';

export default cinematicLesson({
  id: 'decoding',
  accent: COSMOS.cyan,
  invariants: verifyDecodingModel,
  scenes: {
    intro,
    tree,
    greedy,
    beam,
    'status-model': statusModel,
    'pruned-prefix': prunedPrefix,
    'completed-score': completedScore,
    'length-objective': lengthObjective,
    'normalized-stop': normalizedStop,
    'search-quality': searchQuality,
    temperature,
    'temperature-odds': temperatureOdds,
    'temperature-tail': temperatureTail,
    'stable-eligibility': stableEligibility,
    'top-k': topK,
    'tie-contract': tieContract,
    nucleus: nucleusScene,
    'adaptive-support': adaptiveSupport,
    'minp-relative': minpRelative,
    'minp-evidence': minpEvidence,
    'sign-aware': signAware,
    'centering-order': centeringOrder,
    'count-penalties': countPenalties,
    'ordered-filters': orderedFilters,
    'grammar-first': grammarFirst,
    'actual-sampler': actualSampler,
    draw,
    'stop-contract': stopContract,
    'replay-contract': replayContract,
    'hosted-contract': hostedContract,
    'evaluation-protocol': evaluationProtocol,
    transfer,
    'fresh-policy': freshPolicy,
  },
});
