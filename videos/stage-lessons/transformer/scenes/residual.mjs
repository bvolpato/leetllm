// Scene 6: residual: "Add the update to the waiting state"
// View 1 (Beat 0): Complete attention read A shrinks by 0.35 into cyan update while X waits.
// View 2 (Beat 1): Equal-unit close-up translates the update onto waiting X -> contextual state Y.
// View 3 (Beat 2): Dual highway: Y waits on residual spine while normalized view enters FFN.
import { arrow } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  INPUT,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowRing,
  glowVector,
  lerpRow,
  playCue,
  slice14,
  swapVis,
  vecStr,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

export default function residual(s, c) {
  const title = heroTitle(['Residual add:', 'update the waiting state'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.valid,
  });

  const eq = glowTex('Y = X + 0.35\\,A', {
    x: 520,
    y: -385,
    size: 42,
    color: ROLE.valid,
  });

  const vProj = s.value(1);
  const vAdd = s.value(0);
  const vNorm = s.value(0);

  const shrinkProg = s.value(0); // 0 -> 1 scales factor 1 -> 0.35
  const addProg = s.value(0); // 0 -> 1 translates update onto X -> Y
  const normProg = s.value(0); // 0 -> 1 morphs Y -> ffnInput

  // VIEW 1: Output projection 0.35 * A
  const plane1 = vectorPlane({
    originX: -400,
    originY: 110,
    scaleX: 250,
    scaleY: 250,
    xMin: -0.9,
    xMax: 1.0,
    yMin: -0.6,
    yMax: 1.1,
    xTicks: [-0.5, 0, 0.5],
    yTicks: [-0.5, 0, 0.5, 1.0],
    tickDigits: 1,
    xLabel: 'c1',
    yLabel: 'c4',
  });

  const projLayer = guardedDynamic(vProj, (alpha) => {
    const sp = shrinkProg.value;
    const factor = 1 - 0.65 * sp;
    const curUp = MODEL.A[2].map((v) => v * factor);
    const origin = plane1.toScreen(0, 0);
    const fullTip = plane1.toScreen(...slice14(MODEL.A[2]));
    const curTip = plane1.toScreen(...slice14(curUp));
    const nodes = [
      plane1.node.opacity(alpha),
      glowVector(origin, fullTip, {
        color: COSMOS.dim,
        width: 3,
        glow: 3,
        opacity: 0.45 * alpha,
      }),
      glowVector(origin, curTip, { color: ROLE.attn, width: 6, glow: 12, opacity: alpha }),
      txt('A', fullTip[0] - 32, fullTip[1] + 36, 28, COSMOS.dim, 'mono', 'right').opacity(alpha),
      txt(`attention x ${fmt(factor, 2)}`, 420, -190, 34, ROLE.attn, 'mono', 'center')
        .glow(7, ROLE.attn)
        .opacity(alpha),
      vectorRow({
        cx: 420,
        cy: -90,
        values: curUp,
        cellW: 150,
        cellH: 74,
        gap: 14,
        color: ROLE.attn,
        digits: 3,
        opacity: alpha,
      }),
      txt('waiting original state X ("the")', 420, 95, 30, ROLE.stream, 'mono', 'center').opacity(
        alpha,
      ),
      vectorRow({
        cx: 420,
        cy: 195,
        values: INPUT[2],
        cellW: 150,
        cellH: 74,
        gap: 14,
        color: ROLE.stream,
        digits: 2,
        opacity: alpha,
      }),
      txt(
        'Scaled-identity output map preserves direction; general W_O can also mix axes',
        0,
        395,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  // VIEW 2: Equal-unit close-up translating update onto X -> Y
  const plane2 = vectorPlane({
    originX: -540,
    originY: 660,
    scaleX: 520,
    scaleY: 520,
    xMin: -0.2,
    xMax: 0.5,
    yMin: 0.75,
    yMax: 1.45,
    xTicks: [-0.2, 0, 0.2, 0.4],
    yTicks: [0.8, 1.0, 1.2, 1.4],
    tickDigits: 1,
    xLabel: 'c1',
    yLabel: 'c4',
  });

  const addLayer = guardedDynamic(vAdd, (alpha) => {
    const ap = addProg.value;
    const curRow = lerpRow(INPUT[2], MODEL.Y[2], ap);
    const xPt = plane2.toScreen(...slice14(INPUT[2]));
    const curPt = plane2.toScreen(...slice14(curRow));
    const nodes = [
      plane2.node.opacity(alpha),
      glowRing(xPt[0], xPt[1], 9, ROLE.stream, { width: 2.8, glow: 9, opacity: alpha }),
      txt('X', xPt[0], xPt[1] - 30, 26, ROLE.stream, 'mono', 'center').opacity(alpha),
    ];

    if (ap > 0.02) {
      nodes.push(
        glowVector(xPt, curPt, { color: ROLE.attn, width: 5.5, glow: 12, opacity: alpha }),
      );
      if (ap > 0.85) {
        nodes.push(
          glowRing(curPt[0], curPt[1], 14, ROLE.valid, { width: 3.5, glow: 12, opacity: alpha }),
          txt('Y', curPt[0] - 28, curPt[1] - 14, 32, ROLE.valid, 'mono', 'right')
            .glow(8, ROLE.valid)
            .opacity(alpha),
        );
      }
    }

    nodes.push(
      txt('equal-unit close-up  (c1 vs c4)', 430, -210, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt(`X = ${vecStr(INPUT[2], 3)}`, 430, -115, 28, ROLE.stream, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `+ 0.35 A = ${vecStr(MODEL.update[2], 3)}`,
        430,
        -45,
        28,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        ap > 0.9 ? 'contextual state Y (complete)' : 'adding attention update...',
        430,
        85,
        30,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(ap > 0.9 ? 7 : 0, ROLE.valid)
        .opacity(alpha),
      vectorRow({
        cx: 430,
        cy: 195,
        values: curRow,
        cellW: 150,
        cellH: 76,
        gap: 14,
        color: ROLE.valid,
        digits: 3,
        opacity: alpha,
      }),
      txt(
        'Original X stays visible so every coordinate shift is clear',
        430,
        320,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Contextual state Y waits while normalized view enters FFN
  const normLayer = guardedDynamic(vNorm, (alpha) => {
    const np = normProg.value;
    const ffnRow = lerpRow(MODEL.Y[2], MODEL.ffnInput[2], np);
    return [
      txt(
        'contextual state Y waits for FFN residual add',
        0,
        -215,
        32,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
      vectorRow({
        cx: 45,
        cy: -110,
        values: MODEL.Y[2],
        cellW: 175,
        cellH: 80,
        gap: 18,
        color: ROLE.stream,
        digits: 3,
        label: 'residual Y',
        opacity: alpha,
      }),
      arrow([45, -45], [45, 78], { stroke: ROLE.query, width: 4, tip: 15 })
        .glow(8, ROLE.query)
        .opacity(alpha),
      txt('LayerNorm2', 195, 16, 28, ROLE.query, 'mono', 'left').opacity(alpha),
      txt('normalized view enters feed-forward sublayer', 0, 130, 32, ROLE.query, 'mono', 'center')
        .glow(6, ROLE.query)
        .opacity(alpha),
      vectorRow({
        cx: 45,
        cy: 235,
        values: ffnRow,
        cellW: 175,
        cellH: 80,
        gap: 18,
        color: ROLE.query,
        digits: 3,
        label: 'FFN input',
        opacity: alpha,
      }),
      txt(
        'Same token "the"  ·  same position 2  ·  width 4 preserved',
        0,
        385,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.stream), title, eq, projLayer, addLayer, normLayer);

  playCue(s, c, 'output-project', (d) => s.play(shrinkProg.to(1, { duration: d })), { dur: 1.1 });

  playCue(s, c, 'residual-add', (d) => s.play(swapVis(vProj, vAdd, Math.min(0.65, d * 0.45))), {
    dur: 0.7,
    offset: -0.75,
  });
  playCue(s, c, 'residual-add', (d) => s.play(addProg.to(1, { duration: d })), { dur: 1.2 });

  playCue(
    s,
    c,
    'next-normalization',
    (d) => s.play(swapVis(vAdd, vNorm, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'next-normalization', (d) => s.play(normProg.to(1, { duration: d })), { dur: 1.0 });
}
