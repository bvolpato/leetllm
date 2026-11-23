import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import intro from './stages/intro.mjs';
import target from './stages/target.mjs';
import forecastContract from './stages/forecast-contract.mjs';
import costQuantile from './stages/cost-quantile.mjs';
import origins from './stages/origins.mjs';
import baseline from './stages/baseline.mjs';
import fitConstruction from './stages/fit-construction.mjs';
import issued from './stages/issued.mjs';
import ledgerContract from './stages/ledger-contract.mjs';
import metricsStage from './stages/metrics.mjs';
import evaluationContract from './stages/evaluation-contract.mjs';
import signals from './stages/signals.mjs';
import synthesis from './stages/synthesis.mjs';
import receiptContract from './stages/receipt-contract.mjs';
import monitoringContract from './stages/monitoring-contract.mjs';
import failureConstruction from './stages/failure-construction.mjs';
import earnedForecastTransfer from './stages/earned-forecast-transfer.mjs';
export {
  FIT_ROWS,
  forecastWeights,
  fridayFeatures,
  transferActuals,
  transferCapacities,
  transferForecasts,
} from './fixtures.mjs';
export {
  capacityBreakdown,
  capacityCurve,
  capacityLoss,
  featureProducts,
  forecastChapterState,
  forecastComparison,
  lateLabelMetrics,
  metrics,
  peakDiagnostic,
  quantileCost,
  rowDigest,
  sampleModel,
  signalCounts,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-demand-forecasting-alerts',
  validateModel,
  scenes: [
    intro,
    target,
    forecastContract,
    costQuantile,
    origins,
    baseline,
    fitConstruction,
    issued,
    ledgerContract,
    metricsStage,
    evaluationContract,
    signals,
    synthesis,
    receiptContract,
    monitoringContract,
    failureConstruction,
    earnedForecastTransfer,
  ],
});
export const draw = definition.draw;
export default definition;
