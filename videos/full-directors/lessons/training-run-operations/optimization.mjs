import {
  C,
  text,
  mono,
  fill,
  line,
  dot,
  strip,
  ticks,
  bracket,
  words,
  heading,
  cue,
} from './recorder.mjs';
import {
  windowState, batchMultiplier, initialAdam, newAdam, linearRate,
  tokenRows, gradients, counters, trainingMemory,
} from './run.mjs';

export function schedule(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(
      g,
      'REGULAR MESH   /   distinct TP, PP and CP axes',
      'Which devices see different examples?',
    );
    for (let r = 0; r < 8; r++) {
      const x = 143 + (r % 4) * 429,
        y = 351 + Math.floor(r / 4) * 218;
      for (let i = 0; i < 8; i++) {
        const xx = x + (i % 4) * 62,
          yy = y + Math.floor(i / 4) * 48;
        fill(g, xx, yy, 51, 36, [C.teal, C.blue][i % 2]);
        line(g, xx + 16, yy + 11, xx + 34, yy + 11, C.pale, 3);
      }
      bracket(g, x, y + 93, 237, 'replica ' + r, C.dim, false, 26);
    }
    const batch = windowState(4, 8);
    mono(
      g,
      b === 0
        ? '64 / (2 TP × 2 PP × 2 CP) = 8 replicas'
        : '8 replicas × 2 sequences × 4 rounds = ' + batch,
      121,
      899,
      41,
      C.ink,
    );
    if (b === 1)
      text(
        g,
        'Check actual groups on an overlapping mesh. Count shifted, unmasked targets separately.',
        124,
        967,
        30,
        C.dim,
      );
  } else if (b <= 3) {
    heading(
      g,
      'WARMUP   /   examples consumed',
      'Keep the old data budget after doubling the batch',
    );
    const old = 64 * 100,
      cut = cue(k, 3, 'fifty successful updates');
    for (let i = 0; i < 2; i++) {
      const y = 398 + i * 235,
        batch = i ? 128 : 64,
        steps = i && cut ? 50 : 100,
        seen = steps * batch;
      text(g, batch + ' examples per update', 125, y - 30, 41, C.ink);
      fill(g, 130, y, 1630, 82, C.sheet);
      fill(g, 130, y, (1630 * seen) / (old * 2), 82, i ? C.sky : C.mint);
      mono(
        g,
        steps + ' updates  ·  ' + seen.toLocaleString('en-US') + ' examples',
        148,
        y + 57,
        36,
        C.ink,
      );
    }
    line(g, 945, 370, 945, 773, C.red, 3);
    text(g, '6,400-example milestone', 945, 854, 35, C.red, 'center');
  } else {
    const adamRule = cue(k, 4, 'square root of kappa');
    heading(
      g,
      'BATCH MULTIPLIER  κ = ' + batchMultiplier + '     /     STARTING RATE  η = ' + initialAdam.rate,
      adamRule ? 'Test a scaling rule at equal data budgets' : 'Would you double Adam’s learning rate?',
    );
    text(g, adamRule ? 'Adam proposal' : 'Adam', 125, 349, 48, C.teal, 'left', 'Serif');
    mono(g, adamRule ? 'η′ = √κ · η' : 'New learning rate', 130, 461, 57, C.ink);
    mono(
      g, initialAdam.rate + '  →  ' + (adamRule ? newAdam.rate.toFixed(6) : '?'),
      1005, 461, 49, C.teal,
    );
    if (b === 4 && cue(k, 4, 'Goyal and colleagues')) {
      text(g, 'Large-batch SGD on ResNet', 125, 583, 43, C.blue, 'left', 'Serif');
      if (cue(k, 4, 'linear scaling with warmup')) {
        mono(g, 'η′ = κ · η', 130, 671, 49, C.ink);
        mono(g, initialAdam.rate + '  →  ' + linearRate, 1005, 671, 45, C.blue);
        text(
          g, 'With gradual warmup, assuming gradients change little across the smaller steps.',
          129, 752, 35, C.dim,
        );
      }
    }
    if (!adamRule && cue(k, 4, 'Adam uses different state'))
      text(g, 'Adam tracks two moving averages, one for g and one for g².', 125, 857, 36, C.dim);
    if (cue(k, 5, 'Divide epsilon')) {
      mono(g, 'ε′ = ε / √κ', 130, 581, 53, C.ink);
      mono(
        g, initialAdam.epsilon.toExponential(0) + '  →  ' + newAdam.epsilon.toExponential(2),
        1005, 581, 42, C.teal,
      );
    }
    if (cue(k, 5, 'then subtract from one')) {
      mono(g, 'β′ = 1 − κ(1 − β)', 130, 708, 53, C.ink);
      mono(
        g, `${initialAdam.beta1}, ${initialAdam.beta2}  →  ${newAdam.beta1}, ${newAdam.beta2}`,
        1005, 708, 37, C.teal,
      );
    }
    if (adamRule) {
      text(
        g, 'The Adam proposal assumes a particular noise and moment model and valid beta coefficients.',
        125, 857, 33, C.dim,
      );
      if (b === 6)
        words(g, [
          'Gradient-noise scale = trace of covariance / squared mean gradient norm.',
          'Its useful-batch estimate depends on the setting. Kernels and communication affect wall time.',
        ], 125, 910, 33);
      else if (cue(k, 5, 'Compare it with a fixed rate'))
        text(g, 'Compare with a fixed rate of ' + initialAdam.rate + ' at the same data budget.', 125, 916, 36, C.dim);
    }
  }
}

