// Scene 09: cache-cost-scope: "Caching changes repeated work while the same input still occupies capacity"
// Reused 352-token prefix still inside logical window + 4 metered billing buckets +
// caller authorization gate BEFORE packet construction (distinct from cache-group key).
import {
  COSMOS,
  PREFIX_MOVED,
  ROLE,
  aura,
  chip,
  cornerBrackets,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function cacheCostScope(s, c) {
  const showCap = s.value(0.35);
  const showMeters = s.value(0);
  const showAuth = s.value(0);

  const bgAura = aura(0, 30, 820, '#122c5c2a', '#24183a24');
  const title = heroTitle(['Cached tokens still', 'occupy input capacity'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.cache,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cp = ease(showCap.value);
    const mt = ease(showMeters.value);
    const au = ease(showAuth.value);

    const x0 = -855;
    const nodes = [
      // Top band: Reused prefix still occupies logical capacity & attention
      txt(
        'LOGICAL INPUT WINDOW (364 TOKENS VISIBLE TO ATTENTION)',
        x0,
        -250,
        26,
        ROLE.cache,
        'mono',
        'left',
      ).opacity(alpha),
      tokenRail({
        x0,
        y: -180,
        width: 1710,
        total: PREFIX_MOVED.length,
        height: 58,
        segments: [
          { units: PREFIX_MOVED.common, color: ROLE.cache, alpha: 0.92 },
          { units: 12, color: ROLE.units, alpha: 0.95 },
        ],
        opacity: alpha * (0.65 + 0.35 * cp),
      }),
      txt(
        'Cached prefix: 352 tokens (read from KV, still attended)',
        x0 + 20,
        -180,
        27,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt('New: 12', x0 + 1600, -110, 26, ROLE.units, 'mono', 'right').opacity(alpha),
      txt(
        'Curation checks evidence quality; caching checks reuse & serving cost.',
        x0,
        -110,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      // Middle-left band: 4 separate provider accounting meters
      txt(
        'PROVIDER USAGE ACCOUNTING (SEPARATE BUCKETS)',
        x0,
        -10,
        26,
        mt > 0.2 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * mt)),
    ];

    const meters = [
      { label: 'Cache writes', note: 'can cost > base', w: 230, col: ROLE.poison },
      { label: 'Cache reads', note: 'prefill reuse', w: 380, col: ROLE.cache },
      { label: 'Uncached suffix', note: 'full input rate', w: 135, col: ROLE.units },
      { label: 'Output tokens', note: 'decode rate', w: 185, col: ROLE.note },
    ];
    meters.forEach((m, i) => {
      const y = 60 + i * 74;
      const op = alpha * (0.48 + 0.52 * mt);
      nodes.push(
        txt(m.label, x0, y, 27, m.col, 'mono', 'left').opacity(op),
        lumBar(x0 + 275, y, m.w * (0.35 + 0.65 * mt), 28, m.col, {
          opacity: op,
          track: 400,
        }),
        txt(m.note, x0 + 695, y, 26, COSMOS.muted, 'sans', 'left').opacity(op),
      );
    });

    // Middle-right band: Authorization BEFORE packet construction vs cache-group key
    const ax = 565;
    nodes.push(
      cornerBrackets(ax, 175, 580, 310, au > 0.3 ? ROLE.note : ROLE.rule, {
        arm: 28,
        width: 3,
        opacity: alpha * (0.55 + 0.45 * au),
      }),
      txt(
        'SECURITY BOUNDARY',
        ax,
        55,
        26,
        au > 0.3 ? ROLE.note : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * au)),
      chip('1. Caller ACL & scope check', ax, 125, {
        color: au > 0.3 ? ROLE.note : ROLE.dim,
        size: 26,
        minW: 480,
        opacity: alpha * (0.55 + 0.45 * au),
      }),
      glowArrow([ax, 165], [ax, 210], ROLE.note, { opacity: alpha * (0.5 + 0.5 * au) }),
      chip('2. Build packet + cache group', ax, 250, {
        color: au > 0.3 ? ROLE.cache : ROLE.dim,
        size: 26,
        minW: 480,
        opacity: alpha * (0.55 + 0.45 * au),
      }),

      // Bottom rule
      txt(
        au > 0.3
          ? 'Cache groups isolate billing/routing; caller ACL authorizes which documents enter.'
          : 'Never drop required evidence just to chase a higher cache-hit percentage.',
        0,
        405,
        30,
        au > 0.3 ? ROLE.note : ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-cache-cost-scope-1', (d) => s.play(showCap.to(1, { duration: d })));
  playCue(s, c, 'ce-cache-cost-scope-2', (d) => s.play(showMeters.to(1, { duration: d })));
  playCue(s, c, 'ce-cache-cost-scope-3', (d) => s.play(showAuth.to(1, { duration: d })));
}
