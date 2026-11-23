export const C = {
  paper: '#F6F2E8',
  white: '#FFFDF7',
  ink: '#172D37',
  gray: '#53676F',
  rule: '#BBC5BE',
  teal: '#00736E',
  blue: '#276587',
  red: '#AE422F',
  gold: '#A56A12',
  night: '#142F3B',
  pale: '#DAE9E3',
  sky: '#D6E6ED',
  peach: '#F5D8C6',
  cream: '#F5E7C8',
  fog: '#C7D9DA',
  glow: '#FFBA89',
  mint: '#99DACE',
  lightBlue: '#A7D6ED',
};
export const rankColors = [C.teal, C.blue, C.gold, C.red];
export const rankFills = [C.pale, C.sky, C.cream, C.peach];
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(clock, beat, phrase, duration = 0) {
  if (clock.beat.beatIndex < beat) return 0;
  if (clock.beat.beatIndex > beat) return 1;
  return clock.reveal(phrase, duration);
}
export function finished(clock, beat, phrase) {
  return (
    cue(clock, beat, phrase) &&
    (clock.beat.beatIndex > beat || clock.elapsed >= clock.speechDuration)
  );
}
export function text(g, str, x, y, size = 21, color = C.ink, opt = {}) {
  const { font = 'Sans', weight = 500, align = 'left', width } = opt;
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  const measured = g.measureText(String(str)).width;
  if (width && measured > width)
    g.font = weight + ' ' + (size * width) / measured + 'px "Lesson ' + font + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(str), x, y);
}
export function mono(g, str, x, y, size = 20, color = C.ink, opt = {}) {
  text(g, str, x, y, size, color, { font: 'Mono', ...opt });
}
export function line(g, x1, y1, x2, y2, color = C.rule, width = 1.3, dash = []) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dash);
  g.stroke();
  g.setLineDash([]);
}
export function arrow(g, x1, y1, x2, y2, color = C.teal, width = 2) {
  line(g, x1, y1, x2, y2, color, width);
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.beginPath();
  g.moveTo(x2, y2);
  g.lineTo(x2 - 11 * Math.cos(a - 0.43), y2 - 11 * Math.sin(a - 0.43));
  g.lineTo(x2 - 11 * Math.cos(a + 0.43), y2 - 11 * Math.sin(a + 0.43));
  g.closePath();
  g.fillStyle = color;
  g.fill();
}
export function box(g, x, y, w, h, fill, stroke, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1.5;
    g.stroke();
  }
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
const standardLayout = { section: 19, rule: 32, heading: 56, subtitle: 95, bodyLift: 45 };
export const transposeLayout = { section: 18, rule: 30, heading: 53, subtitle: 89, bodyLift: 57 };
export const addressLayout = { ...standardLayout, heading: 55, subtitle: 81, bodyLift: 58 };
export const ownershipLayout = { ...standardLayout, bodyLift: 50 };
export const adamLayout = { ...standardLayout, bodyLift: 49 };
export const checkpointLayout = { ...standardLayout, rule: 31, heading: 55, subtitle: 90 };

export function shell(g, section, heading, sub, layout = standardLayout) {
  g.scale(2, 2);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 960, 540);
  g.fillStyle = C.teal;
  g.fillRect(0, 0, 960, 5);
  text(g, section, 40, layout.section, 15, C.teal, { weight: 700 });
  line(g, 40, layout.rule, 920, layout.rule, C.rule, 1);
  text(g, heading, 38, layout.heading, 39, C.ink, { font: 'Serif', weight: 600, width: 884 });
  if (sub) text(g, sub, 40, layout.subtitle, 19, C.gray, { width: 883 });
  g.translate(0, -layout.bodyLift);
}
export function foot(g, label, detail = '') {
  g.setTransform(2, 0, 0, 2, 0, 0);
  box(g, 0, 394, 960, 60, C.night);
  box(g, 0, 514, 960, 26, C.night);
  if (detail) {
    text(g, label, 40, 410, 22, C.white, { weight: 600, width: 878 });
    text(g, detail, 40, 439, 17, C.fog, { width: 878 });
  } else text(g, label, 40, 424, 23, C.white, { weight: 600, width: 878 });
}
export function cells(
  g,
  values,
  x,
  y,
  w,
  h,
  {
    highlight = -1,
    fill = C.white,
    stroke = C.rule,
    chosen = C.red,
    show = values.length,
    mark = C.white,
    size = 22,
  } = {},
) {
  values.forEach((v, i) => {
    const active = i === highlight;
    box(g, x + i * w, y, w - 2, h, active ? chosen : fill, active ? chosen : stroke, 3);
    if (i < show)
      mono(g, String(v), x + (i + 0.5) * w - 1, y + h / 2, size, active ? mark : C.ink, {
        align: 'center',
        weight: 600,
      });
  });
}
export function grid(g, rows, x, y, cellW, cellH, marked = -99) {
  rows.forEach((row, i) =>
    cells(g, row, x, y + i * cellH, cellW, cellH - 2, {
      highlight: row.findIndex((n) => Number(n) === marked),
      size: 23,
    }),
  );
}
