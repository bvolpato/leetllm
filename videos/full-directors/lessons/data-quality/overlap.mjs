import {
  bandCandidates,
  idealCandidateProbability as prob,
  minhashCases,
  shingleComparison,
} from '../../../films/data-quality/model.mjs';
import {
  referencePassage,
  editedPassage,
  fingerprint,
} from '../../../films/data-quality/fixtures.mjs';
import {
  ink,
  muted,
  paper,
  teal,
  rust,
  blue,
  green,
  mint,
  apricot,
  pale,
  gold,
  shortHash,
  mix,
} from './printshop.mjs';

function shingles(text) {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.length < 2 ? words : words.slice(1).map((w, i) => words[i] + ' ' + w);
}
const messages = ['build has not passed', 'my build has not passed'];
const sets = messages.map(shingles),
  common = shingleComparison(...sets);
const fine = prob(common.score, 14, 8);
const chain = ['build has failed', 'build has failed again', 'has failed again'];
const pieces = ['build has', 'has failed', 'failed again'];
const pairs = [
  [0, 1],
  [1, 2],
  [0, 2],
].map(([a, b]) => shingleComparison(shingles(chain[a]), shingles(chain[b])));
const swatches = [mint, apricot, pale];
// Both snapshots contain this page once. The example follows one matching band.
const crawlPage = 'Library opens Monday at noon.';
const crawlCopies = [
  { snapshot: 'Newer snapshot', page: crawlPage, band: [17, 4, 21, 8, 6, 15, 9, 3] },
  { snapshot: 'Older snapshot', page: crawlPage, band: [17, 4, 21, 8, 6, 15, 9, 3] },
];
function keepCrawlCopies(acrossSnapshots) {
  return crawlCopies.map((copy, i) => {
    const alreadyProcessed = crawlCopies.slice(0, i);
    return !alreadyProcessed.some((previous) => {
      const inScope = acrossSnapshots || previous.snapshot === copy.snapshot;
      return inScope && bandCandidates(previous.band, copy.band, 8).candidate;
    });
  });
}
const acrossCrawls = keepCrawlCopies(true);
const withinCrawls = keepCrawlCopies(false);

export function near(d) {
  const { ground, beat, cue, mono, title, chip, rect, label } = d;
  ground('TICKET WORD PAIRS   /   JACCARD');
  title('One extra word', 41, 111);
  messages.forEach((s, i) => {
    const y = 155 + i * 114;
    mono(s, 42, y, 21);
    sets[i].forEach((v, j) => {
      const shared = common.intersection.includes(v);
      chip(
        v,
        42 + (i === 0 ? 1 : 0) * 220 + j * 220,
        y + 15,
        205,
        51,
        shared ? teal : rust,
        paper,
        23,
      );
    });
  });
  if (beat === 1 && cue(1, 'Three of their four'))
    label(
      common.intersection.length +
        ' shared / ' +
        common.union.length +
        ' in union  =  ' +
        common.score,
      44,
      430,
      29,
    );
  if (beat === 2 && cue(2, 'FineWeb documents')) {
    mono('FineWeb uses five-word shingles.', 44, 385, 20);
    label('112 positions in 14 bands × 8 rows', 44, 439, 24);
    for (let i = 0; i < 14; i++) rect(478 + i * 31, 399, 24, 46, blue);
  }
  if (beat === 3) {
    label('Candidate probability at similarity 0.75', 42, 385, 23);
    rect(43, 408, 740, 37, '#bac4b7');
    rect(43, 408, 740 * fine, 37, teal);
    mono(Math.round(100 * fine) + '%', 805, 438, 26);
  }
}

