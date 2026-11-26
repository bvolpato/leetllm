// Act 5 (Scenes 23-26): ViT Patch Projection = Strided Conv2d, Architecture & Slice Eval,
// Reversed Edge + ReLU Transfer, and Earned CNN Finale (0.05 -> 0.01 vs 0.02 Winner Flip).
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  ARTICLE_CROP,
  COSMOS,
  IMAGE,
  KERNEL,
  MAP,
  ROLE,
  cellPos,
  cinemaGrid,
  clamp01,
  correlate,
  cropForward,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  fmtSigned,
  fmtVal,
  glowBar,
  glowDot,
  glowTex,
  heroTitle,
  livingDrift,
  matrixGrid,
  mix,
  numCell,
  patchProjection,
  rule,
  scaleTrack,
  txt,
  windowBox,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 23. patch-projection: The same patch projection can be written as a convolution
// Cues: patch-projection-b1, patch-extract, patch-projection-b2, patch-weights,
//       patch-reshape, patch-projection-b3, patch-mix
// ---------------------------------------------------------------------------
export function patchProjectionScene(s, c) {
  const b1P = s.value(0);
  const extP = s.value(0);
  const b2P = s.value(0);
  const wtP = s.value(0);
  const rshP = s.value(0);
  const b3P = s.value(0);
  const mixP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.channel, seed: 23 }));
  s.add(decorAura(-450, 40, 480, '#a78bfa1e', '#07091000'));
  s.add(decorAura(450, 40, 480, '#5ce1e61c', '#07091000'));

  const headline = heroTitle(['ViT Patch Projection', 'Is a Strided Convolution'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.channel,
    eyebrow: 'NON-OVERLAPPING PxP PATCHES  ·  CONV2D(K=P, S=P, OUT=D)',
  });

  const pp = patchProjection();
  const patchCols = [ROLE.kernel, ROLE.pos, ROLE.window, ROLE.channel];

  const live = dynamic(() => {
    const b2 = b2P.value;
    const rsh = rshP.value;
    const b3 = b3P.value;
    const mx = mixP.value;
    const nodes = [];

    // Left: 4x4 grayscale image split into 4 non-overlapping 2x2 patches (stays pinned!)
    const inX = -595;
    const inY = 35;
    const sz = 92;
    const gap = 8;
    nodes.push(
      txt('4x4 IMAGE -> 4 PATCHES (2x2)', inX, -210, 26, ROLE.input, 'mono'),
      matrixGrid(pp.image, inX, inY, {
        cellSize: sz,
        gap,
        fontSize: 26,
        digits: 2,
        formatter: (v) => v.toFixed(2).replace('0.', '.'),
      }),
    );
    // 4 colored non-overlapping 2x2 patch outlines
    const pOp = mix(0.4, 1, extP.value);
    for (let pi = 0; pi < 4; pi += 1) {
      const pr = Math.floor(pi / 2) * 2;
      const pc = (pi % 2) * 2;
      nodes.push(
        windowBox(inX, inY, 4, 4, pr, pc, 2, 2, {
          cellSize: sz,
          gap,
          color: patchCols[pi],
          width: 4,
          glow: 9,
          pad: 3,
          opacity: pOp,
        }),
      );
    }

    // Right side crossfades cleanly between:
    // View A (Beats 0-1): Weight reshape (3x4 linear rows <-> three 2x2 Conv2d kernels) -> 4 tokens x 3 dims
    // View B (Beat 2): Local Conv neighborhood vs Global Self-Attention all-to-all opposite-corner links
    const vA = fadeOut(b3);
    const vB = fadeIn(b3);

    if (vA > 0.02) {
      const midX = 25;
      const tokX = 590;
      const kLabels = ['Feature 0', 'Feature 1', 'Feature 2'];
      const flatOp = fadeOut(rsh);
      const gridOp = fadeIn(rsh);

      nodes.push(
        group(
          txt(
            rsh > 0.5 ? 'THREE 2x2 CONV KERNELS (S=2)' : 'LINEAR PROJECTION (3x4 + 3 BIAS)',
            midX,
            -210,
            26,
            rsh > 0.5 ? ROLE.pos : ROLE.channel,
            'mono',
          ),
          // 3 output features: clean non-overlapping crossfade from 1x4 rows -> 2x2 Conv2d kernels!
          ...pp.weights.map((row, fi) => {
            const baseY = -105 + fi * 145;
            return group(
              txt(kLabels[fi], midX - 210, baseY, 26, patchCols[fi], 'mono', 'right'),
              flatOp > 0.02
                ? group(
                    ...row.map((w, wi) =>
                      numCell(fmtVal(w, 2), midX - 110 + wi * 76, baseY, {
                        w: 68,
                        h: 48,
                        size: 26,
                        stroke: patchCols[fi],
                        textColor: patchCols[fi],
                        glow: 3,
                        radius: 7,
                      }),
                    ),
                  ).opacity(flatOp)
                : group(),
              gridOp > 0.02
                ? group(
                    ...row.map((w, wi) =>
                      numCell(
                        fmtVal(w, 2),
                        midX - 40 + (wi % 2) * 76,
                        baseY - 28 + Math.floor(wi / 2) * 56,
                        {
                          w: 68,
                          h: 48,
                          size: 26,
                          stroke: patchCols[fi],
                          textColor: patchCols[fi],
                          glow: 7,
                          radius: 7,
                        },
                      ),
                    ),
                  ).opacity(gridOp)
                : group(),
            );
          }),
          // Right: 4 output tokens (each 3 features)
          txt('4 TOKENS x 3 DIMS', tokX, -210, 26, ROLE.pos, 'mono'),
          ...pp.tokens.map((tok, ti) => {
            const ty = -115 + ti * 102;
            const sTok = tok.map((v) => v.toFixed(2)).join('  ');
            return group(
              txt(`T${ti}`, tokX - 215, ty, 26, patchCols[ti], 'mono'),
              numCell(sTok, tokX + 15, ty, {
                w: 360,
                h: 68,
                size: 26,
                stroke: patchCols[ti],
                textColor: COSMOS.ink,
                glow: rsh > 0.5 ? 8 : 3,
              }),
            );
          }),
          txt(
            rsh > 0.5
              ? 'Identical dot products: Linear(P²C, D) == Conv2d(k=P, s=P, out=D)'
              : wtP.value > 0.2 || b2 > 0.2
                ? '12 shared weights + 3 biases map 4 patches -> 4 three-feature tokens'
                : 'RGB PxP patch has 3P² entries projected into D channels',
            185,
            345,
            28,
            rsh > 0.5 ? ROLE.pos : COSMOS.ink,
            'serif',
          ),
        ).opacity(vA),
      );
    }

    if (vB > 0.02) {
      // Beat 2: Side-by-side Local Conv neighborhood vs Global ViT Self-Attention graph
      const cX = 20;
      const aX = 560;
      const gY = 10;
      const pts = [
        [-115, -105],
        [115, -105],
        [-115, 105],
        [115, 105],
      ];

      nodes.push(
        group(
          // Local Conv panel
          txt('CNN: LOCAL WINDOW', cX, -205, 28, ROLE.kernel, 'mono'),
          ...pts.map(([dx, dy], i) =>
            numCell(`P${i}`, cX + dx, gY + dy, {
              w: 112,
              h: 82,
              size: 30,
              stroke: patchCols[i],
              textColor: patchCols[i],
            }),
          ),
          // Local neighbor links strictly in the open gap outside boxes!
          line([cX - 54, gY - 105], [cX + 54, gY - 105], { stroke: ROLE.kernel, width: 4.5 }).glow(
            8,
            ROLE.kernel,
          ),
          line([cX - 115, gY - 58], [cX - 115, gY + 58], { stroke: ROLE.kernel, width: 4.5 }).glow(
            8,
            ROLE.kernel,
          ),
          txt('Reads adjacent neighbors first', cX, 225, 26, ROLE.kernel, 'sans'),

          // Global ViT Self-Attention panel: all 6 links strictly inside open gap between boxes!
          txt('VIT: GLOBAL ATTENTION', aX, -205, 28, ROLE.channel, 'mono'),
          line([aX - 44, gY - 105], [aX + 44, gY - 105], { stroke: ROLE.channel, width: 2.6 })
            .glow(6, ROLE.channel)
            .opacity(mix(0.35, 1, mx)),
          line([aX - 44, gY + 105], [aX + 44, gY + 105], { stroke: ROLE.channel, width: 2.6 })
            .glow(6, ROLE.channel)
            .opacity(mix(0.35, 1, mx)),
          line([aX - 115, gY - 58], [aX - 115, gY + 58], { stroke: ROLE.channel, width: 2.6 })
            .glow(6, ROLE.channel)
            .opacity(mix(0.35, 1, mx)),
          line([aX + 115, gY - 58], [aX + 115, gY + 58], { stroke: ROLE.channel, width: 2.6 })
            .glow(6, ROLE.channel)
            .opacity(mix(0.35, 1, mx)),
          // Opposite-corner diagonals strictly in central open gap (never touch any box!)
          line([aX - 44, gY - 58], [aX + 44, gY + 58], { stroke: ROLE.window, width: 4.8 })
            .glow(12, ROLE.window)
            .opacity(mix(0.35, 1, mx)),
          line([aX + 44, gY - 58], [aX - 44, gY + 58], { stroke: ROLE.window, width: 4.8 })
            .glow(12, ROLE.window)
            .opacity(mix(0.35, 1, mx)),
          ...pts.map(([dx, dy], i) =>
            numCell(`P${i}+pos`, aX + dx, gY + dy, {
              w: 132,
              h: 82,
              size: 26,
              stroke: patchCols[i],
              textColor: patchCols[i],
              glow: 6,
            }),
          ),
          txt('Opposite corners mix in layer 1 + learned pos', aX, 225, 26, ROLE.window, 'sans'),
          txt(
            'Same stem, different mixing: local spatial bias vs global patch attention',
            290,
            345,
            28,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(vB),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'patch-projection-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'patch-extract', extP, 1, { dur: 0.6 });
  cueTo(s, c, 'patch-projection-b2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'patch-weights', wtP, 1, { dur: 0.55 });
  cueTo(s, c, 'patch-reshape', rshP, 1, { dur: 1.0 });
  cueTo(s, c, 'patch-projection-b3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'patch-mix', mixP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 24. architecture-choice: Which model spots the small mark?
// Cues: architecture-choice-b1, architecture-choice-b2, inspect-slices
// ---------------------------------------------------------------------------
export function architectureChoice(s, c) {
  const b1P = s.value(0);
  const b2P = s.value(0);
  const slP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 24 }));
  s.add(decorAura(-440, 40, 480, '#a78bfa1a', '#07091000'));
  s.add(decorAura(440, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['CNNs vs. Transformers:', 'Measure the Failure Slices'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: 'TRAINING RECIPE  ·  HELD-OUT PANEL SLICES  ·  LATENCY',
  });

  const TINY_MARK = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ];
  const BORDER_MARK = [
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  const live = dynamic(() => {
    const b1 = b1P.value;
    const b2 = b2P.value;
    const sl = slP.value;
    const nodes = [];

    // Left: Architectural spectrum gauges (NO boxed prose cards!)
    const lx = -830;
    const families = [
      {
        name: 'ViT',
        detail: 'Global attention  ·  large pretraining',
        bias: 0.2,
        col: ROLE.channel,
      },
      {
        name: 'DeiT',
        detail: 'ImageNet recipe  ·  teacher distillation',
        bias: 0.45,
        col: ROLE.kernel,
      },
      {
        name: 'ConvNeXt',
        detail: 'Modernized CNN  ·  competitive accuracy',
        bias: 0.85,
        col: ROLE.pos,
      },
    ];

    nodes.push(
      txt('ARCHITECTURE SPECTRUM', lx, -205, 28, COSMOS.muted, 'mono', 'left'),
      txt('Global mixing', lx, -155, 26, ROLE.channel, 'mono', 'left'),
      txt('Local bias', lx + 620, -155, 26, ROLE.pos, 'mono', 'right'),
    );

    families.forEach((f, i) => {
      const y = -65 + i * 145;
      const trackW = 620;
      const dotX = lx + f.bias * trackW;
      nodes.push(
        txt(f.name, lx, y - 34, 34, f.col, 'mono', 'left'),
        txt(f.detail, lx + 215, y - 34, 26, COSMOS.muted, 'sans', 'left'),
        scaleTrack(lx, y + 18, trackW, 20, { radius: 10 }),
        glowDot(dotX, y + 18, { radius: 13, color: f.col, glow: 12 }),
      );
    });

    // Right: Held-out inspection slices (tiny central mark + border mark + latency & config strip)
    const rx = 405;
    const rOp = mix(0.45, 1, b2);
    nodes.push(
      txt('HELD-OUT PANEL EVALUATION SLICES', rx, -205, 28, ROLE.pos, 'mono').opacity(rOp),
      txt('TINY MARK SLICE', rx - 210, -135, 26, ROLE.window, 'mono').opacity(rOp),
      matrixGrid(TINY_MARK, rx - 210, 15, {
        cellSize: 82,
        gap: 7,
        fontSize: 28,
        highlightCells: sl > 0.2 ? [[1, 1]] : null,
        opacity: rOp,
      }),
      txt('BORDER MARK SLICE', rx + 210, -135, 26, ROLE.neg, 'mono').opacity(rOp),
      matrixGrid(BORDER_MARK, rx + 210, 15, {
        cellSize: 82,
        gap: 7,
        fontSize: 28,
        highlightCells: sl > 0.2 ? [[0, 0]] : null,
        opacity: rOp,
      }),
      // Measurement & reproducibility strip (floating text, zero boxes!)
      txt(
        'MEASURE BOTH:  Slice Accuracy  ·  Inference Latency',
        rx,
        225,
        28,
        ROLE.pos,
        'mono',
      ).opacity(rOp),
      txt(
        'LOG EXACT SETTINGS:  Resize  ·  Padding  ·  Pooling',
        rx,
        290,
        26,
        ROLE.kernel,
        'mono',
      ).opacity(rOp),
      txt(
        b2 > 0.2
          ? 'Test both models on the exact same held-out defect slices'
          : 'Recipe, distillation & modern conv design all close the gap',
        0,
        380,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'architecture-choice-b1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'architecture-choice-b2', b2P, 1, { dur: 0.7 });
  cueTo(s, c, 'inspect-slices', slP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 25. transfer: Predict what reversing the edge will do
// Cues: reverse-prediction, reverse-edge, reverse-result*, apply-relu
// ---------------------------------------------------------------------------
export function transfer(s, c) {
  const predP = s.value(0);
  const revP = s.value(0);
  const resP = s.value(0);
  const reluP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.neg, seed: 25 }));
  s.add(decorAura(-450, 40, 480, '#ffd1661a', '#07091000'));
  s.add(decorAura(450, 40, 480, '#ff6b8b1a', '#07091000'));

  const headline = heroTitle(['Reversing the Edge', '& ReLU Rectification'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.neg,
    eyebrow: 'FIXED KERNEL [-1, 0, +1]  ·  SWAP DARK AND BRIGHT',
  });

  const INV_IMAGE = IMAGE.map((r) => r.map((v) => 1 - v));
  const INV_MAP = correlate(INV_IMAGE, KERNEL); // [[-3, -3, 0], ...]
  const RELU_MAP = INV_MAP.map((r) => r.map((v) => Math.max(0, v))); // all 0s

  const live = dynamic(() => {
    const pr = predP.value;
    const rv = revP.value;
    const rs = resP.value;
    const rl = reluP.value;
    const nodes = [];

    // Smoothly invert pixel brightness when reverse-edge fires!
    const curImg = IMAGE.map((row) => row.map((v) => mix(v, 1 - v, rv)));

    // Left: 5x5 panel flipping dark <-> bright
    const inX = -565;
    const inY = 35;
    nodes.push(
      txt(
        rv > 0.5 ? 'REVERSED PANEL (BRIGHT -> DARK)' : 'OPENING 5x5 PANEL',
        inX,
        -210,
        28,
        rv > 0.5 ? ROLE.neg : ROLE.input,
        'mono',
      ),
      matrixGrid(curImg, inX, inY, {
        cellSize: 80,
        gap: 7,
        fontSize: 30,
        formatter: (v) => (v > 0.5 ? '1' : '0'),
      }),
    );

    // Middle: Fixed signed kernel (never flips!)
    const kX = -45;
    const kY = 35;
    nodes.push(
      txt('FIXED WEIGHTS', kX, -210, 28, ROLE.kernel, 'mono'),
      matrixGrid(KERNEL, kX, kY, {
        cellSize: 78,
        gap: 7,
        fontSize: 30,
        kind: 'kernel',
      }),
      txt('left -1  ·  right +1', kX, 225, 26, COSMOS.muted, 'mono'),
    );

    // Right: 3x3 Feature Map (shows MAP -> '?' during prediction -> INV_MAP after reverse-result -> RELU_MAP after apply-relu!)
    const mX = 505;
    const mY = 35;
    let displayMap = MAP;
    let hideVals = false;
    let mapTitle = 'ORIGINAL 3x3 MAP';
    let mapCol = ROLE.pos;

    if (rl > 0.35) {
      displayMap = RELU_MAP;
      mapTitle = 'AFTER RELU: max(0, x)';
      mapCol = ROLE.pos;
    } else if (rs > 0.2) {
      displayMap = INV_MAP;
      mapTitle = 'REVERSED RESPONSE MAP';
      mapCol = ROLE.neg;
    } else if (pr > 0.15 || rv > 0.1) {
      displayMap = INV_MAP;
      hideVals = true;
      mapTitle = 'PREDICT THE SIGN  ?';
      mapCol = ROLE.window;
    }

    nodes.push(
      txt(mapTitle, mX, -210, 28, mapCol, 'mono'),
      matrixGrid(displayMap, mX, mY, {
        cellSize: 108,
        gap: 10,
        fontSize: 38,
        kind: 'gradient',
        visibleMask: () => !hideVals,
      }),
      txt(
        rl > 0.35
          ? 'ReLU zeroes all -3 responses: reversed edge disappears!'
          : rs > 0.2
            ? 'Left subtracts 3, right adds 0 -> boundary responses become -3'
            : pr > 0.15
              ? 'Swap dark and bright everywhere. What sign will the edge give?'
              : 'Dark-to-bright edge gave +3; uniformly bright gave 0',
        0,
        345,
        31,
        rl > 0.35 ? ROLE.pos : rs > 0.2 ? ROLE.neg : ROLE.window,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'reverse-prediction', predP, 1, { dur: 0.6 });
  cueTo(s, c, 'reverse-edge', revP, 1, { dur: 0.85 });
  cueTo(s, c, 'reverse-result', resP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'apply-relu', reluP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 26. earned-cnn-transfer: Which window gets the gradient? (GRAND FINALE)
// Cues: fresh-start, fresh-pixel, fresh-footprint* (cb), fresh-delta, fresh-map,
//       fresh-other-values* (cb), fresh-owner* (cb), fresh-logits* (cb),
//       fresh-send, fresh-gradient* (cb), repeat-reset, repeat-pixel,
//       repeat-delta, repeat-map, repeat-other-values* (cb), repeat-owner* (cb),
//       repeat-head, repeat-gradient* (cb)
// ---------------------------------------------------------------------------
export function earnedCnnTransfer(s, c) {
  const fStartP = s.value(0);
  const fPixP = s.value(0);
  const fFootP = s.value(0);
  const fDelP = s.value(0);
  const fMapP = s.value(0);
  const fOthP = s.value(0);
  const fOwnP = s.value(0);
  const fLogP = s.value(0);
  const fSndP = s.value(0);
  const fGrdP = s.value(0);

  const rRstP = s.value(0);
  const rPixP = s.value(0);
  const rDelP = s.value(0);
  const rMapP = s.value(0);
  const rOthP = s.value(0);
  const rOwnP = s.value(0);
  const rHdP = s.value(0);
  const rGrdP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.window, seed: 26 }));
  s.add(decorAura(-450, 40, 480, '#ffd1661c', '#07091000'));
  s.add(decorAura(450, 40, 480, '#ff6b8b1a', '#07091000'));

  const headline = heroTitle(['Trace One Pixel Edit', 'All the Way to the Gradient'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.window,
    eyebrow: '4x4 PANEL CROP  ·  CORNER PIXEL SENSITIVITY  ·  BACKWARD MAXPOOL ROUTE',
  });

  const base = cropForward(0.05);
  const pass1 = cropForward(0.01); // UL = 0.876 > BR = 0.874 -> winner (0,0), logits [1.0264, -0.6884]
  const pass2 = cropForward(0.02); // UL = 0.870 < BR = 0.874 -> winner (1,1), logits [1.0236, -0.6866]

  const live = dynamic(() => {
    const isPass2 = rRstP.value > 0.35;
    const nodes = [];

    // Determine exact corner pixel value for current state
    let cornerVal = 0.05;
    if (!isPass2) {
      cornerVal = mix(0.05, 0.01, fPixP.value);
    } else {
      cornerVal = mix(0.05, 0.02, rPixP.value);
    }
    const curImg = ARTICLE_CROP.map((r) => [...r]);
    curImg[0][0] = Number(cornerVal.toFixed(2));

    // TOP STRIP: Magnified Precision Race Ruler from 0.845 to 0.885!
    const rX0 = -700;
    const rX1 = 700;
    const rY = -225;
    const xOf = (val) => mix(rX0, rX1, (val - 0.845) / 0.04);
    const brVal = 0.874;
    const ulVal = !isPass2 ? mix(0.852, 0.876, fMapP.value) : mix(0.852, 0.87, rMapP.value);

    const showRaceShift = !isPass2 ? fMapP.value > 0.05 : rMapP.value > 0.05;

    nodes.push(
      txt('0.845', rX0 - 20, rY, 26, COSMOS.dim, 'mono', 'right'),
      txt('0.885', rX1 + 20, rY, 26, COSMOS.dim, 'mono', 'left'),
      rule(rX0, rY, rX1, rY, '#3a4e7a', 4),
      ...[0.85, 0.86, 0.87, 0.88].map((tick) => {
        const tx = xOf(tick);
        return line([tx, rY - 10], [tx, rY + 10], { stroke: '#4d6598', width: 2.5 });
      }),
      // Bottom-right (1,1) anchor marker ABOVE the ruler (zero overlap with UL!)
      glowDot(xOf(brVal), rY, { radius: 12, color: ROLE.pos, glow: 12 }),
      txt('BR 0.874', xOf(brVal), rY - 46, 26, ROLE.pos, 'mono'),
      // Upper-left (0,0) gliding marker BELOW the ruler (zero overlap with BR!)
      glowDot(xOf(ulVal), rY, {
        radius: 12,
        color: ROLE.window,
        glow: 13,
      }),
      txt(`UL ${ulVal.toFixed(3)}`, xOf(ulVal), rY + 46, 26, ROLE.window, 'mono'),
    );

    // LEFT: 4x4 Panel Crop with corner (0,0) glowing & upper-left 3x3 window footprint
    const cX = -610;
    const cY = 85;
    const cSz = 82;
    const cGap = 7;
    const showULWindow = !isPass2 ? fFootP.value > 0.2 : rDelP.value > 0.2;

    nodes.push(
      txt(
        !isPass2
          ? fPixP.value > 0.3
            ? 'CORNER: 0.05 -> 0.01'
            : '4x4 PANEL CROP'
          : rPixP.value > 0.3
            ? 'CORNER: 0.05 -> 0.02'
            : 'RESET TO ORIGINAL 0.05',
        cX,
        -115,
        26,
        ROLE.window,
        'mono',
      ),
      matrixGrid(curImg, cX, cY, {
        cellSize: cSz,
        gap: cGap,
        fontSize: 26,
        digits: 2,
        highlightCells: [[0, 0]],
      }),
      showULWindow
        ? windowBox(cX, cY, 4, 4, 0, 0, 3, 3, {
            cellSize: cSz,
            gap: cGap,
            color: ROLE.window,
            width: 4.5,
            glow: 12,
          })
        : group(),
    );

    // CENTER: 2x2 Feature Map (withheld cleanly before cues & caption_boundary gates!)
    const mX = -65;
    const mY = 65;
    const targetRaw = !isPass2 ? pass1.raw : pass2.raw;
    const ulReady = !isPass2 ? fMapP.value > 0.85 : rMapP.value > 0.85;
    const othReady = !isPass2 ? fOthP.value > 0.2 : rOthP.value > 0.2;
    const ownReady = !isPass2 ? fOwnP.value > 0.2 : rOwnP.value > 0.2;
    const waitingPred = !isPass2 ? fPixP.value > 0.2 && !ulReady : rPixP.value > 0.2 && !ulReady;

    const mapVisibleMask = (r, col) => {
      if (waitingPred) return false;
      if (r === 0 && col === 0)
        return ulReady || (!isPass2 && fPixP.value < 0.2) || (isPass2 && rPixP.value < 0.2);
      return othReady || (!isPass2 && fPixP.value < 0.2) || (isPass2 && rPixP.value < 0.2);
    };
    const displayRaw =
      (!isPass2 && fPixP.value < 0.2) || (isPass2 && rPixP.value < 0.2) ? base.raw : targetRaw;

    const hiMap = ownReady ? (!isPass2 ? [[0, 0]] : [[1, 1]]) : null;

    nodes.push(
      txt(
        waitingPred
          ? 'NEW 2x2 MAP (PREDICT!)'
          : ownReady
            ? !isPass2
              ? 'WINNER: UPPER LEFT (0,0)'
              : 'WINNER: BOTTOM RIGHT (1,1)'
            : '2x2 RESPONSE MAP',
        mX,
        -115,
        26,
        ownReady ? ROLE.pos : ROLE.kernel,
        'mono',
      ),
      matrixGrid(displayRaw, mX, mY, {
        cellSize: 118,
        gap: 10,
        fontSize: 30,
        digits: 3,
        kind: 'feature',
        visibleMask: mapVisibleMask,
        highlightCells: hiMap,
      }),
      txt(
        !isPass2
          ? fDelP.value > 0.2
            ? '(-0.04)(-0.6) = +0.024'
            : fStartP.value > 0.2
              ? 'BR leads UL by +0.022'
              : 'w[0,0] = -0.6'
          : rDelP.value > 0.2
            ? '(-0.03)(-0.6) = +0.018'
            : 'BR leads UL by +0.022',
        mX,
        235,
        28,
        ROLE.kernel,
        'mono',
      ),
    );

    // RIGHT: Two-Class Logits + Backward Gradient (-2) Route Destination!
    const hX = 520;
    const showPass1Logits = !isPass2 && fLogP.value > 0.2;
    const showPass2Logits = isPass2 && rHdP.value > 0.2;
    const curLogits = showPass1Logits
      ? pass1.logits
      : showPass2Logits || (isPass2 && rPixP.value < 0.2) || (!isPass2 && fPixP.value < 0.2)
        ? base.logits
        : null;

    const gradReady = !isPass2 ? fGrdP.value > 0.2 : rGrdP.value > 0.2;
    const gradMatrix = [
      [gradReady && !isPass2 ? -2 : 0, 0],
      [0, gradReady && isPass2 ? -2 : 0],
    ];

    nodes.push(
      txt('2-CLASS LOGITS', hX, -115, 26, ROLE.channel, 'mono'),
      numCell(
        curLogits ? `${curLogits[0].toFixed(4)}   ${curLogits[1].toFixed(4)}` : '?       ?',
        hX,
        -45,
        {
          w: 390,
          h: 68,
          size: 30,
          stroke: curLogits ? ROLE.pos : '#2d3f68',
          textColor: curLogits ? ROLE.pos : COSMOS.dim,
          glow: curLogits ? 8 : 0,
        },
      ),
      txt(
        gradReady
          ? !isPass2
            ? 'BACKWARD -2 -> (0, 0)'
            : 'BACKWARD -2 -> (1, 1)'
          : !isPass2 && fSndP.value > 0.2
            ? 'SENDING -2 THROUGH MAXPOOL...'
            : 'BACKWARD GRADIENT (-2)',
        hX,
        45,
        26,
        ROLE.neg,
        'mono',
      ),
      matrixGrid(gradMatrix, hX, 175, {
        cellSize: 92,
        gap: 10,
        fontSize: 32,
        digits: 0,
        kind: 'gradient',
        visibleMask: () => gradReady,
        highlightCells: gradReady ? (!isPass2 ? [[0, 0]] : [[1, 1]]) : null,
      }),
    );

    // Bottom synced summary caption (strictly A8 & prediction-safe!)
    let cap = 'Compare top two responses: bottom-right 0.874 leads upper-left 0.852 by 0.022';
    let capCol = COSMOS.ink;
    if (!isPass2) {
      if (fGrdP.value > 0.2) {
        cap = 'Pass 1 winner flipped to (0, 0), so backward -2 routes to upper left!';
        capCol = ROLE.neg;
      } else if (fLogP.value > 0.2) {
        cap = 'New max 0.876 nudges logits to [1.0264, -0.6884]';
        capCol = ROLE.pos;
      } else if (fOwnP.value > 0.2) {
        cap = 'Upper left reaches 0.876 and overtakes 0.874 by +0.002!';
        capCol = ROLE.pos;
      } else if (fOthP.value > 0.2) {
        cap = 'Other three windows miss corner (0, 0), so 0.789, 0.817, 0.874 stay unchanged';
        capCol = ROLE.kernel;
      } else if (fMapP.value > 0.85) {
        cap = 'Upper-left reaches 0.876 along the scale';
        capCol = ROLE.window;
      } else if (fDelP.value > 0.2) {
        cap = 'Corner -0.04 -> +0.024 gain';
        capCol = ROLE.window;
      } else if (fFootP.value > 0.2) {
        cap = 'Only upper-left 3x3 touches corner (0,0)';
        capCol = ROLE.window;
      } else if (fPixP.value > 0.2) {
        cap = 'Corner dimmed 0.05 -> 0.01. Which window feels it? Can it catch 0.874?';
        capCol = ROLE.window;
      }
    } else {
      if (rGrdP.value > 0.2) {
        cap = 'Bottom right stays winner (0.874 > 0.870): backward -2 routes to (1, 1)!';
        capCol = ROLE.neg;
      } else if (rOwnP.value > 0.2) {
        cap = '0.870 falls short of 0.874: bottom right holds lead and logits stay unchanged';
        capCol = ROLE.pos;
      } else if (rMapP.value > 0.85) {
        cap = 'Upper-left gains +0.018 and stops at 0.870';
        capCol = ROLE.window;
      } else if (rDelP.value > 0.2) {
        cap = 'Corner -0.03 -> +0.018 gain';
        capCol = ROLE.window;
      } else if (rPixP.value > 0.2) {
        cap = 'New exposure: corner 0.05 -> 0.02. Where does backward -2 go this time?';
        capCol = ROLE.window;
      } else {
        cap = 'Reset to original crop (0.05) before testing the second exposure';
        capCol = ROLE.kernel;
      }
    }

    nodes.push(txt(cap, 0, 375, 29, capCol, 'serif'));
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);

  // Pass 1 cues (ALL caption_boundary: true cues gated with { after: true }!)
  cueTo(s, c, 'fresh-start', fStartP, 1, { dur: 0.55 });
  cueTo(s, c, 'fresh-pixel', fPixP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-footprint', fFootP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'fresh-delta', fDelP, 1, { dur: 0.5 });
  cueTo(s, c, 'fresh-map', fMapP, 1, { dur: 1.0 });
  cueTo(s, c, 'fresh-other-values', fOthP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'fresh-owner', fOwnP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'fresh-logits', fLogP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'fresh-send', fSndP, 1, { dur: 0.5 });
  cueTo(s, c, 'fresh-gradient', fGrdP, 1, { after: true, dur: 0.45 });

  // Pass 2 cues (ALL caption_boundary: true cues gated with { after: true }!)
  cueTo(s, c, 'repeat-reset', rRstP, 1, { dur: 0.55 });
  cueTo(s, c, 'repeat-pixel', rPixP, 1, { dur: 0.65 });
  cueTo(s, c, 'repeat-delta', rDelP, 1, { dur: 0.5 });
  cueTo(s, c, 'repeat-map', rMapP, 1, { dur: 1.0 });
  cueTo(s, c, 'repeat-other-values', rOthP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'repeat-owner', rOwnP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'repeat-head', rHdP, 1, { dur: 0.5 });
  cueTo(s, c, 'repeat-gradient', rGrdP, 1, { after: true, dur: 0.45 });
}
