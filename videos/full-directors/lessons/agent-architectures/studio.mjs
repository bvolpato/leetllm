export const C = {
  paper: '#f7efd9',
  white: '#fff9e9',
  sand: '#e7d8b4',
  rule: '#bdac87',
  ink: '#162f38',
  muted: '#456368',
  blue: '#28618c',
  sky: '#b3d5de',
  teal: '#197665',
  mint: '#bbdfc6',
  gold: '#e3a840',
  goldInk: '#86500e',
  red: '#ab4639',
  rose: '#f1c4ad',
  dark: '#132e37',
  light: '#e9f0db',
};
export function brush(ctx) {
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function path(points, color, width = 0) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    if (width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  const line = (x, y, u, v, color, width = 1) =>
    path(
      [
        [x, y],
        [u, v],
      ],
      color,
      width,
    );
  function circle(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(
    str,
    x,
    y,
    size = 20,
    color = C.ink,
    style = 'Sans',
    width = Infinity,
    align = 'left',
    weight = 400,
  ) {
    ctx.font = weight + ' ' + size + 'px "Lesson ' + style + '"';
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = align;
    const value = String(str);
    const measured = ctx.measureText(value).width;
    if (measured > width)
      ctx.font = weight + ' ' + (size * width) / measured + 'px "Lesson ' + style + '"';
    ctx.fillText(value, x, y);
  }
  const label = (s, x, y, w = Infinity, color = C.muted) => text(s, x, y, 15, color, 'Mono', w);
  function arrow(x, y, u, v, color = C.teal, wide = 3) {
    line(x, y, u, v, color, wide);
    const a = Math.atan2(v - y, u - x);
    path(
      [
        [u, v],
        [u - 11 * Math.cos(a - 0.48), v - 11 * Math.sin(a - 0.48)],
        [u - 11 * Math.cos(a + 0.48), v - 11 * Math.sin(a + 0.48)],
      ],
      color,
    );
  }
  function socket(x, y, color = C.blue, r = 8) {
    circle(x, y, r + 2, C.paper);
    circle(x, y, r, color);
    circle(x, y, r * 0.38, C.paper);
  }
  function paper(x, y, w, h, color = C.white) {
    rect(x + 5, y + 6, w, h, C.sand);
    rect(x, y, w, h - 4, color);
    for (let k = 0; k < w; k += 12)
      path(
        [
          [x + k, y + h - 5],
          [x + Math.min(w, k + 6), y + h],
          [x + Math.min(w, k + 12), y + h - 5],
        ],
        color,
      );
  }
  function heading(section, title) {
    rect(0, 0, 960, 540, C.paper);
    rect(0, 0, 960, 6, C.teal);
    label(section, 44, 42, 865);
    text(title, 42, 93, 41, C.ink, 'Serif', 875);
    line(44, 112, 916, 112, C.rule);
  }
  function note(str, color = C.ink) {
    line(44, 437, 916, 437, C.rule);
    rect(44, 453, 6, 24, color);
    text(str, 65, 474, 22, color, 'Sans', 846, 'left', 500);
  }
  function plate(x, y, w, h, head, main, sub, color = C.teal) {
    paper(x, y, w, h);
    rect(x, y, 7, h - 5, color);
    label(head, x + 20, y + 28, w - 37, color);
    line(x + 20, y + 41, x + w - 15, y + 41, C.sand);
    text(main, x + 20, y + 78, 29, C.ink, 'Serif', w - 38);
    if (sub) text(sub, x + 20, y + 108, 17, C.muted, 'Sans', w - 38);
  }
  function table(headers, rows, widths, x = 46, y = 156, rowH = 54) {
    const sum = widths.reduce((a, b) => a + b, 0);
    rect(x, y - 23, sum, 35, C.dark);
    let left = x;
    headers.forEach((h, i) => {
      text(h, left + 11, y, 15, C.light, 'Mono', widths[i] - 18);
      left += widths[i];
    });
    rows.forEach((row, j) => {
      const top = y + 14 + j * rowH;
      rect(x, top, sum, rowH - 2, j % 2 ? C.paper : C.white);
      let left = x;
      row.forEach((v, i) => {
        const cell = Array.isArray(v) ? v : [v, C.ink];
        text(
          cell[0],
          left + 11,
          top + rowH * 0.64,
          22,
          cell[1],
          'Sans',
          widths[i] - 21,
          'left',
          i === 0 ? 600 : 400,
        );
        left += widths[i];
      });
      line(x, top + rowH - 1, x + sum, top + rowH - 1, C.rule);
    });
  }
  return {
    ctx,
    rect,
    path,
    line,
    circle,
    text,
    label,
    arrow,
    socket,
    paper,
    heading,
    note,
    plate,
    table,
  };
}
// A step changes every dependent field on the word. A nonzero span is for a moving mark.
export function cues(clock) {
  return (beat, phrase, span = 0) =>
    clock.beat.beatIndex + 1 > beat
      ? 1
      : clock.beat.beatIndex + 1 < beat
        ? 0
        : clock.reveal(phrase, span);
}
export const fmt = (n) => n.toLocaleString('en-US');
