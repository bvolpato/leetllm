import assert from 'node:assert/strict';

const depots = ['A', 'B'];
const pairs = depots.flatMap(first => depots.map(second => [first, second]));
const misses = (pair, setting) => pair.reduce((n, depot) => n + Number(depot !== setting), 0);
const winners = pairs.map(pair => misses(pair, 'B') < misses(pair, 'A') ? 'B' : 'A');
const fixedMisses = pairs.reduce((n, pair) => n + misses(pair, 'A'), 0);
const selectedMisses = pairs.reduce((n, pair, i) => n + misses(pair, winners[i]), 0);
const sampleSize = pairs.flat().length;
const lockedSetting = winners.at(-1);
const freshAddress = 'A';
const nextMissRate = misses(depots, lockedSetting) / depots.length;

const beats = [
  {
    id: 'double-impression',
    say: 'Two tickets slide in, both addressed to depot B. Watch the stamp.',
    hold: 0.75,
  },
  {
    id: 'fixed-die',
    say: 'It sent both to A. This router sends everything to one depot, A or B. We chose A before drawing the tickets.',
    hold: 0.55,
  },
  {
    id: 'four-draws',
    say: 'Each ticket has an even chance of needing A or B, independent of the ticket before it. That gives us four equally likely pairs.',
    hold: 0.65,
  },
  {
    id: 'count-the-crosses',
    say: 'Leave the stamp at A. Count one miss on this mixed pair, one on its mirror image, and two on the right. Four wrong routes out of eight.',
    hold: 0.8,
  },
  {
    id: 'change-the-die',
    say: 'What if each pair gets to choose the setting that gives it fewer misses? The mixed pairs tie, so A can stay. Look at the two B tickets.',
    hold: 1.2,
  },
  {
    id: 'the-winning-scores',
    say: 'Same eight addresses. Now only two carry crosses. Scoring each winner on the pair that chose it gives an average error of twenty-five percent.',
    hold: 1.25,
  },
  {
    id: 'lock-the-stamp',
    say: 'Keep the B stamp that just got a perfect score. Lock it. Here comes one fresh ticket from the same queue. What are its chances now?',
    hold: 1.4,
  },
  {
    id: 'the-next-address',
    say: 'The new address could be A or B. The B stamp misses every A. That’s half the queue. The A stamp would miss the other half.',
    hold: 0.8,
  },
  {
    id: 'holdout',
    say: 'This one is for A. Record the miss. To measure the router we chose, keep its setting locked and let fresh tickets supply the score.',
    hold: 2.6,
  },
];

function check() {
  assert.deepEqual(pairs.map(pair => pair.join('')), ['AA', 'AB', 'BA', 'BB']);
  assert.deepEqual(winners, ['A', 'A', 'A', 'B']);
  assert.deepEqual(pairs.map((pair, i) => misses(pair, winners[i])), [0, 1, 1, 0]);
  assert.equal(fixedMisses / sampleSize, 0.5);
  assert.equal(selectedMisses / sampleSize, 0.25);
  assert.equal(nextMissRate, 0.5);
  assert.equal(misses([freshAddress], lockedSetting), 1);
  // Enumerate the independent next address for every selected setting.
  const nextLosses = winners.flatMap(setting => depots.map(next => Number(next !== setting)));
  assert.equal(nextLosses.reduce((a, b) => a + b) / nextLosses.length, 0.5);
}

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const p = clamp(x); return p * p * (3 - 2 * p); };
const mix = (a, b, t) => a + (b - a) * t;
const center = i => (i - 1.5) * 376;
const last = center(3);
const nextBay = 1132;
const ink = '#173e3d';
const cream = '#f5e9c8';
const rust = '#a93224';
const TAU = 2 * Math.PI;

function gradient(ctx, x, y, u, v, stops) {
  const fill = ctx.createLinearGradient(x, y, u, v);
  stops.forEach(([at, color]) => fill.addColorStop(at, color));
  return fill;
}

