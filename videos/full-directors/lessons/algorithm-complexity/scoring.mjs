import { C, count, cue, cueAfter, fmt, letter, names } from './press.mjs';
import {
  DOCS,
  QUERY,
  SCORES,
  SCORE_TRACE,
  HEAP_TRACE,
  boundedHeapTrace,
  PAIRS,
  DEDUP,
} from '../../../films/algorithm-complexity/fixtures.mjs';

const fixed = (n) => Number(n.toFixed(3)).toString();
export const serviceMatrix = { n: 50000, d: 768 };
export const serviceProducts = serviceMatrix.n * serviceMatrix.d;
export const heapBase = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
const extra = [0.8, 0.25];
export const trials = boundedHeapTrace(
  [...heapBase, ...extra].map((score, i) => ({ id: String(i), score })),
  heapBase.length,
).slice(-2);
export function repairState(trial, entered, swaps) {
  const heap = [...trial.before];
  if (entered) {
    heap[0] = trial.candidate;
    for (const [a, b] of trial.swaps.slice(0, swaps)) [heap[a], heap[b]] = [heap[b], heap[a]];
  }
  return heap;
}
export const squared = (i, j) => DOCS[i].vector.map((x, k) => (x - DOCS[j].vector[k]) ** 2);
export const cutoff = 0.25;
const sum = (a) => a.reduce((n, v) => n + v, 0);
const lastScore = HEAP_TRACE.at(-1);
const scoreLabel = (doc) =>
  letter(DOCS.findIndex((d) => d.id === doc.id)) + ' / ' + fixed(doc.score);

export function scoreWorkspace(t) {
  return {
    winners: lastScore.heap,
    scratch: cue(t, 9, 'Discard D', 0) ? null : lastScore.candidate,
    products: SCORE_TRACE.length,
  };
}

function fourScores(p, t) {
  const replay = t.beat.beatIndex === 7;
  const { winners, scratch, products } = scoreWorkspace(t);
  p.title(replay ? 'What did selection change?' : 'Which values survive the last row?');
  p.label('Resident vectors', 65, 184);
  if (replay) p.label('Score trace', 492, 184);
  DOCS.forEach((doc, i) => {
    const y = 222 + i * 72;
    p.mono(letter(i), 67, y + 26, 30, p.fg);
    doc.vector.forEach((v, j) => p.tag(fixed(v), 126 + j * 103, y, 88, 55, C.pale));
    if (replay) {
      p.arrow(443, y + 27, 478, y + 27, p.mid);
      p.mono(fixed(SCORES[i].score), 493, y + 27, 29, p.fg);
    }
  });
  p.mono('Query', 111, 560, 19, p.mid, { align: 'right' });
  QUERY.forEach((v, j) => p.tag(v, 126 + j * 103, 534, 88, 53, C.light));
  p.mono(DOCS.length + ' × ' + QUERY.length + ' = ' + products + ' products', 67, 610, 31, p.good);

  p.label('Retained winners   /   ID and score', 714, 184);
  winners.forEach((doc, i) =>
    p.tag(scoreLabel(doc), 714 + i * 268, 222, 244, 80, C.mint, C.ink, 42),
  );
  p.mono('heap root · cutoff', 715, 337, 22, p.mid);
  p.label('Reusable scratch   /   current row and sum', 714, 419);
  p.tag(
    scratch ? scoreLabel(scratch) : 'Free',
    714,
    456,
    244,
    80,
    scratch ? C.orange : p.bg,
    scratch ? C.ink : p.mid,
    40,
  );
  if (!scratch) p.text('Ready for the next row', 987, 496, 27, p.fg);
  p.foot(
    replay ? 'Which score can we release?' : 'Query + winning pairs + a running sum and indices.',
    replay ? '' : 'extra O(d + k)',
    { raised: true },
  );
}

