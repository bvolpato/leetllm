import { P, beat, cue, after, scale, integer, pct, signed, clamp } from './workshop.mjs';
import {
  assign,
  version,
  clusterDesignEffect,
  incidentOutcome,
  meter,
} from './evidence.mjs';

export function opening(s, k) {
  const b = beat(k),
    restored = cue(k, 1, 'The answer says'),
    exposed = cue(k, 2, 'The runbook makes');
  s.paper(82, 156, 816, 680);
  s.paper(972, 126, 856, 744);
  s.box(92, 156, 28, 680, '#77a39a');
  s.poly(
    [
      [725, 156],
      [789, 156],
      [789, 266],
      [757, 240],
      [725, 266],
    ],
    P.control,
  );
  s.small('PAYMENTS   /   RUNBOOK', 163, 235, P.control);
  s.txt('Rollback', 164, 353, 78, P.ink, { face: 'Serif' });
  s.line([
    [164, 425],
    [807, 425],
  ]);
  s.txt('“Rollback requires', 164, 512, 53, P.ink, { face: 'Serif' });
  s.txt('owner acknowledgement.”', 164, 586, 53, P.ink, { face: 'Serif', max: 680 });
  s.small('INCIDENT   /   ASSISTANT', 1038, 205, P.rewrite);
  s.txt('“Acknowledgement', 1036, 338, 62, P.ink, { face: 'Serif' });
  s.txt('alone', 1038, 423, 62, P.ink, { face: 'Serif' });
  s.txt('authorizes rollback.”', 1213, 423, 62, P.ink, { face: 'Serif', max: 554 });
  if (!restored) {
    s.box(1028, 381, 161, 85, P.ink, 4);
    for (let x = 1045; x < 1165; x += 20)
      s.line(
        [
          [x, 449],
          [x + 18, 397],
        ],
        '#426367',
        3,
      );
  }
  if (exposed)
    s.line(
      [
        [1039, 464],
        [1183, 464],
      ],
      P.bad,
      7,
    );
  s.line([
    [1040, 504],
    [1758, 504],
  ]);
  const clicked = cue(k, 1, 'Open the runbook');
  s.box(1040, 550, 336, 89, clicked ? P.control : P.back, 45);
  s.center(clicked ? 'Marked usable' : 'Mark usable', 1208, 594, 42, clicked ? P.white : P.ink);
  s.small('08 min', 1421, 595);
  if (cue(k, 2, 'At minute ten'))
    s.txt('Blinded audit   ·   1 grounding failure', 1040, 708, 37, P.bad);
  if (cue(k, 2, 'One answer enters'))
    s.txt('10 min   ·   1 resolved incident', 1040, 778, 37, P.good);
  if (b >= 3) {
    s.small(
      b === 3
        ? 'Assignment changes the retrieval query.'
        : 'Grounding limit   +0.50 percentage points',
      141,
      903,
      P.white,
    );
  }
}

export function routing(s, k) {
  s.page('ASSIGNMENT REGISTER', version);
  const X = scale(0, 99, 240, 1660),
    y = 477;
  s.box(X(0), y, X(49.5) - X(0), 36, P.rewrite);
  s.box(X(49.5), y, X(99) - X(49.5), 36, P.control);
  s.small('0 – 49   /   rewrite', 240, 566, P.rewrite);
  s.small('50 – 99   /   control', 1060, 566, P.control);
  const rows = [assign('inc-014'), assign('inc-001')];
  if (beat(k) === 1 && !cue(k, 1, 'That puts its question')) {
    s.txt('inc-014', 165, 330, 50);
    s.small('Hash the incident ID with the experiment version.', 165, 734);
  }
  for (const [i, r] of rows.entries()) {
    if (!cue(k, 1, i ? 'and gets the rewrite' : 'That puts its question')) continue;
    const x = X(r.bucket);
    s.line(
      [
        [x, 446],
        [x, y],
      ],
      P.ink,
      4,
    );
    s.dot(x, y + 17, 11, P.white);
    s.center(r.id + '  ·  ' + r.bucket, x, 379, 44);
    s.small(r.arm.toUpperCase(), x - 70, 427, i ? P.rewrite : P.control);
  }
  if (beat(k) > 1) {
    const done = cue(k, 3, 'Imagine sending');
    const x = done ? X(rows[0].bucket) : 400;
    s.paper(x - 224, 673, 448, 130);
    s.center('inc-014  /  follow-up', x, 711, 35);
    s.center(done ? 'Stored arm: control' : 'Which arm?', x, 766, 36, done ? P.control : P.soft);
    if (done)
      s.line(
        [
          [x, 673],
          [x, 604],
        ],
        P.control,
        5,
      );
  }
}

