// Act 5: 3D 80-Update Cosine Budget Race & AMSGrad, Diagnostic Crossing & Held-Out Selection,
// Negative-Side Transfer Check, and End-to-End Capstone Fresh-Recipe Audit.
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
  AMSGRAD_SEQUENCE,
  COSMOS,
  DIAGNOSTIC_RUNS,
  EIGHTY,
  FRESH_RECIPE,
  HELD_OUT_TRIALS,
  TRANSFER_START,
  TRANSFER_STEPS,
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
  shareRibbon,
  signed,
  stageVis,
  txt,
  valleyZ,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 20. evidence-budget: What does the gradient history change?
// Cues: budget-inputs, budget-paths, finite-checks, recipe-rates, recipe-symmetry,
//       square-first, square-second, square-third, amsgrad-max
// ---------------------------------------------------------------------------
export function evidenceBudget(s, c) {
  const mode = s.value(0); // 0 = 3D 80-update cosine race, 1 = residual error bars, 2 = AMSGrad max
  const inP = s.value(0);
  const raceP = s.value(0);
  const barP = s.value(0);
  const rateP = s.value(0);
  const symP = s.value(0);
  const sq1 = s.value(0);
  const sq2 = s.value(0);
  const sq3 = s.value(0);
  const maxP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.42, seed: 20 }));
  s.add(aura(220, 0, 560, '#1e8a6b24', '#11162600'));

  // Beat 0: 3D 80-update cosine valley race (SGD vs AdamW)
  const view3d = cinematic3d({
    theta: -1.36,
    phi: 0.74,
    distance: 13.8,
    unit: 142,
    ambient: 0.36,
    shine: 0.35,
    brightness: 1.06,
    fog: 0.06,
    focus: [0, 0.45, 0.55],
  }).at(245, 20);

  const valleySurface = surface((x, y) => valleyZ(x / 1.8, y / 1.95, { scale: 0.6, maxZ: 2.6 }), {
    x: [-2.4, 2.4],
    y: [-0.8, 2.3],
    resolution: [38, 34],
    colors: ['#040712', '#0b1433', '#152559', '#1c407a', '#246c9e', '#329ec2'],
    mesh: '#5ce1e6',
    meshOpacity: 0.16,
    meshWidth: 0.55,
    opacity: 0.8,
  });
  const to3d = (a, b, lift = 0.12) => [
    Math.max(-2.35, Math.min(2.35, a * 1.8)),
    Math.max(-0.75, Math.min(2.25, b * 1.95)),
    valleyZ(a, b, { scale: 0.6, maxZ: 2.6 }) + lift,
  ];
  // Build reactive 3D trajectory chain over 40 sampled spans (covering all 80 exact evaluations!)
  const makeTrailSegments = (run, col, lift, width) =>
    Array.from({ length: 40 }, (_, idx) => {
      const i0 = idx < 20 ? idx : 20 + (idx - 20) * 3;
      const i1 = idx < 20 ? idx + 1 : Math.min(80, 20 + (idx - 19) * 3);
      const pA = [run.points[i0].x, run.points[i0].y];
      const pB = [run.points[i1].x, run.points[i1].y];
      return line3d(
        () => (raceP.value * 80 > i0 + 0.001 ? to3d(pA[0], pA[1], lift) : to3d(1, 1, lift)),
        () => {
          const curStep = raceP.value * 80;
          const segP = clamp((curStep - i0) / Math.max(1, i1 - i0));
          if (segP <= 0.001) return to3d(1, 1, lift);
          const a = pA[0] + (pB[0] - pA[0]) * segP;
          const b = pA[1] + (pB[1] - pA[1]) * segP;
          return to3d(a, b, lift);
        },
        { color: col, width, glow: 11, blend: 'screen', onTop: true },
      );
    });
  const makeHead = (run, col, lift) =>
    point3d(
      () => {
        const f = sampleRun(run, raceP.value, 0, 80);
        return to3d(f.interp[0], f.interp[1], lift + 0.06);
      },
      { color: col, radius: 9.5, glow: 16, blend: 'screen', onTop: true },
    );

  view3d.add(
    valleySurface,
    line3d([0, -0.75, 0.05], [0, 2.25, 0.05], { color: COSMOS.gold, width: 2, opacity: 0.55 }),
    point3d([0, 0, 0.14], {
      color: COSMOS.gold,
      radius: 8,
      glow: 14,
      blend: 'screen',
      onTop: true,
    }),
    ...makeTrailSegments(EIGHTY.sgd, COSMOS.blue, 0.12, 4.0),
    ...makeTrailSegments(EIGHTY.adamw, COSMOS.emerald, 0.19, 5.0),
    makeHead(EIGHTY.sgd, COSMOS.blue, 0.12),
    makeHead(EIGHTY.adamw, COSMOS.emerald, 0.19),
  );

  // Wrap 3D view + left telemetry inside stageVis(mode, 0)
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const fS = sampleRun(EIGHTY.sgd, raceP.value, 0, 80);
      const fA = sampleRun(EIGHTY.adamw, raceP.value, 0, 80);
      return group(
        view3d,
        txt('80-UPDATE COSINE VALLEY RACE', -855, -424, 26, COSMOS.emerald, 'mono', 'left'),
        txt('Same Budget', -855, -356, 56, COSMOS.ink, 'serif', 'left'),
        txt(`Evaluations:  ${fA.completed} / 80`, -855, -284, 30, COSMOS.gold, 'mono', 'left'),
        glassPlate(-575, -110, 560, 210, { stroke: COSMOS.blue, glow: inP.value > 0.1 ? 8 : 4 }),
        txt('SGD  (cosine peak 0.018)', -825, -176, 28, COSMOS.blue, 'mono', 'left'),
        txt(`w = ${pairText(fS.current, 4)}`, -825, -116, 28, COSMOS.ink, 'mono', 'left'),
        txt(`Loss = ${num(fS.currentLoss, 5)}`, -825, -56, 30, COSMOS.blue, 'mono', 'left'),
        glassPlate(-575, 148, 560, 210, { stroke: COSMOS.emerald, glow: inP.value > 0.1 ? 10 : 4 }),
        txt('AdamW  (peak 0.08, λ = 0.01)', -825, 82, 28, COSMOS.emerald, 'mono', 'left'),
        txt(`w = ${pairText(fA.current, 4)}`, -825, 142, 28, COSMOS.ink, 'mono', 'left'),
        txt(`Loss = ${num(fA.currentLoss, 5)}`, -825, 202, 30, COSMOS.emerald, 'mono', 'left'),
        txt(
          'Inspect both coordinates before interpreting loss',
          245,
          428,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  // Beat 1: Residual coordinate error bars (|a| and |b| against initial 1.0)
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const sLast = EIGHTY.sgd.records.at(-1).next;
      const aLast = EIGHTY.adamw.records.at(-1).next;
      const barW = 940;
      const groups = [
        { name: 'SGD  (peak 0.018)', w: sLast, col: COSMOS.blue, y: -175 },
        { name: 'AdamW  (peak 0.08, λ = 0.01)', w: aLast, col: COSMOS.emerald, y: 85 },
      ];
      const nodes = [
        txt('REMAINING COORDINATE ERRORS AFTER 80 UPDATES', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt('Full bar width = initial error 1.00000', 0, -372, 30, COSMOS.muted, 'sans'),
      ];

      for (const g of groups) {
        nodes.push(
          glassPlate(0, g.y + 40, 1520, 224, { stroke: g.col, glow: 8 }),
          txt(g.name, -720, g.y - 30, 32, g.col, 'serif', 'left'),
        );
        [0, 1].forEach((j) => {
          const yy = g.y + 34 + j * 66;
          const mag = Math.abs(g.w[j]);
          const fillW = Math.max(8, mag * barW * barP.value);
          nodes.push(
            txt(j === 0 ? '|a|' : '|b|', -720, yy, 28, g.col, 'mono', 'left'),
            rect(barW, 28, { fill: '#151f38', stroke: '#2c3d66', width: 1.6, radius: 14 }).at(
              -130,
              yy,
            ),
            rect(fillW, 28, { fill: g.col, stroke: null, radius: 14 })
              .at(-600 + fillW / 2, yy)
              .glow(8, g.col),
            txt(num(mag, 5), 400, yy, 30, g.col, 'mono', 'left'),
          );
        });
      }

      nodes.push(
        txt(
          rateP.value > 0.2
            ? 'Keep recipe peak rates beside endpoints (0.018 vs 0.08)'
            : 'Compare complete recipes at the same budget',
          0,
          312,
          30,
          COSMOS.gold,
          'sans',
        ),
        txt(
          symP.value > 0.2
            ? 'AdamW divisor grew 100× on a, keeping both coordinates balanced at 0.02158'
            : 'Balanced residual error along both axes',
          0,
          372,
          28,
          COSMOS.emerald,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: AMSGrad 3-gradient squared buffer [4, 0, 3] -> v = [0, 8, 4, 6.5] vs v_max = [0, 8, 8, 8]
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const { squared, maximum } = AMSGRAD_SEQUENCE;
      const plot = luminousPlot({
        cx: -210,
        cy: 26,
        width: 1080,
        height: 490,
        xDomain: [-0.15, 3.2],
        yDomain: [-0.3, 9.2],
        xTicks: [0, 1, 2, 3],
        yTicks: [0, 4, 8],
        xFmt: (v) => `t=${v}`,
        yFmt: (v) => String(v),
        xLabel: 'update (gradients: 4 → 0 → 3)',
        yLabel: 'squared buffer value',
        accent: COSMOS.cyan,
      });

      const segP = [sq1.value, sq2.value, sq3.value];
      const vPts = [plot.map(0, 0)];
      for (let i = 0; i < 3; i++) {
        if (segP[i] > 0.02) {
          const x = i + segP[i];
          const y = squared[i] + (squared[i + 1] - squared[i]) * segP[i];
          vPts.push(plot.map(x, y));
        }
      }
      const mPts = [plot.map(0, 0)];
      for (let i = 0; i < 3; i++) {
        const mp = clamp(maxP.value * 3 - i);
        if (mp > 0.02) {
          const x = i + mp;
          const y = maximum[i] + (maximum[i + 1] - maximum[i]) * mp;
          mPts.push(plot.map(x, y));
        }
      }

      const rx = 590;
      const nodes = [
        txt('WHEN A LARGE GRADIENT FADES  ·  ADAM VS AMSGRAD', -210, -396, 28, COSMOS.gold, 'mono'),
        txt(
          'Inputs: 4 → 0 → 3   ·   v_t = ½ v_{t−1} + ½ g_t²',
          -210,
          -342,
          30,
          COSMOS.muted,
          'mono',
        ),
        plot.node,
        glowDot(plot.mapX(0), plot.mapY(0), { radius: 8, color: COSMOS.cyan, glow: 10 }),
      ];

      if (vPts.length >= 2) {
        nodes.push(glowingTrail(vPts, { color: COSMOS.cyan, width: 5, glow: 12 }));
      }
      for (let i = 0; i < 3; i++) {
        if (segP[i] > 0.9) {
          const [px, py] = plot.map(i + 1, squared[i + 1]);
          nodes.push(
            glowDot(px, py, { radius: 9, color: COSMOS.cyan, glow: 14 }),
            txt(num(squared[i + 1], 1), px, py + 44, 30, COSMOS.cyan, 'mono'),
          );
        }
      }
      if (mPts.length >= 2) {
        nodes.push(glowingTrail(mPts, { color: COSMOS.emerald, width: 5.5, glow: 14 }));
      }

      nodes.push(
        glassPlate(rx, 26, 480, 490, { stroke: COSMOS.emerald, glow: 6 }),
        txt('ADAM v_t', rx, -152, 30, COSMOS.cyan, 'mono'),
        txt('8 → 4 → 6.5', rx, -96, 36, COSMOS.cyan, 'mono'),
        txt('Forgets the spike at t = 1', rx, -38, 26, COSMOS.muted, 'sans'),
        line([rx - 190, 20], [rx + 190, 20], { stroke: '#2c3d66', width: 1.6 }),
        txt('AMSGRAD max v_t', rx, 82, 30, COSMOS.emerald, 'mono'),
        txt(
          maxP.value > 0.4 ? 'Stays at 8.0' : 'Tracks running max',
          rx,
          144,
          38,
          COSMOS.emerald,
          'mono',
        ).glow(8, COSMOS.emerald),
        txt('Prevents step inflation', rx, 210, 26, COSMOS.muted, 'sans'),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  orbitScene(s, c, view3d, { theta: -1.82, phi: 0.68, distance: 13.2 });
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'budget-inputs', inP, 1, { dur: 0.5 });
  cueTo(s, c, 'budget-paths', raceP, 1, { dur: 3.0 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'finite-checks', barP, 1, { dur: 0.8 });
  pulseCue(s, c, 'recipe-rates', rateP, 1, { dur: 0.5 });
  pulseCue(s, c, 'recipe-symmetry', symP, 1, { dur: 0.5 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'square-first', sq1, 1, { dur: 0.7 });
  cueTo(s, c, 'square-second', sq2, 1, { dur: 0.7 });
  cueTo(s, c, 'square-third', sq3, 1, { dur: 0.7 });
  cueTo(s, c, 'amsgrad-max', maxP, 1, { dur: 0.95 });
}

// ---------------------------------------------------------------------------
// 21. diagnostic-trace: Which run would you keep?
// Cues: diagnostic-boundary, diagnostic-measure, diagnostic-compare, diagnostic-record,
//       trial-train, trial-held, diagnostic-validation [CB],
//       diagnostic-data, diagnostic-groups, diagnostic-frequency, diagnostic-bytes
// ---------------------------------------------------------------------------
export function diagnosticTrace(s, c) {
  const mode = s.value(0); // 0 = 12-step crossing (beats 0-1), 1 = held-out ruler (beat 2), 2 = 4 symptoms (beat 3)
  const bndP = s.value(0); // high peak up to update 5
  const measP = s.value(0);
  const cmpP = s.value(0); // both up to update 8
  const extP = s.value(0); // extend both to update 12
  const trP = s.value(0);
  const hdP = s.value(0);
  const valP = s.value(0);
  const symStage = s.value(0); // 1..4
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.rose, opacity: 0.44, seed: 21 }));
  s.add(aura(-320, 0, 480, '#ff6b8b1e', '#151e3d10'));
  s.add(aura(380, 0, 480, '#1e8a6b1e', '#151e3d10'));

  // Beats 0-1: 12-update loss crossing plot (Peak 0.8 vs Peak 0.4)
  const crossView = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const nHigh = Math.round(bndP.value * 5 + cmpP.value * 3 + extP.value * 4);
      const nLow = Math.round(cmpP.value * 8 + extP.value * 4);
      const stopTick = extP.value > 0.1 ? 12 : cmpP.value > 0.1 ? 8 : 5;

      const plot = luminousPlot({
        cx: -265,
        cy: 16,
        width: 1020,
        height: 540,
        xDomain: [0, 12.4],
        yDomain: [0, 62],
        xTicks: [0, 4, 8, 12],
        yTicks: [0, 30, 60],
        xFmt: (v) => String(v),
        yFmt: (v) => String(v),
        xLabel: 'completed updates',
        yLabel: 'training loss',
        accent: COSMOS.rose,
      });

      const highPts = [
        plot.map(0, loss(DIAGNOSTIC_RUNS.high.start)),
        ...DIAGNOSTIC_RUNS.high.records.slice(0, nHigh).map((r) => plot.map(r.t, r.loss)),
      ];
      const lowPts = [
        plot.map(0, loss(DIAGNOSTIC_RUNS.lower.start)),
        ...DIAGNOSTIC_RUNS.lower.records.slice(0, nLow).map((r) => plot.map(r.t, r.loss)),
      ];

      const rx = 560;
      const hLast =
        nHigh > 0 ? DIAGNOSTIC_RUNS.high.records[nHigh - 1].loss : loss(DIAGNOSTIC_RUNS.high.start);
      const lLast =
        nLow > 0 ? DIAGNOSTIC_RUNS.lower.records[nLow - 1].loss : loss(DIAGNOSTIC_RUNS.lower.start);
      const r5 = DIAGNOSTIC_RUNS.high.records[4];

      const nodes = [
        txt('WARMUP SPIKE & STOPPING-BUDGET CROSSING', -265, -396, 28, COSMOS.rose, 'mono'),
        plot.node,
        // Vertical checkpoint line
        line([plot.mapX(stopTick), plot.mapY(0)], [plot.mapX(stopTick), plot.mapY(60)], {
          stroke: COSMOS.gold,
          width: 2.2,
          dash: [6, 8],
        }),
      ];

      if (highPts.length >= 2) {
        nodes.push(
          glowingTrail(highPts, { color: COSMOS.rose, width: 4.8, glow: 12 }),
          glowDot(highPts.at(-1)[0], highPts.at(-1)[1], {
            radius: 9,
            color: COSMOS.rose,
            glow: 14,
          }),
        );
      }
      if (lowPts.length >= 2 && cmpP.value > 0.02) {
        nodes.push(
          glowingTrail(lowPts, { color: COSMOS.emerald, width: 4.8, glow: 12 }),
          glowDot(lowPts.at(-1)[0], lowPts.at(-1)[1], {
            radius: 9,
            color: COSMOS.emerald,
            glow: 14,
          }),
        );
      }

      nodes.push(
        glassPlate(rx, -110, 540, 220, { stroke: COSMOS.rose, glow: 6 }),
        txt('PEAK RATE  0.8', rx - 230, -172, 28, COSMOS.rose, 'mono', 'left'),
        txt(
          `At update ${nHigh}:  L = ${num(hLast, 2)}`,
          rx - 230,
          -112,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          measP.value > 0.2
            ? `Step 5: η = 0.8, ‖g‖ = ${num(Math.hypot(...r5.gradient), 2)}`
            : 'Spikes at peak warmup end',
          rx - 230,
          -48,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
        glassPlate(rx, 152, 540, 220, {
          stroke: cmpP.value > 0.1 ? COSMOS.emerald : '#2c3d66',
          glow: cmpP.value > 0.1 ? 8 : 3,
        }),
        txt('HALVED PEAK  0.4', rx - 230, 90, 28, COSMOS.emerald, 'mono', 'left'),
        txt(
          cmpP.value > 0.1 ? `At update ${nLow}:  L = ${num(lLast, 2)}` : 'Pending replay',
          rx - 230,
          150,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          extP.value > 0.85
            ? 'At 12, higher peak 0.8 overtakes!'
            : cmpP.value > 0.85
              ? 'At 8, lower peak leads. Still ahead at 12?'
              : 'Halve only the peak rate',
          rx - 230,
          214,
          26,
          COSMOS.gold,
          'sans',
          'left',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Held-out vs Training loss ruler (SGD wins held-out 0.28 < 0.35!)
  const heldView = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const nodes = [
        txt('TRAINING LOSS VS HELD-OUT SELECTION  (40 UPDATES)', 0, -424, 28, COSMOS.gold, 'mono'),
        txt(
          'Fixed data split  ·  Compare complete recipes on unseen data',
          0,
          -372,
          30,
          COSMOS.muted,
          'sans',
        ),
      ];

      HELD_OUT_TRIALS.forEach((tr, idx) => {
        const y = -130 + idx * 240;
        const x0 = -560;
        const w = 1280;
        const mapL = (v) => x0 + (v / 0.4) * w;

        nodes.push(
          glassPlate(0, y, 1540, 190, {
            stroke: idx === 0 && valP.value > 0.2 ? COSMOS.emerald : '#344774',
            glow: idx === 0 && valP.value > 0.2 ? 10 : 4,
          }),
          txt(tr.name, -740, y - 24, 38, COSMOS.ink, 'serif', 'left'),
          txt(`η = ${tr.rate}`, -740, y + 30, 28, COSMOS.muted, 'mono', 'left'),
          line([x0, y + 10], [x0 + w, y + 10], { stroke: '#5a6f9c', width: 3 }),
          ...[0, 0.1, 0.2, 0.3, 0.4].flatMap((tk) => [
            line([mapL(tk), y], [mapL(tk), y + 20], { stroke: '#7b8eb8', width: 2.2 }),
            txt(num(tk, 1), mapL(tk), y + 52, 26, COSMOS.muted, 'mono'),
          ]),
        );

        if (trP.value > 0.05) {
          const tx = mapL(tr.train);
          nodes.push(
            circle(13, { fill: COSMOS.bg, stroke: COSMOS.cyan, width: 4 })
              .at(tx, y + 10)
              .glow(10, COSMOS.cyan)
              .opacity(trP.value),
            txt(`Train ${num(tr.train, 2)}`, tx, y - 34, 28, COSMOS.cyan, 'mono').opacity(
              trP.value,
            ),
          );
        }
        if (hdP.value > 0.05) {
          const hx = mapL(tr.held);
          nodes.push(
            glowDot(hx, y + 10, { radius: 12, color: COSMOS.gold, glow: 14 }).opacity(hdP.value),
            txt(`Held-out ${num(tr.held, 2)}`, hx, y - 34, 28, COSMOS.gold, 'mono').opacity(
              hdP.value,
            ),
          );
        }
      });

      nodes.push(
        glassPlate(0, 326, 1340, 110, {
          stroke: valP.value > 0.2 ? COSMOS.emerald : '#2c3d66',
          glow: 8,
        }),
        txt(
          valP.value > 0.2
            ? 'SGD wins held-out (0.28 < 0.35)  ·  Keep SGD at this budget'
            : 'Which recipe would you keep for unseen data?',
          0,
          326,
          32,
          COSMOS.emerald,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 3: 4 live mini telemetry traces with floating captions (zero boxed prose cards)
  const matrixView = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const st = symStage.value;
      const nodes = [
        txt('READ OPTIMIZER FAILURES FROM LIVE TELEMETRY', 0, -424, 28, COSMOS.cyan, 'mono'),
      ];

      // 1 (top-left): NaN spike + AMP scale drop
      const lit1 = st >= 0.5;
      const op1 = lit1 ? 1 : 0.45;
      const x1 = -440;
      const y1 = -165;
      nodes.push(
        group(
          txt('1. NaN SPIKE & AMP SCALE DROP', x1, y1 - 125, 26, COSMOS.rose, 'mono'),
          line([x1 - 310, y1 + 25], [x1 + 310, y1 + 25], { stroke: '#344774', width: 2.4 }),
          glowingTrail(
            [
              [x1 - 300, y1 + 10],
              [x1 - 180, y1 + 5],
              [x1 - 60, y1 + 8],
              [x1 + 20, y1 - 85],
              [x1 + 80, y1 + 10],
              [x1 + 290, y1 + 12],
            ],
            { color: COSMOS.rose, width: 4, glow: lit1 ? 10 : 3 },
          ),
          // AMP scale stepping down in gold
          glowingTrail(
            [
              [x1 - 300, y1 - 55],
              [x1 + 20, y1 - 55],
              [x1 + 35, y1 - 5],
              [x1 + 290, y1 - 5],
            ],
            { color: COSMOS.gold, width: 3, glow: 6 },
          ),
          txt(
            lit1 ? 'Measure: batch data, pre-clip norm & AMP scale' : 'Nonfinite batch telemetry',
            x1,
            y1 + 82,
            26,
            lit1 ? COSMOS.ink : COSMOS.muted,
            'sans',
          ),
        ).opacity(op1),
      );

      // 2 (top-right): One group oscillating while peers stay flat
      const lit2 = st >= 1.5;
      const op2 = lit2 ? 1 : 0.45;
      const x2 = 440;
      const y2 = -165;
      const oscPts = [];
      for (let i = 0; i <= 24; i += 1) {
        const px = x2 - 290 + (i / 24) * 580;
        const py = y2 - 25 + Math.sin(i * 1.15) * 46;
        oscPts.push([px, py]);
      }
      nodes.push(
        group(
          txt('2. ONE GROUP OSCILLATES', x2, y2 - 125, 26, COSMOS.cyan, 'mono'),
          line([x2 - 310, y2 + 25], [x2 + 310, y2 + 25], { stroke: '#344774', width: 2.4 }),
          line([x2 - 290, y2 + 8], [x2 + 290, y2 + 8], { stroke: '#546b94', width: 2.6 }),
          line([x2 - 290, y2 - 4], [x2 + 290, y2 - 4], { stroke: '#546b94', width: 2.6 }),
          glowingTrail(oscPts, { color: COSMOS.cyan, width: 4, glow: lit2 ? 10 : 3 }),
          txt(
            lit2 ? 'Measure: per-group update norms & grad scales' : 'Group update-norm trace',
            x2,
            y2 + 82,
            26,
            lit2 ? COSMOS.ink : COSMOS.muted,
            'sans',
          ),
        ).opacity(op2),
      );

      // 3 (bottom-left): Pre-clip norm hammering above threshold line
      const lit3 = st >= 2.5;
      const op3 = lit3 ? 1 : 0.45;
      const x3 = -440;
      const y3 = 185;
      const clipPts = [
        [x3 - 290, y3 - 44],
        [x3 - 200, y3 - 76],
        [x3 - 110, y3 - 54],
        [x3 - 20, y3 - 82],
        [x3 + 70, y3 - 60],
        [x3 + 160, y3 - 88],
        [x3 + 290, y3 - 58],
      ];
      nodes.push(
        group(
          txt('3. CLIPPING FIRES EVERY STEP', x3, y3 - 135, 26, COSMOS.gold, 'mono'),
          line([x3 - 310, y3 + 25], [x3 + 310, y3 + 25], { stroke: '#344774', width: 2.4 }),
          line([x3 - 300, y3 - 22], [x3 + 300, y3 - 22], {
            stroke: COSMOS.rose,
            width: 3,
            dash: [10, 7],
          }),
          glowingTrail(clipPts, { color: COSMOS.gold, width: 4, glow: lit3 ? 10 : 3 }),
          txt(
            lit3 ? 'Measure: pre-clip norms, threshold & data' : 'Norm vs clip ceiling',
            x3,
            y3 + 82,
            26,
            lit3 ? COSMOS.ink : COSMOS.muted,
            'sans',
          ),
        ).opacity(op3),
      );

      // 4 (bottom-right): Optimizer state + activations overflowing VRAM ceiling before step 1
      const lit4 = st >= 3.5;
      const op4 = lit4 ? 1 : 0.45;
      const x4 = 440;
      const y4 = 185;
      nodes.push(
        group(
          txt('4. OOM BEFORE STEP 1', x4, y4 - 135, 26, COSMOS.emerald, 'mono'),
          // VRAM ceiling dashed line
          line([x4 - 300, y4 - 52], [x4 + 300, y4 - 52], {
            stroke: COSMOS.rose,
            width: 3,
            dash: [10, 7],
          }),
          txt('VRAM cap', x4 + 290, y4 - 76, 26, COSMOS.rose, 'mono', 'right'),
          // Stacked bars overflowing ceiling
          rect(150, 76, { fill: COSMOS.emerald, radius: 6 })
            .at(x4 - 90, y4 - 14)
            .glow(6, COSMOS.emerald),
          rect(150, 56, { fill: COSMOS.rose, radius: 6 })
            .at(x4 - 90, y4 - 84)
            .glow(8, COSMOS.rose),
          txt('State', x4 - 90, y4 - 14, 26, COSMOS.bg, 'mono'),
          txt('Actv', x4 - 90, y4 - 84, 26, COSMOS.ink, 'mono'),
          txt(
            lit4 ? 'Measure: optimizer-state bytes & activation peak' : 'Device memory overflow',
            x4,
            y4 + 82,
            26,
            lit4 ? COSMOS.ink : COSMOS.muted,
            'sans',
          ),
        ).opacity(op4),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(crossView, heldView, matrixView);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'diagnostic-boundary', bndP, 1, { dur: 1.1 });
  pulseCue(s, c, 'diagnostic-measure', measP, 1, { dur: 0.5 });
  cueTo(s, c, 'diagnostic-compare', cmpP, 1, { dur: 1.2 });
  cueTo(s, c, 'diagnostic-record', extP, 1, { dur: 1.5 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'trial-train', trP, 1, { dur: 0.65 });
  cueTo(s, c, 'trial-held', hdP, 1, { dur: 0.65 });
  cueTo(s, c, 'diagnostic-validation', valP, 1, { after: true, dur: 0.35 });

  c.onBeat(3, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'diagnostic-data', symStage, 1, { dur: 0.4 });
  cueTo(s, c, 'diagnostic-groups', symStage, 2, { dur: 0.4 });
  cueTo(s, c, 'diagnostic-frequency', symStage, 3, { dur: 0.4 });
  cueTo(s, c, 'diagnostic-bytes', symStage, 4, { dur: 0.4 });
}

// ---------------------------------------------------------------------------
// 22. transfer: Start on the other side of zero
// Cues: transfer-prediction, transfer-sgd, transfer-momentum [CB],
//       transfer-adam [CB], transfer-receipts
// ---------------------------------------------------------------------------
export function transfer(s, c) {
  const predP = s.value(0);
  const sgdP = s.value(0);
  const momP = s.value(0);
  const adamP = s.value(0);
  const recP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 22 }));
  s.add(aura(-300, 0, 500, '#2a588a24', '#151e3d10'));
  s.add(aura(360, 0, 500, '#ffd1661c', '#151e3d10'));

  const stage = dynamic(() => {
    const rows = [
      {
        name: 'SGD  (η = 0.018)',
        step: TRANSFER_STEPS.sgd,
        p: sgdP.value,
        col: COSMOS.blue,
        y: -170,
        note: 'Crosses 0 → +0.400',
      },
      {
        name: 'Momentum  (η = 0.018, β = 0.9)',
        step: TRANSFER_STEPS.momentum,
        p: momP.value,
        col: COSMOS.violet,
        y: 35,
        note: '1/10 of g₁ → −0.410',
      },
      {
        name: 'Adam  (η = 0.08)',
        step: TRANSFER_STEPS.adam,
        p: adamP.value,
        col: COSMOS.emerald,
        y: 240,
        note: 'Normalized → −0.420',
      },
    ];

    // Shared zero vertical line across all 3 rulers (domain [-0.65, 0.55])
    const x0 = -640;
    const w = 1280;
    const mapA = (v) => x0 + ((v + 0.65) / 1.2) * w;
    const zeroX = mapA(0);

    const nodes = [
      txt('TRANSFER CHECK  ·  START AT (a, b) = (−0.5, +0.5)', 0, -424, 28, COSMOS.gold, 'mono'),
      txt(
        predP.value > 0.2 && sgdP.value < 0.02
          ? 'Fresh buffers  ·  Which methods cross zero in coordinate a on step 1?'
          : 'g₁ = (−50, +0.5)  ·  Subtracting negative g_a moves every method right',
        0,
        -370,
        30,
        COSMOS.ink,
        'serif',
      ),
      // Glowing vertical zero fence spanning all three tracks
      line([zeroX, -260], [zeroX, 315], { stroke: COSMOS.gold, width: 3.2, dash: [8, 8] }).glow(
        8,
        COSMOS.gold,
      ),
      txt('a = 0', zeroX, -292, 28, COSMOS.gold, 'mono'),
    ];

    for (const r of rows) {
      nodes.push(
        glassPlate(0, r.y, 1520, 174, {
          stroke: r.p > 0.1 ? r.col : '#2c3d66',
          glow: r.p > 0.1 ? 8 : 3,
        }),
        coordRuler({
          cx: 0,
          cy: r.y + 18,
          width: w,
          domain: [-0.65, 0.55],
          ticks: [-0.5, -0.25, 0.25, 0.5],
          tickFmt: (v) => num(v, 2),
          start: TRANSFER_START[0],
          end: r.step.next[0],
          progress: r.p,
          color: r.col,
          label: r.name,
          labelRight:
            r.p > 0.85 ? `${r.note}   |   b₁ = ${num(r.step.next[1], 4)}` : 'Start a = −0.500',
        }),
      );
    }

    if (recP.value > 0.04) {
      nodes.push(
        txt(
          'Sign tells you which way  ·  Buffer & learning rate tell you how far',
          0,
          392,
          32,
          COSMOS.gold,
          'serif',
        ).opacity(recP.value),
      );
    }

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'transfer-prediction', predP, 1, { dur: 0.5 });
  cueTo(s, c, 'transfer-sgd', sgdP, 1, { dur: 0.8 });
  // Strict CB withholding for momentum & adam reveals
  cueTo(s, c, 'transfer-momentum', momP, 1, { after: true, dur: 0.38 });
  cueTo(s, c, 'transfer-adam', adamP, 1, { after: true, dur: 0.38 });
  pulseCue(s, c, 'transfer-receipts', recP, 1, { dur: 0.55 });
}

// ---------------------------------------------------------------------------
// 23. fresh-recipe: Can you check this update from the saved weight? (FINALE)
// Cues: fresh-inputs, fresh-means, fresh-gradient-question, fresh-item-weights,
//       fresh-weighted [CB], fresh-wrong [CB], fresh-clipped, fresh-step-question,
//       fresh-data-step [CB], fresh-old-weight, fresh-decay-term [CB],
//       fresh-final [CB], fresh-clock, fresh-replay, fresh-both-clipped [CB],
//       fresh-same-weight [CB], fresh-audit [CB]
// ---------------------------------------------------------------------------
export function freshRecipe(s, c) {
  const mode = s.value(0); // 0 = 5-item ribbon & clip (beats 0-1), 1 = AdamW ruler (beat 2), 2 = replay audit (beat 3)
  const inP = s.value(0);
  const meansP = s.value(0);
  const gQuestP = s.value(0);
  const wShareP = s.value(0);
  const wtdP = s.value(0);
  const wrgP = s.value(0);
  const clipP = s.value(0);
  const sQuestP = s.value(0);
  // Beat 2
  const dataP = s.value(0);
  const oldWP = s.value(0);
  const decP = s.value(0);
  const finP = s.value(0);
  const clkP = s.value(0);
  // Beat 3
  const repP = s.value(0);
  const bothClipP = s.value(0);
  const sameWP = s.value(0);
  const audP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 23 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 0, 480, '#ffd1661c', '#151e3d10'));

  const f = FRESH_RECIPE;

  const eqDataStep = glowTex(
    String.raw`\Delta w_{\text{data}} = -0.05\,\frac{-3}{\sqrt{9}} = +0.0500`,
    {
      x: -410,
      y: -250,
      size: 36,
      color: COSMOS.emerald,
      glow: 7,
    },
  );
  const eqDecStep = glowTex(String.raw`\Delta w_{\text{decay}} = -0.05\,(0.02)\,(2) = -0.0020`, {
    x: 425,
    y: -250,
    size: 36,
    color: COSMOS.gold,
    glow: 7,
  });

  // Beats 0-1: 5-target ribbon (1, 3, 4, 6, 6) -> gradient prediction -> weighted (-4) vs equal (-10/3) -> clip to -3
  const beat01View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const showRails = wShareP.value > 0.2 || wtdP.value > 0.05 || wrgP.value > 0.05;
      const nodes = [
        txt(
          'END-TO-END AUDIT  ·  PREDICTION w = 2  ·  5 TARGETS',
          0,
          -424,
          28,
          COSMOS.cyan,
          'mono',
        ),
        shareRibbon(f, {
          cx: 0,
          cy: -215,
          width: 1480,
          height: 144,
          equalP: 0,
          grouped: inP.value > 0.1 || meansP.value > 0.1,
          showGradients: meansP.value > 0.2,
          showFractions: wShareP.value > 0.2,
          showMeans: meansP.value > 0.5,
        }),
      ];

      if (!showRails) {
        nodes.push(
          txt('Batch 1 mean = 0   ·   Batch 2 mean = −20/3', 0, 114, 30, COSMOS.muted, 'mono'),
          txt(
            gQuestP.value > 0.1
              ? 'What 5-item mean gradient should reach the clipper?'
              : 'Each item gradient = 2(w − y)',
            0,
            182,
            38,
            COSMOS.gold,
            'serif',
          ).glow(8, COSMOS.gold),
        );
      } else {
        // Two candidate gradients on aligned ruler from 0 to -4.5, with yellow clip fence at -3
        const x0 = -560;
        const w = 1120;
        const mapG = (g) => x0 + ((g + 4.6) / 4.8) * w;
        const clipX = mapG(-3);

        nodes.push(
          glassPlate(0, 156, 1520, 310, { stroke: '#344774', glow: 6 }),
          line([clipX, 24], [clipX, 285], { stroke: COSMOS.gold, width: 3.4, dash: [8, 8] })
            .glow(8, COSMOS.gold)
            .opacity(Math.max(0.25, clipP.value)),
          txt('Clip at −3', clipX, -26, 26, COSMOS.gold, 'mono'),
          // Item-weighted row (-4 -> clipped to -3)
          coordRuler({
            cx: 0,
            cy: 95,
            width: w,
            domain: [-4.6, 0.2],
            ticks: [-4, -2, -1, 0],
            tickFmt: (v) => num(v, 0),
            start: 0,
            end: f.weighted + (f.clipped - f.weighted) * clipP.value,
            progress: wtdP.value,
            color: COSMOS.emerald,
            label: 'Item-weighted (2/5, 3/5)',
            labelRight:
              clipP.value > 0.85 ? '−4 → clipped to −3' : wtdP.value > 0.85 ? 'g = −4.00' : '?',
          }),
          // Equal-batch row (-10/3)
          coordRuler({
            cx: 0,
            cy: 215,
            width: w,
            domain: [-4.6, 0.2],
            ticks: [-4, -2, -1, 0],
            tickFmt: (v) => num(v, 0),
            start: 0,
            end: f.wrong,
            progress: wrgP.value,
            color: COSMOS.rose,
            label: 'Equal-batch (1/2, 1/2)',
            labelRight: wrgP.value > 0.85 ? 'g = −10/3 ≈ −3.33' : '?',
          }),
          txt(
            sQuestP.value > 0.1
              ? 'AdamW (η = 0.05, λ = 0.02, ε = 0) with g = −3:  where does w = 2 land?'
              : 'Clip magnitude to 3 before AdamW buffers',
            0,
            372,
            32,
            COSMOS.gold,
            'serif',
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: AdamW parameter ruler (2.0000 -> +0.0500 data -> -0.0020 decay -> 2.0480)
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const x0 = -640;
      const w = 1280;
      const mapW = (val) => x0 + ((val - 1.995) / 0.062) * w;

      const nodes = [
        txt(
          'FIRST ADAMW UPDATE  ·  CORRECTED m = −3, v = 9, ε = 0',
          0,
          -424,
          28,
          COSMOS.emerald,
          'mono',
        ),
        glassPlate(0, 40, 1520, 340, { stroke: COSMOS.cyan, glow: 8 }),
        // Main parameter axis
        line([x0, 56], [x0 + w, 56], { stroke: '#5a6f9c', width: 3.4 }),
        ...[2.0, 2.01, 2.02, 2.03, 2.04, 2.05].flatMap((tk) => [
          line([mapW(tk), 44], [mapW(tk), 68], { stroke: '#8ea4d2', width: 2.4 }),
          txt(num(tk, 2), mapW(tk), 104, 26, COSMOS.muted, 'mono'),
        ]),
        // Start marker at w = 2.0
        circle(12, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3.4 }).at(mapW(2), 56),
      ];

      if (dataP.value > 0.04) {
        const dTip = mapW(2 + 0.05 * dataP.value);
        nodes.push(
          eqDataStep.opacity(dataP.value),
          arrow([mapW(2), 20], [dTip, 20], { stroke: COSMOS.emerald, width: 6, tip: 15 }).glow(
            12,
            COSMOS.emerald,
          ),
          txt('Data only: 2.0500', mapW(2.05), -24, 28, COSMOS.emerald, 'mono').opacity(
            dataP.value,
          ),
        );
      }

      if (oldWP.value > 0.04) {
        nodes.push(
          txt('Prior weight w₀ = 2.000', mapW(2.004), 160, 28, COSMOS.gold, 'mono').opacity(
            oldWP.value,
          ),
        );
      }

      if (decP.value > 0.04) {
        const sTip = mapW(2.05 - 0.002 * decP.value);
        nodes.push(
          eqDecStep.opacity(decP.value),
          arrow([mapW(2.05), -64], [sTip, -64], { stroke: COSMOS.gold, width: 6, tip: 14 }).glow(
            12,
            COSMOS.gold,
          ),
        );
      }

      if (finP.value > 0.04) {
        const fx = mapW(f.update.weight);
        nodes.push(
          glowDot(fx, 56, { radius: 13, color: COSMOS.cyan, glow: 16 }).opacity(finP.value),
          txt('Final w = 2.0480', mapW(2.045), 160, 34, COSMOS.cyan, 'mono')
            .glow(8, COSMOS.cyan)
            .opacity(finP.value),
        );
      }

      nodes.push(
        txt(
          clkP.value > 0.1
            ? '1 optimizer update for the whole window  ·  How can you tell which weighting a colleague used?'
            : finP.value > 0.5
              ? 'Completed optimizer updates: 1'
              : 'Completed optimizer updates: 0',
          0,
          326,
          30,
          COSMOS.gold,
          'serif',
        ).glow(6, COSMOS.gold),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 3: Replay audit: both raw gradients (-4 and -10/3) clip to -3 and save identical w = 2.048!
  const beat3View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const x0 = -560;
      const w = 1120;
      const mapG = (g) => x0 + ((g + 4.6) / 4.8) * w;
      const clipX = mapG(-3);

      const tracks = [
        {
          name: 'By item  (2/5, 3/5)',
          raw: f.weighted,
          rawLbl: '−4.00',
          y: -155,
          col: COSMOS.emerald,
        },
        { name: 'By batch (1/2, 1/2)', raw: f.wrong, rawLbl: '−10/3', y: 15, col: COSMOS.rose },
      ];

      const nodes = [
        txt(
          'PRE-CLIPPING AUDIT  ·  SAME SAVED WEIGHT, DIFFERENT OBJECTIVES',
          0,
          -424,
          28,
          COSMOS.gold,
          'mono',
        ),
        txt(
          'Open circles mark pre-clipping gradients before both collapse to −3',
          0,
          -370,
          30,
          COSMOS.muted,
          'sans',
        ),
        glassPlate(0, -56, 1520, 368, { stroke: '#344774', glow: 6 }),
        line([clipX, -216], [clipX, 108], { stroke: COSMOS.gold, width: 3.6, dash: [8, 8] }).glow(
          10,
          COSMOS.gold,
        ),
        txt('Clip threshold −3', clipX, -274, 28, COSMOS.gold, 'mono'),
      ];

      for (const t of tracks) {
        const curG = t.raw + (-3 - t.raw) * bothClipP.value;
        nodes.push(
          coordRuler({
            cx: 0,
            cy: t.y,
            width: w,
            domain: [-4.6, 0.2],
            ticks: [-4, -2, -1, 0],
            tickFmt: (v) => num(v, 0),
            start: 0,
            end: curG,
            progress: repP.value,
            color: t.col,
            label: t.name,
            labelRight: bothClipP.value > 0.8 ? `raw ${t.rawLbl} → clipped −3` : `raw ${t.rawLbl}`,
          }),
        );
        // Keep open circle at the distinct pre-clipping spot!
        if (repP.value > 0.3) {
          const rx = mapG(t.raw);
          nodes.push(
            circle(13, { fill: COSMOS.bg, stroke: t.col, width: 3.8 }).at(rx, t.y).glow(10, t.col),
          );
        }
      }

      if (sameWP.value > 0.04) {
        nodes.push(
          txt('Both runs save identical weight  w = 2.048', 0, 198, 38, COSMOS.cyan, 'mono')
            .glow(8, COSMOS.cyan)
            .opacity(sameWP.value),
        );
      }

      if (audP.value > 0.04) {
        nodes.push(
          txt(
            'Log item counts and pre-clipping gradients to account for every update',
            0,
            336,
            34,
            COSMOS.gold,
            'serif',
          )
            .glow(8, COSMOS.gold)
            .opacity(audP.value),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat01View, beat2View, beat3View);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'fresh-inputs', inP, 1, { dur: 0.45 });
  cueTo(s, c, 'fresh-means', meansP, 1, { dur: 0.8 });
  pulseCue(s, c, 'fresh-gradient-question', gQuestP, 1, { dur: 0.45 });

  pulseCue(s, c, 'fresh-item-weights', wShareP, 1, { dur: 0.45 });
  cueTo(s, c, 'fresh-weighted', wtdP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'fresh-wrong', wrgP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'fresh-clipped', clipP, 1, { dur: 0.65 });
  pulseCue(s, c, 'fresh-step-question', sQuestP, 1, { dur: 0.45 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'fresh-data-step', dataP, 1, { after: true, dur: 0.38 });
  pulseCue(s, c, 'fresh-old-weight', oldWP, 1, { dur: 0.45 });
  cueTo(s, c, 'fresh-decay-term', decP, 1, { after: true, dur: 0.38 });
  cueTo(s, c, 'fresh-final', finP, 1, { after: true, dur: 0.38 });
  pulseCue(s, c, 'fresh-clock', clkP, 1, { dur: 0.45 });

  c.onBeat(3, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'fresh-replay', repP, 1, { dur: 0.8 });
  cueTo(s, c, 'fresh-both-clipped', bothClipP, 1, { after: true, dur: 0.38 });
  cueTo(s, c, 'fresh-same-weight', sameWP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'fresh-audit', audP, 1, { after: true, dur: 0.35 });
}
