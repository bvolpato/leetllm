import assert from 'node:assert/strict';
const CORPUS = [
  ['rain', 3],
  ['rainy', 2],
  ['rail', 2],
];
/** One round of byte pair encoding: count weighted pairs, and merge the first of the most frequent. */
function trainMerges(corpus, rounds) {
  let words = corpus.map(([word, count]) => ({
    count,
    pieces: [...word],
  }));
  const positions = (words2) =>
    words2.reduce((sum, word) => sum + word.count * word.pieces.length, 0);
  const history = [
    {
      words,
      positions: positions(words),
    },
  ];
  for (let round = 0; round < rounds; round++) {
    const counts = new Map();
    for (const word of words)
      for (let i = 0; i + 1 < word.pieces.length; i++) {
        const pair = `${word.pieces[i]} ${word.pieces[i + 1]}`;
        counts.set(pair, (counts.get(pair) ?? 0) + word.count);
      }
    const ranked = [...counts]
      .map(([pair, count], order) => ({
        pair,
        count,
        order,
      }))
      .sort((a, b) => b.count - a.count || a.order - b.order);
    const [left, right] = ranked[0].pair.split(' ');
    words = words.map((word) => {
      const pieces = [];
      for (let i = 0; i < word.pieces.length; i++) {
        if (word.pieces[i] === left && word.pieces[i + 1] === right) {
          pieces.push(left + right);
          i++;
        } else pieces.push(word.pieces[i]);
      }
      return {
        ...word,
        pieces,
      };
    });
    history.push({
      words,
      positions: positions(words),
      merged: {
        left,
        right,
        count: ranked[0].count,
      },
      ranked,
    });
  }
  return history;
}
/** Encoding replays a fixed list of merges, in order, and counts nothing. */
function applyRules(word, rules) {
  let pieces = [...word];
  for (const [left, right] of rules) {
    const next = [];
    for (let i = 0; i < pieces.length; i++) {
      if (pieces[i] === left && pieces[i + 1] === right) {
        next.push(left + right);
        i++;
      } else next.push(pieces[i]);
    }
    pieces = next;
  }
  return pieces;
}
/** BERT-style greedy longest match, with every attempt it makes. It never backtracks. */
function wordpiece(word, vocabulary) {
  const attempts = [],
    pieces = [];
  let start = 0;
  while (start < word.length) {
    let chosen = null;
    for (let end = word.length; end > start; end--) {
      const candidate = (start ? '##' : '') + word.slice(start, end);
      const found = vocabulary.includes(candidate);
      attempts.push({
        candidate,
        found,
        start,
        end,
      });
      if (found) {
        chosen = candidate;
        start = end;
        break;
      }
    }
    if (!chosen)
      return {
        attempts,
        pieces: ['[UNK]'],
        stuckAt: start,
      };
    pieces.push(chosen);
  }
  return {
    attempts,
    pieces,
  };
}
const close = (a, b, tolerance = 1e-9) => assert(Math.abs(a - b) < tolerance, `${a} is not ${b}`);
const HISTORY = trainMerges(CORPUS, 3);
assert.deepEqual(
  HISTORY.map((step) => step.positions),
  [30, 23, 16, 11],
);
assert.deepEqual(
  HISTORY.slice(1).map((step) => [step.merged.left + step.merged.right, step.merged.count]),
  [
    ['ra', 7],
    ['rai', 7],
    ['rain', 5],
  ],
);
assert.deepEqual(
  HISTORY[3].words.map((word) => word.pieces),
  [['rain'], ['rain', 'y'], ['rai', 'l']],
);
const RULES = HISTORY.slice(1).map((step) => [step.merged.left, step.merged.right]);
const ALPHABET = [...new Set(CORPUS.map(([word]) => word).join(''))];
assert.equal(ALPHABET.length, 6);
assert(!ALPHABET.includes('b'));
assert.deepEqual(applyRules('rainly', RULES), ['rain', 'l', 'y']);
assert.deepEqual(applyRules('rainy', RULES), ['rain', 'y']);
assert.deepEqual(applyRules('rail', RULES), ['rai', 'l']);
// An earlier merge can use up a letter that a later rule needs.
const ORDER_A = applyRules('rain', [
    ['r', 'a'],
    ['a', 'i'],
  ]),
  ORDER_B = applyRules('rain', [
    ['a', 'i'],
    ['r', 'a'],
  ]);
