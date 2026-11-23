import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import split from './scenes/split.mjs';
import scores from './scenes/scores.mjs';
import quantile from './scenes/quantile.mjs';
import indexContract from './scenes/index-contract.mjs';
import interval from './scenes/interval.mjs';
import exchangeability from './scenes/exchangeability.mjs';
import tiesBound from './scenes/ties-bound.mjs';
import coverage from './scenes/coverage.mjs';
import classifierScore from './scenes/classifier-score.mjs';
import apsInversion from './scenes/aps-inversion.mjs';
import apsCrossing from './scenes/aps-crossing.mjs';
import subgroupMix from './scenes/subgroup-mix.mjs';
import normalizedScore from './scenes/normalized-score.mjs';
import shift from './scenes/shift.mjs';
import crcLoss from './scenes/crc-loss.mjs';
import crcThreshold from './scenes/crc-threshold.mjs';
import selectedError from './scenes/selected-error.mjs';
import transfer from './scenes/transfer.mjs';
import freshDeadline from './scenes/fresh-deadline.mjs';

export default narratedLesson({
  id: 'conformal',
  scenes: {
    intro,
    split,
    scores,
    quantile,
    'index-contract': indexContract,
    interval,
    exchangeability,
    'ties-bound': tiesBound,
    coverage,
    'classifier-score': classifierScore,
    'aps-inversion': apsInversion,
    'aps-crossing': apsCrossing,
    'subgroup-mix': subgroupMix,
    'normalized-score': normalizedScore,
    shift,
    'crc-loss': crcLoss,
    'crc-threshold': crcThreshold,
    'selected-error': selectedError,
    transfer,
    'fresh-deadline': freshDeadline,
  },
});