function serviceScan(p, t) {
  const widthKnown = cue(t, 10, 'seven hundred sixty-eight coordinates', 0);
  const totalKnown = cue(t, 10, 'thirty-eight point four million', 0, {
    captionStart: 'That gives thirty-eight point four million',
  });
  const matrixKnown = cue(t, 10, 'The resident matrix holds', 0);
  p.title('How much work does the larger matrix require?');
  p.label('Resident vector matrix  /  enlarged corner', 65, 192);
  for (let i = 0; i < 15; i++) {
    if (widthKnown) {
      for (let j = 0; j < 28; j++)
        p.rect(65 + j * 21, 232 + i * 22, 17, 18, j === 0 || i === 0 ? C.pale : C.blue);
    } else p.rect(65, 232 + i * 22, 584, 18, C.blue);
  }
  p.mono(fmt(serviceMatrix.n) + ' rows', 65, 615, 28, p.fg);
  if (widthKnown) p.mono('× ' + serviceMatrix.d + ' coordinates', 292, 615, 28, p.fg);
  p.label('Coordinate multiplications', 785, 215);
  p.value(totalKnown ? fmt(serviceProducts) : '?', 'one exact score pass', 783, 308);
  if (matrixKnown) {
    p.label('Stored matrix values', 785, 458);
    p.mono(fmt(serviceProducts), 785, 525, 46, p.fg);
  }
  p.foot('Each row contributes one product per coordinate.', 'resident Θ(nd)', { raised: true });
}

function productGrid(p, t) {
  const done =
    count(1, cue(t, 1, 'Pair the two ones', 0.6)) +
    count(2, cue(t, 2, 'remaining coordinates', 1.3, {
      captionStart: 'Pair the remaining coordinates',
    })) +
    count(9, cue(t, 2, 'remaining notes', 2.7));
  const recap = cue(t, 2, 'Even the runner-clock note', 0);
  const runner = DOCS.findIndex((doc) => doc.id === 'ci-clock');
  p.title('What does multiplying by zero cost?');
  p.label('Authorized note', 65, 202);
  p.label('Query coordinates', 455, 178);
  QUERY.forEach((v, j) => p.mono(v, 507 + j * 143, 218, 28, p.hot, { align: 'center' }));
  DOCS.forEach((d, r) => {
    const y = 251 + r * 94;
    p.card(r, 64, y, 328, 74);
    d.vector.forEach((v, j) => {
      const processed = r * 3 + j < done;
      p.tag(fixed(v), 447 + j * 143, y, 121, 74, processed ? C.mint : C.light, C.ink, 31);
    });
    if (recap && r === runner) p.rect(58, y - 6, 802, 86, null, p.hot, 4);
  });
  const event = SCORE_TRACE[done - 1],
    finished = done === SCORE_TRACE.length;
  p.label('Coordinate products made', 948, 229);
  p.value(done, '', 948, 323);
  if (recap) {
    const products = SCORE_TRACE.filter((step) => step.row === runner);
    const terms = products.map((step) => fixed(step.product)).join(' + ');
    p.label('Card ' + letter(runner) + '  /  ' + names[runner], 948, 448);
    p.mono(terms + ' = ' + fixed(products.at(-1).sum), 948, 501, 34, p.hot);
    p.mono(products.length + ' products for this row', 948, 565, 26, p.fg);
  } else if (event) {
    p.label('Card ' + letter(event.row) + '  /  coordinate ' + (event.column + 1), 948, 448);
    p.mono(
      fixed(QUERY[event.column]) +
        ' × ' +
        fixed(DOCS[event.row].vector[event.column]) +
        ' = ' +
        fixed(event.product),
      948,
      501,
      34,
      p.hot,
    );
    p.mono('running sum   ' + fixed(event.sum), 948, 565, 26, p.fg);
  }
  p.foot(
    finished ? '12 products bought 4 scores.' : 'Each green cell is one completed multiplication.',
  );
}
export function vectors(p, t) {
  if (t.beat.beatIndex < 2) return productGrid(p, t);
  const n = 4 + count(4, cue(t, 3, 'Double the row count', 1.5));
  const d = 3 + count(3, cue(t, 3, 'Now double the width', 1.3));
  p.title('Let each input grow in its own direction');
  p.label('Coordinates per note   →', 137, 182);
  for (let r = 0; r < n; r++) {
    p.mono(letter(r), 81, 240 + r * 52, 25, p.mid);
    for (let j = 0; j < d; j++)
      p.rect(
        139 + j * 93,
        219 + r * 52,
        84,
        44,
        r < 4 && j < 3 ? C.mint : j < 3 ? C.pale : C.orange,
      );
  }
  p.label('Dense score products', 859, 232);
  p.value(n * d, 'coordinate multiplications', 856, 340);
  p.mono(n + ' rows  ×  ' + d + ' coordinates', 858, 478, 29, p.fg);
  p.foot('One product for every row and coordinate.', 'Θ(n × d)');
}
function heapTree(p, heap, positions, focus, locations = positions) {
  positions.forEach(([x, y], i) => {
    if (i === 0) return;
    const [px, py] = positions[Math.floor((i - 1) / 2)];
    p.line(px, py, x, y, p.grid, 6);
  });
  locations.forEach(([x, y], i) => {
    const item = heap[i];
    p.disc(x, y, 45, item ? (item.id === focus ? C.orange : C.mint) : p.bg, p.grid, 3);
    if (item) p.mono(fixed(item.score), x, y, 31, C.ink, { align: 'center' });
  });
}
export function scoreStreamState(t) {
  const capacity = 2;
  const filled = count(capacity, cue(t, 1, 'Let the first two arrive', 1.55));
  const scored =
    filled +
    count(1, cue(t, 2, 'Score the issuer note', 0.6)) +
    count(1, cue(t, 3, 'Score the release checklist', 0.65));
  const judged = Math.min(
    scored,
    filled +
      count(1, cue(t, 3, 'replaces the runner-clock note', 0.5)) +
      count(1, cue(t, 3, 'unchanged', 0.35)),
  );
  const slots = HEAP_TRACE[judged - 1]?.heap ?? [];
  return {
    scored,
    slots,
    full: slots.length === capacity,
    pending: scored > judged ? SCORES[judged] : null,
    products: scored * QUERY.length,
  };
}