assert.deepEqual(ORDER_A, ['ra', 'i', 'n']);
assert.deepEqual(ORDER_B, ['r', 'ai', 'n']);
// Cutting a string in two can block a merge.
const WHOLE = applyRules('rain', RULES),
  CHUNKS = [applyRules('ra', RULES), applyRules('in', RULES)];
assert.equal(WHOLE.length, 1);
assert.equal(CHUNKS.flat().length, 3);
// The same synthetic table as the chapter's figure. IDs index rows, and values are invented.
const TABLE = [
  [0.1, 0.3, 0.5],
  [0.2, -0.4, 0.9],
  [0.8, 0.1, -0.2],
  [-0.5, 0.3, 0.4],
  [0.4, 0.5, 0.6],
  [-0.3, 0.7, 0.2],
  [0.6, 0.2, -0.1],
  [0.9, -0.2, 0.3],
];
const PIECES = [
  ['rain', 2, 'blue'],
  ['·falls', 5, 'teal'],
  ['·soft', 1, 'purple'],
  ['ly', 6, 'orange'],
];
const SENTENCE = 'rain falls softly';
assert.equal(SENTENCE.length, 17);
assert.equal(PIECES.map(([piece]) => piece.replaceAll('·', ' ')).join(''), SENTENCE);
const MASKED = (17 * 18) / 2;
assert.equal(MASKED, 153);
// Spans from a regular expression, and the classes that color them.
const SPAN_TEXT = 'failed 404 times!';
const SPAN_PATTERN = [
  ['\\p{L}+', 'blue'],
  ['\\p{N}+', 'yellow'],
  ['\\s+', 'dim'],
  ['[^\\s]', 'pink'],
];
const SPANS = SPAN_TEXT.match(new RegExp(SPAN_PATTERN.map(([source]) => source).join('|'), 'gu'));
assert.deepEqual(SPANS, ['failed', ' ', '404', ' ', 'times', '!']);
const spanClass = (span) =>
  /\p{L}/u.test(span) ? 'blue' : /\p{N}/u.test(span) ? 'yellow' : /\s/u.test(span) ? 'dim' : 'pink';
// Three characters written as UTF-8 bytes, and what decoding each byte alone gives.
const BYTE_TEXT = '関数✨';
const BYTE_CHARS = [...BYTE_TEXT].map((ch) => ({
  ch,
  bytes: [...new TextEncoder().encode(ch)],
}));
assert.equal(BYTE_CHARS.length, 3);
assert.deepEqual(
  BYTE_CHARS.map((entry) => entry.bytes.length),
  [3, 3, 3],
);
const BYTES = BYTE_CHARS.flatMap((entry) => entry.bytes);
assert.equal(BYTES.length, 9);
assert.equal(new TextDecoder().decode(Uint8Array.from(BYTES)), BYTE_TEXT);
assert(BYTES.every((value) => new TextDecoder().decode(Uint8Array.of(value)) === '�'));
const hex = (value) => value.toString(16).toUpperCase().padStart(2, '0');
// The teaching proxy for WordPiece. These counts are made up, as the narration says.
const proxy = (pair, a, b) => pair / (a * b);
const TH = {
  name: 't + ##h',
  pair: 90,
  a: 900,
  b: 300,
  score: proxy(90, 900, 300),
};
const BOW = {
  name: 'rain + ##bow',
  pair: 42,
  a: 50,
  b: 44,
  score: proxy(42, 50, 44),
};
close(TH.score, 0.000333, 1e-5);
close(BOW.score, 0.01909, 1e-4);
const PROXY_RATIO = BOW.score / TH.score;
assert(PROXY_RATIO > 50);
const FIRST_VOCAB = ['rain', '##bow'],
  TRAP_VOCAB = ['rain', '##bow', 'rainb'];
const FIRST_PASS = wordpiece('rainbow', FIRST_VOCAB),
  TRAP_PASS = wordpiece('rainbow', TRAP_VOCAB);
