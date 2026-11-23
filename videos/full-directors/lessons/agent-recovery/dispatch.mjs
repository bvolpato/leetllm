import {
  C,
  arrow,
  center,
  dot,
  footer,
  heading,
  lamp,
  line,
  mix,
  mono,
  packet,
  plate,
  poly,
  rack,
  rr,
  screen,
  slip,
  tag,
  terminal,
  txt,
} from './art.mjs';
import {
  admit,
  after,
  before,
  clockLabel,
  key,
  keys,
  payload,
  read,
  report,
  write,
} from './examples.mjs';

export function opening(g, { b, cue }) {
  const travel = cue(1, 'Follow the approved rollback', 1.4);
  const saved = cue(2, 'saves job one'),
    reply = cue(2, 'reply starts back', 0.85),
    cut = cue(2, 'cut the return connection');
  const timeout = cue(2, 'sees a timeout'),
    hold = cue(3, 'Leave the second send on hold'),
    lookup = cue(3, 'look up the original operation');
  heading(g, 'Run 842   /   Dispatch', 'What arrived at the controller?');
  terminal(g, 40, 176, 231, 179, {
    label: payload.run,
    primary: timeout ? 'Timed out' : travel === 1 ? 'Awaiting reply' : 'Sending',
    minor: payload.revision + ' · rollback',
    color: timeout ? C.red : C.teal,
  });
  rack(g, 680, 151, 240, 219, {
    main: saved ? after.job.id + '   ' + after.job.state : '',
    sub: 'Rollback queue',
    count: saved ? after.jobCount : 0,
  });
  line(g, 271, 203, 680, 203, C.steel, 5);
  mono(g, 'Request', 309, 180, 14, C.steel);
  if (!saved) packet(g, mix(318, 631, travel), 203, payload.revision, 87);
  if (travel === 1) dot(g, 672, 203, 7, C.pine);
  line(g, 271, 289, cut ? 464 : 680, 289, cut ? '#b6b2a3' : C.steel, 4, cut ? [5, 8] : []);
  if (cut) {
    line(g, 494, 289, 680, 289, C.steel, 4);
    line(g, 468, 281, 485, 298, C.brick, 4);
    line(g, 485, 281, 468, 298, C.brick, 4);
  }
  mono(g, 'Reply', 309, 264, 14, C.steel);
  if (reply && !cut) packet(g, mix(647, 483, reply), 289, 'job-1', 75, C.teal);
  if (cut) mono(g, 'Injected reply loss', 479, 322, 14, C.brick, { align: 'center' });
  tag(g, 'rev-17 approved', 50, 386, 203, C.brass);
  if (hold) tag(g, 'Send 2 on hold', 306, 386, 184, '#d9c9ae');
  footer(
    g,
    lookup
      ? 'Look up the original operation before choosing another action.'
      : hold
        ? 'The deadline passed without a reply. The agent still needs a controller record.'
        : timeout
          ? 'From the agent’s side, what does the timeout establish?'
          : saved
            ? 'Job 1 is on the controller’s side of the connection.'
            : 'The operator controls which change the agent may send.',
  );
}

