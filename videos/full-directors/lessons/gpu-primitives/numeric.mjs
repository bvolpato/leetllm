import {
  ink,
  muted,
  line,
  teal,
  rust,
  light,
  blue,
  cue,
  alpha,
  rect,
  rule,
  dot,
  label,
  num,
  header,
  note,
  arrow,
  tag,
} from './graphics.mjs';
import {
  large,
  residual,
  raw,
  rounded,
  left,
  right,
  tolerance,
  exampleRuns,
  inTolerance,
  max64,
  logits,
  chunks,
  chunkValues,
  weightedChunks,
  numerator,
  states,
  common,
  masses,
  denom,
  probs,
  vector,
} from './examples.mjs';

const fixed = (v) => v.toFixed(3);
const big = (n) => n.toLocaleString('en-US').replace('-', '−');
export function precision(c, k) {
  const b = k.beat.beatIndex;
  const compare = b === 3 && cue(k, 3, 'Compare two runs', 0) > 0;
  header(
    c,
    'Accumulator precision',
    b === 4
      ? 'Can a later subtraction repair this pair?'
      : compare
        ? 'Which results meet the tolerance?'
        : 'Does the residual survive?',
  );
  if (compare) {
    label(
      c,
      'Reference ≈ ' + residual.toFixed(2) + '    /    absolute tolerance ' + tolerance,
      100,
      316,
      52,
      ink,
    );
    const rows = [[right, right], exampleRuns];
    const visible = [1, cue(k, 3, 'three point one three'), cue(k, 3, 'three point one five')];
    ['Run 1', 'Run 2', 'Within tolerance'].forEach((s, i) =>
      label(c, s, [640, 1035, 1445][i], 436, 38, muted),
    );
    rows.forEach((row, i) => {
      const y = 574 + i * 177;
      label(c, i ? 'Other kernel' : 'Rounded tree', 99, y, 46);
      row.forEach((v, j) =>
        alpha(c, i ? visible[j + 1] : 1, () => num(c, v.toFixed(2), [704, 1101][j], y, 65)),
      );
      const verdict = i ? cue(k, 3, 'Both results') : 1;
      alpha(c, verdict, () =>
        label(
          c,
          row.every(inTolerance) ? 'Both' : 'Neither',
          1450,
          y,
          57,
          row.every(inTolerance) ? teal : rust,
        ),
      );
    });
    note(c, 'Illustrative runs. Test output bits across runs and error against the reference.');
    return;
  }
  if (b === 4) {
    label(c, 'Signed 64-bit integer', 96, 312, 43, muted);
    label(c, 'MAX = ' + max64.toLocaleString('en-US'), 96, 417, 59, ink, 'left', 'Mono');
    const fit = cue(k, 4, 'final mathematical sum fits'),
      overflow = cue(k, 4, 'first pair overflows');
    label(c, 'Exact total', 100, 573, 41);
    label(c, 'MAX + 1 − 1', 689, 573, 49, ink, 'left', 'Mono');
    alpha(c, fit, () => label(c, '= MAX', 1400, 573, 56, teal));
    label(c, 'First pair', 100, 736, 41);
    label(c, 'MAX + 1', 689, 736, 49, ink, 'left', 'Mono');
    alpha(c, overflow, () => label(c, 'Out of range', 1400, 736, 51, rust));
    note(c, 'Every partial must fit in the chosen accumulator.');
    return;
  }
  const cancel = cue(k, 0, 'they cancel'),
    survives = cue(k, 0, 'It survives');
  label(c, 'Cancel first', 90, 291, 42, teal);
  label(c, big(large) + ' + (' + big(-large) + ')', 95, 381, 49, ink, 'left', 'Mono');
  alpha(c, cancel, () => label(c, '= 0', 968, 381, 50, ink, 'left', 'Mono'));
  alpha(c, survives, () => {
    arrow(c, 1132, 379, 1242, 379, teal);
    label(
      c,
      '+ ' + residual.toFixed(2) + '  ≈  ' + left.toFixed(2),
      1283,
      381,
      48,
      teal,
      'left',
      'Mono',
    );
  });
  rule(c, 85, 464, 1835, 464, line, 2);
  label(c, 'Add the residual first', 90, 520, 42, rust);
  const attempt = cue(k, 1, 'add the residual'),
    numberline = cue(k, 1, 'eight apart'),
    near = cue(k, 1, 'Follow the exact sum', 0.8);
  const stored = cue(k, 2, 'minus one hundred million', 0.35),
    again = cue(k, 2, 'Now add'),
    answer = cue(k, 3, 'Zero');
  if (b === 0) {
    label(c, '(−100,000,000 + 3.14) + 100,000,000', 95, 641, 50, muted, 'left', 'Mono');
  }
  alpha(c, attempt, () => label(c, '−100,000,000 + 3.14', 92, 608, 51, ink, 'left', 'Mono'));
  const x = (v) => 1022 + (v + large) * 74;
  alpha(c, numberline, () => {
    rule(c, 965, 735, 1696, 735, muted, 5);
    for (const delta of [0, 8]) {
      const xx = x(-large + delta);
      rule(c, xx, 712, xx, 759, ink, 5);
      label(c, big(-large + delta), xx, 805, 31, muted, 'center', 'Mono');
    }
    alpha(c, near, () => {
      dot(c, x(raw), 735, 11, blue);
      label(c, 'Exact sum ≈ ' + raw.toFixed(2).replace('-', '−'), x(raw), 645, 32, blue, 'center');
    });
    alpha(c, stored, () => {
      arrow(c, x(raw), 697, x(rounded), 697, rust, 4);
      dot(c, x(rounded), 735, 14, rust);
    });
  });
  alpha(c, stored, () => label(c, 'Stored   ' + big(rounded), 95, 713, 42, rust, 'left', 'Mono'));
  if (b >= 2)
    alpha(c, again, () =>
      label(c, '+ 100,000,000   = ' + (answer > 0 ? right : '?'), 95, 797, 43, ink, 'left', 'Mono'),
    );
  note(
    c,
    b === 3 && answer > 0
      ? 'A repeatable zero misses the reference by about 3.14. The tolerance is 0.02.'
      : 'Float32 rounds the result of each addition.',
  );
}
const ux = 575,
  unit = 650;
