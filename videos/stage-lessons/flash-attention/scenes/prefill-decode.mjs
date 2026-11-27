// Scene 25: Count query rows before choosing an inference kernel: Prefill triangle (33.56M) vs Decode line (8,192).
import {
  COSMOS,
  PREFILL_DECODE_RATIO,
  PREFILL_N,
  PREFILL_PAIRS,
  PREFILL_SQUARE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function prefillDecode(s, c) {
  const showPrefill = s.value(0.5);
  const showDecode = s.value(0);
  const showRatio = s.value(0);
  const showLatency = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Prefill vs', 'Decode Queries'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: `N = ${PREFILL_N.toLocaleString('en-US')} TOKENS PER HEAD`,
  });

  const live = guardedDynamic(1, () => {
    const pf = showPrefill.value;
    const dc = showDecode.value;
    const rt = showRatio.value;
    const lt = showLatency.value;

    const nodes = [
      line([0, -245], [0, 250], { stroke: '#253355', width: 2, dash: [8, 8] }).opacity(0.65),

      // LEFT: Prefill (8,192 x 8,192 square with glowing causal lower triangle)
      txt('PREFILL · 8,192 QUERY ROWS', -440, -235, 28, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(pf),
    ];

    // 8x8 stylized matrix representing 8192x8192 causal prefill
    const sqSize = 32;
    const sqGap = 4;
    const sx0 = -600;
    const sy0 = -175;
    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 8; col++) {
        const cx = sx0 + col * (sqSize + sqGap) + sqSize * 0.5;
        const cy = sy0 + r * (sqSize + sqGap) + sqSize * 0.5;
        const allowed = col <= r;
        nodes.push(
          rect(sqSize, sqSize, {
            fill: allowed ? COSMOS.cyan : '#14182a',
            stroke: allowed ? '#9cf4ff' : '#2a3658',
            width: 1,
            radius: 3,
          })
            .at(cx, cy)
            .opacity((allowed ? 0.88 : 0.35) * pf),
        );
      }
    }

    nodes.push(
      txt(
        `Valid triangle: ${PREFILL_PAIRS.toLocaleString('en-US')} pairs`,
        -440,
        152,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(pf),
      txt(
        `Allocated square: ${(PREFILL_SQUARE / 1e6).toFixed(1)}M slots`,
        -440,
        198,
        26,
        COSMOS.rose,
        'mono',
      ).opacity(pf),

      // RIGHT: Decode (1 query row x 8,192 valid cached keys)
      txt('DECODE · 1 NEW QUERY ROW', 440, -235, 28, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.28, dc)),
      // Glowing 1 x 8192 strip with photon cleanly below label
      txt('1 query  ×  8,192 valid KV keys', 440, -104, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.28, dc),
      ),
      rect(640, 36, { fill: '#221d12', stroke: COSMOS.gold, width: 2.6, radius: 8 })
        .at(440, -40)
        .glow(10, COSMOS.gold)
        .opacity(Math.max(0.28, dc)),

      txt(
        `Valid pairs: ${PREFILL_N.toLocaleString('en-US')}`,
        440,
        56,
        30,
        COSMOS.emerald,
        'mono',
      ).opacity(Math.max(0.28, dc)),
    );

    if (rt > 0.02) {
      nodes.push(
        glassCell(445, 162, 760, 114, COSMOS.gold, { fill: '#1c1812', glow: 10, opacity: rt }),
        txt(
          `Prefill / Decode ratio = ${PREFILL_DECODE_RATIO.toLocaleString('en-US')}×`,
          445,
          134,
          30,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(rt),
        txt(
          'Decode reads KV cache + weights (BW bound)',
          445,
          186,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(rt),
      );
    }

    if (lt > 0.02) {
      nodes.push(
        glassCell(0, 338, 1660, 112, COSMOS.cyan, { fill: '#0e192d', glow: 9, opacity: lt }),
        txt(
          'MEASURE SEPARATELY:   TTFT (Prefill wait)   ·   ITL (Decode step wait)',
          0,
          338,
          30,
          COSMOS.cyan,
          'mono',
        )
          .glow(6, COSMOS.cyan)
          .opacity(lt),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('prefill-decode-beat-1', () => s.play(showPrefill.to(1, { duration: 0.45 })));
  c.on('prefill-decode-beat-2', () => s.play(showDecode.to(1, { duration: 0.45 })));
  c.on('fa-one-query', () => s.play(showRatio.to(1, { duration: 0.45 })));
  c.on('prefill-decode-beat-3', () =>
    s.play(showLatency.to(1, { duration: remainDuration(c, 'prefill-decode-beat-3', 0.45) })),
  );
}
