// Act 4 (Scenes 16-20): Estimator Bias & Jensen, Macro pass@k & Pooling Trap,
// Protocol Repair (Dedup/Selector/Sandbox), Report Contract, and Holdout Finale.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FIVE_ALL_FAILING,
  FIVE_SUBSETS,
  ROLE,
  beatTo,
  buildLiftRuler,
  cinemaGrid,
  cueTo,
  decorAura,
  developmentBootstrap,
  estimatorExpectation,
  estimatorFactors,
  fadeIn,
  fadeOut,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  holdoutBootstrap,
  holdoutRows,
  liftIntervalNodes,
  liftVerdictText,
  livingDrift,
  macroTaskInterval,
  macroTaskResamples,
  macroTaskScores,
  makeAxes,
  mix,
  neonCurve,
  passAtK,
  passingCandidates,
  rule,
  sampleCurve,
  smooth,
  taskRows,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 16. estimator-bias: What changes after a failed draw?
// Cues (15): estimator-bias-0, hyp-estimator-subsets, hyp-estimator-result*,
//   estimator-bias-1, hyp-replacement-first, hyp-replacement-draws,
//   hyp-replacement-plugin-result*, hyp-replacement-without-result*,
//   estimator-bias-2, hyp-estimator-jensen, hyp-estimator-expectation*,
//   estimator-bias-3, hyp-estimator-forced*, hyp-estimator-product-start*,
//   hyp-estimator-product
// ---------------------------------------------------------------------------
export function estimatorBias(s, c) {
  const c0P = s.value(0);
  const subP = s.value(0);
  const resP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const rep1P = s.value(0);
  const repDrawsP = s.value(0);
  const plugP = s.value(0);
  const withoutP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const jensP = s.value(0);
  const expP = s.value(0);
  const v3P = s.value(0);
  const c3P = s.value(0);
  const forcedP = s.value(0);
  const prodStartP = s.value(0);
  const prodP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 16 }));
  s.add(decorAura(-380, 30, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(380, 30, 480, '#5ce1e61e', '#07091000'));

  const headline = heroTitle(['Why Naive Plug-In', 'Underestimates pass@k'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 58,
    accent: ROLE.lift,
    eyebrow: 'WITHOUT REPLACEMENT  ·  JENSEN CONCAVITY  ·  PRODUCT FORM',
  });

  // View 0 (Beat 0): All 252 distinct 5-subsets of 10 candidates (196 pass, 56 fail -> 7/9)
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const sb = subP.value;
      const rs = resP.value;
      const count = Math.max(
        1,
        Math.min(252, Math.floor(sb < 0.35 ? (sb / 0.35) * 4 : 4 + ((sb - 0.35) / 0.65) * 248)),
      );
      const chosen = FIVE_SUBSETS[count - 1];
      const nodes = [];

      // Active 5-candidate subset row
      chosen.forEach((id, i) => {
        const cx = -480 + i * 240;
        const cy = -185;
        const isPass = passingCandidates.includes(id);
        const col = isPass ? ROLE.modelB : ROLE.modelA;
        nodes.push(
          rect(176, 68, {
            fill: isPass ? '#0f2820' : '#101a30',
            stroke: col,
            width: 2.6,
            radius: 10,
          })
            .at(cx, cy)
            .glow(isPass ? 8 : 0, col),
          txt(`C${id + 1}`, cx, cy, 28, col, 'mono'),
        );
      });

      // 28x9 matrix of all 252 subsets
      for (let i = 0; i < 252; i++) {
        const col = i % 28;
        const row = Math.floor(i / 28);
        const cx = -729 + col * 54;
        const cy = -80 + row * 34;
        const active = i < count;
        const hasPass = FIVE_SUBSETS[i].some((id) => passingCandidates.includes(id));
        const fill = !active ? '#0f1628' : hasPass ? ROLE.modelB : '#475575';
        nodes.push(rect(40, 22, { fill, stroke: null, radius: 4 }).at(cx, cy));
      }

      const preR = fadeOut(rs);
      const postR = fadeIn(rs);
      if (preR > 0.02) {
        nodes.push(
          txt(
            `${count} / 252 distinct 5-subsets (n = 10, c = 2, k = 5)`,
            0,
            315,
            32,
            ROLE.lift,
            'mono',
          ).opacity(preR),
        );
      }
      if (postR > 0.02) {
        nodes.push(
          glowTex(`1 - \\frac{${FIVE_ALL_FAILING}}{252} = \\frac{7}{9} \\approx 77.8\\%`, {
            x: 0,
            y: 315,
            size: 46,
            color: ROLE.modelB,
          }).opacity(postR),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Twin pools (Put it back 8/10^5 -> 67.2% vs Set aside -> 7/9 = 77.8%)
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const f1 = rep1P.value;
      const d3 = repDrawsP.value;
      const pl = plugP.value;
      const wo = withoutP.value;
      const failures = [0, 1, 3, 4, 5, 6, 8, 9];
      const motion = f1 + 3 * d3;
      const spent = Math.floor(motion);
      const nodes = [
        txt('FOLLOW CONSECUTIVE FAILED DRAWS', -810, -225, 28, COSMOS.ink, 'mono', 'left'),
        txt('NEXT DRAW FAILS', 690, -225, 26, COSMOS.muted, 'mono'),
      ];

      ['Put it back', 'Set it aside'].forEach((label, row) => {
        const y = -95 + row * 240;
        const col = row === 0 ? ROLE.danger : ROLE.lift;
        const rem = row === 0 ? 0 : spent;
        nodes.push(txt(label, -810, y, 30, col, 'sans', 'left'));
        for (let i = 0; i < 10; i++) {
          const cx = -420 + i * 102;
          const pickIdx = failures.indexOf(i);
          const part = pickIdx < 0 ? 0 : Math.max(0, Math.min(1, motion - pickIdx));
          const shift = row === 0 ? -42 * Math.sin(Math.PI * part) : part * 78;
          const isPass = passingCandidates.includes(i);
          nodes.push(
            circle(30, { fill: '#0d1424', stroke: '#29385a', width: 1.5 }).at(cx, y),
            circle(28, {
              fill: isPass ? '#0f2820' : '#1a2540',
              stroke: isPass ? ROLE.modelB : col,
              width: isPass ? 2.8 : 2,
            })
              .at(cx, y + shift)
              .glow(isPass ? 7 : 0, ROLE.modelB),
            txt(String(i + 1), cx, y + shift, 26, isPass ? ROLE.modelB : COSMOS.ink, 'mono'),
          );
        }
        nodes.push(txt(`${8 - rem} / ${10 - rem}`, 690, y, 42, col, 'mono').glow(8, col));
      });

      if (pl > 0.05) {
        nodes.push(
          txt('Plug-in:  1 − (8/10)⁵ = 67.2%', -360, 330, 34, ROLE.danger, 'mono')
            .glow(8, ROLE.danger)
            .opacity(pl),
        );
      }
      if (wo > 0.05) {
        nodes.push(
          txt('Exact:  7/9 (77.8%)', 360, 330, 34, ROLE.lift, 'mono')
            .glow(9, ROLE.lift)
            .opacity(wo),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Jensen's inequality on concave g(p) = 1 - (1 - p)^5
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const jn = jensP.value;
      const ex = expP.value;
      const info = estimatorExpectation(0.2, 10, 5);
      const ax = makeAxes({
        x0: -700,
        y0: -175,
        w: 1000,
        h: 380,
        xDom: [-0.04, 1.04],
        yDom: [-0.04, 1.04],
        xTicks: [0, 0.2, 0.5, 1],
        yTicks: [0, 0.5, 1],
        xLabel: 'Empirical pool pass fraction  c / 10',
        yLabel: 'g(p) = 1 − (1 − p)⁵',
      });
      const curvePts = sampleCurve(ax, (p) => 1 - (1 - p) ** 5, 0, 1, 80);
      const maxC = Math.floor(10 * jn);

      const nodes = [
        ax.node,
        neonCurve(curvePts, [ROLE.modelA, ROLE.lift, ROLE.modelB], { width: 4.5, glow: 10 }),
      ];

      for (let cVal = 0; cVal <= maxC; cVal++) {
        const pt = ax.pt(cVal / 10, 1 - (1 - cVal / 10) ** 5);
        const rad = Math.max(5, Math.sqrt(info.mass[cVal]) * 38);
        nodes.push(
          circle(rad, { fill: '#ff6b8b55', stroke: ROLE.danger, width: 2.2 })
            .at(pt[0], pt[1])
            .glow(6, ROLE.danger),
        );
      }

      // Right readout column cleanly separated at x = 600
      const preE = fadeOut(ex);
      const postE = fadeIn(ex);
      if (preE > 0.02) {
        nodes.push(
          group(
            txt('TRUE RATE p = 0.20', 600, -110, 28, ROLE.modelB, 'mono'),
            txt('Dot size = Binomial(10, 0.2)', 600, -45, 26, COSMOS.muted, 'sans'),
            txt('Concave curve pulls', 600, 35, 28, ROLE.danger, 'serif'),
            txt('average downward', 600, 80, 28, ROLE.danger, 'serif'),
          ).opacity(preE),
        );
      }
      if (postE > 0.02) {
        nodes.push(
          group(
            txt('E[plug-in]', 600, -130, 26, COSMOS.muted, 'mono'),
            txt(info.plugin.toFixed(4), 600, -76, 42, ROLE.danger, 'mono').glow(9, ROLE.danger),
            txt('True target  1 − 0.8⁵', 600, 20, 26, COSMOS.muted, 'mono'),
            txt(info.target.toFixed(4), 600, 74, 42, ROLE.modelB, 'mono').glow(9, ROLE.modelB),
            txt('E[combinatorial]', 600, 170, 26, COSMOS.muted, 'mono'),
            txt(info.combinatorial.toFixed(4), 600, 224, 42, ROLE.lift, 'mono').glow(9, ROLE.lift),
          ).opacity(postE),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): Extremes (c=0 -> 0, c=6 -> forced pass@5 = 1) -> Ascending product formula
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const fc = forcedP.value;
      const ps = prodStartP.value;
      const pr = prodP.value;

      const phaseZero = fadeOut(fc);
      const phaseForced = fadeIn(fc) * fadeOut(ps);
      const phaseProduct = fadeIn(ps);
      const nodes = [];

      if (phaseZero > 0.02) {
        const zNodes = [
          txt('EXTREME 1:  0 PASSES IN 10  →  pass@5 = 0', 0, -210, 30, ROLE.danger, 'mono'),
        ];
        for (let i = 0; i < 10; i++) {
          const cx = -720 + i * 160;
          zNodes.push(
            rect(126, 58, { fill: '#121a2d', stroke: COSMOS.dim, width: 2, radius: 28 }).at(
              cx,
              -50,
            ),
            txt('fail', cx, -50, 26, COSMOS.dim, 'mono'),
          );
        }
        zNodes.push(
          glowTex('\\mathrm{pass@5}(n=10, c=0) = 0', {
            x: 0,
            y: 155,
            size: 48,
            color: ROLE.danger,
          }),
        );
        nodes.push(group(...zNodes).opacity(phaseZero));
      }

      if (phaseForced > 0.02) {
        const fNodes = [
          txt(
            'EXTREME 2:  6 PASSES IN 10  ·  ONLY 4 FAILURES EXIST',
            0,
            -210,
            30,
            ROLE.modelB,
            'mono',
          ),
        ];
        for (let i = 0; i < 10; i++) {
          const cx = -720 + i * 160;
          const isPass = i < 6;
          const col = isPass ? ROLE.modelB : COSMOS.dim;
          fNodes.push(
            rect(126, 58, {
              fill: isPass ? '#0f2820' : '#121a2d',
              stroke: col,
              width: 2.4,
              radius: 28,
            })
              .at(cx, -50)
              .glow(isPass ? 7 : 0, col),
            txt(isPass ? 'pass' : 'fail', cx, -50, 26, col, 'mono'),
          );
        }
        fNodes.push(
          txt(
            'Set aside all 4 failures  →  the 5th pick MUST be a pass',
            0,
            95,
            32,
            ROLE.threshold,
            'serif',
          ),
          glowTex('n - c < k \\implies \\mathrm{pass@5} = 1', {
            x: 0,
            y: 220,
            size: 48,
            color: ROLE.modelB,
          }),
        );
        nodes.push(group(...fNodes).opacity(phaseForced));
      }

      if (phaseProduct > 0.02) {
        const fac = estimatorFactors(2, 10, 5);
        const pNodes = [
          txt('ASCENDING PRODUCT FORM  ·  NO FACTORIAL OVERFLOW', 0, -225, 28, ROLE.lift, 'mono'),
          glowTex(
            '\\mathrm{pass@k} = 1 - \\prod_{i = n - c + 1}^{n} \\left(1 - \\frac{k}{i}\\right)',
            {
              x: 0,
              y: -115,
              size: 46,
              color: ROLE.lift,
            },
          ),
        ];
        fac.factors.forEach((f, idx) => {
          const cx = -320 + idx * 640;
          pNodes.push(
            txt(`i = ${f.i}`, cx, 35, 30, ROLE.modelA, 'mono'),
            glowTex(`1 - \\frac{5}{${f.i}} = ${idx === 0 ? '\\frac{4}{9}' : '\\frac{1}{2}'}`, {
              x: cx,
              y: 120,
              size: 42,
              color: ROLE.threshold,
            }),
          );
        });
        if (pr > 0.4) {
          pNodes.push(
            glowTex('1 - \\left(\\frac{4}{9}\\right)\\left(\\frac{1}{2}\\right) = \\frac{7}{9}', {
              x: 0,
              y: 265,
              size: 48,
              color: ROLE.modelB,
            }).opacity(pr),
          );
        }
        pNodes.push(
          txt('Guard inputs:  n > 0,  0 ≤ c ≤ n,  1 ≤ k ≤ n', 0, 370, 28, COSMOS.muted, 'mono'),
        );
        nodes.push(group(...pNodes).opacity(phaseProduct));
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'estimator-bias-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-estimator-subsets', subP, 1, { dur: 1.6 });
  cueTo(s, c, 'hyp-estimator-result', resP, 1, { after: true, dur: 0.6 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'estimator-bias-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-replacement-first', rep1P, 1, { dur: 0.9 });
  cueTo(s, c, 'hyp-replacement-draws', repDrawsP, 1, { dur: 1.5 });
  cueTo(s, c, 'hyp-replacement-plugin-result', plugP, 1, { after: true, dur: 0.4 });
  cueTo(s, c, 'hyp-replacement-without-result', withoutP, 1, { after: true, dur: 0.25 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'estimator-bias-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-estimator-jensen', jensP, 1, { dur: 1.2 });
  cueTo(s, c, 'hyp-estimator-expectation', expP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 3, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'estimator-bias-3', c3P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-estimator-forced', forcedP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'hyp-estimator-product-start', prodStartP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'hyp-estimator-product', prodP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 17. macro-construction: Whose chances are you averaging?
// Cues (14): macro-construction-0, hyp-macro-score-zero, hyp-macro-score-half,
//   hyp-macro-score-seven-ninths, hyp-macro-score-forty-one, hyp-macro-mean*,
//   macro-construction-1, macro-more-attempts, macro-extra-result,
//   hyp-macro-pooling*, macro-construction-2, hyp-macro-resample,
//   hyp-macro-interval*, macro-construction-3
// ---------------------------------------------------------------------------
export function macroConstruction(s, c) {
  const c0P = s.value(0);
  const s0P = s.value(0);
  const s1P = s.value(0);
  const s2P = s.value(0);
  const s3P = s.value(0);
  const meanP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const moreP = s.value(0);
  const extP = s.value(0);
  const poolP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const resP = s.value(0);
  const ivP = s.value(0);
  const v3P = s.value(0);
  const c3P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 17 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#6ee7b712'));

  const headline = heroTitle(['Score Per Task First,', 'Then Macro-Average'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'MACRO PASS@5  ·  THE POOLING TRAP  ·  TASK BOOTSTRAP',
  });

  // View 0 (Beat 0): 4 tasks with 10-candidate pools & pass@5 bars -> Macro = 0.563
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const progs = [smooth(s0P.value), smooth(s1P.value), smooth(s2P.value), smooth(s3P.value)];
      const mn = meanP.value;
      const counts = [0, 1, 2, 4];
      const baseY = 235;
      const maxH = 220;
      const nodes = [];

      counts.forEach((passes, i) => {
        const cx = -570 + i * 380;
        const sc = macroTaskScores[i];
        const barH = sc * maxH * progs[i];
        nodes.push(txt(`Task ${i + 1} (${passes}/10)`, cx, -210, 28, COSMOS.ink, 'mono'));

        // 5x2 pool of 10 candidate dots
        for (let k = 0; k < 10; k++) {
          const dx = cx - 80 + (k % 5) * 40;
          const dy = -150 + Math.floor(k / 5) * 42;
          const isPass = k < passes;
          nodes.push(
            circle(13, {
              fill: isPass ? ROLE.modelB : '#141e36',
              stroke: isPass ? ROLE.modelB : '#3b4e78',
              width: 1.6,
            })
              .at(dx, dy)
              .glow(isPass ? 7 : 0, ROLE.modelB),
          );
        }

        // Bar track + rising pass@5 bar
        nodes.push(line([cx - 95, baseY], [cx + 95, baseY], { stroke: '#4d6499', width: 2.5 }));
        if (barH > 2) {
          nodes.push(glowCol(cx, baseY, 136, barH, ROLE.lift, { glow: 9, radius: 8 }));
        }
        if (progs[i] > 0.5) {
          nodes.push(txt(sc.toFixed(3), cx, baseY + 42, 30, ROLE.lift, 'mono'));
        } else {
          nodes.push(txt('?', cx, baseY + 42, 30, COSMOS.dim, 'mono'));
        }
      });

      if (mn > 0.05) {
        const avg = macroTaskScores.reduce((a, b) => a + b, 0) / 4;
        nodes.push(
          txt(
            `Four equal task weights  ·  Macro pass@5 = ${avg.toFixed(3)} (56.3%)`,
            0,
            360,
            34,
            ROLE.threshold,
            'mono',
          )
            .glow(9, ROLE.threshold)
            .opacity(mn),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Half always pass / half always fail -> 5 tries still 50% vs pooled 96.9%
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const mr = moreP.value;
      const ex = extP.value;
      const pl = poolP.value;
      const slots = Math.min(5, 1 + Math.floor(4.2 * mr));
      const nodes = [
        txt(
          'HETEROGENEOUS POPULATION:  50% ALWAYS PASS  ·  50% ALWAYS FAIL',
          0,
          -220,
          26,
          COSMOS.muted,
          'mono',
        ),
      ];

      [
        ['Half always pass', ROLE.modelB, 'pass', -85],
        ['Half always fail', ROLE.danger, 'fail', 95],
      ].forEach(([label, col, tag, y]) => {
        nodes.push(txt(label, -790, y, 30, col, 'sans', 'left'));
        for (let k = 0; k < 5; k++) {
          const cx = -230 + k * 210;
          const active = k < slots;
          nodes.push(
            rect(164, 78, {
              fill: !active ? '#0c1222' : col === ROLE.modelB ? '#0f2820' : '#261220',
              stroke: active ? col : '#243150',
              width: active ? 2.6 : 1.4,
              radius: 12,
            })
              .at(cx, y)
              .glow(active ? 7 : 0, col),
            txt(active ? tag : '·', cx, y, 28, active ? col : COSMOS.dim, 'mono'),
          );
        }
      });

      const preEx = fadeOut(ex);
      const postEx = fadeIn(ex);
      if (preEx > 0.02) {
        nodes.push(
          txt(
            slots > 1
              ? 'Who did those four extra tries help?'
              : 'Budget = 1  ·  50% of tasks solved',
            0,
            265,
            36,
            ROLE.threshold,
            'serif',
          ).opacity(preEx),
        );
      }
      if (postEx > 0.02) {
        nodes.push(
          txt('Nobody!  True macro pass@5 stays 50.0%', 0, 255, 36, ROLE.modelB, 'mono')
            .glow(8, ROLE.modelB)
            .opacity(postEx),
        );
      }
      if (pl > 0.05) {
        nodes.push(
          txt(
            'Wrongly pooling candidates predicts  1 − (1/2)⁵ = 96.9%!',
            0,
            345,
            34,
            ROLE.danger,
            'mono',
          )
            .glow(10, ROLE.danger)
            .opacity(pl),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): All 4^4 = 256 ordered whole-task resamples -> CI [19.4%, 87.7%]
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const rs = resP.value;
      const iv = ivP.value;
      const count = Math.max(1, Math.min(256, Math.floor(1 + 255 * rs)));
      const cur = macroTaskResamples[count - 1];
      const bins = new Array(16).fill(0);
      for (let i = 0; i < count; i++) {
        bins[Math.min(15, Math.floor(macroTaskResamples[i].mean * 16))]++;
      }

      const nodes = [
        txt('ENUMERATE ALL 4⁴ = 256 ORDERED TASK RESAMPLES', 0, -230, 28, ROLE.lift, 'mono'),
      ];

      // 4 active task slots
      cur.ids.forEach((id, i) => {
        const cx = -495 + i * 330;
        nodes.push(
          rect(260, 68, { fill: '#101a30', stroke: ROLE.modelA, width: 2.4, radius: 10 }).at(
            cx,
            -145,
          ),
          txt(`T${id + 1} · ${macroTaskScores[id].toFixed(3)}`, cx, -145, 28, ROLE.modelA, 'mono'),
        );
      });

      const x0 = -720;
      const spanW = 1440;
      const baseY = 185;
      const step = spanW / 16;
      nodes.push(
        line([x0 - 20, baseY], [x0 + spanW + 20, baseY], { stroke: '#4d6499', width: 2.6 }),
      );
      bins.forEach((v, i) => {
        const cx = x0 + (i + 0.5) * step;
        const h = (v / 56) * 240;
        if (h > 1.5)
          nodes.push(glowCol(cx, baseY, step - 14, h, ROLE.lift, { glow: 6, radius: 5 }));
        if (i % 4 === 0)
          nodes.push(txt((i / 16).toFixed(2), cx, baseY + 36, 26, COSMOS.muted, 'mono'));
      });

      nodes.push(
        txt(
          `${count} / 256 ordered means  ·  current ${cur.mean.toFixed(3)}`,
          0,
          290,
          30,
          COSMOS.ink,
          'mono',
        ),
      );
      if (iv > 0.05) {
        nodes.push(
          txt(
            `95% task-bootstrap interval:  ${(macroTaskInterval[0] * 100).toFixed(1)}%  to  ${(macroTaskInterval[1] * 100).toFixed(1)}%`,
            0,
            355,
            34,
            ROLE.threshold,
            'mono',
          )
            .glow(9, ROLE.threshold)
            .opacity(iv),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): Paired task/cluster framing for comparing A vs B at k = 5
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const nodes = [
        txt(
          'COMPARING A VS B AT k = 5 REQUIRES MATCHED PAIRS PER TASK',
          0,
          -215,
          28,
          ROLE.lift,
          'mono',
        ),
      ];
      for (let i = 0; i < 4; i++) {
        const cx = -570 + i * 380;
        nodes.push(
          rect(310, 355, { fill: '#0c1528', stroke: ROLE.lift, width: 2.4, radius: 16 }).at(cx, 25),
          txt(`Task T${i + 1}`, cx, -108, 30, ROLE.lift, 'mono'),
          rect(246, 78, { fill: '#101a30', stroke: ROLE.modelA, width: 2.2, radius: 10 }).at(
            cx,
            -12,
          ),
          txt('A: run at k = 5', cx, -12, 26, ROLE.modelA, 'mono'),
          rect(246, 78, { fill: '#0f2820', stroke: ROLE.modelB, width: 2.4, radius: 10 }).at(
            cx,
            118,
          ),
          txt(`B: ${macroTaskScores[i].toFixed(3)}`, cx, 118, 28, ROLE.modelB, 'mono'),
        );
      }
      nodes.push(
        txt(
          'Subtract within each task (or cluster)  ·  until A runs at k = 5, these describe B alone',
          0,
          315,
          30,
          ROLE.threshold,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'macro-construction-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-macro-score-zero', s0P, 1, { dur: 0.5 });
  cueTo(s, c, 'hyp-macro-score-half', s1P, 1, { dur: 0.65 });
  cueTo(s, c, 'hyp-macro-score-seven-ninths', s2P, 1, { dur: 0.65 });
  cueTo(s, c, 'hyp-macro-score-forty-one', s3P, 1, { dur: 0.65 });
  cueTo(s, c, 'hyp-macro-mean', meanP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'macro-construction-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'macro-more-attempts', moreP, 1, { dur: 1.1 });
  cueTo(s, c, 'macro-extra-result', extP, 1, { dur: 0.6 });
  cueTo(s, c, 'hyp-macro-pooling', poolP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'macro-construction-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-macro-resample', resP, 1, { dur: 1.6 });
  cueTo(s, c, 'hyp-macro-interval', ivP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 3, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'macro-construction-3', c3P, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 18. protocol-repair: What counts as a draw?
// Cues (8): protocol-repair-0, protocol-remove*, hyp-protocol-dedup*,
//   protocol-repair-1, hyp-protocol-deterministic*, protocol-repair-2,
//   hyp-protocol-selector*, protocol-repair-3
// ---------------------------------------------------------------------------
export function protocolRepair(s, c) {
  const c0P = s.value(0);
  const remP = s.value(0);
  const dedupP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const detP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const selP = s.value(0);
  const v3P = s.value(0);
  const c3P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warning, seed: 18 }));
  s.add(decorAura(0, 20, 560, '#fb923c1a', '#5ce1e614'));

  const headline = heroTitle(['What Counts', 'as a Valid Draw?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.warning,
    eyebrow: 'DEDUP BIAS  ·  ORACLE VS SELECTOR  ·  SANDBOX',
  });

  // View 0 (Beat 0): Deduplicating [X, X, Y, Z] inflates pass@2 from 50.0% to 66.7%
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const rm = smooth(remP.value);
      const dd = dedupP.value;
      const labels = ['X', 'X', 'Y', 'Z'];
      const nodes = [
        txt(
          '4 DRAWS  ·  BUDGET k = 2  ·  ONLY Y PASSES',
          -810,
          -225,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ),
      ];

      ['As drawn (keep all 4)', 'After deleting duplicate X'].forEach((name, row) => {
        const y = -85 + row * 235;
        nodes.push(txt(name, -810, y, 28, row === 0 ? ROLE.lift : ROLE.danger, 'sans', 'left'));
        labels.forEach((lbl, i) => {
          const dropOut = row === 1 && i === 1;
          if (dropOut && rm > 0.65) return;
          const shiftX = row === 1 && i > 1 ? -205 * Math.max(0, (rm - 0.45) / 0.55) : 0;
          const shiftY = dropOut ? 115 * Math.min(1, rm / 0.65) : 0;
          const cx = -240 + i * 205 + shiftX;
          const isPass = lbl === 'Y';
          const col = isPass ? ROLE.modelB : dropOut ? ROLE.danger : COSMOS.muted;
          nodes.push(
            rect(168, 76, {
              fill: isPass ? '#0f2820' : '#10192e',
              stroke: col,
              width: isPass ? 3 : 2,
              radius: 12,
            })
              .at(cx, y + shiftY)
              .opacity(dropOut ? Math.max(0, 1 - rm * 1.4) : 1)
              .glow(isPass ? 8 : 0, col),
            txt(`${lbl} · ${isPass ? 'pass' : 'fail'}`, cx, y + shiftY, 26, col, 'mono').opacity(
              dropOut ? Math.max(0, 1 - rm * 1.4) : 1,
            ),
          );
        });
        if (dd > 0.05) {
          const score = row === 0 ? passAtK(1, 4, 2) : passAtK(1, 3, 2);
          nodes.push(
            txt(
              `${(score * 100).toFixed(1)}%`,
              690,
              y,
              44,
              row === 0 ? ROLE.lift : ROLE.danger,
              'mono',
            )
              .glow(9, row === 0 ? ROLE.lift : ROLE.danger)
              .opacity(dd),
          );
        }
      });

      if (dd > 0.05) {
        nodes.push(
          txt(
            'Score jumps 50.0% → 66.7% without generating a single better answer  ·  keep repeated draws',
            0,
            325,
            30,
            ROLE.threshold,
            'serif',
          ).opacity(dd),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Pool size n=50 vs n=100 precision -> deterministic pipeline collapse
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const dt = detP.value;
      const isDet = dt > 0.5;
      const nodes = [
        txt('TWO POOL SIZES  ·  SAME THREE-ATTEMPT TARGET (k = 3)', 0, -220, 28, ROLE.lift, 'mono'),
      ];

      [50, 100].forEach((nPool, i) => {
        const cx = -390 + i * 780;
        const info = isDet
          ? { target: 1, sd: 0 }
          : (() => {
              const e = estimatorExpectation(0.2, nPool, 3);
              const v = e.mass.reduce(
                (sVal, q, cVal) => sVal + q * (passAtK(cVal, nPool, 3) - e.target) ** 2,
                0,
              );
              return { target: e.target, sd: Math.sqrt(v) };
            })();
        nodes.push(
          rect(560, 280, { fill: '#0e172c', stroke: ROLE.modelA, width: 2.6, radius: 18 }).at(
            cx,
            10,
          ),
          txt(`Pool n = ${nPool}  ·  k = 3`, cx, -75, 34, ROLE.modelA, 'mono'),
          txt(`Target:  ${info.target.toFixed(3)}`, cx, 10, 34, ROLE.lift, 'mono'),
          txt(
            isDet
              ? 'Deterministic (p = 1) · SD = 0'
              : `p = 0.20 · Estimator SD = ${info.sd.toFixed(4)}`,
            cx,
            92,
            26,
            isDet ? ROLE.threshold : COSMOS.muted,
            'mono',
          ),
        );
      });

      nodes.push(
        txt(
          isDet
            ? 'Genuinely deterministic pipeline: identical repeats → pass@k = pass@1 (temp 0 alone is not proof)'
            : 'Larger n sharpens precision  ·  always report pool size n alongside k',
          0,
          295,
          30,
          isDet ? ROLE.threshold : COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Oracle hidden tests find C3 pass vs product selector picks C1 fail
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const sl = selP.value;
      const vals = [0, 0, 1, 0];
      const nodes = [
        txt('HIDDEN-TEST ORACLE VS PRODUCTION SELECTOR', 0, -225, 28, COSMOS.muted, 'mono'),
      ];

      vals.forEach((v, i) => {
        const cx = -570 + i * 380;
        const col = v ? ROLE.modelB : ROLE.modelA;
        nodes.push(
          rect(270, 90, { fill: v ? '#0f2820' : '#101a30', stroke: col, width: 2.8, radius: 14 })
            .at(cx, -110)
            .glow(v ? 10 : 0, col),
          txt(`C${i + 1} · ${v ? 'pass' : 'fail'}`, cx, -110, 30, col, 'mono'),
        );
      });

      // Oracle arrow to C3
      nodes.push(
        arrow([190, -52], [190, 62], { stroke: ROLE.modelB, width: 4 }).glow(8, ROLE.modelB),
        rect(560, 96, { fill: '#0f2820', stroke: ROLE.modelB, width: 2.8, radius: 14 })
          .at(320, 128)
          .glow(8, ROLE.modelB),
        txt('Oracle finds C3 (pass)', 320, 128, 30, ROLE.modelB, 'mono'),
      );

      if (sl > 0.05) {
        nodes.push(
          group(
            arrow([-570, -52], [-570, 62], { stroke: ROLE.danger, width: 4 }).glow(10, ROLE.danger),
            rect(560, 96, { fill: '#281220', stroke: ROLE.danger, width: 3, radius: 14 })
              .at(-470, 128)
              .glow(10, ROLE.danger),
            txt('Product picks C1 (fail)', -470, 128, 30, ROLE.danger, 'mono'),
            txt(
              'Evaluate the actual selector or reranker  ·  test passes still miss unverified side effects',
              0,
              315,
              30,
              ROLE.warning,
              'serif',
            ),
          ).opacity(sl),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): Execution isolation (gVisor paper host vs released harness sandbox)
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const nodes = [
        txt('EXECUTION ISOLATION BOUNDARY FOR UNTRUSTED CODE', 0, -220, 28, ROLE.lift, 'mono'),
        // Left: Paper boundary
        rect(660, 355, { fill: '#0c172a', stroke: ROLE.lift, width: 2.8, radius: 18 }).at(-400, 30),
        txt('PAPER HOST BOUNDARY', -400, -90, 30, ROLE.lift, 'mono'),
        txt('gVisor sandbox', -400, 5, 34, COSMOS.ink, 'sans'),
        txt('Restricted network access', -400, 68, 30, COSMOS.muted, 'sans'),
        txt('Isolated verification host', -400, 130, 26, ROLE.lift, 'mono'),
        // Right: Released harness
        rect(660, 355, { fill: '#1f180e', stroke: ROLE.threshold, width: 2.8, radius: 18 }).at(
          400,
          30,
        ),
        txt('RELEASED HARNESS', 400, -90, 30, ROLE.threshold, 'mono'),
        txt('Runs candidate code directly', 400, 5, 34, COSMOS.ink, 'sans'),
        txt('Evaluator must supply sandbox', 400, 68, 30, ROLE.danger, 'sans'),
        txt('Verify boundary before executing', 400, 130, 26, ROLE.threshold, 'mono'),
        txt(
          'Report test coverage, isolation boundary, and generation + verification cost',
          0,
          315,
          30,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'protocol-repair-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'protocol-remove', remP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'hyp-protocol-dedup', dedupP, 1, { after: true, dur: 0.6 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'protocol-repair-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-protocol-deterministic', detP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'protocol-repair-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-protocol-selector', selP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 3, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'protocol-repair-3', c3P, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 19. report-contract: Can you subtract these scores?
// Cues (9): report-contract-0, report-matched*, report-contract-1,
//   hyp-report-missing*, report-timeout-score*, report-contract-2,
//   hyp-report-equality*, hyp-report-regression*, hyp-report-zero*
// ---------------------------------------------------------------------------
export function reportContract(s, c) {
  const c0P = s.value(0);
  const matchP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const missP = s.value(0);
  const scoreP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const eqP = s.value(0);
  const regP = s.value(0);
  const zeroP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 19 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ffd16612'));

  const headline = heroTitle(['Match the Budget,', 'Read the Interval'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'MATCHED REPORT  ·  TIMEOUT RULE  ·  DECISION CASES',
  });

  // View 0 (Beat 0): Mismatched A(1 try, 58%) vs B(5 tries, 64%) -> Matched two-panel report
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const mt = matchP.value;
      const pre = fadeOut(mt);
      const post = fadeIn(mt);
      const nodes = [];

      if (pre > 0.02) {
        const pNodes = [
          txt('CANDIDATE ATTEMPTS PER TASK', -260, -210, 28, COSMOS.muted, 'mono', 'left'),
          // Model A: 1 attempt -> 58%
          txt('Model A', -760, -90, 36, ROLE.modelA, 'mono', 'left'),
          rect(108, 76, { fill: '#101c34', stroke: ROLE.modelA, width: 2.8, radius: 12 }).at(
            -220,
            -90,
          ),
          txt('1', -220, -90, 32, ROLE.modelA, 'mono'),
          txt('pass@1:  58%', 740, -90, 38, ROLE.modelA, 'mono', 'right'),
          // Model B: 5 attempts -> 64%
          txt('Model B', -760, 85, 36, ROLE.lift, 'mono', 'left'),
          ...Array.from({ length: 5 }, (_, i) =>
            group(
              rect(108, 76, { fill: '#0d2230', stroke: ROLE.lift, width: 2.8, radius: 12 }).at(
                -220 + i * 134,
                85,
              ),
              txt(String(i + 1), -220 + i * 134, 85, 32, ROLE.lift, 'mono'),
            ),
          ),
          txt('pass@5:  64%', 740, 85, 38, ROLE.lift, 'mono', 'right'),
          txt(
            'B got 4 extra chances per task  ·  you cannot subtract mismatched budgets',
            0,
            290,
            34,
            ROLE.threshold,
            'serif',
          ),
        ];
        nodes.push(group(...pNodes).opacity(pre));
      }

      if (post > 0.02) {
        const macroMean = macroTaskScores.reduce((a, b) => a + b, 0) / 4;
        const mNodes = [
          // Left: Matched 40-pair lift
          txt('A vs B  ·  40 PAIRED TASKS', -440, -195, 30, ROLE.modelA, 'mono'),
          txt('1 attempt each  (matched)', -440, -142, 26, COSMOS.muted, 'sans'),
          rule(-740, -100, -140, -100, ROLE.modelA, 2.4),
          txt('Paired lift', -440, -35, 28, ROLE.modelA, 'mono'),
          txt('+7.5 pp', -440, 48, 66, COSMOS.ink, 'mono').glow(8, ROLE.modelA),
          txt('95% CI:  −10 to +25 pp', -440, 145, 32, ROLE.modelA, 'mono'),
          // Center separator
          rule(0, -210, 0, 210, '#2a3759', 2),
          // Right: Separate B-only macro pass@5
          txt('B ONLY  ·  4 SEPARATE TASKS', 440, -195, 30, ROLE.lift, 'mono'),
          txt('5 of 10 candidates', 440, -142, 26, COSMOS.muted, 'sans'),
          rule(140, -100, 740, -100, ROLE.lift, 2.4),
          txt('Macro pass@5', 440, -35, 28, ROLE.lift, 'mono'),
          txt(macroMean.toFixed(3), 440, 48, 66, COSMOS.ink, 'mono').glow(8, ROLE.lift),
          txt(
            `95% CI:  ${macroTaskInterval[0].toFixed(3)} to ${macroTaskInterval[1].toFixed(3)}`,
            440,
            145,
            32,
            ROLE.lift,
            'mono',
          ),
          txt(
            'Only the matched left panel measures a gain over A',
            0,
            305,
            32,
            ROLE.threshold,
            'serif',
          ),
        ];
        nodes.push(group(...mNodes).opacity(post));
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Timeout policy row (A pass, B timeout -> B - A = -1 kept in denominator)
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const ms = missP.value;
      const sc = scoreP.value;
      const timedOut = ms > 0.5;
      const scored = sc > 0.5;
      const cols = [
        ['TASK', 'new retry task', ROLE.modelA],
        ['CURRENT A', 'pass (1)', ROLE.modelA],
        ['CHALLENGER B', timedOut ? 'timeout' : 'running...', timedOut ? ROLE.danger : ROLE.lift],
        ['B − A', scored ? '−1' : '?', scored ? ROLE.danger : ROLE.threshold],
      ];

      const nodes = [
        txt(
          'DECLARED POLICY:  FIXED TIMEOUT COUNTS AS FAILURE',
          0,
          -215,
          28,
          ROLE.threshold,
          'mono',
        ),
      ];
      cols.forEach(([hdr, val, col], i) => {
        const cx = -570 + i * 380;
        nodes.push(
          txt(hdr, cx, -85, 26, COSMOS.muted, 'mono'),
          rect(320, 108, {
            fill: col === ROLE.danger ? '#281220' : '#101a30',
            stroke: col,
            width: 2.8,
            radius: 14,
          })
            .at(cx, 18)
            .glow(col === ROLE.danger ? 10 : 5, col),
          txt(val, cx, 18, 32, col, 'mono'),
        );
      });

      nodes.push(
        txt(
          scored
            ? 'Dropping this row would erase a win for A  ·  keep it in the denominator'
            : 'Attach hashes, seeds, budgets, clusters, and timeout rules to every report',
          0,
          265,
          32,
          scored ? ROLE.danger : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): 4 intervals on the lift ruler (+1..+14, +2..+14, -8..-1, -10..+25)
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value),
    (vis) => {
      const e = eqP.value;
      const rg = regP.value;
      const z = zeroP.value;
      const ruler = buildLiftRuler({
        axisY: 195,
        guideTop: -175,
        guideBottom: 195,
        guideBreaks: [[6, 72]],
        showThreshold: 1,
      });

      // Determine active case cleanly
      let activeRange = [0.01, 0.14];
      let activeColor = ROLE.lift;
      let activeName = 'CASE 1:  [+1, +14] pp';
      if (z > 0.5) {
        activeRange = developmentBootstrap.interval;
        activeColor = ROLE.modelA;
        activeName = 'CASE 4:  [−10, +25] pp';
      } else if (rg > 0.5) {
        activeRange = [-0.08, -0.01];
        activeColor = ROLE.danger;
        activeName = 'CASE 3:  [−8, −1] pp';
      } else if (e > 0.05) {
        activeRange = [mix(0.01, 0.02, smooth(e)), 0.14];
        activeColor = ROLE.threshold;
        activeName = 'CASE 2:  [+2, +14] pp  (EXACTLY AT CUTOFF)';
      }

      const nodes = [
        ruler.node,
        liftIntervalNodes(ruler.xOf, {
          name: activeName,
          y: -15,
          interval: activeRange,
          progress: 1,
          color: activeColor,
          highlightLower: true,
          showEndpoints: e < 0.04 || e > 0.96,
        }),
      ];

      // Non-overlapping verdict text across the 4 cases
      const v0Op = fadeOut(e);
      const v1Op = fadeIn(e) * fadeOut(rg);
      const v2Op = fadeIn(rg) * fadeOut(z);
      const v3Op = fadeIn(z);

      if (v0Op > 0.02) {
        nodes.push(txt(liftVerdictText([0.01, 0.14]), 0, 345, 34, ROLE.lift, 'mono').opacity(v0Op));
      }
      if (v1Op > 0.02) {
        nodes.push(
          txt(
            'Rule is strictly > +2 pp  ·  still hold the switch',
            0,
            345,
            34,
            ROLE.threshold,
            'mono',
          ).opacity(v1Op),
        );
      }
      if (v2Op > 0.02) {
        nodes.push(
          txt(liftVerdictText([-0.08, -0.01]), 0, 345, 34, ROLE.danger, 'mono').opacity(v2Op),
        );
      }
      if (v3Op > 0.02) {
        nodes.push(
          txt(
            liftVerdictText(developmentBootstrap.interval),
            0,
            345,
            34,
            ROLE.modelA,
            'mono',
          ).opacity(v3Op),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'report-contract-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'report-matched', matchP, 1, { after: true, dur: 0.75 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'report-contract-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-report-missing', missP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'report-timeout-score', scoreP, 1, { after: true, dur: 0.55 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'report-contract-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-report-equality', eqP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'hyp-report-regression', regP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'hyp-report-zero', zeroP, 1, { after: true, dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 20. holdout: Would you switch now? (FINALE)
// Cues (8): holdout-rows, holdout-count*, holdout-lift*, holdout-interval,
//   holdout-lower, holdout-predict*, holdout-clearance, release-receipt
// ---------------------------------------------------------------------------
export function holdout(s, c) {
  const rowsP = s.value(0);
  const cntP = s.value(0);
  const v1P = s.value(0);
  const liftP = s.value(0);
  const ivP = s.value(0);
  const lowP = s.value(0);
  const predP = s.value(0);
  const clearP = s.value(0);
  const relP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelB, seed: 20 }));
  s.add(decorAura(-350, 20, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(350, 20, 520, '#6ee7b724', '#ffd16614'));

  const headline = heroTitle(['The Fresh Holdout:', 'Would You Switch Now?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.modelB,
    eyebrow: '400 FRESH MATCHED TASKS  ·  FROZEN PROTOCOL',
  });

  const bWins = holdoutRows.filter((r) => r.difference > 0).length;
  const aWins = holdoutRows.filter((r) => r.difference < 0).length;
  const ties = holdoutRows.length - bWins - aWins;
  const hLift = (bWins - aWins) / holdoutRows.length;
  const devLift = taskRows.reduce((sum, r) => sum + r.difference, 0) / taskRows.length;

  // View 0 (Beat 0): 400-task holdout constellation (40 x 10 grid)
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const rw = rowsP.value;
      const cn = cntP.value;
      const shown = Math.max(20, Math.min(400, Math.floor(20 + 380 * rw)));
      const nodes = [
        txt(
          `${shown} of 400 fresh matched tasks (1 attempt each)`,
          0,
          -225,
          30,
          COSMOS.ink,
          'mono',
        ),
      ];

      for (let i = 0; i < 400; i++) {
        const col = i % 40;
        const row = Math.floor(i / 40);
        const cx = -741 + col * 38;
        const cy = -155 + row * 34;
        const active = i < shown;
        const diff = holdoutRows[i].difference;
        const fill = !active
          ? '#0f1628'
          : diff > 0
            ? ROLE.modelB
            : diff < 0
              ? ROLE.danger
              : '#344770';
        nodes.push(
          rect(25, 22, { fill, stroke: null, radius: 4 })
            .at(cx, cy)
            .glow(active && diff !== 0 ? 5 : 0, fill),
        );
      }

      const preC = fadeOut(cn);
      const postC = fadeIn(cn);
      if (preC > 0.02) {
        nodes.push(
          txt(
            'Keep holdout strictly separate from development',
            0,
            295,
            32,
            COSMOS.muted,
            'serif',
          ).opacity(preC),
        );
      }
      if (postC > 0.02) {
        nodes.push(
          group(
            txt(`B only:  ${bWins}`, -460, 295, 38, ROLE.modelB, 'mono').glow(9, ROLE.modelB),
            txt(`A only:  ${aWins}`, 0, 295, 38, ROLE.danger, 'mono').glow(9, ROLE.danger),
            txt(`Ties:  ${ties}`, 460, 295, 38, COSMOS.muted, 'mono'),
          ).opacity(postC),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beats 1-2): Dual-track precision lift ruler (Dev 40 vs Holdout 400) + final decision
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value),
    (vis) => {
      const lf = liftP.value;
      const iv = smooth(ivP.value);
      const lw = lowP.value;
      const pd = predP.value;
      const cl = smooth(clearP.value);
      const rl = relP.value;

      const ruler = buildLiftRuler({
        axisY: 225,
        guideTop: -195,
        guideBottom: 225,
        guideBreaks: [
          [-74, -14],
          [108, 168],
        ],
        showThreshold: 1,
      });
      const nodes = [
        ruler.node,
        // Upper track: Development 40 tasks
        liftIntervalNodes(ruler.xOf, {
          name: 'DEVELOPMENT  ·  40 TASKS',
          y: -95,
          interval: developmentBootstrap.interval,
          estimate: devLift,
          progress: 1,
          color: ROLE.modelA,
          highlightLower: false,
        }),
        // Lower track: Fresh holdout 400 tasks
        liftIntervalNodes(ruler.xOf, {
          name: 'FRESH HOLDOUT  ·  400 TASKS',
          y: 88,
          interval: holdoutBootstrap.interval,
          estimate: lf > 0.4 ? hLift : undefined,
          progress: iv,
          color: ROLE.modelB,
          highlightLower: lw > 0.4,
          clearance: cl,
        }),
      ];

      // Strict non-overlapping bottom phases:
      // Phase A: lift calculation (52 - 12)/400 = +10 pp
      // Phase B (prediction pause): Which action does the frozen rule call for?
      // Phase C (after release-receipt): Switch to B!
      const pA = fadeOut(pd);
      const pB = fadeIn(pd) * fadeOut(rl);
      const pC = fadeIn(rl);

      if (pA > 0.02) {
        nodes.push(
          txt(
            lf > 0.5
              ? '(52 − 12) / 400  =  +10.0 percentage points'
              : 'Computing paired lift across 400 fresh tasks...',
            0,
            375,
            34,
            ROLE.lift,
            'mono',
          ).opacity(pA),
        );
      }

      if (pB > 0.02) {
        nodes.push(
          txt(
            'Which action does the frozen +2 pp rule call for?',
            0,
            375,
            38,
            ROLE.threshold,
            'serif',
          )
            .glow(10, ROLE.threshold)
            .opacity(pB),
        );
      }

      if (pC > 0.02) {
        nodes.push(
          txt('SWITCH TO B  (+6.25 pp)', 0, 375, 42, ROLE.modelB, 'mono')
            .glow(12, ROLE.modelB)
            .opacity(pC),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'holdout-rows', rowsP, 1, { dur: 1.5 });
  cueTo(s, c, 'holdout-count', cntP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'holdout-lift', liftP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'holdout-interval', ivP, 1, { dur: 1.0 });
  cueTo(s, c, 'holdout-lower', lowP, 1, { dur: 0.6 });
  cueTo(s, c, 'holdout-predict', predP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'holdout-clearance', clearP, 1, { dur: 0.85 });
  cueTo(s, c, 'release-receipt', relP, 1, { after: true, dur: 0.25 });
}
