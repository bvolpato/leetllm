// Scene 10: The path the student visits can drift (Exposure bias & on-policy teacher feedback)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefixSnapshot,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function prefixes(s, c) {
  const phase = s.value(0);
  const refProg = s.value(0.25);
  const stuProg = s.value(0);
  const fbProg = s.value(0);
  const indProg = s.value(0);

  const bgAura = aura(260, 40, 620, '#13355c26', '#2e1d5214');
  const title = heroTitle(['The Path the Student', 'Visits Can Drift'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'EXPOSURE BIAS · ON-POLICY DISTILLATION (OPD)',
  });

  const snap = prefixSnapshot(2, 1);
  const refTokens = ['bird', 'in', 'the', 'garden'];
  const stuTokens = ['dog', 'near', 'the', 'gate'];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rp = refProg.value;
    const sp = stuProg.value;
    const fb = fbProg.value;
    const ind = indProg.value;

    const nodes = [
      // Shared prefix anchor on left
      glassCell(-690, -18, 320, 108, COSMOS.gold, { fill: '#221b0c', glow: 8 }),
      txt('SHARED PREFIX', -690, -44, 26, COSMOS.gold, 'mono'),
      txt('The child saw a', -690, 4, 34, COSMOS.ink, 'serif'),

      // Upper branch: Reference path (offline teacher)
      txt('OFFLINE REFERENCE PATH', -420, -196, 26, COSMOS.blue, 'mono', 'left'),
      glowingArc([-530, -48], [-420, -118], -22, { color: COSMOS.blue, width: 3.4 }),

      // Lower branch: Student rollout path (on-policy)
      txt('STUDENT ROLLOUT PATH (LIVE)', -420, 48, 26, COSMOS.cyan, 'mono', 'left'),
      glowingArc([-530, 12], [-420, 126], 22, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: Math.max(0.4, sp),
      }),
    ];

    // Reference lane tokens
    refTokens.forEach((tok, i) => {
      const cx = -345 + i * 165;
      const vis = Math.max(0.3, Math.min(1, rp * 4 - i));
      nodes.push(
        glassCell(cx, -118, 144, 76, COSMOS.blue, {
          fill: '#132548',
          glow: vis > 0.8 ? 5 : 1,
          opacity: vis,
        }),
        txt(tok, cx, -116, 30, COSMOS.blue, 'mono').opacity(vis),
      );
    });

    // Student lane tokens
    stuTokens.forEach((tok, i) => {
      const cx = -345 + i * 165;
      const vis = Math.max(0.25, Math.min(1, sp * 4 - i));
      nodes.push(
        glassCell(cx, 126, 144, 76, COSMOS.cyan, {
          fill: '#0e3447',
          glow: vis > 0.8 ? 6 : 1,
          opacity: vis,
        }),
        txt(tok, cx, 128, 30, COSMOS.cyan, 'mono').opacity(vis),
      );
    });

    // Right side: Two Conditional Teacher Oracle panels (after "bird" vs after "dog")
    const drawOracle = (cy, label, values, col, ready) => {
      nodes.push(
        glassCell(560, cy, 560, 210, ready ? col : COSMOS.rule, {
          fill: '#10192e',
          glow: ready ? 8 * pulse : 2,
          opacity: ready ? 1 : 0.65,
        }),
        txt(label, 560, cy - 72, 26, ready ? col : COSMOS.muted, 'mono'),
      );
      const base = cy + 62;
      line([325, base], [795, base], { stroke: COSMOS.rule, width: 2 });
      snap.words.forEach((w, j) => {
        const bx = 400 + j * 160;
        const h = Math.max(12, values[j] * 115);
        if (ready) {
          nodes.push(
            rect(86, h, {
              fill: col === COSMOS.blue ? '#17386b' : '#0f3c50',
              stroke: col,
              width: 2.2,
              radius: 5,
            })
              .at(bx, base - h * 0.5)
              .glow(4, col),
            txt(values[j].toFixed(2), bx, base - h - 22, 26, col, 'mono'),
          );
        } else {
          nodes.push(txt('pending', bx, cy + 8, 26, COSMOS.dim, 'mono'));
        }
        nodes.push(txt(w, bx, base + 28, 26, COSMOS.muted, 'mono'));
      });
    };

    drawOracle(-118, 'TEACHER | "... a bird"', snap.referenceTeacher, COSMOS.blue, rp > 0.45);
    drawOracle(132, 'TEACHER | "... a dog"', snap.visitedTeacher, COSMOS.cyan, fb > 0.45);

    // On-policy query loop arc from student "dog" to lower Teacher Oracle
    if (fb > 0.08) {
      nodes.push(
        glowingArc([-270, 174], [275, 174], 54, { color: COSMOS.emerald, width: 3.8, opacity: fb }),
        glowDot(275, 174, { radius: 8, color: COSMOS.emerald, opacity: fb }),
        txt('query teacher on visited prefix', 0, 224, 26, COSMOS.emerald, 'mono').opacity(fb),
      );
    }

    // Bottom orthogonal decision callout (beat 2)
    nodes.push(
      glassCell(0, 344, 1620, 92, ind > 0.35 ? COSMOS.gold : COSMOS.rule, {
        fill: ind > 0.35 ? '#201b0d' : '#10182b',
        glow: ind > 0.35 ? 8 * pulse : 2,
      }),
      txt(
        ind > 0.35
          ? 'ORTHOGONAL CHOICES:   Prefix source (Offline vs On-Policy)   x   Divergence (Forward vs Reverse KL)'
          : 'Student generates its own earlier tokens -> query teacher where the student actually goes',
        0,
        346,
        28,
        ind > 0.35 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('prefixes-b1-1', () => s.play(refProg.to(1, { duration: 1.4 })));
  c.on('prefixes-b2-1', () => s.play(stuProg.to(1, { duration: 1.2 })));
  c.on('prefixes-b2-2', () => s.play(fbProg.to(1, { duration: 0.9 })));
  c.on('prefixes-b3-1', () =>
    s.play(indProg.to(1, { duration: remainDuration(c, 'prefixes-b3-1', 0.6) })),
  );
}
