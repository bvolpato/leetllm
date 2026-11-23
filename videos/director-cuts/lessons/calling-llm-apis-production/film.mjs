import assert from 'node:assert/strict';

// The four normalized text deltas from the original stream-failures scene.
const pieces = ['Account ', 'acct_10234 ', 'is eligible ', 'under P-7.'];
const textEvents = pieces.map(text => ({ type: 'text', text }));
const completion = { type: 'response.completed' };
const closed = { type: 'eof' };
const topRun = [...textEvents, closed];
const bottomRun = [...textEvents, completion, closed];

function receive(events) {
  let draft = '';
  let status = 'receiving';
  for (const event of events) {
    if (status !== 'receiving') break;
    if (event.type === 'text') draft += event.text;
    if (event.type === 'response.completed') status = 'ready';
    if (event.type === 'eof') status = 'failed';
  }
  return { draft, status };
}

const beats = [
  {
    id: 'last-fragment',
    say: "Watch the last few words slide into place. Each frame holds one event from the model API. There's the period. Would you pass this draft on?",
    hold: 1.7,
  },
  {
    id: 'cut-edge',
    say: "The connection closed right there. Forty-one characters arrived. The app was still waiting for the provider to confirm it had finished. The app records a failed stream.",
    hold: 1.1,
  },
  {
    id: 'second-exposure',
    say: "Let's replay the stream. Follow the new strip. Each piece of text adds to the draft above it. Same account, same answer, right down to the period. Keep your eye on the cut edge.",
    hold: 1.8,
  },
  {
    id: 'one-more-event',
    say: "See the extra frame? That's the provider's completion event. Look up at the character count. Still forty-one. The provider has confirmed the response finished successfully.",
    hold: 1,
  },
  {
    id: 'release',
    say: "Now the app can check the lower draft. Does this account's key actually qualify under policy P seven?",
    hold: 3,
  },
];

const clamp = n => Math.min(1, Math.max(0, n));
function smooth(n) {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
}
const mix = (from, to, p) => from + (to - from) * p;
const box = { x: 92, cell: 267, extra: 578, height: 134 };

function filmState(clock) {
  const { index, elapsed, reveal, speechDuration } = clock;
  const firstFeed = index === 0 ? 3 + smooth(elapsed / 1.75) : 4;
  const atEdge = index > 0 || reveal('Would you pass', 0.45) >= 1;
  // Pull back from the cut edge before a second strip enters the light.
  let wide = 0;
  if (index === 1) wide = smooth(reveal('The app records', 2.1));
  if (index >= 2) wide = 1;
  let replayFeed = 0;
  if (index === 2) {
    const advance = reveal('Follow the new strip', 6.3);
    const travel = advance * 4;
    const cell = Math.floor(travel);
    replayFeed = cell + smooth(clamp((travel - cell) / 0.66));
    // The splice enters in the quiet after the question, before it is named.
    replayFeed += smooth((elapsed - speechDuration - 0.16) / 0.88);
  }
  if (index > 2) replayFeed = 5;
  const first = receive(topRun.slice(0, atEdge ? 5 : Math.floor(firstFeed)));
  const replay = receive(bottomRun.slice(0, Math.floor(replayFeed)));
  return { firstFeed, replayFeed, first, replay, wide, atEdge, replaying: index >= 2 };
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([at, colour]) => paint.addColorStop(at, colour));
  return paint;
}

function round(ctx, x, y, w, h, radius, paint) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = paint;
  ctx.fill();
}

function line(ctx, x, y, endX, endY, colour, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.stroke();
}

function label(ctx, str, x, y, size, colour, family = 'Sans', weight = 400, align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function lamp(ctx, x, y, radius, centre, edge) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, centre);
  light.addColorStop(1, edge);
  return light;
}

function fastener(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  round(ctx, -11, -10, 22, 22, 11, '#101c1c');
  round(ctx, -10, -11, 20, 20, 10, gradient(ctx, 0, -11, 0, 10, [[0, '#899791'], [0.44, '#686e68'], [1, '#3b4b48']]));
  line(ctx, -6, -1, 6, -1, '#27322f', 3);
  line(ctx, -6, 1, 6, 1, '#a2aaa0');
  ctx.restore();
}

