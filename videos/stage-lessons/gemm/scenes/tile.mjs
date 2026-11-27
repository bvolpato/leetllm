// Scene 05: Four sums share the same panel: outer-product loom k=0 -> [[2,-1],[-2,1]], k=1 -> [[4,7],[1,13]].
import { markDecoration } from '../../cinematic-kit.mjs';
import {
  A,
  B,
  COSMOS,
  PANEL_K0,
  PANEL_K01,
  ROLE,
  aura,
  buildSystolicGemm3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tile(s, c) {
  const kCursor = s.value(0);
  const stage = s.value(0); // 1=load k=0 headers, 2=update k=0 sums, 3=slide k=1 & update sums

  const bgAura = aura(390, 20, 520, '#5ce1e622', '#60a5fa18');
  const { view: gemm3d } = buildSystolicGemm3d(kCursor, { x: 430, y: 20, unit: 98 });

  const title = heroTitle(['Four Sums Share', 'the Same Panel'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'SHARED-MEMORY PANEL LOOM · K = 0, 1',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const k = st >= 2.5 ? 1 : 0;
    const showHeaders = st >= 0.5;
    const sums =
      st < 1.5
        ? [
            [0, 0],
            [0, 0],
          ]
        : st < 2.5
          ? PANEL_K0
          : PANEL_K01;

    const colXs = [-520, -290];
    const rowYs = [25, 205];
    const nodes = [
      txt('OUTER-PRODUCT 3D PANEL', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        k === 0 ? 'Active slice: k = 0' : 'Active slice: k = 1 (in shared memory)',
        430,
        420,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    // Row headers from A[:, k]
    for (let r = 0; r < 2; r++) {
      const y = rowYs[r];
      const val = A[r][k];
      nodes.push(
        glassCell(-745, y, 132, 92, showHeaders ? ROLE.a : COSMOS.dim, {
          fill: '#10203b',
          glow: showHeaders ? 9 : 0,
        }),
        txt(`A[${r},${k}]`, -745, y - 72, 26, ROLE.a, 'mono'),
        txt(showHeaders ? String(val) : '·', -745, y, 42, ROLE.a, 'mono'),
      );
      if (showHeaders) {
        nodes.push(line([-676, y], [-620, y], { stroke: ROLE.a, width: 2.8 }).opacity(0.8));
      }
    }

    // Column headers from B[k, :]
    for (let col = 0; col < 2; col++) {
      const x = colXs[col];
      const val = B[k][col];
      nodes.push(
        glassCell(x, -145, 132, 92, showHeaders ? ROLE.b : COSMOS.dim, {
          fill: '#281122',
          glow: showHeaders ? 9 : 0,
        }),
        txt(`B[${k},${col}]`, x, -218, 26, ROLE.b, 'mono'),
        txt(showHeaders ? String(val) : '·', x, -145, 42, ROLE.b, 'mono'),
      );
      if (showHeaders) {
        nodes.push(line([x, -96], [x, -42], { stroke: ROLE.b, width: 2.8 }).opacity(0.8));
      }
    }

    // Four retained C accumulator crossings
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 2; col++) {
        const cx = colXs[col];
        const cy = rowYs[r];
        const delta = A[r][k] * B[k][col];
        const isBottom = r === 1;
        const borderCol = st >= 1.5 ? (isBottom ? COSMOS.gold : ROLE.c) : COSMOS.dim;
        nodes.push(
          glassCell(cx, cy, 186, 118, borderCol, {
            fill: '#0d2030',
            glow: st >= 1.5 ? 9 : 0,
          }),
          txt(String(sums[r][col]), cx, cy - 12, 46, borderCol, 'mono').glow(6, borderCol),
          txt(
            st >= 1.5 ? `${A[r][k]}×${B[k][col]} = ${delta >= 0 ? '+' : ''}${delta}` : 'sum = 0',
            cx,
            cy + 36,
            26,
            COSMOS.muted,
            'mono',
          ),
        );
      }
    }

    nodes.push(
      txt(
        st >= 2.5
          ? 'Bottom row holds 1 and 13 · hold all 4 in registers'
          : st >= 1.5
            ? 'All 4 crossings updated from k = 0 panel'
            : 'Load k = 0, 1 panel into shared memory',
        -855,
        388,
        28,
        st >= 2.5 ? ROLE.good : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, gemm3d, title, live);
  orbitScene(s, c, gemm3d, { theta: -0.25, phi: 0.92 });

  c.on('load-panel', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'load-panel', 0.45) })),
  );
  c.on('first-crossing', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'first-crossing', 0.5) })),
  );
  c.on('second-crossing', () => {
    s.play(kCursor.to(1, { duration: remainDuration(c, 'second-crossing', 0.55) }));
    s.play(stage.to(3, { duration: remainDuration(c, 'second-crossing', 0.55) }));
  });
}
