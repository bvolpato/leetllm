import {
  C,
  arrow,
  band,
  cue,
  disc,
  label,
  lines,
  mix,
  mono,
  paper,
  path,
  rect,
  ruled,
  serif,
  socket,
  stage,
  title,
  traffic,
} from './drawing.mjs';
import {
  correlateResponses,
  continuationCase,
  executeStatusCall,
  requestEnvelope,
  validateStatusReply,
  validationFixture,
} from '../../../films/tool-protocol/model.mjs';
import { pauseRecord, statusPayload } from '../../../films/tool-protocol/fixtures.mjs';

const requests = [{ id: 1 }, { id: '1' }, { id: 3 }],
  arrivals = [3, '1', 1, 1];
export function slotState(t) {
  const stamps = [
    'Three arrives first',
    'then the string one',
    'then the integer one',
    'Another integer one',
  ];
  const received = arrivals.filter((id, i) => cue(t, 4, stamps[i])).map((id) => ({ id }));
  return { received, ...correlateResponses(requests, received) };
}
function pipes(c, t, childOff = false) {
  const y = 342;
  rect(c, 105, y, 327, 263, C.face, C.light, 2, 12);
  mono(c, 'PARENT', 144, y + 49, 30, C.mint);
  serif(c, 'Host', 144, y + 146, 65, C.white);
  rect(c, 1110, y, 365, 263, childOff ? C.grid : C.face, C.light, 2, 12);
  mono(c, 'DIRECT CHILD', 1142, y + 49, 28, C.light);
  serif(c, childOff ? 'Exited' : 'Python', 1141, y + 146, 63, childOff ? C.coral : C.white);
  arrow(c, 432, y + 64, 1110, y + 64, C.mint, 5);
  mono(c, 'stdin    JSON + LF', 500, y + 28, 29, C.mint);
  arrow(c, 1110, y + 188, 432, y + 188, C.gold, 5);
  mono(c, 'stdout   JSON + LF', 500, y + 149, 29, C.gold);
  path(
    c,
    [
      [1290, y + 263],
      [1290, y + 330],
      [1050, y + 330],
    ],
    C.light,
    4,
  );
  mono(c, 'stderr  /  diagnostics', 1050, y + 382, 29, C.light);
}
export function process(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, b <= 3);
  if (b <= 3) {
    title(
      c,
      'LOCAL TRANSPORT',
      b === 3 ? 'A five-second limit on the parent’s wait' : 'One JSON message per line',
      true,
    );
    const timeout = cue(t, 3, 'waits for it to exit');
    pipes(c, t, timeout);
    if (b === 1 && cue(t, 1, 'closes its input'))
      mono(c, 'EOF after the final line', 101, 768, 31, C.light);
    if (b === 2) {
      mono(c, 'Bound each line + captured bytes', 103, 745, 33, C.gold);
      if (cue(t, 2, 'File and network'))
        label(c, 'Isolate file and network access separately.', 105, 813, 32, { color: C.white });
    }
    if (b === 3) {
      const p = cue(t, 3, 'Give the child five seconds', 1.45);
      path(
        c,
        [
          [110, 756],
          [724, 756],
        ],
        C.grid,
        12,
      );
      path(
        c,
        [
          [110, 756],
          [110 + 614 * p, 756],
        ],
        C.gold,
        12,
      );
      if (cue(t, 3, 'raises TimeoutExpired')) mono(c, 'TimeoutExpired', 107, 812, 35, C.coral);
      if (cue(t, 3, 'helper process'))
        mono(c, 'Helper / remote job: unknown', 830, 812, 34, C.white);
    }
    return;
  }
  title(c, 'CORRELATION REPLAY', 'A string and an integer occupy different slots');
  const s = slotState(t);
  requests.forEach((r, i) => {
    const x = 125 + i * 463;
    const closed = s.matched.some((m) => m.id === r.id);
    rect(c, x, 323, 385, 259, closed ? C.face : C.white, C.rule, 3, 13);
    mono(
      c,
      typeof r.id === 'string' ? 'string' : 'integer',
      x + 36,
      377,
      32,
      closed ? C.light : C.secondary,
    );
    mono(c, JSON.stringify(r.id), x + 192, 468, 78, closed ? C.white : C.ink, 'center');
    mono(
      c,
      closed ? 'consumed' : 'pending',
      x + 193,
      548,
      27,
      closed ? C.mint : C.secondary,
      'center',
    );
  });
  mono(
    c,
    'Received   ' + s.received.map((r) => JSON.stringify(r.id)).join('   ·   '),
    124,
    677,
    42,
  );
  if (b === 5) {
    band(c, 125, 783, 'Duplicate integer 1', false);
    mono(c, 'null error  /  no-ID notification', 650, 781, 32);
  }
}

