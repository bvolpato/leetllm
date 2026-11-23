export const C = {
  paper: '#f2e9d3',
  sheet: '#fff8e5',
  ink: '#223b3b',
  muted: '#52645a',
  rule: '#b9b59b',
  green: '#126859',
  sea: '#419184',
  light: '#d6e5cf',
  red: '#a6382d',
  rose: '#f3cbbb',
  gold: '#deaf55',
  wood: '#996348',
  night: '#303851',
  violet: '#655679',
  lavender: '#e1d9e9',
};
export function rect(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function line(c, x, y, X, Y, color, width = 3) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
}
export function circle(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
export function poly(c, pts, color) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function type(
  c,
  value,
  x,
  y,
  size = 42,
  color = C.ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
  max = Infinity,
) {
  const s = String(value);
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  const width = c.measureText(s).width;
  if (width > max)
    c.font = weight + ' ' + Math.floor((size * max) / width) + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.textAlign = align;
  c.fillText(s, x, y);
}
export const pen = (c, v, x, y, z = 52, col = C.ink, w = Infinity) =>
  type(c, v, x, y, z, col, 'Serif', 'left', 400, w);
export const mono = (c, v, x, y, z = 30, col = C.muted, w = Infinity) =>
  type(c, v, x, y, z, col, 'Mono', 'left', 500, w);
export const mid = (c, v, x, y, z = 38, col = C.ink, w = Infinity) =>
  type(c, v, x, y, z, col, 'Sans', 'center', 600, w);
export function base(c, color = C.paper) {
  rect(c, 0, 0, 1920, 1080, color);
  // Fine paper fibres stay fixed under moving objects.
  c.fillStyle = '#5247260c';
  for (let i = 0; i < 380; i++)
    c.fillRect((i * 1877 + 13) % 1920, (i * 251 + 83) % 1080, 3 + (i % 8), 1);
}
export function heading(c, kicker, title) {
  mono(c, kicker, 100, 108, 28, C.muted);
  pen(c, title, 96, 216, 77, C.ink, 1740);
}
export function card(c, x, y, w, h, color = C.sheet) {
  rect(c, x + 8, y + 11, w, h, '#705e411d', 9);
  rect(c, x, y, w, h, color, 9);
}
export function stamp(c, v, x, y, color = C.green, max = 810) {
  c.save();
  c.font = '700 39px "Lesson Sans"';
  const w = Math.min(max, c.measureText(v).width + 54);
  rect(c, x, y, w, 74, color, 4);
  type(c, v, x + w / 2, y + 51, 39, C.sheet, 'Sans', 'center', 700, w - 27);
  c.restore();
}
export function row(c, k, v, x, y, w = 720, color = C.ink) {
  mono(c, k, x, y, 29, C.muted, w * 0.42);
  type(c, v, x + w, y, 39, color, 'Sans', 'right', 500, w * 0.57);
  line(c, x, y + 20, x + w, y + 20, C.rule, 2);
}
export function book(c, task, x, y, scale = 1) {
  const garden = task.book === 'B9',
    bg = garden ? C.night : '#164d50',
    fg = garden ? '#d3b6c8' : '#a7d2ba';
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(-0.027);
  rect(c, 15, 18, 523, 668, '#715d4130', 8);
  rect(c, 9, 10, 523, 668, '#c7b795', 8);
  for (let i = 0; i < 4; i++) line(c, 20, 665 + i * 2, 525, 665 + i * 2, '#efe3c9', 1);
  rect(c, 0, 0, 525, 665, bg, 7);
  rect(c, 8, 0, 22, 665, '#101e243b');
  line(c, 34, 7, 34, 656, fg, 2);
  c.save();
  c.beginPath();
  c.rect(45, 17, 465, 565);
  c.clip();
  circle(c, garden ? 363 : 366, 298, 66, C.gold);
  if (garden) {
    circle(c, 337, 274, 61, bg);
    for (let i = 0; i < 48; i++)
      circle(c, 52 + ((i * 61) % 450), 223 + ((i * 33) % 270), 1 + (i % 3), fg);
    for (let i = 0; i < 10; i++) {
      const a = 58 + i * 51,
        h = 120 + ((i * 71) % 179);
      c.strokeStyle = fg;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(a, 578);
      c.quadraticCurveTo(a - 44, 577 - h / 2, a + 4, 578 - h);
      c.stroke();
      for (let j = 1; j <= 5; j++) {
        const Y = 578 - (j * h) / 6,
          X = a - 16 * Math.sin(j * 0.53);
        c.fillStyle = j % 2 ? fg : '#b78592';
        c.beginPath();
        c.ellipse(X + (j % 2 ? 10 : -9), Y, 9, 23, j % 2 ? 0.6 : -0.7, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else {
    poly(
      c,
      [
        [40, 413],
        [145, 302],
        [224, 376],
        [317, 314],
        [529, 402],
        [529, 590],
        [40, 590],
      ],
      '#628a75',
    );
    poly(
      c,
      [
        [40, 420],
        [168, 390],
        [283, 412],
        [371, 372],
        [529, 421],
        [529, 592],
        [40, 592],
      ],
      '#345e58',
    );
    for (let i = 0; i < 16; i++) {
      const Y = 428 + i * 10,
        offset = 14 * Math.sin(i * 0.71);
      c.strokeStyle = i % 3 ? fg : C.gold;
      c.lineWidth = 2 + (i % 3);
      c.beginPath();
      c.moveTo(40, Y);
      c.bezierCurveTo(132, Y + offset, 244, Y - 12, 313, Y);
      c.bezierCurveTo(373, Y + 12, 445, Y - 11, 525, Y + 4);
      c.stroke();
    }
    poly(
      c,
      [
        [217, 451],
        [344, 451],
        [314, 468],
        [250, 468],
      ],
      C.ink,
    );
    poly(
      c,
      [
        [278, 381],
        [278, 445],
        [238, 445],
      ],
      C.sheet,
    );
    line(c, 282, 378, 282, 453, C.gold, 4);
  }
  c.restore();
  pen(c, garden ? 'The Night' : 'River', 62, 115, 83, C.sheet);
  pen(c, garden ? 'Garden' : 'Stories', 62, 197, 83, C.sheet);
  rect(c, 48, 596, 110, 51, C.sheet);
  mono(c, task.book, 65, 636, 37, C.ink);
  mono(c, 'CITY LIBRARY', 196, 631, 26, fg);
  c.restore();
}
function paintDrawer(
  c,
  {
    x = 960,
    y = 237,
    w = 830,
    h = 645,
    owner,
    bookId,
    open = 1,
    version,
    records = [],
    caption,
    affinity = C.green,
    showKeys = false,
  },
) {
  const bottom = y + h;
  rect(c, x + 8, bottom - 131, w, 143, '#69593b2b', 8);
  rect(c, x + 12, y + 175, w - 24, h - 180, '#7c543c', 9);
  const top = y + 240 * (1 - open);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h - 93);
  c.clip();
  card(c, x + 35, top + 15, w - 70, h - 100, C.sheet);
  rect(c, x + 54, top + 2, 240, 42, C.sheet, 8);
  mono(c, 'CIRCULATION', x + 69, top + 36, 24);
  pen(c, owner + '’s holds', x + 70, top + 112, 60, C.ink, w - 230);
  if (version != null) mono(c, 'v' + version, x + w - 137, top + 104, 34, C.green, 102);
  line(c, x + 72, top + 143, x + w - 72, top + 143, C.rule, 3);
  mono(c, showKeys ? 'RECORD   /   SOURCE KEY' : 'RECORD   /   BOOK', x + 72, top + 197, 25);
  records.forEach((r, i) => {
    const Y = top + 265 + i * 74;
    type(
      c,
      r.id,
      x + 74,
      Y,
      42,
      i === 1 && caption?.includes('Fail') ? C.red : C.ink,
      'Mono',
      'left',
      500,
      w * 0.45,
    );
    type(
      c,
      showKeys ? r.operation : r.book,
      x + w - 80,
      Y,
      39,
      C.ink,
      'Mono',
      'right',
      400,
      w * 0.34,
    );
    line(c, x + 72, Y + 15, x + w - 76, Y + 15, C.rule, 2);
  });
  for (let i = records.length; i < 2; i++)
    line(c, x + 72, top + 280 + i * 74, x + w - 76, top + 280 + i * 74, C.rule, 2);
  if (caption) stamp(c, caption, x + 72, top + 397, affinity, w - 144);
  c.restore();
  const front = bottom - 117 - 440 * (1 - open);
  rect(c, x, front, w, bottom - front, C.wood, 10);
  c.save();
  c.beginPath();
  c.roundRect(x + 4, front + 4, w - 8, bottom - front - 8, 8);
  c.clip();
  for (let i = 0; i < 28; i++) {
    const Y = front + 7 + i * 23;
    c.strokeStyle = i % 3 ? '#83533a58' : '#bb8a635c';
    c.lineWidth = i % 4 === 0 ? 3 : 1.5;
    c.beginPath();
    c.moveTo(x + 6, Y);
    c.bezierCurveTo(
      x + w * 0.33,
      Y - 11 + (i % 4) * 3,
      x + w * 0.7,
      Y + 18 - (i % 5),
      x + w - 6,
      Y + 4,
    );
    c.stroke();
  }
  const space = bottom - front - 117;
  if (space > 44) {
    const Y = front + 109 + space * 0.38;
    for (const X of [x + w / 2 - 96, x + w / 2 + 96]) {
      circle(c, X, Y, 23, '#745434');
      circle(c, X, Y - 3, 17, '#cba968');
      circle(c, X, Y - 3, 5, '#7e6944');
    }
    c.beginPath();
    c.moveTo(x + w / 2 - 96, Y);
    c.bezierCurveTo(x + w / 2 - 86, Y + 52, x + w / 2 + 82, Y + 52, x + w / 2 + 96, Y);
    c.lineWidth = 17;
    c.strokeStyle = '#593d2e';
    c.stroke();
    c.translate(0, -5);
    c.lineWidth = 11;
    c.strokeStyle = '#d5b57b';
    c.stroke();
  }
  c.restore();
  rect(c, x + w / 2 - 160, front + 26, 320, 65, '#c6a66a', 5);
  rect(c, x + w / 2 - 145, front + 37, 290, 42, C.sheet, 2);
  mid(c, owner + '   /   ' + bookId, x + w / 2, front + 70, 31);
  [x + w / 2 - 154, x + w / 2 + 154].forEach((X) => circle(c, X, front + 58, 4, '#795e3b'));
}
export const phase = (clock, beat, phrase, seconds = 0) =>
  clock.beat.beatIndex > beat ? 1 : clock.beat.beatIndex < beat ? 0 : clock.reveal(phrase, seconds);
export const ease = (t) => t * t * (3 - 2 * t);
export function steps(c, values, { x = 100, y = 410, w = 1720, active = -1, colors = [] } = {}) {
  const gap = 28,
    step = (w + gap) / values.length;
  for (let i = 0; i < values.length; i++) {
    const X = x + i * step;
    card(c, X, y, step - gap, 184, colors[i] ?? (active === i ? C.light : C.sheet));
    mono(c, String(i + 1).padStart(2, '0'), X + 20, y + 43, 24);
    mid(c, values[i], X + (step - gap) / 2, y + 116, 43, C.ink, step - gap - 24);
    if (i + 1 < values.length) line(c, X + step - gap, y + 90, X + step, y + 90, C.muted, 3);
  }
}
export function sheet(c, x, y, w, h, title) {
  card(c, x, y, w, h);
  rect(c, x, y, 11, h, C.green, 3);
  pen(c, title, x + 34, y + 74, 50, C.ink, w - 60);
}

export function drawer(c, options) {
  const { x = 960, y = 237, h = 645 } = options;
  c.save();
  c.translate(x, y);
  c.scale(1, h / 645);
  paintDrawer(c, { ...options, x: 0, y: 0, h: 645 });
  c.restore();
}
