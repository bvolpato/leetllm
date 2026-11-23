import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { generator, normal } from '../../../films/diffusion/arithmetic.mjs';

const W = 320;
const H = 136;
const block = await loadImage(await readFile(new URL('./mackerel.svg', import.meta.url)));
const raster = createCanvas(W, H);
const ink = raster.getContext('2d');
ink.drawImage(block, 0, 0, W, H);
const pigment = ink.getImageData(0, 0, W, H);
const left = Float64Array.from({ length: W * H }, (_, i) => pigment.data[4 * i] / 127.5 - 1);
const right = left.map((_, i) => left[i - 2 * (i % W) + W - 1]);
const difference = right.map((value, i) => value - left[i]);
const mix = (a, b, t) => a + t * (b - a);
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));

function grain(seed) {
  const rng = generator(seed);
  return left.map(() => normal(rng));
}

function exposure(print, noise, signal) {
  const sigma = Math.sqrt(1 - signal * signal);
  return print.map((value, i) => signal * value + sigma * noise[i]);
}

// Equal priors and mirrored prints give equal squared norms. In the ratio of
// the two Gaussian likelihoods, only the projection onto their difference remains.
function rightWeight(pixels, signal) {
  if (signal === 0) return 0.5;
  let projection = 0;
  for (let i = 0; i < pixels.length; i++) projection += pixels[i] * difference[i];
  if (signal === 1) return Number(projection > 0);
  return 1 / (1 + Math.exp(-signal * projection / (1 - signal * signal)));
}

const signals = [0, .001, .002, .004, .006, .009, .012, .016, .02, .026, .034,
  .045, .06, .085, .12, .17, .24, .34, .48, .64, .79, .90, .97, .995, 1];

function cleanEstimate(weight) {
  return left.map((v, i) => v + weight * difference[i]);
}

function solve(seed) {
  let pixels = grain(seed);
  return signals.map((signal, step) => {
    const weight = rightWeight(pixels, signal);
    const estimate = cleanEstimate(weight);
    const state = { pixels, weight, estimate };
    if (step + 1 < signals.length) {
      const next = signals[step + 1];
      const sigmaRatio = Math.sqrt((1 - next * next) / (1 - signal * signal));
      // Deterministic DDIM, expressed in terms of a predicted clean image.
      pixels = pixels.map((x, i) => next * estimate[i] + sigmaRatio * (x - signal * estimate[i]));
    }
    return state;
  });
}

const first = solve(6);
const second = solve(2);
const trainingNoise = grain(253);
const last = signals.length - 1;
const split = 12;

const beats = [
  {
    id: 'lose-the-eye',
    say: 'Follow the white ring around the eye. As we mix noise into these pixels, the fine stripes break up. Can you still tell which end is the head?',
    hold: 1.0,
  },
  {
    id: 'the-pair',
    say: 'Imagine these are the only two clean prints, both equally likely. A diffusion model can learn from noisy copies. We kept each original, so we can train a denoiser to predict its clean pixels by minimizing squared error.',
    hold: 0.8,
  },
  {
    id: 'first-estimate',
    say: "Start a new print with fresh noise. Beside it is the first clean estimate. Look closely at the ends. Why is there an eye at each one?",
    hold: 1.25,
  },
  {
    id: 'both-eyes',
    say: 'Pull that estimate apart. To minimize squared error over many examples, blend the possible originals according to how likely each one is. Here we can calculate the odds exactly. In pure noise they’re even. Lay half of each print back down. Both rings show through.',
    hold: 0.75,
  },
  {
    id: 'look-again',
    say: 'Watch the rings. The sampler uses the estimate to take a step to a lower noise level. The denoiser sees the updated pixels and looks again. Now the right-facing print fits a little better. Give it a few more steps.',
    hold: 1.0,
  },
  {
    id: 'the-tail',
    say: 'The right eye is already clear in the estimate. Keep going, and the grain clears from the sample itself. Look where the left eye used to be. There’s the fork in the tail.',
    hold: 1.6,
  },
  {
    id: 'another-start',
    say: 'Leave that fish in place. Give the same sampler a fresh patch of noise. Watch which end keeps the eye this time.',
    hold: 1.4,
  },
  {
    id: 'nose-to-nose',
    say: 'There it is on the left. A different start took the same steps to the other print.',
    hold: 2.8,
  },
];

