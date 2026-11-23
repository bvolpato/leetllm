import {
  ownershipLayout,
  checkpointLayout,
  C,
  rankColors,
  rankFills,
  text,
  mono,
  shell,
  foot,
  line,
  arrow,
  dot,
  cells,
  box,
  cue,
  mix,
} from './drawing.mjs';
import {
  partials,
  logical,
  destinations,
  micro,
  microResult,
  shards,
  full,
  allocations,
  restart,
} from './examples.mjs';

export function partial(g, c) {
  const sums = cue(c, 1, 'Concatenation would');
  const replicate = cue(c, 2, 'All-reduce gives', 1.1);
  const scatter = cue(c, 3, 'Start from the same');
  const send = scatter ? cue(c, 3, 'reduce-scatter', 1.2) : replicate;
  const outputs = destinations(!!scatter);
  shell(
    g,
    'DTensor placement',
    replicate || scatter ? 'Who receives each coordinate?' : 'Which vector do these ranks represent?',
    'Two ranks on one mesh axis     ·     Partial(sum)' +
      (sums ? '     ·     global shape (' + logical.length + ',)' : ''),
  );
  const cx = [270, 430],
    ys = [225, 298];
  cx.forEach((x, i) => text(g, 'Coord ' + i, x, 177, 19, C.gray, { align: 'center' }));
  partials.forEach((row, r) => {
    text(g, 'Rank ' + r, 49, ys[r], 22, rankColors[r], { weight: 600 });
    row.forEach((v, i) => {
      box(g, cx[i] - 54, ys[r] - 21, 108, 42, rankFills[r], rankColors[r], 4);
      mono(g, v, cx[i], ys[r], 25, rankColors[r], { align: 'center' });
    });
  });
  line(g, 202, 340, 496, 340, C.ink, 2);
  text(g, 'Sum', 52, 385, 21, C.gray);
  cx.forEach((x, i) =>
    mono(g, sums ? logical[i] : '?', x, 385, 31, sums ? C.teal : C.gray, { align: 'center' }),
  );
  const targetX = 754;
  if (replicate || scatter) {
    text(g, scatter ? 'Reduce-scatter' : 'All-reduce', targetX, 177, 22, C.ink, {
      align: 'center',
      weight: 600,
    });
    outputs.forEach((out, r) => {
      const y = 218 + 111 * r;
      text(g, 'Rank ' + r, targetX, y, 18, rankColors[r], { align: 'center' });
      out.forEach((n, j) => {
        const idx = scatter ? r : j,
          x = targetX + (j - (out.length - 1) / 2) * 81;
        box(g, x - 38, y + 16, 76, 43, C.white, rankColors[r], 4);
        if (send > 0 && send < 1) {
          const t = send * send * (3 - 2 * send);
          dot(
            g,
            mix(cx[idx], x, t),
            mix(393, y + 38, t) - Math.sin(Math.PI * t) * 47,
            6,
            rankColors[r],
          );
        } else if (send >= 1)
          mono(g, n, x, y + 38, 23, rankColors[r], { align: 'center', weight: 600 });
      });
    });
  } else {
    text(g, sums ? 'One logical vector' : 'Logical vector', 730, 241, 26, C.ink, {
      font: 'Serif',
      align: 'center',
    });
    mono(g, sums ? '[' + logical.join(', ') + ']' : '?', 730, 301, 32, C.teal, {
      align: 'center',
    });
  }
  foot(
    g,
    scatter
      ? 'Shard(0)     One reduced coordinate per rank'
      : replicate
        ? 'Replicate     The reduced vector on every rank'
        : 'Partial(sum)     Each local entry contributes to a global coordinate.',
    'The two original contributions stay on the left for comparison.',
  );
}

const fraction = (n) =>
  Number.isInteger(n) ? String(n) : n === 2 / 3 ? '2/3' : n === 4 / 3 ? '4/3' : String(n);
