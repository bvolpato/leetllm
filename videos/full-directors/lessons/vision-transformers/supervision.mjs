import assert from 'node:assert/strict';
import { stableSoftmax } from 'vizmatic';
import { logits, clip } from '../../../films/vision-transformers/model.mjs';
import { checkRegisters, registerStudy, registerBridge } from './registers.mjs';
import {
  visionCandidateRanking,
  visionPadding,
  visionSiglip,
} from '../../../films/vision-transformers/arithmetic.mjs';
import {
  C,
  rect,
  line,
  text,
  mono,
  caption,
  title,
  fmt,
  vec,
  range,
  sum,
  cue,
  grid,
  cell,
  dial,
  screen,
} from './canvas.mjs';

const transpose = (m) => m[0].map((_, i) => m.map((row) => row[i]));
const rows = logits.map((row) => stableSoftmax(row));
const cols = transpose(transpose(logits).map((row) => stableSoftmax(row)));
export function alignment(c, k) {
  const row = cue(k, 2, 'Read one row across'),
    col = cue(k, 2, 'Read one column down'),
    loss = cue(k, 2, 'Average those losses');
  const data = col ? cols : row ? rows : logits,
    direction = col ? 'Caption → image' : row ? 'Image → caption' : 'Image × caption';
  title(c, direction);
  caption(c, 'Worked example with supplied image and text vectors', 108, 180);
  const x = 350,
    y = 324,
    pitch = 218;
  range(3).forEach((i) => {
    text(c, 'Caption ' + (i + 1), x + i * pitch + 104, y - 70, 37, C.sub, 'center');
    text(c, 'Image ' + (i + 1), x - 44, y + i * 161 + 76, 39, C.sub, 'right');
  });
  data.forEach((rr, r) =>
    rr.forEach((v, j) => {
      const active = col ? j === 0 : row ? r === 0 : r === j;
      rect(
        c,
        x + j * pitch,
        y + r * 161,
        pitch - 8,
        152,
        active ? '#31545b' : C.plate,
        r === j ? C.gold : C.rim,
        r === j ? 4 : 1,
      );
      mono(c, fmt(v), x + j * pitch + 105, y + r * 161 + 75, 52, active ? C.ink : C.sub, 'center');
    }),
  );
  text(c, row ? 'Probability' : 'Scaled cosine', 1135, 350, 55, C.cyan);
  if (row) {
    text(c, col ? 'Sum down column 1' : 'Sum across row 1', 1135, 462, 42);
    mono(c, 'Σ = ' + fmt(sum(col ? cols.map((r) => r[0]) : rows[0])), 1135, 552, 57, C.gold);
  } else {
    mono(c, '3 × (û · v̂)', 1135, 470, 50, C.gold);
    text(c, 'Gold edge = paired example', 1135, 615, 36, C.sub);
  }
  if (loss) {
    caption(c, 'Mean of both cross-entropies', 1135, 710);
    mono(c, 'L = ' + fmt(clip), 1135, 801, 58, C.green);
  }
  if (k.beat.beatIndex === 2)
    caption(c, 'A compatible caption off the diagonal still receives a negative label.', 121, 950);
}
function rankingState(copied) {
  const { scores, probabilities } = visionCandidateRanking(copied);
  const max = Math.max(...scores),
    masses = scores.map((v) => Math.exp(v - max));
  return { scores, probabilities, masses, total: sum(masses) };
}
export function candidates(c, k) {
  const b = k.beat.beatIndex + 1,
    copied = cue(k, 4, 'Copy the failure description') === 1;
  title(c, b < 3 ? 'Two encoders share a comparison space' : 'Keep the screenshot fixed');
  screen(c, 98, 292, 1.1);
  if (b < 3) {
    text(c, 'ViT image tower', 100, 807, 48, C.sub);
    mono(c, '[CLS]', 100, 893, 59, C.cyan);
    text(c, 'Causal text tower', 1020, 335, 49, C.sub);
    mono(c, 'deploy failed  [EOT]', 1020, 445, 50, C.gold);
    if (b === 2) {
      text(c, 'Project and normalize both readouts', 997, 631, 42);
      mono(c, 's = scale × (û · v̂)', 997, 746, 52, C.green);
    }
    return;
  }
  text(c, 'Illustrative scores from supplied vectors', 100, 785, 37, C.sub);
  const r = rankingState(copied),
    answer = copied ? cue(k, 5, 'A little under half') : cue(k, 3, 'The first description gets');
  const names = copied
    ? ['Deploy failed', 'Failed (copy)', 'Deploy succeeded']
    : ['Deploy failed', 'Deploy succeeded'];
  caption(c, 'Candidate', 895, 272);
  caption(c, 'Weight', 1401, 272);
  caption(c, 'Share', 1660, 272);
  names.forEach((name, i) => {
    const y = 391 + i * 140,
      color = name === 'Deploy succeeded' ? C.blue : C.red;
    text(c, name, 895, y, 44, color);
    mono(c, fmt(r.masses[i]), 1400, y, 49, color);
    mono(
      c,
      answer ? fmt(r.probabilities[i] * 100, 1) + '%' : '?',
      1650,
      y,
      46,
      answer ? color : C.gold,
    );
  });
  line(c, 898, 757, 1820, 757);
  caption(c, 'Sum of relative weights', 898, 836);
  mono(c, fmt(r.total), 1540, 836, 53, C.gold);
  if (b >= 5) caption(c, 'Exact transcription still requires a character match.', 100, 970);
}

