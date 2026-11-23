import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import contract from './scenes/contract.mjs';
import gold from './scenes/gold-contract.mjs';
import checker from './scenes/checker.mjs';
import ragStage from './scenes/rag-stage.mjs';
import ragMetrics from './scenes/rag-metrics.mjs';
import knowledge from './scenes/knowledge-contract.mjs';
import math from './scenes/math-frontier.mjs';
import code from './scenes/code-contract.mjs';
import audit from './scenes/benchmark-audit.mjs';
import preference from './scenes/preference-ratings.mjs';
import slices from './scenes/slices.mjs';
import candidates from './scenes/candidates.mjs';
import estimator from './scenes/sample-estimator.mjs';
import judge from './scenes/judge-controls.mjs';
import exposure from './scenes/exposure.mjs';
import screen from './scenes/exposure-screen.mjs';
import uncertainty from './scenes/uncertainty.mjs';
import wilson from './scenes/wilson-construction.mjs';
import paired from './scenes/paired-diagnosis.mjs';
import gates from './scenes/gates.mjs';
import finite from './scenes/finite-report.mjs';
import packageRecord from './scenes/reproducible-package.mjs';
import synthesis from './scenes/synthesis.mjs';
import fresh from './scenes/fresh-report.mjs';
export default narratedLesson({
  id: 'benchmark-audits',
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
    'exposure-screen': screen,
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
