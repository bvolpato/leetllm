import { C, cameraPrint } from './studio.mjs';
import {
  label,
  route,
  readout,
  delayed,
  slice,
  replayPair,
  visionFresh,
  visionCaseAction,
  traces,
  fixed,
} from './records.mjs';

const shortAction = (a) =>
  ({ priority_damage_review: 'Priority', normal_review: 'Normal', request_new_photo: 'Retake' })[a];
function replay(s) {
  const changed = !!s.cue(2, 'Someone edits');
  const { ref, candidate, match } = replayPair(changed);
  s.title('Day 10 · R-408-a', 'Replay the decision that was served');
  [ref, candidate].forEach((t, i) => {
    const x = 84 + i * 900,
      col = i && changed && s.b >= 3 ? C.red : C.ink;
    s.box(x, 244, 838, 493, i ? C.white : C.sky);
    s.text(i ? 'Trace under inspection' : 'Rebuilt from retained bundle', x + 32, 309, 38, C.muted);
    s.text(
      fixed(t.damage_probability) +
        (t.damage_probability >= t.damage_threshold ? ' ≥ ' : ' < ') +
        fixed(t.damage_threshold),
      x + 32,
      436,
      71,
      col,
      'Mono',
    );
    s.text(label[t.action], x + 32, 550, 54, col, 'Serif');
    s.text(t.reason, x + 32, 659, 32, col, 'Mono');
  });
  if ((!changed && s.b === 1 && s.cue(1, 'replay returns True')) || s.b >= 3) {
    s.band(
      85,
      816,
      895,
      match ? 'Replay matches all 20 fields' : 'Replay fails against the saved attempt',
      match ? C.sea : C.red,
    );
  }
  if (s.b === 4) s.text('New bundle → new attempt ID and timestamp', 85, 960, 39, C.ink);
}

function metrics(s, x, y, counts, { showPrecision = true, showRecall = true, max = 675 } = {}) {
  const { TP, FP, FN } = counts,
    pd = TP + FP,
    rd = TP + FN;
  if (showPrecision)
    s.note(
      x,
      y,
      'Priority precision',
      pd ? TP + ' / ' + pd : 'Undefined (0 / 0)',
      pd ? C.sea : C.red,
      max,
    );
  if (showRecall)
    s.note(
      x,
      y + 179,
      'Damage recall',
      rd ? TP + ' / ' + rd : 'Undefined (0 / 0)',
      rd ? C.sea : C.red,
      max,
    );
}

