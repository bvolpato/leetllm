export const C = {
  paper: '#f2ead6',
  light: '#fff9e8',
  ink: '#182f35',
  dark: '#122a30',
  muted: '#506469',
  rule: '#afbaae',
  green: '#176d60',
  mint: '#a8dbb7',
  copper: '#ae4c26',
  orange: '#ffc18b',
  blue: '#527e9a',
  pale: '#b9d4e3',
  red: '#9e3c42',
  rose: '#edb2ac',
  brass: '#d3af72',
  iron: '#355158',
};
export const names = ['Login fixture', 'Runner clock', 'Issuer config', 'Release list'];
export const letter = (i) => String.fromCharCode(65 + i);
export const fmt = (n) => n.toLocaleString('en-US');
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const count = (n, progress) => Math.floor(n * clamp(progress) + 1e-7);
export function cue(clock, beat, phrase, seconds = 0.6, options) {
  const i = clock.beat.beatIndex + 1;
  return i < beat ? 0 : i > beat ? 1 : clock.reveal(phrase, seconds, options);
}
export function cueAfter(clock, beat, phrase, { captionStart = phrase } = {}) {
  const i = clock.beat.beatIndex + 1;
  if (i !== beat) return i > beat;
  const { start, end } = clock.wordCue(phrase);
  return clock.reveal(phrase, end - start, { captionStart }) === 1;
}
export function press(ctx, dark = false) {
  const p = {
    bg: dark ? C.dark : C.paper,
    fg: dark ? C.light : C.ink,
    mid: dark ? '#b4c4bb' : C.muted,
    grid: dark ? C.iron : C.rule,
    good: dark ? C.mint : C.green,
    hot: dark ? C.orange : C.copper,
  };
  const bodyLift = 57;
  ctx.scale(4 / 3, 4 / 3);
  function rect(x, y, w, h, fill, stroke, width = 2) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      ctx.strokeRect(x, y, w, h);
    }
  }
  function line(x, y, xx, yy, color = p.grid, width = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.stroke();
  }
  function disc(x, y, r, fill, stroke, width = 2) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
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
  function shape(points, fill, stroke, width = 2) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const pt of points.slice(1)) ctx.lineTo(...pt);
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
  function roller(x, y, r, rotation = 0) {
    disc(x, y, r, C.iron, C.ink, 3);
    disc(x, y, r * 0.72, C.dark, C.brass, 2);
    disc(x, y, r * 0.19, C.brass);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + rotation;
      line(
        x + Math.cos(a) * r * 0.39,
        y + Math.sin(a) * r * 0.39,
        x + Math.cos(a) * r * 0.61,
        y + Math.sin(a) * r * 0.61,
        C.brass,
        3,
      );
    }
  }
  function text(s, x, y, size = 28, color = p.fg, opt = {}) {
    ctx.fillStyle = color;
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = 'middle';
    ctx.font = (opt.weight || 500) + ' ' + size + 'px "Lesson ' + (opt.face || 'Sans') + '"';
    ctx.fillText(String(s), x, y, opt.max || 1370);
  }
  function mono(s, x, y, size = 24, color = p.fg, opt = {}) {
    text(s, x, y, size, color, { face: 'Mono', ...opt });
  }
  function title(s) {
    text(s, 55, 49 + bodyLift, 52, p.fg, { face: 'Serif', max: 1320 });
    line(55, 93 + bodyLift, 1385, 93 + bodyLift, p.grid);
  }
  function foot(s, sub = '', { raised = false } = {}) {
    const y = raised ? 652 : 645 + bodyLift;
    if (!raised) line(55, 620 + bodyLift, 1385, 620 + bodyLift, p.grid);
    text(s, 55, y, 31, p.fg, { max: sub ? 870 : 1330 });
    if (sub) mono(sub, 1385, y, 22, p.good, { align: 'right', max: 420 });
  }
  function label(s, x, y) {
    mono(s, x, y, 19, p.mid);
  }
  function arrow(x, y, xx, yy, color = p.hot, width = 4) {
    line(x, y, xx, yy, color, width);
    const angle = Math.atan2(yy - y, xx - x);
    for (const turn of [-0.58, 0.58])
      line(
        xx,
        yy,
        xx - 13 * Math.cos(angle + turn),
        yy - 13 * Math.sin(angle + turn),
        color,
        width,
      );
  }
  function tag(s, x, y, w, h, fill = C.paper, color = C.ink, size = 28) {
    rect(x, y, w, h, fill, p.grid);
    text(s, x + w / 2, y + h / 2, size, color, { align: 'center', max: w - 14 });
  }
  function strip(x, y, w, h, fill = C.light) {
    rect(x + 4, y + 5, w, h, dark ? '#0d2024' : '#d3cbb7');
    rect(x, y, w, h, fill, p.grid);
    for (let px = x + 13; px < x + w - 5; px += 26) disc(px, y + 10, 3.1, p.bg);
  }
  function card(i, x, y, w, h, secondary = '', fill = C.light) {
    strip(x, y, w, h, fill);
    text(letter(i), x + 33, y + h * 0.55, Math.min(44, h * 0.55), C.copper, {
      face: 'Serif',
      align: 'center',
    });
    line(x + 62, y + 21, x + 62, y + h - 9, C.rule);
    text(names[i % 4], x + 77, y + h * (secondary ? 0.47 : 0.56), Math.min(28, h * 0.42), C.ink, {
      max: w - 88,
    });
    if (secondary) mono(secondary, x + 77, y + h * 0.77, 20, C.muted, { max: w - 90 });
  }
  function value(s, unit, x, y) {
    text(s, x, y, 77, p.fg, { face: 'Serif', max: 530 });
    mono(unit, x + 2, y + 62, 22, p.mid);
  }
  rect(0, 0, 1440, 810, p.bg);
  // Lift the diagrams together to leave space for two subtitle lines below the footer.
  ctx.translate(0, -bodyLift);
  return {
    ...p,
    rect,
    line,
    disc,
    shape,
    roller,
    text,
    mono,
    title,
    foot,
    label,
    arrow,
    tag,
    strip,
    card,
    value,
  };
}
