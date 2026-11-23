import assert from 'node:assert/strict';
import { reportRequest, reportRuns } from '../../../films/local-agent-sandboxing-seatbelt-landlock/fixtures.mjs';
import { reportWalk } from '../../../films/local-agent-sandboxing-seatbelt-landlock/report-board.mjs';

const runs = reportRuns.map(run => ({ ...run, ...reportWalk(run) }));
const components = reportRequest.split('/');

const beats = [
  {
    id: 'one-character',
    say: "Each worker has one x to add to an empty report. Why did it land only on the left? Both asked for the same path.",
    hold: 1.0,
  },
  {
    id: 'the-write-grant',
    say: "Open the two project copies. On this Mac, the Seatbelt sandbox lets the worker change file contents under source. Both paths start there.",
    hold: 0.65,
  },
  {
    id: 'open-cache',
    say: "Open cache. On the left, it's a folder inside source. See the arrow on the right? That cache is a symbolic link. Follow it into daily, in the archive.",
    hold: 1.1,
  },
  {
    id: 'up-one',
    say: "The two dots mean go up one folder. Where does that leave each worker?",
    hold: 1.65,
  },
  {
    id: 'two-reports',
    say: "We're back in source on the left, and in archive on the right. Each holds a report. Point to the one the worker can change.",
    hold: 1.7,
  },
  {
    id: 'what-landed',
    say: "The source report took the x. Seatbelt refused to open the archive report for writing. The test measured both files afterward. One byte on the left. Zero on the right.",
    hold: 2.4,
  },
];

const ink = '#262243';
const paper = '#fffcf1';
const source = {
  back: '#766cca', deep: '#4b4193', light: '#cac6ff', top: '#aca7fb', bottom: '#8d88e6',
  line: '#423b7e', label: '#242146', edge: '#eeebff',
};
const archive = {
  back: '#ba728f', deep: '#905169', light: '#f7ccd5', top: '#edbbc8', bottom: '#d99aad',
  line: '#764657', label: '#4a273d', edge: '#ffedf0',
};

const clamp = t => Math.max(0, Math.min(1, t));
function ease(t) {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
}

function polygon(ctx, points, fill, stroke, width = 4) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function label(ctx, text, x, y, size, color = ink, family = 'Sans', weight = 500, align = 'center') {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function vertical(ctx, a, b, y1, y2) {
  const gradient = ctx.createLinearGradient(0, y1, 0, y2);
  gradient.addColorStop(0, a);
  gradient.addColorStop(1, b);
  return gradient;
}

function bitmap(ctx, rows, x, y, pitch, color) {
  ctx.fillStyle = color;
  for (const [row, bits] of rows.entries()) {
    for (let col = 0; col < bits.length; col++) {
      if (bits[col] === '1') ctx.fillRect(x + col * pitch, y + row * pitch, pitch, pitch);
    }
  }
}

const letter = ['1100011', '0110110', '0011100', '0001000', '0011100', '0110110', '1100011'];
const shortcut = ['00001111', '00000111', '00001101', '00011001', '00110000', '11100000', '11000000'];
const lock = ['0011100', '0100010', '0100010', '1111111', '1110111', '1110111', '1111111'];

function desktop(ctx) {
  ctx.fillStyle = vertical(ctx, '#fff5ea', '#c9c5e9', 0, 1080);
  ctx.fillRect(0, 0, 1920, 1080);
  // Two fields of ordered pixels give the desktop a halftone horizon.
  for (let band = 0; band < 2; band++) {
    for (let x = -16; x < 1940; x += 18) {
      const ridge = 774 + band * 78 + 79 * Math.cos(x / 450 + band * 0.3);
      const y = Math.round(ridge / 12) * 12;
      ctx.fillStyle = band ? '#b8b6dd' : '#c5bfdf';
      ctx.fillRect(x, y + 24, 18, 1080 - y);
      ctx.fillRect(x, y + 12, 7, 12);
      if (x % 36 === 2) ctx.fillRect(x, y - 5, 5, 5);
    }
  }
}

function pathBar(ctx, focus, alpha) {
  const sizes = components.map(word => {
    ctx.font = '54px "Lesson Mono"';
    return ctx.measureText(word).width;
  });
  const gap = 63;
  const total = sizes.reduce((a, b) => a + b, 0) + (components.length - 1) * gap;
  const start = 960 - total / 2;
  label(ctx, 'Append x to', 960, 87, 38);
  let x = start;
  components.forEach((word, i) => {
    const w = sizes[i];
    if (focus === i) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#dfd6f4';
      ctx.fillRect(x - 11, 122, w + 22, 70);
      ctx.fillStyle = '#7053a7';
      ctx.fillRect(x - 11, 192, w + 22, 5);
      ctx.restore();
    }
    label(ctx, word, x, 156, 54, ink, 'Mono', 400, 'left');
    if (i < components.length - 1) label(ctx, '/', x + w + gap / 2, 156, 49, '#847e96', 'Mono');
    x += w + gap;
  });
}

