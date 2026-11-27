// Scene 03: A matrix mixes input directions: 2D column-vector scaling + head-to-tail sum + full dense update grid.
import {
  COSMOS,
  EXAMPLE,
  FWD_SCALE2,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  matrixGrid,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function linearLayer(s, c) {
  const hlMatrix = s.value(0);
  const col1Prog = s.value(0);
  const col2Prog = s.value(0);
  const sumProg = s.value(0);
  const denseProg = s.value(0);

  const bgAura = aura(300, 30, 560, '#60a5fa24', '#5ce1e616');
  const title = heroTitle(['A Matrix Mixes', 'Input Directions'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'LINEAR LAYER GEOMETRY',
  });

  const eq = glowTex(
    String.raw`W_0 x = 2 \begin{bmatrix} 1 \\ 3 \end{bmatrix} + 1 \begin{bmatrix} 2 \\ 4 \end{bmatrix} = \begin{bmatrix} 4 \\ 10 \end{bmatrix}`,
    {
      x: -515,
      y: 265,
      size: 32,
      color: COSMOS.ink,
    },
  );

  // 2D coordinate plane on the right half
  const ox = 85;
  const oy = 355;
  const ux = 148;
  const uy = 66;
  const toScreen = (vx, vy) => [ox + vx * ux, oy - vy * uy];

  const live = guardedDynamic(1, () => {
    const hm = hlMatrix.value;
    const c1 = col1Prog.value;
    const c2 = col2Prog.value;
    const sp = sumProg.value;
    const dp = denseProg.value;

    // Column vectors from EXAMPLE.W = [[1, 2], [3, 4]] and x = [2, 1]
    const v1 = [EXAMPLE.x[0] * EXAMPLE.W[0][0], EXAMPLE.x[0] * EXAMPLE.W[1][0]]; // [2, 6]
    const v2 = [EXAMPLE.x[1] * EXAMPLE.W[0][1], EXAMPLE.x[1] * EXAMPLE.W[1][1]]; // [2, 4]
    const out = FWD_SCALE2.base; // [4, 10]

    const nodes = [
      // Left: W_0 matrix + x input
      txt('WEIGHT MATRIX W_0', -705, -215, 26, COSMOS.blue, 'mono'),
      matrixGrid(EXAMPLE.W, -705, -80, {
        cellW: 112,
        cellH: 88,
        color: dp > 0.3 ? COSMOS.rose : hm > 0.2 ? COSMOS.cyan : COSMOS.blue,
        highlightCol: c1 > 0.2 && c2 < 0.2 ? 0 : c2 > 0.2 && sp < 0.2 ? 1 : -1,
        fontSize: 34,
      }),
      txt('INPUT x', -360, -215, 26, COSMOS.gold, 'mono'),
      matrixGrid([[EXAMPLE.x[0]], [EXAMPLE.x[1]]], -360, -80, {
        cellW: 112,
        cellH: 88,
        color: COSMOS.gold,
        fontSize: 34,
      }),
      glassCell(-535, 118, 560, 86, dp > 0.3 ? COSMOS.rose : COSMOS.cyan, {
        fill: '#121a30',
        glow: 7,
      }),
      txt(
        dp > 0.3 ? 'Full update: every entry changes' : 'Each input weights one column',
        -535,
        118,
        28,
        dp > 0.3 ? COSMOS.rose : COSMOS.cyan,
        'sans',
      ),
    ];

    // Right coordinate grid
    for (let gx = 0; gx <= 5; gx++) {
      const [px] = toScreen(gx, 0);
      const gl = line([px, oy - 11 * uy], [px, oy], { stroke: '#233154', width: 1.5 });
      gl.data.decoration = true;
      nodes.push(gl);
    }
    for (let gy = 0; gy <= 11; gy += 2) {
      const [, py] = toScreen(0, gy);
      const gl = line([ox, py], [ox + 5 * ux, py], { stroke: '#233154', width: 1.5 });
      gl.data.decoration = true;
      nodes.push(gl);
    }
    nodes.push(
      arrow([ox, oy], [ox + 5.2 * ux, oy], { stroke: COSMOS.muted, width: 2.5, tip: 10 }),
      arrow([ox, oy], [ox, oy - 11.4 * uy], { stroke: COSMOS.muted, width: 2.5, tip: 10 }),
      txt('output dim 1', ox + 4.2 * ux, oy + 44, 26, COSMOS.muted, 'mono'),
      txt('output dim 2', ox + 135, oy - 11.7 * uy, 26, COSMOS.muted, 'mono'),
    );

    // Base unscaled column ghosts
    const p0 = toScreen(0, 0);
    const col1End = toScreen(v1[0] * Math.max(0.5, c1), v1[1] * Math.max(0.5, c1));
    nodes.push(
      arrow(p0, col1End, { stroke: COSMOS.blue, width: 5, tip: 14 }).glow(9, COSMOS.blue),
      txt(
        c1 > 0.5 ? '2·[1, 3]' : '[1, 3]',
        c1 > 0.5 ? col1End[0] - 115 : col1End[0] + 72,
        c1 > 0.5 ? col1End[1] - 28 : col1End[1] + 10,
        28,
        COSMOS.blue,
        'mono',
      ),
    );

    // Second column attached head-to-tail
    if (c2 > 0.05) {
      const tip1 = toScreen(v1[0], v1[1]);
      const tip2 = toScreen(v1[0] + v2[0] * c2, v1[1] + v2[1] * c2);
      nodes.push(
        arrow(tip1, tip2, { stroke: COSMOS.cyan, width: 5, tip: 14 })
          .glow(9, COSMOS.cyan)
          .opacity(c2),
        txt('1·[2, 4]', tip2[0] - 150, tip2[1] - 42, 28, COSMOS.cyan, 'mono').opacity(c2),
      );
    }

    // Resultant sum vector [4, 10]
    if (sp > 0.05) {
      const tipOut = toScreen(out[0] * sp, out[1] * sp);
      nodes.push(
        arrow(p0, tipOut, { stroke: COSMOS.gold, width: 5.5, tip: 16 })
          .glow(11, COSMOS.gold)
          .opacity(sp),
        glowDot(tipOut[0], tipOut[1], { radius: 8, color: COSMOS.gold, opacity: sp }),
        txt(`[${out[0]}, ${out[1]}]`, tipOut[0] + 105, tipOut[1] - 6, 30, COSMOS.gold, 'mono')
          .glow(7, COSMOS.gold)
          .opacity(sp),
      );
    }

    if (dp > 0.05) {
      nodes.push(
        txt('ΔW matches full d_out × d_in shape', -535, 392, 28, COSMOS.rose, 'mono')
          .glow(6, COSMOS.rose)
          .opacity(dp),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('linear-layer-b1-1', () => s.play(hlMatrix.to(1, { duration: 0.4 })));
  c.on('linear-layer-b2-1', () => s.play(col1Prog.to(1, { duration: 0.55 })));
  c.on('linear-layer-b2-2', () => s.play(col2Prog.to(1, { duration: 0.55 })));
  c.on('linear-layer-b2-3', () => s.play(sumProg.to(1, { duration: 0.55 })));
  c.on('linear-layer-b3-1', () =>
    s.play(denseProg.to(1, { duration: remainDuration(c, 'linear-layer-b3-1', 0.5) })),
  );
}
