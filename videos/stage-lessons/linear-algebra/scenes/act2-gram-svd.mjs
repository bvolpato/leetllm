// Act 2: Gram Matrix Construction, 3D Eigenvector Action, and the 3 Geometric Moves
// of SVD (V^T Rotation, 3D Sigma Stretch, 3D U Output Embedding, and Paired Sign Invariance).
import {
  Node,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  point3d,
  rect,
  surface,
  vector3d,
} from 'vizmatic/stage';
import {
  A,
  COSMOS,
  GRAM_DATA,
  LA,
  U,
  aura,
  bracketMatrix,
  cinemaGrid,
  cinematic3d,
  common,
  contrast,
  cueTo,
  dotProduct,
  fmt,
  glassPlate,
  glowDot,
  glowTex,
  livingDrift,
  markDecor,
  orbitScene,
  photonWire,
  polyPath,
  pulseCue,
  strengths,
  svdBuild,
  txt,
  vecArrow,
  vectorPlane2d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. gram: Let the columns reveal their directions
// Cues: gram-column-products, gram-slow, gram-overlap, gram-mirror, gram-rollback
// ---------------------------------------------------------------------------
export function gram(s, c) {
  const sweepP = s.value(0);
  const c00 = s.value(0);
  const c01 = s.value(0);
  const c10 = s.value(0);
  const c11 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.48, seed: 6 }));
  s.add(aura(390, -20, 520, '#ffd16622', '#60a5fa14'));

  const eqGram = glowTex(String.raw`G = A^\top A`, {
    x: 430,
    y: -355,
    size: 48,
    color: COSMOS.gold,
    glow: 8,
  });

  const live = dynamic(() => {
    const fills = [c00.value, c01.value, c10.value, c11.value];
    // Determine which cell pair is currently active
    let activeIdx = 0;
    if (c11.value > 0.02) activeIdx = 3;
    else if (c10.value > 0.02) activeIdx = 2;
    else if (c01.value > 0.02) activeIdx = 1;
    else if (c00.value > 0.02) activeIdx = 0;

    const pairs = [
      { r: 0, col: 0, left: 0, right: 0, label: 'slow · slow', expr: '1·1 + 0·0 + 1·1 = 2' },
      { r: 0, col: 1, left: 0, right: 1, label: 'slow · rollback', expr: '1·0 + 0·1 + 1·1 = 1' },
      { r: 1, col: 0, left: 1, right: 0, label: 'rollback · slow', expr: '0·1 + 1·0 + 1·1 = 1' },
      {
        r: 1,
        col: 1,
        left: 1,
        right: 1,
        label: 'rollback · rollback',
        expr: '0·0 + 1·1 + 1·1 = 2',
      },
    ];
    const active = pairs[activeIdx];
    const hiCell = fills[activeIdx] > 0.02 ? [active.r, active.col] : null;

    const gramRows = [
      [c00.value > 0.5 ? '2' : '·', c01.value > 0.5 ? '1' : '·'],
      [c10.value > 0.5 ? '1' : '·', c11.value > 0.5 ? '2' : '·'],
    ];

    const colX = [-615, -455];
    const colColors = [LA.slow, LA.rollback];

    const nodes = [
      txt('COLUMN DOT PRODUCTS', -535, -395, 26, COSMOS.cyan, 'mono'),
      txt('slow', colX[0], -270, 28, LA.slow, 'mono'),
      txt('rollback', colX[1], -270, 28, LA.rollback, 'mono'),
      // Highlight beams behind the active columns of A
      markDecor(
        rect(120, 326, {
          fill: active.left === 0 ? '#60a5fa20' : '#ff6b8b20',
          stroke: colColors[active.left],
          width: 2.2,
          radius: 12,
        }).at(colX[active.left], -55),
      ),
      active.right !== active.left
        ? markDecor(
            rect(120, 326, {
              fill: active.right === 0 ? '#60a5fa20' : '#ff6b8b20',
              stroke: colColors[active.right],
              width: 2.2,
              radius: 12,
            }).at(colX[active.right], -55),
          )
        : group(),
      bracketMatrix(A, {
        cx: -535,
        cy: -55,
        cellW: 160,
        cellH: 98,
        textSize: 42,
        bracketColor: COSMOS.cyan,
        cellColor: (_r, col) => colColors[col],
      }),
      // Row names
      txt('Slow only', -850, -153, 26, LA.slow, 'sans', 'left'),
      txt('Rollback', -850, -55, 26, LA.rollback, 'sans', 'left'),
      txt('Both', -850, 43, 26, LA.both, 'sans', 'left'),
      // Center photon stream connecting active columns to Gram cell
      photonWire(
        [
          [-340, -55],
          [160, -55],
        ],
        drift.value * 4 + sweepP.value,
        { color: COSMOS.gold, width: 3.4, glow: 10 },
      ),
      // Right: 2x2 Gram matrix filling cell by cell
      bracketMatrix(gramRows, {
        cx: 430,
        cy: -55,
        cellW: 165,
        cellH: 130,
        textSize: 54,
        bracketColor: COSMOS.gold,
        highlightCell: hiCell,
        cellColor: (r, col) => {
          const idx = r * 2 + col;
          return fills[idx] > 0.5 ? COSMOS.gold : COSMOS.dim;
        },
      }),
      txt('slow', 348, -225, 26, LA.slow, 'mono'),
      txt('rollback', 512, -225, 26, LA.rollback, 'mono'),
      txt('slow', 200, -120, 26, LA.slow, 'mono', 'right'),
      txt('rollback', 200, 10, 26, LA.rollback, 'mono', 'right'),
      // Active dot-product calculation strip at bottom
      glassPlate(0, 315, 1340, 170, { stroke: COSMOS.gold, glow: 8 }),
      txt(active.label.toUpperCase(), -610, 275, 26, COSMOS.gold, 'mono', 'left'),
      txt(active.expr, -610, 340, 42, COSMOS.ink, 'mono', 'left').glow(6, COSMOS.gold),
      txt(
        c11.value > 0.6 ? 'Symmetric: G = AᵀA is 2 × 2' : 'Each entry counts shared tickets',
        610,
        312,
        28,
        COSMOS.muted,
        'sans',
        'right',
      ),
    ];

    return group(...nodes);
  });

  s.add(live, eqGram);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'gram-column-products', sweepP, 1, { dur: 4.0 });
  cueTo(s, c, 'gram-slow', c00, 1, { dur: 0.7 });
  cueTo(s, c, 'gram-overlap', c01, 1, { dur: 0.7 });
  cueTo(s, c, 'gram-mirror', c10, 1, { dur: 0.7 });
  cueTo(s, c, 'gram-rollback', c11, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 7. gram-action: What does the Gram matrix do to each arrow? (3D SHOWCASE!)
// Cues: gram-eigen-directions, common-strength-b3-1
// ---------------------------------------------------------------------------
export function gramAction(s, c) {
  const stretchP = s.value(0);
  const strengthP = s.value(0);

  s.add(aura(-210, 20, 620, '#60a5fa2a', '#ff6b8b18'));
  s.add(aura(560, -60, 400, '#ffd1661c', '#07091000'));

  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.8,
    unit: 112,
    ambient: 0.4,
    shine: 0.44,
    brightness: 1.15,
    fog: 0.07,
    focus: [0, 0, 0.7],
  }).at(-235, 76);

  // 3D Rayleigh quotient / quadratic energy bowl z = 0.28 * v^T G v = 0.28 * (2x^2 + 2xy + 2y^2)
  const HALF = 2.4;
  const bowlSurface = surface(
    (wx, wy) => {
      const q = 2 * wx * wx + 2 * wx * wy + 2 * wy * wy;
      const t = stretchP.value;
      return 0.14 + (0.08 + 0.16 * t) * Math.min(11, q);
    },
    {
      x: [-HALF, HALF],
      y: [-HALF, HALF],
      resolution: [42, 42],
      animate: true,
      colors: ['#070b1a', '#182454', '#284c8f', '#5ce1e6', '#ffd166'],
      mesh: '#7de3ff',
      meshOpacity: 0.16,
      meshWidth: 0.6,
      opacity: 0.78,
    },
  );

  // Morphing unit circle -> ellipse under (1-t)I + t*G sitting on z = 0.24
  const morphRing = curve3d(
    (u) => {
      const a = u * Math.PI * 2;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      const t = stretchP.value;
      const gx = (1 - t) * cx + t * (2 * cx + cy);
      const gy = (1 - t) * cy + t * (cx + 2 * cy);
      return [gx, gy, 0.24];
    },
    0,
    1,
    { samples: 84, color: COSMOS.gold, width: 4.5, glow: 10, onTop: true, animate: true },
  );

  // Faint original unit circle for comparison
  const unitRing = curve3d(
    (u) => [Math.cos(u * Math.PI * 2), Math.sin(u * Math.PI * 2), 0.22],
    0,
    1,
    {
      samples: 64,
      color: COSMOS.cyan,
      width: 2.2,
      opacity: 0.65,
      onTop: true,
    },
  );

  // Eigenvalue-scaled common arrow: length 1 -> 3 along common = [1/sqrt2, 1/sqrt2]
  const commonVec = vector3d(
    [0, 0, 0.25],
    () => {
      const scale = 1 + 2 * stretchP.value;
      return [common[0] * scale, common[1] * scale, 0.25];
    },
    { color: LA.common, width: 6.5, glow: 14, onTop: true },
  );

  // Contrast arrow stays locked at length 1 along contrast = [-1/sqrt2, 1/sqrt2]
  const contrastVec = vector3d([0, 0, 0.25], [contrast[0], contrast[1], 0.25], {
    color: LA.contrast,
    width: 6.5,
    glow: 14,
    onTop: true,
  });

  // Invariant eigenlines on the floor
  const eigenLines = [
    line3d([-2.4, -2.4, 0.2], [2.4, 2.4, 0.2], {
      color: LA.common,
      width: 2.2,
      opacity: 0.55,
    }),
    line3d([-1.8, 1.8, 0.2], [1.8, -1.8, 0.2], {
      color: LA.contrast,
      width: 2.2,
      opacity: 0.55,
    }),
  ];

  view3d.add(bowlSurface, ...eigenLines, unitRing, morphRing, commonVec, contrastVec);

  const eqEigen = glowTex(String.raw`G v_i = \lambda_i v_i`, {
    x: 565,
    y: -150,
    size: 46,
    color: COSMOS.gold,
    glow: 8,
  });

  const eqSigma = glowTex(String.raw`\sigma_i = \sqrt{\lambda_i}`, {
    x: 565,
    y: 265,
    size: 46,
    color: COSMOS.cyan,
    glow: 8,
  });

  const hud = dynamic(() => {
    const p = stretchP.value;
    const sp = strengthP.value;
    const curScale = 1 + 2 * p;
    const rx = 565;

    return group(
      txt('GRAM EIGENSTRUCTURE', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Eigenvectors stay on their line', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      glassPlate(rx, 40, 560, 680, { stroke: '#3a4f80', glow: 6 }),
      txt('EIGENACTION  (G = AᵀA)', rx, -255, 26, COSMOS.muted, 'mono'),
      markDecor(line([rx - 225, -75], [rx + 225, -75], { stroke: '#2c3d66', width: 1.6 })),
      txt('Common  v₁', rx - 220, -16, 28, LA.common, 'sans', 'left'),
      txt(`× ${fmt(curScale, 2)}`, rx + 220, -16, 40, LA.common, 'mono', 'right').glow(
        8,
        LA.common,
      ),
      txt('Contrast  v₂', rx - 220, 62, 28, LA.contrast, 'sans', 'left'),
      txt('× 1.00', rx + 220, 62, 40, LA.contrast, 'mono', 'right').glow(8, LA.contrast),
      markDecor(line([rx - 225, 130], [rx + 225, 130], { stroke: '#2c3d66', width: 1.6 })),
      sp > 0.05
        ? group(
            txt('SINGULAR STRENGTHS', rx, 180, 26, COSMOS.cyan, 'mono'),
            txt('σ₁ = √3 ≈ 1.732   ·   σ₂ = 1', rx, 340, 30, COSMOS.gold, 'mono'),
          ).opacity(sp)
        : txt('‖Av‖² = vᵀGv = λ', rx, 200, 34, COSMOS.gold, 'mono'),
    );
  });

  s.add(view3d, hud, eqEigen);

  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });
  cueTo(s, c, 'gram-eigen-directions', stretchP, 1, { dur: 1.8 });
  cueTo(s, c, 'common-strength-b3-1', strengthP, 1, { dur: 0.9 });
  c.show('common-strength-b3-1', eqSigma);
}

