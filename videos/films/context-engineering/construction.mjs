import { CONTEXT_FRESH } from './fixtures.mjs';
import { contextDone, contextProgress, requiredPacking } from './arithmetic.mjs';
import { completeResume, contextFreshResumeFixture, hash } from './recovery.mjs';

export function recheckCollection(fixture) {
  const task = fixture.tasks.find((item) => item.id === 'collect');
  const prior = fixture.receipts[task.receipt];
  const report = JSON.parse(fixture.files[prior.artifact]);
  const trace = JSON.parse(fixture.files['trace.json']);
  const policy = JSON.parse(fixture.files['authorization.json']);
  if (
    typeof trace.trace !== 'string' ||
    !trace.trace ||
    !Number.isInteger(trace.status) ||
    trace.status < 100 ||
    trace.status > 599 ||
    report.trace !== trace.trace ||
    report.observed !== trace.status ||
    typeof policy.role !== 'string' ||
    !policy.role.trim()
  )
    return false;
  fixture.receipts[task.receipt] = {
    ...prior,
    passed: true,
    sha256: hash(fixture.files[prior.artifact]),
    inputSha256: Object.fromEntries(task.inputs.map((id) => [id, hash(fixture.files[id])])),
  };
  return true;
}

export function freshContextState(state) {
  const beat = state.beat ?? 0;
  const packing = requiredPacking(CONTEXT_FRESH, 2600);
  const done = (id, fallbackBeat) => contextDone(state, id, fallbackBeat);
  const progress = (id, fallbackBeat) => contextProgress(state, id, fallbackBeat);
  const required = progress('ce-earned-1000', 1);
  const skip = progress('ce-earned-skip', 1);
  const runbook = progress('ce-earned-2200', 1);
  const repair = done('ce-earned-receipt', 2);
  const authorizer = progress('ce-earned-authorizer', 2);
  const omit = state.cues?.['ce-earned-omit'] ? done('ce-earned-omit', 2) : beat >= 2;
  const packet = packing.selected.filter(
    (id) => id !== 'authorization' || !omit || authorizer === 1,
  );
  const renderedUnits = CONTEXT_FRESH.filter((r) => packet.includes(r.id)).reduce(
    (n, r) => n + r.units,
    0,
  );

  const fixture = contextFreshResumeFixture();
  const changed = state.cues?.['ce-earned-mutation'] ? done('ce-earned-mutation', 1) : beat >= 1;
  if (changed) fixture.files['trace.json'] = '{"trace":"R17","revision":2,"status":403}';
  const reissued = repair && recheckCollection(fixture);
  let resumed, error;
  try {
    resumed = completeResume(fixture.tasks, fixture.files, fixture.receipts);
  } catch (e) {
    error = e.message;
  }
  const ready = done('ce-earned-next', 2) && packet.includes('authorization');
  return {
    beat,
    packing,
    required,
    skip,
    runbook,
    authorizer,
    packet,
    renderedUnits,
    fixture,
    showRequired: required === 1,
    showSkip: skip === 1,
    showTotal: runbook === 1,
    showStale: changed,
    repair: reissued,
    receiptValid: !error,
    receiptError: error,
    next: ready ? (resumed?.next ?? null) : null,
  };
}
