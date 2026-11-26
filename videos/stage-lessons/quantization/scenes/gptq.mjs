// Scene 12: gptq: Source (1.2, 0.61) -> Nearest (1, 1) err 0.5402 -> Round w1=1 -> predict shift? -> AFTER compensate-free-weight reveal +0.9 (w2=1.51) -> predict int? -> AFTER round-adjusted-weight reveal w2=2 (err 0.5002!).
import {
  COSMOS,
  GPTQ_COMP,
  GPTQ_FINAL,
  GPTQ_NEAR,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function gptq(s, c) {
  const showShortfall = s.value(0);
  const revealShift = s.value(0); // strictly withheld until AFTER compensate-free-weight!
  const revealFinal = s.value(0); // strictly withheld until AFTER round-adjusted-weight!

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['GPTQ Error Compensation:', 'Adjusting the Free Weight'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sf = showShortfall.value;
    const sh = revealShift.value;
    const fn = revealFinal.value;

    const barX = -460;
    const maxW = 920;
    const px = maxW / 0.7;

    const nodes = [
      txt(
        'SOURCE WEIGHTS (1.20, 0.61)  |  TARGETS: y1 = 6.61,  y2 = 5.41',
        -855,
        -225,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Step cards across top
      rect(490, 145, { fill: '#10203a', stroke: ROLE.weight, width: 2.6, radius: 12 })
        .at(-580, -90)
        .opacity(alpha),
      txt('1. NEAREST ROUNDING', -580, -130, 26, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('w = (1, 1) -> y = (6.0, 5.0)', -580, -84, 26, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `Sq Err = ${GPTQ_NEAR.error.toFixed(4)}`,
        -580,
        -40,
        28,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      rect(520, 145, {
        fill: sh > 0.35 ? '#0f2d24' : '#261e10',
        stroke: sh > 0.35 ? ROLE.ok : ROLE.gold,
        width: 2.8,
        radius: 12,
      })
        .at(0, -90)
        .opacity(alpha * (0.5 + 0.5 * sf)),
      txt(
        '2. FIX w1 = 1 & SHIFT w2',
        0,
        -130,
        26,
        sh > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.5 + 0.5 * sf)),
      txt(
        sh > 0.35
          ? `Add +0.90 -> w2 = ${GPTQ_COMP.weights[1].toFixed(2)}`
          : 'Shortfalls -1.0, -0.8 -> +?',
        0,
        -84,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha * (0.5 + 0.5 * sf)),
      txt(
        sh > 0.35 ? 'Which integer is closest?' : 'Split the difference',
        0,
        -40,
        26,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.5 + 0.5 * sf)),

      rect(490, 145, {
        fill: fn > 0.35 ? '#0f2d24' : '#10182d',
        stroke: fn > 0.35 ? ROLE.ok : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(580, -90)
        .opacity(alpha * (0.48 + 0.52 * sh)),
      txt(
        '3. ROUND ADJUSTED w2',
        580,
        -130,
        26,
        fn > 0.35 ? ROLE.ok : ROLE.grid,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * sh)),
      txt(
        fn > 0.35 ? 'w = (1, 2) -> y = (7.0, 6.0)' : 'w = (1, ?)',
        580,
        -84,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * sh)),
      txt(
        fn > 0.35 ? `Sq Err = ${GPTQ_FINAL.error.toFixed(4)}!` : 'Sq Err = ?',
        580,
        -40,
        28,
        fn > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * sh)),

      // Squared error comparison bars
      txt('Nearest (1, 1)', -855, 75, 28, ROLE.weight, 'mono', 'left').opacity(alpha),
      lumBar(barX, 75, GPTQ_NEAR.error * px, 40, ROLE.weight, { opacity: alpha, maxTrackW: maxW }),
      txt(
        GPTQ_NEAR.error.toFixed(4),
        barX + maxW + 24,
        75,
        28,
        ROLE.weight,
        'mono',
        'left',
      ).opacity(alpha),

      txt('GPTQ (1, ?)', -855, 165, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * fn),
      ),
      lumBar(barX, 165, fn > 0.35 ? GPTQ_FINAL.error * px : 24, 40, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * fn),
        maxTrackW: maxW,
      }),
      txt(
        fn > 0.35 ? `${GPTQ_FINAL.error.toFixed(4)} (-0.04!)` : '? (predict)',
        barX + maxW + 24,
        165,
        28,
        fn > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(
        fn > 0.35
          ? 'GPTQ rounds w1 -> shifts free w2 from 0.61 to 1.51 -> rounds to 2 -> calibration error drops!'
          : sh > 0.35
            ? 'Free weight moved from 0.61 to 1.51: which whole number is closer now?'
            : 'Rounding w1=1 leaves shortfalls (-1.0, -0.8): what shift to w2 splits the difference?',
        0,
        285,
        {
          w: 1620,
          h: 74,
          color: fn > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'source-products', (d) => s.play(showShortfall.to(0, { duration: d })));
  playCue(s, c, 'nearest-rounding', (d) => s.play(showShortfall.to(0, { duration: d })));
  playCue(s, c, 'round-first-weight', (d) => s.play(showShortfall.to(0.6, { duration: d })));
  playCue(s, c, 'two-shortfalls', (d) => s.play(showShortfall.to(1, { duration: d })));
  // Strict prediction withholding #1: reveal +0.90 / 1.51 only after compensate-free-weight!
  playCue(s, c, 'compensate-free-weight', (d) => s.play(revealShift.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'nearest-free-code', (d) => s.play(revealShift.to(1, { duration: d })));
  // Strict prediction withholding #2: reveal 2 / 0.5002 only after round-adjusted-weight!
  playCue(s, c, 'round-adjusted-weight', (d) => s.play(revealFinal.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'compare-output-errors', (d) => s.play(revealFinal.to(1, { duration: d })));
}
