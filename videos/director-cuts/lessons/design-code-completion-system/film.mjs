import assert from 'node:assert/strict';
import { fresh } from '../../../films/design-code-completion-system/model.mjs';

const title = 'When can Tab make the cat wink?';

const beats = [
  {
    id: 'a-word-in-the-eye',
    say: "See the word shut slip between the parentheses? It would close the eye on the right. Both eyes are still open. Watch the word when I move up a line.",
    hold: 1.1,
  },
  {
    id: 'the-other-eye',
    say: "Press Tab. Both eyes stay open. The mark below is where the editor asked for the word. Moving up cleared the suggestion. Tab checks that saved position again before it can write.",
    hold: 0.9,
  },
  {
    id: 'round-trip',
    say: "Let's ask for another wink down here. While the model is working, go up one line, then back down. Look where the caret ended up. Could the editor tell we moved?",
    hold: 1.4,
  },
  {
    id: 'late-reply',
    say: "Here comes the word. Same file version, same parentheses. Look at the two numbers. Each move advanced the editor's counter. The reply still carries twenty. The editor is at twenty-two. They differ, so the word stays out of the code.",
    hold: 1.1,
  },
  {
    id: 'leave-the-caret',
    say: "Try once more and leave the caret there. This reply matches the current request and its snapshot, including the file, version, selection, and completion policy. There are the pale letters again. Which eye will close?",
    hold: 1.35,
  },
  {
    id: 'ink',
    say: "Press Tab and watch those letters. They've turned solid. The editor checked the snapshot and inserted the word in one operation. There's the wink.",
    hold: 3.1,
  },
];

const textAtStart = 'left  = eye()\nright = eye()';
const shut = '"shut"';
const leftHole = textAtStart.indexOf(')');
const rightHole = textAtStart.lastIndexOf(')');

// The sprite editor uses two ASCII lines and collapsed selections.
function point(epoch, cursor, version = 8) {
  return { document: 'wink.py', version, selection: { start: cursor, end: cursor }, cursor, policy: 1, epoch };
}

function move(state, cursor) {
  return { ...state, ghost: null, live: point(state.live.epoch + 1, cursor, state.live.version) };
}

function request(state) {
  const live = { ...state.live, epoch: state.live.epoch + 1 };
  return { ...state, live, reply: { captured: live, insert: shut }, ghost: null, arrived: false };
}

function receive(state) {
  const ghost = fresh(state.reply.captured, state.live) ? state.reply : null;
  return { ...state, arrived: true, ghost };
}

// This synchronous editor transaction compares and writes the same buffer state.
function apply(state, candidate) {
  if (!candidate || !fresh(candidate.captured, state.live)) return state;
  const { start, end } = candidate.captured.selection;
  const text = state.text.slice(0, start) + candidate.insert + state.text.slice(end);
  return {
    ...state, text, ghost: null,
    live: point(state.live.epoch + 1, start + candidate.insert.length, state.live.version + 1),
  };
}

const initial = { text: textAtStart, live: point(16, rightHole) };
const first = request(initial);
const painted = receive(first);
const up = move(painted, leftHole);
const missed = apply(up, painted.ghost);
const second = request(move(missed, rightHole));
const away = move(second, leftHole);
const back = move(away, rightHole);
const late = receive(back);
const third = request(late);
const ready = receive(third);
const saved = apply(ready, ready.ghost);

function eyeStates(text) {
  return text.split('\n').map(line => {
    const argument = line.slice(line.indexOf('(') + 1, line.indexOf(')'));
    assert.ok(argument === '' || argument === shut);
    return argument === shut ? 'closed' : 'open';
  });
}

