// Scene 15: What can the reranker read? (BERT cross-encoder joint attention, truncation & shortlist depth)
import {
  COSMOS,
  CRED_JOINT_SCORES,
  CRED_PASSAGE_NAMES,
  aura,
  credReranked,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function jointReranker(s, c) {
  const phase = s.value(0);
  const showJoint = s.value(0);
  const showMatrix = s.value(0);
  const showTrim = s.value(0);
  const showTwo = s.value(0);
  const showAsk = s.value(0);
  const showWiden = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Can the', 'Reranker Read?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CROSS-ENCODER RERANKING · JOINT ATTENTION · TRUNCATION · SHORTLIST DEPTH',
  });

  const toks = [
    '[CLS]',
    'rotate',
    'api',
    'key',
    '[SEP]',
    'create',
    'deploy',
    'revoke',
    'old',
    'key',
    '[SEP]',
  ];
  const top2Only = credReranked(2);
  const top3Full = credReranked(3);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sj = showJoint.value;
    const sm = showMatrix.value;
    const st = showTrim.value;
    const s2 = showTwo.value;
    const sa = showAsk.value;
    const sw = showWiden.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const trimmed = st > 0.5 && s2 < 0.3;
    const activeIds = sw > 0.4 ? top3Full : top2Only;

    const nodes = [
      // Top token ribbon showing [CLS] query [SEP] passage [SEP]
      txt(
        trimmed
          ? 'TRUNCATED TO 9 POSITIONS -> "revoke old key" DROPPED!'
          : 'JOINT PAIR SEQUENCE (12 x 12 = 144 ATTENTION CELLS -> [CLS] HEAD)',
        -855,
        -208,
        26,
        trimmed ? COSMOS.rose : COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    toks.forEach((tok, i) => {
      const cx = -780 + i * 156;
      const isDropped = trimmed && i >= 7 && i <= 9;
      const isSpecial = tok.startsWith('[');
      const isCross = tok === 'rotate' || tok === 'revoke';
      const col = isDropped
        ? COSMOS.rose
        : isSpecial
          ? COSMOS.gold
          : isCross && sj > 0.3
            ? COSMOS.emerald
            : COSMOS.cyan;
      nodes.push(
        rect(144, 58, {
          fill: isDropped ? '#2a1019' : isSpecial ? '#231e10' : '#10203a',
          stroke: col,
          width: isCross ? 2.8 : 1.8,
          radius: 10,
        })
          .at(cx, -142)
          .opacity(isDropped ? 0.45 : 0.95),
        txt(tok, cx, -140, 26, col, 'mono').opacity(isDropped ? 0.5 : 1),
      );
    });

    // Left bottom: 12x12 vs 9x9 attention grid badge + explanation
    nodes.push(
      glassCell(-465, 80, 760, 290, trimmed ? COSMOS.rose : sm > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: trimmed ? 9 * pulse : 4,
      }),
      txt('CROSS-ATTENTION COST & TRUNCATION', -820, -24, 26, COSMOS.gold, 'mono', 'left'),
      txt('· Full sequence: 12 x 12 = 144 pair cells', -820, 26, 26, COSMOS.ink, 'sans', 'left'),
      txt('· "rotate" attends directly to "revoke"', -820, 68, 26, COSMOS.emerald, 'sans', 'left'),
      txt(
        trimmed
          ? '· Budget = 9 drops tail "revoke old key"!'
          : '· Short budget keeps ID but drops tail step',
        -820,
        110,
        26,
        trimmed ? COSMOS.rose : COSMOS.amber,
        'sans',
        'left',
      ),
      txt(
        '· Every candidate passage requires a new pass',
        -820,
        154,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right bottom: Shortlist depth 2 vs 3 reranking
      txt(
        sw > 0.4 ? 'RERANKING SHORTLIST (DEPTH = 3)' : 'RERANKING SHORTLIST (DEPTH = 2)',
        110,
        -48,
        26,
        sw > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
    );

    const rows = sw > 0.4 ? activeIds : [...activeIds, 'd2'];
    rows.forEach((id, i) => {
      const y = 18 + i * 94;
      const present = sw > 0.4 || i < 2;
      const score = CRED_JOINT_SCORES[id];
      const col = !present ? COSMOS.rose : id === 'd2' ? COSMOS.emerald : COSMOS.cyan;
      nodes.push(
        glassCell(495, y, 750, 78, col, {
          fill: !present ? '#26111a' : id === 'd2' ? '#0e2824' : '#11182c',
          glow: id === 'd2' && sw > 0.4 ? 10 * pulse : 3,
        }),
        txt(
          present ? `#${i + 1} ${id} (${CRED_PASSAGE_NAMES[id]})` : `${id} (never sent!)`,
          150,
          y + 2,
          26,
          col,
          'mono',
          'left',
        ),
        meterBar(535, y + 2, 180, 24, present ? score : 0, col),
        txt(present ? score.toFixed(2) : '--', 840, y + 2, 26, col, 'mono', 'right'),
      );
    });

    nodes.push(
      glowDot(-840, 358, { radius: 6, color: sw > 0.4 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sw > 0.4
          ? 'Widening fusion cutoff to 3 sends d2 (score 0.96 -> #1) without changing any other score!'
          : sa > 0.3
            ? 'Dense found d2 earlier: where would you change the pipeline to give d2 a chance?'
            : 'Rerankers can only promote passages that actually reach their input shortlist',
        -812,
        360,
        28,
        sw > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('joint-input', () => s.play(showJoint.to(0.4, { duration: 0.35 })));
  c.on('joint-attention', () => s.play(showJoint.to(0.75, { duration: 0.35 })));
  c.on('joint-head', () => s.play(showJoint.to(1, { duration: 0.35 })));
  c.on('joint-matrix', () => s.play(showMatrix.to(0.6, { duration: 0.35 })));
  c.on('joint-total', () => s.play(showMatrix.to(1, { duration: 0.35 })));
  c.on('joint-trim', () => s.play(showTrim.to(0.6, { duration: 0.4 })));
  c.on('joint-tail', () => s.play(showTrim.to(1, { duration: 0.4 })));
  c.on('joint-two', () => s.play(showTwo.to(0.5, { duration: 0.35 })));
  c.on('joint-score-two', () => s.play(showTwo.to(1, { duration: 0.35 })));
  c.on('joint-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('joint-widen', () => s.play(showWiden.to(0.5, { duration: 0.4 })));
  c.on('joint-new-pair', () => s.play(showWiden.to(0.8, { duration: 0.35 })));
  c.on('joint-third', () =>
    s.play(showWiden.to(1, { duration: remainDuration(c, 'joint-third', 0.45) })),
  );
}
