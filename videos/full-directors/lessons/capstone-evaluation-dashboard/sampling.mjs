import * as E from './evidence.mjs';
import {
  C,
  cue,
  end,
  mix,
  ease,
  rect,
  slide,
  mark,
  key,
  path,
  line,
  dot,
  txt,
  label,
  heading,
  stamp,
  docIcon,
} from './art.mjs';

function sampleTile(c, x, y, i, rows, w = 246, h = 103) {
  slide(c, x - w / 2, y - h / 2, w, h);
  key(c, x - w / 2 + 42, y, E.keys[i], 44, C.blue);
  txt(c, E.rowNames[i], x - w / 2 + 74, y, 23, C.ink, 'Sans', 600, 'left', w - 123);
  mark(c, x + w / 2 - 25, y, rows[i].passed, 15, true);
}
export function bootstrap(c, k) {
  const b = k.beat.beatIndex;
  const chart = cue(k, 1, 'Count every ordered draw');
  const perfect = Boolean(cue(k, 3, 'Now use the four passing rows'));
  const rows = perfect ? E.repair : E.base;
  const x = (i) => 272 + i * 350;
  if (!chart) {
    heading(c, 'BOOTSTRAP   /   ' + rows[0].run, 'Four draws with replacement');
    label(c, 'SOURCE FIXTURES', 71, 227);
    for (let i = 0; i < 4; i++) {
      sampleTile(c, x(i), 315, i, rows);
      rect(c, x(i) - 123, 549, 246, 103, null, C.line, 9);
    }
    label(c, 'ORDERED DRAWS', 71, 681);
    const phrases = [
      'Draw the policy tile',
      'Draw the rewording',
      'then draw the rewording again',
      'Finish with the unsupported question',
    ];
    const draws = E.drawIds.map((src, i) => ({
      src,
      slot: i,
      p: ease(cue(k, 0, phrases[i], 1.05)),
    }));
    for (const { src, slot, p } of draws) {
      if (p > 0) {
        const y = mix(371, 543, p),
          xx = mix(x(src), x(slot), p);
        path(
          c,
          [
            [x(src), 371],
            [xx, y],
          ],
          null,
          src === 1 ? C.amber : C.soft,
          3,
        );
      }
    }
    for (const { src, slot, p } of draws) {
      if (p > 0) sampleTile(c, mix(x(src), x(slot), p), mix(315, 600, p), src, rows);
    }
    const tally = cue(k, 1, 'Two of four', 0.65);
    if (tally > 0) {
      const inspected = draws.slice(0, Math.ceil(draws.length * tally));
      const passed = E.passCount(inspected.map(({ src }) => rows[src]));
      for (const { src, slot } of inspected) {
        if (rows[src].passed) {
          line(c, x(slot) - 99, 660, x(slot) + 99, 660, C.teal, 5);
        }
      }
      txt(
        c,
        tally === 1 ? passed + ' of ' + draws.length + ' draws passed' : 'Passes counted: ' + passed,
        800,
        716,
        50,
        C.teal,
        'Serif',
        400,
        'center',
      );
    }
  } else {
    heading(
      c,
      'WITHIN-RUN SENSITIVITY   /   ' + rows[0].run,
      'All ordered resamples of these four questions',
    );
    rows.forEach((r, i) => sampleTile(c, 278 + 348 * i, 252, i, rows, 248, 78));
    const dist = E.distribution(rows);
    const xs = [345, 575, 805, 1035, 1265];
    label(c, 'Sequences', 78, 370);
    for (const count of [0, 128, 256]) {
      const yy = 676 - count * 1.08;
      line(c, 217, yy, 1456, yy, C.line);
      txt(c, count, 191, yy, 22, C.soft, 'Mono', 500, 'right');
    }
    dist.bins.forEach((n, i) => {
      const xx = xs[i],
        height = n * 1.08;
      if (n) rect(c, xx - 65, 676 - height, 130, height, perfect ? C.teal : '#9bc8c9');
      txt(c, n, xx, 649 - height, 24, C.pale, 'Mono', 600, 'center');
      txt(c, E.pct(i / 4), xx, 715, 26, C.soft, 'Mono', 500, 'center');
    });
    label(c, 'Pass rate', 74, 715);
    const band = b === 2 ? end(k, 2) : b === 3 && cue(k, 3, 'Try to draw');
    if (band)
      txt(
        c,
        'Percentile endpoints    ' + dist.band.map(E.pct).join('   ·   '),
        77,
        807,
        37,
        C.amber,
        'Serif',
      );
    if (perfect && cue(k, 3, "There isn't one"))
      txt(c, 'Regional fixtures in the deck:  0', 1515, 807, 25, C.pale, 'Mono', 500, 'right', 650);
  }
}
const formatDelta = (n) => (n > 0 ? '+' + n : String(n).replace('-', '−'));
export function pairing(c, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    const fixed = Boolean(cue(k, 2, 'Switch to hybrid two'));
    const rows = fixed ? E.repair : E.hybrid,
      align = ease(cue(k, 1, 'Match the fixture IDs', 1.45));
    const y = (i) => 300 + i * 106;
    heading(
      c,
      'PAIRED FIRST ANSWERS',
      align === 1 ? 'Subtract within the same fixture' : 'Which rows face each other?',
    );
    label(c, 'BASELINE', 83, 211);
    label(c, rows[0].run.toUpperCase(), 827, 211);
    label(c, 'CHANGE', 1395, 211);
    for (let i = 0; i < 4; i++) {
      rect(c, 66, y(i) - 36, 1459, 72, C.deep, null, 9);
      key(c, 121, y(i), E.keys[i], 47, C.blue);
      txt(c, E.rowNames[i], 165, y(i), 31);
      txt(c, Number(E.base[i].passed), 564, y(i), 41, C.pale, 'Mono', 600, 'center');
      line(c, 632, y(i), 772, y(i), C.line, 3);
    }
    const pairs = E.paired(rows);
    E.arriving.forEach((incoming, position) => {
      const i = E.base.findIndex((r) => r.id === incoming.id),
        r = rows[i];
      const offset = Math.sin(Math.PI * align) * (position === 1 ? -187 : position === 3 ? 187 : 0);
      const yy = mix(y(position), y(i), align),
        xx = 823 + offset;
      const compact = align > 0 && align < 1;
      rect(c, xx, yy - 32, compact ? 147 : 435, 64, C.body, C.line, 7);
      key(c, xx + 38, yy, E.keys[i], 44, C.blue);
      txt(c, Number(r.passed), xx + (compact ? 107 : 383), yy, 35, C.pale, 'Mono', 500, 'center');
      if (!compact) txt(c, E.rowNames[i], xx + 78, yy, 27, C.soft);
    });
    if (align === 1 && cue(k, 1, 'subtract the baseline')) {
      pairs.forEach((r, i) =>
        txt(
          c,
          formatDelta(r.delta),
          1452,
          y(i),
          41,
          r.delta < 0 ? C.red : r.delta > 0 ? C.teal : C.soft,
          'Mono',
          600,
          'center',
        ),
      );
    }
    const earned = fixed ? cue(k, 2, 'Shuffling the file') : cue(k, 2, 'One gain offsets');
    if (earned)
      txt(
        c,
        'Mean change    ' +
          formatDelta(100 * E.mean(pairs.map((p) => p.delta))) +
          ' percentage points',
        78,
        773,
        42,
        C.amber,
        'Serif',
      );
  } else {
    heading(c, 'PAIRED RESAMPLING   /   HYBRID TWO', 'Use one set of draws for both runs');
    const indices = b === 4 ? E.noRewording : E.drawIds;
    const pairs = E.paired(E.repair, indices);
    label(c, 'SAME DRAW', 75, 297);
    label(c, 'BASELINE', 75, 427);
    label(c, 'HYBRID TWO', 75, 531);
    label(c, 'GAIN', 75, 635);
    pairs.forEach((p, i) => {
      const x = 440 + i * 302;
      rect(c, x - 101, 240, 202, 438, C.body, C.line, 10);
      key(c, x, 299, E.keys[indices[i]], 64, C.blue);
      txt(c, p.before, x, 426, 48, C.pale, 'Mono', 500, 'center');
      txt(c, p.after, x, 533, 48, C.pale, 'Mono', 500, 'center');
      txt(c, formatDelta(p.delta), x, 635, 40, p.delta ? C.teal : C.soft, 'Mono', 600, 'center');
    });
    if (cue(k, 3, 'Across resamples'))
      txt(
        c,
        'This draw    ' + formatDelta(100 * E.mean(pairs.map((p) => p.delta))) + ' points',
        77,
        753,
        40,
        C.teal,
        'Serif',
      );
    if (end(k, 3))
      txt(
        c,
        'Percentile endpoints    ' + E.gainBand.map((v) => v * 100).join(' to ') + ' points',
        77,
        818,
        32,
        C.amber,
        'Serif',
      );
    if (b === 4) label(c, 'No R drawn → zero gain', 953, 752, C.soft);
  }
}