export function contrast(s, k) {
  const b = beat(k);
  if (b <= 3) {
    s.page('EXPERIMENT SPECIFICATION', 'Two retrieval paths');
    s.small('CONTROL', 165, 310, P.control);
    s.small('TREATMENT', 1000, 310, P.rewrite);
    s.txt('“The canary is at 7% errors', 165, 396, 48, P.ink, { face: 'Serif' });
    s.txt('and the owner acked.', 165, 459, 48, P.ink, { face: 'Serif' });
    s.txt('Can we roll it back?”', 165, 522, 48, P.ink, { face: 'Serif' });
    s.txt('canary rollback error-rate', 1000, 399, 45, P.rewrite, { face: 'Mono' });
    s.txt('policy owner acknowledgement', 1000, 465, 45, P.rewrite, { face: 'Mono', max: 740 });
    s.line(
      [
        [530, 559],
        [530, 632],
        [960, 632],
        [960, 677],
      ],
      P.control,
      5,
    );
    s.line(
      [
        [1360, 559],
        [1360, 632],
        [960, 632],
      ],
      P.rewrite,
      5,
    );
    s.center(
      'Runbook snapshot   ·   generator   ·   prompt   ·   greedy decoder',
      960,
      740,
      41,
      P.ink,
      1580,
    );
    if (b > 1)
      s.center('Effect of assignment, including rewrite delays and failures', 960, 833, 38, P.soft);
  } else if (b <= 5) {
    s.page('INTERFERENCE', 'How one incident can affect another');
    const left = 460, right = 1460;
    s.center('Rewrite incident', left, 306, 60, P.rewrite);
    s.center('Control incident', right, 306, 60, P.control);

    if (!cue(k, 4, 'A technician')) {
      s.center('SUTVA assumes', 960, 463, 50, P.soft);
      if (cue(k, 4, 'no interference'))
        s.center('No interference between incidents', 960, 580, 60);
      if (cue(k, 4, 'no consequential hidden'))
        s.center('No hidden versions that affect outcomes', 960, 688, 60);
      return;
    }

    const separateTeams = cue(k, 5, 'but it does');
    s.center(separateTeams ? 'Learning can stay within each team' : 'Same engineer',
      960, 426, 46, P.soft);
    if (separateTeams) {
      s.center('Team A', left, 521, 58);
      s.center('Team B', right, 521, 58);
    } else {
      if (cue(k, 4, 'learn a rollback procedure'))
        s.center('Learns rollback', left, 521, 58);
      const carry = cue(k, 4, 'apply it', 1.1);
      if (carry > 0) {
        const tip = 722 + 465 * carry;
        s.line([[716, 521], [tip, 521]], P.gold, 9);
        s.poly([[tip + 14, 521], [tip - 12, 501], [tip - 12, 541]], P.gold);
      }
      if (cue(k, 4, 'control incident'))
        s.center('Uses it again', right, 521, 58);
    }

    if (cue(k, 4, 'Extra rewrite work')) {
      s.center('One shared worker', 960, 657, 46, P.soft);
      s.box(170, 714, 1580, 108, P.back, 12);
      s.box(178, 722, 774, 92, P.rewrite, 8);
      s.center('Rewrite runs', left, 768, 56, P.white);
      if (cue(k, 4, 'delay control'))
        s.center('Control waits', right, 768, 56, P.ink);
    }
  } else {
    s.page('CLUSTER RANDOMIZATION', 'An on-call team shares a history');
    for (let i = 0; i < 20; i++)
      s.dot(236 + (i % 5) * 98, 365 + Math.floor(i / 5) * 98, 29, P.control);
    s.small('20 incidents in one team', 172, 810);
    s.txt('Within-team correlation', 960, 335, 47);
    s.txt('0.10', 960, 417, 78, P.rewrite, { face: 'Serif' });
    s.txt('1 + (20 − 1) × 0.10', 960, 554, 52, P.ink);
    if (cue(k, 6, 'This approximation'))
      s.txt(
        'Variance multiplier  ' + clusterDesignEffect(20, 0.1).toFixed(1) + '×',
        960,
        676,
        54,
        P.control,
      );
    s.small('Equal clusters   /   team-aware inference', 960, 793, P.soft, 760);
  }
}

