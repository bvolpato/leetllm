import {
  ink,
  muted,
  line,
  teal,
  rust,
  light,
  runColors,
  mix,
  fmt,
  cue,
  alpha,
  rect,
  rule,
  dot,
  label,
  num,
  header,
  note,
  pixels,
  tag,
  hatch,
  arrow,
} from './graphics.mjs';
import {
  widths,
  starts,
  ends,
  downs,
  blocks,
  totals,
  offsets,
  locals,
  metadata,
  priorRecords,
  lookBack,
  scanWork,
} from './examples.mjs';

const cells = widths.flatMap((n, i) => Array(n).fill(runColors[i]));
function portion(level, lane) {
  const first = Math.max(0, lane - 2 ** level + 1);
  return cells.slice(starts[first], starts[lane] + widths[lane]);
}
export function scan(c, k) {
  const b = k.beat.beatIndex,
    x = (i) => 542 + i * 350,
    y = (i) => 342 + i * 174;
  header(
    c,
    'Hillis-Steele scan',
    b === 3 ? 'Where does each lane paint?' : 'Which edge belongs to orange?',
  );
  if (b < 3) {
    const stage1 = cue(k, 1, 'Cream joins orange', 0.9),
      stage2 = cue(k, 2, 'Reach back two places', 1.1);
    const a = [1, stage1, stage2];
    for (let r = 0; r < 3; r++) {
      const yy = y(r);
      label(
        c,
        ['Run length', 'One lane left', 'Two lanes left'][r],
        80,
        yy + 9,
        38,
        r === 0 || a[r] > 0 ? ink : muted,
      );
      for (let i = 0; i < 4; i++) {
        if (!r) label(c, 'Lane ' + i, x(i), yy - 65, 31, muted, 'center', 'Mono');
        const group = portion(r, i);
        if (r > 0) {
          const stride = 2 ** (r - 1);
          if (i >= stride)
            alpha(c, a[r], () => {
              const from = x(i - stride),
                to = x(i);
              rule(
                c,
                from,
                y(r - 1) + 57,
                mix(from, to, a[r]),
                mix(y(r - 1) + 57, yy - 53, a[r]),
                i === 2 ? rust : line,
                i === 2 ? 5 : 3,
              );
            });
        }
        if (a[r] > 0) {
          const leftEdge = x(i) - group.length * 12;
          if (r === 0) pixels(c, group, leftEdge, yy + 35, 24, 20);
          else {
            const other = i - 2 ** (r - 1);
            let dest = leftEdge;
            for (const lane of other < 0 ? [i] : [other, i]) {
              const old = portion(r - 1, lane);
              const origin = x(lane) - old.length * 12;
              alpha(c, a[r], () =>
                pixels(c, old, mix(origin, dest, a[r]), mix(y(r - 1) + 35, yy + 35, a[r]), 24, 20),
              );
              dest += 24 * old.length;
            }
          }
          const count =
            r === 0
              ? 1
              : r === 1
                ? cue(k, 1, 'gives five')
                : i < 2
                  ? stage2
                  : cue(k, 2, i === 2 ? 'gives eight' : 'gives ten');
          alpha(c, count, () => num(c, ends[r][i], x(i), yy, 55));
        } else {
          rule(c, x(i) - 71, yy + 28, x(i) + 71, yy + 28, line);
        }
      }
    }
    note(
      c,
      b === 0
        ? 'Read every lane from the same snapshot.'
        : b === 1
          ? 'The lane on the left supplies its old count.'
          : 'The second round reads the saved first-round sums.',
    );
    return;
  }
  const arrival = cue(k, 3, 'At pixel four', 0.45),
    paint = cue(k, 3, 'Let all four lanes paint', 1.25);
  const bx = 202,
    pitch = 150;
  label(c, 'Bill pixels', 90, 315, 36, muted);
  const neighbors = [
    ['YYgCCOOOOT', 418],
    ['yyYOOOOOTT', 590],
  ];
  const shades = {
    Y: runColors[0],
    C: runColors[1],
    O: runColors[2],
    T: runColors[3],
    g: '#ffd778',
    y: '#e3a137',
  };
  for (const [row, top] of neighbors)
    alpha(c, 0.52, () =>
      [...row].forEach((v, i) => rect(c, bx + i * pitch, top, pitch, 32, shades[v])),
    );
  cells.forEach((col, i) => {
    const xx = bx + i * pitch;
    num(c, i, xx + pitch / 2, 380, 42, muted);
    hatch(c, xx, 450, pitch - 2, 140);
    const owner = starts.findLastIndex((s) => s <= i);
    const fill = Math.min(1, Math.max(0, paint * widths[owner] - (i - starts[owner])));
    if (fill > 0) rect(c, xx, 450, (pitch - 2) * fill, 140, col);
    rule(c, xx, 590, xx + pitch - 2, 590, ink);
  });
  [0, ...ends.at(-1)].forEach((edge) => {
    const xx = bx + edge * pitch;
    alpha(c, arrival, () => {
      rule(c, xx, 593, xx, 655, edge === 4 ? rust : ink, 5);
      num(c, edge, xx, 703, edge === 4 ? 78 : 54, edge === 4 ? rust : ink);
    });
  });
  note(c, 'Start at the previous end. The end boundary lies just beyond the last painted pixel.');
}
export function blelloch(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'Blelloch scan',
    b === 2 ? 'How many additions buy every prefix?' : 'How does a tree distribute starts?',
  );
  if (b === 2) {
    const larger = cue(k, 2, 'At five hundred twelve', 0.01) > 0,
      n = larger ? 512 : 32,
      w = scanWork(n);
    label(c, n + ' inputs', 98, 314, 49, teal);
    [
      [w.hillis, w.hillisStages, 'Hillis-Steele'],
      [w.blelloch, w.blellochStages, 'Blelloch'],
    ].forEach(([adds, rounds, name], i) => {
      const y = 444 + i * 222;
      label(c, name, 98, y, 48);
      rect(c, 489, y - 23, (918 * adds) / w.hillis, 50, i ? teal : '#ce8d48');
      label(c, adds.toLocaleString('en-US') + ' adds', 1452, y, 42, ink);
      label(c, rounds + ' rounds', 490, y + 76, 40, muted);
    });
    note(c, 'Counts for a power-of-two tile. Memory traffic and synchronization also affect time.');
    return;
  }
  const cx = (i) => 565 + i * 349;
  const milestones = [
    1,
    cue(k, 0, 'saves two'),
    cue(k, 0, 'total is seven'),
    cue(k, 0, 'replace the root'),
    cue(k, 1, 'The left subtree'),
    cue(k, 1, 'Repeat the split'),
  ];
  // The leaves remain visible under each successive tree operation.
  const stages = b === 0 ? [0, 1, 2, 3] : [2, 3, 4, 5];
  stages.forEach((stage, i) => {
    const row = downs.states[stage],
      y = 315 + i * 136;
    const names = [
      'Signed plays',
      'Up / pairs',
      'Up / root',
      'Root gets 0',
      'Down / pairs',
      'Exclusive',
    ];
    label(c, names[stage], 85, y, 39, stage === 5 ? teal : muted);
    alpha(c, milestones[stage], () =>
      row.values.forEach((v, j) => {
        const changed = stage === 0 || v !== downs.states[stage - 1].values[j];
        tag(
          c,
          v,
          cx(j),
          y,
          214,
          72,
          changed ? (stage >= 3 ? '#bee0d2' : '#efd29d') : light,
          ink,
          48,
        );
      }),
    );
  });
  note(
    c,
    b === 0
      ? 'Keep the block total before seeding the root with the additive identity.'
      : 'Each right child inherits its parent’s start plus the old left sum.',
  );
}

