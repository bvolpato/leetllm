// Act 1 (Scenes 1-5): Intro Mystery, 3D Tensor Cube & Dtype Gate, Indexing, Broadcasting, Contracts.
import { arrow, dynamic, group, line, line3d, point3d, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bias,
  centeredWhitePixel,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  firstSnippetWords,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  imageChannelMeans,
  livingDrift,
  mix,
  numCell,
  orbitScene,
  rightSquare,
  rule,
  sentenceWords,
  sequence0,
  sequence1,
  squareInput,
  tokenOffsets,
  txt,
  wireframeSlab3d,
  wrongSquare,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Which word did the code read?
// Cues: request-first-pair, open-readout, locate-returned-pair, opening-owner-question
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const reqP = s.value(0);
  const readP = s.value(0);
  const locP = s.value(0);
  const qP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 1 }));
  s.add(decorAura(-320, 20, 480, '#5ce1e622', '#07091000'));
  s.add(decorAura(450, 20, 440, '#ffd16620', '#07091000'));

  const headline = heroTitle(['Keep Values Attached', 'to Their Words'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: 'TENSOR SHAPES  &  AXIS OWNERSHIP',
  });

  const live = dynamic(() => {
    const rq = reqP.value;
    const rd = readP.value;
    const lc = locP.value;
    const q = qP.value;
    const ph = drift.value;
    const nodes = [];

    // Left: 3x4 glowing input tensor for sentence 0
    const gx0 = -560;
    const gy0 = -105;
    const pitchX = 122;
    const pitchY = 104;
    nodes.push(txt('SENTENCE 0  ·  SHAPE (3, 4)', -820, -210, 26, ROLE.batch0, 'mono', 'left'));
    ['d0', 'd1', 'd2', 'd3'].forEach((d, j) => {
      nodes.push(txt(d, gx0 + j * pitchX, gy0 - 66, 26, COSMOS.dim, 'mono'));
    });

    sequence0.forEach((row, r) => {
      const ry = gy0 + r * pitchY;
      const wordCol = r === 1 ? ROLE.batch0 : r === 0 && lc > 0.3 ? ROLE.feature : COSMOS.muted;
      nodes.push(txt(firstSnippetWords[r], -820, ry, 32, wordCol, 'serif', 'left'));
      row.forEach((val, col) => {
        const cx = gx0 + col * pitchX;
        const isMigratePair = r === 1 && col < 2;
        const isBirdsReturned = r === 0 && col >= 2;
        const hiReq = isMigratePair && rq > 0.1;
        const hiLoc = isBirdsReturned && lc > 0.1;
        nodes.push(
          numCell(val, cx, ry, {
            w: 102,
            h: 72,
            stroke: hiLoc ? ROLE.feature : hiReq ? ROLE.batch0 : '#2e3f66',
            fill: hiLoc ? '#2b2410' : hiReq ? '#10293d' : '#0f1629',
            textColor: hiLoc ? ROLE.feature : hiReq ? ROLE.batch0 : COSMOS.ink,
            glow: hiLoc ? 12 : hiReq ? 10 : 0,
            size: 32,
          }),
        );
      });
    });

    // Right: Requested vs Returned pair
    const rx = 250;
    nodes.push(
      txt('REQUESTED: migrate[0:2]', rx, -165, 28, ROLE.batch0, 'mono', 'left'),
      numCell(4, rx + 75, -80, { stroke: ROLE.batch0, glow: rq > 0.1 ? 9 : 0, size: 34 }),
      numCell(5, rx + 205, -80, { stroke: ROLE.batch0, glow: rq > 0.1 ? 9 : 0, size: 34 }),
    );

    if (rd > 0.05) {
      nodes.push(
        group(
          txt('CODE RETURNED:', rx, 55, 28, ROLE.feature, 'mono', 'left'),
          numCell(2, rx + 75, 140, {
            stroke: ROLE.feature,
            fill: '#2a210e',
            textColor: ROLE.feature,
            glow: 11,
            size: 34,
          }),
          numCell(3, rx + 205, 140, {
            stroke: ROLE.feature,
            fill: '#2a210e',
            textColor: ROLE.feature,
            glow: 11,
            size: 34,
          }),
        ).opacity(rd),
      );
    }

    // Glowing trace from returned [2, 3] back to Birds [2, 3] through the open middle corridor
    if (lc > 0.05) {
      const pts = [];
      const xStart = rx + 18;
      const yStart = 140;
      const xEnd = gx0 + 3 * pitchX + 60;
      const yEnd = gy0;
      for (let k = 0; k <= 24; k++) {
        const u = (k / 24) * lc;
        const px = mix(xStart, xEnd, u);
        const py = mix(yStart, yEnd, u) + Math.sin(Math.PI * u) * 35;
        pts.push([px, py]);
      }
      if (pts.length >= 2) {
        nodes.push(
          glowingTrail(pts, { gradientColors: [ROLE.feature, ROLE.bad], width: 4.5, glow: 12 }),
        );
      }
      nodes.push(
        txt('2 and 3 belong to Birds!', rx, 255, 36, ROLE.feature, 'serif', 'left')
          .glow(8, ROLE.feature)
          .opacity(lc),
      );
    }

    if (q > 0.05) {
      nodes.push(
        txt('How did Birds end up under migrate?', rx, 325, 30, COSMOS.ink, 'sans', 'left').opacity(
          q,
        ),
      );
    } else if (rd > 0.5 && lc < 0.05) {
      nodes.push(
        txt('Which word did the code actually read?', rx, 260, 34, ROLE.feature, 'serif', 'left'),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'request-first-pair', reqP, 1, { dur: 0.7 });
  cueTo(s, c, 'open-readout', readP, 1, { dur: 0.7 });
  cueTo(s, c, 'locate-returned-pair', locP, 1, { dur: 0.95 });
  cueTo(s, c, 'opening-owner-question', qP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 2. shape: Where is migrate in the batch? (SIGNATURE 3D TENSOR CUBE)
// Cues: add-second-sentence, name-batch-axis, name-token-axis, name-feature-axis,
//       reject-integer-storage*, convert-storage-type
// ---------------------------------------------------------------------------
export function shape(s, c) {
  const b2P = s.value(0);
  const axBP = s.value(0);
  const axTP = s.value(0);
  const axFP = s.value(0);
  const rejP = s.value(0);
  const convP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 2 }));
  s.add(decorAura(340, 10, 520, '#5ce1e622', '#a78bfa16'));

  // Orbiting 3D (2, 3, 4) tensor cube with 2 batch slabs + glowing coordinate points
  const view3d = cinematic3d({
    theta: -0.72,
    phi: 1.05,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0],
  }).at(340, 15);

  // Batch 0 wireframe slab (cyan) and Batch 1 wireframe slab (violet)
  view3d.add(
    ...wireframeSlab3d([0, -1.25, 0], 2.1, 0.75, 1.5, { color: ROLE.batch0, width: 3.0, glow: 8 }),
    ...wireframeSlab3d(() => [0, mix(2.6, 1.25, b2P.value), 0], 2.1, 0.75, 1.5, {
      color: ROLE.batch1,
      width: 2.8,
      glow: 8,
    }),
  );

  // 24 glowing coordinate nodes inside the 3D (2, 3, 4) cube; highlight migrate [0, 1, :]
  for (let b = 0; b < 2; b++) {
    for (let t = 0; t < 3; t++) {
      for (let d = 0; d < 4; d++) {
        const isMigrate = b === 0 && t === 1;
        view3d.add(
          point3d(
            () => [-1.5 + d * 1.0, b === 0 ? -1.25 : mix(2.6, 1.25, b2P.value), 1.0 - t * 1.0],
            {
              color: isMigrate ? ROLE.feature : b === 0 ? ROLE.batch0 : ROLE.batch1,
              radius: isMigrate ? 8.5 : 5.2,
              glow: isMigrate ? 12 : 6,
            },
          ),
        );
      }
    }
  }

  // Axis highlight lines inside 3D view
  view3d.add(
    line3d([-2.5, -1.25, -1.8], [-2.5, 1.25, -1.8], { color: ROLE.token, width: 3.5, glow: 8 }),
    line3d([-2.5, -1.25, 1.5], [-2.5, -1.25, -1.5], { color: ROLE.batch0, width: 3.5, glow: 8 }),
    line3d([-1.8, -1.25, -1.8], [1.8, -1.25, -1.8], { color: ROLE.feature, width: 3.5, glow: 8 }),
  );

  const headline = heroTitle(['Rank-3 Tensor', 'Shape (2, 3, 4)'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: '3D AXES  &  DTYPE STORAGE GATE',
  });

  const leftInfo = dynamic(() => {
    const ab = axBP.value;
    const at = axTP.value;
    const af = axFP.value;
    const rj = rejP.value;
    const cv = convP.value;
    const nodes = [];

    nodes.push(
      txt(
        'AXIS 0  ·  Batch (2 sentences)',
        -855,
        -205,
        30,
        ab > 0.2 ? ROLE.token : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'AXIS 1  ·  Token (3 words)',
        -855,
        -145,
        30,
        at > 0.2 ? ROLE.batch0 : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'AXIS 2 / −1  ·  Feature (4 floats)',
        -855,
        -85,
        30,
        af > 0.2 ? ROLE.feature : COSMOS.muted,
        'mono',
        'left',
      ),
      txt('migrate = x[0, 1, :]  →  [4, 5, 6, 7]', -855, -5, 30, ROLE.feature, 'mono', 'left'),
    );

    // Shape gate vs Dtype gate (floating indicators, no prose cards)
    if (rj > 0.05 || cv > 0.05) {
      const ok = cv > 0.4;
      nodes.push(
        txt('BOUNDARY GATES', -855, 105, 26, COSMOS.muted, 'mono', 'left'),
        txt('Shape (2, 3, 4):  PASS', -855, 165, 32, ROLE.good, 'mono', 'left').glow(6, ROLE.good),
        txt(
          ok ? 'Dtype float32:   PASS (converted)' : 'Dtype int64:     BLOCKED (needs float32)',
          -855,
          228,
          32,
          ok ? ROLE.good : ROLE.bad,
          'mono',
          'left',
        ).glow(9, ok ? ROLE.good : ROLE.bad),
        txt(
          ok
            ? 'Coordinates stay identical: migrate is still x[0, 1, :]'
            : 'Shape and dtype are checked separately',
          -855,
          298,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ),
      );
    }

    nodes.push(txt('3D TENSOR CUBE  (B=2, T=3, D=4)', 340, 395, 26, COSMOS.muted, 'mono'));
    return group(...nodes);
  });

  s.add(view3d, headline, leftInfo);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.92 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'add-second-sentence', b2P, 1, { dur: 0.9 });
  cueTo(s, c, 'name-batch-axis', axBP, 1, { dur: 0.55 });
  cueTo(s, c, 'name-token-axis', axTP, 1, { dur: 0.55 });
  cueTo(s, c, 'name-feature-axis', axFP, 1, { dur: 0.55 });
  cueTo(s, c, 'reject-integer-storage', rejP, 1, { after: true, dur: 0.4 });
  cueTo(s, c, 'convert-storage-type', convP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 3. index: What survives the brackets?
// Cues: choose-index-batch, choose-index-token, retain-index-features,
//       keep-singleton-token*, keep-both-sentences
// ---------------------------------------------------------------------------
export function index(s, c) {
  const bP = s.value(0);
  const tP = s.value(0);
  const fP = s.value(0);
  const slP = s.value(0);
  const bothP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch1, seed: 3 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1e', '#5ce1e614'));

  const headline = heroTitle(['Integers Drop Axes,', 'Slices Keep Them'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch1,
    eyebrow: 'INDEXING  VS  SLICING',
  });

  const live = dynamic(() => {
    const bp = bP.value;
    const tp = tP.value;
    const fp = fP.value;
    const sl = slP.value;
    const bt = bothP.value;
    const nodes = [];

    // Left: Batch 0 and Batch 1 compact 3x4 grids
    const renderBatch = (rows, words, yTop, batchIdx, activeBatch) => {
      const col = batchIdx === 0 ? ROLE.batch0 : ROLE.batch1;
      nodes.push(
        txt(
          `BATCH ${batchIdx}`,
          -840,
          yTop - 52,
          26,
          activeBatch ? col : COSMOS.dim,
          'mono',
          'left',
        ),
      );
      rows.forEach((row, r) => {
        const ry = yTop + r * 72;
        const rowActive = (bt > 0.2 && r === 1) || (activeBatch && tp > 0.2 && r === 1);
        nodes.push(
          txt(words[r], -840, ry, 28, rowActive ? ROLE.feature : COSMOS.muted, 'serif', 'left'),
        );
        row.forEach((val, d) => {
          nodes.push(
            numCell(val, -590 + d * 102, ry, {
              w: 88,
              h: 56,
              stroke: rowActive ? ROLE.feature : '#2c3d62',
              fill: rowActive ? '#261f10' : '#0e1629',
              textColor: rowActive ? ROLE.feature : COSMOS.ink,
              glow: rowActive ? 8 : 0,
              size: 26,
              opacity: activeBatch || bt > 0.2 ? 1 : 0.35,
            }),
          );
        });
      });
    };

    renderBatch(sequence0, sentenceWords[0], -145, 0, bt > 0.2 || bp < 0.2);
    renderBatch(sequence1, sentenceWords[1], 140, 1, bp > 0.2 || bt > 0.2);

    // Right: Live axis selector before fp arrives, then x[1,1,:] -> x[1,1:2,:] -> x[:,1,:]
    const rx = 60;
    const preFp = fadeOut(fp);
    if (preFp > 0.02 && sl < 0.05 && bt < 0.05) {
      nodes.push(
        group(
          txt('INDEX ADDRESS BUILDER', rx, -190, 28, ROLE.batch1, 'mono', 'left'),
          txt(
            `Batch axis:    ${bp > 0.2 ? '1  (Sentence 1)' : '0 or 1'}`,
            rx,
            -90,
            32,
            bp > 0.2 ? ROLE.batch1 : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            `Token axis:    ${tp > 0.2 ? '1  ("enjoy")' : '0, 1, or 2'}`,
            rx,
            -20,
            32,
            tp > 0.2 ? ROLE.feature : COSMOS.muted,
            'mono',
            'left',
          ),
          txt('Feature axis:  :  (keep all 4)', rx, 50, 32, COSMOS.muted, 'mono', 'left'),
          txt('x[batch, token, feature]', rx, 155, 36, ROLE.batch0, 'mono', 'left'),
        ).opacity(preFp),
      );
    }
    const postFp = fadeIn(fp);
    if (bt > 0.1) {
      nodes.push(
        group(
          txt('x[:, 1, :]   →   SHAPE (2, 4)', rx, -190, 32, ROLE.batch0, 'mono', 'left').glow(
            7,
            ROLE.batch0,
          ),
          txt('migrate', rx, -65, 30, ROLE.batch0, 'serif', 'left'),
          ...sequence0[1].map((v, d) =>
            numCell(v, rx + 210 + d * 116, -65, { stroke: ROLE.batch0, glow: 8, size: 30 }),
          ),
          txt('enjoy', rx, 30, 30, ROLE.batch1, 'serif', 'left'),
          ...sequence1[1].map((v, d) =>
            numCell(v, rx + 210 + d * 116, 30, { stroke: ROLE.batch1, glow: 8, size: 30 }),
          ),
          txt(
            'Leading colon preserves batch order; integer drops token axis',
            rx,
            155,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(bt),
      );
    } else if (sl > 0.1) {
      nodes.push(
        group(
          txt('x[1, 1:2, :]   →   SHAPE (1, 4)', rx, -190, 32, ROLE.feature, 'mono', 'left').glow(
            8,
            ROLE.feature,
          ),
          txt('Row 0', rx, -55, 28, ROLE.feature, 'mono', 'left'),
          ...sequence1[1].map((v, d) =>
            numCell(v, rx + 190 + d * 120, -55, { stroke: ROLE.feature, glow: 10, size: 32 }),
          ),
          txt(
            'Same 4 values, now a 2D row matrix (orientation kept!)',
            rx,
            85,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(sl),
      );
    } else if (postFp > 0.02) {
      nodes.push(
        group(
          txt('x[1, 1, :]   →   SHAPE (4,)', rx, -190, 32, ROLE.good, 'mono', 'left').glow(
            7,
            ROLE.good,
          ),
          ...sequence1[1].map((v, d) =>
            numCell(v, rx + 110 + d * 124, -55, { stroke: ROLE.good, glow: 9, size: 32 }),
          ),
          txt(
            'Two integers spent · Only the 1D feature axis remains',
            rx,
            85,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ),
        ).opacity(postFp),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'choose-index-batch', bP, 1, { dur: 0.65 });
  cueTo(s, c, 'choose-index-token', tP, 1, { dur: 0.65 });
  cueTo(s, c, 'retain-index-features', fP, 1, { dur: 0.7 });
  cueTo(s, c, 'keep-singleton-token', slP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'keep-both-sentences', bothP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 4. broadcast: Which way do the offsets run?
// Cues: add-feature-offsets, align-broadcast-dimensions, reject-token-vector*,
//       insert-feature-singleton*, predict-square-broadcast, deal-square-offsets,
//       resolve-square-broadcast*, finish-square-rows
// ---------------------------------------------------------------------------
export function broadcast(s, c) {
  const featP = s.value(0);
  const alignP = s.value(0);
  const rejP = s.value(0);
  const fixP = s.value(0);
  const sqPredP = s.value(0);
  const dealP = s.value(0);
  const resP = s.value(0);
  const finP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.feature, seed: 4 }));
  s.add(decorAura(0, 30, 560, '#ffd1661c', '#ff6b8b14'));

  const headline = heroTitle(['Broadcasting Aligns', 'From the Right'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.feature,
    eyebrow: 'FEATURE BIAS · SHAPE ALIGNMENT · SQUARE TRAP',
  });

  // View 1: Feature bias + Right-aligned shape lanes
  const view1 = guardedDynamic(
    () => fadeOut(sqPredP.value),
    (vis) => {
      const ft = featP.value;
      const al = alignP.value;
      const rj = rejP.value;
      const fx = fixP.value;
      const nodes = [];

      // Left: migrate [4, 5, 6, 7] + [100, 200, 300, 400] -> [104, 205, 306, 407]
      const lx = -780;
      nodes.push(
        txt(
          'REUSE 4 FEATURE OFFSETS ACROSS ALL 6 WORDS',
          lx,
          -210,
          26,
          ROLE.feature,
          'mono',
          'left',
        ),
        txt('migrate:', lx, -110, 28, ROLE.batch0, 'serif', 'left'),
        ...sequence0[1].map((v, d) =>
          numCell(v, lx + 210 + d * 130, -110, { stroke: ROLE.batch0 }),
        ),
        txt('+ bias:', lx, -18, 28, ROLE.feature, 'mono', 'left'),
        ...bias.map((b, d) =>
          numCell(b, lx + 210 + d * 130, -18, { stroke: ROLE.feature, glow: ft > 0.1 ? 8 : 0 }),
        ),
      );
      nodes.push(
        txt('= sum:', lx, 82, 28, ft > 0.1 ? ROLE.good : COSMOS.dim, 'mono', 'left'),
        ...sequence0[1].map((v, d) =>
          numCell(ft > 0.1 ? v + bias[d] : '?', lx + 210 + d * 130, 82, {
            stroke: ft > 0.1 ? ROLE.good : '#2c3d62',
            textColor: ft > 0.1 ? ROLE.good : COSMOS.dim,
            glow: ft > 0.1 ? 9 : 0,
            opacity: mix(0.55, 1, ft),
          }),
        ),
        txt(
          'Same 4 offsets broadcast across all 6 words',
          lx,
          175,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ),
      );

      // Right: Right-aligned shape table (always visible as reference, brightens on align cue)
      const rx = 140;
      nodes.push(
        group(
          txt('RIGHT-TO-LEFT ALIGNMENT', rx, -210, 26, ROLE.batch0, 'mono', 'left'),
          txt('x:       ( 2,  3,  4 )', rx, -125, 36, COSMOS.ink, 'mono', 'left'),
          txt('feat:    ( 1,  1,  4 )  OK', rx, -50, 34, ROLE.good, 'mono', 'left'),
          rj > 0.05
            ? txt('tok(3,): ( 1,  1,  3 )  3 ≠ 4!', rx, 30, 34, ROLE.bad, 'mono', 'left')
                .glow(9, ROLE.bad)
                .opacity(rj)
            : txt('Output shape: (2, 3, 4) = 24 floats', rx, 35, 28, COSMOS.muted, 'mono', 'left'),
          fx > 0.05
            ? txt('tok(3,1):( 1,  3,  1 )  FIXED!', rx, 110, 34, ROLE.good, 'mono', 'left')
                .glow(9, ROLE.good)
                .opacity(fx)
            : group(),
        ).opacity(mix(0.65, 1, al)),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Square (3, 3) trap: bare (3,) vs (3, 1)
  const view2 = guardedDynamic(
    () => fadeIn(sqPredP.value),
    (vis) => {
      const dl = dealP.value;
      const rs = resP.value;
      const fn = finP.value;
      const nodes = [];

      nodes.push(
        txt(
          'SQUARE (3, 3) TRAP:  ADD [10, 20, 30] TO BIRDS, MIGRATE, SOUTH',
          -855,
          -215,
          28,
          ROLE.feature,
          'mono',
          'left',
        ),
      );

      // Left: Bare vector (3,) -> adds [10, 20, 30] ACROSS columns!
      const lx = -660;
      nodes.push(
        txt(
          'BARE  square + [10, 20, 30]',
          lx,
          -135,
          30,
          rs > 0.2 ? ROLE.bad : COSMOS.ink,
          'mono',
          'left',
        ),
      );
      squareInput.forEach((row, r) => {
        const ry = -45 + r * 92;
        nodes.push(txt(firstSnippetWords[r], lx - 140, ry, 28, COSMOS.muted, 'serif', 'left'));
        row.forEach((val, d) => {
          const showResult =
            (r === 0 && d === 0 && dl > 0.2) || (r === 0 && d === 1 && rs > 0.2) || fn > 0.3;
          const shown = showResult ? wrongSquare[r][d] : val;
          const isDiverge = r === 0 && d === 1 && rs > 0.2;
          nodes.push(
            numCell(shown, lx + 80 + d * 135, ry, {
              w: 112,
              h: 68,
              stroke: isDiverge ? ROLE.bad : showResult ? ROLE.feature : '#2f4168',
              textColor: isDiverge ? ROLE.bad : COSMOS.ink,
              glow: isDiverge ? 12 : 0,
            }),
          );
        });
      });

      // Right: Column vector (3, 1) -> keeps Birds on +10 across all 3 features!
      const rx = 180;
      nodes.push(
        txt(
          'COLUMN  square + [[10],[20],[30]]',
          rx,
          -135,
          30,
          rs > 0.2 ? ROLE.good : COSMOS.ink,
          'mono',
          'left',
        ),
      );
      squareInput.forEach((row, r) => {
        const ry = -45 + r * 92;
        nodes.push(txt(firstSnippetWords[r], rx - 140, ry, 28, COSMOS.muted, 'serif', 'left'));
        row.forEach((val, d) => {
          const showResult =
            (r === 0 && d === 0 && dl > 0.2) || (r === 0 && d === 1 && rs > 0.2) || fn > 0.3;
          const shown = showResult ? rightSquare[r][d] : val;
          const isGood = r === 0 && d === 1 && rs > 0.2;
          nodes.push(
            numCell(shown, rx + 80 + d * 135, ry, {
              w: 112,
              h: 68,
              stroke: isGood ? ROLE.good : showResult ? ROLE.batch0 : '#2f4168',
              textColor: isGood ? ROLE.good : COSMOS.ink,
              glow: isGood ? 12 : 0,
            }),
          );
        });
      });

      nodes.push(
        txt(
          rs > 0.2
            ? 'Cell (0, 1): 21 (wrong column broadcast!) vs 11 (true Birds + 10)'
            : 'Both agree on cell (0, 0) = 10 · What happens to Birds middle value?',
          0,
          285,
          32,
          rs > 0.2 ? ROLE.feature : COSMOS.ink,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'add-feature-offsets', featP, 1, { dur: 0.9 });
  cueTo(s, c, 'align-broadcast-dimensions', alignP, 1, { dur: 0.7 });
  cueTo(s, c, 'reject-token-vector', rejP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'insert-feature-singleton', fixP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'predict-square-broadcast', sqPredP, 1, { dur: 0.85 });
  cueTo(s, c, 'deal-square-offsets', dealP, 1, { dur: 0.8 });
  cueTo(s, c, 'resolve-square-broadcast', resP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'finish-square-rows', finP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 5. contracts: Which inputs can this function accept?
// Cues: image-transfer, image-subtract, move-color-axis, boundary-contract,
//       reject-short-bias, contract-repair*
// ---------------------------------------------------------------------------
export function contracts(s, c) {
  const imgP = s.value(0);
  const subP = s.value(0);
  const axisP = s.value(0);
  const bndP = s.value(0);
  const rejP = s.value(0);
  const repP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 5 }));
  s.add(decorAura(0, 30, 560, '#6ee7b71e', '#5ce1e614'));

  const headline = heroTitle(['Channel Means &', 'Boundary Guards'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'RGB TRANSFER  ·  VALUEERROR AT THE BOUNDARY',
  });

  // View 1: RGB image channel mean subtraction
  const view1 = guardedDynamic(
    () => fadeOut(bndP.value),
    (vis) => {
      const sb = subP.value;
      const ax = axisP.value;
      const chans = [
        { name: 'Red', col: ROLE.bad, mean: imageChannelMeans[0], out: centeredWhitePixel[0] },
        { name: 'Green', col: ROLE.good, mean: imageChannelMeans[1], out: centeredWhitePixel[1] },
        { name: 'Blue', col: ROLE.token, mean: imageChannelMeans[2], out: centeredWhitePixel[2] },
      ];
      const nodes = [
        txt(
          'WHITE PIXEL [1.00, 1.00, 1.00]  −  TRAINING CHANNEL MEANS',
          -855,
          -205,
          28,
          ROLE.batch0,
          'mono',
          'left',
        ),
      ];
      chans.forEach((ch, i) => {
        const cy = -85 + i * 115;
        const val = mix(1.0, ch.out, sb);
        nodes.push(
          txt(ch.name, -820, cy, 32, ch.col, 'sans', 'left'),
          rect(760, 44, { fill: '#10182d', stroke: '#2f4168', width: 1.8, radius: 10 }).at(
            -260,
            cy,
          ),
          rect(Math.max(10, 760 * val), 40, { fill: ch.col, stroke: null, radius: 10 })
            .at(-640 + (760 * val) / 2, cy)
            .glow(10, ch.col),
          txt(
            sb > 0.3 ? `1.00 − ${ch.mean.toFixed(2)} = ${ch.out.toFixed(2)}` : '1.00',
            180,
            cy,
            32,
            ch.col,
            'mono',
            'left',
          ),
        );
      });
      if (ax > 0.1) {
        nodes.push(
          txt(
            'NCHW layout (B, C, H, W)  →  mean shape (1, 3, 1, 1)',
            -820,
            265,
            32,
            ROLE.feature,
            'mono',
            'left',
          )
            .glow(6, ROLE.feature)
            .opacity(ax),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Text boundary contract (3 offsets rejected -> 4 offsets accepted)
  const view2 = guardedDynamic(
    () => fadeIn(bndP.value),
    (vis) => {
      const rj = rejP.value;
      const rp = repP.value;
      const nodes = [];

      nodes.push(
        txt(
          'BOUNDARY CONTRACT:  rank == 3  AND  bias.shape == (D,)',
          -855,
          -205,
          28,
          ROLE.feature,
          'mono',
          'left',
        ),
        txt('migrate features (D = 4):', -820, -85, 30, ROLE.batch0, 'sans', 'left'),
        ...sequence0[1].map((v, d) =>
          numCell(v, -320 + d * 150, -85, { stroke: ROLE.batch0, glow: 7 }),
        ),
        txt('caller bias:', -820, 45, 30, rp > 0.2 ? ROLE.good : ROLE.bad, 'sans', 'left'),
      );

      const biasVals = rp > 0.2 ? bias : [10, 20, 30];
      biasVals.forEach((b, d) => {
        nodes.push(
          numCell(b, -320 + d * 150, 45, {
            stroke: rp > 0.2 ? ROLE.good : ROLE.feature,
            glow: 8,
          }),
        );
      });

      if (rp < 0.2 && rj > 0.1) {
        nodes.push(
          numCell('?', -320 + 3 * 150, 45, {
            stroke: ROLE.bad,
            fill: '#2b101b',
            textColor: ROLE.bad,
            glow: 12,
          }),
          txt(
            'ValueError: 4th feature has no partner (never rely on assert for inputs!)',
            -820,
            205,
            32,
            ROLE.bad,
            'serif',
            'left',
          )
            .glow(8, ROLE.bad)
            .opacity(rj),
        );
      } else if (rp > 0.2) {
        nodes.push(
          txt(
            'All 4 partners matched  →  accepted! Internal assert checks output shape.',
            -820,
            205,
            32,
            ROLE.good,
            'serif',
            'left',
          )
            .glow(8, ROLE.good)
            .opacity(rp),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'image-transfer', imgP, 1, { dur: 0.7 });
  cueTo(s, c, 'image-subtract', subP, 1, { dur: 0.9 });
  cueTo(s, c, 'move-color-axis', axisP, 1, { dur: 0.7 });
  cueTo(s, c, 'boundary-contract', bndP, 1, { dur: 0.85 });
  cueTo(s, c, 'reject-short-bias', rejP, 1, { dur: 0.7 });
  cueTo(s, c, 'contract-repair', repP, 1, { after: true, dur: 0.7 });
}
