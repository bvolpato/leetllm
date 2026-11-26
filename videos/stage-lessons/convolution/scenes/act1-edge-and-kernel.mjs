// Act 1 (Scenes 1-6): Intro, Pixels & Arrangement, Signed Edge Kernel,
// Single Patch Accumulation, 3D Living Slide Sweep, and 4x4 Article Crop.
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  ARTICLE_CROP,
  COSMOS,
  EDGE_PATCH,
  IMAGE,
  KERNEL,
  MAP,
  RIDGE,
  ROLE,
  UNIFORM_TWO_THIRDS,
  beatTo,
  cellPos,
  cinemaGrid,
  cinematic3d,
  clamp01,
  correlate,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  fmtSigned,
  fmtVal,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  heroTitle,
  livingDrift,
  matrixGrid,
  mix,
  numCell,
  orbitScene,
  patchSnapshot,
  point3d,
  rule,
  scaleTrack,
  scanSnapshot,
  surface,
  txt,
  windowBox,
  wireframeSlab3d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Where does the edge disappear?
// Cues: opening-pan, opening-image, second-window, third-window,
//       opening-left, opening-right, opening-choice, opening-winner*, opening-zero*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const panP = s.value(0);
  const imgP = s.value(0);
  const win2P = s.value(0);
  const win3P = s.value(0);
  const leftP = s.value(0);
  const rightP = s.value(0);
  const choiceP = s.value(0);
  const winnerP = s.value(0);
  const zeroP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.window, seed: 1 }));
  s.add(decorAura(-450, 40, 480, '#ffd1661f', '#07091000'));
  s.add(decorAura(390, 40, 520, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Where Does the Edge', 'Disappear?'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.window,
    eyebrow: 'SLIDING 3x3 WINDOW  ·  RIGHT COLUMN MINUS LEFT COLUMN',
  });

  const live = dynamic(() => {
    const colPos = win2P.value + win3P.value; // 0 -> 1 -> 2
    const lHi = leftP.value;
    const rHi = rightP.value;
    const ch = choiceP.value;
    const wn = winnerP.value;
    const zr = zeroP.value;
    const ph = drift.value;
    const nodes = [];

    // Left: 5x5 metal panel with bright seam (cols 2..4 bright) and sliding yellow 3x3 window
    const panelX = -540;
    const panelY = 70;
    const cellSz = 88;
    const gap = 8;
    nodes.push(
      txt('5x5 METAL PANEL', panelX, -205, 28, COSMOS.muted, 'mono'),
      matrixGrid(IMAGE, panelX, panelY, { cellSize: cellSz, gap, fontSize: 32 }),
      windowBox(panelX, panelY, 5, 5, 0, Math.round(colPos), 3, 3, {
        cellSize: cellSz,
        gap,
        color: ROLE.window,
        width: 5,
        glow: 12 + 3 * Math.sin(ph * Math.PI * 8),
      }),
      txt(
        colPos < 0.5
          ? 'Window A  (cols 0..2)'
          : colPos < 1.5
            ? 'Window B  (cols 1..3)'
            : 'Window C  (cols 2..4)',
        panelX,
        345,
        30,
        ROLE.window,
        'mono',
      ),
    );

    // Right: Three 3x3 sampled windows (A, B, C) staying side by side from Window A onward
    const samplePatches = [0, 1, 2].map((c0) =>
      IMAGE.slice(0, 3).map((row) => row.slice(c0, c0 + 3)),
    );
    const labels = ['WINDOW A', 'WINDOW B', 'WINDOW C'];
    const xs = [-85, 305, 695];
    const py = 5;
    const sCell = 78;
    const sGap = 7;

    nodes.push(txt('NINE PIXELS THE DETECTOR SEES', 305, -205, 28, ROLE.kernel, 'mono'));

    samplePatches.forEach((patchGrid, idx) => {
      const vis = idx === 0 ? 1 : idx === 1 ? mix(0.45, 1, win2P.value) : mix(0.45, 1, win3P.value);
      const isWinner = idx === 2 && wn > 0.1;
      const sx = xs[idx];
      const lblCol = isWinner ? ROLE.pos : idx === Math.round(colPos) ? ROLE.window : COSMOS.muted;

      nodes.push(
        txt(labels[idx], sx, py - 165, 28, lblCol, 'mono'),
        matrixGrid(patchGrid, sx, py, {
          cellSize: sCell,
          gap: sGap,
          fontSize: 30,
          opacity: vis,
          cellColorFn: (v, r, col, base) => {
            if (col === 0 && lHi > 0.15) {
              return { stroke: ROLE.neg, glow: 8 };
            }
            if (col === 2 && rHi > 0.15) {
              return { stroke: ROLE.kernel, glow: 8 };
            }
            return base;
          },
        }),
      );

      // Left / right column highlight frames when narration names them
      if (lHi > 0.1) {
        nodes.push(
          windowBox(sx, py, 3, 3, 0, 0, 3, 1, {
            cellSize: sCell,
            gap: sGap,
            color: ROLE.neg,
            width: 3.4,
            glow: 8,
            pad: 3,
            opacity: vis * lHi,
          }),
        );
      }
      if (rHi > 0.1) {
        nodes.push(
          windowBox(sx, py, 3, 3, 0, 2, 3, 1, {
            cellSize: sCell,
            gap: sGap,
            color: ROLE.kernel,
            width: 3.4,
            glow: 8,
            pad: 3,
            opacity: vis * rHi,
          }),
        );
      }

      if (isWinner) {
        nodes.push(
          windowBox(sx, py, 3, 3, 0, 0, 3, 3, {
            cellSize: sCell,
            gap: sGap,
            color: ROLE.pos,
            width: 5,
            glow: 14,
            pad: 8,
            opacity: wn,
          }),
        );
      }

      // Column count & subtraction readout (answer strictly withheld until opening-zero!)
      const leftBright = patchGrid.reduce((a, row) => a + row[0], 0);
      const rightBright = patchGrid.reduce((a, row) => a + row[2], 0);
      if (zr > 0.1) {
        const diff = rightBright - leftBright;
        nodes.push(
          txt(
            `${rightBright} - ${leftBright} = ${diff}`,
            sx,
            py + 185,
            34,
            idx === 2 ? ROLE.pos : COSMOS.ink,
            'mono',
          )
            .glow(idx === 2 ? 10 : 0, ROLE.pos)
            .opacity(zr),
        );
      } else if (lHi > 0.2 || rHi > 0.2) {
        nodes.push(
          txt(`R:${rightBright}  L:${leftBright}`, sx, py + 185, 28, COSMOS.muted, 'mono').opacity(
            vis,
          ),
        );
      } else {
        nodes.push(
          txt(
            idx === 0 ? 'seam enters' : 'slide right',
            sx,
            py + 185,
            26,
            COSMOS.dim,
            'mono',
          ).opacity(vis),
        );
      }
    });

    // Bottom status caption synchronized strictly to live state (A8)
    const preAns = fadeOut(wn);
    if (preAns > 0.02) {
      const promptText =
        ch > 0.1
          ? 'Subtract left bright count from right bright count. Which window gives 0?'
          : imgP.value > 0.2
            ? 'Each 3x3 stop samples 9 neighboring pixels from the seam'
            : 'Watch the bright seam enter the yellow 3x3 window';
      nodes.push(
        txt(promptText, 305, 345, 30, ch > 0.1 ? ROLE.window : COSMOS.ink, 'serif').opacity(preAns),
      );
    }
    const postAns = fadeIn(wn);
    if (postAns > 0.02) {
      nodes.push(
        txt('Window C: equal columns cancel', 305, 345, 34, ROLE.pos, 'mono')
          .glow(10, ROLE.pos)
          .opacity(postAns),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'opening-pan', panP, 1, { dur: 0.7 });
  cueTo(s, c, 'opening-image', imgP, 1, { dur: 0.6 });
  cueTo(s, c, 'second-window', win2P, 1, { dur: 0.85 });
  cueTo(s, c, 'third-window', win3P, 1, { dur: 0.85 });
  cueTo(s, c, 'opening-left', leftP, 1, { dur: 0.5 });
  cueTo(s, c, 'opening-right', rightP, 1, { dur: 0.5 });
  cueTo(s, c, 'opening-choice', choiceP, 1, { dur: 0.5 });
  cueTo(s, c, 'opening-winner', winnerP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'opening-zero', zeroP, 1, { after: true, dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 2. pixels: Brightness and arrangement tell different stories
// Cues: pixel-arrivals, equal-brightness
// ---------------------------------------------------------------------------
export function pixels(s, c) {
  const arriveP = s.value(0);
  const beat1P = s.value(0);
  const eqP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.input, seed: 2 }));
  s.add(decorAura(-340, 30, 480, '#60a5fa1c', '#07091000'));
  s.add(decorAura(420, 30, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Brightness vs.', 'Spatial Arrangement'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.kernel,
    eyebrow: 'PIXEL VALUES  ·  ROW & COLUMN COORDINATES',
  });

  const live = dynamic(() => {
    const arr = arriveP.value;
    const b1 = beat1P.value;
    const eq = eqP.value;
    const nodes = [];

    // View 0: 5x5 pixel matrix assembling + brightness legend on right
    const v0 = fadeOut(b1);
    if (v0 > 0.02) {
      const count = Math.max(5, Math.round(arr * 25));
      nodes.push(
        group(
          txt('5x5 IMAGE GRID  (ROW, COL)', -330, -210, 28, ROLE.input, 'mono'),
          matrixGrid(IMAGE, -330, 65, {
            cellSize: 92,
            gap: 8,
            fontSize: 32,
            revealCount: count,
          }),
          // Column indices above & row indices left
          ...[0, 1, 2, 3, 4].map((ci) =>
            txt(`c${ci}`, -330 + (ci - 2) * 100, -165, 26, COSMOS.dim, 'mono'),
          ),
          ...[0, 1, 2, 3, 4].map((ri) =>
            txt(`r${ri}`, -615, 65 + (ri - 2) * 100, 26, COSMOS.dim, 'mono'),
          ),
          // Right: Brightness key + local neighborhood window note
          txt('BRIGHTNESS SCALE', 430, -175, 28, COSMOS.muted, 'mono'),
          numCell('0', 310, -75, {
            w: 110,
            h: 92,
            fill: '#121212',
            stroke: '#465a88',
            textColor: COSMOS.ink,
            size: 38,
          }),
          txt('Dark surface', 400, -75, 32, COSMOS.muted, 'sans', 'left'),
          numCell('1', 310, 65, {
            w: 110,
            h: 92,
            fill: '#dedcd6',
            stroke: '#ffffff',
            textColor: '#070910',
            size: 38,
          }),
          txt('Bright seam', 400, 65, 32, COSMOS.ink, 'sans', 'left'),
          txt('A 3x3 window keeps neighbors together', 430, 225, 28, ROLE.window, 'serif'),
        ).opacity(v0),
      );
    }

    // View 1: Uniform 2/3 patch vs Edge patch (identical total brightness = 6)
    const v1 = fadeIn(b1);
    if (v1 > 0.02) {
      const lx = -430;
      const rx = 430;
      const py = 15;
      const cSz = 112;
      const cGap = 9;
      nodes.push(
        group(
          txt('UNIFORM PATCH', lx, -210, 32, ROLE.input, 'mono'),
          matrixGrid(UNIFORM_TWO_THIRDS, lx, py, {
            cellSize: cSz,
            gap: cGap,
            fontSize: 32,
          }),
          txt('BOUNDARY PATCH', rx, -210, 32, ROLE.kernel, 'mono'),
          matrixGrid(EDGE_PATCH, rx, py, {
            cellSize: cSz,
            gap: cGap,
            fontSize: 34,
          }),
          // Proportional brightness meters underneath both patches
          txt(
            'Total brightness = 6',
            lx,
            255,
            34,
            eq > 0.2 ? ROLE.window : COSMOS.ink,
            'mono',
          ).glow(eq > 0.2 ? 8 : 0, ROLE.window),
          txt(
            'Total brightness = 6',
            rx,
            255,
            34,
            eq > 0.2 ? ROLE.window : COSMOS.ink,
            'mono',
          ).glow(eq > 0.2 ? 8 : 0, ROLE.window),
          txt('9 x (2/3) = 6  (flat)', lx, 315, 28, COSMOS.muted, 'mono'),
          txt('3(0) + 6(1) = 6  (edge)', rx, 315, 28, COSMOS.muted, 'mono'),
          txt('=', 0, py, 64, eq > 0.2 ? ROLE.window : COSMOS.dim, 'mono'),
          txt(
            'Same sum, different layout: we must compare across space',
            0,
            395,
            32,
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
  cueTo(s, c, 'pixel-arrivals', arriveP, 1, { dur: 1.4 });
  beatTo(s, c, 1, beat1P, 1, { dur: 0.7 });
  cueTo(s, c, 'equal-brightness', eqP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 3. kernel: Build a comparison between the two sides
// Cues: kernel-left, kernel-center, kernel-right,
//       uniform-columns, uniform-result*, edge-columns, edge-result*
// ---------------------------------------------------------------------------
export function kernel(s, c) {
  const kLeft = s.value(0);
  const kCenter = s.value(0);
  const kRight = s.value(0);
  const beat1P = s.value(0);
  const uColP = s.value(0);
  const uResP = s.value(0);
  const beat2P = s.value(0);
  const eColP = s.value(0);
  const eResP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 3 }));
  s.add(decorAura(-400, 30, 460, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(380, 30, 480, '#5ce1e61c', '#07091000'));

  const headline = heroTitle(['Signed Edge Kernel', 'Left vs. Right'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.kernel,
    eyebrow: '3x3 WEIGHT TABLE  ·  VERTICAL EDGE DETECTOR',
  });

  const live = dynamic(() => {
    const b1 = beat1P.value;
    const b2 = beat2P.value;
    const nodes = [];

    // View 0 (Beat 0): Build the 3x3 signed kernel column by column
    const v0 = fadeOut(b1);
    if (v0 > 0.02) {
      const colAlpha = [
        mix(0.35, 1, kLeft.value),
        mix(0.35, 1, kCenter.value),
        mix(0.35, 1, kRight.value),
      ];
      nodes.push(
        group(
          txt('3x3 FILTER (KERNEL)', -310, -210, 30, ROLE.kernel, 'mono'),
          matrixGrid(KERNEL, -310, 50, {
            cellSize: 124,
            gap: 12,
            fontSize: 44,
            kind: 'kernel',
            cellColorFn: (v, r, col, base) => ({
              ...base,
              glow:
                (col === 0 && kLeft.value > 0.3) ||
                (col === 1 && kCenter.value > 0.3) ||
                (col === 2 && kRight.value > 0.3)
                  ? 10
                  : 0,
            }),
          }),
          txt('subtract', -446, 275, 28, ROLE.neg, 'mono').opacity(colAlpha[0]),
          txt('ignore', -310, 275, 28, COSMOS.muted, 'mono').opacity(colAlpha[1]),
          txt('add', -174, 275, 28, ROLE.kernel, 'mono').opacity(colAlpha[2]),
          // Right side: clear signed column legend & equation
          txt('COLUMN ROLES', 410, -180, 28, COSMOS.muted, 'mono'),
          txt(
            'Left column (-1):  subtract left brightness',
            140,
            -90,
            30,
            ROLE.neg,
            'sans',
            'left',
          ).opacity(colAlpha[0]),
          txt(
            'Center column (0):  ignore middle column',
            140,
            -10,
            30,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(colAlpha[1]),
          txt(
            'Right column (+1):  add right brightness',
            140,
            70,
            30,
            ROLE.kernel,
            'sans',
            'left',
          ).opacity(colAlpha[2]),
          glowTex('\\text{response} = \\text{right} - \\text{left}', {
            x: 420,
            y: 205,
            size: 40,
            color: ROLE.window,
          }),
        ).opacity(v0),
      );
    }

    // View 1 (Beat 1): Uniform 2/3 patch -> -2 + 2 = 0
    const v1 = fadeIn(b1) * fadeOut(b2);
    if (v1 > 0.02) {
      const uc = uColP.value;
      const ur = uResP.value;
      nodes.push(
        group(
          txt('UNIFORM PATCH (SUM = 6)', -550, -195, 28, ROLE.input, 'mono'),
          matrixGrid(UNIFORM_TWO_THIRDS, -550, 35, { cellSize: 108, gap: 9, fontSize: 32 }),
          txt('x', -320, 35, 48, COSMOS.muted, 'mono'),
          txt('EDGE KERNEL', -90, -195, 28, ROLE.kernel, 'mono'),
          matrixGrid(KERNEL, -90, 35, {
            cellSize: 108,
            gap: 9,
            fontSize: 38,
            kind: 'kernel',
          }),
          // Right: Signed column balance bars
          txt('COLUMN CONTRIBUTIONS', 495, -195, 28, COSMOS.muted, 'mono'),
          txt('Left (-1 · 3 · 2/3)', 170, -95, 28, ROLE.neg, 'mono', 'left'),
          glowBar(545, -95, mix(10, 170, uc), 42, ROLE.neg, { glow: 8 }),
          txt('-2', 740, -95, 34, ROLE.neg, 'mono', 'left').opacity(clamp01(uc * 1.4)),
          txt('Right (+1 · 3 · 2/3)', 170, 5, 28, ROLE.kernel, 'mono', 'left'),
          glowBar(545, 5, mix(10, 170, uc), 42, ROLE.kernel, { glow: 8 }),
          txt('+2', 740, 5, 34, ROLE.kernel, 'mono', 'left').opacity(clamp01(uc * 1.4)),
          rule(170, 88, 825, 88, '#2d3f68', 2.5),
          ur > 0.05
            ? group(
                txt('-2 + 0 + 2 = 0', 485, 165, 52, ROLE.pos, 'mono').glow(11, ROLE.pos),
                txt('Equal brightness on both sides cancels', 485, 245, 30, COSMOS.ink, 'serif'),
              ).opacity(ur)
            : txt('Sum = ?', 485, 165, 48, COSMOS.dim, 'mono'),
        ).opacity(v1),
      );
    }

    // View 2 (Beat 2): Edge patch (same sum = 6) -> 0 + 3 = 3
    const v2 = fadeIn(b2);
    if (v2 > 0.02) {
      const ec = eColP.value;
      const er = eResP.value;
      nodes.push(
        group(
          txt('EDGE PATCH (SUM = 6)', -550, -195, 28, ROLE.window, 'mono'),
          matrixGrid(EDGE_PATCH, -550, 35, { cellSize: 108, gap: 9, fontSize: 34 }),
          txt('x', -320, 35, 48, COSMOS.muted, 'mono'),
          txt('EDGE KERNEL', -90, -195, 28, ROLE.kernel, 'mono'),
          matrixGrid(KERNEL, -90, 35, {
            cellSize: 108,
            gap: 9,
            fontSize: 38,
            kind: 'kernel',
          }),
          txt('COLUMN CONTRIBUTIONS', 485, -195, 28, COSMOS.muted, 'mono'),
          txt('Left (-1 x 3 x 0)', 210, -95, 28, ROLE.neg, 'mono', 'left'),
          glowBar(540, -95, 8, 42, ROLE.neg, { glow: 4, opacity: 0.45 }),
          txt('0', 575, -95, 34, COSMOS.muted, 'mono', 'left').opacity(clamp01(ec * 1.4)),
          txt('Right (+1 x 3 x 1)', 210, 5, 28, ROLE.pos, 'mono', 'left'),
          glowBar(540, 5, mix(10, 245, ec), 42, ROLE.pos, { glow: 10 }),
          txt('+3', 805, 5, 34, ROLE.pos, 'mono', 'left').opacity(clamp01(ec * 1.4)),
          rule(210, 88, 820, 88, '#2d3f68', 2.5),
          er > 0.05
            ? group(
                txt('0 + 0 + 3 = 3', 485, 165, 52, ROLE.pos, 'mono').glow(12, ROLE.pos),
                txt(
                  'Edge fires strongly; training learns weights via backprop',
                  485,
                  245,
                  28,
                  COSMOS.ink,
                  'serif',
                ),
              ).opacity(er)
            : txt('Sum = ?', 485, 165, 48, COSMOS.dim, 'mono'),
        ).opacity(v2),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'kernel-left', kLeft, 1, { dur: 0.5 });
  cueTo(s, c, 'kernel-center', kCenter, 1, { dur: 0.5 });
  cueTo(s, c, 'kernel-right', kRight, 1, { dur: 0.5 });
  beatTo(s, c, 1, beat1P, 1, { dur: 0.6 });
  cueTo(s, c, 'uniform-columns', uColP, 1, { dur: 0.9 });
  cueTo(s, c, 'uniform-result', uResP, 1, { after: true, dur: 0.45 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.6 });
  cueTo(s, c, 'edge-columns', eColP, 1, { dur: 0.9 });
  cueTo(s, c, 'edge-result', eResP, 1, { after: true, dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 4. patch: Follow one response into its map cell
// Cues: patch-accumulate, patch-deposit, uniform-question
// ---------------------------------------------------------------------------
export function patch(s, c) {
  const accP = s.value(0);
  const depP = s.value(0);
  const qP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 4 }));
  s.add(decorAura(-480, 40, 440, '#ffd1661c', '#07091000'));
  s.add(decorAura(520, 40, 440, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Nine Products to', 'One Map Cell'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.pos,
    eyebrow: 'ELEMENTWISE MULTIPLY & SUM  ·  FEATURE MAP DEPOSIT',
  });

  const live = dynamic(() => {
    const acc = accP.value;
    const dep = depP.value;
    const q = qP.value;
    const nodes = [];

    const winCol = q > 0.15 ? 2 : 0;
    const snap = q > 0.15 ? patchSnapshot(2, 1) : patchSnapshot(0, acc);

    // Left: 5x5 input panel with sliding window (col 0 -> col 2 on beat 2)
    const inX = -610;
    const inY = 55;
    const inSz = 78;
    const inGap = 7;
    nodes.push(
      txt('5x5 IMAGE', inX, -195, 28, ROLE.input, 'mono'),
      matrixGrid(IMAGE, inX, inY, { cellSize: inSz, gap: inGap, fontSize: 30 }),
      windowBox(inX, inY, 5, 5, 0, Math.round(mix(0, 2, q)), 3, 3, {
        cellSize: inSz,
        gap: inGap,
        color: ROLE.window,
        width: 4.5,
        glow: 11,
      }),
    );

    // Middle: 3x3 elementwise products + running subtotal
    const midX = 10;
    const midY = 55;
    const pSz = 92;
    const pGap = 8;
    const prodVals = snap.products.map((row, r) =>
      row.map((v, col) => (r * 3 + col < snap.count ? v : '')),
    );
    const activeCellIdx = snap.count > 0 && snap.count <= 9 ? snap.count - 1 : -1;
    const hiCells =
      activeCellIdx >= 0 && q < 0.15 ? [[Math.floor(activeCellIdx / 3), activeCellIdx % 3]] : null;

    nodes.push(
      txt(
        q > 0.15 ? 'WINDOW C PRODUCTS (BRIGHT)' : 'PIXEL x WEIGHT PRODUCTS',
        midX,
        -195,
        28,
        ROLE.kernel,
        'mono',
      ),
      matrixGrid(prodVals, midX, midY, {
        cellSize: pSz,
        gap: pGap,
        fontSize: 32,
        kind: 'feature',
        highlightCells: hiCells,
        formatter: (v) => (v === '' ? '' : fmtSigned(v, 0)),
      }),
      txt(
        q > 0.15 ? 'Sum = -3 + 0 + 3 = 0' : `Running sum = ${snap.subtotal}`,
        midX,
        265,
        38,
        q > 0.15 ? ROLE.window : ROLE.pos,
        'mono',
      ).glow(8, q > 0.15 ? ROLE.window : ROLE.pos),
    );

    // Right: 3x3 feature map (cell (0,0) fills only when dep arrives!)
    const mapX = 610;
    const mapY = 55;
    const mSz = 96;
    const mGap = 9;
    const mapVals = MAP.map((row, r) =>
      row.map((v, col) => (r === 0 && col === 0 && dep >= 0.92 ? v : '?')),
    );
    nodes.push(
      txt('3x3 FEATURE MAP', mapX, -195, 28, ROLE.pos, 'mono'),
      matrixGrid(mapVals, mapX, mapY, {
        cellSize: mSz,
        gap: mGap,
        fontSize: 36,
        kind: 'feature',
        visibleMask: (r, col) => r === 0 && col === 0 && dep >= 0.92,
        highlightCells: dep >= 0.92 && q < 0.15 ? [[0, 0]] : null,
      }),
    );

    // Flying photon arrow carrying sum 3 to cell (0,0)
    const [tx, ty] = cellPos(mapX, mapY, 3, 3, 0, 0, mSz, mGap);
    if (dep > 0.02 && dep < 0.98 && q < 0.15) {
      const fx = midX + 165;
      const fy = midY - 70;
      const cx = mix(fx, tx - 52, dep);
      const cy = mix(fy, ty, dep) - Math.sin(dep * Math.PI) * 75;
      nodes.push(
        line([fx, fy], [cx, cy], { stroke: ROLE.pos, width: 4 }).glow(9, ROLE.pos),
        glowDot(cx, cy, { radius: 13, color: ROLE.pos, glow: 14 }),
        txt('3', cx, cy - 36, 32, ROLE.pos, 'mono'),
      );
    }

    // Bottom prompt
    nodes.push(
      txt(
        q > 0.15
          ? 'Third window gives 0. Which cell of the 3x3 map gets that zero?'
          : dep >= 0.92
            ? 'Top-left window deposits 3 into top-left cell (0, 0)'
            : 'All 9 pixel-weight products accumulate into one scalar',
        0,
        365,
        32,
        q > 0.15 ? ROLE.window : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'patch-accumulate', accP, 1, { dur: 2.2 });
  cueTo(s, c, 'patch-deposit', depP, 1, { dur: 0.9 });
  cueTo(s, c, 'uniform-question', qP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 5. slide: Reuse the same weights at every position (SIGNATURE 3D HEIGHTFIELD)
// Cues: bright-window-result*, sliding-sweep, map-complete
// ---------------------------------------------------------------------------
export function slide(s, c) {
  const brightP = s.value(0);
  const sweepP = s.value(0);
  const doneP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 5 }));
  s.add(decorAura(430, 30, 520, '#6ee7b71e', '#5ce1e614'));

  // 3D orbiting glowing feature-map landscape on the right!
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.05,
    distance: 14.8,
    unit: 110,
    focus: [0, 0, 0.7],
  }).at(480, 45);

  const featSurface = surface(
    (u, v) => {
      // Smooth 3x3 ridge plateau matching MAP = [[3,3,0],[3,3,0],[3,3,0]]
      const colCoord = ((u + 2.2) / 4.4) * 2.99;
      const edgeFalloff = 1 / (1 + Math.exp((colCoord - 1.9) * 5.2));
      return edgeFalloff * 2.1 * (0.35 + 0.65 * sweepP.value);
    },
    {
      x: [-2.2, 2.2],
      y: [-2.2, 2.2],
      resolution: [26, 26],
      colors: ['#0a1228', '#153459', '#1e7b8c', '#5ce1e6', '#6ee7b7', '#ffd166'],
      mesh: '#8ef5d4',
      meshOpacity: 0.2,
      meshWidth: 0.6,
      opacity: 0.9,
    },
  );

  const activeMarker3d = point3d(
    () => {
      const snap = scanSnapshot(IMAGE, KERNEL, sweepP.value);
      const [or, oc] = snap.output;
      const u = -1.45 + oc * 1.45;
      const v = -1.45 + or * 1.45;
      const h = (MAP[or][oc] / 3) * 2.1 * (0.35 + 0.65 * sweepP.value) + 0.18;
      return [u, v, h];
    },
    { color: ROLE.window, radius: 11, glow: 14 },
  );

  const slabEdges = wireframeSlab3d(
    () => {
      const snap = scanSnapshot(IMAGE, KERNEL, sweepP.value);
      const [or, oc] = snap.output;
      return [-1.45 + oc * 1.45, -1.45 + or * 1.45, 0.25];
    },
    0.58,
    0.58,
    0.16,
    { color: ROLE.window, width: 2.6, glow: 8 },
  );

  view3d.add(featSurface, ...slabEdges, activeMarker3d);

  const headline = heroTitle(['Weight Sharing:', 'One Kernel, Every Stop'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.pos,
    eyebrow: '5x5 INPUT  ·  SAME 9 WEIGHTS  ·  3x3 FEATURE MAP',
  });

  const live = dynamic(() => {
    const br = brightP.value;
    const sw = sweepP.value;
    const dn = doneP.value;
    const snap = scanSnapshot(IMAGE, KERNEL, sw);
    const nodes = [];

    // Left: 5x5 panel with gliding window
    const inX = -610;
    const inY = 30;
    const inSz = 78;
    const inGap = 7;
    const winR = sw < 0.02 ? 0 : snap.active[0];
    const winC = sw < 0.02 ? (br > 0.1 ? 2 : 2) : snap.active[1];
    nodes.push(
      txt('5x5 IMAGE', inX, -210, 28, ROLE.input, 'mono'),
      matrixGrid(IMAGE, inX, inY, { cellSize: inSz, gap: inGap, fontSize: 30 }),
      windowBox(inX, inY, 5, 5, winR, winC, 3, 3, {
        cellSize: inSz,
        gap: inGap,
        color: ROLE.window,
        width: 4.6,
        glow: 12,
      }),
    );

    // Center-left: Persistent shared 3x3 kernel + 3x3 output map stacked cleanly
    const kX = -150;
    const kY = -95;
    nodes.push(
      txt('SAME 9 WEIGHTS', kX, -235, 26, ROLE.kernel, 'mono'),
      matrixGrid(KERNEL, kX, kY, {
        cellSize: 66,
        gap: 6,
        fontSize: 28,
        kind: 'kernel',
      }),
    );

    const mX = -150;
    const mY = 215;
    const visibleSet = new Set([0]); // (0,0) already known from previous scene
    if (br > 0.2) visibleSet.add(2); // top-right (0,2) = 0 revealed on bright-window-result!
    for (const idx of snap.visible) visibleSet.add(idx);

    nodes.push(
      txt('3x3 FEATURE MAP', mX, 55, 26, ROLE.pos, 'mono'),
      matrixGrid(MAP, mX, mY, {
        cellSize: 72,
        gap: 7,
        fontSize: 32,
        kind: 'feature',
        visibleMask: (r, col) => visibleSet.has(r * 3 + col),
        highlightCells: sw > 0.02 ? [snap.output] : br > 0.2 ? [[0, 2]] : null,
      }),
    );

    // Bottom right label under 3D surface
    nodes.push(
      txt('3D RESPONSE SURFACE  (3x3 STARTS)', 480, 355, 26, COSMOS.muted, 'mono'),
      txt(
        dn > 0.2
          ? 'Local connectivity + weight sharing = 1 filter for all 9 stops'
          : 'Same 9 weights sweep all 3x3 valid positions',
        -100,
        405,
        30,
        dn > 0.2 ? ROLE.pos : ROLE.window,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(view3d, headline, live);
  orbitScene(s, c, view3d, { theta: -0.28, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'bright-window-result', brightP, 1, { after: true, dur: 0.45 });
  cueTo(s, c, 'sliding-sweep', sweepP, 1, { dur: 2.8 });
  cueTo(s, c, 'map-complete', doneP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 6. article-crop: Which window fits the bright mark?
// Cues: crop-weights, crop-shape, crop-start*, crop-top, crop-middle,
//       crop-bottom, crop-sum, crop-weight-edit, crop-weight-delta,
//       crop-restore, crop-map, crop-max, crop-orientation
// ---------------------------------------------------------------------------
export function articleCrop(s, c) {
  const wtP = s.value(0);
  const shapeP = s.value(0);
  const startP = s.value(0);
  const topP = s.value(0);
  const midP = s.value(0);
  const botP = s.value(0);
  const sumP = s.value(0);
  const editP = s.value(0);
  const deltaP = s.value(0);
  const restP = s.value(0);
  const mapP = s.value(0);
  const maxP = s.value(0);
  const oriP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 6 }));
  s.add(decorAura(-480, 40, 460, '#5ce1e61a', '#07091000'));
  s.add(decorAura(430, 40, 460, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Worked 4x4 Crop &', 'Horizontal Ridge Stencil'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: 'CROSS-CORRELATION BY HAND  ·  ZERO BIAS',
  });

  const baseRaw = correlate(ARTICLE_CROP, RIDGE);
  const editedKernel = RIDGE.map((r) => [...r]);
  editedKernel[0][0] = 0;

  const live = dynamic(() => {
    const isEdited = editP.value > 0.3 && restP.value < 0.5;
    const activeK = isEdited ? editedKernel : RIDGE;
    const scanIdx = Math.min(3, Math.floor(mapP.value * 3.99));
    const winR = mapP.value > 0.05 ? Math.floor(scanIdx / 2) : 0;
    const winC = mapP.value > 0.05 ? scanIdx % 2 : 0;
    const nodes = [];

    // Left: 4x4 camera crop with glowing 3x3 sliding window
    const cX = -595;
    const cY = 45;
    const cSz = 98;
    const cGap = 8;
    nodes.push(
      txt('4x4 PANEL CROP', cX, -205, 28, ROLE.input, 'mono'),
      matrixGrid(ARTICLE_CROP, cX, cY, {
        cellSize: cSz,
        gap: cGap,
        fontSize: 28,
        digits: 2,
      }),
      windowBox(cX, cY, 4, 4, winR, winC, 3, 3, {
        cellSize: cSz,
        gap: cGap,
        color: ROLE.window,
        width: 4.8,
        glow: 12,
        opacity: mix(0.65, 1, startP.value),
      }),
      txt(
        startP.value > 0.2
          ? '2 starts across x 2 down = 2x2 map'
          : shapeP.value > 0.1
            ? 'How many places can 3x3 fit in 4x4?  ?'
            : 'Bright 2x2 defect on dark panel',
        cX,
        305,
        28,
        startP.value > 0.2 ? ROLE.kernel : ROLE.window,
        'mono',
      ),
    );

    // Center: 3x3 Horizontal Ridge Kernel (shows w[0][0] flipping -0.6 -> 0 -> -0.6)
    const kX = -95;
    const kY = 15;
    const kSz = 92;
    const kGap = 8;
    nodes.push(
      txt(
        oriP.value > 0.2 ? 'SYMMETRIC UNDER 180° FLIP' : '3x3 RIDGE STENCIL',
        kX,
        -205,
        26,
        oriP.value > 0.2 ? ROLE.channel : ROLE.kernel,
        'mono',
      ),
      matrixGrid(activeK, kX, kY, {
        cellSize: kSz,
        gap: kGap,
        fontSize: 28,
        digits: 1,
        kind: 'kernel',
        highlightCells: isEdited ? [[0, 0]] : null,
      }),
      txt(
        isEdited
          ? 'w[0,0]: -0.6 -> 0  (+0.030)'
          : wtP.value > 0.2
            ? 'Row 1: +1.1   Rows 0,2: -0.6'
            : 'Compares horizontal rows',
        kX,
        220,
        26,
        isEdited ? ROLE.window : COSMOS.muted,
        'mono',
      ),
    );

    // Right side switches cleanly via non-overlapping crossfade between
    // (A) Row-by-row contribution bars + weight edit (Beats 0-2)
    // (B) Complete 2x2 feature map scan + PyTorch cross-correlation note (Beat 3)
    const showMap = fadeIn(restP.value);
    const showBars = fadeOut(restP.value);

    if (showBars > 0.02) {
      const rx = 215;
      const topVal = isEdited ? -0.084 : -0.114;
      const totalVal = isEdited ? 0.882 : 0.852;
      nodes.push(
        group(
          txt('UPPER-LEFT ROW CONTRIBUTIONS', 515, -205, 28, COSMOS.muted, 'mono'),
          // Row 0 bar
          txt('Top row (-0.6)', rx, -110, 26, ROLE.neg, 'mono', 'left'),
          glowBar(rx + 250, -110, mix(6, 48, topP.value), 36, ROLE.neg, { glow: 7 }),
          txt(
            topP.value > 0.15 ? fmtSigned(topVal, 3) : '...',
            rx + 320,
            -110,
            30,
            ROLE.neg,
            'mono',
            'left',
          ),
          // Row 1 bar
          txt('Mid row (+1.1)', rx, -25, 26, ROLE.pos, 'mono', 'left'),
          glowBar(rx + 250, -25, mix(6, 260, midP.value), 36, ROLE.pos, { glow: 10 }),
          txt(midP.value > 0.15 ? '+2.112' : '...', rx + 530, -25, 30, ROLE.pos, 'mono', 'left'),
          // Row 2 bar
          txt('Bot row (-0.6)', rx, 60, 26, ROLE.neg, 'mono', 'left'),
          glowBar(rx + 250, 60, mix(6, 155, botP.value), 36, ROLE.neg, { glow: 7 }),
          txt(botP.value > 0.15 ? '-1.146' : '...', rx + 425, 60, 30, ROLE.neg, 'mono', 'left'),
          rule(rx, 128, 835, 128, '#2d3f68', 2.5),
          sumP.value > 0.15
            ? group(
                txt(
                  `y[0,0] = ${totalVal.toFixed(3)}`,
                  515,
                  195,
                  50,
                  isEdited ? ROLE.window : ROLE.pos,
                  'mono',
                ).glow(10, isEdited ? ROLE.window : ROLE.pos),
                txt(
                  deltaP.value > 0.2
                    ? '0.05 x (+0.6) = +0.030  ->  0.852 + 0.030 = 0.882'
                    : isEdited
                      ? '-0.084 + 2.112 - 1.146 = 0.882'
                      : '-0.114 + 2.112 - 1.146 = 0.852',
                  515,
                  268,
                  26,
                  COSMOS.ink,
                  'mono',
                ),
              )
            : txt('Sum of 3 row terms = ?', 515, 195, 34, COSMOS.dim, 'mono'),
        ).opacity(showBars),
      );
    }

    if (showMap > 0.02) {
      const mX = 515;
      const mY = 15;
      const filled = Math.max(1, Math.min(4, 1 + Math.floor(mapP.value * 3.2)));
      nodes.push(
        group(
          txt('2x2 FEATURE MAP', mX, -205, 28, ROLE.pos, 'mono'),
          matrixGrid(baseRaw, mX, mY, {
            cellSize: 132,
            gap: 12,
            fontSize: 34,
            digits: 3,
            kind: 'feature',
            revealCount: filled,
            highlightCells: maxP.value > 0.2 ? [[1, 1]] : [[winR, winC]],
          }),
          txt(
            oriP.value > 0.2
              ? 'PyTorch slides unflipped (cross-correlation)'
              : maxP.value > 0.2
                ? 'Peak response: 0.874 at bottom right (1, 1)'
                : 'Scanning all 4 valid offsets with restored weights',
            mX,
            245,
            28,
            maxP.value > 0.2 ? ROLE.pos : ROLE.window,
            'serif',
          ),
        ).opacity(showMap),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'crop-weights', wtP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-shape', shapeP, 1, { dur: 0.5 });
  cueTo(s, c, 'crop-start', startP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'crop-top', topP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-middle', midP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-bottom', botP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-sum', sumP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-weight-edit', editP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-weight-delta', deltaP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-restore', restP, 1, { dur: 0.65 });
  cueTo(s, c, 'crop-map', mapP, 1, { dur: 1.4 });
  cueTo(s, c, 'crop-max', maxP, 1, { dur: 0.55 });
  cueTo(s, c, 'crop-orientation', oriP, 1, { dur: 0.55 });
}