function afterPhrase(clock, phrase) {
  return clock.elapsed >= clock.wordCue(phrase).end;
}

function walkPredecessors(c, k) {
  const local = 2;
  const found = ['prefix of seven', 'another of four', 'aggregate of three'].map((phrase) =>
    afterPhrase(k, phrase),
  );
  const reached = ['then a completed prefix', 'another of four', 'it finds a published'].map(
    (phrase) => k.reveal(phrase, 0.55, { captionStart: false }),
  );
  const visited = priorRecords.filter((_, i) => found[i]);
  const terms = visited.map(({ v }) => v).reverse();
  const offset = lookBack(visited);
  const localReady = afterPhrase(k, 'Our tile holds two');
  const offsetReady = afterPhrase(k, 'starting offset is fourteen');
  const endReady = afterPhrase(k, 'ending prefix is sixteen');
  const published = afterPhrase(k, 'Publish that prefix');
  const current = { type: published ? 'P' : 'A', v: published ? offset + local : local };
  const x = (i) => 344 + i * 402;
  [...priorRecords, current].forEach(({ type, v }, i) => {
    label(c, 'Tile ' + i, x(i), 352, 38, muted, 'center');
    tag(c, type, x(i), 454, 194, 88, type === 'P' ? '#e8c986' : light, ink, 60);
    if (found[i] || (i === priorRecords.length && localReady)) {
      num(c, v, x(i), 565, 64, ink);
    }
    if (reached[i] > 0) {
      const from = x(i + 1) - 106;
      arrow(c, from, 454, mix(from, x(i) + 106, reached[i]), 454, teal, 4);
    }
    if (i === priorRecords.length && published) {
      label(c, 'Local sum ' + local, x(i), 631, 36, muted, 'center');
    }
  });

  label(c, offsetReady ? 'Offset' : 'Offset so far', 125, 692, 38, muted);
  const expression = terms.join(' + ');
  const subtotal = terms.length > 1 ? ' = ' + (found[0] && !offsetReady ? '?' : offset) : '';
  label(c, expression ? expression + subtotal : '?', 125, 779, 62, teal, 'left', 'Mono');
  if (offsetReady) {
    label(c, 'Prefix through Tile ' + priorRecords.length, 1000, 692, 38, muted);
    label(
      c,
      offset + ' + ' + local + ' = ' + (endReady ? offset + local : '?'),
      1000,
      779,
      62,
      ink,
      'left',
      'Mono',
    );
  }
  note(
    c,
    found[0]
      ? 'Stop at P. Its value already includes every earlier tile.'
      : 'A = tile aggregate. P = prefix through this tile.',
  );
}

