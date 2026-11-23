// Coordinates are in half-resolution units. The host owns the 1920 by 1080 canvas.
export const noteY = 107;

export const light = {
  bg: '#f5eddb',
  ink: '#182e34',
  dim: '#4e6666',
  line: '#a9b9ac',
  paper: '#fff9e9',
  deep: '#173e43',
  accent: '#007c78',
  gold: '#936015',
  red: '#ac4033',
  wash: '#d4e3d8',
  rose: '#f2d6c6',
};
export const dark = {
  bg: '#102b34',
  ink: '#f7ecd4',
  dim: '#a3bab7',
  line: '#537474',
  paper: '#1c3b44',
  deep: '#09232c',
  accent: '#82d4b7',
  gold: '#f5c878',
  red: '#ffa38a',
  wash: '#294f52',
  rose: '#513c3c',
};

export function studio(ctx, clock, night, section) {
  const c = night ? dark : light;
  ctx.scale(2, 2);
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, 960, 540);
  const paint = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  function txt(value, x, y, size = 20, opt = {}) {
    const { color = c.ink, face = 'mono', align = 'left', width = 1000, weight = 400 } = opt;
    const family = { mono: 'Lesson Mono', serif: 'Lesson Serif', sans: 'Lesson Sans' }[face];
    ctx.font = weight + ' ' + size + 'px "' + family + '"';
    const measured = ctx.measureText(String(value)).width;
    if (measured > width) ctx.font = weight + ' ' + (size * width) / measured + 'px "' + family + '"';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    const text = String(value);
    if (face === 'mono' && text.includes('==')) {
      // Draw the two equals signs separately so beginners can distinguish comparison from assignment.
      const width = ctx.measureText(text).width;
      let left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
      ctx.textAlign = 'left';
      for (const part of text.split(/(?<==)(?==)/u)) {
        ctx.fillText(part, left, y);
        left += ctx.measureText(part).width;
      }
    } else {
      ctx.fillText(text, x, y);
    }
  }
  function line(x1, y1, x2, y2, color = c.line, w = 1, dashed = false) {
    ctx.beginPath();
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.lineWidth = w;
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function disk(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function wire(x1, y1, x2, y2, color = c.accent) {
    const d = (x2 - x1) * 0.53;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + d, y1, x2 - d, y2, x2, y2);
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9, y2 - 5);
    ctx.lineTo(x2 - 9, y2 + 5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    disk(x1, y1, 3.5, color);
  }
  function rect(x, y, w, h, fill = c.paper, edge = c.line) {
    paint(x, y, w, h, fill);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function label(value, x, y, opt = {}) {
    txt(value, x, y, 15, { face: 'sans', weight: 600, color: c.dim, ...opt });
  }
  function paper(x, y, w, h, tint = c.paper) {
    paint(x + 4, y + 5, w, h, night ? '#0d232a' : '#cbd0bc');
    rect(x, y, w, h, tint);
    for (let xx = x + 12; xx < x + w - 5; xx += 18) disk(xx, y + 9, 2.1, c.bg);
    line(x + 5, y + 18, x + w - 5, y + 18, c.line, 0.8, true);
  }
  function slip(row, x, y, w, h, show = true) {
    paper(x, y, w, h);
    label('REQUEST', x + 15, y + 38);
    txt(row.id, x + 15, y + 65, 30, { face: 'serif' });
    if (show) {
      line(x + 14, y + 86, x + w - 14, y + 86);
      txt(row.expected, x + 14, y + 108, 20, { width: w - 25 });
      txt(JSON.stringify(row.prediction), x + 14, y + 138, 19, { width: w - 25 });
    }
  }
  function footer(value, color = c.accent) {
    txt(value, 42, noteY, 20, { width: 874, color, face: 'sans', weight: 600 });
  }
  function code(lines, x, y, gap = 34, active = -1, width = 800, size = 20) {
    lines.forEach((s, i) => {
      if (i === active) {
        paint(x - 9, y + i * gap - 15, width + 12, 30, c.wash);
        paint(x - 12, y + i * gap - 15, 3, 30, c.accent);
      }
      txt(s, x, y + i * gap, size, { width, color: i === active ? c.ink : c.dim });
    });
  }
  function chip(value, x, y, w, color = c.ink, fill = c.paper, h = 46) {
    rect(x, y, w, h, fill);
    txt(value, x + w / 2, y + h / 2, 22, { color, align: 'center', width: w - 16 });
  }
  function cue(beat, phrase, span = 0.36, captionStart) {
    if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
    return clock.reveal(phrase, span, { captionStart });
  }
  label(section, 42, 28, { color: c.accent });
  line(42, 47, 918, 47);
  txt(clock.beat.chapterTitle, 40, 78, 36, { face: 'serif', width: 878 });
  return {
    ctx,
    c,
    b: clock.beat.beatIndex,
    clock,
    paint,
    txt,
    label,
    line,
    rect,
    disk,
    wire,
    paper,
    slip,
    footer,
    chip,
    code,
    cue,
  };
}
