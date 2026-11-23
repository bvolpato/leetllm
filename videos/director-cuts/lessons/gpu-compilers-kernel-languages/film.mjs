import assert from 'node:assert/strict';

// Selected instructions from the lesson's captured sm_120 build. The address
// operands are elided in the capture excerpt. The values replay one test lane.
const instructions = [
  { offset: '0110', op: 'LDG.E', operands: 'R4, […]', reg: 'R4', input: 'x' },
  { offset: '0120', op: 'LDG.E', operands: 'R7, […]', reg: 'R7', input: 'y' },
  { offset: '0140', op: 'FADD', operands: 'R9, R4, R7', reg: 'R9', inputs: ['R4', 'R7'] },
  { offset: '0150', op: 'STG.E', operands: '[…], R9', reg: 'R9' },
];

const beats = [
  {
    id: 'after-the-add',
    say: 'Watch this thread finish its add. The sum lands in register nine. Why does the output one row down still say “not a number”?',
    hold: 1.7,
  },
  {
    id: 'the-unbroken-word',
    say: 'See that unbroken row? Each raised bit is a one. The test set all thirty-two bits to one before launch. That gives us a floating-point NaN to mark an unwritten result.',
    hold: 0.9,
  },
  {
    id: 'two-inputs',
    say: 'Back up to the first load. That one line of CUDA became several machine instructions. At index one, a quarter comes from x into register four. The next load brings minus two from y into register seven.',
    hold: 1.1,
  },
  {
    id: 'where-the-sum-lives',
    say: 'Here’s the add again. Its last two names tell you which registers it reads. Watch where the sum appears. The first name is the destination. If we stopped here, what would the test find in output slot one?',
    hold: 2.3,
  },
  {
    id: 'one-store',
    say: 'Step one instruction forward. Keep your eye on the output. Its bits now match register nine. The store copied the sum into global memory. Now the test can read minus one and three quarters.',
    hold: 2.4,
  },
];

// Keep the original NaN payload intact by recording words as uint32 values.
const scratchWord = new DataView(new ArrayBuffer(4));
function encode(value) {
  scratchWord.setFloat32(0, value);
  return scratchWord.getUint32(0);
}
function decode(word) {
  scratchWord.setUint32(0, word);
  return scratchWord.getFloat32(0);
}
function replay(index) {
  const inputs = { x: 0.25 * index, y: (index % 7) - 3 };
  const registers = {};
  let out = 0xffffffff;
  const steps = [{ registers: {}, out }];
  for (const inst of instructions) {
    if (inst.op === 'LDG.E') registers[inst.reg] = encode(inputs[inst.input]);
    if (inst.op === 'FADD') {
      const [a, b] = inst.inputs.map((name) => decode(registers[name]));
      registers[inst.reg] = encode(a + b);
    }
    if (inst.op === 'STG.E') out = registers[inst.reg];
    steps.push({ registers: { ...registers }, out });
  }
  return steps;
}
const trace = replay(1);
const bitAt = (word, i) => (word >>> (31 - i)) & 1;
function check() {
  const [start, first, second, add, store] = trace;
  assert(Number.isNaN(decode(start.out)));
  assert.equal(first.registers.R4, 0x3e800000);
  assert.equal(second.registers.R7, 0xc0000000);
  assert.equal(add.registers.R9, 0xbfe00000);
  assert.equal(decode(add.registers.R9), -1.75);
  assert.deepEqual(trace.slice(0, 4).map((s) => s.out), Array(4).fill(0xffffffff));
  assert.equal(store.out, add.registers.R9);
  assert.deepEqual(store.registers, add.registers);
  assert.equal(Array.from({ length: 32 }, (_, i) => bitAt(store.out, i)).join(''),
    '10111111111000000000000000000000');
  assert.equal(decode(replay(2).at(-1).out), -0.5);
}

const clamp = (x) => Math.max(0, Math.min(1, x));
function smooth(x) {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, t) => a + (b - a) * t;
const paper = '#f6f1e7';
const ink = '#242338';
const violet = '#3a36a4';
const light = '#f6f0ff';

