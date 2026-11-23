import {
  ink,
  red,
  teal,
  gold,
  dim,
  cream,
  blue,
  mint,
  ochre,
  light,
  mix,
  fix,
  sum,
  surprise,
  loss,
  fresh,
  bytes,
  rate,
  cue,
  afterPhrase,
  center,
  typeRow,
} from './studio.mjs';

export function objective(p, c) {
  const b = c.beat.beatIndex;
  p.ground(true);
  if (b === 0) {
    p.heading('What can the model read?', true);
    const open = cue(c, 0, 'Now cover the middle word', 1);
    const words = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
    const shift = cue(c, 0, 'Move the cover', 2.2);
    const target = 4 - Math.round(shift);
    p.stock(110, 321, 1700, 239);
    words.forEach((word, i) => {
      const x = 255 + 270 * i;
      const visible = i < 4 || open > 0;
      if (visible) p.impression(word, x, 478, 88, ink, center);
      if (i === target || (!open && i > 4)) {
        p.rect(x - 96, 372, 192, 143, i === target ? '#ac7752' : '#c6bca6');
        if (i === target) p.mono('?', x, 472, 76, cream, center);
      }
    });
    p.bracket(152, 606, target * 270 - 20, 'Left context', mint);
    if (open) p.bracket(152 + (target + 1) * 270, 606, (5 - target) * 270 - 20, 'Right context', ochre);
    p.serif(open ? 'Masked token' : 'Next token', 148, 841, 76, cream);
    if (cue(c, 0, 'That extra right context') > 0)
      p.text('Pseudo-perplexity', 1774, 835, 48, ochre, { align: 'right' });
  } else if (b === 1) {
    p.heading('Which words earn a loss mark?', true);
    const turns = [
      ['System', 'Read the job record.'],
      ['User', 'Status of job 612?'],
      ['Assistant', 'Queued.'],
    ];
    turns.forEach(([role, say], i) => {
      const y = 242 + i * 180;
      p.text(role, 145, y + 65, 42, light);
      p.stock(466, y, 1264, 138);
      p.serif(say, 520, y + 94, 67, ink);
      p.text(i < 2 ? 'context' : 'target', 1680, y + 88, 34, i < 2 ? dim : teal, { align: 'right' });
      if (i === 2)
        p.fade(cue(c, 1, 'only assistant targets'), () => p.line(515, y + 109, 754, y + 109, red, 7));
    });
    p.text('Response-only scoring', 468, 850, 43, mint);
  } else {
    p.heading('Can the interface score this page?', true);
    const rows = [
      ['Generated', 'The cat slept', 'slept'],
      ['Held out', 'The cat sat', 'sat'],
    ];
    rows.forEach(([label, words, word], i) => {
      const y = 311 + i * 225;
      p.text(label, 130, y + 70, 44, light);
      p.stock(453, y, 725, 142);
      p.impression(words, 510, y + 100, 77);
      p.line(1187, y + 72, 1253, y + 72, ochre, 5);
      p.mono('p(' + word + ' | The cat)', 1290, y + 88, 38, cream);
    });
    p.fade(cue(c, 2, 'A generation-only interface'), () =>
      p.serif('The generated path leaves p(sat | The cat) unknown.', 135, 866, 60, ochre, { max: 1650 }),
    );
  }
}