function check() {
  assert.equal(painted.ghost.insert, shut);
  assert.equal(up.ghost, null);
  assert.equal(missed.text, textAtStart);
  assert.equal(back.live.version, second.reply.captured.version);
  assert.deepEqual(back.live.selection, second.reply.captured.selection);
  assert.deepEqual([second.reply.captured.epoch, back.live.epoch], [20, 22]);
  assert.equal(back.live.epoch - second.reply.captured.epoch, 2);
  assert.equal(late.ghost, null);
  assert.equal(apply(back, second.reply).text, textAtStart);
  for (const edit of [{ document: 'ears.py' }, { version: 9 }, { policy: 2 },
    { selection: { start: rightHole - 1, end: rightHole } }]) {
    const changed = { ...ready, live: { ...ready.live, ...edit } };
    assert.equal(receive(changed).ghost, null);
    assert.equal(apply(changed, ready.ghost).text, textAtStart);
  }
  assert.deepEqual(eyeStates(ready.text), ['open', 'open']);
  assert.equal(saved.text, 'left  = eye()\nright = eye("shut")');
  assert.deepEqual(eyeStates(saved.text), ['open', 'closed']);
  assert.equal(saved.live.cursor, rightHole + shut.length);
  assert.equal(saved.live.version, initial.live.version + 1);
  assert.equal(apply(saved, ready.ghost).text, saved.text);
}

const ink = '#302647';
const paper = '#fff8ea';
const violet = '#5540a4';
const ghostInk = '#8b6e99';
const warm = '#f17954';
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => x * x * (3 - 2 * x);

