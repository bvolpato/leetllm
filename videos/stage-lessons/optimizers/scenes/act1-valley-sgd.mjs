// Act 1: Opening Step, Two Slopes & Contour Map, 3D Stability Cliff, Momentum Memory,
// and Normalized EMA vs PyTorch Momentum Conventions.
import {
  Node,
  arrow,
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
} from 'vizmatic/stage';
import {
  COSMOS,
  PRESCRIBED,
  PRESCRIBED_GRADIENTS,
  RUNS,
  SETTINGS,
  UNSAFE,
  aura,
  cinemaGrid,
  cinematic3d,
  clamp,
  contourBowl,
  coordRuler,
  cueTo,
  fadeIn,
  fadeOut,
  glassPlate,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  livingDrift,
  loss,
  num,
  orbitScene,
  pairText,
  polyPath,
  pulseCue,
  sampleRun,
  signed,
  stageVis,
  txt,
  valley3dPoint,
  valleyZ,
  vector,
} from '../shared.mjs';

/** Shared luminous single-coordinate parabola + bottom ruler used in intro & first-step. */
function parabolaPanel(
  coordIdx,
  {
    cx = -440,
    baseY = 104,
    halfW = 290,
    maxH = 278,
    before = 1,
    after = 1,
    moveP = 0,
    showSlope = 0,
    showRule = false,
    productText = '',
    endpointText = '',
    highlight = 0,
  } = {},
) {
  const isA = coordIdx === 0;
  const col = isA ? COSMOS.cyan : COSMOS.emerald;
  const cur = before + (after - before) * clamp(moveP);
  const cost = (e) => (isA ? 50 * e * e : 0.5 * e * e);
  const mapX = (e) => cx + e * halfW;
  const mapY = (e) => baseY - (cost(e) / 50) * maxH;

  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const e = -1.04 + (i / 80) * 2.08;
    pts.push([mapX(e), mapY(e)]);
  }
  const fillPts = [...pts, [mapX(1.04), baseY], [mapX(-1.04), baseY]];

  const parts = [
    // Subtle translucent glow plate
    glassPlate(cx, -34, halfW * 2 + 190, 588, {
      stroke: highlight > 0.1 ? col : '#2c3d66',
      fill: '#0c1224aa',
      strokeWidth: highlight > 0.1 ? 3 : 1.8,
      glow: highlight > 0.1 ? 12 : 4,
    }),
    txt(
      showRule
        ? isA
          ? 'Steep loss   50 a²'
          : 'Shallow loss   ½ b²'
        : isA
          ? 'Weight a'
          : 'Weight b',
      cx,
      -284,
      36,
      col,
      'serif',
    ).glow(5, col),
    // Axes
    line([mapX(-1.04), baseY], [mapX(1.04), baseY], { stroke: '#4d6089', width: 2.2 }),
    line([mapX(-1.04), baseY], [mapX(-1.04), baseY - maxH - 16], { stroke: '#4d6089', width: 2.2 }),
    txt('0', mapX(-1.04) - 18, baseY, 26, COSMOS.muted, 'mono', 'right'),
    txt('50', mapX(-1.04) - 18, baseY - maxH, 26, COSMOS.muted, 'mono', 'right'),
    // Shaded parabola fill + glowing curve
    new Node(polyPath(fillPts, true)).fill(isA ? '#5ce1e61a' : '#6ee7b71a'),
    glowingTrail(pts, { color: col, width: 4.5, glow: 10 }),
    // Vertical drop from live dot to ruler
    line([mapX(cur), baseY + 62], [mapX(cur), mapY(cur)], {
      stroke: col,
      width: 2.4,
      dash: [5, 6],
    }).opacity(0.75),
  ];

  // Tangent slope line at start = +1
  if (showSlope > 0.02) {
    const slope = isA ? 100 : 1;
    const dx1 = -0.34 * showSlope;
    const dx2 = 0.08 * showSlope;
    const yAt1 = mapY(1);
    const dyScale = maxH / 50;
    const p1 = [mapX(1 + dx1), Math.min(baseY + 25, yAt1 - slope * dx1 * dyScale)];
    const p2 = [mapX(1 + dx2), Math.max(baseY - maxH - 35, yAt1 - slope * dx2 * dyScale)];
    parts.push(
      line(p1, p2, { stroke: COSMOS.gold, width: 5.2 }).glow(10, COSMOS.gold),
      txt(isA ? 'slope = 100' : 'slope = 1', cx + 80, -226, 28, COSMOS.gold, 'mono').opacity(
        showSlope,
      ),
    );
  }

  // Start ghost ring & live glowing orb on curve
  parts.push(
    circle(11, { fill: COSMOS.bg, stroke: col, width: 3 }).at(mapX(before), mapY(before)),
    glowDot(mapX(cur), mapY(cur), { radius: 10, color: col, glow: 14 }),
    dot(4, '#ffffff').at(mapX(cur), mapY(cur)),
  );

  // Shared bottom error ruler
  const ry = baseY + 62;
  parts.push(
    line([mapX(-1.06), ry], [mapX(1.06), ry], { stroke: '#6075a3', width: 3 }),
    ...[
      [-1, '−1'],
      [0, '0'],
      [1, '+1'],
    ].flatMap(([v, lbl]) => [
      line([mapX(v), ry - 11], [mapX(v), ry + 11], {
        stroke: v === 0 ? COSMOS.gold : '#8ea4d2',
        width: v === 0 ? 3 : 2.2,
      }),
      txt(lbl, mapX(v), ry + 38, 26, v === 0 ? COSMOS.gold : COSMOS.muted, 'mono'),
    ]),
    circle(9, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 2.6 }).at(mapX(before), ry),
  );
  if (moveP > 0.02) {
    if (Math.abs(mapX(cur) - mapX(before)) > 5) {
      parts.push(
        arrow([mapX(before), ry], [mapX(cur), ry], { stroke: col, width: 5.5, tip: 13 }).glow(
          10,
          col,
        ),
      );
    }
    parts.push(glowDot(mapX(cur), ry, { radius: 8, color: col, glow: 12 }));
  }

  if (productText) parts.push(txt(productText, cx, 290, 30, col, 'mono'));
  if (endpointText) parts.push(txt(endpointText, cx, 344, 30, COSMOS.ink, 'mono'));

  return group(...parts);
}

