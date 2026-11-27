// Scene 00: opening: "Two guides for one query"
// Luminous 2D vector field + orbiting 3D unit-sphere constellation + withheld angle reveal.
import { circle, dynamic, group, line, linear, polygon, polyline } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  QUERY,
  ROLE,
  buildUnitSphere3d,
  cinemaAtmosphere,
  glowDot,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';
import { glowArc } from '../parts.mjs';

export default function opening(s, c) {
  const origin = [-740, 260];
  const unit = 240;
  const tip = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
  const qTip = tip(QUERY);
  const aTip = tip(GUIDES[0].vector);
  const bTip = tip(GUIDES[1].vector);

  const angleA = Math.atan2(GUIDES[0].vector[1], GUIDES[0].vector[0]);
  const angleB = Math.atan2(GUIDES[1].vector[1], GUIDES[1].vector[0]);
  const degA = Math.round((angleA * 180) / Math.PI);
  const degB = Math.round((angleB * 180) / Math.PI);

  const ink = s.value(0.28);
  const askVis = s.value(0);
  const sweepA = s.value(0);
  const showDegA = s.value(0);
  const sweepB = s.value(0);
  const showDegB = s.value(0);
  const showCoords = s.value(0);
  const showReach = s.value(0);

  // Orbiting 3D unit-sphere preview in bottom-right corner
  const { view: sphere3d } = buildUnitSphere3d({
    x: 610,
    y: 195,
    radius: 1.55,
    unit: 90,
    distance: 13.6,
    theta: -0.75,
    phi: 1.05,
    vectors: [
      { dir: [1, 0, 0.12], color: ROLE.query, width: 4 },
      { dir: [1, 0.2, 0.12], color: ROLE.A, width: 4 },
      { dir: [4, 2, 0.12], color: ROLE.B, width: 4 },
    ],
    geodesics: [
      { a: [1, 0, 0.12], b: [1, 0.2, 0.12], color: ROLE.A, width: 3 },
      { a: [1, 0, 0.12], b: [4, 2, 0.12], color: ROLE.B, width: 2.8 },
    ],
  });

  // Floating glowing search query pill (top-left, no slide banner)
  const searchHeader = group(
    lumBar(-430, -395, 840, 92, {
      color: ROLE.query,
      fillAlpha: 0.14,
      strokeWidth: 2.6,
      glow: 9,
      radius: 46,
    }),
    circle(16, { fill: null, stroke: ROLE.query, width: 4.5 }).at(-800, -400).glow(6, ROLE.query),
    line([-788, -388], [-775, -375], { stroke: ROLE.query, width: 5 }).glow(6, ROLE.query),
    txt('How do I rotate an API key?', -748, -395, 42, COSMOS.ink, 'serif', 'left'),
  );

  const sphereCaption = group(
    txt('EMBEDDING DIRECTIONS', 610, -10, 26, ROLE.code, 'mono'),
    txt('Unit hypersphere view', 610, 398, 26, COSMOS.muted, 'sans'),
  );

  // Sleek vector document glyph
  const docGlyph = (cx, cy, color) =>
    group(
      polygon(
        [
          [-20, -26],
          [6, -26],
          [20, -12],
          [20, 26],
          [-20, 26],
        ],
        { fill: '#0e172c', stroke: color, width: 2.8 },
      ).glow(5, color),
      polyline(
        [
          [6, -25],
          [6, -12],
          [19, -12],
        ],
        { stroke: color, width: 2.4 },
      ),
      line([-11, -3], [11, -3], { stroke: color, width: 2 }),
      line([-11, 8], [11, 8], { stroke: color, width: 2 }),
      line([-11, 18], [3, 18], { stroke: color, width: 2 }),
    ).at(cx, cy);

  // Main live 2D vector field
  const vectorStage = dynamic(() => {
    const k = ink.value;
    const nodes = [
      // Faint guide trajectories & subtle horizontal baseline
      line(origin, aTip, { stroke: '#233458', width: 2 }).opacity(0.55),
      line(origin, bTip, { stroke: '#233458', width: 2 }).opacity(0.55),
      line(origin, tip([4.25, 0]), { stroke: '#26395e', width: 2, dash: [6, 8] }).opacity(
        0.35 + 0.45 * showReach.value,
      ),
    ];

    // Reach projection drops (beat 2)
    if (showReach.value > 0.02) {
      const rOp = showReach.value;
      GUIDES.forEach((g) => {
        const gt = tip(g.vector);
        const foot = tip([g.vector[0], 0]);
        nodes.push(
          line(gt, foot, { stroke: g.color, width: 3.5, dash: [9, 7] })
            .glow(6, g.color)
            .opacity(rOp),
          glowDot(foot[0], foot[1], { radius: 8, color: g.color, glow: 10, opacity: rOp }),
        );
      });
    }

    // Angle wedges (strictly withheld until winner / wider)
    if (sweepA.value > 0.02) {
      nodes.push(
        glowArc(origin[0], origin[1], 195, -angleA * sweepA.value, 0, {
          color: ROLE.A,
          width: 7,
          glow: 11,
        }),
      );
    }
    if (sweepB.value > 0.02) {
      nodes.push(
        glowArc(origin[0], origin[1], 145, -angleB * sweepB.value, 0, {
          color: ROLE.B,
          width: 6,
          glow: 10,
        }),
      );
    }

    // Drawn luminous vectors
    nodes.push(
      glowVector(origin, tip(GUIDES[1].vector.map((x) => x * k)), {
        color: ROLE.B,
        width: 7.5,
        tipSize: 22,
        glow: 11,
        dotRadius: 6,
      }),
      glowVector(origin, tip(GUIDES[0].vector.map((x) => x * k)), {
        color: ROLE.A,
        width: 7.5,
        tipSize: 22,
        glow: 11,
        dotRadius: 6,
      }),
      glowVector(origin, tip(QUERY.map((x) => x * k)), {
        color: ROLE.query,
        width: 8,
        tipSize: 22,
        glow: 12,
        dotRadius: 6,
      }),
      glowDot(origin[0], origin[1], { radius: 7, color: COSMOS.ink, glow: 8 }),
    );

    // Floating document badges & titles (well clear of arrows)
    nodes.push(
      docGlyph(aTip[0] + 64, aTip[1] - 4, ROLE.A),
      txt('Rotation guide', aTip[0] + 104, aTip[1] - 4, 38, ROLE.A, 'serif', 'left').glow(
        5,
        ROLE.A,
      ),
      docGlyph(bTip[0] + 58, bTip[1] - 4, ROLE.B),
      txt('Audit guide', bTip[0] + 98, bTip[1] - 4, 38, ROLE.B, 'serif', 'left').glow(5, ROLE.B),
      txt('Query', qTip[0] - 85, qTip[1] + 56, 36, ROLE.query, 'serif', 'center').glow(
        5,
        ROLE.query,
      ),
    );

    // Angle labels (strict zero-overlap crossfade before coordinates appear)
    const angleFade = Math.max(0, 1 - showCoords.value * 2.5);
    const coordFade = Math.max(0, (showCoords.value - 0.55) / 0.45);
    if (showDegA.value > 0.02 && angleFade > 0.02) {
      nodes.push(
        txt(`≈ ${degA}°`, aTip[0] + 104, aTip[1] - 58, 36, ROLE.A, 'mono', 'left')
          .glow(7, ROLE.A)
          .opacity(showDegA.value * angleFade),
      );
    }
    if (showDegB.value > 0.02 && angleFade > 0.02) {
      nodes.push(
        txt(`≈ ${degB}°`, bTip[0] + 98, bTip[1] - 58, 36, ROLE.B, 'mono', 'left')
          .glow(7, ROLE.B)
          .opacity(showDegB.value * angleFade),
      );
    }

    // Coordinate readouts (on `coordinates` cue)
    if (coordFade > 0.02) {
      nodes.push(
        txt(
          `[${QUERY.join(', ')}]`,
          qTip[0] + 38,
          qTip[1] + 56,
          34,
          ROLE.query,
          'mono',
          'left',
        ).opacity(coordFade),
        txt(
          `[${GUIDES[0].vector.join(', ')}]`,
          aTip[0] + 104,
          aTip[1] - 58,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(coordFade),
        txt(
          `[${GUIDES[1].vector.join(', ')}]`,
          bTip[0] + 98,
          bTip[1] - 58,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(coordFade),
      );
    }

    return group(...nodes);
  });

  // Floating prediction question (gold, no card chrome)
  const askLayer = guardedDynamic(askVis, (a) =>
    txt('Which guide makes the smaller angle?', -845, -275, 42, ROLE.gold, 'serif', 'left')
      .glow(8, ROLE.gold)
      .opacity(a),
  );

  s.add(
    cinemaAtmosphere(ROLE.query, ROLE.A),
    searchHeader,
    sphere3d,
    sphereCaption,
    vectorStage,
    askLayer,
  );

  // Continuous ambient motion + 3D orbit
  c.at(0.05, () => s.play(ink.to(1, { duration: 1.15, ease: linear })));
  orbitScene(s, c, sphere3d, { theta: 0.45, phi: 0.94 });

  // Cues (strict prediction withholding)
  playCue(s, c, 'ask', (d) => s.play(askVis.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'winner', (d) => s.play(askVis.to(0, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'winner', (d) => s.play(sweepA.to(1, { duration: d })), { after: true, dur: 0.65 });
  playCue(s, c, 'small-angle', (d) => s.play(showDegA.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'wider', (d) => s.play(sweepB.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'large-angle', (d) => s.play(showDegB.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'coordinates', (d) => s.play(showCoords.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'reach', (d) => s.play(showReach.to(1, { duration: d })), { dur: 0.65 });
}
