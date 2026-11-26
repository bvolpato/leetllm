// Scene 01: Which reply gets your vote? Live preference comparison with P-7 rule & length foreshadow.
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  rect,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function introduction(s, c) {
  const phase = s.value(0);
  const showA = s.value(0.45);
  const showB = s.value(0.45);
  const showRule = s.value(0.35);
  const voteA = s.value(0);

  const bgAura = aura(160, 0, 580, '#ffd16620', '#5ce1e614');
  const title = heroTitle(['Which Reply', 'Gets Your Vote?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.gold,
    eyebrow: 'REWARD MODELING · PREFERENCE SIGNAL',
    subtitle: 'Prompt: "Grant admin access for the migration"',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const aVis = showA.value;
    const bVis = showB.value;
    const rVis = showRule.value;
    const voted = voteA.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // Central balance fulcrum at (255, 195): neutral until voteA reveals A > B
    const tilt = voted * 0.16;
    const beamLen = 325;
    const cx = 255;
    const cy = 195;
    const ax = cx - Math.cos(tilt) * beamLen;
    const ay = cy - Math.sin(tilt) * beamLen - 160;
    const bx = cx + Math.cos(tilt) * beamLen;
    const by = cy + Math.sin(tilt) * beamLen - 160;

    // Color stays neutral cyan/blue before vote reveal so we strictly withhold the answer
    const colA = voted > 0.5 ? COSMOS.emerald : COSMOS.cyan;
    const colB = voted > 0.5 ? COSMOS.rose : COSMOS.blue;

    const nodes = [
      // Left-side Approval Rule P-7 optical lock ring
      radialDial(-590, 115, 138, rVis, {
        color: COSMOS.gold,
        width: 10,
        glow: 10 * pulse,
        opacity: Math.max(0.5, rVis),
      }),
      txt('RULE P-7', -590, 74, 30, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.5, rVis)),
      txt('Approved ticket', -590, 118, 26, COSMOS.ink, 'sans').opacity(Math.max(0.5, rVis)),
      txt('required first', -590, 152, 26, COSMOS.muted, 'sans').opacity(Math.max(0.5, rVis)),
      // Length meter foreshadow along bottom-left
      txt('WORD COUNT SIGNAL', -855, 315, 26, COSMOS.amber, 'mono', 'left'),
      line([-855, 362], [-345, 362], { stroke: '#2c3a5e', width: 6 }),
      rect(340, 14, { fill: COSMOS.amber, stroke: null, radius: 6 })
        .at(-685, 362)
        .glow(6, COSMOS.amber)
        .opacity(0.85),
      txt('A: longer', -855, 405, 26, COSMOS.amber, 'mono', 'left'),
      rect(185, 14, { fill: COSMOS.dim, stroke: null, radius: 6 }).at(-455, 362).opacity(0.85),
      txt('B: shorter', -545, 405, 26, COSMOS.muted, 'mono', 'left'),

      // Balance beam connecting candidate nodes A and B
      glowingTrail(
        [
          [ax, ay + 148],
          [cx, cy + 45],
          [bx, by + 148],
        ],
        {
          gradientColors: [colA, COSMOS.gold, colB],
          width: 4.4,
          glow: 10,
        },
      ),
      circle(16, { fill: '#151c33', stroke: COSMOS.gold, width: 3 })
        .at(cx, cy + 45)
        .glow(8, COSMOS.gold),

      // Candidate A orb + floating label (generous radius so strokes never touch text)
      circle(144, {
        fill: '#0e1b2c',
        stroke: colA,
        width: voted > 0.5 ? 4 : 2.6,
      })
        .at(ax, ay)
        .glow(voted > 0.5 ? 12 : 7, colA)
        .opacity(aVis),
      txt('REPLY A', ax, ay - 52, 32, colA, 'mono')
        .glow(6, colA)
        .opacity(aVis),
      txt('Asks for review', ax, ay + 2, 26, COSMOS.ink, 'sans').opacity(aVis),
      txt('ticket & waits', ax, ay + 38, 26, COSMOS.muted, 'sans').opacity(aVis),

      // Candidate B orb + floating label
      circle(144, {
        fill: '#0e172a',
        stroke: colB,
        width: 2.6,
      })
        .at(bx, by)
        .glow(7, colB)
        .opacity(bVis),
      txt('REPLY B', bx, by - 52, 32, colB, 'mono')
        .glow(6, colB)
        .opacity(bVis),
      txt('Admin access is', bx, by + 2, 26, COSMOS.ink, 'sans').opacity(bVis),
      txt('already enabled', bx, by + 38, 26, COSMOS.muted, 'sans').opacity(bVis),

      // Luminous link from Rule P-7 to balance fulcrum
      glowingArc([-448, 115], [cx - 24, cy + 45], 60, {
        color: COSMOS.gold,
        width: 2.8,
        opacity: 0.72 * rVis,
      }),
      glowDot(cx, cy + 45, { radius: 6, color: COSMOS.gold, opacity: pulse }),
    ];

    // Prediction state vs Revealed vote
    if (voted < 0.05) {
      nodes.push(
        tokenCell(cx, 330, 440, 88, COSMOS.gold, { fill: '#14182a', dash: [8, 6], glow: 6 }),
        txt('VOTE:  A   or   B  ?', cx, 330, 34, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      );
    } else {
      nodes.push(
        tokenCell(cx, 330, 520, 96, COSMOS.emerald, { fill: '#0d2224', glow: 10, opacity: voted }),
        txt('RECORDED:   A  ≻  B', cx, 314, 34, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(voted),
        txt('Preferred by Rule P-7 · also longer', cx, 358, 26, COSMOS.amber, 'sans').opacity(
          voted,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('opening-answers', () => s.play(showA.to(1, { duration: 0.45 })));
  c.on('opening-grant', () => s.play(showB.to(1, { duration: 0.45 })));
  c.on('opening-rule', () => s.play(showRule.to(1, { duration: 0.5 })));
  c.after('opening-choice', () =>
    s.play(voteA.to(1, { duration: remainDuration(c, 'opening-choice', 0.65) })),
  );
}
