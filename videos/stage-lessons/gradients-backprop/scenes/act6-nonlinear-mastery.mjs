// Act 6: Nonlinear Hidden Unit Forward & Backprop, 4-Weight Overshoot & Repair,
// Deep Product Vanishing/Exploding & Residual Highway, Your Turn Challenge, and Fresh Finale.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CHALLENGE_START,
  CHALLENGE_UNSEEN,
  CHALLENGE_UPDATED,
  COSMOS,
  HIDDEN_COPIED_FRESH,
  HIDDEN_DEAD_UNIT,
  HIDDEN_FRESH_STEP,
  HIDDEN_STEP_FULL,
  HIDDEN_STEP_HALF,
  NONLINEAR_START,
  aura,
  cinemaGrid,
  compNode,
  cueTo,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  hiddenUnit,
  hiddenUnitFlow,
  livingDrift,
  makePlot2d,
  photonWire,
  polyPath,
  pulseCue,
  trialRuler,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 24. nonlinear-forward: Carry one request through a hidden unit
// Cues: nonlinear-forward-b1, hidden-affine-shift, hidden-first-hinge, hidden-second-hinge,
//       nonlinear-forward-b2, hidden-h, hidden-z, hidden-prediction, hidden-loss,
//       nonlinear-forward-b3, hidden-output-pair*, hidden-gate-return*, hidden-reverse-values
// ---------------------------------------------------------------------------
export function nonlinearForward(s, c) {
  const mode = s.value(0); // 0=piecewise ReLU bends plot, 1=hidden unit forward & backprop flow
  const shiftP = s.value(0);
  const hinge1P = s.value(0);
  const hinge2P = s.value(0);
  const fwdStage = s.value(0); // 0 -> 1(h) -> 2(z) -> 3(pred) -> 4(loss)
  const backStage = s.value(0); // 0 -> 1(-1) -> 2(w2,b2) -> 3(gate) -> 4(w1,b1)
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 181 }));
  s.add(aura(-360, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(400, 0, 460, '#ff6b8b1e', '#18142a10'));

  const hingePlot = makePlot2d({
    left: -680,
    right: 680,
    top: -255,
    bottom: 240,
    xDomain: [-2, 2],
    yDomain: [-2, 4],
    xTicks: [-2, -1, 0, 1, 2],
    yTicks: [-2, 0, 2, 4],
    xLabel: 'input x',
    yLabel: 'output',
    showZeroX: true,
    showZeroY: true,
  });

  // Beat 0: Linear collapse vs affine shift + 1st ReLU hinge + 2nd ReLU hinge
  const bendsView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const sh = shiftP.value;
      const h1 = hinge1P.value;
      const h2 = hinge2P.value;

      const nodes = [
        txt('WHY NONLINEARITIES MATTER', -680, -378, 26, COSMOS.cyan, 'mono', 'left'),
        hingePlot.axes,
      ];

      if (h1 < 0.05) {
        const bias = 0.5 * sh;
        nodes.push(
          line([hingePlot.X(-2), hingePlot.Y(-2 + bias)], [hingePlot.X(2), hingePlot.Y(2 + bias)], {
            stroke: COSMOS.cyan,
            width: 5.5,
          }).glow(10, COSMOS.cyan),
          txt(
            sh < 0.05
              ? '½ × (2x) = x   (linear maps collapse!)'
              : `x + ${fmt(bias, 2)}   (still a straight line)`,
            0,
            -322,
            34,
            COSMOS.gold,
            'mono',
          ).glow(8, COSMOS.gold),
        );
      } else {
        // Dashed reference of clipped negative half
        nodes.push(
          line([hingePlot.X(-2), hingePlot.Y(-1.5)], [hingePlot.X(-0.5), hingePlot.Y(0)], {
            stroke: '#4d6089',
            width: 2.2,
            dash: [7, 7],
          }),
          // Flat 0 segment left of -0.5
          line(
            [hingePlot.X(-0.5 - 1.5 * h1), hingePlot.Y(0)],
            [hingePlot.X(-0.5), hingePlot.Y(0)],
            {
              stroke: COSMOS.cyan,
              width: 5.5,
            },
          ).glow(10, COSMOS.cyan),
          // Rising slope 1 segment [-0.5, 0.5]
          line([hingePlot.X(-0.5), hingePlot.Y(0)], [hingePlot.X(0.5), hingePlot.Y(1)], {
            stroke: COSMOS.cyan,
            width: 5.5,
          }).glow(10, COSMOS.cyan),
          dot(9, COSMOS.gold).at(hingePlot.X(-0.5), hingePlot.Y(0)).glow(12, COSMOS.gold),
        );

        if (h2 < 0.05) {
          nodes.push(
            line([hingePlot.X(0.5), hingePlot.Y(1)], [hingePlot.X(2), hingePlot.Y(2.5)], {
              stroke: COSMOS.cyan,
              width: 5.5,
            }).glow(10, COSMOS.cyan),
            txt('ReLU(x + 0.5): 1 bend at x = −0.5', 0, -322, 34, COSMOS.cyan, 'mono').glow(
              8,
              COSMOS.cyan,
            ),
          );
        } else {
          const xEnd = 0.5 + 1.5 * h2;
          nodes.push(
            line([hingePlot.X(0.5), hingePlot.Y(1)], [hingePlot.X(2), hingePlot.Y(2.5)], {
              stroke: '#4d6089',
              width: 2.2,
              dash: [7, 7],
            }),
            line([hingePlot.X(0.5), hingePlot.Y(1)], [hingePlot.X(xEnd), hingePlot.Y(2 * xEnd)], {
              stroke: COSMOS.emerald,
              width: 6,
            }).glow(12, COSMOS.emerald),
            dot(9, COSMOS.emerald).at(hingePlot.X(0.5), hingePlot.Y(1)).glow(12, COSMOS.emerald),
            txt(
              'ReLU(x + 0.5) + ReLU(x − 0.5)   (slope doubles to 2 past +0.5)',
              0,
              -322,
              32,
              COSMOS.emerald,
              'mono',
            ).glow(8, COSMOS.emerald),
          );
        }
      }

      nodes.push(
        txt(
          'ReLU units bend straight lines into piecewise-linear curves',
          0,
          365,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beats 1-2: 4-parameter hidden unit forward & backprop flow
  const baseUnit = hiddenUnit(NONLINEAR_START, 2, 5);
  const flowView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const fs = Math.round(fwdStage.value);
      const bs = Math.round(backStage.value);
      return group(
        txt(
          'ONE HIDDEN RELU UNIT: FORWARD & BACKPROP',
          -820,
          -402,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        hiddenUnitFlow(baseUnit, {
          yCenter: -40,
          forwardStage: fs,
          backwardStage: bs,
          showWeights: true,
          showGradSummary: bs >= 4,
          gradQuestion: bs === 0 && fs >= 4,
          drift: drift.value,
        }),
        txt(
          bs >= 4
            ? 'All 4 gradients computed in one backward pass (Rumelhart et al., 1986)'
            : 'Saved forward activations (h, z) power every factor on the return sweep',
          0,
          402,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(bendsView, flowView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'nonlinear-forward-b1', introPulse, 1, { dur: 0.4 });
  cueTo(s, c, 'hidden-affine-shift', shiftP, 1, { dur: 0.65 });
  cueTo(s, c, 'hidden-first-hinge', hinge1P, 1, { dur: 0.65 });
  cueTo(s, c, 'hidden-second-hinge', hinge2P, 1, { dur: 0.75 });

  cueTo(s, c, 'nonlinear-forward-b2', mode, 1, { dur: 0.5 });
  cueTo(s, c, 'hidden-h', fwdStage, 1, { dur: 0.35 });
  cueTo(s, c, 'hidden-z', fwdStage, 2, { dur: 0.35 });
  cueTo(s, c, 'hidden-prediction', fwdStage, 3, { dur: 0.35 });
  cueTo(s, c, 'hidden-loss', fwdStage, 4, { dur: 0.35 });

  cueTo(s, c, 'nonlinear-forward-b3', backStage, 1, { dur: 0.35 });
  cueTo(s, c, 'hidden-output-pair', backStage, 2, { dur: 0.35 });
  cueTo(s, c, 'hidden-gate-return', backStage, 3, { dur: 0.35 });
  cueTo(s, c, 'hidden-reverse-values', backStage, 4, { dur: 0.4 });
}

// ---------------------------------------------------------------------------
// 25. nonlinear-update: Where will the four weights take this request?
// Cues: nonlinear-update-b1, hidden-update-knobs, nonlinear-update-b2,
//       hidden-overshoot-result*, nonlinear-update-b3, hidden-repair-knobs,
//       hidden-replay-half*, hidden-repair-result*
// ---------------------------------------------------------------------------
export function nonlinearUpdate(s, c) {
  const showKnobs1 = s.value(0);
  const run1P = s.value(0);
  const showLoss1 = s.value(0);
  const showSecond = s.value(0);
  const showKnobs2 = s.value(0);
  const run2P = s.value(0);
  const showLoss2 = s.value(0);
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 191 }));
  s.add(aura(120, 120, 520, '#2a588a22', '#151e3d10'));

  const names = ['w₁ (first)', 'b₁ (hidden)', 'w₂ (output)', 'b₂ (output)'];
  const full = HIDDEN_STEP_FULL;
  const half = HIDDEN_STEP_HALF;

  const interpUnit = (step, t) =>
    hiddenUnit(
      step.before.weights.map((w, i) => w + t * (step.after.weights[i] - w)),
      2,
      5,
    );

  const liveScene = dynamic(() => {
    const sec = showSecond.value > 0.3;
    const step = sec ? half : full;
    const kVis = sec ? showKnobs2.value : showKnobs1.value;
    const u1 = interpUnit(full, run1P.value);
    const u2 = interpUnit(half, run2P.value);
    const active = sec ? u2 : u1;

    const nodes = [
      txt('4-PARAMETER NONLINEAR UPDATE', -830, -402, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Input x = 2   ·   Target y = 5 s   ·   Start ŷ = 4.5 s (miss 0.5 s)',
        -830,
        -346,
        30,
        COSMOS.ink,
        'sans',
        'left',
      ),
      // Parameter table (clean typographic grid, no heavy cards)
      txt('Gradient', -830, -185, 28, COSMOS.rose, 'mono', 'left'),
      txt(sec ? 'Rate 0.025' : 'Rate 0.05', -830, -110, 28, COSMOS.gold, 'mono', 'left'),
    ];

    names.forEach((nm, i) => {
      const x = -380 + i * 370;
      const revealed = kVis >= (i + 0.5) / 4;
      nodes.push(
        txt(nm, x, -252, 26, COSMOS.muted, 'mono'),
        txt(fmt(step.before.gradient[i], 2), x, -185, 36, COSMOS.rose, 'mono').glow(6, COSMOS.rose),
        txt(
          `${fmt(step.before.weights[i], 2)} → ${revealed ? fmt(step.after.weights[i], 3) : '?'}`,
          x,
          -110,
          32,
          COSMOS.gold,
          'mono',
        ).glow(revealed ? 8 : 0, COSMOS.gold),
      );
    });

    nodes.push(
      line([-830, -52], [830, -52], { stroke: '#2c3d66', width: 1.8 }),
      txt(
        `Hidden activation along step:  z = ${fmt(active.z, 3)}`,
        -830,
        4,
        30,
        COSMOS.blue,
        'mono',
        'left',
      ),
      trialRuler({
        y: 120,
        label: 'Rate 0.05',
        target: 5,
        start: 4.5,
        current: u1.prediction,
        color: showLoss1.value > 0.3 ? COSMOS.rose : COSMOS.cyan,
        showLoss: showLoss1.value > 0.3,
      }),
    );

    if (sec) {
      nodes.push(
        trialRuler({
          y: 300,
          label: 'Rate 0.025',
          target: 5,
          start: 4.5,
          current: u2.prediction,
          color: COSMOS.emerald,
          showLoss: showLoss2.value > 0.3,
        }),
      );
    } else {
      nodes.push(
        txt(
          run1P.value < 0.05
            ? 'All 4 gradients are negative: subtracting raises all 4 knobs. Where will ŷ land?'
            : showLoss1.value > 0.3
              ? 'Overshot to 5.80 s: loss jumped from 0.25 to 0.64 s²!'
              : 'Starting loss = 0.25 s²   ·   Would you keep this step?',
          0,
          318,
          30,
          showLoss1.value > 0.3 ? COSMOS.rose : COSMOS.gold,
          'serif',
        ).glow(8 + 3 * introPulse.value, showLoss1.value > 0.3 ? COSMOS.rose : COSMOS.gold),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'nonlinear-update-b1', introPulse, 1, { dur: 0.45 });

  cueTo(s, c, 'hidden-update-knobs', showKnobs1, 1, { dur: 0.7 });
  cueTo(s, c, 'nonlinear-update-b2', run1P, 1, { dur: 0.9 });

  // caption_boundary: reveal loss 0.64 strictly on/after hidden-overshoot-result
  cueTo(s, c, 'hidden-overshoot-result', showLoss1, 1, { after: true, dur: 0.35 });

  cueTo(s, c, 'nonlinear-update-b3', showSecond, 1, { dur: 0.4 });
  cueTo(s, c, 'hidden-repair-knobs', showKnobs2, 1, { dur: 0.7 });
  cueTo(s, c, 'hidden-replay-half', run2P, 1, { dur: 0.85 });

  // caption_boundary: reveal 0.01890625 strictly on/after hidden-repair-result
  cueTo(s, c, 'hidden-repair-result', showLoss2, 1, { after: true, dur: 0.35 });
}

// ---------------------------------------------------------------------------
// 26. deep-products: A missing signal can have several causes
// Cues: deep-products-b1, inactive-backward, deep-products-b2, deep-chain,
//       deep-products-ten, deep-double-ten, deep-products-b3
// ---------------------------------------------------------------------------
export function deepProducts(s, c) {
  const mode = s.value(0); // 0=dead ReLU (b1=-4), 1=10-layer vanishing/exploding, 2=residual bypass
  const deadBack = s.value(0);
  const vanishP = s.value(0); // 0 -> 10 steps of 0.5
  const explodeP = s.value(0); // 0 -> 10 steps of 2
  const deadPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.rose, opacity: 0.44, seed: 199 }));
  s.add(aura(-360, 0, 480, '#ff6b8b1e', '#1a122610'));
  s.add(aura(400, 0, 460, '#ffd1661c', '#18142a10'));

  // Phase 0: Dead ReLU when hidden bias b1 = -4
  const deadView = guardedDynamic(
    () => fadeOut(Math.min(1, mode.value)),
    (vis) =>
      group(
        txt(
          'CAUSE 1: DEAD RELU  (b₁ = −4 → h = −1 < 0)',
          -820,
          -402,
          26,
          COSMOS.rose,
          'mono',
          'left',
        ),
        hiddenUnitFlow(HIDDEN_DEAD_UNIT, {
          yCenter: -40,
          forwardStage: 4,
          backwardStage: Math.round(deadBack.value * 4),
          showWeights: true,
          showGradSummary: deadBack.value > 0.85,
          drift: drift.value,
        }),
        txt(
          'Output bias gets −9, yet the closed gate cuts off w₁ and b₁ completely',
          0,
          402,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis),
  );

  // Phase 1: 10-layer vanishing (0.5^10 = 1/1024) vs exploding (2^10 = 1024) cascade
  const chainView = guardedDynamic(
    () => {
      const m = mode.value;
      if (m <= 0.5) return 0;
      if (m < 1.5) return fadeIn(m);
      return fadeOut(m - 1);
    },
    (vis) => {
      const nVan = Math.round(vanishP.value * 10);
      const nExp = Math.round(explodeP.value * 10);

      const rows = [
        {
          y: -150,
          label: 'VANISHING  (× 0.5)',
          n: nVan,
          rate: 0.5,
          col: COSMOS.cyan,
          valText: nVan === 10 ? '1 / 1024 ≈ 0.000977' : fmt(0.5 ** nVan, 5),
        },
        {
          y: 155,
          label: 'EXPLODING  (× 2.0)',
          n: nExp,
          rate: 2,
          col: COSMOS.rose,
          valText: String(2 ** nExp),
        },
      ];

      const nodes = [
        txt(
          'CAUSE 2: REPEATED MULTIPLICATION ACROSS DEPTH',
          -820,
          -395,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
      ];

      for (const r of rows) {
        nodes.push(txt(r.label, -820, r.y - 68, 28, r.col, 'mono', 'left'));
        for (let i = 0; i < 10; i++) {
          const x = -540 + i * 124;
          const lit = i < r.n;
          const rad = lit
            ? r.rate < 1
              ? Math.max(7, 22 - i * 1.5)
              : Math.min(28, 10 + i * 1.9)
            : 10;
          if (i < 9) {
            nodes.push(
              line([x + rad + 4, r.y], [x + 124 - 12, r.y], {
                stroke: lit ? r.col : '#2c3d66',
                width: lit ? 3.5 : 2,
              }),
            );
          }
          nodes.push(
            dot(rad, lit ? r.col : '#2c3d66')
              .at(x, r.y)
              .glow(lit ? 12 : 0, r.col),
          );
        }
        nodes.push(
          txt(`1 × (${r.rate})^${r.n} = ${r.valText}`, 0, r.y + 82, 34, r.col, 'mono').glow(
            r.n > 0 ? 8 : 0,
            r.col,
          ),
        );
      }

      nodes.push(
        txt(
          'In matrix networks, growth or decay also depends on singular directions',
          0,
          388,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Phase 2: Residual highway x + F(x) with slope 1 + F'(x)
  const resEq = glowTex(String.raw`\frac{d}{dx}\bigl[x + F(x)\bigr] = 1 + F'(x)`, {
    x: 0,
    y: 235,
    size: 50,
    color: COSMOS.gold,
    glow: 10,
  });

  const residualView = guardedDynamic(
    () => fadeIn(Math.max(0, mode.value - 1)),
    (vis) => {
      const dr = drift.value;
      return group(
        txt(
          'RESIDUAL HIGHWAY: A DIRECT SLOPE-1 PATH',
          -820,
          -395,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        ),
        // Direct bypass highway arc above
        photonWire(
          [
            [-580, -70],
            [-580, -230],
            [580, -230],
            [580, -70],
          ],
          dr * 2.4,
          { color: COSMOS.gold, width: 5, glow: 14, reverse: true },
        ),
        txt(
          'Identity shortcut: local slope = 1 (always open!)',
          0,
          -276,
          30,
          COSMOS.gold,
          'mono',
        ).glow(10, COSMOS.gold),
        // Main branch x -> F(x) -> x + F(x)
        photonWire(
          [
            [-475, -10],
            [-170, -10],
          ],
          dr * 2.2,
          { color: COSMOS.cyan, width: 3.6 },
        ),
        photonWire(
          [
            [170, -10],
            [455, -10],
          ],
          dr * 2.2 + 0.35,
          { color: COSMOS.cyan, width: 3.6 },
        ),
        glassPlate(-580, -10, 200, 120, { stroke: COSMOS.blue, glow: 9 }),
        txt('x', -580, -10, 48, COSMOS.blue, 'mono'),
        glassPlate(0, -10, 330, 120, { stroke: COSMOS.cyan, glow: 9 }),
        txt('F(x)', 0, -10, 46, COSMOS.cyan, 'mono'),
        glassPlate(580, -10, 240, 120, { stroke: COSMOS.emerald, glow: 11 }),
        txt('x + F(x)', 580, -10, 36, COSMOS.emerald, 'mono'),
        txt(
          'Normalization stabilizes scale  ·  Save activations (memory) or recompute (time)',
          0,
          368,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(deadView, chainView, residualView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'deep-products-b1', deadPulse, 1, { dur: 0.4 });
  cueTo(s, c, 'inactive-backward', deadBack, 1, { dur: 1.0 });

  pulseCue(s, c, 'deep-products-b2', deadPulse, 0.5, { dur: 0.35 });
  cueTo(s, c, 'deep-chain', mode, 1, { dur: 0.5 });
  cueTo(s, c, 'deep-products-ten', vanishP, 1, { dur: 1.1 });
  cueTo(s, c, 'deep-double-ten', explodeP, 1, { dur: 1.1 });

  cueTo(s, c, 'deep-products-b3', mode, 2, { dur: 0.55 });
  const resOffset = Math.max(0.1, c.cue('deep-products-b3').start - c.start + 0.34);
  c.at(resOffset, () => s.add(resEq));
}

// ---------------------------------------------------------------------------
// 27. keep-the-model-honest: Your turn: a new request
// Cues: challenge-input, challenge-gradient, challenge-update,
//       challenge-heldout, challenge-unseen-result
// ---------------------------------------------------------------------------
export function keepTheModelHonest(s, c) {
  const inputPulse = s.value(0);
  const gradReveal = s.value(0);
  const updateReveal = s.value(0);
  const unseenShow = s.value(0);
  const unseenPred = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 211 }));
  s.add(aura(-420, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(440, 0, 460, '#ff6b8b1e', '#18142a10'));

  const liveScene = dynamic(() => {
    const gr = gradReveal.value > 0.3;
    const ur = updateReveal.value > 0.3;
    const us = unseenShow.value;
    const up = unseenPred.value > 0.3;

    const nodes = [
      txt(
        'YOUR TURN: FIT ONE ROW, THEN TEST GENERALIZATION',
        -820,
        -395,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      // Left plate: Training request
      glassPlate(-430, -5, 760, 620, { stroke: COSMOS.cyan, glow: 8 }),
      txt('TRAINING REQUEST', -430, -260, 26, COSMOS.cyan, 'mono'),
      txt('x = [3 blocks, 1 s queue]   ·   y = 7 s', -430, -196, 30, COSMOS.ink, 'mono'),
      txt('Start weights:  w = (2, 2)', -430, -138, 30, COSMOS.blue, 'mono'),
      line([-760, -90], [-100, -90], { stroke: '#2c3d66', width: 1.6 }),
      txt(
        gr
          ? `Prediction ŷ = ${CHALLENGE_START.prediction} s   ·   Error = +1`
          : 'Prediction ŷ = ?   ·   Error = ?',
        -430,
        -32,
        30,
        gr ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(gr ? 6 : 8 * inputPulse.value, gr ? COSMOS.emerald : COSMOS.gold),
      txt(
        gr ? 'Gradient ∇L = (6, 2)' : 'Gradient ∇L = (?, ?)',
        -430,
        42,
        38,
        gr ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).glow(gr ? 10 : 0, COSMOS.gold),
      line([-760, 102], [-100, 102], { stroke: '#2c3d66', width: 1.6 }),
      txt('Update at η = 0.05:', -430, 156, 26, COSMOS.muted, 'mono'),
      txt(
        ur ? 'w_new = (1.7, 1.9)' : 'w_new = (?, ?)',
        -430,
        214,
        38,
        ur ? COSMOS.emerald : COSMOS.dim,
        'mono',
      ).glow(ur ? 10 : 0, COSMOS.emerald),
      txt(
        ur
          ? `New prediction = ${CHALLENGE_UPDATED.prediction}.0 s  (loss = 0!)`
          : 'Pause to calculate before the reveal',
        -430,
        274,
        26,
        ur ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),
    ];

    // Right plate: Held-out unseen request
    if (us > 0.05) {
      nodes.push(
        glassPlate(445, -5, 740, 620, { stroke: COSMOS.rose, glow: 9 }).opacity(us),
        txt('HELD-OUT UNSEEN REQUEST', 445, -260, 26, COSMOS.rose, 'mono').opacity(us),
        txt('x = [1 block, 2 s queue]', 445, -182, 34, COSMOS.ink, 'mono').opacity(us),
        txt('Observed target:  y = 4.0 s', 445, -112, 32, COSMOS.emerald, 'mono').opacity(us),
        line([125, -56], [765, -56], { stroke: '#2c3d66', width: 1.6 }).opacity(us),
        txt('Using updated w = (1.7, 1.9):', 445, 10, 28, COSMOS.muted, 'mono').opacity(us),
        txt('1.7(1) + 1.9(2)', 445, 78, 34, COSMOS.cyan, 'mono').opacity(us),
        txt(
          up ? `ŷ = ${CHALLENGE_UNSEEN.prediction.toFixed(1)} s` : 'ŷ = ?',
          445,
          168,
          56,
          COSMOS.rose,
          'mono',
        )
          .glow(up ? 12 : 0, COSMOS.rose)
          .opacity(us),
        txt(
          up ? 'Miss of +1.5 s: fitting 1 row ≠ generalization!' : 'Compute unseen prediction...',
          445,
          258,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(us),
      );
    } else {
      nodes.push(
        glassPlate(445, -5, 740, 620, { stroke: '#2c3d66', glow: 2 }),
        txt('CHECK YOUR ARITHMETIC', 445, -75, 32, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('ŷ = w_p · x_p + w_q · x_q', 445, 10, 32, COSMOS.cyan, 'mono'),
        txt('∇L = 2(ŷ − y) · [x_p, x_q]', 445, 86, 32, COSMOS.rose, 'mono'),
      );
    }

    nodes.push(
      txt(
        'Fitting a training example lowers its loss; generalization needs fresh measurements',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  // Beat 0: strictly withhold prediction & gradient answers!
  pulseCue(s, c, 'challenge-input', inputPulse, 1, { dur: 0.5 });

  // Beat 1: reveal gradient (6, 2) then updated weights (1.7, 1.9)
  cueTo(s, c, 'challenge-gradient', gradReveal, 1, { dur: 0.45 });
  cueTo(s, c, 'challenge-update', updateReveal, 1, { dur: 0.45 });

  // Beat 2: introduce unseen request, reveal 5.5
  cueTo(s, c, 'challenge-heldout', unseenShow, 1, { dur: 0.55 });
  cueTo(s, c, 'challenge-unseen-result', unseenPred, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 28. fresh-nonlinear: Which gradient entries change? (FINALE!)
// Cues: fresh-nonlinear-b1, fresh-switch-request*, fresh-trace-hidden,
//       fresh-trace-activation, fresh-hidden-forward, fresh-nonlinear-b2,
//       fresh-compare-bias*, fresh-compare-weights*, fresh-hidden-gradient,
//       fresh-nonlinear-b3, fresh-hidden-update, fresh-landing*,
//       fresh-hidden-result*, fresh-copied-step*, fresh-copied-loss
// ---------------------------------------------------------------------------
export function freshNonlinear(s, c) {
  const switched = s.value(0); // 0=old x=2, 1=new x=1
  const fwdStage = s.value(4); // resets to 0 on switch, then steps 1 -> 2 -> 4
  const showBiasMatch = s.value(0);
  const showWeightFactors = s.value(0);
  const showFreshGrad = s.value(0);
  const mode = s.value(0); // 0=graph+gradient comparison, 1=rate-0.05 landing comparison, 2=copied vs fresh finale
  const freshStepP = s.value(0);
  const freshLossVis = s.value(0);
  const copiedMoveP = s.value(0);
  const copiedScoreVis = s.value(0);
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 223 }));
  s.add(aura(-360, 0, 500, '#2a588a24', '#151e3d12'));
  s.add(aura(420, 40, 480, '#ffd1661c', '#18142a10'));

  const oldUnit = HIDDEN_STEP_FULL.before; // x=2, y=5
  const freshStep = HIDDEN_FRESH_STEP; // x=1, y=2, rate 0.05
  const freshUnit = freshStep.before;

  // Phase 0 (beats 0-1): Hidden unit graph + old vs new gradient row comparison
  const compareView = guardedDynamic(
    () => fadeOut(Math.min(1, mode.value)),
    (vis) => {
      const isNew = switched.value > 0.3;
      const activeUnit = isNew ? freshUnit : oldUnit;
      const fs = Math.round(fwdStage.value);
      const bOk = showBiasMatch.value > 0.3;
      const wFac = showWeightFactors.value > 0.3;
      const gOk = showFreshGrad.value > 0.3;

      const nodes = [
        txt(
          'FINALE: SWITCH REQUEST, KEEP WEIGHTS FIXED',
          -820,
          -412,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        hiddenUnitFlow(activeUnit, {
          yCenter: -145,
          forwardStage: fs,
          backwardStage: 0,
          showWeights: true,
          drift: drift.value,
        }),
        line([-830, 32], [830, 32], { stroke: '#2c3d66', width: 1.8 }),
      ];

      // Gradient comparison table below
      const cols = [-310, 40, 390, 725];
      const headers = ['w₁', 'b₁', 'w₂', 'b₂'];
      nodes.push(txt('GRADIENT ROW', -820, 88, 26, COSMOS.muted, 'mono', 'left'));
      headers.forEach((h, i) => nodes.push(txt(h, cols[i], 88, 28, COSMOS.muted, 'mono')));

      // Row 0: previous x=2, z=2
      nodes.push(txt('x = 2, z = 2', -820, 168, 28, COSMOS.muted, 'mono', 'left'));
      const oldExprs = ['−2 × 2 = −4', '−2', '−1 × 2 = −2', '−1'];
      oldExprs.forEach((ex, i) => nodes.push(txt(ex, cols[i], 168, 28, COSMOS.muted, 'mono')));

      // Row 1: fresh x=1, z=0.5 (strictly withheld until cues!)
      if (isNew) {
        const zStr = fs >= 2 ? '0.5' : '?';
        nodes.push(txt(`x = 1, z = ${zStr}`, -820, 256, 28, COSMOS.rose, 'mono', 'left'));
        const newExprs = [
          wFac ? `−2 × 1 = ${gOk ? '−2' : '?'}` : '?',
          bOk ? '−2' : '?',
          wFac ? `−1 × 0.5 = ${gOk ? '−0.5' : '?'}` : '?',
          bOk ? '−1' : '?',
        ];
        newExprs.forEach((ex, i) => {
          const isBias = i === 1 || i === 3;
          const col = isBias ? COSMOS.emerald : COSMOS.gold;
          nodes.push(
            txt(ex, cols[i], 256, 30, ex === '?' ? COSMOS.dim : col, 'mono').glow(
              ex !== '?' ? 8 : 0,
              col,
            ),
          );
        });
      }

      nodes.push(
        txt(
          gOk
            ? 'Both biases stay (−2, −1); weight gradients scale with fresh inputs (x=1, z=0.5)'
            : 'Same −0.5 s miss, same open gate: which gradient entries change?',
          0,
          365,
          30,
          gOk ? COSMOS.gold : COSMOS.ink,
          'serif',
        ).glow(gOk ? 8 : 0, COSMOS.gold),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Phase 1 (beat 2): Rate 0.05 landing on input 2 (overshoot) vs input 1 (near-exact 1.9675!)
  const landingView = guardedDynamic(
    () => {
      const m = mode.value;
      if (m <= 0.5) return 0;
      if (m < 1.5) return fadeIn(m);
      return fadeOut(m - 1);
    },
    (vis) => {
      const p = freshStepP.value;
      const curUnit = hiddenUnit(
        freshUnit.weights.map((w, i) => w + p * (freshStep.after.weights[i] - w)),
        1,
        2,
      );
      const showL = freshLossVis.value > 0.3;

      return group(
        txt('SAME RATE (η = 0.05) ON BOTH REQUESTS', -820, -395, 26, COSMOS.cyan, 'mono', 'left'),
        txt(
          'Fresh gradient ∇L = (−2, −2, −0.5, −1)   ·   Hidden activation z → 0.70',
          0,
          -312,
          30,
          COSMOS.gold,
          'mono',
        ),
        trialRuler({
          y: -120,
          label: 'Input 2 (old)',
          target: 5,
          start: 4.5,
          current: HIDDEN_STEP_FULL.after.prediction,
          color: COSMOS.rose,
          showLoss: true,
        }),
        trialRuler({
          y: 120,
          label: 'Input 1 (fresh)',
          target: 2,
          start: 1.5,
          current: curUnit.prediction,
          color: COSMOS.emerald,
          showLoss: showL,
        }),
        txt(
          showL
            ? 'Loss falls from 0.25 to ~0.001! What if we had copied the old gradient instead?'
            : 'Follow the fresh prediction back toward its 2.0 s target...',
          0,
          335,
          30,
          showL ? COSMOS.gold : COSMOS.ink,
          'serif',
        ).glow(showL ? 8 : 0, COSMOS.gold),
      ).opacity(vis);
    },
  );

  // Phase 2 (beat 3): Final side-by-side copied gradient (2.23 s) vs fresh gradient (1.9675 s)
  const finaleView = guardedDynamic(
    () => fadeIn(Math.max(0, mode.value - 1)),
    (vis) => {
      const mp = copiedMoveP.value;
      const sc = copiedScoreVis.value > 0.3;
      const copiedCur = hiddenUnit(
        freshUnit.weights.map((w, i) => w - mp * 0.05 * oldUnit.gradient[i]),
        1,
        2,
      );

      return group(
        txt(
          'WHY BACKPROP RECOMPUTES FROM THIS REQUEST',
          -820,
          -395,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          'One-block request (x = 1, target = 2 s, rate = 0.05)',
          -820,
          -338,
          30,
          COSMOS.ink,
          'sans',
          'left',
        ),
        // Gradient rows recap
        txt('Old grad (x=2, z=2):   (−4, −2, −2, −1)', -820, -242, 28, COSMOS.gold, 'mono', 'left'),
        txt(
          'Fresh grad (x=1, z=0.5):   (−2, −2, −0.5, −1)',
          60,
          -242,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        trialRuler({
          y: -65,
          label: 'Copied grad',
          target: 2,
          start: 1.5,
          current: copiedCur.prediction,
          color: COSMOS.gold,
          showLoss: sc,
        }),
        trialRuler({
          y: 135,
          label: 'Fresh grad',
          target: 2,
          start: 1.5,
          current: freshStep.after.prediction,
          color: COSMOS.cyan,
          showLoss: true,
        }),
        txt(
          sc
            ? `Copied miss: ${fmt(Math.abs(HIDDEN_COPIED_FRESH.prediction - 2), 2)} s   vs   Fresh miss: ${fmt(Math.abs(freshStep.after.prediction - 2), 4)} s`
            : 'Watch where the copied gradient sends the yellow dot...',
          0,
          312,
          34,
          sc ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).glow(8, sc ? COSMOS.emerald : COSMOS.gold),
        txt(
          'Backprop pairs every local derivative with the live forward values of this request',
          0,
          384,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(compareView, landingView, finaleView);
  livingDrift(s, c, drift, 1);

  // Beat 0: switch request (caption_boundary) and trace h -> z -> pred
  pulseCue(s, c, 'fresh-nonlinear-b1', introPulse, 1, { dur: 0.35 });
  cueTo(s, c, 'fresh-switch-request', switched, 1, { dur: 0.35 });
  c.on('fresh-switch-request', () => s.play(fwdStage.to(0, { duration: 0.1 })));
  cueTo(s, c, 'fresh-trace-hidden', fwdStage, 1, { dur: 0.3 });
  cueTo(s, c, 'fresh-trace-activation', fwdStage, 2, { dur: 0.3 });
  cueTo(s, c, 'fresh-hidden-forward', fwdStage, 4, { dur: 0.35 });

  // Beat 1: biases same -> weight factors -> full fresh gradient
  pulseCue(s, c, 'fresh-nonlinear-b2', fwdStage, 4, { dur: 0.25 });
  cueTo(s, c, 'fresh-compare-bias', showBiasMatch, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'fresh-compare-weights', showWeightFactors, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'fresh-hidden-gradient', showFreshGrad, 1, { after: true, dur: 0.35 });

  // Beat 2: rate 0.05 landing comparison
  cueTo(s, c, 'fresh-nonlinear-b3', mode, 1, { dur: 0.45 });
  pulseCue(s, c, 'fresh-hidden-update', introPulse, 0.6, { dur: 0.3 });
  cueTo(s, c, 'fresh-landing', freshStepP, 1, { dur: 0.85 });
  cueTo(s, c, 'fresh-hidden-result', freshLossVis, 1, { after: true, dur: 0.35 });

  // Beat 3: finale copied vs fresh gradient
  c.onBeat(3, () => s.play(mode.to(2, { duration: 0.45 })));
  cueTo(s, c, 'fresh-copied-step', copiedMoveP, 1, { dur: 0.8 });
  cueTo(s, c, 'fresh-copied-loss', copiedScoreVis, 1, { dur: 0.4 });
}
