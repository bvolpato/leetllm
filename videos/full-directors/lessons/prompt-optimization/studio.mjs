// Dimensions are in a 1600 by 900 drawing space. The host supplies course fonts.
export const C = {
  ink: '#192e38',
  deep: '#183b45',
  sea: '#25515b',
  sage: '#a9c9b9',
  ivory: '#f6ebcf',
  paper: '#fff7df',
  rule: '#b8ad91',
  blue: '#366791',
  teal: '#176c66',
  rust: '#a43f2e',
  orange: '#f49b6c',
  mint: '#91d2b4',
  yellow: '#f4ce79',
  muted: '#bed0c6',
  shadow: '#142c3090',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const format = (n) => n.toLocaleString('en-US');
export function studio(ctx, clock) {
  ctx.scale(1.2, 1.2);
  const beat = clock.beat.beatIndex + 1;
  function cue(n, phrase, span = 0) {
    if (beat !== n) return Number(beat > n);
    return clock.reveal(phrase, span);
  }
  function end(n) {
    return beat > n || (beat === n && clock.elapsed >= clock.speechDuration);
  }
  function rect(x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  function line(x, y, xx, yy, color = C.rule, lw = 2) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  function dot(x, y, r, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  function poly(points, fill) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function txt(str, x, y, size = 34, color = C.ink, face = 'Sans', align = 'left', weight = 400) {
    ctx.fillStyle = color;
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(str), x, y);
  }
  function title(str, x, y, size = 55, color = C.ivory) {
    txt(str, x, y, size, color, 'Serif');
  }
  function mono(str, x, y, size = 34, color = C.ink, align = 'left') {
    txt(str, x, y, size, color, 'Mono', align);
  }
  function lab(str, x, y, color = C.teal, size = 22) {
    txt(str, x, y, size, color, 'Sans', 'left', 700);
  }
  function page(x, y, w, h, fill = C.paper) {
    rect(x + 6, y + 10, w, h, C.shadow);
    rect(x, y, w, h, fill);
  }
  function edge(x, y, w, color = C.rule) {
    line(x, y, x + w, y, color, 2);
  }
  function stamp(str, x, y, w, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.027);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(0, 0, w, 60);
    txt(str, w / 2, 43, 34, color, 'Sans', 'center', 700);
    ctx.restore();
  }
  function background(dark = true) {
    const grad = ctx.createLinearGradient(0, 0, 1600, 900);
    grad.addColorStop(0, dark ? C.sea : '#d5d7c6');
    grad.addColorStop(1, dark ? '#142e39' : '#acbdaf');
    rect(0, 0, 1600, 900, grad);
    for (let i = 0; i < 230; i++)
      rect(
        (i * 601 + 11) % 1600,
        (i * i * 11 + i * 103) % 900,
        3 + (i % 5),
        1,
        dark ? '#ffffff16' : '#15373815',
      );
  }
  function arrow(x, y, xx, yy, color = C.teal) {
    const a = Math.atan2(yy - y, xx - x);
    line(x, y, xx, yy, color, 4);
    poly(
      [
        [xx, yy],
        [xx - 17 * Math.cos(a - 0.43), yy - 17 * Math.sin(a - 0.43)],
        [xx - 17 * Math.cos(a + 0.43), yy - 17 * Math.sin(a + 0.43)],
      ],
      color,
    );
  }
  return {
    ctx,
    clock,
    beat,
    cue,
    end,
    rect,
    line,
    dot,
    poly,
    txt,
    title,
    mono,
    lab,
    page,
    edge,
    stamp,
    background,
    arrow,
  };
}
