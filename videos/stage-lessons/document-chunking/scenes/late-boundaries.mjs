// Scene 14: Which words shaped the stored vector? (Offset pooling, late interaction, and permission-scope separation)
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

export default function lateBoundaries(s, c) {
  const phase = s.value(0);
  const showOffset = s.value(0);
  const showLimits = s.value(0);
  const showLeak = s.value(0);
  const showRepair = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Words Shaped', 'the Stored Vector?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'LATE CHUNKING BOUNDARIES · OFFSET POOLING & TRUST SCOPE ISOLATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const so = showOffset.value;
    const sl = showLimits.value;
    const sk = showLeak.value;
    const sr = showRepair.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const repaired = sr > 0.4;

    const nodes = [
      // Left: Offset pooling & Encoder requirements
      txt('1. OFFSET POOLING & ENCODER LIMITS', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -96, 780, 148, so > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: so > 0.3 ? 8 : 2,
      }),
      txt(
        'Shared Pass -> Tokenizer Offsets -> Mean Pool',
        -825,
        -136,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Select 4 content-token states for "page the service owner"',
        -825,
        -94,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Separate passes averaged later cannot recreate attention',
        -825,
        -54,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-465, 96, 780, 174, sl > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#12182d',
        glow: sl > 0.3 ? 8 : 2,
      }),
      txt('REQUIREMENTS & VARIANTS', -825, 42, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        '· Encoder must expose token states & context window',
        -825,
        86,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Pooled late chunking: 1 vector per child span',
        -825,
        124,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        '· Late interaction: multiple token vectors per doc',
        -825,
        160,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      // Right: Permission / Trust scope cross-contamination & Repair
      txt(
        '2. PERMISSION & TRUST SCOPE BOUNDARY',
        110,
        -205,
        26,
        repaired ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),

      glassCell(495, -96, 750, 148, sk > 0.3 && !repaired ? COSMOS.rose : COSMOS.muted, {
        fill: sk > 0.3 && !repaired ? '#2a1019' : '#12182b',
        glow: sk > 0.3 && !repaired ? 9 * pulse : 2,
      }),
      txt(
        repaired ? 'RESTRICTED PASS (SEPARATE)' : 'MIXED PASS: RESTRICTED + PUBLIC',
        145,
        -136,
        26,
        repaired ? COSMOS.amber : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        repaired
          ? '"Owner is Maya" isolated in restricted index'
          : '"Maya" (restricted) bleeds into public vector!',
        145,
        -94,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        repaired
          ? 'No cross-scope attention leakage possible'
          : 'Even if search returns only 4 public words',
        145,
        -54,
        26,
        repaired ? COSMOS.emerald : COSMOS.rose,
        'sans',
        'left',
      ),

      // Firewall bar when repaired
      ...(repaired
        ? [
            line([120, -2], [870, -2], { stroke: COSMOS.emerald, width: 3.5, dash: [12, 8] }).glow(
              8,
              COSMOS.emerald,
            ),
          ]
        : []),

      glassCell(495, 114, 750, 152, repaired ? COSMOS.emerald : COSMOS.gold, {
        fill: repaired ? '#0e2824' : '#181e34',
        glow: repaired ? 10 * pulse : 3,
      }),
      txt(
        repaired ? 'PUBLIC PASS: ONLY 4 PUBLIC WORDS' : 'FIX: SPLIT ENCODER INPUT BY SCOPE',
        145,
        72,
        26,
        repaired ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        repaired
          ? 'Encode public text alone; store context version'
          : 'Never share attention across permission tiers',
        145,
        118,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Store context_version + trust_scope per vector',
        145,
        158,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: repaired ? COSMOS.emerald : COSMOS.rose }),
      txt(
        'Separate late-chunking encoder passes by permission and trust scope, and version every context',
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

  c.on('late-boundaries-0', () => s.play(showOffset.to(0.4, { duration: 0.35 })));
  c.on('late-shared-encode', () => s.play(showOffset.to(0.7, { duration: 0.35 })));
  c.on('late-offset-pool', () => s.play(showOffset.to(1, { duration: 0.35 })));
  c.on('late-boundaries-1', () => s.play(showLimits.to(1, { duration: 0.4 })));
  c.on('late-boundaries-2', () => s.play(showLeak.to(0.6, { duration: 0.35 })));
  c.on('late-dependence', () => s.play(showLeak.to(1, { duration: 0.35 })));
  c.on('late-trust-repair', () =>
    s.play(showRepair.to(1, { duration: remainDuration(c, 'late-trust-repair', 0.45) })),
  );
}