function pairTray(c, x, name, draw, moves, showResult) {
  const { outcomes, size, failures, guaranteed, indices } = draw;
  const origin = x + 82;
  const slots = [x + 225, x + 443];
  rect(c, x, 225, 698, 561, C.deep, C.line, 17);
  txt(c, name, x + 29, 272, 39, C.pale, 'Serif');
  txt(c, `Initially ${failures} ${failures === 1 ? 'failure' : 'failures'}   ·   draw ${size}`, x + 31, 328, 25, C.soft, 'Mono');
  slots.forEach((sx, j) => {
    rect(c, sx - 84, 525, 168, 98, null, C.line, 10, 3);
    txt(c, String(j + 1), sx, 650, 22, C.soft, 'Mono', 500, 'center');
  });
  label(c, 'DRAW', x + 29, 577);
  outcomes.forEach((passed, i) => {
    const sx = origin + 130 * i;
    const slot = indices.indexOf(i);
    const t = slot < 0 ? 0 : ease(moves[slot]);
    const xx = t ? mix(sx, slots[slot], t) : sx;
    const yy = mix(423, 574, t);
    if (t) rect(c, sx - 56, 388, 112, 70, null, C.line, 34);
    rect(c, xx - 56, yy - 35, 112, 70, passed ? C.teal : C.red, null, 34);
    txt(c, `#${i + 1} ${passed ? 'pass' : 'fail'}`, xx, yy, 22, C.ink, 'Mono', 600, 'center');
  });
  if (showResult) {
    txt(c, `Pairs with a pass    ${draw.passed} / ${draw.total}  =  ${E.pct(draw.rate)}`,
      x + 29, 714, 33, C.teal, 'Serif', 500, 'left', 639);
    const rule = guaranteed ? 'k > n − c   →   return 1' : '1 − C(n − c, k) / C(n, k)';
    label(c, rule, x + 31, 761, C.amber, 639);
  }
}

