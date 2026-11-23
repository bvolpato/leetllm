import {
  C,
  after,
  at,
  blend,
  box,
  bracket,
  dot,
  foot,
  headline,
  mono,
  panel,
  path,
  txt,
} from './bench.mjs';
import {
  alternative,
  chunks,
  cohort,
  comparisonTokenTimes,
  fixedPlayback,
  screenAt,
  servingRequestMetrics,
  tokenTimes,
  words,
} from './samples.mjs';

const tokenX = (t) => 172 + t * 3.06;
const r = cohort[0],
  metrics = servingRequestMetrics(r);
function tape(c, time) {
  box(c, 90, 339, 1740, 295, C.pale, 10);
  for (let i = 0; i < 54; i++) {
    box(c, 110 + i * 32, 355, 14, 9, C.rule, 2);
    box(c, 110 + i * 32, 608, 14, 9, C.rule, 2);
  }
  const y = 488;
  path(
    c,
    [
      [tokenX(0), y],
      [tokenX(520), y],
    ],
    C.rule,
    3,
  );
  path(
    c,
    [
      [tokenX(0), y],
      [tokenX(time), y],
    ],
    C.green,
    5,
  );
  mono(c, 'send', tokenX(0), y - 58, 28, C.dim, 'center');
  dot(c, tokenX(0), y, 11, C.ink);
  mono(c, 0, tokenX(0), y + 53, 29, C.ink, 'center');
  tokenTimes.forEach((t, i) => {
    if (t > time) return;
    dot(c, tokenX(t), y, 11, C.green);
    txt(c, words[i].trim(), tokenX(t), y - 56, 34, C.green, { align: 'center', bold: true });
    mono(c, t, tokenX(t), y + 50, 30, C.ink, 'center');
  });
  if (time >= r.terminal) {
    path(
      c,
      [
        [tokenX(time), y + 11],
        [tokenX(time) + 14, y + 63],
        [tokenX(time) + 35, y + 63],
      ],
      C.red,
      3,
    );
    mono(c, '500', tokenX(time) + 39, y + 66, 26, C.red);
    box(c, tokenX(time) - 6, y - 21, 12, 42, C.red);
  }
}
function oneToken(c) {
  const row = cohort[1],
    m = servingRequestMetrics(row);
  txt(c, 'R02  /  one-token response', 110, 280, 40, C.green, { bold: true });
  const x = (t) => 290 + (t - row.sent) * 6.8,
    y = 497;
  box(c, 93, 348, 1730, 284, C.pale, 10);
  path(
    c,
    [
      [x(row.sent), y],
      [x(row.terminal), y],
    ],
    C.green,
    5,
  );
  for (const [t, label, above] of [
    [row.sent, 'Sent', true],
    [row.tokens[0], 'Only token', true],
    [row.terminal, 'Terminal', false],
  ]) {
    dot(c, x(t), y, 12, above ? C.green : C.red);
    mono(c, label + '  ' + t + ' ms', x(t), y + (above ? -69 : 74), 29, C.ink, 'center');
  }
  bracket(c, x(row.sent), x(row.tokens[0]), 675, 'TTFT   ' + m.ttft + ' ms', C.green, 35);
  mono(c, '1 token    0 gaps    TPOT inapplicable', 960, 824, 41, C.ink, 'center');
}
function deadlinePlot(c, k) {
  const answer = k.beat.beatIndex === 4;
  const knownA = answer && at(k, 'The first stream has slack');
  const knownB = answer && at(k, 'forty milliseconds late');
  const [a, b] = [tokenTimes, comparisonTokenTimes].map((v) => fixedPlayback(v));
  const x = (t) => 415 + (t - 210) * 2.8;
  mono(c, 'CLIENT ARRIVALS', 107, 273, 26, C.dim);
  dot(c, 654, 275, 10, C.green);
  txt(c, 'Stream A', 681, 275, 32, C.ink);
  dot(c, 943, 275, 10, C.red);
  txt(c, 'Stream B', 970, 275, 32, C.ink);
  path(
    c,
    [
      [1238, 260],
      [1238, 287],
    ],
    C.brass,
    5,
  );
  txt(c, 'Reading deadline', 1262, 275, 32, C.ink);
  a.deadlines.forEach((d, i) => {
    const y = 365 + i * 92;
    const early = a.arrivals[i],
      late = b.arrivals[i];
    mono(c, 'Token ' + (i + 1), 113, y, 32, i === 3 ? C.ink : C.dim);
    path(
      c,
      [
        [x(216), y],
        [x(638), y],
      ],
      C.rule,
      2,
    );
    path(
      c,
      [
        [x(d), y - 32],
        [x(d), y + 33],
      ],
      C.brass,
      5,
    );
    path(
      c,
      [
        [x(early), y - 10],
        [x(d), y - 10],
      ],
      i === 3 ? C.green : C.rule,
      4,
    );
    path(
      c,
      [
        [x(d), y + 11],
        [x(late), y + 11],
      ],
      i === 3 ? C.red : C.rule,
      4,
    );
    dot(c, x(early), y - 10, 10, C.green);
    dot(c, x(late), y + 11, 10, C.red);
    mono(c, early, x(early) - 15, y - 24, 24, C.green, 'right');
    mono(c, late, x(late) + 16, y + 25, 24, C.red);
    mono(c, 'due ' + d, 1825, y, 27, C.dim, 'right');
  });
  const note = knownB
    ? 'B4   580 − 540 = 40 ms late'
    : knownA
      ? 'A4   540 − 440 = 100 ms early'
      : 'Look at token four in both streams.';
  mono(c, note, 960, 837, 39, knownB ? C.red : C.ink, 'center');
  foot(c, 'Fixed reader schedule   ·   first token due at 300 ms, then one every 80 ms');
}
export function stream(c, k) {
  const b = k.beat.beatIndex;
  headline(c, 3, b < 3 ? 'Where does each timer stop?' : 'Which reader runs out of text?');
  if (b >= 3) {
    deadlinePlot(c, k);
    return;
  }
  if (b === 1 && at(k, 'With a single token')) {
    oneToken(c);
    foot(c, 'R02 still has a first-token wait and a terminal latency.');
    return;
  }
  const first = tokenTimes[0],
    last = tokenTimes.at(-1);
  const now = Math.round(
    b === 0
      ? blend(0, first, at(k, 'Its first observed token', 0.9))
      : b === 1
        ? blend(first, last, at(k, 'Watch the spacing', 1.2))
        : blend(last, r.terminal, at(k, 'terminal event', 0.5)),
  );
  txt(c, 'R01  /  client token events', 107, 275, 38, C.green, { bold: true });
  mono(c, now + ' ms since send', 1815, 279, 32, C.dim, 'right');
  tape(c, now);
  if (b === 0) {
    bracket(
      c,
      tokenX(0),
      tokenX(now),
      690,
      now === first ? 'TTFT   ' + metrics.ttft + ' ms' : '',
      C.green,
      34,
    );
    if (now < first) txt(c, 'Waiting for first token', tokenX(0), 757, 33, C.green);
  } else if (b === 1) {
    tokenTimes.slice(1).forEach((t, i) => {
      if (now >= t)
        bracket(c, tokenX(tokenTimes[i]), tokenX(t), 673, String(t - tokenTimes[i]), C.green, 29);
    });
    const shown = at(k, 'sixty milliseconds');
    mono(
      c,
      shown
        ? '(480 − 240) / 4 gaps = ' + metrics.tpot + ' ms'
        : 'First to last token   /   number of gaps',
      960,
      810,
      38,
      C.ink,
      'center',
    );
  } else {
    bracket(
      c,
      tokenX(0),
      tokenX(now),
      700,
      now === r.terminal
        ? 'End to end   ' + r.terminal + ' ms'
        : now + ' ms   /   waiting for terminal',
      C.green,
      34,
    );
  }
  const footer =
    b === 0
      ? 'The first token stops the TTFT clock.'
      : b === 1 && at(k, 'With a single token')
        ? 'R02 has one token and zero gaps. TTFT is 170 ms. TPOT is inapplicable.'
        : b === 1
          ? 'Inter-token gaps are individual observations. TPOT is their mean for this request.'
          : now < r.terminal
            ? 'The end-to-end clock keeps running until the request terminates.'
            : 'Twenty milliseconds separate the last output token from terminal completion.';
  foot(c, footer);
}

