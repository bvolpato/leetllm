import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import opening from './scenes/opening.mjs';
import navigation from './scenes/navigation-contract.mjs';
import findFile from './scenes/find-file.mjs';
import ignoreContract from './scenes/ignore-contract.mjs';
import gitStates from './scenes/git-states.mjs';
import scoreScene from './scenes/score.mjs';
import inputContract from './scenes/input-contract.mjs';
import localHook from './scenes/local-hook.mjs';
import commitBoundary from './scenes/commit-boundary.mjs';
import history from './scenes/history.mjs';
import shellInspection from './scenes/shell-inspection.mjs';
import helperContract from './scenes/helper-contract.mjs';
import pipelineScene from './scenes/pipeline.mjs';
import strictShell from './scenes/strict-shell.mjs';
import remoteJobs from './scenes/remote-jobs.mjs';
import shutdown from './scenes/shutdown.mjs';
import environment from './scenes/environment.mjs';
import environmentContract from './scenes/environment-contract.mjs';
import deviceContract from './scenes/device-contract.mjs';
import lfsContract from './scenes/lfs-contract.mjs';
import cleanClone from './scenes/clean-clone.mjs';
import freshHandoff from './scenes/fresh-handoff.mjs';
export default narratedLesson({
  id: 'git-shell-linux-reproducible-ai',
  scenes: {
    opening,
    'navigation-contract': navigation,
    'find-file': findFile,
    'ignore-contract': ignoreContract,
    'git-states': gitStates,
    score: scoreScene,
    'input-contract': inputContract,
    'local-hook': localHook,
    'commit-boundary': commitBoundary,
    history,
    'shell-inspection': shellInspection,
    'helper-contract': helperContract,
    pipeline: pipelineScene,
    'strict-shell': strictShell,
    'remote-jobs': remoteJobs,
    shutdown,
    environment,
    'environment-contract': environmentContract,
    'device-contract': deviceContract,
    'lfs-contract': lfsContract,
    'clean-clone': cleanClone,
    'fresh-handoff': freshHandoff,
  },
});
