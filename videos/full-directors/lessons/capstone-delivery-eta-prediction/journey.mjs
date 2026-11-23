import {
  C,
  rect,
  round,
  poly,
  line,
  dot,
  ring,
  txt,
  head,
  ground,
  tag,
  bar,
  van,
  box,
  house,
  lerp,
  ease,
  cue,
  afterCue,
  pct,
} from './art.mjs';
import {
  noonOrder as o,
  freshOrder,
  clock,
  atDoor,
  atNoon,
  scanAt,
  matches,
  trips,
  estimate,
  interval,
  residuals,
  nineErrors,
  withinRange,
  pinball,
  bounds,
  heldOutDurations,
  inside as withinBounds,
  limits,
  propose,
} from './evidence.mjs';
import street from '../../../director-cuts/lessons/capstone-delivery-eta-prediction/film.mjs';

const b = (k) => k.beat.beatIndex;
export function opening(g, k) {
  if (cue(k, 2, 'Now rewind')) {
    snapshot(g, k, true);
    return;
  }
  const revised = cue(k, 0, 'now says ten'),
    arrived = cue(k, 1, 'doorbell rings'),
    judged = cue(k, 2, 'Yes');
  rect(g, 0, 0, 960, 540, '#3a5961');
  for (let y = 0; y < 490; y += 28) {
    line(g, 0, y, 599, y, '#527078', 1.8);
    for (let x = y % 56 ? 73 : 0; x < 600; x += 146) line(g, x, y, x, y + 28, '#527078', 1.8);
  }
  poly(
    g,
    [
      [0, 0],
      [507, 0],
      [0, 480],
    ],
    '#314d58',
  );
  rect(g, 48, 103, 409, 370, '#213640');
  rect(g, 60, 106, 386, 365, '#ccb793');
  rect(g, 77, 122, 351, 351, '#316b70');
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 3; i++) {
      rect(g, 94 + i * 108, 141 + j * 122, 95, 101, '#204e58');
      rect(g, 99 + i * 108, 147 + j * 122, 85, 88, '#376e71');
    }
  dot(g, 398, 334, 10, C.amber);
  rect(g, 14, 465, 477, 16, '#ccac88');
  rect(g, 0, 481, 960, 59, '#a99a83');
  round(g, 60, 23, 385, 80, 5, C.cream);
  txt(g, 'ORIGINAL PROMISE', 252, 48, 15, C.blue, 'center', 'Mono', 600);
  txt(g, 'By 9:00 PM', 252, 88, 36, C.ink, 'center', 'Serif', 600);
  round(g, 478, 213, 53, 93, 11, '#19313a');
  round(g, 483, 218, 43, 82, 8, '#556b69');
  dot(g, 505, 244, 9, C.ink);
  ring(g, 505, 280, 12, arrived ? C.amber : C.light, 3);
  if (arrived) {
    const wave = cue(k, 1, 'doorbell rings', 0.9);
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.arc(505, 280, 13 + i * 7 + wave * 4, -0.75, 0.75);
      g.strokeStyle = C.amber;
      g.lineWidth = 2;
      g.stroke();
    }
    box(g, 257, 425, 114, 'O-201');
  }
  round(g, 592, 66, 309, 403, 35, '#122a34');
  round(g, 604, 79, 285, 376, 25, C.cream);
  round(g, 695, 85, 103, 11, 5, '#122a34');
  txt(g, 'East 7 delivery', 628, 146, 28, C.blue, 'left', 'Serif');
  line(g, 627, 165, 864, 165, C.line);
  txt(g, 'Tracking estimate', 627, 207, 18, C.muted);
  txt(g, revised ? '10:00 PM' : '9:00 PM', 626, 265, 49, C.ink, 'left', 'Serif');
  if (arrived) {
    txt(g, 'Doorbell', 627, 316, 18, C.muted);
    txt(g, '9:30 PM', 626, 359, 38, C.ink, 'left', 'Serif');
  }
  if (judged) tag(g, atDoor(o.doorstep, o.promise) + ' minutes late', 626, 392, C.cream, C.rust);
}

