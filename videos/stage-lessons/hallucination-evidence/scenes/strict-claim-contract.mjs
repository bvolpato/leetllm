// Scene 7: What part of a claim did the checker read? (Read-only schema, version stop, paraphrase false-reject, free-text trap)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function strictClaimContract(s, c) {
  const phase = s.value(0);
  const showSchema = s.value(0);
  const showStops = s.value(0);
  const showCompare = s.value(0);
  const showFreeText = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['What Part of a Claim', 'Did the Checker Read?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'STRICT CLAIM CONTRACT · METADATA STOPS · EXACT MATCH vs FREE TEXT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showSchema.value;
    const st = showStops.value;
    const sc = showCompare.value;
    const sf = showFreeText.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top left: 3-stage deterministic checker funnel
      txt('CHECKER EXECUTION ORDER', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-640, -96, 400, 134, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: ss > 0.3 ? 8 : 3,
      }),
      txt('1. SOURCE & VERSION', -640, -132, 26, COSMOS.cyan, 'mono'),
      txt('Missing source -> STOP', -640, -90, 26, st > 0.3 ? COSMOS.rose : COSMOS.ink, 'mono'),
      txt('Stale version  -> STOP', -640, -54, 26, st > 0.3 ? COSMOS.rose : COSMOS.muted, 'mono'),

      glowingArc([-432, -96], [-348, -96], -14, { color: COSMOS.cyan, width: 3.4 }),

      glassCell(-110, -96, 460, 134, sc > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#1e1b10',
        glow: sc > 0.3 ? 8 * pulse : 3,
      }),
      txt('2. FIELD EQUALITY', -110, -132, 26, COSMOS.amber, 'mono'),
      txt('resolved != investigating', -110, -90, 26, COSMOS.rose, 'mono'),
      txt('"finished" != "completed"', -110, -54, 26, COSMOS.gold, 'mono'),

      glowingArc([128, -96], [212, -96], -14, { color: COSMOS.gold, width: 3.4 }),

      glassCell(510, -96, 580, 134, sf > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sf > 0.3 ? 9 * pulse : 3,
      }),
      txt('3. SAFE RENDERING ONLY', 510, -132, 26, COSMOS.emerald, 'mono'),
      txt('Print from verified field value', 510, -90, 26, COSMOS.ink, 'sans'),
      txt('NEVER trust unverified prose!', 510, -54, 26, COSMOS.rose, 'mono'),

      // Bottom left: Paraphrase false-reject & structural guards
      glassCell(-440, 138, 820, 210, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#10182d',
        glow: sc > 0.3 ? 7 : 2,
      }),
      txt('STRICTNESS & GUARDRAILS', -820, 72, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        '· Read-only mapping prevents silent mutation',
        -820,
        118,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Rejects duplicate claim IDs or fields; 0 claims -> abstain',
        -820,
        160,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Exact string equality can false-reject "finished"',
        -820,
        202,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Bottom right: Free-text smuggling trap!
      glassCell(455, 138, 840, 210, sf > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sf > 0.3 ? '#29111a' : '#12182b',
        glow: sf > 0.3 ? 10 * pulse : 2,
      }),
      txt('THE UNCHECKED FREE-TEXT TRAP', 60, 72, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        'Typed value:  service = "embedding-api" (PASS)',
        60,
        118,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('Free prose:   "...fully recovered!" (LEAK!)', 60, 160, 26, COSMOS.rose, 'mono', 'left'),
      txt('Fix: render fresh text from verified field', 60, 202, 26, COSMOS.ink, 'sans', 'left'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.cyan }),
      txt(
        'If an LLM rewrites a verified sentence, re-extract and verify every claim in the new wording',
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

  c.on('strict-claim-contract-b1', () => s.play(showSchema.to(1, { duration: 0.45 })));
  c.on('metadata-stops', () => s.play(showStops.to(1, { duration: 0.45 })));
  c.on('strict-claim-contract-b2', () => s.play(showCompare.to(1, { duration: 0.45 })));
  c.on('strict-claim-contract-b3', () =>
    s.play(showFreeText.to(1, { duration: remainDuration(c, 'strict-claim-contract-b3', 0.45) })),
  );
}
