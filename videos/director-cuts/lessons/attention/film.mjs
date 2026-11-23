import assert from 'node:assert/strict';

// The sing query and the two source rows from videos/films/attention/model.mjs.
const query = [0.5, 1];
const ribbon = [
  {
    word: 'Birds',
    key: [0.8, 0.2],
    value: [2, 1],
    dye: '#204793',
    dark: '#142e65',
    light: '#4672af',
    silk: '#f6df9b',
  },
  {
    word: 'sing',
    key: [0.3, 0.9],
    value: [1, 2],
    dye: '#bd403e',
    dark: '#8c292e',
    light: '#d26455',
    silk: '#fee3c1',
  },
];
const scores = ribbon.map(({ key }) => key.reduce((sum, k, i) => sum + k * query[i], 0));
const scaled = scores.map((s) => s / Math.sqrt(query.length));
const exps = scaled.map((s) => Math.exp(s - Math.max(...scaled)));
const mass = exps.reduce((sum, e) => sum + e, 0);
const weights = exps.map((e) => e / mass);
const parts = ribbon.map(({ value }, r) => value.map((v) => v * weights[r]));
const output = ribbon[0].value.map((_, i) => parts[0][i] + parts[1][i]);

const beats = [
  {
    id: 'unroll',
    say: 'Birds sing. Unroll those two words. Each ribbon shows the first number in the value its word carries. Two units of blue, one of red.',
    hold: 0.9,
  },
  {
    id: 'match',
    say: 'Here, sing is reading both words. Its query takes a dot product with each word’s key. The higher score goes to sing itself.',
    hold: 0.7,
  },
  {
    id: 'shares',
    say: 'Each key has two numbers, so divide the scores by the square root of two. Now take the exponential of each scaled score. Divide each result by their total to get the two shares. That’s softmax.',
    hold: 0.8,
  },
  {
    id: 'chalk',
    say: 'Chalk off about forty two percent of the blue ribbon and fifty eight percent of the red. Which cut will give sing the longer piece?',
    hold: 2.2,
  },
  { id: 'snip', say: 'Keep the cloth to the left of each mark.', hold: 2.5 },
  {
    id: 'edges',
    say: 'See where the blue edge sticks out? Birds supplied about point eight four. It had twice as much cloth to start with. The larger share of red gives us just point five eight.',
    hold: 0.55,
  },
  {
    id: 'seam',
    say: 'Slide the two pieces end to end. Their lengths add up to about one point four two. That’s the first number this head returns to sing.',
    hold: 1.0,
  },
  {
    id: 'second',
    say: 'For the second number, the lengths trade places. Birds carries one and sing carries two. Keep exactly the same shares. Watch what happens to the red piece.',
    hold: 1.7,
  },
  {
    id: 'hem',
    say: 'This time the red piece is longer. It supplies about one point one six of the second number. Find the seam in each row and you can see what came from each word.',
    hold: 3.0,
  },
];

const X = 287,
  unit = 655,
  h = 150;
const rows = [293, 585],
  ink = '#302b3d';
const clamp = (t) => Math.min(1, Math.max(0, t));
const ease = (t) => {
  const a = clamp(t);
  return a * a * (3 - 2 * a);
};
const mix = (a, b, t) => a + (b - a) * t;
const f2 = (n) => n.toFixed(2);
const amount = (clock, beat, phrase, span) =>
  clock.index === beat ? ease(clock.reveal(phrase, span)) : Number(clock.index > beat);

function text(c, s, x, y, size, family = 'Sans', color = ink, align = 'left', weight = 400) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

function line(c, x, y, xx, yy, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.stroke();
}

function polygon(c, points, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fill();
}

function table(c) {
  const light = c.createLinearGradient(0, 0, 1460, 1370);
  light.addColorStop(0, '#ffebd5');
  light.addColorStop(0.54, '#f3dacb');
  light.addColorStop(1, '#dec4bb');
  c.fillStyle = light;
  c.fillRect(0, 0, 1920, 1080);

  // The cutting surface is a cloth-covered table seen in raking daylight.
  c.beginPath();
  for (let y = 2; y < 1080; y += 8) {
    c.moveTo(0, y);
    c.lineTo(1920, y + 1);
  }
  c.lineWidth = 1;
  c.strokeStyle = '#7c5b4c0c';
  c.stroke();
  c.beginPath();
  for (let x = 4; x < 1920; x += 13) {
    c.moveTo(x, 0);
    c.lineTo(x - 4, 1080);
  }
  c.strokeStyle = '#fff7d73b';
  c.stroke();
}

