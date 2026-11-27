// Scene 06: Where does a new warp start? 32-lane SIMT hardware warp strips and block-boundary isolation.
import {
  COSMOS,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function warps(s, c) {
  const firstFill = s.value(0);
  const secondFill = s.value(0);
  const mode36 = s.value(0);
  const mainFill = s.value(0);
  const remFill = s.value(0);

  const bgAura = aura(0, 30, 560, '#5ce1e622', '#ff6b8b14');

  const title = heroTitle(['32-Lane Warps', 'Never Cross Blocks'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'SIMT SCHEDULING · 32 LANES PER WARP',
  });

  const eq8of64 = glowTex('\\frac{8}{64} = 12.5\\% \\; \\text{active lanes}', {
    x: 0,
    y: 325,
    size: 40,
    color: COSMOS.gold,
  });

  const eq36of64 = glowTex('\\frac{36}{64} = 56.25\\% \\; \\text{active lanes}', {
    x: 0,
    y: 325,
    size: 40,
    color: COSMOS.emerald,
  });

  const live = guardedDynamic(1, () => {
    const is36 = mode36.value > 0.5;
    const rows = is36
      ? [
          {
            block: 'Block 0',
            warp: 'Warp 0 (0..31)',
            filled: Math.floor(mainFill.value * 32 + 1e-6),
            color: COSMOS.cyan,
            startIdx: 0,
          },
          {
            block: 'Block 0',
            warp: 'Warp 1 (32..35)',
            filled: Math.floor(remFill.value * 4 + 1e-6),
            color: COSMOS.gold,
            startIdx: 32,
          },
        ]
      : [
          {
            block: 'Block 0',
            warp: 'Warp 0',
            filled: Math.floor(firstFill.value * 4 + 1e-6),
            color: COSMOS.cyan,
            startIdx: 0,
          },
          {
            block: 'Block 1',
            warp: 'Warp 0',
            filled: Math.floor(secondFill.value * 4 + 1e-6),
            color: COSMOS.rose,
            startIdx: 4,
          },
        ];

    const nodes = [
      txt(
        is36
          ? 'ONE 36-THREAD BLOCK · THREADS 31 AND 32 SPLIT ACROSS WARPS'
          : 'TWO 4-THREAD BLOCKS · 28 IDLE LANES PER WARP',
        -855,
        -205,
        26,
        is36 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    const laneW = 42;
    const laneGap = 4;
    const gridX0 = -580;

    for (const ln of [0, 8, 16, 24, 31]) {
      const lx = gridX0 + ln * (laneW + laneGap) + laneW * 0.5;
      nodes.push(txt(`L${ln}`, lx, -152, 26, COSMOS.muted, 'mono'));
    }

    rows.forEach((row, rIdx) => {
      const cy = -65 + rIdx * 222;
      nodes.push(
        txt(row.block, -855, cy - 18, 30, row.color, 'mono', 'left'),
        txt(row.warp, -855, cy + 22, 26, COSMOS.muted, 'mono', 'left'),
        glassCell(
          gridX0 + 16 * (laneW + laneGap) - 2,
          cy,
          32 * (laneW + laneGap) + 14,
          122,
          '#476396',
          {
            fill: '#0e1629',
            glow: 5,
          },
        ),
      );

      for (let lane = 0; lane < 32; lane++) {
        const lx = gridX0 + lane * (laneW + laneGap) + laneW * 0.5;
        const active = lane < row.filled;
        const isBoundary = is36 && ((rIdx === 0 && lane === 31) || (rIdx === 1 && lane === 0));
        const fill = active ? (isBoundary ? COSMOS.gold : row.color) : '#18243d';
        const stroke = active ? (isBoundary ? '#fff5cc' : row.color) : '#4c6799';
        nodes.push(
          rect(laneW - 2, 90, { fill, stroke, width: isBoundary ? 3 : 1.6, radius: 5 })
            .at(lx, cy)
            .opacity(active ? 0.94 : 0.88),
        );
      }

      // Boundary markers underneath
      if (!is36 && row.filled > 0) {
        nodes.push(
          txt('local 0..3 active', gridX0, cy + 88, 26, row.color, 'mono', 'left'),
          txt(
            '28 idle lanes',
            gridX0 + 32 * (laneW + laneGap),
            cy + 88,
            26,
            COSMOS.dim,
            'mono',
            'right',
          ),
        );
      } else if (is36) {
        if (rIdx === 0 && row.filled >= 32) {
          nodes.push(
            txt('lane 0', gridX0, cy + 88, 26, COSMOS.cyan, 'mono', 'left'),
            txt(
              'thread 31 (end of warp 0)',
              gridX0 + 32 * (laneW + laneGap),
              cy + 88,
              26,
              COSMOS.gold,
              'mono',
              'right',
            ),
          );
        }
        if (rIdx === 1 && row.filled >= 4) {
          nodes.push(
            txt('thread 32..35 (new warp 1)', gridX0, cy + 88, 26, COSMOS.gold, 'mono', 'left'),
            txt(
              'divergent branches mask lanes',
              gridX0 + 32 * (laneW + laneGap),
              cy + 88,
              26,
              COSMOS.muted,
              'sans',
              'right',
            ),
          );
        }
      }
    });

    // Persistent lower hardware summary bar so empty-space share stays well below 40%
    nodes.push(
      glassCell(0, 444, 1660, 62, COSMOS.blue, { fill: '#0f182c', glow: 6 }),
      txt(
        'Hardware schedules 32 lanes per warp · choose block sizes as multiples of 32 in production',
        0,
        447,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('populate-warps', () => s.play(firstFill.to(1, { duration: 0.6 })));
  c.on('next-block-warp', () => s.play(secondFill.to(1, { duration: 0.6 })));
  c.show('next-block-warp', eq8of64, { fade: 0.35 });
  c.hide('larger-block', eq8of64, { fade: 0.2 });
  c.on('larger-block', () => {
    s.play(mode36.to(1, { duration: 0.1 }));
    s.play(mainFill.to(1, { duration: 0.9 }));
  });
  c.on('warp-remainder', () => {
    const dur = remainDuration(c, 'warp-remainder', 0.65);
    s.play(remFill.to(1, { duration: dur }));
  });
  c.show('warp-remainder', eq36of64, { fade: 0.35 });
}
