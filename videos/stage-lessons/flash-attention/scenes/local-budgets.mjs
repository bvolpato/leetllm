// Scene 06: Fit logical tiles into distinct local resource budgets: H100 SMEM (228 KiB) vs Regs (256 KiB) vs 144 KiB tile.
import {
  COSMOS,
  H100_SPEC,
  TILE_128,
  aura,
  cinematic3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  siliconSlab3d,
  txt,
} from '../parts.mjs';

export default function localBudgets(s, c) {
  const showTiers = s.value(0.5);
  const showTile = s.value(0);
  const showSubtotal = s.value(0);
  const showUnequal = s.value(0);

  const bgAura = aura(-280, 40, 520, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['H100 Local', 'Resource Budgets'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SEPARATE SHARED MEMORY & REGISTERS',
  });

  // 3D stacked silicon cutaway on left-bottom
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 16.4,
    unit: 72,
    focus: [0, 0, 0.2],
  }).at(-450, 95);

  const regSlab = siliconSlab3d(2.3, 1.5, 2.0, 0.36, '#a87d20', COSMOS.gold, '#fff5cc', 0.68);
  const smemSlab = siliconSlab3d(2.3, 1.5, 0.35, 0.36, '#146f91', COSMOS.cyan, '#9ef5ff', 0.65);
  const hbmSlab = siliconSlab3d(2.75, 1.85, -1.5, 0.42, '#6e1d3b', COSMOS.rose, '#ff9ab2', 0.56);
  view3d.add(...hbmSlab, ...smemSlab, ...regSlab);

  const pieces = [
    { name: 'Q (128×64 FP16)', kib: TILE_128.q / 1024, col: COSMOS.gold },
    { name: 'K (128×64 FP16)', kib: TILE_128.k / 1024, col: COSMOS.cyan },
    { name: 'V (128×64 FP16)', kib: TILE_128.v / 1024, col: COSMOS.blue },
    { name: 'O (128×64 FP32)', kib: TILE_128.o / 1024, col: COSMOS.emerald },
    { name: 'S (128×128 FP32)', kib: TILE_128.s / 1024, col: COSMOS.violet },
  ];

  const live = guardedDynamic(1, () => {
    const ti = showTiers.value;
    const tl = showTile.value;
    const sub = showSubtotal.value;
    const uneq = showUnequal.value;

    const nodes = [
      // H100 SM local budgets callouts cleanly above and below 3D stack
      txt(
        `REG FILE · ${H100_SPEC.regFileKib} KiB (65,536 × 32b)`,
        -855,
        -225,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(ti),
      txt(
        `SMEM · ${H100_SPEC.smemTotalKib} KiB (≤ ${H100_SPEC.smemBlockMaxKib}/blk)`,
        -855,
        -175,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(ti),
      txt('HBM3 + Host DRAM (separate link)', -450, 442, 26, COSMOS.rose, 'mono').opacity(ti),

      // Right side: Tile inventory bar chart
      txt('128 × 128 SQUARE TILE (d = 64)', 80, -395, 26, COSMOS.gold, 'mono', 'left'),
    ];

    const maxBar = 540;
    const xLeft = 80;
    pieces.forEach((p, i) => {
      const y = -305 + i * 94;
      const fillFrac = Math.max(0.15, tl);
      const w = (p.kib / 64) * maxBar * fillFrac;
      nodes.push(
        txt(p.name, xLeft, y - 28, 26, p.col, 'mono', 'left').opacity(Math.max(0.35, tl)),
        rect(maxBar, 32, { fill: '#10182b', stroke: '#253457', width: 1.5, radius: 6 })
          .at(xLeft + maxBar * 0.5, y + 12)
          .opacity(0.9),
        rect(w, 24, { fill: p.col, stroke: null, radius: 5 })
          .at(xLeft + w * 0.5, y + 12)
          .glow(7, p.col)
          .opacity(0.9 * Math.max(0.3, tl)),
        txt(`${p.kib} KiB`, xLeft + maxBar + 22, y + 12, 28, COSMOS.ink, 'mono', 'left').opacity(
          Math.max(0.35, tl),
        ),
      );
    });

    if (sub > 0.02) {
      nodes.push(
        glassCell(445, 232, 730, 108, COSMOS.gold, { fill: '#1b1812', glow: 10, opacity: sub }),
        txt('LOGICAL SUBTOTAL (SPLIT SMEM + REGS)', 445, 200, 26, COSMOS.muted, 'mono').opacity(
          sub,
        ),
        txt(
          `16 + 16 + 16 + 32 + 64 = ${TILE_128.total / 1024} KiB`,
          445,
          250,
          34,
          COSMOS.gold,
          'mono',
        )
          .glow(7, COSMOS.gold)
          .opacity(sub),
      );
    }

    if (uneq > 0.02) {
      nodes.push(
        txt(
          'Unequal: Br×d (Q), Bc×d (K), Bc×dv (V), Br×dv (O)',
          430,
          368,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(uneq),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title, live);
  orbitScene(s, c, view3d, { theta: -0.32, phi: 0.98 });

  c.on('local-budgets-beat-1', () => s.play(showTiers.to(1, { duration: 0.4 })));
  c.on('local-budgets-beat-2', () => s.play(showTile.to(1, { duration: 0.55 })));
  c.on('fa-tile-inventory', () => s.play(showSubtotal.to(1, { duration: 0.45 })));
  c.on('local-budgets-beat-3', () =>
    s.play(showUnequal.to(1, { duration: remainDuration(c, 'local-budgets-beat-3', 0.5) })),
  );
}
