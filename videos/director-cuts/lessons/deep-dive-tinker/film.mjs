import assert from 'node:assert/strict';
import { CLAMP_CASES, SAMPLE_FIXTURE } from '../../../films/deep-dive-tinker/fixtures.mjs';

// A two-token decoder for the expression after "return". After the first token,
// each branch has a fixed continuation. The 64 cells probe the same distribution.
const prompt = 'Write clamp(x, lo, hi).';
const side = 8;
const picked = 5 * side + 3;
const midpoint = (i) => (i + 0.5) / (side * side);
const branches = {
  x: { tail: '', run: (x) => x },
  min: { tail: '(max(x, lo), hi)', run: (x, lo, hi) => Math.min(Math.max(x, lo), hi) },
};

function probabilityOfMin(weights) {
  return 1 / (1 + Math.exp(weights.x - weights.min));
}

// Unit input, two scalar weights, cross-entropy target "min", SGD step size 1.
function optimizerStep(weights) {
  const error = 1 - probabilityOfMin(weights);
  return { min: weights.min + error, x: weights.x - error };
}

const files = new Map();
function saveForSampler(path, weights) {
  const snapshot = Object.freeze({ path, weights: Object.freeze({ ...weights }) });
  files.set(path, snapshot);
  return snapshot;
}

function openClient(path) {
  const snapshot = files.get(path);
  assert.ok(snapshot, 'The sampling client needs a saved adapter path.');
  return (request, draw) => {
    assert.equal(request, prompt);
    const token = draw < probabilityOfMin(snapshot.weights) ? 'min' : 'x';
    const { x, lo, hi } = SAMPLE_FIXTURE;
    return {
      path: snapshot.path, token, prompt: request,
      code: 'return ' + token + branches[token].tail,
      value: branches[token].run(x, lo, hi),
    };
  };
}

const ask = (client) => client(prompt, midpoint(picked));
const first = saveForSampler('adapter-v1', { min: 0, x: 0 });
const oldClient = openClient(first.path);
const beforeStep = ask(oldClient);
const trained = optimizerStep(first.weights);
const afterStep = ask(oldClient);
const second = saveForSampler('adapter-v2', trained);
const samples = [beforeStep, afterStep, ask(openClient(second.path))];
const probe = (weights, i) => midpoint(i) < probabilityOfMin(weights) ? 'min' : 'x';

const beats = [
  {
    id: 'first-draw',
    say: 'Run the clamp prompt. Follow that square. Its x goes straight after return. Give the function three, with an upper limit of two. Three comes straight back.',
    hold: 0.85,
  },
  {
    id: 'hold-the-draw',
    say: 'In this little model, purple picks min and orange picks x. Each square shows what one draw would pick. Keep the prompt and the marked draw fixed so we can compare the weights.',
    hold: 0.65,
  },
  {
    id: 'step',
    say: 'Train on the bounded answer. Look where the purple reaches. One optimizer step raised the weight for min and lowered the weight for x. Our square changed on the trainer. Try the same client again.',
    hold: 1.05,
  },
  {
    id: 'read-the-path',
    say: 'X again. Where did that sample come from? Its path ends in version one. A Tinker sampling client reads the snapshot it opened. Those two weights are still zero.',
    hold: 0.65,
  },
  {
    id: 'save-and-open',
    say: 'Save the updated weights for sampling. There’s version two. The old client still has version one open. Now open the new snapshot in a fresh client. Ask it the same question.',
    hold: 0.85,
  },
  {
    id: 'bounded-return',
    say: 'This time the square picks min. In our example that branch completes the bounded expression. Try three again. The inner maximum keeps three. The outer minimum caps it at two. The path beside this sample tells you which weights produced it.',
    hold: 2.3,
  },
];

const ink = '#26223c';
const muted = '#57576d';
const violet = '#6243c3';
const orange = '#faad79';
const paper = '#faf9f5';
const range = (n) => Math.min(1, Math.max(0, n));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const fixture = SAMPLE_FIXTURE;
const testCall = 'clamp(' + [fixture.x, fixture.lo, fixture.hi].join(', ') + ')';

