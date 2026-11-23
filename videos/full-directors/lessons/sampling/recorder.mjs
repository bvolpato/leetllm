export const ink = '#192f35',
  dim = '#496469',
  paper = '#f2ecd9',
  line = '#a8b3a4';
export const blue = '#1b6c93',
  teal = '#117465',
  red = '#af483a',
  gold = '#936407',
  purple = '#70598b';
export const colors = [blue, teal, purple, gold];
export const clamp = (t) => Math.min(1, Math.max(0, t));
export const mix = (a, b, t) => a + (b - a) * t;
export const seq = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
export const sum = (a) => a.reduce((s, v) => s + v, 0);
export const pct = (n, digits = 1) => (100 * n).toFixed(digits) + '%';

export function recorder(c, clock, title, section) {
  const b = clock.beat.beatIndex;
  function cue(beat, phrase, seconds = 0.75) {
    if (b !== beat) return Number(b > beat);
    const t = clock.reveal(phrase, seconds);
    return t * t * (3 - 2 * t);
  }
  function spoken(beat, phrase, captionStart = phrase) {
    if (b !== beat) return Number(b > beat);
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart });
  }
  function rect(x, y, w, h, fill, stroke) {
    if (fill) {
      c.fillStyle = fill;
      c.fillRect(x, y, w, h);
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.strokeRect(x, y, w, h);
    }
  }
  function path(points, color = ink, width = 2, fill) {
    if (!points.length) return;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (fill) {
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    }
    if (color) {
      c.lineJoin = 'round';
      c.lineWidth = width;
      c.strokeStyle = color;
      c.stroke();
    }
  }
  function rule(x, y, x2, y2, color = line, width = 1) {
    path(
      [
        [x, y],
        [x2, y2],
      ],
      color,
      width,
    );
  }
  function dot(x, y, r, color = teal, outline) {
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fillStyle = color;
    c.fill();
    if (outline) {
      c.strokeStyle = outline;
      c.lineWidth = 2;
      c.stroke();
    }
  }
  function label(
    value,
    x,
    y,
    size = 18,
    color = ink,
    align = 'left',
    face = 'Sans',
    weight = 500,
    max = 870,
  ) {
    c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    c.fillStyle = color;
    c.textBaseline = 'alphabetic';
    c.textAlign = align;
    c.fillText(String(value), x, y, max);
  }
  function num(v, x, y, size = 28, color = ink, align = 'left') {
    label(v, x, y, size, color, align, 'Mono', 500);
  }
  function footer(a, detail = '') {
    label(a, 55, 445, 24, '#fff0d5', 'left', 'Serif', 500);
    if (detail) label(detail, 56, 470, 16, '#b7d3c9');
  }
  function axis(x, y, w, lo, hi, ticks, unit) {
    const px = (v) => x + (w * (v - lo)) / (hi - lo);
    rule(x, y, x + w, y, dim, 1.4);
    ticks.forEach((t) => {
      rule(px(t), y, px(t), y + 6, dim);
      num(String(t), px(t), y + 24, 14, dim, 'center');
    });
    if (unit) label(unit, x + w, y + 47, 16, dim, 'right');
    return px;
  }
  function plot({
    x = 74,
    y = 140,
    w = 520,
    h = 198,
    xmin = 0,
    xmax = 24,
    ymin = 0,
    ymax = 1,
    xt = [0, 6, 10, 15, 24],
    yt = [],
    unit = '',
    measure = '',
  } = {}) {
    const X = axis(x, y + h, w, xmin, xmax, xt, unit);
    const Y = (v) => y + h - (h * (v - ymin)) / (ymax - ymin);
    rule(x, y, x, y + h, dim);
    yt.forEach((v) => {
      rule(x, Y(v), x + w, Y(v), line, 0.7);
      num(v, x - 7, Y(v) + 4, 12, dim, 'right');
    });
    label(measure, x, y - 13, 16, dim);
    const pts = (fn, a = xmin, z = xmax, n = 120) =>
      seq(n + 1, (i) => {
        const v = mix(a, z, i / n);
        return [X(v), Y(fn(v))];
      });
    function curve(fn, color = teal, a = xmin, z = xmax) {
      path(pts(fn, a, z), color, 3);
    }
    function fill(fn, a, z, color) {
      path([[X(a), Y(0)], ...pts(fn, a, z), [X(z), Y(0)]], null, 0, color);
    }
    return { X, Y, pts, curve, fill, x, y, w, h };
  }
  function readout(name, value, x = 655, y = 192, color = teal) {
    label(name, x, y, 17, dim);
    label(value, x, y + 44, 35, color, 'left', 'Mono', 500, 898 - x);
  }
  // The perforations and tear line belong to the same strip as its recorded marks.
  const housing = c.createLinearGradient(0, 0, 920, 540);
  housing.addColorStop(0, '#224c50');
  housing.addColorStop(0.6, '#173f43');
  housing.addColorStop(1, '#102f35');
  rect(0, 0, 960, 540, housing);
  // The paper feeds between metal guides and casts a shadow on the recorder.
  rect(21, 20, 927, 370, '#102f31');
  for (const x of [6, 946]) {
    const metal = c.createLinearGradient(x, 0, x + 9, 0);
    metal.addColorStop(0, '#374c48');
    metal.addColorStop(0.4, '#acb099');
    metal.addColorStop(1, '#364b48');
    rect(x, 39, 8, 346, metal);
    for (const y of [45, 379]) {
      dot(x + 4, y, 2.8, '#c2c1a7');
      rule(x + 2, y + 1, x + 6, y - 1, dim, 0.9);
    }
  }
  const g = c.createLinearGradient(0, 0, 960, 440);
  g.addColorStop(0, '#fcf4df');
  g.addColorStop(0.7, '#efe9d6');
  g.addColorStop(1, '#e4dcc4');
  rect(17, 12, 926, 369, g);
  for (let x = 31; x < 941; x += 30) {
    dot(x, 23, 2.4, '#486462');
  }
  rule(41, 64, 917, 64, '#788e80');
  label(section.toUpperCase(), 746, 52, 13, teal, 'left', 'Mono', 600);
  label(title, 51, 54, 30, ink, 'left', 'Serif', 600, 860);
  for (let x = 17; x < 942; x += 10)
    path(
      [
        [x, 381],
        [x + 5, 385],
        [x + 10, 381],
      ],
      null,
      0,
      '#e6dfc9',
    );
  // Keep chart marks and their labels together below the single-line header.
  c.translate(0, -30);
  return { c, b, cue, spoken, rect, path, rule, dot, label, num, footer, axis, plot, readout };
}
