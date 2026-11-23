import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import jobAdmission from './stages/job-admission.mjs';
import bandwidth from './stages/bandwidth.mjs';
import residentMemory from './stages/resident-memory.mjs';
import grounding from './stages/grounding.mjs';
import alignmentData from './stages/alignment-data.mjs';
import training from './stages/training.mjs';
import distillObjective from './stages/distill-objective.mjs';
import gradientScaling from './stages/gradient-scaling.mjs';
import modeObjectives from './stages/mode-objectives.mjs';
import exportQuality from './stages/export-quality.mjs';
import smallArchitecture from './stages/small-architecture.mjs';
import kvGeometry from './stages/kv-geometry.mjs';
import datedModels from './stages/dated-models.mjs';
import runtimeBundles from './stages/runtime-bundles.mjs';
import exportRuntime from './stages/export-runtime.mjs';
import cpuExport from './stages/cpu-export.mjs';
import thermal from './stages/thermal.mjs';
import thermalTelemetry from './stages/thermal-telemetry.mjs';
import energy from './stages/energy.mjs';
import privacy from './stages/privacy.mjs';
import hybridScores from './stages/hybrid-scores.mjs';
import trustedRoute from './stages/trusted-route.mjs';
import updates from './stages/updates.mjs';
import updateFreshness from './stages/update-freshness.mjs';
import diagnosticEvidence from './stages/diagnostic-evidence.mjs';
import freshDevice from './stages/fresh-device.mjs';
export {
  edgeDevice,
  edgeGradients,
  edgeLoss,
  edgeNumeric,
  edgeRoute,
  edgeSharedWeight,
  energyCandidate,
  integrateEnergy,
} from './arithmetic.mjs';
export { edgeCue } from './construction.mjs';
export {
  checkBundle,
  edgeState,
  executeGraph,
  policyDecision,
  sampleModel,
  train,
  verifyAnswer,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'edge-specialization',
  validateModel,
  scenes: [
    intro,
    grounding,
    jobAdmission,
    bandwidth,
    residentMemory,
    alignmentData,
    training,
    distillObjective,
    gradientScaling,
    modeObjectives,
    exportQuality,
    smallArchitecture,
    kvGeometry,
    datedModels,
    runtimeBundles,
    exportRuntime,
    cpuExport,
    thermal,
    thermalTelemetry,
    energy,
    privacy,
    hybridScores,
    trustedRoute,
    updates,
    updateFreshness,
    diagnosticEvidence,
    freshDevice,
  ],
});
export const draw = definition.draw;
export default definition;
