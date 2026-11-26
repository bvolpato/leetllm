// Act 2 (Scenes 7-12): Parameter Sharing Budget, Translation Equivariance & Stride-2 Phase,
// Stride & Padding Geometry, Dilation Footprint, 3D Multi-Channel Tensor Stack, Grouped Connectivity.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CONV_16_PARAMS,
  COSMOS,
  DENSE_224_PARAMS,
  GROUPED_4_6_PARAMS,
  HORIZONTAL,
  IMAGE,
  KERNEL,
  MAP,
  PADDED_ORDER,
  PRIVATE_222_PARAMS,
  ROLE,
  beatTo,
  cellPos,
  channelSnapshot,
  cinemaGrid,
  cinematic3d,
  clamp01,
  correlate,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  heroTitle,
  line3d,
  livingDrift,
  matrixGrid,
  mix,
  numCell,
  orbitScene,
  rule,
  scaleTrack,
  scanSnapshot,
  stridePaddingFrame,
  txt,
  windowBox,
  wireframeSlab3d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. sharing-budget: Who owns the filter weights?
// Cues: sharing-budget-b1, dense-budget, conv-budget, sharing-budget-b2,
//       private-banks, retie-banks, retie-count, sharing-budget-b3, local-shift
// ---------------------------------------------------------------------------
export function sharingBudget(s, c) {
  const b1P = s.value(0);
  const denseP = s.value(0);
  const convP = s.value(0);
  const b2P = s.value(0);
  const privP = s.value(0);
  const retieP = s.value(0);
  const countP = s.value(0);
  const b3P = s.value(0);
  const shiftP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pos, seed: 7 }));
  s.add(decorAura(-420, 40, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(420, 40, 500, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Local Connectivity &', 'Weight Sharing Budget'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pos,
    eyebrow: '224x224x3 RGB PHOTO  ·  WHO OWNS THE FILTER WEIGHTS?',
  });

  const live = dynamic(() => {
    const b2 = b2P.value;
    const b3 = b3P.value;
    const nodes = [];

    // View 0 (Beats 0-1): Parameter log-scale bars + private-to-shared bank re-tie animation
    const v0 = fadeOut(b3);
    if (v0 > 0.02) {
      const dn = denseP.value;
      const cv = convP.value;
      const pv = privP.value;
      const rt = retieP.value;
      const rc = countP.value;
      const logMax = Math.log10(DENSE_224_PARAMS);
      const maxBarW = 640;
      const logW = (n) => (Math.log10(Math.max(10, n)) / logMax) * maxBarW;

      const lx = -840;
      nodes.push(
        group(
          txt('PARAMETER COUNT (LOG10 SCALE)', lx, -205, 28, COSMOS.muted, 'mono', 'left'),
          // Dense bar
          txt('Dense 224x224x3 -> 256', lx, -110, 28, ROLE.neg, 'mono', 'left'),
          scaleTrack(lx, -55, maxBarW, 46, { radius: 10 }),
          glowBar(lx, -55, mix(30, logW(DENSE_224_PARAMS), dn), 46, ROLE.neg, { glow: 10 }),
          txt(
            dn > 0.2 ? '38,535,424' : '150,528 x 256 + 256',
            lx + maxBarW + 22,
            -55,
            30,
            ROLE.neg,
            'mono',
            'left',
          ),
          // Private unshared local banks bar (222x222 sites)
          txt('Private local banks (222x222 sites)', lx, 55, 28, ROLE.warm, 'mono', 'left').opacity(
            mix(0.35, 1, b2),
          ),
          scaleTrack(lx, 110, maxBarW, 46, { radius: 10 }).opacity(mix(0.35, 1, b2)),
          glowBar(
            lx,
            110,
            mix(logW(CONV_16_PARAMS), logW(PRIVATE_222_PARAMS), pv * (1 - rt)),
            46,
            rt > 0.5 ? ROLE.pos : ROLE.warm,
            { glow: 9, opacity: mix(0.35, 1, b2) },
          ),
          txt(
            rt > 0.5 ? '448  (RE-TIED)' : pv > 0.25 ? '22,079,232' : '49,284 x 448',
            lx + maxBarW + 22,
            110,
            30,
            rt > 0.5 ? ROLE.pos : ROLE.warm,
            'mono',
            'left',
          )
            .glow(rc > 0.2 ? 9 : 0, ROLE.pos)
            .opacity(mix(0.35, 1, b2)),
          // Shared conv bank bar
          txt('Shared Conv2d (16 x 3x3x3 + 16)', lx, 220, 28, ROLE.pos, 'mono', 'left'),
          scaleTrack(lx, 275, maxBarW, 46, { radius: 10 }),
          glowBar(lx, 275, mix(14, logW(CONV_16_PARAMS), cv), 46, ROLE.pos, { glow: 11 }),
          txt(
            cv > 0.2 ? '448  (86,017x smaller)' : '16 filters',
            lx + maxBarW + 22,
            275,
            30,
            ROLE.pos,
            'mono',
            'left',
          ),
          // Right side: Visual 3x3 grid of output sites whose filter banks expand then converge into 1 shared owner!
          txt(
            rt > 0.5
              ? 'ONE SHARED FILTER BANK'
              : pv > 0.25
                ? 'PRIVATE BANK PER SITE'
                : 'LOCAL 16-FILTER BANK',
            475,
            -205,
            28,
            rt > 0.5 ? ROLE.pos : pv > 0.25 ? ROLE.warm : ROLE.kernel,
            'mono',
          ),
          ...Array.from({ length: 9 }, (_, i) => {
            const r = Math.floor(i / 3);
            const col = i % 3;
            const siteX = 325 + col * 150;
            const siteY = -85 + r * 120;
            const spread = pv * (1 - rt);
            const bankX = mix(475, siteX, spread);
            const bankY = mix(35, siteY, spread);
            const activeCol = rt > 0.5 ? ROLE.pos : pv > 0.25 ? ROLE.warm : ROLE.kernel;
            return group(
              line([siteX, siteY], [bankX, bankY], {
                stroke: activeCol,
                width: 2.2,
                dash: rt > 0.5 ? [6, 5] : null,
              }).opacity(0.65),
              circle(10, { fill: '#10182b', stroke: COSMOS.muted, width: 2 }).at(siteX, siteY),
              rect(72, 44, {
                fill: rt > 0.5 ? '#0e2d24' : '#182138',
                stroke: activeCol,
                width: 2.4,
                radius: 8,
              })
                .at(bankX, bankY)
                .opacity(spread < 0.08 && i !== 4 ? 0 : 1),
            );
          }),
          txt(
            rt > 0.5
              ? 'Shared owner: 448 params'
              : pv > 0.25
                ? '49,284 private copies'
                : 'Shared bank: 448 params',
            475,
            260,
            28,
            rt > 0.5 ? ROLE.pos : pv > 0.25 ? ROLE.warm : ROLE.kernel,
            'mono',
          ),
          txt(
            rt > 0.35
              ? 'Same 16x222x222 shape, 448 shared weights'
              : 'Local window limits inputs; sharing limits weight copies',
            475,
            345,
            28,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(v0),
      );
    }

    // View 1 (Beat 2): Local 3x3 window shifting 1 pixel right through the SAME shared bank
    const v1 = fadeIn(b3);
    if (v1 > 0.02) {
      const sh = shiftP.value;
      const inX = -520;
      const inY = 45;
      const sz = 82;
      const gap = 8;
      const bankX = 110;
      const bankY = 45;
      const outX = 620;
      const outY = 45;

      // Rays from active 3x3 window center to shared bank
      const [wx, wy] = cellPos(inX, inY, 5, 5, 2, 2 + sh, sz, gap);
      nodes.push(
        group(
          txt('LOCAL WINDOW SHIFTS 1 PX', inX, -210, 28, ROLE.window, 'mono'),
          matrixGrid(IMAGE, inX, inY, {
            cellSize: sz,
            gap,
            showValues: false,
          }),
          windowBox(inX, inY, 5, 5, 1, 1 + sh, 3, 3, {
            cellSize: sz,
            gap,
            color: ROLE.window,
            width: 5,
            glow: 13,
          }),
          // Routing beam to single shared filter bank
          arrow([wx + 125, wy], [bankX - 145, bankY], {
            stroke: ROLE.kernel,
            width: 4,
            headSize: 16,
          }).glow(8, ROLE.kernel),
          txt('ONE SHARED BANK', bankX, -155, 28, ROLE.kernel, 'mono'),
          matrixGrid(KERNEL, bankX, bankY, {
            cellSize: 78,
            gap: 8,
            fontSize: 30,
            kind: 'kernel',
          }),
          arrow([bankX + 145, bankY], [outX - 110, outY], {
            stroke: ROLE.pos,
            width: 4,
            headSize: 16,
          }).glow(8, ROLE.pos),
          txt('OUTPUT SITE', outX, -155, 28, ROLE.pos, 'mono'),
          numCell(sh > 0.5 ? 'y(1,2)' : 'y(1,1)', outX, outY, {
            w: 185,
            h: 96,
            size: 36,
            stroke: ROLE.pos,
            textColor: ROLE.pos,
            glow: 11,
          }),
          txt(
            'Same shared filter bank reads each shifted 3x3 window',
            0,
            345,
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
  cueTo(s, c, 'sharing-budget-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'dense-budget', denseP, 1, { dur: 0.85 });
  cueTo(s, c, 'conv-budget', convP, 1, { dur: 0.85 });
  cueTo(s, c, 'sharing-budget-b2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'private-banks', privP, 1, { dur: 0.9 });
  cueTo(s, c, 'retie-banks', retieP, 1, { dur: 0.9 });
  cueTo(s, c, 'retie-count', countP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'sharing-budget-b3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'local-shift', shiftP, 1, { dur: 1.0 });
}

// ---------------------------------------------------------------------------
// 8. translation: Does the peak follow the edge?
// Cues: translated-edge, max-aggregate, pair-read, pair-original, pair-shift,
//       pair-read-again, pair-peak*
// ---------------------------------------------------------------------------
export function translation(s, c) {
  const shiftImgP = s.value(0);
  const maxP = s.value(0);
  const beat2P = s.value(0);
  const readP = s.value(0);
  const origP = s.value(0);
  const pShiftP = s.value(0);
  const againP = s.value(0);
  const peakP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.input, seed: 8 }));
  s.add(decorAura(-440, 40, 460, '#60a5fa1c', '#07091000'));
  s.add(decorAura(440, 40, 480, '#ffd1661c', '#07091000'));

  const headline = heroTitle(['Translation Equivariance', 'vs. Stride-2 Phase'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.window,
    eyebrow: 'STRIDE-1 SHIFT  ·  GLOBAL MAX  ·  STRIDE-2 FAILURE',
  });

  const SHIFTED_IMAGE = Array.from({ length: 5 }, () => [0, 0, 0, 1, 1]);
  const SHIFTED_MAP = correlate(SHIFTED_IMAGE, KERNEL); // [[0, 3, 3], ...]

  const live = dynamic(() => {
    const b2 = beat2P.value;
    const nodes = [];

    // View 0 (Beats 0-1): 5x5 shifted edge + 3x3 equivariant map + global max box
    const v0 = fadeOut(b2);
    if (v0 > 0.02) {
      const sh = shiftImgP.value;
      const mx = maxP.value;
      const curImg = sh > 0.5 ? SHIFTED_IMAGE : IMAGE;
      const curMap = sh > 0.5 ? SHIFTED_MAP : MAP;
      const inX = -530;
      const inY = 30;
      const mX = 65;
      const mY = 30;
      const gX = 615;
      const gY = 30;

      nodes.push(
        group(
          txt('5x5 INPUT PANEL', inX, -205, 28, ROLE.input, 'mono'),
          matrixGrid(curImg, inX, inY, { cellSize: 80, gap: 7, fontSize: 30 }),
          arrow([inX + 245, inY], [mX - 185, mY], {
            stroke: ROLE.kernel,
            width: 4,
            headSize: 16,
          }),
          txt(
            sh > 0.5 ? 'MAP SHIFTS 1 COL RIGHT' : '3x3 FEATURE MAP',
            mX,
            -205,
            28,
            ROLE.pos,
            'mono',
          ),
          matrixGrid(curMap, mX, mY, {
            cellSize: 92,
            gap: 9,
            fontSize: 36,
            kind: 'feature',
            highlightCells:
              sh > 0.5
                ? [
                    [0, 1],
                    [0, 2],
                    [1, 1],
                    [1, 2],
                    [2, 1],
                    [2, 2],
                  ]
                : [
                    [0, 0],
                    [0, 1],
                    [1, 0],
                    [1, 1],
                    [2, 0],
                    [2, 1],
                  ],
          }),
          // Global max aggregator on right
          arrow([mX + 185, mY], [gX - 125, gY], {
            stroke: ROLE.pos,
            width: 4,
            headSize: 16,
          }).opacity(mix(0.3, 1, mx)),
          txt('GLOBAL MAX', gX, -155, 28, ROLE.pos, 'mono').opacity(mix(0.45, 1, mx)),
          numCell(mx > 0.2 ? '3' : 'max', gX, gY, {
            w: 170,
            h: 112,
            size: 54,
            stroke: ROLE.pos,
            textColor: ROLE.pos,
            glow: mx > 0.2 ? 14 : 4,
            opacity: mix(0.55, 1, mx),
          }),
          txt(
            mx > 0.2
              ? 'Peak holds at 3, but spatial address is gone'
              : 'Stride-1 equivariance: f(shift(x)) = shift(f(x))',
            0,
            345,
            32,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(v0),
      );
    }

    // View 1 (Beats 2-3): 1D 6-pixel strip with fixed stride-2 brackets [-1, +1]
    const v1 = fadeIn(b2);
    if (v1 > 0.02) {
      const ps = pShiftP.value;
      const ag = againP.value;
      const pk = peakP.value;
      const strip = ps > 0.5 ? [0, 0, 1, 1, 1, 1] : [0, 1, 1, 1, 1, 1];
      const resp = correlate([strip], [[-1, 1]], 2)[0]; // [1,0,0] then [0,0,0]

      const cSz = 112;
      const cGap = 14;
      const pitch = cSz + cGap;
      const rowY = -45;
      const startX = -((5 * pitch) / 2);

      nodes.push(
        group(
          txt(
            ps > 0.5
              ? 'EDGE SHIFTED +1 PX  ·  BRACKETS STAY FIXED (STRIDE 2)'
              : '6-PIXEL ROW  ·  KERNEL [-1, +1]  ·  STRIDE 2',
            0,
            -205,
            28,
            ps > 0.5 ? ROLE.window : ROLE.kernel,
            'mono',
          ),
          // 6 pixel cells
          ...strip.map((v, i) => {
            const px = startX + i * pitch;
            return numCell(String(v), px, rowY, {
              w: cSz,
              h: cSz,
              fill: v === 1 ? '#e2e0da' : '#12182b',
              stroke: v === 1 ? '#ffffff' : '#3a4e7a',
              textColor: v === 1 ? '#070910' : COSMOS.ink,
              size: 44,
              radius: 12,
            });
          }),
          // 3 fixed stride-2 pair brackets: (0,1), (2,3), (4,5)
          ...[0, 1, 2].map((pairIdx) => {
            const xL = startX + pairIdx * 2 * pitch - cSz / 2 - 6;
            const xR = startX + (pairIdx * 2 + 1) * pitch + cSz / 2 + 6;
            const midX = (xL + xR) / 2;
            const bCol =
              pairIdx === 0 && ps < 0.5 && origP.value > 0.2
                ? ROLE.pos
                : ps > 0.5 && pk > 0.2
                  ? ROLE.neg
                  : ROLE.kernel;
            const showAnswer = ps < 0.5 ? origP.value > 0.2 : pk > 0.15;
            const outLabel = showAnswer
              ? `${strip[pairIdx * 2 + 1]} - ${strip[pairIdx * 2]} = ${resp[pairIdx]}`
              : ps > 0.5
                ? ag > 0.3
                  ? `${strip[pairIdx * 2 + 1]} - ${strip[pairIdx * 2]} = ?`
                  : '?'
                : 'pair ' + (pairIdx + 1);
            return group(
              line([xL, rowY + 76], [xL, rowY + 104], { stroke: bCol, width: 4 }),
              line([xL, rowY + 104], [xR, rowY + 104], { stroke: bCol, width: 4 }).glow(8, bCol),
              line([xR, rowY + 76], [xR, rowY + 104], { stroke: bCol, width: 4 }),
              numCell(outLabel, midX, rowY + 185, {
                w: 225,
                h: 72,
                size: 32,
                stroke: bCol,
                textColor: showAnswer ? (resp[pairIdx] > 0 ? ROLE.pos : ROLE.neg) : ROLE.window,
                glow: showAnswer ? 9 : 0,
              }),
            ).opacity(mix(0.45, 1, readP.value));
          }),
          // Red gap marker between pixel 1 and pixel 2 after shift
          ps > 0.5
            ? group(
                line([startX + 1.5 * pitch, rowY - 82], [startX + 1.5 * pitch, rowY + 62], {
                  stroke: ROLE.neg,
                  width: 3.5,
                  dash: [7, 6],
                }),
                txt(
                  'edge sits between brackets',
                  startX + 1.5 * pitch,
                  rowY - 112,
                  26,
                  ROLE.neg,
                  'mono',
                ),
              )
            : group(),
          txt(
            pk > 0.2
              ? 'All three pairs match internally: [0, 0, 0] -> peak vanishes!'
              : ps > 0.5
                ? 'Edge moved 1 pixel right. Will the peak survive stride 2?'
                : origP.value > 0.2
                  ? 'First pair straddles 0 -> 1 and fires with +1'
                  : 'Stride-2 brackets read 3 fixed pairs across the row',
            0,
            340,
            32,
            pk > 0.2 ? ROLE.neg : ROLE.window,
            'serif',
          ),
        ).opacity(v1),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'translated-edge', shiftImgP, 1, { dur: 0.7 });
  cueTo(s, c, 'max-aggregate', maxP, 1, { dur: 0.85 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.65 });
  cueTo(s, c, 'pair-read', readP, 1, { dur: 0.55 });
  cueTo(s, c, 'pair-original', origP, 1, { dur: 0.55 });
  cueTo(s, c, 'pair-shift', pShiftP, 1, { dur: 0.75 });
  cueTo(s, c, 'pair-read-again', againP, 1, { dur: 0.55 });
  cueTo(s, c, 'pair-peak', peakP, 1, { after: true, dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 9. stride-padding: Where can the whole window fit?
// Cues: stride-scan, restore-stride, padding-build, boundary-calculate,
//       padded-sweep, shape-rule
// ---------------------------------------------------------------------------
export function stridePadding(s, c) {
  const scan2P = s.value(0);
  const restP = s.value(0);
  const padP = s.value(0);
  const bndP = s.value(0);
  const sweepP = s.value(0);
  const ruleP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 9 }));
  s.add(decorAura(-440, 30, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(450, 30, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Stride & Zero Padding:', 'Output Size Geometry'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: 'STRIDE S = 2  ·  PADDING P = 1  ·  VALID STARTS',
  });

  const live = dynamic(() => {
    const s2 = scan2P.value;
    const rs = restP.value;
    const pd = padP.value;
    const bn = bndP.value;
    const sw = sweepP.value;
    const rl = ruleP.value;
    const nodes = [];

    const inX = -465;
    const inY = 45;
    const outX = 435;
    const outY = 10;

    // Mode 0: Stride 2 on 5x5 -> 2x2 map
    // Mode 1: Padded 7x7 (with cyan zero ring growing in) -> 5x5 map
    const isPaddedMode = pd > 0.05;
    if (!isPaddedMode) {
      const snap =
        rs > 0.35 ? scanSnapshot(IMAGE, KERNEL, 1, { stride: 1 }) : stridePaddingFrame(0, s2);
      const cellSz = 82;
      const gap = 8;
      nodes.push(
        txt(
          rs > 0.35 ? 'STRIDE 1 RESTORED (5x5)' : 'STRIDE 2 ON 5x5 IMAGE',
          inX,
          -210,
          28,
          ROLE.window,
          'mono',
        ),
        matrixGrid(IMAGE, inX, inY, { cellSize: cellSz, gap, fontSize: 30 }),
        windowBox(inX, inY, 5, 5, snap.active[0], snap.active[1], 3, 3, {
          cellSize: cellSz,
          gap,
          color: ROLE.window,
          width: 4.8,
          glow: 12,
        }),
        txt(
          rs > 0.35 ? '3x3 OUTPUT (S=1, P=0)' : '2x2 OUTPUT (S=2, P=0)',
          outX,
          -210,
          28,
          ROLE.pos,
          'mono',
        ),
        matrixGrid(snap.result, outX, outY, {
          cellSize: rs > 0.35 ? 104 : 132,
          gap: 10,
          fontSize: 38,
          kind: 'feature',
          revealCount: rs > 0.35 ? 9 : Math.max(1, snap.count),
          highlightCells: [snap.output],
        }),
        txt(
          rs > 0.35
            ? 'Back to stride 1: 3 starts across x 3 starts down'
            : 'Stride 2 skips alternate starts: only 2x2 windows fit',
          outX,
          265,
          28,
          COSMOS.ink,
          'serif',
        ),
      );
    } else {
      const snap = sw > 0.02 ? stridePaddingFrame(2, sw) : stridePaddingFrame(1, bn);
      const cellSz = 66;
      const gap = 6;
      const visibleSet = new Set();
      if (bn > 0.5) visibleSet.add(PADDED_ORDER[0]); // top border cell (0,2) = 2
      if (sw > 0.02) {
        for (const idx of snap.visible) visibleSet.add(idx);
      }

      nodes.push(
        txt('7x7 PADDED INPUT  (5x5 + P=1 RING)', inX, -235, 28, ROLE.kernel, 'mono'),
        matrixGrid(snap.input, inX, inY + 10, {
          cellSize: cellSz,
          gap,
          fontSize: 26,
          padded: true,
          paddingOpacity: pd,
        }),
        windowBox(inX, inY + 10, 7, 7, snap.active[0], snap.active[1], 3, 3, {
          cellSize: cellSz,
          gap,
          color: ROLE.window,
          width: 4.5,
          glow: 11,
        }),
        txt('5x5 PADDED OUTPUT  (S=1, P=1)', outX, -235, 28, ROLE.pos, 'mono'),
        matrixGrid(snap.result, outX, outY - 5, {
          cellSize: 72,
          gap: 7,
          fontSize: 28,
          kind: 'feature',
          visibleMask: (r, col) => visibleSet.has(r * 5 + col),
          highlightCells: [snap.output],
        }),
      );

      if (rl > 0.1) {
        nodes.push(
          glowTex('W_{\\text{out}} = \\left\\lfloor \\frac{W + 2P - K}{S} \\right\\rfloor + 1', {
            x: outX,
            y: 300,
            size: 40,
            color: ROLE.window,
          }).opacity(rl),
        );
      } else {
        nodes.push(
          txt(
            bn > 0.4
              ? 'Top window overhangs padding: 2 bright pixels x (+1) = 2'
              : 'Adding 1 ring of zeros widens 5 -> 7 cells',
            outX,
            290,
            28,
            bn > 0.4 ? ROLE.window : ROLE.kernel,
            'serif',
          ),
        );
      }
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'stride-scan', scan2P, 1, { dur: 1.5 });
  cueTo(s, c, 'restore-stride', restP, 1, { dur: 0.6 });
  cueTo(s, c, 'padding-build', padP, 1, { dur: 0.85 });
  cueTo(s, c, 'boundary-calculate', bndP, 1, { dur: 0.9 });
  cueTo(s, c, 'padded-sweep', sweepP, 1, { dur: 2.2 });
  cueTo(s, c, 'shape-rule', ruleP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 10. shape-dilation: Count starts using the complete kernel footprint
// Cues: shape-dilation-b1, dilate-weights, shape-dilation-b2, dilated-starts,
//       shape-dilation-b3, same-padding
// ---------------------------------------------------------------------------
export function shapeDilation(s, c) {
  const b1P = s.value(0);
  const dilP = s.value(0);
  const b2P = s.value(0);
  const startsP = s.value(0);
  const b3P = s.value(0);
  const sameP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 10 }));
  s.add(decorAura(-440, 40, 480, '#fb923c1c', '#07091000'));
  s.add(decorAura(430, 40, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Dilation Footprint &', 'Valid Start Counting'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'EFFECTIVE SPAN D(K - 1) + 1  ·  SAME & VALID PADDING',
  });

  const live = dynamic(() => {
    const dl = dilP.value;
    const b2 = b2P.value;
    const st = startsP.value;
    const b3 = b3P.value;
    const sm = sameP.value;
    const nodes = [];

    // Left: Persistent 7x7 lattice with 9 glowing kernel weights spreading from D=1 (3x3) -> D=2 (5x5)!
    const latX = -515;
    const latY = 55;
    const cSz = 66;
    const cGap = 6;
    const pitch = cSz + cGap;
    const gapFactor = 1 + dl; // 1 -> 2

    nodes.push(
      txt(
        dl > 0.5 ? 'D = 2  ·  SAME 9 WEIGHTS  ·  5x5 SPAN' : 'D = 1  ·  9 WEIGHTS  ·  3x3 SPAN',
        latX,
        -225,
        28,
        ROLE.warm,
        'mono',
      ),
    );
    // Faint 7x7 background lattice
    for (let r = 0; r < 7; r += 1) {
      for (let col = 0; col < 7; col += 1) {
        const [px, py] = cellPos(latX, latY, 7, 7, r, col, cSz, cGap);
        nodes.push(
          rect(cSz, cSz, { fill: '#0d1427', stroke: '#233154', width: 1.4, radius: 7 }).at(px, py),
        );
      }
    }
    // 9 glowing weights w1..w9 gliding cleanly outward around center (3,3)
    for (let r = 0; r < 3; r += 1) {
      for (let col = 0; col < 3; col += 1) {
        const gr = 3 + (r - 1) * gapFactor;
        const gc = 3 + (col - 1) * gapFactor;
        const [px, py] = cellPos(latX, latY, 7, 7, gr, gc, cSz, cGap);
        nodes.push(
          numCell(`w${r * 3 + col + 1}`, px, py, {
            w: cSz,
            h: cSz,
            fill: '#132a3c',
            stroke: ROLE.kernel,
            textColor: ROLE.kernel,
            size: 26,
            glow: 9,
            radius: 8,
          }),
        );
      }
    }
    // Dynamic outer footprint box spanning 3x3 -> 5x5
    const spanCells = 1 + 2 * gapFactor;
    const boxSide = (spanCells - 1) * pitch + cSz + 10;
    nodes.push(
      rect(boxSide, boxSide, { fill: null, stroke: ROLE.window, width: 4, radius: 12 })
        .at(latX, latY)
        .glow(11, ROLE.window),
    );

    // Right side crossfades cleanly across Beats 0, 1, 2
    const v0 = fadeOut(b2);
    const v1 = fadeIn(b2) * fadeOut(b3);
    const v2 = fadeIn(b3);

    if (v0 > 0.02) {
      nodes.push(
        group(
          txt('DILATION WIDENS REACH, NOT WEIGHT COUNT', 385, -195, 26, COSMOS.muted, 'mono'),
          txt(`Dilation D = ${gapFactor.toFixed(1)}`, 385, -100, 44, ROLE.kernel, 'mono'),
          txt('Stored weights = 9  (constant)', 385, -20, 34, ROLE.pos, 'mono'),
          txt(
            dl > 0.8 ? 'Effective footprint = 5 x 5' : 'Effective footprint = 3 x 3',
            385,
            60,
            40,
            ROLE.window,
            'mono',
          ).glow(dl > 0.8 ? 9 : 0, ROLE.window),
          glowTex('K_{\\text{eff}} = D(K - 1) + 1 = 2(3 - 1) + 1 = 5', {
            x: 385,
            y: 195,
            size: 38,
            color: ROLE.warm,
          }).opacity(mix(0.55, 1, b1P.value)),
        ).opacity(v0),
      );
    }

    if (v1 > 0.02) {
      // 28-pixel 1D row with sliding 5-pixel footprint and 24 green valid-start dots!
      const rx0 = -75;
      const step = 32;
      const rowY = -30;
      const nValid = Math.max(1, Math.min(24, Math.floor(st * 24.5)));
      const curStart = Math.min(23, nValid - 1);

      nodes.push(
        group(
          txt('28-PIXEL ROW  ·  K_eff = 5  ·  STRIDE 1', 360, -195, 28, ROLE.input, 'mono'),
          ...Array.from({ length: 28 }, (_, i) => {
            const x = rx0 + i * step;
            const isTail = i >= 24;
            return group(
              rect(26, 78, {
                fill: isTail ? '#2a1320' : '#121c33',
                stroke: isTail ? ROLE.neg : '#3a4e7a',
                width: 1.8,
                radius: 5,
              }).at(x, rowY),
              i < nValid
                ? glowDot(x, rowY + 72, { radius: 7, color: ROLE.pos, glow: 8 })
                : circle(5, { fill: null, stroke: isTail ? ROLE.neg : '#304064', width: 1.5 }).at(
                    x,
                    rowY + 72,
                  ),
            );
          }),
          // Sliding 5-pixel footprint bracket
          rect(5 * step - 4, 92, {
            fill: '#ffd16614',
            stroke: ROLE.window,
            width: 3.6,
            radius: 8,
          })
            .at(rx0 + (curStart + 2) * step, rowY)
            .glow(10, ROLE.window),
          txt(`Valid starts: ${nValid} / 24`, 210, 125, 36, ROLE.pos, 'mono'),
          txt('Last 4 too short', 665, 125, 28, ROLE.neg, 'mono'),
          glowTex(
            'W_{\\text{out}} = \\left\\lfloor \\frac{W + 2P - K_{\\text{eff}}}{S} \\right\\rfloor + 1 = 24',
            {
              x: 365,
              y: 255,
              size: 38,
              color: ROLE.window,
            },
          ),
        ).opacity(v1),
      );
    }

    if (v2 > 0.02) {
      // Stride-1 same-padding total = D(K-1) split left + right (even vs odd unequal split)
      const rx = 370;
      nodes.push(
        group(
          txt('SAME PADDING AT STRIDE 1', rx, -205, 30, ROLE.kernel, 'mono'),
          glowTex('P_{\\text{total}} = D(K - 1)', {
            x: rx,
            y: -115,
            size: 42,
            color: ROLE.window,
          }),
          // Even total split visual (D=2, K=3 -> 4 -> 2 + 2)
          txt('Even total (4):  2 left + 2 right', rx, -15, 28, ROLE.pos, 'mono'),
          glowBar(rx - 260, 42, 110, 36, ROLE.kernel, { glow: 7 }),
          glowBar(rx - 140, 42, 280, 36, ROLE.input, { glow: 4 }),
          glowBar(rx + 150, 42, 110, 36, ROLE.kernel, { glow: 7 }),
          // Odd total split visual (D=1, K=4 -> 3 -> 1 left + 2 right)
          txt(
            sm > 0.2
              ? 'Odd total (3):  1 left + 2 right (unequal)'
              : 'Unequal sides when D(K-1) is odd',
            rx,
            130,
            28,
            ROLE.warm,
            'mono',
          ),
          glowBar(rx - 220, 188, 64, 36, ROLE.warm, { glow: 8 }),
          glowBar(rx - 146, 188, 280, 36, ROLE.input, { glow: 4 }),
          glowBar(rx + 144, 188, 128, 36, ROLE.warm, { glow: 8 }),
          txt(
            'Valid checks: K, S, D > 0  ·  P >= 0  ·  K_eff <= W + 2P',
            rx,
            290,
            26,
            COSMOS.muted,
            'mono',
          ),
        ).opacity(v2),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'shape-dilation-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'dilate-weights', dilP, 1, { dur: 1.1 });
  cueTo(s, c, 'shape-dilation-b2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'dilated-starts', startsP, 1, { dur: 2.0 });
  cueTo(s, c, 'shape-dilation-b3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'same-padding', sameP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 11. channels: Several input channels contribute to one output (3D TENSOR STACK)
// Cues: channel-first, channel-second, channel-sum*, second-filter, second-channel-sum*
// ---------------------------------------------------------------------------
export function channels(s, c) {
  const ch1P = s.value(0);
  const ch2P = s.value(0);
  const sum1P = s.value(0);
  const revP = s.value(0);
  const sum2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.channel, seed: 11 }));
  s.add(decorAura(560, 40, 460, '#a78bfa22', '#5ce1e614'));

  // 3D orbiting multi-channel tensor stack on the right!
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.6,
    unit: 105,
    focus: [0, 0, 0.2],
  }).at(580, 40);

  const ch1Slab = wireframeSlab3d([-1.2, 0, 0.85], 1.15, 1.15, 0.14, {
    color: ROLE.input,
    width: 2.8,
    glow: 9,
  });
  const ch2Slab = wireframeSlab3d([-1.2, 0, -0.55], 1.15, 1.15, 0.14, {
    color: ROLE.kernel,
    width: 2.8,
    glow: 9,
  });
  const out1Slab = wireframeSlab3d([1.55, 0, 0.65], 0.88, 0.88, 0.14, {
    color: ROLE.pos,
    width: 3.0,
    glow: 11,
  });
  const out2Slab = wireframeSlab3d(
    () => [1.55, 0, mix(0.65, -0.75, revP.value)],
    0.88,
    0.88,
    0.14,
    {
      color: ROLE.channel,
      width: 2.8,
      glow: 10,
    },
  );
  const ray1 = line3d([-0.05, 0, 0.85], [0.65, 0, 0.65], {
    color: ROLE.input,
    width: 3,
    glow: 8,
  });
  const ray2 = line3d([-0.05, 0, -0.55], [0.65, 0, 0.65], {
    color: ROLE.kernel,
    width: 3,
    glow: 8,
  });
  const ray3 = line3d([-0.05, 0, 0.85], () => [0.65, 0, mix(0.65, -0.75, revP.value)], {
    color: ROLE.neg,
    width: 2.6,
    glow: 8,
  });
  const ray4 = line3d([-0.05, 0, -0.55], () => [0.65, 0, mix(0.65, -0.75, revP.value)], {
    color: ROLE.channel,
    width: 2.6,
    glow: 8,
  });

  view3d.add(...ch1Slab, ...ch2Slab, ...out1Slab, ...out2Slab, ray1, ray2, ray3, ray4);

  const headline = heroTitle(['Multi-Channel Filters', 'Sum Across Depth'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.channel,
    eyebrow: '2 INPUT CHANNELS  ·  DISTINCT KERNEL PER CHANNEL  ·  ZERO BIAS',
  });

  const snapF1 = channelSnapshot(0); // sums: [3, 3] -> 6
  const snapF2 = channelSnapshot(1); // sums: [-3, 3] -> 0

  const live = dynamic(() => {
    const isFilter2 = revP.value > 0.35;
    const snap = isFilter2 ? snapF2 : snapF1;
    const showTotal = isFilter2 ? sum2P.value : sum1P.value;
    const nodes = [];

    const chX = -675;
    const kX = -290;
    const sX = 75;
    const row1Y = -105;
    const row2Y = 175;
    const cellSz = 62;
    const gap = 5;

    // Channel 1 row
    nodes.push(
      txt('CH 1 PATCH', chX, row1Y - 125, 26, ROLE.input, 'mono'),
      matrixGrid(
        snap.images[0].slice(0, 3).map((r) => r.slice(0, 3)),
        chX,
        row1Y,
        {
          cellSize: cellSz,
          gap,
          fontSize: 26,
        },
      ),
      txt('x', -485, row1Y, 40, COSMOS.muted, 'mono'),
      txt(
        isFilter2 ? 'F2 CH 1 (REVERSED)' : 'F1 CH 1 KERNEL',
        kX,
        row1Y - 125,
        26,
        isFilter2 ? ROLE.neg : ROLE.kernel,
        'mono',
      ),
      matrixGrid(snap.kernels[0], kX, row1Y, {
        cellSize: cellSz,
        gap,
        fontSize: 28,
        kind: 'kernel',
      }),
      numCell(
        ch1P.value > 0.2 ? (snap.sums[0] >= 0 ? `+${snap.sums[0]}` : String(snap.sums[0])) : '?',
        sX,
        row1Y,
        {
          w: 118,
          h: 74,
          size: 38,
          stroke: isFilter2 ? ROLE.neg : ROLE.input,
          textColor: isFilter2 ? ROLE.neg : ROLE.input,
          glow: 9,
        },
      ),
    );

    // Channel 2 row
    nodes.push(
      txt('CH 2 PATCH', chX, row2Y - 125, 26, ROLE.kernel, 'mono'),
      matrixGrid(
        snap.images[1].slice(0, 3).map((r) => r.slice(0, 3)),
        chX,
        row2Y,
        {
          cellSize: cellSz,
          gap,
          fontSize: 26,
        },
      ),
      txt('x', -485, row2Y, 40, COSMOS.muted, 'mono'),
      txt(
        isFilter2 ? 'F2 CH 2 KERNEL' : 'F1 CH 2 KERNEL',
        kX,
        row2Y - 125,
        26,
        ROLE.kernel,
        'mono',
      ),
      matrixGrid(snap.kernels[1], kX, row2Y, {
        cellSize: cellSz,
        gap,
        fontSize: 28,
        kind: 'kernel',
      }),
      numCell(ch2P.value > 0.2 ? `+${snap.sums[1]}` : '?', sX, row2Y, {
        w: 118,
        h: 74,
        size: 38,
        stroke: ROLE.kernel,
        textColor: ROLE.kernel,
        glow: 9,
      }),
    );

    // Sum readout between row1 and row2
    nodes.push(
      txt('+', sX, 35, 42, COSMOS.muted, 'mono'),
      txt(
        showTotal > 0.15
          ? isFilter2
            ? 'Filter 2 output:  -3 + 3 = 0'
            : 'Filter 1 output:  3 + 3 = 6'
          : isFilter2
            ? 'Filter 2 sum = ?'
            : 'Filter 1 sum = ?',
        -290,
        365,
        38,
        showTotal > 0.15 ? (isFilter2 ? ROLE.channel : ROLE.pos) : COSMOS.dim,
        'mono',
      ).glow(showTotal > 0.15 ? 10 : 0, isFilter2 ? ROLE.channel : ROLE.pos),
      txt('3D DEPTH STACK  (2 IN -> 2 OUT)', 580, 365, 26, COSMOS.muted, 'mono'),
    );

    return group(...nodes);
  });

  s.add(view3d, headline, live);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.96 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'channel-first', ch1P, 1, { dur: 0.65 });
  cueTo(s, c, 'channel-second', ch2P, 1, { dur: 0.65 });
  cueTo(s, c, 'channel-sum', sum1P, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'second-filter', revP, 1, { dur: 0.75 });
  cueTo(s, c, 'second-channel-sum', sum2P, 1, { after: true, dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 12. grouped-connectivity: One output sums only its declared input-channel group
// Cues: grouped-connectivity-b1, grouped-connectivity-b2, disconnect-groups,
//       group-count*, grouped-connectivity-b3, parameter-owners
// ---------------------------------------------------------------------------
export function groupedConnectivity(s, c) {
  const b1P = s.value(0);
  const b2P = s.value(0);
  const discP = s.value(0);
  const cntP = s.value(0);
  const b3P = s.value(0);
  const ownP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.kernel, seed: 12 }));
  s.add(decorAura(-440, 30, 460, '#5ce1e61a', '#07091000'));
  s.add(decorAura(440, 30, 460, '#a78bfa1a', '#07091000'));

  const headline = heroTitle(['Grouped Convolutions &', 'Parameter Ownership'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kernel,
    eyebrow: 'NCHW TENSOR SHAPES  ·  GROUPS = 1 VS. GROUPS = 2',
  });

  const live = dynamic(() => {
    const dc = discP.value;
    const ct = cntP.value;
    const b3 = b3P.value;
    const ow = ownP.value;
    const nodes = [];

    // Left-to-center bipartite channel routing: 4 input channels -> 6 output filters
    const inX = -670;
    const outX = -95;
    const inYs = [-135, -35, 85, 185];
    const outYs = [-180, -108, -36, 48, 120, 192];

    nodes.push(
      txt('4 INPUT CHANNELS', inX, -235, 26, ROLE.input, 'mono'),
      txt('6 OUTPUT FILTERS', outX, -235, 26, ROLE.pos, 'mono'),
    );

    // Wiring lines: cross-group links fade out smoothly when groups=2!
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 6; j += 1) {
        const sameGroup = Math.floor(i / 2) === Math.floor(j / 3);
        const linkOp = sameGroup ? 0.85 : Math.max(0, 0.55 * (1 - dc));
        if (linkOp < 0.02) continue;
        const linkCol = sameGroup
          ? Math.floor(i / 2) === 0
            ? ROLE.kernel
            : ROLE.channel
          : COSMOS.dim;
        nodes.push(
          line([inX + 82, inYs[i]], [outX - 82, outYs[j]], {
            stroke: linkCol,
            width: sameGroup ? 2.8 : 1.4,
          }).opacity(linkOp),
        );
      }
    }

    // Input channel pills
    inYs.forEach((y, i) => {
      const grpCol = i < 2 ? ROLE.kernel : ROLE.channel;
      const hi = i === 0 && dc > 0.5;
      nodes.push(
        numCell(`In ${i}`, inX, y, {
          w: 148,
          h: 60,
          size: 28,
          stroke: hi ? ROLE.window : grpCol,
          textColor: hi ? ROLE.window : grpCol,
          glow: hi ? 12 : 4,
        }),
      );
    });

    // Output filter pills
    outYs.forEach((y, j) => {
      const grpCol = j < 3 ? ROLE.kernel : ROLE.channel;
      nodes.push(
        numCell(`Out ${j}`, outX, y, {
          w: 148,
          h: 52,
          size: 26,
          stroke: grpCol,
          textColor: grpCol,
          glow: j < 3 && dc > 0.5 ? 8 : 3,
        }),
      );
    });

    // Group brackets on right of outputs when groups = 2
    if (dc > 0.3) {
      nodes.push(
        txt('Grp 1', outX + 125, -108, 26, ROLE.kernel, 'mono').opacity(dc),
        txt('Grp 2', outX + 125, 120, 26, ROLE.channel, 'mono').opacity(dc),
      );
    }

    // Right column: NCHW shapes, exact parameter formula, and image-width invariance
    const rx = 465;
    nodes.push(
      txt(
        dc > 0.35 ? 'GROUPS = 2  (2 IN PER FILTER)' : 'GROUPS = 1  (ALL 4 IN PER FILTER)',
        rx,
        -220,
        28,
        dc > 0.35 ? ROLE.window : ROLE.kernel,
        'mono',
      ),
      txt('(N, 4, H, W)  ->  (N, 6, H_out, W_out)', rx, -150, 28, COSMOS.ink, 'mono'),
      glowTex(
        'P = C_{\\text{out}} \\cdot \\frac{C_{\\text{in}}}{G} \\cdot K_H K_W + C_{\\text{out}}',
        {
          x: rx,
          y: -45,
          size: 38,
          color: ROLE.window,
        },
      ).opacity(mix(0.65, 1, b1P.value + b3)),
    );

    if (ct > 0.1 || b2P.value > 0.1) {
      nodes.push(
        txt(
          ct > 0.15 ? `6 x 2 x 9 + 6 = ${GROUPED_4_6_PARAMS} params` : '6 x (4/2) x 3x3 + 6 = ?',
          rx,
          85,
          40,
          ct > 0.15 ? ROLE.pos : COSMOS.muted,
          'mono',
        ).glow(ct > 0.15 ? 10 : 0, ROLE.pos),
      );
    } else {
      nodes.push(txt('6 x 4 x 9 + 6 = 222 params (G=1)', rx, 85, 34, ROLE.kernel, 'mono'));
    }

    // Spatial width scaling bar (shows image width 1x -> 2x while stored weights stay 114!)
    const barW = mix(220, 440, ow);
    nodes.push(
      txt(
        ow > 0.3 ? '2x WIDER IMAGE  ->  STILL 114 WEIGHTS' : 'IMAGE WIDTH SLIDES SAME WEIGHTS',
        rx,
        195,
        26,
        ow > 0.3 ? ROLE.pos : COSMOS.muted,
        'mono',
      ),
      scaleTrack(rx - 220, 250, 440, 36, { radius: 8 }),
      glowBar(rx - 220, 250, barW, 36, ow > 0.3 ? ROLE.pos : ROLE.input, { glow: 8 }),
      txt(
        ow > 0.3
          ? 'Stride, dilation & image size never change parameter count'
          : 'Input 0 reaches only its own group when G = 2',
        rx,
        335,
        28,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'grouped-connectivity-b1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'grouped-connectivity-b2', b2P, 1, { dur: 0.6 });
  cueTo(s, c, 'disconnect-groups', discP, 1, { dur: 0.9 });
  cueTo(s, c, 'group-count', cntP, 1, { after: true, dur: 0.5 });
  cueTo(s, c, 'grouped-connectivity-b3', b3P, 1, { dur: 0.6 });
  cueTo(s, c, 'parameter-owners', ownP, 1, { dur: 0.9 });
}
