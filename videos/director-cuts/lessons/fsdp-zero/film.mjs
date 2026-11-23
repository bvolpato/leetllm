import assert from 'node:assert/strict';

const title = 'When can the next FSDP block start?';

const beats = [
  {
    id: 'the-stripe-stops',
    say: "Follow the white stripe to the edge of block one. Now look across. Block two should have started at six milliseconds. What's holding it up?",
    hold: 1.1,
  },
  {
    id: 'missing-slices',
    say: "We're looking at one GPU in fully sharded data parallel training. In this example four GPUs each own a slice of the weights. The top slice belongs to this GPU. Watch the other three come in.",
    hold: 0.8,
  },
  {
    id: 'read-the-gap',
    say: "Now it runs. That exchange is an all-gather. Every GPU assembles the full block so it can work on its own examples. Look at the trace. The gather ran from five to nine. See the gap after six? Three milliseconds waiting for weights.",
    hold: 1.2,
  },
  {
    id: 'launch-together',
    say: "Replay the handoff. Start the same gather alongside block one. As the orange slices come in, keep an eye on the white stripe. Which finishes first?",
    hold: 1.4,
  },
  {
    id: 'both-live',
    say: "It's still on block one. For the next two milliseconds, both sets of weights have to fit on this GPU. Three and a half gigabytes each. That's seven gigabytes just for the gathered weights.",
    hold: 0.9,
  },
  {
    id: 'the-handoff',
    say: "Let block one finish. Its gathered copy can go. The stripe picks up on block two at six. Look underneath that first stretch of compute. The whole gather fits inside it.",
    hold: 2.4,
  },
];

// One communication group per block, with resharding after forward. Times are
// illustrative milliseconds. The capacity comparison counts full compute weights.
const example = { ranks: 4, blockGB: 3.5, compute: 6, transfer: 4, late: 5, early: 0 };
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => clamp(n) ** 2 * (3 - 2 * clamp(n));

function snapshot(start, time) {
  const ready = start + example.transfer;
  const handoff = Math.max(example.compute, ready);
  return {
    start, time, ready, handoff,
    gather: clamp((time - start) / example.transfer),
    wait: Math.max(0, ready - example.compute),
    block1: time < example.compute,
    block2: time >= handoff,
    fullWeightGB: example.blockGB * (Number(time < example.compute) + Number(time >= ready)),
  };
}

function frameState(clock) {
  const cue = (phrase, seconds) => smooth(clock.reveal(phrase, seconds));
  const openingStop = 6.5;
  switch (clock.index) {
    case 0:
      return snapshot(example.late, 4.55 + (openingStop - 4.55) * smooth(clock.elapsed / 2.9));
    case 1:
      return snapshot(example.late, openingStop +
        0.8 * cue('each own a slice', 1.6) + 2.1 * cue('Watch the other three', 2.0));
    case 2:
      return snapshot(example.late, 9.4 + 0.8 * cue('Now it runs', 1.35));
    case 3:
      return snapshot(example.early, 2.2 * cue('Start the same gather', 2.5) +
        (example.transfer - 2.2) * cue('keep an eye', 2.6));
    case 4:
      return snapshot(example.early, example.transfer);
    default:
      return snapshot(example.early, example.transfer + 3.55 * cue('Let block one finish', 3.0));
  }
}

const ink = '#27203e';
const dim = '#615b73';
const page = '#f2eff8';
const palettes = [
  { edge: '#372882', face: '#5542ba', light: '#9385f4',
    tiles: ['#40338d', '#5746ac', '#6958c5', '#786bd4', '#9486ed', '#b2a7fa'] },
  { edge: '#8a301d', face: '#cf542f', light: '#ffa681',
    tiles: ['#a23622', '#bc4026', '#d6522e', '#ec6739', '#fb8452', '#ffad78'] },
];

function text(ctx, value, x, y, size, options = {}) {
  const { color = ink, align = 'left', family = 'Sans', weight = 500 } = options;
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function line(ctx, x, y, u, v, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(u, v);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// A downsampled, illustrative texture gives each weight array an identity.
// Each of its four broad bands stays with the same source rank on both runs.
const columns = 48;
const rowsPerShard = 6;
function weightMap(block) {
  return Array.from({ length: rowsPerShard * example.ranks }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const band = Math.sin((r + block * 2) * 0.8) * Math.cos(c * 0.15 + block);
      const stripe = Math.sin(c * 0.62 + block * r * 0.12);
      const grain = Math.sin((r + 8) * 73.7 + (c + block * 12) * 19.31) * 9237.4;
      const mixed = 0.46 + band * 0.18 + stripe * 0.19 + ((grain % 1) * 0.18);
      return Math.min(5, Math.floor(clamp(mixed) * 6));
    }));
}
const maps = [weightMap(0), weightMap(1)];

