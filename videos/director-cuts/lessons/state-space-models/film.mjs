import assert from 'node:assert/strict';

// Each character is one input coordinate. Brightness increases from water (1)
// through fins (2) to scales (3). The other take mirrors this same sprite.
const sprite = [
  '............................',
  '............+++.............',
  '.........++++#+.............',
  '.......####+####+...........',
  '.....#####++######+....++...',
  '....##..##+####+####+.++#...',
  '...###..##+##++######++##...',
  '..########+#++#######+++#...',
  '...+########+######+..++#...',
  '.....++#####+####+.....++...',
  '.......+++++##++............',
  '..........++#+..............',
  '..........++................',
  '............................',
];
const rows = sprite.length;
const columns = sprite[0].length;
const probe = 4 * columns + 6;
const levels = { '.': 1, '+': 2, '#': 3 };
const first = [sprite, sprite.map(line => [...line].reverse().join(''))]
  .map(bitmap => bitmap.flatMap(line => [...line].map(char => levels[char])));
const zero = Array(rows * columns).fill(0);
const average = (old, input) => (old + input) / 2;
const step = (state, frame) => state.map((old, i) => average(old, frame[i]));

// A compensating exposure at each site: a bright scale receives 1, a fin 1.5,
// and open water 2. The state update below never consults the original sprite.
const exposure = new Map([[3, 1], [2, 1.5], [1, 2]]);
const second = first.map(frame => frame.map(x => exposure.get(x)));
const bubbles = [
  [15, 8, 3.9], [8.25, 3.75, 1.8], [21.75, 2.5, 1.05],
];
const common = zero.map((_, i) => {
  const x = i % columns, y = Math.floor(i / columns);
  let value = 0;
  for (const [cx, cy, radius] of bubbles) {
    const distance = Math.hypot(x - cx, y - cy);
    if (Math.abs(distance - radius) < 0.57) value = Math.max(value, y > cy ? 2 : 3);
    if (x < cx && y < cy && distance < radius - 0.6 && distance > radius - 2) value = 4;
  }
  return value;
});
const takes = first.map((frame, run) => {
  const frames = [frame, second[run], common];
  const states = [zero];
  for (const input of frames) states.push(step(states.at(-1), input));
  return { frames, states };
});
const differences = (a, b) => a.reduce((count, x, i) => count + Number(x !== b[i]), 0);
const finalDifference = differences(takes[0].states[3], takes[1].states[3]);

const beats = [
  { id: 'two-fish', say: 'Which fish faces left? Remember your answer. Let’s see what survives when these frames pass through a small state-space model.', hold: 0.65 },
  { id: 'first-write', say: 'The model keeps one number per pixel. They all start at zero. As the frame arrives, the model averages each stored number with its incoming pixel and writes the answer back in place.', hold: 0.65 },
  { id: 'one-pixel', say: 'Look at the marked square. In A it caught a bright scale, worth three. In B it caught water, worth one. Starting from zero leaves one and a half in A, and just half in B.', hold: 0.7 },
  { id: 'next-exposure', say: 'Here comes the second frame. The bright scale gets a darker exposure, one. The patch of water gets a lighter exposure, two. Look at what’s already stored in those squares. What happens when we average again?', hold: 1.6 },
  { id: 'equal-state', say: 'Watch the pixels as the frame lands. Both marked squares reach one and a quarter. Every fin and every patch of water lands on that value too. The direction is gone.', hold: 1.25 },
  { id: 'bubbles', say: 'Send the same bubbles through both runs. Each pixel starts from the same value on both sides and gets the same input. Even the little glint on each bubble comes out the same.', hold: 0.75 },
  { id: 'lookup', say: 'Up top, the first frames still tell you which fish faced left. A readout gets only the stored pixels below. Whichever direction it chooses, it gives the same answer for both fish.', hold: 2.6 },
];

const ink = '#28253b';
const secondary = '#5c5266';
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => x * x * (3 - 2 * x);
const mix = (a, b, t) => a + (b - a) * t;
const cell = 28;
const bitmapWidth = columns * cell, bitmapHeight = rows * cell;
const positions = [120, 1016];
const top = 295;

