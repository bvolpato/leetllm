import {
  C,
  fmt,
  text,
  mono,
  fill,
  line,
  dot,
  path,
  strip,
  pointer,
  ticks,
  bracket,
  screw,
  words,
  heading,
  cue,
  afterCue,
} from './recorder.mjs';
import { job, update, examples, windowState, copyDemo, packet } from './run.mjs';

function readerHead(g, x, y, width, data, engaged) {
  strip(g, x, y, width, 150, C.sheet, C.pale);
  const track = x + 32,
    span = 181;
  ticks(g, track, y + 88, span, 8, 13, C.dim);
  mono(g, '0', track, y + 133, 21, C.dim);
  mono(g, fmt(job.saved), track + span, y + 133, 21, C.dim, 'right');
  if (engaged) {
    text(g, data.sample, x + 255, y + 84, 43, C.ink, 'left', 'Serif');
    mono(g, 'consumed  ' + fmt(data.consumed), x + 256, y + 126, 28, C.dim);
    const pos = track + (span * data.consumed) / job.saved;
    pointer(g, pos, y + 84, C.red);
  } else text(g, 'Loading saved weights…', x + 255, y + 90, 36, C.dim);
}
export function opening(g, k) {
  const b = k.beat.beatIndex;
  mono(g, 'policy-sft-v4   /   committed updates', 98, 102, 30, C.teal);
  const landed = cue(k, 0, 'stops', 0.8),
    fork = cue(k, 0, 'Both replacement workers', 0.65);
  g.save();
  // Start close on the recorder. Pull back only when the two readers enter.
  const pullback = Math.min(1, fork / 0.6);
  const zoom = 1 + 0.82 * (1 - pullback);
  g.translate(94 * (1 - zoom) + 220 * (1 - pullback), 345 * (1 - zoom) + 85 * (1 - pullback));
  g.scale(zoom, zoom);
  fill(g, 67, 237, 704, 366, C.dark);
  fill(g, 78, 247, 682, 345, '#31515a');
  for (const sx of [91, 747]) for (const sy of [261, 576]) screw(g, sx, sy);
  strip(g, 103, 286, 630, 270, C.sheet, '#b9c3b8');
  const edge = 556 + landed * 130;
  g.save();
  g.beginPath();
  g.rect(94, 280, edge - 94, 289);
  g.clip();
  for (let i = 0; i < 4; i++) {
    const x = 156 + i * 143;
    path(
      g,
      [
        [x - 17, 466],
        [x, 466],
        [x + 12, 387],
        [x + 26, 472],
        [x + 45, 466],
        [x + 101, 466],
      ],
      C.teal,
      false,
      5,
    );
  }
  g.restore();
  for (let i = 0; i < 4; i++) {
    const x = 176 + i * 143;
    if (edge >= x + 22) mono(g, fmt(update - 3 + i), x, 518, 26, C.dim, 'center');
  }
  line(g, edge, 311, edge, 481, C.red, 4);
  pointer(g, edge, 320);
  g.restore();
  text(
    g,
    landed === 1 ? 'Update ' + fmt(update) : 'Recording the training run',
    95 + 220 * (1 - pullback),
    696 + 283 * (1 - pullback),
    72,
    C.ink,
    'left',
    'Serif',
  );
  text(
    g,
    landed === 1 ? 'Published checkpoint' : 'One pulse per completed update',
    100 + 220 * (1 - pullback),
    754 + 283 * (1 - pullback),
    34,
    C.dim,
  );
  if (fork > 0.6) {
    g.save();
    g.globalAlpha = (fork - 0.6) / 0.4;
    path(
      g,
      [
        [744, 424],
        [807, 424],
        [855, 306],
        [930, 306],
      ],
      C.teal,
    );
    path(
      g,
      [
        [744, 424],
        [807, 424],
        [855, 665],
        [930, 665],
      ],
      C.teal,
    );
    const first = cue(k, 1, 'first example'),
      second = cue(k, 1, 'other head lands');
    [first, second].forEach((ready, i) => {
      const y = 238 + 350 * i,
        winning = i === 1 && b >= 2;
      text(
        g,
        'Reader ' + (i === 0 ? 'A' : 'B'),
        946,
        y - 27,
        40,
        winning ? C.teal : C.ink,
        'left',
        'Sans',
        600,
      );
      readerHead(g, 926, y, 896, examples[i], ready);
      if ((i === 0 && cue(k, 1, 'learning rate starts warmup')) || (i === 1 && b >= 2))
        text(
          g,
          i === 0 ? 'Warmup starts over' : 'Saved schedule phase',
          948,
          y + 210,
          35,
          i === 0 ? C.red : C.teal,
        );
      if (winning) mono(g, 'CONTINUE', 1804, y - 29, 30, C.teal, 'right');
    });
    g.restore();
  }
  if (b >= 1) {
    text(g, 'First example in this order', 100, 824, 28, C.dim);
    text(g, examples[0].sample, 99, 875, 39, C.ink, 'left', 'Serif');
  }
  if (b === 1) text(g, 'Which reader continues this run?', 96, 958, 49, C.ink, 'left', 'Serif');
  if (b === 3)
    text(
      g,
      'Same boundary for weights, moments, schedule, sampler, RNG and scaler.',
      98,
      956,
      38,
      C.dim,
    );
}

