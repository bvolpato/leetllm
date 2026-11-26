// Act 2 (Scenes 7-12): Neural Forward Pass, Local Gradient Credit, 3D Conditional Entropy Floor,
// Vocabulary Softmax & Max-Shift, 3D Temperature & Top-k/Top-p Filtering, and Causal vs Masked Objectives.
import { arrow, circle, dynamic, fade, group, line, rect } from 'vizmatic/stage';
import {
  COMPILER_LOGITS,
  COMPILER_PROBS,
  COMPILER_TOKENS,
  COSMOS,
  FITTED_FUNCTION,
  FITTED_NGRAM,
  FITTED_TEST,
  GRAD_CREDIT,
  ROLE,
  cinemaGrid,
  cinematic3d,
  clamp01,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  glowVBar,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  neonCurve,
  orbitScene,
  point3d,
  rule,
  scaleTrack,
  stableSoftmax,
  surface,
  tokenChip,
  txt,
  voiceSpan,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. neural-forward: Why does the next word change?
// Beat 0: 8x6=48 emb + 12x8=96 map + 8 bias = 152 params
// Beat 1: function returns -> 12 signed products + bias -> value logit 7.904 (99.84%)
// Beat 2: swap function -> test -> result edges error (~50/50), loss 2.145 -> 0.235 nats
// ---------------------------------------------------------------------------
export function neuralForward(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const prodP = s.value(0);
  const scoreP = s.value(0);
  const probP = s.value(0);
  const b2P = s.value(0);
  const b2Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.rare, seed: 7 }));
  s.add(decorAura(-360, 10, 480, '#a78bfa1f', '#07091000'));
  s.add(decorAura(380, 10, 480, '#5ce1e61c', '#07091000'));

  const headline = heroTitle(['Neural N-Gram', 'Forward Pass'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.rare,
    eyebrow: '8-WORD EMBEDDING TABLE  ·  12x8 AFFINE MAP',
  });

  // View 0 (Beat 0): Parameter geometry (48 + 96 + 8 = 152)
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const nodes = [];

      // Left: 8x6 Embedding table E with rows "function" (1) & "returns" (5) highlighted
      const ex = -810;
      const ey = -145;
      const cw = 36;
      const ch = 42;
      nodes.push(txt('EMBEDDING TABLE E (8×6 = 48)', ex, -210, 26, ROLE.prefix, 'mono', 'left'));
      FITTED_NGRAM.vocab.forEach((word, r) => {
        const y = ey + r * (ch + 5);
        const hi = (r === 1 || r === 5) && st >= 0.8;
        const col = r === 1 ? ROLE.prefix : r === 5 ? ROLE.target : '#2b395c';
        nodes.push(txt(word, ex + 108, y, 26, hi ? col : COSMOS.dim, 'mono', 'right'));
        for (let k = 0; k < 6; k++) {
          const val = FITTED_NGRAM.embeddings[r][k];
          const fill = hi ? (val >= 0 ? `${col}aa` : `${ROLE.danger}88`) : '#141d34';
          nodes.push(
            rect(cw - 4, ch - 6, { fill, stroke: hi ? col : '#263354', width: 1.5, radius: 5 }).at(
              ex + 136 + k * cw,
              y,
            ),
          );
        }
      });

      // Center: 12-dim concatenated vector x
      const cx = -185;
      nodes.push(
        txt('CONCAT x (12)', cx, -210, 26, ROLE.target, 'mono'),
        arrow([-445, -90], [cx - 38, -50], { stroke: ROLE.prefix, width: 3 }).opacity(
          mix(0.4, 1, clamp01(st)),
        ),
        arrow([-445, 96], [cx - 38, 105], { stroke: ROLE.target, width: 3 }).opacity(
          mix(0.4, 1, clamp01(st)),
        ),
      );
      for (let i = 0; i < 12; i++) {
        const col = i < 6 ? ROLE.prefix : ROLE.target;
        nodes.push(
          rect(42, 24, { fill: `${col}88`, stroke: col, width: 1.5, radius: 4 }).at(
            cx,
            -145 + i * 28,
          ),
        );
      }

      // Right: 12x8 Affine map W + 8 biases b -> 152 trainable numbers
      const wx = 85;
      nodes.push(
        arrow([cx + 34, 10], [wx - 24, 10], { stroke: ROLE.rare, width: 3 }),
        txt('AFFINE MAP W (12×8 = 96) + b (8)', wx, -210, 26, ROLE.rare, 'mono', 'left'),
      );
      for (let r = 0; r < 12; r++) {
        for (let colIdx = 0; colIdx < 8; colIdx++) {
          const wv = FITTED_NGRAM.weights[r][colIdx];
          const fill = wv >= 0 ? '#5ce1e644' : '#ff6b8b44';
          nodes.push(
            rect(44, 22, { fill, stroke: '#354874', width: 1, radius: 3 }).at(
              wx + 24 + colIdx * 50,
              -145 + r * 28,
            ),
          );
        }
      }
      // Bias vector strip
      for (let colIdx = 0; colIdx < 8; colIdx++) {
        nodes.push(
          rect(44, 24, { fill: `${ROLE.target}77`, stroke: ROLE.target, width: 1.4, radius: 4 }).at(
            wx + 24 + colIdx * 50,
            215,
          ),
        );
      }
      nodes.push(
        txt('b (8)', wx + 430, 215, 26, ROLE.target, 'mono', 'left'),
        txt(
          st >= 1.8
            ? '48 + 96 + 8  =  152 trainable parameters'
            : 'Linear projection (no tanh hidden layer in this lab)',
          0,
          365,
          30,
          st >= 1.8 ? ROLE.target : COSMOS.muted,
          'mono',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): 12 signed terms + bias -> logit 7.904 -> softmax 99.84%
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const pr = prodP.value;
      const sc = scoreP.value;
      const pb = probP.value;
      const nodes = [];

      // Left: 12 signed product terms + bias contributing to z("value")
      const terms = [...FITTED_FUNCTION.valueTerms, FITTED_FUNCTION.valueBias];
      const zeroX = -465;
      const scale = 120;
      nodes.push(
        txt('VALUE LOGIT: 12 SIGNED PRODUCTS + BIAS', -850, -210, 26, ROLE.target, 'mono', 'left'),
        line([zeroX, -172], [zeroX, 248], { stroke: '#4d6496', width: 2.2 }),
        txt('0', zeroX, 278, 26, COSMOS.muted, 'mono'),
      );
      terms.forEach((t, idx) => {
        const y = -152 + idx * 31;
        const revealed = clamp01(pr * 13 - idx);
        const w = Math.abs(t) * scale * mix(0.25, 1, revealed);
        const col = idx === 12 ? ROLE.target : t >= 0 ? ROLE.prefix : ROLE.danger;
        const bx = t >= 0 ? zeroX : zeroX - w;
        nodes.push(glowBar(bx, y, Math.max(4, w), 18, col, { glow: 5 * revealed, radius: 4 }));
        if (idx === 0 || idx === 6 || idx === 12) {
          const lbl = idx === 0 ? 'func[0..5]' : idx === 6 ? 'ret[0..5]' : 'bias +1.40';
          nodes.push(txt(lbl, -845, y + 2, 26, col, 'mono', 'left'));
        }
      });

      // Right: Top logits & Softmax probabilities over all 8 words
      const rx = 145;
      const maxBarW = 460;
      const displayIdx = [7, 4, 0]; // value, result, error
      const displayCols = [ROLE.target, ROLE.prob, ROLE.rare];

      nodes.push(
        txt(
          'AFTER 200 UPDATES: "function returns"',
          rx - 80,
          -210,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ),
      );
      displayIdx.forEach((vi, rowI) => {
        const y = -95 + rowI * 115;
        const word = FITTED_NGRAM.vocab[vi];
        const logit = FITTED_FUNCTION.logits[vi];
        const prob = FITTED_FUNCTION.probabilities[vi];
        const col = displayCols[rowI];
        const logitFrac = clamp01((logit + 1) / 9.5);
        const barW = maxBarW * mix(logitFrac * mix(0.35, 1, sc), prob, pb);
        nodes.push(
          txt(word, rx - 22, y, 30, col, 'mono', 'right'),
          scaleTrack(rx, y, maxBarW, 46, { radius: 9 }),
          glowBar(rx, y, Math.max(8, barW), 46, col, { glow: 9, radius: 9 }),
          txt(
            pb > 0.5
              ? `${(prob * 100).toFixed(2)}%`
              : sc > 0.35
                ? `z = ${logit.toFixed(3)}`
                : '...',
            rx + maxBarW + 24,
            y,
            28,
            col,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        txt(
          '12 signed products + bias -> logits -> softmax over all 8 vocabulary words',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Swap "function" -> "test": result (~51%) edges error (~48%), loss 2.145 -> 0.235
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const st = b2Step.value;
      const nodes = [];

      // Left: Two conflicting training comments & loss drop meter
      nodes.push(
        txt('SWAP PREFIX: "test returns"', -840, -210, 26, ROLE.prob, 'mono', 'left'),
        tokenChip('test', -740, -110, ROLE.prob, { w: 165, h: 64, size: 30, glow: 10 }),
        tokenChip('returns', -540, -110, ROLE.target, { w: 185, h: 64, size: 30, glow: 9 }),
        txt('TRAINING EVIDENCE (1 EACH)', -840, 15, 26, COSMOS.muted, 'mono', 'left'),
        txt('test returns  ->  result   (×1)', -840, 80, 30, ROLE.alt, 'mono', 'left'),
        txt('test returns  ->  error    (×1)', -840, 140, 30, ROLE.rare, 'mono', 'left'),
        txt(
          'Mean loss:  2.145  ->  0.235 nats',
          -840,
          235,
          30,
          ROLE.target,
          'mono',
          'left',
        ).opacity(mix(0.45, 1, clamp01(st))),
      );

      // Right: Fitted probabilities for "test returns"
      const rx = 140;
      const maxW = 540;
      const pRes = FITTED_TEST.probabilities[4];
      const pErr = FITTED_TEST.probabilities[0];
      const pVal = FITTED_TEST.probabilities[7];
      const testRows = [
        { word: 'result', p: pRes, col: ROLE.alt },
        { word: 'error', p: pErr, col: ROLE.rare },
        { word: 'value', p: pVal, col: COSMOS.dim },
      ];
      nodes.push(txt('FITTED NEXT-WORD PROBABILITIES', rx, -210, 26, ROLE.alt, 'mono', 'left'));
      testRows.forEach((tr, i) => {
        const y = -95 + i * 115;
        nodes.push(
          txt(tr.word, rx - 22, y, 30, tr.col, 'mono', 'right'),
          scaleTrack(rx, y, maxW, 48, { radius: 9 }),
          glowBar(rx, y, Math.max(8, maxW * tr.p), 48, tr.col, { glow: 9, radius: 9 }),
          txt(`${(tr.p * 100).toFixed(1)}%`, rx + maxW + 24, y, 30, tr.col, 'mono', 'left'),
        );
      });

      nodes.push(
        txt(
          st >= 3.5
            ? 'Linear head adds per-word contributions; a nonlinear layer learns word interactions'
            : 'Each ending appeared once, so the model gives result and error nearly half each',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);

  // Beat 0
  cueTo(s, c, 'neural-forward-b1', b0Step, 0.4, { dur: 0.4 });
  voiceSpan(s, c, 'neural-forward-voice-1', vPhase, 1);
  cueTo(s, c, 'neural-forward-step-0-1', b0Step, 1, { dur: 0.6 });
  cueTo(s, c, 'neural-forward-step-0-2', b0Step, 2, { dur: 0.55 });
  cueTo(s, c, 'neural-forward-step-0-3', b0Step, 3, { dur: 0.45 });

  // Beat 1
  cueTo(s, c, 'neural-forward-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'neural-forward-voice-2', vPhase, 2);
  cueTo(s, c, 'neural-forward-step-1-1', b1Step, 1, { dur: 0.4 });
  cueTo(s, c, 'neural-products', prodP, 1, { dur: 1.1 });
  cueTo(s, c, 'neural-forward-step-1-2', b1Step, 2, { dur: 0.4 });
  cueTo(s, c, 'neural-value-score', scoreP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'neural-forward-step-1-3', b1Step, 3, { dur: 0.4 });
  cueTo(s, c, 'neural-forward-step-1-4', b1Step, 4, { dur: 0.4 });
  cueTo(s, c, 'neural-forward-step-1-5', b1Step, 5, { dur: 0.4 });
  cueTo(s, c, 'neural-value-probability', probP, 1, { after: true, dur: 0.6 });

  // Beat 2
  cueTo(s, c, 'neural-forward-b3', b2P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'neural-forward-voice-3', vPhase, 3);
  cueTo(s, c, 'neural-forward-step-2-1', b2Step, 1, { dur: 0.45 });
  cueTo(s, c, 'neural-forward-step-2-2', b2Step, 2, { dur: 0.5 });
  cueTo(s, c, 'neural-forward-step-2-3', b2Step, 3, { dur: 0.45 });
  cueTo(s, c, 'neural-forward-step-2-4', b2Step, 4, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 8. neural-gradient: Which score should training raise?
// Cues: gradient-target, gradient-subtract*, gradient-column, gradient-all, gradient-input*
// ---------------------------------------------------------------------------
export function neuralGradient(s, c) {
  const tgtP = s.value(0);
  const subP = s.value(0);
  const colP = s.value(0);
  const allP = s.value(0);
  const inpP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 8 }));
  s.add(decorAura(-280, -40, 460, '#fb923c1e', '#07091000'));
  s.add(decorAura(380, 120, 460, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Cross-Entropy', 'Gradient Credit'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'LOGIT RESIDUAL  p - y  ->  WEIGHT & INPUT GRADIENTS',
  });

  const tokNames = ['A', 'B', 'C'];
  const tokCols = [ROLE.prefix, ROLE.prob, ROLE.target];

  const visual = dynamic(() => {
    const tg = tgtP.value;
    const sb = subP.value;
    const cl = colP.value;
    const al = allP.value;
    const ip = inpP.value;
    const nodes = [];

    // Top-half signed number line from -1.0 to +1.0
    const xMin = -760;
    const xMax = 760;
    const axisY = -140;
    const xOf = (v) => mix(xMin, xMax, (v + 1) / 2);
    const x0 = xOf(0);

    nodes.push(
      txt(
        sb > 0.3 ? 'LOGIT DERIVATIVES  dL/dz = p - y' : 'PREDICTED PROBABILITIES  p',
        xMin,
        axisY - 90,
        26,
        sb > 0.3 ? ROLE.warm : ROLE.prefix,
        'mono',
        'left',
      ),
      rule(xMin, axisY, xMax, axisY, '#495f91', 3),
      line([x0, axisY - 26], [x0, axisY + 26], { stroke: COSMOS.ink, width: 3 }),
      txt('-1.0', xMin, axisY + 46, 26, COSMOS.muted, 'mono'),
      txt('0', x0, axisY + 46, 26, COSMOS.ink, 'mono'),
      txt('+1.0', xMax, axisY + 46, 26, COSMOS.muted, 'mono'),
    );

    // Three token markers (C slides 1 unit left from +0.3 to -0.7 on gradient-subtract)
    const vals = [
      GRAD_CREDIT.probabilities[0],
      GRAD_CREDIT.probabilities[1],
      mix(GRAD_CREDIT.probabilities[2], GRAD_CREDIT.residual[2], sb),
    ];
    vals.forEach((v, i) => {
      const px = xOf(v);
      const col = i === 2 ? (tg > 0.3 ? ROLE.target : ROLE.prob) : tokCols[i];
      const yOff = i === 0 ? -52 : i === 1 ? -52 : 76;
      if (i === 2 && sb > 0.05) {
        nodes.push(
          arrow([xOf(0.3), axisY], [px + 18, axisY], {
            stroke: ROLE.target,
            width: 4,
          }).opacity(sb),
        );
      }
      nodes.push(
        glowDot(px, axisY, { radius: i === 2 && tg > 0.3 ? 16 : 13, color: col, glow: 13 }),
        txt(
          `${tokNames[i]}: ${v >= 0 ? '+' : ''}${v.toFixed(1)}`,
          px,
          axisY + yOff,
          28,
          col,
          'mono',
        ),
      );
    });

    // Bottom half: 2 input features x=[2, -1] -> 2x3 Weight Gradient Matrix -> input gradient
    const leftX = -730;
    const matX = -220;
    const rightX = 480;
    const rowYs = [125, 225];
    const colXs = [matX, matX + 195, matX + 390];

    nodes.push(
      txt('INPUT x', leftX, 48, 26, ROLE.prefix, 'mono'),
      txt('WEIGHT GRADIENTS  x_i · (p_j - y_j)', matX + 195, 48, 26, ROLE.warm, 'mono'),
      txt('INPUT GRADIENT', rightX + 80, 48, 26, ROLE.alt, 'mono'),
    );

    // Input features x = [2, -1]
    GRAD_CREDIT.input.forEach((xv, r) => {
      nodes.push(
        tokenChip(`x${r + 1} = ${xv > 0 ? '+2' : '-1'}`, leftX, rowYs[r], ROLE.prefix, {
          w: 175,
          h: 64,
          size: 28,
          glow: 7,
        }),
      );
    });

    // 2x3 weight gradient cells
    for (let r = 0; r < 2; r++) {
      for (let j = 0; j < 3; j++) {
        const showCell = j === 2 ? cl > 0.2 : al > 0.2;
        const gVal = GRAD_CREDIT.weightGradients[r][j];
        const wVal = GRAD_CREDIT.weights[r][j];
        const cellCol = j === 2 ? ROLE.target : ROLE.warm;
        nodes.push(
          rect(168, 66, {
            fill: showCell ? '#16203a' : '#0d1427',
            stroke: showCell ? cellCol : '#2b395c',
            width: showCell ? 2.6 : 1.6,
            radius: 10,
          }).at(colXs[j], rowYs[r]),
          txt(
            showCell ? `${gVal >= 0 ? '+' : ''}${gVal.toFixed(1)}` : `w=${wVal.toFixed(1)}`,
            colXs[j],
            rowYs[r] + 2,
            28,
            showCell ? cellCol : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Input gradient readout for x1 (row 0 dot product)
    if (ip > 0.05) {
      nodes.push(
        group(
          arrow([colXs[2] + 95, rowYs[0]], [rightX - 18, rowYs[0]], {
            stroke: ROLE.alt,
            width: 3.5,
          }),
          txt('dL/dx1 = -0.39', rightX + 12, rowYs[0], 34, ROLE.alt, 'mono', 'left').glow(
            10,
            ROLE.alt,
          ),
          txt('0.3(.2)-0.2(.5)+0.5(-.7)', rightX + 12, rowYs[1], 26, COSMOS.muted, 'mono', 'left'),
        ).opacity(ip),
      );
    } else {
      nodes.push(
        txt(
          tg > 0.3 && sb < 0.2
            ? 'Record says C (0.3) -> which score rises?'
            : 'All 3 scores feed back into x1',
          rightX + 100,
          175,
          26,
          COSMOS.muted,
          'serif',
        ),
      );
    }

    nodes.push(
      txt(
        ip > 0.45
          ? 'Split feature gradients into the 2 looked-up embedding rows; average across all 6 examples'
          : sb > 0.45
            ? 'Gradient descent subtracts dL/dz: subtracting -0.7 pushes C score UP'
            : 'Target C has p = 0.3 while B leads at 0.5',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'gradient-target', tgtP, 1, { dur: 0.6 });
  cueTo(s, c, 'gradient-subtract', subP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'gradient-column', colP, 1, { dur: 0.75 });
  cueTo(s, c, 'gradient-all', allP, 1, { dur: 0.75 });
  cueTo(s, c, 'gradient-input', inpP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 9. conditional-floor: 3D Orbiting Cross-Entropy Floor Surface
// Beat 0: test returns (1/2 vs 1/2) -> min at 0.5, 6-target infimum 2 ln(2) / 6 = 0.231 nats
// Beat 1: function returns (2/3 vs 1/3) -> min at 2/3, entropy 0.637 nats vs 1/3 class error
// ---------------------------------------------------------------------------
export function conditionalFloor(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.target, seed: 9 }));
  s.add(decorAura(-220, 40, 520, '#ffd1661c', '#07091000'));

  const headline = heroTitle(['Irreducible', 'Conditional Floor'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: '3D CROSS-ENTROPY SURFACE  H(q, p) = -q ln p - (1-q) ln(1-p)',
  });

  // 3D Orbiting Cross-Entropy Surface: x -> model prob p in [0.08, 0.92], y -> true split q in [0.15, 0.85]
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit: 112,
    focus: [0, 0, 0.75],
  }).at(-270, 55);

  const ceHeight = (p, q) => {
    const h = -(q * Math.log(p) + (1 - q) * Math.log(1 - p));
    return Math.min(2.35, h);
  };

  const ceSurf = surface(
    (x, y) => {
      const u = clamp01((x + 2.3) / 4.6);
      const v = clamp01((y + 2.1) / 4.2);
      const p = 0.08 + u * 0.84;
      const q = 0.15 + v * 0.7;
      return ceHeight(p, q);
    },
    {
      x: [-2.3, 2.3],
      y: [-2.1, 2.1],
      steps: 24,
      colors: [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.rose],
      wire: true,
    },
  );

  const optMarker = point3d(
    () => {
      const q = mix(0.5, 2 / 3, b1P.value);
      const u = (q - 0.08) / 0.84;
      const v = (q - 0.15) / 0.7;
      return [-2.3 + u * 4.6, -2.1 + v * 4.2, ceHeight(q, q) + 0.12];
    },
    { color: ROLE.target, radius: 11, glow: 14 },
  );

  view3d.add(ceSurf, optMarker);

  // Right-side analytical panel (floating text + equations, zero boxed cards!)
  const panel0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const nodes = [
        txt('PREFIX: "test returns" (2 OBS)', 240, -230, 26, ROLE.prefix, 'mono', 'left'),
        txt('1 × result   +   1 × error', 240, -172, 32, COSMOS.ink, 'mono', 'left'),
        txt('EMPIRICAL OPTIMUM', 240, -82, 26, COSMOS.muted, 'mono', 'left'),
        txt('p = 1/2 each', 240, -20, 46, ROLE.target, 'mono', 'left').glow(10, ROLE.target),
      ];
      if (st >= 3.2) {
        nodes.push(
          glowTex('\\frac{2 \\ln 2}{6} \\approx 0.231\\text{ nats}', {
            x: 525,
            y: 105,
            size: 42,
            color: ROLE.alt,
          }),
          txt('6-target infimum across all comments', 240, 195, 26, COSMOS.muted, 'sans', 'left'),
        );
      } else {
        nodes.push(
          txt('Setting p(result) = 1 makes', 240, 82, 28, ROLE.danger, 'sans', 'left'),
          txt('p(error) = 0 -> loss = +inf', 240, 130, 28, ROLE.danger, 'mono', 'left'),
        );
      }
      nodes.push(
        txt(
          'Same prefix yields one distribution: conflicting targets create a nonzero loss floor',
          0,
          410,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  const panel1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const nodes = [
        txt('PREFIX: "function returns" (3 OBS)', 240, -230, 26, ROLE.prefix, 'mono', 'left'),
        txt('2 × value   +   1 × exception', 240, -172, 32, COSMOS.ink, 'mono', 'left'),
        txt('OPTIMAL SPLIT:  2/3  vs  1/3', 240, -90, 30, ROLE.target, 'mono', 'left'),
        glowTex('-\\tfrac{2}{3}\\ln\\tfrac{2}{3} - \\tfrac{1}{3}\\ln\\tfrac{1}{3} \\approx 0.637', {
          x: 540,
          y: 12,
          size: 38,
          color: ROLE.target,
        }),
        txt('0.637 nats / occurrence', 240, 95, 30, ROLE.alt, 'mono', 'left'),
        txt(
          st >= 2.5
            ? 'Classification error = 1/3 (different quantity)'
            : 'Irreducible conditional entropy',
          240,
          165,
          28,
          ROLE.warm,
          'sans',
          'left',
        ),
        txt(
          'Extra conditioning can separate cases; higher confidence on the same prefix cannot',
          0,
          410,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(view3d, headline, panel0, panel1);
  orbitScene(s, c, view3d, { theta: -0.78 + 0.55, phi: 0.96 });

  cueTo(s, c, 'conditional-floor-b1', b0Step, 0.4, { dur: 0.4 });
  voiceSpan(s, c, 'conditional-floor-voice-1', vPhase, 1);
  cueTo(s, c, 'conditional-floor-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-0-3', b0Step, 3, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-0-4', b0Step, 4, { dur: 0.5 });
  cueTo(s, c, 'conditional-floor-step-0-5', b0Step, 5, { dur: 0.45 });

  cueTo(s, c, 'conditional-floor-b2', b1P, 1, { dur: 0.75 });
  voiceSpan(s, c, 'conditional-floor-voice-2', vPhase, 2);
  cueTo(s, c, 'conditional-floor-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'conditional-floor-step-1-4', b1Step, 4, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 10. vocabulary-softmax: Stabilized Softmax over Full Vocabulary
// Beat 0: 5 compiler logits [3, 1.5, -1, -2, -3] -> max-shift -> exp -> normalize (0.800, 0.178)
// Beat 1: Shift preserves ratios; top-2 only vs full 5-token strip
// ---------------------------------------------------------------------------
export function vocabularySoftmax(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 10 }));
  s.add(decorAura(260, 0, 500, '#5ce1e61e', '#07091000'));

  const headline = heroTitle(['Stabilized', 'Vocabulary Softmax'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: '5-TOKEN COMPILER LOGITS  ->  PROBABILITIES SUMMING TO 1',
  });

  const tokCols = [ROLE.target, ROLE.prefix, ROLE.alt, ROLE.prob, ROLE.rare];

  // View 0 (Beat 0): Logits -> Max-Shifted -> Softmax Probabilities
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const shiftT = clamp01(st - 1.2);
      const normT = clamp01(st - 2.3);
      const nodes = [];

      const labelX = -715;
      const logitZeroX = -370;
      const probX = 185;
      const probW = 520;

      nodes.push(
        txt(
          shiftT > 0.4 ? 'MAX-SHIFTED  z - max(z)' : 'RAW LOGITS  z',
          -390,
          -210,
          26,
          shiftT > 0.4 ? ROLE.target : COSMOS.muted,
          'mono',
        ),
        line([logitZeroX, -165], [logitZeroX, 245], { stroke: '#4d6496', width: 2.2 }),
        txt('0', logitZeroX, 275, 26, COSMOS.muted, 'mono'),
        txt('SOFTMAX PROBABILITY  P(w)', probX, -210, 26, ROLE.prefix, 'mono', 'left'),
      );

      COMPILER_TOKENS.forEach((tok, i) => {
        const y = -120 + i * 84;
        const z = COMPILER_LOGITS[i];
        const zCur = mix(z, z - 3.0, shiftT);
        const col = tokCols[i];
        const barLen = Math.abs(zCur) * 44;
        const bx = zCur >= 0 ? logitZeroX : logitZeroX - barLen;
        const p = COMPILER_PROBS[i];

        nodes.push(
          txt(tok, labelX, y, 28, col, 'mono', 'right'),
          glowBar(bx, y, Math.max(4, barLen), 34, col, { glow: 7, radius: 6 }),
          txt(
            `${zCur >= 0 ? '+' : ''}${zCur.toFixed(1)}`,
            zCur >= 0 ? logitZeroX + barLen + 46 : logitZeroX - barLen - 46,
            y,
            26,
            col,
            'mono',
          ),
          scaleTrack(probX, y, probW, 38, { radius: 8 }),
          glowBar(probX, y, Math.max(6, probW * p * mix(0.25, 1, normT)), 38, col, {
            glow: 9 * mix(0.3, 1, normT),
            radius: 8,
          }),
          txt(normT > 0.4 ? p.toFixed(3) : '...', probX + probW + 58, y, 28, col, 'mono'),
        );
      });

      nodes.push(
        txt(
          'Subtract max(z) = 3.0, exponentiate, and divide by sum of all 5 exponentials',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Top-2 normalization trap vs full 5-token strip
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const top2 = stableSoftmax([3.0, 1.5]);
      const stripX = -760;
      const stripW = 1520;
      const nodes = [];

      nodes.push(
        glowTex(
          'z_{\\max} - z_{\\max} = 0 \\;\\Rightarrow\\; e^{0} = 1 \\quad (\\text{no overflow, ratios preserved})',
          {
            x: 0,
            y: -215,
            size: 38,
            color: ROLE.target,
          },
        ),
        // Strip 1: Top-2 only
        txt('NORMALIZE TOP 2 ONLY (TAIL DROPPED)', stripX, -95, 26, ROLE.danger, 'mono', 'left'),
        scaleTrack(stripX, -20, stripW, 68, { stroke: ROLE.danger, radius: 12 }),
        glowBar(stripX, -20, stripW * top2[0], 62, ROLE.target, { glow: 9, radius: 10 }),
        glowBar(stripX + stripW * top2[0] + 4, -20, stripW * top2[1] - 4, 62, ROLE.prefix, {
          glow: 8,
          radius: 10,
        }),
        txt(
          `error ${(top2[0] * 100).toFixed(1)}%`,
          stripX + (stripW * top2[0]) / 2,
          -20,
          30,
          '#070910',
          'mono',
        ),
        txt(
          `warn ${(top2[1] * 100).toFixed(1)}%`,
          stripX + stripW * top2[0] + (stripW * top2[1]) / 2,
          -20,
          26,
          '#070910',
          'mono',
        ),

        // Strip 2: Full 5-token vocabulary
        txt('FULL 5-TOKEN VOCABULARY NORMALIZATION', stripX, 105, 26, ROLE.alt, 'mono', 'left'),
        scaleTrack(stripX, 180, stripW, 68, { stroke: ROLE.alt, radius: 12 }),
        glowBar(stripX, 180, stripW * COMPILER_PROBS[0], 62, ROLE.target, { glow: 10, radius: 10 }),
        glowBar(
          stripX + stripW * COMPILER_PROBS[0] + 4,
          180,
          stripW * COMPILER_PROBS[1] - 4,
          62,
          ROLE.prefix,
          { glow: 8, radius: 10 },
        ),
        glowBar(
          stripX + stripW * (COMPILER_PROBS[0] + COMPILER_PROBS[1]) + 8,
          180,
          stripW * (1 - COMPILER_PROBS[0] - COMPILER_PROBS[1]) - 8,
          62,
          ROLE.rare,
          { glow: 8, radius: 8 },
        ),
        txt('error  80.0%', stripX + (stripW * COMPILER_PROBS[0]) / 2, 180, 32, '#070910', 'mono'),
        txt(
          'warn 17.8%',
          stripX + stripW * COMPILER_PROBS[0] + (stripW * COMPILER_PROBS[1]) / 2,
          180,
          26,
          '#070910',
          'mono',
        ),
        txt('2.2%', stripX + stripW - 18, 250, 26, ROLE.rare, 'mono', 'right'),
        txt(
          st >= 3.5
            ? 'Probability is a model score: open the compiler log to verify what actually happened'
            : 'Keeping all 5 entries preserves the full tail mass and exact 80.0% share for "error"',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  cueTo(s, c, 'vocabulary-softmax-b1', b0Step, 0.4, { dur: 0.4 });
  voiceSpan(s, c, 'vocabulary-softmax-voice-1', vPhase, 1);
  cueTo(s, c, 'vocabulary-softmax-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'vocabulary-softmax-step-0-2', b0Step, 2, { dur: 0.65 });
  cueTo(s, c, 'vocabulary-softmax-step-0-3', b0Step, 3, { dur: 0.6 });
  cueTo(s, c, 'vocabulary-softmax-step-0-4', b0Step, 4, { dur: 0.45 });

  cueTo(s, c, 'vocabulary-softmax-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'vocabulary-softmax-voice-2', vPhase, 2);
  cueTo(s, c, 'vocabulary-softmax-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'vocabulary-softmax-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'vocabulary-softmax-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'vocabulary-softmax-step-1-4', b1Step, 4, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 11. temperature-filter: Temperature Scaling, Top-k / Top-p, and Stop Reasons
// Beat 0: 3D Temperature-Softmax Landscape + live T = 1.0 -> 0.5 (0.952) -> 2.0 (0.575)
// Beat 1: Top-k & Top-p nucleus truncation + renormalization [0.6, 0.3, 0.1] -> [2/3, 1/3]
// Beat 2: Sample -> Append -> Next Call loop & distinct stop reasons
// ---------------------------------------------------------------------------
export function temperatureFilter(s, c) {
  const tempVal = s.value(1.0);
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const b2P = s.value(0);
  const b2Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 11 }));
  s.add(decorAura(-280, 40, 480, '#fb923c1c', '#07091000'));

  const headline = heroTitle(['Temperature, Filters', '& Stop Reasons'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'RESCALING LOGITS  z / T  ·  TOP-K / TOP-P RENORMALIZATION',
  });

  // 3D Orbiting Temperature Softmax Surface (visible during Beat 0)
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.06,
    distance: 15.0,
    unit: 106,
    focus: [0, 0, 0.75],
  }).at(-400, 65);

  const tempSurf = surface(
    (x, y) => {
      const u = clamp01((x + 2.2) / 4.4);
      const v = clamp01((y + 2.1) / 4.2);
      const T = 0.35 + v * 1.95; // temperature in [0.35, 2.30]
      const gap = (u - 0.5) * 4.0; // logit gap
      const pLead = 1 / (1 + Math.exp(-gap / T));
      return pLead * 2.2;
    },
    {
      x: [-2.2, 2.2],
      y: [-2.1, 2.1],
      steps: 22,
      colors: [COSMOS.blue, COSMOS.cyan, COSMOS.gold, COSMOS.amber],
      wire: true,
    },
  );
  const tempDot = point3d(
    () => {
      const T = tempVal.value;
      const v = clamp01((T - 0.35) / 1.95);
      const gap = 1.5; // 3.0 - 1.5
      const u = clamp01(gap / 4.0 + 0.5);
      const pLead = 1 / (1 + Math.exp(-gap / T));
      return [-2.2 + u * 4.4, -2.1 + v * 4.2, pLead * 2.2 + 0.12];
    },
    { color: ROLE.target, radius: 11, glow: 14 },
  );
  view3d.add(tempSurf, tempDot);

  const view0Layer = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const T = tempVal.value;
      const st = b0Step.value;
      const probs = stableSoftmax(COMPILER_LOGITS.map((v) => v / T));
      const rx = 185;
      const barW = 480;
      const cols = [ROLE.target, ROLE.prefix, ROLE.alt, ROLE.prob, ROLE.rare];
      const nodes = [
        txt(`TEMPERATURE  T = ${T.toFixed(2)}`, rx, -230, 32, ROLE.warm, 'mono', 'left').glow(
          8,
          ROLE.warm,
        ),
        txt('Fixed weights; only logits divided by T', rx, -182, 26, COSMOS.muted, 'sans', 'left'),
      ];
      COMPILER_TOKENS.forEach((tok, i) => {
        const y = -95 + i * 82;
        nodes.push(
          txt(tok, rx - 22, y, 28, cols[i], 'mono', 'right'),
          scaleTrack(rx, y, barW, 38, { radius: 8 }),
          glowBar(rx, y, Math.max(6, barW * probs[i]), 38, cols[i], { glow: 9, radius: 8 }),
          txt(probs[i].toFixed(3), rx + barW + 58, y, 28, cols[i], 'mono'),
        );
      });
      nodes.push(
        txt(
          st >= 4.5
            ? 'z/T is undefined at T = 0; API greedy T = 0 is a separate argmax rule'
            : 'T = 0.5 sharpens error to 0.952  |  T = 2.0 flattens error to 0.575',
          0,
          395,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): Top-k / Top-p truncation + renormalization [0.6, 0.3, 0.1] -> [2/3, 1/3]
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const st = b1Step.value;
      const cutT = clamp01(st - 1.5);
      const renormT = clamp01(st - 2.3);
      const sx = -760;
      const sw = 1520;
      const nodes = [
        txt(
          'BEFORE FILTERING: FULL ROW [0.60, 0.30, 0.10]',
          sx,
          -195,
          28,
          ROLE.prefix,
          'mono',
          'left',
        ),
        scaleTrack(sx, -110, sw, 76, { radius: 12 }),
        glowBar(sx, -110, sw * 0.6, 70, ROLE.prob, { glow: 9, radius: 10 }),
        glowBar(sx + sw * 0.6 + 4, -110, sw * 0.3 - 4, 70, ROLE.alt, { glow: 8, radius: 10 }),
        glowBar(sx + sw * 0.9 + 8, -110, sw * 0.1 - 8, 70, ROLE.danger, {
          glow: 6,
          radius: 8,
          opacity: mix(1, 0.25, cutT),
        }),
        txt('0.60', sx + sw * 0.3, -110, 32, '#070910', 'mono'),
        txt('0.30', sx + sw * 0.75, -110, 30, '#070910', 'mono'),
        txt(
          cutT > 0.4 ? 'CUT' : '0.10',
          sx + sw * 0.95,
          -110,
          26,
          cutT > 0.4 ? ROLE.danger : '#070910',
          'mono',
        ),

        // After top-2 renormalization -> 2/3 and 1/3
        txt(
          renormT > 0.4
            ? 'AFTER TOP-2 RENORMALIZATION:  [2/3, 1/3]  (SUM = 1.00)'
            : 'DISCARD TAIL -> MUST RENORMALIZE RETAINED MASS',
          sx,
          55,
          28,
          renormT > 0.4 ? ROLE.target : COSMOS.muted,
          'mono',
          'left',
        ),
        scaleTrack(sx, 140, sw, 76, { stroke: ROLE.target, radius: 12 }),
        glowBar(sx, 140, sw * mix(0.6, 2 / 3, renormT), 70, ROLE.prob, { glow: 10, radius: 10 }),
        glowBar(
          sx + sw * mix(0.6, 2 / 3, renormT) + 4,
          140,
          sw * mix(0.3, 1 / 3, renormT) - 4,
          70,
          ROLE.alt,
          { glow: 9, radius: 10 },
        ),
        txt(
          renormT > 0.5 ? '2/3  (66.7%)' : '0.60 / 0.90',
          sx + sw * (mix(0.6, 2 / 3, renormT) / 2),
          140,
          32,
          '#070910',
          'mono',
        ),
        txt(
          renormT > 0.5 ? '1/3  (33.3%)' : '0.30 / 0.90',
          sx + sw * (mix(0.6, 2 / 3, renormT) + mix(0.3, 1 / 3, renormT) / 2),
          140,
          30,
          '#070910',
          'mono',
        ),
        txt(
          'Top-k keeps k best logits; top-p (nucleus) keeps smallest top set reaching cumulative p',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Sample -> Append -> Next Model Call loop & distinct stop reasons
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const st = b2Step.value;
      const nodes = [];

      // Left: 3-node loop diagram
      const yLoop = -35;
      nodes.push(
        txt('SEPARATE SELECTION FROM NEXT CALL', -835, -210, 26, ROLE.prefix, 'mono', 'left'),
        tokenChip('1. Sample', -690, yLoop, ROLE.target, { w: 220, h: 78, size: 30, glow: 10 }),
        arrow([-565, yLoop], [-485, yLoop], { stroke: ROLE.prefix, width: 3.5 }),
        tokenChip('2. Append', -355, yLoop, ROLE.prefix, { w: 220, h: 78, size: 30, glow: 10 }),
        arrow([-230, yLoop], [-150, yLoop], { stroke: ROLE.alt, width: 3.5 }),
        tokenChip('3. Re-score', -15, yLoop, ROLE.alt, { w: 230, h: 78, size: 30, glow: 10 }),
        // Return arc below
        line([-15, yLoop + 46], [-15, yLoop + 125], { stroke: ROLE.alt, width: 2.8 }),
        line([-15, yLoop + 125], [-690, yLoop + 125], { stroke: ROLE.alt, width: 2.8 }),
        arrow([-690, yLoop + 125], [-690, yLoop + 46], { stroke: ROLE.alt, width: 2.8 }),
        txt('changed prefix feeds next step', -355, yLoop + 162, 26, COSMOS.muted, 'mono'),
      );

      // Right: Stop reason gauge / distinct termination signals (floating pills, no bullet box)
      const rx = 250;
      const stopItems = [
        { lbl: 'end token (<eos>)', tag: 'COMPLETED', col: ROLE.alt },
        { lbl: 'max_tokens budget', tag: 'TRUNCATED', col: ROLE.warm },
        { lbl: 'stop delimiter', tag: 'MATCHED', col: ROLE.prefix },
        { lbl: 'timeout / interrupt', tag: 'ABORTED', col: ROLE.danger },
      ];
      nodes.push(txt('REPORT THE EXACT STOP REASON', rx, -210, 26, ROLE.warm, 'mono', 'left'));
      stopItems.forEach((si, idx) => {
        const y = -110 + idx * 86;
        const lit = st >= 1.8 ? 1 : 0.5;
        nodes.push(
          glowDot(rx + 14, y, { radius: 9, color: si.col, glow: 10 * lit }),
          txt(si.lbl, rx + 44, y, 28, COSMOS.ink, 'mono', 'left').opacity(lit),
          txt(si.tag, rx + 510, y, 26, si.col, 'mono', 'right').opacity(lit),
        );
      });

      nodes.push(
        txt(
          'Explicit stop reasons keep partial cutoffs from looking like finished answers',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Fade out 3D surface cleanly when Beat 1 enters
  s.add(view3d, headline, view0Layer, view1, view2);
  orbitScene(s, c, view3d, { theta: -0.82 + 0.45, phi: 1.0 });

  cueTo(s, c, 'temperature-filter-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'temperature-filter-voice-1', vPhase, 1);
  cueTo(s, c, 'temperature-filter-step-0-1', tempVal, 0.5, { dur: 0.85 });
  cueTo(s, c, 'temperature-filter-step-0-2', tempVal, 2.0, { dur: 0.9 });
  cueTo(s, c, 'temperature-filter-step-0-3', b0Step, 3, { dur: 0.4 });
  cueTo(s, c, 'temperature-filter-step-0-4', b0Step, 4, { dur: 0.4 });
  cueTo(s, c, 'temperature-filter-step-0-5', b0Step, 5, { dur: 0.4 });

  c.on('temperature-filter-b2', () => {
    s.play(fade(view3d, 0, { duration: 0.35 }));
  });
  cueTo(s, c, 'temperature-filter-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'temperature-filter-voice-2', vPhase, 2);
  cueTo(s, c, 'temperature-filter-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'temperature-filter-step-1-2', b1Step, 2, { dur: 0.55 });
  cueTo(s, c, 'temperature-filter-step-1-3', b1Step, 3, { dur: 0.6 });
  cueTo(s, c, 'temperature-filter-step-1-4', b1Step, 4, { dur: 0.45 });

  cueTo(s, c, 'temperature-filter-b3', b2P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'temperature-filter-voice-3', vPhase, 3);
  cueTo(s, c, 'temperature-filter-step-2-1', b2Step, 1, { dur: 0.5 });
  cueTo(s, c, 'temperature-filter-step-2-2', b2Step, 2, { dur: 0.5 });
  cueTo(s, c, 'temperature-filter-step-2-3', b2Step, 3, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 12. objective-boundary: Causal LM vs Masked LM (BERT)
// Beat 0: Left-to-right causal cone vs bidirectional masked reconstruction on "The [cat] sat"
// Beat 1: BERT 15% quota on 1,000 positions (150 -> 120 mask, 15 random, 15 unchanged)
// ---------------------------------------------------------------------------
export function objectiveBoundary(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 12 }));
  s.add(decorAura(-380, 0, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(380, 0, 480, '#a78bfa1c', '#07091000'));

  const headline = heroTitle(['Causal vs Masked', 'Objectives'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: 'LEFT-TO-RIGHT GENERATION  vs  BIDIRECTIONAL RECONSTRUCTION',
  });

  // View 0: Side-by-side causal vs masked information flow on "The [cat] sat"
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const mlmAlpha = mix(0.45, 1, clamp01(st - 1.2));
      const nodes = [];

      // Left: Causal LM (only "The" -> [cat]; "sat" blocked by rose wall)
      const lx = -450;
      const yMid = 10;
      nodes.push(
        txt('CAUSAL LM  P(w_t | w_<t)', lx, -185, 30, ROLE.prefix, 'mono'),
        txt('Bigram, RNN, Decoder Transformer', lx, -135, 26, COSMOS.muted, 'sans'),
        tokenChip('The', lx - 260, yMid, ROLE.prefix, { w: 145, h: 72, size: 32, glow: 9 }),
        arrow([lx - 178, yMid], [lx - 92, yMid], { stroke: ROLE.prefix, width: 4 }),
        tokenChip('[ ? ]', lx, yMid, ROLE.target, {
          w: 155,
          h: 72,
          size: 32,
          glow: 11,
          dash: [8, 6],
        }),
        line([lx + 115, yMid - 72], [lx + 115, yMid + 72], {
          stroke: ROLE.danger,
          width: 4.5,
        }).glow(10, ROLE.danger),
        tokenChip('sat', lx + 250, yMid, ROLE.danger, {
          w: 145,
          h: 72,
          size: 32,
          glow: 5,
          opacity: 0.65,
        }),
        txt('FUTURE BLOCKED', lx + 250, yMid + 82, 26, ROLE.danger, 'mono'),
      );

      // Divider
      nodes.push(rule(0, -190, 0, 220, '#2a3759', 2));

      // Right: Masked LM (both "The" -> [MASK] <- "sat")
      const rx = 450;
      nodes.push(
        txt('MASKED LM (BERT)', rx, -185, 30, ROLE.rare, 'mono').opacity(mlmAlpha),
        txt('Bidirectional encoder context', rx, -135, 26, COSMOS.muted, 'sans').opacity(mlmAlpha),
        tokenChip('The', rx - 260, yMid, ROLE.alt, {
          w: 145,
          h: 72,
          size: 32,
          glow: 9,
          opacity: mlmAlpha,
        }),
        arrow([rx - 178, yMid], [rx - 95, yMid], { stroke: ROLE.alt, width: 4 }).opacity(mlmAlpha),
        tokenChip('[MASK]', rx, yMid, ROLE.rare, {
          w: 170,
          h: 72,
          size: 30,
          glow: 11,
          opacity: mlmAlpha,
        }),
        arrow([rx + 178, yMid], [rx + 95, yMid], { stroke: ROLE.alt, width: 4 }).opacity(mlmAlpha),
        tokenChip('sat', rx + 260, yMid, ROLE.alt, {
          w: 145,
          h: 72,
          size: 32,
          glow: 9,
          opacity: mlmAlpha,
        }),
        txt('BOTH SIDES PERMITTED', rx, yMid + 82, 26, ROLE.alt, 'mono').opacity(mlmAlpha),
      );

      nodes.push(
        txt(
          'In "The [cat] sat", reading "sat" is valid for masked training but leaks the future in causal LM',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1: BERT 15% selection on 1,000 positions -> 120 mask, 15 random, 15 unchanged
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const sx = -760;
      const sw = 1520;
      const y1 = -105;
      const y2 = 130;
      const splitT = clamp01(st - 0.8);
      const nodes = [];

      // Row 1: 1,000 positions -> 850 untouched + 150 selected (15%)
      const w850 = sw * 0.85;
      const w150 = sw * 0.15;
      nodes.push(
        txt(
          '1,000 INPUT POSITIONS  (QUOTA ILLUSTRATION)',
          sx,
          y1 - 76,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        scaleTrack(sx, y1, sw, 72, { radius: 12 }),
        glowBar(sx, y1, w850, 66, '#273658', { glow: 0, radius: 10 }),
        glowBar(sx + w850 + 4, y1, w150 - 4, 66, ROLE.rare, { glow: 12, radius: 10 }),
        txt('850 unselected (85%)', sx + w850 / 2, y1, 30, COSMOS.muted, 'mono'),
        txt('150 (15%)', sx + w850 + w150 / 2, y1, 26, '#070910', 'mono'),
      );

      // Funnel down from 150 selected into 120 / 15 / 15 breakdown
      const bW = 1200;
      const bX = -600;
      const wMask = bW * 0.8;
      const wRand = bW * 0.1;
      const wSame = bW * 0.1;
      nodes.push(
        line([sx + w850 + 4, y1 + 40], [bX, y2 - 110], {
          stroke: ROLE.rare,
          width: 2.5,
          dash: [8, 6],
        }),
        line([sx + sw, y1 + 40], [bX + bW, y2 - 110], {
          stroke: ROLE.rare,
          width: 2.5,
          dash: [8, 6],
        }),
        txt(
          'INSIDE THE 150 SELECTED POSITIONS (ALL LABELED BY ORIGINAL TOKEN)',
          bX,
          y2 - 70,
          26,
          ROLE.target,
          'mono',
          'left',
        ),
        scaleTrack(bX, y2, bW, 74, { stroke: ROLE.rare, radius: 12 }),
        glowBar(bX, y2, wMask, 68, ROLE.rare, {
          glow: 10 * mix(0.4, 1, splitT),
          radius: 10,
          opacity: mix(0.55, 1, splitT),
        }),
        glowBar(bX + wMask + 4, y2, wRand - 4, 68, ROLE.warm, {
          glow: 9 * mix(0.4, 1, splitT),
          radius: 8,
          opacity: mix(0.5, 1, splitT),
        }),
        glowBar(bX + wMask + wRand + 8, y2, wSame - 8, 68, ROLE.alt, {
          glow: 9 * mix(0.4, 1, splitT),
          radius: 8,
          opacity: mix(0.5, 1, splitT),
        }),
        txt('120  [MASK]  (80%)', bX + wMask / 2, y2, 32, '#070910', 'mono'),
        txt('15 random (10%)', bX + wMask + wRand / 2 - 45, y2 + 78, 26, ROLE.warm, 'mono'),
        txt('15 same (10%)', bX + wMask + wRand + wSame / 2 + 55, y2 + 78, 26, ROLE.alt, 'mono'),
        txt(
          st >= 3.5
            ? 'Masked conditionals do not form standard left-to-right perplexity or append-one-token generation'
            : 'Actual random draws vary; every selected target stays the original uncorrupted token',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  cueTo(s, c, 'objective-boundary-b1', b0Step, 0.4, { dur: 0.4 });
  voiceSpan(s, c, 'objective-boundary-voice-1', vPhase, 1);
  cueTo(s, c, 'objective-boundary-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'objective-boundary-step-0-2', b0Step, 2, { dur: 0.55 });
  cueTo(s, c, 'objective-boundary-step-0-3', b0Step, 3, { dur: 0.5 });

  cueTo(s, c, 'objective-boundary-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'objective-boundary-voice-2', vPhase, 2);
  cueTo(s, c, 'objective-boundary-step-1-1', b1Step, 1, { dur: 0.55 });
  cueTo(s, c, 'objective-boundary-step-1-2', b1Step, 2, { dur: 0.55 });
  cueTo(s, c, 'objective-boundary-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'objective-boundary-step-1-4', b1Step, 4, { dur: 0.45 });
}