function label(ctx, str, x, y, size, { family = 'Sans', color = ink, weight = 400 } = {}) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function rule(ctx, x, y, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function backdrop(ctx) {
  const light = ctx.createLinearGradient(0, 1080, 1640, 0);
  light.addColorStop(0, '#e9e6f0');
  light.addColorStop(0.53, paper);
  light.addColorStop(1, '#edeefa');
  box(ctx, 0, 0, 1920, 1080, light);
  label(ctx, 'Tinker  /  Local two-token model', 97, 72, 32, { color: muted });
  label(ctx, 'Prompt', 96, 166, 40, { color: muted });
  rule(ctx, 267, 109, 267, 185, '#ada6c8', 4);
  label(ctx, prompt, 306, 168, 63, { family: 'Mono' });
  rule(ctx, 96, 224, 1824, 224, '#c7c4d0');
}

// Pixel lettering makes each field readable by shape as well as color.
const glyphs = {
  x: ['10001', '01010', '00100', '01010', '10001'],
  min: ['0000001000000', '1101000011010', '1010101010010', '1010101010010', '1010101010010'],
};

function pixelWord(ctx, token, cx, cy, unit) {
  const rows = glyphs[token];
  const x = cx - rows[0].length * unit / 2;
  const y = cy - rows.length * unit / 2;
  ctx.fillStyle = token === 'min' ? '#e5ddff' : '#69372e';
  for (const [r, row] of rows.entries()) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '1') ctx.fillRect(x + c * unit, y + r * unit, unit + 0.12, unit + 0.12);
    }
  }
}

function cellCenter(x, y, size) {
  const u = size / side;
  return { x: x + ((picked % side) + 0.5) * u, y: y + (Math.floor(picked / side) + 0.5) * u };
}

function field(ctx, weights, x, y, size, selection = 1, flash = 0) {
  const cell = size / side;
  ctx.save();
  ctx.shadowColor = '#32234a38';
  ctx.shadowBlur = size / 22;
  ctx.shadowOffsetY = size / 40;
  box(ctx, x - 4, y - 4, size + 8, size + 12, '#342f48');
  ctx.restore();
  box(ctx, x - 2, y + size + 2, size + 4, 4, '#b5abba');
  for (let i = 0; i < side * side; i++) {
    const left = x + (i % side) * cell;
    const top = y + Math.floor(i / side) * cell;
    const token = probe(weights, i);
    box(ctx, left, top, cell + 0.3, cell + 0.3, token === 'min' ? violet : orange);
    rule(ctx, left, top, left + cell, top, '#ffffff35', 1.6);
    rule(ctx, left, top, left, top + cell, '#ffffff35', 1.6);
    if (flash > 0 && token !== probe(first.weights, i)) {
      box(ctx, left, top, cell, cell, 'rgba(245,236,255,' + flash * 0.52 + ')');
    }
    pixelWord(ctx, token, left + cell / 2, top + cell / 2, cell * (token === 'min' ? 0.055 : 0.082));
  }
  if (selection <= 0) return;
  const point = cellCenter(x, y, size);
  const d = cell * 1.54;
  ctx.save();
  ctx.globalAlpha *= selection;
  const left = point.x - d / 2;
  const top = point.y - d / 2;
  const token = probe(weights, picked);
  box(ctx, left + 3, top + 5, d + 3, d + 3, '#30233d62');
  box(ctx, left - 3, top - 3, d + 6, d + 6, ink);
  box(ctx, left, top, d, d, '#fffef6');
  box(ctx, left + 4, top + 4, d - 8, d - 8, token === 'min' ? violet : orange);
  const unit = token === 'min' ? d * 0.059 : d * 0.093;
  pixelWord(ctx, token, point.x, point.y, unit);
  ctx.restore();
}

function weightsLabel(ctx, x, y, weights) {
  const signed = (n) => n > 0 ? '+' + n.toFixed(1) : n < 0 ? '−' + Math.abs(n).toFixed(1) : '0';
  label(ctx, 'Weights', x, y, 32, { color: muted });
  box(ctx, x, y + 20, 9, 33, violet);
  label(ctx, 'min ' + signed(weights.min), x + 19, y + 48, 36, { family: 'Mono' });
  box(ctx, x + 217, y + 20, 9, 33, orange);
  label(ctx, 'x ' + signed(weights.x), x + 236, y + 48, 36, { family: 'Mono' });
}

