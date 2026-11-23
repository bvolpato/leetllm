export const C = {
  paper: '#f8f4ea',
  ink: '#232835',
  muted: '#555d67',
  grid: '#d3d1c8',
  faint: '#ece8df',
  blue: '#234e9c',
  sky: '#d9e4f6',
  copper: '#a3441a',
  apricot: '#f4d1b6',
  green: '#116651',
  mint: '#cfe8da',
  plum: '#873e71',
  lilac: '#ead6e6',
  white: '#fffdf7',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v) => Math.max(0, Math.min(1, v));
export function fmt(v, places = 4) {
  return String(Number(v.toFixed(places))).replace('-', '−');
}
export const vec = (values, places = 4) => '[' + values.map((v) => fmt(v, places)).join(', ') + ']';

export function instrument(ctx, clock) {
  const b = clock.beat.beatIndex;
  const cue = (beat, phrase, seconds = 1) => {
    if (b !== beat) return Number(b > beat);
    const v = clock.reveal(phrase, seconds);
    return v * v * (3 - 2 * v);
  };
  function rect(x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  function path(points, color, width = 2, close = false) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    if (close) {
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  const line = (x, y, u, v, color = C.grid, w = 2) =>
    path(
      [
        [x, y],
        [u, v],
      ],
      color,
      w,
    );
  function dot(x, y, r, color, outline) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  function txt(value, x, y, size = 24, color = C.ink, align = 'left', face = 'Sans', weight = 400) {
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.textBaseline = 'middle';
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y);
  }
  function title(value) {
    txt(value, 68, 69, 44, C.ink, 'left', 'Serif');
  }
  function metric(label, value, x, y, color = C.blue, size = 40) {
    txt(label, x, y, 20, C.muted);
    txt(value, x, y + 45, size, color, 'left', 'Mono');
  }
  function banner(value, color = C.ink) {
    txt(value, 600, 581, 29, color, 'center', 'Serif');
  }
  function arrow(x, y, u, v, color = C.blue, w = 3) {
    const angle = Math.atan2(v - y, u - x);
    if (Math.hypot(u - x, v - y) < 1) return;
    line(x, y, u, v, color, w);
    const left = angle + 2.6,
      right = angle - 2.6;
    path(
      [
        [u + 12 * Math.cos(left), v + 12 * Math.sin(left)],
        [u, v],
        [u + 12 * Math.cos(right), v + 12 * Math.sin(right)],
      ],
      color,
      w,
    );
  }
  function pin(x, y, color = C.copper) {
    path(
      [
        [x - 8, y - 18],
        [x + 8, y - 18],
        [x, y],
      ],
      color,
      1,
      true,
    );
  }
  function axis(x, y, w, lo, hi, ticks, label = '') {
    const X = (v) => x + (w * (v - lo)) / (hi - lo);
    line(x, y, x + w, y, C.muted, 1.5);
    for (const v of ticks) {
      line(X(v), y, X(v), y + 8, C.muted, 1.5);
      txt(fmt(v), X(v), y + 24, 16, C.muted, 'center', 'Mono');
    }
    if (label) txt(label, x + w, y + 49, 18, C.muted, 'right');
    return X;
  }
  function plot(x, y, w, h, xr, yr, xt, yt, xLabel, yLabel) {
    const X = (v) => x + ((v - xr[0]) * w) / (xr[1] - xr[0]),
      Y = (v) => y + h - ((v - yr[0]) * h) / (yr[1] - yr[0]);
    rect(x, y, w, h, C.white);
    for (const v of xt) {
      line(X(v), y, X(v), y + h, C.grid, 1);
      txt(fmt(v), X(v), y + h + 18, 16, C.muted, 'center', 'Mono');
    }
    for (const v of yt) {
      line(x, Y(v), x + w, Y(v), C.grid, 1);
      txt(fmt(v), x - 12, Y(v), 16, C.muted, 'right', 'Mono');
    }
    line(x, y, x, y + h, C.muted, 1.5);
    line(x, y + h, x + w, y + h, C.muted, 1.5);
    txt(yLabel, x, y - 21, 19, C.muted);
    txt(xLabel, x + w, y + h + 45, 19, C.muted, 'right');
    function curve(fn, lo = xr[0], hi = xr[1], color = C.blue, width = 3) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y - 1, w, h + 2);
      ctx.clip();
      path(
        Array.from({ length: 145 }, (_, i) => {
          const q = mix(lo, hi, i / 144);
          return [X(q), Y(fn(q))];
        }),
        color,
        width,
      );
      ctx.restore();
    }
    return { X, Y, curve, point: (a, z, c = C.copper, r = 7) => dot(X(a), Y(z), r, c, C.white) };
  }
  // Each point on the return trace follows the same cubic as its printed track.
  function track(points, t, color = C.blue, value) {
    function pos(k) {
      return [0, 1].map(
        (i) =>
          (1 - k) ** 3 * points[0][i] +
          3 * k * (1 - k) ** 2 * points[1][i] +
          3 * k * k * (1 - k) * points[2][i] +
          k ** 3 * points[3][i],
      );
    }
    const segment = (end) => Array.from({ length: 65 }, (_, i) => pos((end * i) / 64));
    path(segment(1), C.grid, 4);
    if (t <= 0) return;
    path(segment(t), color, 5);
    const [x, y] = pos(t);
    dot(x, y, value === undefined ? 6 : 22, color);
    if (value !== undefined) txt(value, x, y, 20, C.white, 'center', 'Mono');
  }
  function node(x, y, r, label, value, color = C.blue) {
    dot(x, y, r, C.white, color);
    const typeSize = Math.min(30, r * 0.8, (2.6 * r) / Math.max(1, String(value).length));
    txt(value, x, y, typeSize, color, 'center', 'Mono');
    txt(label, x, y + r + 22, 19, C.muted, 'center');
  }
  return {
    ctx,
    clock,
    b,
    cue,
    rect,
    line,
    path,
    dot,
    txt,
    title,
    metric,
    banner,
    arrow,
    pin,
    axis,
    plot,
    track,
    node,
  };
}
