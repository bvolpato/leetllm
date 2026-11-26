// Act 4: AdamW Decoupled Weight Decay, Zero-Data & grad=None Branches,
// PyTorch 60-Step CPU Loop & AMP Order, Checkpoint Resume, and Optimizer State Memory / ZeRO.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  COUPLED,
  CPU_LOOP_TRACE,
  CPU_RESUME_TRACE,
  DECAY,
  ZERO_DECAY,
  aura,
  cinemaGrid,
  clamp,
  contourBowl,
  coordRuler,
  cueTo,
  glassPlate,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  livingDrift,
  luminousPlot,
  num,
  pairText,
  photonWire,
  polyPath,
  pulseCue,
  stageVis,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 15. decay: Keep shrinkage outside the adaptive step
// Cues: decay-data, decay-shrink, coupled-penalty, coupled-result
// ---------------------------------------------------------------------------
export function decay(s, c) {
  const dataP = s.value(0);
  const shrinkP = s.value(0);
  const penP = s.value(0);
  const coupP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.44, seed: 15 }));
  s.add(aura(-280, 10, 500, '#1e8a6b24', '#151e3d10'));
  s.add(aura(480, 10, 440, '#ffd1661c', '#151e3d10'));

  const eqAdamW = glowTex(
    String.raw`w_t = w_{t-1} - \eta\,\frac{\hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon} - \eta\,\lambda\,w_{t-1}`,
    { x: 0, y: -356, size: 34, color: COSMOS.gold, glow: 8 },
  );

  const stage = dynamic(() => {
    const dP = dataP.value;
    const sP = shrinkP.value;
    const cP = coupP.value;

    const bowl = contourBowl({
      cx: -320,
      cy: 68,
      width: 920,
      height: 580,
      aDomain: [0.88, 1.03],
      bDomain: [0.88, 1.03],
      levels: [40, 45, 50.5],
      aTicks: [0.9, 0.95, 1.0],
      bTicks: [0.9, 0.95, 1.0],
      accent: COSMOS.emerald,
    });

    const p0 = bowl.map(1, 1);
    const dataEnd = [1 + DECAY.dataUpdate[0], 1 + DECAY.dataUpdate[1]]; // (0.92, 0.92)
    const adamWEnd = DECAY.next; // (0.912, 0.912)
    const pData = bowl.map(1 + DECAY.dataUpdate[0] * dP, 1 + DECAY.dataUpdate[1] * dP);
    const pDecay = bowl.map(dataEnd[0] + DECAY.shrink[0] * sP, dataEnd[1] + DECAY.shrink[1] * sP);
    const pCoup = bowl.map(1 + COUPLED.update[0] * cP, 1 + COUPLED.update[1] * cP);

    const rx = 560;
    const nodes = [
      txt('DECOUPLED WEIGHT DECAY (ADAMW) VS COUPLED L2', 0, -456, 28, COSMOS.emerald, 'mono'),
      eqAdamW,
      bowl.node,
      circle(11, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3 }).at(p0[0], p0[1]),
      txt('Start (1, 1)', p0[0] - 110, p0[1] - 28, 26, COSMOS.ink, 'mono'),
    ];

    // 1. Adaptive data step (emerald)
    if (dP > 0.02) {
      nodes.push(
        arrow(p0, pData, { stroke: COSMOS.emerald, width: 6, tip: 15 }).glow(10, COSMOS.emerald),
        glowDot(pData[0], pData[1], { radius: 8.5, color: COSMOS.emerald, glow: 12 }),
      );
    }
    // 2. Decoupled shrink vector (gold)
    if (sP > 0.02) {
      nodes.push(
        arrow(pData, pDecay, { stroke: COSMOS.gold, width: 6, tip: 14 }).glow(12, COSMOS.gold),
        glowDot(pDecay[0], pDecay[1], { radius: 9.5, color: COSMOS.gold, glow: 14 }),
      );
      if (sP > 0.9) {
        nodes.push(
          txt('AdamW (0.912, 0.912)', pDecay[0] + 150, pDecay[1] + 44, 26, COSMOS.gold, 'mono'),
        );
      }
    }
    // 3. Coupled L2 offset marker (rose)
    if (cP > 0.02) {
      nodes.push(
        arrow([p0[0] + 10, p0[1] - 10], [pCoup[0] + 10, pCoup[1] - 10], {
          stroke: COSMOS.rose,
          width: 4.5,
          tip: 13,
        })
          .glow(8, COSMOS.rose)
          .opacity(cP),
      );
    }

    // Right breakdown plate
    nodes.push(
      glassPlate(rx, 68, 600, 580, { stroke: COSMOS.gold, glow: 6 }),
      txt('ADAMW (η = 0.08, λ = 0.1)', rx - 265, -174, 28, COSMOS.emerald, 'mono', 'left'),
      txt(
        dP > 0.2 ? '1. Data: (−0.080, −0.080)' : '1. Data step: pending',
        rx - 265,
        -114,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        sP > 0.2 ? '2. Shrink: (−0.008, −0.008)' : '2. Shrink: pending',
        rx - 265,
        -56,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sP > 0.8 ? `Endpoint: ${pairText(adamWEnd, 3)}` : 'Two separate inputs',
        rx - 265,
        4,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      line([rx - 265, 56], [rx + 265, 56], { stroke: '#2c3d66', width: 1.8 }),
      txt('COUPLED L2 IN LOSS', rx - 265, 108, 28, COSMOS.rose, 'mono', 'left'),
      txt(
        penP.value > 0.2 ? 'g_total = (100.1, 1.1) → m, v' : 'Penalty adds λw to gradient',
        rx - 265,
        166,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        cP > 0.2 ? `Endpoint: ${pairText(COUPLED.next, 3)}` : 'Coupled endpoint = ?',
        rx - 265,
        226,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        cP > 0.5 ? 'Adaptive division cancels λw!' : 'Specify coupled vs decoupled',
        rx - 265,
        290,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'decay-data', dataP, 1, { dur: 0.85 });
  cueTo(s, c, 'decay-shrink', shrinkP, 1, { dur: 0.85 });
  pulseCue(s, c, 'coupled-penalty', penP, 1, { dur: 0.55 });
  cueTo(s, c, 'coupled-result', coupP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 16. zero-data-decay: A zero gradient differs from no gradient
// Cues: zero-input, zero-shrink, zero-result, coupled-input,
//       coupled-penalty-gradient, coupled-data, coupled-end,
//       gradient-representation, zero-tensor, none-skip, old-moment-zero
// ---------------------------------------------------------------------------
export function zeroDataDecay(s, c) {
  const mode = s.value(0); // 0 = AdamW 9.99, 1 = Coupled L2 9.90 vs 9.99, 2 = 3 PyTorch state branches
  const zIn = s.value(0);
  const zShrink = s.value(0);
  const zRes = s.value(0);
  const cIn = s.value(0);
  const cGrad = s.value(0);
  const cData = s.value(0);
  const cEnd = s.value(0);
  const gRep = s.value(0);
  const zTen = s.value(0);
  const nSkip = s.value(0);
  const oldM = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 16 }));
  s.add(aura(-360, 0, 460, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 0, 460, '#ffd1661c', '#151e3d10'));

  const eqZeroDecay = glowTex(
    String.raw`\Delta\theta_{\text{decay}} = -0.1 \times 0.01 \times 10 = -0.01`,
    {
      x: 0,
      y: 175,
      size: 40,
      color: COSMOS.gold,
      glow: 8,
    },
  );

  // Beat 0: Isolated AdamW with g_data = 0, m = 0, v = 0 -> 10 -> 9.99
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const nodes = [
        txt('ISOLATE DECAY  ·  θ = 10, η = 0.1, λ = 0.01, g = 0', 0, -424, 28, COSMOS.gold, 'mono'),
        // Top pipeline showing data path stays zero
        glassPlate(-470, -250, 340, 110, {
          stroke: zIn.value > 0.1 ? COSMOS.cyan : '#2c3d66',
          glow: 6,
        }),
        txt('g_data = 0', -470, -250, 36, COSMOS.cyan, 'mono'),
        photonWire(
          [
            [-295, -250],
            [-185, -250],
          ],
          drift.value * 2.5,
          { color: COSMOS.cyan },
        ),
        glassPlate(0, -250, 360, 110, { stroke: COSMOS.cyan, glow: 6 }),
        txt('m = 0   ·   v = 0', 0, -250, 34, COSMOS.cyan, 'mono'),
        photonWire(
          [
            [185, -250],
            [295, -250],
          ],
          drift.value * 2.5 + 0.4,
          { color: COSMOS.cyan },
        ),
        glassPlate(470, -250, 340, 110, { stroke: COSMOS.cyan, glow: 6 }),
        txt('Data move = 0', 470, -250, 34, COSMOS.cyan, 'mono'),
        // Decoupled shrink rail
        glassPlate(0, -20, 1520, 210, { stroke: COSMOS.gold, glow: 8 }),
        coordRuler({
          cx: 0,
          cy: -4,
          width: 1340,
          domain: [9.985, 10.004],
          ticks: [9.99, 9.995, 10.0],
          tickFmt: (v) => num(v, 3),
          start: 10,
          end: 9.99,
          progress: zRes.value,
          color: COSMOS.gold,
          label: 'AdamW decoupled shrinkage directly on prior weight θ = 10',
          labelRight: zRes.value > 0.8 ? 'θ_new = 9.990' : 'θ_new = ?',
          showZero: false,
        }),
        glassPlate(0, 315, 1120, 112, {
          stroke: zRes.value > 0.2 ? COSMOS.emerald : '#2c3d66',
          glow: zRes.value > 0.2 ? 10 : 3,
        }),
        txt(
          zRes.value > 0.3
            ? 'New θ = 9.99  ·  Both m and v remain 0  ·  η controls shrinkage'
            : 'Shrinkage scales with η · λ · θ_old',
          0,
          315,
          30,
          COSMOS.emerald,
          'sans',
        ),
      ];
      if (zShrink.value > 0.04) nodes.push(eqZeroDecay.opacity(zShrink.value));
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Coupled L2 inside objective -> g_L2 = 0.1 -> normalized step of 0.1 -> θ ≈ 9.90 vs 9.99
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const nodes = [
        txt('COUPLED L2 PENALTY VS DECOUPLED ADAMW', 0, -424, 28, COSMOS.rose, 'mono'),
        glassPlate(0, -292, 1460, 116, {
          stroke: cIn.value > 0.1 ? COSMOS.rose : '#2c3d66',
          glow: 8,
        }),
        txt(
          cGrad.value > 0.2
            ? 'Penalty ½λθ²  →  g_L2 = λθ = 0.01 × 10 = 0.1  →  enters both Adam moments'
            : 'Penalty ½λθ² adds gradient λθ into Adam',
          0,
          -292,
          30,
          COSMOS.rose,
          'mono',
        ),
        // Coupled L2 rail -> 9.90
        glassPlate(0, -80, 1520, 196, { stroke: COSMOS.rose, glow: 8 }),
        coordRuler({
          cx: 0,
          cy: -64,
          width: 1340,
          domain: [9.86, 10.02],
          ticks: [9.9, 9.95, 9.99, 10.0],
          tickFmt: (v) => num(v, 2),
          start: 10,
          end: 9.9,
          progress: cData.value,
          color: COSMOS.rose,
          label: 'Coupled L2 Adam:  0.1 / (0.1 + ε) ≈ 1  →  step −η = −0.1',
          labelRight: cData.value > 0.8 ? 'θ ≈ 9.900  (10× larger shrink!)' : 'pending',
          showZero: false,
        }),
        // Decoupled AdamW rail -> 9.99
        glassPlate(0, 145, 1520, 196, { stroke: COSMOS.gold, glow: 8 }),
        coordRuler({
          cx: 0,
          cy: 161,
          width: 1340,
          domain: [9.86, 10.02],
          ticks: [9.9, 9.95, 9.99, 10.0],
          tickFmt: (v) => num(v, 2),
          start: 10,
          end: 9.99,
          progress: 1,
          color: COSMOS.gold,
          label: 'Decoupled AdamW comparison:  −ηλθ = −0.01',
          labelRight: 'θ = 9.990',
          showZero: false,
        }),
        txt(
          cEnd.value > 0.2
            ? 'Coupled ≈ 9.90 vs Decoupled = 9.99  ·  Inspect actual update rule'
            : 'Same θ, η, λ  ·  Completely different step size',
          0,
          340,
          32,
          COSMOS.emerald,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Three distinct PyTorch state conditions (zero tensor vs grad=None vs retained nonzero moments)
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const branches = [
        {
          y: -200,
          title: '1. Explicit zero tensor (g = 0, cold m = v = 0)',
          end: ZERO_DECAY.cold.weight,
          p: zTen.value,
          col: COSMOS.gold,
          res: 'Decay runs → θ = 9.990',
        },
        {
          y: 10,
          title: '2. Missing gradient (grad = None in PyTorch AdamW)',
          end: ZERO_DECAY.absent.weight,
          p: nSkip.value,
          col: COSMOS.cyan,
          res: 'Parameter skipped → θ stays 10.000',
        },
        {
          y: 220,
          title: '3. Zero tensor with retained old moments (m₁ = 1, v₁ = 0.1)',
          end: ZERO_DECAY.retained.weight,
          p: oldM.value,
          col: COSMOS.rose,
          res: `Old momentum moves θ → ${num(ZERO_DECAY.retained.weight, 3)}`,
        },
      ];

      const nodes = [
        txt(
          'GRADIENT REPRESENTATION & RETAINED STATE IN PYTORCH',
          0,
          -424,
          28,
          COSMOS.cyan,
          'mono',
        ),
        txt(
          'Same weight θ = 10  ·  Three distinct optimizer behaviors',
          0,
          -372,
          30,
          gRep.value > 0.1 ? COSMOS.ink : COSMOS.muted,
          'sans',
        ),
      ];

      for (const b of branches) {
        nodes.push(
          glassPlate(0, b.y, 1520, 180, {
            stroke: b.p > 0.1 ? b.col : '#2c3d66',
            glow: b.p > 0.1 ? 8 : 3,
          }),
          coordRuler({
            cx: 0,
            cy: b.y + 18,
            width: 1340,
            domain: [9.72, 10.02],
            ticks: [9.75, 9.85, 9.95, 10.0],
            tickFmt: (v) => num(v, 2),
            start: 10,
            end: b.end,
            progress: b.p,
            color: b.col,
            label: b.title,
            labelRight: b.p > 0.6 ? b.res : 'pending',
            showZero: false,
          }),
        );
      }

      nodes.push(
        txt(
          'Current gradient tensor alone does not specify the update',
          0,
          386,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'zero-input', zIn, 1, { dur: 0.45 });
  cueTo(s, c, 'zero-shrink', zShrink, 1, { dur: 0.65 });
  cueTo(s, c, 'zero-result', zRes, 1, { dur: 0.75 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  pulseCue(s, c, 'coupled-input', cIn, 1, { dur: 0.45 });
  cueTo(s, c, 'coupled-penalty-gradient', cGrad, 1, { dur: 0.6 });
  cueTo(s, c, 'coupled-data', cData, 1, { dur: 0.8 });
  pulseCue(s, c, 'coupled-end', cEnd, 1, { dur: 0.5 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  pulseCue(s, c, 'gradient-representation', gRep, 1, { dur: 0.4 });
  cueTo(s, c, 'zero-tensor', zTen, 1, { dur: 0.7 });
  cueTo(s, c, 'none-skip', nSkip, 1, { dur: 0.7 });
  cueTo(s, c, 'old-moment-zero', oldM, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 17. torch-loop: Place each operation before its consumer
// Cues: loop-clear, loop-backward, loop-clip, loop-rate, loop-step, loop-scheduler,
//       cpu-run, cpu-result, cpu-norm, cpu-count,
//       amp-unscale, amp-skip, amp-clock, zero-rate-clock, amp-scale-update
// ---------------------------------------------------------------------------
export function torchLoop(s, c) {
  const mode = s.value(0); // 0 = 6-stage loop order, 1 = 60-step CPU trace, 2 = AMP unscale & clocks
  const loopStage = s.value(0); // 1..6
  const cpuP = s.value(0); // 0 -> 1 across 60 steps
  const cpuResP = s.value(0);
  const cpuNormP = s.value(0);
  const cpuCntP = s.value(0);
  const ampUnsc = s.value(0);
  const ampSkip = s.value(0);
  const ampClk = s.value(0);
  const zeroClk = s.value(0);
  const ampUpd = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 17 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(400, 0, 480, '#1e8a6b20', '#151e3d10'));

  // Beat 0: Concrete 6-step PyTorch update sequence + live step-1 telemetry
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const st = loopStage.value;
      const first = CPU_LOOP_TRACE[0];
      const ops = [
        { code: '1. optimizer.zero_grad(set_to_none=True)', col: COSMOS.cyan },
        { code: '2. loss.backward()', col: COSMOS.gold },
        { code: '3. clip_grad_norm_(params, 20.0)', col: COSMOS.emerald },
        { code: '4. param_group["lr"] = current_rate', col: COSMOS.violet },
        { code: '5. optimizer.step()', col: COSMOS.cyan },
        { code: '6. scheduler.step()  # after opt step', col: COSMOS.gold },
      ];

      const nodes = [
        txt(
          'PYTORCH UPDATE ORDER  ·  PLACE EACH OP BEFORE ITS CONSUMER',
          0,
          -424,
          28,
          COSMOS.cyan,
          'mono',
        ),
        glassPlate(-400, 10, 780, 680, { stroke: COSMOS.cyan, glow: 6 }),
        txt('EXECUTION SEQUENCE', -400, -280, 26, COSMOS.muted, 'mono'),
      ];

      ops.forEach((op, idx) => {
        const y = -205 + idx * 96;
        const lit = st >= idx + 0.5;
        nodes.push(
          circle(11, {
            fill: lit ? op.col : COSMOS.bg,
            stroke: lit ? op.col : '#4d6089',
            width: 2.6,
          }).at(-740, y),
          txt(op.code, -708, y, 28, lit ? op.col : COSMOS.muted, 'mono', 'left'),
        );
      });

      // Right live step-1 state readout
      const rx = 445;
      nodes.push(
        glassPlate(rx, 10, 740, 680, { stroke: COSMOS.emerald, glow: 6 }),
        txt('STEP 1 LIVE TELEMETRY  (START (1, 1))', rx, -280, 26, COSMOS.emerald, 'mono'),
        txt(
          st >= 1.5 ? 'Raw gradient:  (100.0, 1.0)' : 'Raw gradient:  waiting for backward()',
          rx - 320,
          -190,
          30,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt(
          st >= 2.5 ? 'Pre-clip norm:  100.005  (> 20.0)' : 'Pre-clip norm:  ?',
          rx - 320,
          -105,
          30,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          st >= 2.5 ? `Clipped grad:  ${pairText(first.usedGradient, 3)}` : 'Clipped grad:  ?',
          rx - 320,
          -20,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        ),
        txt(
          st >= 3.5 ? 'Assigned lr:  0.0800' : 'Assigned lr:  ?',
          rx - 320,
          65,
          30,
          COSMOS.violet,
          'mono',
          'left',
        ),
        line([rx - 320, 128], [rx + 320, 128], { stroke: '#2c3d66', width: 1.8 }),
        txt(
          st >= 4.5 ? `After step 1:  θ = ${pairText(first.after, 4)}` : 'After step 1:  pending',
          rx - 320,
          190,
          32,
          COSMOS.emerald,
          'mono',
          'left',
        ),
        txt(
          st >= 5.5
            ? 'Built-in scheduler.step() runs after optimizer.step()'
            : 'Plateau schedulers consume validation metrics',
          rx - 320,
          274,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Actual 60-step CPU PyTorch trace (Loss curve + Pre-clip norm chart with 11 clipped dots)
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const count = Math.max(1, Math.round(Math.max(cpuP.value, cpuResP.value) * 60));
      const recs = CPU_LOOP_TRACE.slice(0, count);
      const last = recs.at(-1);

      const lossPlot = luminousPlot({
        cx: -265,
        cy: -162,
        width: 1020,
        height: 270,
        xDomain: [0, 60],
        yDomain: [0, 52],
        xTicks: [0, 20, 40, 60],
        yTicks: [0, 25, 50],
        xFmt: (v) => String(v),
        yFmt: (v) => String(v),
        yLabel: 'loss',
        accent: COSMOS.emerald,
      });

      const normPlot = luminousPlot({
        cx: -265,
        cy: 215,
        width: 1020,
        height: 240,
        xDomain: [0, 60],
        yDomain: [0, 108],
        xTicks: [0, 20, 40, 60],
        yTicks: [0, 20, 100],
        xFmt: (v) => String(v),
        yFmt: (v) => String(v),
        xLabel: 'completed update',
        yLabel: 'pre-clip norm',
        accent: COSMOS.cyan,
      });

      const lossPts = [lossPlot.map(0, 50.5), ...recs.map((r) => lossPlot.map(r.step, r.loss))];
      const normPts = recs.map((r) => normPlot.map(r.step, r.preclipNorm));

      const rx = 560;
      const nodes = [
        txt(
          '60-UPDATE CPU RUN  ·  COSINE PEAK 0.08  ·  CLIP 20',
          -265,
          -396,
          28,
          COSMOS.emerald,
          'mono',
        ),
        lossPlot.node,
        normPlot.node,
        // Clipping threshold line at 20
        line([normPlot.mapX(0), normPlot.mapY(20)], [normPlot.mapX(60), normPlot.mapY(20)], {
          stroke: COSMOS.gold,
          width: 2.6,
          dash: [8, 8],
        }),
      ];

      if (lossPts.length >= 2) {
        nodes.push(glowingTrail(lossPts, { color: COSMOS.emerald, width: 4.5, glow: 10 }));
      }
      if (normPts.length >= 2) {
        nodes.push(glowingTrail(normPts, { color: COSMOS.cyan, width: 3.8, glow: 8 }));
      }

      // Highlight clipped updates (> 20) in rose
      for (const r of recs) {
        if (r.preclipNorm > 20) {
          const [px, py] = normPlot.map(r.step, r.preclipNorm);
          nodes.push(glowDot(px, py, { radius: 6.5, color: COSMOS.rose, glow: 10 }));
        }
      }

      // Right metrics panel
      nodes.push(
        glassPlate(rx, 24, 540, 650, { stroke: COSMOS.cyan, glow: 6 }),
        txt(`COMPLETED:  ${count} / 60`, rx, -244, 30, COSMOS.ink, 'mono'),
        txt(`Loss ≈ ${num(last.loss, 5)}`, rx, -172, 34, COSMOS.emerald, 'mono'),
        txt(
          cpuResP.value > 0.8
            ? `Final w ≈ ${pairText(last.after, 5)}`
            : `w ≈ ${pairText(last.after, 3)}`,
          rx,
          -104,
          28,
          COSMOS.emerald,
          'mono',
        ),
        line([rx - 220, -48], [rx + 220, -48], { stroke: '#2c3d66', width: 1.6 }),
        txt('PRE-CLIP PEAK NORM', rx, 10, 26, COSMOS.muted, 'mono'),
        txt(
          cpuNormP.value > 0.2 ? '100.005  (5× limit)' : 'Peak norm = ?',
          rx,
          68,
          34,
          COSMOS.cyan,
          'mono',
        ),
        line([rx - 220, 126], [rx + 220, 126], { stroke: '#2c3d66', width: 1.6 }),
        txt('CLIPPED UPDATES', rx, 182, 26, COSMOS.muted, 'mono'),
        txt(
          cpuCntP.value > 0.2 ? '11 of 60 updates' : 'Count = ?',
          rx,
          242,
          38,
          COSMOS.rose,
          'mono',
        ).glow(8, COSMOS.rose),
        txt('Different budget & clip from 80-step run', rx, 314, 26, COSMOS.muted, 'sans'),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: AMP unscale before clipping + skipped nonfinite step vs zero-rate step clocks
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const plot = luminousPlot({
        cx: -435,
        cy: 144,
        width: 560,
        height: 316,
        xDomain: [0, 6],
        yDomain: [0, 6],
        xTicks: [0, 3, 6],
        yTicks: [0, 4, 6],
        xFmt: (v) => String(v),
        yFmt: (v) => String(v),
        xLabel: 'gₐ',
        yLabel: 'g_b',
        accent: COSMOS.emerald,
      });

      const oPt = plot.map(0, 0);
      const wrongEnd = plot.map(0.375, 0.5);
      const rightEnd = plot.map(3 * ampUnsc.value, 4 * ampUnsc.value);

      const rx = 445;
      const nodes = [
        txt('MIXED PRECISION (AMP)  ·  UNSCALE BEFORE CLIPPING', 0, -424, 28, COSMOS.gold, 'mono'),
        txt(
          'Real g = (3, 4)  ·  Loss scale = 8  →  Scaled = (24, 32)  ·  Threshold = 5',
          0,
          -372,
          28,
          COSMOS.muted,
          'mono',
        ),
        // Left: Unscale order vector comparison
        glassPlate(-435, -214, 780, 168, { stroke: COSMOS.emerald, glow: 6 }),
        txt('Clip→unscale: (24,32)→(3,4)→(0.375,0.5)', -435, -244, 26, COSMOS.rose, 'mono'),
        txt('Unscale→clip: (24,32)→(3,4)→(3,4)', -435, -182, 26, COSMOS.emerald, 'mono'),
        plot.node,
        arrow(oPt, wrongEnd, { stroke: COSMOS.rose, width: 5, tip: 12 }).glow(8, COSMOS.rose),
        ampUnsc.value > 0.05
          ? arrow(oPt, rightEnd, { stroke: COSMOS.emerald, width: 6, tip: 15 }).glow(
              10,
              COSMOS.emerald,
            )
          : group(),
        // Right: Two drawn step-clock lanes + GradScaler value meter (zero boxed prose cards)
        txt('STEP-CLOCK LANES', rx, -264, 28, COSMOS.gold, 'mono'),

        // Lane 1: Nonfinite AMP Skip (clocks frozen at 0)
        txt('AMP SKIP (NaN / Inf)', rx - 340, -196, 26, COSMOS.rose, 'mono', 'left'),
        line([rx - 340, -124], [rx + 340, -124], {
          stroke: ampSkip.value > 0.1 ? COSMOS.rose : '#344774',
          width: 4,
          dash: [10, 8],
        }),
        circle(16, { fill: '#2a0f18', stroke: COSMOS.rose, width: 3.2 })
          .at(rx - 220, -124)
          .glow(ampSkip.value > 0.1 ? 10 : 3, COSMOS.rose),
        txt('opt = 0', rx - 220, -72, 26, COSMOS.rose, 'mono'),
        circle(16, { fill: '#2a0f18', stroke: COSMOS.rose, width: 3.2 })
          .at(rx + 80, -124)
          .glow(ampClk.value > 0.1 ? 10 : 3, COSMOS.rose),
        txt('sched = 0', rx + 80, -72, 26, COSMOS.rose, 'mono'),
        txt(
          ampClk.value > 0.2 ? 'Clocks FROZEN' : 'Skips step',
          rx + 340,
          -196,
          26,
          COSMOS.rose,
          'mono',
          'right',
        ),

        // Lane 2: Zero-Rate Step (w flat, m/v buffers fill, t ticks 0 -> 1)
        txt('ZERO-RATE STEP (η = 0)', rx - 340, 16, 26, COSMOS.cyan, 'mono', 'left'),
        line([rx - 340, 84], [rx - 90, 84], { stroke: COSMOS.muted, width: 4 }),
        txt('w flat', rx - 215, 134, 26, COSMOS.muted, 'mono'),
        // m and v mini filling bars
        rect(Math.max(12, 110 * Math.max(0.3, zeroClk.value)), 24, {
          fill: COSMOS.cyan,
          radius: 5,
        })
          .at(rx - 20 + Math.max(12, 110 * Math.max(0.3, zeroClk.value)) / 2, 68)
          .glow(7, COSMOS.cyan),
        rect(Math.max(12, 110 * Math.max(0.3, zeroClk.value)), 24, {
          fill: COSMOS.emerald,
          radius: 5,
        })
          .at(rx - 20 + Math.max(12, 110 * Math.max(0.3, zeroClk.value)) / 2, 102)
          .glow(7, COSMOS.emerald),
        txt('m, v fill', rx + 40, 146, 26, COSMOS.cyan, 'mono'),
        circle(18, { fill: '#0e2838', stroke: COSMOS.emerald, width: 3.4 })
          .at(rx + 250, 84)
          .glow(zeroClk.value > 0.1 ? 12 : 4, COSMOS.emerald),
        txt(zeroClk.value > 0.2 ? 't = 1' : 't = 0', rx + 250, 142, 26, COSMOS.emerald, 'mono'),

        // Bottom right: GradScaler value meter updating once at window end
        txt('GRADSCALER VALUE METER', rx - 340, 232, 26, COSMOS.emerald, 'mono', 'left'),
        line([rx - 340, 294], [rx + 340, 294], { stroke: '#344774', width: 4 }),
        rect(Math.max(24, 520 * (0.45 + 0.55 * ampUpd.value)), 20, {
          fill: COSMOS.emerald,
          radius: 6,
        })
          .at(rx - 340 + Math.max(24, 520 * (0.45 + 0.55 * ampUpd.value)) / 2, 294)
          .glow(ampUpd.value > 0.1 ? 10 : 3, COSMOS.emerald),
        txt(
          ampUpd.value > 0.2 ? 'scaler.update() once / window' : 'Window-end scale tick',
          rx,
          348,
          26,
          COSMOS.emerald,
          'mono',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'loop-clear', loopStage, 1, { dur: 0.35 });
  cueTo(s, c, 'loop-backward', loopStage, 2, { dur: 0.35 });
  cueTo(s, c, 'loop-clip', loopStage, 3, { dur: 0.35 });
  cueTo(s, c, 'loop-rate', loopStage, 4, { dur: 0.35 });
  cueTo(s, c, 'loop-step', loopStage, 5, { dur: 0.35 });
  cueTo(s, c, 'loop-scheduler', loopStage, 6, { dur: 0.35 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'cpu-run', cpuP, 0.45, { dur: 1.4 });
  cueTo(s, c, 'cpu-result', cpuResP, 1, { dur: 1.6 });
  pulseCue(s, c, 'cpu-norm', cpuNormP, 1, { dur: 0.5 });
  pulseCue(s, c, 'cpu-count', cpuCntP, 1, { dur: 0.5 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'amp-unscale', ampUnsc, 1, { dur: 0.75 });
  pulseCue(s, c, 'amp-skip', ampSkip, 1, { dur: 0.45 });
  pulseCue(s, c, 'amp-clock', ampClk, 1, { dur: 0.45 });
  pulseCue(s, c, 'zero-rate-clock', zeroClk, 1, { dur: 0.45 });
  pulseCue(s, c, 'amp-scale-update', ampUpd, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 18. checkpoint-history: Which checkpoint reproduces the next update?
// Cues: checkpoint-copy, checkpoint-freeze, checkpoint-history, restore-order,
//       resume-three, resume-match, resume-count, weights-only,
//       resume-real, muon-group, other-groups
// ---------------------------------------------------------------------------
export function checkpointHistory(s, c) {
  const mode = s.value(0); // 0 = snapshot at t=3, 1 = divergence plot, 2 = full manifest + Muon/AdamW
  const copyP = s.value(0);
  const freezeP = s.value(0);
  const histP = s.value(0);
  const orderP = s.value(0);
  const resP = s.value(0);
  const matchP = s.value(0);
  const cntP = s.value(0);
  const wOnlyP = s.value(0);
  const realP = s.value(0);
  const muonP = s.value(0);
  const otherP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 18 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 0, 480, '#1e8a6b20', '#151e3d10'));

  const fx = CPU_RESUME_TRACE;

  // Beat 0: Deep-copied state capsule at t = 3 while live original advances to t = 6
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const advSteps = Math.round(freezeP.value * 3);
      const curLive = advSteps > 0 ? fx.original[advSteps - 1].weights : fx.checkpointWeights;
      const rows = [
        ['Weights θ', pairText(fx.checkpointWeights, 5)],
        ['Signed m', pairText(fx.checkpointMean, 3)],
        ['Squared v', pairText(fx.checkpointSquare, 3)],
        ['Adam count', '3'],
        ['StepLR rate', String(fx.checkpointRate)],
      ];

      const nodes = [
        txt('CHECKPOINT AFTER UPDATE 3  ·  FREEZE FULL HISTORY', 0, -424, 28, COSMOS.cyan, 'mono'),
        glassPlate(-420, -20, 760, 560, {
          stroke: copyP.value > 0.1 ? COSMOS.cyan : '#2c3d66',
          glow: 8,
        }),
        txt('DEEP-COPIED CHECKPOINT (t = 3)', -420, -248, 28, COSMOS.cyan, 'mono'),
      ];

      rows.forEach(([k, v], idx) => {
        const y = -168 + idx * 84;
        nodes.push(
          txt(k, -755, y, 28, COSMOS.muted, 'sans', 'left'),
          txt(copyP.value > 0.2 ? v : '?', -85, y, 28, COSMOS.cyan, 'mono', 'right'),
        );
      });

      // Right: Live original advancing 3 -> 4 -> 5 -> 6
      const rx = 435;
      nodes.push(
        glassPlate(rx, -20, 740, 560, { stroke: COSMOS.emerald, glow: 6 }),
        txt('LIVE ORIGINAL RUN CONTINUES', rx, -248, 28, COSMOS.emerald, 'mono'),
        line([rx - 260, -110], [rx + 260, -110], { stroke: '#4d6089', width: 3 }),
      );
      for (let i = 0; i <= 3; i++) {
        const tx = rx - 260 + i * 173;
        const lit = i <= advSteps;
        nodes.push(
          circle(13, {
            fill: lit ? COSMOS.emerald : COSMOS.bg,
            stroke: COSMOS.emerald,
            width: 3,
          })
            .at(tx, -110)
            .glow(lit ? 10 : 0, COSMOS.emerald),
          txt(`t = ${3 + i}`, tx, -58, 26, lit ? COSMOS.emerald : COSMOS.muted, 'mono'),
        );
      }
      nodes.push(
        txt(`Original at t = ${3 + advSteps}`, rx, 48, 34, COSMOS.emerald, 'mono'),
        txt(`Live θ ≈ ${pairText(curLive, 5)}`, rx, 118, 30, COSMOS.ink, 'mono'),
        txt('Saved snapshot stays frozen at t = 3', rx, 198, 28, COSMOS.cyan, 'sans'),
        txt(
          'Same weights choose different next steps if history differs',
          0,
          354,
          30,
          histP.value > 0.1 ? COSMOS.gold : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Restore order + exact bitwise resume (emerald, t=6) vs weights-only divergence (rose, t=3)
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const plot = luminousPlot({
        cx: 330,
        cy: 0,
        width: 920,
        height: 540,
        xDomain: [3, 6.15],
        yDomain: [0.946, 0.978],
        xTicks: [3, 4, 5, 6],
        yTicks: [0.95, 0.96, 0.97],
        xFmt: (v) => `t=${v}`,
        yFmt: (v) => num(v, 2),
        xLabel: 'continued updates after checkpoint t = 3',
        yLabel: 'weight a',
        accent: COSMOS.emerald,
      });

      const origPts = [
        plot.map(3, fx.checkpointWeights[0]),
        ...fx.original.map((r, i) => plot.map(4 + i, r.weights[0])),
      ];
      const count = Math.round(resP.value * 3);
      const compPts = [
        plot.map(3, fx.checkpointWeights[0]),
        ...fx.complete.slice(0, count).map((r, i) => plot.map(4 + i, r.weights[0])),
      ];
      const wOnlyPts = [
        plot.map(3, fx.checkpointWeights[0]),
        ...fx.weightsOnly.map((r, i) => plot.map(4 + i, r.weights[0])),
      ];

      const lx = -545;
      const nodes = [
        txt('RESUME FULL STATE VS WEIGHTS ONLY', 0, -424, 28, COSMOS.emerald, 'mono'),
        plot.node,
        // Original reference track
        new Node(polyPath(origPts)).stroke('#7b8eb8', 8, 0.55),
        // Complete resume overlay
        compPts.length >= 2
          ? glowingTrail(compPts, { color: COSMOS.emerald, width: 4.8, glow: 12 })
          : group(),
      ];

      if (wOnlyP.value > 0.05) {
        nodes.push(
          glowingTrail(wOnlyPts, { color: COSMOS.rose, width: 4.8, glow: 12 }).opacity(
            wOnlyP.value,
          ),
          txt(
            'Weights-only diverges!',
            plot.mapX(4.2),
            plot.mapY(0.948),
            28,
            COSMOS.rose,
            'sans',
          ).opacity(wOnlyP.value),
        );
      }
      if (count >= 3) {
        nodes.push(
          txt(
            'Exact match (t = 6)',
            plot.mapX(4.85),
            plot.mapY(0.9745),
            28,
            COSMOS.emerald,
            'sans',
          ),
        );
      }

      // Left restore checklist & verification readouts
      nodes.push(
        glassPlate(lx, -135, 610, 310, { stroke: COSMOS.cyan, glow: 6 }),
        txt('RESTORE ORDER', lx, -242, 26, COSMOS.cyan, 'mono'),
        txt(
          '1. Construct optimizer & scheduler',
          lx - 270,
          -172,
          26,
          orderP.value > 0.1 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          '2. Load scheduler.state_dict()',
          lx - 270,
          -108,
          26,
          orderP.value > 0.4 ? COSMOS.cyan : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          '3. Load optimizer.state_dict()',
          lx - 270,
          -44,
          26,
          orderP.value > 0.7 ? COSMOS.emerald : COSMOS.muted,
          'mono',
          'left',
        ),
        glassPlate(lx, 175, 610, 260, { stroke: COSMOS.emerald, glow: 6 }),
        txt(
          matchP.value > 0.2 ? 'Full resume: match = True' : 'Full resume match = ?',
          lx - 270,
          96,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        ),
        txt(
          cntP.value > 0.2 ? 'Restored Adam counter = 6' : 'Restored counter = ?',
          lx - 270,
          164,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt(
          wOnlyP.value > 0.2 ? 'Weights-only: False (t = 3)' : 'Weights-only check = ?',
          lx - 270,
          232,
          28,
          COSMOS.rose,
          'mono',
          'left',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Drawn Checkpoint Capsule (4 instruments) + Muon 2D matrix & AdamW vector strips
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const rp = Math.max(0.35, realP.value);
      const mp = Math.max(0.35, muonP.value);
      const op = Math.max(0.35, otherP.value);
      const nodes = [
        txt('CHECKPOINT CAPSULE & MULTI-OPTIMIZER STATE SLABS', 0, -424, 28, COSMOS.gold, 'mono'),
        // Left: Open Checkpoint Capsule with 4 drawn instruments (2x2)
        rect(760, 620, {
          fill: '#0b122466',
          stroke: realP.value > 0.1 ? COSMOS.cyan : '#2c3d66',
          width: 2.8,
          radius: 34,
        })
          .at(-430, 10)
          .glow(realP.value > 0.1 ? 10 : 3, COSMOS.cyan),
        txt('CHECKPOINT CAPSULE', -430, -258, 28, COSMOS.cyan, 'mono'),

        // Instrument 1 (top-left): Update-counter dial
        circle(62, { fill: '#0e172c', stroke: COSMOS.cyan, width: 3.2 })
          .at(-605, -108)
          .glow(8 * rp, COSMOS.cyan),
        line([-605, -124], [-566, -152], { stroke: COSMOS.gold, width: 4 }).glow(8, COSMOS.gold),
        txt('t = 3', -605, -82, 26, COSMOS.ink, 'mono'),
        txt('Update counter', -605, -14, 26, COSMOS.cyan, 'sans'),

        // Instrument 2 (top-right): Shuffled batch ribbon + cursor arrow
        ...[0, 1, 2, 3, 4].map((bi) =>
          rect(44, 44, {
            fill: bi === 3 ? '#3b2e0e' : '#14223d',
            stroke: bi === 3 ? COSMOS.gold : '#3a4f7c',
            width: bi === 3 ? 3 : 2,
            radius: 6,
          })
            .at(-350 + bi * 54, -108)
            .glow(bi === 3 ? 10 : 0, COSMOS.gold),
        ),
        arrow([-188, -172], [-188, -136], { stroke: COSMOS.gold, width: 3.5, tip: 10 }).glow(
          8,
          COSMOS.gold,
        ),
        txt('Dataloader cursor', -242, -14, 26, COSMOS.gold, 'sans'),

        // Instrument 3 (bottom-left): CPU & GPU RNG state rings
        circle(62, { fill: null, stroke: COSMOS.violet, width: 3.4, dash: [14, 7] })
          .at(-605, 138)
          .glow(8 * rp, COSMOS.violet),
        circle(38, { fill: '#171130', stroke: COSMOS.emerald, width: 3 })
          .at(-605, 138)
          .glow(8 * rp, COSMOS.emerald),
        txt('RNG', -605, 138, 26, COSMOS.ink, 'mono'),
        txt('CPU & GPU RNG', -605, 232, 26, COSMOS.violet, 'sans'),

        // Instrument 4 (bottom-right): AMP GradScaler vertical scale meter
        rect(48, 128, { fill: '#0e172c', stroke: '#3a4f7c', width: 2.6, radius: 8 }).at(-242, 138),
        rect(38, 86, { fill: COSMOS.emerald, radius: 6 })
          .at(-242, 156)
          .glow(8 * rp, COSMOS.emerald),
        txt('2¹⁶', -172, 138, 28, COSMOS.emerald, 'mono', 'left'),
        txt('AMP GradScaler', -242, 232, 26, COSMOS.emerald, 'sans'),

        // Right top: Muon 2D matrix grid feeding its own gold state slab
        txt('MUON  ·  2D HIDDEN MATRICES', 435, -258, 28, COSMOS.gold, 'mono'),
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
          const col = k % 3;
          const row = Math.floor(k / 3);
          return rect(48, 42, { fill: '#221c0e', stroke: COSMOS.gold, width: 2.2, radius: 6 })
            .at(155 + col * 58, -168 + row * 50)
            .glow(6 * mp, COSMOS.gold);
        }),
        arrow([320, -118], [435, -118], { stroke: COSMOS.gold, width: 4, tip: 12 }).glow(
          8 * mp,
          COSMOS.gold,
        ),
        rect(310, 96, { fill: '#221c0e', stroke: COSMOS.gold, width: 3, radius: 12 })
          .at(615, -118)
          .glow(10 * mp, COSMOS.gold),
        txt('Muon matrix state', 615, -118, 28, COSMOS.gold, 'mono'),

        // Right bottom: AdamW 1D vector strips feeding m/v state slab
        txt('ADAMW  ·  BIASES & EMBEDDINGS', 435, 58, 28, COSMOS.emerald, 'mono'),
        ...[0, 1, 2].map((row) =>
          rect(168, 24, { fill: '#0f2822', stroke: COSMOS.emerald, width: 2.4, radius: 6 })
            .at(212, 128 + row * 44)
            .glow(6 * op, COSMOS.emerald),
        ),
        arrow([320, 172], [435, 172], { stroke: COSMOS.emerald, width: 4, tip: 12 }).glow(
          8 * op,
          COSMOS.emerald,
        ),
        rect(310, 44, { fill: '#0f2036', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
          .at(615, 146)
          .glow(8 * op, COSMOS.cyan),
        txt('m buffer', 615, 146, 26, COSMOS.cyan, 'mono'),
        rect(310, 44, { fill: '#0f2822', stroke: COSMOS.emerald, width: 2.6, radius: 8 })
          .at(615, 202)
          .glow(8 * op, COSMOS.emerald),
        txt('v buffer', 615, 202, 26, COSMOS.emerald, 'mono'),
        txt('Restore each parameter group with its own state', 435, 294, 28, COSMOS.muted, 'serif'),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'checkpoint-copy', copyP, 1, { dur: 0.7 });
  cueTo(s, c, 'checkpoint-freeze', freezeP, 1, { dur: 0.9 });
  pulseCue(s, c, 'checkpoint-history', histP, 1, { dur: 0.5 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'restore-order', orderP, 1, { dur: 0.75 });
  cueTo(s, c, 'resume-three', resP, 1, { dur: 1.0 });
  pulseCue(s, c, 'resume-match', matchP, 1, { dur: 0.45 });
  pulseCue(s, c, 'resume-count', cntP, 1, { dur: 0.45 });
  cueTo(s, c, 'weights-only', wOnlyP, 1, { dur: 0.8 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  pulseCue(s, c, 'resume-real', realP, 1, { dur: 0.55 });
  pulseCue(s, c, 'muon-group', muonP, 1, { dur: 0.55 });
  pulseCue(s, c, 'other-groups', otherP, 1, { dur: 0.55 });
}

// ---------------------------------------------------------------------------
// 19. optimizer-memory: Count the state that follows each parameter
// Cues: state-buffers, state-bytes, state-billion, state-extra, state-shards,
//       trained-mask, frozen-moments, actual-state
// ---------------------------------------------------------------------------
export function optimizerMemory(s, c) {
  const mode = s.value(0); // 0 = bytes & 56 GB, 1 = ZeRO 4 shards, 2 = 4 scalar weights (2 frozen)
  const bufP = s.value(0);
  const bytesP = s.value(0);
  const bilP = s.value(0);
  const extraP = s.value(0);
  const shardP = s.value(0);
  const maskP = s.value(0);
  const frozP = s.value(0);
  const actP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 19 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 0, 480, '#1e8a6b20', '#151e3d10'));

  // Beat 0: Per-parameter float32 slot stacks + 7 x 1B params = 56 decimal GB
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const methods = [
        { name: 'SGD', slots: [], bytes: '0 B', col: COSMOS.muted },
        { name: 'Momentum', slots: ['m (4 B)'], bytes: '4 B', col: COSMOS.violet },
        { name: 'RMSProp', slots: ['s (4 B)'], bytes: '4 B', col: COSMOS.gold },
        { name: 'AdamW', slots: ['m (4 B)', 'v (4 B)'], bytes: '8 B', col: COSMOS.emerald },
      ];
      const litBillions = Math.round(bilP.value * 7);

      const nodes = [
        txt(
          'OPTIMIZER STATE MEMORY  ·  FLOAT32 = 4 BYTES / VALUE',
          0,
          -424,
          28,
          COSMOS.cyan,
          'mono',
        ),
      ];

      methods.forEach((m, idx) => {
        const cx = -570 + idx * 380;
        nodes.push(
          glassPlate(cx, -165, 330, 320, {
            stroke: bufP.value > 0.1 ? m.col : '#2c3d66',
            glow: idx === 3 ? 10 : 4,
          }),
          txt(m.name, cx, -280, 34, m.col, 'serif'),
          txt(`${m.bytes} / param`, cx, -42, 28, COSMOS.ink, 'mono'),
        );
        if (m.slots.length === 0) {
          nodes.push(txt('No buffers', cx, -165, 28, COSMOS.muted, 'sans'));
        } else {
          m.slots.forEach((sl, j) => {
            const sy = -195 + j * 76;
            const sc = j === 0 ? COSMOS.cyan : COSMOS.emerald;
            nodes.push(
              rect(220, 52, { fill: '#17223c', stroke: sc, width: 2.6, radius: 10 })
                .at(cx, sy)
                .glow(6, sc),
              txt(sl, cx, sy, 26, sc, 'mono'),
            );
          });
        }
      });

      nodes.push(
        txt(
          bytesP.value > 0.2
            ? 'AdamW:  2 float32 moments × 4 bytes = 8 bytes / parameter'
            : 'Count float32 moment bytes per parameter',
          0,
          62,
          32,
          COSMOS.gold,
          'mono',
        ),
      );

      // 7 x 1B parameter monoliths -> 56 GB
      for (let i = 0; i < 7; i++) {
        const bx = -645 + i * 215;
        const lit = i < litBillions;
        nodes.push(
          rect(185, 92, {
            fill: lit ? '#16374acc' : '#0f1628',
            stroke: lit ? COSMOS.cyan : '#2c3d66',
            width: 2.6,
            radius: 10,
          })
            .at(bx, 200)
            .glow(lit ? 10 : 0, COSMOS.cyan),
          txt('1B params', bx, 178, 26, COSMOS.muted, 'mono'),
          txt(lit ? '8 GB' : '...', bx, 220, 30, lit ? COSMOS.cyan : COSMOS.dim, 'mono'),
        );
      }

      nodes.push(
        txt(
          litBillions === 7
            ? '7B parameters × 8 bytes = 56 decimal GB (moments alone!)'
            : `${litBillions}B / 7B counted`,
          0,
          342,
          34,
          COSMOS.emerald,
          'mono',
        ).glow(6, COSMOS.emerald),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Proportional per-device memory column + 4 ZeRO shard bars (zero boxed bullet cards)
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const sp = shardP.value;
      const ep = Math.max(0.45, extraP.value);
      const colX = -650;
      const colW = 165;
      // Proportional stacked segments (total height 520px: Moments 200, Master 100, Weights 66, Grads 66, Activations 88)
      const segments = [
        { label: '56 GB AdamW moments', h: 184, col: COSMOS.cyan, fill: '#10344c', op: 1 },
        { label: 'FP32 master copies', h: 92, col: COSMOS.gold, fill: '#33270d', op: ep },
        { label: 'Model weights', h: 64, col: COSMOS.blue, fill: '#122448', op: ep },
        { label: 'Gradients', h: 64, col: COSMOS.violet, fill: '#221740', op: ep },
        { label: 'Live activations', h: 86, col: COSMOS.rose, fill: '#331222', op: ep },
      ];

      const nodes = [
        txt('ZERO OPTIMIZER-STATE SHARDING  ·  4 DEVICES', 0, -424, 28, COSMOS.gold, 'mono'),
        txt('FULL TRAINING MEMORY COLUMN', -470, -288, 26, COSMOS.cyan, 'mono'),
        txt('4 EQUAL MOMENT SHARDS  (14 GB / DEVICE)', 420, -288, 26, COSMOS.emerald, 'mono'),
      ];

      let yCursor = -238;
      for (const seg of segments) {
        const cy = yCursor + seg.h / 2;
        nodes.push(
          rect(colW, seg.h - 6, { fill: seg.fill, stroke: seg.col, width: 2.8, radius: 8 })
            .at(colX, cy)
            .glow(6, seg.col)
            .opacity(seg.op),
          line([colX + colW / 2 + 12, cy], [colX + colW / 2 + 44, cy], {
            stroke: seg.col,
            width: 2.4,
          }).opacity(seg.op),
          txt(seg.label, colX + colW / 2 + 58, cy, 28, seg.col, 'sans', 'left').opacity(seg.op),
        );
        yCursor += seg.h;
      }

      // Right: 4 floating ZeRO device shard bars (each holds 7 GB m + 7 GB v = 14 GB)
      for (let d = 0; d < 4; d++) {
        const dy = -170 + d * 126;
        const w = Math.max(24, 148 * sp);
        nodes.push(
          txt(`Device ${d}`, 120, dy, 28, COSMOS.ink, 'mono', 'left'),
          rect(w, 52, { fill: COSMOS.cyan, stroke: null, radius: 6 })
            .at(285 + w / 2, dy)
            .glow(8, COSMOS.cyan),
          rect(w, 52, { fill: COSMOS.emerald, stroke: null, radius: 6 })
            .at(285 + w + 8 + w / 2, dy)
            .glow(8, COSMOS.emerald),
          txt('7 GB m + 7 GB v', 285 + 2 * w + 24, dy, 26, COSMOS.gold, 'mono', 'left').opacity(
            Math.max(0.3, sp),
          ),
        );
      }

      nodes.push(
        txt('Total moments stay 56 GB  ·  14 GB per device', 0, 355, 32, COSMOS.gold, 'mono'),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: 4 scalar weights, 2 frozen -> only active weights allocate moments (4 blocks x 4 B = 16 B)
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const fp = frozP.value;
      const nodes = [
        txt('FROZEN WEIGHTS ALLOCATE ZERO MOMENT BUFFERS', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt(
          'Fresh AdamW  ·  4 scalar parameters  ·  Freeze p1 & p3 before training',
          0,
          -372,
          30,
          COSMOS.muted,
          'sans',
        ),
      ];

      for (let i = 0; i < 4; i++) {
        const cx = -570 + i * 380;
        const active = i % 2 === 0;
        nodes.push(
          glassPlate(cx, -25, 330, 500, {
            stroke: active ? COSMOS.emerald : '#344774',
            glow: active && maskP.value > 0.1 ? 8 : 3,
          }),
          txt(`p${i}`, cx, -220, 44, active ? COSMOS.ink : COSMOS.muted, 'mono'),
          txt(
            active ? 'Receives grad' : 'Frozen',
            cx,
            -158,
            28,
            active ? COSMOS.cyan : COSMOS.dim,
            'sans',
          ),
        );

        if (fp > 0.1) {
          if (active) {
            nodes.push(
              rect(220, 64, { fill: '#17223c', stroke: COSMOS.cyan, width: 2.8, radius: 10 })
                .at(cx, -30)
                .glow(8, COSMOS.cyan)
                .opacity(fp),
              txt('m  ·  4 B', cx, -30, 28, COSMOS.cyan, 'mono').opacity(fp),
              rect(220, 64, { fill: '#17223c', stroke: COSMOS.emerald, width: 2.8, radius: 10 })
                .at(cx, 74)
                .glow(8, COSMOS.emerald)
                .opacity(fp),
              txt('v  ·  4 B', cx, 74, 28, COSMOS.emerald, 'mono').opacity(fp),
              txt('8 bytes', cx, 168, 28, COSMOS.gold, 'mono').opacity(fp),
            );
          } else {
            nodes.push(
              txt('No allocation', cx, 20, 28, COSMOS.dim, 'sans').opacity(fp),
              txt('0 bytes', cx, 168, 28, COSMOS.dim, 'mono').opacity(fp),
            );
          }
        }
      }

      nodes.push(
        glassPlate(0, 326, 1460, 112, {
          stroke: actP.value > 0.1 ? COSMOS.gold : '#2c3d66',
          glow: 8,
        }),
        txt(
          actP.value > 0.2
            ? '4 blocks × 4 bytes = 16 bytes · Check dtype & peak memory'
            : 'Count allocated moment blocks across the 4 weights',
          0,
          326,
          30,
          COSMOS.gold,
          'mono',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'state-buffers', bufP, 1, { dur: 0.45 });
  pulseCue(s, c, 'state-bytes', bytesP, 1, { dur: 0.45 });
  cueTo(s, c, 'state-billion', bilP, 1, { dur: 1.1 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'state-shards', shardP, 1, { dur: 1.0 });
  pulseCue(s, c, 'state-extra', extraP, 1, { dur: 0.5 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  pulseCue(s, c, 'trained-mask', maskP, 1, { dur: 0.45 });
  cueTo(s, c, 'frozen-moments', frozP, 1, { dur: 0.8 });
  pulseCue(s, c, 'actual-state', actP, 1, { dur: 0.5 });
}
