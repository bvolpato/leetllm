// Scene 20: Where did the missing probability go? (100-tile probability mass grid + 3D constant-odds simplex + withheld loss)
import {
  COSMOS,
  UNSEEN_END,
  UNSEEN_START,
  aura,
  buildUnseenSimplex3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  prefLerp,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function unseenProbability(s, c) {
  const phase = s.value(0);
  const sKey = s.value(0);
  const sOdds = s.value(0);
  const sMove = s.value(0);
  const sAnswer = s.value(0);
  const sPair = s.value(0);

  const bgAura = aura(430, 20, 560, '#3c1b2a28', '#14385c20');
  const simplex3d = buildUnseenSimplex3d(phase, sMove, { x: 465, y: -15 });

  const title = heroTitle(['Where Did the Missing', 'Probability Go?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'UNSEEN RESPONSE BLIND SPOT · CONSTANT 4:1 ODDS & FLAT DPO LOSS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ky = Math.max(0.75, sKey.value);
    const od = sOdds.value;
    const mv = sMove.value;
    const an = sAnswer.value;
    const np = sPair.value;

    const transferredCols = Math.round(mv * 8); // 0 -> 8 columns flipped to unseen C
    const pA = prefLerp(40, 8, mv);
    const pB = prefLerp(10, 2, mv);
    const pC = prefLerp(50, 90, mv);

    const nodes = [
      txt(
        '100 TILES = 100% GENERATION MASS (1 TILE = 1%)',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // 10 columns x 10 rows grid on left half: x in [-830, -250], y in [-160, 250]
    const gx0 = -820;
    const gy0 = -152;
    const stepX = 62;
    const stepY = 40;
    for (let col = 0; col < 10; col++) {
      const convertedToC = col >= 10 - transferredCols;
      for (let row = 0; row < 10; row++) {
        // Columns 0..9 originally have: rows 0..3 = A (4 tiles), row 4 = B (1 tile), rows 5..9 = C (5 tiles)
        const kind = convertedToC ? 'C' : row < 4 ? 'A' : row === 4 ? 'B' : 'C';
        const fill = kind === 'A' ? '#125444' : kind === 'B' ? '#15466d' : '#5e1a32';
        const stroke = kind === 'A' ? COSMOS.emerald : kind === 'B' ? COSMOS.cyan : COSMOS.rose;
        nodes.push(
          rect(52, 32, { fill, stroke, width: 1.6, radius: 5 })
            .at(gx0 + col * stepX, gy0 + row * stepY)
            .opacity(ky),
        );
      }
    }

    // Legend & counts directly below grid (left-anchored inside safe margin!)
    nodes.push(
      txt(
        `A Ticket ${pA.toFixed(0)}% · B Grant ${pB.toFixed(0)}% · C Unseen ${pC.toFixed(0)}%`,
        -855,
        262,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        od > 0.2
          ? 'A / B odds = 4:1 (uniform ref, only A > B labeled)'
          : 'Only A > B is in the file; C is unjudged',
        -855,
        314,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      // Right 3D header + withheld DPO loss box
      txt('3D SIMPLEX · GOLD RAIL = CONSTANT 4:1 ODDS', 465, -365, 26, COSMOS.gold, 'mono'),

      glassCell(465, 315, 810, 174, an > 0.5 ? COSMOS.rose : COSMOS.amber, {
        fill: an > 0.5 ? '#29101a' : '#1b1710',
        dash: an > 0.5 ? undefined : [10, 6],
        glow: 9 * pulse,
      }),
      txt(
        an > 0.5
          ? `LOSS IDENTICAL: ${UNSEEN_END.loss.toFixed(3)} (8/2 = 40/10 = 4!)`
          : mv > 0.4
            ? 'Moved to (8, 2, 90): does DPO loss change? [ ? ]'
            : `STORED DPO LOSS (beta=0.1) = ${UNSEEN_START.loss.toFixed(3)}`,
        465,
        276,
        26,
        an > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt(
        np > 0.3
          ? 'FIX: sample live replies & add NEW pair A > C!'
          : an > 0.5
            ? 'Unseen C takes 90% at the exact same DPO loss'
            : mv > 0.4
              ? 'Compare 8 tickets / 2 grants against 40 / 10'
              : 'Vote A > B depends on relative A/B odds',
        465,
        344,
        26,
        np > 0.3 ? COSMOS.emerald : COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, simplex3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, simplex3d, { theta: -0.22, phi: 0.92 });

  c.on('mass-key', () => s.play(sKey.to(1, { duration: remainDuration(c, 'mass-key', 0.45) })));
  c.on('mass-odds', () => s.play(sOdds.to(1, { duration: remainDuration(c, 'mass-odds', 0.5) })));
  c.on('mass-move', () => s.play(sMove.to(1, { duration: remainDuration(c, 'mass-move', 1.35) })));
  c.after('mass-answer', () =>
    s.play(sAnswer.to(1, { duration: remainAfterDuration(c, 'mass-answer', 0.5) })),
  );
  c.on('mass-new-pair', () =>
    s.play(sPair.to(1, { duration: remainDuration(c, 'mass-new-pair', 0.55) })),
  );
}
