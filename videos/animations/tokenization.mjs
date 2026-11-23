import { layoutTokenRow } from 'vizmatic';
import assert from 'node:assert/strict';

const BPE_CORPUS = [
  ['play', 3],
  ['plays', 2],
  ['plot', 2],
];
const BPE_INPUT = 'plums';
const focusMark = (api, id, paint) => (api.focus ? api.focus.target(id, paint) : paint());
const spokenProgress = (api, id, fallback) =>
  api.focus ? api.focus.progress(id, fallback) : fallback;
const spokenReveal = (api, state, id, fallback, paint) =>
  state.cues?.[id] && api.focus ? api.focus.reveal(id, paint) : fallback ? paint() : undefined;
export function bpeRecountEvidence() {
  const rows = BPE_CORPUS.map(([word, frequency]) => ({
    word,
    frequency,
    tokens: mergePair([...word], 'p', 'l', 'pl'),
  }));
  return [
    ['pl', 'a'],
    ['a', 'y'],
  ].map(([left, right]) => {
    const contributions = rows.map(
      (row) =>
        row.frequency *
        row.tokens.slice(0, -1).filter((token, i) => token === left && row.tokens[i + 1] === right)
          .length,
    );
    return {
      left,
      right,
      contributions,
      total: contributions.reduce((sum, value) => sum + value, 0),
    };
  });
}

function adjacentPairCounts(rows) {
  const counts = new Map();
  for (const { tokens, frequency } of rows) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `${tokens[i]}\0${tokens[i + 1]}`;
      counts.set(pair, (counts.get(pair) ?? 0) + frequency);
    }
  }
  return counts;
}

function mergePair(tokens, left, right, merged) {
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === left && tokens[i + 1] === right) {
      result.push(merged);
      i++;
    } else result.push(tokens[i]);
  }
  return result;
}

function trainBpe(corpus, limit) {
  let rows = corpus.map(([word, frequency]) => ({ word, frequency, tokens: [...word] }));
  const merges = [];
  while (merges.length < limit) {
    const counts = adjacentPairCounts(rows);
    let selected,
      maximum = 0;
    for (const [pair, count] of counts) {
      if (count > maximum) {
        selected = pair;
        maximum = count;
      }
    }
    if (!selected) break;
    const [left, right] = selected.split('\0');
    const merged = left + right;
    rows = rows.map((row) => ({ ...row, tokens: mergePair(row.tokens, left, right, merged) }));
    merges.push({ left, right, merged, count: maximum });
  }
  return { rows, merges };
}

function encodeBpe(word, merges) {
  return merges.reduce(
    (tokens, { left, right, merged }) => mergePair(tokens, left, right, merged),
    [...word],
  );
}

const BPE_INITIAL_ROWS = BPE_CORPUS.map(([word, frequency]) => ({
  word,
  frequency,
  tokens: [...word],
}));
const BPE_INITIAL_PAIRS = adjacentPairCounts(BPE_INITIAL_ROWS);
const BPE_AFTER_FIRST_MERGE = trainBpe(BPE_CORPUS, 1);
const BPE_AFTER_FIRST_PAIRS = adjacentPairCounts(BPE_AFTER_FIRST_MERGE.rows);
const BPE_TRAINING = trainBpe(BPE_CORPUS, 3);
const BPE_OUTPUT = encodeBpe(BPE_INPUT, BPE_TRAINING.merges);
const EMBEDDING_BASE = [0.55, 0.84, 0.34, 0.68, 0.45, 0.9, 0.61, 0.39];

const UNIGRAM_CANDIDATES = [
  ['▁house', 'cyan'],
  ['▁', 'yellow'],
  ['house', 'green'],
  ['ho', 'blue'],
  ['use', 'pink'],
  ['▁ho', 'cyan'],
  ['hou', 'yellow', true],
  ['ous', 'pink', true],
];
const UNIGRAM_PATHS = [
  {
    y: 410,
    name: 'whole piece',
    words: ['▁house'],
    boundaries: [0, 6],
    widths: [210],
    probabilities: [0.3],
    color: 'green',
  },
  {
    y: 550,
    name: '▁ + house',
    words: ['▁', 'house'],
    boundaries: [0, 1, 6],
    widths: [80, 180],
    probabilities: [0.15, 0.1],
    color: 'blue',
  },
  {
    y: 690,
    name: '▁ + ho + use',
    words: ['▁', 'ho', 'use'],
    boundaries: [0, 1, 3, 6],
    widths: [80, 110, 150],
    probabilities: [0.15, 0.02, 0.03],
    color: 'pink',
  },
];
const unigramPathProbability = (path) =>
  Number(path.probabilities.reduce((probability, value) => probability * value, 1).toPrecision(12));
const formatUnigramPathProbability = (path) =>
  path.probabilities.length === 1
    ? path.probabilities[0].toFixed(2)
    : `${path.probabilities.map((value) => value.toFixed(2)).join('\\times')}=${unigramPathProbability(path)}`;

function directed(state, api, id, start, end) {
  const cue = state.cues?.[id];
  return cue ? api.ease(cue.progress) : step(api, state.beatP ?? 0, start, end);
}
export function remapExample(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const rows = [
    { piece: 'cat', oldId: 421, newId: 907, vector: [1, 0] },
    { piece: 'slept', oldId: 907, newId: 421, vector: [0, 1] },
  ];
  const stable = p === 0 || p === 1;
  const table = new Map(rows.map((row) => [p === 1 ? row.newId : row.oldId, row.vector]));
  const lookup = stable
    ? Object.fromEntries(rows.map((row) => [row.piece, table.get(row.newId)]))
    : null;
  const logits = lookup
    ? Object.fromEntries(
        rows.map((row) => [
          row.piece,
          lookup[row.piece].reduce((sum, v, i) => sum + v * [0.8, 0.2][i], 0),
        ]),
      )
    : null;
  return { progress: p, rows, complete: p === 1, lookup, logits };
}

export function unigramRemovalEvidence(piece) {
  const before = UNIGRAM_PATHS.reduce((sum, path) => sum + unigramPathProbability(path), 0);
  const after = UNIGRAM_PATHS.filter((path) => !path.words.includes(piece)).reduce(
    (sum, path) => sum + unigramPathProbability(path),
    0,
  );
  return { piece, before, after, lossIncrease: Math.log(before / after) };
}
export function sampleUnigram(draw) {
  assert(draw >= 0 && draw < 1);
  const total = UNIGRAM_PATHS.reduce((sum, path) => sum + unigramPathProbability(path), 0);
  let cumulative = 0;
  for (const path of UNIGRAM_PATHS) {
    cumulative += unigramPathProbability(path) / total;
    if (draw < cumulative) return path;
  }
  return UNIGRAM_PATHS.at(-1);
}
export function requestGroups() {
  return [
    { label: '<system>', count: 1, color: 'red' },
    { label: 'instructions', count: 3, color: 'pink' },
    { label: '<user>', count: 1, color: 'yellow' },
    { label: 'plays', count: 2, color: 'cyan', message: true },
    { label: '<assistant>', count: 1, color: 'green' },
  ];
}

const T = (
  ctx,
  api,
  value,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'center',
  font = 'sans',
  alpha = 1,
) => {
  ctx.save();
  ctx.globalAlpha *= alpha;
  api.text(ctx, String(value), x, y, size, color, align, font);
  ctx.restore();
};

const M = (ctx, api, tex, x, y, size = 46, color = api.C.ink, align = 'center') =>
  api.math(ctx, tex, x, y, size, color, align);

const panel = (ctx, api, x, y, w, h, stroke = api.C.blue, fill = api.C.panel, radius = 20) => {
  return api.components.panel({ x, y, width: w, height: h, fill, stroke, radius });
};

const chip = (ctx, api, value, x, y, w, h = 68, color = api.C.cyan, options = {}) => {
  const size = options.size ?? 32;
  return api.components.card({
    label: value,
    x,
    y,
    width: w,
    height: h,
    fill: options.fill ?? api.C.panel,
    stroke: color,
    radius: options.radius ?? 14,
    padding: 10,
    scope: 'label',
    fontSize: size,
    font: options.font ?? 'mono',
    textColor: options.ink ?? api.C.ink,
    baselineOffset: size * 0.34,
    opacity: options.alpha ?? 1,
  });
};

const line = (ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 4) =>
  api.line(ctx, x1, y1, x2, y2, color, width);
const arrow = (ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) =>
  api.arrow(ctx, x1, y1, x2, y2, color, width);
const circle = (ctx, api, x, y, r, fill, stroke) => api.circle(ctx, x, y, r, fill, stroke, 3);
const qbeat = (state, api) => api.ease(api.clamp(state.beatP ?? state.p ?? 0, 0, 1));
const alphaFrom = (p, start = 0.1, end = 0.72) =>
  Math.max(0, Math.min(1, (p - start) / (end - start)));

const step = (api, p, start, end) => api.ease(api.clamp((p - start) / (end - start), 0, 1));

function tokenLayout(groups, center, advance = 24, gap = 16) {
  return layoutTokenRow(groups, { centerX: center, advance, gap });
}

// Letters keep their identities while only the boundaries and spacing change.
function morphTokens(
  ctx,
  api,
  from,
  to,
  p,
  center,
  y,
  colors,
  { size = 36, height = 76, advance = 24, gap = 16, fromColors = colors } = {},
) {
  const a = tokenLayout(from, center, advance, gap),
    b = tokenLayout(to, center, advance, gap);
  const letters = (boxes) =>
    boxes.flatMap((box) =>
      [...box.text].map((char, i) => ({
        char,
        x: box.x + box.width / 2 + (i - (box.text.length - 1) / 2) * size * 0.602,
      })),
    );
  const first = letters(a),
    last = letters(b),
    move = step(api, p, 0.12, 0.82);
  const oldAlpha = 1 - step(api, p, 0, 0.2),
    newAlpha = step(api, p, 0.74, 1);
  const outline = (boxes, alpha, palette) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    boxes.forEach((box, i) =>
      api.rect(ctx, box.x, y, box.width, height, api.C.panel, palette[i % palette.length], 13),
    );
    ctx.restore();
  };
  outline(a, oldAlpha, fromColors);
  outline(b, newAlpha, colors);
  first.forEach((char, i) =>
    T(
      ctx,
      api,
      char.char,
      api.lerp(char.x, last[i].x, move),
      y + height / 2 + size * 0.34,
      size,
      api.C.ink,
      'center',
      'mono',
    ),
  );
  return b;
}

