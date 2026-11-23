import { C, fmt, mix, vec } from './instruments.mjs';
import {
  advance,
  checkedBatch,
  expanded,
  latencyExample,
  precisionProbe,
  sigmoidPath,
} from './models.mjs';

function captionedCue(d, beat, phrase, captionStart, seconds) {
  if (d.b !== beat) return Number(d.b > beat);
  const progress = d.clock.reveal(phrase, seconds, { captionStart });
  return progress * progress * (3 - 2 * progress);
}

function caliper(d, spacing = false) {
  const single = spacing || (d.b === 2 && d.cue(2, 'rounds the weights', 0));
  const p = precisionProbe(single);
  const h = 1e-6,
    center = 612;
  const X = (w) => center + (w - 3) * 3e8;
  const close = spacing ? 1 : d.cue(0, 'just above and below', 1.4);
  const showStored = !spacing || d.cue(0, 'Compare the blue marks', 0);
  d.title(
    spacing ? 'Measure between the stored weights' : 'Read the two sides of the centered check',
  );
  d.line(128, 293, 1072, 293, C.muted, 2);
  d.line(center, 283, center, 308, C.ink, 2);
  d.txt('3', center, 332, 22, C.ink, 'center', 'Mono');
  const lower = mix(3, p.lowerWeight, close),
    upper = mix(3, p.upperWeight, close);
  for (const [sign, w] of [
    [-1, lower],
    [1, upper],
  ]) {
    const requested = X(3 + sign * h);
    d.line(requested, 235, requested, 312, C.plum, 2);
    if (spacing) {
      d.txt('requested  ' + fmt(3 + sign * h, 6), requested, 336, 22, C.plum, 'center', 'Mono');
      if (!showStored) continue;
    }
    const x = X(w);
    d.rect(x - 4, 204, 8, 90, C.blue);
    d.path(
      [
        [x - 15, 202],
        [x + 15, 202],
        [x, 222],
      ],
      C.blue,
      1,
      true,
    );
    const labelX = sign < 0 ? 285 : 933;
    d.txt(
      (single ? '≈ ' : '') + fmt(w, single ? 13 : 9),
      labelX,
      172,
      25,
      C.blue,
      'center',
      'Mono',
    );
    d.txt(sign < 0 ? 'lower weight' : 'upper weight', labelX, 135, 19, C.muted, 'center');
  }
  d.txt(single ? 'Float32' : 'Float64', center, 133, 25, C.ink, 'center', 'Mono');
  if (spacing) {
    d.metric('Requested spacing', fmt(2 * h, 6), 112, 391, C.plum, 29);
    if (showStored)
      d.metric('Stored spacing', '≈ ' + fmt(p.storedSpacing, 13), 633, 391, C.blue, 29);
    if (d.cue(0, 'Keep that numerator', 0)) {
      d.txt(
        'Stored loss difference   ' + fmt(p.lossDifference, 17),
        600,
        505,
        23,
        C.ink,
        'center',
        'Mono',
      );
      d.txt('÷ requested spacing  ≈  ' + fmt(p.slope, 6), 112, 573, 24, C.plum);
    }
    if (d.cue(0, 'For a small gradient check', 0))
      d.txt('÷ stored spacing  =  ' + fmt(p.slopeAtStoredSpacing), 633, 573, 24, C.blue);
  } else {
    d.metric('Lower loss', fmt(single ? p.minus : (2 * lower - 5) ** 2, 9), 106, 396, C.copper, 30);
    d.metric('Upper loss', fmt(single ? p.plus : (2 * upper - 5) ** 2, 9), 490, 396, C.copper, 30);
    d.metric('Reference slope', '4', 878, 396, C.muted, 30);
    const division = !single || d.cue(2, 'Double precision stays', 0);
    if (close === 1 && division && d.cue(0, 'Divide the difference') > 0)
      d.txt('(upper loss − lower loss) / (2h)   ≈   ' + fmt(p.slope, 6),
        600, 528, 29, C.ink, 'center', 'Serif');
  }
}
function checkRule(d) {
  if (d.b === 0) return caliper(d, true);
  d.title('Does backward agree with a separate measurement?');
  const repaired = d.cue(2, 'Both marks now meet', 0);
  const sampled = d.cue(1, 'check both weights', 1.5);
  d.txt('Four fixed requests     •     weights [1.3, 1.1]     •     float64', 94, 140, 22, C.muted);
  checkedBatch().forEach((s, i) => {
    const y = 260 + i * 171;
    d.txt(i ? 'Queue' : 'Prompt', 94, y, 24);
    const X = d.axis(275, y, 766, -10, 0, [-10, -8, -6, -4, -2, 0]);
    const value = repaired ? s.actual : s.proposed;
    d.pin(X(value), y, C.copper);
    d.txt('backward ' + fmt(value, 4), X(value), y - 40, 21, C.copper, 'center');
    if (sampled) {
      d.dot(X(s.measured), y, 9, C.white, C.blue);
      d.txt(
        'centered ' + fmt(s.measured, 4),
        Math.max(300, X(s.measured)),
        y + 58,
        20,
        C.blue,
        'center',
      );
    }
  });
  d.txt(
    repaired
      ? 'Backward rule     2 × mean(error × feature)'
      : 'Proposed rule     mean(error × feature)',
    600, 534, 29, C.ink, 'center', 'Serif',
  );
}
function gradientBuffer(d) {
  d.title(
    d.b < 2
      ? 'A gradient buffer and a weight have different jobs'
      : 'What was in the buffer before backward?',
  );
  const w = [2, 2],
    features = [2, 1],
    target = 5;
  const initial = latencyExample(w, features, target),
    g = initial.gradient;
  const rowLabel = 'One request     features ' + vec(features) + '     target ' + target + ' s';
  d.txt(rowLabel, 97, 139, 23, C.muted);
  function spoken(beat, phrase, edge = 'end') {
    if (d.b !== beat) return d.b > beat;
    return d.clock.elapsed >= d.clock.wordCue(phrase)[edge];
  }
  if (d.b === 2) {
    d.txt('Both replays hold w = ' + vec(w), 1108, 139, 23, C.blue, 'right');
    const incoming = spoken(2, 'Backward sends four comma two') ? vec(g) : '?';
    d.txt('Before backward', 290, 198, 19, C.muted, 'center');
    d.txt('Incoming', 590, 198, 19, C.muted, 'center');
    d.txt('After backward', 925, 198, 19, C.muted, 'center');
    for (const [i, old] of [
      [0, [0, 0]],
      [1, g],
    ]) {
      const y = 250 + i * 160;
      d.txt(i ? 'Retained' : 'Cleared', 97, y, 25, C.ink);
      d.txt(vec(old), 290, y, 35, C.muted, 'center', 'Mono');
      d.txt('+', 422, y, 34, C.muted, 'center');
      d.txt(incoming, 590, y, 36, C.plum, 'center', 'Mono');
      d.arrow(693, y, 779, y, C.grid, 3);
      const ready = spoken(2, i ? 'gives eight comma four' : 'finishes at four comma two');
      d.txt(ready ? vec(old.map((v, j) => v + g[j])) : '?', 925, y, 40, C.blue, 'center', 'Mono');
    }
    d.txt('Each replay starts from the weights used before the optimizer step.',
      600, 528, 29, C.ink, 'center', 'Serif');
    return;
  }
  const backwardStarted = spoken(1, 'Backward fills', 'start'),
    backward = spoken(1, 'with four comma two'),
    step = captionedCue(d, 1, 'optimizer step', 'Only the optimizer step', 1.4);
  const weights = advance(w, g, 0.1 * step);
  const labels = ['w.grad', 'w'],
    values = [backward ? vec(g) : 'empty', vec(weights, 2)];
  labels.forEach((l, i) => {
    const x = 115 + i * 552;
    d.rect(x, 221, 426, 166, i ? C.sky : C.lilac);
    d.line(x, 221, x + 426, 221, i ? C.blue : C.plum, 5);
    d.txt(l, x + 26, 259, 26, i ? C.blue : C.plum, 'left', 'Mono');
    d.txt(values[i], x + 213, 332, 48, C.ink, 'center', 'Mono');
  });
  if (backward) d.txt('Buffer computed at w = ' + vec(w), 328, 437, 21, C.plum, 'center');
  d.txt(
    step
      ? 'optimizer.step()     w ← w − 0.1 × w.grad'
      : backwardStarted
        ? 'loss.backward()     writes the gradient buffer'
        : 'Clear the buffer, predict, then compute scalar loss.',
    600, 515, 29, C.ink, 'center', 'Serif',
  );
}
function saved(d) {
  d.title('The sigmoid saves its output for backward');
  const original = sigmoidPath(2),
    sigmoid = original.b;
  const v = Number(d.b === 1 &&
    captionedCue(d, 1, 'add one to b in place', 'Now add one to b in place', 0.3) === 1);
  const invalid = d.b === 1 && v > 0,
    other = d.cue(2, 'The original b still', 0),
    returned = d.cue(2, 'Detaching b', 0);
  d.txt('Forward calculation', 97, 148, 21, C.muted);
  const labs = ['input a', 'sigmoid(a) = b', 'c = 3b'];
  const values = [2, fmt(sigmoid, 4), fmt(original.c, 4)];
  values.forEach((val, i) => {
    const x = 200 + i * 390;
    if (i < 2) d.arrow(x + 96, 246, x + 294, 246, C.grid, 3);
    d.node(x, 246, 60, labs[i], val, i === 1 ? C.blue : C.ink);
  });
  d.rect(91, 402, 481, 108, invalid ? C.apricot : C.sky);
  d.txt('Storage for b', 113, 429, 20, C.muted);
  d.txt(
    fmt(sigmoid + v, 4) + '    v' + Number(invalid),
    113,
    476,
    31,
    invalid ? C.copper : C.blue,
    'left',
    'Mono',
  );
  if (other) {
    d.rect(629, 402, 480, 108, C.mint);
    d.txt('New tensor b + 1', 653, 429, 20, C.green);
    d.txt(fmt(sigmoid + 1, 4), 653, 476, 31, C.green, 'left', 'Mono');
  } else {
    d.txt('Backward expects version 0', 646, 444, 24, C.muted);
    if (invalid) d.txt('Version mismatch', 645, 486, 29, C.copper);
  }
  d.txt(
    invalid
      ? 'Backward stops when it finds the overwritten saved value.'
      : returned
        ? 'dc/da  =  3 × b × (1 − b)  ≈  ' + fmt(original.derivative, 4)
        : 'The backward rule uses b × (1 − b).',
    600, 536, 29, C.ink, 'center', 'Serif',
  );
}
function alias(d) {
  const cloning = d.cue(2, 'Clone the view', 1.8),
    returning = d.cue(3, 'send two back', 1.7);
  const view = expanded(3, false),
    clone = expanded(3, true);
  d.title(
    d.b < 2
      ? 'Where do the three entries live?'
      : d.b === 2
        ? 'Give each entry a writable slot'
        : 'Count the paths back to x',
  );
  const ys = [202, 333, 464],
    sx = 240,
    ex = 842;
  if (d.b === 3) {
    const sink = [890, 330];
    for (let i = 0; i < 3; i++) {
      const y = ys[i];
      d.track(
        [[sx + 65, y], [530, y], [620, 330], sink],
        returning,
        C.plum,
        returning > 0 && returning < 1 ? '2' : undefined,
      );
      d.rect(sx - 58, y - 28, 120, 56, C.mint);
      d.txt('2x', sx, y, 27, C.green, 'center', 'Mono');
      d.txt('slot ' + clone.addresses[i], 94, y, 21, C.muted);
    }
    d.node(951, 330, 58, 'gradient at x', returning === 1 ? clone.total : '?', C.plum);
    if (returning === 1)
      d.txt(
        'Gradient of the sum    2 + 2 + 2 = ' + clone.total + '      •      k entries give 2k.',
        600, 528, 29, C.ink, 'center', 'Serif',
      );
    return;
  }
  const sharedX = 554,
    sharedY = 333,
    cloneX = 864;
  d.txt('Expanded view', sx, 128, 21, C.muted, 'center');
  d.txt('Source storage', sharedX + 69, 128, 21, C.muted, 'center');
  const colors = [C.blue, C.plum, C.copper];
  const entries = [
    ['first entry', 'Trace the first entry'],
    ['second entry', 'Now the second entry'],
    ['third entry', 'Now the third entry'],
  ];
  for (let i = 0; i < 3; i++) {
    const y = ys[i];
    const [phrase, captionStart] = entries[i];
    const t = captionedCue(d, 0, phrase, captionStart, 1.15);
    d.track(
      [
        [sx + 68, y],
        [361, y],
        [439, sharedY],
        [sharedX, sharedY],
      ],
      t,
      colors[i],
    );
    d.rect(sx - 64, y - 27, 130, 54, C.sky);
    d.txt('view[' + i + ']', sx, y, 23, C.blue, 'center', 'Mono');
  }
  d.rect(sharedX, sharedY - 29, 146, 58, C.apricot);
  d.txt('slot 0 · 2x', sharedX + 73, sharedY, 21, C.copper, 'center');
  if (cloning > 0) {
    d.txt('Writable clone', cloneX + 113, 128, 21, C.green, 'center');
    for (const [i, address] of clone.addresses.entries()) {
      const y = ys[i];
      d.rect(cloneX, y - 29, 228, 58, cloning === 1 ? C.mint : C.faint);
      d.txt(
        'slot ' + address + '  ·  ' + (cloning === 1 ? '2x' : '…'),
        cloneX + 114,
        y,
        23,
        C.green,
        'center',
        'Mono',
      );
      d.txt('clone[' + i + ']', cloneX + 115, y + 48, 18, C.muted, 'center', 'Mono');
      d.track(
        [
          [sharedX + 146, sharedY],
          [774, sharedY],
          [771, y],
          [cloneX, y],
        ],
        cloning,
        C.green,
      );
    }
  }
  if (d.b === 1)
    d.banner(
      'Stride 0       addresses [' +
        view.addresses.join(', ') +
        ']       overlapping write rejected',
      C.copper,
    );
  if (d.b === 2 && cloning === 1)
    d.banner(
      'Stride 1       addresses [' +
        clone.addresses.join(', ') +
        ']       each write has its own destination',
      C.green,
    );
}
export const storage = [(d) => caliper(d), checkRule, gradientBuffer, saved, alias];
