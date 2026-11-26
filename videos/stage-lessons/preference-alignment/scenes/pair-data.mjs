// Scene 24: The label owns the prompt and both response boundaries (Prompt-group holdout split + opposite votes + coverage)
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pairData(s, c) {
  const phase = s.value(0);
  const sRow = s.value(0);
  const sSplitNote = s.value(0);
  const sGroupMove = s.value(0);
  const sCover = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#2e1a4a18');
  const title = heroTitle(['The Label Owns the Prompt', '& Both Response Boundaries'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'COMPARISON DATA CONTRACT · PROMPT-GROUP SPLITS & DISAGREEMENT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rw = Math.max(0.75, sRow.value);
    const mv = sGroupMove.value;
    const cv = sCover.value;

    // Two P7 rows glide together from TRAIN (-455) to HELD OUT (+455); P1 stays in TRAIN
    const xP7 = prefLerp(-455, 455, mv);
    const xP1 = -455;

    const nodes = [
      // Zone headers & vertical divider
      txt('TRAIN SPLIT', -455, -214, 28, COSMOS.cyan, 'mono'),
      txt('HELD-OUT PROMPTS', 455, -214, 28, COSMOS.gold, 'mono'),
      line([0, -225], [0, 175], { stroke: COSMOS.rule, width: 2.6, dash: [8, 6] }),

      // Tuple 1: P7, gen g0, A > B
      glassCell(xP7, -118, 720, 96, COSMOS.emerald, { fill: '#0e2624', glow: 6, opacity: rw }),
      txt('PROMPT P-7  ·  A vs B  ·  gen g0', xP7 - 325, -138, 26, COSMOS.ink, 'mono', 'left'),
      txt('VOTE: A > B  (kept separate)', xP7 - 325, -96, 26, COSMOS.emerald, 'mono', 'left'),

      // Tuple 2: P7, gen g1, B > A (opposite vote preserved, moves WITH P7!)
      glassCell(xP7, 4, 720, 96, COSMOS.rose, { fill: '#28101a', glow: 6, opacity: rw }),
      txt('PROMPT P-7  ·  A vs B  ·  gen g1', xP7 - 325, -16, 26, COSMOS.ink, 'mono', 'left'),
      txt('VOTE: B > A  (genuine uncertainty)', xP7 - 325, 26, 26, COSMOS.rose, 'mono', 'left'),

      // Tuple 3: P1, gen g2, A > B (stays in train)
      glassCell(xP1, 126, 720, 96, COSMOS.cyan, { fill: '#0f2138', glow: 5, opacity: rw }),
      txt('PROMPT P-1  ·  A vs B  ·  gen g2', xP1 - 325, 106, 26, COSMOS.ink, 'mono', 'left'),
      txt('VOTE: A > B   (stays in train split)', xP1 - 325, 148, 26, COSMOS.cyan, 'mono', 'left'),

      // Right ghost hint before move
      ...(mv < 0.3
        ? [
            glassCell(455, -56, 720, 160, COSMOS.dim, {
              fill: '#101524',
              dash: [10, 6],
              glow: 2,
              opacity: 0.72,
            }),
            txt('SPLIT BY PROMPT GROUP', 455, -78, 28, COSMOS.gold, 'mono'),
            txt('All P-7 comparisons move together', 455, -28, 26, COSMOS.muted, 'sans'),
          ]
        : []),

      // Bottom product behavior coverage strip
      glassCell(0, 314, 1680, 154, cv > 0.2 ? COSMOS.gold : COSMOS.dim, {
        fill: '#13192b',
        glow: cv > 0.2 ? 9 * pulse : 4,
      }),
      txt(
        'COVER REAL PRODUCT BEHAVIORS:  REFUSALS  ·  TOOL USE  ·  REASONING  ·  STYLE  ·  POLICY',
        0,
        282,
        26,
        cv > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'mono',
      ),
      txt(
        sSplitNote.value > 0.2 && cv < 0.2
          ? 'Split by prompt group for unseen-prompt generalization; keep eval responses out of train'
          : 'More votes measure disagreement without fixing a vague rubric; inspect live generations for new failures',
        0,
        344,
        26,
        COSMOS.ink,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pair-data-b0', () =>
    s.play(sRow.to(1, { duration: remainDuration(c, 'pair-data-b0', 0.45) })),
  );
  c.on('pair-data-b1', () =>
    s.play(sSplitNote.to(1, { duration: remainDuration(c, 'pair-data-b1', 0.45) })),
  );
  c.on('pa-data-groups', () =>
    s.play(sGroupMove.to(1, { duration: remainDuration(c, 'pa-data-groups', 0.95) })),
  );
  c.on('pair-data-b2', () =>
    s.play(sCover.to(1, { duration: remainDuration(c, 'pair-data-b2', 0.55) })),
  );
}
