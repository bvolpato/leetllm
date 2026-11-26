// Scene 14: What does one vote cost? (Negative log loss curve: 50% -> 0.693, 62.2% -> 0.474, 8% -> 2.526, 95% -> 0.051)
import {
  COSMOS,
  DPO_WORKED,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  rect,
  remainDuration,
  runPhase,
  sampleCurve,
  txt,
} from '../parts.mjs';

export default function loss(s, c) {
  const phase = s.value(0);
  const sBase = s.value(0);
  const sWorked = s.value(0);
  const sWrong = s.value(0);
  const sLarge = s.value(0);
  const sConf = s.value(0);

  const bgAura = aura(320, 10, 560, '#3c1b2a24', '#14385c24');
  const title = heroTitle(['What Does One', 'Vote Cost?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'NEGATIVE LOG LOSS -ln P(A > B) · HARD MISSES PULL HARDEST',
  });

  // NLL curve plot on right half: p in [0.05, 1.0], L in [0, 3.0]
  const px0 = 20;
  const px1 = 830;
  const pyBot = 215;
  const pyTop = -230;
  const mapX = (p) => px0 + ((p - 0.0) / 1.0) * (px1 - px0);
  const mapY = (l) => pyBot - (Math.min(3.0, l) / 3.0) * (pyBot - pyTop);
  const lossPts = sampleCurve(
    (p) => -Math.log(p),
    [0.055, 0.99],
    [0, 3.0],
    px0,
    px1,
    pyBot,
    pyTop,
    84,
  );

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);
    const bs = Math.max(0.75, sBase.value);
    const wk = sWorked.value;
    const wr = sWrong.value;
    const lg = sLarge.value;
    const cf = sConf.value;

    // Piecewise smooth trajectory of P(A): 0.50 -> 0.6225 -> 0.08 -> 0.95
    let probA = 0.5;
    if (cf > 0.01) {
      probA = prefLerp(0.08, 0.95, cf);
    } else if (wr > 0.01) {
      probA = prefLerp(DPO_WORKED.probability, 0.08, wr);
    } else if (wk > 0.01) {
      probA = prefLerp(0.5, DPO_WORKED.probability, wk);
    }
    const probB = 1 - probA;
    const nll = -Math.log(probA);
    const pull = 1 - probA; // gradient weight (1 - sigma)
    const accentCol = probA < 0.25 ? COSMOS.rose : probA > 0.85 ? COSMOS.emerald : COSMOS.gold;

    const barBaseY = 120;
    const barScale = 235;
    const hA = Math.max(14, probA * barScale);
    const hB = Math.max(14, probB * barScale);

    const nodes = [
      // Left: Pair probability bars (sum = 1.0)
      txt('PREDICTED VOTE DISTRIBUTION (SUM = 100%)', -855, -198, 26, COSMOS.cyan, 'mono', 'left'),
      line([-830, barBaseY], [-120, barBaseY], { stroke: COSMOS.rule, width: 2.4 }),

      rect(200, hA, { fill: '#103b33', stroke: COSMOS.emerald, width: 2.6, radius: 8 })
        .at(-650, barBaseY - hA * 0.5)
        .glow(7, COSMOS.emerald),
      txt(`${(probA * 100).toFixed(1)}%`, -650, barBaseY - hA - 30, 32, COSMOS.emerald, 'mono'),
      txt('P(A WINS)', -650, barBaseY + 42, 26, COSMOS.emerald, 'mono'),

      rect(200, hB, { fill: '#2a131e', stroke: COSMOS.rose, width: 2.6, radius: 8 })
        .at(-310, barBaseY - hB * 0.5)
        .glow(5, COSMOS.rose),
      txt(`${(probB * 100).toFixed(1)}%`, -310, barBaseY - hB - 30, 32, COSMOS.rose, 'mono'),
      txt('P(B WINS)', -310, barBaseY + 42, 26, COSMOS.rose, 'mono'),

      // Loss & pull readout
      glassCell(-465, 255, 780, 128, accentCol, {
        fill: probA < 0.25 ? '#2a111a' : '#161c2e',
        glow: 9 * pulse,
        opacity: bs,
      }),
      txt(
        `LOSS = ${nll.toFixed(3)}  ·  PULL = ${pull.toFixed(2)}`,
        -465,
        228,
        30,
        accentCol,
        'mono',
      ),
      txt(
        cf > 0.5
          ? '95% match -> tiny loss (0.051) & tiny pull'
          : lg > 0.3 || wr > 0.5
            ? '8% miss -> large loss (2.526) & strong pull!'
            : wk > 0.5
              ? 'm = 1, beta = 0.5 -> loss drops 0.693 -> 0.474'
              : 'At pi = pi_ref (50/50), loss = -ln(0.5) = 0.693',
        -465,
        282,
        26,
        COSMOS.ink,
        'sans',
      ),

      // Right: Negative log loss plot
      txt('NEGATIVE LOG LOSS  L(p) = -ln(p)', 425, -310, 26, COSMOS.gold, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop], { stroke: COSMOS.rule, width: 2.2 }),
      txt('0%', mapX(0.05), pyBot + 40, 26, COSMOS.muted, 'mono'),
      txt('50%', mapX(0.5), pyBot + 40, 26, COSMOS.cyan, 'mono'),
      txt('95%', mapX(0.95), pyBot + 40, 26, COSMOS.emerald, 'mono'),
      txt('3.0', px0 + 18, pyTop + 26, 26, COSMOS.rose, 'mono', 'left'),
      txt('ASSIGNED PROBABILITY P(A > B)', 425, pyBot + 94, 26, COSMOS.muted, 'mono'),

      glowingTrail(lossPts, { color: COSMOS.rose, width: 4.8, glow: 10 }),

      // Active point on loss curve
      line([mapX(probA), pyBot], [mapX(probA), mapY(nll)], {
        stroke: accentCol,
        width: 2.4,
        dash: [6, 5],
      }),
      glowDot(mapX(probA), mapY(nll), { radius: 10, color: accentCol, glow: 15 }),
      txt(
        nll.toFixed(3),
        Math.min(720, Math.max(120, mapX(probA) + 28)),
        Math.max(-200, mapY(nll) - 48),
        32,
        accentCol,
        'mono',
        'left',
      ).glow(6, accentCol),
    ];

    return group(...nodes);
  });

  const eqLoss = glowTex(
    '\\mathcal{L} = -\\ln P(A > B), \\qquad \\text{pull} \\propto 1 - P(A > B)',
    {
      x: 425,
      y: 382,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqLoss);
  runPhase(s, c, phase, 14);

  c.on('loss-b1-1', () => s.play(sBase.to(1, { duration: remainDuration(c, 'loss-b1-1', 0.45) })));
  c.on('loss-b2-1', () =>
    s.play(sWorked.to(1, { duration: remainDuration(c, 'loss-b2-1', 0.85) })),
  );
  c.on('loss-wrong-order', () =>
    s.play(sWrong.to(1, { duration: remainDuration(c, 'loss-wrong-order', 0.85) })),
  );
  c.on('loss-b3-1', () => s.play(sLarge.to(1, { duration: remainDuration(c, 'loss-b3-1', 0.45) })));
  c.on('loss-already-confident', () =>
    s.play(sConf.to(1, { duration: remainDuration(c, 'loss-already-confident', 0.9) })),
  );
}
