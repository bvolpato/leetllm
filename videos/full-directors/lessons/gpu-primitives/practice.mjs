import {
  ink,
  muted,
  line,
  teal,
  rust,
  light,
  blue,
  runColors,
  mix,
  cue,
  alpha,
  rect,
  rule,
  label,
  num,
  header,
  note,
  arrow,
  tag,
  band,
  pixels,
  bracket,
  hatch,
} from './graphics.mjs';
import {
  plays,
  flags,
  dest,
  packed,
  boundaries,
  groups,
  sum,
  leaders,
  argmax,
  useful,
  items,
  rate,
  before,
  after,
} from './examples.mjs';

export function selection(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'Output contracts',
    b < 2
      ? 'Which items get to write?'
      : b === 2
        ? 'What belongs in an empty segment?'
        : 'Which six won?',
  );
  if (b < 2) {
    const x = 431,
      w = 1344,
      step = w / 8,
      flag = cue(k, 0, 'into flags'),
      addr = cue(k, 0, 'Scan the flags'),
      write = cue(k, 1, 'four writes', 1);
    const focus = cue(k, 1, 'four writes', 0)
      ? flags.findIndex((keep, i) => keep && dest[i] === 1)
      : -1;
    [
      ['Play', plays, 1],
      ['Keep', flags, flag],
      ['Address', dest, addr],
    ].forEach(([title, row, a], i) => {
      const y = 313 + i * 124;
      label(c, title, 91, y, 42, muted);
      alpha(c, a, () => band(c, row, x, y, w, { focus, fs: 48 }));
    });
    label(c, 'Packed', 91, 773, 42, teal);
    packed.forEach((v, i) => {
      const xx = x + (i + 0.5) * step;
      tag(c, write >= 1 ? v : '', xx, 773, step - 8, 75, '#d4e7db', ink, 49);
    });
    if (write > 0)
      plays.forEach((v, i) => {
        if (!flags[i]) return;
        const xx = x + (i + 0.5) * step,
          end = x + (dest[i] + 0.5) * step;
        rule(c, xx, 602, mix(xx, end, write), mix(602, 727, write), teal, 4);
      });
    note(
      c,
      write
        ? 'Zero flags skip the write. Only kept values use their scanned addresses.'
        : 'Two inputs can have the same exclusive count. Check their flags.',
    );
  } else if (b === 2) {
    const show = cue(k, 2, 'sums are seven', 0.5);
    const edges = [96, 743, 1130, 1825];
    for (let i = 0; i < 3; i++) {
      const x = edges[i] + 12,
        w = edges[i + 1] - edges[i] - 24,
        mid = x + w / 2;
      label(
        c,
        '[' + boundaries[i] + ', ' + boundaries[i + 1] + ')',
        mid,
        334,
        52,
        muted,
        'center',
        'Mono',
      );
      if (groups[i].length) band(c, groups[i], x, 474, w, { fs: 44 });
      else {
        hatch(c, x + 32, 437, w - 64, 76);
        label(c, 'empty', mid, 575, 40, muted, 'center');
      }
      arrow(c, mid, 603, mid, 661, muted, 4);
      tag(c, show > 0 ? sum(groups[i]) : '?', mid, 752, 180, 95, light);
    }
    note(c, 'Half-open ranges include the left index and stop before the right index.');
  } else {
    const win = cue(k, 3, 'winning pair is six'),
      best = argmax(leaders);
    label(c, 'Source index', 100, 338, 42, muted);
    label(c, 'Value', 100, 493, 42, muted);
    leaders.forEach((v, i) => {
      const x = 674 + i * 421;
      num(c, i, x, 338, 46, muted);
      tag(c, v, x, 493, 224, 114, win && best === i ? '#f4cc89' : light, ink, 69);
    });
    alpha(c, win, () =>
      label(
        c,
        '(value ' + leaders[best] + ', index ' + best + ')',
        105,
        730,
        66,
        teal,
        'left',
        'Mono',
      ),
    );
    note(c, 'Finite values, nonempty input. Among equal maxima, keep the lowest source index.');
  }
}
export function testing(c, k) {
  const b = k.beat.beatIndex;
  header(
    c,
    'GPU lab',
    b < 2
      ? 'What traffic does fusion save?'
      : b === 2
        ? 'What is inside the timing window?'
        : b === 3
          ? 'Which bytes belong in the numerator?'
          : 'What evidence checks the handoff?',
  );
  if (b < 2) {
    const xs = [166, 725, 1333],
      labels = ['Scan flags', 'Slot 1 in memory', 'Pack value 4'];
    label(c, 'Library pipeline', 93, 307, 44, muted);
    for (let i = 0; i < 3; i++) {
      label(c, labels[i], xs[i], 438, 49, ink);
      if (i < 2) arrow(c, xs[i] + (i ? 416 : 299), 435, xs[i + 1] - 43, 435, teal, 5);
    }
    label(c, 'write', 590, 377, 32, muted, 'center');
    label(c, 'read', 1215, 377, 32, muted, 'center');
    label(c, 'Fused kernel', 93, 579, 44, muted);
    label(c, 'Scan flags', xs[0], 716, 49);
    label(c, 'Pack value 4', xs[2], 716, 49);
    const fused = cue(k, 1, 'later read disappear', 0.75);
    alpha(c, fused, () => {
      arrow(c, 455, 713, 1283, 713, rust, 5);
      label(c, 'Slot 1 in a register', 870, 652, 39, rust, 'center');
    });
    note(c, 'Both pipelines produce the same ordered output. Compare their complete runtimes.');
  } else if (b === 2) {
    const texts = [
      ['Setup', 'Allocate · upload', 'outside'],
      ['Warm up', '5 complete calls', 'outside'],
      ['Record events', '30 complete calls', 'timed'],
    ];
    const measured = cue(k, 2, 'time thirty');
    texts.forEach(([title, body, role], i) => {
      const x = 130 + i * 565;
      label(c, title, x, 381, 48);
      label(c, body, x, 509, 46, teal);
      label(c, role, x, 639, 37, muted, 'left', 'Mono');
    });
    alpha(c, measured, () => bracket(c, 1240, 1795, 692, 'CUDA event interval', rust));
    note(c, 'Include all operation passes. Reuse scratch outside the timed repetitions.');
  } else if (b === 3) {
    label(c, 'int32 input', 99, 333, 47);
    pixels(c, Array(4).fill(teal), 481, 290, 68, 83);
    label(c, 'int64 output', 99, 489, 47);
    pixels(c, Array(8).fill(blue), 481, 446, 68, 83);
    label(c, '4 bytes', 1123, 333, 49, teal);
    label(c, '8 bytes', 1123, 489, 49, blue);
    label(
      c,
      items.toLocaleString('en-US') + ' × (4 + 8) = ' + useful.toLocaleString('en-US') + ' bytes',
      100,
      650,
      55,
      ink,
      'left',
      'Mono',
    );
    alpha(c, cue(k, 3, 'four point one'), () =>
      label(c, '÷ 3 µs  ≈  ' + rate.toFixed(1) + ' GB/s', 102, 765, 56, rust, 'left', 'Mono'),
    );
    note(c, 'Worked timing example. Logical useful bytes omit metadata and intermediate traffic.');
  } else {
    const cases = [
      ['Index beyond end', 'memcheck'],
      ['Unordered shared read/write', 'racecheck'],
      ['Divergent block barrier', 'synccheck'],
    ];
    cases.forEach(([what, tool], i) => {
      const y = 367 + i * 171;
      label(c, what, 108, y, 51);
      arrow(c, 904, y, 1103, y, line, 5);
      alpha(c, cue(k, 4, tool), () => label(c, tool, 1173, y, 55, teal, 'left', 'Mono'));
    });
    note(c, 'Compare every prefix with a serial reference. Test 31 / 32 / 33 and 511 / 512 / 513.');
  }
}
function afterAnswer(k, beat, phrase) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  return k.reveal(phrase, 0, { captionStart: false }) === 1;
}

