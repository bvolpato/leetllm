import {
  transposeLayout,
  addressLayout,
  C,
  text,
  mono,
  shell,
  foot,
  line,
  arrow,
  dot,
  cells,
  box,
  grid,
  cue,
  finished,
  mix,
} from './drawing.mjs';
import { storage, order, flat, afterWrite, marked, ySizes, backward } from './examples.mjs';

const bankX = 291;
const bankCellWidth = 94;
const bankCellHeight = 42;
const centers = (i) => bankX + (i + 0.5) * bankCellWidth;
function bank(g, vals, y, name, focus, show = 6, hideFocusedOffset = false) {
  text(g, name, 52, y + 20, 20, C.ink, { weight: 700 });
  for (let i = 0; i < vals.length; i++) {
    const offset = hideFocusedOffset && i === focus ? '?' : i * storage.BYTES_PER_ELEMENT;
    mono(g, offset, centers(i), y - 13, 14, C.gray, { align: 'center' });
  }
  text(g, 'byte offset', 176, y - 13, 14, C.gray);
  cells(g, vals, bankX, y, bankCellWidth, bankCellHeight, { highlight: focus, show });
}

export function view(g, c) {
  const reading = cue(c, 2, 'The original walks');
  const readingTranspose = cue(c, 2, 'The transpose');
  const turn = reading && !readingTranspose ? 0 : cue(c, 1, 'Turn the grid', 1.4);
  const scan = cue(c, 2, 'The original walks', 1.9);
  const forward = cue(c, 2, 'jumps forward', 1.0);
  const back = cue(c, 2, 'then back two', 1.0);
  const rest = cue(c, 2, 'All six values', 1.5);
  shell(
    g,
    'Tensor storage',
    'Where will the three go?',
    'One dense int64 allocation, six values, eight bytes per element',
    transposeLayout,
  );
  const active = turn >= 1;
  const sx = 70,
    sy = 162,
    w = 69,
    h = 55;
  const arc = Math.sin(Math.PI * turn);
  function tileOrigin(i) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const stagger = (col - row) * 15 * arc;
    // The tracked tile takes the outside of the turn so its wire clears the other faces.
    return [
      sx + mix(col, row, turn) * w + stagger + (i === marked ? 105 * arc : 0),
      sy + mix(row, col, turn) * h + (i === marked ? 55 * arc : 0),
    ];
  }
  for (const i of [0, 1, 2, 4, 5, marked]) {
    const [x, y] = tileOrigin(i);
    cells(g, [storage[i]], x, y, w - 1, h - 2, {
      highlight: i === marked ? 0 : -1,
    });
  }
  const [mx, my] = tileOrigin(marked);
  const ox = mx + (w - 3) * (0.5 + 0.5 * turn),
    oy = my + (h - 4) * (1 - 0.5 * turn);
  const footX = centers(marked) - 35;
  g.beginPath();
  g.moveTo(ox, oy);
  g.bezierCurveTo(ox + 115 * turn, oy + 60 * (1 - turn), 321, 318, 346, 318);
  g.lineTo(footX - 14, 318);
  g.quadraticCurveTo(footX, 318, footX, 332);
  g.lineTo(footX, 361);
  g.strokeStyle = C.red;
  g.lineWidth = 2;
  g.stroke();
  text(
    g,
    turn > 0 && !active ? 'Transposing' : active ? 'Transposed view' : 'Original view',
    429,
    183,
    24,
    C.teal,
    { weight: 600 },
  );
  if (turn === 0 || active) {
    mono(g, active ? 'y[0, 1]' : 'x[1, 0]', 429, 234, 35, C.red, { weight: 600 });
    mono(
      g,
      active ? 'shape (3, 2)    stride (1, 3)' : 'shape (2, 3)    stride (3, 1)',
      429,
      280,
      20,
    );
  }
  bank(g, storage, 361, 'Storage A', marked);
  if (reading) {
    const path = readingTranspose ? order : [0, 1, 2, 3, 4, 5],
      pos = readingTranspose ? forward + back + 3 * rest : scan * 5;
    const x = mix(
      centers(path[Math.floor(pos)]),
      centers(path[Math.min(5, Math.ceil(pos))]),
      pos % 1,
    );
    dot(g, x, 415, 5, C.blue);
    mono(g, 'Read   ' + path.slice(0, Math.floor(pos) + 1).join('  →  '), 295, 435, 16, C.blue);
    if (forward === 1) mono(g, back === 1 ? 'jumps   +3, −2' : 'jump   +3', 737, 435, 16, C.blue);
  }
  foot(
    g,
    readingTranspose ? 'Read the transposed rows.'
      : reading ? 'Read the original rows.'
      : active ? 'One slot. Two coordinates.'
      : turn > 0 ? 'Follow the wire from the moving three.'
      : 'Keep your eye on the start of the second row.',
    active
      ? 'x[1, 0] and y[0, 1] both address element 3 in storage A.'
      : 'The wire links a logical index to its physical storage.',
  );
}

