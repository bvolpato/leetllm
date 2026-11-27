// Act 3 (Scenes 11-15): Paired Bootstrap Uncertainty, Interval Contract (Coverage/Wald/Ties),
// Useful Lift Decision Ruler, Unbiased pass@k Subsets, and pass@k Target.
import { Node, arrow, circle, dynamic, group, line, polyPath, rect } from 'vizmatic/stage';
import {
  BOOTSTRAP_BIN_EDGES,
  COSMOS,
  ROLE,
  beatTo,
  bootstrapBins,
  buildLiftRuler,
  candidateSubsets,
  cinemaGrid,
  cueTo,
  decorAura,
  developmentBootstrap,
  fadeIn,
  fadeOut,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  liftIntervalNodes,
  liftVerdictText,
  makeAxes,
  markDecor,
  mix,
  neonCurve,
  pairedIntervalStudies,
  passingCandidates,
  sampleCurve,
  smooth,
  sortedDevelopmentMeans,
  taskRows,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 11. paired-uncertainty: How large could the improvement be?
// Cues: bootstrap-draw, bootstrap-repeat, bootstrap-mean, bootstrap-many,
//       bootstrap-interval, bootstrap-zero
// ---------------------------------------------------------------------------
export function pairedUncertainty(s, c) {
  const drawP = s.value(0);
  const repP = s.value(0);
  const v2P = s.value(0);
  const meanP = s.value(0);
  const manyP = s.value(0);
  const ivP = s.value(0);
  const zeroP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 11 }));
  s.add(decorAura(-420, 30, 480, '#60a5fa1a', '#07091000'));
  s.add(decorAura(420, 30, 480, '#5ce1e61e', '#ffd16610'));

  const headline = heroTitle(['Resample Whole Pairs', 'to Bound the Lift'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'PAIRED BOOTSTRAP  ·  8,000 RESAMPLES',
  });

  // View 1 (Beat 0): Left 40 observed rows -> firing with replacement into Right resample
  const view1 = guardedDynamic(
    () => fadeOut(v2P.value),
    (vis) => {
      const dr = drawP.value;
      const rp = repP.value;
      const pos = dr < 0.55 ? (dr / 0.55) * 4 : 4 + ((dr - 0.55) / 0.45) * 36;
      const count = Math.min(40, Math.floor(pos));
      const drawnIndices = developmentBootstrap.first.slice(0, count);
      const t02Count = drawnIndices.filter((idx) => taskRows[idx].id === 'T02').length;

      const nodes = [
        txt('40 OBSERVED TASK PAIRS', -460, -225, 28, ROLE.modelA, 'mono'),
        txt('1 BOOTSTRAP RESAMPLE (WITH REPLACEMENT)', 450, -225, 28, ROLE.lift, 'mono'),
      ];

      // Left 5x8 observed matrix
      taskRows.forEach((row, i) => {
        const cx = -760 + (i % 5) * 142;
        const cy = -160 + Math.floor(i / 5) * 56;
        const isPerm = row.id === 'T02';
        const col =
          isPerm && rp > 0.2
            ? ROLE.threshold
            : row.difference > 0
              ? ROLE.modelB
              : row.difference < 0
                ? ROLE.danger
                : COSMOS.muted;
        nodes.push(
          rect(118, 40, {
            fill: isPerm && rp > 0.2 ? '#29200e' : '#10182b',
            stroke: col,
            width: isPerm && rp > 0.2 ? 2.6 : 1.5,
            radius: 7,
          }).at(cx, cy),
          txt(row.id, cx, cy, 26, col, 'mono'),
        );
      });

      // Right 5x8 resampled matrix
      for (let i = 0; i < 40; i++) {
        const cx = 140 + (i % 5) * 142;
        const cy = -160 + Math.floor(i / 5) * 56;
        if (i < count) {
          const row = taskRows[drawnIndices[i]];
          const isPerm = row.id === 'T02';
          const col = isPerm
            ? ROLE.threshold
            : row.difference > 0
              ? ROLE.modelB
              : row.difference < 0
                ? ROLE.danger
                : ROLE.lift;
          nodes.push(
            rect(118, 40, {
              fill: isPerm ? '#29200e' : '#0f2033',
              stroke: col,
              width: isPerm ? 2.6 : 1.6,
              radius: 7,
            })
              .at(cx, cy)
              .glow(isPerm ? 8 : 0, col),
            txt(row.id, cx, cy, 26, col, 'mono'),
          );
        } else {
          nodes.push(
            rect(118, 40, { fill: '#0b1120', stroke: '#233050', width: 1.2, radius: 7 })
              .at(cx, cy)
              .opacity(0.45),
          );
        }
      }

      // Center transfer indicator (stable text without rapid integer flicker)
      const activeIdx = developmentBootstrap.first[Math.min(39, count)];
      const activeRow = taskRows[activeIdx];
      nodes.push(
        arrow([-65, 20], [50, 20], { stroke: ROLE.threshold, width: 4 }).glow(8, ROLE.threshold),
        txt(
          rp > 0.4
            ? `Permission row (T02) repeats in resample (${t02Count}×)`
            : 'Whole task rows stay paired when drawn with replacement',
          0,
          325,
          30,
          rp > 0.4 ? ROLE.threshold : COSMOS.muted,
          'sans',
        ),
        txt(`Active row: ${activeRow.id}`, 0, 375, 26, COSMOS.dim, 'mono'),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 1-2): 8,000 paired bootstrap means histogram + 2.5% tail trim -> [-10, +25] pp
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value),
    (vis) => {
      const mn = meanP.value;
      const my = manyP.value;
      const iv = smooth(ivP.value);
      const zr = zeroP.value;
      const draws = Math.max(1, Math.min(8000, Math.floor(1 + 7999 * my)));
      const bins = bootstrapBins(developmentBootstrap.means.slice(0, draws));
      const trimmedCount = Math.floor(200 * iv);
      const centralBins =
        trimmedCount > 0
          ? bootstrapBins(sortedDevelopmentMeans.slice(trimmedCount, 8000 - trimmedCount))
          : bins;

      const x0 = -760;
      const spanW = 1520;
      const baseY = 175;
      const maxH = 360;
      const maxCount = 2250;
      const step = spanW / bins.length;
      const barW = step - 16;

      const nodes = [
        txt(
          `${draws.toLocaleString('en-US')} paired resamples`,
          -760,
          -238,
          32,
          ROLE.lift,
          'mono',
          'left',
        ),
        line([x0 - 20, baseY], [x0 + spanW + 20, baseY], { stroke: '#4d6499', width: 2.8 }),
      ];

      bins.forEach((cnt, i) => {
        const cx = x0 + (i + 0.5) * step;
        const fullH = (cnt / maxCount) * maxH;
        const keepH = (centralBins[i] / maxCount) * maxH;
        const isNeg = BOOTSTRAP_BIN_EDGES[i] < 0;
        const col = isNeg ? ROLE.danger : ROLE.lift;

        if (fullH > 1.5) {
          // Draw dimmed tail portion if trimmed, then glowing central portion
          if (iv > 0.04 && fullH > keepH + 1) {
            nodes.push(
              glowCol(cx, baseY, barW, fullH, '#4a556e', { glow: 0, radius: 5, opacity: 0.45 }),
            );
          }
          if (keepH > 1.5) {
            nodes.push(glowCol(cx, baseY, barW, keepH, col, { glow: 7, radius: 5 }));
          }
        }
        if (i % 2 === 0) {
          const edgePp = Math.round(BOOTSTRAP_BIN_EDGES[i] * 100);
          const lbl = edgePp < 0 ? `−${Math.abs(edgePp)}` : edgePp > 0 ? `+${edgePp}` : '0';
          nodes.push(txt(lbl, cx, baseY + 36, 26, COSMOS.muted, 'mono'));
        }
      });

      // Vertical zero line igniting on bootstrap-zero (clean 22px clearance under '0 pp')
      const zeroIdx = BOOTSTRAP_BIN_EDGES.indexOf(0);
      const zeroX = x0 + zeroIdx * step;
      if (zr > 0.05) {
        nodes.push(
          line([zeroX, -188], [zeroX, baseY + 8], {
            stroke: ROLE.threshold,
            width: 3.6,
            dash: [8, 6],
          })
            .glow(10, ROLE.threshold)
            .opacity(zr),
          txt('0 pp', zeroX, -228, 28, ROLE.threshold, 'mono').opacity(zr),
        );
      }

      // Bottom readout (clean non-overlapping crossfade between first resample mean & 95% CI)
      const preIv = fadeOut(iv);
      const postIv = fadeIn(iv);
      if (preIv > 0.02) {
        nodes.push(
          txt(
            `First resample mean: +${(developmentBootstrap.means[0] * 100).toFixed(1)} pp  ·  repeating 8,000×`,
            0,
            295,
            32,
            mn > 0.3 ? ROLE.modelB : COSMOS.muted,
            'mono',
          ).opacity(preIv),
        );
      }
      if (postIv > 0.02) {
        nodes.push(
          group(
            txt(
              '95% PERCENTILE INTERVAL:  −10 pp  TO  +25 pp',
              0,
              285,
              36,
              ROLE.threshold,
              'mono',
            ).glow(9, ROLE.threshold),
            txt(
              zr > 0.5
                ? 'Crosses zero  ·  how often does a percentile procedure cover truth?'
                : 'Trim lowest 2.5% and highest 2.5% (200 means each end)',
              0,
              355,
              30,
              zr > 0.5 ? ROLE.danger : COSMOS.muted,
              'serif',
            ),
          ).opacity(postIv),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'bootstrap-draw', drawP, 1, { dur: 1.5 });
  cueTo(s, c, 'bootstrap-repeat', repP, 1, { dur: 0.65 });
  beatTo(s, c, 1, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'bootstrap-mean', meanP, 1, { dur: 0.65 });
  cueTo(s, c, 'bootstrap-many', manyP, 1, { dur: 1.8 });
  cueTo(s, c, 'bootstrap-interval', ivP, 1, { dur: 1.1 });
  cueTo(s, c, 'bootstrap-zero', zeroP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 12. interval-contract: Which intervals can you trust?
// Cues: interval-contract-0, hyp-interval-studies, interval-contract-1,
//       wald-flip*, hyp-interval-boundary, interval-contract-2, hyp-interval-ties
// ---------------------------------------------------------------------------
export function intervalContract(s, c) {
  const c0P = s.value(0);
  const studP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const flipP = s.value(0);
  const bndP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);
  const tiesP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 12 }));
  s.add(decorAura(0, 20, 560, '#ffd16618', '#ff6b8b14'));

  const headline = heroTitle(['Coverage, Overshoot', '& All-Tie Collapse'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.threshold,
    eyebrow: 'CONFIDENCE INTERVAL DIAGNOSTICS',
  });

  // View 0 (Beat 0): 20 repeated 40-pair intervals against vertical gold True Lift = 0
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const st = studP.value;
      const count = Math.max(1, Math.min(20, Math.floor(1 + 19 * st)));
      const shown = pairedIntervalStudies.slice(0, count);
      const covered = shown.filter((x) => x.covers).length;
      const xOf = (lift) => 80 + lift * 2900;

      const nodes = [
        txt('20 REPEATED STUDIES OF 40 PAIRS', -780, -210, 28, COSMOS.ink, 'mono', 'left'),
        txt('True lift = 0', xOf(0), -210, 30, ROLE.threshold, 'mono'),
        line([xOf(0), -175], [xOf(0), 305], { stroke: ROLE.threshold, width: 3.6 }).glow(
          10,
          ROLE.threshold,
        ),
      ];

      shown.forEach((item, i) => {
        const y = -152 + i * 23;
        const col = item.covers ? ROLE.lift : ROLE.danger;
        const lx = xOf(item.interval[0]);
        const hx = xOf(item.interval[1]);
        nodes.push(
          line([lx, y], [hx, y], { stroke: col, width: 5.5 }).glow(item.covers ? 4 : 9, col),
          glowDot(xOf(item.mean), y, { radius: 4.5, color: col, glow: 5 }),
        );
        if (!item.covers) {
          const isLeft = item.interval[1] < 0;
          nodes.push(
            txt(
              'miss',
              isLeft ? lx - 18 : hx + 18,
              y,
              26,
              ROLE.danger,
              'mono',
              isLeft ? 'right' : 'left',
            ),
          );
        }
      });

      nodes.push(
        txt(`${covered} of ${count} intervals cover the gold line`, 0, 365, 34, COSMOS.ink, 'mono'),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): 4 tasks (4/4 SE=0 -> flip to 3/4 -> Wald punches past 100% to 117.4%)
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const fl = flipP.value;
      const bn = smooth(bndP.value);
      const changed = fl > 0.5;
      const outcomes = [1, 1, 1, changed ? 0 : 1];
      const pHat = outcomes.reduce((a, b) => a + b, 0) / 4;
      const se = Math.sqrt((pHat * (1 - pHat)) / 4);
      const hiFull = pHat + 1.96 * se;
      const lo = pHat - 1.96 * se * bn;
      const hi = pHat + 1.96 * se * bn;

      const x0 = -720;
      const x1 = 440; // 100% wall leaves plenty of room on the right up to 120% (+670)
      const xOf = (r) => mix(x0, x1, r);
      const axisY = 175;
      const barY = 95;

      const nodes = [
        txt(
          'ONE ASSISTANT  ·  FOUR TASKS  (WALD APPROXIMATION)',
          -720,
          -210,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ),
      ];

      outcomes.forEach((pass, i) => {
        const cx = -590 + i * 240;
        const cy = -110;
        const col = pass ? ROLE.modelA : ROLE.danger;
        nodes.push(
          circle(44, { fill: pass ? '#101d35' : '#291220', stroke: col, width: 3 })
            .at(cx, cy)
            .glow(8, col),
          txt(pass ? 'pass' : 'fail', cx, cy, 26, col, 'mono'),
        );
      });

      nodes.push(
        txt(
          changed ? '3 / 4 = 75%' : '4 / 4 = 100%',
          540,
          -110,
          48,
          changed ? ROLE.lift : ROLE.threshold,
          'mono',
        ),
        // Probability ruler 0% .. 100% + overshoot zone
        line([x0, axisY], [x1 + 260, axisY], { stroke: '#3a4b73', width: 2.2, dash: [6, 6] }),
        line([x0, axisY], [x1, axisY], { stroke: '#52689c', width: 3.4 }),
        line([x1, -15], [x1, axisY + 12], { stroke: ROLE.threshold, width: 3.8 }).glow(
          10,
          ROLE.threshold,
        ),
        txt('100% ceiling', x1, -45, 26, ROLE.threshold, 'mono'),
      );

      for (const tick of [0, 0.5, 1]) {
        const tx = xOf(tick);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#6c84ba', width: 2.5 }),
          txt(`${tick * 100}%`, tx, axisY + 42, 26, COSMOS.muted, 'mono'),
        );
      }

      if (hi > lo + 0.005) {
        const clampedHi = Math.min(1, hi);
        nodes.push(
          line([xOf(lo), barY], [xOf(clampedHi), barY], { stroke: ROLE.lift, width: 9 }).glow(
            9,
            ROLE.lift,
          ),
          line([xOf(lo), barY - 18], [xOf(lo), barY + 18], { stroke: ROLE.lift, width: 4 }),
        );
        if (hi > 1) {
          nodes.push(
            line([xOf(1), barY], [xOf(hi), barY], { stroke: ROLE.danger, width: 9 }).glow(
              12,
              ROLE.danger,
            ),
            line([xOf(hi), barY - 18], [xOf(hi), barY + 18], { stroke: ROLE.danger, width: 4 }),
            bn > 0.85
              ? txt(
                  `${(hiFull * 100).toFixed(1)}% !`,
                  xOf(hi),
                  barY - 48,
                  34,
                  ROLE.danger,
                  'mono',
                ).glow(10, ROLE.danger)
              : group(),
          );
        }
      }
      nodes.push(glowDot(xOf(pHat), barY, { radius: 11, color: ROLE.lift, glow: 14 }));

      nodes.push(
        txt(
          !changed
            ? '4/4 passes  →  estimated SE = 0  (interval collapses to a point)'
            : bn > 0.85
              ? 'Wald overshoots 100%  ·  Wilson stays valid for a single rate'
              : '3/4 passes  →  where does 75% + 1.96 × 21.7% land?',
          0,
          320,
          32,
          !changed ? ROLE.warning : bn > 0.85 ? ROLE.danger : ROLE.threshold,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Six all-tied pairs -> bootstrap collapses to [0, 0]
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value),
    (vis) => {
      const ti = tiesP.value;
      const draws = [3, 0, 3, 5, 1, 3];
      const shown = Math.min(6, Math.floor(6.99 * ti));
      const nodes = [
        txt(
          'SIX ALL-TIED OBSERVED PAIRS  (B − A = 0)',
          -740,
          -205,
          28,
          ROLE.modelA,
          'mono',
          'left',
        ),
        txt('RESAMPLE WITH REPLACEMENT', -740, 65, 28, ROLE.lift, 'mono', 'left'),
      ];

      for (let i = 0; i < 6; i++) {
        const cx = -625 + i * 250;
        const activeSrc = shown > 0 && draws[shown - 1] === i;
        nodes.push(
          rect(184, 82, {
            fill: activeSrc ? '#29200e' : '#10192e',
            stroke: activeSrc ? ROLE.threshold : ROLE.modelA,
            width: activeSrc ? 3 : 2,
            radius: 12,
          }).at(cx, -110),
          txt(`T${i + 1}  ·  0`, cx, -110, 30, activeSrc ? ROLE.threshold : ROLE.modelA, 'mono'),
        );
        if (i < shown) {
          nodes.push(
            rect(184, 82, { fill: '#0e2230', stroke: ROLE.lift, width: 2.6, radius: 12 })
              .at(cx, 160)
              .glow(6, ROLE.lift),
            txt(`T${draws[i] + 1}  ·  0`, cx, 160, 30, ROLE.lift, 'mono'),
          );
        } else {
          nodes.push(
            rect(184, 82, { fill: '#0b1120', stroke: '#233050', width: 1.4, radius: 12 })
              .at(cx, 160)
              .opacity(0.45),
          );
        }
      }

      nodes.push(
        txt(
          shown === 6
            ? 'Every resample mean = 0  →  percentile CI collapses to [0, 0]'
            : 'More bootstrap draws cannot invent a missing disagreement',
          0,
          325,
          32,
          shown === 6 ? ROLE.warning : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  cueTo(s, c, 'interval-contract-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-interval-studies', studP, 1, { dur: 2.0 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'interval-contract-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'wald-flip', flipP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'hyp-interval-boundary', bndP, 1, { dur: 0.95 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'interval-contract-2', c2P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-interval-ties', tiesP, 1, { dur: 1.4 });
}

// ---------------------------------------------------------------------------
// 13. useful-lift: Would the gain pay for the switch?
// Cues: useful-threshold, development-range, useful-question*, useful-hold,
//       freeze-protocol*
// ---------------------------------------------------------------------------
export function usefulLift(s, c) {
  const threshP = s.value(0);
  const rangeP = s.value(0);
  const questP = s.value(0);
  const holdP = s.value(0);
  const freezeP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.threshold, seed: 13 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Does the Gain Pay', 'for the Switch?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.threshold,
    eyebrow: 'PRACTICAL SIGNIFICANCE  ·  MINIMUM USEFUL LIFT (+2 PP)',
  });

  const devEstimate = taskRows.reduce((sum, r) => sum + r.difference, 0) / taskRows.length;

  const live = dynamic(() => {
    const th = threshP.value;
    const rg = smooth(rangeP.value);
    const qs = questP.value;
    const hd = holdP.value;
    const fr = freezeP.value;

    const ruler = buildLiftRuler({
      axisY: 185,
      guideTop: -170,
      guideBottom: 185,
      guideBreaks: [[6, 72]],
      showThreshold: 0.35 + 0.65 * th,
    });

    const nodes = [
      ruler.node,
      liftIntervalNodes(ruler.xOf, {
        name: 'DEVELOPMENT  ·  40 TASKS',
        y: -15,
        interval: developmentBootstrap.interval,
        estimate: devEstimate,
        progress: rg,
        color: ROLE.lift,
        highlightLower: qs > 0.4,
      }),
    ];

    // Strict non-overlapping prediction pause -> decision verdict
    const qVis = fadeIn(qs) * fadeOut(hd);
    const holdVis = fadeIn(hd);

    if (qVis > 0.02) {
      nodes.push(
        txt(
          'Does the lower endpoint clear the gold +2 pp line?',
          0,
          335,
          38,
          ROLE.threshold,
          'serif',
        )
          .glow(10, ROLE.threshold)
          .opacity(qVis),
      );
    }

    if (holdVis > 0.02) {
      nodes.push(
        group(
          txt(liftVerdictText(developmentBootstrap.interval), 0, 325, 36, ROLE.danger, 'mono').glow(
            8,
            ROLE.danger,
          ),
          fr > 0.05
            ? txt(
                'Freeze the challenger  ·  validate on fresh matched holdout tasks (1 attempt each)',
                0,
                390,
                28,
                ROLE.lift,
                'serif',
              ).opacity(fr)
            : txt(
                'Lower bound is −10 pp  ·  B could still lose passes',
                0,
                390,
                28,
                COSMOS.muted,
                'serif',
              ),
        ).opacity(holdVis),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'useful-threshold', threshP, 1, { dur: 0.65 });
  cueTo(s, c, 'development-range', rangeP, 1, { dur: 1.0 });
  cueTo(s, c, 'useful-question', questP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'useful-hold', holdP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'freeze-protocol', freezeP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 14. pass-at-k: A retry budget changes the question
// Cues: pool-show, subset-predict, subset-run, subset-enumerate,
//       subset-count, pass-three, return-one
// ---------------------------------------------------------------------------
export function passAtKScene(s, c) {
  const poolP = s.value(0);
  const predP = s.value(0);
  const runP = s.value(0);
  const enumP = s.value(0);
  const cntP = s.value(0);
  const p3P = s.value(0);
  const ret1P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelB, seed: 14 }));
  s.add(decorAura(0, 60, 560, '#6ee7b71c', '#5ce1e614'));

  const headline = heroTitle(['Multi-Attempt Budget', 'Unbiased pass@3'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.modelB,
    eyebrow: 'POOL n = 10  ·  2 PASSES  ·  BUDGET k = 3',
  });

  const live = dynamic(() => {
    const pl = poolP.value;
    const pd = predP.value;
    const rn = runP.value;
    const en = enumP.value;
    const cn = cntP.value;
    const p3 = p3P.value;
    const r1 = ret1P.value;

    const subCount = Math.min(
      120,
      Math.floor(en < 0.35 ? (en / 0.35) * 4 : 4 + ((en - 0.35) / 0.65) * 116),
    );
    const heroIds = [1, 4, 7];
    const scanIds = en > 0.05 ? candidateSubsets[Math.min(119, subCount)].ids : heroIds;

    const nodes = [];

    // Top row: 10 candidate orbs (C1..C10, C3 and C8 pass)
    for (let i = 0; i < 10; i++) {
      const cx = -720 + i * 160;
      const cy = -205;
      const isPass = passingCandidates.includes(i);
      const isPicked = scanIds.includes(i);
      const col = isPass ? ROLE.modelB : COSMOS.muted;
      nodes.push(
        circle(34, {
          fill: isPass ? '#0f2820' : '#10182b',
          stroke: isPicked ? ROLE.threshold : col,
          width: isPicked ? 3.4 : 2,
        })
          .at(cx, cy)
          .opacity(0.45 + 0.55 * pl)
          .glow(isPass ? 9 : isPicked ? 7 : 0, isPicked ? ROLE.threshold : col),
        txt(`C${i + 1}`, cx, cy, 26, isPass ? ROLE.modelB : COSMOS.ink, 'mono'),
      );
    }

    // Middle band: crossfade between the 3 hero slots (stable, no text flicker) and pass@3 formula
    const preFormula = fadeOut(p3);
    const postFormula = fadeIn(p3);

    if (preFormula > 0.02) {
      const slotNodes = [];
      heroIds.forEach((id, i) => {
        const cx = -320 + i * 320;
        const cy = -60;
        const isPass = passingCandidates.includes(id);
        const revealed = rn > 0.4;
        const col = revealed ? (isPass ? ROLE.modelB : ROLE.danger) : ROLE.threshold;
        slotNodes.push(
          rect(230, 82, {
            fill: revealed ? (isPass ? '#0f2820' : '#251220') : '#241d0f',
            stroke: col,
            width: 3,
            radius: 14,
          })
            .at(cx, cy)
            .glow(8, col),
          txt(
            `C${id + 1}: ${revealed ? (isPass ? 'pass' : 'fail') : '?'}`,
            cx,
            cy,
            30,
            col,
            'mono',
          ),
        );
      });
      slotNodes.push(
        txt(
          rn > 0.4
            ? 'Subset contains a passing candidate!'
            : pd > 0.2
              ? 'Will this 3-candidate subset contain a pass?'
              : 'Pick 3 distinct candidates without replacement',
          0,
          28,
          28,
          rn > 0.4 ? ROLE.modelB : ROLE.threshold,
          'serif',
        ),
      );
      nodes.push(group(...slotNodes).opacity(preFormula));
    }

    if (postFormula > 0.02) {
      nodes.push(
        group(
          glowTex(
            '\\widehat{\\mathrm{pass@3}} = 1 - \\frac{\\binom{8}{3}}{\\binom{10}{3}} = \\frac{64}{120} \\approx 53.3\\%',
            {
              x: 0,
              y: -70,
              size: 40,
              color: ROLE.modelB,
            },
          ),
          r1 > 0.05
            ? txt('Release comparison: 1 attempt each', 0, 56, 28, ROLE.modelA, 'mono').opacity(r1)
            : txt('Keep n = 10 and k = 3 explicit', 0, 56, 28, COSMOS.muted, 'sans'),
        ).opacity(postFormula),
      );
    }

    // Bottom lattice: all 120 distinct 3-subsets (30 columns x 4 rows)
    for (let i = 0; i < 120; i++) {
      const col = i % 30;
      const row = Math.floor(i / 30);
      const cx = -725 + col * 50;
      const cy = 122 + row * 34;
      const active = i < subCount;
      const passes = candidateSubsets[i].passes;
      const fill = !active ? '#0f1628' : passes ? ROLE.modelB : ROLE.danger;
      nodes.push(
        rect(36, 24, { fill, stroke: active ? null : '#223050', width: 1, radius: 4 })
          .at(cx, cy)
          .glow(active && passes ? 4 : 0, fill),
      );
    }

    nodes.push(txt(`${subCount} / 120 equally likely subsets`, 0, 295, 30, ROLE.lift, 'mono'));
    if (cn > 0.05) {
      nodes.push(
        txt('64 with a pass   ·   56 all failing', 0, 355, 34, ROLE.threshold, 'mono')
          .glow(8, ROLE.threshold)
          .opacity(cn),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'pool-show', poolP, 1, { dur: 0.7 });
  cueTo(s, c, 'subset-predict', predP, 1, { dur: 0.6 });
  cueTo(s, c, 'subset-run', runP, 1, { dur: 0.6 });
  cueTo(s, c, 'subset-enumerate', enumP, 1, { dur: 1.6 });
  cueTo(s, c, 'subset-count', cntP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'pass-three', p3P, 1, { dur: 0.75 });
  cueTo(s, c, 'return-one', ret1P, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 15. passk-target: Which attempt gets the credit?
// Cues: passk-target-0, hyp-target-first, target-open-three, hyp-target-any*,
//       target-unordered-view*, hyp-target-unordered*, passk-target-1,
//       hyp-target-curve, passk-target-2
// ---------------------------------------------------------------------------
export function passkTarget(s, c) {
  const c0P = s.value(0);
  const firstP = s.value(0);
  const openP = s.value(0);
  const anyP = s.value(0);
  const unordP = s.value(0);
  const unordResP = s.value(0);
  const v1P = s.value(0);
  const c1P = s.value(0);
  const curveP = s.value(0);
  const v2P = s.value(0);
  const c2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 15 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#6ee7b712'));

  const headline = heroTitle(['Same Nine Answers,', 'Three Different Targets'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'PASS@1  ·  ANY-OF-3  ·  TARGET 1 − (1 − p)^k',
  });

  // View 0 (Beat 0): 3 tasks x 3 attempts (1/3 -> 2/3 -> unordered 2/9)
  const view0 = guardedDynamic(
    () => fadeOut(v1P.value),
    (vis) => {
      const f1 = firstP.value;
      const op = openP.value;
      const an = anyP.value;
      const un = unordP.value;
      const ur = unordResP.value;

      const grid = [
        [1, 0, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];
      const names = ['Timestamp', 'Retry state', 'Quota rounding'];
      const colPrefix = un > 0.5 ? 'Position' : 'Attempt';
      const nodes = [];

      for (let j = 0; j < 3; j++) {
        nodes.push(txt(`${colPrefix} ${j + 1}`, -240 + j * 270, -210, 28, COSMOS.muted, 'mono'));
      }
      if (un > 0.5) {
        nodes.push(txt('PASS SHARE', 610, -210, 28, ROLE.lift, 'mono'));
      }

      grid.forEach((row, i) => {
        const y = -110 + i * 130;
        nodes.push(txt(names[i], -780, y, 30, COSMOS.ink, 'sans', 'left'));
        row.forEach((val, j) => {
          const cx = -240 + j * 270;
          const visible = j === 0 || op > 0.4;
          const col = !visible ? '#324268' : val ? ROLE.modelB : COSMOS.muted;
          nodes.push(
            rect(196, 82, {
              fill: !visible ? '#0d1426' : val ? '#0f2820' : '#111a2e',
              stroke: col,
              width: visible && val ? 3 : 1.8,
              radius: 12,
            })
              .at(cx, y)
              .glow(visible && val ? 9 : 0, col),
            txt(visible ? (val ? 'pass' : 'fail') : '·', cx, y, 30, col, 'mono'),
          );
        });
        if (un > 0.5) {
          const sSum = row.reduce((a, b) => a + b, 0);
          nodes.push(txt(`${sSum} / 3`, 610, y, 34, ROLE.lift, 'mono'));
        }
      });

      // Bottom readout with non-overlapping crossfades
      const p1 = fadeIn(f1) * fadeOut(op);
      const p2 = fadeIn(an) * fadeOut(un);
      const p3 = fadeIn(ur);

      if (p1 > 0.02) {
        nodes.push(
          txt(
            'First attempt only:  1 of 3 tasks solved (33.3%)',
            0,
            320,
            36,
            ROLE.modelA,
            'mono',
          ).opacity(p1),
        );
      }
      if (p2 > 0.02) {
        nodes.push(
          txt('Any of 3 tries:  2 / 3 solved', 0, 320, 36, ROLE.modelB, 'mono')
            .glow(8, ROLE.modelB)
            .opacity(p2),
        );
      }
      if (p3 > 0.02) {
        nodes.push(
          glowTex(
            '\\text{Unordered macro pass@1} = \\frac{\\frac{1}{3} + \\frac{1}{3} + 0}{3} = \\frac{2}{9}',
            {
              x: 0,
              y: 325,
              size: 42,
              color: ROLE.lift,
            },
          ).opacity(p3),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Target curve P(any pass) = 1 - (1 - p)^k
  const view1 = guardedDynamic(
    () => fadeIn(v1P.value) * fadeOut(v2P.value),
    (vis) => {
      const cv = smooth(curveP.value);
      const ax = makeAxes({
        x0: -680,
        y0: -165,
        w: 1360,
        h: 370,
        xDom: [0, 1],
        yDom: [0, 1],
        xTicks: [0, 0.25, 0.5, 0.75, 1],
        yTicks: [0, 0.5, 1],
        xLabel: 'Unknown per-attempt success probability p',
        yLabel: 'Target  P(any pass in k tries)',
      });

      const endP = Math.max(0.03, cv);
      const k1Pts = sampleCurve(ax, (p) => p, 0, 1, 40);
      const k3Pts = sampleCurve(ax, (p) => 1 - (1 - p) ** 3, 0, endP, 70);
      const k5Pts = sampleCurve(ax, (p) => 1 - (1 - p) ** 5, 0, 1, 50);

      const nodes = [
        ax.node,
        glowTex('P(\\text{any pass}) = 1 - (1 - p)^k', {
          x: 240,
          y: -240,
          size: 46,
          color: ROLE.lift,
        }),
        // Faint reference k = 1 diagonal and k = 5 upper curve
        markDecor(new Node(polyPath(k1Pts)).stroke('#4a5f8e', 2.2, 0.55)),
        markDecor(new Node(polyPath(k5Pts)).stroke(ROLE.modelB, 2.2, 0.32)),
        // Hero glowing k = 3 curve
        neonCurve(k3Pts, [ROLE.modelA, ROLE.lift, ROLE.modelB], { width: 5, glow: 12 }),
        glowDot(k3Pts.at(-1)[0], k3Pts.at(-1)[1], { radius: 9, color: ROLE.threshold, glow: 14 }),
        txt('k = 3', ax.px(0.38), ax.py(1 - 0.62 ** 3) - 36, 28, ROLE.lift, 'mono'),
        txt('k = 1', ax.px(0.75), ax.py(0.75) + 36, 26, COSMOS.dim, 'mono'),
        txt(
          'Any pre-chosen subset of k distinct positions has this exact success probability',
          0,
          345,
          30,
          ROLE.threshold,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Overlapping triples reuse C2 and C3 (shared randomness)
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value),
    (vis) => {
      const nodes = [
        txt(
          'OVERLAPPING SUBSETS SHARE CANDIDATES  (NO NEW INDEPENDENT DRAWS)',
          0,
          -225,
          26,
          ROLE.threshold,
          'mono',
        ),
      ];

      for (let i = 0; i < 10; i++) {
        const cx = -720 + i * 160;
        const cy = -135;
        const isShared = i === 1 || i === 2;
        const isPass = passingCandidates.includes(i);
        const col = isShared ? ROLE.threshold : isPass ? ROLE.modelB : ROLE.modelA;
        nodes.push(
          circle(34, { fill: '#10182b', stroke: col, width: isShared ? 3.2 : 2 })
            .at(cx, cy)
            .glow(isShared ? 10 : 4, col),
          txt(`C${i + 1}`, cx, cy, 26, col, 'mono'),
        );
      }

      const sets = [
        { label: 'Triple 1', ids: [0, 1, 2], y: 45 },
        { label: 'Triple 2', ids: [1, 2, 3], y: 185 },
      ];
      sets.forEach((set) => {
        nodes.push(txt(set.label, -640, set.y, 28, COSMOS.muted, 'mono', 'left'));
        set.ids.forEach((id, k) => {
          const cx = -240 + k * 280;
          const isShared = id === 1 || id === 2;
          const col = isShared ? ROLE.threshold : ROLE.modelA;
          nodes.push(
            rect(210, 76, {
              fill: isShared ? '#29200e' : '#101a30',
              stroke: col,
              width: isShared ? 3 : 2,
              radius: 12,
            })
              .at(cx, set.y)
              .glow(isShared ? 9 : 0, col),
            txt(`C${id + 1}`, cx, set.y, 30, col, 'mono'),
          );
        });
      });

      nodes.push(
        txt(
          'C2 and C3 appear in both triples  ·  shared randomness',
          0,
          300,
          32,
          ROLE.threshold,
          'mono',
        ),
        txt(
          'HumanEval: 164 Python problems · pool n = 200 · budgets k up to 100',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  cueTo(s, c, 'passk-target-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-target-first', firstP, 1, { dur: 0.55 });
  cueTo(s, c, 'target-open-three', openP, 1, { dur: 0.65 });
  cueTo(s, c, 'hyp-target-any', anyP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'target-unordered-view', unordP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'hyp-target-unordered', unordResP, 1, { after: true, dur: 0.6 });
  beatTo(s, c, 1, v1P, 1, { dur: 0.72 });
  cueTo(s, c, 'passk-target-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-target-curve', curveP, 1, { dur: 1.2 });
  beatTo(s, c, 2, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'passk-target-2', c2P, 1, { dur: 0.6 });
}
