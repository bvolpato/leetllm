// Deep Dive - SGLang: Full-bleed cinematic Vizmatic 0.10.0 stage film (33 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySglangInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import frontendProgram from './scenes/frontend-program.mjs';
import programBranches from './scenes/program-branches.mjs';
import runtimeOwners from './scenes/runtime-owners.mjs';
import tokenClocks from './scenes/token-clocks.mjs';
import mixedBudget from './scenes/mixed-budget.mjs';
import pageAdmission from './scenes/page-admission.mjs';
import radix from './scenes/radix.mjs';
import cacheNamespaces from './scenes/cache-namespaces.mjs';
import contextPosition from './scenes/context-position.mjs';
import locks from './scenes/locks.mjs';
import cacheReclamation from './scenes/cache-reclamation.mjs';
import replicaLocality from './scenes/replica-locality.mjs';
import overlap from './scenes/overlap.mjs';
import metadataReady from './scenes/metadata-ready.mjs';
import grammar from './scenes/grammar.mjs';
import constraintContract from './scenes/constraint-contract.mjs';
import compressedGrammar from './scenes/compressed-grammar.mjs';
import speculate from './scenes/speculate.mjs';
import speculativeEconomics from './scenes/speculative-economics.mjs';
import methodRegistry from './scenes/method-registry.mjs';
import parallelAxes from './scenes/parallel-axes.mjs';
import disaggregate from './scenes/disaggregate.mjs';
import payloadBuild from './scenes/payload-build.mjs';
import reservationPolicy from './scenes/reservation-policy.mjs';
import transferFailure from './scenes/transfer-failure.mjs';
import serviceReplay from './scenes/service-replay.mjs';
import servingReceipt from './scenes/serving-receipt.mjs';
import goodputGate from './scenes/goodput-gate.mjs';
import failureDrill from './scenes/failure-drill.mjs';
import projectSource from './scenes/project-source.mjs';
import synthesis from './scenes/synthesis.mjs';
import freshHandoff from './scenes/fresh-handoff.mjs';

export default cinematicLesson({
  id: 'deep-dive-sglang',
  accent: COSMOS.cyan,
  invariants: verifySglangInvariants,
  scenes: {
    intro,
    'frontend-program': frontendProgram,
    'program-branches': programBranches,
    'runtime-owners': runtimeOwners,
    'token-clocks': tokenClocks,
    'mixed-budget': mixedBudget,
    'page-admission': pageAdmission,
    radix,
    'cache-namespaces': cacheNamespaces,
    'context-position': contextPosition,
    locks,
    'cache-reclamation': cacheReclamation,
    'replica-locality': replicaLocality,
    overlap,
    'metadata-ready': metadataReady,
    grammar,
    'constraint-contract': constraintContract,
    'compressed-grammar': compressedGrammar,
    speculate,
    'speculative-economics': speculativeEconomics,
    'method-registry': methodRegistry,
    'parallel-axes': parallelAxes,
    disaggregate,
    'payload-build': payloadBuild,
    'reservation-policy': reservationPolicy,
    'transfer-failure': transferFailure,
    'service-replay': serviceReplay,
    'serving-receipt': servingReceipt,
    'goodput-gate': goodputGate,
    'failure-drill': failureDrill,
    'project-source': projectSource,
    synthesis,
    'fresh-handoff': freshHandoff,
  },
});
