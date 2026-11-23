import { POLICY_ID, POLICY_TEXT, actions } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCueTrack } from 'vizmatic';
export const track = createCueTrack({
  initial: {
    id: 'first',
    snapshot: 0,
  },
  cues: [
    {
      id: 'second',
      beat: 1,
      at: 0,
      snapshot: 1,
    },
  ],
});
export const POLICY_HASH = createHash('sha256').update(POLICY_TEXT).digest('hex');
export const DRAFT =
  'Draft: ' +
  POLICY_TEXT +
  ' Source: ' +
  POLICY_ID +
  '. No access change has been requested or executed.';
export const pyArray = (values) => '[' + values.map((v) => JSON.stringify(v)).join(', ') + ']';
export const textDigest = (text) => createHash('sha256').update(text).digest('hex');
export const packet = {
  ticket: 'r-104',
  account: 'A300',
  scope: 'prod-api',
  policy: POLICY_HASH,
  draft: DRAFT,
  expiresAt: 1300,
};
export const operationBinding = (value) =>
  textDigest(pyArray([value.ticket, value.account, value.scope, value.policy, value.draft]));
export const operation = operationBinding(packet);
export const packetBinding = (value) =>
  textDigest(
    pyArray([
      operation,
      value.ticket,
      value.account,
      value.scope,
      value.policy,
      value.draft,
      value.expiresAt,
    ]),
  );
