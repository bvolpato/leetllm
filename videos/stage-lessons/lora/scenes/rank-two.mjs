// Scene 07: Two directions open a plane: Orbiting 3D rank-2 plane (rotatedPlane from model.mjs) + unreachable target + plane rotation.
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  glowTex,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line3d,
  orbitScene,
  points3d,
  remainDuration,
  rotatedPlane,
  txt,
} from '../parts.mjs';

export default function rankTwo(s, c) {
  const showBasis = s.value(0);
  const sweepProg = s.value(0);
  const showTip = s.value(0);
  const showLimit = s.value(0);
  const rotProg = s.value(0);

  const bgAura = aura(300, 0, 560, '#ffd16622', '#ff6b8b16');
  const title = heroTitle(['Two Directions', 'Open a Plane'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RANK-TWO SUBSPACE GEOMETRY',
  });

  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.04,
    distance: 15.2,
    unit: 88,
    focus: [0, 0, 0.55],
  }).at(415, -15);

  const grid = gridPlane3d({ size: 5.0, step: 1.0, z: 0, color: '#273659', opacity: 0.4 });
  const axes = [
    line3d([-2.2, 0, 0], [2.4, 0, 0], { color: '#5c709e', width: 2, opacity: 0.65 }),
    line3d([0, -2.2, 0], [0, 2.4, 0], { color: '#5c709e', width: 2, opacity: 0.65 }),
    line3d([0, 0, -0.8], [0, 0, 2.4], { color: '#5c709e', width: 2, opacity: 0.65 }),
  ];

  // Dynamic glowing wireframe plane built from rotatedPlane(rotProg.value) so it visibly tilts!
  const planePt = (su, sv) => () => {
    const rp = rotatedPlane(rotProg.value);
    return [
      rp.first[0] * su + rp.second[0] * sv,
      rp.first[1] * su + rp.second[1] * sv,
      rp.first[2] * su + rp.second[2] * sv,
    ];
  };
  const planeLines = [];
  for (let k = -3; k <= 3; k++) {
    const t = k * 0.5;
    const isEdge = Math.abs(k) === 3;
    const style = {
      color: COSMOS.gold,
      width: isEdge ? 2.8 : 1.4,
      opacity: isEdge ? 0.85 : 0.42,
      glow: isEdge ? 7 : 0,
      blend: 'screen',
    };
    planeLines.push(
      line3d(planePt(-1.5, t), planePt(1.5, t), style),
      line3d(planePt(t, -1.5), planePt(t, 1.5), style),
    );
  }

  const stateVecs = () => {
    const rp = rotatedPlane(rotProg.value);
    const p = sweepProg.value;
    const c1 = 0.85 + 0.55 * Math.sin(p * 4.2);
    const c2 = 0.75 + 0.45 * Math.cos(p * 3.1);
    const k1 = rotProg.value > 0.5 ? rp.c1 : c1;
    const k2 = rotProg.value > 0.5 ? rp.c2 : c2;
    const v1 = rp.first.map((v) => v * k1);
    const v2 = rp.second.map((v) => v * k2);
    const tip = [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
    return { rp, v1, tip };
  };

  const vec1Line = line3d([0, 0, 0], () => stateVecs().v1, {
    color: COSMOS.cyan,
    width: 4.5,
    glow: 10,
    blend: 'screen',
    onTop: true,
  });
  const vec2Line = line3d(
    () => stateVecs().v1,
    () => stateVecs().tip,
    {
      color: COSMOS.gold,
      width: 4.5,
      glow: 10,
      blend: 'screen',
      onTop: true,
    },
  );
  const resLine = line3d([0, 0, 0], () => stateVecs().tip, {
    color: COSMOS.emerald,
    width: 5.5,
    glow: 12,
    blend: 'screen',
    onTop: true,
  });

  const targetPt = rotatedPlane(0).target;
  const pts = points3d(() => [stateVecs().tip, targetPt], {
    colorAt: (idx) => (idx === 0 ? COSMOS.emerald : COSMOS.rose),
    radius: 8,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });

  view3d.add(grid, ...axes, ...planeLines, vec1Line, vec2Line, resLine, pts);

  const eq = glowTex(String.raw`\Delta W x = c_1 b_1 + c_2 b_2 \quad (\operatorname{rank} \le 2)`, {
    x: 325,
    y: 405,
    size: 36,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const sb = showBasis.value;
    const st = showTip.value;
    const sl = showLimit.value;
    const rp = rotProg.value;

    const nodes = [
      txt(
        rp > 0.5 ? 'ROTATED PLANE CAPTURES TARGET' : '2D SUBSPACE IN 3D OUTPUT SPACE',
        325,
        -395,
        26,
        rp > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(6, rp > 0.5 ? COSMOS.emerald : COSMOS.gold),

      glassCell(-560, -152, 590, 118, COSMOS.cyan, {
        fill: '#101d35',
        glow: sb > 0.2 ? 9 : 4,
      }),
      txt('TWO BASIS DIRECTIONS  b₁, b₂', -825, -184, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Head-to-tail sums sweep a plane', -825, -128, 28, COSMOS.ink, 'sans', 'left'),

      glassCell(-560, 6, 590, 118, rp > 0.5 ? COSMOS.emerald : COSMOS.rose, {
        fill: rp > 0.5 ? '#0e2528' : '#251220',
        glow: 9,
      }),
      txt(
        'OUT-OF-PLANE TARGET',
        -825,
        -26,
        26,
        rp > 0.5 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        rp > 0.5
          ? 'Training rotates the plane onto target'
          : st > 0.2
            ? 'Unreachable from a fixed plane'
            : 'Rose dot lies outside current plane',
        -825,
        30,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-575, 184, 560, 154, COSMOS.gold, {
        fill: '#231d10',
        glow: sl > 0.2 ? 9 : 3,
      }),
      txt('CAPACITY RULE', -825, 142, 26, COSMOS.gold, 'mono', 'left'),
      txt('Rank <= 2 directions', -825, 188, 28, COSMOS.ink, 'mono', 'left'),
      txt('Redundant cols shrink rank', -825, 232, 26, COSMOS.muted, 'sans', 'left'),
    ];
    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, live);
  orbitScene(s, c, view3d, { theta: -0.24, phi: 0.94 });

  c.on('rank-two-b1-1', () => s.play(showBasis.to(1, { duration: 0.45 })));
  c.on('rank-two-b2-1', () => s.play(sweepProg.to(1, { duration: 1.4 })));
  c.on('rank-two-b2-2', () => s.play(showTip.to(1, { duration: 0.45 })));
  c.on('rank-two-b3-1', () => s.play(showLimit.to(1, { duration: 0.45 })));
  c.on('rank-two-rotation', () =>
    s.play(rotProg.to(1, { duration: remainDuration(c, 'rank-two-rotation', 1.2) })),
  );
}