export function route(g, c) {
  const detail = cue(c, 1, 'A layout copy', 0.8);
  const dispatch = cue(c, 2, 'In eager Python');
  shell(
    g,
    'Operator dispatch',
    dispatch ? 'Follow the call down to its kernel' : 'Where did the copy occur?',
    dispatch
      ? 'The operator schema stays fixed while applicable implementations handle the call.'
      : 'Illustrative event order for a consumer that requires contiguous input',
  );
  if (!dispatch) {
    const rows = [
      ['Transposed view', 212],
      ['Contiguous input', 345],
    ];
    rows.forEach(([label, y], i) => {
      text(g, label, 46, y - 42, 21, C.ink, { weight: 600 });
      arrow(g, 52, y + 49, 902, y + 49, C.gray, 1);
      box(g, 56, y, 175, 40, C.pale, C.teal, 3);
      text(g, i ? 'make contiguous' : 'transpose', 143, y + 20, 18, C.teal, { align: 'center' });
      box(g, 269, y - 10, 610, 60, C.white, C.rule, 7);
      if (!i && detail > 0) {
        g.save();
        g.globalAlpha = detail;
        box(g, 281, y, 194, 40, C.peach, C.red, 3);
        text(g, 'layout copy', 378, y + 20, 18, C.red, { align: 'center' });
        g.restore();
      }
      box(g, i ? 284 : 510, y, 310, 40, C.sky, C.blue, 3);
      text(g, 'kernel', i ? 439 : 665, y + 20, 18, C.blue, { align: 'center' });
      if (!i && !detail) text(g, 'inspect here', 367, y + 20, 17, C.gray, { align: 'center' });
    });
    foot(
      g,
      'Profile the consumer with the same values and mask.',
      'Boxes show event order. Their widths do not measure latency.',
    );
  } else {
    const phase = cue(c, 2, 'Dispatch uses') + cue(c, 2, 'The profiler');
    const rows = [
      ['Python call', 'torch.mm(x, w)'],
      ['ATen schema', 'mm(Tensor self, Tensor mat2) → Tensor'],
      ['Dispatch keys', 'autograd  →  redispatch  →  CPU'],
      ['Profiler event', 'operator and actual kernel'],
    ];
    rows.forEach(([label, value], i) => {
      const active = i < 2 || phase >= i - 1;
      if (i < 3) line(g, 96, 179 + i * 69, 96, 246 + i * 69, C.rule, 3);
      dot(g, 96, 176 + i * 69, active ? 10 : 5, active ? C.teal : C.rule);
      text(g, label, 133, 177 + i * 69, 19, active ? C.ink : C.gray, { weight: 600 });
      if (active) mono(g, value, 350, 177 + i * 69, 20, i === 3 ? C.blue : C.ink);
    });
    foot(
      g,
      'Follow the operation on the device that ran it.',
      'A dispatch key can identify a transformation. The profiler reveals the execution path.',
    );
  }
}

function transferCell(g, source, target, progress, sourceBottom, targetTop) {
  const from = centers(source);
  const to = centers(target);
  const leave = sourceBottom + 14;
  const arrive = targetTop - 14;
  const third = (arrive - leave) / 3;
  g.beginPath();
  g.moveTo(from, sourceBottom + 2);
  g.lineTo(from, leave);
  g.bezierCurveTo(from, leave + third, to, arrive - third, to, arrive);
  g.lineTo(to, targetTop - 2);
  g.strokeStyle = C.blue;
  g.lineWidth = 2;
  g.stroke();
  const x = mix(from, to, progress * progress * (3 - 2 * progress));
  const y = mix(leave, arrive, progress);
  box(g, x - 19, y - 11, 38, 22, C.sky, C.blue, 4);
  mono(g, storage[source], x, y, 17, C.blue, { align: 'center', weight: 700 });
}

