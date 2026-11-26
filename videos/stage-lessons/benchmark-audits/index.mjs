// Full-bleed dark-cinema 25-scene Benchmark Audits stage lesson (vizmatic@0.10.0).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyBenchmarkInvariants } from './parts.mjs';
import audit from './scenes/benchmark-audit.mjs';
import candidates from './scenes/candidates.mjs';
import checker from './scenes/checker.mjs';
import code from './scenes/code-contract.mjs';
import contract from './scenes/contract.mjs';
import exposureScreen from './scenes/exposure-screen.mjs';
import exposure from './scenes/exposure.mjs';
import finite from './scenes/finite-report.mjs';
import fresh from './scenes/fresh-report.mjs';
import gates from './scenes/gates.mjs';
import gold from './scenes/gold-contract.mjs';
import intro from './scenes/intro.mjs';
import judge from './scenes/judge-controls.mjs';
import knowledge from './scenes/knowledge-contract.mjs';
import math from './scenes/math-frontier.mjs';
import paired from './scenes/paired-diagnosis.mjs';
import preference from './scenes/preference-ratings.mjs';
import ragMetrics from './scenes/rag-metrics.mjs';
import ragStage from './scenes/rag-stage.mjs';
import packageRecord from './scenes/reproducible-package.mjs';
import estimator from './scenes/sample-estimator.mjs';
import slices from './scenes/slices.mjs';
import synthesis from './scenes/synthesis.mjs';
import uncertainty from './scenes/uncertainty.mjs';
import wilson from './scenes/wilson-construction.mjs';

export default cinematicLesson({
  id: 'benchmark-audits',
  accent: COSMOS.amber,
  invariants: verifyBenchmarkInvariants,
  scenes: {
    intro,
    contract,
    'gold-contract': gold,
    checker,
    'rag-stage': ragStage,
    'rag-metrics': ragMetrics,
    'knowledge-contract': knowledge,
    'math-frontier': math,
    'code-contract': code,
    'benchmark-audit': audit,
    'preference-ratings': preference,
    slices,
    candidates,
    'sample-estimator': estimator,
    'judge-controls': judge,
    exposure,
    'exposure-screen': exposureScreen,
    uncertainty,
    'wilson-construction': wilson,
    'paired-diagnosis': paired,
    gates,
    'finite-report': finite,
    'reproducible-package': packageRecord,
    synthesis,
    'fresh-report': fresh,
  },
});
