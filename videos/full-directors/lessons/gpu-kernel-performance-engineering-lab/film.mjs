import assert from 'node:assert/strict';
import {
  bankModel,
  edgeOwnership,
  resourceCapacity,
  transpose,
} from '../../../films/gpu-kernel-performance-engineering-lab/arithmetic.mjs';
import {
  bits,
  recordedTiming,
} from '../../../films/gpu-kernel-performance-engineering-lab/fixtures.mjs';

const W = 1920,
  H = 1080;
const C = {
  paper: '#f4f1e7',
  pale: '#fffdf5',
  ink: '#133735',
  muted: '#45645e',
  line: '#a1b5a9',
  metal: '#d7e2d6',
  teal: '#077769',
  mint: '#b8e9d8',
  gold: '#e9a545',
  orange: '#984410',
  rose: '#a94a41',
  pink: '#f7d3c4',
  dark: '#133f3d',
  pin: '#c0c8af',
  white: '#fffdf2',
};
const seq = (n) => Array.from({ length: n }, (_, i) => i);
const lanes = seq(32);
const clamp = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, p) => a + (b - a) * p;
const count = (a, test) => a.filter(test).length;
const sum = (a) => a.reduce((v, n) => v + n, 0);
const fmt = (n) => n.toLocaleString('en-US');
const hex = (n) => n.toString(16).toUpperCase().padStart(8, '0');
const smooth = (p) => p * p * (3 - 2 * p);

// A cue stays settled on later beats. Each frame can be painted in isolation.
function at(k, beat, phrase, seconds = 0) {
  const current = k.beat.beatIndex;
  if (current < beat) return 0;
  if (current > beat) return 1;
  return k.reveal(phrase, seconds);
}
function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function box(g, x, y, w, h, c, r = 12, stroke = null) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = c;
  g.fill();
  if (stroke) {
    g.lineWidth = 2;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
function line(g, points, color, width = 3, dash = []) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.setLineDash(dash);
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}
function circle(g, x, y, r, c) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}
function label(
  g,
  value,
  x,
  y,
  size = 36,
  color = C.ink,
  face = 'Sans',
  align = 'left',
  weight = 500,
  max = null,
) {
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  if (max && g.measureText(String(value)).width > max) {
    g.font =
      weight +
      ' ' +
      Math.floor((size * max) / g.measureText(String(value)).width) +
      'px "Lesson ' +
      face +
      '"';
  }
  g.fillText(String(value), x, y);
}
function mono(g, t, x, y, size = 32, c = C.ink, align = 'left') {
  label(g, t, x, y, size, c, 'Mono', align);
}
function name(g, t, x, y) {
  label(g, t, x, y, 32, C.muted, 'Sans', 'left', 600);
}
function page(g, section, title) {
  rect(g, 0, 0, W, H, C.paper);
  // The registration marks frame the physical address plates.
  line(
    g,
    [
      [80, 90],
      [1838, 90],
    ],
    C.line,
    2,
  );
  rect(g, 80, 64, 39, 12, C.teal);
  label(g, section, 137, 66, 26, C.muted, 'Mono');
  label(g, title, 76, 161, 67, C.ink, 'Serif', 'left', 500, 1750);
}
function note(g, large, small = '', tone = C.teal) {
  if (!large) return;
  rect(g, 81, 846, 8, small ? 91 : 60, tone);
  label(g, large, 115, 875, 42, C.ink, 'Sans', 'left', 600, 1690);
  if (small) label(g, small, 117, 925, 30, C.muted, 'Sans', 'left', 400, 1680);
}
function board(g, x, y, w, h) {
  box(g, x + 3, y + 8, w, h, '#bfcbbd', 17);
  box(g, x, y, w, h, C.dark, 17);
  for (const px of [x + 15, x + w - 15])
    for (const py of [y + 15, y + h - 15]) {
      circle(g, px, py, 5, C.pin);
      line(
        g,
        [
          [px - 2, py + 2],
          [px + 2, py - 2],
        ],
        C.muted,
        1.5,
      );
    }
}
function travel(g, points, p, paintMark = (x, y) => {
  circle(g, x, y, 15, C.ink);
  circle(g, x, y, 10, C.gold);
}) {
  if (p <= 0 || p >= 1) return;
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = smooth(p) * sum(lengths);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 0;
      const x = lerp(points[i][0], points[i + 1][0], t),
        y = lerp(points[i][1], points[i + 1][1], t);
      paintMark(x, y);
      return;
    }
    distance -= lengths[i];
  }
}
const words = [0x3f800000, 0x40000000, 0x40400000, 0x40800000];
const poison = 0xffffffff,
  omitted = 2;
const nanPair = [0x7fc00010, 0x7fc00011];
function copyState(mode, progress) {
  const order = mode === 'repair' ? [0, 1, 3, 2] : [0, 1, 3];
  const initial = words.map((word, i) => (mode === 'reuse' && i === omitted ? word : poison));
  const phases = words.map((_, i) => {
    const step = order.indexOf(i);
    return step === -1 ? 0 : clamp(progress * order.length - step);
  });
  const output = initial.map((v, i) => (phases[i] === 1 ? words[i] : v));
  return {
    phases,
    output,
    writes: count(phases, (p) => p === 1),
    mismatches: count(output, (v, i) => v !== words[i]),
  };
}
// The mark belongs to the bit pattern. An old copy has the same mark as a new one.
function payloadMark(g, x, y, word) {
  g.save();
  g.translate(x, y);
  g.beginPath();
  if (word === words[0]) {
    g.fillStyle = '#bd592a';
    g.arc(0, 0, 36, 0, 2 * Math.PI);
  } else if (word === words[1]) {
    g.fillStyle = '#257895';
    g.moveTo(0, -41);
    g.lineTo(41, 33);
    g.lineTo(-41, 33);
    g.closePath();
  } else if (word === words[2]) {
    g.fillStyle = '#81518a';
    g.rect(-13, -38, 26, 76);
    g.rect(-38, -13, 76, 26);
  } else if (word === words[3]) {
    g.fillStyle = C.teal;
    g.moveTo(0, -41);
    g.lineTo(41, 0);
    g.lineTo(0, 41);
    g.lineTo(-41, 0);
    g.closePath();
  } else {
    assert.equal(word, poison);
    g.fillStyle = '#748581';
    for (const offset of [-21, 0, 21]) {
      g.moveTo(offset + 8, -25);
      g.lineTo(offset + 18, -25);
      g.lineTo(offset - 8, 25);
      g.lineTo(offset - 18, 25);
      g.closePath();
    }
  }
  g.fill();
  g.restore();
}

