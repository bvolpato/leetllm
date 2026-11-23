import {
  facts,
  lanes,
  policy,
  grantPermit,
  grantRequest,
} from '../../../films/model-routing/fixtures.mjs';
import {
  Breaker,
  GrantLedger,
  compile,
  execute,
  rank,
  replyChecks,
  retry,
  violations,
} from '../../../films/model-routing/model.mjs';

export { lanes, policy, grantPermit, grantRequest, rank, retry };
export const byId = Object.fromEntries(lanes.map((lane) => [lane.id, lane]));
export const contract = compile(facts);
export const larger = compile({ ...facts, context: 70000 });
export const withHints = compile({ ...facts, data: 'public', citations: false });
export const measured = lanes.map((lane) => (lane.id === 'D' ? { ...lane, latency: 700 } : lane));
export const fields = ['data', 'context', 'schema', 'citations', 'review', 'cost'];
export const checksFor = (lane, req) => fields.map((f) => !violations(lane, req).includes(f));
export const sampleText = 'Please review this request.';
export const sampleD = {
  schema: policy.schema,
  status: 'complete',
  answer: 'Send this request for review.',
  citations: ['E1'],
  review: 'pending',
};
export const allowed = ['E1'];
export const wrongD = { ...sampleD, citations: ['E99'] };
export const passage = { id: 'E1', text: ['A reviewer must approve', 'viewer access.'] };
export const validate = (reply) => replyChecks(reply, allowed);
export function plan(start, cap = policy.requestCap) {
  const run = execute(start, cap);
  return {
    start,
    cap,
    run,
    duration: byId.D.latency,
    finish: start + byId.D.latency,
    available: policy.deadline - start,
    moneyLeft: cap - run.spans[0].charge,
    admitted: run.spans.some((s) => s.lane.id === 'D'),
  };
}
export const early = plan(940),
  late = plan(1800),
  tight = plan(940, 8000);
export const waitExample = {
  start: early.start,
  delay: 2000,
  remaining: policy.deadline - early.start,
};
export const edgeA = plan(1399),
  edgeB = plan(1400);
export const replays = [
  execute(940, policy.requestCap, facts.context, null),
  early.run,
  execute(940, policy.requestCap, larger.context),
];
export const ranked = (speed = false) =>
  rank(contract, speed ? 'latency' : 'cost', speed ? measured : lanes);
export function relay(stage) {
  const breaker = new Breaker();
  if (stage >= 1) breaker.fail(0);
  if (stage >= 2) breaker.fail(1);
  const first = stage >= 3 ? breaker.permit(11) : null;
  const second = stage >= 4 ? breaker.permit(11.1) : null;
  if (stage === 5) breaker.success();
  if (stage === 6) breaker.permit(13.5);
  return {
    state: breaker.state,
    count: breaker.failures,
    until: breaker.until,
    first,
    second,
    holder: breaker.state === 'half open' && first ? 'P1' : null,
  };
}
export const backupCircuits = ranked().map((lane) => {
  const circuit = new Breaker();
  if (lane.id === 'C' || lane.id === 'D') {
    circuit.fail(0);
    circuit.fail(1);
  }
  return { lane, state: circuit.state, allowed: circuit.permit(2) };
});
export const healthyAfterSkips = backupCircuits.find((row) => row.allowed).lane;
export const retryWindow = (attempt) => Math.min(1000, 200 * 2 ** attempt);
export const jitters = [0.12, 0.46, 0.83].map((u) => Math.round(u * retryWindow(0)));
export function grants() {
  const store = new GrantLedger();
  const first = store.execute(grantRequest, grantPermit);
  const replay = store.execute(grantRequest, grantPermit);
  const denied = store.execute(grantRequest, {});
  const changedRequest = { ...grantRequest, resource: 'project-43' };
  const changedPermit = { ...grantPermit, reviewReceipt: 'HR-9' };
  const changed = store.execute(changedRequest, changedPermit);
  return {
    first,
    replay,
    denied,
    changed,
    changedRequest,
    changedPermit,
    receipt: first.receipt,
    effects: store.effects,
  };
}
export const grant = grants();
