import assert from 'node:assert/strict';
import { bankModel } from '../../../films/gpu-kernel-performance-engineering-lab/arithmetic.mjs';

const banks = 32;
const columns = 32;
const lanes = Array.from({ length: 32 }, (_, lane) => lane);
const cellW = 36;
const cellH = 22;

// Each bank is a strip. Walking one word to the right visits the next bank.
// Wrapping to a new line stays on the same physical address map in both cuts.
function columnRead(stride) {
  const tile = new Float32Array(32 * stride).fill(NaN);
  for (const row of lanes) {
    for (let col = 0; col < columns; col++) tile[row * stride + col] = row * columns + col;
  }
  const requests = lanes.map(lane => {
    const address = lane * stride;
    return { lane, address, bank: address % banks, value: tile[address] };
  });
  const queues = lanes.map(bank => requests.filter(req => req.bank === bank));
  return { tile, requests, queues, rounds: Math.max(...queues.map(q => q.length)) };
}

const plain = columnRead(32);
const padded = columnRead(33);

function check() {
  for (const [stride, read] of [[32, plain], [33, padded]]) {
    assert.deepEqual(read.queues.map(q => q.length), bankModel(stride).counts);
    assert.equal(new Set(read.requests.map(req => req.address)).size, 32);
    assert.equal(read.rounds, stride === 32 ? 32 : 1);
    for (const req of read.requests) {
      assert.equal(req.value, req.lane * columns);
      assert.equal(Math.floor(req.address / banks), req.lane);
    }
  }
  assert.deepEqual(padded.requests.map(req => req.value), plain.requests.map(req => req.value));
  assert.deepEqual(padded.requests.map(req => req.bank), lanes);
  assert.deepEqual(plain.queues.flatMap(q => q.slice(0, 1)), [plain.requests[0]]);
  assert.deepEqual(padded.queues.flatMap(q => q.slice(0, 1)), padded.requests);
  assert.equal(padded.tile.byteLength - plain.tile.byteLength, 128);
  for (const row of lanes) assert.ok(Number.isNaN(padded.tile[row * 33 + 32]));
  assert.equal(padded.requests[2].address, 66);
}

const beats = [
  {
    id: 'one-contact',
    say: 'Watch the contacts along the top. A warp is reading a column for a transpose. Each of its thirty-two lanes asks for a different word. Only one bank lights up. What sent them all there?',
    hold: 0.9,
  },
  {
    id: 'under-the-contact',
    say: 'Look closer at bank zero. Each number on the silicon is a word address. The first four-byte word lives here. Its neighbor lives in bank one. After thirty-two words the bank numbers wrap around.',
    hold: 0.7,
  },
  {
    id: 'row-starts',
    say: 'The orange marks pick out the first word of each tile row. Trace them down. Zero, thirty-two, sixty-four. With thirty-two floats in a row, every step down takes you back to bank zero. It serves one word at a time. That takes thirty-two rounds.',
    hold: 1,
  },
  {
    id: 'leave-a-word',
    say: 'Try a second layout. Leave one spare word at the end of every row. That striped space at address thirty-two belongs to the first row. The second row now starts at thirty-three, in bank one. Where does the third row start?',
    hold: 1.3,
  },
  {
    id: 'two-spares',
    say: 'Sixty-six. Two spare words come before it, so its first word lands in bank two. Follow those row starts all the way out. Each one steps over by one more bank.',
    hold: 1,
  },
  {
    id: 'all-contacts',
    say: 'Read the same column again. See the whole edge light up? Each bank supplies one word. The warp gets the same numbers for the output row in a single shared-memory service round.',
    hold: 2.6,
  },
];

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function state(clock) {
  const { index, elapsed, reveal } = clock;
  let close = 0;
  if (index === 1) close = smooth(reveal('Look closer', 2.3));
  if (index === 2 || index === 3) close = 1;
  if (index === 4) close = 1 - smooth(reveal('Follow those row starts', 3.1));
  const open = index === 0 ? smooth((elapsed + 0.12) / 0.6) : 1;
  const secondLayout = index < 3 ? 0 : index === 3 ? smooth(reveal('Leave one spare word', 1.15)) : 1;
  const secondRow = index < 3 ? 0 : index === 3 ? smooth(reveal('That striped space', 0.95)) : 1;
  const thirdRow = index < 3 ? 0 : index === 3 ? smooth(reveal('third row start', 1.15)) : 1;
  const remaining = index < 4 ? 0 : index === 4 ? reveal('Follow those row starts', 3.0) : 1;
  const returning = index === 5 ? reveal('Read the same column', 1.5) : clamp((elapsed - 0.20) / 1.0);
  const service = index === 2 ? reveal('It serves one word', 2.85) : 0;
  const read = index === 5 ? smooth((returning - 0.83) / 0.17) : 0;
  const bankSignal = index === 0 ? smooth((returning - 0.83) / 0.17)
    : index === 3 ? 1 - secondLayout : index > 3 ? read : 1;
  const activeRow = index === 2 ? Math.floor(2.99 * reveal('Trace them down', 1.45)) : -1;
  return { index, close, open, secondLayout, secondRow, thirdRow, remaining, returning,
    service, bankSignal, activeRow };
}

