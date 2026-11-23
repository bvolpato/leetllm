import {
  ink,
  paper,
  sheet,
  blue,
  teal,
  gold,
  rust,
  faded,
  rule,
  dark,
  pale,
  peach,
  fmt,
  vec,
  lerp,
} from './art.mjs';
import {
  decoderMiniature,
  lossStep,
} from '../../../films/build-gpt-from-scratch-lab/arithmetic.mjs';
import { logged } from '../../../films/build-gpt-from-scratch-lab/fixtures.mjs';

export function maskPair(changed, open) {
  const source = decoderMiniature({ causal: !open });
  const copy = decoderMiniature({ causal: !open, fourth: changed ? '·sir' : '↵' });
  return [source, copy];
}
export function shutter(d) {
  const { b, field, label, rect, mono, serif, slug, cue, bracket } = d;
  const changed = cue(3, 'Replace the line break', 0),
    opened = cue(5, 'Open the bracket', 0),
    restored = cue(5, 'Restore the causal mask', 0),
    open = opened && !restored;
  const heads = maskPair(changed, open);
  const bracketSet = cue(1, 'Keep the bracket', 0);
  field(
    'What can the comma read?',
    'Two runs of the same four-piece head   /   fixed target = line break',
  );
  const start = 158,
    step = 127;
  const observed = cue(3, 'Their mean stays one', 0);
  const report = (!open && observed) || (open && cue(5, 'The means split', 0));
  label('Line-break score', 718, 156, teal);
  if (open || restored) {
    const prior = maskPair(true, !open)
      .map((h) => h.logits[1].toFixed(2))
      .join(' / ');
    label((open ? 'Masked pair   ' : 'Open pair   ') + prior, 686, 101, open ? teal : rust);
  }
  heads.forEach((h, j) => {
    const y = 175 + j * 144;
    label(j ? 'Test copy' : 'Source', 44, y + 33);
    h.tokens.forEach((v, i) => {
      const visible = !bracketSet || h.attention[i] > 0;
      if (!visible) {
        rect(start + i * step - 8, y - 7, 120, 97, '#c5c5b3');
      }
      slug(v, start + i * step, y, 97, 49, visible ? ink : faded, 'Serif', 31);
      mono(h.inputs[i][0], start + i * step + 47, y + 79, 21, visible ? blue : faded, 'center');
    });
    const count = h.attention.filter((w) => w > 0).length;
    if (bracketSet) bracket(start - 2, y + 94, start + (count - 1) * step + 100, teal);
    const score = h.logits[h.outputPieces.indexOf('↵')];
    mono(
      report || (!open && j === 0 && b >= 2) ? score.toFixed(2) : '?',
      728,
      y + 56,
      44,
      report && open ? rust : teal,
    );
  });
  if (report) {
    const terms = heads.map((h) => h.inputs.filter((v, i) => h.attention[i] > 0).map((v) => v[0]));
    terms.forEach((v, i) =>
      mono('(' + v.join(' + ') + ') / ' + v.length, 60 + 460 * i, 477, 22, i ? rust : blue),
    );
  } else
    label(
      open
        ? 'Four keys contribute. Compare the values at key 3.'
        : bracketSet
          ? 'Only keys inside the brackets contribute to the mean.'
          : 'Which keys may the comma use?',
      158,
      471,
    );
}
export function oneHead(d) {
  const { b, rect, line, label, serif, mono, cue, alpha } = d,
    h = decoderMiniature();
  const xs = [124, 324, 524, 796],
    mix = cue(2, 'The comma now carries', 0.4),
    score = cue(3, 'Take a dot product', 0);
  const collected = cue(1, 'Collect the three readable values', 0.9);
  const value = cue(1, 'Its value is', 0);
  rect(0, 0, 960, 540, dark);
  rect(23, 20, 914, 250, sheet);
  rect(650, 20, 287, 250, '#9baea5');
  rect(642, 20, 8, 250, '#867553');
  line(641, 22, 641, 269, gold, 3);
  label('Comma’s field of view', 53, 57, teal);
  label('Future input', 685, 57, ink);
  h.tokens.forEach((v, i) => {
    serif(v, xs[i], 150, i === 2 ? 87 : 62, i === 2 ? rust : i === 3 ? '#4d605c' : ink, 'center');
    if (i < 3)
      alpha(i === 2 ? value : collected, () =>
        mono(vec(h.inputs[i]), xs[i], 219, 28, blue, 'center'),
      );
    else label('weight 0', xs[i], 219, ink, 'center');
  });
  if (!score) {
    if (b === 1) {
      label('VALUE AT THE COMMA', 56, 318, pale);
      [h.embedding, h.position, value ? h.input : null].forEach((v, i) => {
        mono(v ? vec(v) : '?', 59 + 319 * i, 389, 42, i === 2 ? gold : sheet);
      });
      mono('+', 278, 387, 40, pale);
      mono('=', 593, 387, 40, pale);
      label('piece embedding', 61, 431, pale);
      label('position embedding', 380, 431, pale);
      label('value (identity projection)', 696, 431, pale);
    } else {
      label('Weight per readable key: 1/3', 673, 306, pale);
      const gather = cue(2, 'Average each coordinate', 0.85);
      h.hidden.forEach((v, j) => {
        const terms = h.inputs.slice(0, 3).map((row) => row[j]);
        const y = 374 + 64 * j;
        if (gather) {
          terms.forEach((n, i) =>
            mono(
              n,
              lerp(xs[i] + (j ? 21 : -21), 77 + i * 100, gather),
              lerp(233, y, gather),
              26,
              gold,
              'center',
            ),
          );
          if (gather === 1) {
            mono('(', 48, y, 26, pale);
            mono('+', 119, y, 26, pale);
            mono('+', 219, y, 26, pale);
            mono(') / 3', 299, y, 26, pale);
            mono(mix ? '= ' + v : '= ?', 417, y, 33, gold);
          }
        }
      });
      if (mix) {
        label('HIDDEN VECTOR', 673, 351, pale);
        mono(vec(h.hidden), 671, 422, 42, gold);
      }
    }
  } else {
    label('TIED EMBEDDING ROWS   ·   dot each row with h = ' + vec(h.hidden), 48, 308, pale);
    h.outputRows.forEach((v, i) => {
      const x = 52 + i * 231;
      serif(h.outputPieces[i], x, 357, 36, sheet);
      mono(vec(v), x, 402, 25, pale);
      const read = cue(3, 'The line-break row', 0);
      const ranked = cue(3, 'The comma row', 0);
      mono((i === 1 && read) || ranked ? h.logits[i] : '?', x, 466, 42, i === 1 ? gold : sheet);
      if (i === 1) label('target', x + 45, 458, gold);
      if (i === 2 && ranked) label('highest', x + 46, 458, pale);
    });
  }
}
export function loss(d) {
  const { b, field, label, mono, rect, cue, table } = d;
  const step = cue(3, 'Subtract half', 1.1),
    f = lossStep(step),
    prob = f.probabilities[f.targetIndex];
  field(
    'Credit for the observed line break',
    'One comma position   /   readouts rounded   /   sum and loss use unrounded weights',
  );
  const exp = cue(1, 'exponentiate each score', 0),
    normalized = cue(1, 'Take the negative natural log', 0),
    penalty = cue(2, 'The training loss averages', 0);
  const xs = [246, 415, 586, 759];
  label('Candidate', 47, 162);
  label('Score', 47, 225);
  if (exp) label('exp(score)', 47, 282);
  f.outputPieces.forEach((v, i) => {
    const x = xs[i],
      color = i === f.targetIndex ? rust : ink;
    d.serif(v, x, 169, 34, color, 'center');
    mono(step ? f.logits[i].toFixed(3) : f.logits[i], x, 228, 24, color, 'center');
    if (exp) mono(f.weights[i].toFixed(3), x, 285, 22, color, 'center');
  });
  if (exp) {
    d.line(47, 304, 904, 304);
    mono('Sum of weights ≈ ' + f.sum.toFixed(3), 48, 337, 22);
  }
  if (normalized) {
    mono('p_target ≈ ' + prob.toFixed(4), 903, 337, 22, rust, 'right');
    let x = 48;
    f.probabilities.forEach((v, i) => {
      rect(x, 359, 850 * v, 38, [blue, gold, teal, '#ac9381'][i]);
      if (i === 1) mono((100 * v).toFixed(1) + '%', x + 425 * v, 385, 18, ink, 'center');
      x += 850 * v;
    });
  }
  if (penalty) mono('Loss = −ln(p_target) ≈ ' + f.loss.toFixed(3) + ' nats', 49, 453, 27, rust);
  if (b === 3)
    label('Logit step   ·   gradient = p − 1 on the target, p on each competitor', 49, 493);
  if (b === 4) label('CPU lab    zero_grad()  →  backward()  →  AdamW.step()', 49, 493);
}
export const lab = { batch: 12, time: 48, width: 96, heads: 4, vocab: 17485 };
export function fullBlock(d) {
  const { b, field, label, rect, line, mono, serif, arrow, cue, stock } = d;
  const { batch, time, width, heads, vocab } = lab,
    dh = width / heads;
  if (b === 1) {
    field(
      'Split the projection into heads',
      'One token position shown   /   batch 12, sequence 48',
    );
    label('Input features', 49, 174);
    mono('96', 49, 237, 49);
    const split = cue(1, 'Split each into four heads', 0);
    ['Q', 'K', 'V'].forEach((v, i) => {
      const y = 179 + i * 91;
      mono(v, 282, y + 35, 35, blue);
      rect(351, y, 530, 41, blue);
      for (let j = 0; j < (split ? heads : 1); j++) {
        if (j) rect(351 + (530 * j) / heads, y, 3, 41, paper);
        mono(
          split ? dh : width,
          351 + (530 * (j + 0.5)) / (split ? heads : 1),
          y + 29,
          21,
          sheet,
          'center',
        );
      }
    });
    mono(split ? '[12, 4, 48, 24]' : '[12, 48, 96]', 352, 475, 27, blue);
  } else if (b <= 3) {
    field('A score for every query–key pair', 'Head width 24   /   lower triangle permitted');
    const x = 190,
      y = 169,
      cell = 5.5;
    for (let i = 0; i < time; i++)
      for (let j = 0; j < time; j++)
        rect(x + j * cell, y + i * cell, cell - 0.4, cell - 0.4, j <= i ? blue : '#c8c8b3');
    label('48 keys', 321, 152, blue, 'center');
    label('48 queries', 50, 301, blue);
    label('BATCH × HEADS × QUERIES × KEYS', 514, 186);
    mono('[12, 4, 48, 48]', 514, 238, 31);
    mono('Q × K^T / √24', 514, 303, 30, blue);
    label('Mask future scores with −∞.', 514, 350);
    label('Each row needs an allowed key.', 514, 380);
    label('Keep allowed scores finite, then normalize and mix V.', 514, 410);
    if (b === 3) label('Query 0 assigns weight 1 to key 0.', 514, 456, teal);
  } else if (b <= 5) {
    field(
      'Two paths through each Pre-LN block',
      'Residual stream   /   width 96 at both additions',
    );
    const xs = [70, 250, 460, 669, 880],
      y = 313;
    const second = cue(4, 'A second branch', 0);
    d.path(
      [
        [xs[0], y],
        [second ? xs[4] : xs[2], y],
      ],
      blue,
      5,
    );
    d.path(
      [
        [xs[0] + 6, y],
        [xs[0] + 6, 172],
        [xs[2] - 12, 172],
        [xs[2] - 12, y - 18],
      ],
      teal,
      3,
    );
    label('LN₁ → attention → join → project', 99, 158, teal);
    if (second) {
      d.path(
        [
          [xs[2] + 5, y],
          [xs[2] + 5, 401],
          [xs[4], 401],
          [xs[4], y + 20],
        ],
        teal,
        3,
      );
      label('LN₂ → 96 → 384 → GELU → 96', 478, 443, teal);
    }
    (second ? [0, 2, 4] : [0, 2]).forEach((i, j) => {
      d.oval(xs[i], y, 19, 19, j ? teal : blue);
      mono(j ? '+' : 'h', xs[i], y + 7, 22, sheet, 'center');
    });
    label('h', 73, 271, blue);
    label('u', 457, 271, blue);
    if (second) label('h′', 864, 271, blue);
    if (b === 5) mono('GELU(x) = x Φ(x)', 74, 483, 21);
  } else {
    field(
      'One vocabulary row of logits per position',
      'Two blocks → final LayerNorm → tied token table',
    );
    label('MODEL OUTPUT', 49, 161);
    mono('[12, 48, 17485]', 48, 227, 44);
    label('FLATTEN BATCH AND TIME', 49, 295, blue);
    mono('[' + batch * time + ', ' + vocab + ']', 48, 364, 43, blue);
    label('paired with', 469, 352, rust);
    mono('[576]', 602, 361, 42, rust);
    label('integer targets', 605, 395, rust);
    if (b === 7)
      label(
        'float32 logits alone   ·   ' +
          ((batch * time * vocab * 4) / 1e6).toFixed(1) +
          ' MB before backward storage',
        49,
        457,
      );
  }
}
export function checkpoints(d) {
  const { b, field, label, line, rect, mono, serif, cue, stock } = d;
  if (b < 5) {
    const late = cue(3, 'another two hundred forty updates', 0),
      quote = cue(4, 'Read the later sample', 0);
    field('Two checkpoints, one prompt', 'Sampled validation loss   /   nats per token');
    const X = (u) => 72 + (u - 1) * 2.47,
      Y = (v) => 290 - (v - 5) * 30;
    [5, 7, 9].forEach((v) => {
      line(65, Y(v), 882, Y(v), rule);
      mono(v, 47, Y(v) + 5, 14);
    });
    let prev;
    logged
      .filter((v) => v.x <= (late ? 321 : 81))
      .forEach((v) => {
        if (prev) line(X(prev.x), Y(prev.y), X(v.x), Y(v.y), blue, 3);
        d.oval(X(v.x), Y(v.y), 5, 5, blue);
        mono(v.x, X(v.x), 315, 15, ink, 'center');
        prev = v;
      });
    const excerpt = (x, step, ce, acc, quotes) => {
      stock(x, 342, 409, 125);
      label('Update ' + step + '   ·   ' + ce + ' nats   ·   ' + acc, x + 14, 369, blue);
      quotes.forEach((v, i) => serif(v, x + 14, 406 + 34 * i, 29, i ? rust : ink));
    };
    excerpt(49, 81, logged[2].y.toFixed(3), '17.1%', ['“And the I the”']);
    if (late)
      excerpt(
        489,
        321,
        logged[5].y.toFixed(3),
        '18.3%',
        quote ? ['“I’ll do”', '“I is the king”'] : ['Continuation covered'],
      );
  } else {
    field(
      'Would you keep the later checkpoint?',
      'Separate practice example   /   frozen split and ten fixed prompts',
    );
    const revealed = cue(5, 'copied continuations rise', 0);
    const rows = [
      ['Earlier', 4.1, 2],
      ['Later', 3.9, 7],
    ];
    rows.forEach(([title, ce, copies], i) => {
      const y = 190 + 143 * i;
      serif(title, 48, y + 30, 34);
      mono(ce.toFixed(1), 245, y + 30, 39, teal);
      if (i && !revealed) {
        mono('?', 462, y + 30, 39, rust);
        return;
      }
      for (let j = 0; j < 10; j++) rect(462 + j * 39, y, 30, 43, j < copies ? rust : '#d1cbb3');
      label(copies + ' of 10 copied', 462, y + 74, rust);
    });
    label('Loss (nats/token)', 244, 154, teal);
    label('Continuations with copied phrases', 462, 154, rust);
    label('Check overlap and held-out task behavior before selecting weights.', 47, 474);
  }
}