export function tokens(g, k) {
  const b = k.beat.beatIndex,
    local = cue(k, 0, 'You get four'),
    add = cue(k, 2, 'Add each row first'),
    equal = cue(k, 2, 'gives one'),
    scale = cue(k, 3, 'Scale each local loss sum'),
    reduced = cue(k, 3, 'Their average is one');
  heading(
    g,
    'ONE WEIGHT COORDINATE   /   one tile per supervised token',
    b <= 1 ? 'Average across replicas' : 'Give each supervised token the same weight',
  );
  tokenRows.forEach((r, i) => {
    const y = 369 + i * 207;
    text(g, 'Replica ' + i, 125, y + 71, 43, C.dim);
    r.forEach((v, j) => {
      const x = 470 + j * 174;
      fill(g, x, y, 150, 119, i ? C.straw : C.sky);
      mono(g, v > 0 ? '+' + v : '−' + Math.abs(v), x + 75, y + 81, 54, C.ink, 'center');
    });
    if (local)
      mono(
        g,
        scale
          ? gradients.sums[i] + ' × 2/4 → ' + gradients.normalized[i]
          : add
            ? 'sum  ' + gradients.sums[i]
            : 'mean  ' + gradients.sums[i] / r.length,
        1111,
        y + 81,
        47,
        C.ink,
      );
  });
  if (b <= 1 && local)
    text(g, '(+10 − 2) / 2 = ' + gradients.replica, 129, 823, 60, C.blue, 'left', 'Serif');
  if (b === 1) text(g, 'What changes if each token gets one vote?', 128, 928, 42, C.dim);
  if (equal && !reduced) mono(g, '(10 − 6) / 4 tokens = ' + gradients.token, 129, 853, 55, C.teal);
  if (b >= 3 && reduced)
    mono(g, 'DDP average   (5 − 3) / 2 = ' + gradients.token, 129, 830, 53, C.teal);
  if (b === 4)
    text(
      g,
      'Local loss sum × D/N   ·   N counts all shifted, unmasked targets across the window.',
      128,
      935,
      36,
      C.dim,
    );
}