function rect(ctx, x, y, w, h, fill, radius = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function disc(ctx, x, y, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function line(ctx, x, y, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function label(ctx, value, x, y, size, color, options = {}) {
  ctx.font = (options.weight || '500') + ' ' + size + 'px "Lesson ' + (options.font || 'Sans') + '"';
  ctx.textAlign = options.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function screw(ctx, x, y, r) {
  disc(ctx, x, y + 1, r + 1, '#102521');
  disc(ctx, x, y, r, gradient(ctx, x - r, y - r, x + r, y + r, [[0,'#b9af85'],[0.45,'#827c66'],[1,'#413f34']]));
  line(ctx, x - r * 0.6, y + r * 0.34, x + r * 0.6, y - r * 0.34, '#343d33', r * 0.32);
}

function cross(ctx, x, y, radius, intensity = 1) {
  ctx.save();
  ctx.globalAlpha *= intensity;
  ctx.lineCap = 'round';
  line(ctx, x - radius, y - radius, x + radius, y + radius, rust, radius * 0.59);
  line(ctx, x - radius, y + radius, x + radius, y - radius, rust, radius * 0.59);
  ctx.restore();
}

function paperPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-66, -95);
  ctx.lineTo(-51, -110);
  ctx.lineTo(51, -110);
  ctx.lineTo(66, -95);
  ctx.lineTo(66, 125);
  ctx.lineTo(-66, 125);
  ctx.closePath();
}

function ticket(ctx, x, y, address, setting, printed, { angle = 0, mark = 1, seed = 0 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.save();
  ctx.translate(3, 5);
  paperPath(ctx);
  ctx.fillStyle = '#182621';
  ctx.fill();
  ctx.restore();
  paperPath(ctx);
  ctx.fillStyle = gradient(ctx, -60, -98, 70, 116, [[0,'#fdf1cf'],[0.54,'#f3e4bb'],[1,'#ddc99f']]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Short fibers sit inside the cut edge of each ticket.
  for (let i = 0; i < 35; i++) {
    const fx = (i * 37 + seed * 13) % 132 - 66;
    const fy = (i * 53 + seed * 11) % 236 - 110;
    line(ctx, fx, fy, fx + 2.8, fy - 0.6, '#95805e42', 0.65);
  }
  rect(ctx, -66, -110, 132, 8, address === 'B' ? '#a86c28' : address === 'A' ? '#4d7d73' : '#aaa18d');
  ctx.restore();
  disc(ctx, 0, -91, 5.6, '#baab88');
  disc(ctx, 0, -90, 4.1, '#3c4639');
  label(ctx, 'TO', 0, -65, 16, '#60563f', {font:'Mono', weight:'700'});
  label(ctx, address || '?', 0, -18, 76, '#24372e', {font:'Serif', weight:'600'});
  ctx.save();
  ctx.setLineDash([4, 4]);
  line(ctx, -59, 22, 59, 22, '#a69673', 1.4);
  ctx.restore();
  if (printed > 0) {
    ctx.save();
    ctx.globalAlpha *= printed;
    ctx.translate(-5, 72);
    ctx.rotate(-0.065);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 39, 32, 0, 0, TAU);
    ctx.stroke();
    label(ctx, 'SENT', 0, -15, 11, ink, {font:'Mono', weight:'700'});
    label(ctx, setting, 0, 6, 43, ink, {font:'Mono', weight:'700'});
    ctx.restore();
    if (address && address !== setting) cross(ctx, 38, 92, 12, printed * mark);
  }
  ctx.restore();
}

function rail(ctx, y) {
  const metal = gradient(ctx, 0, y, 0, y + 18, [[0,'#222f29'],[0.14,'#b6aa8b'],[0.33,'#d0c5a5'],[0.49,'#8e8976'],[0.83,'#45514a'],[1,'#122623']]);
  rect(ctx, -1350, y + 4, 3120, 22, '#192a25', 3);
  rect(ctx, -1350, y, 3120, 18, metal, 3);
  for (let x = -1050; x < 1710; x += 186) screw(ctx, x, y + 9, 3.8);
}

function bed(ctx) {
  const paint = gradient(ctx, 0, -275, 0, 167, [[0,'#293f39'],[0.56,'#44584c'],[0.9,'#3c5046'],[1,'#2c4138']]);
  rect(ctx, -1350, -269, 3120, 432, '#102520', 12);
  rect(ctx, -1350, -272, 3120, 429, paint, 12);
  for (let i = 0; i < 175; i++) {
    const x = -1330 + (i * 791) % 3060;
    const y = -258 + (i * 139) % 392;
    line(ctx, x, y, x + 2 + (i % 8), y - (i % 4) / 3, '#f8edbb10', 0.85);
  }
  rail(ctx, -230);
  line(ctx, -1350, 147, 1770, 147, '#9aa387', 1.3);
  rect(ctx, -1350, 158, 3120, 15, '#25372e');
  rect(ctx, -1350, 171, 3120, 5, '#6e6851');
}

function platen(ctx, x) {
  rect(ctx, x - 169, -122, 338, 264, '#222f29', 8);
  rect(ctx, x - 168, -124, 336, 264, '#646e5a', 8);
  rect(ctx, x - 163, -120, 326, 255, '#313c31', 6);
  for (const dx of [-155,155]) {
    screw(ctx, x + dx, -110, 3.7);
    screw(ctx, x + dx, 126, 3.7);
  }
}

function press(ctx, x, down, setting, flip, locked) {
  ctx.save();
  ctx.translate(x, 0);
  const travel = 182 * down;
  const brass = gradient(ctx, -2, -269, 20, -158, [[0,'#f1d591'],[0.25,'#c5a36a'],[0.64,'#8b784e'],[1,'#d8b87a']]);
  for (const side of [-108,108]) {
    disc(ctx, side, -221, 19, '#142620');
    disc(ctx, side, -223, 16, '#7f8571');
    disc(ctx, side, -223, 10, '#414c3e');
    screw(ctx, side, -223, 6);
    rect(ctx, side - 7, -191, 14, 69 + travel,
      gradient(ctx, side - 7, 0, side + 7, 0, [[0,'#546054'],[0.4,'#d6ceab'],[0.66,'#a2a58f'],[1,'#58665b']]));
  }
  rect(ctx, -137, -252, 274, 66, '#0f251f', 11);
  rect(ctx, -137, -256, 274, 65, gradient(ctx, 0,-256,0,-191,[[0,'#6c8070'],[0.09,'#4e6a59'],[0.72,'#2b4c41'],[1,'#223d32']]), 10);
  screw(ctx, -125, -244, 4.2);
  screw(ctx, 125, -244, 4.2);
  label(ctx, 'Route all to', -45, -220, 25, cream, {weight:'600'});
  rect(ctx, 31, -248, 65, 51, '#102b25', 5);
  ctx.save();
  ctx.translate(64, -223);
  ctx.scale(1, 1 - 0.58 * Math.sin(Math.PI * flip));
  rect(ctx, -26, -19, 52, 39, brass, 3);
  label(ctx, setting, 0, 2, 35, '#183529', {font:'Mono', weight:'700'});
  ctx.restore();
  // The latch is bolted to the carriage, so it travels with the frozen setting.
  if (locked > 0) {
    ctx.save();
    ctx.globalAlpha = locked;
    ctx.translate(113, -215);
    ctx.strokeStyle = '#efd395';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -3, 6.5, Math.PI, TAU);
    ctx.lineTo(6.5, 2);
    ctx.stroke();
    rect(ctx, -10, 0, 20, 16, '#e4bd79', 2.5);
    disc(ctx, 0, 7, 2, '#233a2c');
    ctx.restore();
  }
  const baseY = -146 + travel;
  const edge = gradient(ctx, 0, baseY, 0, baseY + 25, [[0,'#a88b54'],[0.12,'#efdaa5'],[0.28,'#c6ac79'],[0.7,'#ac8c57'],[1,'#876f45']]);
  rect(ctx, -147 + 4 * (1 - down), baseY + 6 + 6 * (1 - down), 296, 28, '#12231d69', 4);
  rect(ctx, -149, baseY + 4, 298, 27, '#182e28', 5);
  rect(ctx, -149, baseY, 298, 25, edge, 4);
  screw(ctx, -135, baseY + 13, 4);
  screw(ctx, 135, baseY + 13, 4);
  for (const dx of [-74,74]) {
    rect(ctx, dx - 38, baseY + 22, 76, 10, '#2a3329', 2);
  }
  line(ctx, -136, baseY + 3, 135, baseY + 3, '#eddeac', 1.6);
  ctx.restore();
}

function stroke(t, start, duration) {
  const p = clamp((t - start) / duration);
  if (p < 0.43) return smooth(p / 0.43);
  if (p < 0.56) return 1;
  return 1 - smooth((p - 0.56) / 0.44);
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const wide = index < 2 ? 0 : index === 2 ? smooth(clamp(elapsed / 2.8)) : 1;
  const chase = index < 6 ? 0 : index === 6 ? smooth(reveal('Here comes one fresh ticket', 2.2)) : 1;
  const locked = index < 6 ? 0 : index === 6 ? reveal('Lock it', 0.42) : 1;
  const open = index < 7 ? 0 : index === 7 ? smooth(reveal('The new address', 1.65)) : 1;
  const turn = index < 4 ? 0 : index === 4 ? reveal('Look at the two B tickets', 0.58) : 1;
  const secondHit = index === 4 ? reveal('Look at the two B tickets', 1.85) : index > 4 ? 1 : 0;
  const revised = secondHit > 0.64;
  const actual = index === 8 ? smooth(reveal('This one is for A', 1.35)) : 0;
  const countCues = ['one miss on this mixed pair', 'one on its mirror image', 'two on the right'];
  const countedBays = index === 3 ? countCues.map(cue => reveal(cue, 0.45)) : [];

  const background = ctx.createRadialGradient(837, 460, 25, 1050, 570, 1300);
  background.addColorStop(0, '#37483c');
  background.addColorStop(0.75, '#202e27');
  background.addColorStop(1, '#16231e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1920, 1080);
  // The two tracking moves preserve the last pair as the point of reference.
  const zoom = mix(mix(2.26, 1.12, wide), 1.95, chase);
  const focusX = mix(mix(last, 0, wide), 855, chase);
  const bedY = mix(mix(668, 620, wide), 680, chase);
  ctx.save();
  ctx.translate(960, bedY);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, 0);
  bed(ctx);

  for (let i = 0; i < pairs.length; i++) {
    const x = center(i);
    const exposed = i === 3 ? 1 : smooth(clamp((wide - 0.12 * i) / 0.7));
    if (exposed === 0) continue;
    ctx.save();
    ctx.globalAlpha = exposed;
    platen(ctx, x);
    if (i > 0 && index === 3) {
      const lit = countedBays[i - 1] * (1 - (countedBays[i] ?? reveal('Four wrong routes', 0.6)));
      if (lit > 0) {
        ctx.strokeStyle = 'rgba(248,211,145,' + lit + ')';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.roundRect(x - 172, -127, 344, 273, 9);
        ctx.stroke();
      }
    }
    pairs[i].forEach((depot, j) => {
      const slide = index === 0 ? 1 - smooth((elapsed + 0.17 - j * 0.17) / 1.05) : 0;
      const pressed = i === 3 && index === 0 ? smooth((elapsed - 1.82) / 0.12) : 1;
      const setting = revised ? winners[i] : 'A';
      ticket(ctx, x + (j === 0 ? -74 : 74), slide * 213 + 4, depot, setting, pressed, {
        angle:(j === 0 ? -0.018 : 0.016) + slide * (j === 0 ? -0.12 : 0.08), seed:2*i+j,
      });
    });
    ctx.restore();
  }

  if (chase > 0) {
    ctx.save();
    ctx.globalAlpha = chase;
    platen(ctx, nextBay);
    const entry = (1 - chase) * 180;
    // One unknown address branches into two equally likely possibilities.
    if (open < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - open;
      ticket(ctx, nextBay, 4 + entry, null, lockedSetting, 1);
      ctx.restore();
    }
    if (open > 0) {
      depots.forEach((depot, i) => {
        ctx.save();
        const kept = depot === freshAddress;
        ctx.globalAlpha *= open * (kept ? 1 : 1 - actual);
        const offset = (i ? 89 : -89) * open * (kept ? 1 - actual : 1 + actual);
        ticket(ctx, nextBay + offset, 4, depot, lockedSetting, 1, {seed:8+i});
        ctx.restore();
      });
      if (open > 0.8 && actual < 0.05) label(ctx, 'or', nextBay, 0, 24, cream, {font:'Serif'});
    }
    ctx.restore();
  }

  let down = 0;
  if (index === 0) down = stroke(elapsed, 1.23, 1.32);
  if (index === 4) down = stroke(secondHit, 0.32, 0.66);
  press(ctx, mix(last, nextBay, chase), down, turn < 0.5 ? 'A' : 'B', turn, locked);
  ctx.restore();

  if (wide > 0 && chase < 1) {
    ctx.save();
    ctx.globalAlpha = wide * (1 - chase);
    const counted = index >= 3;
    const changed = counted && revised;
    label(ctx, counted ? (changed ? 'Each pair picks its setting' : 'Stamp fixed at A') : 'Four equally likely pairs',
      125, 172, 48, cream, {font:'Serif', align:'left'});
    if (counted) {
      const total = index === 3
        ? countedBays.reduce((sum, cue, i) => sum + (cue > 0.5 ? misses(pairs[i + 1], 'A') : 0), 0)
        : changed ? selectedMisses : fixedMisses;
      const complete = index !== 3 || countedBays.at(-1) > 0.5;
      const tally = complete ? total + ' of ' + sampleSize + ' wrong' : total + ' counted';
      if (total > 0) label(ctx, tally, 126, 245, 62, '#f7d49b', {align:'left', weight:'700'});
    }
    ctx.restore();
  }
  if (chase > 0) {
    ctx.save();
    ctx.globalAlpha = chase;
    const sx = value => 960 + (value - focusX) * zoom;
    label(ctx, 'Pair that chose B', sx(last), 69, 49, cream, {font:'Serif'});
    label(ctx, 'One fresh ticket', sx(nextBay), 69, 49, cream, {font:'Serif'});
    label(ctx, '0 of 2 wrong', sx(last), 134, 49, '#f7d49b', {weight:'700'});
    if (open > 0.8) {
      const outcome = actual > 0.65 ? '1 miss recorded' : (100 * nextMissRate) + '% chance of error';
      label(ctx, outcome, sx(nextBay), 134, 49, '#f7d49b', {weight:'700'});
    }
    ctx.restore();
  }
}

export default { title: 'The routing stamp', beats, draw, check };
