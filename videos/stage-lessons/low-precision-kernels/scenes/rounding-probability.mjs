// Scene 07: Where does one weight update land? RNE stall (1 + 1/32 in E4M3 vs BF16) + Stochastic Rounding (1.01 -> 8% / 92%).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  SR_101,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function roundingProbability(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const candProg = s.value(0);
  const revealE4 = s.value(0);
  const revealBF = s.value(0);

  const showPart2 = s.value(0);
  const trialPos = s.value(1.01);
  const revealMass = s.value(0);
  const revealExp = s.value(0);
  const showLimits = s.value(0);

  const bgAura = aura(120, 40, 620, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Where Does One', 'Update Land?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.cyan,
    eyebrow: 'RNE STALL VS STOCHASTIC ROUNDING',
  });

  // Part 1 (Beats 0-1): 1 + 1/32 on E4M3 vs BF16 aligned rulers [1.0, 1.125]
  // STRICT PREDICTION WITHHOLDING: outcomes stay '?' until round-store & round-bf16!
  const part1 = guardedDynamic(showPart1, (a) => {
    const cp = candProg.value;
    const e4 = revealE4.value;
    const bf = revealBF.value;
    const rx0 = -760;
    const rx1 = 360;
    const mapX = (v) => rx0 + ((v - 1.0) / 0.125) * (rx1 - rx0);
    const exactV = 1.0 + (1 / 32) * cp;
    const exactX = mapX(exactV);

    const yE4 = -110;
    const yBF = 145;
    const e4StoreX = mapX(1.0 + (1 / 32) * (1 - e4));
    const bfStoreX = mapX(1.0 + 1 / 32);

    const nodes = [
      // E4M3 ruler (only 1.0 and 1.125)
      txt(
        'E4M3 RULER · STEP = 1/8 (0.125)',
        rx0,
        yE4 - 82,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
      line([rx0, yE4], [rx1, yE4], { stroke: '#4c5f8a', width: 3.4 }).opacity(a),
      line([rx0, yE4 - 28], [rx0, yE4 + 28], { stroke: COSMOS.cyan, width: 4 }).opacity(a),
      line([rx1, yE4 - 28], [rx1, yE4 + 28], { stroke: COSMOS.cyan, width: 4 }).opacity(a),
      txt('1.000', rx0, yE4 + 54, 26, COSMOS.ink, 'mono').opacity(a),
      txt('1.125', rx1, yE4 + 54, 26, COSMOS.ink, 'mono').opacity(a),
      // Exact candidate dot
      glowDot(exactX, yE4 - 18, { radius: 8, color: COSMOS.blue, opacity: a }),
      txt('1 + 1/32 = 1.03125', exactX + 18, yE4 - 50, 26, COSMOS.blue, 'mono', 'left').opacity(
        cp * a,
      ),
      // E4M3 stored marker only after revealE4
      ...(e4 > 0.02
        ? [
            glowDot(e4StoreX, yE4 + 16, { radius: 9, color: COSMOS.rose, opacity: e4 * a }),
            txt('falls back to 1.0', rx0 + 130, yE4 + 54, 26, COSMOS.rose, 'mono', 'left').opacity(
              e4 * a,
            ),
          ]
        : []),

      // E4M3 right readout box (withheld until revealE4)
      glassCell(625, yE4, 430, 128, e4 > 0.5 ? COSMOS.rose : COSMOS.gold, {
        fill: '#181426',
        glow: 8,
        opacity: a,
      }),
      txt('E4M3 STORED WEIGHT', 625, yE4 - 30, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        e4 > 0.5 ? '1.000 (stalled!)' : '?',
        625,
        yE4 + 22,
        e4 > 0.5 ? 34 : 46,
        e4 > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      )
        .glow(7, e4 > 0.5 ? COSMOS.rose : COSMOS.gold)
        .opacity(a),

      // BF16 ruler (16 subdivisions, step = 1/128)
      txt(
        'BF16 RULER · STEP = 1/128 (0.0078125)',
        rx0,
        yBF - 82,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),
      line([rx0, yBF], [rx1, yBF], { stroke: '#4c5f8a', width: 3.4 }).opacity(a),
    ];

    for (let i = 0; i <= 16; i++) {
      const tx = mapX(1.0 + i / 128);
      const isMajor = i === 0 || i === 4 || i === 16;
      nodes.push(
        line([tx, yBF - (isMajor ? 24 : 13)], [tx, yBF + (isMajor ? 24 : 13)], {
          stroke: i === 4 && bf > 0.5 ? COSMOS.emerald : COSMOS.cyan,
          width: isMajor ? 3.2 : 1.6,
        }).opacity(a),
      );
    }
    nodes.push(
      txt('1.000', rx0, yBF + 54, 26, COSMOS.ink, 'mono').opacity(a),
      txt(
        '1.03125',
        bfStoreX,
        yBF + 54,
        26,
        bf > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt('1.125', rx1, yBF + 54, 26, COSMOS.ink, 'mono').opacity(a),
      glowDot(exactX, yBF - 18, { radius: 8, color: COSMOS.blue, opacity: a }),
      ...(bf > 0.02
        ? [glowDot(bfStoreX, yBF + 16, { radius: 9, color: COSMOS.emerald, opacity: bf * a })]
        : []),
      // BF16 right readout box (withheld until revealBF)
      glassCell(625, yBF, 430, 128, bf > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#101d24',
        glow: 8,
        opacity: a,
      }),
      txt('BF16 STORED WEIGHT', 625, yBF - 30, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        bf > 0.5 ? '1.03125 (kept!)' : '?',
        625,
        yBF + 22,
        bf > 0.5 ? 34 : 46,
        bf > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(7, bf > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
      txt(
        e4 > 0.5 && bf > 0.5
          ? 'Repeated small updates stall in E4M3 unless you keep a remainder or wider master weight'
          : 'With round-to-nearest-even, which stored weight moves?',
        0,
        368,
        28,
        e4 > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2 (Beats 2-4): Stochastic rounding on E4M3 gap [1.0, 1.125]
  // STRICT PREDICTION WITHHOLDING: 8% / 92% and E[SR] stay concealed until round-mass & round-expectation!
  const part2 = guardedDynamic(showPart2, (a) => {
    const xVal = trialPos.value;
    const ms = revealMass.value;
    const ex = revealExp.value;
    const lm = showLimits.value;
    const pUp = (xVal - 1.0) / 0.125;
    const pLo = 1 - pUp;
    const rx0 = -760;
    const rx1 = 760;
    const ry = -115;
    const mapX = (v) => rx0 + ((v - 1.0) / 0.125) * (rx1 - rx0);
    const px = mapX(xVal);

    const nodes = [
      txt(
        'E4M3 NEIGHBOR GAP [1.000, 1.125] · WIDTH = 0.125',
        0,
        ry - 92,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      line([rx0, ry], [rx1, ry], { stroke: '#4c5f8a', width: 4 }).opacity(a),
      line([rx0, ry - 30], [rx0, ry + 30], { stroke: COSMOS.cyan, width: 4.2 }).opacity(a),
      line([rx1, ry - 30], [rx1, ry + 30], { stroke: COSMOS.gold, width: 4.2 }).opacity(a),
      txt('Lower neighbor: 1.000', rx0, ry + 60, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('Upper neighbor: 1.125', rx1, ry + 60, 28, COSMOS.gold, 'mono', 'right').opacity(a),
      // Active input probe
      glowDot(px, ry - 18, { radius: 10, color: COSMOS.blue, opacity: a }),
      txt(`x = ${xVal.toFixed(3)}`, px, ry - 52, 30, COSMOS.blue, 'mono')
        .glow(5, COSMOS.blue)
        .opacity(a),
    ];

    // Probability mass bar (concealed as '?' during Beat 2 prediction!)
    const barY = 95;
    const barW = 1120;
    const barX0 = -560;
    nodes.push(
      txt('STOCHASTIC ROUNDING PROBABILITY SPLIT', 0, barY - 68, 26, COSMOS.muted, 'mono').opacity(
        a,
      ),
      rect(barW, 56, { fill: '#12192c', stroke: '#3a4b73', width: 2, radius: 10 })
        .at(0, barY)
        .opacity(a),
    );
    if (ms > 0.02) {
      const loW = barW * pLo * ms;
      const upW = barW * pUp * ms;
      if (loW > 4) {
        nodes.push(
          rect(loW, 52, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1, radius: 8 })
            .at(barX0 + loW * 0.5, barY)
            .opacity(0.85 * a),
        );
      }
      if (upW > 4) {
        nodes.push(
          rect(upW, 52, { fill: COSMOS.gold, stroke: '#ffffff', width: 1, radius: 8 })
            .at(barX0 + loW + upW * 0.5, barY)
            .glow(8, COSMOS.gold)
            .opacity(0.95 * a),
        );
      }
      nodes.push(
        txt(
          `p(1.0) = ${Math.round(pLo * 100)}%`,
          -540,
          barY + 62,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(ms * a),
        txt(
          `p(1.125) = ${Math.round(pUp * 100)}%`,
          540,
          barY + 62,
          28,
          COSMOS.gold,
          'mono',
          'right',
        )
          .glow(6, COSMOS.gold)
          .opacity(ms * a),
      );
    } else {
      nodes.push(
        txt(
          'p(1.0) = ?   ·   p(1.125) = ?   (How often pick upper tick?)',
          0,
          barY,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(a),
      );
    }

    // Bottom expectation & saturation limit cards (fixed left/right slots so zero overlap during fade!)
    if (ex > 0.02) {
      nodes.push(
        glassCell(-430, 330, 760, 140, COSMOS.emerald, {
          fill: '#0e2224',
          glow: 9,
          opacity: ex * a,
        }),
        txt('EXPECTED STORED VALUE', -430, 290, 26, COSMOS.muted, 'mono').opacity(ex * a),
        txt(
          xVal > 1.1
            ? '100% × 1.125 = 1.125 (exact tick)'
            : `0.92 × 1 + 0.08 × 1.125 = ${SR_101.expected.toFixed(2)}`,
          -430,
          348,
          32,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(ex * a),
      );
    }
    if (lm > 0.02) {
      nodes.push(
        glassCell(430, 330, 760, 140, COSMOS.rose, { fill: '#221120', glow: 8, opacity: lm * a }),
        txt('SATURATION LIMIT · NVFP4 GRADIENTS', 430, 290, 26, COSMOS.rose, 'mono').opacity(
          lm * a,
        ),
        txt(
          '500 clips to 448 (no upper neighbor → biased)',
          430,
          348,
          28,
          COSMOS.ink,
          'sans',
        ).opacity(lm * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);
  runPhase(s, c, phase, 16);

  c.on('round-candidate', () =>
    s.play(candProg.to(1, { duration: remainDuration(c, 'round-candidate', 0.65) })),
  );
  c.on('round-store', () =>
    s.play(revealE4.to(1, { duration: remainDuration(c, 'round-store', 0.45) })),
  );
  c.on('round-bf16', () =>
    s.play(revealBF.to(1, { duration: remainDuration(c, 'round-bf16', 0.45) })),
  );

  c.on('round-trial', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('round-mass', () =>
    s.play(revealMass.to(1, { duration: remainDuration(c, 'round-mass', 0.5) })),
  );
  c.after('round-expectation', () =>
    s.play(revealExp.to(1, { duration: afterDuration(c, 'round-expectation', 0.45) })),
  );
  c.on('round-exact', () =>
    s.play(trialPos.to(1.125, { duration: remainDuration(c, 'round-exact', 0.55) })),
  );
  c.on('round-limits', () =>
    s.play(showLimits.to(1, { duration: remainDuration(c, 'round-limits', 0.45) })),
  );
}
