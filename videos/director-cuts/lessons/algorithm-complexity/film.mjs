import assert from 'node:assert/strict';

const filters = [
  { id: 'A', pigment: '#f5d74d' },
  { id: 'B', pigment: '#64beda' },
  { id: 'C', pigment: '#ef7793' },
  { id: 'D', pigment: '#b4a1dc' },
  { id: 'E', pigment: '#f59b5a' },
  { id: 'F', pigment: '#8fd0b9' },
  { id: 'G', pigment: '#8499e1' },
  { id: 'H', pigment: '#d7b3a4' },
];

function allPairs(size) {
  const results = [];
  for (let newer = 1; newer < size; newer++) {
    for (let earlier = 0; earlier < newer; earlier++) {
      results.push({ earlier, newer });
    }
  }
  return results;
}

const pairs = allPairs(filters.length);
const countFor = n => n * (n - 1) / 2;

const beats = [
  { id: 'overlap', say: "Look where these two filters overlap. See the green? That's the light we'd get with both filters in a stage lamp. Keep that sample.", hold: 1.0 },
  { id: 'turn-the-pair-around', say: "Trade their places. Still green. We want to try every pair of filters. A with B and B with A get one entry in the book.", hold: 0.85 },
  { id: 'a-partner-for-each', say: "Bring in C. Try it with A, then with B. Here comes D. It gets a turn with all three. Four filters, six tests.", hold: 1.1 },
  { id: 'the-fifth-filter', say: "Here's E. Leave those six samples where they are. How many new tests will this one filter need?", hold: 2.2 },
  { id: 'four-new-tests', say: "Start with A. Slide B into its place. Now C. Then D. That's four new tests, all in one row.", hold: 1.1 },
  { id: 'double-the-set', say: "Suppose we bring the set up to eight. Four filters needed six tests. Would twelve tests cover twice as many filters?", hold: 1.7 },
  { id: 'the-long-rows', say: "Watch the ends of the rows. F needs five partners, one more than E did. G needs six. Follow that row until it fills. The last filter needs seven. Eight filters have filled twenty-eight spots in the book.", hold: 1.3 },
  { id: 'find-one-filter', say: "Find E again. Four samples across its row, and three more down its column. In all, E has met each of the other seven filters.", hold: 1.2 },
  { id: 'count-from-either-end', say: "G counts this last sample. So does H. That happens to every pair when we multiply eight filters by seven partners. Divide by two and we get twenty-eight. With n filters there are n minus one partners apiece. The number of pair tests grows quadratically.", hold: 3.1 },
];

const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// Work advances by one unit for each sample that lands in the book.
function exposure(clock) {
  const cue = (words, span) => clock.reveal(words, span);
  switch (clock.index) {
    case 0: return cue('Keep that sample', 0.85);
    case 1: return 1;
    case 2: return 1 + cue('Try it with A', 0.9) + cue('then with B', 0.95)
      + 3 * cue('It gets a turn', 2.45);
    case 3: return 6;
    case 4: return 6 + cue('Start with A', 0.85) + cue('Slide B', 0.9)
      + cue('Now C', 0.8) + cue('Then D', 0.8);
    case 5: return 10;
    case 6: return 10 + 5 * cue('F needs', 3.55) + 6 * cue('G needs', 3.85)
      + 7 * cue('The last filter', 2.8);
    default: return pairs.length;
  }
}

