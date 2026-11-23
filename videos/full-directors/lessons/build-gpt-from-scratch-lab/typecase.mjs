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
import { prompt } from '../../../films/build-gpt-from-scratch-lab/prompt.mjs';
import {
  bytePieceFixture,
  tiedOutput,
  corpusCounts,
  samplerWindow,
} from '../../../films/build-gpt-from-scratch-lab/arithmetic.mjs';

export function opening(d) {
  const { rect, line, text, serif, mono, label, path, oval, cue, stock, alpha } = d;
  const hasSir = cue(1, 'a space and sir', 0),
    cursorStart = cue(1, 'then a comma', 0);
  const choice = cue(1, 'which piece comes next', 0.4);
  const answered = cue(2, "It's the line break", 0);
  const carriage = cue(2, 'append just that piece', 0.9);
  rect(0, 0, 960, 540, dark);
  // A standing page of type and a separate sheet in the carriage keep truth and generation apart.
  stock(34, 33, 439, 456, '#e8d4a6');
  stock(47, 23, 432, 457, sheet);
  rect(66, 28, 3, 448, '#e2d0a8');
  label('SOURCE PROOF', 91, 78, teal);
  line(88, 100, 441, 100, ink, 1);
  line(88, 105, 441, 105, ink, 2);
  serif('Good sir', 84, 233, 78);
  serif(',', 374, 233, 78, cursorStart ? rust : ink);
  serif('Speak plain.', 86, 321, 62);
  line(89, 351, 435, 351, rule);
  alpha(answered, () => {
    path(
      [
        [417, 200],
        [417, 246],
        [99, 246],
        [99, 259],
      ],
      rust,
      2,
    );
    d.arrow(99, 250, 99, 267, rust, 2);
  });
  label('MODEL INPUT', 540, 79, pale);
  stock(530, 110, 391, 200, paper);
  const prefix = 'Good' + (hasSir ? ' sir' : '') + (cursorStart ? ',' : '');
  serif(prefix, 557, 198, 58);
  const end = 557 + d.ctx.measureText(prefix).width + 3;
  const x = lerp(end, 557, carriage),
    y = lerp(210, 267, carriage);
  rect(x, y, 26, 5, rust);
  // The roller, platen rule, graduation marks and return lever surround the moving writing point.
  rect(517, 312, 414, 13, '#0b2326');
  rect(528, 316, 390, 3, '#829a88');
  oval(921, 318, 11, 15, '#b89a5d');
  rect(530, 333, 389, 13, '#b89a5d');
  for (let i = 0; i < 45; i++) rect(534 + 8.5 * i, 334, 1, i % 5 ? 4 : 8, dark);
  alpha(choice, () => {
    label(answered ? 'OBSERVED SUCCESSOR' : 'NEXT PIECE', 540, 392, pale);
    if (!answered) {
      d.slug('Spe', 540, 408, 72, 46, ink);
      label('start of Speak', 624, 438, pale);
      text('or', 748, 438, 19, pale);
      d.slug('↵', 779, 408, 50, 46, ink, 'Mono');
      label('line break', 841, 438, pale);
    } else {
      d.slug('↵', 540, 411, 90, 61, rust, 'Mono');
      serif('line break', 655, 454, 38, sheet);
    }
  });
}

