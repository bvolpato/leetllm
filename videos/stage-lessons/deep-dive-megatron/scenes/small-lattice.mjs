// Scene 04: Construct a small rank coordinate before expanding the world (3D 2x2x2 cube: Rank 3 = (tp=1,dp=1,pp=0), partners TP=2, DP=1, PP=7 -> 64-rank strides 1,4,8,32!).
import {
  COSMOS,
  ROLE,
  aura,
  buildMegatronMesh3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function smallLattice(s, c) {
  const phase = s.value(0);
  const axis3d = s.value(0);
  // step: 0=2x2x2 cube, 1=R3 coord (1,1,0), 2=partners 2/1/7, 3=64-rank strides 1,4,8,32, 4=world=64
  const step = s.value(0);

  const bgAura = aura(450, 25, 540, '#60a5fa20', '#a78bfa18');
  const { view: cube3d } = buildMegatronMesh3d(axis3d, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Build a Small Cube', 'Before Scaling to 64'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.tp,
    eyebrow: 'COORDINATE STRIDES · 8 -> 64 RANKS',
  });

  const formula = glowTex('r = \\text{tp} + 4\\,\\text{cp} + 8\\,\\text{dp} + 32\\,\\text{pp}', {
    x: 475,
    y: -385,
    size: 36,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;

    const nodes = [
      txt('3D 8-RANK CUBE (TP=2, DP=2, PP=2)', 475, 405, 26, COSMOS.gold, 'mono'),

      glassCell(-420, -110, 860, 210, st < 3 ? ROLE.tp : COSMOS.dim, {
        fill: '#0f1d36',
        glow: st < 3 ? 10 : 3,
      }),
      txt('8-RANK ANCHOR: RANK 3', -420, -172, 28, COSMOS.gold, 'mono'),
      txt('Coord = (tp=1, dp=1, pp=0)', -420, -112, 30, COSMOS.ink, 'mono'),
      txt(
        st >= 2
          ? 'Partners: TP -> 2   ·   DP -> 1   ·   PP -> 7'
          : 'Vary one axis while keeping others fixed',
        -420,
        -50,
        26,
        st >= 2 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      glassCell(-420, 145, 860, 214, st >= 3 ? ROLE.good : COSMOS.dim, {
        fill: st >= 3 ? '#0d2624' : '#0a0f1c',
        glow: st >= 3 ? 10 : 2,
      }),
      txt(
        '64-RANK DENSE FIXTURE (4 × 2 × 4 × 2)',
        -420,
        82,
        28,
        st >= 3 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt(
        'Strides:  TP=1 · CP=4 · DP=8 · PP=32',
        -420,
        142,
        28,
        st >= 3 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt('Logical adjacency still needs launcher placement!', -420, 198, 26, COSMOS.muted, 'sans'),

      txt(
        'Check physical node/NVLink placement separately from logical coordinate strides',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];
    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, formula, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['mg-small-lattice-b0', 0],
    ['mg-small-coordinate', 1],
    ['mg-small-partners', 2],
    ['mg-small-lattice-b1', 3],
    ['mg-world-sixty-four', 4],
  ]);
  c.on('mg-small-partners', () => s.play(axis3d.to(2, { duration: 0.4 })));
}
