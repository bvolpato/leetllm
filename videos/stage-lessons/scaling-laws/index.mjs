// Full-bleed dark-cinema 26-scene Scaling Laws & Compute-Optimal Training stage lesson.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyScalingLawsModel } from './parts.mjs';
import intro from './scenes/intro.mjs';
import budget from './scenes/budget.mjs';
import countingContract from './scenes/counting-contract.mjs';
import controlledRuns from './scenes/controlled-runs.mjs';
import historicalFrontiers from './scenes/historical-frontiers.mjs';
import lossScene from './scenes/loss.mjs';
import tradeoff from './scenes/tradeoff.mjs';
import optimumScene from './scenes/optimum.mjs';
import generalAllocation from './scenes/general-allocation.mjs';
import growth from './scenes/growth.mjs';
import studyDiscrepancy from './scenes/study-discrepancy.mjs';
import frontierEvidence from './scenes/frontier-evidence.mjs';
import fitting from './scenes/fitting.mjs';
import widthTransfer from './scenes/width-transfer.mjs';
import fittedSurface from './scenes/fitted-surface.mjs';
import floorAmbiguity from './scenes/floor-ambiguity.mjs';
import dataCap from './scenes/data-cap.mjs';
import midScaleGate from './scenes/mid-scale-gate.mjs';
import lifetime from './scenes/lifetime.mjs';
import lifetimeEquation from './scenes/lifetime-equation.mjs';
import dataInventory from './scenes/data-inventory.mjs';
import testTimeBudget from './scenes/test-time-budget.mjs';
import capabilityMetrics from './scenes/capability-metrics.mjs';
import architectureAware from './scenes/architecture-aware.mjs';
import transfer from './scenes/transfer.mjs';
import freshAllocation from './scenes/fresh-allocation.mjs';

export default cinematicLesson({
  id: 'scaling-laws',
  accent: COSMOS.cyan,
  invariants: verifyScalingLawsModel,
  scenes: {
    intro,
    budget,
    'counting-contract': countingContract,
    'controlled-runs': controlledRuns,
    'historical-frontiers': historicalFrontiers,
    loss: lossScene,
    tradeoff,
    optimum: optimumScene,
    'general-allocation': generalAllocation,
    growth,
    'study-discrepancy': studyDiscrepancy,
    'frontier-evidence': frontierEvidence,
    fitting,
    'width-transfer': widthTransfer,
    'fitted-surface': fittedSurface,
    'floor-ambiguity': floorAmbiguity,
    'data-cap': dataCap,
    'mid-scale-gate': midScaleGate,
    lifetime,
    'lifetime-equation': lifetimeEquation,
    'data-inventory': dataInventory,
    'test-time-budget': testTimeBudget,
    'capability-metrics': capabilityMetrics,
    'architecture-aware': architectureAware,
    transfer,
    'fresh-allocation': freshAllocation,
  },
});