// The wipe shows slices entering the gathered view. Its intermediate fronts
// illustrate the exchange. Only launch, collective completion and compute
// boundaries encode the schedule.
function materializedSlice(state, block, rank) {
  if (block === 0) return state.block1 ? 1 : 0;
  if (state.time < state.start) return 0;
  if (rank === 0) return 1;
  const phase = (rank - 1) * 0.15;
  return smooth((state.gather - phase) / (1 - phase));
}

// The two array surfaces share an oblique projection. Depth is in logical
// rows. A fixed view makes changes in residency legible at the handoff.
const arrayWidth = 586;
const bandDepth = 57;
const pitch = 67;
const faces = [{ x: 110, y: 346 }, { x: 1040, y: 346 }];
function project(origin, x, y, z = 0) {
  return [origin.x + x + 0.62 * y, origin.y - 0.15 * x + 0.82 * y + z];
}

function drawBand(ctx, origin, state, block, rank) {
  const y = pitch * rank;
  const point = (a, b, depth) => project(origin, a, y + b, depth);
  const amount = materializedSlice(state, block, rank);
  const width = arrayWidth * amount;
  const palette = palettes[block];
  // The empty ruled footprint remains visible when a compute copy is freed.
  polygon(ctx, [point(0, 0, 18), point(arrayWidth, 0, 18),
    point(arrayWidth, bandDepth, 18), point(0, bandDepth, 18)], '#d6d1e2');
  ctx.save();
  ctx.transform(1, -0.15, 0.62, 0.82, origin.x, origin.y + 18);
  ctx.fillStyle = '#aba4bb';
  for (let col = 0; col < 23; col++) {
    for (let row = 0; row < 3; row++) ctx.fillRect(12 + col * 25, y + 9 + row * 18, 3.5, 2.7);
  }
  ctx.restore();
  if (amount <= 0) return;

  polygon(ctx, [point(0, bandDepth, 0), point(width, bandDepth, 0),
    point(width, bandDepth, 19), point(0, bandDepth, 19)], palette.edge);
  polygon(ctx, [point(width, 0, 0), point(width, bandDepth, 0),
    point(width, bandDepth, 19), point(width, 0, 19)], palette.face);
  ctx.save();
  ctx.transform(1, -0.15, 0.62, 0.82, origin.x, origin.y);
  ctx.beginPath();
  ctx.rect(0, y, width, bandDepth);
  ctx.clip();
  ctx.fillStyle = palette.face;
  ctx.fillRect(0, y, width, bandDepth);
  const cellWidth = arrayWidth / columns;
  const cellDepth = bandDepth / rowsPerShard;
  for (let r = 0; r < rowsPerShard; r++) {
    for (let c = 0; c < Math.ceil(columns * amount); c++) {
      ctx.fillStyle = palette.tiles[maps[block][rank * rowsPerShard + r][c]];
      ctx.fillRect(c * cellWidth, y + r * cellDepth, cellWidth - 0.75, cellDepth - 0.8);
    }
  }
  ctx.fillStyle = palette.light;
  ctx.fillRect(0, y + bandDepth - 1.8, width, 1.8);
  // A narrow lip marks the incoming edge. The broad white stripe belongs
  // solely to forward compute.
  if (amount < 1) {
    ctx.fillStyle = palette.edge;
    ctx.fillRect(width - 3, y, 3, bandDepth);
  }
  const running = block === 0 ? state.block1 : state.block2;
  if (running) {
    const elapsed = block === 0 ? state.time : state.time - state.handoff;
    const scan = arrayWidth * clamp(elapsed / example.compute);
    const trail = ctx.createLinearGradient(scan - 52, 0, scan, 0);
    trail.addColorStop(0, 'rgba(255,255,255,0)');
    trail.addColorStop(1, 'rgba(255,255,255,0.6)');
    ctx.fillStyle = trail;
    ctx.fillRect(scan - 52, y, 52, bandDepth);
    ctx.fillStyle = '#29213f';
    ctx.fillRect(scan + 7, y, 3, bandDepth);
    ctx.fillStyle = '#fffefb';
    ctx.fillRect(scan - 7, y, 14, bandDepth);
  }
  ctx.restore();
}

