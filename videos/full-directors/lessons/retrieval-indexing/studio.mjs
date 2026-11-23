export const paper = {
  bg: '#eee3c8',
  ink: '#1e352e',
  soft: '#52675b',
  rule: '#b3b4a0',
  tint: '#e2d7b9',
  field: '#fbf4de',
  accent: '#a73b24',
  blue: '#285f83',
  green: '#23684e',
  gold: '#895b13',
};
export const night = {
  bg: '#13252b',
  ink: '#f3edd9',
  soft: '#bac8bd',
  rule: '#496168',
  tint: '#243a40',
  field: '#1c3037',
  accent: '#ffb282',
  blue: '#9ecaf4',
  green: '#99d6b7',
  gold: '#f1ce7c',
};
export const atlas = {
  bg: '#f0efdc',
  ink: '#163934',
  soft: '#506b60',
  rule: '#adbeaa',
  tint: '#d6e3cf',
  field: '#fcf9e9',
  accent: '#a0432f',
  blue: '#285b80',
  green: '#226b55',
  gold: '#84611f',
};
export const idNames = {
  d1: 'Rotation guide',
  d2: 'Credential guide',
  d3: 'Display name',
  d4: 'Quota page',
};
export function brush(ctx, k, palette) {
  const c = palette,
    beat = k.beat.beatIndex + 1;
  const p = {
    ctx,
    c,
    beat,
    at(b, phrase, seconds = 0, options) {
      if (beat !== b) return Number(beat > b);
      return k.reveal(phrase, seconds, options);
    },
    after(b, phrase) {
      if (beat !== b) return beat > b;
      return k.elapsed + 1e-9 >= k.wordCue(phrase).end;
    },
    rect(x, y, w, h, color = c.field) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },
    line(x, y, xx, yy, color = c.rule, width = 3) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(xx, yy);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    },
    circle(x, y, r, color) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    text(s, x, y, size = 42, color = c.ink, font = 'Sans', align = 'left', weight = 400) {
      ctx.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(String(s), x, y);
    },
    mono(s, x, y, size = 38, color = c.ink, align = 'left') {
      p.text(s, x, y, size, color, 'Mono', align);
    },
    title(s, sub) {
      if (sub) p.text(sub, 102, 98, 30, c.soft, 'Mono');
      p.text(s, 100, sub ? 197 : 142, 76, c.ink, 'Serif');
    },
    tag(id, x, y, w = 135, active = true) {
      p.rect(x, y, w, 70, active ? c.green : c.tint);
      p.mono(id, x + w / 2, y + 48, 36, active ? c.bg : c.soft, 'center');
    },
    arrow(x, y, xx, yy, color = c.accent, w = 6) {
      p.line(x, y, xx, yy, color, w);
      const a = Math.atan2(yy - y, xx - x);
      for (const sign of [-1, 1])
        p.line(
          xx,
          yy,
          xx - 23 * Math.cos(a + sign * 0.46),
          yy - 23 * Math.sin(a + sign * 0.46),
          color,
          w,
        );
    },
    strip(x, y, w, h, color = c.field) {
      p.rect(x + 5, y + 7, w, h, c.tint);
      p.rect(x, y, w, h, color);
    },
  };
  p.rect(0, 0, 1920, 1080, c.bg);
  return p;
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const neat = (v, n = 3) => v.toFixed(n).replace(/\.?0+$/, '') || '0';
