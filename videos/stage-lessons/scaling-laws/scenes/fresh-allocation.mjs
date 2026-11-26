// Scene 26: fresh-allocation: "Which allocation can you use?"
// Grand finale synthesizing optimum, data cap, and memory cap on N*D = 900 with L = 1 + 3/sqrt(N) + 6/sqrt(D):
//   - Strict prediction withholding across ALL THREE holds:
//     1) Beat 0 (3.3s hold): Plans A, B, C shown with "?" loss & no winner highlight.
//     2) Beat 1 (2.4s hold): Plan B (15x60, 2.549) revealed after cues, then D <= 40 ceiling appears
//        WITHOUT revealing 22.5 until Beat 2!
//     3) Beat 3 (2.8s hold): N <= 20 wall appears with "20 x 40 = ?" WITHOUT revealing 800 or the
//        5-row shortfall until AFTER fresh-area and fresh-shortfall in Beat 4!
import { line } from 'vizmatic/stage';
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
  allocationOptimum,
  cinemaAtmosphere,
  fmt,
  fmtTrim,
  isoRect,
  loss,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
  swapVis,
} from '../parts.mjs';

const PRODUCT = 900;
const A_COEF = 3;
const B_COEF = 6;
const CAP_D = 40;
const CAP_N = 20;
const WINNER = allocationOptimum(PRODUCT, A_COEF, B_COEF, 0.5, 0.5); // 15 x 60
const CAPPED_N = PRODUCT / CAP_D; // 22.5
const PLANS = [
  { id: 'A', n: 7.5, d: 120 },
  { id: 'B', n: 15, d: 60 },
  { id: 'C', n: 30, d: 30 },
];

