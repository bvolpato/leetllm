export const C = {
  paper: '#f7f4e9',
  ink: '#182d34',
  dim: '#516467',
  fine: '#bfc8bc',
  faint: '#e4e7db',
  blue: '#234e75',
  ice: '#c9dce5',
  teal: '#147366',
  mint: '#c0e2d4',
  gold: '#e1a131',
  rust: '#aa4830',
  peach: '#f3d1bb',
  white: '#fffdf5',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const smooth = (v) => v * v * (3 - 2 * v);
export function board(ctx, clock) {
  ctx.scale(1.6, 1.6);
  const box = (x, y, w, h, fill, stroke = null, r = 0) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  const line = (points, color = C.fine, width = 2, dash = []) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.restore();
  };
  const dot = (x, y, r, fill, stroke = null) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  const label = (str, x, y, size = 22, color = C.ink, opt = {}) => {
    ctx.font =
      (opt.bold ? 600 : 400) +
      ' ' +
      size +
      'px "Lesson ' +
      (opt.face || 'Sans') +
      '", "Lesson Symbols"';
    ctx.fillStyle = color;
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(str), x, y);
  };
  const mono = (str, x, y, size = 22, color = C.ink, align = 'left') =>
    label(str, x, y, size, color, { face: 'Mono', align });
  const header = (subject, title) => {
    box(0, 0, 1200, 675, C.paper);
    label(subject, 55, 37, 17, C.teal, { bold: true });
    label(title, 55, 90, 43, C.ink, { face: 'Serif' });
    line(
      [
        [55, 130],
        [1145, 130],
      ],
      C.fine,
      1,
    );
  };
  const foot = (s, col = C.ink) => {
    line(
      [
        [55, 550],
        [1145, 550],
      ],
      C.fine,
      1,
    );
    box(55, 569, 6, 27, col);
    label(s, 76, 583, 22, col);
  };
  const bead = (x, y, r = 9) => {
    dot(x, y, r + 3, C.paper);
    dot(x, y, r, C.gold, C.ink);
  };
  const grid = (x, y, rows, cols, cell, fill, strokes = C.paper) => {
    box(x, y, cols * cell, rows * cell, fill);
    for (let r = 1; r < rows; r++)
      line(
        [
          [x, y + r * cell],
          [x + cols * cell, y + r * cell],
        ],
        strokes,
        1.5,
      );
    for (let c = 1; c < cols; c++)
      line(
        [
          [x + c * cell, y],
          [x + c * cell, y + rows * cell],
        ],
        strokes,
        1.5,
      );
  };
  const plate = (x, y, w, h, fill, stroke, s, size = 21) => {
    box(x, y, w, h, fill, stroke, 5);
    mono(s, x + w / 2, y + h / 2, size, C.ink, 'center');
  };
  const cue = (n, phrase, span = 0) =>
    clock.beat.beatIndex === n ? clock.reveal(phrase, span) : Number(clock.beat.beatIndex > n);
  const end = (n) =>
    clock.beat.beatIndex > n ||
    (clock.beat.beatIndex === n && clock.elapsed >= clock.speechDuration);
  return {
    ctx,
    clock,
    b: clock.beat.beatIndex,
    box,
    line,
    dot,
    label,
    mono,
    header,
    foot,
    bead,
    grid,
    plate,
    cue,
    end,
  };
}
export function routePen(p, points, t, color) {
  p.line(points, color, 3);
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remaining = t * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const k = clamp(remaining / lengths[i]);
      p.bead(mix(points[i][0], points[i + 1][0], k), mix(points[i][1], points[i + 1][1], k));
      break;
    }
    remaining -= lengths[i];
  }
}
