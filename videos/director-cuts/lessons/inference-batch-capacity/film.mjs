import assert from 'node:assert/strict';

const rowsPerBlock = 16;
const prompt = 8;
const answerReserve = 8;
const waiting = { owner: 'D', prompt, answerReserve };
const requiredBlocks = Math.ceil((prompt + answerReserve) / rowsPerBlock);

// The three private blocks form the entire example pool. A row represents
// the cached keys and values at one position across the attention layers.
const initial = [
  { id: 0, owner: 'A', used: 10 },
  { id: 1, owner: 'B', used: 16 },
  { id: 2, owner: 'C', used: 4 },
];

function admit(pool, request) {
  const needed = Math.ceil((request.prompt + request.answerReserve) / rowsPerBlock);
  const free = pool.filter(block => block.owner === null);
  if (free.length < needed) return pool;
  const ids = new Set(free.slice(0, needed).map(block => block.id));
  return pool.map(block => ids.has(block.id) ? { ...block, owner: request.owner, used: 0 } : block);
}

const released = initial.map(block => block.owner === 'B' ? { ...block, owner: null, used: 0 } : block);
const assigned = admit(released, waiting);
function cachePositions(pool, owner, count) {
  return pool.map(block => {
    if (block.owner !== owner) return block;
    assert(block.used + count <= rowsPerBlock);
    return { ...block, used: block.used + count };
  });
}
const prefilled = cachePositions(assigned, 'D', prompt);
const decoded = cachePositions(prefilled, 'D', 1);
const tails = initial.map(block => rowsPerBlock - block.used);

const beats = [
  {
    id: 'the-waiting-request',
    say: 'Here comes D with eight tokens in its prompt. We also want room for eight more as its reply grows. Where could we put it?',
    hold: 1.15,
  },
  {
    id: 'read-one-row',
    say: 'Look at one row. It holds the keys and values that attention keeps for one token position. In this little GPU cache, sixteen rows make a block.',
    hold: 0.7,
  },
  {
    id: 'count-the-gaps',
    say: 'Count down from the blue in A. Six empty rows. Over in C there are twelve. That makes eighteen empty rows for a request that needs sixteen.',
    hold: 1.2,
  },
  {
    id: 'read-the-owners',
    say: 'Follow the names at the top. Each block belongs to one conversation. A owns all six of those spare rows. C owns the other twelve. Which block can D claim?',
    hold: 1.3,
  },
  {
    id: 'the-release',
    say: 'Watch B. Its conversation just finished. The middle block goes back to the pool with all sixteen rows available together.',
    hold: 1.15,
  },
  {
    id: 'the-handoff',
    say: 'Now D takes that block. As the model processes the prompt, eight rows fill with its keys and values. Where will the first token of the reply go when the model processes it?',
    hold: 1.3,
  },
  {
    id: 'the-next-position',
    say: 'Row nine, right under the prompt. Those gaps in A and C are still there.',
    hold: 2.6,
  },
];

