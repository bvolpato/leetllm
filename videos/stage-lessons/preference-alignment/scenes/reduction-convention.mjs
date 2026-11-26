// Scene 17: A sequence sum and token average can reverse the pair (+0.10 sum vs -0.05 per-token mean)
import {
  COSMOS,
  alignmentReduction,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function reductionConvention(s, c) {
  const phase = s.value(0);
  const sIntro = s.value(0);
  const sSetup = s.value(0);
  const sSum = s.value(0);
  const sDiv = s.value(0);
  const sMean = s.value(0);
  const sIpo = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3628', '#3c1b2a18');
  const title = heroTitle(['A Sequence Sum & Token Average', 'Can Reverse the Pair'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'REDUCTION CONVENTION · WHOLE-RESPONSE SUM (DPO) vs TOKEN MEAN (IPO)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const q = Math.max(sDiv.value, sMean.value);
    const state = alignmentReduction(q);
    const chosenScore = state.rows[0].score;
    const rejectedScore = state.rows[1].score;
    const margin = state.margin;
    const isFlipped = margin < 0;

    // Left: Token blocks for Chosen (4 tokens x +0.10 = +0.40) and Rejected (2 tokens x +0.15 = +0.30)
    const nodes = [
      txt(
        'CHOSEN RESPONSE: 4 TOKENS  (EACH +0.10)',
        -855,
        -200,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      ...[0, 1, 2, 3].flatMap((i) => {
        const cx = -760 + i * 185;
        return [
          glassCell(cx, -118, 165, 84, COSMOS.emerald, { fill: '#0e2824', glow: 6 }),
          txt('+0.10', cx, -116, 28, COSMOS.emerald, 'mono'),
        ];
      }),
      txt(
        q > 0.5
          ? `MEAN = +0.40 / 4 = +${chosenScore.toFixed(2)}`
          : `SUM = +${chosenScore.toFixed(2)}`,
        -855,
        -42,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      txt('REJECTED RESPONSE: 2 TOKENS  (EACH +0.15)', -855, 48, 26, COSMOS.rose, 'mono', 'left'),
      ...[0, 1].flatMap((i) => {
        const cx = -760 + i * 185;
        return [
          glassCell(cx, 130, 165, 84, COSMOS.rose, { fill: '#28101a', glow: 6 }),
          txt('+0.15', cx, 132, 28, COSMOS.rose, 'mono'),
        ];
      }),
      txt(
        q > 0.5
          ? `MEAN = +0.30 / 2 = +${rejectedScore.toFixed(2)}`
          : `SUM = +${rejectedScore.toFixed(2)}`,
        -855,
        206,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ),
    ];

    // Right: Signed margin gauge (-0.15 to +0.15) that crosses 0 and flips sign
    const gx0 = 110;
    const gx1 = 810;
    const gy = 30;
    const mapG = (m) => gx0 + ((m + 0.15) / 0.3) * (gx1 - gx0);
    const xZero = mapG(0);
    const xCur = mapG(margin);
    const mCol = isFlipped ? COSMOS.rose : COSMOS.emerald;

    nodes.push(
      glassCell(460, 10, 790, 390, mCol, {
        fill: '#111728',
        glow: sSum.value > 0.2 || q > 0.2 ? 9 * pulse : 4,
      }),
      txt(
        q > 0.5 ? 'PER-TOKEN MEAN (DIVIDE BY LENGTH)' : 'WHOLE-RESPONSE SUM (STANDARD DPO)',
        460,
        -136,
        26,
        mCol,
        'mono',
      ),
      line([gx0, gy], [gx1, gy], { stroke: COSMOS.rule, width: 3 }),
      line([xZero, gy - 44], [xZero, gy + 44], { stroke: COSMOS.gold, width: 3 }),
      txt('0', xZero, gy + 72, 26, COSMOS.gold, 'mono'),
      txt('-0.10', mapG(-0.1), gy + 72, 26, COSMOS.rose, 'mono'),
      txt('+0.10', mapG(0.1), gy + 72, 26, COSMOS.emerald, 'mono'),

      // Filled bar from 0 to current margin
      rect(Math.max(8, Math.abs(xCur - xZero)), 36, {
        fill: isFlipped ? '#3a1421' : '#103b33',
        stroke: mCol,
        width: 2.5,
        radius: 6,
      }).at((xZero + xCur) * 0.5, gy),
      glowDot(xCur, gy, { radius: 10, color: mCol, glow: 14 }),
      txt(
        `MARGIN = ${margin >= 0 ? '+' : ''}${margin.toFixed(2)}`,
        460,
        -62,
        42,
        mCol,
        'mono',
      ).glow(7, mCol),
      txt(
        isFlipped ? 'REVERSED: REJECTED BEATS CHOSEN!' : 'CHOSEN BEATS REJECTED (+0.10)',
        460,
        152,
        28,
        mCol,
        'mono',
      ),

      // Bottom guidance
      txt(
        sIpo.value > 0.2
          ? 'TRL IPO averages per-completion tokens (unlike standard DPO sum): always declare convention'
          : 'Averaging dataset loss across rows != averaging token log-probs inside each completion',
        0,
        396,
        26,
        sIpo.value > 0.2 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqRed = glowTex(
    '\\text{Sum: } 0.40 - 0.30 = +0.10 \\quad \\neq \\quad \\text{Mean: } \\frac{0.40}{4} - \\frac{0.30}{2} = -0.05',
    {
      x: -440,
      y: 318,
      size: 30,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqRed);
  runPhase(s, c, phase, 14);

  c.on('reduction-convention-b0', () =>
    s.play(sIntro.to(1, { duration: remainDuration(c, 'reduction-convention-b0', 0.45) })),
  );
  c.on('reduction-convention-b1', () =>
    s.play(sSetup.to(1, { duration: remainDuration(c, 'reduction-convention-b1', 0.45) })),
  );
  c.on('pa-reduction-sum', () =>
    s.play(sSum.to(1, { duration: remainDuration(c, 'pa-reduction-sum', 0.45) })),
  );
  c.on('pa-reduction-divide', () =>
    s.play(sDiv.to(0.6, { duration: remainDuration(c, 'pa-reduction-divide', 0.65) })),
  );
  c.on('pa-reduction-mean', () =>
    s.play(sMean.to(1, { duration: remainDuration(c, 'pa-reduction-mean', 0.65) })),
  );
  c.on('reduction-convention-b2', () =>
    s.play(sIpo.to(1, { duration: remainDuration(c, 'reduction-convention-b2', 0.5) })),
  );
}
