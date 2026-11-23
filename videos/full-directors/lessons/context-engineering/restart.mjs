import { C, fmt, smooth } from './art.mjs';
import {
  trace,
  lock,
  checkedLock,
  hash,
  smallReceipts,
  contextResumeFixture,
  completeResume,
  ledger,
  readers,
  trials,
  savedFinding,
  recover,
  negativeRoll,
  finalPack,
  CONTEXT_FRESH,
  restarts,
} from './examples.mjs';

const hex = (digest) => digest.slice(0, 10);
function digestLine(a, y, name, saved, now, checked) {
  const equal = now === saved;
  a.text(name, 122, y + 11, 39);
  a.mono(hex(saved), 691, y + 11, 42);
  a.mono(hex(now), 1243, y + 11, 42, checked ? (equal ? C.teal : C.brick) : C.ink);
  if (checked) a.tick(1690, y - 4, equal);
  a.rule(124, y + 42, 1735, y + 42, C.edge, 2);
}
export function bytes(a) {
  let idx = a.at(2, 'Change the deployment input') ? 1 : 0;
  if (a.at(3, 'restore the input')) idx = 0;
  if (a.at(3, 'change the artifact itself')) idx = 2;
  const s = smallReceipts[idx];
  const checked = [
    a.at(1, 'An unchanged artifact'),
    a.at(3, 'input check fails'),
    a.at(3, 'The report hash fails'),
  ][idx];
  a.label('RESTART    /    TRUSTED RECEIPT', 106, 103);
  a.title('Are these the bytes the evaluator checked?', 102, 210, 65);
  a.label('File', 125, 349);
  a.label('Saved', 691, 349);
  a.label('Current', 1243, 349);
  digestLine(a, 461, 'Incident report', s.saved.artifact, s.artifact, checked);
  digestLine(
    a,
    608,
    'Deploy rev ' + (idx === 1 ? '8' : '7'),
    s.saved.inputs.deploy,
    s.deploy,
    checked,
  );
  if (checked) {
    a.badge(
      s.result.passed
        ? 'Continue from checked work'
        : 'Recheck ' + (idx === 1 ? 'deployment input' : 'incident report'),
      123,
      766,
      660,
      s.result.passed ? C.teal : C.brick,
    );
  } else a.text('Continue?', 122, 822, 57, C.gold, { font: 'Serif' });
}
function graph(a, x, y, states, labels = ['Collect traces', 'Verify cause', 'Write report']) {
  const w = 475,
    g = 93;
  states.forEach((s, i) => {
    const xx = x + i * (w + g);
    if (i > 0) {
      const col = states[i - 1] === 'checked' ? C.teal : C.dim;
      a.rule(xx - g, y + 92, xx - 10, y + 92, col, 5);
      a.rule(xx - 23, y + 81, xx - 9, y + 92, col, 4);
      a.rule(xx - 23, y + 103, xx - 9, y + 92, col, 4);
    }
    a.sheet(xx, y, w, 191, s === 'checked' ? C.pale : s === 'ready' ? C.amber : C.white);
    a.label(s, xx + 30, y + 64, s === 'checked' ? C.teal : s === 'ready' ? C.ink : C.dim);
    a.text(labels[i], xx + 29, y + 143, 49, C.ink, { font: 'Serif', width: w - 50 });
  });
}
const resumeGraph = contextResumeFixture();
const nextTask = completeResume(resumeGraph.tasks, resumeGraph.files, resumeGraph.receipts).next;
export function artifacts(a) {
  const list = [
    ['Task manifest', 'IDs, prerequisites, criteria'],
    ['Progress log', 'Attempts and errors'],
    ['Bootstrap check', 'Environment'],
    ['Work receipt', 'Bytes and evaluator'],
    ['Recovery rule', 'Retry and escalation'],
  ];
  a.label('RESTART    /    SHIFT HANDOFF', 106, 102);
  a.title(a.b < 4 ? 'What does each file remember?' : 'Which task is ready?', 104, 209, 69);
  if (a.b < 4) {
    list.forEach(([nm, s], i) => {
      const y = 298 + i * 124,
        hit =
          a.b === 1
            ? a.at(
                1,
                [
                  'task manifest',
                  'progress log',
                  'bootstrap command',
                  'work receipt',
                  'recovery rule',
                ][i],
              )
            : i === 1 || i === 3;
      a.box(116, y + 4, 12, 75, hit ? C.teal : C.edge);
      a.text(nm, 165, y + 51, 44, hit ? C.ink : C.dim, { font: 'Serif' });
      a.text(s, 811, y + 50, 39, hit ? C.teal : C.dim);
    });
  } else {
    const got = a.at(4, 'The next ready task');
    graph(a, 116, 376, ['checked', got ? 'ready' : 'pending', 'waiting']);
    a.strip(115, 695, 1021, 'progress.log', '“All done”', null, C.blush);
    if (got) a.text('Next   /   ' + nextTask, 1195, 817, 41, C.teal);
  }
}
export function graphContract(a) {
  const added = a.at(4, 'manifest also requires');
  a.label('CHECKPOINT    /    ACCEPTANCE CONTRACT', 107, 102);
  if (a.b <= 2) {
    a.title('Check every edge before trusting “done”', 104, 214, 65);
    graph(
      a,
      119,
      413,
      a.b === 1 ? ['marked done', 'pending', 'pending'] : ['checked', 'ready', 'waiting'],
    );
    if (a.b === 1) {
      a.rule(1460, 397, 1460, 311, C.brick, 4);
      a.rule(1460, 311, 363, 311, C.brick, 4);
      a.rule(363, 311, 363, 393, C.brick, 4);
      a.rule(349, 378, 363, 394, C.brick, 5);
      a.rule(377, 378, 363, 394, C.brick, 5);
      a.text('A return edge would close a cycle. Reject that graph.', 118, 826, 46, C.brick);
    } else a.text('With this acyclic graph, verify cause is ready.', 118, 826, 48, C.teal);
    return;
  }
  a.title('Compare the set of declared inputs', 105, 213, 69);
  a.label('Task manifest', 122, 345);
  a.label('Trusted receipt', 992, 345);
  a.strip(111, 401, 805, 'Required input', 'deploy.json', null, C.white);
  a.strip(984, 401, 810, 'Saved input digest', 'deploy.json', null, C.pale);
  if (added) {
    a.strip(111, 602, 805, 'Additional required input', 'authorization.json', null, C.ice);
    a.rule(995, 695, 1775, 695, C.brick, 3);
    a.label('No corresponding digest', 1005, 665, C.brick, 33);
    a.badge('Dependent task held', 114, 853, 545, C.brick);
  } else a.text('Verify task, evaluator, version, Boolean pass and every digest.', 116, 789, 44);
  if (a.b === 5) a.label('Read paths inside the checkpoint boundary.', 815, 896);
}
export function execution(a) {
  const boundary = a.b === 3;
  a.label('RUN-842    /    ' + (boundary ? 'RESOURCE LOG' : 'EVALUATOR'), 107, 102);
  if (boundary) {
    a.title('One operation key, one pending outcome', 104, 211, 66);
    a.label('Key', 121, 342);
    a.label('Fence', 479, 342);
    a.label('Resource decision', 819, 342);
    const visible = a.at(3, 'resource rejects') ? 3 : a.at(3, 'Sending the same key') ? 2 : 1;
    ledger.slice(0, visible).forEach((e, i) => {
      const y = 463 + i * 151;
      a.mono(e.key, 121, y, 56);
      a.mono(e.fence, 487, y, 56);
      a.text(
        {
          'unknown; reconcile': 'Response missing',
          'already pending; reconcile': 'Already pending · reconcile',
          'stale fence': 'Stale writer rejected',
        }[e.status],
        818,
        y,
        48,
        i === 2 ? C.brick : C.teal,
      );
      a.rule(117, y + 41, 1790, y + 41, C.edge, 2);
    });
    a.mono('Resource fence   12', 124, 947, 42);
    return;
  }
  const removed = Boolean(checkedLock) && a.at(2, 'It keeps');
  a.title(
    a.b === 4 ? 'Who can issue the receipt?' : removed ? 'What still needs checking?' : 'Which line of the draft would you change?',
    104,
    211,
    65,
  );
  if (a.b === 4) {
    a.strip(108, 387, 817, 'Appended progress entry', '“Done”', null, C.blush);
    a.strip(981, 387, 817, 'Protected receipt writer', 'Verified result', null, C.pale);
    a.text('Authenticate the writer. Recheck live state when freshness matters.', 110, 804, 44);
  } else {
    const inspected = a.at(1, 'Read the trace beside');
    a.label('Source records', 115, 320);
    a.strip(110, 360, 760, 'trace-17    ' + trace.path, 'HTTP ' + trace.status, trace.trace + '    t ' + trace.at);
    if (inspected)
      a.strip(110, 574, 760, 'lock-check', lock.locked ? 'Migration lock present' : 'No migration lock', lock.trace + '    t ' + lock.at);

    a.sheet(942, 286, 858, 553);
    a.label('RUN-842   /   CAUSE ANALYSIS', 985, 365);
    a.stepRow(985, 459, 770, removed ? 'Cause' : 'Claimed cause', removed ? 'Open' : 'Migration lock');
    if (removed) {
      a.label('Finding from ' + checkedLock.source, 985, 551, C.teal);
      a.text('No migration lock for ' + lock.trace + ' at time ' + lock.at, 985, 620, 43, C.ink, { width: 770 });
    } else {
      a.stepRow(985, 564, 770, 'Cited source', 'trace-17');
    }
    a.stepRow(985, 729, 770, 'Rollback', 'Proposal', C.gold);
    if (a.at(2, 'would have to approve'))
      a.label('Approval required from the ' + restarts[0].role, 986, 807, C.dim, 27);
    if (a.at(2, 'Compare the scope'))
      a.text('Next check    ·    Scope required by callback vs. scope granted by deployment', 112, 941, 43, C.ink, { width: 1670 });
  }
}
export function protectedFact(a) {
  const show = a.at(2, 'candidate packet supplies'),
    decide = a.at(3, 'candidate is rejected');
  a.label('PAIRED SUITE    /    SIX SOURCE LOOKUPS', 106, 100);
  a.title('Which answer disappeared?', 104, 209, 71);
  a.label('Question', 119, 317);
  a.label('Baseline', 902, 317);
  a.label('Candidate', 1398, 317);
  readers[0].rows.forEach((r, i) => {
    const y = 394 + i * 78,
      other = readers[1].rows[i];
    if (r.critical) a.box(103, y - 43, 1690, 70, C.amber);
    a.text(r.question, 119, y + 4, 36, C.ink);
    a.mono(r.source, 702, y + 4, 30);
    a.text(r.answer, 902, y + 4, 34, r.pass ? C.teal : C.dim);
    if (show) a.text(other.answer, 1398, y + 4, 34, other.pass ? C.teal : C.brick);
  });
  a.mono(readers[0].score + '/6', 902, 908, 51);
  if (show) a.mono(readers[1].score + '/6', 1398, 908, 51);
  if (decide) a.badge('Hold   ·   authorizer missing', 113, 861, 630, C.brick);
}
export function release(a) {
  const retest = a.after(3, 'change just case two from fail to pass', false);
  const v = trials[retest ? 1 : 0];
  const protectedCase = v.rows.findIndex((row) => row.critical);
  const markProtected = a.at(2, 'The yellow mark');
  const firstTotal = a.after(2, 'Correct answers rise from seven to eight', 'seven to eight');
  const retestTotal = a.after(5, 'Nine cases pass', 'Nine cases pass');
  const showVerdict = retest
    ? a.after(5, 'The release rule now accepts the candidate for this suite', 'now accepts')
    : a.after(3, 'Hold it at case two', 'Hold it at case two');
  a.label('PAIRED SUITE    /    TEN INCIDENT CASES', 105, 99);
  a.title('Would you ship this request?', 103, 209, 73);
  const x = 376,
    y = 451,
    step = 141;
  const protectedX = x + protectedCase * step;
  if (markProtected) a.box(protectedX - 49, 299, 99, 365, C.amber);
  v.rows.forEach((r, i) => {
    const xx = x + i * step;
    a.text(i + 1, xx, 363, 31, C.ink, { align: 'center', font: 'Mono' });
    a.tick(xx, y, r.raw);
    a.tick(xx, y + 128, r.curated);
  });
  a.text('Raw', 110, y + 15, 45);
  a.text('Curated', 110, y + 141, 45);
  if (markProtected) a.label('Protected', protectedX - 72, 717, C.gold);
  if (firstTotal) {
    const curated = retest && !retestTotal ? '?' : v.curated;
    a.mono(`${v.raw}/${v.total}  →  ${curated}/${v.total}`, 111, 845, 56);
  }
  const poison = v.rows.reduce((sum, row) => sum + row.poison, 0);
  a.label(
    fmt(v.rawUnits) + ' → ' + fmt(v.curatedUnits) + ' units    ·    ' + poison + ' poisoning events',
    111,
    932,
  );
  if (showVerdict)
    a.badge(
      v.approved ? 'Pass this suite' : 'Hold at case ' + (protectedCase + 1),
      1164,
      788,
      564,
      v.approved ? C.teal : C.brick,
    );
  else if (markProtected) a.text('Release   ?', 1180, 852, 54, C.gold, { font: 'Serif' });
}
export function lookup(a) {
  const bare = a.at(1, 'trim off its source ID') && !a.at(3, 'pin its source ID');
  const note = savedFinding(bare ? null : 'trace-17');
  const tried = a.at(2, 'Try the lookup'),
    again = a.at(3, 'Try the same lookup');
  const result = again ? recover(note) : null;
  a.label('RUN-842    /    NEGATIVE ARCHIVE', 104, 103);
  a.title('Which record did this sentence come from?', 105, 213, 66);
  const showArchive = a.b === 1 || again;
  if (showArchive) {
    for (const [i, [id, r]] of Object.entries(negativeRoll).entries()) {
      const x = 113 + i * 874;
      a.sheet(x, 318, 818, 239, result && id === note.source ? C.pale : C.ice);
      a.mono(id, x + 30, 404, 38, C.ink);
      a.mono('HTTP ' + r.status, x + 30, 514, 67, C.ink);
      a.mono(r.path, x + 468, 507, 35, C.dim);
    }
  } else
    a.text(
      bare
        ? 'Lookup key missing. The archive cannot choose a record.'
        : 'Source ID recovered. Repeat the lookup.',
      116,
      481,
      49,
      bare ? C.brick : C.teal,
    );
  a.strip(113, 669, 986, 'Saved finding', note.finding, note.source || 'ID omitted', C.white);
  if (result) {
    a.route(1100, 761, 1274, 761, C.teal);
    a.mono(result.status, 1321, 799, 87, C.teal);
  } else if (tried) a.label(bare ? 'Unresolved lookup' : 'Lookup pending', 1188, 780, C.brick, 32);
}
function practicePack(a) {
  const events = finalPack.events;
  const n =
    a.b === 1
      ? 0
      : a.at(2, 'runbook brings the total')
        ? 5
        : a.at(2, 'Try the old export')
          ? 4
          : a.at(2, 'Together they use')
            ? 3
            : 0;
  const used = n ? events[n - 1].used : 0;
  a.label('SHIFT CHANGE    /    ALLOCATION', 106, 99);
  a.title('Which optional record fits?', 104, 208, 70);
  CONTEXT_FRESH.forEach((r, i) => {
    const y = 319 + i * 95;
    a.text(r.id === 'authorization' ? 'Approval policy' : r.id, 115, y + 29, 40);
    a.mono(fmt(r.units), 674, y + 28, 41);
    a.label(r.required ? 'required' : 'optional', 958, y + 25, r.required ? C.teal : C.dim);
    if (i < n)
      a.text(
        events[i].fits
          ? 'Packed'
          : (a.at(2, 'Skip it') ? 'Skip · ' : '') + 'would use ' + fmt(events[i].attempted),
        1274,
        y + 28,
        35,
        events[i].fits ? C.teal : C.brick,
      );
  });
  a.bar(
    111,
    827,
    1690,
    73,
    events
      .slice(0, n)
      .filter((e) => e.fits)
      .map((e) => e.units),
    2600,
    [C.teal, C.blue, C.gold, C.violet],
  );
  a.mono(
    n
      ? fmt(used) + ' used  /  2,600     ' + fmt(2600 - used) + ' free'
      : '2,600 units available after reserves',
    110,
    979,
    43,
  );
}
export function finalShift(a) {
  if (a.b < 3) return practicePack(a);
  const changed = a.at(3, 'new revision of the trace arrives'),
    fresh = a.at(5, 'evaluator issues a fresh receipt');
  const state = restarts[fresh ? 2 : changed ? 1 : 0],
    opened = a.at(5, 'Reopen the revised trace'),
    compared = a.at(5, 'Both say R seventeen'),
    stopped = changed && a.at(5, 'Stop') && !fresh;
  if (a.b <= 5) {
    a.label('COLLECTION    /    ' + (fresh ? 'FRESH RECEIPT' : 'SAVED RECEIPT'), 107, 102);
    a.title(
      opened
        ? 'Check the revised trace against the report'
        : 'Will the saved collection receipt still match?',
      104,
      201,
      63,
    );
    a.label('File', 119, 309);
    a.label('Saved', 690, 309);
    a.label('Current', 1245, 309);
    Object.keys(state.saved).forEach((id, i) =>
      digestLine(
        a,
        399 + i * 97,
        id,
        state.saved[id],
        hash(state.files[id]),
        !changed || stopped || fresh,
      ),
    );
    const report = state.report,
      t = state.trace;
    a.strip(
      104,
      714,
      812,
      'Saved report',
      report.trace + '    HTTP ' + report.observed,
      null,
      C.white,
    );
    if (stopped) a.badge('Stop · saved receipt no longer matches', 107, 925, 806, C.brick);
    if (opened) {
      a.strip(
        990,
        714,
        812,
        'Reopened trace   /   rev ' + t.revision,
        t.trace + '    HTTP ' + t.status,
        null,
        C.ice,
      );
      if (compared)
        a.label(
          fresh ? 'Fresh receipt covers report + both inputs' : 'ID and status agree',
          990,
          964,
          C.teal,
          31,
        );
    } else {
      a.text(
        changed ? 'Trace revision ' + t.revision : 'Trace revision 1',
        1021,
        819,
        46,
        C.dim,
      );
    }
    return;
  }
  const loaded = a.at(7, 'Read the approval policy back');
  const count =
    finalPack.used - (loaded ? 0 : CONTEXT_FRESH.find((r) => r.id === 'authorization').units);
  a.label('SHIFT CHANGE    /    NEXT MODEL CALL', 106, 100);
  if (a.b < 8) {
    a.title('Who can approve a rollback?', 104, 205, 70);
    const selected = finalPack.selected.filter((id) => loaded || id !== 'authorization');
    selected.forEach((id, i) => {
      const y = 327 + i * 111;
      a.box(122, y - 28, 12, 55, id === 'authorization' ? C.gold : C.teal);
      a.text(id === 'authorization' ? 'Approval policy' : id, 169, y + 15, 43);
      a.mono(fmt(CONTEXT_FRESH.find((r) => r.id === id).units), 738, y + 16, 38);
    });
    a.mono(fmt(count) + ' units in call', 118, 861, 47);
    a.strip(1003, 395, 798, 'Receipt on disk', 'All fingerprints match', null, C.pale);
    a.text(
      loaded ? 'Authorizer    ' + state.role : 'Authorizer    ?',
      1005,
      730,
      51,
      loaded ? C.teal : C.brick,
    );
  } else {
    a.title('Why did R17 return 403?', 104, 219, 78);
    graph(a, 112, 359, ['checked', 'ready', 'waiting']);
    a.strip(
      117,
      684,
      1686,
      'Next comparison',
      'Scope required by callback     /     Scope granted by deploy',
      null,
      C.ice,
    );
  }
}