function bench(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1920, 1080, [[0, '#293c39'], [0.56, '#172c2b'], [1, '#101f20']]);
  ctx.fillRect(0, 0, 1920, 1080);
  const bezel = gradient(ctx, 10, 328, 20, 909, [[0, '#87908a'], [0.008, '#243431'], [0.03, '#42514a'], [0.98, '#36453e'], [1, '#859087']]);
  round(ctx, 45, 328, 1830, 588, 30, bezel);
  const glass = gradient(ctx, 0, 349, 1700, 900, [[0, '#cdcbbb'], [0.26, '#eee8cd'], [0.54, '#e7e4cc'], [1, '#bfc4b2']]);
  round(ctx, 69, 350, 1782, 544, 13, glass);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(69, 350, 1782, 544, 13);
  ctx.clip();
  ctx.fillStyle = lamp(ctx, 810, 572, 920, '#fff4d950', '#fff0bb00');
  ctx.fillRect(69, 350, 1782, 544);
  // Fixed ruled glass and fine grain stay still when the viewing scale changes.
  for (let y = 356; y < 896; y += 12) line(ctx, 70, y, 1850, y, '#544d3809');
  let seed = 23;
  for (let i = 0; i < 570; i++) {
    seed = (seed * 48271) % 2147483647;
    const x = 70 + seed % 1780;
    seed = (seed * 48271) % 2147483647;
    ctx.fillStyle = '#574c3a1c';
    ctx.fillRect(x, 350 + seed % 545, 1.8, 1.3);
  }
  ctx.restore();
  fastener(ctx, 82, 374, -0.62);
  fastener(ctx, 1830, 374, 0.39);
  fastener(ctx, 82, 873, 0.51);
  fastener(ctx, 1830, 873, -0.41);
  line(ctx, 80, 945, 1840, 945, '#071615', 4);
  line(ctx, 80, 949, 1840, 949, '#4b5952', 1.5);
}

function readout(ctx, trace, replaying, checking) {
  const x = 116;
  const header = checking ? 'At the policy check' : replaying ? 'Draft from replay' : 'Draft from first stream';
  label(ctx, header, x, 106, 42, checking ? '#bee0c8' : '#c7d1bf', 'Serif');
  line(ctx, x, 129, 1788, 129, '#69786b', 1.6);
  label(ctx, trace.draft.trimEnd(), x, 237, 67, '#fff4d9', 'Serif');
  const countX = 1799;
  label(ctx, String(trace.draft.length), countX, 228, 85, '#f8d39b', 'Mono', 400, 'right');
  label(ctx, 'characters', countX, 276, 32, '#c6cfc2', 'Sans', 400, 'right');
}

// Each cell represents a parsed event. The perforations expose the light table.
function strip(ctx, y, feed) {
  if (feed <= 0) return;
  const { x, cell, extra, height } = box;
  const textWidth = cell * Math.min(4, feed);
  const extraWidth = extra * Math.max(0, feed - 4);
  const width = textWidth + extraWidth;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = gradient(ctx, 0, height, 0, height + 17, [[0, '#433c3466'], [1, '#433c3400']]);
  ctx.fillRect(2, height, width + 2, 17);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  for (let dx = 9; dx + 14 < width; dx += 33.375) {
    for (const dy of [7, height - 18]) ctx.roundRect(dx, dy, 16, 11, 3);
  }
  const base = gradient(ctx, 0, 0, 0, height, [[0, '#673c2c'], [0.18, '#b3774c'], [0.51, '#b98156'], [0.8, '#995c3b'], [1, '#623b2c']]);
  ctx.fillStyle = base;
  ctx.fill('evenodd');
  for (let i = 0; i < Math.ceil(Math.min(feed, 4)); i++) {
    const left = i * cell;
    const field = gradient(ctx, left, 0, left + cell, height, [[0, '#4a2e29'], [0.44, '#754532'], [1, '#54352c']]);
    round(ctx, left + 4, 25, cell - 8, height - 50, 3, field);
    line(ctx, left + 7, 26, left + cell - 7, 26, '#e4ab788f');
    label(ctx, pieces[i].trimEnd(), left + cell / 2, height / 2 + 13, 35, '#ffefd8', 'Mono', 400, 'center');
  }
  if (extraWidth > 0) {
    const left = cell * 4;
    const field = gradient(ctx, left, 25, left + extra, height, [[0, '#224c49'], [0.55, '#34766a'], [1, '#24534e']]);
    round(ctx, left + 5, 25, extra - 10, height - 50, 3, field);
    const cx = left + 64, cy = height / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 23, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d8f0cf';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#d8f0cf';
    ctx.fill();
    label(ctx, completion.type, left + 111, cy + 13, 37, '#f0ffdd', 'Mono');
    line(ctx, left + 1, 0, left + 1, height, '#f5ddbf', 4);
  }
  const moving = feed % 1;
  if (moving > 0 && moving < 1) {
    const curl = 28 * Math.sin(Math.PI * moving);
    ctx.fillStyle = gradient(ctx, width - curl, 0, width, 0, [[0, '#f5d7ad00'], [0.76, '#ffe8c6ac'], [1, '#6c4435']]);
    ctx.fillRect(width - curl, 0, curl, height);
  }
  ctx.restore();
}