export function snapshot(g, k, rewind = false) {
  const i = rewind ? 0 : b(k);
  ground(g);
  head(g, 'O-201   /   EAST 7', 'The noon snapshot');
  const left = 78,
    right = 877,
    x = (h) => left + ((h - o.pickup) / (o.promise - o.pickup)) * (right - left);
  const travel = rewind ? 1 : ease(cue(k, 0, 'picked up', 2.4));
  rect(g, 0, 257, 960, 44, C.ink);
  for (let xx = 0; xx < 960; xx += 47) rect(g, xx, 277, 25, 2, C.cream);
  house(g, right, 258, 0.74);
  poly(
    g,
    [
      [25, 202],
      [47, 187],
      [47, 201],
      [70, 186],
      [70, 201],
      [98, 185],
      [98, 258],
      [25, 258],
    ],
    C.rust,
  );
  for (let w = 0; w < 3; w++) rect(g, 32 + w * 20, 220, 13, 31, C.paper);
  van(g, lerp(left, x(o.snapshot), travel), 270, 0.65);
  for (const [h, label, time] of [
    [o.pickup, 'Pickup', '10:00'],
    [o.snapshot, 'Scored', '12:00'],
    [o.promise, 'Promised', '21:00'],
  ]) {
    line(g, x(h), 301, x(h), 319, C.ink, 2);
    txt(g, label, x(h), 344, 17, C.muted, 'center');
    txt(g, time, x(h), 375, 25, C.ink, 'center', 'Mono');
  }
  if (i === 0) txt(g, 'May 1   ·   UTC   ·   In transit', 48, 446, 24, C.teal);
  if (i === 1 || i === 2) {
    txt(g, 'Customer', 48, 430, 17, C.teal);
    txt(g, 'Arrival time', 48, 467, 29, C.ink, 'left', 'Serif');
    txt(g, 'Operations', 355, 430, 17, C.teal);
    txt(g, 'Risk of missing 21:00', 355, 467, 29, C.ink, 'left', 'Serif');
    if (i === 2) tag(g, 'Policy → action', 696, 438);
  }
  if (i === 3) {
    txt(g, 'Local promise → UTC instant', 48, 437, 27, C.blue);
    txt(g, 'Delivery confirmation pending   ·   Label unknown', 48, 480, 21, C.muted);
  }
  if (i >= 4) {
    const cells = [
      ['Tier', 'Expedited'],
      ['Elapsed', '2 h'],
      ['To promise', '9 h'],
      ['Scan age', '?'],
      ['Backlog age', '?'],
    ];
    cells.forEach(([name, v], j) => {
      const x = 47 + j * 181;
      txt(g, name, x, 430, 16, C.muted);
      txt(g, v, x, 470, 28, j >= 3 ? C.rust : C.ink, 'left', 'Serif');
    });
  }
}

