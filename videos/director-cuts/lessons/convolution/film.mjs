import assert from 'node:assert/strict';
import { correlate } from '../../../films/convolution/arithmetic.mjs';
import { KERNEL } from '../../../films/convolution/fixtures.mjs';

const beats = [
  {
    id: 'erase-one-pixel',
    say: 'Watch the white part of the pointer. One pixel comes out. Two little strokes appear over on the edge map. Why is there a gap between them?',
    hold: 1,
  },
  {
    id: 'nine-pixels',
    say: 'Come in close on the hole. The window is three pixels wide and three high. White counts as one. The dark square counts as zero.',
    hold: 0.65,
  },
  {
    id: 'the-filter',
    say: 'Our convolution filter uses the same weights in every row of the window. Subtract the pixel on the left, skip the middle, and add the pixel on the right. Then add up the three rows.',
    hold: 0.65,
  },
  {
    id: 'in-the-gap',
    say: 'Right over the hole, both outside columns are still white. Three on the right minus three on the left gives zero. That goes on the map at the center of the window.',
    hold: 0.9,
  },
  {
    id: 'one-pixel-left',
    say: 'Slide the same window one pixel left. Follow the dark square. It’s in the right column now. Two minus three gives minus one. There’s our blue mark, one square left of the hole.',
    hold: 0.75,
  },
  {
    id: 'across-the-hole',
    say: 'Now slide across to the other side of the hole. Which column is short this time?',
    hold: 1.8,
  },
  {
    id: 'one-pixel-right',
    say: 'The left column. Three on the right minus two on the left gives plus one. That’s the orange mark.',
    hold: 0.8,
  },
  {
    id: 'three-high',
    say: 'Move up one row. The hole sits at the bottom of the window. Move one row below where we started. Now it’s at the top. One more step and it’s outside. The orange stroke ends here.',
    hold: 0.95,
  },
  {
    id: 'the-missing-pixel',
    say: 'Pull back to the whole pointer. Put the white pixel back. Both strokes disappear. Erase it again and the same six squares light up. Right between them is the pixel we took out.',
    hold: 2.25,
  },
];

// A one-bit pointer. A map cell is displayed at the center of its valid 3 by 3 window.
const silhouette = [
  '#',
  '##',
  '###',
  '####',
  '#####',
  '######',
  '#######',
  '########',
  '#########',
  '##########',
  '###########',
  '############',
  '#############',
  '##############',
  '###############',
  '##########',
  '######.###',
  '#####..####',
  '####....###',
  '###.....####',
  '##.......###',
  '.........##',
];
const width = 28;
const height = 27;
const pointer = Array.from({ length: height }, (_, y) =>
  Array.from({ length: width }, (_, x) => Number(silhouette[y - 2]?.[x - 6] === '#')),
);
const hole = { x: 11, y: 12 };
const edited = pointer.map(row => [...row]);
edited[hole.y][hole.x] = 0;
const originalMap = correlate(pointer, KERNEL);
const edgeMap = correlate(edited, KERNEL);

function columnsAt(x, y) {
  const totals = [0, 0, 0];
  for (let dy = -1; dy <= 1; dy++) {
    for (let col = 0; col < 3; col++) totals[col] += edited[y + dy][x - 1 + col];
  }
  return totals;
}

function check() {
  assert.deepEqual(KERNEL, Array.from({ length: 3 }, () => [-1, 0, 1]));
  assert.equal(pointer[hole.y][hole.x], 1);
  assert.equal(edited[hole.y][hole.x], 0);
  assert.deepEqual(columnsAt(hole.x, hole.y), [3, 2, 3]);
  assert.deepEqual(columnsAt(hole.x + 1, hole.y + 2), [3, 3, 3]);
  const changes = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const before = originalMap[y - 1][x - 1];
      const after = edgeMap[y - 1][x - 1];
      const [left, , right] = columnsAt(x, y);
      assert.equal(after, right - left);
      if (before !== after) changes.push([x - hole.x, y - hole.y, before, after]);
    }
  }
  assert.deepEqual(changes, [-1, 0, 1].flatMap(dy => [[-1, dy, 0, -1], [1, dy, 0, 1]]));
}

