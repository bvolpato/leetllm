// Act 2 (Scenes 6-10): P-Value Tails, Null Contract, Errors & 3D Power Surface,
// Multiple Comparisons & Sequential Peeking, and Paired Variance Reduction.
import {
  Node,
  circle,
  curve3d,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  point3d,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  BINOMIAL_13,
  BOOTSTRAP_BIN_EDGES,
  COSMOS,
  ROLE,
  beatTo,
  binomialMasses,
  bootstrapBins,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  developmentBootstrap,
  exactSignPower,
  fadeIn,
  fadeOut,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  jointDifferenceMoments,
  makeAxes,
  markDecor,
  mix,
  neonCurve,
  orbitScene,
  peeking,
  rule,
  sampleCurve,
  smooth,
  studies,
  txt,
  variantStudies,
} from '../shared.mjs';

/** Smooth normal CDF approximation (Abramowitz & Stegun) for 3D power surface visualization. */
function normalCdf(z) {
  const s = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
    t *
    Math.exp(-x * x);
  return 0.5 * (1 + s * (1 - poly));
}

// ---------------------------------------------------------------------------
// 6. p-value: Which results count as evidence for B?
// Cues: tail-observed, tail-sum, tail-result*, tail-mirror, tail-return
// ---------------------------------------------------------------------------
export function pValue(s, c) {
  const obsP = s.value(0);
  const sumP = s.value(0);
  const resP = s.value(0);
  const mirP = s.value(0);
  const retP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 6 }));
  s.add(decorAura(180, 20, 560, '#ffd1661c', '#60a5fa12'));

  const headline = heroTitle(['Right-Tail Evidence', 'Under the Fair Coin'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'EXACT ONE-SIDED P-VALUE  ·  W ≥ 8 OF 13',
  });

  const live = dynamic(() => {
    const ob = obsP.value;
    const sm = sumP.value;
    const rs = resP.value;
    const mr = mirP.value;
    const rt = retP.value;
    const nodes = [];

    const x0 = -760;
    const spanW = 1520;
    const baseY = 180;
    const maxH = 385;
    const maxMass = 0.23;
    const step = spanW / 14;
    const barW = step - 22;

    const tailActiveCount = sm > 0.02 ? Math.min(6, Math.ceil(sm * 6)) : 0;
    const mirrorVis = mr * fadeOut(rt);

    nodes.push(line([x0 - 20, baseY], [x0 + spanW + 20, baseY], { stroke: '#4d6499', width: 2.8 }));

    // Smooth shaded bell envelope under right tail (and mirror left tail when active)
    const rightPts = [];
    for (let k = 8; k <= 13; k++) {
      const cx = x0 + (k + 0.5) * step;
      rightPts.push([cx, baseY - (BINOMIAL_13[k] / maxMass) * maxH]);
    }
    if (sm > 0.15) {
      const shadePoly = [[x0 + 8 * step, baseY], ...rightPts, [x0 + 14 * step, baseY]];
      nodes.push(
        markDecor(new Node(polyPath(shadePoly, true)).fill(ROLE.threshold, 0.13 * sm).stroke(null)),
      );
    }

    const fullCurvePts = [];
    for (let k = 0; k <= 13; k++) {
      const cx = x0 + (k + 0.5) * step;
      const h = (BINOMIAL_13[k] / maxMass) * maxH;
      const inRight = k >= 8 && k < 8 + tailActiveCount;
      const inLeft = k <= 5 && mirrorVis > 0.08;
      const col = inRight ? ROLE.threshold : inLeft ? ROLE.danger : ROLE.modelA;

      nodes.push(
        glowCol(cx, baseY, barW, h, col, {
          glow: inRight || inLeft ? 11 : 4,
          radius: 6,
          opacity: inLeft ? 0.55 + 0.45 * mirrorVis : 1,
        }),
        txt(String(k), cx, baseY + 36, 26, inRight || inLeft ? col : COSMOS.muted, 'mono'),
      );
      fullCurvePts.push([cx, baseY - h]);
    }

    nodes.push(
      neonCurve(fullCurvePts, [ROLE.modelA, ROLE.lift, ROLE.threshold], {
        width: 3.4,
        glow: 9,
        opacity: 0.9,
      }),
    );

    // Observed boundary laser at k = 8
    const obsX = x0 + 8.5 * step;
    const obsTopY = baseY - (BINOMIAL_13[8] / maxMass) * maxH;
    nodes.push(
      line([obsX, -230], [obsX, obsTopY - 14], {
        stroke: ROLE.threshold,
        width: 3,
        dash: [6, 6],
      }).opacity(0.45 + 0.55 * ob),
      glowDot(obsX, obsTopY, { radius: 8, color: ROLE.threshold, glow: 14 }),
      txt('Observed: 8 B wins', obsX, -262, 30, ROLE.threshold, 'mono'),
    );

    // Bottom readout with strict non-overlapping phases:
    // Phase 1 (before tail-result): running highlighted count
    // Phase 2 (after tail-result, before tail-mirror): one-sided p = 2380/8192 = 0.291
    // Phase 3 (mirror active, before tail-return): two-sided p = 4760/8192 = 0.581
    // Phase 4 (after tail-return): return to preplanned one-sided p = 0.291
    const preRes = fadeOut(rs);
    const oneSidedA = fadeIn(rs) * fadeOut(mr);
    const twoSided = fadeIn(mr) * fadeOut(rt);
    const oneSidedB = fadeIn(rt);

    if (preRes > 0.02) {
      const mass = BINOMIAL_13.slice(8, 8 + tailActiveCount).reduce((a, b) => a + b, 0);
      const count = Math.round(mass * 8192);
      nodes.push(
        txt(
          `${count.toLocaleString('en-US')} highlighted assignments out of 8,192`,
          0,
          310,
          34,
          COSMOS.ink,
          'mono',
        ).opacity(preRes),
      );
    }

    if (oneSidedA > 0.02) {
      nodes.push(
        group(
          glowTex('P_0(W \\ge 8) = \\frac{2{,}380}{8{,}192} \\approx 0.291', {
            x: 0,
            y: 300,
            size: 46,
            color: ROLE.threshold,
          }),
          txt('About 29% under a fair coin  ·  ordinary sample', 0, 380, 28, COSMOS.muted, 'serif'),
        ).opacity(oneSidedA),
      );
    }

    if (twoSided > 0.02) {
      nodes.push(
        group(
          glowTex('p_{\\text{two}} = \\frac{4{,}760}{8{,}192} \\approx 0.581', {
            x: 0,
            y: 300,
            size: 46,
            color: ROLE.danger,
          }),
          txt(
            'Two-sided mirror also counts W ≤ 5 (equally extreme A wins)',
            0,
            380,
            28,
            ROLE.danger,
            'serif',
          ),
        ).opacity(twoSided),
      );
    }

    if (oneSidedB > 0.02) {
      nodes.push(
        group(
          glowTex('P_0(W \\ge 8) = \\frac{2{,}380}{8{,}192} \\approx 0.291', {
            x: 0,
            y: 300,
            size: 46,
            color: ROLE.lift,
          }),
          txt('Retain the preplanned one-sided right tail', 0, 380, 28, ROLE.lift, 'serif'),
        ).opacity(oneSidedB),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'tail-observed', obsP, 1, { dur: 0.65 });
  cueTo(s, c, 'tail-sum', sumP, 1, { dur: 1.1 });
  cueTo(s, c, 'tail-result', resP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'tail-mirror', mirP, 1, { dur: 0.75 });
  cueTo(s, c, 'tail-return', retP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 7. null-contract: What did we draw?
// Cues: null-contract-0, null-contract-1, empirical-draws, null-contract-2,
//       hyp-null-five, hyp-null-empty, null-contract-3
// ---------------------------------------------------------------------------
export function nullContract(s, c) {
  const c0P = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const empP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const fiveP = s.value(0);
  const emptyP = s.value(0);
  const v3P = s.value(0);
  const c3P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 7 }));
  s.add(decorAura(-420, 40, 480, '#60a5fa1c', '#07091000'));
  s.add(decorAura(420, 40, 480, '#5ce1e61c', '#ffd16610'));

  const headline = heroTitle(['What the Null Model', 'Actually Draws'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'BOUNDARY q = 0.5  ·  SWEEP FLOOR  ·  ERROR MATRIX',
  });

  // View 0 (Beat 0): q <= 0.5 boundary + live miniature null-vs-alternative bell curves
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const ax = makeAxes({
        x0: -700,
        y0: -140,
        w: 1400,
        h: 310,
        xDom: [0, 1],
        yDom: [0, 1],
        xTicks: [0, 0.25, 0.5, 0.75, 1],
        yTicks: [],
        xLabel: 'B win probability q among 13 fixed disagreements',
      });
      const xHalf = ax.px(0.5);
      const nodes = [
        ax.node,
        // Shaded null half-space q <= 0.5
        markDecor(
          rect(xHalf - -700, 310, { fill: '#142347', stroke: null })
            .at((-700 + xHalf) / 2, -140 + 155)
            .opacity(0.65),
        ),
        // Glowing gold boundary at q = 0.5
        line([xHalf, -185], [xHalf, 195], { stroke: ROLE.threshold, width: 4.2 }).glow(
          10,
          ROLE.threshold,
        ),
        txt('Boundary  q = 0.5', xHalf, -220, 32, ROLE.threshold, 'mono'),
        txt('Null:  q ≤ 0.5', -350, -35, 38, ROLE.modelA, 'mono'),
        txt('B wins even rarer farther left', -350, 32, 26, COSMOS.muted, 'sans'),
        txt('Alternative:  q > 0.5', 350, -35, 38, ROLE.modelB, 'mono'),
        txt('Exact McNemar / sign test', 350, 32, 26, COSMOS.muted, 'sans'),
      ];

      nodes.push(
        txt(
          'Worst-case null sits at the fair-coin boundary q = 0.5 (13 disagreements fixed)',
          0,
          345,
          30,
          ROLE.lift,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Left = 13 fair coins vs Right = resample 40 observed task pairs
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const em = empP.value;
      const bootCounts = bootstrapBins(developmentBootstrap.means).map(
        (n) => n / developmentBootstrap.means.length,
      );
      const nodes = [];

      // Left chart: 13 fair coins
      const lx0 = -810;
      const lw = 700;
      const baseY = 175;
      const lStep = lw / 14;
      nodes.push(
        txt('TOSS 13 FAIR COINS  (NULL)', lx0 + lw / 2, -210, 28, ROLE.modelA, 'mono'),
        line([lx0, baseY], [lx0 + lw, baseY], { stroke: '#4d6499', width: 2.5 }),
      );
      BINOMIAL_13.forEach((m, k) => {
        const cx = lx0 + (k + 0.5) * lStep;
        const h = (m / 0.23) * 310;
        const col = k >= 8 ? ROLE.threshold : ROLE.modelA;
        nodes.push(glowCol(cx, baseY, lStep - 12, h, col, { glow: k >= 8 ? 10 : 3, radius: 4 }));
        if (k % 2 === 0) nodes.push(txt(String(k), cx, baseY + 34, 26, COSMOS.muted, 'mono'));
      });
      nodes.push(txt('8+ wins  ·  p = 0.291', lx0 + lw / 2, 295, 32, ROLE.threshold, 'mono'));

      nodes.push(rule(0, -220, 0, 340, '#2a3759', 2));

      // Right chart: Resample 40 observed pairs (quiet dim preview until empirical-draws illuminates)
      const rx0 = 110;
      const rw = 700;
      const rStep = rw / bootCounts.length;
      const rightOp = mix(0.32, 1, em);
      const rightNodes = [
        txt('RESAMPLE 40 OBSERVED PAIRS', rx0 + rw / 2, -210, 28, ROLE.lift, 'mono'),
        line([rx0, baseY], [rx0 + rw, baseY], { stroke: '#4d6499', width: 2.5 }),
      ];
      bootCounts.forEach((share, i) => {
        const cx = rx0 + (i + 0.5) * rStep;
        const h = (share / 0.3) * 310;
        const isNeg = BOOTSTRAP_BIN_EDGES[i] < 0;
        const col = isNeg ? ROLE.danger : ROLE.lift;
        if (h > 1.5) {
          rightNodes.push(
            glowCol(cx, baseY, rStep - 10, h, col, { glow: isNeg ? 9 : 4, radius: 4 }),
          );
        }
        if (i % 3 === 0) {
          rightNodes.push(
            txt(
              String(Math.round(BOOTSTRAP_BIN_EDGES[i] * 100)),
              cx,
              baseY + 34,
              26,
              COSMOS.muted,
              'mono',
            ),
          );
        }
      });
      rightNodes.push(
        txt('Below 0  ·  B falls behind', rx0 + rw / 2, 295, 32, ROLE.danger, 'mono'),
      );
      nodes.push(group(...rightNodes).opacity(rightOp));

      nodes.push(
        txt(
          'Posterior P(B better | data) would also require a prior and data model',
          0,
          380,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Sweep floor d=4 (1/16) -> d=5 (1/32) -> d=0 (p=1)
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const fv = fiveP.value;
      const em = emptyP.value;
      const phase4 = fadeOut(fv);
      const phase5 = fadeIn(fv) * fadeOut(em);
      const phase0 = fadeIn(em);
      const nodes = [];

      if (phase4 > 0.02) {
        const p4Nodes = [
          txt('4 DISAGREEMENTS  ·  ALL 16 STRINGS EQUALLY LIKELY', 0, -210, 28, ROLE.lift, 'mono'),
        ];
        for (let i = 0; i < 16; i++) {
          const sStr = i.toString(2).padStart(4, '0').replaceAll('0', 'A').replaceAll('1', 'B');
          const cx = -630 + (i % 8) * 180;
          const cy = -80 + Math.floor(i / 8) * 125;
          const isSweep = i === 15;
          const col = isSweep ? ROLE.modelB : ROLE.modelA;
          p4Nodes.push(
            rect(144, 72, {
              fill: isSweep ? '#0f2820' : '#10192e',
              stroke: col,
              width: isSweep ? 3 : 1.8,
              radius: 10,
            })
              .at(cx, cy)
              .glow(isSweep ? 12 : 0, col),
            txt(sStr, cx, cy, 28, col, 'mono'),
          );
        }
        p4Nodes.push(
          glowTex('p_{\\min} = 2^{-4} = \\frac{1}{16} = 0.0625 > 0.05', {
            x: 0,
            y: 225,
            size: 46,
            color: ROLE.threshold,
          }),
          txt('Even a 4-for-4 sweep stays above 5%', 0, 325, 32, ROLE.danger, 'serif'),
        );
        nodes.push(group(...p4Nodes).opacity(phase4));
      }

      if (phase5 > 0.02) {
        const p5Nodes = [
          txt(
            '5 DISAGREEMENTS  ·  32 STRINGS  ·  HALF THE FLOOR',
            0,
            -210,
            28,
            ROLE.modelB,
            'mono',
          ),
        ];
        for (let i = 0; i < 32; i++) {
          const sStr = i.toString(2).padStart(5, '0').replaceAll('0', 'A').replaceAll('1', 'B');
          const cx = -665 + (i % 8) * 190;
          const cy = -115 + Math.floor(i / 8) * 82;
          const isSweep = i === 31;
          const col = isSweep ? ROLE.modelB : ROLE.modelA;
          p5Nodes.push(
            rect(158, 56, {
              fill: isSweep ? '#0f2820' : '#10192e',
              stroke: col,
              width: isSweep ? 3 : 1.5,
              radius: 8,
            })
              .at(cx, cy)
              .glow(isSweep ? 12 : 0, col),
            txt(sStr, cx, cy, 26, col, 'mono'),
          );
        }
        p5Nodes.push(
          glowTex('p_{\\min} = 2^{-5} = \\frac{1}{32} = 0.03125 < 0.05', {
            x: 0,
            y: 255,
            size: 46,
            color: ROLE.modelB,
          }),
          txt(
            'Each extra win halves the smallest possible p-value',
            0,
            345,
            30,
            COSMOS.ink,
            'serif',
          ),
        );
        nodes.push(group(...p5Nodes).opacity(phase5));
      }

      if (phase0 > 0.02) {
        nodes.push(
          group(
            txt('0 DISAGREEMENTS  ·  ALL TASKS TIED', 0, -140, 30, COSMOS.muted, 'mono'),
            glowTex('p = 2^0 = 1', { x: 0, y: 10, size: 72, color: ROLE.threshold }),
            txt(
              'No disagreements means zero directional evidence  ·  plan for tie rate and target lift',
              0,
              185,
              32,
              COSMOS.ink,
              'serif',
            ),
          ).opacity(phase0),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): Open 2x2 Decision Error Matrix (Type I, Type II, Power)
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const nodes = [
        // Column & Row headers
        txt('REJECT H₀', -90, -210, 30, ROLE.threshold, 'mono'),
        txt('DO NOT REJECT H₀', 470, -210, 30, ROLE.threshold, 'mono'),
        txt('H₀ TRUE', -620, -45, 30, ROLE.modelA, 'mono'),
        txt('(equal wins)', -620, 0, 26, COSMOS.muted, 'sans'),
        txt('H₁ TRUE', -620, 165, 30, ROLE.modelB, 'mono'),
        txt('(B really better)', -620, 210, 26, COSMOS.muted, 'sans'),
        // Clean luminous crosshair grid (no boxed card clutter)
        rule(-760, -160, 790, -160, '#2e3f69', 2.4),
        rule(-760, 62, 790, 62, '#2e3f69', 2.4),
        rule(-400, -240, -400, 270, '#2e3f69', 2.4),
        rule(190, -240, 190, 270, '#2e3f69', 2.4),
        // Four quadrants
        txt('TYPE I ERROR (α)', -90, -68, 32, ROLE.danger, 'mono').glow(10, ROLE.danger),
        txt('False win called', -90, -14, 28, COSMOS.ink, 'sans'),
        txt('CORRECT RETENTION', 470, -68, 30, ROLE.modelA, 'mono'),
        txt('No false alarm (≥ 1 − α)', 470, -14, 28, COSMOS.muted, 'sans'),
        txt('STATISTICAL POWER (1 − β)', -90, 145, 30, ROLE.modelB, 'mono').glow(10, ROLE.modelB),
        txt('Real gain detected', -90, 199, 28, COSMOS.ink, 'sans'),
        txt('TYPE II ERROR (β)', 470, 145, 32, ROLE.warning, 'mono').glow(8, ROLE.warning),
        txt('Real gain missed', 470, 199, 28, COSMOS.ink, 'sans'),
        txt(
          'Unresolved ≠ equivalence  ·  equivalence testing starts by fixing a tolerance',
          0,
          355,
          30,
          ROLE.lift,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2, view3);
  cueTo(s, c, 'null-contract-0', c0P, 1, { dur: 0.5 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'null-contract-1', c1P, 1, { dur: 0.5 });
  cueTo(s, c, 'empirical-draws', empP, 1, { dur: 0.8 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'null-contract-2', c2P, 1, { dur: 0.5 });
  cueTo(s, c, 'hyp-null-five', fiveP, 1, { dur: 0.75 });
  cueTo(s, c, 'hyp-null-empty', emptyP, 1, { dur: 0.75 });
  beatTo(s, c, 3, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'null-contract-3', c3P, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 8. errors-and-power: Watch the same decision rule repeat (SIGNATURE 3D SURFACE)
// Cues: size-cutoff, size-studies, size-receipt, power-alternative,
//       power-studies, power-receipt, power-grow, power-large
// ---------------------------------------------------------------------------
export function errorsAndPower(s, c) {
  const cutP = s.value(0);
  const sStudP = s.value(0);
  const sRecP = s.value(0);
  const altP = s.value(0);
  const pStudP = s.value(0);
  const pRecP = s.value(0);
  const growP = s.value(0);
  const lrgP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelB, seed: 8 }));
  s.add(decorAura(-440, 20, 480, '#60a5fa1a', '#07091000'));
  s.add(decorAura(430, 30, 520, '#6ee7b722', '#ffd16614'));

  const headline = heroTitle(['Repeated Studies &', 'the 3D Power Surface'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 58,
    accent: ROLE.modelB,
    eyebrow: 'ALPHA = 5%  ·  EXACT SIGN POWER(d, q)',
  });

  // Right half: Signature Orbiting 3D Power Surface Power(disagreements d, advantage q)
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.6,
    unit: 90,
    focus: [0, 0, 0.9],
  }).at(485, 30);

  const floor3d = gridPlane3d({
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    z: 0,
    step: 1.2,
    color: '#2a3c66',
    opacity: 0.45,
  });

  // Map u in [-2.4, 2.4] -> disagreements d in [10, 70]
  // Map v in [-2.4, 2.4] -> true B win rate q in [0.50, 0.74]
  const uOfD = (d) => -2.4 + ((d - 10) / 60) * 4.8;
  const vOfQ = (q) => -2.4 + ((q - 0.5) / 0.24) * 4.8;
  const powerZ = (u, v) => {
    const d = 10 + ((u + 2.4) / 4.8) * 60;
    const q = 0.5 + ((v + 2.4) / 4.8) * 0.24;
    const zVal = (Math.sqrt(d) * (q - 0.5) - 1.645 * 0.5) / Math.sqrt(q * (1 - q));
    return 2.45 * normalCdf(zVal);
  };

  const pwrSurface = surface(powerZ, {
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    resolution: [20, 20],
    colors: [ROLE.modelA, ROLE.lift, ROLE.modelB, ROLE.threshold],
    mesh: '#8fa9e0',
  });

  // Glowing 3D ridge curve along q = 0.65 as sample size d climbs from 10 to 70
  const v65 = vOfQ(0.65);
  const ridgeCurve = curve3d(
    (t) => {
      const u = mix(-2.4, 2.4, t);
      return [u, v65, powerZ(u, v65) + 0.08];
    },
    0,
    1,
    {
      samples: 44,
      color: ROLE.threshold,
      width: 4.5,
      glow: 10,
      blend: 'screen',
    },
  );

  // Operating point beacon gliding across the 3 regimes: (13, 0.50) -> (13, 0.65) -> (64, 0.65)
  const p13 = exactSignPower(13, 0.65, 0.05);
  const p64 = exactSignPower(64, 0.65, 0.05);
  const beaconPos = () => {
    const a = smooth(altP.value);
    const g = smooth(growP.value);
    const d = mix(13, 64, g);
    const q = mix(0.5, 0.65, a);
    const u = uOfD(d);
    const v = vOfQ(q);
    return [u, v, powerZ(u, v) + 0.14];
  };

  const beacon3d = point3d(beaconPos, {
    color: ROLE.threshold,
    radius: 9,
    glow: 16,
    blend: 'screen',
  });

  view3d.add(floor3d, pwrSurface, ridgeCurve, beacon3d);

  // Left half: 200 simulated studies constellation + exact decision cutoff + exact receipts
  const live = dynamic(() => {
    const cu = cutP.value;
    const ss = sStudP.value;
    const sr = sRecP.value;
    const al = altP.value;
    const ps = pStudP.value;
    const pr = pRecP.value;
    const gr = growP.value;
    const lg = lrgP.value;

    const regime = gr > 0.05 ? 'large' : al > 0.05 ? 'small' : 'null';
    const list = studies[regime];
    const nDis = regime === 'large' ? 64 : 13;
    const crit = regime === 'large' ? p64.critical : p13.critical;
    const activeProg = regime === 'large' ? gr : regime === 'small' ? ps : ss;
    const shownCount = Math.min(200, Math.floor(200 * activeProg));
    const hits = list.slice(0, shownCount).filter((st) => st.rejects).length;

    const nodes = [
      txt(
        `RULE: REJECT IF B WINS ≥ ${crit} OF ${nDis}`,
        -855,
        -225,
        28,
        ROLE.threshold,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * cu),
      txt(
        regime === 'null'
          ? 'WORLD: FAIR COIN (q = 50%)'
          : regime === 'small'
            ? 'WORLD: REAL GAIN (q = 65%, d = 13)'
            : 'WORLD: REAL GAIN (q = 65%, d = 64)',
        -855,
        -182,
        26,
        regime === 'null' ? ROLE.modelA : ROLE.modelB,
        'mono',
        'left',
      ),
    ];

    // 20 x 10 grid of 200 study tiles on left canvas (x: -840..-60, y: -120..240)
    const gx0 = -835;
    const gy0 = -125;
    const pitchX = 40;
    const pitchY = 34;
    for (let i = 0; i < 200; i++) {
      const col = i % 20;
      const row = Math.floor(i / 20);
      const cx = gx0 + col * pitchX;
      const cy = gy0 + row * pitchY;
      const active = i < shownCount;
      const rejected = active && list[i].rejects;
      const fill = !active
        ? '#0f172b'
        : rejected
          ? regime === 'null'
            ? ROLE.danger
            : ROLE.modelB
          : '#213a66';
      nodes.push(
        rect(28, 22, { fill, stroke: rejected ? '#ffffff44' : '#2a3c63', width: 1, radius: 4 })
          .at(cx, cy)
          .glow(rejected ? 6 : 0, fill),
      );
    }

    // Bottom left live count + exact receipts (non-overlapping phases)
    nodes.push(
      txt(
        `${hits} / ${shownCount} simulated studies rejected`,
        -855,
        255,
        30,
        ROLE.lift,
        'mono',
        'left',
      ),
    );

    const nullRecOp = fadeIn(sr) * fadeOut(al);
    const smallRecOp = fadeIn(pr) * fadeOut(gr);
    const largeRecOp = fadeIn(lg);

    if (nullRecOp > 0.02) {
      nodes.push(
        group(
          txt('EXACT FALSE-POSITIVE RATE (SIZE)', -855, 325, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            `${(p13.size * 100).toFixed(2)}%  (< 5% discrete cutoff)`,
            -855,
            378,
            36,
            ROLE.danger,
            'mono',
            'left',
          ).glow(9, ROLE.danger),
        ).opacity(nullRecOp),
      );
    }
    if (smallRecOp > 0.02) {
      nodes.push(
        group(
          txt('EXACT POWER AT d = 13, q = 65%', -855, 325, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            `${(p13.power * 100).toFixed(1)}%  (most studies miss it)`,
            -855,
            378,
            36,
            ROLE.warning,
            'mono',
            'left',
          ).glow(9, ROLE.warning),
        ).opacity(smallRecOp),
      );
    }
    if (largeRecOp > 0.02) {
      nodes.push(
        group(
          txt('EXACT POWER AT d = 64, q = 65%', -855, 325, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            `${(p64.power * 100).toFixed(1)}%  (clear detection climb)`,
            -855,
            378,
            36,
            ROLE.modelB,
            'mono',
            'left',
          ).glow(10, ROLE.modelB),
        ).opacity(largeRecOp),
      );
    }

    // 3D surface caption cleanly below the 3D viewport
    nodes.push(
      txt(
        '3D POWER SURFACE  ·  d ∈ [10, 70],  q ∈ [0.50, 0.74]',
        485,
        345,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt('Gold ridge traces q = 65% as disagreements grow', 485, 390, 26, ROLE.threshold, 'sans'),
    );

    return group(...nodes);
  });

  s.add(headline, view3d, live);
  orbitScene(s, c, view3d, { theta: -0.18, phi: 1.08 });
  cueTo(s, c, 'size-cutoff', cutP, 1, { dur: 0.6 });
  cueTo(s, c, 'size-studies', sStudP, 1, { dur: 1.4 });
  cueTo(s, c, 'size-receipt', sRecP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'power-alternative', altP, 1, { dur: 0.8 });
  cueTo(s, c, 'power-studies', pStudP, 1, { dur: 1.4 });
  cueTo(s, c, 'power-receipt', pRecP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'power-grow', growP, 1, { dur: 1.5 });
  cueTo(s, c, 'power-large', lrgP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 9. search: A winner can come from the search
// Cues: search-variants, search-risk, search-budget, search-tighten,
//       peeking-path, peeking-return
// ---------------------------------------------------------------------------
export function search(s, c) {
  const varP = s.value(0);
  const riskP = s.value(0);
  const budP = s.value(0);
  const tightP = s.value(0);
  const v2P = s.value(0);
  const peekP = s.value(0);
  const retP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.danger, seed: 9 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1c', '#ffd16610'));

  const headline = heroTitle(['Multiple Testing &', 'Sequential Peeking'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.danger,
    eyebrow: 'BONFERRONI CUTOFF  ·  STOPPING BIAS',
  });

  // View 1 (Beats 0-1): 20 null variants + family false-positive risk -> Bonferroni cutoff 10 -> 12
  const view1 = guardedDynamic(
    () => fadeOut(v2P.value),
    (vis) => {
      const vr = varP.value;
      const rk = riskP.value;
      const bd = budP.value;
      const tg = smooth(tightP.value);
      const nShown = Math.max(2, Math.ceil(20 * vr));
      const size13 = exactSignPower(13).size;
      const familyRisk = 1 - (1 - size13) ** 20;
      const cutoffVal = mix(10, 12, tg);
      const cutoffInt = Math.round(cutoffVal);

      const x0 = -790;
      const spanW = 1320;
      const baseY = 125;
      const maxH = 310;
      const step = spanW / 20;
      const barW = step - 18;
      const cutY = baseY - (cutoffVal / 13) * maxH;

      const nodes = [
        txt(
          '20 INDEPENDENT NULL VARIANTS  ·  13 DISAGREEMENTS EACH',
          -130,
          -235,
          28,
          COSMOS.muted,
          'mono',
        ),
        line([x0 - 20, baseY], [x0 + spanW + 20, baseY], { stroke: '#4d6499', width: 2.6 }),
      ];

      for (let i = 0; i < 20; i++) {
        const cx = x0 + (i + 0.5) * step;
        const study = variantStudies[i];
        const active = i < nShown;
        const h = (study.wins / 13) * maxH;
        const isFP = study.wins >= cutoffInt;
        const col = isFP ? ROLE.danger : ROLE.modelA;
        if (active) {
          nodes.push(glowCol(cx, baseY, barW, h, col, { glow: isFP ? 11 : 4, radius: 5 }));
        } else {
          nodes.push(
            rect(barW, 24, { fill: '#10182b', stroke: '#253355', width: 1, radius: 4 })
              .at(cx, baseY - 12)
              .opacity(0.4),
          );
        }
        if (i % 2 === 0 || i === 19) {
          nodes.push(txt(String(i + 1), cx, baseY + 34, 26, COSMOS.muted, 'mono'));
        }
      }

      // Cutoff laser rising smoothly from 10 -> 12, label cleanly outside right edge of bars
      nodes.push(
        line([x0 - 25, cutY], [x0 + spanW + 25, cutY], {
          stroke: ROLE.threshold,
          width: 3.6,
        }).glow(10, ROLE.threshold),
        txt(`Cutoff: ${cutoffInt} / 13`, x0 + spanW + 42, cutY, 28, ROLE.threshold, 'mono', 'left'),
      );

      // Bottom equation area (non-overlapping phases: risk -> Bonferroni budget & tightened cutoff)
      const preRisk = fadeOut(rk);
      const riskPhase = fadeIn(rk) * fadeOut(bd);
      const bonfPhase = fadeIn(bd);

      if (preRisk > 0.02) {
        nodes.push(
          txt(
            '20 chances for a null variant to cross the 5% cutoff',
            0,
            265,
            32,
            COSMOS.muted,
            'serif',
          ).opacity(preRisk),
        );
      }
      if (riskPhase > 0.02) {
        nodes.push(
          group(
            glowTex(
              `1 - (1 - ${size13.toFixed(4)})^{20} \\approx ${(familyRisk * 100).toFixed(1)}\\%`,
              {
                x: 0,
                y: 255,
                size: 46,
                color: ROLE.danger,
              },
            ),
            txt('Family false-positive risk explodes to ~61%', 0, 340, 30, ROLE.danger, 'serif'),
          ).opacity(riskPhase),
        );
      }
      if (bonfPhase > 0.02) {
        nodes.push(
          group(
            glowTex('\\alpha_{\\text{each}} = \\frac{0.05}{20} = 0.0025', {
              x: -340,
              y: 255,
              size: 42,
              color: ROLE.threshold,
            }),
            glowTex('P_{\\text{family}} \\le 20 \\cdot \\frac{14}{8{,}192} < 0.05', {
              x: 360,
              y: 255,
              size: 40,
              color: ROLE.modelB,
            }),
            txt(
              tg > 0.85
                ? 'Bonferroni lifts cutoff from 10 to 12  ·  holds even under dependence'
                : 'Spend the 5% budget across all 20 comparisons',
              0,
              348,
              30,
              ROLE.threshold,
              'serif',
            ),
          ).opacity(bonfPhase),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Sequential peeking trace dipping below 0.05 then rebounding
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value),
    (vis) => {
      const pk = peekP.value;
      const rt = retP.value;
      const count = Math.max(2, Math.floor(rt > 0.02 ? mix(19, 64, rt) : mix(2, 19, pk)));
      const ax = makeAxes({
        x0: -720,
        y0: -185,
        w: 1440,
        h: 390,
        xDom: [1, 64],
        yDom: [0, 1],
        xTicks: [1, 16, 32, 48, 64],
        yTicks: [0, 0.5, 1],
        xLabel: 'Accumulating disagreements (repeated peeks)',
        yLabel: 'Nominal p-value',
      });

      const pts = peeking.slice(0, count).map((v) => ax.pt(v.n, v.p));
      const cur = peeking[count - 1];
      const y05 = ax.py(0.05);
      const hitDip = count >= 18;

      const nodes = [
        ax.node,
        // Nominal 0.05 danger line
        line([ax.px(1), y05], [ax.px(64), y05], {
          stroke: ROLE.danger,
          width: 3,
          dash: [9, 7],
        }).glow(8, ROLE.danger),
        txt('α = 0.05', ax.px(64) - 10, y05 - 32, 26, ROLE.danger, 'mono', 'right'),
        // Glowing peeking trajectory
        neonCurve(pts, [ROLE.lift, hitDip ? ROLE.danger : ROLE.lift, ROLE.modelA], {
          width: 4.5,
          glow: 10,
        }),
        glowDot(pts.at(-1)[0], pts.at(-1)[1], {
          radius: 10,
          color: cur.p <= 0.05 ? ROLE.danger : ROLE.threshold,
          glow: 14,
        }),
        txt(
          `Look ${cur.n}:  p = ${cur.p.toFixed(3)}`,
          0,
          345,
          36,
          cur.p <= 0.05 ? ROLE.danger : ROLE.threshold,
          'mono',
        ),
      ];

      if (hitDip) {
        const dipPt = ax.pt(peeking[18].n, peeking[18].p);
        nodes.push(
          glowDot(dipPt[0], dipPt[1], { radius: 9, color: ROLE.danger, glow: 14 }),
          txt(
            rt > 0.5
              ? 'Crossed 0.05, then rebounded  ·  fix stopping rule in advance'
              : 'False crossing at look 19!',
            ax.px(36),
            -120,
            30,
            rt > 0.5 ? ROLE.lift : ROLE.danger,
            'serif',
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'search-variants', varP, 1, { dur: 1.1 });
  cueTo(s, c, 'search-risk', riskP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'search-budget', budP, 1, { dur: 0.65 });
  cueTo(s, c, 'search-tighten', tightP, 1, { dur: 0.95 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'peeking-path', peekP, 1, { dur: 1.2 });
  cueTo(s, c, 'peeking-return', retP, 1, { dur: 1.2 });
}

// ---------------------------------------------------------------------------
// 10. variance-construction: What changes when the prompts match?
// Cues (14): variance-construction-0, variance-product, hyp-variance-covariance*,
//   variance-construction-1, hyp-variance-paired-result, hyp-variance-independent-result*,
//   variance-construction-2, hyp-variance-standard-errors, hyp-variance-margins*,
//   variance-construction-3, hyp-variance-sign, variance-negative*, variance-reset*,
//   hyp-variance-match*
// ---------------------------------------------------------------------------
export function varianceConstruction(s, c) {
  const c0P = s.value(0);
  const prodP = s.value(0);
  const covP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const pairedBarP = s.value(0);
  const indepBarP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const seP = s.value(0);
  const margP = s.value(0);
  const v3P = s.value(0);
  const c3P = s.value(0);
  const signP = s.value(0);
  const negP = s.value(0);
  const resetP = s.value(0);
  const matchP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 10 }));
  s.add(decorAura(-380, 30, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(380, 30, 480, '#ff6b8b18', '#07091000'));

  const headline = heroTitle(['Why Pairing Cuts', 'Variance by 5×'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'SHARED-TASK COVARIANCE  ·  PAIRED VS INDEPENDENT',
  });

  const vm = jointDifferenceMoments(0.45, 40);
  const outcomes100 = vm.rows.flatMap((r, idx) => Array(Math.round(r.p * 100)).fill({ ...r, idx }));

  // View 0 (Beat 0): 100-square population lattice -> isolate joint passes -> Cov = 0.20
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const pr = prodP.value;
      const cv = covP.value;
      const palette = [ROLE.modelB, ROLE.danger, ROLE.lift, ROLE.modelA];
      const names = ['Both pass (A·B = 1)', 'Only A passes', 'Only B passes', 'Both fail'];
      const nodes = [];

      // 10x10 lattice on left
      for (let i = 0; i < 100; i++) {
        const item = outcomes100[i];
        const cx = -760 + (i % 10) * 52;
        const cy = -185 + Math.floor(i / 10) * 52;
        const isJoint = item.a * item.b === 1;
        const col = palette[item.idx];
        const dimOut = pr > 0.2 && !isJoint;
        nodes.push(
          rect(40, 40, { fill: col, stroke: null, radius: 6 })
            .at(cx, cy)
            .opacity(dimOut ? mix(0.85, 0.14, pr) : 0.9)
            .glow(isJoint && pr > 0.3 ? 8 : 0, col),
        );
      }

      // Legend on right
      vm.rows.forEach((r, i) => {
        const y = -165 + i * 94;
        nodes.push(
          rect(28, 28, { fill: palette[i], stroke: null, radius: 6 }).at(-100, y),
          txt(names[i], -62, y, 30, palette[i], 'sans', 'left'),
          txt(`${Math.round(r.p * 100)}%`, 640, y, 34, palette[i], 'mono', 'right'),
        );
      });

      const preCov = fadeOut(cv);
      const postCov = fadeIn(cv);
      if (preCov > 0.02) {
        nodes.push(
          txt(
            'Each assistant passes 50%  ·  marginal variance = 0.25',
            260,
            265,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(preCov),
        );
      }
      if (postCov > 0.02) {
        nodes.push(
          glowTex('\\mathrm{Cov}(A, B) = E[AB] - E[A]E[B] = 0.45 - 0.25 = 0.20', {
            x: 240,
            y: 265,
            size: 36,
            color: ROLE.lift,
          }).opacity(postCov),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Paired 0.0025 vs Independent 0.0125 variance towers
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const pb = smooth(pairedBarP.value);
      const ib = smooth(indepBarP.value);
      const baseY = 230;
      const maxH = 310;
      const hPaired = (vm.paired / 0.014) * maxH * pb;
      const hIndep = (vm.independent / 0.014) * maxH * ib;

      const nodes = [
        glowTex('\\mathrm{Var}(\\bar{B} - \\bar{A}) = \\frac{0.25 + 0.25 - 2(0.20)}{40}', {
          x: 0,
          y: -185,
          size: 46,
          color: ROLE.lift,
        }),
        line([-520, baseY], [520, baseY], { stroke: '#4d6499', width: 2.8 }),
        // Paired bar
        hPaired > 2
          ? glowCol(-240, baseY, 180, hPaired, ROLE.lift, { glow: 12, radius: 10 })
          : rect(180, 8, { fill: '#182440', stroke: null, radius: 4 }).at(-240, baseY - 4),
        txt('Paired (40 tasks)', -240, baseY + 42, 28, ROLE.lift, 'mono'),
        txt(
          pb > 0.85 ? '0.0025' : 'pending',
          -240,
          baseY - Math.max(54, hPaired + 48),
          36,
          ROLE.lift,
          'mono',
        ),
        // Independent bar (5x taller!)
        hIndep > 2
          ? glowCol(240, baseY, 180, hIndep, ROLE.danger, { glow: 12, radius: 10 })
          : rect(180, 8, { fill: '#182440', stroke: null, radius: 4 }).at(240, baseY - 4),
        txt('Independent (40 each)', 240, baseY + 42, 28, ROLE.danger, 'mono'),
        txt(
          ib > 0.85 ? '0.0125  (5× taller)' : 'pending',
          240,
          baseY - Math.max(54, hIndep + 48),
          34,
          ROLE.danger,
          'mono',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Standard errors & 1.96*SE reference margins (±9.8 pp vs ±21.9 pp)
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const se = seP.value;
      const mg = smooth(margP.value);
      const xOf = (v) => (v / 0.28) * 680;
      const axisY = 175;
      const pMarg = 1.96 * vm.pairedSE * mg;
      const iMarg = 1.96 * vm.independentSE * mg;

      const nodes = [
        txt('REFERENCE MARGINS AROUND ZERO EFFECT  (1.96 × SE)', 0, -220, 28, COSMOS.muted, 'mono'),
        markDecor(line([0, -155], [0, axisY], { stroke: '#586d99', width: 2.4, dash: [8, 8] })),
        line([-680, axisY], [680, axisY], { stroke: '#4d6499', width: 3 }),
      ];

      for (const t of [-0.2, -0.1, 0, 0.1, 0.2]) {
        const tx = xOf(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#6c84ba', width: 2.2 }),
          txt(
            `${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(Math.round(t * 100))}`,
            tx,
            axisY + 42,
            26,
            COSMOS.muted,
            'mono',
          ),
        );
      }

      // Paired SE / margin bar (top track)
      const py = -75;
      nodes.push(
        txt(
          se > 0.4 ? 'Paired SE = 5.0 pp' : 'Paired SE = √0.0025',
          0,
          py - 50,
          30,
          ROLE.lift,
          'mono',
        ),
        glowDot(0, py, { radius: 9, color: ROLE.lift, glow: 12 }),
      );
      if (mg > 0.04) {
        nodes.push(
          line([xOf(-pMarg), py], [xOf(pMarg), py], { stroke: ROLE.lift, width: 8 }).glow(
            10,
            ROLE.lift,
          ),
          line([xOf(-pMarg), py - 20], [xOf(-pMarg), py + 20], { stroke: ROLE.lift, width: 4 }),
          line([xOf(pMarg), py - 20], [xOf(pMarg), py + 20], { stroke: ROLE.lift, width: 4 }),
        );
      }

      // Independent SE / margin bar (lower track)
      const iy = 65;
      nodes.push(
        txt(
          se > 0.4 ? 'Independent SE = 11.2 pp' : 'Independent SE = √0.0125',
          0,
          iy - 50,
          30,
          ROLE.danger,
          'mono',
        ),
        glowDot(0, iy, { radius: 9, color: ROLE.danger, glow: 12 }),
      );
      if (mg > 0.04) {
        nodes.push(
          line([xOf(-iMarg), iy], [xOf(iMarg), iy], { stroke: ROLE.danger, width: 8 }).glow(
            10,
            ROLE.danger,
          ),
          line([xOf(-iMarg), iy - 20], [xOf(-iMarg), iy + 20], { stroke: ROLE.danger, width: 4 }),
          line([xOf(iMarg), iy - 20], [xOf(iMarg), iy + 20], { stroke: ROLE.danger, width: 4 }),
        );
      }

      nodes.push(
        txt(
          mg > 0.85
            ? 'Pairing shrinks 95% reference margin from ±21.9 pp down to ±9.8 pp'
            : 'Square root converts variance back into percentage points',
          0,
          325,
          32,
          mg > 0.85 ? ROLE.threshold : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): Covariance sweep (-0.20..+0.20) + independent N scaling 40 -> 200
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const sg = smooth(signP.value);
      const ng = smooth(negP.value);
      const rs = smooth(resetP.value);
      const mt = smooth(matchP.value);

      // Bead glides: +0.20 -> 0.00 (signP) -> -0.15 (negP) -> +0.20 (resetP)
      let covNow = mix(0.2, 0, sg);
      covNow = mix(covNow, -0.15, ng);
      covNow = mix(covNow, 0.2, rs);
      const pairedVar = (0.5 - 2 * covNow) / 40;
      const nIndep = Math.round(mix(40, 200, mt));
      const indepVar = 0.5 / nIndep;

      const ax = makeAxes({
        x0: -700,
        y0: -185,
        w: 1400,
        h: 375,
        xDom: [-0.2, 0.2],
        yDom: [0, 0.025],
        xTicks: [-0.2, -0.1, 0, 0.1, 0.2],
        yTicks: [0, 0.0125, 0.025],
        xLabel: 'Population covariance Cov(A, B)',
        yLabel: 'Mean-difference variance',
        yFmt: (v) => (v === 0 ? '0' : v.toFixed(4)),
      });

      const pairedPts = sampleCurve(ax, (cv) => (0.5 - 2 * cv) / 40, -0.2, 0.2, 50);
      const yInd = ax.py(indepVar);
      const bead = ax.pt(covNow, pairedVar);

      const nodes = [
        ax.node,
        neonCurve(pairedPts, [ROLE.danger, ROLE.lift], { width: 4.5, glow: 10 }),
        line([ax.px(-0.2), yInd], [ax.px(0.2), yInd], { stroke: ROLE.danger, width: 3.6 }).glow(
          8,
          ROLE.danger,
        ),
        // Legend cleanly positioned above the plot box with wide horizontal separation
        txt(`Independent: ${nIndep} / model`, -120, -215, 26, ROLE.danger, 'mono', 'left'),
        txt('Paired: 40 tasks', 700, -215, 26, ROLE.lift, 'mono', 'right'),
        glowDot(bead[0], bead[1], { radius: 12, color: ROLE.threshold, glow: 16 }),
      ];

      const status =
        mt > 0.85
          ? 'At Cov = +0.20: 200 independent tasks per model just match 40 pairs'
          : ng > 0.5 && rs < 0.3
            ? `Cov = ${covNow.toFixed(2)}  ·  negative covariance makes pairing noisier`
            : `Cov = ${covNow.toFixed(2)}  →  paired variance ${pairedVar.toFixed(4)}`;
      nodes.push(txt(status, 0, 345, 32, mt > 0.85 ? ROLE.threshold : ROLE.lift, 'mono'));

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2, view3);
  cueTo(s, c, 'variance-construction-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'variance-product', prodP, 1, { dur: 0.75 });
  cueTo(s, c, 'hyp-variance-covariance', covP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'variance-construction-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-variance-paired-result', pairedBarP, 1, { dur: 0.85 });
  cueTo(s, c, 'hyp-variance-independent-result', indepBarP, 1, { after: true, dur: 0.85 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'variance-construction-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-variance-standard-errors', seP, 1, { dur: 0.65 });
  cueTo(s, c, 'hyp-variance-margins', margP, 1, { after: true, dur: 0.85 });
  beatTo(s, c, 3, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'variance-construction-3', c3P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-variance-sign', signP, 1, { dur: 1.0 });
  cueTo(s, c, 'variance-negative', negP, 1, { after: true, dur: 0.9 });
  cueTo(s, c, 'variance-reset', resetP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'hyp-variance-match', matchP, 1, { after: true, dur: 1.2 });
}
