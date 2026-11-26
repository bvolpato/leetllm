// Scene 18: Separate admission success from trained capability (Matched-budget trial, privacy wall, 5-slice release floor)
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
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function downstreamTrial(s, c) {
  const phase = s.value(0);
  const sMatched = s.value(0);
  const sWeights = s.value(0);
  const sBudget = s.value(0);
  const sGenCost = s.value(0);
  const sAct2 = s.value(0);
  const sPrivate = s.value(0);
  const sOverlap = s.value(0);
  const sAct3 = s.value(0);
  const sSlices = s.value(0);
  const sSelect = s.value(0);
  const sBoundary = s.value(0);
  const sUnrun = s.value(0);

  const bgAura = aura(0, 15, 680, '#133a5c2a', '#2d1c4d18');

  const title = heroTitle(['Separate Admission Success', 'From Trained Capability'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'DOWNSTREAM EVALUATION · MATCHED BUDGETS & ISOLATED TESTS',
  });

  const sliceDefs = [
    { name: 'Common', col: COSMOS.blue },
    { name: 'Rare', col: COSMOS.cyan },
    { name: 'Unsafe', col: COSMOS.rose },
    { name: 'Tool Err', col: COSMOS.amber },
    { name: 'Refusal', col: COSMOS.emerald },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    // Act 3: 5-slice release contract + separate final test
    if (sAct3.value > 0.5) {
      const sl = Math.max(0.75, sSlices.value);
      const sel = sSelect.value > 0.3;
      const bnd = sBoundary.value > 0.3;
      const unr = sUnrun.value > 0.3;

      const nodes = [
        txt(
          'DECLARED RELEASE FLOOR ACROSS FIVE CAPABILITY SLICES',
          0,
          -196,
          26,
          COSMOS.blue,
          'mono',
        ),
      ];

      sliceDefs.forEach((slc, i) => {
        const cx = -660 + i * 330;
        nodes.push(
          glassCell(cx, 12, 290, 260, slc.col, { fill: '#0f1b30', glow: 6, opacity: sl }),
          txt(slc.name, cx, -66, 30, slc.col, 'mono'),
          line([cx - 105, -24], [cx + 105, -24], { stroke: COSMOS.rule, width: 1.8 }),
          txt('n & score', cx, 26, 26, COSMOS.ink, 'mono'),
          txt('+/- error', cx, 84, 26, COSMOS.muted, 'mono'),
        );
      });

      nodes.push(
        glassCell(0, 240, 1620, 96, sel ? COSMOS.gold : COSMOS.rule, {
          fill: sel ? '#241b0d' : '#0c1222',
          glow: sel ? 8 : 2,
        }),
        txt(
          'Tune recipe on development split   ·   Reserve untouched FINAL TEST for release',
          0,
          242,
          28,
          sel ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
        glassCell(0, 368, 1620, 92, bnd || unr ? COSMOS.rose : COSMOS.cyan, {
          fill: '#10182b',
          glow: bnd ? 8 * pulse : 4,
        }),
        txt(
          unr
            ? 'Apply all 5 slice gates to the checkpoint'
            : 'Never confuse filter pass rate with trained capability',
          0,
          370,
          26,
          unr ? COSMOS.cyan : COSMOS.rose,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Act 2: Optical red firewall isolating private held-out suite
    if (sAct2.value > 0.5) {
      const prv = Math.max(0.75, sPrivate.value);
      const ovl = sOverlap.value > 0.3;
      const nodes = [
        txt(
          'ISOLATE HELD-OUT BENCHMARKS FROM GENERATION & FEEDBACK',
          0,
          -196,
          26,
          COSMOS.rose,
          'mono',
        ),

        // Left side: Generator + Training
        glassCell(-465, -36, 730, 150, COSMOS.cyan, { fill: '#0f2338', glow: 6 }),
        txt('GENERATOR + TRAINING PIPELINE', -465, -62, 28, COSMOS.cyan, 'mono'),
        txt('Sees ONLY yes / no overlap decision', -465, -4, 26, COSMOS.ink, 'sans'),

        // Central red isolation wall
        line([0, -124], [0, 250], { stroke: COSMOS.rose, width: 5, dash: [12, 8] }).glow(
          10,
          COSMOS.rose,
        ),
        txt('PRIVACY WALL', 0, -158, 26, COSMOS.rose, 'mono'),

        // Right side: Private held-out suite + restricted screening service
        glassCell(465, -36, 730, 150, COSMOS.gold, {
          fill: '#241b0d',
          glow: 7,
          opacity: prv,
        }),
        txt('PRIVATE HELD-OUT TASKS & ANSWERS', 465, -62, 28, COSMOS.gold, 'mono'),
        txt('Contents hidden from generator', 465, -4, 26, COSMOS.ink, 'sans'),

        glassCell(465, 162, 730, 120, COSMOS.blue, { fill: '#0e1d36', glow: 6, opacity: prv }),
        txt('RESTRICTED OVERLAP SERVICE', 465, 144, 28, COSMOS.blue, 'mono'),
        txt('5-word index + MinHash Jaccard estimate', 465, 188, 26, COSMOS.muted, 'sans'),

        glowingArc([465, 42], [465, 98], 0, { color: COSMOS.gold, width: 3.4, opacity: prv }),
        glowingArc([92, 162], [-150, 162], 0, { color: COSMOS.blue, width: 3.8, opacity: prv }),
        glowDot(-150, 162, { radius: 7, color: COSMOS.blue, opacity: prv }),
        txt('decision only', -325, 164, 28, COSMOS.blue, 'mono'),

        glassCell(0, 352, 1620, 96, ovl ? COSMOS.amber : COSMOS.rule, {
          fill: '#10182b',
          glow: ovl ? 7 : 2,
        }),
        txt(
          '5-word matches miss paraphrases & flag routine phrases -> review hits in context',
          0,
          354,
          28,
          ovl ? COSMOS.amber : COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    // Act 1: Matched starting weights -> Real-only vs Real + Synthetic equal token budget
    const wt = Math.max(0.75, sWeights.value, sMatched.value);
    const bg = sBudget.value > 0.3;
    const gc = sGenCost.value > 0.3;

    const nodes = [
      glassCell(0, -148, 860, 94, COSMOS.blue, { fill: '#0e1d36', glow: 7 }),
      txt('SAME STARTING WEIGHTS (BASE CHECKPOINT)', 0, -146, 30, COSMOS.blue, 'mono'),

      glowingArc([-180, -96], [-435, -18], -10, { color: COSMOS.blue, width: 3.6, opacity: wt }),
      glowingArc([180, -96], [435, -18], -10, { color: COSMOS.cyan, width: 3.6, opacity: wt }),

      // Left arm: Real-only
      glassCell(-435, 58, 760, 148, COSMOS.blue, { fill: '#0e1d36', glow: 6, opacity: wt }),
      txt('BASELINE: REAL-ONLY RECIPE', -435, 22, 28, COSMOS.blue, 'mono'),
      rect(640, 48, { fill: '#194587', stroke: COSMOS.blue, width: 2.2, radius: 6 }).at(-435, 86),
      txt('100% real training tokens', -435, 88, 26, COSMOS.ink, 'mono'),

      // Right arm: Real + Synthetic (same total token bar width = 640!)
      glassCell(435, 58, 760, 148, COSMOS.cyan, { fill: '#0f2338', glow: 6, opacity: wt }),
      txt('CANDIDATE: REAL + SYNTHETIC', 435, 22, 28, COSMOS.cyan, 'mono'),
      rect(426, 48, { fill: '#194587', stroke: COSMOS.blue, width: 2.2, radius: 4 }).at(328, 86),
      rect(214, 48, { fill: '#104c5c', stroke: COSMOS.cyan, width: 2.2, radius: 4 }).at(648, 86),
      txt('real', 328, 88, 26, COSMOS.ink, 'mono'),
      txt('synth', 648, 88, 26, COSMOS.cyan, 'mono'),

      // Budget & generation cost footer
      glassCell(0, 240, 1620, 92, bg ? COSMOS.gold : COSMOS.rule, {
        fill: bg ? '#231b0d' : '#0c1222',
        glow: bg ? 7 : 2,
      }),
      txt(
        'MATCH DECLARED TOKEN / COMPUTE BUDGET (equal steps != equal tokens)',
        0,
        242,
        28,
        bg ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),

      glassCell(0, 368, 1620, 92, gc ? COSMOS.rose : COSMOS.rule, {
        fill: gc ? '#261018' : '#0c1222',
        glow: gc ? 8 * pulse : 2,
      }),
      txt(
        'Report real-data exposure change + full generation & filtering compute costs',
        0,
        370,
        28,
        gc ? COSMOS.rose : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('matched-trial', () => s.play(sMatched.to(1, { duration: 0.4 })));
  c.after('start-weights', () => s.play(sWeights.to(1, { duration: 0.35 })));
  c.on('budget-match', () => s.play(sBudget.to(1, { duration: 0.45 })));
  c.on('generation-cost', () => s.play(sGenCost.to(1, { duration: 0.45 })));

  c.on('evaluation-isolation', () => s.play(sAct2.to(1, { duration: 0.3 })));
  c.after('holdout-private', () => s.play(sPrivate.to(1, { duration: 0.35 })));
  c.on('overlap-limits', () => s.play(sOverlap.to(1, { duration: 0.45 })));

  c.on('suite-slices', () => {
    s.play(sAct3.to(1, { duration: 0.3 }), sSlices.to(1, { duration: 0.45 }));
  });
  c.on('selection-separate', () => s.play(sSelect.to(1, { duration: 0.45 })));
  c.on('measurement-boundary', () => s.play(sBoundary.to(1, { duration: 0.45 })));
  c.on('unrun-comparison', () =>
    s.play(sUnrun.to(1, { duration: remainDuration(c, 'unrun-comparison', 0.45) })),
  );
}
