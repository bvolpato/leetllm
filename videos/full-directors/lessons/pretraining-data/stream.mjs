import {
  paper,
  white,
  ink,
  teal,
  red,
  gold,
  muted,
  line,
  mint,
  peach,
  blue,
  ochre,
  pale,
  rect,
  rule,
  dot,
  label,
  mono,
  big,
  heading,
  tape,
  arrow,
  cells,
  textRows,
  tag,
  meter,
  percent,
  total,
} from './art.mjs';
import {
  minima,
  lengths,
  packRecords,
  input,
  segments,
  independentObjective,
  PACKED_WORDS,
  order,
  restoreRecords,
  digest,
  shardBytes,
  cooldown,
  releaseEvaluation as evaluation,
  releaseBatch,
  releaseKept,
  PROXY_RESULTS,
  preparationBranch,
} from './data.mjs';
const palette = [mint, blue, ochre, peach, '#90c5b1', '#a5b7d9'];
export function packingState(s) {
  if (s.at(5, 'Return to the first arrangement')) return { source: lengths, n: 6, single: false };
  if (s.at(4, 'every record has six')) return { source: [6, 6, 6], n: 3, single: false };
  const n = ['Put seven', 'Six needs', 'two fives', 'two fives', 'Slide three', 'Put two'].filter(
    (p) => s.at(2, p),
  ).length;
  return { source: lengths, n, single: s.beat === 1 };
}
function packing(g, s) {
  const { source, n, single } = packingState(s);
  heading(
    g,
    'Capacity 10  /  records include separators',
    'How many slots can we fill with whole records?',
  );
  if (single) {
    const capacity = source.length * 10;
    source.forEach((v, i) => {
      const y = 198 + i * 55;
      mono(g, 'R' + (i + 1), 63, y + 27, 22);
      for (let j = 0; j < 10; j++) rect(g, 178 + j * 76, y, 71, 37, j < v ? palette[i] : white);
    });
    mono(
      g,
      source.reduce((a, b) => a + b) + ' real tokens / ' + capacity + ' allocated slots',
      60,
      602,
      30,
    );
    return;
  }
  const bins = packRecords(source.slice(0, n)),
    seated = source.slice(0, n).reduce((a, b) => a + b, 0);
  tag(g, 'Source lengths  /  pale records have been placed', 60, 204);
  source.forEach((v, i) => {
    const x = 64 + i * 176;
    rect(g, x, 225, 151, 55, i < n ? pale : palette[i]);
    mono(g, 'R' + (i + 1) + ' · ' + v, x + 75, 261, 23, i < n ? muted : ink, 'center');
  });
  for (let i = 0; i < 3; i++) {
    let records = [];
    for (const r of bins[i] ?? []) records.push(...Array(r.n).fill(r.id));
    const y = 333 + i * 73;
    tag(g, 'Block ' + (i + 1), 62, y + 31);
    for (let j = 0; j < 10; j++) {
      const id = records[j],
        x = 244 + j * 88;
      rect(g, x, y, 84, 48, id === undefined ? white : palette[id]);
      if (id !== undefined) mono(g, 'R' + (id + 1), x + 42, y + 32, 20, ink, 'center');
    }
  }
  if (n === source.length)
    big(
      g,
      seated +
        ' / ' +
        bins.length * 10 +
        ' slots   ·   ' +
        percent(seated, bins.length * 10) +
        ' full',
      60,
      613,
      43,
    );
  else
    tag(
      g,
      seated + ' tokens placed  /  ' + (source.reduce((a, b) => a + b, 0) - seated) + ' waiting',
      60,
      606,
    );
}
function matrix(g, mask, x, y, dx, selected, visible) {
  mask.forEach((row, i) =>
    row.forEach((allow, j) => {
      const active = i === selected,
        color = visible && allow ? (active ? teal : mint) : active ? ochre : white;
      rect(g, x + j * dx, y + i * dx, dx - 3, dx - 3, color);
      if (visible && allow)
        dot(g, x + (j + 0.5) * dx - 1.5, y + (i + 0.5) * dx - 1.5, 4, active ? white : teal);
    }),
  );
}
function boundaries(g, s) {
  const ids = PACKED_WORDS,
    docs = [0, 0, 0, 1, 1, 1];
  const { mask } = independentObjective(ids, docs);
  const q = s.at(5, 'Go back to sat')
    ? 2
    : s.at(3, 'Move to the end marker')
      ? 5
      : s.at(3, 'Move to sing')
        ? 4
        : 3;
  const known = s.at(3, 'None of the earlier');
  heading(
    g,
    'One packed block  /  independent documents',
    s.beat < 5
      ? 'Which keys can this word read?'
      : 'Should sat predict the first word of the next document?',
  );
  const x = 58,
    w = 1085;
  cells(g, ids, x, 218, w, 86, { colors: docs.map((id) => (id ? blue : mint)), size: 28 });
  const xx = x + ((q + 0.5) * w) / 6;
  arrow(g, xx, 361, xx, 311, red);
  mono(g, 'query', xx, 387, 21, red, 'center');
  if (!known) {
    tag(g, 'Earlier document', 59, 192);
    tag(g, 'New document', 620, 192);
    return;
  }
  matrix(g, mask, 63, 388, 36, q, true);
  mono(g, 'q ↓    k →', 63, 638, 19);
  const keys = ids.filter((_, k) => mask[q][k]);
  tag(g, 'Readable keys', 384, 446);
  big(g, keys.join('   '), 383, 504, 39);
  if (s.beat >= 5 && s.at(5, 'skip that prediction'))
    mono(g, 'sat → Birds     target ignored', 385, 583, 28, red);
  else if (s.beat >= 4) label(g, 'Same document, key position ≤ query position.', 386, 582, 24);
}
function labels(g, s) {
  const obj = independentObjective(input, segments),
    internal = s.at(4, 'If the model shifts'),
    done = s.at(4, 'After one shift');
  heading(
    g,
    'One packed block  /  loss alignment',
    internal
      ? 'The model shifts input-aligned labels once'
      : 'Which next-token predictions get a loss?',
  );
  const x = 287,
    w = 842,
    dx = w / 5;
  const row = (title, items, y, colors) => {
    tag(g, title, 57, y + 38);
    cells(g, items, x, y, w, 60, { colors, size: 25 });
  };
  row(
    'Input IDs',
    input,
    208,
    segments.map((i) => (i ? blue : mint)),
  );
  row(
    'Document',
    segments,
    283,
    segments.map((i) => (i ? blue : mint)),
  );
  if (s.beat <= 2) {
    matrix(g, obj.mask, 60, 381, 39, 3, Boolean(s.at(1, 'allow a key')));
    tag(g, 'Key in the same document, k ≤ q', 355, 449);
    if (s.at(2, 'cannot read')) mono(g, 'q = 3, k = 2  →  blocked', 355, 527, 31, red);
    return;
  }
  if (!internal) {
    row(
      'Shifted targets',
      obj.targets,
      421,
      obj.targets.map((v) => (v === -100 ? peach : white)),
    );
  } else {
    row(
      'Supplied labels',
      obj.labels,
      386,
      obj.labels.map((v) => (v === -100 ? peach : white)),
    );
    if (done) {
      for (let i = 0; i < 4; i++) arrow(g, x + (i + 1.5) * dx, 453, x + (i + 0.5) * dx, 484, muted);
      cells(g, obj.labels.slice(1), x, 489, dx * 4, 56, {
        colors: obj.labels.slice(1).map((v) => (v === -100 ? peach : white)),
      });
      tag(g, 'Aligned targets', 58, 525);
    }
  }
  if (!internal || done) {
    const aligned = internal ? obj.labels.slice(1) : obj.targets;
    const answered = internal ? s.at(4, 'Three predictions receive') : s.at(3, 'three supervised predictions');
    const count = answered ? aligned.filter((v) => v !== -100).length : '?';
    mono(
      g,
      count + ' supervised predictions  ·  −100 skips loss',
      60,
      615,
      26,
      teal,
    );
  }
}
const streamOrder = ['A', 'C', 'E', 'A', 'C', 'E'];
function lineage(g, s) {
  heading(g, 'Pinned dataset  /  sampler state', 'Where is the next block in this order?');
  tape(g, 60, 205, 1080, 112, white);
  tag(g, 'Manifest', 78, 252);
  mono(g, 'shard bytes  /  tokenizer  /  extraction and policy revisions', 78, 288, 21);
  const cursor = s.at(2, 'restore the consumed cursor') ? 2 : 0;
  const x = 59,
    dx = 180;
  cells(g, streamOrder, x, 401, 1080, 82, {
    colors: streamOrder.map((_, i) => (i < cursor ? pale : i === cursor ? mint : white)),
  });
  arrow(g, x + cursor * dx + 18, 377, x + cursor * dx + 18, 399, red);
  tag(g, 'Next to deliver · consumed cursor ' + cursor, x + cursor * dx, 358, red);
  if (s.at(2, 'E is the next block'))
    mono(g, 'Restored next block  ' + streamOrder[cursor], 60, 560, 30, teal);
  if (s.beat === 3)
    label(g, 'Group related documents before splitting training and held-out data.', 60, 620, 25);
}
const restored = restoreRecords(order, 2, 4);
function history(g, s) {
  if (s.beat === 1) {
    heading(g, 'Distributed preparation', 'Which records need the same comparison owner?');
    const events = ['A · band 1', 'B · band 1', 'C · band 1'];
    events.forEach((v, i) => {
      const y = 245 + i * 99;
      tape(g, 60, y, 320, 79, [mint, blue, ochre][i]);
      mono(g, v, 83, y + 49, 26);
      if (s.at(1, 'shuffling records'))
        arrow(g, 388, y + 40, 785, i < 2 ? 321 : 465, i < 2 ? teal : gold);
    });
    rect(g, 799, 267, 324, 108, mint);
    rect(g, 799, 412, 324, 108, ochre);
    big(g, 'A + B', 822, 320, 36);
    mono(g, '109f7012… + 3 rows', 818, 358, 21);
    big(g, 'C', 822, 466, 36);
    mono(g, minima[2][4][0].slice(0, 8) + '… + 3 rows', 818, 505, 21);
    label(g, 'Measure records per second, shuffle traffic and packing throughput.', 60, 602, 25);
    return;
  }
  const consumed = s.at(2, 'consumed zero and five') ? restored.prefix.length : 0;
  const read = s.at(2, 'already fetched') ? consumed + restored.skippedByReader.length : consumed;
  const resume = s.at(3, 'Resume at the consumed cursor');
  const readerRestart = s.beat === 4 && s.at(4, 'If we restore the reader cursor');
  const seedSetup = s.beat === 4 && s.at(4, 'If we restart from the seed alone');
  const seedRestart = seedSetup && s.after(4, 'zero and five repeat');
  heading(
    g,
    'Saved shuffle  /  completed optimizer step',
    'Which record must reach the optimizer next?',
  );
  const x = 67,
    dx = 176,
    savedY = 246,
    outY = 469;
  mono(g, 'Saved order', x, 184, 22, muted);
  s.at(3, 'and verify its bytes', 0, { captionStart: 'and verify its bytes' });
  s.at(4, 'and look at the reader cursor', 0, { captionStart: 'and look at the reader cursor' });
  s.at(4, 'at the completed optimizer step', 0, { captionStart: 'at the completed optimizer step' });
  if (s.beat === 3 && s.at(3, 'changed record', 0, { captionStart: 'A changed record' })) {
    tag(g, 'Example shard SHA-256', 605, 184);
    mono(
      g,
      digest(shardBytes).slice(0, 8) + '… ≠ ' + digest(shardBytes + 'changed').slice(0, 8) + '…',
      882,
      184,
      21,
      red,
    );
  }
  if (s.beat === 5)
    label(
      g,
      'Restore the model, optimizer, schedule and random state at this step.',
      1109,
      184,
      22,
      ink,
      'Sans',
      400,
      'right',
    );
  order.forEach((n, i) => {
    const xx = x + i * dx;
    tape(g, xx, savedY, dx - 4, 99, i < consumed ? pale : i < read ? ochre : white);
    mono(g, n, xx + (dx - 4) / 2, savedY + 68, 48, ink, 'center');
    tag(
      g,
      i < consumed ? 'Consumed' : i < read ? 'Buffered' : 'Unread',
      xx + 14,
      savedY + 130,
      i < consumed ? muted : i < read ? gold : ink,
    );
  });
  const cx = x + consumed * dx,
    rx = x + read * dx;
  rule(g, cx - 2, 232, cx - 2, savedY + 100, teal, 5);
  tag(g, 'Consumed cursor ' + consumed, cx, 222, teal);
  rule(g, rx - 2, savedY + 100, rx - 2, 399, red, 5);
  tag(g, 'Reader cursor ' + read, rx, 424, red);
  if (!resume) {
    if (s.at(2, 'If the job stops')) big(g, 'Next record?', x, 512, 37);
    return;
  }

  const firstRecord = s.after(3, 'Deliver record one first');
  const secondRecord = s.after(3, 'Record two follows');
  const remainingRecords = s.after(3, 'then three and four');
  const delivered = remainingRecords ? restored.suffix.length : Number(firstRecord) + Number(secondRecord);
  const skips = readerRestart && !seedRestart && s.after(4, 'records one and two never reach training');
  const repeats = seedRestart;
  const path = seedRestart
    ? 'Seed-only restart'
    : readerRestart ? 'Reader cursor restart' : 'Consumed cursor restart';
  const pathColor = readerRestart || seedRestart ? red : teal;
  tag(g, path, x, 440, pathColor);
  if (seedSetup && !seedRestart) tag(g, 'Seed only: which records repeat?', x + 350, 440, muted);

  order.forEach((id, i) => {
    const xx = x + i * dx;
    const consumedEarlier = restored.prefix.includes(id);
    const skipped = skips && restored.skippedByReader.includes(id);
    const repeated = repeats && restored.repeatedBySeed.includes(id);
    const inner = !readerRestart && i >= consumed && i < consumed + delivered;
    const replayed = (skips && i >= read) || (repeats && !consumedEarlier) || inner;
    const showing = skipped || repeated || replayed;
    const wrong = skipped || repeated;
    const fill = wrong ? peach : i < read ? mint : white;
    rect(g, xx, outY, dx - 4, 52, showing ? fill : pale);
    if (!showing) return;
    if (skipped || repeated)
      tag(g, skipped ? 'Skipped' : 'Repeats', xx + 13, outY + 32, red);
    mono(g, id, xx + dx - 24, outY + 34, 29, wrong ? red : ink, 'right');
    if (i === consumed && inner) tag(g, 'Next', xx + 13, outY + 32, teal);
    if (i === read && skips) tag(g, 'Next', xx + 13, outY + 32, red);
  });
}
function anneal(g, s) {
  if (s.beat <= 2) {
    heading(g, 'Late-stage annealing', 'Compare two finishes from the same checkpoint');
    const X = (v) => 93 + v * 1012,
      Y = (v) => 454 - v * 189;
    rule(g, X(0), Y(0), X(1), Y(0), line);
    rule(g, X(0), Y(0), X(0), Y(1), line);
    const t = s.at(1, 'linear decay to zero', 2.1);
    rule(g, X(0), Y(1), X(t), Y(1 - t), teal, 6);
    tag(g, 'Learning rate', 70, 216);
    mono(g, '0', 61, Y(0) + 7, 19);
    mono(g, 'Last 40M tokens in the reported Llama 3 cooldown', 77, 510, 24);
    if (s.beat === 2)
      label(
        g,
        'Same starting weights and schedule  /  change the candidate mixture',
        77,
        606,
        25,
        teal,
      );
    return;
  }
  if (s.beat === 5) {
    heading(g, 'Recursive training', 'Which mixture still carries the rare original?');
    const real = ['R1', 'R2', 'rare R3'],
      generated = ['G1', 'G2', 'G3'];
    tag(g, 'Replacement', 60, 231);
    cells(g, generated, 60, 262, 703, 80, { colors: [blue, blue, blue] });
    if (s.at(5, 'Accumulating original')) {
      tag(g, 'Retain and accumulate', 60, 416);
      cells(g, [...real, ...generated], 60, 449, 1084, 80, {
        colors: [mint, mint, ochre, blue, blue, blue],
      });
    }
    label(g, 'Track rare-source coverage in held-out cases.', 60, 618, 26);
    return;
  }
  if (s.beat <= 4) {
    heading(g, 'Synthetic supplementation', 'Can you trace a generated exercise to a real source?');
    tape(g, 60, 249, 370, 182, mint);
    tag(g, 'Real source R1', 78, 295);
    mono(g, 'def add(a, b):', 78, 350, 25);
    mono(g, '    return a + b', 78, 390, 25);
    const answer = s.at(4, 'It returns five') ? '5' : '?';
    ['Exercise G1', 'Explanation G2'].forEach((v, i) => {
      const y = 218 + i * 160;
      arrow(g, 437, 338, 703, y + 51);
      tape(g, 715, y, 419, 106, blue);
      tag(g, v, 737, y + 43);
      mono(g, i ? 'Why indent return?' : 'add(2, 3) → ' + answer, 737, y + 81, 24);
    });
    if (s.beat >= 4)
      label(
        g,
        'R1 identity  /  teacher terms  /  privacy decision  /  verified answer',
        60,
        549,
        25,
      );
    return;
  }
  heading(g, 'Controlled cooldown trial', 'Does the candidate meet the domain floor?');
  const targetSeen = s.at(6, 'point nine two'),
    seen = s.at(6, 'point seven seven'),
    verdict = s.at(6, 'Hold this mixture');
  ['Target', 'Held-out domain'].forEach((name, i) => {
    const y = 259 + 132 * i;
    tag(g, name, 64, y);
    mono(g, cooldown.baseline[i].toFixed(2), 416, y, 36);
    if (i === 0 ? targetSeen : seen) {
      arrow(g, 577, y - 12, 684, y - 12);
      mono(g, cooldown.candidate[i].toFixed(2), 735, y, 36, i === 1 ? red : teal);
    }
  });
  if (s.at(6, 'declared floor')) mono(g, 'Domain floor  ' + cooldown.floor.toFixed(2), 60, 505, 30);
  if (verdict) big(g, 'Hold · revise the mixture', 59, 612, 46, red);
}
const runIds = ['C', 'A', 'C', 'E'];
function compactInventory(g, branch, y, cut) {
  mono(g, 'cut ' + cut.toFixed(2), 57, y + 47, 23);
  let x = 239;
  branch.unique.forEach((r) => {
    const w = r.tokens * 1.28;
    tape(g, x, y, w - 3, 74, r.id === 'C' ? mint : r.id === 'E' ? ochre : white);
    mono(g, r.id + ' · ' + r.tokens, x + 15, y + 46, 23);
    x += w;
  });
  mono(g, branch.tokens + ' tokens', 1136, y + 46, 23, ink, 'right');
}
function transfer(g, s) {
  const baseline = preparationBranch(0.5);
  if (s.beat <= 2) {
    heading(g, 'Source ID + offset', 'Did the sampler find 200 distinct code tokens?');
    compactInventory(g, baseline, 211, 0.5);
    const n = ['start of C', 'then A', 'same part of C', 'then E'].filter((p) => s.at(1, p)).length;
    runIds.forEach((id, i) => {
      const x = 60 + i * 273;
      tag(g, 'Draw ' + (i + 1), x, 358);
      tape(g, x, 381, 251, 111, i < n ? (id === 'C' ? mint : id === 'E' ? ochre : white) : pale);
      if (i < n) mono(g, id + '[0:100]', x + 14, 454, 26);
    });
    if (s.at(1, 'The model saw'))
      big(g, '200 code presentations · 100 distinct code positions', 59, 593, 41);
    return;
  }
  const threshold =
    Math.round(
      100 *
        (0.5 +
          0.21 * s.at(3, 'crosses point seven', 0.8) +
          0.1 * s.at(3, 'Above point eight', 0.7) +
          0.04 * s.at(3, 'Stop at point eight five', 0.4)),
    ) / 100;
  const strict = preparationBranch(threshold);
  heading(g, 'Matched cutoff trial', 'What changed when the cutoff moved?');
  compactInventory(g, baseline, 181, 0.5);
  compactInventory(g, strict, 278, threshold);
  if (s.beat <= 4) {
    tag(g, 'Token-weighted mean score', 59, 433);
    mono(g, baseline.mean.toFixed(3) + '   →   ' + strict.mean.toFixed(3), 59, 512, 49, teal);
    if (s.beat === 4) label(g, 'Could another draw recover any code?', 60, 603, 30);
    return;
  }
  const show = s.at(5, 'Seven successes become five');
  if (show) {
    for (const [index, key] of ['baseline', 'strict'].entries()) {
      const results = PROXY_RESULTS[key],
        y = 401 + index * 75;
      tag(g, index ? 'Strict' : 'Baseline', 58, y + 33);
      cells(
        g,
        results.map((v) => (v ? '1' : '0')),
        231,
        y,
        733,
        50,
        { colors: results.map((v, i) => (i < 2 && index ? peach : v ? mint : pale)), size: 24 },
      );
      mono(g, results.filter(Boolean).length + '/10', 1000, y + 35, 27);
    }
  }
  if (show) tag(g, '1 = success   /   0 = miss', 60, 565);
  if (s.beat === 6)
    label(g, 'Next trial: restore C alone. Keep the token budget fixed.', 59, 619, 27, teal);
}
const initialCut = 0.7;
const strictCut = 0.9;
const codeScore = releaseBatch.find((r) => r.id === 'Code').score;
const webScore = releaseBatch.find((r) => r.id === 'Web').score;
const batchTokens = total(releaseBatch);

