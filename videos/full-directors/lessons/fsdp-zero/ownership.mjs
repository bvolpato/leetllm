import { C, clamp, fmt, sum } from './studio.mjs';
import {
  bytes,
  budget,
  letters,
  perRank,
  ranks,
  objective,
  targets,
  storeWeight,
  columns,
} from './experiments.mjs';

function cardRow(p, selected, sharded) {
  for (let r = 0; r < 16; r++) {
    const x = 100 + r * 108;
    p.pcb(x, 742, 88, 95);
    p.rect(x + 12, 766, 64, 38, C.deep);
    if (sharded) p.rect(x + 12, 766, (64 * 8.75) / 80, 38, C.weight);
    if (r === selected) p.rect(x - 5, 736, 98, 119, null, C.grad, 8);
    p.center(String(r), x + 44, 896, 24, C.sub);
  }
}
export function placement(p) {
  const { beat, at } = p,
    w = budget(70, 16, 3).parts[0],
    total = w * 16,
    scale = 10,
    limit = 80;
  const cut = at(3, 'Cut that weight tensor'),
    dealt = at(3, 'Give one piece');
  const rank = Number(at(2, 'Move to the next card') && !cut);
  const question = beat === 1 && at(1, 'How many gigabytes');
  p.title(
    cut ? 'A slice for each rank' : question ? 'How many GB extend past the first card?' : 'Place one copy on one GPU',
    '70 billion weights   ×   2 bytes per weight',
  );
  const x = 167,
    seat = 429;
  p.pcb(x - 42, seat - 19, limit * scale + 64, 171);
  p.rect(x, seat + 16, limit * scale, 88, C.deep, null, 4);
  const inserting = beat === 1 ? at(1, 'Slide this weight tensor', 2.8) : 1;
  const y = seat - 125 + inserting * 124;
  p.text('80 GB', x + limit * scale, seat + 217, 45, C.bad, 'Mono', 'center');
  p.line(x + limit * scale, seat - 74, x + limit * scale, seat + 158, C.bad, 5);
  if (!dealt) {
    p.ribbon(x, y + 22, scale * total, 76, C.weight, cut ? 16 : 14);
    if (inserting === 1 && !cut)
      p.line(x + limit * scale, y + 17, x + limit * scale, y + 105, C.bad, 6);
    p.text(fmt(total) + ' GB', x + scale * total, y - 13, 44, C.weight, 'Mono', 'right');
    if (at(2, 'Sixty gigabytes') && !cut) {
      p.line(x + limit * scale + 6, y + 137, x + total * scale, y + 137, C.bad, 4);
      p.text(
        fmt(total - limit) + ' GB beyond card ' + rank,
        x + ((limit + total) * scale) / 2,
        y + 190,
        34,
        C.bad,
        'Sans',
        'center',
      );
    }
  } else {
    p.ribbon(x, seat + 22, w * scale, 76, C.weight, 1);
    p.text(fmt(w) + ' GB of weights', x, seat - 50, 48, C.weight, 'Mono');
    p.text('140 GB ÷ 16 owners', 1160, seat + 68, 40, C.sub);
  }
  p.tag('Rank ' + rank + '  /  card memory', x, seat + 137, C.light);
  cardRow(p, rank, dealt);
}

