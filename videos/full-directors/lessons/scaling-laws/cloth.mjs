// Scaling Laws, c01. The course calls drawOpening with a 1920 × 1080 lesson clock.
import { createCanvas } from '@napi-rs/canvas';
import { layoutCellGrid } from 'vizmatic';

const pitch = 36;
const left = 1040;
const bottom = 766;
const warp = '#52436f';
const weft = '#994a32';
const ink = '#342b35';
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => v * v * (3 - 2 * v);
const mix = (a, b, v) => a + (b - a) * v;

function stroke(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function seed(n) {
  let value = (n + 1) * 2654435761 >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

// The outer fibers bend back into the yarn at each end of a crossing.
function yarn(ctx, x, y, vertical, id, over) {
  const rand = seed(id * 2 + Number(vertical));
  const broad = (over ? 0.94 : 0.82) + rand() * 0.035;
  const hue = vertical ? 261 + rand() * 7 : 12 + rand() * 5;
  const sat = vertical ? 25 : 55;
  const light = (vertical ? 46 : 52) + (rand() - 0.5) * 7 - (over ? 0 : 10);
  const shade = (delta) => `hsl(${hue}, ${sat}%, ${light + delta}%)`;
  ctx.save();
  ctx.translate(x, y);
  if (vertical) ctx.rotate(Math.PI / 2);
  const band = ctx.createLinearGradient(0, -broad / 2, 0, broad / 2);
  for (const [position, change] of [[0,-22],[0.1,-7],[0.34,11],[0.67,2],[0.93,-11],[1,-22]]) {
    band.addColorStop(position, shade(change));
  }
  ctx.fillStyle = band;
  ctx.fillRect(-0.5, -broad / 2, 1, broad);
  for (let i = 1; i <= 13; i++) {
    const offset = (i / 14 - 0.5) * broad;
    const curl = (rand() - 0.5) * 0.065;
    ctx.beginPath();
    ctx.moveTo(-0.5, offset + curl);
    ctx.bezierCurveTo(-0.19, offset - curl, 0.19, offset - curl, 0.5, offset + curl);
    ctx.strokeStyle = shade(i % 3 === 0 ? -17 : 16);
    ctx.globalAlpha = 0.34 + rand() * 0.35;
    ctx.lineWidth = 0.009 + rand() * 0.009;
    ctx.stroke();
  }
  if (over) {
    const crown = ctx.createLinearGradient(-0.5, 0, 0.5, 0);
    for (const [t, a] of [[0,0.36],[0.12,0.1],[0.28,0],[0.73,0],[0.90,0.09],[1,0.35]]) {
      crown.addColorStop(t, `rgba(36,18,29,${a})`);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = crown;
    ctx.fillRect(-0.5, -broad / 2, 1, broad);
  }
  ctx.restore();
}

// Store the complete weave once. Every later crop uses the original stitch addresses.
export function makeCloth(columns, rows, { cell = 48, markedRows = 0 } = {}) {
  const texture = createCanvas(columns * cell, rows * cell);
  const ctx = texture.getContext('2d');
  const grid = layoutCellGrid({ x: 0, y: 0, width: columns, height: rows, rows, columns });
  ctx.scale(cell, cell);
  ctx.fillStyle = '#604448';
  ctx.fillRect(0, 0, columns, rows);
  for (const [r, row] of grid.cells.entries()) {
    for (const [c, { x, y }] of row.entries()) {
      const id = r * columns + c;
      const vertical = (r + c) % 2 === 0;
      yarn(ctx, x + 0.5, y + 0.5, !vertical, id, false);
      yarn(ctx, x + 0.5, y + 0.5, vertical, id, true);
    }
  }

  // An ivory chain along one cut edge ends in three ochre repair stitches.
  if (markedRows > 0) {
    ctx.lineCap = 'round';
    for (let r = 0; r < markedRows; r++) {
      const x = columns - 0.11;
      stroke(ctx, x - 0.02, r + 0.09, x + 0.02, r + 0.83, '#6b482c', 0.11);
      stroke(ctx, x - 0.033, r + 0.06, x + 0.007, r + 0.80, '#f1dbae', 0.064);
    }
    for (let i = 0; i < 3; i++) {
      const x = columns - 2.64 + i * 0.78;
      stroke(ctx, x, 1.76, x + 0.35, 1.03, '#624129', 0.22);
      stroke(ctx, x, 1.70, x + 0.34, 1.02, '#ffe3a0', 0.17);
    }
  }
  return { columns, rows, cell, texture };
}

let firstCloth;
export function openingCloth() {
  return firstCloth ??= makeCloth(5, 20, { cell: 88, markedRows: 10 });
}

// x and y locate the top left of the selected rows in the destination.
export function drawCloth(ctx, cloth, { x, y, width, height, firstRow = 0, rows = cloth.rows - firstRow }) {
  ctx.drawImage(cloth.texture, 0, firstRow * cloth.cell, cloth.texture.width, rows * cloth.cell,
    x, y, width, height);
}

function panel(firstRow, x, y, cell) {
  const { columns, rows } = openingCloth();
  return { firstRow, rows: rows / 2, x, y, width: columns * cell, height: rows / 2 * cell };
}

// The two halves keep their source row addresses even after their destination changes.
export function openingState(clock) {
  const id = clock.beat.id;
  if (!['c01-b01', 'c01-b02', 'c01-b03'].includes(id)) throw new Error('Expected a Scaling Laws c01 beat.');
  const intro = id === 'c01-b01';
  const answer = id === 'c01-b03';
  const view = intro ? ease(clock.reveal('hundred squares', 2.80)) : 1;
  const cell = mix(180, pitch, view);
  const x = mix(825, left, view);
  const foot = bottom;
  const sinceTen = answer ? 8 * clock.reveal('Ten rows', 8) : 0;
  const across = ease(clamp(sinceTen / 3.03));
  const lower = answer ? clock.reveal('lower it beside', 1.68) : 0;
  const down = ease(Math.min(lower, clamp((sinceTen - 3.03) / 1.68)));
  const { columns, rows } = openingCloth();
  const fixed = panel(rows / 2, x, foot - rows / 2 * cell, cell);
  const moving = panel(0, x + fixed.width * across, foot - rows * cell + fixed.height * down, cell);
  const settled = down === 1;
  const travelling = across > 0 && !settled;
  const weightAlpha = intro ? ease(clock.reveal('five units of learned weights', 0.35)) : 1;
  const tokenAlpha = intro ? ease(clock.reveal('twenty units of training tokens', 0.35)) : 1;
  const measures = travelling ? null : {
    x, y: settled ? fixed.y : moving.y, width: settled ? fixed.width + moving.width : fixed.width,
    height: settled ? fixed.height : fixed.height + moving.height,
    columns: settled ? columns * 2 : columns, rows: settled ? fixed.rows : rows,
    weightAlpha, tokenAlpha,
  };
  let question = 0;
  if (id === 'c01-b02') question = ease(clock.reveal('At ten columns wide', 0.40));
  if (answer) question = 1 - ease(clamp(sinceTen / 0.32));
  const compare = settled ? ease(clock.reveal('Both shapes', 0.60)) : 0;
  // The light follows the five crossings of the last row, then rests on the last stitch.
  const count = intro ? ease(clock.reveal('Across the bottom', 1.95)) : 1;
  const rowLight = intro ? ease(clock.reveal('Across the bottom', 0.27))
    * (1 - ease(clock.reveal('Up the side', 0.45))) : 0;
  const reference = { x: 720, y: bottom - rows * pitch, width: columns * pitch, height: rows * pitch, columns, rows };
  return { fixed, moving, measures, question, compare, count, rowLight, cell, squares: columns * rows, reference };
}

function type(ctx, value, x, y, size, color, align = 'left', family = 'Sans') {
  ctx.fillStyle = color;
  ctx.font = `400 ${size}px "Lesson ${family}"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(value), x, y);
}

function dimensions(ctx, box, { vertical = false, proposedWidthAlpha = 0 } = {}) {
  const { x, y, width, height, columns, rows } = box;
  const low = y + height;
  const right = x + width;
  const mark = low + 17;
  ctx.save();
  ctx.globalAlpha *= box.weightAlpha ?? 1;
  stroke(ctx, x, mark, right, mark, warp, 2.6);
  for (const end of [x, right]) stroke(ctx, end, mark - 6, end, mark + 7, warp, 3);
  type(ctx, columns + ' weights', (x + right) / 2, mark + 62, 57, warp, 'center');
  if (proposedWidthAlpha > 0) {
    ctx.globalAlpha *= proposedWidthAlpha;
    ctx.setLineDash([12, 8]);
    stroke(ctx, right, mark, right + width, mark, warp, 4);
    ctx.setLineDash([]);
    for (let column = 1; column <= columns; column++) {
      const tick = right + column * width / columns;
      stroke(ctx, tick, mark - 6, tick, mark + 7, warp, 4);
    }
    type(ctx, '+' + columns, right + width / 2, mark - 28, 57, warp, 'center');
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= box.tokenAlpha ?? 1;
  const side = vertical ? x - 16 : right + 20;
  stroke(ctx, side, y, side, low, weft, 2.6);
  for (const end of [y, low]) stroke(ctx, side - 6, end, side + 7, end, weft, 3);
  if (vertical) {
    ctx.translate(side - 15, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    type(ctx, rows + ' tokens', 0, 0, 56, weft, 'center');
  } else {
    type(ctx, rows + ' tokens', side + 19, y + height / 2 + 17, 57, weft);
  }
  ctx.restore();
}

let surface;
function table() {
  if (surface) return surface;
  surface = createCanvas(1920, 1080);
  const ctx = surface.getContext('2d');
  const wash = ctx.createLinearGradient(0, 0, 1650, 1080);
  wash.addColorStop(0, '#fcf7ee');
  wash.addColorStop(0.62, '#f7efe3');
  wash.addColorStop(1, '#e9ddcd');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);
  const rand = seed(103);
  for (let i = 0; i < 14000; i++) {
    const x = rand() * 1920, y = rand() * 1080;
    stroke(ctx, x, y, x + rand() * 5 + 0.5, y + rand() - 0.5, 'rgba(107,87,61,0.09)', 0.85);
  }
  return surface;
}

// Later chapters can stretch this exact square while preserving the original cut and edge.
export function drawSquareSample(ctx, { x, y, width, height = width }) {
  const cloth = openingCloth();
  drawCloth(ctx, cloth, { firstRow: 10, rows: 10, x, y, width: width / 2, height });
  drawCloth(ctx, cloth, { firstRow: 0, rows: 10, x: x + width / 2, y, width: width / 2, height });
}

export function drawOpening(ctx, clock) {
  const s = openingState(clock);
  const cloth = openingCloth();
  ctx.save();
  ctx.drawImage(table(), 0, 0);
  drawCloth(ctx, cloth, s.moving);
  drawCloth(ctx, cloth, s.fixed);
  if (s.rowLight > 0) {
    ctx.save();
    ctx.globalAlpha *= s.rowLight;
    const col = Math.min(4, Math.floor(s.count * 5));
    const x = s.fixed.x + s.cell * (col + 0.5);
    const y = s.fixed.y + s.fixed.height - s.cell * 0.5;
    stroke(ctx, x - s.cell * 0.31, y + 3, x + s.cell * 0.31, y - 3, '#f8d28e', s.cell * 0.13);
    ctx.restore();
  }
  type(ctx, s.squares, 145, 452, 173, ink, 'left', 'Serif');
  type(ctx, 'compute squares', 152, 528, 55, ink);
  if (s.question > 0) {
    ctx.save();
    ctx.globalAlpha *= s.question;
    type(ctx, 'At 10 weights,', 152, 655, 55, warp);
    type(ctx, 'how many rows?', 152, 728, 61, ink, 'left', 'Serif');
    ctx.restore();
  }
  if (s.measures) dimensions(ctx, s.measures, { proposedWidthAlpha: s.question });
  if (s.compare > 0) {
    ctx.save();
    ctx.globalAlpha *= s.compare;
    const r = s.reference;
    ctx.save();
    ctx.fillStyle = '#e6dac9';
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.setLineDash([18, 12]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8d7861';
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    ctx.restore();
    type(ctx, 'Before', r.x + r.width / 2, r.y + r.height / 2 + 14, 55, '#645240', 'center', 'Serif');
    dimensions(ctx, r, { vertical: true });
    ctx.restore();
  }
  ctx.restore();
}

export function checkOpening() {
  const cloth = openingCloth();
  if (cloth.columns !== 5 || cloth.rows !== 20) throw new Error('Expected a five-by-twenty cloth.');
  const pose = (ten, lower) => openingState({
    beat: { id: 'c01-b03' },
    reveal(phrase) {
      if (phrase === 'Ten rows') return ten;
      if (phrase === 'lower it beside') return lower;
      return 0;
    },
  });
  const start = pose(0, 0), passing = pose(0.20, 0), dock = pose(1, 1);
  if (passing.measures || passing.moving.x <= start.moving.x || passing.moving.y !== start.moving.y) {
    throw new Error('The top half must travel right before it drops.');
  }
  if (start.measures.columns !== 5 || start.measures.rows !== 20 || dock.measures.columns !== 10 || dock.measures.rows !== 10 ||
      dock.fixed.x !== start.fixed.x || dock.fixed.y !== start.fixed.y || dock.moving.y !== dock.fixed.y ||
      dock.moving.x !== dock.fixed.x + dock.fixed.width || dock.squares !== 100 || dock.moving.firstRow !== 0 || dock.fixed.firstRow !== 10) {
    throw new Error('The square must rejoin the same two pieces at their original scale.');
  }
}
