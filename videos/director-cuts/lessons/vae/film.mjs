import assert from 'node:assert/strict';
import {
  TRAINED_VAE as trained,
  coordinateSwapStudy,
  noise,
} from '../../../films/vae/fixtures.mjs';

const beats = [
  {
    id: 'exposure',
    say: 'Watch the picture come through. Four bright pixels make a square. The decoder rebuilt that little patch of light from just two numbers.',
    hold: 0.9,
  },
  {
    id: 'donor',
    say: "Here's another crop from the training set. See the two bright pixels farther down? Let's borrow a number from this picture. Which one would make the square turn into the strip?",
    hold: 1.5,
  },
  {
    id: 'clouds',
    say: 'In this variational autoencoder, the encoder gives each crop a cloud of possible codes. During training, the decoder learned to rebuild the pixels from a point sampled from that cloud.',
    hold: 0.6,
  },
  {
    id: 'centers',
    say: "For this test, take the center of each cloud. Its two coordinates give us a repeatable code for each crop. We'll keep the trained decoder fixed.",
    hold: 0.8,
  },
  {
    id: 'first',
    say: "Start with the square's own pair. Borrow the donor's first number and leave the second in place. Watch the next exposure.",
    hold: 1.6,
  },
  {
    id: 'restore',
    say: 'Still a square. All four lights are where they were. Put the first number back so we can try the other one on its own.',
    hold: 0.9,
  },
  {
    id: 'second',
    say: "Keep the first number here. Slide the donor's second number into place. Keep your eye on the picture as the film advances.",
    hold: 1.6,
  },
  {
    id: 'strip',
    say: "There's the strip. Look back at the original. It still has its square. For these crops, changing the second coordinate is what switched the pattern the decoder drew.",
    hold: 3.0,
  },
];

const { inputRows, posteriorMeans: means, logVariances } = trained;
const own = trained.meanDecodedRows[0];
const first = coordinateSwapStudy.firstOnlyRows[0];
// Giving the original the donor's second coordinate makes the same ordered pair
// as giving the donor the original's first coordinate.
const second = coordinateSwapStudy.firstOnlyRows[1];
const exposures = [null, own, first, own, second];
const ink = '#342c49';
const identity = [
  { name: 'Original', edge: '#504590', mount: '#c4bee7', light: '#f1ecfa', dark: '#39335b' },
  { name: 'Donor', edge: '#a74128', mount: '#f3b192', light: '#ffdfc6', dark: '#683226' },
];
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const shown = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(3);

function check() {
  const lit = (values) => values.flatMap((value, index) => (value > 0.5 ? [index] : []));
  const square = [6, 7, 11, 12],
    strip = [16, 17];
  assert.deepEqual(inputRows.map(lit), [square, strip]);
  assert.deepEqual(exposures.slice(1).map(lit), [square, square, square, strip]);
  const originalWithSecond = [means[0][0], means[1][1]];
  const donorWithFirst = means[1].map((value, i) => (i === 0 ? means[0][0] : value));
  assert.deepEqual(originalWithSecond, donorWithFirst);
  const mse = (a, b) => a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0) / a.length;
  assert(mse(own, first) < 1e-8);
  assert(mse(inputRows[0], second) > 100 * mse(inputRows[0], first));
  assert.deepEqual(
    means.map((row) => row.map(shown)),
    [
      ['−0.021', '+0.819'],
      ['+0.014', '−0.983'],
    ],
  );
  assert(logVariances.flat().every((v) => Number.isFinite(Math.exp(v / 2))));
  return true;
}