function timePaper(s, title, rows, now, score) {
  s.page('INCIDENT LOG    /    MINUTES SINCE ENROLLMENT', title);
  const X = scale(0, 18, 370, 1490);
  s.box(X(0), 296, X(10) - X(0), 448, '#dfe7d6');
  s.line(
    [
      [X(10), 284],
      [X(10), 760],
    ],
    P.gold,
    5,
  );
  s.center('Deadline', X(10), 262, 30, P.gold);
  s.line(
    [
      [X(now), 306],
      [X(now), 737],
    ],
    P.control,
    3,
    [7, 9],
  );
  rows.forEach(({ id, usableAt, newPageAt }, i) => {
    const y = 370 + 137 * i;
    s.txt(id, 155, y, 42);
    s.line(
      [
        [X(0), y],
        [X(18), y],
      ],
      P.rule,
      3,
    );
    if (usableAt !== null && usableAt <= now) {
      s.dot(X(usableAt), y, 15, P.control);
      s.center('usable', X(usableAt), y - 34, 27, P.control);
    }
    if (newPageAt !== null && newPageAt <= now) {
      s.poly(
        [
          [X(newPageAt), y - 15],
          [X(newPageAt) + 15, y],
          [X(newPageAt), y + 15],
          [X(newPageAt) - 15, y],
        ],
        P.bad,
      );
      s.center('page', X(newPageAt), y + 35, 27, P.bad);
    }
    if (score) {
      const v = incidentOutcome({ usableAt, newPageAt, observedMinutes: now });
      s.txt(v, 1545, y, 34, v === 'resolved' ? P.good : v === 'pending' ? P.soft : P.bad);
    }
  });
  s.axis(X, [0, 5, 8, 10, 15, 18], 765);
  s.small('Observation age   ' + now + ' min', 155, 862);
}
export function metric(s, k) {
  if (beat(k) < 3) {
    const complete = cue(k, 1, 'Every enrolled incident');
    timePaper(
      s,
      'Follow the incident through minute ten',
      [{ id: 'Incident', usableAt: 8, newPageAt: null }],
      complete ? 10 : 8,
      complete,
    );
    s.box(347, 530, 1110, 95, P.paper, 6);
    s.txt(
      complete ? 'No new page through minute 10' : 'Check for new pages through minute 10',
      370,
      580,
      46,
      P.ink,
    );
    if (beat(k) === 2) {
      s.box(348, 644, 1088, 80, P.paper, 6);
      s.small('Late or absent answer   /   retain assigned arm', 370, 685);
    }
  } else {
    s.page('OUTCOME DEFINITION', 'The metric and the service can disagree');
    s.txt('Engineer’s record', 174, 340, 55, P.ink, { face: 'Serif' });
    s.txt('Service health', 1000, 340, 55, P.ink, { face: 'Serif' });
    s.line([
      [175, 410],
      [1750, 410],
    ]);
    s.txt('Usable at minute 8', 175, 502, 46, P.control);
    s.txt('Errors still rising', 1000, 502, 46, P.bad);
    s.line(
      [
        [996, 688],
        [1090, 686],
        [1175, 643],
        [1270, 675],
        [1390, 586],
        [1490, 610],
        [1640, 565],
      ],
      P.bad,
      7,
    );
    s.txt('No page by minute 10', 175, 604, 42);
    s.txt('Resolved by this metric', 175, 766, 45, P.good);
  }
}
export function maturity(s, k) {
  const b = beat(k);
  if (b <= 3) {
    const now = cue(k, 3, 'C keeps its success')
      ? 18
      : cue(k, 2, 'Score the rows now')
        ? 10
        : cue(k, 1, 'At minute nine')
          ? 9
          : 8;
    const events = [null, 10, 18].map((newPageAt, i) => ({ id: 'ABC'[i], usableAt: 8, newPageAt }));
    timePaper(
      s,
      'Three usable marks at minute eight',
      events,
      now,
      !!cue(k, 2, 'Advance to the deadline'),
    );
    return;
  }
  if (b >= 6) {
    s.page('SAMPLING PLAN', 'Where does each denominator come from?');
    const items = [
      ['Resolution', 'All enrolled incidents', 'Timeouts stay in their arm.'],
      ['Grounding', 'Audited answers', 'Use the audit sampling plan.'],
      ['Latency', 'First requests', 'Apply the declared timeout rule.'],
    ];
    items.forEach(([a, d, t], i) => {
      const y = 354 + i * 163;
      s.txt(a, 168, y, 47, i === 1 ? P.rewrite : P.control);
      s.txt(d, 675, y, 48);
      s.small(t, 676, y + 57);
      s.line([
        [167, y + 104],
        [1743, y + 104],
      ]);
    });
    return;
  }
  const excluded = after(k, 4, 'two out of two') && !after(k, 5, 'Put it back');
  const successes = after(k, 4, 'with no new page');
  const timeout = after(k, 4, 'never got a usable mark');
  const tally = after(k, 4, 'two out of three');
  s.page('TREATMENT   /   COMPLETE FOLLOW-UP', 'Keep the timed-out incident');
  ['Usable at 6 min', 'Usable at 8 min', 'Timed out'].forEach((value, i) => {
    const x = 153 + i * 568;
    const known = i === 2 ? timeout : successes;
    const faded = excluded && i === 2;
    s.box(x, 324, 500, 220, !known || faded ? P.back : i === 2 ? '#e8d8c9' : '#d6e6dc', 10);
    s.small('INCIDENT  ' + (i + 1), x + 37, 385);
    s.txt(known ? value : 'Outcome hidden', x + 37, 465, 48, faded || !known ? P.soft : P.ink);
    if (faded)
      s.line(
        [
          [x + 30, 487],
          [x + 470, 423],
        ],
        P.bad,
        6,
      );
  });
  s.small('BY ASSIGNED INCIDENT', 166, 646, P.good);
  s.txt(tally ? '2 / 3 resolved' : 'Resolved: ?', 166, 737, 64, tally ? P.good : P.soft, {
    face: 'Mono',
  });
  if (excluded) {
    s.small('AFTER DROPPING THE TIMEOUT', 1068, 646, P.bad);
    s.txt('2 / 2 resolved', 1068, 737, 64, P.bad, { face: 'Mono' });
  }
}
export function lift(s, k) {
  s.page('RESOLUTION REGISTER', 'Eighty additional successes');
  const m = meter();
  m.arms.forEach((a, i) => {
    const x = 170 + 850 * i,
      col = i ? P.rewrite : P.control;
    s.small(i ? 'REWRITE' : 'ORIGINAL QUERY', x, 298, col);
    for (let j = 0; j < 100; j++)
      s.box(
        x + (j % 20) * 31,
        374 + Math.floor(j / 20) * 37,
        25,
        28,
        j < Math.round(100 * a.rate) ? col : P.back,
        3,
      );
    s.txt(integer(a.resolved) + ' / ' + integer(a.n), x, 628, 52);
    s.small('1 tile = 20 incidents', x, 688);
  });
  let line = '42% − 38%';
  if (cue(k, 1, 'end')) line += '   =   +4 percentage points';
  if (beat(k) === 2) line = '4 ÷ 38   ≈   10.5% relative lift';
  if (beat(k) === 3)
    line =
      'SE ' +
      m.se.toFixed(2) +
      ' pp     ·     95% interval  ' +
      signed(m.low, 1) +
      ' to ' +
      signed(m.high, 1) +
      ' pp';
  s.center(line, 960, 820, 50, P.ink, 1550);
}

