// All scene geometry is in half-resolution units. The host supplies the fonts.
export const ink = '#213c40',
  paper = '#f7ebcf',
  sheet = '#fffae7',
  blue = '#246e7c',
  teal = '#14594f',
  gold = '#dfae4a',
  rust = '#aa4536',
  faded = '#65736d',
  rule = '#bbb18e',
  dark = '#17383d',
  pale = '#c6ded1',
  peach = '#f2c7a0';
export function press(ctx, clock) {
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  function path(points, color, width = 2, fill = false) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  function line(x, y, u, v, color = rule, width = 1) {
    path(
      [
        [x, y],
        [u, v],
      ],
      color,
      width,
    );
  }
  function oval(x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(value, x, y, size = 22, color = ink, face = 'Sans', align = 'left', weight = 400) {
    if (value === '↵') {
      const w = size * 0.82,
        left = x - (align === 'center' ? w / 2 : align === 'right' ? w : 0);
      const mid = y - size * 0.28;
      path(
        [
          [left + w, y - size * 0.76],
          [left + w, mid],
          [left + w * 0.08, mid],
        ],
        color,
        Math.max(1.5, size * 0.085),
      );
      path(
        [
          [left + w * 0.35, mid - size * 0.22],
          [left + w * 0.08, mid],
          [left + w * 0.35, mid + size * 0.22],
        ],
        color,
        Math.max(1.5, size * 0.085),
      );
      return;
    }
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(value), x, y);
  }
  function serif(value, x, y, size = 45, color = ink, align = 'left') {
    text(value, x, y, size, color, 'Serif', align);
  }
  function mono(value, x, y, size = 22, color = ink, align = 'left') {
    text(value, x, y, size, color, 'Mono', align);
  }
  function label(value, x, y, color = faded, align = 'left') {
    text(value, x, y, 16, color, 'Sans', align, 600);
  }
  function field(title, sub) {
    rect(0, 0, 960, 540, paper);
    rect(0, 0, 12, 540, ink);
    serif(title, 45, 66, 43);
    if (sub) label(sub, 47, 101);
    line(47, 114, 912, 114, rule);
  }
  function stock(x, y, w, h, color = sheet) {
    rect(x + 4, y + 6, w, h, '#152e2f40');
    rect(x + 1, y + 2, w, h, '#b5ac8b');
    rect(x, y, w, h, color);
  }
  function slug(value, x, y, w = 96, h = 68, color = ink, face = 'Serif', size = 35) {
    rect(x + 3, y + 6, w, h, '#172e2e5c');
    rect(x, y + 4, w, h, '#a3906a');
    rect(x, y, w, h, '#eddfba');
    line(x + 4, y + 3, x + w - 4, y + 3, '#fffae8', 2);
    rect(x + w * 0.37, y + h - 4, w * 0.26, 4, '#a99a76');
    text(value, x + w / 2, y + h * 0.54 + size * 0.24, size, color, face, 'center');
  }
  function bracket(x, y, u, color = blue) {
    path(
      [
        [x, y - 10],
        [x, y],
        [u, y],
        [u, y - 10],
      ],
      color,
      3,
    );
  }
  function arrow(x, y, u, v, color = rust, width = 3) {
    line(x, y, u, v, color, width);
    const a = Math.atan2(v - y, u - x);
    path(
      [
        [u - 11 * Math.cos(a - 0.48), v - 11 * Math.sin(a - 0.48)],
        [u, v],
        [u - 11 * Math.cos(a + 0.48), v - 11 * Math.sin(a + 0.48)],
      ],
      color,
      width,
    );
  }
  function alpha(amount, fn) {
    if (amount <= 0) return;
    ctx.save();
    ctx.globalAlpha *= amount;
    fn();
    ctx.restore();
  }
  function cue(beat, words, span = 0.5) {
    const i = clock.beat.beatIndex + 1;
    return i < beat ? 0 : i > beat ? 1 : clock.reveal(words, span);
  }
  function cueThrough(beat, firstPhrase, lastPhrase = firstPhrase, captionStart = firstPhrase) {
    const i = clock.beat.beatIndex + 1;
    if (i !== beat) return i < beat ? 0 : 1;
    const { start } = clock.wordCue(firstPhrase);
    const { end } = clock.wordCue(lastPhrase);
    return clock.reveal(firstPhrase, end - start, { captionStart });
  }
  function tray(x, y, w, h) {
    rect(x, y, w, h, '#574738');
    rect(x + 4, y + 4, w - 8, h - 9, '#342f2a');
    rect(x, y + h - 5, w, 8, '#ad8c55');
    line(x, y + h + 1, x + w, y + h + 1, '#dcb679');
    for (const u of [x + 7, x + w - 7]) oval(u, y + h, 2, 2, '#534635');
  }
  function table(x, y, columns, rows, { step = 45, focus = -1, align = 'left' } = {}) {
    const right = x + columns.reduce((s, v) => s + v[1], 0);
    let dx = x;
    columns.forEach(([v, w]) => {
      label(v, dx + 8, y, blue);
      dx += w;
    });
    line(x, y + 10, right, y + 10, blue, 1.5);
    rows.forEach((row, i) => {
      const top = y + 13 + i * step;
      let cx = x;
      if (i === focus) rect(x, top, right - x, step, '#dfce9e');
      row.forEach((v, j) => {
        text(v, cx + 8, top + step * 0.66, step < 36 ? 17 : 21, ink, 'Mono', align);
        cx += columns[j][1];
      });
      line(x, top + step, right, top + step, rule);
    });
  }
  return {
    ctx,
    rect,
    line,
    path,
    oval,
    text,
    serif,
    mono,
    label,
    field,
    stock,
    slug,
    bracket,
    arrow,
    alpha,
    cue,
    cueThrough,
    tray,
    table,
    b: clock.beat.beatIndex + 1,
  };
}
export const fmt = (n) => n.toLocaleString('en-US');
export const vec = (v) => '[' + v.join(', ') + ']';
export const lerp = (a, b, t) => a + (b - a) * t;
