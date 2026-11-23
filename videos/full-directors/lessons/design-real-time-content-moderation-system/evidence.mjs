import {
  C,
  box,
  clockCue,
  dot,
  egret,
  fmt,
  kingfisher,
  label,
  line,
  measure,
  page,
  portrait,
  ruledPage,
  stamp,
  text,
} from './art.mjs';
import {
  adapter,
  assessReference,
  caller,
  canExecute,
  capacity,
  categories,
  classroom,
  framePicks,
  luminance,
  routes,
  specialist,
} from './decisions.mjs';

export function opening(c, k) {
  const b = k.beat.beatIndex,
    claim = b === 2;
  page(
    c,
    'Reedbank field class',
    claim ? 'Who speaks for the club?' : 'What does “official” describe?',
  );
  ruledPage(c, 94, 285, 1730, 510);
  portrait(c, claim ? kingfisher : egret, 1560, 535, 160);
  label(c, claim ? 'PROFILE CAPTION' : 'CLASSROOM TUTORIAL', 158, 379);
  if (claim) {
    text(c, '“I represent Reedbank Birders.”', 158, 530, 65, C.ink, 'serif');
    text(c, 'Account ownership has not been verified.', 158, 663, 40, C.muted);
    if (clockCue(k, 2, 'Keep the profile pending'))
      stamp(c, 'Pending ownership review', 110, 854, C.brass);
    return;
  }
  const size = 53,
    x = 158,
    y = 543;
  const prefix = 'Our class uses the ',
    word = 'official';
  const left = x + measure(c, prefix, size, 'serif'),
    right = left + measure(c, word, size, 'serif');
  const lineEnd = x + measure(c, classroom.sentence, size, 'serif');
  const opening = clockCue(k, 0, 'Read the rest', 1.2);
  c.save();
  c.beginPath();
  c.rect(
    left - (left - x + 3) * opening - 2,
    y - 75,
    right - left + 4 + (lineEnd - right + left - x + 8) * opening,
    97,
  );
  c.clip();
  text(c, classroom.sentence, x, y, size, C.ink, 'serif');
  c.restore();
  const underline = b === 0 ? Math.min(1, 0.07 + k.elapsed / 0.64) : 1;
  if (assessReference(classroom).hit)
    line(c, left, y + 14, left + (right - left) * underline, y + 14, C.brass, 7);
  if (clockCue(k, 1, 'The policy allows classroom references'))
    text(c, classroom.policy, 158, 669, 39, C.pine);
  if (clockCue(k, 1, 'Publish the handout') && assessReference(classroom).allowed)
    stamp(c, 'Publish the handout', 109, 851);
  if (clockCue(k, 1, 'would disappear'))
    text(c, 'Word-only rule would hide it.', 706, 901, 45, C.red, 'serif');
}

export function surfaces(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const restricted = clockCue(k, 2, 'straight to an authorized specialist');
    page(c, 'Review intake', 'Who can open the report?');
    const lanes = [
      ['Ownership dispute', 'Standard reviewer'],
      [
        'Trusted sensitive report',
        restricted && specialist.admitted ? 'Authorized specialist' : 'Checking intake',
      ],
      ['Urgent case', clockCue(k, 2, 'An urgent case') ? 'Priority reviewer' : 'Awaiting intake'],
    ];
    lanes.forEach(([name, owner], i) => {
      const y = 300 + i * 178;
      box(c, 100, y, 1720, 140, i === 1 ? '#dce9dc' : C.card, 12);
      dot(c, 169, y + 70, 19, i === 1 ? C.pine : C.sea);
      text(c, name, 227, y + 88, 48, C.ink, 'serif');
      line(c, 854, y + 72, 983, y + 72, C.line, 4);
      text(c, owner, 1045, y + 87, 45, i === 1 ? C.pine : C.ink);
    });
    if (restricted)
      text(
        c,
        'SR17    Authenticated intake  /  specialist access only',
        119,
        933,
        35,
        C.muted,
        'mono',
      );
    return;
  }
  const held = clockCue(k, 1, 'Hold this message'),
    pending = clockCue(k, 1, 'acknowledge the pending revision');
  page(c, 'Surface contracts', 'When must the member get an answer?');
  box(c, 94, 280, 1000, 602, C.card, 22);
  box(c, 1134, 280, 690, 602, '#e0e8dc', 22);
  label(c, 'LIVE CHAT', 146, 350);
  text(c, '“Meet by the hide?”', 148, 463, 60, C.ink, 'serif');
  text(c, 'Target   p95 < 200 ms', 150, 550, 42, C.muted);
  line(c, 162, 642, 998, 642, C.line, 9);
  const t = clockCue(k, 0, 'At the deadline', 1.15);
  line(c, 161, 642, 162 + 832 * t, 642, C.sea, 9);
  dot(c, 162 + 832 * t, 642, 16, C.sea);
  text(c, 'Send', 150, 708, 30, C.muted);
  text(c, '200 ms', 997, 708, 30, C.muted, 'mono', 400, 'right');
  if (held) stamp(c, 'Held before delivery', 150, 766, C.brass);
  else text(c, 'Required check running', 150, 815, 38, C.sea);
  label(c, 'PROFILE UPLOAD', 1188, 350);
  portrait(c, kingfisher, 1465, 525, 115);
  text(c, 'Reply target   < 1 s', 1188, 710, 40, C.muted);
  if (pending) stamp(c, 'Pending review', 1188, 766, C.brass);
}

