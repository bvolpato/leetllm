import {
  P,
  text,
  heading,
  box,
  line,
  tag,
  reading,
  cue,
  columnHead,
  strip,
  num,
  pct,
  terminal,
  ledger,
  dot,
} from './press.mjs';
import {
  dogPaths,
  leaders,
  STATUS_ROW,
  STATUS_IDS,
  statusContinuations,
  products,
  beamStep,
  childRows,
  pathProb,
  complete,
  eos,
  smallLogs,
  lengths,
  lengthScore,
} from './model.mjs';

export function composingCase(
  c,
  paths,
  {
    width = 2,
    picked = false,
    firstPlace = false,
    expanded = true,
    title = 'The dog',
    hint = '',
    mode = '',
    compare = false,
    rankLabels = [],
  } = {},
) {
  heading(c, title, mode);
  const retained = leaders(paths, width);
  const selected = picked ? retained : firstPlace ? retained.slice(0, 1) : [];
  columnHead(c, 'First word', 96, 269);
  columnHead(c, 'Second word', 514, 269);
  columnHead(c, 'Share of all two-word endings', 900, 269);
  paths.forEach((o, i) => {
    const y = 338 + i * 72 + (i >= 3 ? 35 : 0);
    const live = width === 2 || o.prefix === 'ran';
    const ink = live ? P.ink : P.dim,
      color = o.prefix === 'ran' ? P.red : P.blue;
    if (i === 0 || i === 3) {
      text(c, o.prefix, 100, y + 20, 50, ink, 'Serif');
      text(c, pct(o.p), 280, y + 19, 32, ink, 'Mono');
      line(c, 414, y, 414, y + (i === 0 ? 144 : 72), live ? color : P.rule, 4);
    }
    line(c, 414, y, 486, y, live ? color : P.rule, 3);
    if (!expanded) return;
    text(c, o.word, 514, y + 10, 39, ink, 'Serif');
    text(c, pct(o.q), 735, y + 10, 29, ink, 'Mono');
    box(c, 900, y - 19, o.joint * 1210, 36, live ? color : P.ghost);
    const score = pct(o.joint);
    const scoreX = 912 + o.joint * 1210;
    text(c, score, scoreX, y + 10, 31, ink, 'Mono');
    const rank = selected.indexOf(o);
    if (rank < 0) return;
    if (rankLabels[rank]) {
      const labelX = scoreX + c.measureText(score).width + 18;
      text(c, rankLabels[rank], labelX, y + 10, 38, P.teal);
    } else {
      dot(c, 1480, y, 10, P.teal);
    }
  });
  if (hint) tag(c, hint, 99, 795);
  else if (picked) {
    const best = retained[0];
    reading(
      c,
      compare
        ? 'Width 1 and width 2 both write “The dog ' + best.prefix + ' ' + best.word + '.”'
        : 'The dog ' + best.prefix + ' ' + best.word + '.',
      96,
      818,
      52,
    );
  }
}

function search(c, k) {
  const b = k.beat.beatIndex,
    width = 2;
  const picked = cue(k, 1, 'takes second');
  composingCase(c, dogPaths(), {
    width,
    picked,
    firstPlace: cue(k, 1, 'takes first place'),
    mode: 'Beam search   /   two unfinished lines',
    hint: picked ? '' : 'Which two pairs fit? On a tie, keep the earlier row.',
    rankLabels: ['1st', '2nd by tie-break'],
    expanded: cue(k, 0, 'Expand both prefixes'),
  });
  if (b === 2 && cue(k, 2, 'three or more'))
    text(
      c,
      'Other trees can lose a prefix at the first fork.',
      1500,
      205,
      28,
      P.dim,
      'Sans',
      'right',
    );
}

