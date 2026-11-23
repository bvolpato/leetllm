import {
  attentionScores,
  batch,
  dotTerms,
  headLayout,
  headWidth,
  modelHeadCount,
  modelWidth,
  proof,
  sentenceWords,
  zeroBatch,
} from './examples.mjs';
import {
  beat,
  brace,
  brass,
  clamp,
  composingStick,
  cue,
  dim,
  foot,
  frame,
  galley,
  ink,
  line,
  milk,
  mix,
  mono,
  name,
  paper,
  row,
  sort,
  spokenClause,
  stock,
  teal,
  text,
  tray,
} from './typecase.mjs';

function scoreGrid(
  c,
  batchId,
  x,
  y,
  w,
  h,
  { visible = () => true, focus = () => false, highlight = false } = {},
) {
  const words = sentenceWords[batchId],
    grid = attentionScores[batchId];
  tray(c, x - 4, y - 4, 3 * w + 8, 3 * h + 10);
  words.forEach((word, i) => {
    text(c, word, x + (i + 0.5) * w, y - 16, 16, stock[3 * batchId + i], 'center', 'Sans', w - 4);
    name(c, word, x - 12, y + (i + 0.47) * h, 19, stock[3 * batchId + i], 'right', 84);
  });
  grid.forEach((r, t) =>
    r.forEach((v, j) => {
      const active = focus(t, j),
        shown = visible(t, j);
      const col = active ? '#eac481' : highlight ? '#83948d' : '#cecdba';
      sort(c, x + j * w, y + t * h, w, h, shown ? v : null, shown ? col : '#45544d', active);
    }),
  );
}
function operands(c, k) {
  const b = beat(k);
  name(c, 'Query · migrate', 163, 125, 26, stock[1]);
  row(c, batch[0][1], 163, 156, 64, 51, stock[1]);
  const keys = cue(k, 1, 'The same snippet supplies', 0.8);
  c.save();
  c.globalAlpha = keys;
  name(c, 'Keys · sentence 0', 685, 125, 25, milk, 'center');
  galley(c, batch[0], sentenceWords[0], 623, 154, 58, 47);
  c.restore();
  if (b === 1) {
    text(c, 'One query, three candidate keys', 291, 284, 23, milk, 'center');
    foot(
      c,
      cue(k, 1, 'Here we use identity matrices', 0.5)
        ? 'Identity projections    Q = X      K = X'
        : 'Migrate supplies the query vector.',
    );
  }
}
export function scores(c, k) {
  const b = beat(k);
  if (b === 1) {
    operands(c, k);
    return;
  }
  if (b === 2) {
    const activations = [
      cue(k, 2, 'First use Birds', 2.2),
      cue(k, 2, 'Then slide to migrate', 1.05),
      cue(k, 2, 'Now try south', 3.2),
    ];
    const key = activations[2] > 0 ? 2 : activations[1] > 0 ? 1 : 0,
      p = activations[key];
    const terms = dotTerms(key),
      n = Math.floor(4 * p);
    name(c, 'migrate', 170, 167, 25, stock[1], 'right');
    name(c, sentenceWords[0][key], 170, 239, 25, stock[key], 'right');
    row(c, batch[0][1], 190, 141, 64, 49, stock[1]);
    row(c, batch[0][key], 190, 216, 64, 49, stock[key]);
    for (let i = 0; i < 4; i++) {
      mono(c, '×', 222 + 64 * i, 203, 18, dim, 'center');
      if (i < n) mono(c, terms[i], 222 + 64 * i, 297, 25, milk, 'center');
    }
    if (n)
      mono(
        c,
        'sum  ' + terms.slice(0, n).reduce((a, v) => a + v, 0),
        318,
        352,
        26,
        brass,
        'center',
      );
    name(c, 'Query × key', 714, 119, 25, milk, 'center');
    scoreGrid(c, 0, 620, 180, 74, 53, {
      visible: (t, j) => t === 1 && activations[j] === 1,
      focus: (t, j) => t === 1 && j === key,
    });
    foot(c, 'Four matching feature products contribute to each score.');
    return;
  }
  if (b === 5 && cue(k, 5, 'swap the last two axes', 0.4) > 0) {
    name(c, 'Query · migrate', 232, 128, 25, stock[1], 'center');
    row(c, batch[0][1], 99, 176, 67, 58, stock[1]);
    brace(c, 99, 254, 268, 'four features', teal);
    name(c, 'Transposed keys · sentence 0', 660, 122, 24, milk, 'center');
    const progress = cue(k, 5, 'swap the last two axes', 1.3);
    const xx = 550,
      yy = 183,
      w = 65,
      h = 42;
    sentenceWords[0].forEach((word, j) =>
      text(c, word, xx + (j + 0.5) * w, yy - 17, 16, stock[j], 'center'),
    );
    for (let d = 0; d < 4; d++) {
      mono(c, 'f' + d, xx - 13, yy + d * h + 18, 16, dim, 'right');
      for (let j = 0; j < 3; j++)
        if (j * 4 + d < Math.floor(progress * 12))
          sort(c, xx + j * w, yy + d * h, w, h, batch[0][j][d], stock[j], j === 2);
    }
    if (progress === 1)
      mono(
        c,
        'migrate × south    ' + dotTerms(2).join(' + ') + ' = ' + attentionScores[0][1][2],
        480,
        392,
        20,
        teal,
        'center',
      );
    foot(c, '(3, 4) @ (4, 3)    →    (3, 3) per sentence');
    return;
  }
  const both = b >= 4,
    diag = b === 6;
  const build = cue(k, 3, 'Birds and south each get a turn', 3);
  const other = cue(k, 4, 'Build the second grid', 3.5);
  const keyOrder = [0, 2];
  for (let s = 0; s < (both ? 2 : 1); s++) {
    const x = both ? (s ? 629 : 165) : 240,
      w = both ? 76 : 93;
    name(c, 'Sentence ' + s, x + 1.5 * w, 127, 26, milk, 'center');
    const visible = (t, j) =>
      s
        ? t * 3 + j < Math.floor(other * 9)
        : t === 1 || keyOrder.indexOf(t) * 3 + j < Math.floor(build * 6);
    scoreGrid(c, s, x, 194, w, 54, {
      visible,
      focus: (t, j) => (diag ? t === j : !s && t === 1),
      highlight: diag,
    });
  }
  if (!both) {
    name(c, 'Each query gets a row.', 648, 209, 23);
    name(c, 'Each key gets a column.', 648, 259, 23);
  }
  if (b === 5) text(c, 'migrate’s row ends at south.', 480, 391, 24, teal, 'center');
  if (diag)
    text(c, '(q * k).sum(axis=-1) gives the highlighted diagonal.', 480, 391, 20, milk, 'center');
  foot(
    c,
    diag
      ? 'Same-position products    (B, T) = (2, 3)'
      : b === 3
        ? 'Scores    (B, query, key) = (2, 3, 3)'
        : 'q @ k.swapaxes(-1, -2)    →    one grid per sentence',
  );
}