const storeRoutes = words.map((_, i) => {
  const inputX = 560 + 318 * i;
  const columnY = 425 + 117 * i;
  return [[inputX + 55, 339], [inputX + 55, columnY], [495, columnY]];
});
function copyScene(g, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    page(g, 'COPY CONTRACT    /    extended input', 'Do these two NaNs match bit for bit?');
    const result = at(k, 3, 'It fails');
    for (const i of [0, 1]) {
      const x = 110 + i * 910,
        n = nanPair[i];
      name(g, i ? 'Returned word' : 'Expected word', x, 307);
      mono(g, '0x' + hex(n), x, 408, 68);
      for (const j of seq(32)) {
        const xx = x + (j % 16) * 47,
          yy = 520 + Math.floor(j / 16) * 81,
          bit = (n >>> (31 - j)) & 1;
        box(g, xx, yy, 42, 66, j === 31 && result ? C.gold : bit ? C.teal : C.metal, 5);
        mono(
          g,
          bit,
          xx + 21,
          yy + 34,
          30,
          bit && !(j === 31 && result) ? C.white : C.ink,
          'center',
        );
      }
    }
    note(
      g,
      result ? 'One payload bit differs. Reject this copy.' : 'Both words decode as NaN.',
      result
        ? 'This separate input extends the finite-integer harness.'
        : 'The exact-copy contract compares all 32 bits.',
      result ? C.rose : C.teal,
    );
    return;
  }
  const reset = at(k, 1, 'Fill the output');
  const repair = at(k, 2, 'Fill the output again');
  const mode = repair ? 'repair' : reset ? 'poison' : 'reuse';
  const progress = repair
    ? at(k, 2, 'Run the repaired copy', 4.8)
    : reset
      ? at(k, 1, 'Replay the same', 4.5)
      : at(k, 0, 'Watch the stores', 4.5);
  const s = copyState(mode, progress);
  const countRevealed = at(k, 1, 'Three stores landed');
  const mismatchRevealed = at(k, 2, 'One word still holds');
  const repairConfirmed = repair && s.writes === words.length && at(k, 2, 'Now all four');
  const title = repair ? 'Does the repaired copy pass?'
    : reset ? 'Will the same stores pass with fresh output?'
      : 'Did this launch write all four words?';
  page(g, 'TRANSPOSE    /    32-bit words', title);
  name(g, 'A   /   input row', 560, 243);
  name(g, 'B   /   output column', 86, 329);

  // Each wire bends toward the column at its own row. The four paths never cross.
  storeRoutes.forEach((path, i) => {
    const traced = countRevealed && s.phases[i] === 1;
    line(g, path, traced ? C.teal : C.line, 6);
  });
  // The packet enters at the edge. Keep the resident bits visible until the store lands.
  words.forEach((word, i) => {
    travel(g, storeRoutes[i], s.phases[i], (x, y) => {
      circle(g, x, y, 44, C.paper);
      payloadMark(g, x, y, word);
    });
  });
  words.forEach((word, i) => {
    const [source, , dest] = storeRoutes[i];
    const [sx, sy] = source, [dx, dy] = dest;
    box(g, sx - 55, sy - 55, 285, 110, C.pale, 14, C.line);
    payloadMark(g, sx, sy, word);
    mono(g, 'A[0,' + i + ']', sx + 53, sy - 24, 26, C.muted);
    mono(g, hex(word), sx + 53, sy + 19, 34);

    box(g, 85, dy - 52, 410, 104, C.pale, 14, C.line);
    payloadMark(g, dx - 60, dy, s.output[i]);
    mono(g, 'B[' + i + ',0]', 105, dy - 24, 26, C.muted);
    mono(g, hex(s.output[i]), 105, dy + 20, 40);
    if (countRevealed) {
      const written = s.phases[i] === 1;
      const status = written ? 'written' : s.output[i] === poison ? 'poison' : 'previous run';
      label(g, status, 212, dy - 24, 26, written ? C.teal : C.muted);
    }
  });

  if (!countRevealed) {
    note(g, 'Each shape identifies one 32-bit word.', 'The column started with one matching word.');
  } else if (!reset) {
    note(g, s.writes + ' stores landed. All ' + (words.length - s.mismatches) + ' words match.',
      'The cross was already in the third destination.');
  } else if (!repair && mismatchRevealed) {
    note(g, 'B[2,0] holds ' + hex(s.output[omitted]) + '. The source is ' + hex(words[omitted]) + '.',
      'The third destination still holds the fill pattern.', C.rose);
  } else if (repairConfirmed) {
    note(g, s.writes + ' stores landed. All ' + (words.length - s.mismatches) + ' words match.',
      'The last write put ' + hex(s.output[omitted]) + ' in B[2,0].');
  } else {
    note(g, 'The fresh fill sets every bit to one.', 'FFFFFFFF represents a NaN. All four source words are finite.');
  }
}

function coverage(words) {
  const groups = new Map();
  for (const w of words) {
    const id = Math.floor(w / 8);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(w % 8);
  }
  return { words, groups, payload: words.length * 4, bytes: groups.size * 32 };
}

const edge33 = edgeOwnership(33, 1, 0);
function rowLoad(tile, row) {
  const active = tile.producers.filter((producer) => producer.row === row);
  return {
    row,
    width: tile.n,
    firstColumn: tile.bx * 32,
    activeLanes: active.map((producer) => producer.thread[0]),
    ...coverage(active.map((producer) => row * tile.n + producer.col)),
  };
}
const alignedLoad = coverage(lanes);
const stridedStore = coverage(lanes.map((lane) => lane * 4096));
const firstTileLoad = rowLoad(edgeOwnership(33, 0, 0), 1);
const nextTileLoad = rowLoad(edge33, 1);

function sector(g, x, y, width, height, id, slots, small = false) {
  box(g, x, y, width, height, C.pale, 7, C.line);
  mono(
    g,
    (small ? 's' : 'sector ') + id,
    x + width / 2,
    y + height * 0.29,
    small ? 23 : 30,
    C.muted,
    'center',
  );
  const dw = (width - 16) / 8;
  for (const i of seq(8))
    rect(
      g,
      x + 8 + i * dw,
      y + height * 0.55,
      dw - 2,
      height * 0.28,
      slots.includes(i) ? C.teal : C.metal,
    );
}
function sectorScene(g, k) {
  const odd = at(k, 2, 'Start at word');
  const scattered = at(k, 1, 'Spread the stores out');
  const nextTile = at(k, 3, 'Move to the next tile');
  page(
    g,
    'GLOBAL MEMORY    /    aligned sector boundaries',
    nextTile ? 'Which sector supplies the last column?' : 'How many sectors does one instruction touch?',
  );
  const model = nextTile ? nextTileLoad : odd ? firstTileLoad : scattered ? stridedStore : alignedLoad;
  const reveal = nextTile ? at(k, 4, 'Sector eight') : odd
    ? at(k, 3, 'Five sectors')
    : scattered
      ? at(k, 1, 'Now the warp touches')
      : at(k, 0, 'Four sectors');
  if (odd) {
    const rowStart = model.row * model.width;
    name(g, 'Row ' + model.row + '   ·   width ' + model.width + '   ·   tile starts at column ' + model.firstColumn, 88, 265);
    name(g, 'Active lanes', 88, 352);
    for (const lane of lanes) {
      const x = 350 + lane * 46;
      const active = model.activeLanes.includes(lane);
      box(g, x, 323, 41, 57, active ? C.dark : C.metal, 4);
      mono(g, lane, x + 20, 352, 22, active ? C.white : C.muted, 'center');
    }
    // Keep both tiles on the same address scale while the bounds check changes the lanes.
    for (const id of firstTileLoad.groups.keys()) {
      const x = 86 + (id - Math.floor(rowStart / 8)) * 350;
      const slots = nextTile && !reveal ? [] : model.groups.get(id) || [];
      sector(g, x, 433, 332, 182, id, slots);
      mono(g, 'words ' + id * 8 + '–' + (id * 8 + 7), x + 166, 651, 27, C.muted, 'center');
    }
    const range = nextTile
      ? 'A[' + model.row + ',' + model.firstColumn + ']     word ' + rowStart + ' + ' + model.firstColumn + (reveal ? ' = ' + model.words[0] : ' = ?')
      : 'Active words   ' + model.words[0] + ' … ' + model.words.at(-1);
    mono(g, range, 93, 747, 43, C.ink);
  } else if (scattered) {
    name(g, 'Naive stores   /   lane i writes word 4096 × i', 88, 271);
    Array.from(model.groups, ([id, slots], i) =>
      sector(g, 85 + (i % 8) * 221, 324 + Math.floor(i / 8) * 113, 204, 99, id, slots, true),
    );
  } else {
    name(g, 'Adjacent loads   /   lane i reads word i', 88, 275);
    lanes.forEach((i) => {
      const x = 97 + i * 54.4;
      mono(g, i, x + 23, 362, 26, C.muted, 'center');
      box(g, x, 398, 47, 85, C.dark, 4);
    });
    for (const i of seq(4)) {
      line(
        g,
        [
          [117 + i * 435, 508],
          [117 + i * 435, 533],
          [510 + i * 435, 533],
          [510 + i * 435, 508],
        ],
        C.teal,
        4,
      );
      sector(g, 92 + i * 435, 575, 415, 150, i, model.groups.get(i));
    }
  }
  note(
    g,
    reveal
      ? model.groups.size +
          ' touched sector' +
          (model.groups.size === 1 ? '' : 's') +
          '   ·   ' +
          model.payload +
          ' useful bytes / ' +
          fmt(model.bytes) +
          ' sector bytes'
      : nextTile
        ? 'Find the word on the sector map.'
      : odd
        ? 'Count the touched sectors.'
        : 'One full warp requests 32 four-byte words.',
    reveal
      ? 'Payload fraction   ' +
          (100 * model.payload) / model.bytes +
          '%    ·    Scalar address model for compute capability 6.0 and later.'
      : 'Each sector holds eight float32 words.',
  );
}

