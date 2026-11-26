// Scene 12: Sample answers for the same prompt (4-rollout group, shared prompt identity, group average)
import {
  ANSWERS,
  COSMOS,
  GROUP_4,
  REWARDS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function groupScene(s, c) {
  const phase = s.value(0);
  const sComp = s.value(0);
  const sSplit = s.value(0);
  const sAvg = s.value(0);
  const sBeat = s.value(0);

  const bgAura = aura(0, 20, 640, '#14385c26', '#2c1e5414');
  const title = heroTitle(['Sample Answers for', 'the Same Prompt'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'PROMPT-LOCAL ROLLOUT GROUP · 14 x 12 = 168',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sc = Math.max(0.65, sComp.value);
    const sp = sSplit.value;
    const av = sAvg.value;
    const bt = sBeat.value;

    const x0 = -560;
    const stride = 374;
    const baseY = 210;
    const maxH = 260;

    const nodes = [
      // Shared prompt hub at top center
      glassCell(0, -215, 580, 84, COSMOS.cyan, { fill: '#102138', glow: 8 }),
      txt('SHARED PROMPT:  "14 x 12 = ?"', 0, -213, 30, COSMOS.cyan, 'mono'),
      line([-720, baseY], [720, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    ANSWERS.forEach((ans, i) => {
      const cx = x0 + i * stride;
      const r = REWARDS[i];
      const pass = r === 1;
      const col = pass ? COSMOS.emerald : COSMOS.rose;
      const h = pass ? maxH : 44;

      nodes.push(
        glowingArc([0, -170], [cx, baseY - maxH - 64], -20, {
          color: col,
          width: 2.8,
          opacity: 0.65 * sc,
        }),
        rect(170, h, { fill: pass ? '#12453b' : '#3a1421', stroke: col, width: 2.6, radius: 10 })
          .at(cx, baseY - h * 0.5)
          .glow(bt > 0.3 && pass ? 11 * pulse : 5, col)
          .opacity(sc),
        txt(`R${i + 1}: ${ans}`, cx, baseY + 40, 28, COSMOS.ink, 'mono').opacity(sc),
        txt(sp > 0.2 ? `r = ${r}` : 'r = ?', cx, baseY - h - 26, 30, col, 'mono').opacity(
          Math.max(0.7, sp),
        ),
      );
    });

    if (av > 0.05) {
      const meanY = baseY - GROUP_4.mean * maxH;
      nodes.push(
        line([-740, meanY], [740, meanY], { stroke: COSMOS.gold, width: 3.6, dash: [12, 8] })
          .glow(8, COSMOS.gold)
          .opacity(av),
        txt(
          `GROUP MEAN = ${GROUP_4.mean.toFixed(2)}`,
          740,
          meanY - 28,
          26,
          COSMOS.gold,
          'mono',
          'right',
        )
          .glow(6, COSMOS.gold)
          .opacity(av),
      );
    }

    nodes.push(
      glowDot(-820, 342, { radius: 6, color: COSMOS.emerald }),
      txt(
        bt > 0.3
          ? 'Passes beat this prompt average (+0.5); misses fall below (-0.5) · never mix unrelated prompts'
          : 'All completions share identical prompt, sampling settings, and verifier contract',
        -790,
        344,
        28,
        bt > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('group-b1-1', () => s.play(sComp.to(1, { duration: 0.5 })));
  c.on('group-b2-1', () => s.play(sSplit.to(1, { duration: 0.5 })));
  c.on('group-b2-2', () => s.play(sAvg.to(1, { duration: 0.55 })));
  c.on('group-b3-1', () =>
    s.play(sBeat.to(1, { duration: remainDuration(c, 'group-b3-1', 0.55) })),
  );
}
