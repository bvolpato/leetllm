import assert from 'node:assert/strict';
import { prepareCaptions } from './captions.mjs';
import {
  pixels,
  center,
  lower,
  mu,
  lv,
  eps,
  priorDraw,
  book,
  enc,
  noise,
  collapseCodes,
  TRAINED_AE as ae,
  TRAINED_VAE as vae,
  coordinateSwapStudy as swaps,
} from '../../../films/vae/fixtures.mjs';
import {
  encode,
  decode,
  z,
  recon,
  mse,
  probePixels,
  probeCode,
  sig,
  dist,
  collapseOutputs,
  collapseDifference,
  gaussianEvidenceState,
  binaryInformationState,
  freeBitsState,
  freshCollisionState,
  vqGradientSnapshot,
} from '../../../films/vae/model.mjs';
import { gaussianPixelLoss, kl } from '../../../films/vae/arithmetic.mjs';

const ink = '#232f35',
  dim = '#4c6263',
  rule = '#b8bcb0',
  paper = '#f8f4e8';
const teal = '#006b69',
  plum = '#7c4168',
  red = '#ac3d22',
  gold = '#956411';
const cutoff = 0.9,
  collision = freshCollisionState(),
  vq = vqGradientSnapshot();
const errors = pixels.map((v, i) => (v - recon[i]) ** 2);
const observed = [0.1, 0.9, 0.85, 0.12],
  predicted = [0.12, 0.84, 0.8, 0.14],
  variance = 0.25;