// ---------------------------------------------------------------------------
// 8. svd-rotate: SVD, first move: change coordinates (V^T)
// Cues: svd-input-basis
// ---------------------------------------------------------------------------
export function svdRotate(s, c) {
  const rotP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.fit, opacity: 0.48, seed: 8 }));
  s.add(aura(-160, 20, 560, '#6ee7b722', '#60a5fa18'));

  const eqVt = glowTex(
    String.raw`V^\top x = \begin{bmatrix} 1/\sqrt{2} \\ -1/\sqrt{2} \end{bmatrix}`,
    {
      x: 560,
      y: 45,
      size: 40,
      color: COSMOS.gold,
      glow: 8,
    },
  );

  const live = dynamic(() => {
    const p = rotP.value;
    const angle = (-Math.PI / 4) * p;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const rotMat = [
      [ca, -sa],
      [sa, ca],
    ];

    const plane = vectorPlane2d({
      originX: -245,
      originY: 65,
      scale: 190,
      xRange: [-1.15, 1.15],
      yRange: [-1.15, 1.15],
      matrix: rotMat,
      unitCircle: true,
      circleColor: COSMOS.cyan,
      xLabel: '',
      yLabel: '',
    });

    const orig = plane.pt(0, 0);
    // Input vector x = [1, 0] rotates to [cos(angle), sin(angle)]
    const rx = ca;
    const ry = sa;
    const xTip = plane.pt(rx, ry);

    // Rotated basis directions (common -> [1,0], contrast -> [0,1])
    const cVec = plane.applyM(common[0], common[1]);
    const kVec = plane.applyM(contrast[0], contrast[1]);

    // Swept rotation arc
    const arcPts = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const a = (angle * i) / steps;
      arcPts.push(plane.pt(0.52 * Math.cos(a), 0.52 * Math.sin(a)));
    }

    const pulse = 1 + 0.06 * Math.sin(drift.value * Math.PI * 8);

    return group(
      txt('SVD MOVE 1 OF 3  ·  ROTATE', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Change into common & contrast coordinates', -840, -360, 44, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt(p > 0.6 ? 'common axis' : 'slow axis', -640, 395, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        p > 0.6 ? 'contrast axis' : 'rollback axis',
        -640,
        -255,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      p > 0.04
        ? markDecor(new Node(polyPath(arcPts)).stroke(COSMOS.gold, 3.2, 0.85).glow(8, COSMOS.gold))
        : group(),
      vecArrow(orig, plane.pt(cVec[0], cVec[1]), { color: LA.common, width: 4.5, glow: 8 }),
      vecArrow(orig, plane.pt(kVec[0], kVec[1]), { color: LA.contrast, width: 4.5, glow: 8 }),
      vecArrow(orig, xTip, { color: LA.fit, width: 7, tip: 17, glow: 14 }),
      glowDot(xTip[0], xTip[1], { radius: 9 * pulse, color: LA.fit, glow: 12 }),
      glassPlate(560, 45, 540, 560, { stroke: LA.fit, glow: 6 }),
      txt('INPUT  x = [1, 0]', 560, -185, 28, LA.fit, 'mono'),
      txt(`Rotated: [${fmt(rx, 2)}, ${fmt(ry, 2)}]`, 560, -125, 32, LA.fit, 'mono').glow(6, LA.fit),
      txt(`Angle  ${fmt(-45 * p, 0)}°`, 560, -68, 30, COSMOS.cyan, 'mono'),
      txt('Length preserved: ‖Vᵀx‖ = 1', 560, 200, 28, COSMOS.muted, 'sans'),
      txt('Vᵀ takes dot products with v₁, v₂', 560, 250, 26, COSMOS.muted, 'sans'),
    );
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'svd-input-basis', rotP, 1, { dur: 1.8 });
  c.show('svd-input-basis', eqVt);
}

