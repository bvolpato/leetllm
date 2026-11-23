import {
  base,
  bracket,
  circle,
  clamp,
  cream,
  cue,
  fade,
  foot,
  gold,
  green,
  header,
  ink,
  line,
  mint,
  mix,
  mono,
  muted,
  num,
  paper,
  peach,
  rect,
  red,
  rule,
  sheet,
  small,
  type,
} from './drawing.mjs';
import {
  admission,
  bill,
  guide,
  normalize,
  policyTrace,
  questions,
  rates,
  usage,
  worker,
  workRows,
} from './examples.mjs';

export function ledger(c, k) {
  const tally = cue(k, 1, 'first row costs', 0);
  const more = cue(k, 1, 'Add thirty-seven and fifty-one', 0);
  const totals = cue(k, 1, 'That makes', 0);
  const replay = cue(k, 2, 'Evict the guide before request three', 0) > 0;
  const ratio = cue(k, 2, 'Divide summed read tokens', 0);
  base(
    c, k,
    ratio ? 'What share of the input was reused?' : 'How many input positions need fresh prefill?',
    'INPUT WORK AND OUTPUT',
  );
  const rows = workRows(replay),
    xs = [116, 690, 855, 1100, 1366, 1680];
  header(c, 'Sequential requests · same worker and settings', 105, 285);
  if (replay) small(c, 'Warm R3 previously read 6,000 and processed 51', 1813, 285, green, 'right');
  sheet(c, 87, 327, 1746, 430);
  const heads = ['Question', 'Shared guide', 'Tail', 'Reused', 'Fresh', 'Output'];
  heads.forEach((s, j) => small(c, s, xs[j], 368, muted, j ? 'right' : 'left'));
  line(
    c,
    [
      [112, 403],
      [1795, 403],
    ],
    rule,
    2,
  );
  rows.forEach((r, i) => {
    const y = 465 + i * 106,
      visible = i === 0 ? tally : more;
    if (replay && i === 2) rect(c, 103, y - 45, 1698, 88, '#f7e3cc', 4);
    type(c, questions[i], xs[0], y, 39, ink, { face: 'Serif' });
    mono(c, num(guide), xs[1], y, 42, ink, 'right');
    if (visible) {
      const width = 390;
      rect(c, xs[0], y + 29, width, 8, red, 2);
      if (r.read) rect(c, xs[0], y + 29, (width * r.read) / r.total, 8, green, 2);
    }
    mono(c, num(r.tail), xs[2], y, 42, ink, 'right');
    [r.read, r.fresh].forEach((n, j) =>
      mono(
        c,
        visible ? num(n) : '?',
        xs[3 + j],
        y,
        42,
        visible ? (j ? red : green) : muted,
        'right',
      ),
    );
    mono(c, num(r.output), xs[5], y, 42, ink, 'right');
  });
  const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
  if (totals) {
    [sum('read'), sum('fresh'), sum('output')].forEach((v, j) =>
      mono(c, num(v), xs[3 + j], 798, 43, [green, red, ink][j], 'right'),
    );
    small(c, 'TOTAL', xs[0], 795);
  }
  const yieldPct = ((100 * sum('read')) / sum('total')).toFixed(1);
  foot(
    c,
    ratio
      ? 'Reused input after eviction: ' +
          num(sum('read')) +
          ' / ' +
          num(sum('total')) +
          ' = ' +
          yieldPct +
          '%.'
      : replay
        ? 'R3 pays for the guide again. Its 96 output tokens stay in the output column.'
        : totals
          ? 'Three cold runs would process ' +
            num(sum('total')) +
            ' positions. Two warm reads avoid ' +
            num(sum('read')) +
            '.'
          : 'The first request writes the guide. The next two find the completed entry.',
    ratio ? green : ink,
  );
}

