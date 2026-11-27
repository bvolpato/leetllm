// Scene 03: magnitude: "Stretch just the rotation arrow"
// Wide cinema vector field where green Rotation stretches 1x -> 4x -> 10x along its ray
// while a luminous dot-product ruler races past stationary pink B = 4, cosine stays locked flat,
// and the L2 endpoint chord grows to 9.22.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  QUERY,
  ROLE,
  cinemaAtmosphere,
  cosine,
  dotProd,
  glowDot,
  guardedDynamic,
  heroTitle,
  l2,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';
import { cinemaVectorPlane, guideVectors } from '../guide-plot.mjs';

export default function magnitude(s, c) {
  const scale = s.value(1);
  const vScaleBadge = s.value(1);
  const vAsk = s.value(0);
  const vGap = s.value(0);

  const vecA = () => GUIDES[0].vector.map((x) => x * scale.value);
  const vecB = GUIDES[1].vector;
  const refDot = dotProd(QUERY, vecB);

  const plane = cinemaVectorPlane({
    originX: -790,
    originY: 95,
    width: 1580,
    height: 360,
    extent: () => 10.6,
    yPadTop: 30,
    maxYFixed: 2.55,
  });

  const title = heroTitle(['Stretch just the', 'rotation arrow'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.A,
    eyebrow: 'MAGNITUDE SENSITIVITY',
  });

  // Lower luminous telemetry strip: Cosine (locked) | Raw Dot Ruler [0..10] | L2 Gap
  const telemetry = dynamic(() => {
    const curA = vecA();
    const curDot = dotProd(QUERY, curA);
    const curCos = cosine(QUERY, curA);
    const curL2 = l2(QUERY, curA);

    const railL = -335;
    const railR = 315;
    const railY = 278;
    const posX = (val) => railL + (val / 10) * (railR - railL);
    const axPos = posX(curDot);
    const bxPos = posX(refDot);

    const nodes = [
      // Left: Locked Cosine gauge
      txt('COSINE WITH A', -680, 198, 26, COSMOS.muted, 'mono'),
      txt(curCos.toFixed(3), -680, 266, 54, ROLE.A, 'mono').glow(9, ROLE.A),
      txt('direction unchanged', -680, 326, 26, COSMOS.dim, 'sans'),

      // Center: Raw dot-product beam ruler
      txt('RAW DOT PRODUCT RULER', (railL + railR) / 2, 198, 26, COSMOS.muted, 'mono'),
      line([railL, railY], [railR, railY], { stroke: '#3c4f7a', width: 4 }),
      // Filled green reach bar from 0 to curDot
      lumBar((railL + axPos) / 2, railY, Math.max(8, axPos - railL), 14, {
        color: ROLE.A,
        fillAlpha: 0.45,
        strokeWidth: 2,
        glow: 8,
        radius: 6,
      }),
      // Tick marks 0, B=4, 10
      ...[0, refDot, 10].flatMap((v) => {
        const tx = posX(v);
        const isB = v === refDot;
        return [
          line([tx, railY - 16], [tx, railY + 16], {
            stroke: isB ? ROLE.B : '#5b6f9c',
            width: isB ? 4 : 2.5,
          }),
          txt(isB ? `B = ${v}` : String(v), tx, railY + 46, 28, isB ? ROLE.B : COSMOS.dim, 'mono'),
        ];
      }),
      // Moving green A marker
      glowDot(axPos, railY, { radius: 10, color: ROLE.A, glow: 13 }),
      txt(`A = ${curDot.toFixed(1)}`, axPos, railY - 38, 30, ROLE.A, 'mono').glow(6, ROLE.A),
    ];

    // Right: L2 endpoint gap (revealed on `gap`)
    if (vGap.value > 0.02) {
      const gOp = vGap.value;
      const qPt = plane.p(QUERY);
      const aPt = plane.p(curA);
      nodes.push(
        line(qPt, aPt, { stroke: ROLE.gold, width: 4.5, dash: [10, 8] })
          .glow(8, ROLE.gold)
          .opacity(gOp),
        txt('GAP FROM q TO A', 665, 198, 26, ROLE.gold, 'mono').opacity(gOp),
        txt(curL2.toFixed(2), 665, 266, 54, ROLE.gold, 'mono').glow(9, ROLE.gold).opacity(gOp),
        txt('endpoint moved', 665, 326, 26, COSMOS.muted, 'sans').opacity(gOp),
      );
    }

    return group(...nodes);
  });

  // Footer: live scale readout vs withheld prediction question
  const scaleBadge = guardedDynamic(vScaleBadge, (a) =>
    txt(`A scale  ×${scale.value.toFixed(1)}`, 0, 415, 42, ROLE.A, 'mono')
      .glow(8, ROLE.A)
      .opacity(a),
  );
  const askBadge = guardedDynamic(vAsk, (a) =>
    txt('At what scale will green tie pink on raw dot?', 0, 415, 40, ROLE.gold, 'serif')
      .glow(8, ROLE.gold)
      .opacity(a),
  );

  s.add(
    cinemaAtmosphere(ROLE.A, ROLE.B),
    title,
    plane.grid,
    ...guideVectors(plane, {
      vectors: () => [vecA(), vecB],
      queryOffset: [-48, 44],
      aOffset: [38, -28],
      bOffset: [30, -34],
    }),
    telemetry,
    scaleBadge,
    askBadge,
  );

  playCue(s, c, 'ask', (d) => s.play(swapVis(vScaleBadge, vAsk, d)), { dur: 0.55 });
  playCue(s, c, 'four', (d) => s.play(vAsk.to(0, { duration: d })), { dur: 0.28 });
  playCue(
    s,
    c,
    'four',
    (d) =>
      s.play(
        vScaleBadge.to(1, { duration: Math.min(0.35, d) }),
        scale.to(refDot / dotProd(QUERY, GUIDES[0].vector), { duration: d }),
      ),
    { after: true, dur: 1.15 },
  );
  playCue(s, c, 'ten', (d) => s.play(scale.to(10, { duration: d })), { dur: 2.2 });
  playCue(s, c, 'gap', (d) => s.play(vGap.to(1, { duration: d })), { dur: 0.55 });
}