export function caller(c, k) {
  const p = cue(k, 2, 'Read its last cell', 0.9);
  const x = 158,
    y = 171,
    w = 79,
    h = 57;
  name(c, 'Sentence 0 · scores', x + 1.5 * w, 119, 26, milk, 'center');
  scoreGrid(c, 0, x, y, w, h, { focus: (t, j) => t === 1 && j === 2 });
  if (p) frame(c, x - 3, y + h - 1, w * 3 + 5, h + 1);
  paper(c, 490, 127, 390, 216);
  mono(c, 'scores[0, 1:2, :]', 685, 168, 25, ink, 'center');
  if (p === 0) {
    text(c, 'Shape at the caller?', 685, 245, 24, ink, 'center');
  } else {
    const startX = 560,
      yy = mix(207, 222, p);
    const result = attentionScores[0].slice(1, 2);
    c.save();
    c.globalAlpha = p;
    row(c, result[0], startX, yy, 82, 55, '#bfd2c0', 2);
    mono(c, '(' + result.length + ', ' + result[0].length + ')', 685, 309, 26, ink, 'center');
    c.restore();
  }
  foot(
    c,
    p === 1 ? '1 query row × 3 key columns' : 'Integer batch index     query slice     all keys',
  );
}

function splitConstruction(c, k) {
  const b = beat(k);
  const direct = cue(k, 3, 'Fill two places', 3.4);
  const rewind = cue(k, 4, 'Wind back', 1);
  const move = cue(k, 4, 'Watch the right halves slide', 3);
  const opening = b <= 2,
    demonstrateDirect = rewind < 1;
  const start = 185,
    end = [511, 698],
    y = 196,
    w = 46,
    h = 46,
    step = 61;
  name(c, 'Sentence 0', 235, 121, 25, milk, 'center');
  text(c, 'Source word', 124, y - 29, 16, dim, 'right');
  if (opening) {
    galley(c, batch[0], sentenceWords[0], 145, 186, 54, 54);
    composingStick(c, 138, 179, 228, 174);
    paper(c, 452, 113, 442, 267);
    text(c, 'Requested output slot', 474, 147, 18, ink);
    name(c, 'head 0  ·  migrate', 474, 192, 33, ink);
    if (cue(k, 1, 'We have two ways', 0.3))
      mono(c, '(B, H, T, d) = (2, 2, 3, 2)', 474, 242, 20, ink);
    line(c, 474, 273, 867, 273, '#ab9f83');
    text(
      c,
      'Fill in head order, or split each word first?',
      474,
      321,
      18,
      ink,
      'left',
      'Sans',
      396,
    );
    if (b === 2) frame(c, 144, 239, 108, 54);
    foot(
      c,
      b === 2
        ? 'Which layout gives migrate its own first pair?'
        : 'Feature width / head count = features per head',
    );
    return;
  }
  text(c, 'Output word', 821, y - 32, 16, dim);
  const rightHalf = clamp(move * 1.65);
  const leftHalf = clamp((move - 0.6) / 0.4);
  for (let head = 0; head < 2; head++) {
    name(c, 'head ' + head, end[head] + w, y - 32, 24, milk, 'center');
    c.save();
    if (!demonstrateDirect && head === 0) c.globalAlpha = 0.28 + 0.72 * clamp(leftHalf * 5);
    tray(c, end[head] - 4, y - 5, 2 * w + 8, step * 2 + h + 9);
    c.restore();
  }
  for (let t = 0; t < 3; t++) {
    name(c, sentenceWords[0][t], start - 14, y + t * step + 20, 22, stock[t], 'right');
    name(c, sentenceWords[0][t], 821, y + t * step + 20, 19, dim);
    row(c, batch[0][t], start, y + t * step, w, h, stock[t]);
    if (rewind === 1) {
      frame(c, start - 1, y + t * step - 1, w * 2, h, brass);
      frame(c, start + w * 2 + 1, y + t * step - 1, w * 2 - 1, h, teal);
    }
  }
  const layout = headLayout(batch, demonstrateDirect)[0];
  for (let head = 0; head < 2; head++)
    for (let t = 0; t < 3; t++) {
      const pair = layout[head][t],
        flatIndex = pair[0],
        sourceT = Math.floor(flatIndex / 4);
      const progress = demonstrateDirect
        ? clamp(direct * 6 - (head * 3 + t))
        : head === 1
          ? rightHalf
          : leftHalf;
      if (progress <= 0) continue;
      const lane = demonstrateDirect && head === 1 ? end[0] + 2 * w + 4 : start + 4 * w + 12;
      const changesRow = sourceT !== t;
      const travel = changesRow ? clamp((progress - 0.35) / 0.65) : progress;
      const x = mix(lane, end[head], travel);
      const yy = y + mix(sourceT, t, changesRow ? clamp(progress / 0.35) : 1) * step;
      c.save();
      c.globalAlpha = clamp(progress * 6) * (demonstrateDirect ? 1 - rewind : 1);
      row(c, pair, x, yy, w, h, stock[sourceT]);
      c.restore();
    }
  foot(
    c,
    demonstrateDirect
      ? 'x.reshape(B, H, T, d)'
      : move === 0
        ? 'x.reshape(B, T, H, d)'
        : 'x.reshape(B, T, H, d).transpose(0, 2, 1, 3)',
  );
}

