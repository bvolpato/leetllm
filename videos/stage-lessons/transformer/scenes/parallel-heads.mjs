// Scene 13: parallel-heads: "Split projected features while preserving every token"
// View 1 (Beat 0): 3x6 HEAD_WORKSHEET tensor peels cleanly along the feature axis into 3 parallel 3x2 heads
//         while keeping all 3 tokens intact ([1, 3, 3, 2]).
// View 2 (Beat 1): 3 independent 3x3 causal attention matrices -> 3 two-feature reads concatenate back to 6.
// View 3 (Beat 2): Orbiting 3D sequential block stack (cinematic3d + wireframeSlab3d) contrasting
//         parallel heads inside one block with sequential dependency across Block 1 -> Block 2 -> Block 3.
import { arrow, gridPlane3d } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  guardedDynamic,
  heroTitle,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import {
  HEAD_WORKSHEET,
  ROLE,
  TOK_COLORS,
  cinemaAtmosphere,
  dotProduct,
  fmt,
  glowMatrix,
  playCue,
  splitHeads,
  stableSoftmax,
  sum,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function parallelHeads(s, c) {
  const title = heroTitle(['Multi-head split:', 'keep every token intact'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.pos,
  });

  const heads = splitHeads(HEAD_WORKSHEET);
  const headColors = [ROLE.stream, ROLE.mask, ROLE.valid];

  // Precompute per-head causal attention matrices & final reads from HEAD_WORKSHEET
  const headStats = heads.map((v) => {
    const weights = v.map((q, i) => [
      ...stableSoftmax(v.slice(0, i + 1).map((k) => dotProduct(q, k) / Math.sqrt(2))),
      ...Array(2 - i).fill(0),
    ]);
    const read = [0, 1].map((j) => sum(v.map((r, i) => r[j] * weights[2][i])));
    return { weights, read };
  });

  const vSplit = s.value(1);
  const vMerge = s.value(0);
  const vDepth = s.value(0);

  const splitProg = s.value(0);
  const shapeShow = s.value(0);
  const mergeProg = s.value(0);
  const identityShow = s.value(0);
  const depthProg = s.value(0);

  // 3D sequential block tower for View 3 (hidden until View 3!)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.0,
    unit: 82,
    focus: [0, 0, 0.25],
  }).at(430, -35);

  const floor3d = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.2, 2.2],
    z: -1.8,
    step: 1,
    color: '#2b3d69',
    opacity: 0.45,
  });
  const block1 = wireframeSlab3d([0, 0, -1.0], 2.0, 1.25, 0.32, {
    color: ROLE.stream,
    width: 2.6,
    glow: 8,
  });
  const block2 = wireframeSlab3d([0, 0, 0.25], 2.0, 1.25, 0.32, {
    color: ROLE.mask,
    width: 2.6,
    glow: 8,
  });
  const block3 = wireframeSlab3d([0, 0, 1.5], 2.0, 1.25, 0.32, {
    color: ROLE.valid,
    width: 2.8,
    glow: 10,
  });
  view3d.add(floor3d, ...block1, ...block2, ...block3);

  // VIEW 1: 3x6 projected tensor splits into 3 heads of shape 3x2
  const splitLayer = guardedDynamic(vSplit, (alpha) => {
    const sp = splitProg.value;
    const sh = shapeShow.value;
    const fullColors = HEAD_WORKSHEET.map(() => [
      headColors[0],
      headColors[0],
      headColors[1],
      headColors[1],
      headColors[2],
      headColors[2],
    ]);
    const nodes = [
      txt(
        'B = 1  ·  T = 3 tokens  ·  d = 6 features  ·  h = 3 heads',
        185,
        -355,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -430,
        cy: -5,
        rows: 3,
        cols: 6,
        cellW: 108,
        cellH: 76,
        gap: 8,
        values: HEAD_WORKSHEET.map((r) => r.map((v) => fmt(v, 1))),
        colors: fullColors,
        rowLabels: ['t0', 't1', 't2'],
        fontSize: 26,
        opacity: alpha,
      }),
      txt('[1, 3, 6] projected', -430, 185, 28, ROLE.attn, 'mono', 'center').opacity(alpha),
    ];

    heads.forEach((hMat, h) => {
      const cx = 140 + h * 290;
      const cy = -5 + (1 - sp) * 75;
      nodes.push(
        txt(`head ${h}`, cx, cy - 172, 28, headColors[h], 'mono', 'center').opacity(alpha),
        glowMatrix({
          cx,
          cy,
          rows: 3,
          cols: 2,
          cellW: 106,
          cellH: 76,
          gap: 8,
          values: hMat.map((r) => r.map((v) => fmt(v, 1))),
          colors: hMat.map(() => [headColors[h], headColors[h]]),
          fontSize: 26,
          bracketColor: headColors[h],
          opacity: (0.3 + 0.7 * sp) * alpha,
        }),
      );
    });

    nodes.push(
      txt(
        sh > 0.35
          ? 'Reshaped & transposed:  [1, 3, 3, 2]  =  [B, h, T, d_h]'
          : 'Reshape feature axis -> [B, h, T, d_h]',
        0,
        305,
        34,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(sh > 0.35 ? 8 : 0, ROLE.query)
        .opacity(alpha),
      txt(
        'Every head retains all 3 tokens; never split along the token axis',
        0,
        395,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Independent 3x3 causal reads concatenate back to width 6
  const mergeLayer = guardedDynamic(vMerge, (alpha) => {
    const mp = mergeProg.value;
    const idOn = identityShow.value;
    const headXs = [-560, 0, 560];
    const nodes = [
      txt(
        '3 parallel 3x3 causal attention reads -> concatenate to 6 features',
        0,
        -285,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    headStats.forEach(({ weights, read }, h) => {
      const cx = headXs[h];
      const col = headColors[h];
      nodes.push(
        txt(`head ${h} weights`, cx, -225, 28, col, 'mono', 'center').opacity(alpha),
        glowMatrix({
          cx,
          cy: -85,
          rows: 3,
          cols: 3,
          cellW: 120,
          cellH: 64,
          gap: 8,
          values: weights.map((r) => r.map((v) => fmt(v, 2))),
          colors: weights.map((r, i) => r.map((_, j) => (j <= i ? col : ROLE.rule))),
          dim: (i, j) => j > i,
          fontSize: 26,
          bracketColor: col,
          opacity: alpha,
        }),
        txt(`head ${h} read`, cx, 68, 26, col, 'mono', 'center').opacity(alpha),
        vectorRow({
          cx,
          cy: 138,
          values: mp > 0.3 ? read : ['?', '?'],
          cellW: 155,
          cellH: 68,
          gap: 12,
          color: col,
          digits: 2,
          fontSize: 26,
          opacity: alpha,
        }),
      );
    });

    const concat = headStats.flatMap((hs) => hs.read);
    nodes.push(
      vectorRow({
        cx: 0,
        cy: 278,
        values: mp > 0.65 ? concat : ['?', '?', '?', '?', '?', '?'],
        cellW: 162,
        cellH: 72,
        gap: 12,
        color: ROLE.query,
        digits: 2,
        fontSize: 26,
        label: 'concat',
        opacity: alpha,
      }),
      txt(
        idOn > 0.35
          ? 'Reverse transpose + reshape restores every entry identity  ->  apply W_O'
          : 'Concatenate 2-feature head reads into model width 6',
        0,
        395,
        28,
        idOn > 0.35 ? ROLE.valid : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(idOn > 0.35 ? 6 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Parallel heads vs sequential depth (paired with orbiting 3D tower!)
  const depthLayer = guardedDynamic(vDepth, (alpha) => {
    const dp = depthProg.value;
    const baseRow = [0.1, 0.3, 0.9, 1.1];
    const nodes = [
      txt(
        'Heads run in parallel; blocks run sequentially',
        -380,
        -255,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      txt('3D residual stack', 430, -295, 30, ROLE.pos, 'mono', 'center').opacity(alpha),
    ];

    [0, 1, 2].forEach((bIdx) => {
      const y = -135 + bIdx * 165;
      const col = TOK_COLORS[bIdx];
      const vals = baseRow.map((v, j) => v + (bIdx + 1) * 0.1 * (j + 1));
      const lit = dp >= bIdx / 3;
      nodes.push(
        vectorRow({
          cx: -350,
          cy: y,
          values: vals,
          cellW: 136,
          cellH: 72,
          gap: 12,
          color: col,
          digits: 2,
          label: `block ${bIdx + 1}`,
          opacity: (lit ? 1 : 0.3) * alpha,
        }),
      );
      if (bIdx < 2) {
        nodes.push(
          arrow([-350, y + 48], [-350, y + 116], { stroke: col, width: 3.5, tip: 13 }).opacity(
            (dp > (bIdx + 0.5) / 3 ? 1 : 0.25) * alpha,
          ),
        );
      }
    });

    nodes.push(
      txt(
        "Block 2 consumes Block 1's output  ·  each block learns separate projections",
        0,
        412,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.pos, ROLE.stream), title, splitLayer, mergeLayer, depthLayer);

  // Beat 0: split into 3 heads
  playCue(s, c, 'tr-parallel-heads-voice-0', (d) => s.play(splitProg.to(1, { duration: d })), {
    dur: 1.4,
  });
  playCue(s, c, 'tr-parallel-heads-split', (d) => s.play(shapeShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: independent reads & exact merge
  playCue(
    s,
    c,
    'tr-parallel-heads-voice-1',
    (d) => s.play(swapVis(vSplit, vMerge, Math.min(0.65, d * 0.4))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-parallel-heads-voice-1', (d) => s.play(mergeProg.to(1, { duration: d })), {
    dur: 1.5,
    offset: 0.7,
  });
  playCue(s, c, 'tr-parallel-heads-merge', (d) => s.play(identityShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: sequential block stack + orbiting 3D tower (add view3d strictly AFTER vMerge has faded to 0!)
  playCue(
    s,
    c,
    'tr-parallel-heads-voice-2',
    (d) => {
      s.play(swapVis(vMerge, vDepth, Math.min(0.65, d * 0.35)));
    },
    { dur: 0.7 },
  );
  const v2Start = c.cue('tr-parallel-heads-voice-2').start;
  const orbitDur = Math.max(0.8, c.end - v2Start - 1.05);
  c.on(
    'tr-parallel-heads-voice-2',
    () => {
      s.add(view3d);
      s.play(
        depthProg.to(1, { duration: Math.min(2.2, orbitDur) }),
        view3d.orbit({ theta: -0.22, phi: 0.96, distance: 14.4 }, { duration: orbitDur }),
      );
    },
    0.45,
  );
}
