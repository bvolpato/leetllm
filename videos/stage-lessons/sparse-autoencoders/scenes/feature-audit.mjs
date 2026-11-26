// Scene 14: feature-audit - "What explains the gap between these requests?"
// Prediction finale scene (ZERO bullet cards / ZERO namedBox!):
// Beat 0: Visual Pythia null-model baseline comparison (Trained vs Randomized parallel gauges).
// Beat 1: Glowing 3-orb Natural Language Autoencoder round-trip pipeline (activation -> text -> rebuild).
// Beat 2: Visual held-out multilingual & behavioral control split (translation + legitimate vs unauthorized).
// Beats 3-7: Pure Cinema dual request meters ("Reset my password" vs "Reset my password now",
//            S = x1 + 2x2), adding emerald residual [0, 0.10] (1.70 vs 3.70, gap 2.00), strictly
//            withholding both causal prediction outcomes (without credential -> gap stays 2.00;
//            without urgency -> gap closes to 0.00)!
import { arrow, assertEqual, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
  vec,
} from '../parts.mjs';
import { cinemaRequestMeters, resetState } from '../reset-example.mjs';

const WEIGHTS = [1, 2];
const ERROR = 0.1;

export default function featureAudit(s, c) {
  const atmo = cinemaAtmosphere(ROLE.first, ROLE.second);
  const title = heroTitle(['What explains the gap', 'between these requests?'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.mark,
  });

  // --- Beat 0: Visual Pythia Null-Model Baseline Comparison (Trained vs Randomized bars) ---
  const candBadge = txt(
    'Proposed label:  "credential"',
    0,
    -250,
    46,
    ROLE.first,
    'serif',
    'center',
  ).glow(8, ROLE.first);

  const trainedGrp = [
    txt('Trained Pythia', -560, -110, 36, ROLE.other, 'sans', 'left'),
    lumBar(-340, -25, 440, 32, { color: ROLE.other, fillOpacity: 0.42, strokeWidth: 2.2, glow: 8 }),
    txt('Explanation score', -560, 26, 26, COSMOS.muted, 'sans', 'left'),
    lumBar(-360, 105, 400, 32, { color: ROLE.first, fillOpacity: 0.42, strokeWidth: 2.2, glow: 8 }),
    txt('Reconstruction fidelity', -560, 156, 26, COSMOS.muted, 'sans', 'left'),
  ];

  const randGrp = [
    txt('Randomized Pythia (null)', 110, -110, 36, ROLE.mark, 'sans', 'left'),
    lumBar(320, -25, 420, 32, { color: ROLE.mark, fillOpacity: 0.36, strokeWidth: 2.2, glow: 8 }),
    txt('Similar aggregate score', 110, 26, 26, ROLE.mark, 'sans', 'left'),
    lumBar(305, 105, 390, 32, { color: ROLE.amber, fillOpacity: 0.36, strokeWidth: 2.2, glow: 8 }),
    txt('Similar reconstruction', 110, 156, 26, ROLE.amber, 'sans', 'left'),
    rule(0, -140, 0, 200, COSMOS.rule, 2).opacity(0.6),
    txt(
      'Null-model baselines test whether metrics beat random structure',
      0,
      290,
      30,
      COSMOS.ink,
      'sans',
      'center',
    ),
  ];

  s.add(atmo, title, candBadge, ...trainedGrp);
  c.show('audit-aggregate', randGrp);

  // --- Beat 1: Natural Language Autoencoder 3-Orb Orbital Pipeline ---
  const orb = (x, y, r, label, sub, col) =>
    group(
      glowRing(x, y, r, col, { width: 3.5, glow: 11, fillOpacity: 0.2 }),
      glowDot(x, y, { radius: 8, color: col, glow: 12 }),
      txt(label, x, y + r + 38, 34, col, 'sans', 'center'),
      txt(sub, x, y + r + 80, 26, COSMOS.muted, 'sans', 'center'),
    );

  const orbAct = orb(-540, 15, 68, 'Activation x', 'dense vector', ROLE.other);
  const orbTxt = orb(0, 15, 76, 'Text verbalizer', 'hypothesized words', ROLE.mark);
  const orbRec = orb(540, 15, 68, 'Reconstruction x̂', 'round-trip check', ROLE.other);
  const link1 = arrow([-445, 15], [-102, 15], { stroke: ROLE.mark, width: 4.5, tip: 16 }).glow(
    8,
    ROLE.mark,
  );
  const link2 = arrow([102, 15], [445, 15], { stroke: ROLE.other, width: 4.5, tip: 16 }).glow(
    8,
    ROLE.other,
  );
  const nlaWarn = txt(
    'Readable words can invent details: test behavior independently',
    0,
    275,
    30,
    ROLE.mark,
    'sans',
    'center',
  );

  c.swap('audit-verbalize', [...trainedGrp, ...randGrp], [orbAct, link1, orbTxt]);
  c.show('audit-roundtrip', [link2, orbRec, nlaWarn]);

  // --- Beat 2: Held-out Translation & Behavioral Control Probes ---
  const transGrp = [
    txt('Held-out semantic probes', -470, -105, 32, ROLE.other, 'sans', 'center'),
    txt('"Reset my password"', -470, -20, 34, COSMOS.ink, 'serif', 'center'),
    txt('"Réinitialise mon mot de passe"', -470, 50, 32, ROLE.other, 'serif', 'center').glow(
      6,
      ROLE.other,
    ),
    txt(
      'Check translations, format shifts, weak & silent hits',
      -470,
      130,
      26,
      COSMOS.muted,
      'sans',
      'center',
    ),
  ];
  const behGrp = [
    rule(0, -135, 0, 175, COSMOS.rule, 2).opacity(0.6),
    txt('Matched behavioral controls', 470, -105, 32, ROLE.residual, 'sans', 'center'),
    glowDot(170, -20, { radius: 8, color: ROLE.residual, glow: 10 }),
    txt('Legitimate reset succeeds?', 196, -20, 32, ROLE.residual, 'sans', 'left'),
    glowDot(170, 50, { radius: 8, color: ROLE.wrong, glow: 10 }),
    txt('Unauthorized reset declined?', 196, 50, 32, ROLE.wrong, 'sans', 'left'),
    txt(
      'Measure outcomes, not just surface phrasing',
      470,
      130,
      26,
      COSMOS.muted,
      'sans',
      'center',
    ),
  ];
  const hookFoot = txt(
    'Test at the original checkpoint, hook & token positions',
    0,
    285,
    30,
    ROLE.mark,
    'mono',
    'center',
  );

  c.swap('audit-heldout', [orbAct, link1, orbTxt, link2, orbRec, nlaWarn], [...transGrp, hookFoot]);
  c.show('audit-behavior', behGrp);

  // --- Beats 3-7: Dual-Request Causal Audit Meters (strict prediction withholding!) ---
  const blue = s.value(1);
  const pink = s.value(1);
  const residual = s.value(0);
  const read = (i) => resetState(i, { blue: blue.value, pink: pink.value, error: residual.value });
  const scoresOf = (changes) =>
    [0, 1].map((i) =>
      Number(vec.dot(resetState(i, { error: ERROR, ...changes }).activation, WEIGHTS).toFixed(2)),
    );
  const baseline = scoresOf({});
  assertEqual(baseline, [1.7, 3.7], 'baseline refusal scores');
  assertEqual(scoresOf({ blue: 0 }), [0.2, 2.2], 'scores without credential');
  assertEqual(scoresOf({ pink: 0 }), [1.7, 1.7], 'scores without urgency');

  const meters = cinemaRequestMeters({
    read,
    weights: WEIGHTS,
    max: 4,
    quantity: 'Toy refusal score   S = x₁ + 2x₂',
    original: baseline,
  });
  const rows = meters.rows.flatMap((r) => [...r.base, r.input, r.stack, r.end]);
  const legend = meters.legend(true);
  const ghosts = meters.rows.map((r) => r.previous);

  const resNote = meters.caption('Add the same green residual  [0, 0.10]  to both', ROLE.residual);
  const askBlue = meters.caption(
    'Remove blue [1.50, 0] from both. What happens to the gap?',
    ROLE.mark,
  );
  const fallNote = meters.caption('Both scores fall by 1.50  (gap stays 2.00)', ROLE.first);
  const rewindNote = meters.caption('Restore both original activations', COSMOS.muted);
  const askPink = meters.caption('Remove urgency only. What gap remains?', ROLE.mark);

  const gapWithout = (changes) => {
    const [p, u] = scoresOf(changes);
    return (u - p).toFixed(2);
  };
  const finalVerdict = [
    txt(
      `Gap without credential:  ${gapWithout({ blue: 0 })}`,
      -340,
      meters.footerY,
      36,
      ROLE.first,
      'mono',
      'center',
    ).glow(7, ROLE.first),
    txt(
      `Gap without urgency:  ${gapWithout({ pink: 0 })}`,
      340,
      meters.footerY,
      36,
      ROLE.second,
      'mono',
      'center',
    ).glow(8, ROLE.second),
  ];

  c.swapAll('audit-pair', [meters.headText, ...rows, ...legend], { keep: [atmo, title] });
  c.show('audit-residual', resNote);
  playCue(s, c, 'audit-residual', (d) => s.play(residual.to(ERROR, { duration: d })), { dur: 1.2 });
  c.show('audit-gap', meters.gap);

  c.swap('audit-predict', resNote, askBlue);
  c.hide('audit-minus-blue', askBlue, { lead: 0 });
  c.show('audit-minus-blue', ghosts);
  playCue(s, c, 'audit-minus-blue', (d) => s.play(blue.to(0, { duration: d })), { dur: 1.55 });
  c.show('audit-fall', fallNote, { after: true });

  c.swap('audit-rewind', fallNote, rewindNote);
  playCue(s, c, 'audit-rewind', (d) => s.play(blue.to(1, { duration: d })), { dur: 1.05 });
  c.swap('audit-pink-question', rewindNote, askPink);

  c.hide('audit-minus-pink', askPink, { lead: 0 });
  c.on('audit-meet', () =>
    s.play(
      pink.to(0, {
        duration: Math.max(0.3, c.cue('audit-verdict').end - c.cue('audit-meet').start),
      }),
    ),
  );
  c.show('audit-verdict', finalVerdict, { after: true });
}
