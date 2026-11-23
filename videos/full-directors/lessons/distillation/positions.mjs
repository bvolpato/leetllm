import {
  C,
  paper,
  heading,
  text,
  serif,
  num,
  rect,
  line,
  dot,
  beat,
  at,
  mix,
  percent,
  signed,
  pathLine,
} from './studio.mjs';
import {
  vocab,
  masses,
  remap,
  batchLosses,
  sum,
  mean,
  projectionFixture,
  prefixWords,
  prefixRows,
} from './examples.mjs';
import { vignette } from './engravings.mjs';

export function alignment(g, k) {
  paper(g);
  const b = beat(k);
  if (b < 3) {
    const t = at(k, 2, 'Move the probability', 1.5),
      remapped = remap(vocab[0], masses, vocab[1]);
    heading(g, 'One prefix   /   two vocabulary orders', 'Which column owns bird?');
    text(g, 'Teacher IDs', 120, 356, 39, C.blue);
    text(g, 'Student IDs', 120, 746, 39, C.green);
    [700, 1420].forEach((x, i) => {
      for (const [j, y] of [
        [0, 330],
        [1, 720],
      ]) {
        serif(g, vocab[j][i], x, y + 15, 62, C.root, 'center');
        num(g, 'ID ' + i, x, y + 52, 32, C.muted, 'center');
      }
      const dest = i ? 700 : 1420;
      line(g, x, 438, dest, 610, C.edge, 4);
      const dx = mix(x, dest, t),
        dy = mix(438, 610, t) + (i ? -1 : 1) * 72 * Math.sin(Math.PI * t);
      dot(g, dx, dy, 52, i ? C.green : C.blue);
      num(g, masses[i].toFixed(1), dx, dy + 14, 38, C.white, 'center');
    });
    if (t === 1)
      num(
        g,
        'Student-coordinate target    [' + remapped.join(', ') + ']',
        960,
        889,
        43,
        C.green,
        'center',
      );
    return;
  }
  if (b < 6) {
    heading(g, 'Same token sequence in both models', 'Which prefix predicts each answer?');
    const tokens = ['BOS', 'prompt', 'answer 1', 'answer 2', 'PAD'],
      xs = tokens.map((_, i) => 253 + i * 346);
    tokens.forEach((s, i) => {
      const valid = i === 1 || (i === 2 && b >= 4),
        x = xs[i];
      num(g, String(i), x, 351, 35, C.muted, 'center');
      rect(g, x - 148, 386, 296, 103, valid ? '#c3ddcb' : C.edge);
      serif(g, s, x, 458, 43, C.root, 'center');
    });
    [1, 2].forEach((i, j) => {
      if (j === 1 && b < 4) return;
      const from = xs[i],
        to = xs[i + 1],
        y = 568 + j * 142;
      if (j || at(k, 3, 'For the hard label')) {
        pathLine(
          g,
          [
            [from, y - 18],
            [from, y],
            [to, y],
            [to, y - 22],
          ],
          C.gold,
          5,
        );
        text(g, 'hard label ' + (i + 1), to, y + 41, 32, C.gold, 'center');
      }
      if (j || at(k, 3, 'For the soft target')) {
        dot(g, from, y, 10, C.blue);
        text(g, 'KL at ' + i, from, y + 42, 33, C.blue, 'center');
      }
    });
    text(
      g,
      b >= 5
        ? 'Attention mask controls padding access. The response mask selects loss positions.'
        : 'Response targets only    ·    prompt and padding excluded',
      960,
      889,
      35,
      C.muted,
      'center',
    );
    return;
  }
  const empty = at(k, 9, 'every target is masked'),
    reduced = at(k, 7, 'global token mean');
  heading(
    g,
    'Reduction   /   one vote per valid target',
    empty ? 'Zero valid tokens' : 'What belongs in the denominator?',
  );
  const x = [280, 822, 1168, 1514];
  batchLosses.flat().forEach((v, i) => {
    dot(g, x[i], 557, 95, empty ? C.edge : i ? C.blue : C.green);
    num(g, empty ? '×' : v.toFixed(1), x[i], 575, 54, empty ? C.muted : C.white, 'center');
  });
  text(g, 'Microbatch 1', 280, 375, 37, C.green, 'center');
  text(g, 'Microbatch 2', 1168, 375, 37, C.blue, 'center');
  if (empty) {
    serif(g, 'Skip the optimizer step.', 125, 824, 72);
    text(g, 'AdamW can decay weights with a zero gradient tensor.', 125, 904, 37, C.muted);
  } else if (reduced) {
    num(
      g,
      '(' +
        batchLosses
          .flat()
          .map((v) => v.toFixed(1))
          .join(' + ') +
        ') / 4 = ' +
        mean(batchLosses.flat()).toFixed(2),
      125,
      813,
      54,
      C.green,
    );
    text(
      g,
      'Equal weight per microbatch would give ' + mean(batchLosses.map(mean)).toFixed(2),
      125,
      904,
      37,
      C.muted,
    );
  } else text(g, 'Flatten valid tokens × vocabulary before batchmean.', 135, 845, 49, C.root);
}

