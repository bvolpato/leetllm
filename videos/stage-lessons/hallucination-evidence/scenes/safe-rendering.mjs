// Scene 8: What can reach the status page? (Shorten vs Withhold routing gate)
import {
  COSMOS,
  aura,
  draftClaims,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  renderIncident,
  resolvedClaim,
  runPhase,
  txt,
} from '../parts.mjs';

export default function safeRendering(s, c) {
  const phase = s.value(0);
  const showDraft1 = s.value(0);
  const showCopy = s.value(0);
  const showNoEta = s.value(0);
  const showReplace = s.value(0);
  const showWithhold = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['What Can Reach', 'the Status Page?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EVIDENCE GATE ROUTING · SHORTEN EXTRINSIC vs WITHHOLD INTRINSIC',
  });

  const shortenRes = renderIncident(draftClaims);
  const withholdRes = renderIncident([...draftClaims.slice(0, 3), resolvedClaim]);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const s1 = showDraft1.value;
    const sc = showCopy.value;
    const sn = showNoEta.value;
    const sr = showReplace.value;
    const sw = showWithhold.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Draft A (3 supported + 1 missing ETA -> SHORTEN)
      txt('CASE A: 3 SUPPORTED + 1 MISSING ETA', -855, -205, 26, COSMOS.amber, 'mono', 'left'),
      glassCell(-455, -75, 810, 186, sc > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#10182d',
        glow: sc > 0.4 ? 8 * pulse : 3,
      }),
      txt(
        '1. service: embedding-api         [SUPPORTED]',
        -830,
        -132,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '2. event: failover completed      [SUPPORTED]',
        -830,
        -94,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '3. time: May 26 at 08:14 UTC      [SUPPORTED]',
        -830,
        -56,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '4. recovery_eta: 14:30 UTC        [NOT SUPPORTED]',
        -830,
        -18,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),

      glassCell(-455, 164, 810, 210, sc > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: sc > 0.4 ? '#0e2624' : '#12182b',
        glow: sn > 0.4 ? 9 * pulse : 2,
      }),
      txt(
        sc > 0.4
          ? `ROUTE: ${shortenRes.route.toUpperCase()} (FRESH SENTENCES)`
          : 'WHICH FACTS REACH READER?  ?',
        -830,
        96,
        26,
        sc > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sc > 0.4 ? 'Print service, failover event & 08:14 UTC' : 'Await evidence gate decision...',
        -830,
        142,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sn > 0.4 ? 'Add explicit note: no support for recovery ETA' : 'Drop ungrounded estimate?',
        -830,
        184,
        26,
        sn > 0.4 ? COSMOS.amber : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        sn > 0.4 ? 'Still omits status -> check usefulness separately' : '',
        -830,
        224,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Draft B (3 supported + 1 CONTRADICTED status -> ABSTAIN / WITHHOLD ALL!)
      txt('CASE B: 3 SUPPORTED + 1 CONTRADICTED', 110, -205, 26, COSMOS.rose, 'mono', 'left'),
      glassCell(465, -75, 810, 186, sr > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sr > 0.3 ? '#26111a' : '#12182b',
        glow: sr > 0.3 ? 8 * pulse : 2,
      }),
      txt(
        '1..3: service, event, time        [SUPPORTED]',
        90,
        -118,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '4. status: "resolved"             [CONTRADICTED!]',
        90,
        -68,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt('   (admitted runbook says "investigating")', 90, -24, 26, COSMOS.amber, 'sans', 'left'),

      glassCell(465, 164, 810, 210, sw > 0.4 ? COSMOS.rose : COSMOS.muted, {
        fill: sw > 0.4 ? '#29111a' : '#12182b',
        glow: sw > 0.4 ? 10 * pulse : 2,
      }),
      txt(
        sw > 0.4
          ? `ROUTE: ${withholdRes.route.toUpperCase()} (WITHHOLD ALL!)`
          : 'CAN THE 3 MATCHING FACTS GO OUT?  ?',
        90,
        96,
        26,
        sw > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sw > 0.4
          ? 'Ask reader to review latest runbook state'
          : 'Decide whether conflict blocks whole response',
        90,
        148,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sw > 0.4
          ? 'Hard stops: contradicted, no_source, version_mismatch'
          : 'Compare Case A (missing) vs Case B (conflict)',
        90,
        196,
        26,
        sw > 0.4 ? COSMOS.amber : COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: sw > 0.4 ? COSMOS.rose : COSMOS.emerald }),
      txt(
        sw > 0.4
          ? 'Contradiction, missing source, or stale version stops the update; absent detail can shorten'
          : s1 > 0.3
            ? 'Gate checks every atomic claim before rendering a single word to the status page'
            : 'Separate safe shortening from full abstention',
        -812,
        357,
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

  c.on('first-draft', () => s.play(showDraft1.to(1, { duration: 0.45 })));
  c.after('copy-values', () => s.play(showCopy.to(1, { duration: 0.45 })));
  c.on('no-estimate', () => s.play(showNoEta.to(1, { duration: 0.45 })));
  c.on('replace-fourth', () => s.play(showReplace.to(1, { duration: 0.45 })));
  c.after('withhold-update', () =>
    s.play(showWithhold.to(1, { duration: remainDuration(c, 'withhold-update', 0.45) })),
  );
}