function drawArray(ctx, state, block, identifyLocal) {
  const origin = faces[block];
  for (let r = 0; r < example.ranks; r++) drawBand(ctx, origin, state, block, r);
  const full = block === 0 ? state.block1 : state.gather === 1;
  const running = block === 0 ? state.block1 : state.block2;
  let status = full ? 'Ready' : 'Gathering';
  if (running) status = 'Computing';
  else if (block === 0) status = 'Copy released';
  else if (state.time < state.start) status = 'Awaiting gather';
  const labelX = origin.x + 52;
  text(ctx, 'Block ' + (block + 1), labelX, 205, 58, { family: 'Serif' });
  text(ctx, status, labelX, 251, 34, { color: full ? palettes[block].edge : dim });
  if (block === 1 && identifyLocal > 0) {
    ctx.save();
    ctx.globalAlpha = identifyLocal;
    const [x, y] = project(origin, arrayWidth - 84, 22);
    line(ctx, x, y - 3, x + 32, y - 52, ink, 3);
    text(ctx, 'Local slice', x + 40, y - 52, 32, { color: ink });
    ctx.restore();
  }
}

const plot = { x: 323, end: 1802, span: 10.8, computeY: 741, gatherY: 823, height: 47 };
const msX = ms => plot.x + (plot.end - plot.x) * ms / plot.span;
function interval(ctx, a, b, y, color) {
  if (b <= a) return;
  ctx.fillStyle = color;
  ctx.fillRect(msX(a), y, msX(b) - msX(a), plot.height);
}

function trace(ctx, state, annotateWait, markDuration) {
  const { time, start, ready, handoff } = state;
  const { x, end, computeY, gatherY, height } = plot;
  const baseline = gatherY + height + 24;
  text(ctx, 'Compute', x - 30, computeY + 36, 41, { align: 'right' });
  text(ctx, 'All-gather', x - 30, gatherY + 36, 41, { align: 'right' });
  for (const y of [computeY, gatherY]) {
    ctx.fillStyle = '#ddd8e7';
    ctx.fillRect(x, y, end - x, height);
  }
  for (let ms = 0; ms <= 10; ms++) {
    const deadline = ms === example.compute;
    line(ctx, msX(ms), computeY - 8, msX(ms), baseline, deadline ? '#797281' : '#c8c1d3',
      deadline ? 3 : 1.6);
    if ([0, 4, 5, 6, 9].includes(ms)) {
      text(ctx, String(ms), msX(ms), baseline + 36, 36,
        { family: 'Mono', color: deadline ? ink : dim, align: 'center' });
    }
  }
  text(ctx, 'ms', end, baseline + 32, 29, { family: 'Mono', color: dim, align: 'right' });
  interval(ctx, 0, Math.min(example.compute, time), computeY, palettes[0].face);
  interval(ctx, handoff, time, computeY, palettes[1].face);
  interval(ctx, start, Math.min(time, ready), gatherY, palettes[1].face);
  const boundaryX = msX(example.compute);
  text(ctx, 'Block 1 ends', boundaryX + 16, computeY - 34, 34, { color: dim });
  line(ctx, boundaryX, computeY - 54, boundaryX, computeY - 8, dim, 2.5);
  // The slanted marks distinguish transfer from compute even without color.
  if (time > start) {
    const right = msX(Math.min(time, ready));
    ctx.save();
    ctx.beginPath();
    ctx.rect(msX(start), gatherY, right - msX(start), height);
    ctx.clip();
    for (let i = msX(start) - height; i < right + height; i += 22) {
      line(ctx, i, gatherY + height, i + 34, gatherY, '#f7a07a', 7);
    }
    ctx.restore();
  }
  if (markDuration > 0) {
    ctx.save();
    ctx.globalAlpha = markDuration;
    const middle = (msX(start) + msX(ready)) / 2;
    ctx.fillStyle = palettes[1].edge;
    ctx.fillRect(middle - 82, gatherY, 164, height);
    text(ctx, (ready - start) + ' ms', middle, gatherY + 35, 34,
      { family: 'Mono', color: '#fffcfa', align: 'center' });
    ctx.restore();
  }
  if (annotateWait > 0) {
    ctx.save();
    ctx.globalAlpha = annotateWait;
    const mid = (msX(example.compute) + msX(handoff)) / 2;
    text(ctx, state.wait + ' ms wait', mid, computeY + 35, 32,
      { family: 'Mono', align: 'center' });
    ctx.restore();
  }
  const playhead = msX(time);
  line(ctx, playhead, computeY - 16, playhead, baseline - 7, ink, 3);
  polygon(ctx, [[playhead - 9, computeY - 26], [playhead + 9, computeY - 26],
    [playhead, computeY - 13]], ink);
}