export function pipeline(g, c) {
  const work = cue(c, 0, 'Follow three equal microbatches', 2.2);
  const backward = cue(c, 1, 'During backward');
  const once = cue(c, 2, 'The schedule divides');
  const manual = cue(c, 2, 'Now divide each loss');
  const twice = cue(c, 3, 'For equal sizes');
  const res = microResult(!!manual);
  shell(
    g,
    'Pipeline parallelism',
    backward ? 'Who divides the gradient?' : 'When can stage two start?',
    backward
      ? 'Three equal microbatches     ·     mean loss per microbatch     ·     scale_grads = True'
      : 'Two stages     ·     each tile is one forward computation',
  );
  if (!backward) {
    [0, 1, 2, 3].forEach((n) =>
      text(g, 'Time ' + (n + 1), 280 + n * 156, 184, 18, C.gray, { align: 'center' }),
    );
    for (let stage = 0; stage < 2; stage++) {
      const y = 232 + stage * 90;
      text(g, 'Stage ' + (stage + 1), 55, y + 25, 22, C.ink, { weight: 600 });
      for (let t = 0; t < 4; t++) {
        const x = 205 + t * 156,
          mb = t - stage;
        const valid = mb >= 0 && mb < 3 && t <= Math.floor(work * 3);
        box(g, x, y, 146, 52, valid ? rankFills[mb] : C.white, valid ? rankColors[mb] : C.rule, 3);
        if (valid)
          text(g, 'Batch ' + (mb + 1), x + 73, y + 26, 20, rankColors[mb], { align: 'center' });
        else if ((mb < 0 || mb >= 3) && work === 1)
          text(g, 'idle', x + 73, y + 26, 18, C.gray, { align: 'center' });
      }
    }
    foot(
      g,
      'Each activation must arrive before the next stage uses it.',
      'The empty slots at the ends are pipeline fill and drain.',
    );
  } else {
    const xs = [242, 466, 690];
    xs.forEach((x, i) => {
      text(g, 'Batch ' + (i + 1), x, 183, 20, rankColors[i], { align: 'center', weight: 600 });
      box(g, x - 77, 211, 154, 68, rankFills[i], rankColors[i], 4);
      mono(g, manual ? micro[i] + ' ÷ 3' : micro[i], x, 245, 29, rankColors[i], {
        align: 'center',
      });
      line(g, x, 282, x, 309, C.rule, 2);
    });
    line(g, xs[0], 309, xs[2], 309, C.rule, 2);
    arrow(g, 466, 309, 466, 332, C.gray);
    mono(g, 'Accumulated   ' + res.sum, 466, 354, 23, C.ink, { align: 'center' });
    const show = manual ? twice : once;
    mono(
      g,
      show
        ? 'Schedule   ' + res.sum + ' ÷ 3 = ' + fraction(res.mean)
        : 'Schedule   ' + res.sum + ' ÷ 3 = ?',
      466,
      412,
      26,
      show ? C.teal : C.gray,
      { align: 'center' },
    );
    foot(
      g,
      manual
        ? 'Replay with manual loss division'
        : 'Accumulate gradients from equal-sized mean losses.',
      manual
        ? 'The schedule still divides by three. Only the manual division changed.'
        : 'The schedule owns one division by the microbatch count.',
    );
  }
}

