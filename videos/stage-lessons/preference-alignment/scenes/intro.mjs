// Scene 01: Which directions would you keep? (Spatial route map + withheld vote reveal)
import {
  COSMOS,
  ROUTE_FIXTURE,
  aura,
  circle,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const walkA = s.value(0);
  const showCafe = s.value(0);
  const turnA = s.value(0);
  const walkB = s.value(0);
  const revealVote = s.value(0);

  const bgAura = aura(390, 10, 560, '#123e3628', '#3c1b2a18');
  const title = heroTitle(['Which Directions', 'Would You Keep?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'PREFERENCE ALIGNMENT · COMPARISONS CREATE TRAINING LABELS',
  });

  // Map coordinates in right half: Entrance at (340, 215), Cafe at (120, 215), Station at (120, -145)
  // Park at (690, 215), River at (690, -145), North bend at (340, -145)
  const ptsA = [
    [340, 215],
    [120, 215],
    [120, -145],
  ];
  const ptsB = [
    [340, 215],
    [690, 215],
    [690, -145],
    [340, -145],
    [340, 215],
  ];

  function tracePolyline(pts, frac) {
    const segs = pts.length - 1;
    const clamped = Math.max(0, Math.min(1, frac));
    const scaled = clamped * segs;
    const idx = Math.min(segs - 1, Math.floor(scaled));
    const local = scaled - idx;
    const out = pts.slice(0, idx + 1);
    const nx = prefLerp(pts[idx][0], pts[idx + 1][0], local);
    const ny = prefLerp(pts[idx][1], pts[idx + 1][1], local);
    out.push([nx, ny]);
    return { trail: out, head: [nx, ny] };
  }

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const wa = walkA.value;
    const cf = showCafe.value;
    const ta = turnA.value;
    const wb = walkB.value;
    const vt = revealVote.value;

    const fracA = wa * 0.5 + ta * 0.5;
    const curA = tracePolyline(ptsA, Math.max(0.08, fracA));
    const curB = tracePolyline(ptsB, Math.max(0.02, wb));

    const nodes = [
      // Prompt floating header
      txt(`PROMPT:  "${ROUTE_FIXTURE.request}"`, -855, -188, 28, COSMOS.cyan, 'mono', 'left'),

      // Reply A compact lane
      glassCell(-465, -72, 770, 148, vt > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: vt > 0.5 ? '#0e2824' : '#101d34',
        glow: vt > 0.5 ? 11 * pulse : 5,
      }),
      txt('REPLY A', -815, -110, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Turn left at entrance, then right at cafe -> Station',
        -815,
        -56,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        vt > 0.5 ? 'CHOSEN  ·  REACHES THE TRAIN' : 'ENDPOINT: TRAIN STATION',
        -815,
        -16,
        26,
        vt > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),

      // Reply B compact lane
      glassCell(-465, 118, 770, 148, wb > 0.2 ? COSMOS.rose : COSMOS.dim, {
        fill: wb > 0.2 ? '#29101a' : '#111626',
        glow: wb > 0.2 ? 6 : 3,
        opacity: Math.max(0.75, wb),
      }),
      txt('REPLY B', -815, 80, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        'Past the park and river, back to the entrance',
        -815,
        134,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        vt > 0.5 ? 'REJECTED  ·  LOOPS BACK TO START' : 'ENDPOINT: BACK AT ENTRANCE',
        -815,
        174,
        26,
        vt > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),

      // Withheld preference vote slot
      glassCell(-465, 310, 770, 112, vt > 0.5 ? COSMOS.gold : COSMOS.amber, {
        fill: vt > 0.5 ? '#231d0e' : '#1a1610',
        dash: vt > 0.5 ? undefined : [10, 6],
        glow: 9 * pulse,
      }),
      txt(
        vt > 0.5
          ? 'PREFERENCE LABEL:  A > B  (KEEP REPLY A)'
          : 'WHICH REPLY WOULD YOU KEEP?  [ ? ]',
        -465,
        312,
        30,
        vt > 0.5 ? COSMOS.gold : COSMOS.amber,
        'mono',
      ).glow(6, COSMOS.gold),

      // Right spatial street map frame
      txt('SPATIAL ROUTE MAP (BOTH ENDPOINTS IN VIEW)', 415, -365, 26, COSMOS.gold, 'mono'),
      line([70, 215], [750, 215], { stroke: COSMOS.rule, width: 2.5 }),
      line([70, -145], [750, -145], { stroke: COSMOS.rule, width: 2.5 }),
      line([120, -200], [120, 260], { stroke: COSMOS.rule, width: 2.5 }),
      line([340, -200], [340, 260], { stroke: COSMOS.rule, width: 2.5 }),
      line([690, -200], [690, 260], { stroke: COSMOS.rule, width: 2.5 }),

      // Faint preview of both tracks from t=0 so right half stays rich and well framed
      glowingTrail(ptsA, {
        color: COSMOS.emerald,
        width: 2.4,
        opacity: 0.34,
        glow: 4,
        core: false,
      }),
      glowingTrail(ptsB, { color: COSMOS.rose, width: 2.4, opacity: 0.28, glow: 4, core: false }),

      // Active traced Route A
      glowingTrail(curA.trail, { color: COSMOS.emerald, width: 5.2, opacity: 0.96, glow: 11 }),
      glowDot(curA.head[0], curA.head[1], { radius: 8.5, color: COSMOS.emerald, glow: 14 }),
    ];

    // Active traced Route B
    if (wb > 0.04) {
      nodes.push(
        glowingTrail(curB.trail, { color: COSMOS.rose, width: 4.8, opacity: 0.92, glow: 10 }),
        glowDot(curB.head[0], curB.head[1], { radius: 8, color: COSMOS.rose, glow: 13 }),
      );
    }

    // Landmark beacons with generous clearance from road lines
    nodes.push(
      circle(11, { fill: COSMOS.gold, stroke: COSMOS.ink, width: 2 })
        .at(340, 215)
        .glow(8, COSMOS.gold),
      txt('ENTRANCE', 340, 282, 26, COSMOS.gold, 'mono'),

      circle(10, { fill: COSMOS.cyan, stroke: COSMOS.ink, width: 2 })
        .at(120, 215)
        .opacity(Math.max(0.65, cf)),
      txt('CAFE', 120, 282, 26, COSMOS.cyan, 'mono'),

      circle(13, { fill: COSMOS.emerald, stroke: COSMOS.ink, width: 2 })
        .at(120, -145)
        .glow(vt > 0.5 ? 14 : 7, COSMOS.emerald),
      txt('TRAIN STATION', 155, -238, 28, COSMOS.emerald, 'mono'),

      circle(9, { fill: COSMOS.rose, stroke: COSMOS.ink, width: 2 }).at(690, 215),
      txt('PARK', 690, 282, 26, COSMOS.rose, 'mono'),

      circle(9, { fill: COSMOS.rose, stroke: COSMOS.ink, width: 2 }).at(690, -145),
      txt('RIVER', 690, -238, 26, COSMOS.rose, 'mono'),

      txt(
        vt > 0.5
          ? 'Vote records A > B for this exact station request'
          : 'Compare complete trajectories from the same entrance',
        415,
        390,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('start-walk', () => s.play(walkA.to(1, { duration: remainDuration(c, 'start-walk', 1.1) })));
  c.on('introduce-a', () =>
    s.play(showCafe.to(1, { duration: remainDuration(c, 'introduce-a', 0.6) })),
  );
  c.on('route-a', () => s.play(turnA.to(1, { duration: remainDuration(c, 'route-a', 1.1) })));
  c.on('route-b', () => s.play(walkB.to(1, { duration: remainDuration(c, 'route-b', 2.4) })));
  c.after('route-vote', () =>
    s.play(revealVote.to(1, { duration: remainAfterDuration(c, 'route-vote', 0.5) })),
  );
}
