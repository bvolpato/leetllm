import assert from 'node:assert/strict';
import { locatePosition, privateHistory } from '../../../films/design-multi-tenant-llm-serving-platform/page-pool.mjs';

const beats = [
  {
    id: 'last-square',
    say: 'Watch the blue square land. It holds the attention keys and values for B’s thirty-second token. The orange squares belong to another tenant sharing the GPU. Here comes B’s next token.',
    hold: 0.9,
  },
  {
    id: 'orange-corner',
    say: 'Look at the far corner of the orange page. There’s an empty spot right there. Can B use it?',
    hold: 1.4,
  },
  {
    id: 'follow-blue',
    say: 'Pull back and follow B’s page table. The first sixteen positions live on page one. The next sixteen live on page three. B can read them in order even with another request in between.',
    hold: 0.7,
  },
  {
    id: 'waiting',
    say: 'Position thirty-three needs a third page. This allocator hands out sixteen slots at a time. That last spot belongs to A, and every page has an owner. B has to wait.',
    hold: 0.9,
  },
  {
    id: 'last-read',
    say: 'A has finished its reply. See the light moving over the orange squares? The GPU still has a read in flight. Once it finishes, A can give back all three pages.',
    hold: 1.1,
  },
  {
    id: 'first-square',
    say: 'Watch page four. The allocator gives the whole page to B and adds it to the page table. Where on that page will thirty-three land?',
    hold: 1.5,
  },
  {
    id: 'read-through',
    say: 'In the first square. Page one, page three, then page four. The next time the model needs B’s history, it can follow those three pages all the way to the new token.',
    hold: 2.0,
  },
];

const before = privateHistory();
const full = privateHistory({ bTokens: 32 });
const released = privateHistory({ bTokens: 32, retired: true });
const granted = privateHistory({ bTokens: 32, retired: true, reassigned: true });
const written = privateHistory({ bTokens: 33, retired: true, reassigned: true });
const end32 = locatePosition(full.tables.B, 32);
const end33 = locatePosition(written.tables.B, 33);
const emptyA = locatePosition(full.tables.A, 48);

function check() {
  assert.equal(before.pages.reduce((n, p) => n + p.used, 0), 78);
  assert.deepEqual(end32, { page: 3, slot: 15 });
  assert.equal(full.freePages, 0);
  assert.equal(full.pages[emptyA.page].owner, 'A');
  assert.equal(full.pages[emptyA.page].used, emptyA.slot);
  assert.equal(locatePosition(full.tables.B, 33), null);
  assert.throws(() => privateHistory({ bTokens: 33 }), /owned page/);
  assert.throws(() => privateHistory({ reassigned: true }), /A reader/);
  assert.equal(released.freePages, 3);
  assert.equal(granted.pages[end33.page].used, 0);
  assert.deepEqual(end33, { page: 4, slot: 0 });
  const logical = Array.from({ length: 33 }, (_, i) => locatePosition(written.tables.B, i + 1));
  assert.ok(logical.every(({ page, slot }) =>
    written.pages[page].owner === 'B' && slot < written.pages[page].used));
  assert.deepEqual(written.pages.map(p => p.used), [0, 16, 0, 16, 1]);
}

const clamp = t => Math.min(1, Math.max(0, t));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const span = (t, a, b) => ease((t - a) / (b - a));

const colors = {
  A: { wall: '#783d32', rim: '#f6aa78', face: '#eca278', glint: '#ffddab', shadow: '#984d3c', ink: '#542d29' },
  B: { wall: '#133a7d', rim: '#8abaff', face: '#548de9', glint: '#c7f3ff', shadow: '#304da2', ink: '#132950' },
  free: { wall: '#55556b', rim: '#c2bbd0', ink: '#454257' },
};
const pitch = 285;
const pageX = id => pitch * id;
function location({ page, slot }) {
  return { x: pageX(page) - 74.25 + (slot % 4) * 49.5, y: 73 + Math.floor(slot / 4) * 48 };
}

