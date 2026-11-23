import {
  night,
  chalk,
  fog,
  ice,
  flame,
  rose,
  rect,
  line,
  dot,
  arrow,
  text,
  num,
  title,
  note,
  footFormula,
  fmt,
  pair,
  cue,
  alpha,
  lerp,
  clamp,
} from './drawing.mjs';
import { m, scalar, states, wh, eventNames, norm, retained, fullRun, cutRun } from './examples.mjs';
const steel = '#476272';
const pos = (i) => 249 + 456 * i;
function scope(c, y) {
  line(c, 130, y, 1800, y, steel, 2);
  for (let x = 150; x < 1800; x += 30) line(c, x, y - 5, x, y + 5, steel, 1.5);
}
export function backward(c, k) {
  const b = k.beat.beatIndex;
  title(
    c,
    b < 3
      ? 'How much of an early nudge survives?'
      : b === 3
        ? 'A vector can turn as it travels back'
        : 'One weight, three uses',
    true,
  );
  if (b === 3) {
    text(c, 'Local Jacobian at rollback', 149, 257, 49, chalk, 'left', 'Serif');
    const slopes = states[3].map((x) => 1 - x * x);
    num(c, 'J = diag(1 − h²) Wₕ', 149, 355, 48, ice);
    for (let i = 0; i < 2; i++) {
      const y = 510 + i * 124;
      num(c, fmt(slopes[i]) + ' × ' + pair(wh[i], 1), 155, y, 46, chalk);
      arrow(c, 750, y, 1000, y, steel);
      num(c, pair(wh[i].map((x) => x * slopes[i])), 1070, y, 47, ice);
    }
    footFormula(c, 'g₂ = J₃ᵀ g₃      g₁ = J₂ᵀ g₂      g₀ = J₁ᵀ g₁', true);
    return;
  }
  const progress =
    b >= 4
      ? 3
      : cue(k, 2, 'Cross the rollback link', 1.6) +
        cue(k, 2, 'Multiply by the reproduction slope', 1.5) +
        cue(k, 3, 'Cross the error link', 1.4);
  scope(c, 419);
  scalar.forEach((h, i) => {
    const x = pos(i);
    text(c, i ? eventNames[i - 1] : 'start', x, 289, 39, chalk, 'center');
    dot(c, x, 419, 18, ice);
    num(c, 'h ' + fmt(h), x, 487, 33, ice, 'center');
    if (i > 0 && b < 4) num(c, '× ' + fmt(m.factors[i - 1], 4), x - 228, 565, 32, flame, 'center');
  });
  for (let j = 0; j < 3; j++) {
    const x = pos(3 - j),
      q = clamp(progress - j);
    if (!q) continue;
    arrow(c, x - 25, 625, lerp(x - 25, x - 432, q), 625, flame, 7);
  }
  if (b < 4) {
    for (let j = 0; j <= progress; j++)
      num(c, fmt(m.sensitivities[j], 5), pos(3 - j), 724, 43, flame, 'center');
    footFormula(c, 'local slope = 0.5 × (1 − new h²)', true);
  } else {
    m.weightTerms.forEach((v, i) => {
      text(c, 'use ' + (i + 1), pos(i + 1), 553, 30, fog, 'center');
      num(c, fmt(v, 4), pos(i + 1), 726, 45, flame, 'center');
    });
    footFormula(
      c,
      '∂h₃ / ∂w = ' +
        m.weightTerms.map((v) => fmt(v, 4)).join(' + ') +
        (cue(k, 6, 'point three three one', 0) ? ' ≈ ' + fmt(m.weightGradient, 4) : ''),
      true,
    );
  }
}

const logX = (n) => 290 + n * 105,
  logY = (v) => 485 - Math.log10(v) * 92;
export function chain(c, k) {
  title(c, 'How much credit reaches the far end?', true);
  for (let p = -3; p <= 2; p++) {
    const y = logY(10 ** p);
    line(c, 270, y, 1630, y, steel, 2);
    num(c, 10 ** p, 219, y, 30, fog, 'right');
  }
  for (const n of [0, 4, 8, 12]) num(c, n, logX(n), 818, 31, fog, 'center');
  const curves = [
    [0.6, 4 * cue(k, 1, 'four links', 2) + 8 * cue(k, 2, 'through twelve links', 2.4), ice],
    [1.4, 12 * cue(k, 3, 'one point four', 2.6), flame],
  ];
  for (const [f, n, color] of curves) {
    if (f > 1 && !n) continue;
    const value = retained(f, n),
      x = logX(n),
      y = logY(value);
    line(c, logX(0), logY(1), x, y, color, 8);
    for (let i = 0; i <= n; i++) dot(c, logX(i), logY(retained(f, i)), 6, color);
    dot(c, x, y, 13, color);
    num(
      c,
      n === Math.floor(n) ? fmt(value, f < 1 ? 5 : 2) : '× ' + f,
      Math.min(1720, x + 8),
      y - 42,
      35,
      color,
      'center',
    );
  }
  text(c, 'Credit magnitude', 112, 196, 36, fog);
  if (k.beat.beatIndex === 3)
    note(c, 'A matrix can turn the gradient as well as change its length.', 872, true);
  else note(c, 'Links crossed backward     •     Each grid line is a factor of ten.', 851, true);
}

