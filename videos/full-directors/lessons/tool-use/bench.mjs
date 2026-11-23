import {
  P,
  arrow,
  box,
  chip,
  circle,
  cue,
  gauge,
  label,
  line,
  mono,
  page,
  path,
  pretty,
  rows,
  serif,
  slip,
  text,
} from './studio.mjs';
import {
  aggregate,
  badEvals,
  budgetState,
  canary,
  catalog,
  evals,
  failed,
  finalReads,
  first,
  promotion,
  protocolConnections,
  protocolHosts,
  protocolServices,
  proposeA,
  ranked,
  receipts,
  required,
  requiredToolComparison,
  sameSuiteToolComparison,
  second,
  statusCall,
  violationRun,
} from './examples.mjs';

export function errorRate(c, k) {
  const filed = cue(k, 1, 'and files the reply');
  const limit = cue(k, 2, 'Keep your eye'),
    observed = cue(k, 2, 'By how many');
  const delta = cue(k, 3, 'The second model turn');
  if (k.beat.beatIndex === 3) {
    const hosted = cue(k, 4, 'A provider can run');
    page(c, 'Which service executes the call?', 'Release service  /  execution boundary', true);
    label(c, 'Application tool', 73, 259, P.mint);
    mono(c, 'get_release_status', 72, 332, 31, P.light);
    arrow(c, 439, 322, 628, 322, P.mint);
    mono(c, 'App runtime', 674, 332, 35, P.light);
    label(c, 'Service credential scoped to the project', 674, 394, P.mint, 464);
    if (hosted) {
      label(c, 'Hosted tool', 73, 477, P.brass);
      mono(c, 'Provider-hosted search', 72, 542, 26, P.light, 354);
      arrow(c, 439, 530, 628, 530, P.brass);
      mono(c, 'Provider service', 674, 542, 32, P.light);
    }
    return;
  }
  page(c, 'The canary for reranker-v16', 'Release service  /  status lookup', true);
  slip(c, 64, 229, 365, 284);
  label(c, 'Status request', 92, 275);
  mono(c, statusCall.name, 91, 322, 26, P.ink, 310);
  mono(c, 'Call ID   ' + statusCall.call_id, 91, 365, 25, P.teal, 310);
  if (filed) {
    label(c, 'Linked observation', 92, 403);
    mono(c, 'canary_failed', 91, 461, 27, P.ink);
  }
  const x = 507,
    w = 600,
    y = 399,
    at = (v) => x + (w * v) / 0.1;
  label(c, 'Errors per 100 requests', x, 268, P.mint);
  line(c, x, y, x + w, y, '#88b0a7', 3);
  for (let i = 0; i <= 10; i++) {
    line(c, at(i / 100), y, at(i / 100), y + 12, P.mint, 1);
    if (i % 5 === 0) mono(c, i + '%', at(i / 100) - 12, y + 45, 18, P.light);
  }
  if (limit) {
    const a = at(canary.budget);
    line(c, a, y - 75, a, y + 11, P.brass, 3);
    mono(c, '2% limit', a - 40, y - 89, 22, P.brass);
  }
  if (observed) {
    const from = at(canary.budget);
    const to = at(canary.error_rate);
    circle(c, to, y, 11, P.rose);
    mono(c, '8.1%', to - 18, y - 33, 26, P.rose);
    line(c, from, 490, to, 490, P.mint, 3);
    for (const end of [from, to]) line(c, end, 480, end, 501, P.mint, 3);
    const gap = delta ? '+' + pretty(100 * (canary.error_rate - canary.budget)) : '?';
    c.save();
    c.textAlign = 'center';
    mono(c, gap + ' percentage points', (from + to) / 2, 547, 28, P.pale);
    c.restore();
  }
}
export function sameSuite(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 3) {
    page(c, 'Which requests can cross the reader boundary?', 'Evaluation service  /  get_eval');
    const cues = [
      'an invented promote',
      'an out-of-scope',
      'an added approved',
      'duplicate version',
      'and truncated',
    ];
    badEvals.forEach((r, i) => {
      const y = 224 + i * 73;
      label(c, r.field, 79, y + 22);
      mono(c, r.value, 344, y + 24, 25, P.ink, 439);
      if (cue(k, 3, cues[i]))
        mono(c, r.result.ok ? 'Read' : 'Rejected', 863, y + 24, 24, P.rust, 220);
      line(c, 78, y + 43, 1111, y + 43, P.rule, 1);
    });
    return;
  }
  page(c, 'Two receipts from the same suite', 'Evaluation service  /  comparison');
  evals.forEach((r, i) => {
    const x = 72 + i * 548;
    slip(c, x, 238, 494, 268);
    label(c, r.version, x + 28, 287);
    const seen = cue(k, 1, i === 0 ? 'Version sixteen scored' : 'How far ahead');
    serif(c, seen ? r.score.toFixed(2) : '?', x + 26, 382, 68, seen ? P.teal : P.dim);
    mono(c, r.call_id + '  /  ' + r.suite, x + 28, 443, 20, P.ink, 437);
    if (seen) label(c, 'Gate ' + r.gate, x + 28, 483);
  });
  if (cue(k, 2, 'The two receipts'))
    mono(c, 'v17 − v16 = +' + sameSuiteToolComparison(evals).delta.toFixed(2), 74, 589, 32, P.teal);
}
function savedPromotion(c, x, y, key = 'op-A') {
  slip(c, x, y, 410, 178);
  label(c, 'Saved at release service', x + 26, y + 42);
  mono(c, key, x + 26, y + 90, 30);
  mono(c, promotion.saved.result, x + 26, y + 143, 23, P.ink, 355);
}
export function gate(c, k) {
  const b = k.beat.beatIndex + 1;
  const saved = cue(k, 5, 'The service saved'),
    failedGate = cue(k, 5, 'flips to failed') && !cue(k, 6, 'passes again');
  const replay = cue(k, 6, 'She gets the saved receipt'),
    blocked = failedGate && cue(k, 6, 'The service still');
  page(c, 'May this promotion go through?', 'Release policy  /  Alice’s session');
  if (b <= 4) {
    slip(c, 65, 229, 511, 290);
    label(c, 'Model proposal', 94, 274);
    mono(c, 'promote_model', 94, 336, 33, P.ink);
    mono(c, 'release_id: reranker-v17', 94, 392, 22, P.teal, 461);
    const extra = b === 3 && !cue(k, 3, 'The host obtains');
    if (extra) mono(c, 'approved: true', 94, 458, 25, P.rust);
    label(c, 'Trusted host records', 629, 272);
    const data = [
      ['Role', 'promotion'],
      ['Project', 'search'],
      ['Candidate', 'weights-17'],
    ];
    if (cue(k, 2, 'A human approval')) data.push(['Approval', 'Alice · P7 · op-A']);
    rows(c, 630, 303, 498, data, { dy: 58, valueX: 190 });
    if (extra && cue(k, 3, 'The shape check rejects'))
      chip(c, 'Extra field rejected', 73, 555, 370, P.rust);
    return;
  }
  const decision = replay ? promotion.replay : blocked ? promotion.blocked : null;
  rows(
    c,
    69,
    240,
    595,
    [
      ['Operation', 'op-A'],
      ['Target', 'weights-17'],
      ['Current gate', failedGate ? 'Failed' : 'Passed', failedGate ? P.rust : P.teal],
      ['Approval', 'Alice · search · P7'],
    ],
    { dy: 65, valueX: 226 },
  );
  if (saved) savedPromotion(c, 717, 260);
  if (decision)
    chip(
      c,
      decision.ok ? 'Replay saved result' : 'Stop before ledger',
      73,
      546,
      463,
      decision.ok ? P.teal : P.rust,
    );
  if (saved)
    mono(
      c,
      'Promotion effects  ' + (decision?.effects ?? promotion.first.effects),
      720,
      546,
      24,
      P.teal,
      397,
    );
}
export function intent(c, k) {
  if (k.beat.beatIndex >= 3) {
    const status = k.beat.beatIndex === 4;
    const crash = cue(k, 4, 'its process stops');
    const durable = cue(k, 4, 'in one durable transaction');
    page(
      c,
      status ? 'After the replay key expires' : 'Where did the receipt survive?',
      'Release service  /  durable recovery',
      true,
    );
    label(c, 'Release service', 78, 265, P.mint);
    label(c, 'Caller', 682, 265, P.mint);
    serif(c, 'weights-17', 76, 352, 48, P.pale);
    mono(
      c,
      status ? 'op-A status' : durable ? 'op-A + effect in one commit' : 'Promotion applied',
      77,
      425,
      24,
      P.brass,
      510,
    );
    mono(
      c,
      status
        ? cue(k, 5, 'A confirmed status')
          ? 'Saved receipt'
          : 'Reading status…'
        : crash
          ? 'Receipt missing'
          : 'Saving receipt…',
      681,
      352,
      30,
      P.light,
      432,
    );
    if (status || durable) arrow(c, 525, 366, 649, 366, P.brass);
    if (status && cue(k, 5, 'An inconclusive status'))
      text(c, 'If unknown: keep pending', 680, 486, 24, P.rose, 'Sans', 450);
    return;
  }
  const separate = cue(k, 2, 'applies a second intended'),
    collision = cue(k, 2, 'is a collision');
  const replay = cue(k, 1, 'Two requests'),
    recorded = cue(k, 1, 'After one recorded');
  const state = collision
    ? promotion.collision
    : separate
      ? promotion.second
      : replay
        ? promotion.replay
        : recorded
          ? promotion.first
          : null;
  page(c, 'Which intent owns the effect?', 'Release service  /  operation ledger', true);
  label(c, 'Project / action', 75, 249, P.mint);
  label(c, 'Operation', 530, 249, P.mint);
  label(c, 'Saved result', 811, 249, P.mint);
  const count = state?.effects ?? 0;
  for (let i = 0; i < 2; i++) {
    const y = 294 + 98 * i;
    line(c, 73, y + 57, 1128, y + 57, '#496e6c', 1);
    if (i < count) {
      mono(c, 'search / promote', 76, y + 27, 26, P.light);
      mono(c, i ? 'op-B' : 'op-A', 531, y + 27, 27, P.brass);
      mono(c, 'weights-17', 811, y + 27, 27, P.light);
    }
  }
  mono(c, 'Effects   ' + count, 77, 558, 32, P.pale);
  if (state)
    text(
      c,
      collision
        ? 'op-A + weights-18: collision'
        : separate
          ? 'A separately approved operation'
          : replay
            ? 'Same approved intent: saved receipt'
            : 'Caller lost the reply',
      425,
      557,
      25,
      collision ? P.rose : P.mint,
      'Sans',
      702,
    );
}
export function fanIn(c, k) {
  const rerun = cue(k, 4, 'Try the same'),
    duplicate = cue(k, 5, 'another copy');
  const gotB = rerun ? cue(k, 4, 'is still clean at nine') : cue(k, 1, 'The limit is twenty');
  const gotA = rerun ? cue(k, 4, 'Seventeen is still') : cue(k, 1, null);
  const a = gotA ? (rerun ? first : failed) : null;
  const receivedB = duplicate ? first : gotB ? second : null;
  const incoming = [a, receivedB].filter(Boolean);
  const outcome = requiredToolComparison(required, incoming);
  const reveal = duplicate
    ? cue(k, 6, 'The slot for call two')
    : rerun
      ? cue(k, 5, 'That selects')
      : cue(k, 3, 'Seventeen’s low rate');
  page(c, 'Two reads required for this decision', 'Release service  /  parallel comparison');
  [first, second].forEach((expected, i) => {
    const x = 72 + 550 * i,
      r = incoming.find((row) => row.call_id === expected.call_id);
    slip(c, x, 230, 495, 284);
    label(c, expected.call_id + '  /  ' + expected.release_id, x + 28, 276);
    if (r?.ok) {
      mono(c, r.status, x + 28, 341, 28, P.teal, 439);
      mono(c, Math.round(1000 * r.error_rate) + ' errors / 1,000', x + 28, 399, 26, P.ink);
      gauge(c, x + 28, 430, 423, Math.round(1000 * r.error_rate), 100, 20, '');
    } else {
      serif(c, r ? 'Read timed out' : 'Awaiting reply', x + 26, 377, 40, r ? P.rust : P.dim, 432);
    }
  });
  if (duplicate) mono(c, 'Incoming IDs   call-1, call-1', 74, 578, 24, P.ink, 512);
  if (reveal)
    chip(
      c,
      outcome.ok
        ? 'Candidate  ' + outcome.release_id
        : duplicate
          ? 'Missing call-2'
          : 'Wait for v16 evidence',
      613,
      546,
      505,
      outcome.ok ? P.teal : P.rust,
    );
}
export function routing(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    const filtered = cue(k, 1, 'That leaves');
    page(c, 'Which definitions may this caller see?', 'Tool catalog  /  triage access', true);
    catalog.forEach((r, i) => {
      const y = 220 + i * 88;
      mono(c, r.name, 76, y + 37, 31, P.pale, 435);
      mono(c, r.role, 564, y + 34, 23, P.light);
      if (filtered)
        mono(
          c,
          r.role === 'triage' ? 'Eligible' : 'Withheld',
          869,
          y + 35,
          25,
          r.role === 'triage' ? P.mint : P.rose,
        );
      line(c, 75, y + 58, 1123, y + 58, '#4d686b', 1);
    });
    return;
  }
  page(c, 'Which direction matches the query?', 'Tool catalog  /  permitted vectors', true);
  const ox = 120,
    oy = 540,
    scale = 335;
  arrow(c, ox, oy, ox + scale + 81, oy, P.light);
  arrow(c, ox, oy, ox, oy - scale - 10, P.light);
  const ordered = [ranked[1], ranked[0]];
  ordered.forEach((r, i) => {
    const x = ox + scale * r.vector[0],
      y = oy - scale * r.vector[1];
    const color = i ? P.brass : P.mint;
    arrow(c, ox, oy, x, y, color, 4);
    mono(c, i ? 'B' : 'A', x + 8, y, 24, color);
    if (cue(k, 5, i ? null : 'Do the same')) {
      line(c, x, y + 13, x, oy, color, 2, [5, 5]);
      mono(c, r.score.toFixed(1), x - 20, oy + 40, 23, color);
    }
  });
  label(c, 'Query [1, 0, 0]', 108, 620, P.light);
  label(c, b <= 4 ? 'Normalize each vector' : 'The task needs both reads', 635, 257, P.mint);
  if (b <= 4) {
    mono(c, 'A = [.6, .8, 0]', 635, 337, 27, P.light, 485);
    mono(c, 'B = [.8, .6, 0]', 635, 400, 27, P.light, 485);
    mono(c, 'cosine = unit(A) · unit(q)', 635, 500, 22, P.brass, 489);
  } else {
    rows(
      c,
      638,
      309,
      482,
      [
        ['A', 'Release status'],
        ['B', 'Release policy'],
      ],
      { dark: true, valueX: 64 },
    );
    if (cue(k, 7, 'It can read'))
      chip(c, '1 slot   ' + ranked[0].name, 635, 487, 456, P.mint, P.night);
    if (cue(k, 7, 'the job cannot finish'))
      text(c, 'Status read still missing', 636, 586, 25, P.rose);
  }
}
export function auditRuns(c, k) {
  if (cue(k, 3, 'Try a separate set')) {
    const corrected = cue(k, 3, 'The valid total');
    const { six, result } = violationRun(!!corrected);
    page(c, 'Can these counts be added?', 'Evaluation  /  six separate runs');
    label(c, 'Unauthorized reads per run', 78, 253);
    six.forEach((r, i) => {
      const x = 81 + 178 * i;
      slip(c, x, 296, 144, 157);
      label(c, 'Run ' + (i + 1), x + 24, 336);
      serif(
        c,
        String(r.unauthorized_reads),
        x + 22,
        410,
        57,
        r.unauthorized_reads === 0 ? P.teal : P.rust,
      );
    });
    if (result.ok)
      mono(
        c,
        'Total ' + result.data.reads + '   /   allowed 0     →     Hold release',
        79,
        555,
        27,
        P.rust,
        1045,
      );
    else if (cue(k, 3, 'Reject the malformed'))
      mono(c, 'Negative count   →   invalid evidence', 79, 555, 27, P.rust, 1045);
    return;
  }
  page(c, 'Which run sets the observed maxima?', 'Evaluation  /  typed receipts');
  const xs = [76, 220, 385, 544, 697];
  const names = ['Run', 'Passed', 'Rounds', 'Time (ms)', 'Cost (¢)'];
  names.forEach((n, i) => label(c, n, xs[i], 242));
  receipts.forEach((r, i) => {
    const y = 291 + i * 60;
    if (i === 2 && cue(k, 2, 'Our caps are')) box(c, 66, y - 33, 752, 52, '#efd1b3', 3);
    [i + 1, String(r.passed), r.rounds, r.latency_ms, r.cost_cents.toFixed(1)].forEach((v, j) =>
      mono(c, v, xs[j], y, 25, P.ink),
    );
  });
  line(c, 847, 213, 847, 538, P.rule);
  label(c, 'Caps', 875, 244);
  mono(c, '600 ms', 875, 311, 32);
  mono(c, '3.0 cents', 875, 373, 29);
  if (cue(k, 2, 'Find the slowest')) {
    mono(c, aggregate.passed + '/' + aggregate.total + ' pass', 875, 447, 25, P.ink);
    mono(c, aggregate.reads + aggregate.writes + ' violations', 875, 501, 22, P.ink);
  }
  if (cue(k, 3, 'both caps'))
    chip(c, aggregate.approved ? 'Release' : 'Hold release', 73, 558, 288, P.rust);
}
function protocol(c, k) {
  const hosts = protocolHosts.length,
    services = protocolServices.length;
  const shared = cue(k, 1, 'With the Model Context Protocol');
  const answer = cue(k, 2, 'Trace the connections again');
  page(
    c,
    shared ? 'Count the maintained integrations' : 'Connect each assistant to each service',
    'MCP  /  integration model',
    true,
  );
  const hostY = [274, 384, 494],
    serviceY = [246, 334, 422, 510];
  for (const { host, server } of protocolConnections) {
    const y = hostY[host], z = serviceY[server];
    if (shared) {
      const clientY = y + (server - (services - 1) / 2) * 16;
      line(c, 458, clientY, 507, clientY, P.mint, 2);
      circle(c, 507, clientY, 5, P.mint);
      line(c, 512, clientY, 732, z + (host - 1) * 9, '#85a99f', 2);
    } else line(c, 325, y, 862, z, '#779e96', 2);
  }
  if (shared) {
    label(c, 'Each dot is a dedicated client', 388, 211, P.mint);
    for (const y of hostY) {
      box(c, 245, y - 34, 220, 68, P.mint, 6);
      text(c, 'Client integration', 261, y + 9, 25, P.ink, 'Sans', 189, 600);
    }
    for (const y of serviceY) {
      box(c, 732, y - 26, 251, 52, P.brass, 6);
      text(c, 'Server implementation', 745, y + 8, 24, P.ink, 'Sans', 227, 600);
    }
  }
  hostY.forEach((y, i) => {
    if (!shared) circle(c, 325, y, 9, P.mint);
    mono(c, protocolHosts[i], 71, y + 9, 24, P.light);
  });
  serviceY.forEach((y, i) => {
    if (!shared) circle(c, 862, y, 9, P.brass);
    mono(c, protocolServices[i], shared ? 999 : 893, y + 9, 24, P.light);
  });
  if (!shared && cue(k, 1, 'twelve separate'))
    mono(c, hosts + ' × ' + services + ' = ' + protocolConnections.length + ' pair adapters', 73, 610, 28, P.light);
  if (answer)
    mono(c, hosts + ' client integrations + ' + services + ' server implementations = ' + (hosts + services) + ' pieces of code', 73, 610, 26, P.light, 1054);
}
export function mcp(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 3) {
    protocol(c, k);
    return;
  }
  page(
    c,
    b < 5 ? 'Call through the protocol' : 'Review the current server catalog',
    'MCP  /  article revision 2026-07-28',
  );
  if (b < 5) {
    rows(
      c,
      74,
      240,
      1046,
      [
        ['tools/list', 'name, inputSchema'],
        ['tools/call', 'name, arguments'],
        ['Request metadata', 'protocol version + client capabilities'],
        ['Client identity', 'name and version recommended'],
      ],
      { dy: 76, valueX: 335 },
    );
  } else {
    slip(c, 72, 238, 512, 279);
    label(c, 'Server description', 100, 287);
    mono(c, 'readOnlyHint: true', 100, 374, 28, P.ink, 456);
    text(c, 'Catalog metadata', 100, 453, 23, P.dim);
    label(c, 'Execution check', 640, 287);
    serif(c, 'Caller’s permission', 638, 373, 37, P.ink, 470);
    text(c, 'Review identity, schema, data and scope.', 640, 453, 23, P.teal, 'Sans', 466);
    mono(c, 'A forbidden operation stays denied.', 78, 592, 28, P.rust, 1051);
  }
}
export function budget(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    page(c, 'Follow one book lookup', 'Runtime  /  evidence trail');
    const stages = [
      ['Proposal', 'lookup_book(B7)'],
      ['Host check', 'Lena · catalog read'],
      ['Service reply', 'read-7 · 3 copies'],
    ];
    stages.forEach(([title, value], i) => {
      const x = 67 + i * 367;
      slip(c, x, 263, 328, 205);
      label(c, title, x + 23, 319);
      mono(c, value, x + 23, 403, 25, P.ink, 286);
      if (i < 2) arrow(c, x + 327, 362, x + 362, 362);
    });
    return;
  }
  const one = cue(k, 2, 'Reserve the first'),
    firstDone = cue(k, 2, 'File that failure');
  const two = cue(k, 2, 'A second attempt'),
    lastDone = cue(k, 2, 'Where can the host');
  const {
    reserved: attempts,
    ms,
    cents: cost,
  } = budgetState(
    Number(Boolean(one)) + Number(Boolean(two)),
    Number(Boolean(firstDone)) + Number(Boolean(lastDone)),
  );
  page(c, 'Is there room for another attempt?', 'Dispatcher  /  one end-to-end budget');
  [
    [attempts, 2, 'Attempts', ''],
    [ms, 1000, 'Time', ' ms'],
    [cost, 2, 'Spend', '¢'],
  ].forEach(([v, max, name, unit], i) => {
    const y = 245 + i * 96;
    label(c, name, 78, y + 15);
    gauge(c, 300, y - 4, 517, v, max, null, unit);
    mono(c, v + ' / ' + max + unit, 867, y + 19, 27, P.ink, 266);
  });
  if (b === 3) chip(c, 'Dispatch stopped', 77, 554, 355, P.rust);
}
export function comparison(c, k) {
  const aSeen = cue(k, 1, 'B scored'),
    bSeen = cue(k, 1, null);
  const requested = cue(k, 3, 'Read B on Q one'),
    fresh = cue(k, 3, null);
  const compare = sameSuiteToolComparison([finalReads[0], finalReads[fresh ? 2 : 1]]);
  const delta = compare.ok && cue(k, 5, 'The old receipt');
  const b = k.beat.beatIndex + 1;
  page(c, 'Which release scored higher on Q1?', 'Evaluation desk  /  read-only session', true);
  label(c, 'Release A', 177, 231, P.mint);
  label(c, 'Release B', 575, 231, P.mint);
  for (const [i, id] of ['Q1', 'Q2'].entries()) {
    mono(c, id, 65, 326 + i * 138, 27, P.brass);
    line(c, 65, 370 + i * 138, 940, 370 + i * 138, '#4b6e6a', 1);
  }
  finalReads.forEach((r, i) => {
    const visible = [aSeen, bSeen, fresh][i];
    const x = r.release === 'A' ? 173 : 569,
      y = r.suite === 'Q1' ? 255 : 393;
    if (!visible) {
      if (i === 2 && requested) {
        box(c, x, y, 347, 100, '#21434a', 5);
        mono(c, 'c33  ·  reading B', x + 16, y + 61, 22, P.light, 318);
      }
      return;
    }
    slip(c, x, y, 347, 100, i === 1 ? '#e2d9c8' : P.pale);
    mono(c, r.call_id + '    ' + r.release + ' / ' + r.suite, x + 21, y + 36, 19, P.dim, 311);
    serif(c, r.score.toFixed(2), x + 20, y + 84, 43, P.ink);
    if (r.gate) label(c, 'Gate ' + r.gate, x + 149, y + 78, P.teal, 175);
  });
  label(c, 'Extra reads left', 960, 263, P.light, 160);
  serif(c, requested ? '0' : '1', 976, 337, 63, P.brass);
  if (delta)
    mono(
      c,
      'Q1    0.86 − 0.83 = +' + compare.delta.toFixed(2) + ' for A',
      74,
      586,
      27,
      P.mint,
      752,
    );
  if (b >= 6) {
    const removed = cue(k, 6, 'Take that field off'),
      extra = !removed;
    const shape = extra && cue(k, 6, 'The host rejects');
    const role = cue(k, 7, 'The promotion count');
    const result = proposeA(extra);
    const s = role
      ? 'Role denied'
      : shape
        ? 'Extra field rejected'
        : extra
          ? 'approved: true'
          : 'release_id: A';
    if (cue(k, 6, 'promote A')) {
      label(c, 'Promotion of A', 947, 374, P.mint, 210);
      mono(c, s, 946, 414, 19, role || shape ? P.rose : P.light, 221);
    }
    if (role) {
      label(c, 'Promotions', 947, 477, P.light, 182);
      serif(c, result.effects, 947, 538, 48, P.pale);
    }
  }
}
