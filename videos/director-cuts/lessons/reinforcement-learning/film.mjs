import assert from 'node:assert/strict';

// Payoffs from the routing-desk simulator, in reward points.
const discount = 0.9;
const askCost = -4;
const checkReward = 70;
const reviewCost = -18;
const reviewerReward = 80;
const unresolvedCost = -50;
const cases = 20;
const reply = askCost + discount * checkReward;
const left = askCost + unresolvedCost;
const review = reviewCost + discount * reviewerReward;
const meanForAsk = lost => ((cases - lost) * reply + lost * left) / cases;
const route = lost => meanForAsk(lost) > review ? 'ask' : 'review';
const lossPerCall = (reply - left) / cases;

const beats = [
  {
    id: 'on-the-line',
    say: 'An access request just rang in. The caller has no proof on file. We can ask for it, or put the call through to a reviewer.',
    hold: 0.8,
  },
  {
    id: 'the-price-of-asking',
    say: 'Suppose everyone sends valid proof when asked. In this simulator, asking costs four points. Once the proof is verified, approval earns seventy on the next step. A point one step later counts for nine tenths of a point now.',
    hold: 0.8,
  },
  {
    id: 'where-the-plug-goes',
    say: 'That gives us fifty-nine points for asking. Human review costs eighteen up front and earns eighty one step later. With the same discount, that comes to fifty-four. Where would you put the plug?',
    hold: 2.0,
  },
  {
    id: 'behind-the-shutters',
    say: 'Asking leads by five. Behind that lid are twenty equally likely futures for this call. So far, every shutter shows a verified reply.',
    hold: 0.9,
  },
  {
    id: 'the-caller-who-leaves',
    say: 'Watch the last shutter. Give the caller a one in twenty chance of leaving when asked for proof. We still spend four points asking. Closing the request unresolved costs another fifty. That red shutter is worth minus fifty-four.',
    hold: 1.0,
  },
  {
    id: 'the-cost-of-one-shutter',
    say: 'Nineteen replies still earn fifty-nine each. Replacing the twentieth reply with a lost call takes a hundred and thirteen points out of the total. Spread that loss across the twenty futures. What happens to our five-point lead?',
    hold: 1.65,
  },
  {
    id: 'the-next-call',
    say: 'The average drops by five point six five. Look down at the sockets. Asking is worth fifty-three point three five. Review still earns fifty-four.',
    hold: 1.75,
  },
  {
    id: 'connected',
    say: 'Our policy sends the next call to review. Nineteen shutters still show a reply. That one lost call gives review the higher expected return.',
    hold: 2.8,
  },
];

