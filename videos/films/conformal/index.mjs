import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import split from './stages/split.mjs';
import scores from './stages/scores.mjs';
import quantile from './stages/quantile.mjs';
import indexContract from './stages/index-contract.mjs';
import interval from './stages/interval.mjs';
import exchangeability from './stages/exchangeability.mjs';
import tiesBound from './stages/ties-bound.mjs';
import coverage from './stages/coverage.mjs';
import classifierScore from './stages/classifier-score.mjs';
import apsInversion from './stages/aps-inversion.mjs';
import apsCrossing from './stages/aps-crossing.mjs';
import subgroupMix from './stages/subgroup-mix.mjs';
import normalizedScore from './stages/normalized-score.mjs';
import shift from './stages/shift.mjs';
import crcLoss from './stages/crc-loss.mjs';
import crcThreshold from './stages/crc-threshold.mjs';
import selectedError from './stages/selected-error.mjs';
import transfer from './stages/transfer.mjs';
import freshDeadline from './stages/fresh-deadline.mjs';
export { ACTUALS } from './fixtures.mjs';
export { ALPHA } from './fixtures.mjs';
export { DISPLAY_ORDER } from './fixtures.mjs';
export { PREDICTIONS } from './fixtures.mjs';
export { RANK } from './fixtures.mjs';
export { RESIDUALS } from './fixtures.mjs';
export { ROUTER } from './fixtures.mjs';
export { SCALES } from './fixtures.mjs';
export { SORTED } from './fixtures.mjs';
export { TEST_OUTCOMES } from './fixtures.mjs';
export { TEST_PREDICTIONS } from './fixtures.mjs';
export { TEST_SCALES } from './fixtures.mjs';
export { THRESHOLD } from './fixtures.mjs';
export { calibrationScoresState } from './model.mjs';
export { classificationSet } from './model.mjs';
export { correctedThreshold } from './model.mjs';
export { cumulativeScoreConstruction } from './model.mjs';
export { exchangeabilityState } from './model.mjs';
export { freshDeadlineState } from './model.mjs';
export { intervalState } from './model.mjs';
export { normalizedCalibrationConstruction } from './model.mjs';
export { normalizedIntervalConstruction } from './model.mjs';
export { quantileSortState } from './model.mjs';
export { routerState } from './model.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'conformal',
  validateModel,
  scenes: [
    intro,
    split,
    scores,
    quantile,
    indexContract,
    interval,
    exchangeability,
    tiesBound,
    coverage,
    classifierScore,
    apsInversion,
    apsCrossing,
    subgroupMix,
    normalizedScore,
    shift,
    crcLoss,
    crcThreshold,
    selectedError,
    transfer,
    freshDeadline,
  ],
});
export const draw = definition.draw;
export default definition;