export function overflow(g, k) {
  const b = k.beat.beatIndex,
    one = cue(k, 0, 'first window applies cleanly'),
    two = b > 2 || (b === 2 && k.reveal('skips the optimizer step', 0, { captionStart: false })),
    three = cue(k, 3, 'third window applies cleanly');
  const done = three ? 3 : two ? 2 : one ? 1 : 0,
    s = counters(done);
  heading(g, 'FP16   /   64 examples in each window', 'Follow the clocks through an overflow');
  const pending = !two && cue(k, 1, 'reads another sixty-four');
  const waiting = !two && cue(k, 1, 'gradients overflow');
  const clocksKnown = b > 2 || (b === 2 && k.reveal('both stay at one', 0, { captionStart: false }));
  const scaleKnown = b > 2 || (b === 2 && k.reveal('to four', 0, { captionStart: false }));
  const predict = (b === 1 && waiting) || (b === 2 && !clocksKnown);
  for (let i = 0; i < 3; i++) {
    const x = 126 + i * 564,
      show = i < done;
    strip(g, x, 350, 515, 166);
    text(g, 'Window ' + (i + 1), x + 27, 411, 34, C.dim);
    text(
      g,
      show
        ? i === 1
          ? 'Overflow · skipped'
          : 'Applied'
        : i === 1 && waiting
          ? 'Overflow · predict'
          : i === 1 && pending
            ? '64 examples read'
            : 'Awaiting window',
      x + 27,
      477,
      43,
      show && i === 1 ? C.red : show ? C.teal : C.dim,
    );
  }
  const compare = (value) => (predict ? value + ' → ?' : b === 2 ? value + ' → ' + value : value);
  const rows = [
    ['Examples consumed', pending ? counters(2).examples : s.examples],
    ['Successful updates', compare(s.updates)],
    ['Schedule position', compare(s.scheduler)],
    ['Loss scale', two && !scaleKnown ? counters(1).scale : s.scale],
  ];
  rows.forEach(([label, val], i) => {
    const x = 125 + i * 430;
    text(g, label, x, 687, 33, C.dim);
    mono(g, val, x, 814, 90, i === 0 ? C.blue : C.teal);
    line(g, x, 851, x + 343, 851, C.edge);
  });
  if (b === 1 && predict && cue(k, 1, 'Will the optimizer step'))
    text(g, 'Will the optimizer step? Will its update-indexed schedule advance?', 125, 884, 39, C.ink);
  if (b === 3)
    text(
      g,
      'This schedule counts successful updates. The data cursor counts all consumed examples.',
      125,
      884,
      34,
      C.dim,
    );
}

export function diagnosis(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(
      g,
      'MATCHED WORK   /   illustrative per-rank timings',
      'Trace the late arrival before blaming the fabric',
    );
    const x = 381,
      w = 128;
    for (let r = 0; r < 3; r++) {
      const y = 374 + r * 139,
        arrive = 4 + 2 * r;
      text(g, 'Rank ' + r, 128, y + 60, 43, C.ink);
      fill(g, x, y, arrive * w, 81, C.sky);
      if (arrive < 8) fill(g, x + w * arrive, y, (8 - arrive) * w, 81, C.straw);
      fill(g, x + 8 * w, y, 2 * w, 81, C.mint);
      mono(g, 'compute  ' + arrive, x + 22, y + 55, 33, C.ink);
      if (arrive < 8) mono(g, 'wait ' + (8 - arrive), x + w * arrive + 15, y + 55, 32, C.ink);
      text(g, 'collective', x + 8 * w + 20, y + 54, 31, C.ink);
    }
    ticks(g, x, 793, 10 * w, 10);
    mono(g, '0', x, 858, 34, C.dim, 'center');
    mono(g, '8', x + 8 * w, 858, 34, C.dim, 'center');
    mono(g, '10 ms', x + 10 * w, 858, 34, C.dim, 'center');
    text(
      g,
      'Inspect compute clocks and link counters under matched work. Communication can overlap backward compute.',
      128,
      956,
      30,
      C.dim,
    );
  } else if (b < 4) {
    const empty = cue(k, 2, 'zero supervised targets'),
      fixed = cue(k, 2, 'Repair its mask');
    heading(
      g,
      'FAILING BATCH   /   matched GPU canaries pass',
      'Which token contributes to the loss?',
    );
    ['Snow', 'is', 'cold'].forEach((t, i) => {
      const x = 129 + i * 564,
        keep = i === 2 && fixed;
      text(g, i === 2 ? 'Labeled answer' : 'Prompt', x, 354, 35, C.dim);
      strip(g, x, 395, 515, 186);
      text(g, t, x + 255, 513, 72, C.ink, 'center', 'Serif');
      if (empty) {
        fill(g, x, 620, 515, 93, keep ? C.mint : C.pale);
        mono(g, 'mask  ' + Number(keep), x + 250, 685, 45, C.ink, 'center');
      }
    });
    if (empty)
      mono(
        g,
        fixed ? 'Mean loss = loss on “cold” / 1' : 'Mean loss = 0 / 0   →   undefined',
        131,
        831,
        48,
        fixed ? C.teal : C.red,
      );
    if (b === 3)
      text(
        g,
        'Canaries test the inputs, precision, kernels and tolerance they actually ran.',
        132,
        935,
        36,
        C.dim,
      );
  } else {
    heading(
      g,
      'RECOVERY POINTER   /   preserve the failing batch',
      'Which checkpoint can you rewind to?',
    );
    line(g, 251, 539, 1640, 539, C.edge, 6);
    [
      [1600, 'Best evaluation', C.blue],
      [1840, 'Latest resumable', C.teal],
      [1841, 'Nonfinite state', C.red],
    ].forEach(([step, name, col], i) => {
      const x = 261 + i * 674;
      dot(g, x, 539, 24, col);
      mono(g, step, x, 467, 60, col, 'center');
      text(g, name, x, 652, 42, col, 'center');
    });
    words(
      g,
      b === 4
        ? [
            'Keep separate best and latest tags. Reject nonfinite state for publication.',
            'Replay the batch with its mask, rate, scaler and gradient norms. Limit retries.',
          ]
        : [
            'For a finite spike, calibrate a trigger against this run’s history.',
            'Rewind before the first affected state. Changing the shuffle changes the experiment.',
          ],
      126,
      828,
      37,
    );
  }
}

