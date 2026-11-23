const dark = {
  bg: '#102e34',
  ink: '#f6f2dc',
  muted: '#aac0b9',
  grid: '#385359',
  blue: '#87d4e4',
  red: '#ff9885',
  gold: '#f3ca77',
  green: '#a5d1a2',
  paper: '#21434a',
};
const light = {
  bg: '#f5f0df',
  ink: '#142f36',
  muted: '#50635d',
  grid: '#c7cbbc',
  blue: '#176c89',
  red: '#a63c33',
  gold: '#885c0b',
  green: '#367452',
  paper: '#fffcf1',
};
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const mix = (a, b, t) => a + (b - a) * t;
export const num = (v, places = 3) => String(+v.toFixed(places)).replace('-', '−');
export const signed = (v, places = 3) => (v > 0 ? '+' : '') + num(v, places);
export function stage(ctx, clock, night = false) {
  const c = night ? dark : light;
  const b = clock.beat.beatIndex + 1;
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function path(points, color, width = 3, fill = false, dash = []) {
    ctx.save();
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.setLineDash(dash);
      ctx.stroke();
    }
    ctx.restore();
  }
  const line = (x, y, X, Y, color = c.grid, w = 3, dash = []) =>
    path(
      [
        [x, y],
        [X, Y],
      ],
      color,
      w,
      false,
      dash,
    );
  function dot(x, y, r, color = c.blue, ring = false) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (ring) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  function txt(value, x, y, size = 40, color = c.ink, align = 'left', face = 'Sans', max = 1800) {
    ctx.font = (face === 'Serif' ? 400 : 500) + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y, max);
  }
  const mono = (val, x, y, size = 42, color = c.ink, align = 'left', max = 1800) =>
    txt(val, x, y, size, color, align, 'Mono', max);
  const serif = (val, x, y, size = 66, color = c.ink, align = 'left', max = 1800) =>
    txt(val, x, y, size, color, align, 'Serif', max);
  function heading(over, title) {
    txt(over, 94, 75, 28, c.muted);
    line(95, 111, 1825, 111, c.grid, 2);
    serif(title, 90, 185, 70, c.ink, 'left', 1730);
  }
  function ticket(x, y, w, h, id, detail = '', color = c.blue) {
    const bevel = Math.min(19, h / 6);
    const pts = [
      [x, y],
      [x + w - bevel, y],
      [x + w, y + bevel],
      [x + w, y + h],
      [x, y + h],
    ];
    path(pts, c.paper, 0, true);
    path([...pts, pts[0]], color, 3);
    rect(x, y, 9, h, color);
    for (let i = 0; i < 3; i++) dot(x + 25, y + (h * (i + 1)) / 4, 3.8, c.grid);
    txt(
      id,
      x + 47,
      y + (detail ? h * 0.36 : h / 2),
      Math.min(44, h * 0.5),
      c.ink,
      'left',
      'Sans',
      w - 61,
    );
    if (detail) mono(detail, x + 47, y + h * 0.73, Math.min(29, h * 0.24), color, 'left', w - 60);
  }
  function axis(x, y, w, h, xMax, yMax, xt, yt, xf = String, yf = String) {
    const X = (n) => x + (w * n) / xMax,
      Y = (n) => y - (h * n) / yMax;
    for (const v of yt) {
      line(x, Y(v), x + w, Y(v), c.grid, 2);
      mono(yf(v), x - 23, Y(v), 27, c.muted, 'right');
    }
    line(x, y, x + w, y, c.muted);
    line(x, y, x, y - h, c.muted);
    for (const v of xt) {
      line(X(v), y, X(v), y + 10, c.muted);
      mono(xf(v), X(v), y + 35, 27, c.muted, 'center');
    }
    return { X, Y };
  }
  function grid(n, cols, x, y, dx, dy, paint, size = 20) {
    for (let i = 0; i < n; i++) {
      const px = x + (i % cols) * dx,
        py = y + Math.floor(i / cols) * dy;
      rect(px, py, size, size, paint(i));
    }
  }
  function cue(n, phrase, duration = 0) {
    if (b !== n) return b > n ? 1 : 0;
    return clock.reveal(phrase, duration);
  }
  function end(n, duration = 0) {
    if (b !== n) return b > n ? 1 : 0;
    const t = clock.elapsed - clock.speechDuration;
    return duration ? clamp(t / duration) : Number(t >= -1e-9);
  }
  rect(0, 0, 1920, 1080, c.bg);
  return {
    ctx,
    clock,
    b,
    c,
    rect,
    path,
    line,
    dot,
    txt,
    mono,
    serif,
    heading,
    ticket,
    axis,
    grid,
    cue,
    end,
  };
}
export function bracket(v, x, X, y, label, color, above = false) {
  const sign = above ? -1 : 1;
  v.path(
    [
      [x, y],
      [x, y + sign * 16],
      [X, y + sign * 16],
      [X, y],
    ],
    color,
    4,
  );
  if (label) v.mono(label, (x + X) / 2, y + sign * 49, 31, color, 'center');
}
export function stem(v, x, y, X, Y, color) {
  const mid = (y + Y) / 2;
  v.path(
    [
      [x, y],
      [x, mid],
      [X, mid],
      [X, Y],
    ],
    color,
    5,
  );
}