export const logits = [1000, 998, 997];
export function stable(xs, target) {
  const m = Math.max(...xs),
    shifted = xs.map((x) => x - m);
  const exponentials = shifted.map((x) => Math.exp(x)),
    z = sum(exponentials);
  return {
    shifted,
    exponentials,
    z,
    nll: Math.log(z) - shifted[target],
    probs: exponentials.map((v) => v / z),
  };
}
export function logspace(p, c) {
  p.ground(true);
  const b = c.beat.beatIndex;
  const result = stable(logits, 0);
  if (b === 3) {
    p.heading('One running sum for a long line', true);
    const t = cue(c, 3, 'Multiplying probabilities', 4);
    const n = 1 + Math.floor(4999 * t),
      s = n * result.nll,
      product = Math.exp(-s);
    p.mono(n.toLocaleString('en-US') + ' targets', 150, 316, 69, cream);
    p.text('Each observed share', 1450, 253, 34, light, center);
    p.mono(fix(result.probs[0], 6), 1450, 325, 58, mint, center);
    p.line(150, 372, 1770, 372, '#7b9798');
    p.text('Product of probabilities', 153, 492, 46, light);
    p.mono(product === 0 ? '0  (underflow)' : product.toExponential(3), 848, 503, 61, ochre);
    p.text('Sum of log losses', 153, 639, 46, light);
    p.mono(fix(s) + ' nats', 848, 649, 65, mint);
    p.fade(cue(c, 3, 'Adding their log losses'), () =>
      p.serif('Mean ≈ ' + fix(s / n) + '      PPL ≈ ' + fix(Math.exp(s / n)), 150, 838, 66, cream),
    );
    return;
  }
  p.heading('Keep the gaps between logits', true);
  const shifted = cue(c, 0, 'Subtract the maximum', 1.3);
  const exp = cue(c, 1, 'Exponentiate each shifted', 0.8);
  const second = cue(c, 2, 'Its shifted logit is minus two', 0.8) > 0.55,
    observed = second ? 1 : 0;
  p.text('Token ID', 135, 276, 34, light);
  p.text('Raw score', 135, 391, 37, light);
  if (shifted) p.text('Subtract 1,000', 135, 526, 37, ochre);
  if (exp) p.text('Exponential', 135, 661, 37, light);
  for (let i = 0; i < logits.length; i++) {
    const x = 672 + i * 442;
    p.mono(String(i), x, 277, 42, mint, center);
    p.mono(logits[i], x, 401, 76, cream, center);
    p.fade(shifted, () => {
      p.mono(result.shifted[i], x, 538, 78, ochre, center);
      p.line(x - 126, 444, x + 126, 444, '#718588', 3);
    });
    p.fade(exp, () => p.mono(fix(result.exponentials[i]), x, 670, 59, cream, center));
    if (b === 2 && i === observed) p.line(x - 104, 552, x + 104, 552, mint, 7);
  }
  if (b === 0)
    p.fade(cue(c, 0, 'can overflow'), () =>
      p.serif('exp(1000) exceeds the numeric range.', 135, 854, 62, ochre),
    );
  if (b === 1)
    p.fade(exp, () =>
      p.mono(
        'Sum ≈ ' + fix(result.z) + '      p = ' + result.probs.map((v) => fix(v)).join('   '),
        134,
        838,
        51,
        mint,
      ),
    );
  if (b === 2)
    p.mono(
      'NLL = ln(' +
        fix(result.z) +
        ') − (' +
        result.shifted[observed] +
        ') ≈ ' +
        fix(stable(logits, observed).nll),
      135,
      850,
      61,
      mint,
    );
}

