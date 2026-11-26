// Scene 12: hook-and-circuit - "A feature hook must preserve its computational meaning"
// Signature Luminous 3-Layer Transformer Architecture & Cross-Layer Transcoder Circuit Graph
// (ZERO namedBox / PowerPoint cards!):
// Beat 0: Orbiting gold hook ring glides between residual stream, MLP output, and attention output
//         while 3 glowing deterministic activation clouds contrast their distinct distributions.
// Beat 1: Three glowing stream lanes (Credential 1.08 + Urgency 0.08 + Formatting 0.00 = 1.16)
//         on a luminous readout ruler; ablate credential (-> 0.08), restore, ablate formatting (1.16).
// Beat 2: Cross-Layer Transcoder (CLT) glowing cyan feature orbs read residual stream and fan
//         luminous multi-layer Bezier write arcs into downstream MLP `+` summers.
// Beat 3: Local replacement model freezes attention patterns & norm denominators, attaches
//         emerald constant error nodes (+e), stops intervening L1 MLP output, and illuminates
//         one gold direct attribution path L0 -> L2.
import {
  arrow,
  dot,
  draw,
  dynamic,
  fade,
  group,
  indicate,
  line,
  recolor,
  seededRandom,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  arcPts,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowingTrail,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
} from '../parts.mjs';

const LAYERS = 3;
const READOUT = {
  names: ['Credential', 'Urgency', 'Formatting'],
  weights: [1.2, 0.1, 0],
  activations: [0.9, 0.8, 0.7],
  colors: [ROLE.first, ROLE.second, COSMOS.dim],
};

