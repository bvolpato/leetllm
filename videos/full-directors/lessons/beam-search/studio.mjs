export const ink = '#193836',
  muted = '#506762',
  paper = '#f5ead5',
  brass = '#f0b250';
export const colors = ['#8acdb2', '#8fbddd', '#e9ac85', '#c3a0bb'];
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const fmt = (v, digits = 3) => Number(v.toFixed(digits)).toString().replace('-', '−');
export const pct = (v, digits = 1) => fmt(v * 100, digits) + '%';
export const lerp = (a, b, t) => a + (b - a) * t;

export function studio(g, clock) {
  const b = clock.beat.beatIndex + 1;
  const ramp = (beat, phrase, span = 0.65) => (b > beat ? 1 : b < beat ? 0 : clock.reveal(phrase, span));
  const on = (beat, phrase) => ramp(beat, phrase, 0) === 1;
  function rect(x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }
  function line(x, y, xx, yy, c = ink, w = 4, dashes = []) {
    g.save();
    g.setLineDash(dashes);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(xx, yy);
    g.strokeStyle = c;
    g.lineWidth = w;
    g.stroke();
    g.restore();
  }
  function circle(x, y, r, c) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  function poly(points, c) {
    g.beginPath();
    points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = c;
    g.fill();
  }
  function word(str, x, y, size = 49, c = ink, align = 'left', face = 'Serif', limit = 1720) {
    g.font = '400 ' + size + 'px "Lesson ' + face + '"';
    g.fillStyle = c;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillText(String(str), x, y, limit);
  }
  function label(str, x, y, size = 31, c = muted, align = 'left', limit = 1720) {
    word(str, x, y, size, c, align, 'Sans', limit);
  }
  function mono(str, x, y, size = 38, c = ink, align = 'left', limit = 1720) {
    word(str, x, y, size, c, align, 'Mono', limit);
  }
  function ground() {
    rect(0, 0, 1920, 1080, '#183936');
    const wash = g.createLinearGradient(0, 0, 1750, 1020);
    wash.addColorStop(0, '#fcf4e3');
    wash.addColorStop(1, '#e8dac0');
    rect(28, 22, 1864, 1030, wash);
    for (const x of [52, 1868])
      for (const y of [46, 1028]) {
        line(x - 9, y, x + 9, y, '#9c9984', 2);
        line(x, y - 9, x, y + 9, '#9c9984', 2);
      }
  }
  function head(kicker, title) {
    label(kicker, 105, 98, 30);
    word(title, 103, 191, 76);
    line(105, 256, 1815, 256, '#929b89', 2);
  }
  function tile(x, y, w, h, text, color = colors[0], size = 46) {
    rect(x + 6, y + 8, w, h, '#9d9985');
    rect(x, y, w, h, ink);
    rect(x + 4, y + 4, w - 8, h - 10, color);
    line(x + 12, y + 10, x + w - 12, y + 10, '#ffffff87', 2);
    word(text, x + w / 2, y + (h - 5) / 2, size, ink, 'center', 'Serif', w - 24);
  }
  function slot(x, y, w, h, text) {
    rect(x, y, w, h, '#d8d1b9');
    line(x, y, x + w, y, '#8d9484', 5);
    line(x, y + h, x + w, y + h, ink, 4);
    if (text) word(text, x + w / 2, y + h / 2, 46, muted, 'center', 'Serif', w - 24);
  }
  // One unit occupies the whole bed. Empty, removed mass leaves bare metal.
  function strip(values, names, x, y, w, h, opts = {}) {
    rect(x - 11, y - 12, w + 22, h + 30, '#747a68');
    rect(x - 5, y - 5, w + 10, h + 12, ink);
    rect(x, y, w, h, '#c8c6ad');
    for (const end of [x - 20, x + w + 4]) {
      rect(end, y - 17, 16, h + 41, '#7c7052');
      rect(end + 2, y - 15, 5, h + 37, '#d7bc85');
      circle(end + 8, y + 11, 3, ink);
      circle(end + 8, y + h - 10, 3, ink);
    }
    const palette = opts.colors ?? colors;
    let cursor = 0;
    values.forEach((p, i) => {
      const left = x + cursor * w,
        width = p * w;
      if (width > 0.01) {
        rect(left, y, width, h, palette[i % palette.length]);
        line(left, y, left, y + h, ink, 2);
        if (width > 95 && names?.[i])
          word(
            names[i],
            left + width / 2,
            y + h / 2,
            Math.min(56, h * 0.48),
            ink,
            'center',
            'Serif',
            width - 12,
          );
      }
      cursor += p;
    });
    for (let j = 0; j <= 20; j++)
      line(x + (w * j) / 20, y + h + 8, x + (w * j) / 20, y + h + (j % 5 ? 19 : 32), ink, j % 5 ? 2 : 3);
    if (opts.pin !== undefined) pin(x + opts.pin * w, y, h, opts.pinText ?? fmt(opts.pin, 2));
  }
  function pin(x, y, h, text) {
    line(x, y - 23, x, y + 13, '#8b422b', 6);
    line(x, y + h - 12, x, y + h + 20, '#8b422b', 5);
    poly(
      [
        [x - 14, y - 37],
        [x + 14, y - 37],
        [x, y - 16],
      ],
      '#8b422b',
    );
    mono(text, x, y - 62, 32, '#883f2c', 'center');
  }
  function row(names, x, y, w, h, cols = colors) {
    const pitch = w / names.length;
    names.forEach((name, i) => tile(x + i * pitch, y, pitch - 14, h, name, cols[i % cols.length]));
  }
  function key(x, y, k = 1) {
    g.save();
    g.translate(x, y);
    g.scale(k, k);
    circle(0, 0, 38, ink);
    circle(0, 0, 16, paper);
    rect(25, -9, 117, 18, ink);
    rect(99, 4, 15, 27, ink);
    rect(126, 4, 15, 19, ink);
    g.restore();
  }
  function guide(names, y) {
    key(137, y, 0.65);
    label('Retrieved guide', 270, y, 32);
    const pitch = 405;
    names.forEach((name, i) => {
      tile(
        555 + i * pitch,
        y - 45,
        345,
        90,
        name,
        name === 'revoke' ? colors[1] : name === 'deploy' ? brass : colors[i],
      );
      if (i < names.length - 1) word('›', 930 + i * pitch, y, 50, muted, 'center');
    });
  }
  function route(kind, x, y, size = 1, dim = false) {
    g.save();
    g.translate(x, y);
    g.scale(size, size);
    const a = dim ? '#95988b' : ink,
      fill = dim ? '#ceccbc' : '#a4c4ae';
    if (kind === 'door') {
      rect(-78, -98, 156, 200, a);
      rect(-66, -87, 131, 189, fill);
      rect(-52, -70, 99, 76, a);
      rect(-47, -65, 89, 66, fill);
      rect(-52, 20, 99, 63, a);
      rect(-47, 25, 89, 53, fill);
      circle(49, 10, 7, a);
    } else if (kind === 'book') {
      poly(
        [
          [-98, -63],
          [-12, -50],
          [0, -38],
          [12, -50],
          [98, -63],
          [98, 68],
          [14, 79],
          [0, 91],
          [-14, 79],
          [-98, 68],
        ],
        a,
      );
      poly(
        [
          [-88, -73],
          [-14, -58],
          [-4, -45],
          [-4, 71],
          [-18, 62],
          [-88, 49],
        ],
        fill,
      );
      poly(
        [
          [88, -73],
          [14, -58],
          [4, -45],
          [4, 71],
          [18, 62],
          [88, 49],
        ],
        fill,
      );
      for (let i = 0; i < 4; i++) {
        line(-72, -46 + i * 22, -22, -36 + i * 22, a, 2);
        line(22, -36 + i * 22, 72, -46 + i * 22, a, 2);
      }
    } else if (kind === 'bed') {
      rect(-104, -38, 13, 109, a);
      rect(89, -10, 13, 81, a);
      rect(-92, -7, 183, 57, fill);
      rect(-92, 38, 183, 12, a);
      rect(-84, -25, 54, 20, '#d8af7b');
      rect(-23, -17, 111, 53, a);
    } else {
      rect(-84, -88, 168, 184, a);
      rect(-73, -77, 146, 162, '#a9c8cc');
      poly(
        [
          [-73, 50],
          [-32, 11],
          [-5, 34],
          [25, -2],
          [73, 44],
          [73, 84],
          [-73, 84],
        ],
        fill,
      );
      rect(-4, -77, 8, 162, a);
      rect(-72, -3, 145, 8, a);
      rect(-95, 89, 190, 12, a);
    }
    g.restore();
  }
  return {
    g,
    b,
    clock,
    on,
    ramp,
    rect,
    line,
    circle,
    poly,
    word,
    label,
    mono,
    ground,
    head,
    tile,
    slot,
    strip,
    pin,
    row,
    guide,
    key,
    route,
  };
}
