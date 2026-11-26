// Act 3 (Scenes 13-17): Receptive Field & Jump, Pooling Forward Winners & Ties,
// Pooling Backward Gradient Routing, Overlapping Pooling += Repair, 3D Global Average Pooling.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  GAP_FLATTEN_PARAMS,
  GAP_POOLED_PARAMS,
  OVERLAP_MAP,
  POOL_INCOMING,
  POOL_MAP,
  ROLE,
  beatTo,
  cellPos,
  cinemaGrid,
  cinematic3d,
  clamp01,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  fieldTrace,
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
  poolSnapshot,
  rule,
  scaleTrack,
  txt,
  windowBox,
  wireframeSlab3d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 13. field-jump: How many original pixels can one output see?
// Cues: field-three, field-neighbor, field-third, field-five*, field-pool,
//       field-six*, field-pooled-neighbor, field-pooled-jump, field-last,
//       field-ten*, field-growth, field-spacing, field-channels
// ---------------------------------------------------------------------------
export function fieldJump(s, c) {
  const f3P = s.value(0);
  const fNbP = s.value(0);
  const fThP = s.value(0);
  const f5P = s.value(0);
  const poolP = s.value(0);
  const f6P = s.value(0);
  const pNbP = s.value(0);
  const pJmpP = s.value(0);
  const lastP = s.value(0);
  const f10P = s.value(0);
  const grwP = s.value(0);
  const spcP = s.value(0);
  const chnP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 13 }));
  s.add(decorAura(-340, 20, 480, '#fb923c1a', '#07091000'));
  s.add(decorAura(440, 40, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Receptive Field', '& Effective Jump'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'HOW MANY ORIGINAL INPUT PIXELS CAN ONE ACTIVATION SEE?',
  });

  const trace = fieldTrace(); // fields 3, 5, 6, 10; jumps 1, 1, 2, 2; sizes 222, 220, 110, 108

  const live = dynamic(() => {
    const nodes = [];
    // Top: 12-pixel 1D input row showing live receptive-field brackets & center dots
    const nPx = 12;
    const cellW = 72;
    const gap = 8;
    const pitch = cellW + gap;
    const x0 = -((nPx - 1) * pitch) / 2;
    const rowY = -140;

    // Determine current active span in input pixels
    let spanLen = 3;
    let spanLabel = '3 px';
    if (f10P.value > 0.2) {
      spanLen = 10;
      spanLabel = '10 px  (6 + 2 + 2)';
    } else if (lastP.value > 0.2) {
      spanLen = 10;
      spanLabel = '3 pooled windows (jump = 2)';
    } else if (f6P.value > 0.2) {
      spanLen = 6;
      spanLabel = '6 px  (pool 2x2, stride 2)';
    } else if (f5P.value > 0.2) {
      spanLen = 5;
      spanLabel = '5 px  (3 + 1 + 1)';
    } else if (fThP.value > 0.15) {
      spanLen = 5;
      spanLabel = 'How many pixels together?  ?';
    }

    for (let i = 0; i < nPx; i += 1) {
      const px = x0 + i * pitch;
      const inSpan = i < spanLen;
      nodes.push(
        numCell(String(i + 1), px, rowY, {
          w: cellW,
          h: 64,
          fill: inSpan ? '#182b47' : '#0d1426',
          stroke: inSpan ? ROLE.warm : '#2b3b60',
          textColor: inSpan ? COSMOS.ink : COSMOS.dim,
          size: 26,
          glow: inSpan ? 5 : 0,
        }),
      );
    }

    // Helper for bracket spanning pixel indices [startIdx .. endIdx] inclusive at yPos
    const drawBracket = (iStart, iEnd, yPos, color, labelTxt = null, op = 1, sideLabel = false) => {
      if (op < 0.03) return group();
      const bx0 = x0 + iStart * pitch - cellW / 2 + 4;
      const bx1 = x0 + iEnd * pitch + cellW / 2 - 4;
      const mid = (bx0 + bx1) / 2;
      const parts = [
        line([bx0, yPos - 10], [bx0, yPos], { stroke: color, width: 3.5 }),
        line([bx0, yPos], [bx1, yPos], { stroke: color, width: 3.5 }).glow(8, color),
        line([bx1, yPos - 10], [bx1, yPos], { stroke: color, width: 3.5 }),
        glowDot(mid, yPos, { radius: 6, color, glow: 9 }),
      ];
      if (labelTxt) {
        if (sideLabel) {
          parts.push(txt(labelTxt, bx1 + 22, yPos - 2, 26, color, 'mono', 'left'));
        } else {
          parts.push(txt(labelTxt, mid, yPos + 32, 26, color, 'mono'));
        }
      }
      return group(...parts).opacity(op);
    };

    // Show overlapping brackets depending on stage
    if (poolP.value < 0.2) {
      nodes.push(drawBracket(0, 2, rowY + 62, ROLE.window, null, mix(0.6, 1, f3P.value)));
      if (fNbP.value > 0.1) {
        nodes.push(drawBracket(1, 3, rowY + 86, ROLE.kernel, null, fNbP.value));
      }
      if (fThP.value > 0.1) {
        nodes.push(drawBracket(2, 4, rowY + 110, ROLE.neg, null, fThP.value));
      }
      if (f5P.value > 0.1) {
        nodes.push(drawBracket(0, 4, rowY + 148, ROLE.pos, spanLabel, f5P.value));
      } else if (fThP.value > 0.15) {
        nodes.push(txt(spanLabel, x0 + 2 * pitch, rowY + 155, 28, ROLE.window, 'mono'));
      }
    } else if (lastP.value < 0.2) {
      // Pooled stage: two 5-px windows covering 0..5 -> 6 px, then next pooled window at stride 2 (2..7)
      nodes.push(drawBracket(0, 4, rowY + 62, ROLE.window, null, 0.9));
      nodes.push(drawBracket(1, 5, rowY + 86, ROLE.kernel, null, 0.9));
      if (f6P.value > 0.1) {
        nodes.push(drawBracket(0, 5, rowY + 118, ROLE.pos, '6 px', f6P.value, true));
      }
      if (pNbP.value > 0.1) {
        nodes.push(
          drawBracket(
            2,
            7,
            rowY + 156,
            ROLE.channel,
            pJmpP.value > 0.2 ? 'jump = 2 px' : 'next pooled',
            pNbP.value,
            true,
          ),
        );
      }
    } else {
      // Final 3x3 over 3 pooled outputs (0..5, 2..7, 4..9 -> 10 px!)
      nodes.push(drawBracket(0, 5, rowY + 62, ROLE.window, null, 0.9));
      nodes.push(drawBracket(2, 7, rowY + 86, ROLE.kernel, null, 0.9));
      nodes.push(drawBracket(4, 9, rowY + 110, ROLE.channel, null, 0.9));
      if (f10P.value > 0.1) {
        nodes.push(drawBracket(0, 9, rowY + 152, ROLE.pos, '10 px  (6 + 2 + 2)', f10P.value));
      } else {
        nodes.push(txt('6 + 2 + 2 = ?', x0 + 4.5 * pitch, rowY + 155, 28, ROLE.window, 'mono'));
      }
    }

    // Bottom left: Live 4-layer trace table (floating rows, zero card boxes!)
    const tx = -815;
    const ty0 = 135;
    const cols = [tx, tx + 225, tx + 390, tx + 540, tx + 695];
    nodes.push(
      txt('LAYER', cols[0], ty0 - 44, 26, COSMOS.muted, 'mono', 'left'),
      txt('FIELD', cols[1], ty0 - 44, 26, ROLE.warm, 'mono', 'left'),
      txt('JUMP', cols[2], ty0 - 44, 26, ROLE.kernel, 'mono', 'left'),
      txt('MAP', cols[3], ty0 - 44, 26, ROLE.input, 'mono', 'left'),
      txt('CH', cols[4], ty0 - 44, 26, ROLE.channel, 'mono', 'left'),
      rule(tx, ty0 - 20, tx + 765, ty0 - 20, '#2a3759', 2),
    );
    const layerNames = ['Conv 3x3 s1', 'Conv 3x3 s1', 'Pool 2x2 s2', 'Conv 3x3 s1'];
    const chCounts = [16, 32, 32, 64];
    const unlockedRows = f10P.value > 0.2 ? 4 : f6P.value > 0.2 ? 3 : f5P.value > 0.2 ? 2 : 1;

    trace.forEach((row, idx) => {
      const y = ty0 + idx * 54 + 12;
      const unlocked = idx < unlockedRows;
      const isPoolRow = idx === 2 && (chnP.value > 0.2 || pJmpP.value > 0.2);
      const col = isPoolRow ? ROLE.window : unlocked ? COSMOS.ink : COSMOS.dim;
      nodes.push(
        txt(layerNames[idx], cols[0], y, 26, col, 'mono', 'left'),
        txt(
          unlocked ? `${row.field}x${row.field}` : '?',
          cols[1],
          y,
          26,
          unlocked ? ROLE.warm : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          unlocked ? String(row.jump) : '?',
          cols[2],
          y,
          26,
          unlocked ? ROLE.kernel : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(`${row.size}`, cols[3], y, 26, isPoolRow ? ROLE.window : ROLE.input, 'mono', 'left'),
        txt(
          `${chCounts[idx]}`,
          cols[4],
          y,
          26,
          isPoolRow ? ROLE.window : ROLE.channel,
          'mono',
          'left',
        ),
      );
    });

    // Bottom right: Exact MathJax recurrence + channel-vs-spatial takeaway
    const rx = 435;
    nodes.push(
      glowTex('r_{\\text{new}} = r + D(K - 1) \\cdot j', {
        x: rx,
        y: 165,
        size: 38,
        color: grwP.value > 0.2 ? ROLE.window : ROLE.warm,
      }).opacity(mix(0.6, 1, grwP.value)),
      glowTex('j_{\\text{new}} = j \\cdot S', {
        x: rx,
        y: 255,
        size: 38,
        color: spcP.value > 0.2 ? ROLE.kernel : COSMOS.muted,
      }).opacity(mix(0.6, 1, spcP.value)),
      txt(
        chnP.value > 0.2
          ? 'Pool keeps 32 ch, shrinks 220 -> 110 (coarser location)'
          : 'Dilation widens field; stride multiplies jump',
        rx,
        355,
        26,
        chnP.value > 0.2 ? ROLE.window : COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'field-three', f3P, 1, { dur: 0.55 });
  cueTo(s, c, 'field-neighbor', fNbP, 1, { dur: 0.55 });
  cueTo(s, c, 'field-third', fThP, 1, { dur: 0.55 });
  cueTo(s, c, 'field-five', f5P, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'field-pool', poolP, 1, { dur: 0.65 });
  cueTo(s, c, 'field-six', f6P, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'field-pooled-neighbor', pNbP, 1, { dur: 0.6 });
  cueTo(s, c, 'field-pooled-jump', pJmpP, 1, { dur: 0.55 });
  cueTo(s, c, 'field-last', lastP, 1, { dur: 0.65 });
  cueTo(s, c, 'field-ten', f10P, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'field-growth', grwP, 1, { dur: 0.55 });
  cueTo(s, c, 'field-spacing', spcP, 1, { dur: 0.55 });
  cueTo(s, c, 'field-channels', chnP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 14. pool-winners: What should the pool remember?
// Cues: pool-forward, pool-value-0*, pool-value-1, pool-value-2, pool-value-3,
//       pool-saved, pool-average, pool-tie-edit, pool-tie*
// ---------------------------------------------------------------------------
export function poolWinners(s, c) {
  const fwdP = s.value(0);
  const v0P = s.value(0);
  const v1P = s.value(0);
  const v2P = s.value(0);
  const v3P = s.value(0);
  const savP = s.value(0);
  const avgP = s.value(0);
  const tieEditP = s.value(0);
  const tieAnsP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 14 }));
  s.add(decorAura(-450, 40, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(450, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Max Pooling Winners', '& Saved Addresses'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: '2x2 WINDOWS  ·  STRIDE 2  ·  ZERO TRAINABLE WEIGHTS',
  });

  const maxSnap = poolSnapshot(POOL_MAP, { mode: 'max' });
  const avgSnap = poolSnapshot(POOL_MAP, { mode: 'average' });
  const TIED_MAP = POOL_MAP.map((r) => [...r]);
  TIED_MAP[0][0] = 0.91;

  const live = dynamic(() => {
    const isTieMode = tieEditP.value > 0.25;
    const isAvgMode = avgP.value > 0.3 && !isTieMode;
    const curSource = isTieMode ? TIED_MAP : POOL_MAP;

    // Active quadrant window index (0..3)
    let winIdx = 0;
    if (v3P.value > 0.2 && !isTieMode) winIdx = 3;
    else if (v2P.value > 0.2 && !isTieMode) winIdx = 2;
    else if (v1P.value > 0.2 && !isTieMode) winIdx = 1;
    const winR = Math.floor(winIdx / 2) * 2;
    const winC = (winIdx % 2) * 2;

    const nodes = [];

    // Left: 4x4 response map with 2x2 quadrant window
    const sX = -465;
    const sY = 45;
    const sz = 104;
    const gap = 9;
    const hiWinners = [];
    if (isTieMode) {
      hiWinners.push([0, 0], [1, 1]);
    } else if (!isAvgMode) {
      if (v0P.value > 0.2) hiWinners.push(maxSnap.owners[0].input);
      if (v1P.value > 0.2) hiWinners.push(maxSnap.owners[1].input);
      if (v2P.value > 0.2) hiWinners.push(maxSnap.owners[2].input);
      if (v3P.value > 0.2) hiWinners.push(maxSnap.owners[3].input);
    }

    nodes.push(
      txt(
        isTieMode ? 'TIED TOP-LEFT QUADRANT (0.91 vs 0.91)' : '4x4 FEATURE RESPONSES',
        sX,
        -215,
        28,
        isTieMode ? ROLE.window : ROLE.input,
        'mono',
      ),
      matrixGrid(curSource, sX, sY, {
        cellSize: sz,
        gap,
        fontSize: 30,
        digits: 2,
        kind: 'feature',
        highlightCells: hiWinners,
      }),
      windowBox(sX, sY, 4, 4, winR, winC, 2, 2, {
        cellSize: sz,
        gap,
        color: isTieMode ? ROLE.window : ROLE.kernel,
        width: 4.8,
        glow: 12,
        opacity: mix(0.65, 1, fwdP.value),
      }),
    );

    // Right: 2x2 pooled output tiles displaying value + saved (r, c) address!
    const oX = 425;
    const oY = 30;
    const reveals = [v0P.value, v1P.value, v2P.value, v3P.value];

    nodes.push(
      txt(
        isAvgMode ? '2x2 AVERAGE POOL (DILUTED)' : '2x2 MAX POOL + SAVED ADDRESS',
        oX,
        -215,
        28,
        isAvgMode ? ROLE.kernel : ROLE.pos,
        'mono',
      ),
    );

    for (let i = 0; i < 4; i += 1) {
      const r = Math.floor(i / 2);
      const col = i % 2;
      const px = oX + (col - 0.5) * 255;
      const py = oY + (r - 0.5) * 215;
      const ready = reveals[i] > 0.2;
      const val = isAvgMode ? avgSnap.values[r][col] : maxSnap.values[r][col];
      const owner = maxSnap.owners[i].input;
      let addrStr = '';
      if (isAvgMode) {
        addrStr = 'mean of 4';
      } else if (isTieMode && i === 0) {
        addrStr = tieAnsP.value > 0.2 ? 'saved (0, 0)' : 'saved (?, ?)';
      } else if (savP.value > 0.2) {
        addrStr = `saved (${owner[0]}, ${owner[1]})`;
      } else if (ready) {
        addrStr = `quadrant ${i + 1}`;
      } else {
        addrStr = 'pick max';
      }

      const borderCol =
        isTieMode && i === 0
          ? tieAnsP.value > 0.2
            ? ROLE.pos
            : ROLE.window
          : isAvgMode
            ? ROLE.kernel
            : ready
              ? ROLE.pos
              : '#2e4068';

      nodes.push(
        rect(225, 178, {
          fill: '#10182b',
          stroke: borderCol,
          width: 3,
          radius: 14,
        })
          .at(px, py)
          .glow(ready || isAvgMode ? 8 : 0, borderCol),
        txt(
          ready || isAvgMode ? fmtVal(val, 3) : '?',
          px,
          py - 22,
          48,
          ready || isAvgMode ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        txt(
          addrStr,
          px,
          py + 46,
          28,
          isTieMode && i === 0 && tieAnsP.value > 0.2
            ? ROLE.pos
            : savP.value > 0.2
              ? ROLE.window
              : COSMOS.muted,
          'mono',
        ),
      );
    }

    // Bottom synced caption (A8)
    let caption = 'Start in upper left: which of the four responses wins?';
    let capCol = ROLE.window;
    if (tieAnsP.value > 0.2) {
      caption = 'First-maximum rule (row-major) selects (0, 0) on a tie';
      capCol = ROLE.pos;
    } else if (isTieMode) {
      caption = 'Value stays 0.91, but two cells tie: which address is saved?';
      capCol = ROLE.window;
    } else if (isAvgMode) {
      caption = 'Average pooling divides sum by 4, diluting isolated peaks';
      capCol = ROLE.kernel;
    } else if (savP.value > 0.2) {
      caption = 'Zero-based (row, col) coordinates saved for the backward pass';
      capCol = ROLE.window;
    } else if (v0P.value > 0.2) {
      caption = 'Each 2x2 stride-2 window forwards its peak (0 trainable weights)';
      capCol = ROLE.pos;
    }

    nodes.push(txt(caption, 0, 355, 30, capCol, 'serif'));
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pool-forward', fwdP, 1, { dur: 0.6 });
  cueTo(s, c, 'pool-value-0', v0P, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'pool-value-1', v1P, 1, { dur: 0.5 });
  cueTo(s, c, 'pool-value-2', v2P, 1, { dur: 0.5 });
  cueTo(s, c, 'pool-value-3', v3P, 1, { dur: 0.5 });
  cueTo(s, c, 'pool-saved', savP, 1, { dur: 0.6 });
  cueTo(s, c, 'pool-average', avgP, 1, { dur: 0.65 });
  cueTo(s, c, 'pool-tie-edit', tieEditP, 1, { dur: 0.65 });
  cueTo(s, c, 'pool-tie', tieAnsP, 1, { after: true, dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 15. pool-backward: Where does the minus sign go?
// Cues: pool-signed, pool-route-1*, pool-route-0, pool-route-rest,
//       average-split, average-route, overlap-layout, shared-gradients
// ---------------------------------------------------------------------------
export function poolBackward(s, c) {
  const signP = s.value(0);
  const rt1P = s.value(0);
  const rt0P = s.value(0);
  const rtRestP = s.value(0);
  const avgSplitP = s.value(0);
  const avgAllP = s.value(0);
  const ovLayP = s.value(0);
  const ovSumP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.neg, seed: 15 }));
  s.add(decorAura(-450, 40, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(450, 40, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Pooling Backward Pass:', 'Routing Signed Gradients'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.neg,
    eyebrow: 'MAX WINNER ROUTE  ·  AVERAGE 1/4 SPLIT  ·  OVERLAP SUM',
  });

  const maxBwd = poolSnapshot(POOL_MAP, { incoming: POOL_INCOMING, mode: 'max' });
  const avgBwd = poolSnapshot(POOL_MAP, { incoming: POOL_INCOMING, mode: 'average' });
  const ovBwd = poolSnapshot(OVERLAP_MAP, { stride: 1, incoming: POOL_INCOMING, mode: 'average' });

  const live = dynamic(() => {
    const ov = ovLayP.value;
    const nodes = [];

    // View 0 (Beats 0-2): 4x4 input-gradient grid <- 2x2 incoming gradients (max then average)
    const v0 = fadeOut(ov);
    if (v0 > 0.02) {
      const isAvg = avgSplitP.value > 0.25;
      const gX = -465;
      const gY = 45;
      const gSz = 104;
      const gGap = 9;
      const iX = 435;
      const iY = 45;

      // Build current progressive gradient matrix
      const curGrad = Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, col) => {
          if (!isAvg) {
            if (r === 1 && col === 2 && rt1P.value > 0.2) return -1;
            if (r === 1 && col === 1 && rt0P.value > 0.2) return 2;
            if (r === 2 && col === 1 && rtRestP.value > 0.2) return 0.5;
            if (r === 2 && col === 2 && rtRestP.value > 0.2) return 3;
            return 0;
          }
          const inUpperRight = r < 2 && col >= 2;
          if (inUpperRight) return avgBwd.gradient[r][col];
          return avgAllP.value > 0.25 ? avgBwd.gradient[r][col] : 0;
        }),
      );

      // Flying beam from incoming (-1) to right edge of 4x4 grid (never crosses cell digits!)
      const beam =
        !isAvg && rt1P.value > 0.1
          ? arrow([iX - 245, iY - 105], [gX + 245, iY - 58], {
              stroke: ROLE.neg,
              width: 4.2,
              headSize: 16,
            })
              .glow(10, ROLE.neg)
              .opacity(rt1P.value)
          : group();

      nodes.push(
        group(
          txt(
            isAvg ? '4x4 AVG POOL INPUT GRADIENTS' : '4x4 MAX POOL INPUT GRADIENTS',
            gX,
            -215,
            28,
            isAvg ? ROLE.kernel : ROLE.pos,
            'mono',
          ),
          matrixGrid(curGrad, gX, gY, {
            cellSize: gSz,
            gap: gGap,
            fontSize: 28,
            digits: 3,
            kind: 'gradient',
            highlightCells: isAvg ? null : rt1P.value > 0.2 ? [[1, 2]] : null,
          }),
          beam,
          txt('INCOMING GRADIENT dL/dy', iX, -215, 28, ROLE.neg, 'mono'),
          ...[0, 1, 2, 3].map((idx) => {
            const r = Math.floor(idx / 2);
            const col = idx % 2;
            const px = iX + (col - 0.5) * 260;
            const py = iY + (r - 0.5) * 210;
            const gVal = POOL_INCOMING[r][col];
            const ow = maxBwd.owners[idx].input;
            const isMinusOne = idx === 1;
            const colStroke = isMinusOne && signP.value > 0.15 ? ROLE.neg : ROLE.kernel;
            return group(
              rect(236, 174, {
                fill: isMinusOne ? '#291220' : '#10182b',
                stroke: colStroke,
                width: isMinusOne ? 3.5 : 2.4,
                radius: 14,
              })
                .at(px, py)
                .glow(isMinusOne ? 10 : 4, colStroke),
              txt(fmtSigned(gVal, 1), px, py - 20, 48, gVal < 0 ? ROLE.neg : COSMOS.ink, 'mono'),
              txt(
                isAvg ? `${fmtSigned(gVal / 4, 3)} x4` : `saved (${ow[0]}, ${ow[1]})`,
                px,
                py + 44,
                26,
                isMinusOne ? ROLE.neg : ROLE.window,
                'mono',
              ),
            );
          }),
          txt(
            isAvg
              ? 'Average pooling splits each incoming gradient into 4 equal shares (d/4)'
              : rt1P.value > 0.2
                ? 'Minus one returns only to saved winner (1, 2); non-winners get 0'
                : 'Incoming gradient is -1 at upper right. Which input cell receives it?',
            0,
            355,
            30,
            isAvg ? ROLE.kernel : rt1P.value > 0.2 ? ROLE.neg : ROLE.window,
            'serif',
          ),
        ).opacity(v0),
      );
    }

    // View 1 (Beat 3): 3x3 stride-1 overlapping average pooling -> center collects all 4 shares = 1.125
    const v1 = fadeIn(ov);
    if (v1 > 0.02) {
      const sh = ovSumP.value;
      const gX = -380;
      const gY = 45;
      const gSz = 128;
      const gGap = 10;

      nodes.push(
        group(
          txt('3x3 OVERLAPPING AVG POOL (STRIDE 1)', gX, -210, 28, ROLE.kernel, 'mono'),
          matrixGrid(ovBwd.gradient, gX, gY, {
            cellSize: gSz,
            gap: gGap,
            fontSize: 30,
            digits: 3,
            kind: 'gradient',
            visibleMask: (r, col) => (r === 1 && col === 1 ? sh > 0.45 : true),
            highlightCells: [[1, 1]],
          }),
          // Four colored window corners meeting at center (1,1)
          windowBox(gX, gY, 3, 3, 0, 0, 2, 2, {
            cellSize: gSz,
            gap: gGap,
            color: ROLE.pos,
            width: 2.6,
            glow: 5,
            pad: 4,
            fill: null,
          }),
          windowBox(gX, gY, 3, 3, 0, 1, 2, 2, {
            cellSize: gSz,
            gap: gGap,
            color: ROLE.neg,
            width: 2.6,
            glow: 5,
            pad: 8,
            fill: null,
          }),
          windowBox(gX, gY, 3, 3, 1, 0, 2, 2, {
            cellSize: gSz,
            gap: gGap,
            color: ROLE.kernel,
            width: 2.6,
            glow: 5,
            pad: 12,
            fill: null,
          }),
          windowBox(gX, gY, 3, 3, 1, 1, 2, 2, {
            cellSize: gSz,
            gap: gGap,
            color: ROLE.window,
            width: 2.6,
            glow: 5,
            pad: 16,
            fill: null,
          }),
          // Right: Center accumulation breakdown
          txt('CENTER CELL (1, 1) RECEIVES 4 SHARES', 435, -195, 28, ROLE.window, 'mono'),
          txt('Window (0,0):   2.0 / 4  =  +0.500', 435, -95, 30, ROLE.pos, 'mono'),
          txt('Window (0,1):  -1.0 / 4  =  -0.250', 435, -30, 30, ROLE.neg, 'mono'),
          txt('Window (1,0):   0.5 / 4  =  +0.125', 435, 35, 30, ROLE.kernel, 'mono'),
          txt('Window (1,1):   3.0 / 4  =  +0.750', 435, 100, 30, ROLE.window, 'mono'),
          rule(155, 150, 725, 150, '#2e4068', 2.5),
          txt(
            sh > 0.45 ? 'Total center grad = +1.125' : 'Summing 4 overlapping shares...',
            435,
            220,
            42,
            sh > 0.45 ? ROLE.pos : COSMOS.muted,
            'mono',
          ).glow(sh > 0.45 ? 11 : 0, ROLE.pos),
          txt(
            'When backward paths meet, each path adds to the same input gradient',
            0,
            365,
            30,
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
  cueTo(s, c, 'pool-signed', signP, 1, { dur: 0.55 });
  cueTo(s, c, 'pool-route-1', rt1P, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'pool-route-0', rt0P, 1, { dur: 0.55 });
  cueTo(s, c, 'pool-route-rest', rtRestP, 1, { dur: 0.65 });
  cueTo(s, c, 'average-split', avgSplitP, 1, { dur: 0.65 });
  cueTo(s, c, 'average-route', avgAllP, 1, { dur: 0.65 });
  cueTo(s, c, 'overlap-layout', ovLayP, 1, { dur: 0.7 });
  cueTo(s, c, 'shared-gradients', ovSumP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 16. overlap-repair: What did the backward pass lose?
// Cues: overlap-owners, overlap-index* (caption_boundary: true), overwrite-gradient,
//       accumulate-reset, accumulate-first, accumulate-negative, accumulate-half,
//       correct-gradient*, overlap-check
// ---------------------------------------------------------------------------
export function overlapRepair(s, c) {
  const ownP = s.value(0);
  const idxP = s.value(0);
  const ovwP = s.value(0);
  const rstP = s.value(0);
  const a1P = s.value(0);
  const a2P = s.value(0);
  const a3P = s.value(0);
  const a4P = s.value(0);
  const chkP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 16 }));
  s.add(decorAura(-480, 40, 460, '#ffd1661a', '#07091000'));
  s.add(decorAura(380, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Overlapping Max Pool:', '= Overwrite vs. += Accumulate'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pos,
    eyebrow: 'ALL 4 STRIDE-1 WINDOWS PICK CENTER CELL 9  ·  PYTORCH VERIFIED',
  });

  const incomingSteps = [2, -1, 0.5, 3];
  const overwriteTrace = [2, -1, 0.5, 3];
  const accumTrace = [2, 1, 1.5, 4.5];

  const live = dynamic(() => {
    const own = ownP.value;
    const idxRevealed = idxP.value;
    const ovw = ovwP.value;
    const rst = rstP.value;
    const nodes = [];

    // Left: 3x3 OVERLAP_MAP with center = 9 and sliding 2x2 window visiting all 4 starts
    const gX = -595;
    const gY = 45;
    const sz = 114;
    const gap = 9;
    const wIdx = Math.min(3, Math.floor(own * 3.99));
    const wR = Math.floor(wIdx / 2);
    const wC = wIdx % 2;

    nodes.push(
      txt('3x3 INPUT (CENTER = 9)', gX, -210, 28, ROLE.input, 'mono'),
      matrixGrid(OVERLAP_MAP, gX, gY, {
        cellSize: sz,
        gap,
        fontSize: 36,
        kind: 'feature',
        highlightCells: [[1, 1]],
      }),
      windowBox(gX, gY, 3, 3, wR, wC, 2, 2, {
        cellSize: sz,
        gap,
        color: ROLE.window,
        width: 4.8,
        glow: 12,
      }),
      txt(
        idxRevealed > 0.2 ? 'Flat index = 4  [[4,4],[4,4]]' : 'All 4 windows pick 9',
        gX,
        285,
        26,
        ROLE.window,
        'mono',
      ),
    );

    // Right: Two horizontal live registers comparing buggy `=` overwrite vs fixed `+=` accumulation!
    const colXs = [155, 340, 525, 710];
    const topY = -125;
    const bugY = 20;
    const fixY = 175;

    nodes.push(
      txt('INCOMING GRADIENTS', 432, -210, 28, COSMOS.muted, 'mono'),
      ...incomingSteps.map((g, i) =>
        numCell(fmtSigned(g, 1), colXs[i], topY, {
          w: 148,
          h: 66,
          size: 32,
          stroke: g < 0 ? ROLE.neg : ROLE.kernel,
          textColor: g < 0 ? ROLE.neg : ROLE.kernel,
          glow: 6,
        }),
      ),
    );

    // Row 1: Buggy `grad[4] = g` overwrite trace
    const ovwStep = Math.min(4, Math.floor(ovw * 4.2));
    nodes.push(txt('BUG: = g', -215, bugY, 28, ROLE.neg, 'mono', 'left'));
    overwriteTrace.forEach((val, i) => {
      const active = i < ovwStep;
      const isFinal = i === 3 && ovwStep >= 4;
      nodes.push(
        numCell(active ? fmtVal(val, 1) : '...', colXs[i], bugY, {
          w: 148,
          h: 72,
          size: 34,
          fill: isFinal ? '#331222' : '#10182b',
          stroke: active ? ROLE.neg : '#2b3b60',
          textColor: active ? ROLE.neg : COSMOS.dim,
          glow: isFinal ? 12 : 0,
        }),
      );
    });

    // Row 2: Fixed `grad[4] += g` accumulation trace
    const fixSteps =
      a4P.value > 0.2 ? 4 : a3P.value > 0.2 ? 3 : a2P.value > 0.2 ? 2 : a1P.value > 0.2 ? 1 : 0;
    nodes.push(
      txt(
        rst > 0.2 ? 'FIX: += g' : 'START = 0',
        -215,
        fixY,
        28,
        rst > 0.2 ? ROLE.pos : COSMOS.dim,
        'mono',
        'left',
      ),
    );
    accumTrace.forEach((val, i) => {
      const active = i < fixSteps;
      const isFinal = i === 3 && fixSteps >= 4;
      nodes.push(
        numCell(active ? fmtVal(val, 1) : rst > 0.2 ? '0' : '?', colXs[i], fixY, {
          w: 148,
          h: 72,
          size: 34,
          fill: isFinal ? '#0e2d24' : '#10182b',
          stroke: active ? (i === 1 ? ROLE.neg : ROLE.pos) : '#2b3b60',
          textColor: active ? (i === 1 ? ROLE.neg : ROLE.pos) : COSMOS.dim,
          glow: isFinal ? 14 : 0,
        }),
      );
    });

    // Bottom live status (A8 strictly synced)
    let statusTxt = 'Four 2x2 windows share the center cell (value 9)';
    let statusCol = COSMOS.ink;
    if (chkP.value > 0.2) {
      statusTxt =
        'PyTorch CPU check: indices [[4,4],[4,4]]  ·  center grad = 4.5  ·  0 pool weights';
      statusCol = ROLE.pos;
    } else if (a4P.value > 0.2) {
      statusTxt = '+= preserves every path: 2 - 1 + 0.5 + 3 = 4.5  (all other cells 0)';
      statusCol = ROLE.pos;
    } else if (a3P.value > 0.2) {
      statusTxt = 'Add +0.5 -> running total reaches 1.5';
      statusCol = ROLE.pos;
    } else if (a2P.value > 0.2) {
      statusTxt = 'Add -1.0 -> running total drops from 2 to 1';
      statusCol = ROLE.neg;
    } else if (rst > 0.2) {
      statusTxt = 'Reset to 0 and accumulate with += instead of =';
      statusCol = ROLE.pos;
    } else if (ovw > 0.3) {
      statusTxt = 'Overwrite finishes at 3. Where did 2, -1, and 0.5 go?';
      statusCol = ROLE.neg;
    }

    nodes.push(txt(statusTxt, 145, 345, 29, statusCol, 'serif'));
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'overlap-owners', ownP, 1, { dur: 1.4 });
  cueTo(s, c, 'overlap-index', idxP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'overwrite-gradient', ovwP, 1, { dur: 1.4 });
  cueTo(s, c, 'accumulate-reset', rstP, 1, { dur: 0.45 });
  cueTo(s, c, 'accumulate-first', a1P, 1, { dur: 0.45 });
  cueTo(s, c, 'accumulate-negative', a2P, 1, { dur: 0.45 });
  cueTo(s, c, 'accumulate-half', a3P, 1, { dur: 0.45 });
  cueTo(s, c, 'correct-gradient', a4P, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'overlap-check', chkP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 17. global-average-head: Collapse spatial positions while preserving channels
//     (SIGNATURE 3D CHANNEL VOLUME COLLAPSE)
// Cues: global-average-head-b1, mean-collapse, global-average-head-b2, head-count*,
//       global-average-head-b3, mean-peak*, peak-nine
// ---------------------------------------------------------------------------
export function globalAverageHead(s, c) {
  const b1P = s.value(0);
  const colP = s.value(0);
  const b2P = s.value(0);
  const cntP = s.value(0);
  const b3P = s.value(0);
  const nineP = s.value(0);
  const meanP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.channel, seed: 17 }));
  s.add(decorAura(-450, 40, 480, '#a78bfa22', '#5ce1e614'));

  // 3D orbiting 6-channel (6 x 3 x 3) feature volume collapsing into a 6-element vector!
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 16.5,
    unit: 92,
    focus: [0, 0, 0],
  }).at(-455, 5);

  const sliceColors = [ROLE.kernel, ROLE.pos, ROLE.window, ROLE.channel, ROLE.input, ROLE.warm];
  const slices3d = [];
  for (let ch = 0; ch < 6; ch += 1) {
    const zPos = -1.6 + ch * 0.64;
    // As colP goes 0 -> 1, each 3x3 slab shrinks spatially down to a 1x1 mean scalar!
    slices3d.push(
      ...wireframeSlab3d(() => [0, 0, zPos], 1.15, 1.15, 0.09, {
        color: sliceColors[ch],
        width: 2.3,
        glow: 7,
      }),
    );
    slices3d.push(
      ...wireframeSlab3d(() => [mix(0, 2.35, colP.value), 0, zPos], 0.24, 0.24, 0.09, {
        color: sliceColors[ch],
        width: 3.2,
        glow: 11,
      }),
    );
  }
  view3d.add(...slices3d);

  const headline = heroTitle(['Global Average Pooling', 'Spatial Collapse to (N, C)'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.channel,
    eyebrow: '6 CHANNELS x 3x3 GRID  ·  2-CLASS LINEAR HEAD',
  });

  const IMPULSE_3X3 = [
    [0, 0, 0],
    [0, 9, 0],
    [0, 0, 0],
  ];

  const live = dynamic(() => {
    const b2 = b2P.value;
    const ct = cntP.value;
    const b3 = b3P.value;
    const nn = nineP.value;
    const mn = meanP.value;
    const nodes = [];

    nodes.push(
      txt(
        colP.value > 0.35 ? '(N, 6, 3, 3)  ->  (N, 6)' : '6-CHANNEL 3x3 VOLUME',
        -455,
        355,
        28,
        ROLE.channel,
        'mono',
      ),
    );

    // Right side crossfades cleanly between:
    // View A (Beats 0-1): Flatten head (110 params) vs GAP head (14 params) proportional bars
    // View B (Beat 2): 3x3 single bright 9 among eight 0s -> Max = 9 vs Average = 1
    const vA = fadeOut(b3);
    const vB = fadeIn(b3);

    if (vA > 0.02) {
      const rx = 120;
      const maxW = 540;
      nodes.push(
        group(
          txt('2-CLASS HEAD PARAMETER COUNT', rx, -205, 28, COSMOS.muted, 'mono', 'left'),
          // Flatten bar: 6*3*3*2 + 2 = 110
          txt('Flatten head:  C·H·W·Q + Q', rx, -110, 28, ROLE.neg, 'mono', 'left'),
          scaleTrack(rx, -52, maxW, 48, { radius: 10 }),
          glowBar(rx, -52, mix(40, maxW, b2), 48, ROLE.neg, { glow: 10 }),
          txt(
            ct > 0.2 ? `${GAP_FLATTEN_PARAMS} params` : '6x3x3x2 + 2',
            rx + maxW + 18,
            -52,
            30,
            ROLE.neg,
            'mono',
            'left',
          ),
          // GAP bar: 6*2 + 2 = 14
          txt('GAP head:  C·Q + Q', rx, 55, 28, ROLE.pos, 'mono', 'left'),
          scaleTrack(rx, 112, maxW, 48, { radius: 10 }),
          glowBar(
            rx,
            112,
            mix(20, (GAP_POOLED_PARAMS / GAP_FLATTEN_PARAMS) * maxW, b2),
            48,
            ROLE.pos,
            {
              glow: 11,
            },
          ),
          txt(
            ct > 0.2 ? `${GAP_POOLED_PARAMS} params` : '6x2 + 2',
            rx + maxW + 18,
            112,
            32,
            ROLE.pos,
            'mono',
            'left',
          ),
          txt(
            ct > 0.2
              ? '110 -> 14 params: both give 2 logits, GAP drops spatial position'
              : 'One spatial mean per channel and example',
            rx,
            245,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(vA),
      );
    }

    if (vB > 0.02) {
      const mx = 420;
      nodes.push(
        group(
          txt('SINGLE BRIGHT CELL AMONG ZEROS', mx, -215, 28, ROLE.window, 'mono'),
          matrixGrid(IMPULSE_3X3, mx, -25, {
            cellSize: 96,
            gap: 8,
            fontSize: 36,
            kind: 'feature',
            highlightCells: [[1, 1]],
          }),
          // Max vs Average readout bars underneath
          numCell(nn > 0.15 ? 'MAX = 9' : 'MAX = ?', mx - 165, 220, {
            w: 250,
            h: 82,
            size: 34,
            stroke: ROLE.window,
            textColor: ROLE.window,
            glow: nn > 0.15 ? 11 : 0,
          }),
          numCell(mn > 0.15 ? 'AVG = 1' : 'AVG = ?', mx + 165, 220, {
            w: 250,
            h: 82,
            size: 34,
            stroke: ROLE.kernel,
            textColor: ROLE.kernel,
            glow: mn > 0.15 ? 11 : 0,
          }),
          txt(
            mn > 0.15
              ? '9 / 9 = 1: average dilutes a single-cell spike'
              : 'Max keeps 9; average divides 9 across all 9 cells',
            mx,
            335,
            28,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(vB),
      );
    }

    return group(...nodes);
  });

  s.add(view3d, headline, live);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'global-average-head-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'mean-collapse', colP, 1, { dur: 1.1 });
  cueTo(s, c, 'global-average-head-b2', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'head-count', cntP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'global-average-head-b3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'peak-nine', nineP, 1, { dur: 0.5 });
  cueTo(s, c, 'mean-peak', meanP, 1, { after: true, dur: 0.5 });
}