function travel(ctx, api, x1, y1, x2, y2, p, color, radius = 8) {
  if (p <= 0 || p >= 1) return;
  api.components.particle({
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
    progress: p,
    radius,
    fill: color,
  });
}

function unicodeChip(ctx, api, symbol, x, y, w, h, color, alpha = 1) {
  if (symbol !== '✨')
    return chip(ctx, api, symbol, x, y, w, h, color, { size: 48, font: 'cjk', alpha });
  ctx.save();
  ctx.globalAlpha *= alpha;
  const shape = panel(ctx, api, x, y, w, h, color, api.C.panel, 14),
    cx = x + w / 2,
    cy = y + h / 2;
  [
    [cx, cy, 24],
    [cx - 27, cy - 18, 10],
    [cx + 25, cy + 18, 8],
  ].forEach(([sx, sy, r]) => {
    const points = Array.from({ length: 8 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 4,
        scale = i % 2 ? r * 0.32 : r;
      return { x: sx + Math.cos(a) * scale, y: sy + Math.sin(a) * scale };
    });
    api.path(ctx, points, { closed: true, fill: api.C.ink, color: api.C.ink, width: 1 });
  });
  ctx.restore();
  return shape;
}

function embeddingValues(id) {
  const offset = Number.parseInt(id, 10) % EMBEDDING_BASE.length || 0;
  return EMBEDDING_BASE.map((_, i) => EMBEDDING_BASE[(i + offset) % EMBEDDING_BASE.length]);
}

function drawVector(ctx, api, x, y, scale = 1, color = api.C.cyan, id = '421') {
  const vals = embeddingValues(id);
  line(ctx, api, x, y + 72 * scale, x + 330 * scale, y + 72 * scale, api.C.muted, 2);
  vals.forEach((v, i) => {
    const bx = x + i * 40 * scale + 4;
    api.rect(ctx, bx, y + (70 - v * 62) * scale, 20 * scale, v * 62 * scale, color, undefined, 4);
  });
  M(
    ctx,
    api,
    `\\mathbf{e}_{${id}}`,
    x + 160 * scale,
    y + 126 * scale,
    Math.max(30, 31 * scale),
    api.C.ink,
  );
}

function drawIntro(ctx, scene, state, api) {
  const C = api.C;
  T(ctx, api, 'FIVE LETTERS', 960, 300, 34, C.muted);
  chip(ctx, api, 'plays', 600, 385, 720, 150, C.cyan, { font: 'serif', size: 94 });
  focusMark(api, 'opening-prediction', () => {
    T(ctx, api, 'How many model positions?', 960, 665, 46, C.ink);
    [1, 2, 5].forEach((count, i) =>
      chip(ctx, api, String(count), 490 + i * 350, 745, 240, 112, C.blue, { size: 58 }),
    );
  });
  T(ctx, api, 'Keep your prediction. We will build the rules.', 960, 970, 30, C.muted);
}

function drawModelInput(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  const words = ['The', 'cat', 'slept'],
    ids = ['81', '421', '907'],
    xs = [400, 960, 1520],
    colors = [C.cyan, C.yellow, C.green];
  T(ctx, api, b === 0 ? 'VOCABULARY LOOKUP' : 'LEARNED EMBEDDING LOOKUP', 960, 285, 34, C.muted);
  if (b === 0) {
    focusMark(api, 'model-input-group', () =>
      words.forEach((word, i) =>
        chip(ctx, api, word, xs[i] - 175, 370, 350, 104, colors[i], { size: 48, font: 'serif' }),
      ),
    );
    const lookup = directed(state, api, 'model-input-ids', 0.32, 0.8);
    focusMark(api, 'model-input-ids', () =>
      ids.forEach((id, i) => {
        const arrive = step(api, lookup, i * 0.15, 0.55 + i * 0.15);
        api.trace(
          ctx,
          [
            { x: xs[i], y: 495 },
            { x: xs[i], y: 625 },
          ],
          arrive,
          colors[i],
          5,
        );
        chip(ctx, api, arrive === 1 ? id : '?', xs[i] - 130, 650, 260, 104, colors[i], {
          size: 48,
        });
      }),
    );
    T(ctx, api, 'An ID is a model-local vocabulary index', 960, 930, 33, C.muted);
  } else {
    focusMark(api, 'ordered-embedding-lookup', () =>
      ids.forEach((id, i) => {
        chip(ctx, api, id, xs[i] - 105, 365, 210, 96, colors[i], { size: 45 });
        const lookup = step(
          api,
          directed(state, api, 'ordered-embedding-lookup', 0.1, 0.72),
          i * 0.14,
          0.5 + i * 0.14,
        );
        api.trace(
          ctx,
          [
            { x: xs[i], y: 485 },
            { x: xs[i], y: 570 },
          ],
          lookup,
          colors[i],
          4,
        );
        if (lookup > 0) {
          ctx.save();
          ctx.globalAlpha *= lookup;
          drawVector(ctx, api, xs[i] - 165, 610, 1, colors[i], id);
          ctx.restore();
        }
      }),
    );
    [400, 960, 1520].forEach((x, i) => T(ctx, api, i + 1, x, 870, 32, C.muted));
    T(ctx, api, 'The order stays: The · cat · slept', 960, 970, 34, C.ink);
  }
}

function drawEmbedding(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b < 2) {
    T(
      ctx,
      api,
      b === 0 ? 'A FIXED CHECKPOINT' : 'CHANGE THE LABEL. KEEP THE WEIGHTS.',
      960,
      285,
      34,
      C.muted,
    );
    focusMark(api, 'embedding-contract-object-76', () =>
      chip(
        ctx,
        api,
        b === 0 ? 'cat → 421' : 'slept → 421',
        190,
        430,
        560,
        115,
        b === 0 ? C.cyan : C.pink,
        { size: 48 },
      ),
    );
    focusMark(api, 'embedding-contract-object-91', () =>
      T(
        ctx,
        api,
        b === 0 ? 'trained vocabulary' : 'replacement vocabulary',
        470,
        615,
        32,
        b === 0 ? C.cyan : C.pink,
      ),
    );
    const lookup = b === 0 ? directed(state, api, 'embedding-contract-group-80', 0.2, 0.65) : 1;
    api.trace(
      ctx,
      [
        { x: 790, y: 488 },
        { x: 1030, y: 488 },
      ],
      lookup,
      C.yellow,
      5,
    );
    focusMark(api, 'embedding-contract-group-80', () => {
      panel(ctx, api, 1070, 360, 650, 340, C.yellow);
      T(ctx, api, 'row 421', 1395, 420, 35, C.yellow);
    });
    focusMark(api, 'embedding-contract-group-80', () => {
      ctx.save();
      ctx.globalAlpha *= lookup;
      drawVector(ctx, api, 1230, 465, 1, C.green, '421');
      ctx.restore();
    });
    focusMark(api, 'embedding-contract-object-89', () =>
      T(ctx, api, 'vector learned for cat', 1395, 660, 34, C.green),
    );
    if (b === 1) T(ctx, api, 'A new vocabulary label does not retrain a row', 960, 885, 35, C.pink);
  } else {
    const move = directed(state, api, 'remap-rows', 0.2, 0.66),
      model = remapExample(move);
    T(ctx, api, 'TWO-ROW TOY CHECKPOINT · SAME PERMUTATION IN BOTH TABLES', 960, 275, 30, C.muted);
    chip(ctx, api, 'cat → 907', 270, 335, 480, 80, C.cyan, { size: 38 });
    chip(ctx, api, 'slept → 421', 1170, 335, 480, 80, C.pink, { size: 38 });
    focusMark(api, 'remap-rows', () =>
      ['INPUT ROWS', 'OUTPUT ROWS'].forEach((label, j) => {
        const center = 485 + j * 950;
        T(ctx, api, label, center, 465, 32, j ? C.yellow : C.blue);
        [421, 907].forEach((id, i) =>
          T(ctx, api, id, center - 300, 555 + i * 160, 32, C.muted, 'center', 'mono'),
        );
        model.rows.forEach((row, i) => {
          const x = center + (i ? -1 : 1) * 160 * Math.sin(move * Math.PI);
          const y = 515 + 160 * (i ? 1 - move : move);
          chip(
            ctx,
            api,
            row.piece + ' [' + row.vector.join(', ') + ']',
            x - 125,
            y,
            250,
            85,
            i ? C.pink : C.cyan,
            { size: 28 },
          );
        });
      }),
    );
    focusMark(api, 'remap-result', () => {
      if (move >= 1) {
        T(ctx, api, 'cat retrieves [' + model.lookup.cat.join(', ') + ']', 485, 865, 35, C.cyan);
        T(ctx, api, 'h = [0.8, 0.2]', 1435, 815, 29, C.muted, 'center', 'mono');
        T(
          ctx,
          api,
          'cat logit: ' + model.logits.cat + ' · slept: ' + model.logits.slept,
          1435,
          865,
          32,
          C.yellow,
        );
      } else
        T(ctx, api, 'New IDs with the old row order select the wrong pieces', 960, 865, 32, C.pink);
    });
    T(ctx, api, 'Input, output, biases and other indexed state must agree', 960, 980, 30, C.muted);
  }
}