export function receipts(c, k) {
  const subtract = cue(k, 1, 'Subtract the reads and writes', 0.7);
  const add = cue(k, 1, 'Add ordinary', 0.5);
  const share = cue(k, 1, 'Both receipts read', 0.6);
  base(c, k, share ? 'What share of each input was read?' : 'How can we compare these two usage receipts?', 'USAGE RECEIPTS');
  const first = normalize(usage.inclusive),
    second = normalize(usage.separate);
  [first, second].forEach((r, i) => {
    const x = 103 + i * 891,
      w = 828;
    sheet(c, x, 307, w, 476);
    type(c, i ? 'Separate buckets' : 'Inclusive total', x + 40, 362, 48, ink, { face: 'Serif' });
    small(c, i ? 'Claude-style usage fixture' : 'Responses-style usage fixture', x + 40, 414);
    const row = (label, val, n, color = ink) => {
      type(c, label, x + 41, 479 + n * 65, 36, color);
      mono(c, val, x + w - 40, 479 + n * 65, 38, color, 'right');
    };
    row(i ? 'cache_read_input_tokens' : 'cached_tokens', num(r.read), 0, green);
    row(i ? 'cache_creation_input_tokens' : 'cache_write_tokens', num(r.write), 1);
    row(
      i ? 'input_tokens  (ordinary)' : 'Ordinary input',
      i || subtract ? num(r.ordinary) : '?',
      2,
    );
    row(i ? 'Total input' : 'input_tokens  (total)', !i || add ? num(r.total) : '?', 3);
    const width = w - 80,
      colors = [green, gold, peach];
    let cursor = x + 40;
    [r.read, r.write, r.ordinary].forEach((v, j) => {
      const bar = (width * v) / r.total;
      rect(c, cursor, 731, bar - 2, 21, (i ? add : subtract) ? colors[j] : '#dedccf');
      cursor += bar;
    });
  });
  foot(
    c,
    share
      ? 'Read fraction = ' +
          num(first.read) +
          ' / ' +
          num(first.total) +
          ' = ' +
          ((100 * first.read) / first.total).toFixed(1) +
          '% on both receipts.'
      : subtract
        ? 'Each token belongs to exactly one input bucket.'
        : 'Does the input field include read and write tokens, or list ordinary input alone?',
    share ? green : ink,
  );
}

export function pricing(c, k) {
  const partial = k.beat.beatIndex >= 1;
  base(
    c,
    k,
    partial
      ? 'Do the three reads pay back the write premiums?'
      : 'When does a full read pay back a write?',
    'ILLUSTRATIVE INPUT PRICES',
  );
  const repaired = cue(k, 2, 'Mark just the stable prefix', 0) > 0;
  const b = bill(partial ? (repaired ? 'mark' : 'tails') : 'full');
  const firstCharge = partial || cue(k, 0, 'A full six-thousand-token write', 0);
  const laterCharge = partial
    ? cue(k, 2, 'Each later row costs', 0)
    : cue(k, 0, 'One full read costs', 0);
  const result = partial
    ? cue(k, 2, 'Together they cost', 0)
    : cue(k, 0, 'Together that is', 0.5);
  const xs = [117, 737, 1070, 1370, 1750];
  small(c, 'Units per input token', 105, 288);
  mono(
    c,
    'Ordinary  ' +
      rates.ordinary.toFixed(2) +
      '       Write  ' +
      rates.write.toFixed(2) +
      '       Read  ' +
      rates.read.toFixed(2),
    495,
    288,
    37,
  );
  sheet(c, 85, 345, 1750, 440);
  ['Request', 'Read tokens', 'Written', 'Ordinary', 'Cost'].forEach((s, i) =>
    small(c, s, xs[i], 396, muted, i ? 'right' : 'left'),
  );
  line(
    c,
    [
      [110, 440],
      [1798, 440],
    ],
    rule,
    2,
  );
  [b.row[0], b.row[1]].forEach((r, i) => {
    const y = 504 + 118 * i;
    type(c, i ? (partial ? 'R2, R3, R4 each' : 'R2') : 'R1', xs[0], y, 44, ink, { face: 'Serif' });
    const cost = (i === 0 ? firstCharge : laterCharge) ? num(r.charge) : '?';
    [r.read, r.write, r.ordinary, cost].forEach(
      (v, j) => {
        mono(
          c,
          typeof v === 'number' ? num(v) : v,
          xs[j + 1],
          y,
          43,
          j === 0 ? green : ink,
          'right',
        );
      },
    );
  });
  line(
    c,
    [
      [110, 676],
      [1798, 676],
    ],
    rule,
    2,
  );
  small(c, 'All requests', xs[0], 728);
  small(c, 'Cold baseline  ' + num(b.baseline), xs[2], 728, muted, 'right');
  mono(
    c,
    result ? num(b.charge) + ' units' : '?',
    xs[4],
    728,
    45,
    result ? (b.charge > b.baseline ? red : green) : muted,
    'right',
  );
  foot(
    c,
    result
      ? repaired
        ? 'Yes. Marking only the prefix cuts the bill from ' +
          num(bill('tails').charge) +
          ' to ' +
          num(b.charge) +
          '.'
        : partial
          ? 'No. Each warm request writes its 4,976-token tail. The bill exceeds baseline.'
          : 'One full read earns back the 1,500-unit premium on the first write.'
      : partial
        ? 'Each later request reads 1,024 tokens. Follow the charges on its remaining tail.'
        : 'Compare one complete write and one complete read with two ordinary inputs.',
    result && b.charge > b.baseline ? red : ink,
  );
}