const letters = 'ABCDEFGH'.split('');
export function accumulation(g, k) {
  const b = k.beat.beatIndex,
    loss = cue(k, 0, 'lose power'),
    asked = cue(k, 1, 'When the weights come back'),
    answered = afterCue(k, 2, 'Start at A'),
    skipped = afterCue(k, 2, 'Starting at F would silently skip forty examples'),
    rebuild = afterCue(k, 2, 'Replay A through E', 1.2);
  const pendingRounds = job.pending / job.perRound;
  const readDuration = b === 0
    ? k.wordCue('and then lose power').start - k.wordCue('workers read A through E').start
    : 0;
  const read = Math.floor(pendingRounds * cue(k, 0, 'workers read A through E', readDuration));
  const replayed = Math.floor(pendingRounds * rebuild);
  const inMemory = loss ? replayed : read;
  const title = answered
    ? 'Replay from the saved position'
    : loss
      ? 'Power lost during the next window'
      : 'Build the next gradient window';
  heading(
    g,
    'ACCUMULATION   /   ' + job.perRound + ' examples per round',
    title,
  );
  text(g, 'Published checkpoint', 125, 316, 39, C.dim);
  mono(g, fmt(update), 125, 406, 82, C.teal);
  mono(g, fmt(job.saved) + ' consumed', 126, 461, 36, C.teal);
  text(g, 'Gradient rounds in worker memory', 790, 316, 39, C.dim);
  mono(g, inMemory + ' / ' + letters.length, 790, 406, 74, C.ink);

  const left = 127, pitch = 211, tileWidth = 183;
  strip(g, 100, 529, 1716, 170);
  letters.forEach((v, i) => {
    const x = left + i * pitch;
    fill(g, x, 559, tileWidth, 110, i < read ? C.sky : C.sheet);
    mono(g, v, x + tileWidth / 2, 635, 61, i < read ? C.blue : C.dim, 'center');
    fill(g, x, 736, tileWidth, 29, i < inMemory ? C.teal : C.pale);
  });
  text(g, 'Example rounds', 1775, 513, 34, C.dim, 'right');
  text(g, 'Gradients in memory', left, 817, 36, C.dim);

  const center = (i) => left + i * pitch + tileWidth / 2;
  if (asked && !answered) {
    for (const i of [0, pendingRounds]) pointer(g, center(i), 553);
    text(g, 'Read from A or F?', left, 884, 46, C.ink, 'left', 'Serif');
  } else if (answered) {
    pointer(g, center(0), 553, C.teal);
    if (skipped && !rebuild)
      bracket(
        g,
        left,
        827,
        (pendingRounds - 1) * pitch + tileWidth,
        fmt(job.pending) + ' examples skipped if you start at F',
        C.red,
        false,
        37,
      );
    else {
      text(g, 'Restart at A', left, 884, 46, C.teal, 'left', 'Serif');
      if (replayed)
        text(g, fmt(replayed * job.perRound) + ' examples replayed', 1775, 884, 39, C.ink, 'right');
    }
  } else if (loss) {
    text(g, 'A through E were read. Their gradients are gone.', left, 884, 42, C.dim);
  }
}

