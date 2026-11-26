// Scene 03: Ask for coverage that matters (Seed branching into distinct edge cases vs paraphrase inflation)
import {
  COSMOS,
  GENERATED_CASES,
  aura,
  buildExpansionTree3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function generate(s, c) {
  const phase = s.value(0);
  const sCases = s.value(0);
  const sExpected = s.value(0);
  const sCoverage = s.value(0);
  const sFamily = s.value(0);

  const bgAura = aura(440, 20, 560, '#123e5c2a', '#2e1d5216');
  const tree3d = buildExpansionTree3d(phase, { x: 485, y: 15 });

  const title = heroTitle(['Ask for Coverage', 'That Matters'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CANDIDATE GENERATION · BEHAVIOR FAMILIES VS ROW COUNT',
  });

  const famNames = ['Cursor', 'Retry', 'Limit'];
  const famColors = [COSMOS.cyan, COSMOS.emerald, COSMOS.rose];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const cs = Math.max(0.75, sCases.value);
    const ex = sExpected.value;
    const cov = sCoverage.value;
    const fm = sFamily.value;

    const visibleCount = fm > 0.3 ? 5 : cov > 0.3 ? 4 : 3;
    const rows = GENERATED_CASES.slice(0, visibleCount);
    const distinctFamilies = new Set(rows.map((r) => r.family)).size;

    const nodes = [
      txt('3D SEED EXPANSION CONSTELLATION', 485, -365, 26, COSMOS.cyan, 'mono'),
      txt('Branching from S12 across edge-case behaviors', 485, 395, 26, COSMOS.muted, 'sans'),

      // Left coverage matrix header
      txt('CANDIDATE & EXPECTED BEHAVIOR', -845, -198, 26, COSMOS.muted, 'mono', 'left'),
      ...famNames.map((name, k) => txt(name, -185 + k * 126, -198, 26, famColors[k], 'mono')),
      line([-850, -170], [135, -170], { stroke: COSMOS.rule, width: 2 }),
    ];

    rows.forEach((row, i) => {
      const y = -114 + i * 96;
      const col = famColors[row.family];
      const isParaphrase = i >= 3;
      nodes.push(
        glassCell(-555, y, 580, 84, isParaphrase ? COSMOS.amber : col, {
          fill: isParaphrase ? '#241a0d' : '#0f1b30',
          glow: isParaphrase ? 7 * pulse : 4,
          opacity: cs,
        }),
        txt(
          `${row.id} · ${row.task}`,
          -825,
          ex > 0.3 ? y - 18 : y + 2,
          26,
          isParaphrase ? COSMOS.amber : col,
          'mono',
          'left',
        ),
      );
      if (ex > 0.3) {
        nodes.push(txt(row.expected, -825, y + 16, 26, COSMOS.muted, 'sans', 'left').opacity(ex));
      }

      // 3 behavior family columns
      famNames.forEach((_f, k) => {
        const cx = -185 + k * 126;
        const on = k === row.family;
        nodes.push(
          rect(88, 56, {
            fill: on ? (isParaphrase ? '#38250e' : '#122c3c') : '#0b1120',
            stroke: on ? (isParaphrase ? COSMOS.amber : col) : COSMOS.rule,
            width: on ? 2.4 : 1.4,
            radius: 8,
          }).at(cx, y),
        );
        if (on) {
          nodes.push(glowDot(cx, y, { radius: 8, color: isParaphrase ? COSMOS.amber : col }));
        }
      });
    });

    // Bottom readout comparing Row Count vs Distinct Behavior Families
    nodes.push(
      glassCell(-360, 386, 980, 102, fm > 0.3 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#101a2e',
        glow: fm > 0.3 ? 8 : 4,
      }),
      txt(
        `Rows: ${visibleCount}   ·   Distinct behavior families: ${distinctFamilies}`,
        -360,
        364,
        28,
        COSMOS.gold,
        'mono',
      ),
      txt(
        fm > 0.3
          ? 'Paraphrases inflate row counts without adding new skills'
          : 'Track coverage by behavior and difficulty alongside row counts',
        -360,
        408,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.18, phi: 0.96 });

  c.on('generate-b1-1', () => s.play(sCases.to(1, { duration: 0.45 })));
  c.on('generate-b1-2', () => s.play(sExpected.to(1, { duration: 0.45 })));
  c.on('generate-b2-1', () => s.play(sCoverage.to(1, { duration: 0.5 })));
  c.on('generate-b3-1', () =>
    s.play(sFamily.to(1, { duration: remainDuration(c, 'generate-b3-1', 0.5) })),
  );
}
