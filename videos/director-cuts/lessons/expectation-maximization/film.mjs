// The jar compositions are the opening fixture from the course film.
// Each independent draw selects a jar, samples uniformly, and replaces the marble.
import assert from 'node:assert/strict';

const jars = [
  [true, false, true, true],
  [false, true, false, false],
];
const prints = [true, false, true, true, false, true, false, true];
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const stripeRates = jars.map((jar) => mean(jar.map(Number)));

function sharesFor(prior) {
  return prints.map((striped) => {
    const [a, b] = stripeRates.map((rate) => (striped ? rate : 1 - rate));
    return (prior * a) / (prior * a + (1 - prior) * b);
  });
}

const passes = [];
let estimate = 0.5;
for (let i = 0; i < 65; i++) {
  const shares = sharesFor(estimate);
  const next = mean(shares);
  passes.push({ estimate, shares, next });
  estimate = next;
}

const beats = [
  {
    id: 'the-catch',
    say: 'A striped marble. It came down the covered chute. Which jar would you give it to?',
    hold: 1.5,
  },
  {
    id: 'eight-exposures',
    say: 'Here are photos of eight draws. Each time, the machine picked a jar, drew one marble at random, and put it back. Five photos show stripes. How likely is the machine to pick jar A?',
    hold: 1.4,
  },
  {
    id: 'striped',
    say: 'Start the dial at half. That gives the jars even odds. Count the striped marbles behind the glass. Three of the four are in A. Give A three quarters of the credit for this striped photo.',
    hold: 1.0,
  },
  {
    id: 'plain',
    say: 'Try the plain one beside it. Only one of the four plain marbles is in A. Its green share is one quarter. Split the credit for every photo this way. That’s the expectation step.',
    hold: 0.8,
  },
  {
    id: 'unwind',
    say: 'Keep those rings still. Unwind the green from each one and lay the pieces end to end. How many whole draws does that give A?',
    hold: 1.6,
  },
  {
    id: 'turn',
    say: 'Four and a half out of eight. Set the pointer there. Using the expected count to refit the chance of picking A is the maximization step.',
    hold: 0.9,
  },
  {
    id: 'second-exposure',
    say: 'Watch the first ring again. We now expect A to come up more often. The very same striped photo gives it a bigger share. Add up the new shares and move the pointer again.',
    hold: 0.8,
  },
  {
    id: 'settle',
    say: 'Expectation-maximization repeats those two steps on the same eight photos. The turns get smaller. Watch where the pointer settles.',
    hold: 1.4,
  },
  {
    id: 'six-of-eight',
    say: 'At three quarters, each striped photo gives A nine tenths of a draw. Each plain one gives it half. Together that makes six draws out of eight. The pointer can stay right there.',
    hold: 2.8,
  },
];

const W = 1920,
  H = 1080;
const TAU = 2 * Math.PI;
const A = '#76d4ae',
  B = '#ec8b5f',
  ink = '#14251f',
  paper = '#f7ebcc';
const startX = 204,
  pitch = 189,
  ringY = 704,
  ringR = 66,
  ruleY = 864;
