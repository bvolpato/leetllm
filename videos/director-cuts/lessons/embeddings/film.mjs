import assert from 'node:assert/strict';

// The two support tickets use the charge fixture from the course lesson.
const row = Object.freeze([0.8, 0.2]);
const tickets = [
  {
    noun: 'invoice',
    phrase: 'charge on the invoice',
    clue: [0.2, 1],
    ink: '#852f43',
    cover: '#edac94',
    pocket: '#cd7f6d',
  },
  {
    noun: 'phone',
    phrase: 'charge the phone',
    clue: [1, 0.1],
    ink: '#213c75',
    cover: '#afc1e6',
    pocket: '#8ba5d4',
  },
];
const ink = '#242d3b',
  paper = '#faf4e4',
  lookupInk = '#263556';
const middle = (a, b) => a.map((v, i) => (v + b[i]) / 2);
const cosine = (a, b) => (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
const guideFor = (v) => (cosine(v, tickets[0].clue) > cosine(v, tickets[1].clue) ? 0 : 1);
const stateFor = (i) => middle(row, tickets[i].clue);
const printed = (v) => '(' + v.map((n) => Number(n.toFixed(2))).join(', ') + ')';
const ease = (n) => {
  const t = Math.max(0, Math.min(1, n));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

const beats = [
  {
    id: 'pockets',
    say: 'A twelve-dollar charge. A phone down to two percent. Watch where the two requests land.',
    hold: 0.9,
  },
  {
    id: 'wrong-book',
    say: 'The person asking about their bill just got instructions for charging a phone. Search kept one word from each request. Charge.',
    hold: 0.7,
  },
  {
    id: 'ink-ring',
    say: 'Charge has one token ID. Look up that ID in the embedding table. Its row gives two coordinates, the same starting point for both requests.',
    hold: 0.6,
  },
  {
    id: 'sightline',
    say: 'The two guides sit at invoice and phone on this map. Look from zero through charge. The phone guide takes the smaller turn. Cosine similarity gives the higher score to the closer direction.',
    hold: 0.6,
  },
  {
    id: 'strip',
    say: 'Take the billing request. This time, let its copy of charge pick up a clue from the message. Lay a strip from charge to invoice. In this example, each end gets half the weight.',
    hold: 0.7,
  },
  {
    id: 'crease',
    say: 'Fold invoice back onto charge. See the crease? On each axis, the crease marks the average of the two end values. That gives charge a new position in this request.',
    hold: 0.7,
  },
  {
    id: 'read-crease',
    say: 'Look from zero again, this time through the crease. Which guide takes the smaller turn?',
    hold: 1.1,
  },
  {
    id: 'second-fold',
    say: 'The invoice guide wins. Now try the phone request. Start at the same ring and fold phone back onto charge. Watch where this crease falls.',
    hold: 0.9,
  },
  {
    id: 'two-marks',
    say: 'This one still points almost straight at the phone guide. Both requests read the same stored embedding. Mixing in a word from each message gave charge a different vector in each one.',
    hold: 0.8,
  },
  { id: 'refile', say: 'Only the billing request needs to move.', hold: 2.6 },
];

function rect(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  if (!radius) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}
function line(c, x, y, xx, yy, color, width = 2, dash = []) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.stroke();
  c.restore();
}
function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
function label(c, s, x, y, size, color = ink, family = 'Sans', weight = 400, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}
function path(c, points, fill, stroke, width = 2) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function curve(c, color, width, start, curves) {
  c.beginPath();
  c.moveTo(...start);
  for (const control of curves) c.bezierCurveTo(...control);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}
function grain(c, x, y, w, h, count, color) {
  let seed = 43;
  const unit = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  c.fillStyle = color;
  for (let i = 0; i < count; i++) c.fillRect(x + unit() * w, y + unit() * h, 1 + 3 * unit(), 1.4);
}
function shadow(c, alpha, blur, y) {
  c.shadowColor = 'rgba(43,32,49,' + alpha + ')';
  c.shadowBlur = blur;
  c.shadowOffsetX = y * 0.45;
  c.shadowOffsetY = y;
}
function desk(c) {
  const g = c.createLinearGradient(0, 0, 1780, 1080);
  g.addColorStop(0, '#f2e8dd');
  g.addColorStop(0.65, '#dbceca');
  g.addColorStop(1, '#c8bbc0');
  rect(c, 0, 0, 1920, 1080, g);
  grain(c, 0, 0, 1920, 1080, 1650, '#725d6816');
}

// Two-color illustrations printed on the guide covers and on the loose request.
function invoiceArt(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(-0.085);
  const maroon = tickets[0].ink;
  c.save();
  c.translate(12, 13);
  path(
    c,
    [
      [-134, -97],
      [132, -97],
      [132, 103],
      [-134, 103],
    ],
    '#ab655955',
  );
  c.restore();
  const edge = [
    [-138, -103],
    [133, -103],
    [133, 90],
  ];
  for (let i = 0; i < 12; i++) edge.push([121 - 22 * i, 103], [111 - 22 * i, 92]);
  edge.push([-138, 98]);
  path(c, edge, '#fff2cf', maroon, 3.5);
  label(c, 'INVOICE', -108, -48, 25, maroon, 'Mono', 600);
  line(c, -107, -26, 103, -26, maroon, 3);
  label(c, '$12.00', -110, 49, 58, maroon, 'Serif', 600);
  for (let i = 0; i < 7; i++) line(c, 56 + i * 7, -86, 46 + i * 7, -65, maroon, 2);
  c.restore();
}
function phoneArt(c, x, y, scale) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const navy = tickets[1].ink;
  c.save();
  c.rotate(-0.13);
  rect(c, -90, -110, 135, 200, '#5e77a5', 20);
  rect(c, -97, -118, 135, 202, navy, 20);
  rect(c, -88, -110, 117, 185, '#e2e6e9', 14);
  rect(c, -52, -107, 46, 6.5, navy, 3);
  rect(c, -61, -46, 62, 30, navy, 4);
  rect(c, 0, -38, 5, 13, navy, 2);
  rect(c, -56, -41, 52, 20, '#e2e6e9');
  rect(c, -54, -39, 6, 16, '#a32941');
  label(c, '2%', -29, 35, 54, navy, 'Mono', 500, 'center');
  rect(c, -49, 62, 39, 4, navy, 2);
  c.restore();
  const start = [159, 70],
    arc = [
      [159, 149, 62, 130, 78, 87],
      [94, 46, 178, 61, 203, 19],
    ];
  curve(c, navy, 11, start, arc);
  curve(c, '#d2dfef', 5, start, arc);
  c.save();
  c.translate(159, 72);
  c.rotate(-0.09);
  rect(c, -17, -31, 34, 36, navy, 6);
  rect(c, -11, -26, 22, 26, '#eaf1f6', 3);
  rect(c, -12, -48, 24, 20, navy, 4);
  rect(c, -8, -44, 16, 9, '#d2dfef', 2);
  for (let i = 0; i < 3; i++) line(c, -8, 8 + i * 4, 8, 8 + i * 4, navy, 3);
  c.restore();
  c.restore();
}

