import { C, mix, routePen, smooth } from './drawing.mjs';
import { projection, queryCost, head } from './examples.mjs';

export function query(p) {
  const { b, cue, header, foot, label, mono, grid, line, box, dot } = p;
  header(
    'One query projection  /  unmerged LoRA',
    b === 3 ? 'Which rows belong to the same head?' : 'Where does one rank disappear?',
  );
  const lift = smooth(cue(2, 'Lift the second row', 1.3));
  const rank = lift === 1 ? 1 : 2,
    cut = smooth(cue(3, 'Lift its two output rows', 1.4)),
    out = cut === 1 ? head.kept.length * 2 : 8,
    cost = queryCost(out, rank);
  const firstBase = cue(0, 'Follow the token', 3.6);
  const replay = cue(2, 'Run cat again', 2.8);
  const baseTrace = b < 2 ? firstBase : replay;
  const adapterTrace = b < 2 ? cue(0, 'The same input', 4) : replay;
  label('Frozen query weight', 488, 164, 20, C.blue, { bold: true });
  label(cut > 0 && cut < 1 ? 'slicing rows' : out + ' outputs × 8 inputs', 704, 229, 19, C.blue);
  label('One token', 60, 288, 19, C.dim);
  box(58, 312, 95, 58, C.white, C.ink, 25);
  mono('cat', 105, 341, 27, C.ink, 'center');
  line(
    [
      [153, 341],
      [201, 341],
    ],
    C.ink,
    3,
  );
  dot(201, 341, 5, C.ink);
  line(
    [
      [201, 341],
      [201, 253],
      [488, 253],
    ],
    C.blue,
    3,
  );
  line(
    [
      [201, 341],
      [201, 431],
      [351, 431],
    ],
    C.teal,
    3,
  );
  line(
    [
      [608, 253],
      [972, 253],
      [972, 341],
      [1020, 341],
    ],
    C.blue,
    3,
  );
  line(
    [
      [491, 431],
      [681, 431],
    ],
    C.teal,
    3,
  );
  line(
    [
      [725, 431],
      [972, 431],
      [972, 341],
    ],
    C.teal,
    3,
  );
  for (let row = 0; row < 8; row++) {
    const removed = !head.kept.includes(Math.floor(row / 2));
    if (removed && cut === 1) continue;
    const delta = removed ? 0 : row > 3 ? -2 * cut : 0;
    p.ctx.save();
    p.ctx.globalAlpha = removed ? 1 - cut : 1;
    const dx = removed ? cut * 53 : 0;
    grid(488 + dx, 186 + (row + delta) * 15, 1, 8, 15, C.blue);
    grid(681 + dx, 367 + (row + delta) * 16, 1, 1, 16, C.teal);
    line(
      [
        [488 + dx, 186 + (row + delta) * 15],
        [608 + dx, 186 + (row + delta) * 15],
      ],
      C.paper,
      1,
    );
    line(
      [
        [681 + dx, 367 + (row + delta) * 16],
        [697 + dx, 367 + (row + delta) * 16],
      ],
      C.paper,
      1,
    );
    p.ctx.restore();
  }
  // The second A row and B column share an index and detach together.
  grid(351, 416, 1, 8, 16, C.teal);
  if (lift < 1) {
    p.ctx.save();
    p.ctx.globalAlpha = 1 - lift;
    grid(351, 434 + lift * 37, 1, 8, 16, C.teal);
    grid(699 + lift * 40, 367, 8, 1, 16, C.teal);
    p.ctx.restore();
  }
  label('A  ·  input to rank', 341, 373, 20, C.teal, { bold: true });
  label('B  ·  rank to query', 629, 332, 20, C.teal, { bold: true });
  mono(lift > 0 && lift < 1 ? 'cutting' : rank + ' × 8', 410, 491, 19, C.teal, 'center');
  mono(
    (lift > 0 && lift < 1) || (cut > 0 && cut < 1) ? 'cutting' : out + ' × ' + rank,
    698,
    521,
    19,
    C.teal,
    'center',
  );
  dot(1043, 341, 23, C.white, C.ink);
  mono('+', 1043, 341, 29, C.ink, 'center');
  label('query', 1081, 341, 22);
  routePen(
    p,
    [
      [201, 341],
      [201, 253],
      [488, 253],
      [608, 253],
      [972, 253],
      [972, 341],
      [1016, 341],
    ],
    baseTrace,
    '#6d8998',
  );
  if (b > 0 || adapterTrace > 0)
    routePen(
      p,
      [
        [201, 341],
        [201, 431],
        [351, 431],
        [479, 431],
        [681, 431],
        [697, 431],
        [972, 431],
        [972, 341],
        [1016, 341],
      ],
      adapterTrace,
      '#529186',
    );
  if (cue(0, 'The same input') && (!cut || cue(3, 'The rank-one adapter')))
    mono(cost.base + ' pairs', 720, 205, 32, C.blue);
  const showCost = (b < 2 && cue(0, 'Both paths meet')) || (b >= 2 && cue(2, 'Eight belong'));
  if (showCost && (!cut || cue(3, 'Now the second training')))
    mono(cost.adapter + ' pairs', 785, 405, 30, C.teal);
  foot(
    b === 0
      ? 'Both paths read the same eight features.'
      : b === 1
        ? 'Predict the next pass with one rank instead of two.'
        : b === 2
          ? 'Frozen weights still carry the forward pass and can carry an input gradient.'
          : 'Each query output feature has a matching output row in B.',
    C.blue,
  );
}

