// Scene 20: How many warps fit on one SM? 64-warp SM resource grid (50% -> 25% occupancy) and 2-pass shared-tile reuse payoff.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TOKEN_VALUES,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  residentResources,
  tileReuse,
  txt,
} from '../parts.mjs';

export default function occupancyResources(s, c) {
  const showPart1 = s.value(1); // Beats 0 & 1: 64-warp SM grid (8 -> 32 -> 16 warps)
  const block1Prog = s.value(0);
  const fill4Prog = s.value(0);
  const doubleTileProg = s.value(0);

  const showPart2 = s.value(0); // Beat 2: 25% occupancy + 2-pass shared tile reuse
  const reuseProg = s.value(0);

  const bgAura = aura(0, 20, 560, '#60a5fa22', '#5ce1e614');

  const title = heroTitle(['SM Occupancy', 'vs Data Reuse'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'HYPOTHETICAL SM · 64 WARPS · 64 KiB SHARED · 65,536 REGS',
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const b1 = block1Prog.value;
    const f4 = fill4Prog.value;
    const dt = doubleTileProg.value;

    const sharedKiB = 16 + 16 * dt;
    const res = residentResources(sharedKiB);
    const resident =
      dt > 0.05 ? res.warps : f4 > 0.05 ? 8 + Math.round(f4 * 24) : Math.round(b1 * 8);
    const blocks = Math.round(resident / 8);
    const occPct = Math.round((resident / 64) * 100);

    const nodes = [
      txt(
        dt > 0.5
          ? '32 KiB TILE / BLOCK -> ONLY 2 BLOCKS FIT (25% OCCUPANCY)'
          : f4 > 0.5
            ? '16 KiB TILE / BLOCK -> 4 BLOCKS FILL 64 KiB SHARED MEMORY (50%)'
            : '1 BLOCK = 256 THREADS (8 WARPS · 8,192 REGISTERS)',
        -855,
        -205,
        26,
        dt > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    // 4 rows x 16 cols = 64 warp slots
    const x0 = -720;
    const y0 = -105;
    const cw = 84;
    const ch = 64;
    const gx = 92;
    const gy = 84;

    for (let i = 0; i < 64; i++) {
      const col = i % 16;
      const row = Math.floor(i / 16);
      const cx = x0 + col * gx;
      const cy = y0 + row * gy;
      const active = i < resident;
      const blkIdx = Math.floor(i / 8);
      const blkColors = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.emerald];
      const fill = active ? blkColors[blkIdx % 4] : '#101728';
      const stroke = active ? '#ffffff' : '#253352';

      nodes.push(
        rect(cw, ch, { fill, stroke, width: active ? 1.5 : 1.1, radius: 6 })
          .at(cx, cy)
          .opacity((active ? 0.9 : 0.65) * a),
      );
      if (col === 0) {
        nodes.push(
          txt(`${i}..${i + 15}`, x0 - 65, cy + 4, 26, COSMOS.muted, 'mono', 'right').opacity(a),
        );
      }
    }

    // Bottom resource meters
    const barCol = dt > 0.5 ? COSMOS.gold : COSMOS.emerald;
    nodes.push(
      glassCell(-390, 315, 900, 128, COSMOS.blue, { fill: '#0e172c', glow: 7, opacity: a }),
      txt(
        `${blocks} blocks × ${Math.round(sharedKiB)} KiB shared = ${Math.round(blocks * sharedKiB)} / 64 KiB`,
        -390,
        286,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        `Registers: ${(blocks * 8192).toLocaleString('en')} / 65,536`,
        -390,
        342,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(495, 315, 700, 128, barCol, { fill: '#0e1e26', glow: 9, opacity: a }),
      txt('RESIDENT WARP OCCUPANCY', 495, 282, 26, COSMOS.muted, 'mono').opacity(a),
      txt(`${resident} / 64 warps  (${occPct}%)`, 495, 340, 42, barCol, 'mono')
        .glow(7, barCol)
        .opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Keep 25% occupancy, reuse 8 global loads across 2 passes from shared tile
  const part2 = guardedDynamic(showPart2, (a) => {
    const rp = reuseProg.value;
    const loadP = Math.min(1, rp / 0.45);
    const readP = Math.max(0, Math.min(1, (rp - 0.45) / 0.55));
    const model = tileReuse(TOKEN_VALUES, 2, true);
    const completedReads = Math.min(16, Math.floor(readP * 16 + 1e-6));

    const nodes = [
      txt(
        'LARGER TILE (25% OCCUPANCY) · LOAD ONCE, READ TWICE FROM SHARED MEMORY',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // Mini 64-warp grid on the left showing 16/64 = 25%
      txt('16 / 64 warps (25%)', -600, -110, 30, COSMOS.blue, 'mono').opacity(a),
    ];

    for (let i = 0; i < 64; i++) {
      const cx = -790 + (i % 8) * 54;
      const cy = -45 + Math.floor(i / 8) * 44;
      const active = i < 16;
      nodes.push(
        rect(44, 32, {
          fill: active ? COSMOS.blue : '#11182b',
          stroke: active ? COSMOS.cyan : '#263452',
          width: 1.2,
          radius: 4,
        })
          .at(cx, cy)
          .opacity(a),
      );
    }

    // Right: global row -> shared tile -> Pass 1 & Pass 2
    nodes.push(
      txt('GLOBAL MEMORY (8 LOADS)', -220, -110, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('SHARED TILE (REUSED)', -220, 42, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('PASS 1', -265, 198, 26, COSMOS.gold, 'mono', 'right').opacity(a),
      txt('PASS 2', -265, 286, 26, COSMOS.emerald, 'mono', 'right').opacity(a),
    );

    TOKEN_VALUES.forEach((v, i) => {
      const cx = -185 + i * 136;
      const loaded = loadP * 8 >= i + 0.5;
      const p1Done = completedReads > i;
      const p2Done = completedReads > 8 + i;
      nodes.push(
        glassCell(cx, -45, 114, 72, COSMOS.blue, { fill: '#0f182e', glow: 5, opacity: a }),
        txt(String(v), cx, -42, 32, COSMOS.ink, 'mono').opacity(a),

        glassCell(cx, 105, 114, 72, loaded ? COSMOS.cyan : COSMOS.rule, {
          fill: '#0d202e',
          glow: loaded ? 7 : 0,
          opacity: a,
        }),
        txt(
          loaded ? String(v) : '·',
          cx,
          108,
          32,
          loaded ? COSMOS.cyan : COSMOS.dim,
          'mono',
        ).opacity(a),

        glassCell(cx, 198, 114, 64, p1Done ? COSMOS.gold : COSMOS.rule, {
          fill: '#1e1a12',
          glow: p1Done ? 7 : 0,
          opacity: a,
        }),
        txt(
          p1Done ? String(v) : '·',
          cx,
          200,
          28,
          p1Done ? COSMOS.gold : COSMOS.dim,
          'mono',
        ).opacity(a),

        glassCell(cx, 286, 114, 64, p2Done ? COSMOS.emerald : COSMOS.rule, {
          fill: '#0e2420',
          glow: p2Done ? 7 : 0,
          opacity: a,
        }),
        txt(
          p2Done ? String(v) : '·',
          cx,
          288,
          28,
          p2Done ? COSMOS.emerald : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 385, 1660, 88, COSMOS.emerald, { fill: '#0e1e26', glow: 8, opacity: a }),
      txt(
        `${Math.min(8, Math.floor(loadP * 8 + 1e-6))} global loads · ${completedReads} / ${model.sharedReads} shared reads  ->  verify answer & measure whole step`,
        0,
        388,
        30,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  c.on('occupancy-block', () => s.play(block1Prog.to(1, { duration: 0.7 })));
  c.on('occupancy-four', () => s.play(fill4Prog.to(1, { duration: 0.75 })));
  c.on('occupancy-two', () => s.play(doubleTileProg.to(1, { duration: 0.8 })));

  c.on('occupancy-reuse', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(reuseProg.to(1, { duration: remainDuration(c, 'occupancy-reuse', 1.65) }), 0.25),
      ),
    );
  });
}