function replayPublication(c, k) {
  const tile = priorRecords.length - 1;
  const aggregate = priorRecords[tile];
  const acquirePhrase = 'acquires that status';
  const readPhrase = 'using the value';
  const wrote = afterPhrase(k, 'writes the value');
  const released = wrote && afterPhrase(k, 'release-publishing its status');
  const acquired = released && afterPhrase(k, acquirePhrase);
  const read = acquired && afterPhrase(k, readPhrase);
  const acquire = k.reveal(acquirePhrase, 0.55, { captionStart: false });
  const use = k.reveal(readPhrase, 0.55, { captionStart: false });
  const producerX = 659;
  const readerX = 1452;
  const statusY = 456;
  const payloadY = 658;
  label(c, 'Tile ' + tile + ' · producer', producerX, 319, 46, ink, 'center');
  label(c, 'Tile ' + (tile + 1) + ' · reader', readerX, 319, 46, ink, 'center');
  label(c, 'Status', 125, statusY, 43, muted);
  label(c, 'Payload', 125, payloadY, 43, muted);
  tag(c, released ? aggregate.type : 'X', producerX, statusY, 276, 96, released ? light : '#e7c6ba');
  tag(c, wrote ? aggregate.v : '?', producerX, payloadY, 276, 96, wrote ? light : '#e6e4d8');
  if (released && acquire > 0) {
    const start = producerX + 158;
    arrow(c, start, statusY, mix(start, readerX - 220, acquire), statusY, teal, 5);
  }
  if (acquired && use > 0) {
    const start = producerX + 158;
    arrow(c, start, payloadY, mix(start, readerX - 220, use), payloadY, teal, 5);
  }
  tag(
    c,
    acquired ? 'A' : 'Waiting for A',
    readerX,
    statusY,
    394,
    96,
    acquired ? light : '#e6e4d8',
    ink,
    46,
  );
  tag(
    c,
    read ? aggregate.v : 'Unread',
    readerX,
    payloadY,
    394,
    96,
    read ? light : '#e6e4d8',
    ink,
    46,
  );
  if (wrote) label(c, '1. Write payload', producerX, payloadY + 82, 36, muted, 'center');
  if (released) label(c, '2. Release status', producerX, statusY + 82, 36, muted, 'center');
  if (acquired) label(c, '3. Acquire status', readerX, statusY + 82, 36, muted, 'center');
  if (read) label(c, '4. Read payload', readerX, payloadY + 82, 36, muted, 'center');
  note(
    c,
    afterPhrase(k, 'let predecessors run')
      ? 'Predecessor tiles must be able to run.'
      : 'X = unpublished. A = aggregate available.',
  );
}