function drawGranularity(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  if (beat === 0) {
    T(ctx, api, 'WHOLE-WORD VOCABULARY: ONE POSITION FOR EACH KNOWN WORD', 960, 265, 30, C.muted);
    panel(ctx, api, 180, 330, 600, 550, C.yellow);
    panel(ctx, api, 1020, 330, 720, 550, C.red);
    T(ctx, api, 'KNOWN SPELLING', 480, 405, 32, C.yellow);
    focusMark(api, 'granularity-object-101', () =>
      chip(ctx, api, 'playing', 260, 470, 440, 90, C.yellow, { size: 39 }),
    );
    T(ctx, api, 'one model position', 480, 680, 33, C.yellow);
    T(ctx, api, 'UNFAMILIAR SPELLINGS', 1380, 405, 32, C.red);
    const first = step(api, p, 0.1, 0.3),
      second = step(api, p, 0.16, 0.34),
      collapse = step(api, p, 0.18, 0.39);
    chip(ctx, api, 'played', 1080, 455, 560, 74, C.pink, { size: 32, alpha: first });
    chip(ctx, api, 'playful', 1080, 590, 560, 74, C.blue, { size: 32, alpha: second });
    api.trace(
      ctx,
      [
        { x: 1660, y: 492 },
        { x: 1690, y: 492 },
        { x: 1690, y: 780 },
        { x: 1520, y: 780 },
      ],
      collapse,
      C.pink,
      3,
    );
    api.trace(
      ctx,
      [
        { x: 1060, y: 627 },
        { x: 1045, y: 627 },
        { x: 1045, y: 780 },
        { x: 1220, y: 780 },
      ],
      collapse,
      C.blue,
      3,
    );
    chip(ctx, api, '<UNK>', 1240, 740, 260, 78, C.red, { size: 38, alpha: collapse });
    T(ctx, api, 'Different unseen spellings can become the same input symbol', 960, 970, 31, C.ink);
  } else if (beat === 1) {
    T(ctx, api, 'playing', 960, 265, 44, C.ink, 'center', 'serif');
    T(ctx, api, 'CHARACTERS USE A SMALLER BASE ALPHABET', 960, 350, 31, C.muted);
    focusMark(api, 'granularity-object-108', () =>
      morphTokens(
        ctx,
        api,
        ['playing'],
        [...'playing'],
        spokenProgress(api, 'granularity-beat-2-focus-1', step(api, p, 0.035, 0.63)),
        960,
        450,
        [C.cyan],
        { size: 40, height: 88, advance: 26, fromColors: [C.yellow] },
      ),
    );
    T(
      ctx,
      api,
      '7 separate model positions',
      960,
      660,
      36,
      C.cyan,
      'center',
      'sans',
      step(api, p, 0.6, 0.78),
    );
    M(
      ctx,
      api,
      '\\text{shorter pieces} \\Rightarrow \\text{more positions}',
      960,
      800,
      43,
      C.yellow,
    );
    T(ctx, api, 'Coverage depends on the base alphabet and fallback rules', 960, 955, 30, C.muted);
  } else {
    T(ctx, api, 'playing', 960, 265, 44, C.ink, 'center', 'serif');
    T(ctx, api, 'ILLUSTRATIVE SUBWORDS REUSE PARTS ACROSS SPELLINGS', 960, 350, 30, C.muted);
    focusMark(api, 'granularity-object-112', () =>
      morphTokens(
        ctx,
        api,
        ['playing'],
        ['play', 'ing'],
        spokenProgress(api, 'granularity-beat-3-focus-1', step(api, p, 0.035, 0.53)),
        960,
        440,
        [C.cyan, C.blue],
        { size: 40, height: 88, advance: 27, fromColors: [C.yellow] },
      ),
    );
    T(
      ctx,
      api,
      '2 reusable pieces',
      960,
      625,
      34,
      C.green,
      'center',
      'sans',
      step(api, p, 0.5, 0.68),
    );
    // Measured speech cues: rarer spellings at 7.31s, assembled pieces at 8.50–10.59s.
    const reuse = directed(state, api, 'granularity-reuse', 0.55, 0.85);
    focusMark(api, 'granularity-reuse', () => {
      ctx.save();
      morphTokens(ctx, api, ['played'], ['play', 'ed'], reuse, 500, 740, [C.cyan, C.green], {
        size: 35,
        height: 76,
        advance: 24,
        fromColors: [C.muted],
      });
      morphTokens(ctx, api, ['playful'], ['play', 'ful'], reuse, 1400, 740, [C.cyan, C.pink], {
        size: 35,
        height: 76,
        advance: 24,
        fromColors: [C.muted],
      });
      ctx.restore();
    });
    T(
      ctx,
      api,
      'A shared inventory covers more spellings with fewer positions than characters',
      960,
      960,
      30,
      C.ink,
    );
  }
}

function drawSequenceCost(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  if (beat === 0) {
    T(ctx, api, 'Children happily played outdoors', 960, 260, 36, C.ink, 'center', 'serif');
    const rows = [
      { label: 'characters', count: 32, color: C.pink },
      { label: 'illustrative subwords', count: 7, color: C.cyan },
      { label: 'whole words', count: 4, color: C.yellow },
    ];
    focusMark(api, 'sequence-cost-group-117', () =>
      rows.forEach((row, r) => {
        const y = 335 + r * 185,
          fill = step(api, p, 0.04 + r * 0.17, 0.38 + r * 0.17),
          used = Math.min(row.count, Math.floor(fill * row.count + 0.0001));
        T(ctx, api, row.label, 165, y + 34, 30, C.muted, 'left');
        const cell = Math.min(34, 850 / row.count - 4),
          gap = Math.min(5, (850 - cell * row.count) / Math.max(1, row.count - 1));
        focusMark(api, 'sequence-cost-group-119', () => {
          for (let i = 0; i < row.count; i++)
            api.rect(
              ctx,
              560 + i * (cell + gap),
              y,
              cell,
              56,
              i < used ? row.color : C.panel,
              i < used ? undefined : C.muted,
              5,
            );
        });
        T(ctx, api, used + ' positions', 1490, y + 36, 30, row.color, 'left');
      }),
    );
    T(
      ctx,
      api,
      '"Child" | "ren" | " happ" | "ily" | " play" | "ed" | " outdoors"',
      960,
      845,
      30,
      C.cyan,
      'center',
      'mono',
    );
    T(
      ctx,
      api,
      'Character positions include spaces; the subword split is illustrative',
      960,
      930,
      30,
      C.ink,
    );
  } else if (beat === 1) {
    T(ctx, api, 'EACH POSITION ADDS A ROW AND A COLUMN', 960, 270, 32, C.muted);
    const shrink = spokenProgress(api, 'sequence-cost-shorter', step(api, p, 0.25, 0.8)),
      n = Math.round(api.lerp(32, 7, shrink)),
      cell = 19,
      x = 250,
      y = 335,
      w = n * cell;
    focusMark(api, 'sequence-cost-grid', () => {
      api.rect(ctx, x, y, w, w, C.blue, undefined, 0);
      const clip = { x, y, width: w, height: w };
      for (let i = 0; i <= n; i++) {
        api.path(
          ctx,
          [
            { x: x + i * cell, y },
            { x: x + i * cell, y: y + w },
          ],
          { color: C.bg, width: 2, clip },
        );
        api.path(
          ctx,
          [
            { x, y: y + i * cell },
            { x: x + w, y: y + i * cell },
          ],
          { color: C.bg, width: 2, clip },
        );
      }
    });
    focusMark(api, 'sequence-cost-group-121', () => {
      for (let i = 0; i < n; i++)
        api.rect(
          ctx,
          x + i * cell + 2,
          y + i * cell + 2,
          cell - 4,
          cell - 4,
          C.yellow,
          undefined,
          1,
        );
    });
    T(ctx, api, n + ' positions', x + w / 2, 315, 30, shrink < 0.5 ? C.pink : C.cyan);
    focusMark(api, 'sequence-cost-equation-123', () =>
      M(ctx, api, 'O(L^2 d)', 1300, 440, 64, C.cyan),
    );
    focusMark(api, 'sequence-cost-calculation', () =>
      M(
        ctx,
        api,
        n + '^2 = ' + (n * n).toLocaleString('en-US').replaceAll(',', '{,}'),
        1300,
        570,
        54,
        shrink < 0.5 ? C.pink : C.green,
      ),
    );
    T(
      ctx,
      api,
      'This shows dense scores; causal masking keeps a triangular portion',
      960,
      1010,
      29,
      C.muted,
    );
  } else {
    T(ctx, api, 'CACHED DECODE: ONE NEW POSITION READS THE STORED CONTEXT', 960, 270, 30, C.muted);
    const context = 12,
      read = spokenProgress(api, 'sequence-cost-beat-3-focus-1', step(api, p, 0.1, 0.68));
    for (let i = 0; i < context; i++) {
      const x = 250 + i * 85,
        seen = step(api, read, i / context, (i + 1) / context);
      api.trace(
        ctx,
        [
          { x: x + 31, y: 475 },
          { x: 1495, y: 560 },
        ],
        seen,
        C.blue,
        2.5,
      );
    }
    focusMark(api, 'sequence-cost-group-126', () => {
      for (let i = 0; i < context; i++)
        api.rect(ctx, 250 + i * 85, 385, 62, 70, C.panel, i / context < read ? C.cyan : C.muted, 8);
    });
    T(ctx, api, 'stored positions', 750, 350, 30, C.muted);
    chip(ctx, api, 'new', 1420, 580, 150, 76, C.yellow, { size: 36 });
    M(ctx, api, 'O(Ld) \\text{ per new position}', 670, 720, 46, C.yellow);
    const append = step(api, p, 0.7, 0.93);
    T(ctx, api, 'KV CACHE', 1400, 750, 30, C.green);
    for (let i = 0; i < 13; i++) {
      ctx.save();
      ctx.globalAlpha *= i === 12 ? append : 1;
      api.rect(ctx, 1055 + i * 54, 795, 40, 62, i === 12 ? C.yellow : C.green, undefined, 6);
      ctx.restore();
    }
    M(ctx, api, 'O(L) \\text{ storage}', 1400, 905, 42, C.green);
    T(
      ctx,
      api,
      'Kernels, batching, masking, and architecture also affect real latency',
      960,
      995,
      29,
      C.muted,
    );
  }
}