function type(ctx, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const xy of points.slice(1)) ctx.lineTo(...xy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function rule(ctx, x, y, xx, yy, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(xx, yy);
  ctx.stroke();
}

// The two bands are permanent address spaces. Within them, a word is drawn
// MSB first as four groups of eight contacts. A high bit has a raised top.
const firstBit = 392;
const bitX = (i) => firstBit + i * 31 + Math.floor(i / 8) * 16;
const endBits = bitX(31) + 26;
function substrate(ctx) {
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1920, 1080);
  const die = ctx.createLinearGradient(0, 180, 1710, 870);
  die.addColorStop(0, '#272374');
  die.addColorStop(0.58, violet);
  die.addColorStop(1, '#6251ad');
  ctx.fillStyle = die;
  ctx.fillRect(0, 194, 1920, 461);

  // Quiet etched fan-out at the edge of the register plane.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 194, 1920, 461);
  ctx.clip();
  for (let i = 0; i < 35; i++) {
    const x = 1490 + 15 * i;
    ctx.beginPath();
    ctx.moveTo(x, 194);
    ctx.lineTo(x, 215 + 2 * i);
    ctx.lineTo(x + 265, 480 + 2 * i);
    ctx.lineTo(x + 265, 655);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(203,190,255,0.10)';
    ctx.stroke();
  }
  ctx.restore();
  const edge = ctx.createLinearGradient(0, 654, 0, 679);
  edge.addColorStop(0, '#9290e1');
  edge.addColorStop(0.18, '#514992');
  edge.addColorStop(0.92, '#302e68');
  edge.addColorStop(1, '#181744');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 655, 1920, 22);
  const shadow = ctx.createLinearGradient(0, 677, 0, 715);
  shadow.addColorStop(0, 'rgba(45,34,74,0.20)');
  shadow.addColorStop(1, 'rgba(45,34,74,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 677, 1920, 38);
}

function header(ctx, instruction, operandsFocus) {
  type(ctx, 'CUDA source', 85, 67, 36, '#625a6b');
  const source = 'out[i] = x[i] + y[i];';
  type(ctx, source, 85, 145, 53, ink, 'Mono');
  const term = { FADD: '+', 'STG.E': 'out[i]', 'LDG.E': instruction.input + '[i]' }[instruction.op];
  const sourceX = 85 + ctx.measureText(source.slice(0, source.indexOf(term))).width;
  rule(ctx, sourceX, 159, sourceX + ctx.measureText(term).width, 159, '#5846bc', 6);
  rule(ctx, 880, 39, 880, 159, '#c4bcc8');
  type(ctx, `sm_120   /   native excerpt   /   0x${instruction.offset}`, 943, 67, 31, '#686173', 'Mono');
  type(ctx, instruction.op, 943, 145, 57, '#4334a4', 'Mono');
  const width = ctx.measureText(instruction.op + ' ').width;
  const x = 943 + width;
  type(ctx, instruction.operands, x, 145, 57, ink, 'Mono');
  if (operandsFocus) {
    const start = x + ctx.measureText(instruction.operands.slice(0, instruction.operands.indexOf(operandsFocus))).width;
    rule(ctx, start, 159, start + ctx.measureText(operandsFocus).width, 159, '#5846bc', 6);
  }
}

function contacts(ctx, word, y, height, dark, intensity = 1) {
  const base = dark ? '#29245e' : '#a6a1b2';
  const low = dark ? '#766bb1' : '#a9a0b1';
  for (let i = 0; i < 32; i++) {
    const x = bitX(i);
    const w = 24;
    const dx = 7;
    const dy = 7;
    const high = bitAt(word, i);
    const h = high ? height : 4;
    const top = high ? '#ffe8aa' : low;
    const face = high ? '#ee926e' : base;
    const side = high ? '#b25b67' : base;
    polygon(ctx, [[x+2, y+5], [x+w+2,y+5], [x+w+14,y-5], [x+14,y-5]], dark ? '#292466' : '#c5bec5');
    polygon(ctx, [[x,y-h],[x+w,y-h],[x+w,y],[x,y]], face);
    polygon(ctx, [[x+w,y-h],[x+w+dx,y-h-dy],[x+w+dx,y-dy],[x+w,y]], side);
    polygon(ctx, [[x,y-h],[x+dx,y-h-dy],[x+w+dx,y-h-dy],[x+w,y-h]], top);
    if (high) {
      rule(ctx, x, y-h, x+w, y-h, '#fff5d7', 2);
      if (intensity < 1) {
        ctx.fillStyle = `rgba(255,243,220,${(1-intensity)*0.54})`;
        ctx.fillRect(x, y-h, w, h);
      }
    }
  }
}

