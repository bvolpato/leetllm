import { buildBudgetRequests } from './budget-requests.mjs';
import { buildHeadComparison } from './head-comparison.mjs';
import { buildWeightRoutes } from './weight-routes.mjs';
import { buildPrecisionBytes } from './precision-bytes.mjs';
import { buildPositionRetention } from './position-retention.mjs';
import { buildGpuShards } from './gpu-shards.mjs';
import { buildPagedAndFlash } from './paged-and-flash.mjs';

/** Packing, head count, precision, retention and sharding act on distinct costs. */
export function buildShrink(stage, narration, defaults, cacheBlock) {
  const shrink = narration.scene('shrink');
  const requests = buildBudgetRequests(stage, narration, shrink, defaults);
  const headComparison = buildHeadComparison(stage, shrink, defaults, cacheBlock, requests);
  const weightRoutes = buildWeightRoutes(stage, shrink, defaults, requests, headComparison);
  const precisionBlock = buildPrecisionBytes(
    stage,
    shrink,
    defaults,
    cacheBlock,
    headComparison,
    weightRoutes,
  );
  const positionRetention = buildPositionRetention(
    stage,
    shrink,
    defaults,
    requests,
    precisionBlock,
  );
  const gpuShards = buildGpuShards(stage, shrink, defaults, requests, positionRetention);
  buildPagedAndFlash(stage, shrink, defaults, cacheBlock, requests, gpuShards);
}
