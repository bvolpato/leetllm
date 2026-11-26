// Cinematic Vizmatic 0.10.0 stage film for Evaluating AI Agents (18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyAgentEvalInvariants } from './parts.mjs';
import actionTrace from './scenes/action-trace.mjs';
import benchmarkSurfaces from './scenes/benchmark-surfaces.mjs';
import economics from './scenes/economics.mjs';
import episodeContract from './scenes/episode-contract.mjs';
import freshLibrary from './scenes/fresh-library.mjs';
import hardGates from './scenes/hard-gates.mjs';
import harnessIntegrity from './scenes/harness-integrity.mjs';
import judgeCalibration from './scenes/judge-calibration.mjs';
import metricEstimators from './scenes/metric-estimators.mjs';
import processContract from './scenes/process-contract.mjs';
import recovery from './scenes/recovery.mjs';
import releaseReport from './scenes/release-report.mjs';
import repairEvidence from './scenes/repair-evidence.mjs';
import repeatability from './scenes/repeatability.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import traceContract from './scenes/trace-contract.mjs';
import transfer from './scenes/transfer.mjs';
import uncertainty from './scenes/uncertainty.mjs';

export default cinematicLesson({
  id: 'agent-evaluation',
  accent: COSMOS.emerald,
  invariants: verifyAgentEvalInvariants,
  scenes: {
    'subject-intro': subjectIntro,
    'episode-contract': episodeContract,
    'action-trace': actionTrace,
    'hard-gates': hardGates,
    recovery,
    repeatability,
    economics,
    transfer,
    'trace-contract': traceContract,
    'process-contract': processContract,
    'metric-estimators': metricEstimators,
    uncertainty,
    'judge-calibration': judgeCalibration,
    'benchmark-surfaces': benchmarkSurfaces,
    'harness-integrity': harnessIntegrity,
    'release-report': releaseReport,
    'repair-evidence': repairEvidence,
    'fresh-library': freshLibrary,
  },
});
