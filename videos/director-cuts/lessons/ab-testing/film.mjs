import assert from 'node:assert/strict';
import { report } from '../../../films/ab-testing/fixtures.mjs';
import { standardError } from '../../../films/ab-testing/arithmetic.mjs';

const copies = 4;
const input = [report.control, report.treatment];

function readMeter(rowsPerIncident) {
  const groups = input.map(({ n, resolved }) => ({
    rows: n * rowsPerIncident,
    resolved: resolved * rowsPerIncident,
    rate: resolved / n,
  }));
  const [raw, rewrite] = groups;
  const gain = 100 * (rewrite.rate - raw.rate);
  const se = 100 * standardError(raw.rate, rewrite.rate, raw.rows, rewrite.rows);
  return { groups, gain, se, low: gain - 1.96 * se, high: gain + 1.96 * se };
}

const incidents = readMeter(1);
const messages = readMeter(copies);
const beats = [
  {
    id: 'four-lights',
    say: 'Four messages just lit up green. Green means resolved. How many incidents would you put in the count?',
    hold: 1.7,
  },
  {
    id: 'follow-the-wires',
    say: 'Follow the wires. They meet at one switch. When incident seventeen closed, the log copied its outcome onto every message in the conversation.',
    hold: 0.9,
  },
  {
    id: 'assign-an-incident',
    say: "Suppose we're testing how an assistant searches. We randomly assign each incident to use the original query or a rewritten one. Its follow-ups keep that assignment. Here each group has two thousand independent incidents.",
    hold: 0.8,
  },
  {
    id: 'read-the-meter',
    say: 'With the original query, thirty-eight percent of incidents resolved. With the rewrite, forty-two percent did. The needle gives us the difference, four percentage points. The brass tips mark an approximate ninety-five percent confidence interval for that gain.',
    hold: 1.1,
  },
  {
    id: 'switch-to-messages',
    say: 'Keep an eye on the tips. Give every incident exactly four message rows. What happens if we let the meter count those rows?',
    hold: 1.8,
  },
  {
    id: 'the-narrow-reading',
    say: 'The tips closed halfway. Each success appears four times, and so does each failure. Both rates stay put. The calculation treats eight thousand rows per group as independent. Four times the sample size cuts the standard error in half. Follow those rows back.',
    hold: 0.9,
  },
  {
    id: 'count-at-the-switch',
    say: 'All four lead to one incident. Each incident got one random assignment. Count each incident once. The needle still reads four. The interval opens back out to about one through seven percentage points.',
    hold: 3.0,
  },
];

