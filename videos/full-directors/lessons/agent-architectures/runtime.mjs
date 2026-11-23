import assert from 'node:assert/strict';
import { C } from './studio.mjs';
import {
  approvalReplay,
  canonicalAgentAction,
  periodicWithoutProgress,
  recoveryVerdict,
} from '../../../films/agent-architectures/protocols.mjs';
import { submittedTokens } from '../../../films/agent-architectures/arithmetic.mjs';

const requests = [
  { run_id: 'R1842' },
  { run_id: 'R1842', extra: true },
  { run_id: 'R1842', include_logs: 'yes' },
  { run_id: 'R9999', include_logs: false },
];
function readCI(req) {
  if (
    typeof req.run_id !== 'string' ||
    !req.run_id.trim() ||
    Object.keys(req).some((k) => !['run_id', 'include_logs'].includes(k)) ||
    (Object.hasOwn(req, 'include_logs') && typeof req.include_logs !== 'boolean')
  )
    return 'Invalid shape';
  if (req.run_id !== 'R1842') return 'Scope denied';
  return 'Read completed';
}
function contract(g, b, q) {
  const n =
    Number(q(1, 'reads the result once')) +
    Number(q(1, 'extra field')) +
    Number(q(1, 'word yes')) +
    Number(q(2, 'outside this actor'));
  const rows = requests.slice(0, Math.max(1, n)).map((r, i) => {
    const verdict = i < n ? readCI(r) : 'Awaiting host';
    const flag = Object.hasOwn(r, 'include_logs')
      ? JSON.stringify(r.include_logs)
      : 'default false';
    return [
      r.run_id,
      flag,
      r.extra ? 'extra = true' : '—',
      [
        verdict,
        verdict === 'Read completed' ? C.teal : verdict === 'Awaiting host' ? C.muted : C.red,
      ],
    ];
  });
  const reads = requests.slice(0, n).filter((v) => readCI(v) === 'Read completed');
  g.heading('Tool boundary   /   read_ci', 'Which requests reach the backend?');
  g.table(
    ['RUN ID', 'INCLUDE LOGS', 'OTHER FIELDS', 'HOST RESULT'],
    rows,
    [155, 224, 213, 280],
    45,
    167,
    53,
  );
  g.text(
    'Backend reads   ' + reads.length + (reads.length ? '   •   R1842' : ''),
    48,
    414,
    24,
    C.ink,
    'Mono',
  );
  g.note(
    b === 3
      ? 'This application allows omission. A provider’s strict schema can require a nullable field.'
      : 'The host checks both the argument types and the actor’s scope.',
  );
}
const operation = {
  type: 'request',
  actor: 'release-bot',
  release: 'R1842',
  revision: 'c1841',
  key: 'operation-17',
};
const events = [
  operation,
  { type: 'grant', allowed: false },
  operation,
  { type: 'grant', allowed: true },
  operation,
  { ...operation, release: 'R2099' },
];
function lost(g, b, q) {
  const created = q(1, 'service creates'),
    lostReply = q(1, 'loses the reply'),
    revoked = q(2, 'Revoke the grant'),
    denied = q(2, 'host denies'),
    restored = q(2, 'Restore the grant'),
    replayed = q(2, 'service returns replay'),
    conflict = q(2, 'payload conflicts');
  const count = conflict
    ? 6
    : replayed
      ? 5
      : restored
        ? 4
        : denied
          ? 3
          : revoked
            ? 2
            : created
              ? 1
              : 0;
  const state = approvalReplay(events.slice(0, count)),
    last = state.outcomes.at(-1);
  const caller = conflict
    ? 'Payload conflict'
    : replayed
      ? 'Replay RB2041'
      : denied && !restored
        ? 'Access denied'
        : lostReply
          ? 'Unknown outcome'
          : 'Awaiting reply';
  g.heading('Proposal service   /   operation-17', 'How many proposals survived the lost reply?');
  g.plate(
    45,
    165,
    348,
    152,
    'CALLER VIEW',
    caller,
    conflict ? 'Release R2099' : revoked && !restored ? 'Grant revoked' : 'Release R1842',
    conflict || (revoked && !restored) ? C.red : C.blue,
  );
  const stroke = lostReply && !replayed ? C.red : C.teal;
  g.line(413, 238, 543, 238, stroke, 3);
  if (lostReply && !replayed) {
    g.rect(467, 226, 23, 24, C.paper);
    g.line(467, 249, 477, 227, C.red, 3);
    g.line(480, 249, 490, 227, C.red, 3);
  }
  g.plate(
    559,
    165,
    356,
    152,
    'SERVICE LEDGER',
    state.records[0]?.id || 'No proposal',
    created ? 'release-bot • R1842 • c1841' : 'Awaiting request',
    C.teal,
  );
  g.text('Accepted proposals', 560, 366, 20, C.muted);
  g.text(state.records.length, 860, 370, 36, C.teal, 'Serif');
  g.text(operation.key, 48, 367, 25, C.ink, 'Mono');
  g.note(
    b === 4
      ? 'If the key expired or deduplication is unsupported, reconcile with the service.'
      : b === 3
        ? 'A supported contract binds the full payload and records the key and effect atomically.'
        : last === 'conflict'
          ? 'The new payload conflicts. RB2041 is still the only proposal.'
          : replayed
            ? 'Same authorized payload and key: return the original proposal.'
            : lostReply
              ? 'A lost reply leaves the caller uncertain. The service keeps its accepted record.'
              : 'One approved request crosses the service boundary.',
  );
}
const history = [
  { id: 'task', name: '90 min at History', scope: 'Today • finish by 5', active: true },
  { id: 'hours-24', name: 'Museum open', scope: 'History • 1 to 6', active: true },
  { id: 'train-22', name: 'Cancelled train', scope: 'Transit • superseded', active: false },
  { id: 'route-31', name: 'Replacement bus', scope: 'Transit • today', active: true },
];
const selected = history.filter((r) => r.active);
const handoffPhrases = ['Give it the task', 'the current hours', 'the bus timetable'];
function archive(g, b, q, session, clock) {
  const loaded = !session && q(2, 'select the relevant records');
  g.heading(
    session ? 'Durable session   /   History visit' : 'Bounded model input   /   History visit',
    session ? 'Which events reach the next assistant?' : 'Which evidence should the host send?',
  );
  g.label('SESSION EVENT LOG', 48, 151);
  g.label('NEXT MODEL CALL', 553, 151);
  for (const [i, r] of history.entries()) {
    const y = 172 + i * 56;
    g.rect(47, y, 360, 46, C.white);
    g.rect(47, y, 5, 46, r.active ? C.teal : C.muted);
    g.text(r.id, 59, y + 29, 17, C.muted, 'Mono', 112);
    g.text(r.name, 174, y + 30, 21, C.ink, 'Serif', 219);
    if (r.active) {
      const j = selected.indexOf(r);
      const progress = session
        ? b === 1 ? clock.reveal(handoffPhrases[j], 0.48, { captionStart: false }) : 1
        : loaded;
      if (!progress) continue;
      const yy = 177 + j * 66;
      const points = [
        [409, y + 23],
        [457, y + 23],
        [499, yy + 19],
        [539, yy + 19],
      ];
      g.path(points, C.teal, 2);
      if (progress < 1) {
        const destination = progress * 3;
        const segment = Math.floor(destination);
        const [fromX, fromY] = points[segment];
        const [toX, toY] = points[segment + 1];
        const offset = destination - segment;
        g.circle(fromX + (toX - fromX) * offset, fromY + (toY - fromY) * offset, 5, C.teal);
        continue;
      }
      g.rect(544, yy, 372, 42, C.mint);
      g.text(r.name, 556, yy + 28, 19, C.ink, 'Sans', 200);
      g.text(r.id, 903, yy + 28, 15, C.teal, 'Mono', 122, 'right');
    }
  }
  if (session) {
    const verdict = b === 3 && clock.reveal('Only selected events', 0, { captionStart: false });
    if (b === 2) {
      g.text('Carry allowed tools, remaining budget and unresolved operation IDs.', 48, 429, 20);
    } else if (verdict) {
      g.text(`${selected.length} of ${history.length} events reach this call. The cancelled train stays in the log.`, 48, 429, 20);
    }
  } else {
    g.note(
      loaded
        ? 'The train remains in the log. The current hours and bus reach the next call.'
        : 'The host retains complete receipts outside the prompt.',
    );
  }
}
function compact(g, b, q) {
  if (b === 2) return archive(g, b, q, false);
  if (b === 3) {
    g.heading('Full-history replay   /   four requests', 'How many tokens cross the boundary?');
    const calls = submittedTokens(1000, 200, 4);
    calls.forEach((v, i) => {
      const x = 111 + i * 208;
      g.rect(x, 359 - 106, 105, 106, C.blue);
      for (let j = 0; j < i; j++) g.rect(x, 359 - 106 - 21.2 * (j + 1), 105, 20, C.teal);
      g.text(v, x + 52, 347 - v * 0.106, 22, C.ink, 'Mono', 134, 'center');
      g.text('Call ' + (i + 1), x + 52, 394, 20, C.ink, 'Sans', 140, 'center');
    });
    g.note(
      '1,000 + 1,200 + 1,400 + 1,600 = ' +
        calls.reduce((a, v) => a + v, 0).toLocaleString('en-US') +
        ' submitted tokens.',
    );
    return;
  }
  g.heading('Repeated reads   /   same place and day', 'Did another call change the evidence?');
  for (let i = 0; i < 3; i++) {
    const x = 47 + i * 298;
    g.plate(x, 175, 265, 157, 'ATTEMPT ' + (i + 1), 'Read Art hours', 'Evidence version 1', C.blue);
  }
  g.note(
    q(1, 'stop the run')
      ? 'Repeated action and unchanged evidence. Stop before another dispatch.'
      : 'Compare the request signature and the verified progress marker.',
  );
}
const actions = ['A', 'B', 'A', 'B'];
function cycles(g, b, q) {
  if (b === 1) {
    g.heading('Canonical requests   /   identity', 'Which spaces belong to the request?');
    const fixture = { q: 'team space id', p: 2 };
    g.plate(47, 160, 868, 118, 'RECEIVED JSON', '{ "q": "team space id", "p": 2 }', '', C.blue);
    g.plate(47, 296, 868, 118, 'CANONICAL IDENTITY', canonicalAgentAction(fixture), '', C.teal);
    g.note('Sort object keys and preserve the space inside the query string.');
    return;
  }
  const changed = q(3, 'final response advances'),
    markers = ['p0', 'p0', 'p0', 'p0', changed ? 'p1' : 'p0'];
  const flag = periodicWithoutProgress(actions, markers);
  g.heading(
    'Period-two check   /   four calls, five boundaries',
    'Did the repeated pair make progress?',
  );
  g.label('VERIFIED CURSOR', 49, 163);
  for (let i = 0; i < 5; i++) {
    const x = 115 + i * 179,
      y = markers[i] === 'p1' ? 213 : 277;
    if (i) {
      const prevY = 277;
      g.arrow(x - 166, prevY, x - 12, y, changed && i === 4 ? C.teal : C.blue, 3);
      g.text(actions[i - 1], x - 88, prevY + 52, 30, C.ink, 'Mono', 60, 'center');
    }
    g.socket(x, y, changed && i === 4 ? C.teal : C.blue, 9);
    g.text(markers[i], x, y - 22, 24, C.ink, 'Mono', 95, 'center');
  }
  g.text('A  B     /     A  B', 480, 394, 23, C.muted, 'Mono', 550, 'center');
  const decided = b === 2 ? q(2, 'detector flags') : q(4, 'Let it continue');
  g.note(
    decided
      ? flag
        ? 'Flag this run. Both copies of the pair kept every boundary at p0.'
        : 'Continue within budget. The last call advanced the cursor to p1.'
      : 'The actions repeat. Inspect all five boundaries before deciding.',
  );
}
const checkAt = { region: 'us-east', revision: 'def456', now: 1000 };
const sample = (region, p95, at = 990, revision = 'def456') => ({ region, revision, p95, at });
function recovery(g, b, q) {
  const east = q(4, 'Switch to US East'),
    healthy = q(4, 'US East reports'),
    approved = q(4, 'matching approval arrives');
  const record = sample(east ? 'us-east' : 'eu-west', east && !healthy ? 940 : 120);
  const verdict = recoveryVerdict(record, { ...checkAt, approved });
  g.heading(
    b === 1 ? 'Release R2099   /   incident A2099' : 'Close A2099   /   rollback target: us-east on def456',
    b === 1 ? 'Which region supplied the healthy sample?' : 'Can the host close the incident now?',
  );
  if (b === 1) {
    g.plate(
      47,
      166,
      405,
      162,
      'AFFECTED   US-EAST',
      'abc123',
      'High latency on new release',
      C.red,
    );
    g.plate(507, 166, 405, 162, 'OBSERVED   EU-WEST', 'def456', 'Healthy on older release', C.teal);
    g.note('The historical close used evidence from the wrong region and revision.');
    return;
  }
  g.plate(
    47,
    150,
    335,
    151,
    'OBSERVATION',
    record.region + '  /  ' + record.revision,
    'Age ' + (checkAt.now - record.at) + ' s • allowed 0 ≤ age < 60',
    record.region === 'us-east' ? C.teal : C.red,
  );
  g.text('p95 latency', 419, 165, 20, C.muted);
  const x = 422,
    w = 478;
  g.rect(x, 216, w, 22, C.sand);
  g.rect(x, 216, (w * record.p95) / 1000, 22, record.p95 <= 200 ? C.teal : C.red);
  const threshold = x + w * 0.2;
  g.line(threshold, 194, threshold, 248, C.goldInk, 3);
  g.text('Limit 200 ms', threshold, 273, 17, C.goldInk, 'Mono', 160, 'center');
  g.text(record.p95 + ' ms', 898, 195, 23, C.ink, 'Mono', 138, 'right');
  g.text('Exact closure approval', 50, 361, 22, C.muted);
  g.text(approved ? 'A2099 + def456' : 'Absent', 50, 394, 23, approved ? C.teal : C.red, 'Mono');
  g.text(
    verdict === 'closed' ? 'Closed' : 'Open',
    418,
    360,
    33,
    verdict === 'closed' ? C.teal : C.ink,
    'Serif',
  );
  g.text(verdict === 'closed' ? 'All closure checks passed' : verdict, 421, 394, 22, C.muted);
  g.note(
    b === 5
      ? 'A production policy can also require a sustained window. Check and close atomically.'
      : 'Match identity, age and finite p95 in [0, 200] ms. Require exact approval.',
  );
}
export function runtime(g, k, q, n) {
  const b = k.beat.beatIndex + 1;
  switch (n) {
    case 25:
      return contract(g, b, q);
    case 26:
      return lost(g, b, q);
    case 27:
      return compact(g, b, q);
    case 29:
      return cycles(g, b, q);
    case 30:
      return recovery(g, b, q);
    case 31:
      return archive(g, b, q, true, k);
  }
}
export function checkRuntime() {
  assert.deepEqual(requests.map(readCI), [
    'Read completed',
    'Invalid shape',
    'Invalid shape',
    'Scope denied',
  ]);
  const state = approvalReplay(events);
  assert.equal(state.records.length, 1);
  assert.deepEqual(state.outcomes, ['created RB2041', 'denied', 'replay RB2041', 'conflict']);
  assert.deepEqual(
    selected.map((s) => s.id),
    ['task', 'hours-24', 'route-31'],
  );
  assert.equal(periodicWithoutProgress(actions, [0, 0, 0, 0, 0]), true);
  assert.equal(periodicWithoutProgress(actions, [0, 0, 0, 0, 1]), false);
  assert.equal(canonicalAgentAction({ q: 'team space id', p: 2 }), '{"p":2,"q":"team space id"}');
  for (const [r, approved, wanted] of [
    [sample('eu-west', 120), false, 'wrong identity'],
    [sample('us-east', 940), false, 'unhealthy'],
    [sample('us-east', 120), false, 'approval missing'],
    [sample('us-east', 120), true, 'closed'],
    [sample('us-east', 120, 940), true, 'stale or future'],
  ])
    assert.equal(recoveryVerdict(r, { ...checkAt, approved }), wanted);
}
