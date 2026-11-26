// Scene 01: Would matching the teacher change the student's score?
import {
  COSMOS,
  POLICY_CASES,
  POLICY_REPLIES,
  POLICY_STUDENT,
  POLICY_TEACHER,
  aura,
  buildDistillTowers3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  keyEmblem,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const sTeacher = s.value(0);
  const sDock = s.value(0);
  const sMatch = s.value(0);
  const sRule = s.value(0);
  const sVerdict = s.value(0);

  const bgAura = aura(460, 20, 560, '#1331582a', '#2b1c5014');
  const towers3d = buildDistillTowers3d(phase, {
    x: 500,
    y: 40,
    teacherVals: POLICY_TEACHER,
    studentVals: POLICY_STUDENT,
    streamColor: COSMOS.gold,
  });

  const title = heroTitle(['Would Matching the Teacher', 'Change the Student Score?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'KNOWLEDGE DISTILLATION · TEACHER-STUDENT SIGNAL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const st = Math.max(0.75, sTeacher.value);
    const dk = sDock.value;
    const mt = sMatch.value;
    const rl = sRule.value;
    const vd = sVerdict.value;

    const sqSize = 48;
    const sqStep = 56;
    const gridLeft = -490;
    const teacherY = -60;
    const studentY = 72 + (1 - dk) * 30;

    const nodes = [
      // Left key context (kept well clear of Teacher/Student labels)
      keyEmblem(-770, -34, COSMOS.gold),
      txt('EXPIRED', -770, -110, 26, COSMOS.gold, 'mono'),
      txt('Admin key', -770, 42, 32, COSMOS.ink, 'sans'),
      txt('Restore it?', -770, 86, 26, COSMOS.muted, 'sans'),

      // Column headers for the 10 probability squares
      txt(POLICY_REPLIES[0], gridLeft + 4 * sqStep, -158, 28, COSMOS.ink, 'mono'),
      line([gridLeft - 22, -130], [gridLeft + 8 * sqStep + 22, -130], {
        stroke: COSMOS.blue,
        width: 2.5,
      }),
      txt(POLICY_REPLIES[1], gridLeft + 9 * sqStep, -158, 26, COSMOS.muted, 'mono'),
      line([gridLeft + 9 * sqStep - 22, -130], [gridLeft + 9 * sqStep + 22, -130], {
        stroke: COSMOS.muted,
        width: 2.5,
      }),

      txt('Teacher', gridLeft - 36, teacherY, 28, COSMOS.blue, 'mono', 'right').opacity(st),
      txt('Student', gridLeft - 36, studentY, 28, COSMOS.cyan, 'mono', 'right').opacity(
        Math.max(0.72, dk),
      ),
    ];

    for (let i = 0; i < 10; i++) {
      const cx = gridLeft + i * sqStep;
      const isSeven = i < 9;
      nodes.push(
        rect(sqSize, sqSize, {
          fill: isSeven ? '#17386b' : '#1b2236',
          stroke: isSeven ? COSMOS.blue : COSMOS.dim,
          width: 2.4,
          radius: 8,
        })
          .at(cx, teacherY)
          .glow(isSeven ? 5 : 0, COSMOS.blue)
          .opacity(st),
        rect(sqSize, sqSize, {
          fill: isSeven ? '#0d3b4d' : '#1b2236',
          stroke: isSeven ? COSMOS.cyan : COSMOS.dim,
          width: 2.4,
          radius: 8,
        })
          .at(cx, studentY)
          .glow(isSeven ? 5 : 0, COSMOS.cyan)
          .opacity(Math.max(0.72, dk)),
      );
    }

    nodes.push(
      txt(
        '1 square = 10% probability (90% on 7 days)',
        gridLeft + 240,
        160,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Prediction vs match readout (strictly withheld until intro-match!)
      glassCell(-335, 256, 1040, 88, mt > 0.5 ? COSMOS.gold : COSMOS.cyan, {
        fill: mt > 0.5 ? '#201b0d' : '#0f1c32',
        dash: mt > 0.5 ? undefined : [8, 6],
        glow: 8 * pulse,
      }),
      txt(
        mt > 0.5
          ? 'Student - Teacher = 0.90 - 0.90 = 0.00 -> stays put'
          : 'Score for "7 days": go up, go down, or stay put?',
        -335,
        258,
        28,
        COSMOS.gold,
        'mono',
      ),
    );

    if (rl > 0.08) {
      nodes.push(
        txt('KEY POLICY:', -835, 368, 28, COSMOS.muted, 'mono', 'left').opacity(rl),
        line([-615, 392], [-615 + 620 * rl, 392], {
          stroke: vd > 0.5 ? COSMOS.rose : COSMOS.muted,
          width: 3,
        }),
      );
    }

    if (vd > 0.35) {
      nodes.push(
        glowDot(-595, 366, { radius: 7, color: COSMOS.rose, opacity: vd }),
        txt(
          `${POLICY_CASES[1].rule.toUpperCase()}  (both models match a wrong answer)`,
          -570,
          368,
          28,
          COSMOS.rose,
          'mono',
          'left',
        )
          .glow(6, COSMOS.rose)
          .opacity(vd),
      );
    }

    nodes.push(
      txt('ZERO-KL TEACHER / STUDENT MATCH', 500, -370, 26, COSMOS.blue, 'mono').glow(
        5,
        COSMOS.blue,
      ),
      txt('Matching logits fixes alignment, not ground truth', 500, 408, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, towers3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, towers3d, { theta: -0.18, phi: 0.92 });

  c.on('intro-teacher', () => s.play(sTeacher.to(1, { duration: 0.45 })));
  c.on('intro-student', () => s.play(sDock.to(1, { duration: 0.65 })));
  c.after('intro-match', () =>
    s.play(sMatch.to(1, { duration: remainAfterDuration(c, 'intro-match', 0.45) })),
  );
  c.on('intro-rule', () =>
    s.play(sRule.to(1, { duration: remainDuration(c, 'intro-rule', 0.55) })),
  );
  c.after('intro-verdict', () =>
    s.play(sVerdict.to(1, { duration: remainAfterDuration(c, 'intro-verdict', 0.45) })),
  );
}