export function residency(g, c) {
  const gather = cue(c, 1, 'All-gather supplies', 1.5);
  const release = cue(c, 2, 'release the full', 0.8);
  const tp = cue(c, 3, 'Compare colwise');
  const features = cue(c, 3, 'Each rank computes', 1.2);
  shell(
    g,
    'Parameter ownership',
    tp ? 'Which output features does this rank compute?' : 'Which rows must rank zero gather?',
    tp
      ? 'Colwise tensor parallelism     ·     Linear weight [8 out, 1 in]     ·     input = 2, bias = 0'
      : 'FSDP2 data-parallel group     ·     Linear weight [8 out, 1 in]     ·     reshard_after_forward = True',
    ownershipLayout,
  );
  const centers = [147, 369, 591, 813];
  shards.forEach((s, r) => {
    const x = centers[r];
    text(g, 'Rank ' + r, x, 176, 21, rankColors[r], { align: 'center', weight: 700 });
    text(g, 'Rows ' + 2 * r + '–' + (2 * r + 1), x, 209, 16, C.gray, { align: 'center' });
    cells(g, s, x - 64, 231, 65, 49, { fill: rankFills[r], stroke: rankColors[r], size: 22 });
  });
  if (tp) {
    shards.forEach((s, r) => {
      const x = centers[r];
      arrow(g, x, 287, x, 335, rankColors[r], 2);
      if (features > 0) {
        g.save();
        g.globalAlpha = features;
        cells(
          g,
          s.map((w) => w * 2),
          x - 64,
          344,
          65,
          49,
          { fill: rankFills[r], stroke: rankColors[r] },
        );
        g.restore();
      }
    });
    text(g, 'Feature slices of one output', 480, 426, 20, C.ink, { align: 'center' });
    foot(
      g,
      'Each rank multiplies only its own output rows.',
      'The same row split serves a different computation under data parallelism.',
    );
  } else {
    const count = release === 1 ? 0 : Math.floor(full.length * gather);
    const start = 295,
      cell = 70;
    text(g, 'Rank 0 compute copy', 46, 353, 20, C.ink, { weight: 600, width: 232 });
    full.forEach((v, i) => {
      const owner = Math.floor(i / 2),
        x = start + i * cell;
      box(g, x, 327, cell - 3, 51, C.paper, C.rule, 3);
      if (i < count) {
        g.save();
        g.globalAlpha = 1 - release;
        box(g, x, 327, cell - 3, 51, rankFills[owner], rankColors[owner], 3);
        mono(g, v, x + cell / 2, 353, 23, rankColors[owner], { align: 'center' });
        g.restore();
      }
    });
    if (gather > 0 && gather < 1) {
      const i = Math.min(7, Math.floor(gather * 8));
      const t = (gather * 8) % 1;
      const x = mix(centers[Math.floor(i / 2)] + ((i % 2) - 0.5) * 65, start + (i + 0.5) * cell, t);
      dot(g, x, mix(284, 320, t), 5, rankColors[Math.floor(i / 2)]);
    }
    const status =
      release === 1
        ? 'released'
        : release > 0
          ? 'releasing the full allocation'
          : count === 8
            ? 'ready for the module'
            : gather > 0
              ? 'gathering'
              : 'at rest';
    text(g, count + ' of 8 rows present   ·   ' + status, 580, 412, 20, C.teal, {
      align: 'center',
    });
    foot(
      g,
      'Rank zero owns ' + shards[0].length + ' rows at rest.',
      'Call module(input) through the managed module entry point so its hooks execute.',
    );
  }
}