export default function freshAllocation(s, c) {
  const title = heroTitle(['Which allocation', 'can you use?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.compute,
  });

  // Left-plot and right-panel state values
  const plansGlow = s.value(0); // fresh-plans
  const ratioVis = s.value(0); // AFTER fresh-ratio
  const choiceVis = s.value(0); // AFTER fresh-choice
  const lossVis = s.value(0); // AFTER fresh-loss
  const capDVis = s.value(0); // fresh-cap
  const slideT = s.value(0); // fresh-slide: N slides 15 -> 22.5
  const quotVis = s.value(0); // AFTER fresh-quotient
  const capLossVis = s.value(0); // AFTER fresh-cap-loss
  const capNVis = s.value(0); // fresh-size-limit
  const areaVis = s.value(0); // AFTER fresh-area
  const shortVis = s.value(0); // AFTER fresh-shortfall

  const tableVis = s.value(1);
  const dualVis = s.value(0);
  const pulse = s.value(0);

  // Left stage: Feasible map & iso-compute hyperbola N*D = 900
  const mapLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const ch = choiceVis.value;
    const cd = capDVis.value;
    const sl = slideT.value;
    const cn = capNVis.value;
    const sh = shortVis.value;

    const curN = WINNER.n + (CAPPED_N - WINNER.n) * sl;
    const curD = PRODUCT / curN;

    const plane = plotPlane({
      left: -775,
      right: -105,
      top: -215,
      bottom: 285,
      xDomain: [0, 36],
      yDomain: [0, 135],
      xTicks: [10, 20, 30],
      yTicks: [40, 80, 120],
      xLabel: 'Parameter units N',
      yLabel: 'Token units D',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Translucent area rectangle: either active proposal or dual-capped 20x40 box
    if (cn > 0.05) {
      nodes.push(
        isoRect(plane, CAP_N, CAP_D, {
          color: ROLE.params,
          fillOpacity: 0.3,
          strokeWidth: 2.8,
          glow: 10,
          opacity: cn * alpha,
        }),
      );
      if (sh > 0.05) {
        // Missing 5-row strip from D=40 to D=45 at N=20
        const [x0, y40] = plane.toScreen(0, CAP_D);
        const [x20, y45] = plane.toScreen(CAP_N, PRODUCT / CAP_N);
        nodes.push(
          lumBar((x0 + x20) / 2, (y40 + y45) / 2, x20 - x0, Math.max(8, y40 - y45), {
            color: ROLE.cap,
            fillOpacity: 0.56,
            strokeWidth: 2.6,
            glow: 12,
            radius: 2,
            opacity: sh * alpha,
          }),
        );
      }
    } else if (ch > 0.05) {
      nodes.push(
        isoRect(plane, curN, curD, {
          color: ROLE.compute,
          fillOpacity: 0.18,
          strokeWidth: 2.4,
          glow: 8,
          opacity: ch * alpha,
        }),
      );
    }

    // Hyperbola N * D = 900
    const pts = sampleCurve(plane, (x) => PRODUCT / x, PRODUCT / 133, 35.5, 80);
    nodes.push(glowingTrail(pts, { color: ROLE.tokens, width: 4.5, glow: 11, opacity: alpha }));

    // Plans A, B, C beacons
    for (const pl of PLANS) {
      const [px, py] = plane.toScreen(pl.n, pl.d);
      const isB = pl.id === 'B' && ch > 0.5 && cd < 0.2;
      const col = isB ? ROLE.compute : COSMOS.muted;
      nodes.push(
        glowDot(px, py, {
          radius: isB ? 10 : 7.5,
          color: col,
          glow: isB ? 14 : 6 + 4 * plansGlow.value,
          opacity: alpha,
        }),
        txt(
          pl.id,
          px + 20,
          py + (pl.id === 'C' ? 40 : -22),
          28,
          isB ? ROLE.compute : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // D <= 40 ceiling line
    if (cd > 0.02) {
      const wallY = plane.toY(CAP_D);
      nodes.push(
        line([plane.bounds.left, wallY], [plane.bounds.right, wallY], {
          stroke: ROLE.cap,
          width: 3.4,
        }).opacity(cd * alpha),
        txt('D <= 40', plane.bounds.right - 8, wallY - 26, 26, ROLE.cap, 'mono', 'right')
          .glow(6, ROLE.cap)
          .opacity(cd * alpha),
      );
    }

    // N <= 20 memory wall
    if (cn > 0.02) {
      const wallX = plane.toX(CAP_N);
      nodes.push(
        line([wallX, plane.bounds.top], [wallX, plane.bounds.bottom], {
          stroke: ROLE.params,
          width: 3.4,
        }).opacity(cn * alpha),
        txt('N <= 20', wallX + 14, plane.bounds.top + 32, 26, ROLE.params, 'mono', 'left')
          .glow(6, ROLE.params)
          .opacity(cn * alpha),
      );
      const [cx, cy] = plane.toScreen(CAP_N, CAP_D);
      nodes.push(
        glowDot(cx, cy, { radius: 10, color: ROLE.params, glow: 14, opacity: cn * alpha }),
      );
    }

    // Active gliding corner beacon
    if (ch > 0.05) {
      const [ax, ay] = plane.toScreen(curN, curD);
      nodes.push(
        glowDot(ax, ay, {
          radius: 11,
          color: cn > 0.2 ? COSMOS.muted : ROLE.compute,
          glow: cn > 0.2 ? 4 : 16,
          opacity: ch * alpha,
        }),
      );
    }

    return nodes;
  });

  // Right Panel Act 1 (Beats 0-2): Plans A, B, C & Data-cap shift
  const tableLayer = guardedDynamic(tableVis, (alpha) => {
    const nodes = [];
    const rv = ratioVis.value;
    const ch = choiceVis.value;
    const lv = lossVis.value;
    const cd = capDVis.value;
    const sl = slideT.value;
    const qv = quotVis.value;
    const cl = capLossVis.value;

    const colX = [110, 265, 435, 680];
    nodes.push(
      txt('Full budget  N × D = 900', 435, -245, 36, ROLE.tokens, 'mono', 'center')
        .glow(7, ROLE.tokens)
        .opacity(alpha),
      txt('Plan', colX[0], -100, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('N', colX[1], -100, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('D', colX[2], -100, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Fitted loss', colX[3], -100, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    PLANS.forEach((pl, i) => {
      const ry = -22 + i * 74;
      const isWin = pl.id === 'B' && ch > 0.5 && cd < 0.2;
      const col = isWin ? ROLE.compute : COSMOS.ink;
      const lossTxt = lv > 0.5 ? fmt(loss(pl.n, pl.d, A_COEF, B_COEF), 3) : '?';
      nodes.push(
        txt(pl.id, colX[0], ry, 34, col, 'mono', 'center')
          .glow(isWin ? 7 : 0, ROLE.compute)
          .opacity(alpha),
        txt(fmtTrim(pl.n, 1), colX[1], ry, 34, col, 'mono', 'center').opacity(alpha),
        txt(fmtTrim(pl.d, 1), colX[2], ry, 34, col, 'mono', 'center').opacity(alpha),
        txt(lossTxt, colX[3], ry, 34, lv > 0.5 ? col : COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(line([60, 178], [820, 178], { stroke: '#334570', width: 2 }).opacity(0.85 * alpha));

    let statusLine = 'Which plan balances the two penalties?';
    let statusCol = ROLE.compute;
    if (cl > 0.5) {
      statusLine = `22.5 × 40   ·   loss ${fmt(loss(CAPPED_N, CAP_D, A_COEF, B_COEF), 3)}`;
      statusCol = ROLE.optimal;
    } else if (qv > 0.5) {
      statusLine = `900 ÷ 40  =  22.5 parameter units`;
      statusCol = ROLE.cap;
    } else if (sl > 0.05) {
      statusLine = `900 ÷ 40  =  ?  (sliding to D = 40)`;
      statusCol = ROLE.cap;
    } else if (cd > 0.2) {
      statusLine = 'Cap: D <= 40 (no repeats)  ·  can B run?';
      statusCol = ROLE.cap;
    } else if (rv > 0.5) {
      statusLine =
        ch > 0.5 ? 'Balance: D / N = (6 / 3)² = 4  (Plan B)' : 'Balance: D / N = (6 / 3)² = 4';
      statusCol = ROLE.optimal;
    }

    nodes.push(
      txt(statusLine, 435, 245, 30, statusCol, 'mono', 'center').glow(7, statusCol).opacity(alpha),
    );

    return nodes;
  });

  // Right Panel Act 2 (Beats 3-4): Dual-cap check (N <= 20 AND D <= 40)
  const dualLayer = guardedDynamic(dualVis, (alpha) => {
    const nodes = [];
    const av = areaVis.value;
    const sv = shortVis.value;

    nodes.push(
      txt('DUAL-CAP CHECK', 435, -245, 28, ROLE.params, 'mono', 'center')
        .glow(6, ROLE.params)
        .opacity(alpha),
      txt('N <= 20   AND   D <= 40', 435, -175, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Largest allowed rectangle', 435, -75, 30, COSMOS.muted, 'sans', 'center').opacity(alpha),
      txt(
        `20 × 40  =  ${av > 0.5 ? '800' : '?'}`,
        435,
        15,
        62,
        av > 0.5 ? ROLE.compute : ROLE.params,
        'mono',
        'center',
      )
        .glow(10, av > 0.5 ? ROLE.compute : ROLE.params)
        .opacity(alpha),
    );

    if (av > 0.5) {
      nodes.push(
        txt('100 units unspent (900 − 800)', 435, 118, 34, ROLE.compute, 'mono', 'center')
          .glow(7, ROLE.compute)
          .opacity(av * alpha),
      );
    } else {
      nodes.push(
        txt('How much of 900 fits inside both?', 435, 118, 30, ROLE.compute, 'serif', 'center')
          .glow(6, ROLE.compute)
          .opacity(alpha),
      );
    }

    if (sv > 0.5) {
      nodes.push(
        txt('Need 45 token units  ·  have 40', 435, 205, 30, ROLE.cap, 'mono', 'center')
          .glow(7, ROLE.cap)
          .opacity(sv * alpha),
        txt('Shortfall: +5 usable token units', 435, 265, 30, ROLE.cap, 'mono', 'center')
          .glow(7, ROLE.cap)
          .opacity(sv * alpha),
      );
    }

    return nodes;
  });

  const eq = glowTex('L = 1 + \\frac{3}{\\sqrt{N}} + \\frac{6}{\\sqrt{D}}', {
    x: 435,
    y: -175,
    size: 36,
    color: ROLE.compute,
  });

  const footerLayer = guardedDynamic(s.value(1), (alpha) => {
    const sh = shortVis.value;
    const av = areaVis.value;
    const cn = capNVis.value;
    const textVal =
      sh > 0.5
        ? 'Next lesson: trace corpus filtering, deduplication & packing to find those extra tokens'
        : av > 0.5
          ? 'Plan a smaller 800-unit run, or secure more usable tokens'
          : cn > 0.2
            ? 'Memory cap N <= 20 and data cap D <= 40 both active'
            : 'Normalized counts for a fresh 900-unit proposal';
    return [
      txt(textVal, 0, 395, 28, sh > 0.5 ? ROLE.optimal : COSMOS.muted, 'sans', 'center')
        .glow(sh > 0.5 ? 6 : 0, ROLE.optimal)
        .opacity(alpha),
    ];
  });

  s.add(
    cinemaAtmosphere(ROLE.tokens, ROLE.compute),
    title,
    mapLayer,
    tableLayer,
    eq,
    dualLayer,
    footerLayer,
  );
  scenePulse(s, c, pulse);

  playCue(s, c, 'fresh-plans', (d) => s.play(plansGlow.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'fresh-ratio', (d) => s.play(ratioVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fresh-choice', (d) => s.play(choiceVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fresh-loss', (d) => s.play(lossVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fresh-cap', (d) => s.play(capDVis.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'fresh-slide', (d) => s.play(slideT.to(1, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'fresh-quotient', (d) => s.play(quotVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fresh-cap-loss', (d) => s.play(capLossVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  c.hide('fresh-size-limit', eq);
  playCue(
    s,
    c,
    'fresh-size-limit',
    (d) => s.play(capNVis.to(1, { duration: d }), swapVis(tableVis, dualVis, Math.min(0.65, d))),
    { dur: 0.75 },
  );
  playCue(s, c, 'fresh-area', (d) => s.play(areaVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fresh-shortfall', (d) => s.play(shortVis.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