export function trialState(s) {
  const cut =
    Math.round(
      100 *
        (initialCut +
          (codeScore - initialCut) * s.at(2, 'Move the cutoff', 0.8) +
          (webScore - codeScore) * s.at(2, 'It crosses code', 1.4) +
          (strictCut - webScore) * s.at(2, 'then web', 0.8)),
    ) / 100;
  const code = s.at(6, 'Lower just the code cutoff') ? initialCut : cut;
  return { cut, code, kept: releaseKept(releaseBatch, code, cut) };
}

function releaseComparison(g, s) {
  heading(
    g,
    'Matched training runs  /  ' + evaluation.casesPerTask + ' cases per task',
    'Does the stricter mix meet the code requirement?',
  );
  const baselineSeen = [s.at(3, 'goes from sixteen'), s.at(4, 'Code goes from')];
  const movement = [
    s.at(3, 'to nineteen', 0.45),
    s.at(4, 'to fifteen', 0.45),
  ];
  const floorSeen = s.at(3, 'code needs sixteen successes');
  const showTotal = s.at(4, 'The combined count improves');
  const decision = s.at(5, 'Hold this mix');
  const x = 304;
  const dx = 36;
  label(g, 'Successes', 1105, 195, 24, muted, 'Sans', 600, 'right');

  evaluation.tasks.forEach((task, i) => {
    const y = 228 + i * 172;
    const strictY = y + 57;
    const reference = evaluation.baseline[i];
    const result = evaluation.candidate[i];
    const strictCount = reference + Math.round((result - reference) * movement[i]);
    const isCode = task === 'Code';
    const color = isCode ? teal : '#487b99';

    label(g, task, 60, y + 59, 32, ink, 'Sans', 600);
    label(g, 'Baseline', 164, y + 26, 25, muted);
    label(g, 'Strict', 164, strictY + 26, 25, muted);
    for (let j = 0; j < evaluation.casesPerTask; j++) {
      rect(g, x + j * dx, y, dx - 3, 37, baselineSeen[i] && j < reference ? color : white);
      const fill = movement[i] && j < strictCount ? color : white;
      const gap = isCode && decision && j >= result && j < evaluation.codeFloor;
      rect(g, x + j * dx, strictY, dx - 3, 37, gap ? peach : fill);
    }
    if (baselineSeen[i]) mono(g, reference, 1105, y + 27, 27, ink, 'right');
    if (movement[i] === 1) mono(g, result, 1105, strictY + 27, 27, ink, 'right');

    if (isCode && floorSeen) {
      const floorX = x + evaluation.codeFloor * dx - 2;
      const floorColor = decision ? red : muted;
      rule(g, floorX, y - 11, floorX, strictY + 46, floorColor, 3);
      label(
        g,
        evaluation.codeFloor + ' required',
        floorX,
        y - 20,
        25,
        floorColor,
        'Sans',
        600,
        'center',
      );
    }
  });

  if (showTotal) {
    const baselineTotal = evaluation.baseline.reduce((a, b) => a + b, 0);
    const strictTotal = evaluation.candidate.reduce((a, b) => a + b, 0);
    mono(g, 'Total  ' + baselineTotal + ' → ' + strictTotal, 60, 553, 32);
  }
  if (decision) {
    const codeResult = evaluation.candidate[evaluation.tasks.indexOf('Code')];
    const gap = evaluation.codeFloor - codeResult;
    big(g, 'Hold mix. Code is ' + gap + ' short.', 540, 553, 39, red, 593);
  }
}

