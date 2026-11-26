// Act 4: Batch Conditioning & Elliptical Contours, Six-Weight Reverse-Mode AD,
// Vector-Jacobian Products & Backward Seeds, and Centered Float32 vs Float64 Gradient Check.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  BATCH_FEATURES,
  BATCH_HISTORY,
  COSMOS,
  PRECISION_SINGLE,
  aura,
  batchGradientState,
  cinemaGrid,
  compNode,
  cueTo,
  derivativeLoss,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  latencyExample,
  livingDrift,
  makePlot2d,
  markDecor,
  photonWire,
  polyPath,
  pulseCue,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 16. batch-conditioning: Which change do the four requests notice?
// Cues: batch-conditioning-b1, batch-conditioning-b2, batch-column-sum,
//       batch-average, batch-queue-average, batch-first-step*,
//       batch-conditioning-b3, batch-first-ten, batch-next-ninety, batch-history,
//       batch-last-update, batch-conditioning-b4, batch-prompt-offset*,
//       batch-queue-minus*, batch-queue-plus*
// ---------------------------------------------------------------------------
export function batchConditioning(s, c) {
  const mode = s.value(0); // 0=table, 1=log10 MSE history, 2=conditioning ellipse + signed errors
  const hiLast = s.value(0);
  const showLastGrad = s.value(0);
  const showPromptAvg = s.value(0);
  const showQueueAvg = s.value(0);
  const showStep1 = s.value(0);
  const histStep = s.value(0); // 0 -> 10 -> 100 -> 101
  const histPulse = s.value(0);
  const condPrompt = s.value(0); // 0 -> 0.1
  const condQueue = s.value(0); // 0 -> -0.25 -> +0.25
  const condFlipped = s.value(0); // 0 -> 1 on beat 5
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.42, seed: 113 }));
  s.add(aura(-420, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(440, 20, 460, '#ff6b8b1e', '#18142a10'));

  const base = batchGradientState([0, 0]);

  // Phase 0 (beats 0-1): 4-request table + mean gradient + first step
  const tableView = guardedDynamic(
    () => fadeOut(Math.min(1, mode.value)),
    (vis) => {
      const hl = hiLast.value;
      const lg = showLastGrad.value > 0.3;
      const pa = showPromptAvg.value > 0.3;
      const qa = showQueueAvg.value > 0.3;
      const s1 = showStep1.value > 0.3;

      const nodes = [
        txt(
          'FULL-BATCH GRADIENT  (4 PAIRED REQUESTS)',
          -820,
          -400,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt('Request', -770, -315, 28, COSMOS.muted, 'mono', 'left'),
        txt('[prompt, queue]', -360, -315, 28, COSMOS.blue, 'mono'),
        txt('target y', 20, -315, 28, COSMOS.emerald, 'mono'),
        txt('per-row gradient  2e · x', 480, -315, 28, COSMOS.rose, 'mono'),
        line([-800, -280], [800, -280], { stroke: '#2c3d66', width: 2 }),
      ];

      base.rows.forEach((r, idx) => {
        const y = -205 + idx * 112;
        const isLast = idx === 3;
        const showG = (isLast && lg) || (!isLast && pa);
        if (isLast && hl > 0.2) {
          nodes.push(
            glassPlate(0, y, 1620, 88, {
              stroke: COSMOS.cyan,
              fill: '#13244299',
              glow: 10,
            }).opacity(hl),
          );
        }
        nodes.push(
          txt(r.id, -770, y, 32, isLast && hl > 0.2 ? COSMOS.cyan : COSMOS.ink, 'mono', 'left'),
          txt(`[${r.features.join(', ')}]`, -360, y, 32, COSMOS.blue, 'mono'),
          txt(`${r.target} s`, 20, y, 32, COSMOS.emerald, 'mono'),
          txt(
            showG ? `[${fmt(r.gradient[0], 0)}, ${fmt(r.gradient[1], 0)}]` : '?',
            480,
            y,
            34,
            showG ? COSMOS.rose : COSMOS.dim,
            'mono',
          ).glow(showG ? 6 : 0, COSMOS.rose),
        );
      });

      // Bottom summary readout
      nodes.push(line([-800, 200], [800, 200], { stroke: '#2c3d66', width: 2 }));
      if (!lg && !pa) {
        nodes.push(
          txt(`At w = (0, 0):  MSE = ${base.loss} s²`, 0, 285, 40, COSMOS.gold, 'mono').glow(
            10,
            COSMOS.gold,
          ),
          txt('Every target obeys y = 2·prompt + queue', 0, 358, 28, COSMOS.muted, 'sans'),
        );
      } else if (!pa) {
        nodes.push(
          txt('Last row:  2 × (−10) × 4 = −80', 0, 285, 40, COSMOS.rose, 'mono').glow(
            10,
            COSMOS.rose,
          ),
          txt('Matrix form:  (2 / N) · Xᵀ e', 0, 358, 28, COSMOS.muted, 'mono'),
        );
      } else if (!s1) {
        nodes.push(
          txt(
            `Mean gradient  ḡ = (−36, ${qa ? '−14.75' : '?'})`,
            0,
            285,
            42,
            COSMOS.gold,
            'mono',
          ).glow(10, COSMOS.gold),
          txt('Matrix form:  (2 / 4) · Xᵀ (Xw − y)', 0, 358, 28, COSMOS.cyan, 'mono'),
        );
      } else {
        nodes.push(
          txt(
            'ḡ = (−36, −14.75)   →   η = 0.03   →   w₁ = (1.08, 0.4425)',
            0,
            285,
            38,
            COSMOS.emerald,
            'mono',
          ).glow(10, COSMOS.emerald),
          txt('First batch update applied from w = (0, 0)', 0, 358, 28, COSMOS.muted, 'sans'),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Phase 1 (beat 2): log10 MSE training history curve 0..101 + live telemetry column
  const histPlot = makePlot2d({
    left: -760,
    right: 260,
    top: -275,
    bottom: 240,
    xDomain: [0, 101],
    yDomain: [-4, 2],
    xTicks: [0, 10, 50, 100],
    yTicks: [-4, -3, -2, -1, 0, 1, 2],
    xLabel: 'completed update count',
    yLabel: 'log₁₀(MSE)',
  });

  const histView = guardedDynamic(
    () => {
      const m = mode.value;
      if (m <= 0.5) return 0;
      if (m < 1.5) return fadeIn(m);
      return fadeOut(m - 1);
    },
    (vis) => {
      const stepIdx = Math.max(0, Math.min(101, Math.round(histStep.value)));
      const st = BATCH_HISTORY[stepIdx];
      const pts = BATCH_HISTORY.slice(0, stepIdx + 1).map((entry) => [
        histPlot.X(entry.step),
        histPlot.Y(Math.log10(entry.loss)),
      ]);
      const curPt = pts[pts.length - 1];
      const rx = 580;

      const nodes = [
        txt('TRAINING CURVE  (η = 0.03)', -760, -372, 26, COSMOS.cyan, 'mono', 'left'),
        histPlot.axes,
        pts.length >= 2
          ? new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.8, 0.95).glow(10, COSMOS.cyan)
          : group(),
        dot(10, COSMOS.gold).at(curPt[0], curPt[1]).glow(14, COSMOS.gold),
        // Right live telemetry plate (eliminates empty right half while curve starts at step 0..10)
        glassPlate(rx, -10, 510, 540, { stroke: COSMOS.cyan, glow: 7 }),
        txt('LIVE TRAINING STATE', rx, -225, 26, COSMOS.cyan, 'mono'),
        txt(`Step ${stepIdx} / 101`, rx, -148, 46, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
        line([rx - 205, -90], [rx + 205, -90], { stroke: '#2c3d66', width: 1.6 }),
        txt('MEAN SQUARED LOSS', rx, -36, 26, COSMOS.muted, 'mono'),
        txt(st.loss.toFixed(6), rx, 24, 42, COSMOS.cyan, 'mono').glow(8, COSMOS.cyan),
        line([rx - 205, 82], [rx + 205, 82], { stroke: '#2c3d66', width: 1.6 }),
        txt('WEIGHTS  (target 2, 1)', rx, 136, 26, COSMOS.muted, 'mono'),
        txt(
          `(${st.weights[0].toFixed(4)}, ${st.weights[1].toFixed(4)})`,
          rx,
          198,
          34,
          COSMOS.emerald,
          'mono',
        ).glow(6, COSMOS.emerald),
      ];

      if (stepIdx >= 10) {
        const p10 = [histPlot.X(10), histPlot.Y(Math.log10(BATCH_HISTORY[10].loss))];
        nodes.push(
          dot(8.5, COSMOS.emerald).at(p10[0], p10[1]).glow(10, COSMOS.emerald),
          txt('10 steps: 0.003643', p10[0] + 24, p10[1] - 34, 26, COSMOS.emerald, 'mono', 'left'),
        );
      }
      if (stepIdx >= 100) {
        const p100 = [histPlot.X(100), histPlot.Y(Math.log10(BATCH_HISTORY[100].loss))];
        nodes.push(
          dot(8.5, COSMOS.rose).at(p100[0], p100[1]).glow(10, COSMOS.rose),
          txt('100 steps: 0.000709', p100[0] - 24, p100[1] - 62, 26, COSMOS.rose, 'mono', 'right'),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Phase 2 (beats 3-5): Conditioning ellipses + 4 signed request errors
  const condView = guardedDynamic(
    () => fadeIn(Math.max(0, mode.value - 1)),
    (vis) => {
      const dp = condPrompt.value; // +0.1
      const dq = condQueue.value; // 0 -> -0.25 -> +0.25
      const flipped = condFlipped.value > 0.3;
      const batch = batchGradientState([2 + dp, 1 + dq]);
      const prior = batchGradientState([2.1, 0.75]);

      const cx = -450;
      const cy = 20;
      const scale = 880;
      const X = (off) => cx + off * scale;
      const Y = (off) => cy - off * scale;
      const activeCol = flipped ? COSMOS.rose : COSMOS.cyan;

      const nodes = [
        txt('CONDITIONING: NARROW VALLEY VS STEEP WALL', -820, -395, 26, activeCol, 'mono', 'left'),
      ];

      // Exact elliptical batch loss contours around (2, 1)
      const contourLevels = [0.011, 0.05, 0.15, 0.31];
      for (const lv of contourLevels) {
        const pts = [];
        for (let i = 0; i <= 120; i++) {
          const ang = (2 * Math.PI * i) / 120;
          const a = Math.cos(ang);
          const b = Math.sin(ang);
          const mean =
            BATCH_FEATURES.reduce((sum, [p, q]) => sum + (p * a + q * b) ** 2, 0) /
            BATCH_FEATURES.length;
          const rad = Math.min(0.32, Math.sqrt(lv / mean));
          pts.push([X(rad * a), Y(rad * b)]);
        }
        nodes.push(new Node(polyPath(pts)).stroke('#546ca1', 2.2, 0.72));
      }

      // Crosshair axes centered on optimum (2, 1)
      nodes.push(
        line([X(-0.32), Y(0)], [X(0.32), Y(0)], { stroke: '#4a5f8c', width: 2 }),
        line([X(0), Y(-0.32)], [X(0), Y(0.32)], { stroke: '#4a5f8c', width: 2 }),
        txt('Δw_p', X(0.34), Y(0), 26, COSMOS.muted, 'mono', 'left'),
        txt('Δw_q', X(0), Y(0.365), 26, COSMOS.muted, 'mono'),
      );

      // Keep previous shallow valley offset visible when flipped to steep wall!
      if (flipped) {
        nodes.push(
          line([X(0), Y(0)], [X(0.1), Y(-0.25)], { stroke: COSMOS.cyan, width: 3.5, dash: [7, 6] }),
          circle(10, { fill: COSMOS.bg, stroke: COSMOS.cyan, width: 3 }).at(X(0.1), Y(-0.25)),
        );
      }

      // Active offset arrow
      if (Math.hypot(dp, dq) > 0.005) {
        nodes.push(
          arrow([X(0), Y(0)], [X(dp), Y(dq)], { stroke: activeCol, width: 5.2, tip: 14 }).glow(
            12,
            activeCol,
          ),
          dot(10, activeCol).at(X(dp), Y(dq)).glow(14, activeCol),
        );
      }
      nodes.push(dot(9, COSMOS.gold).at(X(0), Y(0)).glow(12, COSMOS.gold));

      // Right side: 4 signed prediction error bars on common scale
      const originX = 330;
      const errScale = 325;
      nodes.push(
        txt(
          `Weights = (${fmt(batch.weights[0], 2)}, ${fmt(batch.weights[1], 2)})`,
          420,
          -318,
          34,
          COSMOS.gold,
          'mono',
        ).glow(8, COSMOS.gold),
        txt('Signed prediction error per request (s)', 440, -252, 26, COSMOS.muted, 'sans'),
        line([originX, -195], [originX, 175], { stroke: COSMOS.emerald, width: 3 }).glow(
          6,
          COSMOS.emerald,
        ),
        txt('0', originX, 205, 26, COSMOS.emerald, 'mono'),
      );

      batch.rows.forEach((row, idx) => {
        const y = -150 + idx * 95;
        const tipX = originX + row.error * errScale;
        const rowCol = idx === 2 ? COSMOS.ink : COSMOS.muted;
        nodes.push(
          txt(`${row.id} [${row.features.join(', ')}]`, 35, y, 26, rowCol, 'mono', 'left'),
          line([originX - 85, y], [originX + 320, y], { stroke: '#2c3d66', width: 2 }),
          line([originX, y], [tipX, y], { stroke: activeCol, width: 7 }).glow(8, activeCol),
          dot(8, activeCol).at(tipX, y).glow(10, activeCol),
          txt(`${fmt(row.error, 3)} s`, 865, y, 28, activeCol, 'mono', 'right'),
        );
      });

      if (flipped) {
        nodes.push(
          txt(
            `Shallow offset MSE: ${fmt(prior.loss, 5)}   vs   Steep offset MSE: ${fmt(batch.loss, 5)}`,
            420,
            296,
            28,
            COSMOS.rose,
            'mono',
          ).glow(8, COSMOS.rose),
          txt('Same step length, far more contours crossed!', 420, 354, 28, COSMOS.ink, 'sans'),
        );
      } else {
        nodes.push(
          txt(`Current MSE = ${fmt(batch.loss, 5)} s²`, 420, 310, 34, activeCol, 'mono').glow(
            8,
            activeCol,
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(tableView, histView, condView);
  livingDrift(s, c, drift, 1);

  // Beat 0 & 1: batch table & mean gradient
  cueTo(s, c, 'batch-conditioning-b1', hiLast, 1, { dur: 0.45 });
  pulseCue(s, c, 'batch-conditioning-b2', hiLast, 1, { dur: 0.35 });
  cueTo(s, c, 'batch-column-sum', showLastGrad, 1, { dur: 0.45 });
  cueTo(s, c, 'batch-average', showPromptAvg, 1, { dur: 0.45 });
  cueTo(s, c, 'batch-queue-average', showQueueAvg, 1, { dur: 0.45 });
  cueTo(s, c, 'batch-first-step', showStep1, 1, { after: true, dur: 0.35 });

  // Beat 2: log10 MSE history curve
  cueTo(s, c, 'batch-conditioning-b3', mode, 1, { dur: 0.55 });
  cueTo(s, c, 'batch-first-ten', histStep, 10, { dur: 0.8 });
  cueTo(s, c, 'batch-next-ninety', histStep, 100, { dur: 1.0 });
  pulseCue(s, c, 'batch-history', histPulse, 1, { dur: 0.4 });
  cueTo(s, c, 'batch-last-update', histStep, 101, { dur: 0.4 });

  // Beats 3-5: conditioning ellipses & signed errors (caption_boundary cues!)
  cueTo(s, c, 'batch-conditioning-b4', mode, 2, { dur: 0.55 });
  cueTo(s, c, 'batch-prompt-offset', condPrompt, 0.1, { dur: 0.7 });
  cueTo(s, c, 'batch-queue-minus', condQueue, -0.25, { dur: 0.75 });
  cueTo(s, c, 'batch-queue-plus', condQueue, 0.25, { dur: 0.85 });
  c.on('batch-queue-plus', () => s.play(condFlipped.to(1, { duration: 0.35 })));
}

// ---------------------------------------------------------------------------
// 17. reverse-mode: One loss and six weights
// Cues: reverse-sums, reverse-total, scalar-loss-b1-1,
//       retained-value-0-b2-1, reverse-square, reverse-leaves,
//       retained-value-0-b3-1, finite-forward-runs-b1-2
// ---------------------------------------------------------------------------
export function reverseMode(s, c) {
  const fwdStage = s.value(0); // 1=sums(3,3), 2=total(6), 3=loss(36)
  const backStage = s.value(0); // 1=saved(6), 2=2*6=12, 3=all 6 leaves get 12
  const compareMode = s.value(0); // 0=wide tree, 1=tree + 6 nudge bars on right
  const nudgeProgress = s.value(0); // 0 -> 6 forward runs
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.rose, opacity: 0.44, seed: 127 }));
  s.add(aura(-280, 0, 500, '#2a588a22', '#151e3d10'));
  s.add(aura(480, 0, 460, '#ffd1661c', '#18142a10'));

  const liveScene = dynamic(() => {
    const fs = fwdStage.value;
    const bs = backStage.value;
    const cm = compareMode.value;
    const np = nudgeProgress.value;
    const dr = drift.value;

    const shiftX = -110 * cm;
    const wX = -560 + shiftX;
    const sumX = -240 + shiftX;
    const totX = 55 + shiftX;
    const lossX = 335 + shiftX;

    const wNodes = Array.from({ length: 6 }, (_, i) => ({
      x: wX,
      y: -265 + i * 106,
      label: `w${i + 1}`,
    }));
    const sumNodes = [
      { x: sumX, y: -159, label: 'top sum' },
      { x: sumX, y: 159, label: 'bot sum' },
    ];
    const totNode = { x: totX, y: 0, label: 'saved total' };
    const lossNode = { x: lossX, y: 0, label: 'loss (·)²' };

    const nodes = [
      txt('ONE SCALAR LOSS, SIX WEIGHTS', -820, -412, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Forward/reverse edges
    const drawEdge = (a, b, fwdOn, backOn, seedOff) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const x1 = a.x + (dx / len) * 44;
      const y1 = a.y + (dy / len) * 44;
      const x2 = b.x - (dx / len) * 44;
      const y2 = b.y - (dy / len) * 44;
      if (backOn) {
        nodes.push(
          photonWire(
            [
              [x2, y2],
              [x1, y1],
            ],
            dr * 2.6 + seedOff,
            { color: COSMOS.rose, width: 3.6, glow: 9 },
          ),
        );
      } else if (fwdOn) {
        nodes.push(
          photonWire(
            [
              [x1, y1],
              [x2, y2],
            ],
            dr * 2.2 + seedOff,
            { color: COSMOS.cyan, width: 3.2, glow: 7 },
          ),
        );
      } else {
        nodes.push(line([x1, y1], [x2, y2], { stroke: '#2c3d66', width: 2 }));
      }
    };

    wNodes.forEach((wn, i) => {
      const grp = Math.floor(i / 3);
      drawEdge(wn, sumNodes[grp], fs >= 0.8, bs >= 2.8, i * 0.13);
      nodes.push(
        compNode(wn.x, wn.y, {
          radius: 34,
          value: '1',
          color: bs >= 2.8 ? COSMOS.emerald : COSMOS.blue,
          valueSize: 26,
        }),
        txt(wn.label, wn.x - 58, wn.y, 26, COSMOS.muted, 'mono', 'right'),
      );
      if (bs >= 2.8) {
        nodes.push(
          txt('12', wn.x - 122, wn.y, 28, COSMOS.rose, 'mono', 'right').glow(8, COSMOS.rose),
        );
      }
    });

    sumNodes.forEach((sn, i) => {
      drawEdge(sn, totNode, fs >= 1.8, bs >= 2.6, 0.4 + i * 0.2);
      nodes.push(
        compNode(sn.x, sn.y, {
          radius: 44,
          label: sn.label,
          value: fs >= 0.8 ? '3' : '?',
          color: COSMOS.cyan,
          active: fs >= 0.8,
          labelYOffset: -76,
          valueSize: 30,
        }),
      );
      if (bs >= 2.6) {
        nodes.push(txt('∂ = 12', sn.x, sn.y + 72, 26, COSMOS.rose, 'mono'));
      }
    });

    drawEdge(totNode, lossNode, fs >= 2.8, bs >= 1.8, 0.8);
    nodes.push(
      compNode(totNode.x, totNode.y, {
        radius: 52,
        label: 'saved total',
        value: fs >= 1.8 ? '6' : '?',
        color: bs >= 0.8 ? COSMOS.gold : COSMOS.cyan,
        active: fs >= 1.8,
        glow: bs >= 0.8 ? 16 : 9,
        labelYOffset: -78,
        valueSize: 34,
      }),
      compNode(lossNode.x, lossNode.y, {
        radius: 56,
        label: 'loss L',
        value: fs >= 2.8 ? '36' : '?',
        color: COSMOS.emerald,
        active: fs >= 2.8,
        labelYOffset: -82,
        valueSize: 34,
      }),
    );

    if (bs >= 1.8) {
      nodes.push(
        txt('2 × 6 = 12', (totX + lossX) / 2, -120, 34, COSMOS.rose, 'mono').glow(10, COSMOS.rose),
      );
    } else if (fs >= 2.8 && bs < 0.5) {
      nodes.push(
        txt(
          'Which forward value does the square need on the way back?',
          0,
          388,
          30,
          COSMOS.gold,
          'serif',
        ).glow(8, COSMOS.gold),
      );
    }

    // Right comparison panel in beat 2: 6 finite-difference forward passes vs 1 reverse sweep!
    if (cm > 0.15) {
      const rx = 625;
      const doneCount = Math.min(6, Math.floor(np * 6 + 1e-4));
      nodes.push(
        glassPlate(rx, 0, 470, 620, { stroke: COSMOS.gold, glow: 6 }).opacity(cm),
        txt('ONE-SIDED NUDGES', rx, -258, 26, COSMOS.gold, 'mono').opacity(cm),
      );
      for (let i = 0; i < 6; i++) {
        const y = -182 + i * 74;
        const barP = Math.max(0, Math.min(1, np * 6 - i));
        const barW = 280;
        nodes.push(
          txt(`w${i + 1}`, rx - 185, y, 26, COSMOS.muted, 'mono').opacity(cm),
          rect(barW, 18, { fill: '#152038', stroke: '#2c3d66', width: 1.5, radius: 9 })
            .at(rx + 20, y)
            .opacity(cm),
        );
        if (barP > 0.02) {
          const fw = Math.max(12, barW * barP);
          nodes.push(
            rect(fw, 18, { fill: COSMOS.gold, stroke: null, radius: 9 })
              .at(rx + 20 - barW / 2 + fw / 2, y)
              .glow(8, COSMOS.gold)
              .opacity(cm),
          );
        }
      }
      nodes.push(
        txt(`${doneCount} / 6 extra forward runs`, rx, 264, 30, COSMOS.gold, 'mono').opacity(cm),
        txt('1 reverse sweep → all 6 gradients', -220, 388, 32, COSMOS.rose, 'mono')
          .glow(8, COSMOS.rose)
          .opacity(cm),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  // Beat 0: forward build (withhold which value is saved until beat 1!)
  cueTo(s, c, 'reverse-sums', fwdStage, 1.0, { dur: 0.7 });
  cueTo(s, c, 'reverse-total', fwdStage, 2.0, { dur: 0.6 });
  cueTo(s, c, 'scalar-loss-b1-1', fwdStage, 3.0, { dur: 0.5 });

  // Beat 1: saved 6 -> 2*6=12 -> split to all 6 leaves
  cueTo(s, c, 'retained-value-0-b2-1', backStage, 1.0, { dur: 0.4 });
  cueTo(s, c, 'reverse-square', backStage, 2.0, { dur: 0.5 });
  cueTo(s, c, 'reverse-leaves', backStage, 3.0, { dur: 0.85 });

  // Beat 2: 6 finite forward runs vs 1 reverse sweep
  cueTo(s, c, 'retained-value-0-b3-1', compareMode, 1, { dur: 0.5 });
  cueTo(s, c, 'finite-forward-runs-b1-2', nudgeProgress, 1, { dur: 1.5 });
}

// ---------------------------------------------------------------------------
// 18. vector-seed: Choose the output combination before differentiating
// Cues: vector-seed-b1, vector-seed-b2, seed-accumulate, vector-seed-b3, seed-sum
// ---------------------------------------------------------------------------
export function vectorSeed(s, c) {
  const mode = s.value(0); // 0=two request bars, 1=VJP geometry & Jacobian
  const accumP = s.value(0); // 0 -> 1 reveals difference vector [2, 0]
  const sumMode = s.value(0); // 0=[-1, +1] diff, 1=[+1, +1] sum [4, 1]
  const jtvVis = s.value(0);
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 131 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(440, 0, 460, '#ffd1661f', '#18142a10'));

  const rows = [BATCH_FEATURES[0], BATCH_FEATURES[2]]; // [1, 0.5] and [3, 0.5]
  const weights = [1.3, 1.1];
  const preds = rows.map((f) => latencyExample(weights, f, 0).prediction); // 1.85 and 4.45

  // Beat 0: visual bar comparison of Request 1 vs Request 2
  const barsView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const leftX = -520;
      const scale = 225;
      const qW = scale * 0.5 * weights[1];
      const bW = scale * weights[0];
      const nodes = [
        txt('TWO OUTPUT PREDICTIONS, SHARED WEIGHTS', -800, -375, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Both requests waited 0.5 s in the queue', -800, -315, 38, COSMOS.ink, 'serif', 'left'),
      ];
      rows.forEach(([blocks], idx) => {
        const y = -110 + idx * 210;
        nodes.push(
          txt(`Request ${idx + 1}`, -800, y, 34, COSMOS.ink, 'sans', 'left'),
          rect(qW, 96, { fill: '#ffd16632', stroke: COSMOS.gold, width: 3, radius: 8 })
            .at(leftX + qW / 2, y)
            .glow(8, COSMOS.gold),
          txt('queue', leftX + qW / 2, y, 26, COSMOS.gold, 'mono'),
        );
        for (let b = 0; b < blocks; b++) {
          const bx = leftX + qW + b * bW + bW / 2 + 4;
          nodes.push(
            rect(bW - 8, 96, { fill: '#13314db8', stroke: COSMOS.cyan, width: 3, radius: 8 })
              .at(bx, y)
              .glow(8, COSMOS.cyan),
            txt('100 tok', bx, y, 28, COSMOS.ink, 'sans'),
          );
        }
        nodes.push(
          txt(
            `${fmt(preds[idx], 2)} s`,
            leftX + preds[idx] * scale + 28,
            y,
            38,
            COSMOS.cyan,
            'mono',
            'left',
          ).glow(8, COSMOS.cyan),
        );
      });
      nodes.push(
        txt('w = (1.3 s/block, 1.1 × queue)', 0, 255, 32, COSMOS.muted, 'mono'),
        txt(
          'Subtract prediction 1 from prediction 2: what happens to the queue term?',
          0,
          340,
          30,
          COSMOS.gold,
          'serif',
        ).glow(8 + 4 * introPulse.value, COSMOS.gold),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beats 1-2: VJP 2D sensitivity vector accumulation + J^T v formula
  const vjpPlot = makePlot2d({
    left: -760,
    right: 60,
    top: -260,
    bottom: 245,
    xDomain: [-1.5, 4.5],
    yDomain: [-1.2, 1.4],
    xTicks: [-1, 0, 1, 2, 3, 4],
    yTicks: [-1, 0, 1],
    xLabel: 'prompt sensitivity (∂/∂w_p)',
    yLabel: 'queue sensitivity (∂/∂w_q)',
    showZeroX: true,
    showZeroY: true,
  });

  const eqVjp = glowTex(String.raw`\nabla_w (v^\top \hat y) = J^\top v`, {
    x: 495,
    y: -315,
    size: 42,
    color: COSMOS.gold,
    glow: 8,
  });

  const vjpView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const ap = accumP.value;
      const sm = sumMode.value > 0.5;
      const seed = sm ? [1, 1] : [-1, 1];
      const v1 = [seed[0] * rows[0][0], seed[0] * rows[0][1]]; // [-1, -0.5] or [1, 0.5]
      const v2 = [seed[1] * rows[1][0], seed[1] * rows[1][1]]; // [3, 0.5]
      const total = [v1[0] + v2[0], v1[1] + v2[1]]; // [2, 0] or [4, 1]

      const ox = vjpPlot.X(0);
      const oy = vjpPlot.Y(0);
      const p1x = vjpPlot.X(v1[0]);
      const p1y = vjpPlot.Y(v1[1]);
      const tipX = vjpPlot.X(v1[0] + v2[0] * ap);
      const tipY = vjpPlot.Y(v1[1] + v2[1] * ap);

      const nodes = [
        txt(
          sm
            ? 'SEED v = (+1, +1)  →  SUM SENSITIVITY'
            : 'SEED v = (−1, +1)  →  DIFFERENCE SENSITIVITY',
          -760,
          -372,
          26,
          sm ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'left',
        ),
        vjpPlot.axes,
        // Vector 1 (Request 1 scaled by seed[0])
        arrow([ox, oy], [p1x, p1y], { stroke: COSMOS.blue, width: 4.8, tip: 14 }).glow(
          10,
          COSMOS.blue,
        ),
        txt(
          `v₁·r₁ = (${fmt(v1[0], 1)}, ${fmt(v1[1], 1)})`,
          sm ? vjpPlot.X(1.3) : vjpPlot.X(1.75),
          sm ? vjpPlot.Y(0.95) : vjpPlot.Y(-0.88),
          26,
          COSMOS.blue,
          'mono',
        ),
      ];

      if (ap > 0.04) {
        // Vector 2 placed head-to-tail
        nodes.push(
          arrow([p1x, p1y], [tipX, tipY], { stroke: COSMOS.rose, width: 4.8, tip: 14 }).glow(
            10,
            COSMOS.rose,
          ),
        );
      }
      if (ap > 0.85) {
        const resCol = sm ? COSMOS.emerald : COSMOS.gold;
        nodes.push(
          arrow([ox, oy], [vjpPlot.X(total[0]), vjpPlot.Y(total[1])], {
            stroke: resCol,
            width: 6,
            tip: 16,
          }).glow(14, resCol),
          dot(10, resCol).at(vjpPlot.X(total[0]), vjpPlot.Y(total[1])).glow(14, resCol),
        );
      }

      // Right ledger
      const rx = 495;
      nodes.push(
        glassPlate(rx, 40, 540, 520, { stroke: '#3c5080', glow: 6 }),
        txt('JACOBIAN ROWS  (∂ŷ / ∂w)', rx, -165, 26, COSMOS.cyan, 'mono'),
        txt('Row 1 (ŷ₁):  [ 1.0,  0.5 ]', rx, -102, 30, COSMOS.blue, 'mono'),
        txt('Row 2 (ŷ₂):  [ 3.0,  0.5 ]', rx, -44, 30, COSMOS.rose, 'mono'),
        line([rx - 220, 12], [rx + 220, 12], { stroke: '#2c3d66', width: 1.6 }),
        txt(`Backward seed  v = (${fmt(seed[0], 0)}, +1)`, rx, 66, 30, COSMOS.gold, 'mono'),
        txt(
          ap > 0.5 ? `Jᵀv = (${fmt(total[0], 1)}, ${fmt(total[1], 1)})` : 'Jᵀv = ?',
          rx,
          144,
          44,
          sm ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).glow(ap > 0.5 ? 10 : 0, sm ? COSMOS.emerald : COSMOS.gold),
        txt(
          sm ? 'Both outputs +1: sum gradient (4, 1)' : 'Queue terms cancel: 0.5 − 0.5 = 0',
          rx,
          224,
          26,
          COSMOS.muted,
          'sans',
        ),
        txt(
          sm
            ? 'Backprop computes Jᵀv without materializing J'
            : `Predicted time gap: 4.45 − 1.85 = 2.60 s`,
          0,
          392,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(barsView, vjpView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'vector-seed-b1', introPulse, 1, { dur: 0.5 });

  cueTo(s, c, 'vector-seed-b2', mode, 1, { dur: 0.55 });
  cueTo(s, c, 'seed-accumulate', accumP, 1, { dur: 0.9 });

  cueTo(s, c, 'vector-seed-b3', jtvVis, 1, { dur: 0.45 });
  c.show('vector-seed-b3', eqVjp);
  cueTo(s, c, 'seed-sum', sumMode, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 19. gradient-check: What does the centered check measure?
// Cues: lower-probe-b1-1, centered-difference-b1-2, analytical-slope-b2-1,
//       stored-probe-losses, stored-probes, rounded-slope-b3-1
// ---------------------------------------------------------------------------
export function gradientCheck(s, c) {
  const mode = s.value(0); // 0=parabola + shrinking zoom lens, 1=float32 spacing cancellation
  const epsVal = s.value(0.035);
  const agreeVis = s.value(0);
  const showLosses = s.value(0);
  const showRounded = s.value(0);
  const showSlope3815 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 139 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(400, 0, 480, '#ff6b8b1e', '#18142a10'));

  const eqCentered = glowTex(String.raw`\frac{L(w + \epsilon) - L(w - \epsilon)}{2\epsilon}`, {
    x: 0,
    y: -372,
    size: 42,
    color: COSMOS.gold,
    glow: 8,
  });

  // Beats 0-1: Parabola + magnifying zoom box shrinking ε -> 1e-6
  const mainPlot = makePlot2d({
    left: -820,
    right: -130,
    top: -245,
    bottom: 245,
    xDomain: [2.35, 3.65],
    yDomain: [0, 5.5],
    xTicks: [2.5, 3.0, 3.5],
    yTicks: [0, 1, 3, 5],
    xLabel: 'weight w',
    yLabel: 'loss L(w)',
  });

  const zoomView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const eps = Math.max(1e-6, epsVal.value);
      const scale = eps * 1.3;
      const zLeft = 110;
      const zRight = 810;
      const zTop = -230;
      const zBottom = 185;
      const zX = (w) => zLeft + ((w - (3 - scale)) / (2 * scale)) * (zRight - zLeft);
      const zY = (l) => zBottom - ((l - (1 - 4.3 * scale)) / (8.6 * scale)) * (zBottom - zTop);

      const mainPts = mainPlot.sampleCurve(derivativeLoss, { from: 2.38, to: 3.62, samples: 110 });
      const zoomPts = Array.from({ length: 65 }, (_, i) => {
        const w = 3 - scale + (2 * scale * i) / 64;
        return [zX(w), zY(derivativeLoss(w))];
      });

      const lx = zX(3 - eps);
      const ly = zY(derivativeLoss(3 - eps));
      const rx = zX(3 + eps);
      const ry = zY(derivativeLoss(3 + eps));
      const [mant, exp] = eps.toExponential(1).split('e');

      return group(
        mainPlot.axes,
        new Node(polyPath(mainPts)).stroke(COSMOS.cyan, 4.4, 0.92).glow(9, COSMOS.cyan),
        dot(10, COSMOS.gold).at(mainPlot.X(3), mainPlot.Y(1)).glow(12, COSMOS.gold),
        circle(36, { fill: null, stroke: COSMOS.gold, width: 2.2, dash: [6, 5] }).at(
          mainPlot.X(3),
          mainPlot.Y(1),
        ),
        markDecor(
          group(
            line([mainPlot.X(3) + 34, mainPlot.Y(1) - 18], [zLeft, zTop], {
              stroke: '#4d6089',
              width: 1.6,
              dash: [5, 6],
            }),
            line([mainPlot.X(3) + 34, mainPlot.Y(1) + 18], [zLeft, zBottom], {
              stroke: '#4d6089',
              width: 1.6,
              dash: [5, 6],
            }),
          ),
        ),
        glassPlate(
          (zLeft + zRight) / 2,
          (zTop + zBottom) / 2,
          zRight - zLeft + 24,
          zBottom - zTop + 24,
          {
            stroke: '#486096',
            glow: 6,
          },
        ),
        new Node(polyPath(zoomPts)).stroke(COSMOS.cyan, 4.6, 0.92).glow(10, COSMOS.cyan),
        line([lx, ly], [rx, ry], { stroke: COSMOS.gold, width: 4.2 }).glow(10, COSMOS.gold),
        dot(9.5, COSMOS.blue).at(lx, ly).glow(12, COSMOS.blue),
        dot(9.5, COSMOS.emerald).at(zX(3), zY(1)).glow(12, COSMOS.emerald),
        dot(9.5, COSMOS.rose).at(rx, ry).glow(12, COSMOS.rose),
        txt('w − ε', lx + 56, ly + 44, 26, COSMOS.blue, 'mono', 'left'),
        txt('w + ε', rx - 56, ry - 44, 26, COSMOS.rose, 'mono', 'right'),
        txt(
          `ε = ${mant} × 10^${Number(exp)}`,
          (zLeft + zRight) / 2,
          zTop - 44,
          30,
          COSMOS.gold,
          'mono',
        ),
        txt(
          agreeVis.value > 0.3
            ? 'Float64 centered slope = 4.000000  ·  Matches reference derivative!'
            : 'Centered probe cancels the O(ε) quadratic error term',
          0,
          365,
          32,
          agreeVis.value > 0.3 ? COSMOS.emerald : COSMOS.ink,
          'sans',
        ).glow(agreeVis.value > 0.3 ? 8 : 0, COSMOS.emerald),
      ).opacity(vis);
    },
  );

  // Beat 2: Float32 stored spacing & catastrophic rounding error (slope ≈ 3.815)
  const float32View = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const pr = PRECISION_SINGLE;
      const scale = 1e6;
      const lowOff = (pr.lowerWeight - 3) * scale;
      const highOff = (pr.upperWeight - 3) * scale;
      const rp = showRounded.value;
      const sp = showSlope3815.value;
      const xOff = (u) => 80 + u * 520;

      const curLow = -1 + (lowOff - -1) * rp;
      const curHigh = 1 + (highOff - 1) * rp;
      const numStr = fmt(pr.lossDifference * scale, 6);

      const slopeAxisX = (val) => 160 + ((val - 3.7) / 0.4) * 580;
      const curSlope = 4.0 + (pr.slope - 4.0) * sp;

      const nodes = [
        txt(
          'FLOAT32 ROUNDING AT ε = 10⁻⁶  (millionths around w = 3)',
          0,
          -372,
          30,
          COSMOS.rose,
          'mono',
        ),
        // Requested spacing bar
        txt('Requested', -760, -210, 30, COSMOS.muted, 'mono', 'left'),
        line([xOff(-1), -210], [xOff(1), -210], { stroke: COSMOS.muted, width: 4 }),
        dot(10, COSMOS.muted).at(xOff(-1), -210),
        dot(10, COSMOS.muted).at(xOff(1), -210),
        txt('spacing = 2.000000 × 10⁻⁶', xOff(0), -248, 28, COSMOS.muted, 'mono'),
        // Float32 stored spacing bar
        txt('Float32 stored', -760, -90, 30, COSMOS.cyan, 'mono', 'left'),
        line([xOff(curLow), -90], [xOff(curHigh), -90], { stroke: COSMOS.cyan, width: 5 }).glow(
          10,
          COSMOS.cyan,
        ),
        dot(11, COSMOS.cyan).at(xOff(curLow), -90).glow(12, COSMOS.cyan),
        dot(11, COSMOS.cyan).at(xOff(curHigh), -90).glow(12, COSMOS.cyan),
        txt(
          `stored spacing = ${fmt(pr.storedSpacing * scale, 6)} × 10⁻⁶`,
          xOff(0),
          -128,
          28,
          COSMOS.cyan,
          'mono',
        ),
      ];

      if (showLosses.value > 0.2) {
        nodes.push(
          txt(`L− = ${pr.minus.toFixed(8)}`, -240, 28, 30, COSMOS.ink, 'mono'),
          txt(`L+ = ${pr.plus.toFixed(8)}`, 400, 28, 30, COSMOS.ink, 'mono'),
          txt(`L+ − L− ≈ ${numStr} × 10⁻⁶`, 80, 102, 34, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        );
      }

      // Bottom slope comparison ruler
      const ry = 255;
      nodes.push(
        txt('Divide by requested 2ε:', -760, ry - 26, 28, COSMOS.muted, 'sans', 'left'),
        txt(
          `${numStr} / 2 ≈ ${sp > 0.5 ? fmt(pr.slope, 3) : '?'}`,
          -760,
          ry + 32,
          38,
          COSMOS.rose,
          'mono',
          'left',
        ).glow(sp > 0.5 ? 10 : 0, COSMOS.rose),
        line([slopeAxisX(3.7), ry], [slopeAxisX(4.1), ry], { stroke: '#4d6089', width: 3.2 }),
        line([slopeAxisX(4.0), ry - 22], [slopeAxisX(4.0), ry + 22], {
          stroke: COSMOS.emerald,
          width: 5,
        }).glow(10, COSMOS.emerald),
        txt('exact 4.0', slopeAxisX(4.0), ry + 56, 26, COSMOS.emerald, 'mono'),
        line([slopeAxisX(curSlope), ry - 22], [slopeAxisX(curSlope), ry + 22], {
          stroke: COSMOS.rose,
          width: 5,
        }).glow(10, COSMOS.rose),
      );
      if (sp > 0.5) {
        nodes.push(
          txt(
            `float32: ${fmt(pr.slope, 3)}`,
            slopeAxisX(pr.slope),
            ry - 52,
            28,
            COSMOS.rose,
            'mono',
          ).glow(8, COSMOS.rose),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(eqCentered, zoomView, float32View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'lower-probe-b1-1', epsVal, 0.008, { dur: 0.7 });
  cueTo(s, c, 'centered-difference-b1-2', epsVal, 1e-6, { dur: 1.0 });

  cueTo(s, c, 'analytical-slope-b2-1', agreeVis, 1, { dur: 0.5 });

  // Beat 2: switch cleanly to float32 spacing view
  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.5 })));
  c.hide(2, eqCentered);
  cueTo(s, c, 'stored-probe-losses', showLosses, 1, { dur: 0.45 });
  cueTo(s, c, 'stored-probes', showRounded, 1, { dur: 0.7 });
  cueTo(s, c, 'rounded-slope-b3-1', showSlope3815, 1, { dur: 0.65 });
}
