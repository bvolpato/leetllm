import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';

// Logical coordinates are half the delivery resolution.
export const C = {
  ink: '#183d45',
  dim: '#496369',
  rule: '#a3afa3',
  cream: '#f4efdd',
  paper: '#fff9e6',
  stable: '#22636a',
  candidate: '#964923',
  red: '#9e352f',
  sea: '#c9dcd0',
  brass: '#efbd71',
  gray: '#d5d7c9',
  white: '#fff8e7',
  hold: '#78591f',
};
export const short = (value) => value.slice(0, 12);
export const pct = (n, d, digits = 0) => ((100 * n) / d).toFixed(digits) + '%';
export const mix = (a, b, t) => a + (b - a) * t;
export function board(ctx, clock) {
  const beat = clock.beat.beatIndex + 1;
  const cue = (b, phrase, span = 0) => (beat === b ? clock.reveal(phrase, span) : Number(beat > b));
  const after = (b, phrase) =>
    beat === b
      ? firstFrameAt(clock.elapsed) >= firstFrameAt(clock.wordCue(phrase).end)
      : beat > b;
  function rect(x, y, w, h, fill, r = 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function path(points, color, width = 2, dash = []) {
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.moveTo(...points[0]);
    for (const pt of points.slice(1)) ctx.lineTo(...pt);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function polygon(points, color) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const pt of points.slice(1)) ctx.lineTo(...pt);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function dot(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function txt(value, x, y, size = 19, col = C.ink, opt = {}) {
    ctx.font = (opt.bold ? 700 : 400) + ' ' + size + 'px "Lesson ' + (opt.face || 'Sans') + '"';
    ctx.textAlign = opt.align || 'left';
    ctx.fillStyle = col;
    ctx.fillText(String(value), x, y, opt.w || 1000);
  }
  function mono(v, x, y, size = 17, col = C.ink, w) {
    txt(v, x, y, size, col, { face: 'Mono', w });
  }
  function title(v, x = 40, y = 76, w = 875) {
    txt(v, x, y, 37, C.ink, { face: 'Serif', w });
  }
  function head(series, name) {
    txt(series.toUpperCase(), 40, 29, 13, C.stable, { face: 'Mono' });
    title(name);
  }
  function line(x, y, u, v, col = C.rule, width = 1) {
    path(
      [
        [x, y],
        [u, v],
      ],
      col,
      width,
    );
  }
  function paper(x, y, w, h, color = C.paper) {
    rect(x + 4, y + 6, w, h, '#b4bdad', 3);
    rect(x, y, w, h, color, 3);
    line(x + 4, y + 2, x + w - 3, y + 2, '#fffbea', 2);
  }
  function seal(value, x, y, color = C.stable, w = 220) {
    rect(x, y, w, 37, color, 4);
    txt(value, x + w / 2, y + 25, 17, C.white, {
      face: 'Mono',
      align: 'center',
      w: w - 14,
      bold: true,
    });
  }
  function rail(x, y, w, v, max, color = C.stable) {
    rect(x, y, w, 13, C.gray, 2);
    if (v > 0) rect(x, y, Math.min(1, v / max) * w, 13, color, 2);
  }
  function plate(x, y, w, h, label, rows, col = C.stable) {
    paper(x, y, w, h);
    rect(x, y, 8, h, col);
    txt(label, x + 20, y + 32, 20, col, { bold: true, w: w - 36 });
    rows.forEach((v, i) => mono(v, x + 21, y + 64 + i * 26, 16, C.ink, w - 38));
  }
  function roller(x, y, w) {
    rect(x, y, w, 18, C.ink, 9);
    for (let sx = x + 10; sx < x + w - 4; sx += 22) {
      dot(sx, y + 9, 5, '#97aaa0');
      dot(sx, y + 9, 1.6, C.ink);
    }
    line(x + 8, y + 19, x + 8, y + 34, C.stable, 5);
    line(x + w - 8, y + 19, x + w - 8, y + 34, C.stable, 5);
  }
  function packet(x, y, w, h, id, field, version, col = C.brass) {
    // A canvas dispatch pouch keeps the thread and payload together as the worker reads it.
    polygon(
      [
        [x, y + 19],
        [x + 13, y + 4],
        [x + w - 12, y],
        [x + w, y + 18],
        [x + w, y + h],
        [x, y + h],
      ],
      '#ad845a',
    );
    rect(x + 2, y + 17, w - 4, h - 19, col, 5);
    path(
      [
        [x + 8, y + 24],
        [x + w * 0.49, y + 49],
        [x + w - 8, y + 23],
      ],
      '#836547',
      2,
    );
    path(
      [
        [x + 8, y + 30],
        [x + 8, y + h - 7],
        [x + w - 8, y + h - 7],
        [x + w - 8, y + 30],
      ],
      '#927244',
      1,
      [3, 4],
    );
    if (version) {
      rect(x + w * 0.39, y + 14, w * 0.22, 23, C.ink, 2);
      txt(version, x + w * 0.5, y + 32, 17, C.white, { face: 'Mono', align: 'center', w: w * 0.2 });
    }
    rect(x + 14, y + 56, w - 28, h - 71, C.paper, 2);
    if (field) mono(field, x + 23, y + 81, 21, C.ink, w - 46);
    if (id) txt(id, x + 22, y + h - 26, 23, C.ink, { face: 'Mono', bold: true, w: w - 45 });
  }
  ctx.scale(2, 2);
  rect(0, 0, 960, 540, '#e9ecdc');
  // Fine drafting rulings give data marks a stable reference without boxing the picture.
  for (let x = 0; x <= 960; x += 24) line(x, 0, x, 540, '#e0e5d7', 0.5);
  for (let y = 0; y <= 540; y += 24) line(0, y, 960, y, '#e0e5d7', 0.5);
  return {
    ctx,
    beat,
    cue,
    after,
    rect,
    path,
    polygon,
    dot,
    txt,
    mono,
    title,
    head,
    line,
    paper,
    seal,
    rail,
    plate,
    roller,
    packet,
  };
}