function matrix(s, x, y, data) {
  const w = 404,
    h = 186;
  s.text('Priority', x + 36, y - 36, 37, C.ink, 'Serif');
  s.text('Nonpriority', x + w + 54, y - 36, 37, C.ink, 'Serif');
  ['TP', 'FN', 'FP', 'TN'].forEach((cell, i) => {
    const xx = x + (i % 2) * (w + 17),
      yy = y + Math.floor(i / 2) * (h + 19);
    const members = data.joined.filter((r) => r.cell === cell);
    s.box(xx, yy, w, h, cell === 'FN' ? C.rose : C.white, C.line, 2);
    s.text(cell + '  ·  ' + (i < 2 ? 'damaged' : 'clear'), xx + 21, yy + 52, 32, C.muted);
    s.text(
      members.length ? members.map((r) => r.case_id).join('  ') : '0 cases',
      xx + 21,
      yy + 133,
      45,
      members.length ? C.ink : C.muted,
      'Mono',
      w - 45,
    );
  });
}
function caseCount(s) {
  const all = readout(12);
  s.title('Specialist outcomes', 'Two priority photos, one physical case');
  cameraPrint(s, 83, 290, 392, 196, 'mailer', 'R-404-a');
  cameraPrint(s, 515, 290, 392, 196, 'mailer', 'R-404-b', { turn: 0.04 });
  s.line(277, 564, 277, 618, C.sea, 5);
  s.line(277, 618, 711, 618, C.sea, 5);
  s.line(711, 564, 711, 618, C.sea, 5);
  s.text('R-404   /   1 confirmed parcel', 96, 718, 40, C.sea, 'Mono', 780);
  if (s.cue(1, 'four usable cases')) matrix(s, 987, 334, all);
  if (s.b === 2) {
    s.text('Precision   1 / 2', 991, 824, 39, C.ink, 'Mono');
    s.text('Recall      1 / 2', 991, 895, 39, C.ink, 'Mono');
    s.text('Follow up normal reviews too.', 96, 895, 42, C.red);
  }
}
export function joinPractice() {
  return [
    ['A', 30, 30, 31, 'Priority'],
    ['B', 30, 31, 33, 'Normal'],
    ['C', 30, 31, 32, 'Normal'],
  ].map(([id, capture, review, available, action]) => ({
    id,
    capture,
    review,
    available,
    action,
    eligible: review > capture && available <= 32,
  }));
}
function clockJoin(s) {
  if (s.b >= 4) {
    s.title('Join practice · same guideline', 'Which record enters the day-32 report?');
    const decisions = joinPractice();
    const answer = s.cue(5, 'Only case C');
    s.table(
      87,
      305,
      [208, 290, 292, 292, 415, 271],
      ['Case', 'Capture', 'Reviewed', 'Available', 'Served route', 'Join'],
      decisions.map(({ id, capture, review, available, action, eligible }) => [
        id,
        'Day ' + capture,
        'Day ' + review,
        'Day ' + available,
        action,
        answer ? (eligible ? 'Yes' : 'No') : '',
      ]),
      { step: 136, size: 38 },
    );
    s.text(
      'Reviewed after last capture     ·     Available by day 32',
      89,
      832,
      39,
      C.muted,
      'Mono',
    );
    if (answer)
      s.text(
        'C was normal and confirmed damaged. It contributes one false negative.',
        89,
        948,
        40,
        C.red,
      );
    return;
  }
  const late = Boolean(s.cue(2, 'available on day thirteen'));
  s.title('R-408 · visible-damage-v1', 'Which evidence is available on day 12?');
  const events = [
    ['Last capture', 10],
    ['Specialist review', 12],
    ['Outcome available', late ? 13 : 12],
  ];
  const x = (d) => 530 + (d - 10) * 348;
  s.box(x(10) - 50, 247, x(12) - x(10) + 50, 477, C.mint);
  s.line(x(12), 227, x(12), 766, C.red, 6);
  s.text('Readout', x(12) - 71, 208, 30, C.red);
  events.forEach(([name, day], i) => {
    const y = 328 + i * 153;
    s.text(name, 83, y + 14, 42, C.ink, 'Serif');
    s.line(x(10), y, x(13), y, C.line, 4);
    s.dot(x(day), y, 18, i === 2 && late ? C.red : C.sea);
    s.text('Day ' + day, x(day) + 27, y - 15, 31, C.ink, 'Mono');
  });
  const data = readout(12, late ? delayed : undefined);
  const joined = data.joined.some((o) => o.case_id === 'R-408');
  if (s.cue(1, 'review strictly after'))
    s.band(
      80,
      809,
      1120,
      joined ? 'Join R-408 to its served normal route' : 'R-408 waits outside the day-12 report',
      joined ? C.sea : C.red,
    );
  if (s.b === 3)
    s.text('Append corrections under a versioned selection rule.', 85, 961, 38, C.muted);
}

function reducer(s) {
  const targets = ['R-404', 'R-405', 'R-406'];
  s.title(
    'Photo actions → case action',
    s.b === 1 ? 'Reduce each physical parcel once' : 'Which cases enter the damage table?',
  );
  if (s.b === 1) {
    s.table(
      92,
      291,
      [347, 675, 659],
      ['Parcel', 'Served photos', 'One case route'],
      targets.map((id) => {
        const selected = traces.filter((t) => t.case_id === id);
        return [
          id,
          selected.map((r) => shortAction(r.action)).join(' + '),
          label[visionCaseAction(selected)],
        ];
      }),
      { step: 137, size: 43 },
    );
    s.text('Precedence     Priority  →  Normal  →  Retake', 92, 888, 44, C.ink, 'Mono');
  } else {
    matrix(s, 92, 355, readout(12));
    if (s.b === 2) {
      s.note(1035, 348, 'Include a test case when', 'A human-usable view exists', C.sea, 790);
      s.text('+ an eligible specialist outcome', 1035, 527, 39, C.ink);
      if (s.cue(2, 'false negative'))
        s.text('Usable + damaged + retake → FN', 1035, 701, 36, C.red, 'Mono', 785);
    } else metrics(s, 1100, 370, readout(12).counts);
  }
}

