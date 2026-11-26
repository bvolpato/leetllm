// Scene 25: closing: Counterfactual second export swaps Search & Checkout; green trace still rises 5.2->9.0 -> answer is Search!
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  dashboardChartNodes,
  group,
  guardedDynamic,
  heroTitle,
  line,
  originalKey,
  playCue,
  rect,
  secondKey,
  txt,
} from '../parts.mjs';

export default function closing(s, c) {
  const showFixed = s.value(0);
  const showTrace = s.value(0);
  const showSwap = s.value(0);
  const showSearch = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#10382e26');
  const title = heroTitle(['Check a Second Export:', 'Does the Answer Follow?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fx = showFixed.value;
    const tr = showTrace.value;
    const sw = showSwap.value;
    const sr = showSearch.value;

    const colors = [ROLE.text, ROLE.ok, ROLE.warn];

    const nodes = [
      // Top control invariant bar
      chipPill(
        'FIXED: same question + same connector + same visual prefix + same 5.2 -> 9.0 trace',
        0,
        -245,
        {
          w: 1560,
          h: 62,
          color: fx > 0.3 ? ROLE.vision : '#384c76',
          size: 26,
          glow: fx > 0.3 ? 10 : 4,
          opacity: alpha,
        },
      ),

      // Left: Shared latency chart (5.2 -> 9.0 ms)
      dashboardChartNodes(-855, -160, 740, 355, {
        hour: 6,
        showReadings: true,
        highlightGreen: tr > 0.3,
        opacity: alpha,
        caption: 'SAME GREEN TRACE: 5.2 -> 9.0 ms',
      }),

      // Right top: Export 1 Legend (Checkout)
      txt('EXPORT 1 LEGEND', 210, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      rect(370, 260, { fill: '#0c1324', stroke: '#33486e', width: 2.2, radius: 12 })
        .at(210, -10)
        .opacity(alpha),
      ...originalKey.flatMap((name, i) => {
        const y = -90 + i * 78;
        return [
          line([55, y], [118, y], { stroke: colors[i], width: 7 }).opacity(alpha),
          txt(name, 138, y, 28, colors[i], 'mono', 'left').opacity(alpha),
        ];
      }),
      chipPill('Export 1 -> Checkout', 210, 168, {
        w: 370,
        h: 58,
        color: ROLE.ok,
        size: 26,
        opacity: alpha,
      }),

      // Right far: Export 2 Legend (Swapped Blue <-> Green!)
      txt(
        sw > 0.3 ? 'EXPORT 2 (SWAPPED!)' : 'EXPORT 2 LEGEND',
        665,
        -165,
        26,
        sw > 0.3 ? ROLE.gold : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      rect(370, 260, {
        fill: '#0c1324',
        stroke: sr > 0.4 ? ROLE.ok : sw > 0.3 ? ROLE.gold : '#33486e',
        width: sr > 0.4 || sw > 0.3 ? 3 : 2.2,
        radius: 12,
      })
        .at(665, -10)
        .glow(sr > 0.4 ? 12 : sw > 0.3 ? 8 : 0, sr > 0.4 ? ROLE.ok : ROLE.gold)
        .opacity(alpha),
      ...(sw > 0.3 ? secondKey : originalKey).flatMap((name, i) => {
        const y = -90 + i * 78;
        const isTarget = i === 1;
        return [
          line([510, y], [573, y], {
            stroke: colors[i],
            width: isTarget && sr > 0.4 ? 10 : 7,
          }).opacity(alpha),
          txt(name, 593, y, isTarget && sr > 0.4 ? 32 : 28, colors[i], 'mono', 'left')
            .glow(isTarget && sr > 0.4 ? 10 : 0, colors[i])
            .opacity(alpha),
        ];
      }),

      // Strict prediction withholding: reveal "Search" answer ONLY after closing-name-line!
      chipPill(sr > 0.4 ? 'Export 2 -> SEARCH!' : 'Export 2 -> ?', 665, 168, {
        w: 370,
        h: 58,
        color: sr > 0.4 ? ROLE.ok : ROLE.gold,
        fill: sr > 0.4 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: sr > 0.4 ? 14 : 6,
        opacity: alpha,
      }),

      // Footer
      txt(
        sr > 0.4
          ? 'If the reader says Checkout twice, inspect legend binding; compare context, KV, latency & accuracy'
          : 'Blue and green labels traded places: which service slowed down in Export 2?',
        0,
        305,
        26,
        sr > 0.4 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'closing-beat-1-focus-2', (d) => s.play(showFixed.to(1, { duration: d })));
  playCue(s, c, 'closing-read-trace', (d) => s.play(showTrace.to(1, { duration: d })));
  playCue(s, c, 'closing-second-key', (d) => s.play(showSwap.to(1, { duration: d })));
  // Strict prediction withholding: reveal Search only after closing-name-line!
  playCue(s, c, 'closing-name-line', (d) => s.play(showSearch.to(1, { duration: d })), {
    after: true,
  });
}
