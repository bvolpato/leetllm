export const C = {
  paper: '#f6f1e5',
  ink: '#182e33',
  muted: '#48616a',
  line: '#beccc6',
  white: '#fffdf6',
  sea: '#00695f',
  mint: '#d5e9df',
  red: '#963d2b',
  rose: '#f3dfd2',
  gold: '#ffc14a',
  blue: '#26528a',
  sky: '#dce7f0',
  night: '#183238',
  mist: '#aec8c4',
};

export class Scene {
  constructor(ctx, clock) {
    this.c = ctx;
    this.clock = clock;
    this.b = clock.beat.beatIndex + 1;
    this.box(0, 0, 1920, 1080, C.paper);
  }
  cue(beat, phrase, duration = 0) {
    if (this.b !== beat) return Number(this.b > beat);
    return this.clock.reveal(phrase, duration);
  }
  after(beat, phrase, duration = 0) {
    if (this.b !== beat) return Number(this.b > beat);
    this.clock.reveal(phrase, 0, { captionStart: phrase });
    const elapsed = this.clock.elapsed - this.clock.wordCue(phrase).end + 1e-9;
    if (elapsed < 0) return 0;
    return duration ? Math.min(1, elapsed / duration) : 1;
  }
  box(x, y, w, h, color, border, stroke = 3) {
    const c = this.c;
    if (color) {
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
    }
    if (border) {
      c.strokeStyle = border;
      c.lineWidth = stroke;
      c.strokeRect(x, y, w, h);
    }
  }
  path(points, fill, stroke, width = 3) {
    const c = this.c;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (fill) {
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.lineWidth = width;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }
  line(x1, y1, x2, y2, color = C.line, w = 3) {
    this.path(
      [
        [x1, y1],
        [x2, y2],
      ],
      null,
      color,
      w,
    );
  }
  dot(x, y, r, color) {
    const c = this.c;
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fillStyle = color;
    c.fill();
  }
  text(str, x, y, size = 38, color = C.ink, family = 'Sans', max = undefined) {
    const c = this.c;
    c.font = '400 ' + size + 'px "Lesson ' + family + '"';
    c.fillStyle = color;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillText(String(str), x, y, max);
  }
  title(kicker, title) {
    this.text(kicker.toUpperCase(), 80, 70, 29, C.sea, 'Mono');
    this.text(title, 80, 160, 72, C.ink, 'Serif', 1760);
  }
  note(x, y, tag, value, color = C.sea, max = 810) {
    this.text(tag, x, y, 30, C.muted);
    this.text(value, x, y + 73, 57, color, 'Serif', max);
  }
  band(x, y, w, label, color = C.sea) {
    this.box(x, y, w, 76, color);
    this.text(label, x + 23, y + 52, 39, C.white, 'Sans', w - 46);
  }
  table(x, y, widths, headers, rows, { step = 88, size = 36, colors = [] } = {}) {
    let dx = x;
    headers.forEach((v, i) => {
      this.text(v, dx, y, 29, C.muted, 'Sans', widths[i] - 16);
      dx += widths[i];
    });
    const w = widths.reduce((a, b) => a + b);
    rows.forEach((row, j) => {
      const top = y + 24 + j * step;
      this.line(x, top, x + w - 12, top);
      let dx = x;
      row.forEach((v, i) => {
        this.text(
          v,
          dx,
          top + step * 0.68,
          size,
          colors[j] ?? C.ink,
          i === 0 ? 'Sans' : 'Mono',
          widths[i] - 16,
        );
        dx += widths[i];
      });
    });
  }
  gauge(x, y, w, value, limit, label, detail) {
    this.text(label, x, y, 30, C.muted);
    this.text(value.toFixed(2), x, y + 70, 58, C.ink, 'Mono');
    const base = y + 103;
    this.box(x, base, w, 10, C.line);
    this.box(x, base, value * w, 10, C.sea);
    this.dot(x + value * w, base + 5, 11, C.sea);
    this.line(x + limit * w, base - 13, x + limit * w, base + 27, C.red, 4);
    this.text(detail, x, base + 69, 30, C.red, 'Mono');
  }
}

// All source views use one 512 by 256 camera plane. A crop samples a window of that plane.
export const camera = { width: 512, height: 256, center: 144, top: 16, size: 224, tear: [67, 65] };

function peeledCarton(s) {
  s.path(
    [
      [55, 182],
      [158, 113],
      [451, 72],
      [481, 156],
      [360, 211],
    ],
    '#798881',
  );
  s.path(
    [
      [43, 103],
      [155, 45],
      [452, 57],
      [348, 119],
    ],
    '#d9b77d',
  );
  s.path(
    [
      [43, 103],
      [348, 119],
      [348, 201],
      [47, 180],
    ],
    '#dfbd85',
  );
  s.path(
    [
      [348, 119],
      [452, 57],
      [450, 145],
      [348, 201],
    ],
    '#a27b4a',
  );
  s.line(97, 75, 399, 88, '#9d784e', 2);

  s.path(
    [
      [67, 115],
      [124, 118],
      [125, 160],
      [68, 156],
    ],
    '#fff1d3',
  );
  for (let i = 0; i < 13; i++) {
    const x = 74 + i * 3.4;
    s.line(x, 123 + i * 0.2, x, 143 + i * 0.2, '#423d31', i % 3 ? 1.2 : 2.5);
  }
  s.line(75, 149, 108, 151, '#9d8d72', 1.5);

  // The outer paper curls down from a horizontal tear on the right of the front panel.
  s.path(
    [
      [209, 139],
      [228, 136],
      [240, 138],
      [254, 134],
      [274, 137],
      [291, 133],
      [310, 136],
      [323, 133],
      [307, 153],
      [271, 157],
      [235, 149],
    ],
    '#654932',
  );
  for (let i = 0; i < 8; i++) {
    const x = 241 + i * 9;
    s.line(x, 140, x - 3, 148, '#b4986e', 2);
  }
  s.path(
    [
      [209, 139],
      [238, 146],
      [268, 148],
      [291, 146],
      [309, 143],
      [323, 133],
      [311, 155],
      [289, 167],
      [275, 163],
      [260, 166],
      [236, 153],
    ],
    '#bf935f',
    '#9e784e',
    1.3,
  );
  s.path(
    [
      [212, 140],
      [239, 147],
      [269, 149],
      [292, 147],
      [309, 144],
      [320, 136],
    ],
    null,
    '#f1d6a4',
    2.4,
  );
}

export function exposure(s, x, y, w, h, kind = 'mailer', options = {}) {
  const c = s.c,
    { crop, turn = 0, mark = false, dim = false } = options;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(turn);
  c.translate(-w / 2, -h / 2);
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
  const v = crop ?? [0, 0, 512, 256];
  c.scale(w / v[2], h / v[3]);
  c.translate(-v[0], -v[1]);
  const dark = kind === 'dark',
    empty = kind === 'empty';
  const grad = c.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, dark ? '#152025' : '#849c9d');
  grad.addColorStop(1, dark ? '#29343a' : '#b8c7bc');
  s.box(0, 0, 512, 256, grad);
  for (let i = -1; i < 6; i++) {
    s.line(-20, i * 62 + 11, 530, i * 62 - 14, dark ? '#293438' : '#91a4a1', 1.6);
  }
  if (!empty) {
    if (kind === 'mailer') {
      s.path(
        [
          [38, 57],
          [437, 26],
          [488, 213],
          [84, 243],
        ],
        '#76908b',
      );
      s.path(
        [
          [28, 43],
          [431, 17],
          [483, 202],
          [79, 236],
        ],
        '#e2b880',
        '#815732',
        1.6,
      );
      s.path(
        [
          [28, 43],
          [431, 17],
          [413, 64],
          [66, 89],
        ],
        '#b98954',
      );
      s.path(
        [
          [28, 43],
          [66, 89],
          [81, 227],
        ],
        '#d6a369',
      );
      s.line(80, 226, 477, 194, '#976b42', 1);
      for (let i = 0; i < 58; i++) {
        const xx = 78 + ((i * 79) % 326),
          yy = 102 + ((i * 37) % 77);
        s.line(xx, yy, xx + 4 + (i % 4), yy - 0.5, '#d5a873', 0.8);
      }
      s.path(
        [
          [305, 82],
          [402, 74],
          [420, 128],
          [320, 137],
        ],
        '#fff3d3',
      );
      for (let i = 0; i < 22; i++) {
        const xx = 316 + i * 3.7;
        s.line(xx, 90 - i * 0.29, xx + 7, 117 - i * 0.29, '#3f453d', i % 3 === 0 ? 2.7 : 1.1);
      }
      s.path(
        [
          [38, 44],
          [58, 59],
          [72, 52],
          [83, 71],
          [97, 65],
          [114, 85],
          [120, 83],
          [98, 59],
          [84, 62],
          [75, 44],
          [57, 52],
        ],
        '#583a2e',
      );
      s.path(
        [
          [40, 46],
          [58, 61],
          [72, 54],
          [82, 73],
          [96, 67],
          [115, 87],
        ],
        null,
        '#f7d79e',
        2.2,
      );
      if (mark) {
        s.path(
          [
            [21, 63],
            [19, 32],
            [51, 30],
          ],
          null,
          C.gold,
          4,
        );
        s.path(
          [
            [105, 98],
            [132, 96],
            [131, 71],
          ],
          null,
          C.gold,
          4,
        );
      }
    } else if (kind === 'peeled') {
      peeledCarton(s);
    } else {
      const crushed = kind === 'crushed';
      s.path(
        [
          [63, 91],
          [163, 37],
          [425, 46],
          [465, 152],
          [335, 222],
          [67, 204],
        ],
        dark ? '#182124' : '#778781',
      );
      s.path(
        [
          [54, 83],
          [154, 32],
          [427, 43],
          [323, 102],
        ],
        dark ? '#424044' : '#c49a66',
      );
      s.path(
        [
          [54, 83],
          [323, 102],
          [323, 215],
          [59, 191],
        ],
        dark ? '#33383b' : '#cfa572',
      );
      s.path(
        [
          [323, 102],
          [427, 43],
          [429, 155],
          [323, 215],
        ],
        dark ? '#242b30' : '#9b774f',
      );
      s.path(
        [
          [184, 92],
          [211, 94],
          [315, 38],
          [283, 37],
        ],
        dark ? '#484749' : '#dbbd88',
      );
      s.path(
        [
          [184, 92],
          [211, 94],
          [212, 205],
          [184, 202],
        ],
        dark ? '#414345' : '#dfc393',
      );
      if (!dark) {
        s.path(
          [
            [240, 136],
            [294, 140],
            [294, 162],
            [240, 157],
          ],
          '#f3e5c9',
        );
        for (let i = 0; i < 15; i++)
          s.line(
            244 + i * 3,
            140 + i * 0.21,
            244 + i * 3,
            153 + i * 0.21,
            '#343b34',
            i % 3 ? 1 : 1.6,
          );
      }
      if (kind === 'punctured') {
        s.path(
          [
            [110, 138],
            [118, 131],
            [119, 123],
            [129, 129],
            [138, 126],
            [136, 136],
            [144, 144],
            [131, 142],
            [124, 152],
            [120, 143],
          ],
          '#504337',
          '#b18a61',
          2,
        );
      }
      if (crushed) {
        s.path(
          [
            [54, 83],
            [95, 96],
            [73, 110],
            [95, 117],
            [61, 139],
          ],
          '#a17951',
          '#775a42',
          1.8,
        );
        s.path(
          [
            [77, 111],
            [115, 132],
            [134, 137],
          ],
          null,
          '#937149',
          2,
        );
      }
    }
    if (dim) s.box(0, 0, 512, 256, 'rgba(15,21,23,0.80)');
  }
  c.restore();
}

export function cameraPrint(s, x, y, w, h, kind, id, options = {}) {
  s.box(x - 8, y - 8, w + 16, h + 16, C.white, C.line, 2);
  exposure(s, x, y, w, h, kind, options);
  if (id) s.text(id, x, y + h + 51, 34, C.muted, 'Mono', w);
}