const f = validationFixture();
export function layers(c, t) {
  stage(c, false);
  const b = t.beat.beatIndex + 1;
  title(
    c,
    'A STATUS REQUEST',
    ['Dispatch sees the envelope', 'The tool sees a lookup', 'The host sees the observation'][
      b - 1
    ],
  );
  const id = [f.malformed.id, f.missing.id, f.expected.id][b - 1];
  paper(c, 96, 259, 781, 446);
  mono(c, 'REQUEST  ' + id, 150, 321, 32, C.secondary);
  mono(c, 'get_release_status', 150, 415, 45);
  mono(c, 'arguments', 150, 509, 30, C.secondary);
  mono(
    c,
    ['[ ]', '{ release_id: "missing-release" }', '{ release_id: "reranker-v17" }'][b - 1],
    150,
    588,
    38,
    C.ink,
    'left',
    663,
  );
  const col = [C.red, C.red, C.teal][b - 1],
    mid = 965;
  path(
    c,
    [
      [878, 480],
      [mid, 480],
    ],
    C.ink,
    6,
  );
  const ready = [
    cue(t, 1, 'returns a protocol error'),
    cue(t, 2, 'returns a completed result'),
    cue(t, 3, 'returned fields pass'),
  ][b - 1];
  disc(c, mid, 480, 16, ready ? col : C.secondary);
  if (ready) {
    mono(c, 'REPLY  ' + id, 1030, 335, 33, C.secondary);
    serif(c, ['Protocol error', 'Tool failure', 'Schema passes'][b - 1], 1023, 444, 55, col);
    mono(
      c,
      [
        'error: ' + f.protocolReply.error.code,
        'complete  /  isError: true',
        'release_id: reranker-v16',
      ][b - 1],
      1026,
      534,
      34,
      C.ink,
      'left',
      505,
    );
    if (b === 3 && cue(t, 3, 'Keep that reply')) band(c, 1025, 638, 'Retain in trace', false);
  }
}