function axes(c, x, y, scale) {
  for (let i = 0; i <= 4; i++) {
    const v = i / 4;
    line(c, x - 26, y - v * scale, x + scale * 1.26, y - v * scale, steel, i === 0 ? 3 : 1);
    line(c, x + v * scale, y + 21, x + v * scale, y - scale * 1.18, steel, i === 0 ? 3 : 1);
  }
  num(c, '1', x + scale, y + 44, 28, fog, 'center');
  num(c, '1', x - 44, y - scale, 28, fog, 'center');
}
export function matrixBound(c, k) {
  const b = k.beat.beatIndex;
  if (b < 4) {
    title(c, 'What happens to this arrow on the next step?', true);
    const n =
      cue(k, 1, 'Apply the matrix once', 1.6) +
      cue(k, 2, 'Apply the matrix again', 1.5) +
      7 * cue(k, 2, 'Keep multiplying', 3.6);
    const i = Math.floor(n),
      from = m.matrixPowers[i],
      to = m.matrixPowers[i + 1],
      pts = from.map((v, j) => lerp(v, to[j], n - i));
    const ox = 245,
      oy = 759,
      u = 403;
    axes(c, ox, oy, u);
    for (let j = 0; j <= i; j++) {
      const v = m.matrixPowers[j];
      line(c, ox, oy, ox + v[0] * u, oy - v[1] * u, steel, 3);
      dot(c, ox + v[0] * u, oy - v[1] * u, 7, fog);
    }
    arrow(c, ox, oy, ox + pts[0] * u, oy - pts[1] * u, flame, 10);
    text(c, 'W =', 992, 295, 52, chalk);
    num(c, '[ 0.5    1  ]', 1140, 262, 47, chalk);
    num(c, '[  0    0.5 ]', 1140, 334, 47, chalk);
    if (Number.isInteger(n)) {
      num(c, 'step ' + i, 995, 481, 44, fog);
      num(c, 'length  ' + fmt(norm(from)), 995, 574, 60, flame);
    } else {
      text(c, 'Applying W', 995, 455, 48, flame);
      text(c, 'Last completed step ' + i, 995, 555, 37, fog);
      num(c, 'length  ' + fmt(norm(from)), 995, 628, 45, chalk);
    }
    if (b === 2) num(c, 'off-diagonal   n · 0.5ⁿ⁻¹', 993, 705, 37, ice);
    if (b === 3) num(c, 'one-step maximum   1.207', 993, 705, 38, ice);
    note(c, 'Each gray shaft records one earlier direction.', 838, true);
  } else if (b < 6) {
    title(c, 'A bound on every link bounds their product', true);
    const n = 5 * cue(k, 6, 'Five links', 2.2);
    for (let i = 0; i <= 5; i++) {
      const x = 220 + i * 295,
        v = 0.75 ** i;
      line(c, x, 674, x, 674 - 300 * v, steel, 7);
      if (i <= n) {
        line(c, x, 674, x, 674 - 300 * v, ice, 19);
        num(c, fmt(v), x, 725, 35, ice, 'center');
      }
      num(c, 'link ' + i, x, 796, 30, fog, 'center');
    }
    num(c, '‖J‖ ≤ max tanh′ × σₘₐₓ(Wₕ)', 960, 230, 49, chalk, 'center');
    footFormula(
      c,
      b === 4
        ? 'max tanh′ ≤ 1'
        : 'Five-link norm bound   0.75⁵' + (n === 5 ? '   ≈   ' + fmt(0.75 ** 5) : ''),
      true,
    );
  } else {
    title(c, 'Can a stored gradient move a float32 weight?', true);
    const hit = cue(k, 7, 'rounds back to one', 0.8);
    text(c, '50 links', 154, 325, 51, chalk, 'left', 'Serif');
    num(c, '0.6⁵⁰ ≈ ' + (0.6 ** 50).toExponential(2), 630, 325, 53, ice);
    line(c, 150, 420, 1750, 420, steel, 2);
    text(c, 'One SGD update', 154, 519, 49, chalk, 'left', 'Serif');
    num(c, '1 − 1 × gradient', 729, 519, 50, chalk);
    alpha(c, hit, () => {
      text(c, 'Stored float32', 154, 690, 48, chalk);
      num(c, '1.00000000', 729, 690, 64, flame);
    });
    note(
      c,
      'A nonzero gradient can produce a change too small for this weight to record.',
      932,
      true,
    );
  }
}