export function heap(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b <= 3) {
    const { scored, slots, full, pending, products } = scoreStreamState(t);
    p.title(full ? 'Which score sets the cutoff?' : 'Fill the two citation slots');
    p.label('Score stream', 65, 179);
    SCORES.forEach((d, i) => {
      const y = 221 + i * 103;
      p.card(i, 65, y, 505, 84, i < scored ? QUERY.length + ' products paid' : '');
      if (i < scored) p.mono(fixed(d.score), 525, y + 44, 38, C.green, { align: 'right' });
    });
    p.label('Two-slot min-heap', 848, 182);
    const points = [
      [1023, 304],
      [1023, 548],
    ];
    heapTree(p, slots, points);
    points.forEach(([, y], i) => {
      const entry = slots[i];
      const name = entry ? names[DOCS.findIndex((d) => d.id === entry.id)] : 'Open slot';
      p.text(name, 1100, y, 28, entry ? p.fg : p.mid);
    });
    if (full) p.mono('cutoff', 885, 304, 22, p.mid, { align: 'right' });
    let note = full ? 'The weaker winner sits at the root.' : 'Keep each scored note in an open slot.';
    if (b === 2) note = 'Score C before comparing it with the root.';
    if (b === 3) note = 'A later score must beat the weakest retained winner.';
    if (pending === SCORES[2]) note = 'Which winner gives up its slot for C?';
    p.foot(note, products + ' products', { raised: true });
    return;
  }
  if (b <= 7) {
    const trial = trials[b >= 5 ? 1 : 0];
    const entered =
      b === 4
        ? cue(t, 4, 'takes the root', 0.45) === 1
        : cue(t, 5, 'put it at the root', 0.55) === 1;
    const travel =
      b === 4
        ? cue(t, 4, 'swap those two', 1.1) + cue(t, 4, 'Swap with the weaker child there too', 1.1)
        : 0;
    const swaps = Math.floor(travel);
    const h = repairState(trial, entered, swaps);
    const stays = cueAfter(t, 6, 'It can stay');
    const showChild = cueAfter(t, 6, 'Even its weaker child, point three, scores higher');
    p.title(b === 4 ? 'A replacement follows one branch' : 'Compare the new root with its children');
    const pts = [
      [685, 245],
      [411, 385],
      [960, 385],
      [226, 568],
      [568, 568],
      [844, 568],
      [1144, 568],
    ];
    const locations = pts.map((pt) => [...pt]);
    if (travel > swaps) {
      const [from, to] = trial.swaps[swaps],
        f = travel - swaps;
      for (const [a, z] of [
        [from, to],
        [to, from],
      ]) {
        const [x, y] = pts[a],
          [xx, yy] = pts[z];
        const length = Math.hypot(xx - x, yy - y),
          bow = 58 * Math.sin(f * Math.PI);
        locations[a] = [
          x + (xx - x) * f - ((yy - y) * bow) / length,
          y + (yy - y) * f + ((xx - x) * bow) / length,
        ];
      }
    }
    heapTree(p, h, pts, trial.candidate.id, locations);
    if (showChild) {
      const weakerChild = h[1].score <= h[2].score ? 1 : 2;
      p.disc(...pts[weakerChild], 52, null, p.good, 3);
    }
    p.label('Replacement', 65, 202);
    p.mono(fixed(trial.candidate.score), 67, 264, 50, p.hot);
    if (b === 4 || stays) {
      p.label('Swaps made', 1108, 202);
      p.mono(swaps, 1106, 264, 50, p.fg);
    }
    let note = 'Compare with the weaker child at each level.';
    if (b >= 5) {
      note = entered
        ? 'Does this new root have to move?'
        : 'Compare the incoming score with the root.';
      if (stays) note = 'The new root can stay.';
      if (showChild) note = 'Even the weaker child scores higher than the new root.';
      if (b === 7) note = 'For 2 ≤ k ≤ n, selection costs O(n log k). For k = 1, keep the maximum.';
    }
    p.foot(note, '', { raised: true });
    return;
  }
  if (cue(t, 10, 'fifty thousand notes', 0)) return serviceScan(p, t);
  fourScores(p, t);
}

