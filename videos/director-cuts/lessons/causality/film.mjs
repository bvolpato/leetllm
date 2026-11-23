import assert from 'node:assert/strict';
import { responseTypePairing } from '../../../films/causality/model.mjs';

const fixture = responseTypePairing(0);
const total = fixture.total;
const human = fixture.controlSuccess;
const assistant = fixture.assistantSuccess;
const maximumHarm = Math.min(human, total - assistant);
const pitch = 2 * Math.PI / total;
const north = -Math.PI / 2;
const gold = '#f4be64';
const blue = '#73d8f3';

const beats = [
  {
    id: 'one-notch',
    say: 'Two lights for one support ticket. Gold means a human would close it within a day. Blue means the assistant would too. We can imagine both outcomes. A real ticket takes just one route.',
    hold: 0.55,
  },
  {
    id: 'a-hundred',
    say: 'Now picture a hundred tickets around the dial. Suppose the assistant would close seventy-eight within a day, and the human team would close sixty-eight. Could switching to the assistant leave anyone waiting?',
    hold: 1.15,
  },
  {
    id: 'nested',
    say: 'Follow the gold lights. Each has a blue light beside it. With this pairing, everyone who would get a resolution from a human still gets one. Ten more tickets close.',
    hold: 0.8,
  },
  {
    id: 'one-click',
    say: 'Watch the brass frame again. Move the blue ring one notch to try another possible pairing. The totals hold. This time a human would close the ticket, and the assistant would leave it open.',
    hold: 0.85,
  },
  {
    id: 'turn',
    say: 'How many tickets could switch like that? Keep turning the ring. Watch the stretch of gold with dark slots beside it grow.',
    hold: 1.25,
  },
  {
    id: 'limit',
    say: 'Twenty-two. Every ticket the assistant would leave open is now paired with a human resolution. To hurt one more, we would need another dark slot on the blue ring.',
    hold: 0.8,
  },
  {
    id: 'balance',
    say: 'On the other side, thirty-two tickets would close only with the assistant. Thirty-two gained, twenty-two lost. That still gives ten extra closures. Those same totals fit anything from zero to twenty-two tickets harmed.',
    hold: 2.25,
  },
];

// A position on the fixed case is one ticket. Turning the outer mask
// permutes the assistant outcomes across tickets while preserving both totals.
function pairing(shift) {
  const counts = { always: 0, helped: 0, harmed: 0, never: 0 };
  for (let ticket = 0; ticket < total; ticket++) {
    const a = (ticket - shift + total) % total < assistant;
    const h = ticket < human;
    const type = h ? (a ? 'always' : 'harmed') : (a ? 'helped' : 'never');
    counts[type]++;
  }
  return counts;
}

function check() {
  assert.deepEqual([total, assistant, human], [100, 78, 68]);
  assert.equal(maximumHarm, 22);
  for (let shift = 0; shift <= maximumHarm; shift++) {
    const counts = pairing(shift);
    assert.deepEqual(counts, responseTypePairing(shift).counts);
    assert.equal(counts.helped - counts.harmed, 10);
  }
  assert.deepEqual(pairing(maximumHarm), { always: 46, helped: 32, harmed: 22, never: 0 });
}

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const u = clamp(x); return u * u * (3 - 2 * u); };
const mix = (a, b, u) => a + (b - a) * u;