export function clocks(g, k) {
  ground(g);
  head(g, 'CARRIER LOG   /   MAY 1 UTC', 'What had reached tracking by noon?');
  const replay = b(k) >= 2;
  const original = atNoon();
  const revised = atNoon(11.75);
  const move = ease(cue(k, 2, 'Only its availability changes', 0.85));
  const rows = move === 1 ? revised : original;
  const cutoff = o.snapshot;
  const selected = scanAt(rows, cutoff);
  const showChoice = replay
    ? afterCue(k, 3, 'Use the hub scan')
    : afterCue(k, 1, "Use the eleven o'clock transit scan");
  const showAge = replay
    ? afterCue(k, 3, 'gives half an hour')
    : afterCue(k, 1, 'the scan is one hour old');
  const showSpan = replay
    ? cue(k, 3, 'Noon minus eleven thirty')
    : cue(k, 1, 'Subtract its event time from noon');
  const x = (t) => 216 + (t - 10.5) * 149;
  const edge = x(cutoff);

  dot(g, 52, 135, 5, C.ink);
  txt(g, 'Scan event', 65, 141, 18);
  ring(g, 191, 135, 6, C.ink);
  txt(g, 'Readable online', 205, 141, 18);
  txt(g, clock(cutoff) + ' cutoff', edge, 141, 17, C.rust, 'center', 'Mono');
  rect(g, edge, 155, 917 - edge, 224, '#e8ddc6');
  line(g, edge, 151, edge, showSpan ? 428 : 379, C.rust, 2);
  rows.forEach((r, j) => {
    const y = 195 + 73 * j;
    const col = showChoice && r.name === selected.name ? C.teal : C.ink;
    const moving = original[j].available !== revised[j].available && move > 0 && move < 1;
    const eventX = x(r.event);
    const availableX = x(
      moving ? lerp(original[j].available, revised[j].available, move) : r.available,
    );
    const ringColor = moving ? C.gold : col;
    txt(g, r.name, 48, y + 7, 21, col);
    line(g, 213, y, 917, y, C.line);
    line(g, eventX, y - 8, availableX, y + 8, ringColor, 2.5);
    dot(g, eventX, y - 8, 6, col);
    dot(g, availableX, y + 8, 6, C.paper);
    ring(g, availableX, y + 8, 7, ringColor, 2.5);
    txt(g, clock(r.event), eventX, y - 19, 18, col, 'center', 'Mono');
    if (!moving) txt(g, clock(r.available), availableX, y + 36, 18, col, 'center', 'Mono');
  });
  if (showSpan) {
    const start = x(selected.event);
    txt(g, 'Age at noon', 48, 427, 24, C.teal, 'left', 'Serif');
    bar(g, start, 420, edge - start, C.teal, 5);
    for (const end of [start, edge]) line(g, end, 413, end, 428, C.teal, 3);
    txt(g, clock(selected.event), start, 452, 18, C.teal, 'center', 'Mono');
    txt(g, clock(cutoff), edge, 452, 18, C.teal, 'center', 'Mono');
    if (showAge) txt(g, selected.age + ' h', edge + 58, 427, 31, C.teal, 'left', 'Mono');
  } else if (!showChoice) {
    txt(g, 'Which scan supplies the age?', 48, 436, 27, C.ink, 'left', 'Serif');
  }
}

export function history(g, k) {
  ground(g);
  const noMatch = cue(k, 4, 'none of those trips match');
  head(
    g,
    noMatch ? 'NEW ROUTE   /   SAME SNAPSHOT' : 'EAST 7   /   EXPEDITED   /   KNOWN BY NOON',
    'Journeys from pickup to delivery',
  );
  const rows = matches(noMatch ? [] : trips),
    result = estimate(
      10,
      rows.map((t) => t.hours),
    );
  if (!result) {
    line(g, 65, 276, 897, 276, C.line, 3);
    txt(g, '0 matching journeys', 478, 246, 45, C.muted, 'center', 'Serif');
    tag(g, 'ETA unavailable  ·  Request review', 315, 328);
    return;
  }
  const middle = cue(k, 2, 'two middle'),
    shown = b(k) >= 3;
  rows.forEach((r, i) => {
    const y = 162 + i * 56,
      x = 150,
      w = r.hours * 38;
    const col = middle && (i === 1 || i === 2) ? C.teal : C.muted;
    txt(g, r.id, 52, y + 8, 17, C.ink, 'left', 'Mono');
    bar(g, x, y, w, col, 5);
    for (let h = 0; h < r.hours; h++) line(g, x + 38 * h, y - 5, x + 38 * h, y + 5, col, 1);
    house(g, x + w, y, 0.29);
    txt(g, r.hours + ' h', x + w + 26, y + 7, 21, col);
  });
  if (b(k) === 1) {
    line(g, 45, 386, 914, 386, C.line);
    txt(g, 'H-late   ·   4 h', 48, 425, 24, C.rust);
    txt(g, 'Delivered 13:00   /   Recorded 13:05', 290, 425, 22, C.ink);
    txt(g, 'Outside the noon history', 290, 463, 21, C.rust);
  }
  if (shown) {
    txt(
      g,
      '10:00 + ' + result.median + ' h = ' + result.arrival,
      47,
      427,
      37,
      C.ink,
      'left',
      'Serif',
    );
    txt(
      g,
      '4 matches  ·  Observed range ' + result.first + ' to ' + result.last + ' next day',
      47,
      475,
      22,
      C.teal,
    );
  }
}