export const replayPairs = PAIRS.filter(({ left, right }) => left === 0 && right < DOCS.length);

function pairLedger(p, made, selected, active) {
  const latest = PAIRS[Math.max(0, made - 1)];
  const rows = Math.max(3, latest.right);
  p.label('Earlier partner', 149, 177);
  for (let j = 0; j < rows; j++)
    p.mono(letter(j), 172 + j * 78, 221, 25, p.mid, { align: 'center' });
  for (let r = 1; r <= rows; r++) {
    const y = 255 + (r - 1) * 56;
    p.mono(letter(r), 73, y + 22, 28, p.fg);
    for (let j = 0; j < r; j++) {
      const index = (r * (r - 1)) / 2 + j;
      const pair = PAIRS[index];
      const x = 142 + j * 78;
      let fill = p.bg;
      if (index < made) {
        if (selected) fill = selected.includes(pair) ? C.pale : C.light;
        else fill = r === latest.right ? C.orange : C.mint;
      }
      const focus = pair === active;
      p.rect(x, y, 61, 45, focus ? C.orange : fill, focus ? p.hot : p.grid, focus ? 4 : 2);
      if (index < made) {
        p.disc(x + 19, y + 23, 14, C.pale, C.ink, 1);
        p.disc(x + 42, y + 23, 14, C.orange, C.ink, 1);
        p.mono(letter(pair.left), x + 19, y + 23, 17, C.ink, { align: 'center' });
        p.mono(letter(pair.right), x + 42, y + 23, 17, C.ink, { align: 'center' });
      }
    }
  }
}