function firstRound(g, k) {
  const pairs = 4;
  const showOtherPairs = cue(k, 0, 'Each of the other three pairs');
  const fillRound = cue(k, 0, 'Fill one round', 1.1);
  const showCount = cue(k, 0, 'Each pair is one independent replica');
  heading(g, 'DATA PARALLELISM   /   one dot per sequence', 'How many sequences in round A?');
  mono(g, 'Round A', 397, 303, 39, C.dim, 'center');
  text(g, 'GPUs sharing these sequences', 672, 303, 43, C.ink);
  for (let i = 0; i < (showOtherPairs ? pairs : 1); i++) {
    const y = 336 + i * 124;
    const mid = y + 56;
    fill(g, 333, y, 140, 112, C.sheet);
    fill(g, 333, y, 140 * fillRound, 112, C.sky);
    dot(g, 377, mid, 17, C.blue);
    dot(g, 415, mid, 17, C.blue);
    line(g, 473, mid, 588, mid, C.blue, 5);
    line(g, 588, mid - 26, 588, mid + 26, C.blue, 5);
    for (const [side, offset] of [-26, 26].entries()) {
      line(g, 588, mid + offset, 651, mid + offset, C.blue, 5);
      mono(g, 'GPU ' + (2 * i + side), 672, mid + offset + 13, 39, C.ink);
    }
  }
  text(g, 'Sequences read', 1230, 490, 49, C.dim);
  mono(g, showCount ? windowState(1, pairs) : '?', 1230, 615, 100, C.teal);
}

export function replicas(g, k) {
  if (k.beat.beatIndex === 0) {
    firstRound(g, k);
    return;
  }
  const b = k.beat.beatIndex,
    changed = b >= 2,
    R = changed ? 8 : 4,
    K = changed ? 4 : 8;
  const five = cue(k, 1, 'end of round E', 1.1),
    all = cue(k, 1, 'Finish F', 1.0);
  const n = changed
    ? Math.floor(K * cue(k, 3, 'Fill the four rounds', 1.3))
    : Math.floor(1 + 4 * five + 3 * all);
  heading(
    g,
    'DATA PARALLELISM   /   one pair shares its inputs',
    changed ? 'Eight pairs on the replacement cluster' : 'Four pairs share the model work',
  );
  const x0 = 333,
    y0 = 336,
    dx = changed ? 188 : 152,
    dy = changed ? 70 : 124;
  for (let j = 0; j < K; j++)
    mono(g, letters[j], x0 + j * dx + dx * 0.42, 303, 34, C.dim, 'center');
  for (let i = 0; i < R; i++) {
    const y = y0 + i * dy;
    mono(g, 'GPU ' + 2 * i + ' + ' + (2 * i + 1), 110, y + dy * 0.5 + 8, 27, C.ink);
    for (let j = 0; j < K; j++) {
      const x = x0 + j * dx;
      fill(g, x, y, dx - 12, dy - 12, j < n ? C.sky : C.sheet);
      for (const offset of [0.29, 0.54])
        dot(g, x + dx * offset, y + (dy - 12) / 2, changed ? 11 : 17, j < n ? C.blue : C.edge);
    }
  }
  const tx = changed ? 1230 : 1590;
  text(g, b === 2 ? 'Predict the batch' : 'Sequences read', tx, 490, changed ? 49 : 37, C.dim);
  mono(g, b === 2 ? '?' : windowState(n, R), tx, 615, 100, C.teal);
  if (changed) text(g, '2 per pair, 4 rounds', tx, 689, 35, C.dim);
  if (b === 3)
    text(g, 'The target mask determines how many tokens contribute.', 114, 966, 37, C.dim);
}

