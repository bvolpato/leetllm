// Pure Cinema Vizmatic 0.10.0 stage film for Grouped-Query Attention (20 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGqaInvariants } from './parts.mjs';
import architectures from './scenes/architectures.mjs';
import attention from './scenes/attention.mjs';
import budget from './scenes/budget.mjs';
import cacheStep from './scenes/cache-step.mjs';
import causalRepair from './scenes/causal-repair.mjs';
import earnedTransfer from './scenes/earned-transfer.mjs';
import kernelRoute from './scenes/kernel-route.mjs';
import largeBudget from './scenes/large-budget.mjs';
import latentScore from './scenes/latent-score.mjs';
import latentStore from './scenes/latent-store.mjs';
import map from './scenes/map.mjs';
import modelConfig from './scenes/model-config.mjs';
import opening from './scenes/opening.mjs';
import physicalHeads from './scenes/physical-heads.mjs';
import poolingFailure from './scenes/pooling-failure.mjs';
import positionSplit from './scenes/position-split.mjs';
import roofline from './scenes/roofline.mjs';
import synthesis from './scenes/synthesis.mjs';
import tensors from './scenes/tensors.mjs';
import tradeoff from './scenes/tradeoff.mjs';

export default cinematicLesson({
  id: 'grouped-query-attention',
  accent: COSMOS.cyan,
  invariants: verifyGqaInvariants,
  scenes: {
    opening,
    attention,
    map,
    architectures,
    tensors,
    budget,
    roofline,
    'large-budget': largeBudget,
    'model-config': modelConfig,
    'physical-heads': physicalHeads,
    tradeoff,
    'pooling-failure': poolingFailure,
    'latent-store': latentStore,
    'latent-score': latentScore,
    'position-split': positionSplit,
    'kernel-route': kernelRoute,
    'cache-step': cacheStep,
    'causal-repair': causalRepair,
    synthesis,
    'earned-transfer': earnedTransfer,
  },
});
