import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import artifacts from './stages/artifacts.mjs';
import hostDevicePackage from './stages/host-device-package.mjs';
import capturedNative from './stages/captured-native.mjs';
import loader from './stages/loader.mjs';
import actualLoaderCases from './stages/actual-loader-cases.mjs';
import registerLifetimes from './stages/register-lifetimes.mjs';
import registers from './stages/registers.mjs';
import spillWorkload from './stages/spill-workload.mjs';
import identity from './stages/identity.mjs';
import manifestContract from './stages/manifest-contract.mjs';
import publication from './stages/publication.mjs';
import cacheCooperation from './stages/cache-cooperation.mjs';
import requestClock from './stages/request-clock.mjs';
import ownership from './stages/ownership.mjs';
import tritonLowering from './stages/triton-lowering.mjs';
import ownershipBoundaries from './stages/ownership-boundaries.mjs';
import controlSurfaces from './stages/control-surfaces.mjs';
import firstFailingBoundary from './stages/first-failing-boundary.mjs';
export {
  coldPhases,
  coverage,
  liveSlots,
  recipeDigest,
  residency,
  resolve,
  specializationFixture,
  tailSummary,
} from './arithmetic.mjs';
export { compilerIntroFrame, sampleModel } from './construction.mjs';
export { publishable } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gpu-compilers-kernel-languages',
  validateModel,
  scenes: [
    intro,
    artifacts,
    hostDevicePackage,
    capturedNative,
    loader,
    actualLoaderCases,
    registerLifetimes,
    registers,
    spillWorkload,
    identity,
    manifestContract,
    publication,
    cacheCooperation,
    requestClock,
    ownership,
    tritonLowering,
    ownershipBoundaries,
    controlSurfaces,
    firstFailingBoundary,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
