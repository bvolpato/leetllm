// Cinematic Vizmatic stage lesson for Serving Benchmark Engineering (all 24 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyServingBenchmarksInvariants } from './parts.mjs';
import adapterContract from './scenes/adapter-contract.mjs';
import arrivalFamilies from './scenes/arrival-families.mjs';
import arrivalSchedule from './scenes/arrival-schedule.mjs';
import capacitySweep from './scenes/capacity-sweep.mjs';
import chunkBoundaries from './scenes/chunk-boundaries.mjs';
import confidenceSelection from './scenes/confidence-selection.mjs';
import freshReceipt from './scenes/fresh-receipt.mjs';
import generatorClock from './scenes/generator-clock.mjs';
import goodputCapacity from './scenes/goodput-capacity.mjs';
import intro from './scenes/intro.mjs';
import percentilePopulations from './scenes/percentile-populations.mjs';
import playbackDeadlines from './scenes/playback-deadlines.mjs';
import qualityProvenance from './scenes/quality-provenance.mjs';
import rateAndConcurrency from './scenes/rate-and-concurrency.mjs';
import replicaBudget from './scenes/replica-budget.mjs';
import requestDenominator from './scenes/request-denominator.mjs';
import runWindow from './scenes/run-window.mjs';
import scorerContract from './scenes/scorer-contract.mjs';
import scorerRepair from './scenes/scorer-repair.mjs';
import singleToken from './scenes/single-token.mjs';
import streamTiming from './scenes/stream-timing.mjs';
import uncertaintyAndQuality from './scenes/uncertainty-and-quality.mjs';
import workloadFreeze from './scenes/workload-freeze.mjs';
import wrap from './scenes/wrap.mjs';

export default cinematicLesson({
  id: 'serving-benchmarks',
  accent: COSMOS.cyan,
  invariants: verifyServingBenchmarksInvariants,
  scenes: {
    intro,
    'workload-freeze': workloadFreeze,
    'arrival-schedule': arrivalSchedule,
    'generator-clock': generatorClock,
    'rate-and-concurrency': rateAndConcurrency,
    'arrival-families': arrivalFamilies,
    'run-window': runWindow,
    'stream-timing': streamTiming,
    'single-token': singleToken,
    'chunk-boundaries': chunkBoundaries,
    'adapter-contract': adapterContract,
    'playback-deadlines': playbackDeadlines,
    'request-denominator': requestDenominator,
    'scorer-contract': scorerContract,
    'scorer-repair': scorerRepair,
    'goodput-capacity': goodputCapacity,
    'capacity-sweep': capacitySweep,
    'replica-budget': replicaBudget,
    'percentile-populations': percentilePopulations,
    'uncertainty-and-quality': uncertaintyAndQuality,
    'confidence-selection': confidenceSelection,
    'quality-provenance': qualityProvenance,
    wrap,
    'fresh-receipt': freshReceipt,
  },
});
