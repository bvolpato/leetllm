import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import opening from './stages/opening.mjs';
import navigationContract from './stages/navigation-contract.mjs';
import findFile from './stages/find-file.mjs';
import ignoreContract from './stages/ignore-contract.mjs';
import gitStates from './stages/git-states.mjs';
import scoreStage from './stages/score.mjs';
import inputContract from './stages/input-contract.mjs';
import localHook from './stages/local-hook.mjs';
import commitBoundary from './stages/commit-boundary.mjs';
import history from './stages/history.mjs';
import shellInspection from './stages/shell-inspection.mjs';
import helperContract from './stages/helper-contract.mjs';
import pipeline from './stages/pipeline.mjs';
import strictShell from './stages/strict-shell.mjs';
import remoteJobs from './stages/remote-jobs.mjs';
import shutdown from './stages/shutdown.mjs';
import environment from './stages/environment.mjs';
import environmentContract from './stages/environment-contract.mjs';
import deviceContract from './stages/device-contract.mjs';
import lfsContract from './stages/lfs-contract.mjs';
import cleanClone from './stages/clean-clone.mjs';
import freshHandoff from './stages/fresh-handoff.mjs';
export {
  deviceEnumeration,
  jsonl,
  newlineCount,
  pipelineStatus,
  sameProcess,
  score,
} from './arithmetic.mjs';
export { cueProgress } from './construction.mjs';
export {
  commitFixtures,
  fixturePath,
  freshRows,
  freshWrong,
  job,
  lfsDigest,
  lfsPayload,
  lfsPointer,
  replacement,
  rows,
  wrongRow,
} from './fixtures.mjs';
export {
  bisectTrace,
  cloneFrame,
  commitBoundaryFrame,
  freshHandoffFrame,
  historyFrame,
  inputContractFrame,
  pipelineResult,
  recordContract,
  scoreFrame,
  searchResult,
  shutdownFrame,
  snapshotFrame,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'git-shell-linux-reproducible-ai',
  validateModel,
  scenes: [
    opening,
    navigationContract,
    findFile,
    ignoreContract,
    gitStates,
    scoreStage,
    inputContract,
    localHook,
    commitBoundary,
    history,
    shellInspection,
    helperContract,
    pipeline,
    strictShell,
    remoteJobs,
    shutdown,
    environment,
    environmentContract,
    deviceContract,
    lfsContract,
    cleanClone,
    freshHandoff,
  ],
});
export const draw = definition.draw;
export default definition;