function missing(s) {
  const late = Boolean(s.cue(1, 'label availability'));
  const day = s.cue(2, 'day thirteen restores') ? 13 : 12;
  const empty = Boolean(s.cue(3, 'With no outcomes'));
  const data = readout(day, empty ? [] : late ? delayed : undefined);
  s.title('Outcome availability', 'Readout on day ' + day);
  s.text(
    data.joined.length + ' of ' + data.expected + ' usable cases joined',
    91,
    267,
    40,
    C.muted,
  );
  matrix(s, 93, 371, data);
  metrics(s, 1094, 342, data.counts, { showRecall: !late || s.b >= 2 });
  s.band(
    1088,
    750,
    701,
    data.complete ? 'All expected outcomes joined' : 'Hold incomplete report',
    data.complete ? C.sea : C.red,
  );
  s.text('R-408 served normal on day 10', 93, 923, 39, C.ink, 'Mono');
}

function slices(s) {
  const phone = slice('customer_phone'),
    warehouse = slice('warehouse_camera'),
    all = readout(12);
  s.title('Source slices', 'Which camera supplied the missed case?');
  [phone, warehouse].forEach((data, i) => {
    const x = 88 + i * 903;
    if (i === 1 && s.b === 1) return;
    s.text(i ? 'Warehouse camera' : 'Customer phone', x, 291, 48, C.ink, 'Serif');
    s.table(
      x,
      384,
      [203, 273, 314],
      ['Case', 'Route', 'Outcome'],
      data.joined.map((r) => [
        r.case_id,
        shortAction(r.action),
        r.confirmed_damage ? 'Damaged' : 'Clear',
      ]),
      { step: 88, size: 32 },
    );
    const { TP, FP, FN } = data.counts;
    s.text('Recall   ' + TP + ' / ' + (TP + FN), x, 679, 39, C.ink, 'Mono');
    const precisionShown = !i || s.cue(2, 'no denominator');
    if (precisionShown)
      s.text(
        'Precision   ' + (TP + FP ? TP + ' / ' + (TP + FP) : 'undefined (0 / 0)'),
        x,
        753,
        35,
        i ? C.red : C.ink,
        'Mono',
        820,
      );
  });
  if (s.b >= 3) {
    s.band(
      87,
      866,
      1740,
      'Pooled cases    ' +
        all.joined.length +
        '     ·     precision  1 / 2     ·     recall  1 / 2',
    );
    if (s.b === 4)
      s.text(
        'A multi-source case can appear in both slices. Deduplicate it overall.',
        91,
        999,
        32,
        C.muted,
      );
  }
}

function receipt(s) {
  s.title(
    'Release evidence',
    s.b === 1
      ? 'What passed on the supplied records?'
      : s.b === 2
        ? 'Exercise the recovery path'
        : 'Prepare a shadow comparison',
  );
  if (s.b === 1) {
    s.table(
      91,
      285,
      [645, 520, 547],
      ['Claim', 'Available evidence', 'Status'],
      [
        ['Bookkeeping works', 'Split, replay, join', 'Passed on fixture'],
        ['Image model meets target', 'Supplied scores only', 'Unmeasured'],
        ['Service can recover', 'Previous-bundle name', 'Unverified'],
      ],
      { step: 131, size: 37, colors: [C.sea, C.red, C.red] },
    );
    if (s.cue(1, 'fixture stays on hold')) s.band(95, 826, 530, 'Hold the fixture', C.red);
  } else if (s.b === 2) {
    s.note(90, 290, 'Recorded pointer', 'synthetic-policy-v0', C.ink);
    [
      'Retrieve code, transform, weights and policy',
      'Load the prior bundle',
      'Compare a known route with the original',
    ].forEach((v, i) => {
      s.box(116, 480 + i * 120, 39, 39, null, C.muted, 4);
      s.text(v, 195, 516 + i * 120, 44, C.ink);
    });
    s.text('Required recovery drill', 97, 973, 33, C.red);
  } else {
    cameraPrint(s, 80, 320, 672, 336, 'box', 'Permitted new capture');
    s.note(860, 320, 'Candidate', 'Pinned runnable model', C.ink, 900);
    s.text('Set quality and latency targets before scoring.', 860, 547, 39, C.muted, 'Sans', 950);
    if (s.cue(3, 'Compare the model'))
      s.text('Compare shadow routes with specialist outcomes.', 860, 675, 40, C.sea, 'Sans', 950);
  }
}