export function targets(g, k) {
  const i = b(k);
  if (i < 4) {
    g.save();
    g.scale(0.5, 0.5);
    const folding = i === 3;
    const posed = folding ? cue(k, 3, 'nine tonight') : cue(k, 1, 'See the red depot');
    const index = folding ? (posed ? 5 : 4) : posed ? 3 : 2;
    street.draw(g, {
      ...k,
      index,
      reveal: (phrase, duration) => cue(k, folding ? 3 : 1, phrase, duration),
    });
    g.restore();
    return;
  }
  ground(g);
  if (i < 6) {
    head(g, 'FOUR COMPLETED JOURNEYS', 'Where could the next trip fit?');
    txt(g, 'Exchangeable durations  ·  No ties', 46, 147, 19, C.teal);
    const xs = (j) => 84 + j * 98,
      inside = cue(k, 4, 'three inside');
    line(g, xs(0), 290, xs(8), 290, C.line, 3);
    [8, 10, 12, 14].forEach((h, j) => {
      const x = xs(2 * j + 1);
      box(g, x - 22, 266, 39);
      txt(g, h + ' h', x, 234, 23, C.ink, 'center', 'Mono');
    });
    for (let n = 0; n < 5; n++) {
      const x = xs(n * 2),
        col = inside && n > 0 && n < 4 ? C.teal : C.muted;
      dot(g, x, 290, 12, C.paper);
      ring(g, x, 290, 12, col, 3);
      txt(g, 'Rank ' + (n + 1), x, 342, 18, col, 'center');
    }
    if (i === 5)
      txt(
        g,
        '3 inside ÷ 5 possible ranks = ' + pct(withinRange(4)),
        480,
        427,
        33,
        C.teal,
        'center',
        'Serif',
      );
  } else {
    if (i === 6) {
      head(g, 'ARRIVAL MODEL   /   ERROR IN HOURS', 'What does an early guess cost?');
      const x = (e) => 312 + e * 99,
        y = (v) => 358 - v * 75;
      line(g, x(-2.55), 358, x(2.55), 358, C.muted, 2);
      line(g, x(0), 366, x(0), 143, C.muted, 2);
      for (const e of [-2.4, 2.4]) line(g, x(0), y(0), x(e), y(pinball(e, 0.9)), C.blue, 5);
      txt(g, 'Actual − predicted (h)', 315, 429, 18, C.muted, 'center');
      txt(g, 'Loss at q = 0.90', 59, 150, 19, C.teal);
      for (const e of [-2, 0, 2]) txt(g, String(e), x(e), 391, 18, C.muted, 'center', 'Mono');
      if (cue(k, 6, 'two-hour underestimate')) {
        dot(g, x(2), y(pinball(2, 0.9)), 7, C.rust);
        txt(g, '2 h early   →   1.8', 610, 252, 24, C.rust);
      }
      if (cue(k, 6, 'two-hour overestimate')) {
        dot(g, x(-2), y(pinball(-2, 0.9)), 7, C.teal);
        txt(g, '2 h late     →   0.2', 610, 313, 24, C.teal);
      }
    } else {
      head(g, 'DELIVERY DURATION IN HOURS', 'A nominal 90% window');
      const inspect = cue(k, 7, 'count held-out deliveries'),
        actual = heldOutDurations;
      const x = (h) => 80 + h * 48,
        [lower, upper] = bounds;
      line(g, x(0), 260, x(17), 260, C.line, 3);
      bar(g, x(lower), 260, x(upper) - x(lower), C.blue, 10);
      const crossed = cue(k, 7, 'Separate fits can cross') && !cue(k, 7, 'lower endpoint first');
      for (const [h, label] of [
        [lower, crossed ? '95th percentile' : 'Lower'],
        [upper, crossed ? '5th percentile' : 'Upper'],
      ]) {
        line(g, x(h), 237, x(h), 281, C.blue, 3);
        txt(g, label + '  ' + h + ' h', x(h), 207, 25, C.blue, 'center', 'Serif');
      }
      if (inspect) {
        actual.forEach((h) => {
          dot(g, x(h), 260, 8, withinBounds(h) ? C.teal : C.rust);
        });
        txt(g, 'Each dot is one held-out delivery duration.', 49, 339, 24, C.muted);
        if (cue(k, 7, 'eighty percent'))
          txt(
            g,
            actual.filter(withinBounds).length +
              ' of ' +
              actual.length +
              ' inside   ·   Observed coverage ' +
              pct(actual.filter(withinBounds).length / actual.length),
            49,
            424,
            31,
            C.teal,
            'left',
            'Serif',
          );
      } else
        txt(
          g,
          crossed
            ? 'Separate fits place the 5th percentile above the 95th.'
            : 'Bounds from fitted 5th and 95th percentiles',
          49,
          348,
          24,
          C.muted,
        );
    }
  }
}