function circle(ctx, x, y, radius, fill, stroke, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function rounded(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function linear(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [t, color] of stops) g.addColorStop(t, color);
  return g;
}

function radial(ctx, x, y, inner, outer, start, end) {
  const g = ctx.createRadialGradient(x, y, inner, x, y, outer);
  g.addColorStop(0, start);
  g.addColorStop(1, end);
  return g;
}

function label(ctx, words, x, y, size, color, family = 'Sans', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `normal ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(words, x, y);
}

function background(ctx) {
  ctx.fillStyle = linear(ctx, 0, 0, 1000, 1080, [[0, '#263431'], [0.42, '#182524'], [1, '#111918']]);
  ctx.fillRect(0, 0, 1920, 1080);
  // The weave belongs to the work surface. It stays still under the camera.
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#eef2d604';
  ctx.beginPath();
  for (let y = 2; y < 1080; y += 6) {
    ctx.moveTo(0, y);
    ctx.lineTo(1920, y + 17);
  }
  ctx.stroke();
}

const lampX = 467, lampY = 503, opening = 302, gelRadius = 151;
const glassOffset = 83;

function lamp(ctx) {
  ctx.save();
  ctx.translate(lampX, lampY);
  circle(ctx, 4, 14, 353, '#0a1211');
  circle(ctx, 0, 0, 350, linear(ctx, -230, -270, 210, 290,
    [[0, '#a3ac99'], [0.08, '#52615a'], [0.43, '#354641'], [0.8, '#25342f'], [1, '#586454']]));
  circle(ctx, 0, 0, 341, null, '#263c34', 3);
  circle(ctx, 0, 0, 328, null, '#16241f', 2);
  for (let i = 0; i < 4; i++) {
    const a = (i + 0.5) * Math.PI / 2;
    const x = Math.cos(a) * 334, y = Math.sin(a) * 334;
    circle(ctx, x, y, 6.5, '#adac92', '#23322b', 1.5);
    line(ctx, x - 3, y + 2, x + 3, y - 2, '#435044', 1.8);
  }
  circle(ctx, 0, 0, 316, '#1b241e');
  circle(ctx, 0, 0, 310, '#c3b99b');
  circle(ctx, 0, 0, opening, radial(ctx, -18, -12, 95, 340, '#fffbe8', '#e3d7bc'));
  ctx.restore();
}

function letter(index) { return filters[index].id; }

// A clear gel and its aluminum carrier move as one object through the aperture.
function holder(ctx, index, x, y, side) {
  ctx.save();
  ctx.translate(x, y);
  const direction = Math.PI * (0.5 - 0.27 * side);
  ctx.save();
  ctx.rotate(direction);
  rounded(ctx, gelRadius - 3, -18, 170, 36, 8, '#514e41');
  rounded(ctx, gelRadius + 1, -15, 169, 29, 8,
    linear(ctx, 0, -15, 0, 14, [[0, '#f3eddb'], [0.3, '#c8c5b2'], [1, '#a4a894']]));
  circle(ctx, gelRadius + 133, -1, 5, '#596053');
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  circle(ctx, 0, 0, gelRadius, filters[index].pigment);
  ctx.restore();
  circle(ctx, 0, 0, gelRadius + 2.5, null, '#625f4c', 6);
  circle(ctx, -0.3, -1.0, gelRadius + 4, null, '#ece8cc', 2.3);
  ctx.beginPath();
  ctx.arc(0, 0, gelRadius - 11, 3.62, 4.66);
  ctx.strokeStyle = '#ffffff45';
  ctx.lineWidth = 2.8;
  ctx.stroke();
  label(ctx, letter(index), side * 78, -4, 54, '#192d30', 'Mono', 'center');
  ctx.restore();
}

function samplePair(ctx, x, y, earlier, newer, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalCompositeOperation = 'multiply';
  circle(ctx, -11, 0, 25, filters[earlier].pigment);
  circle(ctx, 11, 0, 25, filters[newer].pigment);
  ctx.restore();
}

const slot = (earlier, newer) => ({ x: 1093 + earlier * 99, y: 323 + (newer - 1) * 78 });

function positions(clock, work) {
  if (clock.index <= 1) {
    const reverse = clock.index ? ease(clock.reveal('Trade their places', 1.3)) : 0;
    const approach = clock.index ? 1 : ease(clock.elapsed / 1.35);
    const arch = Math.sin(Math.PI * reverse) * 169;
    return [
      { index: 1, x: lampX + mix(-glassOffset, glassOffset, reverse) - 228 * (1 - approach), y: lampY - arch, side: mix(-1, 1, reverse) },
      { index: 0, x: lampX + mix(glassOffset, -glassOffset, reverse), y: lampY + arch, side: mix(1, -1, reverse) },
    ];
  }

  const completed = Math.floor(work);
  const previous = pairs[Math.max(0, completed - 1)];
  const next = pairs[Math.min(completed, pairs.length - 1)];
  const travel = work - completed;
  // Before asking for E's partners, park E alone in the lit opening.
  if (clock.index === 3 || (clock.index === 4 && work < 7)) {
    const load = clock.index === 3 ? ease(clock.elapsed / 1.4) : 1;
    const leftDepth = clock.index === 3 ? load : 1 - ease(travel / 0.72);
    const eIn = load < 0.5 ? 2 * load : 2 * (1 - load);
    return [
      { index: clock.index === 3 ? 2 : 0, x: lampX - glassOffset - 395 * leftDepth, y: lampY, side: -1 },
      { index: load < 0.5 ? 3 : 4, x: lampX + glassOffset + 395 * ease(eIn), y: lampY, side: 1 },
    ];
  }
  return ['earlier', 'newer'].map((key, i) => {
    const side = i === 0 ? -1 : 1;
    const changed = previous[key] !== next[key];
    const lift = changed ? (travel < 0.36 ? ease(travel / 0.36) : 1 - ease((travel - 0.36) / 0.4)) : 0;
    return {
      index: travel < 0.36 ? previous[key] : next[key],
      x: lampX + side * (glassOffset + 395 * lift), y: lampY, side,
    };
  });
}

function book(ctx, clock, work) {
  const baseline = clock.index === 5 ? ease(clock.reveal('Four filters needed', 0.6))
    : clock.index === 6 ? 1 - ease(clock.reveal('Watch the ends', 0.8)) : 0;
  const rowE = clock.index === 7 ? ease(clock.reveal('Find E again', 0.7))
    : clock.index === 8 ? 1 - ease(clock.reveal('G counts', 0.6)) : 0;
  const columnE = clock.index === 7 ? ease(clock.reveal('three more', 0.65)) : rowE;
  const all = clock.index === 8 ? ease(clock.reveal('every pair', 0.85)) : 0;
  const lastG = clock.index === 8 ? (1 - rowE) * (1 - all) : 0;
  const lastH = clock.index === 8 ? ease(clock.reveal('So does H', 0.55)) * (1 - all) : 0;
  const page = { x: 911, y: 141, w: 907, h: 730 };
  rounded(ctx, page.x - 13, page.y + 3, page.w + 32, page.h + 19, 12, '#101916');
  rounded(ctx, page.x - 11, page.y - 5, page.w + 23, page.h + 19, 12, '#704b3c');
  rounded(ctx, page.x - 2, page.y + 4, page.w + 5, page.h + 4, 8, '#aea188');
  rounded(ctx, page.x, page.y, page.w, page.h, 8, linear(ctx, page.x, page.y, page.x + page.w, page.y + 240,
    [[0, '#bfae8e'], [0.025, '#e8dcc2'], [0.065, '#f4ecd7'], [0.8, '#f0e7d2'], [1, '#e8dec7']]));
  for (const y of [258, 514, 766]) {
    circle(ctx, page.x + 19, y, 6, '#544c40');
    line(ctx, page.x - 8, y - 1, page.x + 19, y - 1, '#bbb6a5', 4);
  }
  const ink = '#36372e', pencil = '#5e604f';
  const done = Math.min(pairs.length, Math.floor(work + 1e-8));
  label(ctx, 'Filter pairs', 968, 202, 49, ink, 'Serif');
  label(ctx, done === 1 ? '1 test' : done + ' tests', 1761, 204, 44, ink, 'Mono', 'right');
  line(ctx, 968, 240, 1762, 240, '#a69f89', 2);

  const exposed = Math.ceil(work);
  let latest = pairs[Math.max(0, exposed - 1)].newer;
  if (clock.index === 3 || clock.index === 4) latest = 4;
  for (let i = 0; i < latest; i++) {
    const x = slot(i, 1).x;
    if (i === 6 && lastG > 0) circle(ctx, x, 275, 23, `rgba(174,121,63,${0.36 * lastG})`);
    label(ctx, letter(i), x, 275, 39, pencil, 'Mono', 'center');
  }
  for (let i = 1; i <= latest; i++) {
    const y = slot(0, i).y;
    if (i === 7 && lastH > 0) circle(ctx, 1008, y, 23, `rgba(174,121,63,${0.36 * lastH})`);
    label(ctx, letter(i), 1008, y, 39, pencil, 'Mono', 'center');
  }
  for (const [i, { earlier, newer }] of pairs.entries()) {
    const amount = ease((work - i - 0.76) / 0.24);
    if (amount <= 0) continue;
    const p = slot(earlier, newer);
    const highlight = newer === 4 ? rowE : earlier === 4 ? columnE : 0;
    const faded = Math.max(rowE - highlight, newer >= 4 ? baseline : 0, i < pairs.length - 1 ? lastG : 0);
    ctx.save();
    ctx.globalAlpha = amount * (1 - 0.72 * faded);
    samplePair(ctx, p.x, p.y, earlier, newer);
    if (highlight > 0) {
      line(ctx, p.x - 17, p.y + 31, p.x + 17, p.y + 31, `rgba(125,70,31,${highlight})`, 3.5);
    }
    ctx.restore();
  }
  if (baseline > 0) {
    ctx.save();
    ctx.globalAlpha = baseline;
    line(ctx, 1333, 472, 1382, 472, '#9e7d55', 2);
    label(ctx, 'First 4 filters', 1400, 473, 34, pencil, 'Serif');
    ctx.restore();
  }
  if (clock.index === 8) {
    const rule = clock.reveal('every pair', 0.7);
    const halve = clock.reveal('Divide by two', 0.55);
    const general = clock.reveal('With n filters', 0.75);
    ctx.save();
    ctx.globalAlpha = rule;
    line(ctx, 968, 820, 1761, 820, '#afa58d', 1.5);
    ctx.globalAlpha *= 1 - general;
    label(ctx, '8 × 7', 978, 846, 39, ink, 'Mono');
    ctx.globalAlpha *= halve;
    label(ctx, '/ 2  =  28', 1120, 846, 39, ink, 'Mono');
    ctx.globalAlpha = general;
    label(ctx, 'Pair tests', 976, 846, 35, pencil);
    label(ctx, 'n(n − 1) / 2', 1755, 845, 43, ink, 'Mono', 'right');
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const work = exposure(clock);
  background(ctx);
  ctx.save();
  const wide = clock.index === 0 ? ease(clock.reveal('Keep that sample', 1.4)) : 1;
  const close = clock.index === 7 ? ease(clock.reveal('Find E again', 1.65)) : Number(clock.index > 7);
  const zoom = mix(1.46, 1, wide) + close * 0.26;
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-(mix(lampX, 960, wide) + 360 * close), -(mix(lampY, 540, wide) - 24 * close));
  lamp(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.arc(lampX, lampY, opening - 1, 0, 2 * Math.PI);
  ctx.clip();
  for (const gel of positions(clock, work)) holder(ctx, gel.index, gel.x, gel.y, gel.side);
  ctx.restore();
  ctx.translate(255 * (1 - wide), 0);
  book(ctx, clock, work);
  ctx.restore();
}

function check() {
  const seen = new Set();
  for (const { earlier, newer } of pairs) {
    assert.ok(earlier < newer);
    const key = [earlier, newer].join('/');
    assert.ok(!seen.has(key));
    seen.add(key);
  }
  for (let n = 1; n <= filters.length; n++) {
    assert.equal(allPairs(n).length, countFor(n));
    assert.equal(pairs.filter(p => p.newer === n - 1).length, n - 1);
  }
  assert.deepEqual([4, 5, 8].map(n => allPairs(n).length), [6, 10, 28]);
  assert.equal(pairs.filter(p => p.newer === 4).length, 4);
  assert.equal(pairs.filter(p => p.earlier === 4).length, 3);
  for (const [i, end] of [1, 1, 6, 6, 10, 10, 28, 28, 28].entries()) {
    assert.equal(exposure({ index: i, reveal: () => 1 }), end);
  }
}

export default { title: 'Every Pair on the Light Table', beats, draw, check };