const ink = '#28253c';
const dark = '#242537';
const white = '#fff5dc';
const chrome = '#e6deed';
const focus = '#ffee77';
const cold = ['#65b3ec', '#59bffd', '#95daff'];
const warm = ['#ff9861', '#ffae66', '#ffcd79'];
const panels = [
  { x: 113, y: 207, w: 815, h: 620 },
  { x: 992, y: 207, w: 815, h: 620 },
];
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const signed = n => n === 0 ? '0' : n > 0 ? '+' + n : '−' + Math.abs(n);
const colorAt = n => n === 0 ? dark : (n < 0 ? cold : warm)[Math.abs(n) - 1];

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function outline(ctx, x, y, w, h, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, w, h);
}

function text(ctx, value, x, y, size, color, { align = 'left', mono = false, weight = 500 } = {}) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + (mono ? 'Mono' : 'Sans') + '"';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function desktop(ctx) {
  const light = ctx.createLinearGradient(0, 0, 1880, 1080);
  light.addColorStop(0, '#c2b3ed');
  light.addColorStop(0.54, '#989adf');
  light.addColorStop(1, '#858cce');
  box(ctx, 0, 0, 1920, 1080, light);
  // A two-pixel desktop weave is visible around the document.
  ctx.fillStyle = 'rgba(54,43,100,0.24)';
  for (let y = 0; y < 1080; y += 12) {
    for (let x = (y % 24 ? 6 : 0); x < 1920; x += 12) {
      if (y < 58 || y > 929 || x < 80 || x > 1841) ctx.fillRect(x, y, 2, 2);
    }
  }
  box(ctx, 95, 75, 1757, 862, '#615980');
  box(ctx, 82, 62, 1757, 862, ink);
  box(ctx, 87, 67, 1747, 852, chrome);
  box(ctx, 87, 67, 1747, 5, '#fff7fa');
  box(ctx, 87, 72, 5, 842, '#fff7fa');
  box(ctx, 87, 914, 1747, 5, '#a597bc');
  box(ctx, 1829, 72, 5, 842, '#a597bc');
  for (let y = 83; y <= 122; y += 9) {
    box(ctx, 112, y, 646, 3, '#847a99');
    box(ctx, 112, y + 3, 646, 2, '#faf3f6');
    box(ctx, 1162, y, 646, 3, '#847a99');
    box(ctx, 1162, y + 3, 646, 2, '#faf3f6');
  }
  text(ctx, 'pointer.bmp', 960, 104, 46, ink, { align: 'center', mono: true });
  box(ctx, 89, 136, 1741, 4, '#797185');
  box(ctx, 89, 140, 1741, 3, '#fffbff');
  text(ctx, 'Bitmap', panels[0].x + 2, 173, 40, ink, { weight: 700 });
  text(ctx, 'Edge map', panels[1].x + 2, 173, 40, ink, { weight: 700 });
  for (const p of panels) outline(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, '#756e83', 4);
}

function scene(clock) {
  function cue(i, phrase, span) {
    if (clock.index < i) return 0;
    if (clock.index > i) return 1;
    return smooth(clock.reveal(phrase, span));
  }
  const down = clock.index === 0 ? smooth(clock.elapsed / 0.7) : 1;
  const lift = clock.index === 0 ? smooth((clock.elapsed - 0.82) / 0.68) : 1;
  const close = cue(1, 'Come in close', 1.5);
  const back = cue(8, 'Pull back', 1.75);
  const undo = cue(8, 'Put the white pixel back', 0.18);
  const redo = cue(8, 'Erase it again', 0.18);
  const left = cue(4, 'Slide the same window', 0.72);
  const right = cue(5, 'Now slide across', 1.1);
  const up = cue(7, 'Move up one row', 0.65);
  const below = cue(7, 'Move one row below', 0.95);
  const past = cue(7, 'One more step', 0.65);
  const dx = -left + 2 * right;
  const dy = -up + 2 * below + past;
  const zoom = close * (1 - back);
  const equation = clock.index === 3 ? cue(3, 'Three on the right', 0.3)
    : clock.index === 4 ? cue(4, 'Two minus three', 0.3)
    : clock.index === 6 ? cue(6, 'Three on the right', 0.3)
    : clock.index === 7 ? 1 : 0;
  return {
    down, lift, dx, dy, zoom, back,
    equation: [left, right, up, below, past].every(t => t === 0 || t === 1) ? equation : 0,
    punched: down === 1 && (undo < 1 || redo === 1),
    register: (down === 1 ? 1 - close : 0) + back,
    select: close * (1 - back),
    weights: cue(2, 'same weights', 0.5),
    // Weight labels enter in the order the narrator points to their columns.
    signs: [cue(2, 'Subtract the pixel', 0.4), cue(2, 'skip the middle', 0.4), cue(2, 'add the pixel', 0.4)],
  };
}