function drawCorpus(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  const corpus = BPE_CORPUS,
    colors = [C.cyan, C.blue, C.green];
  const countProgress = spokenProgress(api, 'bpe-weighted-count', p);
  const compareProgress = spokenProgress(api, 'bpe-compare-counts', p);
  T(ctx, api, 'CORPUS FREQUENCY', 300, 270, 30, C.muted);
  T(ctx, api, 'CURRENT ADJACENT SYMBOLS', 730, 270, 30, C.muted);
  focusMark(api, 'bpe-corpus-rows', () =>
    corpus.forEach(([word, count], row) => {
      const y = 345 + row * 145;
      chip(ctx, api, '×' + count, 145, y, 100, 66, C.yellow, { size: 30 });
      T(ctx, api, word, 280, y + 44, 32, C.ink, 'left', 'mono');
      [...word].forEach((ch, i) =>
        chip(ctx, api, ch, 520 + i * 72, y, 64, 66, i < 2 ? colors[row] : C.muted, { size: 31 }),
      );
      const seen = beat === 1 ? 1 : step(api, countProgress, row * 0.3, 0.2 + row * 0.3);
      api.trace(
        ctx,
        [
          { x: 520, y: y - 17 },
          { x: 656, y: y - 17 },
        ],
        seen,
        colors[row],
        6,
      );
      if (beat === 0) {
        const flight = step(api, countProgress, 0.1 + row * 0.3, 0.35 + row * 0.3);
        api.trace(
          ctx,
          [
            { x: 910, y: y + 33 },
            { x: 1165, y: y + 33 },
          ],
          flight,
          colors[row],
          3,
        );
        travel(ctx, api, 925, y + 33, 1165, y + 33, flight, colors[row], 9);
        const arrived = step(api, countProgress, 0.2 + row * 0.3, 0.4 + row * 0.3);
        for (let j = 0; j < count; j++) {
          ctx.save();
          ctx.globalAlpha *= arrived;
          circle(ctx, api, 1245 + j * 58, y + 33, 17, colors[row]);
          ctx.restore();
        }
        T(ctx, api, '+' + count, 1500, y + 44, 34, colors[row], 'center', 'mono', arrived);
      }
    }),
  );
  if (beat === 0) {
    T(ctx, api, 'WEIGHTED OCCURRENCES', 1425, 270, 30, C.muted);
    const total = corpus.reduce(
      (sum, [, n], i) => sum + (countProgress >= 0.4 + i * 0.3 ? n : 0),
      0,
    );
    focusMark(api, 'bpe-weighted-total', () =>
      M(
        ctx,
        api,
        total === 7 ? '3 + 2 + 2 = 7' : '\\text{counted so far: }' + total,
        960,
        865,
        54,
        C.yellow,
      ),
    );
    T(ctx, api, 'Each observed pair contributes its row frequency', 960, 950, 30, C.muted);
  } else {
    T(ctx, api, 'PAIR COUNTS', 1435, 270, 30, C.muted);
    const pairs = [
      ['p', 'l', C.green],
      ['l', 'a', C.blue],
      ['a', 'y', C.blue],
      ['l', 'o', C.pink],
    ].map(([left, right, color]) => [
      `${left} + ${right}`,
      BPE_INITIAL_PAIRS.get(`${left}\0${right}`),
      color,
    ]);
    focusMark(api, 'bpe-pair-counts', () =>
      pairs.forEach(([name, count, color], i) => {
        const y = 345 + i * 112,
          growth = step(api, compareProgress, 0.02 + i * 0.06, 0.5 + i * 0.06);
        T(ctx, api, name, 1125, y + 32, 30, color, 'left', 'mono');
        ctx.save();
        ctx.globalAlpha *= growth;
        api.rect(ctx, 1300, y + 2, count * 42, 42, color, undefined, 6);
        ctx.restore();
        T(ctx, api, count, 1650, y + 34, 32, color, 'center', 'mono', growth);
      }),
    );
    spokenReveal(api, state, 'bpe-pick-first', p > 0.65, () =>
      focusMark(api, 'bpe-selected-pair', () =>
        M(
          ctx,
          api,
          '\\operatorname*{arg\\,max}_{(a,b)} f(a,b) \\quad\\Rightarrow\\quad \\text{p} + \\text{l}',
          960,
          865,
          46,
          C.yellow,
        ),
      ),
    );
  }
}

function drawMerges(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  const first = b === 0 ? directed(state, api, 'bpe-merge-all-rows', 0.08, 0.42) : 1;
  const second = b === 1 ? directed(state, api, 'bpe-second-merge', 0.3, 0.68) : b > 1 ? 1 : 0;
  const third = b === 2 ? directed(state, api, 'bpe-third-merge', 0.08, 0.38) : 0;
  const ranks = b === 2 ? directed(state, api, 'bpe-record-ranks', 0.55, 0.8) : 0;
  T(
    ctx,
    api,
    b === 0
      ? 'MERGE EVERY OCCURRENCE, THEN RECOUNT'
      : b === 1
        ? 'A TIE: OUR RULE USES FIRST ENCOUNTER'
        : 'THE NEXT MERGE BECOMES THE NEXT RULE',
    960,
    270,
    31,
    C.muted,
  );
  if (ranks < 0.5) {
    ctx.save();
    focusMark(api, 'bpe-merge-ranks', () =>
      focusMark(api, b === 0 ? 'bpe-all-row-fusion' : 'bpe-next-row-fusion', () =>
        BPE_CORPUS.forEach(([word, count], i) => {
          const y = 355 + i * 145;
          chip(ctx, api, '×' + count, 220, y, 115, 85, C.yellow, { size: 35 });
          const rest = word === 'plays' ? ['s'] : [];
          if (b === 0)
            morphTokens(
              ctx,
              api,
              [...word],
              ['pl', ...word.slice(2)],
              first,
              1080,
              y,
              [C.green, C.blue, C.pink],
              { size: 44, height: 85, advance: 32 },
            );
          else if (word === 'plot')
            morphTokens(
              ctx,
              api,
              ['pl', 'o', 't'],
              ['pl', 'o', 't'],
              1,
              1080,
              y,
              [C.green, C.blue, C.blue],
              { size: 44, height: 85, advance: 32 },
            );
          else if (b === 1)
            morphTokens(
              ctx,
              api,
              ['pl', 'a', 'y', ...rest],
              ['pla', 'y', ...rest],
              second,
              1080,
              y,
              [C.green, C.blue, C.pink],
              { size: 44, height: 85, advance: 32 },
            );
          else
            morphTokens(
              ctx,
              api,
              ['pla', 'y', ...rest],
              ['play', ...rest],
              third,
              1080,
              y,
              [C.green, C.pink],
              { size: 44, height: 85, advance: 32 },
            );
        }),
      ),
    );
    ctx.restore();
    if (b === 0) {
      focusMark(api, 'bpe-merged-symbol', () =>
        M(ctx, api, '\\mathrm{p}+\\mathrm{l}\\rightarrow\\mathrm{pl}', 960, 835, 47, C.green),
      );
      if (directed(state, api, 'bpe-recount-neighbors', 0.62, 0.85) > 0)
        bpeRecountEvidence().forEach((pair, i) =>
          focusMark(api, 'bpe-recount-' + i, () =>
            M(
              ctx,
              api,
              'f(\\mathrm{' + pair.left + '},\\mathrm{' + pair.right + '})=3+2=5',
              510 + i * 900,
              950,
              35,
              i ? C.blue : C.cyan,
            ),
          ),
        );
    } else if (b === 1) {
      const fade = 1 - step(api, second, 0.02, 0.3);
      focusMark(api, 'bpe-tied-pl-a', () =>
        chip(ctx, api, 'pl + a : 5', 320, 845, 520, 90, C.cyan, { size: 38, alpha: fade }),
      );
      focusMark(api, 'bpe-tied-a-y', () =>
        chip(ctx, api, 'a + y : 5', 1080, 845, 520, 90, C.blue, { size: 38, alpha: fade }),
      );
      if (second === 1) T(ctx, api, 'pla | y  ·  one boundary remains', 960, 970, 33, C.green);
    }
  }
  if (ranks >= 0.5)
    focusMark(api, 'bpe-merge-ranks', () =>
      BPE_TRAINING.merges.forEach(({ left, right, merged }, i) => {
        const y = 370 + i * 165;
        chip(ctx, api, String(i + 1), 300, y, 105, 105, C.yellow, { size: 42 });
        chip(
          ctx,
          api,
          left + ' + ' + right + ' → ' + merged,
          460,
          y,
          1160,
          105,
          [C.cyan, C.blue, C.green][i],
          { size: 45 },
        );
      }),
    );
}

function drawBpeEncoding(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b === 0) {
    const pl = directed(state, api, 'encoding-pl', 0.22, 0.36),
      pla = directed(state, api, 'encoding-pla', 0.4, 0.54),
      play = directed(state, api, 'encoding-play', 0.58, 0.74);
    T(ctx, api, 'YOUR PREDICTION: plays', 960, 280, 42, C.ink, 'center', 'serif');
    BPE_TRAINING.merges.forEach(({ left, right, merged }, i) => {
      const active = [pl, pla, play][i] > 0;
      chip(
        ctx,
        api,
        i + 1 + ': ' + left + ' + ' + right + ' → ' + merged,
        180,
        375 + i * 125,
        630,
        86,
        active ? C.green : C.muted,
        { size: 35 },
      );
    });
    focusMark(api, 'bpe-encoding-object-151', () => {
      if (pla === 0)
        morphTokens(
          ctx,
          api,
          [...'plays'],
          ['pl', 'a', 'y', 's'],
          pl,
          1350,
          475,
          [C.green, C.blue, C.blue, C.pink],
          { size: 51, height: 112, advance: 35 },
        );
      else if (play === 0)
        morphTokens(
          ctx,
          api,
          ['pl', 'a', 'y', 's'],
          ['pla', 'y', 's'],
          pla,
          1350,
          475,
          [C.green, C.blue, C.pink],
          { size: 51, height: 112, advance: 35 },
        );
      else
        morphTokens(
          ctx,
          api,
          ['pla', 'y', 's'],
          ['play', 's'],
          play,
          1350,
          475,
          [C.green, C.pink],
          { size: 51, height: 112, advance: 35 },
        );
    });
    if (play === 1) T(ctx, api, '5 letters → 2 model positions', 960, 870, 48, C.green);
  } else if (b === 1) {
    T(ctx, api, 'MERGES CANNOT CROSS A PRE-TOKENIZER BOUNDARY', 960, 280, 30, C.muted);
    T(ctx, api, 'play outside', 960, 390, 52, C.ink, 'center', 'serif');
    const divide = directed(state, api, 'bpe-encoding-beat-2-focus-1', 0.15, 0.6);
    focusMark(api, 'bpe-encoding-object-154', () =>
      chip(ctx, api, 'play', api.lerp(790, 535, divide), 535, 240, 110, C.cyan, { size: 48 }),
    );
    chip(ctx, api, 'outside', api.lerp(1045, 1130, divide), 535, 405, 110, C.green, { size: 48 });
    ctx.save();
    ctx.globalAlpha *= divide;
    line(ctx, api, 960, 495, 960, 705, C.pink, 6);
    ctx.restore();
    T(ctx, api, 'space boundary · this configuration', 960, 840, 34, C.pink);
  } else {
    T(ctx, api, 'NEW WORD. THE SAME SAVED RULES.', 960, 280, 33, C.muted);
    const merge = directed(state, api, 'bpe-encoding-beat-3-focus-1', 0.1, 0.45);
    focusMark(api, 'bpe-encoding-object-158', () =>
      morphTokens(
        ctx,
        api,
        [...'plums'],
        BPE_OUTPUT,
        merge,
        960,
        460,
        [C.green, C.cyan, C.blue, C.pink],
        { size: 58, height: 130, advance: 42 },
      ),
    );
    if (merge === 1) {
      T(ctx, api, 'pl + u  ·  u + m  ·  m + s', 960, 750, 38, C.muted, 'center', 'mono');
      T(ctx, api, 'No learned rule matches. Keep these boundaries.', 960, 875, 34, C.ink);
    }
  }
}

