import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import twoClocks from './stages/two-clocks.mjs';
import requestGate from './stages/request-gate.mjs';
import driftDiagnostic from './stages/drift-diagnostic.mjs';
import psiDerive from './stages/psi-derive.mjs';
import driftContinuous from './stages/drift-continuous.mjs';
import driftTaxonomy from './stages/drift-taxonomy.mjs';
import parityProbe from './stages/parity-probe.mjs';
import delayedLabels from './stages/delayed-labels.mjs';
import asOfCohorts from './stages/as-of-cohorts.mjs';
import decisionQuality from './stages/decision-quality.mjs';
import calibration from './stages/calibration.mjs';
import evidenceTriage from './stages/evidence-triage.mjs';
import immutableCandidate from './stages/immutable-candidate.mjs';
import stagedRollout from './stages/staged-rollout.mjs';
import releaseGates from './stages/release-gates.mjs';
import rollbackConditions from './stages/rollback-conditions.mjs';
import wrap from './stages/wrap.mjs';
import freshMonitoring from './stages/fresh-monitoring.mjs';
export {
  driftBars,
  driftSnapshot,
  parityBars,
  releaseReadout,
  visibleParityCases,
} from './construction.mjs';
export { assignmentBuckets, jobBucket } from './fixtures.mjs';
export {
  cohortAsOf,
  confusion,
  fixedCapacityReplay,
  requestContract,
  simulateRelease,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'model-monitoring',
  validateModel,
  scenes: [
    intro,
    twoClocks,
    requestGate,
    driftDiagnostic,
    psiDerive,
    driftContinuous,
    driftTaxonomy,
    parityProbe,
    delayedLabels,
    asOfCohorts,
    decisionQuality,
    calibration,
    immutableCandidate,
    stagedRollout,
    releaseGates,
    evidenceTriage,
    rollbackConditions,
    wrap,
    freshMonitoring,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