function shadow(ctx, x, y, w) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(w, 24);
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  fade.addColorStop(0, 'rgba(51,40,89,.27)');
  fade.addColorStop(.57, 'rgba(58,49,89,.15)');
  fade.addColorStop(1, 'rgba(65,49,88,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function folderBack(ctx, p) {
  const outline = [
    [-305,138],[-305,-149],[-298,-149],[-298,-159],[-283,-159],[-283,-170],
    [-114,-170],[-114,-162],[-102,-162],[-102,-151],[-90,-151],[-90,-143],
    [270,-143],[270,-136],[282,-136],[282,-125],[292,-125],[292,138],
  ];
  polygon(ctx, outline, p.back, p.line, 6);
  ctx.fillStyle = p.light;
  ctx.fillRect(-281, -164, 163, 5);
  ctx.fillRect(-86, -137, 350, 4);
  polygon(ctx, [[-281,-106],[267,-106],[282,-87],[282,128],[-281,125]], p.deep);
}

function folderFront(ctx, p, name, permission, details = true) {
  const face = [
    [-311,-26],[-302,-26],[-302,-35],[300,-35],[300,-29],[313,-29],[313,-15],
    [293,137],[286,137],[286,150],[273,150],[273,158],[-265,158],[-265,152],[-277,152],[-277,140],
  ];
  polygon(ctx, face, vertical(ctx, p.top, p.bottom, -35, 158), p.line, 6);
  ctx.fillStyle = p.edge;
  ctx.fillRect(-297, -30, 591, 6);
  ctx.fillStyle = p.line;
  ctx.save();
  ctx.globalAlpha *= .16;
  for (let row = 0; row < 4; row++) {
    const y = 124 + row * 8;
    for (let x = -260 + 8 * (row % 2); x < 263; x += 16) {
      if (x > 156 - row * 34) ctx.fillRect(x, y, 5, 4);
    }
  }
  ctx.restore();
  if (details) {
    label(ctx, name, -235, 30, 69, p.label, 'Mono', 400, 'left');
    if (permission) {
      const protectedFolder = p === archive;
      if (protectedFolder) bitmap(ctx, lock, -233, 93, 3.5, p.label);
      label(ctx, permission, protectedFolder ? -196 : -235, 105, 35, p.label, 'Sans', 500, 'left');
    }
  }
}

function childFolder(ctx, y, name, palette, isLink) {
  ctx.save();
  ctx.translate(24, y);
  ctx.scale(.58, .58);
  folderBack(ctx, palette);
  folderFront(ctx, palette, '', '', false);
  label(ctx, name, 0, 62, 82, palette.label, 'Mono');
  if (isLink) {
    ctx.translate(-267, 88);
    ctx.fillStyle = '#fffbed';
    ctx.fillRect(-8, -8, 104, 92);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 7;
    ctx.strokeRect(-8, -8, 104, 92);
    bitmap(ctx, shortcut, 3, 2, 9, ink);
  }
  ctx.restore();
}

// Each page has a magnified character cell. Its registration marks belong to the viewer.
function page(ctx, x, y, zoom, hasByte) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(zoom, zoom);
  const sheet = [
    [-145,-170],[69,-170],[143,-96],[143,133],[136,133],[136,141],[-139,141],[-139,134],[-145,134],
  ];
  ctx.save();
  ctx.translate(7, 8);
  polygon(ctx, sheet, '#9690aa');
  ctx.restore();
  polygon(ctx, sheet, vertical(ctx, '#fffef5', '#f7f1e5', -160, 141), ink, 6);
  polygon(ctx, [[69,-168],[141,-96],[71,-96]], '#d9d5df', ink, 5);

  const px = 10, left = -74, top = -86;
  ctx.fillStyle = '#e7e1e0';
  for (let j = 0; j < 12; j++) for (let i = 0; i < 15; i++) {
    ctx.fillRect(left + i * px, top + j * px, 2, 2);
  }
  for (const [sx, sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const cx = sx * 83, cy = -30 + sy * 65;
    ctx.fillStyle = '#a39aaa';
    ctx.fillRect(cx - (sx === 1 ? 10 : 0), cy, 11, 3);
    ctx.fillRect(cx, cy - (sy === 1 ? 10 : 0), 3, 11);
  }
  if (hasByte) bitmap(ctx, letter, -42, -72, 12, ink);
  label(ctx, 'report.txt', 0, 91, 35, ink, 'Mono');
  ctx.restore();
}

// The byte touches a page only when the recorded open for that destination succeeded.
function carriedByte(ctx, x, y, zoom, t, allowed) {
  if (t >= (allowed ? 1 : 1.72)) return;
  const inbound = ease(t);
  const recoil = allowed ? 0 : ease((t - 1) / .72);
  const dx = (allowed ? -175 : -222) * (1 - inbound) + (allowed ? 0 : -191) * inbound - 55 * recoil;
  const dy = -123 * (1 - inbound) - 86 * recoil;
  ctx.save();
  ctx.translate(x + dx * zoom, y + (dy - 30) * zoom);
  ctx.scale(zoom, zoom);
  ctx.globalAlpha *= 1 - recoil;
  bitmap(ctx, letter, -40, -37, 12, '#64332f');
  bitmap(ctx, letter, -44, -43, 12, '#d45427');
  ctx.restore();
}