const tileSide = 4;
const tile = transpose(tileSide);
const outputRow = 1;
const rowWords = tile.filter(({ target }) => target[0] === outputRow);
const edge67 = edgeOwnership(67, 2, 0);
function edgeWord(edge) {
  return edge.pairs.find((v) => v.producer.row === 1 && v.producer.col === edge.bx * 32);
}
function tileScene(g, k) {
  const b = k.beat.beatIndex;
  if (!b) {
    page(g, 'TILE EXCHANGE    /    four-by-four detail', 'Where do the four shared words go?');
    const load = at(k, 0, 'Load adjacent', 1.75);
    const barrier = at(k, 0, 'After the block barrier');
    const read = at(k, 0, 'read down', 1.0);
    const answer = 'Write them side by side in output row one';
    k.reveal(answer, 0, { captionStart: answer });
    const store = clamp((k.elapsed - k.wordCue(answer).end) / 1.5);
    const inFlight = store > 0 && store < 1;
    const bases = [99, 719, 1339];
    const size = 99;
    const y = 352;
    const cellCenter = (boardIndex, [row, col]) => [
      bases[boardIndex] + col * size + 46,
      y + row * size + 46,
    ];
    const loadedRows = Math.floor(load * tileSide);
    const activeRow = load > 0 && loadedRows < tileSide ? loadedRows : -1;
    const lift = smooth(clamp(store / 0.4));
    const turn = smooth(clamp((store - 0.4) / 0.6));
    const gutterX = (bases[1] + tileSide * size + bases[2]) / 2;
    // Keep the words in column order as the output lanes carry them into a row.
    const movingWords = inFlight
      ? rowWords.map(({ value, source, target }) => {
          const [fromX, fromY] = cellCenter(1, source);
          const [toX, toY] = cellCenter(2, target);
          return {
            value,
            x: lerp(lerp(fromX, gutterX, lift), toX, turn),
            y: lerp(fromY, toY, turn),
          };
        })
      : [];
    for (const [idx, x] of bases.entries()) {
      name(g, ['Global input A', 'Shared tile', 'Global output B'][idx], x, 286);
      board(g, x - 15, y - 17, size * tileSide + 26, size * tileSide + 30);
      for (const item of tile) {
        const targetRow = item.target[0] === outputRow;
        const [cx, cy] = cellCenter(idx, idx === 2 ? item.target : item.source);
        const present =
          idx === 0 || (idx === 1 ? item.source[0] < loadedRows : store === 1 && targetRow);
        const chosen =
          targetRow && (idx === 2 || (idx === 1 && read * rowWords.length >= item.source[0] + 1));
        const focusedOut = idx === 1 && read === 1 && !targetRow;
        const overlaid = idx === 1 && inFlight && Math.abs(movingWords[item.source[0]].x - cx) < 64;
        const loading = idx === 0 && item.source[0] === activeRow;
        let fill = '#315451';
        if (present) fill = loading ? C.pale : focusedOut ? C.metal : C.mint;
        if (present && chosen) fill = C.gold;
        box(g, cx - 46, cy - 46, 92, 92, fill, 5);
        if (present && !overlaid)
          mono(g, item.value, cx, cy + 3, 40, focusedOut ? C.muted : C.ink, 'center');
      }
    }
    if (activeRow >= 0) {
      const start = bases[0] + size * tileSide + 22;
      const end = bases[1] - 35;
      const loadY = y + activeRow * size + 46;
      line(
        g,
        [
          [start, loadY],
          [end, loadY],
          [end - 17, loadY - 13],
        ],
        C.teal,
        5,
      );
    }
    for (const { value, x, y } of movingWords) {
      circle(g, x, y, 32, C.ink);
      circle(g, x, y, 28, C.gold);
      mono(g, value, x, y + 2, 36, C.ink, 'center');
    }
    if (store === 1) {
      const mapping = `B[${outputRow}, c] = A[c, ${outputRow}]`;
      mono(g, mapping, bases[2], 803, 38, C.muted);
    }
    const sectorResult = k.elapsed >= k.wordCue('thirty-two adjacent words in four sectors').end;
    note(
      g,
      store === 1
        ? sectorResult
          ? 'A full aligned warp stores 32 adjacent float32 words in four sectors.'
          : 'One shared column feeds four adjacent output words.'
        : inFlight
          ? 'Each output lane copies one shared word.'
          : read > 0
            ? 'Read down the second shared column.'
            : barrier
              ? 'The block has finished writing the shared tile.'
              : 'Adjacent input words fill each shared row.',
    );
    return;
  }
  const fresh = at(k, 3, 'Change the width'),
    edge = fresh ? edge67 : edge33,
    watch = edgeWord(edge);
  const start = edge.bx * 32,
    cols = edge.n - start;
  const admitted = fresh ? at(k, 4, 'Ninety-six words') : at(k, 2, 'Thirty-two values');
  const all = fresh ? at(k, 4, 'The block still has') : at(k, 2, 'All two hundred');
  const first = fresh ? at(k, 4, 'Its value is') : at(k, 2, 'Follow sixty-five');
  const wrote = fresh ? at(k, 4, 'Warp one loads') : at(k, 2, 'Warp one produces');
  const consumed = fresh ? at(k, 4, 'warp zero writes') : at(k, 2, 'Warp zero consumes');
  page(
    g,
    'EDGE TILE    /    N = ' + edge.n + '   ·   block (' + edge.bx + ', 0)',
    'How many values fit at the right edge?',
  );
  const gx = 109,
    gy = 309,
    side = 14.2;
  name(g, 'Logical tile  /  32 × 32', 100, 250);
  board(g, gx - 18, gy - 18, 32 * side + 35, 32 * side + 35);
  for (const row of lanes)
    for (const col of lanes) {
      rect(
        g,
        gx + col * side,
        gy + row * side,
        side - 1.3,
        side - 1.3,
        col < cols ? (col === 0 && row === 1 && first ? C.gold : C.mint) : '#365b57',
      );
    }
  const ex = 726;
  name(g, 'Block  /  32 lanes × 8 warp rows', ex, 254);
  for (const warp of seq(8)) {
    mono(g, 'W' + warp, ex, 327 + warp * 36, 22);
    for (const lane of lanes) {
      const x = ex + 68 + lane * 29,
        y = 327 + warp * 36;
      circle(g, x, y, 10, all ? C.teal : lane < cols ? C.orange : C.line);
      if (lane < cols && all) circle(g, x, y, 4, C.gold);
    }
  }
  label(
    g,
    all ? 'All threads at the barrier' : 'Copper marks the threads with input loads.',
    ex,
    636,
    32,
    C.muted,
  );
  const legs = [
    ['A[1,' + start + ']', String(watch.producer.value), first],
    ['tile[1,0]', 'warp ' + watch.producer.warp, wrote],
    ['B[' + start + ',1]', 'warp ' + watch.consumer.warp, consumed],
  ];
  legs.forEach(([addr, owner, on], i) => {
    const x = ex + i * 347;
    box(g, x, 691, 301, 105, on ? C.mint : C.metal, 7);
    mono(g, on ? addr : '···', x + 150, 722, 32, C.ink, 'center');
    if (on) label(g, owner, x + 150, 766, 30, C.muted, 'Sans', 'center');
    if (i < 2)
      line(
        g,
        [
          [x + 307, 744],
          [x + 334, 744],
          [x + 325, 737],
        ],
        C.teal,
        3,
      );
  });
  note(
    g,
    admitted
      ? edge.producers.length +
          ' valid input values' +
          (all ? '   ·   ' + edge.barrierArrivals + ' barrier arrivals' : '')
      : fresh
        ? 'Columns 64 through 66 fit in the input.'
        : 'Column 32 is the only valid input column in this block.',
    consumed
      ? 'Row-major output index   ' + start + ' × ' + edge.n + ' + 1 = ' + fmt(watch.consumer.index)
      : 'Each thread visits row offsets 0, 8, 16 and 24. Global accesses are guarded.',
  );
}

