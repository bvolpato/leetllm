import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { project, artifact, canvasRuntime, alternate, covered, cutoff } from './common.mjs';
const { canvas, viz } = await canvasRuntime();
const { createCanvas, GlobalFonts } = canvas;
const { renderRgbaVideo, smoothstep, interpolateCamera, tracePolyline } = viz;
const fontPath = process.env.DIRECTOR_SERIF;
if (fontPath && existsSync(fontPath)) GlobalFonts.registerFromPath(fontPath, 'Film Serif');
const timing = JSON.parse(readFileSync(artifact('timing.json'), 'utf8'));
const beats = Object.fromEntries(timing.beats.map((b) => [b.id, b]));
const word = (id, value, last = false) => {
  const b = beats[id],
    matches = b.words.filter((w) => w.text.toLowerCase().replace(/[^a-z-]/g, '') === value);
  if (!matches.length) throw Error('Missing narration cue ' + id + ' ' + value);
  return b.start + matches[last ? matches.length - 1 : 0].start;
};
const first = (id) => beats[id].start + beats[id].words[0].start;
const whole = (id) => beats[id].start + beats[id].duration;
const serif = fontPath
  ? '"Film Serif", Baskerville, Georgia, serif'
  : 'Baskerville, Georgia, serif';
const paper = '#eee8d8',
  amber = '#f0bb69',
  mint = '#7fd4b3';
const c = createCanvas(1920, 1080),
  ctx = c.getContext('2d');
const back = createCanvas(1920, 1080),
  bg = back.getContext('2d');
