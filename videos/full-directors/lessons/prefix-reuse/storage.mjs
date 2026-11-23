import {
  base,
  bracket,
  circle,
  clamp,
  cream,
  cue,
  fade,
  foot,
  gold,
  green,
  header,
  ink,
  line,
  mint,
  mix,
  mono,
  muted,
  num,
  paper,
  peach,
  rect,
  red,
  rule,
  sheet,
  small,
  type,
} from './drawing.mjs';
import {
  eligibleMarked,
  guide,
  lookupRuns,
  longestLookup,
  minimum,
  pool,
  readPrivate,
  storedPrivate,
  windows,
} from './examples.mjs';

export function publication(c, k) {
  const replay = k.beat.beatIndex === 2;
  base(
    c,
    k,
    replay
      ? 'Which endpoint can the second request read?'
      : 'Is the guide ready when each lookup starts?',
    replay ? 'ENDPOINT-ONLY REPLAY' : 'PUBLICATION TIME',
  );
  if (replay) {
    const tryEnds = cue(k, 2, 'looks at its own end', 0.5);
    const miss = cue(k, 2, 'Neither endpoint was written', 0.4);
    const guideWrite = cue(k, 2, 'A completed guide write', 0.55);
    const written = guideWrite ? [6048, guide] : [6048],
      result = guideWrite ? lookupRuns.guideWritten : lookupRuns.wholeOnly;
    header(c, 'Distinct entry endings · schematic spacing', 105, 303);
    const xs = [445, 1025, 1562];
    [guide, 6037, 6048].forEach((end, i) => {
      const x = xs[i];
      line(
        c,
        [
          [x, 383],
          [x, 640],
        ],
        rule,
        3,
      );
      mono(c, num(end), x, 349, 42, ink, 'center');
      if (written.includes(end)) {
        sheet(c, x - 153, 410, 306, 78, mint);
        type(c, 'Written', x, 450, 41, green, { align: 'center', weight: 600 });
      } else {
        rect(c, x - 153, 410, 306, 78, '#e8e4d7', 6);
        type(c, 'No entry', x, 450, 41, muted, { align: 'center' });
      }
      if (i < 2 && tryEnds) {
        rect(c, x - 150, 593, 300, 75, result === end ? mint : peach, 5);
        type(
          c,
          result === end ? 'Read guide' : 'Candidate',
          x,
          630,
          37,
          result === end ? green : ink,
          { align: 'center' },
        );
      }
    });
    bracket(c, xs[0], xs[1], 724, 'R2 can test these two endpoints');
    foot(
      c,
      guideWrite
        ? num(result) + ' guide positions available to R2.'
        : miss
          ? 'A write through 6,048 did not publish a separate 6,000-token entry.'
          : 'The stable guide ends before either changing question.',
      guideWrite ? green : ink,
    );
    return;
  }
  const cold = cue(k, 1, 'Request two starts cold', 0.35);
  const ready = cue(k, 1, 'write completes', 0.6);
  const arrives = cue(k, 1, 'Request three arrives', 0.35);
  const read = cue(k, 1, 'reads the six thousand', 0.6);
  const labels = ['R1  •  write', 'R2  •  lookup', 'R3  •  lookup'];
  const left = 405,
    right = 1735,
    stop = 1138;
  header(c, 'Arrival and publication on one worker', 95, 300);
  labels.forEach((l, i) => {
    const y = 400 + i * 148;
    type(c, l, 98, y, 39, ink, { face: 'Serif' });
    line(
      c,
      [
        [left, y],
        [right, y],
      ],
      rule,
      2,
    );
  });
  rect(c, left, 368, stop - left, 63, '#e4e3d5', 4);
  const progress = ready ? 1 : 0.31 + 0.47 * cue(k, 0, 'Request one is still writing', 2);
  rect(c, left, 368, (stop - left) * progress, 63, gold, 4);
  type(c, ready ? 'Guide written' : 'Writing guide', left + 25, 400, 35, ink, { weight: 600 });
  line(
    c,
    [
      [stop, 347],
      [stop, 747],
    ],
    ready ? green : muted,
    4,
  );
  small(c, ready ? 'Published' : 'Write boundary', stop + 22, 358, ready ? green : muted);
  circle(c, 750, 548, 14, red);
  type(c, cold ? 'Starts cold' : 'Arrives', 777, 531, 39, cold ? red : ink);
  if (arrives) {
    circle(c, 1417, 696, 14, green);
    type(c, read ? 'Reads ' + num(lookupRuns.guideWritten) : 'Arrives', 1444, 679, 38, green);
  }
  foot(
    c,
    read
      ? 'The same guide is available to R3 after publication.'
      : ready
        ? 'The completed guide is now available at its own boundary.'
        : cold
          ? 'R2 processes the guide while R1 finishes its write.'
          : 'R2 arrives while the guide write is still in progress.',
    read ? green : ink,
  );
}