export function cursor(g, k) {
  const b = k.beat.beatIndex;
  if (b < 3) {
    heading(
      g,
      'SAMPLER ORDER   /   sequential IDs in this example',
      b === 2 ? 'Each rank restores its loader workers' : 'Two positions on one stream',
    );
    const x = 120,
      y = 440,
      p = 104,
      seen = cue(k, 0, 'first eight'),
      prefetch = cue(k, 0, 'prefetched four');
    strip(g, 95, y - 60, 1728, 230);
    for (let i = 0; i < 16; i++) {
      const color = i < 8 && seen ? C.sky : i < 12 && i >= 8 && prefetch ? C.straw : C.pale;
      fill(g, x + i * p, y, p - 7, 85, color);
      mono(g, i, x + i * p + 47, y + 58, 43, C.ink, 'center');
    }
    if (seen) bracket(g, x, y + 105, 8 * p - 7, '8 used', C.blue);
    if (prefetch) bracket(g, x + 8 * p, y + 105, 4 * p - 7, '4 buffered', C.gold);
    if (b >= 1) {
      pointer(g, x + 8 * p + 45, y - 4);
      text(g, 'Next ID 8', x + 8 * p + 45, y - 49, 42, C.red, 'center');
    }
    if (b === 2) {
      text(g, 'Rank 0   [ worker 0   ·   worker 1 ]', 123, 790, 38, C.ink);
      text(g, 'Rank 1   [ worker 0   ·   worker 1 ]', 952, 790, 38, C.ink);
      words(
        g,
        [
          'Restore worker state within its rank.',
          'For an iterable worker-state restore, match the saved worker count.',
        ],
        124,
        861,
        32,
      );
    } else if (b === 1)
      words(
        g,
        [
          'Saving the producer position would skip IDs 8–11.',
          'Packed streams can also require buffered data and random state.',
        ],
        122,
        781,
        40,
      );
    return;
  }
  heading(
    g,
    'UPDATE 1,840   /   64 examples per completed update',
    b === 5 ? 'The main loop handles a warning' : 'What belongs to the saved boundary?',
  );
  strip(g, 109, 405, 1706, 250);
  text(g, 'Published on disk', 145, 494, 42, C.teal);
  mono(g, fmt(job.saved), 145, 596, 79, C.teal);
  text(g, 'Live after round E', 1040, 494, 42, C.gold);
  mono(g, fmt(job.live), 1040, 596, 79, C.gold);
  bracket(g, 638, 614, 347, '40 in flight', C.gold, true, 32);
  words(
    g,
    b === 3
      ? [
          '1,840 successful updates × 64 examples each',
          'The consumed count identifies a position in this sampler order.',
        ]
      : b === 4
        ? [
            'Mid-window restore also needs the accumulated gradients, their count,',
            'the buffers, random streams, loader and matching scale.',
          ]
        : [
            'Warning handler sets a flag. The main loop coordinates the save.',
            'A failed member prevents normal fixed-group collectives from finishing.',
          ],
    123,
    800,
    39,
  );
}

