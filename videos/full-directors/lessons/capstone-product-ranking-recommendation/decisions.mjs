import {
  byId,
  control,
  dcg,
  eligible,
  event,
  events,
  join,
  lamps,
  latencies,
  measure,
  percentile,
  proposed,
  requests,
  REQUIRED_GATES,
  responses,
  returned,
  returnsRule,
} from './experiment.mjs';
import { light } from './lamp-art.mjs';
import {
  blue,
  box,
  caption,
  cells,
  cue,
  dotMark,
  ease,
  f,
  gold,
  head,
  ink,
  lineColor,
  machine,
  mix,
  mono,
  muted,
  oval,
  red,
  slot,
  stamp,
  strip,
  stroke,
  sub,
  teal,
  type,
} from './studio.mjs';

export function purchaseValue(c, k) {
  const b = k.beat.beatIndex;
  const price = 80,
    click = 0.2,
    conditional = 0.25,
    n = 100,
    clicks = n * click,
    sales = clicks * conditional;
  head(c, b < 3 ? 'One path to a purchase' : 'Check the probability against outcomes');
  if (b < 3) {
    machine(c, byId.P5, 168, 269, 1.36);
    mono(c, '$' + price, 168, 373, 34, ink, 'center');
    if (b < 2) {
      const names = ['Impression', 'Click', 'Purchase'];
      names.forEach((name, i) => {
        const x = 341 + i * 191;
        dotMark(c, x + 51, 256, 17, i === 2 ? teal : blue);
        if (i < 2) stroke(c, x + 71, 256, x + 220, 256, lineColor, 2);
        type(c, name, x + 51, 309, 20, { align: 'center' });
      });
      sub(c, 'At most one attributed purchase through this click, at a fixed price.', 319, 387);
      if (b === 1) mono(c, 'P(click) × P(purchase | click) × price', 317, 436, 18, teal);
    } else {
      const stage = cue(k, 3, 'on average')
        ? 4
        : cue(k, 3, 'four hundred dollars')
          ? 3
          : cue(k, 3, "that's five printers")
            ? 2
            : cue(k, 3, 'expect twenty clicks')
              ? 1
              : 0;
      cells(c, {
        x: 347,
        y: 181,
        n,
        step: 18,
        r: 6,
        fill: (i) => (stage >= 2 && i < sales ? teal : stage >= 1 && i < clicks ? gold : '#bfcbc0'),
      });
      const notes = [
        n + ' impressions',
        clicks + ' expected clicks',
        sales + ' expected purchases',
        '$' + sales * price + ' gross sales',
        '$' + f((sales * price) / n) + ' per impression',
      ];
      for (let i = 0; i <= stage; i++)
        type(c, notes[i], 572, 172 + 51 * i, 21, {
          color: i === stage ? teal : ink,
          weight: i === stage ? 600 : 400,
        });
    }
  } else {
    const preds = 10,
      prob = 0.8,
      outcomes = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      observed = outcomes.reduce((a, b) => a + b) / preds;
    sub(c, 'Held-out bin   /   Ten predictions of 0.8', 49, 140);
    outcomes.forEach((v, i) => {
      const x = 82 + i * 83;
      dotMark(c, x, 218, 24, v ? teal : '#bec9be');
      mono(c, String(i + 1), x, 274, 15, muted, 'center');
    });
    mono(c, 'Expected   ' + prob * preds + ' / 10', 49, 349, 23);
    if (cue(k, 4, 'A reliability diagram'))
      mono(
        c,
        'Observed   ' + observed * preds + ' / 10     Gap   ' + f(Math.abs(prob - observed)),
        49,
        407,
        23,
        teal,
      );
    if (b === 4) sub(c, 'ECE weights each absolute bin gap by its share of the sample.', 49, 467);
  }
}
export function returns(c, k) {
  const b = k.beat.beatIndex,
    zero = cue(k, 4, 'with zero purchases in control'),
    purchases = [zero ? 0 : 4, 6],
    state = returnsRule(...purchases);
  head(c, b === 4 ? 'Two latency boundaries' : 'Which purchases came back?');
  if (b === 4) {
    [
      ['Synthetic scoring limit', 20],
      ['Full-search stop', 120],
    ].forEach(([name, ms], i) => {
      const y = 200 + 148 * i;
      sub(c, name, 47, y);
      box(c, 284, y - 9, ms * 4.3, 19, i ? teal : blue, 4);
      mono(c, ms + ' ms', 292 + ms * 4.3, y, 19);
    });
    caption(c, 'Time the full request to check the 120 ms stop.');
    return;
  }
  ['Control', 'Treatment'].forEach((name, i) => {
    const x = 50 + i * 463;
    sub(c, name, x, 134);
    if (b === 0) {
      cells(c, {
        x: x + 13,
        y: 185,
        n: 100,
        step: 19,
        r: 6,
        fill: (j) => (j < purchases[i] ? (i ? teal : blue) : '#c6cfc2'),
      });
      mono(c, purchases[i] + ' / 100 searches', x, 421, 23);
      type(c, purchases[i] + '% conversion', x, 457, 18, { color: teal });
    } else {
      mono(c, purchases[i] + ' purchases', x, 198, 24);
      if (zero)
        sub(c, purchases[i] + ' of 100 searches converted (' + purchases[i] + '%).', x, 229);
      for (let j = 0; j < purchases[i]; j++) {
        const xx = x + 21 + j * 54;
        box(c, xx - 16, 260, 35, 41, i === 1 && j === 0 ? '#bd6b52' : '#82a399', 4);
        box(c, xx - 3, 260, 8, 14, '#ede1b8');
      }
      mono(c, (i ? 1 : 0) + ' returned', x, 336, 20, i ? red : muted);
      if (b >= 2) {
        const rate = state.rates[i];
        mono(
          c,
          (i ? 1 : 0) +
            ' / ' +
            purchases[i] +
            '   ' +
            (rate === null ? 'undefined' : f(rate * 100, 1) + '%'),
          x,
          389,
          25,
        );
      }
    }
  });
  if (b === 1)
    sub(c, 'Stop if treatment exceeds control by more than 1 percentage point.', 49, 455);
  if (b >= 2 && cue(k, 3, 'For a real trial') && (!zero || cue(k, 4, 'Hold the return comparison')))
    stamp(c, state.verdict, 49, 454, zero ? muted : red);
}
export function receipt(c, k) {
  const b = k.beat.beatIndex;
  head(c, b < 3 ? 'What does the local receipt prove?' : 'Before exposing traffic');
  if (b === 0) {
    const removed = cue(k, 1, 'Remove one event') && !cue(k, 1, 'Put it back'),
      actual = removed ? events.slice(0, 1) : events;
    sub(c, 'Retained response rows', 48, 143);
    responses.slice(0, 2).forEach((r, i) => {
      mono(c, r.id + '    ' + r.rows.length + ' rows', 48, 200 + i * 63, 21);
    });
    sub(c, 'Required event IDs', 483, 143);
    events.forEach((e, i) => {
      const y = 198 + i * 65;
      slot(c, 480, y - 24, 325, 49);
      mono(c, e.id, 494, y, 20);
      type(c, actual.some((row) => row.id === e.id) ? 'Retained' : 'Missing', 646, y, 20, {
        color: actual.some((row) => row.id === e.id) ? teal : red,
      });
    });
    const good =
      actual.length === events.length && events.every((e) => actual.some((row) => row.id === e.id));
    stamp(
      c,
      good ? REQUIRED_GATES.length + ' checks passed' : 'Retention check failed',
      48,
      366,
      good ? teal : red,
    );
    mono(c, 'Live trial   OFF', 48, 432, 22, muted);
  } else if (b < 3) {
    const avg = (measure(control).ndcg + dcg([3, 1, 2]) / dcg([3, 2, 1])) / 2;
    const rows = [
      [
        'Synthetic scoring times',
        latencies.length + ' samples',
        'p95  ' + percentile(latencies, 0.95) + ' ms',
      ],
      ['Authored rankings', '2 judged searches', f(avg, 3) + ' → 1.000'],
      ['Dated fit', '3 train / 2 validation', '2 test requests'],
    ];
    if (b === 2)
      rows.push(
        ['Outcomes worksheet', '100 searches per arm', '1 treatment return'],
        ['Response join', '6 returned rows', '2 events'],
      );
    rows.forEach(([a, v, d], i) => {
      const y = 165 + i * 64;
      stroke(c, 45, y + 28, 902, y + 28, lineColor, 1);
      type(c, a, 48, y, 20);
      mono(c, v, 355, y, 17);
      mono(c, d, 662, y, 17, teal);
    });
  } else if (b === 3) {
    const snapshot = cue(k, 4, 'Save one full candidate'),
      client = cue(k, 4, 'Collect a client receipt');
    strip(c, 48, 140, 404, 278);
    sub(c, 'Request snapshot to preserve', 70, 178);
    if (snapshot)
      eligible.forEach((p, i) => {
        const y = 237 + i * 59;
        machine(c, p, 108, y, 0.37);
        mono(c, p.id + '    match ' + f(p.match), 157, y, 18);
      });
    else {
      type(c, 'Independent grades', 72, 251, 24);
      type(c, 'Frozen holdouts', 72, 312, 24);
    }
    sub(c, 'Separate evidence to collect', 500, 180);
    slot(c, 498, 221, 408, 62);
    mono(c, 'Client render receipt', 520, 253, 18);
    if (client) {
      slot(c, 498, 319, 408, 62);
      mono(c, 'Mature, deduplicated outcomes', 517, 349, 17);
    }
  } else {
    const switchBack = cue(k, 5, 'Rehearse the rollback'),
      verified = cue(k, 5, 'then check the version');
    sub(c, 'Rollback rehearsal', 46, 140);
    strip(c, 46, 178, 419, 192);
    mono(c, switchBack ? 'market-ranker-v0' : 'market-ranker-v1', 70, 235, 23);
    type(c, switchBack ? 'Compatible v0 features' : 'Compatible v1 features', 70, 294, 21);
    sub(c, 'Inspect a returned list', 498, 140);
    const rows = switchBack ? control : eligible;
    rows.forEach((p, i) => {
      const x = 553 + i * 145;
      machine(c, p, x, 272, 0.66);
      mono(c, p.id, x, 335, 18, ink, 'center');
    });
    if (verified) stamp(c, 'Verify served version and current eligibility', 48, 432);
    else sub(c, 'Measure the serving path and plan the number of assigned shoppers.', 49, 432);
  }
}
const ordered = [...lamps].sort((a, b) => b.score - a.score);
const lampBy = (id) => lamps.find((l) => l.id === id);
function lampAt(c, l, x, y, scale = 0.36) {
  oval(c, x, y + 3, 105 * scale, 11 * scale, 'rgba(52,34,42,.16)');
  light(c, x, y, scale, 1, l);
}
export function lampPractice(c, k) {
  const b = k.beat.beatIndex,
    inkLamp = '#49313c';
  box(c, 0, 0, 960, 540, '#f2dcc9');
  if (!cue(k, 3, 'Start with the two highest scores')) {
    head(c, 'Portable lamps', 44, 59);
    mono(c, 'score = −0.1 × match + 1.2 × quality', 47, 114, 20, inkLamp);
    const xs = [143, 366, 589, 812];
    const fold = lampBy('J5');
    ordered.forEach((l, i) => {
      const x = xs[i];
      lampAt(c, l, x, 295, 0.39);
      mono(c, l.id + '   seller ' + l.seller, x, 328, 16, inkLamp, 'center');
      mono(c, f(l.match) + '   ' + f(l.quality), x, 373, 20, inkLamp, 'center');
      if (cue(k, 3, 'We need three places') || (l === fold && cue(k, 1, 'Keep that number')))
        mono(c, 'Score ' + f(l.score), x, 422, 21, teal, 'center');
    });
    sub(c, 'Each pair lists text match, then quality.', 47, 474);
    return;
  }
  const sold = cue(k, 4, 'the mushroom sells out'),
    slide = ease(cue(k, 5, 'Slide the folded shade', 1.45));
  const joined = cue(k, 7, 'File E thirty'),
    reject = cue(k, 7, 'Reject its click');
  const saved = cue(k, 5, 'Save this order'),
    third = cue(k, 4, 'Take the blue lantern', 0.75);
  head(
    c,
    saved ? 'Returned lamps  /  L17' : sold ? 'Recheck current stock' : 'Proposed shelf',
    42,
    58,
  );
  sub(c, 'Three positions   /   Up to two per seller', 45, 102);
  const loc = [140, 369, 598],
    reserve = 836;
  box(c, 730, 128, 190, 216, '#c2a29e', 62);
  box(c, 727, 321, 198, 15, '#c59891', 3);
  box(c, 37, 323, 671, 12, '#c19b86', 2);
  for (let i = 0; i < 3; i++) mono(c, '#' + (i + 1), loc[i], 359, 18, muted, 'center');
  sub(c, third ? 'Reserve' : 'Candidates', 782, 152, '#442c39');
  const annotate = (l, x, y) => {
    mono(c, l.id + '   ' + f(l.score), x, y, 18, inkLamp, 'center');
    type(c, 'Seller ' + l.seller, x, y + 23, 16, { align: 'center', color: muted });
  };
  // The saved order and the earlier proposal share two physical places. Only the middle changes.
  const globe = proposed[0],
    mush = proposed[1],
    lantern = proposed[2],
    shade = returned[1];
  lampAt(c, globe, loc[0], 320, 0.43);
  annotate(globe, loc[0], 398);
  if (!sold) {
    lampAt(c, mush, loc[1], 320, 0.43);
    annotate(mush, loc[1], 398);
  } else if (slide === 0) {
    type(c, 'J3 sold out   /   ' + f(mush.score), loc[1], 129, 16, { align: 'center', color: red });
  }
  if (third < 1) {
    slot(c, loc[2] - 74, 232, 148, 85);
  }
  const take = ease(third),
    lanternX = mix(775, loc[2], take);
  lampAt(c, lantern, lanternX, 320 - Math.sin(Math.PI * take) * 48, mix(0.24, 0.41, take));
  const shelfX = mix(875, reserve, take),
    x = mix(shelfX, loc[1], slide),
    y = 320 - Math.sin(Math.PI * slide) * 166;
  lampAt(c, shade, x, y, mix(0.24, 0.4, take));
  if (third === 0) {
    mono(c, 'J5 / A', 875, 371, 15, inkLamp, 'center');
    mono(c, f(shade.score), 875, 398, 18, inkLamp, 'center');
    mono(c, 'J1 / B', 775, 371, 15, inkLamp, 'center');
    mono(c, f(lantern.score), 775, 398, 18, inkLamp, 'center');
  } else if (third === 1) {
    annotate(lantern, loc[2], 398);
    if (slide === 0 || slide === 1) annotate(shade, x, 398);
    else mono(c, 'J5  ' + f(shade.score), reserve, 398, 18, inkLamp, 'center');
  }
  if (b === 2) sub(c, 'Which seller can still fill position 3?', 47, 471);
  if (b === 3 && sold)
    sub(c, 'The second position is open. Which lamp fits the current catalog?', 47, 471);
  if (b >= 5) {
    sub(c, 'Earlier proposal    ' + proposed.map((l) => l.id).join('  /  '), 46, 440);
    const e31 = event('E31', 'L17', 'J3', 60),
      e32 = event('E32', 'L17', 'J5', 120);
    const label = (e, dec) =>
      e.id + '   ' + e.product + '   ' + (dec ? join(e) : '12:0' + e.time / 60 + ' UTC');
    mono(c, label(e31, reject), 47, 478, 16, reject ? red : inkLamp);
    mono(c, label(e32, joined), 508, 478, 16, joined ? teal : inkLamp);
  }
}