export const workers = [
  { n: 2, mean: 0.5 },
  { n: 8, mean: 2 },
];
export function pool(rows) {
  const total = sum(rows.map((v) => v.mean * v.n)),
    n = sum(rows.map((v) => v.n));
  return { total, n, mean: n ? total / n : null, ppl: n ? Math.exp(total / n) : null };
}
export function aggregate(p, c) {
  p.ground();
  p.heading('How much should each window count?');
  const b = c.beat.beatIndex,
    spread = cue(c, 1, 'Expand the windows', 1.8);
  const { total, n, mean, ppl } = pool(workers);
  const showWindowSums = [
    afterPhrase(c, 1, 'The two short bars cost one nat together'),
    afterPhrase(c, 1, 'The eight tall ones cost sixteen'),
  ];
  const showMean = afterPhrase(
    c,
    1,
    'Seventeen nats over ten targets gives one point seven nats per target',
    'one point seven nats per target',
  );
  const showPooled = afterPhrase(
    c,
    2,
    'The corpus perplexity is about five point four seven',
    'about five point four seven',
  );
  const compare = cue(c, 2, 'Averaging the two window', 0.45);
  const showWindowPPL = afterPhrase(
    c,
    2,
    'Averaging the two window perplexities gives four point five two',
    'four point five two',
  );
  const colors = [blue, teal];
  const x0 = 188;
  const step = 148;
  const width = 100;
  const baseline = 563;
  let j = 0;
  workers.forEach(({ n: count, mean: windowMean }, k) => {
    const start = j;
    const summaryX = k ? 1110 : 475;
    const height = windowMean * 140;
    for (let i = 0; i < count; i++, j++) {
      const x = mix(summaryX, x0 + j * step, spread);
      if (!i || spread > 0) {
        p.rect(x, baseline - height, width, height, colors[k]);
        p.line(x + 3, baseline - height + 5, x + width - 4, baseline - height + 5, '#ffffff66', 3);
      }
    }
    const centerX = mix(summaryX, x0 + (start + (count - 1) / 2) * step, spread) + width / 2;
    const unit = spread === 1 ? ' each' : ' mean';
    p.mono(fix(windowMean, 1) + ' nats' + unit, centerX, baseline - height - 27, 40, colors[k], center);
    const subtotal = count * windowMean;
    const sumLabel = showWindowSums[k] ? ' · ' + subtotal + (subtotal === 1 ? ' nat' : ' nats') : '';
    p.text(count + ' targets' + sumLabel, centerX, baseline + 63, 42, colors[k], center);
  });
  p.line(139, baseline + 2, 1770, baseline + 2, ink, 4);
  if (!showMean) return;

  const left = 139;
  const right = 977;
  const panelWidth = 793;
  const panelTop = 674;
  const panelHeight = 259;
  const labelX = left + 36;
  const stripOffset = 270;
  const stripWidth = panelWidth - 72 - stripOffset;
  const firstWindowShare = workers[0].n / n;
  p.stock(left, panelTop, panelWidth, panelHeight);
  p.serif('Pool all targets', labelX, 733, 51);
  p.mono(total + ' nats ÷ ' + n + ' targets = ' + fix(mean, 1), labelX, 790, 42);
  if (showPooled)
    p.mono('exp(' + fix(mean, 1) + ') ≈ ' + fix(ppl, 2) + ' PPL', labelX, 851, 49, teal);
  p.text('Target weights', labelX, 907, 33, dim);
  p.rect(labelX + stripOffset, 892, stripWidth * firstWindowShare - 3, 12, colors[0]);
  p.rect(
    labelX + stripOffset + stripWidth * firstWindowShare,
    892,
    stripWidth * (1 - firstWindowShare),
    12,
    colors[1],
  );

  if (b === 2) {
    p.fade(compare, () => {
      const x = right + 36;
      const terms = workers.map((w) => 'exp(' + fix(w.mean, 1) + ')');
      const windowAverage = sum(workers.map((w) => Math.exp(w.mean))) / workers.length;
      p.stock(right, panelTop, panelWidth, panelHeight);
      p.serif('Average window PPLs', x, 733, 51);
      p.mono('[' + terms.join(' + ') + '] ÷ ' + workers.length, x, 790, 42);
      if (showWindowPPL) p.mono('≈ ' + fix(windowAverage, 2) + ' PPL', x, 851, 49, red);
      p.fade(cue(c, 2, 'That gives the little pair'), () => {
        p.text('Window weights', x, 907, 33, dim);
        colors.forEach((color, k) =>
          p.rect(
            x + stripOffset + (k * stripWidth) / workers.length,
            892,
            stripWidth / workers.length - 3,
            12,
            color,
          ),
        );
      });
    });
  }
  if (b === 3) {
    const x = right + 36;
    p.stock(right, panelTop, panelWidth, panelHeight);
    p.serif('Worker totals', x, 733, 51);
    workers.forEach(({ n: count, mean: windowMean }, k) => {
      const subtotal = count * windowMean;
      const unit = subtotal === 1 ? ' nat' : ' nats';
      p.mono(subtotal + unit + ' · ' + count + ' targets', x, 804 + 62 * k, 43, colors[k]);
    });
  }
}
export function ruler(p, c) {
  p.ground();
  p.heading('Change the ruler under the same line');
  const text = fresh.pieces.join(''),
    len = bytes(text),
    left = 205,
    unit = 94;
  const b = c.beat.beatIndex,
    whole = loss(fresh.probs);
  p.text('Beginning marker supplies the first prefix', left, 257, 37, dim);
  typeRow(p, fresh.pieces, left, 342, unit, { font: 69, height: 126 });
  let k = 0;
  fresh.pieces.forEach((piece, i) => {
    const start = k;
    k += piece.length;
    p.mono(fix(fresh.probs[i], 2), left + (start + piece.length / 2) * unit, 547, 50, teal, center);
  });
  if (b === 0) {
    const count =
      1 +
      Number(cue(c, 0, 'After The cat') > 0.1) +
      Number(cue(c, 0, 'After sat') > 0.1) +
      Number(cue(c, 0, 'After down') > 0.1);
    const ps = fresh.probs.slice(0, count);
    const scored = fresh.pieces.slice(0, count).join('');
    p.bracket(left, 609, scored.length * unit, '', teal);
    p.mono(
      count === 1
        ? 'p(The) = 0.40'
        : ps.map((v) => fix(v, 2)).join(' × ') +
            ' = ' +
            fix(
              ps.reduce((a, b) => a * b, 1),
              2,
            ),
      left,
      763,
      56,
    );
  } else {
    p.mono('Whole line ≈ ' + fix(whole) + ' nats', left, 659, 52);
    if (b === 2)
      p.mono('exp(' + fix(whole, 3) + ' / 4) ≈ ' + fix(Math.exp(whole / 4), 2), left, 802, 64, teal);
    if (b >= 3) {
      for (let i = 0; i < len; i++) p.line(left + i * unit, 703, left + i * unit, 735, red, 3);
      p.bracket(left, 747, len * unit, len + ' UTF-8 bytes', red);
      p.fade(cue(c, 4, 'We already had'), () =>
        p.serif(fix(rate(whole, len)) + ' bits per byte', left, 904, 70, teal),
      );
    }
  }
}

