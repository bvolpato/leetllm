// Act 2 (Scenes 6-9): Axis Reductions & Keepdims, Float32 vs Float64 Precision,
// Reshape vs Transpose Strides (16 bytes), and Views vs Copies in Shared RAM.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PREC,
  ROLE,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  featureMean,
  firstSnippetWords,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  reshapeBatch0,
  rule,
  sequence0,
  tensor,
  tokenMean,
  transposeBatch0,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. reduce: Which direction gives one vector per sentence?
// Cues: pool-token-column, pool-feature-row, retain-mean-token-slot*, subtract-kept-mean
// ---------------------------------------------------------------------------
export function reduce(s, c) {
  const colP = s.value(0);
  const rowP = s.value(0);
  const keepP = s.value(0);
  const subP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 6 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#ffd16614'));

  const headline = heroTitle(['Axis Reductions', '& keepdims=True'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: 'COLLAPSE TOKENS (axis=1)  VS  FEATURES (axis=2)',
  });

  const live = dynamic(() => {
    const cl = colP.value;
    const rw = rowP.value;
    const kp = keepP.value;
    const sb = subP.value;
    const nodes = [];

    const gx0 = -620;
    const gy0 = -125;
    const px = 128;
    const py = 96;

    // Input 3x4 sentence 0 (centered values replace originals smoothly on subtract-kept-mean)
    nodes.push(
      txt(
        sb > 0.2 ? 'CENTERED  x − mean(axis=1, keepdims=True)' : 'SENTENCE 0  ·  SHAPE (3, 4)',
        -840,
        -220,
        26,
        sb > 0.2 ? ROLE.good : ROLE.batch0,
        'mono',
        'left',
      ),
    );
    sequence0.forEach((row, r) => {
      const ry = gy0 + r * py;
      nodes.push(txt(firstSnippetWords[r], -840, ry, 28, COSMOS.muted, 'serif', 'left'));
      row.forEach((val, d) => {
        const centered = val - tokenMean[0][d];
        const shown = sb > 0.4 ? centered : val;
        const hiCol = cl > 0.1 && rw < 0.2 && d === 0;
        const hiRow = rw > 0.2 && kp < 0.2 && r === 1;
        nodes.push(
          numCell(shown, gx0 + d * px, ry, {
            w: 104,
            h: 68,
            stroke: sb > 0.4 ? ROLE.good : hiRow ? ROLE.batch0 : hiCol ? ROLE.feature : '#2d3f64',
            textColor: sb > 0.4 ? ROLE.good : COSMOS.ink,
            glow: sb > 0.4 || hiCol || hiRow ? 9 : 0,
            size: 30,
          }),
        );
      });
    });

    // Bottom readout for axis=1 token pooling
    if (cl > 0.1 && rw < 0.2) {
      nodes.push(
        txt('mean(axis=1)  →  shape (2, 4)', -840, 215, 28, ROLE.feature, 'mono', 'left'),
        ...tokenMean[0].map((m, d) =>
          numCell(m, gx0 + d * px, 290, {
            stroke: ROLE.feature,
            textColor: ROLE.feature,
            glow: 10,
          }),
        ),
        txt('(0 + 4 + 8) / 3 = 4', 100, 290, 32, ROLE.feature, 'mono', 'left'),
      );
    }

    // Right panel: Axis-1 column breakdown before row-pooling arrives (P5 clean crossfade)
    const preRw = fadeOut(rw);
    if (preRw > 0.02 && kp < 0.05) {
      nodes.push(
        group(
          txt('POOLING DOWN TOKEN AXIS (axis = 1)', 80, -220, 26, ROLE.feature, 'mono', 'left'),
          txt('Col 0:  (0 + 4 + 8) / 3  =  4', 80, -110, 32, ROLE.feature, 'mono', 'left'),
          txt('Col 1:  (1 + 5 + 9) / 3  =  5', 80, -35, 30, COSMOS.muted, 'mono', 'left'),
          txt('Col 2:  (2 + 6 + 10) / 3 =  6', 80, 40, 30, COSMOS.muted, 'mono', 'left'),
          txt('Col 3:  (3 + 7 + 11) / 3 =  7', 80, 115, 30, COSMOS.muted, 'mono', 'left'),
        ).opacity(preRw),
      );
    }

    // Right readout for axis=2 feature pooling
    const rwVis = fadeIn(rw) * fadeOut(kp);
    if (rwVis > 0.02) {
      nodes.push(
        group(
          txt('mean(axis=2)  →  (2, 3)', 80, -220, 28, ROLE.batch0, 'mono', 'left'),
          ...featureMean[0].map((m, r) =>
            numCell(m.toFixed(1), 220, gy0 + r * py, {
              w: 120,
              stroke: ROLE.batch0,
              textColor: ROLE.batch0,
              glow: 9,
            }),
          ),
          txt('One scalar per word', 340, gy0 + py, 30, COSMOS.ink, 'serif', 'left'),
        ).opacity(rwVis),
      );
    }

    // Right alignment diagram for keepdims=True
    const kpVis = fadeIn(kp);
    if (kpVis > 0.02) {
      const rx = 60;
      nodes.push(
        group(
          txt('KEEPING THE TOKEN SLOT FOR SUBTRACTION', rx, -220, 26, ROLE.feature, 'mono', 'left'),
          txt('x:                  ( 2,  3,  4 )', rx, -125, 32, COSMOS.ink, 'mono', 'left'),
          txt('without keepdims:   ( 1,  2,  4 )  2 ≠ 3!', rx, -50, 30, ROLE.bad, 'mono', 'left'),
          txt(
            'keepdims=True:      ( 2,  1,  4 )  MATCH!',
            rx,
            30,
            32,
            ROLE.good,
            'mono',
            'left',
          ).glow(8, ROLE.good),
          sb > 0.2
            ? txt(
                'migrate row becomes [0, 0, 0, 0] right in the middle',
                rx,
                145,
                28,
                ROLE.good,
                'serif',
                'left',
              ).opacity(sb)
            : group(),
        ).opacity(kpVis),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pool-token-column', colP, 1, { dur: 0.9 });
  cueTo(s, c, 'pool-feature-row', rowP, 1, { dur: 0.9 });
  cueTo(s, c, 'retain-mean-token-slot', keepP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'subtract-kept-mean', subP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 7. precision: What happened to the extra one?
// Cues: exact-halfway, compare-last-bits, narrow-accumulator*, narrow-cancel*,
//       narrow-mean, wide-accumulator*, wide-cancel, wide-mean*
// ---------------------------------------------------------------------------
export function precision(s, c) {
  const halfP = s.value(0);
  const bitsP = s.value(0);
  const narAccP = s.value(0);
  const narCanP = s.value(0);
  const narMnP = s.value(0);
  const widAccP = s.value(0);
  const widCanP = s.value(0);
  const widMnP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.stride, seed: 7 }));
  s.add(decorAura(0, 30, 560, '#fb923c1c', '#6ee7b714'));

  const headline = heroTitle(['Float32 Rounding', 'vs Float64 Accumulator'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.stride,
    eyebrow: 'INPUTS:  [2²⁴,  +1,  −2²⁴]',
  });

  const live = dynamic(() => {
    const hf = halfP.value;
    const bt = bitsP.value;
    const na = narAccP.value;
    const nc = narCanP.value;
    const nm = narMnP.value;
    const wa = widAccP.value;
    const wc = widCanP.value;
    const wm = widMnP.value;
    const nodes = [];

    const xL = -540;
    const xM = -40;
    const xR = 460;

    // Lane 1: float32 ruler (only even integers 2^24 and 2^24 + 2 exist!)
    const y1 = -105;
    const ringX = mix(xM, xL, na);
    nodes.push(
      txt('FLOAT32 ACCUMULATOR  (SPACING = 2 AT 2²⁴)', -820, y1 - 95, 28, ROLE.bad, 'mono', 'left'),
      line([xL - 80, y1], [xR + 80, y1], { stroke: '#4a5f8c', width: 3.5 }),
      line([xL, y1 - 24], [xL, y1 + 24], { stroke: ROLE.batch0, width: 4 }),
      line([xR, y1 - 24], [xR, y1 + 24], { stroke: ROLE.batch0, width: 4 }),
      txt('2²⁴', xL, y1 + 54, 30, ROLE.batch0, 'mono'),
      txt('2²⁴ + 1 (exact)', xM, y1 + 54, 26, COSMOS.dim, 'mono'),
      txt('2²⁴ + 2', xR, y1 + 54, 30, ROLE.batch0, 'mono'),
    );

    if (bt > 0.1) {
      nodes.push(
        txt('...0 (even)', xL, y1 - 54, 26, ROLE.good, 'mono').opacity(bt),
        txt('...1 (odd)', xR, y1 - 54, 26, COSMOS.dim, 'mono').opacity(bt),
      );
    }

    if (hf > 0.05) {
      nodes.push(
        circle(20, { fill: null, stroke: na > 0.3 ? ROLE.bad : ROLE.feature, width: 4 })
          .at(ringX, y1)
          .glow(12, na > 0.3 ? ROLE.bad : ROLE.feature),
      );
    }

    if (nc > 0.1 || nm > 0.1) {
      nodes.push(
        txt(
          nm > 0.2 ? 'Cancel: 0  →  mean = 0.0 (float32)' : 'Subtract 2²⁴  →  sum = 0!',
          855,
          y1 - 95,
          28,
          ROLE.bad,
          'mono',
          'right',
        )
          .glow(8, ROLE.bad)
          .opacity(Math.max(nc, nm)),
      );
    }

    // Lane 2: float64 accumulator (quiet preview from t=0, illuminates on wide-accumulator!)
    const y2 = 175;
    nodes.push(
      group(
        txt(
          'FLOAT64 ACCUMULATOR  (HOLDS +1 EXACTLY)',
          -820,
          y2 - 95,
          28,
          ROLE.good,
          'mono',
          'left',
        ),
        line([xL - 80, y2], [xR + 80, y2], { stroke: '#4a5f8c', width: 3.5 }),
        line([xL, y2 - 22], [xL, y2 + 22], { stroke: ROLE.good, width: 3.5 }),
        line([xM, y2 - 26], [xM, y2 + 26], { stroke: ROLE.good, width: 4.5 }),
        line([xR, y2 - 22], [xR, y2 + 22], { stroke: ROLE.good, width: 3.5 }),
        txt('2²⁴', xL, y2 + 54, 28, COSMOS.muted, 'mono'),
        txt('2²⁴ + 1', xM, y2 + 54, 30, ROLE.good, 'mono'),
        txt('2²⁴ + 2', xR, y2 + 54, 28, COSMOS.muted, 'mono'),
        wa > 0.1
          ? glowDot(xM, y2, { radius: 13, color: ROLE.good, glow: 14 })
          : txt('53-bit significand keeps exact odd ticks', 0, y2 - 50, 26, COSMOS.dim, 'sans'),
      ).opacity(mix(0.45, 1, wa)),
    );
    if (wc > 0.1 || wm > 0.1) {
      nodes.push(
        txt(
          wm > 0.2
            ? `Cancel: 1  →  mean = ${PREC.wideMean.toFixed(4)} (float64)`
            : 'Subtract 2²⁴  →  sum = 1',
          855,
          y2 - 95,
          28,
          ROLE.good,
          'mono',
          'right',
        )
          .glow(9, ROLE.good)
          .opacity(Math.max(wc, wm)),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'exact-halfway', halfP, 1, { dur: 0.7 });
  cueTo(s, c, 'compare-last-bits', bitsP, 1, { dur: 0.6 });
  cueTo(s, c, 'narrow-accumulator', narAccP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'narrow-cancel', narCanP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'narrow-mean', narMnP, 1, { dur: 0.55 });
  cueTo(s, c, 'wide-accumulator', widAccP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'wide-cancel', widCanP, 1, { dur: 0.55 });
  cueTo(s, c, 'wide-mean', widMnP, 1, { after: true, dur: 0.55 });
}

// ---------------------------------------------------------------------------
// 8. reshape-transpose: Which row holds each word's last feature?
// Cues: fill-first-row, start-mixed-row, cross-word-boundary, reshape-flat-stream,
//       infer-row-count, show-row-count, transpose-axis-swap, read-word-stride,
//       measure-word-stride, compare-layout-owners
// ---------------------------------------------------------------------------
export function reshapeTranspose(s, c) {
  const r0P = s.value(0);
  const mixP = s.value(0);
  const crossP = s.value(0);
  const flatP = s.value(0);
  const infP = s.value(0);
  const cntP = s.value(0);
  const trP = s.value(0);
  const strP = s.value(0);
  const msrP = s.value(0);
  const cmpP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.stride, seed: 8 }));
  s.add(decorAura(0, 40, 560, '#fb923c1a', '#5ce1e614'));

  const headline = heroTitle(['Reshape Cuts Flat Order,', 'Transpose Changes Strides'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.stride,
    eyebrow: 'CONTIGUOUS RAM BUFFER  ·  16-BYTE STRIDE',
  });

  const live = dynamic(() => {
    const r0 = r0P.value;
    const mx = mixP.value;
    const cr = crossP.value;
    const fl = flatP.value;
    const inf = infP.value;
    const cn = cntP.value;
    const tr = trP.value;
    const st = strP.value;
    const ms = msrP.value;
    const cm = cmpP.value;
    const nodes = [];

    // Top contiguous 1D buffer for Sentence 0 (0..11)
    const bx0 = -770;
    const by = -185;
    const pitch = 136;
    nodes.push(
      txt(
        'CONTIGUOUS MEMORY BUFFER (4 BYTES / FLOAT32)',
        bx0 - 45,
        by - 64,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );
    for (let i = 0; i < 12; i++) {
      const cx = bx0 + i * pitch;
      const wordCol = i < 4 ? ROLE.batch0 : i < 8 ? ROLE.feature : ROLE.batch1;
      const isLastFeat = i === 3 || i === 7 || i === 11;
      nodes.push(
        numCell(i, cx, by, {
          w: 112,
          h: 62,
          stroke: isLastFeat && st > 0.2 ? ROLE.stride : wordCol,
          textColor: isLastFeat && st > 0.2 ? ROLE.stride : COSMOS.ink,
          glow: isLastFeat && st > 0.2 ? 12 : 0,
          size: 28,
        }),
      );
    }

    // Glowing 16-byte stride hop arc from 3 -> 7 -> 11
    if (st > 0.05) {
      const arc1 = [];
      for (let k = 0; k <= 20; k++) {
        const u = (k / 20) * st;
        arc1.push([mix(bx0 + 3 * pitch, bx0 + 7 * pitch, u), by + 36 + Math.sin(Math.PI * u) * 58]);
      }
      if (arc1.length >= 2) {
        nodes.push(glowingTrail(arc1, { color: ROLE.stride, width: 4.2, glow: 10 }));
      }
      if (ms > 0.1) {
        nodes.push(
          txt(
            '4 floats × 4 bytes = 16-byte stride',
            bx0 + 5 * pitch,
            by + 124,
            28,
            ROLE.stride,
            'mono',
          )
            .glow(8, ROLE.stride)
            .opacity(ms),
        );
      }
    }

    // Left bottom: reshape(4, 3) (mixes words!)
    const lx = -660;
    const ly0 = 60;
    nodes.push(
      txt('RESHAPE (4, 3)  ·  MIXES WORDS', lx - 60, ly0 - 52, 26, ROLE.bad, 'mono', 'left'),
    );
    const filledCount = fl > 0.2 ? 12 : cr > 0.2 ? 6 : mx > 0.2 ? 4 : r0 > 0.2 ? 3 : 0;
    reshapeBatch0.forEach((row, r) => {
      row.forEach((val, col) => {
        const idx = r * 3 + col;
        const filled = idx < filledCount;
        const isMixedRow = r === 1;
        const hiSeven = filled && cm > 0.2 && val === 7;
        nodes.push(
          numCell(filled ? val : '?', lx + col * 124, ly0 + r * 72, {
            w: 104,
            h: 56,
            stroke: filled
              ? hiSeven
                ? ROLE.bad
                : isMixedRow && cr > 0.2
                  ? ROLE.bad
                  : '#334770'
              : '#222f4d',
            textColor: filled ? (hiSeven ? ROLE.bad : COSMOS.ink) : COSMOS.dim,
            glow: hiSeven ? 11 : 0,
            size: 26,
          }),
        );
      });
    });

    if (inf > 0.1 && tr < 0.2) {
      nodes.push(
        txt(
          cn > 0.3 ? 'reshape(-1, 4): 24 / 4 = 6 rows' : 'reshape(-1, 4) infers row count',
          120,
          170,
          32,
          ROLE.batch0,
          'mono',
          'left',
        ).opacity(inf),
      );
    }

    // Right bottom: transpose(1, 0) -> (4, 3) (quiet preview slots when inf=0 and tr=0)
    const rx = 200;
    if (tr > 0.05) {
      nodes.push(
        group(
          txt(
            'TRANSPOSE (4, 3)  ·  PRESERVES OWNERS',
            rx - 60,
            ly0 - 52,
            26,
            ROLE.good,
            'mono',
            'left',
          ),
          ...transposeBatch0.flatMap((row, r) =>
            row.map((val, col) => {
              const isLastRow = r === 3;
              return numCell(val, rx + col * 124, ly0 + r * 72, {
                w: 104,
                h: 56,
                stroke: isLastRow ? ROLE.good : '#334770',
                textColor: isLastRow ? ROLE.good : COSMOS.ink,
                glow: isLastRow ? 10 : 0,
                size: 26,
              });
            }),
          ),
        ).opacity(tr),
      );
    } else if (inf < 0.05) {
      nodes.push(
        group(
          txt(
            'TRANSPOSE (4, 3)  ·  SWAP AXES (1, 0)',
            rx - 60,
            ly0 - 52,
            26,
            COSMOS.dim,
            'mono',
            'left',
          ),
          ...transposeBatch0.flatMap((row, r) =>
            row.map((_, col) =>
              numCell('?', rx + col * 124, ly0 + r * 72, {
                w: 104,
                h: 56,
                stroke: '#222f4d',
                textColor: COSMOS.dim,
                size: 26,
              }),
            ),
          ),
        ).opacity(0.55),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'fill-first-row', r0P, 1, { dur: 0.65 });
  cueTo(s, c, 'start-mixed-row', mixP, 1, { dur: 0.55 });
  cueTo(s, c, 'cross-word-boundary', crossP, 1, { dur: 0.6 });
  cueTo(s, c, 'reshape-flat-stream', flatP, 1, { dur: 0.8 });
  cueTo(s, c, 'infer-row-count', infP, 1, { dur: 0.6 });
  cueTo(s, c, 'show-row-count', cntP, 1, { dur: 0.55 });
  cueTo(s, c, 'transpose-axis-swap', trP, 1, { dur: 0.9 });
  cueTo(s, c, 'read-word-stride', strP, 1, { dur: 0.85 });
  cueTo(s, c, 'measure-word-stride', msrP, 1, { dur: 0.6 });
  cueTo(s, c, 'compare-layout-owners', cmpP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 9. views: Which array gets the write?
// Cues: shared-slice-address, edit-shared-value*, select-copy-address,
//       edit-independent-copy*, rewind-indexed-write, address-source,
//       write-indexed-source, flatten-transposed-view
// ---------------------------------------------------------------------------
export function views(s, c) {
  const shP = s.value(0);
  const edShP = s.value(0);
  const selCpP = s.value(0);
  const edCpP = s.value(0);
  const rewP = s.value(0);
  const addrP = s.value(0);
  const wrSrcP = s.value(0);
  const flatP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 9 }));
  s.add(decorAura(0, 30, 560, '#5ce1e61c', '#6ee7b714'));

  const headline = heroTitle(['Views Share RAM,', 'Fancy Indexing Copies'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: 'BASIC SLICE  VS  INTEGER-LIST INDEXING',
  });

  // View 1: Basic slice shared memory (write 99 -> mutates source!)
  const view1 = guardedDynamic(
    () => fadeOut(selCpP.value),
    (vis) => {
      const sh = shP.value;
      const ed = edShP.value;
      const v4 = ed > 0.3 ? 99 : 4;
      return group(
        txt(
          'BASIC SLICE  view = x[:, 1, :]   →   SAME BUFFER',
          -820,
          -195,
          28,
          ROLE.batch0,
          'mono',
          'left',
        ),
        txt('Source migrate:', -820, -65, 30, ROLE.batch0, 'sans', 'left'),
        ...[v4, 5, 6, 7].map((v, d) =>
          numCell(v, -420 + d * 140, -65, {
            stroke: d === 0 && ed > 0.3 ? ROLE.feature : ROLE.batch0,
            textColor: d === 0 && ed > 0.3 ? ROLE.feature : COSMOS.ink,
            glow: d === 0 ? 11 : 0,
            size: 32,
          }),
        ),
        txt('Slice view[0]:', -820, 110, 30, ROLE.feature, 'sans', 'left'),
        ...[v4, 5, 6, 7].map((v, d) =>
          numCell(v, -420 + d * 140, 110, {
            stroke: d === 0 ? ROLE.feature : '#364a78',
            textColor: d === 0 && ed > 0.3 ? ROLE.feature : COSMOS.ink,
            glow: d === 0 ? 11 : 0,
            size: 32,
          }),
        ),
        sh > 0.1
          ? line([-420, -20], [-420, 65], { stroke: ROLE.feature, width: 4, dash: [6, 5] }).glow(
              8,
              ROLE.feature,
            )
          : group(),
        // Right side: Shared Physical RAM Bank diagram
        rule(140, -195, 140, 210, '#2a3759', 2),
        txt('SHARED RAM BUFFER', 210, -195, 28, ROLE.feature, 'mono', 'left'),
        txt('Metadata only changes:', 210, -110, 28, COSMOS.muted, 'sans', 'left'),
        txt('shape   = (2, 4)', 210, -45, 30, ROLE.batch0, 'mono', 'left'),
        txt('strides = (48, 4) bytes', 210, 15, 30, ROLE.stride, 'mono', 'left'),
        txt(`slot[4] = ${v4}  (1 physical cell)`, 210, 95, 32, ROLE.feature, 'mono', 'left').glow(
          8,
          ROLE.feature,
        ),
        txt(
          ed > 0.3
            ? 'Both windows read address 4 → BOTH now show 99!'
            : 'Writing 99 to view[0, 0]: where else will 99 appear?',
          -820,
          255,
          32,
          ROLE.feature,
          'serif',
          'left',
        ),
      ).opacity(vis);
    },
  );

  // View 2: Fancy index copy vs direct indexed write vs flatten copy
  const view2 = guardedDynamic(
    () => fadeIn(selCpP.value),
    (vis) => {
      const edCp = edCpP.value;
      const rw = rewP.value;
      const ad = addrP.value;
      const ws = wrSrcP.value;
      const fl = flatP.value;

      if (fl > 0.2) {
        const flatOrder = transposeBatch0.flat();
        return group(
          txt(
            'FLATTENING A TRANSPOSED VIEW REQUIRES A NEW CONTIGUOUS COPY',
            -840,
            -195,
            28,
            ROLE.batch0,
            'mono',
            'left',
          ),
          txt(
            'Original buffer:  0, 1, 2, 3, 4, 5, ...',
            -840,
            -90,
            30,
            COSMOS.muted,
            'mono',
            'left',
          ),
          txt('Flattened copy:', -840, 25, 30, ROLE.good, 'mono', 'left'),
          ...flatOrder.map((v, i) =>
            numCell(v, -770 + i * 136, 130, {
              w: 112,
              h: 68,
              stroke: i < 3 ? ROLE.good : ROLE.batch0,
              textColor: i < 3 ? ROLE.good : COSMOS.ink,
              glow: i < 3 ? 9 : 0,
            }),
          ),
          txt(
            'Transposed row order [0, 4, 8, ...] survives in the new contiguous buffer',
            -840,
            255,
            30,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(vis);
      }

      const src0 = ws > 0.3 ? -1 : 0;
      const pick0 = edCp > 0.3 && rw < 0.3 ? -1 : 0;
      const modeLabel =
        ws > 0.3
          ? 'DIRECT WRITE  x[[0, 1], 0, 0] = −1  →  MUTATES SOURCE!'
          : ad > 0.2
            ? 'PUT INDEX ON SOURCE ITSELF:  x[[0, 1], 0, 0] = −1'
            : 'FANCY INDEXING  picked = x[[0, 1]]  →  INDEPENDENT COPY';

      return group(
        txt(modeLabel, -840, -195, 28, ws > 0.3 ? ROLE.stride : ROLE.good, 'mono', 'left'),
        txt('Source Birds:', -840, -65, 30, ROLE.batch0, 'sans', 'left'),
        ...[src0, 1, 2, 3].map((v, d) =>
          numCell(v, -430 + d * 140, -65, {
            stroke: d === 0 && ws > 0.3 ? ROLE.stride : ROLE.batch0,
            textColor: d === 0 && ws > 0.3 ? ROLE.stride : COSMOS.ink,
            glow: d === 0 ? 10 : 0,
            size: 32,
          }),
        ),
        txt('Copied picked[0]:', -840, 110, 30, ROLE.good, 'sans', 'left'),
        ...[pick0, 1, 2, 3].map((v, d) =>
          numCell(v, -430 + d * 140, 110, {
            stroke: d === 0 && pick0 === -1 ? ROLE.good : '#364a78',
            textColor: d === 0 && pick0 === -1 ? ROLE.good : COSMOS.ink,
            glow: d === 0 && pick0 === -1 ? 10 : 0,
            size: 32,
          }),
        ),
        // Right side: Separate RAM Banks
        rule(140, -195, 140, 210, '#2a3759', 2),
        txt('TWO SEPARATE BUFFERS', 210, -195, 28, ROLE.good, 'mono', 'left'),
        txt(`Buffer A (source): [${src0}, 1, 2, 3]`, 210, -65, 30, ROLE.batch0, 'mono', 'left'),
        txt(`Buffer B (picked): [${pick0}, 1, 2, 3]`, 210, 110, 30, ROLE.good, 'mono', 'left'),
        txt(
          ws > 0.3 ? 'Direct source index edits Buffer A' : 'Fancy indexing allocates Buffer B',
          210,
          20,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          ws > 0.3
            ? 'Source Birds becomes −1 · Earlier copy keeps 0'
            : edCp > 0.3 && rw < 0.3
              ? 'Source Birds keeps 0 · Integer-list indexing allocated a copy!'
              : 'Separate buffers · Where does −1 land?',
          -840,
          255,
          32,
          COSMOS.ink,
          'serif',
          'left',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'shared-slice-address', shP, 1, { dur: 0.7 });
  cueTo(s, c, 'edit-shared-value', edShP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'select-copy-address', selCpP, 1, { dur: 0.85 });
  cueTo(s, c, 'edit-independent-copy', edCpP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'rewind-indexed-write', rewP, 1, { dur: 0.6 });
  cueTo(s, c, 'address-source', addrP, 1, { dur: 0.6 });
  cueTo(s, c, 'write-indexed-source', wrSrcP, 1, { dur: 0.65 });
  cueTo(s, c, 'flatten-transposed-view', flatP, 1, { dur: 0.8 });
}
