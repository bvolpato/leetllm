import {
  P,
  head,
  txt,
  mono,
  line,
  box,
  dot,
  poly,
  plaque,
  strip,
  equation,
  matrix,
  paperRows,
  cue,
  spokenProgress,
} from './bench.mjs';
import {
  checkpoint,
  loopMomentum,
  measuredValidation,
  loopClip,
  loopAmpOrder,
} from './examples.mjs';

function switchLever(c, x, y, label, left, right, on) {
  txt(c, label, x, y, 19, P.dim);
  box(c, x, y + 26, 264, 54, P.ink, 27);
  box(c, x + (on ? 132 : 0) + 3, y + 29, 126, 48, P.teal, 24);
  txt(c, left, x + 66, y + 54, 19, on ? P.dim : P.ink, { align: 'center' });
  txt(c, right, x + 197, y + 54, 19, on ? P.ink : P.dim, { align: 'center' });
}
export function modes(c, k) {
  const b = k.beat.beatIndex + 1;
  const evalMode = b === 1 ? cue(k, 1, 'evaluation is identity') : b === 4,
    graph =
      b === 4
        ? cue(k, 4, 'turn gradient recording on')
        : b === 3
          ? !cue(k, 3, 'Even inside no grad')
          : true;
  head(
    c,
    'LAYER CONTROLS',
    b === 1
      ? 'Run one activation through Dropout'
      : b === 2
        ? 'Linear and ReLU keep the same rule'
        : b === 3
          ? 'Which statistics does this layer use?'
          : 'Choose the controls for the job',
  );
  switchLever(c, 55, 162, 'Layer mode', 'train', 'eval', evalMode);
  switchLever(c, 55, 300, 'Record a graph', 'off', 'on', graph);
  plaque(c, 374, 151, 534, 292);
  if (b === 1) {
    const out = evalMode ? [1, 2, 3, 4] : [2, 0, 6, 0];
    txt(c, 'Dropout    p = ½', 409, 185, 22, P.ink, { bold: true });
    paperRows(
      c,
      [
        ['Input', '1   2   3   4'],
        [evalMode ? 'Mask bypassed' : 'Example mask', evalMode ? 'identity' : '1   0   1   0'],
        ['Output', out.join('   ')],
      ],
      408,
      249,
      460,
      55,
    );
  } else if (b === 2) {
    txt(c, 'ReLU(x) = max(0, x)', 412, 205, 26, P.ink, { font: 'Mono' });
    paperRows(
      c,
      [
        ['Input', '−1     2'],
        ['train / eval', ' 0     2'],
      ],
      408,
      287,
      460,
      61,
    );
  } else if (b === 3) {
    const noTrack = cue(k, 3, 'Disabling that tracking') && !cue(k, 3, 'Even inside');
    const ln = cue(k, 3, 'LayerNorm itself') && !cue(k, 3, 'Even inside');
    txt(
      c,
      ln ? 'LayerNorm' : noTrack ? 'BatchNorm    tracking off' : 'BatchNorm    tracking on',
      410,
      192,
      23,
      P.ink,
      { bold: true },
    );
    paperRows(
      c,
      ln
        ? [
            ['train', 'trailing dimensions'],
            ['eval', 'trailing dimensions'],
          ]
        : [
            ['train', 'use batch statistics'],
            ['eval', noTrack ? 'use batch statistics' : 'read running buffers'],
            ['Running buffers', noTrack ? 'absent' : 'updated in train'],
          ],
      409,
      260,
      460,
      55,
    );
  } else {
    txt(c, graph ? 'Input attribution' : 'Held-out evaluation', 412, 198, 28, P.ink, {
      font: 'Serif',
    });
    paperRows(
      c,
      [
        ['Input', graph ? 'requires_grad=True' : '4 validation tickets'],
        ['Read', graph ? '∂score / ∂input' : 'loss, accuracy'],
        ['Optimizer step', 'omitted'],
      ],
      410,
      265,
      456,
      54,
    );
  }
}
export function validation(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1 || !cue(k, 2, 'Try it on a zero weight')) {
    head(c, 'VALIDATION   /   FOUR HELD-OUT TICKETS', 'Read the frozen router');
    [
      [-1.1, -0.6],
      [-0.5, -1.7],
      [1, 0.6],
      [1.7, 0.4],
    ].forEach((r, i) => {
      let x = 55 + 217 * i;
      strip(c, x, 192, 198, 104);
      txt(c, i < 2 ? 'Standard' : 'Escalate', x + 18, 221, 21, i < 2 ? P.moss : P.red);
      mono(c, '[' + r.join(', ') + ']', x + 18, 262, 18);
    });
    const chosen = cue(k, 2, 'Save that model');
    equation(
      c,
      chosen
        ? 'Epoch ' + measuredValidation.bestEpoch + '     validation CE ' + measuredValidation.loss
        : 'model.eval()     with torch.no_grad()',
      366,
      false,
      23,
    );
    mono(
      c,
      chosen
        ? 'Lowest validation loss in the 60-epoch run'
        : 'held-out forward     →     loss and accuracy',
      480,
      428,
      19,
      P.dim,
      'center',
    );
    return;
  }
  const change = cue(k, 2, 'The plain view follows');
  head(c, 'CHECKPOINT   /   STORAGE ALIAS', 'Take a copy, then edit the live tensor');
  txt(c, 'model.weight', 64, 228, 26, P.white, { font: 'Mono' });
  txt(c, 'state_dict()[key]', 65, 311, 23, P.dim, { font: 'Mono' });
  line(c, 323, 226, 495, 244, P.teal, 3);
  line(c, 323, 307, 495, 257, P.teal, 3);
  box(c, 502, 204, 134, 99, P.teal, 6);
  mono(c, change ? 1 : 0, 569, 255, 43, P.ink, 'center');
  txt(c, 'shared storage', 566, 337, 18, P.dim, { align: 'center' });
  box(c, 720, 204, 134, 99, P.paper, 6);
  mono(c, 0, 787, 255, 43, P.ink, 'center');
  txt(c, 'deep copy', 787, 337, 18, P.white, { align: 'center' });
  equation(c, change ? 'live.add_(1)' : 'copy.deepcopy(model.state_dict())', 441, false, 23);
}
export function resume(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 5) {
    const lists = [
      [
        ['Model state', 'weights, persistent buffers'],
        ['Router layout', 'architecture, feature order'],
        ['Output columns', '0 standard, 1 escalation'],
      ],
      [
        ['Captured', 'named parameters and buffers'],
        ['Separate state', 'ordinary attributes, .grad'],
        ['Whole module', 'requires class and import path'],
      ],
      [
        ['Next update', 'optimizer, scheduler, scaler'],
        ['Random draws', 'Python, NumPy, CPU, device, loader'],
        ['Progress', 'step, split, current RNG states'],
      ],
      [
        ['Middle of an epoch', 'sampler position, stream buffers'],
        ['Accumulation window', 'pending .grad or replay input'],
        ['Resume boundary', 'next batch and next update'],
      ],
    ];
    head(c, 'RESTART BUNDLE', 'What must travel with the weights?', true);
    strip(c, 45, 157, 870, 298, '#fff8e7');
    paperRows(c, lists[b - 1], 74, 224, 806, 76);
    return;
  }
  if (b >= 8) {
    const stepped = cue(k, 8, 'Restoring the optimizer matches');
    head(c, 'ARTICLE FIXTURE   /   STEP 80', 'Compare the next update');
    matrix(c, {
      x: 64,
      y: 206,
      w: 831,
      label: 'Compare against uninterrupted training',
      headers: ['copy', 'scores at 80', 'weights at 81'],
      rows: [
        ['Full state', 'match', stepped ? 'match' : 'pending'],
        ['Weights only', 'match', stepped ? 'differ' : 'pending'],
      ],
    });
    txt(
      c,
      b === 9
        ? 'Also replay shuffled data order and stochastic draws.'
        : 'Both copies receive the same next batch.',
      480,
      419,
      22,
      P.gold,
      { align: 'center' },
    );
    return;
  }
  head(c, 'SGD   /   MOMENTUM REPLAY', 'Which copy takes the larger step?');
  const data = [
    ['Restored', 1, 6, 'minus a tenth', 'point nine one'],
    ['Fresh', 0, 7, 'goes into the buffer', 'to one'],
  ];
  data.forEach(([name, old, revealBeat, bufferPhrase, weightPhrase], i) => {
    const out = loopMomentum(old, -1);
    const bufferReady = spokenProgress(k, revealBeat, bufferPhrase) === 1;
    const movement = spokenProgress(k, revealBeat, weightPhrase);
    const y = 216 + i * 115;
    txt(c, name, 53, y - 8, 23, P.white, { bold: true });
    mono(c, bufferReady ? 'v = ' + out.buffer.toFixed(1) : 'old v = ' + old, 53, y + 24, 16, P.dim);
    const x = 335,
      w = 475;
    line(c, x, y, x + w, y, P.edge, 4);
    [0.9, 0.95, 1].forEach((v) => {
      const xx = x + (v - 0.9) * 10 * w;
      line(c, xx, y - 8, xx, y + 8, P.dim);
      mono(c, v.toFixed(2), xx, y + 27, 15, P.dim, 'center');
    });
    const xx = x + movement * (out.weight - 0.9) * 10 * w;
    dot(c, xx, y, 9, i ? P.copper : P.teal);
    if (movement === 0 || movement === 1)
      mono(c, (movement === 1 ? out.weight : 0.9).toFixed(2), xx, y - 28, 23, P.white, 'center');
  });
  equation(c, 'v ← 0.9 × old v − 1       w ← 0.9 − 0.1 × v', 420, false, 21);
}
function fileSheet(c, x, y, step, count, status, col) {
  strip(c, x + 4, y + 6, 300, 111, '#10292c77');
  strip(c, x, y, 300, 111, P.paper);
  txt(c, 'Step ' + step, x + 16, y + 24, 23, P.ink, { font: 'Serif' });
  for (let i = 0; i < 4; i++) {
    box(c, x + 16 + i * 67, y + 48, 60, 19, i < count ? col : P.rule, 2);
  }
  txt(c, status, x + 16, y + 91, 16, P.pencil);
}
export function atomic(c, k) {
  const s = checkpoint(k),
    b = k.beat.beatIndex + 1;
  const stillOld = b === 3 && spokenProgress(k, 3, 'Still eighty') === 1;
  head(
    c,
    'LOCAL CHECKPOINT DIRECTORY',
    s.failure ? 'Open the live name after a failed write' : 'Follow the name that readers open',
  );
  const dirY = 154;
  box(c, 46, dirY, 868, 301, P.panel, 10);
  const liveY = 201,
    stageY = 344;
  mono(c, 'router.pt', 78, liveY + 28, 24, P.white);
  txt(c, 'live name', 79, liveY + 62, 17, P.teal);
  const targetY = s.replaced ? stageY + 28 : liveY + 39;
  line(c, 344, liveY + 39, 405, liveY + 39, P.teal, 3);
  line(c, 405, liveY + 39, 499, targetY, P.teal, 3);
  line(c, 499, targetY, 548, targetY, P.teal, 3);
  poly(
    c,
    [
      [550, targetY],
      [535, targetY - 7],
      [535, targetY + 7],
    ],
    P.teal,
  );
  if (!s.replaced) fileSheet(c, 570, liveY - 13, s.live, 4, 'complete checkpoint', P.moss);
  else {
    const label =
      b === 4 ? 'Directory sync' : s.firstSave ? 'On a first save' : 'Atomic replacement';
    const detail =
      b === 4
        ? s.dirSynced
          ? 'completed'
          : 'pending'
        : s.firstSave
          ? 'The live name first appears here.'
          : 'The live name now opens step 81.';
    txt(c, label, 574, liveY + 5, 19, P.gold, { bold: true });
    txt(c, detail, 574, liveY + 41, 17, P.white);
  }
  if (s.replaced) {
    mono(c, 'router.81.tmp', 78, stageY + 16, 20, P.dim);
    txt(c, 'name removed by rename', 79, stageY + 50, 17, P.dim);
  } else if (s.failure || cue(k, 1, 'Open a unique staging file')) {
    mono(c, 'router.81.tmp', 78, stageY + 16, 20, P.white);
    txt(c, 'staging name', 79, stageY + 48, 17, P.gold);
    line(c, 344, stageY + 28, 548, stageY + 28, P.gold, 3);
  }
  const status = s.replaced
    ? 'complete checkpoint'
    : s.failed
      ? 'writer stopped at 2 of 4'
      : s.synced
        ? 'file sync complete'
        : s.flushed
          ? 'flushed · syncing file'
          : s.staged === 4
            ? 'all four parts written'
            : 'writing ' + s.staged + ' of 4 parts';
  if (s.failure || cue(k, 1, 'Open a unique staging file'))
    fileSheet(c, 570, stageY - 26, 81, s.staged, status, P.red);
  const note = s.failure
    ? b === 6
      ? 'Trusted input   ·   weights_only=True'
      : s.failed
        ? 'Opening router.pt still reads step 80.'
        : 'New attempt from the same step 80.'
    : s.replaced
      ? 'New opens read step 81.'
      : s.synced
        ? stillOld ? 'router.pt still opens step 80.' : 'Which file does router.pt open?'
        : cue(k, 1, 'Open a unique staging file')
          ? 'The writer owns the staging name.'
          : 'Open the current checkpoint.';
  txt(c, note, 79, 426, 20, P.white);
}
export function triage(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b < 4) {
    const inf = cue(k, 1, 'positive infinity'),
      gradKnown = !inf || b >= 2,
      stop = cue(k, 3, 'The loss is infinite');
    head(c, 'FINITE CHECKS   /   ONE PARAMETER', 'Would you take this step?');
    plaque(c, 45, 160, 870, 272);
    paperRows(
      c,
      [
        ['Forward at w = 3', '3² + ' + (inf ? '∞ = ∞' : '0 = 9')],
        ['Backward    dL/dw', gradKnown ? '2 × 3 = 6' : 'inspect next'],
        ['Decision', stop ? 'hold step' : inf ? 'take the step?' : 'both checks pass'],
      ],
      80,
      219,
      800,
      74,
    );
    return;
  }
  head(
    c,
    'NUMERICAL TRIAGE',
    b === 6 ? 'Log one value without retaining its history' : 'Trace the first nonfinite value',
  );
  if (b === 6) {
    plaque(c, 53, 183, 854, 218);
    paperRows(
      c,
      [
        ['loss.item()', 'Python number · may wait for CUDA'],
        ['loss.detach()', 'tensor on its current device'],
      ],
      87,
      249,
      788,
      84,
    );
    return;
  }
  const names = ['Inputs', 'Logits', 'Loss', 'Gradient', 'Updated W'];
  const active =
    b === 4
      ? cue(k, 4, 'inspect the loss')
        ? 2
        : cue(k, 4, 'then the logits')
          ? 1
          : 0
      : cue(k, 5, 'check the updated')
        ? 4
        : cue(k, 5, 'After backward')
          ? 3
          : 2;
  names.forEach((n, i) => {
    const x = 50 + i * 174;
    line(c, x, 267, x + 165, 267, P.edge, 3);
    dot(c, x + 78, 267, i === active ? 13 : 7, i === active ? P.gold : P.dim);
    txt(c, n, x + 78, 221, 20, i === active ? P.gold : P.white, { align: 'center' });
  });
  txt(
    c,
    [
      'Decode real inputs',
      'Check finite scores',
      'Targets, masks, weights, reduction',
      'After backward and unscale',
      'After optimizer.step()',
    ][active],
    480,
    363,
    26,
    P.white,
    { align: 'center' },
  );
}
export function clipping(c, k) {
  const b = k.beat.beatIndex + 1,
    r = loopClip([6, 8], 5),
    clipped = cue(k, 2, 'The API returns'),
    clamp = cue(k, 2, 'Clamping each coordinate');
  head(c, 'GRADIENT SPACE   /   GLOBAL NORM', 'One multiplier preserves direction');
  const x = 119,
    y = 421,
    u = 28;
  for (let i = 0; i <= 9; i++) {
    line(c, x + i * u, y, x + i * u, y - 9 * u, P.panel);
    line(c, x, y - i * u, x + 9 * u, y - i * u, P.panel);
  }
  line(c, x, y, x + 10 * u, y, P.dim, 2);
  line(c, x, y, x, y - 10 * u, P.dim, 2);
  c.beginPath();
  c.arc(x, y, 5 * u, -Math.PI / 2, 0);
  c.strokeStyle = P.gold;
  c.lineWidth = 2;
  c.stroke();
  line(c, x, y, x + 6 * u, y - 8 * u, P.edge, 4);
  dot(c, x + 6 * u, y - 8 * u, 6, P.dim);
  mono(c, '(6, 8)', x + 6 * u + 18, y - 8 * u, 17, P.dim);
  const [a, d] = clipped ? r.gradient : [6, 8];
  line(c, x, y, x + a * u, y - d * u, P.teal, 4);
  dot(c, x + a * u, y - d * u, 8, P.teal);
  if (clamp) {
    dot(c, x + 5 * u, y - 5 * u, 6, P.copper);
    txt(c, 'coordinate clamp', x + 5 * u + 11, y - 5 * u, 15, P.copper);
  }
  txt(c, 'Global bound  5', 496, 190, 25, P.gold, { font: 'Serif' });
  txt(c, 'Stored gradient', 496, 255, 19, P.dim);
  mono(c, '[' + a + ', ' + d + ']', 496, 298, 37, P.white);
  mono(c, 'norm ' + Math.hypot(a, d), 496, 354, 22, P.teal);
  txt(
    c,
    b === 3
      ? 'Check norm finiteness before scaling.'
      : clipped
        ? 'Returned norm = 10'
        : 'Concatenate the selected gradients.',
    496,
    415,
    19,
    P.dim,
  );
}
export function inference(c, k) {
  const b = k.beat.beatIndex + 1,
    repair = cue(k, 2, 'then the head can'),
    blocked = cue(k, 2, 'raises the inference');
  const ordinary = b === 1 && !cue(k, 1, 'Inference mode');
  head(
    c,
    'FROZEN ROUTER   /   TRAINABLE HEAD',
    ordinary ? 'Extract ordinary features under no-grad' : 'Which tensor can the head save?',
  );
  const x = 56;
  txt(c, 'Frozen router', x, 192, 24, P.white, { bold: true });
  box(c, x, 225, 264, 74, P.panel, 6);
  mono(c, '[−0.27, +0.27]', x + 132, 262, 23, P.teal, 'center');
  line(c, 322, 261, 608, 261, repair || ordinary ? P.teal : P.copper, 4);
  if (repair) strip(c, 357, 236, 215, 48, P.paper);
  if (repair) mono(c, 'clone outside', 466, 259, 17, P.ink, 'center');
  box(c, 614, 218, 282, 87, blocked && !repair ? '#743c35' : P.panel, 8);
  txt(c, 'Trainable head', 756, 259, 24, P.white, { align: 'center' });
  txt(c, ordinary ? 'ordinary tensor' : 'inference tensor', x, 333, 19, P.dim);
  txt(
    c,
    repair
      ? 'save ordinary copy'
      : ordinary
        ? 'save for backward'
        : blocked
          ? 'cannot save this tensor'
          : 'needs features for dW',
    756,
    334,
    18,
    blocked && !repair ? P.copper : P.teal,
    { align: 'center' },
  );
  equation(
    c,
    b >= 3
      ? 'head gradients stop at the frozen features'
      : ordinary
        ? 'no_grad()'
        : repair
          ? 'Clone after leaving inference_mode()'
          : 'inference_mode()',
    434,
    false,
    21,
  );
}
export function precision(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 1 || b === 4) {
    const cpu = cue(k, 4, 'Follow the CPU branch'),
      bf = b === 4 && !cpu;
    head(
      c,
      'MIXED PRECISION   /   STORED WEIGHTS: FP32',
      cpu
        ? 'The CPU branch disables AMP'
        : bf
          ? 'BF16 spends more bits on range'
          : 'CUDA autocast chooses per operation',
    );
    if (bf) {
      matrix(c, {
        x: 75,
        y: 222,
        w: 810,
        label: 'Bits in a floating-point encoding',
        headers: ['type', 'sign', 'exponent', 'fraction'],
        rows: [
          ['FP16', 1, 5, 10],
          ['BF16', 1, 8, 7],
          ['FP32', 1, 8, 23],
        ],
      });
    } else {
      [
        ['Weights', 'float32'],
        ['Matmul', cpu ? 'float32' : 'float16 / BF16'],
        ['Cross entropy', 'float32'],
      ].forEach(([name, v], i) => {
        const x = 51 + i * 299;
        plaque(c, x, 212, 258, 124);
        txt(c, name, x + 21, 247, 20, P.pencil);
        mono(c, v, x + 21, 296, 23);
      });
      txt(
        c,
        cpu ? 'Ordinary backward and optimizer step' : 'Exit autocast before backward.',
        480,
        416,
        23,
        P.gold,
        { align: 'center' },
      );
    }
    return;
  }
  head(c, 'FP16   /   TWO BYTES PER ACTIVATION', 'How small can a gradient become?');
  const x = 84,
    w = 787,
    y = 314,
    px = (v) => x + ((Math.log10(v) + 8) * w) / 5;
  line(c, x, y, x + w, y, P.dim, 2);
  for (let i = -8; i <= -3; i++) {
    const xx = px(10 ** i);
    line(c, xx, y - 7, xx, y + 8, P.dim);
    mono(c, '1e' + i, xx, y + 30, 16, P.dim, 'center');
  }
  const marker = (v, label, yy, col) => {
    const xx = px(v);
    line(c, xx, y, xx, yy + 15, col, 2);
    dot(c, xx, y, 5, col);
    txt(c, label, xx, yy, 17, col, { align: 'center' });
  };
  marker(2 ** -14, 'minimum normal', 214, P.gold);
  if (b === 3) {
    marker(2 ** -24, 'smallest subnormal', 189, P.copper);
    if (cue(k, 3, 'lands between')) marker(1e-5, '1e−5', 257, P.teal);
  }
  equation(
    c,
    b === 2
      ? 'FP16 / BF16   2 B      FP32   4 B'
      : cue(k, 3, 'a path that flushes')
        ? 'A flush-to-zero path can lose 1e−5.'
        : 'Subnormal range below the normal boundary',
    431,
    false,
    23,
  );
}
export function amp(c, k) {
  const b = k.beat.beatIndex + 1,
    a = loopAmpOrder();
  if (b >= 4) {
    const bad = cue(k, 5, 'halves after'),
      good = cue(k, 5, 'doubles after');
    head(
      c,
      'GRADSCALER   /   AFTER THE LAST BACKWARD',
      b === 4 ? 'Inspect the unscaled gradients' : 'How the default scale changes',
    );
    plaque(c, 53, 169, 854, 266);
    paperRows(
      c,
      b === 4
        ? [
            ['unscale_(optimizer)', 'once per window'],
            ['step(optimizer)', 'skip if gradients are nonfinite'],
            ['update()', 'choose scale for next window'],
          ]
        : [
            ['Starting scale', '65,536'],
            ['One overflow', bad ? '65,536 ÷ 2 = 32,768' : 'halving factor 0.5'],
            ['2,000 successes from start', good ? '65,536 × 2 = 131,072' : 'growth factor 2'],
          ],
      88,
      227,
      780,
      73,
    );
    return;
  }
  head(c, 'GRADIENT NORM   /   TWO IDENTICAL INPUTS', 'A bound of two, in which units?');
  const wrong = cue(k, 3, 'That is the norm'),
    divide = cue(k, 3, 'its norm returns'),
    correct = cue(k, 3, 'The lower run lands');
  const scaled = cue(k, 1, 'The stored components become');
  mono(
    c,
    scaled
      ? 'Scaled input [24, 32]   ·   initial norm 40   ·   scale 8'
      : '[3, 4]   true norm 5   ·   scale 8',
    56,
    156,
    22,
    P.white,
  );
  [
    ['Clip first', wrong ? a.wrongNorm : null, P.copper],
    ['Unscale first', correct ? a.correctNorm : divide ? 5 : null, P.teal],
  ].forEach(([label, n, col], i) => {
    const x = 291,
      w = 563,
      y = 245 + i * 105;
    txt(c, label, 54, y, 21, P.white);
    line(c, x, y, x + w, y, P.edge, 3);
    for (let j = 0; j <= 5; j++) {
      const xx = x + (w * j) / 5;
      line(c, xx, y - 5, xx, y + 7, P.dim);
      mono(c, j, xx, y + 24, 14, P.dim, 'center');
    }
    if (n !== null) {
      line(c, x, y, x + (w * n) / 5, y, col, 6);
      dot(c, x + (w * n) / 5, y, 8, col);
      mono(c, n, x + (w * n) / 5, y - 26, 22, col, 'center');
    }
  });
  txt(c, 'Rulers in unscaled optimizer units', 480, 425, 19, P.dim, { align: 'center' });
  if (b === 2 && cue(k, 2, 'What will the optimizer get'))
    mono(c, 'Clipped scaled norm = 2      ÷ 8 → ?', 480, 471, 21, P.gold, 'center');
}
