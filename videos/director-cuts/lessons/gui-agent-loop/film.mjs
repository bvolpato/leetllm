import assert from 'node:assert/strict';
import { paintDrawing, paintThumbnail } from './kingfisher.mjs';

const title = 'Where would this click land?';
const beats = [
  {
    id: 'take-aim',
    say: "Open the drawing called Dive. That's the agent's job. Its first screenshot puts Dive right here, under the gold pointer.",
    hold: 0.9,
  },
  {
    id: 'insert-drawing',
    say: "Keep your finger there. A new drawing just slid into the list. Which drawing would that same click open now?",
    hold: 1.7,
  },
  {
    id: 'withhold',
    say: "Lift. The point came from screenshot twelve. The host controls the mouse, and its live view has moved on to thirteen. It drops the old proposal. Perch stays open.",
    hold: 0.8,
  },
  {
    id: 'look-again',
    say: "Look again with the agent. In the fresh screenshot there's one drawing named Dive, one row lower. The host checks that opening it is allowed and the row is ready to click.",
    hold: 0.65,
  },
  {
    id: 'open-dive',
    say: "Watch the big canvas. The branch is empty. One click opened the drawing the agent found in the new screenshot.",
    hold: 0.95,
  },
  {
    id: 'read-back',
    say: "From one last screenshot, the agent reads the name beneath the canvas. Dive. That's the drawing we came for.",
    hold: 2.4,
  },
];

const pane = { x: 1238, width: 548, first: 249, pitch: 160, height: 150 };
const initialNames = ['Perch', 'Dive'];
const newNames = ['Perch', 'Lift', 'Dive'];
const surface = (version, names, open = 'Perch', clicks = 0) => ({
  version, open, clicks,
  rows: names.map((name, index) => ({ name, enabled: true, top: pane.first + index * pane.pitch })),
});
const initial = surface(12, initialNames);
const inserted = surface(13, newNames);
const task = { action: 'open', name: 'Dive' };

function snapshot(editor) {
  return { version: editor.version, open: editor.open, rows: editor.rows.map(row => ({ ...row })) };
}

function target(view, goal) {
  const matches = view.rows.filter(row => row.name === goal.name);
  if (matches.length !== 1 || !matches[0].enabled) return null;
  return {
    ...goal,
    version: view.version,
    x: pane.x + pane.width - 116,
    y: matches[0].top + pane.height / 2,
  };
}

function rowAt(editor, point) {
  if (point.x < pane.x || point.x >= pane.x + pane.width) return undefined;
  return editor.rows.find(row => point.y >= row.top && point.y < row.top + pane.height);
}

function dispatch(editor, proposal) {
  if (!proposal || proposal.version !== editor.version) return editor;
  const hit = rowAt(editor, proposal);
  if (proposal.action !== task.action || proposal.name !== task.name || !hit?.enabled || hit.name !== proposal.name) return editor;
  return { ...editor, open: hit.name, version: editor.version + 1, clicks: editor.clicks + 1 };
}

const firstView = snapshot(initial);
const oldPoint = target(firstView, task);
const withheld = dispatch(inserted, oldPoint);
const freshView = snapshot(withheld);
const newPoint = target(freshView, task);
const opened = dispatch(withheld, newPoint);
const lastView = snapshot(opened);

function check() {
  assert.equal(rowAt(initial, oldPoint).name, task.name);
  assert.equal(rowAt(inserted, oldPoint).name, 'Lift');
  assert.equal(withheld.clicks, 0);
  assert.equal(snapshot(withheld).open, 'Perch');
  assert.equal(freshView.version, inserted.version);
  assert.equal(newPoint.x, oldPoint.x);
  assert.equal(newPoint.y - oldPoint.y, pane.pitch);
  assert.equal(rowAt(inserted, newPoint).name, task.name);
  assert.equal(opened.clicks, 1);
  assert.equal(lastView.open, task.name);
  assert.ok(lastView.version > freshView.version);
  assert.equal(target(snapshot(surface(13, ['Dive', 'Dive'])), task), null);
  const disabled = { ...freshView, rows: freshView.rows.map(row => ({ ...row, enabled: false })) };
  assert.equal(target(disabled, task), null);
  assert.equal(dispatch(withheld, { ...newPoint, action: 'erase' }).clicks, 0);
}