const ink = '#171f4c';
const cobalt = '#283fa8';
const orange = '#ff7846';
const paper = '#f8f7f2';
const atlas = { left: 575, stride: 423, width: 385, top: 335, pitch: 30 };
const labelY = 183;
const tagHeight = 92;
const queueX = 88;
const clamp = n => Math.max(0, Math.min(1, n));
function ease(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
const lerp = (from, to, t) => from + (to - from) * t;
const xOf = i => atlas.left + i * atlas.stride;

function text(ctx, value, x, y, size, color = ink, face = 'Sans', weight = 400, align = 'left') {
  ctx.font = `${weight} ${size}px "Lesson ${face}"`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function line(ctx, x, y, endX, endY, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

// Two strips of colored samples suggest the key and value tensors. Their
// patterns follow the owner and position, independent of the physical address.
const keys = ['#202866', '#2d3896', '#374fbc', '#596dcc', '#798add', '#b8bdf3'];
const values = ['#172866', '#2846a2', '#2565bb', '#438bc8', '#69b0d6', '#aad9e9'];
const samples = 20;
function signal(owner, row, side, col) {
  const seed = owner.charCodeAt(0) - 62;
  const band = Math.sin(col * 0.49 + row * 0.32 + seed + side * 2.6);
  const cross = Math.cos(col * 0.81 - row * 0.57 + seed * 1.8);
  const detail = Math.sin((row + seed + 2) * (col + 3) * (side + 1) * 0.38);
  return Math.round(clamp(0.5 + 0.26 * band + 0.16 * cross + 0.12 * detail) * (keys.length - 1));
}

function paintPosition(ctx, owner, row, x, y, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const h = atlas.pitch - 2;
  const half = (atlas.width - 12) / 2;
  for (let side = 0; side < 2; side++) {
    const start = x + 4 + side * (half + 4);
    const palette = side === 0 ? keys : values;
    for (let col = 0; col < samples; col++) {
      const a = Math.round(start + half * col / samples);
      const b = Math.round(start + half * (col + 1) / samples);
      const shade = signal(owner, row, side, col);
      rect(ctx, a, y + 1, b - a, h, palette[shade]);
      rect(ctx, a, y + h - 5, b - a, 4, palette[Math.max(0, shade - 1)]);
    }
  }
  ctx.restore();
}

function ownerTag(ctx, x, y, width, owner) {
  const fresh = owner === 'D';
  const fill = fresh ? orange : ink;
  const type = fresh ? '#351a18' : paper;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width - 22, y);
  ctx.lineTo(x + width, y + 22);
  ctx.lineTo(x + width, y + tagHeight);
  ctx.lineTo(x, y + tagHeight);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'Request', x + 20, y + 57, 36, type);
  text(ctx, owner, x + width - 27, y + 72, 77, type, 'Serif', 400, 'right');
}

function shot(clock) {
  const { index, elapsed, reveal } = clock;
  function cue(beat, phrase, duration) {
    if (index !== beat) return Number(index > beat);
    return ease(reveal(phrase, duration));
  }
  const arrival = ease((elapsed + 0.1) / 0.9);
  const release = cue(4, 'Watch B', 0.95);
  const transfer = cue(5, 'Now D', 1.25);
  const write = cue(5, 'As the model', 0.9);
  const next = index === 6 ? ease((elapsed + 0.04) / 0.45) : 0;
  const state = next > 0 ? decoded : write > 0 ? prefilled : transfer === 1 ? assigned : release === 1 ? released : initial;
  return {
    state, release, transfer, write, next,
    arrival: index === 0 ? arrival : 1,
    charge: cue(0, 'eight tokens', 0.4),
    reserve: cue(0, 'We also want room', 0.5),
    sampleRow: index === 1 ? cue(1, 'Look at one row', 0.45) * (1 - cue(1, 'In this little', 0.7)) : 0,
    countA: cue(2, 'Count down', 0.7),
    countC: cue(2, 'Over in C', 0.7),
    owners: index === 3 ? (1 - cue(3, 'Which block', 0.7)) : 0,
    camera: cue(5, 'As the model', 1.4),
  };
}

function drawQueue(ctx, s) {
  ctx.save();
  ctx.globalAlpha *= 1 - s.transfer;
  text(ctx, 'Waiting', queueX, labelY - 19, 33, ink);
  ctx.globalAlpha *= 1 - s.sampleRow;
  const start = queueX + 2;
  const groupWidth = 172;
  const y = 430;
  for (const [group, label, amount, opacity] of [
    [0, 'Prompt', prompt, s.charge],
    [1, 'Reply room', answerReserve, s.reserve],
  ]) {
    const x = start + group * (groupWidth + 16);
    ctx.save();
    ctx.globalAlpha *= opacity;
    text(ctx, String(amount), x - 3, y, 110, ink, 'Serif');
    text(ctx, label, x + 1, y + 63, 32, ink);
    for (let i = 0; i < amount; i++) {
      const dx = x + i * 20;
      rect(ctx, dx, y + 6, 16, 17, group === 0 ? ink : '#f5e0d7');
      if (group === 1) {
        ctx.strokeStyle = '#b94924';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dx + 0.75, y + 6.75, 14.5, 15.5);
      }
    }
    ctx.restore();
  }
  if (s.reserve > 0) {
    ctx.save();
    ctx.globalAlpha *= s.reserve;
    line(ctx, start, y + 95, start + 345, y + 95, '#aaaaba');
    text(ctx, `${requiredBlocks} block needed`, start, y + 149, 39, ink, 'Sans', 600);
    ctx.restore();
  }
  ctx.restore();
}