function runCard(c, value, x, y, color) {
  tag(c, value, x, y, 143, 77, light, ink, 49);
  rect(c, x - 71.5, y - 49, 143, 12, color);
}

export function finish(c, k) {
  const swap = cue(k, 2, 'Swap just', 1.35);
  const swapped = swap > 0;
  const moving = swapped && swap < 1;
  const data = swapped ? after : before;
  const palette = [...runColors, '#4d9c88'];
  header(
    c,
    'Final practice',
    swapped ? 'Where does the last run start now?' : 'Who owns the last write?',
  );
  label(
    c,
    swapped ? 'Same fifteen pixels. Only the two marked run lengths exchange owners.'
      : 'Padded lanes carry zero locally. Only real runs own a global write.',
    80, 194, 32, muted,
  );
  const known = swapped
    ? cue(k, 3, 'Fourteen', 0.55) && afterAnswer(k, 3, 'The first tile now contributes')
    : cue(k, 1, 'Ten', 0.55) && afterAnswer(k, 1, 'Its local exclusive prefix');
  const paint = swapped
    ? cue(k, 3, 'last tile contributes one', 0.8)
    : cue(k, 1, 'paints five pixels', 0.8);
  const cx = (i) => 358 + i * 189;
  label(c, 'Tile A', cx(1.5), 249, 38, teal, 'center');
  label(c, 'Tile B', cx(5.5), 249, 38, rust, 'center');
  rule(c, cx(3.5), 245, cx(3.5), 559, line, 3);
  label(c, 'Run length', 75, 378, 38, muted);
  label(c, 'Global start', 75, 521, 36, muted);
  for (let i = 0; i < 8; i++) {
    const live = i < data.lengths.length,
      x = cx(i);
    if (!live) {
      hatch(c, x - 71.5, 339, 143, 74);
      num(c, 0, x, 378, 42, muted);
    } else if (!moving || before.order[i] === after.order[i]) {
      runCard(c, data.lengths[i], x, 378, palette[data.order[i]]);
    }
    if (!moving || !live) {
      const showAddr = i !== 4 || known;
      num(c, live ? (showAddr ? data.starts[i] : '?') : '·', x, 521, 51, live ? ink : muted);
    }
  }
  if (moving) {
    const progress = Math.max(0, Math.min(1, (swap - 0.2) / 0.6));
    const shift = progress * progress * (3 - 2 * progress);
    const lift = Math.min(1, swap / 0.2, (1 - swap) / 0.2);
    for (const [i, id] of before.order.entries()) {
      const target = after.order.indexOf(id);
      if (i === target) continue;
      const y = 378 + Math.sign(target - i) * 92 * lift;
      runCard(c, before.lengths[i], mix(cx(i), cx(target), shift), y, palette[id]);
    }
  }
  const px = swapped ? 295 : 164,
    unit = swapped ? 95 : 104,
    y = swapped ? 729 : 667,
    h = swapped ? 60 : 85;
  if (swapped) {
    label(c, 'First row', 77, 624, 35, muted);
    label(c, 'Replay', 77, y + h / 2, 35, ink);
    before.lengths.forEach((n, i) =>
      pixels(
        c,
        Array(n).fill(palette[before.order[i]]),
        px + before.starts[i] * unit,
        605,
        unit,
        37,
      ),
    );
    const oldEdge = px + before.base * unit;
    rule(c, oldEdge, 575, oldEdge, 647, muted, 4);
    num(c, before.base, oldEdge, 552, 39, muted);
  }
  for (let j = 0; j < data.width; j++) {
    const i = data.starts.findLastIndex((s) => s <= j);
    if (!known) hatch(c, px + j * unit, y, unit - 2, h);
    else if (i < 4 || paint >= 1) pixels(c, [palette[data.order[i]]], px + j * unit, y, unit, h);
    else {
      hatch(c, px + j * unit, y, unit - 2, h);
      alpha(c, paint, () => pixels(c, [palette[data.order[i]]], px + j * unit, y, unit, h));
    }
  }
  // Before the prediction resolves, the grid gives the width without drawing the boundary.
  if (known) {
    const x = px + data.base * unit;
    rule(c, x, y - 31, x, y + h + 2, rust, 5);
    num(c, data.base, x, y - 56, 46, rust);
  }
  bracket(c, px, px + data.width * unit, y + h + 4, data.width + ' pixels');
}