// A forked tail and swept wings make the blue fabric identifiable after the cut.
function swallow(c, x, y, scale, style) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.fillStyle = style.silk;
  c.beginPath();
  c.moveTo(-55, 15);
  c.quadraticCurveTo(-32, 13, -20, -1);
  c.bezierCurveTo(-31, -12, -42, -28, -43, -41);
  c.quadraticCurveTo(-14, -18, 6, -11);
  c.bezierCurveTo(13, -18, 18, -21, 25, -16);
  c.lineTo(40, -16);
  c.lineTo(28, -10);
  c.bezierCurveTo(22, 1, 9, 9, -6, 10);
  c.quadraticCurveTo(-13, 25, -36, 36);
  c.quadraticCurveTo(-24, 22, -22, 11);
  c.lineTo(-50, 26);
  c.lineTo(-35, 12);
  c.closePath();
  c.fill();
  line(c, -31, -26, -6, -7, style.dye, 2.6);
  line(c, -23, -17, -11, -6, style.dye, 2);
  c.fillStyle = style.dye;
  c.beginPath();
  c.arc(20, -14, 1.7, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function notes(c, x, y, style) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.09);
  c.fillStyle = style.silk;
  for (const [xx, yy] of [
    [-23, 19],
    [21, 10],
  ]) {
    c.beginPath();
    c.ellipse(xx, yy, 14, 9, -0.31, 0, 2 * Math.PI);
    c.fill();
    line(c, xx + 11, yy, xx + 11, yy - 44, style.silk, 5.5);
  }
  polygon(
    c,
    [
      [-14, -26],
      [35, -36],
      [35, -25],
      [-14, -15],
    ],
    style.silk,
  );
  c.restore();
}

function fabric(c, r, x, y, width, offset = 0, tilt = 0, height = h) {
  if (width < 1) return;
  const style = ribbon[r];
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.shadowColor = '#4a273447';
  c.shadowBlur = 12;
  c.shadowOffsetY = 8;
  c.fillStyle = style.dye;
  c.fillRect(0, 0, width, height);
  c.shadowColor = 'transparent';
  c.beginPath();
  c.rect(0, 0, width, height);
  c.clip();
  c.translate(0, (height - h) / 2);
  c.translate(-offset, 0);
  const end = offset + width;
  const satin = c.createLinearGradient(0, 0, 0, h);
  satin.addColorStop(0, style.light);
  satin.addColorStop(0.11, style.dye);
  satin.addColorStop(0.62, style.dye);
  satin.addColorStop(0.94, style.dark);
  satin.addColorStop(1, style.light);
  c.fillStyle = satin;
  c.fillRect(offset, 0, width, h);
  const inset = (h - height) / 2;
  for (const edge of [inset + 9, h - inset - 10]) {
    line(c, offset, edge, end, edge, style.silk, 2.8);
    c.setLineDash([8, 5]);
    line(
      c,
      offset,
      edge + (edge < h / 2 ? 6 : -6),
      end,
      edge + (edge < h / 2 ? 6 : -6),
      style.silk,
      2.4,
    );
    c.setLineDash([]);
  }
  for (let i = 0, xx = 238; xx < end + 65; i++, xx += 130) {
    if (xx + 65 < offset) continue;
    if (r === 0) swallow(c, xx, 74 + (i % 2) * 8, 1.07, style);
    else notes(c, xx, 75 + (i % 2) * 8, style);
    polygon(
      c,
      [
        [xx + 57, 70],
        [xx + 62, 77],
        [xx + 57, 84],
        [xx + 52, 77],
      ],
      style.silk,
    );
  }
  if (offset < 170) text(c, style.word, 26, 97, 63, 'Serif', '#fff2d7');
  // Fine diagonal floats stay anchored to the fabric as the offcuts slide away.
  c.beginPath();
  for (let xx = Math.floor((offset - 20) / 7) * 7; xx < end; xx += 7) {
    c.moveTo(xx, 0);
    c.lineTo(xx + 17, h);
  }
  c.lineWidth = 1.2;
  c.strokeStyle = '#fff7df1c';
  c.stroke();
  c.restore();
}

