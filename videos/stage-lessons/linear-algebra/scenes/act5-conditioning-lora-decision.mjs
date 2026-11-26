// Act 5: Condition Number Compression, Noise Magnification, Normal-Equation Rounding Hazard,
// Squared Energy Cutoff, LoRA Low-Rank Updates, Task-Driven Ruler Choice, and Support-Desk Finale.
import { Node, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  A,
  COSMOS,
  LA,
  SOLVER_EXACT,
  SOLVER_ROUNDED,
  aura,
  bracketMatrix,
  cinemaGrid,
  common,
  contrast,
  cueTo,
  dispatchWeights,
  dotProduct,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowDot,
  glowTex,
  guardedDynamic,
  livingDrift,
  markDecor,
  numberRuler,
  photonWire,
  polyPath,
  pulseCue,
  sum,
  ticketMeasurement,
  txt,
  vecArrow,
  vectorPlane2d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 22. conditioning-map: What happens when we reverse this map?
// Cues: condition-map, condition-number
// ---------------------------------------------------------------------------
export function conditioningMap(s, c) {
  const squishP = s.value(0);
  const kappaP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.48, seed: 22 }));
  s.add(aura(-140, 20, 560, '#5ce1e622', '#ffd16614'));

  const eqKappa = glowTex(
    String.raw`\kappa_2(M) = \frac{\sigma_{\max}}{\sigma_{\min}} = \frac{1}{0.01} = 100`,
    {
      x: 525,
      y: 135,
      size: 38,
      color: COSMOS.gold,
      glow: 8,
    },
  );

  const live = dynamic(() => {
    const p = squishP.value;
    const kP = kappaP.value;
    // Smooth logarithmic-feeling visual compression down to 0.01 (keep visual thickness legible at >= 0.025)
    const trueScale = Math.pow(0.01, p);
    const visScale = Math.max(0.026, trueScale);

    const plane = vectorPlane2d({
      originX: -275,
      originY: 85,
      scale: 225,
      xRange: [-1.35, 1.35],
      yRange: [-1.25, 1.25],
      matrix: [
        [1, 0],
        [0, visScale],
      ],
      unitCircle: true,
      circleColor: COSMOS.cyan,
      xLabel: '',
      yLabel: '',
    });

    const orig = plane.pt(0, 0);
    // Faint ghost of original unit circle
    const ghostPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      ghostPts.push(plane.pt(Math.cos(a), Math.sin(a)));
    }

    const rx = 525;
    const pulse = 1 + 0.05 * Math.sin(drift.value * Math.PI * 8);

    return group(
      txt('CONDITIONING GEOMETRY', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('A circle flattened 100× into a sliver', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
      plane.node,
      txt('weak axis (× 0.01)', -275, -242, 26, LA.contrast, 'mono'),
      txt('strong axis (× 1)', -275, 412, 26, LA.common, 'mono'),
      markDecor(new Node(polyPath(ghostPts)).stroke('#6c81b3', 2, 0.45)),
      vecArrow(orig, plane.pt(1, 0), { color: LA.common, width: 6, glow: 10 }),
      vecArrow(orig, plane.pt(0, visScale), { color: LA.contrast, width: 5.5, glow: 10 }),
      glassPlate(rx, 25, 620, 640, { stroke: kP > 0.3 ? COSMOS.gold : COSMOS.cyan, glow: 6 }),
      txt('STRETCH RATIOS', rx, -230, 26, COSMOS.cyan, 'mono'),
      txt('Strong axis  σ₁ = 1.00', rx, -160, 34, LA.common, 'mono'),
      txt(`Weak axis    σ₂ = ${fmt(trueScale, 3)}`, rx, -96, 34, LA.contrast, 'mono'),
      markDecor(line([rx - 250, -32], [rx + 250, -32], { stroke: '#2c3d66', width: 1.8 })),
      kP > 0.02
        ? group(
            txt('CONDITION NUMBER', rx, 24, 26, COSMOS.gold, 'mono'),
            txt('Reversing stretches weak axis 100×', rx, 255, 28, COSMOS.ink, 'sans'),
          ).opacity(kP * Math.min(1, pulse))
        : txt('Shrinking weak axis 100×...', rx, 255, 30, COSMOS.muted, 'sans'),
    );
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'condition-map', squishP, 1, { dur: 1.9 });
  cueTo(s, c, 'condition-number', kappaP, 1, { dur: 0.7 });
  c.show('condition-number', eqKappa);
}

// ---------------------------------------------------------------------------
// 23. conditioning-noise: A small output wobble becomes a large input error
// Cues: conditioning-noise-b2-1, conditioning-inverse-b2-2
// ---------------------------------------------------------------------------
export function conditioningNoise(s, c) {
  const noiseP = s.value(0);
  const invP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.contrast, opacity: 0.48, seed: 23 }));
  s.add(aura(0, -140, 500, '#ffd1661c', '#07091000'));
  s.add(aura(0, 210, 560, '#ff6b8b26', '#07091000'));

  const live = dynamic(() => {
    const nP = noiseP.value;
    const iP = invP.value;
    const outClean = 0.002;
    const outNow = 0.002 + 0.001 * nP;
    const inClean = 0.2;
    const inNow = 0.2 + 0.1 * iP;

    const topRuler = numberRuler({
      cx: 0,
      cy: -145,
      width: 1260,
      min: 0,
      max: 0.005,
      ticks: [0, 0.001, 0.002, 0.003, 0.004, 0.005],
      caption: '',
    });

    const botRuler = numberRuler({
      cx: 0,
      cy: 245,
      width: 1260,
      min: 0,
      max: 0.5,
      ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      caption: '',
    });

    const outCleanX = topRuler.mapX(outClean);
    const outNowX = topRuler.mapX(outNow);
    const inCleanX = botRuler.mapX(inClean);
    const inNowX = botRuler.mapX(inNow);

    const nodes = [
      txt('INVERSE NOISE AMPLIFICATION', -840, -420, 26, LA.contrast, 'mono', 'left'),
      txt('Dividing by 0.01 multiplies noise by 100×', -840, -360, 46, COSMOS.ink, 'serif', 'left'),

      // Top output ruler
      txt('OUTPUT SPACE  (weak axis, zoomed 100×)', -630, -238, 28, COSMOS.cyan, 'mono', 'left'),
      txt(
        `measured = ${fmt(outNow, 3)}`,
        630,
        -238,
        34,
        nP > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'right',
      ),
      topRuler.node,
      circle(16, { fill: null, stroke: COSMOS.cyan, width: 4 })
        .at(outCleanX, -145)
        .glow(8, COSMOS.cyan),
      nP > 0.04
        ? line([outCleanX, -145], [outNowX, -145], { stroke: COSMOS.gold, width: 8 }).glow(
            12,
            COSMOS.gold,
          )
        : group(),
      glowDot(outNowX, -145, { radius: 11, color: COSMOS.gold, glow: 14 }),
      nP > 0.4
        ? txt('+0.001 wobble', (outCleanX + outNowX) / 2, -196, 28, COSMOS.gold, 'mono')
        : group(),

      // Center inverse bridge split cleanly above and below the glassPlate
      photonWire(
        [
          [outNowX, -110],
          [0, -14],
        ],
        drift.value * 3,
        { color: iP > 0.2 ? LA.contrast : COSMOS.gold, width: 3.6, glow: 10 },
      ),
      photonWire(
        [
          [0, 106],
          [inNowX, 210],
        ],
        drift.value * 3 + 0.5,
        { color: iP > 0.2 ? LA.contrast : COSMOS.gold, width: 3.6, glow: 10 },
      ),
      glassPlate(0, 46, 650, 108, { stroke: iP > 0.2 ? LA.contrast : COSMOS.gold, glow: 8 }),
      txt(
        'INVERSE STEP:  ÷ 0.01  (× 100)',
        0,
        46,
        30,
        iP > 0.2 ? LA.contrast : COSMOS.gold,
        'mono',
      ).glow(8, iP > 0.2 ? LA.contrast : COSMOS.gold),

      // Bottom input ruler
      txt('RECOVERED INPUT SPACE', -630, 162, 28, LA.contrast, 'mono', 'left'),
      txt(
        iP > 0.2 ? `estimate = ${fmt(inNow, 2)}` : 'true input = 0.20',
        630,
        162,
        34,
        iP > 0.2 ? LA.contrast : COSMOS.cyan,
        'mono',
        'right',
      ),
      botRuler.node,
      circle(16, { fill: null, stroke: COSMOS.cyan, width: 4 })
        .at(inCleanX, 245)
        .glow(8, COSMOS.cyan),
      iP > 0.04
        ? vecArrow([inCleanX, 245], [inNowX, 245], {
            color: LA.contrast,
            width: 8,
            tip: 18,
            glow: 14,
          })
        : group(),
      glowDot(inNowX, 245, { radius: 12, color: iP > 0.2 ? LA.contrast : COSMOS.cyan, glow: 14 }),
      iP > 0.5
        ? txt(
            '+0.10 input error!  (100× larger)',
            (inCleanX + inNowX) / 2,
            368,
            34,
            LA.contrast,
            'mono',
          )
            .glow(10, LA.contrast)
            .opacity(iP)
        : group(),
    ];

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'conditioning-noise-b2-1', noiseP, 1, { dur: 1.0 });
  cueTo(s, c, 'conditioning-inverse-b2-2', invP, 1, { dur: 1.3 });
}