function monitor(s) {
  s.title(
    'Warehouse intake',
    s.b === 1
      ? 'A new camera sends darker frames'
      : s.b === 2
        ? 'Specialist outcomes arrive later'
        : 'Trace a miss to the served input',
  );
  if (s.b === 1) {
    [false, true, true].forEach((dim, i) =>
      cameraPrint(
        s,
        89 + i * 596,
        319,
        510,
        255,
        dim ? 'dark' : 'box',
        ['Before change', 'New camera', 'Next capture'][i],
      ),
    );
    if (s.cue(1, 'retake requests spike'))
      s.band(
        92,
        782,
        1720,
        'Investigate exposure and offer manual intake while the camera is fixed.',
        C.red,
      );
  } else if (s.b === 2) {
    const data = slice('warehouse_camera');
    s.table(
      92,
      300,
      [290, 365, 445],
      ['Mature case', 'Route', 'Outcome'],
      data.joined.map((r) => [
        r.case_id,
        shortAction(r.action),
        r.confirmed_damage ? 'Damaged' : 'Clear',
      ]),
      { step: 128, size: 39 },
    );
    s.note(1230, 328, 'Warehouse fixture', '0 of 1 recovered', C.red, 550);
    s.text('Compare precision and priority rate by source and packaging.', 91, 768, 40, C.muted);
    if (s.cue(2, 'evaluate it'))
      s.text('Evaluate a candidate before switching weights.', 91, 881, 43, C.sea);
  } else {
    const t = route('R-408-a');
    cameraPrint(s, 86, 318, 635, 317, 'peeled', t.photo_id);
    s.text('Warehouse capture on day ' + t.routed_day, 87, 800, 38, C.ink);
    s.table(
      810,
      302,
      [324, 665],
      ['Retained field', 'R-408-a'],
      [
        ['Bundle', t.bundle_id],
        ['Transform', t.preprocessing],
        ['Supplied score', fixed(t.damage_probability)],
        ['Cutoff', fixed(t.damage_threshold)],
        ['Served', label[t.action]],
      ],
      { step: 100, size: 34 },
    );
  }
}

function caseHistory(s) {
  const trace = route('R-408-a');
  cameraPrint(s, 82, 289, 703, 351, 'peeled', trace.photo_id + '  ·  warehouse camera');
  s.note(
    884,
    287,
    'Day ' + trace.routed_day + ' · ' + trace.bundle_id,
    fixed(trace.damage_probability) + ' < ' + fixed(trace.damage_threshold),
    C.ink,
    890,
  );
  s.band(888, 426, 669, label[trace.action], C.blue);
  if (s.b >= 2) {
    s.text('Day 12   ·   Specialist confirmed damage', 888, 642, 41, C.ink, 'Serif', 925);
    s.text('visible-damage-v1   ·   available day 12', 888, 714, 32, C.muted, 'Mono', 915);
    if (s.cue(2, 'one missed case')) s.band(888, 806, 735, 'One missed damaged parcel', C.red);
  }
}

function synthesis(s) {
  s.title('Reconstruct R-408', 'The day-10 route stays on file');
  caseHistory(s);
  if (s.b === 3) s.text('Investigate the served crop and camera source.', 81, 943, 38, C.muted);
}

export function freshDay(s) {
  return s.after(7, 'The fifth case joins') ? 22 : 21;
}