export function inventory(p) {
  const { beat, at } = p,
    colors = [C.weight, C.grad, C.opt, C.opt, C.opt];
  if (beat >= 5) {
    const bigger = at(6, 'subtracting one ten-thousandth');
    const decrement = bigger ? 0.0001 : 0.00000001,
      values = storeWeight(decrement);
    p.title('Does the update survive storage?', 'Both trials start at 1.0   /   round to nearest');
    p.text('1 − ' + (bigger ? '0.0001' : '0.00000001'), 100, 317, 76, C.ink, 'Serif');
    p.tag('Spacing just below 1', 610, 390);
    p.tag('Stored result', 1230, 390);
    ['FP32', 'FP16', 'BF16'].forEach((d, i) => {
      const y = 495 + 140 * i;
      p.text(d, 130, y, 50, C.ink, 'Mono');
      p.line(619, y - 17, 985, y - 17, C.line, 3);
      p.dot(620, y - 17, 7, C.sub);
      p.dot(985, y - 17, 7, C.sub);
      p.text(['2^−24', '2^−11', '2^−8'][i], 800, y - 35, 33, C.sub, 'Mono', 'center');
      const show = i === 0 ? at(5, 'Even FP32') : at(5, 'less than half');
      if (show)
        p.text(
          values[i] === 1 ? '1.0' : values[i].toFixed(8),
          1230,
          y,
          54,
          values[i] === 1 ? C.sub : C.weight,
          'Mono',
        );
    });
    p.text('Each interval shows one gap in its own format.', 110, 916, 34, C.sub);
    return;
  }
  if (beat === 4) {
    const s = budget(70, 16, 3);
    p.title('One rank holds one sixteenth', '1,120 GB of model state   /   16 equal shards');
    p.measure(160, 456, 1550, 80, 17, 'GB');
    let x = 160;
    for (const [i, v] of s.parts.entries()) {
      p.ribbon(x, 480, 17 * v, 89, colors[i], 1);
      x += 17 * v;
    }
    p.text('70 GB state', x, 654, 54, C.ink, 'Mono', 'right');
    p.text('10 GB free', x + 85, 353, 31, C.ok, 'Mono', 'center');
    p.tag('First optimizer step', 160, 790);
    p.text('Include the moment buffers when measuring the peak.', 160, 855, 43);
    return;
  }
  const visible = [
    true,
    at(1, 'Backward produces'),
    at(1, 'four-byte master'),
    at(2, 'moving average of gradients'),
    at(2, 'moving average of squared'),
  ];
  const per = beat === 3 ? 70 : 1,
    unit = beat === 3 ? 'GB' : 'B';
  p.title(
    beat === 3 ? 'Price the whole model' : 'Unpack one AdamW parameter',
    beat === 3
      ? '70 billion parameters   /   decimal GB'
      : 'Mixed precision   /   master-weight recipe',
  );
  let x = 116;
  ['Weight', 'Gradient', 'Master', 'Moment m', 'Moment v'].forEach((name, i) => {
    const width = bytes[i] * 101;
    p.rect(x, 390, width - 8, 198, C.bed, null, 6);
    if (visible[i]) {
      p.block(x, 390, width - 8, 198, colors[i], fmt(bytes[i] * per) + ' ' + unit, i < 2 ? 34 : 44);
      p.text(name, x, 350, 37, C.ink);
    }
    x += width;
  });
  if (at(2, 'Count all five')) {
    p.line(521, 642, x - 8, 642, C.opt, 4);
    p.text('Master + two moments   ' + 12 * per + ' ' + unit, 530, 704, 41, C.opt);
    p.text(beat === 3 ? '1,120 GB total' : '16 bytes per parameter', 116, 878, 70, C.ink, 'Serif');
  }
}