const pathNames = ['degraded .', 'in recovery'];
function status(c, k) {
  const b = k.beat.beatIndex;
  heading(c, 'The canary status is …', 'Toy vocabulary   /   one token for each word or punctuation mark');
  if (b === 0) {
    columnHead(c, 'First token', 94, 269);
    strip(c, STATUS_ROW, ['degraded', 'in', 'on', 'broken', ...Array(8).fill('')], {
      y: 300,
      h: 108,
    });
    text(c, 'broken 2%     |     8 separate IDs × 1%', 1505, 471, 30, P.dim, 'Mono', 'right');
    if (cue(k, 0, 'After degraded')) {
      const row = statusContinuations[0];
      columnHead(c, 'Next token after degraded', 94, 571);
      strip(c, row.map(([, p]) => p), row.map(([token]) => token), { y: 601, h: 106 });
      if (cue(k, 0, 'Which token')) tag(c, 'Which token does greedy choose next?', 96, 807);
    }
    return;
  }
  const revealed = [cue(k, 1, 'at point one eight'), cue(k, 1, 'scores point two seven')];
  pathNames.forEach((name, i) => {
    if (i === 1 && !cue(k, 1, 'After in')) return;
    const y = 340 + i * 163;
    reading(c, name, 92, y, 58);
    const conditional = statusContinuations[i];
    const factors = STATUS_ROW[i].toFixed(2) + ' × ' + conditional[0][1].toFixed(2);
    text(c, factors, 96, y + 57, 34, P.dim, 'Mono');
    columnHead(c, 'Next token after ' + STATUS_IDS[i], 1020, y - 46);
    const shares = conditional.map(([token, p]) => token + ' ' + pct(p)).join('    ');
    text(c, shares, 1020, y + 9, 31, P.ink, 'Sans', 'left', 486);
    if (revealed[i]) {
      const width = 1100 * pathProb[i];
      box(c, 550, y - 45, width, 50, [P.red, P.blue][i]);
      text(c, num(pathProb[i]), 570 + width, y - 6, 38, P.ink, 'Mono');
    }
  });
  if (b >= 2) {
    terminal(c, 95, 640, 1420, 156, 'DEPLOYMENT TELEMETRY');
    text(c, 'Awaiting rollout observation', 132, 762, 35, P.amber, 'Mono');
  }
}

function prune(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'Beyond the beam', 'First step   /   width 2');
    const split = cue(k, 0, 'Split each'),
      certain = cue(k, 0, 'single certain continuation'),
      ans = cue(k, 1, 'On track');
    ['degraded', 'in', 'on'].forEach((v, i) => {
      const y = 300 + i * 150,
        p = STATUS_ROW[i],
        w = 1640 * p;
      reading(c, v, 94, y + 40, 48);
      text(c, pct(p), 340, y + 36, 32, P.dim, 'Mono');
      box(c, 482, y, w, 55, i < 2 ? P.blue : P.ghost);
      if (split && i < 2)
        for (let j = 1; j < 10; j++)
          line(c, 482 + (w * j) / 10, y, 482 + (w * j) / 10, y + 55, P.paper, 4);
      const desc =
        i === 2
          ? certain
            ? 'track  ·  certain continuation'
            : 'prefix discarded'
          : split
            ? '10 equal continuations'
            : 'retained prefix';
      text(c, desc, 482, y + 96, 29, P.dim);
      if (ans)
        text(
          c,
          pct(i < 2 ? p / 10 : p) + (i < 2 ? ' each' : ' path'),
          1490,
          y + 37,
          32,
          i === 2 ? P.red : P.ink,
          'Mono',
          'right',
        );
    });
    return;
  }
  heading(
    c,
    'Which siblings can still place?',
    'Same two parents   /   width 2   /   equal length and consistent ties',
  );
  const pooled = cue(k, 3, 'top two children');
  childRows.forEach((row, i) => {
    const y = 320 + i * 235;
    text(c, ['degraded', 'in'][i], 95, y + 31, 50, P.ink, 'Serif');
    text(c, pct(STATUS_ROW[i]) + ' parent', 95, y + 87, 29, P.dim);
    row.forEach((q, j) => {
      const x = 455 + 345 * j;
      text(c, pct(q) + ' of parent', x, y, 27, P.dim);
      const v = products[i][j];
      box(c, x, y + 24, 1150 * v, 37, pooled && j === 2 ? P.ghost : [P.red, P.blue][i]);
      text(c, pct(v), x, y + 112, 43, P.ink, 'Mono');
      if (pooled && j === 0) text(c, 'retained', x, y + 154, 25, P.teal);
    });
  });
  if (b === 4)
    tag(c, 'Diversity bonuses or separate finished quotas can change this ordering.', 95, 796);
}

