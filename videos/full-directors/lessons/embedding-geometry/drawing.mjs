export const P = {
  ink: '#f4edd8',
  muted: '#a8bfc0',
  faint: '#365052',
  metal: '#547879',
  query: '#8bd7f4',
  green: '#90e4b5',
  pink: '#f0a5ba',
  gold: '#edc97a',
  dark: '#0c252a',
  well: '#132f34',
  shadow: '#081b22',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v) => Math.min(1, Math.max(0, v));
export const lerpVector = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
export const fmt = (n, d = 2) => Number(n.toFixed(d)).toString();
export const coord = (a, d = 2) => '[' + a.map((v) => fmt(v, d)).join(', ') + ']';

export function surface(ctx, clock) {
  ctx.scale(1.5, 1.5);
  const bg = ctx.createLinearGradient(0, 0, 1250, 720);
  bg.addColorStop(0, '#173339');
  bg.addColorStop(0.58, '#10282d');
  bg.addColorStop(1, '#091b22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);
  const b = clock.beat.beatIndex + 1;
  const cue = (beat, phrase, duration = 0.55) =>
    b < beat ? 0 : b > beat ? 1 : clock.reveal(phrase, duration);
  function after(beat, phrase, duration = 0) {
    if (b !== beat) return Number(b > beat);
    const { start, end } = clock.wordCue(phrase);
    const finished = clock.reveal(phrase, end - start + duration, { captionStart: phrase });
    if (finished === 1) return 1;
    return duration === 0 ? 0 : clamp((clock.elapsed - end) / duration);
  }
  function txt(str, x, y, size = 26, color = P.ink, face = 'Sans', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = size + 'px "Lesson ' + face + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(str), x, y);
  }
  function line(x, y, u, v, col = P.faint, w = 2, dash = []) {
    ctx.beginPath();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function box(x, y, w, h, fill = P.well, edge = null, r = 5) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  function circle(x, y, r, fill, edge = null, w = 2) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  }
  function arrow(a, z, col, w = 4) {
    const dx = z[0] - a[0],
      dy = z[1] - a[1],
      len = Math.hypot(dx, dy);
    if (len < 1) return;
    const h = Math.min(17, len * 0.32),
      ux = dx / len,
      uy = dy / len;
    line(...a, z[0] - ux * h * 0.65, z[1] - uy * h * 0.65, col, w);
    ctx.beginPath();
    ctx.moveTo(...z);
    ctx.lineTo(z[0] - ux * h - uy * h * 0.42, z[1] - uy * h + ux * h * 0.42);
    ctx.lineTo(z[0] - ux * h + uy * h * 0.42, z[1] - uy * h - ux * h * 0.42);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
  function fade(op, draw) {
    if (op <= 0) return;
    ctx.save();
    ctx.globalAlpha *= clamp(op);
    draw();
    ctx.restore();
  }
  function head(title, sub) {
    txt(title, 60, 84, 47, P.ink, 'Serif');
    if (sub) txt(sub, 62, 129, 23, P.muted);
  }
  function rule(x, y, width, n = 32, col = P.metal) {
    line(x, y, x + width, y, col, 3);
    for (let i = 0; i <= n; i++) {
      const xx = x + (width * i) / n;
      line(xx, y, xx, y + (i % 4 === 0 ? 15 : 8), col, 2);
    }
  }
  function dial(name, value, x, y, col = P.ink) {
    txt(name, x, y, 21, P.muted);
    txt(value, x, y + 51, 39, col, 'Mono');
  }
  function byte(x, y, n, { width = 416, color = P.gold, pad = 0 } = {}) {
    const step = width / 8;
    for (let i = 0; i < 8; i++) {
      const bit = 7 - i,
        on = n != null && ((n >> bit) & 1) === 1;
      box(x + i * step, y, step - 4, 48, on ? color : P.shadow, i < pad ? P.faint : P.metal, 4);
      txt(
        n == null ? '·' : on ? '1' : '0',
        x + (i + 0.5) * step - 2,
        y + 34,
        27,
        on ? P.shadow : i < pad ? P.metal : P.ink,
        'Mono',
        'center',
      );
    }
  }
  return { ctx, clock, b, cue, after, txt, line, box, circle, arrow, fade, head, rule, dial, byte };
}
export function vectorPlot(d, { origin, unit, angle = 0, reach = 4.6, ticks = 0.2, ring = false }) {
  const [ox, oy] = origin,
    q = [Math.cos(angle), Math.sin(angle)];
  const pt = (v) => [ox + v[0] * unit, oy - v[1] * unit];
  const along = (t, h = 0) => pt([q[0] * t - q[1] * h, q[1] * t + q[0] * h]);
  if (ring) {
    d.ctx.beginPath();
    d.ctx.arc(ox, oy, unit, -Math.PI / 2 - 0.14, 0.09);
    d.ctx.strokeStyle = P.metal;
    d.ctx.lineWidth = 2;
    d.ctx.stroke();
  }
  const a = along(0),
    z = along(reach);
  d.line(...a, ...z, P.faint, 14);
  for (let i = 0; i <= reach / ticks; i++) {
    const t = i * ticks,
      h = (i % 5 === 0 ? 12 : 7) / unit;
    d.line(...along(t), ...along(t, -h), P.metal, 2);
  }
  d.arrow(a, along(1), P.query, 4);
  function project(v, col, progress = 1) {
    const p = v[0] * q[0] + v[1] * q[1];
    d.fade(progress, () => {
      const tip = pt(v);
      const foot = along(p);
      const marker = progress < 1 ? lerpVector(tip, foot, progress) : foot;
      d.line(...tip, ...marker, col, 2, [3, 6]);
      d.circle(...marker, 6, col, P.shadow);
    });
    return p;
  }
  return { pt, along, project, vector: (v, col) => d.arrow(a, pt(v), col, 5), origin: a };
}
export function guideGlyph(d, x, y, col, audit = false) {
  d.box(x, y, 50, 60, P.well, col, 5);
  d.line(x + 7, y + 3, x + 7, y + 57, col, 1.5);
  if (audit) {
    for (let j = 0; j < 3; j++) {
      d.circle(x + 16, y + 16 + j * 13, 2.5, col);
      d.line(x + 24, y + 16 + j * 13, x + 40, y + 16 + j * 13, col, 2);
    }
  } else {
    d.circle(x + 24, y + 20, 7, null, col, 3);
    d.line(x + 24, y + 27, x + 24, y + 46, col, 3);
    d.line(x + 24, y + 39, x + 32, y + 39, col, 3);
    d.line(x + 24, y + 45, x + 30, y + 45, col, 3);
  }
}
