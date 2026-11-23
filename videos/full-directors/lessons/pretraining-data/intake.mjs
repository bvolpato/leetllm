import {
  paper,
  white,
  ink,
  teal,
  red,
  gold,
  muted,
  line,
  mint,
  peach,
  blue,
  ochre,
  pale,
  rect,
  rule,
  dot,
  label,
  mono,
  big,
  heading,
  tape,
  arrow,
  cells,
  textRows,
  tag,
  meter,
  percent,
  total,
} from './art.mjs';
import { corpus, extractionFixture, scored, examples, prose, ngrams, overlap } from './data.mjs';
export const program = extractionFixture.filter((r) => r.code).map((r) => r.text);
const pagePrefix = [
  '<nav>' + extractionFixture.find((r) => r.role === 'navigation').text + '</nav>',
  ...extractionFixture
    .filter((r) => r.role === 'body' && !r.code)
    .map((r) => '<p>' + r.text + '</p>'),
  '<pre>',
].join('\n');
const footer = extractionFixture.find((r) => r.role === 'footer').text;
const pageSuffix = '</pre>\n<footer>' + footer + '</footer>';
const htmlBody = Buffer.from(pagePrefix + program.join('\n') + pageSuffix);
const start = Buffer.byteLength(pagePrefix);
const end = htmlBody.indexOf('</pre>', start);
export const archiveSpan = {
  htmlBody,
  start,
  end,
  lines: htmlBody.subarray(start, end).toString().split('\n'),
};
const [record, menu] = ['C', 'D'].map((id) => corpus.find((v) => v.id === id));
const cents = (n) => Math.round(100 * n) / 100;
export function openingCut(s) {
  return cents(0.5 * s.at(3, 'Try point five', 1.1) + 0.35 * s.at(4, 'Now slide the cutoff', 2));
}