function edgeMark(ctx, x, y, w, colour) {
  line(ctx, x, y, x + w, y, colour, 2);
  line(ctx, x, y - 8, x, y + 8, colour, 3);
}

function draw(ctx, clock) {
  const s = filmState(clock);
  bench(ctx);
  readout(ctx, s.replaying ? s.replay : s.first, s.replaying, clock.index === 4);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(69, 350, 1782, 544, 13);
  ctx.clip();
  // Follow the common text on the replay, then inspect the two tails in register.
  let close = 0;
  if (clock.index === 3) close = smooth(clock.reveal('See the extra frame', 2.3));
  if (clock.index > 3) close = 1;
  const scale = mix(1.50, 1, s.wide) + 0.52 * close;
  const end = box.x + 4 * box.cell;
  const firstY = mix(504, 437, s.wide) - 29 * close;
  const endX = mix(mix(1258, end, s.wide), 69 + 2 * box.cell * scale, close);
  label(ctx, 'First stream', 115, firstY - 22, 36, '#484e44', 'Sans', 600);
  ctx.save();
  ctx.translate(endX - scale * end, firstY);
  ctx.scale(scale, scale);
  strip(ctx, 0, s.firstFeed);
  ctx.restore();

  if (s.atEdge) {
    const y = firstY + 67 * scale;
    edgeMark(ctx, endX + 10, y - 16, 44, '#86533c');
    label(ctx, 'Connection closed', endX + 73, y, 42, '#603e30', 'Serif');
    const stamp = clock.index === 1 ? clock.reveal('failed stream', 0.45) : Number(clock.index > 1);
    if (stamp > 0) {
      ctx.save();
      ctx.globalAlpha = smooth(stamp);
      label(ctx, 'Failed draft', endX + 73, y + 56, 41, '#673c2a', 'Sans', 600);
      ctx.restore();
    }
  }

  if (s.replaying) {
    const y = 703 - 24 * close;
    label(ctx, 'Replay', 115, y - 22, 36, '#484e44', 'Sans', 600);
    ctx.save();
    ctx.translate(endX - scale * end, y);
    ctx.scale(scale, scale);
    strip(ctx, 0, s.replayFeed);
    ctx.restore();
    if (s.replay.status === 'ready') {
      const level = clock.index === 2 ? 0 : clock.index === 3 ? smooth(clock.reveal('finished successfully', 0.5)) : 1;
      if (level > 0) {
        ctx.save();
        ctx.globalAlpha = level;
        edgeMark(ctx, endX + 8, y - 37, 48, '#29574f');
        label(ctx, 'Ready to validate', endX + 72, y - 22, 41, '#184c44', 'Sans', 600);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

function check() {
  const partials = textEvents.map((_, i) => receive(textEvents.slice(0, i + 1)).draft.length);
  assert.deepEqual(partials, [8, 19, 31, 41]);
  const afterText = receive(textEvents);
  assert.equal(afterText.status, 'receiving');
  assert.equal(afterText.draft.at(-1), '.');
  const upper = receive(topRun), lower = receive(bottomRun);
  assert.equal(upper.draft, lower.draft);
  assert.equal(upper.draft, 'Account acct_10234 is eligible under P-7.');
  assert.equal(upper.status, 'failed');
  assert.equal(lower.status, 'ready');
  assert.deepEqual(receive([...textEvents, completion]), lower);
}

export default { title: 'Did the stream finish?', beats, draw, check };
