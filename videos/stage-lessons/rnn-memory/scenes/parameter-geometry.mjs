// Scene 17: parameter-geometry: "How many parameters does this GRU have?"
// View 1: Affine block architecture comparison (RNN 1x12, GRU 3x12, LSTM 4x12).
// View 2: PyTorch GRU stored tensors (W_ih 6x3, W_hh 6x2, b_ih 6x1, b_hh 6x1 -> 42 total).
// View 3: Orbiting 3D Batch-First Tensor Geometry ([4, 5, 3] -> [4, 5, 2] + final slice [1, 4, 2]).
import {
  COSMOS,
  ROLE,
  box3d,
  cinemaAtmosphere,
  cinematic3d,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function parameterGeometry(s, c) {
  const title = heroTitle(['How many parameters', 'does this GRU have?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.cell,
  });

  const vBlocks = s.value(1);
  const vTorch = s.value(0);
  const vBatch = s.value(0);

  // View 1 state
  const showGroups = s.value(0);
  const showTotals = s.value(0);

  // View 2 state
  const hiTorch = s.value(0);
  const showSum42 = s.value(0);

  // View 3 state
  const showOutput = s.value(0);
  const showFinal = s.value(0);

  // VIEW 1: Affine blocks comparison (RNN=1, GRU=3, LSTM=4 blocks of 12 params)
  const blockView = guardedDynamic(vBlocks, (alpha) => {
    const nodes = [
      txt(
        '1 affine block:  2 × (3 input + 2 recurrent) + 2 biases = 12 parameters',
        0,
        -245,
        32,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    if (showGroups.value > 0.02) {
      const gA = showGroups.value * alpha;
      const specs = [
        { name: 'Vanilla RNN', blocks: ['cell'], x: -560, col: ROLE.input, total: '12' },
        { name: 'GRU', blocks: ['keep', 'reset', 'cand'], x: 0, col: ROLE.state, total: '36' },
        {
          name: 'LSTM',
          blocks: ['forget', 'write', 'cand', 'out'],
          x: 560,
          col: ROLE.cell,
          total: '48',
        },
      ];
      specs.forEach(({ name, blocks, x, col, total }) => {
        nodes.push(txt(name, x, -125, 36, col, 'serif', 'center').opacity(gA));
        const bW = 104;
        const bGap = 14;
        const rowW = blocks.length * bW + (blocks.length - 1) * bGap;
        blocks.forEach((lbl, idx) => {
          const bx = x - rowW / 2 + idx * (bW + bGap) + bW / 2;
          nodes.push(
            lumBar(bx, 30, bW, 132, { color: col, fillOpacity: 0.28, glow: 8, opacity: gA }),
            txt(lbl, bx, 6, 26, COSMOS.ink, 'sans', 'center').opacity(gA),
            txt('12', bx, 52, 30, col, 'mono', 'center').opacity(gA),
          );
        });
        if (showTotals.value > 0.02) {
          nodes.push(
            txt(`${total} params`, x, 205, 42, ROLE.cell, 'mono', 'center')
              .glow(9, ROLE.cell)
              .opacity(showTotals.value * alpha),
          );
        }
      });
    }

    return nodes;
  });

  // VIEW 2: PyTorch GRU stored tensors (3 gates x 2 rows = 6 rows)
  const torchView = guardedDynamic(vTorch, (alpha) => {
    const nodes = [
      txt(
        'PyTorch nn.GRU(3, 2) Stored Tensors (2 rows per gate)',
        0,
        -245,
        34,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    ];
    const tensors = [
      { name: 'weight_ih', cols: 3, shape: '6 × 3 = 18', x: -575 },
      { name: 'weight_hh', cols: 2, shape: '6 × 2 = 12', x: -165 },
      { name: 'bias_ih', cols: 1, shape: '6 × 1 = 6', x: 215 },
      { name: 'bias_hh', cols: 1, shape: '6 × 1 = 6', x: 565 },
    ];
    const rowCols = [ROLE.grad, ROLE.cell, ROLE.state]; // reset, keep, cand

    tensors.forEach(({ name, cols, shape, x }, idx) => {
      const lit = idx === 0 && hiTorch.value > 0.5;
      nodes.push(
        txt(name, x, -145, 30, lit ? ROLE.gold : COSMOS.ink, 'mono', 'center')
          .glow(lit ? 8 : 0, ROLE.gold)
          .opacity(alpha),
      );
      const cellS = 38;
      const gap = 8;
      const gridW = cols * cellS + (cols - 1) * gap;
      for (let r = 0; r < 6; r++) {
        const col = rowCols[Math.floor(r / 2)];
        const cy = -82 + r * (cellS + gap) + cellS / 2;
        for (let k = 0; k < cols; k++) {
          const cx = x - gridW / 2 + k * (cellS + gap) + cellS / 2;
          nodes.push(
            lumBar(cx, cy, cellS, cellS, {
              color: col,
              fillOpacity: lit ? 0.52 : 0.36,
              glow: lit ? 9 : 5,
              radius: 5,
              opacity: alpha,
            }),
          );
        }
      }
      nodes.push(txt(shape, x, 240, 30, ROLE.state, 'mono', 'center').opacity(alpha));
    });

    if (showSum42.value > 0.02) {
      nodes.push(
        txt(
          '18 + 12 + 6 + 6 = 42  (includes 6 recurrent bias params)',
          0,
          355,
          36,
          ROLE.cell,
          'mono',
          'center',
        )
          .glow(9, ROLE.cell)
          .opacity(showSum42.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Batch-First Tensor Geometry ([4, 5, 3] -> [4, 5, 2] + Final Slice [1, 4, 2])
  const tensor3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.5,
    unit: 95,
    focus: [0, 0, 0.2],
  }).at(-380, 65);

  // Build 4x5x1 stacked glowing sequence slices in 3D
  for (let b = 0; b < 4; b++) {
    for (let t = 0; t < 5; t++) {
      const isLast = t === 4;
      tensor3d.add(
        ...box3d(
          -2.2 + t * 0.92,
          -1.6 + b * 0.85,
          -0.35,
          0.72,
          0.62,
          0.7,
          isLast ? ROLE.gold : ROLE.state,
          isLast ? ROLE.gold : ROLE.state,
          isLast ? 0.62 : 0.38,
        ),
      );
    }
  }

  const batchView = guardedDynamic(vBatch, (alpha) => {
    const out = showOutput.value > 0.5;
    const fin = showFinal.value > 0.5;
    const nodes = [
      txt(
        out
          ? 'Output: one hidden vector per step'
          : 'Input batch: 4 sequences × 5 events × 3 features',
        0,
        -245,
        32,
        out ? ROLE.state : ROLE.input,
        'mono',
        'center',
      ).opacity(alpha),
      // 2D clean slice grid on the left (4 sequences x 5 steps)
      txt(
        'Batch (4 seqs) × Time (5 events)',
        -430,
        -155,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    const startX = -715;
    const startY = -65;
    const colGap = 142;
    const rowGap = 92;
    const widthCount = out ? 2 : 3;
    const tileCol = out ? ROLE.state : ROLE.input;

    for (let b = 0; b < 4; b++) {
      const ry = startY + b * rowGap;
      nodes.push(
        txt(`seq ${b + 1}`, startX - 75, ry, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      );
      for (let t = 0; t < 5; t++) {
        const rx = startX + t * colGap;
        const isLast = fin && t === 4;
        for (let f = 0; f < widthCount; f++) {
          const fx = rx + (f - (widthCount - 1) / 2) * 28;
          nodes.push(
            lumBar(fx, ry, 22, 46, {
              color: isLast ? ROLE.gold : tileCol,
              fillOpacity: isLast ? 0.55 : 0.34,
              glow: isLast ? 10 : 4,
              radius: 4,
              opacity: alpha,
            }),
          );
        }
        if (isLast) {
          nodes.push(
            lumBar(rx, ry, 82, 66, {
              color: ROLE.gold,
              fillOpacity: 0.06,
              strokeWidth: 3,
              glow: 10,
              radius: 8,
              opacity: alpha,
            }),
          );
        }
      }
    }

    // Right side shape readouts
    const rx = 445;
    nodes.push(
      txt('Input shape:', rx, -110, 28, COSMOS.muted, 'sans', 'center').opacity(alpha),
      txt('[4, 5, 3]', rx, -58, 42, ROLE.input, 'mono', 'center').opacity(alpha),
    );
    if (showOutput.value > 0.02) {
      nodes.push(
        txt('Output shape (batch_first=True):', rx, 45, 28, COSMOS.muted, 'sans', 'center').opacity(
          showOutput.value * alpha,
        ),
        txt('[4, 5, 2]', rx, 98, 44, ROLE.state, 'mono', 'center')
          .glow(8, ROLE.state)
          .opacity(showOutput.value * alpha),
      );
    }
    if (showFinal.value > 0.02) {
      nodes.push(
        txt('Final hidden hₙ:', rx, 200, 28, ROLE.gold, 'sans', 'center').opacity(
          showFinal.value * alpha,
        ),
        txt('[1, 4, 2]', rx, 254, 46, ROLE.gold, 'mono', 'center')
          .glow(10, ROLE.gold)
          .opacity(showFinal.value * alpha),
        txt(
          'Axes: (layers × dirs, batch, hidden)',
          0,
          365,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(showFinal.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.cell, ROLE.state), title, blockView, torchView, batchView);

  playCue(s, c, 'parameter-geometry-0', (d) => s.play(showGroups.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'parameter-one-bias', (d) => s.play(showTotals.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  playCue(s, c, 'parameter-geometry-1', (d) => s.play(swapVis(vBlocks, vTorch, d)), { dur: 0.65 });
  playCue(s, c, 'parameter-pytorch', (d) => s.play(hiTorch.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'parameter-total', (d) => s.play(showSum42.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'parameter-geometry-2', (d) => s.play(swapVis(vTorch, vBatch, d)), { dur: 0.65 });
  playCue(s, c, 'parameter-output', (d) => s.play(showOutput.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'parameter-final', (d) => s.play(showFinal.to(1, { duration: d })), { dur: 0.45 });

  // Unused helper reference guard avoided: keep orbitScene ready for 3D scenes; tensor3d not added to avoid overlapping 2D grid.
  void tensor3d;
  void orbitScene;
}
