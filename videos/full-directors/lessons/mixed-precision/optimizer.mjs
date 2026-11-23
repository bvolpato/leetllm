import { fp16 } from '../../../films/mixed-precision/arithmetic.mjs';
import { accumulationState } from '../../../films/mixed-precision/model.mjs';
import { unequalTokenFixture } from '../../../films/mixed-precision/fixtures.mjs';
import {
  C,
  arr,
  at,
  box,
  brace,
  casing,
  dot,
  fade,
  fmt,
  line,
  num,
  pointer,
  reading,
  scale,
  text,
  title,
} from './drawing.mjs';

const prior = Object.freeze({ w: 1, m: 0.2, v: 0.04 });
export function adamState(gradient, guard) {
  if (guard && !Number.isFinite(gradient)) return { ...prior };
  // This counterfactual holds the weight fixed and feeds the gradient to Adam's moments.
  return {
    w: prior.w,
    m: 0.9 * prior.m + 0.1 * gradient,
    v: 0.999 * prior.v + 0.001 * gradient ** 2,
  };
}
export function trial(scale) {
  const gradient = 300,
    scaled = gradient * scale,
    stored = fp16(scaled);
  return { gradient, scale, scaled, stored, skip: !Number.isFinite(stored) };
}
export function twoOptimizers() {
  return [1, Infinity].map((g) => (Number.isFinite(g) ? 1 - 0.1 * g : 1));
}
export function controller(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b <= 3) {
    const current = trial(256),
      retry = trial(64);
    const product = at(c, 1, 'The product is', 0.45);
    const cast = at(c, 2, 'The cast gives infinity'),
      skip = at(c, 2, 'skip this entire');
    const next = at(c, 2, 'cuts the scale to sixty-four');
    const wrong = at(c, 3, 'Both moments would become infinite');
    title(g, 'Will the scaled gradient fit in FP16?', 'One optimizer   /   one proposed update');
    const x = (v) => 265 + (v / 80000) * 1380;
    const y = 395;
    scale(g, x(0), x(80000), y, [0, 20000, 40000, 60000, 80000].map(x), C.dim);
    for (const v of [0, 20000, 40000, 60000, 80000])
      num(g, v === 0 ? '0' : v / 1000 + 'k', x(v), y + 55, 27, C.dim, 'center');
    const ceiling = 65504;
    line(g, x(ceiling), y - 94, x(ceiling), y + 134, C.red, 4);
    text(g, 'FP16 max   ' + fmt(ceiling), x(ceiling), y - 110, 32, C.red, 'center');
    const rawX = x(current.gradient),
      scaledX = x(current.scaled);
    if (product === 0) {
      pointer(g, rawX, y - 4);
      num(g, fmt(current.gradient), rawX, y - 65, 37, C.ochre, 'center');
    } else {
      dot(g, rawX, y - 8, 8, C.yellow, C.ochre);
      line(g, rawX, y - 8, rawX + (scaledX - rawX) * product, y - 8, C.ochre, 4);
      fade(g, product, () => {
        pointer(g, scaledX, y - 4);
        num(g, fmt(current.scaled), scaledX, y - 65, 37, C.ochre, 'center');
      });
    }
    num(
      g,
      fmt(current.gradient) + ' × ' + current.scale + (product ? ' = ' + fmt(current.scaled) : ''),
      122,
      546,
      42,
    );
    if (cast) num(g, 'FP16 store  ' + fmt(current.stored), 867, 546, 44, C.red);
    if (next) {
      dot(g, x(retry.scaled), y + 83, 10, C.green);
      line(g, x(0), y + 83, x(retry.scaled), y + 83, C.green, 4);
      text(
        g,
        'Next window   × ' + retry.scale + '  →  ' + fmt(retry.stored),
        x(retry.scaled) + 20,
        y + 93,
        30,
        C.green,
      );
    }
    casing(g, 96, 626, 1728, 282);
    text(
      g,
      'Weight and Adam moments    /    ' + (skip && current.skip ? 'step skipped' : 'before step'),
      146,
      705,
      41,
    );
    const state = skip ? adamState(current.stored, true) : prior;
    for (const [i, value] of Object.values(state).entries()) {
      const xx = 220 + i * 548;
      num(g, ['weight w', 'Adam m', 'Adam v'][i], xx, 772, 33, C.dim);
      num(g, value.toFixed(2), xx, 854, 60, C.green);
    }
    if (wrong) {
      const hypothetical = adamState(current.stored, false);
      text(
        g,
        'If Adam reads ∞:    w = ' +
          fmt(hypothetical.w) +
          '      m → ' +
          fmt(hypothetical.m) +
          '      v → ' +
          fmt(hypothetical.v),
        960,
        1000,
        38,
        C.red,
        'center',
      );
    }
    return;
  }
  if (b <= 5) {
    title(
      g,
      'Can a finite gradient accompany an infinite loss?',
      'One weight, w = 2. The added term is constant with respect to w.',
    );
    const added = at(c, 4, 'Add a constant infinity'),
      deriv = at(c, 5, 'derivative is still four');
    text(g, 'Loss', 150, 402, 48, C.ink, 'left', 'Serif');
    num(
      g,
      added ? 'w² + ∞   =   4 + ∞   =   ∞' : 'w²   =   4',
      430,
      412,
      60,
      added ? C.red : C.ink,
    );
    line(g, 145, 508, 1760, 508, C.faint, 3);
    text(g, 'Gradient', 150, 640, 48, C.ink, 'left', 'Serif');
    num(g, deriv ? '2w + 0   =   4' : added ? '2w + 0' : '2w', 430, 648, 60, C.green);
    if (deriv) {
      text(g, 'Gradient check passes', 430, 763, 42, C.green);
      text(g, 'Check the loss before backward.', 430, 856, 39);
    }
    return;
  }
  const weights = twoOptimizers(),
    a = at(c, 6, 'weight moves'),
    skip = at(c, 6, 'non-finite gradient'),
    shared = at(c, 7, 'backoff halves the scale');
  title(
    g,
    'Two optimizers share a scale',
    'Each optimizer owns its own weight and makes its own finite check.',
  );
  for (const [i, label, grad, after, ready] of [
    [0, 'A', '1', weights[0], a],
    [1, 'B', '∞', weights[1], skip],
  ]) {
    const yy = 360 + i * 248;
    casing(g, 115, yy - 66, 1685, 198);
    num(g, label, 174, yy + 51, 66);
    text(g, 'Gradient', 366, yy - 3, 30, C.dim);
    num(g, grad, 366, yy + 77, 61, i ? C.red : C.green);
    text(g, 'Weight', 812, yy - 3, 30, C.dim);
    num(g, '1.0  →  ' + (ready ? after.toFixed(1) : '?'), 810, yy + 77, 56);
    if (ready) text(g, i ? 'Step skipped' : 'Step applied', 1374, yy + 52, 42, i ? C.red : C.green);
  }
  text(g, 'Shared scale', 195, 896, 38, C.dim);
  num(g, shared ? '256  →  128' : '256', 581, 913, 64, shared ? C.green : C.ink);
}
export const norm = 0.02,
  clipScale = 1024,
  limit = 1;