export function weighting(p) {
  const { at, beat } = p,
    f = objective();
  if (beat === 5) {
    const empty = at(5, 'both ranks are empty'),
      counts = [0, empty ? 0 : 3],
      total = sum(counts);
    p.title(
      'Join the count even with zero targets',
      'One accumulated update   /   unmasked targets',
    );
    for (const [r, n] of counts.entries()) {
      const y = 343 + r * 211;
      p.text('Rank ' + r, 113, y + 66, 48, C.ink, 'Serif');
      for (let j = 0; j < 3; j++) {
        const x = 463 + j * 178;
        p.rect(x, y, 152, 99, C.bed, null, 6);
        if (j < n) p.block(x, y, 152, 99, C.weight, 'y = 3', 31);
      }
      p.text(n + ' valid', 1120, y + 63, 47, C.ink, 'Mono');
    }
    p.text('Global count   ' + total, 111, 841, 55, C.ink, 'Serif');
    p.text(
      total
        ? 'Each rank scales its loss sum by 2/3.'
        : 'All ranks skip the optimizer and scheduler.',
      702,
      841,
      37,
      total ? C.sub : C.bad,
    );
    return;
  }
  p.title(
    'How much say does one target get?',
    'Squared loss   /   prediction = 0   /   masked positions excluded',
  );
  targets.forEach((ys, r) => {
    const y = 324 + r * 205;
    p.text('Rank ' + r, 107, y + 71, 48, C.ink, 'Serif');
    for (let j = 0; j < 3; j++) {
      const x = 400 + 152 * j;
      if (j < ys.length) p.block(x, y, 127, 97, C.weight, 'y = ' + ys[j], 29);
      else {
        p.rect(x, y, 127, 97, null, C.line, 4);
        p.center('pad', x + 64, y + 59, 28, C.sub);
      }
    }
    if (at(3, r ? 'mean gradient minus six' : 'mean gradient minus two'))
      p.text('mean g = ' + fmt(f.gradients[r]), 940, y + 66, 42, C.grad, 'Mono');
    if (at(4, 'one half and three halves'))
      p.text('× ' + fmt(f.factors[r]), 1420, y + 66, 48, C.opt, 'Mono');
  });
  if (at(3, 'Averaging those two means')) {
    const weighted = at(4, 'The answer becomes');
    const scaled = at(4, 'one half and three halves');
    p.text(scaled ? 'Scaled rank mean' : 'Equal rank mean', 115, 801, 35, C.sub);
    p.text(
      scaled && !weighted ? '?' : fmt(weighted ? f.corrected : f.uniform),
      510,
      812,
      72,
      weighted ? C.ok : C.grad,
      'Mono',
    );
    if (at(3, 'their mean gradient is minus five')) {
      p.text('Pooled target mean', 880, 801, 35, C.sub);
      p.text(fmt(f.corrected), 1350, 812, 72, C.opt, 'Mono');
    }
  }
  if (beat >= 4)
    p.tag(
      beat === 4
        ? 'Scale = ranks × local valid targets / global valid targets'
        : 'Zero valid locally → contribute a zero sum and join the count',
      115,
      932,
    );
}

