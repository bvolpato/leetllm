export const C = {
  paper: '#f4f1e7',
  ink: '#172f31',
  sub: '#48615d',
  line: '#aebab0',
  bed: '#d9dfd2',
  pcb: '#235a50',
  deep: '#133c38',
  copper: '#ceaf67',
  light: '#fffdf4',
  weight: '#5c5091',
  grad: '#ad593a',
  opt: '#24736b',
  act: '#a13652',
  work: '#706643',
  bad: '#a0343e',
  ok: '#23684b',
  pale: '#ebe7f2',
};
export const clamp = (v) => Math.max(0, Math.min(v, 1));
export const sum = (vs) => vs.reduce((a, b) => a + b, 0);
export const fmt = (v, places = 2) => Number(v.toFixed(places)).toString().replace('-', '−');
export function brush(ctx, clock) {
  const beat = clock.beat.beatIndex + 1;
  function at(n, phrase, duration = 0) {
    if (beat !== n) return Number(beat > n);
    return clock.reveal(phrase, duration);
  }
  function text(value, x, y, size = 36, color = C.ink, family = 'Sans', align = 'left') {
    ctx.font = (family === 'Serif' ? '400 ' : '500 ') + size + 'px "Lesson ' + family + '"';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y);
  }
  function rect(x, y, w, h, fill, stroke, r = 0) {
    if (w <= 0 || h <= 0) return;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  function line(x, y, u, v, color = C.line, width = 3) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function dot(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function title(name, detail) {
    text(name, 92, 119, 66, C.ink, 'Serif');
    if (detail) text(detail, 96, 178, 30, C.sub, 'Mono');
  }
  function block(x, y, w, h, fill, label, size = 32) {
    rect(x + 3, y + 7, w, h, C.deep, null, 5);
    rect(x, y, w, h, fill, null, 5);
    line(x + 5, y + 5, x + w - 6, y + 5, '#ffffff5e', 3);
    if (label !== undefined)
      text(label, x + w / 2, y + h / 2 + size * 0.33, size, C.light, 'Mono', 'center');
  }
  function pcb(x, y, w, h) {
    rect(x + 4, y + 9, w, h, C.deep, null, 13);
    rect(x, y, w, h, C.pcb, null, 13);
    for (const xx of [x + 13, x + w - 13])
      for (const yy of [y + 13, y + h - 13]) {
        dot(xx, yy, w < 200 ? 3 : 5, C.copper);
        dot(xx, yy, w < 200 ? 1.2 : 2, C.deep);
      }
    for (let i = 0; i < Math.floor(w / 20) * 0.6; i++)
      rect(x + w * 0.2 + i * 18, y + h, 10, 9, C.copper);
  }
  function ribbon(x, y, w, h, color, n = 8) {
    if (w < 1) return;
    block(x, y, w, h, color);
    for (let j = 1; j < n; j++)
      line(x + (w * j) / n, y + 5, x + (w * j) / n, y + h - 4, '#ffffff65', 2);
  }
  function measure(x, y, w, cap, scale, unit) {
    line(x, y, x + w, y, C.line, 3);
    const stop = x + cap * scale;
    line(stop, y - 18, stop, y + 135, C.bad, 4);
    text(fmt(cap) + ' ' + unit + ' limit', stop, y - 34, 29, C.bad, 'Mono', 'center');
  }
  function tag(label, x, y, color = C.sub) {
    text(label, x, y, 29, color, 'Mono');
  }
  function center(label, x, y, size = 38, color = C.ink) {
    text(label, x, y, size, color, 'Sans', 'center');
  }
  return {
    ctx,
    clock,
    beat,
    at,
    text,
    rect,
    line,
    dot,
    title,
    block,
    pcb,
    ribbon,
    measure,
    tag,
    center,
  };
}