export function peak(g, c) {
  const fetched = cue(c, 1, 'Add the next block');
  const late = cue(c, 2, 'Delay only the prefetch');
  const answer = late ? cue(c, 2, 'The later prefetch') : fetched ? cue(c, 1, 'Each color') : 0;
  const a = allocations(!!fetched && !late);
  shell(
    g,
    'FSDP2 live memory',
    'Does the next prefetch fit?',
    'One rank     ·     four-way sharding     ·     supplied snapshot counts equal-size elements',
  );
  const x0 = 72,
    u = 20.1,
    y = 238;
  const bound = x0 + u * 36;
  text(g, 'Allowance 36', bound, 184, 22, C.red, { align: 'right', weight: 700 });
  let cursor = 0;
  a.rows.forEach((n, r) => {
    for (let j = 0; j < n; j++) {
      box(g, x0 + cursor * u, y, u - 2, 57, rankFills[r], rankColors[r], 1);
      cursor++;
    }
  });
  line(g, bound, 201, bound, 307, C.red, 3, [5, 3]);
  [0, 8, 16, 24, 32, 36, 40].forEach((n) => {
    line(g, x0 + n * u, 300, x0 + n * u, 308, C.gray);
    mono(g, n, x0 + n * u, 324, 15, C.gray, { align: 'center' });
  });
  ['Local shard', 'Full compute', 'Activations', 'Prefetch'].forEach((s, r) => {
    const x = 64 + (r % 2) * 436,
      y = 366 + Math.floor(r / 2) * 42;
    box(g, x, y - 10, 19, 19, rankFills[r], rankColors[r], 3);
    text(g, s, x + 32, y, 20, C.ink);
    mono(g, a.rows[r], x + 310, y, 23, rankColors[r], { weight: 700 });
  });
  foot(
    g,
    answer
      ? a.total +
          ' live   ·   ' +
          Math.abs(a.room) +
          (a.room < 0 ? ' over the allowance' : ' slots free')
      : fetched
        ? 'Compare the occupied cells to the limit.'
        : 'An eight-element prefetch is waiting.',
    'Only the four displayed allocations enter this subtotal.',
  );
}

export function restore(g, c) {
  const constructed = cue(c, 1, 'builds the model and optimizer');
  const dest = cue(c, 1, 'fills the destination state', 1.4);
  const durable = cue(c, 1, 'Each new rank');
  const replay = cue(c, 2, 'replay the seven unsaved steps', 1.3);
  shell(
    g,
    'Distributed checkpoint',
    'Where does the new worker group resume?',
    'Supported contiguous resharding     ·     one logical tensor, twelve elements',
    checkpointLayout,
  );
  const sx = 263,
    unit = 50;
  text(g, 'Saved layout', 47, 181, 21, C.ink, { weight: 600 });
  text(g, '3 ranks', 47, 213, 18, C.gray);
  restart.old.forEach((row, r) => {
    cells(g, row, sx + r * 4 * unit, 177, unit, 47, {
      fill: rankFills[r],
      stroke: rankColors[r],
      size: 18,
    });
    text(g, 'old rank ' + r, sx + (r * 4 + 2) * unit, 156, 15, rankColors[r], { align: 'center' });
  });
  text(g, 'Target layout', 47, 293, 21, C.ink, { weight: 600 });
  text(g, '2 ranks', 47, 324, 18, C.gray);
  restart.dest.forEach((row, r) => {
    const x = sx + r * 6 * unit;
    const n = Math.round(dest * 12);
    if (constructed)
      cells(g, row, x, 286, unit, 47, {
        fill: rankFills[r],
        stroke: rankColors[r],
        show: Math.max(0, n - r * 6),
        size: 18,
      });
    else mono(g, '?', x + 3 * unit, 310, 25, C.gray, { align: 'center' });
    text(g, 'new rank ' + r, x + 3 * unit, 263, 16, rankColors[r], { align: 'center' });
  });
  const x0 = 296,
    x1 = 833,
    y = 402;
  line(g, x0, y, x1, y, C.rule, 3);
  text(g, 'Progress', 47, y, 20, C.ink, { weight: 600 });
  for (let i = 0; i <= 7; i++) {
    const x = mix(x0, x1, i / 7),
      on = i === 0 || replay * 7 >= i;
    dot(g, x, y, on ? 7 : 4, on ? C.teal : C.gray);
    mono(g, 80 + i, x, y + 25, 15, on ? C.teal : C.gray, { align: 'center' });
  }
  text(g, 'checkpoint', x0, y - 23, 16, C.teal, { align: 'center' });
  text(g, 'failure after step', x1, y - 23, 16, C.red, { align: 'center' });
  foot(
    g,
    durable
      ? 'Reload saved step ' + restart.saved + ' into the new placement.'
      : 'Choose the target shard size and the last durable step.',
    replay > 0
      ? 'Recover the data cursor and replay unsaved work.'
      : 'Rank numbers can change when workers relaunch.',
  );
}
