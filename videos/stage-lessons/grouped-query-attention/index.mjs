import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import opening from './scenes/opening.mjs';
import attention from './scenes/attention.mjs';
import map from './scenes/map.mjs';
import architectures from './scenes/architectures.mjs';
import tensors from './scenes/tensors.mjs';
import budget from './scenes/budget.mjs';
import roofline from './scenes/roofline.mjs';
import largeBudget from './scenes/large-budget.mjs';
import modelConfig from './scenes/model-config.mjs';
import physicalHeads from './scenes/physical-heads.mjs';
import tradeoff from './scenes/tradeoff.mjs';
import poolingFailure from './scenes/pooling-failure.mjs';
import latentStore from './scenes/latent-store.mjs';
import latentScore from './scenes/latent-score.mjs';
import positionSplit from './scenes/position-split.mjs';
import kernelRoute from './scenes/kernel-route.mjs';
import cacheStep from './scenes/cache-step.mjs';
import causalRepair from './scenes/causal-repair.mjs';
import synthesis from './scenes/synthesis.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';

export default narratedLesson({
  id: 'grouped-query-attention',
  scenes: {
    'opening': opening,
    'attention': attention,
    'map': map,
    'architectures': architectures,
    'tensors': tensors,
    'budget': budget,
    'roofline': roofline,
    'large-budget': largeBudget,
    'model-config': modelConfig,
    'physical-heads': physicalHeads,
    'tradeoff': tradeoff,
    'pooling-failure': poolingFailure,
    'latent-store': latentStore,
    'latent-score': latentScore,
    'position-split': positionSplit,
    'kernel-route': kernelRoute,
    'cache-step': cacheStep,
    'causal-repair': causalRepair,
    'synthesis': synthesis,
    'earned-transfer': earnedTransfer,
  },
});