function result(ctx, run, hasArrived, x, y, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  const size = hasArrived ? run.sourceBytes + run.archiveBytes : 0;
  label(ctx, size + (size === 1 ? ' byte' : ' bytes'), x, y, 54, ink, 'Mono');
  ctx.restore();
}

function draw(ctx, clock) {
  const { index, elapsed } = clock;
  desktop(ctx);
  const open = index === 1 ? ease(clock.reveal('Open the two project copies', 1.1)) : Number(index > 1);
  const peek = index === 2 ? ease(clock.reveal('Open cache', .85)) : Number(index > 2);
  const follow = index === 2 ? ease(clock.reveal('Follow it', 1.3)) : Number(index > 2);
  const up = index === 3 ? ease(clock.reveal('go up one folder', 1.25)) : Number(index > 3);
  const files = index === 4 ? ease(clock.reveal('Each holds a report', 1.2)) : Number(index > 4);
  const focus = [-1, 0, 1, 2, files > 0 ? 3 : 2, 3][index];
  pathBar(ctx, focus, index === 1 ? open : 1);

  for (const [i, run] of runs.entries()) {
    const x = i === 0 ? 535 : 1385;
    const folderY = 644 + (1 - open) * 112;
    const switchFolder = Boolean(run.link) && follow >= .5;
    const parent = switchFolder ? run.stops[3].split('/').at(-1) : components[0];
    const palette = switchFolder ? archive : source;
    const shellScale = .82 + .31 * open;
    const shellOpacity = ease(open / .12);
    shadow(ctx, x, 850, 235 + 126 * open);

    ctx.save();
    ctx.translate(x, folderY);
    ctx.scale(shellScale, shellScale);
    // As the link opens, the source icon folds edge-on and the archive opens in its place.
    const flip = run.link ? Math.abs(Math.cos(Math.PI * follow)) : 1;
    ctx.scale(.08 + .92 * flip, 1);
    if (open > 0) {
      ctx.save();
      ctx.globalAlpha = shellOpacity;
      folderBack(ctx, palette);
      ctx.restore();
      if (peek > 0 && up < 1) {
        const child = switchFolder ? run.stops[2].split('/').at(-1) : components[1];
        ctx.save();
        ctx.beginPath();
        ctx.rect(-299, -458, 598, 566);
        ctx.clip();
        childFolder(ctx, 76 - 290 * peek * (1 - up), child, palette, Boolean(run.link) && !switchFolder);
        ctx.restore();
      }
      if (files > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-281, -460, 562, 544);
        ctx.clip();
        const py = 132 - 305 * files;
        const landed = index === 5 && elapsed >= .78;
        page(ctx, 17, py, 1.17, landed && run.allowed);
        ctx.restore();
      }
    }
    if (open < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-490, -850, 980, 985);
      ctx.clip();
      const y = (515 + 318 * open - folderY) / shellScale;
      const z = (1.59 - .65 * open) / shellScale;
      const t = index === 0 ? elapsed / .78 : 2;
      page(ctx, 0, y, z, t >= 1 && run.allowed);
      carriedByte(ctx, 0, y, z, t, run.allowed);
      ctx.restore();
    }
    if (open > 0) {
      ctx.save();
      ctx.globalAlpha = shellOpacity;
      folderFront(ctx, palette, parent, switchFolder ? 'Outside write grant' : 'Writes allowed', open > .72);
      ctx.restore();
    }
    if (index === 5) {
      carriedByte(ctx, 17, -173, 1.17, elapsed / .78, run.allowed);
    }
    ctx.restore();
    if (open < 1) result(ctx, run, index > 0 || elapsed >= .78, x, 818, 1 - ease(open / .12));
    if (index === 5) result(ctx, run, elapsed >= .78, x, 887, ease(elapsed / .45));
    label(ctx, 'Copy ' + run.name, x, 943, 40, '#443b61', 'Sans', 600);
  }
}

function check() {
  assert.deepEqual(components, ['src', 'cache', '..', 'report.txt']);
  assert.deepEqual(runs.map(r => r.resolved), ['src/report.txt', 'archive/report.txt']);
  assert.deepEqual(runs.map(r => r.stops.slice(2, 4)), [
    ['/workspace/src/cache', '/workspace/src'],
    ['/workspace/archive/daily', '/workspace/archive'],
  ]);
  assert.equal(new TextEncoder().encode('x').length, 1);
  for (const run of runs) {
    assert.equal(run.allowed, run.exit === 0);
    assert.equal(run.sourceBytes, run.allowed ? 1 : 0);
    assert.equal(run.archiveBytes, 0);
  }
  assert.match(runs[1].stderr, /Operation not permitted$/);
}

export default { title: 'Why did only one report gain a byte?', beats, draw, check };
