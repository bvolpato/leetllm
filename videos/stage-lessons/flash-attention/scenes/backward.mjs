// Scene 14: Reconstruct probabilities when gradients need them: LSE compression + 3D tile recomputation.
import {
  COSMOS,
  aura,
  buildAttentionTerrain3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function backward(s, c) {
  const tileCursor = s.value(0);
  const showLseEq = s.value(0);
  const showRecomp = s.value(0);
  const showScale = s.value(0);

  const { view: terrain3d } = buildAttentionTerrain3d(tileCursor, {
    x: 350,
    y: -4,
    half: 2.8,
    grid: 4,
  });
  const bgAura = aura(350, 0, 540, '#a78bfa26', '#5ce1e616');

  const title = heroTitle(['Recompute', 'in Backward'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.violet,
    eyebrow: 'TRAINING GRADIENTS · NO SAVED P MATRIX',
  });

  const eqLse = glowTex(String.raw`\text{LSE}_i = m_i + \log \ell_i`, {
    x: -600,
    y: -155,
    size: 40,
    color: COSMOS.violet,
  });

  const eqRecon = glowTex(String.raw`P_{ij} = \exp\!\big(S_{ij} - \text{LSE}_i\big)`, {
    x: -600,
    y: 45,
    size: 40,
    color: COSMOS.cyan,
  });

  const live = guardedDynamic(1, () => {
    const sl = showLseEq.value;
    const sr = showRecomp.value;
    const sc = showScale.value;

    const nodes = [
      txt('ON-CHIP TILE RECOMPUTATION', 350, -405, 26, COSMOS.violet, 'mono').glow(
        5,
        COSMOS.violet,
      ),
      txt(
        'Rebuild P tile in SRAM → compute dQ, dK, dV → discard',
        350,
        428,
        26,
        COSMOS.muted,
        'sans',
      ),

      glassCell(-600, -155, 530, 118, COSMOS.violet, {
        fill: '#171330',
        glow: 8,
        opacity: Math.max(0.35, sl),
      }),
      txt('1 NUMBER PER ROW · O(N) STATE', -600, -68, 26, COSMOS.violet, 'mono').opacity(
        Math.max(0.35, sl),
      ),

      glassCell(-600, 45, 530, 118, COSMOS.cyan, {
        fill: '#0e1c30',
        glow: sr > 0.3 ? 9 : 2,
        opacity: Math.max(0.25, sr),
      }),
      txt('REBUILD TILE ON DEMAND', -600, 132, 26, COSMOS.cyan, 'mono').opacity(Math.max(0.25, sr)),
    ];

    if (sc > 0.02) {
      nodes.push(
        glassCell(-600, 285, 530, 136, COSMOS.gold, { fill: '#1a1812', glow: 9, opacity: sc }),
        txt('2× SEQUENCE LENGTH:', -600, 248, 26, COSMOS.muted, 'mono').opacity(sc),
        txt('2× row LSE  ·  ~4× score work', -600, 302, 30, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(sc),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, terrain3d, title, live, eqLse, eqRecon);
  orbitScene(s, c, terrain3d, { theta: -0.2, phi: 0.92 });
  c.at(0.1, () => s.play(tileCursor.to(11.5, { duration: Math.max(1, c.end - c.start - 0.65) })));

  c.on('saved-lse', () => s.play(showLseEq.to(0.65, { duration: 0.4 })));
  c.on('compact-statistic', () => s.play(showLseEq.to(1, { duration: 0.4 })));
  c.on('recompute-scores', () => s.play(showRecomp.to(0.6, { duration: 0.4 })));
  c.on('recover-probability', () => s.play(showRecomp.to(1, { duration: 0.45 })));
  c.on('linear-storage', () => s.play(showScale.to(0.55, { duration: 0.4 })));
  c.on('tile-recomputation', () =>
    s.play(showScale.to(1, { duration: remainDuration(c, 'tile-recomputation', 0.45) })),
  );
}
