// Scene 07: Extract one bounded field before comparing exact values (Numeric parser + gold-first + Math-Verify)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function numericParser(s, c) {
  const phase = s.value(0);
  const sMarkers = s.value(0);
  const sBalance = s.value(0);
  const sFraction = s.value(0);
  const sGold = s.value(0);
  const sDup = s.value(0);
  const sDomains = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#331d5214');
  const title = heroTitle(['Extract One Bounded Field,', 'Compare Exact Values'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'MATH VERIFIER PIPELINE · CHARACTER PARSER -> EXACT RATIONAL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const m = Math.max(0.55, sMarkers.value);
    const b = Math.max(0.5, sBalance.value);
    const f = Math.max(0.5, sFraction.value);
    const g = sGold.value;
    const d = sDup.value;
    const dm = sDomains.value;

    const nodes = [
      txt('STRICT SINGLE-BOX PARSER PIPELINE', -855, -196, 26, COSMOS.cyan, 'mono', 'left'),

      // Stage 1: Length & single marker
      glassCell(-645, -80, 410, 128, COSMOS.cyan, {
        fill: '#102138',
        glow: m > 0.7 ? 9 : 4,
        opacity: m,
      }),
      txt('1. MARKER COUNT', -645, -110, 26, COSMOS.cyan, 'mono').opacity(m),
      txt('<=4096 ch · 1 \\boxed', -645, -56, 26, COSMOS.ink, 'mono').opacity(m),

      // Stage 2: Balance braces
      glowingArc([-435, -80], [-275, -80], -28, { color: COSMOS.violet, width: 3.4, opacity: b }),
      glassCell(-55, -80, 430, 128, COSMOS.violet, {
        fill: '#1b1433',
        glow: b > 0.7 ? 9 : 4,
        opacity: b,
      }),
      txt('2. BRACE BALANCE', -55, -110, 26, COSMOS.violet, 'mono').opacity(b),
      txt('<=64 ch · num grammar', -55, -56, 26, COSMOS.ink, 'mono').opacity(b),

      // Stage 3: Exact rational conversion
      glowingArc([165, -80], [345, -80], -28, { color: COSMOS.emerald, width: 3.4, opacity: f }),
      glassCell(575, -80, 440, 128, COSMOS.emerald, {
        fill: '#0e2824',
        glow: f > 0.7 ? 10 * pulse : 4,
        opacity: f,
      }),
      txt('3. EXACT FRACTION', 575, -110, 26, COSMOS.emerald, 'mono').opacity(f),
      txt('1/2 == 0.5  (no eval!)', 575, -56, 28, COSMOS.emerald, 'mono').opacity(f),

      // Lower-left: Gold-first & rejection rules
      glassCell(-440, 165, 760, 195, g > 0.3 || d > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: g > 0.3 ? '#25111a' : '#12182b',
        glow: d > 0.3 ? 9 : 3,
        opacity: Math.max(0.55, g),
      }),
      txt(
        'GOLD-FIRST ORDER & STRICT REJECTION',
        -790,
        102,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(Math.max(0.55, g)),
      txt(
        '· Parse trusted reference FIRST (0 denom -> quarantine)',
        -790,
        158,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(Math.max(0.55, g)),
      txt(
        '· Candidate 2nd box or /0 -> r = 0 under healthy checker',
        -790,
        214,
        26,
        d > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.55, d)),

      // Lower-right: Math-Verify symbolic comparison notes
      glassCell(440, 165, 760, 195, dm > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: dm > 0.3 ? '#221c0f' : '#12182b',
        glow: dm > 0.3 ? 8 : 3,
        opacity: Math.max(0.55, dm),
      }),
      txt('SYMBOLIC EQUIVALENCE (MATH-VERIFY)', 90, 102, 26, COSMOS.cyan, 'mono', 'left').opacity(
        Math.max(0.55, dm),
      ),
      txt(
        '· Separates extraction, symbolic form & tolerance',
        90,
        158,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(Math.max(0.55, dm)),
      txt(
        '· Needs variable domains, assumptions & time limits',
        90,
        214,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ).opacity(Math.max(0.55, dm)),
      glowDot(-825, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Failed simplification != inequality · define a dedicated final field for multi-box working',
        -795,
        358,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  const eqFrac = glowTex('\\frac{1}{2} \\equiv 0.50 \\in \\mathbb{Q}', {
    x: 575,
    y: -215,
    size: 38,
    color: COSMOS.emerald,
    glow: 6,
  });

  s.add(bgAura, title, live, eqFrac);
  runPhase(s, c, phase, 14);

  c.on('vr-numeric-parser-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-markers-numeric-parser', () => s.play(sMarkers.to(1, { duration: 0.45 })));
  c.on('vr-balance-numeric-parser', () => s.play(sBalance.to(1, { duration: 0.45 })));
  c.on('vr-fraction-numeric-parser', () => s.play(sFraction.to(1, { duration: 0.45 })));
  c.on('vr-numeric-parser-b1', () => s.play(sGold.to(0.6, { duration: 0.35 })));
  c.on('vr-gold-numeric-parser', () => s.play(sGold.to(1, { duration: 0.45 })));
  c.on('vr-duplicate-numeric-parser', () => s.play(sDup.to(1, { duration: 0.45 })));
  c.on('vr-numeric-parser-b2', () => s.play(sDomains.to(0.6, { duration: 0.35 })));
  c.on('vr-domains-numeric-parser', () =>
    s.play(sDomains.to(1, { duration: remainDuration(c, 'vr-domains-numeric-parser', 0.5) })),
  );
}
