// Scene 20: Change the loop nest without changing the row: FA1 (outer K/V) vs FA2 (outer Q, resident numerator).
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function loopOrder(s, c) {
  const phase = s.value(0);
  const showFa1 = s.value(0.5);
  const showFa2 = s.value(0);
  const showRes = s.value(0);
  const showBlocks = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e620', '#ffd16614');
  const title = heroTitle(['Loop Order:', 'FA1 vs FA2'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SAME ROW MATH · LESS HBM TRAFFIC',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const f1 = showFa1.value;
    const f2 = showFa2.value;
    const res = showRes.value;
    const blk = showBlocks.value;

    const u = (p * 0.42) % 1;

    const nodes = [
      line([0, -245], [0, 355], { stroke: '#253355', width: 2, dash: [8, 8] }).opacity(0.65),

      // LEFT: FlashAttention-1 (Outer K/V, Inner Q -> repeated O, m, ℓ HBM round trips)
      txt('FLASHATTENTION-1', -440, -245, 30, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(f1),
      txt('Outer: K, V tiles  ·  Inner: Q tiles', -440, -195, 26, COSMOS.muted, 'sans').opacity(f1),

      glassCell(-440, -80, 620, 110, COSMOS.gold, { fill: '#191722', glow: 6, opacity: f1 }),
      txt('ON-CHIP SRAM (Q₀, Q₁ swap in & out)', -440, -80, 26, COSMOS.gold, 'mono').opacity(f1),

      glassCell(-440, 175, 720, 110, COSMOS.rose, { fill: '#1c101b', glow: 8, opacity: f1 }),
      txt('HBM: write & read O, m, ℓ each step', -440, 175, 26, COSMOS.rose, 'mono').opacity(f1),

      // Glowing shuttle arcs down & up between SRAM and HBM
      glowingArc([-580, -24], [-580, 118], 0, {
        color: COSMOS.rose,
        width: 3.6,
        opacity: 0.85 * f1,
      }),
      glowingArc([-300, 118], [-300, -24], 0, {
        color: COSMOS.amber,
        width: 3.6,
        opacity: 0.85 * f1,
      }),
      glowDot(-580, -24 + u * 142, { radius: 6, color: COSMOS.rose, opacity: f1 }),
      glowDot(-300, 118 - u * 142, { radius: 6, color: COSMOS.amber, opacity: f1 }),

      // RIGHT: FlashAttention-2 (Outer Q, Inner K/V -> resident numerator on chip!)
      txt('FLASHATTENTION-2', 440, -245, 30, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.28, f2)),
      txt('Outer: Q tiles  ·  Inner: K, V stream', 440, -195, 26, COSMOS.muted, 'sans').opacity(
        Math.max(0.28, f2),
      ),

      glassCell(440, -80, 720, 118, COSMOS.emerald, {
        fill: '#0e2226',
        glow: res > 0.4 ? 12 : 5,
        opacity: Math.max(0.28, f2),
      }),
      txt('Q₀ + unnormalized N stay in SRAM', 440, -104, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.28, f2),
      ),
      txt(
        'Normalize once at end → 1 final write to HBM',
        440,
        -56,
        26,
        COSMOS.gold,
        'sans',
      ).opacity(Math.max(0.35, res)),

      // Streaming K,V tiles sweeping horizontally across right SRAM
      glassCell(275, 115, 270, 96, COSMOS.cyan, {
        fill: '#0e1d30',
        glow: 7,
        opacity: Math.max(0.28, f2),
      }),
      txt('K₀, V₀ stream', 275, 115, 26, COSMOS.cyan, 'mono').opacity(Math.max(0.28, f2)),
      glassCell(605, 115, 270, 96, COSMOS.cyan, {
        fill: '#0e1d30',
        glow: 7,
        opacity: Math.max(0.28, f2),
      }),
      txt('K₁, V₁ stream', 605, 115, 26, COSMOS.cyan, 'mono').opacity(Math.max(0.28, f2)),
      glowingArc([275, 65], [380, -18], -18, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: 0.85 * Math.max(0.28, f2),
      }),
      glowingArc([605, 65], [500, -18], -18, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: 0.85 * Math.max(0.28, f2),
      }),
      glowDot(275 + u * 105, 65 - u * 83, {
        radius: 6,
        color: COSMOS.cyan,
        opacity: Math.max(0.28, f2),
      }),
      glowDot(605 - u * 105, 65 - u * 83, {
        radius: 6,
        color: COSMOS.cyan,
        opacity: Math.max(0.28, f2),
      }),
    ];

    // Parallel thread-block assignment strip on bottom
    if (blk > 0.02) {
      nodes.push(
        txt(
          'PARALLEL THREAD BLOCKS (EVEN AT SMALL B × H)',
          440,
          250,
          26,
          COSMOS.gold,
          'mono',
        ).opacity(blk),
        ...Array.from({ length: 4 }, (_, i) => {
          const bx = 185 + i * 170;
          return group(
            rect(144, 62, { fill: '#14223a', stroke: COSMOS.gold, width: 2.2, radius: 8 })
              .at(bx, 315)
              .glow(6, COSMOS.gold)
              .opacity(blk),
            txt(`TB ${i}: Q${i}`, bx, 315, 26, COSMOS.gold, 'mono').opacity(blk),
          );
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('loop-order-beat-1', () => s.play(showFa1.to(1, { duration: 0.4 })));
  c.on('loop-order-beat-2', () => s.play(showFa2.to(1, { duration: 0.45 })));
  c.on('fa-resident-loop', () => s.play(showRes.to(1, { duration: 0.45 })));
  c.on('loop-order-beat-3', () =>
    s.play(showBlocks.to(1, { duration: remainDuration(c, 'loop-order-beat-3', 0.45) })),
  );
}