export function calibration(g, k) {
  const i = b(k),
    many = cue(k, 3, 'larger untouched group'),
    errors = many ? nineErrors : residuals;
  const prediction = 11,
    model = interval(errors, prediction),
    sorted = ease(cue(k, 0, 'Sort those errors', 1.8));
  ground(g, true);
  if (i < 5) {
    head(g, 'ABSOLUTE ERROR   /   HOURS', 'Measure the calibration radius', true);
    const x0 = 85,
      dx = many ? 90 : 162,
      base = 348,
      scale = many ? 18 : 34;
    errors.forEach((h, j) => {
      const rank = model.sorted.indexOf(h);
      const x = x0 + dx * lerp(j, rank, many ? 1 : sorted);
      const y = base - Math.sin(sorted * Math.PI) * (j % 2 === 0 ? 16 : -16);
      const color = many && cue(k, 4, 'rank nine') && rank === model.rank - 1 ? C.amber : C.mint;
      rect(g, x - 14, y - h * scale, 28, h * scale, color);
      for (let n = 1; n < h; n++) line(g, x - 14, y - n * scale, x - 3, y - n * scale, C.dark, 1.5);
      txt(g, h + ' h', x, y - h * scale - 13, 20, color, 'center', 'Mono');
      if (sorted === 1 || many)
        txt(g, '#' + (rank + 1), x, base + 38, 19, C.light, 'center', 'Mono');
    });
    line(g, 52, base + 2, 905, base + 2, '#728786', 1);
    if (i >= 1) {
      txt(g, 'Exchangeable errors   ·   90% target', 49, 133, 16, C.mint);
      txt(g, 'Rank = ceil((n + 1) × 0.90)', 49, 166, 20, C.light, 'left', 'Mono');
    }
    if (!many && cue(k, 2, 'fifth error')) {
      const x = x0 + dx * (model.rank - 1),
        reach = ease(cue(k, 2, 'fifth error', 0.65));
      g.setLineDash([5, 6]);
      line(g, x - 26, 323, x + 26, 323, C.amber, 2);
      g.setLineDash([]);
      const pointer = x - dx * (1 - reach);
      poly(
        g,
        [
          [pointer - 9, base + 21],
          [pointer + 9, base + 21],
          [pointer, base + 8],
        ],
        C.amber,
      );
      txt(g, '#' + model.rank, x, base + 52, 20, C.amber, 'center', 'Mono');
      txt(
        g,
        i === 3 ? 'No fifth error  ·  Unbounded radius' : 'Which error sets the radius?',
        x,
        449,
        23,
        C.amber,
        'center',
      );
      if (i === 3) {
        line(g, 57, 439, 429, 439, C.mint, 3);
        for (const [tip, dx] of [
          [55, 12],
          [431, -12],
        ])
          poly(
            g,
            [
              [tip, 439],
              [tip + dx, 432],
              [tip + dx, 446],
            ],
            C.mint,
          );
        txt(g, 'No finite endpoints', 243, 479, 19, C.light, 'center');
      }
    }
    if (many && i === 4 && cue(k, 4, 'rank nine'))
      txt(
        g,
        'ceil(10 × 0.90) = 9' +
          (cue(k, 4, 'nine-hour radius') ? '     →     radius ' + model.radius + ' h' : ''),
        465,
        457,
        30,
        C.amber,
        'center',
        'Serif',
      );
  } else {
    head(g, 'DELIVERY DURATION IN HOURS', 'From error radius to arrival window', true);
    const x = (v) => 82 + v * 37,
      lo = cue(k, 5, 'left gives two'),
      hi = cue(k, 5, 'right gives twenty');
    txt(
      g,
      errors.length + ' held-out errors   ·   Target 90%   ·   Calibration radius ' + model.radius + ' h',
      46,
      155,
      19,
      C.light,
    );
    line(g, x(0), 284, x(21), 284, '#688083', 2);
    txt(g, 'Prediction ' + prediction + ' h', x(prediction), 242, 32, C.amber, 'center', 'Serif');
    for (const [ok, endpoint] of [
      [lo, model.lo],
      [hi, model.hi],
    ])
      if (ok) {
        bar(g, x(prediction), 284, x(endpoint) - x(prediction), C.mint, 8);
        line(g, x(endpoint), 266, x(endpoint), 302, C.mint, 4);
        txt(g, endpoint + ' h', x(endpoint), 346, 28, C.mint, 'center', 'Mono');
      }
    dot(g, x(prediction), 284, 9, C.amber);
    if (i >= 6) {
      txt(g, 'Exchangeable calibration and next errors', 478, 401, 24, C.cream, 'center');
      txt(
        g,
        i === 7
          ? 'By route: count delivered, fraction inside, window width'
          : 'At least 90% across draws',
        478,
        452,
        24,
        C.mint,
        'center',
      );
    }
  }
}