const call = (args) => requestEnvelope(51, 'get_release_status', args);
export const argCases = [[], { release_id: [] }, { release_id: 'missing-release' }].map((args) => ({
  args,
  out: executeStatusCall(call(args)),
}));
export function statusReceipt(release) {
  const id = 53,
    reply = {
      jsonrpc: '2.0',
      id,
      result: {
        content: [],
        isError: false,
        resultType: 'complete',
        structuredContent: { ...statusPayload, release_id: release },
      },
    };
  return { reply, checks: validateStatusReply(reply, id, statusPayload.release_id) };
}
export function flagVerdict(result) {
  if (result.resultType === 'input_required') return 'Continue workflow';
  if (result.resultType !== undefined && result.resultType !== 'complete')
    return 'Unknown result type';
  if (result.isError !== undefined && typeof result.isError !== 'boolean')
    return 'Invalid flag type';
  return result.isError ? 'Tool failure' : 'Inspect payload';
}
export function contract(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, b <= 3);
  if (b <= 3) {
    title(c, 'REQUEST INSPECTION', 'Move the brackets through the dispatcher', true);
    const n = cue(t, 2, 'a missing release') ? 2 : cue(t, 1, 'Move those brackets') ? 1 : 0;
    const { args, out } = argCases[n];
    mono(c, 'tools/call   /   get_release_status', 107, 268, 35, C.light);
    paper(c, 96, 331, 1404, 211);
    mono(c, 'arguments', 150, 389, 28, C.secondary);
    mono(c, JSON.stringify(args), 146, 477, 58, C.ink, 'left', 1260);
    const passed = out.layer === 'tool';
    const routed = passed && cue(t, 1, 'can now deliver');
    const stopped = !passed && cue(t, 1, 'returns a protocol error');
    const lineColor = routed ? C.mint : stopped ? C.coral : C.light;
    socket(c, 142, 654, true);
    path(
      c,
      [
        [163, 654],
        [700, 654],
      ],
      lineColor,
      6,
    );
    socket(c, 720, 654, true, lineColor);
    mono(c, 'Dispatcher', 105, 717, 29, C.white);
    mono(c, routed ? 'Status tool' : 'Dispatch boundary', 616, 717, 29, C.white);
    if (
      stopped ||
      (passed && cue(t, 2, 'returns a completed result'))
    ) {
      mono(
        c,
        passed ? out.resultType + '  /  isError: ' + out.isError : 'error  /  ' + out.code,
        925,
        651,
        38,
        passed ? C.gold : C.coral,
      );
    }
    if (b === 3)
      label(c, 'Bad JSON, version, method or tool name can also stop dispatch.', 102, 810, 33, {
        color: C.light,
      });
    return;
  }
  if (b <= 6) {
    title(c, 'REPLY INSPECTION', 'Open the envelope before inspecting the payload');
    const malformed = cue(t, 6, 'string false'),
      skipped = cue(t, 5, 'omitted flag'),
      failure = cue(t, 5, 'true flag'),
      unknown = cue(t, 5, 'Reject an unknown'),
      input = cue(t, 5, 'Input required'),
      legacy = cue(t, 4, 'omitted result type');
    const result = malformed
      ? { isError: 'false' }
      : skipped
        ? {}
        : failure
          ? { isError: true }
          : unknown
            ? { resultType: 'extension' }
            : input
              ? { resultType: 'input_required' }
              : {};
    paper(c, 117, 251, 1350, 469);
    mono(c, 'JSON-RPC RESPONSE', 177, 311, 30, C.secondary);
    mono(c, legacy ? 'result' : 'id   /   exact type and value', 179, 391, 42);
    if (!legacy) {
      mono(c, 'result XOR error', 178, 505, 49, C.teal);
      if (cue(t, 4, 'Handle a protocol error'))
        band(c, 177, 641, 'error → protocol failure', false);
      return;
    }
    mono(c, 'resultType', 181, 480, 32, C.secondary);
    mono(c, result.resultType || '(omitted → complete)', 482, 480, 35);
    if (!result.resultType || result.resultType === 'complete') {
      mono(c, 'isError', 181, 555, 32, C.secondary);
      mono(
        c,
        result.isError === undefined ? '(omitted → false)' : JSON.stringify(result.isError),
        482,
        555,
        35,
      );
    }
    band(
      c,
      181,
      649,
      flagVerdict(result),
      ['Inspect payload', 'Continue workflow'].includes(flagVerdict(result)),
    );
    if (failure && !skipped && !malformed)
      mono(c, 'even with valid-looking fields', 700, 649, 29, C.secondary);
    return;
  }
  title(c, 'OBSERVATION INSPECTION', 'Compare the value inside the valid object');
  const repaired = cue(t, 8, 'instead returns seventeen'),
    r = statusReceipt(repaired ? statusPayload.release_id : 'reranker-v16');
  paper(c, 91, 234, 897, 486);
  mono(c, 'structuredContent', 150, 297, 37, C.secondary);
  Object.entries(r.reply.result.structuredContent).forEach(([k, v], i) => {
    const y = 407 + 99 * i;
    mono(c, k, 151, y, 32, C.secondary);
    mono(c, v, 438, y, 42, C.ink, 'left', 493);
  });
  mono(c, 'REQUESTED', 1040, 305, 28, C.secondary);
  serif(c, 'reranker-v17', 1037, 393, 58);
  if (cue(t, 7, 'The schema passes')) mono(c, 'Schema passes', 1040, 517, 33, C.teal);
  if (cue(t, 8, 'Sixteen cannot') && (!repaired || cue(t, 8, 'both pass')))
    band(c, 1040, 626, r.checks.admitted ? 'Target matches' : 'Wrong release', r.checks.admitted);
  if (b === 9)
    mono(c, 'Draft 2020-12   /   check source and observation time', 94, 798, 31, C.secondary);
}

