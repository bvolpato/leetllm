// Scene 11: metric-estimators - Which groups count?
// Signature 3Blue1Brown reliability centerpiece across 3 non-overlapping modes:
//   Mode 0 (Beat 0): Per-task combinatorial pass^k estimator C(c,k)/C(n,k) averaged by task.
//   Mode 1 (Beat 1): All C(5,3)=10 patch triples laid out as a constellation, isolating
//     the single miss {1,3,4} strictly after `missed-triple` and pass@3 = 9/10 after `patch-result`.
//   Mode 2 (Beats 2-3): Live pass@k vs pass^k curves (1-(1-p)^k vs p^k at p=0.70) +
//     shrinking probability strip (0.70 -> 0.49 -> ??? withheld during Beat 2 question,
//     revealing 0.343 after `power-cube` and 0.657 after `failure-complement`), then
//     contrasting heterogeneous task average (0.500 after `heterogeneous`) vs pooled cube
//     (1/8 = 0.125 after `pooled-wrong`).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  HETERO_POOLED_ALL3,
  HETERO_TRUE_ALL3,
  PATCH_TRIPLES,
  PATCH_WINNERS,
  RESERVATION_FAIL3,
  RESERVATION_P,
  RESERVATION_P2,
  RESERVATION_P3,
  ROLE,
  TRIALS,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowMeter,
  glowTex,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function metricEstimators(s, c) {
  const pulse = s.value(0);
  // Beat 0
  const allKRule = s.value(0);
  const taskAvg = s.value(0);
  // Mode switches
  const mode1T = s.value(0);
  const mode2T = s.value(0);
  // Beat 1 patch triples
  const subsetsOn = s.value(0);
  const missOn = s.value(0);
  const patchRes = s.value(0);
  const hitRuleOn = s.value(0);
  // Beats 2-3 probability strip + pass@k vs pass^k curves + Jensen pooling trap
  const p1On = s.value(0);
  const p2On = s.value(0);
  const p3Step = s.value(0);
  const cubeOn = s.value(0);
  const compOn = s.value(0);
  const twoTasks = s.value(0);
  const heteroOn = s.value(0);
  const pooledOn = s.value(0);

  const header = cinemaHeader('RELIABILITY ESTIMATORS', 'Which groups', 'count?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(160, 40, 680, '#6ee7b71a', '#5ce1e616');

  // MathJax formulas (placed cleanly in top-right / open zones, toggled per mode)
  const passHatEq = glowTex(
    String.raw`\widehat{\text{pass}^k} = \frac{\binom{c}{k}}{\binom{n}{k}}`,
    { x: 470, y: -325, size: 42, color: ROLE.pass, glow: 8 },
  );
  const passAtEq = glowTex(
    String.raw`\widehat{\text{pass}@k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}} = \frac{9}{10}`,
    { x: 420, y: -325, size: 38, color: ROLE.pass, glow: 8 },
  );

  // Mode 0 (Beat 0): Per-task combinatorial pass^k estimator
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode1T.value),
    (a) => {
      const ak = allKRule.value;
      const ta = taskAvg.value;
      const nodes = [];

      nodes.push(
        txt('TASK', -840, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('n=3 INDEPENDENT RERUNS', -450, -175, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('PASSES c', -150, -175, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('C(c,3) / C(3,3)', 140, -175, 26, ROLE.pass, 'mono', 'center').opacity(a),
        txt('CONTRIBUTION', 560, -175, 26, ROLE.trace, 'mono', 'center').opacity(a),
        line([-840, -145], [840, -145], { stroke: '#29385f', width: 2 }).opacity(a),
      );

      TRIALS.forEach((t, idx) => {
        const y = -72 + idx * 112;
        const passes = t.pass.filter(Boolean).length;
        const contrib = passes === 3 ? 1 : 0;
        nodes.push(
          txt(t.task, -840, y, 32, contrib ? ROLE.pass : COSMOS.ink, 'sans', 'left').opacity(a),
        );
        t.pass.forEach((ok, j) => {
          const cx = -530 + j * 80;
          nodes.push(
            glowDot(cx, y, {
              radius: 22,
              color: ok ? ROLE.pass : ROLE.fail,
              glow: ok ? 8 : 10,
              opacity: a,
            }),
            txt(ok ? 'P' : 'F', cx, y, 26, '#070910', 'mono', 'center').opacity(a),
          );
        });
        nodes.push(
          txt(`${passes} / 3`, -150, y, 30, COSMOS.ink, 'mono', 'center').opacity(a),
          txt(
            passes === 3 ? '1 / 1' : '0 / 1',
            140,
            y,
            30,
            contrib ? ROLE.pass : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a * (0.45 + 0.55 * ak)),
          txt(
            contrib ? '1.000' : '0.000 (c < k)',
            560,
            y,
            30,
            contrib ? ROLE.pass : COSMOS.muted,
            'mono',
            'center',
          )
            .glow(contrib ? 8 : 0, ROLE.pass)
            .opacity(a * (0.45 + 0.55 * ak)),
        );
      });

      nodes.push(
        line([-840, 220], [840, 220], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          ta > 0.3
            ? 'EQUAL-WEIGHT TASK AVERAGE:  (1 + 0 + 0) / 3 = 1/3 = 0.333'
            : 'Count k-subsets within each task row before averaging',
          0,
          292,
          30,
          ta > 0.3 ? ROLE.pass : ROLE.focus,
          'mono',
          'center',
        )
          .glow(ta > 0.3 ? 9 : 0, ROLE.pass)
          .opacity(a),
        txt(
          'Assumes independent reruns under fixed conditions within each task',
          0,
          388,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beat 1): Patch search C(5,3) = 10 subsets constellation
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode1T.value) * fadeOutHalf(mode2T.value),
    (a) => {
      const sub = subsetsOn.value;
      const ms = missOn.value;
      const pr = patchRes.value;
      const hr = hitRuleOn.value;
      const nodes = [];

      // Left rail: 5 candidate patches (P2 and P5 pass)
      nodes.push(txt('5 CANDIDATE PATCHES', -840, -175, 26, ROLE.trace, 'mono', 'left').opacity(a));
      for (let idx = 1; idx <= 5; idx++) {
        const isWin = PATCH_WINNERS.includes(idx);
        const y = -105 + (idx - 1) * 86;
        const col = isWin ? ROLE.pass : COSMOS.dim;
        nodes.push(
          glowDot(-810, y, { radius: 13, color: col, glow: isWin ? 10 : 3, opacity: a }),
          txt(
            `Patch ${idx}`,
            -772,
            y,
            28,
            isWin ? COSMOS.ink : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(
            isWin ? 'PASS' : 'FAIL',
            -580,
            y,
            26,
            isWin ? ROLE.pass : ROLE.fail,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      // Right 2x5 constellation of all 10 groups of 3
      nodes.push(
        txt(
          'ALL C(5,3) = 10 GROUPS OF 3 PATCHES',
          -360,
          -175,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(a),
      );
      PATCH_TRIPLES.forEach((triple, i) => {
        const colIdx = i % 5;
        const rowIdx = Math.floor(i / 5);
        const cx = -270 + colIdx * 265;
        const cy = -45 + rowIdx * 205;
        const hasWin = triple.some((id) => PATCH_WINNERS.includes(id));
        const isMiss = !hasWin;

        let ringCol = COSMOS.dim;
        let badge = '';
        if (isMiss && ms > 0.35) {
          ringCol = ROLE.fail;
          badge = 'MISS';
        } else if (hasWin && pr > 0.35) {
          ringCol = ROLE.pass;
          badge = 'HIT';
        } else if (sub > 0.25) {
          ringCol = '#3b4e7d';
        }

        const cellA = a * (0.35 + 0.65 * sub);
        nodes.push(
          line([cx - 88, cy - 38], [cx + 88, cy - 38], { stroke: ringCol, width: 3.4 })
            .glow(badge ? 9 : 2, ringCol)
            .opacity(cellA),
          txt(
            `{${triple.join(', ')}}`,
            cx,
            cy + 4,
            30,
            badge ? ringCol : COSMOS.ink,
            'mono',
            'center',
          )
            .glow(isMiss && ms > 0.35 ? 10 : 0, ROLE.fail)
            .opacity(cellA),
        );
        if (badge) {
          nodes.push(
            txt(badge, cx, cy + 52, 26, ringCol, 'mono', 'center').opacity(a * (isMiss ? ms : pr)),
          );
        }
      });

      const footer =
        hr > 0.3
          ? 'pass@3 = 1 - 1/10 = 9/10 = 0.900  (still needs a real deployed selector!)'
          : pr > 0.35
            ? '9 OF 10 GROUPS CONTAIN A WINNING PATCH -> pass@3 = 0.900'
            : ms > 0.35
              ? '{1, 3, 4} IS THE ONLY ALL-FAILURE GROUP (1 MISS OF 10)'
              : 'Inspect all 10 triples of 3 patches drawn from 5 samples';
      nodes.push(
        txt(
          footer,
          0,
          395,
          28,
          pr > 0.35 ? ROLE.pass : ms > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 2 (Beats 2-3): pass@k vs pass^k curves + shrinking p^k strip + heterogeneity contrast
  const mode2 = guardedDynamic(
    () => fadeInHalf(mode2T.value),
    (a) => {
      const p1 = p1On.value;
      const p2 = p2On.value;
      const p3 = p3Step.value;
      const cb = cubeOn.value;
      const cp = compOn.value;
      const tt = twoTasks.value;
      const ht = heteroOn.value;
      const po = pooledOn.value;
      const nodes = [];

      // Left half: Shrinking probability strip (0.70 -> 0.49 -> ??? -> 0.343 + 0.657 fail)
      const sx = -840;
      const sw = 720;
      nodes.push(
        txt('INDEPENDENT RERUNS AT p = 0.70', sx, -185, 26, ROLE.pass, 'mono', 'left').opacity(a),
        // k = 1 strip
        txt('k = 1:   p = 0.70', sx, -125, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.4 + 0.6 * p1),
        ),
        glowMeter(sx, -85, sw, 26, RESERVATION_P, {
          fill: ROLE.pass,
          opacity: a * (0.4 + 0.6 * p1),
        }),
        // k = 2 strip
        txt('k = 2:   0.70 × 0.70 = 0.49', sx, -20, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.3 + 0.7 * p2),
        ),
        glowMeter(sx, 20, sw, 26, RESERVATION_P2, {
          fill: ROLE.trace,
          opacity: a * (0.3 + 0.7 * p2),
        }),
        // k = 3 strip (withholds 0.343 until `c.after('power-cube')`!)
        txt(
          cb > 0.35
            ? `k = 3:   0.70³ = ${RESERVATION_P3.toFixed(3)}`
            : p3 > 0.2
              ? 'k = 3:   0.70 × 0.49 = ...'
              : 'k = 3:   what fraction passes all 3?',
          sx,
          88,
          28,
          cb > 0.35 ? ROLE.pass : ROLE.focus,
          'mono',
          'left',
        )
          .glow(cb > 0.35 ? 8 : 0, ROLE.pass)
          .opacity(a),
      );

      if (cb > 0.05) {
        const passW = sw * RESERVATION_P3;
        const failW = sw * RESERVATION_FAIL3;
        nodes.push(
          rect(passW, 30, { fill: ROLE.pass, stroke: null, radius: 6 })
            .at(sx + passW * 0.5, 132)
            .glow(10, ROLE.pass)
            .opacity(a * cb),
        );
        if (cp > 0.05) {
          nodes.push(
            rect(failW - 4, 30, { fill: ROLE.fail, stroke: null, radius: 6 })
              .at(sx + passW + 4 + (failW - 4) * 0.5, 132)
              .glow(8, ROLE.fail)
              .opacity(a * cp * 0.88),
            txt(
              `At least 1 failure: 1 - 0.343 = ${RESERVATION_FAIL3.toFixed(3)}`,
              sx,
              184,
              26,
              ROLE.fail,
              'mono',
              'left',
            ).opacity(a * cp),
          );
        }
      } else {
        nodes.push(glowMeter(sx, 132, sw, 28, 0, { fill: ROLE.focus, opacity: a * 0.8 }));
      }

      // Lower-left: Heterogeneity vs Pooling Trap (appears on `two-tasks`)
      if (tt > 0.05) {
        nodes.push(
          line([sx, 224], [sx + sw, 224], { stroke: '#29385f', width: 2 }).opacity(a * tt),
          txt(
            '2 EQUAL TASKS:  p₁ = 1.0  &  p₂ = 0.0',
            sx,
            260,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(a * tt),
        );
        if (ht > 0.05) {
          nodes.push(
            txt(
              `Per-task avg: (1³ + 0³)/2 = ${HETERO_TRUE_ALL3.toFixed(3)}  (1/2)`,
              sx,
              308,
              28,
              ROLE.trace,
              'mono',
              'left',
            )
              .glow(8, ROLE.trace)
              .opacity(a * ht),
          );
        }
        if (po > 0.05) {
          nodes.push(
            txt(
              `Pooled cube: 0.5³ = ${HETERO_POOLED_ALL3.toFixed(3)}  (1/8 WRONG!)`,
              sx,
              356,
              28,
              ROLE.fail,
              'mono',
              'left',
            )
              .glow(8, ROLE.fail)
              .opacity(a * po),
          );
        }
      }

      // Right half: Live pass@k vs pass^k curves (k = 1..6 at p = 0.70)
      const px0 = 80;
      const px1 = 830;
      const pyBot = 245;
      const pyTop = -155;
      const xK = (k) => px0 + ((k - 1) / 5) * (px1 - px0);
      const yP = (prob) => pyBot - prob * (pyBot - pyTop);

      nodes.push(
        txt(
          'pass@k  vs  pass^k  (p = 0.70)',
          (px0 + px1) * 0.5,
          -238,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
        line([px0, pyBot], [px1, pyBot], { stroke: '#334672', width: 2.5 }).opacity(a),
        line([px0, pyBot], [px0, pyTop], { stroke: '#334672', width: 2.5 }).opacity(a),
        txt('1.0', px0 - 22, pyTop, 26, COSMOS.dim, 'mono', 'right').opacity(a),
        txt('0.5', px0 - 22, yP(0.5), 26, COSMOS.dim, 'mono', 'right').opacity(a),
        txt('0.0', px0 - 22, pyBot, 26, COSMOS.dim, 'mono', 'right').opacity(a),
      );
      for (let k = 1; k <= 6; k++) {
        nodes.push(txt(`k=${k}`, xK(k), pyBot + 36, 26, COSMOS.muted, 'mono', 'center').opacity(a));
      }

      // Upper curve: pass@k = 1 - (1 - 0.7)^k (patch discovery rises toward 1.0)
      const atPts = [];
      const hatPts = [];
      for (let sIdx = 0; sIdx <= 40; sIdx++) {
        const kVal = 1 + (sIdx / 40) * 5;
        atPts.push([xK(kVal), yP(1 - Math.pow(1 - RESERVATION_P, kVal))]);
        hatPts.push([xK(kVal), yP(Math.pow(RESERVATION_P, kVal))]);
      }

      nodes.push(
        glowingTrail(atPts, { color: ROLE.trace, width: 3.6, glow: 9, opacity: a * 0.92 }),
        glowingTrail(hatPts, { color: ROLE.pass, width: 4.0, glow: 10, opacity: a * 0.95 }),
        txt('pass@k  (at least 1)', xK(4.4), pyTop - 28, 26, ROLE.trace, 'mono', 'center').opacity(
          a,
        ),
        txt('pass^k  (all k pass)', xK(4.3), yP(0.52), 26, ROLE.pass, 'mono', 'center').opacity(a),
      );

      // Highlight k=1, k=2, and k=3 (k=3 value dot only after `power-cube`!)
      nodes.push(glowDot(xK(1), yP(0.7), { radius: 7.5, color: ROLE.pass, glow: 10, opacity: a }));
      if (p2 > 0.3) {
        nodes.push(
          glowDot(xK(2), yP(RESERVATION_P2), {
            radius: 8,
            color: ROLE.trace,
            glow: 10,
            opacity: a * p2,
          }),
        );
      }
      if (cb > 0.35) {
        nodes.push(
          glowDot(xK(3), yP(RESERVATION_P3), {
            radius: 10,
            color: ROLE.pass,
            glow: 14,
            opacity: a * cb,
          }),
          txt('0.343', xK(3) + 18, yP(RESERVATION_P3) - 18, 28, ROLE.pass, 'mono', 'left')
            .glow(9, ROLE.pass)
            .opacity(a * cb),
        );
      }

      nodes.push(
        txt(
          'Compute pass^k per task first · log simulator & seed',
          0,
          404,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, passHatEq, mode0, mode1, mode2);

  c.on('all-k-rule', () => {
    s.play(allKRule.to(1, { duration: clampDur(c, c.cue('all-k-rule').start, 0.35) }));
  });
  c.on('task-average', () => {
    s.play(taskAvg.to(1, { duration: clampDur(c, c.cue('task-average').start, 0.35) }));
  });

  // Beat 1: Patch search
  c.hide(1, passHatEq);
  c.onBeat(1, () => {
    s.play(mode1T.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.on('patch-subsets', () => {
    s.play(subsetsOn.to(1, { duration: clampDur(c, c.cue('patch-subsets').start, 0.4) }));
  });
  c.after('missed-triple', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('missed-triple').end, 0.3) }));
  });
  c.after('patch-result', () => {
    s.play(patchRes.to(1, { duration: clampDur(c, c.cue('patch-result').end, 0.3) }));
  });
  c.show('hit-rule', passAtEq);
  c.on('hit-rule', () => {
    s.play(hitRuleOn.to(1, { duration: clampDur(c, c.cue('hit-rule').start, 0.35) }));
  });

  // Beat 2-3: pass@k vs pass^k curves + shrinking strip + heterogeneity
  c.hide(2, passAtEq);
  c.onBeat(2, () => {
    s.play(mode2T.to(1, { duration: clampDur(c, c.beats[2].start, 0.6) }));
  });
  c.on('first-pass', () => {
    s.play(p1On.to(1, { duration: clampDur(c, c.cue('first-pass').start, 0.35) }));
  });
  c.on('second-pass', () => {
    s.play(p2On.to(1, { duration: clampDur(c, c.cue('second-pass').start, 0.35) }));
  });
  c.on('third-pass', () => {
    s.play(p3Step.to(1, { duration: clampDur(c, c.cue('third-pass').start, 0.35) }));
  });
  c.after('power-cube', () => {
    s.play(cubeOn.to(1, { duration: clampDur(c, c.cue('power-cube').end, 0.3) }));
  });
  c.after('failure-complement', () => {
    s.play(compOn.to(1, { duration: clampDur(c, c.cue('failure-complement').end, 0.3) }));
  });
  c.on('two-tasks', () => {
    s.play(twoTasks.to(1, { duration: clampDur(c, c.cue('two-tasks').start, 0.4) }));
  });
  c.after('heterogeneous', () => {
    s.play(heteroOn.to(1, { duration: clampDur(c, c.cue('heterogeneous').end, 0.3) }));
  });
  c.after('pooled-wrong', () => {
    s.play(pooledOn.to(1, { duration: clampDur(c, c.cue('pooled-wrong').end, 0.3) }));
  });
}
