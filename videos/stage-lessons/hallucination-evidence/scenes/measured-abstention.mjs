// Scene 14: What does withholding an answer cost? (Selective risk-coverage trade-off & layered gate order)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function measuredAbstention(s, c) {
  const phase = s.value(0);
  const showTradeoff = s.value(0);
  const showPolicy = s.value(0);
  const showOrder = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['What Does Withholding', 'an Answer Cost?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'RISK-COVERAGE TRADE-OFF · SELECTIVE ABSTENTION · GATE ORDER',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const st = showTradeoff.value;
    const sp = showPolicy.value;
    const so = showOrder.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Top: Selective vs Always-Answer on 10 practice questions
      txt(
        '10 PRACTICE QUESTIONS · SELECTIVE vs ALWAYS-ANSWER',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-455, -90, 810, 152, st > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: st > 0.3 ? 9 * pulse : 3,
      }),
      txt('SELECTIVE POLICY (ABSTAINS 3)', -830, -132, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Cov: 7/10 | Right: 7/10 | Err: 0/7', -830, -86, 26, COSMOS.ink, 'mono', 'left'),
      meterBar(-830, -40, 740, 24, 0.7, COSMOS.emerald),

      glassCell(455, -90, 810, 152, st > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: st > 0.3 ? 8 * pulse : 3,
      }),
      txt('ALWAYS-ANSWER POLICY', 80, -132, 26, COSMOS.amber, 'mono', 'left'),
      txt('Cov: 10/10 | Right: 8/10 | Err: 2/10', 80, -86, 26, COSMOS.ink, 'mono', 'left'),
      meterBar(80, -40, 740, 24, 0.8, COSMOS.amber),

      // Bottom: Layered Gate Order (Evidence First -> Shorten if absent -> Stability check ONLY on fully supported)
      txt(
        'LAYERED GATE ORDER (CALIBRATE ON DEV, EVAL HELD-OUT)',
        -855,
        42,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-575, 168, 520, 168, sp > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sp > 0.3 ? 8 : 2,
      }),
      txt('1. SOURCE CHECK FIRST', -575, 118, 26, COSMOS.cyan, 'mono'),
      txt('Verify snapshot + fields', -575, 162, 26, COSMOS.ink, 'sans'),
      txt('Conflict / stale -> ABSTAIN', -575, 202, 26, COSMOS.rose, 'mono'),

      glowingArc([-305, 168], [-220, 168], -14, { color: COSMOS.cyan, width: 3.6 }),

      glassCell(20, 168, 460, 168, sp > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#1e1b10',
        glow: 3,
      }),
      txt('2. MISSING DETAIL', 20, 118, 26, COSMOS.amber, 'mono'),
      txt('Drop unsupported ETA', 20, 162, 26, COSMOS.ink, 'sans'),
      txt('-> SHORTEN update', 20, 202, 26, COSMOS.amber, 'mono'),

      glowingArc([260, 168], [345, 168], -14, { color: COSMOS.emerald, width: 3.6 }),

      glassCell(600, 168, 500, 168, so > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: so > 0.3 ? 9 * pulse : 2,
      }),
      txt('3. STABILITY CHECK', 600, 118, 26, COSMOS.emerald, 'mono'),
      txt('Only fully supported drafts', 600, 162, 26, COSMOS.ink, 'sans'),
      txt('Disagree > 0.25 -> REVIEW', 600, 202, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'Entropy scores need calibration before reading them as error probabilities; pick cutoffs from real cost',
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

  c.on('measured-abstention-b1', () => s.play(showTradeoff.to(1, { duration: 0.45 })));
  c.on('measured-abstention-b2', () => s.play(showPolicy.to(1, { duration: 0.45 })));
  c.on('supported-stability', () =>
    s.play(showOrder.to(1, { duration: remainDuration(c, 'supported-stability', 0.45) })),
  );
}