const bookX = [158, 1044],
  bookY = 98,
  bookW = 698,
  bookH = 805;
function book(c, i) {
  const t = tickets[i],
    x = bookX[i],
    y = bookY;
  c.save();
  c.translate(x, y);
  c.save();
  shadow(c, 0.23, 21, 18);
  rect(c, 0, 0, bookW, bookH, t.ink, 7);
  c.restore();
  rect(c, 6, 9, bookW - 7, bookH - 12, '#ede0c9', 6);
  for (let k = 0; k < 5; k++)
    line(c, 20, bookH - 6 - k * 2, bookW - 10, bookH - 6 - k * 2, '#998e8260', 1);
  rect(c, -2, -3, bookW - 5, bookH - 14, t.cover, 5);
  rect(c, 0, 0, 28, bookH - 18, t.ink, 3);
  line(c, 34, 1, 34, bookH - 18, t.ink, 2);
  grain(c, 39, 10, bookW - 63, bookH - 33, 850, '#45384f24');
  label(c, i ? 'Charging' : 'Reading', 68, 115, 83, t.ink, 'Serif', 600);
  label(c, i ? 'your phone' : 'your bill', 68, 202, 83, t.ink, 'Serif', 600);
  line(c, 69, 231, bookW - 56, 231, t.ink, 2);
  if (i) phoneArt(c, 309, 358, 0.94);
  else invoiceArt(c, 350, 365, 1.02);
  c.restore();
}
const ticketX = (i) => bookX[i] + 77;
function request(c, i, x, y, rotation, underline = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.save();
  shadow(c, 0.21, 9, 5);
  rect(c, 0, 0, 555, 180, '#fff9e9', 5);
  c.restore();
  rect(c, 0, 0, 12, 180, tickets[i].ink);
  label(c, tickets[i].phrase, 31, 54, 46, ink, 'Serif', 600);
  line(c, 33, 76, 523, 76, '#a6a395', 1.5);
  if (underline > 0) {
    const width = c.measureText('charge').width;
    line(c, 31, 62, 31 + underline * width, 62, tickets[i].ink, 4);
  }
  c.restore();
}
function pocket(c, i) {
  const t = tickets[i],
    x = bookX[i],
    y = bookY;
  c.save();
  c.translate(x, y);
  const shape = [
    [43, 638],
    [141, 638],
    [165, 651],
    [528, 651],
    [554, 638],
    [654, 638],
    [654, 755],
    [43, 755],
  ];
  c.save();
  shadow(c, 0.17, 8, -3);
  path(c, shape, t.pocket);
  c.restore();
  path(c, shape, t.pocket, t.ink, 2);
  line(c, 55, 660, 55, 744, t.ink, 1.8, [7, 6]);
  line(c, 642, 660, 642, 744, t.ink, 1.8, [7, 6]);
  line(c, 55, 744, 642, 744, t.ink, 1.8, [7, 6]);
  grain(c, 57, 656, 580, 82, 165, '#48324227');
  c.restore();
}
function books(c, clock) {
  book(c, 0);
  book(c, 1);
  const end = clock.index === 9;
  const opening = clock.index === 0;
  const file = opening ? ease(clock.reveal('Watch where', 1.35)) : 1;
  const arrive = opening ? ease((clock.elapsed + 0.14) / 0.9) : 1;
  const phoneArrival = opening ? ease(clock.reveal('A phone down', 0.8)) : 1;
  const transfer = end ? ease((clock.elapsed - 0.16) / 2.05) : 0;
  const initial = guideFor(row),
    destination = guideFor(stateFor(0));
  const phoneY = bookY + 559,
    billY = bookY + 479;
  const underline = clock.index === 1 ? ease(clock.reveal('one word', 0.55)) : 0;
  const firstX = mix(ticketX(0) - 185 * (1 - arrive), ticketX(initial), file);
  const firstY = mix(billY - 56 + 30 * (1 - arrive), billY, file) - 103 * Math.sin(Math.PI * file);
  const dx = mix(firstX, ticketX(destination), transfer);
  const dy = mix(firstY, phoneY - 8, transfer) - 237 * Math.sin(Math.PI * transfer);
  request(
    c,
    0,
    dx,
    dy,
    mix(-0.021, 0.015, transfer) - 0.085 * Math.sin(Math.PI * transfer),
    underline,
  );
  const phoneX = ticketX(guideFor(stateFor(1))) + 7 + 265 * (1 - phoneArrival);
  request(c, 1, phoneX, phoneY - 50 * (1 - file), 0.012 + 0.04 * (1 - phoneArrival), underline);
  pocket(c, 0);
  pocket(c, 1);
}