export function routing(c, k) {
  const compare = cue(k, 0, 'Now compare two workers', 0.4);
  base(
    c,
    k,
    compare
      ? 'Which worker delivers the first token sooner?'
      : 'Which worker already holds the guide?',
    compare ? 'QUEUE AND COMPUTATION' : 'WORKER LOCALITY',
  );
  const local = cue(k, 0, 'sending one guide to three workers', 1);
  const repeat = cue(k, 0, 'Sending it back', 0.6);
  if (!compare) {
    header(c, 'Three independent caches · sequential requests', 100, 304);
    const workers = ['A', 'B', 'C'];
    workers.forEach((id, i) => {
      const x = 108 + i * 588;
      rect(c, x, 393, 517, 252, '#344a4c', 13);
      for (let j = 0; j < 3; j++) rect(c, x + 28 + j * 28, 418, 15, 8, '#b0b6a4', 3);
      type(c, 'Worker ' + id, x + 40, 484, 49, cream, { face: 'Serif' });
      const ready = local >= (i + 1) / 3;
      rect(c, x + 35, 540, 447, 76, ready ? mint : '#4d6061', 7);
      type(c, ready ? 'Guide written' : 'Empty', x + 258, 578, 36, ready ? green : cream, {
        align: 'center',
      });
      if (i === 0 && repeat) small(c, 'R4 reads here', x + 42, 699, green);
    });
    foot(
      c,
      repeat
        ? 'A fourth request sent to A can find the guide A already wrote.'
        : 'Each empty worker must process the guide on its first request.',
      repeat ? green : ink,
    );
    return;
  }
  const loaded = cue(k, 1, 'Give the warm worker', 0.4) > 0;
  const choose = cue(k, 2, 'Cold arrives first', 0.6);
  const finish = cue(k, 2, 'Add eight hundred eighty', 0.55);
  const x0 = 284,
    scale = 0.64;
  header(c, 'Elapsed milliseconds · same prompt · no transfer', 102, 287);
  [
    ['Queue', gold],
    ['First-token computation', green],
    ['Remaining generation', '#8d9b9e'],
  ].forEach(([name, color], i) => {
    const x = [104, 487, 1125][i];
    rect(c, x, 337, 43, 29, color, 3);
    type(c, name, x + 57, 354, 31, ink);
  });
  const samples = [worker(true, loaded), worker(false, loaded)];
  samples.forEach((r, i) => {
    const y = 472 + i * 188;
    type(c, i ? 'Cold' : 'Warm', 96, y + 34, 49, ink, { face: 'Serif' });
    let start = x0;
    [[r.queue, gold], [r.compute, green], ...(finish ? [[r.decode, '#8d9b9e']] : [])].forEach(
      ([v, color]) => {
        rect(c, start, y, v * scale, 68, color, 3);
        if (v * scale > 90)
          mono(
            c,
            num(v),
            start + (v * scale) / 2,
            y + 34,
            32,
            color === green ? cream : ink,
            'center',
          );
        start += v * scale;
      },
    );
    if (r.queue * scale <= 90) small(c, r.queue + ' ms queue', x0, y - 27);
    const xpos = x0 + r.first * scale;
    line(
      c,
      [
        [xpos, y - 10],
        [xpos, y + 87],
      ],
      ink,
      4,
    );
    const showTime = choose || !loaded || i === 1;
    type(
      c,
      showTime ? 'First  ' + num(r.first) + ' ms' : 'First token',
      xpos,
      y + 116,
      31,
      i && choose ? green : ink,
      { align: 'center' },
    );
    if (finish) small(c, 'Done  ' + num(r.end) + ' ms', start, y - 28, ink, 'right');
  });
  const [warm, cold] = samples;
  foot(
    c,
    choose
      ? 'Cold delivers the first token ' +
          num(warm.first - cold.first) +
          ' ms sooner. Both routes still generate the answer.'
      : loaded
        ? 'Measure from arrival, including the queue.'
        : 'A compatible entry saves computation on the warm worker.',
    choose ? green : ink,
  );
}