const trainView = { x: 100, y: 391, size: 342 };
const sampleView = { x: 626, y: 377, size: 400 };
const savedView = { x: 192, y: 430, size: 309 };
const out = 1176;
const mono = { family: 'Mono' };
const cue = (clock, index, phrase, span) =>
  clock.index === index ? clock.reveal(phrase, span) : Number(clock.index > index);

function role(ctx, name, path, x) {
  label(ctx, name, x, 294, 40, { weight: 600 });
  label(ctx, path, x, 344, 36, { family: 'Mono', color: muted });
}

function result(ctx, sample, number, read, tested, innerStage, outerStage, pathFocus) {
  const { x, lo, hi, expected } = fixture;
  label(ctx, 'Sample ' + number, out, 294, 40, { weight: 600 });
  const pathWidth = 243;
  if (pathFocus > 0) box(ctx, out - 6, 307, pathWidth * pathFocus, 48, '#f3cfb5');
  label(ctx, sample.path, out, 344, 36, { family: 'Mono', color: muted });
  const codeY = 460;
  label(ctx, 'return', out, codeY, 46, { ...mono, color: muted });
  if (read >= 1) {
    const tokenX = out + 198;
    box(ctx, tokenX - 8, codeY - 48, sample.token === 'x' ? 45 : 100, 61, sample.token === 'x' ? orange : violet);
    label(ctx, sample.token, tokenX, codeY, 46, { ...mono, color: sample.token === 'x' ? ink : '#fff' });
    if (sample.token === 'min') {
      label(ctx, '(', tokenX + 93, codeY, 46, mono);
      label(ctx, 'max(x, lo), hi)', out + 70, codeY + 62, 46, mono);
    }
  }

  rule(ctx, out, 556, out + 587, 556, '#c8c3cf');
  label(ctx, testCall, out, 629, 42, mono);
  if (tested <= 0 || read < 1) return;
  ctx.save();
  ctx.globalAlpha *= tested;
  const working = sample.token === 'min' && outerStage < 1;
  if (working) {
    if (innerStage > 0) {
      ctx.globalAlpha *= innerStage;
      label(ctx, 'max(' + x + ', ' + lo + ') = ' + Math.max(x, lo), out, 731, 45, mono);
    }
  } else {
    label(ctx, String(sample.value), out - 3, 786, 144, { family: 'Serif' });
    label(ctx, 'expected ' + expected, out + 123, 760, 36, { color: muted });
    if (sample.token === 'min') {
      label(ctx, 'min(' + Math.max(x, lo) + ', ' + hi + ')', out + 124, 705, 33, mono);
    }
  }
  ctx.restore();
}