export function admission(g, { b, cue }) {
  const denied = b === 3 && cue(3, 'permission denial'),
    writing = b === 2,
    repaired = cue(3, 'corrected proposal'),
    field = b === 3 && !repaired ? 'run_id' : 'id';
  const proposal = writing ? write : { ...read, field, run: denied ? 'RUN-843' : payload.run },
    verdict = admit(proposal);
  const checked =
    b === 1
      ? cue(1, 'admits the read')
      : b === 2
        ? cue(2, 'gate stops it')
        : repaired
          ? cue(3, 'Check the corrected proposal again')
          : cue(3, 'bounded repair');
  heading(g, 'Task scope   /   Run 842', 'Which proposal may pass?');
  slip(g, 36, 162, 239, 151, 'Operator’s request', [
    'Read status',
    payload.run,
    'Permission: read',
  ]);
  plate(g, 356, 141, 240, 222);
  mono(g, 'ADMISSION GATE', 381, 171, 14, C.brass);
  ['Registered tool', 'Argument schema', 'Authorized target'].forEach((name, i) => {
    const fails = writing || denied ? i === 2 : field !== 'id' && i === 1;
    lamp(g, 388, 208 + i * 42, checked && (field === 'id' || i < 2), fails ? C.red : C.teal);
    txt(g, name, 409, 215 + i * 42, 18, C.ivory);
  });
  line(g, 275, 333, 356, 333, C.steel, 5);
  line(g, 596, 333, 680, 333, C.steel, 5);
  packet(g, 290, 333, writing ? 'rollback' : 'get_run', 104, writing ? C.brass : C.blue);
  terminal(g, 676, 166, 244, 176, {
    kicker: 'DISPATCH',
    label: writing ? 'WRITE PROPOSAL' : 'READ PROPOSAL',
    primary: checked
      ? verdict === 'admitted'
        ? 'Read admitted'
        : verdict === 'outside scope'
          ? 'Stopped'
          : 'Repair field'
      : 'Pending check',
    minor: writing ? 'target  rev-17' : field + '  ' + proposal.run,
    color: checked && verdict !== 'admitted' ? C.red : C.teal,
  });
  if (checked && verdict === 'admitted') arrow(g, 602, 333, 671, 333, C.pine, 4);
  if (checked && verdict !== 'admitted') line(g, 608, 315, 608, 351, C.brick, 5);
  footer(
    g,
    denied
      ? 'Run 843 is outside this task. Permission denial stops the path.'
      : b === 3
        ? repaired
          ? 'The corrected field goes through the same gate.'
          : 'The tool expects id. A bounded repair can change the field.'
        : writing
          ? checked
            ? 'The status request leaves the rollback outside scope.'
            : 'Compare the proposed write with the operator’s request.'
          : 'Check the target against the task and the caller’s permissions.',
  );
}

export function identity(g, { b, cue }) {
  const k = cue(1, 'logical operation key'),
    sent = cue(1, 'On the first send'),
    second = cue(2, 'attempt two', 1.0),
    same = cue(2, 'Both carry the same key and payload'),
    replay = cue(2, 'returns job one');
  const changed = cue(3, 'revision eighteen', 0.85),
    conflict = cue(3, 'returns a conflict');
  heading(g, 'Controller index   /   One approved change', 'Which identity stays with the work?');
  slip(g, 37, 151, 282, 149, 'Saved operation', [
    k ? key : 'Rollback',
    payload.run,
    payload.revision,
  ]);
  const y1 = 190,
    y2 = 252;
  plate(g, 606, 139, 317, 216);
  mono(g, 'OPERATION INDEX', 632, 170, 15, C.brass);
  screen(g, 625, 185, 278, 105);
  if (sent) {
    mono(g, key, 643, 212, 19, C.teal);
    mono(g, payload.run + '  /  ' + payload.revision, 643, 239, 14, C.dim);
    txt(g, after.job.id + '   ' + after.job.state, 643, 273, 22, C.ivory, { font: 'Serif' });
    mono(g, '1 retained job', 632, 329, 15, C.dim);
    arrow(g, 323, y1, 597, y1, C.steel, 2.5);
    packet(g, 460, y1, 'attempt-1', 128, C.blue);
  } else {
    mono(g, 'Await first send', 643, 242, 18, C.dim);
  }
  if (second) {
    arrow(g, 323, y2, 597, y2, C.pine, 3);
    packet(g, mix(365, 513, second), y2, 'attempt-2', 128, C.teal);
  }
  if (same) mono(g, key + '  /  ' + payload.run + '  /  ' + payload.revision, 323, 284, 14, C.pine);
  if (changed > 0) {
    const cursor = mix(424, 506, changed);
    line(g, 326, 320, 594, 320, C.track, 3);
    line(g, 326, 320, cursor, 320, C.brick, 3);
    packet(g, cursor, 320, key + '  /  rev-18', 174, C.red);
  }
  if (replay) tag(g, 'reply   ' + after.replay, 37, 339, 205, C.teal);
  if (conflict) tag(g, after.changedPayload, 611, 373, 158, C.red);
  if (changed) mono(g, payload.revision + ' stored  ≠  rev-18 sent', 323, 365, 15, C.ink, { max: 266 });
  if (conflict) {
    txt(g, 'The revision changed. Job 1 stays queued.', 37, 413, 20);
  } else if (!changed) {
    txt(
      g,
      second
        ? 'Each send has a trace ID. Both refer to the same approved operation.'
        : 'The caller saves the key and the exact payload together.',
      37, 413, 20,
    );
  }
}

