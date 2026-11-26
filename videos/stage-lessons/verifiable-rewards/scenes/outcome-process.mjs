// Scene 06: Which explanation for 97 would you trust? (Outcome tie vs process supervision + 77 counterexample)
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

export default function outcomeProcess(s, c) {
  const phase = s.value(0);
  const badProof = s.value(0);
  const primeCheck = s.value(0);
  const equalFinal = s.value(0);
  const showSteps = s.value(0);
  const show77 = s.value(0);
  const showFactor = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Which Explanation for 97', 'Would You Trust?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'OUTCOME-ONLY VERIFIER vs PROCESS SUPERVISION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const bp = Math.max(0.55, badProof.value);
    const pc = Math.max(0.55, primeCheck.value);
    const ef = equalFinal.value;
    const st = showSteps.value;
    const s77 = show77.value;
    const fac = showFactor.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('TASK: IS 97 PRIME?  (sqrt(97) ~= 9.85)', -855, -196, 28, COSMOS.cyan, 'mono', 'left'),

      // Left response: flawed heuristic
      glassCell(-440, -35, 760, 210, fac > 0.3 ? COSMOS.rose : COSMOS.amber, {
        fill: fac > 0.3 ? '#291018' : '#1f1810',
        glow: fac > 0.3 ? 10 * pulse : 5,
        opacity: bp,
      }),
      txt('EXPLANATION A (SHORTCUT)', -790, -104, 26, COSMOS.amber, 'mono', 'left').opacity(bp),
      txt('"Yes, because 97 ends in 7."', -790, -48, 32, COSMOS.ink, 'serif', 'left').opacity(bp),
      txt(
        ef > 0.3 ? 'Final field: YES  ->  Outcome r = 1' : 'Final field: YES',
        -790,
        24,
        28,
        ef > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(bp),

      // Right response: complete divisor check
      glassCell(440, -35, 760, 210, COSMOS.emerald, {
        fill: '#0e2524',
        glow: pc > 0.7 ? 9 * pulse : 4,
        opacity: pc,
      }),
      txt('EXPLANATION B (DIVISOR CHECK)', 90, -104, 26, COSMOS.emerald, 'mono', 'left').opacity(
        pc,
      ),
      txt('Test primes <= sqrt(97):  2, 3, 5, 7', 90, -48, 30, COSMOS.ink, 'mono', 'left').opacity(
        pc,
      ),
      txt(
        ef > 0.3 ? 'All leave remainder -> YES  (r = 1)' : 'Check all 4 prime divisors',
        90,
        24,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(pc),
    ];

    // Lower test strip: Process supervision & 77 counterexample
    const lowOp = Math.max(0.45, Math.max(st, s77));
    nodes.push(
      glassCell(-440, 220, 760, 148, fac > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: fac > 0.3 ? '#291018' : '#12182b',
        glow: fac > 0.3 ? 9 : 2,
        opacity: lowOp,
      }),
      txt(
        s77 > 0.3 ? 'COUNTEREXAMPLE: TEST ON 77' : 'PROCESS SUPERVISION CHECK',
        -790,
        180,
        26,
        fac > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ).opacity(lowOp),
      txt(
        fac > 0.3
          ? '77 ends in 7, yet 7 x 11 = 77 (composite!) -> FAIL'
          : st > 0.3
            ? 'PRM / step labels grade intermediate reasoning'
            : 'Outcome-only check cannot separate A from B',
        -790,
        242,
        28,
        fac > 0.3 ? COSMOS.rose : COSMOS.ink,
        'sans',
        'left',
      ).opacity(lowOp),

      glassCell(440, 220, 760, 148, fac > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: fac > 0.3 ? '#0e2624' : '#12182b',
        glow: fac > 0.3 ? 9 : 2,
        opacity: lowOp,
      }),
      txt('STEP-LEVEL VERDICT', 90, 180, 26, COSMOS.emerald, 'mono', 'left').opacity(lowOp),
      txt(
        fac > 0.3
          ? 'Explanation B passes every divisor step -> earned credit'
          : 'Lightman (PRM) & Cobbe (ORM) score reasoning steps',
        90,
        242,
        26,
        fac > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ).opacity(lowOp),
      glowDot(0, 358, { radius: 6, color: COSMOS.gold, opacity: lowOp }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-outcome-process-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-bad-proof-outcome-process', () => s.play(badProof.to(1, { duration: 0.45 })));
  c.on('vr-prime-check-outcome-process', () => s.play(primeCheck.to(1, { duration: 0.45 })));
  c.on('vr-equal-final-outcome-process', () => s.play(equalFinal.to(1, { duration: 0.45 })));
  c.on('vr-outcome-process-b1', () => s.play(showSteps.to(0.6, { duration: 0.35 })));
  c.on('vr-steps-outcome-process', () => s.play(showSteps.to(1, { duration: 0.45 })));
  c.on('vr-outcome-process-b2', () => s.play(show77.to(1, { duration: 0.45 })));
  c.on('vr-coverage-outcome-process', () =>
    s.play(showFactor.to(1, { duration: remainDuration(c, 'vr-coverage-outcome-process', 0.5) })),
  );
}
