import { createRequire } from 'node:module';
import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fixture, shortened, corrected, score } from './film.mjs';

const { DIRECTOR_WORK, DIRECTOR_MODULES, COURSE_VIDEOS } = process.env;
const require = createRequire(join(DIRECTOR_MODULES || COURSE_VIDEOS, 'draw.cjs'));
// The font registry belongs to the course's native canvas instance.
const courseRequire = createRequire(join(COURSE_VIDEOS, 'draw.cjs'));
const { createCanvas } = courseRequire('@napi-rs/canvas');
const { renderRgbaVideo } = await import(pathToFileURL(require.resolve('vizmatic')));
const { registerLessonFonts } = await import(pathToFileURL(join(COURSE_VIDEOS, 'lib/fonts.mjs')));
registerLessonFonts();
const timing = JSON.parse(readFileSync(join(DIRECTOR_WORK, 'timing.json')));
const beats = Object.fromEntries(timing.beats.map((b) => [b.id, b]));
const start = (id) => beats[id].start;
function spoken(id, text) {
  const word = beats[id].words.find((w) => w.text.toLowerCase().replace(/[^a-z]/g, '') === text);
  if (!word) throw Error('Unmatched visual cue ' + id + ' ' + text);
  return start(id) + word.start;
}
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (t, a, d) => {
  const x = clamp((t - a) / d);
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, k) => a + (b - a) * k;
const c = {
  bg: '#16151b',
  ink: '#231e24',
  paper: '#e8ddc3',
  cream: '#faf0d8',
  muted: '#a8a39a',
  rule: '#60585e',
  bad: '#db795a',
  green: '#8cd6b6',
  darkGreen: '#22594b',
  red: '#a4452c',
  light: '#f4eee1',
};
const canvas = createCanvas(1920, 1080),
  ctx = canvas.getContext('2d');
const backdrop = createCanvas(1920, 1080),
  background = backdrop.getContext('2d');
const light = background.createRadialGradient(830, 455, 80, 1000, 560, 1190);
light.addColorStop(0, '#302931');
light.addColorStop(0.7, '#1c191f');
light.addColorStop(1, '#111115');
background.fillStyle = light;
background.fillRect(0, 0, 1920, 1080);
function path(points, color) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function segment(x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function word(str, x, y, size, color, align = 'left', family = 'Lesson Sans') {
  ctx.fillStyle = color;
  ctx.font = size + 'px "' + family + '"';
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}
function mark(x, y, r, pass, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.19;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (pass) {
    ctx.moveTo(-r * 0.85, -r * 0.02);
    ctx.lineTo(-r * 0.26, r * 0.53);
    ctx.lineTo(r * 0.89, -r * 0.62);
  } else {
    ctx.moveTo(-r * 0.57, -r * 0.57);
    ctx.lineTo(r * 0.57, r * 0.57);
    ctx.moveTo(r * 0.57, -r * 0.57);
    ctx.lineTo(-r * 0.57, r * 0.57);
  }
  ctx.stroke();
  ctx.restore();
}
function ticketShape(w, h, stock) {
  const x = -w / 2,
    y = -h / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.31)';
  ctx.shadowBlur = 13;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(-x - 20, y);
  ctx.lineTo(-x, y + 20);
  ctx.lineTo(-x, -y - 20);
  ctx.lineTo(-x - 20, -y);
  ctx.lineTo(x + 20, -y);
  ctx.lineTo(x, -y - 20);
  ctx.lineTo(x, y + 20);
  ctx.closePath();
  ctx.fillStyle = stock;
  ctx.fill();
  ctx.restore();
}
function smallTicket(i, x, y, correction = false, angle = 0, opacity = 1) {
  const w = 310,
    h = 283,
    r = fixture[i];
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ticketShape(w, h, c.paper);
  ctx.fillStyle = c.ink;
  ctx.beginPath();
  ctx.arc(-108, -99, 8, 0, Math.PI * 2);
  ctx.fill();
  word('REQUEST', -88, -88, 23, '#695e55');
  word(String(r.id), 0, 17, 82, c.ink, 'center', 'Lesson Mono');
  ctx.setLineDash([7, 8]);
  segment(-128, 52, 128, 52, '#927e6c', 1.6);
  ctx.setLineDash([]);
  mark(0, 94, 29, i !== 1 || correction, i !== 1 || correction ? c.darkGreen : c.red);
  ctx.restore();
}
function slot(x, y, id) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#131217';
  ctx.fillRect(-151, -137, 302, 274);
  ctx.setLineDash([7, 9]);
  ctx.strokeStyle = '#6a5d60';
  ctx.lineWidth = 2;
  ctx.strokeRect(-150, -136, 300, 272);
  ctx.setLineDash([]);
  word(String(id), 0, 18, 62, '#61565b', 'center', 'Lesson Mono');
  ctx.restore();
}
function fraction(counts, x, y, flip) {
  word('Exact matches', x, y - 136, 37, c.muted, 'center');
  word(String(counts[0]), x - 87, y, 140, c.light, 'center', 'Lesson Serif');
  word('/', x, y, 126, c.muted, 'center', 'Lesson Serif');
  if (!flip) {
    word(String(counts[1]), x + 87, y, 140, c.light, 'center', 'Lesson Serif');
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 30, y - 111, 127, 122);
  ctx.clip();
  word(String(flip.from), x + 87, y + 132 * flip.p, 140, c.light, 'center', 'Lesson Serif');
  word(String(flip.to), x + 87, y - 132 * (1 - flip.p), 140, c.light, 'center', 'Lesson Serif');
  ctx.restore();
}
function circleMatch(x, y, amount) {
  if (amount <= 0) return;
  ctx.beginPath();
  ctx.ellipse(x, y, 55, 34, -0.1, -Math.PI * 0.65, -Math.PI * 0.65 + Math.PI * 2.08 * amount);
  ctx.strokeStyle = c.darkGreen;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.5;
  ctx.stroke();
}
const centers = [544, 960, 1376],
  slotsY = 629;
