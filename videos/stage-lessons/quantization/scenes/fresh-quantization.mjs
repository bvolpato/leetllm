// Scene 31: fresh-quantization: 6B parcel service on 8.0 GB device (4.0 GB cache + 0.75 GB other): File A fits (7.9375 GB) but scores 80/100 (<85); File B is 8.125 GB (>8.0 GB, needs 3.875 GB cache with 0 headroom) -> predict? -> AFTER service-decision reveal HOLD BOTH FILES!
import {
  COSMOS,
  FRESH_3875,
  FRESH_4,
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

export default function freshQuantization(s, c) {
  const showTotals = s.value(0);
  const showTightB = s.value(0);
  const showTaskGate = s.value(0);
  const revealDecision = s.value(0); // strictly withheld until AFTER service-decision!

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Final Release Decision:', 'Memory Budget + Task Accuracy Gate'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tot = showTotals.value;
    const tb = showTightB.value;
    const tg = showTaskGate.value;
    const dec = revealDecision.value;

    const barX = -500;
    const maxW = 720;
    const px = maxW / 8.8;
    const lim8X = barX + 8.0 * px;
    const tightActive = tb > 0.35 && tg < 0.35;
    const bVal = tightActive ? FRESH_3875.totalB : FRESH_4.totalB;

    const nodes = [
      txt(
        '6B PARCEL SERVICE  |  8.0 GB DEVICE  |  REQ: 4.0 GB CACHE + 0.75 GB OTHER + >= 85/100 ACCURACY',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      lumBar(lim8X - 2, -148, 4, 34, ROLE.gold, { opacity: alpha, glow: 8 }),
      lumBar(lim8X - 2, 118, 4, 34, ROLE.gold, { opacity: alpha, glow: 8 }),
      txt('8.0 GB LIMIT', lim8X, -184, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      // File A row: 3.0 codes + 0.1875 scales + 4.75 = 7.9375 GB (fits +62.5 MB, accuracy 80/100 FAIL)
      txt('File A (4b + g64)', -855, -80, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, -80, FRESH_4.totalA * px, 44, tg > 0.35 ? ROLE.err : ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * tot),
        maxTrackW: maxW,
      }),
      txt(
        tg > 0.35
          ? '7.94 GB (OK)  |  80/100 (<85!)'
          : `${FRESH_4.totalA.toFixed(4)} GB (+62.5 MB free)`,
        barX + maxW + 24,
        -80,
        26,
        tg > 0.35 ? ROLE.err : ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * tot)),

      // File B row: 3.375 block weights + 4.75 = 8.125 GB (125 MB over!)
      txt('File B (4.5 bpw)', -855, 50, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, 50, bVal * px, 44, tightActive ? ROLE.gold : ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * tot),
        maxTrackW: maxW,
      }),
      txt(
        tightActive
          ? '8.000 GB (3.875 cache, 0 margin)'
          : tg > 0.35
            ? '8.125 GB (+125 MB, untested)'
            : `${FRESH_4.totalB.toFixed(3)} GB (+125 MB OVER!)`,
        barX + maxW + 24,
        50,
        26,
        tightActive ? ROLE.gold : ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * tot)),

      chipPill(
        dec > 0.4
          ? 'HOLD BOTH FILES! File A misses 85/100 by 5 deliveries; File B needs 125 MB more VRAM for 4 GB cache!'
          : tg > 0.35
            ? 'With required 4.0 GB cache restored and >= 85/100 accuracy required, which file meets both?'
            : tightActive
              ? 'Dropping cache to 3.875 GB hits 8.000 GB with zero headroom (below service cache requirement)'
              : 'File A (7.9375 GB) fits with 62.5 MB spare; File B (8.125 GB) overflows 8.0 GB by 125 MB',
        0,
        215,
        {
          w: 1640,
          h: 80,
          color: dec > 0.4 ? ROLE.err : ROLE.gold,
          fill: dec > 0.4 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        'Next candidate: reload saved file, route identical parcels, measure peak VRAM & token timing!',
        0,
        320,
        26,
        dec > 0.4 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'fresh-quantization-build-0', (d) => s.play(showTotals.to(0, { duration: d })));
  playCue(s, c, 'a-code-bytes', (d) => s.play(showTotals.to(0.3, { duration: d })));
  playCue(s, c, 'a-scale-bytes', (d) => s.play(showTotals.to(0.5, { duration: d })));
  playCue(s, c, 'b-block-bytes', (d) => s.play(showTotals.to(0.7, { duration: d })));
  playCue(s, c, 'fresh-quantization-build-1', (d) => s.play(showTotals.to(0.85, { duration: d })));
  playCue(s, c, 'fresh-a-total', (d) => s.play(showTotals.to(0.95, { duration: d })));
  playCue(s, c, 'fresh-b-total', (d) => s.play(showTotals.to(1, { duration: d })));
  playCue(s, c, 'fresh-quantization-build-2', (d) => s.play(showTightB.to(0.4, { duration: d })));
  playCue(s, c, 'fresh-cache-input', (d) => s.play(showTightB.to(0.8, { duration: d })));
  playCue(s, c, 'fresh-cache-boundary', (d) => s.play(showTightB.to(1, { duration: d })));
  playCue(s, c, 'restore-required-cache', (d) => s.play(showTaskGate.to(0.5, { duration: d })));
  playCue(s, c, 'apply-task-minimum', (d) => s.play(showTaskGate.to(1, { duration: d })));
  // Strict prediction withholding: reveal HOLD BOTH FILES only after service-decision!
  playCue(s, c, 'service-decision', (d) => s.play(revealDecision.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'delivery-shortfall', (d) => s.play(revealDecision.to(1, { duration: d })));
  playCue(s, c, 'memory-shortfall', (d) => s.play(revealDecision.to(1, { duration: d })));
}
