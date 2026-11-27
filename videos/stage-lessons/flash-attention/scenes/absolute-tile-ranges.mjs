// Scene 19: Classify causal work by positions before counting tiles: 10 run / 6 skipped -> unequal intervals on absolute axis.
import { causalTileClass } from '../../../films/flash-attention/model.mjs';
import {
  COSMOS,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

const UNEQUAL_CLASS = causalTileClass(128, 255, 128, 191);

export default function absoluteTileRanges(s, c) {
  const showCounts = s.value(0);
  const showFrac = s.value(0);
  const showUnequal = s.value(0);

  const bgAura = aura(0, 20, 560, '#ffd1661e', '#5ce1e618');
  const title = heroTitle(['Count Tiles by', 'Absolute Positions'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'CAUSAL WORK CLASSIFICATION',
  });

  const eq = glowTex(
    String.raw`\frac{T(T+1)}{2} = 10\;\text{run},\qquad \frac{T(T-1)}{2} = 6\;\text{skip}`,
    {
      x: 340,
      y: -355,
      size: 34,
      color: COSMOS.gold,
    },
  );

  const live = guardedDynamic(1, () => {
    const sc = showCounts.value;
    const sf = showFrac.value;
    const su = showUnequal.value;

    const nodes = [
      // Left: Compact 4x4 tile grid (10 computed, 6 skipped)
      txt('T = 4 EQUAL TILES (16 PAIRS)', -565, -205, 26, COSMOS.cyan, 'mono'),
    ];

    const cell = 84;
    const gap = 10;
    const gx0 = -745;
    const gy0 = -165;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const cx = gx0 + col * (cell + gap) + cell * 0.5;
        const cy = gy0 + r * (cell + gap) + cell * 0.5;
        const kind = col > r ? 'future' : col === r ? 'diag' : 'past';
        const colHex =
          kind === 'future' ? COSMOS.rose : kind === 'diag' ? COSMOS.gold : COSMOS.cyan;
        nodes.push(
          rect(cell, cell, {
            fill: kind === 'future' ? '#130e1c' : kind === 'diag' ? '#241e12' : '#0f2438',
            stroke: colHex,
            width: 2,
            dash: kind === 'future' ? [6, 5] : undefined,
            radius: 8,
          })
            .at(cx, cy)
            .opacity(kind === 'future' ? 0.5 : 0.94),
          txt(kind === 'future' ? '×' : kind === 'diag' ? 'D' : 'P', cx, cy, 28, colHex, 'mono'),
        );
      }
    }

    if (sc > 0.02) {
      nodes.push(
        txt('6 past + 4 diag = 10 run · 6 skip', -565, 248, 26, COSMOS.gold, 'mono').opacity(sc),
      );
    }
    if (sf > 0.02) {
      nodes.push(
        txt('Computed fraction = 1/2 + 1/(2T) → 1/2', -565, 306, 26, COSMOS.cyan, 'mono').opacity(
          sf,
        ),
      );
    }

    // Right: Unequal-width absolute position axis [0 .. 255]
    const ax0 = -150;
    const ax1 = 810;
    const mapPos = (pos) => ax0 + (pos / 256) * (ax1 - ax0);
    const axisY = 60;

    nodes.push(
      glassCell(330, 50, 1020, 470, su > 0.5 ? COSMOS.emerald : '#263455', {
        fill: '#0d1426',
        glow: su > 0.5 ? 8 : 0,
        opacity: Math.max(0.4, su),
      }),
      txt(
        'UNEQUAL TILE WIDTHS · ABSOLUTE POSITION AXIS',
        330,
        -135,
        26,
        COSMOS.emerald,
        'mono',
      ).opacity(Math.max(0.4, su)),
      line([ax0, axisY], [ax1, axisY], { stroke: '#4d618f', width: 2.6 }).opacity(
        Math.max(0.4, su),
      ),
    );

    for (const pos of [0, 64, 128, 192, 256]) {
      const px = mapPos(pos);
      nodes.push(
        line([px, axisY - 12], [px, axisY + 12], { stroke: '#6c82b8', width: 2 }).opacity(
          Math.max(0.4, su),
        ),
        txt(String(pos), px, axisY + 42, 26, COSMOS.muted, 'mono').opacity(Math.max(0.4, su)),
      );
    }

    // Query tile Q1 [128..255] (width 128, tile index 1)
    const qx0 = mapPos(128);
    const qx1 = mapPos(256);
    const kx0 = mapPos(128);
    const kx1 = mapPos(192);

    nodes.push(
      rect(qx1 - qx0, 56, { fill: '#282112', stroke: COSMOS.gold, width: 2.6, radius: 8 })
        .at((qx0 + qx1) * 0.5, axisY - 68)
        .glow(8, COSMOS.gold)
        .opacity(Math.max(0.35, su)),
      txt('Q tile 1: [128..255]', (qx0 + qx1) * 0.5, axisY - 68, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.35, su),
      ),
      rect(kx1 - kx0, 56, { fill: '#0f2836', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
        .at((kx0 + kx1) * 0.5, axisY + 108)
        .glow(8, COSMOS.cyan)
        .opacity(Math.max(0.35, su)),
      txt('K2: 128–191', (kx0 + kx1) * 0.5, axisY + 108, 26, COSMOS.cyan, 'mono').opacity(
        Math.max(0.35, su),
      ),
    );

    if (su > 0.02) {
      nodes.push(
        txt(
          `Index 2 > 1 would falsely skip: true class: ${UNEQUAL_CLASS.toUpperCase()}`,
          330,
          232,
          26,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(su),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('absolute-tile-ranges-beat-1', () => s.play(showCounts.to(0.6, { duration: 0.35 })));
  c.on('fa-tile-count', () => s.play(showCounts.to(1, { duration: 0.4 })));
  c.on('absolute-tile-ranges-beat-2', () => s.play(showFrac.to(1, { duration: 0.45 })));
  c.on('absolute-tile-ranges-beat-3', () =>
    s.play(showUnequal.to(1, { duration: remainDuration(c, 'absolute-tile-ranges-beat-3', 0.55) })),
  );
}
