import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import lanes from './stages/lanes.mjs';
import routePolicy from './stages/route-policy.mjs';
import scopeRecovery from './stages/scope-recovery.mjs';
import positionUnits from './stages/position-units.mjs';
import fim from './stages/fim.mjs';
import fimTraining from './stages/fim-training.mjs';
import infillBoundaries from './stages/infill-boundaries.mjs';
import context from './stages/context.mjs';
import contextRanking from './stages/context-ranking.mjs';
import freshness from './stages/freshness.mjs';
import debounceHistory from './stages/debounce-history.mjs';
import acceptanceRace from './stages/acceptance-race.mjs';
import timing from './stages/timing.mjs';
import traceQuantiles from './stages/trace-quantiles.mjs';
import requestPopulation from './stages/request-population.mjs';
import cache from './stages/cache.mjs';
import cacheKey from './stages/cache-key.mjs';
import cacheOrder from './stages/cache-order.mjs';
import speculativePath from './stages/speculative-path.mjs';
import speculationGate from './stages/speculation-gate.mjs';
import quantizedServing from './stages/quantized-serving.mjs';
import value from './stages/value.mjs';
import metricDenominators from './stages/metric-denominators.mjs';
import evaluationRelease from './stages/evaluation-release.mjs';
import fleetWork from './stages/fleet-work.mjs';
import cohortWork from './stages/cohort-work.mjs';
import affinityWait from './stages/affinity-wait.mjs';
import batchCost from './stages/batch-cost.mjs';
import uploadBoundary from './stages/upload-boundary.mjs';
import privateDeployment from './stages/private-deployment.mjs';
import publicMatches from './stages/public-matches.mjs';
import diagnosticRepair from './stages/diagnostic-repair.mjs';
import synthesis from './stages/synthesis.mjs';
import freshCursor from './stages/fresh-cursor.mjs';
export {
  completeTraceQuantiles,
  correctionDistribution,
  prefillCohortWork,
} from './arithmetic.mjs';
export {
  editorEpochState,
  fimTrace,
  phases,
  sampleModel,
  suggestionPlayback,
} from './construction.mjs';
export { fresh, promptParts, route } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'design-code-completion-system',
  validateModel,
  scenes: [
    intro,
    lanes,
    routePolicy,
    scopeRecovery,
    positionUnits,
    fim,
    fimTraining,
    infillBoundaries,
    context,
    contextRanking,
    freshness,
    debounceHistory,
    acceptanceRace,
    timing,
    traceQuantiles,
    requestPopulation,
    cache,
    cacheKey,
    cacheOrder,
    speculativePath,
    speculationGate,
    quantizedServing,
    value,
    metricDenominators,
    evaluationRelease,
    fleetWork,
    cohortWork,
    affinityWait,
    batchCost,
    uploadBoundary,
    privateDeployment,
    publicMatches,
    diagnosticRepair,
    synthesis,
    freshCursor,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
  throw new Error('Missing complete code-completion scene: ' + scene.id);
}
export default Object.freeze({ ...definition, draw });