export function modelHead(c, k) {
  const width = headWidth(modelWidth, modelHeadCount);
  const head = 1;
  name(c, 'One word · ' + modelWidth + ' features', 480, 130, 30, milk, 'center');
  const start = 83,
    w = 66;
  for (let h = 0; h < modelHeadCount; h++) {
    sort(c, start + w * h, 210, w, 73, h, h === head ? stock[3] : '#abb6a4', h === head);
  }
  text(c, 'Head', 52, 245, 17, dim, 'right');
  brace(c, start + w * head, 305, w, 'head ' + head, brass);
  const resolved = cue(k, 11, 'of that same word', 0.55);
  mono(
    c,
    resolved
      ? modelWidth + ' / ' + modelHeadCount + ' = ' + width + ' features per head'
      : modelWidth + ' features across ' + modelHeadCount + ' equal groups',
    480,
    374,
    23,
    milk,
    'center',
  );
  if (resolved) {
    foot(c, `heads[b, ${head}, t]    ↔    x[b, t, ${head * width}:${(head + 1) * width}]`);
  } else {
    foot(c, 'heads[b, 1, t]    ↔    x[b, t, start:stop]');
  }
}

function compareProofs(c, k) {
  const b = beat(k);
  const newCase = b >= 6,
    seq = newCase ? 1 : 0,
    tok = newCase ? 0 : 1,
    head = newCase ? 1 : 0;
  const restored = cue(k, 10, 'Restore the distinct values', 0.65) === 1;
  const zeros = (b === 9 || b === 10) && !restored;
  const input = zeros ? zeroBatch : batch,
    report = proof(input, seq, head, tok);
  const showCandidates =
    b === 5
      ? cue(k, 5, 'Those are the last two numbers', 0.65) > 0
      : b === 6 || b === 9
        ? false
        : b === 10
          ? spokenClause(k, 'Both lines pass') === 1
          : b !== 7;
  const shownTest =
    (b === 8 && spokenClause(k, 'Only the split followed by the transpose passes') === 1) ||
    (b === 10 && showCandidates) ||
    b === 11;
  const transfer = b === 7 && [
    spokenClause(k, 'The direct reshape gives eighteen and nineteen instead') === 1,
    spokenClause(k, 'Compare the same slot in each candidate') === 1,
  ];
  const target = sentenceWords[seq][tok],
    slot = 'heads[' + [seq, head, tok].join(', ') + ']';
  name(c, 'Sentence ' + seq, 241, 124, 24, milk, 'center');
  galley(c, input[seq], sentenceWords[seq], 142, 168, 53, 52, seq);
  if (b !== 6 && (!zeros || shownTest)) frame(c, 141 + 106 * head, 166 + tok * 52, 106, 54, brass);
  mono(
    c,
    'x[' + [seq, tok].join(', ') + ', ' + (head ? '2:' : ':2') + ']',
    246,
    363,
    19,
    milk,
    'center',
  );
  const x = 455,
    width = 423;
  paper(c, x, 108, width, 277);
  mono(c, slot, x + 18, 136, 22, ink);
  line(c, x + 18, 158, x + width - 18, 158, '#b6a689');
  ['Direct reshape', 'Split, then transpose'].forEach((label, i) => {
    const yy = 189 + i * 88;
    text(c, label, x + 18, yy, 17, ink);
    if (showCandidates || (transfer && transfer[i])) {
      const pair = report.actual[i];
      const owner = Math.floor((pair[0] % 12) / 4) + seq * 3;
      row(c, pair, x + 191, yy - 18, 51, 43, zeros ? '#c6c5b7' : stock[owner]);
      if (shownTest) mono(c, report.passes[i] ? 'PASS' : 'FAIL', x + 333, yy + 2, 19, ink);
    } else mono(c, '[ ?  ? ]', x + 239, yy + 2, 21, ink, 'center');
  });
  text(c, 'Expected', x + 18, 348, 17, ink);
  const expected =
    b !== 6 &&
    (b !== 7 || spokenClause(k, 'The second half of Children is fourteen and fifteen') === 1);
  mono(c, expected ? report.wanted.join(', ') : '?', x + 242, 348, 23, ink, 'center');
  const lineText =
    b === 6
      ? 'Which pair should head 1 receive from Children?'
      : b === 9
        ? 'All-zero input. Would this test detect a misplaced pair?'
        : b === 11
          ? 'A numbered fixture makes the source word traceable.'
          : shownTest
            ? 'np.array_equal(' +
              slot +
              ', x[' +
              seq +
              ', ' +
              tok +
              ', ' +
              (head ? '2:' : ':2') +
              '])'
            : 'Compare each candidate with ' + target + '’s original features.';
  foot(c, lineText);
}
export function heads(c, k) {
  if (beat(k) <= 4) splitConstruction(c, k);
  else compareProofs(c, k);
}