export function detach(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 4) {
    title(c, 'Clipping keeps the gradient direction', true);
    const q = cue(k, 5, 'Scale both components', 2.0),
      raw = m.rawGradient,
      clip = m.clippedGradient;
    const v = raw.map((x, i) => lerp(x, clip[i], q)),
      x = 315,
      y = 283,
      scale = 10.1;
    line(c, x - 64, y, x + 677, y, steel);
    line(c, x, y - 65, x, y + 522, steel);
    arrow(c, x, y, x + raw[0] * scale, y - raw[1] * scale, steel, 8);
    arrow(c, x, y, x + v[0] * scale, y - v[1] * scale, flame, 10);
    dot(c, x, y, 9, chalk);
    text(c, 'Gradient norm', 1055, 375, 52, chalk, 'left', 'Serif');
    num(c, fmt(norm(v)), 1052, 499, 94, flame);
    num(c, 'limit   5.000', 1058, 660, 45, ice);
    footFormula(
      c,
      b === 5 ? 'Plain SGD step length = learning rate × 5' : 'multiplier = min(1, 5 / ‖g‖)',
      true,
    );
    return;
  }
  title(
    c,
    b === 3
      ? 'What does each use add to the weight gradient?'
      : 'Where should training credit stop?',
    true,
  );
  const fwd = 2 * cue(k, 1, 'Follow the two runs', 1.7) + cue(k, 2, 'Advance both readers', 1.9);
  const seam = cue(k, 1, 'Detach the lower state', 0.85),
    sweep = 3 * cue(k, 3, 'Follow the upper trace', 2.5),
    second = cue(k, 3, 'Follow the lower trace', 1.35);
  const X = (i) => 364 + i * 433,
    height = 115;
  [fullRun, cutRun].forEach((run, row) => {
    const base = 411 + row * 306;
    text(
      c,
      row ? (seam ? 'Detached' : 'Second run') : 'Full',
      105,
      base - 70,
      38,
      row ? rose : ice,
      'left',
      'Serif',
    );
    line(c, 284, base, 1720, base, steel, 2);
    for (let i = 0; i <= 3; i++) {
      const x = X(i),
        y = base - run.trace[i] * height;
      if (i > 0 && fwd > i - 1) {
        const q = clamp(fwd - i + 1);
        line(
          c,
          X(i - 1),
          base - run.trace[i - 1] * height,
          lerp(X(i - 1), x, q),
          lerp(base - run.trace[i - 1] * height, y, q),
          ice,
          8,
        );
      }
      if (i <= fwd) {
        dot(c, x, y, 12, ice);
        num(c, fmt(run.trace[i]), x, y - 43, 36, chalk, 'center');
      }
      if (!row) text(c, i ? eventNames[i - 1] : 'start', x, 210, 36, fog, 'center');
    }
    if (row && seam) {
      const x = X(2) + 140;
      line(c, x, base - 119, x, base + 54, rose, 5, [10, 8]);
      text(c, 'detach', x + 12, base + 65, 30, rose);
    }
    const right = X(3),
      left = row ? X(2) + 140 : X(0);
    const q = row ? second : sweep / 3;
    if (q) arrow(c, right, base + 35, lerp(right, left, q), base + 35, flame, 7);
    if (b >= 2 && (row ? second : sweep / 3) === 1) {
      const contributions = b === 3 ? run.weightTerms : run.gradients;
      contributions.forEach((v, i) => num(c, fmt(v, 4), X(i + 1), base + 95, 31, flame, 'center'));
    }
  });
  if (b === 3) {
    const fullReady = cue(k, 4, 'point three three one', 0);
    const cutReady = cue(k, 4, 'point two three eight', 0);
    footFormula(
      c,
      'Full   ' +
        m.weightTerms.map((v) => fmt(v, 4)).join(' + ') +
        (fullReady ? ' ≈ ' + fmt(fullRun.weight, 4) : '') +
        (cutReady ? '     Detached   ' + fmt(cutRun.weight, 4) : ''),
      true,
    );
  } else if (b === 2)
    note(c, 'Orange values show the final-state derivative for each event input.', 869, true);
  else note(c, 'Same events   •   same weights   •   no optimizer step', 870, true);
}