export function endpoints(c, k) {
  const ruler = k.beat.beatIndex >= 2;
  base(
    c,
    k,
    ruler
      ? 'Which reachable entry has the longest prefix?'
      : 'Which length has to meet the minimum?',
    ruler ? 'INCLUSIVE LOOKBACK' : 'EXPLICIT MARKER',
  );
  if (!ruler) {
    const disqualify = cue(k, 1, 'falls short', 0.5);
    const extended = cue(k, 1, 'to sixteen hundred', 0.4) > 0;
    const written = cue(k, 1, 'Once its write completes', 0.6);
    const endpoint = extended ? 1600 : 1400,
      tail = 300;
    const start = 170,
      scale = 0.82,
      y = 485,
      bound = start + endpoint * scale,
      threshold = start + minimum * scale;
    header(c, 'Input tokens · changing question outside the write', 108, 308);
    line(
      c,
      [
        [start, y + 102],
        [1794, y + 102],
      ],
      ink,
      3,
    );
    rect(c, start, y, endpoint * scale, 90, mint);
    rect(c, bound, y, tail * scale, 90, peach);
    type(c, 'Stable guide', start + 30, y + 46, 46, green, { face: 'Serif' });
    type(c, 'Question', bound + 18, y + 44, 34, red);
    line(
      c,
      [
        [threshold, y - 137],
        [threshold, y - 2],
      ],
      red,
      4,
    );
    line(
      c,
      [
        [threshold, y + 90],
        [threshold, y + 102],
      ],
      red,
      4,
    );
    small(c, 'Minimum ' + num(minimum), threshold, y - 160, red, 'center');
    line(
      c,
      [
        [bound, y + 86],
        [bound, y + 145],
      ],
      ink,
      4,
    );
    mono(c, 'Marker ' + num(endpoint), bound, y + 177, 36, ink, 'center');
    foot(
      c,
      written && eligibleMarked(endpoint, minimum)
        ? 'This completed 1,600-token guide qualifies for a later read.'
        : extended
          ? 'The 1,600-token marker clears the minimum. The guide still needs a write.'
          : disqualify
            ? '1,400 falls short even though the full prompt has 1,700 tokens.'
            : 'Measure the selected endpoint against the minimum.',
      written ? green : ink,
    );
    return;
  }
  const after = (n, phrase) => {
    if (k.beat.beatIndex !== n) return k.beat.beatIndex > n;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
  };
  const initial = cue(k, 2, 'Markers at thirty-four', 0.8);
  cue(k, 2, 'and forty-one through sixty', 0);
  const first = after(3, 'Only fifteen is in reach');
  const add = cue(k, 3, 'Add a marker at forty', 0.95);
  const longer = after(3, 'so the worker can reuse through forty');
  const firstResult = longestLookup(windows.entries, windows.initial, windows.width);
  const longerResult = longestLookup(windows.entries, windows.added, windows.width);
  const marker = windows.added.at(-1);
  const px = (n) => 140 + (n - 1) * 27;
  header(c, 'Eligible content positions · each window checks 20 including its marker', 110, 300);
  for (let n = 1; n <= 60; n++) {
    const x = px(n);
    line(c, [[x, 425], [x, n % 5 ? 439 : 450]], muted, 2);
    if (n === 1 || n % 5 === 0) mono(c, n, x, 480, 28, muted, 'center');
  }
  line(c, [[px(1), 423], [px(60), 423]], ink, 3);
  windows.entries.forEach((n) => {
    circle(c, px(n), 414, 11, green);
    type(c, 'Entry ' + n, px(n), 370, 35, green, { align: 'center', weight: 600 });
    line(c, [[px(n), 447], [px(n), 694]], '#acbca9', 2);
  });

  const upper = 535;
  fade(c, initial, () => {
    for (const end of windows.initial) {
      const lo = end - windows.width + 1;
      rect(c, px(lo) - 9, upper, px(end) - px(lo) + 18, 56, mint, 5);
      type(c, lo + ' through ' + end, (px(lo) + px(end)) / 2, upper + 28, 35, ink, {
        align: 'center',
      });
      line(c, [[px(end), upper - 7], [px(end), upper + 63]], ink, 4);
    }
  });
  if (first) {
    line(c, [[px(firstResult), 497], [px(firstResult), upper + 28]], green, 5);
    circle(c, px(firstResult), upper + 28, 9, green);
    circle(c, px(marker), upper + 28, 9, red);
  }

  if (add) {
    const lower = 641;
    const lo = marker - windows.width + 1;
    const span = px(marker) - px(lo) + 18;
    const right = px(marker) + 9;
    const tint = longer ? green : gold;
    rect(c, right - span * add, lower, span * add, 56, tint, 5);
    line(c, [[px(marker), lower - 7], [px(marker), lower + 63]], ink, 4);
    if (add === 1)
      type(c, lo + ' through ' + marker, (px(lo) + px(marker)) / 2, lower + 28, 35,
        longer ? cream : ink, { align: 'center' });
    if (longer) {
      line(c, [[px(marker), upper + 47], [px(marker), lower + 28]], green, 5);
      circle(c, px(marker), lower + 28, 9, green);
    }
  }

  const results = [
    [105, 'Initial markers', first, firstResult],
    [963, 'Added marker ' + marker, longer, longerResult],
  ];
  for (const [i, [x, name, revealed, result]] of results.entries()) {
    if (!initial || (i && !add)) continue;
    rect(c, x, 748, 790, 66, revealed ? mint : cream, 8, rule);
    small(c, name, x + 24, 780);
    mono(c, revealed ? 'Reuse through ' + result : 'Reuse through ?', x + 758, 781, 35,
      revealed ? green : muted, 'right');
  }

}

