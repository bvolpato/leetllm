// Scene 17: Where does the student lose ground? (Generalization gap dumbbell rulers)
import {
  CAPACITY_SLICES,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function capacity(s, c) {
  const phase = s.value(0);
  const sFresh = s.value(0);
  const sSubject = s.value(0);
  const sGap = s.value(0);

  const bgAura = aura(180, 30, 620, '#13335b26', '#331a4214');
  const title = heroTitle(['Where Does the Student', 'Lose Ground?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'CAPACITY LIMITS · HELD-OUT GENERALIZATION SLICES',
  });

  // Map 50%..100% onto x in [-340..780]
  const mapRate = (rate) => -340 + ((rate - 50) / 50) * 1120;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const fr = sFresh.value;
    const sb = sSubject.value;
    const gp = sGap.value > 0.5;

    const nodes = [
      txt('ASSIGNED HELD-OUT ACCURACY', -855, -206, 28, COSMOS.muted, 'mono', 'left'),
      glowDot(135, -206, { radius: 8, color: COSMOS.cyan }),
      txt('Student', 162, -204, 28, COSMOS.cyan, 'mono', 'left'),
      line([420, -220], [420, -190], { stroke: COSMOS.blue, width: 6 }),
      txt('Teacher', 442, -204, 28, COSMOS.blue, 'mono', 'left'),
    ];

    // Clean top ruler axis with short ticks (never crossing data labels below)
    nodes.push(
      line([mapRate(50), -118], [mapRate(100), -118], { stroke: COSMOS.rule, width: 2.4 }),
    );
    [50, 60, 70, 80, 90, 100].forEach((tick) => {
      const tx = mapRate(tick);
      nodes.push(
        line([tx, -126], [tx, -110], { stroke: COSMOS.muted, width: 2.4 }),
        txt(`${tick}%`, tx, -152, 26, COSMOS.muted, 'mono'),
      );
    });

    CAPACITY_SLICES.forEach((slice, i) => {
      const y = -48 + i * 124;
      const vis = i === 0 ? 1 : i === 1 ? fr : sb;
      const sx = mapRate(slice.student);
      const tx = mapRate(slice.teacher);
      const isWorst = i === 2 && gp;
      const spanCol = isWorst ? COSMOS.rose : COSMOS.gold;

      nodes.push(
        txt(slice.name, -855, y, 32, isWorst ? COSMOS.rose : COSMOS.ink, 'sans', 'left'),
        line([mapRate(50), y], [mapRate(100), y], { stroke: COSMOS.surfaceAlt, width: 6 }),
      );

      if (vis > 0.08) {
        const curSx = tx - (tx - sx) * vis;
        nodes.push(
          // Glowing gap bar between student and teacher
          line([curSx, y], [tx, y], { stroke: spanCol, width: isWorst ? 9 : 7 })
            .glow(isWorst ? 11 * pulse : 7, spanCol)
            .opacity(vis),
          // Teacher tick
          line([tx, y - 16], [tx, y + 16], { stroke: COSMOS.blue, width: 6.5 })
            .glow(6, COSMOS.blue)
            .opacity(vis),
          // Student orb
          glowDot(curSx, y, { radius: 10, color: COSMOS.cyan, opacity: vis }),
          txt(`${slice.teacher}%`, tx, y - 42, 26, COSMOS.blue, 'mono').opacity(vis),
          txt(`${slice.student}%`, curSx, y + 42, 26, COSMOS.cyan, 'mono').opacity(vis),
        );
        if (gp || i < 2) {
          // Only show gap count on row 2 after capacity-gap is spoken!
          const gapLabel =
            i === 2 && !gp ? '? pts' : `-${slice.gap} pt${slice.gap === 1 ? '' : 's'}`;
          if (tx - curSx > 120) {
            nodes.push(txt(gapLabel, (curSx + tx) * 0.5, y - 34, 26, spanCol, 'mono').opacity(vis));
          }
        }
      }
    });

    // Bottom prediction & diagnostic strip (strictly withheld until capacity-gap!)
    nodes.push(
      glassCell(0, 326, 1660, 118, gp ? COSMOS.rose : COSMOS.gold, {
        fill: gp ? '#2a121c' : '#201b0d',
        dash: gp ? undefined : [8, 6],
        glow: 8 * pulse,
      }),
      txt(
        gp
          ? 'NEW SUBJECT HAS THE WIDEST GAP:   86% - 53% = 33 PERCENTAGE POINTS'
          : 'Which held-out slice has the largest accuracy gap?',
        0,
        300,
        29,
        gp ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt(
        gp
          ? 'Compare base, SFT, distilled & teacher on matched budgets · measure real serving cost & latency'
          : 'Same fixed checkpoints evaluated across three distinct held-out slices',
        0,
        354,
        26,
        COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('capacity-fresh', () => s.play(sFresh.to(1, { duration: 0.85 })));
  c.on('capacity-subject', () => s.play(sSubject.to(1, { duration: 0.85 })));
  c.after('capacity-gap', () =>
    s.play(sGap.to(1, { duration: remainAfterDuration(c, 'capacity-gap', 0.45) })),
  );
}
