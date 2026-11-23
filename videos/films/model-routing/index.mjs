import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import contract from './stages/contract.mjs';
import filter from './stages/filter.mjs';
import rankStage from './stages/rank.mjs';
import deadline from './stages/deadline.mjs';
import publication from './stages/publication.mjs';
import breaker from './stages/breaker.mjs';
import synthesis from './stages/synthesis.mjs';
import transfer from './stages/transfer.mjs';
export {
  deadlinePlayback,
  filterEvidence,
  grantReplay,
  publicationSnapshot,
  sampleModel,
} from './construction.mjs';
export { lanes } from './fixtures.mjs';
export {
  Breaker,
  GrantLedger,
  compile,
  execute,
  grantPayloadHash,
  rank,
  replyChecks,
  retry,
  violations,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'model-routing',
  validateModel,
  scenes: [intro, contract, filter, rankStage, deadline, publication, breaker, synthesis, transfer],
});
export const draw = definition.draw;
export default definition;
