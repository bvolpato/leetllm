import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import landlock from './stages/landlock.mjs';
import rightsContract from './stages/rights-contract.mjs';
import layerGrants from './stages/layer-grants.mjs';
import paths from './stages/paths.mjs';
import pathHelperBoundary from './stages/path-helper-boundary.mjs';
import hooks from './stages/hooks.mjs';
import delayedConfig from './stages/delayed-config.mjs';
import syscalls from './stages/syscalls.mjs';
import mountView from './stages/mount-view.mjs';
import seatbelt from './stages/seatbelt.mjs';
import platformProfile from './stages/platform-profile.mjs';
import brokerStage from './stages/broker.mjs';
import brokerReply from './stages/broker-reply.mjs';
import dependencySetup from './stages/dependency-setup.mjs';
import verify from './stages/verify.mjs';
import freshBoundary from './stages/fresh-boundary.mjs';
export {
  broker,
  canWrite,
  exactBrokerRequest,
  freshSandboxDecision,
  helperAllows,
  hookSnapshot,
  layeredWrite,
  pathSnapshot,
  resolveFixture,
  resource,
  sampleModel,
  sanitizeBrokerReply,
  seatbeltStartup,
  syscallAllowed,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'local-agent-sandboxing-seatbelt-landlock',
  validateModel,
  scenes: [
    intro,
    paths,
    pathHelperBoundary,
    landlock,
    rightsContract,
    layerGrants,
    hooks,
    delayedConfig,
    syscalls,
    mountView,
    seatbelt,
    platformProfile,
    brokerStage,
    brokerReply,
    dependencySetup,
    freshBoundary,
    verify,
  ],
});
export const draw = definition.draw;
export default definition;
