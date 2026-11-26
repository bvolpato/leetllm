// Scene 16: Separate reward origin from reward scale: +10 shift-invariance gauge vs 3x scale stretch.
import {
  COSMOS,
  MARGIN_AB,
  PROB_AB,
  SCORE_A,
  SCORE_B,
  afterDuration,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  runPhase,
  sigmoid,
  stablePairLoss,
  txt,
} from '../parts.mjs';

export default function offsetAndScale(s, c) {
  const phase = s.value(0);
  const shift = s.value(0); // 0 -> 10 -> 0
  const scale = s.value(1); // 1 -> 3
  const revealShiftProb = s.value(0); // strictly 0 during Beat 0 prediction hold!
  const revealScaleProb = s.value(0);

  const bgAura = aura(150, 15, 580, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Origin Is Free,', 'Scale Is Not'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'SHIFT INVARIANCE (r + c)  VS  RESCALING (k · r)',
  });

  const eq = glowTex(
    String.raw`\sigma\!\big((r_A + c) - (r_B + c)\big) = \sigma(\Delta), \quad \sigma(k\Delta) \neq \sigma(\Delta)`,
    { x: 325, y: -365, size: 32, color: COSMOS.cyan },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sh = shift.value;
    const sc = scale.value;
    const rs = revealShiftProb.value;
    const rk = revealScaleProb.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.5);

    const curA = SCORE_A * sc + sh;
    const curB = SCORE_B * sc + sh;
    const curDelta = curA - curB;
    const curProb = sigmoid(curDelta);
    const curLoss = stablePairLoss(curDelta);

    // Wide horizontal score ruler spanning x=-820..320 for values 0..13
    const ax0 = -810;
    const ax1 = 310;
    const ay = 35;
    const mapR = (v) => ax0 + (v / 13.0) * (ax1 - ax0);
    const xA = mapR(curA);
    const xB = mapR(curB);

    // Strict withholding during Beat 0 after +10 shift: hide probability & loss until revealShiftProb > 0.5
    const predictingShift = sh > 0.5 && rs < 0.5;
    const dialFrac = predictingShift ? 0.08 : curProb;
    const dialCol = sc > 1.5 ? COSMOS.amber : COSMOS.cyan;

    const nodes = [
      // Operation indicator above ruler
      txt(
        sc > 1.3
          ? `RESCALING BY ×${sc.toFixed(1)}`
          : sh > 0.5
            ? `SHIFTING BOTH BY +${sh.toFixed(0)}`
            : 'ORIGINAL SCORES',
        -250,
        -165,
        32,
        sc > 1.3 ? COSMOS.amber : sh > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'mono',
      ).glow(7, sc > 1.3 ? COSMOS.amber : COSMOS.cyan),

      // Score axis
      line([ax0, ay], [ax1, ay], { stroke: '#455885', width: 3 }),
      ...[0, 2, 4, 6, 8, 10, 12].map((v) =>
        group(
          line([mapR(v), ay - 8], [mapR(v), ay + 8], { stroke: '#5a6f9c', width: 2 }),
          txt(String(v), mapR(v), ay + 40, 26, COSMOS.muted, 'mono'),
        ),
      ),

      // Glowing margin bridge connecting B and A
      glowingTrail(
        [
          [xB, ay],
          [xA, ay],
        ],
        { gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald], width: 7, glow: 12 },
      ),
      glowDot(xB, ay, { radius: 12, color: COSMOS.rose }),
      glowDot(xA, ay, { radius: 12, color: COSMOS.emerald }),
      txt(`B = ${curB.toFixed(1)}`, xB, ay - 52, 28, COSMOS.rose, 'mono'),
      txt(`A = ${curA.toFixed(1)}`, xA, ay - 96, 28, COSMOS.emerald, 'mono'),

      // Margin gauge callout under ruler
      txt('SCORE GAP  Δ = r(A) - r(B)', -250, 165, 26, COSMOS.muted, 'mono'),
      txt(
        `Δ = ${curDelta.toFixed(2)}`,
        -250,
        235,
        66,
        sc > 1.3 ? COSMOS.amber : COSMOS.gold,
        'mono',
      ).glow(9, sc > 1.3 ? COSMOS.amber : COSMOS.gold),

      // Right-hand Signature Shift-Invariance Radial Gauge
      radialDial(600, 15, 156, dialFrac, {
        color: dialCol,
        width: 13,
        glow: 12 * pulse,
      }),
      txt('WIN FORECAST', 600, -48, 26, COSMOS.muted, 'mono'),
      txt(
        predictingShift ? '?' : `${(curProb * 100).toFixed(0)}%`,
        600,
        24,
        66,
        predictingShift ? COSMOS.gold : dialCol,
        'mono',
      ).glow(10, predictingShift ? COSMOS.gold : dialCol),
      txt(
        predictingShift ? 'Did P(A ≻ B) rise?' : `loss = ${curLoss.toFixed(2)}`,
        600,
        214,
        28,
        predictingShift ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),

      // Bottom takeaway line
      line([-855, 325], [810, 325], { stroke: '#253355', width: 2 }),
      txt(
        rk > 0.5
          ? '3× scale stretches Δ → 3.30 (96%): shifts reward / KL balance in RLHF'
          : rs > 0.5
            ? 'Adding +10 cancels out: Δ stays 1.10, P stays 75%, loss stays 0.29'
            : predictingShift
              ? 'Both markers moved to 11.8 and 10.7 · check the gap!'
              : `Baseline: Δ = ${MARGIN_AB.toFixed(1)}, σ(Δ) = ${(PROB_AB * 100).toFixed(0)}%`,
        0,
        388,
        30,
        rk > 0.5 ? COSMOS.amber : rs > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('offset-and-scale-b1-1', () => s.play(shift.to(10, { duration: 0.75 })));
  c.after('offset-and-scale-b2-1', () =>
    s.play(revealShiftProb.to(1, { duration: afterDuration(c, 'offset-and-scale-b2-1', 0.4) })),
  );
  c.on('offset-recenter', () => s.play(shift.to(0, { duration: 0.65 })));
  c.on('offset-and-scale-b3-1', () => s.play(scale.to(3, { duration: 0.75 })));
  c.on('offset-and-scale-b3-2', () =>
    s.play(revealScaleProb.to(1, { duration: remainDuration(c, 'offset-and-scale-b3-2', 0.45) })),
  );
}
