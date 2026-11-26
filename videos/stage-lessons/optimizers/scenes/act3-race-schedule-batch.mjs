// Act 3: 3D 40-Update Optimizer Race (Signature Showcase), Warmup + Cosine Schedule,
// Unequal Microbatch Accumulation & AMP Window, and Global-Norm Gradient Clipping.
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
import {
  ACCUMULATION,
  COSMOS,
  RUNS,
  SCHEDULED,
  SETTINGS,
  aura,
  cinemaGrid,
  cinematic3d,
  clamp,
  coordRuler,
  cueTo,
  fadeIn,
  fadeOut,
  glassPlate,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  livingDrift,
  loss,
  luminousPlot,
  num,
  orbitScene,
  pairText,
  photonWire,
  polyPath,
  pulseCue,
  sampleRun,
  scheduledRate,
  shareRibbon,
  signed,
  stageVis,
  txt,
  valleyZ,
  vector,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 11. comparison: Compare complete recipes at one budget (SIGNATURE 3D SHOWCASE!)
// Cues: comparison-prediction, comparison-runs
// ---------------------------------------------------------------------------
export function comparison(s, c) {
  const predP = s.value(0);
  const runP = s.value(0);

  s.add(aura(235, 10, 580, '#1e7fc42c', '#11162600'));
  s.add(aura(-560, 120, 380, '#6ee7b71a', '#11162600'));

  const view3d = cinematic3d({
    theta: -1.36,
    phi: 0.74,
    distance: 13.8,
    unit: 144,
    ambient: 0.36,
    shine: 0.35,
    brightness: 1.06,
    fog: 0.06,
    focus: [0, 0.45, 0.55],
  }).at(245, 22);

  const valleySurface = surface(
    (x, y) => {
      const a = x / 1.8;
      const b = y / 1.95;
      return valleyZ(a, b, { scale: 0.62, maxZ: 2.65 });
    },
    {
      x: [-2.55, 2.55],
      y: [-1.1, 2.35],
      resolution: [38, 34],
      colors: ['#040712', '#0b1433', '#152559', '#1c407a', '#246c9e', '#329ec2'],
      mesh: '#5ce1e6',
      meshOpacity: 0.16,
      meshWidth: 0.55,
      opacity: 0.8,
    },
  );

  const to3d = (a, b, lift = 0.12) => [
    Math.max(-2.5, Math.min(2.5, a * 1.8)),
    Math.max(-1.0, Math.min(2.3, b * 1.95)),
    valleyZ(a, b, { scale: 0.62, maxZ: 2.65 }) + lift,
  ];

  // Floor axis + start & target beacons
  const floorAxis = line3d([0, -1.0, 0.05], [0, 2.3, 0.05], {
    color: COSMOS.gold,
    width: 2.0,
    opacity: 0.55,
  });
  const originBeacon = point3d([0, 0, 0.14], {
    color: COSMOS.gold,
    radius: 8.5,
    glow: 15,
    blend: 'screen',
    onTop: true,
  });

  // Reactive 40-step glowing 3D trajectory chain using line3d segments
  const makeRaceSegments = (run, col, lift, width) =>
    Array.from({ length: 40 }, (_, idx) => {
      const pA = vector(run.points[idx]);
      const pB = vector(run.points[idx + 1]);
      return line3d(
        () => (runP.value * 40 > idx + 0.001 ? to3d(pA[0], pA[1], lift) : to3d(1, 1, lift)),
        () => {
          const segP = clamp(runP.value * 40 - idx);
          if (segP <= 0.001) return to3d(1, 1, lift);
          const a = pA[0] + (pB[0] - pA[0]) * segP;
          const b = pA[1] + (pB[1] - pA[1]) * segP;
          return to3d(a, b, lift);
        },
        {
          color: col,
          width,
          glow: 11,
          blend: 'screen',
          onTop: true,
        },
      );
    });

  const makeRaceHead = (run, col, lift) =>
    point3d(
      () => {
        const f = sampleRun(run, runP.value, 0, 40);
        return to3d(f.interp[0], f.interp[1], lift + 0.06);
      },
      { color: col, radius: 9.5, glow: 16, blend: 'screen', onTop: true },
    );

  const sgdSegs = makeRaceSegments(RUNS.sgd, COSMOS.blue, 0.12, 3.8);
  const momSegs = makeRaceSegments(RUNS.momentum, COSMOS.violet, 0.16, 4.2);
  const adamSegs = makeRaceSegments(RUNS.adam, COSMOS.emerald, 0.21, 5.2);

  const sgdHead = makeRaceHead(RUNS.sgd, COSMOS.blue, 0.12);
  const momHead = makeRaceHead(RUNS.momentum, COSMOS.violet, 0.16);
  const adamHead = makeRaceHead(RUNS.adam, COSMOS.emerald, 0.21);

  view3d.add(
    valleySurface,
    floorAxis,
    originBeacon,
    ...sgdSegs,
    ...momSegs,
    ...adamSegs,
    sgdHead,
    momHead,
    adamHead,
  );

  const hud = dynamic(() => {
    const p = runP.value;
    const fS = sampleRun(RUNS.sgd, p, 0, 40);
    const fM = sampleRun(RUNS.momentum, p, 0, 40);
    const fA = sampleRun(RUNS.adam, p, 0, 40);
    const asking = predP.value > 0.2 && p < 0.02;

    const cards = [
      { name: 'SGD', rate: 'η = 0.018', f: fS, col: COSMOS.blue, y: -155 },
      { name: 'Momentum', rate: 'η = 0.018, β = 0.9', f: fM, col: COSMOS.violet, y: 35 },
      { name: 'Adam', rate: 'η = 0.08', f: fA, col: COSMOS.emerald, y: 225 },
    ];

    const nodes = [
      txt('40-EVALUATION VALLEY RACE', -855, -424, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Three Recipes', -855, -356, 56, COSMOS.ink, 'serif', 'left'),
      txt(`Completed updates:  ${fA.completed} / 40`, -855, -284, 30, COSMOS.gold, 'mono', 'left'),
    ];

    for (const cd of cards) {
      nodes.push(
        glassPlate(-575, cd.y, 560, 162, { stroke: cd.col, glow: p > 0.05 ? 8 : 4 }),
        txt(cd.name, -825, cd.y - 46, 32, cd.col, 'serif', 'left'),
        txt(cd.rate, -320, cd.y - 46, 26, COSMOS.muted, 'mono', 'right'),
        txt(
          p > 0.02 ? `(a, b) = ${pairText(cd.f.current, 3)}` : 'Start (1.000, 1.000)',
          -825,
          cd.y + 6,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          p > 0.02 ? `Loss = ${num(cd.f.currentLoss, 4)}` : 'Loss = 50.500',
          -825,
          cd.y + 48,
          28,
          cd.col,
          'mono',
          'left',
        ),
      );
    }

    if (asking) {
      nodes.push(
        glassPlate(245, 396, 920, 84, { stroke: COSMOS.gold, glow: 10 }),
        txt(
          'Predict: which recipe shrinks shallow b the most?',
          245,
          396,
          32,
          COSMOS.gold,
          'serif',
        ).glow(6, COSMOS.gold),
      );
    } else {
      nodes.push(
        txt(
          'Same objective, start (1,1) & 40-step budget  ·  Recipe-specific rates',
          245,
          428,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(view3d, hud);
  orbitScene(s, c, view3d, { theta: -1.82, phi: 0.68, distance: 13.2 });

  pulseCue(s, c, 'comparison-prediction', predP, 1, { dur: 0.5 });
  // Strict prediction withholding: trajectories stay at (1, 1) until comparison-runs starts
  cueTo(s, c, 'comparison-runs', runP, 1, { dur: 3.4 });
}

// ---------------------------------------------------------------------------
// 12. schedule: What changes at a zero learning rate?
// Cues: schedule-zero-update [CB], schedule-warmup [CB], schedule-decay, schedule-late
// ---------------------------------------------------------------------------
export function schedule(s, c) {
  const zeroP = s.value(0); // step 1 at lr = 0
  const warmP = s.value(0); // steps 2..5 warmup ramp
  const decayP = s.value(0); // steps 6..40 cosine decay
  const lateP = s.value(0); // beat 2 compare last 5 updates vs constant Adam
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 12 }));
  s.add(aura(-280, -30, 480, '#2a588a28', '#151e3d10'));
  s.add(aura(460, 40, 440, '#ffd1661c', '#151e3d10'));

  const schedulePts = Array.from({ length: 40 }, (_, k) => [k + 1, scheduledRate(k)]);

  const stage = dynamic(() => {
    // Current completed update count (1..40)
    const stepPos =
      decayP.value > 0.01
        ? 5 + decayP.value * 35
        : warmP.value > 0.01
          ? 1 + warmP.value * 4
          : zeroP.value;
    const completed = Math.min(40, Math.floor(stepPos + 1e-9));
    const rec = completed >= 1 ? SCHEDULED.records[completed - 1] : null;
    const curW = rec ? rec.next : [1, 1];
    const curLr = rec ? rec.eta : 0;

    const plot = luminousPlot({
      cx: -275,
      cy: -62,
      width: 1020,
      height: 450,
      xDomain: [0, 41],
      yDomain: [0, 0.09],
      xTicks: [1, 5, 10, 20, 30, 40],
      yTicks: [0, 0.04, 0.08],
      xFmt: (v) => String(v),
      yFmt: (v) => num(v, 2),
      xLabel: 'completed update',
      yLabel: 'learning rate  η_t',
      accent: COSMOS.cyan,
    });

    const fullCurve = schedulePts.map(([t, lr]) => plot.map(t, lr));
    const drawnCount = Math.max(1, completed);
    const activeCurve = schedulePts.slice(0, drawnCount).map(([t, lr]) => plot.map(t, lr));

    const rx = 560;
    const nodes = [
      txt('WARMUP + COSINE LEARNING RATE SCHEDULE', -275, -396, 28, COSMOS.cyan, 'mono'),
      plot.node,
      // Faint guide curve for full 40-step schedule
      new Node(polyPath(fullCurve)).stroke('#385386', 2.2, 0.55),
    ];

    if (activeCurve.length >= 2) {
      nodes.push(
        glowingTrail(activeCurve, {
          gradientColors: [COSMOS.violet, COSMOS.cyan, COSMOS.gold],
          width: 5.2,
          glow: 12,
        }),
      );
    }

    // Current photon riding the schedule
    if (completed >= 1) {
      const [px, py] = plot.map(completed, curLr);
      nodes.push(
        glowDot(px, py, { radius: 10, color: COSMOS.gold, glow: 15 }),
        dot(4, '#ffffff').at(px, py),
      );
    }

    // Highlight last 5 updates band when comparing in Beat 2
    if (lateP.value > 0.04) {
      const x36 = plot.mapX(36);
      const x40 = plot.mapX(40);
      nodes.push(
        rect(x40 - x36 + 18, 450, {
          fill: '#ffd16618',
          stroke: COSMOS.gold,
          width: 2,
          radius: 8,
        })
          .at((x36 + x40) / 2, -62)
          .opacity(lateP.value),
      );
    }

    // Bottom horizontal parameter progress bar for a and b
    nodes.push(
      coordRuler({
        cx: -275,
        cy: 364,
        width: 1020,
        domain: [-0.2, 1.15],
        ticks: [0, 0.5, 1],
        tickFmt: (v) => num(v, 1),
        start: 1,
        end: curW[0],
        progress: completed >= 1 ? 1 : 0,
        color: COSMOS.cyan,
        label: 'Parameter dots (a, b) from (1, 1)',
        labelRight: `(a, b) = ${pairText(curW, 3)}`,
      }),
    );

    // Right column: non-overlapping P5 crossfade from live telemetry to Beat 2 comparison
    const liveOp = fadeOut(lateP.value);
    const cmpOp = fadeIn(lateP.value);

    if (liveOp > 0.02) {
      nodes.push(
        group(
          glassPlate(rx, 0, 560, 620, { stroke: COSMOS.cyan, glow: 6 }),
          txt('ADAM STATE TELEMETRY', rx, -252, 26, COSMOS.muted, 'mono'),
          txt(`Step counter   t = ${completed}`, rx - 240, -182, 32, COSMOS.gold, 'mono', 'left'),
          txt(
            `Active rate   η = ${num(curLr, 4)}`,
            rx - 240,
            -124,
            30,
            COSMOS.cyan,
            'mono',
            'left',
          ),
          line([rx - 240, -76], [rx + 240, -76], { stroke: '#2c3d66', width: 1.6 }),
          txt('Steep raw moments:', rx - 240, -24, 28, COSMOS.muted, 'sans', 'left'),
          txt(
            `m_a = ${rec ? num(rec.mean[0], 2) : '0.00'}`,
            rx - 240,
            34,
            34,
            COSMOS.cyan,
            'mono',
            'left',
          ),
          txt(
            `v_a = ${rec ? num(rec.square[0], 2) : '0.00'}`,
            rx - 240,
            92,
            34,
            COSMOS.gold,
            'mono',
            'left',
          ),
          line([rx - 240, 144], [rx + 240, 144], { stroke: '#2c3d66', width: 1.6 }),
          txt(
            completed === 1
              ? 'η = 0: dots hold, moments fill!'
              : completed <= 5
                ? 'Warmup ramps η to peak 0.08'
                : completed < 40
                  ? 'Cosine decays η smoothly to 0'
                  : `Residual loss = ${num(SCHEDULED.records.at(-1).loss, 4)}`,
            rx,
            218,
            28,
            COSMOS.emerald,
            'sans',
          ),
        ).opacity(liveOp),
      );
    }

    if (cmpOp > 0.02) {
      const schedEnd = SCHEDULED.records.at(-1);
      const constEnd = RUNS.adam.records.at(-1);
      nodes.push(
        group(
          glassPlate(rx, 0, 560, 620, { stroke: COSMOS.gold, glow: 10 }),
          txt('LAST 5 UPDATES COMPARISON', rx, -252, 26, COSMOS.gold, 'mono'),
          txt('Same start, loss & 40-step budget', rx, -198, 26, COSMOS.muted, 'sans'),
          line([rx - 240, -152], [rx + 240, -152], { stroke: '#2c3d66', width: 1.6 }),
          txt('Warmup + Cosine Adam', rx - 240, -96, 30, COSMOS.cyan, 'serif', 'left'),
          txt(`w₄₀ = ${pairText(schedEnd.next, 3)}`, rx - 240, -40, 28, COSMOS.ink, 'mono', 'left'),
          txt(`Loss = ${num(schedEnd.loss, 4)}`, rx - 240, 12, 32, COSMOS.cyan, 'mono', 'left'),
          line([rx - 240, 62], [rx + 240, 62], { stroke: '#2c3d66', width: 1.6 }),
          txt('Constant-rate Adam (η = 0.08)', rx - 240, 114, 30, COSMOS.emerald, 'serif', 'left'),
          txt(`w₄₀ = ${pairText(constEnd.next, 3)}`, rx - 240, 170, 28, COSMOS.ink, 'mono', 'left'),
          txt(`Loss = ${num(constEnd.loss, 4)}`, rx - 240, 222, 32, COSMOS.emerald, 'mono', 'left'),
          txt('Tune peak & decay on validation', rx, 280, 26, COSMOS.gold, 'sans'),
        ).opacity(cmpOp),
      );
    }

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  // Strict CB withholding for zero-update & warmup start
  cueTo(s, c, 'schedule-zero-update', zeroP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'schedule-warmup', warmP, 1, { after: true, dur: 0.4 });
  cueTo(s, c, 'schedule-decay', decayP, 1, { dur: 2.6 });
  cueTo(s, c, 'schedule-late', lateP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 13. accumulation: How much does each item count?
// Cues: accum-items, accum-derivatives, accum-full, accum-groups, accum-divide,
//       accum-wrong [CB], accum-wrong-step [CB], accum-weights,
//       accum-correct-gradient [CB], accum-repair [CB], accum-forward,
//       effective-batch, window-backward, window-unscale, window-clip,
//       window-step, window-schedule, window-clear
// ---------------------------------------------------------------------------
export function accumulation(s, c) {
  const mode = s.value(0); // 0 = item share ribbon (beats 0-1), 1 = distributed AMP window (beat 2)
  const itemsP = s.value(0);
  const derivP = s.value(0);
  const fullP = s.value(0);
  const groupsP = s.value(0);
  const dividerP = s.value(0); // 0 -> 1 (equal 50/50), then back to 0 (item-weighted 1/3, 2/3)
  const wrongGradP = s.value(0);
  const wrongStepP = s.value(0);
  const repairedGradP = s.value(0);
  const repairedStepP = s.value(0);
  const forwardP = s.value(0);

  // Beat 2 cues
  const effBatchP = s.value(0);
  const pipeStage = s.value(0); // 1..6 across backward -> unscale -> clip -> step -> schedule -> clear
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 13 }));
  s.add(aura(-360, -20, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 40, 480, '#ffd1661c', '#151e3d10'));

  // Beats 0-1: Proportional microbatch share ribbon + SGD endpoint comparison
  const ribbonView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const grouped = groupsP.value > 0.3;
      const showGrads = derivP.value > 0.3;
      const showFrac = dividerP.value > 0.05 || repairedGradP.value > 0.1;
      const repaired = repairedGradP.value > 0.3;

      const nodes = [
        txt('GRADIENT ACCUMULATION  ·  UNEQUAL MICROBATCHES', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt(
          'Prediction w = 1  ·  Targets (0, 2, 4)  ·  g_i = 2(w − y_i)',
          0,
          -372,
          30,
          COSMOS.muted,
          'mono',
        ),
        shareRibbon(ACCUMULATION, {
          cx: 0,
          cy: -140,
          width: 1460,
          height: 152,
          equalP: dividerP.value,
          grouped,
          showGradients: showGrads,
          showFractions: showFrac,
          showMeans: grouped,
        }),
      ];

      // Beat 0 lower half: Squared-error geometry & full-batch reference (always anchored cleanly!)
      if (!grouped) {
        nodes.push(
          glassPlate(0, 195, 1460, 290, {
            stroke: fullP.value > 0.1 ? COSMOS.emerald : '#344774',
            glow: fullP.value > 0.1 ? 8 : 4,
          }),
          txt(
            fullP.value > 0.1
              ? 'Full 3-item mean gradient = (+2 − 2 − 6) / 3 = −2'
              : 'Squared error residuals at prediction w = 1',
            0,
            106,
            30,
            fullP.value > 0.1 ? COSMOS.emerald : COSMOS.cyan,
            'mono',
          ),
          coordRuler({
            cx: 0,
            cy: 236,
            width: 1260,
            domain: [-0.4, 4.4],
            ticks: [0, 1, 2, 3, 4],
            tickFmt: (v) => num(v, 0),
            start: 1,
            end: 4,
            progress: derivP.value > 0.1 ? 1 : 0.35,
            color: COSMOS.cyan,
            label: 'Prediction w = 1 vs targets y ∈ {0, 2, 4}',
            labelRight: derivP.value > 0.1 ? 'g = (+2, −2, −6)' : 'g_i = 2(w − y_i)',
          }),
        );
      }

      // Beat 0 question before divider slides
      if (grouped && dividerP.value < 0.04 && wrongGradP.value < 0.04 && !repaired) {
        nodes.push(
          glassPlate(0, 165, 1220, 130, { stroke: COSMOS.gold, glow: 10 }),
          txt('Give each batch half the strip (50% / 50%)', 0, 136, 30, COSMOS.muted, 'sans'),
          txt('How much say does item 1 get?', 0, 194, 40, COSMOS.gold, 'serif').glow(
            8,
            COSMOS.gold,
          ),
        );
      }

      // Beat 1: Equal-batch wrong result vs Item-weighted repaired result on shared SGD ruler
      if (dividerP.value > 0.04 || wrongGradP.value > 0.04 || repaired) {
        const activeG = repaired
          ? 'Accumulated g = (1/3)(+2) + (2/3)(−4) = −2'
          : wrongGradP.value > 0.3
            ? 'Equal-batch mean = (+2 − 4) / 2 = −1'
            : 'Combined gradient = ?';
        const activeCol = repaired ? COSMOS.emerald : COSMOS.rose;
        nodes.push(
          glassPlate(0, 118, 1260, 88, { stroke: activeCol, glow: 8 }),
          txt(activeG, 0, 118, 32, activeCol, 'mono'),
          coordRuler({
            cx: 0,
            cy: 268,
            width: 1320,
            domain: [0.95, 1.25],
            ticks: [1.0, 1.1, 1.2],
            tickFmt: (v) => num(v, 1),
            start: 1.0,
            end: repairedStepP.value > 0.05 ? 1.2 : 1.1,
            progress: repairedStepP.value > 0.05 ? repairedStepP.value : wrongStepP.value,
            color: repairedStepP.value > 0.05 ? COSMOS.emerald : COSMOS.rose,
            label: 'SGD step (η = 0.1) from w = 1.0',
            labelRight:
              repairedStepP.value > 0.85
                ? 'w = 1.2  (matches full batch!)'
                : wrongStepP.value > 0.85
                  ? 'w = 1.1  (biased by item 1!)'
                  : 'pending step',
          }),
        );
      }

      if (forwardP.value > 0.04) {
        nodes.push(
          txt(
            'Also requires identical forward pass (watch BatchNorm / token counts)',
            0,
            396,
            28,
            COSMOS.gold,
            'sans',
          ).opacity(forwardP.value),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Distributed effective batch (2 processes x 3 microbatches x 4 items = 24) + 6-stage AMP window
  const windowView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const st = pipeStage.value;
      const nodes = [
        txt('DISTRIBUTED ACCUMULATION & AMP WINDOW', 0, -424, 28, COSMOS.gold, 'mono'),
        txt(
          effBatchP.value > 0.1
            ? '2 processes × 3 microbatches × 4 items  =  24 items per optimizer update'
            : 'Effective batch across distributed workers',
          0,
          -370,
          30,
          COSMOS.cyan,
          'mono',
        ),
      ];

      // 2 processes x 3 backward microbatch tiles
      for (let proc = 0; proc < 2; proc++) {
        const py = -225 + proc * 140;
        nodes.push(txt(`Process ${proc + 1}`, -790, py, 30, COSMOS.ink, 'mono', 'left'));
        for (let mb = 0; mb < 3; mb++) {
          const mx = -440 + mb * 310;
          const active = effBatchP.value > mb * 0.25;
          nodes.push(
            glassPlate(mx, py, 260, 96, {
              stroke: active ? (proc === 0 ? COSMOS.cyan : COSMOS.violet) : '#2c3d66',
              glow: active ? 8 : 3,
            }),
            txt(`Pass ${mb + 1}: 4 items`, mx, py, 28, active ? COSMOS.ink : COSMOS.muted, 'mono'),
          );
        }
      }
      // Effective batch total plate on right
      nodes.push(
        glassPlate(585, -155, 440, 236, { stroke: COSMOS.gold, glow: 10 }),
        txt('EFFECTIVE BATCH', 585, -220, 26, COSMOS.muted, 'mono'),
        txt('24', 585, -142, 82, COSMOS.gold, 'mono').glow(12, COSMOS.gold),
        txt('1 optimizer update', 585, -72, 28, COSMOS.emerald, 'sans'),
      );

      // 6-stage AMP window execution pipeline across bottom half
      const stages = [
        { label: '1. All Backwards', sub: 'fixed scale', col: COSMOS.cyan },
        { label: '2. Unscale Once', sub: 'real units', col: COSMOS.gold },
        { label: '3. Clip Once', sub: 'global norm', col: COSMOS.violet },
        { label: '4. Opt Step', sub: '1 update', col: COSMOS.emerald },
        { label: '5. Schedule', sub: 'if step ran', col: COSMOS.blue },
        { label: '6. Zero Grad', sub: 'next window', col: COSMOS.muted },
      ];
      stages.forEach((sg, idx) => {
        const sx = -710 + idx * 284;
        const sy = 175;
        const lit = st >= idx + 0.5;
        nodes.push(
          glassPlate(sx, sy, 250, 154, {
            stroke: lit ? sg.col : '#2c3d66',
            glow: lit ? 10 : 3,
          }),
          txt(sg.label, sx, sy - 22, 26, lit ? sg.col : COSMOS.muted, 'sans'),
          txt(sg.sub, sx, sy + 30, 26, lit ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
        if (idx < 5) {
          nodes.push(
            photonWire(
              [
                [sx + 128, sy],
                [sx + 156, sy],
              ],
              drift.value * 3 + idx * 0.2,
              { color: lit ? sg.col : '#344774', width: 3, glow: 6 },
            ),
          );
        }
      });

      nodes.push(
        txt(
          'Keep AMP loss scale fixed across the whole accumulation window',
          0,
          360,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(ribbonView, windowView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'accum-items', itemsP, 1, { dur: 0.4 });
  pulseCue(s, c, 'accum-derivatives', derivP, 1, { dur: 0.45 });
  pulseCue(s, c, 'accum-full', fullP, 1, { dur: 0.45 });
  pulseCue(s, c, 'accum-groups', groupsP, 1, { dur: 0.5 });

  cueTo(s, c, 'accum-divide', dividerP, 1, { dur: 0.7 });
  cueTo(s, c, 'accum-wrong', wrongGradP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'accum-wrong-step', wrongStepP, 1, { after: true, dur: 0.38 });
  cueTo(s, c, 'accum-weights', dividerP, 0, { dur: 0.7 });
  cueTo(s, c, 'accum-correct-gradient', repairedGradP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'accum-repair', repairedStepP, 1, { after: true, dur: 0.38 });
  pulseCue(s, c, 'accum-forward', forwardP, 1, { dur: 0.45 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'effective-batch', effBatchP, 1, { dur: 0.8 });
  cueTo(s, c, 'window-backward', pipeStage, 1, { dur: 0.35 });
  cueTo(s, c, 'window-unscale', pipeStage, 2, { dur: 0.35 });
  cueTo(s, c, 'window-clip', pipeStage, 3, { dur: 0.35 });
  cueTo(s, c, 'window-step', pipeStage, 4, { dur: 0.35 });
  cueTo(s, c, 'window-schedule', pipeStage, 5, { dur: 0.35 });
  cueTo(s, c, 'window-clear', pipeStage, 6, { dur: 0.35 });
}

// ---------------------------------------------------------------------------
// 14. clipping: Which gradient reaches AdamW?
// Cues: clip-rule, clip-ordinary, clip-outlier, clip-factor,
//       clip-moments, clip-boundary, clip-normalized,
//       clip-observe, clip-nonfinite, clip-zero, clip-frequency
// ---------------------------------------------------------------------------
export function clipping(s, c) {
  const mode = s.value(0); // 0 = dual-scale geometry (beat 0), 1 = Adam buffers vs step (beat 1), 2 = log & NaN (beat 2)
  const ordP = s.value(0);
  const outP = s.value(0);
  const ruleP = s.value(0);
  const pullP = s.value(0);
  const momP = s.value(0);
  const boundP = s.value(0);
  const normP = s.value(0);
  const obsP = s.value(0);
  const nanP = s.value(0);
  const zeroP = s.value(0);
  const freqP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 14 }));
  s.add(aura(-430, 0, 460, '#2a588a24', '#151e3d10'));
  s.add(aura(430, 0, 460, '#ffd1661c', '#151e3d10'));

  const clipEq = glowTex(String.raw`g_{\text{used}} = \min\!\left(1,\;\frac{c}{\|g\|_2}\right) g`, {
    x: 0,
    y: 344,
    size: 38,
    color: COSMOS.gold,
    glow: 8,
  });

  // Beat 0: Dual-scale gradient clipping sphere/arc (Full scale 0..500 + Detail 0..6)
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const isOutlier = outP.value > 0.2;
      const raw = isOutlier ? [300, 400] : [3, 4];
      const used = [3, 4];
      const cur = isOutlier
        ? [raw[0] + (used[0] - raw[0]) * pullP.value, raw[1] + (used[1] - raw[1]) * pullP.value]
        : [raw[0] * ordP.value, raw[1] * ordP.value];

      const plots = [
        {
          cx: -435,
          max: 500,
          ticks: [0, 300, 500],
          yTicks: [0, 400, 500],
          title: 'Full scale  (0..500)',
        },
        { cx: 435, max: 6, ticks: [0, 3, 6], yTicks: [0, 4, 6], title: 'Detail near zero  (0..6)' },
      ];

      const nodes = [
        txt('GLOBAL-NORM GRADIENT CLIPPING  (THRESHOLD c = 5)', 0, -424, 28, COSMOS.gold, 'mono'),
        txt(
          pullP.value > 0.85
            ? 'Pulled back along the exact same ray:  (300, 400) × 0.01 = (3, 4)'
            : isOutlier
              ? 'Outlier spike:  g = (300, 400)   ·   ‖g‖₂ = 500'
              : 'Ordinary input:  g = (3, 4)   ·   ‖g‖₂ = 5  (inside arc)',
          0,
          -370,
          30,
          COSMOS.ink,
          'mono',
        ),
      ];

      plots.forEach((cfg, idx) => {
        const pl = luminousPlot({
          cx: cfg.cx,
          cy: -16,
          width: 560,
          height: 450,
          xDomain: [0, cfg.max],
          yDomain: [0, cfg.max],
          xTicks: cfg.ticks,
          yTicks: cfg.yTicks,
          xFmt: (v) => String(v),
          yFmt: (v) => String(v),
          xLabel: 'gₐ',
          yLabel: 'g_b',
          accent: COSMOS.cyan,
        });
        nodes.push(txt(cfg.title, cfg.cx, -284, 30, COSMOS.muted, 'sans'), pl.node);

        // Clipping radius c = 5 arc
        const arcPts = [];
        for (let i = 0; i <= 48; i++) {
          const th = (i / 48) * (Math.PI / 2);
          arcPts.push(pl.map(5 * Math.cos(th), 5 * Math.sin(th)));
        }
        nodes.push(glowingTrail(arcPts, { color: COSMOS.gold, width: 4.2, glow: 10 }));

        // Ghost outlier ray on full scale
        const oPt = pl.map(0, 0);
        if (isOutlier && idx === 0) {
          const rTip = pl.map(300, 400);
          nodes.push(
            line(oPt, rTip, { stroke: COSMOS.rose, width: 2.6, dash: [6, 8] }).opacity(0.75),
            circle(9, { fill: COSMOS.bg, stroke: COSMOS.rose, width: 2.8 }).at(rTip[0], rTip[1]),
          );
        }

        // Active gradient arrow
        const maxCoord = Math.max(cur[0], cur[1]);
        if (maxCoord > 0.05) {
          const frac = Math.min(1, cfg.max / Math.max(cfg.max, maxCoord));
          const tPt = pl.map(cur[0] * frac, cur[1] * frac);
          const col = isOutlier && pullP.value < 0.85 ? COSMOS.rose : COSMOS.cyan;
          if (frac >= 0.999) {
            nodes.push(arrow(oPt, tPt, { stroke: col, width: 5.5, tip: 14 }).glow(10, col));
          } else {
            nodes.push(
              line(oPt, tPt, { stroke: col, width: 5 }).glow(8, col),
              txt('Tip off-scale →', cfg.cx - 80, -180, 26, COSMOS.rose, 'mono'),
            );
          }
        }
      });

      if (ruleP.value > 0.04) nodes.push(clipEq.opacity(ruleP.value));
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Raw vs Clipped in fresh Adam -> buffers differ 100x, first step arrows match!
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const mP = momP.value;
      const nP = normP.value;
      const cols = [
        {
          cx: -440,
          title: 'Raw Input  (300, 400)',
          m: '(30, 40)',
          v: '(90, 160)',
          col: COSMOS.rose,
        },
        {
          cx: 440,
          title: 'Clipped Input  (3, 4)',
          m: '(0.3, 0.4)',
          v: '(0.009, 0.016)',
          col: COSMOS.emerald,
        },
      ];
      const nodes = [
        txt(
          'CLIPPING CHANGES STORED STATE, NOT FIRST NORMALIZED STEP',
          0,
          -424,
          28,
          COSMOS.cyan,
          'mono',
        ),
        txt(
          'Fresh Adam  ·  η = 0.01  ·  ε = 10⁻⁸  ·  Compare step 1',
          0,
          -372,
          30,
          COSMOS.muted,
          'mono',
        ),
      ];

      cols.forEach((cfg) => {
        nodes.push(
          glassPlate(cfg.cx, -145, 720, 320, { stroke: cfg.col, glow: 8 }),
          txt(cfg.title, cfg.cx, -255, 34, cfg.col, 'serif'),
          txt(mP > 0.2 ? `m₁ = ${cfg.m}` : 'm₁ = ?', cfg.cx, -170, 34, COSMOS.cyan, 'mono'),
          txt(mP > 0.2 ? `v₁ = ${cfg.v}` : 'v₁ = ?', cfg.cx, -96, 34, COSMOS.gold, 'mono'),
          txt(
            cfg.cx < 0 ? '100× larger m₁, 10000× larger v₁' : 'Shielded moment scale',
            cfg.cx,
            -26,
            26,
            COSMOS.muted,
            'sans',
          ),
          // First normalized update arrow box
          glassPlate(cfg.cx, 210, 720, 210, {
            stroke: nP > 0.1 ? cfg.col : '#2c3d66',
            glow: nP > 0.1 ? 8 : 3,
          }),
          txt('FIRST NORMALIZED UPDATE', cfg.cx, 146, 26, COSMOS.muted, 'mono'),
          arrow([cfg.cx - 180, 212], [cfg.cx - 180 + 360 * nP, 212], {
            stroke: cfg.col,
            width: 6,
            tip: 15,
          })
            .glow(10, cfg.col)
            .opacity(Math.max(0.1, nP)),
          txt(
            nP > 0.6 ? 'Subtracted step ≈ (0.01, 0.01)' : 'Subtracted step = ?',
            cfg.cx,
            274,
            32,
            cfg.col,
            'mono',
          ),
        );
      });

      if (boundP.value > 0.04) {
        nodes.push(
          txt(
            'Clipping shapes what Adam remembers; AdamW decay runs separately',
            0,
            386,
            30,
            COSMOS.gold,
            'sans',
          ).opacity(boundP.value),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Pre-clipping log telemetry, NaN rejection shield, zero pass-through, clip fraction 1/2
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const colX = [-600, -210, 180, 580];
      const nodes = [
        txt('PRE-CLIPPING NORM LOG & NONFINITE GUARD', 0, -424, 28, COSMOS.gold, 'mono'),
        txt('Threshold c = 5  ·  error_if_nonfinite=True', 0, -372, 30, COSMOS.muted, 'mono'),
        txt('INPUT', colX[0], -282, 26, COSMOS.muted, 'mono'),
        txt('PRE-CLIP NORM', colX[1], -282, 26, COSMOS.muted, 'mono'),
        txt('USED NORM', colX[2], -282, 26, COSMOS.muted, 'mono'),
        txt('UPDATE COUNT', colX[3], -282, 26, COSMOS.muted, 'mono'),
      ];

      const logRows = [
        {
          y: -186,
          inp: '(3, 4)',
          pre: '5.0',
          used: '5.0  (pass)',
          cnt: '1',
          col: COSMOS.cyan,
          vis: obsP.value,
        },
        {
          y: -62,
          inp: '(300, 400)',
          pre: '500.0',
          used: '5.0  (clipped)',
          cnt: '2',
          col: COSMOS.gold,
          vis: obsP.value,
        },
        {
          y: 68,
          inp: 'NaN batch',
          pre: 'NaN',
          used: 'REJECTED',
          cnt: 'Still 2',
          col: COSMOS.rose,
          vis: nanP.value,
        },
      ];

      for (const r of logRows) {
        nodes.push(
          glassPlate(0, r.y, 1520, 96, {
            stroke: r.vis > 0.1 ? r.col : '#344774',
            glow: r.vis > 0.1 ? 6 : 2,
          }),
        );
        if (r.vis > 0.04) {
          nodes.push(
            group(
              txt(r.inp, colX[0], r.y, 32, r.col, 'mono'),
              txt(r.pre, colX[1], r.y, 32, COSMOS.ink, 'mono'),
              txt(r.used, colX[2], r.y, 32, r.col, 'mono'),
              txt(r.cnt, colX[3], r.y, 32, r.col, 'mono'),
            ).opacity(r.vis),
          );
        }
      }

      nodes.push(
        glassPlate(-390, 250, 740, 120, {
          stroke: zeroP.value > 0.1 ? COSMOS.cyan : '#344774',
          glow: zeroP.value > 0.1 ? 6 : 2,
        }),
        txt('Zero gradient check:  (0, 0) → (0, 0)', -390, 250, 30, COSMOS.cyan, 'mono').opacity(
          Math.max(0.25, zeroP.value),
        ),
        glassPlate(390, 250, 740, 120, {
          stroke: freqP.value > 0.1 ? COSMOS.gold : '#344774',
          glow: freqP.value > 0.1 ? 8 : 2,
        }),
        txt('Clipped = 1 / 2  (watch if high)', 390, 250, 28, COSMOS.gold, 'mono').opacity(
          Math.max(0.25, freqP.value),
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'clip-ordinary', ordP, 1, { dur: 0.7 });
  cueTo(s, c, 'clip-outlier', outP, 1, { dur: 0.7 });
  pulseCue(s, c, 'clip-rule', ruleP, 1, { dur: 0.55 });
  cueTo(s, c, 'clip-factor', pullP, 1, { dur: 0.95 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'clip-moments', momP, 1, { dur: 0.75 });
  pulseCue(s, c, 'clip-boundary', boundP, 1, { dur: 0.55 });
  cueTo(s, c, 'clip-normalized', normP, 1, { dur: 0.8 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'clip-observe', obsP, 1, { dur: 0.7 });
  cueTo(s, c, 'clip-nonfinite', nanP, 1, { dur: 0.7 });
  cueTo(s, c, 'clip-zero', zeroP, 1, { dur: 0.6 });
  cueTo(s, c, 'clip-frequency', freqP, 1, { dur: 0.6 });
}
