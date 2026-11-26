// Scene 16: Will Adam take the same next step? Complete checkpoint (+0.01429) vs weights-only reset (+0.10).
import {
  ADAM_CONT,
  COSMOS,
  ROLE,
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

export default function checkpoint(s, c) {
  const phase = s.value(0);
  const revResumed = s.value(0);
  const revReset = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71c', '#ff6b8b18');
  const title = heroTitle(['Will Adam Take the', 'Same Next Step?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.opt,
    eyebrow: 'RESUMABLE CHECKPOINTS · ADAM MOMENTS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const rr = revResumed.value;
    const rs = revReset.value;

    const nodes = [
      // Left: Completed step 2 boundary (g1=+1, g2=+1 -> next g3=-1)
      glassCell(-590, -10, 490, 260, ROLE.opt, { fill: '#211c11', glow: 8 }),
      txt('STEP 2 CHECKPOINT', -590, -96, 26, ROLE.opt, 'mono'),
      txt('β1=0.5 · β2=0.5 · lr=0.1', -590, -40, 26, COSMOS.ink, 'mono'),
      txt('Past grads: +1, +1', -590, 16, 28, COSMOS.muted, 'mono'),
      txt('Next step 3 grad: -1', -590, 72, 28, COSMOS.gold, 'mono'),

      // Top right: Complete checkpoint (weights + m, v + step)
      glassCell(290, -110, 740, 148, rr > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: '#0d2924',
        glow: rr > 0.5 ? 10 : 3,
      }),
      txt('COMPLETE CHECKPOINT (WEIGHTS + m, v + STEP)', 290, -152, 26, ROLE.good, 'mono'),
      txt(
        rr > 0.5
          ? `Next Δw = +${ADAM_CONT.resumed.toFixed(5)} (exact)`
          : 'Keeps momentum m, v & step counter',
        290,
        -90,
        30,
        rr > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      // Bottom right: Weights-only reset (missing m, v)
      glassCell(290, 98, 740, 148, rs > 0.5 ? ROLE.bad : COSMOS.dim, {
        fill: '#2e101c',
        glow: rs > 0.5 ? 10 : 3,
      }),
      txt('WEIGHTS-ONLY CHECKPOINT (ADAM RESET)', 290, 56, 26, ROLE.bad, 'mono'),
      txt(
        rs > 0.5
          ? `Next Δw = +${ADAM_CONT.reset.toFixed(1)}0000  (7× larger jump!)`
          : 'Same pre-update loss, but m = 0, v = 0!',
        290,
        118,
        30,
        rs > 0.5 ? ROLE.bad : COSMOS.muted,
        'mono',
      ),

      glowingArc([-376, -30], [-84, -110], -18, { color: ROLE.good, width: 3.4, opacity: 0.85 }),
      glowingArc([-376, 15], [-84, 98], 18, { color: ROLE.bad, width: 3.4, opacity: 0.85 }),

      glowDot(-740 + ((p * 0.65) % 1) * 1480, 275, { radius: 6, color: COSMOS.gold }),
      txt(
        'Save sharded model + optimizer + scheduler + data pos + RNG · test resume vs uninterrupted run',
        0,
        348,
        28,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('resume-update', () =>
    s.play(revResumed.to(1, { duration: remainDuration(c, 'resume-update', 0.45) })),
  );
  c.on('reset-update', () =>
    s.play(revReset.to(1, { duration: remainDuration(c, 'reset-update', 0.45) })),
  );
}
