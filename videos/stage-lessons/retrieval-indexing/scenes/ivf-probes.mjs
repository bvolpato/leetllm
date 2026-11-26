// Scene 18: Which passages does one probe get to see? (Orbiting 3D Voronoi IVF partition + boundary trap)
import {
  COSMOS,
  aura,
  flatRoute,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  ivfRoute,
  line,
  makeIvfVoronoi3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ivfProbes(s, c) {
  const phase = s.value(0);
  const showLists = s.value(0);
  const showQuery = s.value(0);
  const showAsk = s.value(0);
  const showLeftWin = s.value(0);
  const showGap = s.value(0);
  const showSecond = s.value(0);
  const showCounts = s.value(0);

  const bgAura = aura(0, 10, 680, '#12366028', '#2a1c5216');
  const title = heroTitle(['Which Passages Does', 'One Probe See?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'IVF-FLAT PARTITIONING · nlist = 2 · VORONOI BOUNDARY AT 5.0',
  });

  const { view: stage3d, orbit: orbit3d } = makeIvfVoronoi3D(520, -25, 680, 560, phase, {
    activeProbe: () => (showSecond.value > 0.5 ? 2 : 1),
    queryVal: () => 4.9,
  });

  const r1 = ivfRoute(4.9, 1);
  const r2 = ivfRoute(4.9, 2);
  const rf = flatRoute(4.9);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sl = showLists.value;
    const sq = showQuery.value;
    const sa = showAsk.value;
    const sL = showLeftWin.value;
    const sg = showGap.value;
    const s2 = showSecond.value;
    const sc = showCounts.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const twoOpen = s2 > 0.5;
    const revealed = sL > 0.4 || twoOpen;

    // 1D boundary inset strip on left (4.7 to 5.3)
    const sx0 = -820;
    const sw = 760;
    const mapStrip = (v) => sx0 + ((v - 4.7) / 0.6) * sw;
    const bX = mapStrip(5.0);
    const qX = mapStrip(4.9);
    const kX = mapStrip(5.1);

    const nodes = [
      txt('3D VORONOI IVF CELLS (nlist = 2)', 520, -330, 26, COSMOS.cyan, 'mono'),
      txt(
        twoOpen
          ? 'nprobe = 2 -> BOTH CELLS OPEN!'
          : revealed
            ? 'nprobe = 1 -> ONLY LEFT CELL OPEN'
            : 'nprobe = 1: which cell opens at q = 4.9?',
        520,
        282,
        26,
        twoOpen ? COSMOS.emerald : revealed ? COSMOS.amber : COSMOS.gold,
        'mono',
      ),

      // Left top: Two coarse lists
      txt('LIST 0 (CENTER 0) vs LIST 1 (CENTER 10)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-640, -110, 410, 108, COSMOS.cyan, { fill: '#10223b', glow: sl > 0.3 ? 8 : 3 }),
      txt('LIST 0  (x < 5.0)', -640, -132, 26, COSMOS.cyan, 'mono'),
      txt('generic_api (0.0)', -640, -88, 28, COSMOS.ink, 'mono'),

      glassCell(-200, -110, 430, 108, twoOpen ? COSMOS.emerald : COSMOS.muted, {
        fill: twoOpen ? '#0e2824' : '#12182b',
        glow: twoOpen ? 9 * pulse : 2,
      }),
      txt('LIST 1  (x >= 5.0)', -200, -132, 26, twoOpen ? COSMOS.emerald : COSMOS.muted, 'mono'),
      txt('key_rot (5.1), quota (9)', -200, -88, 26, COSMOS.ink, 'mono'),

      // Left middle: Enlarged boundary detail 4.7 .. 5.3
      txt('BOUNDARY DETAIL:  4.7  TO  5.3', -855, -10, 26, COSMOS.gold, 'mono', 'left'),
      line([sx0, 62], [sx0 + sw, 62], { stroke: COSMOS.muted, width: 3 }),
      line([bX, 24], [bX, 100], { stroke: COSMOS.gold, width: 3, dash: [6, 6] }),
      txt('boundary 5.0', bX, 126, 26, COSMOS.gold, 'mono'),

      glowDot(qX, 62, { radius: 10, color: COSMOS.gold, opacity: Math.max(0.7, sq) }),
      txt('Query 4.9', qX, 26, 26, COSMOS.gold, 'mono'),

      glowDot(kX, 62, { radius: 10, color: twoOpen ? COSMOS.emerald : COSMOS.rose }),
      txt('key_rot 5.1', kX, 26, 26, twoOpen ? COSMOS.emerald : COSMOS.rose, 'mono'),

      // Gap highlight
      line([qX, 62], [kX, 62], {
        stroke: sg > 0.3 ? COSMOS.emerald : COSMOS.muted,
        width: sg > 0.3 ? 5 : 2,
      }).opacity(Math.max(0.4, sg)),

      // Left bottom: Result & check count table (strictly withheld before sL!)
      glassCell(
        -425,
        224,
        880,
        134,
        twoOpen ? COSMOS.emerald : revealed ? COSMOS.rose : COSMOS.muted,
        {
          fill: '#10182d',
          glow: sc > 0.3 ? 8 * pulse : 3,
        },
      ),
      txt(
        !revealed
          ? 'nprobe = 1 at q = 4.9 -> returned: ?'
          : twoOpen
            ? `nprobe=2 -> ${r2.ranked[0].id} (${r2.checks} chks) | Flat: ${rf.checks}`
            : `nprobe=1 -> ${r1.ranked[0].id} (${r1.checks} chks), missed key_rot!`,
        -840,
        200,
        26,
        !revealed ? COSMOS.gold : twoOpen ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        sc > 0.3
          ? '1-probe: 2+1 = 3 | 2-probe: 2+3 = 5 | Flat: 3'
          : revealed
            ? 'Center 0 is 4.9 away vs Center 10 is 5.1 away'
            : 'Compare q = 4.9 to Center 0 and Center 10',
        -840,
        246,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: twoOpen ? COSMOS.emerald : COSMOS.gold }),
      txt(
        twoOpen
          ? 'Opening every list in IVF-Flat gives exact recall; adding PQ compression still introduces code error'
          : sa > 0.3 && !revealed
            ? 'With 1 probe at query 4.9, which passage will IVF return?'
            : 'Near a Voronoi boundary, 1 probe can lock out the true nearest neighbor in the adjacent cell',
        -812,
        360,
        28,
        twoOpen ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('ivf-build', () => s.play(showLists.to(0.5, { duration: 0.35 })));
  c.on('ivf-lists', () => s.play(showLists.to(1, { duration: 0.4 })));
  c.on('ivf-query', () => s.play(showQuery.to(1, { duration: 0.4 })));
  c.on('ivf-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('ivf-left', () => s.play(showLeftWin.to(1, { duration: 0.45 })));
  c.on('ivf-centers', () => s.play(showGap.to(0.5, { duration: 0.35 })));
  c.on('ivf-gap', () => s.play(showGap.to(1, { duration: 0.4 })));
  c.on('ivf-second', () => s.play(showSecond.to(0.6, { duration: 0.4 })));
  c.on('ivf-found', () => s.play(showSecond.to(1, { duration: 0.4 })));
  c.on('ivf-counts', () => s.play(showCounts.to(0.6, { duration: 0.35 })));
  c.on('ivf-flat', () =>
    s.play(showCounts.to(1, { duration: remainDuration(c, 'ivf-flat', 0.45) })),
  );
}