// Ink coverage is a display scale. The sampler always uses unclipped floating point pixels.
const brush = createCanvas(W, H);
const brushCtx = brush.getContext('2d');
const patch = brushCtx.createImageData(W, H);
for (let i = 0; i < patch.data.length; i += 4) {
  patch.data[i] = 16;
  patch.data[i + 1] = 51;
  patch.data[i + 2] = 81;
}

function printPixels(ctx, a, box, b = a, phase = 0) {
  for (let i = 0; i < a.length; i++) {
    const value = phase === 0 ? a[i] : mix(a[i], b[i], phase);
    patch.data[i * 4 + 3] = (1 - value) * 127.5;
  }
  brushCtx.putImageData(patch, 0, 0);
  ctx.drawImage(brush, box.x, box.y, box.w, box.w * H / W);
}

function position(a, b, t) {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t) };
}

const hero = { x: 112, y: 172, w: 1696 };
const inputBox = { x: 130, y: 385, w: 474 };
const guessBox = { x: 670, y: 268, w: 1134 };
const pairA = { x: 90, y: 317, w: 870 };
const pairB = { x: 960, y: 317, w: 870 };
const blue = '#123651';
const copper = '#ab452d';

function label(ctx, words, x, y, options = {}) {
  const { size = 47, color = blue, align = 'left', serif = true, opacity = 1 } = options;
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.fillStyle = color;
  ctx.font = `${serif ? '' : '500 '}${size}px "${serif ? 'Lesson Serif' : 'Lesson Sans'}"`;
  ctx.textAlign = align;
  ctx.fillText(words, x, y);
  ctx.restore();
}

// The texture sits on the page beneath the ink, so the clean paper shows through each cut.
const page = createCanvas(1920, 1080);
const paper = page.getContext('2d');
const wash = paper.createLinearGradient(0, 0, 1780, 1080);
wash.addColorStop(0, '#f3ead6');
wash.addColorStop(.47, '#fbf4e4');
wash.addColorStop(1, '#eee2ca');
paper.fillStyle = wash;
paper.fillRect(0, 0, 1920, 1080);
const fibers = generator(194);
for (let i = 0; i < 13500; i++) {
  const x = fibers() * 1920;
  const y = fibers() * 1080;
  const dx = 2 + fibers() ** 3 * 26;
  const dy = (fibers() - .5) * dx * .35;
  paper.strokeStyle = i % 3 ? 'rgba(78,63,39,.055)' : 'rgba(255,255,248,.38)';
  paper.lineWidth = .4 + fibers() * .8;
  paper.beginPath();
  paper.moveTo(x, y);
  paper.quadraticCurveTo(x + dx * .53, y + dy * .2 - 1, x + dx, y + dy);
  paper.stroke();
}

function leader(ctx, box, onRight, words, opacity, color = copper) {
  if (opacity <= 0) return;
  const x = box.x + box.w * (onRight ? 557 : 83) / 640;
  const y = box.y + box.w * 131 / 640;
  const radius = box.w * 19 / 640;
  const foot = box.y + box.w * H / W + 51;
  const labelX = x + (onRight ? -26 : 26);
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + radius + 5);
  ctx.lineTo(x, foot - 20);
  ctx.lineTo(labelX, foot - 20);
  ctx.stroke();
  label(ctx, words, labelX + (onRight ? -10 : 10), foot - 7, {
    size: 43, serif: false, align: onRight ? 'right' : 'left', color,
  });
  ctx.restore();
}

function readStep(run, at) {
  const step = Math.min(last, Math.max(0, at));
  const lo = Math.floor(step);
  const a = run[lo];
  const b = run[Math.min(last, lo + 1)];
  const t = smooth((step - lo) / .74);
  return { a, b, t, weight: mix(a.weight, b.weight, t) };
}

function prediction(ctx, state, box, opacity = 1) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  printPixels(ctx, state.a.estimate, box, state.b.estimate, state.t);
  ctx.restore();
}