export function cost(p) {
  const { b, cue, header, foot, label, mono, grid, box, line } = p;
  if (b === 3) {
    header('Weight storage and execution', 'What changes inside the query matrix?');
    const pack = cue(3, 'Pack each weight', 1),
      cut = cue(3, 'Now physically remove', 1);
    const cell = 26,
      x = 250,
      y = 210,
      rows = 8;
    grid(x, y, rows, 8, cell, C.ice);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < 8; c++) {
        if (r >= 6 && cut > 0) {
          box(x + c * cell, y + r * cell, cell, cell, C.paper);
          if (cut === 1) continue;
        }
        p.ctx.save();
        p.ctx.globalAlpha = r >= 6 ? 1 - cut : 1;
        const bitWidth = mix(18, 4.5, pack);
        box(x + c * cell + 3, y + r * cell + 7 + (r >= 6 ? cut * 27 : 0), bitWidth, 12, C.blue);
        p.ctx.restore();
      }
    label('Frozen query weights', x, 176, 20, C.blue, { bold: true });
    label('Storage per weight', 610, 204, 20, C.dim);
    mono(pack === 1 ? '4 bits' : pack === 0 ? '16 bits' : 'packing…', 610, 250, 39, C.blue);
    label('Dense operation per token', 610, 332, 20, C.dim);
    mono(
      cut === 1 ? '6 × 8 = 48 pairs' : cut === 0 ? '8 × 8 = 64 pairs' : 'removing rows…',
      610,
      384,
      30,
      C.ink,
    );
    label('Each cell holds one weight.', x, 467, 20);
    foot('Projection pairs count rows and columns. Packed bits determine storage.', C.blue);
    return;
  }
  header('One transformer layer  /  hidden width 8', 'How much work survives freezing?');
  const small = 8,
    s = 8,
    xs = [68, 156, 244, 332];
  const showFF = b >= 1,
    baseReady = cue(2, 'Send four tokens'),
    four = cue(2, 'One rank-one target');
  const tokens = cue(2, 'The base now accounts') ? 4 : 1,
    v = projection(8, 32, 1, tokens);
  label('Attention projections', 67, 186, 23, C.blue, { bold: true });
  xs.forEach((x, i) => {
    grid(x, 250, small, small, s, C.blue);
    mono(['Q', 'K', 'V', 'O'][i], x + 32, 340, 21, C.blue, 'center');
  });
  if (cue(0, 'Put the four together')) mono('4 × 8 × 8', 70, 390, 24, C.blue);
  if (b > 0 || p.end(0)) mono('256 / token', 70, 441, 30, C.blue);
  if (showFF) {
    label('Feed-forward projections', 497, 186, 23, C.teal, { bold: true });
    grid(501, 213, 32, 8, s, C.teal);
    grid(649, 299, 8, 32, s, C.teal);
    mono('up', 534, 493, 21, C.teal, 'center');
    mono('down', 775, 387, 21, C.teal, 'center');
    mono('32 × 8', 579, 235, 17, C.teal);
    mono('8 × 32', 775, 271, 17, C.teal, 'center');
    if (baseReady) mono('+ 512 / token', 672, 442, 28, C.teal);
  }
  if (b === 2) {
    line(
      [
        [953, 186],
        [953, 494],
      ],
      C.fine,
    );
    label(tokens === 1 ? 'One token' : 'Four tokens', 985, 200, 20, C.dim);
    if (baseReady && (tokens === 1 || four)) {
      mono(v.base.toLocaleString('en-US'), 984, 262, 39, C.blue);
      label('base pairs', 984, 311, 20, C.blue);
    }
    if (cue(2, 'Attention scores')) {
      mono(String(v.adapter), 984, 376, 39, C.teal);
      label('adapter pairs', 984, 421, 20, C.teal);
    }
  }
  foot(
    b === 0
      ? 'One cell counts one multiplication and its accumulation.'
      : b === 1
        ? 'One up projection and one down projection run for each token.'
        : 'Base pairs = tokens × (4d² + 2dm)     •     One square LoRA target adds tokens × 2dr.',
  );
}
