import {
  hash,
  tuple as invoiceFields,
} from '../../../films/design-conversational-ai-support-bot/arithmetic.mjs';
import {
  cases,
  decide as checkPolicy,
  evidenceErrors,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';
import {
  documents,
  freshExpectedPayload,
  policyDigest,
  small,
} from '../../../films/design-conversational-ai-support-bot/fixtures.mjs';

export const tuple = (state) => ({ ...invoiceFields(state), requestType: state.intent });
export const sign = (state) => ({ ...state, confirmed: hash(tuple(state)) });
export const confirmed = sign(small);
export const confirmedForty = sign({ ...small, amount: 4000 });
export const storageOnSameInvoice = sign({
  ...small,
  ticket: '48292',
  item: 'storage-addon',
  invoiceItem: 'storage-addon',
  total: 2000,
  amount: 2000,
  revision: 5,
});

export function decide(state, admitted = true) {
  // Evaluate all policy predicates before checking consent for the seven displayed fields.
  const policy = checkPolicy({ ...state, confirmed: null }, admitted);
  if (policy.outcome === 'CONFIRM' && state.confirmed === hash(tuple(state))) {
    return { outcome: 'QUEUE ELIGIBLE', reason: 'Current request matches the signed form' };
  }
  return policy;
}

export const keyFor = (state) => 'credit:' + state.ticket;
export function submit(store, state) {
  const admitted = documents.some((doc) => !evidenceErrors(doc, state).length);
  const decision = decide(state, admitted);
  if (decision.outcome !== 'QUEUE ELIGIBLE') return { status: decision.outcome };
  const key = keyFor(state);
  const payload = { ...tuple(state), status: 'pending', evidence: policyDigest };
  // This tenant's ledger scopes ticket keys and invoice claims to the authenticated account.
  const account = store.filter((entry) => entry.payload.customer === state.customer);
  const prior = account.find((entry) => entry.key === key);
  if (prior) {
    if (hash(prior.payload) !== hash(payload)) return { status: 'CONFLICT' };
    return { status: 'RECOVERED', entry: prior };
  }
  if (account.some((entry) => entry.payload.invoice === state.invoice)) {
    return { status: 'DUPLICATE INVOICE' };
  }
  const entry = { key, payload };
  store.push(entry);
  return { status: 'INSERTED', entry };
}

export function runQueue(state, mode) {
  const rows = [];
  let result;
  if (mode !== 'empty') result = submit(rows, state);
  if (mode === 'retry') result = submit(rows, state);
  if (mode === 'conflict') result = submit(rows, confirmedForty);
  if (mode === 'reticket') result = submit(rows, storageOnSameInvoice);
  return { rows, result, ref: result?.entry?.key };
}

// A serialized commit publishes the queue row and its billing job together.
export function sharedCommit(snapshot, state) {
  const rows = [...snapshot.rows];
  const result = submit(rows, state);
  if (result.status !== 'INSERTED') return { ...snapshot, result };
  const outbox = [...snapshot.outbox, { operation: result.entry.key, account: state.customer }];
  return { rows, outbox, result };
}

export const mayaExpected = [
  { key: 'credit:M240', payload: { ...freshExpectedPayload, requestType: 'duplicate-credit' } },
];
const alexExpected = {
  key: 'credit:48291',
  payload: {
    customer: 'Alex',
    invoice: 'A10234',
    item: 'gpu-usage',
    requestType: 'duplicate-credit',
    amount: 3500,
    policy: 'US-v3',
    revision: 4,
    status: 'pending',
    evidence: policyDigest,
  },
};

// Each occurrence in the expectation can account for one actual row.
export function compareRows(expected, actual) {
  const missing = [...expected];
  const unexpected = [];
  for (const row of actual) {
    const digest = hash(row);
    const index = missing.findIndex((candidate) => hash(candidate) === digest);
    if (index < 0) unexpected.push(row);
    else missing.splice(index, 1);
  }
  return { missing, unexpected, equal: missing.length === 0 && unexpected.length === 0 };
}

const scenarios = cases().map((test) => {
  if (test.id === 'T8') return { ...test, state: storageOnSameInvoice };
  return test.state.confirmed ? { ...test, state: sign(test.state) } : test;
});
function replay(mode, count = scenarios.length) {
  const actual = [];
  const rows = scenarios.slice(0, count).map(({ id, state, expected }) => {
    const { status } = submit(actual, state);
    const outcome = ['INSERTED', 'RECOVERED'].includes(status)
      ? 'QUEUED'
      : status === 'DUPLICATE INVOICE'
        ? 'HANDOFF'
        : status;
    return { id, expected, outcome, pass: expected === outcome };
  });
  const expected = rows.some((r) => r.id === 'T3') ? [alexExpected] : [];
  if (mode === 'extra')
    actual.push({
      key: 'hidden-write',
      payload: { ...actual[0].payload, invoice: 'OTHER', amount: 1000 },
    });
  if (mode === 'missing') actual.splice(0, 1);
  if (mode === 'duplicate') actual.push(structuredClone(actual[0]));
  const effects = compareRows(expected, actual);
  const labelsPass = rows.filter((row) => row.pass).length;
  return {
    rows,
    actual,
    expected,
    ...effects,
    labelsPass,
    ready: labelsPass === scenarios.length && effects.equal,
  };
}
export const replayPrefixes = Array.from({ length: scenarios.length + 1 }, (_, count) =>
  replay('normal', count),
);
export const replays = Object.fromEntries(
  ['normal', 'extra', 'missing', 'duplicate'].map((mode) => [mode, replay(mode)]),
);