const cellX = (i) => startX + (i + 0.5) * pitch;
const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function check() {
  const close = (actual, expected, tolerance = 1e-10) =>
    assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
  assert.deepEqual(stripeRates, [0.75, 0.25]);
  assert.equal(prints.filter(Boolean).length, 5);
  close(passes[0].shares[0], 0.75);
  close(passes[0].shares[1], 0.25);
  close(8 * passes[0].next, 4.5);
  close(passes[1].estimate, 9 / 16);
  close(passes[1].shares[0], 27 / 34);
  // With known jar compositions the fitted stripe frequency must match the sample.
  const stripeFrequency = mean(prints.map(Number));
  const optimum = (stripeFrequency - stripeRates[1]) / (stripeRates[0] - stripeRates[1]);
  close(optimum, 0.75);
  close(passes.at(-1).next, optimum, 1e-6);
  close(sharesFor(optimum)[0], 0.9);
  close(sharesFor(optimum)[1], 0.5);
  close(8 * mean(sharesFor(optimum)), 6);
  const logLikelihood = (p) => {
    const stripe = p * stripeRates[0] + (1 - p) * stripeRates[1];
    return prints.reduce((sum, observed) => sum + Math.log(observed ? stripe : 1 - stripe), 0);
  };
  for (const { estimate, next } of passes)
    assert.ok(logLikelihood(next) >= logLikelihood(estimate) - 1e-13);
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function round(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function line(ctx, x, y, ex, ey, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function gradient(ctx, x, y, ex, ey, stops) {
  const g = ctx.createLinearGradient(x, y, ex, ey);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function label(ctx, value, x, y, size, color, family = 'Sans', align = 'center', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function screw(ctx, x, y) {
  ellipse(ctx, x, y + 1, 10, 10, '#0d1513');
  ellipse(ctx, x, y, 8, 8, '#908774');
  line(ctx, x - 4, y + 4, x + 4, y - 4, '#38392d', 3);
}

function casework(ctx) {
  const lamp = ctx.createRadialGradient(830, 210, 60, 990, 480, 1160);
  lamp.addColorStop(0, '#39594e');
  lamp.addColorStop(0.66, '#213d34');
  lamp.addColorStop(1, '#0c1917');
  ctx.fillStyle = lamp;
  ctx.fillRect(-160, -140, W + 320, H + 280);
  round(ctx, 46, 35, 1828, 925, 55, '#101f1b');
  round(ctx, 50, 32, 1820, 920, 53, '#51675a');
  round(ctx, 54, 35, 1812, 910, 50, lamp);
  for (let i = 0; i < 1000; i++) {
    const x = 80 + ((i * 1087) % 1750),
      y = 50 + ((i * 619) % 870);
    ctx.fillStyle = i % 2 ? '#eeefcb0b' : '#0000000c';
    ctx.fillRect(x, y, 1 + (i % 3), 2);
  }
  for (const x of [91, 1829]) for (const y of [79, 901]) screw(ctx, x, y);
  const shelf = gradient(ctx, 0, 529, 0, 564, [
    [0, '#b2ac89'],
    [0.1, '#655e46'],
    [0.27, '#383c2e'],
    [1, '#142a22'],
  ]);
  round(ctx, 126, 529, 1668, 34, 6, shelf);
}

function marble(ctx, x, y, r, striped, angle = -0.54, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(-r * 0.38, -r * 0.44, 0, r * 0.2, r * 0.3, r * 1.28);
  g.addColorStop(0, '#fff8d8');
  g.addColorStop(0.49, '#e9dab4');
  g.addColorStop(0.83, '#beae8e');
  g.addColorStop(1, '#686857');
  ellipse(ctx, 1, 4, r + 1, r + 1, '#0b171b52');
  ellipse(ctx, 0, 0, r, r, g);
  ctx.clip();
  if (striped) {
    ctx.save();
    ctx.rotate(angle);
    for (const p of [-0.52, 0.0, 0.52]) {
      ctx.beginPath();
      ctx.moveTo(-r, (p - 0.12) * r);
      ctx.bezierCurveTo(-r * 0.28, (p - 0.26) * r, r * 0.43, (p - 0.12) * r, r, (p + 0.04) * r);
      ctx.lineTo(r, (p + 0.24) * r);
      ctx.bezierCurveTo(r * 0.3, (p + 0.04) * r, -r * 0.3, (p - 0.05) * r, -r, (p + 0.09) * r);
      ctx.closePath();
      ctx.fillStyle = '#3a443a';
      ctx.fill();
    }
    ctx.restore();
  }
  ellipse(ctx, -r * 0.36, -r * 0.48, r * 0.17, r * 0.085, '#ffffff90');
  ctx.restore();
}

function jar(ctx, x, id, focus) {
  const color = id === 0 ? A : B;
  const left = x - 165;
  ellipse(ctx, x + 9, 527, 177, 14, '#08120f70');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 119, 140);
  ctx.bezierCurveTo(x - 119, 193, left, 172, left, 220);
  ctx.lineTo(left, 483);
  ctx.quadraticCurveTo(left, 524, x - 129, 526);
  ctx.quadraticCurveTo(x, 539, x + 129, 526);
  ctx.quadraticCurveTo(x + 165, 524, x + 165, 483);
  ctx.lineTo(x + 165, 220);
  ctx.bezierCurveTo(x + 165, 172, x + 119, 193, x + 119, 140);
  ctx.closePath();
  ctx.fillStyle = gradient(ctx, left, 0, x + 165, 0, [
    [0, '#789084'],
    [0.055, '#486355'],
    [0.21, '#1e382e'],
    [0.75, '#263f35'],
    [0.94, '#526e60'],
    [1, '#99aca1'],
  ]);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#abc3af';
  ctx.stroke();
  ctx.clip();
  for (let i = 0; i < 4; i++) {
    const px = x + (i % 2 ? 65 : -65),
      py = 306 + Math.floor(i / 2) * 127;
    const pattern = jars[id][i];
    marble(ctx, px, py, 62, pattern, -0.58 + (i % 3) * 0.08);
    const fade = pattern ? focus.plain : focus.striped;
    if (fade) ellipse(ctx, px, py, 63, 63, `rgba(21,45,36,${0.65 * fade})`);
  }
  round(ctx, left + 16, 204, 10, 272, 5, '#edffdc3b');
  round(ctx, left + 31, 215, 4, 136, 2, '#faffdb36');
  ctx.restore();
  const lid = gradient(ctx, 0, 97, 0, 150, [
    [0, '#cfc39b'],
    [0.1, '#908169'],
    [0.25, '#514f42'],
    [0.83, '#544e3d'],
    [1, '#b9a77b'],
  ]);
  round(ctx, x - 145, 95, 290, 63, 10, lid);
  for (const side of [-1, 1])
    for (let n = 0; n < 9; n++)
      line(ctx, x + side * (91 + n * 5), 105, x + side * (91 + n * 5), 146, '#d7c9a33b', 2);
  round(ctx, x - 82, 89, 164, 73, 13, color);
  label(ctx, 'Jar ' + (id === 0 ? 'A' : 'B'), x, 124, 43, ink, 'Serif', 'center', 600);
}

function gauge(ctx, p) {
  const x = 960,
    y = 301,
    radius = 205;
  const metal = gradient(ctx, 800, 110, 1120, 470, [
    [0, '#f6ddaa'],
    [0.28, '#9c8d6e'],
    [0.52, '#635d4c'],
    [0.88, '#c6b68b'],
    [1, '#7f7155'],
  ]);
  ellipse(ctx, x + 5, y + 9, radius + 10, radius + 10, '#0a151394');
  ellipse(ctx, x, y, radius + 8, radius + 8, metal);
  ellipse(ctx, x, y, radius, radius, '#2a3028');
  const face = gradient(ctx, 0, 97, 0, 499, [
    [0, '#f2e6c5'],
    [0.7, '#e4d8b9'],
    [1, '#cbbd9b'],
  ]);
  ellipse(ctx, x, y, radius - 5, radius - 5, face);
  const angle = (v) => Math.PI * (0.98 + 1.04 * v);
  const pivot = { x, y: y + 29 };
  for (let i = 0; i <= 16; i++) {
    const a = angle(i / 16),
      ct = Math.cos(a),
      st = Math.sin(a);
    const inner = i % 4 === 0 ? 138 : 149;
    line(
      ctx,
      x + inner * ct,
      pivot.y + inner * st,
      x + 164 * ct,
      pivot.y + 164 * st,
      ink,
      i % 4 === 0 ? 5 : 2,
    );
  }
  const a = angle(p);
  ctx.save();
  ctx.translate(x, pivot.y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(162, 0);
  ctx.lineTo(-21, 9);
  ctx.lineTo(-21, -8);
  ctx.closePath();
  ctx.fillStyle = '#1b604e';
  ctx.fill();
  ctx.restore();
  ellipse(ctx, x, pivot.y, 12, 12, '#645f4e');
  ellipse(ctx, x - 1, pivot.y - 2, 7, 7, '#c7b891');
  label(ctx, 'Estimate for A', x, 367, 37, '#334637', 'Sans');
  label(ctx, Number((p * 100).toFixed(2)) + '%', x, 422, 61, ink, 'Serif', 'center', 600);
}

function catchWindow(ctx, elapsed, opacity) {
  if (!opacity) return;
  const x = 960,
    y = 301;
  ctx.save();
  ctx.globalAlpha = opacity;
  const g = ctx.createRadialGradient(x - 40, y - 58, 12, x, y, 206);
  g.addColorStop(0, '#34483a');
  g.addColorStop(0.83, '#14291f');
  g.addColorStop(1, '#091910');
  ellipse(ctx, x, y, 201, 201, g);
  const t = clamp(elapsed / 1.22);
  const fall = t < 0.62 ? (t / 0.62) ** 2 : 1 - 0.25 * Math.sin((Math.PI * (t - 0.62)) / 0.38);
  const bx = x + 52 * (1 - smooth(t)),
    by = 213 + 139 * fall;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 197, 0, TAU);
  ctx.clip();
  round(ctx, x - 86, y - 253, 172, 151, 16, '#677160');
  ellipse(ctx, x, y - 101, 86, 28, '#102218');
  ellipse(ctx, x, y + 117, 123, 21, '#736d50');
  ellipse(ctx, x, y + 112, 122, 18, '#d1b980');
  ellipse(ctx, x, y + 108, 112, 12, '#424939');
  ellipse(ctx, bx, y + 105, 60 * fall + 6, 9, '#1a211b90');
  marble(ctx, bx, by, 59, true, -2.0 + 1.5 * t);
  ctx.restore();
  ctx.restore();
}

function recorder(ctx, count, shares, rings, reading, witness) {
  round(ctx, 149, 584, 1622, 231, 22, '#10231c');
  round(ctx, 153, 587, 1614, 226, 20, '#827f65');
  const plate = gradient(ctx, 0, 589, 0, 810, [
    [0, '#252e27'],
    [0.5, '#363b30'],
    [1, '#222c25'],
  ]);
  round(ctx, 156, 590, 1608, 218, 18, plate);
  for (let i = 0; i < prints.length; i++) {
    const x = cellX(i),
      exposure = smooth(count - i);
    round(ctx, x - 67, 603, 18, 10, 2, '#c0baa1');
    round(ctx, x + 49, 603, 18, 10, 2, '#c0baa1');
    round(ctx, x - 84, 621, 168, 154, 4, '#1c251e');
    ellipse(ctx, x, ringY, ringR + 4, ringR + 4, '#131e18');
    if (!exposure) continue;
    ctx.save();
    ctx.globalAlpha = exposure;
    marble(ctx, x, ringY, 49, prints[i]);
    if (rings[i] > 0) {
      const begin = -Math.PI / 2,
        split = begin + TAU * shares[i];
      ctx.globalAlpha *= rings[i];
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(x, ringY, ringR, begin, split);
      ctx.strokeStyle = A;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, ringY, ringR, split, begin + TAU);
      ctx.strokeStyle = B;
      ctx.stroke();
      if (i === 0 && witness > 0) {
        const oldEnd = begin + TAU * passes[0].shares[i];
        ctx.globalAlpha *= witness;
        line(
          ctx,
          x + (ringR - 14) * Math.cos(oldEnd),
          ringY + (ringR - 14) * Math.sin(oldEnd),
          x + (ringR + 14) * Math.cos(oldEnd),
          ringY + (ringR + 14) * Math.sin(oldEnd),
          paper,
          3,
        );
      }
    }
    ctx.restore();
    if (i < 2 && reading > 0 && rings[i] > 0) {
      ctx.save();
      ctx.globalAlpha = reading * rings[i];
      label(ctx, Math.round(100 * shares[i]) + '% A', x, 789, 36, paper, 'Mono');
      ctx.restore();
    }
  }
}

// Lift a copy of each green arc off its photo. Flatten it into its share of
// one division on the count scale while keeping the original ring in place.
function ruler(ctx, shares, travel) {
  if (travel <= 0) return;
  const show = smooth(travel * 8);
  ctx.save();
  ctx.globalAlpha = show;
  const width = pitch * prints.length;
  round(ctx, startX, ruleY - 11, width, 22, 4, '#10271e');
  let contributed = 0;
  for (let i = 0; i < shares.length; i++) {
    const progress = smooth(travel * 5 - i * 0.5);
    if (progress > 0) {
      const x = cellX(i),
        share = shares[i];
      ctx.beginPath();
      for (let j = 0; j <= 32; j++) {
        const u = j / 32,
          a = -Math.PI / 2 + u * TAU * share;
        const px = mix(
          x + ringR * Math.cos(a),
          startX + pitch * (contributed + u * share),
          progress,
        );
        const py = mix(ringY + ringR * Math.sin(a), ruleY, progress);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = A;
      ctx.lineWidth = 16;
      ctx.stroke();
    }
    contributed += shares[i];
  }
  for (let i = 0; i <= 8; i++) {
    const x = startX + i * pitch;
    line(ctx, x, ruleY - 14, x, ruleY + 16, '#bdc9a7', 3);
  }
  label(ctx, 'Expected draws from A', startX, 911, 39, paper, 'Sans', 'left');
  if (travel > 0.95) {
    const value = Number(contributed.toFixed(2));
    label(ctx, value + ' / 8', startX + width, 910, 52, A, 'Mono', 'right');
  }
  ctx.restore();
}

function stateAt(clock) {
  const { index, elapsed, reveal } = clock;
  const first = passes[0],
    second = passes[1];
  const s = {
    estimate: first.estimate,
    shares: first.shares,
    rings: prints.map(() => 1),
    count: 8,
    focus: { striped: 0, plain: 0 },
    window: 0,
    zoom: 1,
    cameraX: 960,
    cameraY: 540,
    recordOpacity: 1,
    travel: 1,
    reading: 1,
    witness: 0,
  };
  if (index < 2) {
    const expose = index === 0 ? 0 : smooth(reveal('Here are photos', 2.7));
    s.count = index === 0 ? 0 : 8 * expose;
    const wide = index === 0 ? smooth(reveal('Which jar', 1.15)) : 1;
    s.zoom = mix(mix(2.32, 1.12, wide), 1, expose);
    s.cameraY = mix(mix(301, 408, wide), 540, expose);
    s.recordOpacity = expose;
    s.window = 1;
    s.travel = 0;
    s.reading = 0;
    s.rings.fill(0);
  } else if (index === 2) {
    s.window = 1 - smooth(elapsed / 0.8);
    s.focus.striped = smooth(reveal('Count the striped marbles', 0.55));
    s.rings.fill(0);
    s.rings[0] = smooth(reveal('Three of the four', 0.7));
    s.travel = 0;
  } else if (index === 3) {
    const plain = smooth(reveal('Try the plain one', 0.65));
    const all = smooth(reveal('Split the credit', 1.75));
    s.focus = { striped: 1 - plain, plain: plain * (1 - all) };
    s.rings = s.rings.map((_, i) => (i === 0 ? 1 : i === 1 ? plain : smooth(all * 1.5 - i / 18)));
    s.travel = 0;
  } else if (index === 4) {
    s.travel = smooth(reveal('Unwind the green', 3.15));
  } else if (index === 5) {
    s.estimate = mix(first.estimate, first.next, smooth(reveal('Set the pointer', 1.4)));
  } else if (index === 6) {
    const detail =
      smooth(reveal('Watch the first ring', 1.2)) *
      (1 - smooth(reveal('Add up the new shares', 1.5)));
    s.zoom = mix(1, 2.85, detail);
    s.cameraX = mix(960, 458, detail);
    s.cameraY = mix(540, 752, detail);
    s.witness = detail;
    s.travel = 1 - detail;
    const grow = smooth(reveal('We now expect', 1.6));
    s.shares = first.shares.map((r, i) => mix(r, second.shares[i], grow));
    s.estimate = mix(second.estimate, second.next, smooth(reveal('move the pointer again', 1.2)));
  } else if (index === 7) {
    // Each cycle spends its first half updating rings with a frozen estimate
    // and its second half moving the estimate with those same rings frozen.
    const t = smooth(reveal('repeats those two steps', 6.3));
    const cursor = 2 + Math.expm1(t * Math.log(62));
    const k = Math.floor(cursor),
      frac = cursor - k;
    const from = passes[k - 1],
      to = passes[k];
    s.shares = from.shares.map((r, i) => mix(r, to.shares[i], smooth(frac * 2)));
    s.estimate = mix(to.estimate, to.next, smooth(frac * 2 - 1));
  } else {
    s.estimate = passes.at(-1).next;
    s.shares = sharesFor(s.estimate);
  }
  return s;
}

function draw(ctx, clock) {
  const s = stateAt(clock);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(s.zoom, s.zoom);
  ctx.translate(-s.cameraX, -s.cameraY);
  casework(ctx);
  jar(ctx, 374, 0, s.focus);
  jar(ctx, 1546, 1, s.focus);
  gauge(ctx, s.estimate);
  catchWindow(ctx, clock.index === 0 ? clock.elapsed : 2, s.window);
  ctx.save();
  ctx.globalAlpha = s.recordOpacity;
  recorder(ctx, s.count, s.shares, s.rings, s.reading, s.witness);
  ctx.restore();
  ruler(ctx, s.shares, s.travel);
  ctx.restore();
}

export default { title: 'The marble behind the dial', beats, draw, check };