export function minima(d) {
  const { ground, beat, cue, title, mono, label, chip, center, rect, table } = d;
  ground('MINHASH   /   FIRST SHINGLE IN EACH ORDER');
  if (beat === 1 || beat === 2 || beat === 5) {
    title(
      beat === 5 ? 'Build one signature position per ranking' : 'Read each ranking from the left',
      40,
      108,
    );
    const orders = ['abcd', 'bcda', 'cdab', 'dabc'];
    table(
      [
        [50, 118, 'Ranking'],
        [172, 340, 'Earlier → later'],
        [513, 193, 'Min A'],
        [706, 214, 'Min B'],
      ],
      orders.map((order, i) => {
        const show =
          beat === 5 || (i === 3 ? cue(2, 'member is d') : cue(2, 'earliest union member'));
        return [
          i + 1,
          [...order].join('     '),
          show ? order.replace('d', '')[0] : '?',
          show ? order[0] : '?',
        ];
      }),
      161,
      52,
    );
    mono('A = a b c      B = a b c d', 44, 405, 21);
    label('a  build has      b  has not      c  not passed      d  my build', 44, 453, 20);
  } else if (beat < 6) {
    title('All orderings of four shingles', 40, 109);
    minhashCases.forEach((r, i) => {
      const x = 41 + (i % 6) * 148,
        y = 140 + Math.floor(i / 6) * 56;
      chip(r.order.join(' '), x, y, 137, 44, r.match ? teal : rust, paper, 19);
    });
    if (cue(3, 'Eighteen'))
      label(
        minhashCases.filter((r) => r.match).length +
          ' / ' +
          minhashCases.length +
          ' share a minimum  =  0.75',
        43,
        416,
        30,
      );
    if (beat === 4) mono('A finite sample of rankings can give a different fraction.', 45, 462, 18);
  } else {
    title('The shingler at the intake boundary', 43, 119);
    table(
      [
        [50, 275, 'Message'],
        [328, 265, 'Shingles'],
        [597, 313, 'Minimum'],
      ],
      [
        ['“build”', '{build}', 'build'],
        ['“”', 'empty set', 'undefined'],
      ],
      184,
      76,
    );
    label('Two empty inputs receive score 0 under this rule.', 43, 396, 25);
    mono('Blank messages stop at intake.', 44, 444, 20, teal);
  }
}

const upper = [1, 4, 2, 8],
  lower1 = [1, 4, 3, 7],
  lower2 = [1, 9, 2, 7];
const bandResults = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
];
const bandGrid = bandResults.map((second) =>
  bandResults.map((first) => ({ first: first.every(Boolean), second: second.every(Boolean) })),
);
const bandOutcomes = bandGrid.flat();
const firstBandCount = bandOutcomes.filter(({ first }) => first).length;
const addedBandCount = bandOutcomes.filter(({ first, second }) => second && !first).length;
const missedBandCount = bandOutcomes.filter(({ first, second }) => !first && !second).length;
const candidateCount = bandOutcomes.length - missedBandCount;

