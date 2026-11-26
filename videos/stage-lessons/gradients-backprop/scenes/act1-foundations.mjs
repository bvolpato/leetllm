// Act 1: Two Blocks One Weight, Squared Loss Geometry, One Dial & 3D Two-Weight Valley,
// Finite-Difference Probe, and Derivative Limit.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  point3d,
  rect,
  surface,
} from 'vizmatic/stage';
import { cinematic3d, orbitScene } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  aura,
  cinemaGrid,
  cueTo,
  derivativeLoss,
  fadeIn,
  fadeOut,
  finiteDifference,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  latencyTimeline,
  livingDrift,
  makePlot2d,
  markDecor,
  photonWire,
  polyPath,
  pulseCue,
  twoWeightSurfaceZ,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. subject-intro: Two blocks, one weight
// Cues: intro-first-block, intro-second-block, intro-question,
//       intro-turn*, intro-direction, intro-linkage, intro-reset,
//       intro-small-turn, intro-small-result*, intro-fine-prediction, intro-score
// ---------------------------------------------------------------------------
export function subjectIntro(s, c) {
  const traceSec = s.value(3.0);
  const weightVal = s.value(3.0);
  const hiBlock = s.value(0); // 1=first, 2=second, 3=both
  const phaseState = s.value(0); // 0=question, 1=turn 2.9, 2=reset 3.0 & ask 0.01, 3=small result 5.98, 4=score
  const linkageP = s.value(0);
  const scoreP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45, seed: 11 }));
  s.add(aura(-360, -40, 520, '#2a588a28', '#151e3d12'));
  s.add(aura(440, 40, 460, '#ff6b8b20', '#18142a10'));

  const liveScene = dynamic(() => {
    const w = weightVal.value;
    const tip = traceSec.value;
    const pred = 2 * w;
    const st = phaseState.value;
    const hb = Math.round(hiBlock.value);
    const showPred = st < 1.8 || st >= 2.85;

    const nodes = [
      latencyTimeline({
        weight: w,
        traceSeconds: tip,
        leftX: -760,
        secScale: 205,
        yBase: -95,
        showPrediction: showPred,
        highlightBlock: hb,
        showOverrun: true,
        showGapBracket: true,
        showDial: true,
      }),
    ];

    // Bottom floating status / insight readouts (cleanly non-overlapping, zero chrome cards)
    if (st < 0.85) {
      const qAlpha = Math.min(1, st * 2 + 0.35);
      nodes.push(
        txt('Predicted 6.0 s vs observed 5.0 s', -760, 275, 34, COSMOS.ink, 'serif', 'left'),
        txt(
          'One weight controls both 100-token blocks. Which way should it turn?',
          -760,
          334,
          30,
          COSMOS.gold,
          'sans',
          'left',
        )
          .glow(8, COSMOS.gold)
          .opacity(qAlpha),
      );
    } else if (st < 1.85) {
      const lp = linkageP.value;
      nodes.push(
        txt('Turn down −0.10 s per block', -760, 275, 34, COSMOS.emerald, 'serif', 'left').glow(
          6,
          COSMOS.emerald,
        ),
        txt('Join moves −0.10 s', -760, 336, 30, COSMOS.cyan, 'mono', 'left'),
        txt(
          lp > 0.3 ? 'End moves twice as far: −0.20 s  →  5.80 s' : 'Both blocks shorten together',
          -340,
          336,
          30,
          COSMOS.gold,
          'mono',
          'left',
        ).glow(lp > 0.3 ? 8 : 0, COSMOS.gold),
      );
    } else if (st < 2.85) {
      const nudged = w < 2.995;
      nodes.push(
        txt(
          nudged ? 'Take off 0.01 s per block' : 'Reset weight to 3.000 s per block',
          -760,
          275,
          34,
          nudged ? COSMOS.emerald : COSMOS.gold,
          'serif',
          'left',
        ),
        txt(
          nudged
            ? 'How far did the end move?'
            : 'Take off 0.01 s per block: how far will the end move?',
          -760,
          336,
          30,
          COSMOS.cyan,
          'sans',
          'left',
        ).glow(6, COSMOS.cyan),
      );
    } else {
      const sc = scoreP.value;
      nodes.push(
        txt(
          '−0.01 s × 2 blocks = −0.02 s altogether',
          -760,
          275,
          34,
          COSMOS.cyan,
          'mono',
          'left',
        ).glow(8, COSMOS.cyan),
        txt(
          sc > 0.4
            ? `ŷ = ${fmt(pred, 2)} s   ·   Next: how should we score that miss?`
            : `New prediction: ŷ = ${fmt(pred, 2)} s`,
          -760,
          338,
          32,
          sc > 0.4 ? COSMOS.gold : COSMOS.emerald,
          'sans',
          'left',
        ).glow(8, sc > 0.4 ? COSMOS.gold : COSMOS.emerald),
      );
    }

    // Subtle live dial indicator on right margin
    const dialAngle = ((w - 2.5) / 1.0) * 1.4 - 0.5;
    const dcx = 740;
    const dcy = 305;
    const dr = 56;
    nodes.push(
      circle(dr, { fill: '#0e162acc', stroke: COSMOS.gold, width: 3 })
        .at(dcx, dcy)
        .glow(8, COSMOS.gold),
      line(
        [dcx, dcy],
        [
          dcx + Math.cos(dialAngle - Math.PI / 2) * (dr - 10),
          dcy + Math.sin(dialAngle - Math.PI / 2) * (dr - 10),
        ],
        { stroke: COSMOS.gold, width: 4 },
      ).glow(8, COSMOS.gold),
      dot(6, '#ffffff').at(dcx, dcy),
      txt(`w = ${fmt(w, 2)}`, dcx, dcy + 88, 28, COSMOS.gold, 'mono'),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  // Beat 0: trace blocks then ask question
  cueTo(s, c, 'intro-first-block', hiBlock, 1, { dur: 0.35 });
  cueTo(s, c, 'intro-second-block', traceSec, 6.0, { dur: 0.9 });
  c.on('intro-second-block', () => s.play(hiBlock.to(2, { duration: 0.35 })));
  cueTo(s, c, 'intro-question', phaseState, 0.5, { dur: 0.4 });
  c.on('intro-question', () => s.play(hiBlock.to(3, { duration: 0.35 })));

  // Beat 1: turn down a tenth (caption_boundary -> starts strictly at intro-turn), linkage, reset
  cueTo(s, c, 'intro-turn', weightVal, 2.9, { dur: 0.7 });
  c.on('intro-turn', () => {
    s.play(traceSec.to(5.8, { duration: 0.7 }));
    s.play(phaseState.to(1.2, { duration: 0.25 }));
  });
  pulseCue(s, c, 'intro-direction', hiBlock, 3, { dur: 0.3 });
  cueTo(s, c, 'intro-linkage', linkageP, 1, { dur: 0.45 });
  cueTo(s, c, 'intro-reset', weightVal, 3.0, { dur: 0.55 });
  c.on('intro-reset', () => {
    s.play(traceSec.to(6.0, { duration: 0.55 }));
    s.play(phaseState.to(2.2, { duration: 0.3 }));
  });

  // Beat 2: small turn by 0.01 -> reveal result strictly on/after intro-small-result
  cueTo(s, c, 'intro-small-turn', weightVal, 2.99, { dur: 0.45 });
  c.on('intro-small-turn', () => s.play(traceSec.to(5.98, { duration: 0.45 })));
  cueTo(s, c, 'intro-small-result', phaseState, 3.2, { after: true, dur: 0.25 });
  pulseCue(s, c, 'intro-fine-prediction', hiBlock, 3, { dur: 0.3 });
  cueTo(s, c, 'intro-score', scoreP, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 2. why-train: What does the miss cost?
// Cues: rollback-small-nudge, request-input-b1-1, target-fixed,
//       squared-loss-b2-2, double-miss, trial-weight, trial-gap
// ---------------------------------------------------------------------------
export function whyTrain(s, c) {
  const weightVal = s.value(2.99);
  const showSq = s.value(0);
  const dblMiss = s.value(0);
  const trialShrink = s.value(0);
  const targetGlow = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 19 }));
  s.add(aura(-360, 120, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(430, 140, 460, '#ffd16622', '#26305212'));

  const liveScene = dynamic(() => {
    const w = weightVal.value;
    const sq = showSq.value;
    const dm = dblMiss.value;
    const ts = trialShrink.value;
    const pred = 2 * w;
    const err = Math.abs(pred - 5);
    const loss = err * err;

    const nodes = [
      latencyTimeline({
        weight: w,
        leftX: -780,
        secScale: 198,
        yBase: -215,
        showPrediction: false,
        highlightBlock: 0,
        showOverrun: true,
        showGapBracket: true,
        showDial: true,
      }),
    ];

    // Left bottom: Error readout + formula
    nodes.push(
      txt(
        `Predicted ${fmt(pred, 2)} s   vs   Observed 5.00 s`,
        -780,
        85,
        34,
        COSMOS.ink,
        'serif',
        'left',
      ),
      txt(
        `Error  e = ŷ − y = ${fmt(pred - 5, 2)} s`,
        -780,
        152,
        34,
        COSMOS.rose,
        'mono',
        'left',
      ).glow(6, COSMOS.rose),
    );

    if (targetGlow.value > 0.2) {
      nodes.push(txt('Target stays fixed at 5 s', -780, 214, 28, COSMOS.emerald, 'sans', 'left'));
    }

    if (sq > 0.05) {
      // Visual geometric loss square on right!
      const unitPx = 128; // 1 second = 128 px
      const sideErr = dm > 0.05 && ts < 0.05 ? 1 + dm : err;
      const sidePx = sideErr * unitPx;
      const sqLeft = 220;
      const sqTop = 85;
      const sqCx = sqLeft + sidePx / 2;
      const sqCy = sqTop + sidePx / 2;
      const sqCol = ts > 0.3 ? COSMOS.emerald : dm > 0.5 && ts < 0.05 ? COSMOS.rose : COSMOS.gold;

      // Reference 1x1 dashed square when comparing 2x2 or 0.8x0.8
      if (dm > 0.1 || ts > 0.1) {
        nodes.push(
          rect(unitPx, unitPx, {
            fill: '#ffd16614',
            stroke: COSMOS.gold,
            width: 2.2,
            dash: [7, 6],
            radius: 4,
          }).at(sqLeft + unitPx / 2, sqTop + unitPx / 2),
        );
      }

      // If 2-second miss is active, draw the 2x2 subdivision grid showing 4 unit squares fit inside!
      if (dm > 0.45 && ts < 0.05) {
        const subOp = Math.min(1, (dm - 0.45) / 0.4);
        nodes.push(
          line([sqLeft + unitPx, sqTop], [sqLeft + unitPx, sqTop + sidePx], {
            stroke: COSMOS.gold,
            width: 2.2,
            dash: [6, 6],
          }).opacity(subOp),
          line([sqLeft, sqTop + unitPx], [sqLeft + sidePx, sqTop + unitPx], {
            stroke: COSMOS.gold,
            width: 2.2,
            dash: [6, 6],
          }).opacity(subOp),
        );
      }

      nodes.push(
        rect(sidePx, sidePx, {
          fill: sqCol + '36',
          stroke: sqCol,
          width: 3.6,
          radius: 6,
        })
          .at(sqCx, sqCy)
          .glow(12, sqCol)
          .opacity(sq),
        txt(`${fmt(sideErr, 2)} s`, sqCx, sqTop - 28, 28, sqCol, 'mono').opacity(sq),
        txt(`${fmt(sideErr, 2)} s`, sqLeft - 24, sqCy, 28, sqCol, 'mono', 'right').opacity(sq),
        txt(
          `Loss = ${fmt(sideErr * sideErr, 2)} s²`,
          sqLeft + Math.max(sidePx, 250) + 46,
          sqTop + 56,
          42,
          sqCol,
          'mono',
          'left',
        )
          .glow(10, sqCol)
          .opacity(sq),
        txt(
          dm > 0.5 && ts < 0.05
            ? '2× error → 4× area'
            : ts > 0.3
              ? '0.8² = 0.64 s²  (smaller!)'
              : 'L = (ŷ − y)² ≥ 0',
          sqLeft + Math.max(sidePx, 250) + 46,
          sqTop + 124,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(sq),
      );
    }

    // Bottom left equation readout
    nodes.push(
      txt(
        `Squared loss  L(w) = (2w − 5)² = ${fmt(loss, 2)} s²`,
        -780,
        325,
        34,
        COSMOS.gold,
        'mono',
        'left',
      ).glow(8, COSMOS.gold),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'rollback-small-nudge', weightVal, 3.0, { dur: 0.5 });
  pulseCue(s, c, 'request-input-b1-1', targetGlow, 0.3, { dur: 0.3 });
  cueTo(s, c, 'target-fixed', targetGlow, 1, { dur: 0.4 });

  cueTo(s, c, 'squared-loss-b2-2', showSq, 1, { dur: 0.65 });
  cueTo(s, c, 'double-miss', dblMiss, 1, { dur: 0.9 });

  cueTo(s, c, 'trial-weight', weightVal, 2.9, { dur: 0.7 });
  c.on('trial-weight', () => s.play(dblMiss.to(0, { duration: 0.35 })));
  cueTo(s, c, 'trial-gap', trialShrink, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 3. parameters-shape-loss: One dial draws a loss curve + 3D Two-Weight Valley!
// Cues: sample-curve, sample-mid, sample-three,
//       quarter-sample, quarter-prediction, quarter-loss, loss-curve-b2-1,
//       loss-surface-b2-2, valley-bottom
// ---------------------------------------------------------------------------
export function parametersShapeLoss(s, c) {
  const mode3d = s.value(0); // 0 = 1D parabola, 1 = 3D two-weight valley surface!
  const probeW = s.value(2.0);
  const sampleCount = s.value(1); // 1 -> w=2, 2 -> w=2.5, 3 -> w=3, 4 -> w=2.25
  const qPredVis = s.value(0);
  const qLossVis = s.value(0);
  const curveSweep = s.value(0);
  const valleyT = s.value(0); // moves along zero-loss floor 2*wp + wq = 5
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.42, seed: 29 }));
  s.add(aura(220, 0, 560, '#2a588a28', '#151e3d12'));

  // --- Phase A: 1D Loss Parabola ---
  const plot = makePlot2d({
    left: -760,
    right: 260,
    top: -300,
    bottom: 270,
    xDomain: [1.6, 3.4],
    yDomain: [0, 3.2],
    xTicks: [2, 2.25, 2.5, 3],
    yTicks: [0, 0.25, 1, 2, 3],
    xLabel: 'prompt weight w (s / block)',
    yLabel: 'squared loss L(w)',
  });

  const eq1d = glowTex(String.raw`L(w) = (2w - 5)^2`, {
    x: 560,
    y: -315,
    size: 46,
    color: COSMOS.gold,
    glow: 8,
  });

  const view1d = guardedDynamic(
    () => fadeOut(mode3d.value),
    (vis) => {
      const w = probeW.value;
      const sc = sampleCount.value;
      const sw = curveSweep.value;
      const loss = derivativeLoss(w);
      const pred = 2 * w;
      const nodes = [plot.axes];

      if (sw > 0.02) {
        const pts = plot.sampleCurve(derivativeLoss, {
          from: 1.75,
          to: 1.75 + 1.5 * sw,
          samples: 120,
        });
        if (pts.length >= 2) {
          nodes.push(new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.5, 0.92).glow(10, COSMOS.cyan));
        }
      }

      // Sampled anchor dots
      const anchors = [
        { w: 2.0, col: COSMOS.blue, minSc: 0.8 },
        { w: 2.5, col: COSMOS.emerald, minSc: 1.8 },
        { w: 3.0, col: COSMOS.rose, minSc: 2.8 },
        { w: 2.25, col: COSMOS.gold, minSc: 3.8 },
      ];
      for (const a of anchors) {
        if (sc >= a.minSc) {
          const ax = plot.X(a.w);
          const ay = plot.Y(derivativeLoss(a.w));
          nodes.push(dot(10, a.col).at(ax, ay).glow(12, a.col), dot(4, '#ffffff').at(ax, ay));
        }
      }

      // Live active cursor on parabola
      const px = plot.X(w);
      const py = plot.Y(loss);
      nodes.push(
        line([px, plot.Y(0)], [px, py], { stroke: COSMOS.gold, width: 2.4, dash: [6, 6] }).opacity(
          0.7,
        ),
        circle(18, { fill: null, stroke: COSMOS.gold, width: 3 }).at(px, py).glow(10, COSMOS.gold),
      );

      // Right floating live inspector
      const rx = 560;
      nodes.push(
        glassPlate(rx, 45, 520, 480, { stroke: '#3c5080', glow: 6 }),
        txt('LIVE DIAL SAMPLE', rx, -145, 26, COSMOS.cyan, 'mono'),
        txt(`w = ${fmt(w, 2)}`, rx, -72, 54, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
        txt(`prediction ŷ = ${fmt(pred, 2)} s`, rx, 15, 32, COSMOS.ink, 'mono'),
        txt(
          `error = ${fmt(pred - 5, 2)} s`,
          rx,
          82,
          30,
          Math.abs(pred - 5) < 1e-4 ? COSMOS.emerald : COSMOS.rose,
          'mono',
        ),
        line([rx - 210, 132], [rx + 210, 132], { stroke: '#2c3d66', width: 1.6 }),
        txt(`L(w) = ${fmt(loss, 2)} s²`, rx, 196, 42, COSMOS.cyan, 'mono').glow(8, COSMOS.cyan),
      );

      if (qPredVis.value > 0.3 && sc >= 3.5) {
        nodes.push(
          txt(
            qLossVis.value > 0.3 ? 'At 2.25: ŷ = 4.5 s, loss = 0.25' : 'At 2.25: ŷ = 4.5 s',
            -150,
            -358,
            32,
            COSMOS.gold,
            'mono',
          ).glow(6, COSMOS.gold),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // --- Phase B: Signature 3D Orbiting Two-Weight Loss Valley Surface ---
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 14.5,
    unit: 132,
    ambient: 0.4,
    shine: 0.42,
    brightness: 1.16,
    fog: 0.08,
    focus: [0, 0, 0.9],
  }).at(245, 20);

  const HALF = 2.6;
  const mapWp = (u) => 2.0 + u * 0.55;
  const mapWq = (v) => 1.5 + v * 0.85;
  const invU = (wp) => (wp - 2.0) / 0.55;
  const invV = (wq) => (wq - 1.5) / 0.85;

  const valleySurface = surface((u, v) => twoWeightSurfaceZ(mapWp(u), mapWq(v)), {
    x: [-HALF, HALF],
    y: [-HALF, HALF],
    resolution: [46, 46],
    colors: ['#0a2e38', '#155e75', '#2a588a', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'],
    mesh: '#7ce8ff',
    meshOpacity: 0.16,
    meshWidth: 0.6,
    opacity: 0.92,
  });

  // Glowing emerald zero-loss valley floor curve: 2*wp + wq = 5
  const zeroValleyLine = curve3d(
    (t) => {
      const wp = 1.2 + t * 1.6;
      const wq = 5 - 2 * wp;
      return [invU(wp), invV(wq), 0.1];
    },
    0,
    1,
    {
      samples: 40,
      color: COSMOS.emerald,
      width: 5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  // Two marked zero-loss settings: (2.0, 1.0) and (1.5, 2.0) + moving traveler between them
  const valleyDot1 = point3d([invU(2.0), invV(1.0), 0.14], {
    color: COSMOS.emerald,
    radius: 8,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });
  const valleyDot2 = point3d([invU(1.5), invV(2.0), 0.14], {
    color: COSMOS.gold,
    radius: 8,
    glow: 14,
    blend: 'screen',
    onTop: true,
  });
  const traveler = point3d(
    () => {
      const t = valleyT.value;
      const wp = 2.0 - 0.5 * t;
      const wq = 1.0 + 1.0 * t;
      return [invU(wp), invV(wq), 0.16];
    },
    {
      color: '#ffffff',
      radius: 9.5,
      glow: 16,
      blend: 'screen',
      onTop: true,
    },
  );

  const floorAxes = [
    line3d([-HALF, 0, 0.03], [HALF, 0, 0.03], { color: '#455a8c', width: 1.5, opacity: 0.55 }),
    line3d([0, -HALF, 0.03], [0, HALF, 0.03], { color: '#455a8c', width: 1.5, opacity: 0.55 }),
  ];

  view3d.add(valleySurface, ...floorAxes, zeroValleyLine, valleyDot1, valleyDot2, traveler);

  const eq3d = glowTex(String.raw`L(w_p, w_q) = (2w_p + w_q - 5)^2`, {
    x: -565,
    y: -120,
    size: 38,
    color: COSMOS.gold,
    glow: 7,
  });

  const view3dHud = guardedDynamic(
    () => fadeIn(mode3d.value),
    (vis) => {
      const t = valleyT.value;
      const wp = 2.0 - 0.5 * t;
      const wq = 1.0 + 1.0 * t;
      return group(
        txt('Two-Weight', -845, -395, 58, COSMOS.ink, 'serif', 'left'),
        txt('Loss Valley', -845, -326, 58, COSMOS.emerald, 'serif', 'left').glow(8, COSMOS.emerald),
        txt('2 prompt blocks + 1 s queued = 5 s', -845, -242, 28, COSMOS.muted, 'sans', 'left'),
        txt('ZERO-LOSS FLOOR', -845, -10, 26, COSMOS.emerald, 'mono', 'left'),
        txt(
          `w_p = ${fmt(wp, 2)}    w_q = ${fmt(wq, 2)}`,
          -845,
          52,
          34,
          COSMOS.gold,
          'mono',
          'left',
        ).glow(8, COSMOS.gold),
        txt(
          `2(${fmt(wp, 2)}) + 1(${fmt(wq, 2)}) = 5.00 s`,
          -845,
          114,
          30,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt('L = 0.00 everywhere along the trench', -845, 176, 28, COSMOS.emerald, 'sans', 'left'),
        txt(
          'Need a second feature ratio to pin down a unique bottom',
          -845,
          302,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
      ).opacity(vis);
    },
  );

  s.add(view1d, eq1d, view3dHud);
  livingDrift(s, c, drift, 1);

  // Beat 0: sweep individual weights 2 -> 2.5 -> 3
  cueTo(s, c, 'sample-curve', sampleCount, 1, { dur: 0.35 });
  cueTo(s, c, 'sample-mid', probeW, 2.5, { dur: 0.65 });
  c.on('sample-mid', () => s.play(sampleCount.to(2, { duration: 0.25 })));
  cueTo(s, c, 'sample-three', probeW, 3.0, { dur: 0.65 });
  c.on('sample-three', () => s.play(sampleCount.to(3, { duration: 0.25 })));

  // Beat 1: quarter sample 2.25 then sweep full parabola
  cueTo(s, c, 'quarter-sample', probeW, 2.25, { dur: 0.65 });
  c.on('quarter-sample', () => s.play(sampleCount.to(4, { duration: 0.25 })));
  cueTo(s, c, 'quarter-prediction', qPredVis, 1, { dur: 0.35 });
  cueTo(s, c, 'quarter-loss', qLossVis, 1, { dur: 0.35 });
  cueTo(s, c, 'loss-curve-b2-1', curveSweep, 1, { dur: 1.3 });

  // Beat 2: crossfade smoothly to 3D orbiting loss valley surface (strictly non-overlapping!)
  cueTo(s, c, 'loss-surface-b2-2', mode3d, 1, { dur: 0.55 });
  c.hide('loss-surface-b2-2', eq1d);
  const surfStart = Math.max(0.1, c.cue('loss-surface-b2-2').start - c.start + 0.32);
  c.at(surfStart, () => s.add(view3d, eq3d));
  cueTo(s, c, 'valley-bottom', valleyT, 1, { dur: 2.2 });
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.22, phi: 0.96, distance: 13.8 },
    { startOffset: surfStart + 0.05 },
  );
}

// ---------------------------------------------------------------------------
// 4. probe-neighbor: At weight 3.001, will loss rise or fall?
// Cues: probe-start, nudged-weight-b1-1, original-weight-b2-1, nudge-receipt,
//       finite-ratio-b3-1, finite-answer
// ---------------------------------------------------------------------------
export function probeNeighbor(s, c) {
  const nudgeP = s.value(0); // 0 -> 1 moves point from 3 to 3.001
  const zoomP = s.value(0);
  const ratioVis = s.value(0);
  const answerVis = s.value(0);
  const startPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 37 }));
  s.add(aura(-420, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(400, 0, 480, '#ffd1661f', '#171f3b12'));

  const mainPlot = makePlot2d({
    left: -820,
    right: -110,
    top: -260,
    bottom: 240,
    xDomain: [2.2, 3.4],
    yDomain: [0, 3.4],
    xTicks: [2.5, 3.0, 3.4],
    yTicks: [0, 1, 2, 3],
    xLabel: 'weight w',
    yLabel: 'loss L(w)',
  });

  const zoomPlot = makePlot2d({
    left: 140,
    right: 810,
    top: -260,
    bottom: 200,
    xDomain: [2.9995, 3.0015],
    yDomain: [0.998, 1.006],
    xTicks: [3.0, 3.001],
    yTicks: [1.0, 1.004],
    xLabel: 'magnified weight (×1000 zoom)',
    yLabel: 'magnified loss',
  });

  const ratioEq = glowTex(
    String.raw`\frac{L(3.001) - L(3)}{0.001} = \frac{0.004004}{0.001} = 4.004`,
    { x: 375, y: 392, size: 36, color: COSMOS.emerald, glow: 8 },
  );

  const liveScene = dynamic(() => {
    const np = nudgeP.value;
    const zp = zoomP.value;
    const rv = ratioVis.value;
    const av = answerVis.value;
    const wCur = 3 + 0.001 * np;
    const lCur = derivativeLoss(wCur);

    const ptsMain = mainPlot.sampleCurve(derivativeLoss, { from: 2.25, to: 3.38, samples: 100 });
    const ptsZoom = zoomPlot.sampleCurve(derivativeLoss, { from: 2.9996, to: 3.0014, samples: 80 });

    const p0x = mainPlot.X(3);
    const p0y = mainPlot.Y(1);
    const z0x = zoomPlot.X(3);
    const z0y = zoomPlot.Y(1);
    const z1x = zoomPlot.X(wCur);
    const z1y = zoomPlot.Y(lCur);

    const nodes = [
      txt('FINITE-DIFFERENCE PROBE', -820, -395, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Will nudging w = 3 to 3.001 raise or lower loss?',
        -820,
        -342,
        36,
        COSMOS.ink,
        'serif',
        'left',
      ),
      mainPlot.axes,
      new Node(polyPath(ptsMain)).stroke(COSMOS.cyan, 4.2, 0.9).glow(8, COSMOS.cyan),
      dot(10, COSMOS.rose).at(p0x, p0y).glow(12, COSMOS.rose),
      circle(34 + 5 * startPulse.value, {
        fill: null,
        stroke: COSMOS.gold,
        width: 2.2,
        dash: [6, 5],
      })
        .at(p0x, p0y)
        .opacity(0.85),
      // Magnifier connector beams (decoration)
      markDecor(
        group(
          line([p0x + 32, p0y - 16], [140, -260], { stroke: '#4d6089', width: 1.6, dash: [5, 6] }),
          line([p0x + 32, p0y + 16], [140, 200], { stroke: '#4d6089', width: 1.6, dash: [5, 6] }),
        ),
      ),
      zoomPlot.axes,
      new Node(polyPath(ptsZoom)).stroke(COSMOS.cyan, 4.5, 0.92).glow(10, COSMOS.cyan),
      // Original point (3, 1)
      dot(10, COSMOS.rose).at(z0x, z0y).glow(12, COSMOS.rose),
      txt('L(3) = 1.000000', z0x + 18, z0y + 42, 26, COSMOS.rose, 'mono', 'left'),
    ];

    if (np > 0.05) {
      // Secant chord + rise/run triangle
      nodes.push(
        line([z0x, z0y], [z1x, z1y], { stroke: COSMOS.gold, width: 4.2 }).glow(10, COSMOS.gold),
        dot(10, COSMOS.gold).at(z1x, z1y).glow(14, COSMOS.gold),
        dot(4, '#ffffff').at(z1x, z1y),
      );
      if (zp > 0.25) {
        nodes.push(
          txt(
            `L(${fmt(wCur, 3)}) = ${lCur.toFixed(6)}`,
            z1x - 16,
            z1y - 42,
            26,
            COSMOS.gold,
            'mono',
            'right',
          ).opacity(zp),
        );
      }
      if (rv > 0.1) {
        // Luminous rise & run legs
        nodes.push(
          line([z0x, z0y], [z1x, z0y], { stroke: COSMOS.cyan, width: 3.5 })
            .glow(8, COSMOS.cyan)
            .opacity(rv),
          line([z1x, z0y], [z1x, z1y], { stroke: COSMOS.emerald, width: 3.5 })
            .glow(8, COSMOS.emerald)
            .opacity(rv),
          txt('Δw = +0.001', (z0x + z1x) / 2, z0y + 78, 26, COSMOS.cyan, 'mono').opacity(rv),
          txt(
            'ΔL = +0.004004',
            z1x + 18,
            (z0y + z1y) / 2,
            26,
            COSMOS.emerald,
            'mono',
            'left',
          ).opacity(rv),
        );
      }
    }

    if (av > 0.4) {
      nodes.push(
        txt(
          `slope ≈ ${finiteDifference(0.001).toFixed(3)}  (uphill)`,
          -465,
          392,
          30,
          COSMOS.emerald,
          'mono',
        ).glow(8, COSMOS.emerald),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'probe-start', startPulse, 1, { dur: 0.5 });
  cueTo(s, c, 'nudged-weight-b1-1', nudgeP, 1, { dur: 1.0 });

  pulseCue(s, c, 'original-weight-b2-1', startPulse, 0.2, { dur: 0.4 });
  cueTo(s, c, 'nudge-receipt', zoomP, 1, { dur: 0.6 });

  cueTo(s, c, 'finite-ratio-b3-1', ratioVis, 1, { dur: 0.7 });
  cueTo(s, c, 'finite-answer', answerVis, 1, { after: true, dur: 0.4 });
  c.show('finite-answer', ratioEq, { after: true });
}

// ---------------------------------------------------------------------------
// 5. derivative-limit: What survives as the nudge shrinks?
// Cues: nearby-point-b1-1, finite-expression-b2-1, nudge-size-b2-2,
//       secant-line-b3-1, limiting-slope-b3-2
// ---------------------------------------------------------------------------
export function derivativeLimit(s, c) {
  const hVal = s.value(0.28); // contracts continuously toward 0.002
  const algebraVis = s.value(0);
  const shrinkFocus = s.value(0);
  const tangentVis = s.value(0);
  const limitRevealed = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 43 }));
  s.add(aura(-360, 0, 500, '#2a588a28', '#151e3d12'));
  s.add(aura(460, 40, 440, '#6ee7b71e', '#15243010'));

  const plot = makePlot2d({
    left: -820,
    right: 60,
    top: -290,
    bottom: 270,
    xDomain: [2.2, 3.45],
    yDomain: [0, 3.8],
    xTicks: [2.5, 3.0, 3.4],
    yTicks: [0, 1, 2, 3],
    xLabel: 'weight w',
    yLabel: 'loss L(w) = (2w − 5)²',
  });

  const eqAlg = glowTex(String.raw`\frac{(1+2h)^2 - 1}{h} = \frac{4h + 4h^2}{h} = 4 + 4h`, {
    x: 490,
    y: -155,
    size: 36,
    color: COSMOS.gold,
    glow: 8,
  });

  const eqLim = glowTex(String.raw`\lim_{h \to 0}\;(4 + 4h) = 4`, {
    x: 490,
    y: 235,
    size: 46,
    color: COSMOS.emerald,
    glow: 10,
  });

  const liveScene = dynamic(() => {
    const h = Math.max(0.0005, hVal.value);
    const slope = finiteDifference(h);
    const pts = plot.sampleCurve(derivativeLoss, { from: 2.25, to: 3.42, samples: 120 });

    const x0 = plot.X(3);
    const y0 = plot.Y(1);
    const x1 = plot.X(3 + h);
    const y1 = plot.Y(derivativeLoss(3 + h));

    // Extended secant line through (3, 1) with slope `slope`
    const sLeftW = 2.68;
    const sRightW = 3.38;
    const sLeftY = 1 + slope * (sLeftW - 3);
    const sRightY = 1 + slope * (sRightW - 3);

    // Exact tangent line at (3, 1) with slope 4
    const tLeftY = 1 + 4 * (sLeftW - 3);
    const tRightY = 1 + 4 * (sRightW - 3);

    const nodes = [
      plot.axes,
      new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.4, 0.92).glow(10, COSMOS.cyan),
      // Secant line (gold)
      line(
        [plot.X(sLeftW), plot.Y(Math.max(0, sLeftY))],
        [plot.X(sRightW), plot.Y(Math.min(3.8, sRightY))],
        {
          stroke: COSMOS.gold,
          width: 3.6,
        },
      ).glow(9, COSMOS.gold),
    ];

    // Exact emerald tangent line appears in beat 2
    if (tangentVis.value > 0.04) {
      nodes.push(
        line(
          [plot.X(sLeftW), plot.Y(Math.max(0, tLeftY))],
          [plot.X(sRightW), plot.Y(Math.min(3.8, tRightY))],
          { stroke: COSMOS.emerald, width: 4.6 },
        )
          .glow(12, COSMOS.emerald)
          .opacity(tangentVis.value),
      );
    }

    // Fixed anchor (3, 1) & moving neighbor (3 + h, L(3 + h))
    nodes.push(
      dot(10, COSMOS.rose).at(x0, y0).glow(12, COSMOS.rose),
      dot(9.5, COSMOS.gold).at(x1, y1).glow(14, COSMOS.gold),
      dot(3.8, '#ffffff').at(x1, y1),
    );

    // Right side inspector (cleanly separated from plot)
    const rx = 490;
    nodes.push(
      txt('SHRINKING FINITE DIFFERENCE', rx, -350, 26, COSMOS.cyan, 'mono'),
      txt(`nudge  h = ${h.toFixed(4)}`, rx, -280, 38, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
      txt(`secant slope = ${slope.toFixed(4)}`, rx, -24, 42, COSMOS.gold, 'mono').glow(
        8,
        COSMOS.gold,
      ),
    );

    if (algebraVis.value > 0.2) {
      nodes.push(
        txt(
          `fixed part 4   +   4h = +${(4 * h).toFixed(4)}`,
          rx,
          56,
          28,
          shrinkFocus.value > 0.3 ? COSMOS.cyan : COSMOS.muted,
          'mono',
        ).opacity(algebraVis.value),
      );
    } else {
      nodes.push(txt('What number is the slope approaching?', rx, 56, 28, COSMOS.muted, 'sans'));
    }

    if (limitRevealed.value > 0.3) {
      nodes.push(
        txt('Every divided nudge stays nonzero (h ≠ 0)', rx, 336, 26, COSMOS.muted, 'sans').opacity(
          limitRevealed.value,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'nearby-point-b1-1', hVal, 0.06, { dur: 1.6 });

  cueTo(s, c, 'finite-expression-b2-1', algebraVis, 1, { dur: 0.55 });
  c.show('finite-expression-b2-1', eqAlg);
  cueTo(s, c, 'nudge-size-b2-2', hVal, 0.012, { dur: 1.1 });
  c.on('nudge-size-b2-2', () => s.play(shrinkFocus.to(1, { duration: 0.45 })));

  cueTo(s, c, 'secant-line-b3-1', hVal, 0.0005, { dur: 1.0 });
  c.on('secant-line-b3-1', () => s.play(tangentVis.to(1, { duration: 0.7 })));
  // Withhold exact tangent answer until limiting-slope-b3-2!
  cueTo(s, c, 'limiting-slope-b3-2', limitRevealed, 1, { after: true, dur: 0.4 });
  c.show('limiting-slope-b3-2', eqLim, { after: true });
}