const chunkX = (t) => 448 + t * 2.57;
const chunkEvents = chunks(tokenTimes);
function receiver(c, time, frozen, showFirstText, showGap) {
  panel(c, 116, 253, 1690, 228);
  box(c, 165, 279, 1588, 161, C.deep, 13);
  box(c, 180, 291, 1558, 136, '#d2e4c6', 7);
  txt(
    c,
    frozen ? 'Client reply   /   paused at first text' : 'Client reply',
    214,
    321,
    25,
    C.green,
    { bold: true },
  );
  const clockLabel = showFirstText
    ? chunkEvents[0].ms + ' ms to first text'
    : time + ' ms since send';
  mono(c, clockLabel, 1700, 321, 30, C.dim, 'right');
  const content = screenAt(time);
  mono(c, content || '▁', 214, 386, 54, C.ink);
  if (showGap) {
    const gap = chunkEvents[1].ms - chunkEvents[0].ms;
    mono(c, gap + ' ms between client chunks', 1700, 386, 34, C.ink, 'right');
  }
}
function histories(c, time, showTrace, alternateOn, shift, showAlternativeTime) {
  const x = chunkX,
    y = 552;
  const rows = [
    [showTrace ? 'Saved chunks' : 'Client chunks', y],
    ...(showTrace ? [['Recorded tokens', y + 122]] : []),
    ...(alternateOn ? [['Possible tokens', y + 244]] : []),
  ];
  for (const [name, yy] of rows) {
    txt(c, name, 114, yy, 31, C.pale);
    path(
      c,
      [
        [x(0), yy],
        [x(500), yy],
      ],
      C.ridge,
      2,
    );
  }
  for (const e of chunkEvents)
    if (showTrace || e.ms <= time) {
      const xx = x(e.ms);
      path(
        c,
        [
          [xx, y + 2],
          [xx, y - 29],
        ],
        C.amber,
        5,
      );
      mono(c, e.ms + ' ms', xx, y - 41, 27, C.amber, 'center');
      if (showTrace)
        path(
          c,
          [
            [xx, y + 9],
            [xx, alternateOn ? y + 260 : y + 136],
          ],
          C.ridge,
          2,
          [5, 10],
        );
    }
  if (showTrace) {
    for (const [j, times] of [tokenTimes, ...(alternateOn ? [alternative] : [])].entries()) {
      const yy = y + 122 * (j + 1);
      times.forEach((t, i) => {
        const moving = j === 1 && i === 0;
        const xx = x(moving ? blend(tokenTimes[0], t, shift) : t),
          color = i === 0 ? C.amber : C.mint;
        dot(c, xx, yy, 8, color);
        mono(c, words[i].trim(), xx, yy - 34, 27, color, 'center');
        if (i === 0 && (!moving || showAlternativeTime)) {
          mono(c, t + ' ms', xx, yy + 35, 27, color, 'center');
        }
      });
    }
  }
  if (time === 500 && !showTrace) {
    path(
      c,
      [
        [x(500), y + 8],
        [x(500), y + 78],
        [x(500) - 170, y + 78],
      ],
      C.peach,
      3,
    );
    mono(c, 'Terminal   500 ms   /   no text', x(500) - 181, y + 81, 30, C.peach, 'right');
  }
  if (!showTrace && time >= 480)
    bracket(c, x(320), x(480), 740, '160 ms between chunks', C.amber, 27);
}
export function chunksScene(c, k) {
  const b = k.beat.beatIndex;
  headline(c, 4, 'Could the client tell when “The” was ready?', 'dark');
  const time =
    b === 0
      ? at(k, 'A terminal metadata')
        ? 500
        : at(k, 'At four eighty')
          ? 480
          : at(k, 'At three twenty')
            ? 320
            : 0
      : 320;
  const alt = b === 3 && at(k, 'Move only');
  const shift = b === 3 ? at(k, 'Move only', 0.85) : 0;
  const showAlternativeTime = b === 3 && after(k, 'to one sixty') && shift === 1;
  const showFirstText = b === 3 && after(k, 'three hundred twenty milliseconds to first text');
  const showGap = b === 3 && after(k, 'a hundred sixty between chunks');
  receiver(c, time, b > 0, showFirstText, showGap);
  histories(c, time, b >= 1, alt, shift, showAlternativeTime);
  foot(
    c,
    b === 0
      ? 'One display update can deliver several tokens.'
      : b === 1
        ? 'The recorded first token precedes the first visible chunk.'
        : !showAlternativeTime
          ? 'Keep both chunks fixed. Could another first-token time fit the same display?'
          : 'Both token histories give the client the same two text deliveries.',
    true,
  );
}