const mix = (a, b, t) => a + (b - a) * t;
function ease(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}
function rgb(a, b, t) {
  return 'rgb(' + a.map((v, i) => Math.round(mix(v, b[i], t))).join(',') + ')';
}
function gradient(ctx, x, y, xx, yy, stops) {
  const g = ctx.createLinearGradient(x, y, xx, yy);
  for (const [p, v] of stops) g.addColorStop(p, v);
  return g;
}
function glow(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [p, v] of stops) g.addColorStop(p, v);
  return g;
}
function box(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function disk(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
function text(ctx, str, x, y, size, color, options = {}) {
  const { family = 'Sans', weight = 500, align = 'center' } = options;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function line(ctx, x, y, xx, yy, width, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(xx, yy);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
const ivory = '#ece6cf';
const ink = '#202e2c';
const brass = [[0, '#fbdeb0'], [0.23, '#c89f66'], [0.48, '#987141'], [0.78, '#e4c48e'], [1, '#614c33']];
const steel = [[0, '#e1e1d3'], [0.19, '#717d75'], [0.51, '#323f3d'], [0.83, '#9ea89b'], [1, '#515c55']];

function screw(ctx, x, y, turn) {
  disk(ctx, x, y + 2, 8, '#0d1917');
  disk(ctx, x, y, 7, gradient(ctx, x, y - 7, x + 4, y + 7, steel));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  line(ctx, -4.5, 0, 4.5, 0, 1.8, '#19221e');
  ctx.restore();
}

function cabinet(ctx) {
  // The relay and meter occupy one continuous bench. The camera can follow the signal down it.
  box(ctx, 117, -170, 1706, 1780, 64, '#0c1111');
  box(ctx, 103, -183, 1714, 1785, 64, gradient(ctx, 110, 0, 1812, 10, [
    [0, '#221814'], [0.012, '#a57952'], [.035, '#735038'], [.065, '#433527'],
    [.92, '#39291f'], [.975, '#7e583b'], [.994, '#946b46'], [1, '#271e17'],
  ]));
  for (const x of [119, 132, 145, 174, 1748, 1764, 1771, 1793]) {
    ctx.beginPath();
    ctx.moveTo(x, -130);
    ctx.bezierCurveTo(x + 13, 150, x - 12, 240, x - 1, 562);
    ctx.bezierCurveTo(x + 11, 958, x - 7, 1280, x + 3, 1560);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#30221b66';
    ctx.stroke();
  }
  box(ctx, 169, -120, 1582, 1670, 33, '#151f1d');
  box(ctx, 175, -118, 1570, 1658, 30, gradient(ctx, 270, -110, 1380, 1200, [
    [0, '#43625b'], [.35, '#32534c'], [.76, '#233c37'], [1, '#1a2e2a'],
  ]));
  for (const x of [200, 1720]) {
    for (const y of [-92, 536, 768, 1509]) screw(ctx, x, y, x * 0.04 + y);
  }
}

const lampX = [465, 795, 1125, 1455];
function wire(ctx, x, idx, luminous) {
  // The four separate cloth leads terminate at a common binding post.
  const left = x < 960;
  const startX = 960 + (idx - 1.5) * 8;
  const elbowY = 418 - Math.abs(idx - 1.5) * 59;
  const path = (shift, width, color) => {
    ctx.beginPath();
    ctx.moveTo(startX + shift, 493);
    ctx.bezierCurveTo(startX + shift, elbowY, x + shift, elbowY + (left ? 35 : 11), x + shift, 237);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  path(4, 18, '#17211c');
  path(0, 16, '#222c28');
  path(0, 11, rgb([137, 107, 70], [213, 179, 113], luminous));
  path(-2, 2.3, '#efd8a668');
  ctx.lineCap = 'butt';
}

function lamp(ctx, x, i, power) {
  const y = 157;
  text(ctx, 'Message ' + (i + 1), x, 23, 39, '#e6e5d3');
  box(ctx, x - 21, 221, 42, 35, 6, gradient(ctx, x - 20, 0, x + 23, 0, steel));
  line(ctx, x - 16, 245, x + 16, 245, 4, '#414e48');
  disk(ctx, x + 2, y + 8, 87, '#162823');
  disk(ctx, x, y, 86, gradient(ctx, x - 68, y - 81, x + 43, y + 76, steel));
  disk(ctx, x, y, 75, '#182620');
  disk(ctx, x, y, 69, gradient(ctx, x - 50, y - 47, x + 54, y + 56, [
    [0, '#b8be9e'], [.08, '#739278'], [.5, '#3b5447'], [1, '#c3c1a4'],
  ]));
  const lens = glow(ctx, x - 14, y - 19, 94, [
    [0, rgb([57, 82, 67], [222, 255, 185], power)],
    [.43, rgb([39, 66, 55], [143, 222, 152], power)],
    [.71, rgb([27, 52, 44], [70, 171, 124], power)],
    [1, rgb([21, 38, 34], [17, 78, 61], power)],
  ]);
  disk(ctx, x, y, 63, lens);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 62, 0, Math.PI * 2);
  ctx.clip();
  // Molded glass flutes catch the same light on all four pilot lamps.
  for (let dx = -58; dx <= 58; dx += 11) {
    const h = Math.sqrt(62 ** 2 - dx ** 2);
    line(ctx, x + dx, y - h, x + dx, y + h, 2.5, '#203f342f');
    line(ctx, x + dx + 2, y - h, x + dx + 2, y + h, 2, '#f0ffd92b');
  }
  ctx.beginPath();
  ctx.ellipse(x - 10, y - 33, 30, 8, -0.17, 0, 2 * Math.PI);
  ctx.fillStyle = '#f6ffda85';
  ctx.fill();
  ctx.restore();
}

function relay(ctx, clock) {
  const power = ease((clock.seconds - 0.23) / 0.48);
  const traced = clock.index === 1 ? ease(clock.elapsed / 2.1) : Number(clock.index > 1);
  lampX.forEach((x, i) => wire(ctx, x, i, traced));
  // The single switch closes across two contacts on the first syllable.
  box(ctx, 805, 459, 310, 89, 42, '#12231e');
  box(ctx, 809, 455, 302, 86, 40, gradient(ctx, 830, 450, 1080, 553, steel));
  box(ctx, 821, 465, 278, 65, 32, '#24362f');
  disk(ctx, 857, 498, 20, '#b29565');
  disk(ctx, 1062, 498, 18, '#aa885b');
  const tipY = mix(459, 498, power);
  line(ctx, 857, 498, 1062, tipY, 16, '#13221b');
  line(ctx, 857, 494, 1062, tipY - 4, 12, '#dab97f');
  box(ctx, 881, 474 - (1 - power) * 9, 60, 28, 9, '#3b3b30');
  disk(ctx, 857, 493, 9, '#e3c794');
  text(ctx, 'Incident 17', 766, 497, 43, ivory, { align: 'right', family: 'Serif' });
  text(ctx, 'Resolved', 1152, 497, 42, '#c2e4b6', { align: 'left' });
  lampX.forEach((x, i) => lamp(ctx, x, i, power));
}

const arcCenter = { x: 960, y: 1688 };
const tickRadius = 690;
const angle = value => (-55 + 110 * value / 8) * Math.PI / 180;
function point(value, r) {
  return [arcCenter.x + r * Math.sin(angle(value)), arcCenter.y - r * Math.cos(angle(value))];
}
function arc(ctx, a, b, r, width, color) {
  ctx.beginPath();
  ctx.arc(arcCenter.x, arcCenter.y, r, angle(a) - Math.PI / 2, angle(b) - Math.PI / 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function indexTip(ctx, value) {
  const [x, y] = point(value, tickRadius + 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle(value));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-14, -23);
  ctx.lineTo(-14, -42);
  ctx.lineTo(14, -42);
  ctx.lineTo(14, -23);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, -16, 0, 16, 0, brass);
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#6a5032';
  ctx.stroke();
  line(ctx, 0, -7, 0, -33, 2.5, '#584231');
  ctx.restore();
}
function fraction(ctx, x, name, group, reveal, enrolled) {
  text(ctx, name, x, 1254, 45, ink, { family: 'Serif' });
  if (enrolled > 0 && reveal < 1) {
    ctx.save();
    ctx.globalAlpha = enrolled * (1 - reveal);
    text(ctx, group.rows.toLocaleString('en-US') + ' incidents', x, 1368, 35, '#394840', { family: 'Mono' });
    ctx.restore();
  }
  if (reveal <= 0) return;
  ctx.save();
  ctx.globalAlpha = reveal;
  text(ctx, Math.round(100 * group.rate) + '%', x, 1322, 83, ink, { family: 'Serif' });
  const num = n => n.toLocaleString('en-US');
  text(ctx, num(group.resolved) + ' / ' + num(group.rows), x, 1394, 40, '#394840', { family: 'Mono' });
  ctx.restore();
}

function modeSelector(ctx, setting) {
  line(ctx, 187, 600, 1733, 600, 2, '#10261d');
  line(ctx, 187, 603, 1733, 603, 2, '#547266');
  text(ctx, 'Count by', 320, 685, 39, '#bbcbbb', { align: 'left', family: 'Serif' });
  text(ctx, 'Incidents', 823, 685, 42, setting < .5 ? ivory : '#98aa9e', { align: 'right' });
  text(ctx, 'Message rows', 1095, 685, 42, setting >= .5 ? ivory : '#98aa9e', { align: 'left' });
  disk(ctx, 962, 689, 65, '#12221c');
  disk(ctx, 960, 681, 65, gradient(ctx, 900, 633, 1007, 737, brass));
  disk(ctx, 960, 681, 55, '#16221e');
  ctx.save();
  ctx.translate(960, 681);
  ctx.rotate(mix(-1.16, 1.16, setting));
  for (let i = 0; i < 24; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 12);
    line(ctx, 0, -40, 0, -52, 3.4, '#49514a');
    ctx.restore();
  }
  disk(ctx, 0, 0, 42, gradient(ctx, -44, -40, 37, 42, [[0, '#5c6255'], [0.45, '#3b443b'], [1, '#263129']]));
  box(ctx, -5, -47, 10, 27, 3, ivory);
  ctx.restore();
}

function gauge(ctx, state) {
  const { setting, read, rawOn, rewriteOn, tipsOn, enrolled } = state;
  const low = mix(incidents.low, messages.low, setting);
  const high = mix(incidents.high, messages.high, setting);
  box(ctx, 211, 766, 1498, 734, 112, '#12211d');
  box(ctx, 216, 761, 1488, 730, 107, gradient(ctx, 500, 760, 900, 1520, steel));
  box(ctx, 229, 775, 1462, 699, 95, '#17261f');
  box(ctx, 246, 791, 1428, 663, 79, gradient(ctx, 620, 786, 1000, 1460, [
    [0, '#bab49d'], [.08, '#e0dbc4'], [.48, '#f0ead3'], [.96, '#dcd8bf'], [1, '#c8c5ad'],
  ]));
  text(ctx, 'Resolution gain', 333, 858, 54, ink, { align: 'left', family: 'Serif' });
  text(ctx, 'percentage points', 333, 912, 37, '#43554a', { align: 'left' });
  if (tipsOn > 0) {
    ctx.save();
    ctx.globalAlpha = tipsOn;
    const label = setting >= .5 ? 'Copies counted as independent' : 'Approx. 95% confidence interval';
    text(ctx, label, 1585, 860, 37, '#574728', { align: 'right' });
    ctx.restore();
  }

  if (setting > 0.01) {
    ctx.save();
    ctx.globalAlpha = setting * .68;
    ctx.setLineDash([6, 7]);
    arc(ctx, incidents.low, incidents.high, tickRadius + 23, 4, '#486d61');
    ctx.setLineDash([]);
    for (const v of [incidents.low, incidents.high]) {
      line(ctx, ...point(v, tickRadius + 8), ...point(v, tickRadius + 40), 5, '#486d61');
    }
    ctx.restore();
  }
  for (let i = 0; i <= 32; i++) {
    const value = i / 4;
    const len = i % 4 === 0 ? 30 : i % 2 === 0 ? 19 : 10;
    line(ctx, ...point(value, tickRadius - len), ...point(value, tickRadius), i % 4 === 0 ? 4 : 2, '#47574a');
    if (i % 4 === 0) text(ctx, String(value), ...point(value, tickRadius + 77), 44, ink, { family: 'Mono' });
  }
  arc(ctx, 0, 8, tickRadius + 2, 2.5, '#5b6455');
  if (tipsOn > 0) {
    ctx.save();
    ctx.globalAlpha = tipsOn;
    arc(ctx, low, high, tickRadius + 23, 18, '#817045');
    arc(ctx, low, high, tickRadius + 27, 10, '#cab37b');
    indexTip(ctx, low);
    indexTip(ctx, high);
    ctx.restore();
  }
  // The blade rises from its stowed position once both rates are available.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(246, 791, 1428, 663, 79);
  ctx.clip();
  ctx.translate(arcCenter.x, arcCenter.y);
  ctx.rotate(angle(incidents.gain));
  ctx.translate(0, (1 - read) * 570);
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(-2.8, -tickRadius + 4);
  ctx.lineTo(2.8, -tickRadius + 4);
  ctx.lineTo(21, 0);
  ctx.closePath();
  ctx.fillStyle = '#a83b27';
  ctx.fill();
  line(ctx, 1.5, -tickRadius + 12, 6, -255, 2.6, '#d67c53');
  ctx.restore();

  const groups = setting >= .5 ? messages.groups : incidents.groups;
  fraction(ctx, 594, 'Original query', groups[0], rawOn, enrolled);
  fraction(ctx, 1326, 'Rewrite', groups[1], rewriteOn, enrolled);
}

function draw(ctx, clock) {
  const { index, reveal } = clock;
  const cue = (i, phrase, span) => index > i ? 1 : index < i ? 0 : ease(reveal(phrase, span));
  const trace = cue(1, 'Follow the wires', 1.9);
  const firstPan = cue(2, 'We randomly assign each incident', 2.5);
  const backToRelay = cue(5, 'Follow those rows back', 1.75);
  const finalPan = cue(6, 'Each incident got one random assignment', 1.85);
  const down = firstPan * (1 - backToRelay * (1 - finalPan));
  const enrolled = cue(2, 'two thousand independent incidents', .6);
  const rawOn = cue(3, 'With the original query', .55);
  const rewriteOn = cue(3, 'With the rewrite', .55);
  const read = cue(3, 'forty-two percent did', 1.0);
  const tipsOn = cue(3, 'four percentage points', .8);
  const toMessages = cue(4, 'let the meter count', 1.25);
  const toIncidents = cue(6, 'Count each incident once', 1.45);
  const setting = toMessages * (1 - toIncidents);

  ctx.fillStyle = gradient(ctx, 0, 0, 1920, 1080, [[0, '#29312c'], [.48, '#1c2420'], [1, '#101814']]);
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  const zoom = mix(1.52, 1.07, trace);
  const cameraY = mix(mix(91, 220, trace), 1072, down);
  ctx.translate(960, 540);
  ctx.scale(zoom, zoom);
  ctx.translate(-960, -cameraY);
  cabinet(ctx);
  relay(ctx, clock);
  modeSelector(ctx, setting);
  gauge(ctx, { setting, read, rawOn, rewriteOn, tipsOn, enrolled });
  ctx.restore();
}

function check() {
  assert.deepEqual(incidents.groups.map(g => [g.resolved, g.rows]), [[760, 2000], [840, 2000]]);
  assert.deepEqual(messages.groups.map(g => [g.resolved, g.rows]), [[3040, 8000], [3360, 8000]]);
  for (const [i, g] of messages.groups.entries()) assert.equal(g.resolved / g.rows, incidents.groups[i].rate);
  assert.ok(Math.abs(incidents.gain - 4) < 1e-12);
  assert.equal(messages.gain, incidents.gain);
  assert.equal(messages.se * 2, incidents.se);
  assert.deepEqual([incidents.low, incidents.high, messages.low, messages.high].map(v => v.toFixed(1)), ['1.0', '7.0', '2.5', '5.5']);
}

export default { title: 'Four lights, one incident', beats, draw, check };
