// Full-bleed dark-cinema 28-scene Context Engineering stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyContextInvariants } from './parts.mjs';
import assignedLedger from './scenes/assigned-ledger.mjs';
import cacheCostScope from './scenes/cache-cost-scope.mjs';
import capacityAndEvidence from './scenes/capacity-and-evidence.mjs';
import completeReleaseGate from './scenes/complete-release-gate.mjs';
import compress from './scenes/compress.mjs';
import earnedContext from './scenes/earned-context.mjs';
import evaluate from './scenes/evaluate.mjs';
import failureInterventions from './scenes/failure-interventions.mjs';
import intro from './scenes/intro.mjs';
import isolate from './scenes/isolate.mjs';
import packerLimits from './scenes/packer-limits.mjs';
import phaseIntersection from './scenes/phase-intersection.mjs';
import prefixOrder from './scenes/prefix-order.mjs';
import pruneCutoff from './scenes/prune-cutoff.mjs';
import receiptValidation from './scenes/receipt-validation.mjs';
import recoveryAndEvaluator from './scenes/recovery-and-evaluator.mjs';
import requiredPacker from './scenes/required-packer.mjs';
import resumeArtifacts from './scenes/resume-artifacts.mjs';
import resume from './scenes/resume.mjs';
import select from './scenes/select.mjs';
import skillRoutingAndSafety from './scenes/skill-routing-and-safety.mjs';
import skillsDisclosure from './scenes/skills-disclosure.mjs';
import strictHandoff from './scenes/strict-handoff.mjs';
import summaryAuthority from './scenes/summary-authority.mjs';
import synthesis from './scenes/synthesis.mjs';
import thrashBudget from './scenes/thrash-budget.mjs';
import verifiedNoteState from './scenes/verified-note-state.mjs';
import write from './scenes/write.mjs';

export default cinematicLesson({
  id: 'context-engineering',
  accent: COSMOS.cyan,
  invariants: verifyContextInvariants,
  scenes: {
    intro,
    'capacity-and-evidence': capacityAndEvidence,
    'failure-interventions': failureInterventions,
    write,
    'verified-note-state': verifiedNoteState,
    select,
    'phase-intersection': phaseIntersection,
    'prefix-order': prefixOrder,
    'cache-cost-scope': cacheCostScope,
    compress,
    'prune-cutoff': pruneCutoff,
    'summary-authority': summaryAuthority,
    isolate,
    'strict-handoff': strictHandoff,
    'assigned-ledger': assignedLedger,
    'required-packer': requiredPacker,
    'packer-limits': packerLimits,
    'thrash-budget': thrashBudget,
    'skills-disclosure': skillsDisclosure,
    'skill-routing-and-safety': skillRoutingAndSafety,
    resume,
    'resume-artifacts': resumeArtifacts,
    'receipt-validation': receiptValidation,
    'recovery-and-evaluator': recoveryAndEvaluator,
    evaluate,
    'complete-release-gate': completeReleaseGate,
    synthesis,
    'earned-context': earnedContext,
  },
});