function massBar(c, title, y, value, color, a = 1) {
  label(c, title, 90, y + 28, 40, ink);
  rule(c, ux, y + 50, ux + unit * 1.65, y + 50, line, 2);
  alpha(c, a, () => {
    rect(c, ux, y, unit * value, 49, color);
    label(c, fixed(value), ux + unit * value + 26, y + 24, 42, ink, 'left', 'Mono');
  });
}
export function softmax(c, k) {
  const b = k.beat.beatIndex;
  header(c, 'Online normalizer', 'What changes when a larger logit arrives?');
  const first = cue(k, 0, "first chunk's denominator"),
    second = cue(k, 1, 'its mass'),
    old = cue(k, 2, 'about point one eight five'),
    combine = cue(k, 2, 'about one point two zero three');
  label(c, 'Chunk A   [2, 1]', 92, 291, 45, teal, 'left', 'Mono');
  alpha(c, cue(k, 1, 'next chunk contains'), () =>
    label(c, 'Chunk B   [4, 0]', 970, 291, 45, blue, 'left', 'Mono'),
  );
  massBar(c, 'A  at maximum 2', 383, states[0].denominator, teal, first);
  alpha(c, cue(k, 1, 'next chunk contains'), () =>
    massBar(c, 'B  at maximum 4', 491, states[1].denominator, blue, second),
  );
  rule(c, 79, 588, 1837, 588, line, 3);
  if (b < 2) {
    if (b === 0 || !second) label(c, 'exp(2 − 2) + exp(1 − 2)', 98, 702, 51, ink);
    else {
      label(c, 'A at the new maximum of 4', 98, 702, 51, ink);
      num(c, '?', 1150, 702, 88, rust);
    }
  } else {
    massBar(c, 'A  at maximum 4', 627, masses[0], teal, old);
    label(c, 'Merged at 4', 90, 780, 41);
    rule(c, ux, 801, ux + unit * 1.65, 801, line);
    alpha(c, combine, () => {
      rect(c, ux, 753, masses[0] * unit, 48, teal);
      rect(c, ux + masses[0] * unit, 753, masses[1] * unit, 48, blue);
      label(c, fixed(denom), ux + denom * unit + 26, 779, 48, ink, 'left', 'Mono');
    });
  }
  note(
    c,
    b === 0
      ? 'At the maximum, exp(0) contributes one full unit.'
      : b === 1
        ? 'Each denominator uses its own chunk’s maximum.'
        : 'For each nonempty finite chunk, multiply its mass by exp(old max − common max).',
  );
}
export function output(c, k) {
  const b = k.beat.beatIndex,
    pp = probs;
  header(
    c,
    b < 2 ? 'Standalone softmax' : 'Tiled attention',
    b < 2
      ? 'What must softmax read again?'
      : b === 2
        ? 'Which way does the weighted value point?'
        : 'What does each attention row keep?',
  );
  if (b < 2) {
    label(
      c,
      'Final state     m = ' + common + '      d ≈ ' + fixed(denom),
      97,
      310,
      48,
      teal,
      'left',
      'Mono',
    );
    const t = cue(k, 1, 'Read each logit again', 1.65);
    label(c, 'Logit', 92, 444, 41, muted);
    label(c, 'Probability', 92, 687, 41, muted);
    logits.forEach((v, i) => {
      const x = 530 + i * 347;
      tag(c, v, x, 444, 165, 90, light);
      const a = Math.min(1, Math.max(0, t * 4 - i));
      alpha(c, a, () => {
        arrow(c, x, 501, x, 613, teal);
      });
      tag(
        c,
        a >= 1 ? (100 * pp[i]).toFixed(1) + '%' : '?',
        x,
        687,
        252,
        90,
        a >= 1 ? '#c2dfd4' : '#e6e4d8',
        ink,
        45,
      );
    });
    note(
      c,
      b === 0
        ? 'The original logits remain available in device memory.'
        : 'p = exp(logit − m) / d     •     4 normalizer reads + 4 output reads',
    );
    return;
  }
  if (b === 3) {
    const tiles = cue(k, 3, 'emit the weighted result', 1.05);
    const size = 8,
      step = 54,
      x = 194,
      y = 326;
    label(c, 'Queries × keys', 100, 272, 38, muted);
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++) {
        const focus = i === 3 && j >= 4;
        rect(c, x + step * j, y + step * i, step - 5, step - 5, focus ? teal : '#d6ddd2');
      }
    label(c, 'One score tile at a time', 100, 811, 42, ink);
    arrow(c, 690, 519, 879, 519, muted, 5);
    label(c, 'Weighted output', 946, 278, 42);
    for (let i = 0; i < size; i++) {
      rect(c, 960, y + step * i, 204, step - 5, i === 3 ? '#b8dbcf' : '#d6ddd2');
      if (i === 3)
        alpha(c, tiles, () =>
          label(c, 'O / d', 1063, y + step * i + 24, 32, ink, 'center', 'Mono'),
        );
    }
    label(c, '1 vector per query', 1218, 524, 44, teal);
    alpha(c, cue(k, 3, 'Masked logits', 0.5), () =>
      label(c, 'Masked entries contribute 0.', 950, 812, 38, muted),
    );
    note(c, 'At fixed head width, the output grows with N. The N × N score pairs still take work.');
    return;
  }
  const joined = cue(k, 2, 'rescale the old weighted sum', 0.85);
  const added = cue(k, 2, 'Add the new values', 0.7);
  const norm = cue(k, 2, 'divide by the total mass', 0.85);
  const origin = [383, 766],
    u = 398;
  const tip = ([right, up]) => [origin[0] + u * right, origin[1] - u * up];
  arrow(c, ...origin, 940, 766, muted, 4);
  arrow(c, ...origin, 383, 286, muted, 4);
  label(c, 'Right', 950, 770, 35, muted);
  label(c, 'Up', 330, 281, 35, muted);
  chunkValues.forEach((value, i) => {
    const name = i === 0 ? 'A' : 'B';
    label(
      c,
      name + ' logits ' + chunks[i].join(', ') + '    →    (' + value.join(', ') + ') each',
      1162,
      353 + 96 * i,
      40,
      i === 0 ? teal : blue,
    );
  });
  if (joined === 0) {
    const oldSum = chunkValues[0].map((v) => states[0].denominator * v);
    arrow(c, ...origin, ...tip(oldSum), teal, 10);
    label(c, 'At m = 2     d ≈ ' + fixed(states[0].denominator), 1157, 609, 38);
  } else {
    const carry = weightedChunks[0];
    alpha(c, joined, () => {
      arrow(c, ...origin, ...tip(carry), teal, 9);
    });
    alpha(c, added, () => arrow(c, ...tip(carry), ...tip(numerator), blue, 9));
    label(
      c,
      added
        ? 'At m = 4     d ≈ ' + fixed(denom)
        : 'A carry at m = 4     mass ≈ ' + fixed(masses[0]),
      1162,
      565,
      35,
      muted,
    );
    label(
      c,
      'O ≈ (' + (added ? numerator : carry).map((v) => (v === 0 ? '0' : fixed(v))).join(', ') + ')',
      1162,
      631,
      39,
      ink,
      'left',
      'Mono',
    );
    alpha(c, norm, () => {
      arrow(c, ...origin, ...tip(vector), rust, 8);
      label(
        c,
        'O / d ≈ (' + vector.map(fixed).join(', ') + ')',
        1162,
        745,
        35,
        rust,
        'left',
        'Mono',
      );
    });
  }
  note(c, 'For finite unmasked logits, rescale both d and the unnormalized weighted vector O.');
}
