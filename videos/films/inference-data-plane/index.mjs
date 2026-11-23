import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import collectiveContracts from './stages/collective-contracts.mjs';
import kvState from './stages/kv-state.mjs';
import realPayload from './stages/real-payload.mjs';
import routeCompatible from './stages/route-compatible.mjs';
import trustedManifest from './stages/trusted-manifest.mjs';
import reserveAndTransfer from './stages/reserve-and-transfer.mjs';
import lifecycleEvents from './stages/lifecycle-events.mjs';
import uncertainTransfer from './stages/uncertain-transfer.mjs';
import retryBoundaries from './stages/retry-boundaries.mjs';
import criticalPath from './stages/critical-path.mjs';
import transfer from './stages/transfer.mjs';
export { traceWithQueue } from './arithmetic.mjs';
export { lifecycleSnapshot, payloadProduct } from './construction.mjs';
export { productionPayload } from './fixtures.mjs';
export { localityRouteSnapshot } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'inference-data-plane',
  validateModel,
  scenes: [
    subjectIntro,
    collectiveContracts,
    kvState,
    realPayload,
    routeCompatible,
    trustedManifest,
    reserveAndTransfer,
    lifecycleEvents,
    uncertainTransfer,
    retryBoundaries,
    criticalPath,
    transfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