function bankWords(stride) {
  return lanes.map((i) => ({ lane: i, word: i * stride, bank: (i * stride) % 32 }));
}
function bankScene(g, k) {
  const plus = at(k, 1, 'give each row one spare word', 0.9),
    two = at(k, 3, 'Try two spare words', 0.9),
    stride = 32 + (two === 1 ? 2 : plus === 1 ? 1 : 0);
  const said = (beat, phrase) => k.beat.beatIndex > beat
    || (k.beat.beatIndex === beat && k.elapsed + 1e-9 >= k.wordCue(phrase).end);
  const reads = bankWords(stride),
    model = bankModel(stride);
  const route = two
    ? at(k, 4, 'Trace it back', 1.0)
    : plus
      ? at(k, 2, 'Send the requests again', 1.2)
      : at(k, 0, 'Trace the column read', 1.15);
  const verdict = two
    ? said(4, 'each serve two distinct words')
    : plus
      ? said(2, 'one word in the same group')
      : said(1, 'serve thirty-two groups');
  const showPaddingCost = two ? k.beat.beatIndex >= 4 : !plus
    || said(2, 'one hundred twenty-eight shared bytes per block');
  page(g, 'SHARED MEMORY    /    one warp reads column 0', 'Which banks will serve these lanes?');
  name(g, 'Tile row starts  /  word addresses', 90, 233);
  for (const i of seq(3)) {
    const y = 334 + i * 136;
    mono(g, 'r' + i, 94, y + 34, 29, C.muted);
    // The first cell is magnified. The final narrow cells are physical padding.
    box(g, 162, y - 8, 506 + (plus + two) * 24, 85, C.dark, 7);
    box(g, 169, y, 117, 67, C.gold, 4);
    mono(g, reads[i].word, 226, y + 35, 37, C.ink, 'center');
    for (const col of seq(31)) rect(g, 294 + col * 11.6, y + 4, 9.8, 58, '#61877b');
    for (const [col, padding] of [plus, two].entries()) {
      if (!padding) continue;
      const x = 665 + col * 24;
      rect(g, x, y + 4, 21 * padding, 58, C.pin);
      if (padding < 1) continue;
      for (const yy of [12, 26, 40])
        line(
          g,
          [
            [x + 3, y + yy + 10],
            [x + 15, y + yy],
          ],
          C.muted,
          2,
        );
    }
  }
  mono(g, 'word = row × ' + stride, 97, 710, 36);
  if (showPaddingCost) label(
    g,
    fmt(model.sharedBytes) +
      ' shared bytes / block' +
      (stride > 32 ? '  (+' + (model.sharedBytes - 4096) + ' B)' : ''),
    99,
    759,
    30,
    C.muted,
  );
  const gx = 1020,
    gy = 330,
    dx = 23,
    dy = 14.7;
  name(g, 'Bank contacts', gx - 10, 233);
  board(g, gx - 28, gy - 39, 32 * dx + 44, 32 * dy + 64);
  const routed = Math.ceil(route * 32);
  const on = new Set(reads.slice(0, routed).map((r) => r.bank));
  for (const i of lanes) {
    const x = gx + i * dx;
    rect(g, x, gy - 24, 18, 19, on.has(i) ? C.gold : '#729084');
    rect(g, x + 2, gy, 14, 32 * dy, on.has(i) ? '#466d60' : '#335b54');
    if (i % 8 === 0 || i === 31) mono(g, i, x + 8, gy - 61, 22, C.ink, 'center');
  }
  label(g, 'Lane', gx - 157, gy - 42, 27, C.muted);
  for (const i of lanes) {
    const y = gy + i * dy + 5.5;
    rect(g, gx - 19, y - 4, 7, 8, C.pin);
    if (i % 8 === 0 || i === 31) mono(g, i, gx - 55, y, 22, C.ink, 'right');
    if (i >= routed) continue;
    const { bank } = reads[i],
      x = gx + bank * dx;
    line(
      g,
      [
        [gx - 14, y],
        [x + 8, y],
      ],
      '#659284',
      1.6,
    );
    rect(g, x - 1, y - 5.8, 20, 12, two && i === 16 ? C.white : C.gold);
  }
  const summary = verdict
    ? model.used +
      ' active bank' +
      (model.used === 1 ? '' : 's') +
      '   ·   ' +
      model.conflict +
      ' service group' +
      (model.conflict === 1 ? '' : 's')
    : route === 1
      ? 'Follow the distinct words to their bank contacts.'
      : 'bank = word address mod 32';
  if (plus && !two && said(2, 'reach banks one and two')) {
    mono(g, reads.slice(1, 3).map(({word, bank}) => word + ' → bank ' + bank).join('   ·   '),
      gx, 860, 32, C.ink);
  }
  label(g, summary, 99, 818, 38, C.ink, 'Sans', 'left', 600, 847);
  label(g, '32 scalar reads  ·  4 bytes each  ·  distinct words  ·  fixed column 0',
    99, 861, 27, C.muted, 'Sans', 'left', 400, 840);
}

const OLD = 'old bits',
  EMPTY = '—';
function scheduled(events, n) {
  let memory = OLD,
    register = EMPTY,
    output = EMPTY;
  for (const action of events.slice(0, n)) {
    if (action === 'write') memory = '65';
    if (action === 'read') register = memory;
    if (action === 'store') output = register;
  }
  return { memory, register, output };
}
const broken = ['read', 'write', 'store'],
  fixed = ['write', 'barrier', 'read', 'store'];
