// Scene 8: actual-credit: "Trace a change backward through the incident"
// View 1: Forward scalar states above attenuating rose BPTT arches and a decaying gold
//         sensitivity wave (1.000000 -> 0.207910 -> 0.069820 -> 0.019517).
// View 2: All 3 uses of shared weight W_h funneling tributaries into one total gradient (0.331003).
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  EVENTS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowArc,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  scalar,
  swapVis,
  txt,
} from '../parts.mjs';

export default function actualCredit(s, c) {
  const title = heroTitle(['Trace a change backward', 'through the incident'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grad,
  });

  const vSense = s.value(1);
  const vWeight = s.value(0);

  // View 1 state
  const showFactors = s.value(0);
  const backSteps = s.value(0); // 0 = none, 1 = unit at h3, 2 = crossed link 2, 3 = crossed link 1, 4 = crossed link 0

  // View 2 state
  const showTerms = s.value(0);
  const showTotal = s.value(0);

  const xs = [-615, -205, 205, 615];
  const names = ['start', ...EVENTS];
  const sens = [...MODEL.sensitivities].reverse(); // [0.019517, 0.069820, 0.207910, 1.000000]

  // Shared top forward timeline (always visible across both views)
  const topY = -175;
  const forwardNodes = [];
  names.forEach((name, i) => {
    forwardNodes.push(
      txt(name, xs[i], topY - 94, 28, COSMOS.muted, 'sans', 'center'),
      glowRing(xs[i], topY, 66, ROLE.state, { width: 3, glow: 8 }),
      txt(fmt(scalar[i], 3), xs[i], topY, 30, ROLE.state, 'mono', 'center'),
    );
    if (i < 3) {
      forwardNodes.push(
        arrow([xs[i] + 76, topY], [xs[i + 1] - 76, topY], {
          stroke: '#4e6396',
          width: 3,
          tip: 12,
        }),
      );
    }
  });

  // VIEW 1: Backward derivative arches & decaying sensitivity bars
  const senseView = guardedDynamic(vSense, (alpha) => {
    const nodes = [
      glowTex('\\frac{\\partial h_t}{\\partial h_{t-1}} = 0.5\\,(1 - h_t^2)', {
        x: 470,
        y: -395,
        size: 38,
        color: ROLE.grad,
        glow: 7,
      }).opacity(alpha),
    ];

    const bs = backSteps.value;

    // 3 backward links (index 2 = rollback, 1 = repro, 0 = error)
    MODEL.factors.forEach((factor, i) => {
      const mx = (xs[i] + xs[i + 1]) / 2;
      const crossed = bs >= 4 - i - 0.15;
      if (showFactors.value > 0.02) {
        nodes.push(
          txt(
            `× ${fmt(factor, 6)}`,
            mx,
            -25,
            28,
            crossed ? ROLE.grad : COSMOS.muted,
            'mono',
            'center',
          ).opacity(showFactors.value * alpha),
        );
      }
      if (crossed) {
        const thickness = 2.6 + i * 1.4;
        nodes.push(
          glowArc([xs[i + 1] - 32, 32], [xs[i] + 32, 32], -46, {
            color: ROLE.grad,
            width: thickness,
            glow: 9,
            opacity: alpha,
          }),
          glowDot(xs[i] + 32, 32, { radius: 6, color: ROLE.grad, glow: 10, opacity: alpha }),
        );
      }
    });

    // Sensitivity meter track + bars & numeric readouts below each step
    const barBaseY = 275;
    const barMaxH = 160;
    nodes.push(
      line([xs[0] - 85, barBaseY], [xs[3] + 85, barBaseY], {
        stroke: '#3c4d73',
        width: 2.5,
      }).opacity(alpha),
      txt('Backward sensitivity  ∂h₃ / ∂hₜ', 0, 92, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );
    for (let i = 0; i < 4; i++) {
      const threshold = 4 - i; // i=3 -> 1, i=2 -> 2, i=1 -> 3, i=0 -> 4
      if (bs >= threshold - 0.15) {
        const val = sens[i];
        const h = Math.max(10, val * barMaxH);
        const col = i === 0 ? ROLE.warn : ROLE.gold;
        nodes.push(
          lumBar(xs[i], barBaseY - h / 2, 74, h, {
            color: col,
            fillOpacity: 0.42,
            glow: 10,
            opacity: alpha,
          }),
          txt(fmt(val, 6), xs[i], barBaseY + 40, 34, col, 'mono', 'center')
            .glow(i === 0 ? 8 : 4, col)
            .opacity(alpha),
        );
      } else {
        nodes.push(
          lumBar(xs[i], barBaseY - barMaxH / 2, 74, barMaxH, {
            color: '#3c4d73',
            fillOpacity: 0.08,
            strokeWidth: 1.8,
            glow: 0,
            dash: [7, 7],
            opacity: 0.7 * alpha,
          }),
        );
      }
    }

    if (bs >= 1) {
      nodes.push(
        txt(
          bs >= 3.8
            ? 'Less than 2% of a final-state nudge reaches the initial state'
            : 'Unit sensitivity (1.0) travels leftward across each local derivative',
          0,
          380,
          30,
          bs >= 3.8 ? ROLE.warn : COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Shared weight W_h gradient accumulation across all 3 time steps
  const weightView = guardedDynamic(vWeight, (alpha) => {
    const nodes = [
      glowTex('\\frac{\\partial h_3}{\\partial w_h} = \\sum_{t=1}^{3} \\text{term}_t', {
        x: 470,
        y: -395,
        size: 38,
        color: ROLE.gold,
        glow: 7,
      }).opacity(alpha),
    ];

    const hubX = 0;
    const hubY = 295;
    nodes.push(
      glowRing(hubX, hubY, 72, ROLE.gold, { width: 3.4, glow: 12, opacity: alpha }),
      txt('Wₕ', hubX, hubY - 12, 34, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('shared', hubX, hubY + 26, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
    );

    if (showTerms.value > 0.02) {
      const tA = showTerms.value * alpha;
      MODEL.weightTerms.forEach((term, i) => {
        const sx = xs[i + 1];
        const col = i === 0 ? COSMOS.muted : i === 1 ? ROLE.grad : ROLE.gold;
        const barW = Math.max(18, (term / 0.25) * 180);
        nodes.push(
          lumBar(sx, 35, barW, 44, {
            color: col,
            fillOpacity: 0.36,
            glow: i === 0 ? 2 : 9,
            opacity: tA,
          }),
          txt(fmt(term, 6), sx, 94, 34, col, 'mono', 'center').opacity(tA),
          glowArc([sx, 124], [hubX + (i - 1) * 58, hubY - 68], 30, {
            color: col,
            width: 2.4 + i * 1.4,
            glow: 8,
            opacity: 0.85 * tA,
          }),
        );
      });
    }

    if (showTotal.value > 0.02) {
      const totA = showTotal.value * alpha;
      nodes.push(
        txt(
          `Shared weight gradient = ${fmt(MODEL.weightGradient, 6)}`,
          445,
          295,
          36,
          ROLE.gold,
          'mono',
          'center',
        )
          .glow(10, ROLE.gold)
          .opacity(totA),
        txt(
          'Recent steps dominate Wₕ gradient',
          -445,
          295,
          28,
          ROLE.grad,
          'sans',
          'center',
        ).opacity(totA),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.grad, ROLE.gold), title, ...forwardNodes, senseView, weightView);

  playCue(s, c, 'credit-factors', (d) => s.play(showFactors.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'actual-credit-1', (d) => s.play(backSteps.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'credit-last', (d) => s.play(backSteps.to(2, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'credit-second', (d) => s.play(backSteps.to(3, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'credit-all', (d) => s.play(backSteps.to(4, { duration: d })), { dur: 0.55 });

  playCue(s, c, 'actual-credit-2', (d) => s.play(swapVis(vSense, vWeight, d)), { dur: 0.65 });
  playCue(s, c, 'credit-weight-sum', (d) => s.play(showTerms.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'credit-weight-total', (d) => s.play(showTotal.to(1, { duration: d })), {
    dur: 0.5,
  });
}