export function flatten(g, c) {
  const slotKnown = cue(c, 0, 'With eight-byte integers');
  const bytesKnown = finished(c, 0, 'byte offset twenty-four');
  const trans = cue(c, 1, 'Transpose the sizes', 0.65);
  const walk = cue(c, 1, 'Flatten those rows');
  const copyPhrase = 'Reshape copies these six values in row order into a second allocation';
  const copyTiming = c.beat.beatIndex === 2 ? c.wordCue(copyPhrase) : null;
  const copy = cue(c, 2, copyPhrase, copyTiming ? copyTiming.end - copyTiming.start : 0);
  const stepsKnown = copyTiming && c.elapsed >= c.wordCue('It needs two different jumps').end;
  const prediction = c.beat.beatIndex >= 3;
  const write = cue(c, 4, 'Make the write');
  const changed = cue(c, 4, 'The flattened copy');
  const copyRead = cue(c, 4, 'An address needs');
  const vals = changed ? afterWrite : storage;
  const bytes = storage.BYTES_PER_ELEMENT;
  const copyIndex = order.indexOf(marked);
  const step = copy * flat.length;
  const written = Math.floor(step);
  const copying = copy > 0 && written < flat.length;
  const transposeRows = Array.from({ length: ySizes[0] }, (_, row) =>
    order.slice(row * ySizes[1], (row + 1) * ySizes[1]).map((i) => vals[i]),
  );
  shell(
    g,
    'Storage addressing',
    prediction ? 'Which reads follow the write?'
      : copy ? 'Reshape reads the transpose in row order'
      : walk ? 'Can one stride flatten these rows?'
      : 'How do the views reach the same bytes?',
    'Storage offset = 0 elements     ·     int64 = ' + bytes + ' bytes',
    addressLayout,
  );
  const gridY = 174;
  const cellW = 47;
  const cellH = 35;
  const transposeX = 296;
  text(g, 'Original x', 54, 160, 18, C.teal, { weight: 700 });
  grid(g, [vals.slice(0, 3), vals.slice(3)], 54, gridY, cellW, cellH, Number(vals[marked]));
  if (trans > 0) {
    g.save();
    g.globalAlpha = trans;
    text(g, 'Transpose y', transposeX, 160, 18, C.teal, { weight: 700 });
    grid(g, transposeRows, transposeX, gridY, cellW, cellH, Number(vals[marked]));
    g.restore();
  }
  if (copying) {
    const x = transposeX + (written % ySizes[1]) * cellW;
    const y = gridY + Math.floor(written / ySizes[1]) * cellH;
    box(g, x, y, cellW - 2, cellH - 2, null, C.blue, 3);
  }
  mono(g, 'x[1, 0]   1×3 + 0×1 = ' + (slotKnown ? marked : '?'), 458, 177, 19);
  if (trans) mono(g, 'y[0, 1]   0×1 + 1×3 = ' + marked, 458, 218, 19);
  if (slotKnown) {
    const result = bytesKnown ? marked * bytes + ' B' : '?';
    mono(g, marked + ' elements × ' + bytes + ' B = ' + result, 458, 259, 21, C.red);
  }
  const [first, second, third] = order;
  if (stepsKnown)
    mono(g, 'Stride steps   +' + (second - first) + ', −' + (second - third), 54, 265, 19, C.blue);

  const sourceY = 305;
  const copyY = 392;
  const copyCellHeight = 36;
  bank(g, vals, sourceY, 'Storage A', marked, vals.length, !bytesKnown);
  if (walk && !copy)
    mono(g, 'Row-order element indices   ' + [first, second, third].join(' → '), bankX, 389, 22, C.blue);
  if (copy > 0) {
    text(g, 'Copy B', 52, copyY + copyCellHeight / 2, 20, C.ink, { weight: 700 });
    cells(g, flat, bankX, copyY, bankCellWidth, copyCellHeight, {
      show: written,
      highlight: written > copyIndex ? copyIndex : -1,
      chosen: copyRead ? C.blue : C.red,
    });
    const offsetY = copyY + copyCellHeight + 11;
    text(g, 'byte offset', 176, offsetY, 16, C.gray);
    flat.forEach((_, i) => mono(g, i * bytes, centers(i), offsetY, 16, C.gray, { align: 'center' }));

    if (copying) {
      const source = order[written];
      const inset = bankCellWidth / 2;
      const outlineWidth = bankCellWidth - 2;
      box(g, centers(source) - inset, sourceY, outlineWidth, bankCellHeight, null, C.blue, 3);
      box(g, centers(written) - inset, copyY, outlineWidth, copyCellHeight, null, C.blue, 3);
      transferCell(g, source, written, step - written, sourceY + bankCellHeight, copyY);
    }
  }

  if (changed) {
    const reads = 'x[1, 0] = ' + vals[marked] + '      y[0, 1] = ' + vals[marked];
    if (copyRead) {
      return foot(
        g,
        reads + '      flat[' + copyIndex + '] = ' + flat[copyIndex],
        'Both views reach byte ' + marked * bytes + ' in A. The copy reads byte ' + copyIndex * bytes + ' in B.',
      );
    }
    return foot(g, reads, 'Both views read the same storage cell.');
  }
  if (write) return foot(g, 'Write ' + afterWrite[marked] + ' through y[0, 1].');
  if (prediction)
    return foot(g, 'Which cells will change when y[0, 1] becomes ' + afterWrite[marked] + '?');
  if (copy) return foot(g, 'flat = y.reshape(-1)', 'Read A in transposed row order. Fill B from left to right.');
  if (walk) return foot(g, 'Try following one stride from the first element to the third.');
  foot(
    g,
    bytesKnown ? 'x[1, 0] begins at byte ' + marked * bytes + '.' : 'Which byte offset holds x[1, 0]?',
    'A stride counts elements. Multiply by the element size to obtain bytes.',
  );
}

