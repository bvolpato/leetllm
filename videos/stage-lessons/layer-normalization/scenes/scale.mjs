// Scene 3: scale: "How much spread is there?"
// Combines a live 4-feature spread spectrum + geometric squared-distance wells with a
// signature 3D unit-variance sphere projection (cinematic3d + orbitScene) and the flat-token
// [7, 7, 7, 7] epsilon safeguard.
import { gridPlane3d, line3d, point3d, sphere, vector3d } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  centered,
  cinemaAtmosphere,
  epsilon,
  featureSpectrum,
  fmt,
  lumBar,
  normal,
  playCue,
  scaleTrace,
} from '../parts.mjs';

export default function scale(s, c) {
  const fullTrace = scaleTrace(1);
  const divisor = fullTrace.divisor; // sqrt(5 + eps) ≈ 2.236

  const title = heroTitle(['How much spread', 'is there?'], {
    x: -850,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.norm,
  });

  // Reactive state
  const sqProgress = s.value(0); // 0 -> 4 squares revealed
  const divProgress = s.value(0); // 0 -> 1 divides centered vector by sqrt(5+eps)
  const flatReveal = s.value(0); // 0 -> 1 reveals [7,7,7,7] epsilon guard on beat 1

  const stageVis = s.value(1);

  // Right-side 3D Unit-Spread Sphere showing radial contraction from spread vector onto unit shell
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.08,
    distance: 14.4,
    unit: 102,
    focus: [0, 0, 0.15],
  }).at(485, -70);

  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    z: -1.8,
    step: 1,
    color: '#25355c',
    opacity: 0.42,
  });

  // Unit-variance sphere shell (radius 1.45 in visual units representing unit spread)
  const unitShell = sphere(1.45, {
    color: ROLE.norm,
    opacity: 0.24,
    wireframe: true,
    wireColor: ROLE.norm,
    wireOpacity: 0.42,
    steps: 14,
  });

  // 3D radial vector contracting from unscaled (r = 2.45) onto unit sphere (r = 1.45)
  const dir3 = [0.58, -0.52, 0.63];
  const tip3 = () => {
    const r = 2.45 - divProgress.value * (2.45 - 1.45);
    return [dir3[0] * r, dir3[1] * r, dir3[2] * r];
  };
  const outerTip = [dir3[0] * 2.45, dir3[1] * 2.45, dir3[2] * 2.45];

  const ghostRay = line3d([0, 0, 0], outerTip, {
    color: ROLE.gold,
    width: 2.2,
    opacity: 0.48,
  });
  const activeVec = vector3d([0, 0, 0], tip3, {
    color: ROLE.write,
    width: 4.5,
    glow: 10,
  });
  const tipMarker = point3d(tip3, {
    color: ROLE.norm,
    radius: 7,
    glow: 14,
  });

  view3d.add(floor, unitShell, ghostRay, activeVec, tipMarker);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sqP = sqProgress.value;
    const divP = divProgress.value;
    const flatP = flatReveal.value;

    const currentVals = centered.map((v, i) => v + divP * (normal[i] - v));
    const specColor = divP > 0.35 ? ROLE.norm : ROLE.write;

    // Left: Glowing 4-feature waveform morphing from centered -> standardized
    const spec = featureSpectrum({
      cx: -395,
      cy: -90,
      width: 740,
      height: 260,
      yMin: -4,
      yMax: 4,
      values: currentVals,
      ghostValues: divP > 0.05 ? centered : undefined,
      color: specColor,
      yTicks: [-3, 0, 3],
      opacity: alpha,
    });
    nodes.push(spec.node);

    // Lower-left: 4 squared distances accumulating into sum = 20 -> var = 5 -> divisor 2.236
    const sqCount = Math.min(4, Math.floor(sqP + 0.05));
    const sqVals = fullTrace.squares; // [1, 1, 9, 9]
    const sqSum = sqVals.slice(0, sqCount).reduce((a, b) => a + b, 0);
    const sqY = 272;

    nodes.push(
      txt('Squared distances (x - μ)²', -825, sqY - 56, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha,
      ),
    );

    sqVals.forEach((sq, i) => {
      const sx = -760 + i * 150;
      const lit = i < sqCount;
      const side = lit ? (sq === 9 ? 76 : 56) : 52;
      nodes.push(
        lumBar(sx, sqY + 18, side, side, {
          color: lit ? ROLE.gold : COSMOS.dim,
          fillOpacity: lit ? 0.34 : 0.08,
          strokeWidth: lit ? 2.8 : 1.6,
          glow: lit ? 10 : 2,
          radius: 8,
          opacity: alpha,
        }),
        txt(
          lit ? String(sq) : '·',
          sx,
          sqY + 18,
          34,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Running sum -> variance -> divisor readout
    if (sqCount > 0) {
      nodes.push(
        txt(`sum = ${sqSum}`, -205, sqY + 18, 34, ROLE.gold, 'mono', 'left')
          .glow(6, ROLE.gold)
          .opacity(alpha),
      );
    }
    if (sqCount >= 4) {
      nodes.push(
        txt(
          `σ² = 20 / 4 = 5.0   ·   √(5 + ε) ≈ ${fmt(divisor, 3)}`,
          -825,
          388,
          32,
          ROLE.norm,
          'mono',
          'left',
        )
          .glow(7, ROLE.norm)
          .opacity(alpha),
      );
    }

    // 3D sphere caption at top-right
    nodes.push(
      txt(
        divP > 0.5 ? 'Projected onto unit-spread shell' : 'Centered spread before scaling',
        485,
        -355,
        28,
        divP > 0.5 ? ROLE.norm : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Beat 1: Constant flat token [7, 7, 7, 7] epsilon guard (clean lower-right zone)
    if (flatP > 0.05) {
      nodes.push(
        txt(
          'Flat [7, 7, 7, 7] -> centered [0, 0, 0, 0]',
          505,
          295,
          28,
          ROLE.write,
          'mono',
          'center',
        ).opacity(flatP * alpha),
        txt(
          '√(0 + ε) = √ε > 0   ->   output = [0, 0, 0, 0]',
          505,
          348,
          28,
          ROLE.gold,
          'mono',
          'center',
        )
          .glow(7, ROLE.gold)
          .opacity(flatP * alpha),
        txt('Var(x̂) = σ² / (σ² + ε) ≈ 1', 505, 402, 28, ROLE.norm, 'mono', 'center').opacity(
          flatP * alpha,
        ),
      );
    }

    return nodes;
  });

  const formula = glowTex('\\hat{x}_i = \\frac{x_i - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}}', {
    x: 485,
    y: 205,
    size: 40,
    color: ROLE.norm,
  });

  s.add(cinemaAtmosphere(ROLE.norm, ROLE.gold), title, view3d, mainLayer, formula);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.14, phi: 0.96, distance: 13.8 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  // Beat 0: Accumulate the 4 squares, then divide centered coordinates by sqrt(5+eps)
  playCue(s, c, 'scale-squares', (d) => s.play(sqProgress.to(4, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'scale-divide', (d) => s.play(divProgress.to(1, { duration: d })), { dur: 0.95 });

  // Beat 1: Flat token [7, 7, 7, 7] and epsilon denominator protection
  playCue(
    s,
    c,
    'scale-constant-vector-denominator-b2-1',
    (d) => s.play(flatReveal.to(1, { duration: d })),
    { dur: 0.6 },
  );
}