export const reason = 'Canary exceeded its error budget.';
export function rollbackState(t) {
  const form = !!cue(t, 3, 'Reply twenty comes back');
  const answered = !!cue(t, 3, 'The operator enters the reason');
  const prepared = !!cue(t, 3, 'prepares request twenty-one');
  const approved = !!cue(t, 4, 'checks the operator');
  const sent = !!cue(t, 4, 'then sends request');
  const verified = !!cue(t, 4, 'rechecks current permission');
  const applied = !!cue(t, 4, 'applies the rollback');
  const decision = continuationCase({ hostAllowed: approved, serverAllowed: verified });
  const effects = Number(applied && sent && decision.outcome === 'admit under current permission');
  return {
    form,
    answered,
    prepared,
    approved,
    sent,
    verified,
    showEffects: !!cue(t, 4, 'Zero'),
    effects,
    reason: answered ? reason : '',
    state: pauseRecord.state,
  };
}
export function rollback(c, t) {
  const b = t.beat.beatIndex + 1,
    s = rollbackState(t);
  stage(c, true);
  if (b === 1) {
    title(c, 'CANARY MONITOR   /   separate run', 'Errors accumulated on the v17 canary', true);
    ruled(c, 124, 295, 1312, 333, 48, C.grid);
    const limitY = 429;
    path(
      c,
      [
        [124, limitY],
        [1436, limitY],
      ],
      C.gold,
      3,
      [13, 12],
    );
    mono(c, 'Error budget', 1210, limitY - 32, 28, C.gold);
    const crossing = cue(t, 1, 'canary crosses', 1.25);
    const stages = [
      [130, 578],
      [376, 571],
      [506, 568],
      [707, 535],
      [827, 529],
    ];
    stages.push([mix(827, 1003, crossing), mix(529, 389, crossing)]);
    path(c, stages, C.mint, 7);
    disc(c, ...stages.at(-1), 10, C.mint);
    if (cue(t, 1, 'operator requests'))
      mono(c, 'Operator requests rollback of v17', 119, 732, 38, C.gold);
    if (cue(t, 1, 'host starts')) mono(c, 'Host starts local server', 120, 809, 30, C.white);
    return;
  }
  if (b === 2) {
    title(c, 'ROLLBACK   /   reranker-v17', 'One line on each pipe', true);
    pipes(c, t);
    return;
  }
  mono(c, 'ROLLBACK   /   reranker-v17', 99, 63, 29, C.mint);
  const x = 96;
  mono(c, 'HOST + CLIENT', x, 148, 30, C.light);
  mono(c, 'DEPLOYMENTS', 1497, 148, 30, C.light, 'right');
  arrow(c, 117, 235, 1480, 235, C.mint, 5);
  mono(c, '20    tools/call    ·    forms available', x + 65, 204, 33, C.white);
  if (s.form) {
    arrow(c, 1478, 334, 117, 334, C.gold, 5);
    mono(c, '20    input_required    ·    state S7', x + 65, 301, 32, C.gold);
    const slide = cue(t, 3, 'Reply twenty comes back', 0.35);
    paper(c, 109, 365 + 12 * (1 - slide), 665, 271);
    mono(c, 'rollback_reason', 161, 417, 30, C.secondary);
    serif(c, 'Why roll back v17?', 159, 490, 44);
    path(
      c,
      [
        [159, 585],
        [717, 585],
      ],
      C.rule,
      2,
    );
    if (s.answered) label(c, s.reason, 159, 553, 33, { width: 555 });
  }
  if (s.prepared) {
    const transfer = cue(t, 3, 'prepares request twenty-one', 0.5);
    arrow(c, 778, 521, 778 + 58 * transfer, 521, C.gold, 4);
    paper(c, 841, 365, 642, 271);
    mono(c, 'REQUEST 21   /   ' + (s.sent ? 'sent' : 'prepared'), 891, 414, 33);
    mono(c, 'request_rollback   v17', 891, 473, 31);
    mono(c, 'rollback_reason.reason', 891, 527, 26, C.secondary);
    if (transfer === 1) {
      label(c, s.reason, 891, 565, 29, { width: 535 });
      mono(c, 'requestState   ' + s.state, 891, 605, 26, C.teal);
    }
  }
  if (s.approved) mono(c, 'Host: approved for v17', 104, 681, 27, C.mint);
  if (s.verified) mono(c, 'Server: state + access verified', 848, 681, 27, C.mint);
  else if (cue(t, 4, 'verifies the returned state'))
    mono(c, 'Server verifies S7', 848, 681, 27, C.gold);
  traffic(c, 112, 762, 1350, 84, s.effects, {
    showResult: s.showEffects,
    caption: 'Applied traffic changes',
    dark: true,
  });
}
export function binding(c, t) {
  const b = t.beat.beatIndex + 1;
  stage(c, false);
  if (b <= 2 || b === 9) {
    title(
      c,
      'OPERATOR INPUT',
      b === 9 ? 'A destination needs consent' : 'A question has a key and an owner',
    );
    paper(c, 117, 248, 1348, 487);
    mono(
      c,
      b === 9 ? 'URL mode   /   sensitive interaction' : 'deployments    /    reply 20',
      180,
      319,
      36,
      C.secondary,
    );
    serif(
      c,
      b === 9 ? 'Open account.example?' : 'Why should reranker-v17 roll back?',
      177,
      434,
      58,
    );
    if (b === 9) {
      mono(c, 'Destination shown   →   consent   →   navigate', 184, 564, 37, C.teal);
      mono(c, 'Returned data goes through host policy.', 183, 660, 31);
      return;
    }
    mono(c, 'rollback_reason.reason', 181, 534, 29, C.secondary);
    if (cue(t, 1, 'If she accepts')) label(c, reason, 182, 594, 41);
    mono(
      c,
      b === 2 ? 'Retry 21    /    requestState = S7' : 'Accept   /   Decline   /   Cancel',
      181,
      679,
      32,
      C.teal,
    );
    return;
  }
  if (b === 8) {
    title(c, 'REPLY MISSING', 'A sent write has an unresolved outcome');
    mono(c, 'Host sent the approved write', 117, 292, 40);
    arrow(c, 119, 361, 1378, 361, C.teal, 6);
    path(
      c,
      [
        [1378, 429],
        [780, 429],
      ],
      C.red,
      5,
      [12, 14],
    );
    mono(c, 'No receipt', 840, 483, 35, C.red);
    traffic(c, 118, 618, 800, 133, null);
    if (cue(t, 8, 'check the backend'))
      lines(c, 1000, 589, ['Inspect backend', 'Same key if supported'], { size: 33, gap: 78 });
    return;
  }
  title(c, 'SERVER CONTINUATION RECORD', 'What did the server bind to S7?');
  const changed =
    b === 5
      ? cue(t, 5, 'Change just the target')
      : b === 6
        ? 1
        : b === 7
          ? 1 - cue(t, 7, 'Put version seventeen back')
          : 0;
  const revoked = !!cue(t, 7, 'permission expired');
  const a = continuationCase({
    target: changed ? 'reranker-v18' : pauseRecord.target,
    serverAllowed: !revoked,
  });
  const rejectedTarget = changed && cue(t, 6, 'Reject this retry');
  const start = 112;
  paper(c, start, 235, 669, 473);
  paper(c, 823, 235, 672, 473);
  [start, 823].forEach((x, i) => {
    mono(c, i ? 'RESUMED REQUEST  21' : 'SEALED STATE  S7', x + 43, 296, 33, C.secondary);
    const target = i ? a.target : pauseRecord.target;
    const targetColor = i && rejectedTarget ? C.red : C.ink;
    serif(c, target, x + 43, 405, 60, targetColor);
    if (changed) path(c, [[x + 45, 449], [x + 380, 449]], targetColor, 3);
    mono(c, a.principal, x + 45, 501, 30, C.secondary);
    mono(c, a.operation + '   /   ' + a.echo, x + 45, 566, 30, C.secondary);
    const access = revoked ? 'permission expired' : 'current permission';
    mono(
      c,
      i ? access : 'unused   /   2 min left',
      x + 45,
      631,
      30,
      i && revoked ? C.red : C.secondary,
    );
  });
  if (b === 3) return;
  const verdict =
    b === 4
      ? cue(t, 4, 'this retry passes')
      : b === 5
        ? 0
        : b === 6
          ? rejectedTarget
          : revoked && cue(t, 7, 'server holds the write');
  if (verdict) {
    const good = a.outcome === 'admit under current permission';
    band(
      c,
      117,
      797,
      good
        ? 'Admit this retry'
        : revoked
          ? 'Hold for current permission'
          : 'Reject the changed target',
      good,
    );
  } else if (b === 5 && changed) serif(c, 'Can this pause move to v18?', 116, 794, 49);
}