function trace(g, y, title, events, n, live, waiting = false) {
  name(g, title, 91, y - 41);
  const left = 100,
    w = 1042;
  box(g, left, y, w, 179, live ? C.dark : C.metal, 10);
  const fg = live ? C.white : C.muted;
  for (const [i, who] of ['Warp 1', 'Warp 0'].entries()) {
    mono(g, who, left + 20, y + 52 + i * 78, 27, fg);
    line(
      g,
      [
        [left + 155, y + 51 + i * 78],
        [left + w - 25, y + 51 + i * 78],
      ],
      live ? '#648379' : C.line,
      3,
    );
  }
  events.forEach((evt, i) => {
    const eventX =
      evt === 'write'
        ? 430
        : evt === 'barrier'
          ? 574
          : evt === 'store'
            ? 883
            : events === broken
              ? 211
              : 728;
    const x = left + eventX,
      yy = y + (evt === 'write' ? 51 : 129);
    if (evt === 'barrier') {
      if (live) {
        line(
          g,
          [
            [left + 211, y + 129],
            [x, y + 129],
          ],
          n > i ? C.mint : C.gold,
          5,
          [7, 6],
        );
        line(
          g,
          [
            [x, y + 18],
            [x, y + 158],
          ],
          n > i ? C.mint : C.gold,
          7,
          n > i ? [] : [9, 7],
        );
        box(g, x - 69, y + 70, 138, 41, n > i ? C.mint : C.gold, 5);
        label(
          g,
          n > i ? 'released' : waiting ? 'waiting' : 'barrier',
          x,
          y + 91,
          24,
          C.ink,
          'Sans',
          'center',
          600,
        );
      }
      return;
    }
    if (i >= n) return;
    circle(g, x, yy, 13, evt === 'write' ? C.gold : C.mint);
    const t = evt === 'write' ? 'write 65' : evt === 'read' ? 'read slot' : 'store';
    label(g, t, x, yy - 27, 26, fg, 'Sans', 'center');
  });
  const state = scheduled(events, n);
  [state.memory, state.register, state.output].forEach((word, i) => {
    const x = 1180 + i * 224;
    box(
      g,
      x,
      y + 30,
      205,
      117,
      live ? (word === '65' ? C.mint : word === OLD ? C.pink : C.pale) : C.metal,
      8,
    );
    label(
      g,
      ['Shared slot', 'Register', 'B[32,1]'][i],
      x + 102,
      y + 59,
      24,
      C.muted,
      'Sans',
      'center',
    );
    mono(g, live ? word : EMPTY, x + 102, y + 107, 33, C.ink, 'center');
  });
}
function raceScene(g, k) {
  page(g, 'CROSS-WARP HANDOFF    /    shared word tile[1,0]', 'What does the consumer carry away?');
  const n =
    at(k, 0, 'warp zero reads early') + at(k, 0, 'Warp one writes') + at(k, 1, 'The store uses');
  const live = at(k, 1, 'Replay the same'),
    nf =
      at(k, 1, 'final producer arrives') +
      at(k, 1, 'release the block') +
      at(k, 1, 'read sixty-five') +
      at(k, 1, 'and store it');
  trace(g, 318, 'Barrier removed  /  one possible schedule', broken, n, true);
  trace(g, 595, 'Barrier restored  /  same producer delay', fixed, nf, live, live && nf < 2);
  if (k.beat.beatIndex < 2) {
    const repairedStatus = [
      'The consumer waits for the last producer.',
      'The final word is ready. The consumer is still at the barrier.',
      'The barrier released. The consumer can read the completed word.',
      'The consumer now holds 65 in its register.',
      'The ordered read carries 65 to the output.',
    ];
    note(
      g,
      live
        ? repairedStatus[nf]
        : n === 3
          ? 'The shared slot changed. The register kept its earlier bits.'
          : 'Read the register before predicting the store.',
      'N = 33  ·  warp 1 supplies tile[1,0]  ·  warp 0 writes B[32,1]',
    );
  } else {
    mono(g, 'Recorded reports  /  broken kernel at N = 33', 91, 802, 24, C.muted);
    const checks = [
      ['memcheck', '0 address errors', 'Memcheck reported'],
      ['racecheck', '4 shared hazards', 'Racecheck reported'],
      ['synccheck', '0 barrier errors', 'Synccheck reported'],
    ];
    for (const [i, [tool, result, cue]] of checks.entries()) {
      const x = 91 + i * 590;
      mono(g, tool, x, 850, 26, C.muted);
      label(
        g,
        at(k, 2, cue) ? result : '…',
        x,
        894,
        36,
        i === 1 ? C.rose : C.ink,
        'Sans',
        'left',
        600,
      );
    }
    if (at(k, 2, 'Reject the broken timing'))
      label(g, 'Broken run excluded. Repeat checks after the repair.', 90, 955, 32, C.teal);
  }
}

function compact(flags) {
  let total = 0;
  const offsets = [],
    list = [];
  flags.forEach((flag, i) => {
    offsets.push(total);
    if (flag) list[total++] = i;
  });
  return { offsets, list, total };
}
function primitiveScene(g, k) {
  const data = compact(bits),
    fold = at(k, 0, 'Fold the flags', 1.2),
    scan = at(k, 2, 'Count only earlier flags', 1.4),
    scatter = at(k, 2, 'Scatter the failing', 1.3);
  const selected = 4,
    x0 = 370,
    pitch = 177,
    y = 346;
  page(g, 'OUTPUT DEPENDENCY    /    checker flags', 'Where should a failing index land?');
  mono(g, 'Index', 87, 282, 31, C.muted);
  name(g, 'Mismatch', 86, y + 38);
  name(g, 'Prior failures', 86, 519);
  bits.forEach((v, i) => {
    const x = x0 + i * pitch;
    mono(g, i, x + 65, 282, 30, i === selected ? C.orange : C.muted, 'center');
    box(g, x, y, 130, 85, v ? C.dark : C.metal, 7);
    mono(g, v, x + 65, y + 45, 46, v ? C.white : C.muted, 'center');
    if (k.beat.beatIndex === 0 && fold > 0 && i < Math.floor(fold * bits.length)) {
      line(
        g,
        [
          [x + 65, y + 86],
          [x + 65, y + 108],
          [x + 2, y + 108],
        ],
        v ? C.teal : C.line,
        4,
      );
    }
    const focus = at(k, 1, 'Look at index four');
    if (focus && i === selected)
      line(
        g,
        [
          [x, y - 9],
          [x + 130, y - 9],
        ],
        C.orange,
        7,
      );
    const show = scan * bits.length >= i + 1;
    box(g, x, 478, 130, 76, show && v ? C.mint : C.pale, 6, C.line);
    mono(g, show ? data.offsets[i] : '·', x + 65, 518, 37, show ? C.ink : C.muted, 'center');
    if (v && scatter) {
      const slot = data.offsets[i],
        xx = 820 + slot * 222,
        path = [
          [x + 65, 560],
          [x + 65, 600 + slot * 18],
          [xx + 77, 600 + slot * 18],
          [xx + 77, 707],
        ];
      line(g, path, C.teal, 3);
      travel(g, path, clamp(scatter * data.total - slot));
    }
  });
  name(g, 'Reduction', 86, 667);
  if (fold) {
    const visible = Math.floor(fold * bits.length + 1e-9);
    mono(g, sum(bits.slice(0, visible)), 98, 747, 73);
    label(g, visible === bits.length ? 'failures total' : 'partial count', 190, 755, 31, C.muted);
  }
  if (at(k, 1, 'collect the original')) {
    name(g, 'Stable list', 485, 752);
    data.list.forEach((idx, slot) => {
      const x = 820 + slot * 222;
      box(g, x, 705, 155, 86, C.dark, 7);
      mono(g, scatter * data.total >= slot + 1 ? idx : '·', x + 77, 749, 43, C.white, 'center');
      mono(g, 'slot ' + slot, x + 77, 816, 24, C.muted, 'center');
    });
  }
  note(
    g,
    scatter === 1
      ? 'Indices ' + data.list.join(', ') + ' occupy consecutive slots in input order.'
      : scan === 1
        ? 'Index 4 has ' + data.offsets[4] + ' earlier failures.'
        : k.beat.beatIndex === 1
          ? 'Count the ones strictly to the left of index 4.'
          : 'A one marks a failing comparison.',
    'Reduce to a summary. An exclusive scan counts failures before each position.',
  );
}