function ending(c, k) {
  const b = k.beat.beatIndex,
    known = cue(k, 1, 'The completed products'),
    limited = cue(k, 2, 'output budget');
  heading(c, 'Score the end of the message', 'Prefix probability × conditional probability of EOS');
  ledger(
    c,
    ['Candidate', 'Prefix', 'EOS', 'Completed'],
    pathNames.map((name, i) => [
      name,
      num(pathProb[i]),
      '× ' + num(eos[i]),
      known ? num(complete[i]) : '?',
    ]),
    { x: [95, 590, 880, 1205], y: 350, dy: 126 },
  );
  if (limited) {
    terminal(c, 96, 584, 1410, 210, 'ALTERNATE RUN   /   length cap reached after recovery');
    text(c, 'in recovery', 133, 737, 50, P.white, 'Serif');
    text(
      c,
      'prefix ' + num(pathProb[1]) + '    |    no EOS observed',
      630,
      736,
      33,
      P.amber,
      'Mono',
    );
  } else if (b === 1 && cue(k, 1, 'Reaching an output limit'))
    tag(c, 'A length-limited prefix carries its own stop reason.', 96, 726);
}

function normalized(c, k) {
  const b = k.beat.beatIndex,
    a = 0.6 * cue(k, 2, 'With alpha point six', 0.9);
  const scored = smallLogs.map((z, i) => lengthScore(z, lengths[i], a));
  heading(c, 'Which completed line ranks first?', 'Completed S and L   /   length excludes EOS');
  const denom = (i) => Math.pow((5 + lengths[i]) / 6, a);
  ledger(
    c,
    ['Candidate', 'Tokens', 'Raw log P', b > 0 ? 'Divisor' : '', b > 0 ? 'Score' : ''],
    smallLogs.map((z, i) => [
      ['S', 'L'][i],
      lengths[i],
      num(z),
      b > 0 ? num(denom(i), 4) : '',
      b > 0 ? num(scored[i], 4) : '',
    ]),
    { x: [96, 455, 719, 1060, 1302], y: 365, dy: 125 },
  );
  if (b > 0) {
    reading(c, 'Divisor = ((5 + length) / 6) ^ alpha', 96, 625, 45);
    text(c, 'α = ' + num(a, 2), 1100, 625, 44, P.red, 'Mono');
  }
  const x = (v) => 260 + (v + 1.12) * 3090;
  line(c, 215, 751, 1430, 751, P.rule, 3);
  scored.forEach((v, i) => {
    dot(c, x(v), 751, 12, [P.red, P.blue][i]);
    text(c, ['S', 'L'][i], x(v), i === 0 ? 714 : 811, 40, [P.red, P.blue][i], 'Serif', 'center');
  });
  text(c, 'Higher score →', 1480, 708, 28, P.dim, 'Sans', 'right');
}
function bound(c, k) {
  const extend = cue(k, 0, 'append a token'),
    reveal = cue(k, 1, 'improves');
  const log = -1 + Math.log(0.99),
    value = lengthScore(log, 2, 0.6);
  heading(
    c,
    'Can the prefix score rise?',
    'GNMT length penalty   /   α = 0.6   /   length excludes EOS',
  );
  ledger(
    c,
    ['Prefix', 'Counted length', 'Raw log P', 'Normalized'],
    [
      ['Before extension', '1', '−1', '−1'],
      ...(extend ? [['After p = 0.99', '2', num(log, 5), reveal ? num(value, 5) : '?']] : []),
    ],
    { x: [95, 580, 936, 1240], y: 360, dy: 129 },
  );
  if (extend) reading(c, 'Score = log P / ((5 + length) / 6) ^ 0.6', 95, 665, 54);
  if (reveal)
    tag(
      c,
      'The raw score fell. A stopping bound must allow this normalized score to rise.',
      95,
      789,
    );
}

