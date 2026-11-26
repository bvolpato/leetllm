// Scene 21: Align scorers, then expose shared error: ensemble [2,4,6] LCB = 2 vs shared blind spot [5,5,5] LCB = 5.
import {
  COSMOS,
  ENS_SHARED,
  ENS_SPREAD,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ensembleDisagreement(s, c) {
  const phase = s.value(0);
  const showMean = s.value(0.35);
  const showSd = s.value(0);
  const showLcb = s.value(0);
  const blindBlend = s.value(0); // 0 = [2,4,6], 1 = [5,5,5]
  const showSharedWarn = s.value(0);

  const bgAura = aura(150, 15, 580, '#a78bfa22', '#ff6b8b16');
  const title = heroTitle(['Ensembles &', 'Shared Blind Spots'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'LOWER CONFIDENCE BOUND · μ - λ·σ',
  });

  const eq = glowTex(String.raw`r_{\text{LCB}}(x, y) = \mu(x, y) - \lambda\,\sigma(x, y)`, {
    x: 400,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sm = showMean.value;
    const ss = showSd.value;
    const sl = showLcb.value;
    const bb = blindBlend.value;
    const sw = showSharedWarn.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.5);

    const s1 = 2 + 3 * bb; // 2 -> 5
    const s2 = 4 + 1 * bb; // 4 -> 5
    const s3 = 6 - 1 * bb; // 6 -> 5
    const mean = (s1 + s2 + s3) / 3;
    const sd = Math.sqrt(((s1 - mean) ** 2 + (s2 - mean) ** 2 + (s3 - mean) ** 2) / 2);
    const lcb = mean - sd;

    // Wide horizontal score line 0..7
    const ax0 = -760;
    const ax1 = 760;
    const ay = 10;
    const mapX = (v) => ax0 + (v / 7.0) * (ax1 - ax0);

    const isBlind = bb > 0.5;
    const aggCol = isBlind ? COSMOS.rose : COSMOS.emerald;

    const nodes = [
      txt(
        isBlind
          ? 'FABRICATED CITATION: ALL 3 SCORERS AGREE AT 5'
          : '3 ALIGNED SCORERS ON UNCERTAIN OUTPUT (λ = 1)',
        0,
        -195,
        30,
        isBlind ? COSMOS.rose : COSMOS.violet,
        'mono',
      ).glow(6, isBlind ? COSMOS.rose : COSMOS.violet),

      // Number line
      line([ax0, ay], [ax1, ay], { stroke: '#455885', width: 3 }),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((v) =>
        group(
          line([mapX(v), ay - 8], [mapX(v), ay + 8], { stroke: '#5a6f9c', width: 2 }),
          txt(String(v), mapX(v), ay + 58, 26, COSMOS.muted, 'mono'),
        ),
      ),

      // Spread band [mean - sd, mean + sd]
      ...(sd > 0.08
        ? [
            glowingTrail(
              [
                [mapX(mean - sd), ay],
                [mapX(mean + sd), ay],
              ],
              { color: COSMOS.violet, width: 10, opacity: 0.45 * Math.max(0.4, ss), glow: 12 },
            ),
          ]
        : []),

      // Three scorer markers
      glowDot(mapX(s1), ay - 44 * (1 - bb), { radius: 11, color: COSMOS.cyan }),
      glowDot(mapX(s2), ay - 76 * (1 - bb), { radius: 11, color: COSMOS.violet }),
      glowDot(mapX(s3), ay - 44 * (1 - bb), { radius: 11, color: COSMOS.blue }),
      txt(
        isBlind ? 'S₁ = S₂ = S₃ = 5' : `S₁=${s1.toFixed(0)}`,
        mapX(s1),
        ay - (isBlind ? 78 : 84),
        28,
        isBlind ? COSMOS.rose : COSMOS.cyan,
        'mono',
      ),
      ...(!isBlind
        ? [
            txt(`S₂=${s2.toFixed(0)}`, mapX(s2), ay - 122, 28, COSMOS.violet, 'mono'),
            txt(`S₃=${s3.toFixed(0)}`, mapX(s3), ay - 84, 28, COSMOS.blue, 'mono'),
          ]
        : []),

      // Mean beacon (strictly above axis so it never crosses tick numbers) & LCB beacon
      line([mapX(mean), ay - 14], [mapX(mean), ay - 56], {
        stroke: COSMOS.gold,
        width: 2.5,
        dash: [5, 5],
      }).opacity(Math.max(0.45, sm)),
      glowDot(mapX(lcb), ay, { radius: 11, color: aggCol, opacity: Math.max(0.4, sl) }),
      circle(15 + pulse * 5, { fill: null, stroke: aggCol, width: 2.2 })
        .at(mapX(lcb), ay)
        .opacity(0.7 * Math.max(0.4, sl))
        .set('blend', 'screen'),

      // 3 clean floating telemetry columns below axis (NO boxed cards)
      txt('MEAN  μ', -580, 175, 26, COSMOS.muted, 'mono'),
      txt(mean.toFixed(1), -580, 245, 68, COSMOS.gold, 'mono')
        .glow(8, COSMOS.gold)
        .opacity(Math.max(0.45, sm)),

      txt('SAMPLE SD  σ', 0, 175, 26, COSMOS.muted, 'mono'),
      txt(sd.toFixed(1), 0, 245, 68, isBlind ? COSMOS.rose : COSMOS.violet, 'mono')
        .glow(8, isBlind ? COSMOS.rose : COSMOS.violet)
        .opacity(Math.max(0.45, ss)),

      txt('CONSERVATIVE  μ - σ', 580, 175, 26, COSMOS.muted, 'mono'),
      txt(lcb.toFixed(1), 580, 245, 68, aggCol, 'mono')
        .glow(10, aggCol)
        .opacity(Math.max(0.45, sl)),

      // Bottom takeaway
      line([-855, 330], [810, 330], { stroke: '#253355', width: 2 }),
      txt(
        sw > 0.4
          ? `Shared blind spot: σ = ${ENS_SHARED.sd} → score stays ${ENS_SHARED.aggregate} · source check needed!`
          : `Spread penalty: ${ENS_SPREAD.mean} - ${ENS_SPREAD.sd} = ${ENS_SPREAD.aggregate} · align scales before combining`,
        0,
        392,
        28,
        sw > 0.4 ? COSMOS.rose : COSMOS.cyan,
        'mono',
      ).glow(sw > 0.4 ? 7 : 5, sw > 0.4 ? COSMOS.rose : COSMOS.cyan),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('ensemble-mean', () => s.play(showMean.to(1, { duration: 0.4 })));
  c.on('ensemble-sd', () => s.play(showSd.to(0.75, { duration: 0.4 })));
  c.on('ensemble-disagreement-step-1', () => s.play(showSd.to(1, { duration: 0.4 })));
  c.on('ensemble-disagreement-step-2', () => s.play(showLcb.to(1, { duration: 0.5 })));
  c.on('ensemble-shared', () => s.play(blindBlend.to(1, { duration: 0.75 })));
  c.on('ensemble-disagreement-step-3', () =>
    s.play(
      showSharedWarn.to(1, { duration: remainDuration(c, 'ensemble-disagreement-step-3', 0.45) }),
    ),
  );
}
