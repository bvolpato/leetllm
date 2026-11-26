// Scene 07: How much weight does each worker carry? Split-KV 6 keys across Worker A & B + score change to ln(3).
import {
  COSMOS,
  ROLE,
  SPLIT_EQ,
  SPLIT_LN3,
  aura,
  buildSplitMergeTree3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function merge(s, c) {
  const phase = s.value(0);
  const splitShown = s.value(0);
  const revShare1 = s.value(0); // strictly withheld until merge-share!
  const changeLast = s.value(0); // raises k5 score from 0 to ln(3)
  const revShare2 = s.value(0); // strictly withheld until merge-equal!

  const bgAura = aura(430, 15, 540, '#60a5fa20', '#a78bfa20');
  const { view: tree3d } = buildSplitMergeTree3d(changeLast, phase, { x: 455, y: 15, unit: 100 });

  const title = heroTitle(['How Much Weight', 'Per Worker?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'SPLIT-KV ATTENTION · NORMALIZATION MASS',
    subtitle: 'Worker A: 4 keys v=[1,0] · Worker B: 2 keys v=[0,1]',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sp = splitShown.value;
    const r1 = revShare1.value;
    const ch = changeLast.value;
    const r2 = revShare2.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const k5Mass = 1 + ch * 2; // 1 -> 3 (exp(ln(3)) = 3)
    const masses = [1, 1, 1, 1, 1, k5Mass];
    const barUnit = 68;
    const baseY = 148;

    const nodes = [
      txt('3D SPLIT-KV MERGE CASCADE', 455, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        r2 > 0.5
          ? 'Both workers carry mass 4 -> exact 50% / 50% split'
          : ch > 0.5
            ? 'Last score jumps to ln(3) -> bar triples to 3 units'
            : 'Disjoint CTAs stream partial states to merge prism',
        455,
        420,
        26,
        r2 > 0.5 ? ROLE.good : ch > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
      line([-845, baseY], [20, baseY], { stroke: COSMOS.rule, width: 3 }),
      txt('WORKER A (k0..k3 · v=[1,0])', -625, -142, 26, ROLE.r0, 'mono'),
      txt('WORKER B (k4..k5 · v=[0,1])', -150, -142, 26, ROLE.r1, 'mono'),
    ];

    // Page boundary divider between k3 and k4
    if (sp > 0.05) {
      nodes.push(
        line([-352, -110], [-352, baseY + 34], {
          stroke: COSMOS.gold,
          width: 3,
          dash: [8, 6],
        }).opacity(sp),
      );
    }

    // 6 weight bars for k0..k5
    const barXs = [-775, -660, -545, -430, -255, -115];
    masses.forEach((m, idx) => {
      const cx = barXs[idx];
      const isA = idx < 4;
      const col = idx === 5 && ch > 0.3 ? COSMOS.gold : isA ? ROLE.r0 : ROLE.r1;
      // During first prediction hold (before merge-share), show score s=0 markers without revealing mass totals!
      const h = r1 > 0.05 ? m * barUnit : 56;
      nodes.push(
        rect(78, h, {
          fill: isA ? '#153a6b' : idx === 5 && ch > 0.3 ? '#4f3b11' : '#351b5e',
          stroke: col,
          width: 2.6,
          radius: 8,
        })
          .at(cx, baseY - h * 0.5)
          .glow(idx === 5 && ch > 0.3 ? 10 * pulse : 5, col),
        txt(`k${idx}`, cx, baseY + 30, 26, COSMOS.muted, 'mono'),
        txt(
          r1 < 0.5 ? 's=0' : idx === 5 && ch > 0.5 ? `${m.toFixed(0)}` : '1',
          cx,
          baseY - h - 24,
          26,
          col,
          'mono',
        ),
      );
    });

    // Bottom share / verdict box (strictly withheld until merge-share and merge-equal!)
    let bCol = COSMOS.gold;
    let bLine1 = 'All 6 scores = 0: which worker gets more?';
    let bLine2 = 'Worker A holds 4 keys; Worker B holds 2 keys';

    if (r1 > 0.5 && ch < 0.05) {
      bCol = ROLE.good;
      const aPct = Math.round(SPLIT_EQ.result.output[0] * 1000) / 10;
      const bPct = Math.round(SPLIT_EQ.result.output[1] * 1000) / 10;
      bLine1 = `Mass 4 vs 2 -> A = 2/3 (${aPct}%), B = 1/3 (${bPct}%)`;
      bLine2 = 'Output = [2/3, 1/3] along the two value axes';
    } else if (ch > 0.05 && r2 < 0.5) {
      bCol = COSMOS.gold;
      bLine1 = 'k5 -> ln(3) (mass 3): how does weight split?';
      bLine2 = 'Left has 4×1; right has 1 + 3';
    } else if (r2 > 0.5) {
      bCol = ROLE.good;
      bLine1 = `Mass 4 vs 4 -> A = ${SPLIT_LN3.result.output[0].toFixed(1)}, B = ${SPLIT_LN3.result.output[1].toFixed(1)} (50% / 50%)`;
      bLine2 = 'Key counts fail when scores differ; track each worker mass';
    }

    nodes.push(
      glassCell(-415, 315, 880, 120, bCol, { fill: '#0e172a', glow: 9 }),
      txt(bLine1, -415, 290, 26, bCol, 'mono').glow(5, bCol),
      txt(bLine2, -415, 342, 26, COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, tree3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, tree3d, { theta: -0.22, phi: 0.94 });

  c.on('merge-split', () =>
    s.play(splitShown.to(1, { duration: remainDuration(c, 'merge-split', 0.4) })),
  );
  c.after('merge-share', () =>
    s.play(revShare1.to(1, { duration: remainAfter(c, 'merge-share', 0.45) })),
  );
  c.on('merge-change', () =>
    s.play(changeLast.to(1, { duration: remainDuration(c, 'merge-change', 0.5) })),
  );
  c.after('merge-equal', () =>
    s.play(revShare2.to(1, { duration: remainAfter(c, 'merge-equal', 0.45) })),
  );
}