function drawWordpieceTraining(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b === 0) {
    T(ctx, api, 'WHICH PAIR SHOULD WE FAVOR?', 960, 285, 35, C.muted);
    focusMark(api, 'wordpiece-training-object-164', () => {
      chip(ctx, api, 't + ##h', 300, 405, 550, 110, C.blue, { size: 48 });
      chip(ctx, api, 'rain + ##bow', 1070, 405, 550, 110, C.green, { size: 42 });
    });
    T(ctx, api, '90 together', 575, 670, 45, C.blue);
    T(ctx, api, '42 together', 1345, 670, 45, C.green);
    focusMark(api, 'wordpiece-training-equation-170', () =>
      T(ctx, api, 'WordPiece motivation: corpus likelihood', 960, 910, 34, C.ink),
    );
  } else {
    const rank = directed(state, api, 'wordpiece-training-beat-2-focus-1', 0.48, 0.68);
    T(ctx, api, 'CLASSROOM ASSOCIATION PROXY', 960, 270, 31, C.muted);
    M(ctx, api, 'S(a,b)=\\frac{f(ab)}{f(a)f(b)}', 960, 375, 55, C.cyan);
    const rows = [
      {
        name: 't + ##h',
        math: '\\frac{90}{900\\cdot300}\\approx0.0003',
        y: 535 + rank * 175,
        color: C.blue,
      },
      {
        name: 'rain + ##bow',
        math: '\\frac{42}{50\\cdot44}\\approx0.0191',
        y: 710 - rank * 175,
        color: C.green,
      },
    ];
    rows.forEach((row, i) =>
      focusMark(api, i ? 'wordpiece-training-object-175' : 'wordpiece-training-object-174', () => {
        const x = i ? 1360 : 560;
        chip(ctx, api, row.name, x - 275, row.y - 45, 550, 90, row.color, { size: 39 });
        M(ctx, api, row.math, x, row.y + 100, 35, row.color);
      }),
    );
    T(ctx, api, 'A teaching proxy, not a universal trainer formula', 960, 955, 31, C.muted);
  }
}

function drawWordpieceEncoding(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b === 0) {
    T(ctx, api, 'CONFIGURED BERT-STYLE PREPROCESSING', 960, 285, 32, C.muted);
    focusMark(api, 'wordpiece-encoding-object-201', () => {
      chip(ctx, api, 'Playing!', 230, 420, 500, 125, C.pink, { font: 'serif', size: 58 });
      const reveal = directed(state, api, 'wordpiece-encoding-beat-1-focus-1', 0.4, 0.7);
      api.trace(
        ctx,
        [
          { x: 770, y: 482 },
          { x: 1015, y: 482 },
        ],
        reveal,
        C.yellow,
        5,
      );
      chip(ctx, api, 'playing', 1080, 420, 450, 125, C.cyan, { size: 50, alpha: reveal });
      chip(ctx, api, '!', 1570, 420, 100, 125, C.yellow, { size: 50, alpha: reveal });
    });
    T(ctx, api, 'Cleanup, case, accents and boundaries are configured', 960, 825, 33, C.muted);
  } else if (b === 1) {
    const search = directed(state, api, 'wordpiece-prefix-search', 0.05, 0.43),
      commit = directed(state, api, 'wordpiece-prefix-commit', 0.45, 0.6);
    T(ctx, api, 'LONGEST MATCH FIRST', 960, 270, 33, C.muted);
    focusMark(api, 'wordpiece-encoding-object-204', () =>
      morphTokens(ctx, api, [...'playing'], ['play', 'ing'], commit, 960, 340, [C.green, C.pink], {
        size: 48,
        height: 100,
        advance: 34,
      }),
    );
    focusMark(api, 'wordpiece-prefix-search', () =>
      ['playing', 'playin', 'playi', 'play'].forEach((word, i) => {
        if (i === 3 ? commit <= 0 : search < i / 3) return;
        T(ctx, api, word, 440, 575 + i * 80, 39, i === 3 ? C.green : C.muted, 'center', 'mono');
        const settled = i === 3 ? commit === 1 : search >= (i + 1) / 3;
        T(
          ctx,
          api,
          settled ? (i === 3 ? 'present' : 'absent') : 'checking',
          720,
          575 + i * 80,
          31,
          i === 3 ? C.green : C.muted,
        );
      }),
    );
    focusMark(api, 'wordpiece-encoding-label-208', () => {
      const scan = directed(state, api, 'wordpiece-encoding-beat-2-focus-2', 0.62, 0.9);
      ['##ing', '##in', '##i'].forEach((word, i) => {
        if (scan <= i / 3) return;
        T(ctx, api, word, 1280, 615 + i * 90, 41, C.pink, 'center', 'mono');
        T(ctx, api, scan >= (i + 1) / 3 ? 'absent' : 'checking', 1585, 615 + i * 90, 31, C.pink);
      });
    });
    T(ctx, api, '## marks a continuation inside this word', 960, 990, 31, C.muted);
  } else {
    T(ctx, api, 'CAN THE GREEDY MATCHER RECOVER?', 960, 285, 35, C.muted);
    const alternative = directed(state, api, 'wordpiece-alternative', 0.2, 0.5),
      failure = directed(state, api, 'wordpiece-failure', 0.78, 0.95);
    focusMark(api, 'wordpiece-failure', () => {
      chip(ctx, api, 'play', 280, 445, 280, 110, C.green, { size: 50 });
      chip(ctx, api, 'ing', 585, 445, 230, 110, C.pink, { size: 50 });
    });
    T(ctx, api, 'already committed', 550, 650, 33, C.pink);
    focusMark(api, 'wordpiece-alternative', () => {
      chip(ctx, api, 'pla', 1100, api.lerp(560, 445, alternative), 230, 110, C.green, { size: 50 });
      chip(ctx, api, '##ying', 1355, api.lerp(745, 445, alternative), 340, 110, C.green, {
        size: 45,
      });
      T(
        ctx,
        api,
        alternative === 1 ? 'another valid path' : 'available vocabulary pieces',
        1400,
        alternative === 1 ? 650 : 940,
        31,
        C.green,
      );
    });
    focusMark(api, 'wordpiece-failure', () => {
      if (failure > 0) {
        chip(ctx, api, '[UNK]', 300, 745, 490, 115, C.pink, { size: 58, alpha: failure });
        T(ctx, api, 'the entire word', 550, 945, 31, C.pink);
      }
    });
    if (failure === 1) T(ctx, api, 'No backtracking', 1390, 825, 40, C.ink);
  }
}

function drawWhitespace(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  if (beat === 0) {
    focusMark(api, 'sentencepiece-whitespace-label-234', () =>
      T(ctx, api, 'MAKE A SPACE BOUNDARY VISIBLE', 960, 280, 31, C.muted),
    );
    focusMark(api, 'sentencepiece-whitespace-object-235', () =>
      chip(ctx, api, 'good morning', 250, 405, 500, 100, C.pink, { font: 'serif', size: 43 }),
    );
    const encode = directed(state, api, 'sentencepiece-whitespace-beat-1-focus-1', 0.3, 0.5),
      marker = directed(state, api, 'sentencepiece-whitespace-beat-1-focus-2', 0.5, 0.68),
      decode = directed(state, api, 'sentencepiece-decode', 0.75, 0.95);
    api.trace(
      ctx,
      [
        { x: 790, y: 455 },
        { x: 1020, y: 455 },
      ],
      encode,
      C.cyan,
      5,
    );
    focusMark(api, 'sentencepiece-marker', () => {
      T(ctx, api, 'good', 1190, 465, 39, C.ink, 'center', 'mono', encode);
      T(ctx, api, 'morning', 1500, 465, 39, C.ink, 'center', 'mono', encode);
      T(ctx, api, '▁', 1345, 465, 43, C.green, 'center', 'mono', marker);
    });
    T(ctx, api, 'space marker', 1345, 565, 30, C.green, 'center', 'sans', marker);
    const points = [
      { x: 1345, y: 610 },
      { x: 1345, y: 705 },
      { x: 500, y: 705 },
      { x: 500, y: 755 },
    ];
    api.trace(ctx, points, decode, C.green, 4);
    focusMark(api, 'sentencepiece-whitespace-object-235', () =>
      chip(ctx, api, 'good morning', 250, 785, 500, 88, C.green, {
        font: 'serif',
        size: 39,
        alpha: decode,
      }),
    );
    T(
      ctx,
      api,
      'decode markers back to whitespace',
      1250,
      855,
      31,
      C.muted,
      'center',
      'sans',
      decode,
    );
  } else if (beat === 1) {
    T(ctx, api, 'A DUMMY PREFIX GIVES THE FIRST WORD A BOUNDARY', 960, 285, 30, C.muted);
    focusMark(api, 'sentencepiece-whitespace-object-242', () =>
      chip(ctx, api, 'good', 300, 420, 360, 86, C.pink, { font: 'serif', size: 40 }),
    );
    const prefix = directed(state, api, 'sentencepiece-whitespace-beat-2-focus-1', 0.25, 0.6);
    api.trace(
      ctx,
      [
        { x: 710, y: 463 },
        { x: 1030, y: 463 },
      ],
      prefix,
      C.yellow,
      5,
    );
    focusMark(api, 'sentencepiece-whitespace-label-245', () => {
      T(ctx, api, 'good', 1320, 477, 43, C.ink, 'center', 'mono');
      T(ctx, api, '▁', api.lerp(980, 1210, prefix), 477, 43, C.green, 'center', 'mono', prefix);
    });
    focusMark(api, 'sentencepiece-whitespace-label-245', () =>
      T(
        ctx,
        api,
        'added before the first word',
        1320,
        630,
        31,
        C.green,
        'center',
        'sans',
        step(api, p, 0.45, 0.7),
      ),
    );
    T(
      ctx,
      api,
      'The configured option determines whether this prefix is added',
      960,
      805,
      31,
      C.muted,
    );
  } else {
    T(ctx, api, 'CONFIGURED BOUNDARIES CONSTRAIN NEIGHBORS', 960, 280, 31, C.muted);
    const pieces = [
      ['▁good', 220, C.cyan],
      ['▁morning', 620, C.yellow],
      ['42', 1040, C.pink],
      ['漢', 1420, C.green],
    ];
    focusMark(api, 'sentencepiece-whitespace-group-247', () =>
      pieces.forEach(([text, x, color]) =>
        chip(ctx, api, text, x, 430, 320, 82, color, {
          size: 31,
          font: text === '漢' ? 'cjk' : 'mono',
        }),
      ),
    );
    [580, 1000, 1380].forEach((x, i) =>
      api.trace(
        ctx,
        [
          { x, y: 400 },
          { x, y: 555 },
        ],
        step(
          api,
          directed(state, api, 'sentencepiece-whitespace-beat-3-focus-1', 0.3, 0.7),
          i * 0.2,
          0.5 + i * 0.2,
        ),
        C.red,
        4,
      ),
    );
    T(ctx, api, 'whitespace', 580, 640, 29, C.red, 'center', 'sans', step(api, p, 0.1, 0.36));
    T(ctx, api, 'numbers', 1000, 640, 29, C.red, 'center', 'sans', step(api, p, 0.26, 0.52));
    T(ctx, api, 'script changes', 1380, 640, 29, C.red, 'center', 'sans', step(api, p, 0.42, 0.68));
    T(ctx, api, 'The model configuration chooses the applicable rules', 960, 820, 32, C.ink);
    T(ctx, api, 'Normalization and boundaries travel with the tokenizer', 960, 925, 30, C.muted);
  }
}

