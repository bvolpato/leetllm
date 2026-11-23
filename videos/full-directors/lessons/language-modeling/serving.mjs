import { loadImage } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  C,
  rect,
  line,
  type,
  tag,
  big,
  token,
  row,
  rail,
  ticks,
  bracket,
  heading,
  cue,
  hatching,
  arrow,
  animal,
  dot,
  sum,
  fixed,
  pct,
} from './drawing.mjs';
import {
  parity,
  generationWork,
  pageBudget,
  greedyToken,
  gqaGiB,
  rawKvBytes,
  rows,
  selectSample,
  foxRun,
  foxRetry,
  foxFactors,
  foxPath,
  ppl,
} from './examples.mjs';

function cacheCell(c, x, y, w, word) {
  rect(c, x, y, w, 47, word ? C.mint : C.faint);
  if (word) {
    rect(c, x, y, w, 7, C.blue);
    rect(c, x, y + 39, w, 8, C.teal);
    type(c, word, x + w / 2, y + 24, 22, C.ink, { align: 'center', face: 'Serif' });
  } else hatching(c, x, y, w, 47);
}
export function lifecycle(c, k) {
  const b = k.beat.beatIndex;
  const pref = cue(k, 0, 'This is prefill') > 0.5;
  const sampled = cue(k, 0, 'we sample slept') > 0.5,
    feed = cue(k, 2, 'appends its key and value') > 0.5,
    stop = cue(k, 3, 'selects end') > 0.5;
  const drop = cue(k, 4, 'Drop its resident vectors', 0.6),
    replay = cue(k, 4, 'then replay exactly', 1.3);
  const n = drop ? Math.floor(3 * replay) : feed ? 3 : pref ? 2 : 0;
  heading(c, 'When does “slept” enter the cache?', 'A request in the decoder');
  tag(c, 'Processed input', 47, 207);
  tag(c, 'Resident K / V', 47, 302);
  tag(c, 'Accepted output', 47, 397);
  const words = ['The', 'cat', 'slept', 'end'],
    x = 226,
    step = 165,
    w = 148;
  words.forEach((word, i) => {
    const xx = x + i * step;
    if (i < (feed ? 3 : pref ? 2 : 0)) token(c, word, xx, 183, w, { h: 48, fill: C.cream });
    cacheCell(c, xx, 279, w, i < n ? word : null);
    if (i >= 2 && (i === 2 ? sampled : stop)) token(c, word, xx, 372, w, { h: 49, fill: C.sand });
  });
  if (sampled && !feed) arrow(c, x + 2 * step + w / 2, 366, x + 2 * step + w / 2, 335, C.red);
  if (b >= 3)
    type(
      c,
      n +
        ' resident positions   ·   ' +
        (stop ? '2 accepted outputs' : '1 accepted output') +
        (b >= 4 ? '   ·   replay emits no new token' : ''),
      48,
      471,
      23,
      C.blue,
    );
}
export function parityCheck(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'Which keys may the last query read?', 'Cache parity  ·  single attention layer');
  if (b < 2) {
    const count =
      b === 0
        ? 3
        : 3 +
          Number(cue(k, 1, 'positions three') > 0.2) +
          Number(cue(k, 1, 'and four') > 0.5);
    tag(c, 'Full pass', 51, 226);
    tag(c, 'Cached pass', 51, 348);
    [parity.full, parity.cached].forEach((matrix, r) => {
      for (let i = 0; i < (r ? count : 5); i++) {
        const x = 219 + i * 138,
          y = 185 + r * 123;
        type(c, 'pos ' + i, x + 54, y - 15, 17, C.muted, { align: 'center' });
        matrix[i].forEach((v, j) => {
          rect(c, x + j * 26, y, 23, 65, v < 0 ? C.rose : C.mint);
          rect(c, x + j * 26, y + 32, 23, -v * 7, v < 0 ? C.red : C.teal);
        });
      }
    });
    if (count === 5)
      type(c, 'All 5 × 4 outputs agree within tolerance  (atol = 10⁻⁶).', 51, 418, 23, C.teal);
  } else {
    const wrong =
      b === 2 && cue(k, 2, 'An upper-left') > 0.3 && cue(k, 2, 'explicit all-allowed') < 0.5;
    tag(c, 'One decode query at absolute position 4', 53, 174);
    parity.lastProbabilities.forEach((v, i) => {
      const x = 65 + i * 173,
        ok = !wrong || i === 0;
      token(c, 'key ' + i, x, 225, 140, { fill: ok ? C.mint : C.faint });
      if (ok) {
        rect(c, x, 314, 140 * (wrong ? 1 : v), 19, C.blue);
        type(c, wrong ? '1.000' : fixed(v, 3), x, 363, 20, C.ink, { face: 'Mono' });
      } else {
        hatching(c, x, 312, 140, 25);
        type(c, 'blocked', x, 363, 19, C.red);
      }
    });
    const out = wrong ? parity.wrongUpperLeftOutput : parity.allowedOutput;
    type(
      c,
      (wrong ? 'Upper-left mask' : 'All five keys allowed') +
        '    →    [' +
        out.map((v) => fixed(v, 2)).join(',  ') +
        ']',
      54,
      408,
      23,
      wrong ? C.red : C.teal,
    );
  }
}
export function work(c, k) {
  const b = k.beat.beatIndex,
    w = generationWork(3, 3);
  heading(
    c,
    b < 5 ? 'What work does reuse save?' : 'How many positions share a weight load?',
    b < 5 ? 'Dense score-cell accounting' : 'Decode bandwidth',
  );
  if (b < 5) {
    const cached = cue(k, 1, 'With caching') > 0;
    tag(c, 'Call length', 49, 170);
    tag(c, 'Full prefix', 49, 258);
    tag(c, 'With cache', 49, 391);
    w.lengths.forEach((len, i) => {
      const x = 248 + i * 174;
      type(c, String(len), x + 37, 168, 25, C.ink, { align: 'center' });
      const grid = (n, m, y, col) => {
        for (let r = 0; r < n; r++)
          for (let j = 0; j < m; j++) rect(c, x + j * 18, y + r * 18, 16, 16, col);
      };
      grid(len, len, 204, C.blue);
      if (cached) grid(i === 0 ? len : 1, len, 337, C.teal);
    });
    type(c, 'Σ L = ' + w.uncachedPositions, 773, 222, 21, C.blue);
    if (b >= 1) type(c, w.uncachedCells + ' cells', 773, 258, 23, C.blue);
    if (cached) {
      type(c, w.cachedPositions + ' positions', 773, 358, 20, C.teal);
      if (b >= 2) type(c, w.cachedCells + ' cells', 773, 394, 22, C.teal);
    }
    type(
      c,
      'Each square is one query–key score. The prefill grid includes masked cells.',
      51,
      469,
      21,
    );
  } else {
    token(c, 'W', 80, 227, 120, { size: 38, h: 68, fill: C.sand });
    const many = b === 6;
    for (let i = 0; i < (many ? 4 : 1); i++) {
      const y = many ? 174 + i * 68 : 257;
      arrow(c, 211, 260, 411, y + 20, C.teal);
      token(c, 'new position', 421, y, 196, { h: 42, size: 23, fill: C.mint });
    }
    big(c, many ? 'Batch of four' : 'Batch of one', 663, 217, 28);
    type(c, '2 bytes per weight', 663, 279, 20);
    type(c, many ? 'One load, four uses' : '1 multiply + 1 add', 663, 329, 20, C.teal);
    type(c, 'Keys and values add reads. Measure latency and tokens per second.', 51, 468, 22);
  }
}
export function storage(c, k) {
  const b = k.beat.beatIndex,
    large = cue(k, 1, 'Sixteen times the positions') > 0.4,
    more = cue(k, 2, 'At thirty-two requests') > 0.4;
  const req = more ? 32 : 4,
    len = large ? 32768 : 2048,
    gib = gqaGiB(req, len, 8);
  heading(c, 'What is resident in memory?', 'Raw key and value payload');
  tag(c, 'One request, one position', 54, 158);
  for (let i = 0; i < 2; i++) {
    const x = 59 + i * 219;
    big(c, i ? 'V' : 'K', x, 212, 32, i ? C.teal : C.blue);
    for (let z = 4; z >= 0; z--) {
      const xx = x + z * 3,
        yy = 264 - z * 5;
      rect(c, xx, yy, 173, 92, i ? C.mint : '#c6dbe0', C.muted);
      if (!z)
        for (let j = 1; j < 8; j++) line(c, xx, yy + j * 11.5, xx + 173, yy + j * 11.5, C.muted);
    }
  }
  type(c, '32 layers × 8 stored heads × 128 values', 54, 397, 20);
  line(c, 510, 164, 510, 432);
  type(c, 'Positions / request', 552, 195, 19, C.muted);
  type(c, len.toLocaleString('en-US'), 881, 195, 27, C.ink, { align: 'right' });
  type(c, 'Requests', 552, 255, 19, C.muted);
  type(c, String(req), 881, 255, 27, C.ink, { align: 'right' });
  type(c, 'Bytes / value', 552, 315, 19, C.muted);
  type(c, '2', 881, 315, 27, C.ink, { align: 'right' });
  if (b >= 1) {
    big(c, gib + ' GiB', 541, 392, 37, C.teal);
    for (let j = 0; j < 128; j++) {
      const xx = 725 + (j % 16) * 11,
        yy = 344 + Math.floor(j / 16) * 11;
      rect(c, xx, yy, 9, 9, j < gib ? C.teal : C.faint);
    }
    type(c, '1 square = 1 GiB', 726, 444, 16, C.muted);
  }
  if (b >= 2) type(c, 'Unequal lengths: sum processed positions across requests.', 53, 471, 22);
}
export function paging(c, k) {
  const b = k.beat.beatIndex;
  heading(
    c,
    b < 2
      ? 'How many heads store keys and values?'
      : b < 6
        ? 'Round each request to its own pages'
        : 'What fits in the same KV budget?',
    'Grouped heads and physical pages',
  );
  if (b < 2) {
    for (let j = 0; j < 8; j++) {
      const x = 54 + j * 108;
      for (let h = 0; h < 4; h++) {
        const xx = x + 12 + h * 22;
        dot(c, xx, 227, 7, C.blue);
        line(c, xx, 242, x + 45, 305, C.muted);
      }
      rect(c, x + 9, 313, 74, 26, C.teal);
      rect(c, x + 9, 344, 74, 26, C.blue);
    }
    tag(c, '32 query heads', 55, 178);
    type(c, '8 K / V groups', 54, 412, 24, C.teal);
    type(c, 'At equal width and length, 8 / 32 = ¼ of the raw payload.', 250, 412, 23);
  } else if (b < 6) {
    const lengths = [3, 7],
      cap = 4;
    lengths.forEach((len, i) => {
      const y = 202 + i * 121;
      tag(c, 'Request ' + (i + 1), 54, y + 27);
      for (let pg = 0; pg < Math.ceil(len / cap); pg++) {
        const x = 233 + pg * 309;
        rect(c, x - 6, y - 7, 272, 65, null, C.ink, 2);
        for (let j = 0; j < cap; j++) {
          const empty = pg * cap + j >= len;
          rect(c, x + j * 66, y, 61, 50, empty ? C.faint : i ? C.sand : C.mint);
          if (empty) hatching(c, x + j * 66, y, 61, 50);
          else
            type(c, String(pg * cap + j), x + j * 66 + 30, y + 25, 20, C.ink, { align: 'center' });
        }
        type(c, 'physical block ' + (i ? [7, 3][pg] : 1), x, y + 71, 17, C.muted);
      }
    });
    const { used, reserved, rawKiB, reservedKiB } = pageBudget(lengths, cap, 2048);
    if (b >= 4) {
      const usedPriced = cue(k, 5, 'twenty kibibytes', 0);
      const reservedPriced = cue(k, 5, 'twenty-four kibibytes', 0);
      type(
        c,
        usedPriced
          ? rawKiB + ' KiB useful' + (reservedPriced ? '     ' + reservedKiB + ' KiB allocated' : '')
          : '2 KiB per position. Count the real positions, then the reserved slots.',
        54,
        417,
        23,
        C.teal,
      );
    } else
      type(
        c,
        used + ' used slots / ' + reserved + ' allocated  ·  two separate tails',
        54,
        417,
        23,
        C.teal,
      );
  } else {
    const budget = 16,
      heads = 4,
      raw = gqaGiB(4, 32768, heads),
      per = raw / 4;
    tag(c, '16 GiB raw KV budget  ·  32,768 positions per request', 55, 171);
    [8, 4].forEach((n, i) => {
      const y = 212 + i * 110,
        perReq = gqaGiB(1, 32768, n),
        num = Math.floor(budget / perReq);
      type(c, n + ' KV heads', 55, y + 31, 23, C.ink);
      rail(
        c,
        240,
        y,
        647,
        59,
        Array.from({ length: num }, (_, j) => [String(j + 1), 1 / num]),
        i ? [C.teal, '#3b665c'] : [C.blue, '#466f80'],
      );
    });
    type(
      c,
      'At ' +
        per +
        ' GiB per request, ' +
        budget +
        ' GiB holds ' +
        Math.floor(budget / per) +
        ' requests before other limits.',
      55,
      413,
      23,
      C.teal,
    );
  }
}
export function windowBudget(c, k) {
  const b = k.beat.beatIndex;
  heading(
    c,
    b
      ? 'What remains when a cache entry is dropped?'
      : 'Does the prompt leave room for its output?',
    'Context and retention policy',
  );
  if (!b) {
    const cut = cue(k, 0, 'Watch the shortened prompt') > 0.5,
      n = cut ? 24 : 25,
      step = 25;
    big(c, n + ' prompt tokens', 50, 191, 32);
    big(c, '8 reserved', 625, 191, 32, C.teal);
    for (let j = 0; j < n + 8; j++)
      rect(c, 52 + j * step, 255, 22, 66, j < n ? C.blue : j >= 32 ? C.red : C.teal);
    line(c, 52 + 32 * step - 2, 233, 52 + 32 * step - 2, 358, C.red, 3);
    type(c, '32-position limit', 52 + 32 * step, 385, 20, C.red, { align: 'right' });
    type(
      c,
      n + ' + 8 = ' + (n + 8) + (cut ? '   ·   fits' : '   ·   one over'),
      53,
      460,
      29,
      cut ? C.teal : C.red,
    );
  } else {
    const drop = cue(k, 1, 'deleting old cached entries') > 0.4;
    tag(c, 'Resident entries', 54, 175);
    ['The', 'cat', 'slept'].forEach((w, i) =>
      cacheCell(c, 54 + 225 * i, 219, 200, !drop || i ? w : null),
    );
    if (drop) {
      arrow(c, 141, 287, 348, 355, C.red);
      type(c, 'h(cat) still reflects “The”.', 275, 397, 23, C.red);
      if (b === 2)
        type(c, 'A fresh pass on “cat slept” recomputes both positions.', 54, 471, 23, C.teal);
    }
  }
}
export function evidence(c, k) {
  const b = k.beat.beatIndex;
  heading(
    c,
    b < 4 ? 'Would you publish “unlimited”?' : 'Would a constant answer pass this test?',
    b < 4 ? 'Checking a rate-limit claim' : 'A counterfactual program',
  );
  if (b < 4) {
    tag(c, 'Model completion', 55, 175);
    big(c, 'unlimited', 54, 235, 43, C.blue);
    rail(
      c,
      55,
      293,
      367,
      43,
      [
        ['75%', 0.75],
        ['', 0.25],
      ],
      [C.blue, C.faint],
    );
    line(c, 471, 162, 471, 422);
    const read = cue(k, 1, 'Version two says') === 1,
      trace = cue(k, 2, 'retriever supplied version one') > 0.2;
    tag(c, 'Current policy', 508, 176);
    if (read) {
      big(c, '60 requests / min', 506, 243, 36, C.teal);
      type(c, 'Free tier   ·   version 2', 509, 305, 21);
    } else {
      rect(c, 509, 214, 358, 103, C.faint);
      hatching(c, 509, 214, 358, 103);
      type(c, '?', 685, 268, 37, C.ink, { align: 'center' });
    }
    if (trace) {
      line(c, 55, 386, 904, 386);
      tag(c, 'Application trace', 55, 430);
      type(c, 'retrieval → version 1 → prompt', 294, 430, 25, C.red, { face: 'Mono' });
    }
  } else {
    const change = b >= 5,
      first = cue(k, 4, 'Python prints two') === 1,
      second = cue(k, 6, 'nine', 0);
    for (const [i, [initial, op, amt]] of [
      [3, '−', 1],
      [7, '+', 2],
    ].entries()) {
      if (i && !change) continue;
      const x = 52 + i * 459;
      tag(c, i ? 'Changed input and operation' : 'Original program', x, 170);
      const lines = [
        'retries = ' + initial,
        'retries ' + (op === '−' ? '-' : '+') + '= ' + amt,
        'print(retries)',
      ];
      lines.forEach((s, j) =>
        type(c, s, x, 223 + j * 45, 24, i ? C.blue : C.ink, { face: 'Mono' }),
      );
      line(c, x, 345, x + 380, 345);
      const result = op === '−' ? initial - amt : initial + amt,
        shown = i ? second : first;
      type(c, 'Python prints', x, 385, 21, C.muted);
      big(c, shown ? String(result) : '?', x + 277, 384, 31, C.teal);
      if (shown) type(c, 'Model completion   ' + (i ? '?' : '2'), x, 446, 21, i ? C.red : C.blue);
    }
  }
}
export function dogPractice(c, k) {
  const b = k.beat.beatIndex;
  const generate = b === 2 && k.reveal('Generate from the same prefix', 0);
  heading(
    c,
    generate ? 'Which token has the largest share?' : 'What does the dog position predict?',
    'Independent practice',
  );
  tag(c, 'Record', 54, 163);
  big(c, 'The dog slept', 54, 207, 38);
  animal(c, 772, 143, 0.86, 'dog');
  if (generate) {
    const prompt = 'The dog';
    const first = greedyToken(prompt);
    const appended = k.reveal('Ate wins', 0);
    const fedBack = k.reveal('becomes the next input', 0, { captionStart: false });
    const ended = k.reveal('end choice', 0, { captionStart: 'following end choice' });
    const prefix = fedBack ? prompt + ' ' + first : prompt;
    tag(c, 'Greedy rollout', 55, 278);
    big(c, prompt, 55, 332, 38);
    token(c, appended ? first : '', 220, 301, 114, {
      h: 58, size: 38, fill: appended ? C.blue : C.cream, color: C.cream,
    });
    if (fedBack) {
      token(c, ended ? '[' + greedyToken(prefix) + ']' : '', 354, 301, 114, {
        h: 58, size: 32, fill: ended ? C.blue : C.cream, color: C.cream,
      });
    }
    type(c, 'Next-token probabilities after “' + prefix + '”', 55, 397, 25, C.muted);
    rail(
      c,
      55,
      424,
      849,
      46,
      rows[prefix].map(([word, v]) => [word + '  ' + pct(v), v]),
      undefined,
      23,
    );
  } else {
    const answer = b >= 2 || (b === 1 && k.reveal('slept. Read start', 0, { captionStart: 'At dog' }));
    const readable = cue(k, 1, 'Read start', 0);
    const showShare = b >= 2 || (b === 1 && k.reveal('thirty percent', 0, { captionStart: false }));
    const loss = b >= 2 || (b === 1 && k.reveal('one point two nats', 0, { captionStart: false }));
    const recorded = ['start', 'The', 'dog', 'slept'];
    row(c, recorded, 54, 257, 192, 27, [
      {},
      {},
      { fill: C.sand },
      { fill: answer ? C.faint : C.cream },
    ]);
    if (answer) {
      hatching(c, 711, 317, 192, 9);
      if (readable) bracket(c, 54, 327, 630, 'allowed prefix');
      arrow(c, 589, 367, 589, 386);
      token(c, 'slept', 492, 397, 192, { fill: C.mint, h: 43 });
      if (showShare) {
        const p = rows['The dog'].find(([word]) => word === 'slept')[1];
        const label = loss ? '−ln(' + p.toFixed(2) + ') ≈ ' + fixed(-Math.log(p), 3) + ' nats' : pct(p);
        type(c, label, 492, 474, 22, C.teal);
      }
    } else {
      tag(c, 'Target at dog', 491, 377);
      token(c, '?', 492, 402, 192, { h: 49 });
    }
  }
}
// Three impressions from the approved short's woodland printing block.
const woodcuts = await loadImage(fileURLToPath(new URL('./fox-woodcuts.png', import.meta.url)));
function forest(c, x, y, w, h, pose) {
  const panel = ['stand', 'runs', 'waits'].indexOf(pose);
  c.drawImage(woodcuts, 480 * panel, 0, 480, 210, x, y, w, h);
}
export function fox(c, k) {
  const b = k.beat.beatIndex,
    rerun = b >= 4;
  const run = rerun ? foxRetry : foxRun;
  const choose = rerun ? cue(k, 4, 'sample picks waits') : cue(k, 2, 'sample picks runs');
  const feed = rerun ? cue(k, 4, 'Feed waits back') : cue(k, 2, 'Feed runs back');
  const end = rerun ? cue(k, 4, 'sample picks here') : cue(k, 2, 'sample picks end');
  const sealed = cue(k, 3, 'It occupies one eighth') === 1;
  const reason = rerun ? cue(k, 5, 'Report an output limit') > 0 : end === 1;
  heading(c, 'Where does this fox stop?', 'Two output slots  ·  five positions in the window');
  forest(c, 45, 149, 215, 94, choose ? run.output[0] : 'stand');
  const x = 271,
    step = 125,
    tokens = ['A', 'red', 'fox', choose ? run.output[0] : '', end ? run.output[1] : ''];
  tag(c, 'Prompt', x, 156);
  tag(c, 'Selected output', x + 3 * step, 156);
  tokens.forEach((word, i) =>
    token(c, word, x + i * step, 182, 115, { h: 49, size: 24, fill: i < 3 ? C.cream : C.sand }),
  );
  const recordWidth = 800,
    left = 56,
    split = rows['A red fox'][0][1],
    y = 306;
  tag(c, 'Recorded path   ·   runs, end', left, 273);
  rail(
    c,
    left,
    y,
    recordWidth,
    31,
    [
      ['runs   ¼', split],
      ['waits   ¾', 1 - split],
    ],
    [C.blue, '#646e68'],
    16,
  );
  if (b >= 1) {
    let saidEqualShares = b > 1;
    if (b === 1) {
      const phrase = 'divide that quarter equally';
      const { start, end } = k.wordCue(phrase);
      saidEqualShares = k.reveal(phrase, end - start, { captionStart: false }) === 1;
    }
    const sw = recordWidth * split;
    line(c, left, 337, left, 354, C.blue);
    line(c, left + sw, 337, left + sw, 354, C.blue);
    if (!sealed) {
      rect(c, left, 354, sw, 31, C.blue);
      if (feed) {
        rail(
          c,
          left,
          354,
          sw,
          31,
          [
            ['½ end', foxFactors[1]],
            ['½ on', 1 - foxFactors[1]],
          ],
          [C.blue, '#4f7c89'],
          16,
        );
      } else {
        const label = saidEqualShares ? 'end ½  ·  on ½' : 'end or on?';
        type(c, label, left + sw / 2, 369, saidEqualShares ? 20 : 16, C.cream, { align: 'center' });
      }
    } else
      rail(
        c,
        left,
        354,
        sw,
        31,
        [
          ['end', foxFactors[1]],
          ['on', 1 - foxFactors[1]],
        ],
        [C.red, C.blue],
        17,
      );
    if (sealed) {
      bracket(c, left, 391, recordWidth * foxPath, '1/8', C.red);
      if (rerun && feed) {
        const waitRow = rows['A red fox waits'];
        rail(
          c,
          left + sw,
          354,
          recordWidth - sw,
          31,
          waitRow.map(([t, p]) => [t + '   ' + pct(p), p]),
          [C.teal, C.plum],
          16,
        );
        line(c, left + recordWidth, 337, left + recordWidth, 354, C.muted);
        line(c, left + sw, 354, left + sw, 385, C.paper, 2);
        if (end) bracket(c, left + sw, 391, (recordWidth - sw) * waitRow[0][1], 'waits → here', C.teal);
      } else {
        type(
          c,
          cue(k, 3, 'Raising e to this mean') === 1
            ? 'exp(−ln(1/8) / 2)  ≈  ' + fixed(ppl(foxFactors), 3)
            : 'P(record) = 1/4 × 1/2 = 1/8',
          left + 257,
          370,
          22,
          C.teal,
          { face: 'Mono' },
        );
      }
    }
  }
  if (b >= 2) {
    const processed = run.processed.slice(0, feed ? 4 : 3);
    tag(c, 'Cached', x, 249);
    type(c, processed.join('  ·  '), x + 92, 249, 22, C.blue, { face: 'Serif' });
    if (reason)
      type(c, run.stop, 889, 249, 24, rerun ? C.red : C.teal, { align: 'right', weight: 700 });
  }
}
