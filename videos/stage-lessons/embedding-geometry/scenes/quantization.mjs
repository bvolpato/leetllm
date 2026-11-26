// Scene 08: quantization: "Two passage tips on a 0.2 grid"
// Magnified luminous 0.2-grid plane where C [0.99, 0.13] and D [0.96, 0.28] snap into one
// quantized node [1.0, 0.2] inside the glowing yellow rounding basin, leaving origin ghosts.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  QUANTIZATION_FIXTURE as F,
  ROLE,
  cinemaAtmosphere,
  cosine,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  quantize,
  rule,
  runPhase,
  txt,
  withAlpha,
} from '../parts.mjs';

export default function quantization(s, c) {
  const codes = F.candidates.map((v) => quantize(v, F.step));
  const names = ['C', 'D'];
  const colors = [ROLE.A, ROLE.B];

  const phase = s.value(0);
  const showCell = s.value(0);
  const askVis = s.value(0);
  const roundMix = s.value(0);
  const showTie = s.value(0);

  // Magnified coordinate frame on the left: x in [0.8, 1.2], y in [0.0, 0.4]
  const cx0 = -395;
  const cy0 = 40;
  const side = 560;
  const mapX = (vx) => cx0 + ((vx - 1.0) / 0.4) * side;
  const mapY = (vy) => cy0 - ((vy - 0.2) / 0.4) * side;
  const xy = (v) => [mapX(v[0]), mapY(v[1])];

  const title = heroTitle(['Two passage tips', 'on a 0.2 grid'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'QUANTIZATION COLLISION',
  });

  // Magnified luminous grid + rounding cell + animated C & D points
  const gridLayer = dynamic(() => {
    const t = roundMix.value;
    const cellOp = showCell.value;
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);

    const nodes = [txt('MAGNIFIED ENDPOINTS  ·  STEP = 0.2', cx0, -290, 26, COSMOS.muted, 'mono')];

    // Grid lines at 0.8, 1.0, 1.2 and 0.0, 0.2, 0.4
    [0, 1, 2].forEach((i) => {
      const gx = 0.8 + i * F.step;
      const gy = i * F.step;
      const isCenter = i === 1;
      nodes.push(
        line([mapX(gx), mapY(0)], [mapX(gx), mapY(0.4)], {
          stroke: isCenter ? '#4e679b' : '#26355a',
          width: isCenter ? 2.6 : 1.6,
        }),
        line([mapX(0.8), mapY(gy)], [mapX(1.2), mapY(gy)], {
          stroke: isCenter ? '#4e679b' : '#26355a',
          width: isCenter ? 2.6 : 1.6,
        }),
        txt(gx.toFixed(1), mapX(gx), mapY(0) + 42, 28, COSMOS.dim, 'mono'),
        txt(gy.toFixed(1), mapX(0.8) - 42, mapY(gy), 28, COSMOS.dim, 'mono', 'right'),
      );
    });

    // Center grid intersection dot [1.0, 0.2]
    const centerPt = xy(codes[0]);
    nodes.push(glowDot(centerPt[0], centerPt[1], { radius: 6, color: ROLE.code, glow: 8 }));

    // Glowing yellow rounding square around [1.0, 0.2]
    if (cellOp > 0.02) {
      nodes.push(
        rect(side / 2, side / 2, {
          fill: withAlpha(ROLE.gold, 0.09),
          stroke: ROLE.gold,
          width: 3.6,
          dash: [12, 8],
          radius: 6,
        })
          .at(centerPt[0], centerPt[1])
          .glow(10 * pulse, ROLE.gold)
          .opacity(cellOp),
      );
    }

    // Ghost origins & dashed snap trails when rounding starts
    if (t > 0.01) {
      F.candidates.forEach((v, i) => {
        const origPt = xy(v);
        const curPt = xy(v.map((coord, j) => coord + t * (codes[i][j] - coord)));
        nodes.push(
          glowRing(origPt[0], origPt[1], 9, colors[i], {
            width: 2.5,
            glow: 6,
            fillAlpha: 0.1,
            opacity: Math.min(1, t * 2),
          }),
          line(origPt, curPt, { stroke: colors[i], width: 3.2, dash: [7, 6] })
            .glow(6, colors[i])
            .opacity(Math.min(1, t * 1.8)),
        );
      });
    }

    // Moving C and D orbs with stationary non-colliding labels (never cross grid lines or snap trails)
    F.candidates.forEach((v, i) => {
      const cur = v.map((coord, j) => coord + t * (codes[i][j] - coord));
      const pt = xy(cur);
      const lx = i === 0 ? -345 : -485;
      const ly = i === 0 ? 124 - t * 32 : -44 + t * 18;
      nodes.push(
        glowDot(pt[0], pt[1], {
          radius: i === 0 ? 15 : 10,
          color: colors[i],
          glow: 11 * pulse,
        }),
        txt(names[i], lx, ly, 36, colors[i], 'mono').glow(6, colors[i]),
      );
    });

    return group(...nodes);
  });

  // Right telemetry column
  const rightStatic = group(
    rule(85, -385, 85, 395, COSMOS.rule, 1.8).opacity(0.6),
    txt('QUERY  q = [1, 0]', 145, -270, 32, ROLE.query, 'mono', 'left').glow(5, ROLE.query),
    // Passage C
    txt('Passage C · original', 145, -160, 34, ROLE.A, 'serif', 'left').glow(5, ROLE.A),
    txt(`[${F.candidates[0].join(', ')}]`, 145, -106, 34, COSMOS.ink, 'mono', 'left'),
    txt(
      `exact cos ≈ ${cosine(F.query, F.candidates[0]).toFixed(4)}`,
      145,
      -54,
      30,
      ROLE.A,
      'mono',
      'left',
    ),
    lumBar(145 + 260, -8, 520, 14, { color: ROLE.A, fillAlpha: 0.45, glow: 7 }),
    // Passage D
    txt('Passage D · original', 145, 76, 34, ROLE.B, 'serif', 'left').glow(5, ROLE.B),
    txt(`[${F.candidates[1].join(', ')}]`, 145, 130, 34, COSMOS.ink, 'mono', 'left'),
    txt(
      `exact cos ≈ ${cosine(F.query, F.candidates[1]).toFixed(4)}`,
      145,
      182,
      30,
      ROLE.B,
      'mono',
      'left',
    ),
    lumBar(145 + 235, 228, 470, 14, { color: ROLE.B, fillAlpha: 0.45, glow: 7 }),
  );

  const askLayer = guardedDynamic(askVis, (a) =>
    txt('Where will C and D land?', 145, 340, 40, ROLE.gold, 'serif', 'left')
      .glow(9, ROLE.gold)
      .opacity(a),
  );

  const tieLayer = guardedDynamic(showTie, (a) =>
    group(
      txt('Both store [1, 0.2]', 145, 315, 36, ROLE.gold, 'mono', 'left')
        .glow(8, ROLE.gold)
        .opacity(a),
      txt(
        `tied cos ≈ ${cosine(F.query, codes[0]).toFixed(4)}`,
        145,
        368,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
    ),
  );

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.A), title, gridLayer, rightStatic, askLayer, tieLayer);

  runPhase(s, c, phase, 8);

  playCue(s, c, 'cell', (d) => s.play(showCell.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'ask', (d) => s.play(askVis.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'round', (d) => s.play(askVis.to(0, { duration: d })), { dur: 0.28 });
  playCue(s, c, 'round', (d) => s.play(roundMix.to(1, { duration: d })), { dur: 1.35 });
  playCue(s, c, 'tie', (d) => s.play(showTie.to(1, { duration: d })), { after: true, dur: 0.45 });
}
