// Scene 03: Count the reads of each input: 24 scalar reads (2 dots under 3) -> 12 shared reads (1 dot each).
import {
  A,
  B,
  COSMOS,
  ROLE,
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

export default function naive(s, c) {
  const phase = s.value(0);
  const mode = s.value(0); // 0=idle, 1=independent(24), 2=shared(12)
  const sameWork = s.value(0);

  const bgAura = aura(0, 30, 640, '#60a5fa1e', '#6ee7b716');
  const title = heroTitle(['Count the Reads', 'of Each Input'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gold,
    eyebrow: 'NAIVE SCALAR vs SHARED BLOCK',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const m = mode.value;
    const sw = sameWork.value;
    const isShared = m >= 1.5;
    const showDots = m >= 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    // Matrix A (2x3) with read dots under every entry
    nodes.push(txt('A (6 floats)', -480, -165, 28, ROLE.a, 'mono'));
    for (let r = 0; r < 2; r++) {
      for (let k = 0; k < 3; k++) {
        const cx = -650 + k * 170;
        const cy = -72 + r * 155;
        const isThree = r === 1 && k === 1;
        nodes.push(
          glassCell(cx, cy, 134, 92, isThree ? COSMOS.gold : ROLE.a, {
            fill: isThree ? '#262111' : '#101d38',
            glow: isThree ? 10 * pulse : 5,
          }),
          txt(String(A[r][k]), cx, cy, 40, isThree ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
        if (showDots) {
          const dotsCount = isShared ? 1 : 2;
          for (let d = 0; d < dotsCount; d++) {
            const dx = dotsCount === 1 ? cx : cx - 18 + d * 36;
            nodes.push(
              glowDot(dx, cy + 68, {
                radius: isThree ? 8 : 6.5,
                color: isShared ? ROLE.good : isThree ? COSMOS.gold : ROLE.a,
                glow: 10,
              }),
            );
          }
        }
      }
    }

    // Matrix B (3x2) with read dots under every entry
    nodes.push(txt('B (6 floats)', 210, -225, 28, ROLE.b, 'mono'));
    for (let k = 0; k < 3; k++) {
      for (let col = 0; col < 2; col++) {
        const cx = 120 + col * 180;
        const cy = -138 + k * 145;
        nodes.push(
          glassCell(cx, cy, 134, 86, ROLE.b, { fill: '#261120', glow: 5 }),
          txt(String(B[k][col]), cx, cy, 38, COSMOS.ink, 'mono'),
        );
        if (showDots) {
          const dotsCount = isShared ? 1 : 2;
          for (let d = 0; d < dotsCount; d++) {
            const dx = dotsCount === 1 ? cx : cx - 18 + d * 36;
            nodes.push(
              glowDot(dx, cy + 64, {
                radius: 6.5,
                color: isShared ? ROLE.good : ROLE.b,
                glow: 9,
              }),
            );
          }
        }
      }
    }

    // Right-side live read counter (floating readout, no bullet cards)
    const countColor = !showDots ? COSMOS.muted : isShared ? ROLE.good : ROLE.warn;
    const countLabel = !showDots ? '--' : isShared ? '12' : '24';
    const subLabel = !showDots
      ? 'waiting for threads'
      : isShared
        ? '6 A + 6 B · 1 dot each'
        : '2 reads per scalar · 3 read twice';
    nodes.push(
      txt('SCALAR INPUT READS', 660, -130, 26, COSMOS.muted, 'mono'),
      txt(countLabel, 660, -40, 86, countColor, 'mono').glow(10, countColor),
      txt(subLabel, 660, 42, 26, countColor, 'sans'),
    );

    if (sw > 0.02) {
      nodes.push(
        txt('INVARIANT ARITHMETIC', 660, 145, 26, COSMOS.muted, 'mono').opacity(sw),
        txt('12 FMAs · 4 C stores', 660, 200, 34, ROLE.c, 'mono').glow(6, ROLE.c).opacity(sw),
        txt('2× fewer reads · identical 24 FLOPs', 0, 398, 30, ROLE.good, 'mono')
          .glow(6, ROLE.good)
          .opacity(sw),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('independent-reads', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'independent-reads', 0.45) })),
  );
  c.on('unique-reads', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'unique-reads', 0.55) })),
  );
  c.on('same-work', () =>
    s.play(sameWork.to(1, { duration: remainDuration(c, 'same-work', 0.45) })),
  );
}
