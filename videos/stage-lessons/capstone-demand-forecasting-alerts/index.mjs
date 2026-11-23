import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import target from './scenes/target.mjs';
import forecastContract from './scenes/forecast-contract.mjs';
import costQuantile from './scenes/cost-quantile.mjs';
import origins from './scenes/origins.mjs';
import baseline from './scenes/baseline.mjs';
import fitConstruction from './scenes/fit-construction.mjs';
import issued from './scenes/issued.mjs';
import ledgerContract from './scenes/ledger-contract.mjs';
import metrics from './scenes/metrics.mjs';
import evaluationContract from './scenes/evaluation-contract.mjs';
import signals from './scenes/signals.mjs';
import synthesis from './scenes/synthesis.mjs';
import receiptContract from './scenes/receipt-contract.mjs';
import monitoringContract from './scenes/monitoring-contract.mjs';
import failureConstruction from './scenes/failure-construction.mjs';
import earnedForecastTransfer from './scenes/earned-forecast-transfer.mjs';

export default narratedLesson({
  id: 'capstone-demand-forecasting-alerts',
  scenes: {
    'intro': intro,
    'target': target,
    'cost-quantile': costQuantile,
    'forecast-contract': forecastContract,
    'origins': origins,
    'baseline': baseline,
    'fit-construction': fitConstruction,
    'issued': issued,
    'ledger-contract': ledgerContract,
    'metrics': metrics,
    'evaluation-contract': evaluationContract,
    'signals': signals,
    'synthesis': synthesis,
    'receipt-contract': receiptContract,
    'monitoring-contract': monitoringContract,
    'failure-construction': failureConstruction,
    'earned-forecast-transfer': earnedForecastTransfer,
  },
});