function state(clock) {
  const { index, elapsed, reveal } = clock;
  let closeup = 0;
  let shift = 0;
  if (index === 0) closeup = 1;
  if (index === 1) closeup = 1 - smooth(elapsed / 2.2);
  if (index === 3) {
    closeup = smooth(elapsed / 1.4);
    shift = smooth(reveal('Move the blue ring', 0.85));
  }
  if (index === 4) {
    closeup = 1 - smooth(elapsed / 1.9);
    const travel = 1 + (maximumHarm - 1) * smooth(reveal('Keep turning', 3.6));
    // Each notch briefly comes back into register as the wheel turns.
    shift = Math.floor(travel) + smooth((travel % 1 - 0.08) / 0.84);
  }
  if (index > 4) shift = maximumHarm;
  return {
    index, closeup, shift,
    singleTicket: index === 0 ? 1 : index === 1 ? closeup : 0,
    lightGold: index === 0 ? smooth((elapsed + 0.035) / 0.52) : 1,
    lightBlue: index === 0 ? smooth((elapsed - 0.24) / 0.52) : 1,
    revealRest: index === 0 ? 0 : index === 1 ? smooth(elapsed / 2.2) : 1,
    traceGold: index === 2 ? smooth(reveal('Follow the gold lights', 2.9)) : 0,
    centerCount: index < 2 ? 0 : index === 2 ? smooth(reveal('With this pairing', 0.7)) : 1,
    arc: index < 4 ? 0 : index === 4 ? smooth(elapsed / 1.9) : 1,
    help: index === 6 ? smooth(reveal('On the other side', 1.65)) : 0,
    range: index === 6 ? smooth(reveal('Those same totals', 1.0)) : 0,
    counts: pairing(Math.round(shift)),
  };
}

function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
}

