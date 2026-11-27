// Scene 13: Capacity and strength are separate choices: Fixed line stretched by α/r -> rank rises -> hold scale constant.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function strength(s, c) {
  const stretchAlpha = s.value(0);
  const rankRise = s.value(0);
  const holdScale = s.value(0);
  const showNormNote = s.value(0);

  const bgAura = aura(260, 10, 580, '#ffd16620', '#5ce1e61a');
  const title = heroTitle(['Capacity and Strength', 'Are Separate Choices'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'RANK r VS EXPLICIT MULTIPLIER α / r',
  });

  const eq = glowTex(String.raw`\Delta W = \frac{\alpha}{r} B A`, {
    x: 420,
    y: -365,
    size: 46,
    color: COSMOS.gold,
  });

  const ox = 165;
  const oy = 250;
  const unit = 128;
  const pt = (vx, vy) => [ox + vx * unit, oy - vy * unit];

  const live = guardedDynamic(1, () => {
    const sa = stretchAlpha.value;
    const rr = rankRise.value;
    const hs = holdScale.value;
    const nn = showNormNote.value;

    // Direction 1 = [1.0, 0.55], Direction 2 = [-0.45, 1.05]
    const curRank = rr > 0.4 ? 16 : 8;
    const curAlpha = hs > 0.4 ? 32 : sa > 0.3 ? 16 : 8;
    const mult = curAlpha / curRank;
    const lenScale = 1.0 + sa * 1.15 - rr * 0.65 + hs * 0.65;

    const v1 = [1.4 * lenScale, 0.85 * lenScale];
    const v2 = [-0.55 * rr, 1.35 * rr];
    const sumV = [v1[0] + v2[0], v1[1] + v2[1]];

    const nodes = [
      // Left controls readout
      glassCell(-555, -148, 595, 128, COSMOS.cyan, { fill: '#101d35', glow: rr > 0.2 ? 10 : 5 }),
      txt('CAPACITY  (SUBSPACE RANK r)', -825, -182, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        rr > 0.4 ? 'r = 16  (adds new direction)' : 'r = 8  (fixed line)',
        -825,
        -124,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-555, 14, 595, 128, COSMOS.gold, {
        fill: '#231d10',
        glow: sa > 0.2 || hs > 0.2 ? 10 : 5,
      }),
      txt('EXPLICIT STRENGTH  (α / r)', -825, -20, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        `α=${curAlpha}, r=${curRank} -> α/r = ${mult.toFixed(2)}`,
        -825,
        38,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ).glow(7, COSMOS.gold),

      glassCell(-555, 184, 595, 144, hs > 0.3 ? COSMOS.emerald : '#334268', {
        fill: hs > 0.3 ? '#0e2528' : '#11182c',
        glow: hs > 0.3 ? 9 : 3,
      }),
      txt('CLEAN RANK SWEEP RULE', -825, 144, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        hs > 0.3 ? 'Hold α / r constant when varying r' : 'Fixed α shrinks α / r when r rises',
        -825,
        198,
        26,
        hs > 0.3 ? COSMOS.emerald : COSMOS.amber,
        'sans',
        'left',
      ),
      txt(
        nn > 0.3 ? 'Measure update norms + held-out eval' : 'Track rank and scale together',
        -825,
        236,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right 2D vector geometry plane
      line(pt(-1.4, 0), pt(4.6, 0), { stroke: '#3a4c78', width: 2.5 }),
      line(pt(0, -0.7), pt(0, 3.8), { stroke: '#3a4c78', width: 2.5 }),
      // Fixed dashed line of rank-1 direction
      line(pt(-0.8, -0.49), pt(4.2, 2.55), {
        stroke: COSMOS.gold,
        width: 2,
        dash: [8, 6],
      }).opacity(0.65),
      arrow(pt(0, 0), pt(v1[0], v1[1]), { stroke: COSMOS.gold, width: 5.5, tip: 15 }).glow(
        10,
        COSMOS.gold,
      ),
      glowDot(pt(v1[0], v1[1])[0], pt(v1[0], v1[1])[1], { radius: 8, color: COSMOS.gold }),
      txt(
        'scaled dir 1',
        pt(v1[0], v1[1])[0] + 110,
        pt(v1[0], v1[1])[1] + 32,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    if (rr > 0.08) {
      nodes.push(
        arrow(pt(v1[0], v1[1]), pt(sumV[0], sumV[1]), {
          stroke: COSMOS.cyan,
          width: 5,
          tip: 14,
        })
          .glow(10, COSMOS.cyan)
          .opacity(rr),
        arrow(pt(0, 0), pt(sumV[0], sumV[1]), {
          stroke: COSMOS.emerald,
          width: 5.5,
          tip: 15,
        })
          .glow(11, COSMOS.emerald)
          .opacity(rr),
        glowDot(pt(sumV[0], sumV[1])[0], pt(sumV[0], sumV[1])[1], {
          radius: 8,
          color: COSMOS.emerald,
          opacity: rr,
        }),
      );
      if (rr > 0.65) {
        nodes.push(
          txt('dir 2 opens plane', 835, -210, 26, COSMOS.emerald, 'mono', 'right').opacity(
            (rr - 0.65) / 0.35,
          ),
        );
      }
    }

    nodes.push(
      txt(
        nn > 0.3
          ? 'Actual correction norm also depends on init, data, and optimizer'
          : 'Turning α scales length along the same subspace',
        345,
        428,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('strength-b1-1', () => s.play(stretchAlpha.to(1, { duration: 0.65 })));
  c.on('strength-b2-1', () => s.play(rankRise.to(1, { duration: 0.65 })));
  c.on('strength-b2-2', () => s.play(holdScale.to(1, { duration: 0.6 })));
  c.on('strength-b3-1', () =>
    s.play(showNormNote.to(1, { duration: remainDuration(c, 'strength-b3-1', 0.45) })),
  );
}