export function isolation(c, k) {
  const label = cue(k, 1, 'request label says A', 0.4);
  const choose = cue(k, 2, 'B selects its own namespace', 0.65);
  const own = cue(k, 2, 'verified A request', 0.4);
  const alt = cue(k, 2, 'Switch only its adapter', 0.4);
  const audit = cue(k, 3, 'Record the owner', 0.45);
  const unknown = cue(k, 3, 'unknown session', 0.5);
  base(
    c, k,
    audit ? 'Which requests read A’s entry?' : choose ? 'Can this request read A’s guide?' : 'Which identity sets the lookup scope?',
    'VERIFIED SESSION',
  );
  const session = own ? 'session A' : 'session B';
  const r = readPrivate(session, label ? 'A' : 'B', alt ? 'alternate' : 'base', own ? 1 : 0);
  const fields = (x, y, h1, v1, h2, v2) => {
    header(c, h1, x, y);
    type(c, v1, x, y + 68, 57, ink, { face: 'Serif' });
    header(c, h2, x, y + 156);
    mono(c, v2, x, y + 218, 37);
  };
  if (audit) {
    header(c, 'Gateway audit · private guide · model 7', 104, 294);
    sheet(c, 95, 345, 1730, 448);
    const xs = [139, 586, 975, 1277, 1607];
    ['Verified session', 'Adapter', 'Lookup', 'Entry read', 'Prefill'].forEach((s, i) =>
      small(c, s, xs[i], 391),
    );
    const trials = [
      readPrivate('session B', 'A'),
      readPrivate('session A', 'A', 'base', 1),
      readPrivate('session A', 'A', 'alternate', 1),
    ];
    trials.forEach((r, i) => {
      const y = 474 + i * 79;
      line(
        c,
        [
          [123, y - 43],
          [1799, y - 43],
        ],
        rule,
        2,
      );
      const values = [
        'Tenant ' + r.owner,
        r.adapter,
        r.hit ? 'Hit' : 'Miss',
        r.hit ? 'Owner ' + r.owner : 'None',
        r.hit ? 'Tail' : 'Cold',
      ];
      values.forEach((v, j) => type(c, v, xs[j], y, 35, j >= 2 ? (r.hit ? green : red) : ink));
    });
    if (unknown) {
      line(
        c,
        [
          [123, 671],
          [1799, 671],
        ],
        rule,
        2,
      );
      ['Unknown', '', 'Blocked', 'None', ''].forEach((v, j) => type(c, v, xs[j], 725, 35, red));
    }
    foot(
      c,
      unknown
        ? 'Unknown session: the gateway stops before the worker can look up a key.'
        : 'Only the same-scope, same-adapter request read A’s entry.',
      unknown ? red : green,
    );
    return;
  }
  sheet(c, 100, 325, 500, 399);
  fields(
    135,
    380,
    'request form',
    'Label ' + r.clientLabel,
    'After the guide',
    own ? 'time 10:31' : 'time 10:30',
  );
  line(
    c,
    [
      [600, 539],
      [692, 539],
    ],
    rule,
    4,
  );
  sheet(c, 682, 325, 497, 399, '#e1ebdd');
  circle(c, 1100, 421, 39, green);
  circle(c, 1100, 421, 31, mint);
  mono(c, r.owner, 1100, 421, 36, green, 'center');
  fields(720, 380, 'verified session', 'Tenant ' + r.owner, 'Model 7 · adapter', r.adapter);
  line(
    c,
    [
      [1181, 539],
      [1270, 539],
    ],
    choose ? green : rule,
    5,
  );
  sheet(c, 1262, 325, 551, 399);
  header(c, 'Stored entry · owner A', 1298, 380);
  mono(c, storedPrivate.key.slice(0, 10), 1298, 451, 45, green);
  header(c, 'Lookup key', 1298, 536);
  if (choose) mono(c, r.key.slice(0, 10), 1298, 599, 45, r.hit ? green : red);
  else mono(c, '?', 1298, 599, 45, muted);
  if (choose)
    small(c, r.hit ? 'Read A’s entry' : 'No matching entry', 1298, 672, r.hit ? green : red);
  foot(
    c,
    alt
      ? 'A changed adapter changes the computation, even for owner A.'
      : own
        ? 'The timestamp comes after the guide. A reads the same guide entry.'
        : choose
          ? 'B starts cold and reads zero positions from A.'
          : 'The form carries a claim. The gateway can verify the session.',
    choose ? (r.hit ? green : red) : ink,
  );
}

