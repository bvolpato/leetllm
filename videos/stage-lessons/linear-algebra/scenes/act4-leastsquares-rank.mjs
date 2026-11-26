// Act 4: 3D Least-Squares Orthogonal Projection, 3D Column-Space Rank Collapse,
// Collapsed Duplicate Fit, and Nullspace Minimum-Norm Selection.
import {
  Node,
  circle,
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
  B,
  COSMOS,
  DUP_FIT,
  LA,
  LS_FIT,
  apply,
  aura,
  cinemaGrid,
  cinematic3d,
  cueTo,
  dotProduct,
  fmt,
  glassPlate,
  glowDot,
  glowTex,
  livingDrift,
  markDecor,
  mix,
  normalizeVector,
  orbitScene,
  polyPath,
  pulseCue,
  rightAngle,
  severity,
  txt,
  vecArrow,
  vectorPlane2d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 18. fit-projection: Can two weights fit three severity scores? (3D SHOWCASE!)
// Cues: fit-span, joint-prediction, fit-projection, fit-residual, slow-residuals, rollback-residuals
// ---------------------------------------------------------------------------
export function fitProjection(s, c) {
  const spanP = s.value(0);
  const jointP = s.value(0);
  const fitP = s.value(0);
  const resP = s.value(0);
  const slowHi = s.value(0);
  const rollHi = s.value(0);
  const drift = s.value(0);

  s.add(aura(-230, 30, 620, '#6ee7b726', '#60a5fa18'));

  const view3d = cinematic3d({
    theta: -0.72,
    phi: 1.05,
    distance: 15.8,
    unit: 118,
    ambient: 0.42,
    shine: 0.44,
    brightness: 1.15,
    fog: 0.06,
    focus: [0.9, 1.3, 1.5],
  }).at(-265, 50);

  // Column space plane col(A) in R^3: every vector [w1, w2, w1 + w2] lies on z = x + y
  const colSpace = surface((wx, wy) => wx + wy, {
    x: [-0.2, 2.2],
    y: [-0.2, 2.4],
    resolution: [20, 20],
    colors: ['#0c1736', '#1a386b', '#2b5f9e'],
    mesh: '#6db9ff',
    meshOpacity: 0.25,
    meshWidth: 0.7,
    opacity: 0.62,
  });

  // 3D coordinate axes
  const axes3 = [
    line3d([0, 0, 0], [2.4, 0, 0], { color: LA.slow, width: 2.5, opacity: 0.75 }),
    line3d([0, 0, 0], [0, 2.6, 0], { color: LA.rollback, width: 2.5, opacity: 0.75 }),
    line3d([0, 0, 0], [0, 0, 3.2], { color: LA.both, width: 2.5, opacity: 0.75 }),
  ];

  // Current fitted point on the plane: moves from [1, 2, 3] -> [2/3, 5/3, 7/3] on fit-projection
  const predPt = () => {
    const w = mix([1, 2], LS_FIT.weights, fitP.value);
    return apply(A, w);
  };

  // Observed severity target y = [1, 2, 2] (floating off the plane!)
  const targetDot = point3d(severity, { color: COSMOS.gold, radius: 13, glow: 16, onTop: true });
  const targetVec = vector3d([0, 0, 0], severity, {
    color: COSMOS.gold,
    width: 4.5,
    opacity: 0.65,
    onTop: true,
  });

  // Current prediction point on col(A) plane (only rises fully after joint-prediction)
  const predVec = vector3d(
    [0, 0, 0],
    () => {
      const p = predPt();
      return [p[0], p[1], p[2] * Math.max(0.05, jointP.value)];
    },
    { color: LA.fit, width: 6.5, glow: 14, onTop: true },
  );

  const predDot = point3d(
    () => {
      const p = predPt();
      return [p[0], p[1], p[2] * Math.max(0.05, jointP.value)];
    },
    { color: LA.fit, radius: 11, glow: 14, onTop: true },
  );

  // Pink perpendicular residual vector from fitted prediction to target y
  const residualVec = vector3d(
    () => predPt(),
    () => {
      const p = predPt();
      const t = resP.value;
      return [
        p[0] + (severity[0] - p[0]) * t,
        p[1] + (severity[1] - p[1]) * t,
        p[2] + (severity[2] - p[2]) * t,
      ];
    },
    { color: LA.contrast, width: 6.5, glow: 14, onTop: true },
  );

  view3d.add(colSpace, ...axes3, targetVec, targetDot, predVec, predDot, residualVec);

  const hud = dynamic(() => {
    const jP = jointP.value;
    const fP = fitP.value;
    const rP = resP.value;
    const sH = slowHi.value;
    const roH = rollHi.value;
    const w = mix([1, 2], LS_FIT.weights, fP);
    const pred = apply(A, w);
    const res = severity.map((v, i) => v - pred[i]);
    const sse = dotProduct(res, res);

    const rx = 530;
    const railLeft = rx - 210;
    const railW = 360;
    const mapRail = (v) => railLeft + (v / 3.2) * railW;
    const names = ['Slow [1, 0]', 'Rollback [0, 1]', 'Both [1, 1]'];

    const rows = severity.flatMap((obs, i) => {
      const yy = -155 + i * 124;
      const hiSlow = sH > 0.2 && (i === 0 || i === 2);
      const hiRoll = roH > 0.2 && (i === 1 || i === 2);
      const hiCol = hiRoll ? LA.rollback : hiSlow ? LA.slow : null;
      const showPred = i < 2 || jP > 0.2;
      const ox = mapRail(obs);
      const px = mapRail(pred[i]);
      const parts = [];

      if (hiCol) {
        parts.push(
          markDecor(
            rect(580, 96, { fill: '#ffffff0c', stroke: hiCol, width: 2.2, radius: 10 }).at(
              rx,
              yy + 12,
            ),
          ),
        );
      }

      parts.push(
        txt(names[i], rx - 270, yy - 16, 26, LA.tickets[i], 'mono', 'left'),
        txt(
          showPred
            ? rP > 0.2
              ? `gap ${res[i] >= 0 ? '+' : ''}${fmt(res[i], 2)}`
              : `pred ${fmt(pred[i], 2)}`
            : 'pred ?',
          rx + 270,
          yy - 16,
          26,
          showPred ? (rP > 0.2 ? LA.contrast : LA.fit) : COSMOS.gold,
          'mono',
          'right',
        ),
        markDecor(
          line([railLeft, yy + 28], [railLeft + railW, yy + 28], { stroke: '#3c4f7d', width: 3 }),
        ),
        // Observed severity yellow ring
        circle(14, { fill: null, stroke: COSMOS.gold, width: 3.6 })
          .at(ox, yy + 28)
          .glow(8, COSMOS.gold),
      );

      if (showPred) {
        if (rP > 0.1 || fP > 0.1) {
          parts.push(
            line([px, yy + 28], [ox, yy + 28], { stroke: LA.contrast, width: 5.2 }).glow(
              8,
              LA.contrast,
            ),
          );
        }
        parts.push(glowDot(px, yy + 28, { radius: 9, color: LA.fit, glow: 12 }));
      } else {
        const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
        parts.push(
          txt('?', mapRail(2.6), yy - 6, 34, COSMOS.gold, 'mono')
            .glow(8, COSMOS.gold)
            .opacity(pulse),
        );
      }
      return parts;
    });

    return group(
      txt('LEAST SQUARES IN R³', -840, -420, 26, LA.fit, 'mono', 'left'),
      txt('Orthogonal projection onto col(A)', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
      glassPlate(rx, 25, 620, 740, { stroke: rP > 0.3 ? LA.contrast : LA.fit, glow: 6 }),
      txt(`Weights  w = [${fmt(w[0], 2)}, ${fmt(w[1], 2)}]`, rx, -290, 34, LA.fit, 'mono').glow(
        6,
        LA.fit,
      ),
      txt('Yellow rings = observed y = [1, 2, 2]', rx, -238, 26, COSMOS.gold, 'sans'),
      ...rows,
      markDecor(line([rx - 265, 212], [rx + 265, 212], { stroke: '#2c3d66', width: 1.8 })),
      jP < 0.2
        ? txt('What severity for [1, 1]?', rx, 285, 36, COSMOS.gold, 'serif').glow(8, COSMOS.gold)
        : group(
            txt(
              fP > 0.5 ? 'SSE = 1/3 ≈ 0.33  (minimum!)' : `SSE = ${fmt(sse, 2)}`,
              rx,
              266,
              32,
              fP > 0.5 ? LA.fit : COSMOS.gold,
              'mono',
            ),
            txt(
              rP > 0.3 ? 'Residual [⅓, ⅓, −⅓] ⊥ both columns' : 'Closest point in the plane',
              rx,
              328,
              28,
              rP > 0.3 ? LA.contrast : COSMOS.muted,
              'sans',
            ),
          ),
    );
  });

  s.add(view3d, hud);
  livingDrift(s, c, drift, 1);
  orbitScene(s, c, view3d, { theta: -0.18, phi: 0.94 });

  pulseCue(s, c, 'fit-span', spanP, 1, { dur: 0.6 });
  // Strict prediction withholding during beat 0 hold: reveal 1+2=3 only after joint-prediction!
  cueTo(s, c, 'joint-prediction', jointP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'fit-projection', fitP, 1, { dur: 1.2 });
  cueTo(s, c, 'fit-residual', resP, 1, { dur: 0.8 });
  pulseCue(s, c, 'slow-residuals', slowHi, 1, { dur: 0.6 });
  pulseCue(s, c, 'rollback-residuals', rollHi, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 19. rank-collapse: Two columns can carry one direction (3D SHOWCASE!)
// Cues: duplicate-columns
// ---------------------------------------------------------------------------
export function rankCollapse(s, c) {
  const dupP = s.value(0);

  s.add(aura(-180, 20, 620, '#60a5fa28', '#ff6b8b16'));

  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 132,
    ambient: 0.42,
    shine: 0.44,
    brightness: 1.15,
    fog: 0.06,
    focus: [0.5, 0.3, 0.7],
  }).at(-210, 35);

  // Morphing 3D column-space grid: col1 = [1, 0, 1], col2 = [t, 1-t, 1]
  // At t = 0: full 2D plane spanned by [1,0,1] and [0,1,1].
  // At t = 1: collapses completely onto the 1D line span([1, 0, 1])!
  const gridLines = [];
  for (let i = -1; i <= 2; i++) {
    const uVal = i * 0.6;
    gridLines.push(
      line3d(
        () => {
          const t = dupP.value;
          const vMin = -0.6;
          return [uVal + t * vMin, (1 - t) * vMin, uVal + vMin];
        },
        () => {
          const t = dupP.value;
          const vMax = 1.2;
          return [uVal + t * vMax, (1 - t) * vMax, uVal + vMax];
        },
        { color: LA.rollback, width: i === 0 ? 3.4 : 1.7, opacity: 0.72 },
      ),
      line3d(
        () => {
          const t = dupP.value;
          const vVal = i * 0.6;
          const uMin = -0.6;
          return [uMin + t * vVal, (1 - t) * vVal, uMin + vVal];
        },
        () => {
          const t = dupP.value;
          const vVal = i * 0.6;
          const uMax = 1.2;
          return [uMax + t * vVal, (1 - t) * vVal, uMax + vVal];
        },
        { color: LA.slow, width: i === 0 ? 3.4 : 1.7, opacity: 0.72 },
      ),
    );
  }

  // Column 1 vector [1, 0, 1] stays fixed
  const col1Vec = vector3d([0, 0, 0], [1, 0, 1], {
    color: LA.slow,
    width: 7,
    glow: 14,
    onTop: true,
  });

  // Column 2 vector morphs from [0, 1, 1] -> [1, 0, 1], merging into col 1!
  const col2Vec = vector3d(
    [0, 0, 0],
    () => {
      const t = dupP.value;
      return [t, 1 - t, 1];
    },
    { color: LA.rollback, width: 6.5, glow: 14, onTop: true },
  );

  // Glowing collapsed 1D line highlight
  const lineHighlight = line3d([-0.9, 0, -0.9], [1.9, 0, 1.9], {
    color: COSMOS.gold,
    width: 3.2,
    opacity: 0.75,
  });

  view3d.add(...gridLines, lineHighlight, col1Vec, col2Vec);

  const hud = dynamic(() => {
    const t = dupP.value;
    // Exact singular values of A(t) = [[1, t], [0, 1-t], [1, 1]]
    const g00 = 2;
    const g01 = t + 1;
    const g11 = t * t + (1 - t) * (1 - t) + 1;
    const tr = g00 + g11;
    const disc = Math.hypot(g00 - g11, 2 * g01);
    const s1 = Math.sqrt(Math.max(0, (tr + disc) / 2));
    const s2 = Math.sqrt(Math.max(0, (tr - disc) / 2));
    const rx = 560;

    return group(
      txt('COLUMN SPACE & RANK', -840, -420, 26, LA.slow, 'mono', 'left'),
      txt('Duplicating a column collapses the plane', -840, -360, 44, COSMOS.ink, 'serif', 'left'),
      glassPlate(rx, 40, 560, 650, { stroke: t > 0.7 ? COSMOS.gold : LA.slow, glow: 6 }),
      txt('SINGULAR VALUES', rx, -225, 26, COSMOS.cyan, 'mono'),
      txt('σ₁', rx - 210, -145, 34, LA.slow, 'mono', 'left'),
      txt(fmt(s1, 3), rx + 210, -145, 42, LA.slow, 'mono', 'right').glow(8, LA.slow),
      txt('σ₂', rx - 210, -72, 34, LA.rollback, 'mono', 'left'),
      txt(
        fmt(s2, 3),
        rx + 210,
        -72,
        42,
        s2 < 0.05 ? COSMOS.gold : LA.rollback,
        'mono',
        'right',
      ).glow(8, LA.rollback),
      markDecor(line([rx - 220, 4], [rx + 220, 4], { stroke: '#2c3d66', width: 1.8 })),
      txt('COLUMNS STORED', rx, 65, 26, COSMOS.muted, 'mono'),
      txt('2', rx, 128, 52, COSMOS.ink, 'mono'),
      txt('EXACT RANK (NONZERO σ)', rx, 208, 26, COSMOS.gold, 'mono'),
      txt(t > 0.85 ? '1' : '2', rx, 280, 68, t > 0.85 ? COSMOS.gold : LA.fit, 'mono').glow(
        12,
        t > 0.85 ? COSMOS.gold : LA.fit,
      ),
    );
  });

  s.add(view3d, hud);
  orbitScene(s, c, view3d, { theta: -0.2, phi: 0.94 });
  cueTo(s, c, 'duplicate-columns', dupP, 1, { dur: 2.1 });
}

// ---------------------------------------------------------------------------
// 20. rank-fit: Fit the same target after the plane collapses
// Cues: duplicate-fit
// ---------------------------------------------------------------------------
export function rankFit(s, c) {
  const fitP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.fit, opacity: 0.48, seed: 20 }));
  s.add(aura(-210, 40, 560, '#6ee7b722', '#ffd16614'));

  // Orthonormal cross-section in R^3: along u = [1, 0, 1]/sqrt(2), normal n = residual / ||residual||
  const uDir = normalizeVector([1, 0, 1]);
  const nDir = normalizeVector(DUP_FIT.residual);
  const yCoord = [dotProduct(severity, uDir), dotProduct(severity, nDir)]; // [3/sqrt2, sqrt(4.5)]
  const bestAlong = yCoord[0]; // 3/sqrt(2) -> corresponds to s = 1.5

  const live = dynamic(() => {
    const p = fitP.value;
    const sVal = 3 + (DUP_FIT.weightSum - 3) * p; // slides from 3.0 -> 1.5
    const pred = [sVal, 0, sVal];
    const pAlong = dotProduct(pred, uDir);
    const res = severity.map((v, i) => v - pred[i]);
    const sse = dotProduct(res, res);

    const plane = vectorPlane2d({
      originX: -500,
      originY: 225,
      scale: 150,
      xRange: [-0.4, 4.5],
      yRange: [-0.4, 2.7],
      xLabel: '',
      yLabel: 'normal',
    });

    const orig = plane.pt(0, 0);
    const yPt = plane.pt(yCoord[0], yCoord[1]);
    const curPt = plane.pt(pAlong, 0);
    const lineEnd = plane.pt(4.4, 0);

    const rx = 560;
    const pulse = 1 + 0.06 * Math.sin(drift.value * Math.PI * 8);

    return group(
      txt('RANK-1 PROJECTION', -840, -420, 26, LA.fit, 'mono', 'left'),
      txt('Closest point on the collapsed line', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt('along [1, 0, 1]/√2', -160, 325, 26, COSMOS.muted, 'mono'),
      // Collapsed 1D column-space line
      markDecor(
        line(plane.pt(-0.3, 0), lineEnd, { stroke: LA.slow, width: 5.2 }).glow(10, LA.slow),
      ),
      // Target vector y
      vecArrow(orig, yPt, { color: COSMOS.gold, width: 5, glow: 10 }),
      glowDot(yPt[0], yPt[1], { radius: 13, color: COSMOS.gold, glow: 14 }),
      txt('target y = [1, 2, 2]', -320, -225, 28, COSMOS.gold, 'mono', 'left'),
      // Residual line from current point on line to y
      markDecor(
        line(curPt, yPt, { stroke: LA.contrast, width: 3.6, dash: [8, 8] }).glow(8, LA.contrast),
      ),
      p > 0.85
        ? markDecor(rightAngle(curPt, orig, yPt, { size: 24, stroke: COSMOS.gold, width: 3 }))
        : group(),
      glowDot(curPt[0], curPt[1], { radius: 14 * pulse, color: LA.fit, glow: 16 }),
      // Right summary plate
      glassPlate(rx, 20, 560, 640, { stroke: LA.fit, glow: 6 }),
      txt(`WEIGHT SUM  s = ${fmt(sVal, 2)}`, rx, -235, 28, LA.fit, 'mono'),
      txt(`[${fmt(sVal, 2)},  0.00,  ${fmt(sVal, 2)}]`, rx, -162, 38, LA.fit, 'mono').glow(
        8,
        LA.fit,
      ),
      markDecor(line([rx - 220, -82], [rx + 220, -82], { stroke: '#2c3d66', width: 1.6 })),
      txt('Middle ticket stuck at 0', rx, -20, 28, LA.rollback, 'sans'),
      txt('Tickets 1 & 3 share w₁ + w₂', rx, 40, 28, COSMOS.ink, 'sans'),
      txt('Halfway between 1 and 2 → 1.5', rx, 102, 28, COSMOS.gold, 'mono'),
      markDecor(line([rx - 220, 162], [rx + 220, 162], { stroke: '#2c3d66', width: 1.6 })),
      txt(`Squared error = ${fmt(sse, 2)}`, rx, 226, 34, LA.contrast, 'mono'),
      txt('What about individual weights?', rx, 286, 28, COSMOS.gold, 'serif'),
    );
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'duplicate-fit', fitP, 1, { dur: 1.5 });
}

// ---------------------------------------------------------------------------
// 21. rank-null: Different weights, identical predictions
// Cues: nullspace-rule, minimum-weight
// ---------------------------------------------------------------------------
export function rankNull(s, c) {
  const slideP = s.value(0);
  const minP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.48, seed: 21 }));
  s.add(aura(-210, 30, 560, '#ffd16622', '#6ee7b716'));

  const live = dynamic(() => {
    const sP = slideP.value;
    const mP = minP.value;
    // Slide along w1 + w2 = 1.5 during beat 0, then lock back onto minimum norm [0.75, 0.75] on beat 1!
    const offset = 1.15 * Math.sin(sP * Math.PI * 1.35) * (1 - mP);
    const w1 = 0.75 + offset;
    const w2 = 0.75 - offset;
    const normW = Math.hypot(w1, w2);

    const plane = vectorPlane2d({
      originX: -360,
      originY: 160,
      scale: 155,
      xRange: [-1.0, 2.5],
      yRange: [-1.0, 2.3],
      xLabel: '',
      yLabel: '',
    });

    const orig = plane.pt(0, 0);
    const lineA = plane.pt(-0.8, 2.3);
    const lineB = plane.pt(2.3, -0.8);
    const curS = plane.pt(w1, w2);
    const minS = plane.pt(0.75, 0.75);
    const minRadius = Math.hypot(minS[0] - orig[0], minS[1] - orig[1]);

    const rx = 535;
    const pulse = 1 + 0.07 * Math.sin(drift.value * Math.PI * 8);

    const nodes = [
      txt('NULLSPACE  B[1, −1]ᵀ = 0', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
      txt('A whole line of identical fits', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt('weight w₁', -120, 368, 26, COSMOS.muted, 'mono'),
      txt('weight w₂', -360, -238, 26, COSMOS.muted, 'mono'),
      // Entire optimal solution line w1 + w2 = 1.5
      markDecor(line(lineA, lineB, { stroke: COSMOS.gold, width: 4.6 }).glow(10, COSMOS.gold)),
      txt('w₁ + w₂ = 1.5', -675, -238, 28, COSMOS.gold, 'mono', 'center'),
      // Origin-to-weight radius vector
      vecArrow(orig, curS, { color: mP > 0.5 ? LA.fit : COSMOS.cyan, width: 5, glow: 10 }),
      glowDot(curS[0], curS[1], {
        radius: 14 * pulse,
        color: mP > 0.5 ? LA.fit : COSMOS.gold,
        glow: 14,
      }),
    ];

    // Minimum-norm tangent circle revealed on beat 1 (minimum-weight)
    if (mP > 0.05) {
      nodes.push(
        markDecor(
          circle(minRadius, { fill: null, stroke: LA.fit, width: 3.4, dash: [9, 8] })
            .at(orig[0], orig[1])
            .glow(10, LA.fit)
            .opacity(mP),
        ),
        markDecor(
          rightAngle(minS, orig, lineB, { size: 22, stroke: LA.fit, width: 2.6 }).opacity(mP),
        ),
      );
    }

    // Right panel: frozen 3-ticket prediction + norm gauge
    nodes.push(
      glassPlate(rx, 25, 620, 690, { stroke: mP > 0.5 ? LA.fit : COSMOS.gold, glow: 6 }),
      txt('CURRENT WEIGHTS', rx, -260, 26, COSMOS.muted, 'mono'),
      txt(
        `w = [${fmt(w1, 2)}, ${fmt(w2, 2)}]`,
        rx,
        -196,
        38,
        mP > 0.5 ? LA.fit : COSMOS.gold,
        'mono',
      ),
      txt(`‖w‖ = ${fmt(normW, 3)}`, rx, -134, 30, COSMOS.cyan, 'mono'),
      markDecor(line([rx - 250, -76], [rx + 250, -76], { stroke: '#2c3d66', width: 1.8 })),
      txt('PREDICTION  B w  (LOCKED!)', rx, -18, 26, LA.fit, 'mono'),
      txt('[1.50,  0.00,  1.50]', rx, 48, 40, LA.fit, 'mono').glow(10, LA.fit),
      txt('Squared error = 4.50  (unchanged)', rx, 114, 28, COSMOS.muted, 'sans'),
      markDecor(line([rx - 250, 174], [rx + 250, 174], { stroke: '#2c3d66', width: 1.8 })),
      mP > 0.3
        ? group(
            txt('MINIMUM-NORM SOLUTION', rx, 226, 26, LA.fit, 'mono'),
            txt('[0.75, 0.75]', rx, 286, 40, LA.fit, 'mono').glow(8, LA.fit),
            txt('Nearest to the origin', rx, 338, 26, COSMOS.muted, 'sans'),
          ).opacity(mP)
        : txt('How many equally good weight pairs?', rx, 255, 30, COSMOS.gold, 'serif').glow(
            8,
            COSMOS.gold,
          ),
    );

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'nullspace-rule', slideP, 1, { dur: 2.6 });
  cueTo(s, c, 'minimum-weight', minP, 1, { dur: 1.1 });
}