const clamp = v => Math.min(1, Math.max(0, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const cinch = v => 1 - Math.pow(1 - clamp(v), 3);
const tau = Math.PI * 2;

function stateAt(clock) {
  const {index, elapsed, speechDuration, reveal} = clock;
  function cue(beat, phrase, duration = 0.5) {
    if (index !== beat) return Number(index > beat);
    return smooth(reveal(phrase, duration));
  }
  function holdTravel(beat, duration) {
    if (index !== beat) return Number(index > beat);
    return smooth((elapsed - speechDuration + 0.10) / duration);
  }
  return {
    arrival: index === 0 ? cinch(elapsed / 0.64) : 1,
    introduce: cue(0, 'We can ask', 1.65),
    studyAsk: cue(1, 'Suppose everyone', 1.35),
    bothSockets: cue(2, 'Human review', 1.1),
    askCost: cue(1, 'asking costs four', 0.45),
    nextReward: cue(1, 'approval earns seventy', 0.45),
    discount: cue(1, 'counts for nine tenths', 0.45),
    askKnown: cue(2, 'That gives us', 0.45),
    reviewCost: cue(2, 'Human review costs eighteen', 0.4),
    reviewLater: cue(2, 'earns eighty', 0.45),
    reviewKnown: cue(2, 'that comes to', 0.5),
    plugIn: holdTravel(2, 1.15),
    lid: cue(3, 'Behind that lid', 1.55),
    last: cue(4, 'Give the caller', 0.87),
    abandonedPayoff: cue(4, 'That red shutter', 0.5),
    difference: cue(5, 'takes a hundred', 0.55),
    divide: cue(5, 'Spread that loss', 0.65),
    lossKnown: cue(6, 'The average drops', 0.5),
    averageKnown: cue(6, 'Look down', 0.7),
    transfer: holdTravel(6, 1.35),
  };
}

function rounded(ctx, x, y, w, h, radius, fill, stroke = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function disc(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  ctx.fillStyle = fill;
  ctx.fill();
}

function gradient(ctx, x1, y1, x2, y2, stops) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([t, color]) => paint.addColorStop(t, color));
  return paint;
}

function label(ctx, text, x, y, size, color, align = 'center', font = 'Sans', weight = 500) {
  ctx.font = `${weight} ${size}px "Lesson ${font}"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function screw(ctx, x, y, tilt = -0.6) {
  disc(ctx, x, y + 2, 6, '#100e0b');
  disc(ctx, x, y, 5.5, gradient(ctx, x - 3, y - 5, x + 3, y + 5,
    [[0, '#e6c78e'], [0.48, '#a48c62'], [1, '#574637']]));
  line(ctx, x - 3.7, y - tilt * 3.7, x + 3.7, y + tilt * 3.7, '#4f4030', 1.8);
}

function brass(ctx, x, y, size) {
  return gradient(ctx, x - size, y - size, x + size, y + size, [
    [0, '#6c5332'], [0.22, '#b09467'], [0.38, '#ecdaaa'],
    [0.51, '#a58a58'], [0.77, '#59452f'], [1, '#c8a673'],
  ]);
}

function cabinet(ctx) {
  ctx.fillStyle = '#191510';
  ctx.fillRect(-1600, -1300, 5200, 3900);
  const light = ctx.createRadialGradient(660, 240, 80, 900, 200, 1700);
  light.addColorStop(0, '#6f5540');
  light.addColorStop(0.64, '#34291f');
  light.addColorStop(1, '#191714');
  ctx.fillStyle = light;
  ctx.fillRect(-1600, -1300, 5200, 3900);
  rounded(ctx, 30, 45, 1864, 922, 33, '#1a130f');
  rounded(ctx, 32, 24, 1856, 916, 32, gradient(ctx, 0, 0, 1400, 1100,
    [[0, '#b48454'], [0.26, '#805335'], [0.57, '#65402b'], [1, '#35271e']]), '#4b3223', 4);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(37, 29, 1846, 906, 29);
  ctx.clip();
  for (let i = 0; i < 128; i++) {
    const y = 23 + i * 7.3;
    ctx.beginPath();
    ctx.moveTo(29, y);
    ctx.bezierCurveTo(422, y + 7 * Math.sin(i * 1.72), 1110, y - 12 + 9 * Math.sin(i * 0.11), 1890, y + 3);
    ctx.strokeStyle = i % 4 === 0 ? '#ebc89c26' : '#3c241e32';
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.stroke();
  }
  ctx.restore();
  rounded(ctx, 68, 48, 1784, 440, 18, '#2c2218', '#b68f5d', 3);
  rounded(ctx, 82, 61, 1756, 415, 11, '#1d2d2b', '#151c18', 3);
  rounded(ctx, 69, 505, 1782, 390, 18, '#2c2116', '#bc9a6b', 3);
  rounded(ctx, 80, 515, 1760, 365, 12, gradient(ctx, 450, 490, 1400, 900,
    [[0, '#344542'], [0.40, '#263b37'], [1, '#172c2b']]), '#131f1c', 4);
  for (const x of [99, 1821]) for (const y of [536, 859]) screw(ctx, x, y);
}

function tick(ctx, x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x - 0.45 * size, y);
  ctx.lineTo(x - 0.13 * size, y + 0.30 * size);
  ctx.lineTo(x + 0.46 * size, y - 0.34 * size);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function shutter(ctx, x, y, fall) {
  const w = 145, h = 90;
  rounded(ctx, x - 3, y + 4, w + 6, h + 6, 11, '#0d1513');
  rounded(ctx, x, y, w, h, 9, brass(ctx, x + w / 2, y + h / 2, 73));
  rounded(ctx, x + 5, y + 5, w - 10, h - 10, 6, '#192420');
  const isLost = fall >= 0.5;
  const faceHeight = (h - 16) * Math.abs(Math.cos(fall * Math.PI));
  const centerY = y + h / 2;
  ctx.save();
  ctx.translate(x + w / 2, centerY);
  ctx.scale(1, Math.max(0.004, faceHeight / (h - 16)));
  const face = gradient(ctx, 0, -38, 0, 38, isLost
    ? [[0, '#ffad7e'], [0.22, '#e98460'], [1, '#b14d3b']]
    : [[0, '#f0e5cb'], [0.2, '#e1d6b8'], [1, '#bdb393']]);
  rounded(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 5, face);
  if (isLost) {
    ctx.lineCap = 'round';
    line(ctx, -13, -13, 13, 13, '#5e231f', 8);
    line(ctx, -13, 13, 13, -13, '#5e231f', 8);
  } else {
    tick(ctx, 0, 0, 46, '#35584b');
  }
  ctx.restore();
  for (const side of [3, w - 8]) rounded(ctx, x + side, centerY - 5, 6, 10, 2, '#594b33');
}

function shutters(ctx, s) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(84, 62, 1752, 412, 10);
  ctx.clip();
  label(ctx, 'If we ask for proof', 154, 118, 49, '#f3ead5', 'left', 'Serif');
  label(ctx, '20 equally likely outcomes', 1766, 120, 36, '#d6d7c5', 'right');
  for (let i = 0; i < cases; i++) {
    shutter(ctx, 156 + (i % 10) * 163, 175 + Math.floor(i / 10) * 110, i === cases - 1 ? s.last : 0);
  }
  if (s.difference > 0 && s.transfer < 0.5) {
    let calculation = `${reply} − (−${Math.abs(left)}) = ${reply - left}`;
    let meaning = 'Loss from one changed outcome';
    if (s.divide > 0) {
      calculation = `${reply - left} ÷ ${cases}` + (s.lossKnown > 0 ? ` = ${lossPerCall.toFixed(2)}` : '');
      meaning = 'Loss per request';
    }
    label(ctx, meaning, 157, 426, 33, '#dfdcc9', 'left');
    label(ctx, calculation, 1762, 426, 44, '#fff0ce', 'right', 'Mono');
  } else {
    const lost = Number(s.last >= 0.5);
    label(ctx, `${cases - lost} verified ${cases - lost === 1 ? 'reply' : 'replies'}   +${reply} each`,
      157, 426, 35, '#e6e2cd', 'left');
    if (lost) {
      label(ctx, '1 caller left' + (s.abandonedPayoff > 0 ? `   −${Math.abs(left)}` : ''),
        1762, 426, 36, '#ffa584', 'right');
    }
  }
  // A tambour rolls into the top housing and exposes the same twenty shutters.
  if (s.lid < 1) {
    ctx.save();
    ctx.translate(0, -421 * s.lid);
    for (let i = 0; i < 13; i++) {
      const y = 57 + i * 32;
      const paint = gradient(ctx, 0, y, 0, y + 32, [
        [0, '#402f24'], [0.12, '#836246'], [0.32, '#78553c'], [0.9, '#644732'], [1, '#4b3529'],
      ]);
      ctx.fillStyle = paint;
      ctx.fillRect(82, y, 1757, 33);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(84, y + 6 + k * 7);
        ctx.bezierCurveTo(550, y + 5 + k * 7, 1110, y + 14 + k * 3, 1835, y + 7 + k * 7);
        ctx.strokeStyle = '#d2ac7a22';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    rounded(ctx, 781, 419, 358, 23, 10, '#342a20');
    rounded(ctx, 780, 411, 360, 21, 10, brass(ctx, 960, 418, 66));
    ctx.restore();
  }
  ctx.restore();
}

function lamp(ctx, x, y, amount, hue = 'gold') {
  const red = hue === 'red';
  const r = 20;
  if (amount > 0) {
    const glow = ctx.createRadialGradient(x, y, r / 2, x, y, 72);
    glow.addColorStop(0, red ? 'rgba(255,112,67,0.38)' : 'rgba(255,213,128,0.46)');
    glow.addColorStop(1, 'rgba(255,177,76,0)');
    ctx.save();
    ctx.globalAlpha *= amount;
    disc(ctx, x, y, 72, glow);
    ctx.restore();
  }
  disc(ctx, x, y + 2, r + 6, '#101c1a');
  disc(ctx, x, y, r + 5, brass(ctx, x, y, r));
  disc(ctx, x, y, r + 1, '#16231d');
  const glass = ctx.createRadialGradient(x - 5, y - 7, 2, x, y, r);
  glass.addColorStop(0, amount > 0.2 ? '#fff2ca' : '#85816c');
  glass.addColorStop(0.4, amount > 0.2 ? (red ? '#ffac73' : '#ffdc8b') : '#4a5149');
  glass.addColorStop(1, amount > 0.2 ? (red ? '#a94b37' : '#a77e42') : '#293731');
  disc(ctx, x, y, r - 2, glass);
}

function socket(ctx, x, y) {
  disc(ctx, x + 2, y + 6, 60, '#13201d');
  disc(ctx, x, y, 60, brass(ctx, x, y, 60));
  disc(ctx, x, y, 53, '#665943');
  disc(ctx, x, y - 1, 50, brass(ctx, x - 4, y - 12, 82));
  disc(ctx, x, y, 36, '#232421');
  disc(ctx, x, y - 1, 31, '#0d1211');
  ctx.beginPath();
  ctx.arc(x, y + 1, 33, 0.13 * Math.PI, 0.87 * Math.PI);
  ctx.strokeStyle = '#c4ae80';
  ctx.lineWidth = 4;
  ctx.stroke();
}

const lineJack = 328, jacks = {ask: 931, review: 1522}, jackY = 773;
function field(ctx, x, s, isAsk) {
  const known = isAsk ? s.askKnown : s.reviewKnown;
  const showCalc = isAsk ? s.askCost > 0 : s.reviewCost > 0;
  const pending = isAsk && s.last >= 0.5 && s.averageKnown === 0;
  const name = isAsk ? 'Ask for proof' : 'Human review';
  label(ctx, name, x, 562, 52, '#f7ebd2', 'center', 'Serif');
  rounded(ctx, x - 234, 603, 468, 100, 7, '#4d5346');
  rounded(ctx, x - 231, 606, 462, 94, 5, '#111f1b', '#1c2720', 2);
  if (known > 0 && !pending) {
    const value = isAsk ? meanForAsk(s.last >= 0.5 ? 1 : 0) : review;
    label(ctx, 'Mean', x - 198, 655, 34, '#c5cbb7', 'left');
    label(ctx, String(value), x + 197, 654, 69, '#fff0c9', 'right', 'Mono');
  } else if (pending) {
    label(ctx, 'Mean', x - 198, 655, 34, '#c5cbb7', 'left');
    label(ctx, '?', x + 197, 654, 66, '#fff0c9', 'right', 'Mono');
  } else if (showCalc) {
    const cost = isAsk ? askCost : reviewCost;
    const after = isAsk ? s.nextReward : s.reviewLater;
    const later = isAsk ? checkReward : reviewerReward;
    const showDiscount = !isAsk || s.discount > 0;
    const discounted = showDiscount ? `${discount} × ` : '';
    // Separate labels preserve the timing of the rewards before discount is introduced.
    const text = after === 0 ? `Now  −${-cost}`
      : showDiscount ? `−${-cost} + ${discounted}${later}` : `Now −${-cost}   Next +${later}`;
    label(ctx, text, x, 655, 36, '#f4e4bf', 'center', 'Mono');
  }
  socket(ctx, x, jackY);
  const selected = isAsk ? s.plugIn > 0.985 && s.transfer < 0.012 : s.transfer > 0.985;
  lamp(ctx, x + 112, jackY, Number(selected));
}

function inlet(ctx, s) {
  label(ctx, 'Access request', lineJack, 562, 49, '#f8ecd2', 'center', 'Serif');
  rounded(ctx, lineJack - 187, 610, 374, 79, 7, brass(ctx, lineJack, 652, 180));
  rounded(ctx, lineJack - 181, 615, 362, 68, 5, '#201f19');
  ctx.save();
  ctx.beginPath();
  ctx.rect(lineJack - 177, 618, 354, 61);
  ctx.clip();
  ctx.translate(0, -68 * (1 - s.arrival));
  rounded(ctx, lineJack - 178, 617, 356, 65, 3, '#e2d5b5');
  label(ctx, 'Proof missing', lineJack, 649, 43, '#3b3527', 'center', 'Serif');
  ctx.restore();
  socket(ctx, lineJack, jackY);
  lamp(ctx, lineJack - 105, jackY, s.arrival);
}

function cord(ctx, s) {
  const parked = {x: 565, y: jackY + 44};
  const initialX = jacks[route(0)], finalX = jacks[route(1)];
  const lift = Math.sin(Math.PI * s.plugIn) + Math.sin(Math.PI * s.transfer);
  const x = mix(mix(parked.x, initialX, s.plugIn), finalX, s.transfer);
  const y = mix(parked.y, jackY, s.plugIn) - 78 * lift;
  const swing = 20 * Math.sin(s.transfer * Math.PI * 2);
  const slack = mix(128, 91, s.transfer);
  const endAngle = mix(-0.95, 0, s.plugIn) - 0.40 * lift;
  const boot = 72;
  const tailX = x - Math.sin(endAngle) * boot;
  const tailY = y + Math.cos(endAngle) * boot;
  function cable(offsetY, width, color, dash = []) {
    ctx.beginPath();
    ctx.moveTo(lineJack + 7, jackY + 74 + offsetY);
    ctx.bezierCurveTo(lineJack + 13, jackY + slack + 55 + offsetY,
      tailX - 12 + swing, tailY + slack + offsetY, tailX, tailY + offsetY - 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  cable(10, 24, '#17171170');
  cable(0, 26, '#48271f');
  cable(-1, 19, '#af6348');
  cable(-1, 16, '#82422f', [4, 5]);
  cable(-5, 4, '#e4936d', [3, 7]);
  function plug(px, py, angle, free) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    if (free > 0) {
      rounded(ctx, -9, -33 * free, 18, 35 * free + 6, 7, brass(ctx, 0, 0, 20));
      line(ctx, -8, -16 * free, 8, -16 * free, '#4d422c', 4);
    }
    rounded(ctx, -26, -10, 52, 57, 17, gradient(ctx, -26, 0, 28, 0,
      [[0, '#41382c'], [0.24, '#a38a64'], [0.5, '#5f503e'], [1, '#292821']]), '#352d23', 2);
    rounded(ctx, -18, 30, 36, 48, 12, '#77402f');
    for (let k = 0; k < 4; k++)
      line(ctx, -15 + k * 0.5, 38 + k * 9, 15 - k * 0.5, 38 + k * 9, '#b17253', 3);
    ctx.restore();
  }
  plug(lineJack, jackY, -0.09, 0);
  plug(x, y, endAngle, clamp(1 - s.plugIn + lift * 2));
}

function draw(ctx, clock) {
  const s = stateAt(clock);
  // Follow the new call, widen to include both destinations, then tilt up with the lid.
  const views = [
    {x: 311, y: 713, zoom: 2.28, progress: 1},
    {x: 959, y: 678, zoom: 1.07, progress: s.introduce},
    {x: jacks.ask, y: 704, zoom: 2.31, progress: s.studyAsk},
    {x: 1226, y: 691, zoom: 1.60, progress: s.bothSockets},
    {x: 960, y: 491, zoom: 0.97, progress: s.lid},
  ];
  let {x: focusX, y: focusY, zoom} = views[0];
  for (const view of views.slice(1)) {
    focusX = mix(focusX, view.x, view.progress);
    focusY = mix(focusY, view.y, view.progress);
    zoom = mix(zoom, view.zoom, view.progress);
  }
  ctx.fillStyle = '#1d1915';
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  ctx.translate(960, 506);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  cabinet(ctx);
  shutters(ctx, s);
  inlet(ctx, s);
  field(ctx, jacks.ask, s, true);
  field(ctx, jacks.review, s, false);
  cord(ctx, s);
  ctx.restore();
}

function check() {
  assert.equal(reply, 59);
  assert.equal(review, 54);
  assert.equal(left, -54);
  assert.equal(meanForAsk(0) - review, 5);
  assert.equal(reply - left, 113);
  assert.equal(lossPerCall, 5.65);
  assert.equal(meanForAsk(1), 53.35);
  assert.equal(Number((review - meanForAsk(1)).toFixed(2)), 0.65);
  assert.deepEqual([route(0), route(1)], ['ask', 'review']);
  assert.equal(meanForAsk(cases), left);
  return true;
}

export default {title: 'The twentieth shutter', beats, draw, check};
