// Scene 17: How much data does one scan read? (Exact flat scan memory bandwidth wall)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function denseScan(s, c) {
  const phase = s.value(0);
  const showProducts = s.value(0);
  const showPayload = s.value(0);
  const showTraffic = s.value(0);
  const showReuse = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['How Much Data Does', 'One Scan Read?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'EXACT FLAT SCAN · 1M VECTORS x 1,536 FP32 · MEMORY BANDWIDTH WALL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sp = showProducts.value;
    const sy = showPayload.value;
    const st = showTraffic.value;
    const sr = showReuse.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Exact scan single-query arithmetic
      txt('SINGLE EXACT QUERY (1,000,000 x 1,536)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-455, -92, 790, 148, sp > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sp > 0.3 ? 8 * pulse : 3,
      }),
      txt('COORDINATE MULTIPLICATIONS', -825, -134, 26, COSMOS.cyan, 'mono', 'left'),
      txt('1,000,000 x 1,536 = 1.536B mults / query', -825, -90, 28, COSMOS.ink, 'mono', 'left'),
      txt('Plus ~1.536B additions across every row', -825, -52, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(-455, 92, 790, 148, sy > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231e10',
        glow: sy > 0.3 ? 9 * pulse : 3,
      }),
      txt('RAW FP32 MATRIX PAYLOAD (4 BYTES / FLOAT)', -825, 50, 26, COSMOS.gold, 'mono', 'left'),
      txt('1.536B x 4 B = 6.144 decimal GB / scan', -825, 94, 28, COSMOS.gold, 'mono', 'left'),
      txt('Coordinates alone, before IDs or metadata', -825, 132, 26, COSMOS.muted, 'sans', 'left'),

      // Right: 200 QPS bandwidth wall vs batch reuse
      txt('SERVING TRAFFIC AT 200 QUERIES / SEC', 110, -205, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(495, -92, 750, 148, st > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: st > 0.3 ? '#291019' : '#12182b',
        glow: st > 0.3 ? 10 * pulse : 2,
      }),
      txt('UNBATCHED (1 READ PER QUERY)', 150, -134, 26, COSMOS.rose, 'mono', 'left'),
      txt('200 x 6.144 GB = 1.2288 TB / s!', 150, -86, 32, COSMOS.rose, 'mono', 'left'),
      meterBar(150, -40, 670, 26, st > 0.3 ? 1.0 : 0.35, COSMOS.rose),

      glassCell(495, 104, 750, 168, sr > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sr > 0.3 ? '#0e2824' : '#12182b',
        glow: sr > 0.3 ? 9 * pulse : 2,
      }),
      txt('BATCH 2 QUERIES + CACHING / ANN / PQ', 150, 56, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Read block once -> reuse across 2 queries (0.5x)',
        150,
        100,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      meterBar(150, 148, 670, 26, sr > 0.3 ? 0.5 : 0.25, COSMOS.emerald),

      glowDot(-840, 345, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Keep exact flat scan as your reference; benchmark ANN recall, latency, memory & freshness together',
        -812,
        347,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('scan-products', () => s.play(showProducts.to(1, { duration: 0.45 })));
  c.on('scan-payload', () => s.play(showPayload.to(1, { duration: 0.45 })));
  c.on('scan-traffic', () => s.play(showTraffic.to(1, { duration: 0.5 })));
  c.on('scan-reuse', () =>
    s.play(showReuse.to(1, { duration: remainDuration(c, 'scan-reuse', 0.45) })),
  );
}
