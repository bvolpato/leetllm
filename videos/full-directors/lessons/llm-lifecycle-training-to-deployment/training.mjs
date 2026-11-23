import { lerp } from './art.mjs';
import { bpe, compute, lifetime, digest, paragraph } from './examples.mjs';

function page(a, x, y, w, h, col) {
  a.box(x + 3, y + 5, w, h, a.c.line, null, 4);
  a.box(x, y, w, h, a.c.bg, col, 4);
  for (let i = 0; i < 3; i++)
    a.line(
      x + 14,
      y + 17 + i * 9,
      x + w * (i === 2 ? 0.55 : 0.84),
      y + 17 + i * 9,
      col,
      2,
    );
}
export function curate(a) {
  const { c, beat: b, cue } = a;
  if (b < 3) {
    a.title(
      'Pre-training  /  corpus curation',
      'How often will this paragraph be seen?',
    );
    const keep = cue(1, 'Keep one copy', 1.45);
    for (let i = 9; i >= 0; i--) {
      const x = lerp(84 + (i % 5) * 128, 237, keep),
        y = lerp(272 + Math.floor(i / 5) * 118, 332, keep);
      page(a, x, y, 108, 82, c.cyan);
    }
    a.text(paragraph, 83, 215, 30, c.ink, { face: 'Serif' });
    a.text('Toy paragraph · truncated SHA-1', 795, 286, 21, c.muted);
    a.mono(digest, 795, 345, 29, c.cyan);
    a.text('Copies retained', 795, 441, 22, c.muted);
    a.text(keep === 1 ? '1' : '10', 795, 537, 89, c.ink, { face: 'Serif' });
    a.fade(cue(2, 'memorized'), () =>
      a.text('One occurrence still reaches training.', 80, 620, 30, c.ink, {
        face: 'Serif',
      }),
    );
    return;
  }
  a.title('Corpus curation', 'Which writing survives the filter?');
  const names = ['CCNet', 'Original C4'];
  const details = [
    [
      'fastText language ID',
      'Wikipedia LM · perplexity',
      'Normalized paragraph hashes',
    ],
    [
      'English · langdetect',
      'Sentence and boilerplate rules',
      'Repeated three-sentence spans',
    ],
  ];
  names.forEach((name, i) => {
    const x = 74 + i * 620;
    a.text(name, x, 243, 41, i ? c.violet : c.cyan, { face: 'Serif' });
    details[i].forEach((s, j) => {
      const y = 305 + j * 66;
      a.line(x, y + 18, x + 516, y + 18, c.line, 2);
      a.text(s, x + 12, y, 25, c.ink);
    });
  });
  a.fade(cue(3, 'MinHash'), () =>
    a.text(
      'Near-duplicates   ·   MinHash compares similar passages.',
      74,
      548,
      26,
      c.muted,
    ),
  );
  if (b === 4) {
    const sample = cue(4, 'discarded text', 1.0);
    const x = lerp(1150, 990, sample);
    page(a, x, 570, 100, 61, c.gold);
    a.text(
      'Read a rejected page. Which languages lost examples?',
      74,
      614,
      29,
      c.gold,
      { face: 'Serif' },
    );
  }
}

export function tokens(a) {
  const { c, beat: b, cue } = a;
  if (b <= 3) {
    a.title(
      'Tokenizer training  /  one BPE merge',
      'Which pair occurs more often?',
    );
    const selected = cue(2, 'letters t and a'),
      join = cue(3, 'Join those letters', 1.2);
    const data = bpe[0];
    data.rows.forEach((row, i) => {
      const y = 239 + i * 105;
      a.mono(row.word, 65, y + 28, 27, c.ink);
      a.mono('×' + row.frequency, 240, y + 28, 24, c.muted);
      const pairIndex = row.word.indexOf('ta');
      row.tokens.forEach((token, j) => {
        const pair = pairIndex >= 0 && (j === pairIndex || j === pairIndex + 1);
        if (pair && join > 0) {
          if (j !== pairIndex) return;
          const x = 356 + j * 83,
            width = lerp(156, 73, join);
          a.box(x, y - 26, width, 70, c.gold, null, 5);
          a.mono('t', x + lerp(36, 28, join), y + 19, 29, c.reverse, 'center');
          a.mono('a', x + lerp(119, 45, join), y + 19, 29, c.reverse, 'center');
          return;
        }
        const shift = pairIndex >= 0 && j > pairIndex ? join : 0;
        const x = 356 + (j - shift) * 83;
        a.tile(
          x,
          y - 26,
          73,
          70,
          token,
          pair && selected ? c.gold : c.bed,
          pair && selected ? c.reverse : c.ink,
          29,
        );
      });
    });
    if (selected && !join) {
      for (const [i, start] of [
        [0, 0],
        [1, 1],
        [2, 2],
      ]) {
        const x = 359 + 83 * start,
          y = 293 + 105 * i;
        a.path(
          [
            [x, y - 9],
            [x, y],
            [x + 152, y],
            [x + 152, y - 9],
          ],
          i ? c.gold : c.cyan,
          3,
        );
      }
    }
    a.mono('k + e   × 4', 84, 594, 28, c.muted);
    a.fade(selected, () => a.mono('t + a   × (3 + 2)', 450, 594, 28, c.gold));
    a.fade(cue(3, 'five times'), () => a.mono('5 > 4', 973, 594, 35, c.green));
    return;
  }
  a.title(
    'Causal pre-training  /  observed continuation',
    'How much loss does the target receive?',
  );
  ['r', 'o', 'ta'].forEach((t, i) =>
    a.tile(
      106 + i * 129,
      260,
      110,
      117,
      t,
      i === 2 ? c.gold : c.bed,
      i === 2 ? c.reverse : c.ink,
      43,
    ),
  );
  a.path(
    [
      [108, 400],
      [108, 413],
      [338, 413],
      [338, 400],
    ],
    c.cyan,
    3,
  );
  a.arrow(222, 416, 222, 454, c.cyan, 3);
  a.text('Context', 105, 232, 22, c.muted);
  a.text('Target', 363, 232, 22, c.gold);
  const move = cue(5, 'point eight', 1.2),
    p = lerp(0.2, 0.8, move);
  a.mono('p(ta | r o)', 648, 264, 25, c.ink);
  a.box(648, 302, 458, 42, c.bed, c.line, 5);
  a.box(648, 302, 458 * p, 42, c.cyan, null, 4);
  a.mono(p.toFixed(2), 1140, 335, 26, c.cyan);
  a.text('Next-token loss', 105, 514, 25, c.muted);
  a.mono('−ln(' + p.toFixed(2) + ')', 106, 587, 47, c.ink);
  a.text((-Math.log(p)).toFixed(3) + ' nats', 646, 586, 62, c.gold, {
    face: 'Serif',
  });
}