export function clipPath(unscaleFirst) {
  const input = norm * clipScale,
    first = unscaleFirst ? input / clipScale : Math.min(limit, input);
  const out = unscaleFirst ? Math.min(first, limit) : first / clipScale;
  return { input, first, out };
}
const contributions = accumulationState(2, 1).contributions;
export const counts = [2, 1, 3],
  totalLoss = 5;
export const token = unequalTokenFixture();
export function buffer(n) {
  return contributions.slice(0, n).reduce((s, v) => s.map((a, i) => a + v[i] * 256), [0, 0]);
}
const pair = (v) => '[' + v.join(', ') + ']';

function normReveal(clock, beat, phrase) {
  if (clock.beat.beatIndex !== beat - 1) return Number(clock.beat.beatIndex >= beat);
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart: false });
}

function finalNormRuler(g, clipped, unscaled, clipProgress, unscaleProgress) {
  const left = 253, right = 1757, axis = 810;
  const x = (value) => left + (right - left) * value / (norm * 1.25);
  text(g, 'Optimizer input norm · unscaled units', left, 686, 40);
  line(g, left, axis, right, axis, C.faint, 3);
  line(g, x(norm), 748, x(norm), axis + 12, C.dim, 3, [8, 8]);
  num(g, '0', left, axis + 39, 31, C.dim, 'center');
  text(g, 'Original ' + fmt(norm), x(norm), axis + 39, 34, C.ink, 'center');
  for (const [value, progress, color, y] of [
    [clipped, clipProgress, C.red, 752],
    [unscaled, unscaleProgress, C.green, 782],
  ]) {
    if (!progress) continue;
    const end = x(value * progress);
    line(g, left, y, end, y, color, 8);
    dot(g, end, y, 10, color);
  }
}

