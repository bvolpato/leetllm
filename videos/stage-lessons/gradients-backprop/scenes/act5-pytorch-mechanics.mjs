// Act 5: Debugging Backward Rules via Float64 Gradcheck, PyTorch Training Loop &
// Gradient Accumulation, Saved Sigmoid Output Version Counter, and Expanded Stride-0 Views.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PRECISION_SINGLE,
  SIGMOID_GRAD,
  SIGMOID_TWO,
  aura,
  batchGradientState,
  cinemaGrid,
  compNode,
  cueTo,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  livingDrift,
  photonWire,
  pulseCue,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 20. check-backward-rule: Would you change the backward rule?
// Cues: stored-spacing-slope*, check-both-weights*, restore-square-factor*
// ---------------------------------------------------------------------------
export function checkBackwardRule(s, c) {
  const mode = s.value(0); // 0=float32 stored spacing recovers 4, 1=batch gradcheck missing ×2
  const actualGapP = s.value(0);
  const measuredVis = s.value(0);
  const repairP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.44, seed: 149 }));
  s.add(aura(-320, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(420, 0, 460, '#6ee7b71e', '#12242810'));

  const pr = PRECISION_SINGLE;
  const scale = 1e6;
  const numStr = fmt(pr.lossDifference * scale, 6);
  const gapStr = fmt(pr.storedSpacing * scale, 6);

  // Beat 0: Dividing by the actual stored float32 spacing recovers 4.000!
  const spacingView = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const ap = actualGapP.value;
      const slopeAxisX = (val) => 110 + ((val - 3.7) / 0.4) * 620;
      const curSlope = pr.slope + (pr.slopeAtStoredSpacing - pr.slope) * ap;

      return group(
        txt(
          'FLOAT32 DIAGNOSTIC: STORED VS REQUESTED SPACING',
          -820,
          -372,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        glassPlate(0, -140, 1540, 250, { stroke: COSMOS.cyan, glow: 7 }),
        txt(`L+ − L− ≈ ${numStr} × 10⁻⁶`, -700, -195, 34, COSMOS.ink, 'mono', 'left'),
        txt(
          `Requested gap: 2.000000 × 10⁻⁶   →   slope ≈ 3.815`,
          -700,
          -125,
          30,
          COSMOS.rose,
          'mono',
          'left',
        ),
        txt(
          ap > 0.3
            ? `Actual stored gap: ${gapStr} × 10⁻⁶   →   slope = 4.000!`
            : `Actual stored gap: ${gapStr} × 10⁻⁶   →   slope = ?`,
          -700,
          -55,
          32,
          ap > 0.3 ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'left',
        ).glow(ap > 0.3 ? 10 : 0, COSMOS.emerald),
        // Slope ruler
        txt('Slope estimate', -760, 140, 30, COSMOS.muted, 'sans', 'left'),
        line([slopeAxisX(3.7), 140], [slopeAxisX(4.1), 140], { stroke: '#4d6089', width: 3.4 }),
        line([slopeAxisX(4.0), 114], [slopeAxisX(4.0), 166], {
          stroke: COSMOS.emerald,
          width: 5,
        }).glow(10, COSMOS.emerald),
        txt('exact 4.0', slopeAxisX(4.0), 205, 28, COSMOS.emerald, 'mono'),
        line([slopeAxisX(pr.slope), 118], [slopeAxisX(pr.slope), 162], {
          stroke: COSMOS.rose,
          width: 4,
          dash: [6, 5],
        }),
        txt('3.815', slopeAxisX(pr.slope), 205, 28, COSMOS.rose, 'mono'),
        dot(12, COSMOS.cyan).at(slopeAxisX(curSlope), 140).glow(14, COSMOS.cyan),
        txt(
          'Use float64 for small numerical gradient checks!',
          0,
          355,
          34,
          COSMOS.gold,
          'serif',
        ).glow(8, COSMOS.gold),
      ).opacity(vis);
    },
  );

  // Beats 1-2: Batch float64 check catching the missing factor of 2 on [1.3, 1.1]
  const weights = [1.3, 1.1];
  const exactGrad = batchGradientState(weights).gradient; // [-9.9, -3.925]
  const eps = 1e-5;
  const measured = [0, 1].map((i) => {
    const up = [...weights];
    const dn = [...weights];
    up[i] += eps;
    dn[i] -= eps;
    return (batchGradientState(up).loss - batchGradientState(dn).loss) / (2 * eps);
  });

  const batchView = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const mv = measuredVis.value;
      const rp = repairP.value;
      const xOf = (val) => -460 + ((val + 10.5) / 11.0) * 1240;

      const nodes = [
        txt(
          'FLOAT64 BATCH GRADIENT CHECK  (w = [1.3, 1.1])',
          -820,
          -372,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
      ];

      ['Prompt weight w_p', 'Queue weight w_q'].forEach((label, idx) => {
        const y = -115 + idx * 255;
        const proposed = (exactGrad[idx] * (1 + rp)) / 2;
        const meas = measured[idx];

        nodes.push(
          txt(label, -820, y, 30, COSMOS.ink, 'sans', 'left'),
          line([xOf(-10.5), y], [xOf(0.5), y], { stroke: '#455a8c', width: 3.4 }),
          ...[-10, -8, -6, -4, -2, 0].map((tk) =>
            group(
              line([xOf(tk), y - 8], [xOf(tk), y + 8], { stroke: '#6c80ad', width: 2 }),
              txt(fmt(tk, 0), xOf(tk), y + 40, 26, COSMOS.muted, 'mono'),
            ),
          ),
        );

        // Independent float64 centered check ring
        if (mv > 0.2) {
          nodes.push(
            circle(18, { fill: null, stroke: COSMOS.cyan, width: 4 })
              .at(xOf(meas), y)
              .glow(12, COSMOS.cyan)
              .opacity(mv),
            txt(
              `centered check: ${fmt(meas, 3)}`,
              xOf(meas),
              y + 88,
              28,
              COSMOS.cyan,
              'mono',
            ).opacity(mv),
          );
        }

        // Proposed backward rule dot sliding from half-size -> exact match when ×2 restored!
        const dotCol = rp > 0.85 ? COSMOS.emerald : COSMOS.gold;
        nodes.push(
          dot(11, dotCol).at(xOf(proposed), y).glow(14, dotCol),
          dot(4.5, '#ffffff').at(xOf(proposed), y),
          txt(`backward: ${fmt(proposed, 3)}`, xOf(proposed), y - 46, 30, dotCol, 'mono').glow(
            8,
            dotCol,
          ),
        );
      });

      nodes.push(
        txt(
          rp > 0.5
            ? 'Restored ×2 from d(e²)/de = 2e  →  Both weights match float64 checks!'
            : 'Candidate rule (missing ×2) has right sign, half the true magnitude',
          0,
          365,
          32,
          rp > 0.5 ? COSMOS.emerald : COSMOS.rose,
          'serif',
        ).glow(8, rp > 0.5 ? COSMOS.emerald : COSMOS.rose),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(spacingView, batchView);
  livingDrift(s, c, drift, 1);

  // Beat 0: caption_boundary on stored-spacing-slope
  cueTo(s, c, 'stored-spacing-slope', actualGapP, 1, { dur: 0.7 });

  // Beat 1: switch to batch check, caption_boundary on check-both-weights
  c.onBeat(1, () => s.play(mode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'check-both-weights', measuredVis, 1, { dur: 0.6 });

  // Beat 2: caption_boundary on restore-square-factor -> animate ×2 fix
  cueTo(s, c, 'restore-square-factor', repairP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 21. pytorch-loop: Compute gradients, then move the weights
// Cues: pytorch-stage-0-b1-1, pytorch-stage-1-b1-2, gradient-buffer-b2-1,
//       stored-weights-b2-2, fresh-gradient-b3-1, accumulated-gradient-b3-2
// ---------------------------------------------------------------------------
export function pytorchLoop(s, c) {
  const stepIdx = s.value(0); // 0=zero_grad, 1=forward, 2=backward, 3=step()
  const compareMode = s.value(0); // 0=pipeline+registers, 1=two buffer histories
  const freshVis = s.value(0);
  const accumVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 157 }));
  s.add(aura(-420, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(440, 0, 460, '#ffd1661f', '#18142a10'));

  const stages = [
    { x: -640, name: '1. zero_grad()', sub: 'clear buffer', col: COSMOS.blue },
    { x: -215, name: '2. forward()', sub: 'loss = 1.0', col: COSMOS.cyan },
    { x: 215, name: '3. backward()', sub: 'fill .grad', col: COSMOS.gold },
    { x: 640, name: '4. opt.step()', sub: 'update w', col: COSMOS.emerald },
  ];

  // Beats 0-1: 4-step PyTorch loop + live tensor registers for w and w.grad
  const loopView = guardedDynamic(
    () => fadeOut(compareMode.value),
    (vis) => {
      const si = stepIdx.value;
      const dr = drift.value;
      const gradFilled = si >= 1.8;
      const stepped = si >= 2.8;

      const nodes = [
        txt('PYTORCH AUTOGRAD TRAINING STEP', -820, -395, 26, COSMOS.cyan, 'mono', 'left'),
      ];

      // Connecting glowing wires between pipeline steps
      for (let i = 0; i < 3; i++) {
        const x1 = stages[i].x + 150;
        const x2 = stages[i + 1].x - 150;
        if (si >= i + 0.8) {
          nodes.push(
            photonWire(
              [
                [x1, -210],
                [x2, -210],
              ],
              dr * 2.5 + i * 0.25,
              { color: stages[i + 1].col, width: 3.6 },
            ),
          );
        } else {
          nodes.push(line([x1, -210], [x2, -210], { stroke: '#2c3d66', width: 2.2 }));
        }
      }

      stages.forEach((st, idx) => {
        const active = si >= idx - 0.15;
        const isCurrent = Math.abs(si - idx) < 0.55;
        nodes.push(
          glassPlate(st.x, -210, 290, 125, {
            stroke: active ? st.col : '#2c3d66',
            glow: isCurrent ? 14 : active ? 6 : 0,
          }),
          txt(st.name, st.x, -230, 28, active ? st.col : COSMOS.muted, 'mono'),
          txt(st.sub, st.x, -182, 26, active ? COSMOS.ink : COSMOS.dim, 'sans'),
        );
      });

      // Live memory registers below: Stored Weights vs Gradient Buffer
      nodes.push(
        glassPlate(-420, 130, 680, 320, {
          stroke: stepped ? COSMOS.emerald : COSMOS.blue,
          glow: stepped ? 14 : 6,
        }),
        txt('STORED WEIGHTS  w.data', -420, 24, 28, COSMOS.muted, 'mono'),
        txt(
          stepped ? '[ 1.60,  1.80 ]' : '[ 2.00,  2.00 ]',
          -420,
          122,
          56,
          stepped ? COSMOS.emerald : COSMOS.ink,
          'mono',
        ).glow(stepped ? 12 : 4, stepped ? COSMOS.emerald : COSMOS.blue),
        txt(
          stepped ? 'Moved by opt.step() with η = 0.1' : 'Unchanged until opt.step() runs',
          -420,
          224,
          28,
          stepped ? COSMOS.emerald : COSMOS.muted,
          'sans',
        ),
        glassPlate(420, 130, 680, 320, {
          stroke: gradFilled ? COSMOS.gold : '#394b72',
          glow: gradFilled ? 14 : 4,
        }),
        txt('GRADIENT BUFFER  w.grad', 420, 24, 28, COSMOS.muted, 'mono'),
        txt(
          gradFilled ? '[ 4.00,  2.00 ]' : 'None',
          420,
          122,
          56,
          gradFilled ? COSMOS.gold : COSMOS.dim,
          'mono',
        ).glow(gradFilled ? 12 : 0, COSMOS.gold),
        txt(
          gradFilled ? 'Filled by loss.backward()' : 'Cleared by zero_grad()',
          420,
          224,
          28,
          gradFilled ? COSMOS.gold : COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Two buffer histories (cleared -> [4, 2] vs kept -> [8, 4])
  const accumView = guardedDynamic(
    () => fadeIn(compareMode.value),
    (vis) => {
      const fv = freshVis.value;
      const av = accumVis.value;
      const dr = drift.value;
      return group(
        txt('BACKWARD ACCUMULATES (+=) INTO w.grad', 0, -375, 32, COSMOS.gold, 'mono').glow(
          8,
          COSMOS.gold,
        ),
        txt('Incoming backward gradient = [4, 2]', 0, -305, 32, COSMOS.cyan, 'mono'),
        // Left: cleared buffer
        glassPlate(-440, 45, 700, 480, { stroke: COSMOS.blue, glow: 8 }),
        txt('CLEARED BUFFER', -440, -135, 28, COSMOS.blue, 'mono'),
        txt('Start:  None (0, 0)', -440, -56, 30, COSMOS.muted, 'mono'),
        photonWire(
          [
            [-440, -10],
            [-440, 82],
          ],
          dr * 2.4,
          { color: COSMOS.blue, width: 4 },
        ),
        txt(fv > 0.3 ? '[ 4,  2 ]' : '?', -440, 156, 62, COSMOS.blue, 'mono').glow(
          fv > 0.3 ? 12 : 0,
          COSMOS.blue,
        ),
        txt('Fresh single-step gradient', -440, 236, 28, COSMOS.muted, 'sans'),
        // Right: un-cleared buffer
        glassPlate(440, 45, 700, 480, { stroke: COSMOS.gold, glow: 10 }),
        txt('PREVIOUS BUFFER KEPT', 440, -135, 28, COSMOS.gold, 'mono'),
        txt('Start:  [ 4,  2 ]', 440, -56, 30, COSMOS.gold, 'mono'),
        photonWire(
          [
            [440, -10],
            [440, 82],
          ],
          dr * 2.4 + 0.3,
          { color: COSMOS.gold, width: 4 },
        ),
        txt(av > 0.3 ? '[ 8,  4 ]' : '?', 440, 156, 62, COSMOS.gold, 'mono').glow(
          av > 0.3 ? 12 : 0,
          COSMOS.gold,
        ),
        txt('Accumulated: [4, 2] + [4, 2]', 440, 236, 28, COSMOS.muted, 'sans'),
        txt('Backward adds; clearing chooses the history', 0, 368, 32, COSMOS.ink, 'serif'),
      ).opacity(vis);
    },
  );

  s.add(loopView, accumView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'pytorch-stage-0-b1-1', stepIdx, 0, { dur: 0.3 });
  cueTo(s, c, 'pytorch-stage-1-b1-2', stepIdx, 1, { dur: 0.45 });

  cueTo(s, c, 'gradient-buffer-b2-1', stepIdx, 2, { dur: 0.5 });
  cueTo(s, c, 'stored-weights-b2-2', stepIdx, 3, { dur: 0.55 });

  c.onBeat(2, () => s.play(compareMode.to(1, { duration: 0.5 })));
  cueTo(s, c, 'fresh-gradient-b3-1', freshVis, 1, { dur: 0.45 });
  cueTo(s, c, 'accumulated-gradient-b3-2', accumVis, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 22. saved-output: Keep the forward value that the derivative needs
// Cues: saved-output-b1, saved-output-b2, saved-rejection, saved-output-b3, saved-gradient
// ---------------------------------------------------------------------------
export function savedOutput(s, c) {
  const stateMode = s.value(0); // 0=normal sigmoid(2), 1=in-place overwrite v1, 2=out-of-place fix
  const outcomeVis = s.value(0); // rejection in beat 1, gradient 0.31498 in beat 2
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 163 }));
  s.add(aura(-300, -40, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(400, 60, 460, '#ff6b8b1e', '#18142a10'));

  const sigEq = glowTex(String.raw`\frac{dc}{da} = 3\,b(1 - b)`, {
    x: 420,
    y: -145,
    size: 46,
    color: COSMOS.gold,
    glow: 9,
  });

  const liveScene = dynamic(() => {
    const md = stateMode.value;
    const ov = outcomeVis.value;
    const dr = drift.value;
    const isMutated = md >= 0.5 && md < 1.5;
    const isFixed = md >= 1.5;
    const bVal = isMutated ? SIGMOID_TWO + 1 : SIGMOID_TWO;
    const bCol = isMutated ? COSMOS.rose : isFixed ? COSMOS.emerald : COSMOS.cyan;

    const nodes = [
      txt('SAVED TENSOR VERSION COUNTER', -820, -395, 26, bCol, 'mono', 'left'),
      // Top forward chain
      photonWire(
        [
          [-680, -145],
          [-435, -145],
        ],
        dr * 2.3,
        { color: COSMOS.blue, width: 3.4 },
      ),
      photonWire(
        [
          [-325, -145],
          [-80, -145],
        ],
        dr * 2.3 + 0.3,
        { color: bCol, width: 3.8 },
      ),
      compNode(-740, -145, {
        radius: 52,
        label: 'input a',
        value: '2.0',
        color: COSMOS.blue,
        labelYOffset: -80,
      }),
      compNode(-380, -145, {
        radius: 58,
        label: 'b = σ(a)',
        value: bVal.toFixed(4),
        color: bCol,
        glow: 14,
        labelYOffset: -86,
        valueSize: 28,
      }),
      compNode(-20, -145, {
        radius: 52,
        label: 'c = 3b',
        value: (3 * SIGMOID_TWO).toFixed(3),
        color: COSMOS.gold,
        labelYOffset: -80,
        valueSize: 28,
      }),
      // Version counter panel
      glassPlate(0, 155, 1480, 310, { stroke: bCol, glow: 8 }),
      txt(
        isMutated
          ? 'IN-PLACE WRITE:  b.add_(1)  overwrites the same storage!'
          : isFixed
            ? 'OUT-OF-PLACE FIX:  d = b + 1  allocates a new tensor'
            : 'Autograd saves b = 0.8808 at version 0 for sigmoid backward',
        0,
        58,
        32,
        bCol,
        'mono',
      ).glow(8, bCol),
      txt(
        `Saved by backward: version 0     ·     Current b storage: version ${isMutated ? 1 : 0}`,
        0,
        135,
        30,
        COSMOS.ink,
        'mono',
      ),
    ];

    if (isMutated && ov > 0.2) {
      nodes.push(
        txt(
          'RuntimeError: backward stops because saved b was modified in place!',
          0,
          230,
          30,
          COSMOS.rose,
          'serif',
        )
          .glow(10, COSMOS.rose)
          .opacity(ov),
      );
    } else if (isFixed && ov > 0.2) {
      nodes.push(
        txt(
          `Version matches (0 == 0)  →  dc/da = 3b(1 − b) ≈ ${SIGMOID_GRAD.toFixed(5)}`,
          0,
          230,
          32,
          COSMOS.emerald,
          'mono',
        )
          .glow(10, COSMOS.emerald)
          .opacity(ov),
      );
    } else {
      nodes.push(txt(`Original b ≈ ${SIGMOID_TWO.toFixed(6)}`, 0, 230, 28, COSMOS.muted, 'mono'));
    }

    nodes.push(
      txt(
        isFixed
          ? `New tensor d ≈ ${(SIGMOID_TWO + 1).toFixed(4)}   ·   Original b ≈ ${SIGMOID_TWO.toFixed(4)} intact`
          : 'After a weight update, run a fresh forward pass to save new activations',
        0,
        382,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveScene, sigEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'saved-output-b1', introPulse, 1, { dur: 0.45 });

  cueTo(s, c, 'saved-output-b2', stateMode, 1, { dur: 0.4 });
  cueTo(s, c, 'saved-rejection', outcomeVis, 1, { dur: 0.4 });

  cueTo(s, c, 'saved-output-b3', stateMode, 2, { dur: 0.4 });
  c.on('saved-output-b3', () => s.play(outcomeVis.to(0, { duration: 0.15 })));
  cueTo(s, c, 'saved-gradient', outcomeVis, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 23. expanded-storage: Three visible entries can share one location
// Cues: expanded-storage-b1, expanded-storage-b2, cloned-gradient
// ---------------------------------------------------------------------------
export function expandedStorage(s, c) {
  const clonedP = s.value(0);
  const gradVis = s.value(0);
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 173 }));
  s.add(aura(-460, 0, 440, '#ffd1661e', '#18142a10'));
  s.add(aura(320, 0, 480, '#6ee7b71c', '#12242810'));

  const gradEq = glowTex(String.raw`\frac{d}{dx}\sum_{i=1}^{3} 2x = 2 + 2 + 2 = 6`, {
    x: 615,
    y: 95,
    size: 36,
    color: COSMOS.rose,
    glow: 9,
  });

  const liveScene = dynamic(() => {
    const cl = clonedP.value;
    const gv = gradVis.value;
    const dr = drift.value;

    const srcX = -730;
    const srcY = -10;
    const viewX = -325;
    const cloneX = 140;
    const ys = [-180, -10, 160];

    const nodes = [
      txt(
        'EXPANDED VIEW (STRIDE 0) VS CLONED STORAGE',
        -820,
        -395,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      // Single source memory slot
      glassPlate(srcX, srcY, 200, 140, { stroke: COSMOS.gold, glow: 12 }),
      txt('MEMORY SLOT 0', srcX, srcY - 98, 26, COSMOS.gold, 'mono'),
      txt('2x', srcX, srcY, 48, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
    ];

    const preOp = fadeOut(cl);
    const postOp = fadeIn(cl);

    if (preOp > 0.02) {
      const rx = 400;
      nodes.push(
        group(
          glassPlate(rx, -10, 760, 440, { stroke: COSMOS.rose, glow: 8 }),
          txt('STRIDE-0 MEMORY ALIASING', rx, -172, 28, COSMOS.rose, 'mono').glow(8, COSMOS.rose),
          txt('shape = (3,)     stride = (0,)', rx, -96, 34, COSMOS.gold, 'mono'),
          line([rx - 310, -40], [rx + 310, -40], { stroke: '#2c3d66', width: 1.6 }),
          txt('view[0], view[1], view[2] → slot 0', rx, 22, 30, COSMOS.cyan, 'mono'),
          txt('view.add_(1) would write slot 0 three times', rx, 94, 28, COSMOS.ink, 'sans'),
          txt('RuntimeError: overlapping memory rejected', rx, 162, 28, COSMOS.rose, 'mono'),
        ).opacity(preOp),
      );
    }

    ys.forEach((vy, i) => {
      // Alias pointer wires from 3 visible entries back to 1 slot!
      nodes.push(
        photonWire(
          [
            [srcX + 104, srcY],
            [viewX - 135, vy],
          ],
          dr * 2.2 + i * 0.28,
          { color: cl > 0.4 ? COSMOS.cyan : COSMOS.rose, width: 3.4 },
        ),
        glassPlate(viewX, vy, 260, 96, {
          stroke: COSMOS.cyan,
          glow: 7,
        }),
        txt(`view[${i}] = 2x`, viewX, vy, 27, COSMOS.cyan, 'mono'),
      );

      if (postOp > 0.02) {
        nodes.push(
          arrow([viewX + 136, vy], [cloneX - 148, vy], {
            stroke: COSMOS.emerald,
            width: 3.8,
            tip: 12,
          })
            .glow(8, COSMOS.emerald)
            .opacity(postOp),
          glassPlate(cloneX, vy, 285, 96, { stroke: COSMOS.emerald, glow: 10 }).opacity(postOp),
          txt(`slot ${i + 1} · own`, cloneX, vy, 27, COSMOS.emerald, 'mono').opacity(postOp),
        );
        if (gv > 0.3) {
          nodes.push(
            txt('← +2', (viewX + cloneX) / 2, vy - 38, 26, COSMOS.rose, 'mono')
              .glow(8, COSMOS.rose)
              .opacity(gv * postOp),
          );
        }
      }
    });

    nodes.push(
      txt(
        cl > 0.4
          ? 'clone() allocates 3 writable slots while keeping the differentiable route to x'
          : 'Stride 0: all 3 view indices alias one address  →  in-place add rejected!',
        0,
        355,
        30,
        cl > 0.4 ? COSMOS.emerald : COSMOS.rose,
        'serif',
      ).glow(8, cl > 0.4 ? COSMOS.emerald : COSMOS.rose),
    );

    if (gv > 0.3) {
      nodes.push(txt('k copies → grad = 2k', 615, -75, 32, COSMOS.gold, 'mono').opacity(gv));
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'expanded-storage-b1', introPulse, 1, { dur: 0.45 });
  cueTo(s, c, 'expanded-storage-b2', clonedP, 1, { dur: 0.65 });
  cueTo(s, c, 'cloned-gradient', gradVis, 1, { dur: 0.5 });
  c.show('cloned-gradient', gradEq);
}