function path(c, pts) {
  c.beginPath();
  pts.forEach(([x, y], i) => i === 0 ? c.moveTo(x, y) : c.lineTo(x, y));
}
function polygon(c, pts, col) {
  path(c, pts);
  c.closePath();
  c.fillStyle = col;
  c.fill();
}
function wire(c, pts, col, width = 1) {
  path(c, pts);
  c.strokeStyle = col;
  c.lineWidth = width;
  c.stroke();
}
function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}
function label(c, str, x, y, size, col, family = 'Sans', align = 'left', weight = 600) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.fillStyle = col;
  c.fillText(str, x, y);
}
function wash(c, x1, y1, x2, y2, stops) {
  const gradient = c.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

// A raking view across a cut edge of silicon. The camera moves along the row of pages.
function camera(amount) {
  const center = mix(pitch * 3.5, pitch * 2, amount);
  const scale = mix(2.44, 1.24, amount);
  function project(x, y, lift = 0) {
    return {
      x: 960 + scale * (x - center - 0.16 * (y - 125)),
      y: 595 + scale * (0.87 * (y - 125) - 0.047 * (x - center) - lift),
    };
  }
  return {
    scale, project,
    enter(c) {
      const o = project(0, 0);
      c.transform(scale, -0.047 * scale, -0.16 * scale, 0.87 * scale, o.x, o.y);
    },
  };
}

function silicon(c) {
  const left = -203, right = pageX(4) + 204;
  const edge = [[left, -45], [left + 44, -89], [right - 51, -89],
    [right, -38], [right, 290], [right - 61, 351], [left + 38, 351], [left, 313]];
  for (const [depth, color] of [[24, '#493c60'], [19, '#8f829f'], [15, '#b6c2ca'], [9, '#615473'], [4, '#e0d5df']]) {
    polygon(c, edge.map(([x, y]) => [x, y + depth]), color);
  }
  polygon(c, edge, wash(c, left, 400, right, -360, [
    [0, '#a397b9'], [0.23, '#d7cedc'], [0.42, '#b9b3cb'], [0.6, '#b8c4d2'],
    [0.78, '#d5cbd2'], [1, '#b2a5c8'],
  ]));
  c.save();
  c.clip();
  // Photomask traces turn away from each memory array toward its bond pads.
  for (let id = 0; id < 5; id++) {
    const x = pageX(id);
    for (let k = 0; k < 25; k++) {
      const a = x - 100 + k * 8.1;
      const bend = 10 + Math.abs(k - 12) * 1.6;
      wire(c, [[a, -88], [a, -48], [a + bend, -48 + bend], [a + bend, 3]], '#968ca762', 1.4);
      wire(c, [[a, 242], [a, 266], [a - bend, 266 + bend], [a - bend, 347]], '#8279916d', 1.1);
      rect(c, a - bend - 1.8, 338, 4, 7, '#e4dddb');
    }
  }
  for (let j = 0; j < 6; j++) {
    wire(c, [[left, 288 + j * 4], [65, 288 + j * 4], [93, 316 + j * 4], [right, 316 + j * 4]], '#f7e7ec80', 1.3);
  }
  c.restore();
}

function cell(c, x, y, palette, number) {
  const l = x - 21, t = y - 17;
  rect(c, l + 1, t + 5, 42, 35, '#302a4536');
  rect(c, l, t + 2, 42, 34, palette.shadow);
  rect(c, l, t - 1, 42, 33, palette.glint);
  rect(c, l, t - 4, 42, 33, palette.shadow);
  rect(c, l, t - 7, 42, 33, number ? '#c8efff' : palette.face);
  rect(c, l, t - 7, 42, 1.7, palette.glint);
  if (number) {
    label(c, String(number), x, y + 3.5, 25, '#1b3e70', 'Mono', 'center');
  } else {
    // Two fine sets of grooves distinguish the two tenants even in grayscale.
    for (let k = 0; k < 5; k++) {
      if (palette === colors.B) rect(c, l + 5 + k * 6.8, t - 2, 1, 21, '#d6eaff66');
      else rect(c, l + 5, t - 2 + k * 4.8, 31, 1.2, '#fff2cf88');
    }
  }
}

function page(c, pageState, stage) {
  const { id, used, owner } = pageState;
  const x = pageX(id);
  const p = colors[owner ?? 'free'];
  const l = x - 112;
  const outline = [[l, 2], [x + 96, 2], [x + 112, 18], [x + 112, 244], [l, 244]];
  polygon(c, outline.map(([x, y]) => [x + 3, y + 6]), '#5a526c7f');
  polygon(c, outline, p.wall);
  rect(c, l + 3, 4, 203, 2, p.rim);
  rect(c, l + 3, 5, 2, 234, p.rim);
  label(c, 'P' + id, l + 10, 37, 34, '#ffffff', 'Mono');
  label(c, owner ?? 'free', x + 97, 37, owner ? 31 : 24, '#ffffff', 'Sans', 'right');
  for (let slot = 0; slot < 16; slot++) {
    const at = location({ page: id, slot });
    rect(c, at.x - 22, at.y - 22, 44, 40, '#282438');
    rect(c, at.x - 20, at.y - 19, 40, 35, owner ? '#39344b' : '#676275');
    wire(c, [[at.x - 19, at.y + 16], [at.x + 20, at.y + 16], [at.x + 20, at.y - 17]], '#ddcad17a', 1.5);
    if (slot < used) {
      let number = null;
      if (id === end32.page && slot === end32.slot) number = 32;
      if (id === end33.page && slot === end33.slot && owner === 'B') number = 33;
      cell(c, at.x, at.y, p, number);
    }
  }
  if (stage.read > 0 && stage.read < 1 && id === 4) {
    c.save();
    c.beginPath();
    c.rect(l + 10, 46, 205, 188);
    c.clip();
    const xx = mix(l - 100, l + 264, stage.read);
    polygon(c, [[xx, 45], [xx + 25, 45], [xx + 78, 234], [xx + 53, 234]],
      'rgba(255,248,215,.72)');
    wire(c, [[xx + 25, 45], [xx + 78, 234]], '#fff8dd', 3.5);
    c.restore();
  }
}

// Trace the logical traversal below the array. The physical addresses stay fixed.
function itinerary(c, table, progress) {
  const start = pageX(table[0]);
  const end = pageX(table.at(-1));
  const head = mix(start - 12, end + 12, progress);
  if (head < start) return;
  wire(c, [[start, 251], [start, 276], [Math.min(head, end), 276]], '#123d83', 3.5);
  for (const id of table) {
    const x = pageX(id);
    if (x > head) continue;
    wire(c, [[x, 276], [x, 251]], '#123d83', 3.5);
    polygon(c, [[x, 246], [x - 4, 253], [x + 4, 253]], '#123d83');
    const block = table.indexOf(id);
    const range = block === 2 ? '33' : (block * 16 + 1) + '–' + ((block + 1) * 16);
    label(c, range, x, 307, 26, '#143362', 'Mono', 'center');
  }
  if (head < end) {
    c.beginPath();
    c.arc(head, 276, 4.7, 0, Math.PI * 2);
    c.fillStyle = '#d5f6ff';
    c.fill();
  }
}

function timing(clock) {
  const { index, elapsed, reveal } = clock;
  const on = (i, phrase, duration) => index < i ? 0 : index > i ? 1 : ease(reveal(phrase, duration));
  const land32 = index === 0 ? span(elapsed, 0, 1.75) : 1;
  const show33 = on(0, 'Here comes', 0.65);
  const wide = on(2, 'Pull back', 1.65) - on(5, 'Watch page four', 1.7);
  const retire = on(4, 'Once it finishes', 0.85);
  const grant = on(5, 'The allocator', 0.62);
  const drop = index < 5 ? 0 : index > 5 ? 1 : span(elapsed, clock.speechDuration + 0.05, clock.speechDuration + 1.05);
  const history = drop === 1 ? written : grant === 1 ? granted : retire === 1 ? released : land32 === 1 ? full : before;
  const readStart = index === 4 ? reveal('See the light', 0.1) : 0;
  // The last device read leaves the page before any of its cells become reusable.
  const read = readStart > 0 && retire < 1 ? Math.min(0.99, 0.06 + 0.75 * reveal('See the light', 4.1) + 0.19 * retire) : 0;
  const firstEntry = on(2, 'The first sixteen', 0.5);
  const secondEntry = on(2, 'The next sixteen', 1.1);
  const trace = index <= 4 ? firstEntry * 0.05 + secondEntry * 0.95 :
    index === 6 ? on(6, 'Page one', 0.45) * 0.05 + on(6, 'page three', 0.6) * 0.62 +
      on(6, 'then page four', 0.6) * 0.33 : 0;
  const corner = on(1, 'Look at', 0.65) - on(2, 'Pull back', 0.7) +
    on(3, 'That last spot', 0.5) - on(4, 'A has finished', 0.6);
  return { land32, show33, wide, grant, drop, history, read, trace, corner, firstEntry, secondEntry };
}

function callout(c, text, target, x, y, opacity, align = 'left') {
  if (opacity <= 0) return;
  c.save();
  c.globalAlpha = opacity;
  const sign = align === 'left' ? -1 : 1;
  const join = x + sign * 14;
  wire(c, [[target.x, target.y], [join + sign * 18, y - 10], [join, y - 10]], '#483851', 2.5);
  c.beginPath();
  c.arc(target.x, target.y, 4.5, 0, 2 * Math.PI);
  c.fillStyle = '#fdf4ed';
  c.fill();
  label(c, text, x, y, 42, '#332c45', 'Sans', align);
  c.restore();
}

function draw(c, clock) {
  const s = timing(clock);
  const cam = camera(s.wide);
  rect(c, 0, 0, 1920, 1080, wash(c, 260, -200, 1430, 1230, [
    [0, '#fcf5ee'], [0.47, '#f2e8ef'], [0.8, '#e2d7e8'], [1, '#d5ccdf'],
  ]));
  c.save();
  cam.enter(c);
  silicon(c);
  for (const pg of s.history.pages) page(c, pg, s);
  if (s.trace > 0) itinerary(c, s.history.tables.B, s.trace);
  c.restore();

  if (clock.index < 2) {
    label(c, 'Shared KV cache', 86, 135, 78, '#31273f', 'Serif', 'left', 400);
  } else {
    label(c, 'B’s page table', 86, 101, 52, '#31273f', 'Serif', 'left', 400);
    const entries = [s.firstEntry, s.secondEntry, s.grant];
    s.history.tables.B.forEach((id, i) => {
      c.save();
      c.globalAlpha = entries[i];
      const x = 86 + i * 162;
      if (i) {
        wire(c, [[x - 62, 151], [x - 20, 151]], '#635f83', 3.5);
        wire(c, [[x - 32, 141], [x - 20, 151], [x - 32, 161]], '#635f83', 3.5);
      }
      label(c, 'P' + id, x, 172, 58, '#183e82', 'Mono');
      if (clock.index === 6) {
        const phrase = ['Page one', 'page three', 'then page four'][i];
        const traced = ease(clock.reveal(phrase, 0.45));
        if (traced) rect(c, x, 187, 69 * traced, 5, '#5d8ce0');
      }
      c.restore();
    });
  }
  const at32 = location(end32), at33 = location(end33);
  const wait = { x: pageX(3) + 147, y: -55 };
  // The waiting position stays between the two pages until B has its third mapping.
  function floating(pos, number, alpha, lift) {
    c.save();
    c.globalAlpha = alpha;
    cam.enter(c);
    c.translate(0, -lift);
    cell(c, pos.x, pos.y, colors.B, number);
    c.restore();
  }
  if (s.land32 < 1) {
    floating({ x: at32.x - 40 * (1 - s.land32), y: mix(113, at32.y, s.land32) },
      32, 1, (1 - s.land32) * 157);
  }
  if (s.show33 > 0 && s.drop < 1) {
    const pos = { x: mix(wait.x, at33.x, s.drop), y: mix(wait.y, at33.y, s.drop) };
    const lift = 24 * (1 - s.drop) + 20 * Math.sin(Math.PI * s.drop);
    floating(pos, 33, s.show33, lift);
    const tip = cam.project(pos.x + 21, pos.y - lift - 16);
    callout(c, 'B’s next write', tip, Math.min(1580, tip.x + 88), tip.y - 37,
      s.show33 * (1 - s.drop));
  }
  if (s.corner > 0) {
    const a = location(emptyA);
    const tip = cam.project(a.x, a.y);
    callout(c, 'Empty', tip, tip.x - 52, tip.y + 103, s.corner, 'right');
  }
}

export default { title: 'Where Can B Put Token 33?', beats, draw, check };