function samplingDesk(ctx, state, spread, marks, pct) {
  const input = position(hero, inputBox, spread);
  printPixels(ctx, state.a.pixels, input, state.b.pixels, state.t);
  label(ctx, 'Current pixels', input.x, input.y - 40, { size: 48 });
  if (spread === 0) return;
  const visible = smooth((spread - .72) / .28);
  prediction(ctx, state, guessBox, visible);
  label(ctx, 'Clean estimate', guessBox.x + 38, guessBox.y - 40, { size: 58, opacity: visible });
  const rightPercent = Math.round(100 * state.weight);
  leader(ctx, guessBox, false, pct ? `${100 - rightPercent}% left-facing` : 'Eye', marks);
  leader(ctx, guessBox, true, pct ? `${rightPercent}% right-facing` : 'Eye', marks);
}

// Separate the two ink contributions, then register them again. Addition of half
// the coverage from each print gives the exact posterior mean at pure noise.
const travel = 54;
const lifted = createCanvas(W, H + 2 * travel);
const liftedCtx = lifted.getContext('2d');
const layers = liftedCtx.createImageData(lifted.width, lifted.height);
for (let i = 0; i < layers.data.length; i += 4) {
  layers.data.set([16, 51, 81], i);
}

function separateImpressions(ctx, apart) {
  const shift = Math.round(travel * apart);
  for (let y = 0; y < lifted.height; y++) {
    const top = y - travel + shift;
    const bottom = y - travel - shift;
    for (let x = 0; x < W; x++) {
      const a = top >= 0 && top < H ? 1 - left[top * W + x] : 0;
      const b = bottom >= 0 && bottom < H ? 1 - right[bottom * W + x] : 0;
      layers.data[(y * W + x) * 4 + 3] = (a + b) * 63.75;
    }
  }
  liftedCtx.putImageData(layers, 0, 0);
  const scale = guessBox.w / W;
  ctx.drawImage(lifted, guessBox.x, guessBox.y - travel * scale, guessBox.w, lifted.height * scale);
  const labels = smooth((apart - .77) / .23);
  label(ctx, 'Left-facing print', guessBox.x + 40, guessBox.y - travel * scale + 3,
    { size: 44, opacity: labels });
  label(ctx, 'Right-facing print', guessBox.x + 40, guessBox.y + (H + travel) * scale + 12,
    { size: 44, opacity: labels });
}

function draw(ctx, clock) {
  ctx.drawImage(page, 0, 0);
  const { index, elapsed, reveal } = clock;
  if (index === 0) {
    const intoGrain = smooth(elapsed / 2.3) * .13 + smooth(reveal('As we mix noise', 3.3)) * .38
      + smooth(reveal('the fine stripes', 2.6)) * .49;
    const signal = Math.cos(intoGrain * Math.PI / 2);
    printPixels(ctx, exposure(left, trainingNoise, signal), hero);
    leader(ctx, hero, false, 'Eye', 1 - smooth(reveal('As we mix noise', 1.1)));
    return;
  }
  if (index === 1) {
    const copies = smooth(reveal('A diffusion model', 1.1));
    const cleanY = mix(324, 132, copies);
    const row = [{ x: 396, y: cleanY, w: 677 }, { x: 1130, y: cleanY, w: 677 }];
    label(ctx, 'Clean prints', 88, cleanY + 155, { size: 49 });
    for (const [i, print] of [left, right].entries()) {
      printPixels(ctx, print, row[i]);
      if (copies > 0) {
        ctx.save();
        ctx.globalAlpha = copies;
        printPixels(ctx, trainingCopies[i], { ...row[i], y: 588 });
        ctx.restore();
      }
    }
    label(ctx, 'Noisy copies', 88, 742, { size: 49, opacity: copies });
    return;
  }
  if (index === 2) {
    samplingDesk(ctx, readStep(first, 0), smooth(reveal('Beside it', 1.1)),
      smooth(reveal('Look closely', .65)), false);
    return;
  }
  if (index === 3) {
    const lift = smooth(reveal('Pull that estimate apart', 1.8));
    const settle = smooth(reveal('Lay half of each print', 2));
    const apart = lift * (1 - settle);
    if (apart > 0) {
      printPixels(ctx, first[0].pixels, inputBox);
      label(ctx, 'Current pixels', inputBox.x, inputBox.y - 40, { size: 48 });
      separateImpressions(ctx, apart);
    } else {
      samplingDesk(ctx, readStep(first, 0), 1, 1, true);
    }
    return;
  }
  if (index === 4) {
    const firstSteps = smooth(reveal('Watch the rings', 3.5)) * 5;
    const nextSteps = smooth(reveal('The denoiser sees', 3.8)) * 2;
    const more = smooth(reveal('Give it a few more', 1.8)) * (split - 7);
    samplingDesk(ctx, readStep(first, firstSteps + nextSteps + more), 1, 1, true);
    return;
  }
  if (index === 5) {
    const focus = smooth(reveal('Keep going', 1.65));
    const expand = smooth((focus - .25) / .75);
    const dissolve = smooth(reveal('and the grain clears', 3.6));
    const state = readStep(first, split + (last - split) * dissolve);
    const box = position(inputBox, hero, expand);
    if (focus < 1) {
      const visible = 1 - smooth(focus / .25);
      prediction(ctx, state, guessBox, visible);
      label(ctx, 'Clean estimate', guessBox.x + 38, guessBox.y - 40, { size: 58, opacity: visible });
      leader(ctx, guessBox, true, 'Right eye', visible);
    }
    printPixels(ctx, state.a.pixels, box, state.b.pixels, state.t);
    label(ctx, 'Current pixels', box.x, box.y - 40, { size: 48, opacity: 1 - expand });
    return;
  }
  const setAside = index === 6 ? smooth(reveal('Leave that fish', 1.45)) : 1;
  printPixels(ctx, first[last].pixels, position(hero, pairA, setAside));
  const again = index === 6 ? smooth(reveal('a fresh patch', .8)) : 1;
  if (!again) return;
  const advance = index === 6 ? smooth(reveal('Watch which end', 3.2)) : 1;
  const other = readStep(second, advance * last);
  ctx.save();
  ctx.globalAlpha = again;
  printPixels(ctx, other.a.pixels, pairB, other.b.pixels, other.t);
  ctx.restore();
  const labels = index === 6 ? again : 1 - smooth(elapsed / 1.3);
  label(ctx, 'First draw', pairA.x + pairA.w / 2, 781, { size: 44, align: 'center', opacity: labels });
  label(ctx, 'Second draw', pairB.x + pairB.w / 2, 781, { size: 44, align: 'center', opacity: labels });
}