const names = ['Weights', 'Gradients', 'Optimizer'];
const colors = [C.weight, C.grad, C.opt];
function rankTile(p, r, stage, focus, chapter) {
  const x = 110 + 435 * r,
    y = 355;
  p.pcb(x, y, 371, 433);
  p.text('Rank ' + r, x + 23, y + 60, 42, C.light, 'Serif');
  const amounts = Object.values(perRank(stage));
  const sharded = [stage >= 3, stage >= 2, stage >= 1];
  for (let i = 0; i < 3; i++) {
    const yy = y + 95 + i * 107;
    if (
      chapter === 4 &&
      p.beat === 1 &&
      !p.at(1, ['two units for weights', 'two for gradients', 'four for optimizer state'][i])
    )
      continue;
    p.text(names[i] + '   ' + fmt(amounts[i]), x + 22, yy, 27, C.light, 'Mono');
    for (const j of ranks) {
      const xx = x + 24 + 81 * j;
      p.rect(xx, yy + 15, 72, 56, C.deep, null, 4);
      if (!sharded[i] || r === j) p.block(xx, yy + 15, 72, 53, colors[i], letters[j], 27);
    }
  }
  if (focus && r === 2) p.rect(x - 5, y - 5, 381, 448, null, C.grad, 16);
  if (chapter !== 4 || p.at(2, 'one rank holds eight'))
    p.center(fmt(sum(amounts)) + ' units', x + 186, y + 508, 42, C.ink);
}
export function ownership(p, chapter) {
  const stage = chapter - 4;
  if (chapter === 4 && p.beat === 3) {
    p.title(
      'Count repeated bytes once per card',
      'Toy inventory   /   2 weight + 2 gradient + 4 optimizer units',
    );
    for (const r of ranks) {
      const x = 118 + r * 431;
      p.pcb(x, 365, 353, 188);
      p.center('Rank ' + r, x + 176, 425, 38, C.light);
      let xx = x + 21;
      for (const [i, v] of Object.values(perRank(0)).entries()) {
        p.rect(xx, 462, 38 * v, 60, colors[i]);
        xx += 38 * v;
      }
    }
    p.text('8 units in one copy', 118, 728, 57, C.ink, 'Serif');
    p.text('24 more units in three replicas', 118, 848, 56, C.grad, 'Serif');
    p.tag('Activations and temporary allocations enter the peak later.', 118, 958);
    return;
  }
  if (chapter === 5 && p.beat === 3) {
    p.title('Find every copy of C', 'ZeRO-1   /   trace a single parameter slice');
    const ys = [399, 601];
    p.text('Weight C', 104, ys[0] + 68, 45, C.ink, 'Serif');
    p.text('Adam state C', 104, ys[1] + 68, 43, C.ink, 'Serif');
    for (const r of ranks) {
      const x = 535 + r * 305;
      p.center('Rank ' + r, x + 133, 313, 36, C.sub);
      p.block(x, ys[0], 266, 105, C.weight, 'C', 43);
      p.rect(x, ys[1], 266, 105, C.bed, null, 4);
      if (r === 2) p.block(x, ys[1], 266, 105, C.opt, 'C', 43);
    }
    p.tag('Rank 2 updates C and shares the updated weight.', 106, 904);
    return;
  }
  const effective =
    stage === 0
      ? 0
      : stage -
        1 +
        Number(
          p.at(
            1,
            ['', 'partitions optimizer state', 'adds gradients', 'partitions the weights'][stage],
          ),
        );
  if (chapter === 6 && p.beat >= 3) {
    gradientDelivery(p);
    return;
  }
  if (chapter === 7 && p.beat >= 2) {
    const assembled = p.at(2, 'all-gather the relevant') && !p.at(2, 'release the gathered');
    const reduced = p.at(3, 'reduced and scattered');
    p.title(
      'A sharded layer still computes with full weights',
      'Rank 2   /   four ranks   /   persistent owner C',
    );
    ['Stored weights', 'Compute weights', reduced ? 'Reduced gradient' : 'Gradient owner'].forEach(
      (name, i) => {
        const y = 327 + 173 * i;
        p.text(name, 110, y + 65, 40);
        for (const j of ranks) {
          const x = 610 + j * 270;
          p.rect(x, y, 230, 105, C.bed, null, 4);
          if (i === 1 ? assembled : j === 2)
            p.block(x, y, 230, 105, i === 2 ? C.grad : C.weight, letters[j], 47);
        }
      },
    );
    p.tag(
      reduced
        ? 'Local optimizer updates weight C with gradient C'
        : assembled
          ? 'All-gather for this unit'
          : 'Unoccupied compute slots can serve another unit',
      110,
      918,
    );
    return;
  }
  const views = [
    'Four copies of each slice',
    'Pass each optimizer slice to its owner',
    'Leave a reduced gradient with its owner',
    'Store each weight slice once',
  ];
  p.title(views[stage], '4 ranks   /   A, B, C and D divide each category evenly');
  p.tag(['DDP', 'ZeRO stage 1', 'ZeRO stage 2', 'ZeRO stage 3'][effective], 112, 292);
  for (const r of ranks) rankTile(p, r, effective, p.beat >= 2, chapter);
  if (stage === 0 && p.at(2, 'Four ranks together hold'))
    p.text('4 ranks × 8 units = 32 units across the group', 110, 971, 34, C.sub);
}
function gradientDelivery(p) {
  const parameter = p.beat === 4,
    scattered = !parameter && p.at(3, 'while reduce-scatter');
  const complete = parameter ? p.at(4, 'for example by all-gather') : !scattered;
  p.title(
    parameter
      ? 'Share the updated slices'
      : scattered
        ? 'Reduce-scatter delivers one sum per rank'
        : 'All-reduce delivers the full vector',
    parameter ? 'After local optimizer updates' : 'Four local gradient vectors   /   column sums',
  );
  const sums = columns(false).values;
  for (const r of ranks) {
    const y = 260 + r * 167;
    p.text('Rank ' + r, 120, y + 68, 43, C.ink, 'Serif');
    for (const j of ranks) {
      const x = 480 + j * 304;
      p.rect(x, y, 252, 100, C.bed, null, 6);
      if (complete || r === j)
        p.block(
          x,
          y,
          252,
          100,
          parameter ? C.weight : C.grad,
          parameter ? letters[j] + '′' : letters[j] + '  ' + sums[j],
          38,
        );
    }
  }
}
function throughPhrase(p, beat, phrase, captionStart = false) {
  if (p.beat !== beat) return Number(p.beat > beat);
  const { start, end } = p.clock.wordCue(phrase);
  return p.clock.reveal(phrase, end - start, { captionStart });
}