function beamWork(c, k) {
  const wide = cue(k, 2, 'eight active prefixes');
  const { rows, total } = beamStep(wide);
  const batched = cue(k, 3, 'batch all eight rows');
  const shared = cue(k, 3, 'reuse the cached prompt');
  const separate = cue(k, 3, 'its own suffix');
  const timing = cue(k, 3, 'Time both widths');
  const rowY = (i) => 289 + i * 54;
  const first = rowY(0), last = rowY(rows.length - 1);
  const perRow = rows[0].scores.toLocaleString('en-US');
  heading(c, 'How many child scores in one step?', 'Full vocabulary   /   ' + perRow + ' possible next tokens per active prefix');

  if (batched) {
    box(c, 782, first - 26, 356, last - first + 52, '#dbe7e8');
    line(c, 1134, first, 1134, last, P.blue, 4);
  }
  columnHead(c, shared ? 'Shared prompt cache' : 'Common prompt', 90, 246);
  const mid = (first + last) / 2;
  if (shared) {
    box(c, 90, mid - 52, 313, 104, P.teal);
  }
  text(c, rows[0].promptCache.text, 246, mid + 11, 34, shared ? P.white : P.ink, 'Serif', 'center', 285);
  const edge = shared ? P.teal : P.rule;
  line(c, 403, mid, 440, mid, edge, 4);
  line(c, 440, first, 440, last, edge, 4);
  columnHead(c, separate ? 'Branch suffix cache' : 'Active suffix', 490, 246);
  columnHead(c, batched ? 'Score rows in one batch' : 'Child scores', 806, 246);
  for (const [i, row] of rows.entries()) {
    const y = rowY(i);
    line(c, 440, y, 485, y, edge, 3);
    if (separate) box(c, 485, y - 22, 245, 44, P.night);
    text(c, row.suffix, 506, y + 12, 34, separate ? P.white : P.ink, 'Serif');
    line(c, 730, y, 790, y, P.rule);
    box(c, 796, y - 20, 325, 40, P.blue);
    text(c, row.scores.toLocaleString('en-US'), 958, y + 11, 30, P.white, 'Mono', 'center');
  }
  columnHead(c, 'Step total', 1200, 344);
  const showTotal = !wide || cue(k, 3, 'The engine');
  reading(c, showTotal ? total.toLocaleString('en-US') : '?', 1196, 419, 70);
  text(c, rows.length + ' × ' + perRow, 1202, 477, 31, P.dim, 'Mono');
  if (timing) tag(c, 'Time width 1 and width 8 on the same engine. Match prompts and output lengths.', 94, 798);
}

function quality(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 2) return beamWork(c, k);
  heading(
    c,
    b === 0 ? 'What did the search optimize?' : 'How would you check this answer?',
    b === 0 ? 'Text generation and translation experiments' : 'Supplied status example',
  );
  if (b === 0) {
    reading(c, 'Holtzman et al.', 95, 371, 54);
    text(c, 'GPT-2   /   open-ended generation', 98, 426, 33, P.dim);
    tag(c, 'Generic repetitions and some immediate endings', 97, 510);
    if (cue(k, 0, 'Meister')) {
      reading(c, 'Meister et al.', 95, 649, 54);
      text(c, 'Regularized decoding objectives in translation', 98, 706, 33, P.dim);
    }
  } else {
    terminal(c, 95, 277, 675, 380, 'GENERATED LINE');
    text(c, 'in recovery', 130, 475, 69, P.white, 'Serif');
    terminal(c, 830, 277, 675, 380, 'ILLUSTRATIVE ROLLOUT RECORD');
    text(c, 'phase = paused', 865, 474, 53, P.amber, 'Mono', 'left', 605);
    tag(c, 'Check the reported phase against the observation.', 95, 780);
  }
}
export const searchPainters = {
  c04: search,
  c05: status,
  c06: prune,
  c07: ending,
  c08: normalized,
  c09: bound,
  c10: quality,
};