export function diagnosis(c, k) {
  base(c, k, 'What would you change first in each replay?', 'CONTROLLED REPLAY');
  const a = cue(k, 0, 'It still says ninety', 0.55);
  const b = cue(k, 0, 'rendered text says thirty', 0.5);
  const repair = cue(k, 1, 'Repair the renderer', 0.45);
  const bypass = cue(k, 1, 'Bypass the separate answer cache', 0.6);
  const fields = ['Repository', 'Rendered guide', 'Observed answer'];
  const xs = [337, 849, 1363],
    w = 416;
  fields.forEach((s, i) => header(c, s, xs[i], 305));
  for (const [i, id] of ['A', 'B'].entries()) {
    const y = 388 + i * 200;
    type(c, 'Trace ' + id, 90, y + 45, 45, ink, { face: 'Serif' });
    line(
      c,
      [
        [xs[0], y + 47],
        [xs[2] + w, y + 47],
      ],
      rule,
      4,
    );
    const has = i ? b : a;
    const trace = policyTrace(id, i ? Boolean(bypass) : Boolean(repair));
    const vals = [
      trace.repository + ' days',
      has ? trace.rendered + ' days' : '?',
      trace.previousAnswer + ' days',
    ];
    vals.forEach((v, j) => {
      sheet(c, xs[j], y, w, 98, v === '90 days' ? peach : v === '?' ? cream : mint);
      type(c, v, xs[j] + w / 2, y + 49, 50, ink, { face: 'Serif', align: 'center' });
    });
    if (i && b)
      small(c, 'Verified cold run · ' + trace.prefixReads + ' prefix reads', xs[1], y + 132, green);
    if (!i && repair) small(c, 'Was 90 days · renderer repaired', xs[1], y + 132, green);
    if (repair) small(c, 'Earlier observation', xs[2], y - 28, muted);
    if (trace.bypassAnswerCache) {
      const px = xs[2] + 16;
      line(
        c,
        [
          [xs[1] + w, y + 50],
          [xs[1] + w + 37, y + 50],
          [xs[1] + w + 37, y + 151],
          [px, y + 151],
        ],
        green,
        5,
      );
      rect(c, px, y + 119, 396, 64, green, 5);
      type(c, 'Inspect fresh generation', px + 198, y + 151, 31, cream, { align: 'center' });
    }
  }
  foot(
    c,
    bypass
      ? 'B: bypass stored answers and inspect fresh generation with the same guide and model.'
      : repair
        ? 'A: replay with the current policy in the rendered guide.'
        : 'Compare the captured input with the source before changing any cache setting.',
    bypass ? green : ink,
  );
}

const [firstTrial, secondTrial] = [4176, 4177].map(admission);

