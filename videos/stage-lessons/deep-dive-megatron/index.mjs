// Deep Dive - Megatron: Full-bleed cinematic Vizmatic 0.10.0 stage film (29 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyMegatronInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import diagnosis from './scenes/diagnosis.mjs';
import sourceContract from './scenes/source-contract.mjs';
import smallLattice from './scenes/small-lattice.mjs';
import mesh from './scenes/mesh.mjs';
import rankAlgorithm from './scenes/rank-algorithm.mjs';
import storedShapes from './scenes/stored-shapes.mjs';
import tensor from './scenes/tensor.mjs';
import backwardBias from './scenes/backward-bias.mjs';
import pipeline from './scenes/pipeline.mjs';
import microbatchBudget from './scenes/microbatch-budget.mjs';
import dataOwnership from './scenes/data-ownership.mjs';
import context from './scenes/context.mjs';
import sequenceRole from './scenes/sequence-role.mjs';
import experts from './scenes/experts.mjs';
import expertCapacity from './scenes/expert-capacity.mjs';
import foldedGrid from './scenes/folded-grid.mjs';
import optimizer from './scenes/optimizer.mjs';
import objectiveWeighting from './scenes/objective-weighting.mjs';
import optimizerStep from './scenes/optimizer-step.mjs';
import recovery from './scenes/recovery.mjs';
import resumeState from './scenes/resume-state.mjs';
import checkpointFormats from './scenes/checkpoint-formats.mjs';
import precisionRecipes from './scenes/precision-recipes.mjs';
import mfuReceipt from './scenes/mfu-receipt.mjs';
import measuredTrace from './scenes/measured-trace.mjs';
import researchOwnership from './scenes/research-ownership.mjs';
import fitBoundary from './scenes/fit-boundary.mjs';
import earnedReturn from './scenes/earned-return.mjs';

export default cinematicLesson({
  id: 'deep-dive-megatron',
  accent: COSMOS.blue,
  invariants: verifyMegatronInvariants,
  scenes: {
    intro,
    diagnosis,
    'source-contract': sourceContract,
    'small-lattice': smallLattice,
    mesh,
    'rank-algorithm': rankAlgorithm,
    'stored-shapes': storedShapes,
    tensor,
    'backward-bias': backwardBias,
    pipeline,
    'microbatch-budget': microbatchBudget,
    'data-ownership': dataOwnership,
    context,
    'sequence-role': sequenceRole,
    experts,
    'expert-capacity': expertCapacity,
    'folded-grid': foldedGrid,
    optimizer,
    'objective-weighting': objectiveWeighting,
    'optimizer-step': optimizerStep,
    recovery,
    'resume-state': resumeState,
    'checkpoint-formats': checkpointFormats,
    'precision-recipes': precisionRecipes,
    'mfu-receipt': mfuReceipt,
    'measured-trace': measuredTrace,
    'research-ownership': researchOwnership,
    'fit-boundary': fitBoundary,
    'earned-return': earnedReturn,
  },
});
