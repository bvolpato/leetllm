// Scene 08: Two places to put three scores: FlashAttention-2 query-resident streaming + 3 saved quantities.
import {
  COSMOS,
  aura,
  buildAttentionTerrain3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tiles(s, c) {
  const tileCursor = s.value(0);
  const phase = s.value(0);
  const pairLoaded = s.value(0);
  const waitPulse = s.value(0);
  const reuse = s.value(0);
  const showL = s.value(0);
  const showN = s.value(0);
  const showM = s.value(0);

  const { view: terrain3d } = buildAttentionTerrain3d(tileCursor, {
    x: 360,
    y: 20,
    half: 2.9,
    grid: 4,
  });
  const bgAura = aura(360, 20, 520, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['Stream K, V', 'Past Resident Q'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FLASHATTENTION-2 · TILING',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const ld = pairLoaded.value;
    const wp = waitPulse.value;
    const ru = reuse.value;
    const sl = showL.value;
    const sn = showN.value;
    const sm = showM.value;

    const nodes = [
      txt('3D SRAM TILE STREAMING', 360, -395, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Q stays pinned on chip · K, V stream in tiles', 360, 412, 26, COSMOS.muted, 'sans'),

      // Pinned Query block
      glassCell(-555, -175, 600, 88, COSMOS.gold, { fill: '#1f1b12', glow: 9 }),
      txt('RESIDENT Q: test (pinned in SRAM)', -555, -175, 26, COSMOS.gold, 'mono'),

      // Two scratch slots
      glassCell(-715, -35, 280, 108, ru > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#101b30',
        glow: 7,
      }),
      txt('SLOT 0', -715, -65, 26, COSMOS.muted, 'mono'),
      txt(
        ru > 0.5 ? 'reused: test' : ld > 0.3 ? 'fix (s=1)' : 'empty',
        -715,
        -18,
        28,
        ru > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
      ),

      glassCell(-395, -35, 280, 108, ru > 0.5 ? COSMOS.dim : COSMOS.cyan, {
        fill: '#101b30',
        glow: ru > 0.5 ? 0 : 7,
      }),
      txt('SLOT 1', -395, -65, 26, COSMOS.muted, 'mono'),
      txt(
        ru > 0.5 ? 'free' : ld > 0.3 ? 'this (s=2)' : 'empty',
        -395,
        -18,
        28,
        ru > 0.5 ? COSMOS.dim : COSMOS.cyan,
        'mono',
      ),

      // Waiting key badge
      glassCell(-555, 96, 600, 72, wp > 0.5 && ru < 0.5 ? COSMOS.amber : COSMOS.dim, {
        fill: '#141724',
        dash: ru > 0.5 ? undefined : [8, 6],
        glow: wp > 0.5 && ru < 0.5 ? 8 : 0,
      }),
      txt(
        ru > 0.5 ? 'Zero N × N HBM round trip' : 'Waiting: key "test" (needs slot)',
        -555,
        96,
        26,
        ru > 0.5 ? COSMOS.emerald : COSMOS.amber,
        'mono',
      ),
    ];

    // Three persistent running summary registers (revealed on beat 3, after prediction!)
    const regs = [
      { sym: 'ℓ', name: 'total wt', x: -760, col: COSMOS.cyan, vis: sl },
      { sym: 'N', name: 'wt sum', x: -555, col: COSMOS.emerald, vis: sn },
      { sym: 'm', name: 'ref max', x: -350, col: COSMOS.gold, vis: sm },
    ];
    for (const r of regs) {
      if (r.vis < 0.02) continue;
      nodes.push(
        glassCell(r.x, 265, 190, 128, r.col, { fill: '#111a2e', glow: 9, opacity: r.vis }),
        txt(r.sym, r.x, 238, 44, r.col, 'serif').glow(6, r.col).opacity(r.vis),
        txt(r.name, r.x, 294, 26, COSMOS.ink, 'sans').opacity(r.vis),
      );
    }

    if (sl > 0.02 || sn > 0.02 || sm > 0.02) {
      const u = (p * 0.7) % 1;
      nodes.push(
        glowingArc([-555, 134], [-555, 198], 0, {
          color: COSMOS.gold,
          width: 3.2,
          opacity: 0.85 * Math.max(sl, sn, sm),
        }),
        glowDot(-555, 134 + u * 64, {
          radius: 5.5,
          color: COSMOS.gold,
          opacity: Math.max(sl, sn, sm),
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, terrain3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, terrain3d, { theta: -0.18, phi: 0.9 });
  c.at(0.1, () => s.play(tileCursor.to(7.8, { duration: Math.max(1, c.end - c.start - 0.65) })));

  c.on('load-pair', () => s.play(pairLoaded.to(1, { duration: 0.45 })));
  c.on('waiting-key', () => s.play(waitPulse.to(1, { duration: 0.45 })));
  c.on('reuse-scratch', () => s.play(reuse.to(1, { duration: 0.55 })));
  c.on('keep-sums', () => s.play(showL.to(1, { duration: remainDuration(c, 'keep-sums', 0.45) })));
  c.on('keep-values', () =>
    s.play(showN.to(1, { duration: remainDuration(c, 'keep-values', 0.45) })),
  );
  c.on('keep-ref', () => s.play(showM.to(1, { duration: remainDuration(c, 'keep-ref', 0.45) })));
}
