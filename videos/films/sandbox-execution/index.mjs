import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { drawSandboxScene } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import evidenceLoopStage from './stages/evidence-loop.mjs';
import feedbackContractStage from './stages/feedback-contract.mjs';
import separatedAuthorityStage from './stages/separated-authority.mjs';
import executionBoundariesStage from './stages/execution-boundaries.mjs';
import controlsByFailureStage from './stages/controls-by-failure.mjs';
import preparedDependenciesStage from './stages/prepared-dependencies.mjs';
import teardownLifecycleStage from './stages/teardown-lifecycle.mjs';
import wasmBoundaryStage from './stages/wasm-boundary.mjs';
import actualWasmHostStage from './stages/actual-wasm-host.mjs';
import wasmFailureMatrixStage from './stages/wasm-failure-matrix.mjs';
import evaluateTwoAxesStage from './stages/evaluate-two-axes.mjs';
import earnedParserCaseStage from './stages/earned-parser-case.mjs';
export { FRESH_REPORT_XML, REPORT_XML } from './fixtures.mjs';
export { addI32, memoryAccess, parseReport, passAtK } from './arithmetic.mjs';
export { CANDIDATE_PAIRS, CANDIDATE_POOL } from './construction.mjs';
export {
  authorityFlow,
  cleanupFixture,
  cleanupTransition,
  evaluationSnapshot,
  evidenceSnapshot,
  parserIdentities,
  repairSceneSnapshot,
  repairTrace,
  repairedParser,
  resourceFixture,
  runtimeAccess,
  runtimeBoundarySnapshot,
  runtimeProbe,
  validateModel,
  validateSandboxUpgrade,
  verdictAxes,
  wasmFixture,
  wasmSnapshot,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'sandbox-execution',
  validateModel,
  scenes: [
    subjectIntroStage,
    evidenceLoopStage,
    feedbackContractStage,
    separatedAuthorityStage,
    executionBoundariesStage,
    controlsByFailureStage,
    preparedDependenciesStage,
    teardownLifecycleStage,
    wasmBoundaryStage,
    actualWasmHostStage,
    wasmFailureMatrixStage,
    evaluateTwoAxesStage,
    earnedParserCaseStage,
  ],
});
export function draw(ctx, scene, state, api) {
  return api.focus.target(scene.id + '-mechanism', () => drawSandboxScene(ctx, scene, state, api));
}
export default Object.freeze({
  ...definition,
  draw,
});
