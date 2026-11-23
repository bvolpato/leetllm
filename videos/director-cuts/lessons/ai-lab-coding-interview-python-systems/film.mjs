import assert from 'node:assert/strict';

const beats = [
  {
    id: 'double-fetch',
    say: 'Watch the guide load. There it goes again. Two workers in the same Python crawler just asked for the same page. How did both get past the check?',
    hold: 0.8,
  },
  {
    id: 'pause-between-lines',
    say: 'Rewind to the membership test. The arrows mark the next line for each worker. A checks the shared set. The guide is missing, so A steps down to add. Leave A there and let B check.',
    hold: 1.1,
  },
  {
    id: 'one-entry-two-calls',
    say: 'Look where both arrows landed. Each worker saw an empty set. A adds the guide. B adds the very same string. Count the entries in the set. Just one. Now count the workers about to call fetch.',
    hold: 1.3,
  },
  {
    id: 'move-the-indent',
    say: 'Run it again with a lock shared by both workers. Tuck the check and the insertion inside the lock. Keep fetch one indent back. That line can spend a long time waiting for the network.',
    hold: 0.8,
  },
  {
    id: 'inside-the-lock',
    say: 'A gets in first. Try to step B. Its arrow stays at the lock while A checks the set and adds the guide. Now A leaves the block and sends its request.',
    hold: 0.75,
  },
  {
    id: 'take-the-return',
    say: 'The guide is still loading. Let B into the block. Look at the set as B checks the address. This time the guide is there. B takes the return and can pick up another link.',
    hold: 0.9,
  },
  {
    id: 'overlapping-replies',
    say: 'Give B the API page. It can claim that address while A waits. Watch the lower request finish. The guide is still loading above it.',
    hold: 1.7,
  },
  {
    id: 'both-pages',
    say: 'Keep your eye on A. There’s the guide. Two replies came back, one for each page. The workers took turns claiming their pages, and their network waits overlapped.',
    hold: 2.6,
  },
];

// Run the same visit function twice, advancing one worker by one Python statement
// at each step. Network completions belong to the fixture clock, in milliseconds.
const GUIDE = '/guide';
const API = '/api';
const latency = { [GUIDE]: 80, [API]: 36 };
const unlocked = [[1, 'A'], [2, 'B'], [3, 'A'], [4, 'B'], [5, 'A'], [9, 'B']];
const locked = [
  [0.5, 'A'], [1, 'B'], [2, 'A'], [3, 'A'], [4, 'A'],
  [5, 'B'], [6, 'B'], [7, 'B'], [8, 'B', API],
  [9, 'B'], [10, 'B'], [11, 'B'], [12, 'B'],
];

function run(withLock, schedule, now) {
  const first = withLock ? 'lock' : 'test';
  const worker = (url) => ({ url, line: first, blocked: false });
  const state = {
    A: worker(GUIDE), B: worker(GUIDE), seen: new Set(), owner: null, requests: [],
  };
  for (const [time, who, nextUrl] of schedule) {
    if (time > now) break;
    const w = state[who];
    if (nextUrl) {
      assert.equal(w.line, 'returned');
      state[who] = worker(nextUrl);
      continue;
    }
    switch (w.line) {
      case 'lock':
        w.blocked = state.owner !== null;
        if (!w.blocked) {
          state.owner = who;
          w.line = 'test';
        }
        break;
      case 'test':
        if (withLock) assert.equal(state.owner, who);
        w.line = state.seen.has(w.url) ? 'return' : 'add';
        break;
      case 'return':
        state.owner = null;
        w.line = 'returned';
        break;
      case 'add':
        if (withLock) assert.equal(state.owner, who);
        state.seen.add(w.url);
        state.owner = null;
        w.line = 'fetch';
        break;
      case 'fetch':
        assert.equal(state.owner === who, false);
        state.requests.push({ who, url: w.url, sent: time, received: time + latency[w.url] });
        w.line = 'network';
        break;
      default:
        throw new Error('Cannot advance ' + who + ' from ' + w.line);
    }
  }
  return state;
}

function check() {
  const race = (t) => run(false, unlocked, t);
  const safe = (t) => run(true, locked, t);
  assert.deepEqual([race(2).A.line, race(2).B.line, race(2).seen.size], ['add', 'add', 0]);
  assert.equal(race(9).seen.size, 1);
  assert.deepEqual(race(9).requests.map(r => r.url), [GUIDE, GUIDE]);
  assert.equal(safe(1).owner, 'A');
  assert.equal(safe(1).B.blocked, true);
  assert.deepEqual([safe(3).owner, safe(3).A.line], [null, 'fetch']);
  assert.equal(safe(6).B.line, 'return');
  assert.deepEqual([...safe(7).seen], [GUIDE]);
  const { seen, requests } = safe(100);
  assert.deepEqual([...seen], [GUIDE, API]);
  assert.deepEqual(requests.map(r => [r.who, r.url]), [['A', GUIDE], ['B', API]]);
  assert(requests[0].sent < requests[1].sent && requests[1].received < requests[0].received);
  const swapped = locked.slice(0, 8).map(([t, who]) => [t, who === 'A' ? 'B' : 'A']);
  assert.deepEqual(run(true, swapped, 7).requests.map(r => r.who), ['B']);
}

