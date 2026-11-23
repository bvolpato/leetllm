import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import subjectIntro from './stages/subject-intro.mjs';
import chooseReview from './stages/choose-review.mjs';
import oversightModes from './stages/oversight-modes.mjs';
import durablePending from './stages/durable-pending.mjs';
import bindDecision from './stages/bind-decision.mjs';
import serializationCard from './stages/serialization-card.mjs';
import langgraphReplay from './stages/langgraph-replay.mjs';
import temporalReview from './stages/temporal-review.mjs';
import identitiesAndGrants from './stages/identities-and-grants.mjs';
import decisionOutbox from './stages/decision-outbox.mjs';
import staleVersion from './stages/stale-version.mjs';
import executeAndReconcile from './stages/execute-and-reconcile.mjs';
import decisionBranches from './stages/decision-branches.mjs';
import batchLedger from './stages/batch-ledger.mjs';
import weekendBudget from './stages/weekend-budget.mjs';
import transfer from './stages/transfer.mjs';
import queueGovernance from './stages/queue-governance.mjs';
import freshPacket from './stages/fresh-packet.mjs';
export { admissionBudget } from './arithmetic.mjs';
export {
  executionSnapshot,
  preparationSnapshot,
  reviewExercise,
  staleSnapshot,
} from './construction.mjs';
export { EXECUTION_CUES, FRESH_PROPOSAL, PROPOSAL, REVIEW_EXERCISE } from './fixtures.mjs';
export { decisionStore, digest } from './model.mjs';
export { envelopeFixture, operationTarget } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'human-approval',
  validateModel,
  scenes: [
    subjectIntro,
    chooseReview,
    oversightModes,
    durablePending,
    bindDecision,
    serializationCard,
    decisionBranches,
    langgraphReplay,
    temporalReview,
    identitiesAndGrants,
    decisionOutbox,
    staleVersion,
    executeAndReconcile,
    batchLedger,
    weekendBudget,
    transfer,
    queueGovernance,
    freshPacket,
  ],
});
export const draw = definition.draw;
export default definition;