// ---------------------------------------------------------------------------
// 24. conditioning-solve: What survives rounding before a solve?
// Cues: solve-inputs, stable-solver, first-column-rhs, second-column-rhs,
//       normal-equation-condition, rounded-solve, rounded-results
// ---------------------------------------------------------------------------
export function conditioningSolve(s, c) {
  const viewMode = s.value(0); // 0 = beat 0, 1 = beat 1, 2 = beats 2-3, 3 = beat 4
  const inpP = s.value(0);
  const directP = s.value(0);
  const rhs1P = s.value(0);
  const rhs2P = s.value(0);
  const elimP = s.value(0);
  const roundP = s.value(0);
  const resP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.45, seed: 24 }));
  s.add(aura(0, 0, 620, '#60a5fa1a', '#ff6b8b14'));

  // Non-overlapping window helpers for 4 phases: 0, 1, 2, 3
  const visPhase = (target) => {
    const d = Math.abs(viewMode.value - target);
    if (d >= 0.42) return 0;
    return Math.max(0, Math.min(1, 1 - d / 0.42));
  };

  // Beat 0: Direct row subtraction
  const b0View = guardedDynamic(
    () => visPhase(0),
    (vis) => {
      const pD = directP.value;
      const pI = inpP.value;
      return group(
        txt('DIRECT LEAST-SQUARES PATH', -840, -420, 26, LA.fit, 'mono', 'left'),
        txt('Two almost-identical measurements', -840, -360, 46, COSMOS.ink, 'serif', 'left'),
        glassPlate(0, -110, 1460, 310, { stroke: COSMOS.cyan, glow: 6 }),
        txt('Row 1:', -640, -180, 32, COSMOS.muted, 'mono', 'left'),
        txt('1.00 w₁  +  1.00 w₂  =  3.000', -460, -180, 40, COSMOS.ink, 'mono', 'left'),
        txt('Row 2:', -640, -60, 32, COSMOS.muted, 'mono', 'left'),
        txt('1.00 w₁  +  1.04 w₂  =  3.081', -460, -60, 40, COSMOS.gold, 'mono', 'left').glow(
          pI > 0.3 ? 8 : 0,
          COSMOS.gold,
        ),
        txt('(+0.001 noise)', 470, -60, 28, COSMOS.gold, 'mono', 'left'),
        pD > 0.05
          ? group(
              glassPlate(0, 235, 1460, 250, { stroke: LA.fit, glow: 8 }),
              txt('SUBTRACT ROW 1 FROM ROW 2', 0, 162, 26, LA.fit, 'mono'),
              txt('0.04 w₂ = 0.081   →   w₂ = 2.025', 0, 234, 44, LA.fit, 'mono').glow(8, LA.fit),
              txt('Direct fit:  w = [0.975,  2.025]', 0, 306, 34, COSMOS.ink, 'mono'),
            ).opacity(pD)
          : txt('Keep the original table directly', 0, 195, 32, COSMOS.muted, 'sans'),
      ).opacity(vis);
    },
  );

  // Beat 1: Forming Gram matrix D^T D and right-hand side D^T b
  const b1View = guardedDynamic(
    () => visPhase(1),
    (vis) => {
      const r1 = rhs1P.value;
      const r2 = rhs2P.value;
      return group(
        txt('NORMAL EQUATIONS PATH  ·  DᵀD w = Dᵀb', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          'Form the Gram matrix and right-hand side',
          -840,
          -360,
          44,
          COSMOS.ink,
          'serif',
          'left',
        ),
        txt('DᵀD', -480, -225, 36, COSMOS.cyan, 'mono'),
        bracketMatrix(
          [
            ['2.0000', '2.0400'],
            ['2.0400', '2.0816'],
          ],
          {
            cx: -480,
            cy: 20,
            cellW: 215,
            cellH: 128,
            textSize: 38,
            bracketColor: COSMOS.cyan,
            cellColor: () => COSMOS.ink,
          },
        ),
        glassPlate(370, 20, 820, 440, { stroke: COSMOS.gold, glow: 6 }),
        txt('RIGHT-HAND SIDE  Dᵀb', 370, -145, 28, COSMOS.gold, 'mono'),
        txt('Col 1 · b:', 10, -45, 30, LA.slow, 'mono', 'left'),
        txt(
          r1 > 0.3 ? '3.000 + 3.081 = 6.081' : '3.000 + 3.081 = ?',
          195,
          -45,
          34,
          LA.slow,
          'mono',
          'left',
        ).glow(r1 > 0.3 ? 8 : 0, LA.slow),
        txt('Col 2 · b:', 10, 75, 30, LA.rollback, 'mono', 'left'),
        txt(
          r2 > 0.3 ? '3.000 + 1.04·3.081 = 6.20424' : '3.000 + 1.04·3.081 = ?',
          195,
          75,
          30,
          LA.rollback,
          'mono',
          'left',
        ).glow(r2 > 0.3 ? 8 : 0, LA.rollback),
        txt(
          'Tiny differences already shrink into the 4th decimal',
          0,
          355,
          30,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  // Beats 2-3: Elimination remainders before & after 3-decimal rounding
  const b23View = guardedDynamic(
    () => visPhase(2),
    (vis) => {
      const eP = elimP.value;
      const rP = roundP.value;
      // Exact vs 3-decimal rounded normal equations remainders:
      // Exact:   pivot = 2.0816 - 1.02 * 2.04 = 0.00080, rhs = 6.20424 - 1.02 * 6.081 = 0.00162
      // Rounded: pivot = 2.0820 - 1.02 * 2.04 = 0.00120, rhs = 6.20400 - 1.02 * 6.081 = 0.00138
      const pivot = 0.0008 + (0.0012 - 0.0008) * rP;
      const rhsRem = 0.00162 + (0.00138 - 0.00162) * rP;
      const w2Now = rhsRem / pivot;

      const barLeft = -320;
      const barScale = 440000;
      const pivW = Math.max(8, pivot * barScale * eP);
      const rhsW = Math.max(8, rhsRem * barScale * eP);
      const exactPivX = barLeft + 0.0008 * barScale;
      const exactRhsX = barLeft + 0.00162 * barScale;
      const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);

      return group(
        txt(
          rP > 0.3 ? 'AFTER 3-DECIMAL STORAGE ROUNDING' : 'ELIMINATE w₁:  ROW 2 − 1.02 × ROW 1',
          -840,
          -420,
          26,
          rP > 0.3 ? LA.contrast : COSMOS.cyan,
          'mono',
          'left',
        ),
        txt(
          rP > 0.3 ? 'Rounding warps both tiny remainders' : 'Two tiny leftovers decide w₂',
          -840,
          -360,
          46,
          COSMOS.ink,
          'serif',
          'left',
        ),
        glassPlate(0, -210, 1460, 145, { stroke: '#3a4f80', glow: 6 }),
        txt('2.000 w₁  +  2.040 w₂  =  6.081', 0, -242, 34, COSMOS.muted, 'mono'),
        txt(
          rP > 0.3
            ? '2.040 w₁  +  2.082 w₂  =  6.204   (3 decimals)'
            : '2.040 w₁  +  2.0816 w₂  =  6.20424   (exact)',
          0,
          -178,
          36,
          rP > 0.3 ? LA.contrast : COSMOS.ink,
          'mono',
        ),

        // Remainder bars with fixed right-column numeric readouts (zero overlap!)
        txt('Blue pivot (w₂ coeff)', -360, -20, 28, LA.slow, 'sans', 'right'),
        rect(pivW, 38, { fill: LA.slow, stroke: null, radius: 8 })
          .at(barLeft + pivW / 2, -20)
          .glow(10, LA.slow),
        rP > 0.2
          ? markDecor(line([exactPivX, -48], [exactPivX, 8], { stroke: COSMOS.ink, width: 3 }))
          : group(),
        txt(fmt(pivot, 5), 670, -20, 34, LA.slow, 'mono', 'right').opacity(eP),

        txt('Yellow target left', -360, 105, 28, COSMOS.gold, 'sans', 'right'),
        rect(rhsW, 38, { fill: COSMOS.gold, stroke: null, radius: 8 })
          .at(barLeft + rhsW / 2, 105)
          .glow(10, COSMOS.gold),
        rP > 0.2
          ? markDecor(line([exactRhsX, 77], [exactRhsX, 133], { stroke: COSMOS.ink, width: 3 }))
          : group(),
        txt(fmt(rhsRem, 5), 670, 105, 34, COSMOS.gold, 'mono', 'right').opacity(eP),

        rP > 0.3
          ? group(
              txt(
                `w₂ = ${fmt(rhsRem, 5)} / ${fmt(pivot, 5)} = ${fmt(w2Now, 3)}   (dropped from 2.025!)`,
                0,
                268,
                38,
                LA.contrast,
                'mono',
              ).glow(10, LA.contrast),
              txt('Blue bar grew, yellow bar shrank', 0, 340, 30, COSMOS.muted, 'sans'),
            ).opacity(rP)
          : txt(
              'Store each equation to 3 decimals: which fit changes?',
              0,
              278,
              36,
              COSMOS.gold,
              'serif',
            )
              .glow(8, COSMOS.gold)
              .opacity(pulse),
      ).opacity(vis);
    },
  );

  // Beat 4: Side-by-side comparison & condition number squaring
  const b4View = guardedDynamic(
    () => visPhase(3),
    (vis) => {
      const rP = resP.value;
      return group(
        txt('WHY DIRECT QR / SVD WINS', -840, -420, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          'Forming DᵀD squares the condition number',
          -840,
          -360,
          46,
          COSMOS.ink,
          'serif',
          'left',
        ),
        // Left: Direct QR/SVD fit
        glassPlate(-430, -35, 680, 440, { stroke: LA.fit, glow: 8 }),
        txt('DIRECT QR / SVD FIT', -430, -195, 28, LA.fit, 'mono'),
        txt(
          `w = [${fmt(SOLVER_EXACT.directWeights[0], 3)},  ${fmt(SOLVER_EXACT.directWeights[1], 3)}]`,
          -430,
          -95,
          40,
          LA.fit,
          'mono',
        ).glow(8, LA.fit),
        txt('κ₂(D) ≈ 102', -430, 12, 38, COSMOS.cyan, 'mono'),
        txt('Original table fits cleanly in 3 decimals', -430, 108, 26, COSMOS.muted, 'sans'),
        // Right: Rounded normal equations
        glassPlate(430, -35, 680, 440, { stroke: LA.contrast, glow: 8 }),
        txt('ROUNDED NORMAL EQUATIONS', 430, -195, 28, LA.contrast, 'mono'),
        txt(
          `w = [${fmt(SOLVER_ROUNDED.normalWeights[0], 3)},  ${fmt(SOLVER_ROUNDED.normalWeights[1], 3)}]`,
          430,
          -95,
          40,
          LA.contrast,
          'mono',
        ).glow(8, LA.contrast),
        txt('κ₂(DᵀD) = κ₂(D)² ≈ 10,400', 430, 12, 36, COSMOS.gold, 'mono'),
        txt('Weights drifted wildly despite close predictions', 430, 108, 26, COSMOS.muted, 'sans'),
        txt(
          'Avoid explicit AᵀA when columns are nearly collinear',
          0,
          325,
          34,
          COSMOS.gold,
          'serif',
        )
          .glow(8, COSMOS.gold)
          .opacity(Math.max(0.4, rP)),
      ).opacity(vis);
    },
  );

  s.add(b0View, b1View, b23View, b4View);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'solve-inputs', inpP, 1, { dur: 0.6 });
  cueTo(s, c, 'stable-solver', directP, 1, { dur: 0.9 });

  c.onBeat(1, () => s.play(viewMode.to(1, { duration: 0.4 })));
  cueTo(s, c, 'first-column-rhs', rhs1P, 1, { dur: 0.7 });
  cueTo(s, c, 'second-column-rhs', rhs2P, 1, { dur: 0.7 });

  c.onBeat(2, () => s.play(viewMode.to(2, { duration: 0.4 })));
  cueTo(s, c, 'normal-equation-condition', elimP, 1, { dur: 0.9 });
  // Strict prediction withholding during beat 2 hold: roundP stays 0 until beat 3 rounded-solve!
  cueTo(s, c, 'rounded-solve', roundP, 1, { after: true, dur: 0.85 });

  c.onBeat(4, () => s.play(viewMode.to(3, { duration: 0.4 })));
  pulseCue(s, c, 'rounded-results', resP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 25. energy-cutoff: Square the strengths before choosing a cutoff
// Cues: predict-rank, square-areas, retain-first[CB], retain-second[CB], rank-answer[CB], task-relevance
// ---------------------------------------------------------------------------
export function energyCutoff(s, c) {
  const areaP = s.value(0);
  const askP = s.value(0);
  const k1P = s.value(0);
  const k2P = s.value(0);
  const ansP = s.value(0);
  const relP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.48, seed: 25 }));
  s.add(aura(-280, -80, 560, '#5ce1e622', '#ffd16614'));

  const sigmas = [6, 3, 1];
  const energies = [36, 9, 1];
  const total = sum(energies); // 46

  const live = dynamic(() => {
    const aP = areaP.value;
    const p1 = k1P.value;
    const p2 = k2P.value;
    const pA = ansP.value;
    const pR = relP.value;
    const pAsk = askP.value;

    const unit = 44;
    const baseBottom = 85;
    const centersX = [-460, 140, 560];
    const nodes = [
      txt('SQUARED SINGULAR ENERGY', -840, -420, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Square strengths before summing', -840, -360, 48, COSMOS.ink, 'serif', 'left'),
    ];

    // Geometric square grids: 6x6 (36), 3x3 (9), 1x1 (1)
    sigmas.forEach((sv, idx) => {
      const sidePx = sv * unit;
      const xLeft = centersX[idx] - sidePx / 2;
      const yTop = baseBottom - sidePx;
      const isKept = (idx === 0 && p1 > 0.3) || (idx === 1 && p2 > 0.3);
      const isDiscardFocus = idx === 2 && pR > 0.3;
      const litColor = isKept
        ? COSMOS.cyan
        : isDiscardFocus
          ? LA.contrast
          : aP > 0.1
            ? LA.slow
            : '#1a2542';

      for (let r = 0; r < sv; r++) {
        for (let col = 0; col < sv; col++) {
          const cx = xLeft + (col + 0.5) * unit;
          const cy = yTop + (r + 0.5) * unit;
          nodes.push(
            rect(unit - 5, unit - 5, {
              fill: litColor,
              stroke: isKept ? '#a5f3fc' : isDiscardFocus ? LA.contrast : '#3d5282',
              width: 1.5,
              radius: 5,
            })
              .at(cx, cy)
              .opacity(isKept || isDiscardFocus ? 0.92 : 0.35 + 0.55 * aP),
          );
        }
      }

      nodes.push(
        txt(
          `σ${idx + 1} = ${sv}`,
          centersX[idx],
          yTop - 36,
          30,
          isKept ? COSMOS.cyan : isDiscardFocus ? LA.contrast : COSMOS.muted,
          'mono',
        ),
        txt(
          `${sv}² = ${energies[idx]}`,
          centersX[idx],
          baseBottom + 42,
          34,
          isKept ? COSMOS.cyan : isDiscardFocus ? LA.contrast : COSMOS.gold,
          'mono',
        ),
      );
    });

    // Conserved horizontal energy strip with 95% gold threshold
    const stripLeft = -720;
    const stripW = 1440;
    const stripY = 232;
    let curX = stripLeft;
    energies.forEach((en, idx) => {
      const segW = (stripW * en) / total;
      const fillAmt = idx === 0 ? p1 : idx === 1 ? p2 : 0;
      const isDisc = idx === 2 && pR > 0.3;
      nodes.push(
        rect(segW - 4, 54, {
          fill: isDisc ? LA.contrast : fillAmt > 0.1 ? COSMOS.cyan : '#16203b',
          stroke: '#445887',
          width: 1.8,
          radius: 7,
        })
          .at(curX + segW / 2, stripY)
          .glow(fillAmt > 0.4 || isDisc ? 10 : 0, isDisc ? LA.contrast : COSMOS.cyan),
      );
      curX += segW;
    });

    const line95 = stripLeft + 0.95 * stripW;
    nodes.push(
      line([line95, stripY - 46], [line95, stripY + 48], {
        stroke: COSMOS.gold,
        width: 4.5,
      }).glow(10, COSMOS.gold),
      txt('95% cutoff', line95 - 14, stripY - 64, 28, COSMOS.gold, 'mono', 'right'),
    );

    // Bottom readout strictly gated by cues
    const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
    if (pR > 0.2) {
      nodes.push(
        txt(
          'Discarded 1 / 46 can still decide routing: always check downstream metrics',
          0,
          362,
          32,
          LA.contrast,
          'sans',
        )
          .glow(6, LA.contrast)
          .opacity(pR),
      );
    } else if (pA > 0.2) {
      nodes.push(
        txt(
          'Smallest rank ≥ 95%:   k = 2   (45 / 46 ≈ 97.8%,  error = √1 = 1)',
          0,
          362,
          34,
          LA.fit,
          'mono',
        )
          .glow(10, LA.fit)
          .opacity(pA),
      );
    } else if (p2 > 0.2) {
      nodes.push(
        txt('Top 2 keep 45 / 46 ≈ 97.8%  (clears 95%!)', 0, 362, 36, LA.fit, 'mono')
          .glow(8, LA.fit)
          .opacity(p2),
      );
    } else if (p1 > 0.2) {
      nodes.push(
        txt('Top 1 keeps 36 / 46 ≈ 78.3%  (below 95%)', 0, 362, 36, COSMOS.gold, 'mono')
          .glow(8, COSMOS.gold)
          .opacity(p1),
      );
    } else {
      nodes.push(
        txt(
          pAsk > 0.1
            ? 'Total = 36 + 9 + 1 = 46  ·  Smallest rank to reach 95%?'
            : 'Total squared energy = 36 + 9 + 1 = 46',
          0,
          362,
          34,
          COSMOS.gold,
          'serif',
        )
          .glow(8, COSMOS.gold)
          .opacity(pAsk > 0.1 ? pulse : 1),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'square-areas', areaP, 1, { dur: 1.0 });
  pulseCue(s, c, 'predict-rank', askP, 1, { dur: 0.45 });
  // Strict prediction withholding on all 3 caption_boundary cues
  cueTo(s, c, 'retain-first', k1P, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'retain-second', k2P, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'rank-answer', ansP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'task-relevance', relP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 26. low-rank-update: Two thin factors restrict the update's directions (LoRA)
// Cues: low-rank-map, count-factors, factor-count, full-update-count, adam-moments
// ---------------------------------------------------------------------------
export function lowRankUpdate(s, c) {
  const mode = s.value(0); // 0 = beat 0, 1 = beat 1, 2 = beat 2
  const spinP = s.value(0);
  const factorsP = s.value(0);
  const fCountP = s.value(0);
  const fullP = s.value(0);
  const adamP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: LA.fit, opacity: 0.48, seed: 26 }));
  s.add(aura(0, 0, 620, '#6ee7b71e', '#60a5fa14'));

  const visPhase = (target) => {
    const d = Math.abs(mode.value - target);
    if (d >= 0.42) return 0;
    return Math.max(0, Math.min(1, 1 - d / 0.42));
  };

  // Beat 0: Rank-1 bottleneck (2D circle -> 1 scalar -> 1D line)
  const b0 = guardedDynamic(
    () => visPhase(0),
    (vis) => {
      const ang = spinP.value * Math.PI * 2;
      const ix = Math.cos(ang);
      const iy = Math.sin(ang);
      const latent = ix + iy;
      const ox = latent;
      const oy = -latent;

      const leftP = vectorPlane2d({
        originX: -520,
        originY: 30,
        scale: 155,
        xRange: [-1.6, 1.6],
        yRange: [-1.5, 1.5],
        unitCircle: true,
        circleColor: LA.slow,
      });
      const rightP = vectorPlane2d({
        originX: 520,
        originY: 30,
        scale: 155,
        xRange: [-1.6, 1.6],
        yRange: [-1.5, 1.5],
      });

      const latY = 30 - latent * 115;

      return group(
        txt('LOW-RANK ADAPTATION (LoRA)', -840, -420, 26, LA.fit, 'mono', 'left'),
        txt(
          'One scalar bottleneck restricts output to a line',
          -840,
          -360,
          44,
          COSMOS.ink,
          'serif',
          'left',
        ),
        txt('Input space', -520, -245, 30, LA.slow, 'sans'),
        leftP.node,
        vecArrow(leftP.pt(0, 0), leftP.pt(ix, iy), { color: LA.fit, width: 6, glow: 12 }),

        // Middle scalar bottleneck rail
        txt('1 scalar', 0, -245, 28, COSMOS.gold, 'mono'),
        line([0, -180], [0, 240], { stroke: '#4d618f', width: 4 }),
        glowDot(0, latY, { radius: 14, color: LA.fit, glow: 14 }),
        txt(fmt(latent, 2), 82, latY, 32, LA.fit, 'mono'),

        // Right rank-1 output line
        txt('Rank-1 output space', 520, -245, 30, LA.contrast, 'sans'),
        rightP.node,
        line(rightP.pt(-1.45, 1.45), rightP.pt(1.45, -1.45), {
          stroke: LA.contrast,
          width: 4.5,
        }).glow(10, LA.contrast),
        vecArrow(rightP.pt(0, 0), rightP.pt(ox, oy), { color: LA.fit, width: 6, glow: 12 }),
        txt('ΔW = B A   (inner width bounds rank)', 0, 365, 32, COSMOS.muted, 'sans'),
      ).opacity(vis);
    },
  );

  // Beat 1: 4096 x 4096 full square (16,777,216) vs rank-8 thin factors (65,536)
  const b1 = guardedDynamic(
    () => visPhase(1),
    (vis) => {
      const fP = factorsP.value;
      const fcP = fCountP.value;
      const fuP = fullP.value;

      return group(
        txt('TRANSFORMER LAYER SCALE  ·  4096 × 4096', -840, -420, 26, LA.fit, 'mono', 'left'),
        txt(
          'Two thin rank-8 factors replace 16.8M weights',
          -840,
          -360,
          44,
          COSMOS.ink,
          'serif',
          'left',
        ),
        // Dense 4096 x 4096 square
        rect(420, 420, { fill: '#142042', stroke: LA.slow, width: 3.5, radius: 10 })
          .at(-440, 20)
          .glow(10, LA.slow),
        txt('4096 × 4096', -440, -225, 32, LA.slow, 'mono'),
        txt('Full update ΔW', -440, 20, 34, COSMOS.ink, 'serif'),
        fuP > 0.1
          ? txt('16,777,216 weights', -440, 302, 38, LA.slow, 'mono').glow(8, LA.slow).opacity(fuP)
          : group(),

        txt('≈', 0, 20, 56, COSMOS.gold, 'mono'),

        // Two glowing thin rank-8 LoRA slabs
        rect(28, 420, { fill: LA.fit, stroke: '#a7f3d0', width: 2, radius: 6 })
          .at(210, 20)
          .glow(12, LA.fit)
          .opacity(0.4 + 0.6 * fP),
        txt('4096 × 8', 210, -225, 30, LA.fit, 'mono'),
        txt('×', 310, 20, 44, COSMOS.muted, 'mono'),
        rect(420, 28, { fill: LA.fit, stroke: '#a7f3d0', width: 2, radius: 6 })
          .at(590, 20)
          .glow(12, LA.fit)
          .opacity(0.4 + 0.6 * fP),
        txt('8 × 4096', 590, -45, 30, LA.fit, 'mono'),
        fcP > 0.1
          ? group(
              txt('65,536 trainable weights', 440, 285, 38, LA.fit, 'mono').glow(10, LA.fit),
              txt('256× fewer update parameters', 440, 348, 30, COSMOS.gold, 'sans'),
            ).opacity(fcP)
          : group(),
      ).opacity(vis);
    },
  );

  // Beat 2: Adam optimizer state memory drawn to scale (16,777,216 x 2 vs 65,536 x 2 = 256x ratio)
  const b2 = guardedDynamic(
    () => visPhase(2),
    (vis) => {
      const aP = adamP.value;
      const barX = -760;
      const fullHalf = 680 * (0.25 + 0.75 * aP);
      // 1/256th of 680px is ~2.7px; draw minimum visible 6px glowing sliver per moment to show true scale contrast
      const loraHalf = 8 * (0.25 + 0.75 * aP);
      return group(
        txt(
          'ADAM OPTIMIZER STATE  ·  2 MOMENT SLOTS PER WEIGHT (m_t, v_t)',
          -840,
          -420,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          'Full fine-tuning vs rank-8 LoRA state memory',
          -840,
          -360,
          44,
          COSMOS.ink,
          'serif',
          'left',
        ),
        // Top proportional bar: Full update (16,777,216 weights x 2 moments = 33,554,432 slots)
        txt('FULL UPDATE  ΔW (4096 × 4096)', barX, -210, 28, LA.slow, 'mono', 'left'),
        txt(
          '16,777,216 × 2 = 33,554,432 moment slots',
          barX + 1360,
          -210,
          28,
          COSMOS.ink,
          'mono',
          'right',
        ),
        rect(Math.max(8, fullHalf), 86, {
          fill: '#153a5e',
          stroke: COSMOS.cyan,
          width: 3,
          radius: 8,
        })
          .at(barX + fullHalf / 2, -125)
          .glow(8, COSMOS.cyan),
        aP > 0.72
          ? txt(
              '1st moment m_t  (16.8M)',
              barX + fullHalf / 2,
              -125,
              28,
              COSMOS.cyan,
              'mono',
            ).opacity((aP - 0.72) / 0.28)
          : group(),
        rect(Math.max(8, fullHalf), 86, {
          fill: '#3a2c0e',
          stroke: COSMOS.gold,
          width: 3,
          radius: 8,
        })
          .at(barX + fullHalf + fullHalf / 2 + 8, -125)
          .glow(8, COSMOS.gold),
        aP > 0.72
          ? txt(
              '2nd moment v_t  (16.8M)',
              barX + fullHalf + fullHalf / 2 + 8,
              -125,
              28,
              COSMOS.gold,
              'mono',
            ).opacity((aP - 0.72) / 0.28)
          : group(),

        // Bottom proportional bar: LoRA rank-8 (65,536 weights x 2 moments = 131,072 slots = 1/256th!)
        txt('RANK-8 LoRA  B, A (2 × 4096 × 8)', barX, 45, 28, LA.fit, 'mono', 'left'),
        txt('65,536 × 2 = 131,072 moment slots', barX + 1360, 45, 28, LA.fit, 'mono', 'right'),
        // Reference track spanning full width so the 256x shrink is viscerally legible
        rect(1368, 86, { fill: '#0b1224', stroke: '#233252', width: 2, radius: 8 }).at(
          barX + 684,
          130,
        ),
        rect(Math.max(6, loraHalf), 86, { fill: COSMOS.cyan, stroke: null, radius: 4 })
          .at(barX + loraHalf / 2, 130)
          .glow(10, COSMOS.cyan),
        rect(Math.max(6, loraHalf), 86, { fill: COSMOS.gold, stroke: null, radius: 4 })
          .at(barX + loraHalf + loraHalf / 2 + 2, 130)
          .glow(10, COSMOS.gold),
        txt('m_t + v_t', barX + 34, 130, 26, LA.fit, 'mono', 'left'),
        txt('256× SMALLER ADAM STATE', barX + 684, 130, 36, COSMOS.gold, 'mono')
          .glow(10, COSMOS.gold)
          .opacity(0.35 + 0.65 * aP),

        txt(
          'Frozen base weights allocate zero Adam buffers  ·  Pick rank by task accuracy, not just size',
          0,
          345,
          29,
          COSMOS.muted,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  s.add(b0, b1, b2);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'low-rank-map', spinP, 1, { dur: 3.5 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.4 })));
  cueTo(s, c, 'count-factors', factorsP, 1, { dur: 0.8 });
  cueTo(s, c, 'factor-count', fCountP, 1, { dur: 0.6 });
  cueTo(s, c, 'full-update-count', fullP, 1, { dur: 0.6 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.4 })));
  cueTo(s, c, 'adam-moments', adamP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 27. new-routing-objective: Which measurement belongs in the field?
// Cues: choose-contrast, count-counterexample, counter-contrast, recover-total, counter-totals[CB]
// ---------------------------------------------------------------------------
export function newRoutingObjective(s, c) {
  const turn = s.value(0); // 0 = common, 1 = contrast
  const pairMode = s.value(0); // 0 = [4,0] & [0,4], 1 = [0,0] & [4,4]
  const readC2 = s.value(0);
  const totAns = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.48, seed: 27 }));
  s.add(aura(-230, 30, 560, '#ffd16622', '#ff6b8b14'));

  const live = dynamic(() => {
    const t = turn.value;
    const pm = pairMode.value;
    const tAns = totAns.value;
    const isCountTask = pm > 0.5;
    const pair = isCountTask
      ? [
          [0, 0],
          [4, 4],
        ]
      : [
          [4, 0],
          [0, 4],
        ];
    const pairNames = isCountTask
      ? ['[0, 0]  (0 total)', '[4, 4]  (8 total)']
      : ['[4, 0]  (slow)', '[0, 4]  (rollback)'];
    const pairCols = isCountTask ? [COSMOS.cyan, LA.both] : [LA.slow, LA.rollback];

    const meas = ticketMeasurement(pair, t);
    const rulerCol = t > 0.5 ? LA.contrast : COSMOS.gold;

    const plane = vectorPlane2d({
      originX: -395,
      originY: 185,
      scale: 82,
      xRange: [-1.4, 4.9],
      yRange: [-1.2, 4.9],
      xLabel: '',
      yLabel: '',
    });

    const dir = meas.direction;
    const r0 = plane.pt(-1.35 * dir[0], -1.35 * dir[1]);
    const r1 = plane.pt(4.8 * dir[0], 4.8 * dir[1]);

    const nodes = [
      txt('TASK DETERMINES THE DIRECTION', -840, -420, 26, rulerCol, 'mono', 'left'),
      txt(
        isCountTask
          ? 'Counter task: recover total mentions'
          : 'Router task: separate slow vs rollback',
        -840,
        -360,
        44,
        COSMOS.ink,
        'serif',
        'left',
      ),
      plane.node,
      txt('slow mentions', -410, 418, 26, COSMOS.muted, 'mono', 'right'),
      txt('rollback mentions', -665, -248, 26, COSMOS.muted, 'mono', 'left'),
      line(r0, r1, { stroke: rulerCol, width: 4.5 }).glow(10, rulerCol),
    ];

    pair.forEach((ptW, i) => {
      const col = pairCols[i];
      const ptS = plane.pt(ptW[0], ptW[1]);
      const projS = plane.pt(meas.rows[i][0], meas.rows[i][1]);
      nodes.push(
        markDecor(line(ptS, projS, { stroke: col, width: 2.8, dash: [7, 7] })),
        glowDot(ptS[0], ptS[1], { radius: 13, color: col, glow: 12 }),
        circle(i === 1 ? 18 : 13, { fill: null, stroke: col, width: 4 })
          .at(projS[0], projS[1])
          .glow(10, col),
      );
    });

    // Right panel: live score ruler & task outcome
    const rx = 505;
    const scoreRuler = numberRuler({
      cx: rx,
      cy: 45,
      width: 560,
      min: -4,
      max: 6.5,
      ticks: [-3, 0, 3, 6],
    });

    const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);

    nodes.push(
      glassPlate(rx, 20, 680, 720, { stroke: rulerCol, glow: 6 }),
      txt(
        t > 0.5 ? 'RULER: CONTRAST  v₂' : 'RULER: COMMON  v₁',
        rx,
        -280,
        30,
        rulerCol,
        'mono',
      ).glow(8, rulerCol),
      ...pair.flatMap((_row, i) => [
        txt(pairNames[i], rx - 280, -190 + i * 74, 28, pairCols[i], 'mono', 'left'),
        txt(fmt(meas.scores[i], 2), rx + 280, -190 + i * 74, 34, pairCols[i], 'mono', 'right'),
      ]),
      scoreRuler.node,
      ...meas.scores.map((sc, i) =>
        circle(i === 1 ? 17 : 12, {
          fill: i === 0 ? pairCols[i] : null,
          stroke: pairCols[i],
          width: 4,
        })
          .at(scoreRuler.mapX(sc), 45)
          .glow(10, pairCols[i]),
      ),
    );

    if (!isCountTask && t < 0.5) {
      nodes.push(
        txt('Both land on +2.83! How to turn?', rx, 225, 34, COSMOS.gold, 'serif')
          .glow(8, COSMOS.gold)
          .opacity(pulse),
      );
    } else if (!isCountTask && t >= 0.5) {
      nodes.push(
        txt('Opposite signs: −2.83 vs +2.83', rx, 225, 34, LA.contrast, 'mono').glow(
          8,
          LA.contrast,
        ),
        txt('Contrast separates the two teams', rx, 285, 28, COSMOS.muted, 'sans'),
      );
    } else if (isCountTask && t > 0.5) {
      nodes.push(
        txt(
          readC2.value > 0.2
            ? 'Both read 0.00 on contrast!'
            : 'Compare [0,0] and [4,4] on contrast',
          rx,
          215,
          30,
          COSMOS.gold,
          'mono',
        ),
        txt('Can the counter recover both totals?', rx, 280, 32, COSMOS.gold, 'serif')
          .glow(8, COSMOS.gold)
          .opacity(pulse),
      );
    } else {
      nodes.push(
        txt('Common separates:  0  vs  5.66', rx, 208, 32, COSMOS.gold, 'mono'),
        tAns > 0.1
          ? txt('× √2  →  totals 0 and 8', rx, 282, 34, LA.fit, 'mono')
              .glow(10, LA.fit)
              .opacity(tAns)
          : group(),
      );
    }

    return group(...nodes);
  });

  s.add(live);
  livingDrift(s, c, drift, 1);

  // Beat 1: rotate ruler to contrast
  cueTo(s, c, 'choose-contrast', turn, 1, { dur: 1.0 });
  // Beat 2: switch pair to [0,0] and [4,4] while ruler stays on contrast
  cueTo(s, c, 'count-counterexample', pairMode, 1, { dur: 0.4 });
  pulseCue(s, c, 'counter-contrast', readC2, 1, { dur: 0.5 });
  // Beat 3: rotate back to common, reveal totals 0 and 8 strictly after counter-totals[CB]
  cueTo(s, c, 'recover-total', turn, 0, { dur: 1.0 });
  cueTo(s, c, 'counter-totals', totAns, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 28. decision: Which tickets can one score route? (GRAND FINALE)
// Cues: restore-contrast, file-notes, route-tickets[CB], route-release[CB], route-both[CB],
//       invoice-ticket, invoice-contrast, weight-flags, encode-pairs, dispatch-four[CB],
//       code-bits, both-bits
// ---------------------------------------------------------------------------
export function decision(s, c) {
  const halfMode = s.value(0); // 0 = beats 0-1 (3 tickets), 1 = beats 2-4 (4 tickets + 2-bit codes)
  const turnP = s.value(0);
  const fileP = s.value(0);
  const r0P = s.value(0);
  const r1P = s.value(0);
  const r2P = s.value(0);
  const invP = s.value(0);
  const cmpP = s.value(0);
  const wtP = s.value(0);
  const encP = s.value(0);
  const dispP = s.value(0);
  const bitsP = s.value(0);
  const bothBP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.5, seed: 28 }));
  s.add(aura(-420, 0, 520, '#60a5fa20', '#07091000'));
  s.add(aura(420, 0, 520, '#6ee7b722', '#ffd16612'));

  // Half 1 (Beats 0-1): Restore contrast, file notes, route 3 nonempty tickets!
  const part1 = guardedDynamic(
    () => fadeOut(halfMode.value),
    (vis) => {
      const t = turnP.value;
      const f = fileP.value;
      const meas = ticketMeasurement(A, t);
      const routes = ['Performance', 'Release repair', 'Both teams'];
      const rVals = [r0P.value, r1P.value, r2P.value];

      const dialX = -560;
      const dialY = -365;
      const dir = meas.direction;

      const nodes = [
        txt('RETURN TO THE SUPPORT DESK', -840, -445, 26, COSMOS.gold, 'mono', 'left'),
        // Rotating direction dial
        circle(44, { fill: '#0e162c', stroke: t > 0.5 ? LA.contrast : COSMOS.gold, width: 3 }).at(
          dialX,
          dialY,
        ),
        vecArrow([dialX, dialY], [dialX + 34 * dir[0], dialY - 34 * dir[1]], {
          color: t > 0.5 ? LA.contrast : COSMOS.gold,
          width: 4.5,
          tip: 11,
          glow: 8,
        }),
        txt(
          t > 0.5 ? 'Direction: Contrast' : 'Direction: Common',
          dialX + 70,
          dialY,
          34,
          t > 0.5 ? LA.contrast : COSMOS.gold,
          'serif',
          'left',
        ),
        // Column headers
        txt(f > 0.5 ? 'Filed notes' : 'Ticket flags', -620, -245, 28, COSMOS.muted, 'mono'),
        txt('One saved score', 0, -245, 28, COSMOS.muted, 'mono'),
        txt('Dispatch', 590, -245, 28, COSMOS.muted, 'mono'),
      ];

      const names = ['Slow pages', 'Rollback', 'Both issues'];
      A.forEach((row, i) => {
        const y = -115 + i * 168;
        const col = LA.tickets[i];
        const sc = meas.scores[i];
        const delivered = rVals[i] > 0.2;
        const railX0 = -280;
        const railW = 560;
        const mapR = (v) => railX0 + ((v + 1.5) / 3) * railW;
        const noteOp = delivered ? 1 : Math.max(0.22, 1 - 0.78 * f);

        nodes.push(
          glassPlate(-620, y, 420, 108, { stroke: col, glow: 6 }).opacity(noteOp),
          txt(names[i], -620, y - 16, 32, col, 'serif').opacity(noteOp),
          txt(`[${row[0]}, ${row[1]}]`, -620, y + 26, 26, COSMOS.muted, 'mono').opacity(noteOp),
          // Score rail
          markDecor(line([railX0, y], [railX0 + railW, y], { stroke: '#4b5f8e', width: 3.4 })),
          markDecor(line([mapR(0), y - 22], [mapR(0), y + 22], { stroke: COSMOS.ink, width: 2.8 })),
          glowDot(mapR(sc), y, { radius: 13, color: col, glow: 14 }),
          txt(fmt(sc, 2), mapR(sc), y - 36, 26, col, 'mono'),
          // Dispatch slot (strictly withheld until route-* [CB] triggers!)
          glassPlate(590, y, 400, 108, {
            stroke: delivered ? col : '#334570',
            glow: delivered ? 10 : 0,
          }),
          delivered
            ? txt(routes[i], 590, y, 34, col, 'serif').glow(8, col).opacity(rVals[i])
            : txt('?', 590, y, 38, COSMOS.gold, 'mono').opacity(f > 0.3 ? 1 : 0.45),
        );
      });

      const pulse = 0.72 + 0.28 * Math.sin(drift.value * Math.PI * 8);
      nodes.push(
        r2P.value > 0.3
          ? txt(
              'Every nonempty binary ticket gets its exact team from one signed contrast score!',
              0,
              370,
              30,
              LA.fit,
              'sans',
            )
          : txt(
              f > 0.4
                ? 'If the router reads 0, who takes the call?'
                : 'Turn to contrast and file the notes',
              0,
              370,
              36,
              COSMOS.gold,
              'serif',
            )
              .glow(8, COSMOS.gold)
              .opacity(f > 0.4 ? pulse : 1),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Half 2 (Beats 2-4): Invoice [0,0] collision -> binary weights [1,2] -> 2-bit codes!
  const part2 = guardedDynamic(
    () => fadeIn(halfMode.value),
    (vis) => {
      const iP = invP.value;
      const cP = cmpP.value;
      const wP = wtP.value;
      const eP = encP.value;
      const dP = dispP.value;
      const bP = bitsP.value;
      const bbP = bothBP.value;

      const rows = [...A, [0, 0]];
      const names = ['Slow pages', 'Rollback', 'Both issues', 'Invoice'];
      const cols = [LA.slow, LA.rollback, LA.both, COSMOS.gold];
      const dests = ['Billing', 'Performance', 'Release repair', 'Both teams'];
      const showBits = bP > 0.2;

      const nodes = [
        txt(
          showBits
            ? 'FOUR CODES FIT IN TWO BITS'
            : wP > 0.4
              ? 'WEIGHTED CODE:  1·slow + 2·rollback'
              : 'NEW BILLING TICKET:  [0, 0]',
          -840,
          -430,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          showBits
            ? 'Every bit preserves its original flag'
            : wP > 0.4
              ? 'Four distinct codes: 0, 1, 2, 3'
              : 'Invoice collides with Both at contrast 0',
          -840,
          -370,
          44,
          COSMOS.ink,
          'serif',
          'left',
        ),
        txt('Ticket', -720, -255, 28, COSMOS.muted, 'mono', 'left'),
        txt('Flags', -390, -255, 28, COSMOS.muted, 'mono'),
        txt(
          showBits ? 'Bits (2, 1)' : wP > 0.4 ? 'Weighted score' : 'Contrast score',
          55,
          -255,
          28,
          COSMOS.muted,
          'mono',
        ),
        txt('Destination', 610, -255, 28, COSMOS.muted, 'mono'),
      ];

      rows.forEach((row, i) => {
        if (i === 3 && iP < 0.05) return;
        const y = -155 + i * 136;
        const col = cols[i];
        const conScore = dotProduct(row, contrast);
        const code = dotProduct(row, dispatchWeights); // 1, 2, 3, 0
        const rowOp = i === 3 ? iP : 1;
        const isBothHi = i === 2 && bbP > 0.2;

        if (isBothHi) {
          nodes.push(
            markDecor(
              rect(1680, 108, {
                fill: '#6ee7b71a',
                stroke: LA.both,
                width: 2.8,
                radius: 14,
              }).at(0, y),
            ),
          );
        }

        nodes.push(
          txt(names[i], -720, y, 34, col, 'serif', 'left').opacity(rowOp),
          txt(`[${row[0]}, ${row[1]}]`, -390, y, 32, col, 'mono').opacity(rowOp),
        );

        if (showBits) {
          const bits = code.toString(2).padStart(2, '0');
          const bitX = [-55, 65];
          const bitCols = [LA.rollback, LA.slow];
          for (let b = 0; b < 2; b++) {
            const on = bits[b] === '1';
            nodes.push(
              rect(84, 78, {
                fill: on ? bitCols[b] : '#11182c',
                stroke: on ? bitCols[b] : '#3a4f80',
                width: 2.4,
                radius: 10,
              })
                .at(bitX[b], y)
                .glow(on ? 10 : 0, bitCols[b]),
              txt(bits[b], bitX[b], y, 42, on ? '#070910' : COSMOS.dim, 'mono'),
            );
          }
          nodes.push(
            txt(`= ${code}`, 195, y, 38, col, 'mono').glow(6, col),
            txt(dests[code], 610, y, 34, col, 'serif').glow(isBothHi ? 10 : 4, col),
          );
        } else {
          // Score rail from -1 to 3
          const rLeft = -210;
          const rW = 520;
          const mapS = (v) => rLeft + ((v + 1) / 4) * rW;
          const valNow = wP > 0.4 ? conScore + (code - conScore) * eP : conScore;
          const hideZeroComp = i === 3 && cP < 0.2;

          nodes.push(
            markDecor(line([rLeft, y], [rLeft + rW, y], { stroke: '#445887', width: 3 })).opacity(
              rowOp,
            ),
            markDecor(
              line([mapS(0), y - 16], [mapS(0), y + 16], { stroke: COSMOS.ink, width: 2.4 }),
            ).opacity(rowOp),
          );

          if (hideZeroComp) {
            nodes.push(txt('?', mapS(0) + 34, y - 34, 32, COSMOS.gold, 'mono'));
          } else {
            nodes.push(
              glowDot(mapS(valNow), y, { radius: 13, color: col, glow: 14 }).opacity(rowOp),
              txt(
                wP > 0.4 && eP > 0.5 ? String(code) : fmt(valNow, 2),
                mapS(valNow),
                y - 34,
                26,
                col,
                'mono',
              ).opacity(rowOp),
            );
          }

          const showDest = wP > 0.4 ? dP > 0.2 : i < 2;
          nodes.push(
            txt(
              showDest ? dests[code] : '?',
              610,
              y,
              32,
              showDest ? col : COSMOS.gold,
              'serif',
            ).opacity(rowOp * (showDest ? (wP > 0.4 ? dP : 1) : 0.8)),
          );
        }
      });

      const footer =
        bbP > 0.3
          ? '1 1 in binary = 2 + 1 = 3  ·  Both bits set routes to Both teams'
          : dP > 0.3
            ? '4 distinct codes (0, 1, 2, 3) need 2 full bits of information'
            : wP > 0.3
              ? 'Weighted linear code: slow × 1 + rollback × 2'
              : 'Both [1, 1] and [0, 0] read 0 on contrast: can one number split them?';

      nodes.push(txt(footer, 0, 392, 30, bbP > 0.3 ? LA.both : COSMOS.gold, 'sans'));

      return group(...nodes).opacity(vis);
    },
  );

  s.add(part1, part2);
  livingDrift(s, c, drift, 1);

  // Beats 0-1
  cueTo(s, c, 'restore-contrast', turnP, 1, { dur: 1.0 });
  cueTo(s, c, 'file-notes', fileP, 1, { dur: 0.7 });
  // Strict prediction withholding on all 3 caption_boundary cues!
  cueTo(s, c, 'route-tickets', r0P, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'route-release', r1P, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'route-both', r2P, 1, { after: true, dur: 0.45 });

  // Beats 2-4 crossfade cleanly (P5)
  c.onBeat(2, () => s.play(halfMode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'invoice-ticket', invP, 1, { dur: 0.65 });
  cueTo(s, c, 'invoice-contrast', cmpP, 1, { dur: 0.7 });

  cueTo(s, c, 'weight-flags', wtP, 1, { dur: 0.6 });
  cueTo(s, c, 'encode-pairs', encP, 1, { dur: 0.9 });
  // Strict withholding on dispatch-four[CB]
  cueTo(s, c, 'dispatch-four', dispP, 1, { after: true, dur: 0.55 });

  cueTo(s, c, 'code-bits', bitsP, 1, { dur: 0.75 });
  cueTo(s, c, 'both-bits', bothBP, 1, { dur: 0.65 });
}
