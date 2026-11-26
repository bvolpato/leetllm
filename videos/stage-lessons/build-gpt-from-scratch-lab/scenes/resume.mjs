// Scene 14: Which training window comes after a restart? (Seed replay vs progressed RNG state)
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

export default function resume(s, c) {
  const phase = s.value(0);
  const consumed = s.value(0);
  const showFork = s.value(0);
  const revealNext = s.value(0);

  const bgAura = aura(0, 20, 620, '#18326826', '#3c1e5814');
  const title = heroTitle(['Which Training Window', 'Comes After a Restart?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'CHECKPOINT RESUME · SAMPLER RNG CURSOR',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const cs = consumed.value;
    const fk = showFork.value;
    const rn = revealNext.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const starts = [4, 1, 9, 2];
    const tileW = 240;
    const gap = 56;
    const stride = tileW + gap;
    const x0 = -444;
    const rowY = -90;

    const nodes = [
      txt(
        'RANDOM WINDOW STARTS (SAMPLER SEQUENCE)',
        -780,
        rowY - 92,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    starts.forEach((val, idx) => {
      const cx = x0 + idx * stride;
      const isConsumed = idx < 2 && cs > 0.5;
      const isReplayed = idx === 0 && fk > 0.4;
      const isRestored = idx === 2 && rn > 0.5;
      const stroke = isRestored
        ? COSMOS.emerald
        : isReplayed
          ? COSMOS.rose
          : isConsumed
            ? COSMOS.dim
            : COSMOS.cyan;

      nodes.push(
        glassCell(cx, rowY, tileW, 114, stroke, {
          fill: isRestored
            ? '#0d2724'
            : isReplayed
              ? '#291019'
              : isConsumed
                ? '#0e121e'
                : '#102138',
          glow: isRestored || isReplayed ? 10 * pulse : 4,
          opacity: isConsumed && !isReplayed ? 0.55 : 0.96,
        }),
        txt(`start = ${val}`, cx, rowY - 16, 36, stroke, 'mono'),
        txt(
          isConsumed ? 'used' : `draw #${idx + 1}`,
          cx,
          rowY + 28,
          26,
          isConsumed ? COSMOS.dim : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Save checkpoint marker between index 1 and 2
    if (cs > 0.1) {
      const saveX = x0 + 1.5 * stride;
      nodes.push(
        glowDot(saveX, rowY, { radius: 8, color: COSMOS.gold, opacity: cs }),
        txt('SAVE', saveX, rowY - 78, 26, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(cs),
      );
    }

    // Two diverging paths below (strictly withholding "4 again" and "9" until beat 2 cues!)
    if (fk > 0.05) {
      const saveX = x0 + 1.5 * stride;
      const xFirst = x0;
      const xThird = x0 + 2 * stride;

      // Rose loop back to start = 4 (reloading only initial seed)
      nodes.push(
        glowingArc([saveX, rowY + 66], [xFirst, rowY + 66], 125, {
          color: COSMOS.rose,
          width: 4.2,
          opacity: fk,
        }),
        txt('Reload initial seed only -> replays start = 4!', -340, 195, 30, COSMOS.rose, 'mono')
          .glow(7, COSMOS.rose)
          .opacity(fk),
      );

      // Emerald advance to start = 9 (restoring progressed sampler state)
      if (rn > 0.05) {
        nodes.push(
          glowingArc([saveX, rowY + 66], [xThird, rowY + 66], 82, {
            color: COSMOS.emerald,
            width: 4.5,
            opacity: rn,
          }),
          txt(
            'Restore progressed RNG state -> advances to start = 9',
            260,
            268,
            30,
            COSMOS.emerald,
            'mono',
          )
            .glow(7, COSMOS.emerald)
            .opacity(rn),
          txt(
            'Validation uses its own RNG stream so inspection never shifts the next training batch',
            0,
            364,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(rn),
        );
      }
    } else {
      nodes.push(
        txt(
          cs > 0.5
            ? 'Checkpoint saved after draws 4 and 1 -> reload only initial seed: which window comes next?'
            : 'Sampler tracks window starts across training updates · save after draws 4 and 1',
          0,
          175,
          30,
          cs > 0.5 ? COSMOS.gold : COSMOS.muted,
          'serif',
        ).glow(cs > 0.5 ? 5 : 2, COSMOS.gold),
        txt(
          'Compare reloading only the initial seed vs restoring the progressed RNG cursor',
          0,
          268,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(0.78),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('consume-draws', () => s.play(consumed.to(1, { duration: 0.6 })));
  c.on('restore-cursor', () =>
    s.play(showFork.to(1, { duration: remainDuration(c, 'restore-cursor', 0.55) })),
  );
  c.after('restored-draw', () =>
    s.play(revealNext.to(1, { duration: remainDuration(c, 'restored-draw', 0.5) })),
  );
}