const ink = '#262041';
const dim = '#665d76';
const blue = '#4838a7';
const orange = '#b44121';
const milk = '#f9f6f2';
const colors = { A: blue, B: orange };
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function box(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function line(ctx, x, y, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function gradient(ctx, y, bottom, stops) {
  const g = ctx.createLinearGradient(0, y, 0, bottom);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}
function type(ctx, str, x, y, size, color = ink, family = 'Mono', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function laptop(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 1080, [[0, '#d3bfc6'], [0.8, '#ae929b'], [1, '#805f73']]);
  ctx.fillRect(0, 0, 1920, 1080);
  // Close framing leaves only the hinges and the top row of the keyboard in view.
  box(ctx, 37, 16, 1846, 969, 57, '#705b80');
  box(ctx, 33, 4, 1854, 966, 57, gradient(ctx, 4, 971, [
    [0, '#f5e9ef'], [0.016, '#d6c9e8'], [0.6, '#b2a0ce'], [0.95, '#bba6ce'], [1, '#826e9f'],
  ]));
  box(ctx, 77, 47, 1766, 864, 29, '#e0d5eb');
  box(ctx, 80, 44, 1760, 862, 27, gradient(ctx, 44, 907, [[0, '#706781'], [0.03, '#a89eb9'], [0.94, '#91809f'], [1, '#e1cfe5']]));
  box(ctx, 94, 60, 1732, 832, 15, '#332c43');
  box(ctx, 105, 71, 1710, 810, 6, milk);
  for (const x of [245, 1458]) {
    box(ctx, x, 943, 214, 54, 13, '#5a4c70');
    box(ctx, x + 5, 940, 204, 51, 10, gradient(ctx, 940, 992, [
      [0, '#695779'], [0.25, '#bda6d6'], [0.52, '#d7c1e8'], [1, '#8e7c9f'],
    ]));
  }
  box(ctx, -14, 994, 1948, 166, 34, gradient(ctx, 994, 1090, [[0, '#e2d2e9'], [0.18, '#b19ac5'], [1, '#d1bed9']]));
  box(ctx, 97, 1025, 1726, 112, 21, '#786681');
  const keys = ['esc', ...Array.from({ length: 12 }, (_, i) => 'F' + (i + 1))];
  keys.forEach((key, i) => {
    const x = 111 + i * 131;
    box(ctx, x, 1031, 120, 65, 8, '#8c809d');
    box(ctx, x + 4, 1029, 112, 58, 7, gradient(ctx, 1029, 1087, [[0, '#f1e8f1'], [1, '#d7c9df']]));
    type(ctx, key, x + 16, 1065, 22, '#6c5c78');
  });
  for (let i = 0; i < 21; i++) {
    line(ctx, 817 + 14 * i, 932, 817 + 14 * i, 942, '#8b779d', 4);
  }
}

function pixelBug(ctx, x, y) {
  const bitmap = [
    '10000001', '01000010', '00111100', '10100101', '01111110',
    '00111100', '11111111', '00111100', '01000010', '10000001',
  ];
  ctx.fillStyle = '#fff4d3';
  bitmap.forEach((row, j) => [...row].forEach((v, i) => {
    if (v === '1') ctx.fillRect(x + i * 5, y + j * 5, 5, 5);
  }));
}

function titleBar(ctx, trace) {
  ctx.fillStyle = gradient(ctx, 72, 166, [[0, '#735cb5'], [1, '#54458c']]);
  ctx.fillRect(106, 72, 1708, 94);
  line(ctx, 106, 166, 1814, 166, '#382956', 4);
  pixelBug(ctx, 143, 94);
  type(ctx, trace ? 'crawler.py   /   Network' : 'crawler.py   /   Debugger',
    213, 136, 48, '#fffaf4', 'Sans', 600);
  // Two recessed marks in the window furniture stay fixed through each view change.
  ctx.strokeStyle = '#e2d6ef';
  ctx.lineWidth = 4;
  ctx.strokeRect(1746, 100, 29, 29);
  line(ctx, 1695, 129, 1722, 129, '#e2d6ef', 4);
}

function flag(ctx, who, x, y, scale = 1, outline = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, -25); ctx.lineTo(39, -25); ctx.lineTo(61, 0);
  ctx.lineTo(39, 25); ctx.lineTo(0, 25); ctx.closePath();
  ctx.fillStyle = outline ? milk : colors[who];
  ctx.fill();
  ctx.strokeStyle = colors[who]; ctx.lineWidth = 4; ctx.stroke();
  type(ctx, who, 9, 15, 40, outline ? colors[who] : '#fffaf0');
  ctx.restore();
}

const lines = [
  ['def', 'def visit(url):', 0, 0],
  ['lock', 'with lock:', 4, 1],
  ['test', 'if url in seen:', 4, 1],
  ['return', 'return', 8, 2],
  ['add', 'seen.add(url)', 4, 3],
  ['fetch', 'fetch(url)', 4, 4],
];
function row(lineId, indentMix) {
  const index = lines.findIndex(([id]) => id === lineId);
  const r = lines[index][3] + (index > 1 ? indentMix : 0);
  return 305 + r * 89;
}

function sourceLine(ctx, source, x, y) {
  const words = source.split(/(def|with|if | in |return)/).filter(Boolean);
  for (const word of words) {
    const isKeyword = /^(def|with|if | in |return)$/.test(word);
    type(ctx, word, x, y, 52, isKeyword ? '#793b82' : ink);
    x += ctx.measureText(word).width;
  }
}

function editor(ctx, state, indentMix, parked, stage, previous, step) {
  titleBar(ctx, false);
  // On the right is the debugger's live set representation. The code uses a single
  // canonical origin, so the display uses same-origin paths as the fixture keys.
  ctx.fillStyle = '#eee8f1';
  ctx.fillRect(1196, 168, 618, 709);
  line(ctx, 1196, 168, 1196, 877, '#c9bccf', 3);
  type(ctx, 'Watch', 1250, 261, 45, dim, 'Sans', 600);
  line(ctx, 1249, 286, 1764, 286, '#cbbfd2', 2);
  type(ctx, 'url', 1250, 368, 38, dim);
  type(ctx, JSON.stringify(state.A.url), 1250, 445, 60);
  type(ctx, 'seen', 1250, 554, 38, dim);
  const setText = state.seen.size ? '{' + [...state.seen].map(url => JSON.stringify(url)).join(', ') + '}' : 'set()';
  type(ctx, setText, 1250, 631, 60,
    state.seen.size ? ink : dim);
  if (indentMix > 0.97) {
    const held = state.owner !== null;
    type(ctx, 'lock', 1250, 726, 38, dim);
    type(ctx, held ? 'held by ' + state.owner : 'free', 1250, 802, 51,
      held ? colors[state.owner] : dim);
  }
  const x = 300;
  const space = 31.2;
  if (indentMix > 0.01) {
    ctx.save();
    ctx.globalAlpha = indentMix;
    const left = x + 4 * space;
    const top = row('lock', indentMix) - 56;
    const bottom = row('add', indentMix) + 17;
    ctx.fillStyle = state.owner ? '#e5ddf8' : '#eee8f6';
    ctx.fillRect(left - 21, top, 1143 - left, bottom - top);
    line(ctx, left - 21, top, left - 21, bottom, '#9a86bc', 6);
    ctx.restore();
  }
  for (const [id, text, baseIndent] of lines) {
    if (id === 'lock' && indentMix <= 0) continue;
    const enclosed = ['test', 'return', 'add'].includes(id);
    const col = baseIndent + (enclosed ? 4 * indentMix : 0);
    ctx.save();
    if (id === 'lock') ctx.globalAlpha = ease((indentMix - 0.56) / 0.44);
    sourceLine(ctx, text, x + space * col, row(id, indentMix));
    ctx.restore();
  }
  if (!parked) {
    for (const [who, left] of [['A', 147], ['B', 220]]) {
      const w = state[who];
      if (w.line === 'returned' && step === 1) continue;
      const visibleLine = ({ line }) => ({ network: 'fetch', returned: 'return' })[line] ?? line;
      const y = mix(row(visibleLine(previous[who]), indentMix), row(visibleLine(w), indentMix), step) - 19;
      ctx.save();
      if (w.line === 'returned') ctx.globalAlpha = 1 - step;
      flag(ctx, who, left, y, 0.96, w.blocked || w.line === 'network');
      ctx.restore();
    }
  }
  if (stage) {
    type(ctx, stage, 301, 835, 36, dim, 'Sans', 600);
  }
}

function network(ctx, state, now) {
  titleBar(ctx, true);
  type(ctx, 'repo.example', 163, 279, 64, ink);
  type(ctx, 'Elapsed time (ms)', 801, 267, 44, dim, 'Sans', 600);
  const from = 798;
  const perMs = 9.25;
  const maxTime = 100;
  const at = ms => from + perMs * ms;
  for (let ms = 0; ms <= maxTime; ms += 10) {
    const major = ms % 20 === 0;
    line(ctx, at(ms), major ? 336 : 350, at(ms), 786,
      major ? '#d1c9d5' : '#e6e0e5', major ? 2.5 : 1.5);
    if (major) type(ctx, String(ms), at(ms) - (ms === 100 ? 24 : 7), 323, 37, dim);
  }
  line(ctx, 156, 348, 1778, 348, '#bfb4c8', 3);
  line(ctx, 156, 574, 1778, 574, '#d6cdd7', 2);
  line(ctx, 156, 786, 1778, 786, '#bfb4c8', 3);
  for (const [index, who] of ['A', 'B'].entries()) {
    const center = 463 + index * 214;
    const req = state.requests.find(r => r.who === who);
    flag(ctx, who, 167, center, 1.28, !req);
    if (!req) continue;
    type(ctx, 'GET ' + req.url, 278, center + 23, 65, ink);
    const start = at(req.sent), end = at(Math.min(now, req.received));
    // A thin tail and a broad waiting span make the two in-flight intervals comparable.
    const top = center - 39;
    const length = Math.max(3, end - start);
    ctx.fillStyle = who === 'A' ? '#7669b7' : '#d67e60';
    ctx.fillRect(start, top, length, 77);
    ctx.fillStyle = colors[who];
    ctx.fillRect(start, top, Math.min(length, 9), 77);
    ctx.fillRect(start, center + 26, length, 12);
    if (now >= req.received) {
      line(ctx, end - 2, top - 8, end - 2, center + 44, colors[who], 8);
      if (length > 200) type(ctx, '200 OK', end - 191, center + 16, 47,
        who === 'A' ? '#ffffff' : '#432519');
    } else if (length > 56) {
      // The open tip is the only moving part of an outstanding request.
      ctx.save();
      ctx.beginPath(); ctx.rect(start, top, length, 77); ctx.clip();
      for (let offset = 0; offset < 56; offset += 14)
        line(ctx, end + 7 - offset, top, end - 21 - offset, center + 37,
          who === 'A' ? '#a79bdb' : '#f1b394', 6);
      ctx.restore();
    }
  }
}

function ramp(clock, phrase, width = 0.5) {
  return ease(clock.reveal(phrase, width));
}

function draw(ctx, clock) {
  laptop(ctx);
  const id = clock.beat.id;
  let t = 0;
  if (id === 'double-fetch') {
    // Enter on A's open connection. B's request arrives before the voice counts it.
    t = 6 + 14 * ease(clock.elapsed / 1.2) + 70 * ramp(clock, 'There it goes again', 1.75);
    network(ctx, run(false, unlocked, t), t);
    return;
  }
  if (id === 'overlapping-replies' || id === 'both-pages') {
    t = id === 'overlapping-replies'
      ? 7 + 9 * ramp(clock, 'Give B', 1.05) + 42 * ramp(clock, 'It can claim', 2.3)
      : 58 + 32 * ease(clock.elapsed / 0.9);
    network(ctx, run(true, locked, t), t);
    return;
  }
  let protectedRun = false, edit = 0, stage = '';
  if (id === 'pause-between-lines') {
    t = 0.3 + ramp(clock, 'A checks', 0.72) + ramp(clock, 'let B check', 0.72);
  } else if (id === 'one-entry-two-calls') {
    t = 2.3 + ramp(clock, 'A adds', 0.72) + ramp(clock, 'B adds', 0.72);
  } else if (id === 'move-the-indent') {
    edit = ramp(clock, 'a lock shared', 1.1);
  } else {
    protectedRun = true;
    edit = 1;
    if (id === 'inside-the-lock') {
      t = 0.15 + 0.63 * ramp(clock, 'A gets') + 0.52 * ramp(clock, 'Try to step')
        + ramp(clock, 'A checks', 0.72) + ramp(clock, 'adds the guide', 0.72) + ramp(clock, 'sends its request');
    } else {
      t = 4.3 + ramp(clock, 'Let B', 0.72) + ramp(clock, 'as B checks', 0.72) + ramp(clock, 'B takes the return', 0.72);
      if (t >= 7.24) stage = 'B returned';
    }
  }
  const schedule = protectedRun ? locked : unlocked;
  const state = run(protectedRun, schedule, t);
  const last = schedule.findLast(([at]) => at <= t);
  const previous = last ? run(protectedRun, schedule, last[0] - 0.01) : state;
  const step = last ? ease((t - last[0]) / 0.24) : 1;
  editor(ctx, state, edit, id === 'move-the-indent', stage, previous, step);
}

export default { title: 'How did both workers fetch the guide?', beats, draw, check };
