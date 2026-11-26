// Scene 4: scores - "Who shares the denominator?"
// Pure Cinema: equal-scale glowing exponential-mass strips showing how admitting the sleeping dog
// expands the denominator and drops the puppy's softmax share from 99.7% to 57.4%.
import {
  COLORS,
  COSMOS,
  NAMES,
  ROLE,
  TAU,
  cinemaAtmosphere,
  comparisonRow,
  evaluate,
  glowTex,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  txt,
  verifyApprox,
} from '../parts.mjs';
import { poolGeometry } from '../pool.mjs';

export default function scores(s, c) {
  const rawScores = evaluate().scores;
  const all = comparisonRow(rawScores, TAU);
  const easy = comparisonRow(rawScores, TAU, 0, [true, false, true]);
  verifyApprox(easy.masses[0], all.masses[0], 1e-12, 'target keeps identical exponential weight');
  verifyApprox(all.probs[0] * 100, 57.4, 0.1, 'full-pool puppy share 57.4%');

  const pg = poolGeometry({
    query: 'Query: "A dog is running"',
    names: NAMES,
    colors: COLORS,
    scores: rawScores,
    all,
    tau: TAU,
    topY: -295,
    track1Y: 25,
    track2Y: 205,
    footY: 385,
  });

  const showMass = s.value(0);
  const showTwo = s.value(0);
  const showInitShare = s.value(0);
  const showAdmit = s.value(0);
  const showPredict = s.value(0);
  const sleeperGrow = s.value(0);
  const showAnswer = s.value(0);

  const title = heroTitle(['Who shares the denominator?'], {
    x: -850,
    y: -445,
    size: 50,
    accent: ROLE.anchor,
  });

  const massEq = glowTex('\\text{mass}_j = \\exp\\!\\left(\\frac{s_j - s_{\\max}}{\\tau}\\right)', {
    x: 420,
    y: -425,
    size: 34,
    color: ROLE.focus,
    glow: 6,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const sm = showMass.value;
    const s2 = showTwo.value;
    const is = showInitShare.value;
    const ad = showAdmit.value;
    const pr = showPredict.value;
    const sg = sleeperGrow.value;
    const an = showAnswer.value;
    const nodes = [pg.headerBar(1), pg.candidateRow({ showMass: sm > 0.3, opacity: 1 })];

    // Track 1: Puppy + sky (outline visible softly before cue so canvas stays balanced)
    nodes.push(
      pg.stripView({
        y: pg.track1Y,
        caption: 'Pool 1:  puppy runs  +  sky is blue',
        row: easy,
        masses: easy.masses,
        showSegments: s2 > 0.05,
        showResult: is > 0.05,
        opacity: s2 > 0.05 ? s2 : 0.35,
      }),
    );

    // Track 2: Admit sleeping dog (animates sleeping dog's glowing rose bar smoothly!)
    if (ad > 0.05) {
      const animMasses = [all.masses[0], all.masses[1] * sg, all.masses[2]];
      nodes.push(
        pg.stripView({
          y: pg.track2Y,
          caption: 'Pool 2:  puppy runs  +  dog sleeps  +  sky is blue',
          row: all,
          masses: animMasses,
          showSegments: sg > 0.02,
          showResult: an > 0.05,
          opacity: ad,
          captionColor: sg > 0.5 ? COSMOS.ink : ROLE.focus,
        }),
      );
    }

    // Mutually exclusive footer: formula note -> prediction question -> resolved insight
    if (an > 0.05) {
      nodes.push(
        pg.footerLine(
          'Same puppy cosine. More mass in the denominator lowers its share.',
          ROLE.positive,
          34,
          'sans',
          an,
        ),
      );
    } else if (pr > 0.05) {
      nodes.push(pg.footerLine('What happens to the puppy’s share?', ROLE.focus, 40, 'serif', pr));
    } else if (sm > 0.05) {
      nodes.push(
        pg.footerLine(
          'Subtract max score -> highest candidate always contributes 1.000 unit of mass',
          COSMOS.muted,
          30,
          'mono',
          sm,
        ),
      );
    } else {
      nodes.push(
        pg.footerLine(
          'Cosines stay fixed. Watch how candidate membership changes the softmax share.',
          COSMOS.muted,
          30,
          'sans',
          1,
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, massEq, stageLayer);

  playAfter(s, c, 'scores-mass', (d) => showMass.to(1, { duration: d }), 0.5);
  playOn(s, c, 'scores-two', (d) => showTwo.to(1, { duration: d }), 0.55);
  playAfter(s, c, 'scores-initial-share', (d) => showInitShare.to(1, { duration: d }), 0.45);
  playOn(s, c, 'scores-admit', (d) => showAdmit.to(1, { duration: d }), 0.55);
  playOn(s, c, 'scores-predict', (d) => showPredict.to(1, { duration: d }), 0.45);
  playOn(s, c, 'scores-new-mass', (d) => sleeperGrow.to(1, { duration: d }), 0.85);
  playAfter(
    s,
    c,
    'scores-answer',
    (d) => [showPredict.to(0, { duration: d * 0.35 }), showAnswer.to(1, { duration: d })],
    0.55,
  );
}