export function tape(g, c) {
  const badHandle = cue(c, 1, 'Detach the intermediate');
  const badWrite = cue(c, 2, 'The write reached');
  const badVerdict = cue(c, 2, 'Substituting four');
  const replay = cue(c, 3, 'Replay the forward');
  const cloned = cue(c, 3, 'clone the detached');
  const goodWrite = cue(c, 3, 'The clone takes');
  const dy = cue(c, 4, 'six to the multiply', 0.62);
  const dx = cue(c, 4, 'twelve to the leaf', 0.62);
  const state = backward({ clone: !!cloned, write: !!(replay ? goodWrite : badWrite) });
  shell(
    g,
    'Reverse-mode autograd',
    'Can the square still read its input?',
    'Executed path     y = 2x     ·     loss = y²',
  );
  const xs = [106, 440, 810],
    names = ['Leaf x', 'Intermediate y', 'Forward loss'],
    vals = [state.leaf, state.value, state.loss];
  xs.forEach((x, i) => {
    if (i < 2) arrow(g, x + 63, 207, xs[i + 1] - 66, 207, C.gray);
    text(g, names[i], x, 162, 18, C.gray, { align: 'center' });
    box(g, x - 60, 181, 120, 52, C.white, C.rule, 5);
    mono(g, vals[i], x, 207, 27, C.ink, { align: 'center', weight: 700 });
  });
  text(g, '× 2', 270, 189, 19, C.blue, { align: 'center' });
  text(g, 'square', 629, 189, 19, C.blue, { align: 'center' });
  text(g, 'Forward values', 48, 257, 14, C.gray);
  line(g, 41, 272, 920, 272, C.rule);
  text(g, 'Saved for backward', 46, 300, 19, C.ink, { weight: 700 });
  mono(g, 'A   expected v' + state.saved.expected, 47, 338, 18);
  arrow(g, 263, 336, 341, 336, C.teal);
  box(g, 354, 305, 192, 65, C.pale, C.teal, 5);
  mono(g, 'A   value ' + state.src.value, 371, 326, 19);
  mono(g, 'version ' + state.src.version, 371, 353, 16, C.teal);
  if (badHandle && !replay) {
    text(g, 'Detached handle', 725, 301, 18, C.gray, { align: 'center' });
    arrow(g, 733, 336, 555, 336, C.red);
    text(g, badWrite ? 'add_(1) wrote to A' : 'also points to A', 730, 371, 16, C.red, {
      align: 'center',
    });
  }
  if (cloned) {
    box(g, 636, 305, 245, 65, C.sky, C.blue, 5);
    mono(g, 'Clone B   value ' + state.target.value, 650, 326, 18);
    mono(g, 'version ' + state.target.version, 650, 353, 16, C.blue);
  }
  if (badVerdict && !replay)
    text(g, 'Backward stopped at the saved version check', 355, 411, 21, C.red, { weight: 700 });
  if (c.beat.beatIndex === 4) {
    const edges = [
      { start: 792, end: 452, progress: dy, value: state.dy, label: '2y = ' + state.dy },
      { start: 427, end: 103, progress: dx, value: state.dx, label: '2 × ' + state.dy + ' = ' + state.dx },
    ];
    for (const { start, end, progress, value, label } of edges) {
      line(g, start, 411, end, 411, C.rule);
      if (progress === 0) continue;
      const front = mix(start, end, progress);
      arrow(g, start, 411, front, 411, C.teal);
      if (progress < 1) {
        box(g, front - 16, 398, 32, 26, C.teal, null, 4);
        mono(g, value, front, 411, 16, C.white, { align: 'center', weight: 700 });
      } else {
        text(g, label, (start + end) / 2, 390, 19, C.teal, { align: 'center' });
      }
    }
    text(
      g,
      dx === 1 ? 'Leaf gradient: ' + state.dx : 'Gradients move backward along the saved operations.',
      46, 446, 20, C.ink, { weight: 700 },
    );
    return;
  }
  foot(
    g,
    replay
      ? 'Replay with independent storage'
      : badWrite
        ? 'Compare the saved version with the live version.'
        : 'The square saves a reference and its version.',
    replay
      ? 'The leaf, multiply and square use the same inputs as the first run.'
      : 'The upper path records values at forward time. The lower allocation shows the current bytes.',
  );
}
