// Scene 22: prefix-failure - "A shorter vector can erase the deciding coordinate"
// Pure Cinema: live 2D unit circle paired with the 3x2 coordinate matrix. Slicing off d2 projects
// both [0.6, 0.8] and [0.6, -0.8] onto [1.0] (collapsing cosine -0.28 -> +1.00), plus zero-prefix guard.
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  finiteUnit,
  glowMatrix,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function prefixFailure(s, c) {
  const vecs = [
    [0.6, 0.8],
    [0.6, 0.8],
    [0.6, -0.8],
  ];
  const fullScores = [1.0, 0.6 * 0.6 + 0.8 * -0.8]; // 1.00, -0.28
  verifyApprox(fullScores[1], -0.28, 1e-12, 'full cosine with distractor');
  verifyApprox(finiteUnit([0.6])[0], 1.0, 1e-12, '1D positive prefix renormalizes to 1');

  const showFull = s.value(0);
  const cutT = s.value(0); // animates 0 -> 1 projecting d2 -> 0 and scaling d1 -> 1.0!
  const showTie = s.value(0);
  const showZero = s.value(0);

  const title = heroTitle(['Arbitrary truncation can erase', 'the deciding coordinate'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.competitor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const sf = showFull.value;
    const ct = cutT.value;
    const st = showTie.value;
    const sz = showZero.value;
    const nodes = [];

    // Left: 2D Unit Circle showing live collapse onto x-axis as cutT: 0 -> 1
    const cx = -545;
    const cy = 25;
    const rad = 185;
    const pt = (x, y) => [cx + x * rad, cy - y * rad];

    // Interpolate displayed coordinates from full [0.6, ±0.8] -> truncated & renormalized [1.0, 0.0]
    const xCur = 0.6 + 0.4 * ct;
    const yPos = 0.8 * (1 - ct);
    const yNeg = -0.8 * (1 - ct);

    nodes.push(
      circle(rad, { fill: '#0e162b55', stroke: '#445c8f', width: 2.6 }).at(cx, cy),
      line([cx - rad - 20, cy], [cx + rad + 20, cy], { stroke: '#3c5180', width: 2.2 }),
      line([cx, cy - rad - 20], [cx, cy + rad + 20], {
        stroke: ct > 0.4 ? ROLE.competitor : '#3c5180',
        width: 2.0,
        dash: ct > 0.4 ? [7, 7] : undefined,
      }).opacity(ct > 0.4 ? 0.45 : 0.85),
      txt('d₁ (kept)', cx + rad + 30, cy, 26, ROLE.anchor, 'mono', 'left'),
      txt(
        ct > 0.4 ? 'd₂ (cut!)' : 'd₂',
        cx,
        cy - rad - 56,
        26,
        ct > 0.4 ? ROLE.competitor : COSMOS.muted,
        'mono',
        'center',
      ),
      // Vectors
      glowVector([cx, cy], pt(xCur, yPos), { color: ROLE.positive, width: 5, glow: 10 }),
      glowVector([cx, cy], pt(xCur, yNeg), { color: ROLE.competitor, width: 5, glow: 10 }),
    );

    if (ct < 0.7) {
      const lOp = 1 - ct / 0.7;
      nodes.push(
        txt(
          'match [0.6, +0.8]',
          cx + rad + 30,
          cy - rad + 26,
          26,
          ROLE.positive,
          'mono',
          'left',
        ).opacity(lOp),
        txt(
          'distractor [0.6, −0.8]',
          cx + rad + 30,
          cy + rad - 26,
          26,
          ROLE.competitor,
          'mono',
          'left',
        ).opacity(lOp),
      );
    } else {
      const cOp = (ct - 0.7) / 0.3;
      nodes.push(
        txt('ALL COLLIDE AT [1.0]', cx, cy + rad + 54, 28, ROLE.competitor, 'mono', 'center')
          .glow(7, ROLE.competitor)
          .opacity(cOp),
      );
    }

    // Right: Coordinate matrix [3 x 2] showing live column 2 masked & column 1 renormalized
    const d1Val = (0.6 + 0.4 * ct).toFixed(2);
    nodes.push(
      rule(140, -310, 140, 295, COSMOS.rule, 1.8).opacity(0.55),
      glowMatrix({
        cx: 545,
        cy: -25,
        rows: 3,
        cols: 2,
        cellW: 195,
        cellH: 88,
        gap: 14,
        values: [
          [d1Val, '+0.80'],
          [d1Val, '+0.80'],
          [d1Val, '−0.80'],
        ],
        rowLabels: ['query', 'match', 'distractor'],
        colLabels: [ct > 0.5 ? 'keep -> norm' : 'keep d₁', ct > 0.4 ? 'discarded' : 'd₂'],
        colors: [
          [ROLE.anchor, ROLE.positive],
          [ROLE.positive, ROLE.positive],
          [ROLE.competitor, ROLE.competitor],
        ],
        highlight: (_, k) => (ct > 0.5 ? k === 0 : k === 1),
        dim: (_, k) => ct > 0.4 && k === 1,
        fontSize: 34,
      }),
    );

    // Footer status strip (strictly mutually exclusive!)
    nodes.push(rule(-850, 315, 850, 315, COSMOS.rule, 1.6).opacity(0.55));
    if (sz > 0.05) {
      nodes.push(
        lumBar(-575, 385, 450, 56, {
          color: ROLE.competitor,
          fillAlpha: 0.24,
          glow: 8,
          radius: 10,
          opacity: sz,
        }),
        txt('[0, 1] -> [0] (norm = 0)', -575, 385, 26, ROLE.competitor, 'mono', 'center').opacity(
          sz,
        ),
        txt(
          'Reject zero prefixes before cosine norm · train nested widths',
          -315,
          385,
          28,
          ROLE.focus,
          'sans',
          'left',
        ).opacity(sz),
      );
    } else if (st > 0.05) {
      nodes.push(
        txt(
          '1D prefix cosines:  match +1.00   /   distractor +1.00   ·   distinction erased!',
          0,
          385,
          36,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(8, ROLE.competitor)
          .opacity(st),
      );
    } else if (sf > 0.05) {
      nodes.push(
        txt(
          'Full 2D cosines:  match +1.00   /   distractor −0.28   (clearly separated)',
          0,
          385,
          36,
          ROLE.positive,
          'mono',
          'center',
        )
          .glow(6, ROLE.positive)
          .opacity(sf),
      );
    } else {
      nodes.push(
        txt(
          'Coordinate d₂ carries the entire sign flip between match and distractor',
          0,
          385,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, stageLayer);

  playAfter(s, c, 'cl-prefix-failure-full', (d) => showFull.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-prefix-failure-cut', (d) => cutT.to(1, { duration: d }), 1.35);
  playAfter(s, c, 'cl-prefix-failure-tie', (d) => showTie.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-prefix-failure-zero', (d) => showZero.to(1, { duration: d }), 0.55);
}
