export const C = {
  paper: '#f7f2df',
  ink: '#20362f',
  soft: '#52665c',
  green: '#14695e',
  gold: '#ffc95d',
  copper: '#a04221',
  violet: '#6e4b87',
  rim: '#b6b5a0',
  face: '#183d36',
  light: '#fffbea',
  teal: '#93e1c8',
  red: '#a44047',
  grid: '#d8dac6',
};

export function num(v, digits = 3) {
  return Number(v.toFixed(digits)).toString().replace('-', '−');
}
export const vec = (values, digits = 3) => '[' + values.map((v) => num(v, digits)).join(', ') + ']';
export const mix = (a, b, t) => a + (b - a) * t;
export function text(ctx, value, x, y, size = 25, color = C.ink, align = 'left', family = 'Sans') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
  ctx.restore();
}
export function path(ctx, pts, color, width = 3, fill = null) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
export const line = (ctx, x, y, xx, yy, color = C.rim, width = 2) =>
  path(
    ctx,
    [
      [x, y],
      [xx, yy],
    ],
    color,
    width,
  );
export function box(ctx, x, y, w, h, fill, stroke, radius = 8) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
export function dot(ctx, x, y, r, fill = C.copper, outline = null) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
}
export function face(ctx, x, y, w, h, dark = false) {
  box(ctx, x + 2, y + 6, w, h, '#43483225', null, 15);
  box(ctx, x, y, w, h, dark ? C.face : '#fffae9', dark ? '#14382e' : C.rim, 15);
  for (const xx of [x + 12, x + w - 12])
    for (const yy of [y + 12, y + h - 12]) {
      dot(ctx, xx, yy, 3.7, dark ? '#8ca59a' : '#b4b29a');
      line(ctx, xx - 1.8, yy + 1, xx + 1.8, yy - 1, dark ? C.face : C.soft, 1);
    }
}
export function setup(ctx, title) {
  ctx.scale(1.6, 1.6);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bg = ctx.createLinearGradient(0, 0, 1150, 675);
  bg.addColorStop(0, '#fffae9');
  bg.addColorStop(1, '#e7e7ce');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 675);
  line(ctx, 48, 75, 1152, 75, C.rim, 1.5);
  text(ctx, title, 48, 43.5, 42, C.ink, 'left', 'Serif');
  ctx.translate(0, -40);
}
export function result(ctx, words, color = C.green, { raised = false } = {}) {
  const ruleY = raised ? 539 : 554.5;
  line(ctx, 51, ruleY, 1149, ruleY, C.rim, 1.5);
  text(ctx, words, 600, raised ? 554 : 575, 27, color, 'center');
}
export function reading(ctx, label, value, x, y, color = C.green, size = 39) {
  text(ctx, label, x, y, 21, C.soft);
  text(ctx, value, x, y + 44, size, color, 'left', 'Mono');
}
export function rail(ctx, x, y, w, min, max, ticks, { digits = 2, dark = false } = {}) {
  const pos = (v) => x + ((v - min) / (max - min)) * w;
  const ink = dark ? C.light : C.ink;
  line(ctx, x, y, x + w, y, dark ? C.teal : C.soft, 2.4);
  for (const t of ticks) {
    line(ctx, pos(t), y - 6, pos(t), y + 9, ink, 2);
    text(ctx, num(t, digits), pos(t), y + 27, 17, ink, 'center', 'Mono');
  }
  return pos;
}
export function arrow(ctx, a, b, color, width = 4) {
  path(ctx, [a, b], color, width);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  path(
    ctx,
    [
      b,
      [b[0] - 12 * Math.cos(angle - 0.47), b[1] - 12 * Math.sin(angle - 0.47)],
      [b[0] - 12 * Math.cos(angle + 0.47), b[1] - 12 * Math.sin(angle + 0.47)],
    ],
    null,
    0,
    color,
  );
}
export function plot(ctx, bounds, xr, yr, xt, yt) {
  const [x, y, w, h] = bounds;
  const X = (v) => x + (w * (v - xr[0])) / (xr[1] - xr[0]);
  const Y = (v) => y + h - (h * (v - yr[0])) / (yr[1] - yr[0]);
  for (const t of xt) {
    line(ctx, X(t), y, X(t), y + h, t === 0 ? C.rim : C.grid, t === 0 ? 2 : 1);
    text(ctx, num(t), X(t), y + h + 19, 17, C.soft, 'center', 'Mono');
  }
  for (const t of yt) {
    line(ctx, x, Y(t), x + w, Y(t), t === 0 ? C.rim : C.grid, t === 0 ? 2 : 1);
    text(ctx, num(t), x - 12, Y(t), 17, C.soft, 'right', 'Mono');
  }
  return {
    p: (a, b) => [X(a), Y(b)],
    curve(fn, color, width = 4, from = xr[0], to = xr[1]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 3, y - 3, w + 6, h + 6);
      ctx.clip();
      const pts = Array.from({ length: 201 }, (_, i) => {
        const a = mix(from, to, i / 200);
        return [X(a), Y(fn(a))];
      });
      path(ctx, pts, color, width);
      ctx.restore();
    },
    mark(a, b, color = C.copper, r = 7) {
      dot(ctx, X(a), Y(b), r, color, C.light);
    },
  };
}
export function stage(clock) {
  const b = clock.beat.beatIndex + 1;
  return {
    b,
    at(n, phrase, duration = 0.55, options) {
      if (b !== n) return Number(b > n);
      return clock.reveal(phrase, duration, options);
    },
    after(n, phrase, captionStart = false) {
      if (b !== n) return b > n;
      if (captionStart) clock.reveal(phrase, 0, { captionStart });
      return clock.elapsed + 1e-9 >= clock.wordCue(phrase).end;
    },
    end(n) {
      return b > n || (b === n && clock.elapsed >= clock.speechDuration);
    },
  };
}
export function lamp(ctx, x, y, power, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const lit = Math.max(0, Math.min(1, power));
  if (lit > 0) {
    const glow = ctx.createRadialGradient(0, -35, 8, 0, -35, 102);
    glow.addColorStop(0, 'rgba(255,190,64,' + 0.64 * lit + ')');
    glow.addColorStop(1, 'rgba(255,190,64,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-105, -140, 210, 210);
  }
  ctx.beginPath();
  ctx.moveTo(-16, 6);
  ctx.bezierCurveTo(-16, -9, -39, -15, -39, -46);
  ctx.bezierCurveTo(-39, -97, 39, -97, 39, -46);
  ctx.bezierCurveTo(39, -15, 16, -9, 16, 6);
  ctx.closePath();
  ctx.fillStyle =
    lit > 0
      ? 'rgb(255,' + Math.round(213 + 34 * lit) + ',' + Math.round(129 + 46 * lit) + ')'
      : '#b6c7b9';
  ctx.fill();
  ctx.strokeStyle = lit > 0 ? '#e3aa4d' : '#667a71';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  path(
    ctx,
    [
      [-9, 6],
      [-13, -42],
      [-6, -34],
      [0, -42],
      [7, -34],
      [13, -42],
      [9, 6],
    ],
    lit > 0 ? C.copper : C.soft,
    2.7,
  );
  box(ctx, -17, 4, 34, 18, '#687a6e', C.ink, 3);
  for (let i = 0; i < 3; i++) line(ctx, -14, 8 + i * 4, 14, 6 + i * 4, '#bcbd9f', 2);
  box(ctx, -28, 23, 56, 9, C.ink, null, 4);
  ctx.restore();
}
export function switchLever(ctx, x, y, on, label) {
  box(ctx, x - 35, y - 40, 70, 85, '#b8bfab', C.ink, 10);
  box(ctx, x - 20, y - 29, 40, 63, C.face, null, 9);
  dot(ctx, x, y + 5, 13, '#c4c6ad', C.ink);
  const top = y + (on ? -30 : 28);
  line(ctx, x, y + 5, x + 5, top, '#849385', 8);
  dot(ctx, x + 5, top, 11, '#d7844a', C.ink);
  text(ctx, label + '  ' + (on ? '1' : '0'), x, y + 66, 23, C.ink, 'center', 'Mono');
}
