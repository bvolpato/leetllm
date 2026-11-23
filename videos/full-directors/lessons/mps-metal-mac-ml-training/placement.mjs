import {
  board,
  box,
  chip,
  ticket,
  grid,
  arrow,
  line,
  dot,
  text,
  mono,
  serif,
  note,
  cue,
  mix,
  ink,
  muted,
  pale,
  gpu,
  mint,
  cpu,
  gold,
  edge,
  red,
} from './bench.mjs';
import {
  backendChoice,
  tensorShapeContract,
  classifierFixture,
  classifierTrainingFixture,
} from '../../../films/mps-metal-mac-ml-training/arithmetic.mjs';

const shape = tensorShapeContract(4, 8, 16, 3),
  batchKiB = shape.bytes / 1024;
const fixture = classifierFixture(),
  training = classifierTrainingFixture();
export function refund(c, k, returning = false) {
  board(
    c,
    returning ? 'Why does the linear layer succeed now?' : 'Which line fails in the ticket classifier?',
    'TICKET 01   /   LINEAR CLASSIFIER',
  );
  const column = returning ? 0 : cue(k, 0, 'Look at the eight rows', 1.8);
  const meanCall = returning ? 0 : cue(k, 0, 'Average the positions', 0.6);
  const modelCall = returning ? 0 : cue(k, 0, 'then feed that vector', 0.6);
  const fold = returning
    ? cue(k, 0, 'Average its eight', 1.6)
    : cue(k, 1, 'The mean succeeds', 1.6);
  const travel = returning
    ? cue(k, 0, 'Carry the vector', 1.5)
    : cue(k, 1, 'At the linear layer', 1.5);
  const result = returning ? cue(k, 0, 'The forward pass returns') : cue(k, 1, 'The call stops here');
  const repair = returning ? 0 : cue(k, 1, 'To repair it');
  const base = returning ? mint : gold,
    device = returning ? 'mps:0' : 'cpu';
  ticket(c, 66, 175, 428, 94, { name: 'Please refund my order.', tag: '', color: base });
  mono(c, 'pooled = batch.mean(dim=1)', 83, 241, 22, ink);
  if (meanCall) line(c, 83, 257, 83 + 340 * meanCall, 257, cpu, 3);
  mono(c, 'batch · ' + device, 72, 291, 24, returning ? gpu : cpu);
  for (let i = 0; i < 8; i++) {
    const y = 310 + i * 21;
    const lit = i + 0.5 < column * 8;
    grid(c, 72, y, 16, 1, 310, 16, returning ? gpu : cpu, (_, j) => lit && j === 0 ? gold : null);
  }
  mono(c, 'batch[0] · 8 positions × 16 features', 73, 506, 19, muted);
  const x = mix(72, 480, fold) + 128 * travel;
  c.save();
  c.globalAlpha = fold;
  for (let i = 7; i >= 0; i--) {
    const y = mix(310 + i * 21, 378, fold);
    const width = mix(310, 235, fold);
    grid(c, x, y, 16, 1, width, 14, returning ? gpu : cpu, (_, j) => column && j === 0 ? gold : null);
  }
  c.restore();
  if (fold > 0.94) {
    mono(c, 'pooled · ' + device, x + 115, 352, 24, returning ? gpu : cpu, 'center');
    mono(c, '1 × 16', x + 115, 423, 18, ink, 'center');
  }
  chip(c, 871, 303, 235, 152, '', gpu);
  text(c, 'weights · mps:0', 988, 340, 26, pale, 'Sans', 'center');
  grid(c, 898, 372, 16, 3, 183, 55, mint);
  mono(c, 'model(pooled)', 989, 487, 25, ink, 'center');
  if (modelCall) line(c, 892, 505, 892 + 194 * modelCall, 505, gpu, 3);
  mono(c, 'Linear(16, 3)', 989, 522, 18, muted, 'center');
  if (result && !returning) {
    box(c, 850, 340, 10, 98, red, 2);
    text(c, 'device mismatch', 846, 291, 22, red, 'center');
  }
  if (result && returning) {
    mono(c, 'Ticket logits · before update', 1110, 190, 18, gpu, 'right');
    mono(c, fixture.logits[0].map((x) => x.toFixed(3)).join('  '), 1110, 240, 24, ink, 'right');
  }
  let msg = returning
    ? 'Both operands carry mps:0.'
    : 'First reduce the positions. Then score the vector.';
  if (!returning && result)
    msg = 'The CPU mean succeeded. The linear layer received incompatible operands.';
  if (repair) msg = 'batch = batch.to(model.weight.device)';
  if (returning && cue(k, 1, 'Take the update'))
    msg =
      'Four-ticket loss     ' +
      training.loss.toFixed(4) +
      '  →  ' +
      training.lossAfter.toFixed(4) +
      '     after one SGD step';
  note(c, msg, returning ? gpu : ink, returning ? '#d6e7da' : base);
}
export function backend(c, k) {
  board(c, 'From a Python call to GPU work', 'DISPATCH PATH   /   APPLE SILICON');
  const stages = [
    ['Python', 'submits model(x)', cpu],
    ['mps', 'PyTorch backend', gpu],
    ['MPS', 'Graph and kernels', gpu],
    ['Metal', 'GPU compute', gpu],
  ];
  const progress = cue(k, 0, 'When Python dispatches', 4);
  stages.forEach(([name, role, color], i) => {
    const x = 65 + i * 277;
    if (i < 3) arrow(c, x + 211, 288, x + 266, 288, edge);
    chip(c, x, 219, 203, 136, '', color);
    serif(c, name, x + 102, 262, 34, pale, 'center');
    text(c, role, x + 102, 314, 21, pale, 'Sans', 'center');
  });
  dot(c, 165 + 831 * progress, 386, 8, gpu);
  line(c, 165, 386, 996, 386, gpu, 2);
  if (k.beat.beatIndex === 0) {
    note(c, 'Python stays on CPU while device operations run on the GPU.');
    return;
  }
  const available = cue(k, 1, 'When both checks succeed') > 0.6;
  for (const [i, label, yes] of [
    [0, 'is_built()', true],
    [1, 'is_available()', available],
  ]) {
    const x = 90 + i * 495;
    dot(c, x, 472, 14, yes ? gpu : cpu);
    mono(c, label + '   ' + (yes ? 'True' : 'False'), x + 34, 472, 28);
  }
  note(c, 'Selected route     ' + backendChoice({ built: true, available }).toUpperCase(), gpu);
}
export function install(c, k) {
  const b = k.beat.beatIndex;
  board(
    c,
    b < 3 ? 'Match the release to the Mac' : 'Read both probes before changing the model',
    'PYTORCH INSTALLATION',
  );
  if (b < 3) {
    const rows =
      b === 2
        ? [
            ['Developer tools', 'xcode-select -p'],
            ['Python', 'python3 --version'],
            ['System', 'sw_vers'],
            ['Environment', 'python3 -m venv .venv'],
          ]
        : [
            ['Hardware', 'Apple silicon'],
            ['System', 'macOS 14+'],
            ['Interpreter', 'Python 3.10+'],
            ['Compiler tools', 'Xcode command-line tools'],
          ];
    box(c, 62, 183, 644, 335, pale, 7, edge);
    serif(c, b === 2 ? 'Machine inventory' : 'Apple setup for PyTorch 2.11', 84, 219, 32);
    rows.forEach(([a, v], i) => {
      const y = 278 + i * 57;
      line(c, 84, y - 25, 685, y - 25, edge, 1);
      text(c, a, 86, y, 19, muted);
      mono(c, v, 289, y, 21);
    });
    box(c, 735, 183, 398, 335, ink, 9);
    if (b === 0) {
      serif(c, 'A wheel imports.', 763, 270, 31, pale);
      serif(c, 'Can it place a tensor?', 763, 334, 29, gold);
    } else if (b === 1) {
      mono(c, 'PyTorch 2.15 note', 765, 243, 24, mint);
      serif(c, 'macOS 15+', 765, 335, 43, pale);
      text(c, 'Availability example', 765, 402, 23, pale);
    } else {
      mono(c, 'Mac  /  Pip  /  Python', 759, 239, 22, mint);
      text(c, 'Match the wheel to your', 759, 315, 24, pale);
      text(c, 'Python and architecture.', 759, 359, 24, pale);
    }
    note(c, 'Check the requirements for the wheel you intend to run.');
    return;
  }
  const states = [
    [false, false, 'Inspect the wheel'],
    [true, false, 'Check Mac and runtime'],
    [true, true, 'Place the classifier'],
  ];
  mono(c, 'BUILT', 81, 201, 20, muted);
  mono(c, 'AVAILABLE', 299, 201, 20, muted);
  mono(c, 'ROUTE', 550, 201, 20, muted);
  const active = cue(k, 3, 'An available runtime') ? 2 : cue(k, 3, 'If only the runtime') ? 1 : 0;
  states.forEach(([built, available, action], i) => {
    const y = 234 + i * 91,
      col = i === active ? (available ? mint : gold) : '#e5e6da';
    box(c, 62, y, 1070, 76, col, 7);
    mono(c, String(built), 82, y + 38, 28);
    mono(c, String(available), 298, y + 38, 28);
    mono(c, backendChoice({ built, available }), 550, y + 38, 28);
    text(c, action, 720, y + 38, 25);
  });
  note(
    c,
    b === 4
      ? 'Bug report     PyTorch release + first failing operation'
      : 'A build can include MPS while the machine cannot use it.',
  );
}
export function pool(c, k) {
  const shared = cue(k, 1, 'one physical pool', 0.65, false) > 0.15;
  board(
    c,
    shared ? 'Two device tags in one memory pool' : 'Follow the storage across the interconnect',
    'PHYSICAL MEMORY   /   LOGICAL PLACEMENT',
  );
  if (shared) box(c, 64, 216, 1070, 287, '#dce5d6', 15, edge);
  else {
    box(c, 64, 216, 460, 287, '#efdfbb', 15, edge);
    box(c, 680, 216, 454, 287, '#d6e7df', 15, edge);
  }
  text(c, shared ? 'Apple silicon  /  shared DRAM' : 'System RAM', 92, 252, 25);
  if (!shared) text(c, 'Discrete GPU  /  VRAM', 710, 252, 25);
  ticket(c, 100, 304, 364, 147, { tag: 'cpu', color: gold, gridShape: [16, 8], emphasis: cpu });
  const copied = cue(k, 0, 'cross into video memory', 1.2, false);
  if (shared) {
    chip(c, 765, 315, 306, 107, 'weights   mps:0');
  } else if (copied) {
    ticket(c, mix(100, 730, copied), 304, 364, 147, { tag: 'cuda:0', color: mint, gridShape: [16, 8] });
  }
  if (!shared) text(c, 'PCIe', 600, 480, 22, muted, 'Mono', 'center');
  if (shared && cue(k, 1, 'The mean can run on CPU')) {
    grid(c, 498, 369, 16, 1, 215, 18, cpu);
    mono(c, 'pooled · cpu', 605, 333, 20, cpu, 'center');
    if (cue(k, 1, 'The linear layer needs')) box(c, 734, 338, 8, 80, red, 2);
  }
  note(
    c,
    shared
      ? 'A CPU mean can read the ticket. The MPS linear layer needs a placed input.'
      : 'Device-changing copy    system RAM → GPU memory',
  );
}
export function assignment(c, k) {
  const copy = cue(k, 0, 'Save the result', 1.7),
    assigned = cue(k, 2, 'Assign the return value', 1.1);
  board(c, 'Follow the name to its allocation', 'PYTORCH TENSORS   /   ONE PHYSICAL POOL');
  box(c, 64, 195, 1072, 307, '#dae3d6', 16, edge);
  ticket(c, 102, 279, 400, 158, {
    name: 'source',
    tag: 'cpu',
    color: gold,
    gridShape: [8, 4],
    emphasis: cpu,
  });
  if (copy > 0) {
    c.save();
    c.globalAlpha = copy;
    ticket(c, mix(102, 693, copy), 279, 400, 158, { name: 'placed', tag: 'mps:0', gridShape: [8, 4] });
    c.restore();
  }
  const pointer = mix(300, 890, assigned);
  mono(c, 'batch', pointer, 219, 24, ink, 'center');
  arrow(c, pointer, 240, pointer, 269, ink);
  mono(c, batchKiB + ' KiB', 303, 468, 21, ink, 'center');
  if (copy === 1) mono(c, batchKiB + ' KiB', 892, 468, 21, ink, 'center');
  mono(
    c,
    '4 tickets × 8 positions   ·   each cell holds 16 float32 features',
    600,
    525,
    18,
    muted,
    'center',
  );
  const b = k.beat.beatIndex;
  note(
    c,
    b === 0
      ? 'placed = source.to(model.weight.device)'
      : b === 1
        ? 'Which copy will batch.mean(dim=1) read?'
        : assigned
          ? 'batch = placed      •      both copies alive = ' + 2 * batchKiB + ' KiB'
          : 'batch → source      •      CPU vector meets MPS weights',
  );
}
export function identity(c, k) {
  const b = k.beat.beatIndex;
  board(
    c,
    b < 2 ? 'Match each operand to the parameter' : 'Several core groups share one device',
    'DEVICE IDENTITY   /   SINGLE-GPU MODEL',
  );
  if (b < 2) {
    mono(c, 'next(model.parameters()).device', 81, 211, 27, gpu);
    chip(c, 817, 184, 264, 77, 'mps:0');
    const placed = cue(k, 1, 'destination for each batch', 1.1, 'use the parameter’s own device');
    for (const [i, name] of ['features', 'labels'].entries()) {
      ticket(c, 80 + i * 535, 322, 486, 122, {
        name,
        tag: placed > 0.5 ? 'mps:0' : 'cpu',
        color: placed > 0.5 ? mint : gold,
      });
      mono(c, i ? 'torch.long' : 'torch.float32', 97 + i * 535, 407, 21);
    }
    note(
      c,
      b === 0
        ? 'Device objects can differ     torch.device("mps") ≠ torch.device("mps:0")'
        : 'features = features.to(target)      •      labels = labels.to(target)',
    );
  } else {
    chip(c, 86, 217, 522, 281, '');
    grid(c, 132, 255, 4, 2, 433, 151, mint);
    mono(c, 'one Apple GPU', 347, 457, 26, pale, 'center');
    arrow(c, 632, 354, 722, 354, gpu);
    mono(c, 'device_count()', 762, 296, 26, muted);
    serif(c, '1 device', 761, 385, 52);
    note(
      c,
      b === 2
        ? 'A multi-card job also needs a supported communication backend.'
        : 'MLX selects where operations run on shared arrays.',
    );
  }
}