function curl(c, r, x, y, t) {
  const w = 83 * (1 - ease(t));
  if (w < 1) return;
  const g = c.createLinearGradient(x - w, y, x + 4, y);
  g.addColorStop(0, '#201a2a54');
  g.addColorStop(0.23, ribbon[r].dark);
  g.addColorStop(0.64, ribbon[r].light);
  g.addColorStop(0.9, '#fff3d59a');
  g.addColorStop(1, ribbon[r].dark);
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(x - w, y - 7, w, h + 10, Math.min(9, w / 3));
  c.fill();
  c.save();
  c.translate(x - w / 2, y + h - 1);
  c.scale(w / 2, Math.max(0.8, 0.17 * w));
  c.fillStyle = ribbon[r].silk;
  c.beginPath();
  c.arc(0, 0, 1, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  for (let n = 0; n <= 60; n++) {
    const angle = n * 0.26,
      radius = (n + 3) / 65;
    const xx = radius * Math.cos(angle),
      yy = radius * Math.sin(angle);
    if (n === 0) c.moveTo(xx, yy);
    else c.lineTo(xx, yy);
  }
  c.lineWidth = 0.095;
  c.strokeStyle = ribbon[r].dark;
  c.stroke();
  c.restore();
}

function looseThreads(c, r, x, y) {
  c.beginPath();
  for (let i = 0; i < 22; i++) {
    const yy = y + 5 + i * 6.5,
      length = 3 + 3.7 * (1 + Math.sin(i * 1.7 + r));
    c.moveTo(x - 1, yy);
    c.quadraticCurveTo(x + 5, yy - 0.5, x + length, yy + 1.4 * Math.sin(i));
  }
  c.strokeStyle = ribbon[r].light;
  c.lineWidth = 2.0;
  c.stroke();
}

function scale(c, y, alpha) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  line(c, X, y, X + unit * 2, y, '#6c5d66', 2);
  for (let i = 0; i <= 20; i++) {
    const xx = X + (unit * i) / 10;
    line(
      c,
      xx,
      y,
      xx,
      y + (i % 10 === 0 ? 21 : i % 5 === 0 ? 15 : 9),
      '#6c5d66',
      i % 10 === 0 ? 3.5 : 2,
    );
    if (i % 10 === 0) text(c, String(i / 10), xx, y + 62, 44, 'Mono', '#564954', 'center');
  }
  c.restore();
}

function cutMark(c, x, y, t) {
  if (!t) return;
  c.save();
  c.lineCap = 'round';
  c.setLineDash([12, 8]);
  line(c, x, y - 3, x, y - 3 + (h + 6) * t, '#fff7d9', 5.5);
  c.setLineDash([]);
  polygon(
    c,
    [
      [x - 10, y - 22],
      [x + 10, y - 22],
      [x, y - 9],
    ],
    ink,
  );
  c.restore();
}