// ---------------------------------------------------------------------------
// 9. svd-stretch: Second move: stretch the coordinates (Sigma) (3D SHOWCASE!)
// Cues: singular-strengths
// ---------------------------------------------------------------------------
export function svdStretch(s, c) {
  const stretchP = s.value(0);

  s.add(aura(-190, 25, 620, '#ffd16628', '#5ce1e616'));

  const view3d = cinematic3d({
    theta: -0.7,
    phi: 1.06,
    distance: 14.4,
    unit: 132,
    ambient: 0.42,
    shine: 0.46,
    brightness: 1.16,
    fog: 0.07,
    focus: [0, 0, 0.25],
  }).at(-210, 30);

  const s1 = () => 1 + (strengths[0] - 1) * stretchP.value;

  // 3D transforming wireframe grid on the xy plane (stretches x by sqrt(3), keeps y at 1)
  const grid3dLines = [];
  for (let i = -2; i <= 2; i++) {
    grid3dLines.push(
      line3d(
        () => [i * s1(), -2, 0],
        () => [i * s1(), 2, 0],
        { color: i === 0 ? LA.contrast : '#3b6ca8', width: i === 0 ? 3.2 : 1.5, opacity: 0.65 },
      ),
      line3d(
        () => [-2 * s1(), i, 0],
        () => [2 * s1(), i, 0],
        { color: i === 0 ? LA.common : '#3b6ca8', width: i === 0 ? 3.2 : 1.5, opacity: 0.65 },
      ),
    );
  }

  // Unit circle morphing smoothly into a glowing 3D eigen-ellipse + tilted ellipsoid ribbons
  const mainEllipse = curve3d(
    (u) => {
      const a = u * Math.PI * 2;
      return [Math.cos(a) * s1(), Math.sin(a), 0.06];
    },
    0,
    1,
    { samples: 90, color: COSMOS.gold, width: 5.5, glow: 14, onTop: true, animate: true },
  );

  const meridianA = curve3d(
    (u) => {
      const a = u * Math.PI * 2;
      return [Math.cos(a) * s1(), 0, Math.sin(a) * 0.85];
    },
    0,
    1,
    { samples: 72, color: COSMOS.cyan, width: 2.6, opacity: 0.62, animate: true },
  );

  const meridianB = curve3d(
    (u) => {
      const a = u * Math.PI * 2;
      return [0, Math.cos(a), Math.sin(a) * 0.85];
    },
    0,
    1,
    { samples: 72, color: LA.contrast, width: 2.4, opacity: 0.52 },
  );

  // Reference unit circle ghost
  const refCircle = curve3d(
    (u) => [Math.cos(u * Math.PI * 2), Math.sin(u * Math.PI * 2), 0.02],
    0,
    1,
    {
      samples: 64,
      color: '#6b7fa8',
      width: 2.2,
      opacity: 0.55,
    },
  );

  // Rotated green input vector stretching along common axis: [1/sqrt2 * s1, -1/sqrt2, 0.08]
  const greenVec = vector3d([0, 0, 0.08], () => [Math.SQRT1_2 * s1(), -Math.SQRT1_2, 0.08], {
    color: LA.fit,
    width: 7,
    glow: 14,
    onTop: true,
  });

  // Major & minor semi-axes arrows
  const axisCommon = vector3d([0, 0, 0.08], () => [s1(), 0, 0.08], {
    color: LA.common,
    width: 4.5,
    glow: 10,
    onTop: true,
  });
  const axisContrast = vector3d([0, 0, 0.08], [0, 1, 0.08], {
    color: LA.contrast,
    width: 4.5,
    glow: 10,
    onTop: true,
  });

  view3d.add(
    ...grid3dLines,
    refCircle,
    meridianA,
    meridianB,
    mainEllipse,
    axisCommon,
    axisContrast,
    greenVec,
  );

  const eqSigma = glowTex(
    String.raw`\Sigma = \begin{bmatrix} \sqrt{3} & 0 \\ 0 & 1 \end{bmatrix}`,
    { x: 565, y: -110, size: 42, color: COSMOS.gold, glow: 8 },
  );

  const hud = dynamic(() => {
    const curS1 = s1();
    const curX = Math.SQRT1_2 * curS1;
    const rx = 565;
    return group(
      txt('SVD MOVE 2 OF 3  ·  STRETCH', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('Unit circle becomes an ellipse', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      glassPlate(rx, 45, 550, 620, { stroke: COSMOS.gold, glow: 6 }),
      txt('SINGULAR SCALE MATRIX', rx, -215, 26, COSMOS.muted, 'mono'),
      markDecor(line([rx - 220, 20], [rx + 220, 20], { stroke: '#2c3d66', width: 1.6 })),
      txt('Common stretch', rx - 215, 85, 28, LA.common, 'sans', 'left'),
      txt(`× ${fmt(curS1, 3)}`, rx + 215, 85, 38, LA.common, 'mono', 'right').glow(8, LA.common),
      txt('Contrast stretch', rx - 215, 155, 28, LA.contrast, 'sans', 'left'),
      txt('× 1.000', rx + 215, 155, 38, LA.contrast, 'mono', 'right').glow(8, LA.contrast),
      markDecor(line([rx - 220, 215], [rx + 220, 215], { stroke: '#2c3d66', width: 1.6 })),
      txt(`Σ Vᵀ x = [${fmt(curX, 2)}, −0.71]`, rx, 275, 32, LA.fit, 'mono').glow(6, LA.fit),
    );
  });

  s.add(view3d, hud, eqSigma);
  orbitScene(s, c, view3d, { theta: -0.15, phi: 0.92 });
  cueTo(s, c, 'singular-strengths', stretchP, 1, { dur: 1.8 });
}

// ---------------------------------------------------------------------------
// 10. svd-embed: Third move: build the three-ticket output (U) (3D SHOWCASE!)
// Cues: svd-common-output, svd-output, svd-middle-cancel
// ---------------------------------------------------------------------------
export function svdEmbed(s, c) {
  const part1P = s.value(0);
  const part2P = s.value(0);
  const cancelPulse = s.value(0);

  s.add(aura(-210, 25, 620, '#6ee7b726', '#60a5fa18'));

  const model = svdBuild(1, 1);
  // Common contribution = c1 * u1 = [0.5, 0.5, 1.0]
  // Contrast contribution = c2 * u2 = [0.5, -0.5, 0.0]
  // Final output = [1.0, 0.0, 1.0]
  const c1u1 = U[0].map((v) => v * model.coefficients[0]);
  const c2u2 = U[1].map((v) => v * model.coefficients[1]);

  const view3d = cinematic3d({
    theta: -0.68,
    phi: 1.04,
    distance: 14.8,
    unit: 215,
    ambient: 0.42,
    shine: 0.42,
    brightness: 1.15,
    fog: 0.06,
    focus: [0.45, 0.15, 0.55],
  }).at(-235, 45);

  // 3D ticket-space axes (Slow, Rollback, Both)
  const axes3 = [
    line3d([-0.2, 0, 0], [1.45, 0, 0], { color: LA.slow, width: 2.8, opacity: 0.8 }),
    line3d([0, -0.4, 0], [0, 1.25, 0], { color: LA.rollback, width: 2.8, opacity: 0.8 }),
    line3d([0, 0, -0.2], [0, 0, 1.45], { color: LA.both, width: 2.8, opacity: 0.8 }),
  ];

  // Column-space plane spanned by u1 and u2 in R^3 (every point has z = x + y)
  const colPlane = surface((wx, wy) => wx + wy, {
    x: [-0.25, 1.25],
    y: [-0.25, 1.1],
    resolution: [18, 18],
    colors: ['#0d1838', '#1a3668', '#2a5a96'],
    mesh: '#68b4ff',
    meshOpacity: 0.24,
    meshWidth: 0.7,
    opacity: 0.5,
  });

  // First vector: common contribution c1 * u1 = [0.5, 0.5, 1.0]
  const vecCommon = vector3d([0, 0, 0], () => c1u1.map((v) => v * Math.max(0.01, part1P.value)), {
    color: LA.common,
    width: 6.5,
    glow: 12,
    onTop: true,
  });

  // Second vector added head-to-tail: c2 * u2 = [0.5, -0.5, 0.0]
  const vecContrast = vector3d(
    () => c1u1.map((v) => v * part1P.value),
    () => c1u1.map((v, i) => v * part1P.value + c2u2[i] * Math.max(0.001, part2P.value)),
    { color: LA.contrast, width: 6.5, glow: 12, onTop: true },
  );

  // Resulting green output arrow from origin to current sum [1, 0, 1]
  const vecSum = vector3d(
    [0, 0, 0],
    () => c1u1.map((v, i) => v * part1P.value + c2u2[i] * part2P.value),
    { color: LA.fit, width: 7.2, glow: 14, onTop: true },
  );

  const tipDot = point3d(() => c1u1.map((v, i) => v * part1P.value + c2u2[i] * part2P.value), {
    color: COSMOS.gold,
    radius: 10,
    glow: 14,
    onTop: true,
  });

  view3d.add(colPlane, ...axes3, vecCommon, vecContrast, vecSum, tipDot);

  const eqU = glowTex(String.raw`A x = U \Sigma V^\top x`, {
    x: 565,
    y: -255,
    size: 42,
    color: COSMOS.gold,
    glow: 8,
  });

  const hud = dynamic(() => {
    const p1 = part1P.value;
    const p2 = part2P.value;
    const cp = cancelPulse.value;
    const out = c1u1.map((v, i) => v * p1 + c2u2[i] * p2);
    const rx = 565;
    const names = ['Slow only', 'Rollback', 'Both'];
    const barScale = 190;

    const rows = out.flatMap((val, i) => {
      const yy = -105 + i * 126;
      const col = LA.tickets[i];
      const isMiddle = i === 1 && cp > 0.1;
      const barW = Math.max(4, Math.abs(val) * barScale);
      return [
        isMiddle
          ? markDecor(
              rect(510, 96, {
                fill: '#ff6b8b1a',
                stroke: LA.contrast,
                width: 2.4,
                radius: 12,
              }).at(rx, yy + 10),
            )
          : group(),
        txt(names[i], rx - 220, yy - 12, 28, col, 'sans', 'left'),
        txt(fmt(val, 2), rx + 220, yy - 12, 38, col, 'mono', 'right').glow(6, col),
        rect(barW, 18, { fill: col, stroke: null, radius: 6 })
          .at(rx - 220 + barW / 2, yy + 32)
          .glow(8, col),
        isMiddle
          ? txt('+0.5 − 0.5 = 0  (cancels!)', rx + 220, yy + 32, 26, LA.contrast, 'mono', 'right')
          : group(),
      ];
    });

    return group(
      txt('SVD MOVE 3 OF 3  ·  EMBED IN R³', -840, -420, 26, LA.fit, 'mono', 'left'),
      txt('Build the 3-ticket output', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      glassPlate(rx, 45, 560, 690, { stroke: LA.fit, glow: 6 }),
      ...rows,
      txt(
        p2 > 0.7 ? 'Output [1, 0, 1] = slow-page tickets' : 'Add common, then contrast in U',
        rx,
        320,
        28,
        p2 > 0.7 ? LA.fit : COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(view3d, hud, eqU);
  orbitScene(s, c, view3d, { theta: -0.2, phi: 0.96 });
  cueTo(s, c, 'svd-common-output', part1P, 1, { dur: 1.2 });
  cueTo(s, c, 'svd-output', part2P, 1, { dur: 1.3 });
  pulseCue(s, c, 'svd-middle-cancel', cancelPulse, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 11. svd-sign: Two sign flips leave the answer fixed
// Cues: signed-right
// ---------------------------------------------------------------------------
export function svdSign(s, c) {
  const flipP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.48, seed: 11 }));
  s.add(aura(-480, -40, 420, '#60a5fa22', '#07091000'));
  s.add(aura(480, -40, 420, '#6ee7b722', '#07091000'));

  const eqSign = glowTex(String.raw`(-u_1)\,\sigma_1\,(-v_1^\top) \;=\; u_1\,\sigma_1\,v_1^\top`, {
    x: 0,
    y: 360,
    size: 46,
    color: COSMOS.gold,
    glow: 8,
  });

  const live = dynamic(() => {
    const p = flipP.value;
    const theta = Math.PI * p; // smooth 180-deg flip from +1 to -1
    const signNum = Math.cos(theta);
    const flipped = p > 0.5;
    const signStr = flipped ? '−' : '+';
    const colDial = flipped ? COSMOS.gold : LA.common;

    // Left dial: Input singular vector v1 flips 180 degrees
    const lx = -530;
    const ly = -55;
    const r = 145;
    const baseAngle = -Math.PI / 4;
    const aNow = baseAngle + theta;
    const vx = Math.cos(aNow) * r;
    const vy = Math.sin(aNow) * r;

    // Right dial: Output singular vector u1 flips 180 degrees in lockstep
    const rx = 530;
    const ry = -55;
    const ux = Math.cos(aNow) * r;
    const uy = Math.sin(aNow) * r;

    const pulse = 1 + 0.06 * Math.sin(drift.value * Math.PI * 8);

    return group(
      txt('SVD SIGN INVARIANCE', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('Paired sign flips cancel exactly', -840, -360, 48, COSMOS.ink, 'serif', 'left'),

      // Left dial: v1
      circle(r + 12, { fill: '#0c1326', stroke: '#344774', width: 2.4 }).at(lx, ly),
      vecArrow([lx, ly], [lx + vx, ly + vy], { color: colDial, width: 6.5, tip: 16, glow: 12 }),
      txt(`${signStr} v₁`, lx, ly - 195, 36, colDial, 'mono').glow(8, colDial),
      txt('Input singular direction', lx, ly + 195, 28, COSMOS.muted, 'sans'),

      // Right dial: u1
      circle(r + 12, { fill: '#0c1326', stroke: '#344774', width: 2.4 }).at(rx, ry),
      vecArrow([rx, ry], [rx + ux, ry + uy], { color: colDial, width: 6.5, tip: 16, glow: 12 }),
      txt(`${signStr} u₁`, rx, ry - 195, 36, colDial, 'mono').glow(8, colDial),
      txt('Output singular direction', rx, ry + 195, 28, COSMOS.muted, 'sans'),

      // Center invariant card: coordinate flips, product stays locked!
      glassPlate(0, -55, 520, 390, { stroke: LA.fit, glow: 8 }),
      txt('COORDINATE  σ₁ (v₁ᵀ x)', 0, -195, 26, COSMOS.muted, 'mono'),
      txt(fmt(signNum * Math.sqrt(1.5), 3), 0, -130, 48, colDial, 'mono').glow(8, colDial),
      markDecor(line([-205, -72], [205, -72], { stroke: '#2c3d66', width: 1.8 })),
      txt('RECONSTRUCTED OUTPUT', 0, -20, 26, LA.fit, 'mono'),
      txt('[1.00,  0.00,  1.00]', 0, 46, 40, LA.fit, 'mono').glow(10 * pulse, LA.fit),
      txt('Completely unchanged', 0, 108, 28, COSMOS.ink, 'sans'),

      // Photon bridges from dials into center
      photonWire(
        [
          [lx + r + 18, ly],
          [-265, ly],
        ],
        drift.value * 3,
        { color: colDial, width: 2.8, glow: 8 },
      ),
      photonWire(
        [
          [265, ry],
          [rx - r - 18, ry],
        ],
        drift.value * 3 + 0.5,
        { color: colDial, width: 2.8, glow: 8 },
      ),
    );
  });

  s.add(live, eqSign);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'signed-right', flipP, 1, { dur: 1.5 });
}
