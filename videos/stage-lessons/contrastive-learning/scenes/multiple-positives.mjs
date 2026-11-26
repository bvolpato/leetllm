// Scene 16: multiple-positives - "What if both guides must be found?"
// Pure Cinema: opens with the 1/2 duplicate loss floor (ln 2), transitions to two distinct verified
// answers (0.999 vs 0.0005) with a magnified 0.1% tail lens, side-by-side sum-log vs SupCon mean-log
// comparisons (0.00050 vs 3.80095 nats), and equal-scale upward force rulers (+1.25e-6 vs +2.4975).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function multiplePositives(s, c) {
  const names = ['A · rotation guide', 'B · replacement guide', 'C · KMS guide'];
  const colors = [ROLE.positive, ROLE.anchor, ROLE.unrelated];
  const probs = [0.999, 0.0005, 0.0005];
  const sumPos = probs[0] + probs[1];
  const massLoss = -Math.log(sumPos);
  const costs = [probs[0], probs[1]].map((p) => -Math.log(p));
  const meanLoss = (costs[0] + costs[1]) / 2;
  const tau = 0.2;
  const pushSum = (probs[1] / sumPos - probs[1]) / tau;
  const pushMean = (0.5 - probs[1]) / tau;

  verifyApprox(probs[0] + probs[1] + probs[2], 1, 1e-12, 'probs sum to 1');
  verifyApprox(meanLoss, 3.80095, 1e-4, 'mean-log loss 3.80095');

  const vTied = s.value(1);
  const vMain = s.value(0);
  const showBar = s.value(0);
  const showTail = s.value(0);
  const showRules = s.value(0);
  const showAsk = s.value(0);
  const showPoolTerms = s.value(0);
  const showMassVal = s.value(0);
  const showMeanTerms = s.value(0);
  const showMeanVal = s.value(0);
  const showForces = s.value(0);

  const title = heroTitle(['Multiple verified answers:', 'sum-log vs. mean-log loss'], {
    x: -860,
    y: -450,
    size: 44,
    lineHeight: 52,
    accent: ROLE.anchor,
  });

  const eqTied = glowTex(
    'P^+ \\le \\tfrac{1}{2} \\quad \\Longrightarrow \\quad \\mathcal{L} \\ge \\ln 2 \\approx 0.693',
    {
      x: 0,
      y: 165,
      size: 44,
      color: ROLE.focus,
      glow: 8,
    },
  );

  // View 0: Two identical copies ceiling
  const tiedLayer = guardedDynamic(vTied, (alpha) => [
    txt('TWO IDENTICAL COPIES · ONE TARGET', 0, -210, 32, ROLE.anchor, 'mono', 'center').opacity(
      alpha,
    ),
    lumBar(-240, -60, 440, 86, {
      color: ROLE.positive,
      fillAlpha: 0.36,
      glow: 9,
      radius: 10,
      opacity: alpha,
    }),
    txt('Copy A   (½)', -240, -60, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
    lumBar(240, -60, 440, 86, {
      color: ROLE.competitor,
      fillAlpha: 0.36,
      glow: 9,
      radius: 10,
      opacity: alpha,
    }),
    txt('Copy B   (½)', 240, -60, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
    txt(
      'Deduplicate or mask the duplicate copy to remove the artificial floor',
      0,
      310,
      30,
      COSMOS.muted,
      'sans',
      'center',
    ).opacity(alpha),
  ]);

  // View 1: Two distinct verified guides (0.999 vs 0.0005)
  const mainLayer = guardedDynamic(vMain, (alpha) => {
    const sb = showBar.value;
    const st = showTail.value;
    const sr = showRules.value;
    const ask = showAsk.value;
    const pt = showPoolTerms.value;
    const mv = showMassVal.value;
    const mt = showMeanTerms.value;
    const mnv = showMeanVal.value;
    const sf = showForces.value;
    const nodes = [];

    // Top row: 3 candidates
    const xs = [-570, 0, 570];
    names.forEach((n, i) => {
      nodes.push(
        txt(n, xs[i], -285, 32, colors[i], 'sans', 'center').opacity(alpha),
        txt(
          i < 2 ? 'verified answer' : 'non-match',
          xs[i],
          -242,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(`P = ${probs[i]}`, xs[i], -192, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Middle row: Whole probability strip + magnified 0.1% tail lens (skeleton visible from start for balance)
    const wLeft = -830;
    const wW = 1020;
    const wY = -88;
    const barOp = (0.35 + 0.65 * sb) * alpha;
    nodes.push(
      txt('WHOLE ROW  (P_A = 99.9%)', wLeft, wY - 46, 26, COSMOS.muted, 'mono', 'left').opacity(
        barOp,
      ),
      lumBar(wLeft + wW / 2, wY, wW, 42, {
        color: '#3c5080',
        fillAlpha: 0.14,
        strokeWidth: 1.6,
        glow: 0,
        radius: 6,
        opacity: alpha,
      }),
    );
    if (sb > 0.05) {
      nodes.push(
        lumBar(wLeft + (wW * 0.992) / 2, wY, wW * 0.992, 42, {
          color: ROLE.positive,
          fillAlpha: 0.44,
          glow: 8,
          radius: 6,
          opacity: sb * alpha,
        }),
        lumBar(wLeft + wW - 4, wY, 8, 42, {
          color: ROLE.anchor,
          fillAlpha: 0.7,
          glow: 6,
          radius: 2,
          opacity: sb * alpha,
        }),
      );
    }

    const tLeft = 285;
    const tW = 545;
    const tY = -88;
    const tailOp = (0.35 + 0.65 * st) * alpha;
    nodes.push(
      txt('LAST 0.1% MAGNIFIED:  B & C', tLeft, tY - 46, 26, ROLE.anchor, 'mono', 'left').opacity(
        tailOp,
      ),
      lumBar(tLeft + tW / 2, tY, tW, 42, {
        color: '#3c5080',
        fillAlpha: 0.14,
        strokeWidth: 1.6,
        glow: 0,
        radius: 6,
        opacity: alpha,
      }),
    );
    if (st > 0.05) {
      nodes.push(
        lumBar(tLeft + tW * 0.25, tY, tW * 0.5 - 4, 42, {
          color: ROLE.anchor,
          fillAlpha: 0.48,
          glow: 8,
          radius: 6,
          opacity: st * alpha,
        }),
        txt('B: 0.0005', tLeft + tW * 0.25, tY, 26, COSMOS.ink, 'mono', 'center').opacity(
          st * alpha,
        ),
        lumBar(tLeft + tW * 0.75, tY, tW * 0.5 - 4, 42, {
          color: ROLE.unrelated,
          fillAlpha: 0.48,
          glow: 7,
          radius: 6,
          opacity: st * alpha,
        }),
        txt('C: 0.0005', tLeft + tW * 0.75, tY, 26, COSMOS.ink, 'mono', 'center').opacity(
          st * alpha,
        ),
      );
    }

    nodes.push(rule(-850, -18, 850, -18, COSMOS.rule, 1.6).opacity(0.65 * alpha));

    // Lower comparison: Left = Sum-before-log, Right = Mean of logs (SupCon)
    const lx = -435;
    const rx = 435;
    const rulesOp = (0.38 + 0.62 * sr) * alpha;
    nodes.push(
      rule(0, 0, 0, 315, COSMOS.rule, 1.6).opacity(0.65 * alpha),
      txt('Rule 1: Credit either answer', lx, 38, 36, ROLE.positive, 'serif', 'center').opacity(
        rulesOp,
      ),
      txt('Rule 2: Score each answer (SupCon)', rx, 38, 36, ROLE.anchor, 'serif', 'center').opacity(
        rulesOp,
      ),
    );
    if (sr < 0.45) {
      const preOp = (1 - sr / 0.45) * 0.7 * alpha;
      nodes.push(
        txt('sum positive shares before log', lx, 128, 28, COSMOS.dim, 'mono', 'center').opacity(
          preOp,
        ),
        txt('average separate negative logs', rx, 128, 28, COSMOS.dim, 'mono', 'center').opacity(
          preOp,
        ),
      );
    }

    if (sr > 0.55) {
      const postSr = (sr - 0.55) / 0.45;
      if (sf < 0.5) {
        const lOp = (1 - sf * 2) * alpha;
        if (pt > 0.05) {
          nodes.push(
            txt('−ln(0.999 + 0.0005)', lx, 128, 34, COSMOS.muted, 'mono', 'center').opacity(
              pt * lOp,
            ),
          );
        } else {
          nodes.push(
            txt('−ln(P_A + P_B)', lx, 128, 30, COSMOS.dim, 'mono', 'center').opacity(postSr * lOp),
            txt('= ? nats', lx, 210, 36, ROLE.focus, 'mono', 'center').opacity(postSr * lOp),
          );
        }
        if (mv > 0.05) {
          nodes.push(
            txt(`${massLoss.toFixed(5)} nats`, lx, 215, 44, ROLE.positive, 'mono', 'center')
              .glow(8, ROLE.positive)
              .opacity(mv * lOp),
          );
        }
        if (mt > 0.05) {
          nodes.push(
            txt(
              `(${costs[0].toFixed(3)} + ${costs[1].toFixed(3)}) / 2`,
              rx,
              128,
              34,
              COSMOS.muted,
              'mono',
              'center',
            ).opacity(mt * lOp),
          );
        } else {
          nodes.push(
            txt('(−ln P_A − ln P_B) / 2', rx, 128, 30, COSMOS.dim, 'mono', 'center').opacity(
              postSr * lOp,
            ),
            txt('= ? nats', rx, 210, 36, ROLE.focus, 'mono', 'center').opacity(postSr * lOp),
          );
        }
        if (mnv > 0.05) {
          nodes.push(
            txt(`${meanLoss.toFixed(5)} nats`, rx, 215, 44, ROLE.anchor, 'mono', 'center')
              .glow(9, ROLE.anchor)
              .opacity(mnv * lOp),
          );
        }
      } else {
        // Equal-scale upward force rulers on B's score [0 .. 2.5]
        const fOp = (sf - 0.5) * 2 * alpha;
        const rails = [
          { cx: lx, push: pushSum, col: ROLE.positive, valStr: `+${pushSum.toExponential(2)}` },
          { cx: rx, push: pushMean, col: ROLE.anchor, valStr: `+${pushMean.toFixed(4)}` },
        ];
        rails.forEach((rl) => {
          const x0 = rl.cx - 300;
          const x1 = rl.cx + 300;
          const ry = 135;
          const px = x0 + (rl.push / 2.5) * (x1 - x0);
          nodes.push(
            line([x0, ry], [x1, ry], { stroke: '#5a70a6', width: 4 }).opacity(fOp),
            txt('0', x0, ry + 36, 26, COSMOS.dim, 'mono', 'center').opacity(fOp),
            txt('2.5', x1, ry + 36, 26, COSMOS.dim, 'mono', 'center').opacity(fOp),
            glowDot(px, ry, { radius: 12, color: rl.col, glow: 14, opacity: fOp }),
            txt(rl.valStr, rl.cx, 232, 42, rl.col, 'mono', 'center').glow(8, rl.col).opacity(fOp),
          );
        });
      }
    }

    // Bottom footer
    if (sf > 0.5) {
      nodes.push(
        txt(
          'Upward pressure on B’s score (−∂L/∂s_B)   ·   equal 0 to 2.5 scale   ·   τ = 0.20',
          0,
          388,
          28,
          ROLE.focus,
          'mono',
          'center',
        ).opacity((sf - 0.5) * 2 * alpha),
      );
    } else if (ask > 0.05 && mnv < 0.3) {
      nodes.push(
        txt('Which loss still charges for missing B?', 0, 388, 38, ROLE.focus, 'serif', 'center')
          .glow(7, ROLE.focus)
          .opacity(ask * (1 - mnv * 3) * alpha),
      );
    } else if (mnv > 0.3) {
      nodes.push(
        txt(
          'Mean-log (SupCon) charges heavily when any verified positive is neglected.',
          0,
          388,
          30,
          ROLE.anchor,
          'sans',
          'center',
        ).opacity(mnv * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, eqTied, tiedLayer, mainLayer);

  c.hide('positives-distinct', eqTied);
  playOn(s, c, 'positives-distinct', (d) => swapVis(vTied, vMain, d), 0.7);
  playOn(s, c, 'positives-shares', (d) => showBar.to(1, { duration: d }), 0.5);
  playOn(s, c, 'positives-tail', (d) => showTail.to(1, { duration: d }), 0.5);
  playOn(s, c, 'positives-rules', (d) => showRules.to(1, { duration: d }), 0.5);
  playOn(s, c, 'positives-predict', (d) => showAsk.to(1, { duration: d }), 0.45);
  playOn(s, c, 'positives-pool', (d) => showPoolTerms.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'positives-mass', (d) => showMassVal.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'positives-logs', (d) => showMeanTerms.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'positives-mean',
    (d) => [showAsk.to(0, { duration: d * 0.35 }), showMeanVal.to(1, { duration: d })],
    0.45,
  );
  playOn(s, c, 'positives-descent', (d) => showForces.to(1, { duration: d }), 0.7);
}
