import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import opening from './scenes/opening.mjs';
import scan from './scenes/scan.mjs';
import ordered from './scenes/ordered-search.mjs';
import hash from './scenes/hash-lookup.mjs';
import prefix from './scenes/radix-prefix.mjs';
import append from './scenes/amortized-append.mjs';
import vector from './scenes/vector-score.mjs';
import heap from './scenes/top-k.mjs';
import pairs from './scenes/unique-pairs.mjs';
import attention from './scenes/attention.mjs';
import cache from './scenes/cache-volume.mjs';
import queue from './scenes/queue-measurement.mjs';
import budget from './scenes/work-budget.mjs';
import payoff from './scenes/shortlist-payoff.mjs';
export default narratedLesson({
  id: 'algorithm-complexity',
  scenes: {
    opening,
    scan,
    'ordered-search': ordered,
    'hash-lookup': hash,
    'radix-prefix': prefix,
    'amortized-append': append,
    'vector-score': vector,
    'top-k': heap,
    'unique-pairs': pairs,
    attention,
    'cache-volume': cache,
    'queue-measurement': queue,
    'work-budget': budget,
    'shortlist-payoff': payoff,
  },
});