const pairs = visionSiglip();
export function sigmoid(c, k) {
  const b = k.beat.beatIndex + 1;
  title(c, 'A loss belongs to each image–caption pair');
  const x = 126,
    y = 304,
    w = 401,
    h = 228;
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 2; col++) {
      const px = x + col * (w + 18),
        py = y + r * (h + 18),
        positive = r === col,
        color = positive ? C.green : C.red;
      rect(c, px, py, w, h, C.plate, color, 3);
      text(c, 'I' + (r + 1) + ' × T' + (col + 1), px + 21, py + 43, 37, C.sub);
      mono(c, 'z = ' + fmt(pairs.scores[r][col]), px + 21, py + 108, 46);
      mono(c, 'label ' + (positive ? '+1' : '−1'), px + 21, py + 180, 39, color);
    }
  if (b === 1) {
    caption(c, 'One binary logistic loss', 1055, 367);
    mono(c, 'log(1 + exp(−y z))', 1055, 473, 55, C.gold);
    caption(c, 'z = scale × cosine + bias', 1055, 616);
    return;
  }
  caption(c, 'Loss for each supplied pair', 1075, 253);
  pairs.losses.forEach((rr, r) =>
    rr.forEach((v, j) =>
      cell(c, 1075 + j * 285, 320 + r * 139, 265, 118, fmt(v), r === j ? C.green : C.red, 57),
    ),
  );
  if (cue(k, 3, 'divide by batch size two')) {
    mono(c, fmt(pairs.sum) + ' / 2 ≈ ' + fmt(pairs.objective), 1070, 692, 48, C.gold);
    text(c, 'Normalize by the two images.', 1075, 774, 38, C.sub);
    if (cue(k, 3, 'The mean over four pairs'))
      mono(c, 'Pair mean ≈ ' + fmt(pairs.sum / 4), 1075, 873, 42, C.sub);
  }
  if (b === 4) text(c, 'Remote negatives supply more pairs to the same objective.', 125, 978, 39);
}
const wide = [8, 16],
  tall = [12, 8],
  area = ([h, w]) => h * w;
function mosaic(c, x, y, shape, pitch, color) {
  grid(
    c,
    x,
    y,
    ...shape,
    pitch,
    (r, col) =>
      r === 0
        ? C.rim
        : r / shape[0] > 0.25 && r / shape[0] < 0.59 && col > 0 && col < shape[1] - 1
          ? color
          : C.plate,
    2,
  );
}
export function variable(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    const released = cue(k, 2, 'absent from the released encoder pair');
    title(c, released ? 'Released encoder pair' : 'SigLIP 2 training');
    screen(c, 115, 297, 1.14);
    text(c, 'Attention pooling', 1000, 322, 53, C.cyan);
    line(c, 1000, 390, 1770, 390);
    text(c, 'Image readout ↔ text readout', 1000, 486, 46);
    if (!released) {
      text(c, 'Training heads', 1000, 627, 42, C.gold);
      text(c, 'Captioning and localization', 1000, 716, 44);
      text(c, 'Masked teacher features', 1000, 797, 44);
    } else {
      text(c, 'Auxiliary caption decoder', 1000, 688, 44, C.sub);
      text(c, 'Used during training', 1000, 779, 42, C.gold);
    }
    return;
  }
  const pad = cue(k, 3, 'then pad the shorter sequence', 1.2),
    n = Math.floor((area(wide) - area(tall)) * pad);
  title(c, 'Fit two real grids into one batch');
  mosaic(c, 150, 310, wide, 45, '#9a575a');
  mosaic(c, 1190, 254, tall, 39, '#9a575a');
  mono(c, '8 × 16 = 128 valid', 150, 747, 48, C.cyan);
  mono(c, '12 × 8 = 96 valid', 1110, 787, 49, C.cyan);
  caption(c, 'Sequence after flattening', 148, 878);
  const start = 699,
    unit = 7.8;
  for (let i = 0; i < 96 + n; i++)
    rect(c, start + i * unit, 865, unit - 1, 70, i < 96 ? C.cyan : C.rim);
  text(
    c,
    '96 valid  +  ' + n + ' padding  =  ' + (96 + n) + ' slots',
    start,
    983,
    40,
    n ? C.gold : C.ink,
  );
}
function poolState(pad, mask) {
  const data = visionPadding(pad, mask);
  const exp = data.values.map((r, i) => (mask && i >= 2 ? 0 : Math.exp(r[0] / Math.SQRT2)));
  const numerator = data.output.map((_, j) => sum(data.values.map((v, i) => exp[i] * v[j])));
  return { ...data, exp, numerator, denom: sum(exp) };
}
const paddingCount = 4;
const unpaddedPool = poolState(0, false);
const unmaskedPool = poolState(paddingCount, false);
const maskedPool = poolState(paddingCount, true);

