// The lesson `sandbox-execution` as a narrated film. One file for each scene, in the order of lesson.yaml.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import actualWasmHost from './scenes/actual-wasm-host.mjs';
import controlsByFailure from './scenes/controls-by-failure.mjs';
import earnedParserCase from './scenes/earned-parser-case.mjs';
import evaluateTwoAxes from './scenes/evaluate-two-axes.mjs';
import evidenceLoop from './scenes/evidence-loop.mjs';
import executionBoundaries from './scenes/execution-boundaries.mjs';
import feedbackContract from './scenes/feedback-contract.mjs';
import preparedDependencies from './scenes/prepared-dependencies.mjs';
import separatedAuthority from './scenes/separated-authority.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import teardownLifecycle from './scenes/teardown-lifecycle.mjs';
import wasmBoundary from './scenes/wasm-boundary.mjs';
import wasmFailureMatrix from './scenes/wasm-failure-matrix.mjs';

export default narratedLesson({
  id: 'sandbox-execution',
  scenes: {
    'subject-intro': subjectIntro,
    'evidence-loop': evidenceLoop,
    'feedback-contract': feedbackContract,
    'separated-authority': separatedAuthority,
    'execution-boundaries': executionBoundaries,
    'controls-by-failure': controlsByFailure,
    'prepared-dependencies': preparedDependencies,
    'teardown-lifecycle': teardownLifecycle,
    'wasm-boundary': wasmBoundary,
    'actual-wasm-host': actualWasmHost,
    'wasm-failure-matrix': wasmFailureMatrix,
    'evaluate-two-axes': evaluateTwoAxes,
    'earned-parser-case': earnedParserCase,
  },
});