// The blades meet on x = 0. The two loops follow their respective levers.
function shears(c, x, y, opening, alpha) {
  if (alpha < 0.003) return;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.shadowColor = '#4e39415c';
  c.shadowBlur = 9;
  c.shadowOffsetX = 6;
  c.shadowOffsetY = 8;
  for (const side of [-1, 1]) {
    c.save();
    c.rotate(side * opening);
    const steel = c.createLinearGradient(-16, 0, 15, 1);
    steel.addColorStop(0, '#66727e');
    steel.addColorStop(0.49, '#c5d1ce');
    steel.addColorStop(0.54, '#f5f5eb');
    steel.addColorStop(1, '#697983');
    polygon(
      c,
      [
        [0, -171],
        [side * 13, -77],
        [side * 14, 8],
        [-side * 5, 19],
        [-side * 6, -10],
      ],
      steel,
    );
    c.shadowBlur = 0;
    c.strokeStyle = '#302936';
    c.lineWidth = 16;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 8);
    c.quadraticCurveTo(-side * 5, 46, -side * 28, 67);
    c.stroke();
    c.beginPath();
    c.ellipse(-side * 31, 90, side < 0 ? 24 : 20, side < 0 ? 45 : 29, side * 0.27, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  c.shadowColor = 'transparent';
  c.fillStyle = '#687381';
  c.beginPath();
  c.arc(0, 0, 11, 0, Math.PI * 2);
  c.fill();
  line(c, -5, 3, 5, -3, '#f3efe1', 2.6);
  c.restore();
}

function joinStitches(c, x, y, t) {
  if (!t) return;
  c.save();
  c.globalAlpha *= t;
  c.lineCap = 'round';
  for (let i = 17; i < h - 11; i += 14) line(c, x - 6, y + i, x + 6, y + i + 4, '#fbecd4', 3.6);
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed } = clock;
  table(c);
  const zoom = amount(clock, 6, 'Slide the two pieces', 1.8) * 0.08;
  c.save();
  c.translate(948, 455);
  c.scale(1 + zoom, 1 + zoom);
  c.translate(-948, -455);

  const open = index === 0 ? ease(elapsed / 1.6) : 1;
  const match = amount(clock, 1, 'dot product', 0.6);
  const divide = amount(clock, 2, 'divide the scores', 0.55);
  const exponentiate = amount(clock, 2, 'take the exponential', 0.55);
  const share = amount(clock, 2, 'Divide each result', 0.55);
  const chalk = [amount(clock, 3, 'Chalk off', 0.7), amount(clock, 3, 'fifty eight percent', 0.7)];
  const join = amount(clock, 6, 'Slide the two pieces', 1.6);
  const next = amount(clock, 7, 'For the second number', 0.9);
  const newWeights = amount(clock, 7, 'Keep exactly the same shares', 0.95);
  const finish = amount(clock, 7, 'Watch what happens', 1.4);

  const title = index < 6 ? 'Birds sing.' : 'What sing receives';
  text(c, title, 179, 153, 90, 'Serif');
  if (index < 6) {
    const reading = amount(clock, 1, 'sing is reading', 0.5);
    if (reading) {
      c.save();
      c.globalAlpha *= reading;
      line(c, 410, 171, 548, 170, '#a34244', 5);
      c.restore();
    }
    let heading = 'First number in each value';
    if (index > 0) heading = 'Query from sing';
    if (divide) heading = 'Scaled scores';
    if (exponentiate) heading = 'Exponentials';
    if (share) heading = 'Attention from sing';
    text(c, heading, 1670, 147, 48, 'Sans', '#5b4b50', 'right');
  }
  scale(c, 812, 1 - join);
  c.save();
  c.setLineDash([4, 13]);
  c.globalAlpha = 0.42 * (1 - join);
  for (const v of [0, 1, 2]) line(c, X + v * unit, rows[0] + 31, X + v * unit, 809, '#8a7980', 2.5);
  c.restore();

  // At each snip the right-hand piece leaves. The left piece never changes length.
  const cutTime = index === 4 ? elapsed : index > 4 ? 20 : -10;
  const cuts = [0, 1].map((r) => ease((cutTime - (r ? 2.15 : 0.43)) / 0.63));
  const slips = [0, 1].map((r) => ease((cutTime - (r ? 2.7 : 0.98)) / 1.0));
  for (let r = 0; r < 2; r++) {
    const whole = ribbon[r].value[0] * unit;
    const piece = parts[r][0] * unit;
    const y = rows[r];
    const unfurl = r === 0 ? open : index === 0 ? ease((elapsed - 0.15) / 1.24) : 1;
    const width = whole * mix(r === 0 ? 0.38 : 0.45, 1, unfurl);
    const px = X + (r ? parts[0][0] * unit * join : 0);
    const joinedY = mix(411, 298, next);
    const py = mix(y, joinedY, join);
    if (cuts[r] < 1 && !slips[r]) {
      fabric(c, r, X, y, width);
      curl(c, r, X + width, y, unfurl);
    } else {
      fabric(c, r, px, py, piece);
      if (slips[r] > 0 && (!join || r === 1)) looseThreads(c, r, px + piece, py);
      if (slips[r] < 1) {
        c.save();
        c.globalAlpha *= 1 - slips[r];
        fabric(
          c,
          r,
          X + piece + 330 * slips[r],
          y - 37 * slips[r],
          whole - piece,
          piece,
          -0.07 * slips[r],
        );
        c.restore();
      }
    }
    if (index === 0) {
      c.save();
      c.globalAlpha *= open;
      text(c, String(ribbon[r].value[0]), X + whole, y - 26, 56, 'Mono', ink, 'center');
      c.restore();
    }
    if (match > 0 && index < 6) {
      const at = X + piece;
      let label;
      if (share > 0) label = `${Math.round(weights[r] * 100)}%`;
      else if (exponentiate > 0) label = f2(Math.exp(scaled[r]));
      else if (divide > 0) label = f2(scaled[r]);
      else label = `match  ${f2(scores[r])}`;
      c.save();
      c.globalAlpha *= share > 0 ? share : match;
      text(c, label, at, y - 40, 53, 'Mono', ink, 'center');
      c.restore();
      cutMark(c, at, y, chalk[r] * (1 - slips[r]));
    }
    if (index === 5) {
      text(c, f2(parts[r][0]), px + piece + 35, py + 96, 68, 'Mono', ribbon[r].dark);
    }
  }
  if (index === 4) {
    const t = elapsed;
    const shift = ease((t - 1.1) / 0.92);
    const bite = (r) => ease((t - (r ? 2.15 : 0.43)) / 0.63);
    const lift = 1 - ease((t - 2.9) / 0.6);
    const xx = mix(X + parts[0][0] * unit, X + parts[1][0] * unit, shift);
    const yy = mix(rows[0] + h + 130 - 139 * bite(0), rows[1] + h + 130 - 139 * bite(1), shift);
    const gape = (1 - mix(bite(0), bite(1), shift)) * 0.26;
    shears(c, xx, yy, gape, ease(t / 0.26) * lift);
  }

  if (join > 0) {
    const firstY = mix(411, 298, next);
    c.save();
    c.globalAlpha *= ease((join - 0.8) / 0.2);
    text(c, 'First coordinate', X, firstY - 34, 48);
    text(c, f2(output[0]), X + unit * output[0] + 34, firstY + 100, 75, 'Mono');
    joinStitches(c, X + unit * parts[0][0], firstY, join);
    c.restore();
  }
  if (next > 0) {
    // Show the new full lengths before laying the same two shares along this seam.
    const yy = 619;
    const smallH = 0.56;
    const yBlue = mix(yy - 11, yy, finish),
      yRed = mix(yy + 92, yy, finish);
    c.save();
    c.globalAlpha *= next;
    text(c, 'Second coordinate', X, yy - 43, 48);
    for (let r = 0; r < 2; r++) {
      const y = r ? yRed : yBlue;
      const x = X + (r ? unit * parts[0][1] * finish : 0);
      const keep = parts[r][1] * unit,
        full = ribbon[r].value[1] * unit;
      const bandH = h * mix(smallH, 1, finish);
      c.save();
      c.translate(x, y);
      fabric(c, r, 0, 0, keep, 0, 0, bandH);
      if (newWeights < 1) {
        c.save();
        c.globalAlpha *= 1 - newWeights;
        fabric(c, r, keep, 0, full - keep, keep, 0, bandH);
        c.restore();
      }
      if (newWeights > 0 && finish < 1) {
        c.save();
        c.scale(1, bandH / h);
        cutMark(c, keep, 0, newWeights * (1 - finish));
        c.restore();
      }
      c.restore();
      if (finish < 1) {
        c.save();
        c.globalAlpha *= 1 - finish;
        const right = full + (keep - full) * newWeights;
        text(
          c,
          newWeights > 0.5 ? Math.round(weights[r] * 100) + '%' : String(ribbon[r].value[1]),
          X + right + 24,
          y + 60,
          48,
          'Mono',
          ribbon[r].dark,
        );
        c.restore();
      }
    }
    joinStitches(c, X + unit * parts[0][1], yy, finish);
    if (finish) {
      c.save();
      c.globalAlpha *= finish;
      text(c, f2(output[1]), X + unit * output[1] + 34, yy + 100, 75, 'Mono');
      c.restore();
    }
    if (index === 8) {
      const show =
        amount(clock, 8, 'It supplies', 0.65) * (1 - amount(clock, 8, 'Find the seam', 0.7));
      const seam = X + unit * parts[0][1],
        end = X + unit * output[1];
      c.save();
      c.globalAlpha *= show;
      line(c, seam, yy - 14, end, yy - 14, ribbon[1].dark, 2.5);
      for (const edge of [seam, end]) line(c, edge, yy - 25, edge, yy - 8, ribbon[1].dark, 2.5);
      text(c, f2(parts[1][1]), (seam + end) / 2, yy - 30, 50, 'Mono', ribbon[1].dark, 'center');
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

function check() {
  assert.deepEqual(scores.map(f2), ['0.60', '1.05']);
  assert.deepEqual(
    weights.map((w) => Math.round(w * 100)),
    [42, 58],
  );
  assert(Math.abs(weights[0] + weights[1] - 1) < 1e-12);
  assert.deepEqual(
    parts.map((row) => row.map(f2)),
    [
      ['0.84', '0.42'],
      ['0.58', '1.16'],
    ],
  );
  assert(weights[0] < weights[1] && parts[0][0] > parts[1][0] && parts[0][1] < parts[1][1]);
  assert.deepEqual(output.map(f2), ['1.42', '1.58']);
}

export default { title: 'Attention, cut to length', beats, draw, check };