function drawUnigramTraining(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0,
    candidates = UNIGRAM_CANDIDATES.map(([piece, color, remove]) => [piece, C[color], remove]);
  T(
    ctx,
    api,
    b === 0 ? 'START WITH TOO MANY PIECES' : 'WHICH REMOVAL HURTS LESS?',
    960,
    270,
    34,
    C.muted,
  );
  const prune = b ? directed(state, api, 'unigram-prune', 0.8, 0.95) : 0;
  focusMark(api, b ? 'unigram-training-group-263' : 'unigram-training-group-253', () => {
    const rows = [candidates.slice(0, 4), candidates.slice(4)];
    rows.forEach((row, j) => {
      const boxes = tokenLayout(
        row.map((x) => x[0]),
        960,
        30,
        60,
      );
      row.forEach(([piece, color, remove], i) =>
        chip(
          ctx,
          api,
          piece,
          boxes[i].x,
          b ? 750 + j * 105 : 410 + j * 180,
          boxes[i].width,
          b ? 75 : 105,
          color,
          { size: b ? 32 : 42, alpha: remove ? 1 - 0.84 * prune : 1 },
        ),
      );
    });
  });
  if (!b) {
    T(ctx, api, 'Several paths can spell ▁house', 960, 830, 40, C.ink);
    T(ctx, api, 'Estimate probabilities, then test what can be removed', 960, 970, 30, C.muted);
  } else {
    T(ctx, api, '3 displayed paths · fixed piece scores', 960, 350, 30, C.muted);
    const trials = [
      ['ous', 'unigram-removal-unused', 0.18, 0.4, C.blue],
      ['▁house', 'unigram-removal-useful', 0.48, 0.7, C.yellow],
    ];
    trials.forEach(([piece, id, a, z, color], i) =>
      focusMark(api, id, () => {
        const reveal = directed(
            state,
            api,
            i ? 'unigram-remove-useful' : 'unigram-remove-unused',
            a,
            z,
          ),
          e = unigramRemovalEvidence(piece),
          y = 440 + i * 150;
        T(ctx, api, 'remove ' + piece, 370, y + 35, 35, color);
        if (reveal > 0) {
          if (e.lossIncrease > 0)
            api.rect(ctx, 760, y, Math.max(0.1, 480 * reveal), 48, color, undefined, 3);
          else line(ctx, api, 760, y + 24, 780, y + 24, color, 4);
          T(
            ctx,
            api,
            e.lossIncrease.toFixed(2) + ' nats',
            1510,
            y + 38,
            39,
            color,
            'center',
            'mono',
            reveal,
          );
        }
      }),
    );
    T(
      ctx,
      api,
      'Corpus-wide estimates and probability refitting follow in a real trainer',
      960,
      1020,
      26,
      C.muted,
    );
  }
}

function drawUnigramEncoding(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  if ((state.beat ?? 0) === 3) return drawSampling(ctx, scene, state, api);
  const xs = [230, 445, 660, 875, 1090, 1305, 1520];
  if (beat === 0) {
    T(ctx, api, 'A LATTICE OF POSSIBLE PIECES', 960, 270, 32, C.muted);
    const edges = [
      { a: 0, b: 6, controlY: 150, word: '▁house', labelY: 300, w: 210, color: C.green },
      { a: 0, b: 1, controlY: 600, word: '▁', labelY: 690, w: 80, color: C.yellow },
      { a: 1, b: 6, controlY: 310, word: 'house', labelY: 480, w: 180, color: C.blue },
      { a: 1, b: 3, controlY: 900, word: 'ho', labelY: 785, w: 110, color: C.pink },
      { a: 3, b: 6, controlY: 900, word: 'use', labelY: 785, w: 150, color: C.pink },
    ];
    focusMark(api, 'unigram-encoding-group-266', () =>
      edges.forEach((edge) => {
        const x1 = xs[edge.a],
          x2 = xs[edge.b],
          center = (x1 + x2) / 2;
        const points = Array.from({ length: 65 }, (_, i) => {
          const u = i / 64;
          return {
            x: api.lerp(x1, x2, u),
            y: (1 - u) ** 2 * 600 + 2 * (1 - u) * u * edge.controlY + u ** 2 * 600,
          };
        });
        api.trace(ctx, points, p, edge.color, 5);
        chip(ctx, api, edge.word, center - edge.w / 2, edge.labelY, edge.w, 58, edge.color, {
          size: 30,
          alpha: alphaFrom(p, 0.2, 0.58),
        });
        if (edge.word === '▁') {
          ctx.save();
          ctx.globalAlpha *= alphaFrom(p, 0.2, 0.58);
          line(ctx, api, center, 618, center, edge.labelY - 18, edge.color, 2);
          ctx.restore();
        }
      }),
    );
    xs.forEach((x, i) => {
      circle(ctx, api, x, 600, 9, i === 0 || i === 6 ? C.ink : C.muted);
      T(ctx, api, i, x, 650, 28, C.muted, 'center', 'mono');
    });
    T(ctx, api, '▁ h o u s e', 960, 890, 34, C.ink, 'center', 'mono');
    T(
      ctx,
      api,
      'Each route from the first boundary to the last spells the same text',
      960,
      955,
      30,
      C.muted,
    );
  } else if (beat === 1) {
    const product = directed(state, api, 'unigram-encoding-beat-2-focus-1', 0.25, 0.65);
    T(ctx, api, 'MULTIPLY ALONG EACH COMPLETE PATH', 960, 275, 33, C.muted);
    focusMark(api, 'unigram-encoding-group-270', () => {
      chip(ctx, api, '▁house', 210, 370, 410, 100, C.green, { size: 48 });
      M(ctx, api, 'P=0.30', 1190, 425, 50, C.green);
      api.rect(ctx, 750, 475, 900, 14, C.green, undefined, 3);
      chip(ctx, api, '▁', 210, 620, 120, 100, C.blue, { size: 45 });
      chip(ctx, api, 'house', 355, 620, 265, 100, C.blue, { size: 45 });
      M(
        ctx,
        api,
        product === 1 ? '0.15\\times0.10=0.015' : '0.15\\times0.10=\\;?',
        1190,
        680,
        46,
        C.blue,
      );
      if (product === 1) api.rect(ctx, 750, 735, (900 * 0.015) / 0.3, 14, C.blue, undefined, 3);
    });
    T(ctx, api, 'The bars share one probability scale', 960, 900, 33, C.muted);
  } else {
    T(ctx, api, 'VITERBI COMPARES THE STRONGEST INCOMING SCORES', 960, 275, 31, C.muted);
    const choose = step(api, p, 0.62, 0.82),
      routes = UNIGRAM_PATHS.map((path, i) => ({
        ...path,
        y: [440, 585, 730][i],
        color: C[path.color],
        probability:
          i === 0 ? unigramPathProbability(path).toFixed(2) : String(unigramPathProbability(path)),
        arrive: step(api, p, [0.04, 0.23, 0.43][i], [0.22, 0.43, 0.61][i]),
      }));
    focusMark(api, 'unigram-encoding-group-274', () =>
      routes.forEach((route, i) => {
        const alpha = i === 0 ? 1 : 1 - 0.65 * choose;
        ctx.save();
        ctx.globalAlpha *= alpha;
        api.path(
          ctx,
          [
            { x: xs[0], y: route.y },
            { x: xs[6], y: route.y },
          ],
          { color: route.color, width: i === 0 ? 5 + 4 * choose : 5 },
        );
        route.words.forEach((word, j) => {
          const x = (xs[route.boundaries[j]] + xs[route.boundaries[j + 1]]) / 2;
          chip(
            ctx,
            api,
            word,
            x - route.widths[j] / 2,
            route.y - 70,
            route.widths[j],
            58,
            route.color,
            { size: 30 },
          );
        });
        route.boundaries.forEach((boundary) =>
          circle(ctx, api, xs[boundary], route.y, 8, route.color),
        );
        const first = step(api, p, 0.025, 0.13);
        if (i === 0)
          travel(ctx, api, xs[0], route.y, xs[6], route.y, route.arrive, route.color, 11);
        if (i === 1) {
          travel(ctx, api, xs[0], route.y, xs[1], route.y, first, route.color, 11);
          travel(ctx, api, xs[1], route.y, xs[6], route.y, route.arrive, route.color, 11);
        }
        if (i === 2) {
          travel(ctx, api, xs[0], route.y, xs[1], route.y, first, route.color, 11);
          travel(
            ctx,
            api,
            xs[1],
            route.y,
            xs[3],
            route.y,
            step(api, p, 0.16, 0.34),
            route.color,
            11,
          );
          travel(ctx, api, xs[3], route.y, xs[6], route.y, route.arrive, route.color, 11);
        }
        ctx.globalAlpha *= 0.35 + 0.65 * route.arrive;
        M(ctx, api, route.probability, 1770, route.y + 12, 32, route.color, 'right');
        ctx.restore();
      }),
    );
    if (p < 0.62) {
      const boundary = p < 0.13 ? 0 : p < 0.34 ? 1 : 3,
        scores = { 0: '1', 1: '0.15', 3: '0.003' };
      T(
        ctx,
        api,
        'Best accumulated score at boundary ' + boundary + ': ' + scores[boundary],
        960,
        855,
        31,
        C.ink,
      );
    } else {
      M(ctx, api, '\\max(0.30,\\;0.015,\\;0.00009)=0.30', 960, 855, 43, C.green);
    }
    M(ctx, api, '\\max_{\\text{paths}} \\sum_i \\log P(t_i)', 960, 950, 44, C.yellow);
  }
}

