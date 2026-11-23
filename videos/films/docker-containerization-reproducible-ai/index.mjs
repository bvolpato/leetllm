import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import openingStage from './stages/opening.mjs';
import runtimeContractStage from './stages/runtime-contract.mjs';
import contextStage from './stages/context.mjs';
import stagesStage from './stages/stages.mjs';
import stageInheritanceStage from './stages/stage-inheritance.mjs';
import platformIdentityStage from './stages/platform-identity.mjs';
import dependencyArtifactsStage from './stages/dependency-artifacts.mjs';
import cacheStage from './stages/cache.mjs';
import runtimeStage from './stages/runtime.mjs';
import permissionBoundaryStage from './stages/permission-boundary.mjs';
import evaluationStage from './stages/evaluation.mjs';
import mountsStage from './stages/mounts.mjs';
import mountDiagnosticsStage from './stages/mount-diagnostics.mjs';
import storageStage from './stages/storage.mjs';
import composeGatesStage from './stages/compose-gates.mjs';
import secretsStage from './stages/secrets.mjs';
import credentialExposureStage from './stages/credential-exposure.mjs';
import gpuStage from './stages/gpu.mjs';
import gpuContractsStage from './stages/gpu-contracts.mjs';
import identityStage from './stages/identity.mjs';
import ciRebuildStage from './stages/ci-rebuild.mjs';
import failureMapStage from './stages/failure-map.mjs';
import freshContainerStage from './stages/fresh-container.mjs';
export { cueProgress } from './construction.mjs';
export {
  CHANGED_FIXTURE,
  FIXTURE,
  FRESH_FIXTURE,
  FRESH_MOUNTED,
  MISSING_FIXTURE_ERROR,
  OBSERVED_IMAGE_ID,
  PROJECT_FILES,
} from './fixtures.mjs';
export {
  cacheState,
  checkReport,
  evaluationState,
  mountState,
  permissionBits,
  referenceReport,
  score,
  secretState,
  stageContents,
  teachingKeys,
  validateModel,
  visibleFixture,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'docker-containerization-reproducible-ai',
  validateModel,
  scenes: [
    openingStage,
    runtimeContractStage,
    contextStage,
    stagesStage,
    stageInheritanceStage,
    platformIdentityStage,
    dependencyArtifactsStage,
    cacheStage,
    runtimeStage,
    permissionBoundaryStage,
    evaluationStage,
    mountsStage,
    mountDiagnosticsStage,
    storageStage,
    composeGatesStage,
    secretsStage,
    credentialExposureStage,
    gpuStage,
    gpuContractsStage,
    identityStage,
    ciRebuildStage,
    failureMapStage,
    freshContainerStage,
  ],
});
export const draw = definition.draw;
export default definition;
