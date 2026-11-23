import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import opening from './stages/opening.mjs';
import contractLoop from './stages/contract-loop.mjs';
import stateObjects from './stages/state-objects.mjs';
import frontier from './stages/frontier.mjs';
import urlPolicy from './stages/url-policy.mjs';
import claim from './stages/claim.mjs';
import claimFailure from './stages/claim-failure.mjs';
import expiry from './stages/expiry.mjs';
import ttlReads from './stages/ttl-reads.mjs';
import casBoundary from './stages/cas-boundary.mjs';
import scheduler from './stages/scheduler.mjs';
import graphValidation from './stages/graph-validation.mjs';
import schedulerWorkers from './stages/scheduler-workers.mjs';
import limiter from './stages/limiter.mjs';
import bucketContract from './stages/bucket-contract.mjs';
import ledger from './stages/ledger.mjs';
import ledgerLifetime from './stages/ledger-lifetime.mjs';
import lockOrder from './stages/lock-order.mjs';
import parserState from './stages/parser-state.mjs';
import concurrency from './stages/concurrency.mjs';
import workerRuntime from './stages/worker-runtime.mjs';
import freshWorkerPlan from './stages/fresh-worker-plan.mjs';
export {
  Ledger,
  TokenBucket,
  claimRace,
  concurrencyChoice,
  crawl,
  expiryState,
  ledgerTrace,
  mixedWorkSchedule,
  normalizeUrl,
  parserTrace,
  protectedClaimTrace,
  schedule,
  serializedWorkerTrace,
  tokenBucketTrace,
} from './arithmetic.mjs';
export {
  codingChapterState,
  openingCrawlerTrace,
  sampleModel,
  sampleOriginalModel,
} from './construction.mjs';
export { validateModel } from './model.mjs';
const definition = defineCanvasLesson({
  id: 'ai-lab-coding-interview-python-systems',
  validateModel,
  scenes: [
    opening,
    contractLoop,
    stateObjects,
    frontier,
    urlPolicy,
    claim,
    claimFailure,
    expiry,
    ttlReads,
    casBoundary,
    scheduler,
    graphValidation,
    schedulerWorkers,
    limiter,
    bucketContract,
    ledger,
    ledgerLifetime,
    lockOrder,
    parserState,
    concurrency,
    workerRuntime,
    freshWorkerPlan,
  ],
});
export const draw = definition.draw;
export default definition;