function poolPairs(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'ONE QUESTION   /   FIVE GENERATED ANSWERS', 'Choose two distinct answers');
  E.pool.forEach((passed, i) => {
    const x = 190 + 302 * i;
    dot(c, x, 263, 59, passed ? C.teal : C.red);
    txt(c, i + 1, x, 263, 47, C.ink, 'Mono', 600, 'center');
    txt(c, passed ? 'Pass' : 'Fail', x, 351, 25, C.soft, 'Mono', 500, 'center');
  });
  const intro = cue(k, 0, 'Lay out the ten possible pairs', 1.45);
  const visible = Math.floor(intro * E.pairs.total + 1e-6);
  E.pairs.subsets.forEach((pair, i) => {
    if (i >= visible) return;
    const x = 72 + (i % 5) * 301,
      y = 433 + Math.floor(i / 5) * 104;
    rect(c, x, y, 253, 75, C.deep, C.line, 38);
    pair.indices.forEach((id, j) => {
      const xx = x + 76 + j * 100;
      dot(c, xx, y + 37, 27, E.pool[id] ? C.teal : C.red);
      txt(c, id + 1, xx, y + 37, 23, C.ink, 'Mono', 600, 'center');
    });
  });
  if (cue(k, 1, 'Three pairs'))
    txt(
      c,
      E.pairs.passed + ' / ' + E.pairs.total + ' contain a pass  =  ' + E.pct(E.pairs.rate),
      75,
      732,
      41,
      C.teal,
      'Serif',
    );
  if (b === 2)
    label(
      c,
      '1 − C(n − c, k) / C(n, k)     uniform subsets, integer counts, 0 ≤ c ≤ n and 1 ≤ k ≤ n',
      76,
      801,
      C.amber,
      1460,
    );
}
export function selector(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 2) {
    poolPairs(c, k);
    return;
  }
  if (b >= 7) {
    heading(c, 'UNIFORM DRAWS WITHOUT REPLACEMENT', 'Can two failures fill both slots?');
    label(c, 'Integer counts    n answers    c passes    k drawn    0 ≤ c ≤ n    1 ≤ k ≤ n', 71, 188);
    pairTray(c, 71, 'Private-note pair', E.both, [
      cue(k, 7, 'put the failed answer', 0.85),
      cue(k, 8, 'If the draw size', 0.85),
    ], cue(k, 8, 'Now try the five-answer pool'));
    pairTray(c, 831, 'Five-answer pool', E.pairs, [
      cue(k, 8, 'Draw answers three and four', 0.85),
      cue(k, 8, 'Both fail', 0.85),
    ], cue(k, 8, 'The article uses'));
    return;
  }
  if (!cue(k, 5, 'Now suppose just one')) {
    heading(c, 'PRIVATE-NOTE QUESTION   /   TWO ANSWERS', 'Trace the first answer to the user');
    const sends = ease(cue(k, 3, 'follow the first answer', 1.05));
    label(c, 'SUPPLIED PAIR', 77, 240);
    label(c, 'USER RECEIVES', 1000, 240);
    E.two.forEach((r, i) => {
      const y = 291 + 191 * i;
      slide(c, 74, y, 787, 155);
      txt(c, String(i + 1), 122, y + 74, 43, C.muted, 'Mono');
      txt(c, r.status, 188, y + 47, 28, C.ink, 'Mono');
      txt(c, i ? 'No citations' : r.citations[0], 188, y + 109, 31, C.ink, 'Serif');
      mark(c, 800, y + 77, r.passed, 23, true);
    });
    rect(c, 997, 292, 511, 345, null, C.line, 22);
    if (sends) {
      c.save();
      c.translate(mix(715, 1045, sends), mix(320, 338, sends));
      docIcon(c, 0, 0, 0.96);
      c.restore();
      if (sends === 1) {
        txt(c, E.two[0].citations[0], 1037, 527, 28, C.pale, 'Mono');
        if (end(k, 3) || b > 3) stamp(c, 1037, 552, 'HOLD CANDIDATE', C.red, 426);
      }
    }
    const random = cue(k, 5, 'The first-answer selector');
    if (random)
      txt(
        c,
        'One random choice    ' + E.pct(E.randomOne.rate) + ' pass',
        77,
        771,
        42,
        C.amber,
        'Serif',
      );
    else if (cue(k, 3, 'Now follow'))
      txt(c, 'Pair contains a pass    ' + E.pct(E.both.rate), 77, 771, 42, C.teal, 'Serif');
    if (b === 4)
      label(
        c,
        'Fresh-pair estimate assumes independent samples from the same generator.',
        77,
        832,
        C.soft,
      );
  } else {
    heading(c, 'NUMERICAL PRECISION', 'One passing answer in a pool of 10¹⁷');
    const x0 = 260,
      width = 1125,
      x = (v) => x0 + (width * v) / 1e-16;
    label(c, 'k = 1     c = 1     n = 10¹⁷', 81, 226);
    const vals = [0, 1e-17, 5e-17, 1e-16];
    line(c, x0, 563, x(1e-16), 563, C.soft, 3);
    vals.forEach((v) => {
      line(c, x(v), 549, x(v), 580, C.soft, 2);
      txt(c, v ? v.toExponential(0) : '0', x(v), 622, 23, C.soft, 'Mono', 500, 'center');
    });
    if (cue(k, 6, 'Direct division')) {
      dot(c, x(E.cancelled), 563, 13, C.red);
      txt(c, '1 − rounded failure probability = ' + E.cancelled, 81, 327, 34, C.red, 'Mono');
    }
    if (cue(k, 6, 'Look where')) {
      dot(c, x(E.direct), 563, 13, C.teal);
      line(c, x(E.direct), 546, x(E.direct), 464, C.teal, 2);
      txt(c, 'c / n = ' + E.direct.toExponential(0), 81, 416, 37, C.teal, 'Mono');
    }
  }
}
export function judge(c, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    heading(
      c,
      'CLARITY JUDGE   /   BOTH ANSWERS PASSED THE EVIDENCE CHECKS',
      'Follow the answer as the slots swap',
    );
    const swap = ease(cue(k, 0, 'Swap their places', 1.1));
    const xs = [460, 1138],
      y = 465;
    xs.forEach((x, i) => {
      label(c, 'SLOT ' + (i + 1), x - 46, 249);
      rect(c, x - 207, y - 119, 414, 238, null, C.line, 24);
    });
    ['A', 'B'].forEach((id, i) => {
      const xx = mix(xs[i], xs[1 - i], swap),
        yy = y + Math.sin(Math.PI * swap) * (i ? -123 : 123);
      slide(c, xx - 128, yy - 71, 256, 142, i ? '#cadbed' : '#f3dcad');
      txt(c, 'Answer ' + id, xx, yy, 43, C.ink, 'Serif', 500, 'center');
    });
    const picked =
      swap === 0 ? cue(k, 0, "That's answer A") : swap === 1 && cue(k, 0, 'This time B wins');
    if (picked)
      path(
        c,
        [
          [448, 594],
          [472, 594],
          [460, 573],
        ],
        C.amber,
      );
    if (cue(k, 0, 'Swap their places') || picked)
      txt(c, 'First order  →  ' + E.winners[0], 82, 685, 37, C.pale, 'Mono');
    if (swap === 1 && picked)
      txt(c, 'Swapped order  →  ' + E.winners[1], 755, 685, 37, C.pale, 'Mono');
    if (end(k, 1)) stamp(c, 555, 751, E.preference, C.amber, 490);
  } else if (b === 2) {
    heading(c, 'EVIDENCE CHECKS PRECEDE PREFERENCE', 'A favorable verdict cannot clear a citation');
    slide(c, 72, 228, 752, 456);
    label(c, 'SAVED REPLY', 115, 285, C.muted);
    txt(c, E.note.answer, 115, 391, 44, C.ink, 'Serif');
    docIcon(c, 118, 463, 0.89);
    txt(c, E.note.citations[0], 244, 544, 31, C.ink, 'Mono');
    txt(c, 'Clarity', 931, 304, 43, C.pale, 'Serif');
    txt(c, 'Judge prefers the wording', 931, 371, 31, C.soft);
    if (cue(k, 2, 'The citation still fails')) {
      txt(c, 'Citation check', 931, 507, 43, C.pale, 'Serif');
      mark(c, 952, 578, false, 20);
      txt(c, 'Unexpected document', 994, 579, 32, C.red);
    }
    if (cue(k, 2, 'position and verbosity'))
      txt(
        c,
        'MT-Bench observed position and verbosity effects in the judges tested.',
        77,
        779,
        31,
        C.soft,
        'Serif',
      );
  } else {
    heading(
      c,
      'JUDGE RECORD   /   REPLAY BOTH ORDERS',
      'What must the reviewer be able to reconstruct?',
    );
    E.orders.forEach((order, i) => {
      slide(c, 74 + 744 * i, 246, 702, 310);
      label(c, 'ORDER ' + (i + 1), 122 + 744 * i, 308, C.muted);
      txt(c, order.join('    /    '), 122 + 744 * i, 393, 55, C.ink, 'Mono');
      txt(c, 'First slot   →   ' + E.winners[i], 122 + 744 * i, 482, 33, C.ink, 'Serif');
    });
    txt(
      c,
      'Question   ·   model   ·   prompt   ·   rubric   ·   reason   ·   cited spans',
      78,
      650,
      32,
    );
    if (cue(k, 3, "reviewer's reason"))
      txt(
        c,
        'Check the reviewed label against its source snapshot.',
        78,
        767,
        41,
        C.amber,
        'Serif',
      );
  }
}
