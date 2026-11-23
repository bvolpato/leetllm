// Draw all coordinates in the public host's 1920 by 1080 picture.
export const C = {
  paper: '#f4eddd',
  light: '#fffbef',
  ink: '#183632',
  muted: '#52675f',
  grid: '#bfc4af',
  navy: '#244e72',
  blue: '#326c95',
  pale: '#d8e7e6',
  green: '#206450',
  mint: '#cde3cf',
  rust: '#a44332',
  blush: '#f3d9ca',
  gold: '#a06e1f',
  yellow: '#f3d899',
  white: '#fffdf4',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function art(ctx, clock) {
  const b = clock.beat.beatIndex;
  const cue = (i, phrase, span = 0.5) => (b === i ? clock.reveal(phrase, span) : Number(b > i));
  const on = (i, phrase) => cue(i, phrase, 0) === 1;
  const through = (i, startPhrase, endPhrase = startPhrase) => {
    if (b !== i) return Number(b > i);
    const { start } = clock.wordCue(startPhrase);
    const { end } = clock.wordCue(endPhrase);
    return clock.reveal(startPhrase, end - start, {
      captionStart: startPhrase === endPhrase ? false : endPhrase,
    });
  };
  const after = (i, phrase) => through(i, phrase) === 1;
  const done = (i) => b > i || (b === i && clock.elapsed >= clock.speechDuration);
  function rect(x, y, w, h, color, r = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function line(x, y, X, Y, color = C.grid, width = 3, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(X, Y);
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function poly(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  function text(value, x, y, size = 38, color = C.ink, opts = {}) {
    ctx.save();
    ctx.font = (opts.bold ? 700 : 400) + ' ' + size + 'px "Lesson ' + (opts.face || 'Sans') + '"';
    ctx.fillStyle = color;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(value), x, y, opts.max || 1850);
    ctx.restore();
  }
  const mono = (s, x, y, n = 34, c = C.navy, max = 1700) =>
    text(s, x, y, n, c, { face: 'Mono', max });
  const title = (s, x = 100, y = 185, max = 1720) =>
    text(s, x, y, 69, C.ink, { face: 'Serif', max });
  const tag = (s, x, y, color = C.muted) => text(s.toUpperCase(), x, y, 27, color, { bold: true });
  const middle = (s, x, y, n = 35, c = C.ink, max = 900) =>
    text(s, x, y, n, c, { align: 'center', max });
  function arrow(x, y, X, Y, color = C.ink, width = 5) {
    const a = Math.atan2(Y - y, X - x),
      adj = 18;
    line(x, y, X - adj * Math.cos(a), Y - adj * Math.sin(a), color, width);
    poly(
      [
        [X, Y],
        [X - 22 * Math.cos(a - 0.48), Y - 22 * Math.sin(a - 0.48)],
        [X - 22 * Math.cos(a + 0.48), Y - 22 * Math.sin(a + 0.48)],
      ],
      color,
    );
  }
  function key(x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineWidth = 12;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.stroke();
    poly(
      [
        [18, -6],
        [100, -6],
        [100, 16],
        [87, 16],
        [87, 6],
        [72, 6],
        [72, 17],
        [58, 17],
        [58, 6],
        [18, 6],
      ],
      color,
    );
    ctx.restore();
  }
  function calendar(x, y, s = 1, days = 30) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    rect(12, 20, 490, 500, '#c3bfae', 14);
    rect(5, 10, 490, 500, '#e2d9c4', 14);
    rect(0, 0, 490, 500, C.light, 14);
    rect(0, 0, 490, 92, C.navy, [14, 14, 0, 0]);
    for (const cx of [82, 408]) {
      dot(cx, 11, 14, C.ink);
      rect(cx - 6, -22, 12, 40, '#8d9a8e', 6);
    }
    text('AUDIT LOG', 32, 60, 32, C.white, { bold: true });
    key(382, 48, 0.63, C.white);
    text(String(days), 24, 253, 178, C.navy, { face: 'Serif' });
    text('days', 272, 245, 70, C.navy, { face: 'Serif' });
    for (let j = 0; j < 30; j++) {
      const xx = 33 + (j % 10) * 43,
        yy = 291 + Math.floor(j / 10) * 44;
      rect(xx, yy, 35, 34, C.pale, 3);
      if (s >= 0.96) middle(j + 1, xx + 17.5, yy + 24, 20, C.navy, 33);
      else line(xx + 11, yy + 17, xx + 23, yy + 17, C.blue, 3);
    }
    line(32, 438, 455, 438, C.grid, 2);
    text('Revoked key visible in log', 32, 478, 29, C.ink);
    ctx.restore();
  }
  function mark(x, y, pass, word, width = 345) {
    const color = pass ? C.green : C.rust;
    rect(x, y - 41, width, 62, pass ? C.mint : C.blush, 8);
    text(word, x + 18, y + 4, 33, color, { bold: true, max: width - 36 });
  }
  function paper(x, y, w, h, color = C.light) {
    rect(x + 7, y + 10, w, h, '#cec8b8', 6);
    rect(x, y, w, h, color, 6);
  }
  function book(x, y, s = 1, label = 'Current policy') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    rect(10, 28, 345, 200, '#d1c4a5', 9);
    rect(5, 12, 345, 200, C.light, 8);
    rect(0, 0, 345, 202, C.green, 8);
    rect(17, 0, 11, 201, '#487766');
    line(41, 18, 325, 18, '#90ad8f', 2);
    line(41, 182, 325, 182, '#90ad8f', 2);
    key(74, 66, 0.6, C.yellow);
    text(label, 45, 145, 40, C.white, { face: 'Serif', max: 280 });
    ctx.restore();
  }
  function base(label) {
    rect(0, 0, 1920, 1080, C.paper);
    const g = ctx.createLinearGradient(0, 0, 1920, 1080);
    g.addColorStop(0, '#fff8e8');
    g.addColorStop(0.6, C.paper);
    g.addColorStop(1, '#e5e6d7');
    rect(0, 0, 1920, 1080, g);
    if (label) {
      line(100, 86, 150, 86, C.green, 6);
      tag(label, 173, 95);
    }
  }
  return {
    ctx,
    b,
    cue,
    on,
    through,
    after,
    done,
    rect,
    line,
    dot,
    poly,
    text,
    mono,
    title,
    tag,
    middle,
    arrow,
    key,
    calendar,
    mark,
    paper,
    book,
    base,
  };
}
