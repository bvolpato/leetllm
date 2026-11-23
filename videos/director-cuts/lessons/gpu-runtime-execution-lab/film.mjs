import assert from 'node:assert/strict';
import { pipeline } from '../../../films/gpu-runtime-execution-lab/arithmetic.mjs';

const beats = [
  {
    id: 'rebind',
    say: 'There goes x. That Python name now points to four zeros. The old numbers are still in A. Which row will the GPU read on the next replay?',
    hold: 1.3,
  },
  {
    id: 'read-address',
    say: 'Watch the flash. It crosses A. The violet pin marks the input address our CUDA graph saved during capture. We kept that allocation alive when we moved x.',
    hold: 0.6,
  },
  {
    id: 'old-sum',
    say: 'Follow the first value. Double it and add one to get three. Square that and you get nine. Add the other three squares and there’s our hundred and sixty-four again.',
    hold: 0.9,
  },
  {
    id: 'copy',
    say: 'Let’s put the zeros where the pin is. In Python we kept A under the name static input. Copy the four values from x into A. The lit bits go dark.',
    hold: 0.8,
  },
  {
    id: 'replay',
    say: 'Run the graph on the same stream. That puts the copy before the read. Double each zero, add one, and square it. Four ones. This time the graph read the zeros in A.',
    hold: 2.6,
  },
];

const original = [1, 2, 3, 4];
const replacement = [0, 0, 0, 0];

// x names a tensor in Python. The captured argument independently retains A's address.
function memory(rebound, copied) {
  const allocations = { A: [...original], B: [...replacement] };
  const binding = rebound ? 'B' : 'A';
  const captured = 'A';
  if (copied) allocations[captured].splice(0, 4, ...allocations[binding]);
  return { allocations, binding, captured, read: pipeline(allocations[captured]) };
}

function bits(value) {
  const word = new DataView(new ArrayBuffer(4));
  word.setFloat32(0, value);
  return word.getUint32(0).toString(2).padStart(32, '0');
}

function check() {
  const before = memory(false, false);
  const rebound = memory(true, false);
  const fresh = memory(true, true);
  assert.equal(before.binding, before.captured);
  assert.notEqual(rebound.binding, rebound.captured);
  assert.deepEqual(rebound.read.squares, [9, 25, 49, 81]);
  assert.equal(rebound.read.result, 164);
  assert.equal(pipeline(rebound.allocations[rebound.binding]).result, 4);
  assert.equal(rebound.captured, fresh.captured);
  assert.deepEqual(fresh.read.squares, [1, 1, 1, 1]);
  assert.equal(fresh.read.result, 4);
  assert.equal(bits(original[0]), '00111111100000000000000000000000');
  assert.equal(bits(replacement[0]), '0'.repeat(32));
}

const ink = '#282237';
const purple = '#582caf';
const orange = '#bb4325';
const pale = '#fcf5ed';
const center = (i) => 464 + i * 222;
const upper = 326;
const lower = 660;
const cellW = 222;
const cellH = 160;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function text(ctx, value, x, y, size, color = ink, family = 'Sans', align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}

