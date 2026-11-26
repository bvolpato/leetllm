// Scene 15: false-negatives - "One guide in two batch columns"
// Pure Cinema: equal-scale denominator strips showing two identical copies of an API rotation guide
// competing in one row (+2.463 repulsive gradient on copy B), then smoothly masking B out -> 97.1%!
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  comparisonRow,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../parts.mjs';
import { poolGeometry } from '../pool.mjs';

export default function falseNegatives(s, c) {
  const scores = [0.8, 0.8, 0.1];
  const tau = 0.2;
  const full = comparisonRow(scores, tau);
  const masked = comparisonRow(scores, tau, 0, [true, false, true]);
  verifyApprox(full.gradients[1], 2.463, 0.005, 'copy B positive derivative +2.463');
  verifyInvariant(masked.gradients[1] === 0, 'excluded copy has zero direct score derivative');

  const pg = poolGeometry({
    query: 'Query: "How do I rotate an API key?"',
    names: ['A · rotation guide', 'B · same guide (copy)', 'C · KMS guide'],
    colors: [ROLE.positive, ROLE.competitor, ROLE.unrelated],
    scores,
    all: full,
    tau,
    topY: -295,
    track1Y: 20,
    track2Y: 205,
    footY: 385,
  });

  const showTop = s.value(0);
  const showAsk = s.value(0);
  const showLower = s.value(0);
  const showGrad = s.value(0);
  const bMassKeep = s.value(1); // animates 1 -> 0 when copy B is masked!
  const showRepairedShare = s.value(0);
  const showZero = s.value(0);

  const title = heroTitle(['One guide in two columns:', 'the false-negative trap'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.competitor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const st = showTop.value;
    const ask = showAsk.value;
    const lo = showLower.value;
    const gr = showGrad.value;
    const bk = bMassKeep.value;
    const rs = showRepairedShare.value;
    const zr = showZero.value;
    const nodes = [
      pg.headerBar(1),
      pg.candidateRow({
        showMass: st > 0.3,
        opacity: 1,
        highlightIdx: lo > 0.3 && bk > 0.5 ? 1 : -1,
      }),
    ];

    // Top reference strip: all three entries compete
    nodes.push(
      pg.stripView({
        y: pg.track1Y,
        caption: 'Reference row:  target A · all three entries compete',
        row: full,
        masses: full.masses,
        showSegments: st > 0.05,
        showResult: st > 0.05,
        opacity: st > 0.05 ? st : 0.35,
      }),
    );

    // Lower working strip: animates copy B shrinking to 0 so C slides smoothly left!
    if (lo > 0.05) {
      const curMasses = [full.masses[0], full.masses[1] * bk, full.masses[2]];
      const isMasked = bk < 0.25;
      nodes.push(
        pg.stripView({
          y: pg.track2Y,
          caption: isMasked
            ? 'Repaired row:  target A · copy B masked out (cosine stays visible)'
            : 'Working row:  copy B competes against A',
          row: isMasked ? masked : full,
          masses: curMasses,
          showSegments: true,
          showResult: rs > 0.05,
          opacity: lo,
          captionColor: isMasked ? ROLE.positive : ROLE.competitor,
        }),
      );
    }

    // Mutually exclusive footer (A8: always true for current state!)
    if (zr > 0.05) {
      nodes.push(
        pg.footerLine(
          `Masked B: ∂L/∂score = 0   ·   loss ${full.loss.toFixed(4)} -> ${masked.loss.toFixed(4)} nats`,
          ROLE.positive,
          34,
          'mono',
          zr,
        ),
      );
    } else if (gr > 0.05) {
      nodes.push(
        pg.footerLine(
          `Before masking B: ∂L/∂s_B = ${full.probs[1].toFixed(4)} / 0.20 = +${full.gradients[1].toFixed(3)}  ->  pushes B DOWN`,
          ROLE.competitor,
          32,
          'mono',
          gr,
        ),
      );
    } else if (lo > 0.05) {
      nodes.push(
        pg.footerLine(
          'Descent tries to lower the score of copy B (a true answer!).',
          ROLE.competitor,
          34,
          'sans',
          lo,
        ),
      );
    } else if (ask > 0.05) {
      nodes.push(
        pg.footerLine(
          'Will a step of gradient descent try to raise or lower B’s score?',
          ROLE.focus,
          38,
          'serif',
          ask,
        ),
      );
    } else {
      nodes.push(
        pg.footerLine(
          'A and B are identical copies of the approved rotation guide (both score 0.800)',
          COSMOS.muted,
          30,
          'sans',
          1,
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.competitor, ROLE.positive), title, stageLayer);

  playOn(s, c, 'duplicate-columns', (d) => showTop.to(1, { duration: d }), 0.55);
  playOn(s, c, 'duplicate-predict', (d) => showAsk.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'duplicate-lower',
    (d) => [showAsk.to(0, { duration: d * 0.35 }), showLower.to(1, { duration: d })],
    0.55,
  );
  playAfter(s, c, 'duplicate-direction', (d) => showGrad.to(1, { duration: d }), 0.45);
  playOn(s, c, 'duplicate-mask', (d) => bMassKeep.to(0, { duration: d }), 1.25);
  playAfter(s, c, 'duplicate-new-share', (d) => showRepairedShare.to(1, { duration: d }), 0.5);
  playAfter(s, c, 'duplicate-zero', (d) => showZero.to(1, { duration: d }), 0.5);
}
