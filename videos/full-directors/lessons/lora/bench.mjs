// The drawing surface uses 1200 by 675 design units. The public host supplies the canvas.
export const C = {
  paper: '#f4efdf',
  light: '#fffcf1',
  ink: '#192e36',
  muted: '#526366',
  grid: '#c8cabb',
  blue: '#255880',
  sky: '#bad5dc',
  red: '#b7442e',
  peach: '#efb49b',
  teal: '#236c60',
  mint: '#c0d9c8',
  brass: '#ac772e',
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const num = (n, places = 3) => String(Number(n.toFixed(places))).replace('-', '−');
export const vec = (v) => '[' + v.map((n) => num(n)).join(', ') + ']';
export const count = (n) => n.toLocaleString('en-US');
export function paint(c, clock) {
  const b = clock.beat.beatIndex + 1;
  const at = (beat, phrase, seconds = 0.45) =>
    b < beat ? 0 : b > beat ? 1 : clock.reveal(phrase, seconds);
  const seen = (beat, phrase) => at(beat, phrase, 0.01) > 0;
  function box(x, y, w, h, fill, stroke, r = 0) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.7;
      c.stroke();
    }
  }
  function path(pts, color, width = 2, fill = null, close = false) {
    c.beginPath();
    c.moveTo(...pts[0]);
    for (const pt of pts.slice(1)) c.lineTo(...pt);
    if (close) c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (color) {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function line(x, y, X, Y, color = C.grid, w = 2) {
    path(
      [
        [x, y],
        [X, Y],
      ],
      color,
      w,
    );
  }
  function circle(x, y, r, fill, stroke, w = 2) {
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = w;
      c.stroke();
    }
  }
  function txt(s, x, y, size = 25, color = C.ink, align = 'left', face = 'Sans', weight = 500) {
    c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(String(s), x, y);
  }
  const readable = (value) =>
    String(value)
      .replace(/[₀₁₂₃ᵢ]/gu, (ch) => ({ '₀': '0', '₁': '1', '₂': '2', '₃': '3', 'ᵢ': 'i' })[ch])
      .replaceAll('ᵀ', '^T')
      .replaceAll('‖', '||')
      .replaceAll('∂L/∂', 'dL/d')
      .replaceAll('∂', 'd')
      .replaceAll('∇V h', 'grad h');
  const mono = (s, x, y, size = 25, col = C.ink, align = 'left') =>
    txt(readable(s), x, y, size, col, align, 'Mono');
  const head = (s, x = 64, y = 83) => txt(s, x, y, 43, C.ink, 'left', 'Serif', 500);
  const label = (s, x, y, col = C.muted, align = 'left') =>
    txt(s, x, y, 19, col, align, 'Sans', 600);
  function arrow(x, y, X, Y, color = C.red, w = 5) {
    const a = Math.atan2(Y - y, X - x),
      len = Math.hypot(Y - y, X - x);
    if (len < 0.5) return;
    const tip = Math.min(len, 10 + w);
    line(x, y, X - Math.cos(a) * tip * 0.7, Y - Math.sin(a) * tip * 0.7, color, w);
    path(
      [
        [X, Y],
        [X - tip * Math.cos(a - 0.45), Y - tip * Math.sin(a - 0.45)],
        [X - tip * Math.cos(a + 0.45), Y - tip * Math.sin(a + 0.45)],
      ],
      null,
      0,
      color,
      true,
    );
  }
  function fade(op, draw) {
    if (op <= 0) return;
    c.save();
    c.globalAlpha *= op;
    draw();
    c.restore();
  }
  function grid(x, y, w, h, step = 40) {
    for (let i = x; i <= x + w + 0.1; i += step) line(i, y, i, y + h, C.grid, 0.8);
    for (let j = y; j <= y + h + 0.1; j += step) line(x, j, x + w, j, C.grid, 0.8);
  }
  function matrix(data, x, y, cell = 55, col = C.blue, hi = () => false) {
    data.forEach((row, i) =>
      row.forEach((v, j) => {
        box(
          x + j * cell + 2,
          y + i * cell + 2,
          cell - 4,
          cell - 4,
          hi(i, j) ? C.peach : C.light,
          C.grid,
          4,
        );
        const value = v == null ? '·' : typeof v === 'number' ? num(v) : String(v);
        const fontSize = Math.min(cell * 0.42, (cell - 10) / (Math.max(1, value.length) * 0.62));
        mono(value, x + (j + 0.5) * cell, y + (i + 0.5) * cell, fontSize, col, 'center');
      }),
    );
    const w = data[0].length * cell,
      h = data.length * cell;
    path(
      [
        [x + 5, y - 3],
        [x - 4, y - 3],
        [x - 4, y + h + 3],
        [x + 5, y + h + 3],
      ],
      col,
      2.2,
    );
    path(
      [
        [x + w - 5, y - 3],
        [x + w + 4, y - 3],
        [x + w + 4, y + h + 3],
        [x + w - 5, y + h + 3],
      ],
      col,
      2.2,
    );
  }
  function dial(x, y, r, t, title, reading) {
    circle(x, y, r + 10, C.light, C.grid);
    for (let i = 0; i <= 10; i++) {
      const a = 2.3 + i * 0.48;
      line(
        x + Math.cos(a) * (r - 3),
        y + Math.sin(a) * (r - 3),
        x + Math.cos(a) * (r + 4),
        y + Math.sin(a) * (r + 4),
        C.muted,
        i % 5 === 0 ? 3 : 1,
      );
    }
    const a = 2.3 + t * 4.8;
    circle(x, y, r - 9, C.ink, C.blue, 2);
    line(x, y, x + Math.cos(a) * (r - 13), y + Math.sin(a) * (r - 13), C.paper, 4);
    label(title, x, y - r - 33, C.muted, 'center');
    mono(reading, x, y + r + 43, 33, C.red, 'center');
  }
  function key(x, y, id, days, col = C.brass, k = 1) {
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    path(
      [
        [0, -11],
        [95, -11],
        [105, -1],
        [95, 9],
        [85, 9],
        [80, 1],
        [74, 9],
        [66, 9],
        [60, 0],
        [54, 9],
        [0, 9],
      ],
      C.ink,
      2,
      col,
      true,
    );
    circle(0, 0, 26, col, C.ink, 2.5);
    circle(-6, 0, 8, C.paper, C.ink, 2);
    line(22, -5, 87, -5, '#f6dfb0', 2);
    box(-44, 33, 119, 38, C.light, C.grid, 4);
    mono(id, -30, 53, 17, C.ink);
    txt(days + ' d', 66, 53, 17, C.ink, 'right');
    c.restore();
  }
  function slab(x, y, w, h, title, sub, kind = C.blue) {
    box(x + 4, y + 6, w, h, C.grid, null, 6);
    box(x, y, w, h, C.light, kind, 6);
    box(x, y, 8, h, kind, null, 2);
    txt(title, x + 19, y + h * (sub ? 0.38 : 0.5), 26, kind, 'left', 'Sans', 600);
    if (sub) mono(sub, x + 19, y + h * 0.73, 17, C.muted);
  }
  function ruled(entries, x, y, dy = 48) {
    entries.forEach(([name, value, col], i) => {
      label(name, x, y + i * dy, col || C.muted);
      mono(value, x + 256, y + i * dy, 24, col || C.ink);
    });
  }
  c.scale(1.6, 1.6);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  box(0, 0, 1200, 675, C.paper);
  line(60, 35, 1140, 35, C.grid, 1);
  return {
    b,
    at,
    seen,
    clock,
    box,
    path,
    line,
    circle,
    txt,
    mono,
    head,
    label,
    arrow,
    fade,
    grid,
    matrix,
    dial,
    key,
    slab,
    ruled,
  };
}
