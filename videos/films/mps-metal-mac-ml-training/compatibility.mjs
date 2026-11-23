import { mpsExtensionIds } from './fixtures.mjs';
import { withMpsAdvancedFrame, withMpsExtensionFrame, withMpsRootFrame } from './defaults.mjs';
import { paintOpening } from './stages/opening.mjs';
import { paintBackend } from './stages/backend.mjs';
import { paintSharedPool } from './stages/shared-pool.mjs';
import { paintAssignment } from './stages/assignment.mjs';
import { paintPooling } from './stages/pooling.mjs';
import { paintScore } from './stages/score.mjs';
import { paintProbabilities } from './stages/probabilities.mjs';
import { paintBatchUpdate } from './stages/batch-update.mjs';
import { paintFallback } from './stages/fallback.mjs';
import { paintPrecision } from './stages/precision.mjs';
import { paintTiming } from './stages/timing.mjs';
import { paintMemoryBudget } from './stages/memory-budget.mjs';
import { paintReturnTicket } from './stages/return-ticket.mjs';
import { paintAutocast } from './stages/autocast.mjs';
import { paintProfiling } from './stages/profiling.mjs';
import { paintCrossover } from './stages/crossover.mjs';
import { paintAllocator } from './stages/allocator.mjs';
import { paintReleasePrerequisites } from './stages/release-prerequisites.mjs';
import { paintDeviceIdentity } from './stages/device-identity.mjs';
import { paintShapeAndStep } from './stages/shape-and-step.mjs';
import { paintFallbackAccounting } from './stages/fallback-accounting.mjs';
import { paintDtypeAllocation } from './stages/dtype-allocation.mjs';
import { paintMeasurementReceipt } from './stages/measurement-receipt.mjs';
import { paintAllocatorLimits } from './stages/allocator-limits.mjs';
import { paintFreshTicket } from './stages/fresh-ticket.mjs';
function selectMpsLegacy(ctx, scene, state, api, C, c, t, s) {
  if (mpsExtensionIds.has(scene.id))
    return withMpsExtensionFrame(ctx, scene, state, api, C, c, s, selectMpsExtension);
  if (['autocast', 'profiling', 'crossover', 'allocator'].includes(scene.id))
    return withMpsAdvancedFrame(ctx, scene, state, api, C, c, s, selectMpsAdvanced);
  if (scene.id === 'opening') {
    return paintOpening(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'backend') {
    return paintBackend(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'shared-pool') {
    return paintSharedPool(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'assignment') {
    return paintAssignment(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'pooling') {
    return paintPooling(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'score') {
    return paintScore(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'probabilities') {
    return paintProbabilities(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'batch-update') {
    return paintBatchUpdate(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'fallback') {
    return paintFallback(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'precision') {
    return paintPrecision(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'timing') {
    return paintTiming(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'memory-budget') {
    return paintMemoryBudget(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'return-ticket') {
    return paintReturnTicket(ctx, scene, state, api, C, c, t, s);
  }
}
function selectMpsAdvanced(ctx, scene, state, api, C, c, t, s) {
  if (scene.id === 'autocast') {
    return paintAutocast(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'profiling') {
    return paintProfiling(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'crossover') {
    return paintCrossover(ctx, scene, state, api, C, c, t, s);
  } else if (scene.id === 'allocator') {
    return paintAllocator(ctx, scene, state, api, C, c, t, s);
  }
}
function selectMpsExtension(ctx, scene, state, api, C, c, t, s, id) {
  if (id === 'release-prerequisites') {
    return paintReleasePrerequisites(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'device-identity') {
    return paintDeviceIdentity(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'shape-and-step') {
    return paintShapeAndStep(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'fallback-accounting') {
    return paintFallbackAccounting(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'dtype-allocation') {
    return paintDtypeAllocation(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'measurement-receipt') {
    return paintMeasurementReceipt(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'allocator-limits') {
    return paintAllocatorLimits(ctx, scene, state, api, C, c, t, s, id);
  } else if (id === 'fresh-ticket') {
    return paintFreshTicket(ctx, scene, state, api, C, c, t, s, id);
  }
}
export function draw(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectMpsLegacy);
}
