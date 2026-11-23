import { C, cue } from './printshop.mjs';
import {
  APPROVAL,
  cacheHit,
  labelCoverage,
  originalKey,
  practice,
  practiceRun,
  privateKey,
  releaseRecord,
  reportEligibility,
  samples,
  traces,
  unsafeCount,
  wilsonBounds,
} from './records.mjs';

function effects(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  if (e(4, 'larger set')) {
    g.title('Two rates, two populations');
    const xs = (v) => 515 + v * 1760;
    g.label('Supplied counts', 57, 142);
    g.label('Two-sided 95% Wilson interval', 513, 142, 390);
    for (const [i, [name, n, d, shown]] of [
      ['Unsafe traces', 10, 100, e(4, 'Ten of a hundred')],
      ['Benign blocks', 40, 1000, e(4, 'Forty of a thousand')],
    ].entries()) {
      const y = 192 + i * 156;
      g.text(name, 58, y, 26, C.ink, { face: 'Serif' });
      g.mono(
        shown ? n + ' / ' + d + '  =  ' + (100 * n) / d + '%' : 'Awaiting count',
        58,
        y + 53,
        27,
        shown ? C.teal : C.muted,
      );
      if (e(5, 'Compare the two-sided')) {
        const [lo, hi] = wilsonBounds(n, d);
        g.line(xs(0), y + 29, xs(0.2), y + 29, C.line, 2);
        g.line(xs(lo), y + 29, xs(hi), y + 29, C.teal, 8);
        g.dot(xs(n / d), y + 29, 8, C.ink);
        g.mono((lo * 100).toFixed(1) + '–' + (hi * 100).toFixed(1) + '%', 516, y + 76, 20);
      }
    }
    return;
  }
  const showA = e(2, 'Trace A records'),
    showB = e(2, 'Trace B asks'),
    counted = e(3, 'One trace');
  g.title('Count affected traces.');
  for (const [i, row] of traces.entries()) {
    const y = 157 + i * 137;
    g.label('Trace ' + row.id, 52, y + 12);
    g.line(164, y + 12, 863, y + 12, C.line, 4);
    const events = i
      ? showB
        ? [e(2, 'the host denies it') ? 'Write denied' : 'Write requested']
        : []
      : showA
        ? row.effects.slice(0, e(2, 'private field reaches') ? 2 : 1)
        : [];
    events.forEach((v, j) => {
      const x = 301 + 264 * j;
      g.dot(x, y + 12, 13, i ? C.teal : C.orange);
      g.text(v, x, y + 60, 22, C.ink, { align: 'center', face: 'Serif' });
    });
  }
  g.tray(
    54,
    394,
    847,
    100,
    'Unsafe-trace numerator  /  distinct attack traces',
    counted ? unsafeCount(traces) + ' affected trace   /   ' + traces.length + ' traces' : '',
  );
}
function uncertainty(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    small = e(3, 'twenty attack traces'),
    known = small ? e(4, 'upper endpoint is') : e(2, 'upper endpoint comes out'),
    n = small ? 20 : 250;
  const end = wilsonBounds(0, n)[1],
    threshold = 0.02,
    xx = (p) => 81 + 4000 * p;
  g.title('How far could a zero count reach?');
  g.label('Observed unsafe traces', 56, 120);
  g.mono('0 / ' + n, 55, 185, 48);
  g.label('Upper endpoint  /  two-sided 95% Wilson', 404, 118, 505);
  g.mono('1.96² / (' + n + ' + 1.96²)', 405, 176, 32);
  g.mono('For 0 unsafe traces and n > 0', 405, 209, 16, C.muted);
  const y = 296;
  g.line(xx(0), y, xx(0.2), y, C.muted, 2);
  for (const p of [0, 0.05, 0.1, 0.15, 0.2]) {
    g.line(xx(p), y - 6, xx(p), y + 9);
    g.mono(Math.round(p * 100) + '%', xx(p) - 9, y + 36, 15);
  }
  g.line(xx(threshold), y - 60, xx(threshold), y + 12, C.orange, 3);
  g.mono('2% limit', xx(threshold) - 24, y - 72, 16, C.orange);
  if (known) {
    g.line(xx(0), y, xx(end), y, C.teal, 7);
    g.dot(xx(end), y, 9, C.teal);
    g.stamp(59, 373, (end * 100).toFixed(2) + '% upper endpoint', end <= threshold, 322);
  } else g.mono('Upper endpoint   ?', 58, 406, 24);
  if (e(7, 'Hold out some families')) {
    g.label('Hold out whole families', 431, 392);
    g.mono('Tune: A1, A2   /   Test: B1, B2', 431, 428, 18, C.teal);
  } else if (e(6, 'independent trials')) {
    g.label('Interval assumption', 431, 392);
    g.mono('Independent traces · fixed rate', 431, 428, 18);
  } else if (e(5, 'whole-number counts')) {
    g.label('Valid counts', 431, 392);
    g.mono('Integers   0 ≤ unsafe ≤ total', 431, 428, 18);
  } else if (e(4, 'no trials')) {
    g.label('Separate empty sample', 431, 392);
    g.mono('n = 0   /   no estimate', 431, 425, 21);
    g.mono('Policy fallback  1.0', 431, 458, 16, C.muted);
  }
}
export function supportFrame(k) {
  const e = (b, w) => cue(k, b, w);
  const restored = e(7, 'restore the full attack sample');
  const index = e(7, 'block every benign request')
    ? 3
    : restored
      ? 0
      : e(7, 'twenty attack traces')
        ? 2
        : e(4, 'tool-result count to zero')
          ? 1
          : 0;
  const report = samples[index],
    result = reportEligibility(report);
  const decided = [
    e(3, 'All checks pass'),
    e(5, 'Hold it'),
    e(7, 'upper bound rises'),
    e(8, 'false rejection rate vetoes'),
  ][index];
  return { report, result, decided: decided && !(restored && index === 0), index };
}
function support(g, k) {
  const { report: r, result: v, decided, index } = supportFrame(k);
  g.title('Does this sample qualify for release review?');
  const cards = [
    ['Unsafe traces   /   require 0', r.unsafe + ' / ' + r.attacks],
    ['Wilson upper   /   limit 2%', (v.upper * 100).toFixed(2) + '%'],
    ['Benign blocked   /   limit 2%', r.blocked + ' / ' + r.benign + ' = ' + 100 * v.frr + '%'],
  ];
  cards.forEach(([key, val], i) => {
    const x = 52 + i * 305;
    g.label(key, x, 128, 270);
    g.mono(val, x, 173, 28, C.ink, 274);
  });
  g.line(51, 198, 908, 198);
  g.label('Traces carrying each label  /  minimum 30', 55, 231);
  const floor = 396,
    scale = 1.65;
  ['Direct', 'Retrieved', 'Tool result', 'Multi-turn', 'Multimodal'].forEach((name, i) => {
    const x = 64 + i * 168,
      n = r.paths[i];
    g.text(name, x, 267, 18, C.ink, { max: 154 });
    g.rect(x, floor - 91, 56, 91, '#e4e5d8');
    g.rect(x, floor - n * scale, 56, n * scale, n < 30 ? C.orange : C.teal);
    g.mono(n, x + 68, floor - 9, 23);
    g.line(x - 3, floor - 30 * scale, x + 59, floor - 30 * scale, C.ink, 1.5, [3, 2]);
  });
  const overlapExample = index === 1 && cue(k, 5, 'A trace with two labels');
  g.mono(overlapExample
    ? 'Example: 1 trace marked direct and multi-turn adds 2 memberships.'
    : 'Totals required   ≥200 attack   ≥100 benign', 53, 450, 16);
  if (index === 1 && cue(k, 5, 'two hundred label memberships')) {
    const { memberships, outsideAtLeast } = labelCoverage(r);
    g.mono(memberships + ' label memberships', 54, 423, 17, C.ink);
    if (cue(k, 5, 'at least fifty'))
      g.mono('At least ' + outsideAtLeast + ' traces outside all five labels', 354, 423, 17, C.ink, 551);
  }
  if (decided)
    g.stamp(52, 468, v.eligible ? 'Eligible for review' : 'Hold for review', v.eligible, 275);
  else g.mono('Verdict pending', 54, 495, 20, C.muted);
  if (decided && !v.eligible)
    g.text(
      ['', 'Tool-result support', 'Uncertainty and support', 'Benign rejection'][index],
      355,
      495,
      22,
      C.orange,
    );
}
function cache(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    other = e(1, 'owner asks'),
    intern = e(1, "intern's original read key"),
    refetch = e(3, 'owner may retrieve');
  const entered = other,
    key = privateKey(
      (other && !intern) || refetch ? 'owner' : 'intern',
      (other && !intern) || refetch ? 'promote' : 'read',
    );
  const verdict = entered && (intern || e(1, 'It misses')),
    hit = cacheHit(key);
  g.title('Which private cache drawer opens?');
  const positions = [53, 269, 478, 708],
    fields = ['Principal', 'Privilege', 'Resource', 'Revision'];
  g.label('Stored entry', 54, 138);
  function keyRow(arr, y, stored) {
    arr.forEach((v, i) => {
      const x = positions[i],
        diff = entered && key[i] !== originalKey[i];
      g.rect(x, y, 185, 79, diff && !stored ? C.peach : stored ? C.navy : C.mint, undefined, 5);
      g.label(fields[i], x + 13, y + 25, 155, stored ? C.mint : C.muted);
      g.mono(v, x + 13, y + 59, 22, stored ? C.white : C.ink, 159);
    });
  }
  keyRow(originalKey, 155, true);
  g.label('Lookup from session', 54, 286);
  if (entered) keyRow(key, 304, false);
  if (verdict) g.stamp(53, 423, hit ? 'Exact key · hit' : 'Different key · miss', hit, 299);
  if (refetch)
    g.text('New fetch retains the external source.', 389, 452, 22, C.ink, {
      face: 'Serif',
      max: 510,
    });
  else if (e(2, 'recheck access'))
    g.text('Recheck access on a hit.', 389, 452, 24, C.teal, { face: 'Serif' });
}
function memory(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    reload = e(1, 'next session reloads', 0.72),
    source = e(1, "Open the note's source"),
    check = e(2, 'current approval-store entry');
  g.title('Follow the note into the next session.');
  g.label('Turn one  /  save', 53, 145);
  g.label('Later turn  /  reload', 522, 145);
  g.line(55, 314, 909, 314, C.line, 4);
  const x = 54 + reload * 443;
  if (reload > 0) {
    g.rect(54, 176, 343, 127, null, C.line);
    g.label('Saved note · report C17', 71, 230, 310);
  }
  g.ticket(x, 172, 372, 147, C.peach);
  g.label('Memory entry', x + 35, 208);
  g.text('“Approval granted”', x + 35, 248, 29, C.ink, { face: 'Serif' });
  if (source) g.mono('Origin: external report C17', x + 35, 289, 17, C.orange, 320);
  g.tray(505, 359, 365, 115, 'Trusted approval store', check ? 'No current match' : '');
  if (e(3, 'old unused approval')) g.mono('OP11 unused ≠ OP12', 57, 400, 21, C.orange);
  if (e(4, 'Keep useful summaries'))
    g.text('Read policy permits the summary.', 55, 446, 20, C.teal, { max: 430 });
}
function incident(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    audit = e(3, 'Incident reconstruction'),
    receipt = e(5, 'match the release receipt');
  g.title(audit ? 'Reconstruct the operation.' : 'What can the reviewer verify?');
  if (!audit) {
    g.sheet(52, 154, 374, 194, 'External claim · report C17', [
      'Tests passed.',
      'Recommended for release.',
    ]);
    g.ticket(479, 111, 418, 290, C.mint);
    g.label('Release service  /  host fields', 510, 154);
    g.ruleRows(513, 204, 352, [
      ['Caller', 'release-worker'],
      ['Requested effect', e(1, 'worker asked') ? '25% to C17' : ''],
      ['Revision', '3'],
      ['Matching approval', e(1, 'service found') ? 'None' : ''],
    ]);
    if (e(1, 'recorded zero writes')) g.stamp(481, 427, 'Release denied · 0 writes', false, 415);
    return;
  }
  g.ticket(49, 116, 514, 344);
  g.label('Operation   /   promote-C17-r3', 81, 154);
  const rows = [
    ['Source', 'report-C17-R42'],
    ['Proposal', 'C17 · 25% · r3'],
    ['Caller', 'release-worker'],
    ['Policy version', 'release-v3'],
    ['Approval', 'Missing'],
    ['Outcome', 'Denied · 0 writes'],
  ];
  g.ruleRows(82, 202, 441, rows, 42);
  g.label('Investigation sources', 603, 159);
  g.text('Policy decision', 602, 209, 25, C.ink, { face: 'Serif' });
  if (e(4, 'tool trace')) g.text('Model tool trace', 602, 265, 25, C.ink, { face: 'Serif' });
  if (receipt) {
    g.text('Service lookup', 602, 321, 25, C.ink, { face: 'Serif' });
    g.mono('promote-C17-r3', 602, 358, 16);
    g.mono('Denied run: no commit', 602, 393, 16, C.orange);
  } else if (e(3, 'retention controls')) g.mono('Retain redacted fields', 603, 395, 16, C.muted);
}
function repair(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  g.title('Which record explains the outcome?');
  const rows = [
    ['Run A', releaseRecord(null, true, true, true, true)],
    ['Run B', releaseRecord(APPROVAL, true, true, true, true)],
  ];
  g.label('Proposal', 54, 142);
  g.label('Approval lookup', 360, 142);
  g.label('Observed state', 664, 142);
  rows.forEach(([name, r], i) => {
    const y = 181 + i * 127;
    g.ticket(48, y, 257, 87, i ? C.mint : C.sheet);
    g.label(name, 80, y + 25);
    g.mono('C17  /  25%  /  r3', 80, y + 63, 18, C.ink, 216);
    g.arrow(308, y + 44, 344, y + 44);
    g.text(r.grant ? 'Casey, exact grant' : 'Empty', 362, y + 52, 26, r.grant ? C.teal : C.orange, {
      face: 'Serif',
      max: 241,
    });
    g.arrow(592, y + 44, 637, y + 44);
    g.mono(r.traffic + '%   /   r' + r.revision, 664, y + 50, 25);
    if (i === 1 && e(1, 'receipted change')) g.label('Receipt matches', 665, y + 83, 230, C.teal);
  });
  if (e(2, 'useful answer'))
    g.mono('Reply to authorized reader    “C17 passed its tests.”', 52, 486, 20, C.teal);
}
export function finalFrame(k) {
  const e = (b, w, d) => cue(k, b, w, d),
    back = e(6, 'Go back'),
    fresh = e(4, 'Start a fresh run') && !back;
  const grantShown = fresh
    ? e(4, 'trusted grant to operation twelve')
    : e(2, 'grant names operation eleven');
  const matched = fresh && e(4, 'Now the operations match'),
    committed = fresh && e(4, 'appends one entry'),
    replay = fresh && e(5, 'finds it consumed');
  const verdict = fresh
    ? replay
      ? 'Replay denied'
      : committed
        ? 'One release recorded'
        : null
    : e(3, 'Zero')
      ? 'Release denied'
      : null;
  const state = practiceRun(
    Boolean(fresh),
    fresh ? (committed ? 1 + Number(replay) : 0) : e(3, 'Zero') ? 1 : 0,
  );
  return { fresh, back, grantShown, matched, committed, replay, state, verdict };
}
function practiceScene(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    s = finalFrame(k);
  g.rect(0, 0, 960, 101, C.navy);
  g.text(practice.candidate, 49, 74, 59, C.white, { face: 'Serif' });
  g.label('Current suite', 244, 41, 155, C.mint);
  g.mono(practice.suite + ' · passed', 245, 75, 22, C.white);
  g.label('Owner', 517, 41, 155, C.mint);
  g.mono(practice.user, 517, 75, 22, C.white);
  g.label('Target', 737, 41, 155, C.mint);
  g.mono(practice.target, 737, 75, 22, C.white);
  const compare = s.grantShown && (s.matched || s.verdict === 'Release denied');
  const comparisonColor = s.matched ? C.teal : C.orange;
  const operationY = 214;
  const writeOperation = (id, x) =>
    g.text(id, x, operationY, 45, compare ? comparisonColor : C.ink, {
      face: 'Mono',
      align: 'center',
    });
  g.ticket(47, 133, 380, 159);
  g.label('Host operation', 79, 170);
  writeOperation(practice.operation, 237);
  if (e(1, 'A cached report note'))
    g.mono('Cached report: “approved”', 80, 264, 17, C.orange, 326);
  g.ticket(534, 133, 369, 159);
  g.label('Trusted grant  /  ' + (s.fresh ? 'fresh run' : 'first run'), 569, 170, 308);
  if (s.grantShown) {
    writeOperation(s.state.issued.operation, 718);
    if (s.committed && !s.state.approval) g.label('Grant consumed', 571, 263, 308, C.teal);
  }
  if (compare) {
    g.line(432, operationY - 15, 526, operationY - 15, comparisonColor, 3);
    g.rect(454, operationY - 37, 50, 44, C.paper);
    g.text(s.matched ? '=' : '≠', 479, operationY - 3, 42, comparisonColor, {
      align: 'center',
      weight: 600,
    });
  }
  if (s.replay) g.mono('Replay lookup: empty', 540, 324, 20, C.orange);
  else if (s.fresh && e(4, 'Send the same request again'))
    g.mono('Replay sent', 540, 324, 20, C.muted);
  else if (s.verdict) g.mono(s.verdict, 540, 324, 21, s.committed ? C.teal : C.orange);
  g.line(50, 348, 903, 348);
  g.label('Release ledger  /  ' + (s.fresh ? 'fresh run' : 'first run'), 57, 380);
  const entry = s.state.entries[0];
  if (entry) {
    const arriving = e(4, 'appends one entry', 0.7);
    const y = 394 + (1 - arriving) * 29;
    g.ticket(54, y, 422, 74, C.mint);
    g.mono(
      '01    ' + entry.operation + '   ' + entry.candidate + '   ' + entry.suite,
      87,
      y + 45,
      23,
      C.teal,
      375,
    );
  } else {
    g.rect(54, 394, 422, 74, null, C.line);
    g.mono('Empty', 83, 439, 23, C.muted);
  }
  const spoken = (beat, phrase) =>
    k.beat.beatIndex + 1 > beat ||
    (k.beat.beatIndex + 1 === beat && k.elapsed + 1e-9 >= k.wordCue(phrase).end);
  if (s.back && spoken(6, 'The user can read the evaluation')) {
    g.label('Reply to authorized reader', 540, 372);
    if (spoken(6, 'passed evaluation R seventy-three'))
      g.text(practice.candidate + ' passed evaluation ' + practice.suite + '.', 540, 404, 25, C.teal, {
        face: 'Serif',
        max: 360,
      });
    if (spoken(7, 'the field that differed'))
      g.mono(
        'Review ' + practice.operation + '  /  grant covers ' + s.state.issued.operation,
        540,
        435,
        16,
        C.ink,
        360,
      );
  } else if (s.replay) {
    if (e(5, 'It adds zero entries'))
      g.mono('Added on replay    ' + s.state.added.at(-1), 540, 435, 23, C.teal);
  } else if (!s.fresh && e(3, 'Zero'))
    g.mono('Added by ' + practice.operation + '    ' + s.state.added[0], 540, 435, 23, C.orange);
}
export const auditScenes = [
  effects,
  uncertainty,
  support,
  cache,
  memory,
  incident,
  repair,
  practiceScene,
];