function label(ctx, content, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(content, x, y);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function gradient(ctx, x, y, xx, yy, stops) {
  const fill = ctx.createLinearGradient(x, y, xx, yy);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}

function outline(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function transform(ctx, close) {
  const zoom = mix(0.90, 5.1, close);
  ctx.transform(zoom, -0.052 * zoom, -0.179 * zoom, 0.88 * zoom,
    mix(788, 809, close), mix(290, 394, close));
}

function substrate(ctx) {
  const w = banks * cellW, h = 33 * cellH;
  const corners = [[-34,-106],[w + 24,-106],[w + 49,-82],[w + 49,h + 47],
    [w + 28,h + 68],[-34,h + 68],[-51,h + 51],[-51,-89]];
  ctx.save();
  ctx.translate(9, 22);
  outline(ctx, corners, '#9e9aaa');
  ctx.translate(-6, -10);
  outline(ctx, corners, '#56425c');
  ctx.restore();
  outline(ctx, corners, gradient(ctx, 0, h, w, -105, [
    [0,'#7f678a'],[0.22,'#beacb9'],[0.47,'#e3c1bf'],[0.60,'#bcafca'],
    [0.84,'#928faf'],[1,'#e2d2d3'],
  ]));
  rect(ctx, -8, -13, w + 16, h + 22, '#493750');

  // Etched traces around the address array stay fixed while the requests change.
  for (let i = 0; i < 6; i++) {
    const x = -36 + 4 * i;
    ctx.strokeStyle = i % 2 ? '#88718c' : '#e1cad0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, -75 + i * 3);
    ctx.lineTo(x, h + 18 - i * 2);
    ctx.lineTo(x + 16, h + 34 - i * 2);
    ctx.lineTo(w - 18 + i * 2, h + 34 - i * 2);
    ctx.stroke();
  }
  for (const bank of lanes) {
    const x = bank * cellW;
    rect(ctx, x + 4, -93, 28, 4, '#e4d3ce');
    rect(ctx, x + 10, h + 39, 18, 14, '#a390a5');
    rect(ctx, x + 13, h + 42, 12, 8, '#d8c4c7');
  }
}

const stripColors = ['#675581', '#60507b', '#705d89', '#655680',
  '#766289', '#685982', '#72608c', '#62537c'];

function bankStrips(ctx) {
  for (const bank of lanes) {
    const x = bank * cellW;
    rect(ctx, x, 0, cellW - 0.75, 33 * cellH, stripColors[bank % stripColors.length]);
    rect(ctx, x + 1.6, 0, 0.8, 33 * cellH, '#a492af');
    rect(ctx, x + cellW - 2.5, 0, 1, 33 * cellH, '#413955');
  }
  // Horizontal etching divides each bank into individually addressable words.
  for (let line = 0; line <= 33; line++) {
    rect(ctx, 0, line * cellH, cellW * banks, 1, '#493d64');
    rect(ctx, 0, line * cellH + 1, cellW * banks, 0.45, '#b6a3c1');
  }
}

function word(ctx, bank, row, color) {
  const x = bank * cellW, y = row * cellH;
  rect(ctx, x + 2.7, y + 1.9, cellW - 5.2, cellH - 3.9, color);
  rect(ctx, x + 3.4, y + 2.1, cellW - 6.8, 1.1, '#ffe7c8');
}

function spareWord(ctx, address, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const x = address % banks * cellW, y = Math.floor(address / banks) * cellH;
  rect(ctx, x + 2, y + 1.5, cellW - 4, cellH - 3, '#bbafc9');
  ctx.beginPath();
  ctx.rect(x + 2, y + 1.5, cellW - 4, cellH - 3);
  ctx.clip();
  ctx.beginPath();
  for (let i = -cellH; i < cellW; i += 5.5) {
    ctx.moveTo(x + i, y + cellH);
    ctx.lineTo(x + i + cellH, y);
  }
  ctx.strokeStyle = '#9485a5';
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
}

function rowShift(s, row) {
  if (row <= 1) return s.secondRow;
  if (row === 2) return s.thirdRow;
  return smooth(s.remaining * 3.4 - (row - 3) * 0.08);
}

function markerOpacity(s, row, shift) {
  if (row < 2 || s.secondLayout === 0) return s.open;
  return Math.max(1 - s.secondLayout, shift);
}

function addressField(ctx, s) {
  // The final row is additional allocated storage in the padded version.
  ctx.save();
  ctx.globalAlpha = 1 - s.secondLayout;
  rect(ctx, 0, 32 * cellH, banks * cellW, cellH, '#8a7d92');
  ctx.restore();
  for (const row of lanes) {
    const shift = rowShift(s, row);
    spareWord(ctx, (row + 1) * 33 - 1, row === 0 ? s.secondRow : rowShift(s, row + 1));
    const from = plain.requests[row], to = padded.requests[row];
    const bank = mix(from.bank, to.bank, shift);
    ctx.save();
    ctx.globalAlpha = markerOpacity(s, row, shift);
    word(ctx, bank, row, s.activeRow === row ? '#ffd188' : '#ff996f');
    ctx.restore();
  }
  // These are physical word addresses. The numbers stay put as the row starts move.
  const zoomInk = smooth((s.close - 0.48) / 0.32);
  if (zoomInk > 0) {
    ctx.save();
    ctx.globalAlpha = zoomInk;
    for (let row = 0; row < 12; row++) {
      const selected = mix(0, padded.requests[row].bank, rowShift(s, row));
      for (let bank = 0; bank < 12; bank++) {
        const isSelected = Math.abs(selected - bank) < 0.52 && markerOpacity(s, row, rowShift(s, row)) > 0.6;
        const isSpare = bank === row - 1 && rowShift(s, row) > 0.9;
        label(ctx, String(row * banks + bank), (bank + 0.5) * cellW, (row + 0.65) * cellH,
          isSelected ? 11.8 : 9.7, isSelected || isSpare ? '#402a42' : '#e1d6ea', 'Mono', 'center');
      }
    }
    ctx.restore();
  }
}

// A pulse shows one serviced word travelling up its bank strip. The whole
// sequence illustrates the service groups, without assigning GPU clock times.
function returnPulse(ctx, request, progress) {
  if (progress <= 0 || progress >= 1) return;
  const x = (request.bank + 0.5) * cellW;
  const source = (Math.floor(request.address / banks) + 0.5) * cellH;
  const tip = mix(source, -42, smooth(progress));
  const tail = mix(source, -42, smooth(clamp(progress - 0.24)));
  rect(ctx, x - 2, tip, 4, tail - tip + 2, '#ffd6a8');
  rect(ctx, x - 4, tip - 2, 8, 4, '#fff6d7');
}

function showReturns(ctx, s) {
  if (s.index === 0 || s.index === 5) {
    const read = s.index === 0 ? plain : padded;
    for (const queue of read.queues) if (queue.length) returnPulse(ctx, queue[0], s.returning);
  }
  if (s.index === 2 && s.service > 0 && s.service < 1) {
    const step = s.service * 3;
    returnPulse(ctx, plain.queues[0][Math.floor(step)], step % 1);
  }
}

function contacts(ctx, s) {
  const on = s.index === 5 ? padded.queues : plain.queues;
  for (const bank of lanes) {
    const x = bank * cellW;
    const lit = on[bank].length ? s.bankSignal : 0;
    rect(ctx, x + 3, -59, 30, 39, '#7c657d');
    rect(ctx, x + 4, -59, 28, 36, '#c5adc1');
    rect(ctx, x + 6, -57, 24, 32, '#9d859d');
    rect(ctx, x + 14.4, -23, 7.2, 23, '#e4c3c1');
    if (lit > 0) {
      ctx.save();
      ctx.globalAlpha = lit;
      rect(ctx, x + 6, -57, 24, 32, '#ffde91');
      rect(ctx, x + 8, -55, 20, 3, '#fff4d5');
      rect(ctx, x + 14.4, -23, 7.2, 23, '#ffda94');
      ctx.restore();
    }
    if (s.close > 0.3 || bank === 0 || bank === 31 || bank % 8 === 0) {
      const size = mix(19, 11, s.close);
      label(ctx, String(bank), x + cellW / 2, -36, size,
        lit > 0.5 ? '#563842' : '#43364e', 'Mono', 'center');
    }
  }
}

function annotation(ctx, s) {
  const ink = '#33273d', muted = '#675a72', x = 84;
  label(ctx, 'Shared memory', x, 156, 56, ink, 'Serif');
  label(ctx, s.secondLayout > 0.5 ? 'float tile[32][33]' : 'float tile[32][32]',
    x + 2, 214, 34, muted, 'Mono');

  if (s.index === 0 || s.index === 5 || (s.index === 1 && s.close < 0.5)) {
    const opacity = s.index === 1 ? 1 - s.close * 2 : 1;
    ctx.save();
    ctx.globalAlpha = opacity;
    label(ctx, 'First service round', x + 2, 444, 36, muted);
    const count = s.bankSignal > 0.5
      ? (s.index === 5 ? padded : plain).queues.filter(queue => queue.length).length : 0;
    label(ctx, String(count), x - 4, 625, 196, ink, 'Serif');
    const numberWidth = ctx.measureText(String(count)).width;
    label(ctx, '/ 32', x + numberWidth + 12, 616, 67, muted, 'Mono');
    label(ctx, 'words returned', x + 3, 698, 47, ink);
    ctx.restore();
  } else {
    ctx.save();
    if (s.index === 1) ctx.globalAlpha = smooth((s.close - 0.5) / 0.5);
    if (s.index === 4 && s.close < 0.5) ctx.globalAlpha = s.close * 2;
    const y = 514;
    if (s.index === 2 && s.service > 0) {
      ctx.globalAlpha = smooth(s.service * 4);
      label(ctx, String(plain.rounds), x - 3, 581, 152, ink, 'Serif');
      label(ctx, 'service rounds', x + 2, 650, 43, ink);
    } else {
      rect(ctx, x + 2, y - 25, 35, 23, '#fb986f');
      label(ctx, 'Start of a tile row', x + 59, y, 41, ink);
      if (s.secondRow > 0) {
        ctx.save();
        ctx.translate(x, y + 46);
        spareWord(ctx, 0, s.secondRow);
        ctx.restore();
        label(ctx, 'Padding', x + 59, y + 70, 39, ink);
      } else {
        label(ctx, 'Word addresses', x + 2, y + 79, 35, muted);
      }
    }
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const s = state(clock);
  rect(ctx, 0, 0, 1920, 1080, gradient(ctx, 70, 0, 1800, 1050,
    [[0,'#f3e9e4'],[0.48,'#e9e3ed'],[0.78,'#d2d5e2'],[1,'#bcbacb']]));
  ctx.save();
  transform(ctx, s.close);
  substrate(ctx);
  bankStrips(ctx);
  addressField(ctx, s);
  contacts(ctx, s);
  showReturns(ctx, s);
  ctx.restore();
  annotation(ctx, s);
}

export default { title: 'One spare word in a GPU transpose', beats, draw, check };