function stroke(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function lettering(ctx, value, x, y, size, color, family = 'Sans', align = 'left', weight = 400) {
  ctx.textAlign = align;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
}

function brushed(ctx, radius, stops) {
  const g = ctx.createLinearGradient(-radius, -radius, radius, radius);
  for (const [p, color] of stops) g.addColorStop(p, color);
  return g;
}

function circularLine(ctx, radius, color, width, from = 0, to = 2 * Math.PI) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, from, to);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function sector(ctx, ri, ro, start, end, color) {
  ctx.beginPath();
  ctx.arc(0, 0, ro, start, end);
  ctx.arc(0, 0, ri, end, start, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function screw(ctx, x, y, r, tilt) {
  circle(ctx, x, y + 1.8, r + 1, '#14201f');
  circle(ctx, x, y, r, brushed(ctx, r * 8, [[0, '#52605b'], [0.5, '#c0b99e'], [1, '#55584a']]));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  stroke(ctx, -r * 0.65, 1, r * 0.65, 1, '#e0d7b3', 1.8);
  stroke(ctx, -r * 0.65, 0, r * 0.65, 0, '#30362e', 1.9);
  ctx.restore();
}

function mask(ctx, count, inner, outer, shift, light, s, tint) {
  const onEdge = tint === gold ? '#9f682e' : '#34798e';
  const glass = tint === gold ? '#ffe4a7' : '#c8f3ff';
  for (let i = 0; i < total; i++) {
    const a = north + (i + shift) * pitch;
    sector(ctx, inner - 2.2, outer + 2.2, a - pitch * 0.44, a + pitch * 0.44, '#17221f');
    sector(ctx, inner, outer, a - pitch * 0.39, a + pitch * 0.39, '#34413e');
    sector(ctx, inner + 1.3, outer - 1.4, a - pitch * 0.32, a + pitch * 0.32, '#1e2929');
    if (i >= count) continue;
    const power = light * (i === 0 ? 1 : clamp((s.revealRest - i / total * 0.76) * 6));
    if (power === 0) continue;
    const front = mix(inner, outer, power);
    sector(ctx, inner, front, a - pitch * 0.38, a + pitch * 0.38, onEdge);
    sector(ctx, inner + 1.3, Math.max(inner + 1.3, front - 1), a - pitch * 0.30, a + pitch * 0.30, tint);
    sector(ctx, inner + 2, Math.max(inner + 2, front - 1.2), a - pitch * 0.29, a - pitch * 0.18, glass);
  }
}

function sight(ctx) {
  // The fork belongs to the stationary housing. Its feet straddle ticket one.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(8, -407);
    ctx.lineTo(21, -407);
    ctx.lineTo(12.5, -273);
    ctx.lineTo(6.3, -273);
    ctx.lineTo(6.3, -279);
    ctx.lineTo(10, -279);
    ctx.lineTo(16, -398);
    ctx.lineTo(8, -398);
    ctx.closePath();
    ctx.fillStyle = '#e9c783';
    ctx.strokeStyle = '#584e39';
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  lettering(ctx, '01', 0, -418, 15, '#f1deb7', 'Mono', 'center');
}

function bracket(ctx, from, count, radius, color, opacity) {
  if (count <= 0 || opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  const a = north + (from - 0.48) * pitch;
  const b = a + count * pitch;
  circularLine(ctx, radius, color, 4.3, a, b);
  for (const angle of [a, b]) {
    stroke(ctx, (radius - 7) * Math.cos(angle), (radius - 7) * Math.sin(angle),
      (radius + 5) * Math.cos(angle), (radius + 5) * Math.sin(angle), color, 3);
  }
  ctx.restore();
}

function pointer(ctx, s) {
  const angle = s.shift * pitch;
  if (angle > 0) {
    sector(ctx, 225, 242, north, north + angle, '#c99c55');
  }
  ctx.save();
  ctx.rotate(angle);
  // The hand marks the first lit slot on the blue ring.
  ctx.beginPath();
  ctx.moveTo(-11, 20);
  ctx.lineTo(-8, -148);
  ctx.lineTo(0, -246);
  ctx.lineTo(8, -148);
  ctx.lineTo(11, 20);
  ctx.closePath();
  ctx.fillStyle = '#b7bdac';
  ctx.strokeStyle = '#071e1e';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -244);
  ctx.lineTo(6.8, -147);
  ctx.lineTo(9.8, 18);
  ctx.lineTo(0, 18);
  ctx.closePath();
  ctx.fillStyle = '#768f86';
  ctx.fill();
  stroke(ctx, 0, -212, 0, -56, blue, 2.6);
  sector(ctx, 390, 395, north - pitch * 0.39, north + pitch * 0.39, blue);
  ctx.restore();
  circle(ctx, 1, 2, 28, '#0b201e');
  circle(ctx, 0, 0, 27, brushed(ctx, 28, [[0, '#f4deb0'], [0.44, '#b1a177'], [1, '#716347']]));
  screw(ctx, 0, 0, 13, -0.65);
}

function dial(ctx, s) {
  const brass = brushed(ctx, 439, [[0, '#f5d699'], [0.18, '#988555'], [0.49, '#665935'], [0.7, '#d4b976'], [1, '#635638']]);
  circle(ctx, 5, 12, 445, '#15201d');
  circle(ctx, 0, 0, 443, brass);
  circle(ctx, 0, 0, 434, '#39413b');
  circularLine(ctx, 437.5, '#e2c78d', 1.4);
  circularLine(ctx, 432, '#111f20', 2.2);
  circle(ctx, 0, 0, 429, brushed(ctx, 429, [[0, '#59615a'], [0.27, '#3a4640'], [0.58, '#313c38'], [1, '#192b2b']]));
  for (let i = 0; i < total; i++) {
    const a = north + (i - 0.5) * pitch;
    const r = i % 10 === 0 ? 397 : i % 5 === 0 ? 402 : 406;
    stroke(ctx, r * Math.cos(a), r * Math.sin(a), 411 * Math.cos(a), 411 * Math.sin(a), '#a7a791', i % 5 === 0 ? 2.2 : 1.3);
  }

  circularLine(ctx, 393, '#919585', 1);
  circularLine(ctx, 340, '#131e1f', 4);
  circularLine(ctx, 337.5, '#a19b7c', 1);
  circularLine(ctx, 275, '#141f20', 3);
  mask(ctx, human, 282, 331, 0, s.lightGold, s, gold);
  mask(ctx, assistant, 347, 389, s.shift, s.lightBlue, s, blue);

  circle(ctx, 0, 0, 264, brass);
  circle(ctx, 0, 0, 258, brushed(ctx, 255, [[0, '#223833'], [0.5, '#17322f'], [1, '#102524']]));
  circularLine(ctx, 248, '#52605a', 1.2);
  for (const [x, y, tilt] of [[-165, -143, -0.5], [165, -143, 0.31], [0, 216, -0.8]]) {
    screw(ctx, x, y, 5.8, tilt);
  }

  pointer(ctx, s);
  if (s.centerCount > 0 && s.closeup < 0.5) {
    ctx.save();
    ctx.globalAlpha = s.centerCount * (1 - smooth(s.closeup * 2));
    lettering(ctx, s.counts.harmed, 0, 136, 117, '#ffdda1', 'Serif', 'center');
    lettering(ctx, 'Human only', 0, 182, 39, '#f0dfbc', 'Sans', 'center');
    ctx.restore();
  }
  if (s.traceGold > 0) {
    bracket(ctx, 0, human * s.traceGold, 270, gold, 1 - s.centerCount);
  }
  bracket(ctx, 0, s.shift, 399, gold, s.arc);
  bracket(ctx, human, s.counts.helped * s.help, 399, blue, s.help);
  sight(ctx);
}

function paper(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(1148, -12);
  ctx.lineTo(1925, -12);
  ctx.lineTo(1925, 1092);
  ctx.lineTo(1132, 1092);
  ctx.closePath();
  ctx.shadowColor = '#07141085';
  ctx.shadowBlur = 23;
  ctx.shadowOffsetX = -7;
  const g = ctx.createLinearGradient(1130, 0, 1920, 1080);
  g.addColorStop(0, '#e2dbc5');
  g.addColorStop(0.15, '#f2ebd6');
  g.addColorStop(1, '#e9dfc6');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

function notebook(ctx, s) {
  paper(ctx);
  const start = 1224, end = 1830, ink = '#273c36';
  const single = s.singleTicket > 0.5;
  lettering(ctx, single ? 'One ticket' : '100 tickets', start, 235, 93, ink, 'Serif');
  lettering(ctx, 'Would close within a day', start + 3, 321, 43, '#41534b');
  stroke(ctx, start + 3, 361, end, 361, '#7c816e', 2);
  const rows = [
    ['Assistant', assistant, '#26748b', s.lightBlue],
    ['Human', human, '#9c6123', s.lightGold],
  ];
  for (const [i, [label, n, color, power]] of rows.entries()) {
    const y = 462 + i * 116;
    ctx.fillStyle = color;
    ctx.fillRect(start + 3, y - 36, 14, 39);
    lettering(ctx, label, start + 38, y, 53, ink);
    if (single) {
      ctx.save();
      ctx.globalAlpha = power;
      lettering(ctx, 'Yes', end - 2, y, 51, color, 'Serif', 'right');
      ctx.restore();
    } else {
      lettering(ctx, n, end, y + 5, 79, color, 'Mono', 'right');
    }
  }
  stroke(ctx, start + 3, 621, end, 621, '#90917d', 1.5);
  if (s.help > 0 && s.range < 1) {
    ctx.save();
    ctx.globalAlpha = s.help * (1 - s.range);
    lettering(ctx, 'Assistant only', start + 3, 740, 48, ink, 'Serif');
    lettering(ctx, s.counts.helped, end, 740, 65, '#26748b', 'Mono', 'right');
    ctx.restore();
  }
  if (s.range > 0) {
    ctx.save();
    ctx.globalAlpha = s.range;
    lettering(ctx, 'Tickets harmed by switching', start + 3, 726, 40, ink);
    lettering(ctx, '0 to ' + maximumHarm, start + 1, 846, 105, '#794e25', 'Serif');
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const s = state(clock);
  ctx.save();
  const background = ctx.createRadialGradient(360, 230, 20, 610, 490, 940);
  background.addColorStop(0, '#40584e');
  background.addColorStop(0.62, '#2d453d');
  background.addColorStop(1, '#1b2e2a');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1920, 1080);

  const zoom = mix(1.08, 3.55, s.closeup);
  ctx.save();
  ctx.translate(mix(575, 606, s.closeup), mix(515, 467 + 335 * 3.55, s.closeup));
  ctx.scale(zoom, zoom);
  dial(ctx, s);
  ctx.restore();
  notebook(ctx, s);
  ctx.restore();
}

export default { title: 'Ten extra closures. How many tickets could be harmed?', beats, draw, check };
