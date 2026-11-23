import { withSemanticConstructionFrame, withSemanticLegacyFrame } from './defaults.mjs';
import { paintCacheRequestOverview } from './stages/intro.mjs';
import { paintSynthesisPrefix } from './stages/synthesis.mjs';
import { paintGeometry } from './stages/geometry.mjs';
import { paintThreshold } from './stages/threshold.mjs';
import { paintGates } from './stages/gates.mjs';
import { paintAdmission } from './stages/admission.mjs';
import { paintEconomics } from './stages/economics.mjs';
import { paintEvidence } from './stages/evidence.mjs';
import { paintRequestContract } from './stages/request-contract.mjs';
import { paintExactBytes } from './stages/exact-bytes.mjs';
import { paintCurrentAuthorization } from './stages/current-authorization.mjs';
import { paintNumericGeometry } from './stages/numeric-geometry.mjs';
import { paintRetrievalScope } from './stages/retrieval-scope.mjs';
import { paintRouteOrder } from './stages/route-order.mjs';
import { paintIndexContract } from './stages/index-contract.mjs';
import { paintShadowPopulation } from './stages/shadow-population.mjs';
import { paintUnseparableException } from './stages/unseparable-exception.mjs';
import { paintHeldoutReport } from './stages/heldout-report.mjs';
import { paintDistributedCutover } from './stages/distributed-cutover.mjs';
import { paintQuarantineWrite } from './stages/quarantine-write.mjs';
import { paintBreakEven } from './stages/break-even.mjs';
import { paintLargeWindowTail } from './stages/large-window-tail.mjs';
import { paintPromotionEvidence } from './stages/promotion-evidence.mjs';
import { paintDecisionTrace } from './stages/decision-trace.mjs';
import { paintCacheTiers } from './stages/cache-tiers.mjs';
import { paintDiagnosticRepair } from './stages/diagnostic-repair.mjs';
import { paintFreshPopulation } from './stages/fresh-population.mjs';
function drawLegacySelected(ctx, scene, state, api, themeColors, c, t, s, currentBeat) {
  if (scene.id === 'synthesis' && currentBeat === 1) {
    return paintSynthesisPrefix(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  }
  if (scene.id === 'intro' || scene.id === 'synthesis') {
    return paintCacheRequestOverview(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'geometry') {
    return paintGeometry(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'threshold') {
    return paintThreshold(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'gates') {
    return paintGates(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'admission') {
    return paintAdmission(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'economics') {
    return paintEconomics(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  } else if (scene.id === 'evidence') {
    return paintEvidence(ctx, scene, state, api, themeColors, c, t, s, currentBeat);
  }
}
function drawConstructionSelected(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  if (id === 'request-contract') {
    return paintRequestContract(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'exact-bytes') {
    return paintExactBytes(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'current-authorization') {
    return paintCurrentAuthorization(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'numeric-geometry') {
    return paintNumericGeometry(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'retrieval-scope') {
    return paintRetrievalScope(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'route-order') {
    return paintRouteOrder(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'index-contract') {
    return paintIndexContract(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'shadow-population') {
    return paintShadowPopulation(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'unseparable-exception') {
    return paintUnseparableException(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'heldout-report') {
    return paintHeldoutReport(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'distributed-cutover') {
    return paintDistributedCutover(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'quarantine-write') {
    return paintQuarantineWrite(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'break-even') {
    return paintBreakEven(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'large-window-tail') {
    return paintLargeWindowTail(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'promotion-evidence') {
    return paintPromotionEvidence(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'decision-trace') {
    return paintDecisionTrace(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'cache-tiers') {
    return paintCacheTiers(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'diagnostic-repair') {
    return paintDiagnosticRepair(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else if (id === 'fresh-population') {
    return paintFreshPopulation(
      ctx,
      scene,
      state,
      api,
      themeColors,
      c,
      t,
      id,
      currentBeat,
      beatProgress,
      done,
      progress,
      op,
    );
  } else throw Error('Unknown semantic construction ' + id);
}
export function draw(ctx, scene, state, api) {
  if (withSemanticConstructionFrame(ctx, scene, state, api, drawConstructionSelected)) return;
  return withSemanticLegacyFrame(ctx, scene, state, api, drawLegacySelected);
}
