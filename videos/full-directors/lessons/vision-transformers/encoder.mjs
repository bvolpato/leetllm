import assert from 'node:assert/strict';
import { ps, pos, tokens } from '../../../films/vision-transformers/fixtures.mjs';
import {
  attend,
  placed,
  visionRotary,
  visionPreln,
} from '../../../films/vision-transformers/arithmetic.mjs';
import { weights } from '../../../films/vision-transformers/model.mjs';
import {
  C,
  rect,
  line,
  arrow,
  disc,
  text,
  mono,
  caption,
  title,
  fmt,
  vec,
  mix,
  range,
  sum,
  cue,
  grid,
  cell,
  dial,
  screen,
} from './canvas.mjs';

export function positions(c, k) {
  const b = k.beat.beatIndex + 1,
    stamped = b >= 2;
  const move = stamped ? cue(k, 2, 'then repeat the swap', 1.4) : cue(k, 1, 'trade places', 1.4);
  const placeRows = (rows) => (stamped ? placed(rows) : rows);
  const before = attend(placeRows(ps)),
    after = attend(placeRows([...ps].reverse()));
  title(c, stamped ? 'Leave the position vectors in their slots' : 'Trade the two patch contents');
  const origin = [190, 1170];
  origin.forEach((x, i) => {
    rect(c, x, 455, 560, 205, C.deep, C.rim, 4);
    caption(c, 'Slot ' + (i + 1), x, 300);
    if (stamped) mono(c, '+ ' + vec(pos[i]), x + 280, 732, 52, C.gold, 'center');
  });
  ps.forEach((row, i) => {
    const x = mix(origin[i], origin[1 - i], move);
    const y = 472 + (i ? 1 : -1) * Math.sin(move * Math.PI) * 137;
    cell(c, x + 18, y, 524, 171, (i ? 'B  ' : 'A  ') + vec(row), i ? C.blue : C.cyan, 55);
  });
  caption(c, 'Fixed query [1, 0]', 120, 862);
  mono(c, 'Before  ' + vec(before), 120, 945, 48, C.sub);
  if (move === 1) mono(c, 'After  ' + vec(after), 1000, 945, 48, C.green);
  if (b === 3)
    text(
      c,
      'ViT prepends a learned class token. Its final state summarizes the sequence.',
      120,
      242,
      38,
      C.ink,
    );
}