export function freshness(g, k) {
  const i = b(k),
    alt = i === 4 && cue(k, 4, 'order two oh three'),
    fresh = cue(k, 2, 'seven hours');
  const scan = alt ? 31 : 4,
    backlog = alt ? 2 : fresh ? 7 : 12,
    risk = alt ? 0.81 : 0.75,
    result = propose(scan, backlog, risk, 0.4);
  const answered = alt ? cue(k, 4, 'goes to manual review') : i === 1 || i === 3 || i === 4;
  ground(g);
  head(g, (alt ? 'O-203' : 'O-204') + '   /   WARNING PROPOSAL', 'How old is the evidence?');
  [
    [scan, limits.scan, 'Carrier scan'],
    [backlog, limits.backlog, 'Backlog report'],
  ].forEach(([age, limit, name], j) => {
    const y = 175 + j * 105,
      x = (v) => 280 + v * 18;
    txt(g, name, 46, y + 17, 22);
    bar(g, x(0), y + 8, x(34) - x(0), C.line, 3);
    bar(g, x(0), y + 8, x(age) - x(0), age > limit ? C.rust : C.teal, 11);
    line(g, x(limit), y - 11, x(limit), y + 32, C.ink, 2);
    txt(g, 'Limit ' + limit + ' h', x(limit), y + 54, 17, C.muted, 'center');
    dot(g, x(age), y + 8, 7, age > limit ? C.rust : C.teal);
    txt(g, age + ' h', x(age), y - 12, 22, C.ink, 'center', 'Mono');
  });
  line(g, 45, 370, 915, 370, C.line);
  txt(g, 'Supplied risk', 46, 405, 16, C.muted);
  txt(g, pct(risk), 46, 452, 37, C.blue, 'left', 'Serif');
  txt(g, 'Threshold', 248, 405, 16, C.muted);
  txt(g, '40%', 248, 452, 37, C.blue, 'left', 'Serif');
  if (answered) {
    const color = result.action === 'Manual review' ? C.rust : C.teal;
    txt(g, result.action, 470, 431, 34, color, 'left', 'Serif');
    txt(g, result.reason, 471, 464, 19, color, 'left', 'Mono');
  } else txt(g, 'Which action?', 473, 442, 31, C.ink, 'left', 'Serif');
}

