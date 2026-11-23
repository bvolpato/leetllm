import {
  arm,
  byId,
  clickRow,
  event,
  events,
  exposure,
  join,
  rankingResponse,
  responses,
} from './experiment.mjs';
import {
  blue,
  box,
  caption,
  cue,
  dotMark,
  f,
  gold,
  head,
  ink,
  lineColor,
  machine,
  mono,
  muted,
  pale,
  red,
  ruled,
  slot,
  stamp,
  strip,
  stroke,
  sub,
  teal,
  type,
} from './studio.mjs';

export function displays(c, k) {
  const equal = cue(k, 2, 'Keep just the first row');
  head(c, 'Who collected the clicks?');
  sub(c, 'One dot per display. A gold center records a click.', 48, 105);
  exposure.forEach((r, i) => {
    const x = 70 + i * 310;
    machine(c, byId[r.id], x + 84, 184, 0.64);
    mono(c, r.id, x + 144, 172, 20);
    const ev = equal ? r.events.filter((e) => e.cohort === 0) : r.events;
    ev.forEach((e, j) => {
      const xx = x + e.column * 17,
        yy = 245 + e.cohort * 15;
      dotMark(c, xx, yy, 5.2, e.clicked ? '#8d6618' : '#b8c4ba');
      if (e.clicked) dotMark(c, xx, yy, 3.6, gold);
    });
    if (k.beat.beatIndex > 0) {
      const clicks = ev.filter((e) => e.clicked).length;
      mono(c, clicks + ' / ' + ev.length, x, 435, 26);
      sub(c, 'clicks / displays', x, 468);
    }
  });
}
export function examination(c, k) {
  const b = k.beat.beatIndex,
    showPos = cue(k, 2, 'Position one'),
    count = 10 * Math.floor(10 * cue(k, 2, 'Follow the expected clicks', 3.2));
  const inverse = cue(k, 3, 'Apply those weights'),
    cap2 = cue(k, 5, 'so its weighted expectation'),
    cap1 = cue(k, 6, "We're back at the raw"),
    cap = cap1 ? 1 : cap2 ? 2 : inverse ? null : 1;
  head(c, 'Attention changes the click count');
  sub(c, 'Same relevance probability  0.50     /     100 impressions at each position', 45, 103);
  const xs = [50, 510];
  for (let i = 0; i < 2; i++) {
    const x = xs[i],
      id = i ? 'P6' : 'P5',
      e = i ? 0.2 : 0.8,
      r = clickRow(e, cap, count);
    machine(c, byId[id], x + 74, 217, 0.83);
    mono(c, 'Position ' + (i ? 3 : 1), x + 153, 173, 21);
    mono(c, id + '   relevance 0.50', x + 153, 211, 16, muted);
    if (showPos) {
      sub(c, 'P(look)   ' + f(e), x, 281);
      sub(c, 'Expected clicks', x + 191, 281);
      const xx = x + 192;
      for (let j = 0; j < 40; j++)
        dotMark(
          c,
          xx + (j % 10) * 15,
          311 + Math.floor(j / 10) * 13,
          4.6,
          j < r.clicks ? '#bb7720' : '#d4d8cd',
        );
      mono(c, 'Looks   ' + r.looks, x, 320, 18);
      mono(c, r.clicks + ' clicks in ' + count, xx, 378, 18);
      if (inverse) {
        mono(c, 'Weight  × ' + f(r.weight), x, 411, 20, teal);
        mono(c, f(r.clicks * r.weight, 0) + ' weighted / 100 = ' + f(r.weighted), x, 450, 19, teal);
      } else if (count === 100) mono(c, 'P(click)   ' + f(r.raw), x, 418, 21, teal);
    } else {
      slot(c, x, 280, 390, 87);
      sub(c, 'Who looks? Who clicks?', x + 29, 323);
    }
  }
  stroke(c, 474, 140, 474, 462, lineColor, 1);
  if (b === 3) sub(c, 'Try a cap of 2. Which weight will it change?', 46, 489);
}
export function support(c, k) {
  const b = k.beat.beatIndex,
    swap = cue(k, 3, 'their positions swap');
  head(
    c,
    b < 2
      ? 'Can product Z appear?'
      : b < 4
        ? 'The same printers change places'
        : 'What relative examination can tell us',
  );
  if (b < 2) {
    sub(c, 'Shopper assignment', 48, 135);
    sub(c, 'Selection under that ranker', 348, 135);
    sub(c, 'Product Z', 739, 135);
    for (let i = 0; i < 2; i++) {
      const y = 221 + i * 96;
      mono(c, i ? 'Treatment  0.50' : 'Control    0.50', 47, y, 20);
      stroke(c, 267, y, 331, y, lineColor, 3);
      for (let j = 0; j < 2; j++) {
        machine(c, byId[(i ? ['P5', 'P6'] : ['P6', 'P5'])[j]], 378 + j * 96, y + 3, 0.47);
      }
      stroke(c, 544, y, 682, y, lineColor, 3);
      mono(c, 'P(show) = 0', 715, y, 20, red);
    }
    caption(
      c,
      b
        ? 'Independent judgments or approved exploration can supply evidence.'
        : 'Zero support   /   No click on Z to reweight.',
    );
  } else if (b < 4) {
    const left = ['P5', 'P6'],
      right = swap ? left.toReversed() : left;
    for (let i = 0; i < 2; i++) {
      const x = 117 + 450 * i;
      sub(c, 'Ranker ' + (i ? 'B' : 'A'), x, 143);
      (i ? right : left).forEach((id, j) => {
        const y = 233 + 112 * j;
        mono(c, '#' + (j + 1), x, y, 22);
        machine(c, byId[id], x + 111, y + 5, 0.73);
        mono(c, id, x + 191, y, 21);
      });
    }
    caption(c, 'Compare the same item at overlapping positions under comparable assignment.');
  } else {
    const abs = b === 4;
    sub(
      c,
      abs
        ? 'Two examination scales fit the same ratio'
        : 'Preserve the balance of data loss and penalty',
      49,
      141,
    );
    if (abs) {
      for (const [j, vals] of [
        [0.8, 0.2],
        [0.4, 0.1],
      ].entries()) {
        const y = 215 + j * 87;
        mono(c, 'Scale ' + (j + 1), 48, y);
        vals.forEach((v, i) => {
          const x = 196 + 244 * i;
          box(c, x, y - 8, v * 170, 16, i ? blue : teal, 3);
          mono(c, f(v), x + 145, y, 17);
        });
        mono(c, '4 : 1', 741, y, 25, teal);
      }
      caption(c, 'A ratio alone leaves absolute relevance unidentified.');
    } else {
      mono(c, 'L(w) + λR(w)', 55, 209, 30);
      mono(c, 'aL(w) + aλR(w)      a > 0', 55, 280, 28, teal);
      strip(c, 49, 333, 817, 109);
      sub(c, 'Printer log   /   Examination estimate missing', 74, 376);
      mono(c, 'propensity = null       permitted use = evaluation', 74, 415, 19);
    }
  }
}
export function filing(c, k) {
  const reply = rankingResponse(12),
    rows = [byId.P4, byId.P5, byId.P6];
  head(c, 'File the printer response');
  sub(c, 'One preference   /   12 updates', 48, 111);
  printerRows();
  function printerRows() {
    rows.forEach((p, i) => {
      const x = 164 + i * 302,
        y = 231;
      machine(c, p, x, y, 0.94);
      const score = reply.slate.find((r) => r.id === p.id).score;
      mono(c, p.id + '    ' + f(score, 3), x, 305, 21, ink, 'center');
    });
  }
  const show = [cue(k, 2, 'That is P five'), cue(k, 2, 'ahead of P four'), cue(k, 2, 'in third')];
  reply.slate.forEach((r, i) => {
    const x = 47 + i * 303;
    slot(c, x, 360, 257, 59);
    mono(c, '#' + (i + 1), x + 15, 390, 18, muted);
    if (show[i]) mono(c, r.id, x + 126, 390, 25, teal, 'center');
  });
  if (cue(k, 2, 'Save the request'))
    mono(
      c,
      [reply.request, reply.model, reply.policy, 'arm ' + reply.assignment].join('    /    '),
      48,
      466,
      18,
    );
}
export function lineage(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Server response history');
  if (b < 2 || b === 4) {
    for (const [i, r] of responses.slice(0, 2).entries()) {
      const x = 47 + i * 441;
      strip(c, x, 135, 415, 272);
      mono(c, r.id, x + 23, 174, 24);
      sub(
        c,
        arm(r.shopper) + '   /   ' + r.shopper + '   /   12:00:0' + r.served + ' UTC',
        x + 23,
        213,
      );
      r.rows.forEach((p, j) => {
        const y = 267 + j * 44;
        mono(c, j + 1, x + 26, y, 16, muted);
        machine(c, p, x + 98, y, 0.29);
        mono(c, p.id, x + 154, y, 21);
      });
    }
    if (b === 1) {
      mono(
        c,
        'catalog-2026-05-01   /   market-eligibility-v1   /   retrieval-v1',
        48,
        437,
        16,
        muted,
      );
      mono(
        c,
        'ranking-ab-2026-05   /   market-ranker-v0 (control), v1 (treatment)',
        48,
        469,
        16,
        muted,
      );
    }
    if (b === 4)
      sub(
        c,
        'Replay with the historical catalog. Recheck current eligibility for a new response.',
        49,
        456,
      );
  } else {
    const chain = ['Returned', 'Rendered', 'Visible', 'Examined'];
    const at = cue(k, 3, 'Whether the shopper')
      ? 3
      : cue(k, 3, 'A visibility event')
        ? 2
        : cue(k, 3, 'A client render')
          ? 1
          : 0;
    for (let i = 0; i < 4; i++) {
      const x = 47 + i * 226;
      sub(c, chain[i], x, 173, i === at ? teal : muted);
      if (i === 0) {
        strip(c, x, 226, 178, 85);
        mono(c, '501 / P5 / 1', x + 13, 271, 17);
      } else {
        slot(c, x, 226, 178, 85);
        mono(c, i === 3 ? 'Unobserved' : 'No receipt', x + 89, 269, 16, muted, 'center');
      }
      if (i < 3) stroke(c, x + 182, 267, x + 220, 267, lineColor);
    }
    caption(
      c,
      b === 2
        ? 'Server evidence ends at the returned row.'
        : 'Persist the whole response atomically. Append corrections to its history.',
    );
  }
}
export function outcome(c, k) {
  const b = k.beat.beatIndex;
  head(c, 'Join the event to a returned position');
  const r = responses[1];
  strip(c, 45, 130, 269, 307);
  mono(c, r.id, 68, 170, 24);
  sub(c, 'Returned 12:00:05 UTC', 68, 207);
  r.rows.forEach((p, i) => {
    const y = 270 + i * 55;
    mono(c, String(i + 1), 70, y, 18, muted);
    machine(c, p, 131, y, 0.34);
    mono(c, p.id, 192, y, 21);
  });
  if (b === 5) {
    sub(c, 'Retained outcomes for REQ-501', 355, 155);
    r.rows.forEach((p, i) => {
      const y = 222 + i * 63,
        found = events.filter((e) => e.product === p.id && e.request === r.id);
      mono(c, p.id, 355, y, 20);
      type(c, found.length ? found.map((e) => e.kind).join(' + ') : 'No joined event', 448, y, 21, {
        color: found.length ? teal : muted,
      });
    });
    sub(c, 'Client visibility unknown. Follow-up window still matters.', 355, 429);
    return;
  }
  const replay = b === 2 || b === 3,
    late = b >= 4,
    conflict = cue(k, 3, 'change just the product');
  const e = late
    ? event('EVT-902', r.id, 'P6', 3)
    : conflict
      ? { ...events[0], product: 'P9' }
      : events[0];
  const show = late || replay || cue(k, 1, 'a click names'),
    purchase = !replay && !late && cue(k, 1, 'A purchase follows');
  sub(c, 'Incoming event    /    UTC', 355, 150);
  const time = (e) =>
    '12:' +
    String(Math.floor(e.time / 60)).padStart(2, '0') +
    ':' +
    String(e.time % 60).padStart(2, '0');
  if (show) {
    mono(c, e.id + '   ' + time(e) + '   ' + e.product + '   ' + e.kind, 355, 209, 19);
    mono(c, 'Request   ' + e.request, 355, 248, 17, muted);
  }
  if (purchase) mono(c, events[1].id + '   ' + time(events[1]) + '   P5   purchase', 355, 303, 19);
  if (replay) {
    sub(c, 'Previously stored', 355, 284);
    mono(c, 'EVT-900   12:00:08   P5   click', 355, 319, 19);
  }
  let verdict = late
    ? cue(k, 5, 'before serving')
    : conflict
      ? b >= 3
      : replay
        ? cue(k, 3, 'Count it once')
        : b >= 1;
  if (verdict) {
    stamp(c, join(e, replay ? [events[0]] : []), 355, 382, late || conflict ? red : teal);
  }
  if (conflict && !late && b >= 3) sub(c, join(e) + ' even with a fresh event ID.', 355, 429, red);
}
export function assignment(c, k) {
  const b = k.beat.beatIndex;
  head(c, b === 3 ? 'Roll back a served version' : 'Assign the shopper once');
  if (b < 3) {
    for (const [i, r] of responses.slice(0, 2).entries()) {
      const x = 51,
        y = 195 + i * 133,
        armName = arm(r.shopper);
      dotMark(c, x + 41, y - 18, 16, i ? teal : blue);
      box(c, x + 17, y + 2, 48, 25, i ? teal : blue, 10);
      mono(c, r.shopper, x + 86, y, 21);
      stroke(c, x + 209, y, x + 260, y, lineColor);
      mono(c, 'bucket ' + (armName === 'control' ? 1 : 0), x + 282, y, 18);
      stamp(c, armName, x + 447, y, i ? teal : blue);
      if (b > 0)
        for (let j = 0; j < 3; j++) {
          const xx = 679 + j * 77;
          box(c, xx, y - 16, 63, 33, pale, 5);
          mono(c, 'Q' + (j + 1), xx + 31, y, 17, ink, 'center');
        }
    }
    caption(
      c,
      b === 0
        ? 'SHA-256 of experiment ID and shopper ID → bucket modulo 2'
        : b === 1
          ? '6 searches   /   2 independent assignment units'
          : 'Compare shopper counts with the planned split and audit missing logs.',
    );
  } else {
    const stopped = cue(k, 4, 'one prohibited display'),
      rollback = cue(k, 4, 'load the previous ranker'),
      check = cue(k, 4, 'then verify');
    sub(c, 'Marketplace search', 48, 136);
    ruled(
      c,
      50,
      202,
      491,
      [
        ['Blocked displays', stopped ? '1' : '0'],
        ['Ranker', rollback ? 'market-ranker-v0' : 'market-ranker-v1'],
        ['Feature set', rollback ? 'Compatible with v0' : 'Compatible with v1'],
      ],
      64,
    );
    if (stopped) stamp(c, 'Safety stop', 632, 204, red);
    if (check) {
      stamp(c, 'Check served version', 630, 286);
      stamp(c, 'Recheck eligibility', 630, 345);
    }
  }
}
