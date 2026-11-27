// Scene 1: Which passage is closer, B or C? (Opening curiosity gap with orbiting 3D Voronoi cell + 2D distance map)
import {
  COSMOS,
  QUERY,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  makeIvfVoronoi3D,
  pointById,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showReceipt = s.value(0);
  const showQuery = s.value(0);
  const showLineC = s.value(0);
  const showLineB = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Passage Is', 'Closer, B or C?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'VECTOR SEARCH · EMBEDDING GEOMETRY & APPROXIMATE NEIGHBORS',
  });

  const voronoi3d = makeIvfVoronoi3D(555, -20, phase);

  const pA = pointById('A');
  const pB = pointById('B');
  const pC = pointById('C');
  const mapX = (vx) => -785 + (vx - 3.4) * 390;
  const mapY = (vy) => 60 - (vy - 5.0) * 390;

  const live = guardedDynamic(s.value(1), () => {
    const sr = showReceipt.value;
    const sq = showQuery.value;
    const lc = showLineC.value;
    const lb = showLineB.value;

    const qx = mapX(QUERY.x);
    const qy = mapY(QUERY.y);
    const ax = mapX(pA.x);
    const ay = mapY(pA.y);
    const bx = mapX(pB.x);
    const by = mapY(pB.y);
    const cx = mapX(pC.x);
    const cy = mapY(pC.y);

    const nodes = [
      // Left: Close-up 2D embedding map with equal scales (strictly withholding numeric distances until Scene 2!)
      glassCell(-395, 22, 920, 446, COSMOS.cyan, { fill: '#0e182e', glow: 5 }),
      txt('EMBEDDING NEIGHBORHOOD (EQUAL AXES)', -825, -166, 26, COSMOS.cyan, 'mono', 'left'),

      // Query to C ray
      ...(lc > 0.05
        ? [
            line([qx, qy], [qx + (cx - qx) * lc, qy + (cy - qy) * lc], {
              stroke: COSMOS.rose,
              width: 4.5,
            }).glow(9, COSMOS.rose),
          ]
        : []),
      // Query to B ray
      ...(lb > 0.05
        ? [
            line([qx, qy], [qx + (bx - qx) * lb, qy + (by - qy) * lb], {
              stroke: COSMOS.emerald,
              width: 4.5,
            }).glow(9, COSMOS.emerald),
          ]
        : []),

      // Passage dots A, B, C and Query Q
      glowDot(cx, cy, { radius: 11, color: COSMOS.rose }),
      txt('C (3.7, 4.8)', cx, cy - 44, 26, COSMOS.rose, 'mono'),

      glowDot(ax, ay, { radius: 11, color: COSMOS.cyan }),
      txt('A (4.6, 5.2)', ax, ay - 36, 26, COSMOS.cyan, 'mono'),

      glowDot(bx, by, { radius: 11, color: COSMOS.emerald }),
      txt('B (5.1, 5.0)', bx + 12, by - 36, 26, COSMOS.emerald, 'mono'),

      glowDot(qx, qy, { radius: sq > 0.3 ? 13 : 11, color: COSMOS.gold }),
      txt('Query (4.8, 5.0)', qx, qy + 42, 26, COSMOS.gold, 'mono'),

      // Bottom-left returned receipt strip
      txt(
        'RETURNED TOP-2: [ #1 A ]  [ #2 C ]  |  Shorter: B or C?',
        -825,
        204,
        26,
        sr > 0.3 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),

      // Right 3D caption
      txt('3D PARTITIONED VECTOR SPACE', 555, -252, 26, COSMOS.cyan, 'mono'),
      txt('Why did search skip a nearer dot?', 555, 258, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Compare visual distance from the query diamond to C versus B before computing exact scores',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, voronoi3d.view, live);
  runPhase(s, c, phase, 14);
  voronoi3d.orbit(s, c);

  c.on('returned-pair', () => s.play(showReceipt.to(1, { duration: 0.4 })));
  c.on('rollback-request', () => s.play(showQuery.to(1, { duration: 0.4 })));
  c.on('compare-c', () => s.play(showLineC.to(1, { duration: 0.45 })));
  c.on('compare-b', () =>
    s.play(showLineB.to(1, { duration: remainDuration(c, 'compare-b', 0.45) })),
  );
}