function storage(g, x, y, v, name, color) {
  fill(g, x, y, 560, 220, color);
  for (let i = 0; i < 9; i++)
    line(g, x + 33 + i * 57, y + 220, x + 33 + i * 57, y + 243, C.gold, 10);
  text(g, name, x + 32, y + 65, 36, C.white);
  mono(g, v.toFixed(1), x + 278, y + 170, 85, C.white, 'center');
}
export function snapshot(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const values = copyDemo(cue(k, 1, 'point eight') > 0);
    heading(g, 'ONE SGD STEP   /   loss = w²', 'Which copy owns the weight?');
    text(g, 'model.weight', 126, 347, 47, C.ink);
    text(g, 'state_dict', 633, 347, 47, C.ink);
    text(g, 'deep copy', 1305, 347, 47, C.ink);
    path(
      g,
      [
        [255, 380],
        [255, 447],
        [554, 512],
      ],
      C.blue,
    );
    path(
      g,
      [
        [741, 380],
        [741, 445],
        [554, 512],
      ],
      C.blue,
    );
    line(g, 1410, 378, 1410, 511, C.teal, 4);
    storage(g, 282, 512, values[1], 'Shared storage', C.blue);
    storage(g, 1127, 512, values[2], 'Independent storage', C.teal);
    mono(g, 'w = ' + values[0].toFixed(1), 122, 856, 43, C.ink);
    mono(g, 'gradient 2   ×   rate 0.1', 750, 856, 38, C.dim);
    return;
  }
  const publish = b >= 5;
  heading(
    g,
    publish ? 'PUBLICATION   /   immutable checkpoint name' : 'ASYNC SAVE   /   one boundary',
    publish ? 'Verify the manifest before replacing latest' : 'A host copy frees the live tensors',
  );
  const titles = publish
    ? ['Checkpoint files', 'Manifest', 'Latest pointer']
    : ['Live GPU state', 'Stable host copy', 'Storage upload'];
  titles.forEach((s, i) => {
    const x = 120 + 590 * i;
    strip(g, x, 422, 495, 235);
    text(g, s, x + 23, 512, 42, C.ink, 'left', 'Serif');
    text(
      g,
      (publish
        ? ['shards + app state', 'sizes or hashes', 'update atomically']
        : ['weights + buffers', 'tensors + cursor', 'upload future'])[i],
      x + 24,
      592,
      30,
      C.dim,
    );
    if (i < 2) {
      line(g, x + 498, 540, x + 577, 540, C.teal, 5);
      path(
        g,
        [
          [x + 557, 526],
          [x + 578, 540],
          [x + 557, 554],
        ],
        C.teal,
      );
    }
  });
  const info = [
    [
      'Default staging can block before async_save returns.',
      'DefaultStager (PyTorch 2.9+) can stage on a background CPU thread.',
    ],
    [
      'Wait for staging before modifying a copied value.',
      'A forward pass can change buffers. A data fetch can move the RNG.',
    ],
    [
      'Check both futures for errors. Bound the number of pending saves.',
      'Close the stager when the work finishes.',
    ],
    [
      'Publish only after every expected artifact validates at one boundary.',
      'For filesystem crash durability, synchronize the file and directory.',
    ],
    [
      'Cloud Storage writes each object atomically.',
      'Use a generation-match condition on latest. Validate again when loading.',
    ],
  ][b - 2];
  words(g, info, 125, 800, 38);
}

export function durable(g, k) {
  const b = k.beat.beatIndex,
    advanced = cue(k, 0, 'training takes another step'),
    seen = cue(k, 1, 'Three reach storage', 0.75);
  const complete = cue(k, 2, 'fourth shard passes'),
    published = cue(k, 2, 'publish the new pointer');
  const good = packet(complete ? 4 : Math.floor(3 * seen), !!published),
    bad = packet(Math.floor(3 * seen), false);
  heading(
    g,
    'DURABLE STORAGE   /   update ' + fmt(update + 1),
    b === 0 ? 'One frozen copy, one live worker' : 'Which packet can replacements open?',
  );
  for (const [i, [name, step]] of [
    ['Live weights', update + 1 + (advanced ? 1 : 0)],
    ['Host snapshot', update + 1],
  ].entries()) {
    const x = 120 + 875 * i;
    text(g, name, x, 337, 38, C.dim);
    mono(g, fmt(step), x, 422, 70, i ? C.teal : C.blue);
    mono(g, fmt(step * job.perUpdate) + ' consumed', x, 481, 34, C.dim);
  }
  if (b === 0) return;
  const rows =
    b >= 2
      ? [
          ['Interrupted', bad],
          [complete ? 'Completed write' : 'Retry', good],
        ]
      : [['Storage', bad]];
  rows.forEach(([name, s], i) => {
    const y = 573 + i * 152;
    text(g, name, 117, y + 58, 37, C.ink);
    for (let j = 0; j < 4; j++) {
      fill(g, 504 + j * 132, y, 115, 93, j < s.checked ? C.teal : C.sheet);
      mono(
        g,
        j < s.checked ? j + 1 : '·',
        560 + j * 132,
        y + 60,
        43,
        j < s.checked ? C.white : C.dim,
        'center',
      );
    }
    mono(g, s.checked + '/4', 1093, y + 60, 45, C.ink);
    text(g, b === 1 ? 'Latest from before this save' : 'Latest on disk', 1344, y + 22, 30, C.dim);
    mono(g, fmt(s.latest), 1344, y + 81, 52, s.latest === update ? C.blue : C.teal);
  });
  if (b === 3) mono(g, 'Read next from ' + fmt(good.cursor) + ' consumed.', 124, 962, 39, C.teal);
}
