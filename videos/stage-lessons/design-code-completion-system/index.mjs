import { cinematicLesson, COSMOS, glowDot, guardedDynamic } from '../cinematic-kit.mjs';
import { clampDur, verifyCodeCompletionInvariants } from './parts.mjs';

import intro from './scenes/intro.mjs';
import lanes from './scenes/lanes.mjs';
import routePolicy from './scenes/route-policy.mjs';
import scopeRecovery from './scenes/scope-recovery.mjs';
import positionUnits from './scenes/position-units.mjs';
import fim from './scenes/fim.mjs';
import fimTraining from './scenes/fim-training.mjs';
import infillBoundaries from './scenes/infill-boundaries.mjs';
import context from './scenes/context.mjs';
import contextRanking from './scenes/context-ranking.mjs';
import freshness from './scenes/freshness.mjs';
import debounceHistory from './scenes/debounce-history.mjs';
import acceptanceRace from './scenes/acceptance-race.mjs';
import timing from './scenes/timing.mjs';
import traceQuantiles from './scenes/trace-quantiles.mjs';
import requestPopulation from './scenes/request-population.mjs';
import cache from './scenes/cache.mjs';
import cacheKey from './scenes/cache-key.mjs';
import cacheOrder from './scenes/cache-order.mjs';
import speculativePath from './scenes/speculative-path.mjs';
import speculationGate from './scenes/speculation-gate.mjs';
import quantizedServing from './scenes/quantized-serving.mjs';
import { buildValue } from './scenes/value.mjs';
import { buildMetricDenominators } from './scenes/metric-denominators.mjs';
import { buildEvaluationRelease } from './scenes/evaluation-release.mjs';
import { buildFleetWork } from './scenes/fleet-work.mjs';
import { buildCohortWork } from './scenes/cohort-work.mjs';
import { buildAffinityWait } from './scenes/affinity-wait.mjs';
import { buildBatchCost } from './scenes/batch-cost.mjs';
import { buildUploadBoundary } from './scenes/upload-boundary.mjs';
import { buildPrivateDeployment } from './scenes/private-deployment.mjs';
import { buildPublicMatches } from './scenes/public-matches.mjs';
import { buildDiagnosticRepair } from './scenes/diagnostic-repair.mjs';
import { buildSynthesis } from './scenes/synthesis.mjs';
import { buildFreshCursor } from './scenes/fresh-cursor.mjs';

function withCadence(sceneFn, extraCues = []) {
  if (!extraCues.length) return sceneFn;
  return (s, c) => {
    sceneFn(s, c);
    const beat = s.value(0);
    s.add(
      guardedDynamic(
        () => 1,
        () => {
          const b = beat.value;
          const pulse = 0.28 + 0.42 * Math.abs(Math.sin(b * Math.PI));
          return glowDot(830, 468, {
            radius: 4.5 + 1.5 * (pulse - 0.28),
            color: COSMOS.cyan,
            glow: 7,
            opacity: pulse,
          });
        },
      ),
    );
    extraCues.forEach((id, idx) => {
      c.on(id, () => {
        s.play(beat.to(idx + 1, { duration: clampDur(c, c.cue(id).start, 0.35) }));
      });
    });
  };
}

export default cinematicLesson({
  id: 'design-code-completion-system',
  accent: COSMOS.cyan,
  invariants: verifyCodeCompletionInvariants,
  scenes: {
    intro: withCadence(intro, ['intro-return']),
    lanes: withCadence(lanes, ['lanes-members', 'lanes-local']),
    'route-policy': withCadence(routePolicy, ['cc-route-policy-0', 'cc-route-policy-1']),
    'scope-recovery': withCadence(scopeRecovery, ['cc-scope-recovery-0', 'cc-scope-recovery-1']),
    'position-units': withCadence(positionUnits, [
      'cc-position-units-0',
      'cc-position-wrong-suffix',
    ]),
    fim: withCadence(fim, ['fim-beat-1-focus-1']),
    'fim-training': withCadence(fimTraining, [
      'cc-fim-training-0',
      'cc-fim-training-1',
      'cc-fim-psm',
    ]),
    'infill-boundaries': withCadence(infillBoundaries, ['cc-infill-boundaries-0']),
    context: withCadence(context, [
      'context-preserve-edit-boundaries',
      'context-nearby-code',
      'context-retain-suffix',
    ]),
    'context-ranking': withCadence(contextRanking, [
      'cc-context-ranking-0',
      'cc-context-ranking-1',
      'cc-jaccard-quarter',
    ]),
    freshness: withCadence(freshness, ['fresh-pair', 'fresh-range', 'fresh-drop']),
    'debounce-history': withCadence(debounceHistory, [
      'deb-first',
      'deb-next',
      'deb-dot',
      'deb-paint',
      'deb-again',
      'deb-policy',
      'deb-summary',
    ]),
    'acceptance-race': withCadence(acceptanceRace, ['tab-apply', 'tab-type']),
    timing: withCadence(timing, ['timing-beat-1-focus-1', 'timing-beat-1-focus-2']),
    'trace-quantiles': withCadence(traceQuantiles, [
      'cc-trace-quantiles-0',
      'cc-total183',
      'cc-total333',
      'cc-trace-quantiles-1',
    ]),
    'request-population': withCadence(requestPopulation, ['cc-request-population-0']),
    cache: withCadence(cache, [
      'cache-beat-1-focus-1',
      'cache-beat-1-focus-2',
      'cache-beat-2-focus-2',
    ]),
    'cache-key': withCadence(cacheKey, [
      'cc-cache-key-0',
      'cc-cache-key-1',
      'cc-salt-authority',
      'cc-cache-key-2',
    ]),
    'cache-order': withCadence(cacheOrder, [
      'cc-cache-order-0',
      'cc-cache96-35',
      'cc-cache-order-1',
    ]),
    'speculative-path': withCadence(speculativePath, [
      'spec-draft',
      'spec-four',
      'spec-replace',
      'spec-two',
      'spec-one',
      'spec-six',
      'spec-rate',
      'spec-ask',
      'spec-missing',
      'spec-residual',
      'spec-cost',
    ]),
    'speculation-gate': withCadence(speculationGate, [
      'cc-speculation-gate-0',
      'cc-speculation-gate-1',
    ]),
    'quantized-serving': withCadence(quantizedServing, ['cc-quantized-serving-0']),
    value: buildValue,
    'metric-denominators': withCadence(buildMetricDenominators, [
      'cc-metric-denominators-0',
      'cc-metric-denominators-1',
    ]),
    'evaluation-release': withCadence(buildEvaluationRelease, ['cc-evaluation-release-0']),
    'fleet-work': withCadence(buildFleetWork, [
      'cc-fleet-work-0',
      'cc-fleet-work-1',
      'cc-fleet-work-2',
    ]),
    'cohort-work': withCadence(buildCohortWork, ['cohort-long-hits']),
    'affinity-wait': buildAffinityWait,
    'batch-cost': buildBatchCost,
    'upload-boundary': withCadence(buildUploadBoundary, [
      'cc-upload-boundary-0',
      'cc-existing-placeholder',
      'cc-upload-boundary-1',
      'cc-upload-boundary-2',
    ]),
    'private-deployment': withCadence(buildPrivateDeployment, ['cc-private-deployment-0']),
    'public-matches': withCadence(buildPublicMatches, ['cc-public-matches-0']),
    'diagnostic-repair': withCadence(buildDiagnosticRepair, ['cc-diagnostic-repair-0']),
    synthesis: buildSynthesis,
    'fresh-cursor': buildFreshCursor,
  },
});