export const reviewed = packetBinding(packet);
export function plannerFacts(n) {
  const policy =
    n >= 1
      ? {
          id: POLICY_ID,
          text: POLICY_TEXT,
        }
      : null;
  const account =
    n >= 2
      ? {
          id: 'A300',
          scope: 'prod-api',
        }
      : null;
  const allowed =
    dispatch('Cited draft', {
      evidence: Boolean(policy),
      context: Boolean(account),
    }) === 'ALLOW';
  const draft = n >= 3 && allowed ? DRAFT : null;
  return {
    policy,
    account,
    draft,
    reviewStop: n >= 4,
  };
}
export function transactionTrace(fail) {
  const effects = new Set();
  const outcome = execute({
    effects,
    fail,
  });
  return [
    {
      stage: 'BEGIN',
      pending: 0,
      committed: 0,
    },
    {
      stage: 'INSERT · uncommitted',
      pending: 1,
      committed: 0,
    },
    {
      stage: outcome,
      pending: 0,
      committed: effects.size,
    },
  ];
}
export function dispatch(action, { account = 'A300', evidence = false, context = false } = {}) {
  if (!actions.includes(action)) return 'BLOCK: tool';
  if (action === 'Account lookup' && account !== 'A300') return 'BLOCK: resource';
  if (action === 'Cited draft' && (evidence !== true || context !== true))
    return 'BLOCK: prerequisites';
  return 'ALLOW';
}
export function execute({
  stored = packet,
  review = reviewed,
  now = 1001,
  scope = 'prod-api',
  effects = new Set(),
  fail = false,
  currentVerified = true,
  currentScope = 'prod-api',
  currentTicketMatches = true,
} = {}) {
  if (!Number.isInteger(now)) return 'BLOCK: invalid clock';
  if (scope !== stored.scope) return 'BLOCK: scope mismatch';
  if (operationBinding(stored) !== operation || packetBinding(stored) !== review)
    return 'BLOCK: packet changed';
  if (currentVerified !== true || currentScope !== stored.scope || currentTicketMatches !== true)
    return 'BLOCK: stale preconditions';
  if (now >= stored.expiresAt) return 'BLOCK: expired';
  if (effects.has(operation)) return 'Duplicate ignored';
  if (fail) return 'Transaction rolled back';
  effects.add(operation);
  return 'Local effect committed';
}
export function replaySnapshot(beat, progress) {
  const effects = new Set();
  execute({
    effects,
    fail: true,
  });
  let attempts = 1,
    tx;
  if (beat === 0 && progress < 0.65) {
    tx = transactionTrace(true)[progress < 0.12 ? 0 : progress < 0.4 ? 1 : 2];
  } else if (beat === 0 && progress < 0.85) {
    attempts = 2;
    tx = {
      stage: progress < 0.73 ? 'Retry · BEGIN' : 'Retry · INSERT uncommitted',
      pending: progress < 0.73 ? 0 : 1,
      committed: 0,
    };
  } else {
    attempts = 2;
    let stage = execute({
      effects,
    });
    if (beat > 0 && progress >= 0.22) {
      stage = execute({
        effects,
      });
      attempts = 3;
    }
    tx = {
      stage,
      pending: 0,
      committed: effects.size,
    };
  }
  return {
    effects: effects.size,
    attempts,
    tx,
    outcome: tx.stage,
  };
}
export function expiryReadout(edited = false) {
  const effects = new Set();
  execute({
    effects,
  });
  const stored = edited
      ? {
          ...packet,
          expiresAt: 2300,
        }
      : packet,
    now = edited ? 1301 : 1300;
  return {
    stored,
    now,
    outcome: execute({
      stored,
      now,
      effects,
    }),
    effects: effects.size,
  };
}
export function expiryConstruction(beat, editProgress = 0, checkProgress = 0) {
  const fraction = beat > 0 ? Math.max(0, Math.min(1, editProgress)) : 0;
  const stored = {
    ...packet,
    expiresAt: packet.expiresAt + Math.round(1000 * fraction),
  };
  const effects = new Set();
  execute({
    effects,
  });
  const now = beat > 0 ? 1301 : 1300,
    storedDigest = packetBinding(stored);
  const checked = beat === 0 || checkProgress > 0;
  return {
    stored,
    now,
    effects: effects.size,
    storedDigest,
    reviewedDigest: reviewed,
    matches: storedDigest === reviewed,
    fraction,
    checked,
    outcome: checked
      ? execute({
          stored,
          now,
          effects,
        })
      : 'Digest comparison pending',
  };
}
export function synthesisTrace(beat, beatP) {
  const elapsed = Math.max(0, Math.min(1, beatP)) * [18.246, 20.698][beat];
  const phase = (start, end) => Math.max(0, Math.min(1, (elapsed - start) / (end - start)));
  const readProgress = beat > 0 ? 1 : phase(1.45, 5.75);
  const reviewedPacket = beat > 0 || elapsed >= 7.6;
  const effects = new Set();
  if (reviewedPacket)
    execute({
      effects,
    });
  const replayed = beat > 0 || elapsed >= 8.65;
  const replayOutcome = replayed
    ? execute({
        effects,
      })
    : null;
  const expired = beat > 0 || elapsed >= 9.5;
  const expiryOutcome = expired
    ? execute({
        effects,
        now: packet.expiresAt,
      })
    : null;
  const focus =
    beat === 0
      ? elapsed < 2.3375
        ? 'intake'
        : elapsed < 3.475
          ? 'state'
          : elapsed < 6.1875
            ? 'draft'
            : elapsed < 8.0125
              ? 'review'
              : elapsed < 8.825
                ? 'replay'
                : elapsed < 12.875
                  ? 'expiry'
                  : 'gates'
      : elapsed < 4.0875
        ? 'planner'
        : elapsed < 5.8125
          ? 'intake'
          : elapsed < 7.1125
            ? 'review'
            : elapsed < 8.35
              ? 'gates'
              : elapsed < 10.175
                ? 'effect'
                : elapsed < 13.525
                  ? 'quality'
                  : 'all';
  return {
    elapsed,
    focus,
    readProgress,
    facts: plannerFacts(Math.floor(3 * readProgress)),
    reviewedPacket,
    effects: effects.size,
    replayed,
    replayOutcome,
    expired,
    expiryOutcome,
    ticket: packet.ticket,
    account: packet.account,
    operation,
    reviewed,
  };
}
export function sampleModel(scene, state) {
  const b = track.sample(state).snapshot,
    p = Math.max(0, Math.min(1, ((state.beatP ?? 0) - 0.08) / 0.7)),
    n = b ? 4 : Math.floor(4 * p);
  const replay =
    scene === 'replay'
      ? replaySnapshot(b, state.beatP ?? 0)
      : {
          effects: 0,
          attempts: 0,
          outcome: 'Awaiting execution',
          tx: {
            stage: 'Awaiting execution',
            pending: 0,
            committed: 0,
          },
        };
  return {
    b,
    p,
    q: b ? 1 : p,
    n,
    facts: plannerFacts(n),
    ...replay,
    ...(scene === 'synthesis'
      ? {
          synthesis: synthesisTrace(b, state.beatP ?? 0),
        }
      : {}),
  };
}
export function validateModel() {
  validateAgentUpgrade();
  assert.equal(plannerFacts(1).draft, null);
  assert.equal(plannerFacts(2).draft, null);
  assert(plannerFacts(3).draft.includes(plannerFacts(3).policy.text));
  assert.equal(plannerFacts(3).draft, DRAFT);
  assert.equal(plannerFacts(3).account.id, 'A300');
  assert.deepEqual(
    transactionTrace(true).map((v) => v.committed),
    [0, 0, 0],
  );
  assert.deepEqual(
    transactionTrace(false).map((v) => v.committed),
    [0, 0, 1],
  );
  assert.deepEqual(
    transactionTrace(true).map((v) => v.pending),
    [0, 1, 0],
  );
  assert.equal(replaySnapshot(0, 0.3).tx.pending, 1);
  assert.equal(replaySnapshot(0, 0.5).effects, 0);
  assert.equal(replaySnapshot(0, 0.9).effects, 1);
  assert.equal(replaySnapshot(0, 0.9).attempts, 2);
  assert.equal(replaySnapshot(1, 0.5).effects, 1);
  assert.equal(replaySnapshot(1, 0.5).attempts, 3);
  assert.equal(replaySnapshot(1, 0.5).outcome, 'Duplicate ignored');
  for (let beat = 0; beat < 2; beat++)
    for (let i = 0; i <= 100; i++) {
      const s = replaySnapshot(beat, i / 100);
      assert.equal(s.effects, s.tx.committed);
      assert(s.effects <= 1);
      assert(s.effects === 0 || s.tx.pending === 0);
    }
  assert.equal(expiryReadout().effects, 1);
  assert.equal(expiryReadout().outcome, 'BLOCK: expired');
  assert.equal(expiryReadout(true).effects, 1);
  assert.equal(expiryReadout(true).outcome, 'BLOCK: packet changed');
  assert.equal(dispatch('Restore access'), 'BLOCK: tool');
  for (const action of ['Delete account', '', null, 'policy evidence'])
    assert.equal(dispatch(action), 'BLOCK: tool');
  for (const action of actions)
    assert.equal(
      dispatch(action, {
        evidence: true,
        context: true,
      }),
      'ALLOW',
    );
  assert.equal(
    dispatch('Account lookup', {
      account: 'A301',
    }),
    'BLOCK: resource',
  );
  assert.equal(dispatch('Cited draft'), 'BLOCK: prerequisites');
  assert.equal(
    dispatch('Cited draft', {
      evidence: 'false',
      context: true,
    }),
    'BLOCK: prerequisites',
  );
  assert.equal(
    dispatch('Cited draft', {
      evidence: true,
      context: true,
    }),
    'ALLOW',
  );
  const effects = new Set();
  assert.equal(
    execute({
      effects,
      fail: true,
    }),
    'Transaction rolled back',
  );
  assert.equal(effects.size, 0);
  assert.equal(
    execute({
      effects,
    }),
    'Local effect committed',
  );
  assert.equal(
    execute({
      effects,
    }),
    'Duplicate ignored',
  );
  assert.equal(effects.size, 1);
  assert.equal(
    execute({
      effects,
      now: 1300,
    }),
    'BLOCK: expired',
  );
  assert.equal(
    execute({
      stored: {
        ...packet,
        expiresAt: 2300,
      },
      now: 1301,
    }),
    'BLOCK: packet changed',
  );
  assert.equal(
    execute({
      scope: 'admin',
    }),
    'BLOCK: scope mismatch',
  );
  assert.equal(synthesisTrace(0, 0).effects, 0);
  assert.equal(synthesisTrace(0, 7.6 / 18.246).effects, 1);
  assert.equal(synthesisTrace(0, 9.5 / 18.246).expiryOutcome, 'BLOCK: expired');
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const trace = synthesisTrace(beat, i / 100);
      assert.equal(trace.ticket, packet.ticket);
      assert.equal(trace.operation, operation);
      assert.equal(trace.effects, trace.reviewedPacket ? 1 : 0);
      if (trace.replayed) assert.equal(trace.replayOutcome, 'Duplicate ignored');
      if (trace.expired) assert.equal(trace.expiryOutcome, 'BLOCK: expired');
    }
  return true;
}
export function composedRepairFixture() {
  const original = {
      ...packet,
      expiresAt: 2300,
    },
    review = packetBinding(original),
    effects = new Set();
  const steps = [
    {
      stored: {
        ...original,
        expiresAt: 2400,
      },
      currentVerified: false,
    },
    {
      stored: original,
      currentVerified: false,
    },
    {
      stored: original,
      currentVerified: true,
    },
    {
      stored: original,
      currentVerified: true,
    },
  ].map((inputs, i) => {
    const result = execute({
      ...inputs,
      review,
      now: 2001,
      effects,
    });
    return {
      stage: i,
      operation: operationBinding(inputs.stored),
      storedExpiry: inputs.stored.expiresAt,
      currentVerified: inputs.currentVerified,
      result,
      effects: effects.size,
      storedDigest: packetBinding(inputs.stored),
      reviewedDigest: review,
    };
  });
  return {
    ticket: packet.ticket,
    account: packet.account,
    scope: packet.scope,
    operation,
    original,
    review,
    steps,
  };
}
export function traceBudgetFixture(extra = false) {
  const events = [
    {
      tokens: 190,
      ms: 180,
    },
    {
      tokens: 80,
      ms: 90,
    },
    {
      tokens: 260,
      ms: 220,
    },
    {
      tokens: 40,
      ms: 40,
    },
    ...(extra
      ? [
          {
            tokens: 500,
            ms: 950,
          },
        ]
      : []),
  ];
  const used = {
      events: events.length,
      tokens: events.reduce((n, v) => n + v.tokens, 0),
      ms: events.reduce((n, v) => n + v.ms, 0),
    },
    limits = {
      events: 4,
      tokens: 900,
      ms: 1200,
    };
  return {
    events,
    used,
    limits,
    failed: Object.keys(limits).filter((k) => used[k] > limits[k]),
  };
}
export function episodeInventoryCheck(names) {
  const expected = ['urgent', 'stale', 'draft', 'injection', 'forbidden', 'replay'];
  return (
    names.length === expected.length &&
    expected.every((name) => names.filter((x) => x === name).length === 1)
  );
}
export function packetEvidenceFixture() {
  return {
    policyId: POLICY_ID,
    policy: POLICY_TEXT,
    policyHash: POLICY_HASH,
    draft: DRAFT,
    operation,
    packetDigest: reviewed,
  };
}
export function validateAgentUpgrade() {
  const r = composedRepairFixture();
  assert.deepEqual(
    r.steps.map((v) => v.result),
    [
      'BLOCK: packet changed',
      'BLOCK: stale preconditions',
      'Local effect committed',
      'Duplicate ignored',
    ],
  );
  assert.deepEqual(
    r.steps.map((v) => v.effects),
    [0, 0, 1, 1],
  );
  assert.notEqual(r.steps[0].storedDigest, r.review);
  assert.equal(r.steps[1].storedDigest, r.review);
  assert.equal(r.steps[1].currentVerified, false);
  assert.equal(r.steps[2].operation, r.steps[3].operation);
  assert.equal(traceBudgetFixture().used.tokens, 570);
  assert.equal(traceBudgetFixture().used.ms, 530);
  assert.deepEqual(traceBudgetFixture(true).failed, ['events', 'tokens', 'ms']);
  assert(episodeInventoryCheck(['urgent', 'stale', 'draft', 'injection', 'forbidden', 'replay']));
  assert(
    !episodeInventoryCheck(['urgent', 'stale', 'draft', 'injection', 'forbidden', 'forbidden']),
  );
}