const four = gaussianPixelLoss(observed, predicted, variance);
const eight = gaussianPixelLoss([...observed, ...observed], [...predicted, ...predicted], variance);
const sum = (a) => a.reduce((v, n) => v + n, 0);
const clamp = (a) => Math.max(0, Math.min(1, a));
const mix = (a, b, t) => a + (b - a) * t;
const fixed = (a, n = 2) => (Math.abs(a) < 0.5 * 10 ** -n ? 0 : a).toFixed(n).replace('-', '−');
const pair = (v, n = 2) => '(' + v.map((a) => fixed(a, n)).join(', ') + ')';
const above = (a) => center.filter((i) => a[i] > cutoff);
const mseOf = (a, b) => sum(a.map((v, i) => (v - b[i]) ** 2)) / a.length;
const rowKL = mu.map((m, i) => kl([m], [lv[i]]));
const basis = [512, 64, 3, 4, 4, 2];
function budgets([image, latent, inputChannels, latentChannels, inputBytes, latentBytes]) {
  const positions = image ** 2 / latent ** 2,
    scalars = (positions * inputChannels) / latentChannels;
  return { positions, scalars, bytes: (scalars * inputBytes) / latentBytes };
}
const gradient = (draw, weight, target) => (weight * draw - target) * draw;
const nearest = dist.indexOf(Math.min(...dist));
const usage = [0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1];
function trial(swap) {
  const means = vae.posteriorMeans,
    own = vae.meanDecodedRows,
    first = swaps.firstOnlyRows;
  return {
    coords: means.map((row, i) =>
      row.map((v, k) => (swap === 'both' || swap === k ? means[1 - i][k] : v)),
    ),
    images:
      swap === 'both'
        ? vae.swappedDecodedRows
        : swap === 1
          ? [first[1], first[0]]
          : swap === 0
            ? first
            : own,
    error:
      swaps.batchMSE[
        swap === 'both' ? 'both' : swap === 1 ? 'second' : swap === 0 ? 'first' : 'own'
      ],
  };
}
function sampleAt(shift, stretch) {
  const mean = [mu[0] + 0.7 * shift, mu[1]];
  const scale = sig.map((v, i) => v + [0.55, 0.35][i] * stretch);
  return { mean, scale, point: mean.map((v, i) => v + scale[i] * eps[i]) };
}
function line(c, x, y, x2, y2, color = rule, w = 1) {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
function rect(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function ring(c, x, y, rx, ry, color, w = 2, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
function label(
  c,
  value,
  x,
  y,
  size = 18,
  color = ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(value), x, y);
}
function head(c, title) {
  label(c, title, 48, 52, 34, ink, 'left', 'Serif');
}
function cap(c, value, x, y, color = dim) {
  label(c, value, x, y, 15, color, 'center', 'Sans', 600);
}
function num(c, value, x, y, size = 22, color = ink, align = 'center') {
  label(c, value, x, y, size, color, align, 'Mono');
}
function arrow(c, x, y, xx, yy, color = teal, w = 2) {
  if (Math.hypot(xx - x, yy - y) < 2) return;
  line(c, x, y, xx, yy, color, w);
  const a = Math.atan2(yy - y, xx - x);
  for (const sign of [-1, 1])
    line(
      c,
      xx,
      yy,
      xx - 9 * Math.cos(a + sign * 0.46),
      yy - 9 * Math.sin(a + sign * 0.46),
      color,
      w,
    );
}
function bracket(c, x, y, w, h, col) {
  for (const a of [0, 1])
    for (const b of [0, 1]) {
      const xx = x + a * w,
        yy = y + b * h,
        k = Math.min(11, w / 3);
      line(c, xx, yy, xx + (a ? -k : k), yy, col, 2.5);
      line(c, xx, yy, xx, yy + (b ? -k : k), col, 2.5);
    }
}
function shade(v) {
  const k = clamp(v);
  return 'rgb(' + [27 + 222 * k, 39 + 207 * k, 44 + 188 * k].map(Math.round).join(',') + ')';
}
// The aperture and cell coordinates stay fixed when an exposure changes.
function crop(
  c,
  values,
  x,
  y,
  w,
  { name, mark = [], numbers = [], n = 2, accent = teal, columns = 5, glow = [] } = {},
) {
  const side = w / columns;
  if (name) cap(c, name, x + w / 2, y - 24);
  rect(c, x - 4, y - 4, w + 8, w + 8, '#3a4544', 4);
  values.forEach((value, i) => {
    const xx = x + (i % columns) * side,
      yy = y + Math.floor(i / columns) * side;
    rect(c, xx + 0.75, yy + 0.75, side - 1.5, side - 1.5, shade(value));
    if (numbers.includes(i))
      num(
        c,
        fixed(value, n),
        xx + side / 2,
        yy + side / 2,
        Math.min(29, side / (n === 4 ? 4.25 : 2.85)),
        value > 0.53 ? ink : paper,
      );
    if (mark.includes(i)) bracket(c, xx + 2, yy + 2, side - 4, side - 4, accent);
    if (glow.includes(i)) {
      c.strokeStyle = red;
      c.lineWidth = 3;
      c.strokeRect(xx + 3, yy + 3, side - 6, side - 6);
      dot(c, xx + side - 9, yy + 9, 4, red);
    }
  });
}
function gate(c, k, beat, phrase, span = 0.65, options) {
  if (k.b < beat) return 0;
  if (k.b > beat) return 1;
  return k.clock.reveal(phrase, span, options);
}
function bar(c, x, y, w, h, value, color) {
  rect(c, x, y, w, h, '#d9dace', h / 3);
  if (value > 0) rect(c, x, y, w * clamp(value), h, color, Math.min(h / 3, (w * clamp(value)) / 2));
}
function ruler(c, x, y, w, min, max, ticks) {
  const at = (v) => x + (w * (v - min)) / (max - min);
  line(c, x, y, x + w, y, dim);
  for (const n of ticks) {
    line(c, at(n), y - 5, at(n), y + 5, dim);
    num(c, String(n).replace('-', '−'), at(n), y + 19, 13, dim);
  }
  return at;
}
function plane(c, x, y, w, h, extent = 2.6) {
  const step = Math.min(w, h) / (2 * extent),
    ox = x + w / 2,
    oy = y + h / 2;
  for (let i = -Math.floor(extent); i <= extent; i++) {
    line(c, ox + i * step, y, ox + i * step, y + h, i === 0 ? dim : '#d9dbce');
    line(c, x, oy - i * step, x + w, oy - i * step, i === 0 ? dim : '#d9dbce');
  }
  return { pt: ([a, b]) => [ox + a * step, oy - b * step], step };
}
function cloud(c, plot, m, scale, color, drawPoints = true) {
  const [x, y] = plot.pt(m);
  ring(c, x, y, scale[0] * plot.step, scale[1] * plot.step, color, 2);
  if (drawPoints)
    for (const n of noise) {
      const [a, b] = plot.pt([m[0] + n.x * scale[0], m[1] + n.y * scale[1]]);
      dot(c, a, b, 2, color);
    }
  dot(c, x, y, 4, color);
}
function instrument(c, x, y, labelText, v, color, { digits = 3, blank = false } = {}) {
  cap(c, labelText, x, y - 52, color);
  ring(c, x, y, 35, 35, '#c3c6b8', 3, '#e6e6d8');
  for (let i = 0; i <= 10; i++) {
    const a = (0.8 + (1.4 * i) / 10) * Math.PI;
    line(
      c,
      x + Math.cos(a) * 27,
      y + Math.sin(a) * 27,
      x + Math.cos(a) * 31,
      y + Math.sin(a) * 31,
      dim,
    );
  }
  if (!blank) {
    const a = (0.8 + 1.4 * clamp(v)) * Math.PI;
    line(c, x, y, x + 26 * Math.cos(a), y + 26 * Math.sin(a), color, 3);
    dot(c, x, y, 4, color);
  }
  num(c, blank ? '?' : fixed(v, digits), x, y + 56, 22, color);
}
function intro(c, k) {
  head(c, 'Which corner trips the alert?');
  const zoom = gate(c, k, 0, 'Zoom in', 1.1),
    answer = gate(c, k, 1, 'right', 0, { captionStart: 'It reads' }) === 1;
  const w = mix(150, 208, zoom),
    x = 71 + (208 - w) / 2,
    y = 148 + (208 - w) / 2;
  if (k.b === 2) {
    const showLower = gate(c, k, 2, 'Its second number', 0.3) > 0;
    const showPair = gate(c, k, 2, 'This pair is the latent code', 1) === 1;
    crop(c, pixels, 60, 144, 238, {
      name: 'Original crop',
      numbers: [...center, ...lower],
      mark: showLower ? lower : center,
      accent: showLower ? plum : teal,
      glow: [12],
    });
    const xx = 318,
      yy = 230;
    arrow(c, xx, yy, 427, yy, teal);
    if (showLower) arrow(c, xx, yy + 83, 427, yy + 83, plum);
    label(c, 'Badge average', 451, yy - 17, 18, teal);
    num(c, fixed(z[0], 4), 454, yy + 16, 24, teal, 'left');
    if (showLower) {
      label(c, 'Lower-strip average', 451, yy + 68, 18, plum);
      num(c, fixed(z[1], 3), 454, yy + 100, 24, plum, 'left');
    }
    if (showPair) {
      cap(c, 'Decoder receives', 775, 225);
      num(c, pair(z, 4), 775, 277, 21);
      cap(c, 'Which corner crossed?', 775, 350);
    }
    return;
  }
  rect(c, 36, 110, 277, 286, '#626f6d', 19);
  rect(c, 40, 114, 269, 278, '#d8d9cb', 16);
  rect(c, 49, 123, 251, 258, '#374442', 13);
  for (const [xx, yy] of [
    [52, 126],
    [295, 126],
    [52, 380],
    [295, 380],
  ])
    dot(c, xx, yy, 2, rule);
  crop(
    c,
    center.map((i) => pixels[i]),
    x,
    y,
    w,
    { columns: 2, numbers: [0, 1, 2, 3], glow: answer ? [3] : [] },
  );
  rect(c, 77, 405, 34, 34, ink, 8);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(83, 429);
  c.bezierCurveTo(89, 424, 84, 415, 92, 414);
  c.bezierCurveTo(100, 415, 95, 424, 101, 429);
  c.fill();
  dot(c, 92, 431, 2, paper);
  center.forEach((pixel, i) =>
    rect(c, 99 + 4 * (i % 2), 408 + 4 * Math.floor(i / 2), 3.7, 3.7, shade(pixels[pixel])),
  );
  label(c, 'Notification badge', 121, 423, 17, ink);
  const compare = gate(c, k, 0, 'Compare the two lower corners', 0.65);
  if (compare > 0 && !answer) bracket(c, x - 5, y + w / 2 - 1, w + 10, w / 2 + 6, '#75d8ce');
  const lo = 0.8,
    hi = 1,
    start = 452,
    end = 901,
    at = (v) => start + ((v - lo) / (hi - lo)) * (end - start);
  cap(c, 'Badge brightness', 640, 122);
  line(c, at(cutoff), 145, at(cutoff), 360, red, 2);
  ['Top left', 'Top right', 'Bottom left', 'Bottom right'].forEach((s, i) => {
    const yy = 175 + 53 * i;
    label(c, s, 434, yy, 17, dim, 'right');
    line(c, start, yy, end, yy, rule, 2);
    const a = at(pixels[center[i]]);
    dot(c, a, yy, 7, answer && i === 3 ? red : teal);
    num(
      c,
      fixed(pixels[center[i]]),
      a + (i === 1 ? -12 : 13),
      yy - 14,
      15,
      ink,
      i === 1 ? 'right' : 'left',
    );
  });
  cap(c, 'Cutoff  0.90', at(cutoff), 387, red);
}
function bottleneck(c, k) {
  head(c, 'What survives the exchange?');
  const t = gate(c, k, 2, 'Exchange the brightest', 1.2),
    values = [...pixels];
  values[6] = mix(pixels[6], pixels[12], t);
  values[12] = mix(pixels[12], pixels[6], t);
  const selected = k.b === 1 ? lower : center;
  crop(c, values, 68, 138, 245, {
    numbers: [...center, ...lower],
    mark: selected,
    name: 'Input crop',
    accent: k.b === 1 ? plum : teal,
  });
  const candidate = encode(values),
    hide = k.b === 2 || (k.b === 3 && !gate(c, k, 3, 'The sum', 0.15));
  instrument(c, 514, 252, 'Center', candidate[0], teal, {
    digits: 4,
    blank: hide || !gate(c, k, 0, 'That average is the first dial', 0.2),
  });
  instrument(c, 726, 252, 'Lower strip', candidate[1], plum, {
    blank: hide || !gate(c, k, 1, 'Now the decoder receives', 0.2),
  });
  if (k.b < 2) {
    const ids = k.b === 0 ? center : lower,
      count =
        1 +
        Math.floor(
          (ids.length - 1) * gate(c, k, k.b, k.b === 0 ? 'Add their brightness' : 'Add them', 1.4),
        );
    num(
      c,
      ids
        .slice(0, count)
        .map((i) => fixed(pixels[i]))
        .join(' + '),
      625,
      390,
      23,
    );
  } else
    label(
      c,
      hide ? 'Predict the two dial readings.' : 'Both sums survived the swap.',
      624,
      392,
      24,
      ink,
      'center',
      'Serif',
    );
}
function paintBadge(c, k) {
  head(c, k.b === 3 ? 'Where are the squared misses?' : 'What does the decoder paint?');
  const verdict = k.b >= 1 && gate(c, k, 1, 'Only the bottom right', 0.1) > 0;
  const gain = k.b === 3 ? mix(1, 35, gate(c, k, 3, 'Turn up the display gain', 1.25)) : 1;
  crop(c, pixels, 55, 151, 216, {
    name: 'Original badge',
    numbers: center,
    glow: verdict ? above(pixels) : [],
  });
  const out = k.b === 3 ? errors.map((a) => a * gain) : recon;
  const painted = gate(c, k, 0, 'Each center pixel comes out', 0.7) === 1;
  if (painted)
    crop(c, out, 675, 151, 216, {
      name: k.b === 3 ? 'Squared error' : 'Fixed decoder',
      mark: k.b === 2 ? [15] : [],
      numbers: k.b === 2 ? [15] : [],
      glow: verdict && k.b < 2 ? above(recon) : [],
    });
  else {
    cap(c, 'Fixed decoder', 783, 127);
    bracket(c, 675, 151, 216, 216, dim);
  }
  if (k.b <= 1) {
    cap(c, 'Center average + background', 473, 207);
    num(c, fixed(z[0], 4) + ' + 0.08', 473, 250, 24);
    if (painted) num(c, '= ' + fixed(recon[6], 4), 473, 296, 27, teal);
    if (verdict) {
      cap(c, '1 above cutoff', 165, 406, red);
      cap(c, '4 above cutoff', 782, 406, red);
    }
  } else if (k.b === 2) {
    cap(c, 'Lower strip → left neighbor', 473, 203);
    num(c, '0.08 + 0.35 × ' + fixed(z[1]), 473, 252, 20);
    num(c, '= ' + fixed(recon[15], 4), 473, 296, 26, plum);
  } else {
    cap(c, 'Display gain', 473, 203);
    num(c, '× ' + fixed(gain, 0), 473, 250, 32, plum);
    num(c, 'MSE  ' + fixed(mse, 4), 473, 310, 20);
  }
}
function measure(c, k) {
  head(c, 'How much did the decoder miss?');
  const count = Math.floor(25 * gate(c, k, 1, 'add the squared errors', 2)),
    idx = k.b === 0 ? 6 : Math.max(0, count - 1);
  crop(c, pixels, 60, 160, 209, { name: 'Observed', mark: [idx] });
  crop(c, recon, 356, 160, 209, { name: 'Reconstructed', mark: [idx] });
  if (k.b === 0) {
    cap(c, 'Upper-left badge pixel', 751, 179);
    num(c, fixed(pixels[idx]) + ' − ' + fixed(recon[idx], 4), 751, 230, 22);
    if (gate(c, k, 0, 'This time', 0.2))
      num(c, '= ' + fixed(pixels[idx] - recon[idx], 4), 751, 276, 24, plum);
    if (gate(c, k, 0, 'Square the difference', 0.9) === 1)
      num(c, 'squared  ' + fixed(errors[idx], 5), 751, 337, 19, teal);
  } else {
    crop(
      c,
      errors.map((v, i) => (i < count ? v * 35 : 0)),
      663,
      160,
      209,
      { name: 'Squared miss × 35', mark: [idx] },
    );
    num(c, count + ' / 25 pixels     sum ' + fixed(sum(errors.slice(0, count)), 5), 272, 419, 18);
    if (gate(c, k, 1, 'That is mean squared error', 0.3))
      num(c, 'MSE  ' + fixed(mse, 4), 756, 419, 23, teal);
  }
}
function intervention(c, k) {
  head(c, 'Send a different code to the same decoder');
  const replace = gate(c, k, 0, 'replace its code', 0.9) === 1,
    showOutput = gate(c, k, 1, 'moves downward', 0, { captionStart: false }) === 1,
    showError = gate(c, k, 1, 'its error', 0.25) > 0;
  crop(c, pixels, 64, 150, 215, { name: 'Reference crop' });
  crop(c, probePixels, 374, 142, 100, { name: 'Donor' });
  const code = replace ? probeCode : z;
  cap(c, replace ? 'Active code from donor' : 'Active code from reference', 460, 266);
  num(c, pair(code, 4), 460, 299, 19, replace ? plum : teal);
  arrow(c, 565, 276, 625, 276);
  if (!replace || showOutput) crop(c, decode(code), 669, 150, 215, { name: 'Decoder output' });
  else {
    bracket(c, 669, 150, 215, 215, dim);
    label(c, 'Where will it light?', 776, 259, 19, dim, 'center', 'Serif');
  }
  if (showError)
    num(c, 'MSE   ' + fixed(mse, 4) + ' → ' + fixed(mseOf(pixels, decode(code)), 4), 479, 421, 24);
}
function baseline(c, k) {
  head(c, 'Can a constant picture match the learned model?');
  ae.rows.forEach((v, i) => crop(c, v, 75 + (i % 2) * 111, 142 + Math.floor(i / 2) * 110, 86));
  cap(c, '4 of 48 training crops', 174, 385);
  if (k.b === 0) {
    cap(c, 'Learned layer widths', 600, 172);
    [25, 8, 2, 8, 25].forEach((width, i) => {
      const x = 371 + i * 105;
      for (let j = 0; j < width; j++) {
        const step = Math.min(5, 99 / width);
        dot(c, x, 262 + (j - (width - 1) / 2) * step, 2.4, i === 2 ? plum : teal);
      }
      num(c, width, x, 344, 19);
      if (i < 4) arrow(c, x + 12, 262, x + 88, 262, rule);
    });
  } else if (k.b === 1) {
    ['Before training', 'After 250 updates', 'Constant mean crop'].forEach((v, i) => {
      const value = [ae.before, ae.after, ae.baseline][i],
        yy = 154 + i * 83;
      label(c, v, 348, yy, 18);
      bar(c, 349, yy + 19, 408, 10, value / ae.before, i === 2 ? plum : teal);
      num(c, fixed(value, 4), 822, yy + 18, 20);
    });
  } else {
    crop(c, probePixels, 383, 165, 155, { name: 'Proposed held-out test' });
    crop(c, ae.mean, 680, 165, 155, { name: 'Constant prediction' });
    label(
      c,
      k.b === 2
        ? 'The constant predictor keeps the center badge.'
        : 'Where should a new code come from?',
      602,
      385,
      23,
      ink,
      'center',
      'Serif',
    );
  }
}

function posterior(c, k) {
  head(c, 'One crop selects one cloud');
  const switchCrop = k.b === 1 && gate(c, k, 1, 'Change the input', 0.6) === 1;
  const m = mu.map((v) => (switchCrop ? -v : v));
  const scale = k.b === 2 ? [mix(1, sig[0], gate(c, k, 2, 'Halve that value', 1)), sig[1]] : sig;
  crop(c, switchCrop ? probePixels : pixels, 72, 140, 200, { name: 'Observed crop' });
  cap(c, 'Encoder mean', 176, 380, teal);
  num(c, pair(m), 176, 416, 21, teal);
  const plot = plane(c, 405, 112, 432, 264, 3.2);
  cloud(c, plot, [0, 0], [1, 1], dim, false);
  cloud(c, plot, m, scale, teal);
  cap(c, 'Fixed prior', 507, 406, dim);
  cap(c, 'Crop posterior', 708, 406, teal);
  if (k.b === 2) num(c, 'σ₁ = exp(ℓ₁ / 2) = ' + fixed(scale[0], 3), 623, 447, 20);
}
function mixture(c, k) {
  head(
    c,
    k.b < 2
      ? 'One encoder, many posteriors'
      : k.b < 4
        ? 'What happens when two clouds mix?'
        : 'Turn a log variance into a scale',
  );
  if (k.b < 2) {
    crop(c, pixels, 80, 133, 121, { name: 'Crop A' });
    crop(c, probePixels, 80, 297, 121, { name: 'Crop B' });
    arrow(c, 219, 194, 370, 260, teal);
    arrow(c, 219, 353, 370, 284, plum);
    rect(c, 382, 237, 161, 73, ink, 9);
    label(c, 'Shared encoder', 463, 273, 18, paper, 'center');
    const plot = plane(c, 609, 127, 245, 272, 3);
    cloud(c, plot, mu, sig, teal);
    if (k.b === 1)
      cloud(
        c,
        plot,
        mu.map((v) => -v),
        sig,
        plum,
      );
    cap(c, 'Approximate posteriors', 731, 426);
  } else if (k.b < 4) {
    const plot = plane(c, 45, 112, 432, 302, 3.9);
    cloud(c, plot, [1, 1], [1, 1], teal);
    cloud(c, plot, [-1, -1], [1, 1], plum);
    label(c, 'Within each crop', 556, 155, 23, ink, 'left', 'Serif');
    num(c, 'covariance    ( 1   0 )', 705, 202, 18);
    num(c, '              ( 0   1 )', 705, 228, 18);
    label(c, 'Equal mixture', 556, 295, 23, ink, 'left', 'Serif');
    if (k.b === 3 && gate(c, k, 3, 'combined covariance', 0.7)) {
      num(c, 'covariance    ( 2   1 )', 705, 342, 18, teal);
      num(c, '              ( 1   2 )', 705, 368, 18, teal);
    } else num(c, '?', 695, 349, 28, dim);
  } else {
    const xs = [178, 470, 758];
    ['Log variance ℓ', 'Variance exp(ℓ)', 'Scale exp(ℓ / 2)'].forEach((s, i) =>
      cap(c, s, xs[i], 149),
    );
    lv.forEach((l, i) => {
      [l, Math.exp(l), Math.exp(l / 2)].forEach((v, j) =>
        num(c, fixed(v, 3), xs[j], 221 + i * 84, 31, j === 2 ? teal : ink),
      );
    });
    label(
      c,
      'Check the exponent and the resulting scale for overflow or underflow.',
      480,
      399,
      20,
      dim,
      'center',
    );
  }
}
function klCosts(c, k) {
  head(c, 'What does each coordinate cost?');
  num(c, 'μ = ' + pair(mu, 1) + '      log variance ℓ = ' + pair(lv, 1), 478, 98, 17, dim);
  const labels = ['μ²', 'exp(ℓ) − 1', '−ℓ', 'KL  (nats)'];
  const xs = [268, 467, 659, 838];
  labels.forEach((s, i) => cap(c, s, xs[i], 143));
  for (let i = 0; i < 2; i++) {
    const yy = 218 + 80 * i;
    cap(c, 'Coordinate ' + (i + 1), 102, yy);
    const terms = [mu[i] ** 2, Math.expm1(lv[i]), -lv[i]];
    terms.forEach((v, j) => num(c, fixed(v, 4), xs[j], yy, 21, j === 1 ? plum : ink));
    if (k.b >= 2) num(c, fixed(rowKL[i], 4), xs[3], yy, 24, teal);
    else num(c, '½ × sum', xs[3], yy, 17, dim);
  }
  line(c, 62, 345, 895, 345);
  if (k.b < 2)
    label(
      c,
      'Halve each row, sum the rows, then average crop totals across the batch.',
      480,
      393,
      20,
      ink,
      'center',
    );
  else if (k.b === 2) num(c, 'One crop     ' + fixed(sum(rowKL), 4) + ' nats', 480, 392, 26, teal);
  else if (k.b === 3) num(c, 'exp(ℓ) − 1 − ℓ  =  expm1(ℓ) − ℓ', 480, 392, 22, plum);
  else {
    const standard = k.b > 4 || k.clock.elapsed >= k.clock.wordCue('Our standard normal').start;
    const heard = (phrase) => k.b > 4 || k.clock.elapsed >= k.clock.wordCue(phrase).end;
    if (!standard) {
      cap(c, 'Gaussian prior · per coordinate', 480, 370);
      num(c, '∂KL / ∂μ = (μ − μ_prior) / σ_prior²', 480, 406, 24, teal);
    } else {
      cap(c, 'Standard-normal prior · mean 0 · variance 1', 480, 370);
      if (heard('equals the posterior mean'))
        num(c, '∂KL / ∂μ = μ', 270, 406, 23, teal);
      if (heard('variance minus one'))
        num(c, '∂KL / ∂ℓ = (exp(ℓ) − 1) / 2', 650, 406, 22, plum);
    }
  }
}
function sampling(c, k) {
  if (k.b === 3) {
    head(c, 'Generate without an input crop');
    const plot = plane(c, 56, 125, 331, 271, 2);
    cloud(c, plot, [0, 0], [1, 1], dim, false);
    dot(c, ...plot.pt(priorDraw), 7, plum);
    num(c, pair(priorDraw, 1), 220, 429, 20, plum);
    arrow(c, 410, 254, 596, 254, plum);
    cap(c, 'Prior draw', 506, 223, plum);
    if (gate(c, k, 3, 'Send this new pair', 0.6))
      crop(c, decode(priorDraw), 645, 146, 227, { name: 'Fixed decoder' });
    return;
  }
  const shift = gate(c, k, 1, 'Slide the mean', 1.6),
    stretch = gate(c, k, 2, 'Now increase the scales', 1.5),
    scaling = gate(c, k, 2, 'Now increase the scales', 0) === 1;
  head(c, scaling ? 'Hold the mean. Change the scale.' : k.b ? 'Pin the noise. Move the mean.' : 'Build a sample from one noise draw');
  const base = sampleAt(scaling ? 1 : 0, 0),
    current = sampleAt(shift, stretch);
  const construct = gate(c, k, 0, 'Scale each coordinate', 1);
  const move = gate(c, k, 0, 'then add the mean', 0.8);
  const m = k.b === 0 ? current.mean.map((v) => v * move) : current.mean;
  const scale = k.b === 0 ? current.scale.map((v) => mix(1, v, construct)) : current.scale;
  const point = m.map((v, i) => v + scale[i] * eps[i]);
  const plot = plane(c, 45, 110, 478, 307, 2.25);
  if (k.b > 0) {
    for (const [old, now, col] of [
      [base.mean, m, teal],
      [base.point, point, plum],
    ]) {
      const a = plot.pt(old),
        b = plot.pt(now);
      ring(c, ...a, 5, 5, col);
      line(c, ...a, ...b, col, 2);
    }
  }
  const a = plot.pt(m),
    b = plot.pt(point),
    e = plot.pt(eps);
  arrow(c, ...a, ...b, plum, 2.5);
  dot(c, ...a, 6, teal);
  dot(c, ...b, 6, plum);
  bracket(c, e[0] - 9, e[1] - 9, 18, 18, gold);
  cap(c, 'ε', e[0] - 13, e[1] + 15, gold);
  if (k.b === 1) cap(c, 'Translation along coordinate 1', 282, 445, teal);
  cap(c, 'Noise ε  •  pinned', 712, 132, gold);
  num(c, pair(eps, 1), 712, 166, 22, gold);
  cap(c, 'Mean μ', 713, 219, teal);
  num(c, pair(m), 713, 249, 22, teal);
  cap(c, 'Sample z = μ + σ × ε', 713, 301, plum);
  num(c, pair(point, 3), 713, 335, 24, plum);
  num(c, 'Scale σ   ' + pair(scale, 3), 698, 399, 18, dim);
  if (scaling) {
    const dx = point[0] - base.point[0], dy = point[1] - base.point[1];
    num(c, 'Scale-only Δz   ' + pair([dx, dy], 3), 282, 445, 18, plum);
  } else if (gate(c, k, 2, 'Both moved seven tenths', 0.6) === 1) {
    num(c, 'Δμ₁  =  Δz₁  =  +0.70', 281, 449, 19, teal);
  }
}
function gradients(c, k) {
  head(
    c,
    k.b < 2 ? 'Which gradients reach the encoder?' : 'A detached draw can still train the decoder',
  );
  if (k.b === 0) {
    const s = sampleAt(0, 0);
    cap(c, 'Pinned noise', 190, 145);
    cap(c, 'Offset   z − μ', 481, 145);
    cap(c, '∂z / ∂ log variance', 772, 145);
    eps.forEach((v, i) => {
      const y = 222 + 92 * i,
        offset = s.point[i] - s.mean[i];
      num(c, fixed(v), 190, y, 30, gold);
      arrow(c, 247, y, 402, y);
      num(c, fixed(offset, 3), 481, y, 26);
      arrow(c, 566, y, 692, y);
      num(c, fixed(offset / 2, 3), 772, y, 26, plum);
    });
    num(c, '∂z / ∂μ = 1', 477, 410, 24, teal);
  } else if (k.b === 1) {
    [0, 1].forEach((i) => {
      const y = 204 + i * 121;
      cap(c, i ? 'rsample()' : 'sample()', 98, y);
      for (const [x, t] of [
        [282, 'Encoder'],
        [522, 'Draw'],
        [793, 'Decoder'],
      ])
        label(c, t, x, y, 23, ink, 'center', 'Serif');
      arrow(c, 734, y, 561, y, plum, 3);
      if (i) arrow(c, 479, y, 344, y, plum, 3);
      else {
        line(c, 480, y, 426, y, dim, 2);
        line(c, 416, y - 12, 416, y + 12, red, 4);
        cap(c, 'detached', 411, y + 32, red);
      }
      cap(c, 'analytic KL ↓', 282, y - 38, teal);
    });
  } else {
    const draw = 0.8,
      w = 1.5,
      target = 0.2;
    const predicted = gate(c, k, 3, 'the output is', 0.35) === 1;
    const derived = gate(c, k, 3, 'the weight gradient is', 0.35) === 1;
    ['Detached draw z', 'Weight w', 'Target'].forEach((t, i) => {
      cap(c, t, 200 + 280 * i, 148);
      num(c, fixed([draw, w, target][i], 1), 200 + 280 * i, 211, 36, i === 0 ? plum : ink);
    });
    line(c, 66, 267, 897, 267);
    num(c, 'prediction = w × z' + (predicted ? ' = ' + fixed(draw * w, 1) : ''), 480, 323, 24);
    num(
      c,
      '∂loss / ∂w = (w × z − target) × z' +
        (derived ? ' = ' + fixed(gradient(draw, w, target), 1) : ''),
      480,
      393,
      22,
      teal,
    );
  }
}
function objective(c, k) {
  head(
    c,
    k.b === 2
      ? 'When does the loss estimate the negative ELBO?'
      : 'How much does the prior charge add?',
  );
  const t = gate(c, k, 0, 'Move them away', 1.5),
    weight = 0.1 + 0.9 * gate(c, k, 1, 'Increase the KL coefficient', 1.8);
  const value = kl(
    mu.map((v) => v * t),
    lv.map((v) => v * t),
  );
  if (k.b < 2) {
    const plot = plane(c, 43, 122, 330, 267, 2.4);
    cloud(c, plot, [0, 0], [1, 1], dim, false);
    cloud(
      c,
      plot,
      mu.map((v) => v * t),
      lv.map((v) => Math.exp((v * t) / 2)),
      teal,
      false,
    );
    cap(c, 'Two-coordinate KL', 210, 416, teal);
    const labels = ['Badge MSE', 'Weighted KL', 'Total'],
      terms = [mse, weight * value, mse + weight * value];
    terms.forEach((v, i) => {
      const yy = 141 + 84 * i;
      label(c, labels[i], 424, yy, 18);
      bar(c, 425, yy + 19, 319, 14, v / 0.212, i === 0 ? plum : teal);
      num(c, fixed(v, 4), 828, yy + 18, 20);
    });
    num(c, 'β = ' + fixed(weight), 656, 408, 22);
  } else {
    cap(c, 'Gaussian reconstruction cost', 306, 155);
    cap(c, 'Prior charge', 758, 155);
    num(c, 'SSE / (2τ²) + constant', 305, 219, 25, teal);
    num(c, 'KL(q ∥ p)', 758, 219, 25, plum);
    arrow(c, 305, 255, 305, 296, teal);
    label(c, 'Average over posterior draws', 305, 324, 20, teal, 'center');
    num(c, 'weight  1', 758, 324, 20, plum);
    line(c, 81, 364, 879, 364);
    num(c, '−ELBO  =  expected cost  +  prior KL', 480, 411, 23);
  }
}
function density(c, x, y, w, h, mean, sd, col, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.beginPath();
  for (let i = 0; i <= 160; i++) {
    const v = -3 + (6 * i) / 160,
      pdf = Math.exp(-0.5 * ((v - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    const xx = x + (i * w) / 160,
      yy = y - pdf * h;
    if (!i) c.moveTo(xx, yy);
    else c.lineTo(xx, yy);
  }
  c.strokeStyle = col;
  c.lineWidth = 2.5;
  c.stroke();
  c.restore();
}

const evidenceAxis = { min: -1.5, max: -1.15, ticks: [-1.5, -1.4, -1.3, -1.2] };

function evidence(c, k) {
  head(c, 'Can the bound reach the evidence?');
  const heard = (beat, phrase) =>
    k.b > beat || (k.b === beat && k.clock.elapsed >= k.clock.wordCue(phrase).end);
  const approximation = heard(2, 'right on the prior');
  const posterior = heard(4, 'its variance is one half');
  // Leave a visible gap at the end of the move, then close it on the next beat.
  const moveCue = 'Move the approximation';
  const moveSpan = k.b === 4
    ? k.clock.wordCue('as the curves come together').end - k.clock.wordCue(moveCue).start
    : 0;
  const move = gate(c, k, 4, moveCue, moveSpan, { captionStart: moveCue });
  const close = k.b === 5
    ? clamp((k.clock.elapsed - k.clock.wordCue('The bound reaches the pin').end) / 0.6)
    : 0;
  const s = gaussianEvidenceState(mix((2 / 3) * move, 1, close));
  const target = gaussianEvidenceState(1);
  const plotX = 57,
    plotY = 285,
    plotWidth = 367,
    plotHeight = 220;
  cap(c, 'Latent z', plotX + plotWidth / 2, 114);
  ruler(c, plotX, plotY, plotWidth, -3, 3, [-2, 0, 2]);
  if (approximation)
    density(c, plotX, plotY, plotWidth, plotHeight, s.mean, Math.sqrt(s.variance), teal);
  density(c, plotX, plotY, plotWidth, plotHeight, 0, 1, dim, [2, 7]);
  if (posterior)
    density(c, plotX, plotY, plotWidth, plotHeight, target.mean, Math.sqrt(target.variance), gold, [5, 7]);
  for (const [show, text, y, color, dash] of [
    [true, 'Prior', 333, dim, [2, 7]],
    [approximation, 'Encoder approximation', 362, teal, []],
    [posterior, 'True posterior', 391, gold, [5, 7]],
  ]) {
    if (!show) continue;
    c.save();
    c.setLineDash(dash);
    line(c, 91, y, 122, y, color, 2.5);
    c.restore();
    label(c, text, 135, y, 18, color);
  }
  if (heard(0, 'We observed point three')) num(c, 'Observed x = 0.30', 239, 431, 19);

  if (!heard(1, 'pin that value to the ruler')) {
    num(c, 'x = z + noise', 704, 200, 27, teal);
    cap(c, 'Independent noise with variance 1', 704, 244);
    if (heard(0, 'the pixel has variance two')) num(c, 'Var(x) = 1 + 1 = 2', 704, 302, 24);
    return;
  }
  const left = 482,
    right = 913,
    costY = 202,
    gapY = 324,
    axisY = 365;
  const { min, max, ticks } = evidenceAxis;
  const at = ruler(c, left, axisY, right - left, min, max, ticks);
  cap(c, 'nats', right, axisY + 19);
  const scoreText = (value) => {
    if (value === 0) return '0.000';
    if (value > 0 && value < 0.001) return '< 0.001';
    return '≈ ' + fixed(value, 3);
  };
  const pin = at(s.logEvidence);
  const bound = at(s.elbo);
  line(c, pin, gapY - 13, pin, axisY, ink, 2);
  cap(c, 'Fixed log evidence', pin, axisY + 43, ink);
  num(c, scoreText(s.logEvidence), pin, axisY + 63, 20);

  const cost = heard(2, 'Its KL to the prior is zero');
  const likelihood = heard(2, 'expected decoder log likelihood');
  const elbo = heard(2, 'lands below the pin');
  if (cost) {
    label(c, elbo ? 'Subtract KL to the prior' : 'KL to the prior', left, 164, 20, plum);
    num(c, scoreText(s.priorKL), right, 164, 22, plum, 'right');
  }
  if (likelihood) {
    const expected = at(s.expectedLogLikelihood);
    label(c, 'Expected decoder log likelihood', left, 126, 19, dim);
    num(c, scoreText(s.expectedLogLikelihood), right, 126, 22, dim, 'right');
    line(c, left, costY, right, costY, rule);
    if (elbo) {
      if (expected - bound > 14) arrow(c, expected, costY, bound, costY, plum, 4);
      else line(c, expected, costY, bound, costY, plum, 4);
    }
    ring(c, expected, costY, 8, 8, plum, 2);
    if (elbo) dot(c, bound, costY, 5, teal);
  }
  if (!elbo) {
    ring(c, pin, gapY, 8, 8, ink, 2);
    return;
  }

  const gapNamed = heard(4, 'the true posterior for this pixel');
  label(c, 'ELBO', left, 240, 23, teal);
  num(c, scoreText(s.elbo), right, 240, 22, teal, 'right');
  label(c, gapNamed ? 'KL to the true posterior' : 'Gap to log evidence', left, 286, 20, gold);
  num(c, scoreText(s.gap), right, 286, 22, gold, 'right');
  line(c, left, gapY, right, gapY, rule);
  line(c, bound, gapY, pin, gapY, gold, 4);
  ring(c, pin, gapY, 8, 8, ink, 2);
  dot(c, bound, gapY, 5, teal);
}
function likelihood(c, k) {
  head(c, k.b >= 7 ? 'More draws for the same four pixels' : 'Count the same four misses twice');
  if (k.b >= 7) {
    const n = 1 + Math.floor(3 * gate(c, k, 7, 'Average four independent draws', 1.7));
    for (let i = 0; i < 4; i++) {
      const x = 173 + i * 202;
      ring(c, x, 229, 54, 54, i < n ? teal : rule, 3);
      if (i < n) num(c, 'z' + ['₁', '₂', '₃', '₄'][i], x, 229, 32, teal);
      cap(c, 'Decoder call ' + (i + 1), x, 321);
    }
    if (n === 4) num(c, 'Var(average) = Var(one draw) / 4', 480, 414, 22, plum);
    return;
  }
  const dup = k.b >= 3 && k.b <= 4 && gate(c, k, 3, 'Copy all four observations', 0.8) === 1,
    scores = dup ? eight : four;
  const ct = dup ? 8 : 4,
    delta = k.b > 0 || gate(c, k, 0, 'Square each difference', 1) === 1;
  ['Observed', 'Predicted', delta ? 'Squared miss' : 'Difference'].forEach((s, i) =>
    label(c, s, 53, 155 + i * 66, 17, dim),
  );
  for (let i = 0; i < ct; i++) {
    const j = i % 4,
      x = 218 + i * 86;
    [observed[j], predicted[j]].forEach((v, r) => {
      rect(c, x - 33, 132 + r * 66, 66, 44, shade(v), 3);
      num(c, fixed(v), x, 154 + r * 66, 17, v > 0.5 ? ink : paper);
    });
    num(
      c,
      delta ? fixed(four.errors[j], 4) : fixed(observed[j] - predicted[j]),
      x,
      287,
      15,
      i > 3 ? plum : ink,
    );
  }
  if (dup) line(c, 518, 118, 518, 308, plum);
  if (k.b === 0) num(c, 'SSE = ' + (delta ? fixed(four.sum, 4) : '?'), 480, 388, 26, teal);
  else if (k.b < 3) {
    num(c, 'SSE / (2τ²)  +  normalization', 480, 363, 23);
    num(
      c,
      fixed(four.error, 4) +
        '      +      ' +
        fixed(four.constant, 4) +
        '      ≈      ' +
        fixed(four.nll, 3),
      480,
      416,
      24,
      teal,
    );
  } else if (k.b < 5) {
    num(
      c,
      'Gaussian error    ' + fixed(four.error, 4) + ' → ' + (gate(c, k, 4, 'error doubles', 0.25) === 1 ? fixed(scores.error, 4) : '?'),
      479,
      365,
      21,
    );
    num(
      c,
      'MSE   ' + fixed(four.mean, 6) + ' → ' + (gate(c, k, 4, 'The mean stays put', 0.25) === 1 ? fixed(scores.mean, 6) : '?'),
      479,
      416,
      21,
      teal,
    );
  } else {
    num(c, 'Four pixels:    SSE / 0.5    =    8 × (SSE / 4)', 480, 361, 22);
    if (gate(c, k, 6, 'becomes one eighth', 0.25) === 1) num(c, 'β for mean error   =   1 / 8', 480, 417, 25, teal);
  }
}

function trained(c, k) {
  if (k.b >= 7 && gate(c, k, 7, 'Here are three draws', 0.2) > 0) {
    head(c, 'What comes back from a prior draw?');
    vae.priorDecodedRows.forEach((row, i) =>
      crop(c, row, 86 + i * 302, 162, 183, { name: 'Prior draw ' + (i + 1) }),
    );
    label(
      c,
      'Three unconditioned draws from the trained model',
      480,
      411,
      22,
      ink,
      'center',
      'Serif',
    );
    return;
  }
  head(c, 'Which coordinate moves the patch?');
  if (k.b < 2) {
    vae.inputRows.forEach((row, i) =>
      crop(c, row, 92 + i * 227, 164, 166, { name: i ? '32 lower strips' : '32 center badges' }),
    );
    label(c, '64 noisy training crops', 288, 384, 24, ink, 'center', 'Serif');
    cap(c, k.b ? 'Decoder' : 'Encoder', 720, 153, teal);
    num(c, k.b ? '2 → 12 → 25' : '25 → 12 → μ, ℓ', 720, 216, 24);
    if (k.b) {
      num(c, 'MSE + 0.02 × KL', 720, 294, 20, plum);
      cap(c, '400 Adam updates', 720, 350);
    } else label(c, 'Two means, two log variances', 718, 301, 18, dim, 'center');
    return;
  }
  const exchange = [
    { turn: 'Exchange the first numbers', read: 'The badge stays', from: null, to: 0, axis: 0 },
    { turn: 'Put the first numbers back', read: 'Both patterns return', from: 0, to: null, axis: 0 },
    { turn: 'Exchange the second numbers', read: 'Look at the output', from: null, to: 1, axis: 1 },
    { turn: 'Exchange the first numbers too', read: 'The new outputs', from: 1, to: 'both', axis: 0 },
  ][k.b - 3];
  const phase = exchange ? gate(c, k, k.b, exchange.turn, 0.85) : 1;
  const mode = exchange ? (phase < 0.5 ? exchange.from : exchange.to) : k.b >= 7 ? 'both' : null;
  const state = trial(mode);
  const pending = exchange
    ? phase > 0 && (phase < 1 || !gate(c, k, k.b, exchange.read, 0))
    : !gate(c, k, 2, 'Both patterns come back', 0);
  ['Original', 'First', 'Second', 'Frozen decoder'].forEach((name, i) =>
    cap(c, name, [137, 365, 548, 803][i], 124),
  );
  for (let r = 0; r < 2; r++) {
    const y = 160 + 145 * r;
    crop(c, vae.inputRows[r], 86, y, 103);
    state.coords[r].forEach((v, j) => {
      const swapped = mode === j || mode === 'both',
        col = swapped ? (r ? teal : plum) : r ? plum : teal,
        x = 291 + j * 183;
      c.save();
      c.translate(x + 74, y + 51);
      if (exchange && j === exchange.axis) c.scale(Math.max(0.02, Math.abs(Math.cos(Math.PI * phase))), 1);
      rect(c, -74, -26, 148, 52, col, 5);
      num(c, fixed(v, 4), 0, 0, 21, paper);
      c.restore();
    });
    arrow(c, 638, y + 51, 709, y + 51, dim);
    if (pending) {
      bracket(c, 748, y - 4, 112, 112, dim);
      cap(c, 'Pending', 804, y + 52);
    } else crop(c, state.images[r], 748, y - 4, 112);
  }
  if (k.b === 7) num(c, 'Mean KL by coordinate  (0.0005, 0.7378)', 477, 453, 18);
  else {
    const name = mode === null ? 'Own pairs' : mode === 'both' ? 'Both exchanged' : mode === 0 ? 'First exchanged' : 'Second exchanged';
    if (gate(c, k, 2, 'Both patterns come back', 0)) cap(c, 'Baseline MSE   ' + fixed(swaps.batchMSE.own, 8), 212, 426);
    const msePending = pending || (k.b === 5 && phase > 0 && !gate(c, k, 5, 'Its bright patch', 0));
    num(c, msePending ? 'Batch MSE   pending' : name + '   ' + fixed(state.error, 8), 642, 426, 19, msePending ? dim : teal);
  }
}
function probes(c, sensitivity, swap = false) {
  const outputs = collapseOutputs(1 - sensitivity);
  [0, 1].forEach((i) => {
    const id = swap ? 1 - i : i,
      x = 73 + i * 584;
    crop(c, outputs[id], x, 155, 217, {
      name: 'Probe ' + (id ? 'B' : 'A') + '   ' + pair(collapseCodes[id]),
    });
  });
  instrument(c, 480, 248, 'Code sensitivity', sensitivity, teal, { digits: 2 });
  num(
    c,
    'Largest pixel difference   ' + fixed(collapseDifference(1 - sensitivity), 3),
    480,
    401,
    22,
  );
}
function collapse(c, k) {
  head(c, 'Measure the decoder and encoder separately');
  const amount = gate(c, k, 0, 'Now reduce', 2.75);
  const match = gate(c, k, 0, 'Move its means', 2);
  const means = mu.map(v => v * (1 - match)), logs = lv.map(v => v * (1 - match));
  probes(c, 1 - amount, k.b === 1 && gate(c, k, 1, 'Swap the codes', 0.6) === 1);
  cap(c, 'Means ±' + pair(means) + '     log variance ' + pair(logs), 253, 425);
  num(c, 'KL per crop   ' + fixed(kl(means, logs), 4) + ' nats', 765, 425, 18, plum);
  cap(c, 'Standard-normal prior', 806, 399);
}
function information(c, k) {
  head(c, 'Can a matching mixture still carry identity?');
  const t = gate(c, k, 3, 'make both inputs produce a uniform code', 2);
  const state = binaryInformationState(t);
  cap(c, 'Joint probability', 238, 111);
  for (let i = 0; i < 2; i++) {
    cap(c, 'Code ' + i, 198 + i * 119, 149);
    label(c, 'Input ' + i, 116, 214 + i * 95, 16, dim, 'right');
    for (let j = 0; j < 2; j++) {
      const x = 143 + j * 119,
        y = 174 + i * 95,
        v = state.joint[i][j];
      rect(c, x, y, 110, 81, '#deded3', 4);
      if (v > 0) rect(c, x + 8, y + 68, 188 * v, 7, teal, 2);
      num(c, fixed(v, 2), x + 55, y + 33, 22, ink);
    }
  }
  cap(c, 'Aggregate codes', 236, 404);
  num(c, pair(state.marginal), 237, 438, 18);
  if (k.b === 0) {
    label(c, 'Average posterior KL', 663, 175, 27, ink, 'center', 'Serif');
    label(c, '=  input information', 660, 247, 24, teal, 'center');
    label(c, '+  aggregate prior mismatch', 665, 306, 22, plum, 'center');
  } else {
    const vals = [state.aggregateKL, state.mutualInformation, state.averageKL];
    ['Aggregate KL', 'Input information', 'Average posterior KL'].forEach((s, i) => {
      const yy = 156 + i * 97;
      label(c, s, 489, yy, 18);
      bar(
        c,
        491,
        yy + 20,
        253,
        11,
        k.b >= 2 || i === 0 ? vals[i] / Math.log(2) : 0,
        i === 0 ? plum : teal,
      );
      num(c, k.b >= 2 || i === 0 ? fixed(vals[i], 3) : '?', 807, yy + 20, 20);
    });
  }
}
function history(c, k) {
  head(
    c,
    k.b < 2
      ? 'Which input changed the picture?'
      : k.b < 4
        ? 'Hold the decoder context fixed'
        : 'How would you test the repair?',
  );
  if (k.b < 2) {
    const switched = gate(c, k, 0, 'change the code', 0.6) === 1,
      historyBit = gate(c, k, 0, 'change the history to one', 0.6) === 1;
    const rows = [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      visible = historyBit ? 3 : switched ? 2 : 1;
    ['Earlier pixel', 'Global code', 'Decoder output'].forEach((s, i) =>
      cap(c, s, [180, 459, 752][i], 115),
    );
    rows.slice(0, visible).forEach(([h, z], i) => {
      const yy = 170 + i * 104;
      num(c, h, 180, yy + 16, 28, h ? plum : ink);
      num(c, z, 459, yy + 16, 28, z ? teal : ink);
      crop(c, h ? probePixels : pixels, 710, yy - 26, 81);
    });
  } else if (k.b < 4) {
    const amount = gate(c, k, 2, 'Turn their decoder', 2.2);
    probes(c, 1 - 0.5 * amount);
    cap(c, 'Full sensitivity reference   ' + fixed(collapseDifference(0), 3), 480, 449);
  }
  else if (k.b === 4) {
    const a = gate(c, k, 4, 'raise it gradually', 2.5);
    const x = 139,
      y = 369,
      w = 653,
      h = 198;
    line(c, x, y, x + w, y, dim);
    line(c, x, y, x, y - h - 16, dim);
    line(c, x, y, x + w * a, y - h * a, teal, 4);
    dot(c, x + w * a, y - h * a, 7, teal);
    num(c, '0', 112, y, 17);
    num(c, '1', 112, y - h, 17);
    cap(c, 'KL weight', 143, 114);
    cap(c, 'Training updates', 486, 409);
    cap(c, 'Example schedule for a likelihood-scaled loss', 605, 128, dim);
  } else {
    cap(c, 'Training history', 231, 144);
    cap(c, 'Planned swap • same history in both trials', 703, 144);
    const words = ['the', 'badge', 'was'];
    words.forEach((v, i) => {
      const dropped = i === 1 && gate(c, k, 5, 'drops some of the previous words', 0.7) === 1;
      rect(c, 66 + i * 112, 198, 98, 55, dropped ? '#d8dbcf' : ink, 5);
      label(c, dropped ? '[mask]' : v, 115 + i * 112, 226, 20, dropped ? dim : paper, 'center');
    });
    arrow(c, 422, 225, 528, 225);
    for (const [x, name, color] of [
      [553, 'Code A', teal],
      [749, 'Code B', plum],
    ]) {
      bracket(c, x, 196, 143, 80, color);
      label(c, name, x + 72, 219, 18, color, 'center');
      num(c, 'output ?', x + 72, 252, 17);
    }
    label(
      c,
      'After retraining, swap codes and check generated text quality.',
      480,
      383,
      23,
      ink,
      'center',
      'Serif',
    );
  }
}
function freeBits(c, k) {
  head(c, 'Average first or floor first?');
  if (k.b < 2) {
    const value = 0.2 + 0.6 * gate(c, k, 1, 'carry more information', 2);
    const s = freeBitsState([value]),
      x = (v) => 133 + v * 241,
      y = (v) => 384 - v * 99;
    line(c, x(0), y(0), x(2.45), y(0), dim);
    line(c, x(0), y(0), x(0), y(2.25), dim);
    line(c, x(0), y(1), x(1), y(1), plum, 4);
    line(c, x(1), y(1), x(2.18), y(2.18), plum, 4);
    dot(c, x(value), y(s.groupCharge), 8, teal);
    line(c, x(value), y(0), x(value), y(s.groupCharge) - 9, teal);
    cap(c, 'Group charge (nats)', 177, 133);
    cap(c, 'Batch-average KL (nats)', 478, 429);
    num(c, 'floor  1', 777, y(1), 19, plum);
    num(c, 'slope  0', 302, y(1) - 38, 19, teal);
    return;
  }
  const s = freeBitsState();
  cap(c, 'KL values for one group', 480, 126);
  num(c, pair(s.values, 1) + ' nats', 480, 168, 28);
  const groupReady = gate(c, k, 3, 'and derivatives with respect', 0.1) > 0;
  const exampleReady = gate(c, k, 3, 'with derivatives zero', 0.1) > 0;
  ['Average, then floor', 'Floor each, then average'].forEach((v, i) => {
    const x = 263 + 436 * i;
    label(c, v, x, 232, 22, ink, 'center', 'Serif');
    num(c, i ? '(max(0.2, 1) + 2.2) / 2' : 'max((0.2 + 2.2) / 2, 1)', x, 290, 17);
    num(
      c,
      (i ? exampleReady : groupReady)
        ? fixed(i ? s.exampleCharge : s.groupCharge, 1) + ' nats'
        : '?',
      x,
      351,
      29,
      i ? plum : teal,
    );
    if (k.b === 4 || (k.b === 3 && gate(c, k, 3, 'derivatives zero and one-half', 0.8) === 1))
      num(
        c,
        'grad  ' + pair(i ? s.exampleGradients : s.groupGradients, 1),
        x,
        411,
        19,
        i ? plum : teal,
      );
  });
}
function interpolate(c, k) {
  head(c, 'What does the halfway code draw?');
  let t = 0.5 * gate(c, k, 0, 'Give each code half', 1.1);
  t += 0.5 * gate(c, k, 2, 'Slide the rest of the way', 2.4);
  const mid = collapseCodes[0].map((v, i) => mix(v, collapseCodes[1][i], t)),
    result = gate(c, k, 1, 'regions light up', 0, { captionStart: false }) === 1;
  crop(c, decode(collapseCodes[0]), 74, 167, 155, { name: 'Badge endpoint' });
  crop(c, decode(collapseCodes[1]), 731, 167, 155, { name: 'Strip endpoint' });
  if (result) crop(c, decode(mid), 390, 152, 180, { name: 'Decoded blend' });
  else {
    bracket(c, 390, 152, 180, 180, teal);
    num(c, '?', 480, 243, 38, teal);
  }
  const at = ruler(c, 153, 390, 655, 0, 1, [0, 0.5, 1]);
  dot(c, at(t), 390, 8, teal);
  num(c, pair(mid, 3), 477, 447, 21);
}
function quantize(c, k) {
  head(c, k.b === 2 ? 'Repeat the lookup across a grid' : 'Which entry reaches the decoder?');
  if (k.b === 2) {
    tilePatch(c, 105, 162, 24, 8);
    arrow(c, 351, 250, 599, 250);
    tilePatch(c, 670, 177, 18, 8, [27]);
    cap(c, '8 × 8 pixels', 202, 396);
    cap(c, 'One position in the latent grid', 746, 396, teal);
    return;
  }
  const plot = plane(c, 40, 117, 410, 287, 1.38);
  const snap = gate(c, k, 0, 'send the nearest entry', 1);
  const start = plot.pt(enc),
    selected = plot.pt(book[nearest]);
  book.forEach((row, i) => {
    const [x, y] = plot.pt(row);
    line(c, ...start, x, y, i === nearest && snap ? teal : rule, 1.5);
    ring(c, x, y, 7, 7, teal, 2);
    cap(c, 'E' + i, x + (i === 1 ? -20 : 20), y - 18);
  });
  dot(c, mix(start[0], selected[0], snap), mix(start[1], selected[1], snap), 5, plum);
  cap(c, 'Encoder proposal ' + pair(enc), 238, 435, plum);
  if (k.b === 0) {
    cap(c, 'Squared distance to proposal', 692, 135);
    dist.forEach((v, i) => {
      const y = 196 + i * 70;
      num(c, 'E' + i, 539, y, 20);
      bar(c, 579, y - 5, 181, 10, v / Math.max(...dist), snap && i === nearest ? teal : dim);
      num(c, fixed(v, 4), 831, y, 19);
    });
    if (snap === 1) num(c, 'Decoder gets ' + pair(book[nearest]), 696, 415, 20, teal);
  } else {
    [
      'Reconstruction → encoder (straight-through)',
      'Codebook loss → selected entry',
      'Commitment loss → encoder',
    ].forEach((v, i) => label(c, v, 477, 207 + i * 71, 18, i === 1 ? plum : teal));
  }
}
function vqGrad(c, k) {
  head(c, 'Who moves after the lookup?');
  const axis = k.b >= 5 ? 1 : 0;
  ['Encoder proposal z', 'Selected entry e', 'Target t'].forEach((v, i) => {
    const x = 176 + 303 * i;
    cap(c, v, x, 116);
    [enc, vq.entry, vq.target][i].forEach((value, j) => {
      const xx = x + (j - 0.5) * 91;
      if (j === axis) {
        rect(c, xx - 43, 141, 86, 45, '#dce1d5', 4);
        line(c, xx - 39, 185, xx + 39, 185, ink, 2);
      }
      num(c, fixed(value), xx, 164, 22, j === axis ? ink : dim);
    });
  });
  cap(c, 'Coordinate ' + (axis + 1) + '     •     Commitment weight β = ' + fixed(vq.commitmentWeight), 480, 214);
  line(c, 65, 242, 893, 242);
  const onAnswerWord = (phrase, captionStart = false) =>
    gate(c, k, 6, phrase, 0, { captionStart }) === 1;
  const ready = axis === 1 ? [
    onAnswerWord('minus point one five'),
    onAnswerWord('minus point zero two five'),
    onAnswerWord('point one. Every'),
  ] : [
    gate(c, k, 2, 'The encoder gets it', 0.45) === 1,
    gate(c, k, 3, 'adds point zero three five', 0) === 1,
    gate(c, k, 4, 'to the selected entry', 0) === 1,
  ];
  const encoderRoute = axis === 1 && onAnswerWord('encoder', 'Follow the gradients');
  const entryRoute = axis === 1 && onAnswerWord('selected entry gets');
  const gradients = [vq.reconstructionGradient, vq.commitmentGradient, vq.codebookGradient];
  ['Reconstruction', 'Commitment', 'Codebook'].forEach((name, i) => {
    const routed = axis === 0 ? ready[i] : (i === 2 ? entryRoute : encoderRoute);
    const x = [187, 480, 773][i], col = routed ? (i === 2 ? plum : teal) : dim;
    const destination = i < 2 ? 'encoder' : (axis === 1 ? 'selected entry' : 'entry');
    label(c, routed ? name + ' → ' + destination : name, x, 273,
      axis === 1 && routed ? 19 : 15, col, 'center', 'Sans', 600);
    num(c, ['e − t', '2β(z − e)', '2(e − z)'][i], x, 309, 19);
    const sign = axis === 1 && i === 2 ? '+' : '';
    num(c, ready[i] ? sign + fixed(gradients[i][axis], 3) : '?', x, 350, 26, col);
  });
  if (axis === 1 ? onAnswerWord('minus point one seven five') : ready[0] && ready[1]) {
    line(c, 146, 384, 521, 384, teal, 2);
    num(c, 'Encoder sum   ' + fixed(vq.encoderGradient[axis], 3), 334, 423, 22, teal);
  }
  if (axis === 0 && gate(c, k, 4, 'A descent step', 0) === 1) {
    cap(c, 'Entry update   •   step ' + fixed(vq.rate, 1), 773, 394, plum);
    num(c, 'e − step × grad = ' + fixed(vq.nextEntry[axis], 3), 773, 429, 17, plum);
  }
}
function codePrior(c, k) {
  head(
    c,
    k.b === 2 ? 'Which entries actually get used?' : 'A prior learns how code IDs fit together',
  );
  if (k.b === 0) {
    ['Training prior', 'Selected posterior'].forEach((s, i) => {
      const x = 249 + i * 452;
      cap(c, s, x, 145);
      for (let j = 0; j < 3; j++) {
        const h = i ? (j === nearest ? 128 : 0) : 128 / 3,
          xx = x - 86 + j * 73;
        rect(c, xx, 329 - h, 37, Math.max(2, h), i ? plum : teal, 2);
        cap(c, 'E' + j, xx + 19, 358);
      }
    });
    num(c, 'KL = log K = ' + fixed(Math.log(book.length), 3) + ' nats', 480, 422, 21);
  } else if (k.b === 1) {
    const sequences = [
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    ['Training pattern A', 'Training pattern B', 'Independent toy draw'].forEach((s, i) => {
      label(c, s, 63, 169 + i * 101, 19, ink);
      sequences[i].forEach((v, j) => {
        const xx = 343 + j * 128,
          yy = 143 + i * 101;
        rect(c, xx, yy, 69, 51, v ? plum : teal, 4);
        num(c, v, xx + 35, yy + 25, 24, paper);
        if (j < 3 && i < 2) arrow(c, xx + 78, yy + 25, xx + 116, yy + 25, dim);
      });
    });
  } else {
    const n = 1 + Math.floor((usage.length - 1) * gate(c, k, 2, 'Track entry usage', 5.5));
    const seen = usage.slice(0, n);
    seen.forEach((v, i) => {
      const x = 56 + i * 72;
      rect(c, x, 146, 55, 51, v ? plum : teal, 4);
      num(c, v, x + 27, 172, 23, paper);
    });
    [0, 1, 2].forEach((id, i) => {
      const count = seen.filter((v) => v === id).length,
        y = 257 + i * 66;
      cap(c, 'Entry ' + id, 183, y);
      bar(c, 263, y - 7, 370, 15, count / n, id === 1 ? plum : teal);
      num(c, count + ' / ' + n, 749, y, 21);
    });
  }
}
function tilePatch(c, x, y, side, n, marked) {
  for (let i = 0; i < n * n; i++) {
    const fill = marked
      ? marked.includes(i)
        ? teal
        : '#cdd2c4'
      : shade(pixels[(Math.floor(i / n) % 5) * 5 + ((i % n) % 5)]);
    rect(c, x + (i % n) * side, y + Math.floor(i / n) * side, side - 1, side - 1, fill);
  }
}
const finalLatents = [collapseCodes[0], collapseCodes[1], [0.5, 0.5], [0.12, 0.24]];
const latentNoise = finalLatents.map((_, i) => [noise[i].x, noise[i].y]);
function spatialExample(amount) {
  const latents = latentNoise.map((row, i) =>
    row.map((v, j) => mix(v, finalLatents[i][j], amount)),
  );
  const tiles = latents.map(decode);
  const image = Array.from({ length: 100 }, (_, i) => {
    const x = i % 10,
      y = Math.floor(i / 10),
      tile = 2 * Math.floor(y / 5) + Math.floor(x / 5);
    return tiles[tile][5 * (y % 5) + (x % 5)];
  });
  return { latents, image };
}
function latentPatch(c, x, y, latents, name) {
  cap(c, name, x + 85, y - 23);
  latents.forEach((row, i) => {
    const xx = x + (i % 2) * 86,
      yy = y + Math.floor(i / 2) * 86;
    rect(c, xx, yy, 82, 82, '#d8dacc', 4);
    row.forEach((v, j) => {
      const base = yy + 24 + 34 * j,
        mid = xx + 40;
      line(c, xx + 5, base, xx + 76, base, rule);
      line(c, mid, base - 5, mid, base + 5, ink);
      dot(c, mid + v * 13, base, 4, j ? plum : teal);
    });
  });
}
function spatial(c, k) {
  head(
    c,
    k.b < 2
      ? 'Count positions, values and bytes separately'
      : k.b < 4
        ? 'Where does the denoiser work?'
        : 'Check detail after compression',
  );
  const budget = budgets(basis);
  if (k.b < 2) {
    tilePatch(c, 70, 167, 21, 8);
    tilePatch(c, 410, 167, 21, 8, [27]);
    cap(c, 'One 8 × 8 patch', 154, 139);
    cap(c, 'One latent position', 491, 139, teal);
    arrow(c, 264, 249, 379, 249);
    cap(c, 'stride 8', 322, 216);
    num(c, '512 × 512 × 3', 154, 372, 19);
    num(c, '64 × 64 × 4', 496, 372, 19);
    const ready = [
      gate(c, k, 0, 'times fewer positions', 0),
      gate(c, k, 0, 'shrinks forty-eight-fold', 0),
      gate(c, k, 1, 'ninety-six-fold reduction', 0),
    ];
    [
      ['Positions', budget.positions],
      ['Scalars', budget.scalars],
      ['Raw bytes', budget.bytes],
    ]
      .slice(0, k.b === 0 ? 2 : 3)
      .forEach(([s, v], i) => {
        const y = 177 + i * 83;
        cap(c, s, 764, y);
        num(c, ready[i] ? v + '× fewer' : '?', 764, y + 32, 24, i === 2 ? plum : teal);
      });
    if (k.b === 1) num(c, '4 bytes / image scalar     2 bytes / latent scalar', 480, 440, 18);
  } else if (k.b < 4) {
    const t = gate(c, k, 2, 'Follow the noise through the denoiser', 1.6);
    const example = spatialExample(t);
    latentPatch(c, 52, 180, latentNoise, 'Initial noise');
    arrow(c, 240, 265, 365, 265);
    cap(c, 'Denoise', 302, 232, teal);
    latentPatch(c, 391, 180, example.latents, 'Latent grid');
    arrow(c, 580, 265, 694, 265);
    cap(c, 'Decode', 636, 232, plum);
    if (k.b === 3) crop(c, example.image, 726, 180, 172, { name: 'Decoded pixels', columns: 10 });
    else bracket(c, 726, 180, 172, 172, dim);
    label(
      c,
      'Illustrated trajectory • each latent pair paints one five-by-five tile',
      480,
      407,
      20,
      dim,
      'center',
    );
  } else {
    crop(c, pixels, 116, 145, 213, { name: 'Original', numbers: center });
    crop(c, recon, 631, 145, 213, { name: 'Fixed decoder', numbers: center });
    arrow(c, 384, 253, 570, 253);
    cap(c, 'Two averages', 476, 219, teal);
    label(c, 'Which details must survive your compressor?', 480, 420, 25, ink, 'center', 'Serif');
  }
}
function finalInput(c, k) {
  if (k.b === 0) return gate(c, k, 0, 'then look at B', 0.22) === 1 ? 1 : 0;
  if (k.b === 1) return gate(c, k, 1, 'from A to B', 0.22) === 1 ? 1 : 0;
  if (k.b === 2) return gate(c, k, 2, 'Look at the top left', 0) === 1 &&
    !gate(c, k, 2, 'B has the smaller error', 0) ? 0 : 1;
  if (k.b === 3) return 1;
  if (k.b === 4) return gate(c, k, 4, 'Switch to B', 0.22) === 1 ? 1 : 0;
  return gate(c, k, 5, 'The alert changes', 0.65) === 1 ? 1 : 0;
}
function finale(c, k) {
  head(c, k.b === 2 ? 'Which crop fits the same reconstruction better?' : 'Could you report the original alert?');
  const index = finalInput(c, k),
    input = collision.inputs[index];
  const verdict = gate(c, k, 4, 'so A lights the alert', 0.55) === 1;
  const visible = gate(c, k, 1, 'Feed the pair', 0.55) === 1;
  crop(c, input, 57, 141, 240, {
    name: 'Original ' + (index ? 'B' : 'A'),
    numbers: [...center, ...lower],
    glow: verdict ? above(input) : [],
  });
  if (visible) {
    crop(c, collision.outputs[0], 663, 141, 240, {
      name: 'Shared reconstruction',
      numbers: [...center, ...lower],
    });
    arrow(c, 574, 259, 632, 259, dim);
  } else {
    bracket(c, 663, 141, 240, 240, dim);
    cap(c, 'Fixed decoder', 783, 118);
    num(c, '?', 783, 259, 43, dim);
  }
  cap(c, 'Code sent to decoder', 480, 212);
  num(c, visible ? pair(collision.codes[index], 1) : '(?, ?)', 480, 261, 26, teal);
  if (k.b === 2 || (k.b === 1 && index === 1)) {
    cap(c, 'Top-left badge pixel', 480, 307);
    ['A', 'Decoded', 'B'].forEach((name, i) => {
      const xx = 379 + 101 * i;
      cap(c, name, xx, 339);
      const grid = [collision.inputs[0], collision.outputs[0], collision.inputs[1]][i];
      num(c, fixed(grid[center[0]]), xx, 367, 22);
    });
    if (gate(c, k, 2, 'B has the smaller error', 0) === 1) {
      num(c, 'A   ' + fixed(collision.mse[0], 4), 180, 428, 23, plum);
      cap(c, 'Mean squared error over 25 pixels', 480, 428);
      num(c, 'B   ' + fixed(collision.mse[1], 4), 783, 428, 23, plum);
    }
  } else if (k.b >= 3) {
    const peak = Math.max(...input),
      on = above(input).length > 0;
    cap(c, 'Original peak > 0.90?', 180, 396, dim);
    if (verdict) {
      rect(c, 82, 405, 191, 38, on ? '#f4d2b5' : '#d9dfd4', 18);
      ring(c, 104, 424, 9, 9, on ? red : dim, 2, on ? '#ff702c' : '#93a49c');
      num(c, fixed(peak) + (on ? '   ALERT' : '   quiet'), 191, 425, 18, on ? red : dim);
      cap(c, 'Decoded peak  ' + fixed(Math.max(...collision.outputs[0])), 782, 396);
      if (k.b === 5)
        label(c, 'Retain the peak and flagged positions.', 484, 378, 17, ink, 'center', 'Serif');
    }
  } else if (k.b === 0) {
    const other = 1 - index;
    const row = collision.inputs[other];
    cap(c, 'Other badge • ' + (other ? 'B' : 'A'), 480, 326);
    num(c, center.map((i) => fixed(row[i], 1)).join('  '), 480, 360, 17);
  }
}
const painters = [
  intro,
  bottleneck,
  paintBadge,
  measure,
  intervention,
  baseline,
  posterior,
  mixture,
  klCosts,
  sampling,
  gradients,
  objective,
  evidence,
  likelihood,
  trained,
  collapse,
  information,
  history,
  freeBits,
  interpolate,
  quantize,
  vqGrad,
  codePrior,
  spatial,
  finale,
];
function draw(c, clock) {
  c.save();
  c.scale(2, 2);
  const bg = c.createLinearGradient(0, 0, 960, 540);
  bg.addColorStop(0, '#fcf9ee');
  bg.addColorStop(0.65, '#f3efe2');
  bg.addColorStop(1, '#e7e9da');
  c.fillStyle = bg;
  c.fillRect(0, 0, 960, 540);
  painters[clock.beat.chapterIndex](c, { clock, b: clock.beat.beatIndex });
  c.restore();
}
function check() {
  const near = (a, b, tol = 1e-8) => assert(Math.abs(a - b) < tol, `Expected ${a} to be near ${b}`);
  assert.deepEqual(above(pixels), [12]);
  assert.deepEqual(above(recon), center);
  assert.deepEqual(z, [0.8875, 0.17]);
  near(recon[15], 0.1395);
  near(recon[6], 0.9675);
  const swapped = [...pixels];
  [swapped[6], swapped[12]] = [swapped[12], swapped[6]];
  assert.deepEqual(encode(swapped), z);
  near(mseOf(pixels, recon), mse);
  assert(mseOf(pixels, decode(probeCode)) > mse);
  assert.equal(fixed(ae.after, 4), fixed(ae.baseline, 4));
  assert(ae.before > 100 * ae.after);
  assert.deepEqual(
    rowKL.map((v) => fixed(v, 4)),
    ['0.1783', '0.0226'],
  );
  near(sum(rowKL), kl(mu, lv));
  const base = sampleAt(0, 0),
    shift = sampleAt(1, 0),
    stretch = sampleAt(1, 1);
  near(shift.point[0] - base.point[0], 0.7);
  near(shift.point[1], base.point[1]);
  assert.deepEqual(stretch.mean, shift.mean);
  near(stretch.point[0] - shift.point[0], 0.275);
  near(stretch.point[1] - shift.point[1], -0.35);
  stretch.point.forEach((v, i) =>
    near(v - shift.point[i], eps[i] * (stretch.scale[i] - shift.scale[i])),
  );
  near(gradient(0.8, 1.5, 0.2), 0.8);
  near(kl([0, 0], [0, 0]), 0);
  const start = gaussianEvidenceState(0),
    end = gaussianEvidenceState(1);
  near(start.priorKL, 0);
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const s = gaussianEvidenceState(progress);
    const toPosterior =
      0.5 *
      (Math.log(end.variance / s.variance) +
        (s.variance + (s.mean - end.mean) ** 2) / end.variance -
        1);
    near(s.logEvidence, start.logEvidence);
    near(s.elbo + s.gap, s.logEvidence);
    near(s.expectedLogLikelihood - s.elbo, s.priorKL);
    near(s.gap, toPosterior);
    for (const score of [s.elbo, s.expectedLogLikelihood, s.logEvidence]) {
      assert(score >= evidenceAxis.min && score <= evidenceAxis.max);
    }
  }
  near(end.elbo, end.logEvidence);
  assert(end.priorKL > start.priorKL);
  assert(observed[0] < predicted[0] && observed[1] > predicted[1]);
  near(eight.error, 2 * four.error);
  near(four.mean, eight.mean);
  near(four.error / four.mean, 8);
  assert.equal(fixed(four.nll, 3), '0.917');
  const lit = (row) => row.flatMap((v, i) => (v > 0.5 ? [i] : []));
  assert.deepEqual(trial(0).images.map(lit), [center, lower]);
  assert.deepEqual(trial(1).images.map(lit), [lower, center]);
  assert.deepEqual(trial(1).coords[0], trial(0).coords[1]);
  assert.deepEqual(trial('both').coords, [...trial(null).coords].reverse());
  assert.deepEqual(trial('both').images.map(lit), [lower, center]);
  assert.deepEqual([null, 0, 1, 'both'].map(mode => fixed(trial(mode).error, 8)),
    ['0.00045450', '0.00045448', '0.12762704', '0.12761675']);
  assert(trial(1).error > 200 * trial(0).error);
  near(collapseDifference(1), 0);
  near(collapseDifference(0), 0.750);
  near(collapseDifference(0.5), collapseDifference(0) / 2);
  near(kl(mu, lv), kl(mu.map(v => -v), lv));
  near(binaryInformationState(0).mutualInformation, Math.log(2));
  near(binaryInformationState(1).averageKL, 0);
  const floors = freeBitsState();
  near(floors.groupCharge, 1.2);
  near(floors.exampleCharge, 1.6);
  assert.deepEqual(floors.groupGradients, [0.5, 0.5]);
  assert.deepEqual(floors.exampleGradients, [0, 0.5]);
  const mid = decode(collapseCodes[0].map((v, i) => (v + collapseCodes[1][i]) / 2));
  near(mid[6], mid[16]);
  assert.equal(nearest, 1);
  near(vq.commitmentWeight, 0.25);
  vq.encoderGradient.forEach((value, axis) => {
    near(vq.commitmentGradient[axis], 2 * vq.commitmentWeight * (enc[axis] - vq.entry[axis]));
    near(value, vq.reconstructionGradient[axis] + vq.commitmentGradient[axis]);
    near(vq.nextEntry[axis], vq.entry[axis] - vq.rate * vq.codebookGradient[axis]);
  });
  assert.deepEqual(
    vq.encoderGradient.map((v) => fixed(v, 3)),
    ['0.185', '−0.175'],
  );
  assert.deepEqual(
    vq.codebookGradient.map((v) => fixed(v, 2)),
    ['−0.14', '0.10'],
  );
  assert(!usage.includes(2));
  assert.deepEqual(budgets(basis), { positions: 64, scalars: 48, bytes: 96 });
  const spatial = spatialExample(1);
  near(spatial.image[11], decode(finalLatents[0])[6]);
  near(spatial.image[36], decode(finalLatents[1])[16]);
  assert.deepEqual(collision.codes, [
    [0.7, 0.3],
    [0.7, 0.3],
  ]);
  assert.deepEqual(collision.outputs[0], collision.outputs[1]);
  assert.deepEqual(collision.inputs.map(above), [[12], []]);
  assert.deepEqual(above(collision.outputs[0]), []);
  assert.deepEqual(collision.mse.map(v => fixed(v, 4)), ['0.0132', '0.0068']);
  collision.inputs.forEach((input, i) => {
    near(collision.mse[i], mseOf(input, collision.outputs[i]));
    near(collision.outputs[i][center[0]] - input[center[0]], [0.38, 0.18][i]);
  });
  assert(collision.mse[1] < collision.mse[0]);
  return true;
}
export default {
  title: 'Autoencoders and VAEs: what the code preserves',
  preparePicture: prepareCaptions,
  draw,
  check,
};
