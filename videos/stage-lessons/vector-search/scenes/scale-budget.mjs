// Scene 9: Budgeting a larger index (100M x 1536 fp32 = 614.4 GB, 1M / 1024 IVF probes 5 vs 20, Recall-Latency Pareto frontier)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scaleBudget(s, c) {
  const phase = s.value(0);
  const show100M = s.value(0);
  const show5 = s.value(0);
  const show20 = s.value(0);
  const showFrontier = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Budgeting a', 'Larger Index'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SCALE ARITHMETIC · 100M FLOAT MEMORY · IVF PROBE SCALING · PARETO FRONTIER',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const s100 = show100M.value;
    const s5 = show5.value;
    const s20 = show20.value;
    const sf = showFrontier.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Pareto frontier curve on right
    const ox = 165;
    const oy = 215;
    const frontierPts = [
      [ox + 70, oy - 135],
      [ox + 180, oy - 235],
      [ox + 330, oy - 305],
      [ox + 540, oy - 345],
    ];

    const nodes = [
      // Left top: 100M x 1536 float32 flat budget
      txt('1. FLAT SCAN AT 100 MILLION VECTORS', -855, -205, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(-465, -96, 780, 146, s100 > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: s100 > 0.3 ? 8 : 2,
      }),
      txt('100M x 1,536 floats = 153.6B ops / query', -825, -134, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        'Raw RAM: 614.4 GB (~572 GiB) before overhead',
        -825,
        -88,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Too wide for brute-force per-request latency',
        -825,
        -48,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Left bottom: 1M vectors across 1,024 balanced IVF lists
      txt('2. BALANCED IVF: 1M VECTORS / 1,024 LISTS', -855, 18, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(
        -465,
        146,
        780,
        198,
        s20 > 0.3 ? COSMOS.gold : s5 > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: '#10203a',
          glow: s5 > 0.3 ? 8 * pulse : 2,
        },
      ),
      txt(
        '~977 vectors/list  |  Coarse scan = 1,024 fixed',
        -825,
        84,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('nprobe =  5 -> ~4,883 vectors scanned', -825, 122, 26, COSMOS.emerald, 'mono', 'left'),
      meterBar(-825, 158, 690, 16, 0.25, COSMOS.emerald),
      txt('nprobe = 20 -> ~19,531 vectors scanned', -825, 188, 26, COSMOS.gold, 'mono', 'left'),
      meterBar(-825, 224, 690, 16, s20 > 0.3 ? 1.0 : 0.25, COSMOS.gold),

      // Right: Recall vs Latency Pareto frontier + high-D tree pruning note
      txt('3. RECALL VS LATENCY PARETO FRONTIER', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),
      glassCell(495, 22, 750, 404, sf > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e182e',
        glow: sf > 0.3 ? 8 : 2,
      }),
      line([ox, oy], [ox + 630, oy], { stroke: COSMOS.muted, width: 2.2 }),
      line([ox, oy], [ox, oy - 355], { stroke: COSMOS.muted, width: 2.2 }),
      txt('Latency ->', ox + 490, oy + 28, 26, COSMOS.muted, 'mono', 'left'),
      txt('Recall', ox + 16, oy - 340, 26, COSMOS.emerald, 'mono', 'left'),

      glowingTrail(frontierPts, { color: COSMOS.emerald, width: 4.0, glow: 9 }),
      ...frontierPts.map(([fx, fy]) => glowDot(fx, fy, { radius: 8, color: COSMOS.emerald })),
      txt('Frontier', ox + 390, oy - 365, 26, COSMOS.emerald, 'mono', 'left'),

      // Dominated point below the frontier at same latency
      glowDot(ox + 330, oy - 165, { radius: 9, color: COSMOS.rose }),
      txt('Dominated (lower recall)', ox + 330, oy - 128, 26, COSMOS.rose, 'sans'),

      txt(
        'Zero-padding leaves distances unchanged',
        ox + 16,
        oy - 38,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'On the measured Pareto frontier, raising recall costs latency; time full list reads at load',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('scale-budget-b1', () => s.play(show100M.to(1, { duration: 0.4 })));
  c.on('scale-budget-b2', () => s.play(show5.to(1, { duration: 0.4 })));
  c.on('raise-probes', () => s.play(show20.to(1, { duration: 0.4 })));
  c.on('scale-budget-b3', () =>
    s.play(showFrontier.to(1, { duration: remainDuration(c, 'scale-budget-b3', 0.45) })),
  );
}