function release(g, s) {
  if (s.beat <= 2 || s.beat >= 6) {
    const { cut, code, kept } = trialState(s);
    const follow = s.beat >= 6;
    const restoredCode = follow && code === initialCut;
    heading(
      g,
      follow ? 'Matched follow-up  /  new mixture' : 'Release exercise  /  ' + batchTokens + ' tokens',
      follow
        ? 'Which source does the new trial restore?'
        : 'At a cutoff of ' + strictCut.toFixed(2) + ', which tokens survive?',
    );
    let x = 59;
    releaseBatch.forEach((r) => {
      const yes = kept.includes(r),
        w = (1080 * r.tokens) / batchTokens,
        y = yes ? 245 : 352;
      tape(
        g,
        x,
        y,
        w - 4,
        100,
        yes ? (r.id === 'Code' ? mint : r.id === 'Docs' ? blue : ochre) : pale,
      );
      tag(g, r.id + '  ' + r.score.toFixed(2), x + 11, y + 40, yes ? teal : muted);
      mono(g, r.tokens + ' tokens', x + 11, y + 75, 24);
      x += w;
    });
    mono(g, 'Code ≥ ' + code.toFixed(2) + '     Docs and web ≥ ' + cut.toFixed(2), 60, 199, 26);
    if (s.at(2, "That's one hundred eighty")) {
      const retainedTokens = total(kept);
      big(
        g,
        retainedTokens + ' / ' + batchTokens + ' tokens  ·  ' + percent(retainedTokens, batchTokens),
        60,
        restoredCode ? 412 : 537,
        40,
      );
    }
    if (s.beat === 1) big(g, 'Predict the retained source and token count.', 60, 546, 38);
    if (restoredCode) {
      if (s.beat >= 7) tag(g, 'Pinned stream: 2 consumed · 4 read', 61, 512);
      tag(g, 'Strict mix: docs 19/20 · code 15/20', 61, 547, muted);
      mono(g, 'Fresh code result   ? / 20', 1130, 515, 27, teal, 'right');
      if (s.beat === 8) tag(g, 'Minimum: ' + evaluation.codeFloor + ' successes', 838, 547);
    }
    return;
  }
  releaseComparison(g, s);
}
export default [packing, boundaries, labels, lineage, history, anneal, transfer, release];