const trainingCopies = [
  exposure(left, trainingNoise, .81),
  exposure(right, grain(351), .81),
];

function check() {
  const flank = 70 * W + 122;
  assert.ok(left[flank] < 0 && left[0] === 1);
  assert.equal(first[0].weight, .5);
  assert.equal(second[0].weight, .5);
  // Compare the projection shortcut with the full Gaussian likelihood for both prints.
  const signal = signals[7];
  const trial = first[7];
  const distance = (print) => trial.pixels.reduce((total, value, i) =>
    total + (value - signal * print[i]) ** 2, 0);
  const odds = Math.exp((distance(left) - distance(right)) / (2 * (1 - signal ** 2)));
  assert.ok(Math.abs(trial.weight - odds / (1 + odds)) < 1e-8);
  const risk = (prediction) => prediction.reduce((sum, value, i) =>
    sum + (1 - trial.weight) * (value - left[i]) ** 2 + trial.weight * (value - right[i]) ** 2, 0);
  assert.ok(risk(trial.estimate) < Math.min(risk(left), risk(right)));
  for (const run of [first, second]) {
    for (const [i, state] of run.entries()) {
      assert.ok(Number.isFinite(state.weight));
      assert.ok(state.pixels.every(Number.isFinite));
      if (i === last) continue;
      const s = signals[i];
      const t = signals[i + 1];
      if (t === 1) continue;
      for (const j of [0, 65 * W + 41, 65 * W + 278]) {
        const noise = (state.pixels[j] - s * state.estimate[j]) / Math.sqrt(1 - s * s);
        const next = t * state.estimate[j] + Math.sqrt(1 - t * t) * noise;
        assert.ok(Math.abs(next - run[i + 1].pixels[j]) < 1e-12);
      }
    }
  }
  assert.ok(first[5].weight > .5 && first[5].weight < .95);
  assert.ok(first[split].weight > .99);
  assert.ok(first[last].pixels.every((value, i) => Math.abs(value - right[i]) < 1e-10));
  assert.ok(second[last].pixels.every((value, i) => Math.abs(value - left[i]) < 1e-10));
}

export default { title: 'Which end gets the eye?', beats, draw, check };
