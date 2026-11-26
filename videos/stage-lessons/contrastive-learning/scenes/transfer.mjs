// Scene 28: transfer - "Back at the caption archive"
// Pure Cinema: returns to the opening dog archive using cinemaCaptionMatch. Switching the archive's
// purpose from action to animal reverses the sleeping dog's score derivative (+2.121 -> -0.379).
import {
  COLORS,
  COSMOS,
  ROLE,
  TAU,
  cinemaAtmosphere,
  comparisonRow,
  evaluate,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';
import { cinemaCaptionMatch } from '../caption-match.mjs';

export default function transfer(s, c) {
  const row = comparisonRow(evaluate().scores, TAU);
  const target = 0.5;
  const newDeriv = (row.probs[1] - target) / TAU;
  verifyApprox(row.gradients[1], 2.121, 0.002, 'old sleeping dog derivative +2.121');
  verifyApprox(newDeriv, -0.379, 0.002, 'multi-positive sleeping dog derivative -0.379');

  const byAnimal = s.value(0);
  const showAsk = s.value(0);
  const linkSecond = s.value(0);
  const showOld = s.value(0);
  const showNew = s.value(0);

  const title = heroTitle(['Back at the caption archive:', 'when relevance changes'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.positive,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const ani = byAnimal.value;
    const ask = showAsk.value;
    const l2 = linkSecond.value;
    const oldD = showOld.value;
    const newD = showNew.value;
    const activeLinks = [{ index: 0, color: ROLE.positive, opacity: 1 }];
    if (l2 > 0.05) {
      activeLinks.push({ index: 1, color: ROLE.positive, opacity: l2 });
    }
    const curColors = [ROLE.positive, l2 > 0.5 ? ROLE.positive : ROLE.competitor, ROLE.unrelated];

    const nodes = [
      cinemaCaptionMatch({
        queryX: -530,
        queryY: -10,
        laneX: 90,
        laneYs: [-185, 5, 195],
        shares: row.probs,
        colors: curColors,
        activeLinks,
        ruleTitle: ani > 0.5 ? 'Rule: Index by animal' : 'Rule: Match the action',
        ruleSub: ani > 0.5 ? 'Find every clip with a dog in it.' : 'Find footage of a dog running.',
      }),
      txt('ORIGINAL SOFTMAX SHARES  (τ = 0.20)', 335, -265, 26, COSMOS.muted, 'mono', 'center'),
      rule(-850, 305, 850, 305, COSMOS.rule, 1.6).opacity(0.55),
    ];

    // Mutually exclusive bottom readout (strictly withholds answer before cue!)
    if (newD > 0.05) {
      nodes.push(
        txt(
          `Mean-log target = ½  ->  ∂L/∂s_sleeper = ${newDeriv.toFixed(3)}   ->   descent RAISES its score`,
          0,
          375,
          34,
          ROLE.positive,
          'mono',
          'center',
        )
          .glow(8, ROLE.positive)
          .opacity(newD),
      );
    } else if (oldD > 0.05) {
      nodes.push(
        txt(
          `Old single target = 0  ->  ∂L/∂s_sleeper = +${row.gradients[1].toFixed(3)}   ->   hides a clip the editor wants!`,
          0,
          375,
          34,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(7, ROLE.competitor)
          .opacity(oldD),
      );
    } else if (ask > 0.05) {
      nodes.push(
        txt(
          'Which other caption should now count as an answer?',
          0,
          375,
          38,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(ask),
      );
    } else {
      nodes.push(
        txt(
          'Same query, same three captions, same cosine scores (sleeping dog holds 42.4%)',
          0,
          375,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, stageLayer);

  playOn(s, c, 'transfer-purpose', (d) => byAnimal.to(1, { duration: d }), 0.5);
  playOn(s, c, 'transfer-which', (d) => showAsk.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'transfer-sleeper', (d) => linkSecond.to(1, { duration: d }), 0.55);
  playAfter(
    s,
    c,
    'transfer-old',
    (d) => [showAsk.to(0, { duration: d * 0.35 }), showOld.to(1, { duration: d })],
    0.45,
  );
  playAfter(
    s,
    c,
    'transfer-new',
    (d) => [showOld.to(0, { duration: d * 0.35 }), showNew.to(1, { duration: d })],
    0.55,
  );
}