const cls = [0, 1, 2];
const oldGrid = range(196).map((i) => [3 * i + 3, 3 * i + 4, 3 * i + 5]);
function cubic(d) {
  const x = Math.abs(d),
    a = -0.75;
  if (x <= 1) return (a + 2) * x ** 3 - (a + 3) * x * x + 1;
  if (x < 2) return a * x ** 3 - 5 * a * x * x + 8 * a * x - 4 * a;
  return 0;
}
function resizeGrid(rows, cols) {
  return range(rows * cols).map((i) => {
    const y = ((Math.floor(i / cols) + 0.5) * 14) / rows - 0.5,
      x = (((i % cols) + 0.5) * 14) / cols - 0.5;
    const v = [0, 0, 0];
    for (let r = Math.floor(y) - 1; r <= Math.floor(y) + 2; r++)
      for (let col = Math.floor(x) - 1; col <= Math.floor(x) + 2; col++) {
        const src = oldGrid[Math.min(13, Math.max(0, r)) * 14 + Math.min(13, Math.max(0, col))];
        const w = cubic(y - r) * cubic(x - col);
        src.forEach((n, j) => (v[j] += n * w));
      }
    return v;
  });
}
const newGrid = resizeGrid(16, 20);
function tone(v) {
  const t = Math.max(0, Math.min(1, v[0] / 588));
  return (
    'rgb(' +
    Math.round(65 + 140 * t) +
    ',' +
    Math.round(112 + 112 * t) +
    ',' +
    Math.round(177 - 62 * t) +
    ')'
  );
}
export function resize(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1) {
    title(c, 'Same patch reader, longer position table');
    const expand = cue(k, 1, 'A two-hundred-fifty-six square');
    [
      [14, 224, 160],
      [16, 256, 1070],
    ].forEach(([n, side, x], i) => {
      if (i && !expand) return;
      const size = 475 / n;
      grid(
        c,
        x,
        281,
        n,
        n,
        size,
        (r, col) => tone(oldGrid[Math.floor((r / n) * 14) * 14 + Math.floor((col / n) * 14)]),
        1.8,
      );
      text(c, side + ' × ' + side + ' pixels', x, 226, 46);
      mono(c, n + ' × ' + n + ' + CLS = ' + (n * n + 1), x, 837, 43, C.gold);
    });
    caption(c, '16 × 16 × 3 = 768 raw RGB values per patch', 160, 961);
    return;
  }
  const lift = cue(k, 2, 'Lift the class position out', 1.3),
    unfold = cue(k, 2, 'Unfold the remaining rows', 2);
  const resample = cue(k, 2, 'Interpolate each feature channel', 1.7);
  const flatten = cue(k, 2, 'Flatten the resized grid', 1.6),
    attach = cue(k, 2, 'then reattach', 1.3);
  title(c, 'Resize the spatial positions');
  const startX = 415,
    stripY = 811,
    stripW = 1365,
    gridX = 783,
    gridY = 200,
    pitch = 32;
  function field(data, cols, opening, closing, alpha) {
    if (alpha <= 0) return;
    c.save();
    c.globalAlpha *= alpha;
    data.forEach((v, i) => {
      const sx = startX + (i * stripW) / data.length,
        gx = gridX + (i % cols) * pitch,
        gy = gridY + Math.floor(i / cols) * pitch;
      const f = opening * (1 - closing);
      rect(
        c,
        mix(sx, gx, f),
        mix(stripY, gy, f),
        mix(stripW / data.length, pitch - 2, f),
        mix(74, pitch - 2, f),
        tone(v),
      );
    });
    c.restore();
  }
  field(oldGrid, 14, unfold, 0, 1 - resample);
  field(newGrid, 20, 1, flatten, resample);
  const cx = 128,
    cy = stripY - 470 * lift * (1 - attach);
  cell(c, cx, cy, 267, 74, 'CLS [0,1,2]', C.gold, 34);
  if (lift > 0 && attach < 1) caption(c, 'Held apart', cx, cy - 47);
  const assembled = attach === 1;
  const name = assembled
    ? '321 positions'
    : flatten === 1
      ? '320 patch positions'
      : resample === 1
        ? '16 rows × 20 columns'
        : resample > 0
          ? 'Bicubic interpolation'
          : unfold === 1
            ? '14 rows × 14 columns'
            : '196 patch positions';
  text(c, name, 1120, 950, 51, C.ink, 'center');
  if (flatten === 1) {
    grid(c, gridX, gridY, 16, 20, pitch, (r, col) => tone(newGrid[r * 20 + col]));
    caption(c, 'Resized patch grid', 120, 234);
    line(c, 340, 277, gridX - 20, gridY + 47, C.rim);
    if (b === 3) caption(c, 'Bicubic  •  align_corners = false', 120, 618);
  }
}

export function rotary(c, k) {
  const b = k.beat.beatIndex + 1,
    turn = cue(k, 2, 'Move only the key', 1.6),
    shift = cue(k, 3, 'Translate both positions', 1.6);
  const q = [shift, shift],
    key = [shift + turn, shift],
    view = visionRotary(q, key);
  title(c, 'Two axes, two rotations');
  [0, 1].forEach((d) => {
    const x = 565 + 820 * d;
    text(c, d ? 'Column pair' : 'Row pair', x, 270, 53, C.ink, 'center');
    dial(c, x, 557, 193, [(key[d] * Math.PI) / 2, (q[d] * Math.PI) / 2], [C.gold, C.cyan]);
    mono(c, 'Δ = ' + fmt(key[d] - q[d], 2), x, 827, 48, C.sub, 'center');
  });
  text(c, 'Query', 116, 351, 40, C.cyan);
  text(c, 'Key', 116, 415, 40, C.gold);
  mono(c, 'q · k = ' + fmt(view.score), 960, 960, 64, C.green, 'center');
  if (b === 1) caption(c, 'Toy head  [1, 0 | 1, 0]     •     90° per unit', 110, 180);
}