function box(c, x, y, w, h, r, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
}
function line(c, x, y, xx, yy, color, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function text(c, s, x, y, size, color = ink, face = 'Sans', weight = 400, align = 'left') {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}
function linear(c, x, y, xx, yy, stops) {
  const g = c.createLinearGradient(x, y, xx, yy);
  stops.forEach(([t, color]) => g.addColorStop(t, color));
  return g;
}

// Each cell transmits light according to the brightness in the saved model output.
function bitmap(c, values, x, y, size, large = false) {
  const cell = size / 5;
  c.fillStyle = '#241d39';
  c.fillRect(x, y, size, size);
  values.forEach((v, i) => {
    const px = x + (i % 5) * cell,
      py = y + Math.floor(i / 5) * cell;
    const light = [31 + 224 * v, 25 + 225 * v, 49 + 191 * v].map(Math.round);
    c.fillStyle = 'rgb(' + light.join(',') + ')';
    c.fillRect(px, py, cell + 0.3, cell + 0.3);
    if (large) {
      c.fillStyle = 'rgba(243,228,255,0.07)';
      c.fillRect(px + 1, py + 1, cell - 1, 2);
      c.fillStyle = 'rgba(16,8,25,0.31)';
      c.fillRect(px + cell - 4, py, 4, cell);
      c.fillRect(px, py + cell - 4, cell - 4, 4);
    } else {
      c.fillStyle = 'rgba(16,8,25,0.25)';
      c.fillRect(px + cell - 2, py, 2, cell);
      c.fillRect(px, py + cell - 2, cell - 2, 2);
    }
  });
  if (large) {
    const wash = linear(c, x, y, x + size, y + size, [
      [0, 'rgba(218,198,242,0.11)'],
      [0.6, 'rgba(218,198,242,0)'],
      [1, 'rgba(9,7,22,0.08)'],
    ]);
    c.fillStyle = wash;
    c.fillRect(x, y, size, size);
  }
}

// Fixed standard-normal draws keep the same sampled points on repeat playback.
function cloud(c, row, x, y, size, center, sample) {
  const { edge, light } = identity[row];
  c.fillStyle = light;
  c.fillRect(x, y, size, size);
  const unit = size / 5.6,
    ox = x + size / 2,
    oy = y + size / 2;
  const mx = ox + means[row][0] * unit,
    my = oy - means[row][1] * unit;
  const [sx, sy] = logVariances[row].map((v) => Math.exp(v / 2) * unit);
  c.save();
  c.beginPath();
  c.rect(x, y, size, size);
  c.clip();
  line(c, ox, y, ox, y + size, '#b6aabd');
  line(c, x, oy, x + size, oy, '#b6aabd');
  c.translate(mx, my);
  c.scale(sx, sy);
  const density = c.createRadialGradient(0, 0, 0, 0, 0, 2.7);
  for (const r of [0, 0.5, 1, 1.5, 2, 2.5, 2.7]) {
    const alpha = r === 2.7 ? 0 : 0.85 * Math.exp((-r * r) / 2);
    density.addColorStop(
      r / 2.7,
      edge +
        Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0'),
    );
  }
  c.fillStyle = density;
  c.fillRect(-2.7, -2.7, 5.4, 5.4);
  c.restore();
  if (sample > 0) {
    const { x: dx, y: dy } = noise[row];
    c.save();
    c.globalAlpha *= sample;
    c.beginPath();
    c.arc(mx + sx * dx, my - sy * dy, 8, 0, Math.PI * 2);
    c.fillStyle = edge;
    c.fill();
    c.strokeStyle = '#fffaf5';
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  }
  if (center > 0) {
    c.save();
    c.globalAlpha *= center;
    c.beginPath();
    c.arc(mx, my, 7, 0, Math.PI * 2);
    c.fillStyle = '#fffaf5';
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  }
}

const slideCenters = [252, 685],
  slideY = 362,
  slideWidth = 342;
function slide(c, row, turn, center, amount, showCode, sample) {
  if (amount === 0) return;
  const id = identity[row],
    w = slideWidth,
    h = 352,
    side = 216;
  c.save();
  c.translate(slideCenters[row] + (1 - amount) * 126, slideY - (1 - amount) * 232);
  c.rotate((row === 0 ? -0.042 : 0.049) + (1 - amount) * 0.15);
  c.globalAlpha *= amount;
  const flip = Math.cos(turn * Math.PI);
  c.scale(Math.max(0.018, Math.abs(flip)), 1);
  const x = -w / 2,
    y = -h / 2;
  c.shadowBlur = 18;
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 12;
  c.shadowColor = 'rgba(60,39,68,0.23)';
  box(c, x, y + 4, w, h, 16, id.edge);
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.shadowOffsetX = 0;
  box(
    c,
    x,
    y,
    w,
    h,
    16,
    linear(c, x, y, -x, -y, [
      [0, id.light],
      [0.45, id.mount],
      [1, id.mount],
    ]),
  );
  line(c, x + 18, y + 3, -x - 18, y + 3, '#ffffffa0', 3);
  // The clipped registration corner and the recessed window belong to the mount.
  c.fillStyle = id.edge;
  c.beginPath();
  c.moveTo(x + 15, y + 16);
  c.lineTo(x + 42, y + 16);
  c.lineTo(x + 15, y + 43);
  c.fill();
  text(c, id.name, 0, -140, 38, id.dark, 'Serif', 400, 'center');
  box(c, -side / 2 - 6, -side / 2 - 5, side + 12, side + 12, 5, id.edge);
  if (flip > 0) bitmap(c, inputRows[row], -side / 2, -side / 2, side);
  else cloud(c, row, -side / 2, -side / 2, side, center, sample);
  if (showCode > 0) {
    c.save();
    c.globalAlpha *= showCode;
    text(c, means[row].map(shown).join('   '), 0, 137, 28, id.dark, 'Mono', 400, 'center');
    c.restore();
  } else if (flip < 0) {
    text(
      c,
      sample > 0.5 ? 'Sampled code' : 'Possible codes',
      0,
      141,
      30,
      id.dark,
      'Sans',
      400,
      'center',
    );
  }
  c.restore();
}

const stripX = 1025,
  stripW = 776,
  aperture = 596,
  frameY = 185,
  pitch = 794;
function filmStrip(c, advance) {
  // The splice passes a fixed gate. Each new frame is a complete recorded output.
  const stop = Math.floor(advance);
  const residual = advance - stop;
  const gx = stripX,
    gy = 65,
    gw = stripW,
    gh = 842;
  c.save();
  c.shadowColor = 'rgba(59,38,54,0.28)';
  c.shadowBlur = 22;
  c.shadowOffsetX = 9;
  c.shadowOffsetY = 15;
  box(c, gx - 16, gy - 9, gw + 32, gh + 18, 22, '#afa3b5');
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
  box(
    c,
    gx - 16,
    gy - 14,
    gw + 32,
    gh + 18,
    22,
    linear(c, gx, gy, gx + gw, gy + gh, [
      [0, '#fdf6fb'],
      [0.46, '#cfc4d1'],
      [1, '#b9aabd'],
    ]),
  );
  c.beginPath();
  c.roundRect(gx, gy, gw, gh, 12);
  c.clip();
  c.fillStyle = linear(c, gx, 0, gx + gw, 0, [
    [0, '#552f42'],
    [0.035, '#986057'],
    [0.082, '#4d3042'],
    [0.15, '#2a2336'],
    [0.85, '#302338'],
    [0.955, '#8b5451'],
    [1, '#593147'],
  ]);
  c.fillRect(gx, gy, gw, gh);
  for (let j = -2; j <= 2; j++) {
    const idx = stop + j;
    const top = frameY + (j - residual) * pitch;
    if (top + pitch < gy || top - 70 > gy + gh) continue;
    const ax = gx + (gw - aperture) / 2;
    box(c, ax - 5, top - 5, aperture + 10, aperture + 10, 9, '#1a1424');
    if (exposures[idx]) bitmap(c, exposures[idx], ax, top, aperture, true);
    else box(c, ax, top, aperture, aperture, 3, '#312738');
    if (exposures[idx]) {
      text(c, 'Decoder output', ax, top + aperture + 47, 39, '#f9e9db', 'Serif');
    }
    line(c, gx + 67, top - 94, gx + gw - 67, top - 94, '#d697734a', 3);
    for (let k = 0; k < 8; k++) {
      const hy = top - 85 + (k * pitch) / 8;
      for (const hx of [gx + 19, gx + gw - 54]) {
        box(c, hx, hy, 35, 48, 7, '#382a35');
        box(
          c,
          hx + 1,
          hy + 3,
          33,
          43,
          6,
          linear(c, hx, hy, hx + 33, hy + 43, [
            [0, '#d1c0c5'],
            [0.24, '#f1e5e3'],
            [1, '#fff7e8'],
          ]),
        );
      }
    }
  }
  // A fixed pair of gate marks brackets the display aperture.
  for (const x of [gx + 68, gx + gw - 68]) {
    line(c, x, gy + 8, x, gy + gh - 8, '#ffceac41', 2);
  }
  c.restore();
}

const slotX = [292, 640],
  slotY = 685,
  tokenWidth = 284;
function token(c, row, axis, x, y, scale = 1, angle = 0) {
  const id = identity[row];
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  c.shadowColor = 'rgba(49,30,52,0.24)';
  c.shadowBlur = 8;
  c.shadowOffsetY = 7;
  box(c, -tokenWidth / 2, -64, tokenWidth, 128, 5, id.edge);
  c.shadowColor = 'transparent';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  box(c, -tokenWidth / 2, -65, tokenWidth, 123, 5, id.mount);
  c.fillStyle = id.edge;
  c.fillRect(-tokenWidth / 2 + 2, -64, 14, 119);
  line(c, -tokenWidth / 2 + 17, -62, tokenWidth / 2 - 6, -62, id.light, 3);
  text(c, axis ? 'Second' : 'First', 4, -36, 30, id.dark, 'Sans', 600, 'center');
  text(c, shown(means[row][axis]), 4, 16, 48, id.dark, 'Mono', 400, 'center');
  c.restore();
}

function decoderCode(c, firstSwap, secondSwap, restoring, opacity) {
  if (opacity <= 0) return;
  c.save();
  c.globalAlpha *= opacity;
  text(
    c,
    'Code in decoder',
    (slotX[0] + slotX[1]) / 2,
    slotY + 135,
    45,
    ink,
    'Serif',
    400,
    'center',
  );
  const left = slotX[0] - tokenWidth / 2 - 25,
    right = slotX[1] + tokenWidth / 2 + 25;
  box(c, left, slotY - 81, right - left, 159, 10, '#cabfd4');
  box(c, left + 3, slotY - 78, right - left - 6, 152, 9, '#ded3e4');
  for (const [axis, swap] of [firstSwap, secondSwap].entries()) {
    const x = slotX[axis];
    box(c, x - tokenWidth / 2 - 4, slotY - 66, tokenWidth + 8, 132, 7, '#a899af');
    if (swap === 0 || swap === 1) token(c, swap, axis, x, slotY);
    else {
      const source = restoring ? 0 : 1,
        time = restoring ? 1 - swap : swap;
      const travel = smooth(time);
      token(c, 1 - source, axis, x, slotY);
      const sx = slideCenters[source],
        sy = slideY + 136;
      const dx = mix(sx, x, travel),
        dy = mix(sy, slotY, travel) - 50 * Math.sin(Math.PI * travel);
      c.save();
      c.globalAlpha *= Math.min(1, time * 7);
      token(c, source, axis, dx, dy, mix(0.48, 1, travel), 0.05 * Math.sin(Math.PI * travel));
      c.restore();
    }
  }
  c.restore();
}

function draw(c, clock) {
  const { index: i, elapsed, reveal } = clock;
  const donor = i === 0 ? 0 : i === 1 ? smooth(Math.min(elapsed / 1.15, 1)) : 1;
  let turn = 0,
    marker = 0,
    sample = 0,
    closeUp = 0;
  if (i === 2) {
    closeUp = smooth(reveal('In this variational autoencoder', 1.5));
    turn = smooth(reveal('encoder gives each crop', 0.95));
    sample = smooth(reveal('a point sampled', 0.5));
  }
  if (i === 3) {
    marker = smooth(reveal('take the center', 0.7));
    sample = 1 - marker;
    turn = 1 - smooth(reveal('repeatable code', 1.05));
    closeUp = 1 - smooth(reveal("We'll keep the trained decoder fixed", 1.35));
  }
  const showNumbers = i < 3 ? 0 : i === 3 ? marker : 1;
  let a = 0,
    b = 0,
    position = 1;
  if (i === 0) position = smooth(clamp((elapsed + 0.39) / 1.36));
  if (i === 4) {
    a = smooth(reveal("Borrow the donor's first number", 1.25));
    position = 1 + smooth(reveal('Watch the next exposure', 1.15));
  }
  if (i === 5) {
    a = 1 - smooth(reveal('Put the first number back', 1.0));
    position = 2 + smooth(reveal('so we can try', 0.95));
  }
  if (i === 6) {
    b = smooth(reveal("Slide the donor's second number", 1.3));
    position = 3 + smooth(reveal('as the film advances', 1.1));
  }
  if (i === 7) {
    b = 1;
    position = 4;
  }

  c.save();
  c.fillStyle = linear(c, 0, 0, 1670, 1080, [
    [0, '#f7f0f4'],
    [0.4, '#eee5ee'],
    [0.7, '#dbd2e2'],
    [1, '#c9becf'],
  ]);
  c.fillRect(0, 0, 1920, 1080);
  c.translate(15 * closeUp, -251 * closeUp);
  c.scale(1 + closeUp, 1 + closeUp);
  const spread = i === 0 ? smooth(reveal('The decoder rebuilt', 1.5)) : 1;
  c.save();
  c.translate(-453 * (1 - spread), 0);
  filmStrip(c, position);
  c.restore();
  c.globalAlpha *= spread;
  c.translate(-28 * (1 - spread), 0);
  slide(c, 0, turn, marker, 1, showNumbers, sample);
  slide(c, 1, turn, marker, donor, showNumbers, sample);
  decoderCode(c, a, b, i === 5, clamp(1 - 3 * closeUp));
  c.restore();
}

export default { title: 'The borrowed coordinate', beats, draw, check };