export function memory(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(g, 'ADAPTER TRAINING', 'Make three separate choices');
    const opts = [
      ['Learning signal', 'Labeled responses', 'Supervised fine-tuning'],
      ['Updated parameters', 'LoRA adapters', 'Base stays frozen'],
      ['Frozen base format', 'Four-bit NF4', 'Quantized weight storage'],
    ];
    opts.slice(0, b === 0 ? 2 : 3).forEach(([key, val, note], i) => {
      const y = 336 + 177 * i;
      text(g, key, 120, y + 67, 39, C.dim);
      strip(g, 598, y, 1187, 132);
      text(g, val, 627, y + 80, 50, C.ink, 'left', 'Serif');
      text(g, note, 1236, y + 78, 31, C.teal);
    });
    if (b === 1)
      text(
        g,
        'Check backend support and evaluate on held-out text and the tasks people use.',
        122,
        958,
        36,
        C.dim,
      );
    return;
  }
  const high = cue(k, 4, 'forty-eight gibibytes') && !cue(k, 5, 'smaller budget'),
    cap = high ? 48 : 24,
    m = trainingMemory(70e9, 4, cap),
    small = trainingMemory(8e9, 16, cap),
    w = 1550,
    x = 150;
  heading(
    g,
    'ALL-RESIDENT PLAN   /   ideal base weights only',
    'Can the replacement GPU hold the frozen base?',
  );
  const bar = (y, s, v, col) => {
    text(g, s, x, y - 29, 38, C.ink);
    fill(g, x, y, (v * w) / 48, 80, col);
    mono(g, v.toFixed(1) + ' GiB', x + 19, y + 55, 37, C.ink);
  };
  if (cue(k, 2, 'thirty-five billion bytes'))
    bar(445, '70B × 4 bits / 8 = 35 billion bytes', m.baseGiB, C.straw);
  if (cue(k, 3, 'smaller eight-billion')) bar(675, '8B × 16 bits / 8', small.baseGiB, C.sky);
  const stop = x + (cap * w) / 48;
  line(g, stop, 360, stop, 792, C.red, 5);
  mono(g, cap + ' GiB capacity', stop, 316, 36, C.red, high ? 'right' : 'center');
  if (b >= 3) {
    text(
      g,
      m.baseFits
        ? m.remainderGiB.toFixed(1) + ' GiB left for all other allocations'
        : (-m.remainderGiB).toFixed(1) + ' GiB over capacity with base weights alone',
      128,
      885,
      43,
      m.baseFits ? C.teal : C.red,
    );
    if (b === 5 && !high)
      text(
        g,
        'Try a smaller base, supported quantization, sharding or offload. Measure the training peak.',
        130,
        952,
        34,
        C.dim,
      );
    else if (high)
      text(
        g,
        'Measure peak memory with metadata, adapters, activations, gradients, moments and temporary buffers.',
        130,
        952,
        31,
        C.dim,
      );
  }
}
