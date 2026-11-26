// Cinematic Vizmatic 0.10.0 stage film for GPU Compilers and Kernel Languages (19 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyCompilerInvariants } from './parts.mjs';
import actualLoaderCases from './scenes/actual-loader-cases.mjs';
import artifacts from './scenes/artifacts.mjs';
import cacheCooperation from './scenes/cache-cooperation.mjs';
import capturedNative from './scenes/captured-native.mjs';
import controlSurfaces from './scenes/control-surfaces.mjs';
import firstFailingBoundary from './scenes/first-failing-boundary.mjs';
import hostDevicePackage from './scenes/host-device-package.mjs';
import identity from './scenes/identity.mjs';
import intro from './scenes/intro.mjs';
import loader from './scenes/loader.mjs';
import manifestContract from './scenes/manifest-contract.mjs';
import ownershipBoundaries from './scenes/ownership-boundaries.mjs';
import ownership from './scenes/ownership.mjs';
import publication from './scenes/publication.mjs';
import registerLifetimes from './scenes/register-lifetimes.mjs';
import registers from './scenes/registers.mjs';
import requestClock from './scenes/request-clock.mjs';
import spillWorkload from './scenes/spill-workload.mjs';
import tritonLowering from './scenes/triton-lowering.mjs';

export default cinematicLesson({
  id: 'gpu-compilers-kernel-languages',
  accent: COSMOS.cyan,
  invariants: verifyCompilerInvariants,
  scenes: {
    intro,
    artifacts,
    'host-device-package': hostDevicePackage,
    'captured-native': capturedNative,
    loader,
    'actual-loader-cases': actualLoaderCases,
    'register-lifetimes': registerLifetimes,
    registers,
    'spill-workload': spillWorkload,
    identity,
    'manifest-contract': manifestContract,
    publication,
    'cache-cooperation': cacheCooperation,
    'request-clock': requestClock,
    ownership,
    'triton-lowering': tritonLowering,
    'ownership-boundaries': ownershipBoundaries,
    'control-surfaces': controlSurfaces,
    'first-failing-boundary': firstFailingBoundary,
  },
});