function scanReplay(g, k) {
  const i = b(k),
    transit = freshOrder.scans[0],
    hub = freshOrder.scans[1];
  let now = freshOrder.pickup;
  if (cue(k, 0, 'eleven thirty')) now = transit.event;
  if (cue(k, 0, 'eleven forty')) now = transit.available;
  if (cue(k, 0, 'At noon')) now = hub.event;
  if (cue(k, 1, 'At one')) now = freshOrder.snapshot;
  if (cue(k, 1, 'at one fifteen')) now = hub.available;
  if (cue(k, 1, 'Now replay')) now = freshOrder.snapshot;
  const online = freshOrder.scans.filter((r) => r.available <= now);
  head(g, 'NEW PARCEL   /   PICKUP 09:00 UTC', 'One parcel, two clocks');
  txt(g, 'Carrier scan locations', 46, 168, 23, C.ink, 'left', 'Serif');
  const x0 = 90,
    x1 = 330,
    x2 = 598;
  line(g, x0, 260, 657, 260, C.muted, 8);
  for (let x = 99; x < 650; x += 27) line(g, x, 260, x + 12, 260, C.cream, 1.5);
  poly(
    g,
    [
      [x2 - 42, 243],
      [x2 - 42, 197],
      [x2, 172],
      [x2 + 42, 197],
      [x2 + 42, 243],
    ],
    '#ab7154',
  );
  rect(g, x2 - 24, 212, 48, 31, C.ink);
  for (let t = 0; t < 3; t++) line(g, x2 - 24, 215 + t * 8, x2 + 24, 215 + t * 8, C.pale, 1);
  van(g, now >= hub.event ? x2 : now >= transit.event ? x1 : x0, 258, 0.7);
  txt(g, 'Depot', x0, 310, 18, C.muted, 'center');
  txt(g, 'Transit', x1, 310, 18, C.muted, 'center');
  txt(g, 'Hub', x2, 310, 18, C.muted, 'center');
  if (now >= transit.event) txt(g, clock(transit.event), x1, 343, 24, C.ink, 'center', 'Mono');
  if (now >= hub.event) txt(g, clock(hub.event), x2, 343, 24, C.ink, 'center', 'Mono');
  round(g, 684, 130, 238, 270, 18, C.ink);
  txt(g, 'Tracking log', 704, 172, 23, C.cream, 'left', 'Serif');
  txt(g, clock(now) + ' UTC', 705, 211, 22, C.amber, 'left', 'Mono');
  line(g, 704, 230, 900, 230, '#647a78');
  online.forEach((r, j) => {
    const y = 268 + j * 64;
    txt(g, r.name + ' scan', 705, y, 21, C.light);
    txt(g, 'Online ' + clock(r.available), 705, y + 25, 16, C.mint, 'left', 'Mono');
  });
  if (i === 1 && now === 13)
    txt(g, 'At 13:00, which event can supply the scan age?', 48, 462, 28, C.ink, 'left', 'Serif');
  if (i === 2 && afterCue(k, 2, 'Use the eleven thirty transit scan')) {
    const selected = scanAt(freshOrder.scans, freshOrder.snapshot);
    const showAge = afterCue(k, 2, "it's an hour and a half old");
    const event = selected.name + ' ' + clock(selected.event);
    tag(g, showAge ? event + '  ·  Scan age ' + selected.age + ' h' : event, 45, 428);
  }
}