export function copies(s, k) {
  const single = !!cue(k, 2, 'The estimate stays');
  const copied = meter(4),
    independent = meter(),
    m = single ? independent : copied;
  const widen = cue(k, 2, 'The narrower interval', 0.85, {
    captionStart: 'The interval opens out',
  });
  const trace = cue(k, 1, 'Follow the four wires', 1.5);
  const verified = !!cue(k, 2, 'Count once');
  s.small('MESSAGE CONTACTS', 105, 100, P.white);
  for (let i = 0; i < 4; i++) {
    const x = 230 + i * 180;
    s.line(
      [
        [x, 292],
        [x, 339 + i * 18],
        [507, 503],
      ],
      P.brass,
      6,
    );
    s.dot(x, 230, 64, '#101e20');
    s.dot(x, 224, 56, '#8b9d8b');
    s.dot(x, 224, 44, '#86d29c');
    s.dot(x - 11, 209, 13, '#caf3c4');
    s.center(String(i + 1), x, 139, 31, P.white);
    if (trace > 0) {
      const f = clamp((trace - 0.35) / 0.65);
      s.dot(x + (507 - x) * f, 339 + i * 18 + (503 - 339 - i * 18) * f, 7, P.white);
    }
  }
  s.box(395, 481, 223, 76, P.deep, 36);
  s.dot(426, 518, 18, P.brass);
  s.dot(585, 518, 18, P.brass);
  s.line(
    [
      [426, 518],
      [585, 518],
    ],
    P.brass,
    11,
  );
  if (verified) {
    s.center('Incident 17', 508, 631, 55, P.white);
    s.center('One resolved incident', 508, 701, 39, '#a5dabb');
  }
  if (!verified) {
    const edge = 328 + 120 * trace;
    s.box(118, edge, 775, 447, P.bg, 13);
    for (const x of [145, 866]) s.dot(x, edge + 21, 6, P.ridge);
    s.center(trace ? 'How many outcomes?' : 'Trace the four leads', 506, edge + 115, 46, P.white);
  }
  s.paper(958, 110, 866, 752);
  s.small(single ? 'COUNT BY INCIDENT' : 'COUNT BY MESSAGE ROW', 1017, 177, P.control);
  s.txt('Resolution gain', 1017, 280, 69, P.ink, { face: 'Serif' });
  s.small('percentage points', 1019, 350);
  const X = scale(0, 8, 1035, 1750),
    y = 497,
    lo = copied.low + (independent.low - copied.low) * widen,
    hi = copied.high + (independent.high - copied.high) * widen,
    intervalColor = widen > 0 ? P.control : P.gold;
  s.span(X, lo, hi, y, intervalColor, 12);
  if (widen === 0 || widen === 1)
    for (const v of [lo, hi]) s.center(v.toFixed(1), X(v), y - 46, 35, intervalColor);
  if (widen > 0) {
    for (const v of [copied.low, copied.high])
      s.line(
        [
          [X(v), y + 17],
          [X(v), y + 30],
        ],
        P.gold,
        4,
      );
  }
  s.dot(X(m.delta), y, 17, P.ink);
  s.center(signed(m.delta, 1), X(m.delta), y - 46, 35, P.ink);
  s.axis(X, [0, 2, 4, 6, 8], 544);
  m.arms.forEach((a, i) => {
    const x = 1024 + i * 382;
    s.small(i ? 'REWRITE' : 'CONTROL', x, 658, i ? P.rewrite : P.control);
    s.txt(integer(a.resolved) + ' / ' + integer(a.n), x, 726, 40);
    s.small(pct(a.rate), x, 789);
  });
  s.center(
    widen === 1
      ? 'Interval from independent incidents'
      : widen > 0
        ? 'Recalculating by incident'
        : 'Copied rows counted as independent',
    1386,
    913,
    32,
    P.white,
  );
  if (beat(k) >= 3) {
    s.small('STANDARD ERROR', 151, 820, P.brass);
    s.txt('√(0.38×0.62 / 2,000', 150, 867, 40, P.white);
    s.txt(' + 0.42×0.58 / 2,000) = 1.55 pp', 150, 918, 40, P.white);
  }
}