// Every mark lies on the same equal-scale plane, including during the paper fold.
const origin = [175, 846],
  scale = 717;
const point = (v) => [origin[0] + scale * v[0], origin[1] - scale * v[1]];
function endpaper(c) {
  c.save();
  shadow(c, 0.17, 22, 13);
  rect(c, 69, 54, 1780, 921, '#fbf4e2', 3);
  c.restore();
  const wash = c.createLinearGradient(70, 55, 1820, 970);
  wash.addColorStop(0, '#fdf6e4');
  wash.addColorStop(0.63, '#f7edda');
  wash.addColorStop(1, '#ece1c9');
  rect(c, 70, 55, 1777, 917, wash);
  // The paper folds open along the right margin of the plotting area.
  const hinge = c.createLinearGradient(998, 0, 1080, 0);
  hinge.addColorStop(0, '#5c483900');
  hinge.addColorStop(0.65, '#7967492a');
  hinge.addColorStop(0.69, '#fffcf3');
  hinge.addColorStop(1, '#d3c5a600');
  rect(c, 998, 55, 82, 917, hinge);
  grain(c, 72, 58, 1770, 908, 1080, '#65582b1a');
}
function graph(c) {
  const [x, y] = origin;
  for (let n = 0; n <= 4; n++) {
    const k = (scale * n) / 4;
    line(c, x + k, y, x + k, y - scale, '#9d978837', 1.5, [2, 8]);
    line(c, x, y - k, x + scale, y - k, '#9d978837', 1.5, [2, 8]);
  }
  line(c, x, y, x + scale + 49, y, '#6d706c', 2);
  line(c, x, y + 4, x, y - scale - 35, '#6d706c', 2);
  label(c, '0', x - 13, y + 33, 31, ink, 'Mono', 400, 'right');
  label(c, '1', x - 13, y - scale + 11, 30, ink, 'Mono', 400, 'right');
  label(c, '1', x + scale, y + 35, 30, ink, 'Mono', 400, 'center');
  for (const t of tickets) {
    const [gx, gy] = point(t.clue);
    line(c, x, y, gx, gy, t.ink + 'bb', 4, [11, 8]);
    dot(c, gx, gy, 8, t.ink);
  }
  const [ix, iy] = point(tickets[0].clue),
    [px, py] = point(tickets[1].clue);
  label(c, 'invoice', ix + 20, iy + 8, 43, tickets[0].ink, 'Serif', 600);
  label(c, 'phone', px - 7, py + 50, 40, tickets[1].ink, 'Serif', 600);
}
function ring(c) {
  const [x, y] = point(row);
  c.beginPath();
  c.arc(x, y, 12, 0, Math.PI * 2);
  c.strokeStyle = lookupInk;
  c.lineWidth = 5;
  c.stroke();
  line(c, x + 11, y - 12, x + 39, y - 39, lookupInk, 2);
  label(c, 'charge', x + 38, y - 48, 39, lookupInk, 'Serif', 600);
}