const transactionTrack = { stage: 32, commit: 208, faultBefore: 134, faultAfter: 320, reply: 382 };

function transaction(g, x, title, { cursor, committed, faultAt, rows, result, jobRead }) {
  const railY = 239;
  const { stage, commit, reply } = transactionTrack;
  plate(g, x, 132, 416, 281);
  mono(g, title, x + 22, 169, 16, C.brass);
  mono(g, payload.run + '  /  ' + payload.revision, x + 22, 195, 16, C.dim);
  line(g, x + stage, railY, x + reply, railY, C.track, 4);
  line(g, x + commit, railY - 17, x + commit, railY + 14, committed ? C.teal : C.dim, 2);
  mono(g, 'Commit', x + commit, railY + 36, 16, committed ? C.teal : C.dim, {
    align: 'center',
  });
  mono(g, 'Stage', x + stage, railY + 36, 15, C.dim);
  mono(g, 'Reply', x + reply, railY + 36, 15, C.dim, { align: 'right' });
  if (cursor != null) {
    line(g, x + stage, railY, x + cursor, railY, committed ? C.teal : C.brass, 4);
    if (!faultAt) dot(g, x + cursor, railY, 6, committed ? C.teal : C.brass);
  }
  if (faultAt) {
    const fx = x + faultAt;
    line(g, fx - 5, railY - 5, fx + 5, railY + 5, C.red, 3);
    line(g, fx + 5, railY - 5, fx - 5, railY + 5, C.red, 3);
    mono(g, 'Timeout', fx, railY - 15, 15, C.red, { align: 'center' });
  }
  for (const [i, label, value, checked] of rows) {
    const y = 290 + i * 40;
    rr(g, x + 22, y, 372, 34, 4, checked ? C.track : '#0f252b', checked ? C.teal : undefined);
    mono(g, label, x + 34, y + 23, 15, C.dim);
    mono(g, value, x + 152, y + 23, 18, checked ? C.teal : C.ivory);
  }
  if (jobRead) arrow(g, x + 378, 346, x + 378, 315, C.teal, 2);
  const status = result
    ? result.operationCount + result.jobCount + ' durable rows'
    : faultAt || committed
      ? 'Awaiting inspection'
      : rows.length
        ? 'Staged rows'
        : 'Same dispatch';
  mono(
    g,
    status,
    x + 22,
    393,
    16,
    result ? (committed ? C.teal : C.red) : C.brass,
  );
}
export function commit(g, { cue, during, settled }) {
  const job = settled(1, 'The jobs row holds the queued rollback'),
    operation = settled(1, 'The operation row binds the approved key and payload to that job'),
    towardFirstFault = during(2, 'Inject the first fault before commit'),
    rolledBack = settled(2, 'Both staged rows disappear'),
    replay = cue(2, 'Move only the fault'),
    towardCommit = during(2, 'after commit'),
    committed = settled(2, 'after commit'),
    towardFault = during(2, 'The reply vanishes again'),
    failedAfter = settled(2, 'The reply vanishes again'),
    survived = settled(2, 'This time, both rows survive'),
    lookup = settled(3, 'The operation row points to job one'),
    jobRead = settled(3, 'and the job row reads queued');
  const { stage, commit, faultBefore, faultAfter } = transactionTrack;
  const rows = [
    [0, 'jobs', after.job.id + '  ' + after.job.state, jobRead],
    [1, 'operations', key + ' → ' + after.job.id, lookup],
  ];
  heading(g, 'Local transaction   /   Fault injection', 'Which rows survive the fault?');
  transaction(g, 36, 'EXPERIMENT 1', {
    cursor: mix(stage, faultBefore, towardFirstFault),
    faultAt: towardFirstFault === 1 && faultBefore,
    rows: towardFirstFault === 1
      ? rows.map(([i, label]) => [i, label, rolledBack ? 'Absent' : 'Checking'])
      : rows.slice(0, job + operation),
    result: rolledBack && before,
  });
  transaction(g, 508, 'EXPERIMENT 2', {
    cursor: replay
      ? committed
        ? mix(commit, faultAfter, towardFault)
        : mix(stage, commit, towardCommit)
      : null,
    committed,
    faultAt: failedAfter && faultAfter,
    rows: replay
      ? rows.map(([i, label, value, checked]) => [
          i,
          label,
          checked ? value : survived ? 'Present' : committed ? 'Checking' : value,
          checked,
        ])
      : [],
    result: survived && after,
    jobRead,
  });
  footer(
    g,
    jobRead
      ? 'The operation points to a queued job. Check the executor for completion.'
      : survived
        ? 'The caller saw a timeout in both experiments. Only the second left records.'
        : replay
          ? 'Same key and payload. The fault moves to the other side of commit.'
          : 'The job and operation belong to one transaction.',
  );
}