const batchExample = { baseline: [0.202, 0.216, 0.211], candidate: [0.194, 0.207, 0.237] };
const median = (v) => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];
function resourceScene(g, k) {
  const b = k.beat.beatIndex,
    pack = at(k, 2, 'Now pack blocks');
  if (!b) {
    page(
      g,
      'COMPILER EXPERIMENT    /    one interior thread',
      'Can the compiler issue these loads independently?',
    );
    name(g, 'One thread visits four tile rows.', 90, 273);
    const expanded = at(k, 0, 'Unroll that loop', 1.2),
      issue = at(k, 0, 'Independent loads', 1.1);
    for (const j of seq(4)) {
      const x = 129 + j * 437;
      mono(g, 'row + ' + j * 8, x, 358, 40);
      const yy = 455 + (1 - expanded) * j * 47;
      box(g, x, yy, 300, 82, C.dark, 10);
      mono(g, 'load ' + String.fromCharCode(65 + j), x + 150, yy + 41, 34, C.white, 'center');
      const dest = 708;
      line(
        g,
        [
          [x + 150, yy + 85],
          [x + 150, dest - 9],
        ],
        C.line,
        5,
      );
      travel(
        g,
        [
          [x + 150, yy + 85],
          [x + 150, dest - 9],
        ],
        issue,
      );
      box(g, x, dest, 300, 70, C.mint, 8);
      mono(g, 'store ' + String.fromCharCode(65 + j), x + 150, dest + 36, 31, C.ink, 'center');
    }
    note(
      g,
      expanded === 1
        ? 'Four explicit offsets expose the possible overlap.'
        : 'Each load supplies its own shared store.',
      'Illustrative schedule  ·  compare both builds’ generated assembly to see what actually changed.',
    );
  } else if (!pack) {
    page(
      g,
      'UNROLL TRIAL    /    illustrative clean batches',
      'Does the fastest run settle this comparison?',
    );
    const scale = (v) => 548 + (v - 0.19) * 22400,
      show = at(k, 1, 'Here are three clean', 1.1);
    name(g, 'Batch average (ms)  /  lower is faster', 89, 267);
    for (const [i, key] of ['baseline', 'candidate'].entries()) {
      const vals = batchExample[key],
        y = 424 + i * 175;
      label(g, key === 'baseline' ? 'Baseline' : 'Unroll pragma', 92, y, 44, C.ink, 'Serif');
      line(
        g,
        [
          [505, y],
          [1760, y],
        ],
        C.line,
        3,
      );
      vals.forEach((v, j) => {
        if (show * 3 < j + 1) return;
        const x = scale(v);
        circle(g, x, y, 17, i ? C.orange : C.teal);
        mono(g, v.toFixed(3), x, y - 49, 29, C.ink, 'center');
      });
      if (b >= 2) {
        const m = median(vals);
        line(
          g,
          [
            [scale(m), y + 25],
            [scale(m), y + 57],
          ],
          C.ink,
          3,
        );
        mono(g, 'median ' + m.toFixed(3), scale(m), y + 86, 24, C.muted, 'center');
      }
    }
    note(
      g,
      b >= 2
        ? 'The sample ranges overlap. The timing benefit is unresolved.'
        : 'Both builds emit the same target instructions.',
      'Same fixed workload  ·  separate unprofiled runs  ·  each dot is a batch average.',
    );
  } else {
    page(
      g,
      'TOY STREAMING MULTIPROCESSOR    /    capacity only',
      'How many whole blocks fit at once?',
    );
    const caps = resourceCapacity(40),
      show = at(k, 3, 'Count whole blocks', 1.3),
      decide = at(k, 3, 'Six blocks give');
    name(
      g,
      'One block  /  256 threads  ·  8 warps  ·  4,224 shared bytes  ·  40 registers/thread',
      87,
      268,
    );
    const rows = [
      ['Registers', '65,536 ÷ ' + fmt(caps.registersPerBlock), caps.registerBlocks],
      ['Shared bytes', '65,536 ÷ 4,224', caps.sharedBlocks],
      ['Warp slots', '64 ÷ 8', caps.warpBlocks],
    ];
    for (const [i, [title, calc, blocks]] of rows.entries()) {
      const y = 376 + i * 127;
      label(g, title, 85, y + 25, 38, C.ink, 'Sans', 'left', 600);
      mono(g, calc, 379, y + 25, 31, C.muted);
      for (const j of seq(15))
        box(
          g,
          837 + j * 52,
          y,
          42,
          59,
          j < blocks * show ? (decide && j < caps.blocks ? C.teal : C.gold) : C.metal,
          5,
        );
      mono(g, show === 1 ? blocks : '?', 1752, y + 28, 44, C.ink, 'center');
    }
    if (decide) {
      const x = 844,
        y = 748;
      for (const j of seq(64)) rect(g, x + j * 12.5, y, 10, 35, j < caps.warps ? C.teal : C.metal);
      mono(g, caps.warps + ' / 64 warp slots', 86, y + 17, 38);
    }
    note(
      g,
      decide
        ? caps.blocks +
            ' resident blocks  ·  ' +
            caps.fraction * 100 +
            '% of the declared warp ceiling'
        : 'Take the smallest whole-block limit.',
      'Toy capacity model ignores allocation rounding and all other limits. Measure achieved occupancy and elapsed time on the target.',
    );
  }
}

const batch = { n: 4096, launches: 100, ms: 0.2 };
function workload(n, ms) {
  const bytes = 2 * n * n * 4;
  return { bytes, mib: bytes / 2 ** 20, gbps: bytes / (ms / 1000) / 1e9 };
}
function timerScene(g, k) {
  const b = k.beat.beatIndex;
  if (b !== 2) {
    page(g, 'MEASUREMENT    /    CUDA events', 'Which launches are inside the timing interval?');
    const warmed = at(k, 0, 'warm up five'),
      started = at(k, 0, 'Start the CUDA'),
      stopped = at(k, 0, 'Stop the interval'),
      runs = stopped || at(k, 0, 'Run one hundred', 1.05),
      tested = at(k, 0, 'validate again');
    const runIdentity = 'RTX 5070 Ti    /    sm_120    /    CUDA 13.2.78';
    mono(g, runIdentity, 86, 262, 35);
    const y = 440;
    name(g, 'Validate', 86, 357);
    name(g, 'Warm up', 285, 357);
    name(g, 'Timed launches', 561, 357);
    name(g, 'Validate', 1589, 357);
    box(g, 84, y, 146, 100, at(k, 0, 'check a freshly') ? C.mint : C.metal, 6);
    for (const j of seq(5)) rect(g, 285 + j * 40, y, 31, 100, warmed ? C.gold : C.metal);
    board(g, 544, y - 10, 936, 119);
    for (const j of seq(batch.launches))
      rect(
        g,
        569 + j * 8.85,
        y + 9,
        6.15,
        80,
        j < Math.floor(runs * batch.launches + 1e-9) ? C.mint : '#3d625b',
      );
    box(g, 1578, y, 168, 100, tested ? C.mint : C.metal, 6);
    if (started) {
      line(
        g,
        [
          [544, 564],
          [544, 604],
          [stopped ? 1480 : 690, 604],
        ],
        C.teal,
        6,
      );
      mono(g, 'start', 544, 644, 28, C.teal, 'center');
    }
    if (stopped) {
      line(
        g,
        [
          [1480, 604],
          [1480, 564],
        ],
        C.teal,
        6,
      );
      mono(g, 'stop', 1480, 644, 28, C.teal, 'center');
    }
    if (b === 0)
      mono(g, 'nvcc   -O3   -arch=native   -lineinfo   -Xptxas=-v', 86, 741, 36, C.muted);
    if (b === 1) {
      const w = workload(batch.n, batch.ms),
        bytes = at(k, 1, 'That is one hundred'),
        rate = at(k, 1, 'about six hundred');
      mono(
        g,
        '2 × 4096² × 4 B' + (bytes ? '  =  ' + fmt(w.bytes) + ' B  =  ' + w.mib + ' MiB' : ''),
        86,
        741,
        43,
      );
      note(
        g,
        rate
          ? w.gbps.toFixed(1) + ' GB/s of logical read-plus-write traffic'
          : 'Batch elapsed time ÷ 100 = average interval per launch',
        rate
          ? 'Illustrative 0.200 ms average  ·  decimal GB/s  ·  counters measure the physical memory path.'
          : 'Separate per-call samples are needed for p95.',
      );
    } else
      note(
        g,
        stopped
          ? 'The event pair brackets 100 launches.'
          : 'Fresh check, five warmups, then the timed batch.',
        'Same GPU, source, float32 shape and launch configuration. Keep compiler resources and tool versions with the run.',
      );
  } else {
    page(
      g,
      'PROFILE IDENTITY    /    target launch',
      'Which profile could establish the limiting stage?',
    );
    const denied = at(k, 2, 'permission to collect'),
      route = at(k, 2, 'inspect load and store');
    name(g, 'Timed operation', 89, 310);
    mono(g, 'transpose_naive', 89, 398, 47);
    mono(g, 'N = 4096   ·   32 × 8 threads', 89, 464, 31);
    name(g, 'Counter collection', 1000, 310);
    mono(
      g,
      denied ? 'ERR_NVGPUCTRPERM' : 'Requested profile',
      1000,
      398,
      46,
      denied ? C.rose : C.muted,
    );
    label(
      g,
      denied ? 'No measured stage counters' : 'Match kernel, source, shape and selected launch.',
      1000,
      467,
      34,
      C.muted,
    );
    const stages = ['Warp request', 'L1 / TEX sectors', 'L2 cache', 'Device memory'];
    stages.forEach((t, i) => {
      const x = 87 + 446 * i;
      if (i < 3)
        line(
          g,
          [
            [x + 324, 668],
            [x + 437, 668],
            [x + 423, 657],
          ],
          C.line,
          4,
        );
      box(g, x, 604, 327, 128, route ? C.dark : C.metal, 8);
      label(g, t, x + 164, 668, 34, route ? C.white : C.ink, 'Sans', 'center');
    });
    note(
      g,
      denied
        ? 'Full aligned warp at N = 4096   ·   4 predicted load sectors, 32 store sectors'
        : 'Inspect the intended naive launch.',
      denied
        ? 'The recorded run leaves the limiting stage open. A copy-kernel profile belongs to a different workload.'
        : 'Skip one validation launch and five warmups when selecting the first measured launch.',
    );
  }
}

