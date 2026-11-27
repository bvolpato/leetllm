// Scene 28: Fold the correction into the base: Exact 2x2 merge W_0 + 2BA = [[2,1],[5,2]] + eval-mode parity + multi-adapter routing tabs.
import {
  COSMOS,
  EXAMPLE,
  FWD_SCALE2,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  matrixGrid,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function merge(s, c) {
  const hlUpdate = s.value(0);
  const hlBase = s.value(0);
  const showMerged = s.value(0);
  const showMulti = s.value(0);

  const bgAura = aura(100, 10, 620, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['Fold the Correction', 'Into the Base'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'ZERO-OVERHEAD MERGING VS MULTI-TENANT ROUTING',
  });

  const eq = glowTex(String.raw`W_{\text{merged}} = W_0 + \frac{\alpha}{r} B A`, {
    x: 420,
    y: -365,
    size: 42,
    color: COSMOS.emerald,
  });

  const live = guardedDynamic(1, () => {
    const hu = hlUpdate.value;
    const hb = hlBase.value;
    const sm = showMerged.value;
    const mt = showMulti.value;

    const nodes = [
      // W_0 (2x2)
      txt('FROZEN W_0', -675, -185, 26, COSMOS.blue, 'mono'),
      matrixGrid(EXAMPLE.W, -675, -40, {
        cellW: 110,
        cellH: 88,
        color: hb > 0.2 ? COSMOS.blue : '#4c6294',
        fontSize: 34,
      }),

      txt('+', -470, -40, 50, COSMOS.muted, 'mono'),

      // Scaled update 2BA (2x2)
      txt('SCALED  2 · B A', -255, -185, 26, COSMOS.gold, 'mono'),
      matrixGrid(FWD_SCALE2.update, -255, -40, {
        cellW: 110,
        cellH: 88,
        color: hu > 0.2 ? COSMOS.gold : '#6b5e35',
        fontSize: 34,
      }),

      txt('=', -45, -40, 50, COSMOS.muted, 'mono'),

      // Merged W_merged (2x2)
      txt('MERGED DENSE LAYER', 200, -185, 26, COSMOS.emerald, 'mono'),
      matrixGrid(FWD_SCALE2.merged, 200, -40, {
        cellW: 116,
        cellH: 88,
        color: sm > 0.2 ? COSMOS.emerald : COSMOS.cyan,
        fontSize: 34,
      }),

      // Output verification callout on right
      glassCell(620, -40, 440, 212, sm > 0.2 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#0e2428',
        glow: sm > 0.2 ? 10 : 4,
      }),
      txt('EVAL MODE (NO DROPOUT)', 620, -108, 26, COSMOS.muted, 'mono'),
      txt(`x = [${EXAMPLE.x.join(', ')}]`, 620, -48, 32, COSMOS.cyan, 'mono'),
      txt(
        `W_merged x = [${FWD_SCALE2.output.join(', ')}]`,
        620,
        14,
        32,
        COSMOS.emerald,
        'mono',
      ).glow(7, COSMOS.emerald),

      // Bottom zone: Multi-adapter shared-base option + exact base revision
      glassCell(0, 270, 1680, 224, mt > 0.2 ? COSMOS.gold : COSMOS.blue, {
        fill: '#10182d',
        glow: mt > 0.2 ? 9 : 4,
      }),
      txt(
        mt > 0.2
          ? 'MANY TASKS? KEEP ONE SHARED BASE + SEPARATE ADAPTERS'
          : 'DISTRIBUTIVITY: (W_0 + (α/r)BA)x = W_0 x + (α/r)B(Ax)',
        0,
        204,
        28,
        mt > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'mono',
      ),
    ];

    const tabs = [
      { label: 'Policy Adapter', col: COSMOS.gold, x: -490 },
      { label: 'Code Adapter', col: COSMOS.cyan, x: 0 },
      { label: 'Science Adapter', col: COSMOS.violet, x: 490 },
    ];
    tabs.forEach((tab) => {
      nodes.push(
        glassCell(tab.x, 298, 420, 88, tab.col, {
          fill: '#131b32',
          glow: mt > 0.2 ? 9 : 3,
          opacity: Math.max(0.45, mt),
        }),
        glowDot(tab.x - 170, 298, { radius: 7, color: tab.col, opacity: Math.max(0.45, mt) }),
        txt(tab.label, tab.x + 15, 298, 28, tab.col, 'mono').opacity(Math.max(0.45, mt)),
      );
    });

    nodes.push(
      txt(
        'Always store the exact base revision beside every adapter for rollback & reproducibility',
        0,
        424,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('merge-b1-1', () => s.play(hlUpdate.to(1, { duration: 0.4 })));
  c.on('merge-b1-2', () => s.play(hlBase.to(1, { duration: 0.4 })));
  c.on('merge-b2-1', () => s.play(showMerged.to(1, { duration: 0.5 })));
  c.on('merge-b3-1', () =>
    s.play(showMulti.to(1, { duration: remainDuration(c, 'merge-b3-1', 0.5) })),
  );
}
