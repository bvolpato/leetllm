// Cinematic Vizmatic 0.10.0 stage film for LLM-as-a-Judge Evaluation (18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLlmJudgeInvariants } from './parts.mjs';
import agreement from './scenes/agreement.mjs';
import blindAndProbe from './scenes/blind-and-probe.mjs';
import controlledProbes from './scenes/controlled-probes.mjs';
import coverage from './scenes/coverage.mjs';
import evaluationFormats from './scenes/evaluation-formats.mjs';
import freshDecision from './scenes/fresh-decision.mjs';
import humanReference from './scenes/human-reference.mjs';
import orderSwap from './scenes/order-swap.mjs';
import prevalenceTrap from './scenes/prevalence-trap.mjs';
import readerModelCheck from './scenes/reader-model-check.mjs';
import rubric from './scenes/rubric.mjs';
import separateChecks from './scenes/separate-checks.mjs';
import stateHistory from './scenes/state-history.mjs';
import strictReceipt from './scenes/strict-receipt.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import swapContract from './scenes/swap-contract.mjs';
import transfer from './scenes/transfer.mjs';
import zeroErrorBound from './scenes/zero-error-bound.mjs';

export default cinematicLesson({
  id: 'llm-judge',
  accent: COSMOS.cyan,
  invariants: verifyLlmJudgeInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'separate-checks': separateChecks,
    'evaluation-formats': evaluationFormats,
    rubric,
    'strict-receipt': strictReceipt,
    'reader-model-check': readerModelCheck,
    'order-swap': orderSwap,
    'swap-contract': swapContract,
    'blind-and-probe': blindAndProbe,
    'controlled-probes': controlledProbes,
    'human-reference': humanReference,
    agreement,
    'prevalence-trap': prevalenceTrap,
    coverage,
    'state-history': stateHistory,
    'zero-error-bound': zeroErrorBound,
    transfer,
    'fresh-decision': freshDecision,
  },
});
