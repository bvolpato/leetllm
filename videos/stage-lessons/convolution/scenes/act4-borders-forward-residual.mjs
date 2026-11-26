// Act 4 (Scenes 18-22): Border Participation Counts, Zero vs. Reflection Padding Artifact,
// Complete CNN Forward Pass, ResNet Residual Block & BatchNorm, 3D Identity Gradient Manifold.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  ARTICLE_CROP,
  COSMOS,
  ROLE,
  cellPos,
  cinemaGrid,
  cinematic3d,
  clamp01,
  correlate,
  cropForward,
  cueTo,
  curve3d,
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
  orbitScene,
  paddedUniform,
  point3d,
  residualSlice,
  rule,
  scaleTrack,
  scanSnapshot,
  signalParticipation,
  surface,
  txt,
  windowBox,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 18. border-counts: A boundary pixel belongs to fewer valid windows
// Cues: border-counts-b1, corner-count*, center-count*, border-counts-b2,
//       padded-corner*, small-crop-count, border-counts-b3
// ---------------------------------------------------------------------------
export function borderCounts(s, c) {
  const b1P = s.value(0);
  const corP = s.value(0);
  const ctrP = s.value(0);
  const b2P = s.value(0);
  const padP = s.value(0);
  const smP = s.value(0);
  const b3P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 18 }));
  s.add(decorAura(-440, 40, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(440, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Border Evidence:', 'Valid Window Participation'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: 'ALL-ONES 3x3 KERNEL  ·  UNIT IMPULSE SIGNAL',
  });

  const ones3 = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ];
  const cornerValid = signalParticipation(5, 0, 0, 0);
  const centerValid = signalParticipation(5, 2, 2, 0);
  const cornerPadded = signalParticipation(5, 0, 0, 1);

  const live = dynamic(() => {
    const isPadded = b2P.value > 0.25;
    const isCenter = !isPadded && ctrP.value > 0.2;
    const snap = isPadded ? cornerPadded : isCenter ? centerValid : cornerValid;
    const nodes = [];

    const inX = -465;
    const inY = 35;
    const outX = 435;
    const outY = 10;

    if (isPadded) {
      const paddedGrid = scanSnapshot(snap.image, ones3, 1, { padding: 1 }).input;
      nodes.push(
        txt('7x7 PADDED (CORNER AT 1,1)', inX, -245, 26, ROLE.kernel, 'mono'),
        matrixGrid(paddedGrid, inX, inY + 28, {
          cellSize: 64,
          gap: 6,
          fontSize: 26,
          padded: true,
          paddingOpacity: mix(0.2, 1, b2P.value),
          highlightCells: [[1, 1]],
        }),
        windowBox(inX, inY + 28, 7, 7, 0, 0, 3, 3, {
          cellSize: 64,
          gap: 6,
          color: ROLE.window,
          width: 4,
          glow: 10,
        }),
      );
      if (b3P.value > 0.2) {
        nodes.push(
          windowBox(inX, inY + 28, 7, 7, 0, 1, 3, 3, {
            cellSize: 64,
            gap: 6,
            color: ROLE.neg,
            width: 3,
            glow: 7,
            fill: null,
            opacity: b3P.value,
          }),
        );
      }
      nodes.push(
        txt('5x5 RESPONSE MAP', outX, -225, 28, ROLE.pos, 'mono'),
        matrixGrid(snap.result, outX, outY, {
          cellSize: 70,
          gap: 7,
          fontSize: 28,
          kind: 'feature',
          revealCount: padP.value > 0.15 ? 25 : 4,
        }),
        txt(
          padP.value > 0.15 ? 'Window visits = 4' : 'Window visits = ?',
          outX,
          265,
          44,
          padP.value > 0.15 ? ROLE.pos : COSMOS.dim,
          'mono',
        ).glow(padP.value > 0.15 ? 10 : 0, ROLE.pos),
      );
    } else {
      const hiCell = isCenter ? [[2, 2]] : [[0, 0]];
      const showCount = isCenter ? ctrP.value > 0.2 : corP.value > 0.2;
      nodes.push(
        txt(
          isCenter ? '5x5 INPUT (CENTER SIGNAL)' : '5x5 INPUT (CORNER SIGNAL)',
          inX,
          -210,
          28,
          ROLE.input,
          'mono',
        ),
        matrixGrid(snap.image, inX, inY, {
          cellSize: 82,
          gap: 8,
          fontSize: 30,
          highlightCells: hiCell,
        }),
        txt('3x3 VALID RESPONSE MAP', outX, -210, 28, ROLE.pos, 'mono'),
        matrixGrid(snap.result, outX, outY, {
          cellSize: 108,
          gap: 10,
          fontSize: 36,
          kind: 'feature',
          revealCount: showCount ? 9 : 0,
        }),
        txt(
          showCount ? `Window visits = ${snap.count}` : 'Window visits = ?',
          outX,
          265,
          46,
          showCount ? ROLE.pos : COSMOS.dim,
          'mono',
        ).glow(showCount ? 10 : 0, ROLE.pos),
      );
    }

    // Bottom caption synchronized strictly to live state (A8)
    let caption = 'Count valid 3x3 windows covering the unit impulse';
    let capCol = ROLE.kernel;
    if (b3P.value > 0.2) {
      caption = 'Padding lifts corner visits to 4, but windows now read synthetic border cells';
      capCol = ROLE.neg;
    } else if (smP.value > 0.2) {
      caption =
        'On our smaller 4x4 crop (2x2 starts), even central pixels belong to at most 4 windows';
      capCol = ROLE.window;
    } else if (isPadded && padP.value > 0.15) {
      caption = 'Adding 1 zero border lifts corner participation from 1 window to 4';
      capCol = ROLE.pos;
    } else if (isCenter) {
      caption = 'Center pixel participates in all 9 valid 3x3 windows (9x stronger weight!)';
      capCol = ROLE.pos;
    } else if (corP.value > 0.2) {
      caption = 'Corner pixel participates in only 1 valid 3x3 window';
      capCol = ROLE.window;
    }

    nodes.push(txt(caption, 0, 365, 29, capCol, 'serif'));
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'border-counts-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'corner-count', corP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'center-count', ctrP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'border-counts-b2', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'padded-corner', padP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'small-crop-count', smP, 1, { dur: 0.6 });
  cueTo(s, c, 'border-counts-b3', b3P, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 19. padding-artifact: Where did the edge on a gray panel come from?
// Cues: padding-artifact-b1, false-edge*, padding-artifact-b2, reflect-padding,
//       reflect-result*, padding-artifact-b3, stripe-zero*, stripe-reflect, stripe-result*
// ---------------------------------------------------------------------------
export function paddingArtifact(s, c) {
  const b1P = s.value(0);
  const falseP = s.value(0);
  const b2P = s.value(0);
  const refP = s.value(0);
  const refResP = s.value(0);
  const b3P = s.value(0);
  const sZeroP = s.value(0);
  const sRefP = s.value(0);
  const sResP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.neg, seed: 19 }));
  s.add(decorAura(-440, 40, 480, '#ff6b8b1c', '#07091000'));
  s.add(decorAura(440, 40, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Padding Artifacts:', 'Zero vs. Reflection'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.neg,
    eyebrow: 'UNIFORM 0.6 GRAY PANEL  ·  VERTICAL GRADIENT KERNEL',
  });

  const zeroSurf = paddedUniform('zero', 0.6);
  const reflSurf = paddedUniform('reflect', 0.6);

  const live = dynamic(() => {
    const b3 = b3P.value;
    const nodes = [];

    // View 0 (Beats 0-1): 7x7 uniform 0.6 panel (zero -> reflect) + 3x3 kernel + 5x5 response map
    const v0 = fadeOut(b3);
    if (v0 > 0.02) {
      const isReflect = refP.value > 0.35;
      const surf = isReflect ? reflSurf : zeroSurf;
      const winR = isReflect ? 0 : Math.round(mix(2, 0, b1P.value));
      const showAns = isReflect ? refResP.value > 0.08 : falseP.value > 0.08;

      const pX = -565;
      const pY = 45;
      const kX = -45;
      const kY = 15;
      const mX = 505;
      const mY = 35;

      nodes.push(
        group(
          txt(
            isReflect ? '7x7 REFLECTION PADDED' : '7x7 ZERO PADDED (0.6 GRAY)',
            pX,
            -225,
            26,
            isReflect ? ROLE.pos : ROLE.neg,
            'mono',
          ),
          matrixGrid(surf.padded, pX, pY, {
            cellSize: 64,
            gap: 5,
            fontSize: 26,
            digits: 1,
            padded: true,
          }),
          windowBox(pX, pY, 7, 7, winR, 2, 3, 3, {
            cellSize: 64,
            gap: 5,
            color: ROLE.window,
            width: 4.5,
            glow: 11,
          }),
          txt('EDGE KERNEL', kX, -225, 26, ROLE.kernel, 'mono'),
          matrixGrid(surf.kernel, kX, kY, {
            cellSize: 78,
            gap: 7,
            fontSize: 30,
            kind: 'kernel',
          }),
          txt(
            showAns ? (isReflect ? '1.8 - 1.8 = 0' : '0 - 1.8 = -1.8') : 'top - bottom',
            kX,
            210,
            32,
            showAns ? (isReflect ? ROLE.pos : ROLE.neg) : COSMOS.muted,
            'mono',
          ),
          txt('5x5 RESPONSE MAP', mX, -225, 26, isReflect ? ROLE.pos : ROLE.neg, 'mono'),
          matrixGrid(surf.result, mX, mY, {
            cellSize: 70,
            gap: 6,
            fontSize: 26,
            digits: 1,
            kind: 'gradient',
            revealCount: showAns ? 25 : 0,
          }),
          txt(
            showAns
              ? `max |r| = ${surf.maxAbs.toFixed(1)}`
              : b2P.value > 0.2
                ? 'Switching to reflection...'
                : 'Slide window to border...',
            mX,
            290,
            34,
            showAns ? (isReflect ? ROLE.pos : ROLE.neg) : ROLE.window,
            'mono',
          ).glow(showAns ? 10 : 0, isReflect ? ROLE.pos : ROLE.neg),
        ).opacity(v0),
      );
    }

    // View 1 (Beat 2): Bright 1.0 stripe one row inside panel -> side-by-side 3x3 top-window closeups
    const v1 = fadeIn(b3);
    if (v1 > 0.02) {
      const lx = -435;
      const rx = 435;
      const py = 15;
      const sz = 104;
      const gap = 8;
      const zeroPatch = [
        [0, 0, 0],
        [0.6, 0.6, 0.6],
        [1, 1, 1],
      ];
      const copied = sRefP.value > 0.35;
      const reflPatch = [copied ? [1, 1, 1] : ['?', '?', '?'], [0.6, 0.6, 0.6], [1, 1, 1]];

      nodes.push(
        group(
          txt('ZERO PADDING TOP WINDOW', lx, -210, 28, ROLE.neg, 'mono'),
          matrixGrid(zeroPatch, lx, py, { cellSize: sz, gap, fontSize: 32, digits: 1 }),
          windowBox(lx, py, 3, 3, 0, 0, 1, 3, {
            cellSize: sz,
            gap,
            color: ROLE.kernel,
            width: 3.5,
            glow: 8,
            fill: null,
          }),
          windowBox(lx, py, 3, 3, 2, 0, 1, 3, {
            cellSize: sz,
            gap,
            color: ROLE.window,
            width: 3.5,
            glow: 8,
            fill: null,
          }),
          txt(
            sZeroP.value > 0.2 ? '0 - 3.0 = -3.0  (edge stays)' : 'top row stays 0',
            lx,
            245,
            34,
            ROLE.neg,
            'mono',
          ),
          // Center row labels aligned cleanly between the two 3x3 grids
          txt('Added row', 0, py - 112, 28, ROLE.kernel, 'mono'),
          txt('Panel edge', 0, py, 28, COSMOS.ink, 'mono'),
          txt('Bright stripe', 0, py + 112, 28, ROLE.window, 'mono'),
          txt('REFLECTION TOP WINDOW', rx, -210, 28, ROLE.kernel, 'mono'),
          matrixGrid(reflPatch, rx, py, { cellSize: sz, gap, fontSize: 32, digits: 1 }),
          windowBox(rx, py, 3, 3, 0, 0, 1, 3, {
            cellSize: sz,
            gap,
            color: ROLE.kernel,
            width: 3.5,
            glow: 8,
            fill: null,
          }),
          windowBox(rx, py, 3, 3, 2, 0, 1, 3, {
            cellSize: sz,
            gap,
            color: ROLE.window,
            width: 3.5,
            glow: 8,
            fill: null,
          }),
          // Mirror arrow curling up on right side of Reflection grid
          sRefP.value > 0.1
            ? group(
                line([rx + 180, py + 112], [rx + 235, py + 112], {
                  stroke: ROLE.kernel,
                  width: 3.5,
                }),
                line([rx + 235, py + 112], [rx + 235, py - 112], {
                  stroke: ROLE.kernel,
                  width: 3.5,
                }).glow(8, ROLE.kernel),
                arrow([rx + 235, py - 112], [rx + 185, py - 112], {
                  stroke: ROLE.kernel,
                  width: 3.5,
                  headSize: 14,
                }),
              ).opacity(sRefP.value)
            : group(),
          txt(
            sResP.value > 0.2 ? '3.0 - 3.0 = 0  (rows cancel!)' : 'copies stripe to border',
            rx,
            245,
            34,
            sResP.value > 0.2 ? ROLE.pos : ROLE.kernel,
            'mono',
          ),
          txt(
            'Match training and inference padding; trace which pixels came from camera vs border',
            0,
            355,
            28,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(v1),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'padding-artifact-b1', b1P, 1, { dur: 1.0 });
  cueTo(s, c, 'false-edge', falseP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'padding-artifact-b2', b2P, 1, { dur: 0.55 });
  cueTo(s, c, 'reflect-padding', refP, 1, { dur: 0.7 });
  cueTo(s, c, 'reflect-result', refResP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'padding-artifact-b3', b3P, 1, { dur: 0.7 });
  cueTo(s, c, 'stripe-zero', sZeroP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'stripe-reflect', sRefP, 1, { dur: 0.75 });
  cueTo(s, c, 'stripe-result', sResP, 1, { after: true, dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 20. forward-pass: Which response sets both class scores?
// Cues: forward-pass-b1, crop-relu, crop-pool*, head-weights, head-first,
//       head-logits, forward-pass-b2, forward-pass-b3, forward-map-shape, forward-shapes
// ---------------------------------------------------------------------------
export function forwardPass(s, c) {
  const b1P = s.value(0);
  const reluP = s.value(0);
  const poolP = s.value(0);
  const hwP = s.value(0);
  const h1P = s.value(0);
  const h2P = s.value(0);
  const b2P = s.value(0);
  const b3P = s.value(0);
  const msP = s.value(0);
  const shP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 20 }));
  s.add(decorAura(-480, 40, 460, '#5ce1e61a', '#07091000'));
  s.add(decorAura(480, 40, 460, '#6ee7b71c', '#07091000'));

  const headline = heroTitle(['Inspectable CNN', 'Forward Pass & Shapes'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pos,
    eyebrow: 'CONV2D -> RELU -> MAXPOOL2D -> FLATTEN -> LINEAR(1, 2)',
  });

  const base = cropForward();

  const live = dynamic(() => {
    const nodes = [];
    const inX = -650;
    const mapX = -165;
    const poolX = 215;
    const headX = 655;
    const midY = 10;

    // 1. Input 4x4 crop
    nodes.push(
      txt('4x4 CROP', inX, -205, 28, ROLE.input, 'mono'),
      matrixGrid(ARTICLE_CROP, inX, midY, { cellSize: 78, gap: 6, fontSize: 26, digits: 2 }),
      txt(
        b3P.value > 0.2 ? '(1, 1, 4, 4)' : 'grayscale',
        inX,
        240,
        28,
        b3P.value > 0.2 ? ROLE.kernel : COSMOS.muted,
        'mono',
      ),
      arrow([inX + 185, midY], [mapX - 145, midY], {
        stroke: ROLE.kernel,
        width: 3.5,
        headSize: 15,
      }),
    );

    // 2. 2x2 Ridge Map + ReLU pass-through
    nodes.push(
      txt(
        reluP.value > 0.2 ? 'RELU (ALL > 0)' : '2x2 RIDGE MAP',
        mapX,
        -205,
        28,
        reluP.value > 0.2 ? ROLE.pos : ROLE.kernel,
        'mono',
      ),
      matrixGrid(base.activated, mapX, midY, {
        cellSize: 112,
        gap: 10,
        fontSize: 30,
        digits: 3,
        kind: 'feature',
        highlightCells: poolP.value > 0.2 ? [[1, 1]] : null,
      }).opacity(mix(0.65, 1, b1P.value)),
      txt(
        msP.value > 0.2
          ? '(1, 1, 2, 2)'
          : reluP.value > 0.2
            ? 'max(0, x) passes all 4'
            : '4 positive values',
        mapX,
        240,
        28,
        msP.value > 0.2 ? ROLE.kernel : ROLE.pos,
        'mono',
      ),
      arrow([mapX + 145, midY], [poolX - 95, midY], { stroke: ROLE.pos, width: 3.5, headSize: 15 }),
    );

    // 3. MaxPool 2x2 -> 1 scalar (withheld until crop-pool { after: true }!)
    nodes.push(
      txt('MAX POOL', poolX, -205, 28, ROLE.window, 'mono'),
      numCell(poolP.value > 0.2 ? '0.874' : '?', poolX, midY, {
        w: 156,
        h: 96,
        size: 38,
        stroke: poolP.value > 0.2 ? ROLE.pos : ROLE.window,
        textColor: poolP.value > 0.2 ? ROLE.pos : ROLE.window,
        glow: poolP.value > 0.2 ? 12 : 6,
      }),
      txt(
        shP.value > 0.2
          ? '(1, 1, 1, 1) -> (1, 1)'
          : poolP.value > 0.2
            ? 'saved (1, 1)'
            : 'which cell?',
        poolX,
        240,
        26,
        shP.value > 0.2 ? ROLE.kernel : ROLE.window,
        'mono',
      ),
    );

    // 4. Two opposite-signed Linear Head branches
    const yTop = -85;
    const yBot = 105;
    nodes.push(
      txt('2-CLASS LOGITS', headX, -205, 28, ROLE.channel, 'mono'),
      arrow([poolX + 86, midY - 14], [headX - 165, yTop], {
        stroke: ROLE.pos,
        width: 3.2,
        headSize: 14,
      }).opacity(mix(0.35, 1, hwP.value)),
      arrow([poolX + 86, midY + 14], [headX - 165, yBot], {
        stroke: ROLE.neg,
        width: 3.2,
        headSize: 14,
      }).opacity(mix(0.35, 1, hwP.value)),
      txt('x 1.4 - 0.2', 415, yTop - 42, 26, ROLE.pos, 'mono').opacity(mix(0.35, 1, h1P.value)),
      txt('x (-0.9) + 0.1', 415, yBot + 44, 26, ROLE.neg, 'mono').opacity(mix(0.35, 1, h2P.value)),
      numCell(h1P.value > 0.2 ? '1.024' : '?', headX, yTop, {
        w: 220,
        h: 82,
        size: 38,
        stroke: ROLE.pos,
        textColor: h1P.value > 0.2 ? ROLE.pos : COSMOS.dim,
        glow: h1P.value > 0.2 ? 10 : 0,
      }),
      numCell(h2P.value > 0.2 ? '-0.687' : '?', headX, yBot, {
        w: 220,
        h: 82,
        size: 38,
        stroke: ROLE.neg,
        textColor: h2P.value > 0.2 ? ROLE.neg : COSMOS.dim,
        glow: h2P.value > 0.2 ? 10 : 0,
      }),
      txt(
        shP.value > 0.2 ? '(1, 2) logits' : 'opposite signs',
        headX,
        240,
        28,
        shP.value > 0.2 ? ROLE.kernel : COSMOS.muted,
        'mono',
      ),
    );

    // Bottom synced status caption
    let cap = 'All four ridge responses pass ReLU. Which window sets both class scores?';
    let capCol = ROLE.window;
    if (shP.value > 0.2) {
      cap = 'Without ReLU, stacked affine layers stay affine; ReLU unlocks nonlinear composition';
      capCol = ROLE.kernel;
    } else if (b2P.value > 0.2) {
      cap = 'NumPy & PyTorch float32 agree within 1e-6 on CPU (verifies arithmetic)';
      capCol = ROLE.pos;
    } else if (h2P.value > 0.2) {
      cap = 'One pooled peak pushes class 0 up (+1.024) and class 1 down (-0.687)';
      capCol = COSMOS.ink;
    } else if (poolP.value > 0.2) {
      cap = 'Bottom-right (1, 1) wins with 0.874 and feeds both output branches';
      capCol = ROLE.pos;
    }

    nodes.push(txt(cap, 0, 355, 30, capCol, 'serif'));
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'forward-pass-b1', b1P, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-relu', reluP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-pool', poolP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'head-weights', hwP, 1, { dur: 0.55 });
  cueTo(s, c, 'head-first', h1P, 1, { dur: 0.55 });
  cueTo(s, c, 'head-logits', h2P, 1, { dur: 0.55 });
  cueTo(s, c, 'forward-pass-b2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'forward-pass-b3', b3P, 1, { dur: 0.55 });
  cueTo(s, c, 'forward-map-shape', msP, 1, { dur: 0.55 });
  cueTo(s, c, 'forward-shapes', shP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 21. residual-block: Add a learned change to an identity with matching shape
// Cues: residual-block-b1, residual-save, residual-block-b2, residual-convs,
//       residual-add, projection-shape, block-conv-0, block-bn-0, block-relu,
//       block-conv-1, block-bn-1, residual-block-b3, bn-owners, bn-state
// ---------------------------------------------------------------------------
export function residualBlock(s, c) {
  const b1P = s.value(0);
  const saveP = s.value(0);
  const b2P = s.value(0);
  const convsP = s.value(0);
  const c0P = s.value(0);
  const bn0P = s.value(0);
  const rl0P = s.value(0);
  const c1P = s.value(0);
  const bn1P = s.value(0);
  const addP = s.value(0);
  const projP = s.value(0);
  const b3P = s.value(0);
  const bnOwnP = s.value(0);
  const bnStP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 21 }));
  s.add(decorAura(0, -40, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['ResNet Basic Block:', 'y = F(x) + x'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pos,
    eyebrow: 'IDENTITY SHORTCUT HIGHWAY  ·  SHAPE (1, 16, 28, 28)',
  });

  const live = dynamic(() => {
    const nodes = [];
    const midY = 60;
    const skipY = -165;
    const xs = [-715, -455, -245, -45, 165, 385, 575, 765];
    const stationActive = [
      1,
      c0P.value,
      bn0P.value,
      rl0P.value,
      c1P.value,
      bn1P.value,
      addP.value,
      addP.value,
    ];
    const stationLabels = ['x', 'Conv 3x3', 'BN2d', 'ReLU', 'Conv 3x3', 'BN2d', '+', 'ReLU'];
    const stationSub = [
      '16x28x28',
      'p=1',
      '16 ch',
      'max(0,z)',
      'p=1',
      '16 ch',
      'F(x)+x',
      '16x28x28',
    ];

    // Top Identity Shortcut Highway arching cleanly from x to (+) adder
    const skipCol = projP.value > 0.25 && b3P.value < 0.2 ? ROLE.warm : ROLE.pos;
    const skipOp = mix(0.45, 1, saveP.value);
    nodes.push(
      line([xs[0], midY - 48], [xs[0], skipY], { stroke: skipCol, width: 4.2 }).opacity(skipOp),
      line([xs[0], skipY], [xs[6], skipY], { stroke: skipCol, width: 4.5 })
        .glow(10, skipCol)
        .opacity(skipOp),
      arrow([xs[6], skipY], [xs[6], midY - 52], {
        stroke: skipCol,
        width: 4.2,
        headSize: 16,
      }).opacity(skipOp),
      txt(
        projP.value > 0.25 && b3P.value < 0.2
          ? 'PROJECTION SHORTCUT (1x1 Conv)'
          : 'IDENTITY SHORTCUT  x   (1, 16, 28, 28)',
        (xs[0] + xs[6]) / 2,
        skipY - 36,
        28,
        skipCol,
        'mono',
      ).opacity(skipOp),
    );

    // Connecting arrows along main residual branch F(x)
    for (let i = 0; i < xs.length - 1; i += 1) {
      const aCol = stationActive[i + 1] > 0.2 ? ROLE.kernel : '#384b74';
      nodes.push(
        arrow(
          [xs[i] + (i === 0 || i === 6 ? 54 : 84), midY],
          [xs[i + 1] - (i === 5 ? 54 : 84), midY],
          {
            stroke: aCol,
            width: 3,
            headSize: 12,
          },
        ),
      );
    }

    // 8 pipeline stations
    xs.forEach((sx, i) => {
      const act =
        stationActive[i] > 0.2 || (i >= 1 && i <= 5 && convsP.value > 0.2 && c0P.value < 0.05);
      const isAdder = i === 6;
      const isBN = i === 2 || i === 5;
      const col = isAdder
        ? ROLE.pos
        : isBN && bnOwnP.value > 0.2
          ? ROLE.window
          : act
            ? ROLE.kernel
            : '#384b74';

      if (isAdder) {
        nodes.push(
          circle(44, { fill: '#0e2d24', stroke: col, width: 3.8 })
            .at(sx, midY)
            .glow(act ? 12 : 4, col),
          txt('+', sx, midY + 2, 46, col, 'mono'),
          txt(stationSub[i], sx, midY + 76, 26, col, 'mono'),
        );
      } else {
        const w = i === 0 ? 102 : 162;
        nodes.push(
          numCell(stationLabels[i], sx, midY, {
            w,
            h: 82,
            size: 28,
            stroke: col,
            textColor: act || i === 0 ? COSMOS.ink : COSMOS.muted,
            glow: act ? 10 : 0,
          }),
          txt(stationSub[i], sx, midY + 76, 26, act ? col : COSMOS.dim, 'mono'),
        );
      }
    });

    // Bottom region: BatchNorm2d statistics & mode contrast (Beat 2) or degradation equation (Beats 0-1)
    const showBN = fadeIn(b3P.value);
    const showEq = fadeOut(b3P.value);

    if (showEq > 0.02) {
      nodes.push(
        group(
          glowTex('\\mathbf{y} = \\text{ReLU}\\big(\\mathcal{F}(\\mathbf{x}) + \\mathbf{x}\\big)', {
            x: 0,
            y: 255,
            size: 42,
            color: ROLE.window,
          }),
          txt(
            b2P.value > 0.2
              ? 'Padding = 1 and 16 -> 16 channels keep F(x) and x identical in shape'
              : 'Deep plain nets degrade; residual branch learns the delta F(x)',
            0,
            355,
            29,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(showEq),
      );
    }

    if (showBN > 0.02) {
      nodes.push(
        group(
          txt('BATCHNORM2D PER-CHANNEL STATS', -450, 235, 28, ROLE.window, 'mono'),
          txt(
            'Mean & var across (N, H, W)  ·  learned gamma, beta',
            -450,
            295,
            28,
            COSMOS.ink,
            'sans',
          ),
          txt(
            bnStP.value > 0.2
              ? 'TRAIN -> updates running stats  |  EVAL -> reuses them'
              : 'Shape preserved: (1, 16, 28, 28)',
            420,
            265,
            28,
            bnStP.value > 0.2 ? ROLE.pos : ROLE.kernel,
            'mono',
          ),
          txt(
            'Every spatial coordinate in (1, 16, 28, 28) has 1 matching value on both paths',
            0,
            365,
            28,
            COSMOS.muted,
            'serif',
          ),
        ).opacity(showBN),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'residual-block-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'residual-save', saveP, 1, { dur: 0.7 });
  cueTo(s, c, 'residual-block-b2', b2P, 1, { dur: 0.55 });
  cueTo(s, c, 'residual-convs', convsP, 1, { dur: 0.5 });
  cueTo(s, c, 'block-conv-0', c0P, 1, { dur: 0.4 });
  cueTo(s, c, 'block-bn-0', bn0P, 1, { dur: 0.4 });
  cueTo(s, c, 'block-relu', rl0P, 1, { dur: 0.4 });
  cueTo(s, c, 'block-conv-1', c1P, 1, { dur: 0.4 });
  cueTo(s, c, 'block-bn-1', bn1P, 1, { dur: 0.4 });
  cueTo(s, c, 'residual-add', addP, 1, { dur: 0.55 });
  cueTo(s, c, 'projection-shape', projP, 1, { dur: 0.6 });
  cueTo(s, c, 'residual-block-b3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'bn-owners', bnOwnP, 1, { dur: 0.6 });
  cueTo(s, c, 'bn-state', bnStP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 22. identity-gradient: The direct gradient path can still cancel or be gated
//     (SIGNATURE 3D GRADIENT MANIFOLD)
// Cues: identity-gradient-b1, identity-sum*, identity-gradient-b2,
//       cancel-identity*, relu-gate, identity-gradient-b3
// ---------------------------------------------------------------------------
export function identityGradient(s, c) {
  const b1P = s.value(0);
  const sumP = s.value(0);
  const b2P = s.value(0);
  const cancelP = s.value(0);
  const gateP = s.value(0);
  const b3P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 22 }));
  s.add(decorAura(430, 30, 520, '#6ee7b71e', '#ff6b8b14'));

  // 3D orbiting gradient surface z = (slope + 1) * gate over slope in [-1.4, 0.8] and gate in [0, 1]
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 0.7],
  }).at(455, 40);

  const gradSurface = surface(
    (u, v) => {
      const sl = -1.4 + ((u + 2.4) / 4.8) * 2.2;
      const gt = (v + 2.4) / 4.8;
      return Math.max(-0.4, (sl + 1) * gt * 1.45);
    },
    {
      x: [-2.4, 2.4],
      y: [-2.4, 2.4],
      resolution: [26, 26],
      colors: ['#331024', '#5c1f3d', '#183254', '#2680a6', '#5ce1e6', '#6ee7b7'],
      mesh: '#8ef5d4',
      meshOpacity: 0.18,
      meshWidth: 0.55,
      opacity: 0.9,
    },
  );

  // Zero-gradient cancellation valley line along slope = -1
  const cancelU = -2.4 + ((-1 - -1.4) / 2.2) * 4.8;
  const zeroValley = curve3d((t) => [cancelU, -2.4 + t * 4.8, 0.08], 0, 1, {
    samples: 30,
    color: ROLE.neg,
    width: 4,
    glow: 9,
    blend: 'screen',
  });

  const livePt3d = point3d(
    () => {
      const sl = mix(0.2, -1.0, b2P.value);
      const gt = 1 - gateP.value;
      const u = -2.4 + ((sl - -1.4) / 2.2) * 4.8;
      const v = -2.4 + gt * 4.8;
      return [u, v, (sl + 1) * gt * 1.45 + 0.15];
    },
    { color: ROLE.window, radius: 11, glow: 14 },
  );

  view3d.add(gradSurface, zeroValley, livePt3d);

  const headline = heroTitle(['Residual Gradients:', 'Direct Path & Zero Traps'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pos,
    eyebrow: "dL/dx = dL/dy · (F'(x) + 1)  ·  UPSTREAM = 3.0",
  });

  const live = dynamic(() => {
    const b2 = b2P.value;
    const cn = cancelP.value;
    const gt = gateP.value;
    const b3 = b3P.value;
    const nodes = [];

    // Left column switches cleanly between gradient algebra (Beats 0-1) and depth landmarks (Beat 2)
    const vAlg = fadeOut(b3);
    const vHist = fadeIn(b3);

    if (vAlg > 0.02) {
      const isGateOff = gt > 0.35;
      const isCanceled = b2 > 0.5 && !isGateOff;
      const sl = isCanceled ? -1.0 : 0.2;
      const slice = residualSlice(sl, 3, isGateOff ? 0 : 1);
      const lx = -840;

      nodes.push(
        group(
          glowTex(
            "\\frac{\\partial \\mathcal{L}}{\\partial x} = \\frac{\\partial \\mathcal{L}}{\\partial y}\\,(F'(x) + 1)",
            {
              x: -495,
              y: -185,
              size: 38,
              color: ROLE.window,
            },
          ).opacity(mix(0.65, 1, b1P.value)),
          txt(
            `UPSTREAM dL/dy = 3.0   ·   RELU GATE = ${isGateOff ? '0 (OFF)' : '1 (OPEN)'}`,
            lx,
            -90,
            26,
            isGateOff ? ROLE.neg : ROLE.pos,
            'mono',
            'left',
          ),
          // Identity path readout
          txt('Identity path (+1):', lx, -15, 28, ROLE.pos, 'mono', 'left'),
          txt(
            isGateOff ? '0.0  (gated)' : '+3.0',
            lx + 365,
            -15,
            34,
            isGateOff ? ROLE.neg : ROLE.pos,
            'mono',
            'left',
          ),
          // Residual branch readout
          txt(
            `Branch slope (${sl.toFixed(1)}):`,
            lx,
            55,
            28,
            isCanceled ? ROLE.neg : ROLE.kernel,
            'mono',
            'left',
          ),
          txt(
            isGateOff ? '0.0  (gated)' : fmtSigned(slice.branch, 1),
            lx + 365,
            55,
            34,
            isCanceled || isGateOff ? ROLE.neg : ROLE.kernel,
            'mono',
            'left',
          ),
          rule(lx, 112, -135, 112, '#2d3f68', 2.5),
          // Total gradient (steady "TOTAL GRAD = 0.0" across cancel + gate so zero brief text flash!)
          txt(
            isGateOff || (isCanceled && cn > 0.1)
              ? 'TOTAL GRAD = 0.0'
              : isCanceled
                ? '3 x (-1 + 1) = ?'
                : sumP.value > 0.2
                  ? 'TOTAL GRAD = 3.6  (0.6 + 3.0)'
                  : '3 x (0.2 + 1.0) = ?',
            lx,
            188,
            38,
            isGateOff || isCanceled ? ROLE.neg : ROLE.pos,
            'mono',
            'left',
          ).glow(10, isGateOff || isCanceled ? ROLE.neg : ROLE.pos),
          txt(
            isGateOff || (isCanceled && cn > 0.1)
              ? 'Slope -1 cancels +1, or inactive ReLU gates both paths'
              : isCanceled
                ? 'With slope -1, add branch (-3) and identity (+3)'
                : 'Identity keeps gradient flowing even when branch slope is small',
            lx,
            285,
            27,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(vAlg),
      );
    }

    if (vHist > 0.02) {
      // Proportional depth towers: LeNet (5) -> AlexNet (8) -> ResNet-50 / 101 / 152
      const lx = -830;
      const items = [
        { name: 'LeNet-5 (docs)', depth: 5, w: 32, col: ROLE.input },
        { name: 'AlexNet (ImageNet)', depth: 8, w: 48, col: ROLE.kernel },
        { name: 'ResNet-50', depth: 50, w: 185, col: ROLE.pos },
        { name: 'ResNet-101', depth: 101, w: 365, col: ROLE.window },
        { name: 'ResNet-152', depth: 152, w: 545, col: ROLE.warm },
      ];
      nodes.push(
        group(
          txt('CONVOLUTIONAL DEPTH MILESTONES', lx, -205, 28, ROLE.window, 'mono', 'left'),
          ...items.map((it, i) => {
            const y = -115 + i * 96;
            return group(
              txt(it.name, lx, y - 34, 26, it.col, 'mono', 'left'),
              txt(`${it.depth} layers`, lx + 560, y - 34, 26, COSMOS.ink, 'mono', 'right'),
              scaleTrack(lx, y + 10, 560, 34, { radius: 8 }),
              glowBar(lx, y + 10, it.w, 34, it.col, { glow: 9 }),
            );
          }),
        ).opacity(vHist),
      );
    }

    nodes.push(txt("3D SURFACE: (F'(x) + 1) · gate", 455, 365, 26, COSMOS.muted, 'mono'));
    return group(...nodes);
  });

  s.add(view3d, headline, live);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'identity-gradient-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'identity-sum', sumP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'identity-gradient-b2', b2P, 1, { dur: 0.75 });
  cueTo(s, c, 'cancel-identity', cancelP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'relu-gate', gateP, 1, { dur: 0.75 });
  cueTo(s, c, 'identity-gradient-b3', b3P, 1, { dur: 0.7 });
}