assert.deepEqual(FIRST_PASS.pieces, ['rain', '##bow']);
assert.deepEqual(
  FIRST_PASS.attempts.slice(0, 4).map((entry) => [entry.candidate, entry.found]),
  [
    ['rainbow', false],
    ['rainbo', false],
    ['rainb', false],
    ['rain', true],
  ],
);
assert.deepEqual(TRAP_PASS.pieces, ['[UNK]']);
assert.deepEqual(
  TRAP_PASS.attempts.slice(0, 3).map((entry) => entry.candidate),
  ['rainbow', 'rainbo', 'rainb'],
);
assert.deepEqual(
  TRAP_PASS.attempts.slice(3).map((entry) => entry.candidate),
  ['##ow', '##o'],
);
// The Unigram lattice, with probabilities made up for the example.
const P = {
  whole: 0.3,
  marker: 0.15,
  rain: 0.1,
  ra: 0.02,
  in: 0.03,
};
const PATHS = [P.whole, P.marker * P.rain, P.marker * P.ra * P.in];
close(PATHS[1], 0.015);
close(PATHS[2], 0.00009);
assert(PATHS[0] > PATHS[1]);
const LOWERED = 0.01;
assert(PATHS[1] > LOWERED);
const logOf = (value) => Math.log(value).toFixed(2);
close(PATHS[0] / PATHS[1], 20);
close(Math.log(PATHS[0] / PATHS[1]), 3, 0.01);
// Viterbi keeps the best score reaching each boundary. This is the lowered lattice.
const BEST = [
  1,
  P.marker,
  P.marker * P.ra,
  Math.max(LOWERED, P.marker * P.rain, P.marker * P.ra * P.in),
];
close(BEST[3], 0.015);
// Vocabulary weights: rows, times hidden size, times bytes per number, times two tables.
const mebibytes = (rows) => (rows * 4096 * 2 * 2) / 1024 ** 2;
assert.equal(mebibytes(32_000), 500);
assert.equal(mebibytes(128_000), 2000);
assert.equal(mebibytes(1_000_000), 15625);
assert.equal(1_000_000 * 4096 * 2 * 2, 16_384_000_000);
const dropOf = (before, after) => 1 - before / after;
close(dropOf(3, 4), 0.25);
close(4 / 3 - 1, 1 / 3);
close(dropOf(3.17, 3.94), 0.195, 0.001);
close(1 - (3.17 / 3.94) ** 2, 0.353, 0.001);
// Normalization, computed by the same Unicode forms the narration names.
const COMPOSED = 'café',
  DECOMPOSED = 'café';
assert.equal([...COMPOSED].length, 4);
assert.equal([...DECOMPOSED].length, 5);
assert.notEqual(COMPOSED, DECOMPOSED);
assert.equal(DECOMPOSED.normalize('NFC'), COMPOSED);
assert.equal(DECOMPOSED.normalize('NFKC'), COMPOSED);
const LIGATURE = 'ﬁle';
assert.equal(LIGATURE.normalize('NFC'), LIGATURE);
assert.equal(LIGATURE.normalize('NFKC'), 'file');
const codePoint = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
// Two tokenizers with the same vocabulary size. B swaps the IDs of ·falls and ·soft.
const IDS_A = {
    rain: 2,
    '·falls': 5,
    '·soft': 1,
    ly: 6,
  },
  IDS_B = {
    ...IDS_A,
    '·falls': 1,
    '·soft': 5,
  };
assert.equal(Object.keys(IDS_A).length, Object.keys(IDS_B).length);
// Numbers: the two pre-tokenizer rules are computed. The learned cuts are made up, and labeled so.
const NUMBER = '1234567';
const DIGITS = NUMBER.match(/\d/g),
  GROUPS = NUMBER.match(/\d{1,3}/g);
assert.equal(DIGITS.length, 7);
assert.deepEqual(GROUPS, ['123', '456', '7']);
assert.equal(4 * 4, 16);
assert.equal(16 / 4, 4);
close(1 - 4 / 16, 0.75);
const CAMEL = ['token', 'C', 'o', 'un', 't'];
assert.equal(CAMEL.join(''), 'tokenCount');
const RAINY_POSITIONS = applyRules('rainy', RULES).length,
  WINDOW = 7,
  ADDED = 6;