export function pairs(p, t) {
  const b = t.beat.beatIndex + 1;
  if (b <= 3) {
    const made =
      count(6, cue(t, 1, 'Count each pair once', 1.5)) +
      count(4, cue(t, 2, 'E meets', 1.5)) +
      count(18, cue(t, 3, 'Keep extending', 2.6));
    const latest = PAIRS[Math.max(0, made - 1)];
    p.title('Give each new card its earlier partners');
    pairLedger(p, made);
    p.label('Pairs checked', 865, 236);
    p.value(made, 'unique unordered pairs', 862, 332);
    const reverse = made === 0 ? cue(t, 1, 'Comparing B with A', 1.25) : 0;
    const pair = [latest.left, latest.right];
    pair.forEach((id, k) => {
      const sign = k === 0 ? -1 : 1;
      const x = 1073 + sign * 90 * (1 - 2 * reverse),
        y = 523 + sign * 62 * Math.sin(reverse * Math.PI);
      p.disc(x, y, 55, k ? C.orange : C.pale, C.ink, 3);
      p.mono(letter(id), x, y, 43, C.ink, { align: 'center' });
    });
    if (b === 1 && made === 6) p.mono('Next arrival   E', 66, 603, 25, p.hot);
    let caption = 'A pair can trade places and still be the same pair.';
    if (b === 1 && made === 6) caption = 'E arrives next. How many new partners can it meet?';
    if (b === 2) caption = 'Only the new row needs checking.';
    if (b === 3) {
      caption = 'Each new row has one more earlier partner.';
      if (cue(t, 3, 'For n notes', 0)) caption = 'n(n − 1) / 2 unordered pairs';
      if (cue(t, 3, 'At a thousand notes', 0))
        caption = 'n(n − 1) / 2   ·   1,000 notes give 499,500 pairs.';
    }
    p.foot(caption, '', { raised: true });
    return;
  }
  if (b <= 6) {
    const named = ['A with B', 'A with C', 'A with D'].filter((phrase) =>
      cue(t, 4, phrase, 0),
    ).length;
    const measuring = cue(t, 4, 'Start with B', 0);
    const second = cue(t, 5, 'Move to C', 0.65),
      third = cue(t, 5, 'Now check D', 0.65);
    const active = replayPairs[third > 0 ? 2 : second > 0 ? 1 : 0];
    const partner = active.right;
    const done =
      b === 4
        ? count(3, cue(t, 4, 'add the squared coordinate differences', 1.75))
        : b >= 6
          ? 3
          : partner === 1
            ? 3
            : count(3, partner === 2 ? second : third);
    const diffs = squared(active.left, partner),
      total = sum(diffs.slice(0, done));
    p.title('Follow A’s column through the four-note ledger');
    pairLedger(p, 6, replayPairs.slice(0, named), measuring ? active : null);
    if (cue(t, 4, "Look down A's column", 0)) p.arrow(128, 238, 128, 409, p.good, 3);
    if (!measuring) {
      p.label('Pairs with A', 578, 177);
      replayPairs
        .slice(0, named)
        .forEach(({ left, right }, i) =>
          p.tag(letter(left) + ' + ' + letter(right), 578, 242 + i * 82, 258, 63, C.pale),
        );
      p.foot('Keep A fixed and read its partners from top to bottom.');
      return;
    }
    [active.left, partner].forEach((r, i) => {
      const y = 218 + i * 133;
      p.label(i ? 'Partner' : 'Fixed note', 465, y - 35);
      p.card(r, 464, y, 323, 74);
      DOCS[r].vector.forEach((v, j) =>
        p.tag(fixed(v), 821 + j * 141, y, 121, 74, j < done ? C.mint : C.light, C.ink, 30),
      );
    });
    p.label('Sum of squared differences', 464, 493);
    p.value(total.toFixed(2), done + ' / 3 coordinates', 463, 566);
    p.mono('Emit flag if sum ≤ ' + cutoff, 895, 493, 23, p.mid);
    const emitted = replayPairs.find(
      ({ left, right }) =>
        (right < partner || (right === partner && done === diffs.length)) &&
        sum(squared(left, right)) <= cutoff,
    );
    if (emitted)
      p.tag(
        'Emitted    ' + letter(emitted.left) + ' + ' + letter(emitted.right),
        895,
        537,
        361,
        70,
        C.mint,
        C.ink,
        28,
      );
    p.foot('The output stream can keep a flag while the next pair reuses the scratch space.');
    return;
  }
  const seen = count(DEDUP.length, cue(t, 7, 'Process each arrival once', 3));
  p.title('Exact repeats can use a set');
  p.label('Arriving string', 66, 180);
  p.label('Seen exact keys', 812, 180);
  DEDUP.forEach((d, i) => {
    const y = 222 + i * 83;
    p.strip(66, y, 644, 67, i < seen ? (d.duplicate ? C.orange : C.mint) : C.light);
    p.mono(d.value, 91, y + 38, 23, C.ink);
    if (i < seen && d.duplicate) p.mono('repeat', 692, y + 38, 19, C.red, { align: 'right' });
  });
  (DEDUP[seen - 1]?.unique ?? []).forEach((s, i) =>
    p.tag(s, 808, 223 + i * 112, 550, 83, C.mint, C.ink, 27),
  );
  p.foot(
    b === 8
      ? 'Different wording can carry the same meaning and still be a different key.'
      : 'Under normal hashing, one expected linear pass plus the cost of reading keys.',
  );
}
