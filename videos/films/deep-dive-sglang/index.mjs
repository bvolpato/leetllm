import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import frontendProgram from './stages/frontend-program.mjs';
import programBranches from './stages/program-branches.mjs';
import runtimeOwners from './stages/runtime-owners.mjs';
import tokenClocks from './stages/token-clocks.mjs';
import mixedBudget from './stages/mixed-budget.mjs';
import pageAdmission from './stages/page-admission.mjs';
import radix from './stages/radix.mjs';
import cacheNamespaces from './stages/cache-namespaces.mjs';
import contextPosition from './stages/context-position.mjs';
import locks from './stages/locks.mjs';
import cacheReclamation from './stages/cache-reclamation.mjs';
import replicaLocality from './stages/replica-locality.mjs';
import overlap from './stages/overlap.mjs';
import metadataReady from './stages/metadata-ready.mjs';
import grammar from './stages/grammar.mjs';
import constraintContract from './stages/constraint-contract.mjs';
import compressedGrammar from './stages/compressed-grammar.mjs';
import speculate from './stages/speculate.mjs';
import speculativeEconomics from './stages/speculative-economics.mjs';
import methodRegistry from './stages/method-registry.mjs';
import parallelAxes from './stages/parallel-axes.mjs';
import disaggregate from './stages/disaggregate.mjs';
import payloadBuild from './stages/payload-build.mjs';
import reservationPolicy from './stages/reservation-policy.mjs';
import transferFailure from './stages/transfer-failure.mjs';
import serviceReplay from './stages/service-replay.mjs';
import servingReceipt from './stages/serving-receipt.mjs';
import goodputGate from './stages/goodput-gate.mjs';
import failureDrill from './stages/failure-drill.mjs';
import projectSource from './stages/project-source.mjs';
import synthesis from './stages/synthesis.mjs';
import freshHandoffStage from './stages/fresh-handoff.mjs';
export { common } from './arithmetic.mjs';
export {
  budgetStep,
  freshHandoff,
  grammarState,
  handoffState,
  insert,
  kvHandoff,
  prefixReuse,
  reclamationState,
  sampleModel,
  speculativeCostState,
  speculativeState,
  treePaths,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-sglang',
  validateModel,
  scenes: [
    intro,
    frontendProgram,
    programBranches,
    runtimeOwners,
    tokenClocks,
    mixedBudget,
    pageAdmission,
    radix,
    cacheNamespaces,
    contextPosition,
    locks,
    cacheReclamation,
    replicaLocality,
    overlap,
    metadataReady,
    grammar,
    constraintContract,
    compressedGrammar,
    speculate,
    speculativeEconomics,
    methodRegistry,
    parallelAxes,
    disaggregate,
    payloadBuild,
    reservationPolicy,
    transferFailure,
    serviceReplay,
    servingReceipt,
    goodputGate,
    failureDrill,
    projectSource,
    synthesis,
    freshHandoffStage,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