export function resume(g, { b, cue }) {
  const request = cue(2, 'Read the controller', 0.8),
    seen = cue(2, 'At twelve oh five'),
    reported = cue(3, 'Report that job one');
  heading(g, 'Restart   /   Evidence by owner', 'What can the restarted agent report?');
  slip(g, 38, 152, 266, 163, 'Local checkpoint', ['Await rollback job', key, 'Receipt pending']);
  arrow(g, 304, 223, 549, 223, C.steel, 3);
  if (request > 0 && request < 1) packet(g, mix(350, 510, request), 223, key, 120);
  if (request === 1) mono(g, 'lookup by key', 426, 207, 14, C.pine, { align: 'center' });
  rack(g, 553, 133, 361, 208, {
    main: after.job.id + '   ' + after.job.state,
    sub: 'Controller’s durable state',
    count: 1,
  });
  if (seen) {
    arrow(g, 555, 309, 314, 309, C.pine, 3);
    packet(g, 431, 309, report.state, 98, C.teal);
    tag(g, 'Observed  ' + clockLabel(report.observedAt), 38, 353, 221, C.teal);
  }
  if (reported)
    txt(g, '“Job 1 was queued at ' + clockLabel(report.observedAt) + '.”', 323, 399, 26, C.pine, {
      font: 'Serif',
    });
  footer(
    g,
    reported
      ? 'The report names the job, observed state and observation time.'
      : seen
        ? 'Read the timestamp and the state before choosing a claim.'
        : 'A checkpoint describes where the local workflow stopped.',
  );
}

