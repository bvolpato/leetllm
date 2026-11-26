// Scene 19: cache-lifetime: 4 cache boundaries (none/features/projected/kv), 2,260 reusable prefix before 100 question, ACL recheck.
import {
  COSMOS,
  ROLE,
  aura,
  cacheWorkAt,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function cacheLifetime(s, c) {
  const showTiers = s.value(0);
  const showPrefixOrder = s.value(0);
  const show2260 = s.value(0);
  const showAuth = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#22174426');
  const title = heroTitle(['Reuse Only Stages Covered', 'by a Compatible Artifact'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.vision,
  });

  const tiers = [
    { label: 'Cold Miss', key: 'none', color: ROLE.warn },
    { label: 'Encoder Features Hit', key: 'features', color: ROLE.gold },
    { label: 'Projected Tokens Hit', key: 'projected', color: ROLE.vision },
    { label: 'Prefix KV Cache Hit', key: 'kv', color: ROLE.ok },
  ];
  const stageShort = ['Encode', 'Project', 'Shared Prefill', 'Q Prefill', 'Decode'];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tr = showTiers.value;
    const po = showPrefixOrder.value;
    const n22 = show2260.value;
    const au = showAuth.value;

    const nodes = [
      txt('CACHE BOUNDARY', -855, -245, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(
        'STAGES SKIPPED (DIM) VS EXECUTED (LIT)',
        -440,
        -245,
        26,
        ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    tiers.forEach((tier, rIdx) => {
      const y = -188 + rIdx * 68;
      const work = cacheWorkAt(tier.key);
      nodes.push(
        txt(tier.label, -855, y, 26, tier.color, 'mono', 'left').opacity(
          alpha * (0.55 + 0.45 * tr),
        ),
      );
      work.forEach((st, cIdx) => {
        const cx = -320 + cIdx * 265;
        const req = st.required;
        nodes.push(
          rect(244, 50, {
            fill: req ? '#132744' : '#0b101f',
            stroke: req ? tier.color : '#263454',
            width: req ? 2.4 : 1.4,
            radius: 8,
          })
            .at(cx, y)
            .opacity(alpha * (req ? 0.65 + 0.35 * tr : 0.45)),
          txt(
            req ? stageShort[cIdx] : `skip`,
            cx,
            y,
            26,
            req ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha * (req ? 0.7 + 0.3 * tr : 0.5)),
        );
      });
    });

    // Middle: Reusable Prefix Order (2,260 before 100 question)
    const prefY = 148;
    nodes.push(
      txt(
        n22 > 0.3
          ? 'REUSABLE PREFIX = 100 SYS + 160 VIS + 2,000 TRANSCRIPT = 2,260  (+ 100 QUESTION SUFFIX)'
          : 'PUT REUSABLE EVIDENCE BEFORE CHANGING QUESTION SUFFIX',
        -855,
        86,
        26,
        n22 > 0.3 ? ROLE.ok : po > 0.3 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('Sys 100', -735, prefY, {
        w: 220,
        h: 62,
        color: ROLE.text,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * po),
      }),
      chipPill('Vis 160', -490, prefY, {
        w: 230,
        h: 62,
        color: ROLE.vision,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * po),
      }),
      chipPill('Transcript 2,000  (2,260 reusable)', 15, prefY, {
        w: 740,
        h: 62,
        color: n22 > 0.3 ? ROLE.ok : ROLE.text,
        fill: n22 > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: n22 > 0.3 ? 12 : 4,
        opacity: alpha * (0.55 + 0.45 * po),
      }),
      chipPill('New Q +100', 610, prefY, {
        w: 410,
        h: 62,
        color: ROLE.gold,
        size: 26,
        opacity: alpha * (0.55 + 0.45 * po),
      }),

      txt(
        po > 0.3
          ? 'Moving a changed question BEFORE the image invalidates causal states even on identical pixels!'
          : 'Reuse may cover only complete KV blocks',
        0,
        222,
        26,
        ROLE.warn,
        'sans',
        'center',
      ).opacity(alpha * (0.52 + 0.48 * po)),

      // Bottom: vLLM identity + mandatory ACL recheck
      chipPill(
        au > 0.3
          ? 'vLLM hash: parent blocks + tokens + multimodal IDs + cache salts  |  RECHECK AUTH ON EVERY HIT!'
          : 'Cache identity includes model, adapter, template, masks, and tenant auth',
        0,
        312,
        {
          w: 1620,
          h: 68,
          color: au > 0.3 ? ROLE.warn : '#364d78',
          fill: au > 0.3 ? '#2c1422' : '#10182d',
          size: 26,
          glow: au > 0.3 ? 12 : 4,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-cache-lifetime-0', (d) => s.play(showTiers.to(1, { duration: d })));
  playCue(s, c, 'mm-cache-lifetime-1', (d) => s.play(showPrefixOrder.to(1, { duration: d })));
  playCue(s, c, 'mm-prefix-count', (d) => s.play(show2260.to(1, { duration: d })));
  playCue(s, c, 'mm-cache-lifetime-2', (d) => s.play(showAuth.to(1, { duration: d })));
}