function wordRow(ctx, { name, word, y, height, dark, emphasis = 1, flash = 1 }) {
  const fg = dark ? light : ink;
  const faint = dark ? '#a79cd6' : '#928796';
  ctx.save();
  ctx.globalAlpha *= emphasis;
  type(ctx, name, 85, y-2, name === 'out[1]' ? 64 : 69, fg, 'Mono');
  // A pair of open corners distinguishes an untraced value from a zero word.
  const l = firstBit-16;
  const r = endBits+18;
  for (const [left, dir] of [[l,1],[r,-1]]) {
    rule(ctx, left, y+12, left+dir*19, y+12, faint);
    rule(ctx, left, y+12, left, y-3, faint);
  }
  if (word !== undefined) {
    contacts(ctx, word, y, height, dark, flash);
    const value = String(decode(word)).replace('-', '−');
    type(ctx, value, 1836, y-1, 84, fg, 'Serif', 'right');
  }
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  let wide = 0;
  let step = 3;
  let instruction = 2;
  let transfer = 0;
  let regFlash = 1;
  let outputFocus = 0;
  let operandsFocus;

  if (index === 0) {
    regFlash = smooth(elapsed / 1.4);
    step = regFlash > 0 ? 3 : 2;
    operandsFocus = 'R9';
  } else if (index === 1) {
    outputFocus = smooth(reveal('See that unbroken row', 1.4));
  } else if (index === 2) {
    wide = smooth(reveal('Back up', 0.95));
    outputFocus = 1 - wide;
    const loadX = smooth(reveal('At index one', 0.85));
    const loadY = smooth(reveal('The next load', 0.85));
    step = wide < 0.35 ? 3 : loadY > 0 ? 2 : loadX > 0 ? 1 : 0;
    instruction = wide < 0.35 ? 2 : loadY > 0 ? 1 : 0;
    regFlash = loadY > 0 ? loadY : loadX;
  } else if (index === 3) {
    wide = 1;
    regFlash = smooth(reveal('Watch where the sum', 0.85));
    step = regFlash > 0 ? 3 : 2;
    instruction = 2;
    operandsFocus = regFlash > 0 ? 'R9' : 'R4, R7';
  } else {
    wide = 1 - smooth(reveal('Step one instruction', 1.1));
    transfer = smooth(reveal('instruction forward', 1.25));
    step = transfer >= 1 ? 4 : 3;
    instruction = 3;
  }

  substrate(ctx);
  header(ctx, instructions[instruction], operandsFocus);
  type(ctx, 'Thread 1  /  registers', 85, 263, 40, '#e5dfff');
  type(ctx, '32-bit float', 1835, 263, 38, '#e5dfff', 'Sans', 'right');
  const { registers, out } = trace[step];
  const sumY = mix(482, 605, wide);
  const bitHeight = mix(91, 46, wide);
  const sourceRow = (name, y) => {
    ctx.save();
    ctx.globalAlpha = wide;
    const active = name === 'R4' ? step === 1 : step === 2;
    wordRow(ctx, { name, word: registers[name], y: y - 32*(1-wide),
      height: 46, dark: true, emphasis: step >= 3 ? 0.57 : 1, flash: active ? regFlash : 1 });
    ctx.restore();
  };
  if (wide > 0) {
    sourceRow('R4', 369);
    sourceRow('R7', 487);
  }
  const rise = index === 0 || index === 3 ? regFlash : 1;
  wordRow(ctx, { name: 'R9', word: registers.R9, y: sumY,
    height: mix(5, bitHeight, rise), dark: true, emphasis: 1 - 0.46*outputFocus,
    flash: rise });
  type(ctx, 'Global memory', 85, 745, 40, '#675d70');
  const outY = 887;
  wordRow(ctx, { name: 'out[1]', word: out, y: outY, height: 82, dark: false });
  if (outputFocus > 0) {
    for (let b = 0; b < 4; b++) {
      const lo = bitX(8*b);
      const hi = bitX(8*b+7)+26;
      ctx.save();
      ctx.globalAlpha = smooth(4*outputFocus - b);
      rule(ctx, lo, outY+20, hi, outY+20, '#afa2a7', 2);
      const byte = (out >>> ((3-b)*8)) & 255;
      type(ctx, byte.toString(16).toUpperCase().padStart(2,'0'), (lo+hi)/2, outY+61, 37, ink, 'Mono', 'center');
      ctx.restore();
    }
  }
  if (transfer > 0 && transfer < 1) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, transfer*10, (1-transfer)*12);
    contacts(ctx, registers.R9, mix(sumY, outY, transfer), mix(bitHeight, 82, transfer), true);
    ctx.restore();
  }
}

export default { title: 'Where the sum lives before the store', beats, draw, check };
