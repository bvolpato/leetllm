export const C = {
  board: '#103b37',
  deep: '#092521',
  edge: '#46716a',
  silk: '#edf3da',
  dim: '#a6c6b6',
  mint: '#84e5c4',
  gold: '#ffd181',
  red: '#ffa18e',
  blue: '#9fd5f7',
  paper: '#f0e7ce',
  ink: '#1c332f',
  shade: '#b7b198',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const cap = (v) => Math.min(1, Math.max(0, v));
export const series = (n) => Array.from({ length: n }, (_, i) => i);

// The probe board uses logical half-resolution coordinates. The host draws its own intro.
export function board(ctx, clock) {
  ctx.scale(2, 2);
  const b = clock.beat.beatIndex;
  const cue = (beat, phrase, span = 0.85, captionStart) =>
    b < beat ? 0 : b > beat ? 1 : clock.reveal(phrase, span, { captionStart });
  const said = (beat) => b > beat || (b === beat && clock.elapsed >= clock.speechDuration);
  function box(x, y, w, h, fill, r = 0) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
    ctx.fill();
  }
  function line(x, y, xx, yy, color = C.edge, width = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.stroke();
  }
  function dot(x, y, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function text(value, x, y, size = 20, color = C.silk, align = 'left', font = 'Sans', max = 880) {
    ctx.font = (font === 'Mono' ? '500 ' : '600 ') + size + 'px "Lesson ' + font + '"';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y, max);
  }
  function wafer(x, y, w, h, value, active = C.paper, size = 24) {
    const count = Math.max(2, Math.min(10, Math.floor(w / 13)));
    for (let i = 0; i < count; i++) {
      const xp = x + ((i + 0.5) * w) / count - 1.6;
      box(xp, y - 4, 3.2, h + 8, active ? C.shade : C.edge);
    }
    box(x, y + 3, w, h, C.deep, 5);
    box(x, y, w, h, active || C.edge, 4);
    if (!active) box(x + 1.4, y + 1.4, w - 2.8, h - 2.8, C.deep, 3);
    if (value !== null)
      text(value, x + w / 2, y + h / 2 + 1, size, active ? C.ink : C.dim, 'center', 'Mono', w - 6);
  }
  function strip(x, y, w, h, fill = C.paper) {
    box(x + 2, y + 5, w, h, '#082721', 3);
    box(x, y, w, h, fill, 2);
    for (let yy = y + 10; yy < y + h - 4; yy += 16) {
      dot(x + 7, yy, 2, C.board);
      dot(x + w - 7, yy, 2, C.board);
    }
  }
  function row(values, x, y, w, h, colors = [], gap = 8, size = 24) {
    const cw = (w - gap * (values.length - 1)) / values.length;
    values.forEach((v, i) => wafer(x + i * (cw + gap), y, cw, h, v, colors.length ? colors[i] : C.paper, size));
  }
  function readout(main, sub = '') {
    line(45, 405, 915, 405, C.edge, 1);
    text(main, 48, 419, 26, C.gold, 'left', 'Sans', 865);
    if (sub) text(sub, 48, 438, 18, C.dim);
  }
  function trace(x1, y1, x2, y2, color, progress = 1) {
    const mid = (y1 + y2) / 2,
      pts = [
        [x1, y1],
        [x1, mid],
        [x2, mid],
        [x2, y2],
      ];
    let dist = progress * (Math.abs(y2 - y1) + Math.abs(x2 - x1));
    for (let i = 1; i < pts.length; i++) {
      const [a, z] = pts[i - 1],
        [aa, zz] = pts[i],
        len = Math.abs(aa - a) + Math.abs(zz - z);
      if (!len) continue;
      const t = cap(dist / len);
      if (t > 0) line(a, z, mix(a, aa, t), mix(z, zz, t), color, 2.6);
      dist -= len;
    }
  }
  function heading(s) {
    text(s, 46, 53, 34, C.silk, 'left', 'Serif', 858);
    line(46, 86, 914, 86, C.edge, 1);
  }
  const bg = ctx.createLinearGradient(0, 0, 960, 540);
  bg.addColorStop(0, '#164540');
  bg.addColorStop(0.72, '#103430');
  bg.addColorStop(1, '#0f2d2b');
  box(0, 0, 960, 540, bg);
  for (const x of [18, 942])
    for (const y of [18, 522]) {
      dot(x + 1, y + 1, 6, '#082821');
      dot(x, y, 5, '#a29c79');
      line(x - 2.8, y + 1.8, x + 2.8, y - 1.8, '#4b594e', 1.3);
    }
  for (let i = 0; i < 3; i++) {
    line(35, 495 + i * 5, 163 - i * 8, 495 + i * 5, '#2d5148', 1);
    line(163 - i * 8, 495 + i * 5, 182 - i * 8, 514 + i * 5, '#2d5148', 1);
    dot(182 - i * 8, 514 + i * 5, 2, '#486657');
  }
  const ch = clock.beat.chapterId;
  if (['c18', 'c19', 'c21', 'c22'].includes(ch)) {
    // A trace is read against the same graticule as its cursor moves.
    const glass = ctx.createLinearGradient(0, 99, 0, 405);
    glass.addColorStop(0, '#122b2e');
    glass.addColorStop(0.52, '#142f31');
    glass.addColorStop(1, '#0b2226');
    box(30, 97, 900, 308, '#082023', 14);
    box(32, 99, 896, 304, glass, 12);
    for (let i = 1; i < 21; i++) line(43 + i * 42, 110, 43 + i * 42, 392, '#24403e', 0.5);
    for (let j = 1; j < 7; j++) line(44, 106 + j * 41, 917, 106 + j * 41, '#24403e', 0.5);
    for (let i = 0; i < 43; i++) line(55 + 20 * i, 399, 55 + 20 * i, 399 - (i % 5 ? 2 : 5), '#5e7468', 0.7);
  }
  heading(clock.beat.chapterTitle);
  return { ctx, b, cue, said, clock, box, line, dot, text, wafer, strip, row, readout, trace };
}