export function cascade(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    page(c, 'Capacity worksheet', 'Which traffic does the average describe?');
    ruledPage(c, 105, 303, 815, 552);
    ruledPage(c, 984, 303, 821, 552);
    label(c, 'NEW POSTS', 171, 389);
    text(c, '2.4 million / day', 171, 510, 60, C.ink, 'serif');
    text(c, '÷ 86,400 seconds', 171, 605, 43, C.muted);
    line(c, 171, 658, 835, 658);
    text(c, '≈ 28 posts/s', 171, 768, 67, C.pine, 'serif');
    label(c, 'JUDGE DURING STABLE LOAD', 1052, 389);
    text(c, '500 requests/s', 1052, 510, 59, C.ink, 'serif');
    text(c, '× 0.4 s mean residence', 1052, 605, 42, C.muted);
    line(c, 1052, 658, 1727, 658);
    if (clockCue(k, 3, 'two hundred requests in flight'))
      text(c, capacity.inFlight + ' in flight', 1052, 768, 67, C.pine, 'serif');
    return;
  }
  page(c, 'Cascade capacity  /  design fixture', 'What reaches the next stage?');
  const known = [
    true,
    clockCue(k, 1, 'Two thousand enter'),
    clockCue(k, 1, 'Five hundred reach'),
    clockCue(k, 1, 'A hundred cases'),
  ];
  label(c, 'Stage', 104, 315);
  label(c, 'Arrivals / s', 615, 315);
  label(c, 'Resolved here  /  sent onward', 1003, 315);
  routes.forEach((r, i) => {
    const y = 380 + i * 115;
    line(c, 103, y + 55, 1816, y + 55, C.line, 2);
    text(c, r.name, 105, y + 13, 47, C.ink, 'serif');
    if (!known[i]) return;
    text(c, fmt(r.incoming), 626, y + 12, 50, C.sea, 'mono');
    const ready =
      i === 0
        ? clockCue(k, 0, 'resolves eight thousand')
        : i === 1
          ? clockCue(k, 1, 'resolves fifteen hundred')
          : i === 2
            ? clockCue(k, 1, 'four hundred finish')
            : true;
    if (ready) {
      const width = 385,
        part = (width * r.exit) / r.incoming;
      box(c, 1005, y - 22, width, 28, C.gold);
      box(c, 1005, y - 22, part, 28, C.pine);
      text(
        c,
        fmt(r.exit) + ' / ' + (i === 0 && !known[1] ? '?' : fmt(r.onward)),
        1436,
        y + 10,
        38,
        C.ink,
        'mono',
      );
    }
  });
  if (b === 2) {
    text(
      c,
      fmt(routes[3].incoming) + '/s × 120 s = ' + fmt(capacity.busy) + ' busy',
      110,
      906,
      41,
      C.pine,
      'mono',
    );
    if (clockCue(k, 2, 'seventeen thousand'))
      text(c, '÷ 0.70  →  ' + fmt(capacity.staff) + ' on duty', 979, 906, 39, C.ink, 'mono');
  } else
    text(
      c,
      'Each bar uses that stage’s incoming traffic as its denominator.',
      110,
      904,
      35,
      C.muted,
    );
}