// The strip has one more source piece than input slots. Its moving edge selects the labels.
export function labelStrip(d, values, x, y, step, shift, focus = 2) {
  const { ctx, rect, line, slug } = d,
    n = values.length - 1;
  d.tray(x - 6, y - 6, step * n + 8, 67);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 1, y - 3, step * n, 64);
  ctx.clip();
  values.forEach((v, i) =>
    slug(
      v,
      x + (i - shift) * step,
      y,
      step - 8,
      52,
      Number.isInteger(shift) && i === focus + shift ? rust : ink,
      typeof v === 'number' ? 'Mono' : 'Serif',
      31,
    ),
  );
  ctx.restore();
  line(x + focus * step - 1, y + 60, x + (focus + 1) * step - 8, y + 60, rust, 4);
}
export function targets(d) {
  const { field, mono, label, slug, cue, bracket, serif } = d,
    p = prompt.map((t) => t.piece);
  field('Two rails under one passage', 'GPT-2 pieces   /   five scored positions');
  const x = 170,
    s = 118,
    move = cue(2, 'Slide the labels', 0.9);
  label('Source', 46, 182);
  p.forEach((v, i) => slug(v, x + i * s, 144, 103, 52, i === 2 ? rust : ink));
  label('Input', 46, 288);
  p.slice(0, -1).forEach((v, i) => slug(v, x + i * s, 249, 103, 54, i === 2 ? rust : ink));
  label('Label', 46, 389);
  labelStrip(d, p, x, 349, s, move);
  d.arrow(x + 2 * s + 49, 311, x + 2 * s + 49, 341, rust);
  if (move === 0 && cue(2, 'Another comma', 0)) serif('Copying earns credit.', 170, 467, 32, rust);
  if (move === 1) {
    bracket(x + 4 * s, 425, x + 5 * s - 9);
    mono('Spe → ak', x + 4 * s, 462, 22, blue);
    serif('Comma → line break', 170, 465, 32, teal);
  }
}
export function bytes(d) {
  const { b, field, label, slug, cue, serif, mono, rect, stock, oval, path, alpha } = d;
  if (b < 3) {
    field('Speak takes two pieces', 'Read each piece with its GPT-2 ID');
    const x = 48,
      s = 146;
    prompt.forEach((v, i) => {
      const active = i >= 4 ? cue(1, 'Speak spans', 0) : i === 3 ? cue(2, 'line break', 0) : 0;
      slug(v.piece, x + i * s, 180, 131, 110, active ? rust : ink, 'Serif', 45);
      mono(v.original, x + i * s + 65, 340, 25, ink, 'center');
    });
    d.bracket(x + 4 * s, 368, x + 6 * s - 17, blue);
    serif('Speak', x + 5 * s - 9, 415, 39, blue, 'center');
    if (b === 2) {
      d.bracket(x + 2 * s, 368, x + 4 * s - 17, rust);
      label('comma predicts ID 198', x + 3 * s - 9, 410, rust, 'center');
    }
    return;
  }
  const f = bytePieceFixture(),
    join = cue(4, 'Join the next two bytes', 0.8);
  field('One character across two pieces', 'Full GPT-2 byte vocabulary');
  const x1 = 109,
    x2 = lerp(520, 405, join);
  [x1, x2].forEach((x, i) => {
    stock(x, 183, 293, 90, i ? pale : peach);
    mono(
      f.pieces[i].map((n) => n.toString(16).toUpperCase()).join('  '),
      x + 146,
      245,
      42,
      ink,
      'center',
    );
    label('piece ' + (i + 1), x + 3, 169);
  });
  if (!join && cue(3, 'Decode the two pieces separately', 0)) {
    for (const x of [251, 644, 688]) {
      path(
        [
          [x, 298],
          [x + 17, 318],
          [x, 338],
          [x - 17, 318],
        ],
        rust,
        1,
        true,
      );
      mono('?', x, 326, 21, sheet, 'center');
    }
    label(
      'Separate decodes produce ' + f.replacementCount + ' replacement characters',
      109,
      402,
      rust,
    );
  }
  if (join === 1) {
    d.bracket(109, 295, 698, teal);
    mono(f.unicode, 253, 365, 39, teal);
    oval(578, 351, 33, 33, gold);
    oval(567, 344, 3, 3, ink);
    oval(589, 344, 3, 3, ink);
    path(
      [
        [562, 354],
        [568, 363],
        [577, 366],
        [588, 363],
        [595, 354],
      ],
      ink,
      3,
    );
    label('Joined bytes decode as one character', 109, 429);
  }
}
export function vocab(d) {
  const { rect, field, label, mono, serif, slug, cue, arrow, table, b } = d;
  field('The comma in the type case', 'Sorted Shakespeare IDs   /   selected rows');
  const comma = prompt.find((token) => token.piece === ',');
  const found = cue(1, "That's the row", 0),
    back = b === 2,
    decoded = cue(2, 'Decode that ID', 0);
  const rows = [...prompt].sort((a, b) => a.local - b.local);
  table(
    48,
    156,
    [
      ['Piece', 95],
      ['GPT-2', 110],
      ['Local row', 121],
    ],
    rows.map((v) => [v.piece, fmt(v.original), fmt(v.local)]),
    { step: 43, focus: found && b < 3 ? rows.indexOf(comma) : -1 },
  );
  if (b < 3) {
    label(back ? 'Local row to GPT-2 ID' : 'GPT-2 ID to local row', 468, 158, teal);
    d.tray(463, 183, 421, 110);
    slug(back ? comma.local : comma.original, 478, 197, 130, 72, blue, 'Mono', 40);
    const result = back ? comma.original : comma.local;
    slug((back ? decoded : found) ? result : '?', 738, 197, 130, 72, rust, 'Mono', 40);
    arrow(622, 233, 721, 233, gold);
    label(back ? 'local' : 'GPT-2', 481, 327);
    label(back ? 'GPT-2' : 'local', 741, 327);
    if (back && decoded) serif('prints a comma', 469, 379, 34, teal);
  } else {
    label('NEW PROMPT', 478, 169);
    serif('Missing piece', 478, 225, 41, rust);
    mono('GPT-2 ID → no row', 478, 282, 24);
    d.line(478, 305, 861, 305, rust, 3);
    label('Reject before embedding lookup', 478, 344, rust);
  }
  rect(49, 450, 844, 16, '#c9c0a1');
  rect(49, 450, (844 * 17485) / 50257, 16, blue);
  label('17,485 active rows', 49, 495, blue);
  label('50,257 full IDs', 892, 495, faded, 'right');
}
export function support(d) {
  const { b, cue, rect, label, serif, mono, field, table } = d;
  if (b <= 2) {
    const reduced = cue(1, 'Shrink it', 0),
      counted = cue(1, 'Compare the two bars', 0),
      whole = cue(2, 'Now compare the whole models', 0);
    field(
      whole ? 'Parameters in the whole model' : 'One matrix, read both ways',
      whole
        ? 'Same decoder blocks and position table in both models'
        : 'Embedding lookup by row   /   vocabulary scoring by dot product',
    );
    const f = tiedOutput(),
      base = whole ? f.fullTotal : f.fullWeights,
      value = whole ? f.compactTotal : reduced ? f.compactWeights : base;
    label(whole ? 'ALL PARAMETERS' : 'TIED MATRIX WEIGHTS', 54, 175);
    mono(fmt(base), 54, 247, 50, ink);
    rect(54, 269, 828, 34, ink);
    if (reduced) {
      mono(counted ? fmt(value) : '?', 54, 381, 50, blue);
      if (counted) rect(54, 399, (828 * value) / base, 34, blue);
    }
    label(whole ? 'Full vocabulary model' : '50,257 rows × 96', 894, 246, faded, 'right');
    if (reduced) label(whole ? 'Compact model' : '17,485 rows × 96', 894, 381, blue, 'right');
    if (counted)
      label(
        ((1 - value / base) * 100).toFixed(1) +
          '% fewer ' +
          (whole ? 'parameters' : 'weights in this matrix'),
        54,
        480,
        teal,
      );
    return;
  }
  if (b < 6) {
    const removed = cue(5, 'Take row two out', 0),
      f = tiedOutput(removed ? 0 : 1);
    field(
      removed ? 'Two rows compete for the target' : 'Three rows compete for one target',
      'Hidden vector h = [1, 0]   /   target = row 1   /   shares and gradients shown rounded',
    );
    table(
      45,
      157,
      [
        ['Row', 155],
        ['Embedding', 160],
        ['Score', 95],
        ['Share', 125],
      ],
      f.rows.map((r, i) => [
        i + (i === 1 ? '  target' : i === 0 ? '  input' : ''),
        vec(r),
        i === 2 && removed ? '–' : f.logits[i],
        i === 2 && removed ? 'out' : (100 * f.probabilities[i]).toFixed(1) + '%',
      ]),
      { step: 60, focus: 1 },
    );
    let y = 185;
    f.probabilities.forEach((v, i) => {
      rect(620, y, 370 * v, 26, i === 1 ? rust : blue);
      y += 60;
    });
    if (cue(4, 'Its share times', 0) && !removed)
      mono('∂L/∂row 2 ≈ ' + vec(f.gradientUnused.map((x) => +x.toFixed(4))), 49, 425, 26);
    if (removed) mono('L = −ln(p₁) ≈ ' + f.loss.toFixed(3) + ' nats', 49, 425, 26, teal);
  } else {
    field('Who chose the active rows?', 'Support built from the entire file');
    const w = 810,
      only = 335,
      all = 17485;
    rect(57, 205, w, 80, blue);
    rect(57 + w * (1 - only / all), 205, (w * only) / all, 80, gold);
    mono(fmt(all - only), 70, 259, 39, sheet);
    label('IDs seen in training', 62, 318, blue);
    d.path(
      [
        [857, 289],
        [857, 335],
        [735, 335],
      ],
      rust,
      2,
    );
    mono('335', 672, 354, 32, rust);
    label('validation-only IDs', 672, 389, rust);
    serif('Independent evaluation', 58, 418, 34);
    label('Fix the support and missing-piece policy before examining the holdout.', 59, 455);
  }
}
export function exposure(d) {
  const { b, field, rect, label, serif, mono, cue, line } = d,
    f = corpusCounts();
  if (b <= 4) {
    field(
      'From a whole file to sampled windows',
      'Bundled Shakespeare corpus   /   file-order split',
    );
    label(fmt(f.bytes) + ' bytes', 48, 165);
    if (cue(1, 'Tokenize the bundled Shakespeare file', 0))
      mono(fmt(f.tokens) + ' pieces', 48, 214, 37);
    const x = 49,
      w = 855,
      y = 243;
    const split = cue(1, 'Split the stream in file order', 0);
    rect(x, y, w, 55, split ? blue : '#c8c1a7');
    if (split) {
      rect(x + (w * f.train) / f.tokens, y, (w * f.validation) / f.tokens, 55, gold);
      label(fmt(f.train) + ' training', x, 333, blue);
      label(fmt(f.validation) + ' validation', x + w, 333, rust, 'right');
    }
    if (b >= 3) {
      for (const dx of [0.13, 0.16, 0.44, 0.67])
        d.bracket(x + w * dx, 311, x + w * (dx + 0.06), ink);
      const perUpdate = cue(3, 'At that rate', 0);
      mono(
        '12 × 48 = ' + (perUpdate ? f.targetsPerUpdate : '?') + ' targets / update',
        49,
        390,
        25,
      );
      if (perUpdate) {
        const total = cue(3, 'Compare that count', 0);
        mono(
          '321 × ' + f.targetsPerUpdate + ' = ' + (total ? fmt(f.scored) : '?') + ' targets',
          49,
          430,
          25,
          teal,
        );
      }
      if (cue(3, 'Overlapping windows', 0))
        label(
          '≈ ' + (100 * f.fraction).toFixed(1) + '% of the training stream’s length',
          570,
          427,
          teal,
        );
      if (b === 4)
        label(
          'Windows may overlap. Validation samples 8 × 576 = ' +
            fmt(f.validationScored) +
            ' targets.',
          49,
          470,
        );
    }
  } else {
    const constant = cue(6, 'puts ninety percent', 0);
    field('A low loss with no input access', 'Cross-entropy in nats per target');
    label('SHAKESPEARE', 52, 162);
    mono('ln(17,485) ≈ ' + f.uniformLoss.toFixed(3), 52, 213, 32);
    label('Uniform reference', 52, 249);
    mono('9.775', 586, 212, 32);
    label('First training batch', 586, 249);
    line(51, 278, 900, 278);
    label('FOUR-PIECE FIXTURE   /   EVERY TARGET IS 0', 52, 327);
    mono(constant ? 'p(0) = 0.90' : 'p(0) = 0.25', 52, 380, 30);
    rect(53, 404, 410, 26, '#c8c1a7');
    rect(53, 404, 410 * (constant ? 0.9 : 0.25), 26, blue);
    mono(
      'L ≈ ' + (constant ? f.constantLoss : Math.log(4)).toFixed(3),
      554,
      412,
      39,
      constant ? rust : ink,
    );
    label(constant ? 'Constant predictor' : 'Uniform predictor', 554, 448);
  }
}
export const splitExample = { train: 16, validation: 4, context: 4 };