function drawSampling(ctx, scene, state, api) {
  const C = api.C;
  T(ctx, api, 'OPTIONAL TRAINING SAMPLING', 960, 280, 33, C.muted);
  const total = UNIGRAM_PATHS.reduce((sum, p) => sum + unigramPathProbability(p), 0);
  let x = 250;
  UNIGRAM_PATHS.forEach((path) => {
    const width = (1420 * unigramPathProbability(path)) / total;
    api.rect(ctx, x, 390, width, 100, C[path.color], undefined, 0);
    x += width;
  });
  T(ctx, api, 'Path probabilities normalized over this input', 960, 340, 30, C.muted);
  focusMark(api, 'unigram-sampling', () => {
    const second = directed(state, api, 'unigram-sample-second', 0.55, 0.8);
    for (const [i, u] of [0.2, 0.98].entries()) {
      const reveal = i ? second : directed(state, api, 'unigram-sample-first', 0.1, 0.3);
      if (reveal <= 0) continue;
      const path = sampleUnigram(u),
        y = 610 + i * 180;
      T(ctx, api, 'draw ' + u.toFixed(2), 390, y + 40, 36, i ? C.blue : C.green);
      const pieces = tokenLayout(path.words, 1120, 35, 24);
      pieces.forEach((box) =>
        chip(ctx, api, box.text, box.x, y, box.width, 90, C[path.color], {
          size: 42,
          alpha: reveal,
        }),
      );
      api.trace(
        ctx,
        [
          { x: 250 + 1420 * u, y: 505 },
          { x: 250 + 1420 * u, y: 540 },
        ],
        reveal,
        C.yellow,
        4,
      );
    }
  });
  T(
    ctx,
    api,
    'Supplied draws illustrate the rule, not expected sample frequencies',
    960,
    1015,
    27,
    C.muted,
  );
}

function drawFallback(ctx, scene, state, api) {
  const C = api.C,
    p = qbeat(state, api),
    beat = state.beat ?? 0;
  const symbols = [
    ['関', 'U+95A2', ['E9', '96', 'A2'], C.yellow],
    ['数', 'U+6570', ['E6', '95', 'B0'], C.pink],
    ['✨', 'U+2728', ['E2', '9C', 'A8'], C.green],
  ];
  if (beat === 0) {
    T(ctx, api, 'UNICODE SYMBOLS', 425, 285, 31, C.muted);
    T(ctx, api, 'UTF-8 BYTES', 1320, 285, 31, C.muted);
    focusMark(api, 'fallback-and-normalization-group-292', () =>
      symbols.forEach(([symbol, codepoint, bytes, color], row) => {
        const y = 350 + row * 150;
        unicodeChip(ctx, api, symbol, 250, y, 150, 88, color);
        T(ctx, api, codepoint, 505, y + 52, 30, color, 'center', 'mono');
        const expand = step(api, p, 0.04 + row * 0.15, 0.3 + row * 0.15);
        api.trace(
          ctx,
          [
            { x: 630, y: y + 44 },
            { x: 1010, y: y + 44 },
          ],
          expand,
          color,
          4,
        );
        focusMark(api, 'fallback-and-normalization-group-294', () =>
          bytes.forEach((byte, i) => {
            const reveal = step(api, p, 0.18 + row * 0.15 + i * 0.05, 0.34 + row * 0.15 + i * 0.05);
            chip(ctx, api, byte, 1080 + i * 170, y, 140, 88, color, { size: 36, alpha: reveal });
          }),
        );
      }),
    );
    T(ctx, api, 'One Unicode character can occupy several byte positions', 960, 900, 32, C.ink);
  } else if (beat === 1) {
    T(ctx, api, 'JOIN THE BYTES BEFORE DECODING UTF-8', 960, 275, 31, C.muted);
    const join = step(api, p, 0.08, 0.6),
      decode = step(api, p, 0.6, 0.88);
    focusMark(api, 'fallback-and-normalization-group-296', () =>
      symbols.forEach(([symbol, codepoint, bytes, color], g) => {
        const center = 480 + g * 480;
        focusMark(api, 'fallback-and-normalization-group-297', () =>
          bytes.forEach((byte, j) => {
            const i = g * 3 + j,
              x = api.lerp(255 + i * 157, center - 160 + j * 112, join),
              y = api.lerp(380, 515, join);
            chip(ctx, api, byte, x, y, 100, 76, color, { size: 31 });
          }),
        );
        const x = center - 165;
        ctx.save();
        ctx.globalAlpha *= join;
        line(ctx, api, x, 615, x + 330, 615, color, 3);
        line(ctx, api, x, 603, x, 615, color, 3);
        line(ctx, api, x + 330, 603, x + 330, 615, color, 3);
        T(ctx, api, codepoint, center, 675, 30, color, 'center', 'mono');
        ctx.restore();
        api.trace(
          ctx,
          [
            { x: center, y: 700 },
            { x: center, y: 740 },
          ],
          decode,
          color,
          4,
        );
        unicodeChip(ctx, api, symbol, center - 80, 775, 160, 95, color, decode);
      }),
    );
    T(
      ctx,
      api,
      'Token boundaries may fall inside a character; byte order preserves its identity',
      960,
      955,
      30,
      C.ink,
    );
  } else {
    T(ctx, api, 'NORMALIZATION CAN CHANGE THE SOURCE CODE POINTS', 960, 275, 30, C.muted);
    focusMark(api, 'normalization-source', () =>
      chip(ctx, api, 'ﬁle', 245, 400, 425, 100, C.pink, { font: 'serif', size: 52 }),
    );
    T(ctx, api, 'U+FB01', 455, 585, 31, C.pink, 'center', 'mono');
    T(ctx, api, 'one fi ligature', 455, 650, 30, C.muted);
    const fold = spokenProgress(
      api,
      'fallback-and-normalization-beat-3-focus-2',
      step(api, p, 0.13, 0.45),
    );
    api.trace(
      ctx,
      [
        { x: 715, y: 450 },
        { x: 1030, y: 450 },
      ],
      fold,
      C.yellow,
      5,
    );
    spokenReveal(api, state, 'fallback-and-normalization-beat-3-focus-2', fold > 0, () =>
      focusMark(api, 'fallback-and-normalization-group-303', () =>
        [...'file'].forEach((letter, i) =>
          focusMark(api, 'fallback-and-normalization-object-304', () =>
            chip(ctx, api, letter, 1100 + i * 115, 410, 90, 90, C.green, { size: 43 }),
          ),
        ),
      ),
    );
    T(
      ctx,
      api,
      'U+0066 + U+0069',
      1325,
      585,
      31,
      C.green,
      'center',
      'mono',
      step(api, p, 0.57, 0.77),
    );
    T(
      ctx,
      api,
      'ordinary f and i',
      1325,
      650,
      30,
      C.muted,
      'center',
      'sans',
      step(api, p, 0.6, 0.8),
    );
    T(ctx, api, 'NFKC compatibility folding example', 960, 790, 33, C.yellow);
    T(ctx, api, 'Test configured normalization when exact code points matter', 960, 910, 30, C.ink);
  }
}

function drawVocabularyEconomics(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b === 0) {
    T(ctx, api, '32,000 ROWS · 4,096 COLUMNS · FP16', 960, 280, 34, C.muted);
    focusMark(api, 'vocabulary-economics-group-308', () => {
      ['INPUT EMBEDDING', 'UNTIED OUTPUT HEAD'].forEach((name, i) => {
        const x = 330 + i * 800;
        T(ctx, api, name, x + 215, 395, 33, i ? C.yellow : C.cyan);
        api.rect(ctx, x, 455, 430, 160, C.panel, i ? C.yellow : C.cyan, 8);
        for (let row = 1; row < 5; row++)
          line(ctx, api, x + 15, 455 + row * 32, x + 415, 455 + row * 32, i ? C.yellow : C.cyan, 2);
        T(ctx, api, '250 MiB', x + 215, 710, 42, i ? C.yellow : C.cyan);
      });
      M(
        ctx,
        api,
        '2\\cdot32{,}000\\cdot4{,}096\\cdot2\\text{ bytes}=500\\text{ MiB}',
        960,
        880,
        42,
        C.ink,
      );
    });
  } else if (b === 1) {
    const grow = directed(state, api, 'vocabulary-economics-beat-2-focus-1', 0.08, 0.55);
    const tied = directed(state, api, 'vocabulary-tied', 0.72, 0.95);
    const rows = Math.round(api.lerp(32000, 128000, grow)),
      h = api.lerp(78, 312, grow);
    T(ctx, api, 'THE VOCABULARY GROWS BOTH TABLES', 960, 280, 34, C.muted);
    focusMark(api, 'vocabulary-economics-group-312', () =>
      ['INPUT EMBEDDING', 'OUTPUT HEAD'].forEach((name, i) => {
        const x = 380 + i * 730;
        T(ctx, api, name, x + 215, 365, 32, i ? C.yellow : C.cyan);
        ctx.save();
        ctx.globalAlpha *= i ? 1 - tied : 1;
        api.rect(ctx, x, 420, 430, h, C.panel, i ? C.yellow : C.cyan, 8);
        const count = Math.round(api.lerp(4, 16, grow));
        for (let row = 1; row < count; row++)
          line(
            ctx,
            api,
            x + 15,
            420 + (row * h) / count,
            x + 415,
            420 + (row * h) / count,
            i ? C.yellow : C.cyan,
            1.5,
          );
        ctx.restore();
      }),
    );
    focusMark(api, 'vocabulary-economics-label-314', () =>
      T(ctx, api, rows.toLocaleString('en-US') + ' vocabulary rows', 960, 810, 37, C.ink),
    );
    const memory = ((tied === 1 ? 1 : 2) * rows * 4096 * 2) / 1024 ** 2;
    T(
      ctx,
      api,
      (tied > 0 && tied < 1 ? 'Sharing storage' : memory.toLocaleString('en-US') + ' MiB') +
        (tied === 1 ? ' · one shared table' : ''),
      960,
      910,
      41,
      tied === 1 ? C.green : C.pink,
    );
  } else {
    T(ctx, api, 'A LEARNED PIECE CAN SAVE A POSITION', 960, 285, 33, C.muted);
    const merge = directed(state, api, 'vocabulary-economics-beat-3-focus-1', 0.12, 0.5);
    focusMark(api, 'vocabulary-economics-object-315', () =>
      morphTokens(
        ctx,
        api,
        ['play', 'ground'],
        ['playground'],
        merge,
        960,
        445,
        [C.cyan, C.green],
        { size: 54, advance: 34, height: 120 },
      ),
    );
    T(
      ctx,
      api,
      merge === 1 ? '1 model position' : '2 model positions',
      960,
      710,
      45,
      merge === 1 ? C.green : C.cyan,
    );
    T(ctx, api, 'More learned rows can buy a shorter sequence', 960, 860, 34, C.ink);
    T(ctx, api, 'Measure your languages, code and numbers', 960, 980, 31, C.muted);
  }
}

