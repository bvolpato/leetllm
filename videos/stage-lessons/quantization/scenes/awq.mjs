// Scene 16: awq: Salient channel avg |x|=9 vs 1 -> w=0.3, x=10 -> rescale w*8=2.4, x/8=1.25 -> predict product? -> AFTER fixed-product reveal STILL 3.0 -> rounding stays 3.0 vs 2.86!
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function awq(s, c) {
  const showRescale = s.value(0);
  const revealProd = s.value(0); // strictly withheld until AFTER fixed-product!
  const showRound = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(
    ['Activation-Aware Quantization (AWQ):', 'Protect Salient Channels by Rescaling'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.ok,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rs = showRescale.value;
    const pr = revealProd.value;
    const rd = showRound.value;

    const barX = -480;
    const maxW = 700;

    const nodes = [
      txt(
        'SALIENT CHANNEL: AVG |x| = 9 (VS 1)  |  SINGLE SAMPLE: w = 0.3,  x = 10',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Original pair
      txt('Original (s = 1)', -855, -100, 28, ROLE.weight, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, maxW * 0.35, 42, ROLE.weight, { opacity: alpha, maxTrackW: maxW }),
      txt(
        rd > 0.35 ? '0.3x10 = 3.0 -> rounds 2.86' : 'w = 0.3, x = 10 -> w·x = 3.0',
        barX + maxW + 24,
        -100,
        26,
        rd > 0.35 ? ROLE.err : ROLE.weight,
        'mono',
        'left',
      ).opacity(alpha),

      // Rescaled pair (s = 8)
      txt('Rescaled (s = 8)', -855, 40, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * rs),
      ),
      lumBar(barX, 40, rs > 0.35 ? maxW * 0.92 : 24, 42, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * rs),
        maxTrackW: maxW,
      }),
      txt(
        rd > 0.35
          ? '2.4x1.25 = 3.0 -> EXACT 3.0!'
          : pr > 0.35
            ? '(0.3x8)(10/8) = 3.00!'
            : rs > 0.35
              ? 'w = 2.4, x = 1.25 -> w·x = ?'
              : 'Multiply w by 8, divide x by 8',
        barX + maxW + 24,
        40,
        26,
        pr > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(
        rd > 0.35
          ? 'Salient channel lands exact (3.00 vs 2.86), while AWQ searches s to balance shared-grid error!'
          : pr > 0.35
            ? 'Exact math identity: (w · s)(x / s) = w · x = 3.0, yet the grid now sees w = 2.4!'
            : 'Multiply w by 8 (0.3 -> 2.4) and divide x by 8 (10 -> 1.25): what happens to their product?',
        0,
        220,
        {
          w: 1620,
          h: 78,
          color: pr > 0.35 ? ROLE.ok : ROLE.gold,
          fill: pr > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'activation-magnitudes', (d) => s.play(showRescale.to(0, { duration: d })));
  playCue(s, c, 'salient-channel', (d) => s.play(showRescale.to(0, { duration: d })));
  playCue(s, c, 'rescale-pair', (d) => s.play(showRescale.to(1, { duration: d })));
  // Strict prediction withholding: reveal product STILL 3.0 only after fixed-product!
  playCue(s, c, 'fixed-product', (d) => s.play(revealProd.to(1, { duration: d })), { after: true });
  playCue(s, c, 'round-rescaled', (d) => s.play(showRound.to(1, { duration: d })));
  playCue(s, c, 'calibration-search', (d) => s.play(showRound.to(1, { duration: d })));
}