function camera(p, zoom, dy) {
  const pitch = mix(26, 100, zoom);
  return {
    pitch,
    x: p.x + p.w / 2 - mix(13.25, hole.x + 0.5, zoom) * pitch,
    y: p.y + p.h / 2 - mix(13.0, hole.y + 0.5 + 0.35 * dy, zoom) * pitch,
  };
}

function pixelField(ctx, p, camera, values, isMap, zoom) {
  const { x, y, pitch } = camera;
  box(ctx, p.x, p.y, p.w, p.h, dark);
  for (const [r, row] of values.entries()) {
    for (const [c, value] of row.entries()) {
      if (!value) continue;
      const col = c + Number(isMap);
      const line = r + Number(isMap);
      const px = x + col * pitch, py = y + line * pitch;
      box(ctx, px, py, pitch + 0.5, pitch + 0.5, isMap ? colorAt(value) : white);
      if (isMap) {
        outline(ctx, px + 1, py + 1, pitch - 2, pitch - 2, 'rgba(36,37,55,0.46)', mix(1.5, 3.8, zoom));
      }
    }
  }
  // Fine raster lines belong to the pixels and scale with the loupe.
  ctx.beginPath();
  const startX = (x - p.x) % pitch;
  const startY = (y - p.y) % pitch;
  for (let i = p.x + startX - pitch; i <= p.x + p.w; i += pitch) {
    ctx.moveTo(i, p.y);
    ctx.lineTo(i, p.y + p.h);
  }
  for (let j = p.y + startY - pitch; j <= p.y + p.h; j += pitch) {
    ctx.moveTo(p.x, j);
    ctx.lineTo(p.x + p.w, j);
  }
  ctx.lineWidth = mix(0.9, 2.2, zoom);
  ctx.strokeStyle = 'rgba(115,113,144,' + mix(0.22, 0.56, zoom) + ')';
  ctx.stroke();
}

const eraser = [
  '        ####',
  '       #hhhh#',
  '      #hppppp#',
  '     #hppppppp#',
  '    #hppppppppp#',
  '   #wwhppppppp#s',
  '  #wwwwhppppp#ss',
  ' #wwwwwwhppp#ss',
  '#wwwwwwwwhp#ss',
  '#lwwwwwwww#ss',
  ' #llwwwww#ss',
  '  #llwww#ss',
  '   #####ss',
];
const eraserInks = { '#': ink, h: '#ffcfb0', p: '#fd947b', w: '#efe5e1', l: '#b0a8c5', s: '#65576f' };

function erase(ctx, cam, s) {
  if (s.lift >= 1) return;
  const step = 7;
  const approach = 1 - s.down;
  const x = cam.x + (hole.x + 0.5) * cam.pitch - 4.5 * step + 74 * approach + 117 * s.lift;
  const y = cam.y + (hole.y + 0.5) * cam.pitch - 12.5 * step - 66 * approach - 96 * s.lift;
  ctx.save();
  ctx.globalAlpha = 1 - s.lift;
  eraser.forEach((row, r) => [...row].forEach((color, c) => {
    if (color !== ' ') box(ctx, x + c * step, y + r * step, step + 0.2, step + 0.2, eraserInks[color]);
  }));
  ctx.restore();
}