export function ordering(g, c) {
  const b = c.beat.beatIndex + 1;
  if (b <= 2) {
    title(
      g,
      'Which norm reaches the optimizer?',
      'True norm = 0.02      loss scale = 1,024      clip limit = 1 in unscaled units',
    );
    const x = [254, 935, 1588],
      first = clipPath(false),
      second = clipPath(true);
    const clipped = at(c, 1, 'Clip first'),
      divided = at(c, 1, 'Divide by the scale now');
    const unscaled = at(c, 2, 'unscale first'),
      okay = at(c, 2, 'original norm is already below one');
    const clippedResult = normReveal(c, 1, 'point zero zero zero nine seven seven');
    const unscaledResult = normReveal(c, 2, 'the entire gradient survives');
    for (const [i, heading, middle, end, p, show1, result, active] of [
      [0, 'Clip first', 'cap at 1', '÷ 1,024', first, clipped, clippedResult, divided],
      [1, 'Unscale first', '÷ 1,024', 'cap at 1', second, unscaled, unscaledResult, okay],
    ]) {
      const y = 320 + i * 200,
        col = i ? C.green : C.red;
      text(g, heading, 122, y - 34, 44, col, 'left', 'Serif');
      line(g, 130, y + 91, 1785, y + 91, C.faint, 2);
      const vals = [
        fmt(p.input),
        show1 ? fmt(p.first) : '?',
        result === 1 ? p.out.toFixed(6) : '?',
      ];
      for (const [j, val] of vals.entries())
        num(g, val, x[j], y + 58, 57, j ? col : C.ink, 'center');
      for (const [j, label] of [middle, end].entries()) {
        const cx = (x[j] + x[j + 1]) / 2;
        arr(g, cx - 109, y + 43, cx + 109, y + 43, (j ? active : show1) ? col : C.faint);
        text(g, label, cx, y + 9, 31, C.dim, 'center');
      }
    }
    finalNormRuler(g, first.out, second.out, clippedResult, unscaledResult);
    return;
  }
  if (b <= 4) {
    const n = at(c, 3, 'first batch adds') + at(c, 3, 'second adds') + at(c, 3, 'third adds');
    const div = at(c, 3, 'Only now unscale'),
      step = at(c, 4, 'Take one optimizer step');
    title(
      g,
      'Accumulate at one scale',
      'Three microbatches contribute to one two-coordinate gradient.',
    );
    const current = buffer(n),
      result = current.map((v) => v / 256);
    for (let i = 0; i < 3; i++) {
      const x = 166 + i * 570,
        done = i < n;
      text(g, 'Microbatch ' + (i + 1), x, 340, 37, done ? C.ink : C.dim);
      num(g, pair(contributions[i]), x, 427, 47, done ? C.green : C.dim);
      arr(g, x + 116, 470, Math.min(1350, Math.max(605, x + 116)), 600, done ? C.green : C.faint);
    }
    casing(g, 361, 602, 1198, 235);
    text(
      g,
      div ? 'Buffer after one unscale' : 'FP32 buffer   /   scaled × 256',
      463,
      683,
      38,
      C.dim,
    );
    num(g, pair(div ? result : current), 468, 783, 67, C.green);
    text(g, n + ' of 3', 1270, 777, 39);
    const normLabel = Math.hypot(...result).toFixed(3);
    const updated = at(c, 4, 'Update the scale once');
    if (div)
      text(
        g,
        step
          ? 'Finite   ·   norm ' +
              normLabel +
              ' < 1   ·   one optimizer step' +
              (updated ? '   ·   one scale update' : '')
          : 'Divide both entries by 256.',
        960,
        947,
        40,
        C.green,
        'center',
      );
    return;
  }
  if (b <= 6) {
    const summed = at(c, 5, 'all six tokens'),
      scaled = at(c, 5, 'before scaling');
    title(
      g,
      'Find the denominator for this window',
      'Each circle represents one active response token.',
    );
    for (const [i, count] of counts.entries()) {
      const l = 164 + i * 554;
      text(g, 'Microbatch ' + (i + 1), l, 366, 37);
      for (let j = 0; j < count; j++) dot(g, l + 48 + j * 104, 482, 35, C.green);
      brace(g, l, l + count * 102, 568, count + (count === 1 ? ' token' : ' tokens'));
    }
    if (summed)
      num(
        g,
        'Window mean loss   =   ' + totalLoss + ' / ' + counts.reduce((a, v) => a + v, 0),
        960,
        784,
        55,
        C.ink,
        'center',
      );
    if (scaled)
      text(
        g,
        b === 6
          ? 'Checkpoint the scaler, optimizer and position in the data.'
          : 'Each backward uses 256 × (microbatch loss sum / 6).',
        960,
        910,
        40,
        C.green,
        'center',
      );
    return;
  }
  const mean = at(c, 7, 'full-token mean'),
    wrong = at(c, 8, 'group means gives zero');
  title(
    g,
    'Give each token one vote',
    'One active token in the first microbatch, three in the second.',
  );
  [2, -2, -2, -2].forEach((v, i) => {
    const x = 346 + i * 389;
    dot(g, x, 436, 84, i ? C.blue : C.green);
    num(g, (v > 0 ? '+' : '') + v, x, 461, 65, C.white, 'center');
  });
  brace(g, 237, 452, 573, 'one token');
  brace(g, 629, 1644, 573, 'three tokens');
  if (mean) num(g, 'Token mean     (+2 − 6) / 4 = ' + token.mean, 960, 772, 50, C.green, 'center');
  if (wrong)
    num(g, 'Group means    (+2 − 2) / 2 = ' + token.meanOfMeans, 960, 871, 50, C.red, 'center');
  if (at(c, 8, 'all-masked window'))
    text(g, 'Zero valid tokens: skip the window before division.', 960, 973, 36, C.dim, 'center');
}
const base = [4, 4, 8],
  master = [2, 2, 4, 8];