export function contract(g, { b, cue }) {
  if (b <= 2) {
    const first = cue(1, 'lets writer A enter first'),
      committed = cue(1, 'A commits job two'),
      matched = cue(1, 'Writer B checks after that commit'),
      second = keys.writers[0].job;
    heading(g, 'SQLite   /   File reopened', 'What do two competing writers receive?');
    slip(g, 35, 137, 243, 117, 'Worker A', [keys.keyB, 'Connection A']);
    slip(g, 35, 284, 243, 117, 'Worker B', [keys.keyB, 'Connection B']);
    arrow(g, 280, 197, 483, 197, C.steel, 3);
    arrow(g, 280, 345, 483, 345, C.steel, 3);
    if (first) packet(g, 377, 197, 'write first', 135, C.brass);
    if (matched) packet(g, 377, 345, 'read match', 135, C.teal);
    plate(g, 485, 142, 431, 250);
    mono(g, 'BEGIN IMMEDIATE', 510, 178, 16, C.brass);
    mono(g, key + '   →   ' + after.job.id, 510, 224, 19, C.ivory);
    if (committed) mono(g, keys.keyB + '   →   ' + second, 510, 268, 19, C.teal);
    mono(g, committed ? keys.total + ' jobs' : '1 job', 510, 331, 21, C.ivory);
    if (matched) mono(g, 'A and B receive ' + second, 510, 364, 16, C.dim);
    footer(
      g,
      b === 2
        ? 'A busy lock can still time out. Any lock retry shares the key and deadline.'
        : 'The second connection checks the key after the first writer commits.',
    );
    return;
  }
  if (b <= 4) {
    const stored = cue(3, 'saves that status'),
      replay = cue(3, 'returns the saved error'),
      pruned = cue(4, 'Once the entry is pruned'),
      v2 = cue(4, 'version-two example');
    heading(g, 'Versioned API   /   Idempotency', 'What does this service retain?');
    if (v2) {
      slip(g, 39, 140, 375, 193, 'Version two', [
        'Incomplete execution',
        'Retry failed work where possible',
        'Return updated result',
      ]);
    } else {
      slip(g, 39, 155, 274, 151, 'Executed request', [
        'Payment operation',
        'key-A',
        'Same parameters',
      ]);
      line(g, 313, 240, 452, 240, C.steel, 3);
    }
    plate(g, 452, 132, 464, 239);
    mono(g, 'VERSION ONE   /   FIRST EXECUTION', 478, 167, 14, C.brass);
    screen(g, 473, 186, 420, 123);
    mono(g, 'key-A', 495, 216, 15, C.dim);
    txt(
      g,
      pruned ? 'Entry pruned' : stored ? '500 · saved body' : 'Executing request',
      495,
      254,
      30,
      pruned ? C.brass : C.ivory,
      { font: 'Serif' },
    );
    mono(
      g,
      pruned ? 'Reuse can start new work' : replay ? 'Replay → same 500' : 'First execution',
      495,
      286,
      16,
      C.teal,
    );
    if (b === 4) mono(g, 'Pruning permitted after ≥ 24 h', 477, 345, 16, C.dim);
    footer(
      g,
      v2
        ? 'Version two may resume failed work and return an updated response.'
        : b === 4
          ? 'Check the retention window before reusing the key.'
          : 'A failure before execution leaves no executed result to replay.',
    );
    return;
  }
  const missed = cue(5, 'replies not found'),
    gated = cue(6, 'authorize access');
  heading(g, 'Status lookup   /   Authority', 'Whose record answers the question?');
  rack(g, 40, 157, 350, 212, {
    name: 'PRIMARY CONTROLLER',
    main: after.job.id + '  queued',
    sub: key,
    count: 1,
  });
  line(g, 390, 245, 565, 245, C.steel, 3, [6, 6]);
  center(g, 'replica lag', 479, 226, 15, C.brick);
  terminal(g, 566, 161, 350, 177, {
    kicker: 'REPLICA',
    label: key,
    primary: missed ? 'Not found' : 'Lookup pending',
    minor: 'Read may lag primary',
    color: C.brass,
  });
  if (gated) tag(g, 'Check tenant and caller access', 244, 395, 463, C.brass);
  footer(
    g,
    b === 6
      ? 'Stored results still require authentication and current access.'
      : missed
        ? 'An absent replica entry leaves the caller’s outcome unknown.'
        : 'Compare the replica’s response with the primary controller’s row.',
  );
}

