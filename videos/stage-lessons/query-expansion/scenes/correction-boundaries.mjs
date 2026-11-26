// Scene 15: Where may the question and its rewrite go? (Egress firewall & tenant-scoped rewrite cache)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function correctionBoundaries(s, c) {
  const phase = s.value(0);
  const showEgress = s.value(0);
  const showCache = s.value(0);

  const bgAura = aura(0, 10, 720, '#30142620', '#10345c26');
  const title = heroTitle(['Where May the Question', 'and Its Rewrite Go?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'SECURITY BOUNDARIES · EGRESS FIREWALL & TENANT-SCOPED CACHE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sEg = showEgress.value;
    const sCa = showCache.value;
    const egressActive = sEg > 0.35;
    const cacheActive = sCa > 0.35;
    const pulse = 0.74 + 0.26 * Math.sin(p * 3.8);

    const nodes = [
      // LEFT WING: Egress Firewall & SSRF Controls
      txt('1. EGRESS & SSRF GUARDRAILS', -855, -214, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(-440, -110, 820, 128, COSMOS.rose, {
        fill: egressActive ? '#2c121c' : '#181426',
        glow: egressActive ? 10 * pulse : 3,
      }),
      txt('PRIVATE POLICY QUERY', -825, -142, 26, COSMOS.rose, 'mono', 'left'),
      txt('EXPORT DENIED · STAYS INSIDE', -825, -92, 30, COSMOS.ink, 'mono', 'left'),
      txt('BLOCKED', -60, -110, 28, COSMOS.rose, 'mono', 'right'),

      glassCell(-440, 108, 820, 266, COSMOS.emerald, {
        fill: '#0d2224',
        glow: egressActive ? 7 : 3,
      }),
      txt('APPROVED PUBLIC FALLBACK ONLY', -825, 16, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        '• Allowlist public domains & verify redirects',
        -825,
        70,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '• Block private, loopback, link-local & IPv6',
        -825,
        122,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '• Treat fetched pages strictly as untrusted data',
        -825,
        174,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Center glowing boundary line
      line([0, -206], [0, 276], { stroke: COSMOS.dim, width: 2, dash: [6, 6] }),

      // RIGHT WING: Tenant-Scoped Rewrite Cache
      txt('2. TENANT-SCOPED REWRITE CACHE', 35, -214, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(445, -136, 820, 76, COSMOS.blue, { fill: '#10203a', glow: 5 }),
      txt('SAME FOLLOW-UP:  "How can I retry it?"', 445, -134, 29, COSMOS.ink, 'sans'),

      // Tenant A vault
      glassCell(445, -8, 820, 134, cacheActive ? COSMOS.cyan : COSMOS.muted, {
        fill: cacheActive ? '#0f2338' : '#10182d',
        glow: cacheActive ? 9 * pulse : 2,
      }),
      txt('TENANT A  ·  grant: batch.read', 62, -46, 26, COSMOS.cyan, 'mono', 'left'),
      txt('History: "My batch job failed."', 62, -6, 26, COSMOS.muted, 'sans', 'left'),
      txt(
        cacheActive ? '-> Rewrite: "Retry a failed batch job"' : '-> Isolated cache entry A',
        62,
        34,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Tenant B vault
      glassCell(445, 162, 820, 134, cacheActive ? COSMOS.gold : COSMOS.muted, {
        fill: cacheActive ? '#261f10' : '#10182d',
        glow: cacheActive ? 9 * pulse : 2,
      }),
      txt('TENANT B  ·  grant: billing.read', 62, 124, 26, COSMOS.gold, 'mono', 'left'),
      txt('History: "My invoice export failed."', 62, 164, 26, COSMOS.muted, 'sans', 'left'),
      txt(
        cacheActive ? '-> Rewrite: "Retry a failed invoice export"' : '-> Isolated cache entry B',
        62,
        204,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      // Composite cache key footer
      glowDot(-840, 368, { radius: 6, color: cacheActive ? COSMOS.cyan : COSMOS.rose }),
      txt(
        cacheActive
          ? 'Cache key: scope + policy + history + query + technique + model (+ encoder) · recheck grants'
          : 'Private queries never leave the boundary; isolate public fetches and recheck access on cache hits',
        -812,
        370,
        27,
        cacheActive ? COSMOS.cyan : COSMOS.rose,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('egress-gate', () => s.play(showEgress.to(1, { duration: 0.45 })));
  c.on('cache-separate', () =>
    s.play(showCache.to(1, { duration: remainDuration(c, 'cache-separate', 0.45) })),
  );
}
