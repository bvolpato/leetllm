// Scene 15: distill-benchmark: R1-distilled Qwen students on AIME 2024 (1.5B ~28.9%, 7B 55.5%, 32B 72.6%) vs Full DeepSeek-R1 (79.8%) + deployment economics.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function distillBenchmark(s, c) {
  const showStudents = s.value(0);
  const showFull = s.value(0);
  const showEcon = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(
    ['Distilling Reasoning Traces:', 'AIME 2024 Student Scaling vs Full R1'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.ok,
    },
  );

  const rows = [
    { lbl: 'R1-Distill 1.5B', val: 28.9, col: ROLE.draft },
    { lbl: 'R1-Distill 7B', val: 55.5, col: ROLE.search },
    { lbl: 'R1-Distill 32B', val: 72.6, col: ROLE.gold },
    { lbl: 'Full DeepSeek-R1', val: 79.8, col: ROLE.ok },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = showStudents.value;
    const fl = showFull.value;
    const ec = showEcon.value;

    const barX = -460;
    const maxW = 860;

    const nodes = [
      txt(
        'AIME 2024 PASS@1 (SAMPLED AT TEMP = 0.6, TOP-P = 0.95)',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rows.forEach((r, idx) => {
      const y = -120 + idx * 92;
      const op =
        idx === 3 ? alpha * (0.48 + 0.52 * fl) : idx >= 1 ? alpha * (0.48 + 0.52 * st) : alpha;
      nodes.push(
        txt(r.lbl, -855, y, 28, r.col, 'mono', 'left').opacity(op),
        lumBar(barX, y, (r.val / 100) * maxW, 40, r.col, { opacity: op, maxTrackW: maxW }),
        txt(`${r.val.toFixed(1)}%`, barX + maxW + 24, y, 28, r.col, 'mono', 'left').opacity(op),
      );
    });

    nodes.push(
      chipPill(
        ec > 0.35
          ? 'High-volume repetitive traffic can repay teacher trace generation via a fast distilled student!'
          : 'Distilled 7B & 32B Qwen students capture strong reasoning from teacher worked traces',
        0,
        280,
        {
          w: 1620,
          h: 74,
          color: ec > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-distill-benchmark-0', (d) => s.play(showStudents.to(0.3, { duration: d })));
  playCue(s, c, 'tt-student-results', (d) => s.play(showStudents.to(0.5, { duration: d })));
  playCue(s, c, 'r1-seven-billion', (d) => s.play(showStudents.to(0.8, { duration: d })));
  playCue(s, c, 'r1-thirty-two-billion', (d) => s.play(showStudents.to(1, { duration: d })));
  playCue(s, c, 'tt-distill-benchmark-1', (d) => s.play(showFull.to(0.5, { duration: d })));
  playCue(s, c, 'tt-r1-result', (d) => s.play(showFull.to(1, { duration: d })));
  playCue(s, c, 'tt-distill-benchmark-2', (d) => s.play(showEcon.to(1, { duration: d })));
}