export function memoryBytes(activationBytes) {
  const p = 100e6,
    a = 800e6;
  const state = base.map((bytes) => (bytes * p) / 1e9);
  const segments = [...state, (activationBytes * a) / 1e9];
  return { segments, total: segments.reduce((s, v) => s + v, 0) };
}
function inventory(g, y, label, record) {
  const x = 127,
    factor = 323;
  text(g, label, x, y - 31, 40, C.ink, 'left', 'Serif');
  let pos = x;
  for (const [i, v] of record.segments.entries()) {
    const w = v * factor,
      col = [C.blue, C.green, C.ochre, C.dark][i];
    box(g, pos, y, w - 2, 111, col);
    num(g, v.toFixed(1), pos + w / 2, y + 70, i < 2 ? 36 : 44, C.white, 'center');
    pos += w;
  }
  num(g, record.total.toFixed(1) + ' GB', pos, y + 166, 37, C.ink, 'right');
}
export function memory(g, c) {
  const b = c.beat.beatIndex + 1;
  const before = memoryBytes(4),
    after = memoryBytes(2);
  if (b <= 4) {
    const cast = at(c, 3, 'Store the activations'),
      share = at(c, 3, 'We freed one third');
    title(
      g,
      'What actually gets smaller?',
      '100 million parameters   ·   800 million saved activation values   ·   decimal GB',
    );
    const labels = ['Weights', 'Gradients', 'Adam m + v', 'Saved activations'];
    for (const [i, label] of labels.entries()) {
      const xx = [128, 482, 852, 1290][i];
      box(g, xx, 275, 30, 30, [C.blue, C.green, C.ochre, C.dark][i]);
      text(g, label, xx + 48, 303, 32);
    }
    inventory(g, 425, 'Original FP32 inventory', before);
    inventory(
      g,
      723,
      cast ? '16-bit activations' : 'Before the activation cast',
      cast ? after : before,
    );
    if (share) {
      const saved = before.total - after.total;
      text(
        g,
        saved.toFixed(1) + ' GB freed  /  ' + before.total.toFixed(1) + ' GB original  =  ⅓',
        960,
        1004,
        41,
        C.green,
        'center',
      );
    }
    return;
  }
  title(g, 'Pack one parameter and its state', 'Unsharded Adam   /   static bytes per parameter');
  const showMaster = at(c, 6, 'two-byte compute'),
    stage = at(c, 6, 'staging buffer');
  for (const [i, parts, labels] of [
    [0, base, ['w', 'g', 'm + v']],
    [1, master, ['w', 'g', 'master', 'm + v']],
  ]) {
    const y = 365 + i * 330;
    text(
      g,
      i ? 'Explicit master copy' : 'FP32 parameter with AMP',
      132,
      y - 47,
      40,
      C.ink,
      'left',
      'Serif',
    );
    if (i && !showMaster) {
      text(
        g,
        'Count the compute copy, gradient, master weight and both moments.',
        134,
        y + 92,
        36,
        C.dim,
      );
      continue;
    }
    const sizes = i && stage ? [...parts, 4] : parts;
    let xx = 140;
    for (const [j, v] of sizes.entries()) {
      const w = v * 76;
      box(g, xx, y, w - 4, 127, [C.blue, C.green, i ? C.dim : C.ochre, C.ochre, C.red][j]);
      text(
        g,
        (labels[j] ?? 'staging') + ' · ' + v + ' B',
        xx + w / 2,
        y + 78,
        34,
        C.white,
        'center',
      );
      xx += w;
    }
    num(g, sizes.reduce((a, v) => a + v, 0) + ' B', xx, y + 195, 45, C.ink, 'right');
  }
}