const dropStart = 0.06,
  dropDuration = 2.23;
function board(t) {
  const backAt = start('replay'),
    halfWay = backAt + 0.58;
  const returning = t >= backAt,
    fixed = t >= spoken('changed', 'blocked');
  const drop = ease(t, dropStart, dropDuration);
  const showMiddle = returning ? ease(t, halfWay, 0.73) : 1 - drop;
  const counts =
    returning && showMiddle > 0.85
      ? fixed
        ? score(corrected)
        : score(fixture)
      : drop > 0.94
        ? score(shortened)
        : score(fixture);
  const flipAt = returning ? halfWay : 1.62;
  const fp = ease(t, flipAt, 0.58);
  const flip = fp > 0 && fp < 1 ? { from: returning ? 2 : 3, to: returning ? 3 : 2, p: fp } : null;
  fraction(counts, 960, 352, flip);
  segment(326, 823, 1594, 823, '#51484f', 2);
  centers.forEach((x, i) => slot(x, slotsY, fixture[i].id));
  smallTicket(0, centers[0], slotsY);
  smallTicket(2, centers[2], slotsY);
  if (t >= start('none') && t < start('return')) {
    circleMatch(centers[0], slotsY + 94, ease(t, spoken('none', 'two'), 0.57));
    circleMatch(centers[2], slotsY + 94, ease(t, spoken('none', 'both'), 0.57));
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(690, 410, 515, 413);
  ctx.clip();
  if (returning) {
    smallTicket(1, 960, slotsY + 310 * (1 - showMiddle), fixed, -0.055 * (1 - showMiddle));
  } else {
    smallTicket(1, 960 + 38 * drop, slotsY + 389 * drop, false, 0.095 * drop);
  }
  ctx.restore();
}
function closeTicket(t, zoom, second) {
  ctx.save();
  const scale = lerp(0.31, 1, zoom);
  ctx.globalAlpha *= Math.min(1, zoom * 4);
  ctx.translate(960, lerp(slotsY + 75, 523, zoom));
  ctx.scale(scale, scale);
  const w = 1350,
    h = 585;
  ticketShape(w, h, c.cream);
  const left = -w / 2,
    right = w / 2;
  ctx.fillStyle = c.ink;
  ctx.beginPath();
  ctx.arc(left + 83, -200, 15, 0, Math.PI * 2);
  ctx.fill();
  word('REQUEST', left + 69, -114, 36, '#776955');
  word('102', left + 65, 19, 104, c.ink, 'left', 'Lesson Mono');
  ctx.setLineDash([10, 10]);
  segment(left + 343, -h / 2 + 18, left + 343, h / 2 - 18, '#98826d', 2);
  ctx.setLineDash([]);
  const labelX = left + 425;
  const expected = second ? 1 : ease(t, spoken('expected', 'expected'), 0.4);
  const saved = second ? 1 : ease(t, spoken('saved', 'saved'), 0.36);
  const trim = second ? 1 : ease(t, spoken('trim', 'spaces') - 0.12, 0.48);
  const lower = second ? 1 : ease(t, spoken('trim', 'lowercase') - 0.36, 0.5);
  const correctedAt = spoken('changed', 'blocked');
  ctx.save();
  ctx.globalAlpha *= expected;
  word('Expected', labelX, -171, 36, '#776955');
  word(fixture[1].expected, labelX, -77, 81, c.ink, 'left', 'Lesson Mono');
  ctx.restore();
  segment(labelX, -21, right - 99, -21, '#b3a58a', 1.5);
  ctx.save();
  ctx.globalAlpha *= saved;
  word('Prediction', labelX, 43, 36, '#776955');
  const actual =
    second && t >= correctedAt
      ? corrected[1].prediction
      : lower < 0.5
        ? fixture[1].prediction.trim()
        : fixture[1].prediction.trim().toLowerCase();
  const inset = lerp(38, 0, trim);
  const wordX = labelX + inset;
  word(actual, wordX, 143, 75, c.ink, 'left', 'Lesson Mono');
  if (trim < 1) {
    ctx.globalAlpha *= 1 - trim;
    const textWidth = ctx.measureText(actual).width;
    for (const bx of [labelX, wordX + textWidth + 8]) {
      segment(bx, 145, bx + 25, 145, c.red, 3);
      segment(bx, 138, bx, 145, c.red, 3);
      segment(bx + 25, 138, bx + 25, 145, c.red, 3);
    }
  }
  ctx.restore();
  if (!second && t >= start('look')) {
    const first = ease(t, spoken('look', 'look'), 0.4);
    const next = ease(t, spoken('look', 'two'), 0.4);
    segment(labelX, -61, labelX + 47 * first, -61, c.red, 3);
    segment(labelX, 158, labelX + 47 * next, 158, c.red, 3);
  }
  const stamp = second
    ? ease(t, correctedAt + 0.17, 0.27)
    : ease(t, spoken('miss', 'miss') - 0.06, 0.22);
  if (stamp > 0) {
    ctx.save();
    ctx.translate(left + 164, 140);
    ctx.rotate(-0.1);
    ctx.globalAlpha *= stamp;
    const color = second ? c.darkGreen : c.red;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(-100, -37, 200, 72);
    word(second ? 'MATCH' : 'MISS', 0, 14, 37, color, 'center', 'Lesson Mono');
    ctx.restore();
  }
  ctx.restore();
}
function ledger(t) {
  const reveal1 = ease(t, spoken('lost', 'two') - 0.2, 0.65),
    reveal2 = ease(t, spoken('fixed', 'other') - 0.12, 0.7);
  const final = ease(t, spoken('close', 'line') - 0.13, 0.55);
  const indexX = [692, 978, 1264];
  ctx.save();
  ctx.translate(0, lerp(37, -9, final));
  for (let i = 0; i < 2; i++) {
    const y = 397 + 276 * i,
      open = i === 0 ? reveal1 : reveal2,
      items = i === 0 ? shortened : corrected,
      counts = score(items);
    ctx.save();
    ctx.translate(960, y);
    ticketShape(1510, 211, i === 0 ? c.paper : c.cream);
    ctx.restore();
    word(i === 0 ? 'Run B' : 'Run A', 294, y + 22, 64, c.ink, 'left', 'Lesson Serif');
    ctx.save();
    ctx.beginPath();
    ctx.rect(553, y + 72 - open * 151, 835, open * 151);
    ctx.clip();
    for (let j = 0; j < 3; j++) {
      const x = indexX[j],
        exists = items.some((item) => item.id === fixture[j].id);
      if (!exists) {
        ctx.fillStyle = c.bg;
        ctx.fillRect(x - 91, y - 43, 182, 81);
        segment(x - 16, y, x + 16, y, '#62545e', 2);
      } else {
        word(String(fixture[j].id), x, y + 21, 64, c.ink, 'center', 'Lesson Mono');
        segment(x - 57, y + 46, x + 57, y + 46, j === 1 ? c.darkGreen : '#897f69', j === 1 ? 5 : 2);
      }
    }
    ctx.restore();
    if (open < 1) {
      const unlatch = ease(t, start('show'), 0.65);
      const top = y - 78,
        bottom = lerp(y + 72, y - 78, open);
      path(
        [
          [550, top],
          [1387, top],
          [1387, bottom - 9],
          [1374, bottom],
          [562, bottom],
          [550, bottom - 9],
        ],
        i === 0 ? '#ded1b6' : '#ecddbe',
      );
      segment(562, bottom, 1374, bottom, '#b6a388', 2 + 2 * unlatch * (1 - open));
      segment(551, top, 1387, top, '#cab899', 1);
    }
    ctx.save();
    ctx.globalAlpha = 1 - open;
    word('100%', 1470, y + 23, 68, c.ink, 'center', 'Lesson Serif');
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = open;
    word(counts.join('/'), 1470, y + 23, 65, c.ink, 'center', 'Lesson Serif');
    ctx.restore();
  }
  if (final) {
    ctx.save();
    ctx.globalAlpha = final;
    word('Request 102', 978, 233, 65, c.light, 'center', 'Lesson Serif');
    segment(978, 250, 978, 277, c.bad, 3);
    ctx.restore();
  }
  ctx.restore();
}
function frame(t) {
  ctx.globalAlpha = 1;
  ctx.drawImage(backdrop, 0, 0);
  if (t >= start('test')) {
    const cut = ease(t, start('test'), 0.43);
    if (cut < 1) {
      ctx.globalAlpha = 1 - cut;
      board(t);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = cut;
    ledger(t);
    ctx.globalAlpha = 1;
    return;
  }
  const inspect = ease(t, start('return') - 0.18, 0.8) * (1 - ease(t, start('replay'), 1.1));
  const revisit = ease(t, start('second') - 0.08, 0.7) * (1 - ease(t, start('three'), 0.8));
  const zoom = Math.max(inspect, revisit);
  if (zoom < 1) {
    ctx.globalAlpha = 1 - zoom;
    board(t);
    ctx.globalAlpha = 1;
  }
  if (zoom > 0) closeTicket(t, zoom, revisit > 0);
}
if (process.argv.includes('--stills')) {
  for (const [name, t] of Object.entries({
    hook: 0.27,
    hole: 9,
    raw: start('trim') - 0.1,
    miss: start('replay') - 0.3,
    scored: start('second') - 0.25,
    correct: start('three') - 0.15,
    closed: start('show') - 0.35,
    ending: timing.frames / 30 - 0.4,
  })) {
    frame(t);
    writeFileSync(join(DIRECTOR_WORK, name + '.png'), canvas.toBuffer('image/png'));
  }
} else {
  await renderRgbaVideo(
    ({ time }) => {
      frame(time / 1000);
      return canvas.data();
    },
    {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: (timing.frames / 30) * 1000,
      threads: 2,
      crf: 18,
      preset: 'veryfast',
      outputPath: join(DIRECTOR_WORK, 'body.mp4'),
    },
  );
}
