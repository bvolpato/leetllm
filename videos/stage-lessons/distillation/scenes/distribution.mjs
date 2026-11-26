// Scene 02: What survives when we keep one word? (Dark knowledge vs hard targets)
import {
  COSMOS,
  HARD_TARGET,
  STUDENT_INIT_PROBS,
  TEACHER_PROBS,
  WORDS,
  aura,
  buildDistillTowers3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function distribution(s, c) {
  const phase = s.value(0);
  const sOpen = s.value(0);
  const sHard = s.value(0);
  const sStudent = s.value(0);

  const bgAura = aura(490, 30, 560, '#14345c2a', '#2d1c5014');
  const towers3d = buildDistillTowers3d(phase, {
    x: 525,
    y: 40,
    teacherVals: TEACHER_PROBS,
    studentVals: STUDENT_INIT_PROBS,
    unit: 90,
    streamColor: COSMOS.cyan,
  });

  const title = heroTitle(['What Survives When We', 'Keep Just One Word?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'DARK KNOWLEDGE · SOFT DISTRIBUTION vs HARD TARGET',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const op = sOpen.value;
    const hd = sHard.value;
    const st = sStudent.value;

    const wordX = -830;
    const tBarX = -650;
    const rBarX = -115;
    const barW = 260;
    const barH = 38;

    const nodes = [
      // Prefix banner strip (floating, no heavy chrome)
      txt('PREFIX:', -855, -206, 26, COSMOS.muted, 'mono', 'left'),
      txt('"The child saw a"', -725, -206, 36, COSMOS.ink, 'serif', 'left'),
      glassCell(-310, -208, 172, 56, COSMOS.blue, { fill: '#122645', glow: 6 }),
      txt('bird', -310, -206, 34, COSMOS.blue, 'mono'),
      txt('saved top word', -195, -206, 26, COSMOS.muted, 'sans', 'left'),

      // Column headings
      txt('TOKEN', wordX, -118, 26, COSMOS.muted, 'mono', 'left'),
      txt('TEACHER q', tBarX, -118, 28, COSMOS.blue, 'mono', 'left'),
      txt(
        st > 0.35 ? 'STUDENT p' : hd > 0.25 ? 'HARD TARGET' : 'CONTRAST',
        rBarX,
        -118,
        28,
        st > 0.35 ? COSMOS.cyan : hd > 0.25 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      ),
    ];

    WORDS.forEach((word, i) => {
      const y = -44 + i * 94;
      const q = TEACHER_PROBS[i];
      const hVal = HARD_TARGET[i];
      const pVal = STUDENT_INIT_PROBS[i];

      nodes.push(
        txt(word, wordX, y, 34, i === 2 && st > 0.4 ? COSMOS.gold : COSMOS.ink, 'mono', 'left'),
        // Teacher track
        rect(barW, barH, { fill: '#10182b', stroke: COSMOS.rule, width: 1.8, radius: 6 }).at(
          tBarX + barW * 0.5,
          y,
        ),
      );

      if (op > 0.05) {
        const w = Math.max(8, barW * q * op);
        nodes.push(
          rect(w, barH, { fill: '#1f4f94', stroke: COSMOS.blue, width: 2.2, radius: 6 })
            .at(tBarX + w * 0.5, y)
            .glow(5, COSMOS.blue),
          txt(q.toFixed(3), tBarX + barW + 20, y, 28, COSMOS.blue, 'mono', 'left').opacity(op),
        );
      } else {
        nodes.push(txt('?', tBarX + barW * 0.5, y, 30, COSMOS.gold, 'mono'));
      }

      // Right track (either Hard target during beat 1, or Student during beat 2)
      nodes.push(
        rect(barW, barH, { fill: '#10182b', stroke: COSMOS.rule, width: 1.8, radius: 6 }).at(
          rBarX + barW * 0.5,
          y,
        ),
      );

      if (st > 0.05) {
        const w = Math.max(8, barW * pVal * st);
        const col = i === 2 ? COSMOS.rose : COSMOS.cyan;
        nodes.push(
          rect(w, barH, {
            fill: i === 2 ? '#3d1527' : '#0f3d52',
            stroke: col,
            width: 2.2,
            radius: 6,
          })
            .at(rBarX + w * 0.5, y)
            .glow(i === 2 ? 7 * pulse : 4, col),
          txt(pVal.toFixed(3), rBarX + barW + 20, y, 28, col, 'mono', 'left').opacity(st),
        );
      } else if (hd > 0.05) {
        if (hVal > 0) {
          const w = Math.max(10, barW * hVal * hd);
          nodes.push(
            rect(w, barH, { fill: '#3d300f', stroke: COSMOS.gold, width: 2.2, radius: 6 })
              .at(rBarX + w * 0.5, y)
              .glow(6, COSMOS.gold),
          );
        }
        nodes.push(
          txt(
            hVal.toFixed(3),
            rBarX + barW + 20,
            y,
            28,
            hVal > 0 ? COSMOS.gold : COSMOS.dim,
            'mono',
            'left',
          ).opacity(hd),
        );
      } else {
        nodes.push(txt('waiting', rBarX + barW * 0.5, y, 26, COSMOS.dim, 'mono'));
      }
    });

    if (st > 0.5) {
      nodes.push(
        glowingArc([tBarX + barW + 135, -44], [rBarX - 24, -44], -26, {
          color: COSMOS.emerald,
          width: 3,
          opacity: st,
        }),
        glowingArc([rBarX - 24, 144], [tBarX + barW + 135, 144], 26, {
          color: COSMOS.rose,
          width: 3,
          opacity: st,
        }),
      );
    }

    nodes.push(
      line([-855, 326], [240, 326], { stroke: COSMOS.rule, width: 1.8 }),
      txt(
        st > 0.5
          ? 'Both columns sum to 1.000: raising bird requires lowering cat'
          : hd > 0.5
            ? `Hard target [1, 0, 0, 0] erases dog (${TEACHER_PROBS[1].toFixed(3)}) > cat (${TEACHER_PROBS[2].toFixed(3)})`
            : op > 0.5
              ? `Soft probabilities preserve dog (${TEACHER_PROBS[1].toFixed(3)}) > cat (${TEACHER_PROBS[2].toFixed(3)}) > tree (${TEACHER_PROBS[3].toFixed(3)})`
              : 'From "bird" alone, did the teacher prefer dog or cat?',
        -310,
        374,
        28,
        st > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'sans',
      ),
      txt('4-WORD PROBABILITY SIMPLEX', 525, -370, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Teacher (blue) vs Student (cyan) mass', 525, 408, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, towers3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, towers3d, { theta: -0.22, phi: 0.94 });

  c.after('distribution-open', () =>
    s.play(sOpen.to(1, { duration: remainAfterDuration(c, 'distribution-open', 0.65) })),
  );
  c.on('distribution-hard', () =>
    s.play(sHard.to(1, { duration: remainDuration(c, 'distribution-hard', 0.6) })),
  );
  c.on('distribution-student', () =>
    s.play(sStudent.to(1, { duration: remainDuration(c, 'distribution-student', 0.65) })),
  );
}
