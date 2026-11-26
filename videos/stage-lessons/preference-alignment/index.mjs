// Cinematic Vizmatic 0.10.0 stage film for Learning from Preferred Answers (RLHF / PPO / DPO / GRPO, 36 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPreferenceAlignmentInvariants } from './parts.mjs';
import aiFeedback from './scenes/ai-feedback.mjs';
import betaDoubleRole from './scenes/beta-double-role.mjs';
import btJudge from './scenes/bt-judge.mjs';
import evaluation from './scenes/evaluation.mjs';
import freshRelease from './scenes/fresh-release.mjs';
import freshTransfer from './scenes/fresh-transfer.mjs';
import groupAdvantage from './scenes/group-advantage.mjs';
import groupTokenRatios from './scenes/group-token-ratios.mjs';
import intro from './scenes/intro.mjs';
import ipoTarget from './scenes/ipo-target.mjs';
import ktoDirection from './scenes/kto-direction.mjs';
import likelihoodDisplacement from './scenes/likelihood-displacement.mjs';
import loss from './scenes/loss.mjs';
import methods from './scenes/methods.mjs';
import onlineRefresh from './scenes/online-refresh.mjs';
import optimalPolicy from './scenes/optimal-policy.mjs';
import pairData from './scenes/pair-data.mjs';
import pair from './scenes/pair.mjs';
import policyContract from './scenes/policy-contract.mjs';
import ppoClipping from './scenes/ppo-clipping.mjs';
import probability from './scenes/probability.mjs';
import proxyControls from './scenes/proxy-controls.mjs';
import reductionConvention from './scenes/reduction-convention.mjs';
import referenceCache from './scenes/reference-cache.mjs';
import referenceFreeLosses from './scenes/reference-free-losses.mjs';
import reference from './scenes/reference.mjs';
import releaseInterval from './scenes/release-interval.mjs';
import rewardCancellation from './scenes/reward-cancellation.mjs';
import roleOwnership from './scenes/role-ownership.mjs';
import stateBudget from './scenes/state-budget.mjs';
import summedTokenScores from './scenes/summed-token-scores.mjs';
import tokenReturn from './scenes/token-return.mjs';
import trainingContract from './scenes/training-contract.mjs';
import truncationAudit from './scenes/truncation-audit.mjs';
import unseenProbability from './scenes/unseen-probability.mjs';
import update from './scenes/update.mjs';

export default cinematicLesson({
  id: 'preference-alignment',
  accent: COSMOS.gold,
  invariants: verifyPreferenceAlignmentInvariants,
  scenes: {
    intro,
    pair,
    'policy-contract': policyContract,
    'bt-judge': btJudge,
    methods,
    'role-ownership': roleOwnership,
    'token-return': tokenReturn,
    'ppo-clipping': ppoClipping,
    'state-budget': stateBudget,
    'optimal-policy': optimalPolicy,
    'reward-cancellation': rewardCancellation,
    reference,
    probability,
    loss,
    update,
    'summed-token-scores': summedTokenScores,
    'reduction-convention': reductionConvention,
    'beta-double-role': betaDoubleRole,
    'likelihood-displacement': likelihoodDisplacement,
    'unseen-probability': unseenProbability,
    'reference-cache': referenceCache,
    'truncation-audit': truncationAudit,
    'training-contract': trainingContract,
    'pair-data': pairData,
    evaluation,
    'proxy-controls': proxyControls,
    'release-interval': releaseInterval,
    'online-refresh': onlineRefresh,
    'ipo-target': ipoTarget,
    'kto-direction': ktoDirection,
    'reference-free-losses': referenceFreeLosses,
    'group-advantage': groupAdvantage,
    'group-token-ratios': groupTokenRatios,
    'ai-feedback': aiFeedback,
    'fresh-transfer': freshTransfer,
    'fresh-release': freshRelease,
  },
});