function rowDetail(ctx, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const block = initial[0];
  const row = block.used - 1;
  const targetY = atlas.top + (row + 0.5) * atlas.pitch;
  line(ctx, queueX + 359, 594, xOf(0) - 12, targetY, '#b34a21', 3);
  text(ctx, `A · position ${row + 1}`, queueX, 389, 49, ink, 'Serif');
  for (const [side, label, palette] of [[0, 'Keys', keys], [1, 'Values', values]]) {
    const y = 457 + side * 115;
    text(ctx, label, queueX, y - 10, 33);
    for (let col = 0; col < samples; col++) {
      rect(ctx, queueX + col * 18, y, 18, 56, palette[signal(block.owner, row, side, col)]);
    }
  }
  ctx.restore();
}

function drawBlock(ctx, s, block) {
  const { id, owner, used } = block;
  const x = xOf(id);
  const { width, top, pitch } = atlas;
  const height = rowsPerBlock * pitch;
  const middle = id === 1;
  // The free label belongs to the physical block. D's tag moves above it.
  if (owner !== null && owner !== 'D') {
    ctx.save();
    ctx.globalAlpha *= middle ? 1 - s.release : 1;
    ownerTag(ctx, x, labelY, width, owner);
    ctx.restore();
  }
  if (middle && s.release > 0 && s.transfer < 1) {
    ctx.save();
    ctx.globalAlpha *= s.release * (1 - s.transfer);
    text(ctx, 'Free block', x + width / 2, labelY + 64, 52, cobalt, 'Serif', 400, 'center');
    ctx.restore();
  }

  text(ctx, 'Keys', x + width * 0.25, top - 15, 31, ink, 'Sans', 400, 'center');
  text(ctx, 'Values', x + width * 0.75, top - 15, 31, ink, 'Sans', 400, 'center');
  rect(ctx, x, top, width, height, '#e8e9ee');
  for (let row = 0; row < rowsPerBlock; row++) {
    const y = top + pitch * row;
    const lineColor = row % 4 === 0 ? '#b3b8c8' : '#d6d8e1';
    rect(ctx, x, y, width, 1.5, lineColor);
    rect(ctx, x, y, 9, 2, '#79829c');
    rect(ctx, x + width - 9, y, 9, 2, '#79829c');
    if (row < used) {
      let opacity = 1;
      if (owner === 'B') opacity = 1 - s.release;
      if (owner === 'D') opacity = row < prompt ? s.write : s.next;
      paintPosition(ctx, owner, row, x, y, opacity);
    }
  }
  ctx.strokeStyle = '#4f5877';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, top, width, height);

  const counting = id === 0 ? s.countA : id === 2 ? s.countC : 0;
  if (counting > 0) {
    const gapStart = top + used * pitch;
    const gapHeight = height - used * pitch;
    ctx.save();
    ctx.globalAlpha *= counting;
    const bx = x + 27;
    line(ctx, bx, gapStart + 8, bx, top + height - 8, '#737e96');
    for (let row = used; row <= rowsPerBlock; row++) {
      const yy = Math.max(gapStart + 8, Math.min(top + row * pitch, top + height - 8));
      line(ctx, bx, yy, bx + (row === used || row === rowsPerBlock ? 14 : 7), yy, '#737e96');
    }
    const midY = gapStart + gapHeight / 2;
    const midX = x + width / 2 + 6;
    rect(ctx, midX - 110, midY - 31, 220, 59, '#e8e9ee');
    text(ctx, `${tails[id]} empty`, midX, midY + 17, 46, ink, 'Serif', 400, 'center');
    ctx.restore();
  }
  if (id === 0 && s.sampleRow > 0) {
    ctx.save();
    ctx.globalAlpha *= s.sampleRow;
    const rowY = top + (initial[0].used - 1) * pitch;
    ctx.strokeStyle = '#f8973b';
    ctx.lineWidth = 5;
    ctx.strokeRect(x - 3, rowY, width + 6, pitch);
    ctx.restore();
  }
  if (s.owners > 0) {
    ctx.save();
    ctx.globalAlpha *= s.owners;
    const side = x + width + 7;
    line(ctx, side, labelY + tagHeight, side, top + height + 5, cobalt, 4);
    line(ctx, side, top + height + 5, side - 56, top + height + 5, cobalt, 4);
    ctx.restore();
  }
  if (middle && s.next > 0) {
    ctx.save();
    ctx.globalAlpha *= s.next;
    const rowY = top + prompt * pitch;
    ctx.strokeStyle = '#b63b17';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 2, rowY - 1, width + 4, pitch + 2);
    line(ctx, x + width / 2, rowY + pitch + 2, x + width / 2, rowY + pitch + 45, '#b63b17', 3);
    rect(ctx, x + 18, rowY + pitch + 47, width - 36, 105, '#e8e9ee');
    text(ctx, `Row ${used}`, x + width / 2, rowY + pitch + 91, 46, '#8c311e', 'Serif', 400, 'center');
    text(ctx, 'First reply token', x + width / 2, rowY + pitch + 134, 33, '#8c311e', 'Sans', 600, 'center');
    ctx.restore();
  }
  text(ctx, `Block ${id}`, x, top + height + 51, 35, ink, 'Mono');
}

