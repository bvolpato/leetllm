// Cinematic Vizmatic 0.10.0 stage film for LoRA (35 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLoraInvariants } from './parts.mjs';
import denseUpdate from './scenes/dense-update.mjs';
import diagnosePolicy from './scenes/diagnose-policy.mjs';
import doraBackward from './scenes/dora-backward.mjs';
import doraForward from './scenes/dora-forward.mjs';
import evaluate from './scenes/evaluate.mjs';
import exportContract from './scenes/export-contract.mjs';
import factorization from './scenes/factorization.mjs';
import freshPolicy from './scenes/fresh-policy.mjs';
import frozenBackward from './scenes/frozen-backward.mjs';
import gradientContract from './scenes/gradient-contract.mjs';
import initialization from './scenes/initialization.mjs';
import intrinsicRank from './scenes/intrinsic-rank.mjs';
import intro from './scenes/intro.mjs';
import lexicalContract from './scenes/lexical-contract.mjs';
import linearLayer from './scenes/linear-layer.mjs';
import memory from './scenes/memory.mjs';
import merge from './scenes/merge.mjs';
import nestedPaging from './scenes/nested-paging.mjs';
import nf4Codec from './scenes/nf4-codec.mjs';
import parameterCount from './scenes/parameter-count.mjs';
import policyTask from './scenes/policy-task.mjs';
import precisionContract from './scenes/precision-contract.mjs';
import promptPrefix from './scenes/prompt-prefix.mjs';
import rankOne from './scenes/rank-one.mjs';
import rankScaling from './scenes/rank-scaling.mjs';
import rankTwo from './scenes/rank-two.mjs';
import rectangularContract from './scenes/rectangular-contract.mjs';
import servingContract from './scenes/serving-contract.mjs';
import shardedTraining from './scenes/sharded-training.mjs';
import stateBudget from './scenes/state-budget.mjs';
import strength from './scenes/strength.mjs';
import targetBudget from './scenes/target-budget.mjs';
import targetModules from './scenes/target-modules.mjs';
import thinForward from './scenes/thin-forward.mjs';
import tinyPeft from './scenes/tiny-peft.mjs';

export default cinematicLesson({
  id: 'lora',
  accent: COSMOS.gold,
  invariants: verifyLoraInvariants,
  scenes: {
    'policy-task': policyTask,
    intro,
    'linear-layer': linearLayer,
    'dense-update': denseUpdate,
    'intrinsic-rank': intrinsicRank,
    'rank-one': rankOne,
    'rank-two': rankTwo,
    factorization,
    'thin-forward': thinForward,
    'parameter-count': parameterCount,
    initialization,
    'gradient-contract': gradientContract,
    strength,
    'rank-scaling': rankScaling,
    'target-modules': targetModules,
    'target-budget': targetBudget,
    'prompt-prefix': promptPrefix,
    'rectangular-contract': rectangularContract,
    'tiny-peft': tinyPeft,
    'lexical-contract': lexicalContract,
    memory,
    'state-budget': stateBudget,
    'frozen-backward': frozenBackward,
    'nf4-codec': nf4Codec,
    'nested-paging': nestedPaging,
    'precision-contract': precisionContract,
    'sharded-training': shardedTraining,
    merge,
    'export-contract': exportContract,
    'dora-forward': doraForward,
    'dora-backward': doraBackward,
    'serving-contract': servingContract,
    evaluate,
    'diagnose-policy': diagnosePolicy,
    'fresh-policy': freshPolicy,
  },
});