function cloudDots(cx, cy, w, h, color, seed, shape) {
  const random = seededRandom(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  return Array.from({ length: 42 }, () => {
    const [u, v] = shape(gauss(), gauss());
    return dot(4, color)
      .opacity(0.84)
      .at(
        cx + Math.max(-1, Math.min(1, u / 2.6)) * (w / 2 - 8),
        cy - Math.max(-1, Math.min(1, v / 2.6)) * (h / 2 - 8),
      );
  });
}

function archNode(x, y, w, h, label, color) {
  return group(
    lumBar(x, y, w, h, {
      color,
      fillOpacity: 0.18,
      strokeWidth: 2.4,
      glow: 7,
      radius: 14,
    }),
    txt(label, x, y, 28, COSMOS.ink, 'sans', 'center'),
  );
}

export default function hookAndCircuit(s, c) {
  const atmo = cinemaAtmosphere(ROLE.other, ROLE.first);
  const title = heroTitle(['A feature hook must preserve', 'its computational meaning'], {
    x: -855,
    y: -445,
    size: 46,
    lineHeight: 54,
    accent: ROLE.other,
  });

  // --- Full-width luminous 3-layer Transformer diagram (y centered around -105) ---
  const streamY = -95;
  const tokX = -760;
  const logX = 760;
  const tokensHub = archNode(tokX, streamY, 155, 72, 'tokens', '#6c82b5');
  const logitsHub = archNode(logX, streamY, 155, 72, 'logits', ROLE.mark);
  const streamLine = line([tokX + 82, streamY], [logX - 82, streamY], {
    stroke: '#586d9b',
    width: 6,
  }).glow(5, '#586d9b');

  const layerXs = [-385, 0, 385];
  const layers = layerXs.map((lx, idx) => {
    const attnX = lx - 62;
    const attnY = streamY - 148;
    const mlpX = lx + 62;
    const mlpY = streamY + 148;
    const attn = archNode(attnX, attnY, 178, 66, `Attn L${idx}`, '#6078ab');
    const mlp = archNode(mlpX, mlpY, 160, 66, `MLP L${idx}`, '#6078ab');

    const aReadX = attnX - 38;
    const aWriteX = attnX + 38;
    const mReadX = mlpX - 34;
    const mWriteX = mlpX + 34;

    const aRead = arrow([aReadX, streamY - 6], [aReadX, attnY + 37], {
      stroke: '#5a709e',
      width: 3,
      tip: 12,
    });
    const aWrite = arrow([aWriteX, attnY + 37], [aWriteX, streamY - 6], {
      stroke: '#5a709e',
      width: 3,
      tip: 12,
    });
    const mRead = arrow([mReadX, streamY + 6], [mReadX, mlpY - 37], {
      stroke: '#5a709e',
      width: 3,
      tip: 12,
    });
    const mWrite = arrow([mWriteX, mlpY - 37], [mWriteX, streamY + 6], {
      stroke: '#5a709e',
      width: 3,
      tip: 12,
    });

    return {
      lx,
      attn,
      mlp,
      attnPos: [attnX, attnY],
      mlpPos: [mlpX, mlpY],
      a: { read: aRead, write: aWrite, out: [aWriteX, (attnY + 35 + streamY) / 2] },
      m: { read: mRead, write: mWrite, out: [mWriteX, (mlpY - 35 + streamY) / 2] },
      after: [lx + 185, streamY],
    };
  });

  const modelNodes = [
    tokensHub,
    logitsHub,
    streamLine,
    ...layers.flatMap((l) => [l.attn, l.mlp, l.a.read, l.a.write, l.m.read, l.m.write]),
  ];
  const lowerRule = rule(-840, 140, 840, 140, COSMOS.rule, 1.6).opacity(0.55);

  s.add(atmo, title, ...modelNodes, lowerRule);

  // --- Beat 0: Orbiting gold hook visits 3 sites + 3 distinct activation clouds ---
  const sites = [layers[0].after, layers[1].m.out, layers[1].a.out];
  const where = s.value(0);
  const hookRing = dynamic(() => {
    const low = Math.min(sites.length - 2, Math.floor(where.value));
    const sh = where.value - low;
    const x = sites[low][0] + (sites[low + 1][0] - sites[low][0]) * sh;
    const y = sites[low][1] + (sites[low + 1][1] - sites[low][1]) * sh;
    return glowRing(x, y, 22, ROLE.mark, { width: 4.5, glow: 12, fillOpacity: 0.16 });
  });

  const siteData = [
    { y: 205, name: 'Residual stream', desc: 'accumulated shared trunk', col: ROLE.first },
    { y: 300, name: 'MLP output', desc: 'nonlinear branch update', col: ROLE.second },
    { y: 395, name: 'Attention output', desc: 'routed context before merge', col: ROLE.other },
  ];
  const siteRows = siteData.map((d) => [
    glowDot(-805, d.y, { radius: 8, color: d.col, glow: 10 }),
    txt(d.name, -775, d.y, 32, d.col, 'sans', 'left'),
    txt(d.desc, -430, d.y, 30, COSMOS.ink, 'sans', 'left'),
  ]);

  const clouds = [
    cloudDots(420, 205, 290, 74, ROLE.first, 3, (u, v) => [u, v]),
    cloudDots(420, 300, 290, 74, ROLE.second, 4, (u, v) => [Math.abs(u) ** 2.2 - 1.6, v * 0.35]),
    cloudDots(420, 395, 290, 74, ROLE.other, 5, (u, v) => [u + v * 0.2, u * 0.8 + v * 0.25]),
  ];
  const cloudCap = txt(
    'Distinct activation distributions',
    420,
    452,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  s.add(hookRing, ...siteRows[0]);
  c.show('hook-and-circuit-b0', [...clouds[0], cloudCap], { after: true });
  playCue(s, c, 'hook-mlp', (d) => s.play(where.to(1, { duration: d })), { dur: 0.95 });
  c.show('hook-mlp', siteRows[1]);
  playCue(s, c, 'hook-attn', (d) => s.play(where.to(2, { duration: d })), { dur: 0.95 });
  c.show('hook-attn', siteRows[2]);
  c.show('hook-width', [...clouds[1], ...clouds[2]]);

  const matchHead = txt(
    'Match every hook convention (same width ≠ same space):',
    0,
    210,
    30,
    COSMOS.muted,
    'sans',
    'center',
  );
  const matchLine1 = txt(
    'checkpoint  ·  layer  ·  token position  ·  normalization',
    0,
    275,
    30,
    ROLE.mark,
    'mono',
    'center',
  ).glow(6, ROLE.mark);
  const matchLine2 = txt(
    'projection  ·  centering  ·  rescaling  ·  dtype',
    0,
    330,
    30,
    ROLE.mark,
    'mono',
    'center',
  ).glow(6, ROLE.mark);

  const jointRings = sites
    .slice(0, 2)
    .map((pt) => glowRing(pt[0], pt[1], 22, ROLE.mark, { width: 4, glow: 10 }));
  const jointNote = txt(
    'Joint dictionary: explicitly trained across every site',
    0,
    405,
    30,
    ROLE.other,
    'sans',
    'center',
  );

  c.swap(
    'hook-match',
    [...siteRows.flat(), ...clouds.flat(), cloudCap],
    [matchHead, matchLine1, matchLine2],
  );
  c.show('hook-joint', [...jointRings, jointNote]);

  // --- Beat 1: Feature circuit readout (1.08 + 0.08 + 0.00 = 1.16) ---
  const kept = s.value(1);
  const formatting = s.value(1);
  const actOf = (i) => READOUT.activations[i] * [kept.value, 1, formatting.value][i];
  const contribOf = (i) => actOf(i) * READOUT.weights[i];
  const totalScore = () => READOUT.activations.reduce((sum, _, i) => sum + contribOf(i), 0);

  const laneStartX = layers[0].after[0];
  const laneEndX = logX - 84;
  const laneOffsets = [-14, 0, 14];
  const paths = READOUT.colors.map((col, i) => [
    line([laneStartX, streamY + laneOffsets[i]], [laneEndX, streamY + laneOffsets[i]], {
      stroke: col,
      width: 5,
    }).glow(col === COSMOS.dim ? 0 : 8, col),
    glowDot(laneStartX, streamY + laneOffsets[i], {
      radius: 9,
      color: col,
      glow: col === COSMOS.dim ? 0 : 10,
    }),
  ]);

  const termHead = txt(
    'Activation × weight = contribution',
    -815,
    195,
    28,
    COSMOS.muted,
    'sans',
    'left',
  );
  const termRows = READOUT.names.flatMap((name, i) => {
    const ry = 260 + i * 68;
    const col = READOUT.colors[i];
    return [
      txt(name, -815, ry, 32, col, 'sans', 'left'),
      dynamic(() =>
        txt(
          `${actOf(i).toFixed(1)} × ${READOUT.weights[i].toFixed(1)} = ${contribOf(i).toFixed(2)}`,
          -145,
          ry,
          30,
          col,
          'mono',
          'right',
        ),
      ),
    ];
  });

  // Glowing readout ruler on lower-right
  const rLeft = 60;
  const rRight = 800;
  const rY = 345;
  const rAt = (v) => rLeft + (v / 1.3) * (rRight - rLeft);
  const rScale = [
    rule(rLeft, rY + 24, rRight, rY + 24, '#4c608d', 3),
    ...[0, 0.5, 1].flatMap((tk) => [
      line([rAt(tk), rY + 24], [rAt(tk), rY + 36], { stroke: '#4c608d', width: 2.5 }),
      txt(String(tk), rAt(tk), rY + 62, 26, COSMOS.dim, 'mono', 'center'),
    ]),
  ];
  const rStack = dynamic(() => {
    const c0 = contribOf(0);
    const c1 = contribOf(1);
    const out = [];
    if (c0 > 0.005) {
      out.push(
        lumBar((rAt(0) + rAt(c0)) / 2, rY, rAt(c0) - rAt(0), 28, {
          color: READOUT.colors[0],
          fillOpacity: 0.48,
          strokeWidth: 2,
          glow: 9,
          radius: 5,
        }),
      );
    }
    if (c1 > 0.005) {
      out.push(
        lumBar((rAt(c0) + rAt(c0 + c1)) / 2, rY, rAt(c0 + c1) - rAt(c0), 28, {
          color: READOUT.colors[1],
          fillOpacity: 0.48,
          strokeWidth: 2,
          glow: 9,
          radius: 5,
        }),
      );
    }
    return out;
  });
  const scoreReadout = dynamic(() => [
    txt('Readout score', 280, 225, 32, COSMOS.muted, 'sans', 'right'),
    txt(totalScore().toFixed(2), 315, 225, 64, ROLE.mark, 'mono', 'left').glow(10, ROLE.mark),
  ]);

  c.swap(
    'hook-and-circuit-b1',
    [hookRing, ...jointRings, jointNote, matchHead, matchLine1, matchLine2],
    paths.flat(),
  );
  c.show('circuit-terms', [termHead, ...termRows, ...rScale, rStack]);
  c.show('circuit-score', scoreReadout, { after: true });

  playCue(
    s,
    c,
    'circuit-remove',
    (d) =>
      s.play(kept.to(0, { duration: d }), ...paths[0].map((n) => fade(n, 0.2, { duration: d }))),
    { offset: 0.65, dur: 1.15 },
  );
  playCue(
    s,
    c,
    'circuit-reset',
    (d) => s.play(kept.to(1, { duration: d }), ...paths[0].map((n) => fade(n, 1, { duration: d }))),
    { dur: 0.8 },
  );
  playCue(
    s,
    c,
    'circuit-control',
    (d) =>
      s.play(
        formatting.to(0, { duration: d }),
        ...paths[2].map((n) => fade(n, 0.2, { duration: d })),
      ),
    { dur: 0.8 },
  );

  const realHead = txt(
    'In a real model, verify across:',
    0,
    215,
    30,
    COSMOS.muted,
    'sans',
    'center',
  );
  const realLine = txt(
    'held-out prompts  ·  matched controls  ·  edit strength  ·  redundant paths',
    0,
    280,
    28,
    ROLE.mark,
    'mono',
    'center',
  ).glow(6, ROLE.mark);
  const nullNote = txt(
    'A null edit can mean weak strength or a compensating path',
    0,
    365,
    30,
    COSMOS.ink,
    'sans',
    'center',
  );
  c.swap(
    'circuit-real',
    [termHead, ...termRows, ...rScale, rStack, scoreReadout],
    [realHead, realLine],
  );
  c.show('circuit-null', nullNote);

  // --- Beat 2: Cross-Layer Transcoder (CLT) glowing multi-layer fan ---
  const featurePos = layers.map((l) => [l.mlpPos[0] - 118, l.mlpPos[1] - 62]);
  const featureOrbs = featurePos.map((p) =>
    group(
      glowRing(p[0], p[1], 18, ROLE.other, { width: 3.5, glow: 10, fillOpacity: 0.25 }),
      glowDot(p[0], p[1], { radius: 6, color: COSMOS.ink, glow: 8 }),
    ),
  );
  const sumHubs = layers.map((l) =>
    group(
      glowRing(l.m.out[0], l.m.out[1], 22, ROLE.other, { width: 3, glow: 8, fillOpacity: 0.2 }),
      txt('+', l.m.out[0], l.m.out[1], 30, COSMOS.ink, 'mono', 'center'),
    ),
  );
  const cltReads = featurePos.map((p) =>
    arrow([p[0], streamY + 6], [p[0], p[1] - 20], { stroke: ROLE.other, width: 4, tip: 12 }).glow(
      7,
      ROLE.other,
    ),
  );
  const cltSumWrites = layers.map((l) =>
    arrow([l.m.out[0], l.m.out[1] - 24], [l.m.out[0], streamY + 6], {
      stroke: ROLE.other,
      width: 4,
      tip: 12,
    }).glow(7, ROLE.other),
  );
  const cltCrossArcs = layers.flatMap((_, from) =>
    layers.slice(from).map((targetLayer, offset) => {
      const p0 = [featurePos[from][0], featurePos[from][1] + 20];
      const p1 = [targetLayer.m.out[0], targetLayer.m.out[1] + 24];
      const lift = offset === 0 ? 55 : 105 + from * 28;
      return glowingTrail(arcPts(p0, p1, lift, 28), {
        color: ROLE.other,
        width: 3.4,
        glow: 8,
        opacity: 0.88,
      });
    }),
  );

  const cltHead = txt(
    'Cross-layer transcoder: features read one layer, write to many MLP outputs',
    0,
    215,
    30,
    ROLE.other,
    'sans',
    'center',
  ).glow(6, ROLE.other);
  const cltComb = txt(
    'Each MLP output combines writers from its own layer and earlier layers',
    0,
    290,
    28,
    COSMOS.ink,
    'sans',
    'center',
  );
  const cltStudies = txt(
    'Circuit studies:  induction  ·  indirect object  ·  greater-than',
    0,
    375,
    28,
    ROLE.mark,
    'mono',
    'center',
  );

  c.swap(
    'hook-and-circuit-b2',
    [...paths.flat(), realHead, realLine, nullNote],
    [cltHead, ...featureOrbs],
  );
  playCue(
    s,
    c,
    'clt-reads',
    (d) =>
      s.play(
        ...layers.flatMap((l) => [
          fade(l.mlp, 0, { duration: d }),
          fade(l.m.read, 0, { duration: d }),
          fade(l.m.write, 0, { duration: d }),
        ]),
      ),
    { dur: 0.5 },
  );
  c.show('clt-reads', cltReads);
  c.show('clt-writes', [...sumHubs, ...cltSumWrites, ...cltCrossArcs]);
  c.show('clt-combines', cltComb);
  playCue(
    s,
    c,
    'clt-combines',
    (d) => s.play(indicate(sumHubs[2], { color: ROLE.mark, scale: 1.25, duration: d })),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'clt-attention',
    (d) =>
      s.play(
        ...layers.map((l) => indicate(l.attn, { color: ROLE.mark, scale: 1.08, duration: d })),
      ),
    { dur: 0.7 },
  );
  c.show('clt-studies', cltStudies);

  // --- Beat 3: Local replacement model & direct attribution edge ---
  const localHead = txt(
    'Local replacement model for one prompt',
    0,
    210,
    34,
    ROLE.mark,
    'serif',
    'center',
  ).glow(6, ROLE.mark);
  const frozenTags = layers.flatMap((l) => [
    txt('patterns & norm fixed', l.attnPos[0], l.attnPos[1] - 54, 26, ROLE.other, 'mono', 'center'),
  ]);
  const liveAttnNote = txt(
    'Attention patterns & norm denominators frozen (value paths stay live)',
    0,
    210,
    28,
    ROLE.other,
    'sans',
    'center',
  );

  const errorHubs = layers.map((l) =>
    group(
      lumBar(l.m.out[0] + 74, l.m.out[1], 36, 36, {
        color: ROLE.residual,
        fillOpacity: 0.45,
        strokeWidth: 2.4,
        glow: 9,
        radius: 6,
      }),
      txt('e', l.m.out[0] + 74, l.m.out[1], 26, COSMOS.ink, 'mono', 'center'),
      arrow([l.m.out[0] + 54, l.m.out[1]], [l.m.out[0] + 24, l.m.out[1]], {
        stroke: ROLE.residual,
        width: 3.5,
        tip: 10,
      }),
    ),
  );
  const matchCheck = txt(
    '✓ logits match',
    logX,
    streamY - 62,
    26,
    ROLE.residual,
    'mono',
    'center',
  ).glow(7, ROLE.residual);

  const graphLegend = txt(
    'Nodes:  ● features   ·   tokens   ·   +e errors   ·   logits',
    0,
    290,
    28,
    COSMOS.ink,
    'mono',
    'center',
  );

  // Direct attribution edge L0 -> L2 bypassing stopped L1 MLP output
  const liftY = streamY - 18;
  const srcSum = layers[0].m.out;
  const dstFeat = featurePos[2];
  const directEdge = [
    arrow(featurePos[0], [srcSum[0] - 18, srcSum[1]], {
      stroke: ROLE.mark,
      width: 5.5,
      tip: 14,
    }).glow(10, ROLE.mark),
    glowingTrail(
      [
        [srcSum[0], srcSum[1] - 24],
        [srcSum[0], liftY],
        [dstFeat[0], liftY],
        [dstFeat[0], dstFeat[1] - 20],
      ],
      { color: ROLE.mark, width: 5.5, glow: 11 },
    ),
  ];
  const stopL1 = [
    line(
      [layers[1].m.out[0] - 26, layers[1].m.out[1] - 32],
      [layers[1].m.out[0] + 26, layers[1].m.out[1] - 14],
      {
        stroke: ROLE.wrong,
        width: 7,
      },
    ).glow(9, ROLE.wrong),
  ];

  const replNotes = [
    'Direct edge = source activation × slope (intervening MLP stopped)',
    'Isolates direct influence from source to target',
    'Attention pattern held fixed',
    'Pruned/inactive paths & error nodes can hide mechanisms',
    'Always test graph predictions by editing the original model',
  ].map((lineText) => txt(lineText, 0, 380, 30, ROLE.mark, 'sans', 'center'));

  c.swap('hook-and-circuit-b3', [cltHead, cltComb, cltStudies], localHead);
  playCue(
    s,
    c,
    'replacement-frozen',
    (d) =>
      s.play(
        ...layers.flatMap((l) =>
          [l.a.read, l.a.write].map((n) => recolor(n, ROLE.other, { duration: d })),
        ),
      ),
    { dur: 0.5 },
  );
  c.show('replacement-frozen', frozenTags);
  c.swap('replacement-frozen', localHead, liveAttnNote);
  c.show('repl-errors', errorHubs);
  c.show('repl-match', matchCheck);
  c.show('repl-graph', graphLegend);

  c.show('replacement-direct', [...stopL1, replNotes[0]]);
  c.on('replacement-direct', () => {
    s.play(fade(cltSumWrites[1], 0.14, { duration: 0.2 }));
    for (const seg of directEdge) s.play(draw(seg, { duration: 0.45 }));
  });
  c.swap('repl-not-total', replNotes[0], replNotes[1]);
  c.swap('repl-attention', replNotes[1], replNotes[2]);
  playCue(
    s,
    c,
    'repl-attention',
    (d) =>
      s.play(...frozenTags.map((n) => indicate(n, { color: ROLE.mark, scale: 1.06, duration: d }))),
    { dur: 0.7 },
  );
  c.swap('repl-hide', replNotes[2], replNotes[3]);
  playCue(
    s,
    c,
    'repl-hide',
    (d) =>
      s.play(...errorHubs.map((n) => indicate(n, { color: ROLE.mark, scale: 1.25, duration: d }))),
    { dur: 0.7 },
  );
  c.swap('repl-compare', replNotes[3], replNotes[4]);
}
