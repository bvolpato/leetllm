import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import s0 from './scenes/policy-premise.mjs';
import s1 from './scenes/search-space.mjs';
import s2 from './scenes/logit-shift.mjs';
import s3 from './scenes/logit-boundaries.mjs';
import s4 from './scenes/greedy-loop.mjs';
import s5 from './scenes/opening.mjs';
import s6 from './scenes/probabilities.mjs';
import s7 from './scenes/first-beam.mjs';
import s8 from './scenes/search-lattice.mjs';
import s9 from './scenes/stopping.mjs';
import s10 from './scenes/length-score.mjs';
import s11 from './scenes/width.mjs';
import s12 from './scenes/wider-counterexample.mjs';
import s13 from './scenes/length-conventions.mjs';
import s14 from './scenes/penalty-sign.mjs';
import s15 from './scenes/temperature-scale.mjs';
import s16 from './scenes/stream-replay.mjs';
import s17 from './scenes/filter-k.mjs';
import s18 from './scenes/filter-p.mjs';
import s19 from './scenes/filter-min-p.mjs';
import s20 from './scenes/filter-boundaries.mjs';
import s21 from './scenes/filter-order.mjs';
import s22 from './scenes/grammar-bytes.mjs';
import s23 from './scenes/local-conditioning.mjs';
import s24 from './scenes/best-of-n.mjs';
import s25 from './scenes/process-evidence.mjs';
import s26 from './scenes/thought-search.mjs';
import s27 from './scenes/speculative-balance.mjs';
import s28 from './scenes/speculative-block.mjs';
import s29 from './scenes/audit-receipt.mjs';
import s30 from './scenes/synthesis.mjs';
import s31 from './scenes/fresh-policy.mjs';
export default narratedLesson({
  id: 'beam-search',
  scenes: {
    'policy-premise': s0,
    'search-space': s1,
    'logit-shift': s2,
    'logit-boundaries': s3,
    'greedy-loop': s4,
    'opening': s5,
    'probabilities': s6,
    'first-beam': s7,
    'search-lattice': s8,
    'stopping': s9,
    'length-score': s10,
    'width': s11,
    'wider-counterexample': s12,
    'length-conventions': s13,
    'penalty-sign': s14,
    'temperature-scale': s15,
    'stream-replay': s16,
    'filter-k': s17,
    'filter-p': s18,
    'filter-min-p': s19,
    'filter-boundaries': s20,
    'filter-order': s21,
    'grammar-bytes': s22,
    'local-conditioning': s23,
    'best-of-n': s24,
    'process-evidence': s25,
    'thought-search': s26,
    'speculative-balance': s27,
    'speculative-block': s28,
    'audit-receipt': s29,
    'synthesis': s30,
    'fresh-policy': s31,
  },
});
