// Full-bleed dark-cinema narrated stage film for `ai-lab-coding-interview-python-systems`.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPythonSystemsInvariants } from './parts.mjs';
import s0 from './scenes/opening.mjs';
import s1 from './scenes/contract-loop.mjs';
import s2 from './scenes/state-objects.mjs';
import s3 from './scenes/frontier.mjs';
import s4 from './scenes/url-policy.mjs';
import s5 from './scenes/claim.mjs';
import s6 from './scenes/claim-failure.mjs';
import s7 from './scenes/expiry.mjs';
import s8 from './scenes/ttl-reads.mjs';
import s9 from './scenes/cas-boundary.mjs';
import s10 from './scenes/scheduler.mjs';
import s11 from './scenes/graph-validation.mjs';
import s12 from './scenes/scheduler-workers.mjs';
import s13 from './scenes/limiter.mjs';
import s14 from './scenes/bucket-contract.mjs';
import s15 from './scenes/ledger.mjs';
import s16 from './scenes/ledger-lifetime.mjs';
import s17 from './scenes/lock-order.mjs';
import s18 from './scenes/parser-state.mjs';
import s19 from './scenes/concurrency.mjs';
import s20 from './scenes/worker-runtime.mjs';
import s21 from './scenes/fresh-worker-plan.mjs';

const scenes = {
  opening: s0,
  'contract-loop': s1,
  claim: s5,
  frontier: s3,
  'url-policy': s4,
  'claim-failure': s6,
  'state-objects': s2,
  expiry: s7,
  'ttl-reads': s8,
  'cas-boundary': s9,
  scheduler: s10,
  'graph-validation': s11,
  'scheduler-workers': s12,
  limiter: s13,
  'bucket-contract': s14,
  ledger: s15,
  'ledger-lifetime': s16,
  'lock-order': s17,
  'parser-state': s18,
  concurrency: s19,
  'worker-runtime': s20,
  'fresh-worker-plan': s21,
};

export default cinematicLesson({
  id: 'ai-lab-coding-interview-python-systems',
  accent: COSMOS.cyan,
  invariants: verifyPythonSystemsInvariants,
  scenes,
});