function traceColumn(p) {
  const tracked = 2;
  const changing = p.at(1, 'changes from six to nine');
  const changed = throughPhrase(p, 1, 'changes from six to nine') === 1;
  const { rows, values } = columns(changed);
  const oldSum = !changing && throughPhrase(p, 1, 'Last time it summed to eighteen') === 1;
  const sumLine = 'Twenty-one goes to rank two';
  const ownSum = throughPhrase(p, 2, sumLine, sumLine) === 1;
  const otherSums = throughPhrase(p, 2, 'its sum goes to its own rank') === 1;
  const gather = p.at(2, 'All-gather copies', 1.5);
  const adding = p.at(2, 'Add three, four, five and nine');
  const addition = ranks.length * throughPhrase(p, 2, 'Add three, four, five and nine');
  const rowY = (rank) => 308 + rank * 115;
  const inputX = (column) => 294 + column * 150;
  const outputX = (column) => 1145 + column * 158;
  const cellWidth = 118;
  const cellHeight = 79;
  const focusX = inputX(tracked);
  const outputName =
    gather === 1
      ? 'All-gathered sums'
      : gather > 0
        ? 'All-gather in progress'
        : oldSum
          ? 'Previous reduce-scatter'
          : 'Reduce-scatter output';

  p.title('Follow coordinate C', 'Rank 2 owns C');
  p.text('Local gradients', inputX(0), 235, 37, C.ink);
  p.text(outputName, outputX(0), 235, 37, C.ink);
  for (const j of ranks) {
    const color = j === tracked ? C.grad : C.sub;
    p.center(letters[j], inputX(j) + cellWidth / 2, 277, 37, color);
    p.center(letters[j], outputX(j) + cellWidth / 2, 277, 37, color);
    if (gather > 0) {
      const center = outputX(j) + cellWidth / 2;
      p.line(
        center,
        rowY(j - j * gather) + cellHeight / 2,
        center,
        rowY(j + (ranks.length - 1 - j) * gather) + cellHeight / 2,
        color,
        5,
      );
    }
  }
  for (const r of ranks) {
    const y = rowY(r);
    p.text('Rank ' + r, 105, y + 55, 38);
    for (const j of ranks) {
      const color = j === tracked ? C.grad : C.sub;
      const x = outputX(j);
      p.block(inputX(j), y, cellWidth, cellHeight, color, rows[r][j], 41);
      const steps = Math.abs(r - j);
      const copied = steps > 0 && gather >= steps / (j > r ? j : ranks.length - 1 - j);
      const owned = r === j && (j === tracked ? ownSum || oldSum : otherSums);
      if (owned || copied) {
        p.block(x, y, cellWidth, cellHeight, color, values[j], 41);
      } else if (r === tracked && j === tracked) {
        p.rect(x, y, cellWidth, cellHeight, C.paper, C.grad, 6);
        if (changing) p.center('?', x + cellWidth / 2, y + 55, 44, C.grad);
      } else {
        p.rect(x, y, cellWidth, cellHeight, C.bed, null, 6);
      }
    }
  }

  if (!adding && changing) {
    p.rect(focusX - 6, rowY(3) - 6, cellWidth + 12, cellHeight + 14, null, C.grad, 8);
    p.text('Only rank 3 changes its contribution to C', 105, 875, 38, C.sub);
  } else if (adding && gather === 0) {
    const railX = focusX + cellWidth + 16;
    const railY = 770;
    const termY = 821;
    p.text('Add C', 485, 875, 42, C.ink, 'Serif');
    for (const r of ranks) {
      const termX = 810 + r * 148;
      const progress = clamp(addition - r);
      if (progress === 1) {
        if (r > 0) p.center('+', termX - 74, 873, 39, C.sub);
        p.block(termX - 42, termY, 84, 72, C.grad, rows[r][tracked], 40);
      } else if (progress > 0) {
        const x = focusX + cellWidth;
        const y = rowY(r) + cellHeight / 2;
        p.line(x, y, railX, y, C.grad, 4);
        p.line(railX, y, railX, railY, C.grad, 4);
        p.line(railX, railY, termX, railY, C.grad, 4);
        p.line(termX, railY, termX, termY, C.grad, 4);
        const toRail = railX - x;
        const downRail = railY - y;
        const alongRail = termX - railX;
        const toTile = termY - railY;
        const travel = progress * (toRail + downRail + alongRail + toTile);
        p.dot(
          x + Math.min(toRail, travel) +
            Math.min(alongRail, Math.max(0, travel - toRail - downRail)),
          y + Math.min(downRail, Math.max(0, travel - toRail)) +
            Math.min(toTile, Math.max(0, travel - toRail - downRail - alongRail)),
          10,
          C.grad,
        );
      }
    }
  } else if (gather === 1) {
    p.text(
      p.at(3, 'mathematical result of an all-reduce')
        ? 'All-reduce = reduce-scatter + all-gather'
        : 'Each rank now has all four sums',
      105,
      875,
      44,
      C.ink,
      'Serif',
    );
  }
}