export function bands(d) {
  const { ground, beat, cue, title, mono, label, chip, center, rect } = d;
  ground('LSH   /   BAND INDEX');
  if (beat < 4) {
    const changed = cue(2, 'change the lower signature'),
      lower = changed ? lower2 : lower1;
    const state = bandCandidates(upper, lower, 2),
      show = changed ? cue(3, 'Neither band') : cue(1, 'both the one');
    title('One full band opens the review queue', 42, 105);
    ['Band 1', 'Band 2'].forEach((v, i) => {
      const x = 154 + i * 384;
      d.strip(x, 134, 359, 226, paper, show && state.bands[i] ? green : blue);
      mono(v, x + 18, 166, 18);
    });
    [upper, lower].forEach((values, i) => {
      const y = 230 + i * 91;
      mono(i ? 'Doc B' : 'Doc A', 49, y, 19, muted);
      values.forEach((v, j) => {
        const x = 246 + Math.floor(j / 2) * 384 + (j % 2) * 170;
        center(v, x, y, 44);
        if (i) center(state.matched[j] ? '=' : '≠', x, y - 48, 24, state.matched[j] ? green : rust);
      });
    });
    label('Matching positions   ' + state.matched.filter(Boolean).length + ' / 4', 44, 413, 23);
    chip(
      show ? (state.candidate ? 'Queue for review' : 'Skip this pair') : 'Queue this pair?',
      560,
      380,
      348,
      62,
      show && state.candidate ? green : blue,
    );
  } else if (beat <= 6) {
    const after = (b, phrase) => {
      if (beat !== b) return beat > b;
      const { start, end } = d.clock.wordCue(phrase);
      return d.clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    };
    const column = cue(4, 'The right column', 1.4);
    const row = cue(5, 'The bottom row', 1.8);
    const showOutcomes = after(4, 'Each square stands for one of sixteen equally likely outcomes');
    const showQuarter = after(4, "That's one quarter of the square");
    const showMisses = after(5, 'Nine squares miss both bands');
    const showCandidates = after(5, 'That leaves seven out of sixteen chances to become a candidate');
    const showFormula = after(
      6,
      'Raise that miss probability to the number of independent bands, then take its complement',
    );
    const axisLabels = bandResults.map((result) =>
      result.map((match) => (match ? '✓' : '×')).join(''),
    );
    const progressAt = (progress, count, index) =>
      Math.min(1, Math.max(0, progress * count - index));
    const gridX = 145,
      gridY = 188,
      cellW = 67,
      cellH = 54,
      stepX = 75,
      stepY = 62;

    title('Two independent bands of two rows', 40, 104);
    mono('BAND 1 →', gridX, 141, 18, teal);
    mono('BAND 2 ↓', 43, 176, 18, blue);
    axisLabels.forEach((symbols, i) => {
      center(symbols, gridX + i * stepX + cellW / 2, 176, 23);
      center(symbols, 106, gridY + i * stepY + 35, 23);
    });
    bandGrid.forEach((outcomes, i) => {
      outcomes.forEach(({ first, second }, j) => {
        const x = gridX + j * stepX,
          y = gridY + i * stepY;
        const missed = showMisses && !first && !second;
        rect(x, y, cellW, cellH, missed ? '#e5d4bb' : '#cbd3c4');
        if (first) {
          rect(x, y, cellW, cellH * progressAt(column, firstBandCount, i), teal);
          if (second && row > 0) {
            // Keep the first band's fill. The outline identifies the square already counted.
            d.ctx.strokeStyle = pale;
            d.ctx.lineWidth = 4;
            d.ctx.strokeRect(x + 5, y + 5, cellW - 10, cellH - 10);
          }
        } else if (second) {
          const filled = cellW * progressAt(row, addedBandCount, addedBandCount - 1 - j);
          rect(x + cellW - filled, y, filled, cellH, blue);
        } else if (missed) {
          center('×', x + cellW / 2, y + 37, 25, muted);
        }
      });
    });
    mono('Independent rows · P(match) = ½', 478, 151, 20, teal);
    if (showOutcomes) label(`${bandOutcomes.length} equally likely outcomes`, 478, 183, 23, muted);
    if (showQuarter) {
      rect(478, 211, 21, 21, teal);
      label('First band matches', 512, 230, 24);
      mono(`${firstBandCount} / ${bandOutcomes.length}`, 769, 230, 22, teal);
      mono('½ × ½ = ¼', 512, 250, 20, muted);
    }
    if (row === 1) {
      rect(478, 266, 21, 21, blue);
      label('Second band adds', 512, 285, 24);
      mono(`${addedBandCount} new`, 769, 285, 22, blue);
      label('The outlined square counts once.', 512, 315, 20, muted);
    }
    if (showMisses) {
      rect(478, 340, 21, 21, '#e5d4bb');
      center('×', 488.5, 359, 22, muted);
      label('Miss both bands', 512, 359, 24);
      mono(`${missedBandCount} / ${bandOutcomes.length}`, 769, 359, 22, muted);
    }
    if (showCandidates) {
      d.line(478, 384, 917, 384, muted);
      label('Candidate probability', 478, 428, 24);
      title(`${candidateCount} / ${bandOutcomes.length}`, 765, 430, 43, teal);
    }
    if (showFormula) mono('P(candidate) = 1 − (1 − s^r)^b', gridX, 474, 24, teal);
  } else {
    const fineWeb = beat >= 8;
    title(fineWeb ? 'The 112-position index' : 'The same four positions, regrouped', 41, 109);
    const cfg = fineWeb
      ? [[14, 8, 0.75]]
      : [
          [4, 1, 0.5],
          [2, 2, 0.5],
          [1, 4, 0.5],
        ];
    cfg.forEach(([b, r, s], i) => {
      let y = 161 + i * 94;
      const p = prob(s, b, r);
      mono(b + ' × ' + r + '     s = ' + s, 42, y + 24, 20);
      rect(345, y, 449, 39, '#c9cfbf');
      rect(345, y, 449 * p, 39, teal);
      mono((100 * p).toFixed(fineWeb ? 1 : 2) + '%', 804, y + 29, 20);
    });
    if (fineWeb) {
      label('Miss probability', 44, 278, 23);
      title((100 * (1 - fine)).toFixed(1) + '%', 42, 349, 62);
      label('A crowded bucket still sends every pair to comparison.', 42, 430, 24);
    }
  }
}

