// Scene 11: Would you accept this merge?: Value ruler comparing broken (42.36), equal-vote (28.66), and exact (32.41) merges.
import {
  BROKEN_MERGE_OUTPUT,
  COSMOS,
  DENSE_OUTPUT,
  EQUAL_VOTE_OUTPUT,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

const X0 = -760;
const X1 = 760;
const RULER_Y = 30;
const mapVal = (v) => X0 + ((v - 8) / (46 - 8)) * (X1 - X0);

export default function generalizedMerge(s, c) {
  const phase = s.value(0);
  const showBroken = s.value(0);
  const fixedBroken = s.value(0);
  const showEqual = s.value(0);
  const showTrueShares = s.value(0);
  const showGeneral = s.value(0);

  const bgAura = aura(0, 30, 560, '#ff6b8b1e', '#5ce1e618');
  const title = heroTitle(['Check Every', 'Merge Rule'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ONLINE SOFTMAX · INVARIANCE',
  });

  const eqGeneral = glowTex(
    String.raw`m = \max(m_A,m_B),\quad \alpha = e^{m_A-m},\;\beta = e^{m_B-m},\quad o = \frac{\alpha \mathbf{N}_A + \beta \mathbf{N}_B}{\alpha \ell_A + \beta \ell_B}`,
    { x: 0, y: 345, size: 32, color: COSMOS.gold },
  );

  const live = guardedDynamic(1, () => {
    const sb = showBroken.value;
    const fb = fixedBroken.value;
    const eq = showEqual.value;
    const ts = showTrueShares.value;

    const x10 = mapVal(10);
    const x40 = mapVal(40);
    const xDense = mapVal(DENSE_OUTPUT);
    const brokenX = mapVal(BROKEN_MERGE_OUTPUT + (DENSE_OUTPUT - BROKEN_MERGE_OUTPUT) * fb);
    const equalX = mapVal(EQUAL_VOTE_OUTPUT);

    const nodes = [
      // Convex hull band [10, 40]
      rect(x40 - x10, 54, { fill: '#102436', stroke: COSMOS.cyan, width: 1.6, radius: 8 })
        .at((x10 + x40) * 0.5, RULER_Y)
        .opacity(0.65),
      line([X0, RULER_Y], [X1, RULER_Y], { stroke: '#465885', width: 2.8 }),
      txt('VALID VALUE RANGE [10, 40]', (x10 + x40) * 0.5, RULER_Y + 62, 26, COSMOS.cyan, 'mono'),
    ];

    for (const tick of [10, 20, 30, 40, 45]) {
      const tx = mapVal(tick);
      nodes.push(
        line([tx, RULER_Y - 16], [tx, RULER_Y + 16], { stroke: '#5c72a6', width: 2.2 }),
        txt(String(tick), tx, RULER_Y + 106, 26, COSMOS.muted, 'mono'),
      );
    }

    // Dense reference marker
    nodes.push(
      glowDot(xDense, RULER_Y, { radius: 10, color: COSMOS.cyan }),
      txt(`Dense ${DENSE_OUTPUT.toFixed(2)}`, xDense, RULER_Y - 58, 28, COSMOS.cyan, 'mono').glow(
        6,
        COSMOS.cyan,
      ),
    );

    // Candidate 1: Broken merge (only rescales denominator) -> slides back to dense on fix
    if (sb > 0.02) {
      const col = fb > 0.5 ? COSMOS.emerald : COSMOS.rose;
      const curVal = BROKEN_MERGE_OUTPUT + (DENSE_OUTPUT - BROKEN_MERGE_OUTPUT) * fb;
      nodes.push(
        glowDot(brokenX, RULER_Y, { radius: 11, color: col, opacity: sb }),
        txt(
          fb > 0.5 ? `Repaired ${curVal.toFixed(2)}` : `Broken ${curVal.toFixed(2)} (OUTSIDE!)`,
          brokenX,
          RULER_Y - 115,
          28,
          col,
          'mono',
        )
          .glow(7, col)
          .opacity(sb),
      );
    } else {
      // During prediction beat 0 before reveal
      nodes.push(
        glassCell(295, -270, 960, 128, COSMOS.rose, { fill: '#1a1020', glow: 8 }),
        txt('Broken: rescales ℓ, leaves N = 23.68 untouched', 295, -296, 26, COSMOS.rose, 'mono'),
        txt(
          'Where does (23.68 + 40) / 1.503 land on [10, 40]?',
          295,
          -244,
          28,
          COSMOS.gold,
          'sans',
        ),
      );
    }

    // Candidate 2: Equal 50/50 tile vote
    if (eq > 0.02) {
      nodes.push(
        glowDot(equalX, RULER_Y, { radius: 10, color: COSMOS.amber, opacity: eq }),
        txt(
          `50/50 avg ${EQUAL_VOTE_OUTPUT.toFixed(2)}`,
          equalX,
          RULER_Y - 172,
          28,
          COSMOS.amber,
          'mono',
        )
          .glow(6, COSMOS.amber)
          .opacity(eq),
      );
    }

    if (ts > 0.02) {
      nodes.push(
        glassCell(295, -270, 980, 118, COSMOS.emerald, { fill: '#0e2326', glow: 8, opacity: ts }),
        txt(
          'Tile 2 holds ~2/3 weight → weight by each tile share',
          295,
          -270,
          26,
          COSMOS.emerald,
          'mono',
        ).opacity(ts),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('broken-ratio', () => s.play(phase.to(2, { duration: 0.4 })));
  c.after('outside-blend', () => s.play(showBroken.to(1, { duration: 0.45 })));
  c.on('fix-ratio', () => s.play(fixedBroken.to(1, { duration: 0.9 })));
  c.on('equal-votes', () => s.play(showEqual.to(0.4, { duration: 0.35 })));
  c.after('equal-mean', () => s.play(showEqual.to(1, { duration: 0.4 })));
  c.on('true-shares', () => s.play(showTrueShares.to(1, { duration: 0.45 })));
  c.show('general-rule', eqGeneral);
  c.on('general-sums', () => s.play(showGeneral.to(0.6, { duration: 0.35 })));
  c.on('general-divide', () =>
    s.play(showGeneral.to(1, { duration: remainDuration(c, 'general-divide', 0.45) })),
  );
}