export function blockScan(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    b < 2 ? 'Global prefix' : b === 2 ? 'Metadata hierarchy' : 'Decoupled look-back',
    b < 2
      ? 'Where must the second trace begin?'
      : b === 2
        ? 'When does the metadata spill?'
        : b === 3
          ? 'Which record lets the reader continue?'
          : 'When may Tile 3 read the payload?',
  );
  if (b < 2) {
    const t = cue(k, 1, 'Lift the entire right trace', 1.2);
    const px = (i) => 235 + i * 177,
      py = (v) => 645 - v * 22;
    for (const v of [-4, 0, 4, 8, 12]) {
      rule(c, 170, py(v), 1730, py(v), v === 0 ? muted : line, v === 0 ? 3 : 1);
      num(c, v, 123, py(v), 31, muted);
    }
    blocks.forEach((block, j) => {
      const vals = [...locals[j], totals[j]],
        off = j ? t * offsets[j] : 0,
        col = j ? rust : teal;
      label(c, 'Block ' + (j ? 'B' : 'A'), px(j * 4 + 0.5), 292, 41, col);
      for (let i = 0; i < 4; i++) {
        const xx = px(4 * j + i),
          yy = py(vals[i] + off),
          next = py(vals[i + 1] + off);
        rule(c, xx, yy, px(4 * j + i + 1), next, col, 8);
        label(
          c,
          block[i] > 0 ? '+' + block[i] : fmt(block[i]),
          xx + 88,
          800,
          39,
          ink,
          'center',
          'Mono',
        );
      }
      vals.forEach((v, i) => {
        const xx = px(j * 4 + i),
          yy = py(v + off);
        dot(c, xx, yy, 11, col);
        if (j === 0 && i === 4 && t === 1) return;
        const dv = Number.isInteger(v + off)
          ? fmt(v + off)
          : (v + off).toFixed(1).replace('-', '−');
        label(c, dv, xx + (i === 0 && j === 1 ? 19 : 0), yy - 32, 36, col, 'center', 'Mono');
      });
    });
    label(c, 'Play', 80, 800, 33, muted);
    note(
      c,
      t === 1
        ? 'Block B adds 7 to every prefix. At the join, both traces read 7.'
        : t > 0
          ? 'Shifting every boundary in block B by the same amount.'
          : 'Both local scans start at zero. Track the join between plays four and five.',
    );
    return;
  }
  if (b === 2) {
    label(c, 'Inputs', 100, 335, 37, muted);
    label(c, 'Block totals', 600, 335, 37, muted);
    label(c, 'Next level', 1085, 335, 37, muted);
    label(c, 'Root', 1555, 335, 37, muted);
    const inc = cue(k, 2, 'Add one more input'),
      spill = cue(k, 2, 'five hundred thirteen totals');
    for (let j = 0; j < 2; j++) {
      const y = 485 + j * 205;
      const arr = metadata[j];
      arr.forEach((v, i) =>
        alpha(c, j === 0 ? 1 : i === 0 ? inc : spill, () => {
          const x = [100, 600, 1085, 1555][i];
          label(c, v.toLocaleString('en-US'), x, y, 63, i === 0 ? ink : teal, 'left', 'Mono');
          if (i < arr.length - 1) arrow(c, x + 300, y, x + 412, y, line);
        }),
      );
    }
    note(c, 'Each level groups up to 512 values and rounds the number of tiles up.');
    return;
  }
  if (b === 3) walkPredecessors(c, k);
  else replayPublication(c, k);
}