function path(ctx, points, color, width = 0) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  if (width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  } else {
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function wash(ctx, x, y, x2, y2, stops) {
  const gradient = ctx.createLinearGradient(x, y, x2, y2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

// Scribe lines and contact arrays at the perimeter of the magnified memory field.
function substrate(ctx) {
  rect(
    ctx,
    0,
    0,
    1920,
    1080,
    wash(ctx, 0, 0, 1580, 1080, [
      [0, '#f9ecde'],
      [0.38, '#eee6ef'],
      [0.75, '#dad9ed'],
      [1, '#b6c5dd'],
    ]),
  );
  ctx.save();
  ctx.globalAlpha = 0.46;
  for (let i = 0; i < 32; i++) {
    const y = 850 + i * 8;
    path(
      ctx,
      [
        [0, y],
        [215, y],
        [325 + i * 2, y + 110 + i * 2],
        [1070 - i * 3, y + 110 + i * 2],
        [1300 + i * 2, y + 340 + i * 7],
      ],
      '#a6a0bb',
      1.6,
    );
  }
  for (let i = 0; i < 26; i++) {
    const x = 1225 + i * 10;
    path(
      ctx,
      [
        [x, 0],
        [x, 53 + i],
        [x + 130, 183 + i],
        [1920, 183 + i],
      ],
      '#b4a5b8',
      1.8,
    );
  }
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 60; col++) {
      rect(ctx, 122 + col * 17, 950 + row * 18, 7, 8, '#b8adc6');
    }
  }
  ctx.restore();
}

function bank(ctx, name, values, y, flash) {
  const left = center(0) - cellW / 2;
  const right = left + 4 * cellW;
  ctx.save();
  ctx.shadowColor = '#54476c52';
  ctx.shadowBlur = 21;
  ctx.shadowOffsetY = 15;
  rect(ctx, left - 3, y + 5, right - left + 3, cellH, '#857b96');
  ctx.restore();
  path(
    ctx,
    [
      [left, y + cellH],
      [right, y + cellH],
      [right + 13, y + cellH - 11],
      [right + 13, y + cellH + 3],
      [right, y + cellH + 16],
      [left, y + cellH + 16],
    ],
    '#7e7495',
  );
  for (const [i, value] of values.entries()) {
    const x = left + i * cellW;
    const shine = clamp(1 - Math.abs(flash - (i + 0.5) / 4) * 2.6);
    path(
      ctx,
      [
        [x, y],
        [x + 12, y - 12],
        [x + cellW + 12, y - 12],
        [x + cellW, y],
      ],
      '#fcf9f0',
    );
    rect(
      ctx,
      x,
      y,
      cellW - 2,
      cellH,
      wash(ctx, x, y, x + 185, y + 175, [
        [0, '#fcf7ea'],
        [0.42, '#ece4f0'],
        [0.78, '#dfdbec'],
        [1, '#cccbe1'],
      ]),
    );
    rect(ctx, x + 1, y + 1, cellW - 3, 4, '#fffaf2');
    rect(ctx, x + 1, y + cellH - 5, cellW - 3, 5, '#c2b4d2');
    if (shine > 0) {
      ctx.save();
      ctx.globalAlpha = 0.22 * shine;
      rect(ctx, x, y, cellW - 2, cellH, '#a78df2');
      ctx.restore();
    }
    text(ctx, value, x + 53, y + 80, 89, '#39265c', 'Mono', 'center');
    const pattern = bits(value);
    const inset = x + 99;
    rect(ctx, inset - 4, y + 44, 111, 71, '#f9f3ec');
    rect(ctx, inset - 4, y + 42, 111, 71, '#514761');
    rect(ctx, inset - 2, y + 45, 107, 66, '#3a314d');
    for (let j = 0; j < 32; j++) {
      const bx = inset + 2 + (j % 8) * 13;
      const by = y + 49 + Math.floor(j / 8) * 15;
      const set = pattern[j] === '1';
      rect(ctx, bx, by, 10, 12, set ? '#e8b86c' : '#4c415b');
      rect(ctx, bx, by + 1, 9, 9, set ? '#fff1b0' : '#50465f');
    }
  }
  text(ctx, name, left - 50, y + 80, 60, ink, 'Mono', 'center');
}

// The orange name can move. The landing point of the violet arrow is fixed.
function pointers(ctx, bindingProgress, read) {
  const y = mix(upper, lower, bindingProgress) + 80;
  path(
    ctx,
    [
      [102, y - 36],
      [188, y - 36],
      [225, y],
      [188, y + 36],
      [102, y + 36],
    ],
    orange,
  );
  text(ctx, 'x', 154, y - 2, 55, '#fff7e9', 'Mono', 'center');
  const landing = center(0) - cellW / 2 + 13;
  path(
    ctx,
    [
      [landing, upper - 20],
      [landing, 256],
      [landing + 24, 232],
      [landing + 69, 232],
    ],
    purple,
    7,
  );
  path(
    ctx,
    [
      [landing - 12, upper - 33],
      [landing + 12, upper - 33],
      [landing, upper - 12],
    ],
    purple,
  );
  text(ctx, 'Captured input', landing + 89, 230, 40, purple, 'Sans', 'left', 600);
  if (read > 0 && read < 1) {
    const x = mix(landing, center(3) + cellW / 2 + 10, smooth(read));
    rect(ctx, x - 3, upper - 11, 6, cellH + 18, '#653ab5');
  }
}

function resultDie(ctx, number, active) {
  const x = 1396,
    y = 342,
    h = 356;
  const die = [
    [x, y + 33],
    [x + 33, y],
    [1940, y],
    [1940, y + h],
    [x, y + h],
  ];
  ctx.save();
  ctx.shadowColor = '#473a6655';
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 18;
  path(ctx, die, '#302640');
  ctx.restore();
  path(
    ctx,
    die,
    wash(ctx, x, y, 1900, y + h, [
      [0, '#44355b'],
      [0.62, '#322844'],
      [1, '#292137'],
    ]),
  );
  for (let i = 0; i < 12; i++) {
    rect(ctx, 1920 - 12 * i, y + 10, 5, 10, '#877594');
    rect(ctx, x + 24 + i * 15, y + h - 13, 8, 5, '#726583');
  }
  text(ctx, 'Last replay', x + 46, y + 70, 45, '#fcf6ec', 'Sans', 'left', 600);
  text(ctx, 'Σ (2v + 1)²', x + 48, y + 126, 36, '#ded3ea', 'Mono');
  text(ctx, number, x + 48, y + 242, 139, active ? '#ffe0a7' : '#f3e7ce', 'Mono');
}

function contributions(ctx, values, show, affine, square, all) {
  if (!show) return;
  ctx.save();
  ctx.globalAlpha = show;
  const terms = pipeline(values);
  const y = upper + cellH + 82;
  for (let i = 0; i < 4; i++) {
    const opacity = i === 0 ? affine : all;
    if (!opacity) continue;
    const x = center(i);
    ctx.save();
    ctx.globalAlpha *= opacity;
    path(
      ctx,
      [
        [x, upper + cellH + 18],
        [x, y - 31],
      ],
      '#837494',
      2.5,
    );
    const value = i === 0 && square < 0.5 ? terms.affine[i] : terms.squares[i];
    text(ctx, value, x, y, 61, purple, 'Mono', 'center');
    if (i) text(ctx, '+', x - cellW / 2, y, 44, purple, 'Mono', 'center');
    ctx.restore();
  }
  if (all > 0) {
    ctx.globalAlpha *= all;
    text(ctx, '=', 1316, y, 60, purple, 'Mono', 'center');
  }
  ctx.restore();
}

function copyWords(ctx, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 9, (1 - p) * 9);
  const from = lower - 8,
    to = upper + cellH + 15;
  const y = mix(from, to, smooth(p));
  for (let i = 0; i < 4; i++) {
    const x = center(i);
    path(
      ctx,
      [
        [x, from],
        [x, to + 5],
      ],
      '#8e6cac',
      3,
    );
    path(
      ctx,
      [
        [x - 26, y + 24],
        [x - 26, y - 9],
        [x, y - 30],
        [x + 26, y - 9],
        [x + 26, y + 24],
      ],
      purple,
    );
    text(ctx, '0', x, y + 2, 32, pale, 'Mono', 'center');
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const rebound = index === 0 ? smooth(elapsed / 2.1) : 1;
  const reading =
    index === 1 ? reveal('Watch the flash', 1.6) : index === 4 ? reveal('Run the graph', 1.6) : 0;
  const copy = index === 3 ? reveal('Copy the four values', 1.8) : index === 4 ? 1 : 0;
  const copied = copy >= 0.98;
  const state = memory(rebound >= 0.5, copied);
  const first = index === 2,
    last = index === 4;
  const affine = first ? reveal('Double it', 0.45) : last ? reveal('add one', 0.4) : 1;
  const square = first ? reveal('Square that', 0.5) : last ? reveal('add one', 0.4) : 1;
  const all = first ? reveal('Add the other three', 0.5) : last ? reveal('and square it', 0.55) : 1;
  const show = first || last ? 1 : index === 3 ? 1 - smooth(elapsed / 0.6) : 0;
  const freshResult = last && all >= 0.97;
  const total = freshResult ? state.read.result : pipeline(original).result;
  const code =
    index === 0
      ? 'x = torch.zeros_like(x)'
      : index === 3
        ? 'static_input.copy_(x)'
        : 'graph.replay()';
  const focus = (last && all >= 0.97) || (first && all >= 0.97);

  substrate(ctx);
  text(ctx, 'Python', 98, 84, 36, '#60566a');
  text(ctx, code, 96, 147, 60, index === 0 ? orange : ink, 'Mono');
  resultDie(ctx, total, focus);
  bank(
    ctx,
    'A',
    state.allocations.A,
    upper,
    reading > 0 && reading < 1 ? mix(-0.4, 1.4, reading) : -2,
  );
  if (index >= 3) {
    ctx.save();
    ctx.globalAlpha = index === 3 ? reveal('we kept A', 0.5) : 1;
    text(ctx, 'static_input', center(3) + cellW / 2, upper - 40, 33, purple, 'Mono', 'right');
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = index === 0 ? 0.15 + 0.85 * smooth(elapsed / 0.65) : 1;
  bank(ctx, 'B', state.allocations.B, lower, -2);
  ctx.restore();
  pointers(ctx, rebound, reading);
  contributions(ctx, state.allocations.A, show, affine, square, all);
  copyWords(ctx, copy);
}

export default { title: 'Which input does a CUDA graph replay?', beats, draw, check };
