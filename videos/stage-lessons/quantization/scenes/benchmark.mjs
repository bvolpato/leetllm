// Scene 28: benchmark: Decode reads vs prefill reuse -> 8 GiB budget with 2 GiB cache (fits 6.37 GiB) -> double cache to 4 GiB -> predict fit? -> AFTER budget-overflow reveal 8.37 GiB > 8 GiB -> restore 2 GiB!
import {
  COSMOS,
  MEM_2G,
  MEM_4G,
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

export default function benchmark(s, c) {
  const showPhase = s.value(0);
  const doubleCache = s.value(0);
  const revealOverflow = s.value(0); // strictly withheld until AFTER budget-overflow!
  const restoreFit = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Benchmarking Both Phases:', 'Decode, Prefill & Growing Context'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ph = showPhase.value;
    const dbl = doubleCache.value;
    const ovf = revealOverflow.value;
    const rst = restoreFit.value;

    const barX = -760;
    const maxW = 1360;
    const px = maxW / 9.5;
    const cap8X = barX + 8 * px;
    const wW = MEM_2G.weights * px;
    const oW = MEM_2G.other * px;
    const isDoubled = dbl > 0.35 && rst < 0.35;
    const cacheGb = isDoubled ? (ovf > 0.35 ? 4.0 : 2.3) : 2.0;
    const cW = cacheGb * px;

    const nodes = [
      chipPill('Decode: small batch -> weight-read bound', -435, -185, {
        w: 810,
        h: 68,
        color: ROLE.weight,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Prefill: tokens reuse weights -> compute shifts', 435, -185, {
        w: 810,
        h: 68,
        color: ph > 0.35 ? ROLE.ok : ROLE.grid,
        size: 26,
        opacity: alpha * (0.48 + 0.52 * ph),
      }),

      txt(
        '8.0 GiB BUDGET (WEIGHTS ~3.37 + RUNTIME 1.0 + KV)',
        -855,
        -88,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      lumBar(cap8X - 2, -22, 4, 34, ROLE.err, { opacity: alpha, glow: 8 }),
      lumBar(cap8X - 2, 102, 4, 34, ROLE.err, { opacity: alpha, glow: 8 }),
      txt('8.0 GiB LIMIT', cap8X, -62, 26, ROLE.err, 'mono', 'center').opacity(alpha),

      // Stacked bar
      rect(wW, 64, { fill: ROLE.weight, stroke: null, radius: 6 })
        .at(barX + wW * 0.5, 40)
        .opacity(alpha),
      txt(
        `${MEM_2G.weights.toFixed(2)}`,
        barX + wW * 0.5,
        40,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      rect(oW, 64, { fill: ROLE.code, stroke: null, radius: 6 })
        .at(barX + wW + oW * 0.5, 40)
        .opacity(alpha),
      txt('1.0', barX + wW + oW * 0.5, 40, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      rect(cW, 64, {
        fill: isDoubled && ovf > 0.35 ? ROLE.err : ROLE.ok,
        stroke: isDoubled && ovf <= 0.35 ? ROLE.gold : null,
        width: 2.5,
        radius: 6,
      })
        .at(barX + wW + oW + cW * 0.5, 40)
        .opacity(alpha),
      txt(
        isDoubled ? (ovf > 0.35 ? '4.0 GiB KV' : '4.0 GiB?') : '2.0 GiB KV',
        barX + wW + oW + cW * 0.5,
        40,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      chipPill(
        rst > 0.35
          ? `Restored 2 GiB cache (${MEM_2G.total.toFixed(2)} GiB <= 8 GiB): fits! Now test quality + timing`
          : isDoubled && ovf > 0.35
            ? `OVERFLOW: ${MEM_4G.total.toFixed(2)} > 8.0!`
            : isDoubled
              ? 'Double the attention cache to 4.0 GiB for longer context: will this same file still fit?'
              : `Base 2.0 GiB cache total = ${MEM_2G.total.toFixed(2)} GiB (fits inside 8.0 GiB limit)`,
        0,
        215,
        {
          w: 1600,
          h: 78,
          color: rst > 0.35 ? ROLE.ok : isDoubled && ovf > 0.35 ? ROLE.err : ROLE.gold,
          fill: rst > 0.35 ? '#0f2d24' : isDoubled && ovf > 0.35 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'decode-reads', (d) => s.play(showPhase.to(0, { duration: d })));
  playCue(s, c, 'unpack-scale', (d) => s.play(showPhase.to(0.2, { duration: d })));
  playCue(s, c, 'prefill-reuse', (d) => s.play(showPhase.to(0.7, { duration: d })));
  playCue(s, c, 'phase-balance', (d) => s.play(showPhase.to(1, { duration: d })));
  playCue(s, c, 'attention-memory', (d) => s.play(doubleCache.to(0.2, { duration: d })));
  playCue(s, c, 'context-growth', (d) => s.play(doubleCache.to(1, { duration: d })));
  // Strict prediction withholding: reveal 8.37 GiB overflow only after budget-overflow!
  playCue(s, c, 'budget-overflow', (d) => s.play(revealOverflow.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'restore-context', (d) => s.play(restoreFit.to(1, { duration: d })));
  playCue(s, c, 'matched-models', (d) => s.play(restoreFit.to(1, { duration: d })));
  playCue(s, c, 'quality-time-memory', (d) => s.play(restoreFit.to(1, { duration: d })));
}