function frameState(c) {
  const cue = (phrase, span = 0.42) => c.reveal(phrase, span);
  const press = t => Math.sin(Math.PI * t);
  switch (c.index) {
    case 0: {
      const paint = clamp((c.elapsed + 0.06) / 0.4);
      const lift = cue('move up a line');
      return { s: lift > 0 ? up : painted, status: lift > 0 ? 'Cleared' : 'Ghost text', unfold: paint,
        marker: lift > 0, up: press(lift), move: lift, fromRow: 1 };
    }
    case 1: {
      const tap = clamp((c.elapsed + 0.02) / 0.65);
      return { s: tap > 0.25 ? missed : up, marker: true, tab: press(tap), status: tap > 0.25 ? '0 letters inserted' : 'Cleared' };
    }
    case 2: {
      const ask = cue('another wink down here');
      const lift = cue('go up one line');
      const drop = cue('then back down');
      const s = drop > 0 ? back : lift > 0 ? away : ask > 0 ? second : missed;
      return { s, marker: true, detail: ease(cue('While the model is working', 0.95)),
        status: s === missed ? '0 letters inserted' : 'In flight',
        up: press(lift), down: Math.max(press(ask), press(drop)),
        move: drop > 0 ? drop : lift > 0 ? lift : ask, fromRow: lift > 0 && drop === 0 ? 1 : 0 };
    }
    case 3: {
      const arrive = clamp((c.elapsed + 0.04) / 0.6);
      const discard = cue('They differ');
      return { s: arrive > 0.12 ? late : back, status: discard > 0 ? 'Dropped' : arrive > 0.12 ? 'Reply arrived' : 'In flight',
        detail: 1, marker: true, mismatch: cue('the two numbers'), payload: arrive, dropped: discard };
    }
    case 4: {
      const ask = cue('Try once more');
      const arrives = cue('This reply matches');
      return { s: arrives > 0 ? ready : ask > 0 ? third : late, status: arrives > 0 ? 'Ghost text' : ask > 0 ? 'In flight' : 'Dropped',
        detail: 1 - ease(cue('leave the caret there', 1.05)), unfold: arrives, marker: arrives === 0 };
    }
    default: {
      const tap = clamp((c.elapsed + 0.04) / 0.65);
      return { s: tap > 0.23 ? saved : ready, tab: press(tap), status: tap > 0.23 ? 'Inserted' : 'Ghost text',
        acceptedAt: tap > 0.23 ? ready.live : null, close: clamp((c.elapsed - 0.11) / 0.2) };
    }
  }
}

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function label(ctx, text, x, y, size, color = ink, family = 'Lesson Sans', weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "${family}"`;
  ctx.fillText(text, x, y);
}

// Rasterize the sprite on its own 52 by 46 editing grid. All strokes snap to texels.
function buildCat(eyes, blinkStep) {
  const W = 52, H = 46;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const outline = '#38283c', red = '#af4a3d', orange = '#ed8550', gold = '#ffb76b';
  const cream = '#ffdf9b', pink = '#e17f81', white = '#fff1c5', teal = '#459b9a';
  function rect(x, y, w, h, c) {
    for (let r = y; r < y + h; r++) for (let i = x; i < x + w; i++) grid[r][i] = c;
  }
  function poly(c, points) {
    for (let row = 0; row < H; row++) {
      const y = row + 0.5, hits = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) hits.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i < hits.length; i += 2) {
        const start = Math.ceil(hits[i] - 0.5);
        rect(start, row, Math.ceil(hits[i + 1] - 0.5) - start, 1, c);
      }
    }
  }
  const head = [[4,2],[8,2],[18,10],[22,9],[24,7],[25,9],[29,7],[29,9],[34,10],[44,1],[48,1],
    [48,11],[46,18],[47,21],[49,23],[48,24],[51,27],[48,28],[50,30],[46,31],[47,33],[42,36],
    [39,38],[32,40],[29,41],[21,41],[15,39],[10,37],[5,34],[7,32],[2,31],[4,28],[1,27],[4,24],[3,23],[6,19],[4,14]];
  poly(outline, head);
  poly(orange, [[6,4],[8,4],[17,12],[21,11],[24,9],[24,11],[28,9],[28,11],[35,12],[45,3],[46,3],
    [46,12],[44,18],[46,22],[45,24],[49,26],[46,27],[47,30],[43,30],[45,33],[40,35],[36,38],
    [28,39],[21,39],[14,37],[7,33],[9,31],[4,30],[6,27],[3,26],[7,24],[6,22],[8,19]]);
  poly(red, [[7,5],[15,13],[9,18],[8,13]]);
  poly(pink, [[8,7],[14,13],[10,15]]);
  poly(red, [[37,12],[45,4],[44,15],[42,18]]);
  poly(pink, [[39,12],[44,7],[43,15]]);
  poly(gold, [[9,20],[17,13],[23,12],[33,13],[42,20],[40,29],[34,35],[25,38],[14,34],[9,29]]);
  // Three forehead stripes and the sweep of fur beneath each ear.
  poly(red, [[17,12],[20,11],[22,16],[20,16]]);
  poly(red, [[23,11],[28,10],[26,18],[24,16]]);
  poly(red, [[30,12],[34,12],[31,16],[29,17]]);
  for (const flip of [false, true]) {
    const xx = x => flip ? 52 - x : x;
    poly(red, [[7,20],[12,19],[10,21],[7,22]].map(([x,y]) => [xx(x),y]));
    poly(red, [[5,24],[11,23],[8,26],[5,26]].map(([x,y]) => [xx(x),y]));
    poly(cream, [[11,30],[18,29],[23,26],[26,28],[26,36],[20,38],[14,36],[8,32]].map(([x,y]) => [xx(x),y]));
  }
  for (const [i, x] of [12, 31].entries()) {
    const closed = eyes[i] === 'closed' ? blinkStep : 0;
    if (closed < 2) {
      const top = closed === 1 ? 24 : 21;
      const h = 29 - top;
      rect(x + 1, top - 1, 7, h + 1, outline);
      rect(x, top, 9, h - 1, outline);
      rect(x + 1, top + 1, 7, h - 2, teal);
      rect(x + 5, top + 1, 2, h - 2, '#91c6ad');
      rect(x + 3, top, 3, h - 1, outline);
      rect(x + 2, top, 2, closed === 1 ? 1 : 2, white);
      rect(x + 6, 26, 1, 1, white);
    } else {
      rect(x - 1, 25, 2, 2, outline);
      rect(x + 1, 24, 2, 2, outline);
      rect(x + 3, 23, 4, 2, outline);
      rect(x + 7, 24, 2, 2, outline);
      rect(x + 9, 25, 1, 2, outline);
      rect(x + 2, 27, 5, 1, pink);
    }
  }
  rect(23, 29, 6, 2, outline); rect(24, 29, 4, 1, pink);
  rect(24, 31, 4, 1, outline); rect(25, 32, 2, 2, outline);
  rect(22, 34, 3, 1, outline); rect(27, 34, 3, 1, outline);
  rect(20, 33, 2, 1, outline); rect(30, 33, 2, 1, outline);
  for (const [x,y] of [[10,29],[12,31],[15,30],[37,30],[40,29],[39,31]]) rect(x,y,1,1,red);
  rect(0, 28, 6, 1, outline); rect(4, 29, 4, 1, outline);
  rect(44, 29, 4, 1, outline); rect(47, 28, 5, 1, outline);
  rect(2, 34, 4, 1, outline); rect(6, 33, 5, 1, outline);
  rect(41, 33, 5, 1, outline); rect(46, 34, 4, 1, outline);
  const colors = new Map();
  for (const [y, row] of grid.entries()) {
    for (let x = 0; x < W;) {
      const color = row[x], start = x++;
      while (x < W && row[x] === color) x++;
      if (!color) continue;
      if (!colors.has(color)) colors.set(color, []);
      colors.get(color).push([start, y, x - start]);
    }
  }
  return colors;
}

const cats = [buildCat(eyeStates(textAtStart), 0), buildCat(eyeStates(saved.text), 1), buildCat(eyeStates(saved.text), 2)];

function previewCat(ctx, frame) {
  const x = 1066, y = 193, w = 764, h = 562;
  const step = eyeStates(frame.s.text)[1] === 'closed' ? Math.min(2, Math.floor((frame.close ?? 1) * 3)) : 0;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  box(ctx, x, y, w, h, '#b7cad9');
  const square = 44;
  for (let r = 0; r * square < h; r++)
    for (let col = r % 2; col * square < w; col += 2)
      box(ctx, x + col * square, y + r * square, square, square, '#c8d9e2');
  const pixel = 12;
  ctx.translate(Math.round(x + w / 2 - 26 * pixel), Math.round(y + h / 2 - 21 * pixel));
  ctx.scale(pixel, pixel);
  for (const [color, runs] of cats[step]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [rx, ry, rw] of runs) ctx.rect(rx, ry, rw, 1);
    ctx.fill();
  }
  ctx.restore();
}

function drawCode(ctx, frame) {
  const { s } = frame;
  const activeRow = s.live.cursor >= textAtStart.indexOf('\n') + 1 ? 1 : 0;
  const yFor = row => 329 + row * 131;
  const font = 'Lesson Mono', size = 62;
  ctx.font = `400 ${size}px "${font}"`;
  const cell = ctx.measureText('M').width;
  const textX = 180;
  const moving = frame.move > 0 && frame.move < 1;
  const rowY = moving ? yFor(frame.fromRow) + (yFor(activeRow) - yFor(frame.fromRow)) * ease(frame.move) : yFor(activeRow);
  box(ctx, 90, rowY - 75, 976, 106, '#f0e8ef');
  box(ctx, 90, rowY - 75, 8, 106, violet);
  for (const [i, line] of s.text.split('\n').entries()) {
    const y = yFor(i), hole = line.indexOf('(') + 1;
    const inline = s.ghost && i === activeRow ? s.ghost.insert : '';
    label(ctx, String(i + 1), 119, y - 4, 34, '#87798a', font);
    label(ctx, line.slice(0, 6), textX, y, size, ink, font);
    label(ctx, '= ', textX + 6 * cell, y, size, '#806d84', font);
    label(ctx, 'eye', textX + 8 * cell, y, size, '#65539c', font);
    label(ctx, '(', textX + 11 * cell, y, size, ink, font);
    const left = textX + hole * cell;
    if (inline) {
      const f = ease(frame.unfold ?? 1);
      ctx.save(); ctx.beginPath(); ctx.rect(left, y - 74, cell * inline.length * f, 90); ctx.clip();
      label(ctx, inline, left, y, size, ghostInk, font);
      ctx.restore();
      label(ctx, ')', left + cell * inline.length * f, y, size, ink, font);
    } else {
      const tail = line.slice(hole, -1);
      label(ctx, tail, left, y, size, '#98432b', font);
      label(ctx, ')', left + tail.length * cell, y, size, ink, font);
    }
  }
  const anchorX = textX + 12 * cell;
  if (frame.marker) {
    const y = yFor(1);
    box(ctx, anchorX - 2, y + 9, 4, 30, warm);
    box(ctx, anchorX - 12, y + 8, 24, 5, warm);
    box(ctx, anchorX - 2, y + 36, 31, 4, warm);
    label(ctx, 'request position', anchorX + 39, y + 46, 33, '#995641');
  }
  const rowStart = activeRow === 1 ? s.text.indexOf('\n') + 1 : 0;
  const caretX = textX + (s.live.cursor - rowStart) * cell;
  box(ctx, caretX - 4, rowY - 64, 7, 76, violet);
  box(ctx, caretX - 8, rowY + 8, 15, 5, violet);
}

function trace(ctx, f) {
  const { s } = f;
  box(ctx, 90, 565, 976, 190, '#e9e1df');
  box(ctx, 90, 565, 976, 3, '#c1b0b9');
  label(ctx, s.arrived ? 'Reply' : 'Request', 124, 622, 34, '#5c4f63');
  label(ctx, f.acceptedAt ? 'Editor at Tab' : 'Editor', 416, 622, 34, '#5c4f63');
  const tint = f.mismatch ? '#9f4334' : ink;
  label(ctx, String(s.reply.captured.epoch), 121, 697, 72, tint, 'Lesson Mono');
  label(ctx, String((f.acceptedAt || s.live).epoch), 412, 697, 72, violet, 'Lesson Mono');
  if (f.mismatch) {
    ctx.globalAlpha = f.mismatch;
    label(ctx, '≠', 291, 692, 67, tint);
    ctx.globalAlpha = 1;
  }
  const payload = f.payload ?? 0;
  if (payload && (f.dropped ?? 0) < 1) {
    ctx.save();
    ctx.globalAlpha = payload * (1 - (f.dropped || 0));
    label(ctx, s.reply.insert, 673, 624, 39, ghostInk, 'Lesson Mono');
    ctx.restore();
  }
  label(ctx, f.status, 670, 690, 34, ink, 'Lesson Sans', 600);
}

function key(ctx, x, width, glyph, down) {
  const y = 804, depth = 11 * (down || 0);
  rounded(ctx, x - 4, y + 6, width + 8, 84, 15, '#57476c');
  rounded(ctx, x, y + 4, width, 80, 13, '#a38bb6');
  rounded(ctx, x, y + depth, width, 69, 12, '#f4e9e2');
  rounded(ctx, x + 5, y + depth + 2, width - 10, 5, 2, '#fff6e7');
  ctx.textAlign = 'center';
  label(ctx, glyph, x + width / 2, y + 48 + depth, 34, ink, 'Lesson Sans', 600);
  ctx.textAlign = 'left';
}

function draw(ctx, clock) {
  const f = frameState(clock);
  const sky = ctx.createLinearGradient(0, 0, 1300, 1080);
  sky.addColorStop(0, '#f4c9b2'); sky.addColorStop(1, '#c98b9f');
  box(ctx, 0, 0, 1920, 1080, sky);
  ctx.save();
  const detail = f.detail ?? 0;
  const scale = 1 + 1.02 * detail;
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-(960 - 384 * detail), -(540 - 12 * detail));
  // A shallow bevel and a contact shadow seat the editor on the desk.
  ctx.save(); ctx.shadowColor = '#825c7d'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 18;
  rounded(ctx, 46, 63, 1828, 886, 44, '#6e5783'); ctx.restore();
  rounded(ctx, 46, 48, 1828, 888, 44, '#bea8d1');
  rounded(ctx, 53, 50, 1814, 879, 40, '#dbc8e1');
  rounded(ctx, 62, 59, 1796, 851, 33, '#cebad9');
  rounded(ctx, 77, 91, 1766, 677, 15, '#685576');
  box(ctx, 90, 106, 1740, 649, paper);
  box(ctx, 90, 106, 1740, 87, '#f7ecd9');
  box(ctx, 90, 188, 1740, 5, ink);
  label(ctx, 'wink.py', 127, 165, 44, ink, 'Lesson Mono');
  label(ctx, 'version ' + f.s.live.version, 811, 163, 34, '#64586b', 'Lesson Mono');
  label(ctx, 'Live sprite', 1103, 165, 42, ink, 'Lesson Sans', 600);
  drawCode(ctx, f);
  trace(ctx, f);
  previewCat(ctx, f);
  box(ctx, 1060, 106, 6, 649, ink);

  key(ctx, 116, 158, 'Tab', f.tab);
  key(ctx, 299, 104, '↑', f.up);
  key(ctx, 420, 104, '↓', f.down);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 23; i++) {
      const x = 1508 + i * 12 + (row % 2) * 6, y = 834 + row * 12;
      rounded(ctx, x, y + 2, 6, 6, 3, '#e4d2e7');
      rounded(ctx, x, y, 6, 6, 3, '#947da3');
    }
  }
  ctx.restore();
}

export default { title, beats, draw, check };
