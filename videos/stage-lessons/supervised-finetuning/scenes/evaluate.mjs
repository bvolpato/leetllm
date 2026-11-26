// Scene 20: What did the checkpoint actually answer?: Teacher-forced vs free-generation fork with prediction withholding.
import {
  COSMOS,
  arrow,
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

export default function evaluate(s, c) {
  const phase = s.value(0);
  const showRef = s.value(0);
  const showFirst = s.value(0);
  const showRest = s.value(0);
  const showRubric = s.value(0);

  const bgAura = aura(0, 30, 620, '#6ee7b71a', '#ff6b8b16');
  const title = heroTitle(['Teacher-Forced Loss', 'vs. Free Generation'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'EXPOSURE BIAS · HELD-OUT VALIDATION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sr = showRef.value;
    const sf = showFirst.value > 0.5;
    const rst = showRest.value > 0.5;
    const rub = showRubric.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Held-out validation prompt banner (floating glass pill, not a top title banner)
      glassCell(0, -215, 1620, 92, COSMOS.cyan, { fill: '#0e1e30', glow: 8 }),
      txt(
        'HELD-OUT INCIDENT: “My service key is 21 days old. Can I still use it?”',
        0,
        -215,
        32,
        COSMOS.ink,
        'serif',
      ),
    ];

    // Fork node at ASSIST header
    const forkX = -650;
    const forkY = 25;
    nodes.push(
      glassCell(forkX, forkY, 260, 102, COSMOS.gold, { fill: '#1e1910', glow: 10 * pulse }),
      txt('<|assistant|>', forkX, forkY, 28, COSMOS.gold, 'mono'),
    );

    // Top Track: Teacher-Forced Reference Prefix (open -> score "ticket")
    const topY = -65;
    nodes.push(
      glowingArc([forkX + 135, forkY - 22], [-345, topY], -16, {
        color: COSMOS.emerald,
        width: 3.8,
        opacity: Math.max(0.4, sr),
      }),
      txt('TEACHER-FORCED (REFERENCE PREFIX)', -120, topY - 72, 26, COSMOS.emerald, 'mono'),
      glassCell(-180, topY, 320, 98, COSMOS.emerald, { fill: '#0c2624', glow: 8 }),
      txt('open (supplied)', -180, topY, 28, COSMOS.emerald, 'mono'),
      arrow([-12, topY], [148, topY], { stroke: COSMOS.emerald, width: 4.5, tip: 13 }).glow(
        8,
        COSMOS.emerald,
      ),
      glassCell(475, topY, 620, 98, COSMOS.emerald, { fill: '#0c2624', glow: 8 }),
      txt('score P(“ticket” | open) → high!', 475, topY, 28, COSMOS.emerald, 'mono'),
    );

    // Bottom Track: Free Autoregressive Generation (withheld "?" -> "wait" -> "until next month")
    const botY = 125;
    const botCol = rst ? COSMOS.rose : sf ? COSMOS.amber : COSMOS.gold;
    nodes.push(
      glowingArc([forkX + 135, forkY + 22], [-345, botY], 16, {
        color: botCol,
        width: 3.8,
      }),
      txt('FREE GENERATION (REQUEST ALONE)', -120, botY - 72, 26, botCol, 'mono'),
      glassCell(-180, botY, 320, 98, botCol, {
        fill: sf ? '#241418' : '#181622',
        dash: sf ? undefined : [8, 6],
        glow: 10 * pulse,
      }),
      txt(sf ? '“wait”' : '?', -180, botY, sf ? 34 : 44, botCol, 'mono').glow(7, botCol),
      arrow([-12, botY], [148, botY], { stroke: botCol, width: 4.5, tip: 13 }),
      glassCell(475, botY, 620, 98, rst ? COSMOS.rose : '#33446b', {
        fill: rst ? '#26101b' : '#0f1526',
        dash: rst ? undefined : [8, 6],
        glow: rst ? 11 * pulse : 0,
      }),
      txt(
        rst ? '“…until next month.”  (FAIL)' : 'free continuation…',
        475,
        botY,
        30,
        rst ? COSMOS.rose : COSMOS.dim,
        'mono',
      ),
    );

    // Autoregressive feedback loop arrow showing "wait" fed back in!
    if (rst) {
      nodes.push(
        glowingArc([-180, botY + 52], [280, botY + 52], 46, {
          color: COSMOS.rose,
          width: 3.4,
        }),
        glowDot(50, botY + 75, { radius: 6, color: COSMOS.rose }),
      );
    }

    // Bottom 3-axis grading rubric or question prompt
    if (rub > 0.05) {
      const checks = [
        { lbl: '1 · REQUIRED ACTION', x: -550, col: COSMOS.emerald },
        { lbl: '2 · OUTPUT FORMAT', x: 0, col: COSMOS.cyan },
        { lbl: '3 · FALSE-REFUSAL GUARD', x: 550, col: COSMOS.gold },
      ];
      checks.forEach((ck) => {
        nodes.push(
          glassCell(ck.x, 335, 490, 92, ck.col, { fill: '#101829', glow: 8, opacity: rub }),
          txt(ck.lbl, ck.x, 335, 28, ck.col, 'mono').opacity(rub),
        );
      });
      nodes.push(
        txt(
          'Keep the final test set untouched until checkpoint selection is frozen',
          0,
          422,
          27,
          COSMOS.muted,
          'sans',
        ).opacity(rub),
      );
    } else {
      const msgCol = rst ? COSMOS.rose : COSMOS.gold;
      const msg = rst
        ? 'Reference loss looks great while the generated reply breaks policy · Grade free outputs!'
        : 'Can high P("ticket" | open) count as a policy pass yet?';
      nodes.push(
        glassCell(0, 348, 1620, 98, msgCol, { fill: '#101829', glow: 8 }),
        txt(msg, 0, 348, 29, msgCol, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('reference-prefix', () => s.play(showRef.to(1, { duration: 0.45 })));
  c.after('free-first', () => s.play(showFirst.to(1, { duration: 0.3 })));
  c.after('free-rest', () => s.play(showRest.to(1, { duration: 0.35 })));
  c.on('grade-reply', () =>
    s.play(showRubric.to(1, { duration: remainDuration(c, 'grade-reply', 0.5) })),
  );
}
