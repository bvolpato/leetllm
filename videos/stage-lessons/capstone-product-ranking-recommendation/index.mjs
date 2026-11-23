import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import funnelContract from './scenes/funnel-contract.mjs';
import eligibility from './scenes/eligibility.mjs';
import slateRecheck from './scenes/slate-recheck.mjs';
import ordering from './scenes/ordering.mjs';
import metricContracts from './scenes/metric-contracts.mjs';
import recall from './scenes/recall.mjs';
import offlineGates from './scenes/offline-gates.mjs';
import pairwise from './scenes/pairwise.mjs';
import pairwiseObjective from './scenes/pairwise-objective.mjs';
import trainingMatrix from './scenes/training-matrix.mjs';
import time from './scenes/time.mjs';
import temporalProtocol from './scenes/temporal-protocol.mjs';
import trainedModel from './scenes/trained-model.mjs';
import exposure from './scenes/exposure.mjs';
import clickModel from './scenes/click-model.mjs';
import propensityContract from './scenes/propensity-contract.mjs';
import synthesis from './scenes/synthesis.mjs';
import responseLineage from './scenes/response-lineage.mjs';
import outcomeJoin from './scenes/outcome-join.mjs';
import experimentContract from './scenes/experiment-contract.mjs';
import probabilityValue from './scenes/probability-value.mjs';
import onlineGuardrails from './scenes/online-guardrails.mjs';
import receiptBoundary from './scenes/receipt-boundary.mjs';
import freshRanking from './scenes/fresh-ranking.mjs';

export default narratedLesson({
  id: 'capstone-product-ranking-recommendation',
  scenes: {
    intro,
    eligibility,
    'funnel-contract': funnelContract,
    'slate-recheck': slateRecheck,
    ordering,
    'metric-contracts': metricContracts,
    recall,
    'offline-gates': offlineGates,
    pairwise,
    'pairwise-objective': pairwiseObjective,
    'training-matrix': trainingMatrix,
    time,
    'temporal-protocol': temporalProtocol,
    'trained-model': trainedModel,
    exposure,
    'click-model': clickModel,
    'propensity-contract': propensityContract,
    synthesis,
    'response-lineage': responseLineage,
    'outcome-join': outcomeJoin,
    'experiment-contract': experimentContract,
    'probability-value': probabilityValue,
    'online-guardrails': onlineGuardrails,
    'receipt-boundary': receiptBoundary,
    'fresh-ranking': freshRanking,
  },
});