// Lay the tape from the shared row to the clue. Its far half rotates in depth
// about the midpoint. A transverse shadow makes the foreshortening visible.
function tape(c, i, extent, fold, fade = 1) {
  if (extent <= 0 || fade <= 0) return;
  const a = point(row),
    b = point(tickets[i].clue),
    t = tickets[i];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
    half = length / 2;
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const w = i ? 18 : 25;
  c.save();
  c.globalAlpha *= fade;
  c.translate(...a);
  c.rotate(angle);
  const end = length * extent,
    hinge = Math.min(end, half);
  rect(c, 0, -w, hinge, 2 * w, i ? '#bccde6' : '#ecc1ac');
  line(c, 0, -w, hinge, -w, t.ink, 2);
  line(c, 0, w, hinge, w, t.ink, 2);
  for (let x = 12; x < hinge - 5; x += 15) line(c, x, w - 9, x, w - 2, t.ink, 1.5);
  if (end > half) {
    const omega = fold * Math.PI,
      far = half + (end - half) * Math.cos(omega);
    const lift = -Math.sin(omega) * (i ? 15 : 60);
    const corners = [
      [half, -w],
      [far, -w + lift],
      [far, w + lift],
      [half, w],
    ];
    if (fold > 0 && fold < 1) {
      c.save();
      c.translate(3, Math.abs(lift) * 0.38);
      path(c, corners, '#52432c29');
      c.restore();
    }
    path(c, corners, fold < 0.5 ? (i ? '#bccde6' : '#ecc1ac') : '#fcf1d4', t.ink, 2);
    if (fold > 0.5) {
      for (let k = 0.1; k < 0.94; k += 0.1) {
        const p = mix(half, far, k),
          v = lift * k;
        line(c, p, -w + 4 + v, p, w - 4 + v, t.ink + '49', 1.5);
      }
    }
    if (fold > 0.02) line(c, half, -w - 3, half, w + 3, t.ink, 3, [4, 3]);
  }
  c.restore();
}
function sight(c, v, amount, color, alpha = 1) {
  if (amount <= 0) return;
  const [x, y] = origin,
    theta = Math.atan2(v[1], v[0]);
  const winner = tickets[guideFor(v)],
    guideTheta = Math.atan2(winner.clue[1], winner.clue[0]);
  const length = scale * Math.hypot(...v);
  const reach = (length + 51) * amount;
  c.save();
  c.globalAlpha *= alpha;
  line(c, x, y, x + Math.cos(theta) * reach, y - Math.sin(theta) * reach, color, 5.5);
  if (amount > 0.85) {
    const r = 178;
    c.globalAlpha *= ease((amount - 0.85) / 0.15);
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, r, Math.min(-theta, -guideTheta), Math.max(-theta, -guideTheta));
    c.closePath();
    c.fillStyle = color + '20';
    c.fill();
    c.beginPath();
    c.arc(x, y, r, Math.min(-theta, -guideTheta), Math.max(-theta, -guideTheta));
    c.strokeStyle = color;
    c.lineWidth = 4;
    c.stroke();
  }
  c.restore();
}
function creaseMark(c, i, alpha) {
  if (alpha <= 0) return;
  const [x, y] = point(stateFor(i));
  c.save();
  c.globalAlpha *= alpha;
  dot(c, x, y, 14, paper);
  dot(c, x, y, 9, tickets[i].ink);
  c.restore();
}
function readout(c, i, fold, view, sighted, rowReveal) {
  const t = tickets[i];
  const cx = 1446;
  c.save();
  shadow(c, 0.18, 14, 7);
  const boundary = [
    [1148, 151],
    [1743, 151],
    [1743, 837],
  ];
  for (let j = 0; j < 27; j++) boundary.push([1732 - j * 22, 847], [1721 - j * 22, 837]);
  boundary.push([1148, 843]);
  path(c, boundary, '#fffaee');
  c.restore();
  rect(c, 1148, 152, 595, 12, view === 'stored' ? lookupInk : t.ink);
  if (view === 'stored') {
    invoiceArt(c, cx - 116, 302, 0.64);
    phoneArt(c, cx + 106, 300, 0.62);
    label(c, 'charge', cx, 494, 102, lookupInk, 'Serif', 600, 'center');
    label(c, 'Token ID 0', cx, 562, 35, ink, 'Sans', 400, 'center');
    if (rowReveal > 0) {
      c.save();
      c.globalAlpha *= rowReveal;
      line(c, 1204, 598, 1686, 598, '#989380', 1.5);
      label(c, 'Stored embedding', cx, 666, 36, ink, 'Sans', 400, 'center');
      label(c, printed(row), cx, 750, 63, lookupInk, 'Mono', 500, 'center');
      c.restore();
    }
    return;
  }
  if (i === 0) invoiceArt(c, cx, 310, 0.93);
  else phoneArt(c, cx - 21, 305, 0.93);
  label(c, 'charge', cx, 496, 92, t.ink, 'Serif', 600, 'center');
  label(c, i ? 'the phone' : 'on the invoice', cx, 560, 52, ink, 'Serif', 400, 'center');
  line(c, 1204, 601, 1686, 601, '#989380', 1.5);
  if (fold < 1) {
    label(c, 'charge', 1197, 665, 36, lookupInk, 'Serif', 600);
    label(c, t.noun, 1197, 731, 36, t.ink, 'Serif', 600);
    label(c, printed(row), 1689, 665, 42, ink, 'Mono', 400, 'right');
    label(c, printed(t.clue), 1689, 731, 42, ink, 'Mono', 400, 'right');
  } else {
    label(c, 'At the crease', cx, 657, 36, ink, 'Sans', 400, 'center');
    label(c, printed(stateFor(i)), cx, 727, 56, t.ink, 'Mono', 500, 'center');
    if (sighted > 0) {
      c.save();
      c.globalAlpha *= sighted;
      const winner = guideFor(stateFor(i));
      label(
        c,
        tickets[winner].noun + ' cosine  ' + cosine(stateFor(i), tickets[winner].clue).toFixed(3),
        cx,
        793,
        31,
        t.ink,
        'Mono',
        400,
        'center',
      );
      c.restore();
    }
  }
}
function map(c, clock) {
  const b = clock.index,
    cue = (phrase, span) => ease(clock.reveal(phrase, span));
  let i = 0,
    extent = 0,
    fold = 0,
    beam = 0;
  if (b === 3) beam = cue('Look from zero', 1.2);
  if (b === 4) extent = cue('Lay a strip', 1.6);
  if (b === 5) {
    extent = 1;
    fold = cue('Fold invoice', 1.8);
  }
  if (b === 6) {
    extent = 1;
    fold = 1;
    beam = cue('Look from zero', 1.1);
  }
  if (b === 7) {
    if (clock.reveal('Now try', 0) === 0) {
      extent = 1;
      fold = 1;
      beam = 1;
    } else {
      i = 1;
      extent = cue('Start at the same ring', 1.1);
      fold = cue('fold phone', 1.45);
      beam = cue('Watch where', 1.05);
    }
  }
  if (b === 8) {
    i = 1;
    extent = 1;
    fold = 1;
    beam = 1;
  }
  endpaper(c);
  graph(c);
  if (i === 1) {
    sight(c, stateFor(0), 1, tickets[0].ink, 0.24);
    creaseMark(c, 0, 0.65);
  }
  tape(c, i, extent, fold, 1 - 0.62 * beam);
  const state = b === 3 ? row : stateFor(i);
  sight(c, state, beam, b === 3 ? lookupInk : tickets[i].ink);
  creaseMark(c, i, fold === 1 ? 1 : 0);
  const rowReveal = b === 2 ? cue('Its row gives', 0.55) : 1;
  const locate = b === 2 ? cue('two coordinates', 1.3) : 1;
  if (b === 2 && locate > 0) {
    const [x, y] = point(row);
    const rise = ease((locate - 0.45) / 0.55);
    const xx = mix(origin[0], x, ease(locate / 0.5));
    const yy = mix(origin[1], y, rise);
    line(c, origin[0], origin[1], xx, origin[1], lookupInk, 5);
    line(c, xx, origin[1], xx, yy, lookupInk, 4, [7, 6]);
    dot(c, xx, yy, 6, lookupInk);
  }
  if (locate === 1) ring(c);
  readout(c, i, fold, b < 4 ? 'stored' : 'context', b >= 7 && fold === 1 ? beam : 0, rowReveal);
}
function draw(c, clock) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  desk(c);
  if (clock.index < 2 || clock.index === 9) books(c, clock);
  else map(c, clock);
  c.restore();
}
function check() {
  const rounded = (a) => a.map((v) => Number(v.toFixed(3)));
  assert.deepEqual(rounded(stateFor(0)), [0.5, 0.6]);
  assert.deepEqual(rounded(stateFor(1)), [0.9, 0.15]);
  for (const [v, expected] of [
    [row, [0.428, 0.989]],
    [stateFor(0), [0.879, 0.713]],
    [stateFor(1), [0.355, 0.998]],
  ]) {
    assert.deepEqual(rounded(tickets.map((t) => cosine(v, t.clue))), expected);
  }
  assert.deepEqual(
    tickets.map(() => guideFor(row)),
    [1, 1],
  );
  assert.deepEqual(
    tickets.map((_, i) => guideFor(stateFor(i))),
    [0, 1],
  );
  tickets.forEach((t, i) => {
    const onStrip = middle(point(row), point(t.clue));
    assert.ok(Math.hypot(...point(stateFor(i)).map((n, j) => n - onStrip[j])) < 1e-8);
  });
}
export default { title: 'Which guide should “charge” open?', beats, draw, check };
