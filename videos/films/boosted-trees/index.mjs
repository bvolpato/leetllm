import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import clock from './stages/clock.mjs';
import eligibleSignals from './stages/eligible-signals.mjs';
import residual from './stages/residual.mjs';
import classification from './stages/classification.mjs';
import curvatureSplit from './stages/curvature-split.mjs';
import histogramScan from './stages/histogram-scan.mjs';
import engineGrowth from './stages/engine-growth.mjs';
import samplingCategorical from './stages/sampling-categorical.mjs';
import baseline from './stages/baseline.mjs';
import costPolicy from './stages/cost-policy.mjs';
import rounds from './stages/rounds.mjs';
import selectionContract from './stages/selection-contract.mjs';
import threshold from './stages/threshold.mjs';
import thresholdBoundary from './stages/threshold-boundary.mjs';
import holdout from './stages/holdout.mjs';
import release from './stages/release.mjs';
import sliceBoundaries from './stages/slice-boundaries.mjs';
import attributionGame from './stages/attribution-game.mjs';
import servingWork from './stages/serving-work.mjs';
import receiptState from './stages/receipt-state.mjs';
import earnedSplitTransfer from './stages/earned-split-transfer.mjs';
export {
  MSE,
  expectedCost,
  policyCost,
  sigmoid,
  sliceResult,
  splitConstruction,
  twoFeatureCredits,
} from './arithmetic.mjs';
export {
  boostCue,
  establishedProgress,
  freshSplitState,
  roundSnapshot,
  thresholdSnapshot,
} from './construction.mjs';
export {
  APRIL_SCORED_ROWS,
  APRIL_TREE_TRACE,
  CLASS_FIXTURE,
  COSTS,
  DELAY_FIXTURE,
  HISTOGRAM_LABELS,
  MAY_EVIDENCE,
  MAY_POLICY,
  MONTHS,
  ROUND_POINTS,
  STAGE_SERIES,
} from './fixtures.mjs';
export {
  APRIL_BOUNDARIES,
  APRIL_POLICY,
  BASELINE_DECISIONS,
  CLASS_ROWS,
  LEAF_CORRECTIONS,
  RESIDUALS,
  UPDATED_DELAY,
  classificationTreeStep,
  evaluateAprilThreshold,
  searchAprilThresholds,
} from './model.mjs';
export { validateModel, validateSplitConstruction } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'boosted-trees',
  validateModel,
  scenes: [
    opening,
    clock,
    eligibleSignals,
    residual,
    classification,
    curvatureSplit,
    histogramScan,
    earnedSplitTransfer,
    engineGrowth,
    samplingCategorical,
    baseline,
    costPolicy,
    rounds,
    selectionContract,
    threshold,
    thresholdBoundary,
    holdout,
    release,
    sliceBoundaries,
    attributionGame,
    servingWork,
    receiptState,
  ],
});
export const draw = definition.draw;
export default definition;