export function synthesis(g, k) {
  const i = b(k);
  ground(g);
  if (i < 2 || (i === 2 && !afterCue(k, 2, 'four matching journeys'))) {
    scanReplay(g, k);
    return;
  }
  const eta = estimate(freshOrder.pickup, freshOrder.durations);
  head(
    g,
    'ONE O’CLOCK REPLAY   /   UTC',
    i < 4 ? 'From four journeys to the door' : 'What changes with the policy?',
  );
  if (i < 4) {
    txt(g, 'Pickup ' + clock(freshOrder.pickup), 48, 153, 22, C.muted);
    freshOrder.durations.forEach((h, j) => {
      const x = 54 + j * 227;
      box(g, x + 14, 208, 92);
      txt(g, h + ' h', x + 66, 331, 31, j === 1 || j === 2 ? C.teal : C.ink, 'center', 'Mono');
    });
    line(g, 347, 348, 575, 348, C.teal, 3);
    if (afterCue(k, 3, 'average eleven hours')) {
      const [, lowerMiddle, upperMiddle] = freshOrder.durations;
      txt(
        g,
        '(' + lowerMiddle + ' h + ' + upperMiddle + ' h) / 2 = ' + eta.median + ' h',
        460,
        374,
        22,
        C.teal,
        'center',
        'Mono',
      );
      const showEta = afterCue(k, 3, 'puts the arrival at eight tonight');
      const equation = clock(freshOrder.pickup) + ' + ' + eta.median + ' h';
      txt(g, equation + (showEta ? ' = ' + eta.arrival : ''), 47, 412, 37, C.teal, 'left', 'Serif');
    }
    if (afterCue(k, 3, 'one tomorrow morning')) {
      txt(
        g,
        'Four-trip comparison   ' + eta.first + ' to ' + eta.last + ' next day',
        916,
        153,
        20,
        C.muted,
        'right',
      );
    }
  } else {
    const original = 0.4;
    const revised = 0.6;
    const move = ease(cue(k, 5, 'Would the ETA change', 0.85));
    const age = scanAt(freshOrder.scans, freshOrder.snapshot).age;
    const showOriginal = afterCue(k, 5, 'Propose a customer warning');
    const showRevision = afterCue(k, 6, 'switches to normal tracking');
    house(g, 177, 307, 1.2);
    txt(g, 'Arrival estimate', 177, 350, 19, C.muted, 'center');
    txt(g, eta.arrival, 177, 401, 44, C.blue, 'center', 'Mono');
    line(g, 323, 148, 323, 451, C.line);
    txt(g, 'Scan ' + age + ' h  /  Backlog ' + freshOrder.backlogAge + ' h', 374, 169, 18, C.muted);
    txt(g, 'Warn at or above the cutoff', 374, 216, 26, C.ink, 'left', 'Serif');
    const x = (v) => 378 + v * 506,
      y = 290;
    const edge = x(lerp(original, revised, move));
    bar(g, x(0), y, x(1) - x(0), C.line, 3);
    bar(g, edge, y, x(1) - edge, C.pale, 12);
    line(g, edge, y - 13, edge, y + 15, C.ink, 2);
    if (move === 0 || move === 1)
      txt(g, pct(move === 0 ? original : revised), edge, y + 36, 18, C.ink, 'center', 'Mono');
    dot(g, x(freshOrder.risk), y, 8, C.blue);
    txt(g, 'Risk ' + pct(freshOrder.risk), x(freshOrder.risk), y - 26, 21, C.blue, 'center');

    for (const [label, cutoff, left, visible] of [
      ['Policy A', original, 374, showOriginal],
      ['Policy B', revised, 649, showRevision],
    ]) {
      if (cutoff === revised && move < 1) continue;
      const action = visible
        ? propose(age, freshOrder.backlogAge, freshOrder.risk, cutoff).action
        : 'Proposed action?';
      line(g, left, 364, left + 235, 364, C.line, 2);
      txt(g, label + '  ·  ' + pct(cutoff), left, 389, 18, C.muted, 'left', 'Mono');
      txt(g, action, left, 426, 27, visible ? C.teal : C.ink, 'left', 'Serif');
    }
  }
}
