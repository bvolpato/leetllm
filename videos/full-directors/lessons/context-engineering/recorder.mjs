import { C, fmt, smooth } from './art.mjs';
import {
  trace,
  lock,
  scoped,
  notes,
  probe,
  tools,
  selectTools,
  completeToolIntersection,
  prefix,
} from './examples.mjs';

function channel(a, x, y, w, name, record, reading) {
  a.sheet(x, y, w, 172, C.white);
  a.label(name, x + 30, y + 58, C.dim);
  a.mono(record.trace, x + 30, y + 132, 57, C.ink);
  const mark = x + w * 0.53;
  for (let i = -4; i <= 4; i++)
    a.rule(
      mark + i * 19,
      y + 87,
      mark + i * 19,
      y + (i ? 102 : 127),
      i ? C.edge : C.teal,
      i ? 2 : 6,
    );
  a.mono('t ' + record.at, mark, y + 64, 30, C.teal);
  a.text(reading, x + w - 30, y + 134, 46, C.ink, { bold: true, align: 'right', width: w * 0.32 });
}
export function opening(a) {
  const scroll = smooth(a.move(1, 'Follow this callback', 1.3)),
    align = smooth(a.move(2, 'Slide the lock check', 1.25));
  const erased = a.at(3, 'Erase the guess'),
    checked = a.at(3, 'The detector saw'),
    packet = a.at(4, 'Send the investigation instructions');
  a.housing(76, 140, 1060, 690);
  a.label('RUN-842     /     EVENT RECORDER', 122, 231, C.mist, 31);
  a.rule(122, 278, 1084, 278, C.steel, 4);
  channel(
    a,
    126 - 70 * (1 - scroll),
    320,
    955,
    'trace-17   /callback',
    trace,
    'HTTP ' + trace.status,
  );
  if (align > 0) {
    channel(
      a,
      126 + 170 * (1 - align),
      531,
      955,
      'lock-check',
      lock,
      lock.locked ? 'PRESENT' : 'ABSENT',
    );
    if (align === 1) a.rule(632, 492, 632, 531, C.pale, 4);
  } else a.label('Lock detector channel', 135, 622, C.mist);
  a.sheet(1192, 221, 635, 525, erased ? C.white : C.blush);
  a.label(packet ? 'NEXT CALL' : checked ? 'CHECKED FINDING' : 'INCIDENT NOTE', 1232, 302, C.dim);
  if (!erased) {
    a.title('Migration lock?', 1230, 431, 66);
    if (a.at(1, 'proposed a rollback')) a.text('Propose rollback', 1232, 534, 43, C.brick);
    a.label('Hypothesis', 1232, 664, C.brick);
  } else if (checked) {
    a.title('Lock absent', 1232, 423, 70);
    a.mono(scoped.trace + '   ·   t ' + scoped.at, 1232, 507, 40);
    a.box(1192, 605, 635, 88, C.pale);
    a.mono('Source   ' + scoped.source, 1232, 663, 38, C.teal);
  }
  if (packet) {
    a.label('Working set', 103, 913);
    a.text(
      'Investigate /callback     +     trace_lookup     +     trace-17     +     checked note',
      103,
      981,
      43,
      C.ink,
      { width: 1715 },
    );
  } else if (a.at(2, 'Would you carry') && !erased)
    a.title('Carry the lock explanation forward?', 120, 948, 65, C.brick);
  else if (checked) a.title('Why did the callback fail?', 120, 949, 61);
}
export function position(a) {
  const score = a.b >= 6;
  a.label('RUN-842     /     ' + (score ? 'CONTROLLED PROBE' : 'REQUEST DEPTH'), 108, 100);
  if (score) {
    a.title('Same status question, twelve cases', 102, 217, 65);
    const front = a.at(6, 'ten successes'),
      mid = a.at(6, 'Seven in the middle');
    [
      ['Beginning', probe.front, front],
      ['Middle', probe.middle, mid],
    ].forEach(([nm, n, on], j) => {
      const y = 380 + j * 153;
      a.text(nm, 108, y + 14, 44);
      for (let i = 0; i < probe.n; i++) {
        const x = 510 + i * 85;
        if (on) a.tick(x, y, i < n);
        else a.dot(x, y, 16, C.edge);
      }
      a.mono(on ? n + '/' + probe.n : '?', 1570, y + 16, 48);
    });
    if (a.at(6, 'twenty-five percentage-point'))
      a.title('25 percentage points lower in the middle', 108, 734, 59, C.teal);
    if (a.at(7, 'five of eight'))
      a.strip(102, 800, 1040, 'Separate two-source probe', '5 of 8   ·   62.5%', null, C.ice);
    return;
  }
  const both = a.at(4, 'Now ask a different question'),
    sweep = smooth(a.move(4, 'Move the same record', 3.4));
  const x = 210 + 1440 * (both ? 0.2 : a.b < 4 ? 0.2 : sweep);
  a.title(
    both
      ? 'Did the scope change matter?'
      : a.b === 1
        ? '128,000-token input limit'
        : 'Where is the decisive record?',
    105,
    217,
    72,
  );
  a.housing(100, 327, 1720, 228);
  for (let i = 0; i <= 40; i++)
    a.rule(210 + i * 36, 391, 210 + i * 36, i % 5 === 0 ? 453 : 416, C.mist, i % 5 === 0 ? 4 : 2);
  a.dot(x, 460, 20, C.amber);
  a.mono('trace-17', x - 68, 516, 28, C.white);
  if (both) {
    const deployX = 210 + 1440 * 0.6;
    a.dot(deployX, 460, 19, C.ice);
    a.mono('deploy-record', deployX - 76, 516, 28, C.white);
  }
  a.strip(104, 639, 790, 'trace-17', trace.path + '    ' + trace.status, trace.trace);
  if (both) a.strip(953, 639, 865, 'deploy-record', 'OAuth scope changed', 'rev 7', C.ice);
  if (both && a.at(5, 'which scope'))
    a.text('Next check     Which scope did the callback require?', 110, 927, 50, C.teal);
  else if (a.b < 4)
    a.text(
      a.b === 1 ? 'The old lock guess also fits.' : 'Keep the evidence and answer key fixed.',
      110,
      917,
      49,
    );
}
const defects = [
  [
    'Poisoning',
    '“Migration lock”',
    'Guess copied into recap',
    'Remove both copies',
    'Lock absent · R17 · t 100',
  ],
  [
    'Distraction',
    'Repeat search',
    'Same empty search again',
    'Select new trace',
    'trace-17 · /callback',
  ],
  ['Confusion', 'cluster_admin', 'Overlapping tool choices', 'Expose read tools', 'trace_lookup'],
  [
    'Clash',
    'XML in runbook',
    'Application requires JSON',
    'Quote XML as data',
    'JSON output contract',
  ],
];
export function edits(a) {
  a.label('RUN-842     /     REQUEST ASSEMBLY', 108, 96);
  a.title(
    a.b < 3 ? 'Four ways a packet goes wrong' : 'Edit the packet before planning',
    105,
    200,
    65,
  );
  const seen = [
    true,
    a.at(1, 'Re-running'),
    a.at(1, 'Selecting an inappropriate'),
    a.at(1, 'A retrieved instruction'),
  ];
  const fixed = [
    a.at(3, 'remove the false claim'),
    a.at(3, 'select the new evidence'),
    a.at(4, 'narrow the tool schemas'),
    a.at(4, 'preserve the retrieved passage'),
  ];
  defects.forEach((d, i) => {
    const y = 286 + i * 158;
    a.rule(106, y + 109, 1808, y + 109, C.edge);
    if (!seen[i]) return;
    a.label(d[0].toUpperCase(), 106, y + 47, C.dim, 29);
    a.text(fixed[i] ? d[3] : d[1], 474, y + 49, 44, fixed[i] ? C.teal : C.brick, { font: 'Serif' });
    a.route(985, y + 38, 1076, y + 38, fixed[i] ? C.teal : C.edge, 3);
    a.text(fixed[i] ? d[4] : d[2], 1123, y + 49, 37);
  });
  if (a.b === 5)
    a.label('Matched tasks   /   change one assembly choice per comparison', 109, 990, C.teal, 30);
}
export function storeNotes(a) {
  const stored = a.at(2, 'Serialize the records'),
    loaded = a.at(2, 'read them back');
  if (a.b === 3) {
    const slide = smooth(a.move(3, 'Reloading a note', 1.3));
    a.label('RUN-842    /    READ FROM STORE', 104, 103);
    a.title('Which observation does this call need?', 104, 213, 66);
    a.housing(100, 340, 710, 476);
    a.label('notes.json', 151, 429, C.mist);
    a.mono(notes[0].source, 152, 528, 41, C.white);
    a.mono(notes[1].source, 152, 658, 41, C.pale);
    a.label('Both records stay on disk', 152, 755, C.mist, 26);
    a.label('Next model input', 1000, 414);
    a.strip(
      300 + 695 * slide,
      486,
      804,
      'R17    /    observation at t 100',
      'No migration lock',
      notes[1].source,
      C.pale,
    );
    if (slide === 1) a.text('This note counts toward input.', 1002, 773, 43, C.teal);
    return;
  }
  a.label('RUN-842     /     WRITE', 100, 104);
  a.title('Keep the way back to each observation', 100, 207, 65);
  a.housing(98, 302, 770, 540);
  a.label('ARCHIVE', 151, 389, C.mist);
  channel(a, 145, 437, 673, 'trace-17', trace, '403');
  a.mono('lock-check    R17   t 100   absent', 156, 733, 29, C.white);
  const x = 1010 - 75 * (1 - smooth(a.move(2, 'Write both findings', 1.2)));
  if (a.b >= 2) {
    a.sheet(x, 329, 781, 476);
    a.label(stored ? 'notes.json   /   saved' : 'Pending notes', x + 42, 421);
    a.text(notes[0].path + ' returned ' + notes[0].status, x + 42, 518, 49);
    a.mono(notes[0].source, x + 42, 567, 32, C.teal);
    a.rule(x + 41, 596, x + 733, 596, C.edge);
    a.text('Lock absent at t ' + notes[1].at, x + 42, 669, 46);
    a.mono(notes[1].source + '    ' + notes[1].trace, x + 42, 727, 32, C.teal);
  } else a.text('Which facts can travel?', 1004, 552, 58, C.dim, { font: 'Serif' });
  if (loaded) a.text('Read back   ·   both source IDs retained', 1030, 916, 37, C.teal);
}
export function scope(a) {
  if (a.b === 1) {
    a.label('NOTE STORE    /    confirmed', 108, 109);
    a.title('Who gets to mark a finding checked?', 103, 220, 63);
    ['"true"', '1', 'true'].forEach((v, i) => {
      const x = 128 + 578 * i;
      a.sheet(x, 361, 500, 372);
      a.label(['STRING', 'NUMBER', 'BOOLEAN'][i], x + 30, 448);
      a.mono(v, x + 37, 580, 87, C.ink);
      if (a.at(1, 'function rejects') && i < 2) a.badge('Rejected type', x + 26, 635, 300, C.brick);
      if (i === 2 && a.at(1, 'Only the host')) a.badge('Host verifies source', x + 26, 635, 370);
    });
    return;
  }
  const changed = a.at(2, 'A later source revision');
  a.label('NOTE STORE    /    REVISION CHECK', 108, 105);
  a.strip(
    104,
    205,
    1130,
    'lock-check · rev 7',
    'No lock in this transaction',
    'R17  /  t 100',
    C.pale,
  );
  a.stepRow(112, 496, 1290, 'Checked revision', '7');
  a.stepRow(
    112,
    609,
    1290,
    'Current source revision',
    changed ? '8' : '7',
    changed ? C.brick : C.teal,
  );
  a.text(
    changed ? 'Recheck against revision 8.' : 'Scope ends at this observation.',
    112,
    761,
    57,
    changed ? C.brick : C.teal,
    { font: 'Serif' },
  );
  if (a.b === 3)
    a.label(
      'Reload needs read access, fresh evidence and a relevant question.',
      112,
      922,
      C.ink,
      29,
    );
}
export function patchbay(a, complete) {
  let phase = 'investigate',
    available = tools;
  if (complete) {
    if (a.at(2, 'Switch to proposal')) phase = 'propose';
    if (a.at(2, 'An unknown phase')) phase = 'unknown';
    if (a.at(2, 'If trace lookup is unavailable')) {
      phase = 'investigate';
      available = tools.filter((t) => t !== 'trace_lookup');
    }
  } else {
    if (a.at(2, 'A later proposal phase')) phase = 'propose';
    if (a.at(3, 'An unknown phase')) phase = 'unknown';
  }
  const ids = (complete ? completeToolIntersection : selectTools)(phase, available);
  a.label(
    complete
      ? 'ARTICLE POLICY    /    CATALOG INTERSECTION'
      : 'SMALL POLICY    /    PHASE SELECTOR',
    105,
    106,
  );
  a.title(
    phase === 'unknown'
      ? 'Unknown phase'
      : phase === 'propose'
        ? 'Propose a change'
        : 'Investigate the callback',
    101,
    220,
    68,
  );
  a.housing(90, 282, 1740, 627);
  a.label('AVAILABLE SCHEMAS', 150, 366, C.mist);
  a.label('NEXT REQUEST', 1130, 366, C.mist);
  tools.forEach((id, i) => {
    const y = 444 + i * 91,
      exists = available.includes(id),
      idx = ids.indexOf(id);
    a.mono(id, 154, y + 10, 32, exists ? C.white : C.mist);
    if (!exists) {
      a.rule(151, y - 2, 420, y - 2, C.amber, 4);
      a.label('offline', 490, y + 6, C.amber, 24);
    }
    a.dot(722, y, 17, C.mist);
    a.dot(722, y, 10, C.night);
    if (idx >= 0) {
      const far = 445 + idx * 112;
      const wire = [C.pale, C.ice, C.amber][idx];
      const mid = 792 + idx * 65;
      a.rule(722, y, mid, y, wire, 5);
      a.rule(mid, y, mid, far, wire, 5);
      a.rule(mid, far, 1070, far, wire, 5);
      a.dot(1070, far, 9, wire);
      a.mono(id, 1120, far + 12, 37, C.white);
    }
  });
  if (!ids.length) a.text('No schemas exposed', 1118, 553, 46, C.amber);
  a.label(ids.length + ' connected', 1130, 834, C.pale, 30);
  if (a.b === 3) a.text('At execution, check caller identity, scope and action.', 113, 987, 42);
}
export function prefixSplice(a) {
  if (a.b === 1) {
    const reused = a.at(1, 'reuse the saved states'),
      suffix = a.at(1, 'processes the remaining input'),
      decode = a.at(1, 'decodes the output');
    a.label('PREFILL    /    ATTENTION STATES', 105, 100);
    a.title('What work can the server reuse?', 103, 209, 70);
    a.housing(95, 331, 1720, 428);
    a.label('INPUT TOKENS', 142, 414, C.mist);
    for (let i = 0; i < 24; i++) {
      const x = 151 + i * 64,
        old = i < 16,
        col = old ? (reused ? C.pale : C.ice) : suffix ? C.amber : C.steel;
      a.box(x, 466, 53, 62, col);
      a.box(x, 536, 53, 62, col);
    }
    a.label('K', 1742, 509, C.mist);
    a.label('V', 1742, 580, C.mist);
    a.label(reused ? 'Reuse compatible K/V states' : 'Build keys and values', 150, 682, C.white);
    if (suffix) a.label('Process suffix', 1195, 682, C.amber);
    if (decode) a.text('Decode the next output token', 103, 909, 58, C.teal, { font: 'Serif' });
    return;
  }
  const [early, late] = prefix;
  const [root, header, doc] = early.segments.map(({ units }) => units);
  const motion = a.move(4, 'Slide the changing header', 2.6);
  // Lift both headers clear of their lanes, slide the document left, then seat the headers.
  const clamp = (p) => Math.max(0, Math.min(1, p));
  const lift = smooth(clamp(motion / 0.2)) * smooth(clamp((1 - motion) / 0.2));
  const shift = smooth(clamp((motion - 0.2) / 0.6));
  const x = 240,
    end = 1710,
    u = (end - x) / early.length;
  const headerX = x + u * (root + doc * shift),
    docX = x + u * (root + header * (1 - shift));

  const earlyAnswer = a.after(4, 'The first match stops at ninety-six', 'ninety-six');
  const lateAnswer = a.after(
    4,
    'Now the common prefix is three hundred fifty-two tokens',
    'three hundred fifty-two',
  );
  const total = a.after(
    4,
    'Each complete request still contains three hundred sixty-four',
    'three hundred sixty-four',
  );
  const common =
    shift === 0 && earlyAnswer ? early.common : motion === 1 && lateAnswer ? late.common : null;
  const question =
    a.b === 3 && a.at(3, 'where does the match stop')
      ? 'Where does the match stop?'
      : !lateAnswer && a.at(4, 'Read the ruler again')
        ? 'Where does the match stop now?'
        : '';

  a.label('PREFILL    /    TOKEN COMPARISON', 103, 101);
  a.title('Two requests on one token ruler', 102, 209, 70);
  if (total) a.text(fmt(late.length) + ' tokens each', end, 277, 38, C.ink, { align: 'right' });
  if (a.b === 5)
    a.text('Check the provider’s cached input count.', 105, 277, 38);
  else if (a.b === 6)
    a.text('Phase tools first  ·  fixed document  ·  changing notes', 105, 277, 38);
  else if (a.at(3, 'a twelve-token header'))
    a.text('Changing header: ' + header + ' tokens per request', 105, 277, 38);
  if (shift > 0 && earlyAnswer && a.b === 4)
    a.text('Header first · ' + fmt(early.common) + ' matched', 850, 277, 38, C.dim);

  a.housing(92, 300, 1735, 595);
  a.label('Tokens', 128, 368, C.mist, 27);
  a.rule(x, 399, end, 399, C.mist, 2);
  for (let t = 0; t < early.length; t += 16) {
    const xx = x + t * u;
    a.rule(xx, 399, xx, t % 64 ? 389 : 379, C.mist, 2);
    if (t % 64 === 0)
      a.text(t, xx, 368, 28, C.mist, { align: 'center', font: 'Mono' });
  }
  a.rule(end, 399, end, 379, C.mist, 2);

  function block(start, y, units, color, label) {
    a.box(start, y, units * u, 65, color);
    for (let t = 8; t < units; t += 8)
      a.rule(start + t * u, y + 53, start + t * u, y + 65, C.steel, 1);
    a.text(label, start + units * u / 2, y + 44, 34, C.ink, { align: 'center' });
  }
  [early.first, early.second].forEach((row, i) => {
    const y = 516 + i * 183;
    const headerY = y - 60 * lift;
    a.text(i === 0 ? 'A' : 'B', 156, y + 46, 43, C.white, { font: 'Mono' });
    block(x, y, root, C.ice, 'Root · ' + root);
    block(docX, y, doc, C.pale, 'Fixed document · ' + doc);
    a.box(headerX, headerY, header * u, 52, C.amber);
    a.box(headerX, headerY, u, 52, C.brick);
    a.rule(headerX, headerY - 9, headerX, headerY, C.amber, 2);
    a.text(row[root], headerX, headerY - 15, 34, C.amber, { font: 'Mono', align: 'center' });
  });

  if (common !== null) {
    const stopX = x + common * u;
    a.rule(stopX, 768, stopX, 795, C.pale, 4);
    a.rule(x, 775, x, 795, C.pale, 4);
    a.rule(x, 785, stopX, 785, C.pale, 4);
    a.mono(fmt(common) + ' matching tokens', x, 854, 44, C.white);
  } else if (question) a.text(question, x, 851, 44, C.white);
}
export function cacheMeter(a) {
  const miss = a.at(5, 'cached input count drops to zero');
  const total = prefix[1].length,
    cached = miss ? 0 : prefix[1].common;
  a.label('SERVING    /    INPUT METER', 107, 105);
  a.title('What does a cache hit buy?', 104, 208, 69);
  a.label('Logical input', 108, 330);
  a.bar(108, 368, 1640, 105, [cached, total - cached], total, [C.teal, C.gold]);
  a.mono(miss ? total + ' uncached' : cached + ' reused', 135, 438, 45, C.white);
  a.text(total + ' tokens', 1748, 535, 49, C.ink, { align: 'right' });
  if (a.b <= 2) {
    a.strip(
      108,
      626,
      1060,
      'Content inspection',
      'A cached lock guess is still a guess.',
      null,
      C.blush,
    );
    a.text('Inspect evidence', 1196, 735, 45);
  } else {
    const rows = ['Cache writes', 'Cache reads', 'Uncached input', 'Output'];
    rows.forEach((v, i) => {
      const x = 109 + i * 435;
      a.rule(x, 660, x + 365, 660, C.edge, 3);
      a.text(v, x, 729, 40);
      a.label('usage × rate', x, 800, C.dim, 26);
    });
    a.text(
      a.b === 3
        ? 'Apply the provider’s rates and request modifiers.'
        : a.b === 4
          ? 'Check document access before building the request.'
          : miss
            ? 'Cached input   0     ·     same 364-token request'
            : 'Move the request to a route with an empty cache.',
      108,
      933,
      42,
    );
  }
}