const color = {
  desk: '#c7b2c0', grain: '#b49bae', shadow: '#977f99', ink: '#352e49',
  violet: '#5c506e', line: '#ac99a8', paper: '#f0e7db', pink: '#e5ced0',
  bright: '#fff8e7', aqua: '#92e2d3', amber: '#ffc979',
};
const clamp = n => Math.max(0, Math.min(1, n));
function smooth(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
const mix = (a, b, u) => a + (b - a) * u;

function label(ctx, text, x, y, size, fill, font = 'Sans', weight = 500) {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px "Lesson ${font}"`;
  ctx.fillText(text, x, y);
}
function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}
function outline(ctx, x, y, w, h, fill, line = 3) {
  ctx.strokeStyle = fill;
  ctx.lineWidth = line;
  ctx.strokeRect(x, y, w, h);
}

function motion(clock) {
  const { index, elapsed } = clock;
  const aim = index === 0 ? smooth(elapsed / 1.35) : 1;
  const splice = index < 1 ? 0 : index === 1 ? smooth(elapsed / 1.1) : 1;
  const block = index < 2 ? 0 : index === 2 ? smooth(clock.reveal('It drops', 0.48)) : 1;
  const capture = index < 3 ? 0 : index === 3 ? smooth(clock.reveal('Look again', 0.72)) : 1;
  const resolve = index < 3 ? 0 : index === 3 ? smooth(clock.reveal('one drawing named Dive', 1.05)) : 1;
  const press = index < 4 ? 0 : index === 4 ? clamp((elapsed - 0.65) / 0.70) : 1;
  const read = index < 5 ? 0 : index === 5 ? smooth(clock.reveal('one last screenshot', 0.65)) : 1;
  const approach = index === 0 ? smooth(clock.reveal('Its first screenshot', 1.35)) : 1;
  const pullBack = index < 3 ? 0 : index === 3 ? smooth(clock.reveal('The host checks', 2.15)) : 1;
  const live = press > 0.28 ? opened : splice > 0 ? inserted : initial;
  const seen = read === 1 ? lastView : capture === 1 ? freshView : firstView;
  return { aim, splice, block, capture, resolve, press, read, live, seen, zoom: 1 + 0.38 * approach * (1 - pullBack) };
}

function desktop(ctx) {
  rect(ctx, 0, 0, 1920, 1080, color.desk);
  // A sparse, repeating desktop weave is visible only around the application.
  ctx.fillStyle = color.grain;
  for (let y = 0; y < 1080; y += 16) {
    for (let x = (y % 32 ? 8 : 0); x < 1920; x += 16) {
      if (x < 75 || x > 1845 || y < 42 || y > 926) ctx.fillRect(x, y, 3, 3);
    }
  }
}

function drawEditor(ctx, m) {
  rect(ctx, 83, 60, 1770, 771, color.shadow);
  rect(ctx, 72, 49, 1770, 771, color.ink);
  rect(ctx, 78, 55, 1758, 759, color.paper);
  rect(ctx, 81, 58, 1752, 70, color.violet);
  // Pixel nib and swatch in the title bar.
  rect(ctx, 106, 74, 45, 38, color.bright);
  rect(ctx, 113, 88, 12, 16, '#21a6af');
  rect(ctx, 125, 82, 10, 17, '#1b7497');
  rect(ctx, 135, 78, 8, 14, color.ink);
  label(ctx, 'Kingfisher.sprite', 174, 105, 37, color.bright, 'Mono');
  for (let i = 0; i < 4; i++) rect(ctx, 600, 78 + 9 * i, 1182, 2, '#93859d');

  const x = 132, y = 160, w = 1026, h = 570;
  rect(ctx, x - 6, y - 6, w + 12, h + 12, color.ink);
  paintDrawing(ctx, m.live.open, x, y, w, h);
  label(ctx, 'Open drawing', x, 787, 31, color.violet);
  label(ctx, m.live.open, x + 230, 789, 46, color.ink, 'Sans', 700);
  if (m.read > 0) rect(ctx, x + 230, 798, ctx.measureText(m.live.open).width * m.read, 6, '#157e7d');
  ['#25324c','#165474','#127caa','#31aebb','#8ae5d0','#fff1c9','#faac57','#c65c3d'].forEach((tone, i) => {
    rect(ctx, 834 + i * 41, 756, 37, 36, tone);
    outline(ctx, 834 + i * 41, 756, 37, 36, color.line, 1);
  });

  rect(ctx, 1199, 150, 3, 647, color.line);
  label(ctx, 'Drawings', pane.x + 3, 213, 48, color.ink, 'Sans', 700);
  rect(ctx, pane.x, 229, pane.width, 3, color.line);
  const drawRow = (name, top) => {
    const selected = m.live.open === name;
    rect(ctx, pane.x, top, pane.width, pane.height, selected ? color.violet : '#e4d9d6');
    const thumbX = pane.x + 13, thumbY = top + 12;
    rect(ctx, thumbX - 2, thumbY - 2, 167, 130, color.ink);
    paintThumbnail(ctx, name, thumbX, thumbY, 163, 126);
    label(ctx, name, pane.x + 197, top + 91, 52, selected ? color.bright : color.ink, 'Sans', 600);
    if (selected) {
      const sx = pane.x + pane.width - 51, sy = top + 65;
      rect(ctx, sx, sy + 9, 6, 9, color.aqua);
      rect(ctx, sx + 6, sy + 15, 6, 9, color.aqua);
      for (let i = 0; i < 4; i++) rect(ctx, sx + 12 + i * 5, sy + 12 - i * 5, 6, 9, color.aqua);
    }
  };
  drawRow('Perch', pane.first);
  if (m.splice > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pane.x, pane.first + pane.pitch, pane.width, pane.pitch * m.splice);
    ctx.clip();
    drawRow('Lift', pane.first + pane.pitch - 42 * (1 - m.splice));
    ctx.restore();
  }
  drawRow('Dive', pane.first + pane.pitch * (1 + m.splice));

  // A single sweep records the newly observed list while the live editor stays put.
  if (m.capture > 0 && m.capture < 1) {
    const top = pane.first + (pane.pitch * 3 - 8) * m.capture;
    rect(ctx, pane.x - 5, top, pane.width + 10, 6, '#007f83');
    rect(ctx, pane.x - 5, top - 4, pane.width + 10, 4, color.bright);
  }
}

const arrow = [
  'X', 'XX', 'XOX', 'XOOX', 'XOOOX', 'XOOOOX', 'XOOOOOX', 'XOOOOOOX',
  'XOOOOOOOX', 'XOOOOOOOOX', 'XOOOOOOOOOX', 'XOOOOOXXXXX', 'XOOXOOX',
  'XOX XOOX', 'XX  XOOX', 'X    XOOX', '     XOOX', '      XX',
];
function drawPointer(ctx, m) {
  const visible = m.resolve > 0 ? Math.min(1, 4 * m.resolve) * (1 - m.read) : 1 - m.block;
  if (!visible) return;
  // A rejected proposal disappears. The next pointer comes from a new observation.
  const x = mix(1790, oldPoint.x, m.aim);
  const y = mix(mix(689, oldPoint.y, m.aim), newPoint.y, m.resolve);
  ctx.save();
  ctx.globalAlpha = visible;
  if (m.press > 0 && m.press < 1) {
    const radius = 13 + 75 * m.press;
    ctx.strokeStyle = color.bright;
    ctx.lineWidth = 7 * (1 - m.press);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.translate(Math.round(x), Math.round(y));
  const step = 5;
  for (const [j, line] of arrow.entries()) {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') continue;
      rect(ctx, i * step + 5, j * step + 5, step, step, '#51475b');
    }
  }
  for (const [j, line] of arrow.entries()) {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ') rect(ctx, i * step, j * step, step, step, line[i] === 'X' ? color.ink : color.amber);
    }
  }
  ctx.restore();
}

function drawHost(ctx, m) {
  const y = 840, h = 88;
  rect(ctx, 72, y, 1770, h, color.ink);
  label(ctx, 'Agent host', 111, y + 58, 40, color.bright, 'Sans', 700);
  rect(ctx, 366, y + 15, 2, h - 30, '#736583');
  label(ctx, 'Screenshot', 400, y + 57, 38, color.pink);
  label(ctx, String(m.seen.version), 620, y + 59, 44, color.bright, 'Mono');
  label(ctx, 'Live view', 735, y + 57, 38, color.pink);
  const changed = m.live.version !== m.seen.version;
  if (changed) rect(ctx, 909, y + 12, 75, 64, color.amber);
  label(ctx, String(m.live.version), 920, y + 59, 44, changed ? color.ink : color.bright, 'Mono');
  rect(ctx, 1041, y + 15, 2, h - 30, '#736583');
  let status = 'Proposed point', ink = color.amber;
  if (m.read === 1 && m.seen.open === task.name) { status = 'Verified'; ink = color.aqua; }
  else if (m.live === opened) { status = 'Click sent'; ink = color.aqua; }
  else if (m.capture === 1 && m.resolve === 0) { status = 'New screenshot'; ink = color.aqua; }
  else if (m.block > 0.5 && m.resolve === 0) { status = 'Click withheld'; ink = color.amber; }
  label(ctx, status, 1081, y + 57, 39, ink, 'Sans', 600);
  label(ctx, `Clicks  ${m.live.clicks}`, 1540, y + 57, 41, color.bright, 'Mono');
}

function draw(ctx, clock) {
  const m = motion(clock);
  ctx.save();
  desktop(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1920, 832);
  ctx.clip();
  ctx.translate(1625, 435);
  ctx.scale(m.zoom, m.zoom);
  ctx.translate(-1625, -435);
  drawEditor(ctx, m);
  drawPointer(ctx, m);
  ctx.restore();
  drawHost(ctx, m);
  ctx.restore();
}

export default { title, beats, draw, check };