export function projection(g, k) {
  paper(g, true);
  const moved = at(k, 4, 'changes the last two rows', 0.95),
    fresh = at(k, 8, 'At another token');
  const f = projectionFixture(moved, !!fresh);
  const hidden = !!fresh && !at(k, 9, 'One point eight');
  const showSse = at(k, 3, 'for a total of two') && !hidden;
  heading(
    g,
    'Feature distillation   /   detached teacher',
    fresh ? 'Try the learned projection on another token.' : 'Fit three rows to one held token.',
    true,
  );
  num(g, 'h = [' + f.h.join(', ') + ']', 137, 307, 46, C.teal);
  text(g, 'Weights × held features', 135, 402, 32, C.faint);
  text(g, 'Projected coordinate', 802, 402, 32, C.faint);
  const x = (v) => 806 + v * 257;
  f.A.forEach((row, i) => {
    const y = 513 + i * 140,
      output = f.output[i],
      target = f.target[i];
    num(g, '[' + row.map((v) => v.toFixed(2)).join('   ') + ']', 134, y + 11, 42, C.white);
    line(g, x(0), y, x(3.5), y, '#557269', 5);
    for (let v = 0; v <= 3; v++) line(g, x(v), y - 9, x(v), y + 9, '#9eafa0', 3);
    line(g, x(target), y - 37, x(target), y + 32, C.brass, 6);
    num(g, String(target), x(target), y - 48, 31, C.brass, 'center');
    if (!hidden) {
      dot(g, x(output), y, 17, C.teal);
      num(g, output.toFixed(2), x(output), y + 53, 33, C.teal, 'center');
    } else num(g, '?', 1715, y + 14, 39, C.teal);
  });
  if (beat(k) === 4 && moved === 0)
    num(
      g,
      'Row gradients    ' + f.gradient.map((row) => '[' + row.join(', ') + ']').join('    '),
      132,
      942,
      37,
      C.white,
    );
  else if (showSse) num(g, 'Σ gap² = ' + f.sse.toFixed(2), 136, 938, 42, C.white);
  if (beat(k) !== 4 || moved > 0)
    text(
      g,
      hidden
        ? 'Predict the middle output before lifting the cover.'
        : 'Gold tick  teacher     •     Green dot  projection',
      1770,
      938,
      34,
      C.faint,
      'right',
    );
}

const saved = ['bird', 'in', 'the', 'garden'];
export function response(g, k) {
  paper(g);
  const index = at(k, 2, 'With “the” appended')
    ? 3
    : at(k, 2, 'Then use the prefix')
      ? 2
      : at(k, 2, 'Advance one word')
        ? 1
        : 0;
  heading(g, 'Response distillation   /   text-only teacher', 'The child saw a');
  vignette(g, 0, 119, 272, 670, 437, true);
  text(g, 'Reviewed continuation', 873, 326, 35, C.muted);
  let x = 873;
  saved.forEach((s, i) => {
    g.font = '400 58px "Lesson Serif"';
    const w = g.measureText(s).width + 28;
    if (beat(k) >= 2 && i === index) rect(g, x - 6, 386, w, 90, '#e4c982');
    serif(g, s, x, 452, 58);
    x += w + 12;
  });
  if (beat(k) >= 2) {
    text(g, 'Context', 870, 586, 32, C.green);
    serif(g, 'The child saw a ' + saved.slice(0, index).join(' '), 870, 655, 49);
    text(g, 'Next target', 870, 742, 32, C.green);
    serif(g, saved[index], 870, 828, 74);
  } else text(g, 'Student tokenizer    ·    one token per word here', 871, 615, 34, C.muted);
  if (beat(k) === 3)
    text(
      g,
      'Verify each alternate response before using its words as targets.',
      121,
      925,
      39,
      C.green,
    );
}

export function prefixes(g, k) {
  paper(g);
  const visited = at(k, 2, 'student picks dog'),
    extended = at(k, 2, 'near the gate'),
    ask = at(k, 2, 'ask the teacher');
  heading(g, 'Conditional prediction', 'The child saw a');
  const rows = [
    { word: 'bird', rest: 'in the garden', name: 'Saved path', pic: 0 },
    { word: 'dog', rest: extended ? 'near the gate' : '', name: 'Student path', pic: 1 },
  ];
  rows.forEach((r, i) => {
    const y = 292 + i * 303;
    text(g, r.name, 124, y + 29, 33, i ? C.green : C.blue);
    if (i && !visited) {
      line(g, 398, y + 99, 1770, y + 99, C.edge, 3);
      return;
    }
    vignette(g, r.pic, 395, y, 281, 162);
    serif(g, r.word, 739, y + 61, 69);
    serif(g, r.rest, 739, y + 132, 48, C.muted);
    const ready = !i || ask;
    text(g, 'Teacher after ' + r.word, 1260, y + 24, 35, i ? C.green : C.blue);
    prefixWords.forEach((s, j) => {
      text(g, s, 1260, y + 74 + j * 43, 28);
      if (ready) {
        const p = prefixRows[i][j];
        rect(g, 1395, y + 52 + j * 43, 330 * p, 21, i ? C.green : C.blue);
        num(g, p.toFixed(2), 1768, y + 74 + j * 43, 29, C.root, 'right');
      }
    });
  });
  if (beat(k) >= 3)
    text(
      g,
      'Prefix collection chooses where to compare. KL direction chooses how to count the mismatch.',
      124,
      947,
      33,
      C.green,
    );
}
