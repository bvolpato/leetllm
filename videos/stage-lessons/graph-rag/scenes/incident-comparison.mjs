// Scene 7: What can the on-call engineer report? (3-note lab: lexical top-2 drops #2031 -> 2-hop walk adds #2031 -> forecast open -> revoke)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  incidentSelection,
  lexicalRows,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function incidentComparison(s, c) {
  const phase = s.value(0);
  const showBase = s.value(0);
  const showHop1 = s.value(0);
  const showHop2 = s.value(0);
  const showThird = s.value(0);
  const showReplace = s.value(0);
  const showOpen = s.value(0);
  const showRevoke = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Can the On-Call', 'Engineer Report?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: '3-NOTE INCIDENT LAB · LEXICAL TOP-2 · 2-HOP POLICY WALK · REVOCATION',
  });

  const hops2 = [...incidentSelection({ hops: 2 })].sort((a, b) => a - b);
  const revoked = [...incidentSelection({ hops: 1, changedClaim: true, readPolicy: false })].sort(
    (a, b) => a - b,
  );

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sb = showBase.value;
    const h1 = showHop1.value;
    const h2 = showHop2.value;
    const st = showThird.value;
    const sr = showReplace.value;
    const so = showOpen.value;
    const rv = showRevoke.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: 3 incident notes (strict prediction withholding on which drops out & which hop 2 adds!)
      txt(
        'THREE INCIDENT NOTES (QUERY: SERVICE, LATENCY, SLO)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, -112, 780, 112, COSMOS.emerald, { fill: '#0e2624', glow: 4 }),
      txt(
        `#3155 Breach note (${lexicalRows[2].matches.length}/3 terms) -> TOP-2 HIT`,
        -825,
        -136,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Evictions + latency breach; recovered after rollback',
        -825,
        -92,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-465, 22, 780, 112, COSMOS.cyan, { fill: '#10203a', glow: 4 }),
      txt(
        `#1842 Dependency note (${lexicalRows[0].matches.length}/3 terms) -> TOP-2 HIT`,
        -825,
        -2,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('Inference API depends on Redis cache', -825, 42, 26, COSMOS.ink, 'sans', 'left'),

      glassCell(
        -465,
        166,
        780,
        134,
        rv > 0.3 ? COSMOS.rose : st > 0.4 ? COSMOS.emerald : sb > 0.4 ? COSMOS.rose : COSMOS.gold,
        {
          fill: rv > 0.3 ? '#29111a' : st > 0.4 ? '#0e2824' : '#231c10',
          glow: st > 0.4 || rv > 0.3 ? 9 * pulse : 3,
        },
      ),
      txt(
        rv > 0.3
          ? `#2031 Policy -> ACCESS REVOKED (${revoked.join(', ')})`
          : st > 0.4
            ? `#2031 Policy (${lexicalRows[1].matches.length}/3) -> ADDED BY HOP 2! (${hops2.length}/3)`
            : sb > 0.4
              ? `#2031 Cache policy (${lexicalRows[1].matches.length}/3) -> DROPPED TOP-2`
              : '#2031 Cache policy (0/3): drops out? ?',
        -825,
        130,
        26,
        rv > 0.3 ? COSMOS.rose : st > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Old eviction policy still active; migration blocked by test',
        -825,
        180,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: Graph walk & Unsupported causal forecast test (strict c.after withholding on forecast!)
      txt('DIRECTED WALK & CAUSAL FORECAST CHECK', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(
        495,
        -94,
        750,
        146,
        h2 > 0.3 ? COSMOS.emerald : h1 > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: '#101d35',
          glow: h2 > 0.3 ? 8 : 2,
        },
      ),
      txt('2-HOP WALK: Service -> Redis -> Policy', 145, -132, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        st > 0.4
          ? 'Hop 2 pulls #2031 -> 3/3 relevant notes!'
          : h2 > 0.3
            ? 'Which note does the 2nd hop add?  ?'
            : 'Hop 1 cites #1842; follow Redis -> Policy',
        145,
        -84,
        26,
        st > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Inbound-only or deleted policy edge loses #2031',
        145,
        -44,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(
        495,
        114,
        750,
        198,
        so > 0.4 ? COSMOS.amber : sr > 0.3 ? COSMOS.rose : COSMOS.muted,
        {
          fill: so > 0.4 ? '#231c10' : '#181e34',
          glow: sr > 0.3 ? 9 * pulse : 2,
        },
      ),
      txt('PROPOSED 1-HOP: Service -> Breach (#2031)', 145, 52, 26, COSMOS.rose, 'mono', 'left'),
      txt('Retrieves all 3 notes & hash matches, YET:', 145, 98, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        so > 0.4
          ? 'LEAVE OPEN! Quote proves policy, not cause'
          : 'Tell on-call another breach is likely? ?',
        145,
        144,
        26,
        so > 0.4 ? COSMOS.amber : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Revoking #2031 also invalidates reports built from it',
        145,
        188,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Evaluate retrieval coverage, edge precision/recall, and answer support separately',
        -812,
        360,
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

  c.on('incident-comparison-look', () => s.play(showBase.to(0.15, { duration: 0.3 })));
  c.after('incident-comparison-baseline', () => s.play(showBase.to(1, { duration: 0.4 })));
  c.on('incident-comparison-dependency', () => s.play(showHop1.to(1, { duration: 0.35 })));
  c.on('incident-comparison-policy', () => s.play(showHop2.to(1, { duration: 0.35 })));
  c.after('incident-comparison-third-note', () => s.play(showThird.to(1, { duration: 0.4 })));
  c.on('incident-comparison-replace', () => s.play(showReplace.to(0.5, { duration: 0.35 })));
  c.on('incident-comparison-same-three', () => s.play(showReplace.to(0.8, { duration: 0.35 })));
  c.on('incident-comparison-quote', () => s.play(showReplace.to(1, { duration: 0.35 })));
  c.after('incident-comparison-leave-open', () => s.play(showOpen.to(1, { duration: 0.4 })));
  c.on('incident-comparison-revoke', () =>
    s.play(showRevoke.to(1, { duration: remainDuration(c, 'incident-comparison-revoke', 0.45) })),
  );
}
