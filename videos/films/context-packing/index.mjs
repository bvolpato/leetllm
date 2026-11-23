import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import budget from './stages/budget.mjs';
import completeTurns from './stages/complete-turns.mjs';
import overflow from './stages/overflow.mjs';
import compaction from './stages/compaction.mjs';
import costLength from './stages/cost-length.mjs';
import cacheShape from './stages/cache-shape.mjs';
import mixedLayers from './stages/mixed-layers.mjs';
import localVisibility from './stages/local-visibility.mjs';
import positionDials from './stages/position-dials.mjs';
import basisConsistency from './stages/basis-consistency.mjs';
import cacheExecution from './stages/cache-execution.mjs';
import distributedContext from './stages/distributed-context.mjs';
import placement from './stages/placement.mjs';
import exactCounts from './stages/exact-counts.mjs';
import evidenceRoute from './stages/evidence-route.mjs';
import releaseSlices from './stages/release-slices.mjs';
import synthesis from './stages/synthesis.mjs';
import yourTurn from './stages/your-turn.mjs';
export { cachePayload, fullPairs, localPairs } from './arithmetic.mjs';
export {
  longContextModel,
  prefixReuseState,
  releaseSliceBars,
  sampleModel,
} from './construction.mjs';
export { records } from './fixtures.mjs';
export { aggregate, pack, placeNeedle, verifyNote } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'context-packing',
  validateModel,
  scenes: [
    intro,
    budget,
    completeTurns,
    overflow,
    compaction,
    costLength,
    cacheShape,
    mixedLayers,
    localVisibility,
    positionDials,
    basisConsistency,
    cacheExecution,
    distributedContext,
    placement,
    exactCounts,
    evidenceRoute,
    releaseSlices,
    synthesis,
    yourTurn,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
