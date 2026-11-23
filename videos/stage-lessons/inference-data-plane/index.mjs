// The lesson `inference-data-plane` as a narrated film. One file for each scene, in the order of
// lesson.yaml. See PLAN.md for the example and the plan of each scene.
import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import collectiveContracts from './scenes/collective-contracts.mjs';
import criticalPath from './scenes/critical-path.mjs';
import lifecycleEvents from './scenes/lifecycle-events.mjs';
import kvState from './scenes/kv-state.mjs';
import realPayload from './scenes/real-payload.mjs';
import reserveAndTransfer from './scenes/reserve-and-transfer.mjs';
import retryBoundaries from './scenes/retry-boundaries.mjs';
import routeCompatible from './scenes/route-compatible.mjs';
import subjectIntro from './scenes/subject-intro.mjs';
import transfer from './scenes/transfer.mjs';
import trustedManifest from './scenes/trusted-manifest.mjs';
import uncertainTransfer from './scenes/uncertain-transfer.mjs';

export default narratedLesson({
  id: 'inference-data-plane',
  scenes: {
    'subject-intro': subjectIntro,
    'collective-contracts': collectiveContracts,
    'kv-state': kvState,
    'real-payload': realPayload,
    'route-compatible': routeCompatible,
    'trusted-manifest': trustedManifest,
    'reserve-and-transfer': reserveAndTransfer,
    'lifecycle-events': lifecycleEvents,
    'uncertain-transfer': uncertainTransfer,
    'retry-boundaries': retryBoundaries,
    'critical-path': criticalPath,
    transfer,
  },
});