// ---------------------------------------------------------------------------
// 1. intro: One gradient descent step
// Cues: opening-step, opening-wall, opening-floor, opening-rate [CB]
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const stepP = s.value(0);
  const wallGlow = s.value(0);
  const floorGlow = s.value(0);
  const rateP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45, seed: 1 }));
  s.add(aura(-450, -40, 480, '#2a588a28', '#151e3d10'));
  s.add(aura(450, -40, 480, '#1e8a6b24', '#151e3d10'));

  const sgd1 = RUNS.sgd.records[0];

  const stage = dynamic(() => {
    const m = stepP.value;
    const rVis = rateP.value;
    const pulse = 1 + 0.08 * Math.sin(drift.value * Math.PI * 8);
    const aCur = 1 + (sgd1.next[0] - 1) * m;
    const bCur = 1 + (sgd1.next[1] - 1) * m;

    const nodes = [
      txt('ONE GRADIENT DESCENT STEP', 0, -424, 28, COSMOS.cyan, 'mono'),
      txt('Same start (+1, +1)  ·  Same learning rate', 0, -372, 34, COSMOS.ink, 'serif'),
      parabolaPanel(0, {
        cx: -455,
        before: 1,
        after: sgd1.next[0],
        moveP: m,
        highlight: wallGlow.value,
        productText: m > 0.85 ? 'Δa = −1.800' : `a = ${num(aCur, 3)}`,
        endpointText: m > 0.85 ? 'Overshoots past 0 to −0.800' : 'Steep wall',
      }),
      parabolaPanel(1, {
        cx: 455,
        before: 1,
        after: sgd1.next[1],
        moveP: m,
        highlight: floorGlow.value,
        productText: m > 0.85 ? 'Δb = −0.018' : `b = ${num(bCur, 3)}`,
        endpointText: m > 0.85 ? 'Barely moves to +0.982' : 'Shallow floor',
      }),
    ];

    if (rVis > 0.02) {
      nodes.push(
        group(
          glassPlate(0, 424, 980, 74, { stroke: COSMOS.gold, glow: 10 * pulse }),
          txt(
            'η = 0.018 on both  ·  Why did a travel 100× farther?',
            0,
            424,
            32,
            COSMOS.gold,
            'serif',
          ).glow(6, COSMOS.gold),
        ).opacity(rVis),
      );
    }
    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'opening-step', stepP, 1, { dur: 1.3 });
  pulseCue(s, c, 'opening-wall', wallGlow, 1, { dur: 0.45 });
  pulseCue(s, c, 'opening-floor', floorGlow, 1, { dur: 0.45 });
  cueTo(s, c, 'opening-rate', rateP, 1, { after: true, dur: 0.35 });
}