function chainStrip(d, i, x, y, w, selected) {
  d.strip(x, y, w, 80, paper, [teal, blue, rust][i]);
  d.mono('ABC'[i] + '    ' + chain[i], x + 14, y + 25, 18, ink, w - 35);
  const values = shingles(chain[i]),
    slot = (w - 32) / 3;
  pieces.forEach((piece, j) => {
    if (values.includes(piece))
      d.chip(
        piece,
        x + 12 + j * slot,
        y + 38,
        slot - 3,
        31,
        selected?.includes(piece) ? teal : swatches[j],
        selected?.includes(piece) ? paper : ink,
        14,
      );
  });
}
export function chainScene(d) {
  const { ground, beat, cue, title, mono, label, chip, center } = d;
  if (beat === 6) {
    ground('FINEWEB   /   A MATCH IN ALL 8 ROWS OF ANY ONE MINHASH BAND', true);
    title('Across crawls or within each crawl?', 41, 112, 39, paper);
    label('The same page appears once in each snapshot.', 43, 153, 22, mint);
    const cardX = [241, 591];
    crawlCopies.forEach((copy, i) => {
      const x = cardX[i];
      d.strip(x, 184, 329, 100, paper, teal);
      mono(copy.snapshot, x + 16, 215, 18, teal);
      title(copy.page, x + 16, 258, 24, ink, 295);
    });
    const policyRow = (y, name, kept) => {
      label(name, 43, y + 21, 22, paper, { max: 182 });
      const count = kept.filter(Boolean).length;
      mono(count + (count === 1 ? ' copy kept' : ' copies kept'), 44, y + 47, 16, mint);
      kept.forEach((retain, i) =>
        chip(retain ? 'Keep' : 'Remove duplicate', cardX[i], y, 329, 52, retain ? green : rust),
      );
    };
    if (cue(6, 'aggressive global')) {
      policyRow(315, 'Across crawls', acrossCrawls);
      mono('The global run processes the newer snapshot first.', 43, 475, 19, mint);
    }
    if (cue(6, 'per-crawl')) policyRow(389, 'Within each crawl', withinCrawls);
    return;
  }
  const fineWebCluster = beat === 3 && cue(3, 'FineWeb’s published');
  ground(
    fineWebCluster
      ? 'TICKET EDGES AT OVERLAP ≥ 0.60     /     FINEWEB EDGES FROM A FULL MINHASH BAND'
      : beat === 5 ? 'CANDIDATE INDEX   /   ALL-PAIRS COMPARISON' : 'TICKET SHINGLES   /   PAIR THRESHOLD  0.60',
    true,
  );
  if (beat <= 4) {
    const pull = cue(2, 'Bring the outer messages together', 1.2);
    const yA = mix(90, 141, pull),
      yB = mix(203, 374, pull),
      yC = mix(316, 240, pull);
    const left = cue(1, 'first two share'),
      right = cue(1, 'last two share'),
      outer = cue(2, 'Only one');
    const marked = outer ? pairs[2].intersection : undefined;
    // Each vertical join meets the same word-pair column on both impressions.
    const joinMarks = (p, from, to, color) => {
      for (const word of p.intersection) {
        const j = pieces.indexOf(word),
          x = 55 + ((j + 0.5) * (495 - 32)) / 3;
        d.line(x, from, x, to, color, 3);
        d.dot(x, from, 4, color);
        d.dot(x, to, 4, color);
      }
    };
    if (!pull && left) joinMarks(pairs[0], yA + 79, yB, mint);
    if (!pull && right) joinMarks(pairs[1], yB + 79, yC, gold);
    if (outer) joinMarks(pairs[2], yA + 79, yC, mint);
    chainStrip(d, 0, 43, yA, 495, marked);
    d.ctx.save();
    // Remove the bridge from the comparison plane before the outer pair closes.
    d.ctx.globalAlpha = pull < 0.5 ? Math.max(0, 1 - 5 * pull) : Math.min(1, (pull - 0.5) * 2);
    chainStrip(d, 1, 43, yB, 495);
    d.ctx.restore();
    chainStrip(d, 2, 43, yC, 495, marked);
    if (!pull) {
      if (left) {
        d.line(545, 130, 563, 130, mint, 3);
        d.line(563, 130, 563, 241, mint, 3);
        d.line(545, 241, 563, 241, mint, 3);
        mono('A ↔ B    2 / 3', 589, 190, 24, mint);
      }
      if (right) {
        d.line(545, 250, 563, 250, gold, 3);
        d.line(563, 250, 563, 355, gold, 3);
        d.line(545, 355, 563, 355, gold, 3);
        mono('B ↔ C    2 / 3', 589, 309, 24, gold);
      }
    } else {
      mono('A ↔ C', 591, 198, 23, mint);
      title(outer ? '1 / 3' : '? / 3', 582, 280, 67, paper);
      if (outer) mono('below 0.60', 594, 328, 22, gold);
    }
    if (beat === 3 || beat === 4) {
      const text = beat === 3 ? 'Connected via B' : 'Queue the two edges for review';
      center(text, 744, 413, 21, paper, 345);
      mono('A ↔ B ↔ C', 644, 457, 23, mint);
    }
  } else {
    const n = 10000;
    mono('DOCUMENTS TO COMPARE', 43, 119, 18, mint);
    title(n.toLocaleString('en-US'), 41, 208, 76, paper);
    d.line(43, 239, 910, 239, mint);
    mono('DISTINCT UNORDERED PAIRS', 44, 288, 18, mint);
    title(((n * (n - 1)) / 2).toLocaleString('en-US'), 41, 383, 76, paper);
    label(
      beat === 5 ? 'n × (n − 1) / 2' : 'Test retention policy on the target corpus and task.',
      46,
      455,
      25,
      mint,
    );
  }
}

