// Scene 17: data-cap: "Will the proposed tokens exist?"
// Fixed-budget iso-compute contour (5.88e23 FLOPs): unconstrained optimum (7.82B / 12.53T) ->
// 2T no-repeat ceiling snapping to 49B / 2T -> N <= 30B model-size cap.
// STRICT PREDICTION WITHHOLDING: During Beat 2's 2.6s hold, show both caps without revealing
// infeasibility until AFTER sl-data-cap-3!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  allocationOptimum,
  cinemaAtmosphere,
  fmt,
  isoRect,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
  surfaceLoss,
} from '../parts.mjs';

export default function dataCap(s, c) {
  const product = 70e9 * 1.4e12;
  const opt = allocationOptimum(product, 2.8, 7.8, 0.07, 0.098);
  const optNB = opt.n / 1e9; // 7.82
  const optDT = opt.d / 1e12; // 12.53

  const title = heroTitle(['Will the proposed', 'tokens exist?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.cap,
  });

  const toOptT = s.value(0); // sl-data-cap-0: 70B -> 7.82B
  const capDVis = s.value(0); // sl-data-cap-1: show D <= 2T ceiling
  const toCapT = s.value(0); // sl-data-cap-1: 7.82B -> 49B
  const capNVis = s.value(0); // sl-data-cap-2: show N <= 30B limit (prediction hold!)
  const revealInfeas = s.value(0); // AFTER sl-data-cap-3
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const t0 = toOptT.value;
    const cd = capDVis.value;
    const t1 = toCapT.value;
    const cn = capNVis.value;
    const inf = revealInfeas.value;

    const plane = plotPlane({
      left: -760,
      right: 540,
      top: -215,
      bottom: 245,
      xDomain: [0, 72],
      yDomain: [0, 15.5],
      xTicks: [10, 30, 50, 70].map((v) => ({ v, label: `${v}B` })),
      yTicks: [2, 6, 10, 14].map((v) => ({ v, label: `${v}T` })),
      xLabel: 'Parameters N (billions)',
      yLabel: 'Tokens D (trillions)',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Feasible box when both caps are active
    if (cn > 0.05) {
      nodes.push(
        isoRect(plane, 30, 2, {
          color: inf > 0.5 ? ROLE.cap : ROLE.params,
          fillOpacity: 0.28,
          strokeWidth: 2.5,
          glow: 8,
          opacity: cn * alpha,
        }),
      );
    }

    // Fixed-budget hyperbola C = 5.88e23 (N * D = 98e21)
    const pts = sampleCurve(plane, (nB) => 98 / nB, 98 / 15.2, 71, 84);
    nodes.push(
      glowingTrail(pts, { color: ROLE.tokens, width: 4.5, glow: 11, opacity: alpha }),
      txt('5.88 × 10²³ FLOPs contour', 850, -370, 28, ROLE.tokens, 'mono', 'right')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    // Unconstrained optimum ghost
    const [ox, oy] = plane.toScreen(optNB, optDT);
    nodes.push(glowDot(ox, oy, { radius: 8, color: COSMOS.muted, glow: 5, opacity: 0.8 * alpha }));

    // Active gliding beacon: 70 -> 7.82 -> 49
    const curN = t1 > 0.01 ? optNB + (49 - optNB) * t1 : 70 + (optNB - 70) * t0;
    const curD = 98 / curN;
    const [bx, by] = plane.toScreen(curN, curD);
    nodes.push(glowDot(bx, by, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }));

    // D_max = 2T ceiling line
    if (cd > 0.02) {
      const wallY = plane.toY(2);
      nodes.push(
        line([plane.bounds.left, wallY], [plane.bounds.right, wallY], {
          stroke: ROLE.cap,
          width: 3.6,
        }).opacity(cd * alpha),
        txt('D max = 2T (no repeats)', plane.bounds.right + 18, wallY, 26, ROLE.cap, 'mono', 'left')
          .glow(6, ROLE.cap)
          .opacity(cd * alpha),
      );
    }

    // N_max = 30B memory wall
    if (cn > 0.02) {
      const wallX = plane.toX(30);
      nodes.push(
        line([wallX, plane.bounds.top], [wallX, plane.bounds.bottom], {
          stroke: ROLE.params,
          width: 3.6,
        }).opacity(cn * alpha),
        txt('N max = 30B', wallX, plane.bounds.top - 32, 26, ROLE.params, 'mono', 'center')
          .glow(6, ROLE.params)
          .opacity(cn * alpha),
      );
    }

    // Live readout panel floating cleanly in open dark space above top-right
    const lossNow = surfaceLoss(curN * 1e9, curD * 1e12);
    nodes.push(
      txt(
        `N = ${fmt(curN, 1)}B   ·   D = ${fmt(curD, 2)}T`,
        850,
        -320,
        30,
        ROLE.compute,
        'mono',
        'right',
      )
        .glow(6, ROLE.compute)
        .opacity(alpha),
      txt(
        `Fitted loss = ${fmt(lossNow, 3)} nats`,
        850,
        -270,
        28,
        COSMOS.ink,
        'mono',
        'right',
      ).opacity(alpha),
    );

    let footer = `Unconstrained min: 7.82B × 12.53T (~1,600 tok/param, loss 2.074)`;
    let footerCol = ROLE.tokens;
    if (inf > 0.5) {
      footer = 'No full-budget point fits!  30B × 2T < 49B × 2T required -> shrink run or add data';
      footerCol = ROLE.cap;
    } else if (cn > 0.1) {
      footer = 'With N <= 30B AND D <= 2T, can you spend the entire budget?';
      footerCol = ROLE.compute;
    } else if (cd > 0.1) {
      footer = `First feasible point under D <= 2T:  49B × 2.0T  (loss 2.086 vs 2.074)`;
      footerCol = ROLE.optimal;
    }

    nodes.push(
      txt(footer, 0, 385, 28, footerCol, 'sans', 'center').glow(7, footerCol).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.cap, ROLE.tokens), title, stageLayer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-data-cap-0', (d) => s.play(toOptT.to(1, { duration: d })), { dur: 1.5 });
  playCue(
    s,
    c,
    'sl-data-cap-1',
    (d) => s.play(capDVis.to(1, { duration: Math.min(0.45, d) }), toCapT.to(1, { duration: d })),
    { dur: 1.5 },
  );
  playCue(s, c, 'sl-data-cap-2', (d) => s.play(capNVis.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'sl-data-cap-3', (d) => s.play(revealInfeas.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
