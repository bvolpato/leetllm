// Act 3 (Scenes 14-20): BCE Output Residual, ReLU Backward Gate, Multi-Label Output Denominator,
// Saved Values & Checkpointing, Batch Parameter Update, Finite-Difference Corner Check,
// Signed Earned Gradient Transfer.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PARAMETERS,
  ROLE,
  backward,
  batchGradient,
  beatTo,
  binaryMeanGradients,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  finiteReluSecant,
  freshGradient,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  gradientStep,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  requestForward,
  rule,
  sigmoid,
  stableBce,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 14. residual: Which way should the score move?
// Cues: training-case, score-target, bce-loss, try-logit*,
//       differentiate-output, bce-cancel*, direction
// ---------------------------------------------------------------------------
export function residual(s, c) {
  const tcP = s.value(0);
  const stP = s.value(0);
  const bceP = s.value(0);
  const tryP = s.value(0);
  const diffP = s.value(0);
  const canP = s.value(0);
  const dirP = s.value(0);
  const drift = s.value(0);

  const b = backward([1, 4], 1); // z2 = -0.25, score = 0.4378, loss = 0.8259, dz2 = -0.5622

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 14 }));
  s.add(decorAura(-220, 20, 520, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Binary Cross-Entropy', '& the (p − y) Cancellation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'REQUEST [1, 4] TIMED OUT (y = 1)  ·  L(z) = −log σ(z)',
  });

  const live = dynamic(() => {
    const tr = tryP.value * (1 - diffP.value); // slide to z=0 on try-logit, return on differentiate-output
    const df = diffP.value;
    const cn = canP.value;
    const dr = dirP.value;
    const zNow = mix(b.z2, 0, tr);
    const pNow = sigmoid(zNow);
    const lNow = stableBce(zNow, 1);
    const nodes = [];

    // Left: BCE curve L(z) = -log(sigmoid(z)) over z in [-2.5, 2.5]
    const gx0 = -800;
    const gx1 = 60;
    const gy0 = 210;
    const gy1 = -185;
    const xOf = (z) => mix(gx0, gx1, (z + 2.5) / 5);
    const yOf = (l) => mix(gy0, gy1, l / 2.6);

    const pts = [];
    for (let i = 0; i <= 52; i += 1) {
      const z = mix(-2.5, 2.5, i / 52);
      pts.push([xOf(z), yOf(stableBce(z, 1))]);
    }
    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 2.8),
      rule(xOf(0), gy0, xOf(0), gy1, '#2a3759', 2.2),
      txt('logit z', gx1, gy0 + 48, 26, COSMOS.muted, 'mono', 'right'),
      txt('z = 0', xOf(0), gy0 + 48, 26, COSMOS.muted, 'mono'),
      glowingTrail(pts, { color: ROLE.dark, width: 4.5, glow: 10 }),
      glowDot(xOf(zNow), yOf(lNow), { radius: 14, color: ROLE.lit, glow: 14 }),
      txt(
        tr > 0.5 ? 'z = 0.00  →  L = 0.69' : 'z = −0.25  →  L = 0.83',
        gx1,
        gy1 + 10,
        28,
        ROLE.lit,
        'mono',
        'right',
      ),
    );

    // Right: Chain rule cancellation to (p - y)
    const rx = 460;
    nodes.push(
      txt('CHAIN RULE THROUGH SIGMOID', rx, -190, 26, ROLE.dark, 'mono'),
      glowTex('\\frac{\\partial L}{\\partial z} = \\frac{-1}{p} \\cdot p(1 - p)', {
        x: rx,
        y: -85,
        size: 42,
        color: df > 0.2 ? ROLE.dark : COSMOS.dim,
      }).opacity(mix(0.45, 1, df)),
      glowTex(cn > 0.2 ? '= p - y' : '= \\;?', {
        x: rx,
        y: 35,
        size: 52,
        color: cn > 0.2 ? ROLE.good : COSMOS.dim,
      }).opacity(mix(0.45, 1, cn)),
      txt(
        dr > 0.2
          ? `p − y = ${b.score.toFixed(2)} − 1 = ${b.dz2.toFixed(2)} (< 0)`
          : `Current score p = ${pNow.toFixed(2)}  vs  target y = 1`,
        rx,
        155,
        30,
        dr > 0.2 ? ROLE.lit : COSMOS.ink,
        'mono',
      ),
      txt(
        dr > 0.2
          ? 'Negative slope means moving z RIGHT lowers the loss!'
          : tr > 0.2
            ? 'Sliding z → 0 raises p → 0.50 and drops BCE loss!'
            : 'Which direction should logit z move to reduce loss?',
        0,
        315,
        30,
        dr > 0.2 ? ROLE.good : ROLE.lit,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'training-case', tcP, 1, { dur: 0.65 });
  cueTo(s, c, 'score-target', stP, 1, { dur: 0.65 });
  cueTo(s, c, 'bce-loss', bceP, 1, { dur: 0.65 });
  cueTo(s, c, 'try-logit', tryP, 1, { dur: 0.9, after: true });
  cueTo(s, c, 'differentiate-output', diffP, 1, { dur: 0.75 });
  cueTo(s, c, 'bce-cancel', canP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'direction', dirP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 15. backward: Which path carries the correction?
// Cues: gradient-spread, output-weights, relu-gate, positive-gate, input-gradients
// ---------------------------------------------------------------------------
export function backwardScene(s, c) {
  const sprP = s.value(0);
  const outP = s.value(0);
  const relP = s.value(0);
  const posP = s.value(0);
  const inpP = s.value(0);
  const drift = s.value(0);

  const b = backward([1, 4], 1); // z1=[-0.1, 2.5], dz2=-0.562, dh=[-0.225, -0.056], dz1=[0, -0.056]

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 15 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1a', '#ffd16614'));

  const headline = heroTitle(['Reverse Gradient Flow', 'Through ReLU Gates'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'CLOSED GATE (z₁₁ = −0.1) STOPS FLOW  ·  OPEN GATE (z₁₂ = 2.5) PASSES',
  });

  const live = dynamic(() => {
    const sp = sprP.value;
    const rl = relP.value;
    const ps = posP.value;
    const ip = inpP.value;
    const nodes = [];

    // Right-to-left reverse flow: Output dz2 -> Hidden dh -> ReLU Gate -> Input dW1
    nodes.push(
      txt('OUTPUT RESIDUAL', 660, -195, 26, ROLE.lit, 'mono'),
      numCell(`∂L/∂z₂ = ${b.dz2.toFixed(2)}`, 660, 0, {
        w: 270,
        h: 72,
        stroke: ROLE.lit,
        textColor: ROLE.lit,
        glow: 10,
      }),

      txt('HIDDEN SCALE  w₂', 220, -195, 26, ROLE.dark, 'mono'),
      numCell(sp > 0.2 ? `${b.dh[0].toFixed(3)}` : '× 0.4', 220, -95, {
        w: 185,
        h: 64,
        stroke: ROLE.dark,
        textColor: ROLE.dark,
      }),
      numCell(sp > 0.2 ? `${b.dh[1].toFixed(3)}` : '× 0.1', 220, 95, {
        w: 185,
        h: 64,
        stroke: ROLE.dark,
        textColor: ROLE.dark,
      }),

      txt('ReLU GATE', -160, -195, 26, ROLE.gate, 'mono'),
      glowBadge(
        rl > 0.2 ? 'BLOCKED (0)' : 'z = −0.1',
        -160,
        -95,
        rl > 0.2 ? ROLE.grad : COSMOS.muted,
        {
          w: 220,
          h: 56,
          size: 26,
        },
      ),
      glowBadge(
        ps > 0.2 ? 'OPEN (×1)' : 'z = +2.5',
        -160,
        95,
        ps > 0.2 ? ROLE.good : COSMOS.muted,
        {
          w: 220,
          h: 56,
          size: 26,
        },
      ),

      txt('WEIGHT GRADS ∂L/∂W₁', -620, -195, 26, ROLE.good, 'mono'),
      numCell(ip > 0.2 ? '[0.00, 0.00]' : '[?, ?]', -620, -95, {
        w: 250,
        h: 64,
        stroke: ip > 0.2 ? ROLE.grad : '#2b3b60',
        textColor: ip > 0.2 ? ROLE.grad : COSMOS.dim,
      }),
      numCell(
        ip > 0.2 ? `[${b.dw1[1][0].toFixed(3)}, ${b.dw1[1][1].toFixed(3)}]` : '[?, ?]',
        -620,
        95,
        {
          w: 290,
          h: 64,
          stroke: ip > 0.2 ? ROLE.good : '#2b3b60',
          textColor: ip > 0.2 ? ROLE.good : COSMOS.dim,
          glow: ip > 0.2 ? 10 : 0,
        },
      ),
    );

    // Connecting reverse wires
    nodes.push(
      line([520, 0], [316, -95], { stroke: ROLE.dark, width: 3 }),
      line([520, 0], [316, 95], { stroke: ROLE.dark, width: 3 }),
      line([124, -95], [-46, -95], { stroke: rl > 0.2 ? ROLE.grad : '#3b4e78', width: 3 }),
      line([124, 95], [-46, 95], { stroke: ps > 0.2 ? ROLE.good : '#3b4e78', width: 3.5 }),
      line([-275, 95], [-470, 95], { stroke: ip > 0.2 ? ROLE.good : '#3b4e78', width: 3.5 }),
    );

    nodes.push(
      txt(
        ip > 0.2
          ? 'Open unit multiplies surviving slope by x = [1, 4]; closed unit gets 0 for both weights!'
          : 'Which hidden path lets the backward correction reach Layer 1?',
        0,
        290,
        30,
        ip > 0.2 ? ROLE.good : ROLE.lit,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'gradient-spread', sprP, 1, { dur: 0.7 });
  cueTo(s, c, 'output-weights', outP, 1, { dur: 0.7 });
  cueTo(s, c, 'relu-gate', relP, 1, { dur: 0.7 });
  cueTo(s, c, 'positive-gate', posP, 1, { dur: 0.7 });
  cueTo(s, c, 'input-gradients', inpP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 16. output-denominator: What do we divide by? (B x C = 2 x 3 = 6)
// Cues: output-denominator-beat-0, retry-label, first-residual, next-residual,
//       output-denominator-beat-1, bce-six-products, nn-bce-wrong-denominator,
//       output-denominator-beat-2, timeout-box, bce-positive-weight
// ---------------------------------------------------------------------------
export function outputDenominator(s, c) {
  const b0P = s.value(0);
  const retP = s.value(0);
  const r1P = s.value(0);
  const r2P = s.value(0);
  const divP = s.value(0);
  const sixP = s.value(0);
  const wrgP = s.value(0);
  const b2P = s.value(0);
  const tbP = s.value(0);
  const pwP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 16 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Multi-Label BCE Mean:', 'Divide by B × C = 6'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: '2 REQUESTS × 3 BINARY LABELS  ·  POSITIVE WEIGHT = 3',
  });

  const live = dynamic(() => {
    const r1 = r1P.value;
    const r2 = r2P.value;
    const six = sixP.value;
    const wrg = wrgP.value;
    const pw = pwP.value;
    const cols = ['Timeout', 'Cache hit', 'Retry'];
    const labels = [
      [1, 0, 1],
      [0, 1, 0],
    ];
    const nodes = [];

    cols.forEach((name, j) => {
      nodes.push(txt(name, -340 + j * 340, -205, 28, ROLE.dark, 'mono'));
    });

    labels.forEach((row, i) => {
      const y = -95 + i * 120;
      nodes.push(txt(`Req ${i + 1}`, -680, y, 30, COSMOS.ink, 'mono'));
      row.forEach((yTrue, j) => {
        const cx = -340 + j * 340;
        const isFirst = i === 0 && j === 0;
        const res = 0.5 - yTrue; // -0.5 or +0.5
        let display = `y=${yTrue} (p=0.5)`;
        let col = '#2b3b60';
        if (pw > 0.2 && isFirst) {
          display = '3×(−0.5) = −1.5';
          col = ROLE.lit;
        } else if (six > 0.2) {
          display = res < 0 ? '−1/12' : '+1/12';
          col = ROLE.good;
        } else if ((isFirst && r1 > 0.2) || (!isFirst && r2 > 0.2)) {
          display = res < 0 ? '−0.5' : '+0.5';
          col = ROLE.lit;
        }
        nodes.push(
          numCell(display, cx, y, {
            w: 270,
            h: 72,
            size: 28,
            stroke: col,
            textColor: col === '#2b3b60' ? COSMOS.ink : col,
            glow: isFirst && pw > 0.2 ? 12 : six > 0.2 ? 6 : 0,
          }),
        );
      });
    });

    nodes.push(
      rule(-740, 115, 740, 115, '#2a3759', 2),
      txt(
        pw > 0.2
          ? 'pos_weight = 3 scales y = 1 residuals (p − 1) × 3 = −1.5; y = 0 stays p'
          : wrg > 0.2
            ? 'Dividing by B × C = 6 gives ±1/12   (dividing by 2 gives ±1/4, 3× too big!)'
            : six > 0.2
              ? '2 requests × 3 labels = 6 boxes  →  logit gradients = ±1/12'
              : 'Every logit = 0 (p = 0.5)  ·  How many boxes do we divide by?',
        0,
        215,
        30,
        pw > 0.2 ? ROLE.lit : wrg > 0.2 ? ROLE.grad : six > 0.2 ? ROLE.good : ROLE.lit,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'output-denominator-beat-0', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'retry-label', retP, 1, { dur: 0.65 });
  cueTo(s, c, 'first-residual', r1P, 1, { dur: 0.65 });
  cueTo(s, c, 'next-residual', r2P, 1, { dur: 0.65 });
  cueTo(s, c, 'output-denominator-beat-1', divP, 1, { dur: 0.65 });
  cueTo(s, c, 'bce-six-products', sixP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'nn-bce-wrong-denominator', wrgP, 1, { dur: 0.7 });
  cueTo(s, c, 'output-denominator-beat-2', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'timeout-box', tbP, 1, { dur: 0.65 });
  cueTo(s, c, 'bce-positive-weight', pwP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 17. saved-values: Backward needs values whose identities still match
// Cues: saved-values-beat-0, saved-values-beat-1, checkpoint-discard,
//       checkpoint-recompute, saved-values-beat-2
// ---------------------------------------------------------------------------
export function savedValues(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const disP = s.value(0);
  const recP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.gate, seed: 17 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1a', '#5ce1e614'));

  const headline = heroTitle(['Activation Memory &', 'Gradient Checkpointing'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gate,
    eyebrow: 'SAVE (X, H, ReLU MASK)  OR  RECOMPUTE H FROM MATCHING WEIGHTS',
  });

  const live = dynamic(() => {
    const dis = disP.value;
    const rec = recP.value;
    const b2 = b2P.value;
    const hDropped = dis > 0.2 && rec < 0.3;
    const nodes = [];

    // Forward cache row
    nodes.push(
      txt('FORWARD BOUNDARY CACHE', -780, -195, 28, ROLE.dark, 'mono', 'left'),
      numCell('Input X', -560, -85, {
        w: 280,
        h: 74,
        stroke: ROLE.dark,
        textColor: ROLE.dark,
        glow: 8,
      }),
      numCell(hDropped ? 'H DISCARDED' : rec > 0.3 ? 'H RECOMPUTED' : 'Hidden H', 0, -85, {
        w: 320,
        h: 74,
        stroke: hDropped ? ROLE.grad : rec > 0.3 ? ROLE.good : ROLE.lit,
        textColor: hDropped ? ROLE.grad : rec > 0.3 ? ROLE.good : ROLE.lit,
        glow: 10,
      }),
      numCell('ReLU Mask (z>0)', 560, -85, {
        w: 320,
        h: 74,
        stroke: ROLE.gate,
        textColor: ROLE.gate,
        glow: 8,
      }),
    );

    // Backward consumers row
    nodes.push(
      txt('BACKWARD GRADIENT CONSUMERS', 0, 232, 26, ROLE.good, 'mono'),
      numCell('∂L/∂W₁ needs X & mask', -460, 155, {
        w: 440,
        h: 70,
        stroke: ROLE.dark,
        textColor: COSMOS.ink,
      }),
      numCell('∂L/∂W₂ needs H', 460, 155, {
        w: 440,
        h: 70,
        stroke: hDropped ? ROLE.grad : ROLE.good,
        textColor: hDropped ? ROLE.grad : ROLE.good,
      }),
      line([-560, -45], [-460, 118], { stroke: ROLE.dark, width: 3 }),
      line([560, -45], [-340, 118], { stroke: ROLE.gate, width: 3 }),
      line([0, -45], [460, 118], {
        stroke: hDropped ? ROLE.grad : ROLE.good,
        width: 3,
        dash: hDropped ? [8, 6] : null,
      }),
    );

    nodes.push(
      txt(
        b2 > 0.2
          ? 'Checkpointing trades extra compute for less activation RAM (weights + optimizer state remain)'
          : rec > 0.3
            ? 'Recomputing H from identical weights & RNG reproduces exact gradients!'
            : 'Backward pass must pair sensitivities with the exact forward activations',
        0,
        305,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'saved-values-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'saved-values-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'checkpoint-discard', disP, 1, { dur: 0.75 });
  cueTo(s, c, 'checkpoint-recompute', recP, 1, { dur: 0.75 });
  cueTo(s, c, 'saved-values-beat-2', b2P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 18. update: Use all the gradients for one step
// Cues: batch-gradient, all-parameter-step
// ---------------------------------------------------------------------------
export function update(s, c) {
  const bgP = s.value(0);
  const stP = s.value(0);
  const drift = s.value(0);

  const g0 = batchGradient(PARAMETERS);
  const p1 = gradientStep(PARAMETERS, g0, 0.1);
  const g1 = batchGradient(p1); // loss drops 0.5252 -> 0.4980

  s.add(cinemaGrid({ accent: ROLE.good, seed: 18 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['One Shared Batch Step', 'Updates All 9 Parameters'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'θ ← θ − 0.1 · ∇L_batch  ·  4 LABELED REQUESTS',
  });

  const live = dynamic(() => {
    const bg = bgP.value;
    const st = stP.value;
    const lossNow = mix(g0.loss, g1.loss, st);
    const items = [
      { k: 'w11', v0: PARAMETERS.w1[0][0], v1: p1.w1[0][0] },
      { k: 'w12', v0: PARAMETERS.w1[0][1], v1: p1.w1[0][1] },
      { k: 'w21', v0: PARAMETERS.w1[1][0], v1: p1.w1[1][0] },
      { k: 'w22', v0: PARAMETERS.w1[1][1], v1: p1.w1[1][1] },
      { k: 'b11', v0: PARAMETERS.b1[0], v1: p1.b1[0] },
      { k: 'b12', v0: PARAMETERS.b1[1], v1: p1.b1[1] },
      { k: 'w2_1', v0: PARAMETERS.w2[0], v1: p1.w2[0] },
      { k: 'w2_2', v0: PARAMETERS.w2[1], v1: p1.w2[1] },
      { k: 'b2', v0: PARAMETERS.b2, v1: p1.b2 },
    ];
    const nodes = [
      txt('ALL 9 PARAMETERS (LIVE SGD STEP η = 0.1)', -800, -205, 28, ROLE.dark, 'mono', 'left'),
    ];

    items.forEach((it, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = -540 + col * 540;
      const cy = -105 + row * 100;
      const cur = mix(it.v0, it.v1, st);
      nodes.push(
        txt(it.k, cx - 155, cy, 28, COSMOS.muted, 'mono', 'left'),
        numCell(cur.toFixed(3), cx + 40, cy, {
          w: 220,
          h: 62,
          stroke: st > 0.2 ? ROLE.good : bg > 0.2 ? ROLE.dark : '#2b3b60',
          textColor: st > 0.2 ? ROLE.good : COSMOS.ink,
          glow: st > 0.2 ? 8 : 0,
        }),
      );
    });

    nodes.push(
      txt(
        `MEAN BATCH BCE LOSS:  ${g0.loss.toFixed(4)}  →  ${lossNow.toFixed(4)}`,
        0,
        220,
        40,
        st > 0.2 ? ROLE.good : ROLE.lit,
        'mono',
      ).glow(st > 0.2 ? 12 : 6, st > 0.2 ? ROLE.good : ROLE.lit),
      txt(
        'Lowering training loss checks one local step; held-out requests test generalization',
        0,
        310,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'batch-gradient', bgP, 1, { dur: 0.8 });
  cueTo(s, c, 'all-parameter-step', stP, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 19. corner-check: A finite difference can cross the gate it is checking
// Cues: corner-check-beat-0, corner-check-beat-1, corner-secant-result, corner-check-beat-2
// ---------------------------------------------------------------------------
export function cornerCheck(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const secP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  const cornerSlope = finiteReluSecant(0, 0.01); // 0.5
  const crossSlope = finiteReluSecant(0.05, 0.1); // 0.75

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 19 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#ff6b8b14'));

  const headline = heroTitle(['Finite-Difference Checks', 'at a ReLU Corner'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'CENTRAL SECANT  (ReLU(z+ε) − ReLU(z−ε)) / (2ε)',
  });

  const live = dynamic(() => {
    const b1 = b1P.value;
    const sc = secP.value;
    const b2 = b2P.value;
    const zCenter = b2 > 0.2 ? 0.05 : 0;
    const eps = b2 > 0.5 ? 0.03 : 0.1;
    const sVal = finiteReluSecant(zCenter, eps);
    const nodes = [];

    // Left: ReLU corner plot on [-0.2, 0.2] with secant chord
    const gx0 = -800;
    const gx1 = 60;
    const gy0 = 195;
    const gy1 = -165;
    const xOf = (z) => mix(gx0, gx1, (z + 0.2) / 0.4);
    const yOf = (y) => mix(gy0, gy1, y / 0.22);

    const zL = zCenter - eps;
    const zR = zCenter + eps;
    const yL = Math.max(0, zL);
    const yR = Math.max(0, zR);

    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 2.8),
      rule(xOf(0), gy0, xOf(0), gy1, '#2a3759', 2.2),
      txt('z = 0 (corner)', xOf(0), gy0 + 46, 26, ROLE.lit, 'mono'),
      glowingTrail(
        [
          [xOf(-0.2), yOf(0)],
          [xOf(0), yOf(0)],
          [xOf(0.2), yOf(0.2)],
        ],
        { color: ROLE.dark, width: 4.5, glow: 10 },
      ),
      // Secant chord connecting (z-eps) to (z+eps)
      line([xOf(zL), yOf(yL)], [xOf(zR), yOf(yR)], { stroke: ROLE.grad, width: 4 }).glow(
        10,
        ROLE.grad,
      ),
      glowDot(xOf(zL), yOf(yL), { radius: 10, color: ROLE.grad, glow: 10 }),
      glowDot(xOf(zR), yOf(yR), { radius: 10, color: ROLE.grad, glow: 10 }),
    );

    // Right: Comparison readout
    const rx = 160;
    nodes.push(
      txt(
        b2 > 0.2 ? 'POSITIVE POINT z = +0.05' : 'AT THE CORNER z = 0',
        rx,
        -180,
        28,
        ROLE.lit,
        'mono',
        'left',
      ),
      txt(`Perturbation ε = ${eps.toFixed(2)}`, rx, -105, 30, COSMOS.ink, 'mono', 'left'),
      txt(`Central secant = ${sVal.toFixed(2)}`, rx, -30, 36, ROLE.grad, 'mono', 'left').glow(
        8,
        ROLE.grad,
      ),
      txt(
        b2 > 0.2
          ? 'Both samples stay > 0 → secant = 1.00 = tangent!'
          : sc > 0.2
            ? `PyTorch backward at 0 = 0.00  (≠ ${cornerSlope.toFixed(2)} secant)`
            : 'Left slope = 0, right slope = 1',
        rx,
        65,
        28,
        b2 > 0.2 ? ROLE.good : ROLE.lit,
        'sans',
        'left',
      ),
      txt(
        'Test gradcheck in float64 away from corners so both perturbations stay in one branch',
        0,
        310,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'corner-check-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'corner-check-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'corner-secant-result', secP, 1, { dur: 0.7 });
  cueTo(s, c, 'corner-check-beat-2', b2P, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 20. earned-gradient-transfer: Which way should these weights move?
// Cues: earned-gradient-transfer-beat-0, fresh-forward-values, nn-fresh-logit*,
//       earned-gradient-transfer-beat-1, nn-fresh-hidden-sensitivity*,
//       fresh-gradient-products*, nn-fresh-negative*, nn-fresh-inactive,
//       earned-gradient-transfer-beat-2, fresh-gradient-step, fresh-gradient-result*
// ---------------------------------------------------------------------------
export function earnedGradientTransfer(s, c) {
  const b0P = s.value(0);
  const fwdP = s.value(0);
  const logP = s.value(0);
  const b1P = s.value(0);
  const hsP = s.value(0);
  const gpP = s.value(0);
  const gnP = s.value(0);
  const inP = s.value(0);
  const b2P = s.value(0);
  const stP = s.value(0);
  const resP = s.value(0);
  const drift = s.value(0);

  const g = freshGradient(); // x=[-1, 2], y=1 -> z1=[-0.5, 1.1], z2=-0.39, score=0.4037
  const pNext = gradientStep(PARAMETERS, g, 0.1);
  const fNext = requestForward([-1, 2], pNext); // score=0.4373

  s.add(cinemaGrid({ accent: ROLE.good, seed: 20 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#ffd16614'));

  const headline = heroTitle(['Signed Feature Transfer:', 'Opposite Weight Moves'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FRESH REQUEST x = [−1, +2],  y = 1  ·  OPEN UNIT 2 (w₂₂ = 0.1)',
  });

  const live = dynamic(() => {
    const fw = fwdP.value;
    const lg = logP.value;
    const hs = hsP.value;
    const gp = gpP.value;
    const gn = gnP.value;
    const ina = inP.value;
    const st = stP.value;
    const rs = resP.value;
    const nodes = [];

    // Top summary row
    nodes.push(
      txt(
        fw > 0.2 ? 'z₁ = [−0.5 (closed), +1.1 (open)]' : 'Reset all 9 parameters · x = [−1, +2]',
        -800,
        -205,
        28,
        ROLE.dark,
        'mono',
        'left',
      ),
      txt(
        lg > 0.2 ? `z₂ = ${g.z2.toFixed(2)}  →  p = ${g.score.toFixed(3)}` : 'Logit z₂ = ?',
        800,
        -205,
        28,
        ROLE.lit,
        'mono',
        'right',
      ),
    );

    // Two aligned weight-change rails for Unit 2 weights: w21 (prompt x=-1) and w22 (queue x=+2)
    const x0 = -540;
    const x1 = 540;
    const xOf = (delta) => mix(x0, x1, (delta + 0.02) / 0.04); // delta in [-0.02, +0.02]
    const dW21 = (pNext.w1[1][0] - PARAMETERS.w1[1][0]) * st; // negative (drops!)
    const dW22 = (pNext.w1[1][1] - PARAMETERS.w1[1][1]) * st; // positive (rises!)

    // Rail 1: Prompt weight w21 (feature = -1 -> positive gradient -> DROPS!)
    const y1 = -65;
    nodes.push(
      txt('Prompt weight w₂₁ (x₁ = −1)', -800, y1 - 45, 28, ROLE.grad, 'mono', 'left'),
      txt(
        gp > 0.2 ? `grad = +${g.dw1[1][0].toFixed(4)}  →  DROPS` : 'grad sign = ?',
        800,
        y1 - 45,
        28,
        gp > 0.2 ? ROLE.grad : COSMOS.dim,
        'mono',
        'right',
      ),
      rule(x0, y1, x1, y1, '#3b4e78', 3.2),
      line([xOf(0), y1 - 18], [xOf(0), y1 + 18], { stroke: COSMOS.muted, width: 2.2 }),
      glowDot(xOf(dW21), y1, { radius: 13, color: ROLE.grad, glow: 12 }),
    );

    // Rail 2: Queue weight w22 (feature = +2 -> negative gradient -> RISES!)
    const y2 = 95;
    nodes.push(
      txt('Queue weight w₂₂ (x₂ = +2)', -800, y2 - 45, 28, ROLE.good, 'mono', 'left'),
      txt(
        gn > 0.2 ? `grad = ${g.dw1[1][1].toFixed(4)}  →  RISES 2×` : 'grad sign = ?',
        800,
        y2 - 45,
        28,
        gn > 0.2 ? ROLE.good : COSMOS.dim,
        'mono',
        'right',
      ),
      rule(x0, y2, x1, y2, '#3b4e78', 3.2),
      line([xOf(0), y2 - 18], [xOf(0), y2 + 18], { stroke: COSMOS.muted, width: 2.2 }),
      glowDot(xOf(dW22), y2, { radius: 13, color: ROLE.good, glow: 12 }),
    );

    // Bottom status
    nodes.push(
      txt(
        rs > 0.2
          ? `After η = 0.1 update on all params:  score rises ${g.score.toFixed(3)} → ${fNext.score.toFixed(3)}!`
          : ina > 0.2
            ? 'Closed Unit 1 receives 0 gradient on both weights'
            : hs > 0.2
              ? `Hidden sensitivity ∂L/∂h₂ = ${g.dh[1].toFixed(4)} (< 0)`
              : 'Which weight should go up and which should go down?',
        0,
        265,
        32,
        rs > 0.2 ? ROLE.good : ROLE.lit,
        'mono',
      ).glow(rs > 0.2 ? 10 : 0, ROLE.good),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'earned-gradient-transfer-beat-0', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-forward-values', fwdP, 1, { dur: 0.7 });
  cueTo(s, c, 'nn-fresh-logit', logP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'earned-gradient-transfer-beat-1', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'nn-fresh-hidden-sensitivity', hsP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'fresh-gradient-products', gpP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'nn-fresh-negative', gnP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'nn-fresh-inactive', inP, 1, { dur: 0.65 });
  cueTo(s, c, 'earned-gradient-transfer-beat-2', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-gradient-step', stP, 1, { dur: 0.95 });
  cueTo(s, c, 'fresh-gradient-result', resP, 1, { dur: 0.75, after: true });
}