export function budget(c, k) {
  base(c, k, 'Does the remaining prefill fit?', 'FRESH INPUT ALLOWANCE');
  const beat = k.beat.beatIndex;
  const after = (index, phrase, captionStart = phrase) => {
    if (beat !== index) return beat > index;
    const { start, end } = k.wordCue(phrase);
    return k.reveal(phrase, end - start, { captionStart }) === 1;
  };
  const slide =
    beat === 2
      ? k.reveal('one position later', 0.65, { captionStart: false })
      : Number(beat > 2);
  const replay = slide > 0;
  const trial = replay ? secondTrial : firstTrial;
  const firstEdit = after(0, 'four thousand one hundred seventy-six', false);
  const secondEdit = after(2, 'four thousand one hundred seventy-seven', false);
  const reused = replay
    ? after(3, 'Four thousand one hundred seventy-six positions are reusable')
    : after(
        1,
        'Round down to two hundred sixty full blocks, or four thousand one hundred sixty reusable tokens',
      );
  const wholeBlock = replay ? after(3, 'One more whole block survives') : reused;
  const matching = replay
    ? wholeBlock
    : after(1, 'The first four thousand one hundred seventy-five positions match');
  const operands = replay
    ? after(3, 'Six hundred twenty-four guide tokens plus sixty-four question tokens need fresh work')
    : after(1, 'That leaves six hundred forty guide tokens plus the sixty-four-token question');
  const over = after(1, 'Seven hundred four exceeds the allowance');
  const fits = after(3, 'Six hundred eighty-eight fits under seven hundred');
  const verdict = replay ? fits : over;

  const pitch = 47;
  const first = firstTrial.reused - 7;
  const last = secondTrial.reused + 8;
  const x = (position) => 208 + (position - first) * pitch;
  const blockStart = x(firstTrial.reused + 1);
  const blockEnd = x(secondTrial.reused + 1);
  header(
    c,
    num(trial.guide) + ' guide tokens  +  ' + num(trial.tail) + ' question tokens   ·   compatible, completed entry',
    104,
    280,
  );
  small(c, 'Guide positions near the edit', 104, 335);
  mono(
    c,
    num(firstTrial.reused + 1) + ' to ' + num(secondTrial.reused) + ' · one 16-token block',
    (blockStart + blockEnd) / 2,
    335,
    32,
    ink,
    'center',
  );
  const reuseThrough = wholeBlock ? trial.reused : replay ? firstTrial.reused : 0;
  for (let position = first; position <= last; position++) {
    const color = position <= reuseThrough ? mint : wholeBlock ? peach : '#e3dfd2';
    rect(c, x(position), 400, pitch - 2, 68, color, 2);
  }
  for (const edge of [blockStart, blockEnd]) {
    line(c, [[edge - 1, 387], [edge - 1, 475]], ink, 4);
  }
  if (firstEdit) {
    const pointer = mix(x(firstTrial.match + 1), x(secondTrial.match + 1), slide) + (pitch - 2) / 2;
    line(c, [[pointer, 383], [pointer, 414]], red, 5);
    circle(c, pointer, 380, 10, red);
    if (!replay || secondEdit) small(c, 'First edit at ' + num(trial.match + 1), 104, 514, red);
  }
  if (matching) {
    line(c, [[x(first), 485], [x(trial.match + 1) - 4, 485]], green, 4);
    if (!replay || reused)
      small(c, num(trial.match) + ' matching positions from the start', 1810, 514, green, 'right');
  }
  if (reused)
    type(c, num(trial.blocks) + ' × 16 = ' + num(trial.reused) + ' reused', 104, 580, 46, green, { face: 'Serif' });
  if (operands) {
    const fresh = num(trial.suffix) + ' guide + ' + num(trial.tail) + ' question';
    type(c, verdict ? fresh + ' = ' + num(trial.fresh) + ' fresh' : fresh, 1810, 580, 46, red, {
      face: 'Serif',
      align: 'right',
    });
  }

  const low = trial.limit - 20;
  const high = trial.limit + 20;
  const px = (tokens) => mix(490, 1750, (tokens - low) / (high - low));
  const limitX = px(trial.limit);
  header(c, 'Fresh input tokens near the allowance', 104, 648);
  type(c, 'Allowance ' + num(trial.limit), limitX, 648, 36, ink, { align: 'center', weight: 600 });
  [[firstTrial, over], [secondTrial, fits]].forEach(([run, known], i) => {
    if (i && !replay) return;
    const y = 696 + i * 60;
    small(c, 'Trial ' + (i + 1), 104, y, muted);
    line(c, [[px(low), y], [px(high), y]], rule, 2);
    if (!known) return;
    const end = px(run.fresh);
    const tone = run.fits ? green : red;
    line(c, [[limitX, y], [end, y]], tone, 5);
    circle(c, end, y, 10, tone);
    mono(c, num(run.fresh), end + (run.fits ? -22 : 22), y - 19, 35, tone, run.fits ? 'right' : 'left');
  });
  line(c, [[limitX, 674], [limitX, 785]], ink, 4);
  line(c, [[px(low), 785], [px(high), 785]], rule, 2);
  for (const tokens of [low, high]) mono(c, num(tokens), px(tokens), 805, 30, muted, 'center');
  foot(
    c,
    verdict
      ? trial.fits
        ? 'Grant the request with ' + num(trial.limit - trial.fresh) + ' fresh positions to spare.'
        : 'Defer the request. The remaining prefill exceeds the allowance.'
      : replay
        ? 'One position later. The question and allowance stay fixed.'
        : 'Find the last full matching block, then count the input after it.',
    verdict ? (trial.fits ? green : red) : ink,
  );
}