// ---------------------------------------------------------------------------
// 2. first-step: One rate on two slopes
// Cues: multiply-gradient, multiply-shallow, take-first-step, build-loss,
//       build-gradient, refresh-gradient [CB], take-second-step [CB]
// ---------------------------------------------------------------------------
export function firstStep(s, c) {
  const mode = s.value(0); // 0 = dual slopes (beats 0-1), 1 = 2D contour map (beat 2)
  const mulA = s.value(0);
  const mulB = s.value(0);
  const move1 = s.value(0);
  const lossEqP = s.value(0);
  const gradEqP = s.value(0);
  const grad2P = s.value(0);
  const step2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 2 }));
  s.add(aura(-420, -20, 480, '#2a588a28', '#151e3d10'));
  s.add(aura(420, -20, 480, '#1e8a6b24', '#151e3d10'));

  const r1 = RUNS.sgd.records[0];
  const r2 = RUNS.sgd.records[1];

  const eqLoss = glowTex(String.raw`L(a,b) = 50a^2 + \tfrac{1}{2}b^2`, {
    x: -360,
    y: 418,
    size: 38,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqGrad = glowTex(String.raw`\nabla L(a,b) = (100a,\; b) \;\Rightarrow\; \kappa = 100`, {
    x: 375,
    y: 418,
    size: 38,
    color: COSMOS.gold,
    glow: 7,
  });

  // Beats 0-1: Dual parabolas with tangent slopes, arithmetic, and equation reveal
  const dualView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const m = move1.value;
      const showRule = lossEqP.value > 0.3;
      const nodes = [
        txt('ONE LEARNING RATE ON TWO SLOPES', 0, -424, 28, COSMOS.gold, 'mono'),
        txt(
          'η = 0.018   ·   Start (1, 1)   ·   Initial loss = 50.5',
          0,
          -374,
          30,
          COSMOS.muted,
          'mono',
        ),
        parabolaPanel(0, {
          cx: -455,
          before: 1,
          after: r1.next[0],
          moveP: m,
          showSlope: 1,
          showRule,
          highlight: mulA.value,
          productText: mulA.value > 0.1 ? '0.018 × 100 = 1.800' : 'Slope at a = 1 is 100',
          endpointText: m > 0.85 ? 'a₁ = 1 − 1.8 = −0.800' : 'Step = −η · gₐ',
        }),
        parabolaPanel(1, {
          cx: 455,
          before: 1,
          after: r1.next[1],
          moveP: m,
          showSlope: 1,
          showRule,
          highlight: mulB.value,
          productText: mulB.value > 0.1 ? '0.018 × 1 = 0.018' : 'Slope at b = 1 is 1',
          endpointText: m > 0.85 ? 'b₁ = 1 − 0.018 = +0.982' : 'Step = −η · g_b',
        }),
      ];
      if (lossEqP.value > 0.04) nodes.push(eqLoss.opacity(lossEqP.value));
      if (gradEqP.value > 0.04) nodes.push(eqGrad.opacity(gradEqP.value));
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Unified 2D elliptical contour map + step 2 prediction & reveal
  const mapView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const bowl = contourBowl({
        cx: -265,
        cy: 16,
        width: 1050,
        height: 670,
        aDomain: [-1.25, 1.25],
        bDomain: [-0.25, 1.25],
      });
      const p0 = bowl.map(1, 1);
      const p1 = bowl.map(r1.next[0], r1.next[1]);
      const g2 = grad2P.value;
      const s2 = step2P.value;
      const p2Cur = bowl.map(
        r1.next[0] + (r2.next[0] - r1.next[0]) * s2,
        r1.next[1] + (r2.next[1] - r1.next[1]) * s2,
      );

      const rx = 595;
      const nodes = [
        txt('COMBINED 2D LOSS VALLEY', -265, -395, 30, COSMOS.cyan, 'mono'),
        bowl.node,
        // Step 1 trail
        glowingTrail([p0, p1], { color: COSMOS.blue, width: 4.5, glow: 10 }),
        circle(9, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 2.8 }).at(p0[0], p0[1]),
        glowDot(p1[0], p1[1], { radius: 9, color: COSMOS.cyan, glow: 12 }),
      ];

      // Refreshed gradient at step 1 (withheld until refresh-gradient settles)
      if (g2 > 0.02) {
        const gTip = [p1[0] - 135 * g2, p1[1]];
        nodes.push(
          arrow(p1, gTip, { stroke: COSMOS.gold, width: 5, tip: 13 })
            .glow(10, COSMOS.gold)
            .opacity(g2),
        );
      }

      // Step 2 bounce back across zero (withheld until take-second-step settles)
      if (s2 > 0.02) {
        nodes.push(
          glowingTrail([p1, p2Cur], { color: COSMOS.emerald, width: 4.8, glow: 12 }),
          glowDot(p2Cur[0], p2Cur[1], { radius: 9.5, color: COSMOS.emerald, glow: 14 }),
        );
      }

      // Right-hand live readout plate
      nodes.push(
        glassPlate(rx, 0, 520, 620, { stroke: '#3c5080', glow: 6 }),
        txt('LOCAL RE-EVALUATION', rx, -252, 26, COSMOS.muted, 'mono'),
        txt('Step 1 endpoint', rx, -184, 30, COSMOS.cyan, 'sans'),
        txt('(−0.800, 0.982)', rx, -130, 34, COSMOS.cyan, 'mono'),
        line([rx - 210, -82], [rx + 210, -82], { stroke: '#2c3d66', width: 1.6 }),
        txt('Fresh gradient at w₁', rx, -34, 28, COSMOS.gold, 'sans'),
        txt(g2 > 0.85 ? 'g = (−80, +0.982)' : 'g = ?', rx, 22, 34, COSMOS.gold, 'mono'),
        line([rx - 210, 74], [rx + 210, 74], { stroke: '#2c3d66', width: 1.6 }),
        txt('Step 2 result', rx, 122, 28, COSMOS.emerald, 'sans'),
        txt(
          s2 > 0.85 ? pairText(r2.next, 3) : 'Which way next?',
          rx,
          178,
          34,
          COSMOS.emerald,
          'mono',
        ),
        txt(
          s2 > 0.85 ? 'a bounces back across 0' : 'Full vs noisy minibatch',
          rx,
          246,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(dualView, mapView);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'multiply-gradient', mulA, 1, { dur: 0.65 });
  cueTo(s, c, 'multiply-shallow', mulB, 1, { dur: 0.65 });
  cueTo(s, c, 'take-first-step', move1, 1, { dur: 1.1 });
  cueTo(s, c, 'build-loss', lossEqP, 1, { dur: 0.7 });
  cueTo(s, c, 'build-gradient', gradEqP, 1, { dur: 0.7 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  // Strict caption_boundary withholding: reveal after phrase completes
  cueTo(s, c, 'refresh-gradient', grad2P, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'take-second-step', step2P, 1, { after: true, dur: 0.38 });
}

// ---------------------------------------------------------------------------
// 3. stability: Judge the numbered endpoints (SIGNATURE 3D VALLEY SCENE)
// Cues: safe-trace, unsafe-question, unsafe-trace, stability-factor
// ---------------------------------------------------------------------------
export function stability(s, c) {
  const safeP = s.value(0);
  const askP = s.value(0);
  const unsafeP = s.value(0);
  const ruleP = s.value(0);

  s.add(aura(230, 10, 560, '#2a588a2a', '#11162600'));
  s.add(aura(-560, 120, 380, '#ff6b8b1a', '#11162600'));

  const view3d = cinematic3d({
    theta: -1.42,
    phi: 0.78,
    distance: 14.4,
    unit: 138,
    ambient: 0.36,
    shine: 0.34,
    brightness: 1.06,
    fog: 0.06,
    focus: [0, 0.2, 0.55],
  }).at(240, 26);

  // 3D Ill-conditioned 100:1 loss valley surface (deep indigo trough so neon trails pop!)
  const valleySurface = surface(
    (x, y) => {
      const a = x / 1.35;
      const b = y / 1.8;
      return valleyZ(a, b, { scale: 0.56, maxZ: 2.65 });
    },
    {
      x: [-2.95, 2.95],
      y: [-2.1, 2.3],
      resolution: [38, 32],
      colors: ['#040712', '#0b1433', '#152559', '#1c407a', '#246c9e', '#329ec2'],
      mesh: '#5ce1e6',
      meshOpacity: 0.16,
      meshWidth: 0.55,
      opacity: 0.8,
    },
  );

  const to3d = (a, b, lift = 0.12) => [
    clamp(a / 2.2) === a / 2.2 ? a * 1.35 : Math.max(-2.9, Math.min(2.9, a * 1.35)),
    Math.max(-2.0, Math.min(2.2, b * 1.8)),
    valleyZ(a, b, { scale: 0.56, maxZ: 2.65 }) + lift,
  ];

  // Floor canyon centerline
  const canyonAxis = line3d([0, -2.0, 0.06], [0, 2.2, 0.06], {
    color: COSMOS.gold,
    width: 2.2,
    opacity: 0.6,
  });

  // Safe SGD 8-step discrete zig-zag reactive line3d segments in 3D
  const safeSegments = Array.from({ length: 8 }, (_, idx) => {
    const pA = vector(RUNS.sgd.points[idx]);
    const pB = vector(RUNS.sgd.points[idx + 1]);
    return line3d(
      () => to3d(pA[0], pA[1], 0.14),
      () => {
        const segP = clamp(safeP.value * 8 - idx);
        const a = pA[0] + (pB[0] - pA[0]) * segP;
        const b = pA[1] + (pB[1] - pA[1]) * segP;
        return to3d(a, b, 0.14);
      },
      {
        color: COSMOS.cyan,
        width: 4.5,
        glow: 11,
        blend: 'screen',
        onTop: true,
      },
    );
  });

  // Unsafe SGD 8-step diverging zig-zag reactive line3d segments in 3D
  const unsafeSegments = Array.from({ length: 8 }, (_, idx) => {
    const pA = vector(UNSAFE.points[idx]);
    const pB = vector(UNSAFE.points[idx + 1]);
    return line3d(
      () => (unsafeP.value * 8 > idx + 0.001 ? to3d(pA[0], pA[1], 0.18) : to3d(1, 1, 0.18)),
      () => {
        const segP = clamp(unsafeP.value * 8 - idx);
        if (segP <= 0.001) return to3d(1, 1, 0.18);
        const a = pA[0] + (pB[0] - pA[0]) * segP;
        const b = pA[1] + (pB[1] - pA[1]) * segP;
        return to3d(a, b, 0.18);
      },
      {
        color: COSMOS.rose,
        width: 5.0,
        glow: 13,
        blend: 'screen',
        onTop: true,
      },
    );
  });

  const safeHead = point3d(
    () => {
      const f = sampleRun(RUNS.sgd, safeP.value, 0, 8);
      return to3d(f.interp[0], f.interp[1], 0.2);
    },
    { color: COSMOS.cyan, radius: 9, glow: 15, blend: 'screen', onTop: true },
  );

  const unsafeHead = point3d(
    () => {
      const f = sampleRun(UNSAFE, unsafeP.value, 0, 8);
      return to3d(f.interp[0], f.interp[1], 0.22);
    },
    { color: COSMOS.rose, radius: 9.5, glow: 16, blend: 'screen', onTop: true },
  );

  const originBeacon = point3d([0, 0, 0.14], {
    color: COSMOS.gold,
    radius: 8,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });

  view3d.add(
    valleySurface,
    canyonAxis,
    ...safeSegments,
    ...unsafeSegments,
    safeHead,
    unsafeHead,
    originBeacon,
  );

  const stabilityEq = glowTex(String.raw`|1 - 100\eta| < 1 \iff 0 < \eta < 0.02`, {
    x: -555,
    y: 356,
    size: 34,
    color: COSMOS.gold,
    glow: 8,
  });

  const hud = dynamic(() => {
    const sf = sampleRun(RUNS.sgd, safeP.value, 0, 8);
    const uf = sampleRun(UNSAFE, unsafeP.value, 0, 8);
    const asking = askP.value > 0.3 && unsafeP.value < 0.02;
    const showUnsafe = unsafeP.value > 0.02;

    const nodes = [
      txt('THE STABILITY CLIFF', -855, -422, 26, COSMOS.cyan, 'mono', 'left'),
      txt('100:1 Valley', -855, -356, 56, COSMOS.ink, 'serif', 'left'),
      // Safe rate readout
      glassPlate(-575, -172, 560, 210, { stroke: COSMOS.cyan, glow: 6 }),
      txt('SAFE RATE   η = 0.018', -825, -242, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`Updates  ${sf.completed} / 8`, -825, -190, 30, COSMOS.ink, 'mono', 'left'),
      txt(`w = ${pairText(sf.current, 3)}`, -825, -142, 28, COSMOS.cyan, 'mono', 'left'),
      txt(`Loss  ${num(sf.currentLoss, 3)}`, -825, -96, 28, COSMOS.muted, 'mono', 'left'),
    ];

    if (asking) {
      nodes.push(
        glassPlate(-575, 118, 560, 220, { stroke: COSMOS.gold, glow: 10 }),
        txt('RAISE RATE TO  η = 0.021', -825, 48, 28, COSMOS.gold, 'mono', 'left'),
        txt('Will the steep error', -825, 114, 38, COSMOS.ink, 'serif', 'left'),
        txt('settle or grow?', -825, 170, 42, COSMOS.gold, 'serif', 'left').glow(8, COSMOS.gold),
      );
    } else if (showUnsafe) {
      nodes.push(
        glassPlate(-575, 118, 560, 220, { stroke: COSMOS.rose, glow: 10 }),
        txt('UNSAFE RATE   η = 0.021', -825, 48, 26, COSMOS.rose, 'mono', 'left'),
        txt(`Updates  ${uf.completed} / 8`, -825, 100, 30, COSMOS.ink, 'mono', 'left'),
        txt(`w = ${pairText(uf.current, 3)}`, -825, 148, 28, COSMOS.rose, 'mono', 'left'),
        txt(
          `Loss  ${num(uf.currentLoss, 3)}  (× −1.1 per step)`,
          -825,
          194,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
      );
    }

    if (ruleP.value > 0.04) {
      nodes.push(stabilityEq.opacity(ruleP.value));
    }

    nodes.push(
      txt('One scalar rate serves two 100:1 curvatures', 240, 434, 28, COSMOS.muted, 'sans'),
    );
    return group(...nodes);
  });

  s.add(view3d, hud);
  orbitScene(s, c, view3d, { theta: -1.78, phi: 0.72, distance: 13.8 });

  cueTo(s, c, 'safe-trace', safeP, 1, { dur: 2.8 });
  pulseCue(s, c, 'unsafe-question', askP, 1, { dur: 0.5 });
  // Strict prediction withholding: unsafe trajectory waits until Beat 2 unsafe-trace starts
  cueTo(s, c, 'unsafe-trace', unsafeP, 1, { dur: 2.6 });
  cueTo(s, c, 'stability-factor', ruleP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 4. momentum: A stored direction can disagree with the slope
// Cues: first-memory, momentum-first-four, retain-memory, incoming-memory,
//       sum-memory, momentum-fifth, momentum-return
// ---------------------------------------------------------------------------
export function momentum(s, c) {
  const firstMemP = s.value(0);
  const stepsP = s.value(0); // 0 -> 4 in beat 0, 4 -> 5 in beat 1, 5 -> 9 in beat 2
  const carryP = s.value(0);
  const incomingP = s.value(0);
  const sumP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.44, seed: 4 }));
  s.add(aura(-280, 0, 500, '#552f9626', '#151e3d10'));

  const r5 = RUNS.momentum.records[4]; // 5th update (index 4): gradient[0] < 0, mean[0] > 0 -> uphill!
  const carryVal = 0.9 * r5.oldMean[0];
  const incomingVal = 0.1 * r5.gradient[0];
  const sumVal = r5.mean[0];

  const eqMom = glowTex(String.raw`m_t = 0.9\,m_{t-1} + 0.1\,g_t`, {
    x: 565,
    y: -362,
    size: 38,
    color: COSMOS.violet,
    glow: 7,
  });

  const stage = dynamic(() => {
    const pos = stepsP.value;
    const completed = Math.min(9, Math.floor(pos + 1e-9));
    const frac = completed < 9 ? pos - completed : 0;
    const curPt = vector(RUNS.momentum.points[completed]);
    const nxtPt = completed < 9 ? vector(RUNS.momentum.points[completed + 1]) : curPt;
    const interp = [
      curPt[0] + (nxtPt[0] - curPt[0]) * frac,
      curPt[1] + (nxtPt[1] - curPt[1]) * frac,
    ];
    const activeRec = RUNS.momentum.records[Math.min(completed, 8)];

    const bowl = contourBowl({
      cx: -315,
      cy: 10,
      width: 980,
      height: 670,
      aDomain: [-1.15, 1.15],
      bDomain: [-0.2, 1.15],
      accent: COSMOS.violet,
    });

    const trailPts = RUNS.momentum.points.slice(0, completed + 1).map((pt) => bowl.map(pt.x, pt.y));
    if (frac > 0.01) trailPts.push(bowl.map(interp[0], interp[1]));

    const headPx = bowl.map(interp[0], interp[1]);
    const rx = 565;

    const nodes = [
      txt('EMA MOMENTUM  (β = 0.9, η = 0.018)', -315, -396, 28, COSMOS.violet, 'mono'),
      bowl.node,
      eqMom,
    ];

    if (trailPts.length >= 2) {
      nodes.push(glowingTrail(trailPts, { color: COSMOS.violet, width: 4.8, glow: 12 }));
    }
    nodes.push(
      glowDot(headPx[0], headPx[1], { radius: 9.5, color: COSMOS.gold, glow: 14 }),
      dot(4, '#ffffff').at(headPx[0], headPx[1]),
    );

    // Right column: live telemetry + signed number line for step 5 memory opposition
    const showLine = carryP.value > 0.02;
    nodes.push(
      glassPlate(rx, -110, 560, 310, { stroke: COSMOS.violet, glow: 6 }),
      txt(`Completed updates   ${completed}`, rx - 245, -220, 30, COSMOS.ink, 'mono', 'left'),
      txt(`(a, b) = ${pairText(curPt, 3)}`, rx - 245, -162, 30, COSMOS.cyan, 'mono', 'left'),
      txt(`Loss  ${num(loss(curPt), 3)}`, rx - 245, -108, 30, COSMOS.gold, 'mono', 'left'),
      txt(
        firstMemP.value > 0.1
          ? `m_a = ${signed(completed === 0 ? RUNS.momentum.records[0].mean[0] : RUNS.momentum.records[completed - 1].mean[0], 2)}`
          : 'm₀ = (0, 0)',
        rx - 245,
        -50,
        30,
        COSMOS.violet,
        'mono',
        'left',
      ),
      txt(
        `g_a = ${signed(activeRec.gradient[0], 1)}`,
        rx + 245,
        -50,
        30,
        activeRec.gradient[0] < 0 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'right',
      ),
    );

    // Signed memory addition ruler for step 5 (Beat 1)
    const railY = 210;
    const railX0 = rx - 250;
    const railW = 500;
    const mapM = (v) => railX0 + ((v + 12) / 36) * railW;
    nodes.push(
      glassPlate(rx, 240, 560, 320, {
        stroke: showLine ? COSMOS.gold : '#2c3d66',
        glow: showLine ? 8 : 4,
      }),
      txt('STEP 5 SIGNED MEMORY  m₅', rx, 118, 26, COSMOS.gold, 'mono'),
      line([railX0, railY], [railX0 + railW, railY], { stroke: '#5a6f9c', width: 2.8 }),
      line([mapM(0), railY - 14], [mapM(0), railY + 14], { stroke: COSMOS.ink, width: 2.6 }),
      txt('0', mapM(0), railY + 34, 26, COSMOS.muted, 'mono'),
    );

    if (carryP.value > 0.02) {
      const cTip = mapM(carryVal * carryP.value);
      nodes.push(
        arrow([mapM(0), railY - 20], [cTip, railY - 20], {
          stroke: COSMOS.gold,
          width: 5,
          tip: 12,
        }).glow(8, COSMOS.gold),
        txt(`0.9 m₄ = +${num(carryVal, 2)}`, rx - 245, 294, 26, COSMOS.gold, 'mono', 'left'),
      );
    }
    if (incomingP.value > 0.02) {
      const cStart = mapM(carryVal);
      const iTip = mapM(carryVal + incomingVal * incomingP.value);
      nodes.push(
        arrow([cStart, railY + 12], [iTip, railY + 12], {
          stroke: COSMOS.rose,
          width: 5,
          tip: 12,
        }).glow(8, COSMOS.rose),
        txt(`0.1 g₅ = ${signed(incomingVal, 2)}`, rx + 245, 294, 26, COSMOS.rose, 'mono', 'right'),
      );
    }
    if (sumP.value > 0.02) {
      const sX = mapM(sumVal);
      nodes.push(
        glowDot(sX, railY, { radius: 9, color: COSMOS.emerald, glow: 14 }).opacity(sumP.value),
        txt(`m₅ = +${num(sumVal, 2)} > 0  (uphill!)`, rx, 354, 26, COSMOS.emerald, 'mono').opacity(
          sumP.value,
        ),
      );
    } else {
      nodes.push(
        txt('Each coordinate owns its own signed buffer', rx, 354, 26, COSMOS.muted, 'sans'),
      );
    }

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'first-memory', firstMemP, 1, { dur: 0.5 });
  cueTo(s, c, 'momentum-first-four', stepsP, 4, { dur: 2.2 });
  cueTo(s, c, 'retain-memory', carryP, 1, { dur: 0.65 });
  cueTo(s, c, 'incoming-memory', incomingP, 1, { dur: 0.65 });
  cueTo(s, c, 'sum-memory', sumP, 1, { dur: 0.55 });
  cueTo(s, c, 'momentum-fifth', stepsP, 5, { dur: 1.0 });
  cueTo(s, c, 'momentum-return', stepsP, 9, { dur: 2.4 });
}

// ---------------------------------------------------------------------------
// 5. momentum-conventions: Translate the buffer before copying a learning rate
// Cues: history-inputs, history-first, history-second, history-continue,
//       history-fourth, history-shallow, library-buffer, library-scale, library-rate
// ---------------------------------------------------------------------------
export function momentumConventions(s, c) {
  const mode = s.value(0); // 0 = 4-gradient trace (beats 0-1), 1 = EMA vs PyTorch (beat 2)
  const inVis = s.value(0);
  const step1P = s.value(0);
  const step2P = s.value(0);
  const step3P = s.value(0);
  const step4P = s.value(0);
  const shallowP = s.value(0);
  const libBufP = s.value(0);
  const libScaleP = s.value(0);
  const libRateP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 5 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(400, 0, 480, '#552f9624', '#151e3d10'));

  const eqEma = glowTex(String.raw`m_t = \beta m_{t-1} + (1 - \beta) g_t`, {
    x: -440,
    y: -140,
    size: 38,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqTorch = glowTex(String.raw`b_t = \beta b_{t-1} + g_t,\quad b_1 = g_1`, {
    x: 440,
    y: -140,
    size: 38,
    color: COSMOS.gold,
    glow: 7,
  });
  const eqScale = glowTex(
    String.raw`m_t = (1 - \beta)\, b_t \quad\Longrightarrow\quad \eta_{\text{lib}} = (1 - \beta)\,\eta`,
    {
      x: 0,
      y: 120,
      size: 40,
      color: COSMOS.emerald,
      glow: 8,
    },
  );

  // Beats 0-1: 4 supplied gradients feeding normalized EMA buffers for a and b
  const traceView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const colX = [-470, -145, 180, 505];
      const revealStep = [step1P.value, step2P.value, step3P.value, step4P.value];
      const nodes = [
        txt('FOUR FIXED GRADIENTS  ·  NORMALIZED EMA (β = 0.9)', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt('gₐ', -770, -280, 36, COSMOS.cyan, 'mono'),
        txt('mₐ', -770, -120, 36, COSMOS.gold, 'mono'),
        txt('g_b', -770, 80, 36, COSMOS.emerald, 'mono'),
        txt('m_b', -770, 220, 36, COSMOS.emerald, 'mono'),
      ];

      // Horizontal spine rails
      nodes.push(
        line([-690, -120], [720, -120], { stroke: '#2c3d66', width: 2.2 }),
        line([-690, 220], [720, 220], { stroke: '#2c3d66', width: 2.2 }),
      );

      for (let i = 0; i < 4; i++) {
        const cx = colX[i];
        const [ga, gb] = PRESCRIBED_GRADIENTS[i];
        const ma = PRESCRIBED[i].mean[0];
        const mb = PRESCRIBED[i].mean[1];
        const rp = revealStep[i];
        const active = rp > 0.1;

        nodes.push(
          txt(`t = ${i + 1}`, cx, -352, 26, COSMOS.muted, 'mono'),
          glassPlate(cx, -280, 220, 74, {
            stroke: inVis.value > 0.1 ? COSMOS.cyan : '#2c3d66',
            glow: active ? 8 : 3,
          }),
          txt(signed(ga, 0), cx, -280, 38, ga > 0 ? COSMOS.cyan : COSMOS.rose, 'mono'),
          // Shallow input
          glassPlate(cx, 80, 220, 70, {
            stroke: inVis.value > 0.1 ? COSMOS.emerald : '#2c3d66',
            glow: 3,
          }),
          txt(signed(gb, 2), cx, 80, 34, COSMOS.emerald, 'mono'),
        );

        // Buffer value a
        if (rp > 0.05) {
          const barH = Math.max(12, Math.abs(ma) * 8);
          nodes.push(
            rect(62, barH, { fill: COSMOS.gold, stroke: null, radius: 6 })
              .at(cx, -120 - barH / 2)
              .glow(10, COSMOS.gold)
              .opacity(rp),
            txt(signed(ma, 2), cx, -42, 36, COSMOS.gold, 'mono').opacity(rp),
          );
          if (i === 1) {
            nodes.push(txt('9 − 8 = +1', cx, -196, 26, COSMOS.gold, 'mono').opacity(rp));
          }
        } else {
          nodes.push(txt('?', cx, -42, 34, COSMOS.dim, 'mono'));
        }

        // Buffer value b
        const showB = i === 3 ? Math.max(rp, shallowP.value) : rp;
        if (showB > 0.05) {
          nodes.push(
            rect(62, Math.max(12, mb * 150), { fill: COSMOS.emerald, stroke: null, radius: 6 })
              .at(cx, 220 - (mb * 150) / 2)
              .glow(8, COSMOS.emerald)
              .opacity(showB),
            txt(num(mb, 3), cx, 286, 32, COSMOS.emerald, 'mono').opacity(showB),
          );
        } else {
          nodes.push(txt('?', cx, 286, 30, COSMOS.dim, 'mono'));
        }
      }

      nodes.push(
        txt(
          step4P.value > 0.6
            ? 'Alternating a cancels (1.11)  ·  Steady b reinforces (0.333)'
            : 'Gradient flips sign before the signed buffer turns negative',
          0,
          398,
          30,
          COSMOS.ink,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Library convention translation (EMA vs PyTorch SGD)
  const libView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const nodes = [
        txt('LIBRARY BUFFER TRANSLATION', 0, -418, 28, COSMOS.gold, 'mono'),
        txt(
          'Same updates require matching initialization & dampening',
          0,
          -366,
          34,
          COSMOS.ink,
          'serif',
        ),
        // Left plate: Our normalized EMA
        glassPlate(-440, -150, 740, 290, { stroke: COSMOS.cyan, glow: 8 }),
        txt('NORMALIZED EMA', -440, -246, 28, COSMOS.cyan, 'mono'),
        eqEma,
        txt('Starts at m₀ = 0  ·  η = 0.018', -440, -46, 28, COSMOS.muted, 'mono'),
        // Right plate: PyTorch SGD default dampening=0
        glassPlate(440, -150, 740, 290, {
          stroke: libBufP.value > 0.1 ? COSMOS.gold : '#2c3d66',
          glow: libBufP.value > 0.1 ? 10 : 4,
        }),
        txt('PYTORCH SGD (DAMPENING = 0)', 440, -246, 28, COSMOS.gold, 'mono'),
        eqTorch.opacity(Math.max(0.25, libBufP.value)),
        txt('Starts at b₁ = g₁  (10× larger at β = 0.9)', 440, -46, 28, COSMOS.muted, 'mono'),
        // Connecting translation frame always anchored in lower half
        glassPlate(0, 120, 1280, 126, {
          stroke: libScaleP.value > 0.1 ? COSMOS.emerald : '#344774',
          glow: libScaleP.value > 0.1 ? 8 : 3,
        }),
        libScaleP.value > 0.04
          ? eqScale.opacity(libScaleP.value)
          : txt(
              'Check dampening & buffer init before copying a learning rate',
              0,
              120,
              30,
              COSMOS.muted,
              'sans',
            ),
        glassPlate(0, 310, 1180, 150, {
          stroke: libRateP.value > 0.1 ? COSMOS.emerald : '#344774',
          glow: libRateP.value > 0.1 ? 10 : 3,
        }),
        txt('EQUIVALENT LEARNING RATE AT  β = 0.9', 0, 272, 26, COSMOS.muted, 'mono'),
        txt(
          libRateP.value > 0.08 ? '0.018  ×  (1 − 0.9)  =  0.0018' : 'η_lib = (1 − β) · η',
          0,
          334,
          libRateP.value > 0.08 ? 46 : 36,
          libRateP.value > 0.08 ? COSMOS.emerald : COSMOS.cyan,
          'mono',
        ).glow(libRateP.value > 0.08 ? 10 : 4, COSMOS.emerald),
      ];

      return group(...nodes).opacity(vis);
    },
  );

  s.add(traceView, libView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'history-inputs', inVis, 1, { dur: 0.4 });
  cueTo(s, c, 'history-first', step1P, 1, { dur: 0.65 });
  cueTo(s, c, 'history-second', step2P, 1, { dur: 0.75 });
  cueTo(s, c, 'history-continue', step3P, 1, { dur: 0.65 });
  cueTo(s, c, 'history-fourth', step4P, 1, { dur: 0.65 });
  pulseCue(s, c, 'history-shallow', shallowP, 1, { dur: 0.55 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'library-buffer', libBufP, 1, { dur: 0.65 });
  cueTo(s, c, 'library-scale', libScaleP, 1, { dur: 0.7 });
  cueTo(s, c, 'library-rate', libRateP, 1, { dur: 0.65 });
}