export function workflow(g, { b, cue }) {
  const commit = cue(1, 'controller commits'),
    crash = cue(1, 'workflow crashes');
  const rewind = cue(1, 'Resume the last local step', 1.1);
  const sync = cue(3, 'synchronous save to succeed'),
    dispatch = cue(3, 'start the dispatch step');
  const history = cue(3, 'Temporal reconstructs'),
    recorded = cue(3, 'recorded Activity result');
  const serviceHasJob = commit;
  heading(
    g,
    'Workflow replay   /   Independent stores',
    b < 3 ? 'What moves when the workflow rewinds?' : 'Which event reached durable history?',
  );
  plate(g, 36, 139, 888, 258);
  mono(
    g,
    b === 2
      ? 'LANGGRAPH  /  THREAD CHECKPOINTS'
      : history && b >= 3
        ? 'TEMPORAL  /  ACTIVITY HISTORY'
        : b === 3
          ? 'ORIGINAL SEQUENCE  /  SLOW REPLAY'
          : 'WORKFLOW  /  LOCAL PROCESS',
    59,
    173,
    15,
    C.brass,
  );
  const x = [145, 464, 787],
    y = 233;
  line(g, x[0], y, x[2], y, C.track, 7);
  const marks = b === 3 ? [sync, dispatch, recorded] : [true, commit, false];
  const names =
    history && b >= 3
      ? ['Key recorded', 'Activity dispatched', 'Completion recorded']
      : ['Save identity', 'Dispatch', 'Save receipt'];
  names.forEach((name, i) => {
    dot(g, x[i], y, 12, marks[i] ? C.teal : C.track);
    center(g, name, x[i], 267, 17, C.ivory);
  });
  if (b === 1) {
    const pos = crash ? mix(x[1], x[0], rewind) : commit ? x[1] : x[0];
    poly(
      g,
      [
        [pos - 9, 201],
        [pos + 9, 201],
        [pos, 219],
      ],
      C.brass,
    );
    if (crash)
      mono(g, rewind === 1 ? 'restored cursor' : 'process interrupted', pos, 196, 13, C.brass, {
        align: 'center',
      });
  }
  line(g, 60, 287, 895, 287, C.track);
  mono(g, b >= 3 ? 'RETAINED ROW' : 'CONTROLLER', 60, 320, 14, C.dim);
  if (serviceHasJob) {
    mono(g, key + '     →     ' + after.job.id + '  ' + after.job.state, 235, 322, 21, C.teal);
  } else mono(g, 'No job yet', 235, 322, 19, C.dim);
  if (b === 2) {
    const async = cue(2, 'asynchronous mode'),
      exit = cue(2, 'Exit mode'),
      pending = cue(2, 'Pending writes');
    mono(
      g,
      async
        ? 'Async mode: the latest save can be lost on crash'
        : exit
          ? 'Exit mode: no intermediate save'
          : pending
            ? 'Pending writes preserve completed nodes within the failed step'
            : 'Durable backend needed across restart',
      61,
      365,
      17,
      C.ivory,
    );
  } else if (b === 3) {
    mono(
      g,
      recorded
        ? 'Use the recorded completion on replay'
        : history
          ? 'Reconstruct state from the event history'
          : sync
            ? 'Earlier step saved the key synchronously'
            : 'Wait for synchronous persistence before dispatch',
      61,
      365,
      17,
      C.ivory,
    );
  } else if (b === 4) {
    mono(g, 'No completion event  ·  Activity may run again', 61, 365, 17, C.red);
  }
  footer(
    g,
    b === 4
      ? 'The same remote job survives a missing local completion event. Reconcile its key.'
      : b === 3
        ? 'This comparison changes which local events were recorded.'
        : b === 2
          ? 'Persistence mode determines what local state can survive a crash.'
          : rewind
            ? 'The local cursor rewinds while the external job stays queued.'
            : 'The local receipt can still be missing after the external commit.',
  );
}
