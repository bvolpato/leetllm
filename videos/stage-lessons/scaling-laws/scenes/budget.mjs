// Scene 2: budget: "What does one square pay for?"
// Act 1 (Beats 0-1): Three luminous dense contraction beams (Forward, Input grad, Weight grad)
//   summing to 2N + 2N + 2N = 6N per token and C_train ≈ 6ND.
// Act 2 (Beat 2): Swaps cleanly to the glowing N x D = 100 iso-compute hyperbola reshaping
//   from 10 x 10 to 20 x 5.
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  budgetAllocationState,
  cinemaAtmosphere,
  fmt,
  isoRect,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  swapVis,
} from '../parts.mjs';

export default function budget(s, c) {
  const title = heroTitle(['What does one', 'square pay for?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.compute,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  const fwdFill = s.value(0);
  const inpFill = s.value(0);
  const wgtFill = s.value(0);
  const totalVis = s.value(0);
  const resizeT = s.value(0); // 0 -> 1 drives N: 10 -> 20, D: 10 -> 5

  // Act 1: Three glowing dense contraction beams
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const fills = [fwdFill.value, inpFill.value, wgtFill.value];
    const doneCount = fills.filter((v) => v > 0.95).length;
    const rows = [
      { label: 'Forward pass', sub: 'Y = X W', color: ROLE.params },
      { label: 'Input gradient', sub: 'dX = dY Wᵀ', color: ROLE.surface },
      { label: 'Weight gradient', sub: 'dW = Xᵀ dY', color: ROLE.tokens },
    ];

    const barLeft = -330;
    const barW = 760;
    const barH = 66;

    nodes.push(
      txt(
        'Dense linear projection  ·  multiply-add = 2 FLOPs per weight',
        -840,
        -250,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    rows.forEach((row, i) => {
      const cy = -140 + i * 135;
      const f = fills[i];
      nodes.push(
        txt(
          row.label,
          -840,
          cy - 12,
          32,
          f > 0.05 ? row.color : COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha),
        txt(row.sub, -840, cy + 28, 26, COSMOS.dim, 'mono', 'left').opacity(alpha),
        // Ghost track
        lumBar(barLeft + barW / 2, cy, barW, barH, {
          color: COSMOS.dim,
          fillOpacity: 0.08,
          strokeWidth: 1.6,
          glow: 0,
          opacity: 0.55 * alpha,
        }),
      );
      if (f > 0.02) {
        const w = Math.max(12, barW * f);
        nodes.push(
          lumBar(barLeft + w / 2, cy, w, barH, {
            color: row.color,
            fillOpacity: 0.44,
            strokeWidth: 2.8,
            glow: 11,
            opacity: alpha,
          }),
        );
      }
      if (f > 0.85) {
        const a = Math.min(1, (f - 0.85) / 0.15) * alpha;
        nodes.push(
          txt('2N / tok', barLeft + barW + 34, cy, 34, row.color, 'mono', 'left')
            .glow(7, row.color)
            .opacity(a),
        );
      }
    });

    // Progress tally until all 3 finish
    if (doneCount < 3) {
      nodes.push(
        txt(
          `${doneCount} / 3 dense matrix multiplications counted`,
          0,
          255,
          30,
          ROLE.compute,
          'mono',
          'center',
        ).opacity(alpha),
      );
    } else {
      nodes.push(
        txt('2N  +  2N  +  2N  =  6N FLOPs per token', 0, 248, 34, COSMOS.ink, 'mono', 'center')
          .glow(6, ROLE.tokens)
          .opacity(alpha),
      );
    }

    if (totalVis.value > 0.05) {
      nodes.push(
        txt(
          'Excludes attention, recomputation & memory traffic',
          0,
          410,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(totalVis.value * alpha),
      );
    }

    return nodes;
  });

  const eqTotal = glowTex('C_{\\mathrm{train}} \\approx (2N + 2N + 2N)D = 6ND', {
    x: 0,
    y: 340,
    size: 44,
    color: ROLE.compute,
  });

  // Act 2: Fixed product N x D = 100 hyperbola + resizing glowing rectangle
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const t = resizeT.value;
    // Mirror exact budgetAllocationState formula: N = 10 -> 20, D = 100 / N
    const st = budgetAllocationState({ beatP: (9.8 + (12.85 - 9.8) * t) / 15.944 });
    const nVal = st.n;
    const dVal = st.d;

    const plane = plotPlane({
      left: -760,
      right: 40,
      top: -230,
      bottom: 310,
      xDomain: [0, 24],
      yDomain: [0, 24],
      xTicks: [5, 10, 15, 20],
      yTicks: [5, 10, 15, 20],
      xLabel: 'Parameter units N',
      yLabel: 'Token units D',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Translucent resizing compute rectangle
    nodes.push(
      isoRect(plane, nVal, dVal, {
        color: ROLE.params,
        fillOpacity: 0.24,
        strokeWidth: 2.8,
        glow: 10,
        opacity: alpha,
      }),
    );

    // Fixed-budget hyperbola N * D = 100
    const pts = sampleCurve(plane, (x) => 100 / x, 100 / 23.5, 23.5, 80);
    nodes.push(glowingTrail(pts, { color: ROLE.tokens, width: 4.2, glow: 10, opacity: alpha }));

    // Reference anchor points (5,20), (10,10), (20,5)
    for (const [rn, rd] of [
      [5, 20],
      [10, 10],
      [20, 5],
    ]) {
      const [sx, sy] = plane.toScreen(rn, rd);
      nodes.push(
        glowDot(sx, sy, { radius: 6, color: COSMOS.muted, glow: 4, opacity: 0.75 * alpha }),
      );
    }

    // Active corner beacon
    const [ax, ay] = plane.toScreen(nVal, dVal);
    nodes.push(glowDot(ax, ay, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }));

    // Right-side floating readouts
    const rx = 210;
    nodes.push(
      txt('DIVIDE OUT THE FACTOR OF 6', rx, -230, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Parameter width N', rx, -135, 28, ROLE.params, 'sans', 'left').opacity(alpha),
      txt(fmt(nVal, 1), rx, -65, 76, ROLE.params, 'mono', 'left')
        .glow(10, ROLE.params)
        .opacity(alpha),
      txt('Token height D', rx, 60, 28, ROLE.tokens, 'sans', 'left').opacity(alpha),
      txt(fmt(dVal, 1), rx, 130, 76, ROLE.tokens, 'mono', 'left')
        .glow(10, ROLE.tokens)
        .opacity(alpha),
      txt('N × D = 100 squares', rx, 260, 38, ROLE.compute, 'mono', 'left')
        .glow(8, ROLE.compute)
        .opacity(alpha),
      txt('5×20  ·  10×10  ·  20×5', rx, 325, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.compute), title, act1Layer, act2Layer);

  playCue(s, c, 'budget-forward', (d) => s.play(fwdFill.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'budget-input', (d) => s.play(inpFill.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'budget-weight', (d) => s.play(wgtFill.to(1, { duration: d })), { dur: 0.75 });
  c.show('budget-total', eqTotal, { after: true });
  playCue(s, c, 'budget-total', (d) => s.play(totalVis.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  c.hide('budget-grid', eqTotal);
  playCue(s, c, 'budget-grid', (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'budget-resize', (d) => s.play(resizeT.to(1, { duration: d })), { dur: 1.6 });
}