const deltas = recordedTiming.padded.map((t, i) => (t - recordedTiming.tiled[i]) * 1000);
const trials = [
  { stride: 32, rows: 8, time: 100 },
  { stride: 33, rows: 8, time: null },
  { stride: 33, rows: 16, time: 94 },
];
function timingPlot(g, k) {
  const paired = at(k, 1, 'Subtract the tiled time'),
    verdict = at(k, 2, 'Three rounds favored');
  if (!paired) {
    page(g, 'RECORDED ROUNDS    /    RTX 5070 Ti', 'Which transpose ran faster on this GPU?');
    name(
      g,
      '4096 × 4096 float32  /  100 launches per batch  /  all three passed exact checks',
      84,
      255,
    );
    const show = at(k, 0, 'These are recorded', 1.5);
    const compare = at(k, 0, 'Compare the dots', 0.65);
    const xx = (t) => 470 + (t - 0.18) * 7700;
    for (const [j, key] of ['naive', 'tiled', 'padded'].entries()) {
      const y = 390 + j * 152,
        color = [C.orange, C.teal, C.ink][j];
      label(g, key, 95, y, 50, color, 'Serif');
      line(
        g,
        [
          [449, y],
          [1771, y],
        ],
        C.line,
        2,
      );
      recordedTiming[key].forEach((t, i) => {
        if (show * 5 < i + 1) return;
        const yy = y + (i - 2) * 16;
        line(
          g,
          [
            [xx(t), y],
            [xx(t), yy],
          ],
          color,
          2,
        );
        circle(g, xx(t), yy, 9, color);
      });
    }
    if (compare) {
      const nearestNaive = xx(Math.min(...recordedTiming.naive));
      const nearestTiled = xx(Math.max(...recordedTiming.tiled));
      g.save();
      g.globalAlpha = compare;
      line(
        g,
        [
          [nearestTiled, 485],
          [nearestTiled, 464],
          [nearestNaive, 464],
          [nearestNaive, 443],
        ],
        C.teal,
        3,
      );
      label(
        g,
        'Gap between the two ranges',
        (nearestTiled + nearestNaive) / 2,
        437,
        29,
        C.muted,
        'Sans',
        'center',
      );
      g.restore();
    }
    for (const v of [0.18, 0.22, 0.26, 0.3, 0.34])
      mono(g, v.toFixed(2), xx(v), 780, 29, C.muted, 'center');
    note(
      g,
      at(k, 0, 'Keep tiling')
        ? 'All five tiled batches finished ahead of every naive batch.'
        : 'Each dot is one unprofiled batch average.',
      'Horizontal position is time in milliseconds. Faster runs lie farther left.',
    );
  } else {
    page(g, 'PAIRED ROUNDS    /    same GPU and workload', 'Did padding save time consistently?');
    const zero = 1082,
      scale = 89,
      seen = at(k, 1, 'Left of zero', 1.2);
    name(g, 'Padded minus tiled  /  microseconds per launch', 92, 264);
    line(
      g,
      [
        [zero, 311],
        [zero, 784],
      ],
      C.ink,
      4,
    );
    for (const [i, d] of deltas.entries()) {
      const y = 366 + i * 87,
        x = zero + d * scale;
      mono(g, 'Round ' + (i + 1), 98, y, 32);
      line(
        g,
        [
          [430, y],
          [1710, y],
        ],
        C.line,
        2,
      );
      if (seen * 5 >= i + 1) {
        line(
          g,
          [
            [zero, y],
            [x, y],
          ],
          d < 0 ? C.teal : C.orange,
          11,
        );
        circle(g, x, y, 15, d < 0 ? C.teal : C.orange);
        mono(
          g,
          (d > 0 ? '+' : '') + d.toFixed(2),
          x + (d < 0 ? -14 : 14),
          y - 22,
          31,
          d < 0 ? C.teal : C.orange,
          d < 0 ? 'right' : 'left',
        );
      }
    }
    mono(g, '0', zero, 800, 28, C.ink, 'center');
    note(
      g,
      verdict
        ? count(deltas, (d) => d < 0) +
            ' rounds faster  ·  ' +
            count(deltas, (d) => d > 0) +
            ' slower  ·  padding benefit unresolved'
        : 'Left of zero means padding saved time in that round.',
      'The one-word pad removes the modeled bank conflict. Each timing difference compares the same round.',
    );
  }
}
function trialScene(g, k) {
  page(
    g,
    'CONTROLLED TRIAL    /    hypothetical times',
    'Which kernel belongs between these runs?',
  );
  const show = at(k, 4, 'Run stride thirty-three'),
    combined = at(k, 3, 'Time falls');
  for (const [i, t] of trials.entries()) {
    const x = 98 + i * 610,
      known = i !== 1 || show;
    name(g, ['Baseline', 'Control to run', 'Two changes'][i], x, 282);
    board(g, x, 354, 477, 310);
    if (known) {
      label(g, 'One shared row', x + 22, 388, 27, C.white);
      for (const a of seq(t.stride))
        rect(g, x + 22 + a * 13.1, 416, 10.5, 29, a === 32 ? C.gold : C.mint);
      label(g, 'Thread block', x + 22, 477, 27, C.white);
      for (const j of seq(t.rows))
        for (const a of lanes) {
          rect(g, x + 22 + a * 13.1, 503 + j * 9, 10.5, 6.6, C.mint);
        }
      mono(g, 'stride ' + t.stride + '  ·  ' + t.rows + ' rows', x, 721, 36);
    } else mono(g, '?', x + 239, 510, 85, C.white, 'center');
    mono(
      g,
      i === 1 ? 'time   ?' : i === 2 && !combined ? 'time   ·' : 'time   ' + t.time,
      x,
      785,
      32,
      C.muted,
    );
    if (i < 2)
      line(
        g,
        [
          [x + 497, 505],
          [x + 579, 505],
          [x + 565, 493],
        ],
        C.teal,
        5,
      );
  }
  note(
    g,
    show
      ? 'Test padding at eight rows. Then test block height at stride 33.'
      : 'The right-hand run changed the shared stride and the block height.',
    'Each block stays 32 threads wide. Copper marks the extra shared word. The control time requires a new run.',
  );
}
function draw(g, k) {
  switch (k.beat.chapterId) {
    case 'c01':
      return copyScene(g, k);
    case 'c02':
      return sectorScene(g, k);
    case 'c03':
      return tileScene(g, k);
    case 'c04':
      return bankScene(g, k);
    case 'c05':
      return raceScene(g, k);
    case 'c06':
      return primitiveScene(g, k);
    case 'c07a':
      return resourceScene(g, k);
    case 'c07b':
      return timerScene(g, k);
    case 'c07':
      return k.beat.beatIndex < 3 ? timingPlot(g, k) : trialScene(g, k);
    default:
      throw new Error('Unknown chapter ' + k.beat.chapterId);
  }
}
function check() {
  const initial = copyState('reuse', 0);
  assert.deepEqual(initial.output, [poison, poison, words[2], poison]);
  assert.deepEqual(initial.phases, [0, 0, 0, 0]);
  assert.ok(Array.from(new Float32Array(new Uint32Array(words).buffer)).every(Number.isFinite));
  assert.ok(Number.isNaN(new Float32Array(new Uint32Array([poison]).buffer)[0]));
  for (const mode of ['reuse', 'poison', 'repair']) {
    const order = mode === 'repair' ? [0, 1, 3, 2] : [0, 1, 3];
    let previous = copyState(mode, 0).output;
    if (mode !== 'reuse') assert.deepEqual(previous, Array(4).fill(poison));
    for (const [step, lane] of order.entries()) {
      const moving = copyState(mode, (step + 0.5) / order.length);
      assert.deepEqual(moving.output, previous);
      assert.equal(moving.phases[lane], 0.5);
      assert.equal(moving.writes, step);
      const landed = copyState(mode, (step + 1) / order.length);
      const expected = previous.slice();
      expected[lane] = words[lane];
      assert.deepEqual(landed.output, expected);
      assert.equal(landed.writes, step + 1);
      previous = landed.output;
    }
  }
  for (const [mode, n, bad] of [
    ['reuse', 3, 0],
    ['poison', 3, 1],
    ['repair', 4, 0],
  ]) {
    const s = copyState(mode, 1);
    assert.equal(s.writes, n);
    assert.equal(s.mismatches, bad);
    assert.equal(s.output[omitted], mode === 'poison' ? poison : words[omitted]);
    assert.equal(copyState(mode, 0.5).writes, Math.floor(n * 0.5));
  }
  assert.equal(nanPair[0] ^ nanPair[1], 1);
  assert.ok(Array.from(new Float32Array(new Uint32Array(nanPair).buffer)).every(Number.isNaN));
  for (const [model, n, sectors, payload] of [
    [alignedLoad, 32, 4, 128],
    [stridedStore, 32, 32, 128],
    [firstTileLoad, 32, 5, 128],
    [nextTileLoad, 1, 1, 4],
  ]) {
    assert.equal(model.groups.size, sectors);
    assert.equal(model.bytes, sectors * 32);
    assert.equal(model.payload, payload);
    assert.equal(sum(Array.from(model.groups.values(), (v) => v.length)), n);
  }
  assert.deepEqual(firstTileLoad.activeLanes, lanes);
  assert.deepEqual(firstTileLoad.words, lanes.map((lane) => 33 + lane));
  assert.deepEqual([...firstTileLoad.groups.keys()], [4, 5, 6, 7, 8]);
  assert.deepEqual(firstTileLoad.groups.get(8), [0]);
  assert.deepEqual([nextTileLoad.row, nextTileLoad.width, nextTileLoad.firstColumn], [1, 33, 32]);
  assert.deepEqual(nextTileLoad.activeLanes, [0]);
  assert.deepEqual(nextTileLoad.words, [65]);
  assert.deepEqual([...nextTileLoad.groups], [[8, [1]]]);
  assert.equal(nextTileLoad.words[0], edgeWord(edge33).producer.value);
  assert.deepEqual(
    rowWords.map(({ value, source, target }) => [value, source, target]),
    [
      [1, [0, 1], [1, 0]],
      [5, [1, 1], [1, 1]],
      [9, [2, 1], [1, 2]],
      [13, [3, 1], [1, 3]],
    ],
  );
  for (const [edge, values, value, index] of [
    [edge33, 32, 65, 1057],
    [edge67, 96, 131, 4289],
  ]) {
    const watch = edgeWord(edge);
    assert.deepEqual(
      [
        edge.producers.length,
        edge.barrierArrivals,
        watch.producer.warp,
        watch.consumer.warp,
        watch.producer.value,
        watch.consumer.index,
      ],
      [values, 256, 1, 0, value, index],
    );
  }
  for (const [stride, first, banks, groups, bytes] of [
    [32, [0, 32, 64], 1, 32, 4096],
    [33, [0, 33, 66], 32, 1, 4224],
    [34, [0, 34, 68], 16, 2, 4352],
  ]) {
    const req = bankWords(stride),
      m = bankModel(stride);
    assert.deepEqual(
      req.slice(0, 3).map((r) => r.word),
      first,
    );
    assert.equal(m.sharedBytes, bytes);
    assert.equal(new Set(req.map((r) => r.bank)).size, banks);
    assert.equal(m.conflict, groups);
    assert.deepEqual(
      lanes.map((i) => count(req, (r) => r.bank === i)),
      m.counts,
    );
  }
  assert.equal(bankWords(34)[16].bank, 0);
  assert.deepEqual(scheduled(broken, 2), { memory: '65', register: OLD, output: EMPTY });
  assert.equal(scheduled(broken, 3).output, OLD);
  assert.equal(scheduled(fixed, 2).register, EMPTY);
  assert.equal(scheduled(fixed, 4).output, '65');
  assert.deepEqual(compact(bits), {
    offsets: [0, 0, 1, 1, 2, 3, 3, 3],
    list: [1, 3, 4, 7],
    total: 4,
  });
  assert.equal(median(batchExample.candidate), 0.207);
  assert.equal(median(batchExample.baseline), 0.211);
  const caps = resourceCapacity(40);
  assert.deepEqual(
    [caps.registerBlocks, caps.sharedBlocks, caps.warpBlocks, caps.warps, caps.fraction],
    [6, 15, 8, 48, 0.75],
  );
  const w = workload(batch.n, batch.ms);
  assert.deepEqual([w.bytes, w.mib, w.gbps.toFixed(1)], [134217728, 128, '671.1']);
  assert.ok(Math.max(...recordedTiming.tiled) < Math.min(...recordedTiming.naive));
  assert.deepEqual(
    deltas.map((v) => Number(v.toFixed(2))),
    [-1.4, 0.8, -0.81, 5.77, -5.48],
  );
  assert.equal(
    count(deltas, (d) => d < 0),
    3,
  );
  assert.equal(trials[0].rows, trials[1].rows);
  assert.equal(trials[1].stride, trials[2].stride);
  assert.equal(trials[1].time, null);
  return true;
}
export default { title: 'A Transpose That Makes Every Byte Count', draw, check };
