import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import budget from './scenes/budget.mjs';
import completeTurns from './scenes/complete-turns.mjs';
import overflow from './scenes/overflow.mjs';
import compaction from './scenes/compaction.mjs';
import costLength from './scenes/cost-length.mjs';
import cacheShape from './scenes/cache-shape.mjs';
import mixedLayers from './scenes/mixed-layers.mjs';
import localVisibility from './scenes/local-visibility.mjs';
import positionDials from './scenes/position-dials.mjs';
import basisConsistency from './scenes/basis-consistency.mjs';
import cacheExecution from './scenes/cache-execution.mjs';
import distributedContext from './scenes/distributed-context.mjs';
import placement from './scenes/placement.mjs';
import exactCounts from './scenes/exact-counts.mjs';
import evidenceRoute from './scenes/evidence-route.mjs';
import releaseSlices from './scenes/release-slices.mjs';
import synthesis from './scenes/synthesis.mjs';
import yourTurn from './scenes/your-turn.mjs';

export default narratedLesson({
  id: 'context-packing',
  scenes: {
    'intro': intro,
    'budget': budget,
    'complete-turns': completeTurns,
    'overflow': overflow,
    'compaction': compaction,
    'cost-length': costLength,
    'cache-shape': cacheShape,
    'mixed-layers': mixedLayers,
    'local-visibility': localVisibility,
    'position-dials': positionDials,
    'basis-consistency': basisConsistency,
    'cache-execution': cacheExecution,
    'distributed-context': distributedContext,
    'placement': placement,
    'exact-counts': exactCounts,
    'evidence-route': evidenceRoute,
    'release-slices': releaseSlices,
    'synthesis': synthesis,
    'your-turn': yourTurn,
  },
});
