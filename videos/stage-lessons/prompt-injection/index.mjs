// Cinematic Vizmatic 0.10.0 stage film for Prompt Injection & Runtime Guardrails (28 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPromptInjectionInvariants } from './parts.mjs';
import approvalBindings from './scenes/approval-bindings.mjs';
import attackEvaluation from './scenes/attack-evaluation.mjs';
import cachePrincipal from './scenes/cache-principal.mjs';
import canaryBuffer from './scenes/canary-buffer.mjs';
import detectorScope from './scenes/detector-scope.mjs';
import effectDenominators from './scenes/effect-denominators.mjs';
import entryAndObjective from './scenes/entry-and-objective.mjs';
import freshAuthority from './scenes/fresh-authority.mjs';
import hostPolicy from './scenes/host-policy.mjs';
import layeredSignals from './scenes/layered-signals.mjs';
import outboundContract from './scenes/outbound-contract.mjs';
import poisonedMemory from './scenes/poisoned-memory.mjs';
import promptVsCapability from './scenes/prompt-vs-capability.mjs';
import protectedSinks from './scenes/protected-sinks.mjs';
import readerQuarantine from './scenes/reader-quarantine.mjs';
import reserveAndReconcile from './scenes/reserve-and-reconcile.mjs';
import reviewAndRetention from './scenes/review-and-retention.mjs';
import schemaFalsehood from './scenes/schema-falsehood.mjs';
import selectorFeedback from './scenes/selector-feedback.mjs';
import separateHarms from './scenes/separate-harms.mjs';
import strictProposal from './scenes/strict-proposal.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import supportAndUtility from './scenes/support-and-utility.mjs';
import transfer from './scenes/transfer.mjs';
import trustLabels from './scenes/trust-labels.mjs';
import typedEvidence from './scenes/typed-evidence.mjs';
import uncertaintyGate from './scenes/uncertainty-gate.mjs';
import wrapperCharacters from './scenes/wrapper-characters.mjs';

export default cinematicLesson({
  id: 'prompt-injection',
  accent: COSMOS.rose,
  invariants: verifyPromptInjectionInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'entry-and-objective': entryAndObjective,
    'separate-harms': separateHarms,
    'trust-labels': trustLabels,
    'wrapper-characters': wrapperCharacters,
    'prompt-vs-capability': promptVsCapability,
    'reader-quarantine': readerQuarantine,
    'typed-evidence': typedEvidence,
    'schema-falsehood': schemaFalsehood,
    'selector-feedback': selectorFeedback,
    'strict-proposal': strictProposal,
    'host-policy': hostPolicy,
    'approval-bindings': approvalBindings,
    'reserve-and-reconcile': reserveAndReconcile,
    'protected-sinks': protectedSinks,
    'outbound-contract': outboundContract,
    'canary-buffer': canaryBuffer,
    'layered-signals': layeredSignals,
    'detector-scope': detectorScope,
    'attack-evaluation': attackEvaluation,
    'effect-denominators': effectDenominators,
    'uncertainty-gate': uncertaintyGate,
    'support-and-utility': supportAndUtility,
    'cache-principal': cachePrincipal,
    'poisoned-memory': poisonedMemory,
    'review-and-retention': reviewAndRetention,
    transfer,
    'fresh-authority': freshAuthority,
  },
});
