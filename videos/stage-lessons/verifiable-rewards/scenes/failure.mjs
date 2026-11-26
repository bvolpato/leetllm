// Scene 26: Find what the checker leaves unmeasured (Format compliance vs outcome accuracy vs subjective quality)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function failure(s, c) {
  const phase = s.value(0);
  const sFmt = s.value(0);
  const sAcc = s.value(0);
  const sNar = s.value(0);
  const sExt = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Find What the Checker', 'Leaves Unmeasured'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'REWARD SPECIFICATION GAPS · FORMAT, SHORTCUTS & JUDGMENT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sf = Math.max(0.65, sFmt.value);
    const sa = Math.max(0.65, sAcc.value);
    const sn = Math.max(0.65, sNar.value);
    const se = Math.max(0.65, sExt.value);

    const nodes = [
      // Pillar 1: Format vs Outcome
      glassCell(-575, 25, 510, 380, COSMOS.amber, {
        fill: '#22180e',
        glow: sf > 0.7 ? 9 : 4,
        opacity: sf,
      }),
      txt('1. FORMAT vs ACCURACY', -575, -118, 26, COSMOS.amber, 'mono').opacity(sf),
      txt('Valid box != right answer', -575, -52, 28, COSMOS.ink, 'sans').opacity(sf),
      txt('Model learns syntax fast', -575, 8, 26, COSMOS.muted, 'sans').opacity(sf),
      txt('Log format & outcome', -575, 82, 28, COSMOS.emerald, 'mono').opacity(sa),
      txt('SEPARATELY', -575, 126, 30, COSMOS.emerald, 'mono')
        .glow(sa > 0.7 ? 7 : 2, COSMOS.emerald)
        .opacity(sa),

      // Pillar 2: Narrow verifier shortcuts
      glassCell(0, 25, 510, 380, COSMOS.rose, {
        fill: '#261119',
        glow: sn > 0.7 ? 10 * pulse : 4,
        opacity: sn,
      }),
      txt('2. NARROW TARGET', 0, -118, 26, COSMOS.rose, 'mono').opacity(sn),
      txt('Final box alone:', 0, -52, 28, COSMOS.ink, 'sans').opacity(sn),
      txt('lucky guess == proof', 0, 8, 28, COSMOS.rose, 'mono').opacity(sn),
      txt('Broader suites close', 0, 82, 26, COSMOS.muted, 'sans').opacity(sn),
      txt('known shortcuts', 0, 122, 26, COSMOS.gold, 'sans').opacity(sn),

      // Pillar 3: Deterministic vs Subjective
      glassCell(575, 25, 510, 380, COSMOS.cyan, {
        fill: '#102138',
        glow: se > 0.7 ? 9 : 4,
        opacity: se,
      }),
      txt('3. EXTERNAL CRITERION', 575, -118, 26, COSMOS.cyan, 'mono').opacity(se),
      txt('Deterministic checker:', 575, -52, 28, COSMOS.emerald, 'sans').opacity(se),
      txt('code tests, exact math', 575, 8, 26, COSMOS.ink, 'mono').opacity(se),
      txt('Subjective helpfulness:', 575, 82, 28, COSMOS.violet, 'sans').opacity(se),
      txt('calibrated judgment', 575, 122, 26, COSMOS.muted, 'sans').opacity(se),

      glowDot(-820, 315, { radius: 6, color: COSMOS.gold }),
      txt(
        'Every narrow verifier defines an optimization target: audit what it ignores before scaling RL',
        -790,
        317,
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

  c.on('failure-b1-1', () => s.play(sFmt.to(1, { duration: 0.45 })));
  c.on('failure-b1-2', () => s.play(sAcc.to(1, { duration: 0.45 })));
  c.on('failure-b2-1', () => s.play(sNar.to(1, { duration: 0.5 })));
  c.on('failure-b3-1', () =>
    s.play(sExt.to(1, { duration: remainDuration(c, 'failure-b3-1', 0.5) })),
  );
}
