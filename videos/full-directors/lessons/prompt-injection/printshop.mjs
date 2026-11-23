export const C = {
  paper: '#f5f0e2',
  sheet: '#fffdf4',
  ink: '#152f34',
  muted: '#52696a',
  line: '#acb8ac',
  teal: '#086f68',
  mint: '#c9e9d9',
  orange: '#9b3d20',
  peach: '#ffdbc0',
  gold: '#edb542',
  navy: '#233f51',
  white: '#fffdf4',
};

export function cue(clock, beat, phrase, duration = 0) {
  const current = clock.beat.beatIndex + 1;
  if (current !== beat) return Number(current > beat);
  return clock.reveal(phrase, duration);
}

export function printing(ctx) {
  ctx.scale(2, 2);
  function rect(x, y, w, h, fill, stroke, radius = 0) {
    ctx.beginPath();
    if (radius) ctx.roundRect(x, y, w, h, radius);
    else ctx.rect(x, y, w, h);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  function line(x, y, xx, yy, color = C.line, width = 1, dash = []) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(value, x, y, size = 19, color = C.ink, opts = {}) {
    const { face = 'Sans', weight = 400, align = 'left', max = 900 } = opts;
    let actual = size;
    const font = () => {
      ctx.font = weight + ' ' + actual + 'px "Lesson ' + face + '"';
    };
    font();
    const str = String(value),
      width = ctx.measureText(str).width;
    if (width > max) {
      actual *= max / width;
      font();
    }
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
  }
  const mono = (v, x, y, size = 16, color = C.ink, max = 900) =>
    text(v, x, y, size, color, { face: 'Mono', max });
  const label = (v, x, y, w = 850, col = C.muted) =>
    text(v.toUpperCase(), x, y, 13, col, { face: 'Mono', weight: 600, max: w });
  const title = (v, x = 48, y = 71, max = 865) => text(v, x, y, 39, C.ink, { face: 'Serif', max });
  function ticket(x, y, w, h, fill = C.sheet) {
    rect(x + 3, y + 4, w, h, '#d8d7c8');
    rect(x, y, w, h, fill);
    for (let i = 11; i < h - 8; i += 17) dot(x + 9, y + i, 2.4, C.paper);
    line(x + 20, y + 4, x + 20, y + h - 4, C.line, 0.8, [3, 3]);
  }
  function ruleRows(x, y, w, rows, gap = 42) {
    rows.forEach(([key, val, col], i) => {
      const yy = y + i * gap;
      line(x, yy + 10, x + w, yy + 10);
      text(key, x, yy, 16, C.muted, { max: w * 0.43 });
      text(val, x + w, yy, 20, col || C.ink, { face: 'Mono', align: 'right', max: w * 0.55 });
    });
  }
  function stamp(x, y, msg, ok = null, w = 240) {
    const color = ok === null ? C.navy : ok ? C.teal : C.orange;
    rect(x, y, w, 39, color, undefined, 3);
    text(msg, x + w / 2, y + 26, 19, C.white, { weight: 600, align: 'center', max: w - 18 });
  }
  function arrow(x, y, xx, yy, color = C.teal, width = 3) {
    line(x, y, xx, yy, color, width);
    const a = Math.atan2(yy - y, xx - x);
    for (const s of [-1, 1])
      line(
        xx,
        yy,
        xx - 10 * Math.cos(a + s * 0.55),
        yy - 10 * Math.sin(a + s * 0.55),
        color,
        width,
      );
  }
  function tray(x, y, w, h, tag, content, tone = C.teal) {
    rect(x + 4, y + 5, w, h, '#d0d3c7', undefined, 7);
    rect(x, y, w, h, C.navy, undefined, 7);
    rect(x + 12, y + 13, w - 24, h - 47, '#142f38', undefined, 5);
    if (content) {
      rect(x + 22, y + 18, w - 44, h - 57, C.sheet);
      text(content, x + w / 2, y + (h - 20) / 2, 21, tone, {
        face: 'Mono',
        align: 'center',
        max: w - 58,
      });
    }
    text(tag, x + 16, y + h - 13, 14, C.white, { face: 'Mono', max: w - 30 });
  }
  function sheet(x, y, w, h, head, rows) {
    ticket(x, y, w, h);
    label(head, x + 34, y + 30, w - 47);
    rows.forEach((row, i) =>
      text(row, x + 34, y + 64 + i * 31, 23, C.ink, { face: 'Serif', max: w - 50 }),
    );
  }
  rect(0, 0, 960, 540, C.paper);
  return {
    ctx,
    rect,
    line,
    dot,
    text,
    mono,
    label,
    title,
    ticket,
    ruleRows,
    stamp,
    arrow,
    tray,
    sheet,
  };
}