const attColors = [C.red, C.gold, C.blue];
function attentionState(count, causal) {
  const w = causal ? [1, 0, 0] : weights;
  return { w, out: [0, 1].map((j) => sum(tokens.slice(0, count).map((v, i) => v[j] * w[i]))) };
}
export function attention(c, k) {
  const b = k.beat.beatIndex + 1,
    causal = cue(k, 5, "apply a decoder's causal mask") === 1;
  const count = causal
    ? 1
    : sum([
        cue(k, 3, 'Start with the banner'),
        cue(k, 3, "Add the panel's share"),
        cue(k, 3, 'Now add the Retry button'),
      ]);
  const { w, out } = attentionState(count, causal);
  title(c, causal ? 'Causal mask at the first patch' : 'The banner reads from three patches');
  screen(c, 106, 270, 1.12);
  [
    [83, 107],
    [333, 210],
    [600, 280],
  ].forEach(([px, py], i) =>
    rect(c, 106 + px * 1.12, 270 + py * 1.12, 26, 26, null, attColors[i], 5),
  );
  caption(c, 'Query  [1, 0]', 107, 756);
  caption(c, 'Key = value', 1042, 226);
  caption(c, 'Weight', 1542, 226);
  ['Banner', 'Panel', 'Retry'].forEach((name, i) => {
    const y = 348 + i * 120,
      color = causal && i ? C.rim : attColors[i];
    text(c, name, 968, y, 44, color);
    mono(c, vec(tokens[i]), 1200, y, 45, color);
    if (b >= 2) mono(c, fmt(w[i]), 1557, y, 48, color);
  });
  if (b === 1) mono(c, 'q · k(Retry) = 1', 968, 754, 51, C.cyan);
  else {
    const x = 1075;
    out.forEach((v, j) => {
      const y = 790 + 97 * j;
      text(c, 'Coordinate ' + (j + 1), 780, y + 22, 34);
      let edge = x;
      for (let i = 0; i < count; i++) {
        const len = 490 * w[i] * tokens[i][j];
        rect(c, edge, y, len, 45, attColors[i]);
        edge += len;
      }
      line(c, x, y + 50, x + 490, y + 50);
      mono(c, count ? fmt(v) : '?', 1640, y + 22, 48, count ? C.green : C.gold);
    });
  }
}
const pre = visionPreln();
export function residual(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 5) {
    title(c, 'ViT-B/16 at 224 × 224 pixels');
    grid(c, 138, 288, 14, 14, 33, (r, col) =>
      r >= 3 && r < 7 && col > 0 && col < 13 ? '#ad696c' : C.plate,
    );
    cell(c, 140, 804, 145, 82, 'CLS', C.gold, 36);
    text(c, '+ 196 patches', 310, 846, 46);
    caption(c, 'Queries and keys in each block', 784, 286);
    mono(c, '[B, 12, 197, 64]', 784, 394, 66, C.cyan);
    text(c, 'Batch   •   heads   •   slots   •   width per head', 784, 478, 35, C.sub);
    if (cue(k, 5, 'the MLP expands')) {
      caption(c, 'MLP at each position', 784, 627);
      mono(c, '768 → 3072 → 768', 784, 726, 65, C.gold);
    }
    if (cue(k, 5, 'Final LayerNorm'))
      text(c, 'Final LayerNorm → class or patch readout', 784, 882, 42);
    return;
  }
  title(c, 'Follow the retained state');
  const first = cue(k, 2, 'giving two point five'),
    norm = cue(k, 2, 'next normalized coordinates');
  const expand = cue(k, 3, 'first linear map'),
    nonlin = cue(k, 3, 'GELU acts'),
    update = cue(k, 3, 'second map'),
    end = cue(k, 3, 'The final state');
  const x = 254;
  line(c, x, 288, x, 892, C.cyan, 10);
  const stops = [
    ['Input', pre.input, 1],
    ['After attention', pre.residual, first],
    ['After MLP', pre.output, end],
  ];
  stops.forEach(([name, v, show], i) => {
    const y = 304 + 286 * i;
    disc(c, x, y, 18, C.cyan);
    text(c, name, x + 40, y - 49, 39, C.sub);
    mono(
      c,
      show ? vec(v) : i === 1 ? 'x + Δattn' : 'r₁ + ΔMLP',
      x + 40,
      y + 21,
      52,
      show ? C.ink : C.sub,
    );
  });
  arrow(c, 1000, 420, 775, 535, C.gold, 5);
  arrow(c, 1000, 812, 775, 855, C.gold, 5);
  text(c, 'LN → multi-head attention', 1095, 326, 44);
  if (b >= 2) mono(c, '+ ' + vec(pre.attention), 1095, 422, 53, C.gold);
  text(c, 'LN → MLP', 1095, 540, 46);
  if (norm) mono(c, 'LN ≈ ' + vec(pre.norm, 2), 1095, 611, 41, C.sub);
  if (expand) mono(c, 'W₁   ' + vec(pre.expanded, 2), 1095, 684, 37, C.sub);
  if (nonlin) mono(c, 'GELU ' + vec(pre.gelu, 2), 1095, 749, 37, C.sub);
  if (update) mono(c, 'W₂   ' + vec(pre.update), 1095, 816, 40, C.gold);
  if (b >= 4)
    caption(c, 'ViT-B   12 blocks × 12 heads   •   width 768   •   MLP 768 → 3072 → 768', 117, 998);
}
export function bias(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 4) {
    title(c, 'Score the scene and the string separately');
    screen(c, 105, 275, 1.2, { locate: true });
    caption(c, 'Held-out screenshot', 110, 813);
    text(c, 'Scene label', 1060, 322, 44, C.sub);
    text(c, 'Deploy failed', 1060, 425, 72, C.red);
    text(c, 'Exact-ID label', 1060, 603, 44, C.sub);
    mono(c, 'req_7f3a', 1060, 713, 70, C.cyan);
    return;
  }
  title(c, 'Which input cells can reach the center?');
  const stacked = cue(k, 1, 'Stack a second layer'),
    global = b >= 2,
    size = 77,
    n = 7;
  [0, 1].forEach((i) => {
    const x = 185 + i * 933,
      y = 290,
      rad = i ? (global ? 3 : stacked ? 2 : 1) : 1;
    text(
      c,
      i
        ? global
          ? 'Full attention'
          : stacked
            ? 'Two 3 × 3 layers'
            : 'One 3 × 3 layer'
        : 'One 3 × 3 layer',
      x,
      211,
      45,
      C.sub,
    );
    grid(
      c,
      x,
      y,
      n,
      n,
      size,
      (r, col) =>
        Math.max(Math.abs(r - 3), Math.abs(col - 3)) <= rad ? (i ? C.blue : C.cyan) : C.plate,
      4,
    );
    disc(c, x + 3.5 * size, y + 3.5 * size, 15, C.deep);
    mono(c, 2 * rad + 1 + ' × ' + (2 * rad + 1) + ' cells', x, 905, 50, i ? C.blue : C.cyan);
  });
  if (b === 3)
    caption(
      c,
      'DeiT tests a different ViT recipe. ConvNeXt revisits the convolutional backbone.',
      145,
      1001,
    );
}
const patchBudget = (height, p, width = height) => {
  const n = (height / p) * (width / p);
  return { n, pairs: n * n, raw: p * p * 3 };
};
export function granularity(c, k) {
  if (cue(k, 3, 'Take a fresh sixty-four')) {
    const taller = cue(k, 3, 'Double only the height');
    title(c, 'Keep the patch width at 16 pixels');
    [64, 128].forEach((h, i) => {
      if (i && !taller) return;
      const x = 180 + i * 882,
        y = 280,
        budget = patchBudget(h, 16, 64),
        pitch = 71;
      grid(c, x, y, h / 16, 4, pitch, (r, col) => (r === 1 && col > 0 ? '#ab665e' : C.plate), 3);
      text(c, 'Height ' + h + ' × width 64', x, y - 72, 46);
      mono(c, budget.n + ' patches', x + 330, y + 101, 45, C.cyan);
      mono(c, budget.pairs + ' pairs', x + 330, y + 189, 45, C.gold);
    });
    caption(c, 'Complete patches, dense attention, no auxiliary slots', 177, 967);
    return;
  }
  const fine = cue(k, 2, 'The token count quadruples') === 1;
  const p = fine ? 8 : 16,
    n = 224 / p,
    bud = patchBudget(224, p),
    scale = 577 / n;
  title(c, fine ? 'Each old patch now covers four new patches' : 'Halve the patch width');
  rect(c, 145, 271, 577, 577, C.plate);
  rect(c, 145 + 577 / 14, 271 + (4 * 577) / 14, (12 * 577) / 14, (4 * 577) / 14, '#ab665e');
  for (let i = 0; i <= n; i++) {
    line(c, 145 + i * scale, 271, 145 + i * scale, 848, C.bg, 2);
    line(c, 145, 271 + i * scale, 722, 271 + i * scale, C.bg, 2);
  }
  rect(c, 145, 271, 577, 577, null, C.cyan);
  caption(c, '224 × 224 image     •     ' + p + ' px patches', 145, 912);
  text(c, 'Patch rows', 955, 277, 45, C.sub);
  mono(c, n + ' × ' + n + ' = ' + bud.n, 955, 386, 66, C.cyan);
  text(c, 'Dense patch-to-patch pairs', 955, 533, 45, C.sub);
  mono(c, bud.n + '² = ' + bud.pairs.toLocaleString('en-US'), 955, 636, 65, C.gold);
  if (fine && cue(k, 2, 'grows sixteenfold'))
    text(c, '4× as many patches    •    16× as many pairs', 955, 772, 38);
  if (k.beat.beatIndex === 2)
    caption(c, 'Shared projection input   ' + bud.raw + ' RGB values', 955, 900);
}
export function checkEncoder() {
  assert.deepEqual(attend(ps), attend([...ps].reverse()));
  assert.notDeepEqual(attend(placed(ps)), attend(placed([...ps].reverse())));
  assert.equal(oldGrid.length, 196);
  assert.equal(newGrid.length + 1, 321);
  assert.deepEqual([cls, ...newGrid][0], [0, 1, 2]);
  assert.deepEqual(resizeGrid(14, 14), oldGrid);
  // At the top left the half-pixel centers are at -1/16 and -3/20.
  // Clamping leaves one nonzero neighbor on each axis of this affine ramp.
  const first = 3 + 42 * -0.75 * (1 / 16) * (15 / 16) ** 2 + 3 * -0.75 * (3 / 20) * (17 / 20) ** 2;
  assert.ok(Math.abs(newGrid[0][0] - first) < 1e-10);
  for (const v of newGrid) assert.ok(Math.abs(v[2] - v[0] - 2) < 1e-10);
  assert.equal(visionRotary([0, 0], [1, 0]).score, 1);
  assert.equal(visionRotary([1, 1], [2, 1]).score, 1);
  assert.deepEqual(attentionState(1, true).out, [1, 0]);
  assert.ok(Math.abs(attentionState(3, false).out[1] - 0.599) < 0.001);
  assert.deepEqual(pre.residual, [2.5, 3.5]);
  assert.deepEqual(
    pre.output.map((x) => fmt(x)),
    ['2.341', '4.341'],
  );
  assert.deepEqual(patchBudget(128, 16, 64), { n: 32, pairs: 1024, raw: 768 });
  assert.equal(patchBudget(224, 8).pairs / patchBudget(224, 16).pairs, 16);
}
