// Scene 12 (evaluate-two-axes): "What counts as a successful pair?"
// Luminous 5x5 pass@2 combinatorial lattice (7/10 = 70% vs 16/25 = 64%) + orthogonal containment probes
// + MathJax unbiased estimator formula.
import {
  CANDIDATE_PAIRS,
  CANDIDATE_POOL,
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  crossSwap,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  passAtK,
  rule,
  runtimeProbe,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../parts.mjs';

export default function evaluateTwoAxes(s, c) {
  const pool = CANDIDATE_POOL;
  const n = pool.length;
  const passes = pool.filter((x) => x.passed).length;
  const goodPairs = CANDIDATE_PAIRS.filter((x) => x.successful).length;
  const probes = runtimeProbe();

  verifyInvariant(goodPairs === 7 && CANDIDATE_PAIRS.length === 10, '7 of 10 pairs pass');
  verifyApprox(passAtK(n, passes, 2), 0.7, 1e-12, 'pass@2 = 0.70');
  verifyApprox(1 - ((n - passes) / n) ** 2, 0.64, 1e-12, 'with-replacement = 0.64');

  const phase = s.value(0);
  const funcHot = s.value(0);
  const contHot = s.value(0);
  const poolLit = s.value(0);
  const twoLit = s.value(0);
  const upperOutline = s.value(0);
  const failFill = s.value(0);
  const passFill = s.value(0);
  const showAsk = s.value(0);
  const showResult70 = s.value(0);
  const showNotMeas = s.value(0);
  const showFixed = s.value(0);
  const showReport = s.value(0);

  // Beat 3 & 4: Swap right side from containment probes to MathJax formula + replacement
  const rightProbes = s.value(1);
  const rightFormula = s.value(0);
  const pulseFails = s.value(0);
  const showFormulaVal = s.value(0);
  const lowerFill = s.value(0);
  const showSq = s.value(0);
  const show64 = s.value(0);
  const noteStep = s.value(0);
  const sameIdHot = s.value(0);
  const showTraj = s.value(0);
  const showFreeze = s.value(0);
  const showInfra = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.pass, ROLE.host);
  const title = heroTitle(['Evaluate Accuracy &', 'Containment Separately'], {
    x: -860,
    y: -445,
    size: 46,
    lineHeight: 54,
    accent: ROLE.pass,
    eyebrow: 'PASS@K  VS  CONTAINMENT PROBES',
  });

  // Glowing MathJax formulas gated by visibility via guardedDynamic
  const eqFormulaNode = glowTex(
    '\\operatorname{pass@}k = 1 - \\dfrac{\\binom{n-c}{k}}{\\binom{n}{k}}',
    {
      x: 245,
      y: -182,
      size: 38,
      color: COSMOS.ink,
      glow: 5,
    },
  );
  const eqValNode = glowTex('= 1 - \\dfrac{3}{10} = 0.70', {
    x: 685,
    y: -182,
    size: 38,
    color: ROLE.mark,
    glow: 8,
  });
  const eqReplaceNode = glowTex('1 - \\left(\\dfrac{3}{5}\\right)^2 = \\dfrac{16}{25} = 0.64', {
    x: 345,
    y: -60,
    size: 36,
    color: ROLE.evidence,
    glow: 6,
  });

  const formulaLayer = guardedDynamic(rightFormula, (rf) => {
    const out = [eqFormulaNode.opacity(rf)];
    if (showFormulaVal.value > 0.02) {
      out.push(eqValNode.opacity(rf * showFormulaVal.value));
    }
    if (showSq.value > 0.02) {
      out.push(eqReplaceNode.opacity(rf * showSq.value));
    }
    return out;
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // === LEFT: 5x5 Candidate Pair Lattice ===
    const gx = -760;
    const gy = -225;
    const pitch = 92;
    const cellSz = 78;

    nodes.push(
      txt(
        twoLit.value > 0.5 ? 'PASS: C0, C2    FAIL: C1, C3, C4' : 'AXIS 1  /  FUNCTIONAL TESTS',
        -860,
        -285,
        26,
        funcHot.value > 0.4 && twoLit.value < 0.5 ? ROLE.mark : ROLE.pass,
        'mono',
        'left',
      ),
    );

    // Row & column headers C0..C4
    pool.forEach((cand, idx) => {
      const isIdent = sameIdHot.value > 0.4 && (idx === 1 || idx === 3);
      const col = isIdent
        ? ROLE.mark
        : twoLit.value > 0.5
          ? cand.passed
            ? ROLE.pass
            : ROLE.candidate
          : poolLit.value > 0.4
            ? COSMOS.ink
            : COSMOS.muted;
      const cx = gx + (idx + 1) * pitch;
      const cy = gy + (idx + 1) * pitch;
      nodes.push(txt(cand.id, cx, gy, 28, col, 'mono'), txt(cand.id, gx, cy, 28, col, 'mono'));
    });

    // Lattice cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = gx + (j + 1) * pitch;
        const cy = gy + (i + 1) * pitch;
        const isUpper = i < j;
        const ok = pool[i].passed || pool[j].passed;
        if (isUpper && upperOutline.value > 0.02) {
          const filled = ok ? passFill.value : failFill.value;
          const isPulse = !ok && pulseFails.value > 0.4;
          nodes.push(
            lumBar(cx, cy, cellSz, cellSz, {
              color: isPulse
                ? ROLE.mark
                : filled > 0.1
                  ? ok
                    ? ROLE.pass
                    : ROLE.candidate
                  : COSMOS.dim,
              fillOpacity: filled > 0.1 ? 0.62 * filled : 0.05,
              strokeWidth: isPulse ? 3.2 : 2,
              glow: isPulse ? 12 : filled > 0.1 ? 8 : 0,
              radius: 10,
              opacity: upperOutline.value,
            }),
          );
        } else if (!isUpper && lowerFill.value > 0.02) {
          nodes.push(
            lumBar(cx, cy, cellSz, cellSz, {
              color: ok ? ROLE.pass : ROLE.candidate,
              fillOpacity: 0.34,
              strokeWidth: 1.8,
              glow: 5,
              radius: 10,
              dash: [6, 5],
              opacity: lowerFill.value,
            }),
          );
        }
      }
    }

    // Bottom-left readout (prediction withheld -> 7/10 = 70% -> 16/25 = 64%)
    const by = 335;
    if (showAsk.value > 0.02) {
      nodes.push(
        txt('Of these 10 pairs, how many', -860, by, 34, ROLE.mark, 'serif', 'left')
          .glow(8, ROLE.mark)
          .opacity(showAsk.value),
        txt('contain two failures?', -860, by + 46, 34, ROLE.mark, 'serif', 'left')
          .glow(8, ROLE.mark)
          .opacity(showAsk.value),
      );
    }
    if (showResult70.value > 0.02) {
      nodes.push(
        txt('Without replacement:', -860, by, 26, COSMOS.muted, 'sans', 'left').opacity(
          showResult70.value,
        ),
        txt('7 / 10 = 70%', -530, by, 34, ROLE.mark, 'mono', 'left')
          .glow(8, ROLE.mark)
          .opacity(showResult70.value),
      );
    }
    if (show64.value > 0.02) {
      nodes.push(
        txt('With replacement:', -860, by + 56, 26, COSMOS.muted, 'sans', 'left').opacity(
          show64.value,
        ),
        txt('16 / 25 = 64%', -530, by + 56, 34, ROLE.evidence, 'mono', 'left').opacity(
          show64.value,
        ),
      );
    }

    // === RIGHT SIDE: Phase 0-2 Containment Probes ===
    const rx = 20;
    if (rightProbes.value > 0.02) {
      const rp = rightProbes.value;
      nodes.push(
        txt(
          'AXIS 2  /  CONTAINMENT PROBES',
          rx,
          -285,
          26,
          contHot.value > 0.4 ? ROLE.mark : ROLE.host,
          'mono',
          'left',
        ).opacity(rp),
        rule(rx, -260, 855, -260, ROLE.host, 2).opacity(rp),
      );
      probes.forEach((probe, i) => {
        const y = -195 + i * 74;
        const lit = showNotMeas.value > 0.4 && i < 2;
        nodes.push(
          glowRing(rx + 22, y, 20, lit ? ROLE.mark : COSMOS.dim, { width: 2.2, opacity: rp }),
          txt('?', rx + 22, y, 26, lit ? ROLE.mark : COSMOS.muted, 'mono').opacity(rp),
          txt(probe.attempt, rx + 64, y, 28, lit ? ROLE.mark : COSMOS.ink, 'sans', 'left').opacity(
            rp,
          ),
        );
      });
      if (showNotMeas.value > 0.02) {
        nodes.push(
          txt('NOT MEASURED BY pass@2', rx, 200, 30, ROLE.mark, 'mono', 'left')
            .glow(7, ROLE.mark)
            .opacity(rp * showNotMeas.value),
        );
      }
      if (showFixed.value > 0.02) {
        nodes.push(
          txt('Keep artifact & environment fixed', rx, 275, 26, ROLE.host, 'mono', 'left').opacity(
            rp * showFixed.value,
          ),
        );
      }
      if (showReport.value > 0.02) {
        nodes.push(
          txt(
            'Report: accuracy · access checks · timeouts · cleanup',
            rx,
            332,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(rp * showReport.value),
        );
      }
    }

    // === RIGHT SIDE: Phase 3-4 Formula Notes + Independent Trajectories ===
    if (rightFormula.value > 0.02) {
      const rf = rightFormula.value;
      nodes.push(
        txt('UNBIASED COMBINATORIAL ESTIMATOR', rx, -285, 26, ROLE.mark, 'mono', 'left').opacity(
          rf,
        ),
        rule(rx, -260, 855, -260, ROLE.rule, 2).opacity(rf),
      );
      const ns = noteStep.value;
      if (ns >= 0.5) {
        nodes.push(
          glowDot(rx + 12, 34, { radius: 7, color: ROLE.pass, opacity: rf }),
          txt('Unbiased under IID sampling', rx + 36, 34, 28, ROLE.pass, 'sans', 'left').opacity(
            rf,
          ),
        );
      }
      if (ns >= 1.5) {
        nodes.push(
          glowDot(rx + 12, 92, { radius: 7, color: ROLE.warn, opacity: rf }),
          txt(
            'Plug-in replacement rate can be biased',
            rx + 36,
            92,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(rf),
        );
      }
      if (ns >= 2.5) {
        nodes.push(
          glowDot(rx + 12, 150, { radius: 7, color: ROLE.mark, opacity: rf }),
          txt(
            'Two indices may hold identical code',
            rx + 36,
            150,
            28,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(rf),
        );
      }
      if (showTraj.value > 0.02) {
        nodes.push(
          glowDot(rx + 12, 226, { radius: 8, color: ROLE.host, opacity: rf * showTraj.value }),
          txt(
            'Sample independent trajectories (patch 1 -> 2 -> 3)',
            rx + 36,
            226,
            28,
            ROLE.host,
            'sans',
            'left',
          )
            .glow(6, ROLE.host)
            .opacity(rf * showTraj.value),
        );
      }
      if (showFreeze.value > 0.02) {
        nodes.push(
          txt(
            'Freeze: tasks · env · tool budgets · grading',
            rx,
            322,
            26,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(rf * showFreeze.value),
        );
      }
      if (showInfra.value > 0.02) {
        nodes.push(
          txt(
            'Count infrastructure failures & incomplete runs separately',
            rx,
            378,
            26,
            ROLE.candidate,
            'sans',
            'left',
          ).opacity(rf * showInfra.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, title, live, formulaLayer);
  runAmbientPhase(s, c, phase, 2.4);

  // Beat 0
  tweenCue(s, c, 'ev2-functional', funcHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'ev2-containment', contHot, 1, { duration: 0.4 });

  // Beat 1
  tweenCue(s, c, 'ev2-pool', poolLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-two', twoLit, 1, { duration: 0.4 });
  tweenCue(s, c, 'ev2-choose', upperOutline, 1, { duration: 0.5 });
  tweenCue(s, c, 'ev2-ask', showAsk, 1, { duration: 0.35 });

  // Beat 2: Prediction resolved strictly after answer cues
  c.on('ev2-ten', () => s.play(showAsk.to(0, { duration: 0.2 })));
  tweenCue(s, c, 'ev2-ten', failFill, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'ev2-seven', passFill, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ev2-result', showResult70, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'ev2-nothing', showNotMeas, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-fixed', showFixed, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-report', showReport, 1, { duration: 0.35 });

  // Beat 3 & 4: Formula & replacement
  crossSwap(s, c, 'ev2-formula', rightProbes, rightFormula, { duration: 0.42 });
  tweenCue(s, c, 'ev2-fails', pulseFails, 1, { duration: 0.4 });
  c.on('ev2-all', () => s.play(pulseFails.to(0, { duration: 0.25 })));
  tweenCue(s, c, 'ev2-all', showFormulaVal, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'ev2-replacement', lowerFill, 1, { duration: 0.5 });
  tweenCue(s, c, 'ev2-squared', showSq, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-sixtyfour', show64, 1, { duration: 0.35, after: true });

  tweenCue(s, c, 'ev2-unbiased', noteStep, 1, { duration: 0.3 });
  tweenCue(s, c, 'ev2-plugin', noteStep, 2, { duration: 0.3 });
  c.on('ev2-identical', () => {
    s.play(noteStep.to(3, { duration: 0.3 }), sameIdHot.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'ev2-trajectories', showTraj, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-freeze', showFreeze, 1, { duration: 0.35 });
  tweenCue(s, c, 'ev2-infra', showInfra, 1, { duration: 0.35 });
}
