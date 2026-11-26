// Scene 4: Keeping a second route open (Orbiting 3D HNSW hierarchy + efSearch beam queue/heap crossing bridge M to H)
import {
  COSMOS,
  RETAIN_1,
  RETAIN_3,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeHnswTower3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hierarchyBeam(s, c) {
  const phase = s.value(0);
  const showUpper = s.value(0);
  const showNarrow = s.value(0);
  const showWide = s.value(0);
  const showHidden = s.value(0);
  const showHeaps = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Keeping a Second', 'Route Open'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'HNSW HIERARCHY & EF_SEARCH BEAM · CROSSING THE UPHILL BRIDGE',
  });

  const hnsw3d = makeHnswTower3D(555, -20, phase);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const su = showUpper.value;
    const sn = showNarrow.value;
    const sw = showWide.value;
    const sh = showHidden.value;
    const sheap = showHeaps.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const r1Last = RETAIN_1.at(-1);
    const r3Last = RETAIN_3.at(-1);

    const nodes = [
      // Left top: Sparse upper expressway -> Drop down at A
      glassCell(-405, -144, 920, 122, su > 0.3 ? COSMOS.violet : COSMOS.muted, {
        fill: '#191432',
        glow: su > 0.3 ? 8 : 2,
      }),
      txt(
        '1. SPARSE UPPER LAYERS (E -> A -> DROP AT A)',
        -835,
        -174,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ),
      txt(
        'Long express link reaches A, then descends to local mesh',
        -835,
        -126,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Left middle: efSearch = 1 vs efSearch = 3 bridge crossing
      glassCell(
        -405,
        22,
        920,
        152,
        sh > 0.3 ? COSMOS.emerald : sw > 0.3 ? COSMOS.gold : COSMOS.rose,
        {
          fill: sh > 0.3 ? '#0e2824' : '#181e34',
          glow: sw > 0.3 ? 9 * pulse : 3,
        },
      ),
      txt(
        `efSearch = 1: keeps [E], discards M (${r1Last.comparisons} scored)`,
        -835,
        -18,
        26,
        sn > 0.3 && sw < 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        sh > 0.3
          ? `efSearch = 3: keeps M -> reaches H (0.1)! (${r3Last.comparisons} scored)`
          : 'efSearch = 3: keeps M beside E so M can expand',
        -835,
        26,
        26,
        sh > 0.3 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Visited set & comparisons can exceed result capacity',
        -835,
        68,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      // Left bottom: Candidate min-queue + Result max-heap stopping rule
      glassCell(-405, 206, 920, 152, sheap > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: sheap > 0.3 ? 8 * pulse : 2,
      }),
      txt(
        'MIN-QUEUE (NEXT NEAREST)  |  MAX-HEAP (WORST KEPT)',
        -835,
        164,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Admit neighbor if room OR beats worst retained result',
        -835,
        210,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Stop when next candidate > worst cutoff (if heap full)',
        -835,
        250,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Right 3D caption
      txt('3D HNSW MULTI-LAYER SKIP GRAPH', 555, -252, 26, COSMOS.violet, 'mono'),
      txt('L2 express -> L1 hub -> L0 local beam', 555, 258, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.violet }),
      txt(
        'Upper layers jump across space; efSearch widens the local beam to cross temporary uphill bridges',
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

  s.add(bgAura, title, hnsw3d.view, live);
  runPhase(s, c, phase, 14);
  hnsw3d.orbit(s, c);

  c.on('hierarchy-beam-b1-1', () => s.play(showUpper.to(0.4, { duration: 0.35 })));
  c.on('upper-hop', () => s.play(showUpper.to(0.75, { duration: 0.35 })));
  c.on('descend-at-a', () => s.play(showUpper.to(1, { duration: 0.35 })));
  c.on('hierarchy-beam-b2-1', () => s.play(showNarrow.to(0.5, { duration: 0.35 })));
  c.on('narrow-discards-bridge', () => s.play(showNarrow.to(1, { duration: 0.35 })));
  c.on('wide-retained-bridge', () => s.play(showWide.to(1, { duration: 0.4 })));
  c.on('reach-hidden', () => s.play(showHidden.to(0.6, { duration: 0.35 })));
  c.on('hierarchy-beam-b3-1', () => s.play(showHidden.to(1, { duration: 0.35 })));
  c.on('hierarchy-beam-b3-extension', () =>
    s.play(showHeaps.to(1, { duration: remainDuration(c, 'hierarchy-beam-b3-extension', 0.45) })),
  );
}