assert.equal(RAINY_POSITIONS, 2);
assert.equal(RAINY_POSITIONS + ADDED, WINDOW + 1);
const SNOW = trainMerges(
  [
    ['snow', 4],
    ['snowy', 2],
    ['show', 3],
  ],
  1,
);
assert.equal(SNOW[0].positions, 38);
assert.equal(SNOW[1].positions, 29);
assert.deepEqual([SNOW[1].merged.left, SNOW[1].merged.right, SNOW[1].merged.count], ['o', 'w', 9]);
assert(SNOW[1].ranked[1].count < 9);
assert.deepEqual(wordpiece('snowball', ['snow', '##ball', 'snowb']).pieces, ['[UNK]']);
close(0.25 * 0.4, 0.1);
assert(0.25 * 0.4 > 0.05);
// The pruning wall and the lattice share one toy model. The probabilities are made up, and the
// loss is computed on a small made-up corpus, so the order of removal follows from the numbers.
const PRUNE_WORDS = ['▁rain', '▁falls', '▁softly'];
const CANDIDATES = (() => {
  const seen = new Set();
  for (const word of PRUNE_WORDS)
    for (let length = 1; length <= word.length; length++)
      for (let i = 0; i + length <= word.length; i++) seen.add(word.slice(i, i + length));
  return [...[...seen].sort((a, b) => a.length - b.length).slice(0, 40), '▁rain'];
})();
assert.equal(CANDIDATES.length, 41);
assert(
  CANDIDATES.includes('rain') &&
    CANDIDATES.includes('ra') &&
    CANDIDATES.includes('in') &&
    CANDIDATES.includes('▁'),
);
const LATTICE_PROBS = {
  '▁rain': P.whole,
  '▁': P.marker,
  rain: P.rain,
  ra: P.ra,
  in: P.in,
};
const toyProbability = (piece) =>
  LATTICE_PROBS[piece] ?? (piece.length === 1 ? 0.01 : 0.02 / 2 ** (piece.length - 1));
/** The best score over all complete paths through a word, using only the pieces in vocabulary. */
const bestPath = (word, vocabulary) => {
  const best = [1, ...new Array(word.length).fill(0)];
  for (let end = 1; end <= word.length; end++)
    for (let start = 0; start < end; start++) {
      const piece = word.slice(start, end);
      if (vocabulary.has(piece))
        best[end] = Math.max(best[end], best[start] * toyProbability(piece));
    }
  return best[word.length];
};
const WHOLE_VOCABULARY = new Set(CANDIDATES);
const without = (vocabulary, piece) => new Set([...vocabulary].filter((item) => item !== piece));
close(bestPath('▁rain', WHOLE_VOCABULARY), P.whole);
close(bestPath('▁rain', without(WHOLE_VOCABULARY, 'in')), P.whole);
close(bestPath('▁rain', without(WHOLE_VOCABULARY, '▁rain')), PATHS[1]);
const TOY_CORPUS = [
  ['▁rain', 3],
  ['▁falls', 1],
  ['▁softly', 1],
  ['▁train', 1],
];
const lossOf = (piece, vocabulary) =>
  TOY_CORPUS.reduce(
    (sum, [word, times]) =>
      sum +
      times *
        (Math.log(bestPath(word, vocabulary)) -
          Math.log(bestPath(word, without(vocabulary, piece)))),
    0,
  );
const PRUNE_ROUNDS = (() => {
  const rounds = [];
  let kept = WHOLE_VOCABULARY;
  while (kept.size > 21) {
    const goal = Math.round(kept.size * 0.8);
    // Array.sort is stable, so equal losses stay in list order, and that order breaks the ties.
    const ranked = [...kept]
      .filter((piece) => piece.length > 1)
      .map((piece) => ({
        piece,
        loss: lossOf(piece, kept),
      }))
      .sort((a, b) => a.loss - b.loss);
    const removed = ranked.slice(0, kept.size - goal),
      next = ranked[kept.size - goal];
    const gone = removed.map((entry) => entry.piece);
    kept = new Set([...kept].filter((piece) => !gone.includes(piece)));
    rounds.push({
      gone,
      size: kept.size,
      costs: removed.map((entry) => entry.loss),
      nextCost: next.loss,
    });
  }
  return rounds;
})();
assert.deepEqual(
  PRUNE_ROUNDS.map((round) => round.size),
  [33, 26, 21],
);
assert(PRUNE_ROUNDS[0].gone.includes('in'));
// The screen says that removed pieces cost 0 here, and that list order breaks the ties.
for (const round of PRUNE_ROUNDS) {
  assert(round.costs.every((cost) => cost === 0));
  assert.equal(round.nextCost, 0);
  assert.deepEqual(
    round.gone,
    CANDIDATES.filter((piece) => round.gone.includes(piece)),
  );
}
assert(lossOf('rain', new Set(CANDIDATES)) > 0);
const PRUNE_KEPT = new Set(
  CANDIDATES.filter((piece) => !PRUNE_ROUNDS.some((round) => round.gone.includes(piece))),
);
for (const piece of ['rain', '▁rain', '▁']) assert(PRUNE_KEPT.has(piece), piece);
for (const piece of CANDIDATES.filter((item) => item.length === 1))
  assert(PRUNE_KEPT.has(piece), piece);