function draw(ctx, clock) {
  backdrop(ctx);
  const wide = ease(cue(clock, 1, 'In this little model', 1.55));
  const lastClose = ease(cue(clock, 5, 'Try three again', 1.3));
  const close = 1 - wide + lastClose;
  const zoom = 1 + 0.25 * close;
  ctx.save();
  ctx.translate(-598 * close, 422 * (1 - zoom));
  ctx.scale(zoom, zoom);

  const step = cue(clock, 2, 'Train on the bounded answer', 0.65);
  const trainer = step > 0 ? second : first;
  const save = ease(cue(clock, 4, 'Save the updated weights', 1.25));
  const load = ease(cue(clock, 4, 'Now open the new snapshot', 1.5));
  const client = load >= 1 ? second : first;
  const oldTest = cue(clock, 0, 'Give the function three', 0.35);
  const replay = cue(clock, 2, 'Try the same client again', 1.2);
  const newDraw = cue(clock, 4, 'Ask it the same question', 1.2);
  const index = newDraw > 0 ? 2 : replay > 0 ? 1 : 0;
  const read = index === 2 ? newDraw : index === 1 ? replay : range((clock.seconds + 0.17) / 1.1);
  const sample = samples[index];
  if (wide > 0 && close < 1) {
    role(ctx, 'Trainer', step > 0 ? 'version 2' : 'version 1', trainView.x);
    field(ctx, trainer.weights, trainView.x, trainView.y, trainView.size, wide, step > 0 ? 1 - step : 0);
    weightsLabel(ctx, trainView.x, 835, trainer.weights);
  }
  role(ctx, load >= 1 ? 'Fresh sampling client' : 'Sampling client', client.path, sampleView.x);
  field(ctx, client.weights, sampleView.x, sampleView.y, sampleView.size);
  weightsLabel(ctx, sampleView.x, mix(835, 829, close), client.weights);

  // The saved field stays beside the trainer as a second copy travels to the new client.
  if (save > 0 && close < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - ease(range((close - 0.85) / 0.15));
    const x = mix(trainView.x, savedView.x, save);
    const y = mix(trainView.y, savedView.y, save);
    const size = mix(trainView.size, savedView.size, save);
    field(ctx, second.weights, x, y, size, 0);
    box(ctx, x - 4, y + size + 5, size + 8, 52, ink);
    label(ctx, 'Saved  /  v2', x + 14, y + size + 41, 31, { ...mono, color: paper });
    ctx.restore();
  }
  if (load > 0 && load < 1) {
    const x = mix(savedView.x, sampleView.x, load);
    const y = mix(savedView.y, sampleView.y, load) - Math.sin(Math.PI * load) * 42;
    const size = mix(savedView.size, sampleView.size, load);
    field(ctx, second.weights, x, y, size, 0);
  }

  const tested = index === 2 ? cue(clock, 5, 'Try three again', 0.45) : oldTest;
  result(ctx, sample, index + 1, read, tested,
    cue(clock, 5, 'The inner maximum', 0.4), cue(clock, 5, 'The outer minimum', 0.4),
    clock.index === 3 ? clock.reveal('Where did that sample come from', 0.4) : 0);

  if (read > 0 && read < 1) {
    const p = ease(read);
    const start = cellCenter(sampleView.x, sampleView.y, sampleView.size);
    const endX = out + (sample.token === 'x' ? 214 : 240);
    const cx = mix(start.x, endX, p);
    const cy = mix(start.y, 444, p) - 55 * Math.sin(Math.PI * p);
    const width = sample.token === 'x' ? 55 : 99;
    box(ctx, cx - width / 2 - 4, cy - 29, width + 8, 58, ink);
    box(ctx, cx - width / 2, cy - 25, width, 50, sample.token === 'min' ? violet : orange);
    pixelWord(ctx, sample.token, cx, cy, sample.token === 'min' ? 5.2 : 5.6);
  }
  ctx.restore();
}

function check() {
  assert.deepEqual(trained, { min: 0.5, x: -0.5 });
  assert.deepEqual(first.weights, { min: 0, x: 0 });
  assert.notStrictEqual(trained, second.weights);
  assert.equal(probabilityOfMin(first.weights), 0.5);
  assert.ok(Math.abs(probabilityOfMin(second.weights) - 0.73105858) < 1e-8);
  const coverage = (weights) => Array.from({ length: side ** 2 }, (_, i) => probe(weights, i))
    .filter((token) => token === 'min').length;
  assert.deepEqual([coverage(first.weights), coverage(second.weights)], [32, 47]);
  assert.deepEqual(samples.map((s) => s.prompt), [prompt, prompt, prompt]);
  assert.deepEqual(samples.map((s) => s.path), [first.path, first.path, second.path]);
  assert.deepEqual(samples.map((s) => s.token), ['x', 'x', 'min']);
  assert.deepEqual(samples.map((s) => s.value), [3, 3, fixture.expected]);
  assert.equal(ask(oldClient).code, 'return x');
  assert.equal(samples[2].code, 'return min(max(x, lo), hi)');
  for (const [x, lo, hi, expected] of CLAMP_CASES) assert.equal(branches.min.run(x, lo, hi), expected);
}

export default { title: 'Tinker: Which weights wrote this clamp?', beats, draw, check };