export function capacity(c, k) {
  const step1 = cue(k, 1, 'Take the three empty slots first', 1.1);
  const step2 = cue(k, 1, 'Then overwrite two unreferenced entries', 0.85);
  const used =
    Math.min(3, Math.floor(step1 * 3 + 0.000001)) + Math.min(2, Math.floor(step2 * 2 + 0.000001));
  const s = pool(used);
  const back = cue(k, 2, 'Bring back the question', 0);
  base(
    c, k,
    back ? 'Can the returning question reuse guide G?' : 'Which physical blocks can change hands?',
    'WORKER MEMORY',
  );
  const miss = cue(k, 2, 'The lookup misses', 0);
  const pass = cue(k, 2, 'fresh pass rebuild', 1.9);
  header(c, back ? 'Pool just after R4’s grant · before the next lookup' : 'Physical slot and contents', 95, 287);
  rect(c, 79, 323, 1060, 467, '#354749', 13);
  for (const x of [89, 1128])
    for (const y of [333, 779]) {
      circle(c, x, y, 5, '#c9c3b0');
      line(
        c,
        [
          [x - 2, y + 2],
          [x + 2, y - 2],
        ],
        ink,
        1,
      );
    }
  const fills = { live: '#385459', cached: mint, free: cream, claimed: peach };
  s.cells.forEach(({ id, state, content }) => {
    const x = 100 + (id % 5) * 204,
      y = 345 + Math.floor(id / 5) * 110;
    for (let pin = 0; pin < 7; pin++) rect(c, x + 24 + pin * 23, y + 94, 12, 5, '#bfab7b');
    rect(c, x, y, 193, 95, fills[state], 8, rule);
    mono(c, String(id).padStart(2, '0'), x + 12, y + 21, 26, state === 'live' ? cream : muted);
    type(c, content, x + 97, y + 56, 37, state === 'live' ? cream : ink, {
      align: 'center',
      weight: 600,
    });
    if (id === 9 || id === 10)
      rect(c, x + 12, y + 84, 169, 4, state === 'claimed' ? red : green, 2);
  });
  line(
    c,
    [
      [1178, 326],
      [1178, 780],
    ],
    rule,
    2,
  );
  header(c, back ? '20-slot snapshot after R4’s grant' : 'Resident pool · 20 slots', 1220, 302);
  [
    [s.live, 'referenced', ink],
    [s.cached, 'cached, unowned', green],
    [s.free, 'empty', muted],
    [s.available, 'available', red],
  ].forEach(([v, name, color], i) => {
    const y = 372 + i * 80;
    mono(c, v, 1327, y, 50, color, 'right');
    type(c, name, 1360, y, 38, color);
  });
  if (back) {
    header(c, 'Next · returning request', 1220, 664);
    small(c, '“Why does the test fail?” · guide G', 1220, 706);
    const left = 1220,
      width = 575;
    rect(c, left, 742, width, 38, '#e2ddce', 4);
    if (pass) rect(c, left, 742, width * pass, 38, red, 4);
    for (let token = 1; token < 4; token++)
      line(
        c,
        [
          [left + (width * token) / 4, 742],
          [left + (width * token) / 4, 780],
        ],
        cream,
        3,
      );
    small(
      c,
      pass === 1
        ? '4 guide tokens rebuilt · question next'
        : pass > 0
          ? 'Rebuilding guide state'
          : miss && !s.hasG
            ? 'Lookup missed'
            : 'Looking up G',
      left,
      804,
      miss ? red : ink,
    );
  } else small(c, 'R4 has claimed ' + used + ' of 5', 1220, 726, used ? red : muted);
  foot(
    c,
    back
      ? miss
        ? 'Slot 09 still exists. Its former guide now takes a fresh prefill pass.'
        : 'Look for guide G in the pool after allocation.'
      : used === 5
        ? 'Five slots changed owner. The twenty physical addresses stayed fixed.'
        : used > 0
          ? 'R4 claims empty slots before replacing an unreferenced entry.'
          : 'Use empty slots first, then unowned entries. Take the lowest addresses in each group.',
    miss ? red : ink,
  );
}