function opening(g, s) {
  const t = openingCut(s),
    cut = s.beat >= 3;
  rect(g, 0, 0, 1200, 675, ink);
  const enter = 1 - Math.min(1, s.elapsed / 1.25);
  const feedOffset = s.beat === 1 ? -58 * enter ** 2 : 0;
  label(g, 'Training feed', 54, 61, 29, white, 'Serif');
  rule(g, 47, 89, 47, 531, '#536d71', 3);
  for (const y of [101, 379]) {
    dot(g, 47, y, 19, '#829898');
    dot(g, 47, y, 12, '#12242a');
    dot(g, 47, y, 5, '#c2cdc5');
  }
  const card = (row, y, h, body) => {
    const rejected = cut && row.score < t;
    const face = rejected ? '#b3b7ac' : row.id === 'C' ? mint : white;
    const dx = rejected ? 20 : 0;
    if (rejected && row.id === 'D') y += 62;
    if (rejected && row.id === 'C') y += 34;
    const x = 52 + dx + feedOffset;
    tape(g, x, y, 743, h, face, ink);
    tag(
      g,
      'Record ' + row.id + '  /  ' + (row.id === 'C' ? 'Python' : 'Navigation'),
      x + 32,
      y + 50,
      rejected ? muted : teal,
    );
    body(x + 31, y);
    mono(g, 'score ' + row.score.toFixed(2), x + 711, y + 47, 22, ink, 'right');
    if (cut)
      label(
        g,
        rejected ? 'Removed' : 'Kept',
        x + 710,
        y + h - 25,
        23,
        rejected ? red : teal,
        'Sans',
        600,
        'right',
      );
  };
  card(record, 99, 236, (x, y) => {
    textRows(g, program, x, y + 109, 51, 39);
    tag(g, 'Excerpt from a ' + record.tokens + '-token record', x, y + 205);
  });
  card(menu, 381, 144, (x, y) => mono(g, menu.text, x, y + 100, 29));
  const x = 885,
    Y = (v) => 525 - v * 418;
  rule(g, x, 107, x, 525, '#a4b6af', 3);
  for (const v of [0, 0.1, 0.5, 0.7, 0.85, 1]) {
    const y = Y(v);
    rule(g, x - 8, y, x + 9, y, '#a4b6af', 2);
    mono(g, v.toFixed(2), x + 17, y + 7, 20, white);
  }
  for (const r of [record, menu]) {
    dot(g, x, Y(r.score), 8, r.id === 'C' ? mint : ochre);
    label(g, r.id, x - 24, Y(r.score) + 8, 25, white, 'Mono');
  }
  if (cut) {
    const y = Y(t);
    rule(g, x - 74, y, x - 4, y, ochre, 3);
    dot(g, x, y, 4, ochre);
    rule(g, x + 90, y, 1147, y, ochre, 3);
    mono(g, 'cut ' + t.toFixed(2), 1147, y - 9, 22, ochre, 'right');
  } else if (s.beat === 2) {
    label(g, 'Try 0.50 or 0.85?', 855, 595, 28, ochre, 'Serif');
  }
  if (s.beat === 3 && s.at(3, 'Before moving'))
    label(g, 'What would 0.85 remove?', 55, 620, 33, white, 'Serif');
  if (s.beat === 4 && t === 0.85) label(g, 'Code left in this batch', 56, 616, 27, white);
  if (s.beat === 4 && t === 0.85) mono(g, '0 tokens', 525, 616, 31, ochre);
}
function planning(g, s) {
  heading(g, 'Training plan', 'How much eligible text will reach the model?');
  const parameters = 70,
    target = parameters * 20,
    raw = 2000,
    quality = raw * 0.7,
    unique = quality * 0.8;
  if (s.beat <= 3) {
    tape(g, 58, 212, 1084, 143, white, paper);
    mono(g, '70B weights', 92, 296, 43);
    mono(g, '× 20', 438, 296, 43, muted);
    if (s.at(1, 'gives one point four'))
      mono(g, '= ' + (target / 1000).toFixed(1) + 'T presentations', 625, 296, 38, teal);
    if (s.beat > 1) {
      tag(g, 'Dominant dense matrix work', 65, 437);
      mono(g, '6 × N × D', 65, 509, 50);
      if (s.at(2, 'That gives'))
        mono(
          g,
          '≈ ' + ((6 * parameters * 1e9 * target * 1e9) / 1e23).toFixed(2) + ' × 10²³ FLOPs',
          493,
          509,
          45,
          teal,
        );
      label(
        g,
        s.beat === 3
          ? 'Sequence length, recomputation and utilization affect the run.'
          : 'N counts modeled weights. D counts token presentations.',
        65,
        593,
        25,
        muted,
      );
    } else if (s.at(1, 'Show the same tokens')) {
      tag(g, 'One source, two presentations', 65, 465);
      cells(g, ['C[0:100]', 'C[0:100]'], 65, 498, 660, 76, { colors: [mint, mint] });
    }
    return;
  }
  const rows = [
    ['Extracted', raw],
    ['Quality survivors', quality],
    ['After deduplication', unique],
  ];
  rows.forEach(([name, n], i) => {
    const y = 242 + i * 100;
    tag(g, name, 58, y + 24);
    if (i === 0 || s.at(4, i === 1 ? 'Quality filtering' : 'Deduplication removes')) {
      rect(g, 337, y - 7, n * 0.33, 40, [blue, ochre, mint][i]);
      mono(g, (n / 1000).toFixed(2) + 'T', 1034, y + 24, 29);
    }
  });
  const tx = 337 + target * 0.33;
  rule(g, tx, 199, tx, 492, red, 3);
  tag(g, 'Target 1.40T', tx - 60, 187, red);
  big(
    g,
    s.beat === 4 ? 'One pass. How large is the gap?' : target - unique + 'B more presentations',
    60,
    587,
    43,
  );
}
function extraction(g, s) {
  const copied = s.at(2, 'Copy the two sentences');
  const flat = s.at(2, 'Try trimming every line') && !s.at(2, 'Copy the four leading spaces');
  const tested = s.at(2, 'The function returns five');
  heading(g, 'Extraction  /  P1', 'Which characters must survive extraction?');
  const x = 66,
    y = 201;
  rect(g, x, y, 510, 373, white);
  rect(g, x, y, 510, 46, blue);
  label(g, 'Page P1  /  saved response', x + 19, y + 32, 22);
  extractionFixture.forEach((r, i) => {
    label(
      g,
      r.text,
      x + 20,
      y + 88 + i * 47,
      23,
      r.role === 'body' ? ink : muted,
      r.code ? 'Mono' : 'Sans',
    );
  });
  arrow(g, 579, 390, 623, 390);
  tape(g, 634, 201, 506, 373, mint, paper);
  tag(g, 'Extracted body  /  program becomes C', 652, 250);
  if (copied) {
    extractionFixture
      .filter((r) => r.role === 'body')
      .forEach((r, i) => {
        label(
          g,
          flat ? r.text.trimStart() : r.text,
          656,
          316 + i * 48,
          24,
          ink,
          r.code ? 'Mono' : 'Sans',
        );
      });
    if (flat) mono(g, 'IndentationError · line 2', 654, 529, 23, red);
    if (tested) mono(g, 'add(2, 3) → 5', 654, 529, 26, teal);
  } else label(g, 'Select the body', 662, 401, 34, teal, 'Serif');
  if (s.beat === 3)
    label(g, 'Other source checks    table cells  /  equation symbols', 67, 631, 24);
  if (s.beat >= 4)
    label(
      g,
      'Trace back    record C  →  P1  /  body span  /  extractor revision',
      67,
      631,
      24,
      teal,
    );
}
function archives(g, s) {
  heading(
    g,
    'Crawl snapshot  /  P1',
    s.beat < 4
      ? 'Which archive can recover the original page?'
      : 'Compare the extracted span with its source',
  );
  if (s.beat >= 4) {
    [0, 1].forEach((i) => {
      const x = 60 + i * 555;
      tape(g, x, 232, 524, 274, i ? mint : white);
      tag(g, i ? 'Extracted record' : 'WARC response · code span', x + 21, 282);
      const lines = i ? program : archiveSpan.lines;
      textRows(g, lines, x + 21, 373, 55, 32);
      if (s.beat === 5) {
        const spaces = lines[1].length - lines[1].trimStart().length;
        const cell = g.measureText(' ').width;
        for (let j = 0; j < spaces; j++) {
          const left = x + 21 + j * cell;
          rule(g, left + 1, 442, left + cell - 2, 442, red, 3);
        }
        tag(g, spaces + ' spaces', x + 21, 477, red);
      }
    });
    if (s.beat === 5 && s.at(5, 'Make the same comparison'))
      label(g, 'Compare source and extract on tables and equations, too.', 60, 593, 28);
    return;
  }
  const offsets = s.at(3, 'saved offsets', 0.3);
  const follow = s.at(3, 'back to the code', 0.4);
  const raw = [
    ['WARC', 'HTTP response', '<pre>…</pre>'],
    ['WAT', 'Derived metadata', 'links / headers'],
    ['WET', 'Extracted text', 'body text'],
  ];
  raw.forEach(([type, name, val], i) => {
    const active = s.at(1, ['WARC preserves', 'WAT stores', 'WET stores'][i]);
    const x = 60 + i * 365;
    tape(g, x, 219, 339, 237, active ? [mint, ochre, blue][i] : white);
    big(g, type, x + 22, 296, 50);
    if (active) {
      tag(g, name, x + 22, 355);
      if (i === 0 && follow) {
        rect(g, x + 15, 369, 309, 74, white);
        textRows(g, archiveSpan.lines, x + 24, 398, 32, 23);
      } else {
        mono(g, val, x + 22, 412, 24);
      }
    }
  });
  if (s.beat === 1 && s.at(1, 'Returning to WARC'))
    label(g, 'Re-extract from WARC. WET carries the earlier extractor’s choices.', 60, 567, 27);
  if (s.beat >= 2) {
    tag(g, 'Retained span in the HTML body', 60, 521);
    mono(g, 'snapshot  /  P1  /', 60, 572, 28);
    const range = 'bytes [' + archiveSpan.start + ', ' + archiveSpan.end + ')';
    mono(g, range, 405, 572, 28);
    const rangeWidth = g.measureText(range).width;
    mono(g, '/  license', 429 + rangeWidth, 572, 28);
    if (offsets) {
      g.save();
      g.globalAlpha = offsets;
      g.strokeStyle = teal;
      g.lineWidth = 3;
      g.strokeRect(397, 539, rangeWidth + 16, 46);
      g.restore();
    }
    if (follow) {
      const fromX = 405 + rangeWidth / 2;
      g.save();
      g.globalAlpha = follow;
      rule(g, fromX, 539, fromX, 475, teal, 3);
      rule(g, fromX, 475, 235, 475, teal, 3);
      arrow(g, 235, 475, 235, 445);
      g.restore();
    }
  }
  if (s.beat === 3)
    label(g, 'Inspect the code and tests.', 60, 625, 24, red);
}
export function filterState(s) {
  let t = 0.2;
  if (s.beat === 2 || s.beat === 3)
    t = cents(
      0.2 +
        0.49 * s.at(2, 'point six nine', 1) +
        0.02 * s.at(2, 'move past the program', 0.6) +
        0.14 * s.at(2, 'Move past E', 0.9),
    );
  if (s.beat >= 4) t = s.at(4, 'Reset the score cutoff') ? 0.5 : 0.85;
  const proseOnly = Boolean(s.at(5, 'C drops out'));
  const kept = corpus.filter(
    (r) => r.score >= t && (!proseOnly || (r.source === 'Prose' && r.tokens >= 200)),
  );
  return { t, proseOnly, kept };
}
function filter(g, s) {
  const { t, proseOnly, kept } = filterState(s);
  heading(g, 'Five raw records  /  before deduplication', 'Which records reach the training feed?');
  mono(g, 'Score ≥ ' + t.toFixed(2), 58, 205, 32);
  if (s.at(4, 'Suppose we also require'))
    label(
      g,
      proseOnly ? 'Applied: prose and ≥ 200 tokens' : 'Proposed: prose and ≥ 200 tokens',
      480,
      203,
      25,
      proseOnly ? teal : red,
    );
  corpus.forEach((r, i) => {
    const y = 245 + i * 61,
      yes = kept.includes(r);
    rect(g, 58, y, 1084, 52, yes ? (r.id === 'C' ? mint : white) : pale);
    mono(g, r.id, 80, y + 35, 27);
    label(
      g,
      r.id === 'C' ? '    return a + b' : r.text,
      142,
      y + 35,
      23,
      yes ? ink : muted,
      r.id === 'C' ? 'Mono' : 'Serif',
    );
    mono(g, r.score.toFixed(2), 635, y + 35, 24);
    mono(g, r.tokens + ' tokens', 759, y + 35, 23);
    tag(g, yes ? 'Kept' : 'Removed', 1010, y + 34, yes ? teal : red);
  });
  big(g, total(kept) + ' retained tokens', 58, 617, 40);
  mono(
    g,
    'weighted mean ' + (kept.reduce((n, r) => n + r.tokens * r.score, 0) / total(kept)).toFixed(3),
    682,
    617,
    26,
  );
}
function proseGate(g, s) {
  const checks = examples.map(prose);
  heading(
    g,
    'English prose  /  teaching subset',
    s.beat < 4 ? 'Which rule catches this record?' : 'Which repetition checks are still missing?',
  );
  if (s.beat < 4) {
    const plain = [
      'The key-rotation runbook explains…',
      'Rotation tasks are available.',
      'sale sale sale sale …',
      '#rule-0 { width: 0px; } …',
    ];
    const details = [
      checks[0].count + ' words · the, and',
      checks[1].count + ' words < 50',
      checks[2].stops.length + ' listed stopwords',
      checks[3].hashes + ' / ' + checks[3].count + ' = 0.20',
    ];
    plain.forEach((v, i) => {
      const y = 202 + i * 84;
      tape(g, 57, y, 1086, 70, i === 0 ? mint : white);
      mono(g, v, 77, y + 43, 22);
      if (
        s.at(
          i === 0 ? 2 : 3,
          ['The runbook passes', 'four-word note', 'Eighty copies', 'CSS has'][i],
        )
      ) {
        label(g, details[i], 578, y + 43, 23);
        tag(g, checks[i].pass ? 'Pass' : 'Drop', 1040, y + 43, checks[i].pass ? teal : red);
      }
    });
    label(
      g,
      '50–100,000 words   ·   3–10 characters per word on average   ·   # / words ≤ 0.10',
      58,
      606,
      22,
    );
  } else {
    const limits = [0.2, 0.18, 0.16];
    [2, 3, 4].forEach((n, i) => {
      const y = 227 + i * 108;
      mono(g, n + '-gram', 59, y + 24, 28);
      meter(g, 291, y, 582, limits[i], 0.25, [teal, gold, red][i]);
      mono(g, limits[i].toFixed(2), 930, y + 24, 32);
    });
    tag(g, 'Maximum character fraction covered by the most frequent n-gram', 59, 185);
    label(
      g,
      s.beat === 5
        ? 'Evaluate code, math and multilingual sources with their own samples.'
        : 'The published suite also checks duplicate lines and paragraphs.',
      59,
      592,
      26,
    );
  }
}
function scores(g, s) {
  heading(
    g,
    'Classifier calibration',
    s.beat <= 2
      ? 'What did the scorer learn to recognize?'
      : 'Which token mass remains above the cutoff?',
  );
  if (s.beat <= 2) {
    const data =
      s.beat === 1
        ? [
            ['Positive examples', 'OpenHermes 2.5 + rated ELI5 answers'],
            ['Select documents', 'Highest-scoring tenth at this stage'],
            ['Token yield', 'Measure retained lengths'],
          ]
        : [
            ['FineWeb-Edu', '0–5 educational value'],
            ['410,000 training  /  50,000 validation', '460,000 teacher annotations'],
            ['CCNet', 'Perplexity relative to Wikipedia'],
          ];
    data.forEach(([a, b], i) => {
      const y = 232 + i * 125;
      rule(g, 60, y - 32, 1140, y - 32, line);
      big(g, a, 62, y + 12, 34);
      label(g, b, 62, y + 51, 25, teal);
    });
    return;
  }
  const t = cents(0.9 * s.at(3, 'Set the cutoff', 1)),
    kept = scored.filter((r) => r.score >= t);
  tag(g, 'Width = tokens in each document', 60, 202);
  let x = 60;
  scored.forEach((r) => {
    const yes = kept.includes(r),
      w = r.tokens * 1.08,
      y = yes ? 256 : 388;
    tape(g, x, y, w - 3, 102, yes ? mint : pale);
    label(g, r.id, x + 8, y + 44, 21, ink);
    mono(g, r.score.toFixed(2), x + 8, y + 76, 21);
    x += w;
  });
  mono(g, 'cut ' + t.toFixed(2), 60, 561, 28);
  big(g, total(kept) + ' / 1,000 tokens', 420, 563, 47);
  if (s.beat >= 4) tag(g, percent(total(kept), 1000) + ' yield', 965, 560);
}
function corpusEvidence(g, s) {
  const headings = [
    'What changed in the recipe?',
    'From candidate pool to measured value',
    'Where does an English gate lose coverage?',
    'Which source supplied these English tokens?',
    'What does another pass add?',
  ];
  heading(g, 'Corpus provenance', headings[s.beat - 1]);
  if (s.beat === 1 || s.beat === 2) {
    const pairs =
      s.beat === 1
        ? [
            ['C4', 'Heuristic cleaning'],
            ['The Pile', '22 sources'],
            ['Dolma', 'Inspect source and processing'],
            ['FineWeb', 'Compare extraction, filters and deduplication'],
          ]
        : [
            ['DataComp-LM', '240T-token candidate pool'],
            ['Selection', 'Filtered inventory'],
            ['Matched training run', 'Evaluate the target task'],
          ];
    pairs.forEach(([a, b], i) => {
      const y = 218 + i * 94;
      big(g, a, 59, y + 48, 35);
      arrow(g, 444, y + 32, 508, y + 32);
      label(g, b, 550, y + 43, 27);
    });
    return;
  }
  if (s.beat === 3) {
    const rows = [
      ['English', 'the key and the lock', 2],
      ['Python', 'return a + b', 0],
      ['Spanish', 'gira las llaves', 0],
    ];
    rows.forEach(([a, b, n], i) => {
      const y = 222 + i * 112;
      tape(g, 60, y, 1080, 88, i === 0 ? mint : white);
      tag(g, a, 84, y + 54);
      mono(g, b, 300, y + 55, 30);
      if (s.at(3, 'Copying one English'))
        mono(g, n + ' listed stops', 863, y + 55, 24, n ? teal : red);
    });
    return;
  }
  const rows =
    s.beat === 4
      ? [
          ['Organic', 'English source'],
          ['Translation', 'Source + translation lineage'],
          ['Rephrasing', 'Source + generator + terms'],
        ]
      : [
          ['Human source', 'C[0:100]'],
          ['Generated variant', 'C → G1'],
          ['Repeated exposure', 'C[0:100]  +  C[0:100]'],
        ];
  rows.forEach(([a, b], i) => {
    const y = 233 + i * 103;
    tape(g, 60, y, 1080, 86, [mint, blue, ochre][i]);
    big(g, a, 79, y + 54, 33);
    mono(g, b, 494, y + 54, 25);
  });
  if (s.beat === 4)
    tag(g, 'Nemotron-CC v2.1   /   2.5T added English tokens across these categories', 60, 610);
}
function mirrors(g, s) {
  if (s.beat === 1) {
    heading(g, 'Exact duplicate', 'Two source IDs, one normalized passage');
    const joined = s.at(1, 'second copy vanishes', 1.0);
    tape(g, 60, 252, 525, 157, mint);
    tag(g, 'Original A', 80, 303);
    big(g, corpus[0].text, 80, 364, 32);
    if (joined < 1) {
      const x = 609 - 128 * joined,
        y = 305 + 72 * joined;
      g.save();
      g.globalAlpha = 1 - joined;
      tape(g, x, y, 525, 157, blue);
      tag(g, 'Mirror B', x + 20, y + 51);
      big(g, corpus[1].text, x + 20, y + 112, 32);
      g.restore();
    } else {
      arrow(g, 811, 504, 551, 415);
      tape(g, 815, 461, 313, 87, ochre);
      mono(g, 'B → A', 846, 517, 28);
      tag(g, 'Kept · 240 tokens', 60, 477);
      tag(g, 'Saved mirror lineage', 816, 597);
    }
    return;
  }
  heading(g, 'Near duplicates', 'What changes when one word changes?');
  const texts = ['the cat sat on the mat', 'the cat sat on a mat'];
  const sets = texts.map((t) => ngrams(t, 3)),
    both = overlap(...sets);
  texts.forEach((t, i) => {
    const x = 58 + i * 554;
    tape(g, x, 203, 527, 300, i ? blue : mint);
    big(g, t, x + 16, 269, 36);
    sets[i].forEach((v, j) =>
      mono(g, v, x + 23, 323 + j * 46, 24, both.shared.includes(v) ? teal : ink),
    );
  });
  if (s.at(2, 'Two of the six'))
    big(
      g,
      both.shared.length + ' shared / ' + both.union.length + ' distinct triples',
      58,
      565,
      39,
    );
  if (s.beat === 3)
    label(g, 'Compare the changed ending before choosing a representative.', 58, 621, 25, teal);
}
export default [
  opening,
  planning,
  extraction,
  archives,
  filter,
  proseGate,
  scores,
  corpusEvidence,
  mirrors,
];