function draw(ctx, clock) {
  const state = frameState(clock);
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, clock.width, clock.height);
  const daylight = ctx.createLinearGradient(0, 0, 1620, 930);
  daylight.addColorStop(0, '#fcf8fa');
  daylight.addColorStop(0.65, '#eeeaf5');
  daylight.addColorStop(1, '#e4e1ee');
  ctx.fillStyle = daylight;
  ctx.fillRect(0, 0, clock.width, clock.height);
  text(ctx, 'FSDP  /  Rank 0 of 4', 110, 83, 37, { family: 'Mono' });
  text(ctx, 'Forward pass', 600, 83, 37, { color: dim });
  const tenths = Math.floor((state.time + 0.000001) * 10) / 10;
  text(ctx, tenths.toFixed(1) + ' ms', 1810, 90, 65, { align: 'right', family: 'Mono' });
  line(ctx, 110, 116, 1810, 116, '#c7c1d1');

  const local = clock.index === 1 ? smooth(clock.reveal('The top slice', 0.5)) : 0;
  drawArray(ctx, state, 0, 0);
  drawArray(ctx, state, 1, local);
  if (clock.index === 4) {
    const each = smooth(clock.reveal('both sets', 0.55));
    const total = smooth(clock.reveal('Three and a half', 0.55));
    ctx.save();
    ctx.globalAlpha = each;
    for (const origin of faces) {
      const [x, y] = project(origin, arrayWidth / 2, pitch * 3 + bandDepth, 30);
      line(ctx, x, y, x, 564, dim);
      text(ctx, example.blockGB + ' GB', x, 610, 46, { family: 'Mono', align: 'center' });
    }
    if (total > 0) {
      ctx.globalAlpha = total;
      line(ctx, 562, 638, 1492, 638, dim);
      ctx.fillStyle = '#efebf5';
      ctx.fillRect(737, 607, 582, 63);
      text(ctx, state.fullWeightGB + ' GB of gathered weights', 1027, 651, 40,
        { align: 'center', weight: 600 });
    }
    ctx.restore();
  }
  const annotateWait = clock.index === 2 ? smooth(clock.reveal('See the gap', 0.55)) : 0;
  const duration = clock.index === 2 ? smooth(clock.reveal('from five to nine', 0.4)) :
    clock.index === 5 ? smooth(clock.reveal('Look underneath', 0.4)) : 0;
  trace(ctx, state, annotateWait, duration);
}

function check() {
  for (const start of [example.early, example.late]) {
    const atReady = snapshot(start, start + example.transfer);
    assert.equal(atReady.gather, 1);
    assert.equal(atReady.ready - start, 4);
    for (let rank = 0; rank < example.ranks; rank++)
      assert.equal(materializedSlice(atReady, 1, rank), 1);
  }
  const stalled = snapshot(example.late, example.compute);
  assert.equal(stalled.block1 || stalled.block2, false);
  assert.equal(stalled.gather, 0.25);
  assert.equal(stalled.wait, 3);
  assert.equal(stalled.handoff, 9);
  assert.equal(materializedSlice(stalled, 1, 0), 1);
  assert.ok(materializedSlice(stalled, 1, 3) < 1);
  const overlapping = snapshot(example.early, example.transfer);
  assert.equal(overlapping.fullWeightGB, 7);
  assert.equal(overlapping.block1, true);
  assert.equal(overlapping.block2, false);
  assert.equal(overlapping.handoff - overlapping.ready, 2);
  const next = snapshot(example.early, example.compute);
  assert.equal(next.handoff, 6);
  assert.equal(next.wait, 0);
  assert.equal(next.block2, true);
  assert.equal(next.fullWeightGB, 3.5);
  assert.equal(materializedSlice(next, 0, 0), 0);
}

export default { title, beats, draw, check };
