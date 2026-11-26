// Scene 23: Where does the layer clock start?
// PREDICTION SCENE: Beat 2 compares Kernel (100 vs 70 us) + Prep (20 vs 60 us).
// STRICT WITHHOLDING: DO NOT show totals (120 vs 130 us) or winner/loser verdict colors until Beat 3 c.after!
import {
  COSMOS,
  ROLE,
  aura,
  buildMegaMoeRing3d,
  delay,
  glassCell,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  layerRuns,
  line,
  orbitScene,
  par,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function profileTheLayer(s, c) {
  const phase = s.value(0);
  const overlap3d = s.value(0.3);
  const showProf = s.value(1);
  const showClock = s.value(0);
  const profStep = s.value(0); // 1=Nsight Systems, 2=Nsight Compute, 3=Roofline, 4=Occ warning
  const showPrep = s.value(0);
  const showAsk = s.value(0);
  const revealTotals = s.value(0); // STRICT: c.after('pl-totals')
  const revealVerdict = s.value(0); // STRICT: c.after('pl-verdict')

  const bgAura = aura(445, 20, 520, '#60a5fa20', '#ffd16618');
  const { view: ring3d } = buildMegaMoeRing3d(overlap3d, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Where Does the', 'Layer Clock Start?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gold,
    eyebrow: 'PROFILING · COMPLETE LAYER RULER',
    subtitle: 'Nsight Systems -> Nsight Compute -> End-to-end layer timing',
  });

  // View 1 (Beats 0-1): Nsight Systems, Nsight Compute & Roofline
  const profView = guardedDynamic(showProf, (a) => {
    const st = profStep.value;
    const nodes = [
      txt('3D LAYER TIMELINE & ROOFLINE', 455, -415, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        'Profile with Nsight; benchmark with unprofiled sync timing',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),

      glassCell(-665, -110, 370, 128, st >= 0.6 ? ROLE.a : COSMOS.dim, {
        fill: '#101d38',
        glow: st >= 0.6 ? 8 : 0,
        opacity: a,
      }),
      txt('NSIGHT SYSTEMS', -665, -148, 26, ROLE.a, 'mono').opacity(a),
      txt('Process timeline:', -665, -108, 26, COSMOS.ink, 'sans').opacity(a),
      txt('JIT · copies · streams', -665, -68, 26, COSMOS.muted, 'mono').opacity(a),

      glassCell(-250, -110, 400, 128, st >= 1.6 ? ROLE.scale : COSMOS.dim, {
        fill: '#1d1536',
        glow: st >= 1.6 ? 8 : 0,
        opacity: a,
      }),
      txt('NSIGHT COMPUTE', -250, -148, 26, ROLE.scale, 'mono').opacity(a),
      txt('Kernel replay + lineinfo:', -250, -108, 26, COSMOS.ink, 'sans').opacity(a),
      txt('SOL · mem · warp stalls', -250, -68, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    // Roofline sketch (beats 1)
    if (st >= 2.6) {
      nodes.push(
        txt(
          'ROOFLINE BOUND: min(BW × AI, Compute Peak)',
          -860,
          20,
          26,
          ROLE.gold,
          'mono',
          'left',
        ).opacity(a),
        line([-820, 285], [-100, 285], { stroke: COSMOS.dim, width: 2 }).opacity(a),
        line([-820, 285], [-820, 75], { stroke: COSMOS.dim, width: 2 }).opacity(a),
        glowingTrail(
          [
            [-820, 280],
            [-490, 96],
            [-115, 96],
          ],
          { color: ROLE.c, width: 4.0, opacity: a },
        ),
        txt('Memory slope', -715, 145, 26, ROLE.a, 'mono').opacity(a),
        txt('Compute roof', -290, 68, 26, ROLE.c, 'mono').opacity(a),
        txt(
          st >= 3.5
            ? 'Higher occupancy alone chooses no winner · match routes & ranks'
            : 'Arithmetic Intensity (FLOPs / byte)',
          -460,
          336,
          26,
          st >= 3.5 ? ROLE.warn : COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  // View 2 (Beats 2-3): Baseline (20 + 100) vs Candidate (60 + 70), STRICT WITHHOLDING!
  const clockView = guardedDynamic(showClock, (a) => {
    const base = layerRuns[0]; // prep 20, kernel 100 -> 120
    const cand = layerRuns[1]; // prep 60, kernel 70 -> 130
    const sp = showPrep.value;
    const revTot = revealTotals.value > 0.5;
    const revVerd = revealVerdict.value > 0.5;

    const barLeft = -690;
    const pxPerUs = 4.4; // 140 us = 616 px (-690 to -74)
    const baseY = -88;
    const candY = 58;
    const barH = 54;

    // When prep is 0, bars start at kernel entry (left-aligned); when sp -> 1, prep slides in on left!
    const basePrepW = base.prep * sp * pxPerUs;
    const baseKernW = base.kernel * pxPerUs;
    const candPrepW = cand.prep * sp * pxPerUs;
    const candKernW = cand.kernel * pxPerUs;

    const baseCol = revVerd ? ROLE.good : ROLE.a;
    const candCol = revVerd ? ROLE.warn : ROLE.c;

    const nodes = [
      txt('3D END-TO-END LAYER CLOCK', 455, -415, 26, ROLE.gold, 'mono')
        .glow(5, ROLE.gold)
        .opacity(a),
      txt('Casts + packing + kernel + comm + restore', 455, 435, 26, COSMOS.muted, 'sans').opacity(
        a,
      ),
      txt(
        sp > 0.5 ? 'COMMON LAYER RULER (PREP + KERNEL)' : 'KERNEL-ONLY CLOCK (EXCLUDES PREP)',
        -860,
        -172,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(a),

      // Baseline row
      txt('BASE', -845, baseY, 28, baseCol, 'mono', 'left').opacity(a),
      rect(baseKernW, barH, { fill: '#14335a', stroke: baseCol, width: 2.2, radius: 6 })
        .at(barLeft + basePrepW + baseKernW * 0.5, baseY)
        .opacity(a),
      txt(
        `kernel ${base.kernel} us`,
        barLeft + basePrepW + baseKernW * 0.5,
        baseY,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),

      // Candidate row
      txt('CAND', -845, candY, 28, candCol, 'mono', 'left').opacity(a),
      rect(candKernW, barH, { fill: '#0f3947', stroke: candCol, width: 2.2, radius: 6 })
        .at(barLeft + candPrepW + candKernW * 0.5, candY)
        .opacity(a),
      txt(
        `kernel ${cand.kernel} us`,
        barLeft + candPrepW + candKernW * 0.5,
        candY,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];

    if (sp > 0.05) {
      nodes.push(
        rect(Math.max(4, basePrepW), barH, {
          fill: '#352212',
          stroke: ROLE.scale,
          width: 2.0,
          radius: 5,
        })
          .at(barLeft + basePrepW * 0.5, baseY)
          .opacity(sp * a),
        txt(`+${base.prep}`, barLeft + basePrepW * 0.5, baseY - 46, 26, ROLE.scale, 'mono').opacity(
          sp * a,
        ),

        rect(Math.max(4, candPrepW), barH, {
          fill: '#352212',
          stroke: ROLE.scale,
          width: 2.0,
          radius: 5,
        })
          .at(barLeft + candPrepW * 0.5, candY)
          .opacity(sp * a),
        txt(
          `prep +${cand.prep} us`,
          barLeft + candPrepW * 0.5,
          candY,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(sp * a),
      );
    }

    // Totals strictly concealed until c.after('pl-totals')!
    if (revTot) {
      nodes.push(
        txt(
          `= ${base.prep + base.kernel} us`,
          barLeft + basePrepW + baseKernW + 18,
          baseY,
          28,
          ROLE.good,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `= ${cand.prep + cand.kernel} us`,
          barLeft + candPrepW + candKernW + 18,
          candY,
          28,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    // Prediction prompt during Beat 2 hold
    if (showAsk.value > 0.5 && !revTot) {
      nodes.push(
        glassCell(-460, 210, 780, 92, ROLE.gold, { fill: '#221c10', glow: 9, opacity: a }),
        txt(
          'Predict: which run finishes the complete layer first?',
          -460,
          210,
          28,
          ROLE.gold,
          'serif',
        ).opacity(a),
      );
    }

    if (revVerd) {
      nodes.push(
        glassCell(-460, 210, 780, 96, ROLE.good, { fill: '#0e2620', glow: 9, opacity: a }),
        txt('KEEP BASELINE: 120 us < 130 us', -460, 190, 28, ROLE.good, 'mono').opacity(a),
        txt(
          'Candidate saves 30 us in kernel, loses 40 us in prep (+10 us)',
          -460,
          232,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(a),
      );
    }

    nodes.push(
      txt(
        'Include casts, packing, comm, restore & cold requests in latency',
        -860,
        365,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, profView, clockView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  c.on('pl-nsys', () => s.play(profStep.to(1, { duration: remainDuration(c, 'pl-nsys', 0.45) })));
  c.on('pl-ncu', () => s.play(profStep.to(2, { duration: remainDuration(c, 'pl-ncu', 0.45) })));
  c.on('pl-roof', () => {
    const dur = remainDuration(c, 'pl-roof', 0.5);
    s.play(profStep.to(3, { duration: dur }));
    s.play(overlap3d.to(0.85, { duration: dur }));
  });
  c.on('pl-match', () => s.play(profStep.to(4, { duration: remainDuration(c, 'pl-match', 0.45) })));

  c.on('pl-kernel', () => {
    s.play(
      par(showProf.to(0, { duration: 0.18 }), delay(showClock.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('pl-prep', () => s.play(showPrep.to(1, { duration: remainDuration(c, 'pl-prep', 0.65) })));
  c.on('pl-ask', () => s.play(showAsk.to(1, { duration: remainDuration(c, 'pl-ask', 0.4) })));

  // STRICT PREDICTION REVEALS AFTER RESULT CLAUSES!
  c.after('pl-totals', () =>
    s.play(revealTotals.to(1, { duration: remainAfterDuration(c, 'pl-totals', 0.35) })),
  );
  c.after('pl-verdict', () =>
    s.play(revealVerdict.to(1, { duration: remainAfterDuration(c, 'pl-verdict', 0.35) })),
  );
}
