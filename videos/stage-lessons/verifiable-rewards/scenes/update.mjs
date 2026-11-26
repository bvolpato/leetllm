// Scene 20: Will the passing pair gain probability? (4-response categorical step: 50% -> 62.2%)
import {
  ANSWERS,
  COSMOS,
  GROUP_4,
  REWARDS,
  aura,
  categoricalUpdate,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function update(s, c) {
  const phase = s.value(0);
  const stepProg = s.value(0); // 0 -> uniform [25,25,25,25], 1 -> [31.1,18.9,31.1,18.9]
  const sShared = s.value(0);

  const bgAura = aura(0, 20, 640, '#123e3626', '#2e1d5414');
  const title = heroTitle(['Will the Passing Pair', 'Gain Probability?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'POLICY GRADIENT STEP · lr = 1.0 · ADVANTAGES [+1, -1, +1, -1]',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const st = stepProg.value;
    const sh = sShared.value;
    const cur = categoricalUpdate(GROUP_4.advantages, st);

    const x0 = -720;
    const stride = 210;
    const baseY = 230;
    const maxH = 540; // scale so 0.5 -> 270px

    const nodes = [
      txt('4-CHOICE POLICY PROBABILITIES', -830, -195, 26, COSMOS.cyan, 'mono', 'left'),
      line([-840, baseY], [30, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    cur.probabilities.forEach((prob, i) => {
      const cx = x0 + i * stride;
      const pass = REWARDS[i] === 1;
      const col = pass ? COSMOS.emerald : COSMOS.rose;
      const h = Math.max(24, prob * maxH);
      nodes.push(
        rect(134, h, { fill: pass ? '#12463b' : '#3a1421', stroke: col, width: 2.6, radius: 8 })
          .at(cx, baseY - h * 0.5)
          .glow(pass ? 8 * pulse : 3, col),
        txt(`R${i + 1} (${ANSWERS[i]})`, cx, baseY + 38, 26, COSMOS.muted, 'mono'),
        txt(`${(prob * 100).toFixed(1)}%`, cx, baseY - h - 28, 30, col, 'mono'),
      );
    });

    // Right readout: Passing pair probability mass (50.0% -> 62.2%)
    const rx = 470;
    nodes.push(
      glassCell(rx, -90, 680, 175, st > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: st > 0.5 ? '#0e2824' : '#241e0e',
        glow: 9 * pulse,
      }),
      txt('PASSING PAIR MASS  p(R1) + p(R3)', rx, -135, 26, COSMOS.muted, 'mono'),
      txt(
        `${(cur.rewardedMass * 100).toFixed(1)}%`,
        rx,
        -60,
        74,
        st > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(9, st > 0.5 ? COSMOS.emerald : COSMOS.gold),

      txt(
        st > 0.5
          ? 'Logits moved +0.25 (pass) / -0.25 (fail)'
          : 'Start uniform (25% each -> 50% passing)',
        rx,
        66,
        28,
        COSMOS.ink,
        'mono',
      ),
      glowDot(rx - 320, 152, { radius: 6, color: COSMOS.cyan }),
      txt(
        sh > 0.3
          ? 'Full LM shares weights across all tokens · sample & check!'
          : 'What happens to the green share after 1 step?',
        rx - 294,
        154,
        26,
        sh > 0.3 ? COSMOS.cyan : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('update-b1-1', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.after('update-b2-1', () => s.play(stepProg.to(1, { duration: 0.9 })));
  c.on('update-b3-1', () =>
    s.play(sShared.to(1, { duration: remainDuration(c, 'update-b3-1', 0.45) })),
  );
}