close(bestPath('▁rain', PRUNE_KEPT), P.whole);
// Second number for the aligned columns. The learned cuts are made up, and labeled so.
const NUMBER_B = '1234568';
const LEARNED_CUTS = [
  ['12', '345', '67'],
  ['1234', '568'],
];
assert.equal(LEARNED_CUTS[0].join(''), NUMBER);
assert.equal(LEARNED_CUTS[1].join(''), NUMBER_B);
assert.deepEqual(NUMBER_B.match(/\d{1,3}/g), ['123', '456', '8']);
// The second identifier that lands on the same result under NFKC.
const SECOND_IDENTIFIER = 'file';
assert.notEqual(LIGATURE, SECOND_IDENTIFIER);
assert.equal(LIGATURE.normalize('NFKC'), SECOND_IDENTIFIER.normalize('NFKC'));
// Scoring against the output table. The vector is invented, and the screen says so.
const FINAL_VECTOR = [0.5, 0.2, 0.8];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const ROW_SCORES = TABLE.map((values) => dot(FINAL_VECTOR, values));
assert(ROW_SCORES.every((value) => value > 0));
assert.equal(ROW_SCORES.indexOf(Math.max(...ROW_SCORES)), 4);
// How much of each piece's count happens inside the pair. This is the idea behind the score.
const togetherShare = (entry) => [entry.pair / entry.a, entry.pair / entry.b];
assert(togetherShare(TH).every((share) => share < 0.5));
assert(togetherShare(BOW).every((share) => share > 0.8));
// Who adds the six extra positions in the toy request. All made up, as the voice says.
const REQUEST_SOURCES = [
  ['system', 3, 'teal'],
  ['role', 2, 'purple'],
  ['reply', 1, 'orange'],
];
assert.equal(
  REQUEST_SOURCES.reduce((sum, [, count]) => sum + count, 0),
  ADDED,
);
// Same content in a toy window, drawn to scale from the study's ratio.
const WINDOW_CELLS = 30,
  ENGLISH_CELLS = 2;
assert.equal(ENGLISH_CELLS * 15, WINDOW_CELLS);
export {
  CORPUS,
  trainMerges,
  applyRules,
  wordpiece,
  close,
  HISTORY,
  RULES,
  ALPHABET,
  ORDER_A,
  ORDER_B,
  WHOLE,
  CHUNKS,
  TABLE,
  PIECES,
  SENTENCE,
  MASKED,
  SPAN_TEXT,
  SPAN_PATTERN,
  SPANS,
  spanClass,
  BYTE_TEXT,
  BYTE_CHARS,
  BYTES,
  hex,
  proxy,
  TH,
  BOW,
  PROXY_RATIO,
  FIRST_VOCAB,
  TRAP_VOCAB,
  FIRST_PASS,
  TRAP_PASS,
  P,
  PATHS,
  LOWERED,
  logOf,
  BEST,
  mebibytes,
  dropOf,
  COMPOSED,
  DECOMPOSED,
  LIGATURE,
  codePoint,
  IDS_A,
  IDS_B,
  NUMBER,
  DIGITS,
  GROUPS,
  CAMEL,
  RAINY_POSITIONS,
  WINDOW,
  ADDED,
  SNOW,
  PRUNE_WORDS,
  CANDIDATES,
  LATTICE_PROBS,
  toyProbability,
  bestPath,
  WHOLE_VOCABULARY,
  without,
  TOY_CORPUS,
  lossOf,
  PRUNE_ROUNDS,
  PRUNE_KEPT,
  NUMBER_B,
  LEARNED_CUTS,
  SECOND_IDENTIFIER,
  FINAL_VECTOR,
  dot,
  ROW_SCORES,
  togetherShare,
  REQUEST_SOURCES,
  WINDOW_CELLS,
  ENGLISH_CELLS,
};