export function allocation(a) {
  const { c, beat: b, cue } = a;
  if (b <= 3) {
    a.title(
      'Dense training  /  approximate FLOPs ≈ 6ND',
      'Where did the training compute go?',
    );
    const labels = ['Parameters', 'Training tokens', 'Approx. FLOPs'];
    labels.forEach((v, i) => a.text(v, [353, 627, 950][i], 222, 22, c.muted));
    compute.forEach((r, i) => {
      if (i >= b) return;
      const y = 297 + i * 128;
      a.text(r.name, 70, y, 32, c.ink, { face: 'Serif' });
      a.mono(r.parametersB + ' B', 354, y, 29, c.cyan);
      a.mono(
        r.tokensB >= 1000 ? r.tokensB / 1000 + ' T' : r.tokensB + ' B',
        628,
        y,
        29,
        c.gold,
      );
      a.mono((r.flops / 1e23).toFixed(2) + ' × 10²³', 950, y, 24, c.ink);
      a.box(354, y + 18, (r.parametersB / 280) * 212, 13, c.cyan, null, 2);
      a.box(628, y + 18, (r.tokensB / 15000) * 240, 13, c.gold, null, 2);
    });
    return;
  }
  if (b <= 5) {
    a.title(
      'Chinchilla allocation  /  fitted dense training objective',
      'How do you allocate four times the compute?',
    );
    const r = lerp(1, 2, cue(4, 'Double both sides', 1.3)),
      x = 172,
      y = 578,
      unit = 147;
    a.box(x, y - unit * 2, unit * 2, unit * 2, null, c.line);
    a.box(x, y - unit * r, unit * r, unit * r, c.cyan);
    a.line(x + unit, y - unit * r, x + unit, y, c.bg, 4);
    a.line(x, y - unit, x + unit * r, y - unit, c.bg, 4);
    a.text('Tokens', x + unit, 634, 26, c.muted, { align: 'center' });
    a.text('N', 92, 430, 27, c.muted);
    a.mono('Compute     × ' + (r * r).toFixed(1), 638, 298, 30, c.gold);
    a.mono('Parameters  × ' + r.toFixed(1), 638, 395, 30, c.ink);
    a.mono('Tokens      × ' + r.toFixed(1), 638, 471, 30, c.ink);
    if (b === 5)
      a.text(
        'Utilization and long-context costs enter the run plan.',
        634,
        574,
        22,
        c.muted,
        { max: 568 },
      );
    return;
  }
  a.title(
    'Lifetime cost  /  both models meet the quality target',
    'When does the smaller model cost less?',
  );
  const n = b === 6 ? 1 : 2 + Math.round(18 * cue(7, 'twenty requests', 1.8));
  const axis = a.axis(136, 500, 665, 0, 20, [0, 5, 10, 15, 20]);
  const y = (price) => 500 - 24 * price;
  [c.cyan, c.violet].forEach((col, i) => {
    a.line(axis(0), y(lifetime(0)[i]), axis(20), y(lifetime(20)[i]), c.line, 2);
    a.line(axis(0), y(lifetime(0)[i]), axis(n), y(lifetime(n)[i]), col, 5);
    a.dot(axis(n), y(lifetime(n)[i]), 8, col);
  });
  a.mono('Requests', 470, 582, 20, c.muted, 'center');
  a.text(
    'After ' + n + (n === 1 ? ' request' : ' requests'),
    865,
    224,
    25,
    c.muted,
  );
  const vals = lifetime(n);
  ['Smaller   1 + 0.2n', 'Other   0.5 + 0.5n'].forEach((l, i) => {
    const top = 298 + i * 153;
    a.mono(l, 865, top, 21, i ? c.violet : c.cyan);
    a.text(vals[i].toFixed(1) + ' units', 865, top + 68, 53, c.ink, {
      face: 'Serif',
    });
  });
}
