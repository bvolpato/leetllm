import {
  C,
  label,
  mid,
  mono,
  box,
  line,
  dot,
  crescent,
  tag,
  note,
  rows,
  cells,
  step,
  on,
  mix,
  panel,
  trace,
} from './paint.mjs';
import {
  requests,
  schedule,
  raw,
  vocab,
  allowed,
  masked,
  jsonPrefix,
  quoted,
  category,
  draft,
  target,
  agreement,
  committed,
  ordinary,
  cycleTimes,
  cost,
} from './examples.mjs';

function overlap(c, k) {
  const p = step(k, 1, 'Slide B’s planning', 1.25),
    g = step(k, 1, 'Slide B’s GPU work', 1.0);
  const { gpuA, planB, gpuB } = schedule(p, g);
  const x = (t) => 151 + t * 74;
  for (let i = 0; i <= 10; i++) {
    line(c, x(i), 173, x(i), 367, C.line, 1, [2, 5]);
    mid(c, i, x(i), 395, 18, C.soft);
  }
  const slab = (y, [start, end], name, fill) => {
    box(c, x(start) + 1, y, (end - start) * 74 - 2, 50, fill, null, 3);
    mid(c, name, (x(start) + x(end)) / 2, y + 33, 21, C.ink, (end - start) * 74 - 6);
  };
  label(c, 'GPU', 40, 232, 23);
  label(c, 'Host plan', 40, 327, 23);
  slab(199, gpuA, 'Batch A', C.sky);
  slab(199, gpuB, 'Batch B', C.mint);
  slab(294, [0, 1], 'A', C.sky);
  slab(294, planB, 'B', C.mint);
  mid(c, 'schedule units', 520, 426, 17, C.soft);
  note(
    c,
    g === 1
      ? 'Both GPU intervals still span four units. The last one ends at 9.'
      : k.beat.beatIndex === 0
        ? 'Each batch needs one host unit and four GPU units.'
        : 'The host can prepare a batch while the GPU executes another.',
  );
}
function metadata(c, k) {
  const late = on(k, 2, 'runner now needs'),
    fixed = on(k, 2, 'and the KV mapping');
  const expected = late ? 3 : 2,
    observed = fixed ? 3 : 2;
  panel(c, 40, 152, 459, 262, 'Batch B  /  host record');
  rows(
    c,
    [
      ['Request', requests[0].id, C.blue],
      ['Input positions', '4, 5'],
      ['KV locations', '12, 13'],
      ['Grammar revision', String(observed)],
    ],
    61,
    206,
    420,
    { height: 45 },
  );
  panel(c, 534, 152, 386, 262, 'First consumer  /  GPU launch', C.blue);
  label(c, 'Expected grammar revision', 555, 227, 19, C.soft);
  label(c, String(expected), 554, 303, 62, C.blue, { face: 'Serif' });
  tag(
    c,
    observed === expected ? 'Ready to launch' : 'Hold launch',
    555,
    344,
    255,
    observed === expected ? C.mint : C.peach,
  );
  note(
    c,
    observed === expected
      ? 'The batch record and this consumer describe the same step.'
      : 'The batch still carries the earlier grammar revision.',
  );
}
function bars(c, labels, values, x, y, w, show = true) {
  labels.forEach((t, i) => {
    const top = y + i * 43;
    mono(c, t, x, top + 16, 16, C.ink, 125);
    box(c, x + 132, top + 2, w - 198, 13, C.pale, null, 2);
    if (show && values[i] > 0)
      box(c, x + 132, top + 2, (w - 198) * values[i], 13, i === 0 ? C.sea : C.blue, null, 2);
    mono(c, show ? values[i].toFixed(3) : '?', x + w - 56, top + 16, 15, C.soft);
  });
}
function grammar(c, k) {
  const mask = on(k, 0, 'Mask the number'),
    normalized = on(k, 1, 'Divide each'),
    picked = on(k, 1, 'The cursor moves'),
    closed = on(k, 3, 'The client can now'),
    compare = on(k, 4, 'The object passes');
  const cursor = jsonPrefix + (picked ? quoted : '') + (closed ? '}' : '');
  panel(c, 40, 143, 407, 270, 'R42  /  endpoint reply', C.blue);
  mono(c, cursor + '▏', 59, 235, 25, C.ink, 366);
  if (picked && !closed) {
    const p = step(k, 1, 'The cursor moves', 1.15);
    c.font = '400 25px "Lesson Mono"';
    const start = 59 + c.measureText(jsonPrefix).width,
      width = c.measureText(quoted).width;
    line(c, start, 245, start + width * p, 245, C.sea, 3);
  }
  line(c, 59, 269, 427, 269);
  crescent(c, 72, 300, 12);
  label(c, 'Original request', 97, 306, 18, C.blue);
  label(c, requests[0].user, 59, 354, 24, C.ink, { face: 'Serif', w: 365 });
  const result = masked(raw, allowed);
  const probabilities = picked
    ? masked([0.6, 0.2, 0.1, 0.1], [true, false, false, false]).dist
    : normalized
      ? result.dist
      : raw.map((v, i) => (mask && !allowed[i] ? 0 : v));
  panel(
    c,
    475,
    143,
    445,
    270,
    closed
      ? 'Completed object'
      : picked
        ? 'Which continuation is legal?'
        : normalized
          ? 'Sampling probability'
          : mask
            ? 'Legal weights'
            : 'Model probability',
    C.plum,
  );
  if (!closed) {
    bars(
      c,
      picked ? ['}', ',', '42', '"bug"'] : vocab,
      probabilities,
      492,
      208,
      411,
      !picked || on(k, 2, 'It has all'),
    );
    if (mask && !picked)
      label(
        c,
        normalized ? 'Normalized over legal mass 0.95' : '42 removed from the legal set',
        494,
        392,
        17,
        C.soft,
      );
  } else {
    rows(
      c,
      [
        ['JSON', 'parse succeeds'],
        ['Schema', 'category allowed'],
        ['Ticket', compare ? 'expected feature' : 'compare with request'],
      ],
      494,
      208,
      408,
      { height: 51, labels: 0.28 },
    );
  }
  note(
    c,
    compare
      ? 'The schema accepts “bug”. The dark-mode ticket calls for “feature”.'
      : closed
        ? 'The object is complete. Does its category describe the ticket?'
        : picked
          ? 'The selected value includes both quotes. The cursor is outside the string.'
          : 'Each request carries its own grammar state.',
  );
}
function constraint(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    panel(c, 40, 152, 422, 243, 'Server request');
    ['JSON schema', 'Regular expression', 'EBNF'].forEach((t, i) =>
      tag(c, t, 62, 212 + i * 51, 375, i ? C.paper : C.mint),
    );
    panel(c, 486, 152, 434, 243, 'Pinned frontend  /  gen', C.plum);
    rows(
      c,
      [
        ['regex', 'available'],
        ['json_schema', 'available'],
        ['ebnf', 'server entry required'],
      ],
      506,
      211,
      393,
      { height: 49 },
    );
    note(
      c,
      b
        ? 'Documented backends include XGrammar, Outlines and llguidance.'
        : 'Choose one server constraint for this request.',
    );
  } else if (b < 4) {
    const empty = on(k, 2, 'If no legal continuation');
    const dist = masked(raw, empty ? [] : allowed);
    panel(c, 40, 147, 485, 263, 'Raw model probabilities');
    bars(c, vocab, raw, 61, 208, 438);
    panel(c, 547, 147, 373, 263, 'Grammar mask', C.plum);
    rows(
      c,
      [
        ['Legal mass', dist.mass.toFixed(2)],
        ['P(bug)', dist.dist ? dist.dist[0].toFixed(3) : 'undefined'],
        ['Sampler', dist.dist ? 'can sample' : 'stop · no legal ID'],
      ],
      566,
      211,
      333,
      { height: 51, labels: 0.36 },
    );
    note(
      c,
      empty
        ? 'A zero legal mass has no normalized distribution.'
        : 'Sum the legal weights, then divide each legal weight by their sum.',
    );
  } else {
    panel(c, 40, 156, 880, 241, 'New reply  /  token limit');
    mono(c, jsonPrefix + '▏', 66, 264, 46, C.ink);
    tag(c, 'finish reason: length', 66, 311, 267, C.peach);
    tag(c, 'schema: incomplete object', 365, 311, 351, C.peach);
    note(c, 'Validate the complete reply against the original schema before acting.');
  }
}
function forced(c, k) {
  const compressed = step(k, 0, 'one forced string path', 0.85),
    tokenized = on(k, 1, 'together with the forced string');
  if (k.beat.beatIndex === 0) {
    label(c, 'Single continuation at each character', 40, 167, 20, C.soft);
    const chars = [...jsonPrefix],
      w = 586 / chars.length;
    chars.forEach((v, i) => {
      const x = 40 + i * w;
      box(
        c,
        x,
        198,
        w - 3 * (1 - compressed),
        69,
        compressed === 1 ? C.sky : C.paper,
        compressed === 1 ? null : C.line,
        1,
      );
      mid(c, v, x + w / 2, 242, 22);
    });
    line(c, 626, 231, 667, 231, C.sea, 2);
    ['"bug"', '"feature"', '"question"'].forEach((v, i) => {
      line(c, 667, 231, 709, 160 + 71 * i + 18, C.sea, 2);
      tag(c, v, 709, 160 + 71 * i, 205, C.mint);
    });
    label(c, 'Constant syntax', 40, 343, 30, C.ink, { face: 'Serif' });
    note(c, 'A forced string can cross several character transitions. The value still branches.');
  } else {
    panel(c, 40, 157, 880, 254, 'Toy longest-match tokenizer  /  vocabulary {a, b, ab}');
    label(c, 'Prior text', 64, 238, 20, C.soft);
    label(c, 'Forced text', 351, 238, 20, C.soft);
    tag(c, 'a', 64, 264, 215, C.sky);
    tag(c, 'b', 351, 264, 215, C.mint);
    if (tokenized) {
      line(c, 571, 282, 648, 282, C.ink, 2);
      tag(c, 'ab', 662, 264, 221, C.lilac);
    }
    label(
      c,
      tokenized
        ? 'Retokenize the joined text “ab” as one token.'
        : 'Compute token IDs at the joined string boundary.',
      65,
      369,
      24,
      C.ink,
    );
    note(c, 'The paper describes this compression and possible probability distortion at choices.');
  }
}
function speculation(c, k) {
  const beat = k.beat.beatIndex;
  const after = (index, phrase) => {
    if (beat !== index) return beat > index;
    // Start the caption with the spoken clause, then wait for the whole clause to draw its result.
    k.reveal(phrase, 0, { captionStart: phrase });
    return k.elapsed >= k.wordCue(phrase).end;
  };

  const read = step(k, 1, 'Read the target', 1.8);
  const mismatch = after(1, 'The target says lake');
  const commit = after(2, 'Commit the five matching words and lake');
  const retained = after(2, 'The verified inputs provide five ready KV entries');
  const pending = after(2, 'Lake still needs its own forward');
  const discard = after(2, 'Discard sea, at and dawn');
  const feed = step(k, 3, 'Feed lake into the target', 0.75);
  const ready = after(3, 'Its forward finishes, and the sixth KV entry now belongs to lake');

  const replacement = committed[agreement];
  const position = agreement + 1;
  const seen = mismatch ? position : Math.floor(read * agreement);
  const readyCount = (retained ? agreement : 0) + Number(ready);
  const left = 163;
  const width = 757;
  const gap = 4;
  const height = 42;
  const cellWidth = (width - (draft.length - 1) * gap) / draft.length;
  const center = (i) => left + i * (cellWidth + gap) + cellWidth / 2;
  const outputY = 278;
  const kvY = 389;
  const paintRow = (name, y, value, color) => {
    label(c, name, 40, y + 28, 21, C.soft);
    cells(c, draft.map(value), left, y, width, height, draft.map(color), gap);
  };

  draft.forEach((_, i) => mid(c, i + 1, center(i), 142, 19, C.soft));
  paintRow(
    'Draft',
    151,
    (word) => word,
    (_, i) => (discard && i >= agreement ? C.peach : mismatch && i === agreement ? C.lilac : C.paper),
  );
  paintRow(
    'Target',
    213,
    (_, i) => (i < seen ? target[i] : ''),
    (_, i) => (i >= seen ? C.paper : i === agreement ? C.lilac : C.mint),
  );
  paintRow(
    'Output',
    outputY,
    (_, i) => (commit ? committed[i] ?? '' : ''),
    (_, i) => (!commit || i > agreement ? C.paper : i === agreement ? C.lilac : C.mint),
  );
  paintRow(
    'Target KV',
    kvY,
    (_, i) => {
      if (i < readyCount) return 'ready';
      if (pending && i === agreement) return 'pending';
      return commit && i < committed.length ? '?' : '';
    },
    (_, i) => (i < readyCount ? C.sky : C.paper),
  );

  if (feed > 0 && !ready) {
    const x = center(agreement);
    line(c, x, outputY + height, x, kvY, C.plum, 2);
    tag(c, replacement, x - 34, mix(outputY + height + 5, kvY - 32, feed), 68, C.lilac, C.plum, 27);
    label(c, 'Target forward', x + 53, 361, 21, C.plum);
  }
  let footer = 'Compare the draft and target from the left. Where do they first disagree?';
  if (mismatch) footer = 'Which word should reach the client? Will its KV be ready?';
  if (commit) footer = committed.length + ' words are committed to output.';
  if (retained) footer = 'The verified prefix keeps its target KV.';
  if (pending) footer = 'The client can receive “' + replacement + '” before its KV exists.';
  if (discard) footer = 'Discard the draft from the first mismatch onward.';
  if (feed > 0) footer = 'Feed the replacement back through the target.';
  if (ready) footer = 'Position ' + position + ' now holds target KV for “' + replacement + '”.';
  note(c, footer);
}
function economics(c, k) {
  const b = k.beat.beatIndex,
    setup = b >= 1,
    fast = on(k, 2, 'two point one seven'),
    zero = on(k, 2, 'zero drafts are accepted'),
    slow = on(k, 3, 'thirteen milliseconds per emitted token');
  const run = (accepted, y, reveal, active) => {
    const s = cost(accepted);
    panel(
      c,
      40,
      y,
      879,
      91,
      accepted + ' accepted drafts  +  1 replacement',
      active ? C.sea : C.soft,
    );
    label(c, 'Verify  ' + cycleTimes[1] + ' ms', 62, y + 68, 20, C.blue);
    label(c, s.emitted + ' emitted', 292, y + 68, 20);
    label(
      c,
      reveal
        ? s.elapsed +
            ' / ' +
            s.emitted +
            (Number.isInteger(s.per) ? ' = ' : ' ≈ ') +
            Number(s.per.toFixed(2)) +
            ' ms/token'
        : 'Elapsed per token  ?',
      527,
      y + 68,
      22,
      reveal ? C.sea : C.soft,
    );
  };
  label(
    c,
    setup
      ? 'Draft 3 ms     +     Verify 9 ms     +     Commit 1 ms'
      : 'Proposal  →  target verification  →  commit',
    40,
    162,
    23,
    C.ink,
  );
  line(c, 40, 183, 920, 183);
  if (setup) {
    run(agreement, 200, fast, !zero);
    if (zero) run(0, 307, slow, true);
  } else {
    cells(c, ['draft model', 'features', 'trained head', 'n-gram'], 40, 218, 879, 65, [
      C.sky,
      C.sky,
      C.sky,
      C.sky,
    ]);
    label(c, 'Compare target choices under the configured verification rule.', 40, 353, 23, C.soft);
  }
  note(
    c,
    setup
      ? 'Ordinary target  /  1 emitted token every ' + ordinary + ' ms  ·  illustrative times'
      : 'Keep accepted tokens, grammar progress and KV ownership in the same order.',
  );
}
function methods(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    panel(c, 40, 157, 437, 245, 'Built into the pinned enum');
    rows(
      c,
      [
        ['Model drafts', 'EAGLE / EAGLE3'],
        ['Other entries', 'STANDALONE / NGRAM'],
        ['Draft family', 'DFlash'],
      ],
      61,
      217,
      394,
      { height: 48, labels: 0.34 },
    );
    panel(c, 498, 157, 422, 245, 'Release guide  /  separate evidence', C.plum);
    label(c, b ? 'UNO' : 'Look up the installed method', 521, 254, b ? 39 : 23, C.ink, {
      face: 'Serif',
      w: 375,
    });
    label(
      c,
      b ? 'LoRA draft → base-weight verify' : 'Plugin registration is a separate path.',
      520,
      339,
      21,
      C.soft,
      { w: 375 },
    );
  } else if (b >= 4) {
    panel(c, 40, 149, 880, 263, 'Service requirement  /  grammar-constrained output');
    rows(
      c,
      [
        ['Proposed mode', 'UNO with grammar on'],
        ['Guide contract', 'UNO excludes grammar decoding'],
        ['Decision', 'Choose a supported grammar + speculation pair'],
      ],
      61,
      209,
      832,
      { height: 57, labels: 0.32 },
    );
  } else {
    panel(c, 40, 149, 880, 263, 'Compatibility in the guide used by the lesson');
    rows(
      c,
      [
        ['UNO', 'CUDA, FA3, TP = PP = 1, grammar off'],
        ['N-gram', 'overlap off, mixed chunking off'],
        [
          'EAGLE / standalone V2',
          b >= 3 ? 'overlap requires top-k = 1' : 'check overlap tree width',
        ],
      ],
      61,
      209,
      833,
      { height: 57, labels: 0.36 },
    );
  }
  note(
    c,
    b < 4
      ? 'Check the installed version before selecting the mode.'
      : 'Compare a supported mode with its disabled baseline on the same requests.',
  );
}
function parallel(c, k) {
  const b = k.beat.beatIndex;
  const partitions = [
    ['Tensor parallel', 'Weight shard 0', 'Weight shard 1', 'per-layer collective'],
    ['Pipeline parallel', 'Layers 0–15', 'Layers 16–31', 'activation handoff'],
    ['Data parallel', 'R42 · model copy', 'R43 · model copy', 'separate request groups'],
    ['Expert parallel', 'Selected expert A', 'Selected expert B', 'token routing'],
    ['DP attention', 'R42 · attention 0', 'R43 · attention 1', 'shared sharded layers'],
    ['Context split', 'Position range 0', 'Position range 1', 'exchange attention state'],
  ];
  const i =
    b > 0
      ? b === 1 && !on(k, 1, 'In data-parallel attention')
        ? 5
        : 4
      : on(k, 0, 'Expert parallelism')
        ? 3
        : on(k, 0, 'Data parallelism')
          ? 2
          : on(k, 0, 'Pipeline parallelism')
            ? 1
            : 0;
  const [name, left, right, link] = partitions[i];
  label(c, name, 40, 170, 26, C.ink, { face: 'Serif' });
  for (const [n, t] of [left, right].entries()) {
    const x = 80 + n * 459;
    box(c, x, 221, 335, 116, n ? (i === 2 || i === 4 ? C.peach : C.lilac) : C.sky, C.line);
    for (let j = 0; j < 9; j++) {
      line(c, x + 23 + j * 36, 213, x + 23 + j * 36, 221, C.soft, 2);
      line(c, x + 23 + j * 36, 337, x + 23 + j * 36, 345, C.soft, 2);
    }
    mid(c, t, x + 167, 289, 24, C.ink, 305);
  }
  if (i === 4) {
    line(c, 248, 345, 388, 382, C.blue, 2);
    line(c, 707, 345, 571, 382, C.plum, 2);
  } else if (i !== 2) line(c, 416, 279, 538, 279, C.blue, 3, [5, 4]);
  mid(c, link, 480, 400, 24, C.sea);
  note(
    c,
    i === 5
      ? 'Position ranges and their attention state must agree with the selected layout.'
      : b
        ? 'DP attention can split request groups while other model layers remain sharded.'
        : 'Choose the split by the work and data that must cross the device boundary.',
  );
}
export const executionScenes = [
  overlap,
  metadata,
  grammar,
  constraint,
  forced,
  speculation,
  economics,
  methods,
  parallel,
];
