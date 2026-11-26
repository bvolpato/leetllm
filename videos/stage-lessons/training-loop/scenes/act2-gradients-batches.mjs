// Act 2 (Scenes 6-10): None vs Zero Gradient with Momentum, Gradient Accumulation Vessel,
// Unequal Microbatch Denominators, Row-Weighted Epoch Loss, and 120-Step Fit-Batch + 3D Descent.
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  point3d,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  clamp01,
  cueTo,
  decorAura,
  epochMean,
  fadeIn,
  fadeOut,
  fitHistory,
  fitTargets,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  loopMicrobatch,
  loopMomentum,
  mix,
  neonCurve,
  orbitScene,
  rule,
  scaleTrack,
  signed,
  tensorCell,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. none-and-momentum: Will a weight move with a zero gradient?
// Cues: none-and-momentum-beat-0, momentum-first-step, momentum-saved,
//       none-and-momentum-beat-1, none-and-momentum-beat-2,
//       loop-missing-gradient, momentum-decayed, loop-zero-gradient
// ---------------------------------------------------------------------------
export function noneAndMomentum(s, c) {
  const b0P = s.value(0);
  const step1P = s.value(0);
  const savedP = s.value(0);
  const forkP = s.value(0);
  const skipP = s.value(0);
  const noneHoldP = s.value(0);
  const decayP = s.value(0);
  const zeroMoveP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.momentum, seed: 6 }));
  s.add(decorAura(-420, -20, 480, '#a78bfa20', '#07091000'));
  s.add(decorAura(420, 60, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['None vs Zero', 'with SGD Momentum'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.momentum,
    eyebrow: 'BETA = 0.9 · LR = 0.1 · GRADIENT CLEARING KEEPS MOMENTUM',
  });

  const momNone = loopMomentum(1, null); // { weight: 0.9, buffer: 1 }
  const momZero = loopMomentum(1, 0); // { weight: 0.81, buffer: 0.9 }

  const live = dynamic(() => {
    const b0 = b0P.value;
    const s1 = step1P.value;
    const sv = savedP.value;
    const fk = forkP.value;
    const sk = skipP.value;
    const nh = noneHoldP.value;
    const dc = decayP.value;
    const zm = zeroMoveP.value;
    const ph = drift.value;
    const nodes = [];

    // Top shared rail: Step 1 from w = 1.00 to w = 0.90 (grad = 1.0, momentum -> 1.0)
    const rx0 = -760;
    const rx1 = 740;
    const xOfW = (w) => mix(rx0, rx1, (w - 0.75) / 0.3); // 0.75 .. 1.05
    const yTop = -175;

    nodes.push(
      txt(
        'STEP 1:  w = 1.00,  g = 1.0  ->  w = 0.90,  v = 1.0',
        -855,
        -245,
        26,
        ROLE.forward,
        'mono',
        'left',
      ).glow(b0 > 0.2 ? 6 : 0, ROLE.forward),
      line([rx0, yTop], [rx1, yTop], { stroke: '#32456e', width: 4 }),
    );
    for (const tick of [0.8, 0.85, 0.9, 0.95, 1.0]) {
      const tx = xOfW(tick);
      nodes.push(
        line([tx, yTop - 10], [tx, yTop + 10], { stroke: COSMOS.dim, width: 2 }),
        txt(tick.toFixed(2), tx, yTop + 38, 26, COSMOS.muted, 'mono'),
      );
    }
    const wStep1 = mix(1.0, 0.9, s1);
    nodes.push(
      line([xOfW(1.0), yTop], [xOfW(wStep1), yTop], { stroke: ROLE.forward, width: 7 }).glow(
        8,
        ROLE.forward,
      ),
      glowDot(xOfW(wStep1), yTop, { radius: 13, color: ROLE.forward, glow: 14 }),
      txt(`w = ${wStep1.toFixed(2)}`, xOfW(wStep1), yTop - 44, 28, ROLE.forward, 'mono'),
    );
    if (sv > 0.05) {
      const pulse = 8 + 3 * Math.sin(ph * Math.PI * 8);
      nodes.push(
        tensorCell(650, yTop - 52, 290, 56, 'momentum v = 1.00', ROLE.momentum, {
          size: 26,
          glow: pulse,
          opacity: sv,
        }),
      );
    }

    // Two forked lanes below (quiet preview from t=0, ignited on fork)
    const laneOp = Math.max(0.42, fk);
    const yNone = 40;
    const yZero = 240;

    // Lane A: w.grad = None
    nodes.push(
      txt('COPY A:  w.grad = None', -855, yNone - 58, 28, ROLE.forward, 'mono', 'left').opacity(
        laneOp,
      ),
      line([rx0, yNone], [rx1, yNone], { stroke: '#2c3d66', width: 3.5 }).opacity(laneOp),
      glowDot(xOfW(0.9), yNone, {
        radius: 12,
        color: nh > 0.2 ? ROLE.escalate : ROLE.forward,
        glow: 12,
        opacity: laneOp,
      }),
      txt(
        nh > 0.2
          ? `SKIPPED -> stays at ${momNone.weight.toFixed(2)}  (v stays 1.0)`
          : sk > 0.2
            ? 'SGD skips missing gradient'
            : 'Next weight: ?',
        xOfW(0.9) - 40,
        yNone + 48,
        28,
        nh > 0.2 ? ROLE.escalate : COSMOS.muted,
        'mono',
        'right',
      ).opacity(laneOp),
    );

    // Lane B: w.grad = 0.0
    const wZeroCur = mix(0.9, momZero.weight, zm);
    const vZeroCur = mix(1.0, momZero.buffer, dc);
    nodes.push(
      txt(
        'COPY B:  w.grad = 0.0 (tensor)',
        -855,
        yZero - 58,
        28,
        ROLE.stale,
        'mono',
        'left',
      ).opacity(laneOp),
      line([rx0, yZero], [rx1, yZero], { stroke: '#2c3d66', width: 3.5 }).opacity(laneOp),
      line([xOfW(0.9), yZero], [xOfW(wZeroCur), yZero], {
        stroke: ROLE.stale,
        width: 8,
      })
        .glow(10, ROLE.stale)
        .opacity(laneOp),
      glowDot(xOfW(wZeroCur), yZero, {
        radius: 13,
        color: zm > 0.2 ? ROLE.stale : ROLE.momentum,
        glow: 14,
        opacity: laneOp,
      }),
      txt(
        zm > 0.2
          ? `MOVES -> ${wZeroCur.toFixed(2)}   (0.90 \u2212 0.1 * 0.90)`
          : dc > 0.2
            ? `v = 0.9 * 1.0 + 0 = ${vZeroCur.toFixed(2)}`
            : 'Next weight: ?',
        xOfW(wZeroCur) - 20,
        yZero + 48,
        28,
        zm > 0.2 ? ROLE.stale : dc > 0.2 ? ROLE.momentum : COSMOS.muted,
        'mono',
        'left',
      ).opacity(laneOp),
    );

    // Bottom takeaway / prediction line
    const footerTxt =
      zm > 0.2
        ? 'zero_grad(set_to_none=True) clears .grad, leaving optimizer momentum history intact'
        : fk > 0.2
          ? 'Prediction: which weight will move on the next SGD step?'
          : 'BatchNorm can still update running stats during forward() in train mode';
    nodes.push(txt(footerTxt, 0, 390, 30, zm > 0.2 ? ROLE.grad : COSMOS.ink, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'none-and-momentum-beat-0', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'momentum-first-step', step1P, 1, { dur: 0.75 });
  cueTo(s, c, 'momentum-saved', savedP, 1, { dur: 0.65 });
  cueTo(s, c, 'none-and-momentum-beat-1', forkP, 1, { dur: 0.75 });
  cueTo(s, c, 'none-and-momentum-beat-2', skipP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'loop-missing-gradient', noneHoldP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'momentum-decayed', decayP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'loop-zero-gradient', zeroMoveP, 1, { after: true, dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 7. accumulation: What is still in w.grad?
// Cues: buffer-first*, buffer-second*, buffer-clear*, buffer-ask*, buffer-fresh*
// ---------------------------------------------------------------------------
export function accumulation(s, c) {
  const firstP = s.value(0);
  const secondP = s.value(0);
  const clearP = s.value(0);
  const askP = s.value(0);
  const freshP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 7 }));
  s.add(decorAura(-440, 20, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(430, 20, 480, '#ffd1661c', '#07091000'));

  const headline = heroTitle(['Backward Adds Into', 'the Gradient Buffer'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'L(w) = w^2 AT w = 1 · SLOPE IS ALWAYS 2',
  });

  // Precompute parabola L(w) = w^2 on left canvas
  const pOriginX = -515;
  const pOriginY = 235;
  const xScale = 145;
  const yScale = 95;
  const parabolaPts = [];
  for (let i = -20; i <= 20; i++) {
    const w = i * 0.1;
    parabolaPts.push([pOriginX + w * xScale, pOriginY - w * w * yScale]);
  }
  const tanPts = [
    [pOriginX + 0.55 * xScale, pOriginY - (1 + 2 * -0.45) * yScale],
    [pOriginX + 1.85 * xScale, pOriginY - (1 + 2 * 0.85) * yScale],
  ];

  const live = dynamic(() => {
    const f1 = firstP.value;
    const f2 = secondP.value;
    const cl = clearP.value;
    const ak = askP.value;
    const fr = freshP.value;
    const ph = drift.value;
    const nodes = [];

    // Left: Parabola w^2 with fixed w = 1 and slope = 2 tangent
    nodes.push(
      line([pOriginX - 310, pOriginY], [pOriginX + 310, pOriginY], {
        stroke: '#3a4e7c',
        width: 2.5,
      }),
      line([pOriginX, pOriginY + 60], [pOriginX, pOriginY - 410], {
        stroke: '#3a4e7c',
        width: 2.5,
      }),
      neonCurve(parabolaPts, [ROLE.standard, ROLE.forward], { width: 4.5, glow: 10 }),
      line(tanPts[0], tanPts[1], { stroke: ROLE.grad, width: 3.5, dash: [8, 8] }).glow(
        8,
        ROLE.grad,
      ),
      glowDot(pOriginX + xScale, pOriginY - yScale, { radius: 11, color: ROLE.grad, glow: 14 }),
      txt('w = 1  (fixed)', pOriginX + xScale + 12, pOriginY + 48, 28, COSMOS.ink, 'mono', 'left'),
      txt('slope = 2w = 2', pOriginX - 305, pOriginY + 48, 28, ROLE.grad, 'mono', 'left'),
      glowTex(String.raw`L(w) = w^2 \implies \frac{dL}{dw}\Big|_{w=1} = 2`, {
        x: pOriginX,
        y: 355,
        size: 36,
        color: ROLE.forward,
        glow: 5,
      }),
    );

    // Right: Glowing Gradient Accumulator Vessel (height encodes 0 .. 4)
    const vx = 420;
    const vBottom = 260;
    const vW = 280;
    const unitH = 105; // 4 units = 420px
    const vTop = vBottom - 4 * unitH;

    // Compute vessel level strictly from cues
    const level = fr > 0.01 ? 2 * fr : cl > 0.01 ? Math.max(0, 4 * (1 - cl)) : 2 * f1 + 2 * f2;

    nodes.push(
      txt('w.grad BUFFER', vx, vTop - 52, 30, ROLE.grad, 'mono'),
      // Vessel outer glass
      rect(vW, 4 * unitH, { fill: '#0c1324', stroke: '#445a8c', width: 3, radius: 14 }).at(
        vx,
        (vTop + vBottom) / 2,
      ),
    );

    for (let u = 0; u <= 4; u++) {
      const ty = vBottom - u * unitH;
      nodes.push(
        line([vx - vW / 2 - 18, ty], [vx - vW / 2, ty], { stroke: COSMOS.dim, width: 2 }),
        txt(String(u), vx - vW / 2 - 42, ty, 28, COSMOS.muted, 'mono'),
      );
    }

    if (level > 0.05) {
      const h1 = Math.min(2, level) * unitH;
      nodes.push(
        rect(vW - 18, Math.max(8, h1 - 6), { fill: ROLE.grad, stroke: null, radius: 10 })
          .at(vx, vBottom - h1 / 2)
          .glow(10, ROLE.grad)
          .opacity(0.88),
      );
      if (h1 >= 76) {
        nodes.push(txt('+2', vx, vBottom - h1 / 2, 36, '#070910', 'mono'));
      }
    }
    if (level > 2.05) {
      const h2 = (level - 2) * unitH;
      nodes.push(
        rect(vW - 18, Math.max(8, h2 - 6), { fill: ROLE.stale, stroke: null, radius: 10 })
          .at(vx, vBottom - 2 * unitH - h2 / 2)
          .glow(12, ROLE.stale)
          .opacity(0.92),
      );
      if (h2 >= 76) {
        nodes.push(txt('+2 (stale!)', vx, vBottom - 2 * unitH - h2 / 2, 32, '#070910', 'mono'));
      }
    }

    // Center connector + readout
    const pulseX = mix(-140, 220, (ph * 4) % 1);
    nodes.push(
      arrow([-155, 25], [220, 25], { stroke: ROLE.grad, width: 3.5 }).glow(6, ROLE.grad),
      glowDot(pulseX, 25, { radius: 6, color: ROLE.grad, glow: 10 }),
      txt('backward()', 32, -18, 28, ROLE.grad, 'mono'),
    );

    const readoutText =
      fr > 0.2
        ? 'w.grad = 2.0  (fresh update only!)'
        : ak > 0.2
          ? 'Run backward() once more: w.grad = ?'
          : cl > 0.2
            ? 'w.grad = None  (cleared!)'
            : f2 > 0.2
              ? 'w.grad = 4.0  (2 + 2 accumulated!)'
              : f1 > 0.2
                ? 'w.grad = 2.0  (1st backward)'
                : 'w.grad = None  (empty)';
    const readoutColor =
      fr > 0.2
        ? ROLE.escalate
        : ak > 0.2
          ? ROLE.grad
          : cl > 0.2
            ? ROLE.momentum
            : f2 > 0.2
              ? ROLE.stale
              : ROLE.forward;

    nodes.push(txt(readoutText, vx, 355, 32, readoutColor, 'mono').glow(6, readoutColor));

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'buffer-first', firstP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'buffer-second', secondP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'buffer-clear', clearP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'buffer-ask', askP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'buffer-fresh', freshP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 8. microbatch-denominators: How much weight does ticket C get?
// Cues: micro-first-chunks, micro-question, micro-equal*, micro-chunk-result*,
//       micro-count, micro-row-result*, micro-loss, micro-window, micro-scale
// ---------------------------------------------------------------------------
export function microbatchDenominators(s, c) {
  const chunksP = s.value(0);
  const askP = s.value(0);
  const equalP = s.value(0);
  const chunkResP = s.value(0);
  const countP = s.value(0);
  const rowResP = s.value(0);
  const lossP = s.value(0);
  const windowP = s.value(0);
  const scaleP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 8 }));
  s.add(decorAura(-350, 0, 500, '#5ce1e61c', '#07091000'));
  s.add(decorAura(450, 40, 480, '#ff6b8b1a', '#07091000'));

  const headline = heroTitle(['Weight Unequal', 'Microbatches by Rows'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'CHUNK 1: [A, B] (GRAD 0.5) · CHUNK 2: [C] (GRAD 1.0)',
  });

  const eqRes = loopMicrobatch(true);
  const rowRes = loopMicrobatch(false);

  // View 1 (Beats 0-2): Proportional Share Strip + Urgency Gradient Readout
  const view1 = guardedDynamic(
    () => fadeOut(windowP.value),
    (vis) => {
      const ch = chunksP.value;
      const ak = askP.value;
      const eq = equalP.value;
      const cr = chunkResP.value;
      const cn = countP.value;
      const rr = rowResP.value;
      const ls = lossP.value;
      const nodes = [];

      const stripX = -810;
      const stripW = 1620;
      const stripY = -75;
      const stripH = 104;

      // Interpolate Chunk 1 share: starts neutral 0.5 (preview), equal chunks = 0.5, row-weighted = 2/3
      const chunk1Share = mix(0.5, 2 / 3, cn);
      const cShare = 1 - chunk1Share;
      const wA = (chunk1Share / 2) * stripW;
      const wB = (chunk1Share / 2) * stripW;
      const wC = cShare * stripW;

      nodes.push(
        txt(
          cn > 0.3
            ? 'ROW-WEIGHTED CHUNKS:  2/3 FOR [A, B]  ·  1/3 FOR [C]'
            : eq > 0.3
              ? 'EQUAL CHUNK MEANS:  1/2 FOR [A, B]  ·  1/2 FOR [C]'
              : 'THREE TICKETS SPLIT INTO TWO UNEQUAL CHUNKS:  [A, B] + [C]',
          stripX,
          -195,
          28,
          cn > 0.3 ? ROLE.escalate : eq > 0.3 ? ROLE.stale : ROLE.forward,
          'mono',
          'left',
        ),
        scaleTrack(stripX, stripY, stripW, stripH, {
          stroke: '#344772',
          fill: '#0d1427',
          radius: 14,
        }),
        glowBar(stripX + 4, stripY, wA - 8, stripH - 12, ROLE.standard, { glow: 7 }),
        glowBar(stripX + wA + 4, stripY, wB - 8, stripH - 12, ROLE.forward, { glow: 7 }),
        glowBar(
          stripX + wA + wB + 4,
          stripY,
          wC - 8,
          stripH - 12,
          cn > 0.3 ? ROLE.escalate : ROLE.stale,
          {
            glow: 11,
          },
        ),
        txt(
          cn > 0.3 ? 'A (1/3)' : eq > 0.3 ? 'A (1/4)' : 'A (g = 0.5)',
          stripX + wA / 2,
          stripY,
          30,
          '#070910',
          'mono',
        ),
        txt(
          cn > 0.3 ? 'B (1/3)' : eq > 0.3 ? 'B (1/4)' : 'B (g = 0.5)',
          stripX + wA + wB / 2,
          stripY,
          30,
          '#070910',
          'mono',
        ),
        txt(
          cn > 0.3 ? 'C (1/3)' : eq > 0.3 ? 'C (1/2!)' : 'C (g = 1.0 · ?)',
          stripX + wA + wB + wC / 2,
          stripY,
          30,
          '#070910',
          'mono',
        ),
      );

      // Comparison rows below
      const yRow1 = 110;
      const yRow2 = 215;

      nodes.push(
        txt('Equal chunk means:', stripX, yRow1, 30, ROLE.stale, 'sans', 'left'),
        txt(
          cr > 0.1
            ? `0.5 * 0.5 + 0.5 * 1.0 = ${eqRes.gradient[0].toFixed(2)}  (3/4  overweights C!)`
            : ak > 0.1
              ? 'What fraction multiplies C?'
              : 'Weighting chunks 1/2 each...',
          stripX + 360,
          yRow1,
          30,
          cr > 0.1 ? ROLE.stale : ROLE.grad,
          'mono',
          'left',
        ),

        txt('Row-weighted chunks:', stripX, yRow2, 30, ROLE.escalate, 'sans', 'left'),
        txt(
          rr > 0.1
            ? `(2/3) * 0.5 + (1/3) * 1.0 = ${rowRes.gradient[0].toFixed(3)}  (2/3  exact full-batch mean)`
            : 'Exact row mean: ?',
          stripX + 360,
          yRow2,
          30,
          rr > 0.1 ? ROLE.escalate : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      if (ls > 0.05) {
        nodes.push(
          txt(
            'Multiply each chunk mean loss BEFORE backward():  (n_k / N * loss_k).backward()',
            0,
            345,
            30,
            ROLE.forward,
            'mono',
          ).opacity(ls),
        );
      } else if (ch > 0.1) {
        nodes.push(
          txt('Severity gradient stays 0.50 in both runs', 0, 345, 28, COSMOS.muted, 'sans'),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 3): DDP no_sync() + Single GradScaler Accumulation Window
  const view2 = guardedDynamic(
    () => fadeIn(windowP.value),
    (vis) => {
      const sc = scaleP.value;
      const nodes = [
        txt(
          'ACCUMULATION WINDOW: DDP no_sync() + ONE LOSS SCALE',
          -855,
          -210,
          28,
          ROLE.escalate,
          'mono',
          'left',
        ),
      ];
      const steps = [
        { x: -670, title: 'Chunk 1', sub: 'no_sync()', col: ROLE.forward },
        { x: -310, title: 'Chunk 2', sub: 'no_sync()', col: ROLE.forward },
        { x: 50, title: 'Final Chunk', sub: 'sync grads!', col: ROLE.escalate },
        { x: 430, title: 'Unscale + Clip', sub: 'once / window', col: ROLE.grad },
        { x: 750, title: 'Step', sub: 'update scale', col: ROLE.momentum },
      ];
      steps.forEach((st, i) => {
        const hi = i === 2 || (sc > 0.3 && i >= 3);
        nodes.push(
          tensorCell(st.x, -45, 275, 92, st.title, st.col, { size: 28, glow: hi ? 12 : 5 }),
          txt(st.sub, st.x, 45, 26, st.col, 'mono'),
        );
        if (i < steps.length - 1) {
          nodes.push(
            arrow([st.x + 148, -45], [steps[i + 1].x - 148, -45], {
              stroke: COSMOS.muted,
              width: 3.5,
            }),
          );
        }
      });

      nodes.push(
        rule(-855, 130, 845, 130, '#2b3a60', 2),
        txt(
          'Keep weights fixed across chunks; keep one loss scale for the entire window',
          0,
          205,
          30,
          COSMOS.ink,
          'serif',
        ),
        txt(
          'BatchNorm stats & Dropout masks still differ across smaller chunks',
          0,
          285,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'micro-first-chunks', chunksP, 1, { dur: 0.65 });
  cueTo(s, c, 'micro-question', askP, 1, { dur: 0.55 });
  cueTo(s, c, 'micro-equal', equalP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'micro-chunk-result', chunkResP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'micro-count', countP, 1, { dur: 0.85 });
  cueTo(s, c, 'micro-row-result', rowResP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'micro-loss', lossP, 1, { dur: 0.65 });
  cueTo(s, c, 'micro-window', windowP, 1, { dur: 0.85 });
  cueTo(s, c, 'micro-scale', scaleP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 9. batching: Weight an epoch loss by its rows
// Cues: batching-beat-1-focus-1, batching-beat-1-focus-2,
//       batching-beat-2-focus-1, batching-beat-2-focus-2
// ---------------------------------------------------------------------------
export function batching(s, c) {
  const b1P = s.value(0);
  const b2P = s.value(0);
  const rowMeanP = s.value(0);
  const eqMeanP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 9 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Weight Epoch Loss', 'by Total Rows'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.escalate,
    eyebrow: '4 ROWS AT 0.20  +  2 ROWS AT 0.50  =  6 ROWS TOTAL',
  });

  const trueMean = epochMean([0.2, 0.5], [4, 2]);
  const wrongMean = (0.2 + 0.5) / 2;

  const live = dynamic(() => {
    const p1 = b1P.value;
    const p2 = b2P.value;
    const rm = rowMeanP.value;
    const em = eqMeanP.value;
    const ph = drift.value;
    const nodes = [];

    // Top: Area-proportional row blocks (width = row count, height = batch mean loss)
    const x0 = -760;
    const baseY = 60;
    const colW = 190; // 6 cols = 1140px
    const hScale = 440; // loss 0.50 -> 220px

    nodes.push(
      line([x0 - 20, baseY], [x0 + 6 * colW + 40, baseY], { stroke: '#3c507e', width: 3 }),
      txt('BATCH A (4 rows · mean 0.20)', x0 + 2 * colW, -205, 28, ROLE.forward, 'mono'),
      txt('BATCH B (2 rows · mean 0.50)', x0 + 5 * colW, -205, 28, ROLE.grad, 'mono'),
    );

    for (let i = 0; i < 6; i++) {
      const isA = i < 4;
      const loss = isA ? 0.2 : 0.5;
      const h = loss * hScale;
      const cx = x0 + (i + 0.5) * colW;
      const col = isA ? ROLE.forward : ROLE.grad;
      const glowAmt = (isA ? p1 : p2) > 0.2 ? 9 + 2 * Math.sin(ph * Math.PI * 8 + i) : 4;
      nodes.push(
        rect(colW - 22, h, { fill: '#101d34', stroke: col, width: 2.5, radius: 10 })
          .at(cx, baseY - h / 2)
          .glow(glowAmt, col),
        txt(loss.toFixed(2), cx, baseY - h / 2, 28, col, 'mono'),
        txt(`row ${i + 1}`, cx, baseY + 34, 26, COSMOS.muted, 'mono'),
      );
    }

    // Horizontal dashed lines for true row mean (0.30) and naive equal-batch mean (0.35)
    if (rm > 0.05) {
      const yTrue = baseY - trueMean * hScale;
      nodes.push(
        line([x0 - 20, yTrue], [x0 + 6 * colW + 40, yTrue], {
          stroke: ROLE.escalate,
          width: 4,
          dash: [12, 8],
        })
          .glow(10, ROLE.escalate)
          .opacity(rm),
        txt('0.30', x0 + 6 * colW + 95, yTrue, 30, ROLE.escalate, 'mono').opacity(rm),
      );
    }
    if (em > 0.05) {
      const yWrong = baseY - wrongMean * hScale;
      nodes.push(
        line([x0 - 20, yWrong], [x0 + 6 * colW + 40, yWrong], {
          stroke: ROLE.stale,
          width: 3.5,
          dash: [6, 10],
        })
          .glow(8, ROLE.stale)
          .opacity(em),
        txt('0.35', x0 + 6 * colW + 95, yWrong - 26, 28, ROLE.stale, 'mono').opacity(em),
      );
    }

    // Bottom comparison readouts
    const yEq1 = 215;
    const yEq2 = 340;
    nodes.push(
      txt('ROW-WEIGHTED EPOCH MEAN', -855, yEq1, 28, ROLE.escalate, 'mono', 'left'),
      glowTex(String.raw`\frac{4(0.20) + 2(0.50)}{6} = \frac{1.80}{6} = 0.30`, {
        x: 110,
        y: yEq1,
        size: 40,
        color: ROLE.escalate,
        glow: 6,
      }).opacity(Math.max(0.35, rm)),

      txt('EQUAL-BATCH MEAN (BIASED)', -855, yEq2, 28, ROLE.stale, 'mono', 'left'),
      glowTex(String.raw`\frac{0.20 + 0.50}{2} = 0.35`, {
        x: 110,
        y: yEq2,
        size: 40,
        color: ROLE.stale,
        glow: 6,
      }).opacity(Math.max(0.25, em)),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'batching-beat-1-focus-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'batching-beat-1-focus-2', b2P, 1, { dur: 0.7 });
  cueTo(s, c, 'batching-beat-2-focus-1', rowMeanP, 1, { dur: 0.75 });
  cueTo(s, c, 'batching-beat-2-focus-2', eqMeanP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 10. fit-batch: Memorize a clean batch to test the wiring (120 real updates + 3D landscape!)
// Cues: fit-batch-beat-1-focus-2, fit-batch-beat-1-focus-1,
//       fit-batch-beat-2-focus-1, fit-batch-beat-2-focus-2
// ---------------------------------------------------------------------------
export function fitBatch(s, c) {
  const initP = s.value(0);
  const trainP = s.value(0);
  const rightP = s.value(0);
  const freezeP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.escalate, seed: 10 }));
  s.add(decorAura(-420, -20, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(500, 40, 480, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Overfit One Clean Batch', 'to Verify Wiring'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.escalate,
    eyebrow: 'SEEDED 2-LAYER CLASSIFIER · 8 TICKETS · 120 SGD UPDATES',
  });

  // Right: Orbiting 3D Loss Landscape tracing the 120 real measured SGD updates
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.05,
    distance: 15.8,
    unit: 90,
    focus: [0, 0, 0.8],
  }).at(515, 20);

  const floor = gridPlane3d({
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    z: 0,
    step: 0.8,
    color: '#24345a',
    opacity: 0.45,
  });

  const bowlZ = (x, y) => 0.25 + 0.34 * ((x - 1.1) ** 2 + (y - 0.9) ** 2) * 0.45;
  const basinSurf = surface(bowlZ, {
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    resolution: [18, 18],
    colors: [ROLE.escalate, ROLE.forward, ROLE.momentum, ROLE.stale],
    mesh: '#6d88c4',
    opacity: 0.72,
  });

  const trajPt = (u) => {
    const idx = Math.min(120, Math.max(0, Math.round(u * 120)));
    const snap = fitHistory[idx];
    const r = snap.loss / fitHistory[0].loss;
    const ang = u * 1.9;
    const x = 1.1 - 2.2 * Math.sqrt(r) * Math.cos(ang * 0.4);
    const y = 0.9 - 2.0 * Math.sqrt(r) * Math.sin(ang * 0.4 + 0.35);
    return [x, y, bowlZ(x, y) + 0.08 + r * 0.7];
  };

  const trajCurve = curve3d(trajPt, 0, 1, {
    samples: 48,
    color: ROLE.grad,
    width: 4.2,
    glow: 10,
    blend: 'screen',
  });

  const liveBead = point3d(() => trajPt(trainP.value), {
    color: ROLE.escalate,
    radius: 8.5,
    glow: 16,
    blend: 'screen',
  });

  view3d.add(floor, basinSurf, trajCurve, liveBead);

  const leftDash = dynamic(() => {
    const init = initP.value;
    const tr = trainP.value;
    const rt = rightP.value;
    const fr = freezeP.value;
    const ph = drift.value;
    const nodes = [];

    const stepIdx = Math.round(tr * 120);
    const cur = fitHistory[stepIdx];

    // Live curve panel on left
    const gx0 = -830;
    const gx1 = 60;
    const gy0 = -170;
    const gy1 = 100;
    const xOfStep = (k) => mix(gx0, gx1, k / 120);
    const yOfLoss = (l) => mix(gy1, gy0, clamp01(l / 0.7));

    nodes.push(
      txt('MEASURED CROSS-ENTROPY LOSS', gx0, gy0 - 48, 26, ROLE.forward, 'mono', 'left'),
      line([gx0, gy1], [gx1, gy1], { stroke: '#3a4e7c', width: 2.5 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#3a4e7c', width: 2.5 }),
      txt('0', gx0, gy1 + 36, 26, COSMOS.muted, 'mono'),
      txt('60', xOfStep(60), gy1 + 36, 26, COSMOS.muted, 'mono'),
      txt('120 updates', xOfStep(120) - 40, gy1 + 36, 26, COSMOS.muted, 'mono'),
    );

    // Draw curve up to stepIdx (always at least 2 points for preview)
    const maxK = Math.max(1, stepIdx);
    const curvePts = [];
    for (let k = 0; k <= maxK; k += 2) {
      curvePts.push([xOfStep(k), yOfLoss(fitHistory[k].loss)]);
    }
    if (curvePts.at(-1)[0] !== xOfStep(maxK)) {
      curvePts.push([xOfStep(maxK), yOfLoss(fitHistory[maxK].loss)]);
    }
    nodes.push(
      neonCurve(curvePts, [ROLE.stale, ROLE.grad, ROLE.escalate], { width: 4.5, glow: 10 }),
      glowDot(xOfStep(stepIdx), yOfLoss(cur.loss), {
        radius: 9,
        color: ROLE.escalate,
        glow: 14,
      }),
    );

    // Live synchronized metrics from the exact same model state
    nodes.push(
      txt(`Update: ${cur.updates} / 120`, gx0 + 360, gy0 - 15, 28, COSMOS.ink, 'mono', 'left'),
      txt(
        `Loss: ${cur.loss.toFixed(4)}`,
        gx0 + 360,
        gy0 + 32,
        32,
        cur.loss < 0.05 ? ROLE.escalate : ROLE.grad,
        'mono',
        'left',
      ).glow(6, cur.loss < 0.05 ? ROLE.escalate : ROLE.grad),
      txt(
        `||W||: ${cur.weightNorm.toFixed(2)}   ·   ${cur.correct}/8 right`,
        gx0 + 360,
        gy0 + 82,
        28,
        ROLE.forward,
        'mono',
        'left',
      ).opacity(Math.max(0.7, init)),
    );

    // 8 Ticket prediction orbs driven by cur.predictions
    nodes.push(
      txt('8 TICKET ROUTES (SAME MODEL STATE)', gx0, 185, 26, COSMOS.muted, 'mono', 'left'),
    );
    cur.predictions.forEach((pred, i) => {
      const cx = gx0 + 50 + i * 116;
      const cy = 266;
      const ok = pred.correct;
      const col = ok ? ROLE.escalate : ROLE.stale;
      const pulse = ok && rt > 0.2 ? 1 + 0.05 * Math.sin(ph * Math.PI * 8 + i) : 1;
      nodes.push(
        circle(44 * pulse, { fill: '#10182d', stroke: col, width: 3 })
          .at(cx, cy)
          .glow(ok ? 9 : 5, col),
        txt(`T${i + 1}`, cx, cy - 15, 26, COSMOS.ink, 'mono'),
        txt(fitTargets[i] === 1 ? 'E' : 'S', cx, cy + 14, 26, col, 'mono'),
      );
    });

    nodes.push(
      txt(
        fr > 0.2
          ? 'Next: freeze these weights and evaluate on unseen tickets'
          : 'Shapes, labels, loss, and update order all pass wiring check',
        gx0,
        365,
        28,
        fr > 0.2 ? ROLE.grad : COSMOS.muted,
        'serif',
        'left',
      ),
      txt('3D DESCENT TRAJECTORY (120 STEPS)', 515, 365, 26, COSMOS.muted, 'mono'),
    );

    return group(...nodes);
  });

  s.add(headline, view3d, leftDash);
  livingDrift(s, c, drift, 1);
  orbitScene(s, c, view3d, { theta: -0.36, phi: 0.96 });
  cueTo(s, c, 'fit-batch-beat-1-focus-2', initP, 1, { dur: 0.6 });
  cueTo(s, c, 'fit-batch-beat-1-focus-1', trainP, 1, { dur: 1.6 });
  cueTo(s, c, 'fit-batch-beat-2-focus-1', rightP, 1, { dur: 0.6 });
  cueTo(s, c, 'fit-batch-beat-2-focus-2', freezeP, 1, { dur: 0.7 });
}
