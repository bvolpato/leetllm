// Scene 19: Make the proposed correction fail visibly: length-margin bypass b=0,3,6 + 2x2 factorial contrast.
import {
  COSMOS,
  LENGTH_MARGIN_CASES,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  sampleCurve,
  stablePairLoss,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function lengthMarginCounterexample(s, c) {
  const weightB = s.value(0); // sweeps 0 -> 3 -> 6
  const showFormula = s.value(0.45);
  const showHeldout = s.value(0);
  const showFactorial = s.value(0);

  const bgAura = aura(150, 15, 580, '#ff6b8b1e', '#fb923c18');
  const title = heroTitle(['Why Length Margins', 'Fail to Stop Gaming'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'COUNTEREXAMPLE · PURE LENGTH SCORER r(y) = b · len(y)',
  });

  const eq = glowTex(String.raw`\Delta_{\text{eff}} = (b - \alpha)\,\Delta\text{len}`, {
    x: 465,
    y: -365,
    size: 40,
    color: COSMOS.amber,
  });

  // Curve plot on left-center: training loss vs length weight b in [0, 6.5]
  const gx0 = -760;
  const gx1 = -30;
  const gy0 = 245;
  const gy1 = -165;
  const mapB = (b) => gx0 + (b / 6.5) * (gx1 - gx0);
  const mapL = (l) => gy0 - (Math.min(1.5, l) / 1.5) * (gy0 - gy1);
  const CURVE_PTS = sampleCurve((b) => stablePairLoss(b - 1), 0, 6.5, mapB, mapL, 70);

  const live = guardedDynamic(1, () => {
    const b = weightB.value;
    const loss = stablePairLoss(b - 1);
    const shortS = b * 1;
    const longS = b * 2;
    const ho = showHeldout.value;
    const fc = showFactorial.value;

    const px = mapB(b);
    const py = mapL(loss);

    const nodes = [
      // Left plot: training loss plummets as length weight b grows past alpha=1!
      txt('TRAINING LOSS (α = 1, Δlen = 1)', gx0, -210, 26, COSMOS.amber, 'mono', 'left').opacity(
        Math.max(0.5, showFormula.value),
      ),
      line([gx0, gy0], [gx1, gy0], { stroke: '#455885', width: 2.5 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#455885', width: 2.5 }),
      ...[0, 3, 6].map((v) =>
        group(
          line([mapB(v), gy0 - 6], [mapB(v), gy0 + 8], { stroke: '#5a6f9c', width: 2 }),
          txt(`b=${v}`, mapB(v), gy0 + 36, 26, COSMOS.muted, 'mono'),
        ),
      ),
      glowingTrail(CURVE_PTS, {
        gradientColors: [COSMOS.amber, COSMOS.cyan, COSMOS.emerald],
        width: 5.0,
        glow: 11,
      }),
      line([px, gy0], [px, py], { stroke: COSMOS.gold, width: 2.4, dash: [7, 5] }),
      glowDot(px, py, { radius: 10, color: COSMOS.gold }),
      txt(
        `b = ${b.toFixed(1)}  →  loss = ${loss.toFixed(3)}`,
        gx1 - 12,
        gy1 + 20,
        28,
        COSMOS.gold,
        'mono',
        'right',
      ).glow(6, COSMOS.gold),

      // Milestone table readouts under plot
      ...LENGTH_MARGIN_CASES.map((row, idx) =>
        txt(
          `b=${row.b}: L=${row.loss.toFixed(3)}`,
          -760 + idx * 255,
          325,
          26,
          Math.abs(b - row.b) < 0.8 ? COSMOS.gold : COSMOS.muted,
          'mono',
          'left',
        ),
      ),

      // Right-top: Held-out Short Correct vs Long Wrong comparison bars
      txt('HELD-OUT: SHORT CORRECT VS LONG WRONG', 110, -210, 26, COSMOS.rose, 'mono', 'left'),
      txt('Short correct (len=1)', 110, -135, 26, COSMOS.emerald, 'sans', 'left'),
      rect(Math.max(18, (shortS / 12) * 520), 42, { fill: COSMOS.emerald, stroke: null, radius: 6 })
        .at(110 + Math.max(18, (shortS / 12) * 520) * 0.5, -88)
        .glow(6, COSMOS.emerald),
      txt(
        `${shortS.toFixed(1)}`,
        110 + Math.max(18, (shortS / 12) * 520) + 18,
        -88,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      txt('Long wrong (len=2)', 110, -22, 26, COSMOS.rose, 'sans', 'left'),
      rect(Math.max(18, (longS / 12) * 520), 42, { fill: COSMOS.rose, stroke: null, radius: 6 })
        .at(110 + Math.max(18, (longS / 12) * 520) * 0.5, 25)
        .glow(8, COSMOS.rose),
      txt(
        `${longS.toFixed(1)}`,
        110 + Math.max(18, (longS / 12) * 520) + 18,
        25,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ),

      txt(
        b < 0.2 ? 'At b = 0: replies tie (0 vs 0)' : 'LONG WRONG STILL WINS (2b > b)!',
        110,
        92,
        28,
        b < 0.2 ? COSMOS.muted : COSMOS.rose,
        'mono',
        'left',
      )
        .glow(b < 0.2 ? 0 : 7, COSMOS.rose)
        .opacity(Math.max(0.5, ho)),

      // Right-bottom: 2x2 Independent Quality x Presentation design + Eisenstein 8% -> 50%
      txt(
        'THE FIX: VARY QUALITY & FORM INDEPENDENTLY',
        110,
        175,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(Math.max(0.45, fc)),
      tokenCell(265, 250, 290, 68, COSMOS.emerald, {
        fill: '#0d2224',
        opacity: Math.max(0.45, fc),
      }),
      txt('Short + Right', 265, 250, 26, COSMOS.emerald, 'mono').opacity(Math.max(0.45, fc)),
      tokenCell(615, 250, 290, 68, COSMOS.cyan, { fill: '#0f1c2e', opacity: Math.max(0.45, fc) }),
      txt('Long + Right', 615, 250, 26, COSMOS.cyan, 'mono').opacity(Math.max(0.45, fc)),
      tokenCell(265, 336, 290, 68, COSMOS.rose, { fill: '#221120', opacity: Math.max(0.45, fc) }),
      txt('Short + Wrong', 265, 336, 26, COSMOS.rose, 'mono').opacity(Math.max(0.45, fc)),
      tokenCell(615, 336, 290, 68, COSMOS.amber, { fill: '#221810', opacity: Math.max(0.45, fc) }),
      txt('Long + Wrong', 615, 336, 26, COSMOS.amber, 'mono').opacity(Math.max(0.45, fc)),

      txt(
        'Test sycophancy & format too · lists jumped 8% → 50% (Eisenstein et al.)',
        0,
        420,
        26,
        COSMOS.amber,
        'sans',
      ).opacity(Math.max(0.45, fc)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('length-margin-counterexample-step-1', () => s.play(showFormula.to(1, { duration: 0.4 })));
  c.on('length-losses', () => s.play(weightB.to(6, { duration: 1.5 })));
  c.on('length-margin-counterexample-step-2', () => s.play(showHeldout.to(1, { duration: 0.45 })));
  c.on('length-margin-counterexample-step-3', () =>
    s.play(showFactorial.to(0.65, { duration: 0.4 })),
  );
  c.on('length-factorial', () =>
    s.play(showFactorial.to(1, { duration: remainDuration(c, 'length-factorial', 0.45) })),
  );
}