// One shared transfer function makes equal numeric values the same color in
// an input thumbnail and a memory image. The pixel grid stays registered.
const palette = [
  [0, [23, 24, 68]], [0.5, [40, 57, 119]], [1, [66, 92, 164]],
  [1.25, [126, 140, 201]], [1.5, [192, 182, 224]], [2, [249, 165, 144]],
  [3, [255, 225, 164]], [4, [255, 250, 220]],
];
function pixelColor(value) {
  const next = palette.findIndex(([v]) => v >= value);
  if (next <= 0) return 'rgb(' + palette[next === 0 ? 0 : palette.length - 1][1].join(',') + ')';
  const [a, lo] = palette[next - 1], [b, hi] = palette[next];
  return 'rgb(' + lo.map((n, i) => Math.round(mix(n, hi[i], (value - a) / (b - a)))).join(',') + ')';
}
const colors = new Map();
for (const run of takes) {
  for (const image of [...run.frames, ...run.states]) {
    for (const value of new Set(image)) colors.set(value, pixelColor(value));
  }
}

function type(ctx, str, x, y, size, family = 'Sans', color = ink, weight = 400, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}
function chamfer(ctx, x, y, w, h, corner, paint) {
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + w - corner, y);
  ctx.lineTo(x + w, y + corner);
  ctx.lineTo(x + w, y + h - corner);
  ctx.lineTo(x + w - corner, y + h);
  ctx.lineTo(x + corner, y + h);
  ctx.lineTo(x, y + h - corner);
  ctx.lineTo(x, y + corner);
  ctx.closePath();
  ctx.fillStyle = paint;
  ctx.fill();
}
function bitmap(ctx, image, x, y, pitch, large = false) {
  // Paint equal-value runs together so tiny previews have no antialias seams.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns;) {
      const index = row * columns + col, value = image[index];
      let end = col + 1;
      while (end < columns && image[row * columns + end] === value) end++;
      ctx.fillStyle = colors.get(value);
      ctx.fillRect(x + col * pitch, y + row * pitch, (end - col) * pitch + 0.25, pitch + 0.25);
      col = end;
    }
  }
  if (large) {
    ctx.beginPath();
    for (let col = 1; col < columns; col++) {
      ctx.moveTo(x + col * pitch, y); ctx.lineTo(x + col * pitch, y + rows * pitch);
    }
    for (let row = 1; row < rows; row++) {
      ctx.moveTo(x, y + row * pitch); ctx.lineTo(x + columns * pitch, y + row * pitch);
    }
    ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(27,27,70,.18)'; ctx.stroke();
  }
}
function screen(ctx, x, before, after, write) {
  chamfer(ctx, x - 13, top - 13, bitmapWidth + 26, bitmapHeight + 30, 11, '#b8aabb');
  chamfer(ctx, x - 10, top - 11, bitmapWidth + 20, bitmapHeight + 21, 9, '#37374e');
  bitmap(ctx, before, x, top, cell, true);
  if (write <= 0) return;
  const cut = Math.min(columns, Math.floor(write * (columns + 1)));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, top, cut * cell, bitmapHeight); ctx.clip();
  bitmap(ctx, after, x, top, cell, true);
  ctx.restore();
  if (cut > 0 && cut < columns) {
    ctx.fillStyle = 'rgba(255,247,205,.68)';
    ctx.fillRect(x + cut * cell - 3, top, 3, bitmapHeight);
  }
}
function mark(ctx, x, alpha) {
  if (alpha <= 0) return;
  const cx = x + (probe % columns + 0.5) * cell;
  const cy = top + (Math.floor(probe / columns) + 0.5) * cell;
  ctx.save(); ctx.globalAlpha = alpha;
  for (const [color, width] of [['#252441', 11], ['#fff8dc', 6]]) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      ctx.moveTo(cx + 6 * sx, cy + 21 * sy);
      ctx.lineTo(cx + 21 * sx, cy + 21 * sy);
      ctx.lineTo(cx + 21 * sx, cy + 6 * sy);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function inputThumb(ctx, image, x, title, opacity = 1) {
  ctx.save(); ctx.globalAlpha = opacity;
  const pitch = 7.5, w = pitch * columns, h = pitch * rows;
  const left = x + bitmapWidth - w, y = top - 55 - h;
  type(ctx, title, left + w / 2, y - 17, 40, 'Sans', secondary, 500, 'center');
  ctx.fillStyle = '#51495e'; ctx.fillRect(left - 3, y - 3, w + 6, h + 6);
  bitmap(ctx, image, left, y, pitch);
  ctx.restore();
}
function computation(ctx, x, state, input, result, answered) {
  const value = answered ? String(result) : '?';
  type(ctx, 'Marked pixel', x, 777, 40, 'Sans', secondary);
  type(ctx, `(${state} + ${input}) ÷ 2 = ${value}`, x, 862, 62, 'Mono');
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const surface = ctx.createLinearGradient(0, 0, 760, 1080);
  surface.addColorStop(0, '#fff6e9'); surface.addColorStop(0.66, '#f3e4e4'); surface.addColorStop(1, '#ddd4e5');
  ctx.fillStyle = surface; ctx.fillRect(0, 0, 1920, 1080);

  // The first exposures pull back to the two thumbnail slots. The larger
  // apertures then show the only arrays the recurrent computation carries.
  const nest = index === 1 ? ease(clamp(elapsed / 0.85)) : Number(index > 1);
  const firstWrite = index === 1 ? ease(reveal('As the frame arrives', 1.5)) : 1;
  const secondWrite = index === 4 ? ease(clamp(elapsed / 1.9)) : Number(index > 4);
  const bubbleWrite = index === 5 ? ease(reveal('through both runs', 1.45)) : Number(index > 5);
  const point = index === 2 ? ease(clamp(elapsed / 0.6)) : Number(index === 3 || index === 4);
  const returnToFirst = index === 6 ? ease(clamp(elapsed / 0.65)) : 0;

  for (const [i, { frames, states }] of takes.entries()) {
    const x = positions[i], name = i === 0 ? 'A' : 'B';
    type(ctx, (index === 0 ? 'Input ' : 'Memory ') + name, x - 2, 201, 77, 'Serif');
    if (index === 0) {
      // The chime cuts into an exposure already writing its first columns.
      const write = ease(clamp(0.46 + elapsed / 1.15));
      screen(ctx, x, zero, frames[0], write);
    } else {
      const stepIndex = index <= 3 ? 1 : index === 4 ? 2 : 3;
      const written = stepIndex === 1 ? firstWrite : stepIndex === 2 ? secondWrite : bubbleWrite;
      screen(ctx, x, states[stepIndex - 1], states[stepIndex], written);
      const inputIndex = index < 3 ? 0 : index < 5 ? 1 : 2;
      if (index === 1 && nest < 1) {
        const pitch = mix(cell, 7.5, nest);
        bitmap(ctx, frames[0], mix(x, x + bitmapWidth - columns * 7.5, nest), mix(top, top - 55 - rows * 7.5, nest), pitch);
      } else {
        inputThumb(ctx, frames[inputIndex], x, `Input ${inputIndex + 1}`, 1 - returnToFirst);
        if (returnToFirst) inputThumb(ctx, frames[0], x, 'First input', returnToFirst);
      }
      mark(ctx, x, point);
    }
    if (index >= 2 && index <= 4) {
      const t = index === 2 ? 0 : 1;
      const reachedProbe = Math.floor(secondWrite * (columns + 1)) > probe % columns;
      computation(ctx, x, states[t][probe], frames[t][probe], states[t + 1][probe], t === 0 || reachedProbe);
    }
  }

  if (index === 0) {
    type(ctx, 'Which fish faces left?', 960, 840, 68, 'Serif', ink, 400, 'center');
  } else if (index === 1) {
    type(ctx, 'new state  =  (old state + input) ÷ 2', 960, 833, 52, 'Mono', ink, 400, 'center');
  } else if (index === 5 || index === 6) {
    type(ctx, `${finalDifference} pixels differ`, 960, 838, 68, 'Serif', ink, 400, 'center');
  }
}

function check() {
  assert(sprite.every(line => line.length === columns));
  assert.deepEqual(takes.map(t => t.frames[0][probe]), [3, 1]);
  assert.deepEqual(takes.map(t => t.states[1][probe]), [1.5, 0.5]);
  assert.deepEqual(takes.map(t => t.frames[1][probe]), [1, 2]);
  assert(differences(takes[0].states[1], takes[1].states[1]) > 0);
  for (const { states } of takes) assert(states[2].every(x => x === 1.25));
  assert(common.includes(0) && common.includes(4));
  assert(takes[0].states[3].includes(2.625));
  assert.deepEqual(takes[0].states[3], takes[1].states[3]);
  assert.equal(finalDifference, 0);
}

export default { title: 'Which fish faces left?', beats, draw, check };