export function categoryScores(c, k) {
  const invalid = Boolean(clockCue(k, 2, 'violence score is missing')),
    data = categories(invalid);
  const b = k.beat.beatIndex;
  page(c, 'Category policy  /  one post', 'Which reasons go in the decision?');
  label(c, 'Required category', 100, 307);
  label(c, 'Score', 541, 307);
  label(c, 'Review', 1220, 307);
  label(c, 'Block', 1431, 307);
  label(c, 'Signal', 1625, 307);
  data.rows.forEach((row, i) => {
    const y = 385 + i * 79;
    text(c, row.name, 102, y, 39, C.ink, 'serif');
    text(
      c,
      row.value === null ? '—' : row.value.toFixed(2),
      541,
      y,
      37,
      row.value === null ? C.red : C.ink,
      'mono',
    );
    const x = 695,
      w = 444;
    line(c, x, y - 12, x + w, y - 12, C.line, 5);
    line(c, x + w * row.review, y - 30, x + w * row.review, y + 4, C.brass, 5);
    line(c, x + w * row.block, y - 30, x + w * row.block, y + 4, C.red, 5);
    if (row.value !== null) dot(c, x + w * row.value, y - 12, 11, C.sea);
    text(c, row.review.toFixed(2), 1231, y, 36, C.brass, 'mono');
    text(c, row.block.toFixed(2), 1431, y, 36, C.red, 'mono');
    const seen =
      i === 4
        ? clockCue(k, 1, 'Spam crosses')
        : i === 1
          ? clockCue(k, 1, 'Violence crosses')
          : clockCue(k, 1, 'Block takes precedence');
    if (seen)
      text(
        c,
        row.status,
        1625,
        y,
        34,
        row.status === 'Block' || row.status === 'Missing'
          ? C.red
          : row.status === 'Review'
            ? C.brass
            : C.muted,
      );
  });
  if (invalid) {
    if (clockCue(k, 2, 'Route the incomplete record'))
      stamp(c, data.action + '   /   incomplete scores', 103, 863, C.brass);
  } else if (b > 0 && clockCue(k, 1, 'Block takes precedence')) {
    stamp(c, data.action, 103, 863, C.red);
    text(
      c,
      data.reasons.map((r) => r.name + ' · ' + r.status.toLowerCase()).join('      /      '),
      395,
      911,
      41,
      C.ink,
    );
  }
}

export function inputs(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    page(c, 'Video evidence  /  4 frames per second', 'What slips between two samples?', true);
    const jumps = clockCue(k, 3, 'adds frames six and ten');
    label(c, 'Frame index and mean brightness', 105, 350, true);
    luminance.forEach((v, i) => {
      const x = 105 + i * 144,
        selected = i % 4 === 0 || (jumps && framePicks.includes(i));
      box(c, x, 410, 126, 154, selected ? C.gold : '#57736e', 5);
      box(c, x + 7, 417, 112, 140, 'rgb(' + v + ',' + v + ',' + v + ')', 3);
      text(c, v, x + 63, 505, 38, C.white, 'mono', 500, 'center');
      text(c, i, x + 63, 630, 38, selected ? C.gold : C.white, 'mono', 400, 'center');
    });
    text(
      c,
      jumps ? 'Selected   0, 4, 6, 8, 10' : 'One per second   0, 4, 8',
      104,
      727,
      47,
      C.white,
      'serif',
    );
    if (clockCue(k, 3, 'Swapping light and dark halves')) {
      for (let i = 0; i < 2; i++) {
        box(c, 108 + i * 221, 797, 172, 94, '#111f20');
        box(c, 108 + i * 221 + 86 * i, 797, 86, 94, '#e8e1cb');
      }
      text(c, 'Different frames, identical mean', 594, 866, 44, C.mint);
    }
    return;
  }
  page(
    c,
    b === 2 ? 'Decision authority' : 'Image evidence',
    b === 2 ? 'Which action can this caller take?' : 'Did a score of zero cover this photo?',
  );
  if (b === 2) {
    ruledPage(c, 102, 315, 806, 505);
    label(c, 'JUDGE RECOMMENDATION', 162, 402);
    text(c, 'Block profile', 162, 512, 68, C.ink, 'serif');
    text(c, 'Category    Impersonation', 164, 612, 39, C.muted);
    text(c, 'Confidence   0.82', 164, 678, 39, C.muted);
    text(c, 'Rationale   Disputed ownership', 164, 752, 36, C.muted);
    label(c, 'CALLER PERMISSION', 1037, 399);
    text(c, caller.permissions[0], 1037, 511, 60, C.ink, 'serif');
    line(c, 1037, 561, 1763, 561);
    if (clockCue(k, 2, 'The account stays') && !canExecute) {
      stamp(c, 'Send to review', 1037, 626, C.brass);
      text(c, 'Profile access unchanged', 1037, 789, 42, C.muted);
    }
    return;
  }
  portrait(c, kingfisher, 451, 588, 252);
  label(c, 'IMAGE-ONLY ADAPTER', 855, 386);
  text(c, adapter.category, 852, 478, 64, C.ink, 'serif');
  text(c, 'Returned score', 855, 583, 39, C.muted);
  text(c, adapter.score, 1602, 583, 58, C.ink, 'mono');
  line(c, 855, 621, 1720, 621);
  text(c, 'Applied input types', 855, 700, 39, C.muted);
  text(c, JSON.stringify(adapter.assessedInputs), 1555, 700, 56, C.ink, 'mono');
  if (clockCue(k, 1, 'Mark it unassessed'))
    stamp(c, 'Unassessed  /  request evidence', 850, 794, C.brass);
}
