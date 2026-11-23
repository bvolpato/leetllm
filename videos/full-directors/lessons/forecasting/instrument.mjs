// Drawing coordinates are in a 1280 by 720 design space.
export const C = {
  paper: '#f6f1de',
  ink: '#183533',
  muted: '#476761',
  grid: '#c8d1bc',
  blue: '#126380',
  teal: '#137463',
  red: '#ae432d',
  gold: '#906012',
  fog: '#dee9db',
  band: '#c8e3de',
  blush: '#efd6bf',
  edge: '#7a9184',
  night: '#153231',
  light: '#f3efdb',
  mint: '#89d5b6',
  amber: '#f5c774',
};

export function studio(ctx, clock) {
  ctx.scale(1.5, 1.5);
  const { beatIndex: beat } = clock.beat;
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function line(x, y, xx, yy, color = C.ink, width = 2, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.stroke();
    ctx.restore();
  }
  function poly(points, fill, stroke, width = 2) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }
  function dot(x, y, r, color, outline = false) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (outline) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  function text(
    value,
    x,
    y,
    size = 26,
    color = C.ink,
    align = 'left',
    face = 'Sans',
    weight = 400,
  ) {
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(String(value), x, y);
  }
  function mono(value, x, y, size = 23, color = C.ink, align = 'left') {
    text(value, x, y, size, color, align, 'Mono');
  }
  function title(s, sub) {
    text(s, 68, 71, 45, C.ink, 'left', 'Serif');
    if (sub) text(sub, 70, 124, 22, C.muted);
  }
  function graph(x, y, w, h, step = 32) {
    rect(x, y, w, h, '#f9f6e8');
    for (let i = x; i <= x + w; i += step) line(i, y, i, y + h, C.grid, 0.85);
    for (let j = y; j <= y + h; j += step) line(x, j, x + w, j, C.grid, 0.85);
  }
  function ticket(x, y, w, h) {
    rect(x + 6, y + 7, w, h, '#c8c9b8');
    rect(x, y, w, h, '#fffbea');
    for (let i = y + 12; i < y + h - 5; i += 24) dot(x + 12, i, 3, C.grid);
    line(x + 26, y + 5, x + 26, y + h - 5, C.grid, 1);
  }
  function arrow(x, y, xx, yy, color = C.teal) {
    line(x, y, xx, yy, color, 3);
    const a = Math.atan2(yy - y, xx - x),
      d = 13;
    poly(
      [
        [xx, yy],
        [xx - d * Math.cos(a - 0.45), yy - d * Math.sin(a - 0.45)],
        [xx - d * Math.cos(a + 0.45), yy - d * Math.sin(a + 0.45)],
      ],
      color,
    );
  }
  function bracket(x1, x2, y, label, color = C.blue) {
    line(x1, y - 12, x1, y, color, 3);
    line(x1, y, x2, y, color, 3);
    line(x2, y - 12, x2, y, color, 3);
    text(label, (x1 + x2) / 2, y + 26, 23, color, 'center');
  }
  function at(index, phrase) {
    if (beat !== index) return beat > index;
    if (phrase === undefined) return true;
    if (phrase === null) return clock.elapsed >= clock.speechDuration;
    return clock.reveal(phrase, 0) === 1;
  }
  function after(index, phrase) {
    if (beat !== index) return beat > index;
    return (
      clock.reveal(phrase, 0, { captionStart: phrase }) === 1 &&
      clock.elapsed + 1e-9 >= clock.wordCue(phrase).end
    );
  }
  function move(index, phrase, span = 0.8) {
    return beat === index ? clock.reveal(phrase, span) : Number(beat > index);
  }
  rect(0, 0, 1280, 720, C.paper);
  return {
    ctx,
    clock,
    beat,
    rect,
    line,
    poly,
    dot,
    text,
    mono,
    title,
    graph,
    ticket,
    arrow,
    bracket,
    at,
    after,
    move,
  };
}
export const signed = (n) => (n > 0 ? '+' + n : String(n).replace('-', '−'));
export const sum = (vs) => vs.reduce((a, b) => a + b, 0);
export const mean = (vs) => sum(vs) / vs.length;
export const mix = (a, b, t) => a + (b - a) * t;
