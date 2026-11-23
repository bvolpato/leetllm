// The press keeps the input strip in its register while a second impression marks the targets.
export const C = {
  ground: '#122c30',
  deep: '#0c2225',
  slate: '#28474a',
  line: '#557174',
  cream: '#f2ead4',
  paper: '#e8dec5',
  ink: '#163336',
  faint: '#b1c5ba',
  mint: '#93e1bd',
  green: '#146752',
  gold: '#f3be68',
  brass: '#956120',
  rust: '#a33e31',
  coral: '#ff9c86',
  blue: '#a8cedc',
  hole: '#436064',
};
export function after(k, beat, phrase, duration = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase, duration);
}
export function painter(ctx) {
  function box(x, y, w, h, fill, r = 0) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function line(x, y, x2, y2, color = C.line, width = 3, dash = []) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  function poly(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  function txt(value, x, y, size = 42, color = C.cream, face = 'Sans', align = 'left', max = 1750) {
    const string = String(value);
    ctx.font = '400 ' + size + 'px "Lesson ' + face + '"';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(string, x, y, max);
  }
  const note = (s, x, y, color = C.faint) => txt(s, x, y, 32, color);
  const number = (v, x, y, size = 56, color = C.gold, align = 'left', w = 1600) =>
    txt(v, x, y, size, color, 'Mono', align, w);
  function heading(kicker, name) {
    note(kicker, 100, 99, C.gold);
    txt(name, 98, 197, 78, C.cream, 'Serif');
  }
  function arrow(x1, y1, x2, y2, c = C.gold, width = 6) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const b = 14 + width;
    line(x1, y1, x2 - Math.cos(a) * 10, y2 - Math.sin(a) * 10, c, width);
    poly(
      [
        [x2, y2],
        [x2 - b * Math.cos(a - 0.46), y2 - b * Math.sin(a - 0.46)],
        [x2 - b * Math.cos(a + 0.46), y2 - b * Math.sin(a + 0.46)],
      ],
      c,
    );
  }
  function sheet(x, y, w, h, tint = C.paper) {
    box(x + 4, y + 10, w, h, C.deep, 6);
    poly(
      [
        [x, y],
        [x + w - 27, y],
        [x + w, y + 27],
        [x + w, y + h],
        [x, y + h],
      ],
      tint,
    );
    poly(
      [
        [x + w - 27, y],
        [x + w - 27, y + 27],
        [x + w, y + 27],
      ],
      '#b9af99',
    );
  }
  function rail(
    labels,
    { x = 130, y = 400, w = 1660, h = 116, colors = [], ink = [], indices, fontsize = 44 } = {},
  ) {
    const dx = w / labels.length;
    box(x - 12, y - 12, w + 24, h + 28, C.deep, 14);
    const xs = labels.map((v, i) => {
      const l = x + i * dx,
        m = l + dx / 2,
        fill = colors[i] ?? C.paper;
      box(l + 2, y, dx - 4, h, fill, 4);
      dot(l + 14, y + 12, 3.5, C.hole);
      dot(l + dx - 14, y + h - 12, 3.5, C.hole);
      txt(v, m, y + h / 2 + fontsize * 0.3, fontsize, ink[i] ?? C.ink, 'Mono', 'center', dx - 22);
      if (indices) number(indices[i], m, y - 33, 28, C.faint, 'center');
      return m;
    });
    return xs;
  }
  function rows(items, x, y, w, h = 87) {
    items.forEach(([l, r, color], i) => {
      const top = y + h * i;
      line(x, top, x + w, top, C.line, 2);
      txt(l, x + 6, top + h * 0.67, 37, C.cream, 'Sans', 'left', w * 0.6);
      if (r !== undefined)
        txt(r, x + w - 6, top + h * 0.67, 39, color ?? C.gold, 'Mono', 'right', w * 0.37);
    });
  }
  function init() {
    const shade = ctx.createLinearGradient(0, 0, 1600, 1080);
    shade.addColorStop(0, '#1e3b3c');
    shade.addColorStop(1, C.deep);
    box(0, 0, 1920, 1080, shade);
  }
  return { ctx, box, line, dot, poly, txt, note, number, heading, arrow, sheet, rail, rows, init };
}

export function key(p, x, y, scale = 1) {
  const { ctx, poly, dot } = p;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  poly(
    [
      [0, -21],
      [132, -21],
      [149, -5],
      [125, 20],
      [102, 20],
      [102, 4],
      [85, 4],
      [85, 20],
      [62, 20],
      [62, 9],
      [0, 9],
    ],
    C.gold,
  );
  dot(0, 0, 44, C.gold);
  dot(-8, -2, 17, C.ground);
  p.line(34, -12, 123, -12, '#d39848', 5);
  ctx.restore();
}
export function proofLine(p, label, value, y, color = C.mint) {
  p.note(label, 115, y);
  p.txt(value, 555, y + 2, 49, color, 'Serif', 'left', 1235);
}
