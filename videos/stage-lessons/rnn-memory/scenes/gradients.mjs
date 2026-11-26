// Scene 9: gradients: "How much credit reaches the far end?"
// SIGNATURE 3D CINEMA SCENE:
// Left: Logarithmic BPTT trajectory plot (10^-3 to 10^2 across 12 backward links) for 0.6^n vs 1.4^n.
// Right: Continuously orbiting 3D Spectral-Radius Spiral Rig (|lambda| < 1 inward vanishing helix
//        vs |lambda| > 1 outward exploding helix around the unit stability cylinder).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildSpectralSpiral3d,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function gradients(s, c) {
  const title = heroTitle(['How much credit', 'reaches the far end?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grad,
  });

  const shrinkStep = s.value(0); // 0 -> 4 -> 12
  const showFaded = s.value(0);
  const growStep = s.value(0); // 0 -> 12
  const showGrown = s.value(0);
  const grow3d = s.value(0);

  // Left: Log-scale chart spanning x in [-740, -15], y in [-175, 290]
  const left = -730;
  const right = -25;
  const bottom = 290;
  const top = -175;
  const pt = (step, value) => [
    left + ((right - left) * step) / 12,
    bottom - ((bottom - top) * (Math.log10(value) + 3)) / 5,
  ];

  const levels = [0.001, 0.01, 0.1, 1, 10, 100];
  const gridNodes = [
    txt(
      'Log10 credit magnitude (each line = 10×)',
      (left + right) / 2,
      -230,
      28,
      COSMOS.muted,
      'sans',
      'center',
    ),
    ...levels.flatMap((v) => {
      const y = pt(0, v)[1];
      return [
        line([left, y], [right, y], {
          stroke: v === 1 ? '#6e83b7' : '#263250',
          width: v === 1 ? 2.6 : 1.5,
        }),
        txt(String(v), left - 20, y, 26, v === 1 ? COSMOS.ink : COSMOS.dim, 'mono', 'right'),
      ];
    }),
    ...[0, 4, 8, 12].map((n) =>
      txt(String(n), pt(n, 0.001)[0], bottom + 36, 28, COSMOS.muted, 'mono', 'center'),
    ),
    txt(
      'Backward links crossed',
      (left + right) / 2,
      bottom + 86,
      28,
      COSMOS.ink,
      'sans',
      'center',
    ),
    glowDot(pt(0, 1)[0], pt(0, 1)[1], { radius: 8.5, color: ROLE.gold, glow: 12 }),
  ];

  function buildCurvePts(factor, progress) {
    const whole = Math.min(12, Math.floor(progress));
    const frac = progress - whole;
    const pts = [pt(0, 1)];
    for (let k = 1; k <= whole; k++) pts.push(pt(k, factor ** k));
    if (whole < 12 && frac > 0.01) {
      const a = pt(whole, factor ** whole);
      const b = pt(whole + 1, factor ** (whole + 1));
      pts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
    }
    return pts;
  }

  const curvesLayer = guardedDynamic(
    () => 1,
    () => {
      const nodes = [];

      if (shrinkStep.value > 0.02) {
        const pts = buildCurvePts(0.6, shrinkStep.value);
        nodes.push(glowingTrail(pts, { color: ROLE.grad, width: 5.5, glow: 12 }));
        const head = pts.at(-1);
        nodes.push(glowDot(head[0], head[1], { radius: 8, color: ROLE.grad, glow: 12 }));
      }

      if (showFaded.value > 0.02) {
        const end = pt(12, 0.6 ** 12);
        nodes.push(
          glowTex('0.6^{12} \\approx 0.00218', {
            x: 155,
            y: end[1] - 10,
            size: 32,
            color: ROLE.grad,
            glow: 8,
          }).opacity(showFaded.value),
        );
      }

      if (growStep.value > 0.02) {
        const pts = buildCurvePts(1.4, growStep.value);
        nodes.push(glowingTrail(pts, { color: ROLE.state, width: 5.5, glow: 12 }));
        const head = pts.at(-1);
        nodes.push(glowDot(head[0], head[1], { radius: 8, color: ROLE.state, glow: 12 }));
      }

      if (showGrown.value > 0.02) {
        const end = pt(12, 1.4 ** 12);
        nodes.push(
          glowTex('1.4^{12} \\approx 56.69', {
            x: 155,
            y: end[1] + 10,
            size: 32,
            color: ROLE.state,
            glow: 8,
          }).opacity(showGrown.value),
        );
      }

      // 3D Rig caption cleanly below the 3D viewport
      nodes.push(
        txt('3D Eigenvalue Spirals', 575, -245, 32, COSMOS.ink, 'serif', 'center'),
        txt('|λ| < 1 collapses inward', 575, 322, 26, ROLE.grad, 'mono', 'center'),
      );
      if (grow3d.value > 0.05) {
        nodes.push(
          txt('|λ| > 1 rockets outward', 575, 364, 26, ROLE.state, 'mono', 'center').opacity(
            grow3d.value,
          ),
        );
      }

      return nodes;
    },
  );

  // Right: Continuously orbiting 3D Spectral-Radius Spiral Rig
  const rig3d = buildSpectralSpiral3d(grow3d, { x: 575, y: 40, unit: 88, distance: 14.6 });

  s.add(cinemaAtmosphere(ROLE.grad, ROLE.state), title, ...gridNodes, rig3d, curvesLayer);

  // Continuous smooth 3D camera orbit across the entire scene
  orbitScene(s, c, rig3d, { theta: 0.95, phi: 0.92 }, { startOffset: 0.08, endMargin: 0.55 });

  playCue(s, c, 'gradient-chain-rule-b1-1', (d) => s.play(shrinkStep.to(4, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'fading-gradient-b2-1', (d) => s.play(shrinkStep.to(12, { duration: d })), {
    dur: 1.45,
  });
  playCue(s, c, 'faded-value', (d) => s.play(showFaded.to(1, { duration: d })), { dur: 0.45 });
  playCue(
    s,
    c,
    'growing-gradient',
    (d) => s.play(growStep.to(12, { duration: d }), grow3d.to(1, { duration: d })),
    { dur: 1.5 },
  );
  playCue(s, c, 'grown-value', (d) => s.play(showGrown.to(1, { duration: d })), { dur: 0.45 });
}