const train = ['migration blocked for 12 days', 'runbook link updated'],
  locked = ['MIGRATION blocked for 12 days', 'incident review still pending'];
export function contamination(d) {
  const { ground, beat, cue, mono, ticket, arrow, label, chip } = d;
  ground('LOCKED EVALUATION   /   WHOLE-MESSAGE SEARCH');
  mono('TRAINING SNAPSHOT', 41, 111, 19, teal);
  mono('LOCKED MESSAGES', 508, 111, 19, blue);
  [train, locked].forEach((list, side) =>
    list.forEach((v, i) => {
      const x = 40 + side * 467,
        y = 145 + i * 142;
      const key = fingerprint(v);
      ticket(
        x,
        y,
        410,
        110,
        side ? 'Locked ' + (i + 1) : 'Source ' + (i + 1),
        v,
        cue(2, 'fingerprints') ? shortHash(key) + '…' : '',
        side ? pale : paper,
        side ? blue : teal,
      );
    }),
  );
  if (cue(2, 'migration message')) {
    arrow(453, 203, 505, 203, rust, 4);
    chip('Locked 1   /   exact match in training', 44, 435, 525, 49, rust);
  }
  if (cue(2, 'no exact match'))
    label('Locked 2   /   no exact match', 587, 469, 21, teal, { max: 330 });
}

const answer = referencePassage.split(' '),
  page = ['notes', ...answer, 'archive'];