function paddingResultSpoken(k, phrase, captionStart = phrase) {
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

export function padding(c, k) {
  const beat = k.beat.beatIndex + 1;
  const added = cue(k, 2, 'Append four zero vectors', 1.8);
  const masked = cue(k, 3, 'Mask those four keys', 1.4);
  const predict = beat === 1 && k.reveal('Predict what adding four such keys', 0, { captionStart: false });
  const diluted =
    beat > 2 ||
    (beat === 2 &&
      paddingResultSpoken(
        k,
        'the result changes to about point nine one three, point two three one',
        'point nine one three',
      ));
  const restored =
    beat > 3 ||
    (beat === 3 && paddingResultSpoken(k, 'and the original readout returns'));
  let state;
  if (added === 0) state = unpaddedPool;
  else if (masked === 1) state = maskedPool;
  else if (added === 1 && masked === 0) state = unmaskedPool;
  const showResult =
    state === unpaddedPool ||
    (state === unmaskedPool && diluted) ||
    (state === maskedPool && restored);

  title(c, 'What does padding do to the readout?');
  const x = 144;
  caption(c, 'Fixed query [1, 0]     •     Each input is both key and value', x, 182);
  const cardWidth = 246;
  const cardY = 280;
  const denominatorY = 773;
  const termScale = 84;
  const patchColors = [C.cyan, C.blue];
  let edge = x;
  unpaddedPool.values.forEach((value, i) => {
    const px = x + i * 280;
    const color = patchColors[i];
    text(c, 'Patch ' + (i + 1), px, 237, 37, color);
    cell(c, px, cardY, cardWidth, 98, vec(value), color, 39);
    mono(c, 'exp ≈ ' + fmt(unpaddedPool.exp[i]), px, 419, 36, color);
    const width = unpaddedPool.exp[i] * termScale;
    rect(c, edge, denominatorY, width - 4, 44, color);
    edge += width;
  });
  if (added === 0 && cue(k, 1, 'its exponential is positive')) {
    caption(c, 'One zero pad', 831, 263);
    mono(c, '[0, 0]     exp(0) = 1', 831, 339, 47, C.gold);
  }
  for (let i = 0; i < paddingCount; i++) {
    const present = Math.min(1, Math.max(0, paddingCount * added - i));
    if (!present) continue;
    const included = Math.min(present, Math.max(0, paddingCount * (1 - masked) - i));
    const px = x + (i + 2) * 280;
    const color = included ? C.gold : C.sub;
    const mass = unmaskedPool.exp[i + unpaddedPool.values.length];
    c.save();
    c.globalAlpha *= present;
    text(c, 'Pad ' + (i + 1), px, 237, 37, color);
    cell(c, px, cardY, cardWidth, 98, '[0, 0]', color, 39);
    mono(c, included ? 'exp(0) = ' + fmt(mass) : 'Masked', px, 419, 36, color);
    c.restore();
    // Each new unit extends the denominator on the same scale as the two valid terms.
    if (included) rect(c, edge, denominatorY, (mass * termScale - 4) * included, 44, C.gold);
    edge += mass * termScale;
  }

  text(c, 'Sum of exp(score) × value', x, 529, 43, C.sub);
  mono(c, '≈ ' + vec(unpaddedPool.numerator), x, 605, 59, C.ink);
  line(c, x, 668, 958, 668, C.rim);
  text(c, 'Sum of exp(score)', x, 724, 43, C.sub);
  mono(c, '≈ ' + fmt(unpaddedPool.denom), x, 873, 56, C.cyan);
  if (added > 0 && masked < 1) {
    const padMass = unmaskedPool.denom - unpaddedPool.denom;
    mono(c, '+ ' + (state ? fmt(padMass) : '⋯'), x + 304, 873, 56, C.gold);
    if (state === unmaskedPool) mono(c, '= ' + fmt(state.denom), x + 535, 873, 56, C.ink);
  }
  text(c, '=', 1040, 663, 58, C.sub);
  text(c, 'Pooled vector', 1180, 529, 43, C.sub);
  mono(c, showResult ? '≈ ' + vec(state.output) : '?', 1180, 663, 59, showResult ? C.green : C.gold);
  if (predict) {
    caption(c, 'With four unmasked pads', 1180, 794);
    mono(c, 'Larger or smaller?', 1180, 868, 45, C.gold);
  } else if (added > 0) {
    caption(c, 'Without padding', 1180, 794);
    mono(c, '≈ ' + vec(unpaddedPool.output), 1180, 868, 45, C.sub);
  }
  if (beat === 4 && k.reveal('Remove padded outputs from pooling', 0, { captionStart: false }))
    caption(c, 'Remove padded query outputs from the readout too.', x, 476);
}

const teacher = [0.7, 0.2, 0.1];
const featureBasis = (a) => [
  [Math.cos(a), Math.sin(a)],
  [-Math.sin(a), Math.cos(a)],
];
const gram = (v) => v.map((r) => v.map((s) => sum(r.map((val, j) => val * s[j]))));
export function features(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b <= 2) {
    title(c, 'Predict the feature at the hidden button');
    [0, 1].forEach((i) => {
      const x = 99 + i * 924,
        y = 268,
        scale = 1.13;
      text(c, i ? 'Student' : 'EMA teacher', x, y - 55, 47, i ? C.gold : C.cyan);
      screen(c, x, y, scale);
      rect(
        c,
        x + 550 * scale,
        y + 242 * scale,
        109 * scale,
        74 * scale,
        i ? C.deep : null,
        i ? C.gold : C.cyan,
        7,
      );
      if (i) text(c, '?', x + 603 * scale, y + 280 * scale, 57, C.gold, 'center');
      const swapped = i && cue(k, 2, 'Swapping its first and last');
      const v = swapped ? [0.1, 0.2, 0.7] : teacher;
      if (!i || cue(k, 1, 'The student predicts')) {
        mono(c, vec(v), x, y + 525, 55, i ? C.gold : C.cyan);
        text(
          c,
          i
            ? swapped
              ? 'Different student prediction'
              : 'Matching student prediction'
            : 'Teacher feature probabilities',
          x,
          y + 611,
          37,
          C.sub,
        );
      }
    });
    if (b === 2) caption(c, 'Depth and segmentation require trained task readouts.', 102, 989);
  } else if (b < 5) {
    title(c, 'Compare patch relationships');
    const a = (cue(k, 4, 'shared ninety-degree rotation', 2) * Math.PI) / 2;
    [0, 1].forEach((i) => {
      const x = 568 + i * 835,
        rotation = i ? a : 0;
      text(c, i ? 'Student' : 'Teacher reference', x, 254, 51, C.ink, 'center');
      dial(c, x, 522, 168, [rotation, rotation + Math.PI / 2], [C.cyan, C.gold]);
      const g = gram(featureBasis(rotation));
      mono(c, 'G = [' + g.map((r) => vec(r, 2)).join(', ') + ']', x, 837, 41, C.green, 'center');
    });
    caption(c, 'Each entry is a dot product of normalized patch features.', 128, 969);
  } else if (b === 5) registerStudy(c, k);
  else registerBridge(c, k);
}
export function checkSupervision() {
  checkRegisters();
  rows.forEach((r) => assert.ok(Math.abs(sum(r) - 1) < 1e-10));
  transpose(cols).forEach((r) => assert.ok(Math.abs(sum(r) - 1) < 1e-10));
  assert.equal(fmt(clip), '0.155');
  assert.equal(fmt(rankingState(true).probabilities[1] * 100, 1), '49.4');
  for (const copied of [true, false]) assert.ok(rankingState(copied).total >= 1);
  assert.equal(fmt(pairs.sum / 2), '0.56');
  assert.equal(area(wide) - area(tall), 32);
  const base = unpaddedPool,
    diluted = unmaskedPool,
    repaired = maskedPool;
  assert.equal(fmt(diluted.denom - base.denom), '4');
  assert.deepEqual(diluted.exp.slice(2), [1, 1, 1, 1]);
  assert.deepEqual(base.numerator, diluted.numerator);
  assert.deepEqual(base.numerator, repaired.numerator);
  for (const state of [base, diluted, repaired]) {
    state.output.forEach((value, i) =>
      assert.ok(Math.abs(value - state.numerator[i] / state.denom) < 1e-12),
    );
  }
  assert.deepEqual(base.output, repaired.output);
  assert.deepEqual(
    diluted.output.map((v) => fmt(v)),
    ['0.913', '0.231'],
  );
  assert.equal(sum(teacher).toFixed(6), '1.000000');
  for (const a of [0, Math.PI / 4, Math.PI / 2])
    assert.ok(Math.abs(gram(featureBasis(a))[0][1]) < 1e-12);
}
