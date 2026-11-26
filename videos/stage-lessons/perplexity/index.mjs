// Full-bleed dark-cinema 18-scene Perplexity & Model Evaluation stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPerplexityModel } from './parts.mjs';
import coveredWord from './scenes/covered-word.mjs';
import intro from './scenes/intro.mjs';
import surprise from './scenes/surprise.mjs';
import mean from './scenes/mean.mjs';
import lossScale from './scenes/loss-scale.mjs';
import objectiveBoundary from './scenes/objective-boundary.mjs';
import stableScene from './scenes/stable.mjs';
import aggregation from './scenes/aggregation.mjs';
import freshCase from './scenes/fresh-case.mjs';
import normalization from './scenes/normalization.mjs';
import windowsScene from './scenes/windows.mjs';
import shiftCount from './scenes/shift-count.mjs';
import protocol from './scenes/protocol.mjs';
import contamination from './scenes/contamination.mjs';
import report from './scenes/report.mjs';
import behavior from './scenes/behavior.mjs';
import exportJob from './scenes/export-job.mjs';
import tokenizers from './scenes/tokenizers.mjs';

export default cinematicLesson({
  id: 'perplexity',
  accent: COSMOS.cyan,
  invariants: verifyPerplexityModel,
  scenes: {
    'covered-word': coveredWord,
    intro,
    surprise,
    mean,
    'loss-scale': lossScale,
    'objective-boundary': objectiveBoundary,
    stable: stableScene,
    aggregation,
    'fresh-case': freshCase,
    normalization,
    windows: windowsScene,
    'shift-count': shiftCount,
    protocol,
    contamination,
    report,
    behavior,
    'export-job': exportJob,
    tokenizers,
  },
});
