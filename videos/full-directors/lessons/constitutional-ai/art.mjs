import { lessonFont } from '../../../lib/fonts.mjs';

export const C = {
  ink: '#152f33',
  night: '#102c31',
  deep: '#0a2025',
  steel: '#33545b',
  muted: '#536b68',
  fog: '#b8cdbe',
  mist: '#dce6da',
  paper: '#fff7df',
  cream: '#f4ebce',
  seam: '#c9bc96',
  gold: '#f1be57',
  brass: '#bc8730',
  teal: '#1a7266',
  mint: '#9cddbb',
  blue: '#2c527d',
  sky: '#a8cdee',
  brick: '#983e30',
  coral: '#ffa492',
  white: '#fffaf0',
};
export const lerp = (x, y, t) => x + (y - x) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export function cue(k, beat, phrase, seconds = 0) {
  const b = k.beat.beatIndex + 1;
  if (b !== beat) return Number(b > beat);
  return k.reveal(phrase, seconds);
}

export function cueAfter(k, beat, phrase, seconds = 0) {
  const b = k.beat.beatIndex + 1;
  if (b !== beat) return Number(b > beat);
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end + 1e-9;
  if (elapsed < 0) return 0;
  return seconds === 0 ? 1 : Math.min(1, elapsed / seconds);
}

export function toolsFor(ctx) {
  function rect(x, y, w, h, fill, r = 0) {
    ctx.fillStyle = fill;
    if (!r) {
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function poly(points, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  function line(x, y, x2, y2, color, width = 2) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function dot(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function label(value, x, y, size, color = C.ink, options = {}) {
    const { face = 'sans', weight = 400, align = 'left', width } = options;
    const str = String(value);
    ctx.font = lessonFont(size, face, weight);
    if (width && ctx.measureText(str).width > width)
      ctx.font = lessonFont((size * width) / ctx.measureText(str).width, face, weight);
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function mono(t, x, y, size = 31, color = C.muted, opts = {}) {
    label(t, x, y, size, color, { face: 'mono', ...opts });
  }
  function serif(t, x, y, size = 58, color = C.ink, opts = {}) {
    label(t, x, y, size, color, { face: 'serif', ...opts });
  }
  function at(x, y, scale, fn) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    try {
      fn();
    } finally {
      ctx.restore();
    }
  }
  function fade(opacity, fn) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= opacity;
    try {
      fn();
    } finally {
      ctx.restore();
    }
  }
  function sheet(x, y, w, h, fill = C.paper) {
    rect(x + 9, y + 12, w, h, '#091c2240', 5);
    rect(x, y, w, h, fill, 4);
  }
  function base(dark = false) {
    rect(0, 0, 1920, 1080, dark ? C.night : C.mist);
  }
  function title(kicker, heading, dark = false) {
    mono(kicker, 102, 104, 30, dark ? C.mint : C.teal);
    serif(heading, 98, 207, 76, dark ? C.paper : C.ink, { width: 1710 });
  }
  return { ctx, rect, poly, line, dot, label, mono, serif, at, fade, sheet, base, title };
}

// The cover turns around the spine. The rule is printed on the right-hand page.
export function book(a, x, y, scale, open) {
  a.at(x, y, scale, () => {
    const w = 385,
      h = 365,
      sp = 357;
    a.rect(sp + 7, 15, w + 18, h + 14, C.deep, 7);
    a.rect(sp - 3, 5, w + 19, h + 15, C.teal, 7);
    a.rect(sp, 4, w + 6, h + 5, C.seam, 3);
    for (let n = 0; n < 4; n++) a.line(sp + 8, h - n * 3, sp + w, h - n * 3, C.paper, 2);
    a.poly(
      [
        [sp, 0],
        [sp + w, -7],
        [sp + w, h - 13],
        [sp + 12, h - 7],
        [sp, h],
      ],
      C.paper,
    );
    a.mono('PUBLIC RUNBOOK', sp + 26, 52, 25, C.teal);
    a.line(sp + 26, 75, sp + w - 27, 75, C.brass, 3);
    a.serif('Release freeze', sp + 25, 142, 46);
    a.label('Documentation edits', sp + 27, 220, 30);
    a.label('may continue.', sp + 27, 267, 37, C.teal, { weight: 700 });
    a.mono('§ 04', sp + w - 88, h - 40, 22);
    const edge = sp + w * Math.cos(Math.PI * open);
    const rise = 50 * Math.sin(Math.PI * open);
    const pts = [
      [sp, 0],
      [edge, -10 - rise],
      [edge, h - 14 - rise],
      [sp, h],
    ];
    const closed = open < 0.5;
    a.poly(pts, closed ? C.teal : C.cream);
    if (closed) {
      a.fade(Math.max(0, 1 - open * 3), () => {
        a.serif('Runbook', sp + 32, 196, 67, C.paper);
        a.mono('PUBLIC EDITION', sp + 32, 245, 24, C.mint);
      });
    } else if (open > 0.78) {
      a.fade((open - 0.78) / 0.22, () => {
        a.mono('OPERATIONS', sp - 326, 68, 23, C.muted);
        for (let j = 0; j < 5; j++)
          a.line(sp - 326, 106 + j * 39, sp - 58 - (j % 2) * 58, 106 + j * 39, C.seam, 3);
        a.poly(
          [
            [sp - 79, 0],
            [sp - 44, 0],
            [sp - 44, 114],
            [sp - 61, 101],
            [sp - 79, 114],
          ],
          C.gold,
        );
      });
    }
    a.line(sp, 0, sp, h, C.brass, 5);
  });
}

// A sealed record case can show an allowed read without displaying incident contents.
export function recordCase(a, x, y, scale, opened = false) {
  a.at(x, y, scale, () => {
    a.rect(12, 18, 605, 314, C.deep, 19);
    a.rect(0, 0, 605, 314, C.steel, 19);
    a.rect(22, 26, 560, 262, C.deep, 9);
    if (opened) {
      a.rect(45, 40, 512, 233, C.paper, 4);
      a.mono('AUTHORIZED READ', 75, 98, 28, C.teal);
      a.serif('Incident timeline', 73, 177, 52);
      a.mono('INC-8821', 75, 230, 28, C.muted);
    } else {
      a.rect(37, 40, 529, 231, '#44656a', 9);
      a.rect(65, 68, 360, 158, C.cream, 4);
      a.mono('INC-8821', 87, 125, 31, C.blue);
      a.serif('Timeline', 84, 191, 53);
      a.rect(466, 82, 59, 97, C.gold, 23);
      a.rect(479, 96, 33, 68, C.steel, 16);
      a.rect(450, 134, 92, 77, C.brass, 9);
      a.dot(496, 165, 9, C.deep);
      a.rect(492, 165, 8, 18, C.deep);
    }
    for (const xx of [15, 589]) for (const yy of [15, 299]) a.dot(xx, yy, 4, C.fog);
  });
}
export function archiveHeader(a, who, destination) {
  a.mono('ENGINEERING  /  REQUEST LOG', 98, 95, 28, C.mint);
  a.mono(who + '   ·   ' + destination, 1820, 95, 28, C.fog, { align: 'right' });
  a.line(98, 127, 1822, 127, '#50706e');
}

export function strip(a, x, y, w, h, segments) {
  let offset = 0;
  for (const { v, color } of segments) {
    if (v > 0) a.rect(x + w * offset, y, w * v, h, color);
    offset += v;
  }
}
export function stamp(a, text, x, y, w, color = C.teal) {
  a.rect(x, y, w, 58, color, 5);
  a.mono(text, x + w / 2, y + 39, 28, C.white, { align: 'center', width: w - 32 });
}