const original = 'Ａ  a',
  normalizations = [original.normalize('NFKC'), original.normalize('NFKC').toLowerCase(), 'a a'];
export const normalize = (s) => s.normalize('NFKC').toLowerCase().trim().replace(/\s+/gu, ' ');
function imprint(p, s, x, baseline, size, color) {
  let cursor = x;
  for (const ch of s) {
    const wide = ch === 'Ａ';
    p.ctx.save();
    p.ctx.translate(cursor, baseline);
    p.ctx.scale(wide ? 1.65 : 1, 1);
    p.mono(wide ? 'A' : ch === ' ' ? '·' : ch, 0, 0, size, color);
    p.ctx.restore();
    cursor += size * (wide ? 1.08 : 0.64);
  }
}
export function normalization(p, c) {
  const b = c.beat.beatIndex;
  p.ground();
  p.heading(b >= 6 ? 'How far back do two tokens reach?' : 'Which text did the model score?');
  if (b <= 1) {
    const stage =
      Number(cue(c, 0, 'First narrow') > 0.5) +
      Number(cue(c, 0, 'Then fold') > 0.5) +
      Number(cue(c, 0, 'Finally collapse') > 0.5);
    const inputs = b === 0 ? [original] : [original, 'A a', 'a a'];
    inputs.forEach((s, i) => {
      const y = 333 + 160 * i;
      p.stock(140, y, 635, 137);
      imprint(p, s, 211, y + 95, 80, ink);
      if (!i) p.text('wide A', 572, y + 88, 34, dim);
      p.line(800, y + 70, 1045, 535, teal, 4);
    });
    p.stock(1052, 440, 614, 186);
    const str = stage ? normalizations[stage - 1] : original;
    imprint(p, str, 1132, 567, 102, teal);
    p.text(
      ['Original text', 'Width normalized', 'Case folded', 'Spaces collapsed'][stage],
      1054,
      710,
      44,
      dim,
    );
    if (b === 1) p.serif('Which input made this impression?', 140, 895, 62);
    return;
  }
  if (b >= 6) {
    const hist = cue(c, 6, 'Now keep just the last two', 1.5);
    [
      ['Joined', ['a', ' a']],
      ['Separate', ['a', ' ', 'a']],
    ].forEach(([name, pieces], i) => {
      const y = 302 + i * 260;
      p.text(name, 152, y + 87, 49);
      typeRow(p, pieces, 510, y, 238, { height: 139, font: 90, color: i ? blue : teal });
      const start = i ? mix(510, 748, hist) : 510;
      p.bracket(
        start,
        y + 169,
        1224 - start,
        hist ? 'last two tokens' : pieces.length + ' tokens',
        i ? blue : teal,
      );
      if (i && hist) p.fade(hist, () => p.rect(510, y, 237, 139, '#e9e1cdb3'));
    });
    return;
  }
  const kept = normalize(original),
    nats = 1.2,
    rawLen = bytes(original),
    keptLen = bytes(kept);
  const rows = [
    ['Raw input', original, rawLen],
    ['Scored text', kept, keptLen],
  ];
  rows.forEach(([label, s, len], i) => {
    const y = 310 + i * 241;
    p.text(label, 137, y + 61, 45);
    [...Buffer.from(s)].forEach((v, j) => {
      const x = 502 + 118 * j;
      p.stock(x, y, 108, 95);
      p.mono(v.toString(16).toUpperCase(), x + 54, y + 67, 46, i ? teal : ink, center);
    });
    p.bracket(503, y + 113, 118 * len - 10, len + ' bytes', i ? teal : dim);
    const alpha = i ? cue(c, 3, 'Across the three bytes') : cue(c, 3, 'Spread it across');
    p.fade(alpha, () => {
      p.mono(fix(rate(nats, len)), 1404, y + 72, 72, i ? teal : dim);
      p.text('bits / ' + (i ? 'scored' : 'raw') + ' byte', 1406, y + 133, 34, dim);
    });
  });
  p.serif('Loss on “a·a” = 1.2 nats', 138, 852, 60);
  p.fade(cue(c, 5, 'Use the three scored bytes'), () => p.line(1398, 646, 1649, 646, teal, 7));
}
