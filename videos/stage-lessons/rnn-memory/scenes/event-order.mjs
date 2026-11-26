// Scene 4: event-order: "When did the error arrive?"
// View 1: Discounted energy-bar pipelines comparing original vs reversed event order
//         (strictly withholding reversed results until reverse-0/1/2).
// View 2: Nonlinear scalar tanh cell trajectory bounded inside (-1, +1).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  EVENTS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  inputs,
  lumBar,
  playCue,
  scalar,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function eventOrder(s, c) {
  const title = heroTitle(['When did the', 'error arrive?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.input,
  });

  const vOrder = s.value(1);
  const vScalar = s.value(0);

  // View 1 state
  const fwdStep = s.value(0); // 0 -> 1 -> 2 -> 3
  const decayGuideVis = s.value(1);
  const revHead = s.value(0);
  const showQ = s.value(0);
  const revStep = s.value(0); // 0 -> 1 -> 2 -> 3
  const showSum = s.value(0);

  // View 2 state
  const scStep = s.value(0); // 0 -> 1 -> 2 -> 3
  const showSub = s.value(0);

  const eventCols = [ROLE.input, ROLE.grad, ROLE.cell];
  const colXs = [-385, 85, 555];
  const barMaxW = 350;

  function drawLedgerTrack(order, trace, baseY, revealedCount, headerAlpha, alpha) {
    const nodes = [];
    if (headerAlpha < 0.02) return nodes;
    order.forEach((evIdx, t) => {
      const cx = colXs[t];
      const col = eventCols[evIdx];
      nodes.push(
        tokenPill(`${EVENTS[evIdx]}  ${inputs[evIdx].toFixed(1)}`, cx, baseY - 68, col, {
          w: 270,
          h: 50,
          size: 27,
          opacity: headerAlpha * alpha,
        }),
      );
      if (t < revealedCount) {
        const left = cx - barMaxW / 2;
        const scale = barMaxW / 1.65;
        let cursor = left;
        order.slice(0, t + 1).forEach((e, k) => {
          const contrib = inputs[e] * 0.6 ** (t - k);
          const w = Math.max(10, contrib * scale);
          nodes.push(
            lumBar(cursor + w / 2, baseY, w - 4, 42, {
              color: eventCols[e],
              fillOpacity: 0.45,
              strokeWidth: 2.2,
              glow: 8,
              radius: 6,
              opacity: alpha,
            }),
          );
          cursor += w;
        });
        const isFinal = t === 2;
        nodes.push(
          txt(
            fmt(trace[t + 1], 3),
            cx,
            baseY + 52,
            isFinal ? 40 : 32,
            isFinal ? ROLE.gold : COSMOS.ink,
            'mono',
            'center',
          )
            .glow(isFinal ? 8 : 0, ROLE.gold)
            .opacity(alpha),
        );
      }
    });
    return nodes;
  }

  const orderView = guardedDynamic(vOrder, (alpha) => {
    const nodes = [
      glowTex('s_t = 0.6\\,s_{t-1} + x_t', {
        x: 470,
        y: -395,
        size: 42,
        color: ROLE.gold,
        glow: 7,
      }).opacity(alpha),
      txt('Original order', -850, -155, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      ...drawLedgerTrack([0, 1, 2], MODEL.discount, -155, Math.round(fwdStep.value), 1, alpha),
    ];

    if (decayGuideVis.value > 0.02) {
      const gA = decayGuideVis.value * alpha;
      const weights = [
        { label: 'step 1: ×0.6² = 0.36', w: 0.36, col: ROLE.input, x: colXs[0] },
        { label: 'step 2: ×0.6¹ = 0.60', w: 0.6, col: ROLE.grad, x: colXs[1] },
        { label: 'step 3: ×0.6⁰ = 1.00', w: 1.0, col: ROLE.cell, x: colXs[2] },
      ];
      nodes.push(
        txt(
          'Discount survival schedule (0.6 per handoff)',
          -850,
          95,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(gA),
      );
      weights.forEach(({ label, w, col, x }) => {
        const bw = w * 310;
        nodes.push(
          lumBar(x, 165, bw, 40, { color: col, fillOpacity: 0.38, glow: 8, opacity: gA }),
          txt(label, x, 228, 26, col, 'mono', 'center').opacity(gA),
        );
      });
    }

    if (revHead.value > 0.02) {
      nodes.push(
        txt('Reversed order', -850, 115, 28, ROLE.gold, 'mono', 'left').opacity(
          revHead.value * alpha,
        ),
        ...drawLedgerTrack(
          [2, 1, 0],
          MODEL.reverseDiscount,
          115,
          Math.round(revStep.value),
          revHead.value,
          alpha,
        ),
      );
    }

    if (showQ.value > 0.02 && showSum.value < 0.02) {
      nodes.push(
        txt(
          'Same three signals. Which order gives the larger final state?',
          0,
          365,
          34,
          ROLE.gold,
          'serif',
          'center',
        ).opacity(showQ.value * alpha),
      );
    }
    if (showSum.value > 0.02) {
      nodes.push(
        txt(
          'Raw sum = 2.3 in either order     |     Discounted: 1.564 > 1.500',
          0,
          365,
          32,
          ROLE.state,
          'mono',
          'center',
        ).opacity(showSum.value * alpha),
      );
    }
    return nodes;
  });

  // View 2: Scalar tanh cell trace bounded inside (-1, +1)
  const scXs = [-600, -200, 200, 600];
  const scBaseY = 175;
  const scTopY = -125;
  const scPt = (i, h) => [scXs[i], scBaseY - h * (scBaseY - scTopY)];

  const scalarView = guardedDynamic(vScalar, (alpha) => {
    const cur = scStep.value;
    const nodes = [
      glowTex('h_t = \\tanh(0.8\\,x_t + 0.5\\,h_{t-1})', {
        x: 410,
        y: -395,
        size: 40,
        color: ROLE.gold,
        glow: 7,
      }).opacity(alpha),
      // Bounded ceiling +1 and floor 0 rails
      line([scXs[0] - 80, scTopY], [scXs[3] + 80, scTopY], {
        stroke: '#556894',
        width: 2,
        dash: [10, 8],
      }).opacity(0.75 * alpha),
      txt('+1.0', scXs[0] - 102, scTopY, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      line([scXs[0] - 80, scBaseY], [scXs[3] + 80, scBaseY], {
        stroke: '#556894',
        width: 3,
      }).opacity(alpha),
      txt('0.0', scXs[0] - 102, scBaseY, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      txt('start', scXs[0], -230, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    ];

    EVENTS.forEach((ev, idx) => {
      nodes.push(
        tokenPill(`${ev}  ${inputs[idx].toFixed(1)}`, scXs[idx + 1], -230, eventCols[idx], {
          w: 256,
          h: 52,
          size: 27,
          opacity: alpha,
        }),
      );
    });

    // Build progressive glowing trail
    const pts = [scPt(0, scalar[0])];
    const whole = Math.min(3, Math.floor(cur));
    const frac = cur - whole;
    for (let k = 1; k <= whole; k++) pts.push(scPt(k, scalar[k]));
    if (whole < 3 && frac > 0.01) {
      const a = scPt(whole, scalar[whole]);
      const b = scPt(whole + 1, scalar[whole + 1]);
      pts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
    }
    if (pts.length >= 2) {
      nodes.push(glowingTrail(pts, { color: ROLE.state, width: 6, glow: 12, opacity: alpha }));
    }
    for (let k = 0; k <= whole; k++) {
      const p = scPt(k, scalar[k]);
      nodes.push(
        glowDot(p[0], p[1], {
          radius: 8.5,
          color: k === 3 ? ROLE.gold : ROLE.state,
          glow: 12,
          opacity: alpha,
        }),
      );
      if (k > 0) {
        nodes.push(
          txt(
            fmt(scalar[k], 3),
            p[0],
            p[1] - 42,
            34,
            k === 3 ? ROLE.gold : ROLE.state,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    }

    if (showSub.value > 0.02) {
      nodes.push(
        glowTex('\\tanh(0.8 \\times 0.4 + 0.5 \\times 0.664) \\approx 0.573', {
          x: 0,
          y: 345,
          size: 38,
          color: ROLE.state,
          glow: 6,
        }).opacity(showSub.value * alpha),
      );
    }
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.input, ROLE.state), title, orderView, scalarView);

  playCue(s, c, 'error-arrives', (d) => s.play(fwdStep.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reproduction-arrives', (d) => s.play(fwdStep.to(2, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'rollback-arrives', (d) => s.play(fwdStep.to(3, { duration: d })), { dur: 0.4 });

  playCue(s, c, 'reverse-order', (d) => s.play(swapVis(decayGuideVis, revHead, d)), { dur: 0.6 });
  playCue(s, c, 'event-order-1', (d) => s.play(showQ.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'reverse-0', (d) => s.play(revStep.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reverse-1', (d) => s.play(revStep.to(2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reverse-2', (d) => s.play(revStep.to(3, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'order-sum',
    (d) => s.play(showQ.to(0, { duration: d * 0.4 }), showSum.to(1, { duration: d * 0.6 })),
    { dur: 0.55 },
  );

  playCue(s, c, 'event-order-2', (d) => s.play(swapVis(vOrder, vScalar, d)), { dur: 0.65 });
  playCue(s, c, 'scalar-first', (d) => s.play(scStep.to(1, { duration: d })), { dur: 0.6 });
  playCue(
    s,
    c,
    'scalar-second',
    (d) => s.play(scStep.to(2, { duration: d }), showSub.to(1, { duration: d })),
    { dur: 0.65 },
  );
  playCue(s, c, 'scalar-third', (d) => s.play(scStep.to(3, { duration: d })), { dur: 0.65 });
}
