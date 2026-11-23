import { hash, phase, tuple } from './arithmetic.mjs';
import {
  confirmed,
  documents,
  original,
  parallel,
  policyDigest,
  serial,
  small,
  timeout,
} from './fixtures.mjs';
import assert from 'node:assert/strict';
export function mergeObservation(state, receipt) {
  return (
    state.authenticated === true &&
    receipt.success === true &&
    receipt.customer === state.customer &&
    receipt.invoice === state.invoice &&
    receipt.revision === state.revision
  );
}
export function evidenceErrors(doc, state) {
  return [
    ...(doc.kind === 'published' && doc.publisher === true ? [] : ['publication']),
    ...(doc.region === state.region ? [] : ['region']),
    ...(doc.topic === 'duplicate-credit' ? [] : ['topic']),
    ...(doc.current === true && doc.id === state.policy ? [] : ['version']),
    ...(hash(doc.text) === doc.digest ? [] : ['digest']),
  ];
}
export function decide(state, admitted = true) {
  if (
    state.authenticated !== true ||
    state.owner !== state.customer ||
    state.invoiceItem !== state.item
  )
    return {
      outcome: 'HANDOFF',
      reason: 'Identity, ownership or item',
    };
  if (!admitted || state.region !== 'US' || state.policy !== 'US-v3')
    return {
      outcome: 'ABSTAIN',
      reason: 'Current published policy missing',
    };
  if (state.intent === 'policy-question')
    return {
      outcome: 'POLICY REPLY',
      reason: 'Published policy citation',
    };
  if (state.intent !== 'duplicate-credit' || !Number.isInteger(state.amount) || state.amount <= 0)
    return {
      outcome: 'ABSTAIN',
      reason: 'Unsupported intent or invalid amount',
    };
  if (
    state.duplicate !== true ||
    !Number.isInteger(state.age) ||
    state.age < 0 ||
    state.age > 30 ||
    !Number.isInteger(state.total) ||
    state.total < 0 ||
    state.amount > state.total
  )
    return {
      outcome: 'HANDOFF',
      reason: 'Business evidence needs review',
    };
  if (state.amount >= 50000)
    return {
      outcome: 'HANDOFF',
      reason: 'Specialist threshold reached',
    };
  if (state.confirmed !== hash(tuple(state)))
    return {
      outcome: 'CONFIRM',
      reason: 'Exact confirmation required',
    };
  return {
    outcome: 'QUEUE ELIGIBLE',
    reason: 'All current predicates pass',
  };
}
export function payload(state) {
  return {
    ...tuple(state),
    status: 'pending',
    evidence: policyDigest,
  };
}
export function enqueue(store, key, value) {
  const existing = store.find((entry) => entry.key === key);
  if (existing)
    return {
      status: hash(existing.payload) === hash(value) ? 'RECOVERED' : 'CONFLICT',
      entry: existing,
    };
  if (
    store.some(
      (entry) => entry.payload.invoice === value.invoice && entry.payload.item === value.item,
    )
  )
    return {
      status: 'DUPLICATE INVOICE',
      entry: null,
    };
  const entry = {
    key,
    payload: {
      ...value,
    },
  };
  store.push(entry);
  return {
    status: 'INSERTED',
    entry,
  };
}
export function confirmationFrame(beat, progress) {
  const changed = beat === 2 && progress >= 0.65,
    current =
      beat === 0
        ? original
        : beat === 1
          ? small
          : changed
            ? {
                ...confirmed,
                amount: 4000,
              }
            : confirmed;
  return {
    current,
    confirmation: beat === 2 ? tuple(confirmed) : null,
    changed,
    ...decide(current),
  };
}
export function packet(state) {
  return state.authenticated === true && state.owner === state.customer
    ? {
        ticket: state.ticket,
        customer: state.customer,
        invoice: state.invoice,
        amount: state.amount,
        policy: state.policy,
        reason: 'Specialist threshold',
        revision: state.revision,
      }
    : {
        ticket: state.ticket,
        reason: 'Identity verification required',
      };
}
export function acknowledgmentMatches(value, receipt) {
  return (
    receipt?.success === true &&
    receipt.queue === 'specialist' &&
    receipt.packet === hash(value) &&
    typeof receipt.reference === 'string' &&
    receipt.reference.trim().length > 0 &&
    receipt.reference === receipt.reference.trim()
  );
}
export function cases() {
  const confirm = (state) => ({
    ...state,
    confirmed: hash(tuple(state)),
  });
  return [
    {
      id: 'T0',
      state: {
        ...original,
        intent: 'policy-question',
        amount: 0,
      },
      expected: 'POLICY REPLY',
    },
    {
      id: 'T1',
      state: original,
      expected: 'HANDOFF',
    },
    {
      id: 'T2',
      state: small,
      expected: 'CONFIRM',
    },
    {
      id: 'T3',
      state: confirmed,
      expected: 'QUEUED',
    },
    {
      id: 'T8',
      state: {
        ...confirmed,
        ticket: '48292',
      },
      expected: 'HANDOFF',
    },
    {
      id: 'T4',
      state: {
        ...small,
        customer: 'Jordan',
      },
      expected: 'HANDOFF',
    },
    {
      id: 'T5',
      state: {
        ...small,
        region: 'CA',
      },
      expected: 'ABSTAIN',
    },
    {
      id: 'T6',
      state: confirm({
        ...small,
        invoice: 'A10235',
        item: 'batch-export',
        invoiceItem: 'batch-export',
        age: 45,
        total: 8000,
      }),
      expected: 'HANDOFF',
    },
    {
      id: 'T7',
      state: confirm({
        ...small,
        invoice: 'A10236',
        item: 'storage-addon',
        invoiceItem: 'storage-addon',
        total: 2000,
      }),
      expected: 'HANDOFF',
    },
    {
      id: 'T9',
      state: {
        ...small,
        amount: 0,
      },
      expected: 'ABSTAIN',
    },
    {
      id: 'T10',
      state: {
        ...small,
        intent: 'refund-request',
      },
      expected: 'ABSTAIN',
    },
    {
      id: 'T11',
      state: {
        ...small,
        invoice: 'A10236',
        invoiceItem: 'storage-addon',
        total: 2000,
      },
      expected: 'HANDOFF',
    },
  ];
}
export function replay(mode = 'normal', count = cases().length) {
  assert(
    Number.isInteger(count) && count >= 0 && count <= cases().length,
    'case prefix outside fixture',
  );
  const actual = [],
    rows = cases()
      .slice(0, count)
      .map((test) => {
        const admitted = documents.some((doc) => evidenceErrors(doc, test.state).length === 0),
          decision = decide(test.state, admitted);
        let outcome = decision.outcome;
        if (outcome === 'QUEUE ELIGIBLE') {
          const result = enqueue(actual, `credit:${test.state.ticket}`, payload(test.state));
          outcome =
            result.status === 'INSERTED' || result.status === 'RECOVERED' ? 'QUEUED' : 'HANDOFF';
        }
        return {
          id: test.id,
          expected: test.expected,
          outcome,
          pass: test.expected === outcome,
        };
      });
  const expected = rows.some((row) => row.id === 'T3')
    ? [
        {
          key: 'credit:48291',
          payload: {
            customer: 'Alex',
            invoice: 'A10234',
            item: 'gpu-usage',
            amount: 3500,
            policy: 'US-v3',
            revision: 4,
            status: 'pending',
            evidence: policyDigest,
          },
        },
      ]
    : [];
  if (mode === 'extra')
    actual.push({
      key: 'hidden-write',
      payload: {
        ...payload(confirmed),
        invoice: 'OTHER',
        amount: 1000,
      },
    });
  if (mode === 'missing') actual.splice(0, 1);
  const expectedHashes = expected.map(hash),
    actualHashes = actual.map(hash),
    unexpected = actualHashes.filter((value) => !expectedHashes.includes(value)),
    missing = expectedHashes.filter((value) => !actualHashes.includes(value));
  return {
    rows,
    actual,
    expected,
    unexpected,
    missing,
    labelsPass: rows.filter((value) => value.pass).length,
    complete: count === cases().length,
    ready:
      count === cases().length &&
      rows.every((value) => value.pass) &&
      !unexpected.length &&
      !missing.length,
    counts: Object.fromEntries(
      ['HANDOFF', 'ABSTAIN', 'POLICY REPLY', 'CONFIRM', 'QUEUED'].map((name) => [
        name,
        rows.filter((value) => value.outcome === name).length,
      ]),
    ),
  };
}
export function sampleModel(id, state) {
  const b = state.beat ?? 0,
    q = phase(state.beatP ?? 0),
    base = {
      b,
      q,
    };
  if (id === 'state') {
    const current =
        b === 0
          ? original
          : {
              ...original,
              invoice: 'A10236',
              amount: 2000,
              total: 2000,
              item: 'storage-addon',
              invoiceItem: 'storage-addon',
              revision: 5,
            },
      read = b < 2 ? original : current,
      receipt = {
        success: true,
        customer: read.customer,
        invoice: read.invoice,
        revision: read.revision,
        amount: read.amount,
      };
    return {
      ...base,
      current,
      receipt,
      accepted: mergeObservation(current, receipt),
    };
  }
  if (id === 'evidence') {
    const current = {
        ...original,
        region: b === 2 ? 'CA' : 'US',
      },
      docs = documents.map((doc, i) => ({
        ...doc,
        ...(b === 1 && i === 0
          ? {
              text: `${doc.text} EDITED`,
            }
          : {}),
      })),
      rows = docs.map((doc) => ({
        ...doc,
        errors: evidenceErrors(doc, current),
      }));
    return {
      ...base,
      current,
      rows,
      admitted: rows.filter((doc) => !doc.errors.length),
    };
  }
  if (id === 'policy')
    return {
      ...base,
      ...confirmationFrame(b, state.beatP ?? 0),
    };
  if (id === 'parallel') {
    const schedule = b === 0 ? serial : b === 2 ? timeout : parallel,
      duration = Math.max(...schedule.map((value) => value.end)),
      cueProgress = (name, fallback = q) =>
        Number.isFinite(state.cues?.[name]?.progress) ? state.cues[name].progress : fallback;
    let time = duration * q;
    if (b === 0) time = duration * cueProgress('serial-reads');
    if (b === 1) time = 2 * cueProgress('parallel-reads') + 2 * cueProgress('wait-slower');
    if (b === 2 && state.cues?.['timeout-reads'] && state.cues?.['read-timeout'])
      time = 2 * cueProgress('timeout-reads', 0) + Math.min(1, 2 * cueProgress('read-timeout', 0));
    time = Math.max(0, Math.min(duration, time));
    const timedOut = b === 2 && time >= duration,
      receiptInvoice = {
        success: b !== 2,
        customer: 'Alex',
        invoice: 'A10234',
        revision: 4,
      },
      receiptPolicy = {
        ...receiptInvoice,
        success: true,
      },
      completed = schedule.filter(
        (value) => value.end <= time && !(timedOut && value.id === 'invoice'),
      ),
      ready =
        b !== 2 &&
        time >= duration &&
        mergeObservation(original, receiptInvoice) &&
        mergeObservation(original, receiptPolicy);
    return {
      ...base,
      schedule,
      duration,
      time,
      completed,
      ready,
      timedOut,
      receiptInvoice,
      receiptPolicy,
    };
  }
  if (id === 'ledger') {
    const store = [],
      inserted = b > 0 || q >= 0.3;
    const first = inserted
      ? enqueue(store, 'credit:48291', payload(confirmed))
      : {
          status: 'PREPARED',
          entry: null,
        };
    const result =
      b === 0
        ? first
        : enqueue(
            store,
            'credit:48291',
            b === 1
              ? payload(confirmed)
              : {
                  ...payload(confirmed),
                  amount: 4000,
                },
          );
    return {
      ...base,
      store,
      inserted,
      result,
      attempted: b === 2 ? 4000 : 3500,
      responseLost: b === 0 && q >= 0.68,
      replyProgress: b === 0 ? Math.max(0, Math.min(1, (q - 0.35) / 0.33)) : q,
    };
  }
  if (id === 'handoff') {
    const current =
        b === 2
          ? {
              ...original,
              authenticated: false,
            }
          : original,
      value = packet(current),
      receipt =
        b === 1
          ? {
              success: true,
              queue: 'specialist',
              packet: hash(value),
              reference: 'REV-48291',
            }
          : null;
    return {
      ...base,
      current,
      value,
      receipt,
      acknowledged: acknowledgmentMatches(value, receipt),
    };
  }
  if (id === 'evaluation')
    return {
      ...base,
      mode: b === 0 ? 'normal' : b === 1 ? 'extra' : 'missing',
      ...replay(b === 0 ? 'normal' : b === 1 ? 'extra' : 'missing'),
    };
  return base;
}
