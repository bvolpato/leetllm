// Scene 8: optimum: "What would make you change plans?"
// Consistent two-column layout continuing directly from tradeoff:
//   Beat 0: Strictly AFTER optimum-square, reveals Square (10x10) as lowest loss (2.265 vs 2.342).
//   Beat 1: Shifts data coefficient b: 2 -> 4 while hiding totals during the 3.0s prediction hold.
//   Beat 2: Strictly AFTER optimum-tall, reveals Tall (5x20) winning (2.789 vs 2.897), then shifts
//           the active hyperbola corner back to 5x20 at optimum-shift.
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
  cinemaAtmosphere,
  fmt,
  isoRect,
  loss,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
} from '../parts.mjs';

const PLANS = [
  { name: 'Tall', n: 5, d: 20 },
  { name: 'Square', n: 10, d: 10 },
];

export default function optimumScene(s, c) {
  const title = heroTitle(['What would make you', 'change plans?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.optimal,
  });

  const revealFirst = s.value(0); // AFTER optimum-square
  const coeffT = s.value(0); // optimum-coefficient: b grows 2 -> 4
  const hideForQuiz = s.value(0); // 1 during coefficient shift & 3s hold, back to 0 after optimum-tall
  const revealSecond = s.value(0); // AFTER optimum-tall
  const shiftBack = s.value(0); // optimum-shift: N slides 10 -> 5

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const r1 = revealFirst.value;
    const ct = coeffT.value;
    const hq = hideForQuiz.value;
    const r2 = revealSecond.value;
    const sb = shiftBack.value;

    const bVal = 2 + 2 * ct;
    const nVal = 10 - 5 * sb;
    const dVal = 100 / nVal;

    const showTotals = ct > 0.04 ? r2 : r1;
    const winnerIndex = r2 > 0.5 ? 0 : r1 > 0.5 && hq < 0.5 ? 1 : -1;

    // Left: Fixed-budget curve & active rectangle
    const plane = plotPlane({
      left: -775,
      right: -175,
      top: -215,
      bottom: 260,
      xDomain: [0, 22],
      yDomain: [0, 22],
      xTicks: [5, 10, 20],
      yTicks: [5, 10, 20],
      xLabel: 'Parameter units N',
      yLabel: 'Token units D',
      opacity: alpha,
    });
    nodes.push(plane.node);

    nodes.push(
      isoRect(plane, nVal, dVal, {
        color: winnerIndex === 0 ? ROLE.optimal : ROLE.params,
        fillOpacity: 0.24,
        strokeWidth: 2.8,
        glow: 10,
        opacity: alpha,
      }),
    );

    const pts = sampleCurve(plane, (x) => 100 / x, 100 / 21.8, 21.8, 72);
    nodes.push(glowingTrail(pts, { color: ROLE.tokens, width: 4.2, glow: 10, opacity: alpha }));

    for (const pl of PLANS) {
      const [px, py] = plane.toScreen(pl.n, pl.d);
      nodes.push(
        glowDot(px, py, { radius: 7, color: COSMOS.muted, glow: 4, opacity: 0.8 * alpha }),
      );
    }

    const [ax, ay] = plane.toScreen(nVal, dVal);
    nodes.push(
      glowDot(ax, ay, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }),
      txt('N × D = 100', -175, -253, 30, ROLE.tokens, 'mono', 'right')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    // Right: Stacked penalty bars (max sum at b=4 is 1.897, scale 290 -> 550px width)
    const barLeft = 65;
    const scale = 290;

    nodes.push(
      txt(
        `Fitted loss = 1 + 2/√N + ${fmt(bVal, 1)}/√D`,
        barLeft,
        -210,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt('2 / √N', barLeft, -150, 30, ROLE.params, 'mono', 'left')
        .glow(5, ROLE.params)
        .opacity(alpha),
      txt(
        `${fmt(bVal, 1)} / √D`,
        barLeft + 245,
        -150,
        30,
        ct > 0.1 ? ROLE.compute : ROLE.tokens,
        'mono',
        'left',
      )
        .glow(6, ct > 0.1 ? ROLE.compute : ROLE.tokens)
        .opacity(alpha),
    );

    PLANS.forEach((plan, i) => {
      const rowY = -10 + i * 215;
      const isWin = winnerIndex === i;
      const pN = 2 / Math.sqrt(plan.n);
      const pD = bVal / Math.sqrt(plan.d);
      const wN = pN * scale;
      const wD = pD * scale;
      const tot = loss(plan.n, plan.d, 2, bVal);

      nodes.push(
        txt(
          `${plan.name}   ${plan.n} × ${plan.d}${isWin ? '   ★' : ''}`,
          barLeft,
          rowY - 68,
          34,
          isWin ? ROLE.optimal : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(isWin ? 8 : 0, ROLE.optimal)
          .opacity(alpha),
        lumBar(barLeft + wN / 2, rowY, wN - 4, 74, {
          color: ROLE.params,
          fillOpacity: isWin ? 0.54 : 0.36,
          strokeWidth: isWin ? 3 : 2.2,
          glow: isWin ? 12 : 6,
          opacity: alpha,
        }),
        txt(fmt(pN, 3), barLeft + wN / 2, rowY, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        lumBar(barLeft + wN + wD / 2, rowY, wD - 4, 74, {
          color: ROLE.tokens,
          fillOpacity: isWin ? 0.54 : 0.36,
          strokeWidth: isWin ? 3 : 2.2,
          glow: isWin ? 12 : 6,
          opacity: alpha,
        }),
        txt(fmt(pD, 3), barLeft + wN + wD / 2, rowY, 26, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
      );

      if (showTotals > 0.5) {
        nodes.push(
          txt(fmt(tot, 3), 840, rowY, 36, isWin ? ROLE.optimal : COSMOS.ink, 'mono', 'right')
            .glow(isWin ? 10 : 4, isWin ? ROLE.optimal : COSMOS.ink)
            .opacity(showTotals * alpha),
        );
      } else {
        nodes.push(txt('?', 840, rowY, 40, COSMOS.dim, 'mono', 'right').opacity(alpha));
      }
    });

    if (showTotals > 0.5) {
      nodes.push(
        txt('Total loss', 840, -110, 26, COSMOS.muted, 'mono', 'right').opacity(showTotals * alpha),
      );
    }

    let footer = 'Which shape has the lower fitted loss?';
    let footerCol = ROLE.compute;
    if (r2 > 0.5) {
      footer = 'Tall 5 × 20 wins (2.789 < 2.897)  ·  both penalties match at 0.894';
      footerCol = ROLE.optimal;
    } else if (ct > 0.05) {
      footer = 'With B doubled from 2 to 4, which shape would you train?';
      footerCol = ROLE.compute;
    } else if (r1 > 0.5) {
      footer = 'Square 10 × 10 wins (2.265 < 2.342)  ·  equal penalties at 0.632';
      footerCol = ROLE.optimal;
    }

    nodes.push(
      txt(footer, 0, 395, 32, footerCol, 'sans', 'center').glow(7, footerCol).opacity(alpha),
    );

    return nodes;
  });

  const eq = glowTex('L = 1 + \\frac{2}{\\sqrt{N}} + \\frac{B}{\\sqrt{D}}', {
    x: 495,
    y: -365,
    size: 38,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.optimal, ROLE.params), title, stageLayer, eq);

  playCue(s, c, 'optimum-square', (d) => s.play(revealFirst.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'optimum-coefficient',
    (d) =>
      s.play(hideForQuiz.to(1, { duration: Math.min(0.25, d) }), coeffT.to(1, { duration: d })),
    { dur: 1.1 },
  );
  playCue(
    s,
    c,
    'optimum-tall',
    (d) =>
      s.play(
        hideForQuiz.to(0, { duration: Math.min(0.25, d) }),
        revealSecond.to(1, { duration: d }),
      ),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'optimum-shift', (d) => s.play(shiftBack.to(1, { duration: d })), { dur: 1.1 });
}
