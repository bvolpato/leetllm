// Scene 4: softmax: "Scores become shares"
// Score bars shrink by 1/sqrt(2) -> exponentials -> conserved glowing probability river
// -> live competition as sing's logit rises and steals share from Birds while sum = 1.00.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EXPS,
  ROLE,
  SCALED,
  SCORES,
  WEIGHTS,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  shareRibbon,
  softmax,
} from '../parts.mjs';

export default function softmaxScene(s, c) {
  const title = heroTitle(['Scores become', 'conserved shares'], {
    x: -850,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.sing,
  });

  // Live reactive values for scores -> scaled -> competing logits
  const sBirds = s.value(SCORES[1][0]); // 0.60 -> 0.424
  const sSing = s.value(SCORES[1][1]); // 1.05 -> 0.742 -> 2.10 (competing)
  const scaledMode = s.value(0); // 0 = raw scores, 1 = scaled logits
  const expVis = s.value(0); // reveals e^z terms
  const ribbonVis = s.value(0.18); // quiet probability river skeleton, lights up at softmax
  const competeMode = s.value(0);

  const stageVis = s.value(1);

  const visualLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const zb = sBirds.value;
    const zs = sSing.value;
    const shares = softmax([zb, zs]);
    const eb = Math.exp(zb);
    const es = Math.exp(zs);
    const eSum = eb + es;

    // Left-center vertical bar pair for Birds & sing scores/logits
    const baseY = 175;
    const barScale = 145;
    const xB = -540;
    const xS = -300;
    const hB = Math.max(10, zb * barScale);
    const hS = Math.max(10, zs * barScale);

    nodes.push(
      line([xB - 110, baseY], [xS + 110, baseY], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      lumBar(xB, baseY - hB / 2, 110, hB, {
        color: ROLE.birds,
        fillOpacity: 0.4,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(xS, baseY - hS / 2, 110, hS, {
        color: ROLE.sing,
        fillOpacity: 0.4,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      txt('Birds', xB, baseY + 38, 30, ROLE.birds, 'sans', 'center').opacity(alpha),
      txt('sing', xS, baseY + 38, 30, ROLE.sing, 'sans', 'center').opacity(alpha),
      txt(fmt(zb, 2), xB, baseY - hB - 30, 32, ROLE.birds, 'mono', 'center').opacity(alpha),
      txt(fmt(zs, 2), xS, baseY - hS - 30, 32, ROLE.sing, 'mono', 'center').opacity(alpha),
    );

    const barCaption =
      scaledMode.value > 0.5 ? 'scaled logits  z = (q·k)/√2' : 'raw dot products  q·k';
    nodes.push(
      txt(barCaption, (xB + xS) / 2, baseY + 95, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Center-right glowing exponential curve & conserved share ribbon
    const rv = ribbonVis.value;
    const ribbonX = 365;
    const ribbonY = 85;
    const ribbonW = 820;

    // Luminous connecting streams from bars to share river
    nodes.push(
      glowingTrail(
        [
          [xS + 125, 40],
          [ribbonX - ribbonW / 2 - 25, ribbonY],
        ],
        {
          gradientColors: [ROLE.query, ROLE.sing],
          width: 3.5,
          glow: 8,
          opacity: Math.max(0.25, rv) * alpha,
        },
      ),
    );

    // Conserved share ribbon (total width = 1.00 always!)
    nodes.push(
      shareRibbon({
        x: ribbonX,
        y: ribbonY,
        width: ribbonW,
        height: 68,
        shares,
        colors: [ROLE.birds, ROLE.sing],
        labels: ['Birds', 'sing'],
        showPct: rv > 0.45,
        opacity: rv * alpha,
      }),
      txt(
        `total = ${fmt(shares[0] + shares[1], 2)} (conserved)`,
        ribbonX,
        ribbonY + 76,
        30,
        ROLE.value,
        'mono',
        'center',
      )
        .glow(6, ROLE.value)
        .opacity(rv * alpha),
    );

    // Exponentials readout above ribbon
    const ev = expVis.value;
    if (ev > 0.05) {
      nodes.push(
        txt(
          `e^${fmt(zb, 2)} = ${fmt(eb, 2)}    e^${fmt(zs, 2)} = ${fmt(es, 2)}    sum = ${fmt(eSum, 2)}`,
          ribbonX,
          -65,
          28,
          ROLE.query,
          'mono',
          'center',
        ).opacity(ev * alpha),
      );
    }

    // Competition readout below ribbon
    if (competeMode.value > 0.05) {
      nodes.push(
        txt(
          `sing +${fmt(zs - SCALED[1][1], 2)}  →  Birds ${pct(shares[0])}  |  sing ${pct(shares[1])}`,
          ribbonX,
          245,
          30,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(competeMode.value * alpha),
      );
    }

    return nodes;
  });

  // Top-right MathJax equations
  const scaleEq = glowTex('\\text{logit}_j = \\frac{q \\cdot k_j}{\\sqrt{d_k}}', {
    x: 365,
    y: -340,
    size: 46,
    color: ROLE.query,
  });
  const smEq = glowTex('\\alpha_j = \\frac{e^{z_j}}{\\sum_m e^{z_m}}', {
    x: 365,
    y: -210,
    size: 46,
    color: ROLE.sing,
  });
  const namesNote = txt('logits → attention weights', 365, 365, 30, COSMOS.muted, 'sans', 'center');

  s.add(cinemaAtmosphere(ROLE.birds, ROLE.sing), title, visualLayer);

  // Beat 0: divide by sqrt(2) -> bars smoothly shrink to 0.42, 0.74
  c.show('divide', scaleEq);
  playCue(
    s,
    c,
    'scaled',
    (d) =>
      s.play(
        scaledMode.to(1, { duration: Math.min(0.3, d) }),
        sBirds.to(SCALED[1][0], { duration: d }),
        sSing.to(SCALED[1][1], { duration: d }),
      ),
    { dur: 0.85 },
  );

  // Beat 1: Softmax formula, terminology, exponentials, 42% / 58% share ribbon
  c.show('softmax', smEq);
  c.show('names', namesNote);
  playCue(s, c, 'exp', (d) => s.play(expVis.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'shares', (d) => s.play(ribbonVis.to(1, { duration: d })), { dur: 0.75 });

  // Beat 2: Competition: turn sing score up, watch sing steal share while total stays 1.00
  playCue(s, c, 'compete', (d) => s.play(competeMode.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'turn-up', (d) => s.play(sSing.to(2.1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'total', (d) => s.play(sSing.to(SCALED[1][1], { duration: d })), { dur: 0.7 });

  // Quiet invariant check on EXPS used in voice
  void EXPS;
  void WEIGHTS;
}