function drawSerializedRequest(ctx, api, build) {
  const C = api.C,
    groups = requestGroups(),
    total = groups.reduce((sum, g) => sum + g.count, 0),
    start = 250,
    stride = 175;
  T(ctx, api, '7-POSITION TOY WINDOW', 960, 285, 35, C.muted);
  api.rect(ctx, 230, 510, 7 * stride, 155, undefined, C.blue, 0);
  line(ctx, api, 1455, 485, 1455, 705, C.pink, 4);
  let offset = 0,
    count = 0;
  groups.forEach((g, i) => {
    const visible = g.message
      ? 1
      : step(api, build, [0, 0.08, 0.34, 0, 0.7][i], [0.25, 0.42, 0.6, 1, 1][i]);
    const color = C[g.color];
    if (!g.message && visible <= 0) {
      offset += g.count;
      return;
    }
    for (let j = 0; j < g.count; j++) {
      const full = start + (offset + j) * stride;
      const x = full;
      const filled = g.message || j < Math.floor(visible * g.count + 0.00001);
      if (filled) count++;
      api.rect(ctx, x, 545, 120, 85, filled ? color : C.panel, filled ? undefined : C.muted, 9);
      if (g.message) T(ctx, api, ['play', 's'][j], x + 60, 600, 35, C.bg, 'center', 'mono');
    }
    if (visible > 0)
      T(
        ctx,
        api,
        g.label,
        start + (offset + (g.count - 1) / 2) * stride + 60,
        430,
        i === 1 ? 26 : 29,
        color,
      );
    offset += g.count;
  });
  T(ctx, api, count + ' illustrative positions', 960, 785, 44, count > 7 ? C.pink : C.cyan);
  if (build === 1) {
    M(ctx, api, total + ' > 7', 960, 900, 60, C.pink);
    T(ctx, api, 'The complete request overflows by 1', 960, 1000, 34, C.pink);
  } else
    T(
      ctx,
      api,
      build === 0 ? 'The visible message uses 2' : 'The template uses positions too',
      960,
      945,
      35,
      C.muted,
    );
}

function drawCheckpoint(ctx, scene, state, api) {
  const C = api.C,
    b = state.beat ?? 0;
  if (b === 0) {
    T(ctx, api, 'SAME SPELLING, DIFFERENT MATCHING RULE', 960, 280, 33, C.muted);
    focusMark(api, 'special-control-role', () =>
      chip(ctx, api, '<turn>', 290, 390, 520, 110, C.pink, { size: 55 }),
    );
    focusMark(api, 'ordinary-text-role', () =>
      chip(ctx, api, '<turn>', 1110, 390, 520, 110, C.cyan, { size: 55 }),
    );
    const match = directed(state, api, 'checkpoint-bundle-beat-2-focus-1', 0.15, 0.4),
      literal = directed(state, api, 'checkpoint-literal-spelling', 0.5, 0.78);
    if (match > 0) {
      api.trace(
        ctx,
        [
          { x: 550, y: 520 },
          { x: 550, y: 650 },
        ],
        match,
        C.pink,
        4,
      );
      chip(ctx, api, 'control ID', 290, 680, 520, 110, C.pink, { size: 44, alpha: match });
    }
    if (literal > 0) {
      api.trace(
        ctx,
        [
          { x: 1370, y: 520 },
          { x: 1370, y: 650 },
        ],
        literal,
        C.cyan,
        4,
      );
      ['<', 'turn', '>'].forEach((piece, i) =>
        chip(ctx, api, piece, 1095 + i * 190, 680, 170, 110, C.cyan, { size: 41, alpha: literal }),
      );
    }
    T(
      ctx,
      api,
      'Trusted control matching and literal user text are distinct roles',
      960,
      965,
      30,
      C.muted,
    );
  } else {
    const build = directed(state, api, 'request-template', 0.42, 0.8);
    focusMark(api, 'request-construction', () => drawSerializedRequest(ctx, api, build));
  }
}

const renderers = {
  'opening-motivation': drawIntro,
  'model-input': drawModelInput,
  'embedding-contract': drawEmbedding,
  granularity: drawGranularity,
  'sequence-cost': drawSequenceCost,
  'bpe-count': drawCorpus,
  'bpe-merges': drawMerges,
  'bpe-encoding': drawBpeEncoding,
  'wordpiece-training': drawWordpieceTraining,
  'wordpiece-encoding': drawWordpieceEncoding,
  'sentencepiece-whitespace': drawWhitespace,
  'unigram-training': drawUnigramTraining,
  'unigram-encoding': drawUnigramEncoding,
  'fallback-and-normalization': drawFallback,
  'vocabulary-economics': drawVocabularyEconomics,
  'checkpoint-bundle': drawCheckpoint,
};

export function validateModel() {
  assert.equal(remapExample(1).complete, true);
  assert.equal(unigramRemovalEvidence('ous').lossIncrease, 0);
  assert(unigramRemovalEvidence('▁house').lossIncrease > 3);
  assert.deepEqual(sampleUnigram(0.98).words, ['▁', 'house']);
  assert.equal(
    requestGroups().reduce((n, g) => n + g.count, 0),
    8,
  );
  assert.deepEqual(
    bpeRecountEvidence().map((row) => row.contributions),
    [
      [3, 2, 0],
      [3, 2, 0],
    ],
  );
  assert.deepEqual(
    bpeRecountEvidence().map((row) => row.total),
    [5, 5],
  );
  assert.equal(bpeRecountEvidence()[0].left, 'pl');
  assert.deepEqual(BPE_TRAINING.merges, [
    { left: 'p', right: 'l', merged: 'pl', count: 7 },
    { left: 'pl', right: 'a', merged: 'pla', count: 5 },
    { left: 'pla', right: 'y', merged: 'play', count: 5 },
  ]);
  assert.equal(BPE_INITIAL_PAIRS.get('p\0l'), 7);
  assert.equal(BPE_INITIAL_PAIRS.get('l\0a'), 5);
  assert.equal(BPE_INITIAL_PAIRS.get('a\0y'), 5);
  assert.equal(BPE_INITIAL_PAIRS.get('l\0o'), 2);
  assert.equal(BPE_AFTER_FIRST_PAIRS.get('pl\0a'), BPE_AFTER_FIRST_PAIRS.get('a\0y'));
  assert.deepEqual(BPE_OUTPUT, ['pl', 'u', 'm', 's']);
  assert.deepEqual(encodeBpe('plays', BPE_TRAINING.merges), ['play', 's']);
  assert.deepEqual(encodeBpe('plot', BPE_TRAINING.merges), ['pl', 'o', 't']);
  for (const row of BPE_TRAINING.rows) assert.equal(row.tokens.join(''), row.word);

  const candidates = new Set(UNIGRAM_CANDIDATES.map(([piece]) => piece));
  for (const path of UNIGRAM_PATHS) {
    assert.equal(path.boundaries.length, path.words.length + 1);
    assert.equal(path.widths.length, path.words.length);
    assert.equal(path.probabilities.length, path.words.length);
    assert.equal(path.words.join(''), '▁house');
    assert.equal(path.boundaries[0], 0);
    assert.equal(path.boundaries.at(-1), 6);
    assert(
      path.words.every((piece) => candidates.has(piece)),
      'each displayed route uses a trained candidate piece',
    );
    assert(path.widths.every((width) => Number.isFinite(width) && width > 0));
  }
  assert.equal(formatUnigramPathProbability(UNIGRAM_PATHS[0]), '0.30');
  assert.equal(formatUnigramPathProbability(UNIGRAM_PATHS[1]), '0.15\\times0.10=0.015');
  assert.equal(
    formatUnigramPathProbability(UNIGRAM_PATHS[2]),
    '0.15\\times0.02\\times0.03=0.00009',
  );

  const labels = ['▁house', 'play', '漢'];
  const boxes = tokenLayout(labels, 960, 24, 16);
  assert.deepEqual(
    boxes.map((box) => box.text),
    labels,
  );
  for (const box of boxes)
    assert(Number.isFinite(box.x) && Number.isFinite(box.width) && box.width > 0);
  for (let i = 1; i < boxes.length; i++) assert(boxes[i].x >= boxes[i - 1].x + boxes[i - 1].width);
  const rowCenter = (boxes[0].x + boxes.at(-1).x + boxes.at(-1).width) / 2;
  assert(Math.abs(rowCenter - 960) < 1e-9);

  for (const id of ['81', '421', '907']) {
    const values = embeddingValues(id);
    assert.equal(values.length, EMBEDDING_BASE.length);
    assert(values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.deepEqual(
      [...values].sort((a, b) => a - b),
      [...EMBEDDING_BASE].sort((a, b) => a - b),
    );
  }
  return true;
}

export function draw(ctx, scene, state, api) {
  const render = renderers[scene.id];
  if (!render) throw new Error(`No tokenization animation for scene ${scene.id}`);
  ctx.save();
  render(ctx, scene, state, api);
  ctx.restore();
}
