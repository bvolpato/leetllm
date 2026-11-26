// Scene 07 (lexical-counterexample): "What did the search terms match?"
// Orbiting 3D BM25-vs-Dense Hybrid / RRF score surface paired with glowing lexical overlap bars
// (7 vs 2 -> concealed "?" on paraphrase -> 0 vs 0 strictly withheld until after `pr-score-zero`),
// alphabetical tie trap vs glowing minTerms >= 2 laser gate, and MathJax RRF equation.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RUN,
  buildHybridSurface3d,
  callerTag,
  cinemaAtmosphere,
  glowTex,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  retrieve,
  runPhase,
  tweenCue,
  txt,
  zeroScoreFixture,
} from '../parts.mjs';

export default function lexicalCounterexample(s, c) {
  const replay = zeroScoreFixture();
  const matches = retrieve(replay.query, RUN.caller);

  const phase = s.value(0);
  const showWorked = s.value(0); // reveals 7 and 2 after `pr-scores`
  const paraphraseMode = s.value(0); // 0 = worked query, 1 = paraphrase query
  const showZero = s.value(0); // reveals 0 and 0 strictly after `pr-score-zero`
  const showFalse = s.value(0); // reveals alphabetical tie eligible trap
  const showGate = s.value(0); // draws minTerms >= 2 laser cutoff line
  // 3D query coordinates: worked query (high lex, high dense) -> paraphrase (low lex, high dense)
  const qLex = s.value(1.8);
  const qDense = s.value(1.65);

  const { view: surf3d } = buildHybridSurface3d(() => [qLex.value, qDense.value], {
    x: 455,
    y: 55,
  });

  const title = heroTitle(['What Did the', 'Search Terms Match?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'LEXICAL OVERLAP · HYBRID RRF SURFACE',
  });

  const rrfEq = glowTex(
    '\\text{RRF}(d) = \\frac{1}{k + r_{\\text{lex}}} + \\frac{1}{k + r_{\\text{dense}}}',
    {
      x: 455,
      y: -315,
      size: 36,
      color: ROLE.focus,
      glow: 7,
    },
  );

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sw = showWorked.value;
    const pm = paraphraseMode.value;
    const sz = showZero.value;
    const sf = showFalse.value;
    const sg = showGate.value;

    const nodes = [callerTag(1)];

    // Query display (clean discrete swap: worked query vs paraphrase)
    const isPara = pm > 0.5;
    nodes.push(
      lumBar(-435, -185, 845, 118, {
        color: isPara ? ROLE.focus : ROLE.request,
        fillAlpha: 0.09,
        strokeWidth: 2.2,
        glow: 7,
        radius: 14,
      }),
      txt(
        isPara ? 'PARAPHRASED QUERY' : "LUNA'S QUERY",
        -830,
        -214,
        26,
        isPara ? ROLE.focus : ROLE.request,
        'mono',
        'left',
      ),
      txt(isPara ? replay.query : RUN.query, -830, -162, 28, COSMOS.ink, 'sans', 'left'),
    );

    // Lexical term-overlap glowing bar arena (left lower-mid)
    const baseY = 240;
    const maxH = 220;
    const maxScore = 7;
    const barXs = [-630, -250];
    const barLabels = ['eu-key-v2 (key rule)', 'eu-session-v1 (sessions)'];
    const barCols = [ROLE.policy, ROLE.session];

    nodes.push(
      line([-835, baseY], [-35, baseY], { stroke: COSMOS.muted, width: 2.6 }),
      txt('DISTINCT SHARED TERMS', -835, -88, 26, COSMOS.muted, 'mono', 'left'),
    );

    // State 1: Worked query (scores 7 and 2)
    if (!isPara) {
      const scores = [RUN.hits[0].score, RUN.hits[1].score];
      scores.forEach((sc, i) => {
        const h = Math.max(8, (sc / maxScore) * maxH * sw);
        nodes.push(
          lumBar(barXs[i], baseY - h * 0.5, 180, h, {
            color: barCols[i],
            fillAlpha: 0.45,
            strokeWidth: 2.4,
            glow: 9,
            radius: 8,
            opacity: Math.max(0.25, sw),
          }),
          txt(barLabels[i], barXs[i], baseY + 38, 26, barCols[i], 'sans', 'center'),
        );
        if (sw > 0.4) {
          nodes.push(
            txt(String(sc), barXs[i], baseY - h - 28, 40, barCols[i], 'mono', 'center')
              .glow(8, barCols[i])
              .opacity(sw),
          );
        }
      });
    } else {
      // State 2: Paraphrase query - strictly withhold "0" until `showZero > 0.4`!
      barXs.forEach((bx, i) => {
        nodes.push(
          lumBar(bx, baseY - 6, 180, 12, {
            color: sz > 0.4 ? ROLE.danger : ROLE.focus,
            fillAlpha: 0.35,
            strokeWidth: 2.2,
            glow: 7,
            radius: 4,
          }),
          txt(barLabels[i], bx, baseY + 38, 26, barCols[i], 'sans', 'center'),
          txt(
            sz > 0.4 ? '0' : '?',
            bx,
            baseY - 122,
            46,
            sz > 0.4 ? ROLE.danger : ROLE.focus,
            'mono',
            'center',
          ).glow(10 * pulse, sz > 0.4 ? ROLE.danger : ROLE.focus),
        );
      });
    }

    // Glowing gold minimum-score threshold line (minTerms = 2)
    if (sg > 0.05) {
      const cutY = baseY - (2 / maxScore) * maxH;
      nodes.push(
        line([-835, cutY], [-35, cutY], {
          stroke: ROLE.focus,
          width: 4.0,
          dash: [12, 8],
        })
          .glow(10 * pulse, ROLE.focus)
          .opacity(sg),
        txt('MIN SCORE >= 2 TERMS', -835, cutY - 26, 26, ROLE.focus, 'mono', 'left')
          .glow(6, ROLE.focus)
          .opacity(sg),
      );
    }

    // 3D surface caption
    nodes.push(
      txt(
        isPara
          ? 'Paraphrase: low lexical, high dense alignment'
          : 'Hybrid surface lifts paraphrases above zero lexical',
        455,
        350,
        26,
        isPara ? ROLE.focus : COSMOS.muted,
        'sans',
        'center',
      ),
    );

    // Discrete bottom verdict (zero overlap)
    let footText = 'Shared-word count ignores which clock "days" measures';
    let footCol = COSMOS.muted;
    if (sg > 0.5) {
      footText = `Gate >= 2 shared terms  ->  ${matches.length} passages returned (missed paraphrase)`;
      footCol = ROLE.focus;
    } else if (sf > 0.5) {
      footText = 'Alphabetical tie-break picks eu-key-v2  ->  false "eligible"!';
      footCol = ROLE.danger;
    } else if (sz > 0.5) {
      footText = 'Zero shared terms for both passages';
      footCol = ROLE.danger;
    } else if (isPara) {
      footText = 'How many words does this paraphrase share with either passage?';
      footCol = ROLE.focus;
    }
    nodes.push(
      txt(footText, -855, 415, 32, footCol, isPara && sz < 0.5 ? 'serif' : 'mono', 'left').glow(
        footCol !== COSMOS.muted ? 7 : 0,
        footCol,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.violet), surf3d, title, rrfEq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, surf3d, { theta: 0.35, phi: 0.96 });

  tweenCue(s, c, 'pr-scores', showWorked, 1, { after: true, dur: 0.6 });
  playCue(
    s,
    c,
    'pr-zero',
    (d) => s.play(paraphraseMode.to(1, { duration: 0.08 }), qLex.to(-1.7, { duration: d })),
    { dur: 0.85 },
  );
  tweenCue(s, c, 'pr-score-zero', showZero, 1, { after: true, dur: 0.45 });
  tweenCue(s, c, 'pr-false-answer', showFalse, 1, { after: true, dur: 0.45 });
  tweenCue(s, c, 'pr-gate', showGate, 1, { after: true, dur: 0.55 });
}