function registration(ctx, cam, s, isMap) {
  if (s.register <= 0) return;
  const cx = cam.x + (hole.x + 0.5) * cam.pitch;
  const cy = cam.y + (hole.y + 0.5) * cam.pitch;
  const radius = (isMap ? 1.92 : 0.95) * cam.pitch;
  const tick = 0.48 * cam.pitch;
  ctx.save();
  ctx.globalAlpha = s.register * 0.85;
  ctx.beginPath();
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      const x = cx + a * radius;
      const y = cy + b * radius;
      ctx.moveTo(x - a * tick, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - b * tick);
    }
  }
  ctx.strokeStyle = isMap ? '#f5e8ff' : '#514a60';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function selection(ctx, cam, s, isMap) {
  if (s.select <= 0) return;
  const { pitch } = cam;
  const cx = cam.x + (hole.x + 0.5 + s.dx) * pitch;
  const cy = cam.y + (hole.y + 0.5 + s.dy) * pitch;
  const extent = (isMap ? 1 : 3) * pitch;
  const x = cx - extent / 2;
  const y = cy - extent / 2;
  ctx.save();
  ctx.globalAlpha = s.select;
  // Keep the six changed map cells visible while the window picks out one response.
  ctx.beginPath();
  ctx.rect(0, 0, 1920, 1080);
  if (isMap) {
    ctx.rect(cam.x + (hole.x - 1) * pitch, cam.y + (hole.y - 1) * pitch, pitch * 3, pitch * 3);
  } else {
    ctx.rect(x, y, extent, extent);
  }
  ctx.fillStyle = isMap ? 'rgba(30,29,48,0.68)' : 'rgba(53,48,73,0.31)';
  ctx.fill('evenodd');
  outline(ctx, x, y, extent, extent, ink, 11);
  outline(ctx, x, y, extent, extent, focus, 5);
  if (!isMap) {
    for (let j = 0; j < 3; j++) {
      const alpha = s.signs[j];
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= alpha * s.weights * (1 - s.back);
      const tabX = x + pitch * (j + 0.5);
      box(ctx, tabX - 40, y - 48, 80, 48, ink);
      text(ctx, signed(KERNEL[0][j]), tabX, y - 25, 37, '#fff5df', { align: 'center', mono: true });
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = focus;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (s.equation > 0) {
    const xx = hole.x + Math.round(s.dx), yy = hole.y + Math.round(s.dy);
    const value = edgeMap[yy - 1][xx - 1];
    ctx.globalAlpha *= s.equation;
    text(ctx, signed(value), cx, cy, 46, value ? ink : white, { mono: true, align: 'center', weight: 700 });
  }
  ctx.restore();
}

function swatch(ctx, x, color, label, y = 871) {
  box(ctx, x, y - 16, 32, 32, color);
  outline(ctx, x, y - 16, 32, 32, ink, 2);
  text(ctx, label, x + 46, y, 38, ink);
}

function footer(ctx, s, clock) {
  swatch(ctx, 118, white, 'White  1');
  swatch(ctx, 345, dark, 'Dark  0');
  if (clock.index < 3 || clock.index === 8) {
    swatch(ctx, 997, cold[0], 'Negative');
    swatch(ctx, 1254, dark, 'Zero');
    swatch(ctx, 1467, warm[0], 'Positive');
    return;
  }
  text(ctx, 'Right − left', 997, 871, 35, ink);
  if (s.equation === 0) return;
  const x = hole.x + Math.round(s.dx), y = hole.y + Math.round(s.dy);
  const [left, , right] = columnsAt(x, y);
  const value = edgeMap[y - 1][x - 1];
  ctx.save();
  ctx.globalAlpha = s.equation;
  text(ctx, right + ' − ' + left + ' = ' + signed(value), 1778, 868, 54, ink, { mono: true, align: 'right' });
  ctx.restore();
}

function draw(ctx, clock) {
  const s = scene(clock);
  desktop(ctx);
  panels.forEach((p, i) => {
    const isMap = i === 1;
    const cam = camera(p, s.zoom, s.dy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    const values = isMap ? (s.punched ? edgeMap : originalMap) : (s.punched ? edited : pointer);
    pixelField(ctx, p, cam, values, isMap, s.zoom);
    registration(ctx, cam, s, isMap);
    selection(ctx, cam, s, isMap);
    if (!isMap) erase(ctx, cam, s);
    ctx.restore();
  });
  footer(ctx, s, clock);
}

export default { title: 'Convolution and the missing pixel', beats, draw, check };
