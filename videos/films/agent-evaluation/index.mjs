import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import episodeContract from './stages/episode-contract.mjs';
import actionTrace from './stages/action-trace.mjs';
import hardGates from './stages/hard-gates.mjs';
import recovery from './stages/recovery.mjs';
import repeatability from './stages/repeatability.mjs';
import economics from './stages/economics.mjs';
import transfer from './stages/transfer.mjs';
import traceContract from './stages/trace-contract.mjs';
import processContract from './stages/process-contract.mjs';
import metricEstimators from './stages/metric-estimators.mjs';
import uncertainty from './stages/uncertainty.mjs';
import judgeCalibration from './stages/judge-calibration.mjs';
import benchmarkSurfaces from './stages/benchmark-surfaces.mjs';
import harnessIntegrity from './stages/harness-integrity.mjs';
import releaseReport from './stages/release-report.mjs';
import repairEvidence from './stages/repair-evidence.mjs';
import freshLibrary from './stages/fresh-library.mjs';
export { choose, repeatEstimates, wilson } from './arithmetic.mjs';
export { ECONOMIC_RUNS, JUDGE_ROWS, TRIALS } from './fixtures.mjs';
export {
  candidateGate,
  economicsFrame,
  episodeSnapshot,
  readHoldSnapshot,
  recoverySnapshot,
  report,
  verifyHold,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'agent-evaluation',
  validateModel,
  scenes: [
    subjectIntro,
    episodeContract,
    actionTrace,
    hardGates,
    recovery,
    repeatability,
    economics,
    transfer,
    traceContract,
    processContract,
    metricEstimators,
    uncertainty,
    judgeCalibration,
    benchmarkSurfaces,
    harnessIntegrity,
    releaseReport,
    repairEvidence,
    freshLibrary,
  ],
});
export const draw = definition.draw;
export default definition;