export function collectives(p) {
  const { beat, at } = p;
  if (beat < 4) {
    traceColumn(p);
    return;
  }
  const large = beat >= 6,
    double = at(5, 'All-reduce costs two'),
    fsdp = at(7, 'Full sharding gathers');
  p.title(
    large ? 'Count traffic sent by one rank' : 'A ring passes chunks to its neighbor',
    large
      ? 'Large group   /   weights = gradients = 140 GB   /   sent bytes only'
      : 'Tensor of size S   /   equal chunks   /   sent bytes only',
  );
  if (!large) {
    const four = at(4, 'With N ranks');
    const n = four ? 4 : 2;
    for (let i = 0; i < n; i++) {
      let x = 246 + i * 345;
      p.pcb(x, 325, 230, 112);
      p.center('Rank ' + i, x + 115, 395, 36, C.light);
      if (i < n - 1) p.text('→', x + 246, 396, 58, C.opt);
    }
    const end = 361 + (n - 1) * 345;
    p.line(end, 450, end, 488, C.opt);
    p.line(end, 488, 361, 488, C.opt);
    p.line(361, 488, 361, 451, C.opt);
    p.line(361, 451, 352, 466, C.opt);
    p.line(361, 451, 370, 466, C.opt);
    p.text('One phase', 130, 595, 50, C.ink, 'Serif');
    p.text(n - 1 + ' × S/' + n + ' = ' + fmt((n - 1) / n) + ' S', 636, 595, 49, C.opt, 'Mono');
    if (double) {
      p.text('All-reduce', 130, 761, 50, C.ink, 'Serif');
      p.text(
        '2 × ' + fmt((n - 1) / n) + ' S = ' + fmt((2 * (n - 1)) / n) + ' S',
        636,
        761,
        49,
        C.grad,
        'Mono',
      );
    }
    p.tag('Each rank sends N − 1 chunks of size S/N per phase', 130, 916);
    return;
  }
  for (const [i, label] of ['DDP', 'Full shard'].entries()) {
    if (i && !fsdp) continue;
    const y = 366 + i * 232;
    p.text(label, 100, y + 70, 50, C.ink, 'Serif');
    const ops = i ? ['Gather W', 'Gather W', 'Reduce dW'] : ['Reduce dW', 'Gather dW'];
    ops.forEach((op, j) =>
      p.block(474 + j * 315, y, 296, 113, op.includes('dW') ? C.grad : C.weight, op, 32),
    );
    p.text('≈ ' + ops.length * 140 + ' GB', 1460, y + 71, 42, C.ink, 'Mono');
  }
  p.tag(
    fsdp
      ? 'Forward copy released   /   same gradient dtype   /   ratio ≈ 1.5'
      : 'Ring all-reduce = reduce-scatter + all-gather',
    108,
    910,
  );
}
