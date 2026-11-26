// Act 2: RMSProp Rescaling, Adam Moment Chambers & Cold Start, Adaptive Diagonal Step,
// Prescribed History & Observed Weights, and Objective Scale / Epsilon Limits.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COLD,
  COSMOS,
  PRESCRIBED,
  PRESCRIBED_GRADIENTS,
  RUNS,
  SETTINGS,
  aura,
  cinemaGrid,
  clamp,
  contourBowl,
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
  luminousPlot,
  num,
  pairText,
  photonWire,
  polyPath,
  pulseCue,
  signed,
  stageVis,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. rmsprop: How far does each gradient move the weight?
// Cues: rms-input, rms-square, rms-root, rms-predict, rms-first [CB],
//       rms-second, rms-store-second, rms-second-result [CB],
//       rms-sign, rms-no-correction, rms-epsilon
// ---------------------------------------------------------------------------
export function rmsprop(s, c) {
  const inputP = s.value(0);
  const sqP = s.value(0);
  const rootP = s.value(0);
  const predP = s.value(0);
  const firstStepP = s.value(0);
  const secondInP = s.value(0);
  const secondSqP = s.value(0);
  const secondStepP = s.value(0);
  const signFocusP = s.value(0);
  const noCorrP = s.value(0);
  const epsP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 6 }));
  s.add(aura(-400, -40, 460, '#2a588a24', '#151e3d10'));
  s.add(aura(400, 60, 460, '#ffd1661c', '#151e3d10'));

  const p1 = PRESCRIBED[0];
  const p2 = PRESCRIBED[1];

  const epsEq = glowTex(String.raw`\Delta w = \eta\,\frac{g_t}{\sqrt{s_t} + \epsilon}`, {
    x: 470,
    y: 372,
    size: 38,
    color: COSMOS.gold,
    glow: 8,
  });

  const stage = dynamic(() => {
    const isStep2 = secondInP.value > 0.3;
    const rec = isStep2 ? p2 : p1;
    const ga = rec.gradient[0];
    const gb = rec.gradient[1];
    const sa = isStep2
      ? p1.rms[0] + (p2.rms[0] - p1.rms[0]) * secondSqP.value
      : p1.rms[0] * sqP.value;
    const sb = isStep2
      ? p1.rms[1] + (p2.rms[1] - p1.rms[1]) * secondSqP.value
      : p1.rms[1] * sqP.value;
    const ra = Math.sqrt(Math.max(1e-9, sa));
    const rb = Math.sqrt(Math.max(1e-9, sb));

    // Current displayed update values on the shared ruler (strictly withheld until CB cues!)
    let uA = null;
    let uB = null;
    if (firstStepP.value > 0.02) {
      if (secondStepP.value > 0.02) {
        uA = p1.rmsUpdate[0] + (p2.rmsUpdate[0] - p1.rmsUpdate[0]) * secondStepP.value;
        uB = p1.rmsUpdate[1] + (p2.rmsUpdate[1] - p1.rmsUpdate[1]) * secondStepP.value;
      } else {
        uA = p1.rmsUpdate[0] * firstStepP.value;
        uB = p1.rmsUpdate[1] * firstStepP.value;
      }
    }

    const colX = [-640, -240, 175, 595];
    const nodes = [
      txt('RMSPROP  ·  PER-COORDINATE SQUARED SCALE', 0, -424, 28, COSMOS.gold, 'mono'),
      txt(
        isStep2
          ? 'Input 2:  g = (−80, +0.98)   ·   ρ = 0.9   ·   η = 0.01'
          : 'Input 1:  g = (+100, +1.00)   ·   ρ = 0.9   ·   η = 0.01',
        0,
        -372,
        30,
        COSMOS.muted,
        'mono',
      ),
      // Pipeline column headers
      txt('GRADIENT  g', colX[0], -296, 26, COSMOS.muted, 'mono'),
      txt('SQUARED BUFFER  s', colX[1], -296, 26, COSMOS.gold, 'mono'),
      txt('DIVISOR  √s', colX[2], -296, 26, COSMOS.violet, 'mono'),
      txt('SUBTRACTED STEP', colX[3], -296, 26, COSMOS.cyan, 'mono'),
    ];

    // Two coordinate pipelines: row 0 = a (cyan), row 1 = b (emerald)
    const rows = [
      {
        label: 'a',
        y: -175,
        col: COSMOS.cyan,
        g: ga,
        sVal: sa,
        rVal: ra,
        uVal: uA,
        sStr: num(sa, 1),
        rStr: num(ra, 2),
      },
      {
        label: 'b',
        y: -15,
        col: COSMOS.emerald,
        g: gb,
        sVal: sb,
        rVal: rb,
        uVal: uB,
        sStr: num(sb, 3),
        rStr: num(rb, 3),
      },
    ];

    for (const r of rows) {
      nodes.push(
        txt(r.label, -825, r.y, 44, r.col, 'serif').glow(6, r.col),
        // Gradient plate
        glassPlate(colX[0], r.y, 240, 102, {
          stroke: inputP.value > 0.1 ? r.col : '#2c3d66',
          glow: signFocusP.value > 0.2 ? 12 : 6,
        }),
        txt(
          signed(r.g, r.label === 'a' ? 0 : 2),
          colX[0],
          r.y,
          40,
          r.g < 0 ? COSMOS.rose : r.col,
          'mono',
        ),
        // Wire 0 -> 1
        photonWire(
          [
            [colX[0] + 125, r.y],
            [colX[1] - 135, r.y],
          ],
          drift.value * 2.5,
          { color: r.col, width: 2.6, glow: 5 },
        ),
        // Squared buffer plate
        glassPlate(colX[1], r.y, 260, 102, {
          stroke: sqP.value > 0.1 ? COSMOS.gold : '#2c3d66',
          glow: sqP.value > 0.1 ? 8 : 3,
        }),
        txt(sqP.value > 0.15 ? r.sStr : '0', colX[1], r.y, 38, COSMOS.gold, 'mono'),
        // Wire 1 -> 2
        photonWire(
          [
            [colX[1] + 135, r.y],
            [colX[2] - 135, r.y],
          ],
          drift.value * 2.5 + 0.33,
          { color: COSMOS.gold, width: 2.6, glow: 5 },
        ),
        // Root divisor plate
        glassPlate(colX[2], r.y, 260, 102, {
          stroke: rootP.value > 0.1 ? COSMOS.violet : '#2c3d66',
          glow: rootP.value > 0.1 ? 8 : 3,
        }),
        txt(rootP.value > 0.15 ? r.rStr : '?', colX[2], r.y, 38, COSMOS.violet, 'mono'),
        // Wire 2 -> 3
        photonWire(
          [
            [colX[2] + 135, r.y],
            [colX[3] - 145, r.y],
          ],
          drift.value * 2.5 + 0.66,
          { color: COSMOS.violet, width: 2.6, glow: 5 },
        ),
        // Step plate
        glassPlate(colX[3], r.y, 280, 102, {
          stroke: r.uVal !== null ? r.col : '#2c3d66',
          glow: r.uVal !== null ? 10 : 3,
        }),
        txt(
          r.uVal !== null ? signed(r.uVal, 4) : '?',
          colX[3],
          r.y,
          36,
          r.uVal !== null && r.uVal < 0 ? COSMOS.rose : r.col,
          'mono',
        ),
      );
    }

    // Shared signed update ruler below the pipelines
    const showPrediction = predP.value > 0.2 && firstStepP.value < 0.02;
    if (showPrediction) {
      nodes.push(
        glassPlate(0, 210, 1340, 120, { stroke: COSMOS.gold, glow: 10 }),
        txt('Divisor for a is 100× larger than divisor for b', 0, 184, 30, COSMOS.muted, 'sans'),
        txt('Will a still take 100× the step?', 0, 236, 42, COSMOS.gold, 'serif').glow(
          8,
          COSMOS.gold,
        ),
      );
    } else {
      nodes.push(
        coordRuler({
          cx: 0,
          cy: 170,
          width: 1360,
          domain: [-0.036, 0.042],
          ticks: [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04],
          tickFmt: (v) => num(v, 2),
          start: 0,
          end: uA ?? 0,
          progress: uA !== null ? 1 : 0,
          color: uA !== null && uA < 0 ? COSMOS.rose : COSMOS.cyan,
          label: 'Subtracted update  a',
          labelRight: uA !== null ? signed(uA, 5) : 'pending',
        }),
        coordRuler({
          cx: 0,
          cy: 274,
          width: 1360,
          domain: [-0.036, 0.042],
          ticks: [-0.03, 0, 0.03],
          tickFmt: (v) => num(v, 2),
          start: 0,
          end: uB ?? 0,
          progress: uB !== null ? 1 : 0,
          color: COSMOS.emerald,
          label: 'Subtracted update  b',
          labelRight: uB !== null ? signed(uB, 5) : 'pending',
        }),
      );
    }

    // Beat 2 footnotes & equation
    if (noCorrP.value > 0.04) {
      nodes.push(
        txt(
          'Basic RMSProp: raw s_t (no startup bias correction)',
          -440,
          376,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(noCorrP.value),
      );
    }
    if (epsP.value > 0.04) {
      nodes.push(epsEq.opacity(epsP.value));
    }

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'rms-input', inputP, 1, { dur: 0.4 });
  cueTo(s, c, 'rms-square', sqP, 1, { dur: 0.7 });
  cueTo(s, c, 'rms-root', rootP, 1, { dur: 0.7 });
  pulseCue(s, c, 'rms-predict', predP, 1, { dur: 0.5 });

  // Strict CB withholding: both marks align ONLY after rms-first completes!
  cueTo(s, c, 'rms-first', firstStepP, 1, { after: true, dur: 0.35 });
  pulseCue(s, c, 'rms-second', secondInP, 1, { dur: 0.4 });
  cueTo(s, c, 'rms-store-second', secondSqP, 1, { dur: 0.65 });
  cueTo(s, c, 'rms-second-result', secondStepP, 1, { after: true, dur: 0.35 });

  pulseCue(s, c, 'rms-sign', signFocusP, 1, { dur: 0.5 });
  cueTo(s, c, 'rms-no-correction', noCorrP, 1, { dur: 0.6 });
  cueTo(s, c, 'rms-epsilon', epsP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 7. adam-buffers: Keep signs and squared sizes separately
// Cues: adam-raw-mean, adam-raw-square, correct-mean, correct-square, cold-start-check
// ---------------------------------------------------------------------------
export function adamBuffers(s, c) {
  const mode = s.value(0); // 0 = chambers & bias correction (beats 0-1), 1 = 3-step zero-rate check (beat 2)
  const rawM = s.value(0);
  const rawV = s.value(0);
  const corrM = s.value(0);
  const corrV = s.value(0);
  const coldSteps = s.value(0); // 0 -> 3
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 7 }));
  s.add(aura(-430, 0, 480, '#2a588a28', '#151e3d10'));
  s.add(aura(430, 0, 480, '#ffd16622', '#151e3d10'));

  const a1 = RUNS.adam.records[0];

  const eqMhat = glowTex(String.raw`\hat{m}_1 = \frac{m_1}{1 - 0.9^1} = (100,\; 1)`, {
    x: -445,
    y: 212,
    size: 32,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqVhat = glowTex(String.raw`\hat{v}_1 = \frac{v_1}{1 - 0.999^1} = (10000,\; 1)`, {
    x: 445,
    y: 212,
    size: 32,
    color: COSMOS.gold,
    glow: 7,
  });

  // Beats 0-1: Dual moment chambers (m_1 signed, v_1 squared) + bias correction recovery
  const chambersView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const rm = rawM.value;
      const rv = rawV.value;
      const cm = corrM.value;
      const cv = corrV.value;

      const nodes = [
        txt('ADAM DUAL MOMENT CHAMBERS', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt(
          'Reset at w = (1, 1)  ·  g₁ = (100, 1)  ·  β₁ = 0.9, β₂ = 0.999',
          0,
          -372,
          30,
          COSMOS.muted,
          'mono',
        ),
        // Left chamber: first moment m
        glassPlate(-445, -4, 760, 616, { stroke: COSMOS.cyan, glow: 8 }),
        txt('FIRST MOMENT  m  (SIGNED)', -445, -264, 28, COSMOS.cyan, 'mono'),
        txt('m₁ = 0.9(0) + 0.1 g₁', -445, -208, 30, COSMOS.muted, 'mono'),
        // Fill bar for m_1 weight (10% filled)
        rect(560, 26, { fill: '#17213a', stroke: '#344774', width: 1.6, radius: 13 }).at(
          -445,
          -134,
        ),
        rect(Math.max(12, 56 * rm), 26, { fill: COSMOS.cyan, stroke: null, radius: 13 })
          .at(-445 - 280 + Math.max(12, 56 * rm) / 2, -134)
          .glow(10, COSMOS.cyan),
        txt(
          rm > 0.15
            ? `Raw m₁ = (${num(a1.mean[0] * rm, 1)}, ${num(a1.mean[1] * rm, 2)})`
            : 'm₀ = (0, 0)',
          -445,
          -66,
          36,
          COSMOS.cyan,
          'mono',
        ),
        txt('Observed weight = 1 − 0.9 = 0.10', -445, 6, 28, COSMOS.muted, 'mono'),
        line([-765, 82], [-125, 82], { stroke: '#2c3d66', width: 1.8 }),
        txt(
          cm > 0.1 ? 'BIAS-CORRECTED ESTIMATE' : 'DIVIDE BY OBSERVED WEIGHT',
          -445,
          130,
          26,
          COSMOS.emerald,
          'mono',
        ),
        // Right chamber: second moment v
        glassPlate(445, -4, 760, 616, { stroke: COSMOS.gold, glow: 8 }),
        txt('SECOND MOMENT  v  (SQUARED)', 445, -264, 28, COSMOS.gold, 'mono'),
        txt('v₁ = 0.999(0) + 0.001 g₁²', 445, -208, 30, COSMOS.muted, 'mono'),
        rect(560, 26, { fill: '#17213a', stroke: '#344774', width: 1.6, radius: 13 }).at(445, -134),
        rect(Math.max(12, 16 * rv), 26, { fill: COSMOS.gold, stroke: null, radius: 13 })
          .at(445 - 280 + Math.max(12, 16 * rv) / 2, -134)
          .glow(10, COSMOS.gold),
        txt(
          rv > 0.15
            ? `Raw v₁ = (${num(a1.square[0] * rv, 1)}, ${num(a1.square[1] * rv, 3)})`
            : 'v₀ = (0, 0)',
          445,
          -66,
          36,
          COSMOS.gold,
          'mono',
        ),
        txt('Observed weight = 1 − 0.999 = 0.001', 445, 6, 28, COSMOS.muted, 'mono'),
        line([125, 82], [765, 82], { stroke: '#2c3d66', width: 1.8 }),
        txt(
          cv > 0.1 ? 'BIAS-CORRECTED ESTIMATE' : 'DIVIDE BY OBSERVED WEIGHT',
          445,
          130,
          26,
          COSMOS.emerald,
          'mono',
        ),
        txt(
          'Squaring preserves magnitude even when gradients flip sign',
          0,
          376,
          30,
          COSMOS.muted,
          'sans',
        ),
      ];
      if (cm > 0.04) nodes.push(eqMhat.opacity(cm));
      if (cv > 0.04) nodes.push(eqVhat.opacity(cv));
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Three zero-rate updates showing raw buffers growing while corrected estimates stay constant!
  const coldView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const tPos = coldSteps.value;
      const tInt = Math.min(3, Math.max(1, Math.ceil(tPos + 0.001)));
      const rec = COLD.records[tInt - 1];
      const barW = 540;
      const obsM = 1 - 0.9 ** tInt;
      const obsV = 1 - 0.999 ** tInt;

      const nodes = [
        txt('COLD-START BOOKKEEPING CHECK  (η = 0)', 0, -424, 28, COSMOS.emerald, 'mono'),
        txt(
          `Step counter  t = ${tInt}   ·   w stays fixed at (1, 1)   ·   g repeats (100, 1)`,
          0,
          -372,
          30,
          COSMOS.ink,
          'mono',
        ),
      ];

      // 3 step column meters showing m_t rising (10 -> 19 -> 27.1) while m_hat stays locked at 100
      for (let i = 0; i < 3; i++) {
        const cx = -510 + i * 510;
        const r = COLD.records[i];
        const active = tPos >= i + 0.05;
        const p = clamp(tPos - i);
        const rawH = Math.max(10, (r.mean[0] / 100) * 210 * p);
        const corH = 210 * p;
        const baseY = 98;

        nodes.push(
          glassPlate(cx, -32, 450, 520, {
            stroke: active ? COSMOS.cyan : '#2c3d66',
            glow: active ? 8 : 3,
          }),
          txt(`UPDATE  t = ${i + 1}`, cx, -248, 28, active ? COSMOS.gold : COSMOS.muted, 'mono'),
          txt(
            `1 − 0.9^${i + 1} = ${num(1 - 0.9 ** (i + 1), 3)}`,
            cx,
            -200,
            26,
            COSMOS.muted,
            'mono',
          ),
          // Raw m bar vs Corrected m_hat bar
          rect(80, rawH, { fill: COSMOS.cyan, stroke: null, radius: 6 })
            .at(cx - 80, baseY - rawH / 2)
            .glow(8, COSMOS.cyan)
            .opacity(active ? 1 : 0.2),
          rect(80, corH, { fill: COSMOS.emerald, stroke: null, radius: 6 })
            .at(cx + 80, baseY - corH / 2)
            .glow(8, COSMOS.emerald)
            .opacity(active ? 1 : 0.2),
          txt(`m_${i + 1}`, cx - 80, baseY + 36, 26, COSMOS.cyan, 'mono'),
          txt(active ? num(r.mean[0], 1) : '0', cx - 80, baseY + 76, 30, COSMOS.cyan, 'mono'),
          txt(`m̂_${i + 1}`, cx + 80, baseY + 36, 26, COSMOS.emerald, 'mono'),
          txt(active ? '100' : '?', cx + 80, baseY + 76, 30, COSMOS.emerald, 'mono'),
        );
      }

      nodes.push(
        glassPlate(0, 314, 1460, 128, { stroke: COSMOS.emerald, glow: 6 }),
        txt(
          `Raw v_${tInt} = ${num(rec.square[0], 2)}  ÷  ${num(obsV, 4)}  =  10000  (constant!)`,
          0,
          286,
          30,
          COSMOS.gold,
          'mono',
        ),
        txt(
          `m̂ stays 100 across all ${tInt} steps (obs weight ${num(obsM, 3)})  ·  Changing gradients still lag`,
          0,
          342,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(chambersView, coldView);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'adam-raw-mean', rawM, 1, { dur: 0.75 });
  cueTo(s, c, 'adam-raw-square', rawV, 1, { dur: 0.75 });
  cueTo(s, c, 'correct-mean', corrM, 1, { dur: 0.75 });
  cueTo(s, c, 'correct-square', corrV, 1, { dur: 0.75 });

  c.onBeat(2, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'cold-start-check', coldSteps, 3, { dur: 2.2 });
}

// ---------------------------------------------------------------------------
// 8. adam-step: Turn those memories into a displacement
// Cues: adam-normalization-prediction, root-scale, normalized-ratio, adam-first-move
// ---------------------------------------------------------------------------
export function adamStep(s, c) {
  const predP = s.value(0);
  const rootP = s.value(0);
  const ratioP = s.value(0);
  const moveP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.44, seed: 8 }));
  s.add(aura(-280, 10, 500, '#1e8a6b24', '#151e3d10'));

  const a1 = RUNS.adam.records[0]; // lr = 0.08 -> moves (1,1) -> (0.92, 0.92)

  const eqAdam = glowTex(
    String.raw`\Delta w = -\eta\,\frac{\hat{m}_1}{\sqrt{\hat{v}_1} + \epsilon}`,
    {
      x: 560,
      y: -360,
      size: 38,
      color: COSMOS.emerald,
      glow: 8,
    },
  );

  const stage = dynamic(() => {
    const rp = rootP.value;
    const rat = ratioP.value;
    const mv = moveP.value;

    const bowl = contourBowl({
      cx: -310,
      cy: 16,
      width: 980,
      height: 670,
      aDomain: [-0.25, 1.25],
      bDomain: [-0.25, 1.25],
      aTicks: [0, 0.5, 1],
      bTicks: [0, 0.5, 1],
      accent: COSMOS.emerald,
    });

    const p0 = bowl.map(1, 1);
    const pCur = bowl.map(1 + a1.update[0] * mv, 1 + a1.update[1] * mv);
    const rx = 560;

    // Adaptive per-axis normalization ellipse around (1, 1) representing equal normalized reach
    const ellipsePts = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      const ea = 1 + 0.08 * Math.cos(th);
      const eb = 1 + 0.08 * Math.sin(th);
      ellipsePts.push(bowl.map(ea, eb));
    }

    const nodes = [
      txt('ADAM FIRST NORMALIZED DISPLACEMENT', -310, -396, 28, COSMOS.emerald, 'mono'),
      bowl.node,
      eqAdam,
      // Start beacon at (1, 1)
      circle(11, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3 }).at(p0[0], p0[1]),
    ];

    // Show adaptive equal-step circle around (1,1) once denominator builds
    if (rat > 0.05) {
      nodes.push(
        new Node(polyPath(ellipsePts, true))
          .stroke(COSMOS.gold, 2.8, 0.85 * rat)
          .glow(8, COSMOS.gold),
      );
    }

    // Diagonal displacement arrow
    if (mv > 0.02) {
      nodes.push(
        arrow(p0, pCur, { stroke: COSMOS.emerald, width: 6, tip: 15 }).glow(12, COSMOS.emerald),
        glowDot(pCur[0], pCur[1], { radius: 9.5, color: COSMOS.emerald, glow: 14 }),
      );
      if (mv > 0.9) {
        nodes.push(
          txt(pairText(a1.next, 3), pCur[0] - 115, pCur[1] + 46, 28, COSMOS.emerald, 'mono'),
        );
      }
    }

    // Right column: step-by-step normalization cards
    const asking = predP.value > 0.2 && rp < 0.02;
    nodes.push(
      glassPlate(rx, 40, 600, 620, { stroke: asking ? COSMOS.gold : COSMOS.emerald, glow: 8 }),
      txt('CORRECTED ESTIMATES', rx, -220, 26, COSMOS.muted, 'mono'),
      txt('m̂₁=(100,1) · v̂₁=(10000,1)', rx, -166, 28, COSMOS.cyan, 'mono'),
      line([rx - 255, -122], [rx + 255, -122], { stroke: '#2c3d66', width: 1.6 }),
    );

    if (asking) {
      nodes.push(
        txt('LEARNING RATE   η = 0.08', rx, -56, 28, COSMOS.gold, 'mono'),
        txt('Which coordinate gets', rx, 26, 38, COSMOS.ink, 'serif'),
        txt('the larger move?', rx, 84, 42, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
        txt('Calculate before building √v̂₁', rx, 178, 28, COSMOS.muted, 'sans'),
      );
    } else {
      nodes.push(
        txt('1. ROOT SCALE   √v̂₁', rx - 255, -82, 26, COSMOS.muted, 'mono', 'left'),
        txt(rp > 0.2 ? '(100,  1)' : '?', rx + 255, -82, 32, COSMOS.violet, 'mono', 'right'),
        txt('2. RATIO   m̂₁ / (√v̂₁ + ε)', rx, -10, 26, COSMOS.muted, 'mono'),
        txt(rat > 0.2 ? '(≈ 1.000,  ≈ 1.000)' : '?', rx, 38, 32, COSMOS.gold, 'mono'),
        line([rx - 255, 86], [rx + 255, 86], { stroke: '#2c3d66', width: 1.6 }),
        txt('3. DISPLACEMENT   −0.08 × ratio', rx, 134, 26, COSMOS.muted, 'mono'),
        txt(mv > 0.2 ? '(−0.080,  −0.080)' : '?', rx, 196, 38, COSMOS.emerald, 'mono').glow(
          8,
          COSMOS.emerald,
        ),
        txt(
          mv > 0.8 ? '100:1 gradient ratio cancels diagonally' : 'ε = 10⁻⁸ guards tiny gradients',
          rx,
          278,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(stage);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'adam-normalization-prediction', predP, 1, { dur: 0.5 });
  cueTo(s, c, 'root-scale', rootP, 1, { dur: 0.7 });
  cueTo(s, c, 'normalized-ratio', ratioP, 1, { dur: 0.75 });
  cueTo(s, c, 'adam-first-move', moveP, 1, { dur: 1.1 });
}

// ---------------------------------------------------------------------------
// 9. adam-history: One negative gradient, two optimizers
// Cues: hist-first, hist-second, hist-second-sum, hist-rms-direction [CB],
//       hist-directions [CB], hist-four, hist-update, hist-shallow, hist-variance,
//       observed-weights, weight-denominator, uncorrected-step, corrected-step
// ---------------------------------------------------------------------------
export function adamHistory(s, c) {
  const mode = s.value(0); // 0 = beat 0 buffers, 1 = beat 1 directions & step 4, 2 = beat 2 weights
  const h1 = s.value(0);
  const h2 = s.value(0);
  const h2Sum = s.value(0);
  const rmsDir = s.value(0);
  const adamDir = s.value(0);
  const h4 = s.value(0);
  const hUpdA = s.value(0);
  const hUpdB = s.value(0);
  const hVar = s.value(0);
  const obsW = s.value(0);
  const wDen = s.value(0);
  const uncorr = s.value(0);
  const corr = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 9 }));
  s.add(aura(-400, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(400, 0, 480, '#ffd1661c', '#151e3d10'));

  const eqWeight = glowTex(String.raw`\sum_{k=1}^{t} (1-\beta)\beta^{t-k} = 1 - \beta^t`, {
    x: 420,
    y: -90,
    size: 36,
    color: COSMOS.emerald,
    glow: 7,
  });
  const eqCorr = glowTex(String.raw`\hat{m}_t = \frac{m_t}{1 - \beta_1^t}`, {
    x: 420,
    y: 44,
    size: 40,
    color: COSMOS.gold,
    glow: 7,
  });

  // Beat 0: Replay inputs 1 & 2 into Adam buffers m and v + prediction prompt
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const is2 = h2.value > 0.3;
      const curM = is2
        ? PRESCRIBED[0].mean[0] + (PRESCRIBED[1].mean[0] - PRESCRIBED[0].mean[0]) * h2Sum.value
        : PRESCRIBED[0].mean[0] * h1.value;
      const curV = is2
        ? PRESCRIBED[0].square[0] +
          (PRESCRIBED[1].square[0] - PRESCRIBED[0].square[0]) * h2Sum.value
        : PRESCRIBED[0].square[0] * h1.value;
      const barW = 920;

      const nodes = [
        txt(
          'REPLAY FOUR GRADIENTS IN ADAM  (β₁ = 0.9, β₂ = 0.999, η = 0.01)',
          0,
          -422,
          28,
          COSMOS.cyan,
          'mono',
        ),
        // Input strip across top
        ...PRESCRIBED_GRADIENTS.flatMap(([ga, gb], idx) => {
          const cx = -570 + idx * 380;
          const active = (idx === 0 && !is2) || (idx === 1 && is2);
          return [
            glassPlate(cx, -310, 320, 82, {
              stroke: active ? COSMOS.cyan : '#2c3d66',
              glow: active ? 10 : 3,
            }),
            txt(
              `t=${idx + 1}: (${signed(ga, 0)}, ${num(gb, 2)})`,
              cx,
              -310,
              28,
              active ? COSMOS.cyan : COSMOS.muted,
              'mono',
            ),
          ];
        }),
        // Signed memory m bar
        txt('Signed buffer  m_a', -780, -110, 34, COSMOS.cyan, 'sans', 'left'),
        rect(barW, 34, { fill: '#151f38', stroke: '#2c3d66', width: 1.8, radius: 17 }).at(
          160,
          -110,
        ),
        rect(Math.max(14, (curM / 18) * barW), 34, { fill: COSMOS.cyan, stroke: null, radius: 17 })
          .at(160 - barW / 2 + Math.max(14, (curM / 18) * barW) / 2, -110)
          .glow(10, COSMOS.cyan),
        txt(`m_a = ${num(curM, 2)}`, 680, -110, 38, COSMOS.cyan, 'mono', 'left'),
        // Squared memory v bar
        txt('Squared buffer  v_a', -780, 60, 34, COSMOS.gold, 'sans', 'left'),
        rect(barW, 34, { fill: '#151f38', stroke: '#2c3d66', width: 1.8, radius: 17 }).at(160, 60),
        rect(Math.max(14, (curV / 18) * barW), 34, { fill: COSMOS.gold, stroke: null, radius: 17 })
          .at(160 - barW / 2 + Math.max(14, (curV / 18) * barW) / 2, 60)
          .glow(10, COSMOS.gold),
        txt(`v_a = ${num(curV, 2)}`, 680, 60, 38, COSMOS.gold, 'mono', 'left'),
      ];

      if (is2) {
        nodes.push(
          glassPlate(0, 276, 1340, 148, { stroke: COSMOS.gold, glow: 10 }),
          txt('Input 2 is −80:  RMSProp turns right', 0, 242, 30, COSMOS.muted, 'sans'),
          txt('Which way will Adam move weight a?', 0, 304, 42, COSMOS.gold, 'serif').glow(
            8,
            COSMOS.gold,
          ),
        );
      } else {
        nodes.push(
          txt(
            'After first input +100: both raw buffers start at 10.0',
            0,
            260,
            32,
            COSMOS.muted,
            'sans',
          ),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Step 2 opposite directions -> crossfade internally to Step 4 24.4x ratio
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const f4 = h4.value;
      const dirOp = fadeOut(f4);
      const step4Op = fadeIn(f4);
      const r2 = PRESCRIBED[1];
      const r4 = PRESCRIBED[3];

      const nodes = [];
      if (dirOp > 0.02) {
        nodes.push(
          group(
            txt(
              'STEP 2: ONE NEGATIVE GRADIENT (−80), TWO OPPOSITE MOVES',
              0,
              -412,
              28,
              COSMOS.gold,
              'mono',
            ),
            txt('Parameter change  Δa = −(subtracted step)', 0, -356, 32, COSMOS.muted, 'sans'),
            coordRuler({
              cx: 0,
              cy: -120,
              width: 1380,
              domain: [-0.015, 0.026],
              ticks: [-0.01, 0, 0.01, 0.02],
              tickFmt: (v) => signed(v, 2),
              start: 0,
              end: -r2.rmsUpdate[0],
              progress: rmsDir.value,
              color: COSMOS.gold,
              label: 'RMSProp  (follows current g = −80)',
              labelRight:
                rmsDir.value > 0.85 ? `Δa = ${signed(-r2.rmsUpdate[0], 5)}  (right)` : '?',
            }),
            coordRuler({
              cx: 0,
              cy: 110,
              width: 1380,
              domain: [-0.015, 0.026],
              ticks: [-0.01, 0, 0.01, 0.02],
              tickFmt: (v) => signed(v, 2),
              start: 0,
              end: -r2.adamUpdate[0],
              progress: adamDir.value,
              color: COSMOS.cyan,
              label: 'Adam  (still subtracts positive m₂ = +1)',
              labelRight:
                adamDir.value > 0.85 ? `Δa = ${signed(-r2.adamUpdate[0], 5)}  (left)` : '?',
            }),
            txt(
              adamDir.value > 0.85
                ? 'Signed memory m₂ = +1 overrides the latest negative gradient'
                : 'Starting both moves from 0 on the same ruler',
              0,
              310,
              32,
              COSMOS.ink,
              'sans',
            ),
          ).opacity(dirOp),
        );
      }

      if (step4Op > 0.02) {
        const barW = 840;
        const stepA = r4.adamUpdate[0];
        const stepB = r4.adamUpdate[1];
        const ratio = stepB / stepA;
        nodes.push(
          group(
            txt('AFTER INPUTS 3 (+70) & 4 (−60)  ·  ADAM STEP 4', 0, -412, 28, COSMOS.cyan, 'mono'),
            txt(
              `a: m₄ = ${num(r4.mean[0], 2)}, v₄ = ${num(r4.square[0], 2)}   ·   b: m₄ = ${num(r4.mean[1], 3)}`,
              0,
              -356,
              30,
              COSMOS.muted,
              'mono',
            ),
            // Bar for a step
            txt('a  (alternating)', -820, -140, 32, COSMOS.cyan, 'sans', 'left'),
            rect(barW, 38, { fill: '#151f38', stroke: '#2c3d66', width: 1.6, radius: 19 }).at(
              20,
              -140,
            ),
            rect(Math.max(18, (stepA / 0.011) * barW * hUpdA.value), 38, {
              fill: COSMOS.cyan,
              stroke: null,
              radius: 19,
            })
              .at(20 - barW / 2 + Math.max(18, (stepA / 0.011) * barW * hUpdA.value) / 2, -140)
              .glow(10, COSMOS.cyan),
            txt(
              hUpdA.value > 0.2 ? `≈ ${num(stepA, 5)}` : '?',
              475,
              -140,
              34,
              COSMOS.cyan,
              'mono',
              'left',
            ),
            // Bar for b step
            txt('b  (steady sign)', -820, 40, 32, COSMOS.emerald, 'sans', 'left'),
            rect(barW, 38, { fill: '#151f38', stroke: '#2c3d66', width: 1.6, radius: 19 }).at(
              20,
              40,
            ),
            rect(Math.max(18, (stepB / 0.011) * barW * hUpdB.value), 38, {
              fill: COSMOS.emerald,
              stroke: null,
              radius: 19,
            })
              .at(20 - barW / 2 + Math.max(18, (stepB / 0.011) * barW * hUpdB.value) / 2, 40)
              .glow(10, COSMOS.emerald),
            txt(
              hUpdB.value > 0.2 ? `≈ ${num(stepB, 5)} (${num(ratio, 1)}×)` : '?',
              475,
              40,
              34,
              COSMOS.emerald,
              'mono',
              'left',
            ),
            glassPlate(0, 270, 1440, 130, {
              stroke: hVar.value > 0.1 ? COSMOS.gold : '#2c3d66',
              glow: hVar.value > 0.1 ? 10 : 4,
            }),
            txt(
              'v_t averages uncentered g_t² (magnitude), NOT variance (g_t − μ)²',
              0,
              270,
              32,
              COSMOS.gold,
              'serif',
            ),
          ).opacity(step4Op),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Where bias correction factors come from (geometric observed weights 1 - beta^t)
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const weights = [0.081, 0.09, 0.1]; // (1-0.9)*0.9^2, (1-0.9)*0.9^1, (1-0.9)*0.9^0
      const cols = [COSMOS.violet, COSMOS.cyan, COSMOS.gold];
      const p = obsW.value;

      const nodes = [
        txt('WHERE BIAS CORRECTION COMES FROM', 0, -424, 28, COSMOS.emerald, 'mono'),
        txt(
          'Repeated gradient g = 4  ·  β₁ = 0.9, β₂ = 0.999  ·  η = 0.01',
          0,
          -372,
          30,
          COSMOS.muted,
          'mono',
        ),
        glassPlate(-410, -50, 820, 440, { stroke: COSMOS.cyan, glow: 6 }),
        txt('OBSERVED WEIGHTS AFTER t = 3', -410, -220, 28, COSMOS.cyan, 'mono'),
      ];

      // Enlarged 3 colored segments + unit bar below showing 0.271 of 1.0
      let curX = -760;
      let unitX = -760;
      const unitW = 680;
      nodes.push(
        rect(unitW, 38, { fill: '#151f38', stroke: '#4d6089', width: 2, radius: 8 }).at(
          -760 + unitW / 2,
          90,
        ),
        txt('Total unit weight = 1.000', -410, 146, 26, COSMOS.muted, 'mono'),
      );

      weights.forEach((w, idx) => {
        const segP = clamp(p * 3 - idx);
        const segW = w * 2400;
        const uW = w * unitW;
        if (segP > 0.02) {
          nodes.push(
            rect(segW - 6, 76, { fill: cols[idx], stroke: null, radius: 8 })
              .at(curX + segW / 2, -100)
              .glow(8, cols[idx])
              .opacity(segP),
            txt(`g${idx + 1}: ${num(w, 3)}`, curX + segW / 2, -24, 26, cols[idx], 'mono').opacity(
              segP,
            ),
            rect(uW, 38, { fill: cols[idx], stroke: null, radius: 4 })
              .at(unitX + uW / 2, 90)
              .opacity(segP),
          );
        }
        curX += segW;
        unitX += uW;
      });

      // Right plate: denominator formula
      nodes.push(
        glassPlate(420, -50, 740, 440, {
          stroke: wDen.value > 0.1 ? COSMOS.emerald : '#2c3d66',
          glow: wDen.value > 0.1 ? 8 : 3,
        }),
        txt('TOTAL OBSERVED WEIGHT', 420, -220, 28, COSMOS.emerald, 'mono'),
        txt(
          wDen.value > 0.2 ? 'At t = 3:  0.081 + 0.090 + 0.100 = 0.271' : 'Sum of weights = ?',
          420,
          140,
          28,
          COSMOS.emerald,
          'mono',
        ),
      );
      if (wDen.value > 0.04) {
        nodes.push(eqWeight.opacity(wDen.value), eqCorr.opacity(wDen.value));
      }

      // Bottom step-1 comparison: raw 0.03162 vs corrected 0.01
      nodes.push(
        glassPlate(-410, 310, 820, 160, {
          stroke: uncorr.value > 0.1 ? COSMOS.rose : '#2c3d66',
          glow: uncorr.value > 0.1 ? 8 : 3,
        }),
        txt('WITHOUT CORRECTION (t = 1)', -410, 272, 26, COSMOS.muted, 'mono'),
        txt(
          uncorr.value > 0.2 ? 'Step ≈ 0.03162  (3.16× inflated)' : 'Raw-buffer step = ?',
          -410,
          332,
          34,
          COSMOS.rose,
          'mono',
        ),
        glassPlate(420, 310, 740, 160, {
          stroke: corr.value > 0.1 ? COSMOS.emerald : '#2c3d66',
          glow: corr.value > 0.1 ? 10 : 3,
        }),
        txt('WITH BIAS CORRECTION (t = 1)', 420, 272, 26, COSMOS.muted, 'mono'),
        txt(
          corr.value > 0.2 ? 'Step = 0.01000  (exact η)' : 'Corrected step = ?',
          420,
          332,
          34,
          COSMOS.emerald,
          'mono',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'hist-first', h1, 1, { dur: 0.7 });
  pulseCue(s, c, 'hist-second', h2, 1, { dur: 0.4 });
  cueTo(s, c, 'hist-second-sum', h2Sum, 1, { dur: 0.8 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  // Strict CB withholding for prediction reveal
  cueTo(s, c, 'hist-rms-direction', rmsDir, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'hist-directions', adamDir, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'hist-four', h4, 1, { dur: 0.55 });
  cueTo(s, c, 'hist-update', hUpdA, 1, { dur: 0.65 });
  cueTo(s, c, 'hist-shallow', hUpdB, 1, { dur: 0.65 });
  pulseCue(s, c, 'hist-variance', hVar, 1, { dur: 0.5 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'observed-weights', obsW, 1, { dur: 1.1 });
  cueTo(s, c, 'weight-denominator', wDen, 1, { dur: 0.75 });
  cueTo(s, c, 'uncorrected-step', uncorr, 1, { dur: 0.65 });
  cueTo(s, c, 'corrected-step', corr, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 10. objective-scale: Find the limit of Adam scale cancellation
// Cues: scale-objective, scale-signed, scale-square, scale-root, scale-cancel,
//       eps-large, eps-equal, eps-tiny, scale-past, scale-break, scale-record
// ---------------------------------------------------------------------------
export function objectiveScale(s, c) {
  const mode = s.value(0); // 0 = c-scaling (beat 0), 1 = epsilon curve (beat 1), 2 = mid-run switch (beat 2)
  const scObj = s.value(0);
  const scM = s.value(0);
  const scV = s.value(0);
  const scR = s.value(0);
  const scCancel = s.value(0);
  const eps1 = s.value(0);
  const eps2 = s.value(0);
  const eps3 = s.value(0);
  const pastP = s.value(0);
  const breakP = s.value(0);
  const recP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.44, seed: 10 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d10'));
  s.add(aura(380, 0, 480, '#552f9624', '#151e3d10'));

  const eqCancel = glowTex(
    String.raw`\frac{c\,\hat{m}}{\sqrt{c^2\,\hat{v}}} = \frac{c\,\hat{m}}{c\,\sqrt{\hat{v}}} = \frac{\hat{m}}{\sqrt{\hat{v}}}`,
    { x: 430, y: 240, size: 38, color: COSMOS.emerald, glow: 8 },
  );
  const eqEps = glowTex(String.raw`\Delta w = 0.01\,\frac{g}{|g| + 10^{-8}}`, {
    x: 560,
    y: -310,
    size: 38,
    color: COSMOS.gold,
    glow: 8,
  });

  // Beat 0: Global scale factor c = 3 cancels when eps = 0
  const beat0View = guardedDynamic(
    () => stageVis(mode.value, 0),
    (vis) => {
      const rows = [
        {
          label: 'Signed estimate  m̂',
          p: scM.value,
          v0: 100,
          v1: 300,
          max: 350,
          col: COSMOS.cyan,
          rhs: '× c',
        },
        {
          label: 'Squared estimate  v̂',
          p: scV.value,
          v0: 10000,
          v1: 90000,
          max: 100000,
          col: COSMOS.gold,
          rhs: '× c²',
        },
        {
          label: 'Root scale  √v̂',
          p: scR.value,
          v0: 100,
          v1: 300,
          max: 350,
          col: COSMOS.emerald,
          rhs: '× c',
        },
      ];
      const barW = 680;
      const nodes = [
        txt('GLOBAL OBJECTIVE SCALING  (c = 3)', 0, -424, 28, COSMOS.cyan, 'mono'),
        txt(
          'Mean → Sum multiplies all gradients g_t ↦ c · g_t  (SGD step × c)',
          0,
          -372,
          30,
          scObj.value > 0.1 ? COSMOS.ink : COSMOS.muted,
          'sans',
        ),
      ];

      rows.forEach((r, idx) => {
        const y = -205 + idx * 175;
        const val = r.v0 + (r.v1 - r.v0) * r.p;
        const fillW = Math.max(16, (val / r.max) * barW);
        nodes.push(
          txt(r.label, -790, y - 34, 30, r.col, 'sans', 'left'),
          txt(`${num(val, 0)}`, -110, y - 34, 32, r.col, 'mono', 'right'),
          rect(barW, 30, { fill: '#151f38', stroke: '#2c3d66', width: 1.6, radius: 15 }).at(
            -450,
            y + 16,
          ),
          rect(fillW, 30, { fill: r.col, stroke: null, radius: 15 })
            .at(-790 + fillW / 2, y + 16)
            .glow(10, r.col),
          txt(r.p > 0.2 ? r.rhs : '× 1', -45, y + 16, 36, r.col, 'mono', 'left'),
        );
      });

      // Right cancellation plate
      nodes.push(
        glassPlate(430, 50, 720, 520, {
          stroke: scCancel.value > 0.1 ? COSMOS.emerald : '#2c3d66',
          glow: scCancel.value > 0.1 ? 10 : 4,
        }),
        txt('EXACT CANCELLATION WHEN ε = 0', 430, -148, 28, COSMOS.emerald, 'mono'),
        txt('Numerator scales by c', 430, -60, 32, COSMOS.cyan, 'sans'),
        txt('Denominator scales by √(c²) = c', 430, 10, 32, COSMOS.gold, 'sans'),
        txt(
          scCancel.value > 0.3 ? 'Factor c divides out completely' : 'Ratio after scaling = ?',
          430,
          96,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
      if (scCancel.value > 0.04) nodes.push(eqCancel.opacity(scCancel.value));

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 1: Log-scale epsilon transition curve (100% -> 50% -> 1% of lr)
  const beat1View = guardedDynamic(
    () => stageVis(mode.value, 1),
    (vis) => {
      const plot = luminousPlot({
        cx: -265,
        cy: 26,
        width: 1020,
        height: 540,
        xDomain: [-10.5, 0.5],
        yDomain: [0, 0.0112],
        xTicks: [-10, -8, -4, 0],
        yTicks: [0, 0.005, 0.01],
        xFmt: (v) => `10^${v}`,
        yFmt: (v) => num(v, 3),
        xLabel: 'gradient magnitude  |g|',
        yLabel: 'step size  Δw',
        accent: COSMOS.gold,
      });

      const stepFn = (logG) => {
        const g = 10 ** logG;
        return (0.01 * g) / (g + 1e-8);
      };

      // Build curve dynamically across the three stages (0 -> -8 -> -10)
      const curvePts = [];
      const maxLog = 0;
      const minLog =
        eps3.value > 0.02 ? -8 - 2 * eps3.value : eps2.value > 0.02 ? -8 * eps2.value : 0;
      const N = 80;
      if (eps1.value > 0.02) {
        for (let i = 0; i <= N; i++) {
          const lx = maxLog + (minLog - maxLog) * (i / N);
          curvePts.push(plot.map(lx, stepFn(lx)));
        }
      }

      const rx = 560;
      const nodes = [
        txt(
          'WHERE SCALE INVARIANCE BREAKS  (ε = 10⁻⁸, η = 0.01)',
          -265,
          -396,
          28,
          COSMOS.gold,
          'mono',
        ),
        plot.node,
        eqEps,
        // Vertical dashed reference at g = eps = 10^-8
        line([plot.mapX(-8), plot.mapY(0)], [plot.mapX(-8), plot.mapY(0.011)], {
          stroke: COSMOS.gold,
          width: 2.2,
          dash: [6, 8],
        }).opacity(0.65),
      ];

      if (curvePts.length >= 2) {
        nodes.push(glowingTrail(curvePts, { color: COSMOS.cyan, width: 5, glow: 12 }));
      }

      const markers = [
        { p: eps1.value, lx: 0, label: 'g = 1', share: '≈ 100% of η', col: COSMOS.cyan, y: -140 },
        {
          p: eps2.value,
          lx: -8,
          label: 'g = ε = 10⁻⁸',
          share: '= 50% of η',
          col: COSMOS.gold,
          y: 20,
        },
        {
          p: eps3.value,
          lx: -10,
          label: 'g = 0.01 ε',
          share: '≈ 1% of η',
          col: COSMOS.emerald,
          y: 180,
        },
      ];
      for (const m of markers) {
        const pt = plot.map(m.lx, stepFn(m.lx));
        if (m.p > 0.5) {
          nodes.push(glowDot(pt[0], pt[1], { radius: 10, color: m.col, glow: 14 }));
        }
        nodes.push(
          glassPlate(rx, m.y, 520, 128, {
            stroke: m.p > 0.2 ? m.col : '#2c3d66',
            glow: m.p > 0.2 ? 8 : 3,
          }),
          txt(m.label, rx - 220, m.y - 24, 30, m.col, 'mono', 'left'),
          txt(m.p > 0.4 ? m.share : '?', rx - 220, m.y + 28, 32, COSMOS.ink, 'mono', 'left'),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Mid-run scale switch produces opposite directions (-71 vs +10)!
  const beat2View = guardedDynamic(
    () => stageVis(mode.value, 2),
    (vis) => {
      const nodes = [
        txt('CHANGE SCALE MID-RUN  ·  SAME INPUT −800', 0, -424, 28, COSMOS.rose, 'mono'),
        txt(
          'Unscaled inputs: +100 then −80  ·  10× scale switch at step 2',
          0,
          -372,
          30,
          COSMOS.muted,
          'mono',
        ),
        // Top rail: switched mid-run (old m1 = 10 -> 0.9*10 = 9, + 0.1*(-800) = -71)
        glassPlate(0, -140, 1520, 210, { stroke: COSMOS.rose, glow: 8 }),
        coordRuler({
          cx: 0,
          cy: -125,
          width: 1360,
          domain: [-85, 110],
          ticks: [-80, -40, 0, 40, 80, 100],
          tickFmt: (v) => num(v, 0),
          start: 9,
          end: -71,
          progress: pastP.value,
          color: COSMOS.rose,
          label: 'Scale switched on step 2:  0.9(10) + 0.1(−800)',
          labelRight: pastP.value > 0.85 ? 'm₂ = −71  (moves right)' : 'carry +9',
        }),
        // Bottom rail: scaled from start (old m1 = 100 -> 0.9*100 = 90, + 0.1*(-800) = +10)
        glassPlate(0, 130, 1520, 210, { stroke: COSMOS.emerald, glow: 8 }),
        coordRuler({
          cx: 0,
          cy: 145,
          width: 1360,
          domain: [-85, 110],
          ticks: [-80, -40, 0, 40, 80, 100],
          tickFmt: (v) => num(v, 0),
          start: 90,
          end: 10,
          progress: breakP.value,
          color: COSMOS.emerald,
          label: 'Scaled 10× from step 1:  0.9(100) + 0.1(−800)',
          labelRight: breakP.value > 0.85 ? 'm₂ = +10  (moves left)' : 'carry +90',
        }),
        glassPlate(0, 354, 1420, 100, {
          stroke: recP.value > 0.1 ? COSMOS.gold : '#2c3d66',
          glow: recP.value > 0.1 ? 10 : 4,
        }),
        txt(
          'Record loss reduction, batch weighting, clipping & penalty path',
          0,
          354,
          32,
          COSMOS.gold,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, beat2View);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'scale-objective', scObj, 1, { dur: 0.45 });
  cueTo(s, c, 'scale-signed', scM, 1, { dur: 0.7 });
  cueTo(s, c, 'scale-square', scV, 1, { dur: 0.7 });
  cueTo(s, c, 'scale-root', scR, 1, { dur: 0.7 });
  cueTo(s, c, 'scale-cancel', scCancel, 1, { dur: 0.65 });

  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'eps-large', eps1, 1, { dur: 0.65 });
  cueTo(s, c, 'eps-equal', eps2, 1, { dur: 0.8 });
  cueTo(s, c, 'eps-tiny', eps3, 1, { dur: 0.8 });

  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'scale-past', pastP, 1, { dur: 0.85 });
  cueTo(s, c, 'scale-break', breakP, 1, { dur: 0.85 });
  pulseCue(s, c, 'scale-record', recP, 1, { dur: 0.5 });
}