const light = bg.createRadialGradient(913, 480, 90, 930, 560, 1150);
light.addColorStop(0, '#242c2d');
light.addColorStop(0.55, '#151e20');
light.addColorStop(1, '#0d1417');
bg.fillStyle = light;
bg.fillRect(0, 0, 1920, 1080);
let seed = 408;
function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let i = 0; i < 34000; i++) {
  let k = random();
  bg.fillStyle = k > 0.52 ? 'rgba(220,231,209,.032)' : 'rgba(0,0,0,.046)';
  bg.fillRect(random() * 1920, random() * 1080, 1 + random(), 1);
}
const clamp = (x) => Math.max(0, Math.min(1, x));
const fall = (t, a, b) => smoothstep(clamp((t - a) / (b - a)));
const mix = (a, b, k) => a + (b - a) * k;
function line(x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function poly(points, fill) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) i ? ctx.lineTo(...points[i]) : ctx.moveTo(...points[i]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function text(label, x, y, size, face, color, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = size + 'px ' + (face === 'Baskerville' ? serif : face);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y);
}
function subline(points, progress, color, width) {
  const p = tracePolyline(
    points.map(([x, y]) => ({ x, y })),
    clamp(progress),
  );
  if (p.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  p.forEach(({ x, y }, i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}
function alpha(value, draw) {
  if (value <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, value);
  draw();
  ctx.restore();
}
const bx = 305,
  spacing = 143,
  base = 757,
  thick = 4.4,
  w = 102,
  dx = 35,
  dy = -21;
const outcomes = project.mornings;
function top(x, y, mark, showType, idx) {
  const surface = [
    [x, y],
    [x + w, y],
    [x + w + dx, y + dy],
    [x + dx, y + dy],
  ];
  poly(surface, '#f4f0e4');
  ctx.save();
  ctx.transform(1, 0, -dx / -dy, 1, x + dx, y + dy);
  if (showType > 0.04 && idx === 0) {
    alpha(showType, () => {
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#273a3a';
      ctx.fillText('JOB', 8, 13);
    });
  }
  ctx.fillStyle = mark;
  ctx.fillRect(46, 4, 42, 1.5);
  ctx.fillRect(46, 8, 30, 1.5);
  ctx.fillRect(46, 12, 40, 1.5);
  ctx.fillRect(8, 14.8, 12, 2);
  ctx.restore();
}
function pile(i, count, chosen, zoom, t, overhang, poster) {
  const x = bx + spacing * i;
  const amount = Math.max(0, count),
    h = amount * thick,
    y = base - h;
  if (amount <= 0.01) {
    poly(
      [
        [x, base + 1],
        [x + w, base + 1],
        [x + w + dx, base + dy],
        [x + dx, base + dy],
      ],
      '#3b4341',
    );
    return;
  }
  ctx.save();
  const shadow = ctx.createRadialGradient(
    x + w * 0.8,
    base + 3,
    3,
    x + w * 0.8,
    base + 3,
    Math.min(128, 45 + h * 0.15),
  );
  shadow.addColorStop(0, 'rgba(0,0,0,.32)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.translate(x + w * 0.8, base + 3);
  ctx.scale(1.75, 0.23);
  ctx.translate(-(x + w * 0.8), -(base + 3));
  ctx.fillStyle = shadow;
  ctx.fillRect(x - 100, base - 150, w + 200, 300);
  ctx.restore();
  poly(
    [
      [x, y],
      [x + w, y],
      [x + w, base],
      [x, base],
    ],
    '#d0ccb9',
  );
  poly(
    [
      [x + w, y],
      [x + w + dx, y + dy],
      [x + w + dx, base + dy],
      [x + w, base],
    ],
    '#9e9e90',
  );
  // An order is a physical sheet. The tall pile has exactly 100 sheets at rest.
  for (let j = 1; j < amount; j++) {
    const yy = base - j * thick;
    line(x, yy, x + w, yy, j % 5 === 0 ? '#8d9085' : '#aaa99b', j % 5 === 0 ? 1.1 : 0.65);
    line(x + w, yy, x + w + dx, yy + dy, j % 5 === 0 ? '#717969' : '#868c7e', 0.7);
  }
  const ink = chosen > 0.5 ? '#43866f' : '#6f776b';
  const shift = overhang * 17;
  top(x + shift, y, ink, clamp((zoom - 1) / 0.65), i);
  if (overhang > 0.02)
    alpha(overhang, () => line(x + shift, y + 1, x + w + shift, y + 1, '#edac65', 3));
  if (poster > 0) {
    alpha(poster, () => {
      ctx.save();
      ctx.transform(1, 0, -dx / -dy, 1, x + dx + shift, y + dy);
      ctx.fillStyle = '#e2aa76';
      ctx.fillRect(4, 2, 94, 15);
      ctx.fillStyle = '#4c5249';
      ctx.beginPath();
      ctx.arc(24, 9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(37, 5, 53, 2);
      ctx.fillRect(37, 10, 41, 2);
      ctx.restore();
    });
  }
  if (chosen > 0) {
    alpha(chosen, () => {
      poly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + Math.min(h, 6)],
          [x, y + Math.min(h, 6)],
        ],
        mint,
      );
      poly(
        [
          [x + w, y],
          [x + w + dx, y + dy],
          [x + w + dx, y + dy + 5],
          [x + w, y + 5],
        ],
        '#66ba9d',
      );
      poly(
        [
          [x, y],
          [x + w, y],
          [x + w + dx, y + dy],
          [x + dx, y + dy],
        ],
        '#a6dfc9',
      );
    });
  }
  if (i === 0 && t < 1 && zoom > 1.5) {
    const stamp = fall(t, 0, 0.62);
    const offset = (1 - stamp) * 38;
    if (offset > 0.01) {
      top(x - 0.28 * offset, y - offset, '#506255', 1, i);
    }
  }
  ctx.restore();
}
const wide = { x: 960, y: 560, zoom: 1 };
const ticketCamera = { x: 606, y: 893, zoom: 2.77 };
const sheetCamera = { x: 371, y: 703, zoom: 3.25 };
const posterCamera = { x: 1508, y: 622, zoom: 2.02 };
const gaugeCamera = { x: 1492, y: 600, zoom: 2.7 };
const second = alternate(),
  originalTarget = cutoff(outcomes, project.quantile),
  newTarget = cutoff(second, project.quantile);
const posterIndex = project.posterOrder.morning;
const cam = (a, b, t) => interpolateCamera(a, b, t, { easing: (n) => n });
function cameraAt(t) {
  let view = cam(
    ticketCamera,
    sheetCamera,
    fall(t, first('possibilities') - 0.45, first('possibilities') + 1.45),
  );
  view = cam(view, wide, fall(t, word('possibilities', 'each'), first('small') - 0.25));
  view = cam(view, posterCamera, fall(t, first('change') - 0.25, word('change', 'school') + 0.45));
  view = cam(view, wide, fall(t, word('change', 'forty') + 0.35, first('count') + 0.55));
  view = cam(view, gaugeCamera, fall(t, first('try') + 0.15, first('try') + 1.4));
  view = cam(view, wide, fall(t, word('forty', 'ninth') + 0.2, whole('forty') + 0.18));
  return cam(view, ticketCamera, fall(t, word('last', 'write') - 0.32, word('last', 'jobs') + 0.6));
}
function ticket(t) {
  const x = 369,
    y = 841,
    tw = 460,
    th = 166;
  const entry = 1 - fall(t, -0.12, 0.62);
  const stow =
    fall(t, first('possibilities') - 0.4, first('possibilities') + 0.7) *
    (1 - fall(t, word('last', 'write') - 0.45, word('last', 'forty') + 0.08));
  ctx.save();
  ctx.translate(-entry * 25, entry * 22 + 340 * stow);
  poly(
    [
      [x + 3, y + 6],
      [x + tw + 5, y + 6],
      [x + tw + 5, y + th + 6],
      [x + 3, y + th + 6],
    ],
    '#131b18',
  );
  poly(
    [
      [x, y],
      [x + tw, y],
      [x + tw, y + th - 9],
      [x + tw - 9, y + th],
      [x, y + th],
    ],
    '#e7e3cf',
  );
  line(x + 100, y + 16, x + 100, y + th - 13, '#acb19d', 1);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = '#2a3530';
    ctx.beginPath();
    ctx.arc(x + 4, y + 15 + i * 17, 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
  text('08:00', x + 54, y + 78, 17, 'Arial', '#455248', 'center');
  text('SHIFT', x + 54, y + 98, 12, 'Arial', '#66705e', 'center');
  text('Morning capacity', x + 125, y + 46, 29, 'Baskerville', '#283a30');
  line(x + 126, y + 118, x + 292, y + 118, '#83917b', 1.5);
  text('jobs', x + 313, y + 112, 23, 'Baskerville', '#364c3b');
  const written = fall(t, word('name', 'ten'), word('name', 'ten') + 0.3);
  const updated = fall(t, word('last', 'forty') - 0.12, word('last', 'forty') + 0.26);
  alpha(written * (1 - updated), () =>
    text(String(originalTarget), x + 135, y + 109, 51, 'Baskerville', '#30765c'),
  );
  alpha(updated, () => text(String(newTarget), x + 135, y + 109, 52, 'Baskerville', '#30765c'));
  const firstPencil =
    fall(t, word('open', 'how') - 0.2, word('open', 'much') + 0.4) *
    (1 - fall(t, whole('ticket') - 0.8, whole('ticket') - 0.1));
  const lastPencil =
    fall(t, word('last', 'write') - 0.1, word('last', 'forty') + 0.1) *
    (1 - fall(t, word('last', 'jobs') + 0.1, whole('last') - 0.1));
  const pencil = Math.max(firstPencil, lastPencil);
  if (pencil > 0.005) {
    ctx.save();
    ctx.translate(x + 183 + (1 - pencil) * 87, y + 105 - (1 - pencil) * 65);
    ctx.rotate(-0.71);
    alpha(pencil, () => {
      poly(
        [
          [0, 0],
          [10, -3.4],
          [10, 3.4],
        ],
        '#9b9172',
      );
      poly(
        [
          [0, 0],
          [3, -1],
          [3, 1],
        ],
        '#232a25',
      );
      poly(
        [
          [10, -3.4],
          [88, -3.4],
          [92, 0],
          [88, 3.4],
          [10, 3.4],
        ],
        '#bd9254',
      );
      line(12, -2, 86, -2, '#dbb875', 1.3);
    });
    ctx.restore();
  }
  ctx.fillStyle = '#a8a38b';
  ctx.fillRect(x + 195, y - 4, 65, 10);
  line(x + 198, y + 3, x + 255, y + 3, '#ded6af', 1);
  ctx.restore();
}
function annotate(x, y, label, weight = 1, ink = paper) {
  alpha(weight, () => {
    line(x, y - 1, x, y - 28, '#a0ada1', 1.6);
    text(label, x, y - 38, 40, 'Baskerville', ink, 'center');
  });
}
function paint(t) {
  const view = cameraAt(t);
  ctx.resetTransform();
  ctx.globalAlpha = 1;
  ctx.drawImage(back, 0, 0);
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-view.x, -view.y);
  const wood = ctx.createLinearGradient(0, 731, 0, 940);
  wood.addColorStop(0, '#404a44');
  wood.addColorStop(0.5, '#313c36');
  wood.addColorStop(1, '#232d28');
  poly(
    [
      [-1400, 739],
      [3560, 739],
      [3370, 848],
      [-1590, 848],
    ],
    wood,
  );
  poly(
    [
      [-1590, 848],
      [3370, 848],
      [3370, 873],
      [-1590, 873],
    ],
    '#202a25',
  );
  line(-1590, 848, 3370, 848, '#58604e', 2);
  ticket(t);
  const growPoster = fall(t, word('change', 'poster') - 0.2, word('change', 'forty') + 0.47);
  const appearing = (i) =>
    i === 0
      ? 1
      : fall(t, first('small') - 0.36 + (i - 1) * 0.073, first('small') + 0.4 + (i - 1) * 0.073);
  const shift10 = fall(t, word('ten', 'sheet') - 0.22, word('ten', 'sheet') + 0.2);
  const shift39 = fall(t, first('try') + 0.3, word('try', 'thirty-nine') + 0.38);
  const shift40 = fall(t, word('forty', 'forty') - 0.2, word('forty', 'forty') + 0.19);
  const rail = 9 + shift10 + 29 * shift39 + shift40;
  const showRail = fall(t, first('nine') - 0.4, word('nine', 'nine') + 0.2);
  const jobs = outcomes.map((v, i) => (i === posterIndex ? mix(v, newTarget, growPoster) : v));
  const count = covered(jobs, rail + 1e-6);
  const tau = fall(t, word('ten', 'sheet'), word('ten', 'sheet') + 0.32);
  const marked = (i) => (i === 9 ? 0 : i === posterIndex ? tau * (1 - growPoster) + shift40 : tau);
  outcomes.forEach((v, i) => {
    let height =
      i === 9
        ? 1 + (v - 1) * fall(t, word('large', 'hundred') - 0.45, word('large', 'hundred') + 0.62)
        : jobs[i];
    if (i === 0 && t < first('possibilities') + 1.25)
      height = 1 + 9 * fall(t, first('possibilities') - 0.24, first('possibilities') + 0.75);
    const tall =
      showRail * (1 - shift10) * (i < 9 ? 1 : 0) +
      (i === posterIndex ? shift39 * (1 - shift40) : 0);
    pile(
      i,
      appearing(i) * height,
      marked(i),
      view.zoom,
      t,
      tall,
      growPoster * (i === posterIndex ? 1 : 0),
    );
  });
  const xMid = bx + 4 * spacing + w / 2 + dx * 0.4;
  const baseTags =
    fall(t, word('small', 'ten') + 0.12, word('small', 'ten') + 0.48) *
    (1 - fall(t, first('nine') - 0.55, first('nine') - 0.18));
  annotate(xMid, base - originalTarget * thick + dy, '10 jobs', baseTags);
  const hiTag =
    fall(t, word('large', 'hundred') + 0.45, word('large', 'hundred') + 0.82) *
    (1 - fall(t, first('nine') - 0.55, first('nine') - 0.18));
  annotate(bx + 9 * spacing + w * 0.68, base - 100 * thick + dy, '100 jobs', hiTag);
  const posterMark =
    fall(t, word('change', 'school') - 0.18, word('change', 'school') + 0.38) *
    (1 - fall(t, first('try') - 0.2, first('try') + 0.2));
  alpha(posterMark, () => {
    const px = bx + posterIndex * spacing + w * 0.48,
      py = base - jobs[posterIndex] * thick + dy;
    subline(
      [
        [px, py - 2],
        [px - 12, py - 26],
        [px - 46, py - 26],
      ],
      1,
      '#d7b58c',
      1.7,
    );
    text('School posters', px - 52, py - 18, 36, 'Baskerville', '#f2ce9a', 'right');
  });
  if (showRail > 0) {
    alpha(showRail, () => {
      const yy = base - rail * thick;
      // This is a physical straightedge. The two dark lips keep one occupied sheet visible.
      ctx.fillStyle = '#48594f';
      ctx.fillRect(261, base - 222, 5, 231);
      for (let j = 0; j <= 48; j++) {
        const sy = base - j * thick;
        line(j % 5 === 0 ? 248 : 257, sy, 266, sy, '#8b9b8b', j % 5 === 0 ? 1.8 : 0.8);
      }
      const tone = count >= 9 ? mint : amber;
      const extend = fall(t, first('nine') - 0.4, word('nine', 'jobs') + 0.08);
      subline(
        [
          [267, yy],
          [1694, yy],
        ],
        extend,
        'rgba(21,30,26,.8)',
        8,
      );
      subline(
        [
          [267, yy],
          [1694, yy],
        ],
        extend,
        tone,
        3,
      );
      poly(
        [
          [247, yy - 7],
          [267, yy],
          [247, yy + 7],
        ],
        tone,
      );
      text(Math.round(rail) + ' jobs', 238, yy + 12, 42, 'Arial', tone, 'right');
      const detail =
        fall(t, first('try') + 0.82, first('try') + 1.38) *
        (1 - fall(t, word('forty', 'ninth') + 0.28, whole('forty') + 0.18));
      alpha(detail, () => {
        const x = bx + posterIndex * spacing - 12;
        ctx.fillStyle = '#1c2922';
        ctx.fillRect(x - 110, yy - 25, 108, 25);
        text(Math.round(rail) + ' jobs', x - 10, yy - 7, 19, 'Arial', tone, 'right');
      });
    });
  }
  ctx.restore();
  function legend(label, opacity, color = paper, size = 73) {
    alpha(opacity, () => text(label, 238, 256, size, 'Baskerville', color));
  }
  function envelope(a, b) {
    return fall(t, a, a + 0.38) * (1 - fall(t, b - 0.34, b));
  }
  legend(
    'One stack per possible morning',
    envelope(first('possibilities') + 1.9, first('ask') - 0.35),
    paper,
    52,
  );
  legend('Room for nine mornings?', envelope(first('ask') - 0.08, first('nine') - 0.12));
  const firstCount =
    fall(t, word('nine', 'nine') + 0.24, word('nine', 'nine') + 0.62) *
    (1 - fall(t, first('change') - 0.65, first('change') - 0.15));
  legend(count + ' of 10 mornings fit', firstCount, count >= 9 ? mint : paper);
  alpha(envelope(word('name', 'percentile') + 0.05, first('change') - 0.16), () =>
    text('P90   ·   10 jobs', 243, 322, 43, 'Baskerville', paper),
  );
  legend('How many still fit?', envelope(word('count', 'how') - 0.05, first('eight') - 0.1));
  legend('8 of 10 mornings fit', envelope(first('eight') + 0.08, first('try') - 0.19), amber);
  legend(
    '9 of 10 mornings fit',
    envelope(whole('forty') - 0.45, word('last', 'write') - 0.2),
    mint,
  );
}
if (process.argv.includes('--stills')) {
  const shots = [
    0.25,
    first('possibilities') + 1,
    first('ask') + 1,
    first('nine') + 2,
    first('name') + 1,
    word('change', 'forty') + 0.7,
    first('eight') + 1,
    word('try', 'thirty-nine') + 1,
    word('forty', 'forty') + 0.5,
    word('last', 'jobs') + 1,
  ];
  for (const [i, sec] of shots.entries()) {
    paint(sec);
    writeFileSync(
      artifact('still-' + String(i).padStart(2, '0') + '.png'),
      c.toBuffer('image/png'),
    );
  }
} else {
  let n = 0;
  await renderRgbaVideo(
    (frame) => {
      const ix = Math.round((frame.time * 30) / 1000);
      if (ix !== n++) throw Error('Unexpected frame number ' + ix);
      paint(ix / 30);
      return c.data();
    },
    {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: timing.seconds * 1000,
      threads: 2,
      outputPath: artifact('body.mp4'),
    },
  );
  if (n !== timing.frames) throw Error('Wrong body frame count');
}
