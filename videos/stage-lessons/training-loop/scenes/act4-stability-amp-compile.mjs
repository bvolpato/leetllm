// Act 4 (Scenes 15-20): Numerical Triage (+Inf Trap & 5-Step Scanner), Global Norm Clipping Geometry,
// Inference-Tensor Boundary & Clone, AMP Policy & FP16 Log-Scale Ribbon, Scale-Then-Unscale Rulers,
// and torch.compile TorchDynamo / Graph-Break Contract.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  AMP_BOUNDS,
  COSMOS,
  ROLE,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  loopAmpOrder,
  loopClip,
  mix,
  rule,
  scaleTrack,
  signed,
  tensorCell,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 15. numerical-triage: Would you take this step?
// Cues: triage-nine*, triage-six*, triage-control, triage-offset,
//       triage-loss*, triage-gradient*, triage-stop,
//       triage-input, triage-logits, triage-objective, triage-gradcheck, triage-params,
//       triage-report, triage-detach
// ---------------------------------------------------------------------------
export function numericalTriage(s, c) {
  const nineP = s.value(0);
  const sixP = s.value(0);
  const ctrlP = s.value(0);
  const offsetP = s.value(0);
  const infLossP = s.value(0);
  const grad6P = s.value(0);
  const stopP = s.value(0);
  const inputP = s.value(0);
  const logitsP = s.value(0);
  const objP = s.value(0);
  const gchkP = s.value(0);
  const paramsP = s.value(0);
  const reportP = s.value(0);
  const detachP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.stale, seed: 15 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(440, 20, 480, '#ff6b8b1e', '#07091000'));

  const headline = heroTitle(['Numerical Triage:', 'Check Loss & Gradients'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.stale,
    eyebrow: 'LOSS = w^2 + c AT w = 3 · STOP AT FIRST NON-FINITE VALUE',
  });

  // View 1 (Beats 0-1): Twin diagnostic lanes for c = 0 vs c = +Inf
  const view1 = guardedDynamic(
    () => fadeOut(inputP.value),
    (vis) => {
      const n9 = nineP.value;
      const s6 = sixP.value;
      const ct = ctrlP.value;
      const of = offsetP.value;
      const il = infLossP.value;
      const g6 = grad6P.value;
      const sp = stopP.value;
      const nodes = [];

      const cols = [-540, 0, 540];
      nodes.push(
        txt('Constant offset c', cols[0], -205, 28, COSMOS.muted, 'mono'),
        txt('Forward loss (w^2 + c)', cols[1], -205, 28, COSMOS.muted, 'mono'),
        txt('Stored grad (2w)', cols[2], -205, 28, COSMOS.muted, 'mono'),
      );

      // Control row: c = 0
      const yCtrl = -85;
      nodes.push(
        tensorCell(cols[0], yCtrl, 280, 82, 'c = 0', COSMOS.ink, { size: 36, glow: 5 }),
        tensorCell(cols[1], yCtrl, 310, 82, n9 > 0.1 ? '9.0' : '?', ROLE.forward, {
          size: 38,
          glow: n9 > 0.1 ? 9 : 2,
        }),
        tensorCell(cols[2], yCtrl, 310, 82, s6 > 0.1 ? '6.0' : '?', ROLE.escalate, {
          size: 38,
          glow: s6 > 0.1 ? 9 : 2,
        }),
        txt(
          ct > 0.1 ? 'isfinite = True' : 'waiting...',
          cols[1],
          yCtrl + 68,
          26,
          ct > 0.1 ? ROLE.escalate : COSMOS.dim,
          'mono',
        ),
        txt(
          ct > 0.1 ? 'isfinite = True' : 'waiting...',
          cols[2],
          yCtrl + 68,
          26,
          ct > 0.1 ? ROLE.escalate : COSMOS.dim,
          'mono',
        ),
      );

      // Trial row: c = +Inf (withheld until triage-loss / triage-gradient!)
      const yTrial = 140;
      const trOp = Math.max(0.42, of);
      nodes.push(
        rule(-835, 32, 835, 32, '#2b3a60', 2),
        tensorCell(cols[0], yTrial, 280, 82, of > 0.1 ? 'c = +Inf' : 'c = ?', ROLE.grad, {
          size: 34,
          glow: of > 0.1 ? 10 : 3,
          opacity: trOp,
        }),
        tensorCell(
          cols[1],
          yTrial,
          310,
          82,
          il > 0.1 ? '+Inf' : '?',
          il > 0.1 ? ROLE.stale : COSMOS.dim,
          { size: 38, glow: il > 0.1 ? 14 : 2, opacity: trOp },
        ),
        tensorCell(
          cols[2],
          yTrial,
          310,
          82,
          g6 > 0.1 ? '6.0 (finite!)' : '?',
          g6 > 0.1 ? ROLE.grad : COSMOS.dim,
          { size: 32, glow: g6 > 0.1 ? 10 : 2, opacity: trOp },
        ),
        txt(
          il > 0.1 ? 'isfinite = FALSE!' : 'check loss',
          cols[1],
          yTrial + 68,
          26,
          il > 0.1 ? ROLE.stale : COSMOS.dim,
          'mono',
        ).opacity(trOp),
        txt(
          g6 > 0.1 ? 'isfinite = True (TRAP!)' : 'check grad',
          cols[2],
          yTrial + 68,
          26,
          g6 > 0.1 ? ROLE.grad : COSMOS.dim,
          'mono',
        ).opacity(trOp),
      );

      const banner =
        sp > 0.1
          ? 'HOLD THE STEP: inspect the +Inf offset before tuning learning rate'
          : il > 0.1
            ? 'Loss is +Inf even though gradient stays finite!'
            : of > 0.1
              ? 'Prediction: if backward still gives 6, would you take the step?'
              : 'Check BOTH forward loss and parameter gradients';
      nodes.push(
        txt(banner, 0, 355, 32, il > 0.1 || sp > 0.1 ? ROLE.stale : ROLE.grad, 'serif').glow(
          sp > 0.1 ? 8 : 0,
          ROLE.stale,
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): 5-Station Finiteness Inspection Scanner
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(inputP.value), fadeOut(reportP.value)),
    (vis) => {
      const stages = [
        { name: '1. Inputs', sub: 'before forward', col: ROLE.standard, active: inputP.value },
        { name: '2. Logits', sub: 'before loss', col: ROLE.forward, active: logitsP.value },
        { name: '3. Loss', sub: 'targets & masks', col: ROLE.grad, active: objP.value },
        { name: '4. Grads', sub: 'after unscale', col: ROLE.warn, active: gchkP.value },
        { name: '5. Weights', sub: 'after step()', col: ROLE.escalate, active: paramsP.value },
      ];
      let activeIdx = 0;
      stages.forEach((st, i) => {
        if (st.active > 0.2) activeIdx = i;
      });
      const xs = [-700, -350, 0, 350, 700];
      const nodes = [
        txt('FIVE-STEP FINITENESS TRIAGE ORDER', -855, -200, 28, ROLE.forward, 'mono', 'left'),
        line([xs[0], 10], [xs[4], 10], { stroke: '#354873', width: 5 }),
      ];

      stages.forEach((st, i) => {
        const isCurrent = i === activeIdx;
        const passed = i <= activeIdx;
        const col = passed ? st.col : COSMOS.dim;
        nodes.push(
          circle(isCurrent ? 34 : 20, { fill: '#0e162a', stroke: col, width: 3.5 })
            .at(xs[i], 10)
            .glow(isCurrent ? 14 : 5, col),
          txt(st.name, xs[i], -78, isCurrent ? 34 : 28, col, 'mono'),
          txt(st.sub, xs[i], 86, 26, isCurrent ? COSMOS.ink : COSMOS.muted, 'sans'),
        );
      });

      nodes.push(
        txt(
          'Stop at the FIRST non-finite tensor and inspect the op that produced it',
          0,
          285,
          32,
          COSMOS.ink,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 3): loss.item() vs loss.detach() logging boundary
  const view3 = guardedDynamic(
    () => fadeIn(reportP.value),
    (vis) => {
      const dt = detachP.value;
      const nodes = [
        txt(
          'LOGGING SCALARS WITHOUT LEAKING AUTOGRAD GRAPHS',
          -855,
          -205,
          28,
          ROLE.forward,
          'mono',
          'left',
        ),
        tensorCell(-615, 30, 250, 110, 'loss', ROLE.grad, { size: 44, glow: 12 }),
        arrow([-460, -10], [-195, -95], { stroke: ROLE.forward, width: 4 }).glow(8, ROLE.forward),
        arrow([-460, 70], [-195, 155], { stroke: ROLE.standard, width: 4 }).glow(8, ROLE.standard),

        tensorCell(
          300,
          -105,
          920,
          110,
          'loss.item()  ->  Python float (CUDA sync risk)',
          ROLE.forward,
          {
            size: 30,
            glow: 10,
          },
        ),
        tensorCell(
          300,
          155,
          920,
          110,
          'loss.detach()  ->  same-device tensor (no graph)',
          ROLE.standard,
          { size: 30, glow: dt > 0.2 ? 12 : 5 },
        ),

        txt(
          'Never store live loss tensors in a list; choose your CUDA sync cadence deliberately',
          0,
          345,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'triage-nine', nineP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'triage-six', sixP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'triage-control', ctrlP, 1, { dur: 0.6 });
  cueTo(s, c, 'triage-offset', offsetP, 1, { dur: 0.65 });
  cueTo(s, c, 'triage-loss', infLossP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'triage-gradient', grad6P, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'triage-stop', stopP, 1, { dur: 0.6 });
  cueTo(s, c, 'triage-input', inputP, 1, { dur: 0.85 });
  cueTo(s, c, 'triage-logits', logitsP, 1, { dur: 0.55 });
  cueTo(s, c, 'triage-objective', objP, 1, { dur: 0.55 });
  cueTo(s, c, 'triage-gradcheck', gchkP, 1, { dur: 0.55 });
  cueTo(s, c, 'triage-params', paramsP, 1, { dur: 0.55 });
  cueTo(s, c, 'triage-report', reportP, 1, { dur: 0.85 });
  cueTo(s, c, 'triage-detach', detachP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 16. global-clipping: One norm rescales every gradient component together
// Cues: global-clipping-beat-0, global-clipping-beat-1, loop-clip-rescale, global-clipping-beat-2
// ---------------------------------------------------------------------------
export function globalClipping(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const rescaleP = s.value(0);
  const b2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.escalate, seed: 16 }));
  s.add(decorAura(-350, 40, 500, '#6ee7b71c', '#07091000'));
  s.add(decorAura(420, 0, 460, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Global Norm Clipping', 'Preserves Direction'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.escalate,
    eyebrow: 'g = (6, 8) · ||g|| = 10 · BOUND = 5 -> SCALE BY 1/2',
  });

  const clipRes = loopClip([6, 8], 5);

  const live = dynamic(() => {
    const b0 = b0P.value;
    const b1 = b1P.value;
    const rs = rescaleP.value;
    const b2 = b2P.value;
    const nodes = [];

    // Left: 2D Vector Geometry Plane
    const ox = -680;
    const oy = 320;
    const px = 62; // 1 unit = 62 px -> (6, 8) = (+372, -496)

    nodes.push(
      line([ox - 30, oy], [ox + 560, oy], { stroke: '#3a4e7c', width: 2.5 }),
      line([ox, oy + 30], [ox, oy - 540], { stroke: '#3a4e7c', width: 2.5 }),
      txt('g_1', ox + 608, oy, 28, COSMOS.muted, 'mono'),
      txt('g_2', ox, oy - 565, 28, COSMOS.muted, 'mono'),
      // Norm bound circle r = 5
      circle(5 * px, { fill: null, stroke: ROLE.escalate, width: 3, dash: [10, 8] })
        .at(ox, oy)
        .opacity(0.72),
      txt('||g|| = 5 bound', ox + 5 * px + 24, oy - 36, 26, ROLE.escalate, 'mono', 'left'),
    );

    // Original gradient vector (6, 8)
    const rawX = ox + 6 * px;
    const rawY = oy - 8 * px;
    nodes.push(
      arrow([ox, oy], [rawX, rawY], { stroke: ROLE.grad, width: 4.5 })
        .glow(8, ROLE.grad)
        .opacity(rs > 0.3 ? 0.45 : 0.95),
      glowDot(rawX, rawY, { radius: 9, color: ROLE.grad, glow: 12 }),
      txt('(6, 8)  ||g|| = 10', rawX + 22, rawY - 12, 28, ROLE.grad, 'mono', 'left'),
    );

    // Animated rescaled vector sliding radially from (6,8) -> (3,4)
    if (rs > 0.03) {
      const gx = mix(6, clipRes.gradient[0], rs);
      const gy = mix(8, clipRes.gradient[1], rs);
      const tx = ox + gx * px;
      const ty = oy - gy * px;
      nodes.push(
        arrow([ox, oy], [tx, ty], { stroke: ROLE.escalate, width: 6 }).glow(12, ROLE.escalate),
        glowDot(tx, ty, { radius: 11, color: ROLE.escalate, glow: 16 }),
      );
      if (rs > 0.72) {
        nodes.push(
          txt('(3, 4)', ox + 20, oy - 210, 28, ROLE.escalate, 'mono', 'left').opacity(
            (rs - 0.72) / 0.28,
          ),
        );
      }
    }

    // Contrast ghost vector: per-coordinate clamping (5, 5) bends direction!
    if (rs > 0.72) {
      const clampX = ox + 5 * px;
      const clampY = oy - 5 * px;
      nodes.push(
        arrow([ox, oy], [clampX, clampY], { stroke: ROLE.stale, width: 3.5, dash: [6, 8] }).opacity(
          0.85,
        ),
        txt('clamp (5, 5): wrong dir', clampX + 22, clampY - 30, 26, ROLE.stale, 'sans', 'left'),
      );
    }

    // Right column: Exact formula + API return contract + nonfinite guard
    const rx = 140;
    nodes.push(
      glowTex(
        String.raw`\mathbf{g}_{\text{clip}} = \mathbf{g} \cdot \frac{\text{max norm}}{\|\mathbf{g}\|_2 + \varepsilon}`,
        {
          x: rx + 340,
          y: -155,
          size: 38,
          color: ROLE.forward,
          glow: 6,
        },
      ).opacity(Math.max(0.6, b0)),

      tensorCell(
        rx + 340,
        -15,
        670,
        74,
        `API returns original norm: ${clipRes.norm.toFixed(1)}`,
        ROLE.grad,
        {
          size: 28,
          glow: b1 > 0.2 ? 9 : 4,
        },
      ),
      tensorCell(
        rx + 340,
        85,
        670,
        74,
        `Stored norm after clip: ${clipRes.storedNorm.toFixed(1)}`,
        ROLE.escalate,
        { size: 28, glow: rs > 0.2 ? 11 : 4 },
      ),
      tensorCell(
        rx + 340,
        195,
        670,
        74,
        'error_if_nonfinite=True catches NaN/Inf',
        b2 > 0.2 ? ROLE.stale : COSMOS.muted,
        { size: 27, glow: b2 > 0.2 ? 10 : 3 },
      ),
      txt(
        'Clipping bounds g, not final Adam/momentum displacement',
        rx + 340,
        300,
        26,
        COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'global-clipping-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'global-clipping-beat-1', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'loop-clip-rescale', rescaleP, 1, { dur: 0.9 });
  cueTo(s, c, 'global-clipping-beat-2', b2P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 17. inference-feature-boundary: An inference tensor may not cross into a trainable head
// Cues: inference-feature-boundary-beat-0, inference-feature-boundary-beat-1,
//       loop-inference-clone, inference-feature-boundary-beat-2
// ---------------------------------------------------------------------------
export function inferenceFeatureBoundary(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const cloneP = s.value(0);
  const b2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 17 }));
  s.add(decorAura(-450, 0, 480, '#60a5fa1a', '#07091000'));
  s.add(decorAura(450, 0, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['The Inference-Tensor', 'Autograd Boundary'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'NO_GRAD() vs INFERENCE_MODE() · CLONE OUTSIDE CONTEXT',
  });

  const live = dynamic(() => {
    const b0 = b0P.value;
    const b1 = b1P.value;
    const cl = cloneP.value;
    const b2 = b2P.value;
    const nodes = [];

    const repaired = cl > 0.4;
    const boundaryCol = repaired ? ROLE.escalate : ROLE.stale;

    // Left: Frozen Router inside inference_mode()
    nodes.push(
      txt('FROZEN EXTRACTOR', -640, -210, 28, ROLE.standard, 'mono'),
      tensorCell(-640, -100, 380, 96, 'with inference_mode():', ROLE.standard, {
        size: 27,
        glow: 7,
      }),
      txt('disables graph + view/version', -640, -12, 26, COSMOS.muted, 'sans'),
      txt('tracking (neither calls eval)', -640, 26, 26, COSMOS.muted, 'sans'),
    );

    // Middle: Inference tensor [-0.27, +0.27] meeting boundary membrane
    nodes.push(
      arrow([-425, -100], [-245, -100], { stroke: ROLE.standard, width: 4 }),
      tensorCell(0, -100, 440, 96, 'logits = [\u22120.27, +0.27]', ROLE.grad, {
        size: 30,
        glow: b1 > 0.2 ? 11 : 6,
      }),
      // Boundary line split cleanly around the center badge at y = 45
      line([275, -220], [275, -18], {
        stroke: boundaryCol,
        width: 4,
        dash: repaired ? undefined : [10, 10],
      }).glow(10, boundaryCol),
      line([275, 108], [275, 195], {
        stroke: boundaryCol,
        width: 4,
        dash: repaired ? undefined : [10, 10],
      }).glow(10, boundaryCol),
    );

    if (repaired) {
      const pulse = 11;
      nodes.push(
        tensorCell(275, 45, 320, 76, 'feats.clone()', ROLE.escalate, { size: 30, glow: pulse }),
        arrow([235, -100], [455, -100], { stroke: ROLE.escalate, width: 4.5 }).glow(
          10,
          ROLE.escalate,
        ),
      );
    } else {
      nodes.push(txt('BLOCKED', 275, 45, 30, ROLE.stale, 'mono').glow(10, ROLE.stale));
    }

    // Right: Trainable Head
    nodes.push(
      txt('TRAINABLE HEAD', 655, -210, 28, boundaryCol, 'mono'),
      tensorCell(
        655,
        -100,
        360,
        96,
        repaired ? 'head.backward() OK' : 'RuntimeError!',
        boundaryCol,
        { size: 28, glow: 10 },
      ),
      txt(repaired ? 'Head grads flow' : 'Cannot save', 655, -2, 26, boundaryCol, 'sans'),
      txt(repaired ? 'router stays frozen' : 'inference tensor', 655, 36, 26, boundaryCol, 'sans'),
    );

    // Bottom guidance strip
    nodes.push(
      rule(-855, 225, 845, 225, '#2b3a60', 2),
      txt(
        b2 > 0.2
          ? 'Use torch.no_grad() for feature extraction into training, or .clone() explicitly'
          : 'no_grad() emits ordinary constants; inference_mode() strips version counters too',
        0,
        295,
        28,
        b2 > 0.2 ? ROLE.forward : COSMOS.ink,
        'serif',
      ).glow(b0 > 0.2 ? 4 : 0, ROLE.forward),
      txt(
        'Benchmark real speedups rather than assuming inference_mode() is always faster',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'inference-feature-boundary-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'inference-feature-boundary-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-inference-clone', cloneP, 1, { dur: 0.85 });
  cueTo(s, c, 'inference-feature-boundary-beat-2', b2P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 18. amp-policy: Which operations change precision?
// Cues: amp-policy-beat-0, amp-policy-beat-1, amp-policy-beat-2
// ---------------------------------------------------------------------------
export function ampPolicy(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.momentum, seed: 18 }));
  s.add(decorAura(-400, 0, 500, '#a78bfa1a', '#07091000'));
  s.add(decorAura(420, 40, 500, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Automatic Mixed Precision', 'Dtype Policy & Range'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'FP32 MASTER WEIGHTS · FP16 / BF16 MATMUL · FP32 LOSS',
  });

  // View 1 (Beat 0): CUDA Autocast Operation Precision Flow
  const view1 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const b0 = b0P.value;
      const nodes = [
        txt('CUDA AUTOCAST FORWARD PASS', -855, -205, 28, ROLE.forward, 'mono', 'left'),
        tensorCell(-635, -40, 410, 110, 'Stored Weights: FP32', ROLE.standard, {
          size: 28,
          glow: b0 > 0.2 ? 10 : 5,
        }),
        arrow([-415, -40], [-285, -40], { stroke: ROLE.forward, width: 4 }),
        tensorCell(0, -40, 540, 110, 'MatMul / Linear: FP16 / BF16', ROLE.momentum, {
          size: 27,
          glow: 10,
        }),
        arrow([285, -40], [415, -40], { stroke: ROLE.grad, width: 4 }),
        tensorCell(640, -40, 410, 110, 'CrossEntropy: FP32', ROLE.grad, { size: 28, glow: 10 }),

        rule(-855, 115, 845, 115, '#2b3a60', 2),
        txt(
          'Exit the autocast context BEFORE calling loss.backward()',
          0,
          205,
          34,
          ROLE.escalate,
          'serif',
        ),
        txt(
          'Explicit dtypes, unlisted ops, and in-place calls follow their own rules',
          0,
          290,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Glowing Log-Scale Dynamic Range Ribbon (FP16 subnormal zone!)
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const rx0 = -760;
      const rx1 = 760;
      const ry = 20;
      const xExp = (exp) => mix(rx0, rx1, (exp + 9) / 5); // -9 .. -4
      const xSub = xExp(Math.log10(AMP_BOUNDS.fp16MinSubnormal)); // ~ -7.22
      const xNorm = xExp(Math.log10(AMP_BOUNDS.fp16MinNormal)); // ~ -4.21
      const xTest = xExp(-5);

      const nodes = [
        txt(
          'FP16 / BF16 ACTIVATION = 2 BYTES (HALF OF FP32)  ·  FP16 SMALL-NUMBER RULER',
          -855,
          -205,
          26,
          ROLE.grad,
          'mono',
          'left',
        ),
        // Subnormal danger ribbon
        glowBar(xSub, ry, xNorm - xSub, 42, ROLE.stale, { glow: 8, opacity: 0.35 }),
        glowBar(xNorm, ry, rx1 - xNorm, 42, ROLE.escalate, { glow: 8, opacity: 0.45 }),
        line([rx0, ry], [rx1, ry], { stroke: '#556ea6', width: 4 }),
      ];

      for (const exp of [-9, -8, -7, -6, -5, -4]) {
        const tx = xExp(exp);
        nodes.push(
          line([tx, ry - 14], [tx, ry + 14], { stroke: COSMOS.muted, width: 2.5 }),
          glowTex(String.raw`10^{${exp}}`, {
            x: tx,
            y: ry + 64,
            size: 32,
            color: COSMOS.muted,
            glow: 0,
          }),
        );
      }

      nodes.push(
        // Subnormal min & normal min markers
        line([xSub, ry - 95], [xSub, ry + 32], { stroke: ROLE.stale, width: 4 }).glow(
          8,
          ROLE.stale,
        ),
        txt('min subnormal ~ 5.96e-8', xSub, ry - 125, 26, ROLE.stale, 'mono'),
        line([xNorm, ry - 95], [xNorm, ry + 32], { stroke: ROLE.grad, width: 4 }).glow(
          8,
          ROLE.grad,
        ),
        txt('min normal ~ 6.10e-5', xNorm - 40, ry - 125, 26, ROLE.grad, 'mono'),

        // 1e-5 test dot inside subnormal zone
        glowDot(xTest, ry, { radius: 14, color: ROLE.escalate, glow: 16 }),
        txt('10^-5 sits in FP16 subnormal range!', xTest, ry + 145, 32, ROLE.escalate, 'mono'),
        txt(
          'Can survive as a subnormal, or flush straight to 0.0 on flush-to-zero paths',
          0,
          295,
          28,
          COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): BF16 Exponent Advantage & CPU AMP-Disabled Branch
  const view3 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const nodes = [
        txt(
          'BF16 EXPONENT RANGE vs CPU PASS-THROUGH',
          -855,
          -205,
          28,
          ROLE.forward,
          'mono',
          'left',
        ),
        tensorCell(
          0,
          -90,
          1560,
          84,
          'BF16: 8 exponent bits (same range as FP32) -> usually needs NO loss scaling',
          ROLE.momentum,
          { size: 28, glow: 10 },
        ),
        txt('CPU BRANCH IN THIS EXAMPLE:', -855, 35, 28, ROLE.forward, 'mono', 'left'),
        tensorCell(-545, 130, 520, 84, 'CPU · AMP disabled', ROLE.standard, { size: 30, glow: 7 }),
        arrow([-260, 130], [-145, 130], { stroke: ROLE.forward, width: 4 }),
        tensorCell(135, 130, 510, 84, 'Unscaled FP32 grads', ROLE.forward, { size: 30, glow: 7 }),
        arrow([415, 130], [520, 130], { stroke: ROLE.escalate, width: 4 }),
        tensorCell(685, 130, 290, 84, 'step()', ROLE.escalate, { size: 32, glow: 10 }),

        txt(
          'Same code runs cleanly on CPU (no-op scaler) and CUDA (autocast + scaler)',
          0,
          315,
          30,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'amp-policy-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'amp-policy-beat-1', b1P, 1, { dur: 0.85 });
  cueTo(s, c, 'amp-policy-beat-2', b2P, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 19. scale-and-step: A norm limit of two, in which units?
// Cues: scale-input, scale-upper, scale-ask, scale-wrong*, scale-divide,
//       scale-correct*, scale-step, scale-growth
// ---------------------------------------------------------------------------
export function scaleAndStep(s, c) {
  const inputP = s.value(0);
  const upperP = s.value(0);
  const askP = s.value(0);
  const wrongP = s.value(0);
  const divideP = s.value(0);
  const correctP = s.value(0);
  const stepP = s.value(0);
  const growthP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 19 }));
  s.add(decorAura(-420, 0, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(440, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Unscale Before Clipping', 'in GradScaler'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'RAW g = [3, 4] (||g|| = 5) · SCALE S = 8 -> [24, 32] (||Sg|| = 40)',
  });

  const amp = loopAmpOrder();

  // View 1 (Beats 0-2): Twin Unscaled-Unit Norm Rulers (0 to 5, target = 2.0)
  const view1 = guardedDynamic(
    () => fadeOut(stepP.value),
    (vis) => {
      const inp = inputP.value;
      const up = upperP.value;
      const ak = askP.value;
      const wr = wrongP.value;
      const dv = divideP.value;
      const cr = correctP.value;
      const nodes = [];

      const rx0 = -390;
      const rx1 = 760;
      const xOf = (normVal) => mix(rx0, rx1, normVal / 5);
      const xTarget = xOf(2.0);

      // Vertical intended bound beacon at norm = 2.0 (split strictly clear of all text rows!)
      nodes.push(
        txt(
          'BOTH RULERS IN UNSCALED OPTIMIZER UNITS (0 -> 5)',
          -855,
          -210,
          26,
          ROLE.forward,
          'mono',
          'left',
        ),
        line([xTarget, -140], [xTarget, -108], {
          stroke: ROLE.escalate,
          width: 3,
          dash: [8, 6],
        }).glow(8, ROLE.escalate),
        line([xTarget, -18], [xTarget, 92], {
          stroke: ROLE.escalate,
          width: 3,
          dash: [10, 8],
        }).glow(8, ROLE.escalate),
        txt('Intended bound = 2.0', xTarget, -168, 28, ROLE.escalate, 'mono'),
      );

      // Upper ruler: WRONG ORDER (clip scaled to 2 -> unscale /8 -> 0.25!)
      const yUp = -35;
      nodes.push(
        txt('WRONG ORDER', -855, yUp - 26, 28, ROLE.stale, 'mono', 'left'),
        txt('clip(2) then /8', -855, yUp + 18, 26, COSMOS.muted, 'mono', 'left'),
        line([rx0, yUp], [rx1, yUp], { stroke: '#354873', width: 4 }),
      );
      if (wr > 0.05) {
        const mx = xOf(amp.wrongNorm);
        nodes.push(
          line([rx0, yUp], [mx, yUp], { stroke: ROLE.stale, width: 9 }).glow(10, ROLE.stale),
          glowDot(mx, yUp, { radius: 13, color: ROLE.stale, glow: 14 }),
          txt('0.25  (8x too small!)', mx + 24, yUp - 44, 28, ROLE.stale, 'mono', 'left').opacity(
            wr,
          ),
        );
      } else {
        nodes.push(
          txt(
            ak > 0.2
              ? 'Unscale 2 / 8 = ?'
              : up > 0.2
                ? 'Clipped to 2 (scaled)'
                : 'Scaled norm = 40',
            xTarget + 36,
            yUp - 44,
            28,
            ROLE.grad,
            'mono',
            'left',
          ).opacity(Math.max(0.55, inp)),
        );
      }

      // Lower ruler: RIGHT ORDER (unscale /8 -> 5.0, then clip -> 2.0!)
      const yLow = 165;
      const curLow = cr > 0.05 ? mix(5.0, amp.correctNorm, cr) : 5.0;
      nodes.push(
        txt('RIGHT ORDER', -855, yLow - 26, 28, ROLE.escalate, 'mono', 'left'),
        txt('unscale /8 then clip(2)', -855, yLow + 18, 26, COSMOS.muted, 'mono', 'left'),
        line([rx0, yLow], [rx1, yLow], { stroke: '#354873', width: 4 }),
      );
      if (dv > 0.05) {
        const mx = xOf(curLow);
        nodes.push(
          line([rx0, yLow], [mx, yLow], {
            stroke: cr > 0.2 ? ROLE.escalate : ROLE.forward,
            width: 9,
          }).glow(10, cr > 0.2 ? ROLE.escalate : ROLE.forward),
          glowDot(mx, yLow, {
            radius: 13,
            color: cr > 0.2 ? ROLE.escalate : ROLE.forward,
            glow: 14,
          }),
        );
        if (cr > 0.72) {
          nodes.push(
            txt(
              '2.00  (exact bound!)',
              xTarget + 32,
              yLow - 46,
              28,
              ROLE.escalate,
              'mono',
              'left',
            ).opacity((cr - 0.72) / 0.28),
          );
        } else if (cr < 0.05) {
          nodes.push(
            txt('unscaled norm = 5.0', xOf(5.0) - 20, yLow - 46, 28, ROLE.forward, 'mono', 'right'),
          );
        }
      }

      for (const t of [0, 1, 2, 3, 4, 5]) {
        const tx = xOf(t);
        nodes.push(
          line([tx, yUp + 8], [tx, yUp + 20], { stroke: COSMOS.dim, width: 2 }),
          line([tx, yLow + 8], [tx, yLow + 20], { stroke: COSMOS.dim, width: 2 }),
          txt(String(t), tx, yLow + 48, 26, COSMOS.muted, 'mono'),
        );
      }

      nodes.push(
        txt(
          cr > 0.2
            ? 'Clipping before unscale_() shrinks your max_norm by 1 / S!'
            : 'Keep the same loss scale S across the entire accumulation window',
          0,
          350,
          30,
          cr > 0.2 ? ROLE.escalate : COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 3): Dynamic GradScaler Update Policy (65,536 -> /2 or *2 after 2,000)
  const view2 = guardedDynamic(
    () => fadeIn(stepP.value),
    (vis) => {
      const gr = growthP.value;
      const nodes = [
        txt('GRADSCALER STEP & DYNAMIC SCALE UPDATE', -855, -205, 28, ROLE.grad, 'mono', 'left'),
        tensorCell(-615, -45, 420, 96, `Init scale S = ${AMP_BOUNDS.initScale}`, ROLE.forward, {
          size: 30,
          glow: 9,
        }),
        arrow([-375, -75], [-195, -110], { stroke: ROLE.stale, width: 4 }),
        arrow([-375, -15], [-195, 55], { stroke: ROLE.escalate, width: 4 }),

        tensorCell(300, -115, 920, 96, 'Non-finite grad -> SKIP step(), S = S / 2', ROLE.stale, {
          size: 30,
          glow: gr > 0.2 ? 12 : 7,
        }),
        tensorCell(
          300,
          65,
          920,
          96,
          `Finite -> step() · ${AMP_BOUNDS.growthInterval} OK in a row -> S = S * 2`,
          ROLE.escalate,
          { size: 30, glow: 9 },
        ),

        rule(-855, 195, 845, 195, '#2b3a60', 2),
        txt(
          'Call scaler.unscale_(opt) once per optimizer -> clip -> scaler.step(opt) -> scaler.update()',
          0,
          280,
          28,
          ROLE.grad,
          'mono',
        ),
        txt(
          'Repeated overflows can even push S below 1; gradients remain until zero_grad()',
          0,
          350,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'scale-input', inputP, 1, { dur: 0.65 });
  cueTo(s, c, 'scale-upper', upperP, 1, { dur: 0.65 });
  cueTo(s, c, 'scale-ask', askP, 1, { dur: 0.55 });
  cueTo(s, c, 'scale-wrong', wrongP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'scale-divide', divideP, 1, { dur: 0.65 });
  cueTo(s, c, 'scale-correct', correctP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'scale-step', stepP, 1, { dur: 0.85 });
  cueTo(s, c, 'scale-growth', growthP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 20. compile-contract: What happens at a graph break?
// Cues: compile-contract-beat-0, compile-contract-beat-1,
//       compile-contract-beat-2, loop-fullgraph-break
// ---------------------------------------------------------------------------
export function compileContract(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const breakP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 20 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 20, 480, '#ffd16618', '#07091000'));

  const headline = heroTitle(['torch.compile Capture', '& Graph Breaks'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'TORCHDYNAMO CAPTURE -> INDUCTOR KERNELS · SHARED WEIGHTS',
  });

  // View 1 (Beat 0): TorchDynamo -> Inductor Pipeline
  const view1 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const b0 = b0P.value;
      const nodes = [
        txt('VERIFY EAGER FIRST, THEN COMPILE', -855, -200, 28, ROLE.forward, 'mono', 'left'),
        tensorCell(-570, -20, 430, 110, 'Eager PyTorch Ops', ROLE.standard, { size: 30, glow: 6 }),
        arrow([-330, -20], [-210, -20], { stroke: ROLE.forward, width: 4.5 }),
        tensorCell(0, -20, 380, 110, 'TorchDynamo', ROLE.forward, {
          size: 32,
          glow: b0 > 0.2 ? 12 : 6,
        }),
        arrow([215, -20], [335, -20], { stroke: ROLE.escalate, width: 4.5 }),
        tensorCell(580, -20, 450, 110, 'TorchInductor', ROLE.escalate, { size: 32, glow: 10 }),

        txt('verified baseline', -570, 82, 26, COSMOS.muted, 'sans'),
        txt('captures tensor graph', 0, 82, 26, ROLE.forward, 'sans'),
        txt('fuses GPU / CPU kernels', 580, 82, 26, ROLE.escalate, 'sans'),

        txt(
          'Benchmark steady-state speed AFTER warmup; dynamic shapes & breaks shrink gains',
          0,
          285,
          30,
          COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Eager vs Captured Wrapper Sharing the Same Weight Tensor
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const nodes = [
        txt(
          'EAGER BACKEND + FULLGRAPH=TRUE: SAME SHARED WEIGHTS',
          -855,
          -200,
          28,
          ROLE.grad,
          'mono',
          'left',
        ),
        tensorCell(-460, -70, 540, 100, 'Original eager module', ROLE.forward, {
          size: 32,
          glow: 9,
        }),
        tensorCell(460, -70, 540, 100, 'Compiled wrapper (eager)', ROLE.escalate, {
          size: 32,
          glow: 9,
        }),

        // Shared parameter node below both
        arrow([-460, -10], [-140, 125], { stroke: ROLE.grad, width: 4 }).glow(8, ROLE.grad),
        arrow([460, -10], [140, 125], { stroke: ROLE.grad, width: 4 }).glow(8, ROLE.grad),
        tensorCell(0, 165, 620, 92, 'Shared Parameter Tensor W', ROLE.grad, { size: 32, glow: 12 }),

        txt(
          'Edit W on the original module -> both eager and compiled outputs change together',
          0,
          325,
          30,
          COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): Partial Capture Graph Break vs fullgraph=True Error
  const view3 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const br = breakP.value;
      const stop = br > 0.45;
      const nodes = [
        txt(
          stop
            ? 'fullgraph=True  ->  RAISES ERROR AT BREAK'
            : 'fullgraph=False  ->  PARTIAL CAPTURE',
          -855,
          -200,
          30,
          stop ? ROLE.stale : ROLE.forward,
          'mono',
          'left',
        ),
        tensorCell(-590, -10, 420, 110, 'Tensor Region A', ROLE.forward, { size: 32, glow: 9 }),
        arrow([-355, -10], [-235, -10], { stroke: ROLE.forward, width: 4.5 }),
        tensorCell(0, -10, 430, 110, 'Python Graph Break', stop ? ROLE.stale : ROLE.grad, {
          size: 30,
          glow: 12,
        }),
      ];

      if (!stop) {
        nodes.push(
          arrow([240, -10], [360, -10], { stroke: ROLE.forward, width: 4.5 }),
          tensorCell(595, -10, 420, 110, 'Tensor Region B', ROLE.forward, { size: 32, glow: 9 }),
        );
      } else {
        nodes.push(
          tensorCell(595, -10, 420, 110, 'Capture Halted!', ROLE.stale, {
            size: 32,
            glow: 12,
            opacity: 0.65,
          }),
        );
      }

      nodes.push(
        txt(
          stop
            ? 'Debug diffs by testing backend="eager" first, then Inductor, with aligned RNG/dtypes'
            : 'Partial capture runs Python, then resumes',
          0,
          255,
          28,
          stop ? ROLE.grad : COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'compile-contract-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'compile-contract-beat-1', b1P, 1, { dur: 0.85 });
  cueTo(s, c, 'compile-contract-beat-2', b2P, 1, { dur: 0.85 });
  cueTo(s, c, 'loop-fullgraph-break', breakP, 1, { dur: 0.7 });
}