function wordLine(d, words, y, start = -1, count = 0) {
  const { ctx } = d;
  ctx.font = '500 19px "Lesson Sans"';
  const widths = words.map((w) => ctx.measureText(w).width + 14),
    k = Math.min(1, 875 / widths.reduce((a, b) => a + b, 0));
  let x = 42;
  words.forEach((w, i) => {
    const width = widths[i] * k;
    const marked = i >= start && i < start + count;
    if (marked) d.rect(x, y - 28, width, 40, mint);
    d.center(w, x + width / 2, y, 19, ink, width - 3);
    x += width;
  });
}
export function passage(d) {
  const { ground, beat, cue, mono, title, table, chip, label } = d;
  ground('LOCKED PASSAGE   /   SEARCH WINDOW');
  if (beat === 6) {
    title('GPT-3 benchmark audit', 42, 108);
    table(
      [
        [49, 264, 'Search'],
        [313, 242, 'Word window'],
        [555, 362, 'Scope'],
      ],
      [
        ['Initial filter', '13 words', 'Lowercase, remove punctuation'],
        ['Later audit', '8–13 words', 'Typical non-synthetic tasks'],
      ],
      176,
      73,
    );
    if (cue(6, 'filtering bug'))
      chip('Long documents retained some copied passages.', 44, 371, 864, 63, rust);
    return;
  }
  if (beat <= 3) {
    mono('LOCKED ANSWER   /   13 WORDS', 42, 111, 18, teal);
    wordLine(d, answer, 172, 0, 13);
    mono('TRAINING PAGE   /   15 WORDS', 42, 245, 18, teal);
    const scanning = cue(2, 'first thirteen words'),
      shifted = cue(2, 'Now it starts');
    wordLine(d, page, 306, scanning ? (shifted ? 1 : 0) : -1, scanning ? 13 : 0);
    if (cue(2, 'whole message misses')) chip('Whole message   ×', 43, 374, 302, 55, rust);
    if (scanning)
      chip(
        shifted ? 'Window 2–14   ✓' : 'Window 1–13   ×',
        378,
        374,
        330,
        55,
        shifted ? green : rust,
      );
    if (beat === 3) mono('Evidence   /   source page + offsets 2–14', 43, 480, 18, teal);
  } else {
    if (beat <= 7) {
      mono('LOCKED ANSWER', 43, 101, 16, teal);
      wordLine(d, answer, 145);
      mono('SECOND DOCUMENT', 42, 204, 16, teal);
      title(editedPassage, 41, 254, 30);
    } else title('Is the training snapshot available?', 41, 117);
    const rows = [
      ['Longer page', 'miss', 'matched words 2–14'],
      [
        'Rewritten advice',
        cue(5, 'Both searches miss') ? 'miss' : '?',
        cue(5, 'Both searches miss') ? 'too short' : '?',
      ],
    ];
    if (beat >= 8)
      rows.push([
        'Unknown snapshot',
        cue(9, 'Neither search ran') ? 'unavailable' : '?',
        cue(9, 'Neither search ran') ? 'unavailable' : '?',
      ]);
    table(
      [
        [49, 290, 'Source'],
        [340, 240, 'Whole message'],
        [580, 331, '13-word window'],
      ],
      rows,
      beat >= 8 ? 181 : 324,
      48,
    );
    if (beat === 7 || beat === 10)
      label(
        beat === 7
          ? 'Record the dated snapshot, span and review decision.'
          : 'For an unseen-task claim, evaluate a fresh private task.',
        44,
        452,
        24,
      );
  }
}
export function checkOverlap(assert) {
  assert.deepEqual(acrossCrawls, [true, false]);
  assert.deepEqual(withinCrawls, [true, true]);
  assert.equal(common.score, 0.75);
  assert.equal(minhashCases.filter((r) => r.match).length, 18);
  assert.deepEqual(
    pairs.map((p) => p.score),
    [2 / 3, 2 / 3, 1 / 3],
  );
  assert.deepEqual(pairs[2].intersection, ['has failed']);
  assert.equal(bandCandidates(upper, lower1, 2).candidate, true);
  assert.equal(bandCandidates(upper, lower2, 2).candidate, false);
  assert.equal(bandOutcomes.length, 16);
  assert.deepEqual([firstBandCount, addedBandCount, missedBandCount, candidateCount], [4, 3, 9, 7]);
  assert.equal(bandOutcomes.filter(({ first, second }) => first && second).length, 1);
  assert.equal(firstBandCount / bandOutcomes.length, 0.5 ** 2);
  assert.equal(candidateCount / bandOutcomes.length, prob(0.5, 2, 2));
  assert.ok(Math.abs(prob(0.8, 2, 2) - 0.8704) < 1e-10);
  assert.equal(page.slice(1, 14).join(' '), referencePassage);
  assert.notEqual(page.slice(0, 13).join(' '), referencePassage);
  assert.equal(editedPassage.split(' ').length, 9);
  assert.deepEqual(
    locked.map((v) => train.some((t) => fingerprint(t) === fingerprint(v))),
    [true, false],
  );
}
