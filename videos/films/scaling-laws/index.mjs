import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import budgetStage from './stages/budget.mjs';
import countingContractStage from './stages/counting-contract.mjs';
import controlledRunsStage from './stages/controlled-runs.mjs';
import historicalFrontiersStage from './stages/historical-frontiers.mjs';
import lossStage from './stages/loss.mjs';
import tradeoffStage from './stages/tradeoff.mjs';
import optimumStage from './stages/optimum.mjs';
import generalAllocationStage from './stages/general-allocation.mjs';
import growthStage from './stages/growth.mjs';
import studyDiscrepancyStage from './stages/study-discrepancy.mjs';
import frontierEvidenceStage from './stages/frontier-evidence.mjs';
import fittingStage from './stages/fitting.mjs';
import widthTransferStage from './stages/width-transfer.mjs';
import fittedSurfaceStage from './stages/fitted-surface.mjs';
import floorAmbiguityStage from './stages/floor-ambiguity.mjs';
import dataCapStage from './stages/data-cap.mjs';
import midScaleGateStage from './stages/mid-scale-gate.mjs';
import lifetimeStage from './stages/lifetime.mjs';
import lifetimeEquationStage from './stages/lifetime-equation.mjs';
import dataInventoryStage from './stages/data-inventory.mjs';
import testTimeBudgetStage from './stages/test-time-budget.mjs';
import capabilityMetricsStage from './stages/capability-metrics.mjs';
import architectureAwareStage from './stages/architecture-aware.mjs';
import transferStage from './stages/transfer.mjs';
import freshAllocationStage from './stages/fresh-allocation.mjs';
export { allocationOptimum, anchorFit, loss, optimum, surfaceLoss } from './arithmetic.mjs';
export { scalingEvent } from './construction.mjs';
export {
  budgetAccountingState,
  budgetAllocationState,
  fitExponentGrid,
  freshAllocationState,
  growthState,
  sampleTradeoff,
  simultaneousWidthUpdate,
} from './model.mjs';
export { scalingModelChecks, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'scaling-laws',
  validateModel,
  scenes: [
    introStage,
    budgetStage,
    countingContractStage,
    controlledRunsStage,
    historicalFrontiersStage,
    lossStage,
    tradeoffStage,
    optimumStage,
    generalAllocationStage,
    growthStage,
    studyDiscrepancyStage,
    frontierEvidenceStage,
    fittingStage,
    widthTransferStage,
    fittedSurfaceStage,
    floorAmbiguityStage,
    dataCapStage,
    midScaleGateStage,
    lifetimeStage,
    lifetimeEquationStage,
    dataInventoryStage,
    testTimeBudgetStage,
    capabilityMetricsStage,
    architectureAwareStage,
    transferStage,
    freshAllocationStage,
  ],
});
export const draw = definition.draw;
export default definition;