function practiceReport(s, fresh) {
  const lateOutcome = fresh.outcomes.find((o) => o.case_id === 'R-520');
  const { TP, FP, FN } = fresh.counts;
  const showJoined = s.after(5, 'Today only four of five cases join');
  const showPrecision = s.after(5, 'Observed precision is two out of three');
  const showRecall = s.after(5, 'observed recall is two out of two');
  const holdReport = s.after(5, 'Hold the incomplete report');
  const arrival = s.after(7, 'Now three parcels have confirmed damage', 0.65);
  const showFinalRecall = s.after(7, 'Recall is now two out of three');
  const showMiss = s.after(7, 'The new arrival is one missed damaged parcel');
  const recallY = 605;
  const precisionY = 737;
  const cardBottom = 526;

  s.title('R-520 · served normal', 'Outcome readout on day ' + fresh.cutoff);
  if (showJoined)
    s.text(fresh.joined.length + ' / ' + fresh.expected + ' joined', 81, 228, 39, C.ink, 'Mono');
  s.text('Served route', 81, 410, 34, C.muted);
  s.text('Outcome at readout', 81, 482, 30, C.muted);

  fresh.outcomes.forEach(({ case_id: id }, i) => {
    const x = 381 + i * 294;
    const record = fresh.joined.find((r) => r.case_id === id);
    const action = fresh.servedActions[id];
    const pending = !record;
    s.box(x, 266, 257, cardBottom - 266, pending ? C.paper : C.white, C.line, 3);
    s.text(id, x + 24, 332, 41, C.ink, 'Mono');
    s.text(shortAction(action), x + 24, 410, 43, C.blue, 'Serif');
    s.text(
      pending ? 'Pending' : record.confirmed_damage ? 'Damaged' : 'Clear',
      x + 24,
      482,
      38,
      pending ? C.muted : C.ink,
    );

    const cell = record?.cell;
    const recovered = cell === 'TP';
    const missed = cell === 'FN';
    const chip = (y, name, fill, ink) => {
      s.box(x, y, 257, 68, fill);
      s.text(name, x + 20, y + 46, 35, ink, 'Sans', 217);
    };
    if (showPrecision && (recovered || cell === 'FP')) {
      chip(precisionY, recovered ? 'Damaged' : 'Clear', recovered ? C.mint : C.sky, C.ink);
    }
    if (showRecall && recovered) chip(recallY, 'Reached priority', C.mint, C.sea);
    if (showRecall && missed && arrival > 0) {
      const y = cardBottom + (recallY - cardBottom) * arrival;
      s.line(x + 128, cardBottom, x + 128, y, showMiss ? C.red : C.muted, 4);
      chip(
        y,
        showMiss ? 'Missed damage' : 'Damaged',
        showMiss ? C.rose : C.white,
        showMiss ? C.red : C.ink,
      );
    }
  });

  if (showPrecision) {
    s.text('Priority precision', 81, precisionY + 13, 34, C.muted);
    s.text(TP + ' / ' + (TP + FP), 81, precisionY + 67, 48, C.sea, 'Mono');
  }
  if (showRecall) {
    s.text('Damage recall', 81, recallY + 13, 34, C.muted);
    const denominator = fresh.complete && (!showFinalRecall || arrival < 1) ? '?' : TP + FN;
    s.text(TP + ' / ' + denominator, 81, recallY + 67, 48, C.ink, 'Mono');
  }
  if (!fresh.complete) {
    if (s.after(4, 'becomes available on day twenty-two'))
      s.text(
        'R-520 reviewed day ' +
          lateOutcome.reviewed_day +
          ' · available day ' +
          lateOutcome.available_day,
        81,
        905,
        38,
        C.muted,
        'Mono',
      );
    if (holdReport) s.band(1164, 857, 670, 'Hold the incomplete report', C.red);
  }
}

function practice(s) {
  const fresh = visionFresh(freshDay(s));
  const views = fresh.rows.filter((r) => r.photo.case_id === 'R-520');
  const routes = fresh.traces.filter((r) => r.case_id === 'R-520');
  if (s.b < 4) {
    s.title('Practice · day 20', 'Two uploads from R-520');
    views.forEach((r, i) => {
      const x = 86 + i * 899;
      cameraPrint(s, x, 286, 806, 403, 'punctured', null, { dim: !i });
      s.text(r.photo.photo_id, x, 250, 38, C.ink, 'Mono');
      s.text(
        'Brightness  ' +
          fixed(r.output.brightness) +
          '     Damage  ' +
          fixed(r.output.damage_probability),
        x,
        759,
        36,
        C.ink,
        'Mono',
        825,
      );
      const known = i
        ? s.after(3, 'The clearer view goes to normal review')
        : s.after(3, 'request a new photo');
      if (known) s.band(x, 801, 795, label[routes[i].action], i ? C.blue : C.red);
    });
    if (s.b === 2)
      s.text(
        'Both visible · blur 0.10     |     brightness ≥ 0.20 · blur ≤ 0.45 · damage cutoff ' +
          fixed(routes[0].damage_threshold),
        88,
        919,
        36,
        C.muted,
        'Mono',
        1750,
      );
    if (s.after(3, 'case goes to normal review'))
      s.text('R-520     ' + label[visionCaseAction(routes)], 85, 933, 46, C.ink, 'Serif');
    return;
  }
  if (s.b === 8) {
    s.title('R-520 · matched by physical case', 'Follow-up on normal review found the miss');
    cameraPrint(s, 88, 289, 836, 418, 'punctured', 'R-520-b  ·  usable second view');
    s.note(1020, 292, 'Served on day 20', label[visionCaseAction(routes)], C.blue, 793);
    s.note(1020, 490, 'Specialist outcome available day 22', 'Confirmed damage', C.red, 793);
    const { TP, FN } = fresh.counts;
    s.text(
      'Priority recovered ' + TP + ' of ' + (TP + FN) + ' damaged cases.',
      91,
      939,
      53,
      C.ink,
      'Serif',
      1730,
    );
    return;
  }
  practiceReport(s, fresh);
}
export const evaluation = [
  replay,
  caseCount,
  clockJoin,
  reducer,
  missing,
  slices,
  receipt,
  monitor,
  synthesis,
  practice,
];