function draw(ctx, clock) {
  const s = shot(clock);
  rect(ctx, 0, 0, 1920, 1080, paper);
  text(ctx, 'GPU attention cache', 85, 97, 62, ink, 'Serif');
  text(ctx, `${rowsPerBlock} positions per block`, 1835, 94, 33, ink, 'Mono', 400, 'right');
  line(ctx, 87, 124, 1833, 124, '#a5a8b6');
  ctx.save();
  // Follow the waiting tag. Once it lands, the empty queue slips out of frame.
  ctx.translate(lerp(0, -348, s.camera), lerp(0, -16, s.camera));
  ctx.scale(1 + 0.09 * s.camera, 1 + 0.09 * s.camera);
  if (s.transfer < 1) drawQueue(ctx, s);
  rowDetail(ctx, s.sampleRow);
  for (const block of s.state) drawBlock(ctx, s, block);
  const takeoff = s.transfer;
  const left = lerp(queueX - 290 * (1 - s.arrival), xOf(1), takeoff);
  const arch = Math.sin(Math.PI * takeoff);
  ownerTag(ctx, left, labelY - 90 * arch, lerp(347, atlas.width, takeoff), 'D');
  ctx.restore();
}

function check() {
  assert.equal(requiredBlocks, 1);
  assert.deepEqual(tails, [6, 0, 12]);
  assert.equal(tails.reduce((a, b) => a + b, 0), 18);
  assert.equal(admit(initial, waiting), initial);
  assert.deepEqual(released.map(block => block.owner), ['A', null, 'C']);
  assert.deepEqual(assigned.map(block => block.owner), ['A', 'D', 'C']);
  assert.equal(assigned[1].used, 0);
  assert.equal(prefilled[1].used, 8);
  assert.equal(decoded[1].used, 9);
  assert.equal(decoded[0], initial[0]);
  assert.equal(decoded[2], initial[2]);
  assert.equal(admit(released, { ...waiting, answerReserve: answerReserve + 1 }), released);
  return true;
}

export default { title: 'Why D Needs a Whole Cache Block', beats, draw, check };
