// Scene 17 (metric-choice): "Which arrow points closer to the query?"
// Raw dot product (long release arrow wins 8 vs 1) -> L2 normalization onto unit circle -> billing wins on cosine + ||u-v||^2 = 2 - 2 u·v!
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  aura,
  glowArrow,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const DOC_BILL = [1.0, 0.2]; // small norm (~1.02), tight angle -> cos ~ 0.981
const DOC_REL = [8.0, 6.0]; // norm 10, wider angle -> dot 8, cos = 0.800
const NORM_BILL = Math.hypot(...DOC_BILL);
const NORM_REL = Math.hypot(...DOC_REL);
const UNIT_BILL = [DOC_BILL[0] / NORM_BILL, DOC_BILL[1] / NORM_BILL];
const UNIT_REL = [DOC_REL[0] / NORM_REL, DOC_REL[1] / NORM_REL];

export default function metricChoice(s, c) {
  const phase = s.value(0);
  const showDot = s.value(0);
  const showInvalid = s.value(0);
  const normAmt = s.value(0); // 0 = raw dot view, 1 = unit circle cosine view
  const showAsk = s.value(0);
  const showWinner = s.value(0);
  const showIdentity = s.value(0);
  const showContract = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['Dot Product vs', 'Cosine Similarity'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: QUERY_COLOR,
    eyebrow: 'MAGNITUDE VS DIRECTION',
  });

  const eqId = glowTex('\\|\\hat{u} - \\hat{v}\\|^2 = 2 - 2\\,(\\hat{u} \\cdot \\hat{v})', {
    x: 470,
    y: 235,
    size: 38,
    color: COSMOS.cyan,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const nm = normAmt.value;
    const isUnit = nm > 0.5;
    const xMax = 9.0 - 7.6 * nm;
    const yMax = 6.8 - 5.3 * nm;
    const plot = makePlot(-815, -170, 820, 425, { x: [-0.2, xMax], y: [-0.3, yMax] });
    const orig = plot.pt([0, 0]);

    const billVec = [
      DOC_BILL[0] + (UNIT_BILL[0] - DOC_BILL[0]) * nm,
      DOC_BILL[1] + (UNIT_BILL[1] - DOC_BILL[1]) * nm,
    ];
    const relVec = [
      DOC_REL[0] + (UNIT_REL[0] - DOC_REL[0]) * nm,
      DOC_REL[1] + (UNIT_REL[1] - DOC_REL[1]) * nm,
    ];
    const qVec = [1.0, 0.0];

    const nodes = [
      ...plot.axesNodes(0.8),
      txt(
        isUnit ? 'UNIT-NORMALIZED DIRECTIONS (||v|| = 1)' : 'RAW VECTOR SPACE (DOT PRODUCT)',
        -815,
        -240,
        26,
        isUnit ? COSMOS.emerald : QUERY_COLOR,
        'mono',
        'left',
      ),
    ];

    // Unit circle arc when normalized
    if (nm > 0.35) {
      const rPx = plot.px(1) - orig[0];
      nodes.push(
        glowRing(orig[0], orig[1], rPx, COSMOS.rule, {
          width: 2.2,
          dash: [8, 6],
          glow: 4,
          opacity: (nm - 0.35) / 0.65,
        }),
      );
    }

    const qTip = plot.pt(qVec);
    const bTip = plot.pt(billVec);
    const rTip = plot.pt(relVec);

    nodes.push(
      glowArrow(orig, qTip, QUERY_COLOR, { width: 4.5 }),
      txt('Query (1, 0)', qTip[0], qTip[1] + 48, 26, QUERY_COLOR, 'mono'),
      glowArrow(orig, bTip, COSMOS.emerald, { width: 4.2 }),
      txt('Duplicate charge', bTip[0] + 42, bTip[1] - 12, 26, COSMOS.emerald, 'mono', 'left'),
      glowArrow(orig, rTip, COSMOS.violet, { width: 4.2 }),
      txt('Release page', rTip[0] - 10, rTip[1] - 32, 26, COSMOS.violet, 'mono', 'right'),
    );

    // Right side: score bars (Dot product vs Cosine)
    const rx = 120;
    nodes.push(
      txt(
        isUnit ? 'COSINE SCORES (UNIT VECTORS)' : 'RAW DOT PRODUCTS',
        rx,
        -235,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('Duplicate charge:', rx, -155, 28, COSMOS.emerald, 'sans', 'left'),
      lumBar(
        rx + (isUnit ? UNIT_BILL[0] * 260 : 45) / 2,
        -100,
        isUnit ? UNIT_BILL[0] * 260 : 45,
        40,
        { color: COSMOS.emerald, fillOpacity: 0.78, glow: 8 },
      ),
      txt(
        isUnit
          ? showWinner.value > 0.5
            ? `cos = ${UNIT_BILL[0].toFixed(3)}  (WINNER!)`
            : 'cos = ?'
          : 'dot = 1.0',
        rx + (isUnit ? UNIT_BILL[0] * 260 : 45) + 18,
        -100,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * Math.max(showDot.value, showWinner.value)),

      txt('Release page:', rx, -15, 28, COSMOS.violet, 'sans', 'left'),
      lumBar(
        rx + (isUnit ? UNIT_REL[0] * 260 : 360) / 2,
        40,
        isUnit ? UNIT_REL[0] * 260 : 360,
        40,
        { color: COSMOS.violet, fillOpacity: 0.72, glow: 8 },
      ),
      txt(
        isUnit
          ? showWinner.value > 0.5
            ? `cos = ${UNIT_REL[0].toFixed(3)}`
            : 'cos = ?'
          : 'dot = 8.0 (8× longer!)',
        rx + (isUnit ? UNIT_REL[0] * 260 : 360) + 18,
        40,
        28,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * Math.max(showDot.value, showWinner.value)),
    );

    if (showInvalid.value > 0.02 && showWinner.value < 0.4) {
      nodes.push(
        txt(
          'Guard: reject ||v|| = 0 or NaN before dividing!',
          rx,
          130,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        ).opacity(showInvalid.value * Math.max(0, 1 - showWinner.value * 2.6)),
      );
    }

    // Non-overlapping prediction -> winner -> contract along bottom
    const askOp = showAsk.value * Math.max(0, 1 - showWinner.value * 2.6);
    if (askOp > 0.02) {
      nodes.push(
        txt(
          'On the unit circle, which document points closer to the query?',
          -855,
          345,
          32,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(askOp),
      );
    }
    const winOp = Math.max(0, (showWinner.value - 0.45) / 0.55);
    if (winOp > 0.02) {
      nodes.push(
        txt(
          showContract.value > 0.5
            ? 'Use ONE metric & normalization across indexing, routing, and evaluation!'
            : 'Duplicate-charge wins on cosine (0.981 vs 0.800); unit L2 & cosine agree identically!',
          -855,
          345,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(winOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.0);

  tweenCue(s, c, 'dot', showDot, 1, { duration: 0.45 });
  tweenCue(s, c, 'invalid', showInvalid, 1, { duration: 0.45 });
  tweenCue(s, c, 'cosine', normAmt, 1, { duration: 0.9 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'winner', showWinner, 1, { duration: 0.45, after: true });
  c.show('identity', eqId);
  tweenCue(s, c, 'identity', showIdentity, 1, { duration: 0.45 });
  tweenCue(s, c, 'contract', showContract, 1, { duration: 0.45 });
}