export function boundaries(d) {
  const { b, field, slug, cue, label, mono, serif, rect } = d;
  const { train, validation, context } = splitExample;
  const length = train + validation;
  if (b <= 2) {
    const join = cue(1, 'Push the second chunk', 0.9),
      split = cue(1, 'A single cut', 0);
    field(
      split ? 'Keep the neighbors inside each portion' : 'Which transition did the join create?',
      'Positions in an increasing source stream',
    );
    const x = 48,
      s = 43;
    Array.from({ length }, (_, i) =>
      slug(
        i,
        x + i * s,
        157,
        39,
        42,
        split ? (i < train ? blue : rust) : i < 4 || (i >= 8 && i < 12) ? blue : faded,
        'Mono',
        18,
      ),
    );
    if (!split) {
      label(join === 1 ? 'Joined training chunks' : 'Selected training chunks', 49, 272);
      [0, 1, 2, 3, 8, 9, 10, 11].forEach((v, i) =>
        slug(
          v,
          49 + 68 * i + (i >= 4 ? 115 * (1 - join) : 0),
          306,
          64,
          63,
          i === 3 || i === 4 ? rust : ink,
          'Mono',
          29,
        ),
      );
      if (cue(1, 'In the source', 0))
        mono('3 → 8   /   source neighbor was 4', 49, 448, 26, rust);
    } else {
      rect(x, 211, s * train - 5, 16, blue);
      rect(x + train * s, 211, validation * s - 5, 16, gold);
      label('Training positions 0–15', x, 264, blue);
      label('Validation 16–19', 909, 264, rust, 'right');
      serif('15   |   16', 288, 382, 62);
      label('No scored pair across the split', 282, 432, teal);
    }
  } else {
    const edge = b === 5;
    const holdout = b === 4 && cue(4, 'Try the validation portion', 0);
    const n = edge ? (cue(5, 'Remove that last token', 0) ? 48 : 49) : holdout ? validation : train;
    const t = edge ? 48 : context;
    const hasWindow = n > t;
    const start = !edge && !holdout ? Math.round((n - t - 1) * cue(3, 'Slide it', 1.25)) : 0;
    const portion = edge
      ? 'Separate lab example'
      : holdout
        ? 'Validation portion'
        : 'Training portion';
    field(
      'The last input needs a successor',
      portion + '   /   N = tokens in this portion   /   0 ≤ start < N − T',
    );
    mono('N = ' + n + '     T = ' + t, 49, 185, 35);
    label('Possible starts', 49, 244);
    mono(
      !hasWindow ? 'none' : edge ? '0' : '0 through ' + samplerWindow(n, t, start).lastStart,
      49,
      300,
      37,
      hasWindow ? ink : rust,
    );
    if (hasWindow) {
      const win = samplerWindow(n, t, start);
      label('Last input', 417, 244);
      slug(win.input.at(-1), 417, 263, 120, 81, blue, 'Mono', 42);
      d.arrow(553, 303, 636, 303);
      label('Last target', 655, 244);
      slug(win.target.at(-1), 655, 263, 120, 81, rust, 'Mono', 42);
      mono('start = ' + start, 50, 411, 29, blue);
      if (!edge && cue(3, 'Start twelve', 0))
        label('Start 12 would score validation position 16.', 419, 412, rust);
    } else {
      serif(holdout ? 'No validation window' : 'Reject the stream', 418, 300, 40, rust);
      label(t + ' inputs require ' + (t + 1) + ' tokens in this portion.', 419, 351);
    }
    if (!edge) {
      for (let i = 0; i < length; i++) {
        const active = hasWindow && i >= start && i < start + t;
        const target = hasWindow && i === start + t;
        const x = 48 + i * 43;
        rect(x, 435, 39, 28, target ? rust : active ? blue : sheet);
        mono(i, x + 19.5, 456, 17, active || target ? sheet : ink, 'center');
      }
      rect(48, 466, train * 43 - 4, 4, blue);
      rect(48 + train * 43, 466, validation * 43 - 4, 4, gold);
      label('Training 0–15', 48, 493, blue);
      label('Validation 16–19', 904, 493, rust, 'right');
    }
  }
}
